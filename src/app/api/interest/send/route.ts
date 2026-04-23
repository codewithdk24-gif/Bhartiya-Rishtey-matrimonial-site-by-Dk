import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isBlocked } from "@/lib/safety";
import { getReportStatus } from "@/lib/report";
import { getPlanLimits, getUpgradeError } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fromUserId = session.user.id;
    const { toUserId } = await request.json();

    if (!toUserId) {
      return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
    }

    // 0. Check if current user is restricted
    const { isRestricted } = await getReportStatus(fromUserId);
    if (isRestricted) {
      return NextResponse.json({ 
        error: "Your account is temporarily restricted from sending interests due to multiple community reports.",
        isRestricted: true 
      }, { status: 403 });
    }

    // 1. Cannot send to self
    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot send interest to yourself" }, { status: 400 });
    }

    // 2. Check if already sent
    const existingInterest = await prisma.interest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId, toUserId },
      },
    });

    if (existingInterest) {
      return NextResponse.json({ error: "Interest already sent to this user" }, { status: 409 });
    }

    // 3. Check if blocked (either way)
    if (await isBlocked(fromUserId, toUserId)) {
      return NextResponse.json({ error: "Unable to send interest" }, { status: 403 });
    }

    // 4. Check plan limit
    const user = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { plan: true, _count: { select: { interestsSent: true } } },
    });

    const limits = getPlanLimits(user?.plan || 'FREE');
    
    if (user && user._count.interestsSent >= limits.interestLimit) {
      return NextResponse.json(
        getUpgradeError("unlimited_interests", "PRIME"),
        { status: 403 }
      );
    }

    // 5. Create Interest and Notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const interest = await tx.interest.create({
        data: {
          fromUserId,
          toUserId,
          status: "PENDING",
        },
      });

      // Fire-and-forget notification
      createNotification({
        userId: toUserId,
        fromUserId,
        type: "INTEREST_RECEIVED",
        message: "You have a new interest",
        link: "/interests",
      });

      return interest;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Send Interest Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
