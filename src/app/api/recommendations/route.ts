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

    // 1. Get current user gender to find opposite
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!currentUser || !currentUser.profile) {
      return NextResponse.json({ error: "Profile incomplete" }, { status: 400 });
    }

    const targetGender = currentUser.profile.gender === "Male" ? "Female" : "Male";

    // 2. Fetch 6 recommended profiles
    const profiles = await prisma.profile.findMany({
      where: {
        gender: targetGender,
        userId: { not: userId },
        // Simple logic: Recently active or new
      },
      include: {
        user: { select: { isVerified: true, lastActive: true } }
      },
      take: 6,
      orderBy: { updatedAt: "desc" }
    });

    const results = profiles.map(p => {
        let age = 25;
        if (p.dateOfBirth) {
            age = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }

        return {
            id: p.userId,
            name: p.fullName,
            age,
            location: p.city || p.state || 'India',
            profession: p.profession || 'Professional',
            profile: {
                profilePhoto: p.profilePhoto,
                photos: p.photos
            },
            isVerified: p.user.isVerified
        };
    });

    return NextResponse.json(results);

  } catch (error) {
    console.error("Recommendations API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
