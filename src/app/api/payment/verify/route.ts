import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { PLANS } from '@/lib/plans';

/**
 * POST: Verify Razorpay Payment Signature
 * Phase 7.4.1 - Step 5
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await request.json();

    // 1. Security: Verify Signature (HMAC-SHA256)
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('RAZORPAY SIGNATURE MISMATCH:', { userId, razorpay_order_id });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 2. Find and Validate PaymentOrder
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!paymentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security: Ensure userId matches the order
    if (paymentOrder.userId !== userId) {
      console.error('RAZORPAY USER MISMATCH:', { userId, orderUserId: paymentOrder.userId });
      return NextResponse.json({ error: 'Payment authorization mismatch' }, { status: 403 });
    }

    // 3. Idempotency Check
    if (paymentOrder.status === 'SUCCESS') {
      return NextResponse.json({ message: 'Payment already verified', success: true });
    }

    // 4. Atomic Upgrade
    const plan = PLANS[paymentOrder.plan as keyof typeof PLANS];
    if (!plan) throw new Error(`Invalid plan ${paymentOrder.plan} in order`);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

    // Update both User and PaymentOrder in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          plan: paymentOrder.plan,
          planExpiresAt: expiryDate
        }
      }),
      prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          verifiedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully upgraded to ${paymentOrder.plan}` 
    });

  } catch (error: any) {
    console.error('RAZORPAY VERIFY ERROR:', error);
    return NextResponse.json({ error: 'Verification failed. Please contact support if amount was deducted.' }, { status: 500 });
  }
}
