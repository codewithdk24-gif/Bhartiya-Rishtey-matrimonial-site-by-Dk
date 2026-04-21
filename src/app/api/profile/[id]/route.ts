import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isBlocked } from '@/lib/safety';
import { getPlanLimits } from '@/lib/plans';

/**
 * GET: Fetch a specific user's profile by their ID
 * Step 5: PROFILE VIEW API
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = getUserIdFromRequest(request);
  if (!currentUserId) return unauthorizedResponse();

  const { id: targetId } = await params;

  try {
    // 1. Safety Check: If blocked (either way), return 404
    if (await isBlocked(currentUserId, targetId)) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch the profile
    // We try to find by userId first, as it's the most common identifier used in links
    const profile = await prisma.profile.findUnique({
      where: { userId: targetId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastActive: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Plan-based Masking
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { plan: true } });
    const userPlan = (currentUser?.plan || 'FREE').toUpperCase();

    if (userPlan === 'FREE') {
      // Mask photos: only keep first one
      if (profile.photos) {
        try {
          const photoArr = JSON.parse(profile.photos);
          if (photoArr.length > 1) {
            profile.photos = JSON.stringify([photoArr[0]]);
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      
      // Phone/Email are already not included in the 'user' select above, 
      // but if they were added later, we ensure they are masked.
      // (Added check here for future-proofing)
      if ((profile.user as any).email) (profile.user as any).email = null;
      if ((profile.user as any).phone) (profile.user as any).phone = null;
    }

    // 4. Return sanitized profile
    return NextResponse.json({ 
      profile,
      isMasked: userPlan === 'FREE'
    });

  } catch (error) {
    console.error('GET Profile [id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
