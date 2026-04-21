import { prisma } from './prisma';

/**
 * PHASE 7.1: PLAN LOGIC (FOUNDATION)
 */

// Step 1: Plan Hierarchy
export const PLAN_HIERARCHY: Record<string, number> = {
  'FREE': 0,
  'PRIME': 1,
  'ROYAL': 2,
  'LEGACY': 3,
};

export const PLANS = {
  PRIME: {
    name: 'PRIME',
    price: 1100,
    durationDays: 90,
  },
  ROYAL: {
    name: 'ROYAL',
    price: 2500,
    durationDays: 180,
  },
  LEGACY: {
    name: 'LEGACY',
    price: 4900,
    durationDays: 365,
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
    case 'PRIME':
      return {
        interestLimit: 50,
        messageLimit: 100,
        searchLimit: 1000,
        canShareContact: false,
        canSeeProfileViews: true,
        hasInvisibleMode: false,
      };
    case 'ROYAL':
      return {
        interestLimit: Infinity,
        messageLimit: Infinity,
        searchLimit: Infinity,
        canShareContact: true,
        canSeeProfileViews: true,
        hasInvisibleMode: true,
      };
    case 'LEGACY':
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
