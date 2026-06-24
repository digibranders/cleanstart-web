import type {
  AttributionRow,
  ContentSnapshot,
  DecayRow,
  IndexationCollectionRow,
  LeaderboardRow,
  LeaderboardsSection,
  OrphanRow,
  VelocityBucket,
} from './types';

export const DECAY_THRESHOLD = 0.3;
export const DECAY_MIN_PRIOR = 20;
export const STALE_MONTHS = 6;
export const ORPHAN_MAX = 2;
export const VELOCITY_BUCKETS = [30, 90] as const;
const TOP_N = 25;

const monthsBetween = (iso: string | null, now: Date): number => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - t) / (1000 * 60 * 60 * 24 * 30);
};

export const deriveDecay = (snap: ContentSnapshot, now: Date = new Date()): DecayRow[] =>
  snap.docs
    .filter((d) => d.sessionsPrior >= DECAY_MIN_PRIOR)
    .map((d) => {
      const lossAbs = d.sessionsPrior - d.sessionsRecent;
      return {
        collection: d.collection,
        id: d.id,
        title: d.title,
        url: d.url,
        updatedAt: d.updatedAt,
        sessionsRecent: d.sessionsRecent,
        sessionsPrior: d.sessionsPrior,
        lossPct: -lossAbs / d.sessionsPrior,
        lossAbs,
        stale: monthsBetween(d.updatedAt, now) >= STALE_MONTHS,
      };
    })
    .filter((r) => r.lossPct <= -DECAY_THRESHOLD)
    .sort((a, b) => b.lossAbs - a.lossAbs)
    .slice(0, TOP_N);

const rollup = (
  snap: ContentSnapshot,
  pick: (d: ContentSnapshot['docs'][number]) => string[],
): LeaderboardRow[] => {
  const acc = new Map<string, LeaderboardRow>();
  for (const d of snap.docs) {
    for (const label of pick(d)) {
      const cur = acc.get(label) ?? { label, docCount: 0, sessions: 0, clicks: 0, conversions: 0 };
      cur.docCount += 1;
      cur.sessions += d.sessionsRecent;
      cur.clicks += d.clicks;
      cur.conversions += d.conversionsRecent;
      acc.set(label, cur);
    }
  }
  return [...acc.values()].sort((a, b) => b.sessions - a.sessions);
};

export const deriveLeaderboards = (snap: ContentSnapshot): LeaderboardsSection => ({
  byAuthor: rollup(snap, (d) => d.authorLabels),
  byCategory: rollup(snap, (d) => d.categoryLabels),
});

export const deriveOrphans = (snap: ContentSnapshot): OrphanRow[] =>
  snap.docs
    .filter((d) => d.publishedAt && d.sessionsRecent <= ORPHAN_MAX && d.impressions <= ORPHAN_MAX)
    .map((d) => ({
      collection: d.collection,
      id: d.id,
      title: d.title,
      url: d.url,
      publishedAt: d.publishedAt,
      sessionsRecent: d.sessionsRecent,
      impressions: d.impressions,
    }))
    .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''));

export const deriveIndexation = (snap: ContentSnapshot): IndexationCollectionRow[] => {
  const acc = new Map<string, IndexationCollectionRow>();
  for (const d of snap.docs) {
    if (!d.publishedAt) continue;
    const cur =
      acc.get(d.collection) ??
      { collection: d.collection, published: 0, indexed: 0, coverage: 0, notIndexed: [] };
    cur.published += 1;
    if (d.indexedProxy) cur.indexed += 1;
    else cur.notIndexed.push({ id: d.id, title: d.title, url: d.url });
    acc.set(d.collection, cur);
  }
  return [...acc.values()]
    .map((r) => ({ ...r, coverage: r.published ? r.indexed / r.published : 0 }))
    .sort((a, b) => a.coverage - b.coverage);
};

export const deriveVelocity = (snap: ContentSnapshot, now: Date = new Date()): VelocityBucket[] => {
  const buckets = [
    { label: 'Last 30 days', maxDays: VELOCITY_BUCKETS[0] },
    { label: 'Last 90 days', maxDays: VELOCITY_BUCKETS[1] },
    { label: 'Older', maxDays: Number.POSITIVE_INFINITY },
  ];
  const dayAge = (iso: string | null): number =>
    iso && Number.isFinite(new Date(iso).getTime())
      ? (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
      : Number.POSITIVE_INFINITY;
  return buckets.map((b, i) => {
    const min = i === 0 ? 0 : (buckets[i - 1]?.maxDays ?? 0);
    const docs = snap.docs.filter(
      (d) => d.publishedAt && dayAge(d.publishedAt) > min && dayAge(d.publishedAt) <= b.maxDays,
    );
    const total = docs.reduce((s, d) => s + d.sessionsRecent, 0);
    return {
      label: b.label,
      docCount: docs.length,
      totalSessions: total,
      avgSessions: docs.length ? Math.round(total / docs.length) : 0,
    };
  });
};

export const deriveAttribution = (snap: ContentSnapshot): AttributionRow[] =>
  snap.docs
    .filter((d) => d.conversionsRecent > 0)
    .map((d) => ({
      collection: d.collection,
      id: d.id,
      title: d.title,
      url: d.url,
      conversions: d.conversionsRecent,
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, TOP_N);

export const keyEventsConfigured = (snap: ContentSnapshot): boolean =>
  snap.docs.some((d) => d.conversionsRecent > 0);
