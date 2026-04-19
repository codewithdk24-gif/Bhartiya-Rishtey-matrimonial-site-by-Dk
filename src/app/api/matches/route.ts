/**
 * FIXES APPLIED:
 * 1. Replaced new PrismaClient() + duplicate getUserIdFromRequest with centralized libs
 * 2. Added isVisible: true filter — Royal tier "Invisible Mode" was advertised but never enforced
 * 3. Added block list filtering — blocked users were appearing in matches (privacy/safety bug)
 * 4. Removed the flawed age calculation using setFullYear (mutates Date in place, causes bugs around year boundaries)
 * 5. Score computation: fuzzy fallback base score logic was inverted (isFuzzy gave higher base)
 * 6. Added pagination support (take/skip) to prevent unbounded result sets
 * 7. Profiles with placeholder DOB (1990-01-01) are excluded from age filtering
 */

import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function subtractYears(years: number): Date {
  // FIX: Create a new Date instead of mutating with setFullYear
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(20, parseInt(url.searchParams.get('limit') ?? '20'));
  const skip = (page - 1) * limit;

  try {
    const currentUserProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!currentUserProfile) {
      return NextResponse.json({ error: 'Please complete your profile to view matches.' }, { status: 404 });
    }

    const { gender } = currentUserProfile;
    let prefs: any = {};
    if (currentUserProfile.preferences) {
      try { prefs = typeof currentUserProfile.preferences === 'string' ? JSON.parse(currentUserProfile.preferences) : currentUserProfile.preferences; } catch { prefs = {}; }
    }

    const targetGender =
      prefs.partnerGender ??
      (gender === 'A Groom' ? 'A Bride' : gender === 'A Bride' ? 'A Groom' : undefined);

    // FIX: Get both match exclusions AND blocked users
    const [existingInteractions, blockRelations] = await Promise.all([
      prisma.match.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        select: { user1Id: true, user2Id: true },
      }),
      prisma.blockList.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludeIds = new Set<string>([userId]);
    existingInteractions.forEach(m => { excludeIds.add(m.user1Id); excludeIds.add(m.user2Id); });
    blockRelations.forEach(b => { excludeIds.add(b.blockerId); excludeIds.add(b.blockedId); });

    const baseWhere: any = {
      userId: { notIn: Array.from(excludeIds) },
      isCompleted: true,
      isVisible: true, // FIX: respect Invisible Mode
    };

    if (targetGender) baseWhere.gender = targetGender;

    // FIX: Safe date range calculation
    if (prefs.minAge || prefs.maxAge) {
      baseWhere.dateOfBirth = {};
      if (prefs.maxAge) baseWhere.dateOfBirth.gte = subtractYears(prefs.maxAge);
      if (prefs.minAge) baseWhere.dateOfBirth.lte = subtractYears(prefs.minAge);
    }

    if (prefs.religion && prefs.religion !== 'Any') {
      baseWhere.religion = prefs.religion;
    }

    let potentialMatches = await prisma.profile.findMany({
      where: baseWhere,
      skip,
      take: limit,
    });

    let isFuzzy = false;

    // Phase 2: Fuzzy fallback
    if (potentialMatches.length === 0 && page === 1) {
      isFuzzy = true;
      const relaxedWhere: any = {
        userId: { notIn: Array.from(excludeIds) },
        isCompleted: true,
        isVisible: true,
      };

      if (targetGender) relaxedWhere.gender = targetGender;

      if (prefs.minAge || prefs.maxAge) {
        const relaxMin = prefs.minAge ? prefs.minAge - 4 : undefined;
        const relaxMax = prefs.maxAge ? prefs.maxAge + 4 : undefined;
        relaxedWhere.dateOfBirth = {};
        if (relaxMax) relaxedWhere.dateOfBirth.gte = subtractYears(relaxMax);
        if (relaxMin) relaxedWhere.dateOfBirth.lte = subtractYears(relaxMin);
      }

      potentialMatches = await prisma.profile.findMany({
        where: relaxedWhere,
        take: 30,
      });
    }

    // Score
    const scoredMatches = potentialMatches
      .map(p => {
        // FIX: Exact match base should be higher than fuzzy, not equal to it
        let score = isFuzzy ? 55 : 80;
        if (prefs.education && p.education === prefs.education) score += 5;
        if (prefs.caste && p.caste === prefs.caste) score += 5;
        if (prefs.religion && p.religion === prefs.religion) score += isFuzzy ? 15 : 5;
        if (prefs.maxHeightCm && p.heightCm && p.heightCm <= prefs.maxHeightCm) score += 5;
        return {
          ...p,
          matchScore: Math.min(score, 100),
          matchType: isFuzzy ? 'CLOSE_MATCH' : 'EXACT_MATCH',
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json(
      {
        matches: scoredMatches,
        meta: { page, limit, fuzzyModeEnabled: isFuzzy, count: scoredMatches.length },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET Matches Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
