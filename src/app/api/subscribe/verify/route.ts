/**
 * FIXES APPLIED:
 * 1. Centralized auth/prisma
 * 2. Removed prisma.$disconnect()
 * 3. CRITICAL: Added idempotency check — if paymentId already exists in subscriptions,
 *    return success instead of crashing on unique constraint (P2002 on paymentId)
 * 4. Added Zod validation on input payload
 * 5. Subscription duration is now plan-aware: ROYAL = 3 months, PREMIUM = 1 month
 * 6. Old active subscriptions are expired before creating new one (prevent stacking)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { RazorpayVerifySchema } from '@/lib/validations';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PLAN_DURATION_MONTHS: Record<string, number> = {
  PREMIUM: 1,
  ROYAL: 3,
};

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Payment service is not configured.' }, { status: 503 });
  }

  try {
    const rawData = await request.json();
    const parseResult = RazorpayVerifySchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid verification payload.' }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = parseResult.data;

    // Cryptographic signature verification
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed. Signature mismatch.' }, { status: 400 });
    }

    // FIX: Idempotency — check if this payment was already processed
    const existingSubscription = await prisma.subscription.findUnique({
      where: { paymentId: razorpay_payment_id },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'Subscription already active.', subscription: existingSubscription },
        { status: 200 }
      );
    }

    const durationMonths = PLAN_DURATION_MONTHS[plan] ?? 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // FIX: Expire old active subscriptions before creating new one
    await prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'superseded' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier: plan,
        status: 'active',
        paymentId: razorpay_payment_id,
        expiresAt,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT',
        message: `Your ${plan} membership is now active! Enjoy your benefits.`,
        actionUrl: '/dashboard',
      },
    });

    return NextResponse.json(
      { message: 'Payment verified. Welcome to premium!', subscription },
      { status: 200 }
    );
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    return NextResponse.json({ error: 'Verification error. Please contact support.' }, { status: 500 });
  }
}
