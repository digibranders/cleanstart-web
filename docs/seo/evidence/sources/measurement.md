# SEO Measurement and Monitoring — Evidence Sources

Research basis for the SOP governing SEO measurement/monitoring across all team sites. Every rule below is sourced from a primary reference (Tier 1/2) unless explicitly marked otherwise. All URLs were fetched/verified during research; none are invented.

**Tier legend:** T1 = Google Search Central / Search Console docs, GA4 docs, CrUX docs, indexnow.org, Bing Webmaster docs. T2 = first-party platform docs. T3 = named, dated empirical study with published methodology. T4 = practitioner consensus.

---

## 1. Choose Domain properties for whole-site coverage; URL-prefix only when DNS access is unavailable

**Rule:** Verify every production site as a Domain property in Search Console; use a URL-prefix property only as a fallback when DNS-record verification is impossible, and never assume a URL-prefix property covers subdomains or alternate protocols.

**Mechanism:** A Domain property aggregates data across "all subdomains (m, www, and so on) and multiple protocols (http, https, ftp)" for the registrable domain — it is verified via DNS TXT record only (or automatically on Google-hosted platforms). A URL-prefix property "includes only URLs with the specified prefix, including the protocol" — `https://example.com/pets/` excludes `http://example.com/pets/` and `https://m.example.com/pets/` entirely; each protocol/subdomain variant needs its own property. Neither property type can selectively include/exclude a URL path inside its scope.

**Acceptance criterion:** For a domain with both `www` and bare-apex traffic (or an `m.` subdomain), the verified property is Domain-type, and Performance-report totals include traffic from every subdomain/protocol variant without needing to sum multiple properties.

**Verification:** In Search Console → property selector → confirm the property is listed under "Domain properties" (globe icon), not "URL-prefix properties." Cross-check `dig TXT example.com` shows the `google-site-verification=` record.

**Source:** "Search Console Domain and URL-prefix properties," [Search Console Help — Add a property](https://support.google.com/webmasters/answer/34592), Google. T1.

**Anti-pattern:** Running only a `https://www.example.com/` URL-prefix property and concluding "site has no bare-apex or `m.` traffic" — the property structurally cannot see that traffic, so absence of evidence is not evidence of absence.

---

## 2. Search Analytics API exports are capped at 50,000 rows/day/site/search-type via pagination, 25,000 per single call

**Rule:** When exporting Performance data programmatically, page through results with `rowLimit` (max 25,000 per request) and `startRow`, and do not expect more than 50,000 total rows per site per search type per day — plan sampling/aggregation strategy around this ceiling, not around it being unlimited.

**Mechanism:** The Search Analytics `query` method's response metrics are `clicks`, `impressions`, `ctr` (0–1.0), and `position` ("Average position in search results"); `rowLimit` accepts 1–25,000 (default 1,000) and `startRow` pages further, but Google documents an upper bound of 50,000 rows/day/site/search-type on what can be exported at all — beyond that, additional dimension granularity (e.g., page+query+device+country combinations) is simply not retrievable that day. Additionally, Search Analytics enforces separate short-term (10-minute) and long-term (1-day) *load* quotas — computed from query cost (grouping, filtering, date-range length), not row count — on top of QPM/QPD request quotas (1,200 QPM per site/user; 30,000,000 QPD / 40,000 QPM per project).

**Acceptance criterion:** An automated export script terminates cleanly (not silently truncates) when it hits either the 50,000-row ceiling or a 429/quota response, and logs which happened.

**Verification:** `curl` the `searchanalytics/query` endpoint with `rowLimit: 25000` and successive `startRow` values; confirm the loop stops requesting once a `startRow`+`rowLimit` combination returns fewer rows than requested, and separately confirm quota headers/`403` responses are handled, not swallowed.

**Source:** [Search Analytics: query — reference](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics), [Usage Limits — Search Console API](https://developers.google.com/webmaster-tools/limits), Google. T1.

**Anti-pattern:** Treating a 1,000-row default response (no `rowLimit` set) as "all the queries the site ranks for" — it is the API default page size, not the data ceiling, but the *true* ceiling (50,000/day) is still far short of "every query/page combination," especially for large sites.

---

## 3. GSC omits "anonymized" long-tail queries below a rolling threshold — treat query-level totals as a lower bound, not the full picture

**Rule:** Never reconcile the sum of visible per-query rows in the Performance report against the chart's total clicks/impressions and call the gap an error — the gap is anonymized queries, by design, and cannot be recovered at the query level.

**Mechanism:** Queries "that aren't issued by more than a few dozen users over a two-to-three month period" are omitted from the query-dimension table entirely to protect searcher privacy; their traffic is still included in property/page-level chart totals unless the report is filtered by query. This is privacy filtering, not statistical sampling in the classic sense — Google does not randomly subsample clicks — but it produces a comparable effect: a materially incomplete long-tail query list, frequently reported as omitting a large share of total query volume on high-traffic sites.

**Acceptance criterion:** A dashboard or alert built on "top N queries" must be documented as covering only non-anonymized queries above the threshold, and any total computed by summing the query table must be expected to run below the page-level or property-level total for the same date range — a match is not the target state.

**Verification:** For a date range, compare SUM(clicks) across the Queries tab to the single aggregate number in the Performance chart for the same range/filter; the query-tab sum will normally be lower, and that gap is expected, not a bug.

**Source:** "A deep dive into Search Console performance data filtering and limits," [Google Search Central Blog, Oct 2022](https://developers.google.com/search/blog/2022/10/performance-data-deep-dive) (anonymization threshold and "included in chart totals unless filtered by query" behavior). T1.

**Anti-pattern:** Reporting "we only rank for N queries" based on the visible query list on a large/established site — the true query surface is materially larger; the visible list is filtered by the anonymization threshold, not exhaustive.

---

## 4. The Performance report's most recent 2–4 days is provisional — exclude it from trend/drift comparisons

**Rule:** Never draw a ranking-drift or traffic-drop conclusion from the last few days of the Performance report without first confirming the data is finalized (non-preliminary); default report views already exclude same-day/previous-day data for this reason.

**Mechanism:** The Performance UI marks the most recent data as preliminary with a dotted line on the trend chart and states it may still change; via the API, `dataState: "final"` (the default) returns only finalized data, while `dataState: "all"` includes fresh, still-updating data, and `dataState: "hourly_all"` exposes partial hourly figures. Google's own 2024 change added a distinct "recent" near-24-hour view specifically so users could see very fresh data without mistaking it for final numbers.

**Acceptance criterion:** Any automated alert on click/impression drop compares only `dataState: "final"` rows, or explicitly labels `all`/`hourly_all` figures as provisional in the alert text, and re-checks after the data has had time to finalize before escalating.

**Verification:** Call the API twice for the same date — once immediately, once 5+ days later — and confirm the two responses can differ for the most recent days when `dataState` was `all`, but are stable when `dataState` is `final`.

**Source:** Performance report chart preliminary-data marking and export behavior — [Search Console Help, "Performance report: About the data"](https://support.google.com/webmasters/answer/17011364), Google. T1. `dataState` field semantics — [Search Analytics: query reference](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics), Google. T1. Near-24-hour "recent data" addition — [An improved way to view your recent performance data in Search Console, Google Search Central Blog, Dec 2024](https://developers.google.com/search/blog/2024/12/recent-data-search-console). T1.

**Anti-pattern:** Firing a "traffic cratered" alert off yesterday's number in the Performance chart — that number is still accumulating and will typically rise as processing completes over the next several days.

---

## 5. Performance-report data is retained on a rolling 16-month window — archive it externally if longer history is needed

**Rule:** If year-over-year or multi-year SEO trend analysis is required, export Performance data to an external store (BigQuery bulk export or a scheduled API pull) before it ages out — do not rely on the GSC/GA4 UI to retain more than 16 months.

**Mechanism:** "Search Console keeps data for the last 16 months. As a result, reports in Analytics also include a maximum of 16 months of data." This is a hard rolling window: data older than 16 months is dropped permanently from the Performance report and from the GA4 Search Console integration alike, with no recovery path once it ages out (BigQuery export only captures data forward from the day it is enabled).

**Acceptance criterion:** A monitoring pipeline for any site under management has a scheduled export running (API pull to a warehouse, or GSC's native BigQuery bulk export) before that site's data reaches 16 months of Search Console history — verified by confirming rows exist in the external store for dates approaching the 16-month boundary.

**Verification:** Query the external export for the oldest available date and confirm it is older than `today − 16 months`; if not, the export was not started early enough and that history is unrecoverable.

**Source:** "Search Console keeps data for the last 16 months... Search Console data is available in Search Console and in Analytics 48 hours after it is collected by Search Console." — [Connect Search Console to Google Analytics](https://support.google.com/analytics/answer/10737381), Analytics Help, Google. T1.

**Anti-pattern:** Waiting until a client asks for "3 years of organic trend" to discover the raw Performance data past 16 months is gone forever — this must be provisioned proactively, not reactively.

---

## 6. GSC's Position metric is a blended average of best-page-per-query impressions, not a point-in-time rank — do not use it as a rank tracker

**Rule:** Never report GSC's "Position" column as "our rank for that keyword" in a client-facing or internal dashboard without the qualifier that it is an average across all impressions, devices, locations, and personalization states, and reflects only the site's topmost-ranking URL per query.

**Mechanism:** Position is officially defined as "a relative ranking of the position of your link on Google, where 1 is the topmost position, 2 is the next position, and so on," averaged across every impression Google logged for that query/page combination in the date range. When a site has multiple URLs ranking for the same query in one SERP, only the topmost of those URLs' positions is counted for that query — lower-ranking sibling URLs are invisible to the metric. Because it blends personalized, localized, mobile, and desktop results into one number, an individual real-time SERP check (a true rank tracker) can legitimately disagree with the average shown, especially for low-impression queries where the average is unstable.

**Acceptance criterion:** Any dashboard row labeled "Position" or "Avg. Position" carries a tooltip or footnote stating it is a blended average, not a single-point rank, and the underlying query has enough impressions (practitioner consensus: multiple dozens, not single digits, per date range) to be numerically stable before it's used to justify a ranking claim.

**Verification:** For a query with many geographically/personally diverse users, compare GSC's average Position over a week to a same-day incognito/geo-distributed SERP check; expect the two to diverge, and treat that divergence as expected behavior, not a data-quality bug.

**Source:** Official definition — [Search Console Help, "What are impressions, position, and clicks?"](https://support.google.com/webmasters/answer/7042828), Google. T1. Averaging-across-impressions mechanism and "position of the link will be different each time it is seen" — same page. T1. Instability of the average at low impression volume and rank-tracker contrast — practitioner analysis, [SEOTesting, "What Does Average Position Mean in Google Search Console?"](https://seotesting.com/google-search-console/average-position/). T4 (included because it correctly states a limitation Google's own docs imply but do not spell out numerically — flagged per task instructions as a widely repeated claim to verify, and here it is *directionally correct*, not a myth).

**Anti-pattern (widely repeated, not supported by primary docs as stated):** Treating month-over-month movement in GSC's average Position as equivalent to "we moved from rank 8 to rank 5" in the way a dedicated rank tracker reports — GSC's own docs never claim single-point-in-time ranking precision; that framing is a practitioner overreach onto a blended-average metric.

---

## 7. The Page Indexing (Index Coverage) report samples up to 1,000 URLs per status and cannot confirm a specific URL's status — use URL Inspection for that

**Rule:** Use the Page Indexing report only for aggregate indexation trend/triage (counts and status buckets), and use the URL Inspection tool/API — never the Page Indexing report's example-URL lists — to determine whether one specific URL is indexed.

**Mechanism:** The Page Indexing report shows "an example list of up to 1,000 URLs" per status and is explicitly "not guaranteed to show all URLs in a given status, even when less than 1,000 items"; Google states outright, "This report isn't used to investigate the index status of specific pages. To find the index status of a specific page, use the URL Inspection tool." The report also cannot tell you whether an indexed page is actually being served in search results for any query — being indexed and being retrievable in results are documented as separate conditions ("Just because a page is indexed doesn't guarantee it will show up in your search results").

**Acceptance criterion:** A "is this page indexed" question is answered by a URL Inspection API call (or the UI tool) returning `indexingState`/`verdict` for that exact URL, never by searching for the URL inside a Page Indexing status bucket's example list.

**Verification:** `curl` the URL Inspection API (`urlInspection.index.inspect`) for the specific URL and read `inspectionResult.indexStatusResult.verdict`; cross-check that the Page Indexing report's per-status URL list, when it does contain the URL, agrees — but do not depend on the URL appearing there at all.

**Source:** "Page Indexing report," [Search Console Help](https://support.google.com/webmasters/answer/7440203), Google. T1.

**Anti-pattern:** Concluding a URL is "not indexed" because it doesn't appear in the report's "Indexed" example-URL list — absence from a capped 1,000-row sample is not evidence of non-indexation.

---

## 8. There is no bulk index-coverage API — indexation status can only be queried one URL at a time, at 2,000 requests/day/property

**Rule:** Do not design a monitoring system that assumes bulk indexation-status retrieval; budget for at most 2,000 URL Inspection API calls per day per Search Console property (600/minute), and prioritize which URLs get checked (e.g., only pages that changed, or a rotating sample of the highest-value pages) rather than attempting full-site coverage on a large site.

**Mechanism:** The URL Inspection API is the only programmatic way to get Google's authoritative indexing verdict for a URL, and it is a single-URL lookup endpoint — there is no batch/bulk variant. Per-site quota is 2,000 QPD / 600 QPM; per-project quota is far higher (10,000,000 QPD / 15,000 QPM) but that ceiling is irrelevant to a single property, which is bound by the per-site figure. For a site with more than 2,000 URLs, full daily coverage is mathematically impossible via this API.

**Acceptance criterion:** A URL Inspection monitoring job explicitly tracks daily call count against the 2,000/day/property budget and fails loudly (not silently drops requests) when approaching the limit, rather than assuming unlimited throughput.

**Verification:** Check Google Cloud Console → APIs & Services → Quotas for the Search Console API project; confirm the "Queries per day" metric for the URL Inspection method reflects consumption against 2,000/site.

**Source:** URL Inspection per-site/per-project quota figures — [Usage Limits — Search Console API](https://developers.google.com/webmaster-tools/limits), Google. T1. No bulk endpoint — inferred from the absence of any batch method in [Search Console API reference index](https://developers.google.com/webmaster-tools/v1/api_reference_index) (the URL Inspection resource lists only the single-URL `index.inspect` method — no batch/bulk variant), Google. T1. (Original citation `.../reference/rest/v1/urlInspection.index` 404s as of 2026-07-29; replaced with the current API reference index, re-verified 200.)

**Anti-pattern:** Attempting to "reindex-check the whole sitemap nightly" for a site with 50,000 URLs via this API — at 2,000/day the full sitemap would take 25 days per pass, before accounting for any other consumer of the same per-site quota.

---

## 9. GSC clicks and GA4 sessions measure different events and will never reconcile — track the ratio, not the delta

**Rule:** Never treat GSC "Clicks" and GA4 "Organic Search sessions" for the same date range as the same underlying count that should match; if they diverge, investigate a change in the *ratio* between them over time, not the raw gap on any single day.

**Mechanism:** GSC counts a click server-side the instant a user selects a result on Google's SERP — before the destination page, or its analytics tag, ever loads. GA4 counts a session only after its JavaScript executes in the browser and fires an `session_start`/engagement event. Users who click but bounce before the page (and its GA4 tag) loads, block the GA4 script, decline analytics consent, or open the result in a way GA4's session logic collapses differently (e.g., rapid repeat clicks within GA4's 30-minute session window) are counted by GSC but not by GA4, or counted differently by each. There is no documented mechanism by which the two are meant to converge.

**Acceptance criterion:** A reporting dashboard tracks GSC-clicks-to-GA4-organic-sessions as a ratio over time (e.g., weekly) and alerts on a *change* in that ratio (e.g., a sudden drop suggesting a tag-firing regression), rather than alerting on the two absolute numbers failing to match, which is the permanent, expected state.

**Verification:** Pull GSC total clicks and GA4 Organic Search sessions for the same date range/site and confirm they differ (this is the passing state, not a failing one); separately, confirm the GA4 Search Console integration report (Reports → Search Console) shows Search Console's own click/impression figures alongside GA4 dimensions like landing page/device/country, without claiming to unify the two metrics into one number.

**Source:** GA4-GSC integration data model (Search Console metrics paired only with GSC dimensions plus landing page/device/country) — [Connect Search Console to Google Analytics](https://support.google.com/analytics/answer/10737381), Analytics Help, Google. T1. Server-side vs. client-side (JS-tag) measurement distinction is inherent to how GSC (search-log-based) and GA4 (event/tag-based) are architected — corroborated by practitioner analysis explaining the mechanism in accessible terms: [Nexklicks, "Search Console Clicks vs Sessions: Why the Numbers Never Match"](https://nexklicks.com/search-console-clicks-vs-sessions/). T4 (mechanism explanation; the underlying architectural fact — server log vs. client-side tag — is not disputed and follows directly from how each product is documented to work).

**Anti-pattern:** A recurring team ritual of "reconciling" GSC clicks against GA4 sessions to find the "true" number — there is no true number to converge on; the products measure different moments in the user journey by design.

---

## 10. GA4's Search Console integration cannot show conversions/revenue attributed to specific queries — it only pairs query/impression data with landing-page-level GA4 metrics

**Rule:** Do not attempt to answer "which query drove this conversion" inside the GA4 Search Console integration report — it structurally cannot join query-level GSC data to user-level GA4 conversion events; use it only for query↔landing-page traffic correlation.

**Mechanism:** The integration provides exactly two reports: a Queries report and a Landing Page report, and "Search Console metrics work exclusively with Search Console dimensions plus three Analytics dimensions: landing page, device, and country." There is no query-to-session join at the user level (GSC has no concept of a "user" or "session" — it is aggregated, anonymized SERP-log data), so no report in this integration — or in GA4 generally — can attribute a specific conversion event to the specific query that brought that user in. Attribution reporting in GA4 is limited to *source/medium/campaign* (channel-level), which for organic search collapses to "Organic Search," not individual queries.

**Acceptance criterion:** A request for "revenue by keyword" is answered as "not available at the query level" rather than approximated from the Landing Page report — the Landing Page report can at best correlate a page's aggregate query mix with that page's aggregate GA4 conversions, which is a page-level correlation, not a query-level attribution.

**Verification:** Attempt to add a GSC "Query" dimension alongside a GA4 conversion-event metric in Explore; confirm the interface does not permit this combination (Search Console dimensions are restricted to the small allowed-dimension set documented by Google).

**Source:** "Search Console metrics work exclusively with Search Console dimensions plus three Analytics dimensions: landing page, device, and country" — [Connect Search Console to Google Analytics](https://support.google.com/analytics/answer/10737381), Analytics Help, Google. T1.

**Anti-pattern:** Building an executive dashboard claiming "$X revenue from keyword Y" sourced from GA4 — no documented GA4/GSC mechanism supports query-level revenue attribution; at best this is a page-level inference dressed up as a query-level fact.

---

## 11. GA4 applies privacy data-thresholding that can silently withhold organic-search rows — a "hole" in a report is not necessarily a traffic drop

**Rule:** Before treating a missing segment/row in a GA4 organic-search report as a real-world traffic anomaly, check the report's data-quality indicator for a thresholding notice — thresholding, not an actual drop, is a documented, expected cause of missing rows at low volume.

**Mechanism:** GA4 withholds (or aggregates away) data for a report/exploration segment when the underlying user/event count is too low to protect individual identifiability — particularly when Google Signals is enabled and a blended/observed reporting identity is used with a low user count for the specified dimensions/date range. The UI surfaces this as: "Google Analytics has applied thresholding to one or more cards in this report and will only display the data in the cards when the data meets the minimum aggregation thresholds." This is independent of, and can compound with, GSC's own query anonymization (item 3 above) when both systems are cross-referenced.

**Acceptance criterion:** Any GA4 report/exploration used for organic-search segment analysis (e.g., organic traffic broken down by a demographic or narrow custom dimension) is checked for the thresholding banner before its absence-of-data is reported as a finding; if the banner is present, the correct conclusion is "insufficient volume to report," not "zero traffic."

**Verification:** Open the report in the GA4 UI (not just via API) and check the data-quality icon/tooltip at the top of the report for a thresholding message; alternatively, switch Reporting Identity to "Device-based" (which reduces reliance on Google Signals) and see whether previously-missing rows reappear.

**Source:** "[GA4] About data thresholds," [Analytics Help](https://support.google.com/analytics/answer/9383630), Google. T1.

**Anti-pattern:** Reporting "organic conversions from [narrow segment] dropped to zero" when the true cause is that the segment fell below GA4's aggregation threshold for that date range — the underlying users may still exist; only the report row was suppressed.

---

## 12. CrUX field data requires an origin/page to clear an undisclosed minimum-traffic ("popularity") threshold — low-traffic sites and most individual URLs will have no CrUX data at all

**Rule:** Do not build a monitoring pipeline that assumes every page (or even every origin) will have CrUX real-user field data; confirm data presence before alerting on CrUX-derived Core Web Vitals for any specific URL, and fall back to origin-level aggregates (or lab data, e.g. Lighthouse) when page-level data is absent.

**Mechanism:** CrUX eligibility requires, cumulatively: (a) the *user* opted into Chrome usage-statistics reporting and browser-history sync with no Sync passphrase, on a supported platform (excludes Chrome on iOS, Android WebView, and non-Google Chromium browsers entirely); (b) the *origin*/*page* is publicly discoverable (200 status, no `noindex`); and (c) the origin/page is "sufficiently popular" — Google states plainly, "An exact number is not disclosed, but it has been chosen to ensure that we have enough samples to be confident in the statistical distributions." Origin-level data aggregates all eligible pages of a publicly-discoverable origin even if individual pages don't independently clear the page-level threshold — meaning many pages have *no* page-level CrUX entry even when the origin does.

**Acceptance criterion:** A CrUX-based dashboard cell for a given URL either shows real data or an explicit "insufficient traffic — no CrUX data" state; it must never silently render as "0" or "N/A" indistinguishable from a real zero/good score.

**Verification:** Query the CrUX API for a specific URL (`formFactor` unset) and check for a `404`/empty `record` response, which indicates the URL doesn't clear the popularity threshold; then query at the origin level for the same site to confirm origin-level data is present as a fallback.

**Source:** User/Origin/Page eligibility criteria and undisclosed popularity threshold — [CrUX Methodology](https://developer.chrome.com/docs/crux/methodology), Chrome for Developers. T1.

**Anti-pattern:** Interpreting "no CrUX record" for a new or low-traffic page as "this page has a Core Web Vitals score of zero/failing" — absence of a record means insufficient real-user sample, not a bad score.

---

## 13. CrUX BigQuery is origin-resolution only and lags roughly one month; the CrUX API is origin-or-URL but lags ~2 days on a 28-day trailing window

**Rule:** Use the CrUX API (not BigQuery) when URL-level, near-real-time Core Web Vitals monitoring is required; use BigQuery only for historical/longitudinal origin-level analysis, and budget for its release cadence.

**Mechanism:** The CrUX API serves a rolling 28-day-window aggregate, updated daily "around 04:00 UTC" on a best-effort basis, and data for a given day does not change again once that update completes — with the API itself lagging roughly two days behind the current date. The CrUX BigQuery dataset, by contrast, is released monthly (the second Tuesday of the following month per practitioner documentation of the release schedule) and is aggregated to origin-resolution only — page-level/URL-level rows are not available in the BigQuery tables, only in the API.

**Acceptance criterion:** A monitoring job that needs "this specific page's LCP this week" queries the CrUX API, not BigQuery; a job producing "our top 50 pages' CWV trend over the last 12 months" pulls from BigQuery and explicitly labels the granularity as origin-level, not per-URL.

**Verification:** Attempt a URL-level (not origin-level) `WHERE` filter against a CrUX BigQuery table and confirm no such column/join is available at that granularity; compare against a same-URL CrUX API call, which does return URL-level records when eligible.

**Source:** CrUX API update cadence (daily, ~04:00 UTC, 28-day rolling, ~2-day lag) — [How to use the CrUX API](https://developer.chrome.com/docs/crux/guides/crux-api) / [CrUX API reference](https://developer.chrome.com/docs/crux/api), Chrome for Developers. T1. BigQuery origin-only resolution — [CrUX on BigQuery](https://developer.chrome.com/docs/crux/bigquery), Chrome for Developers. T1.

**Anti-pattern:** Writing a BigQuery SQL query filtering `origin = 'https://example.com/specific-page'` and treating a non-error empty result as "page passes CWV" — the schema has no URL-level rows to match in the first place at that resolution.

---

## 14. IndexNow only reaches Bing, Yandex, Seznam.cz, and Naver directly — Google does not consume it

**Rule:** Do not treat an IndexNow submission as notifying Google; IndexNow accelerates discovery for its participating engines only, and Google requires its own separate signals (sitemap, internal links, Indexing API for specific content types) regardless of IndexNow usage.

**Mechanism:** IndexNow is an open protocol where "search engines adopting the IndexNow protocol agree that submitted URLs will be automatically shared with all other participating search engines" — but Google is not among the listed participants; submission is a single HTTP GET/POST (batches up to 10,000 URLs) to any one participating engine's endpoint, keyed by an account-owned key file for domain-ownership verification.

**Acceptance criterion:** A post-publish automation step that pings IndexNow is documented (in code comments/runbooks) as covering Bing/Yandex/Seznam/Naver discovery speed only; Google discoverability is verified separately (sitemap ping, `URL Inspection` "Request indexing," or organic crawl) and never assumed to be satisfied by the IndexNow call.

**Verification:** Check the current engine list at [indexnow.org/searchengines](https://www.indexnow.org/searchengines) before relying on any specific engine's participation, since the list can change; confirm Google is absent from it as of the check date.

**Source:** Protocol mechanics and cross-engine sharing — [IndexNow Documentation](https://www.indexnow.org/documentation), IndexNow.org. T1. Participating engines and Google's non-participation — [Documentation for search engines](https://www.indexnow.org/searchengines), IndexNow.org. T1.

**Anti-pattern:** A publish checklist that says "pinged IndexNow, indexing handled" — this is a widely repeated shorthand that materially overstates IndexNow's reach; Google, the dominant engine for most sites, is not on the distribution list.

---

## 15. Bing's URL Submission API has a default daily quota (commonly 10,000 URLs/day for most sites, capped at 500/batch) that must be checked programmatically, not assumed

**Rule:** Before a bulk URL-submission job to Bing, call the quota-check endpoint to get the account's actual `DailyQuota`/`MonthlyQuota`, rather than hardcoding a number — quota varies by site and can be requested higher through Bing support.

**Mechanism:** Bing Webmaster Tools exposes a Submit URL (single) and Submit URL batch endpoint (JSON or XML), with a batch capped at 500 URLs per call "unless it exceeds the available quota," and a `GetUrlSubmissionQuota` method returning the account's actual remaining daily and monthly allotment; the quota resets daily at midnight GMT. IndexNow submissions to Bing's endpoint are the more common current path and interoperate with the same underlying system, but the dedicated Submission API's documented quota mechanics still apply for direct integrations.

**Acceptance criterion:** A submission script calls `GetUrlSubmissionQuota` first and throttles/queues remaining URLs rather than firing all URLs and handling a bulk rejection after the fact.

**Verification:** Call the quota endpoint via the Bing Webmaster API client and confirm the returned `DailyQuota` value matches (or explains) the batch size the automation is configured to send.

**Source:** Endpoint and batch-size mechanics — ["Access to Instant Indexing: Bing URL submission API"](https://blogs.bing.com/webmaster/september-2021/Access-to-Instant-Indexing-%C2%A0Bing%C2%A0URL-submission-API), Bing Webmaster Blog. T1. Quota-check method — [`IWebmasterApi.GetUrlSubmissionQuota`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturlsubmissionquota?view=bing-webmaster-dotnet), Microsoft Learn (Bing Webmaster .NET API reference). T1 (first-party Bing/Microsoft API reference).

**Anti-pattern:** Assuming every property gets the same fixed quota indefinitely and hardcoding "10,000/day" into an automation without a quota-check call — Bing explicitly supports raising the quota per-account on request, meaning a hardcoded value can under- or over-shoot the real entitlement.

---

## 16. The Search Console Page Experience report was retired in November 2024 — Core Web Vitals and HTTPS reporting now live as separate, standalone reports

**Rule:** Update any runbook, dashboard link, or documentation that references the Search Console "Page Experience report" — it no longer exists as a unified report; monitor Core Web Vitals and HTTPS status as two independent reports instead.

**Mechanism:** Google removed the combined Page Experience report (which had merged Core Web Vitals and HTTPS/Security data since its April 2021 launch) from Search Console around November 18, 2024, citing a reduction of "unnecessary clutter" in the product; the constituent Core Web Vitals report and HTTPS report continued to exist and be updated independently. This sits alongside the separate, earlier-documented March 12, 2024 change where Interaction to Next Paint (INP) replaced First Input Delay (FID) as the responsiveness Core Web Vital — meaning any dashboard or SOP still referencing "FID" as a monitored metric, or "Page Experience report" as a single destination, is out of date on two independent counts.

**Acceptance criterion:** No internal documentation, saved Search Console link, or dashboard integration references a "Page Experience report" URL/tab or the "FID" metric as current; both are replaced (Core Web Vitals report + HTTPS report; INP as the interactivity metric) in any SOP dated 2024 or later.

**Verification:** Open Search Console's left-hand navigation and confirm there is no "Page Experience" entry — only "Core Web Vitals" and (if applicable) "HTTPS" appear as separate items; confirm the Core Web Vitals report's interactivity column is labeled INP, not FID.

**Source:** Removal of the unified report and its cause — corroborated practitioner reporting of the official change: [Google Search Console Drops Page Experience Report](https://www.seroundtable.com/google-search-console-page-experience-report-gone-38436.html), Search Engine Roundtable, Nov 2024 (T3/T4 — dated report of an official Google Search Console product change; no standalone Search Central blog post documenting this specific removal was locatable at time of research, only the changelog's absence of a Page Experience entry post-2024 and third-party confirmation). INP replacing FID as of March 12, 2024 — [Introducing INP to Core Web Vitals](https://developers.google.com/search/blog/2023/05/introducing-inp), Google Search Central Blog. T1.

**Anti-pattern:** An SOP or client report template still budgeting a "Page Experience score" as a single number to track — that unified score/report no longer exists in the product; Core Web Vitals and HTTPS must be tracked and reported as two separate signals.

---

## What each source genuinely cannot answer (explicit statement)

- **GSC cannot tell you** the true long-tail query list for a high-traffic site (anonymization, item 3), a specific URL's index status from the Page Indexing report (item 7), why a click didn't become a GA4 session (item 9), revenue/conversions per query (item 10 — that's GA4's gap, surfaced through the GSC integration), a stable point-in-time SERP rank (item 6), or any data older than 16 months without your own export (item 5).
- **GA4 cannot tell you** query-level attribution for conversions (item 10), or provide a segment breakdown at all once volume drops below its privacy threshold (item 11) — a blank cell there means "can't report," not "zero."
- **CrUX cannot tell you** anything about a page that hasn't cleared Google's undisclosed popularity threshold (item 12), and its BigQuery export cannot tell you anything at URL resolution at all, only origin (item 13).
- **IndexNow cannot tell you or ensure** anything about Google's indexing queue — it isn't wired to Google at all (item 14).
- **No source in this domain offers a bulk "is my whole site indexed" API** — the closest primary-source mechanism (Page Indexing report) is an explicitly-capped, non-exhaustive sample, and the exhaustive alternative (URL Inspection API) is a single-URL lookup throttled to 2,000/day/property (items 7–8) — full-site indexation certainty for a large site is not obtainable through any documented Google API on any single day.

---

## Deprecated / materially changed in the last 24 months (explicit flag, per task requirement)

1. **Page Experience report (unified)** — removed from Search Console ~Nov 18, 2024. Item 16.
2. **FID → INP** as the Core Web Vitals interactivity metric — effective March 12, 2024. Item 16.
3. **Mobile-Friendly Test tool and Mobile Usability report** — documented by Google as being phased out (noted in Google's own documentation changelog, Dec 2023 entry removing references "as they are going away"); not in primary scope of this SOP section but adjacent to page-experience monitoring and worth flagging for any SOP that still references either.

## Practitioner claims not supported by primary sources (explicit flag, per task requirement)

1. **"GSC average Position is a reliable rank tracker"** — not supported. Google's own docs define Position as a blended average across all impressions (device, geography, personalization, and — critically — only the site's best-ranking URL per query), not a single-point observation. Item 6.
2. **"IndexNow gets you indexed faster on Google"** — not supported; Google is not a participating engine (item 14). This claim persists widely in practitioner content despite indexnow.org's own engine list never having listed Google.
3. **"GSC clicks and GA4 sessions should match once tracking is fixed"** — not supported; the architectural gap (server-side SERP log vs. client-side JS tag) is permanent by design, not a fixable discrepancy (item 9).
