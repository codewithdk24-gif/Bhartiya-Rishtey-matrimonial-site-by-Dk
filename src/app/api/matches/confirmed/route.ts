import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch mutual matches (where user is either user1 or user2)
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACTIVE'
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profilePhoto: true,
                fullName: true,
                location: true,
                city: true,
                state: true
              }
            }
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profilePhoto: true,
                fullName: true,
                location: true,
                city: true,
                state: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format results to show the "other" user
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        createdAt: match.createdAt,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          fullName: otherUser.profile?.fullName || otherUser.name,
          photo: otherUser.profile?.profilePhoto,
          location: otherUser.profile?.city || otherUser.profile?.state || otherUser.profile?.location
        }
      };
    });

    return NextResponse.json({ matches: formattedMatches });

  } catch (error) {
    console.error('API_CONFIRMED_MATCHES_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
