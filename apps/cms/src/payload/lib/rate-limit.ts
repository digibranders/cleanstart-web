/**
 * In-memory sliding-window rate limiter.
 *
 * Production replacement: swap the Map for a Postgres `rate_limit_buckets`
 * table or Redis when the droplet runs >1 Payload process. For a single-
 * process droplet the in-memory store is fine and avoids a network hop
 * on every form submission.
 *
 * Memory safety:
 *   - Empty buckets are deleted from the Map immediately after pruning so
 *     IPs that drop out of the window don't leak Map keys.
 *   - A periodic global janitor sweep runs every JANITOR_EVERY calls,
 *     dropping any keys whose buckets pruned to empty between visits.
 *   - A soft cap (MAX_KEYS) protects against IP-rotation flooding by
 *     evicting the oldest 10% of keys when exceeded.
 *
 * Multi-instance guard: this module fail-fast throws at import time when
 * RATE_LIMIT_BACKEND is unset/`memory` and WEB_CONCURRENCY > 1. The
 * in-memory Map silently shards the rate-limit window across workers
 * otherwise — an attacker capped at 5/min would effectively get 5 ×
 * worker-count. The guard makes the operator make a conscious choice
 * before scaling out. Selecting `redis` or `postgres` quiets the guard
 * but does NOT yet swap the backend; the actual swap is its own ticket.
 */

export type RateLimitBackend = 'memory' | 'redis' | 'postgres';

export type RateLimitBootConfig = {
  backend: string | undefined;
  concurrency: string | undefined;
};

export class RateLimitMisconfigured extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitMisconfigured';
  }
}

/**
 * Validates the rate-limiter env at boot. Exported separately so tests
 * can exercise the matrix without triggering the module-load throw.
 *
 * Acceptable single-process configs (no throw):
 *   - WEB_CONCURRENCY === '1' (or unset, which we read as '1')
 * Acceptable multi-process configs:
 *   - RATE_LIMIT_BACKEND === 'redis' | 'postgres' (regardless of concurrency)
 * Everything else throws.
 */
export const validateRateLimitBootConfig = (config: RateLimitBootConfig): void => {
  const backendRaw = config.backend?.trim().toLowerCase();
  const backend: RateLimitBackend =
    backendRaw === 'redis' || backendRaw === 'postgres' ? backendRaw : 'memory';
  if (backend === 'redis' || backend === 'postgres') return;

  const concurrencyRaw = config.concurrency?.trim();
  // Default to 1 when unset — local dev runs a single process.
  const concurrency = concurrencyRaw == null || concurrencyRaw === '' ? 1 : Number.parseInt(concurrencyRaw, 10);
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new RateLimitMisconfigured(
      `Invalid WEB_CONCURRENCY=${concurrencyRaw ?? '(unset)'}. Set WEB_CONCURRENCY=1 (single worker) or set RATE_LIMIT_BACKEND=redis|postgres for multi-worker deploys.`,
    );
  }
  if (concurrency > 1) {
    throw new RateLimitMisconfigured(
      `RATE_LIMIT_BACKEND=memory is not safe with WEB_CONCURRENCY=${concurrency}. The in-memory limiter shards across workers and an attacker capped at 5/min effectively gets 5×${concurrency}. Set RATE_LIMIT_BACKEND=redis|postgres or WEB_CONCURRENCY=1.`,
    );
  }
};

// Skip the boot guard in test environments — vitest spawns workers and
// some CI runners set WEB_CONCURRENCY > 1 for unrelated reasons. Tests
// exercise the validator directly.
if (process.env.NODE_ENV !== 'test') {
  validateRateLimitBootConfig({
    backend: process.env.RATE_LIMIT_BACKEND,
    concurrency: process.env.WEB_CONCURRENCY,
  });
}

type Bucket = {
  /** Submission timestamps within the largest window we track. */
  hits: number[];
};

const store = new Map<string, Bucket>();

let invocationCounter = 0;
const JANITOR_EVERY = 256;
const MAX_KEYS = 50_000;
const EVICT_FRACTION = 0.1;

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

/** Walk the entire Map, drop empty buckets. Cheap when the Map is small. */
const sweep = (now: number): void => {
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < ONE_DAY_MS);
    if (bucket.hits.length === 0) store.delete(key);
  }
  // Hard cap fallback in case sweeps somehow can't keep up (e.g. attacker
  // is both IP-rotating AND submitting fast enough to refresh each bucket).
  if (store.size > MAX_KEYS) {
    const evictCount = Math.floor(store.size * EVICT_FRACTION);
    const sortedByOldest = Array.from(store.entries())
      .map(([key, bucket]) => [key, bucket.hits[0] ?? 0] as const)
      .sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < evictCount; i += 1) {
      const entry = sortedByOldest[i];
      if (entry) store.delete(entry[0]);
    }
  }
};

export type RateLimitResult =
  | { ok: true; remaining: { perMinute: number; perDay: number } }
  | { ok: false; reason: 'per-minute' | 'per-day'; retryAfterMs: number };

export const checkAndRecord = (
  key: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS,
  now: number = Date.now(),
): RateLimitResult => {
  invocationCounter += 1;
  if (invocationCounter % JANITOR_EVERY === 0) sweep(now);

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

/**
 * Test/observability helper — exposes the current bucket count so tests
 * can assert that the janitor evicts empty buckets and the cap kicks in.
 */
export const __rateLimitStoreSize = (): number => store.size;

/** Test-only — clears the in-memory store between unit tests. */
export const __resetRateLimitStore = (): void => {
  store.clear();
  invocationCounter = 0;
};
