import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({ status: 'USER_NOT_FOUND' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    return NextResponse.json({
      status: 'USER_FOUND',
      password_valid: isValid,
      user_id: user.id,
      user_role: user.role,
      user_plan: user.plan
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'ERROR', message: error.message });
  }
}
