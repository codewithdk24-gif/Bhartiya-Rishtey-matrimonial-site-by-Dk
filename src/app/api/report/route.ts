/**
 * FIXES APPLIED:
 * 1. Centralized auth/prisma
 * 2. Added proper Zod validation with enum reasons (original accepted any string)
 * 3. Prevent duplicate reports from same user for same target
 * 4. Admin notification created when a report is filed
 */

import { NextResponse } from 'next/server';
import { ReportSchema } from '@/lib/validations';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const rawData = await request.json();
    const result = ReportSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid report data.', details: result.error.format() },
        { status: 400 }
      );
    }

    const { targetUserId, reason, details } = result.data;

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 });
    }

    // Prevent duplicate pending reports
    const existingReport = await prisma.report.findFirst({
      where: { reporterId: userId, reportedId: targetUserId, status: 'PENDING' },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already submitted a report for this user. Our team is reviewing it.' },
        { status: 409 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: targetUserId,
        reason,
        details: details ?? null,
        status: 'PENDING',
      },
    });

    // Notify admins (find first admin user as recipient - in production use a dedicated admin notification system)
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'SYSTEM',
          message: `New report filed: ${reason}`,
          actionUrl: '/admin/reports',
        },
      });
    }

    return NextResponse.json({ message: 'Report submitted. Thank you for helping keep our platform safe.', id: report.id }, { status: 201 });
  } catch (error) {
    console.error('POST Report Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
