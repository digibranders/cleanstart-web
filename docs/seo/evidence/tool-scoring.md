# Tool Scoring Reconciliation — How Major SEO Audit Tools Label & Weight Issues

> **This document is documentation-derived, not API-observed.** The Ahrefs and Semrush MCP
> integrations require OAuth that was unavailable in this research session, so no live audit
> was run against either tool and no live crawl data was queried. Every label, severity tier,
> and weighting claim below comes from each vendor's own published help-centre article,
> knowledge-base page, or open-source scoring documentation, cited inline. Where a vendor does
> not publish a severity for an issue class, the cell says `Not documented` rather than
> inferring one from a screenshot, forum post, or third-party blog. Do not read this file as
> "we audited cleanstart.com with these tools" — it is a reference for reconciling the SOP's
> own severity model against what each tool's documentation says it will show a client.

## How to use this file

When the SOP rules an issue P1/P2/P3 and a client's own Ahrefs/Semrush/Screaming
Frog/Sitebulb/Lighthouse report shows a different label or tier for the same underlying
problem, the mapping table below is the first place to check: is this a genuine SOP/tool
disagreement (documented in the Disagreements section), or just a naming mismatch (e.g.
"Noindex page" vs "Blocked from indexing")?

---

## Severity-tier definitions, per tool (as published)

| Tool | Tiers | Definition (vendor's own words) | Source |
|---|---|---|---|
| **Ahrefs Site Audit** | Error (red) / Warning (yellow) / Notice (blue) | "Errors — the most important and need to be fixed as soon as possible. Warnings — not as critical, but still require a fix. Notices — work as a nudge; fix them after errors and warnings." Only **Error**-tier issues reduce Health Score: Health Score = (internal URLs with no Error issues ÷ total internal URLs) × 100. Warnings and Notices do not affect Health Score at all. | [help.ahrefs.com/en/collections/1539899-issues](https://help.ahrefs.com/en/collections/1539899-issues); [help.ahrefs.com — Health Score](https://help.ahrefs.com/en/articles/1424673-what-is-health-score-and-how-is-it-calculated-in-ahrefs-site-audit) |
| **Semrush Site Audit** | Error / Warning / Notice | "Errors are the most severe issues on your site. Warnings represent issues of medium severity. Notices are considered less severe than errors or warnings and don't impact your overall site health score." | [semrush.com/kb/541-site-audit-issues-report](https://www.semrush.com/kb/541-site-audit-issues-report) |
| **Semrush Site Health score** | 0–100% | "The Site Health Score in your Site Audit campaign is based on the number of your total errors and total warnings that were found on the pages crawled... Errors have more impact on your Site Health Score than warnings." Does not depend on total pages crawled; depends on which unique checks are triggered and how completely each is fixed. No public formula/weighting coefficients are disclosed. | [semrush.com/kb/114-total-score](https://www.semrush.com/kb/114-total-score) |
| **Screaming Frog SEO Spider** | Type: Issue / Warning / Opportunity, plus Priority: High / Medium / Low | "Issues are an error or issue that should ideally be fixed. Warnings are not necessarily an issue, but should be checked — and potentially fixed. Opportunities are 'potential' areas for optimisation... Priorities are based upon potential impact that may require more attention, rather than definitive action — from broadly accepted SEO best practice." | [screamingfrog.co.uk/seo-spider/issues](https://www.screamingfrog.co.uk/seo-spider/issues/) |
| **Sitebulb** | Hint priority: Critical / High / Medium / Low / Insight | "Every Hint comes with an importance status... so you can instantly see where the issues lie and where to focus your time." Sitebulb explicitly recommends prioritizing Critical and High hints first; Insight hints are informational only ("this isn't wrong, but it's interesting"). | [sitebulb.com/documentation/getting-started/how-to-use-hints](https://sitebulb.com/documentation/getting-started/how-to-use-hints/); [sitebulb.com/hints](https://sitebulb.com/hints/) |
| **Lighthouse / PageSpeed Insights** | Per-audit pass/fail (SEO, Best Practices), weighted 0–1 average (Performance) | SEO category: "All audits in the SEO category are equally weighted, with the exception of Structured Data, which is an unscored manual audit." Performance category uses metric-specific weights (see LCP/CLS/INP row below), not equal weighting. | [GoogleChrome/lighthouse — scoring.md](https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md); [GoogleChrome/lighthouse — default-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js) |

---

## Issue-class mapping table

| Issue class | Ahrefs label & severity | Semrush label & severity | Screaming Frog label | Sitebulb label & severity | Lighthouse audit ID |
|---|---|---|---|---|---|
| **Missing title** | "Title tag missing or empty" — Error [[1]](https://help.ahrefs.com/en/articles/2754356) | "Pages don't have title tags" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Page Titles → Missing — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Title tag is missing" / "Title tag is empty" — Critical [[4]](https://sitebulb.com/hints/on-page/) | `document-title` (SEO, equal-weighted) |
| **Duplicate title** | "Multiple title tags" — Error [[5]](https://help.ahrefs.com/en/articles/2754360) | "Issues with duplicate title tags" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Page Titles → Duplicate — Opportunity, Medium; Page Titles → Multiple — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Multiple title tags" — High; "URLs with duplicate page titles" — High [[4]](https://sitebulb.com/hints/on-page/)[[6]](https://sitebulb.com/hints/duplicate-content/) | Not applicable (single-page audit, no cross-page duplicate detection) |
| **Missing meta description** | "Meta description tag missing or empty" — Error [[7]](https://help.ahrefs.com/en/articles/2630975) | "Pages without meta descriptions" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Meta Description → Missing — Opportunity, Low [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Meta description is missing" — Low [[4]](https://sitebulb.com/hints/on-page/) | `meta-description` (SEO, equal-weighted) |
| **Duplicate meta description** | "Multiple meta description tags" — Error [[8]](https://help.ahrefs.com/en/articles/2652405) | "Pages with duplicate meta descriptions" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Meta Description → Multiple — Issue, Medium; Duplicate — Opportunity, Low [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Multiple meta descriptions" — Low; "URLs with duplicate meta descriptions" — Low [[4]](https://sitebulb.com/hints/on-page/)[[6]](https://sitebulb.com/hints/duplicate-content/) | Not applicable |
| **Missing H1** | "H1 tag missing or empty" — Warning [[9]](https://help.ahrefs.com/en/articles/2764262) | "Pages without an h1 heading" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | H1 → Missing — Issue, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "<h1> tag is missing" — Medium [[4]](https://sitebulb.com/hints/on-page/) | Not documented (no dedicated SEO-category H1 audit) |
| **Multiple H1** | Not documented (no distinct "multiple H1" article found in the Ahrefs Issues collection) | "Pages with more than one H1 tag" — **Notice** (does not affect Site Health score) [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | H1 → Multiple — Warning, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Multiple <h1> tags" — Low [[4]](https://sitebulb.com/hints/on-page/) | Not applicable |
| **Canonical missing** | Not documented as a standalone issue — Ahrefs' closest documented issue is "Duplicate pages without canonical" — Error [[10]](https://help.ahrefs.com/en/articles/2596742), i.e. it only flags absence of canonical in the context of an existing duplicate set | Not documented as a standalone issue in the published issues list [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Canonical Tags → Missing — Warning, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | Not documented as a standalone "missing" hint in the Indexability category [[11]](https://sitebulb.com/hints/) | `canonical` (SEO, equal-weighted) |
| **Canonical non-self-referencing** | Not documented as a distinct issue name | Not documented as a distinct issue name | Canonical Tags → Canonicalised — Warning, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Canonical points to a different internal URL" — Insight [[11]](https://sitebulb.com/hints/) | `canonical` (validity check only, does not distinguish self-ref) |
| **Canonical pointing to a redirect** | "Canonical points to redirect" — Error [[12]](https://help.ahrefs.com/en/articles/2753767) | Rolled into "Pages with a broken canonical link" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Not documented as a distinct named issue on the public issues page | "Canonical points to a redirecting URL" — Medium [[11]](https://sitebulb.com/hints/) | Not applicable (Lighthouse checks the single fetched page only) |
| **Noindex on an indexable page** | "Noindex page" — Warning [[13]](https://help.ahrefs.com/en/articles/2429909-what-does-the-noindex-page-warning-in-site-audit-mean); "Noindex page receives organic traffic" — Error [[14]](https://help.ahrefs.com/en/articles/2693996) | "Pages blocked by X-Robots-Tag: noindex HTTP header" — Notice [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Robots & Crawlability → Noindex — Warning, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Noindex in HTML and HTTP header" — Medium; "Canonical points to a noindex URL" — High [[11]](https://sitebulb.com/hints/) | `is-crawlable` (SEO, disproportionately heavy weight vs. other SEO audits per default-config.js) |
| **Blocked by robots.txt** | Not documented with an explicit severity tier in the public Issues collection | "Pages that were blocked from crawling" — Notice; "Issues with blocked internal resources in robots.txt" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Robots & Crawlability → Internal Blocked by Robots.txt — Warning, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Disallowed JavaScript file" / "Disallowed image" / "Disallowed Style Sheet" — Critical; "Internal Disallowed URLs" — Insight [[11]](https://sitebulb.com/hints/) | `robots-txt` (validates the robots.txt file's syntax, not per-page blocking) |
| **Broken internal link** | "Page has links to broken page" — Error [[15]](https://help.ahrefs.com/en/articles/2721106) | "Broken internal links" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Broken Links & Response Codes → Internal Client Error (4XX) — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | Not documented as a single named hint distinct from the redirect/4xx hints already covered under Redirects/Indexability [[11]](https://sitebulb.com/hints/) | Not applicable (single-page audit, no link crawling) |
| **Redirect chain** | "Redirect chain" — Error [[16]](https://help.ahrefs.com/en/articles/2750680) | Grouped under "Redirect chains and loops" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Broken Links & Response Codes → Internal Redirect Chain — **Warning**, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Internal URL is part of a chained redirect loop" — High (chains and loops are not distinguished) [[17]](https://sitebulb.com/hints/redirects/) | Not applicable |
| **Redirect loop** | "Redirect loop" — Error [[18]](https://help.ahrefs.com/en/articles/2754354) | Grouped under "Redirect chains and loops" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Broken Links & Response Codes → Internal Redirect Loop — **Issue**, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Internal URL redirects back to itself" — High [[17]](https://sitebulb.com/hints/redirects/) | Not applicable |
| **4xx page** | "404 page" — Error [[19]](https://help.ahrefs.com/en/articles/2593263) | "Pages returning 4XX status code" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Broken Links & Response Codes → Internal Client Error (4XX) — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Not Found (4XX) URL in XML Sitemaps" — Critical (sitemap-linked context); no separately named plain-4xx hint found outside sitemap/redirect/canonical contexts [[18]](https://sitebulb.com/hints/xml-sitemaps/) | `http-status-code` (SEO, equal-weighted) |
| **Orphan page** | "Orphan page" — **Error** [[20]](https://help.ahrefs.com/en/articles/2694175) | "Orphaned pages (from Google Analytics)" / "Orphaned pages (in sitemap)" — **Notice**, explicitly does not impact Site Health score [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Orphaned Pages → Orphan URLs — Issue, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "URL is orphaned and was not found by the crawler" — High [[21]](https://sitebulb.com/hints/links/) | Not applicable |
| **Missing alt text** | Flagged as part of Site Audit's image checks; Ahrefs has publicly moved toward classifying images as content/decorative/tracking to reduce false positives on this check, but no help-centre article states an explicit Error/Warning/Notice tier | "Images without alt attributes" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Images & Alt Text → Missing Alt Text / Missing Alt Attribute — Issue, **Low** [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Images must have alternate text" (WCAG 2.0 A/AA) — priority tag not shown on the public Accessibility hints page [[22]](https://sitebulb.com/hints/accessibility/) | `image-alt` (SEO, equal-weighted) |
| **Slow LCP** | Reported as a CrUX/PageSpeed metric (Good/Needs Improvement/Poor) inside Site Audit, not issued an Error/Warning/Notice tier [[23]](https://help.ahrefs.com/en/articles/5369589-how-to-see-core-web-vitals-and-other-speed-metrics-in-site-audit-tool) | "Pages with slow load speed" — Error, but LCP specifically is also broken out in a separate Core Web Vitals thematic report, not solely the Errors list [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Performance (PageSpeed) category — Opportunity, Medium (general; LCP not separately named on the public issues page) [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | Not documented as an LCP-labeled hint; the closest are generic asset-weight hints ("Avoid enormous network payloads" — Critical) that only indirectly affect LCP [[24]](https://sitebulb.com/hints/performance/) | `largest-contentful-paint` (Performance category, 25% weight) |
| **Poor INP** | Reported as a CrUX metric, not issue-tiered [[23]](https://help.ahrefs.com/en/articles/5369589-how-to-see-core-web-vitals-and-other-speed-metrics-in-site-audit-tool) | Not documented as a standalone issue name; folded into thematic Core Web Vitals reporting | Not documented as a standalone named issue | Not documented | `interaction-to-next-paint` — present in the Performance category's audit list but weighted **0** in Lighthouse's lab-based score (Lighthouse cannot simulate real user interaction in a lab run; INP is field-data only) |
| **Layout shift (CLS)** | Reported as a CrUX metric, not issue-tiered [[23]](https://help.ahrefs.com/en/articles/5369589-how-to-see-core-web-vitals-and-other-speed-metrics-in-site-audit-tool) | Folded into thematic Core Web Vitals reporting, not a standalone Errors/Warnings/Notices entry | Not documented as a standalone named issue on the public issues page | Not documented as a CLS-labeled hint | `cumulative-layout-shift` (Performance category, 25% weight) |
| **Missing or invalid structured data** | Checked against "190+ Google and Schema.org validation requirements" per Ahrefs marketing copy, but no help-centre article states an Error/Warning/Notice tier for this check | "Invalid structured data items" — **Error** [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Structured Data → Validation Errors / Rich Result Validation Errors / Parse Errors — Issue, High; Missing — Opportunity, Low [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | Not documented — Structured Data is not one of Sitebulb's 15 published hint categories [[25]](https://sitebulb.com/hints/) | `structured-data` — explicitly an **unscored manual audit**, contributes 0 to the SEO score |
| **Missing hreflang return tag** | "Missing reciprocal hreflang (no return-tag)" — Error [[26]](https://help.ahrefs.com/en/articles/2631143) | Closest documented match is "Pages with hreflang language mismatch issues" — **Notice** (no exact "missing return tag" entry) [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Hreflang → Missing Return Links — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Missing reciprocal hreflang (no return-tag)" — High [[27]](https://sitebulb.com/hints/international/) | Not applicable (`hreflang` audit checks validity of tags on the single fetched page, not cross-page reciprocity) |
| **HTTP page on an HTTPS site** | "HTTPS page has internal links to HTTP" — Error [[28]](https://help.ahrefs.com/en/articles/2614035) | "Non-secure pages" — Error; "Homepage does not use HTTPS encryption" — **Warning**; "Links on HTTPS pages leading to HTTP page" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Security & HTTPS → HTTP URLs / Mixed Content — Issue, High [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Internal HTTP URLs" / "Mixed content (loads HTTP resources on HTTPS URL)" — **Critical** [[29]](https://sitebulb.com/hints/security/) | Not an SEO-category audit — `is-on-https` lives in the **Best Practices** category, not SEO |
| **Sitemap errors** | "3xx redirect in sitemap" / "4xx page in sitemap" / "Non-canonical page in sitemap" / "Noindex page in sitemap" — all Error [[30]](https://help.ahrefs.com/en/articles/2754358) | "Format errors in sitemap.xml files" / "Incorrect pages found in sitemap.xml" / "Sitemap.xml files are too large" — Error; "Sitemap.xml not found" / "Sitemap.xml not indicated in robots.txt" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Sitemaps → XML Sitemap With Over 50k URLs / Over 50mb — Issue, High; URLs Not In Sitemap — Issue, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "Error (5XX) URL in XML Sitemaps" / "Noindex URL in XML Sitemaps" / "Not Found (4XX) URL in XML Sitemaps" — **Critical** [[18]](https://sitebulb.com/hints/xml-sitemaps/) | Not applicable (Lighthouse does not audit sitemaps) |
| **Thin content** | Checked as part of content analysis ("low word count") per third-party summary of Ahrefs' own glossary; no help-centre article assigns it an Error/Warning/Notice tier | "Pages with a low word count" — Warning [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Duplicate & Thin Content → Low Content Pages — Opportunity, Medium; Low Relevance Content — Warning, Low [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | Not documented — the Duplicate Content category page does not list a distinct thin/low-content hint | Not applicable |
| **Duplicate content** | "Duplicate pages without canonical" — Error [[10]](https://help.ahrefs.com/en/articles/2596742); duplicates otherwise classified as "Good" vs "Bad" depending on canonical/hreflang handling [[31]](https://help.ahrefs.com/en/articles/2115215-what-are-good-and-bad-duplicates-in-site-audit) | "Pages with duplicate content issues" — Error [[2]](https://www.semrush.com/kb/542-site-audit-issues-list) | Duplicate & Thin Content → Exact Duplicates — Issue, High; Near Duplicates / Semantically Similar — Warning, Medium [[3]](https://www.screamingfrog.co.uk/seo-spider/issues/) | "URLs with duplicate content" — High [[6]](https://sitebulb.com/hints/duplicate-content/) | Not applicable |

---

## Disagreements — where the tools materially conflict

These are the places where the SOP cannot simply inherit a vendor consensus, because there
isn't one. Each entry states the mechanism-based reasoning the SOP should use instead of
picking a side.

### 1. Orphan pages: Ahrefs (Error, tanks Health Score) vs. Semrush (Notice, explicitly excluded from Site Health)
This is the sharpest documented contradiction found. Ahrefs' help centre labels "Orphan page"
an **Error** — the only tier that reduces its Health Score. Semrush's own issues list places
both of its orphan-page checks ("from Google Analytics" and "in sitemap") in the **Notice**
tier, which its documentation states explicitly "doesn't impact your overall site health
score." A client alternating between the two tools will see the identical underlying fact —
a real page with zero internal links — reported as a top-tier reliability problem in one
report and a footnote in the other. **Mechanism-based reasoning for the SOP:** severity here
should depend on whether the orphan page is (a) linked from the XML sitemap / receiving
organic traffic (crawlers can still find it, but internal PageRank flow and user navigation
are broken — a real but moderate problem) vs. (b) truly unreachable by any means (a content
asset silently invisible to both users and crawlers — closer to Ahrefs' Error framing). A flat
P-level for "orphan page" independent of reachability is not defensible against either tool.

### 2. Missing alt text: Screaming Frog (Low) vs. Semrush (Warning/medium) vs. Ahrefs (de-emphasizing over time)
Screaming Frog and Sitebulb both bucket generic missing-alt findings at the bottom of their
priority scale; Semrush places it in its medium-severity Warning tier. Ahrefs has publicly
moved toward classifying images as content/decorative/tracking specifically because blanket
alt-text flags were producing noise on non-content images. **Mechanism-based reasoning:**
severity should hinge on image role (content vs. decorative vs. tracking pixel), which none
of these tools' severity *tiers* encode by default — only Ahrefs' underlying classification
logic does. The SOP should treat "missing alt text" as un-scorable at the issue-class level
and require per-image role classification before assigning a P-level, rather than adopting any
single vendor's flat tier.

### 3. Structured data: Semrush (Error) vs. Lighthouse (explicitly unscored) vs. Sitebulb (no dedicated category)
Semrush's own issues list puts "Invalid structured data items" in its highest-severity Error
tier. Lighthouse's own scoring documentation states the Structured Data audit is "an unscored
manual audit" that contributes nothing to the SEO score. Sitebulb, despite auditing 300+ hints
across 15 categories, does not publish a dedicated structured-data category at all. **Mechanism-
based reasoning:** structured data is an enhancement (it changes SERP presentation, not
indexability) rather than a requirement for most page types — Google's own documentation
treats most schema types as optional. The SOP's severity should scale with schema type
(required for eligibility-gated rich results like Product/Review vs. purely decorative
Organization/WebSite markup), not treat "invalid structured data" as a flat single-tier issue
the way Semrush's Errors bucket implies.

### 4. Redirect chains vs. redirect loops: Screaming Frog splits severity, Ahrefs/Semrush/Sitebulb do not
Screaming Frog is the only tool that documents a severity gap between chains and loops: Internal
Redirect Loop is an Issue at High priority, while Internal Redirect Chain is only a Warning at
Medium priority. Ahrefs and Semrush both file chains and loops as Error-tier without
distinguishing them; Sitebulb's own hint text ("Internal URL is part of a chained redirect
loop") conflates the two concepts into one High-priority hint. **Mechanism-based reasoning:**
a loop is a dead end (zero crawl budget recovery, permanent 200-equivalent failure); a chain
eventually resolves but wastes crawl budget and dilutes link equity per hop. These are
different failure modes and the SOP is justified in scoring loops strictly higher than chains,
matching Screaming Frog's distinction rather than Ahrefs/Semrush/Sitebulb's flatter treatment.

### 5. INP: present in Lighthouse's audit list but weighted zero in the lab score
Lighthouse's own `default-config.js` includes `interaction-to-next-paint` in the Performance
category's audit list, but with a scoring weight of 0 — it does not move the Lighthouse
Performance score at all, because a lab run (a scripted, single-session Chrome trace) cannot
generate the real user interactions INP is designed to measure. INP only surfaces as a Core
Web Vital in PSI's separate field-data (CrUX) panel, not in the lab score itself. This is not
a disagreement between vendors so much as a structural gap: any SOP rule that says "Lighthouse
flags poor INP as a scored issue" is factually wrong for the lab report and only true of the
CrUX field-data section of the same PSI page. The SOP must cite CrUX/field data, not the
Lighthouse score, when ruling on INP.

### 6. HTTP-on-HTTPS: Ahrefs/Screaming Frog/Sitebulb treat it as top-tier; Semrush splits by sub-case; Lighthouse doesn't score it as SEO at all
Ahrefs ("HTTPS page has internal links to HTTP" — Error), Screaming Frog (Issue, High), and
Sitebulb ("Internal HTTP URLs" / "Mixed content" — Critical, its highest tier) all treat this
as a top-severity technical fault. Semrush is more granular: "Non-secure pages" is an Error,
but "Homepage does not use HTTPS encryption" is only a Warning, and "Links on HTTPS pages
leading to HTTP page" is also a Warning — lower than its own Errors tier despite being the
same underlying defect Ahrefs scores as Error. Lighthouse doesn't score this in its SEO
category at all — `is-on-https` lives in the Best Practices category. A client citing "my
Lighthouse SEO score doesn't flag this" would be technically correct and still missing a real
problem the SOP should still rate highly, because Lighthouse's category boundaries, not the
underlying severity of the issue, explain the omission.

---

## Source list (full citations)

1. [Title tag missing or empty — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2754356)
2. [What Issues Can Site Audit Identify? — Semrush KB 542](https://www.semrush.com/kb/542-site-audit-issues-list)
3. [Over 300 SEO Issues & How To Fix Them — Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/issues/)
4. [Sitebulb On Page hints](https://sitebulb.com/hints/on-page/)
5. [What does the 'Multiple title tags' issue in Site Audit mean? — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2754360)
6. [Sitebulb Duplicate Content hints](https://sitebulb.com/hints/duplicate-content/)
7. [Meta description tag missing or empty — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2630975)
8. [Multiple meta description tags — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2652405)
9. [What does the 'H1 tag missing or empty' issue in Site Audit mean? — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2764262)
10. [Duplicate pages without canonical — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2596742)
11. [Sitebulb Indexability hints](https://sitebulb.com/hints/indexability/)
12. [Canonical points to redirect — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2753767)
13. [What does the 'Noindex page' warning in Site Audit mean? — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2429909-what-does-the-noindex-page-warning-in-site-audit-mean)
14. [Noindex page receives organic traffic — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2693996)
15. [Page has links to broken page — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2721106)
16. [Redirect chain — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2750680)
17. [Sitebulb Redirects hints](https://sitebulb.com/hints/redirects/)
18. [Sitebulb XML Sitemaps hints](https://sitebulb.com/hints/xml-sitemaps/)
19. [404 page — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2593263)
20. [Orphan page error in Site Audit — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2694175)
21. [Sitebulb Links hints](https://sitebulb.com/hints/links/)
22. [Sitebulb Accessibility hints](https://sitebulb.com/hints/accessibility/)
23. [How to see Core Web Vitals and other speed metrics in Site Audit tool — Ahrefs Help Center](https://help.ahrefs.com/en/articles/5369589-how-to-see-core-web-vitals-and-other-speed-metrics-in-site-audit-tool)
24. [Sitebulb Performance hints](https://sitebulb.com/hints/performance/)
25. [Sitebulb Hints overview (15 categories)](https://sitebulb.com/hints/)
26. [Missing reciprocal hreflang (no return-tag) — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2631143)
27. [Sitebulb International hints](https://sitebulb.com/hints/international/)
28. [HTTPS page has internal links to HTTP — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2614035)
29. [Sitebulb Security hints](https://sitebulb.com/hints/security/)
30. [Noindex page in sitemap — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2754358)
31. [What are "Good" and "Bad" duplicates in Site Audit? — Ahrefs Help Center](https://help.ahrefs.com/en/articles/2115215-what-are-good-and-bad-duplicates-in-site-audit)
32. [Ahrefs Site Audit Issues collection index](https://help.ahrefs.com/en/collections/1539899-issues)
33. [Reviewing Your Site Audit Issues — Semrush KB 541 (severity tier definitions)](https://www.semrush.com/kb/541-site-audit-issues-report)
34. [How is Site Health Score calculated? — Semrush KB 114](https://www.semrush.com/kb/114-total-score)
35. [What is Health Score and how is it calculated in Ahrefs Site Audit? — Ahrefs Help Center](https://help.ahrefs.com/en/articles/1424673-what-is-health-score-and-how-is-it-calculated-in-ahrefs-site-audit)
36. [How to use Hints — Sitebulb documentation](https://sitebulb.com/documentation/getting-started/how-to-use-hints/)
37. [Lighthouse scoring.md — GoogleChrome/lighthouse (GitHub)](https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md)
38. [Lighthouse default-config.js — GoogleChrome/lighthouse (GitHub, source of audit IDs and weights)](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js)

---

## Known gaps in this pass

- **Ahrefs**: could not confirm official severity tiers for "Multiple H1", plain "Canonical
  missing" (outside a duplicate-set context), "Blocked by robots.txt" (no explicit tier found),
  "Missing alt text" (tier not stated in help centre, only inferred from third-party
  commentary and therefore excluded), "Structured data" issues, and "Thin content" specifically.
- **Semrush**: could not confirm a distinct "missing hreflang return tag" issue name (closest
  documented match is the broader "hreflang language mismatch" Notice); could not find a
  standalone canonical-missing issue.
- **Screaming Frog**: the public issues page does not break Core Web Vitals into per-metric
  (LCP/INP/CLS) named issues — Performance is reported as a single undifferentiated
  "Opportunity, Medium" bucket on that page.
- **Sitebulb**: has no published Structured Data hint category at all (only 15 categories are
  documented, and Structured Data is not one of them); does not label any hint with LCP/INP/CLS
  by name; the Accessibility hints page does not surface priority tags per hint the way other
  category pages do.
- **Lighthouse**: is fundamentally single-page and lab-based, so several issue classes in this
  table (orphan pages, redirect chains, broken internal links, sitemap errors, duplicate
  content) are structurally "Not applicable" rather than undocumented — Lighthouse cannot
  detect them by design, which is itself relevant context for the SOP.
