import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
      take: 100,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin Fetch Users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
