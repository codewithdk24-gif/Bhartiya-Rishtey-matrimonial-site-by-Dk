import { NextResponse } from 'next/server';
import { getPlanLimits, hasAccess, PLAN_HIERARCHY } from '@/lib/plans';

export async function GET() {
  const tests = {
    hierarchy: {
      FREE: PLAN_HIERARCHY['FREE'],
      PRIME: PLAN_HIERARCHY['PRIME'],
      ROYAL: PLAN_HIERARCHY['ROYAL'],
      LEGACY: PLAN_HIERARCHY['LEGACY'],
    },
    limits: {
      FREE: getPlanLimits('FREE'),
      PRIME: getPlanLimits('PRIME'),
      ROYAL: getPlanLimits('ROYAL'),
    },
    access: {
      FREE_can_access_PRIME: hasAccess('FREE', 'PRIME'),
      PRIME_can_access_FREE: hasAccess('PRIME', 'FREE'),
      ROYAL_can_access_PRIME: hasAccess('ROYAL', 'PRIME'),
    }
  };

  return NextResponse.json(tests);
}
