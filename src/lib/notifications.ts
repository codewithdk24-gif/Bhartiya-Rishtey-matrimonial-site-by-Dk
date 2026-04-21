import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';
import { isBlocked } from './safety';

interface CreateNotificationData {
  userId: string;
  fromUserId?: string;
  type: NotificationType;
  message: string;
  link?: string;
}

/**
 * Creates a new notification with deduplication and auto-cleanup.
 * Wrapped in try/catch to ensure it never breaks the parent process.
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    const { userId, fromUserId, type, message, link } = data;

    // 0. Safety Check: Skip if blocked
    if (fromUserId && await isBlocked(userId, fromUserId)) {
      return null;
    }

    // 1. Deduplication for NEW_MESSAGE
    if (type === 'NEW_MESSAGE' && fromUserId) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          fromUserId,
          type: 'NEW_MESSAGE',
          isRead: false
        }
      });

      if (existing) {
        // Update existing notification instead of creating a new one
        return await prisma.notification.update({
          where: { id: existing.id },
          data: {
            message,
            createdAt: new Date(), // Bump to top
          }
        });
      }
    }

    // 2. Create new notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        fromUserId,
        type,
        message,
        link,
        isRead: false
      }
    });

    // 3. Auto-cleanup (keep max 50 per user)
    // Fire-and-forget cleanup
    cleanupNotifications(userId).catch(err => console.error('Notification Cleanup Error:', err));

    return notification;

  } catch (error) {
    console.error('Create Notification Error:', error);
    // Return null instead of throwing to prevent breaking the parent API
    return null;
  }
}

/**
 * Deletes oldest notifications if they exceed 50
 */
async function cleanupNotifications(userId: string) {
  const count = await prisma.notification.count({
    where: { userId }
  });

  if (count > 50) {
    const overflow = count - 50;
    const oldest = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: overflow,
      select: { id: true }
    });

    if (oldest.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: oldest.map(n => n.id) }
        }
      });
    }
  }
}
