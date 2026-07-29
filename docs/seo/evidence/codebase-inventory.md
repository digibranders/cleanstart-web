# CleanStart — Codebase SEO Implementation Inventory

Consolidated from eight independent parallel code audits of the `cleanstart-website` monorepo (branch `development`), conducted 2026-07-29. Every claim below is `file:line`-cited by the originating auditor. This document performs no analysis and reaches no verdicts — it only consolidates. Judgment happens in a later phase, against this document plus `docs/seo/evidence/field-data.md` and `docs/seo/evidence/sources/`.

---

## Contradictions and open questions

This section is the most load-bearing part of the document. It collects every place the eight audits disagree, refine one another, or found the repo's own comments/docs to be wrong, plus every `UNDETERMINED` any auditor reported.

### A. Where one auditor's finding refines or overturns another's

**A1. Whether `resources/[slug]`, `news/[slug]`, `job/[slug]`, `event/[slug]`, `author/[slug]` wire CMS `seo.noindex`/`seo.nofollow` the same way as the 5 confirmed routes.**
- The **crawl** audit confirmed only 5 direct callers of `buildPageMetadata` with `seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}`: `blogs/[slug]/page.tsx:84`, `guide/[slug]/page.tsx:86`, `knowledge-hub/[slug]/page.tsx:52`, `(legal)/privacy-policy/page.tsx:51`, `(legal)/legal/[slug]/page.tsx:52`. It marked `resources/[slug]`, `news/[slug]`, `job/[slug]`, `event/[slug]`, `author/[slug]` as **UNDETERMINED** — "not individually re-verified line-by-line in this pass (only the 4 files above were opened)" (`inventory-crawl.md` §5, line 44).
- The **metadata** audit, working independently, opened all of these and found: `event/[slug]/page.tsx:39-79`, `job/[slug]/page.tsx:49-86`, `news/[slug]/page.tsx:40-80`, and `resources/[slug]/page.tsx:45-84` **all** resolve metadata "CMS via `resolveCmsSeo(...)`" — the same mechanism as the 5 confirmed routes (metadata Coverage table). This substantially narrows crawl's UNDETERMINED for 4 of the 5 named routes.
- The exception is **`author/[slug]`**: the metadata audit found it builds title/description directly from CMS author fields (`name`, `role`, `bioShort`, `photo`) and explicitly **does not call `resolveCmsSeo`** — "so the collection's `seo.*` override (if any) is never consulted here" (`author/[slug]/page.tsx:35-71`, metadata Coverage table + Question 2 answer). So of crawl's 5-route UNDETERMINED list, 4 are resolved (same pattern as the confirmed 5) and 1 (`author/[slug]`) is resolved differently (no `resolveCmsSeo` call at all, hence no CMS-level noindex knob for authors).
- Neither audit fully confirms the exact `noindex`/`nofollow` *pass-through* line for the 4 resolved routes (metadata's citation is to the metadata-resolution block, not necessarily the identical `...(seo.noindex ? {...} : {})` spread crawl was checking for) — so this is a refinement, not a 100% closure of crawl's original question.

**A2. `/knowledge-hub` and `/legal` index routes — three independent audits converge on the same conclusion from three different angles, without cross-referencing each other.**
- **Architecture** audit: `knowledge-hub/page.tsx:11-18` and `(legal)/legal/page.tsx:10-14` each compute a CMS-driven `permanentRedirect()` target, but `proxy.ts`'s hardcoded `SECTION_INDEX_REDIRECTS` (`proxy.ts:39-42,126-132`) intercepts the exact pathnames first and issues a 308 before either page component ever runs — filed under "Dead or unreachable code" (#2).
- **Metadata** audit, independently: both routes are "**Redirect** — `permanentRedirect()` to [target], no metadata export"; concludes "there is no 'hidden mechanism' producing a title for `/knowledge-hub` or `/legal` as rendered documents — a crawler following the redirect sees the target page's CMS-driven title, not a title for the index path" (metadata report, "On the task's ... premise" section).
- **Schema** audit, independently: lists `(legal)/legal/page.tsx` and `knowledge-hub/page.tsx` among the "No JSON-LD at all" routes because they are `permanentRedirect`s with no rendered body.
- These three are consistent, not contradictory — flagged here because no single audit had the full picture (dead-code mechanism + metadata consequence + JSON-LD consequence) and only reading all three together shows the redirect target in `proxy.ts` is the sole source of truth for these two paths, with two other independently-maintained page-level implementations that never execute in production.

**A3. `cms-seo.ts`'s own comment about `additionalSchema` being unwired is contradicted by evidence — but the two audits that touched this file agree on the resolution.**
- **Schema** audit: `apps/web/src/lib/seo/cms-seo.ts:7-10` states `additionalSchema` "is field-level admin-read-only, so an anonymous web fetch never receives it" and lists it as "intentionally NOT wired." This is directly contradicted by (a) the field's actual access control, `apps/cms/src/payload/fields/seo.ts:387` (`read: () => true`, explicitly commented as public for exactly this reason), and (b) `apps/web/src/lib/seo/compose-page.ts:59-64`'s `seoOverride()`, which **is** called from 7 detail-page files and is unit-tested (`compose-page.test.ts:40-51`). Filed as "Dead or unreachable code" #3, with an UNDETERMINED on whether the comment predates the field becoming public-read.
- **Metadata** audit, working the same file independently, reached a compatible conclusion without calling it a contradiction: it names `robotsAdvanced`, `alternates` (hreflang), `customTags`, and advanced twitter/og fields as **genuinely** unwired (confirmed no consuming file exists for any of the three named composition helpers), while noting `additionalSchema` "is separately handled (via `seoOverride()`/`getRegistryEntry()`, JSON-LD path, not metadata) rather than genuinely dead" (metadata report, Dead-code section, last bullet).
- Net: both audits agree on the underlying fact (additionalSchema IS wired, the other three fields are NOT); only the schema audit explicitly frames the file's own header comment as **wrong** on the additionalSchema point.

### B. Stale or contradicted comments, docs, or prior assumptions found in the repo

1. **`sitemap.ts:71` comment vs. `sitemap.ts:101` code** (architecture audit): the header comment states `/pricing` is "intentionally omitted (not built)," but `sitemap.ts:101` lists `{ path: '/pricing' }` inside `STATIC_ROUTES`, `apps/web/src/app/pricing/page.tsx` is a fully built page with no `noindex`, and `docs/web/WEB-PAGES.md` marks Pricing `✅` built. Code and docs agree with each other; only the in-file comment is stale/wrong.
2. **`apps/web/src/lib/seo/verification.ts`'s docstring is wrong about its own role** (metadata audit): the docstring (`verification.ts:9-10`) claims `siteVerification()` is "Set once in the root layout's `metadata`," but the root layout actually calls a **different** function, `verificationFromDefaults()` from `seo-defaults.ts` (`layout.tsx:27-29,100`). `verification.ts`'s own inline comment (`verification.ts:13-15`) further claims the CMS field `seoDefaults.verification.google` is "for the Phase-J2 dashboard's display, not for emitting the live tag" — but the live tag **is** in fact emitted from that same CMS field via `verificationFromDefaults()`, contradicting the comment. `siteVerification()` itself is dead code (zero non-test callers).
3. **`docs/web/WEB-PRODUCTION.md:429-430` says `llms.txt` is "Not yet created"** (geo audit) — false against the repo: `apps/web/public/llms.txt` exists (37 lines, one commit `80d313f4`, populated, committed, referenced by nothing in `apps/web/src`). Doc and repo have drifted. (`ai.txt`, documented at the same doc location as also "not yet created," **is** still accurate — confirmed absent from `public/`.)
4. **`apps/cms/src/payload/endpoints/jsonld.ts`'s own doc-comment is aspirational, not descriptive** (schema audit, Dead-code #5): lines 73-81 claim the `GET` handler is "Used by the public renderer (or any external consumer)" — no code anywhere in the repo, web or otherwise, is such a consumer; the endpoint is reachable only from the CMS admin preview UI and CMS tests.
5. **`podcast/page.tsx:31-35`'s comment states a "revalidate 60" that doesn't match the shared default** (rendering audit): the comment says the page's CMS fetch uses "revalidate 60," but `cms-fetch.ts:47`'s `DEFAULT_REVALIDATE_SECONDS` is `3600`. Not resolved — UNDETERMINED whether `lib/podcast.ts`'s specific call sites pass an explicit `revalidateSeconds: 60` override (not traced).
6. **`apps/web/.env.example:42-43` documents a `REVALIDATE_SECRET` contract that no CMS code honors** (rendering audit, Dead-code section): the `.env.example` says to "set the same value in apps/cms/.env as REVALIDATE_SECRET," but the CMS's actual sender (`revalidateWeb()`) only ever constructs the `WEB_REVALIDATE_SECRET`-bearer-token shape; no CMS code reads or sends a plain `REVALIDATE_SECRET`/`{secret,tag}` body. The web-side "Mode 2" branch that checks `REVALIDATE_SECRET` (`api/revalidate/route.ts:59-79`, plus its `NAV_CACHE_TAGS` allow-list) has no in-repo caller.

### C. Corroborating overlaps worth surfacing together (not contradictions, but only visible by combining reports)

- **The `ga4DataApi` cache-provider tag is reused across three unrelated data types.** The **performance** audit found CrUX field data is written via `writeCache(req.payload, 'ga4DataApi', 'global', 'crux:default', payload)` (`refresh-crux.ts:19`, also `dashboards-advanced.ts:11,29,36`) even though `CachedProvider`'s union has no dedicated `crux` value — disambiguated only by the `key` field. The **measurement** audit, independently, documented `refreshContentInsightsTask` writing `writeCache(req.payload,'ga4DataApi','global','content:snapshot', snap)` for content-insights data — the *same* provider tag, a different key. Neither audit flagged this as a bug (both note existing call sites correctly filter by key), but three distinct data types (real GA4 rows, CrUX rows, content-insights snapshots) share one `provider` enum value, a fact only visible by reading both reports together.
- **No branch protection reframes every audit's "Tests" section uniformly.** The **measurement** audit ran `gh api repos/digibranders/cleanstart-website/branches/{main,development}/protection` and got `404 "Branch not protected"` for both branches — meaning nothing catalogued as "tested"/"covered" by any of the eight audits currently blocks a merge at the GitHub level, even where a CI job runs it and could go red. The other seven audits each separately catalog what is/isn't tested for their domain without this fact; it qualifies all of them uniformly.
- **`packages/schema`'s test suite (~65 cases) exists and asserts real invariants, but never runs in CI.** The **schema** audit's own "Tests" section lists these files as "covered" for structured-data primitives (builders, compose, validators) without checking CI wiring (out of its stated scope). The **measurement** audit, independently, traced the CI configuration in detail (`apps/web/vitest.config.ts:11` scope, `.github/workflows/web.yml:79-83`, `ci.yml:95-96`, `turbo.json`'s `test` task only depending on `^build`) and concluded none of the 7 `packages/schema/**/*.test.ts` files are ever invoked by any CI job. Combining them: the tests the schema audit calls "covered" are source-level only, not CI-gated.

### D. Every `UNDETERMINED` item, by originating domain, with what would resolve it

**Crawl & Index Control**
- Whether the Vercel Firewall rule blocking `Bytespider` by User-Agent (referenced only as a comment at `robots.ts:32-34`) actually exists/is active — would need Vercel project firewall dashboard/API access; not present in the repo.
- Whether `resources/[slug]`, `news/[slug]`, `job/[slug]`, `event/[slug]`, `author/[slug]` wire `seo.noindex` identically to the 5 confirmed routes — partially resolved by the metadata audit (see A1 above); `author/[slug]`'s divergence (no `resolveCmsSeo` call) is now confirmed, not undetermined.

**URL Architecture & Sitemaps**
- Whether `/pricing`'s sitemap inclusion is the intended current state or a regression relative to the stale comment at `sitemap.ts:71` — would need author/PR history (`git blame`) for that line; out of a static-code-read audit's scope.
- Whether the hardcoded `SECTION_INDEX_REDIRECTS` targets in `proxy.ts:40-41` (`/knowledge-hub` → `/knowledge-hub/vex-documents`, `/legal` → `/legal/additional-third-party-terms`) currently match what `getKnowledgeLanding()`/`getLegalList()` would compute live from the CMS's current `displayOrder`/`order` — would need querying live/dev CMS data for those two collections.
- Whether `/api/` paths are individually excluded from `sitemap.xml` candidacy by an explicit rule, or simply never added — `robots.txt` disallows only `/api/preview/`, not `/api/` broadly, so there is no code-level assertion ruling out a future `/api/*` route being added to the sitemap by mistake.

**On-Page Metadata**
- Whether the home page's (`/`) dual metadata definitions (`layout.tsx`'s `generateMetadata()` plus `page.tsx`'s `export const metadata`) are an intentional override-on-purpose or accidental duplication — no comment explains it; would need commit history or an author interview.

**Structured Data / JSON-LD**
- Whether `cms-seo.ts`'s stale comment (see A3/B above) predates the Tier-3 override becoming public-read — would need `git log -p apps/web/src/lib/seo/cms-seo.ts apps/cms/src/payload/fields/seo.ts` to date the divergence.
- Whether "Task 0.5" (migrating the 10 legacy per-schema pages to the unified `@graph`/`JsonLdGraph` path, per the shim comment at `apps/web/src/lib/seo/jsonld.tsx:3-6`) is tracked anywhere beyond that comment — would need to open `docs/web/SEO-IMPLEMENTATION-PLAN.md` or equivalent to confirm current status (not read in this pass).
- Whether any Playwright/e2e suite in `apps/web` asserts on rendered `<script type="application/ld+json">` content — none was found under the scope reviewed (`apps/web` does not appear to have its own `tests/e2e` the way `apps/cms` does), but this was not exhaustively searched.

**AEO / GEO**
- Whether the DNS-level `_index._agents.cleanstart.com` `HTTPS`/`SVCB` record (documented as "PUBLISHED 2026-06-10" in `docs/web/WEB-PRODUCTION.md:115-126`) is still live — would need a `dig HTTPS`/`dig SVCB` query or Cloudflare dashboard access; not present as code in this repo.
- Whether the Vercel Firewall rule blocking `Bytespider` is currently active (same open question as the crawl audit's, reached independently) — would need Vercel dashboard/API access.
- Whether the Cloudflare "Block AI Scrapers and Crawlers" toggle (required disabled per `docs/web/WEB-PRODUCTION.md:107-108,433`) is currently disabled — would need Cloudflare dashboard access.
- What `apps/web/public/2abd211550dc3ce92123f2a22d86df7d.txt` (an unrelated-looking verification-token-style static file next to `llms.txt`) is for — would need to open the file and check for a consumer (e.g., a site-verification meta tag); out of the stated AEO/GEO scope so not opened.

**Performance / Core Web Vitals**
- Whether every hero component with an `<Image>` LCP candidate actually sets `priority` — not individually verified beyond two sampled files and a grep-based file list; would need a per-file read of all 25+62 grep hits.
- Which 2 of the ~62 files importing `next/image` under `components/sections` lack a matching `sizes=` — not isolated by file-level diff; would need a per-file grep.
- Whether `apps/cms/src/payload/endpoints/dashboards-advanced.ts` (the `cruxEndpoint`/`ga4RealtimeEndpoint` handlers) has any test file under a different name — a targeted `find` found none, but a full directory listing was not performed, so this is flagged with high confidence rather than certainty.

**Rendering & Delivery**
- Whether `x-nextjs-stale-time: 300`, observed on every live prerendered page regardless of that page's own `revalidate = 3600` segment export, reflects a Vercel-platform-level constant distinct from the code's `revalidate`/`expireTime` values, or something else — cannot be resolved by reading the repository; would need Vercel's ISR runtime documentation/support or a controlled revalidate-timing experiment.
- Whether `podcast/page.tsx`'s `lib/podcast.ts` fetch calls pass an explicit `revalidateSeconds: 60` override (per its own comment, contradicting the shared 3600 default) — not traced in this pass (see B5 above).

**Measurement & Governance**
- Whether the GitHub Actions variable `INDEXNOW_KEY` (rendered into the droplet `.env` via `deploy-cms.yml:162,227`) is actually set to a non-empty value in the live environment — repo/environment variable contents aren't visible via `gh api` without additional scopes; if unset, the IndexNow hook silently no-ops for every publish and no test in the repo would catch that against the *deployed* env specifically.
- Whether GA4's "Enhanced Measurement → History events" toggle is actually OFF in the live GA4 property console (asserted only in code comments at `Ga4RouteTracker.tsx:16-19` and `GatedAnalytics.tsx:26-27`) — this is GA4 UI/API state, not observable from the repo.
- Whether `packages/schema`'s test suite currently passes when run manually (`pnpm --filter @cleanstart/schema test`) — not executed as part of any static audit; moot in one sense since even a fully green suite there is not wired to any CI job (see C above).
- Whether the IndexNow `<key>.txt` file is actually being served at `<baseUrl>/<key>.txt` in production — no test or CI step verifies this; would need a live fetch.

---

## Crawl & Index Control

Scope: `apps/web` — the central indexing gate, `robots.txt`, `X-Robots-Tag`, per-page `robots` meta, CMS-driven noindex, sitemap suppression, and crawl-consolidating redirects.

### Mechanisms

**1. Central indexing gate — `apps/web/src/lib/seo/indexing.ts`**
- `isIndexingAllowed(host?)` (`indexing.ts:51-56`) is the single boolean gate every other mechanism consults: returns `true` unconditionally if `process.env.ALLOW_INDEXING === "1"` (`:52`); else `false` if `process.env.VERCEL_ENV !== "production"` (`:53`); else, if a `host` argument was passed, `false` when `isNoindexHost(host)` is true (`:54`); else `true` (`:55`).
- `isNoindexHost(host)` (`:36-43`): lowercases the host, strips a trailing `:port`, returns true if the bare host is in `NOINDEX_HOSTS` (exact match) or ends with any suffix in `NOINDEX_HOST_SUFFIXES`.
- `NOINDEX_HOSTS` (`:31`) = `[]` (empty — comment says `staging.cleanstart.com` was removed 2026-07-29). `NOINDEX_HOST_SUFFIXES` (`:34`) = `[".vercel.app"]`.
- Callers pass `host` (per-request) in `robots.txt/route.ts:8-10`, `proxy.ts:80,233`. Callers omit `host` (build-time, host-less) in `layout.tsx:64`, `sitemap.ts:118`, `canonical.ts:100`. Per `indexing.ts:45-50`, host-less build-time calls rely on the per-request `X-Robots-Tag` in `proxy.ts` as the backstop for host-based exclusion a static build can't know about.

**2. `robots.txt` content — `apps/web/src/lib/seo/robots.ts` + `apps/web/src/app/robots.txt/route.ts`**
- Served by a plain `Response` route handler (`route.ts:6-13`), not Next's `MetadataRoute.Robots` convention — stated reason (`robots.ts:17-21`): the metadata-route type can't emit the non-standard `Content-Signal` directive.
- The handler reads `host` from `headers()` (`route.ts:7-8`) and calls `buildRobotsTxt({ indexable: isIndexingAllowed(host) })` (`route.ts:10`).
- `buildRobotsTxt({ indexable })` (`robots.ts:22-61`): `indexable: false` → 4-line body: `User-Agent: *`, `Content-Signal: search=no, ai-input=no, ai-train=no`, `Disallow: /`, blank line. `indexable: true` → leading comment block, `User-Agent: *`, `Content-Signal: search=yes, ai-input=yes, ai-train=yes` (constant `CONTENT_SIGNALS`, `robots.ts:9`), `Allow: /`, `Disallow: /preview/`, `Disallow: /api/preview/`, `Disallow: /email-signatures`, `Disallow: /*_rsc=`, a second group `User-Agent: Bytespider` / `Disallow: /`, then `Host:`/`Sitemap:` lines.
- The `Bytespider` disallow is annotated as symbolic only (`robots.ts:32-34`) — Bytespider ignores robots.txt; the real block is a Vercel Firewall rule matching on User-Agent (not present in this codebase — see UNDETERMINED above).
- `SITE_URL` comes from `canonical.ts:5`: `process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com"`.

**3. `X-Robots-Tag` header — `apps/web/src/proxy.ts`**
- Set per request at `proxy.ts:233-237`: `"noindex, nofollow, noarchive"` if `isDraftMode` (`__prerender_bypass` cookie, `:29,82`) OR `isPreviewPath` (`/preview/` or `/api/preview/` prefix, `:83-85`) OR `!isIndexingAllowed(host)`.
- Else, only if `!ownsSecurityHeaders` (path not under `/email-signatures/[slug]`, `:93`): `"max-image-preview:large, max-snippet:-1"`.
- If path is `/email-signatures/[slug]` and none of the noindex conditions hold, `proxy.ts` sets neither variant — the route handler owns the header for that path.

**4. Per-page `robots` meta tag — `apps/web/src/lib/seo/canonical.ts`**
- `buildPageMetadata(...)` (`canonical.ts:80-179`) is the shared metadata builder every page is expected to call (`:75-79` comment).
- `gateBlocked = !isIndexingAllowed()` (`:100`, host-less build-time call). `robotsBlocked = noindex || gateBlocked` (`:101`). `robotsFollow = gateBlocked ? false : !nofollow` (`:105`) — the global gate forces `nofollow` too; a per-page `noindex` alone does not force `nofollow` unless the caller also passes `nofollow: true`.
- Output `robots` field (`:161-177`): when `robotsBlocked`, `{ index: false, follow: robotsFollow, googleBot: { index: false, follow: robotsFollow } }`; otherwise `{ index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }`.
- `buildListingMetadata(...)` (`:208-216`) always calls `buildPageMetadata` without a `noindex` argument — listing pages have no per-page override path; their `robots` output depends only on the global `gateBlocked` value (rationale at `:195-207`: listings render page-1 HTML for every query-param variant and self-canonicalize to `basePath`).

**5. CMS-driven per-document noindex — `apps/web/src/lib/seo/cms-seo.ts`**
- `resolveCmsSeo(seo, opts)` (`cms-seo.ts:52-85`) reads a CMS doc's `seo.indexable` field (`"index" | "noindex" | "noindex,nofollow"`, `:23`). If set and not `"index"`: `resolution.noindex = true` (`:63`); if exactly `"noindex,nofollow"`, also `resolution.nofollow = true` (`:64-66`). Plain `"noindex"` leaves `nofollow` unset (link equity still flows).
- Confirmed direct callers passing `seo.noindex`/`seo.nofollow` into `buildPageMetadata`: `blogs/[slug]/page.tsx:84`, `guide/[slug]/page.tsx:86`, `knowledge-hub/[slug]/page.tsx:52`, `(legal)/privacy-policy/page.tsx:51`, `(legal)/legal/[slug]/page.tsx:52`. See Contradictions §A1 for how `resources/[slug]`, `news/[slug]`, `job/[slug]`, `event/[slug]`, `author/[slug]` relate to this pattern.
- Not-found fallbacks hard-code `noindex: true` regardless of CMS state: `blogs/[slug]/page.tsx:65`, `guide/[slug]/page.tsx:64`, `knowledge-hub/[slug]/page.tsx:35`.

**6. Hard-coded page-level `noindex: true`**
- `src/app/roi-calculator/page.tsx:25` — comment at `:22-24` says both `noindex` and `nofollow`.
- `src/app/cleanstart-platform/page.tsx:25` — comment at `:24` says "index until it ships … noindex,follow (the default)".
- `src/app/email-signatures/page.tsx:26` — directory listing page; comment (`:17-18`) states three layers keep it out of search: this `noindex,nofollow` meta, a `Disallow` in robots.txt, and an `X-Robots-Tag` on the bare signature route.
- `src/app/email-signatures/[slug]/route.ts:59` sets `"X-Robots-Tag": "noindex, nofollow, noarchive"` directly on its `Response` (plain route handler, no `metadata` export possible — comment at `:54`).
- `src/app/preview/layout.tsx:15-17` sets `metadata.robots = { index: false, follow: false, nocache: true }` for every route under `/preview/*`.

**7. Sitemap suppression — `apps/web/src/app/sitemap.ts`**
- `sitemap()` (`:117-159`) returns `[]` immediately if `!isIndexingAllowed()` (`:118`, host-less call).
- Per-CMS-doc filter `isIndexable(doc)` (`:65-68`): included unless `doc.seo.indexable` is set to something other than `"index"`. Applied inside `fetchDocs` (`:57`) to every collection fetched.
- `STATIC_ROUTES` (`:72-108`) is hand-maintained; explicit exclusions noted in comments: `/pricing` and `/webinars/[slug]` "intentionally omitted (not built)" (`:71` — see Contradictions §B1 for why this is stale re: `/pricing`), `/cleanstart-platform` excluded (noindex'd until it ships, `:83-85`), `/knowledge-hub` excluded (redirect not a listing, `:94-95`), `/legal` excluded (308 redirect, `:96-97`).

**8. Legacy-parameter redirect — `apps/web/src/lib/seo/legacy-params.ts` + `proxy.ts`**
- `LEGACY_PAGINATION_PARAM = /^[0-9a-f]{6,10}_page$/i` (`legacy-params.ts:14`).
- `stripLegacyPaginationParams(search)` (`:25-39`): parses the query string, deletes every key matching the regex, returns `null` if nothing was stripped, else the remaining query string (`""` if nothing remains, distinct from `null`).
- Consumed at `proxy.ts:119-124`: if non-null, issues a `308` redirect to the same path with the cleaned search string, before any other middleware logic runs except the apex/trailing-slash/lowercase redirects above it.

**9. Other `proxy.ts` redirects affecting crawl consolidation**
- Apex → `www`: `shouldRedirectApex` (`:53-58`) / applied at `:97-102`, `308`, skipped on localhost.
- Trailing-slash removal: `shouldRedirectTrailingSlash` (`:60-66`) / applied at `:104-108`, `308`, skips paths whose last segment looks like a file extension.
- Path lowercasing: `shouldLowercase` (`:68-76`) / applied at `:110-114`, `308`, explicitly skips `/guide-cover/*` paths.
- `SECTION_INDEX_REDIRECTS` (`:39-42`): `/knowledge-hub` → `/knowledge-hub/vex-documents`, `/legal` → `/legal/additional-third-party-terms`, both `308` (`:126-132`). Comment (`:31-38`) states this exists because a server-component `redirect()` degrades to a 200+meta-refresh once the root layout starts streaming (async Header CMS fetch), which search engines would read as a duplicate/soft-redirect page.
- CMS-managed redirect table lookup (`lookupRedirect`, `:136-160`) — `410` for rows with `status === "410"`, else a redirect with the row's own status code. Fails open on lookup error (comment `:135`).
- `next.config.ts` `redirects()` (`:62-99`): permanent (301) redirects `/blog`→`/blogs`, `/guides`→`/guide`, `/guides/:slug*`→`/guide/:slug*`, `/events/:slug`→`/event/:slug`, `/careers/:slug`→`/job/:slug`. UNDETERMINED whether these run strictly before middleware — a Next.js-internal ordering behavior, not decided by this repo's code.

### Configuration

| Name | Type | Read at | Effect |
|---|---|---|---|
| `ALLOW_INDEXING` | env var | `indexing.ts:52` | Exact string `"1"` forces `isIndexingAllowed` → `true` unconditionally (any other value, including `"true"`, is ignored — confirmed by `indexing.test.ts:47-51`). |
| `VERCEL_ENV` | env var | `indexing.ts:53`, `proxy.ts:81` | Must be exactly `"production"` for indexing to be allowed and for HSTS/apex-redirect production behavior. |
| `NOINDEX_HOSTS` | const `readonly string[]` | `indexing.ts:31` | Currently `[]`. Exact-match noindex host list. |
| `NOINDEX_HOST_SUFFIXES` | const `readonly string[]` | `indexing.ts:34` | `[".vercel.app"]`. Suffix-match noindex host list. |
| `CONTENT_SIGNALS` | const, string | `robots.ts:9` | `"search=yes, ai-input=yes, ai-train=yes"` — literal value written into robots.txt when indexable. |
| `NEXT_PUBLIC_SITE_URL` | env var | `canonical.ts:5` | Falls back to `"https://www.cleanstart.com"`. Feeds `Host:`/`Sitemap:` lines and all sitemap entry URLs. |
| `LEGACY_PAGINATION_PARAM` | const, regex | `legacy-params.ts:14` | `/^[0-9a-f]{6,10}_page$/i` — 6–10 hex chars (verified by `legacy-params.test.ts:41-45`). |
| `CSP_ENFORCE` | env var | `proxy.ts:46` | Not a crawl/index control itself, gates CSP enforce vs. report-only in the same middleware file. |
| `__prerender_bypass` cookie | cookie name | `proxy.ts:29,82` | Presence triggers `isDraftMode`, forcing the noindex `X-Robots-Tag`. |

### Coverage

- **robots.txt**: single dynamic response for the whole site, host-gated. Not path-differentiated beyond the fixed `Disallow` list baked into `buildRobotsTxt`.
- **X-Robots-Tag via proxy.ts**: applies to every request matched by the middleware `matcher` (`proxy.ts:257-259`):
  ```
  /((?!_next/static|_next/image|favicon.ico|api/csp-report|.*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|woff|woff2|ttf|otf|map|txt|xml|json)$).*)
  ```
  Concretely: **`/robots.txt` and `/sitemap.xml` never pass through `proxy.ts`** — no `X-Robots-Tag`, CSP, HSTS, `Vary`/`Link` from this file. `robots.txt/route.ts` sets only `Content-Type: text/plain` (`:11`); `sitemap.ts` sets no headers at all.
- **X-Robots-Tag on `/email-signatures/[slug]`**: excluded from proxy.ts's own write (`:93,235`) so the route handler's own header (`route.ts:59`, always `"noindex, nofollow, noarchive"`, confirmed also for the 404 branch per `route.test.ts:99-103`) is what reaches the client, even if indexing were otherwise allowed.
- **Per-page `robots` meta**: applies wherever a page calls `buildPageMetadata`/`buildListingMetadata`. Confirmed direct `noindex: true`: `roi-calculator`, `cleanstart-platform`, `email-signatures` (listing), plus not-found branches of `blogs/[slug]`, `guide/[slug]`, `knowledge-hub/[slug]`. Confirmed CMS-driven: `blogs/[slug]`, `guide/[slug]`, `knowledge-hub/[slug]`, `(legal)/privacy-policy`, `(legal)/legal/[slug]`.
- **Sitemap**: emits `STATIC_ROUTES` (hand-maintained, 27 entries) plus dynamic entries for 9 CMS collections, each pre-filtered by `isIndexable`. `job/[slug]` sitemap dates use only `updatedAt`, no `publishedAt` fallback (`sitemap.ts:155`).
- **Legacy-param redirect**: applies to every request reaching `proxy.ts` with a matching search-string key — a blanket query-string transform before route-specific logic runs, not scoped to listing pages.
- **Next.js `redirects()` in next.config.ts**: applies at the framework redirect layer to the 5 listed source patterns only; no wildcard/catch-all beyond those.

### Tests

- `robots.test.ts`: exercises `buildRobotsTxt` for both `indexable: true`/`false`, asserting group placement, `Content-Signal` line, fixed `Disallow` list, symbolic Bytespider group, `Host`/`Sitemap` lines. Does not test the route handler's `GET`/host extraction.
- `indexing.test.ts`: exercises `isNoindexHost` and `isIndexingAllowed` fully — per-env behavior, host-aware vs. host-less calls, `ALLOW_INDEXING` exact-match behavior.
- `legacy-params.test.ts`: exercises `stripLegacyPaginationParams` broadly (stripping, case-insensitivity, co-occurring params, empty/bare-`?`, non-matches, hash-length boundaries 5/11 chars, non-hex prefix). No test asserts the `308` redirect actually fires from middleware.
- `canonical.test.ts`: covers OG-image derivation and title/brand-suffix handling only. **Does not test the `robots`/noindex output** (`gateBlocked`, `robotsBlocked`, `robotsFollow` logic at `canonical.ts:100-105,161-177`).
- No test file exists for `proxy.ts` itself (`find src -iname "*proxy*test*"` = zero results): apex redirect, trailing-slash redirect, lowercasing, `SECTION_INDEX_REDIRECTS`, the `X-Robots-Tag` branching (including the `ownsSecurityHeaders` carve-out), and the CMS-redirect-table lookup are all untested at the middleware level.
- No test file exists for `sitemap.ts` (`find src -iname "sitemap*test*"` = zero results): the `isIndexingAllowed()`-gated empty return, the `isIndexable` filter, and `STATIC_ROUTES` are untested.
- `email-signatures/[slug]/route.test.ts` covers the `X-Robots-Tag: noindex, nofollow, noarchive` header and the accompanying `<meta>` tag, for both normal and 404 branches (`:66-72,99-103`) — the one path-specific noindex mechanism with direct test coverage outside the `lib/seo` unit tests.

### Dead or unreachable code

- No fully dead/unreferenced exports found among `robots.ts`, `indexing.ts`, `legacy-params.ts`: every exported symbol has at least one non-test importer (`proxy.ts`, `sitemap.ts`, `layout.tsx`, `robots.txt/route.ts`, `canonical.ts`, `ga4-snippet.ts`, `leadfeeder.ts`).
- `NOINDEX_HOSTS` is exported and consumed (`indexing.ts` itself, `ga4-snippet.ts:1,44-46`), but its current value is `[]`, so at runtime the exact-match branch of `isNoindexHost` (`:40`) never contributes a `true` result today, and `ga4-snippet.ts`'s own conditional (`NOINDEX_HOSTS.length > 0`, `:44`) means the generated inline script omits that guard entirely on the current build. Live, reachable, presently a no-op due to empty configuration — not dead code, since re-populating the array reactivates it without any code change.
- The Bytespider block in `robots.ts:54-56` is documented as not functionally enforced (crawler ignores robots.txt) — enforcement is claimed to happen via a Vercel Firewall rule not present in this repository (see UNDETERMINED, §D).
- `apps/web/next.config.ts` `redirects()` array — all 5 entries referenced by comments explaining purpose; no evidence of unreachable/orphaned redirect rules.

---

## URL Architecture & Sitemaps

Scope: `apps/web/src/app/sitemap.ts`, the full `apps/web/src/app` route tree, redirect configuration (`next.config.ts`, `apps/web/src/proxy.ts`, CMS `redirects` collection), and internal-linking/breadcrumb helpers.

### Mechanisms

**Sitemap generation**
- `apps/web/src/app/sitemap.ts` exports a single Next.js `sitemap()` function (App Router `MetadataRoute.Sitemap` convention) — one `sitemap.xml`, no pagination (`:6`).
- `<priority>`/`<changefreq>` are never emitted; `<lastmod>` only when a CMS timestamp is available (`:8-11`, `entry()` at `:110-115`).
- Gate: `sitemap()` returns `[]` immediately if `isIndexingAllowed()` is false (`:118`), sourced from `indexing.ts:52-57`.
- Two URL sources concatenated (`:133-158`): (1) `STATIC_ROUTES` — hardcoded array of non-dynamic paths (`:72-108`), mapped through `entry()` with no `lastModified`; (2) nine CMS collections fetched in parallel via `fetchDocs()` (`:120-131`): `blogs`, `resources`, `authors`, `news`, `events`, `jobs`, `guides`, `legalDocuments`, `knowledgeBase`.
- `fetchDocs()` (`:49-61`) calls `${CMS_URL}/api/{collection}?{filter}&depth=0&limit=1000&{SITEMAP_SELECT}` with `next: { revalidate: 3600, tags: ['sitemap:{collection}'] }` (`:51-54`), returns `[]` on any non-OK response or thrown error (`:55,58-59`) — fails open (silently drops that collection rather than erroring the whole route).
- `CMS_URL` defaults to `process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3000'` (`:32`).
- Per-collection published filters (`:38-41`): `BLOG_FILTER` (blogs/resources/events/guides/legalDocuments/knowledgeBase): `where[_status][equals]=published&where[publishedAt][exists]=true`. `AUTHORS_FILTER`: `where[_status][equals]=published` only (no `publishedAt` check — Authors has no such field). `NEWS_FILTER`: same as BLOG_FILTER but keyed on `publicationDate`. `JOBS_FILTER`: `where[_status][equals]=published&where[hiringStatus][equals]=open`.
- `SITEMAP_SELECT` (`:45-47`) restricts the CMS response to `slug, updatedAt, publishedAt, displayPublishedAt, publicationDate, seo` — comment cites a prior 19.8 MB `knowledgeBase` full-body response as the reason (`:43-44`).
- `isIndexable()` (`:65-68`) drops any doc whose `seo.indexable` is set to something other than `'index'`/empty — applied inside `fetchDocs` (`:57`) before the doc reaches the URL list.
- `lastModified` per collection falls back through `updatedAt ?? displayPublishedAt ?? publishedAt` (or `publicationDate` for news) — `:138,142,147,151,153,154,156,157`. `jobs` uses only `updatedAt` (`:155`, no `publishedAt` fallback).
- `robots.txt` is a plain-text route handler, not Next's `robots.ts` metadata convention, because `Content-Signal` is non-standard (`robots.ts:18-19`). Built by `robots.txt/route.ts:1-11`, reads request `host` (`:8`), calls `isIndexingAllowed(host)` (`:10`). Emits `Sitemap: ${SITE_URL}/sitemap.xml` (`robots.ts:59`) and `Disallow: /*_rsc=`, `/preview/`, `/api/preview/`, `/email-signatures` (`:41-48`), plus a dedicated `Bytespider` disallow block (`:51-52`).

**URL building**
- `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com"` (`canonical.ts:6`) is the single base used by `sitemap.ts`, `robots.ts`, and `buildPageMetadata`/`absoluteUrl`.
- `buildPageMetadata()` (`canonical.ts:94-166`) sets `alternates.canonical` to `path` (or a `canonicalUrl` override) and builds the `robots` meta block (`:155-166`) from three independent inputs: per-page `noindex`, the build-time `isIndexingAllowed()` gate (`:106`, called with no host — per-request host gate is `proxy.ts`), and an explicit `nofollow` flag.
- `buildListingMetadata()` (`:200-208`) always canonicalizes listing pages to a clean `basePath` regardless of query string (`:186-197`: listings paginate/filter client-side; reading `searchParams` server-side would opt the route out of static rendering).

**Redirect resolution — three independent layers, evaluated in this order for a given request**

1. **Next.js build-time redirects** — `next.config.ts:63-91`, `async redirects()`. Four rules, all `permanent: true` (308): `/blog`→`/blogs`, `/guides`→`/guide`, `/guides/:slug*`→`/guide/:slug*`, `/events/:slug`→`/event/:slug`, `/careers/:slug`→`/job/:slug`.
2. **Middleware (`proxy.ts`)** — runs on every request matched by `config.matcher` (`:257-259`, excludes `_next/static`, `_next/image`, `favicon.ico`, `api/csp-report`, and static file extensions). In exact order: apex→`www` (308, `:97-102`, gated by `shouldRedirectApex` at `:53-58`, skipped on localhost `:48-51`); trailing-slash strip (308, `:104-108`, `shouldRedirectTrailingSlash` at `:60-66`); lowercase-path redirect (308, `:110-114`, `shouldLowercase` at `:68-76`, exempts `/guide-cover/`); legacy Webflow pagination query-param strip (308, `:119-124`, `stripLegacyPaginationParams`, `legacy-params.ts:26-38`, matches `/^[0-9a-f]{6,10}_page$/i`); `SECTION_INDEX_REDIRECTS` — hardcoded `Record<string,string>` (`:39-42`): `/knowledge-hub`→`/knowledge-hub/vex-documents`, `/legal`→`/legal/additional-third-party-terms`, applied at `:126-132` via exact-pathname lookup, 308; **CMS-managed redirects** — `lookupRedirect(nextUrl.pathname)` (`:137`, from `redirects-cache.ts:99-104`), skipped for root `/`, `/_next`, `/api`, `/images`, `/favicon.ico`, and any path with a file extension (`redirects-cache.ts:136-147`, `shouldSkipRedirectLookup`). A `410` row returns HTTP 410 with no body (`:147-149`); otherwise redirects to `row.to` with the row's own status code cast to `301|302|307|308` (`:150-158`). Every matched row fires a fire-and-forget hit-recording POST via `event.waitUntil` (`:141-146`, `recordRedirectHit` at `redirects-cache.ts:115-129`).
3. **CMS `redirects` collection** — `apps/cms/src/payload/collections/Redirects.ts:29-146`. Fields: `from` (unique, required, validated as site-relative path or full URL, `:44-50,58`), `status` (`301|302|307|308|410`, default `301`, `:63-75`), `to` (required unless `status=410`, `:77-100`), `source` (`manual|slug-change|archive-with-redirect|migration-seed`, system-set, `:102-112`), `hitCount`/`lastHitAt` (read-only counters incremented by `POST /api/redirects/record-hit`, `:114-131`). Read access is public (`:36`) specifically so `apps/web`'s middleware can query it without auth. Writes require `isAdminOrEditor`. A `beforeChange` hook, `redirectCycleGuardHook` (`apps/cms/src/payload/hooks/redirect-cycle-guard.ts`), walks the resulting chain up to `MAX_HOPS = 10` (`:4`), flattening after `FLATTEN_AFTER_HOPS = 3` (`:5`), rejects true cycles via `ValidationError`. Rows with `source === 'slug-change'` are system-managed and locked from manual edit on `from`/`status`/`to`.
- `redirects-cache.ts:37-97` caches the **entire** redirects table in-process per edge isolate (`FULL_TTL_MS = 60_000`, `:21`, paged up to 20×100 rows, `:45-71`), rather than one CMS round-trip per path. On fetch failure it fails open, serving the last-known map (or empty) and backing off `ERROR_BACKOFF_MS = 10_000` before retrying (`:84-90`).
- **Redundant redirect layer, confirmed unreachable in production**: both `apps/web/src/app/knowledge-hub/page.tsx:11-18` and `apps/web/src/app/(legal)/legal/page.tsx:10-14` independently compute a CMS-driven `permanentRedirect()` target (picking the first/lowest-`order` published doc). Because the `proxy.ts` middleware matcher matches `/knowledge-hub` and `/legal` exactly, and `SECTION_INDEX_REDIRECTS` intercepts those exact pathnames with a hardcoded target before the request ever reaches the page component, the page-level redirect logic in both files never executes for any request that passes through middleware. See "Dead or unreachable code" and Contradictions §A2.

**Breadcrumb derivation**
- Single builder: `breadcrumbTrail(kind, { title })` in `packages/schema/src/builders/breadcrumbs.ts:57-62`. Given a `DetailKind` (`:8-18`: `blog|guide|news|event|job|resource|knowledgeBase|author|legal|webinar`), returns `[HOME, ...listingCrumb?, { name: title }]`, where `HOME = { name: "Home", path: "/" }` (`:25`) and the listing crumb is looked up from a static `LISTING` map (`:28-39`) — `author` maps to `null` (no listing parent). Only the last crumb omits `path` (`:61`).
- Re-exported unchanged through `apps/web/src/lib/seo/jsonld.tsx:8` (`export * from "@cleanstart/schema/builders"`) and consumed identically by `apps/cms/src/payload/lib/jsonld/dispatch.ts:1,286,303,378-379,477,619`. One function, two call sites.
- `breadcrumbSchema(crumbs)` (`packages/schema/src/builders/jsonld.tsx:286-297`) turns a `BreadcrumbCrumb[]` into a schema.org `BreadcrumbList`, omitting `item` only on crumbs with no `path` (`:294`).
- Visible UI: `apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx:32-83` renders `items: HeroCrumb[]` as `Home › … › Title`, hiding the last crumb on mobile only when there is a parent to fall back to (`:53`). Six detail heroes call it with `breadcrumbTrail(...)`-produced `items`: `NewsDetailHero.tsx`, `BlogDetailHero.tsx`, `GuideDetailHero.tsx`, `EventDetailHero.tsx`, `CareerDetailHero.tsx`, `ResourceDetailHero.tsx`.
- **Exception, not covered by the guard test**: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx:69-92` implements its own inline `Breadcrumb` component with a hardcoded `Home` JSX text node (`:78`) and hardcoded `Knowledge Hub` link (`:90`) — does not call `breadcrumbTrail`. Documented in-file as intentional (`:61-68`): the visible KB breadcrumb ends at the category and omits the title, while the JSON-LD trail (built separately via `breadcrumbTrail("knowledgeBase", …)`) is `Home › Knowledge Hub › Title` and omits the category (categories have no landing page). Cites `docs/superpowers/plans/2026-06-23-breadcrumb-single-source.md`.

### Configuration

| Value | Read at | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CMS_URL` (default `http://localhost:3000`) | `sitemap.ts:32`, `redirects-cache.ts:13-14` | CMS API base for sitemap doc fetches and the redirects table fetch |
| `NEXT_PUBLIC_SITE_URL` (default `https://www.cleanstart.com`) | `canonical.ts:6` | Base for every absolute URL |
| `ALLOW_INDEXING` (`"1"` = force-allow) | `indexing.ts:52` | Forces `isIndexingAllowed()` true regardless of env/host |
| `VERCEL_ENV` (`"production"` required) | `indexing.ts:53` | Primary indexing gate |
| `NOINDEX_HOSTS` (`[]`) / `NOINDEX_HOST_SUFFIXES` (`[".vercel.app"]`) | `indexing.ts:31-38`, checked at `:54` | Per-host no-index backstop |
| `CSP_ENFORCE` (`"1"` = enforce) | `proxy.ts:45-46` | CSP report-only vs enforce mode |
| `REDIRECT_HIT_SECRET` | `redirects-cache.ts:116` | Optional header sent when POSTing redirect-hit counts to the CMS |
| `FULL_TTL_MS = 60_000`, `ERROR_BACKOFF_MS = 10_000` | `redirects-cache.ts:21-22` | In-process cache TTL / failure backoff |
| `MAX_HOPS = 10`, `FLATTEN_AFTER_HOPS = 3` | `redirect-cycle-guard.ts:4-5` | Redirect-chain cycle/length guard on CMS write |
| `revalidate: 3600` tagged `sitemap:{collection}` | `sitemap.ts:53` | Per-collection ISR cache for sitemap doc fetches |
| `SITEMAP_SELECT` field allow-list | `sitemap.ts:45-47` | Caps CMS response size for sitemap fetches |
| Sitemap pagination cap: 20 pages × 100 rows | `redirects-cache.ts:45` | Hard cap on the CMS redirects-table pager |
| `hasNextPage` limit 1000 per collection | `sitemap.ts:52` | Per-collection doc cap in a single sitemap fetch |

### Coverage — full route inventory

Legend: **S** = static/CMS-listing page, **D** = dynamic `[slug]` detail route, **R** = redirect-only, **A** = API/non-page route.

| Route | Kind | In sitemap? | Governing mechanism |
|---|---|---|---|
| `/` | S | Yes (`:73`) | `STATIC_ROUTES` |
| `/about-us` | S | Yes (`:74`) | `STATIC_ROUTES` |
| `/attack-surface-reduction` | S | Yes (`:75`) | `STATIC_ROUTES` |
| `/blogs` | S (listing) | Yes (`:76`) | `STATIC_ROUTES` |
| `/blogs/[slug]` | D | Yes, per-doc (`:141-143`) | `fetchDocs('blogs', BLOG_FILTER)` + `isIndexable` |
| `/book-a-demo` | S | Yes (`:77`) | `STATIC_ROUTES` |
| `/careers` | S (listing) | Yes (`:78`) | `STATIC_ROUTES` |
| `/careers/:slug` | R | N/A | `next.config.ts:90-93` → `/job/:slug`, 308 |
| `/case-studies` | S (listing) | Yes (`:79`) | `STATIC_ROUTES`; no `case-studies/[slug]` route exists on disk |
| `/clean-libraries` | S | Yes (`:80`) | `STATIC_ROUTES` |
| `/cleansight` | S | Yes (`:81`) | `STATIC_ROUTES` |
| `/cleanstart-images` | S | Yes (`:82`) | `STATIC_ROUTES` |
| `/cleanstart-platform` | S | **No** | Excluded (`:83-85`); `noindex: true` (`cleanstart-platform/page.tsx:25`) |
| `/community` | S | Yes (`:86`) | `STATIC_ROUTES` |
| `/contact-us` | S | Yes (`:87`) | `STATIC_ROUTES` |
| `/deal-registration` | S | Yes (`:88`) | `STATIC_ROUTES` |
| `/email-signatures` | S (listing) | **No** | Not in `STATIC_ROUTES`, no comment; `noindex: true` (`email-signatures/page.tsx:26`), also `Disallow`'d (`robots.ts:47`) |
| `/email-signatures/[slug]` | D (route handler) | No | `email-signatures/[slug]/route.ts`; not in any sitemap fetch list |
| `/event/[slug]` | D | Yes, per-doc (`:154`) | `fetchDocs('events', BLOG_FILTER)` |
| `/events` | S (listing) | Yes (`:89`) | `STATIC_ROUTES` |
| `/events/:slug` | R | N/A | `next.config.ts:86-89` → `/event/:slug`, 308 |
| `/fips` | S | Yes (`:90`) | `STATIC_ROUTES` |
| `/for-ciso` | S | Yes (`:91`) | `STATIC_ROUTES` |
| `/for-developers` | S | Yes (`:92`) | `STATIC_ROUTES` |
| `/guide` | S (listing) | Yes (`:93`) | `STATIC_ROUTES` |
| `/guide/[slug]` | D | Yes, per-doc (`:156`) | `fetchDocs('guides', BLOG_FILTER)` |
| `/guides`, `/guides/:slug*` | R | N/A | `next.config.ts:75-84` → `/guide[/:slug*]`, 308 |
| `/job/[slug]` | D | Yes, per-doc (`:155`) | `fetchDocs('jobs', JOBS_FILTER)` |
| `/knowledge-hub` | R | **No** (`:94-95`) | Redirects via `proxy.ts:39-42,126-132`; page-level dynamic redirect (`knowledge-hub/page.tsx:11-18`) never executes |
| `/knowledge-hub/[slug]` | D | Yes, per-doc (`:135-140`) | `fetchDocs('knowledgeBase', BLOG_FILTER)` |
| `/legal` | R | **No** (`:96-97`) | Redirects via `proxy.ts:39-42,126-132`; page-level dynamic redirect (`legal/page.tsx:10-14`) never executes |
| `/legal/[slug]` | D | Yes, per-doc (`:157`) | `fetchDocs('legalDocuments', BLOG_FILTER)` |
| `/news` | S (listing) | Yes (`:98`) | `STATIC_ROUTES` |
| `/news/[slug]` | D | Yes, per-doc (`:153`) | `fetchDocs('news', NEWS_FILTER)` |
| `/partners` | S | Yes (`:99`) | `STATIC_ROUTES` |
| `/podcast` | S | Yes (`:100`) | `STATIC_ROUTES` |
| `/pricing` | S | **Yes** (`:101`) | `STATIC_ROUTES` — see Contradictions §B1 |
| `/privacy-policy` | S | Yes (`:102`) | `STATIC_ROUTES` |
| `/resource-center` | S (listing) | Yes (`:103`) | `STATIC_ROUTES` |
| `/resources/[slug]` | D | Yes, per-doc (`:144-149`) | `fetchDocs('resources', BLOG_FILTER)` |
| `/roi-calculator` | S | **No** | Not in `STATIC_ROUTES`, no comment; `noindex: true` (`roi-calculator/page.tsx:25`); `docs/web/WEB-PAGES.md` marks 🚧 in-progress |
| `/software-bill-materials` | S | Yes (`:104`) | `STATIC_ROUTES` |
| `/teams` | S | Yes (`:105`) | `STATIC_ROUTES` |
| `/vulnerability-remediation` | S | Yes (`:106`) | `STATIC_ROUTES` |
| `/webinars` | S (listing) | Yes (`:107`) | `STATIC_ROUTES` |
| `/webinars/[slug]` | — | N/A | **Does not exist** on disk; comment at `:71` confirms "not built"; `docs/web/WEB-PAGES.md` states "No detail route by design" |
| `/author/[slug]` | D | Yes, per-doc (`:150-152`) | `fetchDocs('authors', AUTHORS_FILTER)` |
| `/preview/[collection]/[slug]` | D | No | Draft-mode preview only; blocked via `X-Robots-Tag` and `Disallow: /preview/` |
| `/api/*` | A | No | robots.txt does not explicitly disallow `/api/` broadly (only `/api/preview/`) — see UNDETERMINED |
| `/guide-cover/[slug]` | D (image route) | No | OG-image-style route handler, not a page |

Inclusion is governed by two independent code paths: (1) static membership in `STATIC_ROUTES`, and (2) per-document membership in one of the nine `fetchDocs()` collection queries, each additionally requiring `isIndexable(doc)`. A route is excluded when it is a pure redirect with no renderable body, carries `noindex: true`, or has no route at all. Two exclusions (`/email-signatures`, `/roi-calculator`) have no corresponding comment in `sitemap.ts` — only inferable by cross-referencing each page's own `noindex` metadata.

### Tests

- **Untested**: `sitemap.ts` — no `sitemap.test.ts` exists anywhere in the repo. None of `STATIC_ROUTES` membership, the `isIndexable` filter, or per-collection filter strings have unit coverage.
- **Untested**: `redirects-cache.ts` — no `redirects-cache.test.ts` exists. The in-process cache TTL/backoff, pagination cap, and fail-open behavior are unverified.
- **Untested**: `proxy.ts` itself has no dedicated test file; only `stripLegacyPaginationParams` is unit-tested via `legacy-params.test.ts`.
- **Tested**: `indexing.ts` via `indexing.test.ts`; `robots.ts` via `robots.test.ts`; `canonical.ts` via `canonical.test.ts`.
- **Tested (fitness test)**: `breadcrumb-guard.test.ts:36-48` asserts, per file in `HEROES` (6 files) and `PAGES` (9 files), that the source (a) contains the literal substring `breadcrumbTrail(` and (b) does not match `HOME_CRUMB = /(?:label|name):\s*["']Home["']/`. A static-source-text assertion, not a runtime/behavioral test.
  - **Detection-method gap**: `HOME_CRUMB` only matches an object-literal shape. A hardcoded "Home" written as JSX text (exactly `KnowledgeHubArticle.tsx:78`'s shape) would not match this regex even if that file were added to the guarded list.
  - **Coverage gap**: `KnowledgeHubArticle.tsx` is in neither `HEROES` nor `PAGES` — not checked by this guard at all.
- **Tested elsewhere**: `packages/schema/src/builders/breadcrumbs.test.ts` covers `breadcrumbTrail()` itself; `apps/cms/src/payload/lib/jsonld/breadcrumb-guard.test.ts:16-17` runs an analogous static-source check on the CMS-side `dispatch.ts`.
- **CMS-side redirect coverage** (all present): `redirect-cycle-guard.test.ts`, `redirects-record-hit.test.ts`, `redirects-import.test.ts`, `post-launch-redirects-seed.test.ts`, `redirects-seed.test.ts` (webflow-import), `slug-change-redirect.test.ts`.

### Dead or unreachable code

1. **`getWebinarBySlug`** — `apps/web/src/lib/webinars.ts:114-128` defines and exports a cached fetcher for a single webinar by slug. No other reference exists (no `/webinars/[slug]` route, no directory on disk, no other caller). `docs/web/WEB-PAGES.md` documents this as by-design ("No detail route by design (registration is external/in-house form)"), but the fetcher function itself remains unused code.
2. **Knowledge Hub / Legal page-level redirects** — see Contradictions §A2 above for the full mechanism; both `knowledge-hub/page.tsx:11-18` and `(legal)/legal/page.tsx:10-14`'s dynamic `permanentRedirect()` logic is unreachable in production because `proxy.ts`'s `SECTION_INDEX_REDIRECTS` always runs first with a hardcoded destination. This means the two redirect targets are two independently-maintained sources of truth that could silently diverge if the underlying CMS ordering changes — only the hardcoded `proxy.ts` value would take effect.
3. **`/api/jsonld` CMS dispatcher** (`apps/cms/src/payload/endpoints/jsonld.ts`, `apps/cms/src/payload/lib/jsonld/dispatch.ts`) — a repo-wide search for `api/jsonld` outside the CMS package finds only `SchemaPreviewField.tsx` (admin preview UI) and the CMS's own tests/docs. `apps/web` never calls this endpoint — every web page builds its own JSON-LD in-process. See the Structured Data domain section for the full picture.

---

## On-Page Metadata

Scope: `apps/web` title/description composition, canonical, OG/Twitter, robots meta, and the CMS→page JSON-LD hookup as it relates to metadata.

### Mechanisms

**Title / description composition**
- `buildPageMetadata()` — `apps/web/src/lib/seo/canonical.ts:80-179` — the single function nearly every route calls to build a Next.js `Metadata` object. Inputs: `title`, `description`, `path`, optional `image`, `type`, `publishedTime`/`modifiedTime`/`authors`, `noindex`/`nofollow`, `canonicalUrl`, `variant`/`eyebrow`/`titleAccent`/`ogTitle`.
- Brand-suffix normalization: `stripBrandSuffix()` (`canonical.ts:20-24`) strips a trailing ` | CleanStart` / `- CleanStart` / `– CleanStart` / `— CleanStart` / `: CleanStart` (regex `:12`) from `title` before the root-layout `%s | CleanStart` template is applied, so legacy Webflow-imported titles that already carry the brand don't get doubled. Idempotent — loops until no suffix remains (`:22`). Never reduces a bare `"CleanStart"` title to empty (`:23`, tested at `canonical.test.ts:57-59`).
- `absoluteTitle: true` bypasses the layout `%s | CleanStart` template entirely — the caller's `title` becomes the literal `<title>` via `{ absolute: title }` (`:129`). Used by 15 of the 24 top-level static pages.
- Detail routes (blog/news/event/job/guide/resource/knowledge-hub/legal/privacy-policy) resolve title/description with `seo.title ?? <cms-field>` / `seo.description ?? <cms-field> ?? <hardcoded fallback string>` where `seo` comes from `resolveCmsSeo()`, e.g. `blogs/[slug]/page.tsx:73-77`.

**Canonical**
- Self-canonical: `alternates: { canonical: path }` (`:125,131`) — `path` is the route argument, always relative.
- Override: `canonicalUrl` param replaces it when set (`:125-126`), fed from CMS `seo.canonicalOverride` only when `seo.useCustomCanonical` is also true (`cms-seo.ts:68-70`).
- Listing pages always canonical to the clean `basePath`, never a `?page=`/`?category=`/`?q=` variant — rationale at `:195-206` (client-side pagination renders identical static HTML per variant).

**OG / Twitter**
- `openGraph` block built at `canonical.ts:132-154`; `twitter` block at `:155-160`. Both share one `ogImage` value.
- `ogImage` resolution order (`:112-124`): explicit `image` param (CMS/editor image or page-specific hero) **wins**; otherwise a dynamically generated card via `ogImageUrl()` (`og.ts:19-27`) pointing at `${SITE_URL}/api/og?...` with `title`/`variant`/`eyebrow`/`titleAccent`(as `accent`)/`description`(as `sub`) query params, each clamped (`og.ts:6,21-25`: title≤200, eyebrow≤40, accent≤120, sub≤160 chars).
- `og:image:width/height` default to 1200×630 (`canonical.ts:120-121`, `og.ts:3-4`) unless the explicit `image` carries its own dimensions.
- Twitter card is always `summary_large_image` (`:156`); no per-page override exists.
- `/api/og` route (`apps/web/src/app/api/og/route.tsx:30-115`, edge runtime `:5`) renders the actual PNG via `next/og` `ImageResponse`: reads/re-clamps params server-side (`:33-36`, same limits as `og.ts`), splits a trailing accent phrase for gradient styling (`splitTitleAccent()`, `render.ts:22-27`), picks a font size (`pickTitleSize()`, `render.ts:3-9`), returns a 1200×630 image cached `public, immutable, max-age=31536000` (`:112`).

**Robots meta / indexing gate**
- `robots` field in `buildPageMetadata()` (`:161-177`) driven by `isIndexingAllowed()` — blocked unless `ALLOW_INDEXING=1` or `VERCEL_ENV === "production"`. Per-page `noindex`/`nofollow` params combine with the global gate: a page-level `noindex` still emits `follow` unless `nofollow` is also set or the gate itself blocked the page (`:100-105`).

**JSON-LD (CMS→page path)**
- `buildPageGraph()` (`apps/web/src/lib/seo/compose-page.ts:19-21`) composes per-page Layer-1 `nodes` with an `override` (raw editor JSON from `doc.seo.additionalSchema`) via `composeGraph()` from `@cleanstart/schema`.
- `getPageGraph()` (`:33-52`) is the STATIC/LISTING-route variant: fetches a `pageRegistry` row via `getRegistryEntry()` (`apps/web/src/lib/page-registry.ts:36-53`) and auto-emits a `WebPage`-family node when `webPageType !== "none"`.
- `seoOverride()` (`:59-64`) extracts `doc.seo.additionalSchema` from a raw CMS `seo` object for detail routes.

### Configuration

| Value | Default | Source (file:line) |
|---|---|---|
| `SITE_URL` | `https://www.cleanstart.com` | `canonical.ts:5` reads `NEXT_PUBLIC_SITE_URL` |
| `SITE_NAME` | `"CleanStart"` | `canonical.ts:6` (hardcoded constant, not env) |
| Title template | `"%s \| CleanStart"` | `layout.tsx:83` — overridden by CMS `seoDefaults.defaultTitleTemplate` (`:80-83`); em/en-dash normalized to `\|` (`:81-83`) |
| Home `<title>` fallback | `"Verified & Secure Container Images \| CleanStart"` | `layout.tsx:73` (`TITLE` const) — only used if `getSeoDefaults()` fails; see the home-page dual-metadata note in Contradictions §D |
| Home description fallback | hardcoded string | `layout.tsx:74-75` (`DESCRIPTION` const), overridden by `seoDefaults.defaultDescription` (`:89`) |
| Home OG image fallback | `ogImageUrl({variant:"hero", ...})` | `layout.tsx:77-82` (`HOME_OG`), overridden by `seoDefaults.defaultOgImage.url` (`:90`) |
| `google-site-verification` | CMS `seoDefaults.verification.google`, else `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | `seo-defaults.ts:232`, called from `layout.tsx:100` via `verificationFromDefaults(d, allowIndexing)` — gated so it never emits on a non-indexable build (`:230`) |
| `msvalidate.01` (Bing) | CMS `seoDefaults.verification.bing` | `seo-defaults.ts:235-236` |
| `p:domain_verify` (Pinterest) | CMS `seoDefaults.verification.pinterest` | `seo-defaults.ts:237-238` |
| `facebook-domain-verification` | CMS `seoDefaults.verification.facebookDomain` | `seo-defaults.ts:239-240` |
| `twitter:site` handle | CMS `seoDefaults.twitterHandle` | `layout.tsx:91,126` — only set on the root layout's own `twitter` block; not read by `buildPageMetadata()` |
| Indexing gate | `ALLOW_INDEXING=1` escape hatch; else `VERCEL_ENV==="production"` | `indexing.ts:52-53` |
| Noindex host suffixes | `[".vercel.app"]` | `indexing.ts:34` |
| Noindex exact hosts | `[]` (emptied 2026-07-29, `staging.cleanstart.com` removed) | `indexing.ts:31` |
| OG image dimensions | 1200×630 | `og.ts:3-4`; re-declared inline at `canonical.ts:120-121` and `route.tsx:7-8` (three separate literals, not a shared import) |
| OG param clamp lengths | title 200 / eyebrow 40 / accent 120 / sub 160 | `og.ts:6` — independently re-clamped in the route handler at `route.tsx:33-36` with the same literal numbers |

### Coverage — per route

Legend: **Static** = hardcoded title/description constant in the page file. **CMS** = pulled from a Payload collection via `resolveCmsSeo()`/direct fields. **Redirect** = no metadata of its own.

| Route | metadata source | file:line | CMS-driven? |
|---|---|---|---|
| `/` (home) | Both `export const metadata` in `page.tsx:53-61` AND `generateMetadata()` in root `layout.tsx:87-131` target `/` | `page.tsx:53-61`, `layout.tsx:87-131` | Partial — see Contradictions §D |
| `/about-us` | Static | `about-us/page.tsx:16-22` | No |
| `/attack-surface-reduction` | Static | `:15-22` | No |
| `/author/[slug]` | Built from CMS author fields directly (`name`,`role`,`bioShort`,`photo`) — **does not call `resolveCmsSeo`** | `author/[slug]/page.tsx:35-71` | Partial (base fields yes, `seo.*` override no) |
| `/blogs` | Static | `blogs/page.tsx:15-20` | No |
| `/blogs/[slug]` | CMS via `resolveCmsSeo(post.seo)` | `blogs/[slug]/page.tsx:57-98` | Yes |
| `/book-a-demo` | Static | `:13-18` | No |
| `/careers` | Static | `:16-21` | No |
| `/case-studies` | Static | `:19-24` | No |
| `/clean-libraries` | Static | `:23-31` | No |
| `/cleansight` | Static | `:15-25` | No |
| `/cleanstart-images` | Static | `:17-27` | No |
| `/cleanstart-platform` | Static, `noindex: true` | `:14-26` | No |
| `/community` | Static | `:13-18` | No |
| `/contact-us` | Static | `:13-19` | No |
| `/deal-registration` | Static | `:12-17` | No |
| `/email-signatures` | Static, `noindex+nofollow` | `:20-28` | No |
| `/event/[slug]` | CMS via `resolveCmsSeo(event.seo)` | `event/[slug]/page.tsx:39-79` | Yes |
| `/events` | Static | `:25-31` | No |
| `/fips` | Static | `:15-22` | No |
| `/for-ciso` | Static | `:15-22` | No |
| `/for-developers` | Static | `:15-22` | No |
| `/guide` | Static | `:15-20` | No |
| `/guide/[slug]` | CMS via `resolveCmsSeo(guide.seo)` | `guide/[slug]/page.tsx:54-95` | Yes |
| `/job/[slug]` | CMS via `resolveCmsSeo(job.seo)` | `job/[slug]/page.tsx:49-86` | Yes |
| `/knowledge-hub` | **Redirect** — no metadata export | `knowledge-hub/page.tsx:1-18` | N/A |
| `(legal)/legal` | **Redirect** — no metadata export | `(legal)/legal/page.tsx:1-15` | N/A |
| `(legal)/legal/[slug]` | CMS via `resolveCmsSeo(doc.seo)` | `(legal)/legal/[slug]/page.tsx:33-55` | Yes |
| `/privacy-policy` | CMS via `resolveCmsSeo(doc.seo)` (fixed slug) | `(legal)/privacy-policy/page.tsx:34-54` | Yes |
| `/news` | Static | `:15-20` | No |
| `/news/[slug]` | CMS via `resolveCmsSeo(item.seo)` | `news/[slug]/page.tsx:40-80` | Yes |
| `/partners` | Static | `:14-20` | No |
| `/podcast` | Static (`PODCAST_TITLE`/`PODCAST_DESCRIPTION`) | `:72-78` | No |
| `/preview/[collection]/[slug]` | Static, `noindex+nofollow`, `nocache` | `:14-17` | No |
| `/pricing` | Static | `:12-18` | No |
| `/resource-center` | Static | `:17-23` | No |
| `/resources/[slug]` | CMS via `resolveCmsSeo(resource.seo)` | `resources/[slug]/page.tsx:45-84` | Yes |
| `/roi-calculator` | Static, `noindex+nofollow` | `:14-27` | No |
| `/software-bill-materials` | Static | `:15-21` | No |
| `/teams` | Static | `:14-19` | No |
| `/vulnerability-remediation` | Static | `:16-23` | No |
| `/webinars` | Static | `:18-24` | No |

**On the "eleven page.tsx export neither metadata nor generateMetadata" premise:** verified false for 9 of 11 named routes by direct grep + read. `events/page.tsx:29-31`, `blogs/page.tsx:19-20`, `careers/page.tsx:20-21`, `news/page.tsx:19-20`, `podcast/page.tsx:72-78`, `webinars/page.tsx:22-24`, `guide/page.tsx:19-20`, `case-studies/page.tsx:23-24`, `resource-center/page.tsx:21-22` **all export `generateMetadata()`**, each calling `buildListingMetadata()` with a hardcoded `TITLE`/`DESCRIPTION` constant and `basePath` — the same `buildPageMetadata()` path everything else uses. Only 2 of the 11 named routes actually export neither: `knowledge-hub/page.tsx` and `(legal)/legal/page.tsx` — both pure `permanentRedirect()` handlers with no rendered content; the redirect target is what actually serves metadata via HTTP 308 before any `<head>` is emitted for the index URL.

**Home page (`/`) title conflict** — see Contradictions §D for the full mechanism and the open UNDETERMINED. Field-by-field: `title` — page.tsx's `{ absolute: "..." }` (`page.tsx:54-55`) wins over layout's CMS-driven `{ default: TITLE, template }` (`layout.tsx:99`). `description`/`openGraph`/`twitter` — page.tsx's values win for fields both define. `verification` — **only** set by the layout (`:100`); page.tsx does not set this key.

### Tests

Files present in `apps/web/src/lib/seo/`: `breadcrumb-guard.test.ts`, `canonical.test.ts`, `compose-page.test.ts`, `indexing.test.ts`, `legacy-params.test.ts`, `og.test.ts`, `robots.test.ts`, `verification.test.ts`.

Covered: `stripBrandSuffix()`/`buildPageMetadata()`'s OG-image/title-brand behavior (`canonical.test.ts:1-74`); `buildPageGraph()`/`seoOverride()` composition + CMS-outage fallback (`compose-page.test.ts:1-51`); `ogImageUrl()` param encoding/clamping (`og.test.ts:1-38`); `isIndexingAllowed()`/`isNoindexHost()` (`indexing.test.ts:1-52`); `siteVerification()` — the **dead** function, see Contradictions §B2 (`verification.test.ts:1-28`); `buildRobotsTxt()` (`robots.test.ts`); breadcrumb single-source fitness test (`breadcrumb-guard.test.ts:1-48`).

Not covered (no test file exists, verified by directory listing):
- `cms-seo.ts` — `resolveCmsSeo()` has **zero** unit tests.
- `seo-defaults.ts` — `getSeoDefaults()`, `orgConfigFromDefaults()`, `webSiteConfigFromDefaults()`, `verificationFromDefaults()` have **zero** unit tests.
- No per-route test asserts what `generateMetadata()` actually returns for any of the ~39 `page.tsx` files.
- `/api/og/route.tsx`'s `GET` handler itself has no test; only its two pure helpers (`pickTitleSize`, `splitTitleAccent`) are tested via `render.test.ts`.

### Dead or unreachable code

- **`siteVerification()` — `apps/web/src/lib/seo/verification.ts:19-23` — dead at runtime.** See Contradictions §B2 for the full docstring-contradiction detail. Only referenced by its own definition and its own test file (`verification.test.ts:2,11,16,21,26`).
- **Triplicated OG dimension literals.** `1200`/`630` appears as its own literal in three places with no import graph tying them together: `og.ts:3-4` (`OG_IMAGE_WIDTH`/`HEIGHT`, exported but only consumed by `og.test.ts:36`), `canonical.ts:120-121` (inline fallback numbers), and `route.tsx:7-8` (`WIDTH`/`HEIGHT` consts).
- **OG param clamp lengths duplicated, not shared.** `MAX` in `og.ts:6` and the re-clamp in `route.tsx:33-36` use the same numbers as separate literals — no shared constant/import.
- **`cms-seo.ts`'s documented-but-unwired CMS `seo.*` fields.** The file's own header comment (`:6-14`) states the CMS `seo` group has more fields than `resolveCmsSeo()` consumes: `robotsAdvanced`, `alternates` (hreflang), `customTags`, and advanced twitter/og fields are explicitly named as NOT wired, with the stated reason that the composition helpers `composeRobotsMeta`/`composeHreflangCluster`/`composeCustomTags` "do not exist in apps/web yet" — confirmed, no file matching those three names exists under `apps/web/src`. `additionalSchema` is separately handled (via `seoOverride()`/`getRegistryEntry()`, JSON-LD path) rather than genuinely dead — see Contradictions §A3 for how this relates to the schema audit's finding on the same file.

### Question 1 — routes: own metadata vs. fallback, and what the fallback produces

- 30 routes supply their own title/description as a hardcoded string constant through `buildPageMetadata()`/`buildListingMetadata()` — nothing reads a CMS default; each has its own hardcoded pair (no shared site-wide fallback across static pages).
- 9 detail routes (`blogs/[slug]`, `news/[slug]`, `event/[slug]`, `job/[slug]`, `guide/[slug]`, `resources/[slug]`, `knowledge-hub/[slug]`, `(legal)/legal/[slug]`, `/privacy-policy`) resolve `seo.title ?? <cms base-content field>` and `seo.description ?? <cms base-content field> ?? <hardcoded string>` per document via `resolveCmsSeo()`. When the CMS document can't be found, each falls back to a route-specific hardcoded `{title, description}` pair with `noindex: true` (e.g. `blogs/[slug]/page.tsx:61-66`).
- `author/[slug]` builds title/description directly from CMS author fields without going through `resolveCmsSeo()` — an author's own `seo.*` override (if any) is never applied.
- The 2 index-redirect routes (`knowledge-hub`, `(legal)/legal`) emit no metadata of their own — the "distinct, on-topic titles" observed live for these two paths belong to whatever slug the `permanentRedirect()` lands on, not to the index path.
- The site-wide root `<title>` template (`"%s | CleanStart"`, overridable by CMS `seoDefaults.defaultTitleTemplate`) only applies to pages that do **not** set `absoluteTitle: true`. All static pages set it except: `/` (sets it too), `/community`, `/cleanstart-platform`, `/teams`, `/podcast` — these last four use the template (bare-string `title`, template-appended).

### Question 2 — do CMS `seo.*` fields reach the page, and by what path

Yes, for the 9 detail routes and `/privacy-policy` above. Path: `resolveCmsSeo(doc.seo, { absolutize: mediaUrl })` (`cms-seo.ts:52-85`) is called with the raw `seo` object from the CMS document fetch, returning `{title?, description?, image?, noindex?, nofollow?, canonicalUrl?}`; each route spreads/`??`-falls-back these onto `buildPageMetadata()`'s params. Consumed CMS fields (`cms-seo.ts:25-34`): `seo.title`, `seo.description`, `seo.indexable`, `seo.ogImage` (+`alt`), `seo.useCustomCanonical` + `seo.canonicalOverride`.

Fields the CMS `seo` group has that are **not** reached by any code in `apps/web`: `robotsAdvanced`, `alternates` (hreflang), `customTags`, advanced twitter/og fields. `seo.additionalSchema` is reached, but only by the JSON-LD path (`compose-page.ts:59-64` `seoOverride()`), not the `<title>`/`<meta description>` path.

For the 30 static pages and the 2 redirect-index pages, no CMS `seo.*` fields are read at all. The site-wide `seoDefaults` global (org/verification/OG defaults, not per-page `seo.*`) reaches only the root layout and, for JSON-LD, the Organization/WebSite nodes — a separate CMS surface from the per-document `seo` group covered by `cms-seo.ts`.

---

## Structured Data (JSON-LD / Schema)

Scope: `packages/schema/**`, `apps/web/src/lib/seo/jsonld.tsx`, `apps/web/src/components/JsonLdGraph.tsx`, and the CMS-side JSON-LD generation (`apps/cms/src/payload/lib/jsonld/**`, `apps/cms/src/payload/endpoints/jsonld.ts`, `apps/cms/src/payload/endpoints/page-live-schema.ts`, `apps/cms/src/payload/admin/components/SchemaManager/**`, `SchemaPreviewField.tsx`).

### The two-systems question — resolved finding

**The suspicion that `packages/schema` is dead is false; the suspicion that the CMS's own dispatch engine never reaches production is true. These are two different things and the original brief conflated them:**

1. **`packages/schema` (builders/compose/validate) is live and shared.** Both `apps/web` (via `@/lib/seo/jsonld` and `@/lib/seo/compose-page.ts` shims) and `apps/cms` (via `apps/cms/src/payload/lib/jsonld/dispatch.ts:1` importing `breadcrumbTrail` from `@cleanstart/schema/builders`, and `compose.ts`/`override-validator.ts` re-exporting `@cleanstart/schema/compose` and `@cleanstart/schema/validate`) import from it. `apps/cms/package.json:27` also lists it as a workspace dependency. Grep confirms `apps/web` imports `@cleanstart/schema` extensively — `layout.tsx:18`, `JsonLdGraph.tsx:1`, six hero components' `breadcrumbTrail` imports, `page-registry.ts:1`, `jsonld.tsx:8` (`export * from "@cleanstart/schema/builders"`), `seo-defaults.ts:3`, `compose-page.ts:1`.
2. **`apps/cms`'s own three-layer *dispatcher* (`dispatch.ts` → `buildJsonLdBlobs`, Layer 1 auto + Layer 2 `schemaAddons` + Layer 3 `additionalSchema`) is NOT what reaches a live page.** It is exposed only via `apps/cms/src/payload/endpoints/jsonld.ts` (`GET`/`POST /api/jsonld/:collection/:id`), and the only callers of that endpoint anywhere in the repo are `SchemaPreviewField.tsx:214` (the CMS admin's own "Schema (JSON-LD)" sidebar preview card) and CMS e2e tests (`smoke.spec.ts:117-138`, `publishing.spec.ts:63-73`). `grep -rn "api/jsonld" apps/web/src` returns **zero matches**.
3. **Confirmed explicitly in the CMS's own code comment**, `apps/cms/src/payload/endpoints/page-live-schema.ts:6-13`: "after the Phase-0 unification, a page's auto schema (breadcrumb, FAQ, SoftwareApplication, …) is composed in apps/web at build time — **the CMS does not recompute it**. So we read what the live page actually ships." That endpoint (`GET /api/pageRegistry/live-schema?path=...`, registered at `PageRegistry.ts:88`) fetches the *rendered HTML* of the live `apps/web` page and regex-extracts its `<script type="application/ld+json">` blocks — i.e., the CMS had to build a scraper to know what schema is actually live, because its own dispatcher's output is not what ships.

So: two independent *orchestration* code paths exist, and `apps/web` never calls the CMS dispatcher/endpoint. But they are not fully disconnected — both are built on the same shared `packages/schema` primitives, and both read/write the same `seo.additionalSchema` (Tier-3 override) database field. `packages/schema` itself is not dead; the CMS's own dispatch/addons layer is dead in the sense that its output never reaches a production page.

### Mechanisms — how the LIVE JSON-LD is built (apps/web)

- **Root-level graph**: `apps/web/src/app/layout.tsx:150-157` composes a site-wide graph once per build: `composeGraph({ auto: [organizationSchema(...), webSiteSchema(...)], override: seoDefaults?.additionalSchema })`, rendered via `<JsonLdGraph id="site-jsonld" graph={siteGraph} />` (`:189`).
- **`composeGraph`** (`packages/schema/src/compose/compose-graph.ts:30-42`): takes `{auto, addonNodes?, override?}`, strips any per-node `@context` (`:12-16`), validates `override` with `validateOverride`, and if valid, merges it in with `mergeByType` (per-`@type` replace/append, `merge.ts:14-26`); then dedupes by `@id` (`merge.ts:33-49`, last value wins, first position kept). Output shape: `{ "@context": "https://schema.org", "@graph": [...] }`.
- **`@id` strategy**: stable IDs — `${SITE_URL}/#organization` and `${SITE_URL}/#website` (`jsonld.tsx:29-30`), `${url}#webpage` for WebPage nodes (`:268`), `${url}#series` for PodcastSeries (`:730`). Other nodes reference these via `{ "@id": ... }` pointers.
- **Per-detail-route composition**: `apps/web/src/lib/seo/compose-page.ts` exposes two entry points: `buildPageGraph({nodes, override})` (`:19-21`, used by detail pages) where `override` comes from `seoOverride(doc.seo)` (`:59-64`); `getPageGraph(path, nodes, opts)` (`:33-52`, used by static/listing routes) which fetches `getRegistryEntry(path)` (`page-registry.ts:36-53`, `GET /api/pageRegistry?where[path][equals]=...`), conditionally prepends a `webPageSchema(...)` node keyed by the CMS-set `webPageType`, then calls `composeGraph`.
- **Rendering**: `apps/web/src/components/JsonLdGraph.tsx:17-27` emits exactly one `<script type="application/ld+json">` per call, `JSON.stringify`'d with `<` escaped (XSS-in-JSON-LD guard).
- **Entity types emitted** (via the `@/lib/seo/jsonld` shim): `Organization`/`NewsMediaOrganization`, `WebSite`, `WebPage` + variants (`AboutPage`, `ContactPage`, `CollectionPage`, `ProfilePage`), `BreadcrumbList`, `BlogPosting`, `Article`, `NewsArticle`, `Event`, `FAQPage`, `SoftwareApplication`, `JobPosting`, `VideoObject`, `PodcastSeries`, `ItemList`, `ProfilePage`+`Person`.
- **Two rendering generations coexist in `apps/web`** — the shim's own comment (`jsonld.tsx:3-6`) says "keep this re-export until they migrate to the single-@graph compose path (Task 0.5)":
  - **Unified `@graph` path** (`JsonLdGraph` + `buildPageGraph`/`getPageGraph`): 29 of 43 `page.tsx` files — `layout.tsx`, home `page.tsx`, `about-us`, `attack-surface-reduction`, `blogs/[slug]`, `book-a-demo`, `cleansight`, `clean-libraries`, `cleanstart-images`, `cleanstart-platform`, `community`, `contact-us`, `deal-registration`, `event/[slug]`, `fips`, `for-ciso`, `for-developers`, `guide/[slug]`, `job/[slug]`, `knowledge-hub/[slug]`, `news/[slug]`, `partners`, `pricing`, `privacy-policy`, `resources/[slug]`, `roi-calculator`, `software-bill-materials`, `teams`, `vulnerability-remediation`, `author/[slug]`.
  - **Legacy multi-`<script>` path** (raw `<JsonLd data={...}>` calls, one script per schema type): 10 files — `blogs/page.tsx`, `guide/page.tsx`, `webinars/page.tsx`, `case-studies/page.tsx`, `careers/page.tsx`, `news/page.tsx`, `resource-center/page.tsx`, `podcast/page.tsx`, `events/page.tsx`, `(legal)/legal/[slug]/page.tsx`.
  - **No JSON-LD at all** (4 files, all explained): `(legal)/legal/page.tsx` and `knowledge-hub/page.tsx` are `permanentRedirect`s with no rendered body; `email-signatures/page.tsx` is `noindex:true` (also robots.txt disallow + `X-Robots-Tag`); `preview/[collection]/[slug]/page.tsx` is `robots:{index:false,follow:false,nocache:true}` and reuses the detail routes' own `render*Detail` functions (already includes their JsonLdGraph).

### Configuration

| Value | Read at | Notes |
|---|---|---|
| `SITE_URL` | `packages/schema/src/builders/site.ts:8` — `NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com"` | Comment states it "mirrors ... `canonical.ts` byte-for-byte (same env var, same fallback)". |
| `SITE_URL` (web canonical) | `apps/web/src/lib/seo/canonical.ts` (imported by `layout.tsx:19` as `SITE_URL`) | Referenced as the byte-for-byte mirror target in `site.ts`. |
| `SITE_NAME` | `packages/schema/src/builders/site.ts:9` — hardcoded `"CleanStart"` | No env override. |
| Organization/News fields | `apps/web/src/lib/seo/seo-defaults.ts` → `orgConfigFromDefaults()`, consumed at `layout.tsx:153` | Sourced from CMS `seoDefaults` global; falls back to hardcoded defaults in `organizationSchema()` (`jsonld.tsx:151-212`) if CMS is unreachable. |
| Site-wide `additionalSchema` override | `layout.tsx:156` — `seoDefaults?.additionalSchema` | From CMS `seoDefaults` global. |
| Per-doc `additionalSchema` override (Tier 3) | `apps/cms/src/payload/fields/seo.ts:374-408` (`additionalSchemaField`) | `access.read: () => true` (public) — comment (`:377-387`) states this is intentional so the anonymous web build/ISR fetch can read it. Consumed via `seoOverride()` from 7 detail routes: `guide/[slug]/page.tsx:158`, `blogs/[slug]/page.tsx:174`, `knowledge-hub/[slug]/page.tsx:112`, `author/[slug]/page.tsx:107`, `resources/[slug]/page.tsx:131`, `news/[slug]/page.tsx:120`, `job/[slug]/page.tsx:171`, `event/[slug]/page.tsx:147`. |
| Per-route `webPageType` / static-route override | `apps/web/src/lib/page-registry.ts:36-53` — `GET /api/pageRegistry?where[path][equals]=<path>&limit=1&depth=0` | Cached at build/ISR time; fails safe to `{webPageType:'none'}` on any error (`:50-52`). |
| `PAGE_REGISTRY` collection config | `apps/cms/src/payload/collections/PageRegistry.ts` | `WEB_PAGE_TYPE_OPTIONS` (`:28-36`): `none`, `WebPage`, `AboutPage`, `ContactPage`, `CollectionPage`, `ProfilePage`. Comment: registry "feeds the web build's per-page JSON-LD composition for static + listing routes"; CMS-detail collections edit schema on the document itself via a `cms-template` row. |
| CMS `/api/jsonld` rate limit | `apps/cms/src/payload/endpoints/jsonld.ts:11-14` — `{perMinute: 20, perDay: 400}` | Applies only to the effectively admin-preview-only endpoint. |
| CMS `/api/jsonld` GET cache | `jsonld.ts:155-157` — `cache-control: public, max-age=60` | N/A to production since nothing fetches it. |

### Coverage — routes → schema types

| Route | Types imported (`@/lib/seo/jsonld`) |
|---|---|
| `blogs/[slug]/page.tsx` | (via `compose-page.ts` + builders — Article/BlogPosting variant, breadcrumb, author Person) |
| `news/[slug]/page.tsx` | `breadcrumbSchema, breadcrumbTrail, newsArticleSchema` |
| `guide/[slug]/page.tsx` | `breadcrumbTrail` + guide-specific builders |
| `job/[slug]/page.tsx` | `breadcrumbSchema, breadcrumbTrail, jobPostingSchema` |
| `event/[slug]/page.tsx` | `breadcrumbSchema, breadcrumbTrail, eventSchema` |
| `author/[slug]/page.tsx` | `breadcrumbSchema, breadcrumbTrail, profilePageSchema` |
| `resources/[slug]/page.tsx`, `knowledge-hub/[slug]/page.tsx` | breadcrumb + WebPage-family builders |
| `cleansight/page.tsx`, `cleanstart-images/page.tsx` | `breadcrumbSchema, softwareApplicationSchema` |
| Most static marketing pages | `breadcrumbSchema` only (+ registry-driven `WebPageVariant` node via `getPageGraph`) |
| `page.tsx` (home) | `faqPageSchema` |
| `podcast/page.tsx` | `JsonLd, breadcrumbSchema, podcastSeriesSchema` (legacy) |
| `webinars/page.tsx` | `JsonLd, breadcrumbSchema, webinarListSchema` (legacy) |
| `case-studies/page.tsx` | `JsonLd, breadcrumbSchema, caseStudyListSchema` (legacy) |
| `blogs/page.tsx`, `guide/page.tsx`, `news/page.tsx`, `events/page.tsx`, `careers/page.tsx`, `resource-center/page.tsx` | `JsonLd, breadcrumbSchema, itemListSchema` (legacy) |
| `(legal)/legal/[slug]/page.tsx` | `JsonLd, breadcrumbSchema, breadcrumbTrail` (legacy) |
| `layout.tsx` (every page) | `organizationSchema, webSiteSchema` site-wide graph |

No route consumes `apps/cms`'s `schemaAddons` field or the `/api/jsonld` dispatcher output.

### Tests

**`packages/schema` (shared primitives) — covered:** `breadcrumbs.test.ts`, `jsonld.test.ts`, `templates.test.ts` (builder output shape); `compose/compose-graph.test.ts` (`composeGraph`/`mergeByType`/`dedupeById`); `validate/override-validator.test.ts`, `rich-result-lint.test.ts` (override validation/allowlist and lint rules); `__tests__/types.test.ts` (type-surface smoke test). **See Contradictions §C — none of these run in CI**, per the measurement audit's independent finding.

**`apps/web` — covered:** `apps/web/src/lib/seo/compose-page.test.ts` — `buildPageGraph`/`seoOverride` (composition is pure, survives CMS outage; override merge-per-`@type`; determinism).

**`apps/web` — NOT covered:** No test file for `JsonLdGraph.tsx` itself (script-tag escaping/rendering), nor for `page-registry.ts`'s `getRegistryEntry` fetch/fallback logic, nor per-page-level schema output. UNDETERMINED whether any Playwright/e2e suite in `apps/web` asserts on rendered `<script type="application/ld+json">` content (see Contradictions §D).

**`apps/cms` — heavily covered, but for code that doesn't reach production:** `dispatch.test.ts` (576 lines), plus per-builder tests: `article.test.ts`, `breadcrumb.test.ts`, `event.test.ts`, `organization.test.ts`, `person.test.ts`, `website.test.ts`, `url.test.ts`, `context.test.ts`, `shared.test.ts`, `filter-override.test.ts`, `override-validator.test.ts`, `override-from-file.test.ts`, `schema-history.test.ts`, `breadcrumb-guard.test.ts`, `topic-areas.test.ts`; `jsonld.test.ts` (endpoint handler tests); `smoke.spec.ts:117-138`, `publishing.spec.ts:63-73` (e2e hits against the live `/api/jsonld` endpoint); `record-schema-history.test.ts`, `schema-override-audit.test.ts` (audit-log side effects). This means the CMS-side dispatcher has the deepest, most thorough test suite in the whole structured-data surface, but its output is consumed only by the CMS's own admin preview UI and its own tests — not by anything a search engine crawler sees.

### Dead or unreachable code

1. **`apps/cms/src/payload/lib/jsonld/dispatch.ts` (`buildJsonLdBlobs`) and everything it composes** (`article.ts`, `event.ts`, `job-posting.ts`, `person.ts`, `web-page.ts`, `website.ts`, `organization.ts`, `faq-page.ts`, `how-to.ts`, `addons/dispatch.ts`, `addons/builders.ts`) — reachable in production **only** through `apps/cms/src/payload/endpoints/jsonld.ts`'s `jsonLdEndpoint`/`jsonLdPreviewEndpoint`, whose only callers are `SchemaPreviewField.tsx:214` and CMS e2e/unit tests.
2. **`schemaAddons` field** (Layer 2 editor blocks: HowTo, VideoObject, Review, SoftwareApplication, manual FAQ, breadcrumb suppress/replace) — defined via `apps/cms/src/payload/fields/schema-addons.ts` and attached to 9 collections (`Blogs.ts:206`, `Guides.ts:201`, `Events.ts:330`, `Jobs.ts:308`, `KnowledgeBase.ts:154`, `News.ts:180`, `Pages.ts:192`, `PodcastEpisodes.ts:237`, `Resources.ts:168`). `grep -rn "schemaAddons" apps/web/src` returns **zero matches**. Net effect: an editor can fill in `schemaAddons` blocks, see them validated and rendered in the CMS's Schema preview sidebar, and they will never appear in the live page's JSON-LD.
3. **Stale/contradictory comment** — see Contradictions §A3/§B for the full detail: `cms-seo.ts:7-10`'s claim that `additionalSchema` is unreachable by an anonymous web fetch is contradicted by its actual public `read: () => true` access and its 7 live call sites.
4. **10 legacy per-schema pages** still call `<JsonLd data={...}>` directly rather than `JsonLdGraph`/`buildPageGraph`/`getPageGraph` — not dead (they render live, valid JSON-LD), but a second, unmigrated code path per the shim's own "Task 0.5" comment; UNDETERMINED whether that task is tracked anywhere beyond the comment (see Contradictions §D).
5. **`apps/cms/src/payload/endpoints/jsonld.ts`'s `GET` handler doc-comment** (`:73-81`) claims it is "Used by the public renderer (or any external consumer)" — see Contradictions §B4: no code in this repo is such a consumer today.

---

## AEO / GEO (AI Search / LLM Crawler Access)

Scope: how AI search / LLM-crawler access to the site is governed in code.

### Mechanisms

**1. `llms.txt`**
- File: `apps/web/public/llms.txt` (37 lines). Markdown-format site index (H1 + summary + linked sections: Product Pages, Solutions by Role, Company, Resources, Legal & Trust).
- **Provenance: static, hand-authored.** No generator found. `git log --follow -- apps/web/public/llms.txt` shows exactly one commit (`80d313f4`, "add FAQ schema support, update map visualization styles, and improve SEO metadata management") — added alongside unrelated SEO work, never touched since. No script in `apps/web/package.json` references it. No occurrence of the string `llms.txt` anywhere under `apps/web/src` — not linked from any page, layout, metadata export, or sitemap, and nothing rewrites/serves it dynamically. See Contradictions §B3 for the stale doc claiming it doesn't exist.

**2. robots.txt + Content Signals**
- Built by `apps/web/src/lib/seo/robots.ts`, served by `apps/web/src/app/robots.txt/route.ts:1-13` (plain-text `GET` handler, not Next's `MetadataRoute.Robots`, because per `robots.ts:20-21` the metadata-route type cannot emit the non-standard `Content-Signal` directive).
- `buildRobotsTxt({ indexable })` (`robots.ts:22-61`): `indexable: false` → `Content-Signal: search=no, ai-input=no, ai-train=no` and `Disallow: /` for `User-Agent: *` (`:23-30`). `indexable: true` → preamble comment (`:11-15,36`), then for `User-Agent: *`: `Content-Signal: search=yes, ai-input=yes, ai-train=yes` (constant `CONTENT_SIGNALS`, `:9`), `Allow: /`, `Disallow: /preview/`, `Disallow: /api/preview/`, `Disallow: /email-signatures`, `Disallow: /*_rsc=` (`:38-52`).
- A second, separate group `User-Agent: Bytespider` / `Disallow: /` (`:54-55`), described as "symbolic" since Bytespider ignores robots.txt — the real block is a Vercel Firewall rule outside this repo.
- Ends with `Host:`/`Sitemap:` lines built from `SITE_URL` (`:57-58`).
- No other named crawler user-agent strings (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.) appear anywhere in `apps/web/src` or `apps/web/public` — confirmed by `git grep` for each name against those paths, zero hits. The "allow all AI crawlers" policy is implemented purely as the wildcard `Content-Signal` + `Allow: /` group; per-bot names exist only as prose in `docs/web/WEB-PRODUCTION.md:424-425`, not in code.

**3. Agent-discovery `Link` header + `.well-known/api-catalog`**
- Single source of truth: `apps/web/src/lib/security/agent-discovery.ts`. `API_CATALOG_PATH = "/.well-known/api-catalog"` (`:21`). `API_CATALOG_CONTENT_TYPE = "application/linkset+json"` (`:24`).
- `AGENT_DISCOVERY_LINK_HEADER` (`:40-44`) — three comma-joined RFC 8288 relations: `<${API_CATALOG_PATH}>; rel="api-catalog"; type="application/linkset+json"`; `<${SITEMAP_PATH}>; rel="sitemap"; type="application/xml"` (`SITEMAP_PATH = "/sitemap.xml"`, `:31`); `<${SEARCH_API_PATH}>; rel="service-desc"; type="application/json"` (`SEARCH_API_PATH = "/api/search"`, `:32`).
- `API_CATALOG` object (`:61-88`) — the RFC 9264 linkset body, anchored at `/`, with three relation arrays: `service-desc` → `/api/search`, `status` → `/api/health` (`HEALTH_API_PATH`, `:33`), `sitemap` → `/sitemap.xml`.
- The header is appended (not set) to every non-`/api/` HTML response in `proxy.ts:243-248` (`response.headers.append("Link", AGENT_DISCOVERY_LINK_HEADER)`, guarded by `if (!nextUrl.pathname.startsWith("/api/"))`), also appends `Vary: Accept` in the same block.
- Static catalog body: `apps/web/public/.well-known/api-catalog` (JSON, 28 lines) — asserted byte-for-byte equal to `API_CATALOG` by a test. Its `Content-Type` is overridden from the default static-file type to `application/linkset+json` by a `headers()` rule in `apps/web/next.config.ts:45-61` (also sets `Cache-Control: public, max-age=3600, must-revalidate`).
- Other `.well-known/` file found: `apps/web/public/.well-known/security.txt` (RFC 9116 contact/Expires/Preferred-Languages/Canonical fields) — unrelated to AEO/GEO, no code references it beyond being a static file.

**4. Markdown content negotiation (`Accept: text/markdown`)**
- `apps/web/src/lib/agent-markdown.ts`: `acceptsMarkdown(accept)` (`:31-44`) — true only when an `Accept` entry's media type is exactly `text/markdown` (case-insensitive) with `q` absent or `q>0`; `text/*` and `*/*` never match. `htmlToMarkdown(html)` (`:75-84`) — extracts `<title>`, scopes conversion to `<main>` if present else `<body>` else the raw input, converts via `node-html-markdown` (configured to ignore `script/style/noscript/iframe/svg/template`, `:46-50`), prefixes the markdown with `# <title>`. `estimateMarkdownTokens(markdown)` (`:91-93`) — `Math.ceil(length / 4)`. Header name constants: `MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8"` (`:15`), `MARKDOWN_TOKENS_HEADER = "x-markdown-tokens"` (`:16`), `MARKDOWN_INTERNAL_HEADER = "x-agent-markdown-internal"` (`:18`), `MARKDOWN_PATH_HEADER = "x-agent-markdown-path"` (`:24`).
- Middleware wiring, `proxy.ts:164-187`: `wantsMarkdown` is true when method is `GET`, not a `/preview/`-or-`/api/preview/` path, the request doesn't already carry `MARKDOWN_INTERNAL_HEADER`, `acceptsMarkdown(headers.get("accept"))` is true, and the path does not start with `/api/` (`:168-173`). If true, the response is `NextResponse.rewrite("/api/markdown", …)` carrying the original `pathname+search` via `MARKDOWN_PATH_HEADER` (query params don't survive a middleware rewrite into the handler's `nextUrl`, `:176-178`); otherwise `NextResponse.next()` (`:181-187`).
- Converter route: `apps/web/src/app/api/markdown/route.ts`: reads path from `MARKDOWN_PATH_HEADER` then `?path=` then `/` (`:31-34`); rejects paths not starting with `/`, starting with `//`, or containing `\` (`:35-40`, same-origin-only guard); self-fetches the target with `Accept: text/html` + `MARKDOWN_INTERNAL_HEADER: "1"` (no loop) and the original `user-agent` forwarded, `redirect: "follow"`, 10s timeout (`FETCH_TIMEOUT_MS = 10_000`, `:15`), `cache: "no-store"` (`:52-63`); returns 400/502/406/upstream-status on failure paths; on success returns converted markdown with `Content-Type: text/markdown; charset=utf-8`, `x-markdown-tokens`, `Cache-Control: public, max-age=300, must-revalidate`, `Vary: Accept` (`:81-89`).
- This is the only "varies by request header" logic found (`Accept`-keyed, not User-Agent-keyed).

**DNS-level mechanism (out of repo, documented only)**
- `docs/web/WEB-PRODUCTION.md:115-126` documents `_index._agents.cleanstart.com` `HTTPS`/`SVCB` records (DNS-AID draft, RFC 9460 format) pointing agents at `www.cleanstart.com`, stated as "PUBLISHED 2026-06-10" in the Cloudflare zone. DNS-zone configuration, not present as code — see Contradictions §D.

### Configuration

| Value | Read at | Meaning |
|---|---|---|
| `CONTENT_SIGNALS = "search=yes, ai-input=yes, ai-train=yes"` | `robots.ts:9` | Hardcoded constant, not env — no runtime toggle. |
| `SITE_URL` (`NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com"`) | `canonical.ts:5` | Builds `Host:`/`Sitemap:` lines in robots.txt. |
| `process.env.ALLOW_INDEXING === "1"` | `indexing.ts:52` | Forces `isIndexingAllowed()` true regardless of env/host — flows into robots.txt's `indexable` flag and hence `Content-Signal`. |
| `process.env.VERCEL_ENV !== "production"` | `indexing.ts:53` | Non-production deploys get `indexable:false` (full `Disallow: /`, all-`no` signal). |
| `isNoindexHost(host)` via `NOINDEX_HOSTS` (`[]`) and `NOINDEX_HOST_SUFFIXES = [".vercel.app"]` | `indexing.ts:36-43` | `*.vercel.app` preview aliases are always non-indexable/non-AI-signaled even if `VERCEL_ENV=production`. |
| `process.env.CSP_ENFORCE === "1"` | `proxy.ts:46` | CSP header name only; shares the same middleware, unrelated to crawler access. |
| Vercel Firewall rule blocking `User-Agent` matching `/Bytespider/i` → HTTP 403 | Documented at `docs/web/WEB-PRODUCTION.md:112-113`; referenced (not implemented) in `robots.ts:32-34` | Lives in Vercel project config outside this repo — see Contradictions §D. |
| Cloudflare "Block AI Scrapers and Crawlers" toggle, required disabled | `docs/web/WEB-PRODUCTION.md:107-108,433` | Dashboard setting, outside repo — see Contradictions §D. |
| Content-Type override for `.well-known/api-catalog` | `apps/web/next.config.ts:45-61` | `application/linkset+json`, `Cache-Control: public, max-age=3600, must-revalidate`. |
| Mirror gate on CMS side | `apps/cms/src/payload/lib/seo-env.ts` (cross-referenced at `indexing.ts:6`) | Not read in detail — flagged as the CMS-side counterpart of `isIndexingAllowed`. |

### Coverage

- **Named crawlers**: no crawler name (`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `CCBot`, `cohere-ai`, `Applebot-Extended`, `Meta-ExternalAgent`, `Amazonbot`, `Diffbot`) appears in `apps/web/src` or `apps/web/public` (verified by `git grep`, zero matches for each). These names exist only in `docs/web/WEB-PRODUCTION.md:424-425` as prose. The one crawler named in code is `Bytespider` (`robots.ts:54`), denied.
- **Wildcard allow**: every other crawler is covered only by the `User-Agent: *` group's `Allow: /` plus `Content-Signal` — no code-level differentiation between "AI crawler" and any other bot beyond that group and the Bytespider exception.
- **UA-based response variation**: `git grep` for `user-agent`/`User-Agent`/`userAgent` across `apps/web/src` and `next.config.ts` shows the only production reads are: (1) `api/consent/route.ts:56,62` — hashes the UA into a consent audit record, unrelated to AEO; (2) `api/markdown/route.ts:58` — forwards the original UA on the internal self-fetch, does not branch on its value; (3) client-side `navigator.userAgent` device classification in `attribution/capture.ts:66-67`/`AttributionProvider.tsx:67`, unrelated to crawler handling. **No server code branches its response body/headers based on inspecting the `User-Agent` string.** The only per-request variation found is `Accept`-header-driven (markdown negotiation) and host-driven (`isIndexingAllowed`/`isNoindexHost`).
- **llms.txt ↔ route inventory sync**: no automated mechanism found. No test asserts its links match `docs/web/WEB-PAGES.md` or the actual route tree, and no build step touches it. Any drift between `llms.txt`'s listed URLs and the live site is undetected by tooling.
- **`ai.txt`**: `docs/web/WEB-PRODUCTION.md:430` describes a planned `apps/web/public/ai.txt` ("Spawning spec mirror. Not yet created — add post-launch."). Confirmed absent from `public/` (only `.DS_Store`, an unrelated verification `.txt` file, `llms.txt`, `world-110m.json` exist there) — this part of the doc is still accurate (contrast with the `llms.txt` claim in the same doc, which is stale — Contradictions §B3).

### Tests

- `apps/web/src/lib/security/agent-discovery.test.ts` (74 lines): covers the `Link` header containing all three registered relations, `api-catalog`'s href matching `API_CATALOG_PATH`, all hrefs root-relative, the static file `public/.well-known/api-catalog` parsing as JSON and deep-equaling the `API_CATALOG` constant (drift guard), the catalog anchored at `/`, all catalog targets root-relative with a non-empty `type`, declared media type equaling `application/linkset+json`.
- `apps/web/src/lib/seo/robots.test.ts` (72 lines): covers indexable-true (Content-Signal placement, three-way `yes` signal, existing `Allow`/`Disallow` rules preserved, Bytespider group's own `Disallow: /`, `Sitemap:`/`Host:` presence, leading comment block) and indexable-false (full disallow + `search=no,…`, absence of `Allow:`/`Sitemap:`).
- `apps/web/src/lib/agent-markdown.test.ts` (86 lines): covers `acceptsMarkdown` (explicit match, q-value handling, q=0 rejection, browser Accept headers never matching, `text/*`/`*/*` never matching, null/empty), `htmlToMarkdown` (scoping to `<main>`, title extraction, entity decoding, script/style stripping, `<body>` fallback, bare-fragment handling), `estimateMarkdownTokens` (chars/4 rounding, incl. `0`-length case).
- **Not test-covered**: `apps/web/src/proxy.ts` itself — no `proxy.test.ts` exists; the wiring that actually appends `AGENT_DISCOVERY_LINK_HEADER`, the `wantsMarkdown` decision logic, and the `/api/`-path exclusions are exercised only indirectly through their extracted pure functions. `apps/web/src/app/api/markdown/route.ts` — no test for the handler itself (path-validation branches, self-fetch/timeout/error-status mapping, response headers). `apps/web/src/app/robots.txt/route.ts` — the route handler itself (header reading, `Content-Type`) is not tested, only `buildRobotsTxt`. `apps/web/src/lib/seo/indexing.ts` has its own test file but was not opened in this audit's pass — not characterized here. No test exists for `llms.txt` content/structure/link validity. No test exists asserting the Vercel Firewall Bytespider rule or the Cloudflare "Block AI Scrapers" toggle state — both outside-repo config, inherently untestable from this codebase.

### Dead or unreachable code

- **None found that is unambiguously dead.** Every constant/function inspected (`AGENT_DISCOVERY_LINK_HEADER`, `API_CATALOG`, `API_CATALOG_PATH`, `API_CATALOG_CONTENT_TYPE`, `buildRobotsTxt`, `CONTENT_SIGNALS`, `acceptsMarkdown`, `htmlToMarkdown`, `estimateMarkdownTokens`, all `MARKDOWN_*_HEADER` constants) has a live consumer.
- **Adjacent stale artifact, not dead code**: `docs/web/WEB-PRODUCTION.md:429-430` describes `llms.txt` as "Not yet created" — false against the current repo state (see Contradictions §B3).
- **`apps/web/public/2abd211550dc3ce92123f2a22d86df7d.txt`** — an unrelated-looking verification-token-style static file next to `llms.txt`. Not investigated further (out of stated AEO/GEO scope); flagged because it surfaced in the same directory listing. UNDETERMINED what it is for (see Contradictions §D).

---

## Performance & Core Web Vitals

Scope: `apps/web` image/font/script pipeline, `apps/web/scripts/bundle-budget.mjs`, `apps/cms/src/payload/jobs/refresh-crux.ts`, web-vitals reporting, and `priority`/`loading`/`sizes`/`lcp` conventions.

### Mechanisms

**Image pipeline**
- Next.js built-in image optimizer (`next/image`), configured in `apps/web/next.config.ts:100-148`: `images.formats: ["image/avif", "image/webp"]` (`:101`); `images.minimumCacheTTL: 31_536_000` (1 year, `:108`); `images.deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]` — a custom `384` step inserted between Next's defaults (`:114`); `images.remotePatterns` allow-lists 5 origins: `localhost:3000/api/media/**`, `cms.cleanstart.com/api/media/**`, `cdn.cleanstart.com/**`, `storage.googleapis.com/cdpimages/**`, `cdn.jsdelivr.net/gh/devicons/devicon/**` (`:115-147`).
- `next/image` is imported in 62 files under `apps/web/src/components/sections` (grep count). `sizes=` is present in 60 files under the same tree (grep count).
- Decorative SVGs use plain `<img>` with an eslint-disable comment for `@next/next/no-img-element`, e.g. `_shared/DetailHero.tsx:52-61,64-81,102-111` — all three carry `loading="lazy"` and `decoding="async"`.
- Example `priority`/`sizes` pairing: `ASRHero.tsx:190,192` — `sizes="430px"` and bare `priority` (unconditional). `CleanSightHeroDeck.tsx:126-127` — `sizes="(min-width: 1024px) 600px, 90vw"` and `priority={i === 0}` (conditional, first item only). 25 files under `components/sections` reference `priority` (grep count), spanning hero and non-hero components.

**Font strategy**
`apps/web/src/app/layout.tsx:32-58` loads three `next/font/google` families: Manrope (display) — `subsets:["latin"]`, `weight:["500","600","700"]`, `variable:"--font-manrope"`, `display:"swap"`, `preload:true`, `adjustFontFallback:true` (`:32-39`, comment: "Preloaded for LCP"); Sora (body) — same shape, `weight:["400","500","600","700"]`, `variable:"--font-sora"`, `preload:true` (`:42-49`); JetBrains Mono (code) — `weight:["400","500","600","700"]`, `variable:"--font-mono"`, `preload:false` (`:52-58`, comment: "Not preloaded (below the fold on most pages)"). Font CSS custom properties wired to `--font-sans`/`--font-display` via inline `style` on `<html>` (`:161-165`).

**Script loading**
- GA4 bootstrap is a server-rendered inline `<script>` (not `next/script`), emitted via `dangerouslySetInnerHTML` in `Ga4HeadScript.tsx:23-29`, gated on `NEXT_PUBLIC_GA4_ID` being set/valid (`:20-21`).
- A `<link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="">` precedes it (`layout.tsx:172`), with `ConsentModeScript` and `Ga4HeadScript` ordered directly after — comment states the ordering is load-bearing (`:173-176`).
- `next/script` (`Script` component) is used in exactly two places, both `strategy="afterInteractive"`: `TurnstileWidget.tsx:3,93`, `LeadfeederScript.tsx:3,37`.
- `LeadfeederScript` and `WebVitals` are both rendered only inside `GatedAnalytics.tsx`, gated on consent categories: `{performanceGranted && <WebVitals />}` (`:44`), `{targetingGranted && <LeadfeederScript />}` (`:45`). GA4 itself is explicitly NOT gated (`:18-23`).

**Bundle budget enforcement (`apps/web/scripts/bundle-budget.mjs`)**
- Measures 3 hardcoded routes: `/`, `/about-us`, `/vulnerability-remediation` (`:30`). Fetches each route's HTML from `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3001`, `:31,71`), regex-extracts every `<script src=...>` (`:38,46-56`), skipping non-same-origin absolute URLs (`:52`). Fetches each chunk and gzips it locally with `zlib.gzipSync(..., {level:9})` — this is a fresh re-compression, NOT network transfer size (`:58-64`).
- Computes P50/P99 across only 3 samples: `P50 = sorted[floor(n*0.5)]`, `P99 = sorted[n-1]` (with n=3, P99 == max) (`:102-105`).
- Absolute budgets: `BUDGET_P50_KB = 220`, `BUDGET_P99_KB = 260` (`:32-33`). Regression tolerance vs. committed baseline (`apps/web/tests/e2e/__baselines__/bundle.json`): `REGRESSION_TOLERANCE_KB = 5` (`:144`).
- Two independent gates run every time: (1) **Regression check** (always active): if a baseline exists and any route's gz size grew >5 KB, `failed = true`, exit 1 (`:152-162,178-182`). (2) **Strict absolute-budget check**: only runs if `STRICT_BUNDLE_BUDGET === "1"` (`:143,164-172`) — when off, an over-budget P50/P99 is only logged as a warning (`:174-175`), does NOT fail the run. Comment states strict mode is "planned for Sprint 5" (`:146-149`).
- `UPDATE_BUNDLE_BASELINE=1` rewrites the baseline file and exits 0 without running any check (`:136-141`). Committed baseline currently on disk, confirmed via `find`.

**CrUX ingestion (`apps/cms/src/payload/jobs/refresh-crux.ts`)**
- Cron: `{ cron: '45 6 * * *', queue: 'cruxRefresh' }` — daily 06:45 UTC (`:14`). Task slug: `refreshCrux` (`:13`).
- Handler: calls `resolveCruxCredentials()`; if `null` (no `CRUX_API_KEY`), returns `{ output: { skipped: 'no-api-key' } }` and does nothing else (`:16-17`).
- Otherwise calls `fetchCrux(creds, resolveCruxOrigin(), [])` — the third arg (`pageUrls`) is a hardcoded empty array, so only origin-level records are fetched, never per-page (`:18`).
- `resolveCruxOrigin()` returns `process.env.CRUX_ORIGIN ?? 'https://www.cleanstart.com'` (`kinds/crux.ts:9-10`) — deliberately decoupled from the CMS's own base URL per comment (`:5-8`: "CrUX only has field data for the live www origin").
- `fetchCrux` queries the CrUX API (`chromeuxreport.googleapis.com/v1/records:queryRecord`) once per form factor (`PHONE`, `DESKTOP`) for the origin, plus once per form-factor per URL in `pageUrls` (`kinds/crux.ts:74-89`, `FORM_FACTORS` at `:49`). A 404 (no CrUX data for that target) is mapped to `null` and filtered out (`:65,87`).
- Metric-to-rating thresholds (`kinds/crux.ts:39-41`): LCP good ≤2500ms, poor >4000ms. INP good ≤200ms, poor >500ms. CLS good ≤0.1, poor >0.25. (`rate()` helper: `v <= good ? 'good' : v <= poor ? 'needs-improvement' : 'poor'`.)
- Result written via `writeCache(req.payload, 'ga4DataApi', 'global', 'crux:default', payload)` (`:19`) — **the cache `provider` key used is `'ga4DataApi'`**, not a CrUX-specific value, even though the payload is CrUX data — see Contradictions §C. `CachedProvider` union (`cache.ts:14-19`) only lists `ga4DataApi | gscSearchAnalyticsApi | gscUrlInspectionApi | msClarity | cloudflareWebAnalytics` — no `crux`-specific value; `'ga4DataApi'` is reused for both real GA4 rows and CrUX rows, disambiguated only by the `key` field.
- The same `writeCache(..., 'ga4DataApi', 'global', 'crux:default', ...)` call and `CRUX_KEY = 'crux:default'` constant is duplicated in `dashboards-advanced.ts:11,29,36` (the on-demand `/dashboards/crux` endpoint), separately from the cron job.

**Consumption of the CrUX cache**
- `GET /dashboards/crux` (`dashboards-advanced.ts:20-46`): requires `admin`/`editor` role (`:24-26`); reads the cache with `readCache<CruxPayload>(req.payload, 'ga4DataApi', 'global', CRUX_KEY)` (`:29`); `CRUX_TTL_MS = 26 * 60 * 60 * 1000` (26h, `:12`); if missing/stale (or `?refresh=1`) calls `fetchCrux` live and re-writes the cache (`:34-37`); on live-fetch failure falls back to serving the stale cached payload with `stale:true` if one exists, else HTTP 502 (`:38-44`).
- CMS admin UI component `Analytics/WebVitals.tsx` fetches `/api/dashboards/crux` client-side (`:41`) and renders the field-data cards; shows a "Needs setup" message referencing `CRUX_API_KEY` when unconfigured (`:67`) and "No CrUX field data available" when configured but empty (`:73`).
- No other consumer of the `crux:default` cache row was found (grep across `apps/cms/src` and `apps/web/src`).

**Web-vitals reporting (`apps/web/src`)**
- Single component: `apps/web/src/components/observability/WebVitals.tsx`. Uses `useReportWebVitals` from `next/web-vitals` (`:3,10`). On every metric callback, forwards to Sentry only: `window.Sentry?.setMeasurement?.(metric.name, metric.value, metric.name === "CLS" ? "" : "millisecond")` (`:11-16`) — no per-metric unit logic beyond that one CLS special-case. No GA4 event, no console log, no custom endpoint receives these metrics.
- Rendered exactly once, conditionally: `{performanceGranted && <WebVitals />}` in `GatedAnalytics.tsx:44`, itself rendered inside `<ConsentProvider>` in the root layout (`layout.tsx:194`). If `performanceGranted` is false, the component never mounts and `useReportWebVitals` never registers — no metrics are captured for that session.

**Lighthouse CI (adjacent, wired into the same CI job as the bundle budget)**
- Config at `apps/web/.lighthouserc.json`. `numberOfRuns: 3`, `formFactor: "mobile"`, simulated screen `375×667 @2x`, throttling `rttMs:150, throughputKbps:1638.4, cpuSlowdownMultiplier:4`.
- 8 URLs collected: `/`, `/about-us`, `/cleansight`, `/cleanstart-images`, `/vulnerability-remediation`, `/fips`, `/attack-surface-reduction`, `/software-bill-materials`.
- Assertions are all `"warn"` severity (not `"error"`): `performance ≥ 0.85`, `accessibility ≥ 0.95`, `best-practices ≥ 0.95`, `seo ≥ 1.0`; `csp-xss`, `is-on-https`, `redirects-http`, `uses-http2` turned `"off"`. A `"warn"` assertion does not fail the LHCI run.

**"lcp" convention on hero components**
- `HeroReveal` (`apps/web/src/components/ui/Reveal.tsx:147-174`) accepts an `lcp` boolean prop (default `false`, `:152`). When `true`, applies CSS class `cs-hero-reveal-lcp` instead of `cs-hero-reveal` (`:157`) — per comment (`:119-137`), the `lcp` variant animates only `transform`, not `opacity`, so the element paints at full opacity on first frame (avoids Chrome excluding `opacity:0` nodes from LCP candidacy).
- This `lcp` prop is on the **reveal-animation wrapper**, not on `next/image` — a separate mechanism from the `priority` prop on `<Image>`. Used in `_shared/DetailHero.tsx:90` (`<HeroReveal y={50} duration={1.0} lcp>`) and every hero file listed under Coverage below that imports `Reveal`.

### Configuration

| Setting | Value | Location |
|---|---|---|
| Image formats | `["image/avif", "image/webp"]` | `apps/web/next.config.ts:101` |
| Image cache TTL | `31_536_000` s (1 year) | `apps/web/next.config.ts:108` |
| Image device sizes | `[384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]` | `apps/web/next.config.ts:114` |
| Static-gen retry count | `3` | `apps/web/next.config.ts:26` |
| Static-gen max concurrency | `4` | `apps/web/next.config.ts:27` |
| ISR `expireTime` | `31_536_000` s | `apps/web/next.config.ts:33` |
| Bundle budget P50 | `220` KB (gz) | `apps/web/scripts/bundle-budget.mjs:32` |
| Bundle budget P99 | `260` KB (gz) | `apps/web/scripts/bundle-budget.mjs:33` |
| Bundle regression tolerance | `5` KB (gz) vs. baseline | `apps/web/scripts/bundle-budget.mjs:144` |
| `STRICT_BUNDLE_BUDGET` | env flag, default off (warn-only) | `apps/web/scripts/bundle-budget.mjs:143,164-176` |
| `UPDATE_BUNDLE_BASELINE` | env flag to rewrite baseline | `apps/web/scripts/bundle-budget.mjs:36,136-141` |
| `PLAYWRIGHT_BASE_URL` | base URL for bundle-budget fetches, default `http://127.0.0.1:3001` | `apps/web/scripts/bundle-budget.mjs:31` |
| CrUX cron schedule | `45 6 * * *` UTC | `apps/cms/src/payload/jobs/refresh-crux.ts:14`, also `apps/cms/src/payload.config.ts:586-587` |
| `CRUX_API_KEY` | required env; job/endpoint no-op if unset | `apps/cms/src/payload/lib/integrations/credentials.ts:192-193`, consumed at `refresh-crux.ts:16-17` |
| `CRUX_ORIGIN` | env override, default `https://www.cleanstart.com` | `apps/cms/src/payload/lib/integrations/kinds/crux.ts:9-10` |
| CrUX dashboard TTL | `26 * 60 * 60 * 1000` ms (26 h) | `apps/cms/src/payload/endpoints/dashboards-advanced.ts:12` |
| CrUX LCP thresholds | good ≤ 2500 ms, poor > 4000 ms | `apps/cms/src/payload/lib/integrations/kinds/crux.ts:39` |
| CrUX INP thresholds | good ≤ 200 ms, poor > 500 ms | `apps/cms/src/payload/lib/integrations/kinds/crux.ts:40` |
| CrUX CLS thresholds | good ≤ 0.1, poor > 0.25 | `apps/cms/src/payload/lib/integrations/kinds/crux.ts:41` |
| Lighthouse CI performance threshold | `0.85` (warn only) | `apps/web/.lighthouserc.json` |
| Lighthouse CI throttling | `rttMs:150, throughputKbps:1638.4, cpuSlowdownMultiplier:4`, mobile 375×667@2x | `apps/web/.lighthouserc.json` |
| CMS admin JS bundle budget (separate mechanism, apps/cms not apps/web) | `CMS_BUNDLE_BUDGET_BYTES_GZ=512000` | `.github/workflows/ci.yml:118-120`, script `apps/cms/package.json:21` |

### Coverage

- Hero components with the `lcp` prop pattern via `HeroReveal`/`Reveal` (grep hit list): `CleanSightHero.tsx`, `ContactHero.tsx`, `BlogsHero.tsx`, `WebinarsHero.tsx`, `ASRHero.tsx`, `SbomHero.tsx`, `LibrariesHero.tsx`, `KnowledgeHubArticle.tsx`, `AuthorHero.tsx`, `RoiHero.tsx`, `AboutHero.tsx`, `DemoHero.tsx`, `NewsroomHero.tsx`, `CaseStudiesHero.tsx`, `CareersHero.tsx`, `CareerDetailHero.tsx`, `GuidesHero.tsx`, `VulnHero.tsx`, `ResourceCenterHero.tsx`, `PartnersHero.tsx`, `TeamsHero.tsx`, `PodcastHero.tsx`, `_shared/DetailHero.tsx`, `CisoHero.tsx`, `CleanStartImagesHero.tsx`, `for-developers/DeveloperHero.tsx`, `resource/ResourceDetailHero.tsx`, `events/UpcomingEventHero.tsx`, `community/CommunityHero.tsx`, `pricing/PricingHero.tsx`, `fips/FipsHero.tsx`, plus `feedback/StateView.tsx`.
- `priority` on `<Image>`: found in 25 files under `components/sections`, including hero files (`ASRHero.tsx`, `CleanSightHeroDeck.tsx`, `BlogsHero.tsx`, `NewsroomHero.tsx`, `CaseStudiesHero.tsx`, `AuthorHero.tsx`, `DemoHero.tsx`, `CleanStartImagesHero.tsx`, `UpcomingEventHero.tsx`, `ErrorHero.tsx`) and non-hero components (`ResourcesInsightsClient.tsx`, `PlatformPipeline.tsx`, `CleanStartAdvantage.tsx`, `ResourcesInsights.tsx`, `ASRDelivers.tsx`, `VulnBlogsResources(Client).tsx`, `VulnAdvantage.tsx`, `TeamsHustleSquad.tsx`, `PlatformHero.tsx`, `EventFeatureCard.tsx`, `EventDetailMobileCard.tsx`, `ResourceDetailContent.tsx`, `FipsTrustedIndustries.tsx`, `NewsDetailBody.tsx`).
- `priority` usage is not uniformly conditional — some call sites gate it on list position (`priority={i === 0}`), others pass it unconditionally — both patterns coexist in the same codebase. See Contradictions §D for the UNDETERMINED completeness questions on `priority`/`sizes` coverage.
- CrUX field-data consumption is CMS-admin-only — surfaces exclusively in the Payload admin dashboard, behind `admin`/`editor` role check. `apps/web` has no route or component that reads `/api/dashboards/crux` or the `crux:default` cache row.
- Web-vitals (RUM) reporting covers every page that renders the root layout, since `GatedAnalytics` is mounted in `RootLayout` unconditionally — but is entirely gated on the visitor's Performance consent category; no visitor who denies/hasn't-yet-granted Performance consent contributes RUM data to Sentry.
- Bundle budget covers only 3 routes out of the full route set — every other route (blog, resource, events, careers, guide, knowledge-hub, etc.) is not measured.
- Lighthouse CI covers 8 static routes, explicitly excluding CMS-data-driven detail/listing pages per the workflow comment: "Detail / listing pages remain off until a staging-CMS-aware Lighthouse path lands" (`.github/workflows/web.yml`).

### Tests

- CrUX pure-function mapping is tested: `apps/cms/src/payload/lib/integrations/kinds/crux-map.test.ts` tests `mapCruxRecord` and `mapMetric`.
- **The `refreshCruxTask` job itself has no test file** — present for `check-broken-links`, `drain-lead-queue`, `purge-leads-pii`, `purge-preview-audit`, `purge-search-log`, `reindex-meili`; no `refresh-crux.test.ts` exists. This is inconsistent with the CLAUDE.md statement "Every job needs a test file and the `PAYLOAD_AUTO_RUN` gate."
- `cruxEndpoint`/`ga4RealtimeEndpoint` (`dashboards-advanced.ts`) have no test file found by a targeted search — flagged as UNDETERMINED with high confidence rather than certain (see Contradictions §D).
- `WebVitals.tsx` has no test file — it is the only file in that directory.
- `bundle-budget.mjs` has no unit test — invoked only as a CI script.
- **Bundle budget DOES run in CI**: `.github/workflows/web.yml`, step "Bundle budget (ratchet vs committed baseline)" inside the `web-e2e` job, runs `pnpm --filter @cleanstart/web bundle:budget` against a production server on port 3001, unconditionally (no `if:` guard) — a failure fails the `web-e2e` job. Does NOT set `STRICT_BUNDLE_BUDGET=1`, so only the regression-vs-baseline check can fail this CI run.
- Lighthouse CI runs in CI as a separate job `web-lhci`, but all assertions are `"warn"` severity, so it cannot fail the job on a performance-score regression by itself.

### Dead or unreachable code

- **`fetchCrux`'s `pageUrls` parameter is always called with `[]` from both call sites** (`refresh-crux.ts:18` and `dashboards-advanced.ts:35`) — the per-page CrUX query path inside `fetchCrux` (`kinds/crux.ts:82-85`) is therefore unreachable; only the origin-level query path (`:81`) ever executes.
- **`CachedProvider` type reuse for CrUX** — see Contradictions §C. Not dead code, but means any future code that queries `analyticsCache` by `provider: 'ga4DataApi'` without also filtering on `key` would receive both real GA4 rows and CrUX rows. No such under-filtered query was found.
- **`STRICT_BUNDLE_BUDGET` absolute-budget branch is present in code but never set to `"1"` anywhere in the repo** — grep across `.github/workflows/*.yml` and `apps/web` finds only the script's own read (`bundle-budget.mjs:143`); no workflow or `.env*` sets it. The strict/absolute-budget branch (`:164-172`) is unreachable in CI as currently configured — only the warn-log branch (`:174-175`) executes there.
- **`UPDATE_BUNDLE_BASELINE` is similarly never set in any workflow file** — the baseline-rewrite branch (`:136-141`) only runs when a developer invokes it manually per the header comment's documented usage, never from CI.

---

## Rendering & Delivery

Scope: `apps/web/src/app` route segment configs, `notFound()` usage, `/api/revalidate`, caching headers, and server- vs. client-rendered content. Audited 2026-07-29.

### Mechanisms

**Rendering strategy per route shape**
- **Static marketing pages** (`about-us`, `pricing`, `careers`, `case-studies`, `partners`, `teams`, `for-ciso`, `for-developers`, `fips`, `software-bill-materials`, `vulnerability-remediation`, `attack-surface-reduction`, `cleansight`, `cleanstart-platform`, `clean-libraries`, `cleanstart-images`, `contact-us`, `book-a-demo`, `deal-registration`, `roi-calculator`, `community`): each declares `export const revalidate = 3600` at the page-segment level. Server-rendered async components, pre-rendered at build and refreshed on the 3600s ISR window.
- **Listing pages** (`blogs`, `news`, `guide`, `events`, `webinars`, `resource-center`, `careers`) also set `revalidate = 3600`. `email-signatures/page.tsx` uses `revalidate = 300` (`:30`).
- **Detail routes** (`blogs/[slug]`, `event/[slug]`, `author/[slug]`, `job/[slug]`, `guide/[slug]`, `news/[slug]`, `resources/[slug]`): each sets `export const dynamicParams = true` and implements `generateStaticParams()` pre-rendering every published slug at build time, falling back to `[]` (`try { … } catch { return []; }`, build-time CMS outage tolerance). None set a page-level `revalidate` — the effective ISR window comes from the fetch-level cache inside `fetchCMS()` (`apps/web/src/lib/cms-fetch.ts:111-120`), defaulting to `DEFAULT_REVALIDATE_SECONDS = 3600` (`:47`) unless a call site passes `revalidateSeconds`.
- **`knowledge-hub/[slug]/page.tsx`** and **`(legal)/legal/[slug]/page.tsx`**: neither declares `dynamicParams` at all — Next's segment default is `true` when unset, so both behave the same as the seven routes above, but this is the *implicit default*, not an explicit setting.
- **`(legal)/privacy-policy/page.tsx`**: fixed-slug page, fetches `getLegalBySlug(PRIVACY_POLICY_SLUG)` directly; no `dynamicParams`/`revalidate` export.
- **`preview/[collection]/[slug]/page.tsx`**: `export const dynamic = "force-dynamic"` (`:12`) — always dynamically rendered, verifies a signed token on every request (`cache: "no-store"`, `:43`), delegates to the same `render*Detail` functions used by public detail pages, in draft mode.
- **`podcast/page.tsx`**: no explicit `dynamic`/`revalidate` export. Comment (`:31-35`) states the page is "Static + ISR" because all its fetches are cacheable — see Contradictions §B5 for the "revalidate 60" vs. 3600 discrepancy noted in that comment.
- **`email-signatures/[slug]/route.ts`**: a Route Handler. Sets `export const revalidate = 300` (`:65`). No `generateStaticParams`.
- **`guide-cover/[slug]/route.tsx`**: `export const runtime = "nodejs"` only (`:10`); an `ImageResponse` generator, no explicit caching export in the file.
- **API routes**: `api/consent`, `api/csp-report`, `api/health`, `api/markdown`, `api/revalidate` all set `export const dynamic = "force-dynamic"` plus a `runtime` (`nodejs` or `edge`). `api/og/route.tsx` sets only `runtime = "edge"` and returns an explicit `cache-control` header on the response (`:112`). `api/search/route.ts` sets `runtime = 'nodejs'` only.

**Revalidation — two layers**
1. **Time-based (fallback ISR)** — `fetchCMS()`'s `next.revalidate` option, default 3600s (`cms-fetch.ts:47,111-120`), applied to every CMS REST read unless `noStore`/draft mode is active.
2. **On-demand (push)** — `POST /api/revalidate` (`apps/web/src/app/api/revalidate/route.ts`), called by the CMS via `revalidateWeb()` (`apps/cms/src/payload/lib/web-revalidate.ts:54-115`) whenever a doc is published/updated. Two auth modes implemented in the route: **Mode 1 (Bearer token)** — `Authorization: Bearer <WEB_REVALIDATE_SECRET>`, body `{ tags?, paths?, layoutPaths? }` — the only mode the CMS-side helper ever constructs/sends. **Mode 2 (body secret)** — body `{ secret: <REVALIDATE_SECRET>; tag: string }`, restricted to a `NAV_CACHE_TAGS` allow-list (`:29-35,59-79`) — see "Dead or unreachable code," no caller in the repository constructs this shape. `revalidatePath(path)` (no type arg) is used for concrete resolved detail/listing URLs; `revalidatePath(path, "layout")` only for `layoutPaths` (subtree purge).

**Unknown-slug handling**
Every `[slug]` detail page follows the same pattern: fetch by slug → `if (!doc) notFound();` → otherwise render. `notFound()` call sites: `(legal)/legal/[slug]/page.tsx:64,95` (also a `permanentRedirect` branch for the privacy-policy slug alias), `(legal)/privacy-policy/page.tsx:58`, `author/[slug]/page.tsx:78`, `blogs/[slug]/page.tsx:110`, `event/[slug]/page.tsx:97`, `guide/[slug]/page.tsx:107`, `job/[slug]/page.tsx:98`, `knowledge-hub/[slug]/page.tsx:66`, `news/[slug]/page.tsx:90`, `resources/[slug]/page.tsx:97`.
By contrast, `email-signatures/[slug]/route.ts:89-94` (a Route Handler, not a page) returns a real `Response` with `status: 404` — unaffected by the App Router page/ISR notFound-caching behavior because Route Handlers return a `Response` object directly.

**Caching layers observed**
- `next.config.ts`: one explicit `headers()` rule, for `/.well-known/api-catalog` only (`Cache-Control: public, max-age=3600, must-revalidate`, `:52-64`). `expireTime: 31_536_000` is set (`:33`, comment: pins Next's default so ISR pages may serve stale content for up to a year while the CMS is unreachable rather than force a blocking regeneration). `experimental.staticGenerationRetryCount = 3`/`staticGenerationMaxConcurrency = 4` govern build-time prerender fan-out, not runtime caching.
- **No `middleware.ts` exists in `apps/web/src`** — only `.next/` build artifacts reference "middleware"; there is no source file.
- **Live response headers** (fetched directly from `https://www.cleanstart.com`, 2026-07-29): homepage `/`: `cache-control: public, max-age=0, must-revalidate`, `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, `x-nextjs-stale-time: 300`. `/blogs`: same. A real published blog slug: `x-vercel-cache: STALE`, `age: 1804`, `x-nextjs-stale-time: 300`. `/api/health`: `cache-control: no-store`. `/api/og?title=test`: `cache-control: public, immutable, no-transform, max-age=31536000` (set at `route.tsx:112`). `/sitemap.xml`: `cache-control: public, max-age=0, must-revalidate`. All observed pages carry the identical `cache-control: public, max-age=0, must-revalidate` — Vercel's standard ISR/prerendered header; the real freshness signal is `x-vercel-cache`+`age`+`x-nextjs-stale-time`. `x-nextjs-stale-time: 300` observed on every prerendered page checked regardless of that page's own `revalidate = 3600` — see Contradictions §D for the UNDETERMINED on what this constant represents.

**Server- vs. client-rendered content**
- Every route's `page.tsx` entry point is an `async` server component — no `"use client"` directive found at the top of any `app/**/page.tsx` file.
- Primary content (article bodies, hero data, listings) is fetched server-side via `fetchCMS`/collection-specific helpers and passed as props — none depends on a client-side fetch to appear.
- Client-side `useEffect`+`fetch()` patterns exist only in `ConsentProvider.tsx` (consent banner state) and `SearchAutocomplete.tsx`/`SearchCommandPalette.tsx` (interactive search-as-you-type UI) — neither is primary page content.
- `RoiSimulator.tsx:1` is `"use client"` (the interactive calculator). The `/roi-calculator` page itself is `noindex: true, nofollow: true` — this client-only interactive centerpiece is on a page not intended to be indexed regardless.
- No primary, crawlable page content was found gated behind client-side-only rendering.

### Configuration

| Route (file) | `dynamic` | `revalidate` | `dynamicParams` | `runtime` | file:line |
|---|---|---|---|---|---|
| `blogs/[slug]/page.tsx` | — | — (fetch-level 3600 default) | `true` | — | `:41` |
| `event/[slug]/page.tsx` | — | — | `true` | — | `:28` |
| `author/[slug]/page.tsx` | — | — | `true` | — | `:24` |
| `guide/[slug]/page.tsx` | — | — | `true` | — | `:42` |
| `job/[slug]/page.tsx` | — | — | `true` | — | `:38` |
| `news/[slug]/page.tsx` | — | — | `true` | — | `:28` |
| `resources/[slug]/page.tsx` | — | — | `true` | — | `:33` |
| `knowledge-hub/[slug]/page.tsx` | — | — | *implicit default `true`* | — | no export present |
| `(legal)/legal/[slug]/page.tsx` | — | — | *implicit default `true`* | — | no export present |
| `(legal)/privacy-policy/page.tsx` | — | — | n/a | — | no export present |
| `preview/[collection]/[slug]/page.tsx` | `"force-dynamic"` | — | n/a | — | `:12` |
| `page.tsx` (home) | — | `3600` | n/a | — | `:63` |
| `blogs/page.tsx`, `news/page.tsx`, `guide/page.tsx`, `events/page.tsx`, `webinars/page.tsx`, `resource-center/page.tsx`, `careers/page.tsx` | — | `3600` | n/a | — | each own `:13`/`:23`/`:16`/`:14` line |
| `case-studies/page.tsx`, `about-us/page.tsx`, `pricing/page.tsx`, `partners/page.tsx`, `teams/page.tsx`, `contact-us/page.tsx`, `book-a-demo/page.tsx`, `deal-registration/page.tsx`, `roi-calculator/page.tsx`, `community/page.tsx`, `for-ciso/page.tsx`, `for-developers/page.tsx`, `fips/page.tsx`, `software-bill-materials/page.tsx`, `vulnerability-remediation/page.tsx`, `attack-surface-reduction/page.tsx`, `cleansight/page.tsx`, `cleanstart-platform/page.tsx`, `clean-libraries/page.tsx`, `cleanstart-images/page.tsx` | — | `3600` each | n/a | — | per-file `export const revalidate = 3600;` |
| `email-signatures/page.tsx` | — | `300` | n/a | — | `:30` |
| `email-signatures/[slug]/route.ts` | — | `300` | n/a (route handler) | — | `:65` |
| `guide-cover/[slug]/route.tsx` | — | — | n/a | `"nodejs"` | `:10` |
| `api/consent/route.ts` | `"force-dynamic"` | — | n/a | `"nodejs"` | `:5-6` |
| `api/csp-report/route.ts` | `"force-dynamic"` | — | n/a | `"edge"` | `:3-4` |
| `api/health/route.ts` | `"force-dynamic"` | — | n/a | `"edge"` | `:3-4` |
| `api/markdown/route.ts` | `"force-dynamic"` | — | n/a | `"nodejs"` | `:12-13` |
| `api/revalidate/route.ts` | `"force-dynamic"` | — | n/a | `"nodejs"` | `:4-5` |
| `api/search/route.ts` | — | — | n/a | `'nodejs'` | `:5` |
| `api/og/route.tsx` | — | — | n/a | `"edge"` | `:5` |
| `podcast/page.tsx` | — | — (comment claims "Static + ISR" via fetch-level cache) | n/a | — | `:31-35` |

### Coverage

- **Static/ISR with `revalidate = 3600`**: all top-level marketing pages, all listing pages, home.
- **Static/ISR with `revalidate = 300`**: `email-signatures/page.tsx`, `email-signatures/[slug]/route.ts`.
- **Static/ISR via `generateStaticParams` + `dynamicParams: true`, no page-level `revalidate`** (fetch-cache-driven, effectively 3600s default): `blogs/[slug]`, `event/[slug]`, `author/[slug]`, `guide/[slug]`, `job/[slug]`, `news/[slug]`, `resources/[slug]`, `knowledge-hub/[slug]` (implicit), `legal/[slug]` (implicit), `privacy-policy` (fixed slug).
- **Fully dynamic (`force-dynamic`)**: `preview/[collection]/[slug]`, and the five API routes listed above.
- **No page-level export at all, relying entirely on default Next.js behavior + fetch-level cache**: `podcast/page.tsx`, `sitemap.ts` (only a `next: { revalidate: 3600 }` on its internal fetch, `sitemap.ts:53`, no segment export), `guide-cover/[slug]/route.tsx`, `api/search/route.ts`, `api/og/route.tsx`.
- **Client-side-only primary content**: none found. The only `"use client"` primary-surface component is `RoiSimulator.tsx`, on a `noindex`/`nofollow` page.
- **Discrepancy noted, not resolved**: `podcast/page.tsx:32` comment vs. `cms-fetch.ts:47` default — see Contradictions §B5/§D.

### The soft-404 question

**Finding: the documented soft-404 behavior is still accurate as of 2026-07-29.** Verified two ways:
1. **Code**: every `[slug]` detail page sets (or implicitly defaults to) `dynamicParams = true` and calls `notFound()` when the CMS lookup returns nothing, inside an otherwise normally-rendered (ISR-eligible) page.
2. **Live production behavior** (curl against `https://www.cleanstart.com`, 2026-07-29): every unknown slug tested across all seven `dynamicParams: true` routes plus `knowledge-hub` and `legal` returned `HTTP/2 200` with `x-nextjs-prerender: 1`, `x-matched-path: /<route>/[slug]`, and a body containing the app's not-found UI (`<title>` still reads e.g. "Blog post | CleanStart", body contains "404" text, `<meta name="robots" content="noindex">`/`noindex, follow` present) — the page renders the not-found state but the transport-level status code is 200, served from Next's prerender/ISR cache. Tested paths: `/blogs/no-such-slug-xyz123`, `/event/…`, `/job/…`, `/guide/…`, `/news/…`, `/resources/…`, `/author/…`, `/knowledge-hub/…`, `/legal/…` — all 200.

**Contrast**: `email-signatures/[slug]/route.ts:89-94` (a Route Handler, not `page.tsx`) returns a real `status: 404` `Response` for an unresolved slug — unaffected by the notFound()/ISR-page-caching mechanism, confirming the soft-404 is specific to the `page.tsx` + `notFound()` + ISR/`dynamicParams` combination, not a site-wide property.

### Tests

- **`/api/revalidate` (`route.test.ts`)**: covers only the `layoutPaths` code path (Mode 1, Bearer auth) — asserts `revalidatePath('/', 'layout')` for `{ layoutPaths: ['/'] }`, and that non-string/non-slash entries are filtered. **Not covered**: `tags` array handling, plain `paths` array handling, the 401 paths (missing/mismatched Bearer token), the 503 path (`WEB_REVALIDATE_SECRET` unset), the 400 invalid-JSON path, and the entire Mode 2 (`{ secret, tag }`) branch including its `NAV_CACHE_TAGS` allow-list and its own 401/400/503 branches.
- **`apps/cms/src/payload/lib/web-revalidate.test.ts`**: covers the CMS-side sender (`revalidateWeb()`), including `WEB_REVALIDATE_SUPPRESS` and unset-secret no-op paths.
- **No test exercises the soft-404 behavior directly** — no unit test for any `[slug]/page.tsx`'s `notFound()` branch, and no Playwright e2e spec (`smoke.spec.ts`, `consent.spec.ts`, `blog-journey-nav.spec.ts`, `resource-gating.spec.ts`) asserts HTTP status codes for unknown slugs. `resource-gating.spec.ts:14` mentions "403/404" only in a comment about a *different* endpoint (`/api/resources/{slug}/token`).
- **`email-signatures/[slug]/route.test.ts`** exists — not inspected in depth; flagged as the one test file co-located with a `[slug]` route.

### Dead or unreachable code

- **`/api/revalidate` Mode 2 (body `{ secret, tag }`, `route.ts:59-79`, including the `NAV_CACHE_TAGS` allow-list at `:29-35`) appears unreachable in the current codebase.** Evidence: the only in-repo caller that POSTs to `/api/revalidate` is `revalidateWeb()` in `apps/cms/src/payload/lib/web-revalidate.ts`, and its `fetch()` call (`:92-100`) always sends `{ tags, paths, layoutPaths }` with an `Authorization: Bearer` header — never a `{ secret, tag }` body. A repo-wide search for `process.env.REVALIDATE_SECRET` found exactly one hit: the read site itself (`route.ts:60`). See Contradictions §B6 for the `.env.example` documentation mismatch this implies. Flagged as "appears unreachable from static analysis of this repo," not asserting it is provably dead, since an external caller (manual curl, undiscovered script, an unmatched Payload hook) cannot be ruled out by grepping the repo alone.

---

## Measurement & Governance

Scope: GA4/analytics wiring + consent gating (`apps/web`), four CMS cron/hook jobs (IndexNow, content-insights, broken-links, Meilisearch reindex), every SEO test in `apps/web/src/lib/seo/*.test.ts` and `packages/schema/**/*.test.ts`, and CI configuration under `.github/workflows/`. Method: direct file reads + `gh api` branch-protection queries against `digibranders/cleanstart-website`.

### Mechanisms

**Analytics / GA4**
- **Consent Mode v2 default** is a static inline `<script>` in `<head>`: `apps/web/src/lib/consent/consent-mode-snippet.ts:62-66` builds `CONSENT_MODE_SNIPPET`, sending two `gtag("consent","default",…)` calls — one scoped to `CONSENT_REQUIRED_REGIONS` (30 EEA/UK/CH codes, `:48-54`) with `analytics_storage:"denied"`, one region-less default with `analytics_storage:"granted"` (`:65-66`). `ad_storage`/`ad_user_data`/`ad_personalization` are `"denied"` in both (`:56-57`). Rendered by `ConsentModeScript.tsx:20-28`.
- **GA4 bootstrap** is a Server Component, `Ga4HeadScript.tsx:19-30`, emitted directly after `<ConsentModeScript/>` in `layout.tsx:175-176` (comment at `:173-174`: order is load-bearing). Calls `buildGa4Snippet()` (`ga4-snippet.ts:40-70`), which inlines `gtag("config","<id>")` (`:64`) — this `config` call carries GA4's own automatic initial `page_view`.
- **SPA navigations**: `Ga4RouteTracker.tsx:23-45` is a client component using `usePathname`/`useSearchParams`; on every pathname/query change after the first it calls `trackPageView()` (`:36-40`) with `document.title` read post-commit. `track.ts:59-65` (`trackPageView`) emits `gtag("event","page_view",…)` — i.e. GA4's Enhanced Measurement "History events" automatic SPA detection is NOT relied on; comment at `Ga4RouteTracker.tsx:16-19` states that toggle "must stay OFF" in the GA4 property or navigations double-count. Code-driven, not automatic-detection-driven.
- **GA4 is NOT gated on consent.** `GatedAnalytics.tsx:37-47`: only `<Ga4RouteTracker/>` is unconditionally mounted (`:41-43`); `WebVitals` is gated on `performanceGranted` (`:44`) and `LeadfeederScript` on `targetingGranted` (`:45`). Doc comment (`:18-23`) states this is a "business decision, 2026-07-22": `analytics_storage` defaults to granted so gtag "sends complete, unmodeled hits regardless of the visitor's banner choice." `track.ts:5-6` states events "are emitted unconditionally — caller code never needs to read consent state."
- **Regional carve-out**: `consent-mode-snippet.ts:4-8` — inside `CONSENT_REQUIRED_REGIONS` (EEA+UK+CH) `analytics_storage` defaults denied; Google resolves the visitor's region server-side (`:9-10`), so outside those regions GA4 fires un-gated for every visitor regardless of banner interaction.
- Custom event emitter `track.ts:49-51` (`trackEvent`) fires `generate_lead | file_download | deal_registration | cta_click | search` (`:32-37`), guarded only by `typeof window === "undefined"` and `typeof gtag !== "function"` (`:42-46`) — no consent check.
- **Leadfeeder** (separate tool, gated): `LeadfeederScript.tsx:28-47` renders only inside `<GatedAnalytics/>` when `targetingGranted` (`GatedAnalytics.tsx:45`), self-noops if `resolveLeadfeederAccountId()` returns `null` (`leadfeeder.ts:35-42`) — unset env or a noindex host (`:40`, via `isNoindexHost`).

**CMS cron jobs (SEO-relevant)**

**IndexNow — NOT a cron job.** It is a Payload `afterChange` collection hook.
- `apps/cms/src/payload/hooks/indexnow-publish.ts:24-64` (`indexNowPublishAfterChangeHook`) fires on every collection's `afterChange`. Trigger conditions, all in `:29-37`: doc's new `_status === 'published'` AND previous status !== `'published'` (first-publish transition only, `:30`); `isIndexingAllowed()` true (`:34`, production host only); `INDEXNOW_KEY` env set (`:36-37`). On pass, resolves the doc's canonical URL (`:39-45`) and calls `submitIndexNow()` (`:47`).
  - `apps/cms/src/payload/lib/indexnow/submit.ts:42-91`: POSTs `{host, key, keyLocation, urlList}` to `https://api.indexnow.org/indexnow` (`:17,65`). Non-2xx or network error returns `{kind:'failed'}` (`:73-89`), logged via `req.payload.logger?.warn` in the hook (`:49-53`) — swallowed, never thrown (`:54-62`).
  - Registered per-collection, e.g. `Blogs.ts:316` calls `indexNowPublishAfterChangeHook('blogs')`; also wired on News, Authors, Resources, Pages, Jobs, KnowledgeBase, PodcastEpisodes, Events, CaseStudies, Webinars, Guides, Legal.
  - Consumer: none in-repo — output is an HTTP call to Bing/Yandex/etc.'s IndexNow endpoint; no downstream CMS record persists success/failure beyond the log line.

- **`checkBrokenLinksTask`** — `apps/cms/src/payload/jobs/check-broken-links.ts:25-28`: cron `'30 4 * * *'` (04:30 UTC daily), queue `brokenLinksScan`. Handler (`:29-127`) calls `scanForBrokenLinks()` (`:30-32`), upserts only non-`'ok'` rows into the `brokenLinks` collection (`:64,68-83,85-103`), deletes rows for URLs no longer present in any doc (`:107-118`). Consumer: `BrokenLinks.ts` collection (admin list view reads it directly — no separate endpoint found).

- **`refreshContentInsightsTask`** — `apps/cms/src/payload/jobs/refresh-content-insights.ts:12-20`: cron `'30 6 * * *'` (06:30 UTC daily, comment: "just after the 06:00 GSC daily refresh," `:9-10`). Handler calls `fetchContentSnapshot(req.payload)` (`:16`) then `writeCache(req.payload,'ga4DataApi','global','content:snapshot', snap)` (`:17`). Consumer: `apps/cms/src/payload/endpoints/content-insights.ts:22,51` reads the identical cache key (`SNAPSHOT_KEY = 'content:snapshot'`, `readCache(...,'ga4DataApi','global',SNAPSHOT_KEY)` at `:51`) — the `/admin/content-insights` page's data source. See Contradictions §C for how this cache-key namespace overlaps with CrUX's own use of `'ga4DataApi'`.

- **`reindexMeiliTask`** — `apps/cms/src/payload/jobs/reindex-meili.ts:49-52`: cron `'0 5 * * *'` (05:00 UTC daily), queue `meiliReindex`. Handler (`:53-177`): counts Postgres published docs across `SEARCH_INDEXED_COLLECTIONS` (`:82-92`), compares to Meilisearch's `numberOfDocuments` (`:78-79`), only performs a full reindex when `meiliCount < 0 || delta > DRIFT_THRESHOLD` (`DRIFT_THRESHOLD = 0.05`, `:18,99`). Always reapplies `INDEX_SETTINGS` first regardless of drift (`:70-75`, "applied on every run"). Consumer: `apps/web/src/app/api/search/route.ts` and `apps/web/src/lib/search.ts` query the same Meilisearch index (`INDEX_UID`) for `/api/search` and the ⌘K command palette.

- **Registration/gating**: all four tasks registered in `jobs.tasks` in `apps/cms/src/payload.config.ts`; shared gate `shouldAutoRun: () => process.env.PAYLOAD_AUTO_RUN === 'true'` (`:599`, comment `:594-598`: keeps the broken-link scan and others from firing "spuriously" during tests/CI forks). Cron schedules declared at `:581-588`.

### Configuration

| Value | Source (`file:line`) | Notes |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | `apps/web/src/lib/analytics/ga4.ts:19` | Validated `^G-[A-Z0-9]+$` (`:16`); `null` on unset/malformed → no tag (fail-safe). |
| `NEXT_PUBLIC_LEADFEEDER_ID` | `apps/web/src/lib/analytics/leadfeeder.ts:17` | Validated `^[A-Za-z0-9]+$` (`:14`). |
| `CONSENT_REQUIRED_REGIONS` | `apps/web/src/lib/consent/consent-mode-snippet.ts:48-54` | Hardcoded ISO 3166-1 alpha-2 list (EEA+UK+CH), not env-driven. |
| `INDEXNOW_KEY` | `apps/cms/src/payload/hooks/indexnow-publish.ts:36` | Also required as a static file at `<baseUrl>/<key>.txt` per `submit.ts:6-9`; rendered to droplet `.env` via `.github/workflows/deploy-cms.yml:162,227`. |
| IndexNow endpoint | `apps/cms/src/payload/lib/indexnow/submit.ts:17` | `https://api.indexnow.org/indexnow`, overridable only in tests (`:24`). |
| Broken-links schedule | `check-broken-links.ts:28` and `payload.config.ts` | `30 4 * * *` UTC daily. |
| Content-insights schedule | `refresh-content-insights.ts:14` and `payload.config.ts:582-584` | `30 6 * * *` UTC daily. |
| Meili reindex schedule | `reindex-meili.ts:52` | `0 5 * * *` UTC daily. |
| Meili drift threshold | `reindex-meili.ts:18` | `DRIFT_THRESHOLD = 0.05` (5%). |
| Cron auto-run gate | `payload.config.ts:599` | `PAYLOAD_AUTO_RUN === 'true'` exactly. |
| GA4 property "History events" toggle | `Ga4RouteTracker.tsx:16-19`, `GatedAnalytics.tsx:26-27` | Must be OFF in the live GA4 property console — **not code-enforced**, convention only. |

### Enforcement inventory

"Enforced by test" = a Vitest assertion exists and is included in a test-runner `include` glob a CI job actually executes. "Enforced by CI (blocks merge)" = additionally, GitHub branch protection requires that check to pass before merge. **Branch protection check performed via `gh api repos/digibranders/cleanstart-website/branches/{main,development}/protection` → both returned `404 "Branch not protected"`.** Consequently, **no SEO property in this repo is enforced-to-block-merge at the GitHub level** — CI can go red on a PR, but nothing prevents merging or direct-pushing past it. See Contradictions §C for how this fact qualifies every other domain section's "Tests" subsection.

| SEO property | Test file:line | Included in a CI-run test glob? | Blocks merge? |
|---|---|---|---|
| OG image derivation (`/api/og` URL, params) | `canonical.test.ts:11-34` | Yes — `apps/web/vitest.config.ts:11` includes `src/**/*.test.ts`, run via `web.yml:79-80` | No (branch unprotected) |
| Title brand-suffix stripping/doubling | `canonical.test.ts:36-74` | Yes | No |
| Google site-verification token handling | `verification.test.ts:8-28` | Yes | No |
| `@graph` composition purity / CMS-outage fallback | `compose-page.test.ts:12-51` | Yes | No |
| Webflow legacy pagination-param redirect stripping | `legacy-params.test.ts:4-50` | Yes | No |
| OG image dimension/param contract | `og.test.ts:4-38` | Yes | No |
| Breadcrumb single-source-of-truth fitness test | `breadcrumb-guard.test.ts:36-48` | Yes — a source-grep test, not runtime | No |
| `robots.txt` content | `robots.test.ts:5-71` | Yes | No |
| noindex-host detection + indexing-allowed gate | `indexing.test.ts:8-52` | Yes | No |
| JSON-LD override allowlist/size/nested-`@id`/collection-scoping | `packages/schema/.../override-validator.test.ts:23-413` | **No** — `packages/schema` has its own `"test": "vitest run"` but no CI workflow or root/`turbo.json` task invokes it; `apps/web/vitest.config.ts:11` scopes to `apps/web/src/**` only, and CI's `pnpm --filter @cleanstart/web test`/`pnpm --filter @cleanstart/cms test:coverage` target only those packages' own scripts | No — not run at all |
| Rich-Result lint | `packages/schema/.../rich-result-lint.test.ts:6-89` | **No** | No — not run at all |
| WebPage/subtype template builder correctness | `packages/schema/.../templates.test.ts:8-67` | **No** | No — not run at all |
| Breadcrumb trail shape/labels/dead-route guard | `packages/schema/.../breadcrumbs.test.ts:4-99` | **No** | No — not run at all |
| Core JSON-LD builders output contract | `packages/schema/.../jsonld.test.ts:16-79` | **No** | No — not run at all |
| Graph composition (auto/addon/override merge, de-dup, determinism) | `packages/schema/.../compose-graph.test.ts:6-110` | **No** | No — not run at all |
| Package type-export scaffold | `packages/schema/.../types.test.ts:4-10` | **No** | No — not run at all |
| Lighthouse CI `categories:seo` score | N/A — `.lighthouserc.json:36` | Runs via `web.yml:189-245` (`web-lhci` job) | **No** — assertion level `"warn"`, does not fail the job even below `minScore: 1.0`; also unprotected branch |
| `payload generate:types` drift (contrast row, not itself an SEO property) | N/A | `apps/cms verify:types` runs in `ci.yml:107-108` | No (branch unprotected) |

**Convention-only (no test, no CI check found):**
- GA4 "Enhanced Measurement → History events" must stay OFF (`Ga4RouteTracker.tsx:16-19`) — lives in the GA4 web console, not code; a comment is the only safeguard.
- `CONSENT_MODE_SNIPPET_HASH` (`consent-mode-snippet.ts:69-70`) documented as needing manual recomputation if the snippet changes; a test asserts the two stay in sync, but the hash itself is "NOT currently wired into the CSP" (`:34-36`) — an inert value with a passing test behind it.
- IndexNow `<key>.txt` file existing and being served at `<baseUrl>/<key>.txt` — no test or CI step verifies this static file is actually deployed/reachable.

### Coverage

**Instrumented (code exists, wired, has a consumer):** GA4 initial page_view (via `gtag config`) + manual SPA page_view (`Ga4RouteTracker`); GA4 custom conversion events (`generate_lead`, `file_download`, `deal_registration`, `cta_click`, `search`) via `trackEvent`, un-gated by consent; Consent Mode v2 defaults (region-aware) feeding GA4 + advertising signals; Leadfeeder (Targeting-gated, separate from GA4); IndexNow ping on first-publish transition, 13 collections wired; nightly broken-link scan → `brokenLinks` collection (editor-facing); daily content-insights snapshot → `/admin/content-insights` (editor-facing dashboard); daily Meilisearch drift-check/reindex → public `/api/search` + ⌘K palette.

**Not instrumented / not verifiable from code:** whether the IndexNow `<key>.txt` static file is actually live on the production host; whether GA4's "History events" toggle is actually OFF in the live console; whether `packages/schema`'s test suite currently passes at all; IndexNow success/failure has no persisted record (only `logger.warn` on failure) — no collection or dashboard tracks historical IndexNow submissions, so an editor cannot see past submissions. (See Contradictions §D for the UNDETERMINED framing of the first three.)

### Tests (full enumeration)

**`apps/web/src/lib/seo/*.test.ts`**: `verification.test.ts` (4 cases — see Contradictions §B2 for this function's dead-code status); `canonical.test.ts` (11 cases: OG image defaults/`ogTitle`/`sub=`/explicit-image; `stripBrandSuffix` variants; title/brand handling incl. `absoluteTitle`); `compose-page.test.ts` (6 cases: `buildPageGraph` composes complete `@graph` with no CMS access at compose time, falls back to auto-only, merges valid override per `@type`, deterministic, `seoOverride()` extraction); `legacy-params.test.ts` (9 cases); `og.test.ts` (6 cases); `breadcrumb-guard.test.ts` (15 cases, `it.each` over 6 hero + 9 page files); `robots.test.ts` (11 cases across 2 blocks); `indexing.test.ts` (8 cases across 2 blocks).

**`packages/schema/**/*.test.ts`**: `validate/override-validator.test.ts` (~30 cases across 6 `describe` blocks — allowlist/rejection rules, `parseLenient`/`parseLenientMulti`, `buildIngestPlan`, `AUTO_EMITTED_TYPES_BY_COLLECTION`); `validate/rich-result-lint.test.ts` (9 cases); `builders/templates.test.ts` (6 cases); `builders/breadcrumbs.test.ts` (12 cases); `builders/jsonld.test.ts` (6 cases, "INV-3 output guard"); `compose/compose-graph.test.ts` (10 cases, incl. "INV-5" invariants); `__tests__/types.test.ts` (1 case).

### Dead or unreachable code

- **All of `packages/schema/**/*.test.ts` (7 files, ~65 test cases) never execute in CI.** Evidence: `packages/schema/package.json` defines its own `"test": "vitest run"` script, independent of any other package. `apps/web/vitest.config.ts:11` scopes `include` to `["src/**/*.test.ts", "src/**/*.test.tsx"]` relative to `apps/web` — cannot pick up `packages/schema/src/**`. `.github/workflows/web.yml:79-83` runs `pnpm --filter @cleanstart/web test` and `pnpm --filter @cleanstart/ui test`; `ci.yml:95-96` runs `pnpm --filter @cleanstart/cms test:coverage` — all single-package scoping, no `...`/`^...` dependency selector. `grep -rn "schema" .github/workflows/*.yml` returns no hits at all. Root `package.json`'s `"test": "turbo run test"` is defined but never invoked by any workflow; even if it were, `turbo.json`'s `test` task (`dependsOn: ["^build"]`) only builds dependencies first, does not run their `test` tasks. Net effect: a regression in `packages/schema/src/**` (used by both `apps/web` and `apps/cms`) would not be caught by CI even if its own local tests would have caught it. See Contradictions §C.
- **`INDEXNOW_KEY` production value**: rendered into the droplet `.env` by `.github/workflows/deploy-cms.yml:162,227` — UNDETERMINED whether this GitHub Actions variable is actually set to a non-empty value (repo/org variable contents aren't visible to a static code audit); if unset, the entire IndexNow hook silently no-ops for every publish and no test in this repo would catch that against the deployed env specifically.
- **`cms-e2e`/`cms-vr`/`cms-a11y` jobs** in `.github/workflows/ci.yml` are all defined with `if: false # Playwright suites temporarily disabled` (`ci.yml:124,205,261`) — these jobs never run at all, regardless of any SEO content they might contain.

### Answers to the two explicit questions

**1. Which SEO properties are enforced automatically vs. convention-only?** Strictly speaking, **none are enforced-to-block-a-merge**, because neither `main` nor `development` has GitHub branch protection configured. Within "does a test/CI job run and go red on a violation" (advisory-only given the above): **Do run in CI**: all 8 files in `apps/web/src/lib/seo/*.test.ts`, plus the Lighthouse `categories:seo` check (`"warn"` severity, does not fail the job). **Never run anywhere**: `packages/schema`'s ~65 assertions (JSON-LD override allowlist/validation, rich-result linting, template builders, breadcrumb-trail builder, core JSON-LD entity builders, graph-composition logic). **Convention-only, no test at all**: the GA4 "History events" toggle; the IndexNow key-file being actually served; `PAYLOAD_AUTO_RUN` being correctly set in each environment.

**2. GA4 code-driven page views vs. automatic detection; consent gating?** Code-driven, not automatic-detection. The initial page load's `page_view` comes from GA4's own `gtag("config", "<id>")` call (`ga4-snippet.ts:64`), which is GA4's default `config` behavior, not Enhanced Measurement. Every subsequent SPA navigation's `page_view` is explicitly emitted by application code (`Ga4RouteTracker.tsx:36-40` → `track.ts:59-65` → `gtag("event","page_view",…)` inside a `useEffect` keyed on `[pathname, searchParams]`). The code explicitly depends on GA4's "History events" automatic SPA-detection feature being turned OFF in the GA4 property console — asserted only in a comment, not in any test. GA4 is **not gated on consent** for the large majority of visitors: `GatedAnalytics.tsx:37-47` mounts `<Ga4RouteTracker/>` unconditionally, and Consent Mode defaults `analytics_storage` to granted everywhere except the 30 EEA/UK/CH region codes, where it defaults denied pending Google's server-side region resolution. Advertising signals are denied everywhere by default and only flip on an explicit "Targeting" opt-in via `ConsentProvider`.

### UNDETERMINED items (see also Contradictions §D)

- Whether `INDEXNOW_KEY` (`deploy-cms.yml:162,227`) is actually set to a non-empty value in the live droplet environment.
- Whether GA4's "Enhanced Measurement → History events" toggle is currently OFF in the live GA4 property console.
- Whether `packages/schema`'s test suite currently passes when run manually — not executed as part of this static audit.

---

## Provenance

This document was assembled on 2026-07-29 from eight independent parallel code audits of the `cleanstart-website` monorepo (`development` branch): crawl & index control, URL architecture & sitemaps, on-page metadata, structured data (JSON-LD/schema), AEO/GEO, performance & Core Web Vitals, rendering & delivery, and measurement & governance. Each auditor was instructed to report only what the code does — mechanisms, configuration, coverage, tests, and dead/unreachable code, each claim `file:line`-cited — without judging whether that behavior is correct, desirable, or a defect. This document performs a faithful consolidation of those eight reports: it surfaces contradictions and refinements between them, carries forward every `UNDETERMINED` item verbatim in substance, and preserves each auditor's `file:line` citations. It reaches no verdicts of its own. Judging — deciding what is a defect, what should change, and what to prioritize — is reserved for a later phase, which will draw on this document together with `docs/seo/evidence/field-data.md` and `docs/seo/evidence/sources/`.

