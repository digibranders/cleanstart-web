# Programmatic & Faceted Navigation at Scale

**Module:** C4 — Programmatic & faceted navigation at scale
**Prefix:** `PROG`
**Status:** Conditional — invoked per client (`00-index.md` §8)
**Scope:** Faceted-navigation crawl control, the retired Search Console URL Parameters tool, session-ID URLs, scaled-content-abuse and doorway-abuse policy, discovery via crawlable links, sitemap/sitemap-index scale limits, `<lastmod>` accuracy, crawl-budget applicability thresholds, and `noindex`/`nofollow` at scale.
**Evidence base:** `docs/seo/evidence/sources/conditional/programmatic.md` (research pass, 2026-07-29).

> **Not exercised by CleanStart — verified against primary documentation only.**
>
> **This module has not been through the adversarial verification pass** that the core
> modules (01–11) received. Its rules rest on a single research pass. Adversarial
> verification found defects in roughly one rule in five across the core modules, so
> re-verify every rule here against its cited source before relying on this module for
> a client engagement.

---

## When this module applies

Apply this module the moment a client site produces URLs combinatorially — a faceted-navigation catalog (color × size × price-band filters), or a large templated-page system (location × service, integration × feature, glossary-at-scale) that generates far more URLs than an editor hand-authors. It does not apply to a site with a few hundred editorially authored pages and no filter/sort parameter surface — `www.cleanstart.com` has roughly 500 URLs, all hand-authored in Payload CMS, with no faceted navigation and no programmatic-page system, which is why every rule below carries a `CleanStart: N/A` verdict. Re-verify every source URL at activation time: this is one of the fastest-moving domains in this SOP, and two of the source blog posts underlying this module's evidence could not be independently re-fetched in full during research (PROG-01, PROG-08) — re-fetch them directly before relying on this module for a client engagement.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### PROG-01 — Scaled content abuse is a purpose test, not an automation or scale test — quote Google's definition exactly

- **Severity:** P0
- **Applies:** Any programmatic-page system, regardless of size or automation level
- **Rule:** Before building any programmatic-page system, write down the user-facing reason each generated page needs to exist independently. Google's policy is defined by *purpose*, verbatim: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." If the honest answer to "why does this page exist" is "to rank for more query variants," the system is in scope for this policy regardless of how well-built the pipeline is — regardless of automation, scale, or editorial polish.
- **Why:** Corroborating reporting on Google's March 2024 spam-policy update states the policy applies "regardless of whether content is produced through automation, human efforts, or some combination of human and automated processes," and that "Google's long-standing spam policy has been that use of automation, including generative AI, is spam if the primary purpose is manipulating ranking in Search results." A large, well-engineered, editorially-reviewed programmatic system built to genuinely serve distinct user needs is not, by this definition, in violation merely because it is built at scale. This carries manual-action consequences, not merely a ranking-quality signal — do not soften or harden the quoted wording.
- **Acceptance:** For a sample of generated page templates, an independent reviewer (not the page's builder) can articulate a specific, non-ranking reason a real user would want that exact page, distinct from every sibling page in the template family — "it targets a keyword variant" does not count as an answer.
- **Verify:** `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies — "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." The automation/method-agnostic framing and the "primary purpose is manipulating ranking" quote are corroborated via secondary reporting of the March 2024 core-update spam-policy announcement, whose full body could not be independently re-rendered during this module's research pass — re-verify the primary post directly at activation time.
- **Tools:** Not applicable — this is a manual editorial-review checklist item, not a tool-scored crawl issue.
- **Anti-patterns:** Reading this policy as "don't use automation" or "don't build many pages" — both over-reading and under-reading it. The test is purpose, applied per template family, not a headcount of generated URLs or a ban on tooling.
- **CleanStart:** N/A

---

## P1 — material organic or AI-visibility impact, no immediate loss

### PROG-02 — Design the crawl-control plan before a facet ships; every new filter/sort parameter multiplies total crawlable URLs

- **Severity:** P1
- **Applies:** Any listing page with combinable filter/sort URL parameters
- **Rule:** Treat every new filter/sort parameter added to a listing page as a multiplier on total crawlable URLs, not an isolated feature — design the crawl-control plan before the facet ships, not after Googlebot floods it.
- **Why:** Google states the crawler cannot know in advance whether a novel-looking faceted URL is useful: "the crawlers will typically access a very large number of faceted navigation URLs before the crawlers' processes determine the URLs are in fact useless." Google separately characterizes faceted navigation as "by far the most common source of overcrawl issues site owners report" (corroborated via secondary reporting of a Google blog post whose body could not be independently re-rendered during research — re-verify at activation time).
- **Acceptance:** For any listing page with N independent filter dimensions, the crawl-control design doc states the intended crawlable URL count (ideally close to the count of canonical/unfiltered category pages) versus the combinatorial maximum, before the facet UI ships.
- **Verify:** `grep "Googlebot" access.log | grep -c "category="`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation
- **Tools:** Not applicable — server-log analysis over a 30-day window is the verification method, not a single-tool scan.
- **Anti-patterns:** Shipping a filter UI with `color`, `size`, `price`, and `sort` as independently combinable query parameters with no crawl-control layer, then discovering months later that Googlebot has been fetching tens of thousands of near-duplicate listing permutations.
- **CleanStart:** N/A

---

### PROG-03 — `robots.txt Disallow` on the parameter itself is the primary control for non-indexable facets; `rel=canonical` cannot substitute

- **Severity:** P1
- **Applies:** Any facet parameter with no standalone business/SEO need to be indexable
- **Rule:** For any facet with no standalone business/SEO need to be indexable, block it at the parameter level in `robots.txt` before reaching for `rel=canonical` or `nofollow` — the latter two only shape what happens *after* a crawl, they do not stop the crawl.
- **Why:** Google frames `robots.txt` parameter-pattern blocking as the front-line prevention method: `Disallow: /*?*color=` style rules stop the request from ever being made, because "there's no good reason to allow crawling of filtered items, as it consumes server resources for no or negligible benefit" in the common case. `rel=canonical` is a post-crawl consolidation hint Google may override, not a directive.
- **Acceptance:** Every facet parameter with no indexing requirement has a corresponding `Disallow` pattern in `robots.txt`; only parameters with an affirmative indexing requirement (PROG-05) are absent from the disallow list.
- **Verify:** `curl -s https://example.com/robots.txt | grep -i 'disallow.*='`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation
- **Tools:** Cross-check against server logs that Googlebot requests to blocked patterns trend toward zero within the ~24-hour `robots.txt` cache window (`CRAWL-18`).
- **Anti-patterns:** Relying solely on `rel=canonical` pointing every filtered URL back to the unfiltered category page as the *only* faceted-navigation control, and treating a `robots.txt` blocking rule as optional/redundant — per Google's own framing, this is backwards.
- **CleanStart:** N/A

---

### PROG-04 — `rel=canonical` and `nofollow` on facet links are weak, slow signals; never the sole mitigation for a combinatorial facet space

- **Severity:** P1
- **Applies:** Facet URLs kept crawlable for a business reason (per PROG-05)
- **Rule:** Where facet URLs must remain crawlable, treat `rel=canonical` pointing to the unfiltered page, and `nofollow` on internal facet links, as secondary signals that reduce indexing/discovery *over time* — do not expect either to stop the initial crawl.
- **Why:** `rel=canonical` is a post-crawl consolidation hint — Google must fetch a page before it can read and act on its canonical tag, and per Google's broader canonicalization documentation it is a hint the algorithm may override, not a directive. `nofollow` on facet links "must be applied consistently to every faceted link to be effective" — a single un-tagged link to the same facet combination re-opens the crawl path.
- **Acceptance:** A facet-URL crawl-control audit does not list "we canonicalize filtered URLs to the base page" as the sole mitigation for a combinatorial facet space; a `robots.txt` or fragment-based prevention layer (PROG-03, PROG-06) must also be present.
- **Verify:** `grep "Googlebot" access.log | grep -c "canonical-target-path"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation; corroborated by [Tier 1] https://developers.google.com/search/docs/crawling-indexing/canonicalization
- **Tools:** Compare Googlebot's `robots.txt`-disallowed-pattern request volume (should trend to zero) against its request volume for canonicalized-but-crawlable facet URLs (persists by design) in server logs.
- **Anti-patterns:** None beyond PROG-03's — see there for the specific over-reliance failure mode.
- **CleanStart:** N/A

---

### PROG-05 — An indexable facet needs a real demand reason, a stable canonical parameter order, and a genuine 404 for empty results

- **Severity:** P1
- **Applies:** Any facet combination deliberately kept indexable
- **Rule:** Before making any facet combination indexable, confirm there is an affirmative reason it should rank as its own page — not merely that it *can* be built — and if so, enforce a single canonical parameter order/syntax across all internal links to it, and return an actual HTTP 404 for any combination with zero matching inventory.
- **Why:** Google places the decision on the site owner but is explicit about the mechanical requirements once a facet is chosen to be indexable: use the standard `&` separator, keep filter order in the URL path logically consistent, and "If there are no green fish in the site's inventory, users as well as crawlers should receive a 'not found' error with the proper HTTP status code (404)," never a 200-status empty-results page.
- **Acceptance:** A single URL template exists for any given filter combination (no duplicate URLs differing only in parameter order); `curl` against a filter combination known to have zero matching inventory returns HTTP 404, not 200.
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/category?color=nonexistent-value"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation
- **Tools:** A crawl of internal links to the same logical facet combination should resolve to byte-identical URL structure.
- **Anti-patterns:** A "friendly" 200-status "No products match your filters" page for an empty facet combination — a textbook soft 404 that both wastes crawl budget and can suppress genuine pages in Google's index in its favor.
- **CleanStart:** N/A

---

### PROG-06 — Every generated page needs a crawlable internal `<a href>` link; database presence alone does not make it discoverable

- **Severity:** P1
- **Applies:** Any programmatic-page system
- **Rule:** Every page a programmatic system generates must have at least one crawlable internal link pointing to it from another indexed page (a category/hub page, a sitemap-driven index page, or similar) — generation into the database/CMS alone does not make a page discoverable.
- **Why:** Google's link-crawlability documentation: "Generally, Google can only crawl your link if it's an `<a>` HTML element (also known as anchor element) with an `href` attribute... Most links in other formats won't be parsed and extracted by Google's crawlers," and separately, "Every page you care about should have a link from at least one other page on your site." A JavaScript `onclick` handler or client-side router link with no real `href` will not carry discovery credit even if a human visitor can click through it.
- **Acceptance:** For a random sample of generated pages, each has at least one real `<a href="...">` inbound link from a crawlable hub/category page reachable from the homepage within a bounded number of hops; zero orphaned pages (reachable only via sitemap, with no on-site inbound link) in the sample.
- **Verify:** `node scripts/seo-sop/check-hreflang-matrix.mjs`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- **Tools:** Crawl the site with sitemap-seeding disabled; any generated-template URL appearing in the sitemap but not in the pure-link-graph crawl is an orphan.
- **Anti-patterns:** Generating thousands of pages into the CMS/database with only a sitemap entry and no on-site inbound link — this is an indexing risk distinct from a discovery risk, and Google's own guidance treats it as effectively undiscoverable.
- **CleanStart:** N/A

---

### PROG-07 — Doorway abuse is a distinct, named violation from scaled content abuse: near-duplicate variant pages that funnel to one real destination

- **Severity:** P1
- **Applies:** Location-, city-, or variant-keyed programmatic templates
- **Rule:** Never build a tier of near-duplicate landing pages whose only function is to capture long-tail query variants and route the visitor onward to one actual destination page — this pattern is independently named and prohibited, separate from scaled content abuse (PROG-01).
- **Why:** Google defines doorway abuse as pages "created to rank for specific, similar search queries" that "lead users to intermediate pages that are not as useful as the final destination," naming "multiple domain names or pages targeted at specific regions or cities that funnel users to one page" and "generating pages to funnel visitors into the actual usable or relevant portion of a site."
- **Acceptance:** For any location- or variant-keyed programmatic template, each generated page contains content that is materially different (not just a find-and-replace city name) from every sibling page, and none of the pages exist solely as a click-through step toward a single non-templated destination.
- **Verify:** `node scripts/seo-sop/check-locale-content-similarity.mjs`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies
- **Tools:** Diff the rendered HTML body content (excluding nav/footer/boilerplate) of a random sample of sibling pages from the same template; a similarity ratio approaching 100% aside from the substitution token is a doorway-risk signal.
- **Anti-patterns:** A "[service] in [city]" template family with no city-specific substance beyond the place-name token.
- **CleanStart:** N/A

---

### PROG-08 — Audit every programmatic template against Google's four named forms of scaled content abuse, one line item each

- **Severity:** P1
- **Applies:** Any programmatic-page system
- **Rule:** Treat each of Google's four named examples of scaled content abuse as an independent audit checklist item for any programmatic-page system, not as a single monolithic risk.
- **Why:** Google lists four specific patterns: (1) "Using generative AI tools or other similar tools to generate many pages without adding value for users"; (2) "Scraping feeds, search results, or other content to generate many pages (including through automated transformations like synonymizing, translating, or other obfuscation techniques), where little value is provided to users"; (3) "Stitching or combining content from different web pages without adding value"; (4) "Creating multiple sites with the intent of hiding the scaled nature of the content." All four center on the same failure mode — "large amounts of unoriginal content that provides little to no value to users, no matter how it's created."
- **Acceptance:** A programmatic-page launch checklist has one explicit line item per pattern (1)–(4), each answerable "does not apply" with a specific reason, not left blank.
- **Verify:** `grep -c "does not apply" docs/launch-checklist.md`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies
- **Tools:** Not applicable — manual policy-checklist review before launch; for pattern (4), confirm no near-duplicate content is split across multiple owned domains to obscure aggregate scale.
- **Anti-patterns:** Treating scaled content abuse as one undifferentiated risk instead of four distinct, independently checkable patterns.
- **CleanStart:** N/A

---

### PROG-09 — `noindex` without `nofollow` suppresses a thin templated page from the index while preserving its link-discovery function — but only if it stays crawlable

- **Severity:** P1
- **Applies:** Templated pages judged thin/low-value but still useful as a link-discovery path
- **Rule:** For any templated page judged thin or low-value enough to keep out of the index but still worth using as a link-discovery path to deeper content, apply bare `noindex` (omit `nofollow`) — and make sure the URL is never also blocked in `robots.txt`, or the directive is never seen at all.
- **Why:** Google frames `nofollow` as an optional addition you may "join" to a `noindex` rule, meaning the unmodified `noindex` directive does not itself stop link-following. Google states the `noindex` prerequisite explicitly: "For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file, and it has to be otherwise accessible to the crawler. If the page is blocked by a robots.txt file or the crawler can't access the page, the crawler will never see the noindex rule, and the page can still appear in search results." At scale, a batch `Disallow` rule accidentally covering a `noindex`'d path silently defeats the entire suppression strategy for every page under it (this is CRAWL-01's mechanism applied to programmatic hub pages specifically).
- **Acceptance:** Every URL pattern intended to be "noindex, follow" is (a) absent from every `robots.txt Disallow` rule, (b) actually returns `<meta name="robots" content="noindex">` or `X-Robots-Tag: noindex` with no `nofollow` token present, and (c) is otherwise fully fetchable by an unauthenticated crawler.
- **Verify:** `curl -sI https://example.com/thin-page | grep -i x-robots-tag`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/block-indexing
- **Tools:** Cross-reference the URL pattern against the site's `robots.txt` to confirm no overlapping `Disallow` rule exists.
- **Anti-patterns:** Applying `noindex, nofollow` (with `nofollow`) as a reflexive default for every thin/templated page "to be safe" — this cuts off the exact link-discovery path (PROG-06) that thin hub/index pages in a programmatic system often exist to provide toward the deeper, genuinely valuable pages they link to.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### PROG-10 — Run every programmatic template family through Google's published helpful-content self-assessment questions before building it

- **Severity:** P2
- **Applies:** Any proposed programmatic template family
- **Rule:** Run every proposed programmatic template family through Google's published self-assessment questions before building it — specifically the ones about added value, mass production, and search-engine-first motivation.
- **Why:** Google's helpful-content guidance publishes explicit diagnostic questions directly applicable to templated pages at scale, including: "Does the content provide substantial value when compared to other pages in search results?"; "Is the content mass-produced by or outsourced to a large number of creators, or spread across a large network of sites, so that individual pages or sites don't get as much attention or care?"; "Are you using extensive automation to produce content on many topics?"; "Is the content primarily made to attract visits from search engines?"
- **Acceptance:** A written answer to each listed question exists for every programmatic template family before launch, and at least one answer is not "yes" to the negative-framed questions.
- **Verify:** `grep -c "self-assessment" docs/launch-checklist.md`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- **Tools:** Not applicable — documentation review; answers must cite actual editorial/QA steps, data sourcing, or differentiation logic, not generic reassurance.
- **Anti-patterns:** Treating "we pass Copyscape / it's not literally duplicate text" as sufficient diversification between templated pages — Google's test is about added value, not textual uniqueness.
- **CleanStart:** N/A

---

### PROG-11 — Avoid session identifiers in URLs; use cookies instead

- **Severity:** P2
- **Applies:** Any crawlable URL pattern
- **Rule:** Never encode a session ID, cart token, or similar per-visit identifier as a URL query parameter on a crawlable page — store it in a cookie.
- **Why:** Google states plainly: "Wherever possible, avoid the use of session IDs in URLs and consider using cookies instead." A session-ID parameter multiplies every crawlable URL by the number of sessions Googlebot happens to establish, manufacturing infinite duplicate-content variants of the same page with no facet-navigation-style justification at all.
- **Acceptance:** No crawlable URL pattern on the site contains a session/visit identifier as a query parameter; a `grep` of a site crawl's URL list for common session-param key names (`sessionid`, `sid`, `PHPSESSID`, `jsessionid`, etc.) returns zero matches.
- **Verify:** `grep -Eic 'sessionid=|sid=|PHPSESSID=|jsessionid=' urls.txt`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/url-structure
- **Tools:** Crawl the site with any URL-extraction tool and grep the resulting list for session-parameter key names.
- **Anti-patterns:** A session ID surviving into a crawlable URL because cookie support was assumed but not actually verified for the crawler's own session.
- **CleanStart:** N/A

---

### PROG-12 — Do not write, follow, or leave in place any runbook step referencing the Search Console URL Parameters tool — it was retired 2022-04-26

- **Severity:** P2
- **Applies:** Always, wherever URL-parameter handling guidance is authored
- **Rule:** Do not write, follow, or leave in place any runbook step that says "configure it in Search Console → URL Parameters" — the tool was fully removed and Google has not shipped a replacement UI.
- **Why:** Google stated its own audit found "the crawling optimizations for 99% of the parameter configurations" the manual tool controlled, and concluded the tool's "usefulness has narrowed to a small set of specific use cases" before retiring it on 2022-04-26. Google's current documented position for parameter-driven duplication is: avoid session IDs (PROG-11), and use `robots.txt Disallow` on genuinely low-value dynamic paths — the same mechanism as faceted navigation (PROG-03), not a parameter-specific tool.
- **Acceptance:** Any internal documentation, onboarding doc, or vendor-tool integration instructing use of "Search Console → Crawl → URL Parameters" is stale and must be corrected or removed on sight.
- **Verify:** `grep -rni "url parameters tool" docs/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/blog/2022/03/url-parameters-tool-deprecated (retirement completed 2022-04-26, full article body independently re-fetched and confirmed during this module's research)
- **Tools:** Attempt to locate a URL Parameters section in Search Console — it does not exist in the current UI.
- **Anti-patterns:** A great deal of circulating SEO advice — blog posts, agency checklists, even some current vendor-tool copy — still assumes the URL Parameters tool exists and instructs readers to "set crawl behavior per parameter" there.
- **CleanStart:** N/A

---

### PROG-13 — A single sitemap file is capped at 50,000 URLs or 50MB uncompressed, whichever limit is hit first

- **Severity:** P2
- **Applies:** Any sitemap approaching either limit
- **Rule:** Split any sitemap that would exceed 50,000 `<url>` entries or 50MB uncompressed into multiple sitemap files before either limit is reached, never after.
- **Why:** Google: "All formats limit a single sitemap to 50MB (uncompressed) or 50,000 URLs." At programmatic scale, a single flat sitemap file will exceed one or both limits well before the underlying page count becomes unmanageable in other ways.
- **Acceptance:** Every individual sitemap XML file in the site's sitemap set contains ≤50,000 `<url>` entries and is ≤50MB uncompressed on disk.
- **Verify:** `xmllint --xpath 'count(//*[local-name()="url"])' sitemap.xml`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- **Tools:** `wc -c sitemap.xml` for uncompressed byte size, alongside the URL-count check.
- **Anti-patterns:** Generating a single flat sitemap file for a programmatic system without a splitting strategy planned before the URL count approaches either ceiling.
- **CleanStart:** N/A

---

### PROG-14 — A sitemap index file caps at 50,000 `<loc>` entries; every referenced sitemap must sit at or below the index's own directory depth

- **Severity:** P2
- **Applies:** Any URL set large enough to need multiple sitemap files
- **Rule:** For a URL set large enough to need multiple sitemap files, generate a single sitemap index file listing them (up to 50,000 `<loc>` references), and keep every referenced sitemap file in the same directory as the index file or lower in the site hierarchy — never higher.
- **Why:** Google: "A sitemap index file may have up to 50,000 loc tags," and "Sitemaps that are referenced in the sitemap index file must be in the same directory as the sitemap index file, or lower in the site hierarchy" — a referenced sitemap living in a parent directory relative to the index is invalid. Site owners "can submit up to 500 sitemap index files for each site in your Search Console account."
- **Acceptance:** The sitemap index file's `<loc>` entry count is ≤50,000; every referenced sitemap file's URL path is at or below the index file's own directory depth; total sitemap index files submitted per Search Console property is ≤500.
- **Verify:** `xmllint --xpath 'count(//*[local-name()="loc"])' sitemap-index.xml`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
- **Tools:** Search Console → Sitemaps report for the submitted-index-file count.
- **Anti-patterns:** Placing a referenced sitemap file in a parent directory relative to its index file — an invalid configuration per the hierarchy rule, not merely a style violation.
- **CleanStart:** N/A

---

### PROG-15 — `<lastmod>` must reflect a real, significant content change, never a build timestamp or boilerplate touch

- **Severity:** P2
- **Applies:** Any sitemap with a `<lastmod>` field, especially at programmatic scale
- **Rule:** Only update a URL's `<lastmod>` value when its main content, structured data, or outbound links meaningfully changed — never wire it to the CMS's generic "updated_at" column if that column also ticks on unrelated template/build changes.
- **Why:** Google states it uses `<lastmod>` "only when it's consistently accurate and verifiable" and that the field should reflect significant updates, explicitly not minor changes like a copyright-year footer update. At programmatic scale, a shared template redeploy can silently bump every generated page's `updated_at` timestamp in the same batch — if wired directly to `<lastmod>`, this teaches Google the signal is meaningless across the entire template family, and Google may then start ignoring `<lastmod>` for that whole site.
- **Acceptance:** A template-wide build/redeploy that does not change any page's substantive content produces zero `<lastmod>` changes in the sitemap for that template family.
- **Verify:** `diff <(curl -s https://example.com/sitemap.xml) sitemap-before.xml`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- **Tools:** Trigger a cosmetic-only template redeploy in staging and diff the generated sitemap's `<lastmod>` values before/after — any change across pages with no substantive content diff is a defect.
- **Anti-patterns:** A static-site-generator default that sets `dateModified`/`<lastmod>` to the current build timestamp on every CI run rather than the actual last substantive edit.
- **CleanStart:** N/A

---

### PROG-16 — Deduplicate or block low-value generated URLs before scaling a template; every duplicate is a direct tax on the site's crawl budget

- **Severity:** P2
- **Applies:** Any programmatic template family producing near-duplicate output
- **Rule:** Treat every duplicate or near-duplicate generated URL as a direct tax on the crawl budget available to the site's genuinely unique pages — deduplicate or block before scaling the template, not after Search Console flags a coverage problem.
- **Why:** Google names "perceived inventory" as a controllable factor in crawl demand: "If many of these URLs are duplicates, or you don't want them crawled for some other reason (removed, unimportant, and so on), this wastes a lot of Google crawling time on your site." This directly extends the faceted-navigation mechanism (PROG-02) to any programmatic system producing near-duplicate templated output.
- **Acceptance:** A site-wide crawl (not sitemap-seeded) of the programmatic template family, deduplicated on rendered-content hash, shows a unique-content ratio the team has explicitly decided is acceptable — not an unmeasured assumption.
- **Verify:** `grep -c "Duplicate, Google chose different canonical" search-console-export.csv`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget
- **Tools:** Cross-reference against Search Console's "Duplicate, Google chose different canonical" and "Crawled, currently not indexed" coverage-report rows.
- **Anti-patterns:** Scaling a programmatic template family before measuring its unique-content ratio, discovering the collision rate only after a Search Console coverage-report regression.
- **CleanStart:** N/A

---

## P3 — hygiene, marginal or speculative gain

### PROG-17 — Use a URL fragment, not a query parameter, for facets with genuinely zero SEO value

- **Severity:** P3
- **Applies:** Filter dimensions with no intended search value
- **Rule:** Where a filter genuinely has zero SEO value (e.g., a "sort by price" toggle, a client-side quick-filter), implement it as a URL fragment (`#color=green`) rather than a query parameter, so it never enters the crawl surface at all.
- **Why:** "Google Search generally doesn't support URL fragments in crawling and indexing" — the fragment is never transmitted to the server in a standard HTTP request, so Google's crawling pipeline does not treat fragment variants as distinct crawlable resources. This is a stronger and simpler control than any post-hoc directive for facets you never want to touch the index.
- **Acceptance:** For any filter dimension deliberately excluded from the crawl surface, its state is carried in `#fragment`, never `?query=param`.
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/#nonexistent-fragment"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation
- **Tools:** Search Console URL Inspection on two fragment variants of the same base URL — both must resolve to the identical (fragment-less) canonical/indexed entry.
- **Anti-patterns:** Assuming a fragment-based filter still needs a `robots.txt` rule or `noindex` tag "just in case" — it is structurally outside the crawl surface already; adding redundant controls indicates a misunderstanding of the mechanism, not extra safety.
- **CleanStart:** N/A

---

### PROG-18 — Crawl-budget engineering is out of scope below Google's stated thresholds — but a programmatic launch can cross them overnight

- **Severity:** P3
- **Applies:** Sites below roughly 10,000 URLs with daily churn, or below 1,000,000 URLs with weekly churn — re-evaluate immediately upon any programmatic-page proposal
- **Rule:** Do not build crawl-budget management tooling (dynamic throttling, crawl-priority sitemaps, staged rollout of new URL batches) for a site below Google's documented applicability threshold — and re-evaluate this threshold the moment a programmatic system is proposed, since it is very likely to cross it.
- **Why:** Google names two thresholds directly: "Large sites (1 million+ unique pages) with content that changes moderately often (once a week)" and "Medium or larger sites (10,000+ unique pages) with very rapidly changing content (daily)." Sites "that seem to be crawled the same day that they are published" don't need this guidance. A programmatic-page launch of even a few thousand daily-refreshed generated pages can cross the 10,000-daily-change threshold on day one, converting a previously out-of-scope site into an in-scope one overnight.
- **Acceptance:** Before launch, the programmatic system's projected URL count and change frequency is checked against both thresholds; if either is crossed, crawl-budget monitoring (Search Console Crawl Stats) becomes a mandatory pre-launch and post-launch checklist item, not optional.
- **Verify:** `curl -s https://example.com/sitemap.xml | grep -c '<loc>'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget
- **Tools:** Search Console → Settings → Crawl Stats — a growing lag between publish date and first-crawl date is the practical symptom of having crossed the threshold without adding monitoring.
- **Anti-patterns:** Building dynamic-throttling or crawl-priority infrastructure preemptively for a site that will never approach the scale where Google's own guidance says it matters.
- **CleanStart:** N/A
