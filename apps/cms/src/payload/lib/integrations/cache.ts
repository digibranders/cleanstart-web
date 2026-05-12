import type { BasePayload } from 'payload';

/**
 * Generic read/write/upsert helpers for the `analyticsCache` collection.
 * All five analytics handlers (GA4, GSC search, GSC inspect, Clarity,
 * Cloudflare Web Analytics) share this cache so the cron + dashboard
 * endpoint can be written once instead of per-provider.
 *
 * Per CLAUDE.md: never read live from the request path — read cached
 * rows + show `· stale ·` if older than the provider's TTL. Crons
 * refresh in the background.
 */

export type CachedProvider =
  | 'ga4DataApi'
  | 'gscSearchAnalyticsApi'
  | 'gscUrlInspectionApi'
  | 'msClarity'
  | 'cloudflareWebAnalytics';

export type CacheScope = 'global' | 'document';

export interface CacheEntry<T = unknown> {
  readonly env: string;
  readonly provider: CachedProvider;
  readonly scope: CacheScope;
  readonly key: string;
  readonly capturedAt: string;
  readonly payload: T;
}

type EnvSlot = 'production' | 'staging' | 'development';

const currentEnv = (): EnvSlot => {
  const e = process.env.PAYLOAD_ENV ?? process.env.NODE_ENV ?? 'production';
  // Map vitest / next dev / etc. onto the three slots the collection allows.
  if (e === 'test' || e === 'development') return 'development';
  if (e === 'staging') return 'staging';
  return 'production';
};

interface CacheRow {
  id: number | string;
  env: string;
  provider: CachedProvider;
  scope: CacheScope;
  key: string;
  capturedAt: string;
  payload: unknown;
}

/**
 * Read the most recent cached payload for a key. Returns `null` if no
 * row exists (request paths should render a placeholder); callers check
 * `capturedAt` against their own TTL to decide whether to badge stale.
 */
export const readCache = async <T = unknown>(
  payload: BasePayload,
  provider: CachedProvider,
  scope: CacheScope,
  key: string,
): Promise<CacheEntry<T> | null> => {
  try {
    const result = await payload.find({
      collection: 'analyticsCache',
      where: {
        and: [
          { env: { equals: currentEnv() } },
          { provider: { equals: provider } },
          { scope: { equals: scope } },
          { key: { equals: key } },
        ],
      },
      sort: '-capturedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const row = result.docs[0] as unknown as CacheRow | undefined;
    if (!row) return null;
    return {
      env: row.env,
      provider: row.provider,
      scope: row.scope,
      key: row.key,
      capturedAt: row.capturedAt,
      payload: row.payload as T,
    };
  } catch {
    return null;
  }
};

/**
 * Insert a fresh cache row. We always insert (vs upsert in place) so
 * the staleness signal is naturally a `LIMIT 1 ORDER BY capturedAt DESC`
 * query. The prune cron deletes everything older than 90 days.
 */
export const writeCache = async <T = unknown>(
  payload: BasePayload,
  provider: CachedProvider,
  scope: CacheScope,
  key: string,
  body: T,
): Promise<void> => {
  try {
    await payload.create({
      collection: 'analyticsCache',
      data: {
        env: currentEnv(),
        provider,
        scope,
        key,
        capturedAt: new Date().toISOString(),
        payload: body as Record<string, unknown>,
      },
      overrideAccess: true,
    });
  } catch {
    // Cache write must never throw into a cron — the next refresh re-tries.
  }
};

/**
 * Returns `true` when the row is older than `ttlMs`. Used by the
 * dashboard endpoint to attach a `stale: true` flag to its response.
 */
export const isStale = (entry: CacheEntry<unknown>, ttlMs: number, now: Date = new Date()): boolean => {
  const t = new Date(entry.capturedAt).getTime();
  if (!Number.isFinite(t)) return true;
  return now.getTime() - t > ttlMs;
};

/** Per-provider staleness thresholds. Match the cron cadence. */
export const TTL_MS = {
  ga4DataApi: 20 * 60 * 1000,            // 15-min cron + slack
  gscSearchAnalyticsApi: 26 * 60 * 60 * 1000, // daily cron + slack
  gscUrlInspectionApi: 60 * 60 * 1000,   // on-demand, 1h soft TTL
  msClarity: 26 * 60 * 60 * 1000,        // daily cron + slack
  cloudflareWebAnalytics: 20 * 60 * 1000, // 15-min cron + slack
} as const satisfies Record<CachedProvider, number>;
