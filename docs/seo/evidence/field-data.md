# Field Data Evidence — CrUX / GA4 / GSC

**Capture date:** 2026-07-29
**Property:** `https://www.cleanstart.com` (GA4 property `508401576`; GSC property `sc-domain:cleanstart.com`)

This file records real-user field data pulled directly from the CrUX API, the GA4 Data API, and the Google Search Console API. Every number below is copied from a live API response captured on the date above. No number in this file is estimated, inferred, or backfilled from another source. Where a request failed or returned no data, that is recorded verbatim instead of a substituted figure.

---

## 1. CrUX (Chrome UX Report) — Core Web Vitals, p75

**Requested:** `POST https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=CRUX_API_KEY`, once per target × form factor (`PHONE`, `DESKTOP`). Metrics read: `largest_contentful_paint`, `interaction_to_next_paint`, `cumulative_layout_shift` (p75).

**Targets queried:**
- Origin: `{"origin": "https://www.cleanstart.com"}`
- Home page (URL-level): `{"url": "https://www.cleanstart.com/"}`
- Three highest-value templates (URL-level), selected from the actual GA4 organic-landing-page pull in §2 below — the single highest-organic-session URL in each of three distinct template families (CMS Detail, Static, CMS Listing), rather than an assumed guess:
  - `https://www.cleanstart.com/guide/oci-image-format` — CMS Detail (Guide template), 35 organic sessions/28d, the single highest-traffic non-home landing page site-wide.
  - `https://www.cleanstart.com/about-us` — Static template, 24 organic sessions/28d, highest of the Static-page family.
  - `https://www.cleanstart.com/careers` — CMS Listing template, 21 organic sessions/28d, highest of the Listing-page family.

### Origin-level: `https://www.cleanstart.com`

Collection period returned by the API: **2026-06-30 to 2026-07-27** (trailing 28 days as of query time).

| Form factor | LCP p75 | INP p75 | CLS p75 |
|---|---|---|---|
| Phone | 2784 ms | 117 ms | 0.00 |
| Desktop | 1746 ms | 91 ms | 0.01 |

### URL-level: Home page `https://www.cleanstart.com/`

Collection period returned by the API: **2026-06-30 to 2026-07-27**.

| Form factor | LCP p75 | INP p75 | CLS p75 |
|---|---|---|---|
| Phone | 2620 ms | 137 ms | 0.00 |
| Desktop | 2023 ms | 95 ms | 0.02 |

### URL-level: three chosen templates

All three returned **HTTP 404** for both form factors, with the identical CrUX error body:

```json
{"error": {"code": 404, "message": "chrome ux report data not found", "status": "NOT_FOUND"}}
```

| URL | Phone | Desktop |
|---|---|---|
| `/guide/oci-image-format` | 404 — not found | 404 — not found |
| `/about-us` | 404 — not found | 404 — not found |
| `/careers` | 404 — not found | 404 — not found |

This is the expected, documented CrUX behavior for a URL that does not clear the Chrome UX Report's minimum real-user-traffic threshold for a given (URL, form factor) pair — it is not an auth or quota error. No LCP/INP/CLS figures exist for these three URLs in CrUX at the URL level; only the origin-level and home-page figures above are real-user field data. Per-template Core Web Vitals for these pages would need to come from a different source (e.g. PageSpeed Insights lab data, which is not field data and is out of scope for this file) or from accumulating enough CrUX-eligible traffic over time.

**Status: Verified** (origin and home page). **Unverified — CrUX has no URL-level record for these three URLs** (below CrUX's traffic-eligibility threshold); closing this requires either more real-user traffic to these specific URLs or substituting a different, still-real, data source explicitly labeled as lab (not field) data.

---

## 2. GA4 — Organic-search landing-page sessions (last 28 days)

**Requested:** `POST https://analyticsdata.googleapis.com/v1beta/properties/508401576:runReport`, authenticated as the service account in `GOOGLE_APPLICATION_CREDENTIALS_JSON` via the OAuth2 JWT-bearer flow (scope `https://www.googleapis.com/auth/analytics.readonly`).

Request body: `dateRanges: [{startDate: "28daysAgo", endDate: "today"}]`, `dimensions: [landingPagePlusQueryString, sessionDefaultChannelGroup]`, `dimensionFilter: sessionDefaultChannelGroup = "Organic Search"`, `metrics: [sessions]`, ordered descending by sessions, `limit: 50`.

**Date range actually returned:** confirmed by a second query with `dimensions: [date]` over the identical requested range — data rows span **2026-07-01 to 2026-07-29 inclusive (29 calendar days)**. Property timezone (from response `metadata.timeZone`): `America/Los_Angeles`.

**Result:** 154 distinct landing pages recorded at least one Organic Search session in this window (`rowCount: 154`); query was capped at the top 50 by sessions. Top rows:

| Landing page | Organic Search sessions |
|---|---|
| `/` (home) | 504 |
| `(not set)` | 158 |
| `/guide/oci-image-format` | 35 |
| `/about-us` | 24 |
| `/contact-us` | 22 |
| `/careers` | 21 |
| `/guide/container-image-layering` | 21 |
| `/guide/hardened-container-image` | 19 |
| *(empty landing page value)* | 18 |
| `/clean-libraries` | 17 |
| `/guide/container-filesystem` | 16 |
| `/guide/environment-variables` | 14 |
| `/pricing` | 14 |
| `/cleansight` | 13 |
| `/guide/distroless-container-image` | 13 |
| `/cleanstart-images` | 12 |
| `/blogs` | 11 |
| `/guide/container-runtime` | 10 |
| `/guide/base-image` | 9 |
| `/guide/sbom` | 9 |

(Full top-50 rows are captured in this API response; the table above is the top 20 by session count. Rows below ~9 sessions are omitted here for brevity but were retrieved and are not different in kind — no figure in this document was extrapolated from them.)

**Status: Verified.**

---

## 3. Google Search Console — indexation coverage and top queries

**Requested:** authenticated as the same service account via OAuth2 JWT-bearer (scope `https://www.googleapis.com/auth/webmasters.readonly` for Search Analytics/`sites.list`, plus the Search Console API v1 `urlInspection.index:inspect` endpoint for per-URL indexation status).

### Access check

`GET https://www.googleapis.com/webmasters/v3/sites` returned HTTP 200 with exactly one site the service account can see:

```json
{"siteEntry": [{"siteUrl": "sc-domain:cleanstart.com", "permissionLevel": "siteFullUser"}]}
```

A follow-up call against the URL-prefix property, `GET .../sites/https%3A%2F%2Fwww.cleanstart.com%2F/sitemaps`, returned **HTTP 403**:

```json
{"error": {"code": 403, "message": "User does not have sufficient permission for site 'https://www.cleanstart.com/'. See also: https://support.google.com/webmasters/answer/2451999.", "errors": [{"message": "User does not have sufficient permission for site 'https://www.cleanstart.com/'. See also: https://support.google.com/webmasters/answer/2451999.", "domain": "global", "reason": "forbidden"}]}]}
```

So: the service account has full access to the **domain property** `sc-domain:cleanstart.com`, but not to the separate **URL-prefix property** `https://www.cleanstart.com/`. All data below was pulled from the domain property, which covers the same site.

This contradicts the project's earlier note (repo memory / spec §11) that GSC access for this service account was still pending — as of this capture date, domain-property access is live. That earlier note may be stale, or may have referred specifically to the URL-prefix property, which is still inaccessible per the 403 above.

### Search Analytics — site totals

`POST .../sites/sc-domain%3Acleanstart.com/searchAnalytics/query`, requested range `startDate: 2026-07-01, endDate: 2026-07-29`, no dimensions (site-wide totals).

A separate query with `dimensions: [date]` over the same requested range shows GSC actually has data only through **2026-07-26** (26 daily rows, 2026-07-01 to 2026-07-26) — the remaining 3 requested days are within GSC's normal 2–3 day reporting-lag window and are not yet available. **Date range actually returned: 2026-07-01 to 2026-07-26.**

| Metric | Value |
|---|---|
| Clicks | 1,028 |
| Impressions | 147,494 |
| CTR | 0.70% |
| Average position | 13.70 |

### Search Analytics — top 10 queries (same range)

`dimensions: [query]`, `rowLimit: 10`, ordered by the API's default (clicks descending):

| Query | Clicks | Impressions | CTR | Avg. position |
|---|---|---|---|---|
| cleanstart | 385 | 951 | 40.48% | 2.27 |
| clean start | 71 | 868 | 8.18% | 6.81 |
| cleanstart security | 30 | 48 | 62.50% | 1.02 |
| cleanstart company | 18 | 52 | 34.62% | 1.06 |
| clean start company | 13 | 41 | 31.71% | 1.27 |
| cleansight | 9 | 44 | 20.45% | 2.25 |
| oci image | 8 | 1,127 | 0.71% | 2.76 |
| cleanstart ahmedabad | 6 | 31 | 19.35% | 1.19 |
| cleanstart security private limited | 6 | 12 | 50.00% | 1.08 |
| oci images | 5 | 1,147 | 0.44% | 4.15 |

### Indexation coverage — per-URL, via URL Inspection API

The Search Console API v3/v1 has **no bulk "Index Coverage" report endpoint** — that report is only available in the Search Console UI. The programmatic equivalent is the URL Inspection API (`POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`), called once per URL against `siteUrl: "sc-domain:cleanstart.com"`. Ran it for the home page and the same three templates used in §1:

| URL | Verdict | Coverage state | Indexing state | robots.txt | Last crawl (UTC) |
|---|---|---|---|---|---|
| `/` (home) | PASS | Submitted and indexed | INDEXING_ALLOWED | ALLOWED | 2026-07-28T22:50:32Z |
| `/guide/oci-image-format` | PASS | Submitted and indexed | INDEXING_ALLOWED | ALLOWED | 2026-07-19T06:32:30Z |
| `/about-us` | PASS | Submitted and indexed | INDEXING_ALLOWED | ALLOWED | 2026-07-26T13:52:51Z |
| `/careers` | PASS | Submitted and indexed | INDEXING_ALLOWED | ALLOWED | 2026-07-21T19:51:23Z |

All four returned `googleCanonical` equal to `userCanonical` equal to the requested URL (no canonicalization conflict on any of the four).

**Status: Verified** — both Search Analytics (totals + top queries) and per-URL indexation via URL Inspection succeeded against the `sc-domain:cleanstart.com` property. Site-wide bulk indexation coverage (the full Index Coverage breakdown — e.g. counts of "Excluded", "Error", "Valid with warnings" across the whole site) is **Unverified — no API endpoint exists for it**; only the Search Console UI exposes that aggregate view. Closing that gap requires either manual export from the UI (Index Coverage report → Export) or per-URL Inspection calls run across the full URL set, which was out of scope for this pass (4 sample URLs were inspected here, not the whole site).

---

## Summary of status lines

- CrUX origin-level (phone + desktop): **Verified**
- CrUX home-page URL-level (phone + desktop): **Verified**
- CrUX URL-level for the three chosen templates: **Unverified — CrUX has no record for these URLs (404 `chrome ux report data not found`, below CrUX's traffic-eligibility threshold)**
- GA4 organic-search landing-page sessions (28d): **Verified**
- GSC Search Analytics (totals + top queries): **Verified**
- GSC per-URL indexation (4 sample URLs via URL Inspection): **Verified**
- GSC site-wide bulk Index Coverage report: **Unverified — no API endpoint for this report; UI-only, or would require per-URL Inspection calls across the entire site**
