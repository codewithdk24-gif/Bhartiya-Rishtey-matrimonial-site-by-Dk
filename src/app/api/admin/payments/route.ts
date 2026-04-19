import { NextResponse } from 'next/server';
import { getSessionFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { getIp } from '@/lib/ratelimit';
import { getPlanById } from '@/lib/constants/plans';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();
  if (session.role !== 'ADMIN') return forbiddenResponse();

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'PENDING';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
    const skip = (page - 1) * limit;

    const requests = await prisma.paymentRequest.findMany({
      where: { status },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.paymentRequest.count({ where: { status } });

    return NextResponse.json({ requests, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error('GET Admin Payments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();
  if (session.role !== 'ADMIN') return forbiddenResponse();

  const ip = getIp(request);

  try {
    const body = await request.json();
    const { id, action, rejectionReason } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Provide id and action (approve/reject).' }, { status: 400 });
    }

    const paymentReq = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!paymentReq) {
      return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
    }

    if (paymentReq.status !== 'PENDING') {
      return NextResponse.json({ error: 'This request has already been processed.' }, { status: 409 });
    }

    if (action === 'approve') {
      // Approve: update payment + create subscription
      const plan = getPlanById(paymentReq.tier);
      const durationMonths = plan ? plan.months : 1;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      // Expire old active subscriptions
      await prisma.subscription.updateMany({
        where: { userId: paymentReq.userId, status: 'active' },
        data: { status: 'superseded' },
      });

      await prisma.$transaction([
        prisma.paymentRequest.update({
          where: { id },
          data: { status: 'APPROVED', reviewedBy: session.userId },
        }),
        prisma.subscription.create({
          data: {
            userId: paymentReq.userId,
            tier: paymentReq.tier,
            status: 'active',
            expiresAt,
          },
        }),
        prisma.notification.create({
          data: {
            userId: paymentReq.userId,
            type: 'PAYMENT',
            message: `Your ${paymentReq.tier} membership has been activated! Enjoy premium features for ${durationMonths} months.`,
            actionUrl: '/dashboard',
          },
        }),
      ]);

      await logAction({
        userId: session.userId,
        ip,
        action: 'ADMIN_ACTION',
        status: 'SUCCESS',
        details: `Approved payment request ${id} for user ${paymentReq.userId} (${paymentReq.tier}) for ${durationMonths} months`,
      });

      return NextResponse.json({ message: 'Payment approved and subscription activated.' }, { status: 200 });
    } else {
      // Reject
      await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Payment could not be verified.',
          reviewedBy: session.userId,
        },
      });

      await prisma.notification.create({
        data: {
          userId: paymentReq.userId,
          type: 'PAYMENT',
          message: `Your payment was not approved. Reason: ${rejectionReason || 'Could not be verified.'}`,
          actionUrl: '/payment',
        },
      });

      await logAction({
        userId: session.userId,
        ip,
        action: 'ADMIN_ACTION',
        status: 'SUCCESS',
        details: `Rejected payment request ${id} for user ${paymentReq.userId}. Reason: ${rejectionReason}`,
      });

      return NextResponse.json({ message: 'Payment rejected.' }, { status: 200 });
    }
  } catch (error) {
    console.error('PATCH Admin Payments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
