# Phase 5 — Advanced Visualizations & Richer Metrics (design)

**Status:** approved 2026-06-24 · **Owners:** Platform / SEO
**Roadmap:** [`ANALYTICS-DASHBOARD-ROADMAP.md`](../../integrations/ANALYTICS-DASHBOARD-ROADMAP.md) Phase 5
**Builds on:** Phase 1–2 — the `/admin/analytics` page, `ga4-overview.ts` / `gsc-overview.ts`, the read-through overview endpoints, and the filter (window/country/collection) + per-filter cache-key pattern.

## Scope (from brainstorm)

Seven features, all on the existing `/admin/analytics` page — Groups A + B. Treemap + funnel deferred to a later phase.

**Group A — page enrichment (free, reuse GA4/GSC):**
1. Period-over-period deltas on every KPI.
2. Channel / source / device splits (GA4).
3. Position-distribution histogram (GSC).
4. CTR-vs-position scatter (GSC).
5. Per-row sparklines on the Top-pages table (GA4).

**Group B — new data sources (free):**
6. Core Web Vitals via the **CrUX API** (new integration; `CRUX_API_KEY`).
7. Realtime active users (GA4 Realtime endpoint).

All free: CrUX has no billing requirement; GA4 Realtime counts against the normal property quota.

## Architecture

Everything rides the established read-through + filter + cache pattern. Pure shaping/derivation functions are unit-tested; fetch orchestration is integration glue.

### Group A — extend the existing overview reports

**GA4 (`ga4-overview.ts`)** — add to the existing `batchRunReports` batch:
- A **prior-period** totals report (date range shifted back one window) → enables deltas. `shapeGa4Overview` computes `delta = (recent − prior) / prior` per metric, returned as `totalsPrev` + `deltas`.
- Three **dimension** reports: `sessionDefaultChannelGroup`, `deviceCategory`, `sessionSource` (top 6 each, by sessions) → `channels[]`, `devices[]`, `sources[]`.
- A **pagePath × date** report for the top pages → `pageDaily: Record<path, Array<{date, sessions}>>` for sparklines (joined into `topPages` rows).

**GSC (`gsc-overview.ts`)** — add:
- A prior-period totals query → GSC KPI deltas.
- A **query-distribution** query (`dimensions:['query']`, ~1000 rows) → from it derive `positionBuckets` (1–3 / 4–10 / 11–20 / 21+ counts) and `scatter` points (`{position, ctr, impressions}`, capped ~200 for render).

Deltas/splits respect the existing filters, so the per-filter cache keys already segment them — no cache-key change.

### Pure derivations (TDD) — `lib/dashboards/advanced-metrics.ts`

- `computeDeltas(recent, prior)` → per-metric `{ value, deltaPct | null }` (null when prior is 0).
- `bucketPositions(rows)` → `[{label:'1–3', count}, …]`.
- `buildScatter(rows, cap)` → sampled `{position, ctr, impressions}[]`.
- `mapCrux(record)` → `{ lcp, inp, cls }` each `{ p75, rating: 'good'|'needs-improvement'|'poor' }` from CrUX percentiles + standard thresholds (LCP 2500/4000 ms, INP 200/500 ms, CLS 0.1/0.25).
- `shapeRealtime(report)` → `{ activeUsers, byPage: Array<{path, users}> }`.

### Group B — new fetchers

**CrUX (`lib/integrations/kinds/crux.ts`)** — POST `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CRUX_API_KEY}` with `{ origin | url, formFactor:'PHONE'|'DESKTOP' }`. Fetch origin-level (both form factors) + the top ~5 pages (bounded). Key resolved from `process.env.CRUX_API_KEY` via `credentials.ts` (mirrors the env-keyed providers). Daily cron-cached (reuse `cloudflareWebAnalytics`-style cadence) under a `crux:*` key. **Gated:** no key → endpoint returns `cruxConfigured:false`, UI shows a "needs setup" empty state.

**Realtime (`lib/integrations/kinds/ga4-realtime.ts`)** — GA4 `runRealtimeReport` (metric `activeUsers`, dimension `unifiedScreenName`/`pagePath`). Reuses `buildClient` + `resolveGa4Credentials`. **Not** cron-cached — a dedicated read-through endpoint `/api/dashboards/ga4-realtime` with a 60s cache TTL; the client polls every 60s.

### Endpoints

- Extend `ga4OverviewEndpoint` / `gscOverviewEndpoint` responses with the new fields (deltas, splits, sparkline series, buckets, scatter) — no new endpoint, same auth, same cache.
- Add `cruxEndpoint` (`/api/dashboards/crux`, read-through daily) and `ga4RealtimeEndpoint` (`/api/dashboards/ga4-realtime`, 60s). Register **before** the `/dashboards/:provider` param route (the Phase-1 collision lesson).

### UI — `admin/components/Analytics/`

- `KpiCards` gains an optional `deltaPct` per item → renders a green/red `▲8% / ▼3%` chip.
- New `Split.tsx` (label + bar, reuses `CountryBars` styling) ×3 (channels/devices/sources) in a responsive grid.
- New `PositionHistogram.tsx` (SVG bars) + `CtrScatter.tsx` (SVG scatter, x=position, y=ctr, dot size=impressions).
- `TopList` gains an optional per-row `sparkline` (tiny inline SVG).
- New `WebVitals.tsx` (three rating tiles, gated empty state) + `RealtimeWidget.tsx` (client-polled "Live now" count + top live pages).
- `AnalyticsClient.tsx` wires the new sections; the realtime widget mounts at the top with its own poll loop.
- Styles extend `_analytics.scss`.

## Testing

- `advanced-metrics.test.ts`: delta math (incl. prior=0 → null), position bucketing edges, scatter cap/sampling, CrUX rating thresholds (good/NI/poor boundaries), realtime shaping.
- Extend `ga4-overview.test.ts` for the prior-period + splits shaping.
- No schema/migration; no `generate:types` change.

## Provisioning (operator)

- `CRUX_API_KEY` — Google Cloud API key with **Chrome UX Report API** enabled (free). Set in CMS env (local `.env` + droplet). Until set, the Web Vitals section is gated.
- GA4 Realtime + the new GA4 reports use the existing `GOOGLE_APPLICATION_CREDENTIALS_JSON` (already provisioned).

## Phasing (for the plan)

1. **Group A backend** — extend GA4/GSC overview fetch + shaping + `advanced-metrics` derivations (TDD) + endpoint fields.
2. **Group A UI** — KPI deltas, splits, histogram, scatter, sparklines.
3. **CrUX** — fetcher + cron + endpoint + gated Web Vitals UI.
4. **Realtime** — fetcher + 60s endpoint + polled widget.

## Out of scope / follow-ups

- Traffic treemap by collection + funnel (impressions→clicks→sessions→key events) → next phase. The funnel's key-events leg is gated like attribution.
- Per-page CrUX beyond the top ~5 (quota-bounded) — expand later if needed.
