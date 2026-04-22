import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ErrorResponses } from "@/lib/errors";
import { logger, generateRequestId } from "@/lib/logger";

export async function GET() {
  const requestId = generateRequestId();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return ErrorResponses.unauthorized(requestId);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          select: {
            profilePhoto: true,
            photos: true,
            fullName: true,
            profession: true,
            location: true,
            isCompleted: true,
            completionPct: true
          }
        }
      }
    });

    if (!user) {
      return ErrorResponses.notFound(requestId, "User not found");
    }

    // Helper to parse photos JSON safely
    let primaryPhoto = user.profile?.profilePhoto;
    if (!primaryPhoto && user.profile?.photos) {
      try {
        const parsed = JSON.parse(user.profile.photos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          primaryPhoto = parsed[0];
        }
      } catch (e) {
        console.error("Failed to parse profile photos", e);
      }
    }

    return NextResponse.json({
      user: {
        ...session.user,
        fullName: user.profile?.fullName || user.name,
        name: user.profile?.fullName || user.name,
        profession: user.profile?.profession,
        location: user.profile?.location,
        image: primaryPhoto,
        profilePhoto: primaryPhoto,
        isProfileComplete: user.profile?.isCompleted || false,
        completionPct: user.profile?.completionPct || 0
      }
    });
  } catch (error) {
    logger.error("API_USER_ME_ERROR", error, { requestId });
    return ErrorResponses.internalError(requestId);
  }
}
