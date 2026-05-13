import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import { TTL_MS, isStale, readCache, type CachedProvider } from '../lib/integrations/cache';
import {
  fetchQueriesForUrl,
  getGscCredentialsFromRow,
} from '../lib/integrations/kinds/gsc-search-analytics';
import { inspectUrl } from '../lib/integrations/kinds/gsc-url-inspection';
import { findRowsOfKind } from '../lib/integrations/kinds/types';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const PROVIDERS: readonly CachedProvider[] = [
  'ga4DataApi',
  'gscSearchAnalyticsApi',
  'gscUrlInspectionApi',
  'msClarity',
  'cloudflareWebAnalytics',
];

const providerParam = z.object({
  provider: z.enum([
    'ga4DataApi',
    'gscSearchAnalyticsApi',
    'gscUrlInspectionApi',
    'msClarity',
    'cloudflareWebAnalytics',
  ]),
});

/**
 * GET /api/dashboards/:provider
 *
 * Returns the most recent cached payload for the global L1 card.
 * Never makes a live API call — that's the cron's job. On cache miss
 * returns `{ ok: true, hasData: false }` so the card can render an
 * empty state. On stale rows (older than the provider's TTL) returns
 * the row plus `stale: true` so the badge appears.
 *
 * Auth: admin or editor — the dashboard is visible to all editorial
 * roles.
 */
export const dashboardsGlobalEndpoint: Endpoint = {
  path: '/dashboards/:provider',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const params = providerParam.safeParse(req.routeParams);
    if (!params.success) {
      return json({ ok: false, error: 'unknown_provider' }, { status: 400 });
    }
    const provider = params.data.provider;
    const entry = await readCache(req.payload, provider, 'global', 'default');
    if (!entry) {
      return json({ ok: true, hasData: false, provider });
    }
    return json({
      ok: true,
      hasData: true,
      provider,
      capturedAt: entry.capturedAt,
      stale: isStale(entry, TTL_MS[provider]),
      payload: entry.payload,
    });
  },
};

const docQuerySchema = z.object({
  url: z.string().url().max(2048),
});

/**
 * GET /api/dashboards/per-doc/gsc-queries?url=https://...
 *
 * Per-document GSC query breakdown (L2 tab). On-demand — no cache.
 * Iterates DB rows of kind `gscSearchAnalyticsApi` until one returns
 * data for the URL. Returns `[]` if no row is configured.
 */
export const dashboardsGscPerDocEndpoint: Endpoint = {
  path: '/dashboards/per-doc/gsc-queries',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const parsed = docQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_url' }, { status: 400 });
    }
    const rows = await findRowsOfKind(req.payload, 'gscSearchAnalyticsApi');
    if (rows.length === 0) {
      return json({ ok: true, hasData: false, queries: [] });
    }
    for (const row of rows) {
      const creds = getGscCredentialsFromRow(row);
      if (!creds) continue;
      try {
        const queries = await fetchQueriesForUrl(creds, parsed.data.url);
        return json({ ok: true, hasData: queries.length > 0, queries });
      } catch (err) {
        req.payload.logger.warn(
          { error: err instanceof Error ? err.message : String(err), url: parsed.data.url },
          'gsc per-doc query failed',
        );
      }
    }
    return json({ ok: true, hasData: false, queries: [] });
  },
};

/**
 * POST /api/dashboards/per-doc/gsc-inspect
 *
 * On-demand GSC URL Inspection. Quota-gated by the user click.
 */
export const dashboardsGscInspectEndpoint: Endpoint = {
  path: '/dashboards/per-doc/gsc-inspect',
  method: 'post',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    let body: unknown;
    try {
      body = await (req.json ? req.json() : Promise.resolve({}));
    } catch {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }
    const parsed = z.object({ url: z.string().url().max(2048) }).safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_url' }, { status: 400 });
    }
    const rows = await findRowsOfKind(req.payload, 'gscUrlInspectionApi');
    for (const row of rows) {
      try {
        const result = await inspectUrl(row, parsed.data.url);
        if (result) return json({ ok: true, result });
      } catch (err) {
        req.payload.logger.warn(
          { error: err instanceof Error ? err.message : String(err), url: parsed.data.url },
          'gsc inspect failed',
        );
      }
    }
    return json({ ok: true, result: null });
  },
};

export const dashboardEndpointProviders = PROVIDERS;
