import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });
    const pendingPayments = await prisma.paymentRequest.count({
      where: { status: 'PENDING' }
    });
    const totalMatches = await prisma.match.count();

    // Get 5 recent users
    const recentSignups = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shortId: true,
        email: true,
        createdAt: true,
        profile: { select: { fullName: true } }
      }
    });

    return NextResponse.json({
      totalUsers,
      premiumUsers,
      pendingPayments,
      totalMatches,
      recentSignups
    });
  } catch (error) {
    console.error('Admin Stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
