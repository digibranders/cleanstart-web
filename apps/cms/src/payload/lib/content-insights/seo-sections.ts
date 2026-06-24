import { normalizePath, pathToDocKey } from './page-path';
import type {
  CannibalizationRow,
  ContentSnapshot,
  LowCtrRow,
  StrikingDistanceRow,
} from './types';

export const STRIKING_MIN_POS = 5;
export const STRIKING_MAX_POS = 15;
export const STRIKING_MIN_IMPRESSIONS = 50;
export const LOWCTR_MIN_IMPRESSIONS = 100;
export const LOWCTR_FACTOR = 0.5;
const TOP_N = 25;

// Approximate organic CTR-by-position curve (industry aggregate). Index 0 unused.
const CTR_CURVE = [0, 0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018] as const;
const CTR_TAIL = 0.01; // positions 11..20
const CTR_FLOOR = 0.005; // position > 20

export const expectedCtr = (position: number): number => {
  const p = Math.max(1, Math.round(position));
  if (p <= 10) return CTR_CURVE[p] ?? CTR_TAIL;
  if (p <= 20) return CTR_TAIL;
  return CTR_FLOOR;
};

export const deriveStrikingDistance = (snap: ContentSnapshot): StrikingDistanceRow[] =>
  snap.queries
    .filter(
      (q) =>
        q.position >= STRIKING_MIN_POS &&
        q.position <= STRIKING_MAX_POS &&
        q.impressions >= STRIKING_MIN_IMPRESSIONS,
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, TOP_N)
    .map((q) => ({
      query: q.query,
      position: q.position,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
    }));

export const deriveLowCtr = (snap: ContentSnapshot): LowCtrRow[] =>
  snap.queries
    .filter((q) => q.impressions >= LOWCTR_MIN_IMPRESSIONS)
    .map((q) => {
      const expected = expectedCtr(q.position);
      return {
        query: q.query,
        position: q.position,
        ctr: q.ctr,
        expectedCtr: expected,
        missedClicks: Math.round(q.impressions * Math.max(0, expected - q.ctr)),
      };
    })
    .filter((r) => r.ctr < r.expectedCtr * LOWCTR_FACTOR && r.missedClicks > 0)
    .sort((a, b) => b.missedClicks - a.missedClicks)
    .slice(0, TOP_N);

export const deriveCannibalization = (snap: ContentSnapshot): CannibalizationRow[] => {
  const docByPath = new Map(snap.docs.map((d) => [normalizePath(d.url), d]));
  const byQuery = new Map<string, CannibalizationRow>();
  for (const row of snap.queryPages) {
    if (!pathToDocKey(row.page)) continue;
    const doc = docByPath.get(normalizePath(row.page));
    if (!doc) continue;
    const cur = byQuery.get(row.query) ?? { query: row.query, totalImpressions: 0, pages: [] };
    if (cur.pages.some((p) => p.id === doc.id && p.collection === doc.collection)) continue;
    cur.pages.push({
      collection: doc.collection,
      id: doc.id,
      title: doc.title,
      url: doc.url,
      impressions: row.impressions,
      position: row.position,
    });
    cur.totalImpressions += row.impressions;
    byQuery.set(row.query, cur);
  }
  return [...byQuery.values()]
    .filter((r) => r.pages.length >= 2)
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, TOP_N);
};
