# SEO / AEO / GEO SOP — Structured Data

**Module:** 04 — Structured data
**Prefix:** `SCHEMA`
**Status:** Core module — always applies (`00-index.md` §8).
**Review cadence:** Semi-annual (`00-index.md` §9).

## Scope

JSON-LD engine design, the entity graph, `@id` strategy, per-template type requirements, rich-result eligibility, and validation gates. This module does not cover keyword/content strategy, nor per-page copy — see `00-index.md` §1 for the SOP's non-goals.

## Required versus recommended: the cost most audits get wrong

Most structured-data advice — including a large share of agency and trade-press content — treats every property Google *recommends* as if it were *required*, which inflates implementation cost and turns a low-effort addition into a project. It is not the standard this SOP holds sites to. Google states plainly, in its own words, that `Organization` has "no required properties; instead, add the properties that apply to your organization," and that `Article`/`NewsArticle`/`BlogPosting` likewise has "no required properties; instead, add the properties that apply to your content." `Product` is the sharper contrast: a **Product Snippet** requires only `Product.name` plus at least one of `review`, `aggregateRating`, or `offers` — full **Merchant Listing** eligibility is the stricter tier, requiring `image` and a priced `offers` outright, and applies only to pages where a shopper can buy directly. Treat every rule below's `Acceptance` field as the actual bar; treat everything else in its `Why` as context, not a checklist.

## Rich results, not rankings

Structured data confers rich-result eligibility. It never confers ranking. This is stated as plainly as Google states it, because the opposite claim is the single most common false belief this domain produces, and it must never enter an internal deliverable, a client proposal, or an audit finding presented by this team. Google's own enforcement language makes the scope of the claim unambiguous: a structured data manual action "means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search." If the penalty for outright abuse doesn't touch ranking, correctly-implemented markup certainly doesn't earn any. See SCHEMA-01.

## Finding: `packages/schema` is not dead — the CMS's own schema engine is

A documented suspicion held that CleanStart's CMS schema engine was dead in production. The evidence settles it, and the real answer is more precise than the suspicion, because it identifies two different systems where the suspicion named only one:

- **`packages/schema` (builders, `composeGraph`, validators) is alive and shared.** `apps/web` imports it across 40+ page files through the `@/lib/seo/jsonld` and `@/lib/seo/compose-page.ts` shims, and it composes the JSON-LD for every live page on the site — home, every static marketing page, every detail route, and every listing route.
- **What is actually dead is the CMS's own dispatcher** — `apps/cms/src/payload/lib/jsonld/dispatch.ts` (`buildJsonLdBlobs`, its three layers of auto/`schemaAddons`/`additionalSchema` composition), the `/api/jsonld` endpoint that exposes it, and the `schemaAddons` field attached to nine collections. The only callers of that endpoint anywhere in the repository are the CMS admin's own "Schema (JSON-LD)" preview sidebar and the CMS's own e2e tests — `apps/web` calls it zero times. The CMS's own code says so: `apps/cms/src/payload/lib/jsonld/page-live-schema.ts:6-13` states that after a prior unification, "a page's auto schema... is composed in apps/web at build time — the CMS does not recompute it," and that the CMS instead fetches the rendered HTML of the live page and regex-extracts its `<script type="application/ld+json">` blocks to find out what actually shipped — the CMS had to build a scraper of its own output's destination because its dispatcher's output never reaches that destination.
- **`packages/schema`'s own test suite — roughly 65 assertions across 7 files — never runs in any CI job.** No GitHub Actions workflow references `packages/schema`; `apps/web/vitest.config.ts` scopes its `include` to `apps/web/src/**` only, so a green `apps/web` test run says nothing about the shared package's own tests.

The practical consequence: an editor filling in a `schemaAddons` block (HowTo, VideoObject, Review, manual FAQ, breadcrumb suppress/replace) sees it validate and render correctly in the CMS's own preview UI, and it never appears in a single byte of the live page's JSON-LD. This is formalized as an enforceable, portable rule at SCHEMA-03, and as a CI-coverage rule at SCHEMA-14.

---

## P1 — material organic or AI-visibility impact

### SCHEMA-01 — Structured data confers rich-result eligibility only, never ranking

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never state or imply, in code comments, internal documentation, audits, or client-facing deliverables, that adding or improving structured data increases a page's ranking position. Structured data affects SERP *appearance* and machine-readability of content, not ranking.
- **Why:** Google states the purpose of structured data is that it "can help Google understand the content on the page and show that content in a richer appearance in search results" — appearance, not position — and separately that "Google doesn't guarantee that your structured data will be used in Search results, even if your page is marked up correctly." The clearest evidence is on the enforcement side: a structured data manual action "means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search." If even the penalty for structured-data abuse is scoped to rich-result eligibility, correct implementation cannot be pitched as a ranking lever.
- **Acceptance:**
  - No internal SOP, proposal, audit, or report claims or implies "structured data improves ranking"
  - Acceptable framing is limited to: rich-result eligibility, richer-snippet CTR improvement, clearer machine-readability of page content
- **Verify:** `grep -rniE "(boost|improve|rank higher).{0,40}(structured data|schema|json-ld)" docs/ 2>/dev/null | wc -l` → `0`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC); https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data (last updated 2025-12-10 UTC)
- **Anti-patterns:** Citing named-spokesperson quotes (Danny Sullivan, John Mueller) as if they were primary documentation — they are Tier 4 corroboration only; the rule stands on the Tier 1 quotes above without needing them.
- **CleanStart:** Unverified — no audit of past client-facing deliverables or proposals for this claim was performed in this pass.

### SCHEMA-02 — Mark up only what is visibly true on the same page

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every JSON-LD value must have a corresponding, accurate, visible representation on the same page. Never mark up hidden, fabricated, off-topic content, or content behind an access-control method that also blocks the page from Googlebot.
- **Why:** Quoted directly from Google's General Structured Data Guidelines: "Don't mark up content that is not visible to readers of the page." / "Don't mark up irrelevant or misleading content, such as fake reviews or content unrelated to the focus of a page." / "Don't use structured data to deceive or mislead users. Don't impersonate any person or organization." / "Don't create blank or empty pages just to hold structured data." Violating this risks a structured data manual action, which removes rich-result eligibility for the affected type sitewide until a reconsideration request succeeds — the highest-blast-radius consequence in this domain, even though (SCHEMA-01) it never touches ranking.
- **Acceptance:**
  - No `noindex`, `robots.txt Disallow`, or other access-control method blocks a page carrying structured data intended for Google
  - Every price, date, rating, and author value in JSON-LD matches the rendered DOM value on the same page
  - No page exists solely to host structured data with no other content
- **Verify:** Rich Results Test on a sample of each template, cross-checked against Search Console → Security & Manual Actions report, for zero flagged manual actions
- **Reference:** `apps/web/src/components/JsonLdGraph.tsx:17-27` — JSON-LD is rendered only inside a route's own served content; no dedicated schema-only page exists anywhere in the codebase.
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC); https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data (last updated 2025-12-10 UTC)
- **Anti-patterns:** Copy-pasting a competitor's JSON-LD template and forgetting to update `aggregateRating`/`review` values to your own actual, not aspirational, figures.
- **CleanStart:** Unverified — Search Console Manual Actions report access was not confirmed and no scripted field-level markup-vs-DOM diff was run in this pass.

### SCHEMA-03 — One JSON-LD engine may reach production; a second full pipeline that never ships is a defect, not a backup

- **Severity:** P1
- **Applies:** Always
- **Rule:** A site's structured-data pipeline must have exactly one implementation whose output a crawler actually receives. If a second, fully-built composition/dispatch pipeline exists — for example a CMS-side "schema engine" with its own builders, validators, and editor-facing fields — but nothing in the served page ever calls it, that pipeline is dead code wearing a live-looking editor UI: editors filling in its fields believe they are shipping schema that in fact never reaches a crawler.
- **Why:** This is CleanStart's own documented history (see the Finding above). Sharing primitives between two orchestration layers does not imply both layers reach production — only the render path settles that question, not the import graph.
- **Acceptance:**
  - A grep for the dispatcher's endpoint path across the web app's source returns zero hits, or the endpoint is deleted/repurposed
  - Any CMS field whose stated purpose is "adds to the live page's schema" is wired to the same engine the web app actually renders from, not a parallel one
  - Shared primitives between two orchestration layers are documented as shared; that documentation never asserts both layers' *output* reaches production without checking the render path directly
- **Verify:** `grep -rn "api/jsonld" apps/web/src | wc -l` → `0`
- **Reference:** `apps/cms/src/payload/lib/jsonld/dispatch.ts`; `apps/cms/src/payload/endpoints/jsonld.ts`; `apps/cms/src/payload/lib/jsonld/page-live-schema.ts:6-13`; `apps/cms/src/payload/fields/schema-addons.ts` (attached to `Blogs.ts:206`, `Guides.ts:201`, `Events.ts:330`, `Jobs.ts:308`, `KnowledgeBase.ts:154`, `News.ts:180`, `Pages.ts:192`, `PodcastEpisodes.ts:237`, `Resources.ts:168`); `apps/web/src/lib/seo/jsonld.tsx:3-6` (shim comment). The CMS dispatcher, its `schemaAddons` field, and their roughly 30 associated test files are all real and well-tested, and produce zero live JSON-LD; `packages/schema` itself is not dead and is correctly the single production engine.
- **Source:** Convention — not vendor-confirmed (single-source-of-truth-for-production-output is a general engineering practice, not a schema.org- or Google-documented rule)
- **Anti-patterns:** Treating "the shared library is imported by both apps" as proof the CMS-side orchestration is live — a shared dependency graph is not a render path.
- **CleanStart:** Fail

### SCHEMA-04 — `@graph`/`@id` linking: one stable identifier per real-world entity

- **Severity:** P1
- **Applies:** Whenever a page describes more than one related entity (Organization, WebSite, WebPage, BreadcrumbList, etc. co-occurring)
- **Rule:** Assign each distinct entity a stable, absolute-URL `@id` and reference it from every node that needs it, instead of re-declaring a duplicate copy per page. Two different real-world entities must never share an `@id` string.
- **Why:** Per the W3C JSON-LD 1.1 spec, `@id` "uniquely identif[ies] node objects... with IRIs," which is what lets other nodes reference the same entity instead of re-describing it. A JSON-LD processor merges any two objects sharing an `@id` into one node — assigning the same `@id` to two unrelated entities (e.g. Organization and a page's `author`) silently merges them into one entity from the processor's point of view.
- **Acceptance:**
  - Every `@id` used as a cross-reference target resolves to exactly one full node definition sitewide; all other occurrences are bare `{"@id": "..."}` pointers
  - The Organization `@id` referenced from `WebSite.publisher`, `Article.publisher`, etc. is byte-identical across every page that references it
- **Verify:** Run the Schema Markup Validator on two pages referencing the same `@id` (e.g. the homepage and a blog post's Organization reference) and confirm no contradictory node body is returned
- **Reference:** `packages/schema/src/builders/site.ts:8-9` (single `SITE_URL`/`SITE_NAME` source); `packages/schema/src/compose/compose-graph.ts:30-42` and `merge.ts:33-49` (dedupes by `@id`, last value wins, first position kept) — a structural guard against the two-entities-one-`@id` failure mode.
- **Source:** [Tier 1] W3C, "JSON-LD 1.1: A JSON-based Serialization for Linked Data," §"Node Identifiers" / §"Graphs," https://www.w3.org/TR/json-ld11/#node-identifiers (blocked for `curl`-style fetches in this team's tooling; retrievable via a standard browser/WebFetch client — not a general access restriction)
- **Anti-patterns:** Citing "Google recommends nesting related types via `@graph`" as a live Google URL — no current Google Search Central page documents this specifically (the prior `combine-data-types` URL 404s with no successor). The `@graph`/`@id` pattern itself is a general JSON-LD/schema.org mechanism, not a Google-invented one; cite it as schema-mechanism-level Tier 1 (W3C), and treat "Google recommends this" as Convention — not vendor-confirmed.
- **CleanStart:** Pass

An illustrative (not literal) example of the pattern — a second entity referencing an already-declared Organization node by `@id` rather than re-declaring it:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example Inc.",
      "url": "https://example.com/",
      "logo": "https://example.com/logo.png"
    },
    {
      "@type": "Article",
      "headline": "Example headline",
      "publisher": { "@id": "https://example.com/#organization" }
    }
  ]
}
```

### SCHEMA-05 — `Organization`: no required properties, but populate the disambiguation set

- **Severity:** P1
- **Applies:** Always (home page or canonical About page)
- **Rule:** Publish one canonical `Organization` node, identical across every page that references it, with at minimum `name`, `url`, `logo`, and `sameAs` populated. There is no required property — Google states verbatim: "There are no required properties; instead, add the properties that apply to your organization." Do not treat every recommended property as mandatory.
- **Why:** Google uses Organization markup to disambiguate the organization in the Knowledge Panel and, when merchant sub-properties are present, the merchant knowledge panel. Declaring a different `name`/`logo` across pages of the same site breaks that disambiguation.
- **Acceptance:**
  - `name`, `url`, `logo` populated with identical values sitewide
  - `logo.url` returns HTTP 200; image is at least 112×112px and legible on a white background
  - No fabricated `foundingDate`/`vatID`/etc. that doesn't match public record
- **Verify:** `curl -I <logo-url>` → `200`, plus an image-dimension check confirming the 112×112px floor
- **Reference:** `apps/web/src/lib/seo/seo-defaults.ts` → `orgConfigFromDefaults()`, consumed at `apps/web/src/app/layout.tsx:153`; hardcoded fallback in `organizationSchema()` (`packages/schema/src/builders/jsonld.tsx:151-212`) if the CMS is unreachable. `Organization` appears in `jsonLdTypes` on all 59 pages captured in `docs/seo/evidence/live-capture.json` (2026-07-29), confirming sitewide presence; `logo` dimension compliance and `sameAs` completeness were not checked against live property values in this pass.
- **Source:** [Tier 1] Google Search Central, "Organization (Organization) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/logo (last updated 2026-04-15 UTC)
- **Anti-patterns:** Declaring a different `Organization.name`/`logo` on different pages of the same site; fabricating commerce-specific sub-properties (`vatID`, `foundingDate`) that don't match public record.
- **CleanStart:** Partial

### SCHEMA-06 — `Article`/`NewsArticle`/`BlogPosting`: no required properties, but never fake freshness

- **Severity:** P1
- **Applies:** Blog, news, guide, knowledge-base, and resource detail pages
- **Rule:** Use exactly one of `Article`, `NewsArticle`, or `BlogPosting` per page — never more than one for the same content — with `headline`, `image`, `datePublished`, `dateModified`, and `author` populated. Google states verbatim: "There are no required properties; instead, add the properties that apply to your content" — but incomplete markup forfeits eligibility for the enhanced display those properties unlock.
- **Why:** `author.name` must contain only the person's name — no honorifics, job titles, or publisher name folded in — and every author shown on the page needs its own `author` entry, not a merged string. `dateModified` must reflect a real content change; setting it to the current date on every build or crawl regardless of whether content actually changed is a freshness-spoofing pattern Google's content-quality guidance treats as misleading.
- **Acceptance:**
  - `datePublished`/`dateModified` match the visibly-rendered dates on the page
  - `author.name` contains no titles or affiliations
  - At least one `image` meets Google's pixel-count/aspect-ratio guidance (at least 50,000 total pixels; 16:9, 4:3, and 1:1 variants recommended)
- **Verify:** Rich Results Test on one page per template; Search Console → "Article" / "Unparsable structured data" reports
- **Reference:** `docs/seo/evidence/live-capture.json` (2026-07-29 capture) confirms `BlogPosting` on `blogs/[slug]`, `NewsArticle` on `news/[slug]`, and `Article` on `guide/[slug]`, `knowledge-hub/[slug]`, and `resources/[slug]`; `author.name` formatting and `dateModified` accuracy against real edits were not checked at the field level in this pass.
- **Source:** [Tier 1] Google Search Central, "Article (Article, NewsArticle, BlogPosting) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC)
- **Anti-patterns:** Setting `dateModified` to the build/crawl date on every deploy regardless of actual content change; putting the publisher's name inside `author.name`.
- **CleanStart:** Partial

### SCHEMA-07 — `JobPosting`: required fields plus a hard expiry obligation

- **Severity:** P1
- **Applies:** Individual job-detail pages
- **Rule:** Publish `JobPosting` with `datePosted`, `description` (not a duplicate of `title`), `hiringOrganization.name`, `jobLocation` (at minimum `addressCountry`), and `title` (job title text only — no code, salary, or location folded in) on every open requisition — and remove or expire the markup the moment the requisition closes, by one of: setting `validThrough` to a past date, returning HTTP 404/410 for the page, or deleting the markup entirely.
- **Why:** Google ties data quality here to manual-action risk more directly than most other types, stating verbatim: "Failure to take timely action on expired jobs may result in a manual action." This is the one structured-data type in this module where staleness itself, not just missing fields, is the compliance risk.
- **Acceptance:**
  - Every live `JobPosting` has either a future `validThrough` or an active, still-open requisition
  - Every closed requisition returns 404/410, or carries zero `JobPosting` markup, within one recrawl cycle of closing
- **Verify:** Search Console → "Job Postings" rich-result report, checked for any closed-but-still-marked-up page
- **Reference:** `docs/seo/evidence/live-capture.json` (2026-07-29 capture) confirms `JobPosting` on `job/[slug]` (e.g. `job/senior-software-engineer`); the expiry-monitoring process (a scheduled diff of `validThrough`/requisition status against the CMS) was not located or verified in this pass.
- **Source:** [Tier 1] Google Search Central, "Job Posting (JobPosting) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/job-posting (last updated 2025-12-18 UTC)
- **Anti-patterns:** Leaving `JobPosting` markup live on a closed requisition "just in case"; embedding salary/location inside `title` instead of `baseSalary`/`jobLocation`.
- **CleanStart:** Partial

### SCHEMA-08 — `Product`: choose Product Snippet or Merchant Listing deliberately

- **Severity:** P1
- **Applies:** Conditional — only pages describing a purchasable or reviewable product (see C2, E-commerce)
- **Rule:** On a page where a shopper cannot directly buy (editorial/comparison content), target **Product Snippet** requirements: `Product.name` plus at least one of `review`, `aggregateRating`, or `offers` (`Offer.price` is required if `offers` is used). On a page where a shopper *can* buy, target the stricter **Merchant Listing** requirements: `Product.name`, `Product.image`, and `Product.offers` with `Offer.price` (greater than 0) and `Offer.priceCurrency` both required — quoted verbatim: "Only pages where a shopper can purchase a product are eligible for merchant listing experiences, not pages with links to other sites that sell the product." Reviews shown must not be self-authored by the entity being reviewed about its own `Organization`/`LocalBusiness` — self-served reviews are ineligible for the star rating feature.
- **Why:** Google's review-snippet guidance addresses "fake or undisclosed incentivized reviews" (added to the review-snippet doc as of the 2026-07-24 changelog entry) — the two problems are independent, so treating the guidance as "fake and undisclosed" would under-flag a review that is undisclosed-but-real, or fake-but-disclosed, since only the intersection of both conditions would trigger a check.
- **Acceptance:**
  - Merchant listing pages: `Offer.price` greater than 0 and `priceCurrency` populated on every offer
  - Reviews/ratings displayed are not self-authored by the reviewed entity, including via an embedded third-party widget
- **Verify:** Rich Results Test on a comparison page (expect Product Snippet eligibility) and a checkout-capable PDP (expect Merchant Listing eligibility)
- **Source:** [Tier 1] Google Search Central, "Product Snippet," https://developers.google.com/search/docs/appearance/structured-data/product-snippet (last updated 2025-12-10); "Merchant Listing," https://developers.google.com/search/docs/appearance/structured-data/merchant-listing; "Review Snippet (Review, AggregateRating)," https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24)
- **Anti-patterns:** Implementing Merchant Listing-grade markup on a page that only links out to a third-party seller — Google's eligibility is explicitly scoped to pages where the shopper can buy directly.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### SCHEMA-09 — JSON-LD is the syntax; never split one entity across Microdata and JSON-LD

- **Severity:** P2
- **Applies:** Always
- **Rule:** Implement structured data as JSON-LD in `<script type="application/ld+json">` blocks, not Microdata or RDFa. Never describe the same entity partly via Microdata attributes and partly via a separate JSON-LD block.
- **Why:** Google parses JSON-LD independent of the visible DOM, and can read it even when injected dynamically via JavaScript after initial load — a single script block is far less error-prone to generate and maintain at scale than markup interleaved with HTML attributes across the page.
- **Acceptance:**
  - A `script[type="application/ld+json"]` tag exists in the rendered DOM (post-JS) with `@context: https://schema.org`
  - No entity has some properties in Microdata and others in a separate JSON-LD block
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -c 'application/ld+json'` → at least `1`
- **Reference:** `apps/web/src/components/JsonLdGraph.tsx` emits `<script type="application/ld+json">` exclusively; no Microdata/RDFa attributes were found anywhere in the structured-data codebase audit.
- **Source:** [Tier 1] Google Search Central, "Intro to How Structured Data Markup Works," https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data (last updated 2025-12-10 UTC)
- **Anti-patterns:** Splitting one logical entity's properties across Microdata attributes and a separate JSON-LD block for the same entity — produces duplicate/conflicting node data for the same URL.
- **CleanStart:** Pass

### SCHEMA-10 — `BreadcrumbList`: at least two `ListItem`s; the SERP win is desktop-only since January 2025

- **Severity:** P2
- **Applies:** Always, on any page with a navigation hierarchy beyond the homepage
- **Rule:** Provide `BreadcrumbList.itemListElement` with at least two `ListItem` entries (`position`, `name`, and `item` on every entry except optionally the current page), reflecting the user's typical navigation path, not necessarily the literal URL path.
- **Why:** Google displays the breadcrumb trail in the SERP snippet in place of the URL — but only on **desktop**: as of 2025-01-23 Google stopped showing the breadcrumb trail in mobile search snippets, replacing it with a domain-only display. No markup change is required for this shift, but it changes the feature's practical value to desktop-only; Search Console's breadcrumb rich-result report remains active.
- **Acceptance:**
  - At least two `ListItem` entries, with sequential `position` values starting at 1
  - `name` values match the visible on-page breadcrumb trail text, not raw URL path segments
- **Verify:** Search Console → "Breadcrumbs" rich-result status report, filtered to desktop
- **Reference:** `docs/seo/evidence/live-capture.json` (2026-07-29 capture) shows `BreadcrumbList` present on every detail template and on the `blogs`, `careers`, `case-studies`, `guide`, and `resource-center` listing pages, but absent from the `events`, `news`, and `webinars` listing templates.
- **Source:** [Tier 1] Google Search Central, "Breadcrumb (BreadcrumbList) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (last updated 2025-12-10 UTC). Mobile-display change: Google Search Central Blog, "Simplifying the visible URL element on mobile search results," https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs (2025-01-23; full body could not be rendered in research — the "desktop unaffected / no action required" claim is corroborated by independent trade-press summaries, [Tier 4], not the primary post body directly)
- **Anti-patterns:** Encoding raw URL path segments as `name` values instead of the human-readable labels shown on the page.
- **CleanStart:** Partial

### SCHEMA-11 — `FAQPage` no longer produces a rich result for any site

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not implement `FAQPage` markup expecting a visible Google SERP feature. As of **2026-05-07** the FAQ rich result stopped appearing in live Google Search results for any site type — not only the non-authoritative sites the 2023 restriction had already excluded.
- **Why:** Timeline, per the Google Search Central changelog (`developers.google.com/search/updates`): **2023-09-14** — eligibility first restricted to well-known, authoritative government and health sites. **2026-05-08** — an explicit deprecation notice was added, stating the feature "will no longer appear in Google Search starting May 7, 2026." **2026-05-07** — the FAQ rich result stopped appearing. **2026-06-15** — the FAQPage documentation page was retired; requesting the old URL now returns a **301 redirect** to the Search Central changelog's FAQ-removal entry (`#removing-faq-rich-result`), not a 404 and not a full removal. Note: the unrelated 2025-06-12 deprecation-banner batch (Book actions, Course info, Estimated salary, ClaimReview, Learning video, Special announcement, Vehicle listing — see SCHEMA-12) did **not** include FAQPage; an earlier pass of this research conflated the two timelines, and that conflation is corrected here.
- **Acceptance:**
  - No reporting or forecasting relies on FAQPage rich-result CTR
  - Existing legacy `FAQPage` markup, if present, is understood as harmless-but-valueless, not actively harmful — there is no manual-action risk from simply having it
- **Verify:** Rich Results Test against a page carrying `FAQPage` markup returns no FAQ rich-result preview
- **Reference:** `docs/seo/evidence/live-capture.json` (2026-07-29 capture) shows `FAQPage` still emitted live on the home page and on `guide/[slug]` detail pages — not harmful per Google's own guidance, but a cleanup candidate given it confers no display benefit.
- **Source:** [Tier 1] Google Search Central changelog and blog, dated as above: https://developers.google.com/search/updates
- **Anti-patterns:** Spending engineering effort implementing new `FAQPage` markup purely for SERP appearance; citing the 2025-06-12 changelog banner as covering FAQPage — it doesn't (see SCHEMA-12).
- **CleanStart:** Partial

### SCHEMA-12 — `HowTo` and the June/November 2025 retirement batch: do not implement for Google

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not implement `HowTo`, Book actions, Course info, Estimated salary, ClaimReview, Learning video, Special announcement, Vehicle listing, or Practice problem structured data expecting any Google rich result — all are retired. `Dataset` structured data should only be implemented for Google Dataset Search specifically; it never fed general web Search.
- **Why:** `HowTo` was removed from both desktop and mobile search results as of the 2023-09-14 changelog entry. The June 2025 "simplifying the search results page" initiative added deprecation banners (2025-06-12) to Book actions, Course info, Estimated salary, ClaimReview, Learning video, Special announcement, and Vehicle listing; Search Console rich-result reporting, the Rich Results Test, and Search-appearance filter support for that batch were removed starting **2025-09** — not 2026-01, which is a separate, later schedule applying only to **Practice problem** (its own deprecation banner was added 2025-11-05, with its tooling-support removal following in 2026-01). All are confirmed absent from the current Search Gallery (last updated 2026-06-15).
- **Acceptance:**
  - No new build implements any type in this list expecting Google rich-result value
  - Any pre-existing implementation is not counted on in CTR/impression forecasting
- **Verify:** Rich Results Test returns no preview for any URL carrying `HowTo` or any type from the batch above
- **Reference:** `docs/seo/evidence/live-capture.json` (2026-07-29 capture) shows no page emitting `HowTo` or any type from the retired batch.
- **Source:** [Tier 1] Google Search Central changelog, 2023-09-14, 2025-06-12, and 2025-11-05 entries; Google Search Central Blog, "Simplifying the search results page," https://developers.google.com/search/blog/2025/06/simplifying-search-results (feature list and dates confirmed via the changelog; the specific "not commonly used... no longer providing significant value" rationale sentence is [Tier 4] corroboration only, not independently re-confirmed against the primary post's raw HTML)
- **Anti-patterns:** Assuming "Book actions was un-deprecated in November 2025" — this circulates on lower-tier blogs but **no Tier 1 or Tier 2 source confirms it**; treat it as unverified and re-check before relying on it.
- **CleanStart:** Pass

### SCHEMA-13 — Validate with the right tool for the right question

- **Severity:** P2
- **Applies:** Always, once per template as part of the pre-launch and post-change checklist
- **Rule:** Use the **Rich Results Test** to check Google-specific rich-result eligibility, and the **Schema Markup Validator** to check generic schema.org syntax validity — they check different things and are not interchangeable. Run both once per template (not per page), before launch and after any change to the JSON-LD builder code.
- **Why:** The Rich Results Test checks markup against Google's own required/recommended property rules per feature and previews which rich-result types the page's structured data would be eligible to generate; it does not guarantee display. The Schema Markup Validator validates any schema.org-vocabulary markup against the schema.org type/property model with no Google-specific feature warnings. Markup can be perfectly valid schema.org and still Google-ineligible, or vice versa in rare cases.
- **Acceptance:**
  - Every template passes the Rich Results Test with zero errors for its target feature type
  - Every template separately passes the Schema Markup Validator with zero schema.org-level errors
- **Verify:** Re-run both tools against every template after any change to the JSON-LD builder code
- **Tools:** Rich Results Test (`search.google.com/test/rich-results`); Schema Markup Validator (`validator.schema.org`)
- **Reference:** `apps/cms/src/payload/admin/components/SchemaManager/SchemaPreviewField.tsx:214` validates against the CMS's own dispatcher (SCHEMA-03), not against the live page — do not mistake that preview passing for a live-page validation pass.
- **Source:** [Tier 1] Google Search Central, tool descriptions cross-referenced from https://developers.google.com/search/docs/appearance/structured-data and the Rich Results Test tool page itself; Schema.org, `validator.schema.org`
- **Anti-patterns:** Citing Google's General Structured Data Guidelines page as the source for "use the Schema Markup Validator" — that page never mentions the tool by name; cite schema.org's own validator page instead.
- **CleanStart:** Unverified — no recorded per-template Rich Results Test or Schema Markup Validator run was found in this pass.

### SCHEMA-14 — Gate the shared schema library's own test suite in CI, not just its consuming app's suite

- **Severity:** P2
- **Applies:** Always, for any site whose structured-data primitives live in a package shared by more than one app
- **Rule:** If structured-data builders, composition, or validation logic is factored into a shared package consumed by multiple apps, that package's own test suite must be invoked by at least one CI job — a green test run in a consuming app does not imply the shared package's own tests ran.
- **Why:** A regression in shared structured-data logic is invisible to CI if every workflow scopes `test` to a single package and no workflow, nor the root task graph, reaches across to the shared package's own test script.
- **Acceptance:**
  - At least one CI workflow step runs the shared schema package's own test command
  - If a monorepo task runner (e.g. Turborepo) is used as the CI entry point, its `test` task depends on `^test` — not only `^build` — so a shared package's tests execute as part of every consuming app's pipeline
- **Verify:** `grep -rn "schema" .github/workflows/*.yml | wc -l` → non-zero
- **Reference:** `packages/schema/package.json` defines its own `"test": "vitest run"` script; `apps/web/vitest.config.ts:11` scopes to `apps/web/src/**` only; `.github/workflows/web.yml:79-83` and `ci.yml:95-96` each invoke only their own package's test script; `turbo.json`'s `test` task depends only on `^build`, not `^test`.
- **Source:** Convention — not vendor-confirmed
- **Anti-patterns:** Treating "the shared package has its own `test` script and passes locally" as equivalent to "CI enforces it" — a script that exists but is never invoked provides no regression protection.
- **CleanStart:** Fail

---

## P3 — hygiene, marginal or speculative gain

### SCHEMA-15 — Pin awareness of the schema.org release your validator targets

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not assume a property from the bleeding-edge schema.org release is safe for Google rich results just because it validates. Cross-check any newly-adopted property against Google's specific rich-result documentation, not schema.org alone.
- **Why:** Schema.org publishes sequential major.minor releases via an open, GitHub-driven community process, with new work staged before merging; Google's rich-result docs consume only a subset of the vocabulary and layer their own required/recommended rules on top — schema.org validity does not imply Google eligibility.
- **Acceptance:**
  - The schema.org release referenced by internal tooling/docs is current (30.0, dated 2026-03-19, at time of writing — check `https://schema.org/version/latest`)
  - A property used in production resolves on `https://schema.org/<PropertyName>` without a "pending"/proposal-only flag
- **Verify:** Fetch `https://schema.org/version/latest` and confirm the version/date; cross-check any new property against its Google feature doc before shipping
- **Source:** [Tier 1] Schema.org, "Releases," https://schema.org/docs/releases.html
- **Anti-patterns:** Using a term that validates cleanly in the Schema Markup Validator but has no corresponding Google feature doc, then expecting a rich result from it.
- **CleanStart:** Unverified — no audit of whether newly-added properties are checked against the current schema.org release before use was performed in this pass.

### SCHEMA-16 — `WebSite` node is safe to keep; do not build new Sitelinks Searchbox markup

- **Severity:** P3
- **Applies:** Always
- **Rule:** A `WebSite` node with `name` and `url` is low-risk and fine to keep. Do not implement `SearchAction`/sitelinks-searchbox markup expecting a search box in Google results — the feature is retired.
- **Why:** Google's changelog states verbatim: "Removed the sitelinks search box documentation and archived the `nositelinkssearchbox` rule. The sitelinks search box feature is no longer available in Google Search results." If legacy `SearchAction` markup remains from a prior implementation it is harmless (no manual-action risk) but produces no visible feature.
- **Acceptance:**
  - No new `SearchAction` markup is added expecting a SERP feature
  - Existing `SearchAction` markup, if any, is understood as inert, not a defect requiring urgent removal
- **Verify:** Rich Results Test will not report a sitelinks-searchbox result for any URL — the feature is absent from the current Search Gallery listing
- **Reference:** `webSiteSchema()` in `packages/schema` emits only `name`/`url`; no `SearchAction`/`potentialAction` markup was found anywhere in the codebase audit.
- **Source:** [Tier 1] Google Search Central changelog, entry dated 2024-11-29, referencing removal from https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
- **Anti-patterns:** Spending engineering time building or maintaining `SearchAction` markup under the belief it still affects SERP appearance.
- **CleanStart:** Pass

### SCHEMA-17 — Bare `WebPage` is connective tissue, not an eligibility trigger

- **Severity:** P3
- **Applies:** Whenever `WebPage`-specific properties (`breadcrumb`, `primaryImageOfPage`, `isPartOf`, `speakable`, `lastReviewed`) are needed, or when linking a page into the site graph
- **Rule:** Explicit `WebPage` declaration is only worth doing to attach `WebPage`-specific properties or to link a page into the graph via `isPartOf` → `WebSite`. There is no dedicated Google rich-result feature keyed on the bare `WebPage` type.
- **Why:** Every web page is implicitly a `WebPage` in schema.org's model; Google does not publish a "WebPage structured data" guide the way it does for Article or Product (the URL pattern 404s, confirmed directly). `WebPage`'s value is entirely as a graph-linking node for types that do have Google features (Breadcrumb, Article, Speakable) — not as something that itself "unlocks" a result.
- **Acceptance:**
  - If declared, `WebPage.isPartOf` resolves to the site's `WebSite` `@id`
  - `WebPage.@id` is referenced consistently from any child entity (e.g. `Article.mainEntityOfPage`)
- **Verify:** Schema Markup Validator confirms syntactic validity — there is no Google-specific pass/fail signal for bare `WebPage`, so this is a schema.org-level check only
- **Reference:** `WebPage` and its variants (`AboutPage`, `ContactPage`, `ProfilePage`) are emitted via `getPageGraph`/`webPageSchema`, keyed by the CMS-set `webPageType` and referencing the `WebSite` `@id` — matching the connective-tissue role described here.
- **Source:** [Tier 1] Schema.org, "WebPage," https://schema.org/WebPage (absence of a dedicated Google rich-result doc confirmed by direct 404 on `developers.google.com/search/docs/appearance/structured-data/webpage`)
- **Anti-patterns:** Treating `WebPage` markup itself as something that "unlocks" a rich result — it doesn't.
- **CleanStart:** Pass
