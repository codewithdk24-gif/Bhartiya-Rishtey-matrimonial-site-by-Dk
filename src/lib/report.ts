import { prisma } from './prisma';

/**
 * Gets the current report status and restriction level for a user.
 * @param userId User ID to check
 * @returns { reportCount, isRestricted }
 */
export async function getReportStatus(userId: string) {
  if (!userId) return { reportCount: 0, isRestricted: false };

  // Count active/valid reports
  const reportCount = await prisma.report.count({
    where: { reportedId: userId }
  });

  // Check for manual admin restriction (ACTION_TAKEN)
  const manualRestriction = await prisma.report.findFirst({
    where: { 
      reportedId: userId,
      status: 'ACTION_TAKEN'
    }
  });

  // Step 3 & 7 Logic:
  // IF >= 5 OR manual override: restrict user
  return {
    reportCount,
    isRestricted: reportCount >= 5 || !!manualRestriction
  };
}
