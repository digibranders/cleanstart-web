# Custom Filterable Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/admin/analytics` page in the CMS that shows filterable GA4 traffic insights (KPIs, daily trend, top pages, top countries) with date-range / country / collection filters, plus GSC search sections that activate when Search Console access is granted.

**Architecture:** Reuse the existing Phase-J2 plumbing — `analyticsCache` collection, `cache.ts` read/write helpers, the `@google-analytics/data` client (already `fallback:true`), and the custom-admin-view pattern from `Dashboard.tsx`. Backend adds pure data-shaping functions (unit-tested) + a **read-through cache endpoint** (`/api/dashboards/ga4-overview`) that fetches a filtered GA4 report on demand and caches it under `scope:'global'` with a filter-derived key. Frontend adds a client React view that calls the endpoint as filters change and renders hand-rolled SVG charts (no new dependency). GSC mirrors GA4 (`/api/dashboards/gsc-overview`) and is gated behind a "Connect Search Console" empty state until a `gscSearchAnalyticsApi` row + credentials exist.

**Tech Stack:** Payload 3 (custom admin views + endpoints), `@google-analytics/data` (REST), `googleapis` (GSC), React 19 client components, inline SVG charts, Vitest. No schema migration (reuses `analyticsCache` with new free-text keys under `scope:'global'`).

---

## File Structure

**Create:**
- `apps/cms/src/payload/lib/dashboards/overview-types.ts` — shared payload types (`Ga4OverviewPayload`, `GscOverviewPayload`, `OverviewWindow`, `OverviewFilters`).
- `apps/cms/src/payload/lib/dashboards/overview-filters.ts` — `WINDOW_DAYS`, `COLLECTION_PATH_PREFIX`, `buildGa4DimensionFilter`, `buildOverviewCacheKey`. **Pure, unit-tested.**
- `apps/cms/src/payload/lib/dashboards/overview-filters.test.ts`
- `apps/cms/src/payload/lib/integrations/kinds/ga4-overview.ts` — `buildOverviewRequests`, `shapeGa4Overview`, `fetchGa4Overview`. Reuses `buildClient` exported from `ga4-data-api.ts`.
- `apps/cms/src/payload/lib/integrations/kinds/ga4-overview.test.ts` — tests `shapeGa4Overview`.
- `apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts` — `fetchGscOverview` (totals + top queries + top pages over a window).
- `apps/cms/src/payload/endpoints/dashboards-overview.ts` — `ga4OverviewEndpoint`, `gscOverviewEndpoint` (read-through cache).
- `apps/cms/src/payload/admin/components/Analytics/AnalyticsView.tsx` — server shell registered at `views.analytics`.
- `apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx` — client component: filter state + fetch + layout.
- `apps/cms/src/payload/admin/components/Analytics/FilterBar.tsx`
- `apps/cms/src/payload/admin/components/Analytics/KpiCards.tsx`
- `apps/cms/src/payload/admin/components/Analytics/TrendChart.tsx` — SVG area/line.
- `apps/cms/src/payload/admin/components/Analytics/TopList.tsx` — top pages / queries table.
- `apps/cms/src/payload/admin/components/Analytics/CountryBars.tsx` — SVG horizontal bars.
- `apps/cms/src/payload/admin/components/Analytics/AnalyticsNavLink.tsx` — nav entry.
- `apps/cms/src/payload/admin/styles/analytics.scss` (or extend existing dashboard SCSS) — `.cs-analytics-*`.

**Modify:**
- `apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts` — `export` the existing `buildClient` (one-word change) so `ga4-overview.ts` reuses the `fallback:true` client.
- `apps/cms/src/payload.config.ts` — register the two endpoints, the `views.analytics` route, and the nav link.

---

## Phase 1 — GA4 overview backend (deliverable now; GA4 works in prod)

### Task 1: Shared overview types

**Files:**
- Create: `apps/cms/src/payload/lib/dashboards/overview-types.ts`

- [ ] **Step 1: Write the types**

```ts
export type OverviewWindow = '7d' | '28d' | '90d';

export interface OverviewFilters {
  window: OverviewWindow;
  /** GA4 country display name, e.g. "United States". `null` = all countries. */
  country: string | null;
  /** Collection slug, e.g. "blogs". `null` = all content. */
  collection: string | null;
}

export interface Ga4OverviewPayload {
  window: OverviewWindow;
  totals: { sessions: number; totalUsers: number; engagementRate: number; conversions: number };
  daily: Array<{ date: string; sessions: number }>;
  topPages: Array<{ path: string; sessions: number; views: number }>;
  topCountries: Array<{ country: string; sessions: number }>;
}

export interface GscQueryRow {
  query: string; clicks: number; impressions: number; ctr: number; position: number;
}
export interface GscPageRow {
  path: string; clicks: number; impressions: number; ctr: number; position: number;
}
export interface GscOverviewPayload {
  window: OverviewWindow;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/lib/dashboards/overview-types.ts
git commit -m "feat(cms): analytics overview payload types"
```

---

### Task 2: Filter + cache-key logic (pure, TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/dashboards/overview-filters.ts`
- Test: `apps/cms/src/payload/lib/dashboards/overview-filters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { buildGa4DimensionFilter, buildOverviewCacheKey, WINDOW_DAYS } from './overview-filters';

describe('WINDOW_DAYS', () => {
  it('maps windows to day counts', () => {
    expect(WINDOW_DAYS['7d']).toBe(7);
    expect(WINDOW_DAYS['28d']).toBe(28);
    expect(WINDOW_DAYS['90d']).toBe(90);
  });
});

describe('buildOverviewCacheKey', () => {
  it('uses "all" for null filters', () => {
    expect(buildOverviewCacheKey('ga4', { window: '28d', country: null, collection: null }))
      .toBe('overview:ga4:28d:all:all');
  });
  it('slugs country + collection', () => {
    expect(buildOverviewCacheKey('ga4', { window: '7d', country: 'United States', collection: 'blogs' }))
      .toBe('overview:ga4:7d:united-states:blogs');
  });
});

describe('buildGa4DimensionFilter', () => {
  it('returns undefined when no filters set', () => {
    expect(buildGa4DimensionFilter(null, null)).toBeUndefined();
  });
  it('builds a country-only filter', () => {
    expect(buildGa4DimensionFilter('India', null)).toEqual({
      andGroup: { expressions: [
        { filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: 'India' } } },
      ] },
    });
  });
  it('builds a country + path-prefix filter', () => {
    const f = buildGa4DimensionFilter('India', '/blogs');
    expect(f?.andGroup?.expressions).toHaveLength(2);
    expect(f?.andGroup?.expressions?.[1]).toEqual({
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blogs' } },
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- overview-filters`
Expected: FAIL ("Cannot find module './overview-filters'").

- [ ] **Step 3: Implement**

```ts
import type { OverviewFilters, OverviewWindow } from './overview-types';

export const WINDOW_DAYS: Record<OverviewWindow, number> = { '7d': 7, '28d': 28, '90d': 90 };

/** Collection slug → GA4 pagePath prefix. Keep in sync with apps/web routes. */
export const COLLECTION_PATH_PREFIX: Record<string, string> = {
  blogs: '/blogs',
  guides: '/guide',
  news: '/news',
  knowledgeBase: '/knowledge-hub',
  events: '/events',
  webinars: '/webinars',
  resources: '/resource-center',
  caseStudies: '/case-studies',
};

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const buildOverviewCacheKey = (
  provider: 'ga4' | 'gsc',
  f: OverviewFilters,
): string =>
  `overview:${provider}:${f.window}:${f.country ? slug(f.country) : 'all'}:${f.collection ?? 'all'}`;

interface Ga4FilterExpr {
  andGroup?: { expressions: Array<{ filter: { fieldName: string; stringFilter: { matchType: string; value: string } } }> };
}

export const buildGa4DimensionFilter = (
  country: string | null,
  pathPrefix: string | null,
): Ga4FilterExpr | undefined => {
  const expressions: Ga4FilterExpr['andGroup'] extends infer A ? A extends { expressions: infer E } ? E : never : never = [];
  if (country) expressions.push({ filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: country } } });
  if (pathPrefix) expressions.push({ filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: pathPrefix } } });
  return expressions.length ? { andGroup: { expressions } } : undefined;
};
```

> Note: if the inferred-type line trips Biome/tsc, replace with `const expressions: Array<{ filter: { fieldName: string; stringFilter: { matchType: string; value: string } } }> = [];`.

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- overview-filters`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/dashboards/overview-filters.ts apps/cms/src/payload/lib/dashboards/overview-filters.test.ts
git commit -m "feat(cms): analytics overview filter + cache-key helpers (TDD)"
```

---

### Task 3: GA4 overview report — shape + fetch

**Files:**
- Modify: `apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts` — export `buildClient`.
- Create: `apps/cms/src/payload/lib/integrations/kinds/ga4-overview.ts`
- Test: `apps/cms/src/payload/lib/integrations/kinds/ga4-overview.test.ts`

- [ ] **Step 1: Export `buildClient`**

In `ga4-data-api.ts`, change `const buildClient =` to `export const buildClient =` (the `fallback:true` client is reused).

- [ ] **Step 2: Write the failing test for `shapeGa4Overview`**

```ts
import { describe, expect, it } from 'vitest';
import { shapeGa4Overview } from './ga4-overview';

const fakeBatch = {
  reports: [
    { rows: [{ metricValues: [{ value: '4322' }, { value: '3140' }, { value: '0.48' }, { value: '0' }] }] },
    { rows: [
      { dimensionValues: [{ value: '20260601' }], metricValues: [{ value: '150' }] },
      { dimensionValues: [{ value: '20260602' }], metricValues: [{ value: '170' }] },
    ] },
    { rows: [
      { dimensionValues: [{ value: '/blogs/sbom-101' }], metricValues: [{ value: '540' }, { value: '900' }] },
    ] },
    { rows: [
      { dimensionValues: [{ value: 'United States' }], metricValues: [{ value: '1600' }] },
    ] },
  ],
};

describe('shapeGa4Overview', () => {
  it('maps the 4-report batch into the payload', () => {
    const out = shapeGa4Overview('28d', fakeBatch);
    expect(out.window).toBe('28d');
    expect(out.totals).toEqual({ sessions: 4322, totalUsers: 3140, engagementRate: 0.48, conversions: 0 });
    expect(out.daily).toEqual([
      { date: '20260601', sessions: 150 },
      { date: '20260602', sessions: 170 },
    ]);
    expect(out.topPages[0]).toEqual({ path: '/blogs/sbom-101', sessions: 540, views: 900 });
    expect(out.topCountries[0]).toEqual({ country: 'United States', sessions: 1600 });
  });

  it('defaults missing values to 0 / empty', () => {
    const out = shapeGa4Overview('7d', { reports: [{}, {}, {}, {}] });
    expect(out.totals.sessions).toBe(0);
    expect(out.daily).toEqual([]);
    expect(out.topPages).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- ga4-overview`
Expected: FAIL ("Cannot find module './ga4-overview'").

- [ ] **Step 4: Implement `ga4-overview.ts`**

```ts
import type { Ga4Credentials } from '../credentials';
import { buildClient } from './ga4-data-api';
import { WINDOW_DAYS, buildGa4DimensionFilter } from '../../dashboards/overview-filters';
import type { Ga4OverviewPayload, OverviewWindow } from '../../dashboards/overview-types';

const num = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

interface GaReport { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> }
interface GaBatch { reports?: GaReport[] }

export const shapeGa4Overview = (window: OverviewWindow, batch: GaBatch): Ga4OverviewPayload => {
  const reports = batch.reports ?? [];
  const totalsRow = reports[0]?.rows?.[0]?.metricValues ?? [];
  return {
    window,
    totals: {
      sessions: num(totalsRow[0]?.value),
      totalUsers: num(totalsRow[1]?.value),
      engagementRate: num(totalsRow[2]?.value),
      conversions: num(totalsRow[3]?.value),
    },
    daily: (reports[1]?.rows ?? []).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
    topPages: (reports[2]?.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
      views: num(r.metricValues?.[1]?.value),
    })),
    topCountries: (reports[3]?.rows ?? []).map((r) => ({
      country: r.dimensionValues?.[0]?.value ?? '',
      sessions: num(r.metricValues?.[0]?.value),
    })),
  };
};

export const fetchGa4Overview = async (
  creds: Ga4Credentials,
  filters: { window: OverviewWindow; country: string | null; collection: string | null },
  pathPrefix: string | null,
): Promise<Ga4OverviewPayload> => {
  const client = buildClient(creds);
  const property = `properties/${creds.propertyId}`;
  const start = `${WINDOW_DAYS[filters.window]}daysAgo`;
  const dim = buildGa4DimensionFilter(filters.country, pathPrefix);
  const range = [{ startDate: start, endDate: 'today' }];
  const withFilter = <T extends object>(req: T): T => (dim ? { ...req, dimensionFilter: dim } : req);
  const [resp] = await client.batchRunReports({
    property,
    requests: [
      withFilter({ property, dateRanges: range, metrics: [
        { name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }, { name: 'conversions' },
      ] }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
    ],
  });
  return shapeGa4Overview(filters.window, resp as GaBatch);
};
```

- [ ] **Step 5: Run test, verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- ga4-overview`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/lib/integrations/kinds/ga4-overview.ts apps/cms/src/payload/lib/integrations/kinds/ga4-overview.test.ts apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts
git commit -m "feat(cms): GA4 filterable overview report (shape TDD + fetch)"
```

---

### Task 4: Read-through endpoint `/api/dashboards/ga4-overview`

**Files:**
- Create: `apps/cms/src/payload/endpoints/dashboards-overview.ts`
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Implement the endpoint** (mirror auth + JSON pattern from `endpoints/dashboards.ts`)

```ts
import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import { isStale, readCache, writeCache, TTL_MS } from '../lib/integrations/cache';
import { resolveGa4Credentials } from '../lib/integrations/credentials';
import { fetchGa4Overview } from '../lib/integrations/kinds/ga4-overview';
import { findRowsOfKind } from '../lib/integrations/kinds/types';
import { COLLECTION_PATH_PREFIX, buildOverviewCacheKey } from '../lib/dashboards/overview-filters';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });

const querySchema = z.object({
  window: z.enum(['7d', '28d', '90d']).default('28d'),
  country: z.string().min(1).max(80).optional(),
  collection: z.string().min(1).max(40).optional(),
});

export const ga4OverviewEndpoint: Endpoint = {
  path: '/dashboards/ga4-overview',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) return json({ ok: false, error: 'forbidden' }, { status: 403 });
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return json({ ok: false, error: 'bad_params' }, { status: 400 });
    const filters = { window: parsed.data.window, country: parsed.data.country ?? null, collection: parsed.data.collection ?? null };

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
        req.payload.logger.warn({ error: err instanceof Error ? err.message : String(err), key }, 'ga4 overview fetch failed');
      }
    }
    if (cached) return json({ ok: true, configured: true, fromCache: true, stale: true, capturedAt: cached.capturedAt, payload: cached.payload });
    return json({ ok: false, configured: true, error: 'fetch_failed' }, { status: 502 });
  },
};
```

- [ ] **Step 2: Register in `payload.config.ts`**

Add to the imports block alongside the existing dashboard endpoints, and add `ga4OverviewEndpoint` to the `endpoints: [...]` array:

```ts
import { ga4OverviewEndpoint, gscOverviewEndpoint } from './payload/endpoints/dashboards-overview';
```
(Add `gscOverviewEndpoint` now; implemented in Phase 3 — create a temporary stub export in `dashboards-overview.ts` if Phase 3 isn't done yet: `export const gscOverviewEndpoint: Endpoint = { path: '/dashboards/gsc-overview', method: 'get', handler: async () => json({ ok: true, configured: false, payload: null }) };`)

- [ ] **Step 3: Manual smoke (prod has data)**

Run locally against prod data or in prod: `curl -s '<cms>/api/dashboards/ga4-overview?window=28d' -H 'Cookie: <admin session>'`
Expected: `{ ok:true, configured:true, payload:{ totals:{ sessions:… }, daily:[…], topPages:[…], topCountries:[…] } }`.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/endpoints/dashboards-overview.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): GA4 overview read-through endpoint + gsc stub"
```

---

## Phase 2 — Analytics admin page (GA4 UI)

> Mirror `admin/components/Dashboard/Dashboard.tsx` (server view) + `AnalyticsCards.tsx` (cards) for structure. The view is registered as a NEW route `/admin/analytics` (the existing `views.dashboard` overrides the landing page — do not touch it).

### Task 5: Register the route + nav link

**Files:**
- Create: `apps/cms/src/payload/admin/components/Analytics/AnalyticsView.tsx`
- Create: `apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx` (placeholder for now)
- Create: `apps/cms/src/payload/admin/components/Analytics/AnalyticsNavLink.tsx`
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Minimal client + server shell**

`AnalyticsClient.tsx`:
```tsx
'use client';
export function AnalyticsClient(): React.ReactElement {
  return <div className="cs-analytics">Analytics — loading…</div>;
}
export default AnalyticsClient;
```

`AnalyticsView.tsx`:
```tsx
import type { AdminViewServerProps } from 'payload';
import type { ReactElement } from 'react';
import { AnalyticsClient } from './AnalyticsClient';

export const AnalyticsView = (_props: AdminViewServerProps): ReactElement => (
  <div className="cs-dashboard"><AnalyticsClient /></div>
);
export default AnalyticsView;
```

`AnalyticsNavLink.tsx`:
```tsx
'use client';
import Link from 'next/link';
export function AnalyticsNavLink(): React.ReactElement {
  return <Link href="/admin/analytics" className="cs-nav-analytics-link">Analytics</Link>;
}
export default AnalyticsNavLink;
```

- [ ] **Step 2: Register in `payload.config.ts`** under `admin.components`

```ts
views: {
  dashboard: { Component: './payload/admin/components/Dashboard/Dashboard.tsx#Dashboard' },
  analytics: {
    Component: './payload/admin/components/Analytics/AnalyticsView.tsx#AnalyticsView',
    path: '/analytics',
  },
},
```
And append to `afterNavLinks`: `'./payload/admin/components/Analytics/AnalyticsNavLink.tsx#AnalyticsNavLink'`.

- [ ] **Step 3: Verify route loads**

Run the CMS, visit `/admin/analytics` → see "Analytics — loading…". Verify the nav link appears and navigates.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/admin/components/Analytics/ apps/cms/src/payload.config.ts
git commit -m "feat(cms): register /admin/analytics route + nav link"
```

---

### Task 6: SVG TrendChart

**Files:**
- Create: `apps/cms/src/payload/admin/components/Analytics/TrendChart.tsx`

- [ ] **Step 1: Implement** (pure SVG; props are the `daily` array)

```tsx
import type { ReactElement } from 'react';

interface Point { date: string; sessions: number }
export function TrendChart({ daily, color = '#8b7ff0' }: { daily: Point[]; color?: string }): ReactElement {
  const W = 640, H = 180, P = 8;
  if (daily.length < 2) return <div className="cs-analytics__empty">Not enough data yet.</div>;
  const max = Math.max(...daily.map((d) => d.sessions), 1);
  const x = (i: number) => P + (i / (daily.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = daily.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.sessions).toFixed(1)}`).join(' ');
  const area = `${line} L${x(daily.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Sessions over the last ${daily.length} days`} preserveAspectRatio="xMidYMid meet">
      <path d={area} fill={color} fillOpacity={0.14} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
export default TrendChart;
```

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/admin/components/Analytics/TrendChart.tsx
git commit -m "feat(cms): analytics trend chart (svg)"
```

---

### Task 7: KpiCards, TopList, CountryBars, FilterBar

**Files:**
- Create the four components under `apps/cms/src/payload/admin/components/Analytics/`.

- [ ] **Step 1: KpiCards.tsx**

```tsx
import type { ReactElement } from 'react';
interface Kpi { label: string; value: string; muted?: boolean }
export function KpiCards({ items }: { items: Kpi[] }): ReactElement {
  return (
    <div className="cs-analytics__kpis">
      {items.map((k) => (
        <div key={k.label} className="cs-analytics__kpi">
          <div className="cs-analytics__kpi-label">{k.label}</div>
          <div className={`cs-analytics__kpi-value${k.muted ? ' is-muted' : ''}`}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}
export default KpiCards;
```

- [ ] **Step 2: TopList.tsx** (works for pages and queries via columns prop)

```tsx
import type { ReactElement } from 'react';
interface Col { key: string; label: string; align?: 'right' }
export function TopList({ title, columns, rows }: { title: string; columns: Col[]; rows: Array<Record<string, string | number>> }): ReactElement {
  if (!rows.length) return <div className="cs-analytics__panel"><h3>{title}</h3><div className="cs-analytics__empty">No data for this filter.</div></div>;
  return (
    <div className="cs-analytics__panel">
      <h3>{title}</h3>
      <div className="cs-analytics__thead" style={{ gridTemplateColumns: `1fr repeat(${columns.length - 1}, 60px)` }}>
        {columns.map((c) => <span key={c.key} className={c.align === 'right' ? 'is-right' : ''}>{c.label}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="cs-analytics__trow" style={{ gridTemplateColumns: `1fr repeat(${columns.length - 1}, 60px)` }}>
          {columns.map((c) => <span key={c.key} className={c.align === 'right' ? 'is-right' : 'is-primary'}>{r[c.key]}</span>)}
        </div>
      ))}
    </div>
  );
}
export default TopList;
```

- [ ] **Step 3: CountryBars.tsx**

```tsx
import type { ReactElement } from 'react';
export function CountryBars({ rows }: { rows: Array<{ country: string; sessions: number }> }): ReactElement {
  if (!rows.length) return <div className="cs-analytics__empty">No country data.</div>;
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div className="cs-analytics__bars">
      {rows.map((r) => (
        <div key={r.country} className="cs-analytics__bar-row">
          <span className="cs-analytics__bar-label">{r.country}</span>
          <span className="cs-analytics__bar-track"><span className="cs-analytics__bar-fill" style={{ width: `${Math.round((r.sessions / max) * 100)}%` }} /></span>
          <span className="cs-analytics__bar-val">{r.sessions.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
export default CountryBars;
```

- [ ] **Step 4: FilterBar.tsx**

```tsx
'use client';
import type { ReactElement } from 'react';
import type { OverviewFilters, OverviewWindow } from '../../../lib/dashboards/overview-types';

const WINDOWS: OverviewWindow[] = ['7d', '28d', '90d'];
const COLLECTIONS = [['', 'All content'], ['blogs', 'Blogs'], ['guides', 'Guides'], ['knowledgeBase', 'Knowledge Hub'], ['news', 'News']] as const;

export function FilterBar({ filters, countries, onChange }: {
  filters: OverviewFilters; countries: string[];
  onChange: (next: OverviewFilters) => void;
}): ReactElement {
  return (
    <div className="cs-analytics__filters">
      <div className="cs-analytics__pills">
        {WINDOWS.map((w) => (
          <button key={w} type="button" className={w === filters.window ? 'is-on' : ''} onClick={() => onChange({ ...filters, window: w })}>{w}</button>
        ))}
      </div>
      <select value={filters.collection ?? ''} onChange={(e) => onChange({ ...filters, collection: e.target.value || null })}>
        {COLLECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={filters.country ?? ''} onChange={(e) => onChange({ ...filters, country: e.target.value || null })}>
        <option value="">All countries</option>
        {countries.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
export default FilterBar;
```

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/Analytics/
git commit -m "feat(cms): analytics kpi cards, top list, country bars, filter bar"
```

---

### Task 8: Wire AnalyticsClient (fetch + filters + layout)

**Files:**
- Modify: `apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx`
- Create/extend: `apps/cms/src/payload/admin/styles/analytics.scss` (import into the admin SCSS entry).

- [ ] **Step 1: Implement the client**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import type { Ga4OverviewPayload, OverviewFilters } from '../../../lib/dashboards/overview-types';
import { FilterBar } from './FilterBar';
import { KpiCards } from './KpiCards';
import { TrendChart } from './TrendChart';
import { TopList } from './TopList';
import { CountryBars } from './CountryBars';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (n: number) => n.toLocaleString();

export function AnalyticsClient(): ReactElement {
  const [filters, setFilters] = useState<OverviewFilters>({ window: '28d', country: null, collection: null });
  const [data, setData] = useState<Ga4OverviewPayload | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    const qs = new URLSearchParams({ window: filters.window });
    if (filters.country) qs.set('country', filters.country);
    if (filters.collection) qs.set('collection', filters.collection);
    fetch(`/api/dashboards/ga4-overview?${qs.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) return setState('error');
        if (!j.configured) return setState('unconfigured');
        setData(j.payload); setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div className="cs-analytics">
      <header className="cs-analytics__head"><h1>Analytics</h1></header>
      <FilterBar filters={filters} countries={(data?.topCountries ?? []).map((c) => c.country)} onChange={setFilters} />
      {state === 'unconfigured' && <div className="cs-analytics__empty">GA4 is not connected. Add a Google Analytics 4 integration row.</div>}
      {state === 'error' && <div className="cs-analytics__empty">Couldn’t load analytics. Try again shortly.</div>}
      {state === 'ready' && data && (
        <>
          <KpiCards items={[
            { label: 'Sessions', value: fmt(data.totals.sessions) },
            { label: 'Users', value: fmt(data.totals.totalUsers) },
            { label: 'Engagement', value: pct(data.totals.engagementRate) },
            { label: 'Key events', value: data.totals.conversions ? fmt(data.totals.conversions) : '—', muted: !data.totals.conversions },
          ]} />
          <div className="cs-analytics__panel"><h3>Sessions · last {data.daily.length} days</h3><TrendChart daily={data.daily} /></div>
          <div className="cs-analytics__cols">
            <TopList title="Top pages" columns={[{ key: 'path', label: 'Page' }, { key: 'sessions', label: 'Sess.', align: 'right' }, { key: 'views', label: 'Views', align: 'right' }]}
              rows={data.topPages.map((p) => ({ path: p.path, sessions: fmt(p.sessions), views: fmt(p.views) }))} />
            <div className="cs-analytics__panel"><h3>Top countries</h3><CountryBars rows={data.topCountries} /></div>
          </div>
        </>
      )}
      {state === 'loading' && <div className="cs-analytics__empty">Loading…</div>}
    </div>
  );
}
export default AnalyticsClient;
```

- [ ] **Step 2: Add `.cs-analytics-*` styles** mirroring `.cs-dashboard__*` (grid for kpis `repeat(auto-fit,minmax(150px,1fr))`, panels with the admin card bg/border, filter pills, bar rows). Reuse existing dashboard SCSS variables.

- [ ] **Step 3: Verify against prod GA4 data** — visit `/admin/analytics`, change window/collection/country, confirm KPIs + chart + tables update.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx apps/cms/src/payload/admin/styles/analytics.scss
git commit -m "feat(cms): wire filterable GA4 analytics view"
```

---

## Phase 3 — GSC integration (activates when access granted)

### Task 9: GSC overview report

**Files:**
- Create: `apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts` (reuse the JWT client pattern from `gsc-search-analytics.ts`).

- [ ] **Step 1: Implement `fetchGscOverview`** — one `searchanalytics.query` per dimension (`query`, `page`) + a totals query, over `WINDOW_DAYS[window]`. Map to `GscOverviewPayload`. Pattern is identical to `fetchTopQueries`; add `dimensions: ['page']` for top pages and an empty-dimension query for totals (clicks/impressions/ctr/position).

```ts
import { google, type searchconsole_v1 } from 'googleapis';
import type { GscCredentials } from '../credentials';
import { WINDOW_DAYS } from '../../dashboards/overview-filters';
import type { GscOverviewPayload, OverviewWindow } from '../../dashboards/overview-types';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const client = (creds: GscCredentials): searchconsole_v1.Searchconsole => {
  const email = creds.serviceAccountJson.client_email;
  const key = creds.serviceAccountJson.private_key;
  const auth = new google.auth.JWT({
    ...(typeof email === 'string' ? { email } : {}),
    ...(typeof key === 'string' ? { key } : {}),
    scopes: SCOPES,
  });
  return google.searchconsole({ version: 'v1', auth });
};

export const fetchGscOverview = async (creds: GscCredentials, window: OverviewWindow): Promise<GscOverviewPayload> => {
  const c = client(creds);
  const now = new Date();
  const endDate = fmtDate(now);
  const startDate = fmtDate(new Date(now.getTime() - WINDOW_DAYS[window] * 86400000));
  const body = (dimensions: string[]) => ({ siteUrl: creds.siteUrl, requestBody: { startDate, endDate, dimensions, rowLimit: 10 } });
  const [totalsR, queriesR, pagesR] = await Promise.all([
    c.searchanalytics.query({ siteUrl: creds.siteUrl, requestBody: { startDate, endDate, rowLimit: 1 } }),
    c.searchanalytics.query(body(['query'])),
    c.searchanalytics.query(body(['page'])),
  ]);
  const t = totalsR.data.rows?.[0];
  return {
    window,
    totals: { clicks: t?.clicks ?? 0, impressions: t?.impressions ?? 0, ctr: t?.ctr ?? 0, position: t?.position ?? 0 },
    topQueries: (queriesR.data.rows ?? []).map((r) => ({ query: r.keys?.[0] ?? '', clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: r.ctr ?? 0, position: r.position ?? 0 })),
    topPages: (pagesR.data.rows ?? []).map((r) => ({ path: r.keys?.[0] ?? '', clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: r.ctr ?? 0, position: r.position ?? 0 })),
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts
git commit -m "feat(cms): GSC filterable overview report"
```

---

### Task 10: Replace the GSC endpoint stub with the real handler

**Files:**
- Modify: `apps/cms/src/payload/endpoints/dashboards-overview.ts`

- [ ] **Step 1: Implement `gscOverviewEndpoint`** mirroring `ga4OverviewEndpoint` but using `gscSearchAnalyticsApi` rows, `getGscCredentialsFromRow`, `fetchGscOverview`, `TTL_MS.gscSearchAnalyticsApi`, cache key `buildOverviewCacheKey('gsc', { window, country:null, collection:null })`. Returns `{ ok:true, configured:false, payload:null }` when no row/creds (drives the empty state).

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/endpoints/dashboards-overview.ts
git commit -m "feat(cms): GSC overview read-through endpoint"
```

---

### Task 11: Wire GSC into the view (gated)

**Files:**
- Modify: `apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx`

- [ ] **Step 1:** Add a second `useEffect` fetching `/api/dashboards/gsc-overview?window=…`. When `configured:false`, render a **"Connect Search Console"** strip (mirroring `AnalyticsCards.tsx`'s connect strip). When configured: a GSC KPI row (clicks/impressions/CTR/avg position) + a `TopList` of `topQueries`. Optionally merge GSC per-page clicks into the Top pages table by `path`.

- [ ] **Step 2: Verify** — with no GSC row, the GSC section shows the connect strip; the GA4 sections render normally.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/admin/components/Analytics/AnalyticsClient.tsx
git commit -m "feat(cms): GSC sections in analytics view (gated empty state)"
```

---

## Final checks (run before declaring done)

- [ ] `pnpm --filter @cleanstart/cms lint`
- [ ] `pnpm --filter @cleanstart/cms typecheck`
- [ ] `pnpm --filter @cleanstart/cms test` (overview-filters + ga4-overview suites green)
- [ ] `pnpm --filter @cleanstart/cms build`
- [ ] `pnpm --filter @cleanstart/cms generate:types` if any collection touched (none expected — no schema change)

---

## Self-review notes

- **Spec coverage:** dedicated page (Task 5) ✓ · GA4 KPIs/trend/top-pages/countries (Tasks 3,6,7,8) ✓ · date/country/collection filters (Tasks 2,4,7,8) ✓ · GSC sections gated (Tasks 9–11) ✓ · charts without new deps (Task 6 SVG) ✓.
- **No schema migration:** reuses `analyticsCache` `scope:'global'` with `overview:*` keys (free-text `key` field). The daily prune cron already covers these rows.
- **Quota:** read-through cache (TTL 20 min for GA4) means at most one GA4 batch per distinct filter combo per 20 min — well under the 200k-tokens/day property quota.
- **GA4 conversions** intentionally render `—` ("needs setup") until key events are wired (separate task).
- **Type consistency:** `Ga4OverviewPayload`/`GscOverviewPayload`/`OverviewFilters`/`OverviewWindow` defined once in `overview-types.ts` and imported everywhere; `buildOverviewCacheKey`/`buildGa4DimensionFilter`/`WINDOW_DAYS`/`COLLECTION_PATH_PREFIX` defined once in `overview-filters.ts`.
- **Independence:** Phases 1–2 ship value with GA4 alone (works in prod today). Phase 3 is additive and inert until a GSC row + access exist.
