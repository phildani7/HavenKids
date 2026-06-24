// In-memory limiter. Per-instance only — fine for a single server / dev.
// A durable store (Upstash/Redis) is a later concern (see spec).

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now > w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (w.count >= limit) return false;
  w.count++;
  return true;
}

type Fail = { count: number; lockedUntil: number };
const fails = new Map<string, Fail>();

export function recordFailure(key: string, maxAttempts: number, lockMs: number): void {
  const f = fails.get(key) ?? { count: 0, lockedUntil: 0 };
  f.count++;
  if (f.count >= maxAttempts) f.lockedUntil = Date.now() + lockMs;
  fails.set(key, f);
}

export function isLocked(key: string): boolean {
  const f = fails.get(key);
  return !!f && f.lockedUntil > Date.now();
}

export function resetFailures(key: string): void {
  fails.delete(key);
}
