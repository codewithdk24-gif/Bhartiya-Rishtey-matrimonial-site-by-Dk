import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRelativeTime(date: Date | null): string {
  if (!date) return "Unknown";
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return "Online now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (d.toDateString() === now.toDateString()) {
      if (d.getHours() < 12) return "Active this morning";
      return "Active today";
    }
    return `Active ${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days === 1) return "Active yesterday";
  return `Active ${days}d ago`;
}

function isOnline(date: Date | null): boolean {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < 5 * 60 * 1000; // 5 min
}

function getCompatibilityScore(): number {
  return Math.floor(Math.random() * 21) + 75; // 75-95
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all interests involving this user
    const interests = await prisma.interest.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      include: {
        conversation: {
          select: {
            id: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { content: true, createdAt: true, senderId: true }
            }
          }
        },
        fromUser: { 
          select: { 
            id: true, 
            name: true,
            lastActive: true,
            profile: { select: { city: true, state: true, profilePhoto: true, photos: true, profession: true, dateOfBirth: true, religion: true } } 
          } 
        },
        toUser: { 
          select: { 
            id: true, 
            name: true,
            lastActive: true,
            profile: { select: { city: true, state: true, profilePhoto: true, photos: true, profession: true, dateOfBirth: true, religion: true } } 
          } 
        },
      },
      orderBy: { createdAt: "desc" }
    });

    const received: any[] = [];
    const sent: any[] = [];
    const matched: any[] = [];

    // Parallel processing for unread counts
    const results = await Promise.all(interests.map(async (interest) => {
      const isIncoming = interest.toUserId === userId;
      const otherUser = isIncoming ? interest.fromUser : interest.toUser;
      
      let age = null;
      if (otherUser.profile?.dateOfBirth) {
        age = Math.floor((Date.now() - new Date(otherUser.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      const lastMsg = interest.conversation?.messages?.[0] || null;

      const unreadCount = interest.conversation ? await prisma.message.count({
        where: {
          conversationId: interest.conversation.id,
          receiverId: userId,
          isRead: false
        }
      }) : 0;

      return {
        id: interest.id,
        status: interest.status,
        timestamp: interest.createdAt,
        conversationId: interest.conversation?.id || null,
        compatibilityScore: getCompatibilityScore(),
        unreadCount,
        isNewMatch: interest.status === 'ACCEPTED' && (Date.now() - new Date(interest.updatedAt).getTime() < 24 * 60 * 60 * 1000),
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          isMine: lastMsg.senderId === userId,
          createdAt: lastMsg.createdAt
        } : null,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          age,
          isOnline: isOnline(otherUser.lastActive),
          lastActiveText: getRelativeTime(otherUser.lastActive),
          profile: otherUser.profile
        },
        isIncoming
      };
    }));

    results.forEach(item => {
      if (item.status === "ACCEPTED") {
        matched.push(item);
      } else if (item.status === "PENDING") {
        if (item.isIncoming) {
          received.push(item);
        } else {
          sent.push(item);
        }
      }
    });

    return NextResponse.json({
      received,
      sent,
      matched
    });

  } catch (error) {
    console.error("Matches API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
