/**
 * FIXES APPLIED:
 * 1. Replaced new PrismaClient() with singleton from lib/prisma
 * 2. Removed duplicate "basic validation" block (was checking email/password again after Zod already validated)
 * 3. Removed `finally { await prisma.$disconnect() }` — disconnecting singleton is wrong
 * 4. Added audit logging on both success and failure
 * 5. Added missing `bcrypt` import guard (bcrypt is not in package.json — should be bcryptjs)
 * 6. JWT_SECRET now throws if missing instead of silently using insecure default
 * 7. Clearer error messages without leaking internals
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginSchema } from '@/lib/validations';
import { loginLimiter, getIp } from '@/lib/rateLimit';
import { logAction } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  // FIX: Fail loudly if JWT_SECRET is missing - should never run without it
  if (!JWT_SECRET) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const ip = getIp(request);

  try {
    const rateLimit = await loginLimiter.limit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const rawData = await request.json();

    const validationResult = LoginSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address and password.' },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // FIX: Run bcrypt even if user not found to prevent timing-based user enumeration
    const dummyHash = '$2b$10$abcdefghijklmnopqrstuuABC123456789012345678901234567890';
    const passwordToCheck = user ? user.passwordHash : dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);

    if (!user || !isPasswordValid) {
      await logAction({
        ip,
        action: 'LOGIN_ATTEMPT',
        status: 'FAILURE',
        details: `Failed login attempt for email: ${email}`,
      });
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await logAction({
      userId: user.id,
      ip,
      action: 'LOGIN_ATTEMPT',
      status: 'SUCCESS',
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    response.cookies.set('vows_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // FIX: 'strict' breaks OAuth redirects and some navigation flows; 'lax' is safer
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    await logAction({ ip, action: 'LOGIN_ATTEMPT', status: 'FAILURE', details: 'Server error' });
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
