# CleanStart Conformance Report

**Module:** 91 — CleanStart conformance report (derived artifact, not a rule module — see `00-index.md` §8)
**Scope:** Verdict + evidence per rule ID across core modules 01–11 and conditional modules C1–C5, plus a ranked, effort-estimated gap backlog.
**Capture date:** 2026-07-29 (live re-verification), evidence base `docs/seo/evidence/`.
**Status of verdicts:** Every verdict below was authored, then independently adversarially re-verified, in modules 01–11 before this report was written. This report introduces no new verdicts and re-litigates none — see `## Assurance levels` for what that does and doesn't mean.

---

## Summary

269 rules total: 171 in the 11 core modules (01–11, always applicable) and 98 in the 5 conditional modules (C1–C5). CleanStart is single-locale, non-commerce, single-location, well under the ~10,000-URL programmatic/faceted threshold, and not a news publisher — every condition that would trigger a conditional module is absent by construction, so all 98 conditional rules are `N/A`. The entire live verdict set lives in the core modules.

**Verdict counts, core modules (171 rules):**

| Verdict | Count |
|---|---|
| Pass | 67 |
| Fail | 33 |
| Partial | 33 |
| Unverified | 17 |
| N/A | 21 |

**By severity, core modules only:**

| Severity | Pass | Partial | Fail | Unverified | N/A | Total |
|---|---|---|---|---|---|---|
| P0 | 2 | 1 | 6 | 0 | 0 | 9 |
| P1 | 23 | 12 | 14 | 7 | 5 | 61 |
| P2 | 23 | 16 | 8 | 8 | 7 | 62 |
| P3 | 19 | 4 | 5 | 2 | 9 | 39 |

Every `Fail` and `Partial` closes through one of the 35 entries in `## Ranked gap backlog` below — several close more than one rule ID at once because they share a single root cause.

**The three highest-impact open items, plainly:**

1. **Twelve of the thirteen legacy Webflow URLs this site was supposed to preserve still return a bare 404 instead of a redirect**, and the longer that sits, the harder the loss is to fully recover — Google's own crawl-frequency decay and Search Console's own "possibly a very long time" recrawl-delay warning both compound with time, not just sit still (`MIG-01`, `ARCH-01` — P0, backlog #1, effort S — this is genuinely cheap to fix).
2. **Every one of the nine CMS-backed detail-page templates serves HTTP 200, not 404, for a slug that doesn't exist**, because the not-found determination runs after a Suspense boundary has already locked the response status — a textbook soft-404 pattern Google names as a primary, ongoing cause of wasted crawl budget, not a cosmetic bug (`RENDER-01`, `CRAWL-11`, `RENDER-03` — P0/P1, backlog #6, effort L).
3. **Neither production branch has branch protection, and the CI checks that could catch a regression are either warn-only or never invoked at all** — the shared schema package's roughly 65 tests never run in CI, Lighthouse's SEO/performance assertions are `warn` not `error` with no comment recording that as deliberate, and the CMS publish gate doesn't actually block a document that's missing its title and description. A green check today proves nothing about tomorrow's merge (`GOV-01` plus eleven related rule IDs — P0, backlog #5, effort M).

Also worth stating plainly, because a report that only lists faults reads as noise: CleanStart's SEO foundation is genuinely strong in several places this pass didn't have to flag. The three-layer redirect-resolution architecture (`next.config.ts` → `proxy.ts` → the CMS `Redirects` collection, with its own cycle guard) is well-designed even where individual rows are missing — the mechanism works everywhere it's actually invoked. The real CrUX/GA4/GSC field data pulled for this pass (`docs/seo/evidence/field-data.md`) shows genuinely healthy numbers on the dimensions that are working — INP and CLS are both comfortably "Good" on mobile and desktop alike, and the site's AI-crawler policy (module 05) is unusually well-differentiated by vendor and bot category — most sites in this space get the training-vs-retrieval-vs-user-triggered distinction wrong or don't attempt it at all.

---

## Conformance table

One row per core rule (171 rows). `Evidence` points to the module file carrying that rule's full field-level evidence; `Backlog #` cross-references `## Ranked gap backlog` below for every non-`Pass` verdict that has an assigned fix (`Unverified` rows are addressed instead in `## Unverified items`, since they aren't yet confirmed defects).

| ID | Title | Sev | Verdict | Evidence | Backlog # |
|---|---|---|---|---|---|
| CRAWL-01 | A page-level `noindex` is invisible if the URL is blocked from crawling | P0 | Fail | 01-crawl | #2 |
| CRAWL-02 | A sustained robots.txt server error is read as "the entire site is disallowed" | P0 | Fail | 01-crawl | #3 |
| CRAWL-03 | Non-production environments need an access barrier, not just robots.txt/noindex | P0 | Partial | 01-crawl | #4 |
| CRAWL-04 | robots.txt governs crawling, not indexing | P1 | Partial | 01-crawl | #2 |
| CRAWL-05 | robots.txt must be served at `/robots.txt`, UTF-8, `text/plain` | P1 | Partial | 01-crawl | #7 |
| CRAWL-06 | Meta robots and `X-Robots-Tag` are equivalent; the most restrictive rule wins on conflict | P1 | Pass | 01-crawl | — |
| CRAWL-07 | robots.txt `noindex:` is unsupported, dead syntax on Google (retired 2019-09-01) | P1 | Pass | 01-crawl | — |
| CRAWL-08 | `max-snippet`/`nosnippet`/`max-image-preview` now also gate AI Overviews and AI Mode content reuse (2025 change) | P1 | Pass | 01-crawl | — |
| CRAWL-09 | `rel=canonical` is a hint, not a directive | P1 | Pass | 01-crawl | — |
| CRAWL-10 | Canonical anti-patterns Google explicitly calls out | P1 | Pass | 01-crawl | — |
| CRAWL-11 | Soft 404s must return a real 404/410 status code, not a 200 | P1 | Fail | 01-crawl | #6 |
| CRAWL-12 | Redirect status code shapes signal strength: 301/308 strong, 302/307 weak | P1 | Pass | 01-crawl | — |
| CRAWL-13 | robots.txt rule matching: most specific path wins, ties resolve to `Allow` | P2 | Pass | 01-crawl | — |
| CRAWL-14 | robots.txt parsing limit is 500 KiB | P2 | Pass | 01-crawl | — |
| CRAWL-15 | Faceted/parameter URL explosion should be blocked at the robots.txt level, not by canonical alone | P2 | Partial | 01-crawl | #21 |
| CRAWL-16 | Duplicate user-agent groups are merged, not overridden | P3 | Pass | 01-crawl | — |
| CRAWL-17 | Wildcard syntax in robots.txt is limited to `*` and `$` | P3 | Pass | 01-crawl | — |
| CRAWL-18 | robots.txt changes propagate on a caching delay, not instantly | P3 | N/A | 01-crawl | — |
| CRAWL-19 | `Crawl-delay` is ignored by Google, honored by Bing | P3 | Pass | 01-crawl | — |
| CRAWL-20 | `X-Robots-Tag` is a de facto convention, not a formal standard | P3 | Pass | 01-crawl | — |
| CRAWL-21 | Crawl-budget engineering doesn't apply below roughly 10,000 URLs | P3 | N/A | 01-crawl | — |
| CRAWL-22 | The Search Console URL Parameters tool no longer exists (removed 2022-04-26) | P3 | Pass | 01-crawl | — |
| CRAWL-23 | Google generally ignores URL fragments for crawling and indexing | P3 | Pass | 01-crawl | — |
| ARCH-01 | Previously-published URLs must redirect or 410 — never a silent 404 | P0 | Fail | 02-arch | #1 |
| ARCH-02 | One canonical form per path — trailing slash and case never diverge | P1 | Pass | 02-arch | — |
| ARCH-03 | Indexable pages need a real, crawlable inbound link with descriptive anchor text | P1 | Fail | 02-arch | #18 |
| ARCH-04 | Every sitemap URL must also be reachable by a same-site crawl from the homepage | P1 | Fail | 02-arch | #18 |
| ARCH-05 | Paginated pages need their own URL and correct canonical — `rel=next/prev` is dead | P1 | Partial | 02-arch | #18 |
| ARCH-06 | Faceted/filter URLs need one deliberate crawl-control strategy | P1 | N/A | 02-arch | — |
| ARCH-07 | URL paths are hyphenated real words, not IDs or session parameters | P2 | Pass | 02-arch | — |
| ARCH-08 | Design for discoverability signals, not a fixed click-depth ceiling | P2 | Partial | 02-arch | #18 |
| ARCH-09 | `BreadcrumbList` marks a logical path, with one source of truth per site | P2 | Partial | 02-arch | #29 |
| ARCH-10 | Sitemap files stay within the 50,000-URL / 50MB protocol cap | P2 | Pass | 02-arch | — |
| ARCH-11 | `lastmod` reflects the true content-change time, never the sitemap-build time | P2 | Pass | 02-arch | — |
| ARCH-12 | Don't ship an HTML sitemap as a substitute for real navigation | P3 | Pass | 02-arch | — |
| ARCH-13 | A redirect target has exactly one authoritative implementation | P3 | Fail | 02-arch | #34 |
| META-01 | Title element exists, is unique, and accurately describes the page | P1 | Pass | 03-meta | — |
| META-02 | Every indexable page renders at least one visible `<h1>` | P1 | Fail | 03-meta | #18 |
| META-03 | Open Graph's four required properties, plus image sub-properties, are present | P1 | Pass | 03-meta | — |
| META-04 | Canonical is self-referencing, absolute, and exactly one per page | P1 | Pass | 03-meta | — |
| META-05 | Meta description is present, unique, and accurate per indexable page | P2 | Partial | 03-meta | #20 |
| META-06 | Avoid Google's documented title/description rewrite triggers | P2 | Partial | 03-meta | #20 |
| META-07 | Title/description length is a pixel-width guideline, not a hard character cap | P2 | Partial | 03-meta | #20 |
| META-08 | Twitter/X Card markup implemented as an Open Graph supplement | P2 | Partial | 03-meta | #26 |
| META-09 | Image `alt` text is descriptive for content images, empty for decorative ones | P2 | Partial | 03-meta | #31 |
| META-10 | CMS `seo.*` overrides must reach every CMS-backed detail route through one shared resolver | P2 | Fail | 03-meta | #19 |
| META-11 | Never emit a meta keywords tag | P3 | Pass | 03-meta | — |
| META-12 | Snippet-suppression directives used deliberately, not left to chance | P3 | N/A | 03-meta | — |
| META-13 | Page-level `hreflang` only where the site is genuinely multi-locale | P3 | N/A | 03-meta | — |
| META-14 | Search-engine verification meta tags are emitted from exactly one code path | P3 | Fail | 03-meta | #19 |
| META-15 | Unwired CMS `seo.*` fields must not be presented as functional in the editor UI | P3 | Fail | 03-meta | #19 |
| META-16 | Exactly one metadata definition per route | P3 | Partial | 03-meta | #33 |
| SCHEMA-01 | Structured data confers rich-result eligibility only, never ranking | P1 | Unverified | 04-schema | — |
| SCHEMA-02 | Mark up only what is visibly true on the same page | P1 | Partial | 04-schema | #10 |
| SCHEMA-03 | One JSON-LD engine may reach production; a second full pipeline that never ships is a defect, not a backup | P1 | Fail | 04-schema | #17 |
| SCHEMA-04 | `@graph`/`@id` linking: one stable identifier per real-world entity | P1 | Pass | 04-schema | — |
| SCHEMA-05 | `Organization`: no required properties, but populate the disambiguation set | P1 | Partial | 04-schema | #11 |
| SCHEMA-06 | `Article`/`NewsArticle`/`BlogPosting`: no required properties, but never fake freshness | P1 | Partial | 04-schema | #12 |
| SCHEMA-07 | `JobPosting`: required fields plus a hard expiry obligation | P1 | Partial | 04-schema | #15 |
| SCHEMA-08 | `Product`: choose Product Snippet or Merchant Listing deliberately | P1 | N/A | 04-schema | — |
| SCHEMA-09 | JSON-LD is the syntax; never split one entity across Microdata and JSON-LD | P2 | Pass | 04-schema | — |
| SCHEMA-10 | `BreadcrumbList`: at least two `ListItem`s; the SERP win is desktop-only since January 2025 | P2 | Partial | 04-schema | #18 |
| SCHEMA-11 | `FAQPage` no longer produces a rich result for any site | P2 | Partial | 04-schema | #28 |
| SCHEMA-12 | `HowTo` and the June/November 2025 retirement batch: do not implement for Google | P2 | Pass | 04-schema | — |
| SCHEMA-13 | Validate with the right tool for the right question | P2 | Unverified | 04-schema | — |
| SCHEMA-14 | Gate the shared schema library's own test suite in CI, not just its consuming app's suite | P2 | Fail | 04-schema | #5 |
| SCHEMA-15 | Pin awareness of the schema.org release your validator targets | P3 | Unverified | 04-schema | — |
| SCHEMA-16 | `WebSite` node is safe to keep; do not build new Sitelinks Searchbox markup | P3 | Pass | 04-schema | — |
| SCHEMA-17 | Bare `WebPage` is connective tissue, not an eligibility trigger | P3 | Pass | 04-schema | — |
| GEO-01 | Never conflate a training crawler with its vendor's retrieval/citation crawler | P1 | Pass | 05-geo | — |
| GEO-02 | `max-snippet`/`nosnippet`/`max-image-preview` govern how much of a page AI Overviews and AI Mode may reuse, not just classic snippets | P1 | Pass | 05-geo | — |
| GEO-03 | Meta documents a real citation-indexing bot, `Meta-WebIndexer` — do not advise blocking or ignoring it | P2 | Pass | 05-geo | — |
| GEO-04 | `Google-Extended` and `Applebot-Extended` are use-governing flags on existing crawls, not separate fetchers, and have zero effect on Search/Siri/Spotlight ranking or inclusion | P2 | N/A | 05-geo | — |
| GEO-05 | `Bytespider` has no vendor-documented robots.txt compliance; enforce at the firewall, not the crawl-control layer | P2 | Pass | 05-geo | — |
| GEO-06 | `llms.txt` is `Convention — not vendor-confirmed`; publish it as a low-cost hedge, never as a claimed citation lever, and keep it synced to the real route inventory | P2 | Partial | 05-geo | #22 |
| GEO-07 | Google AI Overviews/AI Mode eligibility requires only standard Search eligibility — building bespoke markup for it is wasted effort | P2 | Pass | 05-geo | — |
| GEO-08 | `sameAs`/Organization entity markup is vendor-confirmed for classic Knowledge Panel/rich-result disambiguation only, not specifically for AI-answer citation | P2 | Pass | 05-geo | — |
| GEO-09 | AI-citation measurement has exactly two first-party surfaces today, both impressions-only; treat every third-party "AI visibility" percentage as Tier 3/4 unless its methodology is disclosed | P2 | Unverified | 05-geo | — |
| GEO-10 | Content Signals (`Content-Signal:`) express a legal preference, not a technical access control — do not claim any AI vendor enforces it | P3 | Pass | 05-geo | — |
| GEO-11 | The IETF `aipref` working group is an active, non-final standards effort — never cite its drafts as ratified | P3 | N/A | 05-geo | — |
| GEO-12 | Passage-level citability guidance is Tier 3 at best — always name the specific study, its date, and its sample size, never present it as vendor-documented | P3 | N/A | 05-geo | — |
| GEO-13 | Markdown content negotiation (`Accept: text/markdown`) is a real, tested capability ahead of common practice — do not claim a citation benefit no vendor documents | P3 | Partial | 05-geo | #32 |
| GEO-14 | The agent-discovery `Link` header and `.well-known/api-catalog` are RFC-compliant, but AI-vendor consumption is unconfirmed — don't overstate what they achieve | P3 | Pass | 05-geo | — |
| PERF-01 | Largest Contentful Paint: ≤ 2500 ms at p75, per device | P1 | Partial | 06-perf | #14 |
| PERF-02 | Interaction to Next Paint: ≤ 200 ms at p75, per device | P1 | Pass | 06-perf | — |
| PERF-03 | Cumulative Layout Shift: ≤ 0.1 at p75, per device | P1 | Pass | 06-perf | — |
| PERF-04 | Field data (CrUX/RUM) is authoritative for pass/fail; lab data is for pre-merge regression detection and debugging only | P1 | Partial | 06-perf | #16 |
| PERF-05 | Never lazy-load or client-inject the LCP resource; mark it `fetchpriority="high"` | P1 | Unverified | 06-perf | — |
| PERF-06 | Report Core Web Vitals as a ranking tiebreaker among comparably relevant results, not a guaranteed ranking boost | P1 | Fail | 06-perf | #8 |
| PERF-07 | The JS bundle-budget CI gate must actually fail a build on an absolute-budget breach, not warn-only | P1 | Fail | 06-perf | #5 |
| PERF-08 | Serve images in modern formats (WebP/AVIF), not unconverted JPEG/PNG | P2 | Pass | 06-perf | — |
| PERF-09 | Responsive `sizes` must match the image's actual rendered width at each breakpoint | P2 | Unverified | 06-perf | — |
| PERF-10 | Font loading must not cause a visible layout shift or block first paint of LCP text | P2 | Pass | 06-perf | — |
| PERF-11 | Third-party scripts must be non-blocking, non-duplicative, and covered by a measurable budget | P2 | Partial | 06-perf | #27 |
| PERF-12 | Field-data ingestion must reach every surface that needs it, not dead-end in a single admin dashboard | P2 | Fail | 06-perf | #16 |
| PERF-13 | Lab-based CI performance gates must be able to fail a build, not warn-only on every assertion | P2 | Fail | 06-perf | #5 |
| PERF-14 | RUM web-vitals reporting needs test coverage and should not depend on a single sink | P3 | Fail | 06-perf | #16 |
| PERF-15 | Every LCP-candidate image's `priority`/`sizes` correctness must be verified per file, not sampled | P3 | Unverified | 06-perf | — |
| RENDER-01 | Detail routes must complete their not-found check before any Suspense flush, not return a 200-status `notFound()` page | P0 | Fail | 07-render | #6 |
| RENDER-02 | A 200 status only starts the pipeline; it is not evidence the page will be indexed | P1 | N/A | 07-render | — |
| RENDER-03 | A genuine 404 removes a previously-indexed URL; a brand-new 404 is never indexed in the first place | P1 | Fail | 07-render | #6 |
| RENDER-04 | 410 signals deliberate, permanent removal — prefer it over 404 for content intentionally deleted | P1 | Partial | 07-render | #1 |
| RENDER-05 | Sustained 503/429 eventually drops previously-indexed URLs, with no fixed published day-count | P1 | Unverified | 07-render | — |
| RENDER-06 | Send `Retry-After` on every 503 and 429 response | P1 | Partial | 07-render | #9 |
| RENDER-07 | Content depending solely on client-side JavaScript execution carries real indexing risk | P1 | Pass | 07-render | — |
| RENDER-08 | Do not build new dynamic-rendering infrastructure — Google has deprecated it, but Bing has not | P1 | Pass | 07-render | — |
| RENDER-09 | 429 is a server-overload signal that throttles crawl rate, not a removal trigger by itself | P2 | N/A | 07-render | — |
| RENDER-10 | `dynamicParams` defaults to `true`: unknown params are still rendered, not auto-404'd | P2 | Fail | 07-render | #6 |
| RENDER-11 | ISR treats 404 and 410 as normal, cacheable statuses — ISR itself is not the culprit in RENDER-01 | P2 | Unverified | 07-render | — |
| RENDER-12 | Read `x-vercel-cache` + `age` + `x-nextjs-stale-time` together — `Cache-Control` alone is uninformative on Vercel | P2 | Unverified | 07-render | — |
| RENDER-13 | `Vary` determines the cache key; get it wrong and a shared cache serves the wrong representation to the wrong audience | P2 | N/A | 07-render | — |
| RENDER-14 | Content freshness follows stale-while-revalidate, not always-fresh — verify the actual revalidation configuration, not a comment describing it | P2 | Unverified | 07-render | — |
| RENDER-15 | Never state a fixed render-queue or "second wave" delay — Google deliberately gives no number | P3 | N/A | 07-render | — |
| RENDER-16 | Support conditional GET so unchanged pages can return 304 without altering indexed content | P3 | Pass | 07-render | — |
| RENDER-17 | `stale-while-revalidate` and `stale-if-error` are formally defined `Cache-Control` extensions with their own numeric semantics | P3 | N/A | 07-render | — |
| MIG-01 | A previously-indexed URL 404ing instead of 301ing is a time-decaying, only-partially-recoverable loss | P0 | Fail | 08-mig | #1 |
| MIG-02 | A redirect loop is a total outage for every URL caught in it | P0 | Pass | 08-mig | — |
| MIG-03 | Implement permanent URL changes as server-side 301/308, never client-side | P1 | Pass | 08-mig | — |
| MIG-04 | Reserve 302/307 for genuinely temporary changes, never as a hedge | P1 | Pass | 08-mig | — |
| MIG-05 | Pick the redirect status code that matches the endpoint's method/body-preservation contract | P1 | N/A | 08-mig | — |
| MIG-06 | Redirect every changed URL directly to its final destination in one hop | P1 | Unverified | 08-mig | — |
| MIG-07 | Map every old URL to its single most relevant new equivalent; never funnel unrelated URLs to the homepage | P1 | N/A | 08-mig | — |
| MIG-08 | When there is no equivalent new page, return a real 404/410 — never redirect to something irrelevant to avoid a 4xx | P1 | Partial | 08-mig | #1 |
| MIG-09 | Keep every migration redirect live for at least a year, tracked against a dated cutover log | P1 | Unverified | 08-mig | — |
| MIG-10 | Explicitly set the permanence flag on every Next.js/Vercel redirect; both map "permanent" to 308, not 301 | P1 | Pass | 08-mig | — |
| MIG-11 | Communicate ranking recovery as weeks-to-months, a range, not a guarantee — and never confuse it with the redirect-retention clock | P2 | N/A | 08-mig | — |
| MIG-12 | There is no fixed "percentage of link equity lost" through a redirect — never state one | P2 | Pass | 08-mig | — |
| MIG-13 | Use the Change of Address tool only for full domain-to-domain moves, as a signal accelerator on top of 301s already live — never as a substitute for them | P2 | N/A | 08-mig | — |
| MIG-14 | Bing needs the same 301s as Google plus its own Site Move notification, and the notification is a one-shot action for six months | P2 | N/A | 08-mig | — |
| MIG-15 | 404 and 410 are handled almost identically by Google's mid/long-term pipeline; 410 is only marginally faster | P3 | Partial | 08-mig | #1 |
| MEAS-01 | Verify the whole production domain as a GSC Domain property, not just a URL-prefix property | P1 | Pass | 09-meas | — |
| MEAS-02 | There is no bulk index-coverage API; do not design monitoring that assumes one | P1 | Pass | 09-meas | — |
| MEAS-03 | Archive Performance-report data before it ages out of the 16-month rolling retention window | P1 | Fail | 09-meas | #13 |
| MEAS-04 | GA4 SPA page-view counting depends on a live console toggle that no test or code enforces | P1 | Unverified | 09-meas | — |
| MEAS-05 | IndexNow reaches Bing/Yandex/Seznam/Naver only — never treat it as notifying Google | P2 | Partial | 09-meas | #23 |
| MEAS-06 | GSC's Position metric is a blended average, not a point-in-time rank | P2 | Fail | 09-meas | #24 |
| MEAS-07 | The Page Indexing report is a capped, non-exhaustive sample — use URL Inspection for single-URL truth | P2 | Pass | 09-meas | — |
| MEAS-08 | GSC omits anonymized long-tail queries below a rolling threshold — treat query-level totals as a lower bound | P2 | Pass | 09-meas | — |
| MEAS-09 | The Performance report's most recent data is provisional for hours, not days — exclude it from drift comparisons until finalized | P2 | Pass | 09-meas | — |
| MEAS-10 | GSC clicks and GA4 sessions measure different events and will never reconcile — track the ratio, not the delta | P2 | Partial | 09-meas | #30 |
| MEAS-11 | GA4's Search Console integration cannot attribute a conversion to a specific query | P2 | N/A | 09-meas | — |
| MEAS-12 | GA4 privacy thresholding can silently withhold organic-search rows — a missing row is not necessarily a traffic drop | P2 | Unverified | 09-meas | — |
| MEAS-13 | CrUX field data requires a minimum-traffic eligibility threshold — absence of a record is not a bad score | P2 | Pass | 09-meas | — |
| MEAS-14 | CrUX API and BigQuery differ in URL resolution and lag — use the right one for the question being asked | P2 | Pass | 09-meas | — |
| MEAS-15 | Search Analytics API exports are capped at 50,000 rows/day/site/search-type — paginate and terminate cleanly | P2 | Partial | 09-meas | #25 |
| MEAS-16 | Check Bing's URL Submission API quota programmatically — do not hardcode a figure | P3 | N/A | 09-meas | — |
| MEAS-17 | The unified Search Console "Page Experience report" was retired in November 2024 — update stale references | P3 | Pass | 09-meas | — |
| GOV-01 | A CI check only blocks anything if it is a required status check on a protected branch | P0 | Fail | 10-gov | #5 |
| GOV-02 | A package's own passing test script is not "enforced" unless a CI job's scope actually reaches it | P1 | Fail | 10-gov | #5 |
| GOV-03 | Gating a merge on a Lighthouse (or any) score threshold, and choosing the score, is a team's own policy decision | P1 | Fail | 10-gov | #5 |
| GOV-04 | Every page emitting JSON-LD needs a CI test asserting syntactic validity and required-property presence | P1 | Fail | 10-gov | #5 |
| GOV-05 | JSON-LD field values must be checked for equality against their CMS source fields, distinct from full truthfulness | P1 | Fail | 10-gov | #5 |
| GOV-06 | A feature-flagged absolute-budget gate that ships default-off must document why, and for how long | P2 | Pass | 10-gov | — |
| GOV-07 | Redirect-map integrity belongs in a pre-deploy CI gate, not left to production 404s to reveal | P2 | Fail | 10-gov | #5 |
| GOV-08 | Split CI checks by failure domain: pre-deploy gates a build artifact; post-deploy monitoring only alerts | P2 | Pass | 10-gov | — |
| GOV-09 | Re-run mechanically-testable invariants against the live site on a schedule, not only at deploy time | P2 | Partial | 10-gov | #5 |
| GOV-10 | The publishing checklist's mechanically-checkable items must be hard CMS blocks, not advisory copy | P2 | Fail | 10-gov | #5 |
| GOV-11 | Lighthouse CI can be configured to fail a build on a category-score threshold | P3 | Pass | 10-gov | — |
| GOV-12 | Every CI gate, checklist requirement, and monitoring job needs one named, accountable owner | P3 | Fail | 10-gov | #5 |
| SEM-01 | Never serve different content to crawlers than to users, including via accessibility-hidden markup | P0 | Pass | 11-sem | — |
| SEM-02 | Every indexable page must render at least one real heading element in the crawlable response — zero headings is a distinct, real defect from "too many" | P1 | Fail | 11-sem | #18 |
| SEM-03 | Style one heading unambiguously as the page's most prominent, for title-link generation, not for HTML validity | P1 | Unverified | 11-sem | — |
| SEM-04 | Content collapsed for UX (accordions, tabs) is not devalued, provided it is genuinely present in the initial DOM | P1 | Pass | 11-sem | — |
| SEM-05 | Every content-bearing image has accurate, descriptive `alt` text — an image-understanding input, not a ranking factor | P2 | Unverified | 11-sem | — |
| SEM-06 | When an image is the sole content of a link, its `alt` text becomes that link's anchor text | P2 | Pass | 11-sem | — |
| SEM-07 | Links are real `<a href="...">` elements with descriptive text, never `onclick`-only navigation | P2 | Pass | 11-sem | — |
| SEM-08 | Multiple `<h1>` elements are permitted; do not treat H1 count as an HTML-validity or ranking rule | P3 | Pass | 11-sem | — |
| SEM-09 | Genuinely tabular data (pricing tiers, comparison grids, spec sheets) uses real `<table>`/`<th>` markup, with `scope`/`headers` where the association isn't visually obvious | P3 | Partial | 11-sem | #35 |
| SEM-10 | Set `<html lang>` accurately, but do not claim it is Google's language-detection mechanism | P3 | Pass | 11-sem | — |
| SEM-11 | Use `<main>`/`<article>`/`<nav>` for their structural purpose; do not claim a documented ranking or AI-citation boost for doing so | P3 | Pass | 11-sem | — |
| SEM-12 | ARIA attributes are added only for their accessibility purpose, never for an SEO or AI-extraction benefit | P3 | Pass | 11-sem | — |

#### Conditional modules (98 rules — compact block)

Every rule in C1–C5 is `N/A` for CleanStart by construction (`00-index.md` §2): the site is single-locale, non-commerce, single-location, well under the programmatic/faceted URL-count threshold, and not a news publisher. None of these conditions is a close judgment call. See `## Assurance levels` below for the caveat that this range has not been through the same adversarial re-verification as the core modules.

| Module | Prefix | Rule range | Count | Verdict |
|---|---|---|---|---|
| C1 — International & hreflang | INTL | INTL-01–22 | 22 | N/A |
| C2 — E-commerce | ECOM | ECOM-01–19 | 19 | N/A |
| C3 — Local | LOCAL | LOCAL-01–22 | 22 | N/A |
| C4 — Programmatic & faceted | PROG | PROG-01–18 | 18 | N/A |
| C5 — News & publisher | NEWS | NEWS-01–17 | 17 | N/A |
| **Total** | | | **98** | |

---

## Ranked gap backlog

Sorted by severity, then by effort ascending within each severity — cheap P0s first. Several entries close more than one rule ID at once because they share a single root cause; each says so explicitly. Effort: **S** ≤2h · **M** ≤1d · **L** >1d.

#### Severity tier: P0

#### 1 — Twelve legacy Webflow URLs 404 instead of redirecting, and the built-in 410 option is unused

What's wrong: 12 of the 13 documented legacy URLs (`/acceptable-use-policy`, `/leadership`, `/search`, `/survey`, both webinar-detail slugs, both new-year-event pages, and four Hitachi/Raksha event pages) return a bare 404 — none has a row in the CMS `redirects` table. The 13th, `/pricing`, correctly returns 200 because it was later built as a real page.

Why it matters: a bare 404 on a previously-indexed URL reads to Google as "content is gone" — the URL drops from the index and crawl frequency to it decays the longer it sits, and Search Console's own guidance warns that adding the redirect later "delay[s] the recrawl attempt, possibly for a very long time." Every day this sits open compounds the loss rather than merely continuing it. Separately, the CMS's `redirects` collection already supports a genuine `410` status as a one-field, zero-extra-engineering choice — for any of these twelve with no true modern equivalent, that stronger "confirmed gone" signal is sitting unused.

The fix: add the 13 rows to the CMS `redirects` collection — 301/308 to a real modern equivalent for each URL that has one (the mapping already exists from the original pre-launch audit's Task 0.1 table), 410 for any that genuinely doesn't.

Effort: **S**
Closes: `ARCH-01`, `MIG-01`, `MIG-08`, `MIG-15`, `RENDER-04`

#### 2 — `/email-signatures`'s `Disallow` silently defeats its own `noindex` signals

What's wrong: `robots.txt` disallows `/email-signatures`; the listing page and slug route each separately carry `noindex` (a meta tag and an `X-Robots-Tag` header). Google can only read a `noindex` directive by fetching the page, and the `Disallow` on that same path prevents the fetch — so if any external link ever surfaces one of these URLs, the `Disallow` is, today, the only thing actually keeping it out of the index.

Why it matters, framed the way it deserves: this is not carelessness. Three real layers of protection were deliberately built for a page that lists direct-dial numbers for the whole company — the code comment literally documents the intent as "three layers." The failure is genuinely counter-intuitive: `Disallow` + `noindex` reads like belt-and-suspenders, but the belt cuts the suspenders here — Google's own docs say a `Disallow`'d page's directives "will not be found and will therefore be ignored," and no audit tool flags the *combination* as a single issue, which is exactly why a clean tool report would miss this.

The fix: drop the `Disallow: /email-signatures` line and rely on the two `noindex` signals already correctly implemented — or, if crawler access itself must be blocked (this directory's sensitivity argues for it), replace the `Disallow` with a real access barrier and keep `noindex` as defense-in-depth on top, matching the `/preview` route's own pattern.

Effort: **S**
Closes: `CRAWL-01`, `CRAWL-04`

#### 3 — No uptime monitor watches `/robots.txt` for a 5xx

What's wrong: production monitoring covers exactly two URLs (`/api/health`, `/`); a transient 5xx on `/robots.txt` during a bad deploy would trigger no alert.

Why it matters: RFC 9309 and Google's crawling docs treat a robots.txt server error as "disallow the entire site" for up to 12 hours, then serve the last-known-good copy for up to 30 days while retrying — a one-route deploy blip becomes a sitewide crawl-blocking event with no one told it happened.

The fix: add `/robots.txt` as a third BetterStack HTTP monitor, alerting on any non-2xx/non-404 response.

Effort: **S**
Closes: `CRAWL-02`

#### 4 — `NOINDEX_HOSTS` is a correctly-empty array with nothing enforcing it gets repopulated

What's wrong: the exact-match noindex host list is `[]` today, which is correct now that `staging.cleanstart.com` is gone — but nothing would catch a future non-production custom domain being pointed at a branch without someone remembering to add it back, and Vercel's own docs name exactly that scenario as the one gap its automatic preview-noindex doesn't cover.

Why it matters: the token-gated `/preview` barrier and the `.vercel.app` suffix-match noindex are both real and working; the residual risk is narrow but the control that would catch it is silently indistinguishable from "there is nothing to worry about" today.

The fix: add a code comment at the declaration documenting the Vercel custom-domain gotcha explicitly, and a lint/test that fails loudly if a new non-production domain is wired into DNS/Vercel without a matching entry.

Effort: **S**
Closes: `CRAWL-03`

#### 5 — Nothing actually blocks a merge: no branch protection, and every existing CI gate is warn-only or never invoked

What's wrong, in full: `gh api .../branches/{main,development}/protection` returns `404 "Branch not protected"` for both branches — no required status check exists anywhere, so a red CI job blocks nothing. On top of that: `packages/schema`'s ~65 test assertions (JSON-LD validity, rich-result linting, CMS-field-equality checks) never run in any workflow, because `apps/web/vitest.config.ts`'s `include` glob never reaches `packages/schema`; Lighthouse CI's `seo`/`performance` category assertions are all `"warn"`, not `"error"`, with no comment recording that as a deliberate, dated choice; the JS bundle-budget's absolute ceiling only fires under `STRICT_BUNDLE_BUDGET=1`, which no workflow sets; the CMS publish-gate hook marks its `seo.title`/`seo.description` presence checks `severity: 'warn'`, so a document can publish with neither field set; no CI step validates the redirect map for cycles or unresolved destinations before merge; no scheduled job re-checks any of these invariants against the live, CMS-editable site between deploys; and none of these gates has a named, accountable owner.

Why it matters: this is the single biggest lesson of the whole conformance pass. CleanStart has genuinely good SEO tests and a genuinely built CI pipeline — and almost none of it is wired to actually stop a bad change from shipping. A green check, a passing local test, and an enforced gate are three different things, and only a required status check on a protected branch is the third one.

The fix, roughly in the order that unblocks the rest: (1) turn on branch protection on `main` (and `development`) with the existing `web`/`ci` workflow jobs as required status checks; (2) run `packages/schema`'s own `vitest run` in CI (its own step, or folded into `apps/web`'s include glob); (3) flip the Lighthouse `categories:seo`/`categories:performance` assertions to `error`, or explicitly document `warn` as a dated, deliberate tradeoff the way the bundle-budget script already documents its own gap; (4) set `STRICT_BUNDLE_BUDGET=1` in the `web.yml` workflow; (5) change `publish-gate.ts`'s `seo-title`/`meta-description` checks from `'warn'` to `'blocker'`; (6) add a CI script that loads the redirect map as a graph and fails on any cycle or unresolved destination; (7) name an owner per gate in `CLAUDE.md`'s background-jobs table.

Effort: **M**
Closes: `GOV-01`, `GOV-02`, `GOV-03`, `GOV-04`, `GOV-05`, `GOV-07`, `GOV-09`, `GOV-10`, `GOV-12`, `PERF-07`, `PERF-13`, `SCHEMA-14`

#### 6 — Nine detail-page templates serve HTTP 200 for a slug that doesn't exist

What's wrong: all nine `[slug]` detail routes (blogs, event, author, guide, job, news, resources, knowledge-hub, legal) return `200`, not `404`, for a deliberately invalid slug, confirmed live. The not-found UI renders correctly and even carries a `noindex` meta tag — but the HTTP status itself never changes.

Why it matters: this is a Next.js App Router streaming mechanic, not a logic bug — once a Suspense fallback (a route-level `loading.tsx`, or a suspending Server Component) flushes, response headers are already sent and the status is locked at 200 for the rest of the request, regardless of what `notFound()` does afterward. Google names this exact pattern — a JS-rendered app returning 200 for an error state — as a primary, documented cause of soft 404s, which "continue to be crawled, and waste your budget" indefinitely instead of being dropped and recrawled less often like a genuine 404. `dynamicParams: true` (the default, present on all nine routes) compounds this: unknown params are still rendered on demand rather than auto-404'd, so every fabricated or mistyped slug hits this exact path.

The fix: on each of the nine routes, move the existence-check data fetch (and the `notFound()` call it feeds) ahead of any `await` or Suspense boundary that can suspend — before the route's own `loading.tsx` or any suspending child renders a fallback. A fix inside `generateMetadata` alone will not work: metadata resolution is independent of the page body's streaming timeline (already tried once on this codebase and confirmed not to fix it). Add a test per route asserting the resulting HTTP status for a known-invalid slug, since none exists today.

Effort: **L**
Closes: `RENDER-01`, `RENDER-03`, `CRAWL-11`, `RENDER-10`

#### Severity tier: P1

#### 7 — robots.txt's Content-Type omits an explicit charset

What's wrong: `/robots.txt` serves `Content-Type: text/plain` with no `; charset=utf-8` parameter. Not a live defect (the file is pure ASCII today), but the header doesn't declare the encoding RFC 9309's spirit recommends.

Why it matters: if a future edit ever introduces a non-ASCII character, an undeclared charset is the difference between a crawler correctly parsing the file and silently mis-decoding it.

The fix: add `; charset=utf-8` to the `Content-Type` header in `robots.txt/route.ts`.

Effort: **S**
Closes: `CRAWL-05`

#### 8 — Internal docs overstate Core Web Vitals as a confirmed, strengthened ranking factor

What's wrong: the architecture doc states CWV is "a confirmed Google ranking factor... strengthened in the March 2026 core update" with no citation, and separately claims "CI blocks PRs that regress against thresholds" — false as implemented (see #5). Two client-facing comparison briefs repeat the ranking-factor claim without the relevance-first/tiebreaker qualifier Google's own documentation requires.

Why it matters: Google's own words are explicit that CWV is a tiebreaker among comparably relevant results, not a factor weighted anywhere near relevance — overstating it either sets a false expectation for a client, or gets an engineering team to deprioritize a genuinely good UX fix once the ranking story turns out to be smaller than advertised.

The fix: edit `cleanstart-cms-architecture.html` and the two `cleanstart-vs-webflow-comparison` briefs to state the tiebreaker framing with the correct citation, and remove the unsupported "strengthened in March 2026" and "CI blocks PRs" claims.

Effort: **S**
Closes: `PERF-06`

#### 9 — `/api/revalidate`'s 503 has no `Retry-After`

What's wrong: the one crawler-facing 503 (`email-signatures/[slug]`) correctly sets `Retry-After: 30`; the CMS-outage 503 branch on `/api/revalidate` does not.

Why it matters: minor — this endpoint is POST-only and outside Googlebot's GET-based crawl path — but any automated caller (the CMS's own webhook retry, a monitoring probe) is left guessing the retry window.

The fix: add a `Retry-After` header to the unset-secret 503 branch in `api/revalidate/route.ts`.

Effort: **S**
Closes: `RENDER-06`

#### 10 — Organization/WebSite JSON-LD is emitted globally, including onto the noindex'd `/email-signatures` page

What's wrong: `RootLayout` renders the site-wide `Organization`/`WebSite` graph on every route with no per-page opt-out, so it appears even on `/email-signatures`.

Why it matters: low practical risk today — Google cannot fetch a `Disallow`'d page to read its structured data at all (see #2) — but it's a hygiene gap against the rule's own "no access-blocked page carries structured data" acceptance criterion, and it stops being moot the moment #2's `Disallow` line is removed.

The fix: scope `JsonLdGraph`'s site-wide emission to skip routes flagged `noindex`, ideally landing alongside #2's fix.

Effort: **S**
Closes: `SCHEMA-02`

#### 11 — Organization logo is 96px tall, under the 112×112 floor

What's wrong: the sitewide `Organization.logo` emits `width: 459, height: 96` — clears the width floor, fails the height floor Google states for Knowledge Panel eligibility.

Why it matters: this is the one concrete, field-checkable defect in an otherwise clean `Organization` implementation; a too-short logo can disqualify the image from Knowledge Panel display.

The fix: supply a square or near-square logo variant ≥112×112px and point `orgConfigFromDefaults()`/the hardcoded fallback at it.

Effort: **S**
Closes: `SCHEMA-05`

#### 12 — Article/BlogPosting field accuracy was never spot-checked against real edits

What's wrong: required fields are present on every applicable template, but whether `author.name` ever picks up a title/affiliation, and whether `dateModified` reflects real edits rather than a build timestamp, was not verified at the field level in this pass.

Why it matters: a `dateModified` that silently tracks build time instead of real content changes is exactly the "freshness-spoofing" pattern Google's content-quality guidance treats as misleading.

The fix: spot-check `author.name`/`dateModified` on a handful of recently-edited documents against CMS history; this becomes a standing check once #5's schema-field-equality tests (`GOV-05`) run in CI.

Effort: **S**
Closes: `SCHEMA-06`

#### 13 — GSC Performance data has no export path before it ages out at 16 months

What's wrong: no export job, BigQuery configuration, or scheduled archive of GSC Performance data exists anywhere in the codebase.

Why it matters: Search Console keeps only a rolling 16 months with no recovery path once data ages out — a BigQuery export only captures data forward from the day it's enabled, so this has to be provisioned before anyone asks for multi-year trend data, not after.

The fix: enable GSC's native BigQuery bulk export (or build a scheduled API pull) for `sc-domain:cleanstart.com` now, while the site's GSC history is still young.

Effort: **M**
Closes: `MEAS-03`

#### 14 — Mobile LCP sits in the "Needs Improvement" band

What's wrong: real CrUX field data (captured 2026-07-29) shows origin-level mobile LCP at 2784ms and home-page mobile LCP at 2620ms — both over the 2500ms "Good" threshold. Desktop is Good on both.

Why it matters: this is the one Core Web Vital genuinely failing at p75 today, grounded in real field data, not a lab guess — mobile is the majority of most sites' traffic.

The fix: profile the mobile LCP path (the decorative hero SVG is the documented LCP element per prior investigation) and apply the standard levers already used elsewhere on the site (fetchpriority, format/size, reduced above-the-fold complexity).

Effort: **M**
Closes: `PERF-01`

#### 15 — No cron monitors closed job requisitions for stale `JobPosting` markup

What's wrong: `JobPosting` renders correctly on every open requisition, but no job in `apps/cms/src/payload/jobs/` expires or removes the markup when a requisition closes.

Why it matters: Google ties this specific structured-data type to manual-action risk more directly than most others — "failure to take timely action on expired jobs may result in a manual action," a real, sitewide rich-result penalty.

The fix: add a thirteenth cron job (mirroring the existing twelve, `PAYLOAD_AUTO_RUN`-gated, with its own test) that sets `validThrough` or unpublishes/410s a job document once its requisition closes.

Effort: **M**
Closes: `SCHEMA-07`

#### 16 — CrUX/RUM field data is fetched but never reaches a surface engineers actually look at

What's wrong: the daily CrUX cron queries origin-level data only — the per-URL code path exists but both real call sites pass a hardcoded empty array, so it never executes — and the result is consumed exclusively by a CMS-admin-only dashboard; `apps/web` engineers have zero visibility into it. Separately, the client-side RUM component forwards metrics to exactly one sink (Sentry, gated on Performance consent), has no test coverage, and no fallback if that sink is degraded.

Why it matters: the field-data rule this closes requires field data to be the actual pass/fail authority — structurally impossible today for anyone outside the CMS admin, and a per-template regression is invisible until someone happens to open that one dashboard.

The fix: parameterize at least one real call site to pass real high-traffic URLs into `fetchCrux()`; surface the result somewhere `apps/web` engineers see it; add a test for the RUM component's metric-forwarding logic and document the single-sink risk as a deliberate choice.

Effort: **M**
Closes: `PERF-04`, `PERF-12`, `PERF-14`

#### 17 — The CMS's own JSON-LD dispatcher is a second, fully-built pipeline that never reaches a crawler

What's wrong: the CMS schema dispatcher (`dispatch.ts`, the `/api/jsonld` endpoint, the `schemaAddons` field on nine collections) is real, tested, and validates correctly in the CMS's own preview UI — and `apps/web` calls it zero times. An editor filling in a `schemaAddons` block sees it save and preview successfully; it never appears in a single byte of the live page.

Why it matters: this is the sharpest editor trap in the whole conformance pass — the admin UI actively looks functional for something with no live effect, and nothing about the preview would ever reveal that to the person using it.

The fix: pick one direction deliberately — either wire `schemaAddons` into the actual render path (`packages/schema`'s `composeGraph`), or remove the dispatcher, field, and its ~30 associated test files and redirect authoring toward `seo.additionalSchema`, the one CMS schema field genuinely wired end-to-end today.

Effort: **L**
Closes: `SCHEMA-03`

#### 18 — Client-side-only listing pagination breaks discoverability, breadcrumbs, and headings together on the same templates

What's wrong: `/events`, `/news`, `/blogs`, `/resource-center`, and `/guide` paginate and filter entirely client-side — a `"use client"` component reading `useSearchParams()` inside a `<Suspense>` boundary whose server-rendered fallback is page 1 only. Measured real `<a href>` anchors versus each collection's sitemap count: `/events` 0/23, `/news` 1/33, `/blogs` 9/68, `/resource-center` 9/30, `/guide` 16/51 — every item past page 1 has zero qualifying inbound link from its own hub page. For three of those same templates (`/events`, `/news`, and sibling `/webinars`), the same client boundary swallows the hero itself, so the page ships zero real `<h1>` tags and no `BreadcrumbList` in the raw HTTP response — the heading text exists only inside the React Server Component flight-data payload, never as parseable HTML. `/careers` is the clean control: it links every item in real server-rendered HTML with no client-side pagination gate, proving this is a fixable implementation choice on five collections, not an architectural limit.

Why it matters: every affected item stays sitemap-discoverable, so this isn't an indexation-blocking defect — but it forfeits the internal-link/anchor-text relevance signal Google's docs tie to indexed pages, and for the three zero-heading templates it also removes a documented title-link fallback input and the desktop SERP breadcrumb display entirely. It's the single largest reachability gap in this pass by URL count — well over 100 detail pages across five collections reachable only via sitemap, never navigation.

The fix: hoist each collection's first-page item list (and, for events/news/webinars, the hero heading and breadcrumb) out of the client-only Suspense boundary into server-rendered HTML, mirroring `/careers`'s existing pattern. Keep client-side state for page 2+ and filter interactions, which don't need to be crawlable.

Effort: **L**
Closes: `ARCH-03`, `ARCH-04`, `ARCH-05`, `ARCH-08`, `META-02`, `SEM-02`, `SCHEMA-10`

#### Severity tier: P2

#### 19 — Three residual gaps in CMS `seo.*` field-wiring

What's wrong: `author/[slug]` is the one CMS-backed detail route that never calls the shared `resolveCmsSeo()` resolver, so an author's own SEO override is silently ignored; a dead function (`verification.ts#siteVerification()`) carries a docstring that contradicts the actual call graph; and three CMS `seo.*` fields (`robotsAdvanced`, `alternates`, `customTags`) sit in the editor UI looking identical to functional fields while no code path reads them.

Why it matters: these are the last edges of the exact "editor trap" the original pre-launch audit flagged as its single biggest finding — that finding is now mostly resolved (see the reconciliation section), and these three loose ends are what's left.

The fix: add the missing `resolveCmsSeo()` call to `author/[slug]/page.tsx`; delete `siteVerification()` (or correct its docstring); mark `robotsAdvanced`/`alternates`/`customTags` as "not yet wired" in the admin UI, or wire them to match the effort already spent on `additionalSchema`.

Effort: **S**
Closes: `META-10`, `META-14`, `META-15`

#### 20 — Legal-document descriptions are a name-substitution template, plus inaccurate length-limit comments

What's wrong: every `/legal/*` document's description reads "{Document Name} — CleanStart legal documents." — technically unique per document, but exactly Google's named "boilerplate repetition" rewrite trigger. Separately, the CMS's own title/description length-counter components carry code comments stating "Google typically truncates titles around 60 characters" as fact, when Google's documentation states no such number.

Why it matters: `/privacy-policy` — same legal family, different route — already proves the fix: a substantive, non-templated one-sentence summary. The comment issue is smaller but real: a future engineer trusting the comment over Google's actual documentation propagates a stale "fact" forward.

The fix: rewrite each `/legal/*` document's description to a real summary sentence (mirroring `/privacy-policy`); reword the `SeoTitleField`/`SeoDescriptionField` comments to label 60/160 as this SOP's own advisory convention, not an attributed Google behavior.

Effort: **S**
Closes: `META-05`, `META-06`, `META-07`

#### 21 — No robots.txt `Disallow` for listing-page filter/pagination query parameters

What's wrong: listing pages self-canonicalize every `?page=`/`?category=`/`?q=` variant to a clean base path — the documented secondary control — but robots.txt has no `Disallow` pattern for these parameters, the documented primary control.

Why it matters: at the site's current scale (519 sitemap URLs, roughly 19× under the ~10,000-URL threshold where this starts to matter) exposure is low today — but the primary mechanism is genuinely absent, not a judged non-issue, and the fix is cheap while the site is small.

The fix: add `Disallow` rules for the known query-parameter patterns on listing routes to `robots.ts`.

Effort: **S**
Closes: `CRAWL-15`

#### 22 — `llms.txt` has drifted from the real route inventory

What's wrong: `llms.txt` is static, hand-authored, added once alongside unrelated work, and never synced since — it omits `/pricing`, a real, live, indexable route.

Why it matters: the file's entire stated value is being a curated, accurate index; an out-of-sync one is worse than none at all, since accuracy is its whole premise (no vendor confirms any AI system actually consumes it — so this is a hygiene fix, not a citation-impact one).

The fix: add `/pricing` now, and add a small drift-guard script (mirroring the existing `.well-known/api-catalog` drift test) that fails CI when the file's linked paths diverge from the live route/sitemap inventory.

Effort: **S**
Closes: `GEO-06`

#### 23 — `INDEXNOW_KEY`'s live production value can't be confirmed, and a missing key silently no-ops

What's wrong: the IndexNow publish hook correctly no-ops if `INDEXNOW_KEY` is unset — but nothing surfaces that state, and the key's actual droplet value isn't observable from this codebase.

Why it matters: if the key is ever unset in production, every publish silently stops accelerating Bing/Yandex/Seznam/Naver discovery with zero visible signal that anything changed.

The fix: log the no-op branch in `indexnow-publish.ts` so a missing key is loud, not silent, and confirm the droplet's current value once, out of band.

Effort: **S**
Closes: `MEAS-05`

#### 24 — GSC "Position" is displayed with no blended-average caveat

What's wrong: the admin dashboard's `Pos` column renders a bare number with no tooltip or footnote — and the site's own top-query data shows exactly the low-click/high-impression instability this matters for (`oci image`: position 2.76 on 8 clicks from 1,127 impressions).

Why it matters: GSC's Position is a blended average across every impression/device/location for a query, not a point-in-time rank; presenting it bare invites reading month-over-month movement as a real rank change, which the metric was never built to support.

The fix: add a tooltip/footnote to the Position column stating it's a blended average, and flag it for queries under a low-impression threshold.

Effort: **S**
Closes: `MEAS-06`

#### 25 — No pagination/termination handling exists for Search Analytics exports, ahead of ever needing it

What's wrong: every current GSC call uses small, fixed row limits — orders of magnitude under the real ceilings — so no pagination or clean-termination logic exists.

Why it matters: purely preventative today given current traffic scale, but the day a larger export is built without this, a silent truncation could be misreported as complete data.

The fix: when a larger export is built, terminate cleanly and log explicitly on hitting the row ceiling or a quota response, rather than truncating silently.

Effort: **S**
Closes: `MEAS-15`

#### 26 — `twitter:site` is missing sitewide

What's wrong: the root layout conditionally sets `twitter.site` from the CMS's `seoDefaults.twitterHandle` — but every route calls `buildPageMetadata()`, whose own `twitter` object fully replaces (doesn't merge with) the layout's, so `twitter:site` never survives to the live page.

Why it matters: small but real — the CMS field exists specifically to supply this value, and it's silently dropped on every page.

The fix: add `site` (sourced from the same CMS field) to `buildPageMetadata()`'s `twitter` block.

Effort: **S**
Closes: `META-08`

#### 27 — Third-party script budget explicitly excludes every third-party script from measurement

What's wrong: the one CI-enforced bundle-size budget explicitly skips "external scripts (analytics CDNs etc.)... they're not 'our' bundle" — satisfying none of the "covered by a measurable budget" requirement for third-party code.

Why it matters: third-party JS is a documented, common cause of INP degradation via unthrottled global event listeners — a budget that structurally can't see it provides no backstop against a new vendor tag quietly making every page's interactions worse.

The fix: add a separate, even loosely-thresholded budget or monitor for aggregate third-party transfer size/blocking time.

Effort: **S**
Closes: `PERF-11`

#### 28 — Dead `FAQPage` markup still ships on the home page and every guide detail page

What's wrong: Google fully retired the FAQ rich result for every site type on 2026-05-07; CleanStart still emits `FAQPage` JSON-LD on `/` and `guide/[slug]`.

Why it matters: harmless (no manual-action risk), but confers zero display benefit — pure cleanup, not urgency.

The fix: remove the `FAQPage` JSON-LD emission from the home page and guide-detail builder.

Effort: **S**
Closes: `SCHEMA-11`

#### 29 — `KnowledgeHubArticle`'s breadcrumb bypasses the shared single-source-of-truth builder

What's wrong: every other guarded hero/page drives its visible breadcrumb and JSON-LD `BreadcrumbList` from one shared `breadcrumbTrail()` call, enforced by a fitness test — `KnowledgeHubArticle.tsx` implements its own inline component with a hardcoded "Home"/"Knowledge Hub" text node, and isn't in the fitness test's guarded-file list.

Why it matters: this is a documented, deliberate exception today, but its test-coverage gap is real — a hardcoded "Home" string wouldn't match the guard's regex even if the file were added to the list, so the one place this is allowed to diverge is also the one place nothing would catch it drifting further.

The fix: route the component through `breadcrumbTrail()` (preserving its documented visible/JSON-LD divergence if still wanted) and add it to the fitness test's guarded list.

Effort: **S**
Closes: `ARCH-09`

#### 30 — No GSC-clicks-to-GA4-sessions ratio tracking exists

What's wrong: GSC and GA4 data are fetched through entirely separate integration rows with no code path comparing them — neither the anti-pattern (naively diffing the two) nor the recommended practice (tracking their ratio over time) exists.

Why it matters: the two numbers will never match by design (server-side click logging vs. client-side JS-fired sessions) — the useful signal is a *change* in their ratio, which nothing currently computes.

The fix: add a computed metric (GSC clicks ÷ GA4 organic sessions, same date range) to the analytics dashboard, and alert on a material shift in that ratio rather than the raw numbers disagreeing.

Effort: **M**
Closes: `MEAS-10`

#### 31 — Image alt-text quality was only spot-checked, not scanned sitewide

What's wrong: alt-text *presence* is CI-enforced via Biome's `a11y` rule set on every push/PR — genuinely solid. Alt-text *quality* (descriptive vs. keyword-stuffed vs. filename-as-alt) has no automated check; a 20-file spot-check found no violations, which is not full-site coverage.

Why it matters: presence is the mechanically-enforceable floor; quality is what actually affects Google Images understanding, and it needs either a periodic manual pass or an automated heuristic to close for real.

The fix: run a full axe-core (or equivalent) pass across the built site as a scheduled job, flagging suspicious patterns for editorial review.

Effort: **M**
Closes: `META-09`

#### Severity tier: P3

#### 32 — Markdown content-negotiation handler has no dedicated test

What's wrong: the pure helper functions are unit-tested; the actual wiring — the proxy-level gate and the route handler's path validation/self-fetch/timeout/error-status mapping — has no test of its own.

Why it matters: real, working, ahead-of-common-practice infrastructure with no confirmed AI-vendor benefit (correctly labeled Convention in the rule itself) — the gap is engineering hygiene, not a compliance risk.

The fix: add an integration test exercising the proxy-level gate and the route handler's error paths.

Effort: **S**
Closes: `GEO-13`

#### 33 — Home page's dual metadata definition has no comment explaining which wins

What's wrong: `page.tsx` exports its own `metadata` and the root `layout.tsx` separately exports `generateMetadata()`, both targeting `/` — Next.js's field-by-field replace-not-merge behavior means `page.tsx` wins on every field both define, but no comment says this is intentional.

Why it matters: a future edit to either file can silently flip which one wins, with nothing to catch the regression.

The fix: add a one-line comment stating `page.tsx`'s values are the deliberately-authoritative override for `/`, or remove the duplicate definition if it isn't.

Effort: **S**
Closes: `META-16`

#### 34 — A dead page-level `redirect()` sits alongside the middleware rule that actually runs

What's wrong: `knowledge-hub/page.tsx` and `(legal)/legal/page.tsx` each independently compute a CMS-driven redirect target, but `proxy.ts`'s `SECTION_INDEX_REDIRECTS` intercepts both paths first with a hardcoded target — neither page-level call ever executes in production.

Why it matters: a second, independently-maintained source of truth for the same redirect target is a silent-drift risk — if the CMS ordering the hardcoded `proxy.ts` value assumes ever changes, nothing enforces that the two stay in sync.

The fix: delete the dead page-level calls (or refactor them to defer to the middleware's resolved value), and add a comment/test documenting `proxy.ts` as authoritative.

Effort: **S**
Closes: `ARCH-13`

#### 35 — Pricing/comparison layouts are CSS-grid cards, not real `<table>` markup

What's wrong: `PricingPlans.tsx`, `PricingTiers.tsx`, and `CisoComparison.tsx` — exactly the "pricing tiers, comparison grids" example this rule names — are built as `<div>` grids with only visual alignment; CMS-rendered blog-body tables are real `<table>` markup but never emit `scope`/`headers` on multi-column tables.

Why it matters: the real justification here is programmatic header/data-cell association for any structural parser (screen readers today, plausibly other machine consumers) — not, as sometimes claimed, a Google rich-result hook, which doesn't exist for this markup.

The fix: add `scope`/`headers` to `renderLexical.tsx`'s table output where association isn't visually obvious (cheap); convert the three pricing/comparison components to real `<table>` markup with matching visual styling (larger, a genuine rewrite).

Effort: **M**
Closes: `SEM-09`

---

## Unverified items

Not a failure section — this is the honest edge of what this pass could actually check, grouped by what would close each.

#### Needs exhaustive per-file coverage, not a sample

- **`PERF-05`** (LCP-candidate `priority`/`fetchpriority` correctness) and **`PERF-09`** (responsive `sizes` matching rendered width) — two sampled hero files and a handful of the ~62 `next/image` call sites confirmed correct usage; the rest were not individually read. Re-verification narrowed both: `PERF-05`'s own `Verify` command had a case-sensitivity bug (fixed) and now confirms the homepage's LCP candidate is correct; `PERF-09`'s isolation gap is closed (the one file lacking `sizes=` is `PodcastChannelVideos.tsx`, out of 61 files today, not the "2 of 62" originally recorded). Neither re-check reaches the deeper claim — correctness across every remaining file, not just presence of the attribute. **`PERF-15`** names this exact gap as its own rule (verify by convention vs. by a real check). Closing all three needs either a custom lint rule or a dated full manual pass across every file using the `priority`/`sizes` convention — not another sample.
- **`SEM-05`** (alt-text quality sitewide) — 20 files spot-checked, no violations found; full coverage needs an axe-core (or equivalent) scan, exactly what backlog #31 proposes.
- **`MIG-06`** (redirect map free of multi-hop chains) — the middleware's fixed rule order structurally limits chaining within a single request, but doesn't by itself prove zero chains have crept in across sequential CMS-row edits over time; closing it needs the same redirect-graph script proposed in backlog #5 (`GOV-07`).

#### Requires access to an external console/dashboard this pass didn't have

- **`MEAS-04`** (GA4 Enhanced Measurement "History events" toggle) and **`MEAS-12`** (GA4 thresholding banner) — both are GA4-Admin-UI-only states with no API surface; closing either needs direct GA4 Admin console access, not a code read.
- **`GEO-09`** (GSC Generative AI performance report rollout, Bing Webmaster Tools access) — GSC domain-property access for standard Search Analytics is confirmed live (`MEAS-01`); whether the Generative AI report specifically has rolled out for this property, and whether Bing Webmaster Tools is onboarded at all, needs a login to each console.
- **`RENDER-12`** (what `x-nextjs-stale-time: 300` represents relative to a route's own `revalidate` value) — needs Vercel platform support/documentation beyond what's publicly written, or a controlled revalidate-timing experiment against the live deployment.
- **`RENDER-14`** (whether `/api/revalidate`'s Mode 2 auth path has any external caller) — no in-repo caller exists, but an external one (a manual request, an undiscovered script, an unmatched Payload hook) can't be excluded by static analysis alone. (The podcast page's effective revalidation interval, the other half of this rule in the prior pass, is now traced and closed — re-running the rule's own `Verify` command found no `revalidateSeconds` override in `lib/podcast.ts`'s three `fetchCMS` calls, confirming the true interval is the shared 3600s default and that `page.tsx:31-35`'s "revalidate 60" comment is stale; see `07-rendering-and-delivery.md`.)

#### Depends on a fix landing first

- **`RENDER-11`** (ISR correctly caches a genuine 404 once one exists) — the underlying Vercel platform behavior is documented and not in question; there's simply no route producing a correct 404 yet to observe being cached. Closes automatically once backlog #6 (`RENDER-01`) ships.

#### Needs a live test or a process artifact that doesn't exist yet

- **`RENDER-05`** (sustained 5xx/429 monitoring beyond the homepage/health endpoint) — needs a monitoring change, not a code read. (`RENDER-16`, conditional-GET/304 support, was in this bullet in the prior pass; re-running its own `Verify` command now resolves cleanly to `Pass` — see `07-rendering-and-delivery.md`.)
- **`MIG-09`** (redirect retention against a 365-day floor) — `hitCount`/`lastHitAt` exist on every redirect row, but no dated cutover log exists to check any row's age against; this rule's `Verify` field is now stated as an explicit manual procedure rather than a script path (no such script exists, and none is being authored as part of this documentation pass).
- **`SEM-03`** (heading visual-prominence, not just presence/count) — needs a computed-style spot check against rendered CSS, not a raw-HTML read.

#### Needs review of artifacts outside this codebase

- **`SCHEMA-01`** (no past client-facing deliverable or proposal has been audited for an overstated ranking claim) and **`SCHEMA-13`** (no per-template Rich Results Test/Schema Markup Validator run has been recorded) — both need a document/tool-run audit this pass didn't perform.
- **`SCHEMA-15`** (whether newly-added structured-data properties are checked against the current schema.org release before shipping) — needs a review of the team's own authoring process, not a code read.

---

## Reconciliation with the prior audit

Every finding in `docs/web/SEO-AUDIT-REPORT.md` and `docs/web/SEO-IMPLEMENTATION-PLAN.md` (2026-05-29), mapped. Nothing is dropped silently.

#### Resolved

- Root metadata, shared SEO helper, robots.txt (audit §3 items 1–3) → **Resolved.** Now covered in depth by `CRAWL-*`/`META-01`/`META-03`/`META-04`, all `Pass`.
- XML sitemap covering under 30% of routes (audit §3 item 4, §5; plan Task 0.2) → **Resolved.** `sitemap.ts` now covers 9 CMS collections plus ~27 static routes (`ARCH-10`, Pass); 519 live `<loc>` entries confirmed.
- Default OG image missing (audit §3 item 7; plan Task 0.3) → **Resolved.** Every route's `og:image` resolves to a real absolute HTTPS URL (CMS image or generated `/api/og` card), confirmed live (`META-03`, Pass).
- CMS `seo.*` fields never reaching `apps/web` — the original audit's "4th P0 blocker" (audit §3.2; plan Task 0.5) → **Resolved for the core fields.** `resolveCmsSeo()` now reaches 9 of 10 CMS-backed detail routes; canonical overrides and `additionalSchema` are wired. The residual edges (the `author/[slug]` exception, three still-unwired advanced fields) are real but meaningfully smaller than the original finding, and are tracked as open work under `META-10`/`META-14`/`META-15` (backlog #19) rather than being silently dropped.
- `/knowledge-hub` listing not built (audit §6) → **Resolved.** The route and its detail page both exist.
- Production `*.vercel.app` aliases indexable (audit §3.1, "Gap — indexable") → **Resolved.** `NOINDEX_HOST_SUFFIXES = [".vercel.app"]` now forces noindex regardless of `VERCEL_ENV`, confirmed in code — this exact prior finding is not restated as an open rule anywhere in modules 01–11 because it no longer reproduces.
- Preview-path noindex header/meta consistency (audit §3.1 minor hardening; plan Task 1.6a) → **Resolved.** Every request under `/preview/` gets `X-Robots-Tag: noindex, nofollow, noarchive` at the proxy layer regardless of token validity (`CRAWL-03` — its remaining `Partial` is the unrelated `NOINDEX_HOSTS` empty-array risk in backlog #4, not this gap).
- Careers detail metadata + `JobPosting` schema (audit §6; plan Task 1.2) → **Resolved** for the schema and metadata. `JobPosting` is present and worked-example quality; the *new* residual gap this pass found — no expiry-monitoring cron — is a different defect (`SCHEMA-07`, backlog #15), not a reopening of the original finding.
- Host/trailing-slash/lowercase normalization (audit §8 P1 #9; plan Task 1.6) → **Resolved.** `proxy.ts`'s normalization logic handles both, confirmed under `ARCH-02` (Pass).
- Submit sitemap + verify GSC properties (audit §8 P2 #14; plan Phase 2.4) → **Resolved.** `sc-domain:cleanstart.com` domain-property access is confirmed live with real Search Analytics + URL Inspection data pulled in this pass (`MEAS-01`, Pass).
- Verify Core Web Vitals (audit §8 P2 #13; plan Phase 2.3) → **Resolved as a measurement exercise** — this pass pulled real CrUX field data for the first time. The metrics themselves are not all passing (mobile LCP, backlog #14), which is a new, distinct finding, not a reopening of "we never checked."

#### Superseded / reversed

- `/pricing` — decided not to build, hold a 301 to `/book-a-demo` (audit §4.3, §6; plan Task 1.4) → **Obsolete — reversed.** `/pricing` was later built as a real, live route. The sitemap code comment at `sitemap.ts:71` still calls it "intentionally omitted," which is now itself a small stale-comment defect noted under `ARCH-04`, not a real omission.
- `/webinars/[slug]` — decided not to build (audit §6, §8; plan Task 1.3) → still the current decision; no rule flags this as a gap, since the listing's external join links are the intended design.

#### Open findings, now tracked under a rule ID

- Internal-linking pass, descriptive anchors, breadcrumbs site-wide (audit §8 P2 #11; plan Phase 2.1) → **Open**, now tracked under `ARCH-03`/`ARCH-04`/`ARCH-08` (backlog #18) — the same gap the original audit named in general terms is now root-caused to a specific implementation pattern on five collections.
- Image alt-text audit + decorative `aria-hidden` confirmation (audit §8 P2 #12; plan Phase 2.2) → **Open**, now tracked under `META-09`/`SEM-05` (backlog #31). Alt-text presence is now CI-enforced — a real improvement since the original audit — quality auditing remains open.

#### Out of this SOP's scope, correctly, not by omission

- Tighten thin titles on `/attack-surface-reduction`, `/for-ciso`, `/teams`, `/community` (audit §8 P1 #8; plan Task 1.5) → per-page title copywriting is explicitly excluded from this SOP's non-goals (`00-index.md` §1). Whether these specific titles were rewritten is a content question this conformance pass doesn't track as a rule. Spot check only, not a formal finding: module 03's worked examples show `/attack-surface-reduction`'s live title is now "Reduce attack surface with Hardened Images | CleanStart," not the old truncated "Attack surface" — suggesting this was in fact addressed.
- `manifest.json`/PWA basics (audit §3 item 10, §8 P3 #15; plan Phase 3.1) → **Obsolete for this SOP.** No Tier 1/2 source in this domain ties a web app manifest to any search or AI-extraction consequence; the original audit's own "not an SEO ranking issue; nice-to-have" framing is correct, and this SOP's own scope confirms it rather than dropping the finding silently.
- `llms.txt` / `ai.txt` insurance files (audit §8 P3 #16; plan Phase 3.2) → **Resolved** (`llms.txt` exists, tracked as `Partial` for its drift under `GEO-06`/backlog #22) and **correctly still absent** (`ai.txt`, per `GEO-11` — no ratified standard exists yet for it).
- Post-launch GSC monitoring dashboard for top-impression migrated URLs (audit §8 P3 #17; plan Phase 3.3) → **Partial**, tracked under `GOV-09` (backlog #5's cluster) and `MEAS-09` (Pass) — a content-insights dashboard was built, but no scheduled job re-checks sitemap-vs-route parity or redirect-map integrity specifically against the live site.
- Product/`SoftwareApplication` JSON-LD on product pages (audit §3 item 5, §8 P1 #6; plan Task 1.1) → **Obsolete, not simply resolved.** `SCHEMA-08`'s applicability gate is scoped to pages where a shopper can directly buy or leave a review; CleanStart's product pages are neither checkout-capable nor review-bearing, so this markup doesn't apply under the current SOP's own eligibility test (verdict `N/A`). If informational product markup is still wanted for other reasons, that's a content-strategy decision outside this SOP's technical scope, not a compliance gap the original finding correctly anticipated but the SOP now scopes differently.

---

## Assurance levels

- **Core modules 01–11 (171 rules):** every rule was authored against a primary source, then independently adversarially re-verified — a separate pass whose explicit brief was to try to refute each claim, not confirm it. Every `CleanStart` verdict in this report is grounded in a cited `file:line` reference, a live `curl`/API result recorded in `docs/seo/evidence/`, or both. Adversarial verification found a real, sourced defect — a wrong quote, a fabricated figure, a wrong URL, an incomplete claim, a mis-tiered source — in roughly **one rule in five** during this pass: 33 corrections out of 176 verdicts checked (`docs/seo/evidence/verification-log.md`), all applied before this report was authored. Treat this module range as the SOP's highest-confidence layer.
- **Conditional modules C1–C5 (98 rules, all `N/A` for CleanStart):** researched against primary documentation only. They have **not** been through the same adversarial re-verification pass as 01–11, and have never been checked against a live client of the relevant shape (international, e-commerce, local/multi-location, large-scale programmatic, or news/publisher) — CleanStart is none of these, which is exactly why every rule in this range reads `N/A` here. **Re-verify the specific conditional module against primary sources again, and adversarially, before relying on it for a real client engagement of that type.** The one-in-five defect rate found in the core pass is the concrete reason this caveat matters: research alone, without a dedicated attempt to refute it, misses real, sourced defects at a materially non-trivial rate — there is no reason to expect C1–C5 would fare better un-tested.
- **This report (module 91) itself:** synthesizes verdicts already settled in 01–11 and C1–C5 — it introduces no new verdicts, and re-litigates none. Its own new content — the ranked backlog's effort estimates, the root-cause groupings, the reconciliation mapping — is this author's judgment applied on top of already-verified evidence, not a re-verified claim in its own right, and should be read with that distinction in mind.
