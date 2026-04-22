import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [], unreadCount: 0, error: 'Unauthorized' }, { status: 200 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const skip = (page - 1) * limit;

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
    console.error('[NOTIFICATIONS ERROR]', error);
    // Safe fallback to prevent frontend crash
    return NextResponse.json({ 
      notifications: [], 
      unreadCount: 0, 
      error: 'Safe fallback triggered' 
    }, { status: 200 });
  }
}
