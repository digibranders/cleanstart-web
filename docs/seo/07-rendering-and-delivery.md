# Rendering & Delivery

**Module:** 07 — Rendering & delivery
**Prefix:** `RENDER`
**Review cadence:** Semi-annual (`00-index.md` §9)
**Scope:** SSR/ISR/CSR consequences for indexing, JS-dependent content, caching & revalidation, HTTP status-code semantics, CDN behaviour.
**Evidence base:** `docs/seo/evidence/sources/rendering.md` (25 researched items across the crawl→render→index pipeline, HTTP status-code semantics, soft-404 mechanics, and Next.js/Vercel caching); `docs/seo/evidence/verification-log.md` (three corrections required for this domain are applied below — #16 in RENDER-03, #17 in RENDER-04, #18 in RENDER-06 — plus the central claim under test, item 20, which is reproduced in RENDER-01 exactly as verified: "every sentence quoted... is an exact character-for-character match against the live `loading.js` doc"); `docs/seo/evidence/codebase-inventory.md` ("Rendering & Delivery" section, including its route-by-route `dynamic`/`revalidate`/`dynamicParams` table and its "Contradictions §D" `UNDETERMINED` list); `docs/seo/evidence/live-capture.json` plus direct live re-verification against `https://www.cleanstart.com` on 2026-07-29 (`curl` against all nine `[slug]`-family detail routes with an intentionally-invalid slug, and cache-header inspection on the home page and a real detail page).

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### RENDER-01 — Detail routes must complete their not-found check before any Suspense flush, not return a 200-status `notFound()` page

- **Severity:** P0
- **Applies:** Always — any dynamic `[slug]`/route-param detail route capable of rendering a not-found result under ISR
- **Rule:** Every dynamic detail route that can determine a resource does not exist must complete that determination — the data fetch that decides existence — and call `notFound()` (or otherwise change the response status) *before* any Suspense boundary in its render tree flushes a fallback. A route-level `loading.tsx`, a suspending Server Component, or any `await` upstream of the existence check locks the HTTP response status at `200` for the rest of that request, permanently, no matter what `notFound()` does afterward. Fixing this in `generateMetadata` alone cannot work: metadata resolution runs independently of the page body's streaming timeline, so the body can still stream a `200` regardless of what `generateMetadata` decided.
- **Why:** Next.js's own documentation states this mechanism explicitly and without qualification: "When streaming, a 200 status code will be returned to signal that the request was successful. The server can still communicate errors or issues to the client within the streamed content itself, for example, when using `redirect` or `notFound`. Because the response headers have already been sent to the client, the status code of the response cannot be updated." It further warns: "Some crawlers may label these responses as 'soft 404s.'" The exact trigger is named too: "The response body starts streaming when a Suspense fallback renders (for example, a `loading.tsx`) or when a Server Component suspends under a Suspense boundary. Place `notFound()` before those boundaries and before any `await` that may suspend." A companion page confirms the binary outcome this produces: "Next.js will return a 200 HTTP status code for streamed responses, and 404 for non-streamed responses." Google independently names this exact pattern — a JS-rendered app returning 200 for an error state — as a primary, documented cause of soft 404s, so the consequence is not hypothetical: "Soft 404 pages will continue to be crawled, and waste your budget," unlike a genuine 404, which Google stops processing and crawls with decreasing frequency.
- **Acceptance:**
  - For every `[slug]` (or equivalent dynamic-param) detail route, the not-found determination resolves and calls `notFound()` before any route-level `loading.tsx` or suspending child in that route tree renders a fallback
  - `generateMetadata` is never treated as the fix location for this defect — a `notFound()` call added there does not change the page body's streamed status code
  - `curl -sI` of a known-invalid slug returns `404` in the status line itself, not merely `noindex` inside a `200` body
- **Verify:** `curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1`
- **Reference:** `apps/web/src/app/blogs/[slug]/page.tsx:41,110`, `event/[slug]/page.tsx:28,97`, `author/[slug]/page.tsx:24,78`, `guide/[slug]/page.tsx:42,107`, `job/[slug]/page.tsx:38,98`, `news/[slug]/page.tsx:28,90`, `resources/[slug]/page.tsx:33,97`, `knowledge-hub/[slug]/page.tsx:66` (implicit `dynamicParams` default), `(legal)/legal/[slug]/page.tsx:64,95` — all nine set (or implicitly default to) `dynamicParams = true` and call `notFound()` inside an otherwise normally-rendered, ISR-eligible page
- **Source:** [Tier 2] "When streaming, a 200 status code will be returned... Because the response headers have already been sent to the client, the status code of the response cannot be updated... The response body starts streaming when a Suspense fallback renders... Place `notFound()` before those boundaries and before any `await` that may suspend." — [loading.js — Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes), Next.js docs, v16.2.12. "Next.js will return a `200` HTTP status code for streamed responses, and `404` for non-streamed responses." — [not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), Next.js docs, v16.2.12. [Tier 1] "Soft 404 pages will continue to be crawled, and waste your budget." — [Large site owner's guide to managing your crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central. "[SPAs] often return HTTP 200 status codes for error pages instead of proper status codes," resulting in "error pages being indexed and possibly shown in search results." — [Fix search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript), Google Search Central.
- **Tools:** No tool in `docs/seo/evidence/tool-scoring.md` distinguishes this streaming-order mechanism from an ordinary soft-404 content check — a rendered-content crawl (Screaming Frog, Sitebulb) sees a page that reads as "not found" and may or may not flag it as Soft 404 depending on the crawler's own heuristic; only a header-only `curl`/status check against a deliberately invalid slug reveals the actual transport-level defect.
- **Anti-patterns:** Adding `notFound()` inside `generateMetadata` as the fix — this was already attempted on this codebase and confirmed not to resolve the defect (it regressed a different metric instead), which is exactly what Next.js's own architecture predicts: `generateMetadata` resolves independently of the page body's streaming timeline, so the body can still stream a `200` regardless of what metadata decided.
- **Evidence:** Live-verified 2026-07-29 across all nine routes listed under **Reference**: every intentionally-invalid slug returns `HTTP/2 200` with `x-nextjs-prerender: 1`, `x-matched-path: /<route>/[slug]`, and a body containing the app's not-found UI (title still reads e.g. "Blog post | CleanStart", body contains "404" text, `<meta name="robots" content="noindex">`/`noindex, follow` present) — confirmed in `codebase-inventory.md` ("The soft-404 question"). By contrast, `email-signatures/[slug]/route.ts:89-94` — a Route Handler, not a `page.tsx` — returns a real `status: 404` `Response` for an unresolved slug, because Route Handlers return a `Response` object directly and are not subject to the App Router page/Suspense-streaming mechanism described above. This is direct proof the underlying Next.js primitive can produce a correct 404 on this exact codebase; the defect is specific to the `page.tsx` + `notFound()` + ISR/`dynamicParams` combination, not a platform limitation.
- **CleanStart:** Fail

---

## P1 — material organic or AI-visibility impact, no immediate loss

### RENDER-02 — A 200 status only starts the pipeline; it is not evidence the page will be indexed

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never treat "the URL returns 200" as sufficient evidence a page is, or will be, indexed. A 200 response only means the request succeeded; indexing is a separate, content-dependent decision made downstream by systems that independently evaluate quality, canonicalization, and duplication.
- **Why:** Google's own documentation states that once a 200 is returned, "Google passes on whatever it received to the next processing step (which is product specific)" — the status code hands control to indexing systems, it does not pre-decide their outcome. A 200 with thin, duplicate, or error-like content is not "safe" merely because the status line is correct.
- **Acceptance:**
  - No internal QA or launch checklist treats a `200` `curl` result as proof of indexing
  - Actual indexing state for a sampled URL set is confirmed via Search Console's URL Inspection, not via status code alone
- **Verify:** `curl -sI https://www.cleanstart.com/ | head -1`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] "Google passes on whatever it received to the next processing step (which is product specific)." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central.
- **Tools:** Not applicable as a single issue class — no tool in `docs/seo/evidence/tool-scoring.md` scores "200 conflated with indexed"; this is a verification-methodology rule, not a defect a crawl surfaces.
- **Anti-patterns:** Treating a clean crawl report (all 200s) as proof of healthy indexing without a separate Search Console coverage check.
- **Evidence:** No documentation or checklist reviewed in this pass (`docs/web/WEB-PRODUCTION.md`, `docs/seo/`) equates a 200 response with confirmed indexing; this rule is a framing constraint for future audits rather than a defect found in the current codebase.
- **CleanStart:** N/A

---

### RENDER-03 — A genuine 404 removes a previously-indexed URL; a brand-new 404 is never indexed in the first place

- **Severity:** P1
- **Applies:** Always
- **Rule:** Return a real HTTP 404 status — not a 200 page whose content merely reads as "not found" (RENDER-01) — for any resource that does not exist. If the URL was previously indexed, this is the mechanism that removes it; if it was never indexed, this is how it stays out.
- **Why:** RFC 9110 defines the status precisely: "The 404 (Not Found) status code indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists." Google's crawling pipeline acts on it directly: "The indexing pipeline removes the URL from the index if it was previously indexed. Newly encountered 404 pages aren't processed," and repeated 404s cause "crawling frequency [to] gradually decrease" for that URL.
- **Acceptance:**
  - Every unknown-slug/unknown-ID request under a dynamic route returns HTTP 404 as the actual response status, verifiable header-only, with no body parsing required
  - A page that "looks like" a 404 while returning 200 fails this criterion (see RENDER-01)
- **Verify:** `curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1`
- **Reference:** Same nine files cited in RENDER-01
- **Source:** [Tier 1] "The 404 (Not Found) status code indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists." — [RFC 9110 §15.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found), IETF. Corrected per `verification-log.md` correction #16 (the original research file's quotation did not match the live RFC text verbatim). "The indexing pipeline removes the URL from the index if it was previously indexed. Newly encountered 404 pages aren't processed. The crawling frequency gradually decreases." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central.
- **Tools:** Not documented as a standalone issue by name in `docs/seo/evidence/tool-scoring.md`; Sitebulb's closest hint is sitemap-scoped ("Not Found (4XX) URL in XML Sitemaps" — Critical), which would not catch a soft-404 slug that never appears in the sitemap at all.
- **Anti-patterns:** A "friendly" 200-status empty-state page for an unknown slug — it looks fine to a human visitor and is exactly the pattern this rule and RENDER-01 both prohibit.
- **Evidence:** Same live 2026-07-29 result as RENDER-01: all nine routes return 200, not 404, for a deliberately invalid slug.
- **CleanStart:** Fail

---

### RENDER-04 — 410 signals deliberate, permanent removal — prefer it over 404 for content intentionally deleted

- **Severity:** P1
- **Applies:** Content intentionally and permanently removed via an editorial unpublish/delete action — not merely missing, mistyped, or transiently unavailable
- **Rule:** When content is intentionally and permanently removed, return 410 (Gone) rather than 404 (Not Found). Reserve 404 for "cannot find"; use 410 for "was here, is deliberately gone forever."
- **Why:** RFC 9110 defines the distinction precisely: "The 410 (Gone) status code indicates that access to the target resource is no longer available at the origin server and that this condition is likely to be permanent." Google's crawlers treat 410 the same as other 4xx statuses ("the content doesn't exist"), but per Google Search Central Office Hours guidance reported contemporaneously, a 410 tends to be actioned for index removal marginally faster than a 404, even though the long-run outcome (dropped from the index) is identical for both.
- **Acceptance:**
  - A resource retired via an editorial delete/unpublish action returns 410, not 404 and not a 200 "this was removed" page
  - The redirect/routing table supports 410 as a first-class, editor-selectable status, not merely 301/302/307/308
- **Verify:** `curl -sI https://www.cleanstart.com/<retired-redirect-path> | head -1`
- **Reference:** `apps/web/src/proxy.ts:147-148` (`if (row.status === "410") return new NextResponse(null, { status: 410 });`), `apps/cms/src/payload/collections/Redirects.ts:72,84-85,95` (`410 Gone` as an editor-selectable `status` option; destination path becomes non-required when `status === '410'`), `apps/web/src/lib/redirects-cache.ts:24` (`RedirectStatus` union includes `"410"`)
- **Source:** [Tier 1] "The 410 (Gone) status code indicates that access to the target resource is no longer available at the origin server and that this condition is likely to be permanent." — [RFC 9110 §15.5.11](https://www.rfc-editor.org/rfc/rfc9110.html#name-410-gone), IETF. Corrected per `verification-log.md` correction #17 (the original file's quotation does not appear anywhere in current RFC 9110). Google treats 410 the same as other 4xx ("the content doesn't exist") per [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. Removal-speed nuance reported from Google Search Central Office Hours via [Search Engine Journal](https://www.searchenginejournal.com/google-404-status/254429/) — Tier 4, secondary report of a Tier 1 statement, supplementary only.
- **Tools:** Not documented as a distinct check — Ahrefs/Screaming Frog both report 410s as a generic 4xx status, not distinguishing "should this have been a 404 instead" as its own issue class.
- **Anti-patterns:** Using 404 for every deletion "because it's simpler," then being surprised that deliberately-retired resource pages take marginally longer to drop from the index than a 410 would have.
- **Evidence:** The mechanism is correctly implemented end-to-end: `Redirects.ts` exposes `410` as an editor-selectable status and makes the destination field non-required for it (`:85,95`), and `proxy.ts:147-148` returns a bare `410` response with no body for any redirect row so configured. No live URL returning 410 was captured in `docs/seo/evidence/live-capture.json`'s 2026-07-29 pass, so end-to-end behavior against a real retired resource was not directly observed in this pass.
- **CleanStart:** Partial

---

### RENDER-05 — Sustained 503/429 eventually drops previously-indexed URLs, with no fixed published day-count

- **Severity:** P1
- **Applies:** Always
- **Rule:** Use 503 (paired with `Retry-After`, RENDER-06) only for genuinely short outages or maintenance windows. Do not let a site or section return 503/429 for an extended period on the assumption that the index is safe by default.
- **Why:** Google's current documentation states the qualitative outcome without a fixed number: "5xx and 429 server errors prompt Google's crawlers to temporarily slow down with crawling... For Google Search, already indexed URLs are preserved in the index, but eventually dropped [under sustained errors]." A widely-repeated practitioner figure — "more than 2 days causes Google to drop URLs" — could not be located anywhere in Google's current primary-source text during this research pass; the primary doc says only "eventually," with no day-count attached, so no specific figure should be cited as Google's documented policy.
- **Acceptance:**
  - Any planned maintenance window returning 503 has a defined, monitored end time
  - A 503/429 condition persisting beyond single-digit days escalates as a P1/P0 SEO incident, not routine behavior
  - Production uptime monitoring covers more than homepage/health-endpoint liveness, so a sustained sitewide 5xx pattern is actually caught
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/`
- **Reference:** None — no reference implementation (no code path in `apps/web` deliberately sustains a 503/429 response; this rule governs incident response, not a coded behavior)
- **Source:** [Tier 1] "5xx and 429 server errors prompt Google's crawlers to temporarily slow down with crawling... For Google Search, already indexed URLs are preserved in the index, but eventually dropped [under sustained errors]." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` monitors sustained-error duration against index-loss risk; this requires correlating server error-rate dashboards against Search Console's Page Indexing report over time.
- **Anti-patterns:** Citing "2 days" or any other specific figure as Google's documented threshold for dropping sustained-error URLs from the index — treat any such number as an internal risk-tolerance choice, never as cited Google policy.
- **Evidence:** `docs/web/WEB-PRODUCTION.md:535-544` documents exactly two BetterStack HTTP monitors for production — `/api/health` (liveness) and `/` (homepage-render) — neither of which would specifically surface a sustained 5xx/429 pattern confined to a route family other than those two paths.
- **CleanStart:** Unverified — no uptime monitor covers sustained sitewide or route-family-scoped 5xx/429 specifically; only the homepage and health endpoint are watched

---

### RENDER-06 — Send `Retry-After` on every 503 and 429 response

- **Severity:** P1
- **Applies:** Always, for any response returning 503 or 429
- **Rule:** Always send a `Retry-After` header (seconds or HTTP-date) alongside every 503 and 429 response so well-behaved clients, including Googlebot, know when to retry instead of guessing.
- **Why:** RFC 9110 defines the header directly: "Servers send the 'Retry-After' header field to indicate how long the user agent ought to wait before making a follow-up request... The Retry-After field value can be either an HTTP-date or a number of seconds to delay after receiving the response." Absent this header, crawlers fall back to their own backoff heuristics, which may be far more conservative than the actual outage window.
- **Acceptance:**
  - Every 503 (planned maintenance / upstream outage) and 429 (rate limit) response includes a `Retry-After` header with a realistic value
  - The value is not omitted, and not a wildly conservative placeholder disconnected from the actual expected recovery time
- **Verify:** `curl -sI https://www.cleanstart.com/email-signatures/no-such-signature | grep -i retry-after`
- **Reference:** `apps/web/src/app/email-signatures/[slug]/route.ts:83-85` (`status: 503, headers: { ..., "Cache-Control": "no-store", "Retry-After": "30" }`); `apps/web/src/app/api/revalidate/route.ts:64,86` (503 for an unset secret env var, no `Retry-After` set)
- **Source:** [Tier 1] "Servers send the 'Retry-After' header field to indicate how long the user agent ought to wait before making a follow-up request... The Retry-After field value can be either an HTTP-date or a number of seconds to delay after receiving the response." — [RFC 9110 §10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after), IETF. Corrected per `verification-log.md` correction #18 (the original file's quotation was a paraphrase, not the literal RFC sentence). `Retry-After` usage alongside 429 originates in [RFC 6585 §4](https://datatracker.ietf.org/doc/html/rfc6585#section-4), IETF.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` checks for `Retry-After` presence on 5xx/429 responses.
- **Anti-patterns:** Returning 503 for a maintenance window with no `Retry-After` header at all, forcing crawlers and monitoring tools to guess the outage duration.
- **Evidence:** The one live GET-reachable route capable of returning 503 to a crawler following a link — `email-signatures/[slug]/route.ts` — correctly sets `Retry-After: 30` alongside its CMS-outage 503 (`:83-85`). `/api/revalidate`'s 503 (unset-secret case, `:64,86`) has no `Retry-After`, but this endpoint is POST-only and not a route Googlebot's GET-based crawling would ever hit, so it is out of this rule's crawler-facing scope even though it is a code-level gap.
- **CleanStart:** Partial

---

### RENDER-07 — Content depending solely on client-side JavaScript execution carries real indexing risk

- **Severity:** P1
- **Applies:** Any page whose primary content (headline, price, date, availability) is not present in the initial HTTP response
- **Rule:** Do not rely exclusively on client-side rendering for content that must be indexed or that changes on a time-sensitive basis. Confirm JS-dependent content's indexability against Search Console's rendered HTML, not a raw `curl`/view-source check — crawling, rendering, and indexing are three separate, independently-timed stages, and a page can be crawled long before (or without ever being) rendered.
- **Why:** Google's own documentation frames the risk directly: "Some JavaScript sites may use the app shell model where the initial HTML does not contain the actual content and Google needs to execute JavaScript before being able to see the actual page content... server-side or pre-rendering is still a great idea because it makes your website faster for users and crawlers, and not all bots can run JavaScript." Separately: "Googlebot queues pages for both crawling and rendering... Once Google's resources allow, a headless Chromium renders the page and executes the JavaScript... Google also uses the rendered HTML to index the page" — rendering is a distinct, more resource-gated stage than the initial crawl.
- **Acceptance:**
  - For a representative sample of pages, `curl -s <url>` contains the primary content text (headline + first paragraph, or price/date for commerce/event pages) — not just an empty root element and script tags
  - Any indexability confirmation for JS-dependent content uses Search Console's URL Inspection "Rendered HTML"/"Screenshot" view, not a raw HTML check alone
- **Verify:** `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -c '<h1'`
- **Reference:** None — no reference implementation (this rule documents an absence: no primary page content in `apps/web` is gated behind client-only rendering)
- **Source:** [Tier 1] "Some JavaScript sites may use the app shell model where the initial HTML does not contain the actual content and Google needs to execute JavaScript before being able to see the actual page content... server-side or pre-rendering is still a great idea." / "Googlebot queues pages for both crawling and rendering... Google also uses the rendered HTML to index the page." — [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), Google Search Central.
- **Tools:** Lighthouse's SEO category does not distinguish "content present in raw HTML" from "content present after hydration" as a scored audit; this remains a manual Search Console check.
- **Anti-patterns:** Confirming indexability by `curl`-ing a page and reading the raw HTML alone — an app-shell page can look empty even though Google may eventually render and index it, and vice versa, a raw-HTML check can miss a rendering failure that silently breaks indexing.
- **Evidence:** Every route's `page.tsx` entry point is an `async` server component — no `"use client"` directive was found at the top of any `app/**/page.tsx` file (`codebase-inventory.md`, "Server- vs. client-rendered content"). Primary content (article bodies, hero data, listings) is fetched server-side and passed as props. The only primary-surface `"use client"` component is `RoiSimulator.tsx:1`, and the `/roi-calculator` page it lives on is `noindex: true, nofollow: true` — this client-only interactive centerpiece sits on a page not intended to be indexed regardless.
- **CleanStart:** Pass

---

### RENDER-08 — Do not build new dynamic-rendering infrastructure — Google has deprecated it, but Bing has not

- **Severity:** P1
- **Applies:** Always — any future rendering-strategy decision
- **Rule:** Do not stand up new infrastructure around dynamic rendering (serving a separately pre-rendered response keyed off User-Agent detection for bots). Use server-side rendering, static generation, or hydration instead — which Next.js already provides natively. Do not treat "search engines" as a monolith on this point: verify Google's and Bing's current guidance separately before citing a single unified recommendation.
- **Why:** Google's documentation was rewritten (December 2025) to state plainly: "Dynamic rendering was a workaround and not a long-term solution for problems with JavaScript-generated content in search engines... Instead, we recommend that you use server-side rendering, static rendering, or hydration as a solution." This is a genuine, dated policy change, not a longstanding rule — any pre-2025 recommendation of dynamic rendering as a first-class solution is now stale. Bing's own webmaster guidance, by contrast, still frames dynamic rendering as "a great alternative for websites relying heavily on JavaScript" — a real, live cross-engine divergence, though that Bing guidance is unrefreshed since 2018 and should be weighed with that age in mind.
- **Acceptance:**
  - No new route in the codebase implements User-Agent-based bot detection that serves a structurally different (pre-rendered vs. client-rendered) response to Googlebot vs. regular users
  - Any rendering-strategy decision document cites Google's and Bing's current guidance separately, with publication dates, rather than a single unified "search engines recommend/don't recommend X" claim
- **Verify:** `grep -rni "googlebot" apps/web/src --include="*.ts*"`
- **Reference:** `apps/web/src/app/layout.tsx:106,114`, `apps/web/src/lib/seo/canonical.ts:165,170` — all four hits are the `googleBot` robots-meta-directive object key (a metadata field name consumed by Next.js's `Metadata` API), not User-Agent sniffing or response-branching logic
- **Source:** [Tier 1] "Dynamic rendering was a workaround and not a long-term solution... Instead, we recommend that you use server-side rendering, static rendering, or hydration as a solution." — [Dynamic rendering as a workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering), Google Search Central, rewritten December 2025. [Tier 1] Bing Webmaster guidance frames dynamic rendering as "a great alternative for websites relying heavily on JavaScript" — [Bing Webmaster Blog, "bingbot Series: JavaScript, Dynamic Rendering, and Cloaking"](https://blogs.bing.com/webmaster/october-2018/bingbot-Series-JavaScript,-Dynamic-Rendering,-and-Cloaking-Oh-My), October 2018, not refreshed since.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` detects dynamic-rendering infrastructure as a distinct issue class; cross-check against Search Console coverage-report anomalies between "as rendered" and "as crawled" views if suspected.
- **Anti-patterns:** Standing up a Rendertron/Puppeteer-based dynamic-rendering layer as the primary long-term architecture for a new build in 2026, when the origin framework already supports SSR/SSG/ISR natively; equally, citing "search engines" as a single monolith when Google and Bing currently disagree.
- **Evidence:** No User-Agent-based bot-detection or response-branching code was found anywhere in `apps/web/src`; the four `googlebot`-matching grep hits are all the unrelated `googleBot` metadata key used to scope robots directives specifically to Google's crawler (e.g. a different `noindex` value for Googlebot than the generic `robots` directive), not dynamic-rendering logic.
- **CleanStart:** Pass

---

## P2 — meaningful improvement, non-urgent

### RENDER-09 — 429 is a server-overload signal that throttles crawl rate, not a removal trigger by itself

- **Severity:** P2
- **Applies:** Always, for any route capable of rate-limiting a client
- **Rule:** Return 429 only when actually rate-limiting a specific client, and expect Google to interpret it as "back off, this server is overloaded," not "remove this URL." Never return 429 to Googlebot's traffic as a blanket policy.
- **Why:** "Google's crawlers treat the 429 status code as a signal that the server is overloaded, and it's considered a server error," and Google's crawl-capacity logic reacts identically to 429 and 5xx: "If the site... responds with... rate-limiting signals (such as HTTP 429), the [crawl capacity] limit goes down and Google crawls less." Sustained 429 is functionally equivalent to sustained 5xx (RENDER-05) for this purpose.
- **Acceptance:**
  - 429 responses are transient and tied to actual load-shedding logic for a specific client exceeding a rate window
  - No route returns 429 to Googlebot's user agent as a matter of blanket policy
- **Verify:** `curl -sI -A "Googlebot" https://www.cleanstart.com/ | head -1`
- **Reference:** None — no reference implementation (no crawler-facing route in `apps/web` currently returns 429; `components/feedback/state-presets.ts:97` defines only a client-side UI illustration for a 429 error state, not a server-side rate limiter)
- **Source:** [Tier 1] "Google's crawlers treat the 429 status code as a signal that the server is overloaded, and it's considered a server error." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. "If the site slows down... or responds with server errors (5xx HTTP status codes) or rate-limiting signals (such as HTTP 429), the limit goes down and Google crawls less." — [Large site owner's guide to managing your crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), Google Search Central.
- **Tools:** Not applicable — monitoring the ratio of 429 responses to Googlebot's user agent in server logs is an ops/log-analysis task, not something any of the five surveyed tools score.
- **Anti-patterns:** Applying a global rate limit that also throttles Googlebot's normal crawl traffic — this reads as a crawl-capacity-reducing server error, not a targeted anti-abuse measure.
- **Evidence:** No crawler-facing route currently returns 429; the only related artifact is a client-side error-state illustration asset (`state-presets.ts:97`) with no corresponding server-side rate-limit logic found in this pass.
- **CleanStart:** N/A

---

### RENDER-10 — `dynamicParams` defaults to `true`: unknown params are still rendered, not auto-404'd

- **Severity:** P2
- **Applies:** Any dynamic route segment using `generateStaticParams`
- **Rule:** Understand that `dynamicParams: true` (the default, and the implicit behavior when the export is omitted) does not itself mean "unknown paths 404" — it means "unknown paths are still rendered on demand." Whether that render then correctly calls `notFound()` before any Suspense flush (RENDER-01) is a separate, additional requirement Next.js does not enforce automatically.
- **Why:** Next.js's own reference states this precisely: "`true` (default): Dynamic route segments not included in `generateStaticParams` are generated at request time... `false`: Dynamic route segments not included in `generateStaticParams` will return a 404." With the default `true`, the page component itself is solely responsible for detecting the missing resource.
- **Acceptance:**
  - For any route where every valid slug/ID is enumerable at build/revalidate time, `dynamicParams = false` is the safer default
  - Where params are inherently open-ended, the page calls `notFound()` for every not-found case, verified by a test that asserts the resulting HTTP status
- **Verify:** `grep -rn "dynamicParams" apps/web/src/app`
- **Reference:** `apps/web/src/app/blogs/[slug]/page.tsx:41`, `event/[slug]/page.tsx:28`, `author/[slug]/page.tsx:24`, `guide/[slug]/page.tsx:42`, `job/[slug]/page.tsx:38`, `news/[slug]/page.tsx:28`, `resources/[slug]/page.tsx:33` (all explicit `true`); `knowledge-hub/[slug]/page.tsx`, `(legal)/legal/[slug]/page.tsx` (no export present — implicit default `true`)
- **Source:** [Tier 2] "`true` (default): Dynamic route segments not included in `generateStaticParams` are generated at request time. `false`: Dynamic route segments not included in `generateStaticParams` will return a 404." — [dynamicParams](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams), Next.js docs, v16.2.12.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` inspects Next.js segment-config exports; this is a source-level correctness property.
- **Anti-patterns:** Assuming `dynamicParams`'s implicit default is a deliberate, reviewed choice rather than the framework's silent fallback — two of the nine affected routes (`knowledge-hub/[slug]`, `legal/[slug]`) never declare the export at all.
- **Evidence:** All nine `[slug]` routes leave `dynamicParams` at (explicit or implicit) `true` with no route-level test asserting the resulting HTTP status for an unknown slug — `codebase-inventory.md`'s "Tests" section confirms "no unit test for any `[slug]/page.tsx`'s `notFound()` branch, and no Playwright e2e spec... asserts HTTP status codes for unknown slugs."
- **CleanStart:** Fail

---

### RENDER-11 — ISR treats 404 and 410 as normal, cacheable statuses — ISR itself is not the culprit in RENDER-01

- **Severity:** P2
- **Applies:** Always, for any ISR-served route
- **Rule:** Do not blame ISR/caching in general for a 404-that-should-have-happened-but-didn't. Vercel's ISR explicitly supports caching a 404/410 response as the correct, fresh representation of a path — the RENDER-01 defect is that the *wrong status* (200) is what gets generated and then cached, not that ISR mishandles a correctly-produced 404.
- **Why:** Vercel's ISR documentation states revalidation is only considered failed (triggering stale-content fallback) for "Invalid HTTP status codes: Any status code other than 200, 301, 302, 307, 308, 404, or 410." This confirms 404 and 410 are first-class, expected, cacheable ISR outcomes — once RENDER-01's fix makes a route correctly return 404 before streaming, ISR will cache and serve that 404 exactly like any other valid response, with no special-casing needed.
- **Acceptance:**
  - After RENDER-01's fix ships, a subsequent request to the same known-invalid slug — including one served from cache on a revalidation cycle — still returns 404
  - A forced revalidation (on-demand or interval-based) of a corrected route continues to serve 404, not a reversion to a stale 200
- **Verify:** `curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1 && curl -sI https://www.cleanstart.com/blogs/no-such-slug-xyz123 | head -1`
- **Reference:** Same nine files cited in RENDER-01
- **Source:** [Tier 2] "Vercel considers a revalidation failed when it encounters:... Invalid HTTP status codes: Any status code other than 200, 301, 302, 307, 308, 404, or 410." — [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration), Vercel docs.
- **Tools:** Not applicable — this is a platform-behavior confirmation, not a tool-scored issue.
- **Anti-patterns:** Treating RENDER-01 as an "ISR bug" and attempting to work around it with cache-control tuning instead of fixing the streaming-order defect at its source.
- **Evidence:** No CleanStart-specific test of this ISR-caching behavior exists yet, because RENDER-01's fix has not shipped — there is currently no route on this codebase producing a correct 404 for a `[slug]` route to observe being cached correctly by ISR.
- **CleanStart:** Unverified — the fix RENDER-01 requires has not shipped, so ISR's correct caching of the corrected status cannot yet be confirmed end-to-end on this codebase; the underlying Vercel platform behavior itself is documented and not in question

---

### RENDER-12 — Read `x-vercel-cache` + `age` + `x-nextjs-stale-time` together — `Cache-Control` alone is uninformative on Vercel

- **Severity:** P2
- **Applies:** Always, for any page served from Vercel's ISR/prerender cache
- **Rule:** Do not read `Cache-Control` alone to judge a page's actual freshness. Every prerendered/ISR page on this site emits the identical generic `public, max-age=0, must-revalidate` — the real freshness signal is the combination of `x-vercel-cache` (`HIT`/`STALE`/`MISS`), `age`, and `x-nextjs-stale-time`.
- **Why:** Vercel's ISR documents the stale-while-revalidate serving model these headers reflect: "ISR follows the stale-while-revalidate pattern: visitors get a fast cached response, and Vercel regenerates the page in the background based on a time interval or an API call you trigger." A generic `Cache-Control` value is expected under this model and does not by itself indicate whether the served copy is fresh, stale-but-serving, or mid-regeneration.
- **Acceptance:**
  - Any freshness/caching audit inspects `x-vercel-cache`, `age`, and `x-nextjs-stale-time` together, not `Cache-Control` in isolation
  - The exact relationship between `x-nextjs-stale-time` and a given route's own `revalidate` value is treated as platform-specific and not assumed to equal the code's `revalidate` setting without a confirming source
- **Verify:** `curl -sI https://www.cleanstart.com/ | grep -iE 'x-vercel-cache|x-nextjs-stale-time|^age:'`
- **Reference:** None — no reference implementation (this is an observed live-header pattern, not a code-controlled behavior)
- **Source:** [Tier 2] "ISR follows the stale-while-revalidate pattern: visitors get a fast cached response, and Vercel regenerates the page in the background based on a time interval or an API call you trigger." — [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration), Vercel docs.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` interprets Vercel-specific cache headers as a combined signal.
- **Anti-patterns:** Reporting "this page's `Cache-Control` is `max-age=0`, so it's never cached" — on this codebase every prerendered page carries that exact header regardless of actual cache state; the real state is in the companion headers.
- **Evidence:** Live-fetched 2026-07-29: the home page and `/blogs` both show `cache-control: public, max-age=0, must-revalidate`, `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, `x-nextjs-stale-time: 300`; a real published blog slug showed `x-vercel-cache: STALE`, `age: 1804`, `x-nextjs-stale-time: 300`. `x-nextjs-stale-time: 300` was observed on every prerendered page checked regardless of that page's own `revalidate = 3600` segment export (`page.tsx:63` sets `3600` for the home page). Whether this constant reflects a Vercel-platform floor distinct from the code's `revalidate`/`expireTime` values, or something else, could not be resolved by reading the repository — per `codebase-inventory.md` Contradictions §D, this would need Vercel's ISR runtime documentation/support or a controlled revalidate-timing experiment.
- **CleanStart:** Unverified — no Vercel-platform documentation or controlled experiment available in this pass to resolve what `x-nextjs-stale-time` represents relative to the code's own `revalidate` value

---

### RENDER-13 — `Vary` determines the cache key; get it wrong and a shared cache serves the wrong representation to the wrong audience

- **Severity:** P2
- **Applies:** Any route whose server-rendered HTML differs by request header (device type, locale, A/B variant)
- **Rule:** Set `Vary` to list every request header that causes the origin to return a materially different representation — most commonly `User-Agent` for device-specific HTML, or `Accept-Encoding`. Omitting it lets a shared/CDN cache serve one audience's cached copy to another, including to a crawler.
- **Why:** RFC 9111 requires: "When a cache receives a request that can be satisfied by a stored response and that stored response contains a Vary header field, the cache MUST NOT use that stored response without revalidation unless all the presented request header fields nominated by that Vary field value match those fields in the original request." Without a correct `Vary`, an intermediate cache can serve a desktop-rendered response to a mobile client (or to Googlebot) or vice versa — functionally indistinguishable from unintentional cloaking, even with no deliberate bot-detection logic involved.
- **Acceptance:**
  - For any route whose HTML differs by request header, the response includes a `Vary` header naming every such header
  - The CDN in front of that route is confirmed to respect `Vary` when computing cache keys
- **Verify:** `curl -sI -A "Googlebot" https://www.cleanstart.com/ | grep -i '^vary'`
- **Reference:** None — no reference implementation (per RENDER-08's evidence, this codebase's HTML does not branch on `User-Agent`, so this rule's failure mode is not currently reachable; see Evidence)
- **Source:** [Tier 1] "When a cache receives a request that can be satisfied by a stored response and that stored response contains a Vary header field..., the cache MUST NOT use that stored response without revalidation unless all the presented request header fields nominated by that Vary field value match those fields in the original request." — [RFC 9111 §4.1](https://www.rfc-editor.org/rfc/rfc9111.html), IETF. Vary field definition — [RFC 9110 §12.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-vary), IETF.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` cross-requests with distinct User-Agents to detect a `Vary` gap.
- **Anti-patterns:** Serving device-specific HTML behind a CDN with no `Vary: User-Agent`, causing the CDN to cache whichever variant it saw first and serve it to all subsequent visitors and crawlers regardless of device.
- **Evidence:** Per RENDER-08's evidence, no route in `apps/web` branches its rendered HTML on `User-Agent` or any other header, so the specific failure mode this rule guards against (a shared cache leaking one audience's variant to another) has no current trigger condition to exercise on this codebase.
- **CleanStart:** N/A

---

### RENDER-14 — Content freshness follows stale-while-revalidate, not always-fresh — verify the actual revalidation configuration, not a comment describing it

- **Severity:** P2
- **Applies:** Always
- **Rule:** Design content-freshness expectations around "stale until the next revalidation," not "always fresh." Any content update expected to appear immediately for a time-sensitive page must use on-demand revalidation (an explicit API call) rather than relying on the time-based `revalidate` interval alone — and the actual revalidation configuration for a given route must be traced to its call site, not trusted from a code comment describing it.
- **Why:** Vercel's ISR documents the model directly: "ISR follows the stale-while-revalidate pattern: visitors get a fast cached response, and Vercel regenerates the page in the background based on a time interval or an API call you trigger... Both execute in the background: visitors continue to get the cached version while Vercel generates the new content." On revalidation failure, "Vercel keeps serving the existing cached content" and retries after a short TTL — so a stale comment or an unreachable on-demand code path can silently diverge from what a route actually does.
- **Acceptance:**
  - Any content update expected to appear "immediately" uses on-demand revalidation, not the time-based interval alone
  - A route's documented revalidation interval is traced to its actual fetch call site(s), not assumed from a comment
  - Every implemented on-demand revalidation auth mode has at least one in-repo caller and test coverage, or is explicitly flagged as reserved for a named external caller
- **Verify:** `grep -n "revalidateSeconds\|fetchCMS" apps/web/src/lib/podcast.ts`
- **Reference:** `apps/web/src/app/podcast/page.tsx:31-35` (comment claims the CMS fetch uses "revalidate 60"), `apps/web/src/lib/cms-fetch.ts:47,111-120` (shared `DEFAULT_REVALIDATE_SECONDS = 3600`, applied unless a call site passes `revalidateSeconds`), `apps/web/src/app/api/revalidate/route.ts:59-79` (Mode 2, `{secret, tag}` body, restricted to a `NAV_CACHE_TAGS` allow-list), `apps/cms/src/payload/lib/web-revalidate.ts:92-100` (`revalidateWeb()`, the CMS's only sender, always constructs Mode 1's Bearer-token shape)
- **Source:** [Tier 2] "ISR follows the stale-while-revalidate pattern... Both execute in the background: visitors continue to get the cached version while Vercel generates the new content... If revalidation fails, Vercel keeps serving the existing cached content." — [Incremental Static Regeneration (ISR)](https://vercel.com/docs/incremental-static-regeneration), Vercel docs.
- **Tools:** Not applicable — no tool scores revalidation-configuration accuracy against source comments; this requires a code trace.
- **Anti-patterns:** Editing content and expecting it to appear immediately on a time-based-ISR page without triggering on-demand revalidation; trusting a caching comment as documentation of actual behavior without tracing the call site.
- **Evidence:** `podcast/page.tsx:31-35`'s comment states the page's CMS fetch uses "revalidate 60." Re-run 2026-07-29 (the original pass's `Verify` command literally matched `fetchCMS(` as a fixed string, which misses every call site because each one is written `fetchCMS<PodcastListResponse>(...)` with a generic type argument between the name and the paren — a false-negative Verify command, now corrected above): all three `fetchCMS<PodcastListResponse>()` calls in `lib/podcast.ts` (`getHeroEpisode`, `getPodcastEpisodes`, `getFeaturedPodcastEpisodes`) pass only a URL string, no `CmsFetchOptions.revalidateSeconds` override. Per `cms-fetch.ts:73-121`, that means every one of them falls through to `DEFAULT_REVALIDATE_SECONDS = 3600`. The call-site trace is now definitive: the page's actual effective CMS-fetch interval is 3600s, and the `page.tsx:31-35` comment's "revalidate 60" claim is stale/wrong, not merely unconfirmed — a live instance of exactly the failure mode this rule warns against (trusting a comment instead of tracing the call site). Separately, `/api/revalidate`'s Mode 2 auth branch (`route.ts:59-79`, including its `NAV_CACHE_TAGS` allow-list) has no in-repo caller — the CMS's only sender always uses Mode 1's Bearer-token shape, and a repo-wide search for `process.env.REVALIDATE_SECRET` found exactly one hit, the read site itself. An external caller (a manual request, an undiscovered script, an unmatched Payload hook) cannot be excluded by grep alone, so that half of this rule's scope stays genuinely unverifiable from here.
- **CleanStart:** Unverified — the podcast page's revalidation interval is now traced and confirmed (3600s; the comment's "revalidate 60" is wrong), but the on-demand Mode 2 path's reachability from outside this repo still cannot be excluded by static analysis, and that alone is what keeps this rule's overall acceptance open

---

## P3 — hygiene, marginal or speculative gain

### RENDER-15 — Never state a fixed render-queue or "second wave" delay — Google deliberately gives no number

- **Severity:** P3
- **Applies:** Always
- **Rule:** Never state or design around a fixed "rendering delay" (e.g., "Google re-renders every N hours/days") for JS-dependent content. Google deliberately does not commit to a number, and content that must appear quickly should not depend on JS execution timing at all (see RENDER-07).
- **Why:** Google's documentation states only: "The page may stay on this queue for a few seconds, but it can take longer than that" — an intentionally elastic, load-dependent window, not a fixed SLA. The phrase "second wave of indexing" and specific delay figures ("hours to weeks," "up to 2 weeks") circulating in practitioner literature are a reconstruction of a 2018 Google I/O talk, not current official terminology; the current basics page does not use the phrase "second wave" at all.
- **Acceptance:** Any internal doc, ticket, or SOP asserting a specific numeric "second wave" delay must cite a named, dated empirical study for that number — never cite it as Google policy.
- **Verify:** `curl -s https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics | grep -c "second wave"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] "The page may stay on this queue for a few seconds, but it can take longer than that." — [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), Google Search Central.
- **Tools:** Not applicable — no tool scores documentation-currency claims about render-queue timing.
- **Anti-patterns:** Citing "Google re-indexes JS content within 48 hours" (or any other specific figure) as documented Google policy.
- **Evidence:** No documentation reviewed in this repo (`docs/web/`, `docs/seo/`) asserts a fixed render-queue delay figure.
- **CleanStart:** N/A

---

### RENDER-16 — Support conditional GET so unchanged pages can return 304 without altering indexed content

- **Severity:** P3
- **Applies:** Always, for static or rarely-changing resources
- **Rule:** Support conditional GET (`If-None-Match`/`If-Modified-Since`) so unchanged pages can return 304 instead of a full 200 body. This makes re-crawling cheaper without changing what is indexed.
- **Why:** RFC 9110 defines 304 as the response when "a conditional GET or HEAD request has been received and would have resulted in a 200 (OK) response if it were not for the fact that the condition evaluated to false" — i.e., content is unchanged. Google's crawlers "signal the next processing system that the content is the same as last time it was crawled," which may still trigger signal recalculation but performs no content re-indexing.
- **Acceptance:** For a static/rarely-changing resource, a second request with `If-None-Match` set to the first response's `ETag` returns 304 with an empty body, not a full 200.
- **Verify:** `ETAG=$(curl -sI https://www.cleanstart.com/ | grep -i '^etag:' | sed -E 's/.*"([^"]+)".*/\1/'); curl -sI -H "If-None-Match: \"$ETAG\"" https://www.cleanstart.com/ | head -1` → `HTTP/2 304`
- **Reference:** None — no reference implementation (conditional-GET support is served by Vercel's edge layer for this deployment, not application code)
- **Source:** [Tier 1] "A conditional GET or HEAD request has been received and would have resulted in a 200 (OK) response if it were not for the fact that the condition evaluated to false." — [RFC 9110 §15.4.5](https://www.rfc-editor.org/rfc/rfc9110.html#name-304-not-modified), IETF. "Google crawlers signal the next processing system that the content is the same as last time it was crawled." — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` tests conditional-GET support as a distinct issue.
- **Anti-patterns:** Serving a full 200 body on every request for content that has not changed since the client's last fetch, wasting both server and crawl resources.
- **Evidence:** Re-run 2026-07-29: `curl -sI https://www.cleanstart.com/` returns `etag: "bdlpg1198lb9k7"`; a follow-up request with `If-None-Match` set to that value returns `HTTP/2 304` with no body. Conditional-GET support is live on this deployment. (The original pass's stated Verify command had a shell-quoting defect — `cut -d'\"'` received a two-character delimiter and silently failed — which produced a false `200`/no-match result if actually run; the command above avoids the nested-quoting pitfall and was confirmed to reproduce the `304`.)
- **CleanStart:** Pass

---

### RENDER-17 — `stale-while-revalidate` and `stale-if-error` are formally defined `Cache-Control` extensions with their own numeric semantics

- **Severity:** P3
- **Applies:** Any hand-configured `Cache-Control` header set outside of framework-managed ISR
- **Rule:** When configuring `Cache-Control` by hand on any origin/CDN response, use the formally defined `stale-while-revalidate=N` and `stale-if-error=N` directives rather than inventing ad hoc caching logic — both accept an explicit seconds value bounding how stale a response may be served.
- **Why:** RFC 5861 defines both extensions precisely: "The `stale-while-revalidate` Cache-Control extension indicates that caches MAY serve the response in which it appears after it becomes stale, up to the indicated number of seconds," and the cache "SHOULD attempt to revalidate it while still serving stale responses (i.e., without blocking)." Separately, "the `stale-if-error` Cache-Control extension indicates that when an error is encountered, a cached stale response MAY be used to satisfy the request" — scoped explicitly to "any situation that would result in a 500, 502, 503, or 504 HTTP response status code."
- **Acceptance:** A hand-configured `Cache-Control` header using these extensions specifies a concrete, intentional seconds value for both directives — never omitted, never an arbitrarily large placeholder.
- **Verify:** `curl -sI https://www.cleanstart.com/.well-known/api-catalog | grep -i cache-control`
- **Reference:** `apps/web/next.config.ts:52-64` (the one explicit `headers()` rule in the codebase, for `/.well-known/api-catalog` only: `Cache-Control: public, max-age=3600, must-revalidate` — neither `stale-while-revalidate` nor `stale-if-error` is set on this hand-configured header)
- **Source:** [Tier 1] "The `stale-while-revalidate` Cache-Control extension indicates that caches MAY serve the response in which it appears after it becomes stale, up to the indicated number of seconds." / "the `stale-if-error` Cache-Control extension indicates that when an error is encountered, a cached stale response MAY be used to satisfy the request, regardless of other freshness information... an error is any situation that would result in a 500, 502, 503, or 504 HTTP response status code." — [RFC 5861 §3–4](https://www.rfc-editor.org/rfc/rfc5861.html), IETF.
- **Tools:** Not applicable — no tool in `docs/seo/evidence/tool-scoring.md` inspects `Cache-Control` for these specific RFC 5861 extensions.
- **Anti-patterns:** Omitting a concrete value for either directive, or using a placeholder so large it defeats the purpose of bounding staleness.
- **Evidence:** The one hand-configured `Cache-Control` header in the codebase (`/.well-known/api-catalog`, `next.config.ts:52-64`) uses only `public, max-age=3600, must-revalidate` — no `stale-while-revalidate`/`stale-if-error` extension is set. This is not itself a defect (the route is a low-traffic linkset manifest, not time-sensitive indexable content), but it means neither extension is exercised anywhere on this codebase to verify against.
- **CleanStart:** N/A
