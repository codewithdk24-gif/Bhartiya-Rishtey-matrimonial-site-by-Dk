import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isRateLimited } from '@/lib/rateLimit';
import { ErrorResponses } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId } = await request.json();
    const senderId = session.user.id;

    if (!receiverId || typeof receiverId !== 'string') {
      return NextResponse.json({ error: 'Valid Receiver ID is required' }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: 'You cannot like yourself' }, { status: 400 });
    }

    // 0. Rate Limiting (Prevent rapid clicking - 1s delay)
    try {
      if (await isRateLimited(`like:${senderId}`, 1000)) {
        return ErrorResponses.rateLimited('Slow down! Please wait a moment.');
      }
    } catch (e: any) {
      if (e.message === 'RATE_LIMIT_SERVICE_DOWN') {
        return ErrorResponses.serviceUnavailable();
      }
    }

    // 1. Fetch sender plan info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { plan: true, isPremium: true }
    });

    // 2. Daily Limit Check for FREE users
    if (!sender?.isPremium && sender?.plan === 'FREE') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const likesToday = await prisma.like.count({
        where: {
          senderId,
          createdAt: { gte: dayAgo }
        }
      });

      if (likesToday >= 5) {
        return NextResponse.json({ 
          error: 'UPGRADE_REQUIRED', 
          message: 'Daily like limit reached. Upgrade to Premium for unlimited likes!',
          feature: 'unlimited_likes',
          requiredPlan: 'PRIME'
        }, { status: 403 });
      }
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Like (use upsert to avoid duplicates)
      await tx.like.upsert({
        where: {
          senderId_receiverId: {
            senderId,
            receiverId,
          },
        },
        update: {},
        create: {
          senderId,
          receiverId,
        },
      });

      // 2. Check for reverse like (reciprocity)
      const reverseLike = await tx.like.findUnique({
        where: {
          senderId_receiverId: {
            senderId: receiverId,
            receiverId: senderId,
          },
        },
      });

      // 3. If reverseLike exists → Create Match
      if (reverseLike) {
        // Sort IDs for consistent storage (ensures unique pair [A, B] always matches [A, B])
        const [user1Id, user2Id] = [senderId, receiverId].sort();

        try {
          const match = await tx.match.upsert({
            where: {
              user1Id_user2Id: {
                user1Id,
                user2Id,
              },
            },
            update: {},
            create: {
              user1Id,
              user2Id,
              status: "ACTIVE",
            },
          });

          return {
            matched: true,
            matchId: match.id,
          };
        } catch (matchError: any) {
          // Handle race condition: if match was created by a concurrent request
          if (matchError.code === 'P2002') {
            const existingMatch = await tx.match.findUnique({
              where: { user1Id_user2Id: { user1Id, user2Id } }
            });
            return {
              matched: true,
              matchId: existingMatch?.id,
            };
          }
          throw matchError;
        }
      }

      // 4. Else: Just a standard like
      return { matched: false };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('API_LIKE_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
