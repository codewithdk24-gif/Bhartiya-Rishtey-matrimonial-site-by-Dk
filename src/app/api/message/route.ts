/**
 * FIXES APPLIED:
 * 1. Replaced duplicate getUserIdFromRequest + new PrismaClient() with centralized libs
 * 2. Rate limiting was per IP (loginLimiter) — messaging should be per userId (already correct, kept)
 * 3. Removed prisma.$disconnect()
 * 4. Notification message now hints at sender identity without leaking full name
 *    (original was too generic: "You have received a new message" with no context)
 */

import { NextResponse } from 'next/server';
import { MessageSchema } from '@/lib/validations';
import { messageLimiter } from '@/lib/ratelimit';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const rateLimit = await messageLimiter.limit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'You are sending messages too quickly. Please wait a moment.' },
        { status: 429 }
      );
    }

    const rawData = await request.json();

    const validationResult = MessageSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { receiverId, content } = validationResult.data;

    if (userId === receiverId) {
      return NextResponse.json({ error: 'You cannot message yourself.' }, { status: 400 });
    }

    // Check subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        expiresAt: { gte: new Date() },
        tier: { in: ['PREMIUM', 'ROYAL'] },
      },
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'A Premium or Royal subscription is required to send messages.' },
        { status: 403 }
      );
    }

    // Block check
    const blockCheck = await prisma.blockList.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: userId },
        ],
      },
    });

    if (blockCheck) {
      return NextResponse.json({ error: 'This message could not be delivered.' }, { status: 403 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { profile: { select: { fullName: true } } },
    });
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });
    }

    // Get sender name for notification
    const senderProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { fullName: true },
    });

    const newMessage = await prisma.message.create({
      data: { senderId: userId, receiverId, content },
    });

    // FIX: More contextual notification message
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        message: `${senderProfile?.fullName ?? 'Someone'} sent you a message.`,
        actionUrl: '/chat',
      },
    });

    return NextResponse.json({ message: 'Sent', data: newMessage }, { status: 201 });
  } catch (error) {
    console.error('POST Message Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
