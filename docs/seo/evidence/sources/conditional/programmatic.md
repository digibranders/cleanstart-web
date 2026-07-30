# Programmatic SEO and Faceted Navigation at Scale — Evidence Sources (Conditional Module)

> **⚠️ CONDITIONAL MODULE — NOT VALIDATED AGAINST A WORKING IMPLEMENTATION.**
> CleanStart (the reference site for this SOP) has roughly 500 URLs, all editorially authored in Payload CMS. It has no faceted navigation, no filter/sort parameter surface, and no programmatically generated page templates at scale. Every requirement in this file is therefore sourced **from documentation alone** — none of it has been exercised against CleanStart's server logs, Search Console data, or crawl behavior the way the sibling files in `../` were. Treat this module as dormant reference material: activate it only if/when a team builds a faceted catalog, a large templated-page system (e.g., location × service, integration × feature, glossary-at-scale), or anything else that produces combinatorial or mass-generated URLs. Re-verify every source URL at activation time — this file was researched 2026-07-29 and Google's crawling/spam documentation changes without notice.

**Tier legend:** T1 = Google Search Central / Bing Webmaster official docs. T2 = first-party platform engineering docs. T3 = named, dated empirical study with published methodology. T4 = practitioner consensus (labeled `Convention — not vendor-confirmed`) or secondary reporting of a T1 source that could not be independently re-fetched in this pass.

---

## 1. Faceted navigation causes crawl explosion through "overcrawling," not through any single bad URL

**Rule:** Treat every new filter/sort parameter added to a listing page as a multiplier on total crawlable URLs, not an isolated feature — design the crawl-control plan before the facet ships, not after Googlebot floods it.

**Mechanism:** Google states the crawler cannot know in advance whether a novel-looking faceted URL is useful, so it fetches a very large number of facet combinations before its own processes conclude they are low-value: "Because the URLs created for the faceted navigation seem to be novel and crawlers can't determine whether the URLs are going to be useful without crawling first, the crawlers will typically access a very large number of faceted navigation URLs before the crawlers' processes determine the URLs are in fact useless." Every combination (color × size × price-band × sort-order, etc.) is a distinct URL the crawler must fetch to learn that lesson.

**Acceptance criterion:** For any listing page with N independent filter dimensions, the crawl-control design doc must state the intended crawlable URL count (ideally close to the count of *canonical/unfiltered* category pages) versus the combinatorial maximum, before the facet UI ships.

**Verification:** Server-log analysis — count distinct Googlebot-requested URL patterns matching the facet's query-string keys over a 30-day window; a count approaching the combinatorial maximum indicates the control layer (item 2) is not yet effective.

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers (Crawling infrastructure documentation). T1. Google separately states, in its own words (via the December 2024 "Crawling December" blog series recap), that faceted navigation is "by far the most common source of overcrawl issues site owners report" to Google. T4 (search-snippet corroboration of a Google Search Central Blog post whose full body could not be independently re-rendered by the fetch tool in this pass — [Crawling December: Faceted navigation](https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav) is the primary URL to re-verify at activation time).

**Anti-pattern:** Shipping a filter UI with `color`, `size`, `price`, and `sort` as independently combinable query parameters with no crawl-control layer, then discovering months later that Googlebot has been fetching tens of thousands of near-duplicate listing permutations.

---

## 2. `robots.txt Disallow` on the parameter itself is the primary, preferred control — not `rel=canonical`

**Rule:** For any facet with no standalone business/SEO need to be indexable, block it at the parameter level in `robots.txt` before reaching for `rel=canonical` or `nofollow` — the latter two only shape what happens *after* a crawl, they do not stop the crawl.

**Mechanism:** Google explicitly frames `robots.txt` parameter-pattern blocking as the front-line prevention method: `Disallow: /*?*color=` style rules stop the request from ever being made, because "there's no good reason to allow crawling of filtered items, as it consumes server resources for no or negligible benefit" in the common case. `rel=canonical` and `nofollow`, by contrast, are downstream consolidation/discouragement signals — the crawl has already happened by the time they take effect (see item 4).

**Acceptance criterion:** Every facet parameter with no indexing requirement has a corresponding `Disallow` pattern in `robots.txt`; only parameters with an affirmative indexing requirement (item 5) are absent from the disallow list.

**Verification:** `curl -s https://example.com/robots.txt | grep -i 'disallow.*='` should list every non-indexable facet key; cross-check against server logs (item 1) that Googlebot requests to those patterns trend toward zero within the ~24-hour `robots.txt` cache window.

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers. T1.

**Anti-pattern:** Relying solely on `rel=canonical` pointing every filtered URL back to the unfiltered category page as the *only* faceted-navigation control, and treating a `robots.txt` blocking rule as optional/redundant — per Google's own framing, this is backwards; canonical tags cannot substitute for crawl prevention.

---

## 3. URL-fragment-based facet state is invisible to Google — use it deliberately for facets that must never be crawlable

**Rule:** Where a filter genuinely has zero SEO value (e.g., a "sort by price" toggle, a client-side quick-filter), implement it as a URL fragment (`#color=green`) rather than a query parameter, so it never enters the crawl surface at all.

**Mechanism:** "Google Search generally doesn't support URL fragments in crawling and indexing" — because the fragment is never transmitted to the server in a standard HTTP request, Google's crawling pipeline does not treat fragment variants as distinct crawlable resources in the first place. This is a stronger and simpler control than any post-hoc directive for facets you never want to touch the index.

**Acceptance criterion:** For any filter dimension deliberately excluded from the crawl surface, its state is carried in `#fragment`, never `?query=param`.

**Verification:** Search Console URL Inspection on two fragment variants of the same base URL — both must resolve to the identical (fragment-less) canonical/indexed entry.

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers. T1.

**Anti-pattern:** Assuming a fragment-based filter still needs a `robots.txt` rule or `noindex` tag "just in case" — it is structurally outside the crawl surface already; adding redundant controls indicates a misunderstanding of the mechanism, not extra safety.

---

## 4. `rel=canonical` and `nofollow` on facet links are weak, slow signals — never the primary crawl-explosion fix

**Rule:** Where facet URLs must remain crawlable for some reason (e.g., a business requirement to keep some indexable, per item 5, while suppressing others), treat `rel=canonical` pointing to the unfiltered page, and `nofollow` on internal facet links, as secondary signals that reduce indexing/discovery *over time* — do not expect either to stop the initial crawl.

**Mechanism:** `rel=canonical` is a post-crawl consolidation hint (Google must fetch a page before it can read and act on its canonical tag), and per Google's broader canonicalization documentation it is a hint the algorithm may override, not a directive. `nofollow` on facet links only reduces the crawler's incentive to follow that specific link and "must be applied consistently to every faceted link to be effective" — a single un-tagged link to the same facet combination re-opens the crawl path.

**Acceptance criterion:** A facet-URL crawl-control audit must not list "we canonicalize filtered URLs to the base page" as the sole mitigation for a combinatorial facet space; a `robots.txt` or fragment-based prevention layer (items 2–3) must also be present.

**Verification:** Compare Googlebot's `robots.txt`-disallowed-pattern request volume (should trend to zero) against its request volume for canonicalized-but-crawlable facet URLs (will persist, by design, since canonical tags don't block fetches) in server logs.

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers. T1. Canonical-as-hint-not-directive is corroborated by [What is URL Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization), Google Search Central. T1.

---

## 5. An indexable facet combination requires: a real business/search-demand reason, a stable canonical parameter order, and a genuine 404 for empty results

**Rule:** Before making any facet combination indexable, confirm (a) there is an affirmative reason it should rank as its own page — not merely that it *can* be built — and if so, enforce a single canonical parameter order/syntax across all internal links to it, and return an actual HTTP 404 for any combination with zero matching inventory.

**Mechanism:** Google's own framing places the decision on the site owner ("when to block" = no business need for the faceted URL in search results and it carries a real server-resource cost; "when to index" = the business requires that faceted URL to be discoverable via search) but is explicit about the mechanical requirements once a facet is chosen to be indexable: use the standard `&` separator (not commas/semicolons/brackets), keep filter order in the URL path logically consistent so no duplicate-but-differently-ordered URLs exist, and — critically — "If there are no green fish in the site's inventory, users as well as crawlers should receive a 'not found' error with the proper HTTP status code (404)," never a 200-status empty-results page.

**Acceptance criterion:** For a chosen indexable facet pattern, (a) a single URL template exists for any given filter combination (no duplicate URLs differing only in parameter order), and (b) `curl` against a filter combination known to have zero matching inventory returns HTTP 404, not 200.

**Verification:** `curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/category?color=nonexistent-value"` must return `404`; a crawl of internal links to the same logical facet combination must resolve to byte-identical URL structure (no `?color=red&size=m` vs. `?size=m&color=red` split existing simultaneously).

**Source:** [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers. T1.

**Anti-pattern:** A "friendly" 200-status "No products match your filters" page for an empty facet combination — this is a textbook soft 404 (see the sibling crawl-control evidence file, item 21) that both wastes crawl budget on a URL that will never have content and can suppress genuine pages in Google's index in its favor.

---

## 6. The Search Console URL Parameters tool no longer exists (retired 2022-04-26) — there is no manual per-parameter override for Google

**Rule:** Do not write, follow, or leave in place any runbook step that says "configure it in Search Console → URL Parameters" — the tool was fully removed and Google has not shipped a replacement UI.

**Mechanism:** Google stated its own audit found "the crawling optimizations for 99% of the parameter configurations" that the manual tool controlled, and concluded the tool's "usefulness has narrowed to a small set of specific use cases" before retiring it on 2022-04-26. Google's current documented position for parameter-driven duplication is: avoid session IDs in URLs (item 7), and use `robots.txt Disallow` on genuinely low-value dynamic paths (internal search results, calendar/filter permutations, infinite spaces) — the same mechanism as faceted navigation (item 2), not a parameter-specific tool.

**Acceptance criterion:** Any internal documentation, onboarding doc, or vendor-tool integration instructing use of "Search Console → Crawl → URL Parameters" is stale and must be corrected or removed on sight.

**Verification:** Attempt to locate a URL Parameters section in Search Console — it does not exist in the current UI (confirmed gone since 2022-04-26); the only remaining levers are `robots.txt`, `rel=canonical`, and URL-structure design.

**Source:** [Spring cleaning: the URL Parameters tool](https://developers.google.com/search/blog/2022/03/url-parameters-tool-deprecated), Google Search Central Blog, 2022-03-28 (retirement completed 2022-04-26). T1 (full article body independently re-fetched and confirmed in this research pass, unlike several 2024 blog posts cited elsewhere in this file whose body text the fetch tool could not render). Current parameter guidance — [URL Structure Best Practices for Google Search](https://developers.google.com/search/docs/crawling-indexing/url-structure), Google Search Central. T1.

**Anti-pattern:** A great deal of circulating SEO advice (blog posts, agency checklists, even some current vendor-tool copy) still assumes the URL Parameters tool exists and instructs readers to "set crawl behavior per parameter" there — this advice describes a UI that has not existed since April 2022.

---

## 7. Avoid session identifiers in URLs; use cookies instead

**Rule:** Never encode a session ID, cart token, or similar per-visit identifier as a URL query parameter on a crawlable page — store it in a cookie.

**Mechanism:** Google's URL-structure documentation states plainly: "Wherever possible, avoid the use of session IDs in URLs and consider using cookies instead." A session-ID parameter multiplies every crawlable URL by the number of sessions Googlebot happens to establish, manufacturing infinite duplicate-content variants of the same page with no facet-navigation-style justification at all.

**Acceptance criterion:** No crawlable URL pattern on the site contains a session/visit identifier as a query parameter; `grep` of a site crawl's URL list for common session-param key names (`sessionid`, `sid`, `PHPSESSID`, `jsessionid`, etc.) returns zero matches.

**Verification:** Crawl the site with any URL-extraction tool and grep the resulting URL list for session-parameter key names; cross-check that authentication/cart state survives navigation without the parameter (i.e., cookies are actually doing the work).

**Source:** [URL Structure Best Practices for Google Search](https://developers.google.com/search/docs/crawling-indexing/url-structure), Google Search Central. T1.

---

## 8. Scaled content abuse is defined by *purpose* (manipulating rankings, not helping users), not by the presence of automation or scale alone

**Rule:** Before building any programmatic-page system, write down the user-facing reason each generated page needs to exist independently — if the honest answer is "to rank for more query variants," the system is in scope for this policy regardless of how well-built the pipeline is.

**Mechanism:** Google's own definition is purpose-based, not method-based: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." The policy is explicitly indifferent to *how* the pages were produced — corroborating reporting on Google's March 2024 spam-policy update states the policy applies "regardless of whether content is produced through automation, human efforts, or some combination of human and automated processes," and that "Google's long-standing spam policy has been that use of automation, including generative AI, is spam if the primary purpose is manipulating ranking in Search results." A large, well-engineered, editorially-reviewed programmatic system built to genuinely serve distinct user needs is not, by this definition, in violation merely because it is built at scale.

**Acceptance criterion:** For a sample of generated page templates, an independent reviewer (not the page's builder) can articulate a specific, non-ranking reason a real user would want that exact page, distinct from every sibling page in the template family — "it targets a keyword variant" does not count as an answer.

**Verification:** Manual editorial review pass on a random sample (e.g., 20 pages) from any programmatic template family, scored against the acceptance criterion above; document the pass/fail rate before wide rollout.

**Source:** Core definition — [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies), Google Search Central. T1 (fetched directly, full section text confirmed). Automation/method-agnostic framing and the "primary purpose is manipulating ranking" quote — corroborated via [Search Engine Roundtable's contemporaneous report](https://www.seroundtable.com/google-march-2024-spam-updates-37002.html) of [What web creators should know about our March 2024 core update and new spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies), Google Search Central Blog. T4 (secondary reporting of a T1 announcement — the primary blog post's full body could not be independently re-rendered by the fetch tool in this pass; re-verify the primary URL directly at activation time).

**⚠️ Flag — this is the single highest-risk line in this entire module:** teams reading this policy as "don't use automation" or "don't build many pages" are both over-reading and under-reading it. The test is purpose, applied per template family, not a headcount of generated URLs or a ban on tooling.

---

## 9. Scaled content abuse — the documented forms, verbatim

**Rule:** Treat each of Google's four named examples of scaled content abuse as an independent audit checklist item for any programmatic-page system, not as a single monolithic risk.

**Mechanism:** Google lists four specific patterns under this policy: (1) "Using generative AI tools or other similar tools to generate many pages without adding value for users"; (2) "Scraping feeds, search results, or other content to generate many pages (including through automated transformations like synonymizing, translating, or other obfuscation techniques), where little value is provided to users"; (3) "Stitching or combining content from different web pages without adding value"; (4) "Creating multiple sites with the intent of hiding the scaled nature of the content." All four center on the same failure mode — "large amounts of unoriginal content that provides little to no value to users, no matter how it's created."

**Acceptance criterion:** A programmatic-page launch checklist has one explicit line item per pattern (1)–(4) above, each answerable "does not apply" with a specific reason, not left blank.

**Verification:** Manual policy-checklist review before launch; for pattern (4) specifically, confirm no near-duplicate content is being split across multiple owned domains to obscure its aggregate scale.

**Source:** [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies), Google Search Central. T1.

---

## 10. Doorway abuse: pages built to rank for query variants and funnel to the "real" destination are a distinct, named violation

**Rule:** Never build a tier of near-duplicate landing pages whose only function is to capture long-tail query variants and route the visitor onward to one actual destination page — that pattern is independently named and prohibited, separate from scaled content abuse.

**Mechanism:** Google defines doorway abuse as pages "created to rank for specific, similar search queries" that "lead users to intermediate pages that are not as useful as the final destination," with named examples including "multiple domain names or pages targeted at specific regions or cities that funnel users to one page," "generating pages to funnel visitors into the actual usable or relevant portion of a site," and "creating substantially similar pages that are closer to search results than a clearly defined, browsable hierarchy." This is directly relevant to programmatic location/city/region page systems (e.g., "`[service]` in `[city]`" templates) that don't carry city-specific substance.

**Acceptance criterion:** For any location- or variant-keyed programmatic template, each generated page contains content that is materially different (not just a find-and-replace city name) from every sibling page, and none of the pages exist solely as a click-through step toward a single non-templated destination.

**Verification:** Diff the rendered HTML body content (excluding nav/footer/boilerplate) of a random sample of sibling pages from the same template; a similarity ratio approaching 100% aside from the substitution token is a doorway-risk signal.

**Source:** [Spam Policies for Google Web Search](https://developers.google.com/search/docs/essentials/spam-policies), Google Search Central. T1.

---

## 11. Near-duplicate templated content fails Google's own "substantial value" and "mass production" self-assessment questions

**Rule:** Run every proposed programmatic template family through Google's published self-assessment questions before building it — specifically the ones about added value, mass production, and search-engine-first motivation.

**Mechanism:** Google's helpful-content guidance publishes explicit self-assessment questions directly applicable to templated pages at scale, including: "Does the content provide substantial value when compared to other pages in search results?"; "If the content draws on other sources, does it avoid simply copying or rewriting those sources, and instead provide substantial additional value and originality?"; "Is the content mass-produced by or outsourced to a large number of creators, or spread across a large network of sites, so that individual pages or sites don't get as much attention or care?"; "Are you producing lots of content on many different topics in hopes that some of it might perform well in search results?"; "Are you using extensive automation to produce content on many topics?"; and "Is the content primarily made to attract visits from search engines?" These are explicitly framed as diagnostic questions for the site owner, not a pass/fail rule with a numeric threshold.

**Acceptance criterion:** A written answer to each listed question exists for every programmatic template family before launch, and at least one answer is not "yes" to the negative-framed questions (mass-produced without care, extensive automation with no editorial layer, primarily search-engine-motivated).

**Verification:** Documentation review — the answers must be specific to the template family (citing actual editorial/QA steps, data sourcing, or differentiation logic), not generic reassurance.

**Source:** [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), Google Search Central. T1.

**Anti-pattern:** Treating "we pass Copyscape / it's not literally duplicate text" as sufficient diversification between templated pages. Google's test is about *added value*, not textual uniqueness — a template that swaps in a city name and a stock statistic around otherwise-identical boilerplate can be textually unique and still fail every question above.

---

## 12. Programmatic pages are discovered the same way any page is: a crawlable `<a href>` internal link — orphaned generated pages may never be indexed

**Rule:** Every page a programmatic system generates must have at least one crawlable internal link pointing to it from another indexed page (a category/hub page, a sitemap-driven index page, or similar) — generation into the database/CMS alone does not make a page discoverable.

**Mechanism:** Google's link-crawlability documentation is explicit about both the technical requirement and the discovery function: "Generally, Google can only crawl your link if it's an `<a>` HTML element (also known as anchor element) with an `href` attribute... Most links in other formats won't be parsed and extracted by Google's crawlers," and separately, "Every page you care about should have a link from at least one other page on your site." A JavaScript `onclick` handler, a non-anchor "click card," or a client-side router link with no real `href` will not carry discovery credit even if a human visitor can click through it.

**Acceptance criterion:** For a random sample of generated pages, each has at least one real `<a href="...">` inbound link from a crawlable hub/category page reachable from the homepage within a bounded number of hops; zero orphaned pages (reachable only via sitemap, with no on-site inbound link) in the sample.

**Verification:** Crawl the site with a standard crawler (Screaming Frog or equivalent) starting from the homepage with sitemap-seeding disabled; any generated-template URL that appears in the sitemap but not in the pure-link-graph crawl is an orphan and a discovery risk, distinct from an indexing risk.

**Source:** [SEO Link Best Practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), Google Search Central. T1.

---

## 13. A single sitemap file is capped at 50,000 URLs or 50MB uncompressed — whichever limit is hit first

**Rule:** Split any sitemap that would exceed 50,000 `<url>` entries or 50MB uncompressed into multiple sitemap files before either limit is reached, never after.

**Mechanism:** Google states plainly: "All formats limit a single sitemap to 50MB (uncompressed) or 50,000 URLs." At programmatic scale (tens or hundreds of thousands of generated URLs), a single flat sitemap file will exceed one or both limits well before the underlying page count becomes unmanageable in other ways.

**Acceptance criterion:** Every individual sitemap XML file in the site's sitemap set contains ≤ 50,000 `<url>` entries and is ≤ 50MB uncompressed on disk.

**Verification:** `xmllint --xpath 'count(//*[local-name()="url"])' sitemap.xml` for URL count; `wc -c sitemap.xml` (uncompressed) for byte size — both must be under the documented ceilings for every generated sitemap file.

**Source:** [Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), Google Search Central. T1.

---

## 14. Sitemap index files chain sitemaps together, with their own 50,000-`<loc>` cap and a directory-hierarchy rule

**Rule:** For a URL set large enough to need multiple sitemap files, generate a single sitemap index file listing them (up to 50,000 `<loc>` references), and keep every referenced sitemap file in the same directory as the index file or lower in the site hierarchy — never higher.

**Mechanism:** Google documents the index-file mechanism explicitly: "A sitemap index file may have up to 50,000 loc tags," and "Sitemaps that are referenced in the sitemap index file must be in the same directory as the sitemap index file, or lower in the site hierarchy" — a referenced sitemap living in a parent directory relative to the index is invalid. Separately, Google states site owners "can submit up to 500 sitemap index files for each site in your Search Console account," which sets the practical outer bound on how many index-of-index layers a single verified property can register (500 index files × 50,000 sitemaps/index × 50,000 URLs/sitemap is the theoretical ceiling, though no real site should be anywhere near it).

**Acceptance criterion:** The sitemap index file's `<loc>` entry count is ≤ 50,000; every referenced sitemap file's URL path is at or below the index file's own directory depth; total sitemap index files submitted per Search Console property is ≤ 500.

**Verification:** `xmllint --xpath 'count(//*[local-name()="loc"])' sitemap-index.xml` for the loc-tag count; manual path comparison of each referenced sitemap URL against the index file's own path for the hierarchy rule; Search Console → Sitemaps report for the submitted-index-file count.

**Source:** [Manage Your Sitemaps With Sitemap Index Files](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps), Google Search Central. T1.

---

## 15. `<lastmod>` must reflect a real, significant content change — not a build timestamp or boilerplate touch

**Rule:** Only update a URL's `<lastmod>` value in the sitemap when its main content, structured data, or outbound links meaningfully changed — never wire it to the CMS's generic "updated_at" column if that column also ticks on unrelated template/build changes.

**Mechanism:** Google states it uses `<lastmod>` "only when it's consistently accurate and verifiable" and that the field should reflect the date of significant updates to main content/structured data/links, explicitly not minor changes like a copyright-year footer update. At programmatic scale, a shared template redeploy (e.g., a footer CSS tweak) can silently bump every generated page's `updated_at` timestamp in the same batch, which — if wired directly to `<lastmod>` — teaches Google that the signal is meaningless across the entire template family, and Google may then start ignoring `<lastmod>` for that whole site.

**Acceptance criterion:** A template-wide build/redeploy that does not change any page's substantive content produces zero `<lastmod>` changes in the sitemap for that template family.

**Verification:** Trigger a cosmetic-only template redeploy in a staging environment and diff the generated sitemap's `<lastmod>` values before/after — any change across pages with no substantive content diff is a defect.

**Source:** [Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), Google Search Central. T1.

---

## 16. Crawl-budget engineering is explicitly out of scope below Google's own stated site-size thresholds

**Rule:** Do not build crawl-budget management tooling (dynamic throttling, crawl-priority sitemaps, staged rollout of new URL batches) for a site below Google's documented applicability threshold — and do re-evaluate this threshold the moment a programmatic system is proposed, since it is very likely to cross it.

**Mechanism:** Google names two thresholds directly: "Large sites (1 million+ unique pages) with content that changes moderately often (once a week)" and "Medium or larger sites (10,000+ unique pages) with very rapidly changing content (daily)." Google is explicit that below these, the guidance doesn't apply: sites "that seem to be crawled the same day that they are published" don't need it. A programmatic-page launch of even a few thousand daily-refreshed generated pages (e.g., dynamic pricing/inventory pages) can cross the 10,000-daily-change threshold on day one, converting a previously out-of-scope site into an in-scope one overnight.

**Acceptance criterion:** Before launch, the programmatic system's projected URL count and change frequency is checked against both thresholds; if either is crossed, crawl-budget monitoring (Search Console Crawl Stats) becomes a mandatory pre-launch and post-launch checklist item, not optional.

**Verification:** Search Console → Settings → Crawl Stats — review request volume, average response time, and time-to-index for newly published URLs; a growing lag between publish date and first-crawl date is the practical symptom of having crossed the threshold without adding monitoring.

**Source:** [Crawl Budget Management For Large Sites](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central. T1.

---

## 17. Duplicate/low-value URLs reduce "perceived inventory" and directly waste crawl demand that could go to real pages

**Rule:** Treat every duplicate or near-duplicate generated URL as a direct tax on the crawl budget available to the site's genuinely unique pages — deduplicate or block before scaling the template, not after Search Console flags a coverage problem.

**Mechanism:** Google names "perceived inventory" as a controllable factor in crawl demand: "If many of these URLs are duplicates, or you don't want them crawled for some other reason (removed, unimportant, and so on), this wastes a lot of Google crawling time on your site." This directly extends the faceted-navigation mechanism (item 1) to any programmatic system that produces near-duplicate templated output — the crawler cannot distinguish "duplicate-by-design facet" from "duplicate-by-accident templated page" without first fetching and evaluating it.

**Acceptance criterion:** A site-wide crawl (not sitemap-seeded) of the programmatic template family, deduplicated on rendered-content hash, shows a unique-content ratio the team has explicitly decided is acceptable — not an unmeasured assumption.

**Verification:** Crawl and hash the rendered body content of a representative sample from each template family; a high collision rate (many URLs hashing to near-identical content) is the perceived-inventory problem made concrete, and should be cross-referenced against Search Console's "Duplicate, Google chose different canonical" and "Crawled, currently not indexed" coverage-report rows.

**Source:** [Crawl Budget Management For Large Sites](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central. T1.

---

## 18. `noindex` (without `nofollow`) is the documented mechanism for suppressing thin/templated pages from the index while still letting their links be followed — but it only works if the page remains crawlable

**Rule:** For any templated page judged thin or low-value enough to keep out of the index but still worth using as a link-discovery path to deeper content, apply bare `noindex` (omit `nofollow`) — and make sure the URL is never also blocked in `robots.txt`, or the directive is never seen at all.

**Mechanism:** Google's own documentation frames `nofollow` as an optional addition you may "join" to a `noindex` rule ("you can join a nofollow hint with a noindex rule"), which by construction means the unmodified `noindex` directive does not itself stop link-following — `nofollow` is the thing that would. Separately, and critically, Google states the `noindex` prerequisite explicitly: "For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file, and it has to be otherwise accessible to the crawler. If the page is blocked by a robots.txt file or the crawler can't access the page, the crawler will never see the noindex rule, and the page can still appear in search results." At scale, this means a batch `robots.txt Disallow` rule accidentally covering a path that also carries `noindex` silently defeats the entire suppression strategy for every page under it.

**Acceptance criterion:** Every URL pattern intended to be "noindex, follow" is (a) absent from every `robots.txt Disallow` rule, (b) actually returns `<meta name="robots" content="noindex">` or `X-Robots-Tag: noindex` with no `nofollow` token present, and (c) is otherwise fully fetchable by an unauthenticated crawler.

**Verification:** `curl -sI https://example.com/thin-page | grep -i x-robots-tag` (or fetch + grep the `<meta name="robots">` tag) to confirm `noindex` is present without `nofollow`; cross-reference the same URL pattern against the site's `robots.txt` to confirm no overlapping `Disallow` rule exists.

**Source:** [Block Search Indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), Google Search Central. T1.

**Anti-pattern:** Applying `noindex, nofollow` (with `nofollow`) as a reflexive default for every thin/templated page "to be safe" — this cuts off the exact link-discovery path (item 12) that thin hub/index pages in a programmatic system often exist to provide toward the deeper, genuinely valuable pages they link to. Google's own documentation frames `nofollow` as an *additional*, separate hint, not part of a recommended `noindex` bundle — reach for it only when link-following itself (not just indexing) is the thing being suppressed.

---

## Requirement count and tier breakdown

18 requirements documented above.

- **Tier 1:** 16 (Google Search Central / Google for Developers crawling-infrastructure docs — faceted navigation, spam policies, helpful content, link best practices, sitemaps ×3, large-site crawl budget ×2, url-structure, noindex/block-indexing, URL Parameters tool retirement blog post with full body independently confirmed)
- **Tier 2:** 0
- **Tier 3:** 0
- **Tier 4 (secondary reporting of a Tier 1 source, flagged because the primary blog post body could not be independently re-rendered by the fetch tool in this pass — re-verify the primary URL directly at activation time):** 2 (item 1's "most common source of overcrawl" statistic from the December 2024 Crawling December blog post; item 8's "regardless of automation, human effort, or combination" / "primary purpose is manipulating ranking" framing from the March 2024 core-update spam-policy blog post)

## Explicit flags (highest-value output per task instructions)

1. **The line Google actually draws on scaled content abuse (item 8, item 9):** the policy's own wording is *"Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users."* This is a purpose test, not a scale test or an automation test — corroborating reporting on the same policy update states it applies "regardless of whether content is produced through automation, human efforts, or some combination of human and automated processes." A programmatic system that is well-engineered, editorially reviewed, and built to serve a genuine per-page user need is not, by Google's own definition, automatically in violation because it is large or partly automated.
2. **The URL Parameters tool is gone, permanently, with no replacement UI (item 6):** retired 2022-04-26. A large amount of still-circulating faceted-navigation and programmatic-SEO advice assumes this tool exists. The current, and only, documented controls are `robots.txt` parameter-pattern blocking, URL-structure discipline (avoid session IDs, minimize parameter count), and standard canonicalization/sitemap signals — there is no per-parameter dashboard toggle anymore.
3. **Two blog-post sources in this file (items 1 and 8) could not be independently re-fetched in full** by the tooling available during this research pass — both render as blog-archive navigation shells rather than article bodies. The claims sourced from them are corroborated via contemporaneous third-party reporting and are flagged Tier 4 accordingly. Before this module is activated for a real build, re-fetch `https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav` and `https://developers.google.com/search/blog/2024/03/core-update-spam-policies` directly (e.g., via browser rendering rather than a text-extraction fetch) to upgrade these to directly-verified Tier 1 citations.
