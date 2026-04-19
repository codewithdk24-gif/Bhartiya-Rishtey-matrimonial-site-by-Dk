import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { paymentLimiter, getIp } from '@/lib/ratelimit';
import { logAction } from '@/lib/logger';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { PaymentPlanSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';
import { getPlanById } from '@/lib/constants/plans';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isCloudinaryConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  const ip = getIp(request);

  try {
    const rateLimit = await paymentLimiter.limit(userId);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many receipt uploads. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    const { screenshotDataUrl } = body;

    const planResult = PaymentPlanSchema.safeParse({ plan: body.plan });
    if (!planResult.success) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const { plan: planId } = planResult.data;
    const planDetails = getPlanById(planId);

    if (!planDetails) {
      return NextResponse.json({ error: 'Plan details not found.' }, { status: 404 });
    }

    if (!screenshotDataUrl || typeof screenshotDataUrl !== 'string') {
      return NextResponse.json({ error: 'Payment screenshot is required.' }, { status: 400 });
    }

    // Validate it's actually an image data URL
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(screenshotDataUrl)) {
      return NextResponse.json(
        { error: 'Only image files (JPG, PNG, WebP) are accepted.' },
        { status: 400 }
      );
    }

    // Correct size check
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB raw
    const estimatedBytes = screenshotDataUrl.length * 0.73; // base64 → raw estimate
    if (estimatedBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existing = await prisma.paymentRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending verification request. Please wait for it to be reviewed.' },
        { status: 409 }
      );
    }

    if (!isCloudinaryConfigured) {
      return NextResponse.json(
        { error: 'Payment processing is temporarily unavailable. Please contact support.' },
        { status: 503 }
      );
    }

    const uploadResponse = await cloudinary.uploader.upload(screenshotDataUrl, {
      folder: 'bhartiya-rishtey/receipts',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    });

    const amount = planDetails.priceNumeric;

    const paymentReq = await prisma.paymentRequest.create({
      data: {
        userId,
        amount,
        tier: planId,
        screenshotUrl: uploadResponse.secure_url,
        status: 'PENDING',
      },
    });

    await logAction({
      userId,
      ip,
      action: 'PAYMENT_SUBMITTED',
      status: 'SUCCESS',
      details: `Plan: ${planId}, Amount: ₹${amount}`,
    });

    return NextResponse.json(
      { message: 'Payment receipt submitted. Verification typically takes 10–30 minutes.', id: paymentReq.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Payment Request Error:', error);
    await logAction({ userId, ip, action: 'PAYMENT_SUBMITTED', status: 'FAILURE', details: String(error) });
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}
