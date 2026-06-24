# Phase 4 — SEO Opportunity Engine (design)

**Status:** approved 2026-06-24 · **Owners:** Platform / SEO
**Roadmap:** [`ANALYTICS-DASHBOARD-ROADMAP.md`](../../integrations/ANALYTICS-DASHBOARD-ROADMAP.md) Phase 4
**Builds on:** Phase 2 (GSC live) + Phase 3 content-insights snapshot (`content:snapshot`, daily 06:30 cron, read-through endpoint, `/admin/content-insights` page).

## Goal

Turn GSC's raw search data into an actionable to-do list, surfaced as three new sections on the existing **`/admin/content-insights`** page. GSC has the data but no workflow; these sections rank the quick wins.

## Scope (from brainstorm)

Three high-confidence, first-party-only features:
1. **Striking-distance queries** — queries ranking position 5–15 with high impressions → small push for big gains.
2. **Low-CTR-for-position** — pages/queries below the expected CTR curve for their rank → rewrite title/meta.
3. **Keyword cannibalization** — one query where ≥2 of our pages compete → merge/differentiate.

**Deferred:** content-gap finder → Phase 7 (needs DataForSEO search-volume to be reliable).

## Key decisions

- **UI home:** extend the existing `/admin/content-insights` page (no new route/nav). Three new sections appended below the content sections, under an "SEO opportunities" subheading.
- **Data:** extend the existing `content:snapshot` blob, cron, and read-through endpoint to also carry bounded query-level GSC data — one fetch cycle, one cache key, one staleness check. No parallel snapshot, no migration.

## Architecture

### Snapshot extension

`ContentSnapshot` (in `lib/content-insights/types.ts`) gains two arrays:

```ts
export interface SnapshotQueryRow {
  query: string; clicks: number; impressions: number; ctr: number; position: number;
}
export interface SnapshotQueryPageRow {
  query: string; page: string; clicks: number; impressions: number; position: number;
}
// ContentSnapshot adds:
queries: SnapshotQueryRow[];
queryPages: SnapshotQueryPageRow[];
```

`fetch-snapshot.ts` adds two GSC calls to its existing `Promise.all` (90-day window, same `gscClient`):
- `dimensions: ['query']`, `rowLimit: 1000` → `queries`.
- `dimensions: ['query', 'page']`, `rowLimit: 2000` → `queryPages`.

`buildSnapshot` passes both arrays through onto the snapshot (no per-doc join needed at build time; cannibalization joins page→doc at derive time). When GSC is unconfigured both arrays are `[]`.

### Derivations — `lib/content-insights/seo-sections.ts` (pure, TDD)

Constants (centralized, tunable): `STRIKING_MIN_POS = 5`, `STRIKING_MAX_POS = 15`, `STRIKING_MIN_IMPRESSIONS = 50`, `LOWCTR_MIN_IMPRESSIONS = 100`, `LOWCTR_FACTOR = 0.5` (flag when actual < expected×0.5), `TOP_N = 25`.

`EXPECTED_CTR_BY_POSITION` — a constant lookup (positions 1–10, with a small tail for 11+), an industry-approximation curve; documented as approximate.

- `deriveStrikingDistance(snap)` → queries with `STRIKING_MIN_POS ≤ position ≤ STRIKING_MAX_POS` and `impressions ≥ STRIKING_MIN_IMPRESSIONS`, sorted by impressions desc, top N. Rows: `{ query, position, impressions, clicks, ctr }`.
- `deriveLowCtr(snap)` → for each query with `impressions ≥ LOWCTR_MIN_IMPRESSIONS`, look up `expected = expectedCtr(position)`; flag when `ctr < expected × LOWCTR_FACTOR`. `missedClicks = round(impressions × (expected − ctr))`. Sorted by `missedClicks` desc, top N. Rows: `{ query, position, ctr, expectedCtr, missedClicks }`.
- `deriveCannibalization(snap)` → group `queryPages` by query; for each query, map pages→docs via `pathToDocKey` + a `docByPath` lookup built from `snap.docs`; keep queries where ≥2 distinct *known* docs rank. Rows: `{ query, totalImpressions, pages: Array<{ collection, id, title, url, impressions, position }> }`, sorted by total impressions desc, top N.

`expectedCtr(position)` helper: clamp to the curve (floor the position; positions >10 use the tail value; <1 uses pos-1).

### Endpoint

`endpoints/content-insights.ts` `sectionsOf()` gains three keys: `strikingDistance`, `lowCtr`, `cannibalization`. `ContentInsightsResponse.sections` type extended to match. No new endpoint, no auth change.

### UI — three components under `admin/components/ContentInsights/`

- `StrikingDistance.tsx`, `LowCtr.tsx`, `Cannibalization.tsx` — reuse the `cs-content-insights__table` styles (new column-grid modifiers in `_content-insights.scss`). Cannibalization rows link each competing page to its editor; the other two are query-level read-only rows.
- `ContentInsightsClient.tsx` renders an `<h2>SEO opportunities</h2>` divider then the three components after the content sections.

## Testing

- `seo-sections.test.ts`: striking-distance window + sort + impression floor; low-CTR curve comparison, threshold edge (just-below vs just-above `expected×FACTOR`), missedClicks math; cannibalization ≥2-doc grouping, single-page query excluded, unknown-page skipped.
- Extend `build-snapshot.test.ts`: the two new query arrays pass through onto the snapshot.
- No schema/migration; no `generate:types` change.

## Phasing (for the plan)

1. **Snapshot + derivations** — extend types, `fetch-snapshot`, `build-snapshot` (test), `seo-sections` (TDD), endpoint wiring.
2. **UI** — three section components + client divider + styles.

## Out of scope / follow-ups

- Content-gap finder → Phase 7 (DataForSEO).
- The expected-CTR curve is an industry approximation; a future enhancement could derive a site-specific curve from our own GSC position×CTR data.
