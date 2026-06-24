import { describe, expect, it } from 'vitest';

import {
  deriveAttribution,
  deriveDecay,
  deriveIndexation,
  deriveLeaderboards,
  deriveOrphans,
  deriveVelocity,
} from './sections';
import type { ContentDocRecord, ContentSnapshot } from './types';

const rec = (over: Partial<ContentDocRecord>): ContentDocRecord => ({
  collection: 'blogs',
  id: '1',
  slug: 's',
  title: 'T',
  url: '/blogs/s',
  authorLabels: [],
  categoryLabels: [],
  publishedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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

const snap = (docs: ContentDocRecord[]): ContentSnapshot => ({
  capturedAt: '2026-06-24T00:00:00.000Z',
  windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
  docs,
  queries: [],
  queryPages: [],
});

describe('deriveDecay', () => {
  it('flags a >=30% session drop and sorts by absolute loss', () => {
    const s = snap([
      rec({ id: 'a', sessionsPrior: 100, sessionsRecent: 50 }),
      rec({ id: 'b', sessionsPrior: 200, sessionsRecent: 120 }),
      rec({ id: 'c', sessionsPrior: 100, sessionsRecent: 95 }),
      rec({ id: 'd', sessionsPrior: 10, sessionsRecent: 1 }),
    ]);
    const out = deriveDecay(s);
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
    expect(out[0]?.lossAbs).toBe(80);
  });
  it('marks stale when updatedAt older than STALE_MONTHS', () => {
    const out = deriveDecay(
      snap([rec({ id: 'a', sessionsPrior: 100, sessionsRecent: 50, updatedAt: '2024-01-01T00:00:00.000Z' })]),
      new Date('2026-06-24T00:00:00.000Z'),
    );
    expect(out[0]?.stale).toBe(true);
  });
});

describe('deriveLeaderboards', () => {
  it('rolls sessions/clicks/conversions up by author and category', () => {
    const out = deriveLeaderboards(
      snap([
        rec({ authorLabels: ['Jane'], categoryLabels: ['Security'], sessionsRecent: 10, clicks: 5 }),
        rec({ authorLabels: ['Jane'], categoryLabels: ['DevOps'], sessionsRecent: 20, clicks: 1 }),
      ]),
    );
    expect(out.byAuthor[0]).toMatchObject({ label: 'Jane', docCount: 2, sessions: 30, clicks: 6 });
    expect(out.byCategory.map((r) => r.label).sort()).toEqual(['DevOps', 'Security']);
  });
});

describe('deriveOrphans', () => {
  it('lists published docs with ~0 sessions and ~0 impressions', () => {
    const out = deriveOrphans(
      snap([
        rec({ id: 'a', sessionsRecent: 0, impressions: 0 }),
        rec({ id: 'b', sessionsRecent: 0, impressions: 0, publishedAt: null }),
        rec({ id: 'c', sessionsRecent: 50, impressions: 0 }),
      ]),
    );
    expect(out.map((r) => r.id)).toEqual(['a']);
  });
});

describe('deriveIndexation', () => {
  it('computes per-collection coverage and lists not-indexed', () => {
    const out = deriveIndexation(
      snap([
        rec({ id: 'a', impressions: 10, indexedProxy: true }),
        rec({ id: 'b', impressions: 0, indexedProxy: false }),
      ]),
    );
    expect(out[0]).toMatchObject({ collection: 'blogs', published: 2, indexed: 1, coverage: 0.5 });
    expect(out[0]?.notIndexed.map((d) => d.id)).toEqual(['b']);
  });
});

describe('deriveVelocity', () => {
  it('buckets by publish recency and averages sessions', () => {
    const now = new Date('2026-06-24T00:00:00.000Z');
    const out = deriveVelocity(
      snap([
        rec({ id: 'a', publishedAt: '2026-06-10T00:00:00.000Z', sessionsRecent: 100 }),
        rec({ id: 'b', publishedAt: '2026-01-01T00:00:00.000Z', sessionsRecent: 40 }),
      ]),
      now,
    );
    const last30 = out.find((b) => b.label === 'Last 30 days');
    expect(last30).toMatchObject({ docCount: 1, avgSessions: 100 });
  });
});

describe('deriveAttribution', () => {
  it('sorts by conversions desc', () => {
    const out = deriveAttribution(
      snap([rec({ id: 'a', conversionsRecent: 2 }), rec({ id: 'b', conversionsRecent: 9 })]),
    );
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
  });
});
