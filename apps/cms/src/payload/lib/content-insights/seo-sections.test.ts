import { describe, expect, it } from 'vitest';

import {
  deriveCannibalization,
  deriveLowCtr,
  deriveStrikingDistance,
  expectedCtr,
} from './seo-sections';
import type { ContentDocRecord, ContentSnapshot } from './types';

const snap = (over: Partial<ContentSnapshot>): ContentSnapshot => ({
  capturedAt: '2026-06-24T00:00:00.000Z',
  windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
  docs: [],
  queries: [],
  queryPages: [],
  ...over,
});

const doc = (over: Partial<ContentDocRecord>): ContentDocRecord => ({
  collection: 'blogs',
  id: '1',
  slug: 's',
  title: 'T',
  url: '/blogs/s',
  authorLabels: [],
  categoryLabels: [],
  publishedAt: null,
  updatedAt: null,
  sessionsRecent: 0,
  sessionsPrior: 0,
  usersRecent: 0,
  conversionsRecent: 0,
  clicks: 0,
  impressions: 0,
  position: 0,
  indexedProxy: false,
  ...over,
});

describe('expectedCtr', () => {
  it('returns the curve value for a rank and clamps the tail', () => {
    expect(expectedCtr(1)).toBeGreaterThan(expectedCtr(5));
    expect(expectedCtr(50)).toBe(expectedCtr(21));
  });
});

describe('deriveStrikingDistance', () => {
  it('keeps queries in the 5-15 band above the impression floor, sorted by impressions', () => {
    const out = deriveStrikingDistance(
      snap({
        queries: [
          { query: 'a', clicks: 1, impressions: 800, ctr: 0.001, position: 7 },
          { query: 'b', clicks: 1, impressions: 900, ctr: 0.001, position: 12 },
          { query: 'c', clicks: 1, impressions: 900, ctr: 0.1, position: 2 },
          { query: 'd', clicks: 0, impressions: 10, ctr: 0, position: 9 },
        ],
      }),
    );
    expect(out.map((r) => r.query)).toEqual(['b', 'a']);
  });
});

describe('deriveLowCtr', () => {
  it('flags queries whose CTR is well below the expected curve, ranked by missed clicks', () => {
    const out = deriveLowCtr(
      snap({
        queries: [
          { query: 'under', clicks: 2, impressions: 1000, ctr: 0.002, position: 3 },
          { query: 'fine', clicks: 50, impressions: 200, ctr: 0.25, position: 3 },
          { query: 'tiny', clicks: 0, impressions: 10, ctr: 0, position: 3 },
        ],
      }),
    );
    expect(out.map((r) => r.query)).toEqual(['under']);
    expect(out[0]?.missedClicks).toBeGreaterThan(0);
  });
});

describe('deriveCannibalization', () => {
  it('flags queries where >=2 known docs rank, joined to docs', () => {
    const out = deriveCannibalization(
      snap({
        docs: [doc({ id: '1', url: '/blogs/a', title: 'A' }), doc({ id: '2', url: '/blogs/b', title: 'B' })],
        queryPages: [
          { query: 'sbom', page: '/blogs/a', clicks: 5, impressions: 300, position: 6 },
          { query: 'sbom', page: '/blogs/b', clicks: 2, impressions: 200, position: 9 },
          { query: 'solo', page: '/blogs/a', clicks: 1, impressions: 100, position: 4 },
          { query: 'ext', page: '/unknown/x', clicks: 1, impressions: 50, position: 3 },
        ],
      }),
    );
    expect(out.map((r) => r.query)).toEqual(['sbom']);
    expect(out[0]?.pages.map((p) => p.id).sort()).toEqual(['1', '2']);
    expect(out[0]?.totalImpressions).toBe(500);
  });
});
