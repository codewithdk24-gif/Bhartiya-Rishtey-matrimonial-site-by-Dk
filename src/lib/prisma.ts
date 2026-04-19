/**
 * FIX: CRITICAL - Every API route was instantiating `new PrismaClient()` independently.
 * In Next.js, this causes connection pool exhaustion in development (HMR) and 
 * in production under any meaningful load.
 *
 * This module exports a singleton PrismaClient instance following the official
 * Next.js + Prisma best practice.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
