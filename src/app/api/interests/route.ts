import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InterestStatus } from "@prisma/client";
import { getPlanLimits } from "@/lib/plans";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch current user plan
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const userPlan = (currentUser?.plan || 'FREE').toUpperCase();

    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type"); // "received" | "sent"
    const status = searchParams.get("status") as InterestStatus | null;

    if (!type || !["received", "sent"].includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    const where: any = {};
    if (type === "received") {
      where.toUserId = userId;
    } else {
      where.fromUserId = userId;
    }

    if (status) {
      where.status = status;
    }

    const interests = await prisma.interest.findMany({
      where,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                city: true,
                state: true,
                profilePhoto: true,
                dateOfBirth: true,
                religion: true,
              }
            }
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                city: true,
                state: true,
                profilePhoto: true,
                dateOfBirth: true,
                religion: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response to simplify UI consumption
    const formatted = interests.map(interest => {
      const otherUser = type === "received" ? interest.fromUser : interest.toUser;
      const profile = otherUser?.profile;
      
      let age = null;
      if (profile?.dateOfBirth) {
        age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      // Apply Masking for FREE users on received interests
      const isMasked = userPlan === "FREE" && type === "received";

      return {
        id: interest.id,
        status: interest.status,
        createdAt: interest.createdAt,
        otherUser: {
          id: otherUser?.id,
          name: isMasked ? "Hidden" : otherUser?.name,
          city: isMasked ? "Hidden" : profile?.city,
          state: isMasked ? "Hidden" : profile?.state,
          photo: isMasked ? null : profile?.profilePhoto,
          age: isMasked ? null : age,
          religion: profile?.religion,
        }
      };
    });

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("Get Interests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
