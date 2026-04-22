import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/logger';
import { getIp } from '@/lib/rateLimit';
import { getPlanById } from '@/lib/constants/plans';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== 'ADMIN') return forbiddenResponse();

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'PENDING';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
    const skip = (page - 1) * limit;

    const requests = await prisma.paymentRequest.findMany({
      where: { status: status as any },
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

    const total = await prisma.paymentRequest.count({ where: { status: status as any } });

    return NextResponse.json({ requests, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error('GET Admin Payments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorizedResponse();
  if (session.user.role !== 'ADMIN') return forbiddenResponse();

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
      const plan = getPlanById(paymentReq.plan);
      const durationMonths = plan ? plan.months : 1;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      await prisma.subscription.updateMany({
        where: { userId: paymentReq.userId, status: 'active' },
        data: { status: 'superseded' },
      });

      await prisma.$transaction([
        prisma.paymentRequest.update({
          where: { id },
          data: { status: 'APPROVED', adminId: session.user.id },
        }),
        prisma.subscription.create({
          data: {
            userId: paymentReq.userId,
            tier: paymentReq.plan,
            status: 'active',
            expiresAt,
          },
        }),
        prisma.notification.create({
          data: {
            userId: paymentReq.userId,
            type: 'SYSTEM_ALERT',
            message: `Your ${paymentReq.plan} membership has been activated! Enjoy premium features for ${durationMonths} months.`,
            link: '/dashboard',
          },
        }),
      ]);

      logAction({
        action: 'ADMIN_PAYMENT_APPROVE',
        userId: session.user.id,
        ip,
        details: `Approved ${paymentReq.plan} for user ${paymentReq.userId} (Request: ${id})`
      });

      return NextResponse.json({ message: 'Payment approved and subscription activated.' }, { status: 200 });
    } else {
      await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Payment could not be verified.',
          adminId: session.user.id,
        },
      });

      await prisma.notification.create({
        data: {
          userId: paymentReq.userId,
          type: 'SYSTEM_ALERT',
          message: `Your payment was not approved. Reason: ${rejectionReason || 'Could not be verified.'}`,
          link: '/payment',
        },
      });

      logAction({
        action: 'ADMIN_PAYMENT_REJECT',
        userId: session.user.id,
        ip,
        details: `Rejected payment for user ${paymentReq.userId} (Request: ${id}). Reason: ${rejectionReason}`
      });

      return NextResponse.json({ message: 'Payment rejected.' }, { status: 200 });
    }
  } catch (error) {
    console.error('PATCH Admin Payments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
