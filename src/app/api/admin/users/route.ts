import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');

    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { email: { contains: search } },
          { shortId: { contains: search } },
          { phone: { contains: search } },
          { profile: { fullName: { contains: search } } },
        ]
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        shortId: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            isCompleted: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 for performant demo
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin Fetch Users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
