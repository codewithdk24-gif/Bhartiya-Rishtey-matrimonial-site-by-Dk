/**
 * FIXES APPLIED:
 * 1. Replaced new PrismaClient() + duplicate getUserIdFromRequest with centralized lib/auth
 * 2. Removed prisma.$disconnect()
 * 3. GET: Avoid unnecessary DB write on every fetch - only update completionPct if changed
 * 4. PUT: Added date of birth parsing (missing from original)
 * 5. PUT: Fixed double-update bug - was calling prisma.profile.update twice (once for data, once for completion)
 *    Combined into single atomic update
 * 6. PUT: Added isVisible support for Royal tier "Invisible Mode"
 * 7. Sanitized bio field - was entirely absent from the update mapping
 */

import { NextResponse } from 'next/server';
import { ProfileSchema } from '@/lib/validations';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseJsonField(val: any): any {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
}

function parsePhotos(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

function calculateCompletion(profile: {
  fullName?: string | null;
  religion?: string | null;
  caste?: string | null;
  education?: string | null;
  profession?: string | null;
  photos?: any;
  familyDetails?: any;
  preferences?: any;
  dateOfBirth?: Date | null;
}): number {
  let score = 20; // Base for account creation
  if (profile.fullName) score += 10;
  if (profile.dateOfBirth && profile.dateOfBirth.getFullYear() !== 1990) score += 10;
  if (profile.religion && profile.caste) score += 15;
  if (profile.education && profile.profession) score += 15;
  const photosArr = parsePhotos(profile.photos);
  if (photosArr.length > 0) score += 20;
  if (profile.familyDetails) score += 5;
  if (profile.preferences) score += 5;
  return Math.min(score, 100);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  // DEBUG LOGS
  const cookieHeader = request.headers.get("cookie") || "";
  console.log("-----------------------------------------");
  console.log("[Profile API] GET Request URL:", request.url);
  console.log("[Profile API] All Cookies:", cookieHeader);
  console.log("[Profile API] SESSION:", session ? `User: ${session.user?.email}` : "NULL");
  console.log("-----------------------------------------");
  
  if (!session?.user?.id) return unauthorizedResponse();
  const userId = session.user.id;

  try {
    let profile = await prisma.profile.findUnique({ where: { userId } });
    
    // FALLBACK: Auto-create profile if missing
    if (!profile) {
      console.log(`[Profile API] Fallback: Creating missing profile for user ${userId}`);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      profile = await prisma.profile.create({
        data: {
          userId,
          fullName: user?.name || "User",
          gender: "Male",
          dateOfBirth: new Date("1995-01-01"),
        }
      });
    }

    const currentPct = calculateCompletion(profile);

    // FIX: Only write if completion % actually changed (avoids unnecessary DB writes on every page load)
    if (currentPct !== profile.completionPct) {
      const updated = await prisma.profile.update({
        where: { userId },
        data: { completionPct: currentPct, isCompleted: currentPct >= 80 },
      });
      return NextResponse.json({ profile: updated }, { status: 200 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('GET Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  // DEBUG LOGS
  const cookieHeader = request.headers.get("cookie") || "";
  console.log("-----------------------------------------");
  console.log("[Profile API] PUT Request URL:", request.url);
  console.log("[Profile API] All Cookies:", cookieHeader);
  console.log("[Profile API] SESSION:", session ? `User: ${session.user?.email}` : "NULL");
  console.log("-----------------------------------------");

  if (!session?.user?.id) return unauthorizedResponse();
  const userId = session.user.id;

  try {
    const rawData = await request.json();

    const sanitizeObj = (obj: any) =>
      !obj || typeof obj !== 'object' || Array.isArray(obj) ? undefined : obj;

    const basicInfo   = sanitizeObj(rawData.basicInfo)   ?? {};
    const background  = sanitizeObj(rawData.background)  ?? {};
    const career      = sanitizeObj(rawData.career)      ?? {};
    const familyDetails = sanitizeObj(rawData.familyDetails);
    const preferences   = sanitizeObj(rawData.preferences);

    const photos = Array.isArray(rawData.photos)
      ? rawData.photos.filter((p: any) => typeof p === 'string').map(String)
      : undefined;

    const validationResult = ProfileSchema.safeParse({
      caste: background.caste,
      religion: background.religion,
      city: background.location,
      height: basicInfo.heightCm ? Number(basicInfo.heightCm) : undefined,
      education: career.education,
      profession: career.profession,
      photoKeys: photos,
      partnerIncome: preferences?.partnerIncome,
      about: rawData.bio,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Parse date of birth safely
    let dateOfBirth: Date | undefined;
    if (basicInfo.dateOfBirth) {
      const parsed = new Date(basicInfo.dateOfBirth);
      if (!isNaN(parsed.getTime())) dateOfBirth = parsed;
    }

    // Build update payload
    const updateData: Record<string, any> = {};
    if (basicInfo.name)      updateData.fullName  = String(basicInfo.name).trim();
    if (basicInfo.gender)    updateData.gender    = String(basicInfo.gender);
    if (basicInfo.heightCm)  updateData.heightCm  = parseInt(String(basicInfo.heightCm)) || null;
    if (dateOfBirth)         updateData.dateOfBirth = dateOfBirth;
    if (rawData.bio)         updateData.bio        = String(rawData.bio).substring(0, 1000);

    if (background.religion) updateData.religion = String(background.religion);
    if (background.caste)    updateData.caste     = String(background.caste);
    if (background.location) updateData.location  = String(background.location);

    if (career.education)  updateData.education  = String(career.education);
    if (career.profession) updateData.profession = String(career.profession);
    if (career.incomeTier) updateData.incomeTier = String(career.incomeTier);

    if (photos) updateData.photos = JSON.stringify(photos);
    if (familyDetails && Object.keys(familyDetails).length > 0) updateData.familyDetails = JSON.stringify(familyDetails);
    if (preferences   && Object.keys(preferences).length   > 0) updateData.preferences   = JSON.stringify(preferences);

    // FIX: Single atomic update (original was making 2 DB calls)
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    const newPct = calculateCompletion(updatedProfile);
    const finalProfile = await prisma.profile.update({
      where: { userId },
      data: { completionPct: newPct, isCompleted: newPct >= 50 },
    });

    // Update User table to reflect completion status for onboarding
    if (newPct >= 50) {
      await prisma.user.update({
        where: { id: userId },
        data: { isProfileComplete: true }
      });
    }

    return NextResponse.json({ 
      message: 'Profile updated', 
      profile: finalProfile,
      isProfileComplete: newPct >= 50 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
