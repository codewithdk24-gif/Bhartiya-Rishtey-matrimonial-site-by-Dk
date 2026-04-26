import { prisma } from './prisma';

/**
 * PHASE 7.1: PLAN LOGIC (FOUNDATION)
 */

// Step 1: Plan Hierarchy
export const PLAN_HIERARCHY: Record<string, number> = {
  'FREE': 0,
  'BASIC': 1,
  'PRIME': 2,
  'ELITE': 3,
};

export const PLANS = {
  BASIC: {
    name: 'BASIC',
    price: 499,
    durationDays: 30,
  },
  PRIME: {
    name: 'PRIME',
    price: 1100,
    durationDays: 90,
  },
  ELITE: {
    name: 'ELITE',
    price: 1999,
    durationDays: 180,
  }
};

// Step 2: Plan Limits
export interface PlanLimits {
  interestLimit: number;
  messageLimit: number;
  searchLimit: number;
  canShareContact: boolean;
  canSeeProfileViews: boolean;
  hasInvisibleMode: boolean;
}

export function getPlanLimits(plan: string): PlanLimits {
  const p = plan.toUpperCase();
  
  switch (p) {
    case 'BASIC':
      return {
        interestLimit: 20,
        messageLimit: 50,
        searchLimit: 500,
        canShareContact: false,
        canSeeProfileViews: true,
        hasInvisibleMode: false,
      };
    case 'PRIME':
      return {
        interestLimit: 100,
        messageLimit: 500,
        searchLimit: Infinity,
        canShareContact: true,
        canSeeProfileViews: true,
        hasInvisibleMode: false,
      };
    case 'ELITE':
      return {
        interestLimit: Infinity,
        messageLimit: Infinity,
        searchLimit: Infinity,
        canShareContact: true,
        canSeeProfileViews: true,
        hasInvisibleMode: true,
      };
    case 'FREE':
    default:
      return {
        interestLimit: 5,
        messageLimit: 10,
        searchLimit: 100,
        canShareContact: false,
        canSeeProfileViews: false,
        hasInvisibleMode: false,
      };
  }
}

/**
 * Check if user has required plan access
 */
export function hasAccess(userPlan: string, requiredPlan: string): boolean {
  const userLevel = PLAN_HIERARCHY[userPlan.toUpperCase()] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan.toUpperCase()] || 0;
  return userLevel >= requiredLevel;
}

// Step 3: Standard Error Helper
export function getUpgradeError(feature: string, requiredPlan: string) {
  return {
    error: "UPGRADE_REQUIRED",
    feature,
    requiredPlan,
    upgradeUrl: "/premium"
  };
}

/**
 * Step 4: Plan Expiry Check
 * Checks if user's plan has expired and downgrades to FREE if necessary.
 */
export async function checkPlanExpiry(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true }
  });

  if (!user || user.plan === 'FREE' || !user.planExpiresAt) return user;

  const now = new Date();
  if (user.planExpiresAt < now) {
    // Plan expired! Downgrade to FREE
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'FREE',
        planExpiresAt: null
      }
    });
    return updated;
  }

  return user;
}
