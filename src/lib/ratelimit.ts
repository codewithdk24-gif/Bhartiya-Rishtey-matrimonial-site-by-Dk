import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const mockLimiter = {
  limit: async (_identifier: string) => ({ success: true, remaining: 100, reset: 0 }),
};

export const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), analytics: true })
  : mockLimiter;

export const signupLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1 m'), analytics: true })
  : mockLimiter;

export const messageLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), analytics: true })
  : mockLimiter;

export const paymentLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, '5 m'), analytics: true })
  : mockLimiter;

export function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
