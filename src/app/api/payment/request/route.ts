import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

/**
 * POST: Create a manual UPI payment request
 * Phase UPI.1 - Step 3
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { planId, utr, screenshotUrl } = await request.json();

    // 1. Validate Plan
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan || planId === 'FREE') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // 2. Require evidence (UTR or Screenshot)
    if (!utr && !screenshotUrl) {
      return NextResponse.json({ error: 'UTR number or screenshot is required' }, { status: 400 });
    }

    // 3. Check Cooldown (1 request per hour)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastPaymentRequestAt: true }
    });

    if (user?.lastPaymentRequestAt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (user.lastPaymentRequestAt > oneHourAgo) {
        const nextAllowed = new Date(user.lastPaymentRequestAt.getTime() + 60 * 60 * 1000);
        return NextResponse.json({ 
          error: `Cooldown active. Please wait until ${nextAllowed.toLocaleTimeString()} to send another request.` 
        }, { status: 429 });
      }
    }

    // 4. Check for existing PENDING request for same plan
    const pendingRequest = await prisma.paymentRequest.findFirst({
      where: { 
        userId, 
        plan: planId, 
        status: 'PENDING' 
      }
    });

    if (pendingRequest) {
      return NextResponse.json({ error: `You already have a pending request for ${planId}` }, { status: 400 });
    }

    // 5. Validate UTR (Exactly 12 digits)
    if (utr) {
      const utrRegex = /^\d{12}$/;
      if (!utrRegex.test(utr)) {
        return NextResponse.json({ error: 'UTR number must be exactly 12 digits.' }, { status: 400 });
      }

      // Check UTR uniqueness (excluding REJECTED)
      const existingUtr = await prisma.paymentRequest.findFirst({
        where: { 
          utr, 
          status: { in: ['PENDING', 'APPROVED'] } 
        }
      });

      if (existingUtr) {
        return NextResponse.json({ error: 'This UTR has already been submitted.' }, { status: 400 });
      }
    }

    // 6. Create PaymentRequest
    const paymentRequest = await prisma.$transaction(async (tx) => {
      // Update cooldown
      await tx.user.update({
        where: { id: userId },
        data: { lastPaymentRequestAt: new Date() }
      });

      // Create request
      return await tx.paymentRequest.create({
        data: {
          userId,
          plan: planId,
          amount: plan.price,
          utr: utr || null,
          screenshotUrl: screenshotUrl || null,
          status: 'PENDING'
        }
      });
    });

    // 7. Notifications (Mocking for now, will use existing system if available)
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM_ALERT',
          message: `Your payment request for ${planId} has been submitted and is under review.`,
          link: '/dashboard'
        }
      });
      
      // Admin notification (Find an admin)
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            fromUserId: userId,
            type: 'SYSTEM_ALERT',
            message: `New UPI payment request from user for ${planId}.`,
            link: '/admin/payments'
          }
        });
      }
    } catch (notifErr) {
      console.error('Notification error (ignoring):', notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment request submitted successfully.',
      requestId: paymentRequest.id
    });

  } catch (error: any) {
    console.error('UPI PAYMENT REQUEST ERROR:', error);
    return NextResponse.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 });
  }
}

/**
 * GET: Fetch user's payment requests
 * Phase UPI.1 - Step 4
 */
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const requests = await prisma.paymentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true }
    });

    return NextResponse.json({ 
      requests,
      activePlan: {
        plan: user?.plan,
        expiresAt: user?.planExpiresAt
      }
    });
  } catch (error) {
    console.error('GET PAYMENT REQUESTS ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
