import type { Endpoint, PayloadRequest } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import type { CruxPayload, RealtimePayload } from '../lib/dashboards/overview-types';
import { isStale, readCache, writeCache } from '../lib/integrations/cache';
import { resolveCruxCredentials, resolveGa4Credentials } from '../lib/integrations/credentials';
import { fetchCrux, resolveCruxOrigin } from '../lib/integrations/kinds/crux';
import { fetchRealtime } from '../lib/integrations/kinds/ga4-realtime';
import { findRowsOfKind } from '../lib/integrations/kinds/types';

const CRUX_KEY = 'crux:default';
const CRUX_TTL_MS = 26 * 60 * 60 * 1000;
const REALTIME_KEY = 'realtime:default';
const REALTIME_TTL_MS = 60 * 1000;

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export const cruxEndpoint: Endpoint = {
  path: '/dashboards/crux',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const force = req.searchParams?.get?.('refresh') === '1';
    const creds = resolveCruxCredentials();
    const cached = await readCache<CruxPayload>(req.payload, 'ga4DataApi', 'global', CRUX_KEY);
    if (cached && !force && !isStale(cached, CRUX_TTL_MS)) {
      return json({ ok: true, configured: true, fromCache: true, capturedAt: cached.capturedAt, payload: cached.payload });
    }
    if (!creds) return json({ ok: true, configured: false, payload: null });
    try {
      const payload = await fetchCrux(creds, resolveCruxOrigin(), []);
      await writeCache(req.payload, 'ga4DataApi', 'global', CRUX_KEY, payload);
      return json({ ok: true, configured: true, fromCache: false, capturedAt: new Date().toISOString(), payload });
    } catch (err) {
      req.payload.logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'crux fetch failed');
      if (cached) {
        return json({ ok: true, configured: true, fromCache: true, stale: true, capturedAt: cached.capturedAt, payload: cached.payload });
      }
      return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
    }
  },
};

export const ga4RealtimeEndpoint: Endpoint = {
  path: '/dashboards/ga4-realtime',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const force = req.searchParams?.get?.('refresh') === '1';
    const cached = await readCache<RealtimePayload>(req.payload, 'ga4DataApi', 'global', REALTIME_KEY);
    if (cached && !force && !isStale(cached, REALTIME_TTL_MS)) {
      return json({ ok: true, configured: true, fromCache: true, payload: cached.payload });
    }
    const rows = await findRowsOfKind(req.payload, 'ga4DataApi');
    const creds = rows
      .map((r) => resolveGa4Credentials(r as unknown as { ga4Config?: { propertyId?: string } }))
      .find((c) => c !== null);
    if (!creds) return json({ ok: true, configured: false, payload: null });
    try {
      const payload = await fetchRealtime(creds);
      await writeCache(req.payload, 'ga4DataApi', 'global', REALTIME_KEY, payload);
      return json({ ok: true, configured: true, fromCache: false, payload });
    } catch (err) {
      req.payload.logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'realtime fetch failed');
      if (cached) return json({ ok: true, configured: true, fromCache: true, payload: cached.payload });
      return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
    }
  },
};
