# E-Commerce

**Module:** C2 — E-commerce
**Prefix:** `ECOM`
**Status:** Conditional — invoked per client (`00-index.md` §8)
**Scope:** `Product`/`Offer` structured data, the merchant-listing vs. product-snippet split, review/rating markup and the self-serving-reviews rule, `ProductGroup` variant handling, Merchant Center feeds, canonicalization across product variants, out-of-stock/discontinued disposition, faceted navigation and pagination on category pages, `ItemList`/Carousel markup, product image requirements, and the general structured-data policy floor.
**Evidence base:** `docs/seo/evidence/sources/conditional/ecommerce.md` (research pass, 2026-07-29).

> **Not exercised by CleanStart — verified against primary documentation only.**
>
> **This module has not been through the adversarial verification pass** that the core
> modules (01–11) received. Its rules rest on a single research pass. Adversarial
> verification found defects in roughly one rule in five across the core modules, so
> re-verify every rule here against its cited source before relying on this module for
> a client engagement.

---

## When this module applies

Apply this module the moment a client site sells products directly (a storefront with cart/checkout), operates an affiliate/comparison page describing products it doesn't sell directly, or feeds a Google Merchant Center catalog. It does not apply to a B2B software marketing site with no product-detail pages, cart, or feed — `www.cleanstart.com` has none of these, which is why every rule below carries a `CleanStart: N/A` verdict. `Product`/`Offer` markup has exactly **7 required properties** (§ECOM-01/02) against roughly **20 recommended** properties across `Product`, `Offer`, `ProductGroup`, and review markup combined — most practitioner advice treats the entire recommended set as mandatory, inflating implementation cost substantially. Distinguish the two carefully in every rule below.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### ECOM-01 — Classify every product page as a merchant listing or a product snippet before writing markup; they have different required-property sets

- **Severity:** P1
- **Applies:** Any page carrying `Product` structured data
- **Rule:** Before writing any `Product` markup, classify each page as either a **merchant listing** (a page where the shopper can directly buy the product from you) or a **product snippet** (an editorial/informational page — a review, a roundup, a comparison — where no direct purchase happens on that page), and implement the corresponding required-property set. Do not treat "Product structured data" as one undifferentiated spec.
- **Why:** Google states there are "two main classes of product structured data": merchant listings unlock Shopping-tab experiences and require `Offer` markup because a transaction can happen on the page; product snippets unlock plain-text-result price/rating/availability enhancements and additionally support `positiveNotes`/`negativeNotes` for editorial reviews. Google is explicit: "only pages where a shopper can purchase a product are eligible for merchant listing experiences, not pages with links to other sites that sell the product" — an affiliate/aggregator page is a product-snippet page no matter how complete its `Offer` markup is.
- **Acceptance:**
  - Merchant-listing pages carry `name`, `image`, and an `offers` object with `price`/`priceSpecification.price`, `priceCurrency`, and `availability` populated
  - Product-snippet pages carry `name` plus at least one of `review`, `aggregateRating`, or `offers`
  - No page attempts merchant-listing eligibility without a direct purchase path on that same URL
- **Verify:** `curl -s "https://search.google.com/test/rich-results?url=<page>"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/merchant-listing; https://developers.google.com/search/docs/appearance/structured-data/product-snippet (last updated 2025-12-10 UTC)
- **Tools:** The Rich Results Test reports the item type (Merchant listing vs. Product snippet) and its field breakdown directly; Search Console's "Merchant listings" and "Product snippets" reports are separate as of Google's 2022 changelog (ECOM-11).
- **Anti-patterns:** Implementing full `Offer` markup (price, availability, shipping) on an affiliate/comparison page and expecting merchant-listing features — the page-type constraint is not overridable by markup completeness. Conversely, implementing only product-snippet-tier markup on a real storefront PDP forfeits the richer Shopping-tab surfaces entirely.
- **CleanStart:** N/A

---

### ECOM-02 — Every merchant-listing `Offer` must carry `price`, `priceCurrency`, and `availability`; use `AggregateOffer` only for genuine multi-seller pricing

- **Severity:** P1
- **Applies:** Any page carrying `Offer`/`AggregateOffer` structured data
- **Rule:** Every `Offer` used for merchant-listing eligibility must carry `price` (or `priceSpecification.price`), `priceCurrency` (ISO 4217), and `availability` (an `ItemAvailability` enum value); use `AggregateOffer` instead of a single `Offer` only when the *same* product is genuinely sold by multiple distinct sellers at different prices, not as a generic wrapper for one seller's single price.
- **Why:** `Offer` represents one seller's specific terms for one item; `AggregateOffer` rolls up "multiple offers that all share the same defined businessFunction value" — schema.org's own example is the same product sold by several merchants, surfaced via `lowPrice`, `highPrice`, `offerCount`. `ItemAvailability` has twelve current enum values (`InStock`, `OutOfStock`, `BackOrder`, `Discontinued`, `PreOrder`, `LimitedAvailability`, etc.) — pick the value matching actual fulfillment state, not a binary split.
- **Acceptance:**
  - `offers.priceCurrency` matches a valid ISO 4217 code
  - `offers.availability` resolves to one of the twelve enum values and matches the page's actual fulfillment state
  - `AggregateOffer` is used only where `lowPrice`/`highPrice` are genuinely distinct across real sellers, not degenerate duplicates of one seller's price
- **Verify:** `curl -s <url> | grep -o '"availability":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://schema.org/Offer; https://schema.org/AggregateOffer; https://schema.org/ItemAvailability
- **Tools:** Rich Results Test validates the required-field set on the PDP directly.
- **Anti-patterns:** Wrapping a single seller's single-price `Offer` in an `AggregateOffer` purely out of templating habit — this adds indirection Google does not require and can make `lowPrice`/`highPrice` degenerate to the same value, a signal of templated rather than genuine multi-seller data.
- **CleanStart:** N/A

---

### ECOM-03 — A stale `priceValidUntil` suppresses the listing; keep price/availability freshness verified on a schedule

- **Severity:** P1
- **Applies:** Any merchant-listing page declaring `priceValidUntil`
- **Rule:** If `priceValidUntil` is present, its date must always be in the future at crawl time; treat freshness as a scheduled diff check, not a one-time audit.
- **Why:** Google states plainly: "Your listing may not display if the priceValidUntil property indicates a past date." Separately, Google warns that markup injected dynamically via JavaScript "can make Shopping crawls less frequent and less reliable, which can be an issue for fast-changing content like product availability and price."
- **Acceptance:**
  - If `priceValidUntil` is present, its date is always in the future at crawl time
  - The `Offer` block (including `price`/`availability`) is present in the raw HTTP response, not only in the client-rendered DOM
- **Verify:** `curl -s <url> | grep -o '"priceValidUntil":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- **Tools:** No tool surveyed schedules a freshness diff automatically; this requires a dedicated scheduled check.
- **Anti-patterns:** Shipping fast-changing price/availability data only via client-side JS render, then being surprised Shopping crawls under-report it — Google names this exact failure mode.
- **CleanStart:** N/A

---

### ECOM-04 — Self-serving reviews on `Organization`/`LocalBusiness` markup are ineligible for the star rich result; product reviews are unaffected

- **Severity:** P1
- **Applies:** Any page carrying `Review`/`AggregateRating` structured data
- **Rule:** Never mark up `Review`/`AggregateRating` for reviews of your own business/organization on your own domain — including via an embedded third-party widget you control — and expect star-rating eligibility. Product reviews on a genuine product-detail page, nested under `Product` rather than `Organization`, remain eligible.
- **Why:** Google's review-snippet documentation states: "If the entity that's being reviewed controls the reviews about itself, their pages that use LocalBusiness or any other type of Organization structured data are ineligible for [the] star review feature." This page was last updated 2026-07-24 UTC — five days before this module's source research was conducted — and the same update added explicit language prohibiting "fake **or** undisclosed" incentivized reviews (ECOM-04's mechanism note: the word is "or," not "and" — a review can be genuine and still ineligible if it is undisclosed as incentivized).
- **Acceptance:**
  - No `Review`/`AggregateRating` node is nested under an `Organization`/`LocalBusiness` type representing the page's own operator
  - Every `Review`/`AggregateRating` node resolves `itemReviewed` to a `Product` or other non-self entity
  - No review is fake or an undisclosed incentivized review
- **Verify:** `curl -s <url> | grep -B2 '"@type":"AggregateRating"' | grep -o '"@type":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24 UTC)
- **Tools:** Search Console → "Review snippets" report surfaces manual-action or eligibility warnings.
- **Anti-patterns:** Embedding a third-party trust-badge widget that injects `AggregateRating` describing your own company as an `Organization`, then expecting a star rating in your own SERP snippet — this is the exact pattern the July 2026 update closes off.
- **CleanStart:** N/A

---

### ECOM-05 — Canonicalize product-variant URLs deliberately: single-page architectures share one canonical, multi-page architectures each self-canonicalize

- **Severity:** P1
- **Applies:** Any site with variant selection (color/size) or filter/sort state that changes the URL
- **Rule:** When variant selection or filter/sort state changes the URL, designate one canonical URL per genuinely distinct product using `rel="canonical"` and/or redirects — never rely on `noindex`, robots.txt, or sitemap-inclusion alone, and never point two different canonicalization mechanisms at two different URLs for the same page. For single-page variant architectures, `ProductGroup.url` and the canonical URL are the same value; for multi-page architectures, each variant page is its own canonical.
- **Why:** Google lists "ecommerce product variants" by name as a standard reason duplicate content exists, and instructs: "Don't specify different URLs as canonical for the same page using different canonicalization techniques." Canonicalizing every color/size variant back to one "parent" URL contradicts the multi-page variant pattern (ECOM-07), which requires each variant page to be self-contained and independently indexable.
- **Acceptance:**
  - Every parameterized/variant-selector URL either 301s to, or carries a `rel="canonical"` pointing at, exactly one URL
  - That same URL is the one listed in the sitemap
  - No variant URL is canonicalized to a different target than what its sitemap entry or redirect chain implies
- **Verify:** `curl -s <variant-url> | grep -o 'rel="canonical"[^>]*'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls (last updated 2026-07-10 UTC); https://developers.google.com/search/docs/appearance/structured-data/product-variants
- **Tools:** Search Console's URL Inspection tool confirms Google's "user-declared canonical" matches "Google-selected canonical."
- **Anti-patterns:** Canonicalizing every color/size variant page back to one "parent" URL while still expecting each variant to independently rank/display in Shopping-surface results with its own price and availability.
- **CleanStart:** N/A

---

### ECOM-06 — Faceted category-navigation parameters need an explicit crawl decision per parameter; `robots.txt` is the primary control, not `rel=canonical` alone

- **Severity:** P1
- **Applies:** Category listing pages with filter/facet-generating URL parameters
- **Rule:** For each URL parameter faceted navigation can generate, make an explicit decision — crawlable-and-indexable, crawlable-but-canonicalized-to-the-base-category, or blocked from crawling entirely — rather than letting the combinatorial explosion of filter URLs go undecided. If facet URLs must remain indexable, maintain a consistent canonical parameter order, and return a genuine HTTP 404 (not a soft-404 200) for zero-result filter combinations.
- **Why:** Google states faceted navigation is "by far the most common source of overcrawl issues site owners report," because each filter combination can generate a unique URL that Googlebot must fetch before determining it's low-value. Google's recommended primary mitigation is preventing crawling via `robots.txt Disallow` on the facet parameters, with narrow `Allow` exceptions for combinations that should be indexed. Use `&` as the parameter separator — commas, semicolons, and brackets are "hard for crawlers to detect as parameter separators."
- **Acceptance:**
  - Every distinct facet-generating parameter is either disallowed in `robots.txt`, or produces a page whose `rel="canonical"` resolves to a single consistent target regardless of parameter order
  - Zero-result filter combinations return HTTP 404, not a 200 with an empty product grid
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/category?color=nonexistent-value"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation (last updated 2025-12-18 UTC)
- **Tools:** Screaming Frog with "crawl parameters" enabled reveals the resulting URL count against the count of genuinely distinct category/product-set pages.
- **Anti-patterns:** Relying on `rel="canonical"` alone as the primary defense against overcrawl on a large faceted catalog — Google frames canonical tags as a secondary, slower-acting signal, with `robots.txt` blocking as the preferred first-line mitigation.
- **CleanStart:** N/A

---

### ECOM-07 — Product-variant families use `ProductGroup`/`hasVariant`/`isVariantOf` with a consistent `productGroupID` across every variant

- **Severity:** P1
- **Applies:** Any product existing in multiple variants (size, color, material)
- **Rule:** Model a multi-variant product as a `ProductGroup` with each variant as a nested/linked `Product`, connected bidirectionally via `hasVariant` (group → product) and `isVariantOf` (product → group), and declare which attributes distinguish the variants via `variesBy`. Every variant must share the identical `productGroupID` — Google calls this the "parent SKU."
- **Why:** Google added structured-data support for this pattern in February 2024, stating the goal of "better product information for shoppers" and richer variant pickers in merchant-listing experiences. `ProductGroup` itself is a template/prototype standing in for its member variants, not a sold item; the only property Google's docs mark required for the group node is `name`. Two architectures are supported: single-page (one URL, `hasVariant` nests each `Product` inline) and multi-page (each variant has its own URL and declares `isVariantOf`, fully self-contained without relying on the group page's markup).
- **Acceptance:**
  - Every variant `Product` under a `ProductGroup` shares the identical `productGroupID` value
  - `variesBy` lists only the properties that actually differ between variants
  - For multi-page implementations, each variant page's markup validates independently
- **Verify:** `curl -s <variant-url> | grep -o '"productGroupID":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/product-variants (last updated 2026-05-20 UTC); https://developers.google.com/search/blog/2024/02/product-variants; https://schema.org/ProductGroup
- **Tools:** Rich Results Test on both the group page (if single-page) and at least two variant pages (if multi-page).
- **Anti-patterns:** Publishing each color/size variant as a fully independent `Product` with no `ProductGroup`/`isVariantOf` link — Google can still index each page but loses the ability to consolidate them into a richer variant-picker result. Also: letting `productGroupID` values drift on re-import, silently breaking the variant linkage without a validation error on any single page.
- **CleanStart:** N/A

---

### ECOM-08 — All e-commerce structured data must represent content genuinely present on the page; fake reviews and time-sensitive stale data forfeit rich-result eligibility, not ranking

- **Severity:** P1
- **Applies:** Any e-commerce structured data (`Product`, `Offer`, `Review`, `ProductGroup`, `ItemList`)
- **Rule:** All e-commerce structured data must represent content genuinely present and visible on the page, must be kept current, and must not misrepresent ratings/reviews as more genuine or more numerous than they are.
- **Why:** Google: "Don't mark up content that is not visible to readers of the page" and "Don't mark up irrelevant or misleading content, such as fake reviews or content unrelated to the focus of a page" — reviews or ratings not by actual users "may result in manual action." A structured-data manual action removes rich-result eligibility for the affected markup; Google states explicitly "it doesn't affect how the page ranks in Google web search" — a narrower, more contained consequence than many practitioner writeups imply, but a real and monitorable one.
- **Acceptance:**
  - A sampled audit of live markup against live page content shows no properties describing content absent from the rendered page
  - No rating/review counts exceed what a genuine on-page review widget/count actually reflects
  - Search Console Manual Actions report shows no active structured-data action
- **Verify:** `curl -s "https://search.google.com/search-console/manual-actions"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC)
- **Tools:** Search Console → Security & Manual Actions → Manual actions report, filtered for structured-data-related entries.
- **Anti-patterns:** Treating a structured-data manual action as equivalent in severity to a web-spam manual action (which does affect ranking) — conflating the two leads to either under-reacting to a real eligibility loss or over-reacting with disproportionate remediation.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### ECOM-09 — Keep on-page `Offer` markup and the Merchant Center feed consistent; automatic item updates can silently let markup win

- **Severity:** P2
- **Applies:** Any site with both on-page `Product`/`Offer` markup and a Merchant Center feed
- **Rule:** Treat on-page markup and a Merchant Center feed as two inputs to the same catalog, not redundant or competing systems. If Merchant Center's "automatic item updates" feature is enabled, ensure `price`, `priceCurrency`, `availability`, and `condition` are present in server-rendered HTML — this feature can silently override the feed with landing-page markup values.
- **Why:** Google: "Specifying the following schema.org values is required for automatic item updates: price, priceCurrency, availability and condition" — a narrower, feed-specific required set than the general merchant-listing requirement (ECOM-02, which does not require `condition`). Google's own example: if a feed lists a product at £4 but the landing page's markup says £3, "we'll update the product to £3 in your ads or product listings."
- **Acceptance:**
  - Feed values for `price`/`availability`/`condition` match the corresponding on-page `Offer` values on a scheduled diff, not a one-time audit
  - If automatic item updates are enabled, the four trigger properties are present in server-rendered HTML
- **Verify:** `curl -s <pdp-url> | grep -o '"condition":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/merchants/answer/12157888?hl=en-GB; https://support.google.com/merchants/answer/7331077?hl=en
- **Tools:** Merchant Center diagnostics for "automatic item updates" activity log.
- **Anti-patterns:** Manually correcting a pricing error in the Merchant Center feed while leaving stale on-page markup unfixed — if automatic item updates is on, Google may silently revert the feed to match the stale page.
- **CleanStart:** N/A

---

### ECOM-10 — Reflect true fulfillment state via `ItemAvailability`; treat URL disposition for discontinued products as an evidence-based decision, not a Google-documented rule

- **Severity:** P2
- **Applies:** Any product page whose stock or lifecycle status changes
- **Rule:** Reflect the true fulfillment state via the `ItemAvailability` enum rather than leaving stale `InStock` markup on a page that can no longer fulfill orders — this part is Google-documented. Google does **not** document what to do with the URL itself once a product is out of stock or discontinued; treat any keep-live/redirect/404 decision tree for URL disposition as `Convention — not vendor-confirmed`, verified against actual traffic/backlink value rather than assumed.
- **Why:** Google's general structured-data policy requires "up-to-date information" and states it "won't show a rich result for time-sensitive content that is no longer relevant" — this is the Tier 1 portion. Practitioner consensus (not Google- or Schema.org-documented) converges on: keep temporarily out-of-stock pages live with accurate availability; 301 permanently discontinued pages with accumulated traffic/backlinks to the nearest relevant surviving page; allow a 404/410 only after verifying no traffic/backlink value remains.
- **Acceptance:**
  - `offers.availability` on a live PDP matches the actual, current fulfillment state at crawl time (Tier 1 acceptance criterion)
  - Any URL-disposition decision (keep-live / redirect / 404) is documented with the backlink/traffic evidence that supported it, not asserted as a Google-stated rule
- **Verify:** `curl -s <pdp-url> | grep -o '"availability":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC) for the freshness requirement; the URL-disposition decision tree itself is `Convention — not vendor-confirmed` — no Tier 1 source documents it
- **Tools:** Search Console/Ahrefs/Semrush-class backlink and organic-session data before choosing redirect vs. 404 for a discontinued PDP.
- **Anti-patterns:** Immediately 404-ing every product the moment stock hits zero — the single most common over-correction in this space, and one even the practitioner consensus treats as wrong for temporary stockouts. Also: silently leaving `availability: InStock` on a discontinued page — a direct violation of the Tier 1 freshness policy regardless of the URL-disposition choice made.
- **CleanStart:** N/A

---

### ECOM-11 — Merchant-listing eligibility does not require a Merchant Center account

- **Severity:** P2
- **Applies:** Any site with `Product` structured data considering whether a Merchant Center feed is a prerequisite
- **Rule:** Do not treat a Merchant Center account as mandatory for basic Shopping-surface visibility — as of Google's September 2022 changelog, merchants can qualify for merchant-listing experiences using `Product` structured data alone.
- **Why:** Google: merchants can qualify for the "Merchant listings" Search Console report, Popular Products, and Shopping Knowledge Panel using Product structured data alone, "with no Merchant Center account required — the feed is additive, not a hard prerequisite."
- **Acceptance:** Search Console's "Merchant listings" report is checked for markup-only (feed-less) eligibility status before assuming a Merchant Center account is required to appear.
- **Verify:** `curl -s "https://search.google.com/test/rich-results?url=<pdp-url>"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/blog/2022/09/merchant-listings
- **Tools:** Search Console "Merchant listings" report for markup-only eligibility status.
- **Anti-patterns:** Assuming a Merchant Center account is mandatory for any Shopping-surface visibility, and delaying a markup-only-eligible launch to wait on a feed integration.
- **CleanStart:** N/A

---

### ECOM-12 — Product-review markup requires `ratingValue` and at least one of `ratingCount`/`reviewCount`; do not invent a minimum-review-count threshold

- **Severity:** P2
- **Applies:** Any page carrying `Review`/`AggregateRating` structured data
- **Rule:** `Review` requires `author`, `reviewRating.ratingValue`, and either nesting inside the reviewed item or `itemReviewed`/`itemReviewed.name`. `AggregateRating` requires `itemReviewed`/`name` (or nested placement), `ratingValue`, and at least one of `ratingCount` or `reviewCount`. Google's docs state no numeric minimum for `AggregateRating` eligibility — do not invent a "you need N reviews" threshold.
- **Why:** Google does not gate `AggregateRating` eligibility on review volume — the actual gate is data completeness and genuineness. Decimal `ratingValue`s must use a dot (`"4.4"`); the default scale is 1–5, requiring explicit `bestRating`/`worstRating` for any other scale.
- **Acceptance:**
  - `ratingValue` falls within `[worstRating, bestRating]` (default `[1,5]`)
  - At least one of `ratingCount`/`reviewCount` is present and non-zero
  - No internal document specifies a minimum review count as an eligibility requirement
- **Verify:** `curl -s <url> | grep -o '"ratingValue":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/review-snippet (last updated 2026-07-24 UTC)
- **Tools:** Rich Results Test reports missing-required-field errors directly.
- **Anti-patterns:** Publishing `AggregateRating` with a `ratingValue` but no `ratingCount`/`reviewCount` — Google requires at least one of the two count fields, so a bare average with no sample size is incomplete markup, not merely weak signal.
- **CleanStart:** N/A

---

### ECOM-13 — Give every paginated category page a unique, self-referential canonical; never canonicalize page 2+ back to page 1

- **Severity:** P2
- **Applies:** Category listing pages with paginated results
- **Rule:** Give every page in a paginated category sequence its own unique, crawlable URL and its own self-referential canonical; do not implement `rel="next"`/`rel="prev"` under the belief it still functions as an indexing or ranking signal — Google has not used it since 2019 (Bing may still consume it; do not remove it purely for Google's sake if it benefits another target engine, but do not add it new solely for Google).
- **Why:** Google's e-commerce pagination guidance: "Don't use the first page of a paginated sequence as the canonical page. Instead, give each page its own canonical URL." Because Googlebot does not click "Load more" or trigger user-gesture-gated JavaScript, infinite-scroll or button-triggered pagination must still expose real, crawlable `<a href>` links from each page to the next, or provide the full paginated set via a sitemap/feed.
- **Acceptance:**
  - Page 2+ of a paginated category returns a distinct, unique URL whose canonical points to itself, not page 1
  - A genuine `<a href="...">` (not a JS-only click handler) links each page to the next in server-rendered HTML, or an equivalent sitemap/feed-based discovery path exists
- **Verify:** `curl -s <page-2-url> | grep 'rel="canonical"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- **Tools:** Search Console Page Indexing report confirms page 2+ URLs are indexed as distinct entries, not merged into page 1.
- **Anti-patterns:** Canonicalizing every paginated page in a category back to page 1 "to consolidate ranking signals" — this actively prevents products on pages 2+ from being indexed as distinct, crawlable URLs. Also: shipping category pagination purely as infinite-scroll with no server-rendered next-page links and no sitemap fallback.
- **CleanStart:** N/A

---

### ECOM-14 — Meet Merchant Center's minimum image resolution and prohibited-content rules today; plan for the 2027-01-31 500×500 floor now

- **Severity:** P2
- **Applies:** Any product image intended for Shopping-surface eligibility
- **Rule:** Serve genuine product photography with no placeholder graphics, watermarks, logos baked in, or promotional text (price, "best," "free shipping") burned into the pixels. Merchant Center is enforcing a new minimum of 500×500 pixels beginning 2027-01-31 — treat that as a migration deadline to plan around now, roughly six months out, not a future concern. Recommended (not required) resolution for best performance is 1500×1500 pixels or above.
- **Why:** Google's Merchant Center image-link documentation lists prohibited content explicitly: placeholder/generic non-product imagery; watermarks or decorative borders; logos or retailer identifiers baked in; promotional overlays; visible barcodes; condition/warranty text rendered as image text. Separately, general structured-data image guidance recommends a minimum of roughly 50,000 total pixels and multiple aspect ratios (16:9, 4:3, 1:1) so Google can crop appropriately per surface.
- **Acceptance:**
  - Primary product image is ≥500×500px today (≥1500×1500px to hit the "best performance" recommendation)
  - No watermark/logo/promotional-text overlay is present
  - The image URL resolves HTTP 200 and validates as ASCII/RFC-3986-clean
- **Verify:** `curl -sI <image-url> | grep -i content-type`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/merchants/answer/6324350?hl=en; https://support.google.com/merchants/answer/6324370?hl=en
- **Tools:** Merchant Center diagnostics "Image issues" report for feed-driven catalogs.
- **Anti-patterns:** Using a manufacturer's stock catalog image with a competitor's or marketplace's watermark baked in. Also: waiting until January 2027 to address sub-500×500 imagery instead of treating the announced floor as today's target, given lead time for a catalog re-shoot/re-source project.
- **CleanStart:** N/A

---

## P3 — hygiene, marginal or speculative gain

### ECOM-15 — Use `ItemList` only when targeting the Carousel rich result, not as a generic category-page requirement

- **Severity:** P3
- **Applies:** Category/listing pages considering `ItemList` structured data
- **Rule:** Use `ItemList` on a category/listing page only when targeting Google's Carousel rich result, not as a generic "here is a list of products" markup requirement — a plain category page with no carousel ambition does not need `ItemList` at all. For paginated categories, each page's `ItemList` must reflect only that page's own items, with unique sequential `position` values starting at 1.
- **Why:** `itemListElement` requires at least two `ListItem` entries of the same underlying type, each with a `position`. Google's carousel guidance: "for paginated categories, add an ItemList to each subsequent page and include [only] the entities that are listed on that page," and for infinite scroll, "focus on marking up the entities that are initially loaded in the viewport."
- **Acceptance:**
  - `itemListElement` contains ≥2 entries with unique, sequential `position` values starting at 1 for that page
  - The item type is consistent across all entries
  - On paginated category pages, each page's `ItemList` reflects only that page's items, not the full catalog
- **Verify:** `curl -s <url> | grep -c '"@type":"ItemList"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/carousel
- **Tools:** Rich Results Test targeting the "Carousel" feature explicitly.
- **Anti-patterns:** Adding `ItemList` markup to every category page as a default "best practice," expecting it to unlock some general "category page" rich-result feature — there is no such generic feature.
- **CleanStart:** N/A

---

### ECOM-16 — Treat the "Shopping Graph" as an internal aggregation layer, not a separately actionable checklist item

- **Severity:** P3
- **Applies:** Any e-commerce SEO scoping conversation referencing the Shopping Graph
- **Rule:** Do not scope "Shopping Graph optimization" as a distinct, separately-actionable deliverable — the practical lever a site owner controls is keeping declared markup, the Merchant Center feed, and visible page content internally consistent (per ECOM-09), which is the same eligibility work already covered elsewhere in this module.
- **Why:** Google's framing is that structured data and a feed are two of several inputs Google's automated extraction cross-references, and using both "maximizes eligibility... and helps Google correctly understand and verify your data" — implying active cross-checking rather than a separately configurable "graph" surface. No public tool inspects Shopping Graph state directly.
- **Acceptance:** No SOP deliverable presents "optimizing for the Shopping Graph" as a distinct checklist item beyond the feed/markup consistency and eligibility checks already documented (ECOM-01, ECOM-02, ECOM-09).
- **Verify:** `grep -rni "shopping graph" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/product for the markup+feed framing; broader "Shopping Graph" characterization beyond that relationship is `Convention — not vendor-confirmed` — no single Google-owned canonical technical explainer was located
- **Tools:** Not applicable — no public tool inspects Shopping Graph state.
- **Anti-patterns:** Treating "Shopping Graph optimization" as a purchasable service or a distinct technical checklist separate from getting `Product`/`Offer` markup and the Merchant Center feed right and mutually consistent.
- **CleanStart:** N/A

---

### ECOM-17 — Structured data is an eligibility mechanism, never a documented ranking factor

- **Severity:** P3
- **Applies:** Always, wherever this module is consulted
- **Rule:** Do not state or imply that adding `Product`, `Offer`, or `Review` structured data directly improves organic ranking. Frame every benefit as eligibility for a specific SERP feature or display enhancement, never as a ranking boost.
- **Why:** Google's general structured-data policy states the opposite consequence model for violations: "A structured data manual action means that a page loses eligibility for appearance as a rich result; it doesn't affect how the page ranks in Google web search." The stated mechanism throughout every Tier 1 page reviewed for this module is eligibility for a SERP feature, never a ranking-signal claim.
- **Acceptance:** No client deliverable or internal document claims "schema helps you rank" — the supportable claim is "schema helps you display better and become eligible for richer SERP real estate."
- **Verify:** `grep -rni "schema.*rank" docs/seo/conditional/C2-ecommerce.md`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies (last updated 2026-07-10 UTC)
- **Tools:** Not applicable — no tool scores documentation framing.
- **Anti-patterns:** A frequently repeated practitioner claim that structured data of any kind is itself "a Google ranking factor" — unsupported by every Tier 1 source reviewed here.
- **CleanStart:** N/A

---

### ECOM-18 — Vehicle Listing markup is retired; migrate dealer/marketplace inventory to standard `Product` schema

- **Severity:** P3
- **Applies:** Any site previously using the Vehicle Listing structured-data type
- **Rule:** Do not implement or retain `Vehicle Listing` structured data for individual vehicle listings — this type was retired alongside six others (Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement) with Search Console/Rich Results Test support removed. Migrate individual vehicle listings to standard `Product`/`Offer` schema per ECOM-01/ECOM-02.
- **Why:** Trade-press retrospectives corroborate a June 2025 retirement with support removal effective 2025-09-09; the exact dates were not independently re-confirmed against a single Google-owned changelog entry in the underlying research pass, so treat the dates as `Convention — not vendor-confirmed` while treating the retirement's existence and direction as reasonably solid.
- **Acceptance:** No live markup on the site emits `"@type": "Vehicle"`/`"VehicleListing"` structured data; automotive inventory uses standard `Product`/`Offer` markup instead.
- **Verify:** `grep -rc "VehicleListing" apps/web/src`
- **Reference:** None — no reference implementation
- **Source:** Convention — not vendor-confirmed (trade-press retrospectives corroborate the retirement; exact dates not independently re-confirmed against a single Google-owned changelog entry)
- **Tools:** Rich Results Test no longer validates Vehicle Listing markup as of the documented removal date.
- **Anti-patterns:** Retaining legacy `VehicleListing` markup on the assumption it still renders a rich result — support was removed, not merely deprecated in future guidance.
- **CleanStart:** N/A

---

### ECOM-19 — Bing carries no independent, load-bearing Product/Offer/Review property spec beyond Google's

- **Severity:** P3
- **Applies:** Any e-commerce SEO engagement targeting Bing alongside Google
- **Rule:** Do not author a separate Bing-specific required/recommended property list for `Product`/`Offer`/`Review` markup — none was found to exist at comparable depth to Google's documentation. Treat Bing Webmaster Tools' schema validator as a supporting, lower-detail data point, not an independent source of distinct requirements.
- **Why:** Bing Webmaster Tools ships a Schema Markup Validator supporting Schema.org/Microdata/RDFa/OpenGraph and references Review and Product schema as inputs to Bing Copilot's comparison-style commercial-query answers, but no dedicated Bing property-level spec comparable to Google's was located in the underlying research pass.
- **Acceptance:** No internal deliverable claims a Bing-specific required-property list for Product/Offer/Review distinct from the Google-derived rules in this module.
- **Verify:** `grep -rni "bing.*product.*required" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] General Bing Webmaster Tools documentation on structured data validation (source class confirmed; thin — no independent load-bearing rule drawn from it)
- **Tools:** Bing Webmaster Tools Schema Markup Validator, for general syntax validation only.
- **Anti-patterns:** Assuming Google-compliant `Product`/`Offer` markup automatically satisfies some distinct, undocumented Bing-specific requirement.
- **CleanStart:** N/A
