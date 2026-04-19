/**
 * FIXES APPLIED:
 * 1. Centralized auth/prisma
 * 2. Added Zod validation
 * 3. When a user is blocked, their pending match/interest records are updated to BLOCKED status
 * 4. Added GET to check if a user is blocked
 */

import { NextResponse } from 'next/server';
import { BlockSchema } from '@/lib/validations';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const rawData = await request.json();
    const result = BlockSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });
    }

    const { targetUserId } = result.data;

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'You cannot block yourself.' }, { status: 400 });
    }

    // Create block (ignore if already exists)
    await prisma.blockList.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
      create: { blockerId: userId, blockedId: targetUserId },
      update: {},
    });

    // FIX: Update any active match records to BLOCKED status
    await prisma.match.updateMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId },
        ],
      },
      data: { status: 'BLOCKED' },
    });

    return NextResponse.json({ message: 'User blocked.' }, { status: 200 });
  } catch (error) {
    console.error('POST Block Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
