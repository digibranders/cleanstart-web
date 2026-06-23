import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import { COLLECTION_PATH_PREFIX, buildOverviewCacheKey } from '../lib/dashboards/overview-filters';
import { TTL_MS, isStale, readCache, writeCache } from '../lib/integrations/cache';
import { resolveGa4Credentials } from '../lib/integrations/credentials';
import { fetchGa4Overview } from '../lib/integrations/kinds/ga4-overview';
import { findRowsOfKind } from '../lib/integrations/kinds/types';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const querySchema = z.object({
  window: z.enum(['7d', '28d', '90d']).default('28d'),
  country: z.string().min(1).max(80).optional(),
  collection: z.string().min(1).max(40).optional(),
});

export const ga4OverviewEndpoint: Endpoint = {
  path: '/dashboards/ga4-overview',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return json({ ok: false, error: 'bad_params' }, { status: 400 });
    const filters = {
      window: parsed.data.window,
      country: parsed.data.country ?? null,
      collection: parsed.data.collection ?? null,
    };

    const rows = await findRowsOfKind(req.payload, 'ga4DataApi');
    const configured = rows.length > 0;
    const key = buildOverviewCacheKey('ga4', filters);
    const cached = await readCache(req.payload, 'ga4DataApi', 'global', key);
    if (cached && !isStale(cached, TTL_MS.ga4DataApi)) {
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

// Real handler lands in Phase 3 (Task 10). Stub returns "not configured" so the
// dashboard renders its empty state without erroring.
export const gscOverviewEndpoint: Endpoint = {
  path: '/dashboards/gsc-overview',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    return json({ ok: true, configured: false, payload: null });
  },
};
