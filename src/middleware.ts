/**
 * FIX: CRITICAL SECURITY VULNERABILITY
 *
 * Original middleware was doing:
 *   const payload = JSON.parse(Buffer.from(cookie.split('.')[1], 'base64').toString())
 *
 * This is BASE64 DECODE WITHOUT SIGNATURE VERIFICATION.
 * Any attacker could craft a JWT with role: "ADMIN" and bypass admin routes.
 *
 * Fix: Use `jose` (Edge-compatible) for proper cryptographic JWT verification.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET_RAW = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const protectedRoutes = ['/dashboard', '/discover', '/likes', '/chat', '/onboarding', '/payment'];
  const adminRoutes = ['/admin'];

  const path = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  const isAdmin = adminRoutes.some(route => path.startsWith(route));

  if (!isProtected && !isAdmin) {
    return NextResponse.next();
  }

  // FIX: Guard against missing JWT_SECRET at runtime
  if (!JWT_SECRET_RAW) {
    console.error('FATAL: JWT_SECRET is not configured. Blocking all protected routes.');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookie = request.cookies.get('vows_session')?.value;

  if (!cookie) {
    return NextResponse.redirect(new URL('/login?reason=session_expired', request.url));
  }

  try {
    // FIX: Proper cryptographic verification using jose (Edge runtime compatible)
    const secret = new TextEncoder().encode(JWT_SECRET_RAW);
    const { payload } = await jose.jwtVerify(cookie, secret);

    if (isAdmin && payload.role !== 'ADMIN') {
      // Non-admin tried to access admin panel
      return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
    }

    // FIX: Inject verified userId into request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    // Token expired or invalid - clear the bad cookie and redirect
    const response = NextResponse.redirect(new URL('/login?reason=session_expired', request.url));
    response.cookies.delete('vows_session');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/discover/:path*',
    '/likes/:path*',
    '/chat/:path*',
    '/onboarding/:path*',
    '/payment/:path*',
    '/admin/:path*',
  ],
};
