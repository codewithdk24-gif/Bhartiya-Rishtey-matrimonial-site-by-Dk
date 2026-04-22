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

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // 1. Get the profile ID of the target user
    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId }
    });

    if (!targetProfile) {
      return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
    }

    // 2. Toggle Shortlist
    const existing = await prisma.shortlist.findUnique({
      where: {
        userId_profileId: {
          userId,
          profileId: targetProfile.id,
        },
      },
    });

    if (existing) {
      await prisma.shortlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      await prisma.shortlist.create({
        data: {
          userId,
          profileId: targetProfile.id,
        },
      });
      return NextResponse.json({ favorited: true });
    }

  } catch (error) {
    console.error("Favorite Toggle Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
