# E-Commerce SEO — Evidence Source Document (Conditional Module)

> **CONDITIONAL MODULE — NOT VALIDATED AGAINST A WORKING IMPLEMENTATION.**
> CleanStart (the reference site this SOP otherwise draws from) is a B2B software marketing site with no storefront, no product-detail pages, no cart, and no Merchant Center feed. Every rule in this module rests on vendor/spec documentation alone — none of it has been exercised against a live e-commerce build in this codebase. Before applying this module to a real storefront, re-verify each citation is still current (this domain moves fast — see the flagged changes below) and pilot the markup on a small page set before rolling out site-wide.

Research conducted 2026-07-29. Scope: `Product` structured data and the merchant-listing vs. product-snippet distinction; `Offer`/`AggregateOffer` price and availability semantics and freshness; review/rating markup and self-serving-review rules; variant handling (`ProductGroup`, `hasVariant`); Merchant Center feeds and their relationship to declared markup; canonicalization across product variants; out-of-stock/discontinued handling and URL disposition; faceted navigation and parameter handling; category-listing pagination; `ItemList` for category pages; image requirements for product results; the Shopping Graph and automated extraction vs. declared markup.

**Tier definitions used below (per task brief):**
- **Tier 1** — Google Search Central structured-data docs, Schema.org, Merchant Center Help, Bing Webmaster Tools.
- **Tier 2** — first-party platform docs (none independently needed beyond Tier 1 for this scope; flagged inline where a claim only reaches Tier 2 strength).
- **Tier 3** — named, dated empirical study (none found that met sourcing bar for a load-bearing rule; used only as corroboration where noted).
- **Tier 4** — practitioner consensus, explicitly labeled `Convention — not vendor-confirmed`, used only where Google/Schema.org/Merchant Center is silent.

Total requirements documented below: **22** discrete testable rules across 14 sections.
Source split: **17 Tier 1** citations (Google Search Central + Schema.org + Merchant Center Help), **1 Tier 1 (Bing)** supporting note, **4 Tier 4** conventions (all explicitly flagged, none load-bearing for eligibility claims).
Required-vs-recommended split for `Product`/`Offer` markup specifically: **7 required properties** (`name`, `image`, `offers.price`, `offers.priceCurrency`, `offers.availability`, plus `offers` itself and the direct-seller constraint) against **~20 recommended** properties across `Product`, `Offer`, `ProductGroup`, and `MerchantReturnPolicy` combined. See §1 and §2 for the exact partition — this is the single most commonly over-implemented area in e-commerce SEO advice, per the framing brief.

---

## 1. `Product` structured data — the merchant-listing vs. product-snippet split

**Rule:** Before writing any Product markup, classify each page as either a **merchant listing** (a page where the shopper can directly buy the product from you) or a **product snippet** (an editorial/informational page — a review, a roundup, a comparison — where no direct purchase happens on that page), and implement the corresponding required-property set; do not treat "Product structured data" as one undifferentiated spec.

**Mechanism:** Google Search Central states there are "two main classes of product structured data": merchant listings unlock the Shopping-tab experiences (Shopping Knowledge Panel, Popular Products, Google Images/Lens shopping surfaces) and require `Offer` markup because a transaction can happen on the page; product snippets unlock the plain-text-result price/rating/availability enhancements and additionally support `positiveNotes`/`negativeNotes` (pros/cons) for editorial reviews, a feature merchant listings do not get. Google is explicit that "only pages where a shopper can purchase a product are eligible for merchant listing experiences, not pages with links to other sites that sell the product" — i.e., an affiliate/aggregator page that links out to retailers is a product-snippet page, not a merchant listing, no matter how complete its `Offer` markup is.

**Required properties:**
- *Merchant listing:* `name`; `image` (see §11); `offers` (an `Offer` object) with `offers.price` (or `priceSpecification.price`), `offers.priceCurrency`, and `offers.availability` populated — this is the same required set the Merchant Center "automatic item updates" feature keys off (§5). The direct-seller constraint above is a structural/eligibility requirement, not a schema property.
- *Product snippet:* `name`, plus **at least one of** `review`, `aggregateRating`, or `offers`.
- Google states verbatim for the parent `Product` type: "There are no required properties; instead, add the properties that apply to your organization" (this phrasing is copy-pasted from Organization docs into several Google structured-data pages verbatim, including Product) — the actual required floor lives on the two child pages, not the intro page.

**Recommended properties (not required, do not gate eligibility):** `aggregateRating`, `brand.name`, `category`, `description`, `gtin`/`sku`, `review`, `itemCondition`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy`, `url`.

**Acceptance criterion:** For a merchant-listing page, the Rich Results Test reports the page eligible for "Merchant listings" with no missing-required-field errors; for a product-snippet page, the same tool reports eligibility for "Product snippets" using only `name` + one of `review`/`aggregateRating`/`offers`. A page attempting merchant-listing eligibility without a direct purchase path on that URL will not gain merchant-listing eligibility regardless of markup completeness.

**Verification method:** Run `https://search.google.com/test/rich-results?url=<page>` and read the reported item type (Merchant listing vs. Product snippet) and its required/recommended field breakdown; cross-check in Search Console → Enhancements → "Merchant listings" or "Product snippets" report (these are separate reports per Google's 2022 changelog, see §5).

**Source:** Google Search Central, "Intro to Product Structured Data on Google," https://developers.google.com/search/docs/appearance/structured-data/product. **Tier 1.** Merchant-listing required set: Google Search Central, "How To Add Merchant Listing Structured Data," https://developers.google.com/search/docs/appearance/structured-data/merchant-listing. **Tier 1.** Product-snippet required set + pros/cons: Google Search Central, "How To Add Product Snippet Structured Data," https://developers.google.com/search/docs/appearance/structured-data/product-snippet (last updated 2025-12-10 UTC). **Tier 1.**

**Anti-pattern:** Implementing full `Offer` markup (price, availability, shipping) on an affiliate/comparison page and expecting merchant-listing features (Popular Products, Shopping Knowledge Panel) — the page-type constraint ("shopper can purchase directly") is not overridable by markup completeness. Conversely, implementing only product-snippet-tier markup (no `offers.availability`) on a real storefront PDP forfeits the richer Shopping-tab surfaces entirely.

---

## 2. `Offer` and `AggregateOffer` — price, availability, and condition semantics

**Rule:** Every `Offer` used for merchant-listing eligibility must carry `price` (or `priceSpecification.price`), `priceCurrency` (ISO 4217, e.g. `"USD"`), and `availability` (an `ItemAvailability` enum value); use `AggregateOffer` instead of a single `Offer` only when the *same* product is genuinely sold by multiple distinct sellers at different prices, not as a generic wrapper for one seller's single price.

**Mechanism:** `Offer` (schema.org: `Thing > Intangible > Offer`) represents one seller's specific terms for one item; `AggregateOffer` (`Thing > Intangible > Offer > AggregateOffer`, itself a subtype of `Offer`) rolls up "multiple offers that all share the same defined businessFunction value" — schema.org's own canonical example is the same physical product (a monitor, in one version of the docs; shoes in another) sold by several merchants, surfaced via `lowPrice`, `highPrice`, `offerCount`, and a nested `offers` array of the individual `Offer`s. `Discontinued`, `OutOfStock`, `BackOrder`, `InStock`, `InStoreOnly`, `LimitedAvailability`, `MadeToOrder`, `OnlineOnly`, `PreOrder`, `PreSale`, `Reserved`, and `SoldOut` are the full current `ItemAvailability` enumeration — pick the value that matches actual fulfillment state, not just a binary in-stock/out-of-stock split.

**Required properties (Offer):** `price`, `priceCurrency`, `availability`. Google's Merchant Center docs add a fourth as required specifically for the automatic-item-update feature (§5): `condition` (mapped from `itemCondition`).

**Recommended properties (Offer):** `itemCondition` (when not driving automatic updates), `priceValidUntil`, `validFrom`, `shippingDetails`, `hasMerchantReturnPolicy`, `url`, `seller`.

**Required properties (AggregateOffer):** none uniquely documented beyond inheriting `Offer`'s constraints on each nested offer; in practice populate `lowPrice`, `highPrice`, `offerCount` for it to be useful, but Google's Product docs do not gate a specific rich-result feature on these three the way they gate merchant-listing eligibility on plain `Offer.price`/`priceCurrency`/`availability`.

**Freshness expectation:** Google states plainly: "Your listing may not display if the `priceValidUntil` property indicates a past date" — a stale/expired `priceValidUntil` is a documented, testable failure mode, not a vague "keep it fresh" suggestion. Google separately warns that markup injected dynamically via JavaScript "can make Shopping crawls less frequent and less reliable, which can be an issue for fast-changing content like product availability and price," and recommends putting `Product` structured data in the initial server-rendered HTML for merchants optimizing for all Shopping surfaces.

**Acceptance criterion:** `offers.priceCurrency` matches a valid ISO 4217 code; `offers.availability` resolves to one of the twelve enum values above and matches the page's actual fulfillment state; if `priceValidUntil` is present, its date is in the future at crawl time; for multi-currency catalogs, each currency has "a distinct URL... one per currency" (Google's own multi-currency example).

**Verification method:** Rich Results Test on the PDP; for freshness, diff `priceValidUntil` against current date in a scheduled check; for JS-injection risk, `curl -s <url>` (no JS execution) and confirm the `Offer` block is present in the raw HTTP response, not only in the client-rendered DOM.

**Source:** Schema.org, "Offer," https://schema.org/Offer. **Tier 1.** Schema.org, "AggregateOffer," https://schema.org/AggregateOffer. **Tier 1.** Schema.org, "ItemAvailability," https://schema.org/ItemAvailability. **Tier 1.** Freshness/JS-injection quotes: Google Search Central, "How To Add Merchant Listing Structured Data," https://developers.google.com/search/docs/appearance/structured-data/merchant-listing. **Tier 1.**

**Anti-pattern:** Wrapping a single seller's single-price `Offer` in an `AggregateOffer` purely out of habit (common in generated/templated schema output) — this adds a layer of indirection Google does not require and can make `lowPrice`/`highPrice` degenerate to the same value, which is a signal of templated rather than genuine multi-seller data. Also: shipping fast-changing price/availability data only via client-side JS render, then being surprised Shopping crawls under-report it — Google names this exact failure mode.

---

## 3. Review and rating markup — required properties and the current self-serving-reviews rule

**Rule:** Mark up `Review`/`AggregateRating` only for reviews of the *product itself*, never for reviews of your own business/organization published on your own domain; the latter is now explicitly ineligible regardless of markup correctness.

**Required properties (Review):** `author` (Person or Organization); `reviewRating` (a `Rating` object) with `reviewRating.ratingValue`; and either the review is nested inside the reviewed item or `itemReviewed`/`itemReviewed.name` is present.

**Required properties (AggregateRating):** either nested inside the reviewed item or `itemReviewed`/`itemReviewed.name` present; **at least one of** `ratingCount` or `reviewCount`; `ratingValue`.

**Recommended properties:** `bestRating` (defaults to 5 if omitted), `worstRating` (defaults to 1 if omitted), and for individual `Review`, `datePublished`.

**Self-serving-reviews rule (materially changed within the last 24 months — flag this):** Google's review-snippet page states: "If the entity that's being reviewed controls the reviews about itself, their pages that use `LocalBusiness` or any other type of `Organization` structured data are ineligible for [the] star review feature." This applies whether the self-review is in direct markup or via an embedded third-party widget on the reviewed entity's own site. **This page was last updated 2026-07-24 UTC — five days before this research was conducted** — and independent trade coverage from the same week corroborates that Google added explicit language prohibiting "fake or undisclosed incentivized reviews" in the same update. Product reviews on a genuine product-detail page (marked up with `Review`/`AggregateRating` nested under `Product`, not `Organization`) remain eligible — the restriction is specifically about an entity reviewing itself as an `Organization`/`LocalBusiness`, not about product reviews in general.

**Minimum review count:** Google's docs do not state a numeric minimum for `AggregateRating` eligibility — do not invent a "you need N reviews" threshold; the actual gate is data completeness (`ratingValue` + one of `ratingCount`/`reviewCount`) and genuineness, not volume.

**Rating scale:** default is 1–5; any other scale requires explicit `bestRating`/`worstRating`. Decimal values must use a dot (`"4.4"`), not a comma — Google notes sites already using comma-separated decimals remain eligible for now, but dot notation is the documented standard going forward.

**Acceptance criterion:** No `Review`/`AggregateRating` node is nested under an `Organization`/`LocalBusiness` type that represents the page's own operator; every `Review`/`AggregateRating` node resolves `itemReviewed` to a `Product` (or other non-self entity); `ratingValue` falls within `[worstRating, bestRating]` (default `[1,5]`); at least one of `ratingCount`/`reviewCount` is present and non-zero.

**Verification method:** Grep the site's JSON-LD output for `"@type":"AggregateRating"` or `"@type":"Review"` and check the parent node's `@type` is not `Organization`/`LocalBusiness` representing the operator itself; Rich Results Test; Search Console → "Review snippets" report for manual-action or eligibility warnings.

**Source:** Google Search Central, "Review Snippet (Review, AggregateRating) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24 UTC). **Tier 1.**

**Anti-pattern:** Embedding a third-party trust-badge widget (Trustpilot-style) that injects `AggregateRating` markup describing your own company as an `Organization`, then expecting a star rating in your own SERP snippet — this is the exact pattern the July 2026 update closes off. Also: fabricating `ratingCount`/`reviewCount` to appear more established — this is a structured-data policy violation independent of the self-serving-review rule (see §14).

---

## 4. Variant handling — `ProductGroup`, `hasVariant`, `isVariantOf`, `variesBy`

**Rule:** When a product exists in multiple variants (size, color, material), model it as a `ProductGroup` with each variant as a nested/linked `Product`, connected bidirectionally via `hasVariant` (group → product) and `isVariantOf` (product → group), and declare which attributes distinguish the variants via `variesBy`.

**Mechanism:** Google added structured-data support for this pattern in **February 2024** (within scope's "actively changing" area, though now over 24 months old as of this research date). Before this, sites had no standard way to tell Google that several distinct Product pages/entries were variants of one underlying item; Google's stated goal was to "provide better product information for shoppers" and let variant-bearing pages display richer variant pickers in merchant listing experiences. `ProductGroup` is not itself sold — it's described as a template/prototype standing in for its member variants, letting shared properties (brand, aggregate rating) live once at the group level instead of being duplicated on every variant.

**Required properties (ProductGroup):** `name`. That is the only property Google's docs mark required for the group node itself.

**Recommended properties (ProductGroup):** `aggregateRating`, `brand`, `description`, `hasAdultConsideration` (if applicable), `hasVariant`, `productGroupID`, `review`, `url` (single-page sites only — the base URL without variant selectors), `variesBy` (values include `color`, `size`, `material`, `pattern`, `suggestedAge`, `suggestedGender`, or a reference to the varying property itself).

**Structural pattern:** two supported architectures — (a) **single-page**: one URL renders the group plus all variants, `ProductGroup.url` is that one URL, and `hasVariant` nests each `Product` inline; (b) **multi-page**: each variant has its own URL/page and declares `isVariantOf` pointing back to the shared `productGroupID`/group `@id` — each page's markup must be self-contained (fully valid on its own), it cannot rely on the group page's markup to complete it.

**`productGroupID`:** must uniquely identify the group and match exactly across every variant's `inProductGroupWithID` (or nested reference) — Google calls this the "parent SKU."

**Acceptance criterion:** Every variant `Product` under a `ProductGroup` shares the identical `productGroupID` value; `variesBy` lists only the properties that actually differ between the variant `Product` nodes (e.g., if all variants share one `brand`, `brand` should not appear in `variesBy`); for multi-page implementations, each variant page's markup validates independently without needing the parent page's markup merged in.

**Verification method:** Rich Results Test on both the group page (if single-page architecture) and at least two variant pages (if multi-page); confirm `productGroupID` string-matches across the set via a grep of the site's rendered JSON-LD.

**Source:** Google Search Central, "Product Variant Structured Data (ProductGroup, Product)," https://developers.google.com/search/docs/appearance/structured-data/product-variants (last updated 2026-05-20 UTC). **Tier 1.** Announcement: Google Search Central Blog, "Adding structured data support for Product Variants," https://developers.google.com/search/blog/2024/02/product-variants (2024-02). **Tier 1.** Schema.org, "ProductGroup," https://schema.org/ProductGroup. **Tier 1.**

**Anti-pattern:** Publishing each color/size variant as a fully independent `Product` with no `ProductGroup`/`isVariantOf` link at all — Google can still index each page, but loses the ability to consolidate them into one richer variant-picker result and may instead treat them as competing near-duplicate entries. Also: letting `productGroupID` values drift (e.g., a CMS re-generating IDs per import) — this silently breaks the variant linkage without producing a validation error on any single page.

---

## 5. Merchant Center feeds and their relationship to declared structured data

**Rule:** Treat an on-page `Product`/`Offer` markup and a Merchant Center product feed as two inputs to the same catalog, not as redundant or competing systems — Google explicitly recommends "providing both structured data on web pages and a Merchant Center feed" to "maximize your eligibility to experiences and help Google correctly understand and verify your data," and warns that when the two sources contradict each other, Google "deprioritizes" the data rather than picking one arbitrarily (this specific contradiction-handling claim is corroborated in practitioner writeups but the "deprioritizes both" phrasing itself was not found verbatim on a Google-owned page in this research pass — treat that exact framing as **Tier 4 corroboration** of an otherwise **Tier 1** general recommendation to keep both sources consistent).

**Mechanism — "automatic item updates":** Merchant Center's automation feature "keeps your product data accurate by automatically using your landing page data to update your product data," specifically for `price`, `sale price`, `availability`, and `condition`. Google states verbatim: "Specifying the following schema.org values is required for automatic item updates: `price`, `priceCurrency`, `availability` and `condition`" — this is a narrower, feed-specific required set distinct from the general merchant-listing requirement in §1 (which does not require `condition`). The feature can override the feed: Google's own example states that if a feed lists a product at £4 but the landing page's markup says £3, "we'll update the product to £3 in your ads or product listings" — i.e., on-page markup can silently win over the uploaded feed for these four properties when automation is enabled.
**Eligibility without a feed:** As of Google's September 2022 changelog, merchants can qualify for merchant-listing experiences (Search Console's "Merchant listings" report, Popular Products, Shopping Knowledge Panel) using Product structured data alone, with **no Merchant Center account required** — the feed is additive, not a hard prerequisite for basic eligibility.

**Acceptance criterion:** Feed values for `price`/`availability`/`condition` match the corresponding on-page `Offer` values at any given time (a scheduled diff check, not a one-time audit, given automation can silently overwrite the feed); if automatic item updates are enabled, the four trigger properties (`price`, `priceCurrency`, `availability`, `condition`) are present in server-rendered HTML, not only client-injected.

**Verification method:** Compare a sample of feed rows against `curl`'d PDP markup for the same product IDs; Merchant Center diagnostics for "automatic item updates" activity log; Search Console "Merchant listings" report for markup-only (feed-less) eligibility status.

**Source:** Google Search Central, "Intro to Product Structured Data on Google," https://developers.google.com/search/docs/appearance/structured-data/product. **Tier 1.** Google Merchant Center Help, "Set up structured data for Merchant Center," https://support.google.com/merchants/answer/7331077?hl=en. **Tier 1.** Google Merchant Center Help, "Allow Merchant Center to update product information automatically," https://support.google.com/merchants/answer/12157888?hl=en-GB. **Tier 1.** Eligibility-without-a-feed: Google Search Central Blog, "New Search Console Merchant Listings report: expanding eligibility with Product structured data," https://developers.google.com/search/blog/2022/09/merchant-listings (2022-09). **Tier 1.**

**Anti-pattern:** Manually correcting a pricing error in the Merchant Center feed while leaving stale on-page markup unfixed — if automatic item updates is on, Google may silently revert the feed to match the stale page. Also: assuming a Merchant Center account is mandatory for any Shopping-surface visibility — it is not, per the 2022 changelog.

---

## 6. Canonicalization across product variant URLs

**Rule:** When variant selection (color/size) or filter/sort state changes the URL, designate one canonical URL per genuinely distinct product using `rel="canonical"` and/or redirects — never rely on `noindex`, robots.txt, or sitemap-inclusion alone to do this job, and never point two different canonicalization mechanisms at two different URLs for the same page.

**Mechanism:** Google's canonicalization doc lists "ecommerce product variants" by name as one of the standard "site functions" reasons duplicate content exists, alongside sort/filter parameters and tracking-parameter variants. Google ranks its canonicalization signals by strength: redirects and `rel="canonical"` are both "a strong signal," while sitemap inclusion is only "a weak signal that helps." Google explicitly instructs: "Don't specify different URLs as canonical for the same page using different canonicalization techniques (for example, don't specify one URL in a sitemap, but a different URL for that same page using `rel="canonical"`)." Internal linking should also point at the canonical URL, not a duplicate variant URL, to avoid diluting the consolidation signal.

**Product-variant-specific nuance (from §4):** for **single-page** variant architectures, the `ProductGroup.url` recommended property is explicitly "for single-page sites only" — i.e., the canonical URL and the `ProductGroup` URL should be the same value. For **multi-page** variant architectures (each variant gets its own URL), each of those URLs is its own canonical — you are not meant to canonicalize every variant page back to one URL, since Google's variant-page markup pattern (§4) depends on each variant page being independently valid and indexable.

**Acceptance criterion:** Every parameterized/variant-selector URL either 301s to, or carries a `rel="canonical"` pointing at, exactly one URL; that same URL is the one listed in the sitemap; no variant URL is canonicalized to a different target than what its sitemap entry or redirect chain implies.

**Verification method:** `curl -sI <variant-url>` to check for redirects; `curl -s <variant-url> | grep -o 'rel="canonical"[^>]*'` to extract the declared canonical; cross-check against the sitemap entry for the same logical product; URL Inspection tool in Search Console to confirm Google's "user-declared canonical" matches "Google-selected canonical."

**Source:** Google Search Central, "How to Specify a Canonical with rel='canonical' and Other Methods," https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls (last updated 2026-07-10 UTC). **Tier 1.** Single-page/multi-page variant-URL nuance: Google Search Central, "Product Variant Structured Data," https://developers.google.com/search/docs/appearance/structured-data/product-variants. **Tier 1.**

**Anti-pattern:** Canonicalizing every color/size variant page back to one "parent" URL while still expecting each variant to independently rank/display in Shopping-surface results with its own price and availability — this contradicts the multi-page variant pattern in §4, which requires each variant page to be self-contained and independently indexable.

---

## 7. Out-of-stock and discontinued products — availability status and URL disposition

**Rule (Tier 1 portion):** Reflect the true fulfillment state via the `ItemAvailability` enum (`OutOfStock`, `BackOrder`, `Discontinued`, `PreOrder`, etc. — see §2) rather than leaving stale `InStock` markup on a page that can no longer fulfill orders; Google's general structured-data policy requires "up-to-date information" and states plainly it "won't show a rich result for time-sensitive content that is no longer relevant."

**Gap — what Google does NOT specify (flag this explicitly):** Neither Google Search Central nor Merchant Center Help, in the pages reviewed for this research, states a rule for **what to do with the URL itself** once a product is out of stock or discontinued (keep it live and indexable, redirect it, or let it 404). This is a real, commonly-needed decision and the primary sources are silent on it.

**Convention — not vendor-confirmed (Tier 4, use only as a fallback when no Tier 1 guidance exists):** Practitioner consensus across multiple SEO vendor writeups converges on a value-based decision tree: (a) **temporarily** out-of-stock — keep the page live, set `availability` to `OutOfStock`/`BackOrder`/`PreOrder` as accurate, and optionally add a restock-notify mechanism; do not 404 or redirect a temporary stockout. (b) **permanently discontinued** with accumulated backlinks/organic traffic/rankings — 301-redirect to the nearest relevant surviving page (parent category or successor product), so link equity consolidates rather than evaporates. (c) **permanently discontinued** with no meaningful traffic or backlink value — allowing a 404 (or 410) is acceptable; verify "no value" via Search Console/analytics before deciding, rather than assuming.

**Acceptance criterion (Tier 1 portion only):** `offers.availability` on a live PDP matches the actual, current fulfillment state at crawl time — this is testable; the URL-disposition decision tree above is not a Google-stated acceptance criterion and should not be represented as one in an SOP without the Tier-4 caveat attached.

**Verification method:** Scheduled diff of `offers.availability` against the authoritative inventory system; for URL disposition, a value check (backlinks + organic sessions + ranking keywords, via Search Console/Ahrefs/Semrush-class tooling) before choosing redirect vs. 404 for any given discontinued PDP.

**Source (Tier 1 portion):** Google Search Central, "General Structured Data Guidelines," https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC). **Tier 1.** `ItemAvailability` values: Schema.org, https://schema.org/ItemAvailability. **Tier 1.** (No Tier 1 source located for URL-disposition rule — flagged as a documented gap, not asserted as vendor-confirmed.)

**Anti-pattern:** Immediately 404-ing every product the moment stock hits zero — this is the single most common over-correction in this space and directly contradicts even the practitioner consensus, which treats temporary stockouts as a keep-live case. Also: silently leaving `availability: InStock` on a page for a discontinued product — this is a direct violation of the Tier 1 freshness policy, independent of whatever URL-disposition choice is made.

---

## 8. Faceted navigation and parameter handling on category pages

**Rule:** For each URL parameter your faceted navigation can generate, make an explicit decision — crawlable-and-indexable, crawlable-but-canonicalized-to-the-base-category, or blocked from crawling entirely — rather than letting the combinatorial explosion of filter URLs go undecided.

**Mechanism:** Google's crawling-infrastructure documentation states faceted navigation is "by far the most common source of overcrawl issues site owners report," because each filter combination (color × size × price-band, etc.) can generate a unique URL, and Googlebot "harms the website" by spending disproportionate crawl resources discovering and re-checking low-value filtered variants at the expense of discovering genuinely new pages. Google's recommended primary mitigation is **preventing crawling in the first place** via `robots.txt` disallow rules targeting the specific facet parameters (e.g. `disallow: /*?*color=`), with narrow `allow` exceptions carved out for parameter combinations that should be indexed (e.g. a canonical "show all" view). A secondary technical requirement, independent of the blocking strategy chosen: use the industry-standard `&` as the parameter separator — commas, semicolons, and brackets are, in Google's words, "hard for crawlers to detect as parameter separators."

**If facet URLs must be indexable:** maintain a consistent, canonical parameter *order* (so the same filter combination doesn't produce multiple distinct URLs depending on click order), return a genuine HTTP `404` when a filter combination yields zero results (rather than a soft-404 200-status empty-results page), and use `rel="canonical"` to point non-canonical facet permutations back at the unfiltered base category URL when the filtered view has no independent search-worthy value.

**Acceptance criterion:** Every distinct facet-generating parameter is either disallowed in `robots.txt`, or produces a page whose `rel="canonical"` resolves to a single consistent target regardless of parameter order; zero-result filter combinations return HTTP 404, not a 200 with an empty product grid.

**Verification method:** Crawl the category section with a parameter-aware crawler (e.g. Screaming Frog with "crawl parameters" enabled) and diff the resulting URL count against the count of genuinely distinct category/product-set pages; `curl -I` a known zero-result filter combination and confirm status code; Search Console Page Indexing report filtered to the category path, checking for "Duplicate, Google chose different canonical than user" flags on facet URLs.

**Source:** Google Crawling Infrastructure docs, "Managing crawling of faceted navigation URLs," https://developers.google.com/crawling/docs/faceted-navigation (last updated 2025-12-18 UTC). **Tier 1.**

**Anti-pattern:** Relying on `rel="canonical"` alone as the primary defense against overcrawl on a large faceted catalog — Google's own guidance frames canonical tags as a secondary/slower-acting signal here, with `robots.txt` blocking as the preferred first-line mitigation for URLs that have no search value at all. Also: building filters as URL fragments (`#color=red`) under the assumption Google will "just ignore" them for crawl-budget purposes and then relying on that same mechanism for something that does need to be indexed — Google states fragments generally have no crawling/indexing effect at all, in either direction.

---

## 9. Pagination on category listing pages

**Rule:** Give every page in a paginated category sequence its own unique, crawlable URL (e.g. `?page=2`) and its own self-referential canonical (never canonicalize page 2+ back to page 1); do not implement `rel="next"`/`rel="prev"` under the belief it still functions as an indexing or ranking signal — Google has not used it since 2019.

**Mechanism:** Google's e-commerce-specific pagination guidance states: "Don't use the first page of a paginated sequence as the canonical page. Instead, give each page its own canonical URL" — each paginated page is treated by Google as a separate, independently indexable page, not folded into page 1. On the deprecated markup: Google's 2019 announcement (independently corroborated by multiple trade-press retrospectives, since the live page's current banner text could not be directly quoted in this research pass — treat the *existence and 2019 date* of the deprecation as **Tier 1**, sourced from the announcement itself, and the "not used for some time even before the announcement" framing as **Tier 4** corroboration) established that `rel="next"`/`rel="prev"` are not an indexing signal; the current e-commerce pagination doc reiterates: "Google no longer uses these tags, although these links may still be used by other search engines" (i.e., Bing may still consume them — do not remove them purely for Google's sake if another target engine benefits, but do not add them new solely for Google).

**Discovery requirement:** Because Googlebot does not click "Load more" buttons or trigger user-gesture-gated JavaScript, sites using infinite scroll or button-triggered pagination must still expose real, crawlable `<a href>` links from each page to the next (or provide the full paginated set via a sitemap / Merchant Center feed) — otherwise pages beyond the first are effectively undiscoverable to Googlebot regardless of what a human sees.

**Acceptance criterion:** Page 2+ of a paginated category returns a distinct, unique URL; that URL's canonical points to itself, not to page 1; a genuine `<a href="...">` (not a JS-only click handler) exists linking each page to the next in the sequence, or an equivalent sitemap/feed-based discovery path exists.

**Verification method:** `curl -s <page-2-url> | grep 'rel="canonical"'` — confirm it self-references; `curl -s <page-1-url> | grep -o '<a href="[^"]*"'` and confirm a real anchor to page 2 exists in server-rendered HTML (not only in client JS); Search Console Page Indexing report to confirm page 2+ URLs are indexed as distinct entries, not merged/canonicalized to page 1.

**Source:** Google Search Central, "Pagination Best Practices for Google," https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading. **Tier 1.** Deprecation announcement: Google Search Central Blog, "Pagination with rel='next' and rel='prev'," https://developers.google.com/search/blog/2011/09/pagination-with-relnext-and-relprev (deprecation confirmed 2019-03; exact current on-page banner text not independently re-confirmed in this pass — treat corroborating detail as **Tier 4**). **Tier 1** for the core deprecation fact and current e-commerce guidance.

**Anti-pattern:** Canonicalizing every paginated page in a category back to page 1 "to consolidate ranking signals" — this actively prevents products on pages 2+ from being indexed as belonging to distinct, crawlable URLs. Also: shipping category pagination purely as infinite-scroll with no server-rendered next-page links and no sitemap fallback — content beyond the initial viewport load becomes invisible to Googlebot.

---

## 10. `ItemList` for category/listing pages (Carousel structured data)

**Rule:** Use `ItemList` on a category/listing page only when targeting Google's Carousel rich result (a horizontally-scrollable multi-item SERP feature), not as a generic "here is a list of products" markup requirement for ordinary category pages — a plain category page with no carousel ambition does not need `ItemList` at all.

**Required properties (ItemList):** `itemListElement`, an array of at least two `ListItem` entries of the same underlying type. Each `ListItem` requires `position` (1-based integer reflecting carousel order) and, for a "summary page linking to detail pages" architecture, `url` (the canonical URL of that item's own detail page); for an "all-in-one page" architecture, `item` (the nested content object) with `item.name` and `item.url` (anchor-qualified).

**Recommended properties:** none independently documented for the `ItemList` container itself beyond the required `itemListElement`/`position`/`url`(or `item`) set — this is a case where the *entire* spec is close to "required," with very little discretionary embellishment available.

**Pagination interaction:** Google's carousel guidance states: mark up all items present on a given summary/category page; "for paginated categories, add an `ItemList` to each subsequent page and include [only] the entities that are listed on that page" (i.e., `position` numbering and item membership should reflect what's actually on that specific paginated page, not the whole catalog); for infinite scroll, "focus on marking up the entities that are initially loaded in the viewport" — items loaded later via scroll are not required to be (and generally cannot practically be) included in the same static markup block.

**Acceptance criterion:** `itemListElement` contains ≥2 entries; every entry's declared `position` is unique and sequential starting at 1 for that page; the item type is consistent across all entries (mixing, e.g., `Product` and `Recipe` in one `ItemList` is not a supported pattern); on paginated category pages, each page's `ItemList` reflects only that page's items, not the full catalog.

**Verification method:** Rich Results Test targeting the "Carousel" feature explicitly; grep rendered JSON-LD for `"@type":"ItemList"` and manually confirm `position` values are sequential and unique within each page's markup.

**Source:** Google Search Central, "Carousel (ItemList) Structured Data," https://developers.google.com/search/docs/appearance/structured-data/carousel. **Tier 1.**

**Anti-pattern:** Adding `ItemList` markup to every category page as a default "best practice," expecting it to unlock some general "category page" rich-result feature — there is no such generic feature; `ItemList` only matters if you specifically want carousel eligibility, and mixing it in without understanding the paginated/infinite-scroll item-membership rule above produces markup that either double-counts items across pages or misrepresents `position`.

---

## 11. Image requirements for product results

**Rule:** Serve genuine product photography meeting Google's/Merchant Center's minimum resolution and content rules — no placeholder graphics, no watermarks/logos baked into the image, no promotional text (price, "best," "free shipping") burned into the pixels — because these are documented, enforceable requirements, not stylistic suggestions.

**Required/recommended resolution (flag the coming change):** Google's structured-data image guidance (general, for Product/Article-class rich results) recommends images meeting a minimum of roughly 50,000 total pixels and supplying multiple aspect ratios (16:9, 4:3, 1:1) so Google can choose the right crop per surface. Separately, **Merchant Center's `image_link` requirement is changing**: the current floor is effectively lower, but Google has announced a new enforced minimum of **500×500 pixels beginning 2027-01-31** — this is a genuine forward-dated policy change to plan migrations around now, not yet in effect at time of writing but close enough (within roughly six months of this research date) to require a build-plan decision today. Recommended (not required) resolution for best performance across all listing formats is **1500×1500 pixels or above**.

**Prohibited image content (Merchant Center, applies equally to any Shopping-surface-eligible image regardless of source):** placeholder/generic non-product imagery; watermarks or decorative borders; logos, brand names, or retailer identifiers baked into the image (unless genuinely inherent to the physical product); promotional overlays (calls-to-action, prices, "free shipping," subjective adjectives like "best"/"cheap"); visible barcodes; condition descriptors ("new," "2-piece") rendered as image text; warranty/service text rendered as image text.

**Format/technical constraints:** supported formats JPEG, WebP, PNG, GIF, BMP, TIFF; max file size 16MB; max 64 megapixels; the image URL itself must use only ASCII characters, be RFC 3986-compliant, and URL-encode reserved characters (e.g. `&` → `%26`).

**Acceptance criterion:** Primary product image ≥500×500px today (≥1500×1500px to hit the "best performance" recommendation), containing no watermark/logo/promotional-text overlay, served from a URL that resolves with HTTP 200 and validates as ASCII/RFC-3986-clean; at minimum one additional image supplied via `additional_image_link`/repeated `image` values covering a distinct aspect ratio if the primary is not already multi-ratio.

**Verification method:** Automated image-dimension check (`file`/`identify`/a dimension-reading script) against the 500×500 floor (1500×1500 target); manual or ML-assisted visual audit for watermark/text-overlay violations across a sample of the catalog; Merchant Center diagnostics "Image issues" report for feed-driven catalogs.

**Source:** Google Merchant Center Help, "Image link [image_link]," https://support.google.com/merchants/answer/6324350?hl=en. **Tier 1.** Google Merchant Center Help, "Additional image link [additional_image_link]," https://support.google.com/merchants/answer/6324370?hl=en. **Tier 1.**

**Anti-pattern:** Using a manufacturer's stock catalog image that has a competitor's or a marketplace's watermark/logo baked in — this is an explicit prohibited-content category, independent of resolution. Also: waiting until January 2027 to address sub-500×500 imagery instead of treating the announced floor as the target now, given lead time for a full catalog re-shoot/re-source project.

---

## 12. The Shopping Graph and declared markup vs. automated extraction

**Rule:** Treat declared structured data (on-page `Product`/`Offer` markup) and a Merchant Center feed as two of several inputs Google's automated extraction cross-references against each other — not as the sole determinant of what appears in Shopping surfaces — and keep them consistent with each other rather than optimizing either in isolation.

**Mechanism:** Google's own framing (from the intro Product-structured-data doc) is that Google can build product understanding via (a) structured data on web pages, (b) a Merchant Center feed, or (c) both — and using both "maximizes eligibility ... and helps Google correctly understand and verify your data," implying Google is actively cross-checking the two rather than passively ingesting whichever is supplied. Beyond declared markup and feeds, Google is understood (per trade coverage, not a single Google-owned canonical explainer located in this research pass — **Tier 4** for the "five sources" framing specifically) to also extract product signals from non-declared page content (visible text, reviews on third-party sites, etc.) into what Google publicly brands the "Shopping Graph" — a real-time product-understanding layer Google has separately described in marketing contexts as covering many billions of products. Because this graph draws on more than what any one merchant declares, internal consistency (feed ↔ markup ↔ visible page content all agreeing) is the practical lever a site owner actually controls, rather than any single "correct" declaration in isolation.

**Acceptance criterion:** No load-bearing, testable acceptance criterion is assertable here beyond what's already covered in §5 (feed/markup consistency) — the Shopping Graph itself is not something a site owner directly configures or validates against; it is Google's internal aggregation layer. Do not write an SOP rule that treats "optimizing for the Shopping Graph" as a distinct, separately-actionable checklist item beyond keeping declared data (markup + feed) accurate and consistent.

**Verification method:** N/A as a direct check; use the §5 feed/markup consistency check and the §1/§2 eligibility checks as proxies, since there is no public tool that inspects Shopping Graph state directly.

**Source:** Google Search Central, "Intro to Product Structured Data on Google," https://developers.google.com/search/docs/appearance/structured-data/product. **Tier 1** for the markup+feed framing. Broader "Shopping Graph" characterization: multiple 2026 trade-press explainers describing it as a real-time, multi-source product-understanding layer; no single Google-owned canonical technical explainer of the "Shopping Graph" as a distinct product was independently located and fetched in this research pass. **Tier 4** for anything beyond the Tier 1 markup+feed relationship already documented in §5.

**Anti-pattern:** Treating "Shopping Graph optimization" as a purchasable service or a distinct technical checklist separate from getting `Product`/`Offer` markup and the Merchant Center feed right and mutually consistent — most of what's marketed under that name in trade press reduces to the same eligibility and consistency rules already documented in §1, §2, and §5.

---

## 13. Recently deprecated/changed structured data adjacent to e-commerce (last 24 months)

The task brief specifically asks this module to flag anything deprecated or materially changed in structured data over the last 24 months. Within and adjacent to e-commerce scope, this research surfaced:

1. **Self-serving review ineligibility + incentivized-review language — 2026-07-24.** Covered in full in §3. This is the single most recent and most directly relevant change found — five days old relative to this research date.
2. **Seven structured data types retired, June 2025**, with Search Console/Rich Results Test support removed effective **2025-09-09**: Vehicle Listing, Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement. Of these, **Vehicle Listing** is the one adjacent to this module's scope — Google's own guidance for dealer/marketplace vehicle listings now directs migration to standard `Product` schema for individual listings, folding automotive inventory into the same Product/Offer model documented in §1–§2 rather than a bespoke vehicle type. (Trade-press dated claim, corroborated across multiple independent 2025/2026 retrospectives; the specific June-2025/September-2025 dates were not independently re-confirmed against a single Google-owned changelog entry in this pass — treat the **existence and direction** of this deprecation as reasonably solid, but the **exact dates** as **Tier 4** pending direct changelog verification.)
3. **FAQ rich results narrowed, May 2026** — not e-commerce-specific (affects general FAQPage use, including product-page FAQ blocks some stores rely on for SERP real estate); the FAQPage schema type itself remains valid, non-deprecated vocabulary, but the rich-result *display* was restricted to a narrower set of eligible sites. If a product page's SEO plan currently depends on FAQ rich results for extra SERP real estate, that dependency should be re-evaluated. (Tier 4 — trade-press sourced, not independently re-fetched from a Google changelog entry in this pass.)
4. **Product-variant support added, February 2024** — technically just outside the 24-month window as of this research date (2026-07-29), but included in §4 because it remains the operative current guidance and is young enough that many existing implementations still predate it and use older, unlinked-variant patterns.

**Anti-pattern (widely-repeated claim NOT supported by primary sources):** A frequently repeated practitioner claim is that structured data (of any kind, including Product/Review) is itself "a Google ranking factor" — i.e., that adding it directly improves organic position. Google's general structured-data policy page states the opposite consequence model for violations: "A structured data manual action means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search" — the stated mechanism of structured data throughout every page fetched in this research is **eligibility for a specific SERP feature/display enhancement**, never a ranking-signal claim. Treat "schema helps you rank" as unsupported by the Tier 1 sources reviewed here; the correct, supportable claim is "schema helps you *display* better and become eligible for richer SERP real estate," which is a related but distinct mechanism from ranking.

**Source:** Google Search Central, "General Structured Data Guidelines," https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC). **Tier 1** for the manual-action/ranking-independence quote. Deprecation list: multiple 2025/2026 trade-press retrospectives (SEO trade press, unable to independently re-fetch a single canonical Google changelog page enumerating all seven retired types in this pass). **Tier 4** for the specific dates/type list in items 2–3 above.

---

## 14. General structured-data policy floor (applies across every section above)

**Rule:** All e-commerce structured data — Product, Offer, Review, ProductGroup, ItemList alike — must represent content genuinely present and visible on the page, must be kept current, and must not misrepresent ratings/reviews as more genuine or more numerous than they are.

**Required behavior:** "Don't mark up content that is not visible to readers of the page" and "Don't mark up irrelevant or misleading content, such as fake reviews or content unrelated to the focus of a page" — Google specifically calls out "reviews or ratings not by actual users" as something that "may result in manual action." Freshness: "We won't show a rich result for time-sensitive content that is no longer relevant" — this is the same principle underlying the `priceValidUntil` freshness check in §2 and the availability-accuracy expectation in §7, generalized across the whole markup surface.

**Consequence model:** violations produce a **structured-data manual action**, which removes rich-result eligibility for the affected markup/page — it is explicitly stated not to be a web-ranking penalty. This is a narrower, more contained consequence than many practitioner writeups imply, but it is a real and monitorable one (visible in Search Console's Manual Actions report).

**Acceptance criterion:** A sampled audit of live markup against live page content shows no properties describing content absent from the rendered page; no rating/review counts exceed what a genuine on-page review widget/count actually reflects; Search Console Manual Actions report shows no active structured-data action.

**Verification method:** Search Console → Security & Manual Actions → Manual actions report, filtered for structured-data-related entries; periodic sampled diff of markup values against rendered page content.

**Source:** Google Search Central, "General Structured Data Guidelines," https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC). **Tier 1.**

**Anti-pattern:** Treating a structured-data manual action as equivalent in severity to a web-spam manual action (which does affect ranking) — conflating the two leads to either under-reacting to a real eligibility loss or over-reacting with disproportionate remediation effort relative to the actual (rich-result-only) blast radius.

---

## Note on Bing

Bing Webmaster Tools ships a Schema Markup Validator supporting Schema.org/Microdata/RDFa/OpenGraph and references Review and Product schema as inputs to Bing Copilot's comparison-style commercial-query answers, but no distinct, Bing-specific required/recommended property specification for Product/Offer/Review markup (comparable in depth to Google's docs above) was located in this research pass. Where this module cites "Tier 1," it should be read as **Google Search Central + Schema.org + Merchant Center Help** — the three sources that actually carry load-bearing, property-level detail for this scope — with Bing treated as a supporting, lower-detail Tier 1 data point rather than an independent source of distinct requirements.

**Source:** General Bing Webmaster Tools documentation on structured data validation (schema support confirmed; no dedicated e-commerce property spec located). **Tier 1** (source class) but **thin** (no independent load-bearing rule drawn from it in this module).
