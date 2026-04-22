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
    const limit = parseInt(searchParams.get("limit") || "16");
    const page = parseInt(searchParams.get("page") || "1");
    
    // Filters
    const sort = searchParams.get("sort") || "best_match";
    const minAge = parseInt(searchParams.get("minAge") || "18");
    const maxAge = parseInt(searchParams.get("maxAge") || "60");
    const religion = searchParams.get("religion");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const photosOnly = searchParams.get("photosOnly") === "true";
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
    const likedRes = await prisma.like.findMany({ where: { senderId: userId }, select: { receiverId: true } });
    const likedIds = likedRes.map(l => l.receiverId);
    
    const excludeIds = [userId, ...blockedIds, ...likedIds];

    // 2. Build Query
    const isMale = myProfile.gender === "Male" || myProfile.gender === "A Groom";
    const targetGenders = isMale ? ["Female", "A Bride"] : ["Male", "A Groom"];

    const where: any = {
      userId: { notIn: excludeIds },
      gender: { in: targetGenders },
      dateOfBirth: {
        gte: new Date(new Date().setFullYear(new Date().getFullYear() - maxAge)),
        lte: new Date(new Date().setFullYear(new Date().getFullYear() - minAge))
      }
    };

    if (religion && religion !== "All") where.religion = religion;
    if (verifiedOnly) where.user = { isVerified: true };
    if (photosOnly) where.photos = { not: "[]" };
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
    const skip = (page - 1) * limit;
    const profiles = await prisma.profile.findMany({
      where,
      include: { user: { select: { lastActive: true, isVerified: true } } },
      orderBy,
      take: limit,
      skip: skip
    });

    // 5. Format results
    const results = profiles.map(p => ({
      id: p.id,
      userId: p.userId,
      fullName: p.fullName,
      age: calculateAge(p.dateOfBirth),
      profession: p.profession || 'Professional',
      location: p.location || 'India',
      photos: p.photos,
      isVerified: p.user.isVerified,
      matchScore: calculateScore(p, myProfile),
      activityStatus: getActivityLabel(p.user.lastActive)
    }));

    return NextResponse.json({
      profiles: results,
      hasMore: results.length === limit,
      totalCount: results.length, // Rough count
      fallbackSuggested: results.length < 4
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
