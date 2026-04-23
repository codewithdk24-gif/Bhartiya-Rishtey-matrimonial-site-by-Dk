type LimitResult = {
  success: boolean;
  remaining?: number;
  reset?: number;
};

export function getIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "127.0.0.1";
}

// Temporary safe limiter (no blocking — prevents build failure)
export async function isRateLimited(
  _key: string,
  _duration?: number
): Promise<boolean> {
  return false;
}

function createLimiter() {
  return {
    async limit(_key: string): Promise<LimitResult> {
      return {
        success: true,
        remaining: 100,
        reset: Date.now() + 60000,
      };
    },
  };
}

export const loginLimiter = createLimiter();
export const signupLimiter = createLimiter();
export const apiLimiter = createLimiter();
