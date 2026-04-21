import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

/**
 * PATCH: Admin approve/reject payment request
 * Phase UPI.1 - Step 5
 */
export async function PATCH(request: Request) {
  const adminId = getUserIdFromRequest(request);
  if (!adminId) return unauthorizedResponse();

  try {
    // 1. Verify Admin Role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    const { requestId, action, reason, note } = await request.json();

    // 2. Find Payment Request
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!paymentRequest) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    if (paymentRequest.status !== 'PENDING') {
      return NextResponse.json({ error: `Request is already ${paymentRequest.status}` }, { status: 400 });
    }

    // 3. Handle Actions
    if (action === 'APPROVE') {
      const plan = PLANS[paymentRequest.plan as keyof typeof PLANS];
      if (!plan) throw new Error(`Invalid plan ${paymentRequest.plan} in request`);

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

      await prisma.$transaction([
        // Upgrade User
        prisma.user.update({
          where: { id: paymentRequest.userId },
          data: {
            plan: paymentRequest.plan,
            planExpiresAt: expiryDate
          }
        }),
        // Update Request
        prisma.paymentRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            adminId,
            adminNote: note || null,
            verifiedAt: new Date(),
            activatedAt: new Date()
          }
        }),
        // Notify User
        prisma.notification.create({
          data: {
            userId: paymentRequest.userId,
            type: 'SYSTEM_ALERT',
            message: `Congratulations! Your payment request for ${paymentRequest.plan} has been approved. Your plan is now active.`,
            link: '/dashboard'
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Payment approved and plan activated.' });
    } 
    
    if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.$transaction([
        // Update Request
        prisma.paymentRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            rejectionReason: reason,
            adminId,
            adminNote: note || null,
            verifiedAt: new Date()
          }
        }),
        // Notify User
        prisma.notification.create({
          data: {
            userId: paymentRequest.userId,
            type: 'SYSTEM_ALERT',
            message: `Your payment request for ${paymentRequest.plan} was rejected. Reason: ${reason}`,
            link: '/premium'
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Payment request rejected.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('ADMIN PAYMENT ACTION ERROR:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

/**
 * GET: Admin fetch all pending/recent requests
 */
export async function GET(request: Request) {
  const adminId = getUserIdFromRequest(request);
  if (!adminId) return unauthorizedResponse();

  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const requests = await prisma.paymentRequest.findMany({
      where: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('ADMIN GET REQUESTS ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
