/**
 * In-memory sliding-window rate limiter.
 *
 * Production replacement: swap the Map for a Postgres `rate_limit_buckets`
 * table or Redis when the droplet runs >1 Payload process. For a single-
 * process droplet the in-memory store is fine and avoids a network hop
 * on every form submission.
 */

type Bucket = {
  /** Submission timestamps within the largest window we track. */
  hits: number[];
};

const store = new Map<string, Bucket>();

export type RateLimitConfig = {
  perMinute: number;
  perDay: number;
};

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  perMinute: 5,
  perDay: 50,
};

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const prune = (bucket: Bucket, now: number): void => {
  bucket.hits = bucket.hits.filter((t) => now - t < ONE_DAY_MS);
};

export type RateLimitResult =
  | { ok: true; remaining: { perMinute: number; perDay: number } }
  | { ok: false; reason: 'per-minute' | 'per-day'; retryAfterMs: number };

export const checkAndRecord = (
  key: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS,
  now: number = Date.now(),
): RateLimitResult => {
  const bucket = store.get(key) ?? { hits: [] };
  prune(bucket, now);

  const lastMinute = bucket.hits.filter((t) => now - t < ONE_MINUTE_MS).length;
  const lastDay = bucket.hits.length;

  if (lastMinute >= config.perMinute) {
    const oldestInWindow = bucket.hits.find((t) => now - t < ONE_MINUTE_MS) ?? now;
    return {
      ok: false,
      reason: 'per-minute',
      retryAfterMs: ONE_MINUTE_MS - (now - oldestInWindow),
    };
  }

  if (lastDay >= config.perDay) {
    const oldestInDay = bucket.hits[0] ?? now;
    return {
      ok: false,
      reason: 'per-day',
      retryAfterMs: ONE_DAY_MS - (now - oldestInDay),
    };
  }

  bucket.hits.push(now);
  store.set(key, bucket);

  return {
    ok: true,
    remaining: {
      perMinute: config.perMinute - lastMinute - 1,
      perDay: config.perDay - lastDay - 1,
    },
  };
};

/** Test-only — clears the in-memory store between unit tests. */
export const __resetRateLimitStore = (): void => {
  store.clear();
};
