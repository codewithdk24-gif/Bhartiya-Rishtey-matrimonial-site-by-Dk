import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // For security, don't reveal if the user exists or not to unauthenticated clients
    if (!user) {
      return NextResponse.json({ message: 'If the email exists, a reset link has been generated.' }, { status: 200 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetExpires: resetExpires
      }
    });

    // Wait, the user asked for Admin manual handling.
    // In a real system, we'd send an email here.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[DEV/ADMIN] PASSWORD RESET LINK FOR ${email}: \n ${resetUrl}`);

    return NextResponse.json({ 
      success: true, 
      message: 'If the email exists, a reset link has been generated. Please contact Admin if you do not receive an email.' 
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot Password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
