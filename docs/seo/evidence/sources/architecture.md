# Site & URL Architecture — SEO Requirements (Primary-Source Evidence)

Compiled 2026-07-29. Scope: URL structure/naming, trailing-slash/case consistency, site depth/click distance, internal linking, orphan pages, breadcrumbs, pagination, XML sitemap protocol, `lastmod` semantics, HTML sitemaps, faceted navigation.

**Tiering key:** Tier 1 = official spec/vendor doc (Google Search Central, sitemaps.org, Bing Webmaster docs, IETF/W3C). Tier 2 = first-party platform engineering docs (Next.js/Vercel). Tier 3 = named, dated empirical study with published methodology. Tier 4 = practitioner consensus / agency content — supporting evidence only, never load-bearing on its own.

---

## 1. URL structure and naming

**Rule:** Use short, human-readable, hyphen-separated paths built from real words that describe the content, not database IDs, and keep parameter counts minimal.

**Mechanism:** Googlebot parses URL path text as a weak topical signal during crawling/indexing, and complex multi-parameter URLs create combinatorial URL spaces that consume crawl capacity, causing under-crawling of a site rather than a ranking penalty per se.

**Acceptance criterion:** Every published path segment is composed of dictionary/brand words joined by hyphens (`-`), contains no session IDs, tracking parameters, or auto-incrementing numeric IDs as the sole identifier, and total parameter count on any internally-linked URL is the minimum needed to render distinct content.

**Verification:** Crawl the site with a spec-compliant crawler (e.g., `screaming-frog --headless --crawl-list urls.txt`) and grep the URL list for `_`, digit-only final segments, or more than 2 query parameters; manually confirm each flagged URL against the rule.

**Source:** [URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure) — Tier 1 (Google Search Central). Supplementary: [Ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites) — Tier 1.

**Anti-patterns:** `/product/3243` instead of `/product/black-t-shirt-with-a-white-collar`; underscore-separated words (`/black_t_shirt`); duplicated parameter keys (`?type=candy&type=sweet` — Google states "Googlebot may ignore one of the values otherwise," recommend `?type=candy,sweet` instead); internally linking to session IDs, tracking codes, or timestamps in the URL.

---

## 2. Trailing-slash and case consistency

**Rule:** Pick one canonical form — trailing slash or not, one case — for every path and apply it identically in every internal link, redirect rule, and canonical tag; never let both forms resolve as separate 200 responses.

**Mechanism:** Per IETF RFC 3986 §6.2.2 (case normalization) and the URI-equivalence principle in §6.2, only the *scheme* and *host* are case-insensitive — the *path* and *query* are case-sensitive character-for-character, and a trailing slash is a literal path character, so `/Page`, `/page`, and `/page/` are three distinct URIs unless a server explicitly normalizes them. Google's own crawler treats them as distinct: "Google treats both /APPLE and /apple as distinct URLs with their own content." Distinct-but-duplicate URLs get folded into a single canonical cluster by Google's dedup process, but which one is chosen is not guaranteed to be the operator's preference.

**Acceptance criterion:** For a sample of internal links (nav, footer, in-body, sitemap), 100% resolve directly (HTTP 200, no redirect hop) to the single canonical case/slash form; the non-canonical form 301-redirects to it.

**Verification:** `curl -sI https://example.com/Page` and `curl -sI https://example.com/page/` — confirm exactly one returns 200 and any variant returns a 301 to that same normalized URL. Cross-check `next.config.js` `trailingSlash` setting matches what's actually served.

**Source:** [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) §6.2.2, §5.4.1 — Tier 1 (IETF). [URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure) (case-sensitivity quote) — Tier 1. [Consolidating duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/canonicalization) (HTTP/HTTPS, protocol variants as duplicate-cause examples; Google notes deduping factors "whether the page is served over HTTP or HTTPS, redirects, presence of the URL in a sitemap, and rel=canonical") — Tier 1. Platform config: [Next.js `trailingSlash`](https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash) — Tier 2 (default: strips trailing slash, redirecting `/about/` → `/about`; static-file paths and `.well-known/` are exempted).

**Anti-patterns:** Serving both `/Page` and `/page` as independent 200s with different or even identical content (creates duplicate-content ambiguity Google must resolve algorithmically); toggling `trailingSlash` in `next.config.js` without also auditing hardcoded internal `<Link>` hrefs, which produces an internal redirect chain on every nav click.

---

## 3. Site depth and click distance

**Rule:** Prioritize discoverability signals (internal link volume/context, sitemap presence, external popularity) over any fixed click-count target; do not design navigation around a "3 clicks from home" ceiling.

**Mechanism — what Google actually documents:** Google's crawl-budget guidance ties **crawl demand** to three factors it names explicitly — "perceived inventory," "popularity" ("URLs that are more popular on the Internet tend to be crawled more often"), and "staleness" — with no numeric click-depth threshold anywhere in the official doc. Google discovers pages "by accessing URLs found in previously crawled pages," so a page many hops from the homepage is discovered later/less often only insofar as it is *less linked-to*, not because a click-count ceiling exists.

**Mechanism — why "three clicks" itself is unsupported (see §Debunked below).**

**Acceptance criterion:** Every page the operator wants indexed is reachable via at least one crawlable `<a href>` chain from the homepage (any depth), AND every such page appears in a submitted, valid `<lastmod>`-bearing XML sitemap entry as a discovery backstop.

**Verification:** Run a full crawl from the homepage only (no seed list) with a standard crawler; diff the crawl-reachable URL set against the full sitemap URL set — any sitemap URL absent from the crawl-reachable set is a candidate orphan/deep page requiring an added internal link, regardless of its click depth.

**Source:** [Large site owner's guide to managing crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget) — Tier 1 (Google Search Central; confirmed the doc does **not** state a click-depth or hop-count threshold). [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) ("Googlebot and other web crawlers crawl the web by accessing URLs found in previously crawled pages") — Tier 1.

**Anti-patterns:** Flattening navigation into an unusably dense mega-menu purely to satisfy an arbitrary "3-click" rule at the cost of information scent and category clarity (see §Debunked).

---

## 4. Internal linking and link equity flow

**Rule:** Link to every page you want to rank from at least one other indexed, contextually-relevant page, using descriptive (non-generic) anchor text.

**Mechanism:** Google's own crawlability spec requires a real `<a>` element with a resolvable `href` — "Google can only crawl your link if it's an `<a>` HTML element with an `href` attribute" — and explicitly states links built only from `onclick` or non-anchor elements are not reliably parsed. Anchor text is read as a relevance signal: "paying more attention to the anchor text used for internal links can help both people and Google make sense of your site." Google's public documentation does **not** use the term "PageRank" or describe a quantified equity-transfer mechanism in current Search Central pages (see §Debunked) — the documented mechanism is discovery + topical-relevance signaling, not a named point-value transfer.

**Acceptance criterion:** Every indexable page has ≥1 inbound internal link from another indexed page, rendered as a static `<a href="...">` in the server-rendered/initial HTML (verifiable without executing JS), with non-generic anchor text (not "click here" / "read more").

**Verification:** Fetch the page with `curl` (no JS execution) and grep for `<a href` pointing at the target URL; cross-reference against Search Console's "Pages > Not indexed" and internal-links reports (GSC's Links report lists top internally-linked pages — a page absent from that report with 0 internal links is exposed directly).

**Source:** [Make your links crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) — Tier 1. [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) (site organization, anchor-text guidance) — Tier 1.

**Anti-patterns:** JS-only `onclick` navigation with no underlying `href`; link text that is generic across the whole site (all links reading "learn more"); orphaning new content by publishing without adding it to any hub/listing page.

---

## 5. Orphan pages

**Rule:** Every page intended for indexing must be reachable through the site's own crawlable link graph, not solely through the sitemap or external backlinks.

**Mechanism:** Google's documented discovery path is link-graph traversal ("crawl the web by accessing URLs found in previously crawled pages"); a sitemap is Google's own stated fallback for exactly this gap — "You might need a sitemap if... your site is new and has few external links to it" or is "comprehensively linked internally" is explicitly given as a condition under which a sitemap becomes *unnecessary*. A page reachable only via sitemap or an external link still receives no internal contextual/relevance signal (§4), so it can be indexed but is structurally disadvantaged relative to a linked page — this is Google's own logical implication of the discovery + relevance-signal mechanisms in §3–4, not a page Google separately labels "orphan" anywhere in its own docs (that term is a practitioner label — Tier 4 — applied to a Tier 1-documented gap).

**Acceptance criterion:** Zero URLs exist in the published XML sitemap that cannot also be reached by a same-site crawl starting only from the homepage and standard navigation (no sitemap seed).

**Verification:** `diff` the sitemap URL list against a homepage-seeded crawl's URL list; any sitemap-only URL is an orphan candidate and needs an added internal link (hub page, related-content module, or nav entry).

**Source:** [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) — Tier 1 (states the ~500-page / "comprehensively linked internally" threshold at which a sitemap becomes optional, implying reliance on sitemap-only discovery is the exception, not the design target). No Tier 1 source defines "orphan page" as a named concept; the definition itself is Tier 4 practitioner terminology (e.g. industry glossaries), included here only as a label for the Tier-1-documented condition above.

**Anti-patterns:** Publishing content, adding it only to the XML sitemap, and never linking it from any category/listing/related-content module.

---

## 6. Breadcrumb structure

**Rule:** Mark up a logical (not necessarily URL-mirroring) navigation path with schema.org `BreadcrumbList`, omitting the homepage and current-page nodes.

**Mechanism:** Google parses `BreadcrumbList` → `ListItem` (`position`, `name`, optional `item` URL) to build the breadcrumb trail shown under a result in search, and to help "categorize the information from the page in search results" contextually per query — it is a search-appearance/categorization signal, not a ranking-boost mechanism as such.

**Acceptance criterion:** Every non-homepage indexable page emits valid `BreadcrumbList` JSON-LD (or Microdata/RDFa) with sequential `position` integers starting at 1, at least 2 `ListItem`s, no `ListItem` for the site root or the current page itself, and passes Google's Rich Results Test with zero errors.

**Verification:** `curl` the rendered page HTML, extract the `application/ld+json` block(s), validate against the `BreadcrumbList` schema, then run the URL through Google's [Rich Results Test](https://search.google.com/test/rich-results) and confirm "Breadcrumbs" is detected with no errors.

**Source:** [Breadcrumb (BreadcrumbList) structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) — Tier 1.

**Anti-patterns:** Mirroring the raw URL path as the breadcrumb trail when the actual user journey differs (Google explicitly recommends the user-path over URL-mirroring); including a `ListItem` for the domain root or for the current page (both are stated as unnecessary, not merely optional).

---

## 7. Pagination — and what replaced `rel=next/prev`

**Rule:** Give every page in a paginated sequence its own unique, crawlable URL and its own self-referencing canonical tag (unless a true "View All" page exists, in which case all paginated variants canonicalize to it) — do **not** implement `rel="next"`/`rel="prev"` as an SEO mechanism.

**Mechanism:** Google's current, standing guidance states plainly: "In the past, Google used `<link rel="next">` and `<link rel="prev">`... Google no longer uses these tags, although these links may still be used by other search engines." Discovery instead relies on standard link-graph crawling of the numbered/next-page anchors: "Give each page a unique URL... as URLs in a paginated sequence are treated as separate pages by Google." For JS-driven "load more"/infinite scroll, the stated mechanism is that Googlebot "generally [doesn't] trigger JavaScript functions that require user actions," so each increment needs its own real URL reachable independent of the button/scroll event (e.g., via the History API updating the URL, or server-rendered paginated URLs).

**Acceptance criterion:** For any paginated series, `curl` each page N and confirm (a) a unique URL exists for it, (b) its `rel="canonical"` points to itself (not page 1), unless a View All page is canonical for the whole series, and (c) the underlying content is reachable at that URL without executing a click/scroll event.

**Verification:** `curl -s https://example.com/category?page=2 | grep -o 'rel="canonical"[^>]*'` for each page in the sequence; confirm no two pages share the same canonical target unless a View All page is the deliberate design.

**Source:** [Pagination and incremental page loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) — Tier 1 (current, active Google Search Central doc; this is the doc that superseded rel=next/prev guidance).

**Deprecation flag (materially changed within last 24 months window of "current"):** `rel="next"`/`rel="prev"` was announced dead by Google in March 2019 — outside the strict last-24-months window, but still the single most-repeated-yet-stale piece of pagination advice in circulation, and the currently active Google doc explicitly still calls this out by name as a thing Google "no longer uses," confirming the guidance remains unretracted as of 2026. Corroborating reporting: [Search Engine Land, "Google hasn't supported rel=next/prev for a while"](https://searchengineland.com/google-no-longer-supports-relnext-prev-314319) (returns 403 to automated checks; verified manually 2026-07-29) — Tier 4 (secondary reporting of the primary 2019 Google Search Central announcement; included because the original Google Search Central blog post URL from March 2019 could not be independently re-retrieved during this research pass — flagged rather than fabricated).

**Anti-patterns:** Implementing `rel=next/prev` today believing it aids indexing or ranking; canonicalizing every paginated page back to page 1 (Google: "Don't use the first page of a paginated sequence as the canonical page"); using URL fragments (`#page=2`) for pagination state (Google: "Google ignores fragment identifiers"); relying on infinite scroll/"load more" with no discrete underlying URL per increment.

---

## 8. XML sitemap protocol — size, count limits, and sitemap index files

**Rule:** Keep each sitemap file ≤50,000 URLs and ≤50MB uncompressed; once exceeded, split into multiple sitemaps referenced by a sitemap index file rather than truncating content.

**Mechanism:** The sitemap protocol itself hard-caps a single file, and Google Search Console additionally caps the *index* structure it will accept: a sitemap index may reference up to 50,000 child sitemaps, and an account may submit up to 500 index files per site.

**Acceptance criterion:** Every individual `.xml` sitemap file on the site is ≤50,000 `<url>` entries and ≤50MB uncompressed (52,428,800 bytes); if a sitemap index is used, it has ≤50,000 `<sitemap>` entries; the total submitted index-file count for the property is ≤500.

**Verification:** `curl -s https://example.com/sitemap.xml | grep -c '<url>'` and `curl -sI` (or `wc -c` on downloaded body) for byte size; validate index files similarly counting `<sitemap>` entries; confirm in Google Search Console's Sitemaps report that each submitted file shows "Success" with no "couldn't fetch"/size errors.

**Source:** [sitemaps.org Protocol](https://www.sitemaps.org/protocol.html) — Tier 1 (the underlying multi-engine spec; defines the 50,000 URL / 50MB cap and the `<sitemapindex>`/`<sitemap>` index format). [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [Manage large sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps) — Tier 1 (Google-specific: confirms the 50MB/50,000-URL cap, adds the 500-index-file-per-property and 50,000-sitemap-per-index limits, and requires referenced sitemaps be co-located at the index file's directory level or deeper).

**Anti-patterns:** Shipping one 200,000-URL sitemap and expecting full processing; nesting a sitemap index inside another sitemap index (not supported by the protocol); hosting referenced sitemaps on a different subdirectory shallower than the index file without using Search Console's explicit cross-directory/cross-site verification path.

---

## 9. `lastmod` semantics — and whether search engines actually honour it

**Rule:** Set `<lastmod>` to the true date of a *meaningful* content change (body copy, structured data, or link changes) — never to the sitemap-generation timestamp, and never bump it for trivial edits (e.g., a footer copyright year).

**Mechanism (Google):** Google states it will use `<lastmod>` as a recrawl-scheduling signal "if it's consistently and verifiably accurate" — i.e., Google's trust in the field is conditional and site-specific; a history of inaccurate `lastmod` values (bumped without real changes) causes Google to discount or ignore the field for that site going forward. This directly contradicts the common practitioner habit of touching `lastmod` on every deploy.

**Mechanism (Bing):** Bing's documentation treats `lastmod` more assertively as an operational signal: it "remains a key signal, helping Bing prioritize URLs for recrawling and reindexing, or skip them entirely if the content hasn't changed" — Bing states it attempts to fetch sitemaps "at least once a day except your lastmod tells them that your sitemaps didn't change," i.e., an accurate unchanged `lastmod` can suppress a refetch entirely.

**Mechanism (protocol):** The sitemaps.org spec itself only says `lastmod` "should be set to the date the linked page was last modified, not when the sitemap was generated" — it does not mandate engine behavior; each engine's use of the field is a matter of that engine's own trust heuristics, not the protocol.

**Acceptance criterion:** For a sample of 20 recently-touched pages, `<lastmod>` in the sitemap matches (same day) the CMS's own "last significant content update" timestamp, not the sitemap file's generation time or a cosmetic-edit timestamp; sitemap-generation code sources this field from a content-versioning timestamp, not `Date.now()` at build time.

**Verification:** Compare `<lastmod>` per URL against the CMS's content-revision history for that document; flag any sitemap where every URL shares the identical `lastmod` timestamp (a strong signal the field is stamped at build time, not per-content-change) — this pattern is explicitly a stated cause of Google discounting the field.

**Source:** [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — Tier 1 (Google conditional-trust language). [sitemaps.org Protocol](https://www.sitemaps.org/protocol.html) — Tier 1 (field definition, W3C Datetime format, "not when the sitemap was generated"). Bing: reported via [Bing Webmaster Blog, "Keeping Content Discoverable with Sitemaps in AI Powered Search"](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search) — Tier 1 (first-party Bing Webmaster blog, but note: this is Bing's blog, not a formal spec page; treated as Tier 1 vendor documentation, one tier below a dedicated help-doc page).

**Anti-patterns:** A sitemap generator that stamps every `<lastmod>` with the current build/deploy time regardless of whether that page's content changed; bumping `lastmod` to game recrawl frequency without a real content change (erodes trust in the signal per Google's own stated conditionality).

---

## 10. HTML sitemaps

**Rule:** Do not build a user-facing HTML sitemap as a substitute for real site navigation; invest in navigation and internal linking instead. An HTML sitemap is not part of Google's documented indexing or ranking mechanism.

**Mechanism:** Google's Search Central documentation on sitemaps addresses only the XML format; it contains no guidance recommending or requiring an HTML sitemap page. Google's own Search Advocate stated directly (Mastodon, 2022): "I changed my mind on HTML sitemaps over the years, they should never be needed. Sites small & large should always have a clear navigational structure. If you feel the need for a HTML sitemap, spend the time improving your site's [navigation]." This is a spokesperson statement made on a public social channel, not a formal Search Central doc — the exact original post could not be fully re-rendered by this research pass (Mastodon serves a truncated preview to non-authenticated fetches), so it is corroborated via contemporaneous press coverage rather than quoted from a re-verified live page.

**Acceptance criterion:** The site's primary discovery path for any indexable page is the standard nav/footer/hub-page link graph (§4); if an `/sitemap` (HTML) page exists, it is a secondary UX convenience only, not the mechanism by which any page becomes reachable (i.e., removing it produces zero orphan pages per the §5 test).

**Verification:** Run the §5 orphan-page diff with the HTML sitemap page's outbound links excluded from the crawl seed set; confirm the reachable-URL set is unchanged.

**Source:** [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) — Tier 1 (XML-only scope, silence on HTML sitemaps as a Google mechanism). John Mueller (Google Search Advocate), [Mastodon post](https://mastodon.social/@johnmu/109477617298107922), Dec 2022 — Tier 1 (official spokesperson, informal channel — not a documented spec page); corroborated by [Search Engine Roundtable, "Google Says HTML Sitemaps Should Never Be Needed"](https://www.seroundtable.com/google-html-sitemaps-not-needed-34537.html) — Tier 4 (contemporaneous reporting, used to confirm quote/date because the primary post rendered only a truncated preview).

**Anti-patterns:** Treating an HTML sitemap page as a fix for poor navigation/IA rather than fixing the navigation itself; letting the HTML sitemap become the *only* link path to deep pages (reintroduces the exact fragility it was meant to patch).

---

## 11. Faceted navigation basics

**Rule:** Choose one deliberate crawl-control strategy for filter/facet URLs (robots.txt disallow of filter parameters, hash-fragment-based filtering, or consistent-order canonicalization) rather than letting the combinatorial filter space crawl freely; standardize on `&` as the parameter separator; return real 404s for empty-result filter combinations.

**Mechanism:** Google states faceted navigation "is by far the most common source of overcrawl issues site owners report." Uncontrolled facet combinations create a combinatorially large URL space that competes for the same crawl-capacity budget (§3) as the canonical/product pages the operator actually wants crawled and indexed, so unmanaged facets can starve discovery of the intended content rather than adding indexable value.

**Acceptance criterion:** Pick one: (a) `robots.txt` disallows the specific filter query-parameter patterns (e.g., `Disallow: /*?*color=`) while the unfiltered category URL stays crawlable; or (b) filters are implemented as URL fragments (`#color=green`), which Google states it does not crawl/index; or (c) filter URLs are crawlable but every combination emits a consistent parameter order, uses `&` as the sole separator, and duplicate parameter keys never occur. Additionally: any filter combination yielding zero results returns a literal HTTP 404 status on that specific URL, not a redirect to a generic error page.

**Verification:** Fetch a sampled matrix of facet-URL combinations; confirm parameter order is identical regardless of UI click sequence; confirm separator is exclusively `&` (grep for `,`/`;`/`[`/`]` in query strings); request a known-empty combination and confirm `curl -sI` returns `404`, not `200` or a `302` to `/`.

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation) — Tier 1 (Google Crawling Infrastructure docs; this is a distinct, more recent Google doc than the general URL-structure page, published under `developers.google.com/crawling/`). Corroborating announcement: [Crawling December: Faceted navigation](https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav) — Tier 1 (Google Search Central Blog, Dec 2024).

**Anti-patterns:** Using commas, semicolons, or brackets as facet-parameter separators (Google states these are "hard for crawlers to detect as parameter separators"); redirecting empty-filter-result URLs to a generic soft-404 landing page instead of serving a real 404 on that URL; allowing filter order to vary (`?color=red&size=m` and `?size=m&color=red` both live) without canonicalizing to one order — doubles the crawlable space for identical content.

---

## Flagged: deprecated or materially changed guidance

1. **`rel="next"`/`rel="prev"` pagination markup — dead since 2019, still the most commonly repeated stale advice.** Google's own currently-active pagination doc states it plainly: Google "no longer uses these tags." The retirement itself predates the 24-month window (announced March 2019), but it is flagged here because (a) it remains actively repeated in current practitioner content dated 2025–2026, and (b) Google's live documentation still finds it necessary to explicitly disclaim the tags by name — evidence the folklore hasn't died even though the mechanism has. Current replacement mechanism: unique per-page URLs + self-referencing (or View-All) canonicals + standard link-graph crawling, per [Pagination and incremental page loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).
2. **Faceted-navigation guidance got a dedicated, more assertive Google doc in 2024.** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation) is a newer, more operationally specific document (hosted under the newer `developers.google.com/crawling/` docs tree) than the general URL-structure page, published alongside the December 2024 "Crawling December" blog series — teams following only the older general URL-structure doc will miss the current robots.txt-disallow-first recommendation and the explicit 404-for-empty-filters rule.

## Flagged: practitioner claims not supported by the primary sources

1. **The "three clicks from home" rule.** No Google Search Central document states or implies a click-count ceiling; Google's own crawl-budget doc names *popularity*, *perceived inventory*, and *staleness* as its crawl-demand factors — click depth is not among them. The rule's debunking is itself well-sourced: Joshua Porter's 2003 usability study (620 tasks, 44 users) found no dropoff after the third click, and Jakob Nielsen/NN Group separately found "users' ability to find products on an e-commerce site increased by 600 percent after the design was changed so that products were 4 clicks from the homepage instead of 3" — i.e., the empirical evidence runs in the *opposite* direction from the folklore. Source: [NN/g, "The 3-Click Rule for Navigation Is False"](https://www.nngroup.com/articles/3-click-rule/) — Tier 3 (named, dated study with published methodology).
2. **Sitemap `priority` and `changefreq`.** Both fields are real, defined parts of the sitemaps.org protocol — but Google states plainly that it "ignores" both. The protocol itself calls `changefreq` "a hint and not a command" and states `priority` "does not affect how your pages are compared to pages on other sites" (i.e., it was never claimed to be a cross-site ranking lever, only a same-site relative-importance hint, and even that limited use is not honoured by Google in practice). Any SOP time spent hand-tuning these two fields per-URL is close to wasted effort for Google specifically; Bing's stance on these two specific fields was not independently confirmed in this research pass and should be treated as unverified rather than assumed identical.
3. **"Internal links pass PageRank/link equity" as a quantified transfer.** This is the standard practitioner mental model, but current Google Search Central documentation (the pages actually cited above — links-crawlable, SEO starter guide) frames internal links only in discovery + anchor-text-relevance terms, and does not use the term "PageRank" or describe a quantified per-link equity transfer anywhere in the pages checked. The underlying PageRank algorithm is real and historically documented (Google's original patent), but its current operational role and exact mechanics inside modern ranking are not spelled out in the consumer-facing docs — teams should treat "link equity flows through internal links" as directionally true (more/better internal links → better discovery and relevance signaling) but avoid treating it as a literally-quantified budget Google publishes a formula for.

---

## Sources not independently re-verified (flagged, not fabricated)

- The original March 2019 Google Search Central Twitter/blog announcement retiring `rel=next/prev` could not be re-fetched directly during this pass; the claim is corroborated by Search Engine Land's contemporaneous report and by the still-live current Google doc's own retrospective statement, both cited above.
- John Mueller's full original Mastodon post (Dec 2022) on HTML sitemaps rendered as a truncated preview under automated fetch; the quote is corroborated via Search Engine Roundtable's contemporaneous coverage, cited above.
- Bing's dedicated sitemap help page (`bing.com/webmasters/help/sitemaps-3b5cf6ed`) returned only a title with no body content to this pass's fetcher; Bing sitemap facts in §8–9 above are instead sourced from Bing's own Webmaster Blog post (a first-party but less formal channel than a help-doc page) — flagged as a slightly weaker Tier-1 instance than the Google Search Central help pages used elsewhere.
