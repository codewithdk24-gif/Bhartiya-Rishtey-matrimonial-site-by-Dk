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
        user1: { select: { id: true, name: true, lastActive: true, profile: { select: { profilePhoto: true, fullName: true, photos: true } } } },
        user2: { select: { id: true, name: true, lastActive: true, profile: { select: { profilePhoto: true, fullName: true, photos: true } } } },
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return NextResponse.json({ error: "Unauthorized access to this chat" }, { status: 403 });
    }

    const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    // Verify they have an accepted interest (match)
    const validMatch = await prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId, status: "ACCEPTED" },
          { fromUserId: otherUserId, toUserId: userId, status: "ACCEPTED" }
        ]
      }
    });

    if (!validMatch) {
      return NextResponse.json({ error: "No accepted match found to allow chat" }, { status: 403 });
    }

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    const lastActive = (otherUser as any).lastActive as Date | null;
    const fiveMin = 5 * 60 * 1000;
    const isOnline = lastActive ? (Date.now() - new Date(lastActive).getTime() < fiveMin) : false;
    const diff = lastActive ? Date.now() - new Date(lastActive).getTime() : null;
    let lastActiveText = 'Offline';
    if (diff !== null) {
      const m = Math.floor(diff / 60000);
      if (m < 2) lastActiveText = 'Active now';
      else if (m < 60) lastActiveText = `Active ${m}m ago`;
      else { const h = Math.floor(m / 60); lastActiveText = h < 24 ? `Active ${h}h ago` : `Active ${Math.floor(h/24)}d ago`; }
    }

    return NextResponse.json({
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        fullName: otherUser.profile?.fullName,
        photo: otherUser.profile?.profilePhoto,
        photos: otherUser.profile?.photos,
        isOnline,
        lastActiveText,
      }
    });

  } catch (error) {
    console.error("Get Conversation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
