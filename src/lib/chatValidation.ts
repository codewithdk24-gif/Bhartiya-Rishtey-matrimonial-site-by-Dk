import { prisma } from './prisma';
import { isBlocked } from './safety';

/**
 * Shared validation for Chat APIs
 * Ensures users can only chat if:
 * 1. Conversation exists and they are part of it
 * 2. Interest is ACCEPTED
 * 3. Neither user has blocked the other
 */
export async function validateConversation(userId: string, conversationId: string) {
  if (!userId || !conversationId) {
    throw new Error('Unauthorized');
  }

  // 1. Fetch conversation with interest and block checks
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      interest: true,
      user1: {
        select: { id: true, name: true, plan: true, profile: { select: { fullName: true, photos: true } } }
      },
      user2: {
        select: { id: true, name: true, plan: true, profile: { select: { fullName: true, photos: true } } }
      }
    }
  });

  if (!conversation) {
    const error: any = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }

  // 2. User is part of conversation?
  const isUser1 = conversation.user1Id === userId;
  const isUser2 = conversation.user2Id === userId;

  if (!isUser1 && !isUser2) {
    const error: any = new Error('Access denied');
    error.status = 403;
    throw error;
  }

  const otherUser = isUser1 ? conversation.user2 : conversation.user1;
  const currentUser = isUser1 ? conversation.user1 : conversation.user2;

  // 3. Linked interest status = ACCEPTED
  if (conversation.interest.status !== 'ACCEPTED') {
    const error: any = new Error('Interest not accepted yet');
    error.status = 403;
    throw error;
  }

  // 4. Block check (both directions)
  if (await isBlocked(userId, otherUser.id)) {
    const error: any = new Error('CONVERSATION_UNAVAILABLE');
    error.status = 403;
    throw error;
  }

  return {
    conversation,
    currentUser,
    otherUser,
    otherUserId: otherUser.id
  };
}
