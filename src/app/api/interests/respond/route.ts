import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { interestId, action } = await request.json();

    if (!interestId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const interest = await prisma.interest.findUnique({
      where: { id: interestId },
      include: { fromUser: true, toUser: true }
    });

    if (!interest) {
      return NextResponse.json({ error: "Interest not found" }, { status: 404 });
    }

    if (interest.toUserId !== userId) {
      return NextResponse.json({ error: "You can only respond to interests sent to you" }, { status: 403 });
    }

    if (interest.status !== 'PENDING') {
      return NextResponse.json({ error: "Already responded to this interest" }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

    const result = await prisma.$transaction(async (tx) => {
      const updatedInterest = await tx.interest.update({
        where: { id: interestId },
        data: { status: newStatus }
      });

      let conversationId = null;

      if (action === 'accept') {
        // Check for existing conversation
        const existingConv = await tx.conversation.findFirst({
          where: {
            OR: [
              { user1Id: interest.fromUserId, user2Id: interest.toUserId },
              { user1Id: interest.toUserId, user2Id: interest.fromUserId }
            ]
          }
        });

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          const conv = await tx.conversation.create({
            data: {
              user1Id: interest.fromUserId,
              user2Id: interest.toUserId,
              interestId: interestId,
            }
          });
          conversationId = conv.id;
        }

        await tx.notification.create({
          data: {
            userId: interest.fromUserId,
            fromUserId: userId,
            type: 'INTEREST_ACCEPTED',
            message: `${session.user.name || 'Someone'} accepted your interest! You can now start chatting.`,
            link: `/chat`
          }
        });
      }

      return { status: updatedInterest.status, conversationId };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Interest Respond Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
