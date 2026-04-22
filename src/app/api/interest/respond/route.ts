import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { MessageType } from "@prisma/client";
import { ErrorResponses } from "@/lib/errors";
import { logger, generateRequestId, logAction } from "@/lib/logger";
import { getIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const ip = getIp(request);
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return ErrorResponses.unauthorized(requestId);
    }

    const userId = session.user.id;
    const { interestId, action } = await request.json();

    if (!interestId || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // 1. Verify interest exists and is addressed to current user
    const interest = await prisma.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      return NextResponse.json({ error: "Interest not found" }, { status: 404 });
    }

    if (interest.toUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (interest.status !== "PENDING") {
      return NextResponse.json({ error: "Interest already processed" }, { status: 400 });
    }

    // 2. Handle Action in Transaction
    const result = await prisma.$transaction(async (tx) => {
      if (action === "ACCEPT") {
        // Update status
        const updated = await tx.interest.update({
          where: { id: interestId },
          data: { status: "ACCEPTED" },
        });

        // Create Conversation
        const conversation = await tx.conversation.create({
          data: {
            user1Id: interest.fromUserId,
            user2Id: interest.toUserId,
            interestId: interest.id,
          },
        });

        // Create System Message
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: interest.toUserId, // Could be system, but here receiver is sender of "Accept"
            receiverId: interest.fromUserId as string,
            content: "Interest Accepted! You can now chat with each other.",
            type: MessageType.SYSTEM,
          },
        });

        // Notify Sender
        createNotification({
          userId: interest.fromUserId,
          fromUserId: userId,
          type: "INTEREST_ACCEPTED",
          message: "Your interest was accepted!",
          link: `/chat/${conversation.id}`,
        });

        return { status: "ACCEPTED", conversationId: conversation.id };
      } else {
        // Update status
        await tx.interest.update({
          where: { id: interestId },
          data: { status: "REJECTED" },
        });

        // Notify Sender
        createNotification({
          userId: interest.fromUserId,
          fromUserId: userId,
          type: "INTEREST_REJECTED",
          message: "Your interest was declined.",
          link: "/dashboard#outgoing",
        });

        return { status: "REJECTED" };
      }
    });

    logAction({
      userId: userId,
      ip,
      action: `INTEREST_${action}`,
      status: "SUCCESS",
      details: `Responded to interest ${interestId} for user ${interest.fromUserId}`
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error("API_RESPOND_INTEREST_ERROR", error, { requestId });
    return ErrorResponses.internalError(requestId);
  }
}
