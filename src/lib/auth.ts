/**
 * FIX: CRITICAL - getUserIdFromRequest was duplicated across 8+ API route files.
 * Centralized here as the single source of truth.
 * Also added role extraction for admin route protection.
 */

import * as jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  iat?: number;
  exp?: number;
}

/**
 * Extracts and verifies the JWT from the vows_session cookie.
 * Returns the decoded payload or null if invalid/missing.
 */
export function getSessionFromRequest(request: Request): JwtPayload | null {
  // FIX: Crash guard - fail safely if JWT_SECRET not configured
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    return null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const tokenRecord = cookieHeader.split(';').find(c => c.trim().startsWith('vows_session='));
  if (!tokenRecord) return null;

  // FIX: Handle URL-encoded cookie values gracefully
  const token = decodeURIComponent(tokenRecord.split('=').slice(1).join('=').trim());

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Convenience: returns just userId or null
 */
export function getUserIdFromRequest(request: Request): string | null {
  return getSessionFromRequest(request)?.userId ?? null;
}

/**
 * Returns a 401 JSON response for unauthorized requests
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
}

/**
 * Returns a 403 JSON response for forbidden requests
 */
export function forbiddenResponse(message = 'You do not have permission to perform this action.') {
  return NextResponse.json({ error: message }, { status: 403 });
}
