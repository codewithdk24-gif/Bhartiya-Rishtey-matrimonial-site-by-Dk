/**
 * NEW IMPLEMENTATION: /api/payment/status
 *
 * This route was referenced in payment/page.tsx but not properly implemented.
 * It fetches the most recent payment request status for the current user.
 */

import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const latestRequest = await prisma.paymentRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRequest) {
      return NextResponse.json({ status: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        status: latestRequest.status,
        rejectionReason: latestRequest.rejectionReason ?? null,
        tier: latestRequest.plan,
        submittedAt: latestRequest.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET Payment Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
