import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: { id: true, name: true, profile: { select: { profilePhoto: true, fullName: true, photos: true } } } },
        user2: { select: { id: true, name: true, profile: { select: { profilePhoto: true, fullName: true, photos: true } } } },
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return NextResponse.json({ error: "Unauthorized access to this chat" }, { status: 403 });
    }

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return NextResponse.json({
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        fullName: otherUser.profile?.fullName,
        photo: otherUser.profile?.profilePhoto,
        photos: otherUser.profile?.photos,
      }
    });

  } catch (error) {
    console.error("Get Conversation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
