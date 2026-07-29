# Site & URL Architecture

**Module:** 02 — Site & URL architecture
**Prefix:** `ARCH`
**Scope:** Taxonomy, route naming, trailing-slash/case consistency, site depth, internal linking, orphan prevention, breadcrumbs, pagination, XML sitemap protocol, `lastmod` semantics, HTML sitemaps, faceted navigation, and the redirect-resolution architecture that keeps a site's URL graph coherent across renames and migrations. Authored per the rule-block format, severity model, evidence tiers, and verdict vocabulary defined in `00-index.md` — read that module first if any field below is unclear.

**Review cadence:** Semi-annual (per `00-index.md` §9).

Every correction flagged against this domain in `docs/seo/evidence/verification-log.md` §1 (items 3 and 4) has been applied below: the Bing `lastmod` claim is restated to say Bing checks sitemaps at least daily *unconditionally*, using `lastmod` only to prioritize which URLs get recrawled — not that an unchanged `lastmod` suppresses the refetch; and the Nielsen/NN Group "600 percent, 3-to-4-click" figure is not restated, since the cited NN/g article contains neither that figure nor the phrase "four clicks" — only the weaker, supported claim (Joshua Porter's 2003 study found no measurable click-depth dropoff) is carried forward.

---

### ARCH-01 — Previously-published URLs must redirect or 410 — never a silent 404

- **Severity:** P0
- **Applies:** Always — any site with a URL history (renames, migrations, retired campaign/event pages)
- **Rule:** Every URL that was ever live, linked, or indexed before a rename, migration, or retirement must resolve, through the site's own redirect-resolution mechanism, to a real HTTP redirect (301/308 to a live replacement) or a genuine 410 — never a bare, un-redirected 404.
- **Why:** RFC 9110 §15.5.5 defines 404 precisely as absence of a representation, not as a migration signal: "The 404 (Not Found) status code indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists." Google's own sitemaps documentation states discovery happens by "accessing URLs found in previously crawled pages" — a URL that 404s stops contributing that signal. Google's own guidance further states that crawl frequency to a URL gradually decreases the longer it persists in an error state, and that a URL confirmed 404 is dropped from the index; a 404 in place of a documented redirect throws away exactly the two things — the URL's queued discovery/crawl equity — a working redirect would have preserved.
- **Acceptance:**
  - Every path listed as migrated in the site's own migration record, prior sitemaps, or the CMS's own redirect-collection intent resolves at runtime to a 301/308 (to a live replacement) or an intentional 410 — never an un-redirected 404
  - The redirect-resolution mechanism runs before the request reaches route-level rendering, for 100% of the URLs it is meant to cover
  - No previously-live path 404s solely because its redirect row was never created, even though a migration record lists it as handled
- **Verify:** `curl -sI https://www.cleanstart.com/<legacy-path> | head -1` → `HTTP/2 301` or `308` (never `404`) for any path documented as migrated
- **Reference:** `apps/web/src/proxy.ts:136-160` (`lookupRedirect`); `apps/cms/src/payload/collections/Redirects.ts:29-146`; `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:4-5` (`MAX_HOPS`/`FLATTEN_AFTER_HOPS`); `apps/web/src/lib/redirects-cache.ts:37-97`
- **Source:** [Tier 1] RFC 9110 §15.5.5, https://www.rfc-editor.org/rfc/rfc9110 (404 semantics, verbatim per verification-log correction #16); [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview (link-graph discovery mechanism)
- **Tools:** Ahrefs "404 page" — Error, the tier that reduces Health Score; Semrush "Pages returning 4XX status code" — Error; Screaming Frog "Internal Client Error (4XX)" — Issue, High
- **Anti-patterns:** Documenting a redirect mapping in a migration record or spreadsheet and never seeding the corresponding row in the live redirect table, so the mapping exists only on paper while the URL 404s; treating "the redirect architecture is well-designed" as equivalent to "every URL that needs a row has one."
- **CleanStart:** Fail

  `docs/seo/evidence/live-capture.json` (captured 2026-07-29, `control:legacy-redirect:*` entries) shows 12 of 13 documented legacy URLs return a bare `404` instead of the 301/308 the redirect architecture is designed to issue: `/acceptable-use-policy`, `/leadership`, `/search`, `/survey`, both `/webinar/secure-containers-end-to-end-...` slugs, `/new-year-event-sysdig`, `/new-year-event-eventus`, and all four `/cleanstart-hitachi-*`/`/cleanstart-raksha-chennai` event pages. Only `/pricing` returns `200` in that same control set — because it is in fact a live, fully built page (`apps/web/src/app/pricing/page.tsx`), not a stale redirect target; see ARCH-13 for the related dead-code finding one layer up in the same subsystem. The three-layer redirect mechanism itself (`next.config.ts` → `proxy.ts` → the CMS `Redirects` collection, with its cycle guard) functions correctly where a row exists — the failure is that these 12 known URLs have no row in the table at all, not that the mechanism misfires when invoked.

---

### ARCH-02 — One canonical form per path — trailing slash and case never diverge

- **Severity:** P1
- **Applies:** Always
- **Rule:** Pick one canonical form — trailing slash or not, one case — for every path, and apply it identically in every internal link, redirect rule, and canonical tag; never let both forms resolve as separate `200` responses.
- **Why:** Per RFC 3986 §6.2.2 and §5.4.1, only the *scheme* and *host* of a URI are case-insensitive — the *path* and *query* are case-sensitive character-for-character, and a trailing slash is a literal path character, so `/Page`, `/page`, and `/page/` are three distinct URIs unless a server explicitly normalizes them. Google's own guidance confirms its crawler treats them as distinct: "Google treats both /APPLE and /apple as distinct URLs with their own content." Distinct-but-duplicate URLs eventually get folded into one canonical cluster by Google's own dedup process, but which variant is chosen is not guaranteed to be the operator's preference.
- **Acceptance:**
  - For a sample of internal links (nav, footer, in-body, sitemap), 100% resolve directly (HTTP 200, no redirect hop) to the single canonical case/slash form
  - The non-canonical form 301/308-redirects to the canonical form
  - The framework's own trailing-slash configuration (e.g. Next.js `trailingSlash`) is not left to silently disagree with what middleware/redirects actually enforce
- **Verify:** `curl -sI https://www.cleanstart.com/About-Us | head -1` → `308` to `/about-us`
- **Reference:** `apps/web/src/proxy.ts:60-66` (`shouldRedirectTrailingSlash`), `apps/web/src/proxy.ts:68-76` (`shouldLowercase`), applied in order at `apps/web/src/proxy.ts:104-114`
- **Source:** [Tier 1] RFC 3986, https://www.rfc-editor.org/rfc/rfc3986 §6.2.2, §5.4.1; [Tier 1] https://developers.google.com/search/docs/crawling-indexing/url-structure (case-sensitivity quote); [Tier 2] https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash
- **Tools:** No surveyed tool publishes a distinct "trailing-slash/case" issue class (see `docs/seo/evidence/tool-scoring.md`); each vendor folds this into its generic duplicate-content and canonicalization checks.
- **Anti-patterns:** Toggling a framework's trailing-slash setting without also auditing hardcoded internal `<Link>` hrefs, producing an internal redirect chain on every nav click; relying on a framework default alone to handle case, since most frameworks only normalize the slash, not the case.
- **CleanStart:** Pass

  `proxy.ts` enforces both rules explicitly in middleware, ahead of any CMS/rendering work: `shouldRedirectTrailingSlash` strips a trailing slash (308) except on file-style paths, and `shouldLowercase` lowercases any path containing uppercase characters (308) except the intentionally-mixed-case `/guide-cover/*` image route, a documented exception. `next.config.ts` sets no explicit `trailingSlash` option, so Next's own default (strip) reinforces rather than conflicts with the middleware rule.

---

### ARCH-03 — Indexable pages need a real, crawlable inbound link with descriptive anchor text

- **Severity:** P1
- **Applies:** Always
- **Rule:** Link to every page intended to rank from at least one other indexed, contextually relevant page, using descriptive (non-generic) anchor text, rendered as a real `<a href>` in server-rendered/initial HTML.
- **Why:** Google's crawlability documentation requires a real `<a>` element with a resolvable `href` — "Google can only crawl your link if it's an `<a>` HTML element with an `href` attribute" — and states links built only from `onclick` or non-anchor elements are not reliably parsed. Anchor text is read as a topical-relevance signal: "paying more attention to the anchor text used for internal links can help both people and Google make sense of your site." Current Google Search Central documentation frames internal links only in discovery + anchor-text-relevance terms, and does not use the term "PageRank" or describe a quantified per-link equity transfer anywhere in these pages — this is stated with confidence, not hedged, because it survived an independent adversarial re-verification pass that specifically tried to refute it (`verification-log.md`, Architecture claim C).
- **Acceptance:**
  - Every indexable page has ≥1 inbound internal link from another indexed page
  - That link is a static `<a href="...">` present in the server-rendered/initial HTML (verifiable without executing JS)
  - Anchor text is non-generic (not "click here" / "read more" sitewide)
- **Verify:** `curl -s https://www.cleanstart.com/guide/attack-surface-reduction-vs-vulnerability-management | grep -c '<a href'`
- **Reference:** `apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx:32-83` (confirmed real `<a>`-based breadcrumb rendering; no repo-wide nav/footer/hub-link audit was performed for this module)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/links-crawlable; [Tier 1] https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- **Tools:** Ahrefs "Page has links to broken page" — Error (adjacent issue class; no surveyed tool separately tiers "JS-only navigation" by name)
- **Anti-patterns:** JS-only `onclick` navigation with no underlying `href`; generic anchor text repeated sitewide; publishing content and adding it only to the XML sitemap with no inbound content link (see ARCH-04).
- **CleanStart:** Fail

  The one internal-link mechanism directly inspected for this module — the shared `breadcrumbTrail()`/`HeroBreadcrumb` path — does render real `<a href>` elements. But a second, load-bearing hub-link mechanism was checked in this pass and fails outright: category/listing pages are the designated hub-link source for their own child detail pages, and — per ARCH-04's evidence, root-caused there in full — client-side-only listing pagination means only page-1 items receive a real `<a href>` from their hub page in server-rendered HTML. Measured real anchors versus sitemap counts: `/events` 0 of 23, `/news` 1 of 33, `/blogs` 9 of 68, `/resource-center` 9 of 30, `/guide` 16 of 51; `/careers` 17 of 17 is the clean control proving the gap isn't structural. Every item past page 1 of those five collections has zero qualifying inbound link from its own natural hub page — not an un-audited gap, a confirmed absence for that mechanism. Nav/footer/mega-menu markup was still not independently re-crawled in this pass, so this verdict rests on the hub-link mechanism specifically, not a full sitewide audit; re-run the Verify command across nav/footer samples before treating the rest of the site as settled.

---

### ARCH-04 — Every sitemap URL must also be reachable by a same-site crawl from the homepage

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every page intended for indexing must be reachable through the site's own crawlable link graph, not solely through the sitemap or external backlinks.
- **Why:** Google's documented discovery path is link-graph traversal; a sitemap is Google's own stated fallback for exactly this gap, and Google explicitly gives "comprehensively linked internally" as a condition under which a sitemap becomes *unnecessary* (implying reliance on sitemap-only discovery is the exception, not the design target, once a site exceeds roughly 500 pages). A page reachable only via sitemap still receives no internal contextual/relevance signal (ARCH-03), so it can be indexed but is structurally disadvantaged relative to a linked page.
- **Acceptance:** Zero URLs exist in the published XML sitemap that cannot also be reached by a same-site crawl starting only from the homepage and standard navigation (no sitemap seed).
- **Verify:** `diff <(curl -s https://www.cleanstart.com/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g' | sort) <(homepage-seeded-crawl-urls.txt | sort)`
- **Reference:** `apps/web/src/app/sitemap.ts:117-159` (the sitemap side of the comparison); no `sitemap.test.ts` exists in the repo, confirmed by directory listing
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- **Tools:** Ahrefs "Orphan page" — Error (reduces Health Score); Semrush "Orphaned pages" — Notice, explicitly excluded from Site Health. `tool-scoring.md`'s own Disagreement §1 flags this as the sharpest documented tool contradiction in the whole tool-reconciliation exercise; this SOP follows that document's mechanism-based reasoning rather than either vendor's flat tier — severity should hinge on whether the page is otherwise sitemap-linked/traffic-receiving (moderate) versus truly unreachable by any means (severe).
- **Anti-patterns:** Publishing content, adding it only to the XML sitemap, and never linking it from any category/listing/related-content module.
- **CleanStart:** Fail

  **Root cause, confirmed live, applying to ARCH-03 and ARCH-08 as well (stated once here, cross-referenced from both):** CleanStart's listing pages paginate and filter entirely client-side. `BLOGS_PAGE_SIZE = 9` (`apps/web/src/components/sections/blogs/BlogsContent.tsx:40`), and the equivalent `*Browser` component per collection is a `"use client"` component reading `useSearchParams()` inside a `<Suspense>` boundary whose server-rendered fallback — page 1 only — is what actually ships as static HTML for a same-site crawl seeded from the homepage with no JS execution. Measured real `<a href>` anchors in server-rendered HTML versus the sitemap's own `<loc>` count for the same collection: `/events` 0 of 23, `/news` 1 of 33, `/blogs` 9 of 68, `/resource-center` 9 of 30, `/guide` 16 of 51, `/careers` 17 of 17. `/careers` is the control case: it renders every item's link in server HTML with no client-side pagination gate, proving the other five collections' gap is a fixable implementation choice, not an inherent limit of the architecture. Every affected URL remains sitemap-discoverable — this is not an indexation-blocking defect — but that is exactly the condition this rule's acceptance criterion (reachable "by a same-site crawl starting only from the homepage and standard navigation," not sitemap alone) treats as insufficient, and per this rule's own `Why`, sitemap-only discovery forfeits the internal-link/anchor-text relevance signal ARCH-03 requires.
  `docs/seo/evidence/codebase-inventory.md` separately flags an open question under "URL Architecture & Sitemaps" not resolved by the above: whether `/pricing`'s sitemap inclusion reflects current intent versus a stale comment (`sitemap.ts:71` calls it "intentionally omitted," but code and the built page both include it — likely just a stale comment, not an orphan risk), and whether `SECTION_INDEX_REDIRECTS`' hardcoded targets for `/knowledge-hub` and `/legal` could silently diverge from what a live CMS-ordering-driven crawl would compute (see ARCH-13).

---

### ARCH-05 — Paginated pages need their own URL and correct canonical — `rel=next/prev` is dead

- **Severity:** P1
- **Applies:** Any listing/category page with more content than fits on one view
- **Rule:** Give every page in a paginated sequence its own unique, crawlable URL and its own self-referencing canonical tag (unless a true "View All" page exists, in which case all paginated variants canonicalize to it) — do **not** implement `rel="next"`/`rel="prev"` as an SEO mechanism.
- **Why:** Google's current, standing guidance states plainly: "In the past, Google used `<link rel="next">` and `<link rel="prev">`... Google no longer uses these tags, although these links may still be used by other search engines." This is stated with confidence, not hedged, per the source's own verification pass. Discovery instead relies on standard link-graph crawling of numbered/next-page anchors, and each page in the sequence is treated as a separate page by Google. For JS-driven "load more"/infinite scroll, Googlebot "generally [doesn't] trigger JavaScript functions that require user actions," so each increment needs its own real URL reachable independent of the click/scroll event.
- **Acceptance:**
  - A unique URL exists for each page in the sequence
  - Its `rel="canonical"` points to itself (not page 1), unless a View All page is canonical for the whole series
  - The underlying content is reachable at that URL without executing a click/scroll event
- **Verify:** `curl -s "https://www.cleanstart.com/blogs?page=2" | grep -o 'rel="canonical"[^>]*'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:186-206` (`buildListingMetadata` interface/docstring); the operative canonicalization line is `canonical.ts:212`; `apps/web/src/app/sitemap.ts:135-157` (per-document detail-page URLs, independent of the listing pagination)
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- **Tools:** No surveyed tool publishes a distinct pagination-canonicalization issue class; folded into each tool's generic canonical/duplicate-content checks.
- **Anti-patterns:** Implementing `rel=next/prev` today believing it aids indexing (dead since 2019, still the most-repeated stale pagination advice — Google's own currently-active doc still explicitly disclaims it by name); canonicalizing a paginated page back to page 1 while serving materially different content on it with no other discovery path.
- **CleanStart:** Partial

  No route in `apps/web` implements `rel="next"`/`rel="prev"` — clean on the dead-tag anti-pattern. But CleanStart's listing routes (`/blogs`, `/guide`, `/case-studies`, `/news`, etc.) have no server-rendered per-page URL at all: pagination and filtering are client-side, and `buildListingMetadata()` always self-canonicalizes to the bare `basePath` regardless of `?page=`/`?category=`/`?q=` (rationale: identical static HTML is served per query-string variant). This diverges from the source's literal "give each page a unique URL" requirement. The practical discovery gap that would otherwise create is closed by a different mechanism, not by this rule's own prescribed pattern: every individual blog/guide/news/event/job/resource/legal/knowledge-hub item already has its own independently sitemap-listed detail-page URL, so paginated-listing discoverability is never the sole path to any item on this site.

---

### ARCH-06 — Faceted/filter URLs need one deliberate crawl-control strategy

- **Severity:** P1
- **Applies:** Only if the site exposes filter/facet query parameters that produce multiple independently-crawlable URL variants of the same underlying content
- **Rule:** Choose one deliberate crawl-control strategy for filter/facet URLs — `robots.txt` disallow of filter parameters, hash-fragment-based filtering, or consistent-order canonicalization — rather than letting the combinatorial filter space crawl freely; standardize on `&` as the parameter separator; return real 404s for empty-result filter combinations.
- **Why:** Google states faceted navigation "is by far the most common source of overcrawl issues site owners report." Uncontrolled facet combinations create a combinatorially large URL space that competes for the same crawl-capacity budget as the canonical pages the operator actually wants crawled and indexed.
- **Acceptance:**
  - `robots.txt` disallows filter query-parameter patterns while the unfiltered category URL stays crawlable, **or**
  - Filters are implemented as URL fragments (not crawled/indexed by Google), **or**
  - Filter URLs are crawlable but every combination has consistent parameter order, uses `&` as the sole separator, and duplicate parameter keys never occur
  - Any filter combination yielding zero results returns a literal HTTP 404 on that specific URL, not a redirect to a generic error page
- **Verify:** `curl -sI "https://www.cleanstart.com/blogs?category=nonexistent-xyz" | head -1`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:186-206` (`buildListingMetadata` — filters are client-side and always self-canonicalize to `basePath`, one of the three acceptable strategies since it never exposes a distinct crawlable URL per filter combination)
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation; [Tier 1] https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav
- **Tools:** No surveyed tool publishes a distinct "faceted navigation" issue class; folded into each vendor's generic parameter-handling/duplicate-content checks.
- **Anti-patterns:** Commas, semicolons, or brackets as facet-parameter separators; redirecting empty-filter-result URLs to a generic soft-404 landing page instead of a real 404; allowing filter order to vary without canonicalizing to one order.
- **CleanStart:** N/A

  CleanStart's listing pages filter and paginate entirely client-side against a self-canonicalizing `basePath` (see ARCH-05); no server-rendered, independently-crawlable facet-parameter URL variant is ever produced, so the combinatorial-URL-space problem this rule addresses does not currently arise on this site. Re-evaluate if any listing's filtering is ever moved server-side.

---

### ARCH-07 — URL paths are hyphenated real words, not IDs or session parameters

- **Severity:** P2
- **Applies:** Always
- **Rule:** Use short, human-readable, hyphen-separated paths built from real words that describe the content, not database IDs, and keep parameter counts minimal.
- **Why:** Googlebot parses URL path text as a weak topical signal during crawling/indexing, and complex multi-parameter URLs create combinatorial URL spaces that consume crawl capacity, causing under-crawling rather than a direct ranking penalty.
- **Acceptance:**
  - Every published path segment is composed of dictionary/brand words joined by hyphens
  - No session IDs, tracking parameters, or auto-incrementing numeric IDs as the sole identifier
  - Total parameter count on any internally-linked URL is the minimum needed to render distinct content
- **Verify:** `curl -s https://www.cleanstart.com/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | grep -E '_|/[0-9]+(/|<)'`
- **Reference:** `apps/cms/src/payload/fields/slug.ts:82-150` (`slugField` — server-enforced hyphenating `slugify()`, per-collection uniqueness, 120-char cap); `apps/cms/src/payload/lib/slugify.ts` (re-exports `@cleanstart/ui`'s slugify implementation)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/url-structure; [Tier 1] https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- **Tools:** No surveyed tool publishes a distinct severity tier for URL structure/naming as its own issue class.
- **Anti-patterns:** `/product/3243`-style numeric-only slugs; underscore-separated words (`/black_t_shirt`); duplicated parameter keys (`?type=candy&type=sweet`).
- **CleanStart:** Pass

  Every CMS collection's `slug` field runs through a shared hyphenating `slugify()` on save, is unique per collection, and is capped at 120 characters. Sampled live URLs (`docs/seo/evidence/live-capture.json`) confirm the pattern in practice — e.g. `ai-broke-software-security-biggest-assumption`, `attack-surface-reduction-vs-vulnerability-management`, `senior-software-engineer` — all hyphenated real words, no digit-only segments, no multi-parameter query strings observed. This verdict is based on a sample of the live URL set plus the server-side slug-generation mechanism, not an exhaustive crawl of every published URL.

---

### ARCH-08 — Design for discoverability signals, not a fixed click-depth ceiling

- **Severity:** P2
- **Applies:** Always
- **Rule:** Prioritize discoverability signals (internal link volume/context, sitemap presence, external popularity) over any fixed click-count target; do not design navigation around a "3 clicks from home" ceiling.
- **Why:** Google's crawl-budget guidance ties crawl demand to three factors it names explicitly — "perceived inventory," "popularity" ("URLs that are more popular on the Internet tend to be crawled more often"), and "staleness" — with no numeric click-depth threshold anywhere in the official documentation. Google discovers pages "by accessing URLs found in previously crawled pages," so a page many hops from the homepage is discovered later/less often only insofar as it is less linked-to, not because a click-count ceiling exists.
- **Acceptance:**
  - Every page the operator wants indexed is reachable via at least one crawlable `<a href>` chain from the homepage, at any depth
  - Every such page also appears in a submitted, valid, `<lastmod>`-bearing XML sitemap entry as a discovery backstop
- **Verify:** Run a full same-site crawl seeded only from the homepage (no sitemap seed) and confirm every intended-indexable page appears in the reachable set, regardless of hop count.
- **Reference:** None — no reference implementation (an information-architecture design principle, not a single code path to check)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget (confirmed to state no click-depth or hop-count threshold); [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- **Tools:** No surveyed tool publishes a "click depth" issue tier; Screaming Frog and Sitebulb both report crawl-depth distributions as informational site-structure data, not a scored issue.
- **Anti-patterns:** Flattening navigation into an unusably dense mega-menu purely to satisfy an arbitrary "3-click" rule at the cost of information scent and category clarity. The commonly repeated companion claim — that Nielsen/NN Group data showed a 600% product-findability improvement moving from 3 clicks to 4 — is **not restated here**: the NN/g article it is usually attributed to (`nngroup.com/articles/3-click-rule`) contains neither "600 percent" nor "four click(s)" anywhere on the page; its only cited study (Joshua Porter, 2003, 620 tasks/44 users) found no measurable dropoff past 3 clicks, which is real evidence against a fixed click-depth ceiling but is a materially weaker claim than "600%." The 600% figure traces only to an unverified secondary attribution (Nielsen & Loranger, *Prioritizing Web Usability*, 2006) that could not be confirmed against a primary source and should not be cited as coming from the NN/g article.
- **CleanStart:** Partial

  This rule bundles two distinct clauses. **Design intent** (do not flatten navigation to satisfy a fixed "3 clicks" ceiling): clean. Nothing in `apps/web`'s nav/mega-menu structure has been artificially compressed to hit a click-count target — the site's desktop mega-menu navigation (`apps/web/src/components/nav/DesktopNav.tsx`, driven by `NAV_TREE` in `src/lib/nav-config.ts`) is a fully developed IA, not one flattened for this reason. **Discoverability acceptance** (every intended-indexable page reachable via a crawlable `<a href>` chain from the homepage, "at any depth" — this rule's own Verify command): fails, on the same evidence gathered for ARCH-04 and cross-referenced there in full. Five listing collections (`/events`, `/news`, `/blogs`, `/resource-center`, `/guide`) serve a real crawlable `<a href>` for only their first page of items in server-rendered HTML — client-side-only pagination state is invisible to a same-site crawl regardless of hop count, so this isn't a depth problem, it's a reachability problem the "at any depth" framing doesn't cover. `/careers` (fully server-linked) shows the gap is a fixable implementation choice, not an inherent property of the IA. Net: the navigation-design half of this rule is conformant; the discoverability-acceptance half is not.

---

### ARCH-09 — `BreadcrumbList` marks a logical path, with one source of truth per site

- **Severity:** P2
- **Applies:** Every non-homepage indexable page
- **Rule:** Mark up a logical (not necessarily URL-mirroring) navigation path with schema.org `BreadcrumbList`. A homepage/root `ListItem` is optional, not required; the final item (the current page) may omit its `item` URL, since Google falls back to the page's own URL for it. Maintain exactly one source-of-truth implementation that drives both the visible breadcrumb UI and the JSON-LD payload, so the two cannot silently diverge.
- **Why:** Fetched directly from Google's live documentation during this authoring pass: "It is not required to include a breadcrumb `ListItem` for the top level path (your site's domain or host name)" and, on the final item, "If item isn't included for the last item, Google uses the URL of the containing page." Google's own worked example contains 3 `ListItem`s starting from a category page, not the homepage, and the last item carries a `name` but no `item` property.
- **Acceptance:**
  - Valid `BreadcrumbList` JSON-LD (or Microdata/RDFa) with sequential `position` integers starting at 1
  - At least 2 `ListItem`s
  - The final `ListItem` may omit `item` (its URL), since it represents the current page
  - A homepage/root `ListItem` is optional — its absence is not a defect
  - One shared builder/component drives both the rendered UI and the JSON-LD, so an edit to one cannot leave the other stale
- **Verify:** `curl -s https://www.cleanstart.com/guide/attack-surface-reduction-vs-vulnerability-management | grep -o '"@type":"BreadcrumbList"'`
- **Reference:** `packages/schema/src/builders/breadcrumbs.ts:57-62` (`breadcrumbTrail`); `packages/schema/src/builders/jsonld.tsx:286-297` (`breadcrumbSchema`); `apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx:32-83`; exception at `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx:69-92`; fitness test `apps/web/src/lib/seo/breadcrumb-guard.test.ts:36-48`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (fetched directly during this authoring pass; quotes above are verbatim)
- **Tools:** Not tiered as a distinct issue class by any surveyed tool; Google's Rich Results Test is the standard validator.
- **Anti-patterns:** Mirroring the raw URL path as the breadcrumb trail when the actual user journey differs; maintaining two independent breadcrumb implementations (a visible-UI component and a separate JSON-LD builder) that can silently diverge once one is edited and the other isn't.
- **CleanStart:** Partial

  One shared builder, `breadcrumbTrail()`, is the single source of truth for both the visible `HeroBreadcrumb` UI (6 detail heroes) and the JSON-LD `BreadcrumbList` — the same function is consumed identically by the CMS's own dispatcher — and a fitness test (`breadcrumb-guard.test.ts`) asserts every guarded hero/page file calls `breadcrumbTrail(` and contains no hardcoded `"Home"` object literal. However, `KnowledgeHubArticle.tsx` implements its own inline breadcrumb component with a hardcoded `Home` JSX text node and a hardcoded `Knowledge Hub` link — documented in-file as an intentional visible/JSON-LD divergence (the visible breadcrumb ends at the category; the separately-built JSON-LD trail is `Home › Knowledge Hub › Title`) — and is covered by neither the `HEROES` nor `PAGES` list the fitness test guards. This is an acknowledged, deliberate exception to the single-source-of-truth pattern, but its test-coverage gap (a hardcoded "Home" written as JSX text would not match the guard's regex even if the file were added to a guarded list) is real.

---

### ARCH-10 — Sitemap files stay within the 50,000-URL / 50MB protocol cap

- **Severity:** P2
- **Applies:** Always
- **Rule:** Keep each sitemap file ≤50,000 URLs and ≤50MB uncompressed; once exceeded, split into multiple sitemaps referenced by a sitemap index file rather than truncating content. Do not spend effort hand-tuning `<priority>`/`<changefreq>` — both are ignored.
- **Why:** The sitemap protocol hard-caps a single file at 50,000 URLs / 50MB; Google additionally caps the index structure it will accept (≤50,000 child sitemaps per index, ≤500 index files per property). Separately, Google states plainly it "ignores `<priority>` and `<changefreq>` values"; Bing's own Webmaster Blog independently confirms it ignores both fields too, correcting this SOP's earlier "unverified" flag on Bing's stance (per `verification-log.md` correction #3).
- **Acceptance:**
  - Every individual `.xml` sitemap file is ≤50,000 `<url>` entries and ≤50MB uncompressed
  - If a sitemap index is used, it has ≤50,000 `<sitemap>` entries, and the property's total submitted index-file count is ≤500
  - No engineering time is spent tuning `<priority>`/`<changefreq>` values
- **Verify:** `curl -s https://www.cleanstart.com/sitemap.xml | grep -c '<loc>'`
- **Reference:** `apps/web/src/app/sitemap.ts:45-61` (`SITEMAP_SELECT`, `fetchDocs`, 1,000-doc-per-collection cap at `:52`); `apps/web/src/app/sitemap.ts:72-108` (`STATIC_ROUTES`, ~27 entries)
- **Source:** [Tier 1] https://www.sitemaps.org/protocol.html; [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap and https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
- **Tools:** Ahrefs/Semrush/Screaming Frog/Sitebulb all flag oversized sitemaps at their highest severity tier (see `tool-scoring.md`, "Sitemap errors" row).
- **Anti-patterns:** Shipping one 200,000-URL sitemap and expecting full processing; nesting a sitemap index inside another sitemap index.
- **CleanStart:** Pass

  A single `sitemap.xml` with no sitemap index; nine CMS collections each capped at 1,000 documents plus a ~27-entry static-route list puts the practical ceiling far below both the 50,000-URL and 50MB limits. `sitemap.ts` never emits `<priority>` or `<changefreq>`, consistent with both Google's and Bing's stated behavior of ignoring them.

---

### ARCH-11 — `lastmod` reflects the true content-change time, never the sitemap-build time

- **Severity:** P2
- **Applies:** Always
- **Rule:** Set `<lastmod>` to the true date of a meaningful content change — never to the sitemap-generation timestamp, and never bump it for trivial edits.
- **Why:** Google states it will use `<lastmod>` as a recrawl-scheduling signal "if it's consistently and verifiably accurate" — a history of inaccurate values causes Google to discount the field for that site going forward. Bing's own Webmaster Blog states it checks submitted sitemaps at least once a day (after an immediate fetch on submission) and uses `lastmod` to prioritize *which* URLs get recrawled and may skip unchanged ones — but, per verification-log correction #3, the exact cited sentence does **not** say an accurate, unchanged `lastmod` suppresses the sitemap-level refetch itself; that stronger claim is not restated here.
- **Acceptance:**
  - For a sample of recently touched pages, `<lastmod>` matches (same day) the CMS's own "last significant content update" timestamp, not the sitemap file's generation time
  - Sitemap-generation code sources this field from a content-versioning timestamp, not `Date.now()` at build time
  - No sitemap shares one identical `lastmod` value across every URL
- **Verify:** `curl -s https://www.cleanstart.com/sitemap.xml | grep -B1 '<loc>https://www.cleanstart.com/</loc>' | grep lastmod`
- **Reference:** `apps/web/src/app/sitemap.ts:110-115` (`entry()`); fallback chain at `apps/web/src/app/sitemap.ts:138,142,147,151,153,154,156,157` (`updatedAt ?? displayPublishedAt ?? publishedAt`, or `publicationDate` for news); `jobs` uses only `updatedAt` (`:155`, no `publishedAt` fallback)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap (conditional-trust language); [Tier 1] https://www.sitemaps.org/protocol.html (field definition); [Tier 1] Bing Webmaster Blog, "Keeping Content Discoverable with Sitemaps in AI-Powered Search," https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search (corrected quote per verification-log #3)
- **Tools:** Not separately tiered by any surveyed tool; folded into general sitemap-freshness checks.
- **Anti-patterns:** A sitemap generator that stamps every `<lastmod>` with the current build/deploy time regardless of whether that page's content changed; bumping `lastmod` to game recrawl frequency without a real content change.
- **CleanStart:** Pass

  Every `<lastmod>` traces to a real per-document CMS timestamp (`updatedAt`, or a publish-date fallback), never a build/generation timestamp, and is not a single shared value stamped across every URL — the specific pattern Google's own documentation describes as eroding trust in the field.

---

### ARCH-12 — Don't ship an HTML sitemap as a substitute for real navigation

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not build a user-facing HTML sitemap page as a substitute for real site navigation; invest in navigation and internal linking instead.
- **Why:** Google's Search Central documentation on sitemaps addresses only the XML format, with no guidance recommending an HTML sitemap page. John Mueller (Google Search Advocate), on record: "I changed my mind on HTML sitemaps over the years, they should never be needed. Sites small & large should always have a clear navigational structure. If you feel the need for a HTML sitemap, spend the time improving your site's [navigation]." (Official spokesperson statement on an informal channel — corroborated by contemporaneous press coverage since the primary post renders only a truncated preview to automated fetch.)
- **Acceptance:** The site's primary discovery path for any indexable page is the standard nav/footer/hub-page link graph; if an HTML `/sitemap` page exists, removing it produces zero orphan pages (ARCH-04's test).
- **Verify:** `find apps/web/src/app -maxdepth 1 -iname '*sitemap*'`
- **Reference:** `apps/web/src/app` route tree (only `sitemap.ts`, the XML route, exists — no HTML `/sitemap/page.tsx`)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview (XML-only scope); John Mueller (Google Search Advocate), Mastodon post, Dec 2022, https://mastodon.social/@johnmu/109477617298107922 — Tier 1 (official spokesperson, informal channel; corroborated by Search Engine Roundtable's contemporaneous coverage)
- **Tools:** Not tiered by any surveyed tool — HTML sitemaps are not a named issue class in Ahrefs/Semrush/Screaming Frog/Sitebulb/Lighthouse documentation.
- **Anti-patterns:** Treating an HTML sitemap page as a fix for poor navigation/IA rather than fixing the navigation itself.
- **CleanStart:** Pass

  No HTML `/sitemap` page exists anywhere in `apps/web/src/app`; the only `sitemap`-named file is the XML route. Discovery relies on the standard nav/footer/listing-page link graph.

---

### ARCH-13 — A redirect target has exactly one authoritative implementation

- **Severity:** P3
- **Applies:** Always, for any URL whose destination can be computed by more than one code path
- **Rule:** When a redirect's target can be computed two different ways in the codebase, exactly one of them must be the one that actually executes in production; the other must be removed or refactored to defer to the authoritative path — never left as parallel, independently-maintained logic that can silently drift out of sync.
- **Why:** This is a software-maintenance principle, not a search-engine-documented mechanism, so it carries no Tier 1/2 vendor source. It is included because CleanStart's own codebase demonstrates the concrete failure mode this rule guards against: two independently-maintained sources of truth for the same redirect target, one of which never executes, creating a silent-drift risk with real SEO consequences (a stale or wrong redirect target) if the dead path is ever mistaken for live behavior during a future edit.
- **Acceptance:**
  - For any URL with more than one code path capable of computing its redirect destination, exactly one path is reachable in production
  - The non-authoritative path is either removed or refactored to call the authoritative one, so the two cannot diverge
  - A comment or test documents which path is authoritative, for future maintainers
- **Verify:** `grep -n "permanentRedirect" apps/web/src/app/knowledge-hub/page.tsx "apps/web/src/app/(legal)/legal/page.tsx"`
- **Reference:** `apps/web/src/app/knowledge-hub/page.tsx:11-18`; `apps/web/src/app/(legal)/legal/page.tsx:10-14`; `apps/web/src/proxy.ts:39-42,126-132` (`SECTION_INDEX_REDIRECTS`)
- **Source:** Convention — not vendor-confirmed
- **Tools:** Not applicable — a code-maintenance/drift-risk finding, not an issue class any SEO audit tool scans for.
- **Anti-patterns:** Leaving a page-level `redirect()`/`permanentRedirect()` call in place after a middleware-level rule has been added to handle the same path, on the assumption "it'll never run anyway, so it doesn't matter" — the same class of drift as the stale `/pricing` comment noted under ARCH-04, where a code comment no longer matched reality.
- **CleanStart:** Fail

  `apps/web/src/app/knowledge-hub/page.tsx` and `apps/web/src/app/(legal)/legal/page.tsx` each independently compute a CMS-driven `permanentRedirect()` target (the first/lowest-`order` published document), but `proxy.ts`'s middleware-level `SECTION_INDEX_REDIRECTS` intercepts both exact pathnames first with a hardcoded target, so neither page-level redirect ever executes in production — confirmed live: `docs/seo/evidence/live-capture.json`'s `listing:knowledge-hub` and `listing:legal` entries both show the 308 firing before any page-level logic could run. The two page-level files are a second, independently-maintained source of truth for a target the code's own comment says is deliberately pinned to stay stable — but nothing in the codebase enforces that the hardcoded `proxy.ts` value and the page-level computed value stay in sync if the underlying CMS ordering ever changes.

---
