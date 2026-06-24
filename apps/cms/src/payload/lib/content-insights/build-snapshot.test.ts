import { describe, expect, it } from 'vitest';

import { buildSnapshot } from './build-snapshot';

const cmsDoc = {
  collection: 'blogs',
  id: '1',
  slug: 'sbom-101',
  title: 'SBOM 101',
  authorLabels: ['Jane'],
  categoryLabels: ['Security'],
  publishedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const windows = { recentDays: 28, priorDays: 28, gscDays: 90 };

describe('buildSnapshot', () => {
  it('joins GA4 + GSC rows to a CMS doc by path', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows,
      cmsDocs: [cmsDoc],
      ga4Recent: [{ path: '/blogs/sbom-101', sessions: 540, users: 480, conversions: 3 }],
      ga4Prior: [{ path: '/blogs/sbom-101', sessions: 900 }],
      gsc: [{ path: 'https://www.cleanstart.com/blogs/sbom-101', clicks: 120, impressions: 8000, position: 7.3 }],
    });
    expect(snap.docs).toHaveLength(1);
    expect(snap.docs[0]).toMatchObject({
      url: '/blogs/sbom-101',
      sessionsRecent: 540,
      sessionsPrior: 900,
      usersRecent: 480,
      conversionsRecent: 3,
      clicks: 120,
      impressions: 8000,
      indexedProxy: true,
    });
  });

  it('defaults metrics to 0 and indexedProxy false when no analytics rows match', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows,
      cmsDocs: [cmsDoc],
      ga4Recent: [],
      ga4Prior: [],
      gsc: [],
    });
    expect(snap.docs[0]).toMatchObject({ sessionsRecent: 0, sessionsPrior: 0, impressions: 0, indexedProxy: false });
  });

  it('skips CMS docs whose collection has no public path prefix', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows,
      cmsDocs: [{ ...cmsDoc, collection: 'authors' }],
      ga4Recent: [],
      ga4Prior: [],
      gsc: [],
    });
    expect(snap.docs).toEqual([]);
  });
});
