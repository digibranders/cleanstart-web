# Phase 4 — SEO Opportunity Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Three GSC-driven SEO worklists — striking-distance queries, low-CTR-for-position, keyword cannibalization — appended as new sections on the existing `/admin/content-insights` page.

**Architecture:** Extend the Phase-3 `content:snapshot` to also carry bounded query-level GSC data (`queries`, `queryPages`). Pure derivations turn that into three section payloads; the existing read-through endpoint returns them; three new components render them. No new route, cron, cache key, or migration.

**Tech Stack:** Payload 3, `googleapis` (GSC), React 19 client components, Vitest. Reuses Phase-3 `fetch-snapshot.ts`, `content-insights` endpoint, `pathToDocKey`.

**Design spec:** `docs/superpowers/specs/2026-06-24-seo-opportunity-engine-design.md`

---

## File Structure

**Create:**
- `apps/cms/src/payload/lib/content-insights/seo-sections.ts` — striking-distance / low-CTR / cannibalization derivations + expected-CTR curve (pure).
- `apps/cms/src/payload/lib/content-insights/seo-sections.test.ts`
- `apps/cms/src/payload/admin/components/ContentInsights/StrikingDistance.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/LowCtr.tsx`
- `apps/cms/src/payload/admin/components/ContentInsights/Cannibalization.tsx`

**Modify:**
- `apps/cms/src/payload/lib/content-insights/types.ts` — `SnapshotQueryRow`, `SnapshotQueryPageRow`, snapshot fields, response section types.
- `apps/cms/src/payload/lib/content-insights/build-snapshot.ts` (+ test) — pass query arrays through.
- `apps/cms/src/payload/lib/content-insights/fetch-snapshot.ts` — two GSC query fetches.
- `apps/cms/src/payload/endpoints/content-insights.ts` — derive + return the three sections.
- `apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx` — render the three under an "SEO opportunities" divider.
- `apps/cms/src/app/(payload)/styles/_content-insights.scss` — column-grid modifiers.

---

## Task 1: Extend snapshot + response types

**Files:** Modify `apps/cms/src/payload/lib/content-insights/types.ts`

- [ ] **Step 1: Add the query row types** (after `ContentDocRecord`):

```ts
export interface SnapshotQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SnapshotQueryPageRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}
```

- [ ] **Step 2: Add the fields to `ContentSnapshot`** (after `docs`):

```ts
  queries: SnapshotQueryRow[];
  queryPages: SnapshotQueryPageRow[];
```

- [ ] **Step 3: Add the section payload types** (after `AttributionRow`):

```ts
export interface StrikingDistanceRow {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface LowCtrRow {
  query: string;
  position: number;
  ctr: number;
  expectedCtr: number;
  missedClicks: number;
}

export interface CannibalizationPage {
  collection: string;
  id: string;
  title: string;
  url: string;
  impressions: number;
  position: number;
}
export interface CannibalizationRow {
  query: string;
  totalImpressions: number;
  pages: CannibalizationPage[];
}
```

- [ ] **Step 4: Extend the response `sections` type** — add to the `sections` object in `ContentInsightsResponse`:

```ts
    strikingDistance: StrikingDistanceRow[];
    lowCtr: LowCtrRow[];
    cannibalization: CannibalizationRow[];
```

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/types.ts
git commit -m "feat(cms): SEO opportunity snapshot + section types"
```

---

## Task 2: Pass query arrays through buildSnapshot (TDD)

**Files:** Modify `build-snapshot.ts` + `build-snapshot.test.ts`

- [ ] **Step 1: Add a failing test** — append to `build-snapshot.test.ts`:

```ts
it('passes query and queryPage arrays through onto the snapshot', () => {
  const snap = buildSnapshot({
    capturedAt: '2026-06-24T00:00:00.000Z',
    windows,
    cmsDocs: [cmsDoc],
    ga4Recent: [],
    ga4Prior: [],
    gsc: [],
    queries: [{ query: 'sbom', clicks: 10, impressions: 500, ctr: 0.02, position: 8.4 }],
    queryPages: [{ query: 'sbom', page: '/blogs/sbom-101', clicks: 10, impressions: 500, position: 8.4 }],
  });
  expect(snap.queries).toHaveLength(1);
  expect(snap.queryPages[0]?.page).toBe('/blogs/sbom-101');
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- run src/payload/lib/content-insights/build-snapshot`
Expected: FAIL (`queries` is not on the input type / undefined).

- [ ] **Step 3: Implement** — in `build-snapshot.ts`:

Add to `BuildSnapshotInput`:
```ts
  queries: import('./types').SnapshotQueryRow[];
  queryPages: import('./types').SnapshotQueryPageRow[];
```
(or import the types at the top alongside the existing `ContentSnapshot` import and reference them directly).

Add to the returned object in `buildSnapshot` (alongside `docs`):
```ts
    queries: input.queries,
    queryPages: input.queryPages,
```

- [ ] **Step 4: Run, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- run src/payload/lib/content-insights/build-snapshot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/build-snapshot.ts apps/cms/src/payload/lib/content-insights/build-snapshot.test.ts
git commit -m "feat(cms): thread query-level GSC rows through buildSnapshot (TDD)"
```

---

## Task 3: Fetch query-level GSC data

**Files:** Modify `fetch-snapshot.ts`

- [ ] **Step 1: Add the two fetch helpers** (after `fetchGscPages`):

```ts
const fetchGscQueries = async (creds: GscCredentials | null): Promise<SnapshotQueryRow[]> => {
  if (!creds) return [];
  const c = gscClient(creds);
  const end = new Date();
  const start = new Date(end.getTime() - GSC_DAYS * 86400000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const resp = await c.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: { startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 1000 },
  });
  return (resp.data.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
};

const fetchGscQueryPages = async (creds: GscCredentials | null): Promise<SnapshotQueryPageRow[]> => {
  if (!creds) return [];
  const c = gscClient(creds);
  const end = new Date();
  const start = new Date(end.getTime() - GSC_DAYS * 86400000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const resp = await c.searchanalytics.query({
    siteUrl: creds.siteUrl,
    requestBody: { startDate: fmt(start), endDate: fmt(end), dimensions: ['query', 'page'], rowLimit: 2000 },
  });
  return (resp.data.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? '',
    page: r.keys?.[1] ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
  }));
};
```

- [ ] **Step 2: Import the types** — add to the `./types` import (or the build-snapshot import) at top:

```ts
import type { ContentSnapshot, SnapshotQueryRow, SnapshotQueryPageRow } from './types';
```

- [ ] **Step 3: Add both to the `Promise.all` and `buildSnapshot` call** in `fetchContentSnapshot`:

```ts
  const [ga4Recent, ga4Prior, gsc, queries, queryPages, cmsDocs] = await Promise.all([
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS}daysAgo`, 'today'),
    fetchGa4Pages(ga4Creds, `${RECENT_DAYS * 2}daysAgo`, `${RECENT_DAYS + 1}daysAgo`),
    fetchGscPages(gscCreds),
    fetchGscQueries(gscCreds),
    fetchGscQueryPages(gscCreds),
    fetchCmsDocs(payload),
  ]);

  return buildSnapshot({
    capturedAt: new Date().toISOString(),
    windows: { recentDays: RECENT_DAYS, priorDays: RECENT_DAYS, gscDays: GSC_DAYS },
    cmsDocs,
    ga4Recent,
    ga4Prior,
    gsc,
    queries,
    queryPages,
  });
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/fetch-snapshot.ts
git commit -m "feat(cms): fetch query + query-page GSC rows into the snapshot"
```

---

## Task 4: SEO derivations (TDD)

**Files:** Create `seo-sections.ts` + `seo-sections.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { deriveCannibalization, deriveLowCtr, deriveStrikingDistance, expectedCtr } from './seo-sections';
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
  collection: 'blogs', id: '1', slug: 's', title: 'T', url: '/blogs/s',
  authorLabels: [], categoryLabels: [], publishedAt: null, updatedAt: null,
  sessionsRecent: 0, sessionsPrior: 0, usersRecent: 0, conversionsRecent: 0,
  clicks: 0, impressions: 0, position: 0, indexedProxy: false, ...over,
});

describe('expectedCtr', () => {
  it('returns the curve value for a rank and clamps the tail', () => {
    expect(expectedCtr(1)).toBeGreaterThan(expectedCtr(5));
    expect(expectedCtr(50)).toBe(expectedCtr(20));
  });
});

describe('deriveStrikingDistance', () => {
  it('keeps queries in the 5-15 position band above the impression floor, sorted by impressions', () => {
    const out = deriveStrikingDistance(snap({ queries: [
      { query: 'a', clicks: 1, impressions: 800, ctr: 0.001, position: 7 },
      { query: 'b', clicks: 1, impressions: 900, ctr: 0.001, position: 12 },
      { query: 'c', clicks: 1, impressions: 900, ctr: 0.1, position: 2 },   // too high a rank
      { query: 'd', clicks: 0, impressions: 10, ctr: 0, position: 9 },      // below floor
    ] }));
    expect(out.map((r) => r.query)).toEqual(['b', 'a']);
  });
});

describe('deriveLowCtr', () => {
  it('flags queries whose CTR is well below the expected curve, ranked by missed clicks', () => {
    const out = deriveLowCtr(snap({ queries: [
      { query: 'under', clicks: 2, impressions: 1000, ctr: 0.002, position: 3 },  // expected high -> flagged
      { query: 'fine', clicks: 50, impressions: 200, ctr: 0.25, position: 3 },    // at/above expected
      { query: 'tiny', clicks: 0, impressions: 10, ctr: 0, position: 3 },         // below impression floor
    ] }));
    expect(out.map((r) => r.query)).toEqual(['under']);
    expect(out[0]?.missedClicks).toBeGreaterThan(0);
  });
});

describe('deriveCannibalization', () => {
  it('flags queries where >=2 known docs rank, joined to docs', () => {
    const out = deriveCannibalization(snap({
      docs: [doc({ id: '1', url: '/blogs/a', title: 'A' }), doc({ id: '2', url: '/blogs/b', title: 'B' })],
      queryPages: [
        { query: 'sbom', page: '/blogs/a', clicks: 5, impressions: 300, position: 6 },
        { query: 'sbom', page: '/blogs/b', clicks: 2, impressions: 200, position: 9 },
        { query: 'solo', page: '/blogs/a', clicks: 1, impressions: 100, position: 4 }, // single page -> excluded
        { query: 'ext', page: '/unknown/x', clicks: 1, impressions: 50, position: 3 }, // unknown -> skipped
      ],
    }));
    expect(out.map((r) => r.query)).toEqual(['sbom']);
    expect(out[0]?.pages.map((p) => p.id).sort()).toEqual(['1', '2']);
    expect(out[0]?.totalImpressions).toBe(500);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- run src/payload/lib/content-insights/seo-sections`
Expected: FAIL ("Cannot find module './seo-sections'").

- [ ] **Step 3: Implement `seo-sections.ts`**

```ts
import { pathToDocKey } from './page-path';
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
  const docByUrl = new Map(snap.docs.map((d) => [d.url, d]));
  const byQuery = new Map<string, CannibalizationRow>();
  for (const row of snap.queryPages) {
    const key = pathToDocKey(row.page);
    if (!key) continue;
    const doc = docByUrl.get(`${docPrefix(key)}`);
    if (!doc) continue;
    const cur =
      byQuery.get(row.query) ?? { query: row.query, totalImpressions: 0, pages: [] };
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

// docByUrl is keyed by the doc's canonical url; resolve a pathToDocKey result
// back to that url via the same prefix map page-path uses.
const docPrefix = (key: { collection: string; slug: string }): string => {
  // Re-derive the doc url; page-path.docPath would import a cycle-free helper.
  return `${key.collection}__${key.slug}`;
};
```

> Note: the `docPrefix` helper above is a placeholder shape — replace the `docByUrl` join with a direct match on the normalized page path. Use `normalizePath(row.page)` and key `docByUrl` on `normalizePath(d.url)`. Final implementation in Step 3a.

- [ ] **Step 3a: Use path-normalized join (replace the docByUrl block)**

```ts
import { normalizePath, pathToDocKey } from './page-path';
// ...
export const deriveCannibalization = (snap: ContentSnapshot): CannibalizationRow[] => {
  const docByPath = new Map(snap.docs.map((d) => [normalizePath(d.url), d]));
  const byQuery = new Map<string, CannibalizationRow>();
  for (const row of snap.queryPages) {
    if (!pathToDocKey(row.page)) continue; // ignore non-content paths
    const doc = docByPath.get(normalizePath(row.page));
    if (!doc) continue;
    const cur = byQuery.get(row.query) ?? { query: row.query, totalImpressions: 0, pages: [] };
    if (cur.pages.some((p) => p.id === doc.id && p.collection === doc.collection)) continue;
    cur.pages.push({
      collection: doc.collection, id: doc.id, title: doc.title, url: doc.url,
      impressions: row.impressions, position: row.position,
    });
    cur.totalImpressions += row.impressions;
    byQuery.set(row.query, cur);
  }
  return [...byQuery.values()]
    .filter((r) => r.pages.length >= 2)
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, TOP_N);
};
```

Remove the placeholder `docPrefix` helper and the unused `docByUrl` version; keep only this path-normalized implementation.

- [ ] **Step 4: Run, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- run src/payload/lib/content-insights/seo-sections`
Expected: PASS (all four describe blocks).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/content-insights/seo-sections.ts apps/cms/src/payload/lib/content-insights/seo-sections.test.ts
git commit -m "feat(cms): SEO opportunity derivations — striking distance, low CTR, cannibalization (TDD)"
```

---

## Task 5: Wire the three sections into the endpoint

**Files:** Modify `endpoints/content-insights.ts`

- [ ] **Step 1: Import the derivations** — add to the existing `sections` import block:

```ts
import { deriveCannibalization, deriveLowCtr, deriveStrikingDistance } from '../lib/content-insights/seo-sections';
```

- [ ] **Step 2: Extend `sectionsOf`** — add three keys:

```ts
  strikingDistance: deriveStrikingDistance(snap),
  lowCtr: deriveLowCtr(snap),
  cannibalization: deriveCannibalization(snap),
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/endpoints/content-insights.ts
git commit -m "feat(cms): return SEO opportunity sections from content-insights endpoint"
```

---

## Task 6: UI — three section components + client divider

**Files:** Create `StrikingDistance.tsx`, `LowCtr.tsx`, `Cannibalization.tsx`; modify `ContentInsightsClient.tsx`, `_content-insights.scss`.

- [ ] **Step 1: StrikingDistance.tsx**

```tsx
import type { ReactElement } from 'react';

import type { StrikingDistanceRow } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const pos = (n: number): string => n.toFixed(1);

export function StrikingDistance({ rows }: { rows: StrikingDistanceRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Striking-distance queries</h3>
      <p className="cs-content-insights__section-note">
        Queries ranking positions 5–15 with high impressions — small ranking gains here convert to real clicks.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No striking-distance queries in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--sd">
            <span>Query</span>
            <span className="is-right">Pos</span>
            <span className="is-right">Impr.</span>
            <span className="is-right">Clicks</span>
            <span className="is-right">CTR</span>
          </div>
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__trow cs-content-insights__trow--sd">
              <span className="is-primary">{r.query}</span>
              <span className="is-right">{pos(r.position)}</span>
              <span className="is-right">{fmt(r.impressions)}</span>
              <span className="is-right">{fmt(r.clicks)}</span>
              <span className="is-right">{pct(r.ctr)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default StrikingDistance;
```

- [ ] **Step 2: LowCtr.tsx**

```tsx
import type { ReactElement } from 'react';

import type { LowCtrRow } from '../../../lib/content-insights/types';

const fmt = (n: number): string => n.toLocaleString();
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const pos = (n: number): string => n.toFixed(1);

export function LowCtr({ rows }: { rows: LowCtrRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Low CTR for position</h3>
      <p className="cs-content-insights__section-note">
        Queries earning fewer clicks than their rank should — usually a weak title or meta description. Rewrite to win the clicks already on the table.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No under-performing queries in the window.</div>
      ) : (
        <div className="cs-content-insights__table">
          <div className="cs-content-insights__thead cs-content-insights__thead--lc">
            <span>Query</span>
            <span className="is-right">Pos</span>
            <span className="is-right">CTR</span>
            <span className="is-right">Expected</span>
            <span className="is-right">Missed</span>
          </div>
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__trow cs-content-insights__trow--lc">
              <span className="is-primary">{r.query}</span>
              <span className="is-right">{pos(r.position)}</span>
              <span className="is-right is-loss">{pct(r.ctr)}</span>
              <span className="is-right">{pct(r.expectedCtr)}</span>
              <span className="is-right">{fmt(r.missedClicks)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default LowCtr;
```

- [ ] **Step 3: Cannibalization.tsx**

```tsx
import type { ReactElement } from 'react';

import type { CannibalizationRow } from '../../../lib/content-insights/types';

const editHref = (p: { collection: string; id: string }): string =>
  `/admin/collections/${p.collection}/${p.id}`;
const fmt = (n: number): string => n.toLocaleString();

export function Cannibalization({ rows }: { rows: CannibalizationRow[] }): ReactElement {
  return (
    <section className="cs-analytics__panel">
      <h3>Keyword cannibalization</h3>
      <p className="cs-content-insights__section-note">
        One query where two or more of our pages compete — they split clicks and dilute ranking. Merge or differentiate them.
      </p>
      {rows.length === 0 ? (
        <div className="cs-analytics__empty">No cannibalized queries — each query has a single ranking page.</div>
      ) : (
        <div className="cs-content-insights__cannibal">
          {rows.map((r) => (
            <div key={r.query} className="cs-content-insights__cannibal-row">
              <div className="cs-content-insights__cannibal-query">
                <span>{r.query}</span>
                <span className="cs-content-insights__section-note">{fmt(r.totalImpressions)} impressions</span>
              </div>
              <ul className="cs-content-insights__cannibal-pages">
                {r.pages.map((p) => (
                  <li key={`${p.collection}:${p.id}`}>
                    <a href={editHref(p)}>{p.title}</a>
                    <span className="cs-content-insights__section-note">
                      pos {p.position.toFixed(1)} · {fmt(p.impressions)} impr.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Cannibalization;
```

- [ ] **Step 4: Render them in the client** — in `ContentInsightsClient.tsx`, add imports:

```tsx
import { Cannibalization } from './Cannibalization';
import { LowCtr } from './LowCtr';
import { StrikingDistance } from './StrikingDistance';
```

After the `<AttributionPanel .../>` line, inside the `cs-content-insights__sections` div, add:

```tsx
          <h2 className="cs-content-insights__group-head">SEO opportunities</h2>
          <StrikingDistance rows={data.sections.strikingDistance} />
          <LowCtr rows={data.sections.lowCtr} />
          <Cannibalization rows={data.sections.cannibalization} />
```

- [ ] **Step 5: Styles** — append to `_content-insights.scss` inside `.cs-content-insights`:

```scss
  &__group-head {
    font-size: 18px;
    font-weight: 600;
    color: var(--cs-text-heading);
    margin: var(--cs-space-4, 16px) 0 0;
    padding-top: var(--cs-space-4, 16px);
    border-top: 1px solid var(--theme-elevation-150);
  }

  &__thead--sd,
  &__trow--sd,
  &__thead--lc,
  &__trow--lc {
    grid-template-columns: 1fr 60px 80px 70px 70px;
  }

  &__cannibal {
    display: flex;
    flex-direction: column;
    gap: var(--cs-space-3, 12px);
  }

  &__cannibal-row {
    border: 1px solid var(--theme-elevation-150);
    border-radius: var(--cs-radius-card, 8px);
    padding: 12px 14px;
  }

  &__cannibal-query {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-weight: 600;
    color: var(--cs-text-heading);
    margin-bottom: 8px;
  }

  &__cannibal-pages {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    li {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 13px;
    }

    a {
      color: var(--cs-cyan-500);
      text-decoration: none;
    }
  }
```

- [ ] **Step 6: Verify** — refresh `/admin/content-insights`; after the content sections, the "SEO opportunities" heading and three sections render. (Run the local snapshot refresh first so the query arrays are populated — see the manual smoke below.)

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/admin/components/ContentInsights/StrikingDistance.tsx apps/cms/src/payload/admin/components/ContentInsights/LowCtr.tsx apps/cms/src/payload/admin/components/ContentInsights/Cannibalization.tsx apps/cms/src/payload/admin/components/ContentInsights/ContentInsightsClient.tsx "apps/cms/src/app/(payload)/styles/_content-insights.scss"
git commit -m "feat(cms): SEO opportunity sections UI on content-insights page"
```

---

## Final checks

- [ ] `pnpm --filter @cleanstart/cms lint`
- [ ] `pnpm --filter @cleanstart/cms typecheck`
- [ ] `pnpm --filter @cleanstart/cms test -- run src/payload/lib/content-insights` (build-snapshot + seo-sections green)
- [ ] `pnpm --filter @cleanstart/cms build`
- [ ] Manual: re-run the snapshot (so `queries`/`queryPages` populate the cache), refresh `/admin/content-insights`, confirm the three SEO sections render with real data.

---

## Self-review notes

- **Spec coverage:** striking-distance (Task 4 `deriveStrikingDistance` + Task 6 UI) ✓ · low-CTR (Task 4 `deriveLowCtr` + curve) ✓ · cannibalization (Task 4 `deriveCannibalization` page→doc join) ✓ · extend snapshot/cron/endpoint not parallel (Tasks 1–3, 5) ✓ · on content-insights page, no new route (Task 6) ✓ · content-gap deferred ✓.
- **No migration:** reuses `content:snapshot` (now also carrying `queries`/`queryPages`); the daily cron + read-through endpoint are unchanged in shape; the cache row is already covered by the prune cron.
- **Type consistency:** `SnapshotQueryRow`/`SnapshotQueryPageRow`/`StrikingDistanceRow`/`LowCtrRow`/`CannibalizationRow` defined once in `types.ts`; derivations + components import them. `expectedCtr` is the single CTR-curve source.
- **Bounded fetch:** two added GSC calls (1000 + 2000 rows) per daily snapshot — no per-request paid calls, no per-row API calls.
- **Cannibalization join** reuses `pathToDocKey` + `normalizePath` from Phase 3; only known content docs count (external/listing pages ignored).
```
