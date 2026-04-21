import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET: List all users blocked by the current user
 */
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profilePhoto: true,
                fullName: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(blockedUsers.map(b => b.blocked));
  } catch (error) {
    console.error('GET Block List Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Block a user
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { userId: targetId } = await request.json();

    if (!targetId) {
      return NextResponse.json({ error: 'Target User ID required' }, { status: 400 });
    }

    if (userId === targetId) {
      return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
    }

    // 1. Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: targetId }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already blocked' });
    }

    // 3. Create block and cancel interests in a transaction
    await prisma.$transaction([
      prisma.block.create({
        data: { blockerId: userId, blockedId: targetId }
      }),
      // Withdraw pending interests (both directions)
      prisma.interest.updateMany({
        where: {
          OR: [
            { fromUserId: userId, toUserId: targetId },
            { fromUserId: targetId, toUserId: userId }
          ],
          status: 'PENDING'
        },
        data: { status: 'WITHDRAWN' }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST Block Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Unblock a user
 */
export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { userId: targetId } = await request.json();

    if (!targetId) {
      return NextResponse.json({ error: 'Target User ID required' }, { status: 400 });
    }

    await prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: targetId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE Block Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
