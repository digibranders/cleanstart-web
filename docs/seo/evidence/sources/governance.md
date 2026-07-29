# SEO Governance and CI Enforcement — Evidence Sources

Research basis for the SOP module governing *how SEO correctness is kept from regressing* — CI gates, automated invariants, and the human-review processes that fill the gaps automation cannot reach.

**Tier legend:** T1 = official spec/vendor docs (Google Search Central, RFC, W3C/WHATWG, IETF). T2 = first-party tooling docs (Lighthouse CI, Next.js, Vercel, GitHub). T3 = named, dated empirical study. T4 / `Convention — not vendor-confirmed` = practitioner consensus with no primary source.

**Honest framing:** Unlike crawl-control or structured-data syntax, "how to build your CI pipeline" is not something any vendor documents end-to-end. Google, Lighthouse, and GitHub each document *pieces* (what an audit checks, how a status check gates a merge) but nobody documents the assembled governance system. Most rules below are the pieces wired together — expect the `Convention` label on the majority of the *process* rules (ownership, checklist gating, pre- vs. post-deploy split) and a T1/T2 source on the *mechanical* rules (what a canonical tag must look like, what Lighthouse's SEO category actually runs).

---

## Taxonomy: what is mechanically testable vs. what requires a human

This is the load-bearing distinction for the whole module. Everything below the line "cannot be asserted in CI without a human in the loop" is not a gap in tooling maturity — it is permanent, because the properties are subjective, dependent on Google's black-box ranking systems, or dependent on real crawler behavior that a CI runner cannot simulate.

**Mechanically testable in CI (deterministic, no external dependency):**
- Canonical tag presence, self-reference, exactly-one-per-page, absolute-URL form
- Title/meta-description presence and length; title uniqueness across a route set (a string-diff, not a judgment call)
- Sitemap XML well-formedness, `<loc>` count/size limits, sitemap-vs-route-manifest parity
- JSON-LD syntactic validity (parses as JSON, matches `schema.org` type shape) and presence of required properties for the type used
- Robots meta tag / `X-Robots-Tag` value correctness per environment (does `production` emit `index, follow` and does every non-production host emit `noindex, nofollow`)
- Redirect-map integrity (every entry resolves, no loops, no chains beyond N hops)
- Internal link status codes (no internal `<a href>` pointing at a 404/5xx)
- Lighthouse SEO category score against a fixed threshold

**Requires human review (cannot be asserted mechanically, ever):**
- Whether a title or meta description is *good* — accurate, compelling, non-cannibalizing in intent (Lighthouse explicitly disclaims this: see §Lighthouse below)
- Whether structured data is *truthful* to the page content (Google's own guidance: markup must not be "misleading," which is a content judgment, not a schema check)
- Whether a page will actually rank, get a rich result, or get indexed at all — Google states sitemap inclusion and even fully valid structured data are hints, not guarantees (sourced below)
- E-E-A-T / content-quality signals
- Whether a redirect *should* exist (business/editorial decision) vs. whether it's mechanically correct
- Whether the sitemap's chosen canonical URL is the *right* one when duplicates exist — Google says "choose the URL you prefer," which is an editorial call the machine can't make for you

**Convention — not vendor-confirmed:** the boundary itself (this two-column split) is our own synthesis for this SOP; no vendor publishes a "testable vs. not" taxonomy. Each individual claim inside each column is sourced or labeled below.

---

## 1. Canonical: present, self-referencing, exactly one per page

**Rule:** Every indexable page must render exactly one `<link rel="canonical">` element, with an absolute-URL `href`, and — unless the page is an intentionally-declared duplicate (e.g. a paginated or parameterized variant) — that `href` must equal the page's own URL.

**Rationale:** Google ranks canonicalization signals by strength (redirect > `rel=canonical` > sitemap presence) and "these methods can stack and thus become more effective when combined" — but a *missing* or *conflicting* canonical removes the strongest available signal, leaving Google to guess, which risks the wrong URL (or a parameterized/staging variant) showing in search results. A self-referencing canonical is Google's own explicit recommendation.

**Acceptance criterion:** For every route in the generated route manifest, the rendered `<head>` contains `count(link[rel=canonical]) === 1`, the `href` is a fully-qualified absolute URL (not a fragment, not relative), and — for the default case — `href === canonical(current route)`.

**Verification method:** A CI test that iterates the build's route manifest (e.g. Next.js `generateStaticParams` output or the sitemap itself), fetches each page's server-rendered HTML (not client-hydrated DOM — Google warns canonical clarity in "HTML source code" matters), and asserts the single-canonical + self-reference conditions. Lighthouse's `canonical` audit (`document-does-not-have-valid-rel-canonical` failing state) can run as a secondary, non-exhaustive spot-check but does not replace a full-route-set crawl.

**Source:** "Do include a `rel=\"canonical\"` link on the canonical page itself (also known as a self-referential canonical)." / "Don't specify a URL fragment as canonical." / "Don't specify different URLs as canonical for the same page using different canonicalization techniques." — [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), Google Search Central. T1. Next.js `alternates.canonical` / `metadataBase` API — [generateMetadata reference](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase). T2.

**Anti-pattern:** Relying on `robots.txt` or a client-side `useEffect` to inject the canonical tag (Google specifically calls out JS-only signals as unreliable — canonical clarity should be in HTML source); shipping a template default (e.g. hardcoded homepage URL) that every detail page inherits, producing hundreds of pages with an identical, wrong canonical.

---

## 2. Title uniqueness across a route set

**Rule:** No two indexable, non-duplicate URLs within the same route set (e.g. all `/resources/*` detail pages) may render an identical `<title>` string.

**Rationale:** Google explicitly frames duplicate titles as a user-facing and crawlability failure: "It's important to have distinct text that describes the content of the page in the `<title>` element for each page on your site," illustrating with "titling every page on a commerce site 'Cheap products for sale'... makes it impossible for users to distinguish between two pages." Google also silently rewrites titles it judges as boilerplate/duplicated across a page subset — meaning a duplicate-title bug doesn't just look bad, it forfeits control over what shows in the SERP.

**Acceptance criterion:** Across a defined route set (a collection's full listing of indexable slugs), `count(distinct title) === count(indexable pages)`. A test failure lists the colliding slugs.

**Verification method:** Build-time script that renders (or queries CMS-generated) titles for every published document in a collection and asserts no duplicate values in the resulting set; run as part of the same pre-deploy gate as the canonical check, scoped per-collection (title collisions across unrelated collections, e.g. a blog post and a job listing, are not necessarily a defect).

**Source:** [Influence your title links in search results](https://developers.google.com/search/docs/appearance/title-link), Google Search Central. T1. The *specific rule* — "diff every rendered title against every other title in the set and fail on any exact match" — is our own CI operationalization of Google's prose guidance and is `Convention — not vendor-confirmed` for the mechanical implementation, even though the underlying rationale is T1.

**Anti-pattern:** A CMS template that falls back to a generic default title (e.g. the site name alone) when an editor leaves the title field blank — this passes a naive "title exists" check while silently producing mass duplication.

---

## 3. Sitemap-versus-route parity

**Rule:** The generated sitemap must contain exactly the set of URLs that are (a) actually resolvable in the deployed route manifest and (b) intended to be indexable — no orphaned sitemap entries pointing at removed routes, and no indexable route missing from the sitemap.

**Rationale:** Google states sitemap inclusion is itself a signal ("Google generally shows the canonical URLs in its search results" when sitemap-listed) but also a weak one on its own — its value depends on it accurately reflecting "which URLs you prefer to show in search results." A sitemap that drifts from the real route set either wastes crawl budget on dead URLs or fails to surface new content — and because "submitting a sitemap is merely a hint," Google will not self-correct a drifted sitemap for you.

**Acceptance criterion:** `sitemap_urls \ route_manifest_urls = ∅` (no dead entries) and `indexable_route_manifest_urls \ sitemap_urls = ∅` (no missing entries), computed at build time.

**Verification method:** A CI script (this repo already needs one per `docs/web/WEB-PAGES.md`'s "canonical list of all pages") that diffs the emitted `sitemap.xml`/sitemap-index against the framework's own route manifest (Next.js `generateStaticParams` across all dynamic routes plus static `app/` segments), failing the build on either direction of drift. Sitemap XML shape itself (max 50,000 URLs / 50MB per file, valid `<urlset>`/`<loc>`) is separately assertable via straightforward XML schema validation.

**Source:** "Keep in mind that submitting a sitemap is merely a hint: it doesn't guarantee that Google will download the sitemap or use the sitemap for crawling URLs on the site." / "Google generally shows the canonical URLs in its search results" — [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), Google Search Central. T1. File-size/URL-count limits (50,000 URLs, 50MB uncompressed) — [sitemaps.org Protocol](https://www.sitemaps.org/protocol.html). T1 (the sitemap protocol's own spec, independently maintained, predates and is referenced by Google's guidance).

**Verification for the parity check itself is `Convention — not vendor-confirmed`:** no vendor documents "diff your sitemap against your route manifest in CI" as a named practice — it follows logically from the T1 statements above but is our own synthesis.

**Anti-pattern:** Generating the sitemap from a stale CMS query cache that still lists a since-unpublished or slug-renamed document — silently sends crawlers into 404s/soft-404s and burns crawl budget (see the existing project incident memory on detail-route soft-404 behavior for why this is a live risk, not a hypothetical).

---

## 4. JSON-LD structured-data validity

**Rule:** Every page that emits JSON-LD must produce syntactically valid JSON that parses to a recognized `schema.org` `@type` with all properties Google marks "required" for that type present and non-empty; the markup must not be blocked from Googlebot by `robots.txt`, `noindex`, or any other access control.

**Rationale:** Google states plainly that "Items that are missing required properties are not eligible for rich results" and that structured data must not be inaccessible to Googlebot — a syntax error or missing-required-field bug silently forfeits rich-result eligibility with no visible failure in the rendered page (the HTML still "looks fine" to a human reviewer).

**Acceptance criterion:** For every page emitting JSON-LD, the `<script type="application/ld+json">` payload (a) parses without a JSON syntax error, (b) declares a `@type` from the schema.org vocabulary, and (c) contains every property Google's documentation lists as `required` for that specific rich-result type (e.g. `Article` needs `headline`, `image`, `datePublished`; the required-property list is type-specific and must be checked against Google's per-type reference, not a single generic rule).

**Verification method:** Unit test that extracts and `JSON.parse`s every `ld+json` block from server-rendered HTML per page template, validated against a per-type required-property manifest maintained in-repo. For pre-deploy spot verification of Google-specific eligibility (not just syntax), run representative URLs through the Rich Results Test — but note Google does not expose a public API for it (the only programmatic path is the Search Console URL Inspection API's `richResultsResult` field, and only for already-indexed, already-verified-property URLs — it cannot pre-validate an unpublished/preview URL).

**Source:** "Specify all required properties listed in the documentation for your specific rich result type. Items that are missing required properties are not eligible for rich results." / "Don't block your structured data pages to Googlebot using robots.txt, noindex, or any other access control methods." / "Google does not guarantee that your structured data will show up in search results, even if your page is marked up correctly." — [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), Google Search Central. T1. Rich Results Test / Schema Markup Validator as the two distinct recommended tools (Google-specific eligibility vs. generic schema.org syntax) — same source, T1. URL Inspection API `richResultsResult` scope and its indexed-URL-only limitation — [Welcoming the new Search Console URL Inspection API](https://developers.google.com/search/blog/2022/01/url-inspection-api), Google Search Central Blog; general API shape (`inspectionUrl`, `siteUrl` request fields) — [urlInspection.index.inspect reference](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect). T1.

**Anti-pattern:** Treating "the page renders without a JS console error" as proof structured data is valid — a `JSON.parse` failure inside a `dangerouslySetInnerHTML` script tag does not throw at runtime; it silently produces an empty/broken script block that Google's crawler then can't parse either. Also: validating structured data once at design time and never re-running the check after a schema/field rename in the CMS (this is a drift class, not a one-time class — see §Monitoring below).

---

## 5. Robots directives correct per environment

**Rule:** Every non-production environment (preview deploys, staging if any exists, local/dev) must emit `noindex, nofollow` (via meta robots tag and/or `X-Robots-Tag` header) on every response, and this must be enforced structurally — derived from the deploy environment, never from a per-page flag a developer could forget to set.

**Rationale:** This project's own incident history is the strongest evidence for *why* this must be systemic rather than a remembered step: `staging.cleanstart.com` was deleted from DNS specifically because of the standing risk of a second indexable surface, and `*.vercel.app` preview aliases inherit production `NEXT_PUBLIC_*` env values, meaning any host-gating logic that isn't airtight silently indexes an unfinished or duplicate copy of the entire site (see project memory: `web-staging-is-production-target`). Google states `noindex` only works if the page "must not be blocked by a robots.txt file... it has to be otherwise accessible to the crawler" — meaning a `Disallow` rule alone on a preview host is not a substitute for `noindex`, and blocking via `robots.txt` while a stray `noindex` is missing is actually the worst combination (Google can still index a robots.txt-disallowed URL with no snippet, from external links alone — sourced in the crawl.md evidence file, item 1).

**Acceptance criterion:** For every deployed hostname that is not the canonical production domain, `curl -sI <url> | grep -i x-robots-tag` returns `noindex` (or an equivalent `<meta name="robots" content="noindex">` is present in every response body), and this is asserted by a single environment-derived code path (e.g. a shared `isNoindexHost()` helper gating a layout-level `<meta>`/header), not by a per-page opt-in a new page could omit.

**Verification method:** A smoke test in the deploy pipeline that requests N representative routes on the just-built preview URL and asserts the `noindex` signal is present on all of them before the deploy is considered complete — this is a post-build, pre-promote gate, distinct from a unit test, because it must run against the actual deployed artifact/headers, not source code.

**Source:** "For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file, and it has to be otherwise accessible to the crawler." / "A response header can be used for non-HTML resources" (X-Robots-Tag) — [Block Search indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), Google Search Central. T1. Environment-derived enforcement pattern (host-gating `NEXT_PUBLIC_*` leakage into every `*.vercel.app` alias) is this project's own operational finding, not vendor doctrine — `Convention — not vendor-confirmed` for the "derive it structurally, never per-page" governance rule itself, though the underlying noindex mechanics are T1.

**Anti-pattern (drawn from this codebase's own incident record):** A `noindex` gate implemented as a remembered per-page or per-deploy manual step rather than a single shared predicate; banner/privacy copy that describes gating behavior inconsistent with what the code actually does (see project memory `web-ga4-tracking-verified` for a parallel case of docs/code drift on a gating flag — the same class of risk applies to noindex gating).

---

## 6. Redirect-map integrity

**Rule:** Every entry in the redirect map must resolve to a live, 2xx-or-further-redirect destination with no cycle and no chain exceeding a small fixed hop count (2 is a reasonable ceiling); no redirect may target another redirect's source in a way that creates a loop.

**Rationale:** A broken or looping redirect either 404s a URL that used to work (losing indexed equity on a previously-ranking page — directly the concern behind this repo's own hard rule never to rename a launched route segment) or wastes crawl budget/latency on long chains. This is a pure graph-integrity problem with no ambiguity — either the destination resolves or it doesn't.

**Acceptance criterion:** Given the full redirect map as a directed graph (source → destination), (a) no destination is itself an unresolved source with no further mapping (dead end returning non-2xx), (b) no cycle exists, (c) no path exceeds N hops before reaching a terminal 2xx.

**Verification method:** A CI script that loads the redirect configuration (e.g. Next.js `redirects()` in `next.config.ts`, or a CMS-managed redirect collection) as a graph and runs cycle-detection plus a live-fetch (`HEAD`) of each terminal destination against the just-built preview deployment.

**Source:** No vendor documents "redirect-map graph validation" as a named CI practice. `Convention — not vendor-confirmed`. The underlying HTTP semantics (a redirect chain terminates at a non-3xx status, chains beyond a handful of hops are wasteful) trace to general HTTP/1.1 semantics (RFC 9110 on redirection status codes) but the *governance rule* — validate this in CI before deploy — is practitioner convention.

**Anti-pattern:** A redirect rule added to satisfy one specific URL rename that unintentionally also matches (via an overly broad regex/wildcard source pattern) other live routes, silently redirecting pages that should not have been touched.

---

## 7. No broken internal links

**Rule:** Every internal `<a href>` emitted in rendered HTML must resolve to a URL that returns a 2xx status (after following any legitimate redirect) — no internal link may point at a 404, 5xx, or a redirect chain terminating in an error.

**Rationale:** Broken internal links waste crawl budget, break the link-equity flow the site's own internal-linking strategy depends on, and directly harm user experience — none of which requires human judgment to detect, only a crawl-and-check pass.

**Acceptance criterion:** `count(internal links resolving to non-2xx-after-redirect) === 0` for the full crawled site graph, scoped to a defined crawl depth/route set for CI-time feasibility.

**Verification method:** This project already runs a daily post-launch job for this (`check-broken-links.ts`, per this repo's own background-jobs table) — the CI-time equivalent is the same link-graph-crawl logic run against the just-built preview deployment before promotion, catching regressions pre-deploy rather than discovering them up to 24 hours later in the daily job.

**Source:** `Convention — not vendor-confirmed` for the CI-gate framing. The daily-job pattern already implemented in this codebase (`apps/cms/src/payload/jobs/check-broken-links.ts`) is this project's own prior engineering decision, not an externally sourced standard — cited here as internal precedent, not as a Tier 1/2 vendor source.

**Anti-pattern:** Only running the broken-link scan post-deploy on a schedule (as this repo currently does) with no pre-deploy gate — a broken-link regression ships and lives in production for up to 24 hours (the job's own cadence) before detection.

---

## 8. Lighthouse CI SEO category: what it gates, and its explicit limits

**Rule:** Gate every PR/preview deploy on a fixed Lighthouse SEO category score threshold (e.g. `"categories:seo": ["error", {"minScore": 0.9}]`) — but do not treat a perfect Lighthouse SEO score as proof the page is well-optimized; it is a floor for mechanical hygiene, not a ceiling for quality.

**Rationale:** Lighthouse's SEO category audits a fixed, documented list of mechanical checks — meta description presence, descriptive link text, valid `hreflang`, valid `rel=canonical`, successful HTTP status, valid `robots.txt`, no blocking plugins, appropriately-sized tap targets, and structured-data validity (the last audit is manual/informational, not auto-scored) — and Lighthouse's own documentation explicitly disclaims quality judgment: it states outright that it "doesn't evaluate the quality of your description," i.e. a meta description of `"a"` passes the same as a well-written one, so long as it's present.

**Acceptance criterion:** Lighthouse CI's `assert` step returns a passing exit code when `categories:seo` >= the configured `minScore`; CI fails the build otherwise. This is a necessary-not-sufficient gate — pairs with the human-review items in the taxonomy above, not a replacement for them.

**Verification method:** `lhci autorun` (or `lhci collect` + `lhci assert`) invoked in the CI pipeline against the built preview URL, configured via `lighthouserc.js`'s `assert.assertions` block using the `"categories:seo": [level, {"minScore": N}]` or `lighthouse:recommended` preset (which asserts perfect scores on all non-performance categories, including SEO).

**Source:** Lighthouse CI `assert` configuration syntax (`level | [level, options]`, `categories:<id>` keying, presets `lighthouse:all`/`lighthouse:recommended`/`lighthouse:no-pwa`) — [Lighthouse CI configuration docs](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) (429 rate-limited to automated checks; verified manually 2026-07-29), GoogleChrome/lighthouse-ci (official Google-maintained tool). T2. The list of SEO audits and the explicit quality disclaimer ("Lighthouse doesn't evaluate the quality of your description") — [Document does not have a meta description](https://developer.chrome.com/docs/lighthouse/seo/meta-description) and the sibling audit pages under [Lighthouse SEO](https://developer.chrome.com/docs/lighthouse/seo/), Chrome for Developers (official). T2.

**Anti-pattern:** Treating "Lighthouse SEO = 100" in a PR check as equivalent to "this page is SEO-complete" and skipping the human-review items (title/description quality, E-E-A-T, structured-data truthfulness) — the score cannot see any of those. Also: running Lighthouse CI only against the homepage as a proxy for the whole site — the SEO category is per-page and a template regression on a detail-page type will not show up in a homepage-only check.

---

## 9. Pre-deploy versus post-deploy checks: two different failure domains

**Rule:** Split SEO CI checks into two tiers with different consequences: pre-deploy checks that block the merge/promote (canonical, title uniqueness, sitemap parity, JSON-LD syntax, robots-per-environment, Lighthouse SEO threshold — everything in §1–§8 above that can run against a build artifact or preview deployment) and post-deploy monitoring that cannot block anything because it depends on external, asynchronous systems (Search Console indexing status, actual rich-result eligibility, ranking position, real Googlebot crawl behavior).

**Rationale:** Some properties are only observable after Google has actually crawled and processed the live URL — indexing status, rich-result eligibility as Google renders it, Core Web Vitals field data (CrUX) — and none of these can gate a deploy without either (a) faking the dependency in CI, which produces false confidence, or (b) blocking every deploy on Google's crawl schedule, which is operationally unworkable (Google states crawl/reprocessing can take "months" for a low-priority page). The correct split is: CI enforces everything mechanically knowable from the build artifact; a separate monitoring loop watches everything that can only be known in production.

**Acceptance criterion:** No pipeline step calls the Search Console API, CrUX API, or a live-ranking check as a *blocking* condition for merge/deploy. Any such external-dependency check that does exist runs as a scheduled job against already-live URLs and produces an alert, not a build failure.

**Verification method:** Audit the CI config (e.g. `.github/workflows/*.yml`) for any step invoking Search Console/CrUX/rank-tracking APIs with a non-zero-exit-blocks-merge semantic — flag as an anti-pattern if found. Confirm scheduled/cron jobs (this repo's existing `refresh-crux.ts`, `refresh-content-insights.ts`) are wired as background jobs, not pipeline gates — which this repo's own background-jobs table already reflects.

**Source:** `Convention — not vendor-confirmed` — no vendor states this two-tier split explicitly as a named practice; it follows from combining Google's own "may take months" and "not a guarantee" statements (T1, cited in §3–§5 above) with the practical constraint that a CI pipeline cannot block on an indeterminate external timeline.

**Anti-pattern:** A CI step that calls the URL Inspection API on a not-yet-deployed preview URL expecting an indexing verdict — the API only returns data for the *live*, Search-Console-verified property; it cannot pre-validate an unpublished URL, so this pattern silently no-ops or errors rather than providing the intended signal.

---

## 10. Monitoring for drift after launch

**Rule:** Re-run the mechanically-testable invariants (§1–§7) on a recurring schedule against the *live* production site, not only at deploy time — because CMS-driven content (editor-entered titles, structured data fields, redirect entries) can drift out of compliance after a deploy with no corresponding code change or CI run.

**Rationale:** Every invariant above that depends on CMS-authored content (title uniqueness, JSON-LD required-field completeness, sitemap parity against a live-editable collection) can regress purely through content operations — an editor renaming a slug, leaving a title blank, or unpublishing a document referenced elsewhere — with zero code deploy and therefore zero CI run to catch it. This project already has direct precedent for this class of bug: sitemap-vs-listing drift from a stale CMS query cache, and slug-rename 404s, are both documented as live incidents in this codebase's own history, not hypothetical risks.

**Acceptance criterion:** A scheduled job (daily or more frequent, matching the cadence of this repo's other cron jobs) re-runs the sitemap-parity, redirect-integrity, and broken-internal-link checks against the live production site and raises an alert (not a build failure — there is no build to fail) on any regression.

**Verification method:** Reuse the existing background-job pattern in `apps/cms/src/payload/jobs/` (this repo already runs `check-broken-links.ts` daily and `reindex-meili.ts` daily) — add sitemap-parity and redirect-integrity as siblings in the same job family, each producing a P2/P3-severity alert distinct from the P1 backup-heartbeat alert this repo already treats as highest severity.

**Source:** `Convention — not vendor-confirmed` for the general "monitor drift on a schedule" governance rule. The specific job-pattern precedent (`check-broken-links.ts` running daily) is this project's own prior decision, cited as internal precedent, not a vendor source.

**Anti-pattern:** Assuming CI green at deploy time means the site stays compliant indefinitely — every invariant sourced from live CMS data has a shelf life bounded by the next content edit, not the next code deploy.

---

## 11. The publishing checklist as the editor-facing gate

**Rule:** For SEO properties that depend on human judgment (title/description quality, structured-data truthfulness, whether a redirect is the *right* business decision), the enforcement point is not CI at all — it is a publishing checklist presented to the editor at the moment of publish, and skipping it must be a hard block in the CMS, not a suggestion.

**Rationale:** CI runs against code and build artifacts; it has no visibility into a specific unpublished document's title quality or whether its structured data is truthful to freshly-edited body content. The only enforcement point available for content-level judgment calls is the authoring workflow itself, at the moment a human is looking at the specific content. This project already treats its own publishing checklist as "the editor-facing safety gate" per this repo's own architecture doc, and this repo's own conventions forbid bypassing it.

**Acceptance criterion:** The CMS publish action is blocked (not merely warned) when a required-but-missing field relevant to SEO (e.g. missing meta title/description on a collection that requires one) is absent; a human reviewer confirms the human-judgment items (accuracy, non-cannibalization) as part of the same gate.

**Verification method:** This is process, not a script — verification is an editorial audit (spot-check a sample of recently published documents against the checklist) rather than a CI assertion. The one mechanically-checkable piece (required-field-present) can and should be a hard validation in the CMS collection schema (Payload field `required: true`), which *is* testable.

**Source:** This repo's own architecture doc, §`#publishing-checklist`, referenced in this repo's own `CLAUDE.md` as a hard rule ("Never bypass the publishing checklist... It is the editor-facing safety gate"). This is project convention formalized as a repo rule, not an externally-sourced standard — `Convention` in the sense that no vendor prescribes checklist-gating, but it is this project's own documented, binding policy rather than an unverified practitioner habit.

**Anti-pattern:** Treating the publishing checklist as advisory copy an editor can skim past — if it can be bypassed, it isn't a gate, it's documentation, and documentation doesn't prevent regressions.

---

## 12. Ownership model: who is accountable for which failure class

**Rule:** Assign each governance layer to a distinct owner: engineering owns the mechanically-testable CI gates (§1–§8) and their maintenance as the codebase evolves; the content/editorial team owns the publishing-checklist judgment calls (§11); and a named individual or rotation owns the drift-monitoring alerts (§10) and is accountable for triaging them within a defined SLA, distinct from who gets paged for infrastructure incidents.

**Rationale:** A check with no owner decays — an assertion that starts failing gets silenced or `// eslint-disable`'d away rather than fixed if nobody is accountable for the specific failure class it represents. Splitting by failure class (code-level mechanical vs. content-level judgment vs. live-production drift) matches the split already made in §9–§11: each has a different response — fix the code, fix the content, or investigate a live-site regression — and conflating them under one generic "SEO owner" role tends to produce a bottleneck or diffusion of responsibility.

**Acceptance criterion:** Each CI gate, each publishing-checklist requirement, and each drift-monitoring job has a named owning team documented alongside it (e.g. in the same table format this repo already uses for its background-jobs list, which names a schedule and a file but not yet an owner — an addition worth making).

**Verification method:** This is organizational, not testable by machine. Verification is a periodic ownership audit (does every gate/job/checklist item map to a currently-staffed owner) rather than a CI assertion.

**Source:** `Convention — not vendor-confirmed`. No vendor documentation prescribes an ownership model for SEO governance; this is standard engineering-org practice applied to this domain (the same reasoning behind assigning owners to any monitored system) rather than an SEO-specific finding.

**Anti-pattern:** A shared/no-owner Slack channel as the entire monitoring-response mechanism — alerts accumulate unread, and the eventual "why has this been broken for three weeks" question has no answer because no individual was ever accountable for the first one.

---

## 13. Preventing preview/staging indexing: a systemic guarantee, not a remembered step

**Rule:** Non-production indexability must be prevented by a structural property of the deployment platform and the application's own environment-detection code working together — never by a step a human must remember to perform per-deployment (manually adding a `noindex` tag, manually configuring a one-off robots.txt, manually password-protecting a specific preview link).

**Rationale:** This exact failure mode has direct precedent in this codebase: `staging.cleanstart.com` was deleted from DNS entirely (2026-07-29) specifically to eliminate a standing indexable surface, and this project's own memory of that decision explicitly warns that prod-env `NEXT_PUBLIC_*` variables leak into *every* `*.vercel.app` preview alias, meaning host-gating logic must be airtight across *all* aliases, not just the ones a developer happens to test. A "remembered step" model (e.g. "remember to add noindex before sharing a preview link") fails the instant someone forgets once, and there is no mechanism to detect the omission until Google has already indexed it.

**Acceptance criterion:** Two independent, stacked controls both hold true for every non-production surface: (1) the platform's deployment-protection setting requires authentication for anything other than the canonical production domain (so an unauthenticated crawler cannot even fetch the page), and (2) the application layer independently emits `noindex` on any request whose host does not match the canonical production domain, derived from a single shared predicate, as defense-in-depth in case protection (1) is ever misconfigured or bypassed via a shareable link.

**Verification method:** A scheduled or pre-promote check that enumerates every known non-production hostname pattern this platform generates (branch-URL, deployment-URL, and any custom preview aliases) and asserts both controls independently — Vercel's own Deployment Protection dashboard state (`Standard Protection` or stronger, scoped to non-production) as control (1), and an HTTP-header/meta-tag check for `noindex` as control (2). Neither control alone is sufficient to call this "systemic": platform protection can be reconfigured by anyone with settings access, and env-derived noindex logic can have a bug — the guarantee comes from requiring both to independently hold.

**Source:** Vercel Deployment Protection scopes (`Standard Protection` — "protects all deployments except production domains," available on all plans) and its authentication-required-for-all-requests behavior — [Deployment Protection on Vercel](https://vercel.com/docs/deployment-protection), Vercel documentation (official). T2. The specific "prod env vars leak into every `*.vercel.app` alias, so host-gating must be airtight" finding is this project's own prior incident/decision, cited as internal precedent, not a vendor-documented risk (Vercel's own docs do not call out this specific `NEXT_PUBLIC_*` leakage risk) — `Convention — not vendor-confirmed` for that specific mechanism, though the platform capability itself (T2) is real. The underlying noindex mechanics (must not be robots.txt-blocked to work) are T1, sourced in §5 above.

**Anti-pattern (this project's own prior state, corrected):** Relying on a remembered convention ("staging is at a separate subdomain, we just don't link to it") instead of an enforced technical control — this is precisely the failure class DNS deletion of `staging.cleanstart.com` was meant to close, and it is exactly why this rule frames "systemic guarantee" as the requirement, per the task's own framing, rather than "a documented process someone should follow."

---

## Summary: source density by section

| # | Topic | Primary tier |
|---|-------|-------------|
| Taxonomy | testable vs. human-review split | Convention (synthesis); individual claims cited T1 |
| 1 | Canonical present/self-ref/one-per-page | T1 (Google) + T2 (Next.js) |
| 2 | Title uniqueness | T1 rationale; T4/Convention mechanical rule |
| 3 | Sitemap-vs-route parity | T1 (Google + sitemaps.org); Convention for the CI-diff practice |
| 4 | JSON-LD validity | T1 (Google structured-data policies + URL Inspection API) |
| 5 | Robots directives per environment | T1 (noindex mechanics); Convention (structural-enforcement rule) |
| 6 | Redirect-map integrity | Convention |
| 7 | No broken internal links | Convention (internal precedent cited) |
| 8 | Lighthouse CI SEO gate | T2 (Lighthouse CI + Chrome Developers, both Google-maintained) |
| 9 | Pre- vs. post-deploy split | Convention |
| 10 | Drift monitoring | Convention (internal precedent cited) |
| 11 | Publishing checklist | Project-internal binding policy (not vendor, not unverified habit) |
| 12 | Ownership model | Convention |
| 13 | Preventing preview indexing systemically | T2 (Vercel) + T1 (noindex mechanics) + Convention (the specific enforcement architecture) |
