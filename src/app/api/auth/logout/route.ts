/**
 * NEW ROUTE: /api/auth/logout
 * 
 * MISSING FROM ORIGINAL: There was no logout endpoint.
 * The session cookie was never cleared server-side, meaning users
 * had no way to properly sign out.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });

  response.cookies.set('vows_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Immediately expire
    path: '/',
  });

  return response;
}
