import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // @ts-ignore
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: { select: { id: true, name: true, profile: { select: { profilePhoto: true } } } },
        user2: { select: { id: true, name: true, profile: { select: { profilePhoto: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formatted = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      const unreadCount = conv._count.messages;

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          photo: otherUser.profile?.profilePhoto,
        },
        lastMessage: lastMessage?.content || "No messages yet",
        lastMessageTime: lastMessage?.createdAt || conv.createdAt,
        unreadCount,
      };
    });

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("Get Conversations Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
