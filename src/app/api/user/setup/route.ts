import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { age, gender, city, bio, photoUrl } = body;

    // Basic validation
    if (!age || !gender || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate approximate date of birth from age
    const currentYear = new Date().getFullYear();
    const dob = new Date(currentYear - parseInt(age), 0, 1);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create profile
    await prisma.$transaction([
      prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          gender,
          city,
          bio,
          dateOfBirth: dob,
          profilePhoto: photoUrl || user.profile?.profilePhoto,
          fullName: user.name || "User", // Fallback if name is missing
          isCompleted: true
        },
        create: {
          userId: user.id,
          fullName: user.name || "User",
          gender,
          city,
          bio,
          dateOfBirth: dob,
          profilePhoto: photoUrl,
          isCompleted: true
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isProfileComplete: true }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
