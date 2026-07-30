# Rendering and Delivery — Evidence Sources

Research basis for the SOP governing rendering, JavaScript indexing, HTTP status-code handling, and caching/ISR delivery across all team sites. Every rule below is sourced from a primary reference (Tier 1/2) unless explicitly marked otherwise. All URLs were fetched and verified during research; none are invented.

**Tier legend:** T1 = Google Search Central / IETF RFC / W3C-WHATWG / Bing Webmaster docs. T2 = Next.js / Vercel first-party engineering docs. T3 = named, dated empirical study. T4 = practitioner consensus / secondary reporting of a T1 statement.

---

## Part A — The crawl → render → index pipeline

### 1. JavaScript pages are processed in three distinct stages, not one

**Rule:** Treat crawling, rendering, and indexing as three separate stages with independent timing — a URL can be crawled long before it is rendered, and indexed content can differ from what the raw HTTP response contains.

**Mechanism:** Googlebot fetches a URL from the crawl queue via an HTTP request, checks whether crawling is allowed, and extracts links from crawlable `href` attributes in the raw HTML. Separately, "once Google's resources allow," a headless Chromium instance renders the page and executes JavaScript, and Google "also uses the rendered HTML to index the page." These are queued as distinct steps because rendering is far more compute-expensive than fetching HTML.

**Acceptance criterion:** For any page whose content depends on client-side JavaScript, the content visible in Search Console's URL Inspection "Rendered HTML" / "Screenshot" view must match the content a real user sees — checking only `view-source:` (raw HTML) is not sufficient to confirm indexability.

**Verification:** Search Console → URL Inspection → Test Live URL → "View Crawled Page" tab (Rendered HTML / Screenshot / More Info) for the specific URL in question.

**Source:** "Googlebot queues pages for both crawling and rendering... Once Google's resources allow, a headless Chromium renders the page and executes the JavaScript... Google also uses the rendered HTML to index the page." — [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), Google Search Central, last updated 2026-03-04 UTC. T1.

**Anti-pattern:** Confirming indexability by `curl`-ing a page and reading the raw HTML. If the page uses the app-shell model, the raw response will look empty even though Google may eventually render and index it — and vice versa, a raw HTML check can miss that rendering silently fails.

---

### 2. The render-queue delay is explicitly undefined by Google — no fixed number exists

**Rule:** Never state or design around a fixed "rendering delay" (e.g., "Google re-renders every N days/hours") — Google deliberately does not commit to a number, and content that must appear quickly should not depend on JS execution timing at all.

**Mechanism:** Google's own documentation states only that a page "may stay on this queue for a few seconds, but it can take longer than that" — an intentionally elastic, load-dependent window, not a fixed SLA.

**Acceptance criterion:** Any internal doc, ticket, or SOP that asserts a specific numeric "second wave" delay (e.g., "48 hours," "1–2 weeks") must cite a named, dated empirical study (T3) for that number — never cite it as Google policy.

**Verification:** Re-fetch [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) and confirm it still declines to give a fixed duration.

**Source:** "The page may stay on this queue for a few seconds, but it can take longer than that." — [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), Google Search Central, last updated 2026-03-04 UTC. T1.

**⚠️ Flag — widely repeated practitioner myth not supported by primary sources:** The phrase "second wave of indexing" and specific delay figures ("hours to weeks," "up to 2 weeks") are a practitioner reconstruction of a 2018 Google I/O talk, not current official terminology. The current official basics page does not use the phrase "second wave" at all and gives no fixed duration. Treat "two waves" as a useful mental model for the crawl-then-render sequence in item 1, but never cite a specific delay number as Google's documented position.

---

### 3. Content that only appears after JavaScript execution carries real indexing risk

**Rule:** Do not rely exclusively on client-side rendering (CSR) for content that must be indexed or that changes on a time-sensitive basis (pricing, event dates, stock status) — render it into the initial HTTP response.

**Mechanism:** Sites using the "app shell model" ship an initial HTML response with no real content; Google "needs to execute JavaScript before being able to see the actual page content," which routes that page through the slower, resource-gated render queue (item 2) instead of being indexed directly off the crawl response.

**Acceptance criterion:** `curl -s <url> | grep -c '<body'` followed by a manual check that the returned raw HTML contains the primary content text (headline + first paragraph, or price/date for commerce/event pages) — not just an empty root div and script tags.

**Verification:** `curl -s https://example.com/page | pup 'body text{}'` (or manual view-source) — the primary content string must be present without executing JS.

**Source:** "Some JavaScript sites may use the app shell model where the initial HTML does not contain the actual content and Google needs to execute JavaScript before being able to see the actual page content... server-side or pre-rendering is still a great idea because it makes your website faster for users and crawlers, and not all bots can run JavaScript." — [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), Google Search Central, last updated 2026-03-04 UTC. T1.

**Anti-pattern:** Shipping a fully client-rendered SPA and relying on "Google can run JS now" as sufficient justification — Google's own guidance still frames pre-rendering as the safer default, not merely a legacy accommodation.

---

### 4. Dynamic rendering is now an explicitly deprecated workaround, not a recommendation — flag: changed within 24 months

**Rule:** Do not build new infrastructure around dynamic rendering (serving a separately pre-rendered response to detected bots). Use server-side rendering, static generation, or hydration instead.

**Mechanism:** Google's documentation was rewritten to state plainly that "dynamic rendering was a workaround and not a long-term solution for problems with JavaScript-generated content in search engines," and separately that it "is a workaround and not a recommended solution, because it creates additional complexities and resource requirements." Google now directs teams toward SSR/SSG/hydration as the primary path.

**Acceptance criterion:** No new route in the codebase implements user-agent-based bot detection that serves a structurally different (pre-rendered vs CSR) response to Googlebot vs users. If dynamic rendering exists as a legacy migration bridge, it must be documented as temporary with a removal date.

**Verification:** `grep -ri "googlebot" apps/*/src --include="*.ts*"` for any user-agent sniffing that branches rendering strategy; cross-check against Search Console's coverage report for anomalies between "as rendered" and "as crawled" views.

**Source:** "Dynamic rendering was a workaround and not a long-term solution... Instead, we recommend that you use server-side rendering, static rendering, or hydration as a solution." — [Dynamic rendering as a workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering), Google Search Central, last updated 2025-12-10 UTC. T1.

**⚠️ Flag — deprecated/materially changed in the last 24 months:** This is a genuine, dated (Dec 2025) rewrite of Google's position, not a longstanding rule. Any pre-2025 SOP, blog post, or internal doc recommending dynamic rendering as a first-class solution is now stale.

**Anti-pattern:** Standing up a Rendertron/Puppeteer-based dynamic-rendering layer as the primary long-term architecture for a new site in 2026, when the origin framework (Next.js) already supports SSR/SSG/ISR natively.

---

### 5. Bing's public guidance still recommends dynamic rendering — a documented cross-engine divergence

**Rule:** Do not assume a single rendering strategy satisfies both Google and Bing guidance simultaneously — verify against each engine's own docs before treating "search engines" as a monolith.

**Mechanism:** Bing's own webmaster guidance frames dynamic rendering (server-side pre-rendering keyed off User-Agent detection) as "a great alternative for websites relying heavily on JavaScript," in contrast to Google's Dec-2025 characterization of the same technique as a deprecated workaround.

**Acceptance criterion:** Any rendering-strategy decision document must cite both Google's and Bing's current guidance separately rather than a single unified "search engine" recommendation.

**Verification:** Compare [Google: Dynamic rendering as a workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering) against Bing's bingbot JavaScript guidance and note the publication date on each before treating either as current.

**Source:** Bing Webmaster Blog, "bingbot Series: JavaScript, Dynamic Rendering, and Cloaking" — [blogs.bing.com/webmaster/october-2018](https://blogs.bing.com/webmaster/october-2018/bingbot-Series-JavaScript,-Dynamic-Rendering,-and-Cloaking-Oh-My) (2018, not refreshed since). T1 (Bing Webmaster docs), but note its age relative to Google's item.

**Anti-pattern:** Citing "search engines recommend dynamic rendering" or "search engines don't want dynamic rendering" as a single fact — the two primary sources currently disagree, and only Google's has been updated recently.

---

## Part B — HTTP status-code semantics for crawlers

### 6. 200 OK only starts the pipeline — it is not a guarantee of indexing

**Rule:** Never treat "the URL returns 200" as sufficient evidence the page will be indexed — 200 only means the request succeeded; indexing is a separate, content-dependent decision downstream.

**Mechanism:** "Google passes on whatever it received to the next processing step (which is product specific)" — the 200 response hands control to indexing systems that independently evaluate content quality, canonicalization, and duplication.

**Acceptance criterion:** A 200 response with thin/duplicate/error-like content is not "safe" merely because the status code is correct — verify actual indexing state via Search Console, not via `curl` status alone.

**Verification:** `curl -sI https://example.com/page | head -1` confirms status only; cross-check indexing state separately via the URL Inspection API/tool.

**Source:** [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

---

### 7. 301 is a strong canonical signal; use it when the move is permanent

**Rule:** Use 301 (Moved Permanently) whenever a URL change is not going to be reverted; it tells Google's indexing pipeline to treat the target as canonical and to show the target in search results.

**Mechanism:** "Googlebot follows the redirect, and the indexing pipeline uses the redirect as a signal that the redirect target should be canonical," and results display "the new redirect target."

**Acceptance criterion:** Every permanent URL change (slug rename via an allowed migration, domain move, protocol upgrade) ships a 301, not a 302 or a client-side redirect.

**Verification:** `curl -sI https://example.com/old-path` — expect `HTTP/2 301` and a `location:` header pointing at the canonical target.

**Source:** "Use permanent redirects when you're sure that the redirect won't be reverted... Googlebot follows the redirect, and the indexing pipeline uses the redirect as a signal that the redirect target should be canonical." — [301 redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects), Google Search Central. T1.

---

### 8. 302 still passes a (weak) signal — it is not inert

**Rule:** Do not treat 302 as SEO-neutral or as "passing nothing" — it is followed and does influence which URL Google may eventually treat as canonical, just more weakly and more slowly than a 301.

**Mechanism:** "Google's crawlers follow the redirect, and Google systems use the redirect as a weak signal that the redirect target should be processed" — the target is still crawled and can still be indexed; it is the canonicalization *confidence*, not the crawl/index behavior itself, that is weaker versus a 301.

**Acceptance criterion:** A 302 used for a URL that never reverts (i.e., the reverse of its intended use) will eventually still leak canonical signal to the target — this is a slow-burn misconfiguration, not a safe no-op, and should be flagged in any redirect audit.

**Verification:** `curl -sI https://example.com/path` — a 302 that has been live unchanged for 6+ months on a production path is a signal the redirect type is wrong, not merely a stylistic choice.

**Source:** "Google's crawlers follow the redirect, and Google systems use the redirect as a weak signal that the redirect target should be processed." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

**⚠️ Flag — widely repeated practitioner myth not supported by primary sources:** "302s never pass ranking/indexing signals" is not what Google documents. Google explicitly calls it a weak *signal*, not a null one. The correct framing is "use 301 for anything permanent because 302's signal is weaker and slower to consolidate," not "302 is safe because it passes nothing."

---

### 9. Keep a redirect live for at least a year — there is no shortcut

**Rule:** Once a 301 is put in place for a permanent move, leave it in place for at least one year (longer is better, indefinitely if feasible) before removing it — do not tear it down as soon as traffic "looks migrated."

**Mechanism:** Google's systems need to observe the redirect repeatedly over time to fully consolidate signals (links, historical ranking data) onto the new URL; removing it early can strand any inbound link or bookmark still pointing at the old URL, and can cause Google to lose the association before consolidation is complete.

**Acceptance criterion:** No redirect created for a permanent URL change (per this repo's own "never rename a route post-launch" rule) is deleted or allowed to 404 within 12 months of creation.

**Verification:** Track redirect creation dates in the codebase/CDN config; audit before any redirect removal that its age exceeds 365 days.

**Source:** Google Search Central guidance (via Office Hours), reported contemporaneously: "Google's systems need to see the change in the form of a redirect... to be certain a redirect has been seen a few times, Google recommends keeping the redirect in place for at least one year" — [Google: Keep 301 Redirects In Place For A Year](https://www.searchenginejournal.com/google-keep-301-redirects-in-place-for-a-year/428998/), Search Engine Journal, reporting a Google Search Central statement. T4 (secondary report of a T1 statement — flagged because this guidance is not currently phrased as a specific duration in Google's own written redirects doc, only in spoken Office Hours/video guidance).

**Anti-pattern:** Removing a redirect after a few weeks because analytics shows most traffic already hitting the new URL — organic search consolidation lags behind direct-traffic migration.

---

### 10. 304 Not Modified means "nothing changed" — it does not itself change indexing, but enables efficient re-crawl

**Rule:** Support conditional GET (`If-None-Match` / `If-Modified-Since`) so unchanged pages can return 304 instead of a full 200 body — this makes re-crawling cheaper without altering the indexed content.

**Mechanism:** RFC 9110 defines 304 as the response when "a conditional GET or HEAD request has been received and would have resulted in a 200 (OK) response if it were not for the fact that the condition evaluated to false" (i.e., content is unchanged); Google's crawlers "signal the next processing system that the content is the same as last time it was crawled," which may still trigger signal recalculation but performs no content re-indexing.

**Acceptance criterion:** For a static/rarely-changing resource, a second request with `If-None-Match` set to the first response's `ETag` returns 304 with an empty body, not a full 200.

**Verification:** `curl -sI -H "If-None-Match: \"$(curl -sI https://example.com/page | grep -i etag | cut -d'\"' -f2)\"" https://example.com/page` — expect `HTTP/2 304`.

**Source:** "A conditional GET or HEAD request has been received and would have resulted in a 200 (OK) response if it were not for the fact that the condition evaluated to false." — [RFC 9110 §15.4.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-304-not-modified), IETF. T1. "Google crawlers signal the next processing system that the content is the same as last time it was crawled." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

---

### 11. 404 removes a previously indexed URL, but a brand-new 404 is never indexed in the first place

**Rule:** Return a genuine 404 status (not just "not found" copy on a 200 page — see Part C) for any resource that does not exist. If the URL was previously indexed, this is how it comes out; if it was never indexed, this is how it stays out.

**Mechanism:** RFC 9110 defines 404: "The server cannot find a current representation for the target resource or is unwilling to disclose that one exists." Google's pipeline "removes the URL from the index if it was previously indexed. Newly encountered 404 pages aren't processed," and repeated 404s cause "crawling frequency [to] gradually decrease" for that URL.

**Acceptance criterion:** Every unknown-slug/unknown-ID request under a dynamic route returns HTTP 404 as the actual response status (verifiable header-only, no body parsing needed) — a page that "looks like" a 404 while returning 200 fails this criterion (see soft-404, Part C).

**Verification:** `curl -sI https://example.com/definitely-does-not-exist-xyz` — expect `HTTP/2 404` in the status line, not 200.

**Source:** "The server cannot find a current representation for the target resource or is unwilling to disclose that one exists." — [RFC 9110 §15.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found), IETF. T1. "The indexing pipeline removes the URL from the index if it was previously indexed. Newly encountered 404 pages aren't processed. The crawling frequency gradually decreases." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

---

### 12. 410 signals permanent, deliberate removal — prefer it over 404 for content you intentionally deleted

**Rule:** When content is intentionally and permanently removed (not merely temporarily missing or mistyped), return 410 (Gone) rather than 404. Reserve 404 for "not found," and use 410 for "was here, is deliberately gone forever."

**Mechanism:** RFC 9110 defines 410: "The origin server knows that the target resource is no longer available at any location and that this condition is likely to be permanent" — a stronger, more explicit signal than the ambiguous "cannot find" language of 404. Google treats both as "the content doesn't exist" for the crawler, but per Google's own Office Hours guidance, 410 tends to be actioned for index removal marginally faster than 404 — though the long-run outcome (dropped from index) is identical for both.

**Acceptance criterion:** A resource retired via an editorial "unpublish/delete" action (as opposed to a slug typo or transient outage) returns 410, not 404 or a 200 "this content was removed" page.

**Verification:** `curl -sI https://example.com/deleted-resource` — expect `HTTP/2 410`.

**Source:** "The origin server knows that the target resource is no longer available at any location and that this condition is likely to be permanent." — [RFC 9110 §15.5.11](https://www.rfc-editor.org/rfc/rfc9110.html#name-410-gone), IETF. T1. Google crawlers treat 410 the same as other 4xx ("the content doesn't exist") per [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1. Removal-speed nuance ("a 410 will sometimes fall out a little bit faster than a 404... usually on the order of a couple of days... in the mid-term and long-term, a 404 is the same as a 410 for Google") reported from Google Search Central Office Hours — [Search Engine Journal coverage](https://www.searchenginejournal.com/google-404-status/254429/). T4 (secondary report of a T1 statement).

**Anti-pattern:** Using 404 for every deletion "because it's simpler," then being surprised that stale/deleted resource pages take marginally longer to drop from the index than a 410 would have.

---

### 13. 429 is a server-overload signal that throttles crawl rate, not a permanent-removal trigger by itself

**Rule:** Return 429 only when actually rate-limiting a client, and expect Google to interpret it as "back off," not "remove this URL."

**Mechanism:** "Google's crawlers treat the 429 status code as a signal that the server is overloaded, and it's considered a server error," and "5xx and 429 server errors prompt Google's crawlers to temporarily slow down with crawling." Google's crawl-capacity logic explicitly reacts to 429 the same way it reacts to 5xx: "If the site... responds with... rate-limiting signals (such as HTTP 429), the [crawl capacity] limit goes down and Google crawls less."

**Acceptance criterion:** 429 responses are transient and tied to actual load-shedding logic (e.g., a specific client exceeding a rate window) — a site should never return 429 for all of Googlebot's traffic as a blanket policy, since sustained 429 is functionally equivalent to sustained 5xx (item 14).

**Verification:** Monitor the ratio of 429 responses to Googlebot's user-agent in server logs; a sustained (multi-day) high ratio should alert as a crawl-health incident.

**Source:** "Google's crawlers treat the 429 status code as a signal that the server is overloaded, and it's considered a server error." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1. Crawl-capacity reaction — "If the site slows down... or responds with server errors (5xx HTTP status codes) or rate-limiting signals (such as HTTP 429), the limit goes down and Google crawls less." — [Large site owner's guide to managing your crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central, last updated 2026-07-22 UTC. T1.

---

### 14. Sustained 503/429 for days eventually drops previously-indexed URLs — there is no fixed published number of days

**Rule:** Use 503 (with `Retry-After`, item 15) only for genuinely short outages/maintenance windows — do not leave a site or section returning 503/429 for an extended period and assume the index is safe.

**Mechanism:** Google's own current page states the qualitative outcome without a fixed number: "For Google Search, already indexed URLs are preserved in the index, but eventually dropped" under sustained 5xx/429. Google's crawl-budget guidance separately confirms that sustained server errors reduce the crawl-capacity limit (item 13), compounding the risk — a slower crawl rate on top of an eventually-dropped index entry.

**Acceptance criterion:** Any planned maintenance window returning 503 must have a defined, monitored end time; if a 503/429 condition persists beyond single-digit days, it must escalate as a P1/P0 SEO incident, not be treated as routine.

**Verification:** Correlate server error-rate dashboards (5xx/429 to Googlebot UA) against Search Console's Page Indexing report for a rising "Not Found" or "Server error" count.

**Source:** "5xx and 429 server errors prompt Google's crawlers to temporarily slow down with crawling... For Google Search, already indexed URLs are preserved in the index, but eventually dropped [under sustained errors]." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

**⚠️ Flag — widely repeated practitioner myth not supported by primary sources:** Numerous secondary blog posts cite a specific "returning 503/429 for more than 2 days causes Google to drop URLs from the index" figure. This research pass could not locate that specific "2 days" figure anywhere in Google's current, primary-source text — the primary doc says only "eventually," with no number attached. Do not cite a specific day-count as Google's documented policy; if a specific figure is needed operationally, treat it as an internal risk-tolerance choice, not a cited Google rule.

---

### 15. `Retry-After` tells the client (including crawlers) exactly when to come back — use it on every 503/429

**Rule:** Always send a `Retry-After` header (seconds or HTTP-date) alongside 503 and 429 responses so well-behaved clients, including Googlebot, know when to retry instead of guessing.

**Mechanism:** RFC 9110 defines `Retry-After` as indicating "how long the user agent ought to wait before making a follow-up request. It can contain either an HTTP-date or a delay in seconds." Absent this header, crawlers fall back to their own backoff heuristics, which may be far more conservative than the actual outage window.

**Acceptance criterion:** Every 503 (planned maintenance) and 429 (rate limit) response includes a `Retry-After` header with a realistic value — not omitted, and not a wildly conservative placeholder like `86400` for a 10-minute maintenance window.

**Verification:** `curl -sI https://example.com/path` during a maintenance window or rate-limited request — confirm both the status code and a present, sane `Retry-After` value.

**Source:** "Indicates how long the user agent ought to wait before making a follow-up request. It can contain either an HTTP-date or a delay in seconds." — [RFC 9110 §10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after), IETF. T1. `Retry-After` usage alongside 429 originates in [RFC 6585 §4](https://datatracker.ietf.org/doc/html/rfc6585#section-4), IETF. T1.

**Anti-pattern:** Returning 503 for a maintenance window with no `Retry-After` header at all, forcing crawlers (and monitoring tools) to guess the outage duration.

---

## Part C — Soft 404s: detection, consequences, and the JS-rendering connection

### 16. A soft 404 is a content-based judgment, not a status-code check — Google reads what the page says, regardless of its HTTP code

**Rule:** Never assume "the status code is what matters" for not-found handling — Google separately evaluates whether the rendered *content* reads as an error/empty page, irrespective of the HTTP status returned.

**Mechanism:** Google's crawling-infrastructure documentation states plainly: "If the content suggests an error for Google Search, an empty page or an error message, Search Console will show a soft 404 error" — this is evaluated on the rendered content, and can be flagged even alongside a 200 status that "looks fine" superficially, or in principle even flagged as a mismatch on a non-200 status whose body doesn't match expectations.

**Acceptance criterion:** For any URL Search Console flags as "Soft 404" in the Page Indexing report, the fix must correct the actual HTTP status code returned by the server to match the content's real meaning (404/410 for genuinely missing content) — not merely reword the on-page copy.

**Verification:** Search Console → Page Indexing report → "Soft 404" row → inspect the listed sample URLs.

**Source:** "If the content suggests an error for Google Search, an empty page or an error message, Search Console will show a soft 404 error." — [How HTTP Status Codes Affect Google's Crawlers](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes), Google Search Central, last updated 2026-02-04 UTC. T1.

---

### 17. Soft 404s directly waste crawl budget — Google says so explicitly

**Rule:** Treat every soft-404 URL as an active drain on crawl budget for the whole site, not a cosmetic Search Console warning to defer.

**Mechanism:** "Soft 404 pages will continue to be crawled, and waste your budget" — unlike a true 404 (item 11), which Google stops processing and crawls with decreasing frequency, a soft 404 masquerades as a normal, live, 200-status page and keeps consuming crawl resources indefinitely.

**Acceptance criterion:** Zero URLs listed under "Soft 404" in Search Console's Page Indexing report for any production route family (e.g., all `[slug]` detail routes) — this is a target of zero, not an acceptable-baseline count.

**Verification:** Search Console → Page Indexing report → Soft 404 count trend over time; should trend to and hold at zero for known-invalid slug patterns.

**Source:** "Soft 404 pages will continue to be crawled, and waste your budget." — [Large site owner's guide to managing your crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central, last updated 2026-07-22 UTC. T1.

---

### 18. Google explicitly names SPA/JS apps returning 200 for error pages as a primary soft-404 cause — this is the exact defect class in question

**Rule:** Any client-side or hybrid-rendered route that can represent "not found" must ensure the *server's actual HTTP response status* is non-200 for that case — rendering "not found" text inside a 200 response is precisely the anti-pattern Google names.

**Mechanism:** Google's own JavaScript-troubleshooting guidance identifies this by name: single-page applications "often return HTTP 200 status codes for error pages instead of proper status codes," causing "error pages being indexed and possibly shown in search results." This is not a hypothetical edge case — it is Google's documented, named example of how JS-rendered apps produce soft 404s.

**Acceptance criterion:** For a representative sample of intentionally-invalid slugs across every `[slug]` route family in `apps/web`, the HTTP response status line must read 404 (or 410), never 200 — confirmed via a header-only request, independent of the rendered content.

**Verification:** `curl -sI https://www.cleanstart.com/<route-prefix>/definitely-invalid-slug-test` for each affected route family — expect `HTTP/2 404`.

**Source:** "[SPAs] often return HTTP 200 status codes for error pages instead of proper status codes," resulting in "error pages being indexed and possibly shown in search results." — [Fix search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript), Google Search Central, last updated 2025-12-18 UTC. T1.

**Anti-pattern (confirmed live on this codebase per prior investigation):** Nine `[slug]` detail routes in `apps/web` return HTTP 200 for unknown slugs because `dynamicParams` is enabled and a `notFound()` result is served under ISR — see items 19–21 for the exact mechanism.

---

## Part D — Next.js/Vercel: `dynamicParams`, `notFound()`, and the status code actually served under ISR

### 19. `dynamicParams` defaults to `true`, meaning any unknown slug is rendered on demand rather than instantly 404'd

**Rule:** Understand that `dynamicParams: true` (the default) does not itself mean "unknown paths 404" — it means "unknown paths are still rendered," and whether that render calls `notFound()` correctly is a separate, additional requirement.

**Mechanism:** Next.js's own reference states: "`true` (default): Dynamic route segments not included in `generateStaticParams` are generated at request time... `false`: Dynamic route segments not included in `generateStaticParams` will return a 404." With the default `true`, the page component itself is responsible for detecting the missing resource and invoking `notFound()` — Next.js does not auto-404 unknown params unless `dynamicParams` is explicitly set to `false`.

**Acceptance criterion:** For any route where every valid ID/slug is known and enumerable at build/revalidate time, `dynamicParams = false` is the safer default; where params are inherently open-ended (e.g., user-generated slugs), the page must call `notFound()` itself for every not-found case, verified by a test.

**Verification:** `grep -rn "dynamicParams" apps/web/src/app` — for each `[slug]` route, confirm the setting is intentional, not merely left at the implicit default without a corresponding `notFound()` check for missing data.

**Source:** "`true` (default): Dynamic route segments not included in `generateStaticParams` are generated at request time. `false`: Dynamic route segments not included in `generateStaticParams` will return a 404." — [dynamicParams](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams), Next.js docs, v16.2.12, last updated 2026-03-13. T2.

---

### 20. `notFound()` throws a 404 error, but streaming can lock the response status at 200 before that error is ever produced — this is the documented root cause of the site's live defect

**Rule:** Never call `notFound()` (or any status-changing function) after the response has begun streaming — once any Suspense fallback (including `loading.tsx`) has flushed, the HTTP status is permanently fixed at 200 no matter what happens afterward in the render.

**Mechanism:** Next.js's own documentation is now explicit and unambiguous on this exact mechanism: "When streaming, a 200 status code will be returned to signal that the request was successful. The server can still communicate errors or issues to the client within the streamed content itself, for example, when using `redirect` or `notFound`. Because the response headers have already been sent to the client, the status code of the response cannot be updated." It further states: "Some crawlers may label these responses as 'soft 404s.'" The separate `not-found.js` reference page confirms the split outcome directly: "Next.js will return a 200 HTTP status code for streamed responses, and 404 for non-streamed responses." The response body begins streaming "when a Suspense fallback renders (for example, a `loading.tsx`) or when a Server Component suspends under a Suspense boundary" — so a route-level `loading.tsx`, or any `await` that suspends before the not-found check runs, is what locks the status to 200.

**Acceptance criterion:** For every `[slug]` route capable of calling `notFound()`, the not-found determination (the data fetch that decides existence) must complete and call `notFound()` *before* any Suspense boundary in that route tree renders a fallback — verified by removing/relocating any route-level `loading.tsx` that wraps the existence check, and by confirming via `curl` that the status line is 404, not 200, for a known-invalid slug.

**Verification:** `curl -sI https://www.cleanstart.com/<affected-route>/known-invalid-slug` — must return `HTTP/2 404` in the status line itself (not just `noindex` in the body).

**Source:** "When streaming, a 200 status code will be returned to signal that the request was successful... Because the response headers have already been sent to the client, the status code of the response cannot be updated... Some crawlers may label these responses as 'soft 404s.' In the streaming case, this does not lead to indexation because the page is explicitly marked noindex in the HTML. If you need a 404 status, for compliance or analytics, ensure the resource exists before the response body is streamed, so that the server can set the HTTP status code... The response body starts streaming when a Suspense fallback renders (for example, a `loading.tsx`) or when a Server Component suspends under a Suspense boundary. Place `notFound()` before those boundaries and before any `await` that may suspend." — [loading.js — Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes), Next.js docs, v16.2.12, last updated 2026-03-13. T2. Corroborating: "Next.js will return a `200` HTTP status code for streamed responses, and `404` for non-streamed responses." — [not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), Next.js docs, v16.2.12, last updated 2026-07-22. T2.

**Anti-pattern (this is the mechanism behind the site's live defect):** Adding `notFound()` inside `generateMetadata` alone does not fix this — `generateMetadata` resolves independently of the page body's streaming timeline, so the page body can still stream a 200 before or regardless of what `generateMetadata` decided. The documented fix is architectural: perform the existence check before any Suspense fallback can flush (e.g., in `proxy`/middleware per Next.js's own suggestion, or by ensuring the data fetch + `notFound()` call happens synchronously ahead of any suspending child), not a metadata-layer patch.

---

### 21. Next.js auto-injects `noindex` on a `notFound()` page, which limits — but does not eliminate — the SEO damage of the 200 status bug

**Rule:** Do not treat the automatic `<meta name="robots" content="noindex">` injection as a full fix for the 200-status soft-404 problem — it prevents Google from *indexing* the wrong content, but does not fix crawl-budget waste (item 17), analytics/monitoring pollution, or third-party tools/crawlers that do not honor `noindex` the way Google does.

**Mechanism:** "For example, when a 404 page is streamed to the client, Next.js includes a `<meta name="robots" content="noindex">` tag in the streamed HTML. This prevents search engines from indexing that URL even if the HTTP status is 200... In the streaming case, this does not lead to indexation because the page is explicitly marked noindex in the HTML." This is a real mitigation for Google-indexation specifically, but it is a content-layer patch over a transport-layer defect — it does nothing for crawl-budget consumption (the URL is still crawled as if live and successful, per item 17) or for any downstream system that inspects HTTP status rather than parsing meta tags.

**Acceptance criterion:** A route is only considered fully remediated when `curl -sI` returns 404 directly — "returns 200 but has `noindex` in the body" is a partial mitigation, not a pass, for this SOP's acceptance bar.

**Verification:** `curl -s https://www.cleanstart.com/<affected-route>/known-invalid-slug | grep -i 'noindex'` should currently succeed (confirming the partial mitigation is at least in place) while `curl -sI` of the same URL showing `200` documents the outstanding defect until item 20's fix ships.

**Source:** "Next.js includes a `<meta name="robots" content="noindex">` tag in the streamed HTML. This prevents search engines from indexing that URL even if the HTTP status is 200." — [loading.js — Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes), Next.js docs, v16.2.12, last updated 2026-03-13. T2.

---

## Part E — Caching, CDN behavior, ISR, and staleness

### 22. ISR treats 404 and 410 as normal, cacheable statuses — the site's bug is upstream of ISR, not caused by ISR itself

**Rule:** Do not blame ISR/caching in general for a 404-that-should-have-happened-but-didn't — Vercel's ISR explicitly supports caching a 404/410 response as the correct, fresh representation of a path; the defect in items 19–21 is that the *wrong status* (200) is what gets generated and then cached, not that ISR mishandles a correctly-produced 404.

**Mechanism:** Vercel's ISR documentation states revalidation is only considered failed (triggering stale-content fallback) for "Invalid HTTP status codes: Any status code other than 200, 301, 302, 307, 308, 404, or 410." This confirms 404 and 410 are first-class, expected, cacheable ISR outcomes — meaning once item 20's fix makes the route correctly return 404 before streaming, ISR will cache and serve that 404 exactly like any other valid response, with no special-casing needed.

**Acceptance criterion:** After the streaming-order fix (item 20) ships, a subsequent request to the same known-invalid slug — including one served from cache on a revalidation cycle — must still return 404, confirming ISR is correctly caching the corrected status rather than reverting to a stale 200.

**Verification:** Request the same invalid-slug URL twice in quick succession post-fix (`curl -sI` twice) — both should show 404; then force a revalidation (on-demand or wait for the `revalidate` interval) and re-check that the cached copy is still 404, not reverted to 200.

**Source:** "Vercel considers a revalidation failed when it encounters:... Invalid HTTP status codes: Any status code other than 200, 301, 302, 307, 308, 404, or 410." — [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration), Vercel docs, last updated 2026-04-30. T2.

---

### 23. ISR follows a stale-while-revalidate model: visitors get cached content immediately while regeneration happens in the background

**Rule:** Design content-freshness expectations around "stale until revalidated," not "always fresh" — under ISR, a visitor can receive content that is deliberately out of date until the next successful revalidation completes.

**Mechanism:** "ISR follows the stale-while-revalidate pattern: visitors get a fast cached response, and Vercel regenerates the page in the background based on a time interval or an API call you trigger... Both execute in the background: visitors continue to get the cached version while Vercel generates the new content." On failure, "Vercel keeps serving the existing cached content" and retries after a short TTL.

**Acceptance criterion:** Any content update expected to appear "immediately" for time-sensitive pages must use on-demand revalidation (explicit API call) rather than relying on the time-based `revalidate` interval alone.

**Verification:** For a page using time-based ISR, edit the source content, then request the page again before the `revalidate` window elapses — confirm the old (stale) version is still served, then confirm it updates only after the interval or an on-demand trigger.

**Source:** "ISR follows the stale-while-revalidate pattern... Both execute in the background: visitors continue to get the cached version while Vercel generates the new content... If revalidation fails, Vercel keeps serving the existing cached content." — [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration), Vercel docs, last updated 2026-04-30. T2.

---

### 24. `stale-while-revalidate` and `stale-if-error` are formally defined Cache-Control extensions with their own numeric semantics

**Rule:** When configuring `Cache-Control` on any origin/CDN response by hand (outside of framework-managed ISR), use the formally defined `stale-while-revalidate=N` and `stale-if-error=N` directives rather than inventing ad hoc caching logic — both accept an explicit seconds value bounding how stale a response may be served.

**Mechanism:** "The `stale-while-revalidate` Cache-Control extension indicates that caches MAY serve the response in which it appears after it becomes stale, up to the indicated number of seconds," and the cache "SHOULD attempt to revalidate it while still serving stale responses (i.e., without blocking)." Separately, "the `stale-if-error` Cache-Control extension indicates that when an error is encountered, a cached stale response MAY be used to satisfy the request" — where "error" is explicitly scoped to "any situation that would result in a 500, 502, 503, or 504 HTTP response status code."

**Acceptance criterion:** A hand-configured `Cache-Control` header using these extensions must specify a concrete, intentional seconds value for both directives — not omit the value or use an arbitrarily large placeholder.

**Verification:** `curl -sI https://example.com/path | grep -i cache-control` — confirm `stale-while-revalidate=<N>` and, where applicable, `stale-if-error=<N>` are present with deliberate values.

**Source:** "The `stale-while-revalidate` Cache-Control extension indicates that caches MAY serve the response in which it appears after it becomes stale, up to the indicated number of seconds." / "The `stale-if-error` Cache-Control extension indicates that when an error is encountered, a cached stale response MAY be used to satisfy the request, regardless of other freshness information... an error is any situation that would result in a 500, 502, 503, or 504 HTTP response status code." — [RFC 5861 §3–4](https://www.rfc-editor.org/rfc/rfc5861.html), IETF. T1.

---

### 25. `Vary` determines the cache key — get it wrong and a cache serves the wrong representation to the wrong audience (including crawlers)

**Rule:** Set `Vary` to list every request header that causes the origin to return a materially different representation (most commonly `User-Agent` for device-specific HTML, or `Accept-Encoding`) — omitting it lets a shared/CDN cache serve one audience's cached copy to another.

**Mechanism:** RFC 9111 requires: "When a cache receives a request that can be satisfied by a stored response and that stored response contains a Vary header field, the cache MUST NOT use that stored response without revalidation unless all the presented request header fields nominated by that Vary field value match those fields in the original request." Without a correct `Vary: User-Agent` (or equivalent), an intermediate cache can serve a desktop-rendered response to a mobile client (or to Googlebot) or vice versa — the same underlying failure mode as accidental cloaking, even though no deliberate bot-detection logic is involved.

**Acceptance criterion:** For any route whose server-rendered HTML differs by request header (device type, locale, A/B variant), the response includes a `Vary` header naming every such header, and the CDN in front of it is confirmed to respect `Vary` when computing cache keys.

**Verification:** `curl -sI -A "Googlebot" https://example.com/path` and `curl -sI -A "Mozilla/5.0 (iPhone...)" https://example.com/path` from a cold cache state — confirm distinct cache entries are created/served, not one representation leaking to the other, and that `Vary` is present in both responses.

**Source:** "When a cache receives a request that can be satisfied by a stored response and that stored response contains a Vary header field..., the cache MUST NOT use that stored response without revalidation unless all the presented request header fields nominated by that Vary field value match those fields in the original request." — [RFC 9111 §4.1](https://www.rfc-editor.org/rfc/rfc9111.html), IETF. T1. Vary field definition — [RFC 9110 §12.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-vary), IETF. T1.

**Anti-pattern:** Serving device-specific HTML (e.g., a stripped-down mobile variant) behind a CDN with no `Vary: User-Agent`, causing the CDN to cache whichever variant it saw first and serve it to all subsequent visitors and crawlers regardless of device — functionally indistinguishable from unintentional cloaking even without any bot-targeting code.

---

## Summary of explicit flags requested by this research pass

**Deprecated / materially changed in the last 24 months:**
- Item 4 — Google's position on dynamic rendering was rewritten (Dec 2025) from "acceptable workaround" to "deprecated, use SSR/SSG/hydration instead."
- Item 5 — Bing's public guidance (last updated 2018) has *not* followed Google's Dec-2025 shift and still recommends dynamic rendering — a live cross-engine divergence, not a resolved consensus.
- Google also removed a "design for accessibility without JavaScript" warning from its JS SEO basics doc on 2026-03-04, noting it had become "outdated and no longer as helpful as before" (surfaced during this research; not a rule in itself, but evidence Google is actively revising this doc family).

**Practitioner claims not supported by primary sources:**
- Item 2 — A fixed numeric "second wave of indexing" delay (e.g., specific hour/day/week figures) is not documented by Google; the primary source deliberately gives no fixed number.
- Item 8 — "302 redirects pass no signal" is contradicted directly by Google's own text, which calls it a "weak signal," not a null one.
- Item 14 — A specific "503/429 for more than 2 days drops the URL from the index" figure is widely repeated but could not be located in Google's current primary-source text, which says only "eventually."

**Directly relevant to the site's confirmed P0/P1 defect (nine `[slug]` routes returning 200 for unknown slugs):**
- Item 18 establishes Google names this exact SPA/JS pattern as a primary soft-404 cause.
- Item 20 is the load-bearing citation: Next.js's own docs now state explicitly that streaming locks the response status to 200 before `notFound()` can change it, and that the fix is to complete the existence check before any Suspense boundary flushes — not a `generateMetadata`-only patch, which the site's own prior investigation already found ineffective.
- Item 22 confirms ISR itself is not the culprit — it will correctly cache a 404 once the route actually produces one; the defect is entirely in the streaming-order mechanism from item 20.
