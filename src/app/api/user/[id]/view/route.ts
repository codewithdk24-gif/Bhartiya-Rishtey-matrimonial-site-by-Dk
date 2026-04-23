import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: viewedId } = await params;
    const viewerId = session.user.id;

    if (viewerId === viewedId) {
      return NextResponse.json({ status: "skipped_self_view" });
    }

    // Log the view
    await prisma.profileView.create({
      data: {
        viewerId,
        viewedId
      }
    });

    // Notify the viewed user (throttle: only once per hour per viewer)
    const recentView = await prisma.profileView.count({
      where: {
        viewerId,
        viewedId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });

    if (recentView <= 1) {
      try {
        await prisma.notification.create({
          data: {
            userId: viewedId,
            fromUserId: viewerId,
            type: "PROFILE_VIEWED",
            message: `${session.user.name || 'Someone'} viewed your profile`,
            link: `/profile/${viewerId}`
          }
        });
      } catch (_) {}
    }

    // Optional: Update lastActive for viewer
    await prisma.user.update({
      where: { id: viewerId },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("Profile View Logging Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
