import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  const skip = (page - 1) * limit;

  try {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    // 1. Fetch notifications with fromUser details
    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  profilePhoto: true,
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      }),
      prisma.notification.count({
        where: { userId }
      })
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('GET Notifications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
