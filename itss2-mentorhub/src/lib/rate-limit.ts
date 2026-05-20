/**
 * Lightweight in-process rate limiter (token-bucket per key).
 * Suitable cho MVP single-node. Production nên đổi sang Redis/Upstash.
 */
type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { capacity: number; refillPerSec: number },
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsedSec = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsedSec * opts.refillPerSec);
  b.updatedAt = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return { allowed: true, remaining: Math.floor(b.tokens), resetMs: 0 };
  }
  buckets.set(key, b);
  const resetMs = Math.ceil(((1 - b.tokens) / opts.refillPerSec) * 1000);
  return { allowed: false, remaining: 0, resetMs };
}

// Periodic eviction to avoid unbounded map growth.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [k, v] of buckets) if (v.updatedAt < cutoff) buckets.delete(k);
  }, 5 * 60 * 1000).unref?.();
}
