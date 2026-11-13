import { type Clock, systemClock } from '@/lib/clock';
import { RateLimitError } from '@/server/errors';

export interface RateRule {
  limit: number;
  windowSeconds: number;
}

interface Bucket {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_ABOVE = 10_000;

/**
 * In process fixed window counter (one container, decision 14). Throws RateLimitError with the seconds left in the
 * window once `rule.limit` calls have been made in it. Keys are namespaced: "apply:ip:<ip>", "lookup:user:<id>".
 * shortcut: counters live in memory and reset on restart; move to a Postgres table if the portal runs more than one instance.
 */
export function rateLimit(key: string, rule: RateRule, clock: Clock = systemClock): void {
  const nowMs = clock.now().getTime();
  if (buckets.size > SWEEP_ABOVE) {
    for (const [name, bucket] of buckets) if (bucket.resetAtMs <= nowMs) buckets.delete(name);
  }
  const current = buckets.get(key);
  if (!current || current.resetAtMs <= nowMs) {
    buckets.set(key, { count: 1, resetAtMs: nowMs + rule.windowSeconds * 1000 });
    return;
  }
  if (current.count >= rule.limit) throw new RateLimitError(Math.max(1, Math.ceil((current.resetAtMs - nowMs) / 1000)));
  current.count += 1;
}

/** Tests only: forget every counter. */
export function resetRateLimits(): void {
  buckets.clear();
}
