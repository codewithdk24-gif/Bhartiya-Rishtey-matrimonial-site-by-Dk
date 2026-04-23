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

    // 1. Get counts for stats
    const interestsReceived = await prisma.interest.count({
      where: { toUserId: userId, status: "PENDING" }
    });

    const interestsSent = await prisma.interest.count({
      where: { fromUserId: userId }
    });

    const matches = await prisma.conversation.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }]
      }
    });

    // Profile views (assuming ProfileView model exists)
    const profileViews = await prisma.profileView.count({
      where: { viewedId: userId }
    });

    // 2. Calculate Profile Completion Percentage
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    let completionPct = 0;
    if (profile) {
      const fields = [
        profile.fullName,
        profile.bio,
        profile.profession,
        profile.city,
        profile.profilePhoto,
        profile.religion,
        profile.education
      ];
      const filledFields = fields.filter(f => f && f !== 'Unknown' && f !== 'Not specified').length;
      completionPct = Math.round((filledFields / fields.length) * 100);
    }

    return NextResponse.json({
      stats: {
        interestsReceived,
        interestsSent,
        matches,
        profileViews
      },
      completionPct,
      userName: session.user.name,
      profile: profile
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
