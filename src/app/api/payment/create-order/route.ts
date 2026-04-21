import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import { PLANS } from '@/lib/plans';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST: Create a Razorpay order
 * Phase 7.4.1 - Step 4
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { planId } = await request.json();

    // 1. Validate Plan
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan || planId === 'FREE') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // 2. Prevent duplicate active plan (Optional but recommended)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true }
    });

    if (user?.plan === planId && user.planExpiresAt && new Date(user.planExpiresAt) > new Date()) {
      return NextResponse.json({ 
        error: `You already have an active ${planId} plan until ${new Date(user.planExpiresAt).toLocaleDateString()}` 
      }, { status: 400 });
    }

    // 3. Create Razorpay Order
    // Note: Amount must be in Paise (Rupees * 100)
    const amountInPaise = plan.price * 100;
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        planId
      }
    };

    const order = await razorpay.orders.create(options);

    // 4. Save PaymentOrder (PENDING)
    await prisma.paymentOrder.create({
      data: {
        userId,
        plan: planId,
        amount: plan.price,
        currency: "INR",
        razorpayOrderId: order.id,
        status: "PENDING",
      }
    });

    // 5. Return Order Details
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error('RAZORPAY CREATE ORDER ERROR:', error);
    return NextResponse.json({ error: 'Could not initiate payment. Please try again.' }, { status: 500 });
  }
}
