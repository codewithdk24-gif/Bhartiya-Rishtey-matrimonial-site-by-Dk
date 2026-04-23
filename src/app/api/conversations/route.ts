import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRelativeTime(date: Date | string | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function isOnline(date: Date | null): boolean {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < 5 * 60 * 1000;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true, name: true, lastActive: true,
            profile: { select: { profilePhoto: true, photos: true, fullName: true } }
          }
        },
        user2: {
          select: {
            id: true, name: true, lastActive: true,
            profile: { select: { profilePhoto: true, photos: true, fullName: true } }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                read: false
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formatted = conversations
      .map(conv => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        const lastMsg = conv.messages[0];
        const unreadCount = conv._count.messages;

        // Resolve photo
        let photo = otherUser.profile?.profilePhoto || null;
        if (!photo && otherUser.profile?.photos) {
          try {
            const parsed = typeof otherUser.profile.photos === "string"
              ? JSON.parse(otherUser.profile.photos)
              : otherUser.profile.photos;
            if (Array.isArray(parsed) && parsed.length > 0) photo = parsed[0];
          } catch (_) {}
        }

        const sortKey = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : new Date(conv.createdAt).getTime();

        return {
          id: conv.id,
          sortKey,
          otherUser: {
            id: otherUser.id,
            name: otherUser.profile?.fullName || otherUser.name,
            photo,
            isOnline: isOnline(otherUser.lastActive),
            lastActiveText: getRelativeTime(otherUser.lastActive),
          },
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            isMine: lastMsg.senderId === userId,
            time: getRelativeTime(lastMsg.createdAt),
            rawTime: lastMsg.createdAt,
          } : null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
      // Sort by latest message descending
      .sort((a, b) => b.sortKey - a.sortKey)
      .map(({ sortKey: _, ...rest }) => rest);

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("Get Conversations Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
