# Vercel Usage Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `apps/web` Vercel usage back under the limits by removing the structural causes of the Fluid Active CPU and ISR Writes overages (plus the near-limit image metrics), without breaking CMS Live Preview or content freshness.

**Architecture:** The overload has two roots: (1) the site-wide `<Header>` and `PreviewBanner` call `draftMode()` and fan out ~11 CMS fetches on a 60-second window on every page, turning ~40 cached pages into per-minute-regenerating, per-request-rendered pages; (2) `next/image` runs on full defaults and routes CMS media through Vercel's optimizer. We fix these in risk-ordered phases: config-only quick wins first, then the static-rendering rework, then image/edge/asset polish.

**Tech Stack:** Next.js 16 App Router (PPR), React 19, Vercel Fluid Compute, Payload CMS REST (`cms.cleanstart.com`), Cloudflare R2/`cdn.cleanstart.com`, Vitest, Biome, Turbopack.

---

## Operating constraints (read before any task)

- **Branch:** all work lands on `development` via PRs; promote to `main` (which deploys to the Vercel Production target → `staging.cleanstart.com`) to observe metric impact. **No worktrees, no long-lived feature branches** (CLAUDE.md branching policy). Short-lived `fix/web-*` branches off `development` are acceptable per PR if preferred, but direct commits to `development` are the repo norm.
- **Mandatory checks before reporting any task done** (scope to `apps/web`; `apps/cms` for Phase 3 Task 3.4):
  ```bash
  pnpm --filter @cleanstart/web lint
  pnpm --filter @cleanstart/web typecheck
  pnpm --filter @cleanstart/web build
  pnpm --filter @cleanstart/web test       # when tests touched
  ```
  Report `lint ✓ · typecheck ✓ · build ✓` in the PR.
- **Verification is two-layered:** (a) local `build` output (route render mode: `○`/`●` static vs `ƒ` dynamic) and unit tests prove the change is correct; (b) post-deploy, Vercel **Observability → ISR / Functions / Image Optimization** (12h window) and **Usage** (30-day) confirm the metric actually dropped. A task that changes runtime cost is not "done" until its dashboard number moves.
- **Do not break Live Preview.** The CMS embeds `apps/web` pages via the JWT-based `/preview/[collection]/[slug]` route (`force-dynamic`, `draft:true`). Every change below preserves that route. Cookie-based draft browsing on real routes is addressed explicitly in Phase 2 (Decision D1).
- **Coordinate with the live audit:** `ALLOW_INDEXING=1` is currently set on Vercel for the SEO crawl. The crawl inflates these metrics while it runs; take "before" readings with the crawl idle, and turn it off once the audit is finished so it doesn't mask the improvements.

## Decisions to confirm before Phase 2 / Phase 3

- **D1 (Phase 2):** Cookie-based draft preview on real routes (browse `/blogs/foo` with the draft cookie) will stop surfacing drafts once published fetchers pin `draft:false`. The JWT `/preview/*` iframe route (the one the CMS Live Preview uses) is unaffected. **Recommended:** accept this — the iframe route is the supported preview path. Confirm no editor workflow depends on cookie-browsing drafts.
- **D2 (Phase 3):** CMS image bypass method. **Recommended:** `unoptimized` for `cms./cdn.cleanstart.com` srcs (zero new infra — R2 already serves sized variants via `image.sizes`). Alternative: a Cloudflare Image-Resizing `loader` (keeps server-side resizing but requires enabling CF Image Resizing, a paid CF feature). Start with `unoptimized`.
- **D3 (Phase 1):** Target `revalidate` window. **Recommended:** `3600` (1h). Safe because the CMS publish webhook revalidates changed paths on publish (verified in Task 1.0); the window only governs content changed without a publish event and the nav "latest" feeds. Go higher (`86400`) after Phase 3 tag-based invalidation lands.

## Metric acceptance targets (measure on the 30-day Usage view after each phase soaks ~24–48h)

| Metric | Now | After Phase 1 | After Phase 2 | After Phase 3 |
|---|---|---|---|---|
| ISR Writes | 361K / 200K ❌ | < 50K | < 30K | < 20K |
| Fluid Active CPU | 7h22m / 4h ❌ | ~6h (unchanged) | < 2h | < 1.5h |
| Function Invocations | 266K / 1M | ~same | ↓ (static detail routes) | ↓ |
| Image Transformations | 4.8K / 5K ⚠️ | < 1K (TTL stops re-bill) | — | < 0.5K |
| Fast Origin Transfer | 8.4 / 10 GB ⚠️ | — | — | < 3 GB (CMS bypass) |
| Edge Requests | 552K / 1M | — | — | ↓ (matcher) |

> Note: even after the fixes, **Hobby is not licensed for commercial use** — provision **Pro** for go-live regardless. The fixes determine whether you're paying for overages on Pro, not whether you need Pro.

---

# Phase 1 — Config quick-wins (PR #1)

Lowest risk, highest immediate relief on ISR Writes and Image Transformations. Pure configuration; no behavior change to rendering. Estimated 30–45 min.

### Task 1.0: Verify the CMS→web publish revalidation webhook fires (pre-check, no code)

Raising `revalidate` is only safe if published content is purged on publish. Confirm the path exists before changing the window.

**Files (read-only):**
- Inspect: `apps/web/src/app/api/revalidate/route.ts`
- Inspect: `apps/cms/src/payload/**` (the `afterChange` hook that POSTs to `WEB_REVALIDATE_*`)

- [ ] **Step 1: Confirm the web endpoint accepts path/tag purges**

Run: `sed -n '1,140p' apps/web/src/app/api/revalidate/route.ts`
Expected: Mode-1 (Bearer) accepts `paths[]`/`tags[]` and calls `revalidatePath(path,"layout")`; Mode-2 (body secret) handles the nav allow-list tags.

- [ ] **Step 2: Confirm the CMS calls it on publish**

Run: `grep -rn "revalidate\|WEB_REVALIDATE\|/api/revalidate" apps/cms/src/payload`
Expected: an `afterChange`/publish hook that POSTs the changed collection/slug. **If absent or only firing for some collections, STOP** — raising `revalidate` would cause stale content. Add the hook (becomes a Phase 1 blocker task) or keep `revalidate` at a low value (e.g. `300`) for D3 until the webhook is reliable.

- [ ] **Step 3: Record the decision**

Write the confirmed target window (D3) into this plan's Task 1.1 (`3600` if webhook is reliable, else `300`).

### Task 1.1: Raise the default ISR revalidate window

**Files:**
- Modify: `apps/web/src/lib/cms-fetch.ts:40`
- Test: `apps/web/src/lib/cms-fetch.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/cms-fetch.test.ts
import { describe, expect, it, vi } from "vitest";

// draftMode() must be stubbed because fetchCMS imports it from next/headers.
vi.mock("next/headers", () => ({ draftMode: async () => ({ isEnabled: false }) }));

describe("fetchCMS revalidate window", () => {
  it("uses the long default ISR window on published reads", async () => {
    const calls: Array<RequestInit & { next?: { revalidate?: number } }> = [];
    const fetchSpy = vi.fn(async (_url: string, init: RequestInit) => {
      calls.push(init as RequestInit & { next?: { revalidate?: number } });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCMS } = await import("./cms-fetch");
    await fetchCMS("/api/blogs?limit=1", { draft: false });
    expect(calls[0]?.next?.revalidate).toBe(3600);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/web test -- --run src/lib/cms-fetch.test.ts`
Expected: FAIL — `expected 60 to be 3600`.

- [ ] **Step 3: Make the change**

In `apps/web/src/lib/cms-fetch.ts:40` change:
```ts
const DEFAULT_REVALIDATE_SECONDS = 3600; // was 60 — content freshness on publish comes from the CMS revalidate webhook, not the window
```

- [ ] **Step 4: Run the test + full gate**

Run: `pnpm --filter @cleanstart/web test -- --run src/lib/cms-fetch.test.ts && pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/cms-fetch.ts apps/web/src/lib/cms-fetch.test.ts
git commit -m "perf(web): raise default CMS ISR window 60s->3600s (publish webhook handles freshness)"
```

### Task 1.2: Fix `next/image` config (cache TTL, sizes, quality)

**Files:**
- Modify: `apps/web/next.config.ts:46-81` (the `images` block)

- [ ] **Step 1: Apply the config**

Replace the `images` block in `apps/web/next.config.ts` with (keep the existing `remotePatterns` array verbatim):
```ts
  images: {
    formats: ["image/avif", "image/webp"],
    // Stop re-transforming the same variant every 60s (Next default). 31 days.
    minimumCacheTTL: 2_678_400,
    // Trim from the 8 default deviceSizes / 8 imageSizes to the widths we actually render.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 128, 256],
    qualities: [75],
    remotePatterns: [
      /* ...existing remotePatterns unchanged... */
    ],
  },
```

- [ ] **Step 2: Build to confirm config is valid**

Run: `pnpm --filter @cleanstart/web build`
Expected: build succeeds; no image-config warnings.

- [ ] **Step 3: Verify a sample image still renders at expected widths**

Run a local prod server and check an optimized URL resolves:
```bash
pnpm --filter @cleanstart/web start --port 3012 &
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3012/_next/image?url=%2Fimages%2Fhero%2Forb-cube.svg&w=640&q=75"
```
Expected: `200`. Then kill the server.

- [ ] **Step 4: Commit**

```bash
git add apps/web/next.config.ts
git commit -m "perf(web): set image minimumCacheTTL + trim deviceSizes/qualities"
```

### Task 1.3: Ship Phase 1 and verify on the dashboard

- [ ] **Step 1: PR + promote**

```bash
git push origin development
gh pr create --base main --title "perf(web): Phase 1 Vercel usage quick-wins" --fill
```
Merge after green CI; Vercel rebuilds the Production target.

- [ ] **Step 2: Verify (post-deploy, with the SEO crawl idle)**

- Observability → ISR (12h): `/index.segments/*` writes should drop from ~727 toward ~12/12h.
- Usage (30-day) after ~24–48h: **ISR Writes trend down toward < 50K**; **Image Transformations** stop climbing.
- Spot-check freshness: publish a CMS edit, confirm it appears on `staging.cleanstart.com` within seconds (webhook), not in 1h.

---

# Phase 2 — Static rendering rework (PR #2) — the CPU/Invocations fix

Moderate risk: changes rendering mode of the homepage + detail routes. Resolves Decision **D1**. Converts dynamic SSR back to static/ISR. Preserves the `/preview/*` iframe route.

### Task 2.1: Make Header nav data published-only (stop forcing every page dynamic)

The Header runs on ~40 pages and indirectly calls `draftMode()` via `fetchCMS`; nav never needs draft content.

**Files:**
- Modify: `apps/web/src/components/nav/data/resolve-spotlights.ts` (the `fetchCMS(...)` calls at lines ~44, 78, 120, 129)
- Modify: `apps/web/src/components/nav/data/latest-updates-feed.ts` (the `getBlogs/getNews/getResources/getWebinars` calls — pass through `draft:false`)
- Modify: `apps/web/src/components/nav/data/open-roles.ts` (the `getJobs` call)

- [ ] **Step 1: Pass `draft:false` on every nav fetch**

For each `fetchCMS(path, opts)` call in the three files above, ensure `opts` includes `draft: false`. Where the nav calls shared lib loaders (`getBlogs`, etc.) that don't expose `draft`, add an optional `draft` param to those loaders that defaults to the cookie path but is set to `false` here. Concretely, the nav feed builders must reach `fetchCMS(..., { draft: false })` so `draftMode()` is never invoked.

- [ ] **Step 2: Verify the Header no longer reads the draft cookie**

Run: `grep -rn "draftMode\|fetchCMS" apps/web/src/components/nav`
Expected: no nav path reaches `fetchCMS` without `draft:false` (directly or via a loader param).

- [ ] **Step 3: Gate.** `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`

- [ ] **Step 4: Commit**
```bash
git commit -am "perf(web): nav/header fetches use draft:false so they don't force dynamic render"
```

### Task 2.2: Remove `PreviewBanner` from the global layout

**Files:**
- Modify: `apps/web/src/app/layout.tsx:133` (remove `<PreviewBanner />`)
- Keep: `apps/web/src/components/PreviewBanner.tsx` (still used by the `/preview/*` route shell if desired)

- [ ] **Step 1: Remove the always-on banner**

Delete the `<PreviewBanner />` line from the root layout. If the editor needs a visible "draft" indicator inside the iframe, render `<PreviewBanner />` from `apps/web/src/app/preview/layout.tsx` instead (that subtree is already `force-dynamic`).

- [ ] **Step 2: Confirm the layout no longer calls `draftMode()` transitively**

Run: `grep -rn "draftMode" apps/web/src/app/layout.tsx apps/web/src/components/PreviewBanner.tsx`
Expected: layout no longer renders the banner; `draftMode()` only remains inside components rendered under `/preview/*`.

- [ ] **Step 3: Gate + commit**
```bash
git commit -am "perf(web): render PreviewBanner only in /preview subtree, not the global layout"
```

### Task 2.3: Statically generate the CMS detail routes

Apply the existing `legal/[slug]` pattern (`generateStaticParams` + published loader + `renderXDetail({draft})` for preview) to the remaining detail routes.

**Files (per route — repeat the same shape):**
- `apps/web/src/app/blogs/[slug]/page.tsx`
- `apps/web/src/app/news/[slug]/page.tsx`
- `apps/web/src/app/guide/[slug]/page.tsx`
- `apps/web/src/app/resources/[slug]/page.tsx`
- `apps/web/src/app/event/[slug]/page.tsx` (and `/events/[slug]` if kept — see Task 2.4)
- `apps/web/src/app/job/[slug]/page.tsx` (and `/careers/[slug]` if kept — see Task 2.4)
- `apps/web/src/app/author/[slug]/page.tsx`

- [ ] **Step 1: Add `generateStaticParams` to each route**

Mirror `apps/web/src/app/legal/[slug]/page.tsx:23-26`. Example for blogs:
```ts
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = await getBlogs({ limit: 500, draft: false }).catch(() => []);
  return posts.map((p) => ({ slug: p.slug }));
}
```
Use each route's existing list loader (`getNews`, `getGuides`, `getResources`, `getEvents`, `getJobs`, `getAuthors`).

- [ ] **Step 2: Make the published page loader pass `draft:false`**

In each `page.tsx` default export and its `generateMetadata`, ensure the published `getXBySlug(slug)` call resolves `draft:false` (so `draftMode()` is not invoked on the published render). The `renderXDetail({draft:true})` preview path is unchanged.

- [ ] **Step 3: Decide `dynamicParams`**

Add `export const dynamicParams = true;` (new slugs render on-demand once, then ISR-cache) to each route. (Set `false` only if you want unknown slugs to 404 without a render — discuss per route; default `true`.)

- [ ] **Step 4: Verify render mode flipped to static/ISR**

Run: `pnpm --filter @cleanstart/web build`
Expected: in the build route table, `/blogs/[slug]`, `/news/[slug]`, `/guide/[slug]`, `/resources/[slug]`, `/event/[slug]`, `/job/[slug]`, `/author/[slug]` show `●` (SSG) instead of `ƒ` (Dynamic).

- [ ] **Step 5: Add a regression test for one route's params**

```ts
// apps/web/src/app/blogs/[slug]/generateStaticParams.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/blog", () => ({ getBlogs: async () => [{ slug: "a" }, { slug: "b" }] }));
describe("blogs/[slug] generateStaticParams", () => {
  it("returns one entry per published slug", async () => {
    const { generateStaticParams } = await import("./page");
    expect(await generateStaticParams()).toEqual([{ slug: "a" }, { slug: "b" }]);
  });
});
```
Run it, confirm PASS, then gate + commit.

- [ ] **Step 6: Commit**
```bash
git commit -am "perf(web): prerender CMS detail routes (generateStaticParams + draft:false published path)"
```

### Task 2.4: Collapse duplicate route trees

`/job/[slug]` + `/careers/[slug]` and `/event/[slug]` + `/events/[slug]` each render+cache the same docs twice.

**Files:**
- Inspect: `docs/web/WEB-PAGES.md` (canonical slug for jobs/events)
- Modify: `apps/web/next.config.ts` `redirects()` (add 301s for the non-canonical tree) **or** delete the duplicate route dir

- [ ] **Step 1: Determine canonical** from `docs/web/WEB-PAGES.md`. (Do not rename the canonical route segment — only redirect the duplicate.)

- [ ] **Step 2: Replace the duplicate route with a permanent redirect** in `next.config.ts redirects()`, e.g.:
```ts
{ source: "/careers/:slug", destination: "/job/:slug", permanent: true },
{ source: "/events/:slug", destination: "/event/:slug", permanent: true },
```
(Flip direction to match the canonical chosen in Step 1.) Delete the now-dead `[slug]/page.tsx` of the non-canonical tree.

- [ ] **Step 3: Build + verify** the duplicate route no longer appears in the route table; the redirect resolves. Gate + commit.

### Task 2.5: Ship Phase 2 and verify CPU drop

- [ ] **Step 1:** PR to `main`, merge after green CI.
- [ ] **Step 2: Verify** — Observability → Functions (12h): `/` drops from ~4m active CPU and from `ƒ`-on-every-hit toward static serving. Usage (30-day) after soak: **Fluid Active CPU < 2h**, Function Invocations down.
- [ ] **Step 3: Regression-test Live Preview** — open a draft in the CMS Live Preview; confirm the `/preview/*` iframe still renders draft content.

---

# Phase 3 — Image bypass, assets, edge & tags (PR #3, optionally split)

Polish: relieves the near-limit transfer/transformation metrics and the edge/data-cache load. Resolves Decision **D2**.

### Task 3.1: Bypass Vercel optimizer for CMS images (D2 = `unoptimized`)

**Files (9 components):** `BlogCard.tsx`, `BlogsHero.tsx`, `NewsroomCard.tsx`, `BlogDetailRelatedPosts.tsx`, `CaseStudyCard.tsx`, `ResourceDetailContent.tsx`, `UpcomingEventHero.tsx`, `EventCard.tsx`, `NewsDetailBody.tsx` (paths under `apps/web/src/components/sections/**`).
- Create: `apps/web/src/lib/cms-image.ts` helper `isCmsImage(src)` + test

- [ ] **Step 1: Add a tiny helper + test**
```ts
// apps/web/src/lib/cms-image.ts
export const isCmsImage = (src: string): boolean =>
  src.startsWith("https://cms.cleanstart.com/") || src.startsWith("https://cdn.cleanstart.com/");
```
With a Vitest covering both hosts + a local `/images/...` returning false.

- [ ] **Step 2: Apply `unoptimized` on CMS `<Image>`s**

In each of the 9 components, add `unoptimized={isCmsImage(src)}` to the `<Image>` (matching the existing pattern at `apps/web/src/components/sections/.../CommunitySections.tsx:403`). R2/Cloudflare serves these (sized variants already exist via `image.sizes`), so Vercel no longer transforms or origin-fetches them.

- [ ] **Step 3: Gate + verify** a blog card image now loads directly from `cdn.cleanstart.com` (not `/_next/image`). Commit.

### Task 3.2: Compress / delete oversized static assets

**Files:** `apps/web/public/**`, `apps/web/scripts/audit-images.mjs`, `apps/web/image-audit.json`

- [ ] **Step 1: Regenerate the audit** — `node apps/web/scripts/audit-images.mjs` and review `image-audit.json` (`estAfterMb` ~37 vs 224).
- [ ] **Step 2: Delete the orphan set** (files in the `delete` list, ~138 MB) after spot-checking none are referenced. Remove the committed `*.svg.bak` and `*.tmp` in `public/`.
- [ ] **Step 3: Compress the >1 MB PNGs** (e.g. `teams/hustle-squad-1.png` 11 MB, the four 8.9 MB gradient PNGs → WebP or CSS gradients; `sca/transform-ball-new.svg` 2 MB → real raster or optimized SVG).
- [ ] **Step 4: Build + visual spot-check** the affected pages in Claude Preview at 1440×900. Commit.

### Task 3.3: Narrow middleware + fix the redirect lookup

**Files:** `apps/web/src/proxy.ts:163-165` (matcher), `apps/web/src/lib/redirects-cache.ts`

- [ ] **Step 1: Exclude `/api` from the matcher** so middleware stops running on every API call (its security headers aren't needed on JSON responses). Add `api/` to the negative lookahead.
- [ ] **Step 2: Replace the per-path CMS point-query** (the in-isolate `Map` doesn't survive Edge isolates) with a single cached load of the full (small) redirects list via `unstable_cache` + a long `revalidate` + a `redirects` cache tag the CMS purges on change; match in-memory. **Or** move static redirects into `next.config.ts redirects()`.
- [ ] **Step 3: Test** the redirect-cache module (hit/miss/skip-paths) and gate. Commit.

### Task 3.4: Tag-based revalidation (cross-repo: apps/web + apps/cms)

Lets Phase 1's long `revalidate` window update instantly on publish, eliminating time-based churn for nav/listing data.

**Files:** `apps/web/src/lib/cms-fetch.ts` (add `tags` support), nav fetchers (attach tags the webhook already pops), `apps/cms/src/payload/**` publish hook (call `revalidateTag` per changed doc/collection)

- [ ] **Step 1:** Add `tags?: string[]` to `CmsFetchOptions`; set `init.next = { revalidate, tags }`.
- [ ] **Step 2:** Tag the nav fetches with the tags `apps/web/src/app/api/revalidate/route.ts:29-35` already recognizes (`resources-latest-updates`, `resources-spotlight`, `company-spotlight`, `careers-open-count`, `community-images`), and add per-collection/per-slug tags (`blog`, `blog:<slug>`, …) to the detail/list loaders.
- [ ] **Step 3 (apps/cms):** Update the publish `afterChange` hook to POST narrow `tags` (`<collection>:<slug>`) instead of broad `revalidatePath(path,"layout")`. Run the **apps/cms** gate (`lint`/`typecheck`/`build`/`test`).
- [ ] **Step 4:** With tags live, optionally raise `DEFAULT_REVALIDATE_SECONDS` to `86400` (D3 follow-up). Commit per app.

### Task 3.5: Finish CSP burn-in / trim report volume

**Files:** `apps/web/src/proxy.ts:21-22` (CSP mode), `apps/web/src/app/api/csp-report/route.ts`

- [ ] **Step 1:** Review collected CSP reports; once clean, set `CSP_ENFORCE=1` (flips report-only → enforce, drastically cutting report volume). If staying report-only longer, sample/dedupe in the handler (accept 1-in-N; key by `blockedURL+effectiveDirective`) and return `204` without per-report logging.
- [ ] **Step 2:** Commit.

### Task 3.6: Trim fonts

**Files:** `apps/web/src/app/layout.tsx:20-46`

- [ ] **Step 1:** Drop Manrope weight `800` (banned by CLAUDE.md typography rules, almost certainly unused); trim JetBrains Mono to `["400","600"]`.
- [ ] **Step 2:** `grep -rn "font-\[?800\]\?\|fontWeight: ?800" apps/web/src` to confirm 800 is unused before removing. Build + commit.

### Task 3.7: Ship Phase 3 and final verification

- [ ] PR(s) to `main`; verify Image Transformations < 0.5K, Fast Origin Transfer < 3 GB, Edge Requests down on the 30-day Usage view after soak.
- [ ] **Turn off the audit:** once SEO testing is complete, remove `ALLOW_INDEXING` from Vercel and redeploy (staging reverts to noindex), so the metrics reflect steady state.

---

## Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Raising `revalidate` makes content stale | 1 | Task 1.0 verifies the publish webhook purges paths; D3 falls back to `300` if the webhook is unreliable. |
| Cookie-based draft browsing stops showing drafts | 2 | D1: the `/preview/*` iframe (CMS Live Preview) is unaffected; confirm no editor depends on cookie-browsing. |
| `generateStaticParams` lengthens builds / build-time CMS load | 2 | Bounded by published-slug counts (~360 docs total); `dynamicParams=true` lets new slugs render on-demand. |
| `unoptimized` CMS images lose responsive resizing | 3 | R2 already serves sized variants via `image.sizes`; keep `width/height/sizes` props; CF loader is the fallback (D2). |
| Deleting `public/` orphans removes a referenced asset | 3 | Spot-check against `image-audit.json` orphan list; build + visual QA before merge. |
| Narrowing the middleware matcher drops a needed header on an API route | 3 | Audit which API routes rely on CSP/security headers; only exclude `/api` after confirming none do. |
| Cross-repo tag change desyncs web/cms | 3 | Land apps/web tag-read support first (no-op without emitters), then apps/cms emitters; both behind the same PR cycle. |

## Rollback

Each phase is an independent PR/commit on `main`. Roll back by reverting the merge commit and re-promoting (Vercel "Promote to Production" on the previous Ready deployment gives instant rollback). Phase 1 and the image config are config-only and safe to revert in isolation.
