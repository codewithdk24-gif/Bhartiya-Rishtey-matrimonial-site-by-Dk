import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');

    let userFilter = {};
    if (search) {
      userFilter = {
        OR: [
          { email: { contains: search } },
          { shortId: { contains: search } },
          { profile: { fullName: { contains: search } } },
        ]
      };
    }

    const premiumUsers = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        user: userFilter
      },
      include: {
        user: {
          select: {
            id: true,
            shortId: true,
            email: true,
            phone: true,
            createdAt: true,
            profile: {
              select: {
                fullName: true,
                isCompleted: true,
              }
            }
          }
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    return NextResponse.json(premiumUsers);
  } catch (error) {
    console.error('Admin Fetch Premium Users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
