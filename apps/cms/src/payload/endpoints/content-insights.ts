import type { Endpoint, PayloadRequest } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { fetchContentSnapshot } from '../lib/content-insights/fetch-snapshot';
import {
  deriveAttribution,
  deriveDecay,
  deriveIndexation,
  deriveLeaderboards,
  deriveOrphans,
  deriveVelocity,
  keyEventsConfigured,
} from '../lib/content-insights/sections';
import type { ContentSnapshot } from '../lib/content-insights/types';
import { isStale, readCache, writeCache } from '../lib/integrations/cache';

const SNAPSHOT_KEY = 'content:snapshot';
const SNAPSHOT_TTL_MS = 26 * 60 * 60 * 1000;

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const sectionsOf = (snap: ContentSnapshot) => ({
  decay: deriveDecay(snap),
  leaderboards: deriveLeaderboards(snap),
  orphans: deriveOrphans(snap),
  indexation: deriveIndexation(snap),
  velocity: deriveVelocity(snap),
  attribution: deriveAttribution(snap),
});

export const contentInsightsEndpoint: Endpoint = {
  path: '/content-insights',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const cached = await readCache<ContentSnapshot>(req.payload, 'ga4DataApi', 'global', SNAPSHOT_KEY);
    if (cached && !isStale(cached, SNAPSHOT_TTL_MS)) {
      const snap = cached.payload;
      return json({
        ok: true,
        configured: true,
        fromCache: true,
        capturedAt: cached.capturedAt,
        keyEventsConfigured: keyEventsConfigured(snap),
        sections: sectionsOf(snap),
      });
    }
    try {
      const snap = await fetchContentSnapshot(req.payload);
      if (snap.docs.length === 0 && !cached) {
        return json({
          ok: true,
          configured: false,
          capturedAt: null,
          fromCache: false,
          keyEventsConfigured: false,
          sections: null,
        });
      }
      await writeCache(req.payload, 'ga4DataApi', 'global', SNAPSHOT_KEY, snap);
      return json({
        ok: true,
        configured: true,
        fromCache: false,
        capturedAt: snap.capturedAt,
        keyEventsConfigured: keyEventsConfigured(snap),
        sections: sectionsOf(snap),
      });
    } catch (err) {
      req.payload.logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'content-insights fetch failed',
      );
      if (cached) {
        const snap = cached.payload;
        return json({
          ok: true,
          configured: true,
          fromCache: true,
          stale: true,
          capturedAt: cached.capturedAt,
          keyEventsConfigured: keyEventsConfigured(snap),
          sections: sectionsOf(snap),
        });
      }
      return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
    }
  },
};
