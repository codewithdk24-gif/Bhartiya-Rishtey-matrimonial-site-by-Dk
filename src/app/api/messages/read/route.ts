import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateConversation } from '@/lib/chatValidation';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // 1. Validate access
    await validateConversation(userId, conversationId);

    // 2. Mark all messages received by the current user in this conversation as read
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ 
      success: true, 
      count: updated.count 
    });

  } catch (error: any) {
    console.error('READ Messages Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}
