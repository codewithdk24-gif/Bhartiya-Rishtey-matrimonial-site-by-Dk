import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedUserIds } from "@/lib/safety";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const limit = parseInt(searchParams.get("limit") || "12");
    const page = parseInt(searchParams.get("page") || "0");
    
    // Filters
    const sort = searchParams.get("sort") || "best_match";
    const minAge = parseInt(searchParams.get("minAge") || "18");
    const maxAge = parseInt(searchParams.get("maxAge") || "60");
    const minHeight = parseInt(searchParams.get("minHeight") || "140");
    const maxHeight = parseInt(searchParams.get("maxHeight") || "220");
    const religion = searchParams.get("religion");
    const caste = searchParams.get("caste");
    const education = searchParams.get("education");
    const profession = searchParams.get("profession");
    const incomeTier = searchParams.get("incomeTier");
    const maritalStatus = searchParams.get("maritalStatus");
    const smoking = searchParams.get("smoking") === "true";
    const drinking = searchParams.get("drinking") === "true";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const photosOnly = searchParams.get("photosOnly") === "true";
    const recentlyActive = searchParams.get("recentlyActive") === "true";
    const location = searchParams.get("location");
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get current user info for gender matching
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    }) as any;

    if (!currentUser || !currentUser.profile) {
      return NextResponse.json({ error: "PROFILE_INCOMPLETE" }, { status: 403 });
    }

    const myProfile = currentUser.profile;
    const blockedIds = await getBlockedUserIds(userId);
    
    // Get liked/shortlisted IDs to exclude (Optional: can keep them but with a flag)
    const excludeIds = [userId, ...blockedIds];

    // 2. Build Query
    const isMale = myProfile.gender === "Male" || myProfile.gender === "A Groom";
    const targetGenders = isMale ? ["Female", "A Bride"] : ["Male", "A Groom"];

    const where: any = {
      userId: { notIn: excludeIds },
      gender: { in: targetGenders },
      dateOfBirth: {
        gte: new Date(new Date().setFullYear(new Date().getFullYear() - maxAge)),
        lte: new Date(new Date().setFullYear(new Date().getFullYear() - minAge))
      },
      heightCm: {
        gte: minHeight,
        lte: maxHeight
      }
    };

    if (religion && religion !== "All") where.religion = religion;
    if (caste && caste !== "All") where.caste = { contains: caste, mode: 'insensitive' };
    if (education && education !== "All") where.education = { contains: education, mode: 'insensitive' };
    if (profession && profession !== "All") where.profession = { contains: profession, mode: 'insensitive' };
    if (incomeTier && incomeTier !== "All") where.incomeTier = incomeTier;
    if (maritalStatus && maritalStatus !== "All") where.maritalStatus = maritalStatus;
    if (smoking) where.smoking = true;
    if (drinking) where.drinking = true;
    
    if (verifiedOnly) where.user = { ...where.user, isVerified: true };
    if (photosOnly) where.photos = { not: "[]" };
    if (recentlyActive) {
      const activeThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours
      where.user = { ...where.user, lastActive: { gte: activeThreshold } };
    }

    if (location && location !== "All") {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { location: { contains: location, mode: 'insensitive' } }
      ];
    }

    // 3. Sorting
    let orderBy: any = [{ completionPct: 'desc' }, { updatedAt: 'desc' }];
    if (sort === "recently_active") orderBy = [{ user: { lastActive: 'desc' } }];
    else if (sort === "new_profiles") orderBy = [{ createdAt: 'desc' }];

    // 4. Fetch
    const skip = page * limit;
    let profiles = await prisma.profile.findMany({
      where,
      include: { user: { select: { lastActive: true, isVerified: true } } },
      orderBy,
      take: limit,
      skip: skip
    });

    let isRelaxed = false;

    // 4b. Smart Fallback: If results are low (< 6), relax filters (religion and location)
    if (profiles.length < 6 && page === 0) {
      const relaxedWhere = { ...where };
      delete relaxedWhere.religion;
      delete relaxedWhere.OR; // Removes location filters
      
      // Exclude already found IDs
      const foundIds = profiles.map(p => p.userId);
      relaxedWhere.userId = { ...relaxedWhere.userId, notIn: [...excludeIds, ...foundIds] };

      const additionalProfiles = await prisma.profile.findMany({
        where: relaxedWhere,
        include: { user: { select: { lastActive: true, isVerified: true } } },
        orderBy,
        take: limit - profiles.length,
      });

      if (additionalProfiles.length > 0) {
        profiles = [...profiles, ...additionalProfiles];
        isRelaxed = true;
      }
    }

    // 5. Get existing interactions to flag profiles
    const interests = await prisma.interest.findMany({
      where: { 
        OR: [
          { fromUserId: userId, toUserId: { in: profiles.map(p => p.userId) } },
          { fromUserId: { in: profiles.map(p => p.userId) }, toUserId: userId }
        ]
      },
      select: { id: true, fromUserId: true, toUserId: true, status: true }
    });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: { in: profiles.map(p => p.userId) } },
          { user2Id: userId, user1Id: { in: profiles.map(p => p.userId) } }
        ]
      },
      select: { id: true, user1Id: true, user2Id: true }
    });

    // 6. Format results
    const results = profiles.map(p => {
      const interest = interests.find(i => (i.fromUserId === userId && i.toUserId === p.userId) || (i.fromUserId === p.userId && i.toUserId === userId));
      const conversation = conversations.find(c => (c.user1Id === userId && c.user2Id === p.userId) || (c.user1Id === p.userId && c.user2Id === userId));

      return {
        id: p.id,
        userId: p.userId,
        fullName: p.fullName,
        age: calculateAge(p.dateOfBirth),
        profession: p.profession || 'Professional',
        location: p.location || 'India',
        city: p.city,
        state: p.state,
        photos: p.photos,
        isVerified: p.user.isVerified,
        matchScore: calculateScore(p, myProfile),
        activityStatus: getActivityLabel(p.user.lastActive),
        hasSentInterest: !!interest,
        interestStatus: interest?.status || null,
        conversationId: conversation?.id || null
      };
    });

    return NextResponse.json({
      profiles: results,
      hasMore: results.length >= limit,
      totalCount: results.length,
      isRelaxed
    });

  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function calculateAge(dob: any): number {
  if (!dob) return 25;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function calculateScore(p: any, my: any): number {
  let s = 70;
  if (p.religion === my.religion) s += 10;
  if (p.profession === my.profession) s += 10;
  if (p.location === my.location) s += 5;
  return Math.min(s, 98);
}

function getActivityLabel(lastActive: Date): string {
  const diff = Date.now() - lastActive.getTime();
  if (diff < 600000) return 'Active now';
  if (diff < 3600000) return 'Active recently';
  return 'Active today';
}
