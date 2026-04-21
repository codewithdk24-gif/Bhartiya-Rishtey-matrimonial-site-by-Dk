import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { notificationId, markAll = false } = await request.json();

    if (markAll) {
      // Mark all as read for current user
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } else if (notificationId) {
      // Mark specific notification as read
      // Ensure the notification belongs to the current user
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true }
      });
    } else {
      return NextResponse.json({ error: 'Notification ID or markAll required' }, { status: 400 });
    }

    // Return updated unread count for UI sync
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({ success: true, unreadCount });

  } catch (error) {
    console.error('PATCH Notifications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
