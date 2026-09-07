import { NextRequest } from "next/server";

/**
 * Best-effort, in-memory, per-serverless-instance rate limiting — same
 * caveat as the daily AI token cap in serverKey.ts: Vercel can spin up
 * multiple instances that don't share this module's state, so this throttles
 * "most" abusive traffic rather than guaranteeing a hard ceiling. That's an
 * acceptable defense-in-depth layer against casual brute-forcing/spam, not a
 * substitute for a real distributed rate limiter if abuse becomes a problem.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so this map can't grow unbounded over a long-lived
// instance — runs only when the map gets big enough to matter.
function pruneIfNeeded(windowMs: number) {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > windowMs) buckets.delete(key);
  }
}

/** Returns true if `key` has exceeded `limit` requests within `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  pruneIfNeeded(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

/** Vercel sets x-forwarded-for on every request; falls back to a constant key if it's ever missing (e.g. local dev), which just means everyone shares one bucket there. */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
