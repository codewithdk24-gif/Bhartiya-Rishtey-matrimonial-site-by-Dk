import { prisma } from './prisma';

/**
 * Checks if there is a block relationship between two users in BOTH directions.
 * @param userAId First user ID
 * @param userBId Second user ID
 * @returns true if either user has blocked the other, false otherwise.
 */
export async function isBlocked(userAId: string, userBId: string): Promise<boolean> {
  if (!userAId || !userBId) return false;
  if (userAId === userBId) return false;

  const blockCount = await prisma.block.count({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId }
      ]
    }
  });

  return blockCount > 0;
}

/**
 * Gets a list of all user IDs that have blocked the given user, 
 * or that the given user has blocked.
 * Useful for filtering search/discovery results in a single IN query.
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedId: userId }
      ]
    },
    select: {
      blockerId: true,
      blockedId: true
    }
  });

  const ids = new Set<string>();
  blocks.forEach(b => {
    ids.add(b.blockerId);
    ids.add(b.blockedId);
  });
  
  // Remove the current user's own ID from the set
  ids.delete(userId);
  
  return Array.from(ids);
}
