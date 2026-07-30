# CleanStart Website — SEO Audit Report

**Auditor role:** Senior SEO Executive (technical + on-page + migration)
**Scope:** `apps/web` marketing site (Next.js 16 App Router) — full site, page by page — **plus** the `apps/cms` SEO field group, sidebar, and CMS→web consumption path (§3.2)
**Date:** 2026-05-29
**Context:** This site is a ground-up revamp of the live Webflow site at `https://www.cleanstart.com`. The revamp is "almost done"; this audit is the pre-launch SEO gate. Companion document: [`SEO-IMPLEMENTATION-PLAN.md`](SEO-IMPLEMENTATION-PLAN.md). Canonical web-prod decisions live in [`WEB-PRODUCTION.md`](WEB-PRODUCTION.md).

---

## 1. Executive summary

The new site has an **unusually strong SEO foundation** for a pre-launch product — centralized metadata helper, production-gated robots/indexing, JSON-LD server components, a rich CMS-side SEO field group, and 100% per-page metadata coverage on built pages. The on-page layer is in good shape.

**Update (execution pass):** the structural blockers below have now been implemented and verified (typecheck/lint/build green). The migration risk was resolved by **aligning the new detail routes to the live URLs** rather than redirecting (§4); the CMS `seo.*` consumption gap is **wired** for the core fields (§3.2.3); the sitemap and product/job schema are done. The remaining open items are the **49 `/guide/*` redirects** (needs a slug map from the CleanStart team, §4.4) and the **OG images** (deferred to a dedicated workstream).

**Original finding — migration layer:** this is a domain revamp on the *same domain* (`www.cleanstart.com`), and four content types had diverged their path segment. Left unaddressed this would have dropped ~110 indexed URLs into 404s — now fixed by URL alignment (§4).

**A second critical finding, on the CMS side (now addressed):** the CMS ships a rich SEO field group + 11-component sidebar, but `apps/web` originally consumed none of it. The core fields (`title`, `description`, `ogImage`, `indexable`, `canonicalOverride`) are now wired through to the rendered HTML; `additionalSchema` / `robotsAdvanced` / `alternates` / `customTags` remain a documented follow-up (admin-only access + missing web composition libs). See §3.2.

| Area | Grade | Note |
|---|---|---|
| On-page metadata (titles/descriptions/canonical) | A− | Helper-driven, 100% coverage, well-structured |
| Structured data (JSON-LD) | A− | Product/SoftwareApplication added to product pages; JobPosting on careers detail ✅ |
| robots.txt / indexing controls | A | Production-gated, AI-bot policy locked, draft noindex defence, `*.vercel.app` + `/preview` noindex ✅ |
| **URL migration** | **A−** | Detail routes aligned to live URLs ✅; only `/guide/*` (49) still needs a slug map (§4.4) |
| **XML sitemap completeness** | **A** | All built routes + KB articles + blogs/resources/events/news/jobs collections, `noindex` filtered ✅ |
| **CMS SEO field group ↔ web consumption** | **B+** | Core fields (`title`/`description`/`ogImage`/`indexable`/`canonical`) wired ✅; advanced fields documented follow-up |
| Open Graph / social | C | Infra ready but **`/og/default.png` does not exist** |
| Page coverage / build gaps | B− | `/knowledge-hub` listing not built; `/webinars/[slug]` and `/pricing` intentionally not built (see §4.3, §6) |

---

## 2. Strategic question: do we copy the old meta titles & descriptions?

**Short answer: No — do not copy verbatim. But DO extract them as a reference baseline, and preserve the *keyword intent* on pages that already rank.**

### The reasoning (20-year SEO lens)

1. **Meta descriptions are not a ranking factor** and have not been for over a decade. They influence click-through rate from the SERP, nothing more. There is zero ranking equity to "preserve" by copying them.
2. **Title tags are a *minor* ranking factor and a *major* CTR factor.** They matter — but what matters is the *keyword targeting and topic*, not the exact string. You preserve the equity by keeping the page on the same topic targeting the same queries, not by copying the literal title.
3. **The old meta is, in places, low quality.** Our extraction (Section 7) found duplicated and mismatched descriptions — e.g. `/community` carries the FIPS description verbatim, `/for-developers` carries the About-Us description, and `/teams` and `/book-a-demo` have empty descriptions. Copying these would import bugs, not equity.
4. **The real equity lives in URLs, content, and backlinks — not meta strings.** That is exactly what the migration is at risk of destroying (Section 4). Spend the energy there.

### Recommended policy

- **Extract old titles/descriptions as a reference baseline** (done — Section 7) so we (a) understand current keyword targeting, (b) never accidentally regress a page that ranks, and (c) make a deliberate keep/improve/rewrite call per page.
- **Keep the page on-topic** for the same primary query as the old page. The new titles already largely do this and are generally *better* than the old ones (e.g. new `/cleansight` and product pages have sharper, benefit-led copy).
- **Rewrite weak/generic/duplicate old meta** rather than carrying it over.
- **Pull the old Webflow titles/descriptions into Google Search Console comparison** post-launch: watch the pages that drove the most impressions/clicks and protect those specifically.

> Bottom line: the meta-copy question is a low-stakes question. The high-stakes question it's adjacent to — "are we preserving the old URLs?" — has a much more urgent answer (see Section 4).

---

## 3. Site-wide infrastructure audit

Verified directly against source (`apps/web/src/app/layout.tsx`, `lib/seo/canonical.ts`, `lib/seo/jsonld.tsx`, `robots.ts`, `sitemap.ts`, `next.config.ts`).

| # | Item | Status | Finding |
|---|---|---|---|
| 1 | Root metadata (title template, description, OG, Twitter, robots, canonical) | ✅ Strong | `layout.tsx` exports full default metadata + `%s \| CleanStart` template + `metadataBase`. |
| 2 | Shared SEO helper | ✅ Strong | `lib/seo/canonical.ts#buildPageMetadata` enforces canonical + OG + `og:image:alt` on every page. |
| 3 | robots.txt | ✅ Strong | `robots.ts` production-gated; AI-bot allow-list except Bytespider; staging host noindex. |
| 4 | XML sitemap | ⚠️ **Incomplete** | `sitemap.ts` lists only 5 static routes + blogs/resources/authors. See Section 4. |
| 5 | JSON-LD structured data | ⚠️ Partial | Organization, Breadcrumb, BlogPosting, Article, NewsArticle, Event present. **No Product/SoftwareApplication on product pages** (WEB-PRODUCTION §7 calls for it). |
| 6 | Canonical URLs | ✅ Strong | Path-based self-canonical via helper; CMS-side override field exists. |
| 7 | Open Graph images | ❌ **Blocker** | `/og/default.png` referenced everywhere but **the file does not exist** (only `public/og/README.md`). |
| 8 | `<html lang>` | ✅ | `lang="en"` in `layout.tsx`. |
| 9 | Viewport | ✅ | Modern `viewport` export with `device-width`, theme color. |
| 10 | Web app manifest | ⚠️ Minor | No `manifest.json`. Not an SEO ranking issue; nice-to-have. |
| 11 | next.config (redirects/headers/images) | ⚠️ | AVIF/WebP on, CMS remote patterns set. **Only one redirect (`/blog→/blogs`).** No trailing-slash/lowercase normalization config visible. |

---

## 3.1 Indexing controls verification (production-only indexing)

> **Superseded 2026-07-29:** `staging.cleanstart.com` was deleted from DNS and no longer exists. The `NOINDEX_HOSTS` entry for it has been removed; `*.vercel.app` preview hosts remain covered by the same mechanism. The staging rows below are retained as a record of the 2026-05-29 audit, not as current state.

Explicitly verified against source: only production `www.cleanstart.com` is indexable; `staging.cleanstart.com` and the `/preview` (CMS preview link) routes are noindex. All three are correctly enforced today, with one minor consistency hardening available.

| Requirement | Enforcement | Status |
|---|---|---|
| **Only `www.cleanstart.com` indexed** | `proxy.ts:160-163` (X-Robots-Tag indexable only in prod), `robots.ts:13-17` (`Disallow: /` off-prod), `canonical.ts:52` (`index:true` only in prod) | ✅ Correct — 3 layers |
| **`staging.cleanstart.com` noindex** | `proxy.ts:16,160` `NOINDEX_HOSTS` → `X-Robots-Tag: noindex, nofollow, noarchive`; `robots.ts:5` host → `Disallow: /` | ✅ Correct — header-level (stronger than robots.txt alone) |
| **`/preview` + `/api/preview` noindex** | Preview page `metadata.robots: { index:false, follow:false, nocache:true }` (`preview/[collection]/[slug]/page.tsx:13`); `robots.ts:24` disallows both paths | ✅ Protected (page meta + crawl-block) |

**Why header-level noindex matters:** a `robots.txt` `Disallow` only blocks *crawling*, not *indexing* — a disallowed URL linked externally can still appear in the index as a bare result. Staging is correctly given a real `X-Robots-Tag: noindex` header, which is the right approach.

### Vercel preview / `*.vercel.app` indexing

| Case | Behavior | Status |
|---|---|---|
| **Preview deployments** (branch/PR builds, `VERCEL_ENV=preview`) | `isProduction` is false everywhere → `X-Robots-Tag: noindex` (`proxy.ts:160`), `Disallow: /` (`robots.ts:13`), `index:false` (`canonical.ts:52`), empty sitemap | ✅ Fully noindex |
| **Production deployment's `.vercel.app` aliases** (`<project>.vercel.app`, immutable `<hash>.vercel.app`) | Run with `VERCEL_ENV=production`; host not in `NOINDEX_HOSTS` → proxy emits **indexable** header and `robots.ts` serves `allow: /`. Only mitigation is the hardcoded `SITE_URL` canonical pointing to www. | ❌ **Gap — indexable** |

**The gap:** the production deployment is reachable at its `*.vercel.app` aliases, all of which carry `VERCEL_ENV=production` and therefore pass the production index gate. Duplicate content is only suppressed by the cross-domain canonical, not by an explicit noindex. **Fix (P1):** add a `.vercel.app` host-suffix check to the noindex condition in both `proxy.ts:160` and `robots.ts:13`, so it fires regardless of `VERCEL_ENV`. Stronger alternative: 308-redirect any `.vercel.app` host to `www.cleanstart.com` (like the existing apex→www rule), eliminating the duplicate entirely.

**Minor hardening (P1, optional):** In `proxy.ts:160` the `X-Robots-Tag` noindex condition is `isDraftMode || !isProduction || isNoindexHost(host)` — it omits `isPreviewPath` (already computed on line 62). In normal flow `/preview` carries the `__prerender_bypass` cookie so `isDraftMode` is true and the noindex header fires; and the page's own meta robots tag covers it regardless. But a direct hit to `/preview/...` on production *without* the cookie would get the proxy's *indexable* header while the page meta says noindex — the two disagree. Adding `|| isPreviewPath` to that condition makes them consistent. One-line, defense-in-depth only.

---

## 3.2 CMS SEO machinery review — the consumption gap (CRITICAL)

The user asked specifically for a careful review of "everything in the CMS, including the dedicated SEO sidebar." The CMS side was reviewed in full. The headline: **the CMS SEO tooling is excellent and the web layer ignores it.** An editor can spend ten minutes perfecting a page's SEO in the admin, hit publish, and none of it changes what Google sees.

### 3.2.1 What the CMS provides (built, tested, working in the admin)

**SEO field group** — `apps/cms/src/payload/fields/seo.ts` attaches a 19-sub-field group to every content collection:

| Sub-field | Purpose |
|---|---|
| `title` (≤60) / `description` (≤160) | Per-page meta overrides with length budgets |
| `indexable` (`index` / `noindex` / `noindex,nofollow`) | Per-page robots control, default `index` |
| `ogImage` (chain: `ogImage` → `heroImage` → site default) | Social card image |
| `ogImageAlt` | OG alt text |
| `useAdvancedOg` / `ogTitle` / `ogDescription` | OG copy split from meta |
| `useAdvancedTwitter` / `twitterCard` / `twitterTitle/Description/Image` | Twitter card overrides |
| `robotsAdvanced` (group) | `noarchive`, `nosnippet`, `noimageindex`, `notranslate`, `maxSnippet`, `maxImagePreview`, `maxVideoPreview`, `unavailableAfter` |
| `alternates` (JSON) | hreflang cluster |
| `customTags` (JSON) | Arbitrary `<meta>`/`<link>` head tags |
| `useCustomCanonical` / `canonicalOverride` (HTTPS-validated) | Canonical override |
| `additionalSchema` (admin-only, allowlist + 16 KB cap) | Custom JSON-LD blocks |
| `keywordTarget` | Target query (powers health score) |
| `speakablePath` | Speakable structured-data CSS path |

**Composition libraries** (already written, used by the sidebar previews): `composeRobotsMeta()`, `composeHreflangCluster()`, `composeCustomTags()`, `docCanonicalUrl()`. These are exactly the functions the *web* layer would call to render the fields — they exist, but only the admin previews consume them.

**SEO sidebar — 11 components** under `apps/cms/src/payload/admin/components/Seo*.tsx`:
`SeoHealthScoreField` (8-check 0–100 score), `SeoTitleField` (auto-sync + counter), `SeoDescriptionField`, `SeoIndexableField` (3-chip), `SerpPreviewField` (pixel-budget truncation), `SchemaPreviewField` (per-blob validation + admin override), `CanonicalField` (override + live HEAD-request health check), `SocialCardField` (OG upload + FB/X/LinkedIn preview), `HeadTagsCard` (hreflang + custom meta), `UrlChangeHistoryField` (read-only audit log), `SeoAdvancedPanel` (robots directives + speakable). Tests: `health-score.test.ts`, `robots-meta.test.ts`.

### 3.2.2 The gap — none of it reaches the rendered page

Verified directly against the web layer:

| CMS field/feature | Where `apps/web` should read it | Actual behavior |
|---|---|---|
| `seo.title`, `seo.description` | `generateMetadata` in `blog/[slug]`, `news/[slug]`, `resource/[slug]`, `events/[slug]` | ❌ Reads only base fields (`post.title`, `post.abstract`, `heroImage`). `seo.*` never referenced. |
| `seo` (any field) | Content TS types (`Blog`, `News`, `Resource`, `Event` in `lib/{blog,news,resources,events}.ts`) | ❌ **Types omit a `seo` property entirely** — even though the fetches use `depth=3` and the API returns it. The data arrives and is type-stripped into oblivion. |
| `seo.indexable` | `sitemap.ts`, robots metadata | ❌ `sitemap.ts` never checks `indexable`; a `noindex`-flagged doc still gets listed. |
| `seo.canonicalOverride` | `canonical.ts#buildPageMetadata` | ❌ Helper always self-canonicals from `path`; override ignored. |
| `seo.additionalSchema` | JSON-LD render | ❌ Detail pages use hardcoded `jsonld.tsx` builders; editor-authored schema is dropped. |
| `seo.robotsAdvanced`, `seo.alternates`, `seo.customTags` | `<head>` of rendered page | ❌ Not rendered anywhere on the web side. |

**Verdict:** the CMS SEO field group and its entire sidebar are **decorative** with respect to the live site. This is high-impact because it silently defeats editor intent — the admin even shows a green health score for SEO settings that have zero effect on the page Google crawls. It is promoted to a **4th P0 launch blocker** (§8): the migration plan assumes editors can fix per-page titles/descriptions/canonicals, and right now they cannot.

### 3.2.3 What *does* work (the one live CMS→web SEO path)

`apps/cms/src/payload/hooks/slug-change-redirect.ts` is wired end-to-end: on a published slug change it upserts a `301` row into the CMS `redirects` collection (and chain-collapses inbound redirects). `proxy.ts` reads that collection on every request via `redirects-cache.ts#lookupRedirect`. **This is the single CMS-authored SEO signal that actually reaches visitors** — and, conveniently, it is also the mechanism the migration redirect map should use (§4, Plan Task 0.1).

---

## 4. URL migration — RESOLVED by aligning routes to the live URLs (was P0)

The live Webflow sitemap exposes **236 indexed URLs**. The new app had initially diverged the path segment on four content types. **Decision (executed): rather than 301-redirect those, the new app's detail routes were renamed to match the live URLs exactly** — the senior-SEO-correct move, since it preserves the indexed paths with zero redirects and zero equity loss. Only genuinely-moved or retired URLs still need a redirect; those are seeded into the **CMS `redirects` collection** (resolved by `proxy.ts` via `redirects-cache.ts`) — not `next.config.ts` — so editors can manage them without a deploy, sharing the slug-change hook's machinery (§3.2.3).

### 4.1 Path-structure changes — now aligned (no redirect needed)

| Content type | Live URL | New app route (after fix) | Live count | Status |
|---|---|---|---|---|
| Blog detail | `/blogs/{slug}` | `/blogs/{slug}` | 53 | ✅ aligned (renamed from `/blog`) |
| Resource detail | `/resources/{slug}` | `/resources/{slug}` | 27 | ✅ aligned (renamed from `/resource`) |
| Event detail | `/event/{slug}` | `/event/{slug}` | 20 | ✅ aligned (renamed from `/events`) |
| Job detail | `/job/{slug}` | `/job/{slug}` | 11 | ✅ aligned (renamed from `/careers`) |
| News detail | `/news/{slug}` | `/news/{slug}` | 30 | ✅ already matched |
| Author | `/author/{slug}` | `/author/{slug}` | 6 | ✅ already matched |
| Webinar detail | `/webinar/{slug}` | `/webinars` (listing) | 2 | ↪ 301 → listing (no detail page by design) |
| Guide detail | `/guide/{slug}` | `/guide/{slug}` | 49 | ✅ aligned (CMS `guides` collection; no listing, matches live) |

> Listings were already correct and unchanged: `/blogs`, `/events`, `/careers`, `/resource-center`. Only the *detail* routes were renamed. Verified live: `/blogs/{slug}` → 200 with canonical `https://www.cleanstart.com/blogs/{slug}`; old `/blog/{slug}` → 404 (never a live URL).

### 4.2 URLs that did NOT change (safe — verify only)

- `/news/{slug}` → unchanged ✅
- `/author/{slug}` → unchanged ✅
- Core static pages: `/about-us`, `/cleansight`, `/cleanstart-images`, `/fips`, `/software-bill-materials`, `/software-composition-analysis`, `/vulnerability-remediation`, `/attack-surface-reduction`, `/for-developers`, `/for-ciso`, `/partners`, `/community`, `/contact-us`, `/book-a-demo`, `/deal-registration`, `/privacy-policy`, `/legal`, `/teams` → unchanged ✅

### 4.3 Old pages with no new equivalent (decide: redirect or 410)

| Old URL | Recommendation |
|---|---|
| `/pricing` | **Decided: not building it now.** Remove from all routes/sitemap/references; hold a 301 `/pricing → /book-a-demo`. When a pricing page is added later it inherits SEO automatically like any page (one-line note added to CLAUDE.md). |
| `/leadership` | Old had both `/leadership` and `/teams`; new has only `/teams`. 301 `/leadership → /teams`. |
| `/search` | New site has no search page. 301 → `/` or build. |
| `/survey` | Likely defunct. 301 → `/` or 410. |
| `/about-copy`, `/pricing-copy` | Webflow duplicate junk. **410 / leave 404** — do not redirect (never indexed value). |
| `/new-year-event-sysdig`, `/new-year-event-eventus`, `/cleanstart-hitachi-*`, `/cleanstart-raksha-chennai` | Old standalone landing pages (6). 301 → `/events` (add manually — see plan Task 0.1). |

### 4.4 `/guide/{slug}` — built as a CMS-backed route (49 live URLs)

The new app serves guides directly from the existing CMS `guides` collection at **`/guide/{slug}`** — the same path as the live site, with **no listing page** (mirroring the old structure). So all 49 guide URLs resolve without a redirect, *provided the guides are migrated into the collection with their original slugs* (Phase H ETL). Route: `apps/web/src/app/guide/[slug]/page.tsx`; data layer `apps/web/src/lib/guides.ts`; emits Article + BreadcrumbList + (when present) FAQPage JSON-LD, and consumes the CMS `seo.*` fields. The admin SEO sidebar `pathPrefix` was corrected `/guides` → `/guide` to match.

> ⚠️ Dependency: this prevents 404s only once the 49 Webflow guides are imported into the `guides` collection with slugs matching the live URLs. Confirm the ETL slug mapping with the CleanStart team.

**Residual redirects:** only ~13 genuinely-moved/retired URLs need a redirect (orphan one-offs + 2 webinar detail → `/webinars` + 6 event-landings → `/events`). These are added by hand in the admin (`redirects` collection is editor-managed) — see plan Task 0.1 for the exact list. The five aligned content types (blogs/resources/events/jobs/guides) plus news/author need **no** redirect.

---

## 5. XML sitemap audit (P0)

`apps/web/src/app/sitemap.ts` currently emits:

- **5 static routes:** `/`, `/about-us`, `/blogs`, `/resource-center`, `/vulnerability-remediation`
- **3 CMS collections:** `/blog/{slug}`, `/resource/{slug}`, `/author/{slug}`

**Missing from the sitemap (all are real, indexable pages):**

- **~15 static routes:** `/cleansight`, `/cleanstart-images`, `/fips`, `/software-bill-materials`, `/software-composition-analysis`, `/attack-surface-reduction`, `/for-developers`, `/for-ciso`, `/partners`, `/community`, `/contact-us`, `/book-a-demo`, `/deal-registration`, `/teams`, `/legal`, `/legal/acceptable-use-policy`, `/privacy-policy`, `/careers`, `/events`, `/news`, `/webinars`, `/podcast`
- **CMS collections not enumerated:** `news`, `events`, `webinars`, `knowledgeBase`, careers/jobs detail

A sitemap that omits 70%+ of the site under-reports the property to Google and slows discovery of exactly the pages we're migrating. Must be completed before launch.

---

## 6. Page coverage / build gaps

| Route | Status | SEO impact |
|---|---|---|
| `/knowledge-hub` (listing) | ❌ No `page.tsx` | ~60 old `/guide/*` pages have nowhere to land. High impact — guides are likely strong organic earners. |
| `/knowledge-hub/[slug]` | ✅ Built | Good — detail route exists. |
| `/webinars/[slug]` (detail) | ❌ Not built — **by design** | No webinar detail page. Listing "join" buttons link to external URLs; old `/webinar/*` → 301 to `/webinars` listing. |
| `/careers/[slug]` | ⚠️ Built but **no `generateMetadata`** | Job detail pages fall back to defaults; add `JobPosting` schema + metadata. |
| `/pricing` | ❌ Not built — **by design** | Removed from routes/sitemap; hold 301 → `/book-a-demo`. Future page inherits SEO automatically. |
| `/podcast` | ✅ Built | Metadata pulled from CMS global. |

---

## 7. Old-vs-new meta reference (extracted from live Webflow site)

Reference baseline only — **not** a copy mandate. "Old" = current live `cleanstart.com`. Use to protect ranking pages and spot regressions.

| Page | Old title | Old description (verbatim) | Verdict |
|---|---|---|---|
| `/` | Verified & Secure Container Images \| CleanStart | Build on verified, near-zero-vulnerability container images with cryptographic provenance and compliance alignment. | Old title is keyword-rich; new is brand-led. **Consider front-loading "Container Images" in new title.** |
| `/cleanstart-images` | CleanStart Platform \| Secure, Verified Software Foundations | Explore CleanStart's secure platform for reproducible, SLSA-aligned, and compliance-ready container image creation. | Both fine; keep new. |
| `/cleansight` | CleanSight Container Visibility \| SBOM, Risk Scoring, Compliance Mapping & Remediation Paths | CleanSight discovers container images across clouds…recommends hardened CleanStart replacements… | Strong old title — **preserve the keyword set** (SBOM, risk scoring, compliance mapping). |
| `/vulnerability-remediation` | Vulnerability Remediation \| CleanStart | Automate vulnerability remediation with CleanStart's near-zero CVE foundations and SLA-backed assurance. | Keep new (already in sitemap). |
| `/fips` | FIPS Compliance \| CleanStart | Deploy FIPS-validated, STIG-aligned images that simplify federal and enterprise compliance. | Solid; preserve "FIPS Compliance" head term. |
| `/software-bill-materials` | CleanStart SBOM \| Complete, Verified, and Compliance-Ready | Automated SBOMs with cryptographic signing, verified provenance, and continuous compliance… | Strong; preserve "SBOM". |
| `/software-composition-analysis` | Enhance SCA \| CleanStart | Eliminate dependency noise and improve accuracy with CleanStart's verified image foundations for SCA tools. | Keep; "SCA" present. |
| `/attack-surface-reduction` | **Attack surface** | CleanStart Images reduce attack surface by eliminating unnecessary components before they enter production. | ⚠️ Old title truncated/weak. New must be a full keyword title: "Attack Surface Reduction \| CleanStart". |
| `/for-developers` | **For Developers** | *(duplicated About-Us description)* | ⚠️ Old meta is broken. Write fresh. |
| `/for-ciso` | For CISO | Security, compliance, and traceability you can defend in any audit or board review | Description usable; title thin. |
| `/about-us` | About CleanStart \| Building Trusted Software Foundations | Learn about CleanStart's mission to secure software foundations through verified, reproducible builds. | Good; keep. |
| `/teams` | **Teams** | *(empty)* | ⚠️ Broken old meta. Write fresh. |
| `/partners` | CleanStart Partners \| Collaborate on Secure Software Supply Chains | Partner with CleanStart to deliver verifiable, compliance-aligned software foundations… | Good; keep intent. |
| `/community` | **Community** | *(duplicated FIPS description — wrong)* | ⚠️ Broken old meta. Write fresh. |
| `/contact-us` | Contact CleanStart \| Talk to a Secure Software Expert | Reach out to CleanStart for enterprise consultations on verified images, compliance… | Good; keep intent. |
| `/pricing` | CleanStart Pricing \| Secure Image Subscriptions | Explore CleanStart pricing plans for verified, reproducible, and compliance-aligned container images. | Relevant if `/pricing` is rebuilt. |
| `/book-a-demo` | Book a Demo | *(empty)* | Thin old meta; new copy is better. |

**Pattern:** the old static-page meta is a mix of good (home, cleansight, SBOM, about, contact, partners, pricing) and broken (attack-surface, for-developers, teams, community, book-a-demo). This *confirms* the recommendation in Section 2: extract as reference, do not copy blindly.

---

## 8. Prioritized issue list

### P0 — launch blockers
1. **Seed the 301 redirect map** into the CMS `redirects` collection for all changed paths (Section 4.1) + decisions for orphaned pages (4.3). Without this the migration loses organic equity.
2. **Complete the XML sitemap** to cover all static routes + all CMS collections (Section 5).
3. **Create `/og/default.png`** (1200×630, <300 KB) so social/OG shares render.
4. **Build `/knowledge-hub` listing** + ensure `/knowledge-hub/[slug]` covers all ~60 migrated guides (or the redirects in #1 have valid targets).
5. **Wire CMS `seo.*` fields through to `apps/web` rendering** (Section 3.2). Extend the content TS types to include `seo`, make `generateMetadata` prefer `seo.title/description/ogImage/canonicalOverride`, consume `seo.indexable` in robots + sitemap, and feed `seo.additionalSchema` into JSON-LD. Until this lands the entire CMS SEO sidebar has no effect on the live site.

### P1 — high priority (launch week)
6. Add `Product`/`SoftwareApplication` JSON-LD to product pages (`/cleanstart-images`, `/cleansight`) per WEB-PRODUCTION §7.
7. Add `generateMetadata` + `JobPosting` schema to `/careers/[slug]`.
8. Front-load primary keywords in thin new titles flagged in Section 7 (attack-surface-reduction, for-ciso, teams, community).
9. Configure host/trailing-slash/lowercase normalization (apex → www, `/path/` → `/path`) per WEB-PRODUCTION §5.
10. Block production `*.vercel.app` aliases from indexing (Section 3.1) — host-suffix noindex in `proxy.ts` + `robots.ts`.

> **Decided, no longer open:** `/webinars/[slug]` detail is **not** being built (old `/webinar/*` → 301 to `/webinars` listing, external join links); `/pricing` is **not** being built (removed from routes/sitemap; 301 → `/book-a-demo`). Both are handled by the Phase 0 redirect map.

### P2 — medium
11. Internal-linking pass: descriptive anchors, breadcrumbs site-wide, link guides ↔ blogs ↔ products.
12. Image alt-text audit on CMS content + decorative `aria-hidden` confirmation.
13. Verify Core Web Vitals at 1440 + mobile (separate `core-web-vitals` skill).
14. Submit sitemap + set canonical host in Google Search Console; verify both apex and www properties.

### P3 — nice to have
15. `manifest.json` / PWA basics.
16. `llms.txt` / `ai.txt` insurance files (WEB-PRODUCTION §8).
17. Post-launch GSC monitoring dashboard for top-impression migrated URLs.

---

## 9. Methodology & sources

- Source verified directly: `apps/web/src/app/{layout,robots,sitemap}.ts`, `lib/seo/{canonical.ts,jsonld.tsx}`, `next.config.ts`, all `app/**/page.tsx` routes, `proxy.ts`, `lib/redirects-cache.ts`.
- CMS side verified directly: `apps/cms/src/payload/fields/seo.ts`, the 11 `admin/components/Seo*.tsx` sidebar components, `hooks/slug-change-redirect.ts`, and the SEO composition libs + tests. Cross-checked against `apps/web` content types (`lib/{blog,news,resources,events}.ts`) and detail-page `generateMetadata` to establish the consumption gap (§3.2).
- Old-site inventory: `https://www.cleanstart.com/sitemap.xml` (~250 URLs).
- Old-site meta: raw-HTML extraction of 17 high-value static/product pages.
- Decision context: [`WEB-PRODUCTION.md`](WEB-PRODUCTION.md) §5–8, [`cleanstart-cms-architecture.html`](../architecture/cleanstart-cms-architecture.html) §SEO, [`WEB-PAGES.md`](WEB-PAGES.md).
