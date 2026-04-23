import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isRateLimited } from '@/lib/rateLimit';
import { MessageType } from '@prisma/client';
import { ErrorResponses, createErrorResponse, ErrorCode } from '@/lib/errors';
import { logger, generateRequestId } from '@/lib/logger';
import sanitizeHtml from 'sanitize-html';

function sanitizeContent(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [], // Allow no tags
    allowedAttributes: {}, // Allow no attributes
  }).trim();
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  let userId: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logger.warn({ requestId, message: 'Unauthorized access attempt' });
      return ErrorResponses.unauthorized();
    }

    userId = session.user.id;
    const { matchId, content: rawContent } = await request.json();
    const senderId = userId;

    if (!matchId || !rawContent || typeof rawContent !== 'string') {
      logger.warn({ requestId, userId, message: 'Invalid request body' });
      return ErrorResponses.badRequest('Valid MatchId and content are required');
    }

    const content = sanitizeContent(rawContent);

    if (content.length === 0) {
      return ErrorResponses.badRequest('Message content cannot be empty or just HTML');
    }

    if (content.length > 500) {
      return ErrorResponses.badRequest('Message too long (max 500 chars)');
    }

    // 0. Rate Limiting (Prevent spam - 1 message per second)
    try {
      if (await isRateLimited(`msg:${senderId}`, 1000)) {
        return ErrorResponses.rateLimited('Please wait a second between messages.');
      }
    } catch (e: any) {
      if (e.message === 'RATE_LIMIT_SERVICE_DOWN') {
        return ErrorResponses.serviceUnavailable('Security service temporarily unavailable. Please try again.');
      }
    }

    // 1. Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: matchId },
      include: { user1: true, user2: true }
    });

    if (!conversation || (conversation.user1Id !== senderId && conversation.user2Id !== senderId)) {
      return ErrorResponses.forbidden('Invalid conversation or unauthorized');
    }

    const receiverId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;

    // 2. Save message
    const message = await prisma.message.create({
      data: {
        conversationId: matchId as string,
        senderId: senderId as string,
        receiverId: receiverId as string,
        content: content as string,
        type: MessageType.TEXT
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    logger.error('API_SEND_MESSAGE_ERROR', error, { requestId, userId });
    return createErrorResponse(
      'An unexpected error occurred',
      500,
      ErrorCode.INTERNAL_ERROR,
      null,
      requestId
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return ErrorResponses.unauthorized();

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const userId = session.user.id;

    if (!matchId) return ErrorResponses.badRequest('MatchId required');

    // 1. Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: matchId }
    });

    if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
      return ErrorResponses.forbidden();
    }

    // 2. Fetch messages
    const messages = await prisma.message.findMany({
      where: { conversationId: matchId },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('API_GET_MESSAGES_ERROR:', error);
    return ErrorResponses.internal();
  }
}
