import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        conversation: { select: { id: true } },
        fromUser: { 
          select: { 
            id: true, 
            name: true, 
            profile: { select: { city: true, state: true, profilePhoto: true, photos: true, profession: true, dateOfBirth: true } } 
          } 
        },
        toUser: { 
          select: { 
            id: true, 
            name: true, 
            profile: { select: { city: true, state: true, profilePhoto: true, photos: true, profession: true, dateOfBirth: true } } 
          } 
        },
      },
      orderBy: { createdAt: "desc" }
    });

    const received: any[] = [];
    const sent: any[] = [];
    const matched: any[] = [];

    interests.forEach(interest => {
      const isIncoming = interest.toUserId === userId;
      const otherUser = isIncoming ? interest.fromUser : interest.toUser;
      
      let age = null;
      if (otherUser.profile?.dateOfBirth) {
        age = Math.floor((Date.now() - new Date(otherUser.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      const formatted = {
        id: interest.id,
        status: interest.status,
        timestamp: interest.createdAt,
        conversationId: interest.conversation?.id || null,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          age,
          profile: otherUser.profile
        }
      };

      if (interest.status === "ACCEPTED") {
        matched.push(formatted);
      } else if (interest.status === "PENDING") {
        if (isIncoming) {
          received.push(formatted);
        } else {
          sent.push(formatted);
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
