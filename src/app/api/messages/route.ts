import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateConversation } from '@/lib/chatValidation';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 30;
  const skip = (page - 1) * limit;

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }

  try {
    // 1. Run centralized validation
    const { conversation, otherUser, currentUser } = await validateConversation(userId, conversationId);

    // 2. Fetch messages (ordered ASC as per chat flow)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    // 3. Mark unread messages as read (where receiver is current user)
    // Wrap in try-catch to not block the GET if this fails
    try {
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          isRead: false
        },
        data: { isRead: true }
      });
    } catch (readError) {
      console.error('Failed to update read receipts:', readError);
    }

    // 4. Calculate chat metadata for plan limits
    // instructions say: FREE -> max 10 messages per conversation
    const messageCount = await prisma.message.count({
      where: {
        conversationId,
        senderId: userId
      }
    });

    const isFree = currentUser.plan?.toLowerCase() === 'free';
    const messageLimit = 10;
    const canSendMore = !isFree || messageCount < messageLimit;

    return NextResponse.json({
      messages,
      otherUser: {
        id: otherUser.id,
        fullName: otherUser.profile?.fullName,
        photo: otherUser.profile?.photos ? JSON.parse(otherUser.profile.photos)[0] : null
      },
      pagination: {
        page,
        limit,
        count: messages.length
      },
      chatMeta: {
        canSendMore,
        messagesUsed: messageCount,
        messageLimit: isFree ? messageLimit : Infinity
      }
    });

  } catch (error: any) {
    console.error('GET Messages Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}
