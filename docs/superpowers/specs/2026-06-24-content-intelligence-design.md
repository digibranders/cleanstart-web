# Phase 3 — Content Intelligence (design)

**Status:** approved 2026-06-24 · **Owners:** Platform / SEO
**Roadmap:** [`ANALYTICS-DASHBOARD-ROADMAP.md`](../../integrations/ANALYTICS-DASHBOARD-ROADMAP.md) Phase 3
**Builds on:** Phase 1–2 plumbing (`analyticsCache`, read-through dashboard endpoints, custom admin views, `ga4-overview.ts` / `gsc-overview.ts`).

## Goal

A dedicated `/admin/content-insights` admin page that **joins analytics to content metadata** — the one thing GA4/GSC structurally cannot do, because authors, categories, publish/update dates, collections, and lead data live only in Postgres. Six sections, all fed by one shared per-document snapshot:

1. **Content decay + refresh queue** — published pages whose traffic/clicks fell over a recent window vs the prior window, ranked by loss; each row shows last-updated date + "open in editor". (★★★)
2. **Author & category leaderboards** — sessions/clicks/conversions rolled up by author or category relationship. (★★★)
3. **Conversion attribution to content** — which articles drive key events. *Gated:* renders a "needs key events" empty state until GA4 key events are configured. (★★★)
4. **Orphan / zero-traffic audit** — published docs with ~0 sessions and ~0 impressions over 90d → prune-or-promote. (★★)
5. **Indexation coverage rollup** — % of each collection's published docs that appear to be indexed (proxy: GSC impressions > 0 in 90d), with the not-indexed listed. Exact URL-inspection confirmation stays an on-demand per-row action (reuses the existing inspect endpoint), never a daily full-catalog crawl. (★★)
6. **New-content velocity** — performance of last-30/90-day posts vs the back catalog. (★)

## Key decisions (from brainstorm)

- **Scope:** all six features in one spec, unified by a shared snapshot.
- **UI home:** a new `/admin/content-insights` route + nav entry (below Analytics). `/admin/analytics` stays the raw-traffic view; this is the content-joined view.
- **Worklists are read-only insight** — no per-row stateful workflow (no mark-reviewed/snooze/dismiss, no queue collection). A page that gets refreshed simply drops off the list at the next snapshot. (YAGNI.)
- **Compute/storage = master snapshot blob in `analyticsCache`** (no new collection, no migration). One daily cron builds it; sections derive from it in-memory; client filters operate on the returned lists.

## Architecture

### The snapshot backbone

A daily cron computes **one per-document snapshot** and writes it to `analyticsCache` (`scope: 'global'`, key `content:snapshot`). Each record:

```ts
interface ContentDocRecord {
  collection: string;          // 'blogs' | 'guides' | ...
  id: string;
  slug: string;
  title: string;
  url: string;                 // public path, e.g. /blogs/sbom-101
  authorIds: string[];         // Payload relationship ids (label resolved at build)
  authorLabels: string[];
  categoryLabels: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  // GA4 (two windows for decay): recent = last 28d, prior = the 28d before that
  sessionsRecent: number;
  sessionsPrior: number;
  usersRecent: number;
  conversionsRecent: number;   // 0 until key events wired
  // GSC (recent 90d)
  clicks: number;
  impressions: number;
  position: number;
  indexedProxy: boolean;       // impressions > 0 over 90d
}
interface ContentSnapshot {
  capturedAt: string;
  windows: { recentDays: number; priorDays: number; gscDays: number };
  docs: ContentDocRecord[];
}
```

**Bounded daily fetch** (no per-doc API calls): GA4 per-`pagePath` sessions/users/conversions for the recent window **and** the prior window (one `batchRunReports`); GSC per-`page` clicks/impressions/position over 90d (one `searchanalytics.query`); CMS metadata via Payload `find` over the published content collections (Postgres, cheap). The page→document join maps each GA4/GSC row's path to a doc.

### Page ↔ document join

`lib/content-insights/page-path.ts` (pure, unit-tested):
- `docPath(collection, slug)` → public URL path, reusing/extending `COLLECTION_PATH_PREFIX` from `overview-filters.ts`.
- `pathToDocKey(pagePath)` → `{ collection, slug } | null` by longest-prefix match, after normalizing trailing slash / query string / hash. Unknown prefixes (e.g. `/about`, `/`) return `null` and are ignored.

### Derivations (pure, unit-tested)

`lib/content-insights/sections.ts` — each takes the snapshot (+ optional filter) and returns a view payload:
- `deriveDecay` — docs with `sessionsPrior > MIN` and `(sessionsRecent − sessionsPrior)/sessionsPrior <= −DECAY_THRESHOLD`, sorted by absolute session loss; also surfaces "high-traffic + stale" (sessionsRecent high AND updatedAt older than N months).
- `deriveLeaderboards` — group by `authorLabels` / `categoryLabels`, sum sessions/clicks/conversions, sort desc.
- `deriveOrphans` — published, `sessionsRecent ≈ 0 && impressions ≈ 0`.
- `deriveIndexation` — per collection: `indexedProxy` count / published count; list the not-indexed.
- `deriveVelocity` — bucket by `publishedAt` (≤30d, ≤90d, older); compare avg sessions per doc.
- `deriveAttribution` — sort by `conversionsRecent`; if every doc is 0, the endpoint flags `keyEventsConfigured: false` and the section renders the gated empty state.

### Fetch + cron + endpoint

- `lib/content-insights/fetch-snapshot.ts` — orchestrates the GA4 + GSC + CMS fetch and calls the pure `buildSnapshot(...)` shaper.
- `jobs/refresh-content-insights.ts` — daily 05:30 UTC, gated by `PAYLOAD_AUTO_RUN`; writes `content:snapshot`. Added to the CLAUDE.md jobs table. The `analyticsCache` daily-prune cron already covers the row.
- `endpoints/content-insights.ts` — `GET /api/content-insights` (admin/editor auth). Reads `content:snapshot`; on miss/stale, computes once (read-through) and caches. Returns all six derived section payloads + `keyEventsConfigured`. Client-side filters (collection, leaderboard metric) operate on the returned lists, so no per-filter cache keys.

### Frontend

- `admin/components/ContentInsights/ContentInsightsView.tsx` — server shell wrapping the client in `DefaultTemplate` (same pattern as `AnalyticsView.tsx`).
- `ContentInsightsClient.tsx` — fetches `/api/content-insights`, renders the six section components, handles loading/unconfigured/error.
- Section components: `DecayQueue.tsx`, `Leaderboards.tsx`, `OrphanAudit.tsx`, `IndexationRollup.tsx`, `VelocityPanel.tsx`, `AttributionPanel.tsx`. Reuse existing primitives (`TopList`, `KpiCards`, country-style bars, `Dropdown`). Every row links to `/admin/collections/<collection>/<id>` ("open in editor").
- `SidebarHeader.tsx` — add a "Content insights" nav link below "Analytics", same styling/active-state treatment.
- Styles: new `_content-insights.scss`, imported from `custom.scss`; reuses the `--theme-*` / `--cs-*` tokens.

## Constants (tunable, centralized in `sections.ts`)

`DECAY_THRESHOLD = 0.30` (≥30% session drop) · `DECAY_MIN_PRIOR = 20` (ignore noise) · `STALE_MONTHS = 6` · `ORPHAN_MAX = 2` sessions/impressions · `VELOCITY_BUCKETS = [30, 90]` days.

## Testing

- Pure units (Vitest, co-located): `page-path.test.ts` (path↔doc round-trips, prefix collisions, normalization), `build-snapshot.test.ts` (GA4/GSC rows + CMS docs → records, missing-data defaults), `sections.test.ts` (each derivation incl. the decay threshold edges and the attribution all-zero → gated case).
- No schema migration (reuses `analyticsCache`), so no `generate:types` change expected.

## Phasing (for the implementation plan)

1. **Backbone** — types, `page-path` (TDD), `build-snapshot` (TDD), `sections` (TDD), fetch orchestration, cron, read-through endpoint.
2. **Page + decay queue** — route, nav link, client shell, `DecayQueue` section (first visible value).
3. **Remaining catalog sections** — leaderboards, orphans, indexation, velocity.
4. **Conversion attribution** — gated empty state now; derivation ready for when GA4 key events land.

## Out of scope / follow-ups

- GA4 **key events** configuration (unblocks attribution) — separate ops task; section ships gated.
- Exact per-doc URL-inspection indexation confirmation beyond the impressions proxy — on-demand only (reuses existing inspect endpoint), not part of the daily snapshot.
- Stateful refresh-queue workflow (snooze/dismiss) — explicitly deferred.
