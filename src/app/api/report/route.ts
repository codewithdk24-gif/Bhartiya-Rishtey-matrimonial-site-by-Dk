import { NextResponse } from 'next/server';
import { getUserIdFromRequest, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { getReportStatus } from '@/lib/report';

/**
 * GET: List reports (Admin Basic)
 * Step 6: ADMIN API
 */
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  // Step 1: Admin Route Protection (Role Check)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  try {
    const reports = await prisma.report.findMany({
      where: status ? { status: status as any } : {},
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true, profile: { select: { fullName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET Reports Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Update report status (Moderation)
 * Step 6: STATUS UPDATE API
 */
export async function PATCH(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  // Role Check
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const { reportId, status, reviewNote } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Missing reportId or status' }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as any,
        reviewNote,
        reviewedBy: userId,
        updatedAt: new Date()
      }
    });

    // If action taken, notify the reported user
    if (status === 'ACTION_TAKEN') {
      await createNotification({
        userId: updated.reportedId,
        type: 'SYSTEM_ALERT',
        message: 'MODERATION NOTICE: Your account has been restricted by an administrator.',
        link: '/profile'
      });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error('PATCH Report Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Create a report
 * Step 2 & 3: REPORT API + AUTO FLAG
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorizedResponse();

  try {
    const { reportedUserId, reason, description } = await request.json();

    if (!reportedUserId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (userId === reportedUserId) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 });
    }

    // 1. Check duplicate report
    const existing = await prisma.report.findFirst({
      where: { reporterId: userId, reportedId: reportedUserId }
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reported this user' }, { status: 409 });
    }

    // 2. Create report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: reportedUserId,
        reason,
        description,
        status: 'PENDING'
      }
    });

    // 3. Step 3: Auto Flag Logic
    const { reportCount } = await getReportStatus(reportedUserId);

    if (reportCount === 3) {
      // Create system notification (warning)
      await createNotification({
        userId: reportedUserId,
        type: 'SYSTEM_ALERT',
        message: 'WARNING: Your account has received multiple reports. Please review our community guidelines to avoid restriction.',
        link: '/profile'
      });
    } else if (reportCount >= 5) {
      // Create restriction notification
      await createNotification({
        userId: reportedUserId,
        type: 'SYSTEM_ALERT',
        message: 'NOTICE: Your account has been restricted due to multiple community reports. Some features are now disabled.',
        link: '/profile'
      });
    }

    return NextResponse.json({ success: true, reportId: report.id });

  } catch (error) {
    console.error('POST Report Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
