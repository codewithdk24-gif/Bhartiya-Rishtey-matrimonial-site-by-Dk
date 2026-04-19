/**
 * FIXES APPLIED:
 * 1. Original route was never shown but was called from frontend as /api/match/shortlist
 *    with { targetProfileId }. Implemented properly with centralized libs.
 * 2. Added GET to retrieve shortlist (was missing)
 * 3. Added DELETE to remove from shortlist (was missing)
 */

import { NextResponse } from 'next/server';
import { ShortlistSchema } from '@/lib/validations';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const rawData = await request.json();
    const result = ShortlistSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid profile ID.' }, { status: 400 });
    }

    const { targetProfileId } = result.data;

    // Verify profile exists
    const profile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    // Cannot shortlist yourself
    if (profile.userId === userId) {
      return NextResponse.json({ error: 'You cannot shortlist your own profile.' }, { status: 400 });
    }

    const shortlist = await prisma.shortlist.create({
      data: { userId, profileId: targetProfileId },
    });

    return NextResponse.json({ message: 'Added to shortlist', shortlist }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already in shortlist.' }, { status: 409 });
    }
    console.error('POST Shortlist Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const shortlist = await prisma.shortlist.findMany({
      where: { userId },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            photos: true,
            profession: true,
            location: true,
            religion: true,
            heightCm: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shortlist }, { status: 200 });
  } catch (error) {
    console.error('GET Shortlist Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { profileId } = await request.json();
    if (!profileId) return NextResponse.json({ error: 'profileId required.' }, { status: 400 });

    await prisma.shortlist.delete({
      where: { userId_profileId: { userId, profileId } },
    });

    return NextResponse.json({ message: 'Removed from shortlist.' }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found in shortlist.' }, { status: 404 });
    }
    console.error('DELETE Shortlist Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
