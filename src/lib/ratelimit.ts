import { Ratelimit } from "@upstash/ratelimit";
import { redis, ratelimit } from "./redis";

/**
 * Login Rate Limiter (5 attempts per minute)
 */
export const loginLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:login",
});

/**
 * Signup Rate Limiter (3 attempts per hour per IP)
 */
export const signupLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:signup",
});

/**
 * Extracts IP from Request for rate limiting
 */
export function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

// Fallback Map for local development if Redis is not configured
const localRateLimits = new Map<string, number>();

/**
 * Checks if a user has exceeded the rate limit.
 * Uses Upstash Redis for persistent tracking if configured.
 * 
 * @param key Unique key (e.g., userId + action)
 * @param limitMs Minimum time between actions in milliseconds (Used for local fallback)
 * @returns Promise<boolean> True if limited, False if allowed
 */
export async function isRateLimited(key: string, limitMs: number = 1000): Promise<boolean> {
  // 1. Try Redis Rate Limiting (Production)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { success } = await ratelimit.limit(key);
      return !success;
    } catch (error) {
      console.error("[RateLimit] Redis connection failed! Fail-safe: blocking and returning error.");
      // Throw error to be caught by API route for 503 response
      throw new Error("RATE_LIMIT_SERVICE_DOWN");
    }
  }

  // 2. Fallback to In-Memory (Development/Local)
  const now = Date.now();
  const lastAction = localRateLimits.get(key) || 0;

  if (now - lastAction < limitMs) {
    return true;
  }

  localRateLimits.set(key, now);
  return false;
}
