# SEO / AEO / GEO SOP — Operator Checklist

**Module:** 90 — Operator checklist (derived artifact — not a rule module, no rules herein)
**Conventions:** `docs/seo/00-index.md` §2–§8

This is the execution layer. It sequences rules from modules `01`–`11` (and, where triggered, `C1`–`C5`) into the order a person actually runs them across a site's life. It never restates a rule — each line is the rule ID, a one-line pass criterion, and the verification command already defined in that rule's `Verify` field. To understand *why* a line exists, open the cited ID in its home module. If a rule changes there, this checklist is correct again automatically; nothing here needs editing except the ordering itself.

Coverage: every `P0`/`P1` rule in modules `01`–`11` appears at least once below. `P2`/`P3` rules are deliberately omitted from this checklist — they are non-blocking by the severity model in `00-index.md` §5 (scheduled backlog / opportunistic hygiene, not lifecycle-gating), and are worked from the module text and `91-cleanstart-conformance.md`'s gap backlog instead. A rule may appear in more than one stage below when it is both a one-time implementation check and a recurring operational one (e.g. `CRAWL-02`, `SCHEMA-07`) — that is intentional, not a coverage duplicate.

---

## Pre-build

Decisions that are expensive or impossible to reverse once pages exist.

- **ARCH-02** — one canonical path form (trailing slash, case) is chosen and will be applied identically everywhere before the first route ships — `curl -sI https://www.cleanstart.com/About-Us | head -1` → `308` to `/about-us`
- **ARCH-05** — pagination URL/canonical strategy is decided (own URL + self-canonical, or consolidate to a "View All") before the first paginated template is built — `curl -s "https://www.cleanstart.com/blogs?page=2" | grep -o 'rel="canonical"[^>]*'`
- **ARCH-06** — a single crawl-control strategy for filter/facet URLs is chosen before the first facet ships — `curl -sI "https://www.cleanstart.com/blogs?category=nonexistent-xyz" | head -1`
- **CRAWL-03** — non-production environments are designed with an access barrier (auth/token/IP allowlist) as the primary control, not robots.txt/noindex alone — `curl -sI https://www.cleanstart.com/preview/blogs/none | grep -i x-robots-tag`
- **RENDER-07** — the rendering strategy for any indexable, time-sensitive content is chosen so it does not depend solely on client-side JS — `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -c '<h1'`
- **RENDER-08** — no new dynamic-rendering (bot-keyed pre-render) infrastructure is on the architecture plan — `grep -rni "googlebot" apps/web/src --include="*.ts*"`
- **SCHEMA-03** — exactly one JSON-LD composition/dispatch pipeline is planned to reach production; no parallel "schema engine" ships without a served consumer — `grep -rn "api/jsonld" apps/web/src | wc -l` → `0`
- **GOV-01** — branch protection with required status checks is configured on every branch that deploys to production, before real feature work lands on it — `gh api repos/digibranders/cleanstart-website/branches/main/protection`

## Build

Implementation-time rules, checked per page/component/PR as they're built.

- **CRAWL-01** — no URL ships with both a robots.txt `Disallow` and a page-level `noindex` as its only removal method — `curl -s https://www.cleanstart.com/robots.txt | grep 'Disallow: /email-signatures'`
- **CRAWL-04** — robots.txt is used only to manage crawl access/load, never as a de-indexing mechanism — `curl -s https://www.cleanstart.com/robots.txt | grep -c '^Disallow'`
- **CRAWL-05** — robots.txt is served at the exact top-level `/robots.txt` path, UTF-8, `text/plain` — `curl -sI https://www.cleanstart.com/robots.txt | grep -i content-type`
- **CRAWL-06** — meta robots and `X-Robots-Tag` are treated as equivalent, with the most restrictive directive winning on conflict — `curl -sI https://www.cleanstart.com/email-signatures/biswajit-de | grep -i x-robots-tag`
- **CRAWL-07** — no `noindex:`/`nofollow:`/`crawl-delay:` syntax appears in robots.txt — `curl -s https://www.cleanstart.com/robots.txt | grep -i '^noindex'` → empty
- **CRAWL-08** — `max-snippet`/`nosnippet`/`max-image-preview` directives are applied knowing they also gate AI Overviews/AI Mode reuse — `curl -sI https://www.cleanstart.com/ | grep -i x-robots-tag`
- **CRAWL-10** — canonical is never implemented via robots.txt, the URL Removals tool, a URL fragment, or `noindex`-as-substitute, and no page emits conflicting canonical signals across mechanisms — `curl -sI https://www.cleanstart.com/ | grep -i '^link:' | grep -c 'rel="canonical"'`
- **CRAWL-11** — every "not found"/empty-result state returns a real `404`/`410`, never a `200` — `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/blogs/this-slug-definitely-does-not-exist-xyz123`
- **CRAWL-12** — permanent redirects use `301`/`308`; temporary ones use `302`/`307` — never a temporary code by default — `curl -sI https://www.cleanstart.com/blog | grep -iE '^HTTP|^location'`
- **ARCH-01** — every previously-live URL resolves to a real redirect or `410`, never a bare `404` — `curl -sI https://www.cleanstart.com/<legacy-path> | head -1` → `301`/`308`
- **ARCH-03** — every indexable page has a real, server-rendered `<a href>` inbound link with descriptive anchor text — `curl -s https://www.cleanstart.com/guide/attack-surface-reduction-vs-vulnerability-management | grep -c '<a href'`
- **META-01** — every indexable page has exactly one non-empty, unique, accurate `<title>` — `jq -r '.pages[].head.title // empty' docs/seo/evidence/live-capture.json | sort | uniq -d`
- **META-02** — every indexable page's rendered DOM has at least one `<h1>` — `jq -r '.pages[] | select(.head and .head.h1Count != 1) | "\(.template): h1Count=\(.head.h1Count)"' docs/seo/evidence/live-capture.json`
- **META-03** — every shareable page emits `og:title`, `og:type`, `og:image`, `og:url` (plus image sub-properties), all absolute HTTPS — `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -coP '<meta property="og:(title|type|image|url)" content="[^"]+"'`
- **META-04** — every indexable page emits exactly one absolute, self-referencing canonical — `jq -r '.pages[] | select(.head and .head.canonicalCount != 1) | .template' docs/seo/evidence/live-capture.json`
- **SCHEMA-02** — every JSON-LD value has an accurate, visible on-page counterpart — Rich Results Test on a sample of each template, cross-checked against Search Console → Security & Manual Actions, for zero flagged manual actions
- **SCHEMA-04** — every multi-entity page assigns one stable `@id` per real-world entity, never shared across distinct entities — Schema Markup Validator on two pages referencing the same `@id`, confirming no contradictory node body
- **SCHEMA-05** — one canonical `Organization` node, identical site-wide, with `name`, `url`, `logo`, `sameAs` populated — `curl -I <logo-url>` → `200`, logo ≥112×112px
- **SCHEMA-06** — exactly one of `Article`/`NewsArticle`/`BlogPosting` per content page, with `headline`, `image`, `datePublished`, `dateModified`, `author` populated — Rich Results Test per template; Search Console "Article"/"Unparsable structured data" reports
- **SCHEMA-07** — every open `JobPosting` has `datePosted`, `description`, `hiringOrganization.name`, `jobLocation.addressCountry`, `title` — Search Console "Job Postings" rich-result report, checked for closed-but-still-marked-up pages
- **SCHEMA-08** — every `Product` page is classified as Merchant Listing or Product Snippet and meets that set's required properties — Rich Results Test on a comparison page and a checkout-capable PDP
- **GEO-01** — no robots.txt rule merges a training crawler and its vendor's retrieval/citation crawler under one directive — `curl -A "GPTBot" -I https://www.cleanstart.com/robots.txt; curl -A "OAI-SearchBot" -I https://www.cleanstart.com/robots.txt`
- **GEO-02** — `max-snippet`/`nosnippet`/`max-image-preview` are applied knowing they govern AI Overviews/AI Mode reuse, not just classic snippets — `curl -sI https://www.cleanstart.com/ | grep -i x-robots-tag`
- **PERF-05** — the LCP candidate is never `loading="lazy"`, is present as a plain `<img src>` in server-rendered HTML, and carries `fetchpriority="high"` — `curl -s https://www.cleanstart.com/ | grep -o '<img[^>]*fetchpriority="high"[^>]*>' | head -1`
- **PERF-07** — the JS bundle-budget CI gate fails the build on an absolute-budget breach, not warn-only — `STRICT_BUNDLE_BUDGET=1 pnpm --filter @cleanstart/web bundle:budget; echo "exit=$?"`
- **RENDER-01** — every dynamic detail route resolves its not-found check before any Suspense flush, never streaming a `200` shell first — `curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1`
- **RENDER-03** — a genuine `404` (not a soft-404 body) is returned for any resource that does not exist — `curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1`
- **RENDER-04** — intentionally, permanently removed content returns `410`, not `404` — `curl -sI https://www.cleanstart.com/<retired-redirect-path> | head -1`
- **RENDER-06** — every `503`/`429` response carries `Retry-After` — `curl -sI https://www.cleanstart.com/email-signatures/no-such-signature | grep -i retry-after`
- **MIG-03** — every permanent URL change is a server-side `301`/`308`, never a client-side redirect — `curl -sI https://www.cleanstart.com/<old-path> | head -1` → `301`/`308`
- **MIG-04** — `302`/`307` is used only for changes genuinely expected to revert — `curl -sI https://www.cleanstart.com/<path> | grep -i ^HTTP`
- **MIG-05** — redirect status code matches the endpoint's method/body-preservation contract (`301`/`302` vs `307`/`308`) — `curl -X POST -i https://www.cleanstart.com/<old-form-endpoint>`
- **MIG-06** — every redirect resolves to its final destination in exactly one hop — `curl -sIL -o /dev/null -w '%{num_redirects}\n' https://www.cleanstart.com/<old-path>` → `1`
- **MIG-08** — retired content with no replacement returns `404`/`410`, never a redirect to an unrelated page — `curl -sI https://www.cleanstart.com/<retired-path> | grep -i ^HTTP` → `404`/`410`
- **MIG-10** — every Next.js/Vercel redirect explicitly sets `permanent`, understanding it maps to `308`/`307` not `301`/`302` — `grep -B2 -A2 "destination:" apps/web/next.config.ts | grep -c "permanent: true"`
- **GOV-03** — any Lighthouse (or similar) score threshold used as a merge gate is a documented team policy choice, not assumed from tool defaults — `grep -c '"error"' apps/web/.lighthouserc.json`
- **GOV-04** — every page template emitting JSON-LD has a CI test asserting JSON validity and required-property presence — `pnpm --filter @cleanstart/schema test -- jsonld`
- **GOV-05** — JSON-LD fields that mirror a CMS field are asserted equal (post-normalization) to that field in CI — `pnpm --filter @cleanstart/schema test -- compose-graph`
- **SEM-01** — HTML served to Googlebot's user agent is identical in substance to what a human visitor receives — `diff <(curl -s https://www.cleanstart.com/ -A "Mozilla/5.0") <(curl -s https://www.cleanstart.com/ -A "Googlebot/2.1; +http://www.google.com/bot.html")`
- **SEM-02** — every indexable page emits at least one literal `<h1>`–`<h6>` tag in the non-JS-executed response — `curl -s https://www.cleanstart.com/events | grep -oE '<h[1-6][ >]' | wc -l` → ≥1
- **SEM-03** — exactly one heading per page is styled/marked as unambiguously most prominent — `curl -s https://www.cleanstart.com/ | grep -oE '<h1[ >]' | wc -l` → `1`
- **SEM-04** — UX-collapsed content (accordions/tabs) intended for indexing stays in the initial DOM, not injected only on interaction — `curl -s https://www.cleanstart.com/ | grep -c "Frequently Asked Questions"`

## Pre-launch

Final go/no-go verification against a staging/preview build before DNS cutover.

- **ARCH-04** — every sitemap URL is also reachable by a same-site crawl from the homepage — `diff <(curl -s https://www.cleanstart.com/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g' | sort) <(homepage-seeded-crawl-urls.txt | sort)`
- **RENDER-02** — no launch decision treats "returns 200" as evidence a page will be indexed — `curl -sI https://www.cleanstart.com/ | head -1`
- **MIG-02** — the full redirect map contains no loop (a destination that eventually points back at its own source) — `curl -sIL --max-redirs 10 -o /dev/null -w '%{http_code} %{num_redirects}\n' https://www.cleanstart.com/<path>`
- **MIG-07** — every old URL maps to its single most relevant new equivalent; nothing unmapped defaults to the homepage — `curl -sL https://www.cleanstart.com/<old-path>` (manual topical-equivalence check)
- **MEAS-01** — the production domain is verified as a GSC Domain property (not URL-prefix only) before go-live — `curl -s "https://www.googleapis.com/webmasters/v3/sites" -H "Authorization: Bearer $GSC_TOKEN" | grep 'sc-domain:cleanstart.com'`

## Launch day

Checked against the live production domain immediately after cutover.

- **MIG-01** — no previously-indexed URL serves `404` where its planned `301`/`308` was expected — `for u in $(cat legacy-urls.txt); do printf '%s ' "$u"; curl -sI -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$u"; done`

## Week 1

The post-launch monitoring window.

- **CRAWL-11** — soft-404/empty-result states still return real `404`/`410` under live production traffic — `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/blogs/this-slug-definitely-does-not-exist-xyz123`
- **PERF-01** — LCP ≤ 2500 ms at p75, per device, once CrUX field data accumulates — `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"PHONE"}' | jq '.record.metrics.largest_contentful_paint.percentiles.p75'`
- **PERF-02** — INP ≤ 200 ms at p75, per device — `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"DESKTOP"}' | jq '.record.metrics.interaction_to_next_paint.percentiles.p75'`
- **PERF-03** — CLS ≤ 0.1 at p75, per device — `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"url":"https://www.cleanstart.com/","formFactor":"PHONE"}' | jq '.record.metrics.cumulative_layout_shift.percentiles.p75'`

## Monthly

Recurring operational health checks.

- **CRAWL-02** — robots.txt has not returned a sustained 5xx since the last check — `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/robots.txt`
- **SCHEMA-07** — no `JobPosting` markup remains live past its requisition's close date — Search Console "Job Postings" rich-result report, checked for closed-but-still-marked-up pages
- **RENDER-05** — no site/section has been returning `503`/`429` for an extended period on the assumption the index is safe by default — `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/`
- **MIG-09** — every migration redirect is still live, tracked against a dated cutover log, and none removed before its one-year floor — `node scripts/seo-sop/check-redirect-retention.mjs`
- **MEAS-04** — GA4's own "History events" automatic page-view detection is still OFF in the live property console — `grep -n "History events" apps/web/src/components/analytics/Ga4RouteTracker.tsx apps/web/src/components/consent/GatedAnalytics.tsx`

## Quarterly

Governance, documentation hygiene, and review-cadence-driven audits (module 00 §9 — the AEO/GEO module and any monitoring-design assumption are reviewed at this cadence or faster).

- **CRAWL-09** — no internal documentation, audit, or client deliverable states `rel=canonical`/sitemap inclusion as a guaranteed instruction — `curl -s https://www.cleanstart.com/ | grep -o '<link rel="canonical"[^>]*>'`
- **SCHEMA-01** — no internal documentation, code comment, or audit claims structured data improves ranking position — `grep -rniE "(boost|improve|rank higher).{0,40}(structured data|schema|json-ld)" docs/ 2>/dev/null | wc -l` → `0`
- **SCHEMA-03** — the schema pipeline still has exactly one implementation reaching production; no second "schema engine" has gone live unconsumed — `grep -rn "api/jsonld" apps/web/src | wc -l` → `0`
- **PERF-04** — CWV pass/fail reporting still treats CrUX/RUM field data as authoritative, lab data as pre-merge/debugging only — `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"PHONE"}' | jq '.record.metrics | keys'`
- **PERF-06** — no internal reporting states CWV compliance itself moves rankings, or weights it near relevance/content — `grep -rniE "boost.{0,20}rank|rank(ing)?.{0,20}(boost|improvement|guarantee)" docs/ apps/web/src apps/cms/src 2>/dev/null | grep -v docs/seo/evidence`
- **MEAS-02** — no monitoring system in design or in place assumes a bulk, site-wide index-coverage API exists — `curl -s "https://developers.google.com/webmaster-tools/v1/api_reference_index" | grep -ci 'batch'`
- **MEAS-03** — Search Console Performance data is archived externally before it ages past the 16-month rolling retention window — `grep -rilE "16.month|search.console.*(export|archive)|bigquery.*(gsc|search.console)" apps/cms/src apps/web/src`
- **GOV-01** — branch protection with required status checks is still active on every branch that deploys to production — `gh api repos/digibranders/cleanstart-website/branches/main/protection`
- **GOV-02** — every package containing SEO-relevant tests is still reachable by an actually-executed CI job's test scope — `grep -rn "schema" .github/workflows/*.yml`

---

## Conditional

Core modules `01`–`11` above always apply. The modules below apply only when the trigger condition is true for the site being worked. A module whose trigger is false is skipped entirely — its rules are not marked `N/A` in bulk here; that bookkeeping belongs in a conformance report (see `91-cleanstart-conformance.md` for CleanStart's own site, which does not trigger any of `C1`–`C5`).

#### C1 — International & hreflang

**Trigger:** the site serves, or plans to serve, two or more language/region locale variants of the same content.

- **INTL-01** — every localized page's canonical resolves to a URL in its own language, never a different-language "master" — `node scripts/seo-sop/check-hreflang-canonical-language-match.mjs`
- **INTL-02** — every locale is exposed at a stable, distinct, crawlable URL — no locale-adaptive page relies on IP/`Accept-Language` detection alone — `curl -s https://example.com/de/ | grep -c 'lang="de"'`
- **INTL-03** — every hreflang `<link>` renders inside a well-formed `<head>`, one per variant, never combined with another attribute — `document.head.querySelectorAll('link[hreflang]').length`
- **INTL-04** — every sitemap-declared hreflang cluster is self-inclusive and complete for every member — `node scripts/seo-sop/check-hreflang-matrix.mjs`
- **INTL-05** — every hreflang annotation is bidirectional; no declared relationship is missing its return link — `node scripts/seo-sop/check-hreflang-matrix.mjs`
- **INTL-06** — a locale URL change updates every sibling's hreflang reference in the same deploy — `node scripts/seo-sop/check-hreflang-matrix.mjs`
- **INTL-07** — every hreflang value is language-first with a valid ISO 639-1 code, never a bare region code — `node scripts/seo-sop/check-hreflang-codes.mjs`
- **INTL-08** — every hreflang region subtag is a currently assigned ISO 3166-1 Alpha-2 code, never `EU`/`UN`/`UK` — `node scripts/seo-sop/check-hreflang-codes.mjs`
- **INTL-09** — same-language near-duplicates inside a cluster always declare an explicit canonical; hreflang membership is never the sole consolidation mechanism — `node scripts/seo-sop/check-hreflang-canonical-language-match.mjs`
- **INTL-10** — same-language, different-region pages are either substantively differentiated or consolidated to one canonical — `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **INTL-11** — locale-adaptive robots directives are identical across every locale's rendering of a shared URL — `curl -sI -H "Accept-Language: de" https://example.com/ | grep -i x-robots-tag`

#### C2 — E-commerce

**Trigger:** the site has pages describing purchasable or reviewable products (product/offer schema, merchant feeds).

- **ECOM-01** — every `Product` page is classified as merchant listing or product snippet before its markup is written — `curl -s "https://search.google.com/test/rich-results?url=<page>"`
- **ECOM-02** — every merchant-listing `Offer` carries `price`, `priceCurrency`, `availability`; `AggregateOffer` used only for genuine multi-seller pricing — `curl -s <url> | grep -o '"availability":"[^"]*"'`
- **ECOM-03** — `priceValidUntil`, where present, is always a future date at crawl time — `curl -s <url> | grep -o '"priceValidUntil":"[^"]*"'`
- **ECOM-04** — no `Review`/`AggregateRating` markup on `Organization`/`LocalBusiness` is self-served for the site's own business — `curl -s <url> | grep -B2 '"@type":"AggregateRating"' | grep -o '"@type":"[^"]*"'`
- **ECOM-05** — product-variant URLs have one deliberate canonicalization strategy (single-page shares one canonical; multi-page each self-canonicalizes) — `curl -s <variant-url> | grep -o 'rel="canonical"[^>]*'`
- **ECOM-06** — every faceted category parameter has an explicit crawl decision, and zero-result combinations return real `404`s — `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/category?color=nonexistent-value"`
- **ECOM-07** — every multi-variant product uses `ProductGroup`/`hasVariant`/`isVariantOf` with one consistent `productGroupID` across variants — `curl -s <variant-url> | grep -o '"productGroupID":"[^"]*"'`
- **ECOM-08** — all e-commerce structured data (`Product`/`Offer`/`Review`/`ProductGroup`/`ItemList`) represents content genuinely present and current on the page — `curl -s "https://search.google.com/search-console/manual-actions"`

#### C3 — Local

**Trigger:** the business has one or more physical locations, or operates as a service-area business, with a Google Business Profile presence.

- **LOCAL-01** — a Business Profile exists only for a business making in-person contact during stated hours, or a named exception — `curl -s "https://support.google.com/business/answer/13763036"`
- **LOCAL-02** — exactly one profile exists per physical location (or per service-area business), never a duplicate — `curl -s "https://www.google.com/maps/search/?api=1&query=<business+name>+<address>"`
- **LOCAL-03** — name/address/phone match the real-world signage and connect to the specific location, no keyword-stuffed name or central call-center number — `curl -s "https://support.google.com/business/answer/3038177"`
- **LOCAL-04** — every service-area business has exactly one profile, hidden address, and declared area by city/postal code within ~2 hours drive — `curl -s "https://support.google.com/business/answer/9157481"`
- **LOCAL-05** — no local-ranking claim in reporting/docs names a factor beyond relevance, distance, prominence — `curl -s "https://support.google.com/business/answer/7091"`
- **LOCAL-06** — every location page carries genuine location-specific content, not just a city-name template funneling elsewhere — `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **LOCAL-07** — the store/location locator renders real `<a href>` links to each location page, never JS-only or iframe-embedded — `curl -s <locator-url> | grep -o '<a[^>]*href="[^"]*store[^"]*"'`
- **LOCAL-08** — no `Review`/`AggregateRating` markup on `LocalBusiness`/`Organization` is self-served for the site's own entity — `curl -s <url> | grep -B2 '"@type":"AggregateRating"' | grep -o '"@type":"[^"]*"'`
- **LOCAL-09** — no review solicitation offers an incentive or pressures/scripts the review's content — `grep -rni "review.*discount\|discount.*review" .`

#### C4 — Programmatic & faceted

**Trigger:** the site generates pages at scale from templates or exposes combinable filter/sort URL parameters (faceted navigation).

- **PROG-01** — every programmatic-page system has a written, non-ranking user-facing reason each page exists independently — `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **PROG-02** — a crawl-control plan exists before a new filter/sort parameter ships, not after — `grep "Googlebot" access.log | grep -c "category="`
- **PROG-03** — non-indexable facets are blocked at the `robots.txt` parameter level, not via `rel=canonical`/`nofollow` alone — `curl -s https://example.com/robots.txt | grep -i 'disallow.*='`
- **PROG-04** — `rel=canonical`/`nofollow` on facet links are never the sole mitigation for a combinatorial facet space — `grep "Googlebot" access.log | grep -c "canonical-target-path"`
- **PROG-05** — every indexable facet combination has a real demand reason, a stable canonical parameter order, and a genuine `404` for empty results — `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/category?color=nonexistent-value"`
- **PROG-06** — every generated page has at least one crawlable internal `<a href>` link from an indexed page — `node scripts/seo-sop/check-hreflang-matrix.mjs`
- **PROG-07** — no tier of near-duplicate variant pages exists solely to capture query variants and funnel to one destination — `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **PROG-08** — every programmatic template has been individually audited against each of Google's four named scaled-content-abuse forms — `grep -c "does not apply" docs/launch-checklist.md`
- **PROG-09** — thin-but-useful templated pages use bare `noindex` (no `nofollow`) and are never also blocked in `robots.txt` — `curl -sI https://example.com/thin-page | grep -i x-robots-tag`

#### C5 — News & publisher

**Trigger:** the site publishes news content and pursues Google News/Top Stories eligibility.

- **NEWS-01** — `dateModified`/visible date changes only on substantive edits; no article is deleted-and-recreated under a new URL to simulate a fresh publish — `grep -c "dateModified" <(curl -s <article-url>)`
- **NEWS-02** — the News sitemap contains only articles from the last 48 hours, capped at 1,000 entries per file — `node scripts/seo-sop/check-news-sitemap-window.mjs`
- **NEWS-03** — Top Stories effort is gated on content-policy compliance and Search Essentials, not on markup/AMP/CWV thresholds — `curl -s "https://search.google.com/search-console/manual-actions"`
- **NEWS-04** — every news-classified page carries clear dates, bylines, publisher identity, and disclosed sponsorship — `curl -s <article-url> | grep -ci "sponsored\|paid content"`
- **NEWS-05** — every paywalled article declares `isAccessibleForFree: false` at the article level plus a `hasPart`/`cssSelector`-scoped gated region — `curl -s <article-url> | grep -o '"isAccessibleForFree":[a-z]*'`
