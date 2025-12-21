type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max = 30, windowSeconds = 60) {
  const now = Date.now();
  const winMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + winMs });
    return { allowed: true, remaining: max - 1, resetAt: now + winMs };
  }

  if (existing.count < max) {
    existing.count += 1;
    buckets.set(key, existing);
    return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt };
  }

  return { allowed: false, remaining: 0, resetAt: existing.resetAt };
}

// For tests and admin: clear limiter
export function resetRateLimiter() {
  buckets.clear();
}
