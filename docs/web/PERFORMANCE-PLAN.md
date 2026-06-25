# CMS + Content Performance Plan

**Owner:** web/platform · **Status:** Phases 1–2 shipped on `development`; Phase 3–5 partly handed off
**Last updated:** 2026-06-18

> Goal: content pages (blog / guide / news / resource / knowledge-hub) load like
> the old Webflow site did — instant, CDN-served — which is the reason for the
> Next + Payload migration. This doc tracks the work to get there.

---

## 1. Diagnosis (measured on staging, 2026-06-18)

Clicking a content post from a listing showed the **listing page frozen for
3–6 s** before the detail appeared. Root cause was **architecture, not infra**:

| Signal | Measurement |
|---|---|
| Blog detail full server render (staging) | **5.4–6.2 s** total (TTFB ~0.3 s) |
| One blog query at `depth=2`/`depth=3` | **1.8 s / 542 KB** for a single post |
| Listing page (`/blogs`) | 1.4 s (fine) |

Two stacked problems:

- **A — nothing masked the wait.** Only one `loading.tsx` (root); content detail
  routes had none, and each page is one monolithic `await` with no `<Suspense>`.
  The router held the old page until the full render finished.
- **B — the render was slow.** Content routes rendered **dynamically on every
  request** (no `generateStaticParams` except `knowledge-hub`/`legal`), each click
  firing **7–13 CMS round-trips** (Header's 5-way fan-out + blog + related ×3 +
  journey ×4) plus Shiki init, much of it at `depth=2`/`depth=3`.

The on-demand-revalidation machinery (`/api/revalidate` + the CMS `revalidateWeb`
helper) already existed but **was never wired to any collection** — dead code.

---

## 2. Shipped (Phases 1–2)

### Phase 1 — perceived speed
- **`loading.tsx` skeletons** on every content detail route
  (`blogs|guide|news|resources|author|event|job/[slug]`), backed by a shared
  `ContentDetailSkeleton`. Navigation now paints an instant content-shaped
  placeholder instead of holding the previous page.
- **Query `depth` trimmed** across **all four** content libs (`blog`, `guides`,
  `news`, `resources`) — primary `loadXBySlug` `depth=3 → 1`, related fills
  `depth=2 → 1`, journey `depth=2 → 1`, and the featured/listing single-item
  queries `depth=2 → 1`. The build against the prod CMS proved why this was
  load-bearing, not cosmetic: **guides at `depth=3` returned 8–13 MB per doc**,
  which (a) exceeded Next's 2 MB Data-Cache ceiling so the response was **never
  cached** (every ISR regen re-fetched 13 MB), and (b) **timed out the 60 s
  per-page build limit**. depth=1 hydrates every field these pages render
  (`heroImage.url`, `categories.name`, prev/next `slug`+`title`); nested upload
  URLs aren't resolved past depth=1 anyway (R2 adapter limit), so depth=2/3 was
  pure bloat. Authors (2-levels deep) are re-fetched separately, unchanged.

### Phase 2 — static-first + on-demand revalidation (the core fix)
- **`generateStaticParams` + `dynamicParams = true`** on
  `blogs|guide|news|resources/[slug]` (mirrors the working `knowledge-hub`
  pattern), with new `getXSlugs()` fetchers (`depth=0&select[slug]`). Pages are
  now pre-rendered/cached + ISR(60 s); a build-time CMS outage degrades to
  on-demand (try/catch → `[]`) instead of failing the build.
- **On-demand revalidation wired** — new `revalidateWebPublishAfterChangeHook`
  + `revalidateWebAfterDeleteHook` registered on `blogs/guides/news/resources/
  knowledgeBase`. On publish / edit-while-published / unpublish / delete, the CMS
  POSTs `revalidatePath` for the doc + its listing → **publish-to-live in
  seconds**, not 60 s. Fires only when a *live* URL is affected; fail-soft.

### Build-resilience fixes (surfaced by building 463 pages against prod CMS)
- **`fetchCMS` now retries transient 5xx** (502/503/504) with backoff, not only
  network throws. Prebuilding all content hammers the single CMS droplet; one
  transient gateway blip previously failed the whole static build. Also makes
  runtime ISR regeneration self-heal. 4xx/500 still surface immediately.
- **`select[...]` projection on guides related/journey queries** — even at
  depth=1 the Lexical `body` is returned (it's a scalar), and 6 guide bodies
  exceeded Next's 2 MB cache ceiling. Cards/journey now fetch only the fields
  they render (`title/slug/heroImage/abstract/readingMinutes`, and `slug/title`
  for journey), so those queries are cacheable again.

**Verification:** `apps/web` lint ✓ typecheck ✓ · `apps/cms` lint ✓ typecheck ✓ ·
`next build` against prod CMS prerenders all 463 routes (blogs/guides/news/
resources now static) with **0 cache rejections, 0 build timeouts**.

### ⚠ Required env to activate revalidation (ops)
`revalidateWeb` no-ops until these are set (it logs once and degrades to ISR):
- CMS side (`/opt/cleanstart/.env`): `WEB_REVALIDATE_URL=https://www.cleanstart.com/api/revalidate`, `WEB_REVALIDATE_SECRET=<shared>`
- Web side (Vercel env): `WEB_REVALIDATE_SECRET=<same shared value>`

---

## 2b. Resilience guarantee — published content survives CMS death

**Requirement:** once a page is published and cached, it must keep serving
(200, fully rendered, indexable) even if the CMS server is down.

How the architecture delivers it:

1. **Every published page is pre-rendered at build** (`generateStaticParams` on
   all content detail routes). So from the moment a deploy goes live, each
   published URL has a complete static HTML/RSC artifact on the web host — its
   first byte never depends on the CMS being up.
2. **Stale-while-revalidate + stale-on-error (ISR).** Serving a cached page does
   not call the CMS. After the revalidate window, the *next* request serves the
   cached copy immediately and kicks a background refresh; if that refresh fails
   (CMS down), Next.js **keeps serving the last good copy** and retries later —
   it never evicts the page or serves an error. `expireTime` is pinned to 1 year
   so a stale page is served for the entire outage, never force-regenerated.
3. **Transient errors can't poison the cache.** `fetchCMS` throws (not returns
   `null`) on 5xx/network failure, so a failed refresh preserves the stale page
   instead of tripping `notFound()` → a 404 that would de-index the URL. Only a
   genuine `200`-with-empty-result (the doc was really deleted/unpublished)
   yields a 404 — and deletes/unpublishes go through the on-demand revalidate
   hook, not an outage.
4. **5xx retry with backoff** (`fetchCMS`, 5 attempts) absorbs the brief blips a
   single CMS droplet throws under load, at both build and runtime.

**The one dependency that remains:** a page must be in the cache *before* the CMS
dies. Achieved by pre-rendering all published slugs at build. The residual gap is
a doc published *after* the last deploy and never yet visited when the CMS dies —
mitigated by the on-demand revalidate hook (warms it on publish) and closed
entirely once the CMS sits behind the Cloudflare cache (Phase 4). **Indexing
stays intact** because every previously-published URL keeps returning 200.

### Verified (production build, CMS process killed mid-test)

Built against the real CMS, served via `next start`, then the CMS was made
genuinely unreachable (connection refused) and the same URLs re-requested:

| Request | CMS state | Result |
|---|---|---|
| SSG blog detail (prebuilt) | **dead** | **200 · 5 ms · full 274 KB article** ✓ |
| 2nd SSG blog detail (prebuilt) | dead | 200 · 21 ms ✓ |
| `/blogs` listing (dynamic) | dead | 200 · 12.7 s (stale-served from data cache after retries) |
| never-built slug | dead | 500 · 19 s — the boundary prebuilding closes |

Prebuilt content served **instantly with full content while the CMS was down**.
The never-built slug is the only failure mode, and `generateStaticParams`
(prebuild every published slug) is exactly what removes it.

### Follow-up surfaced by the test — RESOLVED (Phase 3, see §3)
The **listing** routes (`/blogs`, `/guide`, `/news`, `/resources`, plus
`/events`, `/webinars`, `/case-studies`, `/careers`, `/resource-center`) were
still dynamic (`ƒ`) — under a sustained outage they stale-served (if warmed) or
hung on the 5-retry backoff (~12–19 s) before erroring, and in normal operation
re-ran a blocking whole-collection (`limit: 1000`) fetch on **every** request,
showing the root spinner each time. **Root cause:** each route's
`generateMetadata` read `searchParams` (to build the `?page=N` canonical), which
opts the whole route into dynamic rendering — `export const revalidate` can't
override an explicit dynamic-API access. Fixed in Phase 3 (below): the listing
metadata is now static, so the routes are ISR/SSG and equally outage-proof.

**Build hardening this required:** pre-rendering *all* content makes the build
itself depend on the CMS surviving a burst of hundreds of reads. Capped via
`staticGenerationMaxConcurrency: 4` + `staticGenerationRetryCount: 3` (Next
config) so the single droplet isn't overwhelmed and a blipped page retries
instead of failing the deploy.

---

## 3. Remaining

### Phase 3 — static listings + skeleton loaders (SHIPPED)
- **Listings made static/ISR.** `buildListingMetadata` (`lib/seo/canonical.ts`)
  no longer takes `page`/reads `searchParams` — canonical is always the clean
  `basePath`, always indexed (correct, since pagination is client-side: every
  `?page=N` returns the same static page-1 HTML and JS swaps the grid). Each of
  the 8 listing `page.tsx` files (`blogs/news/events/webinars/case-studies/
  careers/guide/resource-center`) now exports a **synchronous, no-arg**
  `generateMetadata`. This removes the only dynamic-render trigger, so the
  routes are ISR/SSG (`revalidate = 3600` now effective) and served from the
  edge — no per-request whole-collection fetch, no root spinner on every load.
- **Two remaining heavy list queries projected.** `getWebinars` and
  `getCaseStudies` went `depth=2 → depth=1` + `select[...]` card-field
  whitelist (matching blogs/news/guides/resources), so their `limit: 1000`
  listing responses stay under Next's 2 MB Data-Cache ceiling and cache.
- **Skeleton loaders replace the spinner.** New light-themed listing skeletons
  (`components/sections/_shared/ListingSkeleton.tsx`: per-page dark-hero
  placeholders with search/pills/featured-post/marquee + filter rows +
  card-shaped grid skeletons matching each card's exact dimensions) wired via a
  per-route `loading.tsx` on all 9 listings (incl. podcast). Pure CSS
  `animate-pulse`, `aria-live`, shift-free. (Client-side filter/pagination needs
  no transition skeleton — the Browser components filter the in-memory set
  synchronously, so it's already instant.)

### Phase 3 (original) — deferred (lower value now that pages are static)
- **`<Suspense>`-stream** related/journey so hero+body paint first. Deferred:
  static generation already moves Shiki + the fan-out off the user request path
  (they run at build / background ISR), so this only helps the rare cold render.
  Revisit if cold-render TTFB is still an issue after Phases 1–2 land on staging.
- **Pre-highlight Shiki at publish** (store highlighted HTML in CMS) — removes
  Shiki from render entirely. Bigger change (CMS field + migration); do only if
  build times or cold renders warrant it.

### Phase 4 — infrastructure (needs platform access — HANDOFF)
- **Cloudflare cache in front of `cms.cleanstart.com` REST** for published `GET
  /api/*` (short TTL + purge-on-publish). Collapses repeat-query latency, shields
  the single droplet.
- **Postgres index audit** — the 1.8 s single-doc query smells like missing
  indexes on `slug` / `_status` / `publishedAt` / `categories` join+sort paths.
- **Image pipeline** — confirm all content images serve from R2/CDN via
  `next/image` with correct `sizes` + AVIF/WebP; pre-generate size variants.
- **CMS read replica / managed Postgres** before traffic scales (SPOF today).

### Phase 5 — guardrails (so it can't regress — HANDOFF + partial)
- **CI perf budget** — fail build if a content route TTFB/LCP exceeds budget.
- **RUM** — Vercel Speed Insights / Web Vitals per route.
- **Lint guard** — forbid `depth=3` and `cache: 'no-store'` on public reads.
- **Cache-hit-ratio alert** — catches an accidental `force-dynamic`.

---

## 4. SLO targets

| Metric | Before | Target |
|---|---|---|
| Content detail TTFB (cached) | 5–6 s to complete | < 200 ms (edge hit) |
| Perceived click→content (warm) | ~5 s frozen | < 400 ms + instant skeleton |
| Editor publish → live | 60 s (ISR) | < 5 s (on-demand revalidate) |
| CMS single-doc query | 1.8 s / 542 KB | < 300 ms / < 80 KB |
| LCP mobile (content) | poor | < 2.5 s |
