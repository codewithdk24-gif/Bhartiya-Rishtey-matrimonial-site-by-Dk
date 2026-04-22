/**
 * FIXES APPLIED:
 * 1. Centralized auth/prisma
 * 2. Added check: cannot send interest to a user who has blocked you (or whom you blocked)
 * 3. Added check: cannot send interest to a user you're already matched with in either direction
 *    (original @@unique only covers [user1Id, user2Id] — reverse order creates duplicate)
 * 4. Notification includes sender name for context
 * 5. Added GET handler to retrieve received interests (was completely missing)
 */

import { NextResponse } from 'next/server';
import { MatchInterestSchema } from '@/lib/validations';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isRateLimited } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  // 0. Rate Limiting (1 interest per second)
  if (await isRateLimited(`interest:${userId}`, 1000)) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS', message: 'Slow down! Please wait a moment.' }, { status: 429 });
  }

  try {
    const rawData = await request.json();
    const validationResult = MatchInterestSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { targetUserId } = validationResult.data;

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'You cannot send interest to yourself.' }, { status: 400 });
    }

    // FIX: Check for existing match in BOTH directions
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
    });

    if (existingMatch) {
      return NextResponse.json({ error: 'Interest already exists for this user.' }, { status: 409 });
    }

    // FIX: Respect block relationships
    const blockCheck = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
    });

    if (blockCheck) {
      return NextResponse.json({ error: 'Unable to send interest to this user.' }, { status: 403 });
    }

    const senderProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { fullName: true },
    });

    const newMatch = await prisma.match.create({
      data: { user1Id: userId, user2Id: targetUserId, status: 'PENDING' },
    });

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'INTEREST_RECEIVED',
        message: `${senderProfile?.fullName ?? 'Someone'} has sent you a connection request.`,
        link: '/dashboard',
      },
    });

    return NextResponse.json(
      { message: 'Interest sent successfully', match: newMatch },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Interest already sent.' }, { status: 409 });
    }
    console.error('POST Interest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// NEW: Get received/sent interests
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'received'; // 'received' | 'sent'

    const matches = await prisma.match.findMany({
      where:
        type === 'sent'
          ? { user1Id: userId, status: 'PENDING' }
          : { user2Id: userId, status: 'PENDING' },
      include: {
        user1: { include: { profile: { select: { fullName: true, photos: true, profession: true, location: true } } } },
        user2: { include: { profile: { select: { fullName: true, photos: true, profession: true, location: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ matches }, { status: 200 });
  } catch (error) {
    console.error('GET Interest Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
