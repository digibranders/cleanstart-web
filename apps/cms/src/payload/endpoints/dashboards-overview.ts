import type { Endpoint, PayloadRequest } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { COLLECTION_PATH_PREFIX, buildOverviewCacheKey } from '../lib/dashboards/overview-filters';
import type { OverviewWindow } from '../lib/dashboards/overview-types';
import { TTL_MS, isStale, readCache, writeCache } from '../lib/integrations/cache';
import { resolveGa4Credentials } from '../lib/integrations/credentials';
import { fetchGa4Overview } from '../lib/integrations/kinds/ga4-overview';
import { fetchGscOverview } from '../lib/integrations/kinds/gsc-overview';
import { getGscCredentialsFromRow } from '../lib/integrations/kinds/gsc-search-analytics';
import { findRowsOfKind } from '../lib/integrations/kinds/types';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const WINDOWS: readonly OverviewWindow[] = ['7d', '28d', '90d'];

// Read query params defensively: `req.query` is not populated for custom
// endpoints in this Payload version, so read from `req.searchParams`
// (a URLSearchParams). Unknown/missing values fall back to safe defaults —
// never a 400, so a bad/absent param degrades to the default view.
const readParam = (req: PayloadRequest, name: string): string | null => {
  const v = req.searchParams?.get?.(name);
  return v && v.length > 0 ? v : null;
};
const readWindow = (req: PayloadRequest): OverviewWindow => {
  const w = readParam(req, 'window');
  return w && (WINDOWS as readonly string[]).includes(w) ? (w as OverviewWindow) : '28d';
};

export const ga4OverviewEndpoint: Endpoint = {
  path: '/dashboards/ga4-overview',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const filters = {
      window: readWindow(req),
      country: readParam(req, 'country'),
      collection: readParam(req, 'collection'),
    };

    const force = readParam(req, 'refresh') === '1';
    const rows = await findRowsOfKind(req.payload, 'ga4DataApi');
    const configured = rows.length > 0;
    const key = buildOverviewCacheKey('ga4', filters);
    const cached = await readCache(req.payload, 'ga4DataApi', 'global', key);
    if (cached && !force && !isStale(cached, TTL_MS.ga4DataApi)) {
      return json({ ok: true, configured: true, fromCache: true, capturedAt: cached.capturedAt, payload: cached.payload });
    }
    if (!configured) return json({ ok: true, configured: false, payload: null });

    for (const row of rows) {
      const creds = resolveGa4Credentials(row as unknown as { ga4Config?: { propertyId?: string } });
      if (!creds) continue;
      try {
        const prefix = filters.collection ? (COLLECTION_PATH_PREFIX[filters.collection] ?? null) : null;
        const payload = await fetchGa4Overview(creds, filters, prefix);
        await writeCache(req.payload, 'ga4DataApi', 'global', key, payload);
        return json({ ok: true, configured: true, fromCache: false, capturedAt: new Date().toISOString(), payload });
      } catch (err) {
        req.payload.logger.warn(
          { error: err instanceof Error ? err.message : String(err), key },
          'ga4 overview fetch failed',
        );
      }
    }
    if (cached) {
      return json({ ok: true, configured: true, fromCache: true, stale: true, capturedAt: cached.capturedAt, payload: cached.payload });
    }
    return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
  },
};

export const gscOverviewEndpoint: Endpoint = {
  path: '/dashboards/gsc-overview',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const window = readWindow(req);
    // GSC overview is window-only (no country/collection segmentation in v1).
    const key = buildOverviewCacheKey('gsc', { window, country: null, collection: null });

    const force = readParam(req, 'refresh') === '1';
    const rows = await findRowsOfKind(req.payload, 'gscSearchAnalyticsApi');
    const configured = rows.length > 0;
    const cached = await readCache(req.payload, 'gscSearchAnalyticsApi', 'global', key);
    if (cached && !force && !isStale(cached, TTL_MS.gscSearchAnalyticsApi)) {
      return json({ ok: true, configured: true, fromCache: true, capturedAt: cached.capturedAt, payload: cached.payload });
    }
    if (!configured) return json({ ok: true, configured: false, payload: null });

    for (const row of rows) {
      const creds = getGscCredentialsFromRow(row);
      if (!creds) continue;
      try {
        const payload = await fetchGscOverview(creds, window);
        await writeCache(req.payload, 'gscSearchAnalyticsApi', 'global', key, payload);
        return json({ ok: true, configured: true, fromCache: false, capturedAt: new Date().toISOString(), payload });
      } catch (err) {
        req.payload.logger.warn(
          { error: err instanceof Error ? err.message : String(err), key },
          'gsc overview fetch failed',
        );
      }
    }
    if (cached) {
      return json({ ok: true, configured: true, fromCache: true, stale: true, capturedAt: cached.capturedAt, payload: cached.payload });
    }
    return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
  },
};
