# Structured Data / JSON-LD — Evidence Source Document

Research conducted 2026-07-29. Scope: JSON-LD syntax, Schema.org vocabulary/versioning, Google rich result requirements, `@graph`/`@id` linking, structured data policies, validation tooling, and the two flagged questions (deprecations in the last 24 months; the ranking-factor myth). This document supports an SOP that will govern structured data on every site this team builds.

**Tier definitions used below:**
- **Tier 1** — Schema.org itself, Google Search Central documentation, W3C JSON-LD spec, Bing.
- **Tier 2** — first-party platform docs (none needed beyond Tier 1 for this scope).
- **Tier 3** — named, dated empirical study (supporting only).
- **Tier 4** — practitioner consensus / trade press (supporting only, never load-bearing).

Total requirements documented below: **34** discrete testable rules across 12 sections.
Source split: **29 Tier 1** citations, **5 Tier 3/4** citations (used only to corroborate practitioner claims about the ranking-factor myth and to triangulate blog posts that WebFetch could not render in full).

---

## 1. Why JSON-LD is the recommended syntax

**Rule:** Implement structured data as JSON-LD in a single `<script type="application/ld+json">` block, not Microdata or RDFa.

**Mechanism:** Google parses JSON-LD independent of the visible DOM. Because the markup lives in one script block rather than being interleaved with HTML attributes across the page, it is far less error-prone to generate and maintain at scale, and Google can also read it "when it is dynamically injected into the page's contents" (i.e. via JavaScript after initial load).

**Acceptance criterion:** A `<script type="application/ld+json">` tag exists in the rendered DOM (post-JS execution) containing valid JSON with a `@context` of `https://schema.org`.

**Verification method:** `curl -s <url> | grep -c 'application/ld+json'` for static output, or render the page in a headless browser and inspect `document.querySelectorAll('script[type="application/ld+json"]')`; then run the Rich Results Test against the live URL.

**Source:** Google Search Central, "Intro to How Structured Data Markup Works," https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Splitting one logical entity's properties across Microdata attributes and a separate JSON-LD block for the same entity — this produces duplicate/conflicting node data for the same URL.

---

## 2. Schema.org vocabulary and versioning

**Rule:** Pin awareness of the schema.org release your generator/validator targets; do not assume properties from the bleeding-edge release are safe to use for Google rich results.

**Mechanism:** Schema.org publishes sequential major.minor versions (not strict semver) via an open, GitHub-driven community process (W3C Schema.org Community Group), with new work staged at `staging.schema.org` before merging into a numbered release. Google's rich-result feature docs consume a subset of schema.org vocabulary and layer their own required/recommended property rules on top — schema.org validity does not imply Google eligibility.

**Acceptance criterion:** The current published schema.org release is **30.0**, dated 2026-03-19 (`https://schema.org/version/latest`). A property used in production markup should resolve on `https://schema.org/<PropertyName>` without a "pending"/proposal-only flag.

**Verification method:** Fetch `https://schema.org/version/latest` and confirm the version number/date; cross-check any newly-adopted property against Google's specific rich-result doc, not schema.org alone.

**Source:** Schema.org, "Releases," https://schema.org/docs/releases.html. **Tier 1.**

**Anti-pattern:** Using a schema.org term that validates cleanly in the Schema Markup Validator but has no corresponding Google feature doc, then expecting a rich result — schema.org validity and Google eligibility are two independent gates.

---

## 3. The `@graph` pattern and `@id` linking strategy

**Rule:** When a page describes multiple related entities (e.g. Organization + WebSite + WebPage + BreadcrumbList), assign each a stable absolute-URL `@id` (e.g. `https://example.com/#organization`) and either nest them via object references to that `@id`, or wrap them together in a single `@graph` array under one `@context`.

**Mechanism:** Per the W3C JSON-LD 1.1 spec, `@id` "uniquely identif[ies] node objects that are being described in the document with IRIs or blank node identifiers," and "to be able to externally reference nodes in an RDF graph, it is important that nodes have an identifier." `@graph` "is used to express a graph" — a top-level container holding multiple node objects that share one `@context`. Using `@id` lets separate JSON-LD blocks (or separate objects in one `@graph`) reference the *same* entity (e.g. an Article's `publisher` pointing at the same node as the sitewide Organization) instead of re-declaring duplicate copies of it — this is what "linking" means in practice: one canonical node, referenced by IRI from every other node that needs it.

**Acceptance criterion:** Every `@id` used as a cross-reference target resolves to exactly one node definition on the site (no two different node bodies sharing the same `@id` string); the Organization node's `@id` referenced from `WebSite.publisher`, `WebPage.about` (or `Article.publisher`), etc. is byte-identical across pages.

**Verification method:** Run the Schema Markup Validator on two different pages that reference the same `@id` (e.g. homepage and a blog post referencing the same Organization `@id`) and confirm the referenced entity resolves without contradiction; grep the site's JSON-LD output for a given `@id` string and confirm only one full definition (with `@type` and properties) exists, with all other occurrences being bare `{"@id": "..."}` references.

**Source (mechanism):** W3C, "JSON-LD 1.1: A JSON-based Serialization for Linked Data," §"Node Identifiers" and §"Graphs," https://www.w3.org/TR/json-ld11/#node-identifiers (returns 403 to automated checks; verified manually 2026-07-29). **Tier 1.**

**Note on Google-specific guidance:** Google's own docs previously described combining multiple structured data types on one page (a 2019 Google clarification reported in trade press — [Search Engine Journal](https://www.searchenginejournal.com/google-on-using-multiple-types-of-schema-markup-on-same-page/412457/), [Search Engine Roundtable](https://www.seroundtable.com/google-multiple-types-of-structured-data-28122.html)) but the primary URL previously at `/search/docs/appearance/structured-data/combine-data-types` now 404s. A re-verification pass on 2026-07-29 found no current Google Search Central page addressing this specific topic (checked the live sitemap of `/search/docs/appearance/structured-data/` and the general/combine/webpage/schema-org slugs) — this is not a relocated page, it no longer exists. Google does not publish a dedicated "how to use `@graph`/`@id`" tutorial of its own; the `@graph`/`@id` pattern itself is a general JSON-LD/schema.org mechanism, not a Google-invented one. Treat `@graph`/`@id` as **schema-mechanism-level Tier 1** (W3C spec), and treat "Google recommends nesting related types" as **Convention — not vendor-confirmed** (trade-press-sourced only; do not cite as a live Google URL).

**Anti-pattern:** Giving two unrelated entities (e.g. Organization and a page's `author`) the same `@id`, which silently merges them into one node from a JSON-LD processor's point of view.

---

## 4. `Organization`

**Rule:** Publish an `Organization` node (home page or a canonical About page) with `name`, `url`, `logo`, and `sameAs` at minimum; there is no hard-required property.

**Mechanism:** Google uses Organization markup to "understand your organization's administrative details and disambiguate your organization in search results," feeding the Knowledge Panel (logo selection, brand profile) and, when merchant-related sub-properties are present, the merchant knowledge panel (return/shipping policy display).

**Required properties:** None. Google states verbatim: "There are no required properties; instead, add the properties that apply to your organization."

**Recommended properties:** `name`, `alternateName`, `url`, `logo`, `address` (as `PostalAddress`), `telephone`, `email`, `contactPoint`, `description`, `sameAs`, `foundingDate`; commerce-specific: `vatID`, `taxID`, `iso6523Code`, `leiCode`, `naics`, `duns`, `hasMerchantReturnPolicy`, `hasShippingService`, `hasMemberProgram`.

**Logo-specific constraint:** minimum 112×112px, must be crawlable/indexable, and should render legibly on a white background.

**Acceptance criterion:** A single canonical `Organization` node exists site-wide (same `@id`/values on every page that references it) with at minimum `name`, `url`, `logo` populated; `logo.url` returns HTTP 200 and the image is ≥112×112px.

**Verification method:** Run the Rich Results Test on the homepage; check Search Console's "Logos" report for eligibility once indexed; `curl -I <logo-url>` plus an image-dimension check for the 112×112 floor.

**Source:** Google Search Central, "Organization (Organization) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/logo (last updated 2026-04-15 UTC). **Tier 1.**

**Anti-pattern:** Declaring a different `Organization.name`/`logo` on different pages of the same site (breaks disambiguation) or fabricating `foundingDate`/`vatID` values that don't match public record (structured-data policy violation, see §9).

---

## 5. `WebSite` (and the retired Sitelinks Searchbox)

**Rule:** A `WebSite` node with `name` and `url` is safe and low-risk to keep, but do **not** implement `SearchAction`/sitelinks-searchbox markup expecting a search box in Google results — that feature is gone.

**Mechanism (historical → current):** `WebSite` + a `potentialAction` of type `SearchAction` used to make Google render an inline search box under the site's SERP entry. Google's changelog entry states: "Removed the sitelinks search box documentation and archived the `nositelinkssearchbox` rule. The sitelinks search box feature is no longer available in Google Search results."

**Acceptance criterion:** If `SearchAction` markup is still present from legacy implementation, it is harmless (no manual action risk) but produces no visible feature; there is no reason to add new `SearchAction` markup for Google.

**Verification method:** Rich Results Test will not report a sitelinks-searchbox result for any URL (the feature was removed from the tool's supported list) — confirmed by the current Search Gallery listing, which no longer includes a Sitelinks Searchbox row.

**Source:** Google Search Central changelog, entry dated 2024-11-29, referencing removal from https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox. **Tier 1.**

**Anti-pattern:** Spending engineering time building/maintaining `SearchAction` markup under the belief it still affects SERP appearance — it does not, as of this writing.

---

## 6. `WebPage`

**Rule:** Every page implicitly is a `WebPage` in schema.org's model; explicit declaration is only worth doing when you need to attach `WebPage`-specific properties (`breadcrumb`, `primaryImageOfPage`, `speakable`, `lastReviewed`) or link it into the site graph via `isPartOf` → `WebSite`.

**Mechanism:** Schema.org's own definition: "Every web page is implicitly assumed to be declared to be of type WebPage, so the various properties about that webpage ... may be used." `WebPage` sits at `Thing > CreativeWork > WebPage` in the type hierarchy and has 12+ subtypes (`AboutPage`, `ContactPage`, `FAQPage`, `MedicalWebPage`, etc.). There is **no dedicated Google rich-result feature keyed on the bare `WebPage` type** — Google does not publish a "WebPage structured data" guide the way it does for Article or Product (the URL pattern `/structured-data/webpage` 404s); `WebPage` functions as connective tissue in the `@graph` (via `isPartOf`, `about`, `mainEntity`) rather than as an eligibility trigger in its own right.

**Recommended properties (for graph-linking purposes):** `@id`, `isPartOf` (→ `WebSite` `@id`), `breadcrumb` (→ `BreadcrumbList`), `primaryImageOfPage`, `mainEntity`, `name`, `description`, `inLanguage`, `lastReviewed`, `speakable`.

**Acceptance criterion:** If declared, `WebPage.isPartOf` resolves to the site's `WebSite` `@id`, and `WebPage.@id` is referenced consistently from any child entity (e.g. `Article.mainEntityOfPage`).

**Verification method:** Schema Markup Validator confirms syntactic validity (this is a schema.org type-hierarchy check, not a Google eligibility check — see §11); there is no Google-specific pass/fail signal for bare `WebPage` because no rich result depends on it directly.

**Source:** Schema.org, "WebPage," https://schema.org/WebPage. **Tier 1.** (Absence of a dedicated Google rich-result doc confirmed by direct 404 on `developers.google.com/search/docs/appearance/structured-data/webpage`.)

**Anti-pattern:** Treating `WebPage` markup itself as something that "unlocks" a rich result — it doesn't; its value is entirely as a graph-linking node for the types that *do* have Google features (Breadcrumb, Article, Speakable).

---

## 7. `BreadcrumbList`

**Rule:** Provide a `BreadcrumbList` with at least two `ListItem` entries reflecting the typical user navigation path (not necessarily the literal URL path).

**Required properties:** `itemListElement` (array of `ListItem`); each `ListItem` needs `position` (integer, 1-indexed) and `name`; `item` (URL) is required on every item except optionally the last/current page.

**Mechanism:** Google displays the breadcrumb trail in place of/alongside the URL in the SERP snippet on **desktop**. Google explicitly separates two sources it can use to build this trail: your explicit `BreadcrumbList` markup, and a URL-structure-based fallback it parses itself if no markup is present — providing markup gives you control over the displayed trail rather than ceding it to URL-guessing.

**Materially changed (within last 24 months):** As of **2025-01-23**, Google **stopped showing the breadcrumb trail in mobile search snippets**, replacing it with a domain-only display ("Simplifying the visible URL element on mobile search results"). Desktop is unaffected and the breadcrumb rich-result report in Search Console remains active — no markup change is required, but the practical value of the feature is now desktop-only.

**Acceptance criterion:** ≥2 `ListItem` entries with sequential `position` values starting at 1; `name` values match the visible on-page breadcrumb trail text.

**Verification method:** Rich Results Test on a detail page; Search Console → "Breadcrumbs" rich result status report, filtered to desktop.

**Source:** Google Search Central, "Breadcrumb (BreadcrumbList) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (last updated 2025-12-10). Mobile-display change: Google Search Central Blog, "Simplifying the visible URL element on mobile search results," https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs (2025-01-23; full body could not be rendered via WebFetch — corroborated via independent trade-press summaries, **Tier 4**, for the specific "desktop unaffected / no action required" claim). **Tier 1** for the core breadcrumb doc; **Tier 1 + Tier 4 corroboration** for the mobile-display change.

**Anti-pattern:** Encoding the raw URL path segments as breadcrumb `name` values instead of the human-readable navigation labels shown on the page.

---

## 8. `Article` (including `NewsArticle`, `BlogPosting`)

**Rule:** Use `Article`, `NewsArticle`, or `BlogPosting` (pick one per page) with populated `headline`, `image`, `datePublished`, `dateModified`, and `author`; there is no hard-required property, but incomplete markup forfeits eligibility for enhanced display.

**Required properties:** None. Google states verbatim: "There are no required properties; instead, add the properties that apply to your content."

**Recommended properties:** `headline` (short, mobile-friendly), `image` (repeated; Google recommends multiple high-resolution images ≥50,000 total pixels at 16:9, 4:3, and 1:1 aspect ratios), `datePublished` and `dateModified` (ISO 8601 with timezone), `author` (Person or Organization; `author.name` must contain **only** the person's name — no honorifics, job titles, or publisher name folded in; `author.url` or `sameAs` for disambiguation; every author shown on the page should get its own `author` entry, not a merged string).

**Mechanism:** "Adding Article structured data ... can help Google understand more about the web page and show better title text, images, and date information ... in search results on Google Search and other properties (for example, Google News and the Google Assistant)." Notably, Article markup is **not required** for Top Stories/Google News eligibility — those are driven by content/technical requirements independent of markup — but markup makes intent explicit.

**Acceptance criterion:** `datePublished`/`dateModified` match the visibly-rendered dates on the page; `author.name` contains no titles/affiliations; at least one `image` meets the pixel-count and aspect-ratio guidance.

**Verification method:** Rich Results Test; Search Console → "Article" or "Unparsable structured data" rich-result reports.

**Source:** Google Search Central, "Article (Article, NewsArticle, BlogPosting) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Setting `dateModified` to the current date on every crawl/build regardless of whether content actually changed (a "freshness" spoofing pattern Google's content-quality guidance treats as misleading); putting the publisher's name inside `author.name`.

---

## 9. `FAQPage` — DEPRECATED, flag #1

**Rule (current, 2026):** Do **not** rely on `FAQPage` markup for a rich result. It no longer produces any visible SERP feature for any site type.

**Timeline (Tier 1, Google Search Central changelog, `https://developers.google.com/search/updates`):**
- **2023-09-14** — eligibility first restricted: "the feature is only shown for well-known, authoritative government and health websites" (down from all sites).
- **2025-06-12** — deprecation banner added to the FAQPage documentation warning of an upcoming full removal (part of the broader "Simplifying the search results page" initiative, https://developers.google.com/search/blog/2025/06/simplifying-search-results).
- **2026-05-08** — explicit deprecation notice added: "This feature will no longer appear in Google Search starting May 7, 2026."
- **2026-05-07** — FAQ rich result stopped appearing in live Google Search results.
- **2026-06-15** — FAQPage documentation page removed entirely from Google Search Central ("Removed documentation for the FAQ rich result feature" because "The FAQ rich result feature is no longer shown in Google Search results").
- Search Console API support for the FAQ report is scheduled to end **2026-08** per trade-press coverage of the same changelog (Tier 4 corroboration; could not independently re-fetch the exact August cutoff wording from a primary source).

**Current eligibility status:** **Gone.** Confirmed independently by (a) the changelog trail above, (b) direct 404/removal-notice on the FAQPage documentation URL, and (c) the current Search Gallery (`https://developers.google.com/search/docs/appearance/structured-data/search-gallery`, last updated 2026-06-15) no longer listing FAQPage among supported rich result types.

**What still exists:** `FAQPage` remains a valid schema.org type (schema.org itself did not remove it — only Google's *rich result feature* is gone) and Bing's markup validator still parses generic schema.org types, but no primary source documents a Bing FAQ rich-result feature to check against. Treat `FAQPage` markup on new builds as **optional/low-value for Google specifically** — do not spend engineering effort implementing it purely for SERP appearance.

**Acceptance criterion for an audit:** Any site in this team's portfolio should not be relying on FAQPage rich-result CTR in reporting/forecasting; existing FAQPage markup is not harmful (no manual-action risk from simply having it) but confers no display benefit.

**Verification method:** Rich Results Test against a page carrying `FAQPage` markup will no longer report an FAQ rich-result preview; Search Console's FAQ report (where still present) will show zero impressions after 2026-05-07.

**Source:** Google Search Central changelog and blog, as dated above. **Tier 1** for all dated claims; **Tier 4** only for the August 2026 API-sunset specific date, which could not be independently re-verified from a primary source in this pass.

---

## 10. `HowTo` — DEPRECATED, flag #1 (continued)

**Rule:** Do not implement `HowTo` markup expecting any Google rich result; the feature has been gone since 2023 and this predates the current 24-month window but remains the standing current status.

**Timeline:** **2023-09-14** — Google Search Central changelog: "Removed the How-to structured data documentation, as this rich result is no longer shown in search results, on both desktop and mobile devices," referencing the blog post "Changes to HowTo and FAQ rich results" (https://developers.google.com/search/blog/2023/08/howto-faq-changes — full body could not be rendered via WebFetch in this pass; existence and title confirmed via the official blog archive and multiple independent search-result citations, but the exact quoted rationale sentence could not be independently re-verified beyond the changelog summary above).

**Current eligibility status:** **Gone**, globally, on both desktop and mobile — confirmed by the same 2026-06-15 Search Gallery listing, which does not include HowTo.

**Verification method:** Rich Results Test will not return a HowTo preview for any URL.

**Source:** Google Search Central changelog, 2023-09-14 entry. **Tier 1** for the removal fact and date; the deeper "why" (search-quality/real-estate rationale referenced in the scope prompt) could not be independently confirmed from the primary blog post text in this pass — treat that specific causal narrative as **unverified** until the blog post is fetched successfully, and cite only the changelog fact above in the SOP.

---

## 11. Other structured data features retired in the same 24-month window (context for flag #1)

Beyond FAQPage/HowTo, Google's June 2025 "simplifying the search results page" initiative deprecated a further batch, confirmed via the official blog post title and the June 2025 changelog banner-addition entry (Tier 1 changelog fact; the specific rationale quote below is Tier 4, corroborated across multiple independent trade-press summaries of the same post, since WebFetch could not render the blog post's full body in this pass):

- Book actions, Course info, Estimated salary, ClaimReview (fact-checking), Learning video, Special announcement, Vehicle listing — banners added 2025-06-12; support removed from Search Console rich-result reporting, the Rich Results Test, and Search-appearance filters starting **2026-01**.
- Practice problem (deprecation banner added 2025-11-05) and a clarification that `Dataset` structured data only ever fed Google's separate Dataset Search product, never general web Search.
- Stated rationale (Tier 4, attributed to the Google post but not independently re-verified verbatim): these types were "not commonly used in Search" and their displays were "no longer providing significant additional value for users."

**Net effect for the SOP:** treat `Article`, `Breadcrumb`, `Organization`, `Product`/merchant listing/review snippet, `JobPosting`, `Event`, `Recipe`, `LocalBusiness`, `Video`, and `Q&A` as the durable, currently-supported core (all present on the 2026-06-15 Search Gallery). Treat `FAQPage`, `HowTo`, `Book actions`, `Course info`, `Estimated salary`, `ClaimReview`, `Learning video`, `Special announcement`, `Vehicle listing`, and `Practice problem` as **do-not-implement-for-Google** as of this document's date. `Dataset` should only be implemented if the goal is Google Dataset Search specifically, not general web Search rich results.

**Source:** Google Search Central Blog, "Simplifying the search results page," https://developers.google.com/search/blog/2025/06/simplifying-search-results, and changelog entries dated 2025-06-12 and 2025-11-05. **Tier 1** for dates/feature list; **Tier 4** for the quoted rationale sentence.

---

## 12. `Product` (Product Snippets vs. Merchant Listings)

**Rule:** Choose the correct sub-feature deliberately — `Product` markup on a page where a shopper *cannot* directly buy (editorial/comparison content) should target **Product Snippets**; a page where a shopper *can* buy should target **Merchant Listing** requirements, which are stricter.

**Product Snippet required properties:** `Product.name`; plus at least one of `review`, `aggregateRating`, or `offers`. `Offer.price` (or `priceSpecification.price`) is required if `offers` is used; `priceCurrency` is recommended (not required) for snippets. `AggregateOffer` requires `lowPrice` and `priceCurrency`.

**Merchant Listing required properties (stricter):** `Product.name`, `Product.image`, `Product.offers`; `Offer.price` (must be > 0) and `Offer.priceCurrency` are both **required** (not merely recommended). Key constraint, quoted: "Only pages where a shopper can purchase a product are eligible for merchant listing experiences, not pages with links to other sites that sell the product."

**Recommended properties (both):** `aggregateRating`, `brand.name`, `category`, `color`, `description`, `gtin`, `material`, `mpn`, `review`, `sku`, `availability`, `hasMerchantReturnPolicy`, `itemCondition`, `priceValidUntil`, `shippingDetails`.

**Review/AggregateRating self-serving restriction:** "If the entity that's being reviewed controls the reviews about itself, their pages that use `LocalBusiness` or any other type of `Organization` structured data are ineligible for star review feature." This applies to reviews hosted on the reviewed entity's own site, including via embedded third-party widgets.

**Recent change (within 24 months):** As of the **2026-07-24** changelog entry, Google added an explicit guideline to the review-snippet documentation addressing "fake and undisclosed incentivized reviews" — tightening the content-quality bar around review markup specifically.

**Manual action risk:** "If your site violates one or more of these guidelines, then Google may take manual action against it," with reconsideration-request as the remediation path.

**Acceptance criterion:** For merchant listings, `Offer.price` > 0 and `priceCurrency` populated on every offer; product reviews shown are not self-authored by the seller about their own `Organization`/`LocalBusiness` entity.

**Verification method:** Rich Results Test on both a comparison-style page (expect Product Snippet eligibility) and a checkout-capable PDP (expect Merchant Listing eligibility); Search Console → Merchant Listings / Review Snippets reports for manual-action flags.

**Source:** Google Search Central, "Product Snippet," https://developers.google.com/search/docs/appearance/structured-data/product-snippet (last updated 2025-12-10); "Merchant Listing," https://developers.google.com/search/docs/appearance/structured-data/merchant-listing; "Review Snippet (Review, AggregateRating)," https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24). **Tier 1**, all three.

---

## 13. `JobPosting`

**Rule:** Publish full `JobPosting` markup on the individual job-detail page (not a listing/search page), and remove or expire it the moment the requisition closes.

**Required properties:** `datePosted` (ISO 8601), `description` (full HTML job description; must not merely duplicate `title`), `hiringOrganization` (with `name`; `sameAs`/`logo` optional but recommended), `jobLocation` (`Place` → `PostalAddress` with `addressCountry` at minimum), `title` (job title text only — no job codes, salary, or address embedded).

**Recommended properties:** `baseSalary` (with currency + unit: `HOUR`/`DAY`/`WEEK`/`MONTH`/`YEAR`), `employmentType`, `validThrough`, `jobLocationType: "TELECOMMUTE"` for remote roles, `applicantLocationRequirements`, `identifier`, `directApply`.

**Mechanism:** Feeds Google's job search experience (Google for Jobs). Google explicitly ties data quality here to manual-action risk more aggressively than most other types: "Jobs that are no longer open for applications must be expired in one of the following ways. Failure to take timely action on expired jobs may result in a manual action."

**Expiry requirement — three accepted methods:** (1) set `validThrough` to a past date, (2) return HTTP 404/410 for the page, or (3) remove the `JobPosting` markup entirely. Google recommends the Indexing API (over sitemap-only) to accelerate recrawl of removed/expired postings.

**Acceptance criterion:** Every live `JobPosting` node has a `validThrough` in the future or no `validThrough` with an active req; every closed req returns 404/410 or has zero `JobPosting` markup within a recrawl cycle after closing.

**Verification method:** Rich Results Test; Search Console → "Job Postings" rich-result report for expired-but-still-marked-up pages; a scheduled job diffing `validThrough`/req-status against the CMS's actual posting status.

**Source:** Google Search Central, "Job Posting (JobPosting) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/job-posting (last updated 2025-12-18 UTC). **Tier 1.**

**Anti-pattern:** Leaving `JobPosting` markup live on a closed requisition "just in case," or embedding the salary/location inside `title` instead of `baseSalary`/`jobLocation`.

---

## 14. General structured data policies and manual-action risk

**Rule:** Structured data must describe only what is visibly present and accurate on the same page; never mark up hidden, fabricated, or off-topic content.

**Mechanism / exact quotes (Google Search Central, "General Structured Data Guidelines," https://developers.google.com/search/docs/appearance/structured-data/sd-policies, last updated 2026-07-10 UTC):**
- Technical requirement: "Don't block your structured data pages to Googlebot using robots.txt, `noindex`, or any other access control methods."
- Content requirement: "Don't mark up content that is not visible to readers of the page." / "Don't mark up irrelevant or misleading content, such as fake reviews or content unrelated to the focus of a page." / "Don't use structured data to deceive or mislead users. Don't impersonate any person or organization."
- From the companion intro doc: "Don't create blank or empty pages just to hold structured data, and don't add structured data about information that is not visible to the user, even if the information is accurate."
- Completeness requirement: "Specify all required properties listed in the documentation for your specific rich result type."

**Consequence, quoted verbatim:** "A structured data manual action means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search." This is the load-bearing sentence distinguishing rich-result manual actions from ranking penalties — a manual action here costs you the enhanced snippet, not organic position.

**Acceptance criterion:** Every value in JSON-LD markup has a corresponding visible on-page representation (e.g. a `price` in `Offer` matches the displayed price; an `author` name matches the byline shown).

**Verification method:** Manual crawl-vs-markup diff (a scripted check comparing rendered DOM text against JSON-LD field values for price/date/rating fields); Search Console Security & Manual Actions report for existing manual actions.

**Source:** As quoted above, plus Google Search Central, "Intro to How Structured Data Markup Works" (2025-12-10 UTC). Both **Tier 1.**

**Anti-pattern:** Copy-pasting a competitor's JSON-LD template wholesale and forgetting to update `aggregateRating`/`review` values to match your own actual (not aspirational) numbers.

---

## 15. Validation tooling — what each tool actually checks

**Rule:** Use the **Rich Results Test** to check Google-specific eligibility, and the **Schema Markup Validator** to check generic schema.org syntax validity. They are not interchangeable and check different things.

**Rich Results Test** (https://search.google.com/test/rich-results):
- Accepts either a live URL ("Test your publicly accessible page to see which rich results can be generated by the structured data it contains") or a raw code snippet.
- Checks markup **against Google's own required/recommended property rules per feature**, and previews which specific rich-result type(s) — carousel, image, star rating, etc. — the page's structured data would be *eligible* to generate. It does not guarantee display (see §16).
- Historical note: this tool absorbed the Google-specific validation role after Google split it off the old "Structured Data Testing Tool" (retired; see the 2020-12 blog post "An update on the Structured Data Testing Tool").

**Schema Markup Validator** (https://validator.schema.org/):
- Validates **any** schema.org-vocabulary JSON-LD/Microdata/RDFa against the schema.org type/property model itself, with **no Google-specific feature warnings**. Useful for types Google doesn't consume at all, or for confirming raw syntactic correctness independent of any search engine's eligibility rules.

**Acceptance criterion:** A page passes the Rich Results Test with zero errors for the target feature type, and separately passes the Schema Markup Validator with zero schema.org-level errors (the two can diverge: markup can be perfectly valid schema.org and still be Google-ineligible, or vice versa in rare cases).

**Verification method:** Run both tools against every template type (once per template, not per page) as part of the pre-launch checklist; re-run after any change to the JSON-LD builder code.

**Source:** Google Search Central, tool descriptions cross-referenced from https://developers.google.com/search/docs/appearance/structured-data and the Rich Results Test tool page itself; Schema.org, validator.schema.org (tool is schema.org/W3C Community Group-maintained, per its `.org` domain and lineage from the retired Google Structured Data Testing Tool). **Tier 1** for both tools' scope/purpose.

---

## 16. The ranking-factor myth — flag #2

**Rule for the SOP:** Structured data must never be pitched internally or to clients as something that improves organic ranking position. It does not. State this explicitly to prevent the single most common false claim in the industry from entering our deliverables.

**What Google actually says (Tier 1, direct quotes):**
- "Google uses structured data to understand the content on the page and show that content in a richer appearance in search results, which is called a rich result." (§ "intro-structured-data" doc) — the stated purpose is *appearance*, not *position*.
- "Google doesn't guarantee that your structured data will be used in Search results, even if your page is marked up correctly according to our general structured data guidelines and specific documentation for the feature." / "Using structured data enables a feature to be present, it does not guarantee that it will be present. The Google algorithm tailors search results to create what it thinks is the best search experience for a user ... In some cases it may determine that one feature is more appropriate than another, or even that a text result is best." (repeated near-verbatim across multiple Google structured-data feature docs, including FAQ, review-snippet, course, and employer-rating pages, per cross-page search corroboration).
- On the enforcement side: "A structured data manual action means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search." — this is the clearest first-party statement that even the *penalty* for structured-data abuse is scoped to rich-result eligibility, not ranking.

**What practitioners repeat that isn't supported:** The claim "adding schema boosts your rankings" is widespread in SEO trade content but is not supported by any Google Search Central documentation reviewed here. Google/Search-Liaison spokespeople (Danny Sullivan, John Mueller) have been reported making on-record statements that schema markup gives no ranking boost by itself (Tier 4 — trade-press reporting of spokesperson statements, e.g. Search Engine Journal's "Google Confirms That Structured Data Won't Make A Site Rank Better," April 2025 timeframe; not independently re-verified against a primary transcript/tweet in this pass, but consistent with and secondary to the primary-source quotes above, which are sufficient on their own to ground the rule).

**Acceptance criterion for internal review:** Any deliverable (proposal, report, audit) claiming or implying "structured data will improve rankings" should be rejected in review; acceptable claims are limited to "eligibility for enhanced SERP appearance," "improved CTR via richer snippets," and "clearer machine-readability of page content."

**Verification method:** Grep internal deliverables/templates for phrases like "boost rankings," "improve ranking," or "rank higher" in proximity to "structured data"/"schema"/"JSON-LD" as a documentation lint check.

**Source:** Google Search Central, "General Structured Data Guidelines" (https://developers.google.com/search/docs/appearance/structured-data/sd-policies, last updated 2026-07-10 UTC) and "Intro to How Structured Data Markup Works" (https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data, last updated 2025-12-10 UTC). **Tier 1** for the rule itself; **Tier 4** only for the named-spokesperson color/quotes, which are supporting, not load-bearing.

---

## Appendix: sources not successfully retrieved (documented for transparency)

The following URLs were attempted and could not be fully verified in this pass; claims sourced from them are explicitly marked Tier 4/unverified above rather than presented as confirmed Tier 1:

- `https://developers.google.com/search/blog/2023/08/howto-faq-changes` — page exists (confirmed via search index and archive listing) but WebFetch could not render the article body; only the changelog's summary sentence of this post could be confirmed.
- `https://developers.google.com/search/blog/2025/06/simplifying-search-results` — same issue; feature list and dates confirmed via the changelog entries and independent trade-press corroboration, but the exact rationale sentence is a Tier 4 paraphrase/quote from secondary reporting, not independently re-confirmed against the primary post's raw HTML.
- `https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs` and `https://developers.google.com/search/blog/2025/11/update-on-our-efforts` — same rendering limitation; facts used from these are cross-checked against changelog entries and multiple independent secondary sources rather than the primary post body alone.
- `https://developers.google.com/search/docs/appearance/structured-data/combine-data-types` and `.../webpage` and `.../schema-org` — return HTTP 404, re-checked 2026-07-29; no successor page found, treated as "does not currently exist" rather than guessed at, and the claim it supported (§3) is downgraded to Convention — not vendor-confirmed rather than substituted with an unrelated Google URL.
- `https://www.bing.com/webmasters/help/schema-markup-recommendation-cd0d2b6c` — HTTP 404, re-checked 2026-07-29; no successor slug found under `bing.com/webmasters/help/`. Bing's confirmed-live JSON-LD support post — [Introducing JSON-LD Support in Bing Webmaster Tools](https://blogs.bing.com/webmaster/august-2018/Introducing-JSON-LD-Support-in-Bing-Webmaster-Tools) (Bing Webmaster Blog, August 2018, verified 200) — is used in place of the dead help-page URL as the Tier 1 Bing citation for JSON-LD support in this document.

No URL was invented to fill a gap; where a claim could not be grounded in a retrievable primary source, it is marked Tier 4 or flagged as unverified above.
