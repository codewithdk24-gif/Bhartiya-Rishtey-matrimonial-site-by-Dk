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

    // Fetch interests (received and accepted)
    const interests = await prisma.interest.findMany({
      where: {
        OR: [
          { toUserId: userId },
          { fromUserId: userId, status: "ACCEPTED" }
        ]
      },
      include: {
        fromUser: { select: { id: true, name: true, profile: { select: { profilePhoto: true } } } },
        toUser: { select: { id: true, name: true, profile: { select: { profilePhoto: true } } } }
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    });

    // Fetch profile views
    const views = await prisma.profileView.findMany({
      where: { viewedId: userId },
      include: {
        viewer: { select: { id: true, name: true, profile: { select: { profilePhoto: true, city: true } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // Combine and format
    const feed: any[] = [];

    interests.forEach(i => {
      const isIncoming = i.toUserId === userId;
      const otherUser = isIncoming ? i.fromUser : i.toUser;
      
      let text = "";
      let type = "";
      
      if (i.status === "PENDING" && isIncoming) {
        text = `${otherUser.name} sent you an interest`;
        type = "interest_received";
      } else if (i.status === "ACCEPTED") {
        text = isIncoming ? `You accepted ${otherUser.name}'s interest` : `${otherUser.name} accepted your interest`;
        type = "interest_accepted";
      }

      if (text) {
        feed.push({
          id: `interest-${i.id}`,
          type,
          text,
          userId: otherUser.id,
          userName: otherUser.name,
          userPhoto: otherUser.profile?.profilePhoto,
          timestamp: i.updatedAt
        });
      }
    });

    views.forEach(v => {
      feed.push({
        id: `view-${v.id}`,
        type: "profile_view",
        text: `${v.viewer.name} from ${v.viewer.profile?.city || 'India'} viewed your profile`,
        userId: v.viewer.id,
        userName: v.viewer.name,
        userPhoto: v.viewer.profile?.profilePhoto,
        timestamp: v.createdAt
      });
    });

    // Sort by timestamp
    const sortedFeed = feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    return NextResponse.json(sortedFeed);

  } catch (error) {
    console.error("Activity Feed Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
