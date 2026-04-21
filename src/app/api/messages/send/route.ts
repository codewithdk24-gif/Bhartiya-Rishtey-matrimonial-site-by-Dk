import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateConversation } from '@/lib/chatValidation';
import { createNotification } from '@/lib/notifications';
import { getReportStatus } from '@/lib/report';
import { getPlanLimits, hasAccess, getUpgradeError } from '@/lib/plans';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { conversationId, content, type = 'TEXT' } = await request.json();

    // 0. Check if current user is restricted
    const { isRestricted } = await getReportStatus(userId);
    if (isRestricted) {
      return NextResponse.json({ 
        error: "Your account is temporarily restricted from sending messages due to multiple community reports.",
        isRestricted: true 
      }, { status: 403 });
    }

    // 1. Basic validation
    if (!conversationId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 chars)' }, { status: 400 });
    }

    // 2. Shared validation
    const { conversation, currentUser, otherUserId, otherUser } = await validateConversation(userId, conversationId);

    // 3. Plan Checks
    const userPlan = (currentUser.plan || 'FREE').toUpperCase();
    const limits = getPlanLimits(userPlan);
    
    // Message limit check
    const sentCount = await prisma.message.count({
      where: { conversationId, senderId: userId }
    });
    
    if (sentCount >= limits.messageLimit) {
      return NextResponse.json(
        getUpgradeError("unlimited_messages", "PRIME"),
        { status: 403 }
      );
    }

    // CONTACT_SHARE restriction
    if (type === 'CONTACT_SHARE') {
      if (!hasAccess(userPlan, "ROYAL")) {
        return NextResponse.json(
          getUpgradeError("contact_share", "ROYAL"),
          { status: 403 }
        );
      }
    }

    // 4. Create message & update conversation in a transaction
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId: otherUserId,
          content,
          type
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })
    ]);

    // 5. Create notification (Handled by fire-and-forget utility)
    createNotification({
      userId: otherUserId,
      fromUserId: userId,
      type: 'NEW_MESSAGE',
      message: `${currentUser.profile?.fullName || 'Someone'} sent you a message.`,
      link: `/chat/${conversationId}`,
    });

    return NextResponse.json(newMessage);

  } catch (error: any) {
    console.error('SEND Message Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}
