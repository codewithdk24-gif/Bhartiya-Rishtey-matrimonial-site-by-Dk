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
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    // 1. Check if there's an accepted interest between them
    const interest = await prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetUserId, status: 'ACCEPTED' },
          { fromUserId: targetUserId, toUserId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    if (!interest) {
      return NextResponse.json({ error: "You must have an accepted interest to start chatting" }, { status: 403 });
    }

    // 2. Check for existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId }
        ]
      }
    });

    // 3. Create if not exists (Safety check)
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: userId,
          user2Id: targetUserId,
          interestId: interest.id
        }
      });
    }

    return NextResponse.json({ conversationId: conversation.id });

  } catch (error) {
    console.error("Chat Init Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
