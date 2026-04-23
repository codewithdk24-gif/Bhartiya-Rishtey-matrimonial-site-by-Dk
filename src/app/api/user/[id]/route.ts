import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlocked } from "@/lib/safety";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;
    const currentUserId = session.user.id;

    // 1. Safety Check: If blocked (either way)
    if (await isBlocked(currentUserId, targetId)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch User and Profile
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        lastActive: true,
        plan: true,
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Plan-based Masking
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { plan: true } });
    const userPlan = (currentUser?.plan || 'FREE').toUpperCase();
    
    let isMasked = false;
    if (userPlan === 'FREE' && user.id !== currentUserId) {
      isMasked = true;
      // Sanitize/Mask data for free users
      if (user.profile && user.profile.photos) {
        try {
          const photoArr = JSON.parse(user.profile.photos);
          if (photoArr.length > 1) {
            user.profile.photos = JSON.stringify([photoArr[0]]);
          }
        } catch (e) {}
      }
      // Hide direct contact info
      (user as any).email = null;
    }

    return NextResponse.json({ 
      user,
      isMasked 
    });

  } catch (error) {
    console.error("GET User API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
