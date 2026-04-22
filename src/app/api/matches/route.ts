import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedUserIds } from "@/lib/safety";
import { getPlanLimits } from "@/lib/plans";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // DEBUG LOGS
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("-----------------------------------------");
    console.log("[Matches API] Request URL:", request.url);
    console.log("[Matches API] All Cookies:", cookieHeader);
    console.log("[Matches API] SESSION:", session ? `User: ${session.user?.email}` : "NULL");
    console.log("-----------------------------------------");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get current user's profile, preferences and LIKED users
    let currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        likesSent: { select: { receiverId: true } }
      },
    }) as any;

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // FALLBACK: Auto-create profile if missing
    if (!currentUser.profile) {
      console.log(`[Matches API] Fallback: Creating missing profile for user ${userId}`);
      const newProfile = await prisma.profile.create({
        data: {
          userId,
          fullName: currentUser.name || "User",
          gender: "Male",
          dateOfBirth: new Date("1995-01-01"),
          isCompleted: false
        }
      });
      // Refresh currentUser with new profile
      currentUser.profile = newProfile;
    }

    const myProfile = currentUser.profile;
    const myPrefs = currentUser.preferences;
    const likedUserIds = (currentUser.likesSent || []).map((l: any) => l.receiverId);

    // 2. ENFORCE PROFILE COMPLETION (60% Threshold)
    if ((myProfile.completionPct || 0) < 60) {
      console.log(`[Matches API] Access Denied: Profile only ${myProfile.completionPct}% complete`);
      return NextResponse.json({ 
        error: "PROFILE_INCOMPLETE", 
        completionPct: myProfile.completionPct,
        message: "Complete at least 60% of your profile to unlock matches"
      }, { status: 403 });
    }

    // Optimized Gender Logic (Handles both "Male/Female" and "A Groom/A Bride")
    const isMale = myProfile.gender === "Male" || myProfile.gender === "A Groom";
    const targetGenders = isMale ? ["Female", "A Bride"] : ["Male", "A Groom"];

    // 2. Fetch blocked users list (Bidirectional)
    const blockedIds = await getBlockedUserIds(userId);
    
    // Exclude current user, blocked users, AND liked users
    const excludeIds = [userId, ...blockedIds, ...likedUserIds];

    // Helper to build filters
    const getBaseQuery = (ageBuffer = 0, ignoreReligion = false, ignoreCaste = false, ignoreAge = false) => {
      const minAge = (myPrefs?.minAge || 18) - ageBuffer;
      const maxAge = (myPrefs?.maxAge || 60) + ageBuffer;
      
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - maxAge);
      
      const maxDob = new Date();
      maxDob.setFullYear(maxDob.getFullYear() - minAge);

      const where: any = {
        userId: { 
          notIn: excludeIds 
        },
        gender: { in: targetGenders },
        // isCompleted: true, // Optional: Keep or remove based on how strict we want to be
      };

      if (!ignoreAge) {
        where.dateOfBirth = {
          gte: minDob,
          lte: maxDob,
        };
      }

      if (!ignoreReligion && myPrefs?.religions) {
        const religions = typeof myPrefs.religions === 'string' ? JSON.parse(myPrefs.religions) : myPrefs.religions;
        if (Array.isArray(religions) && religions.length > 0) where.religion = { in: religions };
      }

      if (!ignoreCaste && myPrefs?.castes) {
        const castes = typeof myPrefs.castes === 'string' ? JSON.parse(myPrefs.castes) : myPrefs.castes;
        if (Array.isArray(castes) && castes.length > 0) where.caste = { in: castes };
      }

      // Add Location Filtering
      if (myPrefs?.locations) {
        const locations = typeof myPrefs.locations === 'string' ? JSON.parse(myPrefs.locations) : myPrefs.locations;
        if (Array.isArray(locations) && locations.length > 0) {
          where.OR = [
            { city: { in: locations, mode: 'insensitive' } },
            { state: { in: locations, mode: 'insensitive' } },
            { location: { in: locations, mode: 'insensitive' } }
          ];
        }
      }

      return where;
    };

    let fuzzyUsed = false;
    let profiles: any[] = [];

    // Attempt 1: Strict matching with SORTING
    profiles = await prisma.profile.findMany({
      where: getBaseQuery(),
      include: { user: { select: { lastActive: true } } },
      orderBy: [
        { completionPct: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    });
    
    console.log(`[Discover] Strict Match Found: ${profiles.length}`);

    // FUZZY MATCHING Waterfall
    if (profiles.length < 5) {
      fuzzyUsed = true;
      
      // Step 2: Expand age +/- 5
      profiles = await prisma.profile.findMany({
        where: getBaseQuery(5),
        include: { user: { select: { lastActive: true } } },
        orderBy: [
          { completionPct: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: 50
      });

      if (profiles.length < 5) {
        // Step 3: Remove religion & caste
        profiles = await prisma.profile.findMany({
          where: getBaseQuery(5, true, true),
          include: { user: { select: { lastActive: true } } },
          orderBy: [
            { completionPct: 'desc' },
            { updatedAt: 'desc' }
          ],
          take: 50
        });
      }

      if (profiles.length < 5) {
        // Step 4: FALLBACK - All opposite gender users not liked/blocked
        console.log(`[Discover] No profiles found in fuzzy, using fallback...`);
        profiles = await prisma.profile.findMany({
          where: {
            userId: { notIn: excludeIds },
            gender: { in: targetGenders }
          },
          include: { user: { select: { lastActive: true } } },
          orderBy: [
            { completionPct: 'desc' },
            { user: { lastActive: 'desc' } }
          ],
          take: 30
        });
      }
    }

    console.log(`[Discover] Final profiles count: ${profiles.length}`);

    // Calculate Score and Sort (Deterministic sorting by activity)
    const results = profiles.map(p => ({
      ...p,
      matchScore: 70 + Math.floor((p.completionPct / 100) * 20) + (p.user.lastActive > new Date(Date.now() - 86400000) ? 10 : 0),
      lastActive: p.user.lastActive
    }));

    // Sort by final score
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Step 7: Apply Plan Capping
    const limits = getPlanLimits(currentUser.plan || 'FREE');
    const finalResults = results.slice(0, 20); // Show at least 20 for discovery

    return NextResponse.json({
      profiles: finalResults,
      total: finalResults.length,
      fuzzyUsed,
      likedCount: likedUserIds.length
    });

  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
