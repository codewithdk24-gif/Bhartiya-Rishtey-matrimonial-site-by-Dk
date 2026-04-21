import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    db_connected: !!process.env.DATABASE_URL,
    db_url_starts: process.env.DATABASE_URL?.substring(0, 20),
    nextauth_url: process.env.NEXTAUTH_URL,
    env: process.env.NODE_ENV
  });
}
