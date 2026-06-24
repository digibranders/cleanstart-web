# Phase 3 — Content Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dedicated `/admin/content-insights` admin page with six content-joined sections — decay/refresh queue, author & category leaderboards, conversion attribution (gated), orphan audit, indexation rollup, and new-content velocity — all fed by one daily per-document snapshot in `analyticsCache`.

**Architecture:** A daily cron joins GA4 per-page (recent + prior window), GSC per-page (90d), and CMS metadata into one `ContentSnapshot` blob (`analyticsCache`, `scope:'global'`, key `content:snapshot`). Pure derivation functions slice that snapshot into the six section payloads. A read-through endpoint serves them (computes on miss). A custom admin view renders them; every row links to the doc editor. No new collection, no migration.

**Tech Stack:** Payload 3 (custom admin views + endpoints + cron tasks), `@google-analytics/data`, `googleapis` (GSC), React 19 client components, inline SVG, Vitest. Reuses Phase-1/2 plumbing: `analyticsCache`, `cache.ts`, `buildClient`, `resolveGa4Credentials`, `getGscCredentialsFromRow`, `findRowsOfKind`, `hasAnyRole`.

**Design spec:** `docs/superpowers/specs/2026-06-24-content-intelligence-design.md`

---

## File Structure

**Create:**
- `apps/cms/src/payload/lib/content-insights/types.ts` — snapshot + section payload types.
- `apps/cms/src/payload/lib/content-insights/page-path.ts` — path↔doc mapping (pure).
- `apps/cms/src/payload/lib/content-insights/page-path.test.ts`
- `apps/cms/src/payload/lib/content-insights/sections.ts` — constants + six derivations (pure).
- `apps/cms/src/payload/lib/content-insights/sections.test.ts`
- `apps/cms/src/payload/lib/content-insights/build-snapshot.ts` — pure shaper (rows → snapshot).
- `apps/cms/src/payload/lib/content-insights/build-snapshot.test.ts`
- `apps/cms/src/payload/lib/content-insights/fetch-snapshot.ts` — GA4+GSC+CMS fetch orchestration.
- `apps/cms/src/payload/endpoints/content-insights.ts` — read-through endpoint.
- `apps/cms/src/payload/jobs/refresh-content-insights.ts` — daily cron.
- `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsView.tsx` — server shell.
- `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx` — client.
- `apps/cms/src/payload/admin/components/ContentInsights/DecayQueue.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/Leaderboards.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/OrphanAudit.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/IndexationRollup.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/VelocityPanel.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/AttributionPanel.tsx`
- `apps/cms/src/app/(payload)/styles/_content-insights.scss`

**Modify:**
- `apps/cms/src/payload.config.ts` — register endpoint, `views.contentInsights`, the cron task + autoRun entry.
- `apps/cms/src/payload/admin/components/SidebarHeader.tsx` — add the nav link.
- `apps/cms/src/app/(payload)/custom.scss` — `@use './styles/content-insights';`.
- `CLAUDE.md` — add the cron to the background-jobs table.

---

## Phase 1 — Snapshot backbone

### Task 1: Types

**Files:**
- Create: `apps/cms/src/payload/lib/content-insights/types.ts`

- [ ] **Step 1: Write the types**

```ts
export interface ContentDocRecord {
  collection: string;
  id: string;
  slug: string;
  title: string;
  url: string;
  authorLabels: string[];
  categoryLabels: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  sessionsRecent: number;
  sessionsPrior: number;
  usersRecent: number;
  conversionsRecent: number;
  clicks: number;
  impressions: number;
  position: number;
  indexedProxy: boolean;
}

export interface ContentSnapshot {
  capturedAt: string;
  windows: { recentDays: number; priorDays: number; gscDays: number };
  docs: ContentDocRecord[];
}

export interface DecayRow {
  collection: string; id: string; title: string; url: string;
  updatedAt: string | null;
  sessionsRecent: number; sessionsPrior: number;
  lossPct: number;   // negative = decline, e.g. -0.42
  lossAbs: number;   // sessionsPrior - sessionsRecent (positive when declining)
  stale: boolean;    // updatedAt older than STALE_MONTHS
}

export interface LeaderboardRow {
  label: string; docCount: number; sessions: number; clicks: number; conversions: number;
}
export interface LeaderboardsSection {
  byAuthor: LeaderboardRow[];
  byCategory: LeaderboardRow[];
}

export interface OrphanRow {
  collection: string; id: string; title: string; url: string;
  publishedAt: string | null; sessionsRecent: number; impressions: number;
}

export interface IndexationCollectionRow {
  collection: string; published: number; indexed: number; coverage: number; // 0..1
  notIndexed: Array<{ id: string; title: string; url: string }>;
}

export interface VelocityBucket {
  label: string; docCount: number; avgSessions: number; totalSessions: number;
}

export interface AttributionRow {
  collection: string; id: string; title: string; url: string; conversions: number;
}

export interface ContentInsightsResponse {
  ok: boolean;
  configured: boolean;
  capturedAt: string | null;
  fromCache: boolean;
  keyEventsConfigured: boolean;
  sections: {
    decay: DecayRow[];
    leaderboards: LeaderboardsSection;
    orphans: OrphanRow[];
    indexation: IndexationCollectionRow[];
    velocity: VelocityBucket[];
    attribution: AttributionRow[];
  } | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/types.ts
git commit -m "feat(cms): content-insights snapshot + section types"
```

---

### Task 2: Page ↔ document path mapping (TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/content-insights/page-path.ts`
- Test: `apps/cms/src/payload/lib/content-insights/page-path.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { docPath, normalizePath, pathToDocKey } from './page-path';

describe('normalizePath', () => {
  it('strips origin, query, hash, trailing slash', () => {
    expect(normalizePath('https://www.cleanstart.com/blogs/sbom-101/?x=1#h')).toBe('/blogs/sbom-101');
  });
  it('keeps a bare path and leading slash', () => {
    expect(normalizePath('/guide/hardened-container-image')).toBe('/guide/hardened-container-image');
    expect(normalizePath('news/foo')).toBe('/news/foo');
  });
  it('normalizes the site root to "/"', () => {
    expect(normalizePath('https://www.cleanstart.com/')).toBe('/');
  });
});

describe('docPath', () => {
  it('joins the collection prefix with the slug', () => {
    expect(docPath('blogs', 'sbom-101')).toBe('/blogs/sbom-101');
    expect(docPath('knowledgeBase', 'dev-vs-prod-images')).toBe('/knowledge-hub/dev-vs-prod-images');
  });
  it('returns null for a collection with no public prefix', () => {
    expect(docPath('authors', 'jane')).toBeNull();
  });
});

describe('pathToDocKey', () => {
  it('maps a path to {collection, slug} by longest prefix', () => {
    expect(pathToDocKey('/blogs/sbom-101')).toEqual({ collection: 'blogs', slug: 'sbom-101' });
    expect(pathToDocKey('/knowledge-hub/dev-vs-prod-images')).toEqual({ collection: 'knowledgeBase', slug: 'dev-vs-prod-images' });
  });
  it('returns null for unmapped or prefix-only paths', () => {
    expect(pathToDocKey('/about-us')).toBeNull();
    expect(pathToDocKey('/blogs')).toBeNull();
    expect(pathToDocKey('/')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- page-path`
Expected: FAIL ("Cannot find module './page-path'").

- [ ] **Step 3: Implement**

```ts
import { COLLECTION_PATH_PREFIX } from '../dashboards/overview-filters';

export const normalizePath = (input: string): string => {
  let p = input.trim();
  p = p.replace(/^https?:\/\/[^/]+/i, '');
  p = p.replace(/[?#].*$/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
};

export const docPath = (collection: string, slug: string): string | null => {
  const prefix = COLLECTION_PATH_PREFIX[collection];
  return prefix ? `${prefix}/${slug}` : null;
};

export const pathToDocKey = (input: string): { collection: string; slug: string } | null => {
  const path = normalizePath(input);
  let best: { collection: string; prefix: string } | null = null;
  for (const [collection, prefix] of Object.entries(COLLECTION_PATH_PREFIX)) {
    if ((path === prefix || path.startsWith(`${prefix}/`)) && (!best || prefix.length > best.prefix.length)) {
      best = { collection, prefix };
    }
  }
  if (!best) return null;
  const slug = path.slice(best.prefix.length + 1);
  if (!slug || slug.includes('/')) return null;
  return { collection: best.collection, slug };
};
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- page-path`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/page-path.ts apps/cms/src/payload/lib/content-insights/page-path.test.ts
git commit -m "feat(cms): content-insights page<->doc path mapping (TDD)"
```

---

### Task 3: Section derivations (TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/content-insights/sections.ts`
- Test: `apps/cms/src/payload/lib/content-insights/sections.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  deriveAttribution, deriveDecay, deriveIndexation, deriveLeaderboards,
  deriveOrphans, deriveVelocity,
} from './sections';
import type { ContentDocRecord, ContentSnapshot } from './types';

const rec = (over: Partial<ContentDocRecord>): ContentDocRecord => ({
  collection: 'blogs', id: '1', slug: 's', title: 'T', url: '/blogs/s',
  authorLabels: [], categoryLabels: [], publishedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z', sessionsRecent: 0, sessionsPrior: 0,
  usersRecent: 0, conversionsRecent: 0, clicks: 0, impressions: 0, position: 0,
  indexedProxy: false, ...over,
});

const snap = (docs: ContentDocRecord[]): ContentSnapshot => ({
  capturedAt: '2026-06-24T00:00:00.000Z',
  windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
  docs,
});

describe('deriveDecay', () => {
  it('flags a >=30% session drop and sorts by absolute loss', () => {
    const s = snap([
      rec({ id: 'a', sessionsPrior: 100, sessionsRecent: 50 }),  // -50% loss 50
      rec({ id: 'b', sessionsPrior: 200, sessionsRecent: 120 }), // -40% loss 80
      rec({ id: 'c', sessionsPrior: 100, sessionsRecent: 95 }),  // -5% not decayed
      rec({ id: 'd', sessionsPrior: 10, sessionsRecent: 1 }),    // below DECAY_MIN_PRIOR
    ]);
    const out = deriveDecay(s);
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
    expect(out[0]?.lossAbs).toBe(80);
  });
  it('marks stale when updatedAt older than STALE_MONTHS', () => {
    const out = deriveDecay(snap([
      rec({ id: 'a', sessionsPrior: 100, sessionsRecent: 50, updatedAt: '2024-01-01T00:00:00.000Z' }),
    ]), new Date('2026-06-24T00:00:00.000Z'));
    expect(out[0]?.stale).toBe(true);
  });
});

describe('deriveLeaderboards', () => {
  it('rolls sessions/clicks/conversions up by author and category', () => {
    const out = deriveLeaderboards(snap([
      rec({ authorLabels: ['Jane'], categoryLabels: ['Security'], sessionsRecent: 10, clicks: 5 }),
      rec({ authorLabels: ['Jane'], categoryLabels: ['DevOps'], sessionsRecent: 20, clicks: 1 }),
    ]));
    expect(out.byAuthor[0]).toMatchObject({ label: 'Jane', docCount: 2, sessions: 30, clicks: 6 });
    expect(out.byCategory.map((r) => r.label).sort()).toEqual(['DevOps', 'Security']);
  });
});

describe('deriveOrphans', () => {
  it('lists published docs with ~0 sessions and ~0 impressions', () => {
    const out = deriveOrphans(snap([
      rec({ id: 'a', sessionsRecent: 0, impressions: 0 }),
      rec({ id: 'b', sessionsRecent: 0, impressions: 0, publishedAt: null }), // not published
      rec({ id: 'c', sessionsRecent: 50, impressions: 0 }),
    ]));
    expect(out.map((r) => r.id)).toEqual(['a']);
  });
});

describe('deriveIndexation', () => {
  it('computes per-collection coverage and lists not-indexed', () => {
    const out = deriveIndexation(snap([
      rec({ id: 'a', impressions: 10, indexedProxy: true }),
      rec({ id: 'b', impressions: 0, indexedProxy: false }),
    ]));
    expect(out[0]).toMatchObject({ collection: 'blogs', published: 2, indexed: 1, coverage: 0.5 });
    expect(out[0]?.notIndexed.map((d) => d.id)).toEqual(['b']);
  });
});

describe('deriveVelocity', () => {
  it('buckets by publish recency and averages sessions', () => {
    const now = new Date('2026-06-24T00:00:00.000Z');
    const out = deriveVelocity(snap([
      rec({ id: 'a', publishedAt: '2026-06-10T00:00:00.000Z', sessionsRecent: 100 }), // <=30d
      rec({ id: 'b', publishedAt: '2026-01-01T00:00:00.000Z', sessionsRecent: 40 }),  // older
    ]), now);
    const last30 = out.find((b) => b.label === 'Last 30 days');
    expect(last30).toMatchObject({ docCount: 1, avgSessions: 100 });
  });
});

describe('deriveAttribution', () => {
  it('sorts by conversions desc', () => {
    const out = deriveAttribution(snap([
      rec({ id: 'a', conversionsRecent: 2 }), rec({ id: 'b', conversionsRecent: 9 }),
    ]));
    expect(out.map((r) => r.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- sections`
Expected: FAIL ("Cannot find module './sections'").

- [ ] **Step 3: Implement**

```ts
import type {
  AttributionRow, ContentSnapshot, DecayRow, IndexationCollectionRow,
  LeaderboardRow, LeaderboardsSection, OrphanRow, VelocityBucket,
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
        collection: d.collection, id: d.id, title: d.title, url: d.url, updatedAt: d.updatedAt,
        sessionsRecent: d.sessionsRecent, sessionsPrior: d.sessionsPrior,
        lossPct: -lossAbs / d.sessionsPrior, lossAbs,
        stale: monthsBetween(d.updatedAt, now) >= STALE_MONTHS,
      };
    })
    .filter((r) => r.lossPct <= -DECAY_THRESHOLD)
    .sort((a, b) => b.lossAbs - a.lossAbs)
    .slice(0, TOP_N);

const rollup = (snap: ContentSnapshot, pick: (d: ContentSnapshot['docs'][number]) => string[]): LeaderboardRow[] => {
  const acc = new Map<string, LeaderboardRow>();
  for (const d of snap.docs) {
    for (const label of pick(d)) {
      const cur = acc.get(label) ?? { label, docCount: 0, sessions: 0, clicks: 0, conversions: 0 };
      cur.docCount += 1; cur.sessions += d.sessionsRecent; cur.clicks += d.clicks; cur.conversions += d.conversionsRecent;
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
      collection: d.collection, id: d.id, title: d.title, url: d.url,
      publishedAt: d.publishedAt, sessionsRecent: d.sessionsRecent, impressions: d.impressions,
    }))
    .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''));

export const deriveIndexation = (snap: ContentSnapshot): IndexationCollectionRow[] => {
  const acc = new Map<string, IndexationCollectionRow>();
  for (const d of snap.docs) {
    if (!d.publishedAt) continue;
    const cur = acc.get(d.collection) ?? { collection: d.collection, published: 0, indexed: 0, coverage: 0, notIndexed: [] };
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
    { label: 'Last 30 days', maxDays: 30 },
    { label: 'Last 90 days', maxDays: 90 },
    { label: 'Older', maxDays: Number.POSITIVE_INFINITY },
  ];
  const dayAge = (iso: string | null): number =>
    iso && Number.isFinite(new Date(iso).getTime())
      ? (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
      : Number.POSITIVE_INFINITY;
  return buckets.map((b, i) => {
    const min = i === 0 ? 0 : buckets[i - 1]!.maxDays;
    const docs = snap.docs.filter((d) => d.publishedAt && dayAge(d.publishedAt) > min && dayAge(d.publishedAt) <= b.maxDays);
    const total = docs.reduce((s, d) => s + d.sessionsRecent, 0);
    return { label: b.label, docCount: docs.length, totalSessions: total, avgSessions: docs.length ? Math.round(total / docs.length) : 0 };
  });
};

export const deriveAttribution = (snap: ContentSnapshot): AttributionRow[] =>
  snap.docs
    .filter((d) => d.conversionsRecent > 0)
    .map((d) => ({ collection: d.collection, id: d.id, title: d.title, url: d.url, conversions: d.conversionsRecent }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, TOP_N);

export const keyEventsConfigured = (snap: ContentSnapshot): boolean =>
  snap.docs.some((d) => d.conversionsRecent > 0);
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- sections`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/sections.ts apps/cms/src/payload/lib/content-insights/sections.test.ts
git commit -m "feat(cms): content-insights section derivations (TDD)"
```

---

### Task 4: Snapshot builder (TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/content-insights/build-snapshot.ts`
- Test: `apps/cms/src/payload/lib/content-insights/build-snapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from './build-snapshot';

const cmsDoc = {
  collection: 'blogs', id: '1', slug: 'sbom-101', title: 'SBOM 101',
  authorLabels: ['Jane'], categoryLabels: ['Security'],
  publishedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z',
};

describe('buildSnapshot', () => {
  it('joins GA4 + GSC rows to a CMS doc by path', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
      cmsDocs: [cmsDoc],
      ga4Recent: [{ path: '/blogs/sbom-101', sessions: 540, users: 480, conversions: 3 }],
      ga4Prior: [{ path: '/blogs/sbom-101', sessions: 900 }],
      gsc: [{ path: 'https://www.cleanstart.com/blogs/sbom-101', clicks: 120, impressions: 8000, position: 7.3 }],
    });
    expect(snap.docs).toHaveLength(1);
    expect(snap.docs[0]).toMatchObject({
      url: '/blogs/sbom-101', sessionsRecent: 540, sessionsPrior: 900, usersRecent: 480,
      conversionsRecent: 3, clicks: 120, impressions: 8000, indexedProxy: true,
    });
  });

  it('defaults metrics to 0 and indexedProxy false when no analytics rows match', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
      cmsDocs: [cmsDoc], ga4Recent: [], ga4Prior: [], gsc: [],
    });
    expect(snap.docs[0]).toMatchObject({ sessionsRecent: 0, sessionsPrior: 0, impressions: 0, indexedProxy: false });
  });

  it('skips CMS docs whose collection has no public path prefix', () => {
    const snap = buildSnapshot({
      capturedAt: '2026-06-24T00:00:00.000Z',
      windows: { recentDays: 28, priorDays: 28, gscDays: 90 },
      cmsDocs: [{ ...cmsDoc, collection: 'authors' }], ga4Recent: [], ga4Prior: [], gsc: [],
    });
    expect(snap.docs).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- build-snapshot`
Expected: FAIL ("Cannot find module './build-snapshot'").

- [ ] **Step 3: Implement**

```ts
import { docPath, normalizePath } from './page-path';
import type { ContentDocRecord, ContentSnapshot } from './types';

export interface CmsDocInput {
  collection: string; id: string; slug: string; title: string;
  authorLabels: string[]; categoryLabels: string[];
  publishedAt: string | null; updatedAt: string | null;
}
export interface Ga4Row { path: string; sessions: number; users?: number; conversions?: number }
export interface GscRow { path: string; clicks: number; impressions: number; position: number }

export interface BuildSnapshotInput {
  capturedAt: string;
  windows: ContentSnapshot['windows'];
  cmsDocs: CmsDocInput[];
  ga4Recent: Ga4Row[];
  ga4Prior: Ga4Row[];
  gsc: GscRow[];
}

const indexByPath = <T extends { path: string }>(rows: T[]): Map<string, T> => {
  const m = new Map<string, T>();
  for (const r of rows) m.set(normalizePath(r.path), r);
  return m;
};

export const buildSnapshot = (input: BuildSnapshotInput): ContentSnapshot => {
  const recent = indexByPath(input.ga4Recent);
  const prior = indexByPath(input.ga4Prior);
  const gsc = indexByPath(input.gsc);
  const docs: ContentDocRecord[] = [];
  for (const d of input.cmsDocs) {
    const url = docPath(d.collection, d.slug);
    if (!url) continue;
    const r = recent.get(url);
    const p = prior.get(url);
    const g = gsc.get(url);
    docs.push({
      collection: d.collection, id: d.id, slug: d.slug, title: d.title, url,
      authorLabels: d.authorLabels, categoryLabels: d.categoryLabels,
      publishedAt: d.publishedAt, updatedAt: d.updatedAt,
      sessionsRecent: r?.sessions ?? 0, sessionsPrior: p?.sessions ?? 0,
      usersRecent: r?.users ?? 0, conversionsRecent: r?.conversions ?? 0,
      clicks: g?.clicks ?? 0, impressions: g?.impressions ?? 0, position: g?.position ?? 0,
      indexedProxy: (g?.impressions ?? 0) > 0,
    });
  }
  return { capturedAt: input.capturedAt, windows: input.windows, docs };
};
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- build-snapshot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/build-snapshot.ts apps/cms/src/payload/lib/content-insights/build-snapshot.test.ts
git commit -m "feat(cms): content-insights snapshot builder (TDD)"
```

---

### Task 5: Fetch orchestration

**Files:**
- Create: `apps/cms/src/payload/lib/content-insights/fetch-snapshot.ts`

- [ ] **Step 1: Implement** (no unit test — integration glue; verified via the manual smoke in Task 6)

```ts
import type { BasePayload } from 'payload';

import { resolveGa4Credentials } from '../integrations/credentials';
import { buildClient } from '../integrations/kinds/ga4-data-api';
import { getGscCredentialsFromRow } from '../integrations/kinds/gsc-search-analytics';
import { findRowsOfKind } from '../integrations/kinds/types';
import { google, type searchconsole_v1 } from 'googleapis';
import type { GscCredentials } from '../integrations/credentials';
import { buildSnapshot, type CmsDocInput, type Ga4Row, type GscRow } from './build-snapshot';
import type { ContentSnapshot } from './types';

const RECENT_DAYS = 28;
const GSC_DAYS = 90;
const CONTENT_COLLECTIONS = ['blogs', 'guides', 'news', 'knowledgeBase', 'caseStudies', 'resources', 'events', 'webinars', 'podcastEpisodes'] as const;

const num = (v: string | null | undefined): number => {
  const n = Number.parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};

const labelsOf = (value: unknown): string[] => {
  const arr = Array.isArray(value) ? value : value == null ? [] : [value];
  return arr
    .map((v) => (typeof v === 'object' && v !== null ? ((v as Record<string, unknown>).name ?? (v as Record<string, unknown>).title ?? (v as Record<string, unknown>).fullName) : null))
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
};

const fetchGa4Pages = async (creds: ReturnType<typeof resolveGa4Credentials>, startDate: string, endDate: string): Promise<Ga4Row[]> => {
  if (!creds) return [];
  const client = buildClient(creds);
  const [resp] = await client.runReport({
    property: `properties/${creds.propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
    limit: 5000,
  });
  return (resp.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? '',
    sessions: num(r.metricValues?.[0]?.value),
    users: num(r.metricValues?.[1]?.value),
    conversions: num(r.metricValues?.[2]?.value),
  }));
};

const gscClient = (creds: GscCredentials): searchconsole_v1.Searchconsole => {
  const email = creds.serviceAccountJson.client_email;
  const key = creds.serviceAccountJson.private_key;
  const auth = new google.auth.JWT({
    ...(typeof email === 'string' ? { email } : {}),
    ...(typeof key === 'string' ? { key } : {}),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
};

const fetchGscPages = async (creds: GscCredentials | null): Promise<GscRow[]> => {
  if (!creds) return [];
  const c = gscClient(creds);
  const end = new Date();
  const start = new Date(end.getTime() - GSC_DAYS * 86400000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const resp = await c.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: { startDate: fmt(start), endDate: fmt(end), dimensions: ['page'], rowLimit: 5000 },
  });
  return (resp.data.rows ?? []).map((r) => ({
    path: r.keys?.[0] ?? '', clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, position: r.position ?? 0,
  }));
};

const fetchCmsDocs = async (payload: BasePayload): Promise<CmsDocInput[]> => {
  const out: CmsDocInput[] = [];
  for (const collection of CONTENT_COLLECTIONS) {
    let page = 1;
    for (;;) {
      const res = await payload.find({ collection, where: { _status: { equals: 'published' } }, limit: 200, page, depth: 1, overrideAccess: true, pagination: true }).catch(() => null);
      if (!res) break;
      for (const doc of res.docs as Array<Record<string, unknown>>) {
        out.push({
          collection, id: String(doc.id), slug: String(doc.slug ?? ''), title: String(doc.title ?? doc.name ?? doc.slug ?? ''),
          authorLabels: labelsOf(doc.author ?? doc.authors), categoryLabels: labelsOf(doc.categories ?? doc.category),
          publishedAt: (doc.publishedAt as string | null) ?? null, updatedAt: (doc.updatedAt as string | null) ?? null,
        });
      }
      if (!res.hasNextPage) break;
      page += 1;
    }
  }
  return out.filter((d) => d.slug);
};

export const fetchContentSnapshot = async (payload: BasePayload): Promise<ContentSnapshot> => {
  const ga4Rows = await findRowsOfKind(payload, 'ga4DataApi');
  const gscRows = await findRowsOfKind(payload, 'gscSearchAnalyticsApi');
  const ga4Creds = ga4Rows.map((r) => resolveGa4Credentials(r as unknown as { ga4Config?: { propertyId?: string } })).find(Boolean) ?? null;
  const gscCreds = gscRows.map((r) => getGscCredentialsFromRow(r)).find(Boolean) ?? null;

  const [ga4Recent, ga4Prior, gsc, cmsDocs] = await Promise.all([
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS}daysAgo`, 'today'),
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS * 2}daysAgo`, `${RECENT_DAYS + 1}daysAgo`),
    fetchGscPages(gscCreds),
    fetchCmsDocs(payload),
  ]);

  return buildSnapshot({
    capturedAt: new Date().toISOString(),
    windows: { recentDays: RECENT_DAYS, priorDays: RECENT_DAYS, gscDays: GSC_DAYS },
    cmsDocs, ga4Recent, ga4Prior, gsc,
  });
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/fetch-snapshot.ts
git commit -m "feat(cms): content-insights fetch orchestration (GA4+GSC+CMS)"
```

---

### Task 6: Read-through endpoint

**Files:**
- Create: `apps/cms/src/payload/endpoints/content-insights.ts`
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Implement the endpoint**

```ts
import type { Endpoint, PayloadRequest } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { isStale, readCache, writeCache } from '../lib/integrations/cache';
import { fetchContentSnapshot } from '../lib/content-insights/fetch-snapshot';
import {
  deriveAttribution, deriveDecay, deriveIndexation, deriveLeaderboards,
  deriveOrphans, deriveVelocity, keyEventsConfigured,
} from '../lib/content-insights/sections';
import type { ContentSnapshot } from '../lib/content-insights/types';

const SNAPSHOT_KEY = 'content:snapshot';
const SNAPSHOT_TTL_MS = 26 * 60 * 60 * 1000;

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });

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
      return json({ ok: true, configured: true, fromCache: true, capturedAt: cached.capturedAt, keyEventsConfigured: keyEventsConfigured(snap), sections: sectionsOf(snap) });
    }
    try {
      const snap = await fetchContentSnapshot(req.payload);
      if (snap.docs.length === 0 && !cached) {
        return json({ ok: true, configured: false, capturedAt: null, fromCache: false, keyEventsConfigured: false, sections: null });
      }
      await writeCache(req.payload, 'ga4DataApi', 'global', SNAPSHOT_KEY, snap);
      return json({ ok: true, configured: true, fromCache: false, capturedAt: snap.capturedAt, keyEventsConfigured: keyEventsConfigured(snap), sections: sectionsOf(snap) });
    } catch (err) {
      req.payload.logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'content-insights fetch failed');
      if (cached) {
        const snap = cached.payload;
        return json({ ok: true, configured: true, fromCache: true, stale: true, capturedAt: cached.capturedAt, keyEventsConfigured: keyEventsConfigured(snap), sections: sectionsOf(snap) });
      }
      return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
    }
  },
};
```

- [ ] **Step 2: Register in `payload.config.ts`**

Add the import near the other endpoint imports:
```ts
import { contentInsightsEndpoint } from './payload/endpoints/content-insights';
```
Add `contentInsightsEndpoint` to the `endpoints: [...]` array (placement is not order-sensitive — its path has no `:param` collision).

- [ ] **Step 3: Manual smoke** (local CMS dev running, logged in as admin)

Run: `curl -s 'http://localhost:3000/api/content-insights' -H 'Cookie: <admin session>' | head -c 400`
Expected: `{ "ok":true, "configured":true, ... "sections":{ "decay":[...], "leaderboards":{...}, ... } }` (first call computes + caches; may take a few seconds).

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/endpoints/content-insights.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): content-insights read-through endpoint"
```

---

### Task 7: Daily refresh cron

**Files:**
- Create: `apps/cms/src/payload/jobs/refresh-content-insights.ts`
- Modify: `apps/cms/src/payload.config.ts`, `CLAUDE.md`

- [ ] **Step 1: Implement the task**

```ts
import type { TaskConfig } from 'payload';

import { writeCache } from '../lib/integrations/cache';
import { fetchContentSnapshot } from '../lib/content-insights/fetch-snapshot';

/** Daily 06:30 UTC (after the 06:00 GSC daily refresh) — rebuilds the
 *  content-insights per-document snapshot blob. Gated by PAYLOAD_AUTO_RUN. */
export const refreshContentInsightsTask: TaskConfig<'refreshContentInsights'> = {
  slug: 'refreshContentInsights',
  schedule: [{ cron: '30 6 * * *', queue: 'contentInsightsRefresh' }],
  handler: async ({ req }) => {
    const snap = await fetchContentSnapshot(req.payload);
    await writeCache(req.payload, 'ga4DataApi', 'global', 'content:snapshot', snap);
    return { output: { docs: snap.docs.length } };
  },
};
```

- [ ] **Step 2: Register in `payload.config.ts`**

Add the import:
```ts
import { refreshContentInsightsTask } from './payload/jobs/refresh-content-insights';
```
Add `refreshContentInsightsTask` to `jobs.tasks: [...]`, and add to `jobs.autoRun: [...]`:
```ts
{ cron: '30 6 * * *', queue: 'contentInsightsRefresh' },
```

- [ ] **Step 3: Add to the CLAUDE.md background-jobs table**

Add this row to the jobs table under "## Background jobs":
```
| Content-insights snapshot rebuild | daily 06:30 | `refresh-content-insights.ts` |
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/jobs/refresh-content-insights.ts apps/cms/src/payload.config.ts CLAUDE.md
git commit -m "feat(cms): daily content-insights snapshot refresh cron"
```

---

## Phase 2 — Page + decay queue

### Task 8: Route, nav link, client shell

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsView.tsx`
- Create: `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx`
- Create: `apps/cms/src/app/(payload)/styles/_content-insights.scss`
- Modify: `apps/cms/src/payload.config.ts`, `apps/cms/src/payload/admin/components/SidebarHeader.tsx`, `apps/cms/src/app/(payload)/custom.scss`

- [ ] **Step 1: Server shell** — mirror `AnalyticsView.tsx` exactly (same `DefaultTemplate` wrapper + `if (!req.user) return` guard). Open `AnalyticsView.tsx`, copy it to `ContentInsightsView.tsx`, and change: the import to `./ContentInsightsClient`, the component/export name to `ContentInsightsView`, and the rendered child to `<ContentInsightsClient />`. Everything else (the `DefaultTemplate` props block) stays identical.

- [ ] **Step 2: Client shell**

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import type { ContentInsightsResponse } from '../../../lib/content-insights/types';

export function ContentInsightsClient(): ReactElement {
  const [data, setData] = useState<ContentInsightsResponse | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetch('/api/content-insights', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: ContentInsightsResponse) => {
        if (cancelled) return;
        if (!j.ok) return setState('error');
        if (!j.configured) return setState('unconfigured');
        setData(j); setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="cs-analytics cs-content-insights">
      <header className="cs-analytics__head"><h1>Content insights</h1></header>
      {state === 'loading' && <div className="cs-analytics__empty">Building the content snapshot… this can take a few seconds on the first load.</div>}
      {state === 'unconfigured' && <div className="cs-analytics__empty">Connect GA4 and GSC to populate content insights.</div>}
      {state === 'error' && <div className="cs-analytics__empty">Couldn’t load content insights. Try again shortly.</div>}
      {state === 'ready' && data?.sections && (
        <div className="cs-content-insights__sections" data-captured={data.capturedAt ?? ''} />
      )}
    </div>
  );
}

export default ContentInsightsClient;
```

- [ ] **Step 3: Register route + nav**

In `payload.config.ts` under `admin.components.views`, add alongside `analytics`:
```ts
contentInsights: {
  Component: './payload/admin/components/ContentInsights/ContentInsightsView.tsx#ContentInsightsView',
  path: '/content-insights',
},
```
In `SidebarHeader.tsx`, directly after the Analytics `<Link>`, add (mirroring its `isAnalytics` pattern):
```tsx
const isContentInsights = pathname.startsWith('/admin/content-insights');
```
```tsx
<Link href="/admin/content-insights" className={isContentInsights ? 'cs-sidebar-dashboard cs-sidebar-dashboard--active' : 'cs-sidebar-dashboard'}>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 13V3M2 13h12M5 11V7M8 11V4M11 11V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  Content insights
</Link>
```

- [ ] **Step 4: SCSS scaffold**

`_content-insights.scss`:
```scss
.cs-content-insights {
  &__sections {
    display: flex;
    flex-direction: column;
    gap: var(--cs-space-6, 24px);
  }
  &__section-note {
    font-size: 12px;
    color: var(--theme-text-soft);
    margin: 0 0 var(--cs-space-3, 12px);
  }
}
```
In `custom.scss`, add: `@use './styles/content-insights';`

- [ ] **Step 5: Verify route loads** — run the CMS, log in, visit `/admin/content-insights`. Expect the "Content insights" heading, the nav link present + active, and the loading→ready transition (empty sections container for now).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/ apps/cms/src/payload.config.ts apps/cms/src/payload/admin/components/SidebarHeader.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss" "apps/cms/src/app/(payload)/custom.scss"
git commit -m "feat(cms): register /admin/content-insights route + nav + shell"
```

---

### Task 9: Decay queue section

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/DecayQueue.tsx`
- Modify: `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx`, `_content-insights.scss`

- [ ] **Step 1: DecayQueue component**

```tsx
import type { ReactElement } from 'react';
import type { DecayRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string => `/admin/collections/${r.collection}/${r.id}`;
const fmt = (n: number): string => n.toLocaleString();
const fmtPct = (n: number): string => `${Math.round(n * 100)}%`;
const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString() : '—');

export function DecayQueue({ rows }: { rows: DecayRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Content decay &amp; refresh queue</h3>
      <p className="cs-content-insights__section-note">Published pages whose sessions fell ≥30% vs the prior 28 days, ranked by sessions lost. “Stale” = not updated in 6+ months.</p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No decaying pages — nothing is dropping by more than 30%.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead">
            <span>Page</span><span className="is-right">Now</span><span className="is-right">Prev</span><span className="is-right">Change</span><span className="is-right">Updated</span>
          </div>
          {rows.map((r) => (
            <a key={`${r.collection}:${r.id}`} className="cs-content-insights__trow" href={editHref(r)}>
              <span className="is-primary">{r.title}{r.stale && <span className="cs-content-insights__tag">stale</span>}</span>
              <span className="is-right">{fmt(r.sessionsRecent)}</span>
              <span className="is-right">{fmt(r.sessionsPrior)}</span>
              <span className="is-right is-loss">{fmtPct(r.lossPct)}</span>
              <span className="is-right">{fmtDate(r.updatedAt)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default DecayQueue;
```

- [ ] **Step 2: Render it in the client**

In `ContentInsightsClient.tsx`, import `DecayQueue` and replace the empty `<div className="cs-content-insights__sections" .../>` with:
```tsx
<div className="cs-content-insights__sections">
  <DecayQueue rows={data.sections.decay} />
</div>
```

- [ ] **Step 3: Table styles**

Append to `_content-insights.scss` inside `.cs-content-insights`:
```scss
  &__table { display: flex; flex-direction: column; }
  &__thead, &__trow {
    display: grid;
    grid-template-columns: 1fr 70px 70px 80px 110px;
    gap: 8px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--theme-elevation-150);
    font-size: 13px;
  }
  &__thead { color: var(--theme-elevation-400); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  &__trow { color: var(--theme-text); text-decoration: none; }
  &__trow:hover { background: var(--theme-elevation-50); }
  &__trow .is-primary { color: var(--cs-cyan-500); display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__trow .is-right { text-align: right; font-feature-settings: 'tnum' 1; }
  &__trow .is-loss { color: var(--color-warning-500); }
  &__tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-warning-500); border: 1px solid var(--color-warning-500); border-radius: 4px; padding: 0 4px; }
```

- [ ] **Step 4: Verify** — visit `/admin/content-insights`, confirm the decay table renders ranked rows with the loss %, the “stale” tag where applicable, and that clicking a row opens that doc’s editor.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/DecayQueue.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss"
git commit -m "feat(cms): content decay + refresh queue section"
```

---

## Phase 3 — Remaining catalog sections

### Task 10: Author & category leaderboards

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/Leaderboards.tsx`
- Modify: `ContentInsightsClient.tsx`

- [ ] **Step 1: Component**

```tsx
import type { ReactElement } from 'react';
import type { LeaderboardRow, LeaderboardsSection } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();

const Board = ({ title, rows }: { title: string; rows: LeaderboardRow[] }): ReactElement => (
  <div className="cs-analytics__panel">
    <h3>{title}</h3>
    {rows.length === 0 ? (
      <div className="cs-analytics__empty">No data.</div>
    ) : (
      <div className="cs-content-insights__table">
        <div className="cs-content-insights__thead cs-content-insights__thead--lb">
          <span>Name</span><span className="is-right">Docs</span><span className="is-right">Sessions</span><span className="is-right">Clicks</span>
        </div>
        {rows.slice(0, 12).map((r) => (
          <div key={r.label} className="cs-content-insights__trow cs-content-insights__trow--lb">
            <span className="is-primary">{r.label}</span>
            <span className="is-right">{fmt(r.docCount)}</span>
            <span className="is-right">{fmt(r.sessions)}</span>
            <span className="is-right">{fmt(r.clicks)}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export function Leaderboards({ data }: { data: LeaderboardsSection }): ReactElement {
  return (
    <div className="cs-analytics__cols">
      <Board title="Top authors" rows={data.byAuthor} />
      <Board title="Top categories" rows={data.byCategory} />
    </div>
  );
}

export default Leaderboards;
```

- [ ] **Step 2: Render it** — in `ContentInsightsClient.tsx`, add `<Leaderboards data={data.sections.leaderboards} />` after `<DecayQueue .../>`.

- [ ] **Step 3: Leaderboard grid columns** — append to `_content-insights.scss`:
```scss
  &__thead--lb, &__trow--lb { grid-template-columns: 1fr 60px 90px 70px; }
  &__trow--lb .is-primary { color: var(--cs-text-heading); }
```

- [ ] **Step 4: Verify** — leaderboards show authors + categories with summed sessions/clicks.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/Leaderboards.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss"
git commit -m "feat(cms): author + category leaderboards section"
```

---

### Task 11: Orphan / zero-traffic audit

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/OrphanAudit.tsx`
- Modify: `ContentInsightsClient.tsx`

- [ ] **Step 1: Component**

```tsx
import type { ReactElement } from 'react';
import type { OrphanRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string => `/admin/collections/${r.collection}/${r.id}`;
const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString() : '—');

export function OrphanAudit({ rows }: { rows: OrphanRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Orphan &amp; zero-traffic audit</h3>
      <p className="cs-content-insights__section-note">Published docs with ~0 sessions and ~0 search impressions over 90 days — prune or promote.</p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No orphans — every published page is getting traffic or impressions.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--orphan">
            <span>Page</span><span>Collection</span><span className="is-right">Published</span>
          </div>
          {rows.map((r) => (
            <a key={`${r.collection}:${r.id}`} className="cs-content-insights__trow cs-content-insights__trow--orphan" href={editHref(r)}>
              <span className="is-primary">{r.title}</span>
              <span>{r.collection}</span>
              <span className="is-right">{fmtDate(r.publishedAt)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default OrphanAudit;
```

- [ ] **Step 2: Render it** — add `<OrphanAudit rows={data.sections.orphans} />` after `<Leaderboards .../>`.

- [ ] **Step 3: Columns** — append to `_content-insights.scss`:
```scss
  &__thead--orphan, &__trow--orphan { grid-template-columns: 1fr 120px 110px; }
```

- [ ] **Step 4: Verify** — orphan list shows zero-traffic published docs; rows open the editor.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/OrphanAudit.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss"
git commit -m "feat(cms): orphan / zero-traffic audit section"
```

---

### Task 12: Indexation coverage rollup

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/IndexationRollup.tsx`
- Modify: `ContentInsightsClient.tsx`

- [ ] **Step 1: Component**

```tsx
import type { ReactElement } from 'react';
import type { IndexationCollectionRow } from '../../../lib/content-insights/types';

const pct = (n: number): string => `${Math.round(n * 100)}%`;

export function IndexationRollup({ rows }: { rows: IndexationCollectionRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Indexation coverage</h3>
      <p className="cs-content-insights__section-note">Share of each collection’s published docs with search impressions in the last 90 days (a proxy for “indexed”). Use the per-doc URL inspection for exact status.</p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No published content to assess.</div>
      ) : (
        <div className="cs-analytics__bars">
          {rows.map((r) => (
            <div key={r.collection} className="cs-analytics__bar-row">
              <span className="cs-analytics__bar-label">{r.collection}</span>
              <span className="cs-analytics__bar-track"><span className="cs-analytics__bar-fill" style={{ width: pct(r.coverage) }} /></span>
              <span className="cs-analytics__bar-val">{r.indexed}/{r.published}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default IndexationRollup;
```

- [ ] **Step 2: Render it** — add `<IndexationRollup rows={data.sections.indexation} />` after `<OrphanAudit .../>`.

- [ ] **Step 3: Verify** — each collection shows a coverage bar + `indexed/published` count, sorted worst-first (reuses the existing `cs-analytics__bar*` styles).

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/IndexationRollup.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx
git commit -m "feat(cms): indexation coverage rollup section"
```

---

### Task 13: New-content velocity

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/VelocityPanel.tsx`
- Modify: `ContentInsightsClient.tsx`

- [ ] **Step 1: Component**

```tsx
import type { ReactElement } from 'react';
import type { VelocityBucket } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();

export function VelocityPanel({ buckets }: { buckets: VelocityBucket[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>New-content velocity</h3>
      <p className="cs-content-insights__section-note">Average sessions per doc by publish recency — how recent posts perform vs the back catalog.</p>
      <div className="cs-analytics__kpis">
        {buckets.map((b) => (
          <div key={b.label} className="cs-analytics__kpi">
            <div className="cs-analytics__kpi-label">{b.label} · {fmt(b.docCount)} docs</div>
            <div className="cs-analytics__kpi-value">{fmt(b.avgSessions)}</div>
            <div className="cs-content-insights__section-note">avg sessions / doc</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default VelocityPanel;
```

- [ ] **Step 2: Render it** — add `<VelocityPanel buckets={data.sections.velocity} />` after `<IndexationRollup .../>`.

- [ ] **Step 3: Verify** — three KPI tiles (Last 30 / Last 90 / Older) show avg sessions per doc.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/VelocityPanel.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx
git commit -m "feat(cms): new-content velocity section"
```

---

## Phase 4 — Conversion attribution (gated)

### Task 14: Attribution section

**Files:**
- Create: `apps/cms/src/payload/admin/components/ContentInsights/AttributionPanel.tsx`
- Modify: `ContentInsightsClient.tsx`

- [ ] **Step 1: Component**

```tsx
import type { ReactElement } from 'react';
import type { AttributionRow } from '../../../lib/content-insights/types';

const editHref = (r: { collection: string; id: string }): string => `/admin/collections/${r.collection}/${r.id}`;
const fmt = (n: number): string => n.toLocaleString();

export function AttributionPanel({ rows, configured }: { rows: AttributionRow[]; configured: boolean }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Conversion attribution</h3>
      {!configured ? (
        <div className="cs-analytics__empty">
          Needs setup — configure GA4 <strong>key events</strong> (Admin → Events → mark as key event) so conversions attribute to pages. This section activates automatically once key-event data flows in.
        </div>
      ) : rows.length === 0 ? (
        <div className="cs-analytics__empty">No conversions recorded in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--attr">
            <span>Page</span><span className="is-right">Key events</span>
          </div>
          {rows.map((r) => (
            <a key={`${r.collection}:${r.id}`} className="cs-content-insights__trow cs-content-insights__trow--attr" href={editHref(r)}>
              <span className="is-primary">{r.title}</span>
              <span className="is-right">{fmt(r.conversions)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export default AttributionPanel;
```

- [ ] **Step 2: Render it** — add after `<VelocityPanel .../>`:
```tsx
<AttributionPanel rows={data.sections.attribution} configured={data.keyEventsConfigured} />
```

- [ ] **Step 3: Columns** — append to `_content-insights.scss`:
```scss
  &__thead--attr, &__trow--attr { grid-template-columns: 1fr 100px; }
```

- [ ] **Step 4: Verify** — with key events not yet configured, the section shows the "needs setup" empty state (not an error).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/AttributionPanel.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss"
git commit -m "feat(cms): conversion attribution section (gated)"
```

---

## Final checks (run before declaring done)

- [ ] `pnpm --filter @cleanstart/cms lint`
- [ ] `pnpm --filter @cleanstart/cms typecheck`
- [ ] `pnpm --filter @cleanstart/cms test -- content-insights page-path sections build-snapshot` (all green)
- [ ] `pnpm --filter @cleanstart/cms build`
- [ ] Manual: visit `/admin/content-insights`, confirm all six sections render against the local snapshot, every row links to its editor, and the attribution section shows the gated empty state.
- [ ] No `generate:types` change expected (no schema/collection change).

---

## Self-review notes

- **Spec coverage:** decay/refresh queue (Task 9) ✓ · author/category leaderboards (Task 10) ✓ · conversion attribution gated (Task 14) ✓ · orphan audit (Task 11) ✓ · indexation rollup proxy (Task 12) ✓ · velocity (Task 13) ✓ · shared snapshot blob + cron + endpoint (Tasks 1–7) ✓ · dedicated route + nav (Task 8) ✓ · read-only worklists (no queue collection) ✓.
- **No migration:** reuses `analyticsCache` (provider `ga4DataApi`, scope `global`, key `content:snapshot`) — `provider` is constrained to the `CachedProvider` enum, so we namespace under `ga4DataApi` with a `content:*` key, exactly like the Phase-1 `overview:*` reuse.
- **Bounded API usage:** the snapshot does 2 GA4 page reports + 1 GSC page query + Postgres reads per day — no per-doc API calls. Indexation uses the impressions>0 proxy; exact URL inspection stays the existing on-demand per-doc action.
- **Type consistency:** all section payload types live once in `types.ts`; `deriveDecay/Leaderboards/Orphans/Indexation/Velocity/Attribution` + `keyEventsConfigured` are defined in `sections.ts` and consumed by the endpoint and components with matching names.
- **Gated attribution:** ships inert (empty "needs setup" state) until GA4 key events exist; `keyEventsConfigured` flips it on automatically — no code change needed when key events land.
- **Pattern reuse:** server view mirrors `AnalyticsView.tsx`; nav mirrors the `SidebarHeader` Analytics link; tables/bars/KPIs reuse the `cs-analytics__*` styles from Phase 1.
```
