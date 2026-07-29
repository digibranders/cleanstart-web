# Measurement & Monitoring

**Module:** 09 — Measurement
**Prefix:** `MEAS`
**Review cadence:** On tooling change (`00-index.md` §9) — reviewed whenever GSC access, the GA4 property, or a field-data source changes, not on a fixed calendar.
**Scope:** GSC/GA4/CrUX wiring and access model, event taxonomy, indexation monitoring, drift detection, alerting, reporting cadence, and the structural limits of each measurement surface.
**Evidence base:** `docs/seo/evidence/sources/measurement.md` (16 researched items, all Tier 1 except item 9's mechanism paragraph and item 16's channel citation); `docs/seo/evidence/verification-log.md` (6 corrections applied below out of 16 rules for this domain — the highest correction rate of any domain in this SOP); `docs/seo/evidence/codebase-inventory.md` ("Measurement & Governance" section); `docs/seo/evidence/field-data.md` (live CrUX/GA4/GSC API pulls captured 2026-07-29).

Every `CleanStart` verdict below is grounded in a cited `file:line` reference, a live API response recorded in `field-data.md`, or both. Where the two disagree, or where the codebase implements only part of a rule, the verdict is `Partial`.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### MEAS-01 — Verify the whole production domain as a GSC Domain property, not just a URL-prefix property

- **Severity:** P1
- **Applies:** Always
- **Rule:** Verify every production site as a Domain property in Search Console. Use a URL-prefix property only as a fallback when DNS-record verification is impossible, and never assume a URL-prefix property covers subdomains or alternate protocols.
- **Why:** A Domain property aggregates data across every subdomain and protocol for the registrable domain via DNS TXT verification. A URL-prefix property includes only the exact scheme+host prefix it was verified for — `https://www.example.com/` excludes `http://example.com/` and `https://m.example.com/` entirely, each needing its own property. Running only a URL-prefix property and concluding "no bare-apex or `m.` traffic exists" mistakes a structural blind spot for an empirical finding.
- **Acceptance:**
  - The verified, actively-queried property is Domain-type (`sc-domain:...`), confirmed under "Domain properties" in the property selector
  - Performance-report totals are read from the Domain property so they include every subdomain/protocol variant without summing multiple properties
  - Any parallel URL-prefix property's access state is recorded, not silently assumed
- **Verify:** `curl -s "https://www.googleapis.com/webmasters/v3/sites" -H "Authorization: Bearer $GSC_TOKEN" | grep 'sc-domain:cleanstart.com'`
- **Reference:** None — no reference implementation (property verification is a Search Console account-configuration action, not application code)
- **Source:** [Tier 1] https://support.google.com/webmasters/answer/34592 — "all subdomains (m, www, and so on) and multiple protocols (http, https, ftp)" for a Domain property; a URL-prefix property "includes only URLs with the specified prefix, including the protocol."
- **Tools:** Not applicable — property-type choice is a Search Console account setting, not a defect any crawl or rank-tracking tool scores.
- **Anti-patterns:** Running only a `https://www.example.com/` URL-prefix property and reporting "site has no bare-apex or `m.` traffic" — the property cannot structurally see that traffic, so absence of evidence is not evidence of absence.
- **Evidence:** `field-data.md` §3 confirms live, direct API access: `GET .../sites` returns exactly one property the service account can see, `{"siteUrl": "sc-domain:cleanstart.com", "permissionLevel": "siteFullUser"}`, HTTP 200. A follow-up call against the separate URL-prefix property `https://www.cleanstart.com/` returned HTTP 403 ("User does not have sufficient permission for site"). This corrects a stale project record: the repo memory `j2-analytics-dashboard-provisioning.md` and prior spec notes record GSC access as still pending — as of this capture date (2026-07-29) domain-property access is live and has been used to pull real Search Analytics and URL Inspection data (`field-data.md` §3). Only the separate URL-prefix property remains genuinely inaccessible.
- **CleanStart:** Pass

---

### MEAS-02 — There is no bulk index-coverage API; do not design monitoring that assumes one

- **Severity:** P1
- **Applies:** Always
- **Rule:** Do not build a monitoring system that assumes bulk, site-wide indexation-status retrieval exists. The Page Indexing (Index Coverage) report is UI-only and non-exhaustive; the only programmatic indexing-status check, the URL Inspection API, is a single-URL lookup capped at 2,000 requests/day/property (600/minute). For a site above 2,000 URLs, full daily coverage via this API is mathematically impossible.
- **Why:** The URL Inspection API resource lists only the single-URL `index.inspect` method — no batch or bulk variant exists anywhere in the Search Console API reference. This is not a temporary gap; it is the complete extent of what Google exposes programmatically for indexing verdicts. A monitoring design that assumes otherwise will either silently under-cover the site or fail outright at scale.
- **Acceptance:**
  - No monitoring job assumes a batch/bulk indexation-status endpoint exists
  - A URL Inspection job explicitly tracks daily call count against the 2,000/day/property budget and fails loudly, not silently, when approaching it
  - Full-site indexation certainty is treated as unobtainable on any single day for a large site; a rotating, prioritized sample (changed pages, highest-value pages) substitutes for full coverage
- **Verify:** `curl -s "https://developers.google.com/webmaster-tools/v1/api_reference_index" | grep -ci 'batch'`
- **Reference:** `apps/cms/src/payload/endpoints/dashboards.ts:145-151`, `apps/cms/src/payload/lib/integrations/kinds/gsc-url-inspection.ts:32,48`
- **Source:** [Tier 1] https://developers.google.com/webmaster-tools/limits (2,000 QPD / 600 QPM per site for URL Inspection) and the absence of any batch method in the current API reference index. This is the SOP's central negative claim in this domain and it **survived a dedicated adversarial refutation attempt**: a verifier independently re-fetched the quota page and the reference index and confirmed no batch/bulk endpoint exists anywhere (`verification-log.md`, "Claims that survived a genuine refutation attempt" — "No bulk index-coverage API"). State this confidently; it is not a hedge, and it shapes what a monitoring pipeline can actually build.
- **Tools:** Not applicable — no SEO crawl tool scores "bulk indexation API availability"; this is an architectural constraint on what any team's own monitoring tooling can do, independent of any third-party product.
- **Anti-patterns:** Designing a nightly job that "reindex-checks the whole sitemap" for a site with tens of thousands of URLs — at 2,000/day, a 50,000-URL sitemap takes 25 days per pass, before accounting for any other consumer of the same per-site quota.
- **Evidence:** `dashboards.ts:145-151`'s comment states the endpoint is "On-demand GSC URL Inspection. Quota-gated by the user click" — a single-URL, editor-triggered call (`gsc-url-inspection.ts:48`, `client.urlInspection.index.inspect`), never a scheduled bulk sweep. No cron job or automated task in the codebase attempts a site-wide indexation pass; `field-data.md` §3 independently exercised this exact API for 4 sample URLs and confirms in its own summary that "Site-wide bulk indexation coverage... is Unverified — no API endpoint exists for it."
- **CleanStart:** Pass

---

### MEAS-03 — Archive Performance-report data before it ages out of the 16-month rolling retention window

- **Severity:** P1
- **Applies:** Always
- **Rule:** If year-over-year or multi-year SEO trend analysis is required for a site, export Search Console Performance data to an external store (BigQuery bulk export or a scheduled API pull) before it reaches 16 months old — do not rely on the GSC or GA4 UI to retain more than that.
- **Why:** "Search Console keeps data for the last 16 months. As a result, reports in Analytics also include a maximum of 16 months of data." This is a hard rolling window with no recovery path: data older than 16 months is dropped permanently, and BigQuery export only captures data forward from the day it is enabled — it cannot backfill history that has already aged out.
- **Acceptance:**
  - A scheduled export (API pull to a warehouse, or GSC's native BigQuery bulk export) runs before the site's Search Console history reaches 16 months
  - The oldest date in the external store is confirmed older than `today − 16 months`; if not, the export was started too late and that history is unrecoverable
- **Verify:** `grep -rilE "16.month|search.console.*(export|archive)|bigquery.*(gsc|search.console)" apps/cms/src apps/web/src`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/analytics/answer/10737381 — "Search Console keeps data for the last 16 months. As a result, reports in Analytics also include a maximum of 16 months of data."
- **Tools:** Not applicable — no SEO tool scores whether a site has provisioned its own historical export; this is an internal-pipeline requirement, not an external-crawl finding.
- **Anti-patterns:** Waiting until a stakeholder asks for "3 years of organic trend" to discover the raw Performance data past 16 months is gone forever — provisioning must be proactive, not reactive.
- **Evidence:** No export job, BigQuery configuration, or scheduled long-horizon archive of GSC Performance data exists anywhere in the codebase. The only GSC-adjacent persistence found is `AnalyticsCache`/the `ga4DataApi`-tagged cache (`apps/cms/src/payload/lib/integrations/cache.ts`), which stores the latest snapshot only (overwritten on each refresh, not an append-only history), and the daily content-insights snapshot (`refresh-content-insights.ts:12-20`), which is a rolling operational cache, not a 16-month-horizon archive. CleanStart's GSC integration went live only in this capture window (see MEAS-01), so no data has yet aged past 16 months, but nothing in the current pipeline would catch or prevent that loss when it eventually would.
- **CleanStart:** Fail

---

### MEAS-04 — GA4 SPA page-view counting depends on a live console toggle that no test or code enforces

- **Severity:** P1
- **Applies:** Any site emitting GA4 `page_view` events manually on client-side route changes (SPA/App Router navigation) instead of relying on GA4's automatic detection
- **Rule:** If a site manually emits `page_view` on SPA navigations to get correct post-title-swap attribution, document and periodically re-verify that GA4's own Enhanced Measurement "History events" automatic page-view detection stays OFF in the live GA4 property console — a code comment alone is not a safeguard against this drifting, and there is no code-level way to detect the resulting double-count from inside the application.
- **Why:** If both the manual emitter and GA4's own automatic SPA detection are active simultaneously, every client-side navigation emits two `page_view` events instead of one, silently inflating pageview/session counts indefinitely until someone happens to notice the numbers look wrong. This is a live external-console setting, invisible to any test that only inspects the application's own source.
- **Acceptance:**
  - The dependency on the console toggle's OFF state is documented in code, not only assumed
  - The toggle's actual state is checked periodically against the GA4 Admin API or console, not asserted once and forgotten
  - A drift-detection signal exists (e.g., a periodic check of average page_views-per-session against a historical baseline) so an accidental re-enable is caught rather than silently compounding
- **Verify:** `grep -n "History events" apps/web/src/components/analytics/Ga4RouteTracker.tsx apps/web/src/components/consent/GatedAnalytics.tsx`
- **Reference:** `apps/web/src/components/analytics/Ga4RouteTracker.tsx:8-19,36-40`, `apps/web/src/lib/analytics/track.ts:59-65`, `apps/web/src/components/consent/GatedAnalytics.tsx:13-23`
- **Source:** [Tier 2] Next.js/GA4 integration pattern is first-party-adjacent implementation detail, not a single Google Tier-1 statement about this specific SPA-tracking interaction; the underlying GA4 Enhanced Measurement "History events" feature itself is documented by Google (Analytics Help, Enhanced Measurement) as an automatic-detection option that can double-fire alongside manual instrumentation — this rule's acceptance criteria are this SOP's own synthesis of that documented behavior applied to a code-driven-tracking codebase, labelled `Convention — not vendor-confirmed` for the drift-detection recommendation specifically.
- **Tools:** Not applicable — no analytics QA tool in this SOP's surveyed set detects a live GA4 console toggle from outside the GA4 Admin API.
- **Anti-patterns:** Treating a code comment ("keep this toggle OFF") as equivalent to an enforced invariant — nothing in the repository would catch a well-meaning GA4 admin re-enabling Enhanced Measurement's automatic page-view tracking months later.
- **Evidence:** `Ga4RouteTracker.tsx:16-19` states directly: "this replaces GA4 Enhanced Measurement's 'history events' tracking... Keep that toggle OFF in the GA4 property or navigations double-count." `GatedAnalytics.tsx:13-16` confirms the initial page load's `page_view` comes from `Ga4HeadScript`'s `gtag('config', ...)` call and every subsequent one from `Ga4RouteTracker`. This dependency is documented only in these two comments; no test, no Admin API check, and no CI job asserts the live GA4 property's Enhanced Measurement configuration. `field-data.md` §2 confirms GA4 is receiving organic-search sessions correctly (154 distinct organic landing pages, 2026-07-01–07-29) with plausible, non-doubled session counts for the property's known traffic volume, which is circumstantial evidence the toggle is currently OFF as intended — but this was not independently confirmed against the GA4 Admin API/console in this pass, per the codebase-inventory's own UNDETERMINED item.
- **CleanStart:** Unverified — the toggle's live GA4-console state is not observable from the codebase or from a session-count plausibility check alone; only a code comment documents the requirement, with no automated drift check

---

## P2 — meaningful improvement, non-urgent

### MEAS-05 — IndexNow reaches Bing/Yandex/Seznam/Naver only — never treat it as notifying Google

- **Severity:** P2
- **Applies:** Any site using IndexNow as a publish-time discovery accelerator
- **Rule:** Do not treat an IndexNow submission as notifying Google. IndexNow accelerates discovery only for its participating engines (Bing, Yandex, Seznam.cz, Naver, and others as the list changes); Google requires its own separate signals (sitemap, internal links, URL Inspection "Request indexing") regardless of IndexNow usage.
- **Why:** IndexNow is an open protocol where participating engines share submitted URLs with each other — but Google has never been among the listed participants. A publish checklist reading "pinged IndexNow, indexing handled" materially overstates its reach for the dominant engine most sites care most about.
- **Acceptance:**
  - Any post-publish automation calling IndexNow is documented (in code comments/runbooks) as covering Bing/Yandex/Seznam/Naver discovery speed only
  - Google discoverability is verified through a separate mechanism and never assumed satisfied by the IndexNow call
  - The current participating-engine list is checked periodically at indexnow.org, since it can change
- **Verify:** `grep -n "IndexNow\|Bing" apps/cms/src/payload/lib/indexnow/submit.ts`
- **Reference:** `apps/cms/src/payload/hooks/indexnow-publish.ts:20-64`, `apps/cms/src/payload/lib/indexnow/submit.ts:1-16,65`
- **Source:** [Tier 1] https://www.indexnow.org/documentation (protocol mechanics, cross-engine sharing) and https://www.indexnow.org/searchengines (participating engines — confirms Google's absence).
- **Tools:** Not applicable — no SEO tool surveyed distinguishes "IndexNow reach" from "Google discoverability" as separate issue classes; the misunderstanding is a documentation/expectation gap, not something a crawl audit flags.
- **Anti-patterns:** A publish checklist that reads "pinged IndexNow, indexing handled" — this is a widely repeated shorthand that materially overstates IndexNow's reach; Google, the dominant engine for this site's traffic, is not on the distribution list (confirmed: `field-data.md` §3's top-query table shows organic clicks arriving via Google Search Console, a channel IndexNow never touches).
- **Evidence:** `submit.ts:1-9` correctly scopes the mechanism in its own doc-comment: "Tells participating search engines (Bing, Yandex, Seznam, Naver, plus a growing list) that a URL has been created or updated" — no code or comment anywhere in the hook claims Google is notified. `indexnow-publish.ts:29-37` fires only on a doc's first `published` transition, gated on `isIndexingAllowed()` (production only) and a non-empty `INDEXNOW_KEY` env var. Separately, this repository's operational note: the live value of `INDEXNOW_KEY` on the production droplet is `Unverified — not observable from this codebase or a static audit` (rendered in via `.github/workflows/deploy-cms.yml:162,227`, but GitHub Actions variable contents aren't visible via `gh api` without additional scopes); if unset, the hook silently no-ops for every publish (`indexnow-publish.ts:36-37`) and no test in the repo would catch that against the deployed environment specifically.
- **CleanStart:** Partial

---

### MEAS-06 — GSC's Position metric is a blended average, not a point-in-time rank

- **Severity:** P2
- **Applies:** Always
- **Rule:** Never report GSC's "Position" column as "our rank for that keyword" without the qualifier that it is an average across all impressions, devices, locations, and personalization states for the site's topmost-ranking URL per query.
- **Why:** Position averages every impression Google logged for a query/page pair in the date range, and when multiple site URLs rank for the same query, only the best of them counts — sibling URLs are invisible to the metric. A real-time SERP check can legitimately disagree with the average, especially at low impression volume where the average is numerically unstable.
- **Acceptance:**
  - Any dashboard cell labeled "Position" or "Avg. Position" carries a tooltip or footnote stating it is a blended average, not a single-point rank
  - Position is not used to justify a ranking claim for a query without enough impressions (practitioner consensus: multiple dozens, not single digits) to be numerically stable
- **Verify:** `grep -n '"Pos"\|position.toFixed' apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx`
- **Reference:** `apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx:308,318`
- **Source:** [Tier 1] https://support.google.com/webmasters/answer/7042828 — official definition, "a relative ranking of the position of your link on Google, where 1 is the topmost position," averaged across every logged impression.
- **Tools:** Not applicable — this is a dashboard-labeling/interpretation rule, not a defect a crawl or rank-tracking tool scores.
- **Anti-patterns:** Treating month-over-month movement in GSC's average Position as equivalent to "we moved from rank 8 to rank 5" the way a dedicated rank tracker reports — GSC's own docs never claim single-point-in-time precision.
- **Evidence:** `AnalyticsTab.tsx:308` renders the column header as plain `Pos`, and `:318` renders `q.position.toFixed(1)` with no accompanying tooltip, footnote, or caveat text anywhere in the component. `field-data.md` §3's top-10-query table shows this concretely: `oci image` shows Avg. position 2.76 on only 8 clicks from 1,127 impressions — exactly the low-click, high-impression pattern the source material flags as numerically unstable if read as a fixed rank.
- **CleanStart:** Fail

---

### MEAS-07 — The Page Indexing report is a capped, non-exhaustive sample — use URL Inspection for single-URL truth

- **Severity:** P2
- **Applies:** Always
- **Rule:** Use the Page Indexing (Index Coverage) report only for aggregate indexation trend/triage. Use the URL Inspection tool or API — never the Page Indexing report's example-URL lists — to determine whether one specific URL is indexed.
- **Why:** The report shows "an example list of up to 1,000 URLs" per status and is explicitly "not guaranteed to show all URLs in a given status, even when less than 1,000 items." Google states directly that the report "isn't used to investigate the index status of specific pages."
- **Acceptance:** A "is this page indexed" question is answered by a URL Inspection call returning `indexingState`/`verdict` for that exact URL, never by searching for the URL inside a Page Indexing status bucket's example list.
- **Verify:** `curl -s -X POST "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect" -H "Authorization: Bearer $GSC_TOKEN" -d '{"inspectionUrl":"https://www.cleanstart.com/","siteUrl":"sc-domain:cleanstart.com"}'`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/gsc-url-inspection.ts:32-56`, `apps/cms/src/payload/endpoints/dashboards.ts:145-151`
- **Source:** [Tier 1] https://support.google.com/webmasters/answer/7440203 — "This report isn't used to investigate the index status of specific pages. To find the index status of a specific page, use the URL Inspection tool."
- **Tools:** Sitebulb's closest hint is sitemap-scoped ("Not Found (4XX) URL in XML Sitemaps"), which doesn't cover a URL absent from a capped example list; no tool surveyed publishes this exact distinction.
- **Anti-patterns:** Concluding a URL is "not indexed" because it doesn't appear in a capped 1,000-row example list — absence from the sample is not evidence of non-indexation.
- **Evidence:** `field-data.md` §3 confirms the codebase's actual pattern already matches this rule: per-URL indexation truth for 4 sample URLs came from `urlInspection.index.inspect` calls, not from scraping any Page Indexing report bucket, and all four returned `PASS` / "Submitted and indexed" with matching `googleCanonical`/`userCanonical`.
- **CleanStart:** Pass

---

### MEAS-08 — GSC omits anonymized long-tail queries below a rolling threshold — treat query-level totals as a lower bound

- **Severity:** P2
- **Applies:** Always
- **Rule:** Never reconcile the sum of visible per-query rows in the Performance report against the chart's total clicks/impressions and call the gap an error — the gap is anonymized queries, by design, and is not recoverable at the query level.
- **Why:** Queries issued by only a few dozen users over 2–3 months are omitted from the query-dimension table entirely to protect searcher privacy; their traffic still counts in property/page-level chart totals. This produces a materially incomplete long-tail query list even though it is privacy filtering, not classic statistical sampling.
- **Acceptance:** A dashboard or alert built on "top N queries" is documented as covering only non-anonymized queries above the threshold; a query-table sum running below the page-level/property-level total for the same range is expected, not a bug.
- **Verify:** `grep -n "rowLimit" apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts apps/cms/src/payload/lib/integrations/kinds/gsc-search-analytics.ts`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts:35,39,44,48`
- **Source:** [Tier 1] https://developers.google.com/search/blog/2022/10/performance-data-deep-dive — anonymization threshold and "included in chart totals unless filtered by query" behavior.
- **Tools:** Not applicable — no crawl or rank tool exposes GSC's own query-anonymization behavior as a scoreable issue.
- **Anti-patterns:** Reporting "we only rank for N queries" based on a visible query list — the true query surface is materially larger on an established site; the visible list is filtered, not exhaustive.
- **Evidence:** `gsc-overview.ts:39,44` computes site-wide totals via a separate, dimensionless `rowLimit: 1` call, independent of the `dimensions: ['query'], rowLimit: 1000` call at `:48` — the two are never summed against each other anywhere in this file, so the codebase has no "reconcile query-sum against chart total" bug to begin with.
- **CleanStart:** Pass

---

### MEAS-09 — The Performance report's most recent data is provisional for hours, not days — exclude it from drift comparisons until finalized

- **Severity:** P2
- **Applies:** Always
- **Rule:** Never draw a ranking-drift or traffic-drop conclusion from the Performance report's most recent data without confirming it is finalized. Google's own documentation states preliminary data is "usually today's data and sometimes yesterday's" and "may change in the next few hours" — not a multi-day window.
- **Why:** Corrected per `verification-log.md` #22: the original research file's "2–4 days provisional" figure is not stated by its own cited source. `support.google.com/webmasters/answer/17011364`, fetched directly, says preliminary data is typically today's (sometimes yesterday's) and may change within hours. Overstating the provisional window either delays legitimate alerting unnecessarily or, if a team assumes a fixed "day 4 is final" rule, can still fire on data Google is actively revising.
- **Acceptance:** An automated alert on click/impression drop uses `dataState: "final"` (the API default) or explicitly labels `all`/`hourly_all` figures as provisional in the alert text, re-checking only after Google's documented hours-scale finalization window, not a fixed multi-day figure.
- **Verify:** `grep -n "dataState" apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts apps/cms/src/payload/lib/integrations/kinds/gsc-search-analytics.ts`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts:35-48`, `apps/cms/src/payload/lib/integrations/kinds/gsc-search-analytics.ts:56,99`
- **Source:** [Tier 1] https://support.google.com/webmasters/answer/17011364 (preliminary-data window, corrected wording per verification-log #22); [Tier 1] https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics (`dataState` field semantics, default `"final"`).
- **Tools:** Not applicable — this is a verification-methodology rule, not a defect any external tool scores.
- **Anti-patterns:** Firing a "traffic cratered" alert off yesterday's Performance chart number — that number is still accumulating and typically rises as processing completes over the following hours.
- **Evidence:** Neither `gsc-overview.ts` nor `gsc-search-analytics.ts` sets `dataState` explicitly, so both calls use the API's own default, `"final"` — finalized-only data by construction, satisfying this rule's acceptance criterion without any additional code. `field-data.md` §3 independently observed the corollary lag directly: a `dimensions: [date]` query for the requested 2026-07-01–07-29 range returned real rows only through 2026-07-26, "the remaining 3 requested days are within GSC's normal 2–3 day reporting-lag window and are not yet available" — consistent with an hours-to-low-days finalization window, not the uncorrected "2–4 days provisional" figure.
- **CleanStart:** Pass

---

### MEAS-10 — GSC clicks and GA4 sessions measure different events and will never reconcile — track the ratio, not the delta

- **Severity:** P2
- **Applies:** Any site reporting both GSC and GA4 organic-search metrics
- **Rule:** Never treat GSC "Clicks" and GA4 "Organic Search sessions" for the same date range as a count that should match. If they diverge, investigate a change in the *ratio* between them over time, not the raw gap on any single day.
- **Why:** GSC counts a click server-side the instant a user selects a SERP result, before the destination page or its analytics tag loads. GA4 counts a session only after its JavaScript executes and fires a session/engagement event. Users who bounce before the tag loads, block the script, or decline consent are counted by one system but not the other. There is no documented mechanism by which the two converge.
- **Acceptance:** A reporting dashboard tracking both metrics compares GSC-clicks-to-GA4-sessions as a ratio over time and alerts on a *change* in that ratio, rather than alerting on the two absolute numbers failing to match — which is the permanent, expected state.
- **Verify:** `grep -rn "ratio\|reconcil" apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/analytics/answer/10737381 (GA4-GSC integration data model). Mechanism paragraph note per `verification-log.md` #23: the server-side-log-vs-client-side-tag timing explanation is a practitioner reconstruction consistent with each product's independently documented architecture, not a single Google-stated mechanism — stated here with that hedge, not as flat Google-confirmed fact.
- **Tools:** Not applicable — no SEO or analytics tool surveyed publishes a "GSC-vs-GA4 reconciliation" check; the expectation itself is the thing to correct, not a tool finding.
- **Anti-patterns:** A recurring team ritual of "reconciling" GSC clicks against GA4 sessions to find the "true" number — there is no true number to converge on; the products measure different moments in the user journey by design.
- **Evidence:** GSC data (`gsc-overview.ts`, `gsc-search-analytics.ts`) and GA4 data (`ga4-data-api.ts`) are fetched via entirely separate integration rows and surfaced on separate dashboard tabs — no code path in this repo sums, diffs, or attempts to reconcile the two, so the specific anti-pattern this rule warns against is absent. Equally, no code path computes or alerts on the recommended clicks-to-sessions ratio either; the positive practice this rule recommends is not implemented.
- **CleanStart:** Partial

---

### MEAS-11 — GA4's Search Console integration cannot attribute a conversion to a specific query

- **Severity:** P2
- **Applies:** Any site using GA4's native Search Console linking feature to report query-level data inside GA4
- **Rule:** Do not attempt to answer "which query drove this conversion" using GA4's Search Console integration report — it structurally cannot join query-level GSC data to a user-level GA4 conversion event. Use it only for query-to-landing-page traffic correlation.
- **Why:** "Search Console metrics are only compatible with Search Console dimensions and the following Analytics dimensions: Landing page, Device, Country" (verbatim, correcting the "work exclusively with... plus three Analytics dimensions" paraphrase per `verification-log.md` #24). GSC has no concept of a user or session, so no report can join a query to a user-level conversion.
- **Acceptance:** A request for "revenue by keyword" is answered as "not available at the query level," not approximated from the Landing Page report, which can at best correlate a page's aggregate query mix with that page's aggregate conversions — a page-level correlation, not query-level attribution.
- **Verify:** `grep -rn "Search Console\|searchConsole" apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/analytics/answer/10737381 — "Search Console metrics are only compatible with Search Console dimensions and the following Analytics dimensions: Landing page, Device, Country."
- **Tools:** Not applicable — no tool surveyed evaluates GA4's own report-composition limits.
- **Anti-patterns:** Building an executive dashboard claiming "$X revenue from keyword Y" sourced from GA4 — no documented mechanism supports query-level revenue attribution; at best this is a page-level inference dressed up as a query-level fact.
- **Evidence:** CleanStart does not use GA4's built-in Search Console linking feature at all — GSC data (`gsc-overview.ts`, `gsc-search-analytics.ts`) and GA4 data (`ga4-data-api.ts`) are pulled through two independent, separately-credentialed integration rows in the CMS's own `Integrations` collection, not through GA4's native Search Console report. The specific two-report GA4-UI limitation this rule describes therefore has no corresponding code path to violate, though the underlying constraint it reflects (no query-level revenue attribution is possible from any combination of these two products) still applies conceptually to any dashboard built on top of these integrations.
- **CleanStart:** N/A

---

### MEAS-12 — GA4 privacy thresholding can silently withhold organic-search rows — a missing row is not necessarily a traffic drop

- **Severity:** P2
- **Applies:** Always
- **Rule:** Before treating a missing segment/row in a GA4 organic-search report as a real traffic anomaly, check the report's data-quality indicator for a thresholding notice. Thresholding, not an actual drop, is a documented, expected cause of missing rows at low volume.
- **Why:** GA4 withholds data for a report segment when the underlying user/event count is too low to protect identifiability. The correct read of an absent row under thresholding is "insufficient volume to report," never "zero traffic."
- **Acceptance:** Any GA4 report used for organic-search segment analysis is checked for the thresholding banner (in the GA4 UI, not just via API) before its absence-of-data is reported as a finding.
- **Verify:** `grep -n "threshold" apps/cms/src/payload/lib/integrations/kinds/ga4-data-api.ts`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/analytics/answer/9383630. Per `verification-log.md` #25: drop the original file's unsupported clause attributing thresholding specifically to "Google Signals... blended/observed reporting identity" — the cited page does not support that mechanism; the general low-volume-withholding rule stands on its own without it.
- **Tools:** Not applicable — thresholding is a GA4 UI/product behavior no external SEO tool surfaces.
- **Anti-patterns:** Reporting "organic conversions from [narrow segment] dropped to zero" when the true cause is the segment fell below GA4's aggregation threshold for that date range.
- **Evidence:** `ga4-data-api.ts`'s queries (landing-page sessions, organic filters) run at a query-volume/dimension breadth unlikely to trigger thresholding for this site's traffic today, but no code checks for or surfaces a thresholding indicator if a future narrower query did trigger it — the check this rule requires happens only in the GA4 UI, which is outside what a static code or API-response audit can confirm.
- **CleanStart:** Unverified — thresholding is a GA4-UI-only signal not observable from the codebase or a plain Data API response in this pass

---

### MEAS-13 — CrUX field data requires a minimum-traffic eligibility threshold — absence of a record is not a bad score

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not build a monitoring pipeline that assumes every page, or even every origin, has CrUX real-user field data. Confirm data presence before alerting on CrUX-derived Core Web Vitals for any specific URL, and fall back to origin-level aggregates (or clearly-labeled lab data) when page-level data is absent.
- **Why:** CrUX eligibility requires the origin/page to be "sufficiently popular" — an undisclosed threshold chosen to ensure enough samples for statistical confidence. Origin-level data can exist even when a specific page never independently clears the page-level threshold, so many real, healthy pages simply have no CrUX row at all.
- **Acceptance:** A CrUX-based dashboard cell either shows real data or an explicit "insufficient traffic — no CrUX data" state; it must never render indistinguishably from a real zero/good score.
- **Verify:** `curl -s -X POST "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"url":"https://www.cleanstart.com/careers"}'`
- **Reference:** `apps/cms/src/payload/jobs/refresh-crux.ts:12-21`, `apps/cms/src/payload/lib/integrations/kinds/crux.ts`
- **Source:** [Tier 1] https://developer.chrome.com/docs/crux/methodology — user/origin/page eligibility criteria and the undisclosed popularity threshold.
- **Tools:** Not applicable — no third-party SEO tool surfaces CrUX's own eligibility gate as a distinct scoreable issue.
- **Anti-patterns:** Interpreting "no CrUX record" for a new or low-traffic page as "this page has a Core Web Vitals score of zero/failing" — absence of a record means insufficient real-user sample, not a bad score.
- **Evidence:** `refresh-crux.ts:19-20` fetches only `resolveCruxOrigin()` with an empty URL list — the automated daily job deliberately queries origin-level CrUX only, never attempting per-URL monitoring that would routinely hit the eligibility trap in production. `field-data.md` §1 independently exercised the URL-level case ad hoc for three high-traffic templates (`/guide/oci-image-format`, `/about-us`, `/careers`) and confirmed all three returned the documented `404 "chrome ux report data not found"` response — correctly logged as "Unverified — CrUX has no record for these URLs," not misread as a failing score.
- **CleanStart:** Pass

---

### MEAS-14 — CrUX API and BigQuery differ in URL resolution and lag — use the right one for the question being asked

- **Severity:** P2
- **Applies:** Any site building CrUX-based dashboards or historical analysis
- **Rule:** Use the CrUX API when URL-level, near-real-time Core Web Vitals monitoring is required. Use BigQuery only for historical/longitudinal origin-level analysis, and budget for its release cadence.
- **Why:** The CrUX API serves a rolling 28-day window, updated daily with roughly a 2-day lag; CrUX on BigQuery is released monthly (the second Tuesday of the following month, stated verbatim by Google per `verification-log.md` #26) and is not documented at URL-level resolution in the cited schema reference — origin-level only.
- **Acceptance:** A job needing "this specific page's LCP this week" queries the CrUX API; a job producing "our top pages' CWV trend over 12 months" pulls from BigQuery and labels the granularity as origin-level, not per-URL.
- **Verify:** `grep -n "chromeuxreport\|bigquery" apps/cms/src/payload/lib/integrations/kinds/crux.ts`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/crux.ts`, `apps/cms/src/payload/jobs/refresh-crux.ts:12-21`
- **Source:** [Tier 1] https://developer.chrome.com/docs/crux/guides/crux-api (API cadence, ~2-day lag) and https://developer.chrome.com/docs/crux/bigquery ("released on the second Tuesday of the following month," verbatim). Per `verification-log.md` #26, the origin-resolution-only claim for BigQuery specifically is not verbatim-confirmed on the cited page in this SOP's sourcing pass and should be read as widely-documented convention rather than a directly quoted guarantee.
- **Tools:** Not applicable — no third-party tool distinguishes CrUX API vs. BigQuery resolution as a scoreable issue.
- **Anti-patterns:** Writing a BigQuery query filtered to a specific page URL and treating an empty, non-error result as "page passes CWV" — the schema has no URL-level rows to match at that resolution in the first place.
- **Evidence:** CleanStart's only CrUX integration is the API (`crux.ts`, `refresh-crux.ts`) — no BigQuery export or query exists anywhere in the codebase, so there is no risk of the anti-pattern this rule warns against; conversely, this also means no origin-level 12-month historical trend is available beyond what the API's own 28-day rolling window and the CMS's own cache snapshots retain.
- **CleanStart:** Pass

---

### MEAS-15 — Search Analytics API exports are capped at 50,000 rows/day/site/search-type — paginate and terminate cleanly

- **Severity:** P2
- **Applies:** Any programmatic export of Search Analytics data at scale (not a small, capped dashboard pull)
- **Rule:** When exporting Performance data programmatically, page through results with `rowLimit` (max 25,000/request) and `startRow`, and do not expect more than 50,000 total rows/day/site/search-type — plan around this ceiling, not around it being unlimited.
- **Why:** Beyond the 50,000-row/day ceiling, additional dimension granularity is simply not retrievable that day, regardless of pagination correctness. A script that silently truncates instead of terminating cleanly and logging the reason can misreport partial data as complete.
- **Acceptance:** An automated export script terminates cleanly (not silently truncating) when it hits either the 50,000-row ceiling or a quota response, and logs which happened.
- **Verify:** `grep -n "rowLimit\|startRow" apps/cms/src/payload/lib/integrations/kinds/gsc-search-analytics.ts apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/gsc-search-analytics.ts:56,99`, `apps/cms/src/payload/lib/integrations/kinds/gsc-overview.ts:35,39,44,48`
- **Source:** [Tier 1] https://support.google.com/webmasters/answer/12919192 (50,000-rows/day/site/type ceiling — corrected citation per `verification-log.md` #21, this is the URL that actually states the figure, not the two URLs the original research file cited for it) and https://developers.google.com/webmaster-tools/limits (1,200 QPM per site/user quota).
- **Tools:** Not applicable — export-pagination correctness is an internal-pipeline property, not something a crawl tool observes.
- **Anti-patterns:** Treating a 1,000-row default response (no `rowLimit` set) as "all the queries the site ranks for" — it is the API default page size, and even the true 50,000/day ceiling is still far short of every query/page combination on a large site.
- **Evidence:** CleanStart's current GSC calls are small, fixed dashboard pulls (`rowLimit: 10` for top-queries display, `rowLimit: 1` for totals, `rowLimit: 1000` for the query-distribution chart) — orders of magnitude under the 25,000-per-request/50,000-per-day ceilings, confirmed by this site's own traffic scale (`field-data.md` §3: 1,028 total clicks over 26 days). No `startRow` pagination logic exists anywhere in the codebase because none of the current calls need it, and consequently no explicit "hit the ceiling, log it, stop cleanly" path has been built or exercised.
- **CleanStart:** Partial

---

## P3 — hygiene, marginal or speculative gain

### MEAS-16 — Check Bing's URL Submission API quota programmatically — do not hardcode a figure

- **Severity:** P3
- **Applies:** Sites integrating directly with Bing's dedicated URL Submission API (distinct from IndexNow, which most sites use instead today)
- **Rule:** Before a bulk URL-submission job to Bing's own Submission API, call the quota-check endpoint (`GetUrlSubmissionQuota`) to get the account's actual daily/monthly allotment, rather than hardcoding a number.
- **Why:** Bing supports raising an account's quota on request, so a hardcoded figure can under- or over-shoot the real entitlement at any time.
- **Acceptance:** A submission script calls the quota endpoint first and throttles/queues remaining URLs rather than firing all URLs and handling a bulk rejection after the fact.
- **Verify:** `grep -rn "bing.*submit\|GetUrlSubmissionQuota" apps/cms/src apps/web/src`
- **Reference:** None — no reference implementation
- **Source:** Convention — not vendor-confirmed. Per `verification-log.md` #27, the specific "500/batch, ~10,000/day" figures were refuted as sourced: the cited 2021 Bing blog post states neither figure, and the cited Microsoft Learn `GetUrlSubmissionQuota` reference is a bare method signature whose only numbers are an unrelated sample response. The real source for those figures traces to two uncited 2019 Bing blog posts not independently re-located and verified in this authoring pass, and the 2021 post now redirects readers toward IndexNow instead. The quota-check *method's existence* is itself confirmed at [Tier 1] https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturlsubmissionquota — only the specific batch-size/daily-quota figures are downgraded here.
- **Tools:** Not applicable — Bing-specific submission quotas are outside what any SEO tool surveyed in this SOP scores.
- **Anti-patterns:** Assuming every property gets the same fixed quota indefinitely and hardcoding "10,000/day" into an automation without a quota-check call.
- **Evidence:** No direct Bing URL Submission API integration exists in this codebase — CleanStart's only Bing-facing mechanism is the shared IndexNow endpoint (`apps/cms/src/payload/lib/indexnow/submit.ts`, MEAS-05), not Bing's separate dedicated Submission API this rule addresses.
- **CleanStart:** N/A

---

### MEAS-17 — The unified Search Console "Page Experience report" was retired in November 2024 — update stale references

- **Severity:** P3
- **Applies:** Always
- **Rule:** Update any runbook, dashboard link, or documentation that references the Search Console "Page Experience report" — it no longer exists as a unified report. Monitor Core Web Vitals and HTTPS status as two independent reports instead, and use INP (not FID) as the interactivity metric.
- **Why:** Google removed the combined report (which had merged Core Web Vitals and HTTPS/Security data) around November 18, 2024, citing reduced "unnecessary clutter"; the constituent reports continued independently. This sits alongside the separate March 12, 2024 change where INP replaced FID as the responsiveness Core Web Vital.
- **Acceptance:** No internal documentation, saved Search Console link, or dashboard integration references a "Page Experience report" URL/tab or "FID" as a currently-monitored metric.
- **Verify:** `grep -rniE "page experience report|\bFID\b" docs/ apps/web/docs 2>/dev/null | grep -v "replaced FID\|INP.*FID"`
- **Reference:** `docs/web/WEB-PRODUCTION.md:466`
- **Source:** Per `verification-log.md` #28, sourcing framing corrected: no Search Central blog post or Help Center changelog documents the removal directly, but a genuine Google primary-source statement exists on LinkedIn (Google Search Central's own account, quoted verbatim across independent outlets): "We're removing the Page Experience report in Search Console... Core Web Vitals and the HTTPS reports... will continue to be available... to reduce unnecessary clutter." [Tier 1] — hedge on *channel* (LinkedIn, not the blog), not on whether Google said it. INP-replaces-FID is independently [Tier 1]: https://developers.google.com/search/blog/2023/05/introducing-inp.
- **Tools:** Not applicable — documentation currency is not something an external tool scores.
- **Anti-patterns:** An SOP or client report template still budgeting a single "Page Experience score" — that unified score/report no longer exists; Core Web Vitals and HTTPS must be tracked and reported as two separate signals.
- **Evidence:** `docs/web/WEB-PRODUCTION.md:466` already correctly states "INP < 200ms (replaced FID Mar 2024)" — a currency-correct reference, not a stale one. No document in `docs/` references a unified "Page Experience report" as a current destination.
- **CleanStart:** Pass

---

## What each data source cannot tell you

Misreading a tool's structural limits is the most common cause of a wrong SEO conclusion in this domain — more common than any single wrong number. This section states the limits plainly, once, so no individual rule above has to re-litigate them.

- **GSC cannot tell you the true long-tail query list for a high-traffic site.** Queries issued by only a few dozen users over 2–3 months are anonymized out of the query-dimension table entirely (MEAS-08) — their traffic still counts in page/property totals, but they can never be individually named. A "top N queries" report is a lower bound on query diversity, never the full picture, and the gap grows with site scale.
- **GSC cannot give you a single-URL index verdict from the Page Indexing report**, only from URL Inspection (MEAS-07) — and it cannot give you a bulk, site-wide index-coverage answer through *any* API at all (MEAS-02). The Page Indexing report's example lists are capped and non-exhaustive; the URL Inspection API is authoritative but single-URL and throttled to 2,000/day/property. There is no documented mechanism — in this SOP, across every source consulted, surviving a dedicated refutation attempt — that answers "is my whole site indexed?" on any single day for a site above roughly 2,000 URLs.
- **GSC's Position metric cannot substitute for a rank tracker** (MEAS-06): it is a blended average across every impression, device, location, and personalization state for the site's best-ranking URL per query, not a point-in-time SERP observation.
- **GSC clicks and GA4 organic sessions cannot be reconciled to a matching number, ever** (MEAS-10): GSC logs a click server-side the instant a SERP result is selected; GA4 counts a session only once its own JavaScript executes in the browser. Users who bounce before the tag fires, block scripts, or decline consent are counted by one system and not the other, permanently and by design. The only meaningful signal is a *change in the ratio* between them over time, not the raw gap on any given day.
- **GA4 cannot attribute a conversion, or any revenue, to a specific search query** (MEAS-11) — its Search Console integration report is restricted to Search Console dimensions plus exactly three GA4 dimensions (landing page, device, country); there is no query-to-user-level join anywhere in GA4.
- **GA4 cannot show you a segment breakdown once volume drops below its privacy threshold** (MEAS-12) — a blank or missing row means "cannot report at this volume," never "zero traffic." Confirming which one it is requires opening the GA4 UI itself; no API response in this pass surfaced a machine-readable thresholding flag.
- **CrUX cannot tell you anything about a page that hasn't cleared Google's undisclosed minimum-traffic ("popularity") threshold** (MEAS-13) — confirmed directly against this site: three real, healthy, indexed CleanStart templates (`/guide/oci-image-format`, `/about-us`, `/careers`) returned a flat `404 chrome ux report data not found` at the URL level, while the origin and home page both returned real data. Absence of a CrUX record is a traffic-volume fact, never a quality verdict. CrUX's BigQuery export additionally cannot answer anything at URL resolution at all — only origin-level, and on a monthly release cadence rather than the API's ~2-day lag (MEAS-14).
- **IndexNow cannot tell you, or ensure, anything about Google's indexing queue** (MEAS-05) — it is not wired to Google at all; it reaches only Bing, Yandex, Seznam.cz, and Naver.
- **No source in this domain offers a bulk "is my whole site indexed" answer.** The closest primary-source mechanism, the Page Indexing report, is an explicitly-capped, non-exhaustive sample; the exhaustive alternative, the URL Inspection API, is a single-URL lookup throttled to 2,000/day/property. Full-site indexation certainty is not obtainable through any documented Google API on any single day — this is the central, load-bearing negative claim of this module, and it survived a dedicated adversarial attempt to refute it (MEAS-02).
