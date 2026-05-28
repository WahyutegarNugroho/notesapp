interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function getRateLimiter(maxRequests: number, windowMs: number) {
  return (key: string): { allowed: boolean; remaining: number; resetIn: number } => {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now };
  };
}

export const apiLimiter = getRateLimiter(60, 60_000);
export const authLimiter = getRateLimiter(10, 60_000);
