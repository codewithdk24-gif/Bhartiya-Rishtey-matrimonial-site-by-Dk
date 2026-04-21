import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasAccess, getUpgradeError } from '@/lib/plans';

/**
 * GET: Fetch list of users who viewed my profile
 * Step 6: PROFILE VIEWS (Gated)
 */
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    // 1. Plan Check: Only ROYAL and above can see who viewed them
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const userPlan = (user?.plan || 'FREE').toUpperCase();

    if (!hasAccess(userPlan, 'ROYAL')) {
      return NextResponse.json(
        getUpgradeError("profile_views", "ROYAL"),
        { status: 403 }
      );
    }

    // 2. Fetch Views
    const views = await prisma.profileView.findMany({
      where: { viewedId: userId },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                fullName: true,
                photos: true,
                location: true,
                profession: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ views });

  } catch (error) {
    console.error('GET Profile Views Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
