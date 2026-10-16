/**
 * Simple, efficient sliding-window in-memory rate limiter for serverless runtimes.
 * Prevents enumeration and brute-force abuse of public verification routes.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (record.resetAt <= now) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  identifier: string,
  limit: number = 30, // max 30 requests
  windowMs: number = 60 * 1000 // per 60 seconds
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = ipMap.get(identifier);

  if (!record || record.resetAt <= now) {
    ipMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}
