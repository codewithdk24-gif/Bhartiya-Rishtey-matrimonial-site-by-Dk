import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedUserIds } from "@/lib/safety";
import { getPlanLimits } from "@/lib/plans";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get current user's profile and preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
      },
    });

    if (!currentUser || !currentUser.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const myProfile = currentUser.profile;
    const myPrefs = currentUser.preferences;

    // Opposite gender logic
    const targetGender = myProfile.gender === "Male" ? "Female" : "Male";

    // Helper to calculate score
    const calculateScore = (profile: any) => {
      let score = 0;
      
      // same religion → +20
      if (profile.religion === myProfile.religion) score += 20;
      
      // same city → +15
      if (profile.city === myProfile.city) score += 15;
      
      // same education → +10
      if (profile.education === myProfile.education) score += 10;
      
      // same state → +8
      if (profile.state === myProfile.state) score += 8;
      
      // profile has photo → +5
      if (profile.profilePhoto) score += 5;
      
      // recently active → +5 (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (profile.user.lastActive > oneDayAgo) score += 5;

      return Math.min(score, 100);
    };

    // 2. Fetch blocked users list (Bidirectional)
    const blockedIds = await getBlockedUserIds(userId);

    // Helper to build filters
    const getBaseQuery = (ageBuffer = 0, ignoreReligion = false, ignoreCaste = false) => {
      const minAge = (myPrefs?.minAge || 18) - ageBuffer;
      const maxAge = (myPrefs?.maxAge || 60) + ageBuffer;
      
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - maxAge);
      
      const maxDob = new Date();
      maxDob.setFullYear(maxDob.getFullYear() - minAge);

      const where: any = {
        userId: { 
          not: userId,
          notIn: blockedIds 
        },
        gender: targetGender,
        isCompleted: true,
        dateOfBirth: {
          gte: minDob,
          lte: maxDob,
        },
      };

      if (!ignoreReligion && myPrefs?.religions) {
        const religions = JSON.parse(myPrefs.religions);
        if (religions.length > 0) where.religion = { in: religions };
      }

      if (!ignoreCaste && myPrefs?.castes) {
        const castes = JSON.parse(myPrefs.castes);
        if (castes.length > 0) where.caste = { in: castes };
      }

      if (myPrefs?.locations) {
        const locations = JSON.parse(myPrefs.locations);
        if (locations.length > 0) {
          where.OR = [
            { city: { in: locations } },
            { state: { in: locations } }
          ];
        }
      }

      return where;
    };

    let fuzzyUsed = false;
    let profiles: any[] = [];

    // Attempt 1: Strict matching
    profiles = await prisma.profile.findMany({
      where: getBaseQuery(),
      include: { user: { select: { lastActive: true } } },
    });

    // Step 6: FUZZY MATCHING logic
    if (profiles.length < 5) {
      fuzzyUsed = true;
      
      // Expand age range +/- 3
      profiles = await prisma.profile.findMany({
        where: getBaseQuery(3),
        include: { user: { select: { lastActive: true } } },
      });

      if (profiles.length < 5) {
        // Expand age range +/- 5
        profiles = await prisma.profile.findMany({
          where: getBaseQuery(5),
          include: { user: { select: { lastActive: true } } },
        });
      }

      if (profiles.length < 5) {
        // Remove caste filter
        profiles = await prisma.profile.findMany({
          where: getBaseQuery(5, false, true),
          include: { user: { select: { lastActive: true } } },
        });
      }

      if (profiles.length < 5) {
        // Remove religion filter
        profiles = await prisma.profile.findMany({
          where: getBaseQuery(5, true, true),
          include: { user: { select: { lastActive: true } } },
        });
      }
    }

    // Step 4 & 5: Calculate Score and Sort
    const results = profiles.map(p => ({
      ...p,
      matchScore: calculateScore(p),
      lastActive: p.user.lastActive
    }));

    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return b.lastActive.getTime() - a.lastActive.getTime();
    });

    // Step 7: Apply Plan Capping (FREE users limited to 10)
    const limits = getPlanLimits(currentUser.plan || 'FREE');
    const isCapped = results.length > limits.searchLimit;
    const finalResults = isCapped ? results.slice(0, limits.searchLimit) : results;

    return NextResponse.json({
      profiles: finalResults,
      total: results.length,
      fuzzyUsed,
      capped: isCapped,
      cappedAt: isCapped ? limits.searchLimit : undefined
    });

  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
