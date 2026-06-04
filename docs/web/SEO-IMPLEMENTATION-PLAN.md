# CleanStart Website — SEO Implementation Plan

**Companion to:** [`SEO-AUDIT-REPORT.md`](SEO-AUDIT-REPORT.md)
**Date:** 2026-05-29
**Owner branch:** `development` (sitemap/redirects/config are shared infra — not `farheen`-scoped)
**Goal:** Close the SEO gaps found in the audit and migrate the live Webflow site to the new Next.js site without losing organic ranking equity.

> **Governing principle:** This is a same-domain revamp. The dominant risk is broken URLs, not on-page copy. Sequence the work so that **nothing goes to production until the redirect map and sitemap are complete.**

---

## Context

`apps/web` is a ground-up Next.js 16 rebuild of `cleanstart.com` (currently Webflow). The new site has excellent on-page SEO infrastructure but is missing the migration layer: ~250 indexed old URLs change path, only `/blog→/blogs` is redirected, the sitemap covers <30% of routes, and the default OG image file is absent. There is also a **CMS-side gap**: the CMS ships a full SEO field group + an 11-component SEO sidebar that `apps/web` consumes none of, so per-page editor SEO settings never reach the rendered HTML (audit §3.2). Redirects are managed in the **CMS `redirects` collection** (resolved by `proxy.ts`), not `next.config.ts`. This plan fixes all of the above in priority order with concrete files, tasks, and acceptance criteria.

---

## Phase 0 — Launch blockers (must ship before go-live)

### Task 0.1 — Add the residual 301 redirects via the admin (manual, one-time)

**Why:** Audit §4. The bulk of the migration was solved structurally by **aligning the new detail routes to the live URLs** (done — see below), so almost nothing needs a redirect. Only ~13 genuinely-moved or retired URLs remain.

**Resolved by URL alignment (no redirect needed):** the new app's detail routes were renamed to match the live Webflow URLs exactly — `/blogs/{slug}`, `/resources/{slug}`, `/event/{slug}`, `/job/{slug}`, and `/guide/{slug}` (the guide route is served from the CMS `guides` collection with no listing). `/news/{slug}` and `/author/{slug}` already matched. These ~140 URLs keep working with zero redirects and zero equity loss.

**The residual redirects — add by hand in the admin** (`/admin` → Redirects → New). Thirteen fixed rows; the `redirects` collection is editor-managed by design, so a script is unnecessary. Each row is `{ from, to, status: "301" }`; `proxy.ts` resolves them via `lib/redirects-cache.ts`.

| From | To | Why |
|---|---|---|
| `/acceptable-use-policy` | `/legal/acceptable-use-policy` | moved under /legal |
| `/leadership` | `/teams` | merged |
| `/search` | `/` | no search page |
| `/survey` | `/` | defunct |
| `/pricing` | `/book-a-demo` | page intentionally not built (Task 1.4) |
| `/webinar/secure-containers-end-to-end-from-trusted-images-to-runtime-visibility-with-cleanstart-and-sysdig` | `/webinars` | no webinar detail page |
| `/webinar/secure-containers-end-to-end-from-trusted-images-to-runtime-visibility-with-cleanstart-and-sysdig-2` | `/webinars` | no webinar detail page |
| `/new-year-event-sysdig` | `/events` | retired landing |
| `/new-year-event-eventus` | `/events` | retired landing |
| `/cleanstart-hitachi-chennai` | `/events` | retired landing |
| `/cleanstart-hitachi-bengaluru` | `/events` | retired landing |
| `/cleanstart-hitachi-hyderabad` | `/events` | retired landing |
| `/cleanstart-raksha-chennai` | `/events` | retired landing |

`/about-copy` and `/pricing-copy` are Webflow junk — leave them to 404 (no equity).

**Dependency:** the aligned `/guide/{slug}` route only avoids 404s once the 49 Webflow guides are imported into the `guides` collection with their original slugs (Phase H ETL). Confirm the slug mapping with the CleanStart team.

**Acceptance criteria:**
- Crawl the old sitemap's 236 URLs against staging: **0 unredirected 404s** for any URL with a new equivalent; the 13 rows above each resolve in a single 301 hop.
- Spot-check that a blog, resource, event, job, and guide detail URL from the live sitemap each resolve to live content on the new site (same path).

---

### Task 0.2 — Complete the XML sitemap

**Why:** Audit §5. Sitemap omits ~70% of indexable routes.

**File:** `apps/web/src/app/sitemap.ts`

- Expand `STATIC_ROUTES` to every built static/listing page: `/cleansight`, `/cleanstart-images`, `/fips`, `/software-bill-materials`, `/software-composition-analysis`, `/attack-surface-reduction`, `/for-developers`, `/for-ciso`, `/partners`, `/community`, `/contact-us`, `/book-a-demo`, `/deal-registration`, `/teams`, `/legal`, `/legal/acceptable-use-policy`, `/privacy-policy`, `/careers`, `/events`, `/news`, `/webinars`, `/podcast` (+ existing 5). **Do not add `/pricing`** — it is intentionally not built (Task 1.4).
- Add CMS fetches for: `news` → `/news/{slug}`, `events` → `/events/{slug}`, `knowledgeBase` → `/knowledge-hub/{slug}`, jobs → `/careers/{slug}`. **No `/webinars/{slug}`** — there is no webinar detail route (Task 1.3); only the `/webinars` listing is in the sitemap.
- **Respect `seo.indexable`:** once Task 0.5 lands, filter out any CMS doc flagged `noindex` / `noindex,nofollow` so the sitemap never advertises a page the page itself tells Google not to index.
- Keep the existing `lastModified` sourcing (`updatedAt → displayPublishedAt → publishedAt`) and the published-only filter. Keep omitting `priority`/`changefreq` (WEB-PRODUCTION §5 decision #10).
- Exclude any route the redirect map points away from (don't list both old and new).

**Acceptance criteria:**
- `curl https://www.cleanstart.com/sitemap.xml` lists every built route + all published CMS docs; no draft/unpublished URLs; no redirected (old) URLs.
- Count roughly matches: static routes + (blogs + resources + authors + news + events + webinars + knowledgeBase + jobs).

---

### Task 0.3 — Create the default OG image

**Why:** Audit §3 item 7. `/og/default.png` is referenced everywhere but does not exist; social shares render broken.

**File:** `apps/web/public/og/default.png` (1200×630, <300 KB; alt already defined in `canonical.ts#DEFAULT_OG_IMAGE`).

**Acceptance criteria:** File exists on disk; `curl -I` returns 200; validate one page in the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) / X Card Validator.

---

### Task 0.4 — Build `/knowledge-hub` listing + confirm guide migration

**Why:** Audit §6. ~60 old `/guide/*` URLs redirect to `/knowledge-hub/{slug}` (Task 0.1) — the detail route exists but the listing page does not, and we must confirm each guide has a landing slug.

**Files:** `apps/web/src/app/knowledge-hub/page.tsx` (new listing, mirror `/blogs` listing pattern + `generateMetadata` + BreadcrumbList).

**Acceptance criteria:** `/knowledge-hub` renders a paginated listing; all redirect targets from `/guide/:slug` resolve to live KB articles; listing has metadata + canonical.

---

### Task 0.5 — Wire CMS `seo.*` fields into `apps/web` rendering

**Why:** Audit §3.2. The CMS ships a full SEO field group + an 11-component SEO sidebar (health score, SERP preview, schema preview, canonical check, social card, head tags, advanced robots panel), but **`apps/web` consumes none of it** — every editor-set `seo.title/description/ogImage/indexable/canonicalOverride/additionalSchema/robotsAdvanced/alternates/customTags` value is silently dropped before it reaches the rendered HTML. The whole authoring surface is decorative today. This is a launch blocker because the migration plan (titles, canonicals, per-page noindex) assumes editors can control these — and they can't until this lands.

**Root cause (three breaks, all on the web side):**
1. The content TS types (`Blog`, `News`, `Resource`, `Event` in `apps/web/src/lib/{blog,news,resources,events}.ts`) **omit a `seo` property**, so even though the fetches use `depth=3` and the API returns `seo`, TypeScript strips it as unknown.
2. `generateMetadata` in `blog/[slug]`, `news/[slug]`, `resource/[slug]`, `events/[slug]` reads only base fields (`title`, `abstract`, `heroImage`).
3. JSON-LD uses hardcoded `lib/seo/jsonld.tsx` builders that ignore `seo.additionalSchema`; `sitemap.ts` ignores `seo.indexable`; `canonical.ts#buildPageMetadata` ignores `seo.canonicalOverride`.

**Files:**
- `apps/web/src/lib/{blog,news,resources,events}.ts` — add a typed `seo` field to each content type (mirror the relevant subset of the CMS `seo` field group; reuse `packages/types` if the generated Payload type is re-exported there).
- Each detail `generateMetadata` — prefer `seo.title → base title`, `seo.description → abstract`, `seo.ogImage → heroImage → default`, and pass `seo.indexable` + `seo.canonicalOverride` through to `buildPageMetadata` (the helper already accepts a `noindex` param; extend it to accept a canonical override and to derive `noindex` from the CMS `indexable` enum).
- `lib/seo/canonical.ts#buildPageMetadata` — honor a canonical override and the CMS `indexable` value (still hard-gated by `VERCEL_ENV` for non-prod).
- JSON-LD render path — append validated `seo.additionalSchema` blobs to the page's existing structured data.
- `sitemap.ts` — drop docs flagged `noindex` (ties into Task 0.2).
- Optionally render `seo.robotsAdvanced` / `seo.alternates` / `seo.customTags` into `<head>` (the CMS composition libs `composeRobotsMeta` / `composeHreflangCluster` / `composeCustomTags` already encode the exact output — port or re-expose them to the web layer rather than reimplementing).

**Acceptance criteria:**
- Set a distinct `seo.title`, `seo.description`, and `seo.ogImage` on one blog/news/resource/event doc in the CMS; `curl` the rendered page and confirm those exact values appear in `<title>`, `<meta name="description">`, and `og:image`.
- Flag a doc `noindex` in the CMS → rendered page emits `robots: noindex` **and** the doc disappears from `sitemap.xml`.
- Set `seo.canonicalOverride` → rendered `<link rel="canonical">` matches the override.
- Add an `additionalSchema` blob → it appears in the page's JSON-LD and passes Rich Results Test.

---

## Phase 1 — High priority (launch week)

### Task 1.1 — Product structured data
Add `Product` or `SoftwareApplication` JSON-LD to `/cleanstart-images` and `/cleansight` (WEB-PRODUCTION §7). Add a `productSchema()` builder to `lib/seo/jsonld.tsx` alongside the existing builders. Validate in [Rich Results Test](https://search.google.com/test/rich-results).

### Task 1.2 — Careers detail metadata + JobPosting schema
Add `generateMetadata` (title/description/canonical from job fields) and `JobPosting` JSON-LD to `apps/web/src/app/careers/[slug]/page.tsx`. JobPosting can earn Google Jobs placement — meaningful organic surface.

### Task 1.3 — Webinars: no detail route (decided)
**Decision: do not build `/webinars/[slug]`.** The `/webinars` listing's "join" buttons link directly to the external webinar URL. Old `/webinar/{slug}` detail URLs are 301'd to the `/webinars` listing in the Task 0.1 redirect map. No `Event` detail schema is needed; ensure the listing items carry their external join links and that the listing page itself has metadata + canonical. (Already reflected in Task 0.1 and the sitemap in Task 0.2.)

### Task 1.4 — `/pricing`: remove, don't build (decided)
**Decision: do not build `/pricing` now.** Remove it from all routes, the sitemap (Task 0.2), and any references. Hold a 301 `/pricing → /book-a-demo` in the redirect map (Task 0.1) to catch the old indexed URL. Add a one-line note to the repo `CLAUDE.md` (apps/web section) that a future pricing page will inherit SEO automatically like every other page — no special handling needed when it is added. No further action this launch.

### Task 1.5 — Tighten thin titles
Rewrite the new titles for pages flagged in audit §7 to front-load the primary keyword: `/attack-surface-reduction` ("Attack Surface Reduction | CleanStart"), `/for-ciso`, `/teams`, `/community`. Edit the `buildPageMetadata({ title })` call in each `page.tsx`.

### Task 1.6a — Preview-path noindex header consistency (optional hardening)
Indexing controls are already correct (audit §3.1): production-only indexing, staging `X-Robots-Tag: noindex` at the header level, and `/preview` protected by its own page `metadata.robots` + robots.txt disallow. For belt-and-suspenders consistency, add `|| isPreviewPath` to the `X-Robots-Tag` noindex condition in `apps/web/src/proxy.ts:160` (the `isPreviewPath` variable already exists on line 62) so the proxy header and the page meta tag always agree, regardless of the draft cookie. One line; no behavioral change in the normal preview flow.

**Acceptance:** `curl -I` of `/preview/blogs/<slug>` on production (without the bypass cookie) returns `X-Robots-Tag: noindex, nofollow, noarchive`; production content pages still return the indexable `X-Robots-Tag`.

### Task 1.6b — Block `*.vercel.app` from indexing (P1)
Audit §3.1. PR/branch preview deployments are already noindex (`VERCEL_ENV=preview`). The gap is the **production** deployment's `.vercel.app` aliases (`<project>.vercel.app`, immutable `<hash>.vercel.app`), which run with `VERCEL_ENV=production` and currently pass the index gate — duplicate content is only suppressed by the cross-domain canonical.

Fix: add a `.vercel.app` host-suffix check that forces noindex regardless of `VERCEL_ENV`:
- `apps/web/src/proxy.ts:160` — add `|| isVercelHost` (where `isVercelHost = bareHost.endsWith(".vercel.app")`) to the `X-Robots-Tag` noindex condition.
- `apps/web/src/app/robots.ts:13` — add the same `.vercel.app` suffix check to the `Disallow: /` branch.

Stronger alternative: 308-redirect any `.vercel.app` host → `www.cleanstart.com` in `proxy.ts` (mirror the apex→www rule), removing the duplicate host entirely.

**Acceptance:** `curl -I https://<project>.vercel.app/` returns `X-Robots-Tag: noindex, nofollow, noarchive` and `curl https://<project>.vercel.app/robots.txt` returns `Disallow: /`; `www.cleanstart.com` is unaffected (still indexable).

### Task 1.6 — Host & URL normalization
Confirm apex → `www` (308) and trailing-slash/lowercase normalization at the edge (Vercel/CDN) per WEB-PRODUCTION §5. Document where it's enforced.

---

## Phase 2 — Medium priority

- **2.1 Internal linking & breadcrumbs:** descriptive anchor text; breadcrumbs on all detail pages; cross-link guides ↔ blogs ↔ product pages.
- **2.2 Image alt-text audit:** content images have meaningful alt; decorative SVGs `aria-hidden`.
- **2.3 Core Web Vitals:** measure at 1440 + mobile; address LCP/CLS regressions (use `core-web-vitals` skill).
- **2.4 Search Console setup:** verify both apex and `www` properties; submit sitemap; set the new property; monitor Coverage + redirect errors daily for the first 2 weeks.

---

## Phase 3 — Nice to have

- **3.1** `manifest.json` / PWA basics.
- **3.2** `llms.txt` + `ai.txt` (WEB-PRODUCTION §8 insurance files).
- **3.3** Post-launch GSC monitoring dashboard for the top-impression migrated URLs (protect what ranks).

---

## Verification (end-to-end)

Run after Phase 0, before flipping DNS / promoting to production:

1. **Redirect crawl:** crawl all ~250 old sitemap URLs against staging (Screaming Frog or a script). Assert: 0 unredirected 404s on migratable URLs, all redirects single-hop permanent.
2. **Sitemap diff:** parse new `sitemap.xml`; assert every built route + every published CMS slug is present and no redirected/old URL appears.
3. **Metadata smoke test:** for each route type, `curl` the rendered HTML and confirm unique `<title>`, `description`, self-referencing `<link rel="canonical">`, and `og:image` resolving to a 200.
4. **Structured data:** run Rich Results Test on one URL per schema type (Organization, BlogPosting, NewsArticle, Article, Event, Product, JobPosting, BreadcrumbList) — 0 errors.
5. **OG render:** Facebook/X validators on home + one blog + one product page show the correct card and image.
6. **robots/indexing:** confirm production returns `index,follow` + sitemap line; staging returns `Disallow: /`.
7. **Pre-completion checks (CLAUDE.md):** `pnpm --filter @cleanstart/web lint && typecheck && build` all pass.

**Post-launch (first 2 weeks):** watch GSC Coverage for spikes in 404/redirect errors; confirm migrated URLs are being re-indexed at the new paths; compare impressions/clicks for top old URLs against the baseline in audit §7.

---

## Sequencing summary

```
Phase 0 (BLOCKERS, before any prod deploy)
  0.1 Redirect map (CMS redirects collection) ─┐
  0.2 Sitemap                                   │
  0.3 OG image                                  ├─ all five must be done + verified together
  0.4 KB listing                                │
  0.5 Wire CMS seo.* → apps/web rendering      ─┘
        │
Phase 1 (launch week)   1.1 Product schema · 1.2 Careers · 1.3 Webinars (no detail, decided) · 1.4 Pricing (remove, decided) · 1.5 Titles · 1.6/1.6a/1.6b Normalization & indexing hardening
        │
Phase 2 (weeks 1–3)     Internal linking · alt text · CWV · GSC
        │
Phase 3 (backlog)       manifest · llms.txt · monitoring dashboard
```
