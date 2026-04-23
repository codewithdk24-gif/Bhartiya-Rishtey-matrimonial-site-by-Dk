import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InterestStatus } from "@prisma/client";
import { getPlanLimits } from "@/lib/plans";
import { ErrorResponses } from "@/lib/errors";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return ErrorResponses.unauthorized(requestId);
    }

    const userId = session.user.id;

    // Fetch current user plan
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const userPlan = (currentUser?.plan || 'FREE').toUpperCase();

    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get("type"); // "received" | "sent" | null
    const status = searchParams.get("status") as InterestStatus | null;

    async function getInterests(interestType: "received" | "sent") {
      const where: any = {};
      if (interestType === "received") {
        where.toUserId = userId;
      } else {
        where.fromUserId = userId;
      }
      if (status) where.status = status;

      const interests = await prisma.interest.findMany({
        where,
        include: {
          conversation: { select: { id: true } },
          fromUser: { select: { id: true, name: true, profile: { select: { city: true, state: true, profilePhoto: true, dateOfBirth: true, religion: true, photos: true, profession: true } } } },
          toUser: { select: { id: true, name: true, profile: { select: { city: true, state: true, profilePhoto: true, dateOfBirth: true, religion: true, photos: true, profession: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      return interests.map(interest => {
        const otherUser = interestType === "received" ? interest.fromUser : interest.toUser;
        const profile = otherUser?.profile;
        let age = null;
        if (profile?.dateOfBirth) {
          age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }

        let userPhoto = profile?.profilePhoto || null;
        if (!userPhoto && profile?.photos) {
          try {
            const parsed = typeof profile.photos === 'string' ? JSON.parse(profile.photos) : profile.photos;
            if (Array.isArray(parsed) && parsed.length > 0) userPhoto = parsed[0];
          } catch (e) {
            console.error("Interest API Photo Parse Error:", e);
          }
        }

        return {
          id: interest.id,
          status: interest.status,
          createdAt: interest.createdAt,
          conversationId: interest.conversation?.id,
          otherUser: {
            id: otherUser?.id,
            name: otherUser?.name || "No Name",
            city: profile?.city || "India",
            state: profile?.state || "",
            photo: userPhoto,
            age: age,
            religion: profile?.religion || "",
            profession: profile?.profession || "Not specified"
          }
        };
      });
    }

    let sent = await getInterests("sent");
    let received = await getInterests("received");

    if (type === "received") return NextResponse.json(received);
    if (type === "sent") return NextResponse.json(sent);

    return NextResponse.json({ sent, received });

  } catch (error) {
    logger.error("API_GET_INTERESTS_ERROR", error, { requestId });
    return ErrorResponses.internalError(requestId);
  }
}
