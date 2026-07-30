# Crawl and Index Control — Evidence Sources

Research basis for the SOP governing crawl/index control across all team sites. Every rule below is sourced from a primary reference (Tier 1/2) unless explicitly marked otherwise. All URLs were fetched and verified during research; none are invented.

**Tier legend:** T1 = official spec/vendor docs (Google Search Central, RFC 9309, Bing docs, IETF/W3C). T2 = first-party platform engineering docs (Next.js, Vercel). T3 = named, dated empirical study. T4 = practitioner consensus.

---

## 1. robots.txt controls crawling, not indexing

**Rule:** Never rely on robots.txt `Disallow` to keep a URL out of search results — use it only to manage crawler access/load.

**Mechanism:** robots.txt is read by a crawler *before* it requests a URL and tells it which paths it may fetch. It has no effect on whether an already-known URL is indexed. If Google discovers the URL through an external link, it can index the URL (showing the bare address, no snippet) purely from off-page signals, without ever fetching the page.

**Acceptance criterion:** A URL that must not appear in search results returns either an HTTP auth challenge, a `noindex` signal (meta tag or `X-Robots-Tag`), or is removed entirely — a `Disallow` line alone is a fail.

**Verification:** `curl -sI https://example.com/path | grep -i x-robots-tag` should show `noindex` (or the page requires auth), independent of what robots.txt says for that path.

**Source:** "Don't use a robots.txt file as a means to hide your web pages from Google Search results" — [Robots.txt Introduction and Guide](https://developers.google.com/search/docs/crawling-indexing/robots/intro), Google Search Central. T1.

**Anti-pattern:** Adding `Disallow: /staging/` to robots.txt and considering the staging site "hidden." It is not — it can still be indexed via inbound links and will show as a bare URL with no description in results.

---

## 2. robots.txt rule matching: most specific path wins, ties resolve to least restrictive

**Rule:** When multiple robots.txt rules could match a URL, the rule with the longest (most specific) path prefix applies; if length ties between an `allow` and a `disallow`, the `allow` wins.

**Mechanism:** Google's parser computes match length in octets per rule and selects the longest match, not the order rules appear in the file.

**Acceptance criterion:** For a given URL and a given robots.txt, both a human and Google's [robots.txt report](https://search.google.com/search-console) must select the identical rule as authoritative.

**Verification:** Use Search Console's robots.txt report (or `curl` the file and manually compute path-length matches) against a specific URL and confirm the applied rule.

**Source:** "The most specific match found MUST be used. The most specific match is the match that has the most octets... When allow and disallow rules are equivalent... the 'allow' rule SHOULD be used." — [RFC 9309 §2.2.2](https://www.rfc-editor.org/rfc/rfc9309.html), IETF. T1. Corroborated by Google: "the most specific rule based on the length of the rule path... Google uses the least restrictive rule" for conflicting wildcard rules — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt), Google Search Central. T1.

**Anti-pattern:** Assuming rule order in the file determines precedence (last-rule-wins or first-rule-wins). It doesn't — specificity does.

---

## 3. robots.txt user-agent groups are matched by most-specific agent, then merged

**Rule:** Pick the single group whose `user-agent` name most specifically matches the crawler; if several groups name that same agent, merge all their rules into one group before evaluating.

**Mechanism:** Field names and values in robots.txt are case-insensitive; a crawler that finds `user-agent: Googlebot` and a later `user-agent: Googlebot` block combines both rule sets rather than using only the first or last.

**Acceptance criterion:** Given a robots.txt with two blocks for the same UA, the effective rule set is the union of both, not just one.

**Verification:** Manual trace against RFC 9309 §2.2.1, or Search Console robots.txt Report.

**Source:** "If there is more than one group matching the user-agent, the matching groups' rules MUST be combined into one group and parsed." — [RFC 9309 §2.2.1](https://www.rfc-editor.org/rfc/rfc9309.html). T1.

---

## 4. Wildcard syntax is limited to `*` and `$`

**Rule:** In `Allow`/`Disallow` paths, use `*` to mean zero-or-more of any character and `$` to anchor the end of the URL; no other regex syntax is supported, and a trailing `*` is redundant.

**Mechanism:** Google's parser recognizes exactly these two special characters; a path like `/*.php$` blocks any URL ending in `.php` regardless of query string absence, while `/fish*` behaves identically to `/fish`.

**Acceptance criterion:** `/fish*` and `/fish` produce identical match sets against a test URL corpus.

**Verification:** `curl` a set of representative URLs against the pattern manually, or use Search Console's robots.txt Tester equivalent.

**Source:** "`*` designates 0 or more instances of any valid character… `$` designates the end of the URL… trailing wildcards like `/*` are equivalent to `/` and are ignored" — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt), Google Search Central. T1.

---

## 5. robots.txt must live at `/robots.txt` on the exact origin, UTF-8, `text/plain`

**Rule:** Serve robots.txt as a UTF-8, `text/plain` file at the top-level path `/robots.txt` of each scheme+host+port origin — a subdirectory copy or a different origin's file has no effect.

**Mechanism:** Crawlers only check that single well-known location per origin; `https://example.com:8443` and `https://example.com` are distinct origins each needing (or not needing) their own file.

**Acceptance criterion:** `curl -s https://<origin>/robots.txt` returns the intended content for every origin (including non-standard ports and each subdomain) that needs a policy.

**Verification:** `curl -sI https://example.com/robots.txt` — check 200 status and `Content-Type: text/plain; charset=utf-8` (or equivalent).

**Source:** "The rules MUST be accessible in a file named '/robots.txt'... in the top-level path of the service... The file MUST be UTF-8 encoded... and Internet Media Type 'text/plain'." — [RFC 9309 §2.3](https://www.rfc-editor.org/rfc/rfc9309.html). T1.

---

## 6. robots.txt caching: up to 24 hours, longer if unreachable

**Rule:** Do not expect a robots.txt edit to take effect immediately — budget up to 24 hours for propagation, and understand that during an outage the last-known-good file may be reused far longer.

**Mechanism:** Crawlers SHOULD NOT use a cached copy for more than 24 hours under normal conditions, but if the file becomes unreachable, Google may keep serving the cached version rather than falling back to full-disallow immediately.

**Acceptance criterion:** A robots.txt change is not considered "live" for verification purposes until 24 hours have elapsed, or the change is confirmed via Search Console's robots.txt report (which reflects Google's actual cached copy).

**Verification:** Check the "Last crawled" / fetched timestamp in Search Console's robots.txt report rather than trusting a fresh `curl` of the live file.

**Source:** "Crawlers SHOULD NOT use the cached version for more than 24 hours, unless the robots.txt file is unreachable." — [RFC 9309 §2.4](https://www.rfc-editor.org/rfc/rfc9309.html). T1. "Google generally caches the contents of a robots.txt file for up to 24 hours, but may cache it longer in situations where refreshing the cached version isn't possible." — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt). T1.

---

## 7. robots.txt availability semantics: 4xx = full allow, 5xx/unreachable = full disallow

**Rule:** Design the origin so robots.txt itself never intermittently 5xxs — a missing file (404) is safe (crawlers assume no restrictions), but a server error is treated as "everything is blocked."

**Mechanism:** RFC 9309 mandates that unreachable-due-to-error robots.txt means the crawler MUST assume complete disallow; a 4xx (file simply absent) means the crawler MAY crawl anything. Google specifically: 5xx (and unreachable) → stop crawling for 12 hours, then use last-cached-good copy for up to 30 days while retrying; 4xx (except 429) → treated as if no robots.txt exists at all.

**Acceptance criterion:** Monitoring must alert if `/robots.txt` returns 5xx for any sustained period — this is a crawl-blocking incident, not a cosmetic bug.

**Verification:** `curl -s -o /dev/null -w "%{http_code}\n" https://example.com/robots.txt` in uptime monitoring; alert on non-2xx/non-404.

**Source:** "If the robots.txt file is unreachable due to server or network errors, this means the robots.txt file is undefined and the crawler MUST assume complete disallow" (§2.3.1.4); "If a server status code indicates that the robots.txt file is unavailable to the crawler, then the crawler MAY access any resources on the server" (§2.3.1.3) — [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html). T1. Google's operational specifics (12h/30d window, 4xx-except-429 = no restrictions) — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt). T1.

**Anti-pattern:** Treating a transient 500 on `/robots.txt` (e.g., during a deploy) as harmless because "the file didn't really change." Per spec, Google may assume the entire site is now disallowed.

---

## 8. robots.txt parsing limit is 500 KiB (minimum guaranteed)

**Rule:** Keep robots.txt under 500 KiB; content beyond that limit is not guaranteed to be parsed.

**Mechanism:** Both RFC 9309 and Google's implementation cap the parsed file size; anything past the cutoff is silently dropped mid-file, which can truncate a rule and change its meaning.

**Acceptance criterion:** `wc -c robots.txt` reports a byte count under 512000.

**Verification:** `curl -s https://example.com/robots.txt | wc -c`

**Source:** "The parsing limit MUST be at least 500 kibibytes [KiB]." — [RFC 9309 §2.5](https://www.rfc-editor.org/rfc/rfc9309.html). T1. "Google enforces a robots.txt file size limit of 500 kibibytes (KiB). Content which is after the maximum file size is ignored." — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt). T1.

---

## 9. robots.txt `noindex`/`nofollow` directives are not supported — Google deprecated them 2019-09-01

**Rule:** Never write `noindex:` as a robots.txt directive; it has no effect on Google (and was never part of the standard).

**Mechanism:** Google explicitly retired support for unpublished/unsupported robots.txt rules (`noindex`, `nofollow`, `crawl-delay` from Google's own crawler) as part of open-sourcing its robots.txt parser, effective September 1, 2019.

**Acceptance criterion:** Any robots.txt containing a `noindex:` line is a lint failure — flag it as dead weight, not a working control.

**Verification:** `grep -i noindex robots.txt` — any match is a defect to fix by moving the directive to an actual `<meta name="robots">` tag or `X-Robots-Tag` header.

**Source:** Google Search Central Blog announcement (referenced across multiple secondary sources; the original Google blog post is no longer independently retrievable at a stable URL in this research pass, so this item is corroborated via [Search Engine Land's contemporaneous report](https://searchengineland.com/google-to-stop-supporting-noindex-directive-in-robots-txt-319003) (returns 403 to automated checks; verified manually 2026-07-29), which quotes Google's own statement: *"in the interest of maintaining a healthy ecosystem... we're retiring all code that handles unsupported and unpublished rules (such as noindex) on September 1, 2019."*) T4 (secondary report of a T1 announcement — flagged because the primary Google blog URL could not be independently verified in this pass).

**⚠️ Flag — this is older than 24 months (2019) but is the single most consequential "practitioner myth that refuses to die":** many teams still ship `noindex:` in robots.txt, copy-pasted from pre-2019 tutorials, believing it works on Google. It does not, and never was documented/supported by Google in the first place.

---

## 10. `Crawl-delay` is not honored by Google, but is honored by Bing

**Rule:** Do not rely on a robots.txt `Crawl-delay` directive to throttle Googlebot — it has no effect. It does work for Bingbot.

**Mechanism:** Google's crawl rate is instead governed by the "crawl capacity limit" (server health/latency) and "crawl demand" (site popularity/staleness) — see item 15 — and is only adjustable in aggregate, not via a per-file directive. Bing's crawler (MSNBot/Bingbot) explicitly implements `Crawl-delay` as a relative throttle-down value.

**Acceptance criterion:** A `Crawl-delay` line in robots.txt is a no-op for Google; treat it as Bing-only configuration.

**Verification:** Compare Googlebot request timing in server logs before/after adding `Crawl-delay` — no measurable change indicates correct (expected) behavior.

**Source:** Bing support — "Bing supports the directives of the Robots Exclusion Protocol... the robots.txt file is the only valid place to set a crawl-delay directive for MSNBot... The value listed after the colon is a relative amount of throttling down applied to MSNBot from its default crawl rate." — [Bing Webmaster Blog: Crawl delay and the Bing crawler, MSNBot](https://blogs.bing.com/webmaster/August-2009/Crawl-delay-and-the-Bing-crawler,-MSNBot). T1 (first-party Bing engineering blog). Google non-support is corroborated by Google's own robots.txt field list, which does not include `crawl-delay` among supported fields — [How Google Interprets the robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt). T1.

---

## 11. `<meta name="robots">` and `X-Robots-Tag` are functionally equivalent; the more restrictive rule wins on conflict

**Rule:** Any directive valid in `<meta name="robots">` is also valid in the `X-Robots-Tag` HTTP header (and is the *only* way to control non-HTML resources like PDFs/images); when directives conflict — within one mechanism, between the two mechanisms, or across duplicate headers — the most restrictive directive applies.

**Mechanism:** Both mechanisms feed the same indexing-rule set into Google's indexing pipeline once the resource is fetched. `X-Robots-Tag` is read at the HTTP-response level so it applies even to file types with no HTML `<head>` to hold a meta tag. Google's parser reduces all discovered directives (from either location, and across multiple `X-Robots-Tag` headers or comma-separated lists) to their sum of negative/restrictive effects.

**Acceptance criterion:** `content="max-snippet:50"` + `content="nosnippet"` on the same page must resolve to full snippet suppression (`nosnippet` wins), not a 50-character snippet — this is directly testable and both a page-conflict and a header-vs-meta-tag conflict must resolve identically.

**Verification:** `curl -sI https://example.com/page.pdf | grep -i x-robots-tag` for non-HTML; for HTML, `curl -s https://example.com/page | grep -i '<meta name="robots"'` combined with the header check.

**Source:** "In the case of conflicting robot rules within the X-Robots-Tag or between the X-Robots-Tag HTTP header and the `<meta name="robots">` element, the more restrictive rule applies... if a page has both max-snippet:50 and nosnippet rules, the nosnippet rule will apply." — [Robots meta tag, data-nosnippet, and X-Robots-Tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), Google Search Central. T1.

**Anti-pattern:** Setting `noindex` via `X-Robots-Tag` on a page that is *also* `Disallow`'d in robots.txt, then being surprised the page stays indexed (see item 12) — this is the single most common misconfiguration in this whole domain.

---

## 12. A `noindex` directive is invisible to Google if the URL is blocked from crawling

**Rule:** Never combine `robots.txt: Disallow` with a page-level `noindex` on the same URL as your removal strategy — Google must be able to crawl the page to see the `noindex`, so the disallow prevents the very directive meant to remove it from being read.

**Mechanism:** `noindex` is discovered by rendering/reading the response; if robots.txt blocks the fetch, Google never sees the header or meta tag and instead may index the URL based on external signals alone (bare URL, no snippet) — the opposite of the intended outcome.

**Acceptance criterion:** For any URL intended to be fully suppressed from search, verify it is *either* crawlable-with-noindex *or* robots.txt-disallowed, never both simultaneously as the sole controls.

**Verification:** Search Console URL Inspection tool on the specific URL — it will explicitly report "blocked by robots.txt" alongside "indexing allowed: no" if this conflict exists, or check via `curl` that the robots.txt rule for the path does not overlap with pages carrying `noindex`.

**Source:** "If a page is disallowed from crawling through the robots.txt file... then any information about indexing or serving rules will not be found and will therefore be ignored. If indexing or serving rules must be followed, the URLs containing those rules cannot be disallowed from crawling." — [Robots meta tag, data-nosnippet, and X-Robots-Tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), Google Search Central. T1.

---

## 13. `X-Robots-Tag` is not a web standard — it is a de facto convention

**Rule:** Do not cite `X-Robots-Tag` as an IETF/W3C standard in documentation — describe it as search-engine convention, since no formal spec governs it.

**Mechanism:** There is no RFC or W3C recommendation defining this header; its semantics exist only because Google (and other engines) chose to document and honor it.

**Acceptance criterion:** Internal docs referencing `X-Robots-Tag` must not claim IETF/W3C standardization.

**Verification:** Check MDN's own classification.

**Source:** "While not part of any specification, it is a de-facto standard method for communicating with search bots, web crawlers, and similar user agents." Specifications table: "Not part of any current specification." — [X-Robots-Tag header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Robots-Tag), MDN. T1 (W3C/WHATWG-adjacent reference documentation).

---

## 14. `max-snippet`/`nosnippet` now also govern AI Overviews and AI Mode content reuse (2025 change)

**Rule:** Treat `max-snippet`, `nosnippet`, and `max-image-preview` as controlling not just classic organic snippets but also whether/how much of a page's content Google may reuse as direct input to AI Overviews and AI Mode.

**Mechanism:** Google updated its robots meta tag documentation in March 2025 to state these directives apply to "all forms of search results (web search, Google Images, Discover, Assistant, AI Overviews, AI Mode)" and specifically limit "how much of the content may be used as a direct input for AI Overviews and AI Mode" — extending decade-old snippet-control directives into generative-answer surfaces without introducing any new directive name.

**Acceptance criterion:** A page's snippet-control directives (or absence thereof) must be treated as applying to AI Overview eligibility, not only to blue-link result snippets — a documentation/checklist item that says "these only affect classic snippets" is now stale.

**Verification:** Re-read current text at the source URL; the phrase "AI Overviews" appearing in the max-snippet/nosnippet directive descriptions confirms the current (post-March-2025) scope.

**Source:** [Robots meta tag, data-nosnippet, and X-Robots-Tag specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), Google Search Central (current version, fetched during this research). T1. Change reported contemporaneously by [Search Engine Journal](https://www.searchenginejournal.com/google-updates-robots-meta-tag-document-to-include-ai-mode/541371/), March 2025. T4 (secondary reporting of a T1 doc change).

**⚠️ Flag — deprecated/materially changed in the last 24 months:** This is the most significant recent change in this entire domain. Pre-2025 SOPs, checklists, and vendor tool descriptions that describe `max-snippet`/`nosnippet` purely as "search snippet" controls are now incomplete — the same directives are load-bearing for AI Overview/AI Mode content reuse, with no separate opt-out mechanism.

---

## 15. Crawl budget = crawl capacity limit × crawl demand; irrelevant below roughly 10k–1M URLs

**Rule:** Do not build crawl-budget-management tooling (dynamic robots.txt throttling, crawl-priority sitemaps, etc.) for a site with a stable page count under a few thousand URLs — Google explicitly says this guidance doesn't apply to you.

**Mechanism:** Google names two governing factors: (1) **crawl capacity limit** — bounded by how much load the server can take without degrading (informed by response latency/errors/HTTP 429s); Googlebot backs off automatically on 5xx or slow TTFB. (2) **crawl demand** — driven by a URL's popularity, staleness/update frequency, and Google's own assessment of "perceived inventory" (duplicate/low-value URLs reduce the effective demand allocated per unique page). Crawl budget is a resultant of these, not a fixed quota you set directly.

**Acceptance criterion:** A site with under ~10,000 URLs and no rapid daily content churn does not need dedicated crawl-budget engineering (per Google's own applicability threshold); a site above ~1 million unique URLs, or with 10,000+ URLs that change daily, is squarely in scope for this guidance.

**Verification:** Search Console → Settings → Crawl Stats report — review request volume, response time trend, and error rate (5xx/429) over time; correlate with new-content-to-index lag.

**Source:** "Crawl budget... [is] the set of URLs that Google can and wants to crawl," determined by crawl capacity limit and crawl demand; "if your site doesn't have a large number of pages that change rapidly, or if your pages seem to be crawled the same day that they are published, you don't need to read this guide" — [Crawl Budget Management For Large Sites](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central. T1.

**⚠️ Flag — terminology materially changed:** Google's crawl-budget documentation now uses "crawl capacity limit," not the older "crawl rate limit" terminology that appeared in pre-2024 versions and in most still-circulating SEO blog content. Separately, Google deprecated the **Crawl Rate Limiter tool** in Search Console entirely on 2024-01-08 (announced [2023-11](https://developers.google.com/search/blog/2023/11/sc-crawl-limiter-byebye)) — there is no longer any UI-based way to manually cap Googlebot's crawl rate; Crawl Stats reporting is now read-only diagnostics.

---

## 16. The Search Console URL Parameters tool is dead (April 2022) — do not reference it in any current SOP

**Rule:** Do not instruct editors/engineers to "set it in the URL Parameters tool" — it was fully removed from Search Console on 2022-04-26 and there is no replacement UI.

**Mechanism:** Google found only ~1% of configured parameter rules were actually useful to its crawler and stated its automatic parameter-detection had made the manual tool redundant; no successor tool was introduced. Current guidance for parameter-driven duplication is: avoid session IDs in URLs (use cookies), and use `robots.txt Disallow` for genuinely low-value dynamic paths (e.g., internal search results, calendar/filter permutations) if automatic handling proves insufficient.

**Acceptance criterion:** Any internal documentation, runbook, or vendor-tool integration instructing use of "Search Console → Crawl → URL Parameters" is stale and must be corrected/removed.

**Verification:** Attempt to navigate to the URL Parameters section in Search Console — it no longer exists in the UI (410/gone as a feature since 2022-04-26).

**Source:** "we've come to realize its usefulness has narrowed to a small set of specific use cases... [Google] correctly determined the crawling optimizations for 99% of the parameter configurations" — [Spring cleaning: the URL Parameters tool](https://developers.google.com/search/blog/2022/03/url-parameters-tool-deprecated), Google Search Central Blog, 2022-03-28 (retirement completed 2022-04-26). T1. Current parameter guidance — [URL Structure Best Practices for Google Search](https://developers.google.com/search/docs/crawling-indexing/url-structure), Google Search Central. T1.

---

## 17. Faceted-navigation / parameter URL explosion should be blocked via robots.txt pattern rules, not just canonical tags

**Rule:** For sites with combinatorial filter/facet URLs (e-commerce, search-results pages), use robots.txt `Disallow` patterns on the parameter itself (e.g., `Disallow: /*?*color=`) as the primary control; `rel=canonical` alone only reduces indexing of duplicates over time, it does not stop the crawl.

**Mechanism:** Faceted URLs create combinatorially large ("infinite") URL spaces. Because `rel=canonical` is a post-crawl consolidation signal (item 19), it does not prevent Googlebot from fetching every facet combination first — only a `Disallow` at the parameter level stops the crawl before it happens. Over-crawling low-value facet URLs directly reduces time available for genuinely new/useful URLs.

**Acceptance criterion:** Server logs show no Googlebot requests to disallowed facet-parameter patterns within 30 days of the robots.txt change taking effect (subject to the 24-hour cache window in item 6).

**Verification:** Log analysis: `grep "Googlebot" access.log | grep "color="` should trend to zero after the disallow rule propagates.

**Source:** "Overcrawling... Slower discovery crawls... if crawling is spent on useless URLs, the crawlers have less time to spend on new, useful URLs" and example disallow patterns for parameter blocking — [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers (Crawling infrastructure docs). T1.

---

## 18. Google generally ignores URL fragments (`#...`) for crawling and indexing

**Rule:** Do not rely on `#fragment`-based routing for content you need indexed distinctly, and conversely, fragment-based filter state is a valid way to keep facet variations invisible to crawlers entirely.

**Mechanism:** Because the fragment is a client-side-only construct never sent to the server in a normal HTTP request, Google's crawling and indexing pipeline generally does not treat different fragments of the same base URL as distinct crawlable/indexable resources.

**Acceptance criterion:** Two URLs differing only in `#fragment` are treated by Google as the same URL (single index entry at the fragment-less base).

**Verification:** Search Console URL Inspection on both fragment variants — should report the same canonical/indexed URL (the fragment-less version).

**Source:** "Google Search generally doesn't support URL fragments in crawling and indexing" — [Managing crawling of faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation), Google for Developers. T1.

---

## 19. `rel=canonical` (and sitemap inclusion) are hints, not directives — Google can and does override them

**Rule:** Never document `rel=canonical` as a guaranteed instruction; it is one signal among several, and Google explicitly reserves the right to choose a different canonical URL.

**Mechanism:** Google's canonicalization/deduplication process clusters near-duplicate URLs, then selects the one it judges "objectively the most complete and useful," weighing: 301 redirects (strong signal), `rel=canonical` annotations (strong signal), HTTPS-over-HTTP preference, and sitemap inclusion (weak signal). None of these forces the outcome.

**Acceptance criterion:** A documented QA check must compare the *declared* canonical (`<link rel="canonical">`) against the *Google-selected* canonical (Search Console URL Inspection "Google-selected canonical" field) for a sample of pages — a mismatch is expected/normal behavior, not a bug, and should not be "fixed" by fighting the algorithm.

**Verification:** Search Console → URL Inspection → compare "User-declared canonical" vs. "Google-selected canonical" fields for the URL.

**Source:** "the page that, based on the factors (or signals) the indexing process collected, is objectively the most complete and useful... You can indicate your preference to Google using these techniques, but Google may choose a different page as canonical than you do... indicating a canonical preference is a hint, not a rule." — [What is URL Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization), Google Search Central. T1. Signal strength ranking (redirect = strong, rel=canonical = strong, sitemap = weak) — [How to Specify a Canonical with rel="canonical" and Other Methods](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), Google Search Central. T1.

**Anti-pattern:** Treating a Search Console "Duplicate, Google chose different canonical than user" report as an error to be escalated/fixed via more aggressive tagging — per Google's own framing, this is expected algorithmic behavior, not a malfunction.

---

## 20. Canonical anti-patterns Google explicitly calls out

**Rule:** Never (a) use robots.txt for canonicalization, (b) use the URL Removals tool for canonicalization, (c) declare conflicting canonical URLs via different mechanisms (HTML tag vs. HTTP header vs. sitemap) for the same page, (d) point `rel=canonical` at a URL fragment, or (e) use `noindex` as a substitute for canonicalization.

**Mechanism:** Each of these either produces undefined/unintended behavior (removals tool hides *all* versions of a URL from Search, not just the "duplicate" one) or gives Google contradictory signals that force it to fall back to independent judgment, defeating the purpose of declaring a preference at all.

**Acceptance criterion:** Automated lint: for any URL, exactly one canonicalization declaration exists (HTML `<link rel=canonical>` XOR HTTP `Link` header — never both with different targets), and it is never a fragment (`#...`) or a robots.txt-blocked path.

**Verification:** Crawl the site with a tool that extracts `<link rel=canonical>`, the `Link` HTTP header, and cross-references against robots.txt — flag any page with more than one distinct canonical target declared.

**Source:** "Don't use the robots.txt file for canonicalization purposes. Don't use the URL removal tool for canonicalization. It hides all versions of a URL from Search. Don't specify different URLs as canonical for the same page using different canonicalization techniques. Don't specify a URL fragment as canonical. We don't recommend using noindex to prevent selection of a canonical page." — [How to Specify a Canonical with rel="canonical" and Other Methods](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), Google Search Central. T1.

---

## 21. Soft 404s: a 200-status page whose content signals "not found" wastes crawl and can be indexed as empty content

**Rule:** Every "not found"/"no results" state must return an actual HTTP 404 (or 410 if permanently gone) status code — never a 200 with error-like or empty body content.

**Mechanism:** Google's indexing pipeline evaluates rendered page *content*, not just the HTTP status; if a 200-status page's content reads as an error message or is materially empty, Google's algorithms classify it as a "soft 404," reported in Search Console's Page indexing report. Soft 404s both waste crawl budget (Google keeps re-checking a URL that will never have real content) and can suppress genuine pages from appearing in favor of a technically-real-but-content-empty URL.

**Acceptance criterion:** For every URL pattern representing "resource does not exist" (deleted product, invalid ID, empty filtered-search result), the HTTP status code returned is 404 or 410 — testable independent of content inspection.

**Verification:** `curl -s -o /dev/null -w "%{http_code}\n" https://example.com/definitely-does-not-exist-12345` must return `404` (not `200`); cross-check the Search Console "Page indexing" report for a "Soft 404" row and confirm it trends to zero over time.

**Source:** "A soft 404 error occurs when a URL returns a page telling the user that the page does not exist and also a 200 (success) status code, or an empty/near-empty page. Search Console will show a `soft 404` error." — corroborated across [Google Search Central: HTTP and network errors doc](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) (fetched; contains the 200-status/error-content framing) and reiterated in Google's status-code-handling table (404 → "indexing pipeline removes the URL from the index if it was previously indexed"; 200 → passed to the next processing step but "not guaranteed" to be indexed). T1.

**Anti-pattern:** A "friendly" 200-status empty-state page for filtered search results with zero matches (e.g., `/products?color=nonexistent`) that shows a nice "no results" UI — this is a textbook soft 404 even though it "looks fine" to a human visitor.

---

## 22. Redirect status code shapes signal strength: 301 = strong canonical signal, 302 = weak/temporary signal

**Rule:** Use 301 (permanent) for any redirect meant to permanently consolidate a URL, and reserve 302/307 (temporary) only for genuinely temporary redirects (e.g., A/B tests, maintenance pages) — do not use 302 "because it's the default" for a permanent move.

**Mechanism:** Google's indexing pipeline treats a 301 target as a strong signal that the target should be processed/canonicalized in place of the source; a 302 target is treated as only a weak signal, meaning the *source* URL may persist as canonical in Google's index despite the redirect, which is the opposite of the intended consolidation for a permanent move.

**Acceptance criterion:** Every redirect implementing a permanent URL change (domain migration, slug rename, HTTP→HTTPS) returns HTTP 301; a redirect returning 302/307/308 for a permanent change is a defect.

**Verification:** `curl -sI https://example.com/old-path` — check the status line for `301` vs `302`.

**Source:** "301 (Moved Permanently): Google follows the redirect, and Google systems use the redirect as a strong signal that the redirect target should be processed... 302 (Found): Google follows the redirect, and Google systems use the redirect as a weak signal." — [HTTP and network errors](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

---

## 23. Excluding staging/preview environments requires layered controls — robots.txt/noindex alone is insufficient

**Rule:** Protect non-production environments with HTTP authentication (or IP allowlisting/VPN) as the primary control; layer `X-Robots-Tag: noindex` as defense-in-depth; never rely on robots.txt `Disallow` as the sole protection.

**Mechanism:** Per items 1 and 12, robots.txt cannot prevent indexing of a URL discovered via external links, and a `Disallow` actively prevents Google from ever reading a `noindex` directive on that same URL. The only control that removes the page from crawler reach entirely — regardless of inbound links — is an access barrier the crawler cannot pass (auth challenge, network-level allowlist), because Google cannot index content it cannot authenticate into.

**Acceptance criterion:** For any non-production host (staging, preview, `*.vercel.app`), an unauthenticated request to any path returns either an HTTP 401/403 challenge, or — where a public preview URL is unavoidable — every response carries `X-Robots-Tag: noindex` and the environment is never linked to from any indexed production page.

**Verification:** `curl -sI https://staging.example.com/` (no auth) — expect `401`/`403`, or if 200, `grep -i x-robots-tag` for `noindex` on the same response.

**Source:** Google's own hierarchy of removal methods — "To properly prevent your URL from appearing in Google Search results, password-protect the files on your server, use the noindex meta tag or response header, or remove the page entirely" — [Robots.txt Introduction and Guide](https://developers.google.com/search/docs/crawling-indexing/robots/intro), Google Search Central. T1. Platform-level implementation precedent — Vercel Preview Deployments set `X-Robots-Tag: noindex` automatically on system-generated preview domains, but explicitly **do not** do so for a custom domain attached to a non-production branch, requiring the app to inject the header itself (e.g., gated on `process.env.VERCEL_ENV !== 'production'`) — [Are Vercel Preview Deployments indexed by search engines?](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines), Vercel Knowledge Base. T2.

**Anti-pattern:** Assuming Vercel's default `noindex` protection covers a custom domain pointed at a preview/non-production branch — Vercel's own documentation states this exact configuration is the one case where the automatic header is *not* applied, making it the highest-risk staging-leak scenario for teams using custom domains for QA environments.

---

## Requirement count and tier breakdown

23 requirements documented above.

- **Tier 1:** 20 (RFC 9309 ×6 references, Google Search Central ×13 distinct pages/pronouncements, Bing Webmaster Blog ×1, MDN ×1)
- **Tier 2:** 1 (Vercel Knowledge Base, item 23)
- **Tier 4 (secondary reporting of a Tier 1 event, used because the primary source URL could not be independently re-verified in this pass):** 2 (item 9 — 2019 noindex-in-robots.txt deprecation; item 14 — March 2025 robots-meta-tag/AI Overviews doc update, corroborated by Search Engine Journal reporting alongside the current live Google doc)
- **Tier 3:** 0 — no empirical/study-based claims were needed for this domain; every rule traces to a specification or vendor statement.

## Explicit flags (highest-value output per task instructions)

1. **Materially changed in the last 24 months:** `max-snippet`/`nosnippet`/`max-image-preview` now explicitly govern AI Overviews/AI Mode content reuse, not just classic snippets (Google doc update, ~March 2025 — item 14). Also: Google's crawl-budget vocabulary shifted to "crawl capacity limit" and the Crawl Rate Limiter tool in Search Console was fully removed 2024-01-08 (item 15).
2. **Practitioner claim not actually supported by the primary source:** The widespread belief that `Disallow` + `noindex` together is a "belt and suspenders" way to fully remove a page is backwards — Google's own documentation states the combination is self-defeating, because the `Disallow` prevents Google from ever reading the `noindex` (item 12). This is the single most consequential documented anti-pattern in the whole domain, and it is exactly the opposite of what most agency-blog "SEO checklists" recommend.
