# Phase 5 — Advanced Analytics Implementation Plan (Groups A+B)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans or subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Enrich `/admin/analytics` with seven features: period-over-period deltas, channel/device/source splits, position-distribution histogram, CTR-vs-position scatter, per-row sparklines, Core Web Vitals (CrUX), and realtime active users.

**Architecture:** Extend the existing GA4/GSC overview fetchers + read-through endpoints with new fields (deltas/splits/sparkline/buckets/scatter). Add two new read-through fetchers: CrUX (daily-cached, gated on `CRUX_API_KEY`) and GA4 Realtime (60s TTL, client-polled). Pure derivations are TDD'd in one `advanced-metrics.ts`. No schema/migration.

**Tech Stack:** Payload 3, `@google-analytics/data` (incl. `runRealtimeReport`), CrUX REST API, React 19 client, inline SVG, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-24-advanced-analytics-design.md`

---

## File Structure

**Create:**
- `apps/cms/src/payload/lib/dashboards/advanced-metrics.ts` (+ `.test.ts`) — pure derivations.
- `apps/cms/src/payload/lib/integrations/kinds/crux.ts` (+ `crux-map.test.ts` for the pure mapper) — CrUX fetch + p75/rating map.
- `apps/cms/src/payload/lib/integrations/kinds/ga4-realtime.ts` — realtime fetch + shape.
- `apps/cms/src/payload/endpoints/dashboards-advanced.ts` — `cruxEndpoint`, `ga4RealtimeEndpoint`.
- `apps/cms/src/payload/jobs/refresh-crux.ts` — daily CrUX cache.
- `apps/cms/src/payload/admin/components/Analytics/{Split,PositionHistogram,CtrScatter,WebVitals,RealtimeWidget,Sparkline}.tsx`

**Modify:**
- `overview-types.ts` — new payload fields + CrUX/realtime types.
- `ga4-overview.ts`, `gsc-overview.ts` — extra reports + shaping.
- `KpiCards.tsx`, `TopList.tsx` — deltas + sparklines.
- `AnalyticsClient.tsx` — wire new sections + realtime poll.
- `payload.config.ts` — register endpoints + cron.
- `credentials.ts` — `resolveCruxCredentials`.
- `cache.ts` — add `crux` provider to `CachedProvider` + `TTL_MS`.
- `_analytics.scss` — new section styles.
- `CLAUDE.md` — CrUX cron row.

---

## Task 1: Extend payload types

**Files:** Modify `apps/cms/src/payload/lib/dashboards/overview-types.ts`

- [ ] **Step 1: Add delta + split + sparkline fields to `Ga4OverviewPayload`** — change `totals`/`topPages` and add fields:

```ts
export interface MetricDelta {
  value: number;
  deltaPct: number | null; // null when prior period was 0
}
export interface SplitRow { label: string; sessions: number }

// In Ga4OverviewPayload, ADD (keep existing fields):
  deltas?: { sessions: MetricDelta; totalUsers: MetricDelta; engagementRate: MetricDelta; conversions: MetricDelta };
  channels?: SplitRow[];
  devices?: SplitRow[];
  sources?: SplitRow[];
  // topPages rows gain an optional sparkline series:
  // topPages: Array<{ path; sessions; views; daily?: Array<{date; sessions}> }>
```
Update the `topPages` element type to add `daily?: Array<{ date: string; sessions: number }>`.

- [ ] **Step 2: Add GSC distribution fields to `GscOverviewPayload`:**

```ts
export interface PositionBucket { label: string; count: number }
export interface ScatterPoint { position: number; ctr: number; impressions: number }
// ADD:
  deltas?: { clicks: MetricDelta; impressions: MetricDelta; ctr: MetricDelta; position: MetricDelta };
  positionBuckets?: PositionBucket[];
  scatter?: ScatterPoint[];
```

- [ ] **Step 3: Add CrUX + realtime payload types:**

```ts
export type CwvRating = 'good' | 'needs-improvement' | 'poor';
export interface CwvMetric { p75: number; rating: CwvRating }
export interface CruxRecord {
  scope: string; // 'origin' or a page path
  formFactor: 'PHONE' | 'DESKTOP';
  lcp: CwvMetric | null;
  inp: CwvMetric | null;
  cls: CwvMetric | null;
}
export interface CruxPayload { records: CruxRecord[] }

export interface RealtimePayload {
  activeUsers: number;
  byPage: Array<{ path: string; users: number }>;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/lib/dashboards/overview-types.ts
git commit -m "feat(cms): advanced analytics payload types (deltas, splits, crux, realtime)"
```

---

## Task 2: Pure derivations (TDD)

**Files:** Create `advanced-metrics.ts` + `advanced-metrics.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { bucketPositions, buildScatter, computeDelta } from './advanced-metrics';

describe('computeDelta', () => {
  it('computes pct change', () => {
    expect(computeDelta(110, 100)).toEqual({ value: 110, deltaPct: 0.1 });
  });
  it('returns null pct when prior is 0', () => {
    expect(computeDelta(50, 0)).toEqual({ value: 50, deltaPct: null });
  });
});

describe('bucketPositions', () => {
  it('buckets query positions into 1-3 / 4-10 / 11-20 / 21+', () => {
    const out = bucketPositions([{ position: 2 }, { position: 3 }, { position: 7 }, { position: 15 }, { position: 40 }]);
    expect(out).toEqual([
      { label: '1–3', count: 2 },
      { label: '4–10', count: 1 },
      { label: '11–20', count: 1 },
      { label: '21+', count: 1 },
    ]);
  });
});

describe('buildScatter', () => {
  it('maps + caps rows by impressions', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ position: i + 1, ctr: 0.1, impressions: (i + 1) * 10 }));
    const out = buildScatter(rows, 3);
    expect(out).toHaveLength(3);
    expect(out[0]?.impressions).toBe(50); // highest-impression kept
  });
});
```

- [ ] **Step 2: Run → fail.** `pnpm --filter @cleanstart/cms test -- run src/payload/lib/dashboards/advanced-metrics`

- [ ] **Step 3: Implement**

```ts
import type { MetricDelta, PositionBucket, ScatterPoint } from './overview-types';

export const computeDelta = (value: number, prior: number): MetricDelta => ({
  value,
  deltaPct: prior > 0 ? (value - prior) / prior : null,
});

export const bucketPositions = (rows: Array<{ position: number }>): PositionBucket[] => {
  const b = { '1–3': 0, '4–10': 0, '11–20': 0, '21+': 0 };
  for (const r of rows) {
    if (r.position <= 3) b['1–3'] += 1;
    else if (r.position <= 10) b['4–10'] += 1;
    else if (r.position <= 20) b['11–20'] += 1;
    else b['21+'] += 1;
  }
  return (Object.keys(b) as Array<keyof typeof b>).map((label) => ({ label, count: b[label] }));
};

export const buildScatter = (
  rows: Array<{ position: number; ctr: number; impressions: number }>,
  cap: number,
): ScatterPoint[] =>
  [...rows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, cap)
    .map((r) => ({ position: r.position, ctr: r.ctr, impressions: r.impressions }));
```

- [ ] **Step 4: Run → pass.** **Step 5: Commit** `feat(cms): advanced-metrics derivations (TDD)`

---

## Task 3: Extend GA4 overview (prior + splits + sparklines)

**Files:** Modify `ga4-overview.ts`

- [ ] **Step 1:** In `fetchGa4Overview`, add a `prevRange` and four reports to the batch (after the existing four):

```ts
  const days = WINDOW_DAYS[filters.window];
  const prevRange = [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }];
  // ...add to requests[] after the country report:
      withFilter({ property, dateRanges: prevRange, metrics: [
        { name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }, { name: 'conversions' } ] }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 }),
```

- [ ] **Step 2:** Extend `shapeGa4Overview` to read reports[4..7] and compute deltas + splits:

```ts
import { computeDelta } from '../../dashboards/advanced-metrics';
// ...in the returned object, ADD:
    deltas: (() => {
      const prev = reports[4]?.rows?.[0]?.metricValues ?? [];
      return {
        sessions: computeDelta(num(totalsRow[0]?.value), num(prev[0]?.value)),
        totalUsers: computeDelta(num(totalsRow[1]?.value), num(prev[1]?.value)),
        engagementRate: computeDelta(num(totalsRow[2]?.value), num(prev[2]?.value)),
        conversions: computeDelta(num(totalsRow[3]?.value), num(prev[3]?.value)),
      };
    })(),
    channels: (reports[5]?.rows ?? []).map((r) => ({ label: r.dimensionValues?.[0]?.value ?? '', sessions: num(r.metricValues?.[0]?.value) })),
    devices: (reports[6]?.rows ?? []).map((r) => ({ label: r.dimensionValues?.[0]?.value ?? '', sessions: num(r.metricValues?.[0]?.value) })),
    sources: (reports[7]?.rows ?? []).map((r) => ({ label: r.dimensionValues?.[0]?.value ?? '', sessions: num(r.metricValues?.[0]?.value) })),
```

- [ ] **Step 3 (sparklines):** Add a `pagePath × date` report and join into `topPages`. After the splits reports add:

```ts
      withFilter({ property, dateRanges: range, dimensions: [{ name: 'pagePath' }, { name: 'date' }],
        metrics: [{ name: 'sessions' }], limit: 2000 }),
```
In `shapeGa4Overview`, build a `Map<path, Array<{date,sessions}>>` from `reports[8]`, then attach `daily` to each `topPages` row by path (sorted by date).

- [ ] **Step 4:** Update `ga4-overview.test.ts` `fakeBatch` to include the extra reports (prev totals + 3 splits + pageDaily) and assert `deltas.sessions.deltaPct`, `channels[0]`, and a `topPages[0].daily` entry.

- [ ] **Step 5:** `pnpm --filter @cleanstart/cms test -- run src/payload/lib/integrations/kinds/ga4-overview` → pass. **Commit** `feat(cms): GA4 overview deltas, splits, sparkline series`.

---

## Task 4: Extend GSC overview (prior + distribution)

**Files:** Modify `gsc-overview.ts`

- [ ] **Step 1:** Add a prior-period totals query and a 1000-row query-distribution query to the parallel `Promise.all`. Compute `deltas` (via `computeDelta`), `positionBuckets` (via `bucketPositions`), `scatter` (via `buildScatter(rows, 200)`) from the distribution rows. Map each row to `{ position, ctr, impressions }`.

- [ ] **Step 2:** Add the three fields to the returned `GscOverviewPayload`.

- [ ] **Step 3:** Typecheck. **Commit** `feat(cms): GSC overview deltas, position histogram, CTR scatter`.

---

## Task 5: (Endpoints already pass payloads through)

`ga4OverviewEndpoint` / `gscOverviewEndpoint` return `payload` verbatim, so the new fields flow through automatically. No change. **No commit.**

---

## Task 6: Group A UI

**Files:** Modify `KpiCards.tsx`, `TopList.tsx`, `AnalyticsClient.tsx`, `_analytics.scss`; create `Split.tsx`, `PositionHistogram.tsx`, `CtrScatter.tsx`, `Sparkline.tsx`.

- [ ] **Step 1: KpiCards delta chip** — add optional `deltaPct?: number | null` to the `Kpi` interface; render a chip when present:

```tsx
{typeof k.deltaPct === 'number' && (
  <span className={`cs-analytics__kpi-delta${k.deltaPct >= 0 ? ' is-up' : ' is-down'}`}>
    {k.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(Math.round(k.deltaPct * 100))}%
  </span>
)}
```

- [ ] **Step 2: Split.tsx** (reuses `cs-analytics__bars`):

```tsx
import type { ReactElement } from 'react';
import type { SplitRow } from '../../../lib/dashboards/overview-types';
export function Split({ title, rows }: { title: string; rows: SplitRow[] }): ReactElement {
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div className="cs-analytics__panel">
      <h3>{title}</h3>
      {rows.length === 0 ? <div className="cs-analytics__empty">No data.</div> : (
        <div className="cs-analytics__bars">
          {rows.map((r) => (
            <div key={r.label} className="cs-analytics__bar-row">
              <span className="cs-analytics__bar-label">{r.label || '(none)'}</span>
              <span className="cs-analytics__bar-track"><span className="cs-analytics__bar-fill" style={{ width: `${Math.round((r.sessions / max) * 100)}%` }} /></span>
              <span className="cs-analytics__bar-val">{r.sessions.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Split;
```

- [ ] **Step 3: PositionHistogram.tsx** — SVG vertical bars over `PositionBucket[]` (4 bars, value labels). **Step 4: CtrScatter.tsx** — SVG scatter, x = position (1..max, inverted so 1 is left), y = ctr, dot radius ∝ √impressions; axis ticks. **Step 5: Sparkline.tsx** — tiny inline SVG polyline from `daily` (width ~80, height ~22, no axes). Full SVG code mirrors `TrendChart.tsx`'s path math at small size.

- [ ] **Step 6: TopList sparkline** — add optional `sparkline?: ReactNode` per row, rendered in a trailing cell.

- [ ] **Step 7: Wire in `AnalyticsClient.tsx`** — pass `deltaPct` into the GA4 + GSC `KpiCards`; add a `cs-analytics__cols` grid of three `<Split>` (channels/devices/sources); add `<PositionHistogram>` + `<CtrScatter>` in the GSC area; pass a `<Sparkline daily={p.daily}/>` into each top-pages row.

- [ ] **Step 8: Styles** — `_analytics.scss`: `&__kpi-delta` (is-up green / is-down red, 12px), scatter/histogram containers, sparkline cell width.

- [ ] **Step 9: Verify + Commit** `feat(cms): analytics deltas, splits, histogram, scatter, sparklines UI`.

---

## Task 7: Core Web Vitals (CrUX)

**Files:** Create `crux.ts`, `crux-map.test.ts`, `refresh-crux.ts`, `WebVitals.tsx`; modify `credentials.ts`, `cache.ts`, `dashboards-advanced.ts`, `payload.config.ts`, `AnalyticsClient.tsx`, `CLAUDE.md`.

- [ ] **Step 1: cache.ts** — add `'crux'` to the `CachedProvider` union and a `crux: 26 * 60 * 60 * 1000` entry to `TTL_MS`.

- [ ] **Step 2: credentials.ts** — add:
```ts
export interface CruxCredentials { readonly apiKey: string }
export const resolveCruxCredentials = (): CruxCredentials | null => {
  const apiKey = process.env.CRUX_API_KEY;
  return apiKey ? { apiKey } : null;
};
```

- [ ] **Step 3: crux.ts pure mapper (TDD)** — `crux-map.test.ts` asserts the rating thresholds, then implement:
```ts
import type { CruxRecord, CwvMetric, CwvRating } from '../../dashboards/overview-types';
const rate = (v: number, good: number, poor: number): CwvRating => (v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor');
export const mapMetric = (p75: number | undefined, good: number, poor: number): CwvMetric | null =>
  typeof p75 === 'number' ? { p75, rating: rate(p75, good, poor) } : null;
export const mapCruxRecord = (scope: string, formFactor: 'PHONE' | 'DESKTOP', metrics: Record<string, { percentiles?: { p75?: number | string } }>): CruxRecord => {
  const p = (k: string): number | undefined => { const v = metrics[k]?.percentiles?.p75; return v == null ? undefined : Number(v); };
  return {
    scope, formFactor,
    lcp: mapMetric(p('largest_contentful_paint'), 2500, 4000),
    inp: mapMetric(p('interaction_to_next_paint'), 200, 500),
    cls: mapMetric(p('cumulative_layout_shift'), 0.1, 0.25),
  };
};
```
Thresholds: LCP 2500/4000 ms, INP 200/500 ms, CLS 0.1/0.25. Tests cover each boundary.

- [ ] **Step 4: crux.ts fetch** — `fetchCrux(creds, origin, pagePaths)`: POST `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${creds.apiKey}` per (scope × formFactor) with body `{ origin }` or `{ url }` + `{ formFactor }`; tolerate 404 (no data) → skip; map via `mapCruxRecord`; return `{ records }`. Use global `fetch`.

- [ ] **Step 5: refresh-crux.ts cron** — daily `0 6 * * *`-ish (`'45 6 * * *'`, queue `cruxRefresh`), gated by PAYLOAD_AUTO_RUN; resolves the GSC siteUrl as origin + top 5 GA4 pages from the cached overview (or a fixed origin from `resolveSiteUrl`); writes `crux:default`. If no `CRUX_API_KEY`, no-op.

- [ ] **Step 6: cruxEndpoint** in `dashboards-advanced.ts` — `/dashboards/crux`, admin/editor auth, read-through (compute-on-miss); returns `{ ok, configured: !!resolveCruxCredentials(), payload }`. Register in `payload.config.ts` **before** `dashboardsGlobalEndpoint`.

- [ ] **Step 7: WebVitals.tsx** — fetch `/api/dashboards/crux`; if `!configured` show "needs setup — set CRUX_API_KEY"; else three rating tiles (LCP/INP/CLS) per scope×formFactor with good/NI/poor colour. Mount in `AnalyticsClient.tsx`.

- [ ] **Step 8: CLAUDE.md** — add `| Core Web Vitals (CrUX) refresh | daily 06:45 | refresh-crux.ts |` to the jobs table; note `CRUX_API_KEY` in the env list.

- [ ] **Step 9: Verify + Commit** `feat(cms): Core Web Vitals (CrUX) section + daily cron (gated)`.

---

## Task 8: Realtime active users

**Files:** Create `ga4-realtime.ts`, `RealtimeWidget.tsx`; modify `dashboards-advanced.ts`, `payload.config.ts`, `AnalyticsClient.tsx`, `advanced-metrics.ts` (shapeRealtime + test).

- [ ] **Step 1: shapeRealtime (TDD)** — in `advanced-metrics.ts`:
```ts
import type { RealtimePayload } from './overview-types';
interface RtBatch { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> }
export const shapeRealtime = (totalRows: RtBatch, pageRows: RtBatch): RealtimePayload => ({
  activeUsers: Number(totalRows.rows?.[0]?.metricValues?.[0]?.value ?? 0),
  byPage: (pageRows.rows ?? []).map((r) => ({ path: r.dimensionValues?.[0]?.value ?? '', users: Number(r.metricValues?.[0]?.value ?? 0) })),
});
```
Add a test asserting activeUsers + byPage mapping.

- [ ] **Step 2: ga4-realtime.ts fetch** — `fetchRealtime(creds)`: `client.runRealtimeReport` twice (totals: metric `activeUsers`; by-page: dimension `unifiedScreenName` or `pagePath`, metric `activeUsers`, limit 8) → `shapeRealtime`.

- [ ] **Step 3: ga4RealtimeEndpoint** — `/dashboards/ga4-realtime`, admin/editor auth, read-through with a 60s TTL (`60 * 1000`), cache key `realtime:default`, provider `ga4DataApi`. Register **before** `dashboardsGlobalEndpoint`.

- [ ] **Step 4: RealtimeWidget.tsx** — client; fetch on mount + `setInterval(60_000)`; render "● N active now" + a tiny top-live-pages list. Cleanup interval on unmount. Mount at the top of `AnalyticsClient.tsx`.

- [ ] **Step 5: Verify + Commit** `feat(cms): realtime active-users widget (60s poll)`.

---

## Final checks

- [ ] `pnpm --filter @cleanstart/cms lint`
- [ ] `pnpm --filter @cleanstart/cms typecheck`
- [ ] `pnpm --filter @cleanstart/cms test -- run src/payload/lib/dashboards src/payload/lib/integrations/kinds/ga4-overview src/payload/lib/integrations/kinds/crux-map`
- [ ] `pnpm --filter @cleanstart/cms build`
- [ ] Manual: `/admin/analytics` shows KPI deltas, three splits, position histogram, CTR scatter, top-page sparklines, the realtime widget, and the Web Vitals section (gated until `CRUX_API_KEY`, live once set).

---

## Self-review notes

- **Spec coverage:** deltas (T1–4,6) ✓ · splits (T3,6) ✓ · histogram (T2,4,6) ✓ · scatter (T2,4,6) ✓ · sparklines (T3,6) ✓ · CrUX (T7, gated) ✓ · realtime (T8) ✓.
- **No migration / no new collection:** reuses `analyticsCache` (`crux:default`, `realtime:default`); `crux` added to the `CachedProvider` enum (code-only).
- **Route-collision lesson:** `cruxEndpoint` + `ga4RealtimeEndpoint` registered before `/dashboards/:provider`.
- **Gating:** CrUX inert until `CRUX_API_KEY`; realtime uses existing GA4 creds. Deltas/splits respect existing filters → existing per-filter cache keys segment them.
- **Type consistency:** `MetricDelta`/`SplitRow`/`PositionBucket`/`ScatterPoint`/`CwvMetric`/`CruxRecord`/`RealtimePayload` defined once in `overview-types.ts`; `computeDelta`/`bucketPositions`/`buildScatter`/`shapeRealtime` in `advanced-metrics.ts`; `mapCruxRecord` in `crux.ts`.
