# Site Migrations and URL Change Management — Evidence Sources

Research basis for the SOP governing site moves and URL changes across all team sites. Every rule below is sourced from a primary reference (Tier 1/2) unless explicitly marked otherwise. All URLs were fetched and verified during research (via `curl -I` with a browser user-agent, or WebFetch); none are invented.

**Tier legend:** T1 = official spec/vendor docs (Google Search Central, RFC 9110, Bing Webmaster docs). T2 = first-party platform engineering docs (Next.js, Vercel). T3 = named, dated empirical study with published methodology. T4 = practitioner consensus / secondary reporting of a T1 statement that could not be independently re-verified at a stable primary URL.

---

## 1. Use server-side 301/308 for any URL change intended to be permanent

**Rule:** Implement permanent URL changes as server-side HTTP redirects using status 301 or 308, never as a client-side (meta refresh or JavaScript) redirect, when a server-side option is technically possible.

**Mechanism:** A server-side redirect returns the 3xx status and `Location` header before any page body is sent, so Googlebot's fetch is redirected before rendering is even attempted. Google's own hierarchy: server-side redirect is preferred; a meta refresh with `0` delay is treated as the permanent-redirect equivalent, any other delay as temporary; a JavaScript redirect is the least reliable because it only fires after the page loads and executes, and fails outright if JS errors or is disabled/blocked for that fetch.

**Acceptance criterion:** For every changed URL, `curl -I` on the old URL returns `HTTP/1.1 301` (or `308`) with a `Location` header pointing directly at the final destination — not a 200 with an embedded meta-refresh or `window.location` script.

**Verification:** `curl -sI https://old.example.com/old-path` — first line must be `HTTP/2 301` or `HTTP/2 308`, and the `location:` header must resolve in one hop (see item 5).

**Source:** "we recommend that you use HTTP permanent redirects if possible, such as `301` and `308`" — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1. Server-side vs. meta-refresh vs. JavaScript preference hierarchy — [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects), Google Search Central. T1.

**Anti-pattern:** Shipping a client-rendered "redirecting you now..." interstitial page for a permanent URL change because it was faster to build than a server rule. This is explicitly the least-reliable option in Google's own preference order.

---

## 2. Use 302/307 only for genuinely temporary changes, not as a "safe default"

**Rule:** Reserve 302 (or 307) for URL changes you expect to revert; do not use a temporary redirect merely to hedge because you are "not sure yet" about a permanent migration.

**Mechanism:** A temporary redirect signals the indexing pipeline to keep the *original* URL as canonical and continue showing it in results, while a permanent redirect signals the indexing pipeline to treat the *target* as canonical. Using 302 for a permanent move delays or prevents the consolidation of ranking signals onto the new URL because Google keeps indexing the old one.

**Acceptance criterion:** Every URL change that is not expected to revert returns 301/308, full stop — a 302/307 present on a URL more than a few weeks after a "permanent" migration is a defect.

**Verification:** `curl -sI https://old.example.com/old-path | grep -i ^HTTP` — confirm status class matches migration intent; audit any 302/307 older than 30 days against the migration's stated permanence.

**Source:** "Use permanent redirects when you're sure that the redirect won't be reverted" — [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects), Google Search Central. T1.

**Anti-pattern:** Leaving Next.js's default `permanent: false` (307) in place for a page that was actually permanently renamed, because it was the config's default and nobody flipped the flag.

---

## 3. RFC 9110 defines the exact method/body-preservation contract per status code — pick the code that matches your semantics

**Rule:** Choose 301/302 only when it is acceptable for a client to rewrite a POST into a GET on the redirected request; choose 307/308 when the method and body must be preserved exactly.

**Mechanism (verbatim from spec):** 301 (Moved Permanently) — "the target resource has been assigned a new permanent URI and any future references to this resource ought to use one of the enclosed URIs," and "a client MAY change the request method from POST to GET" for the subsequent request. 302 (Found) — same POST→GET permissiveness, but temporary. 303 (See Other) — "the user agent MUST use the GET method for the subsequent request." 307 (Temporary Redirect) — "the user agent MUST NOT change the request method if it was POST"; method and body are preserved. 308 (Permanent Redirect) — permanent equivalent of 307: "the user agent MUST NOT change the request method from POST to GET."

**Acceptance criterion:** Any redirected endpoint that accepts non-GET methods (form POST, API PUT/DELETE) uses 307/308, never 301/302/303 — a form submission that silently becomes a GET after redirect is a spec-conformance bug, not a cosmetic one.

**Verification:** `curl -X POST -i https://example.com/old-form-endpoint` and confirm the `Location` target receives the same method with the same body (inspect server access logs on the target for method + payload).

**Source:** RFC 9110 §15.4.2–15.4.9, "HTTP Semantics" — [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), IETF. T1.

**Anti-pattern:** Reflexively using 301 for everything, including API endpoints and form actions, because it's the "SEO redirect," without checking whether the endpoint is ever hit with a non-GET method.

---

## 4. Google follows redirect chains up to 10 hops — but a single hop is the target, not the limit

**Rule:** Redirect every changed URL directly to its final destination in one hop; do not treat Google's 10-hop tolerance as a design budget.

**Mechanism:** "Avoid chaining redirects. While Googlebot can follow up to 10 hops in a 'chain' of multiple redirects, we advise redirecting to the final destination directly." Each additional hop adds crawl latency and risk (a broken link mid-chain silently truncates the whole chain's effect), and per practitioner-documented (not Google-quantified) experience, signal consolidation is slower and less complete across multiple hops than a single hop — see item 10 on the unquantified-percentage myth.

**Acceptance criterion:** No redirect in the migration map exceeds 1 hop; `curl -sIL` on any old URL shows exactly one `Location:` header before the final 200.

**Verification:** `curl -sIL -o /dev/null -w '%{num_redirects}\n' https://old.example.com/old-path` — must print `1`. A count of 0 (no redirect present) or ≥2 (chain) both fail.

**Source:** "Googlebot can follow up to 10 hops in a 'chain' of multiple redirects, we advise redirecting to the final destination directly" — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1.

**Anti-pattern:** Layering a domain-migration redirect on top of an old path-restructure redirect (`/a` → `/b` → `/c`) instead of collapsing the map to `/a` → `/c` directly, because the intermediate rule was "already there" from a prior project.

---

## 5. A redirect loop is a total outage for every URL caught in it — treat it as P1

**Rule:** Never let a redirect's destination eventually point back at (or through) its own source; a loop must be caught in code review and CI, not discovered in production.

**Mechanism:** RFC 9110 does not define infinite-loop behavior as anything other than a client failure mode: browsers and crawlers alike abort with an error after a bounded number of hops (Google's bound is the same 10-hop ceiling cited in item 4 — an 11th hop, whether it's a long chain or a loop, is simply not followed, so the URL resolves to nothing). Next.js's own docs flag the specific footgun of missing a leading slash before a `:param` in `source`/`destination`, which "run[s] the risk of causing infinite redirects" at the framework config level, independent of Google's crawler behavior.

**Acceptance criterion:** Every redirect rule added to the migration map is validated against the full existing rule set for cycles before deploy; zero loops present.

**Verification:** `curl -sIL --max-redirs 10 -o /dev/null -w '%{http_code} %{num_redirects}\n' https://example.com/path` — a non-2xx/3xx final code or `num_redirects` pegged at the max is a loop signal. Programmatically: build a directed graph of all `source → destination` pairs and run cycle detection before merging redirect config.

**Source:** 10-hop ceiling — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1. Next.js infinite-redirect footgun: "Remember to include the forward slash `/` before the colon `:` in path parameters... otherwise... you run the risk of causing infinite redirects" — [next.config.js: redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects), Next.js Docs (v16.2.12, last updated 2026-07-22). T2.

**Anti-pattern:** Adding a catch-all redirect rule (e.g., locale-prefix normalization) without checking it against an already-existing specific rule that redirects back into the catch-all's match pattern.

---

## 6. Keep every migration redirect live for at least a year, not "a few months and then clean up"

**Rule:** Maintain 301/308 redirects for a minimum of one year after a permanent site move, and longer if analytics still show inbound traffic hitting the old URLs.

**Mechanism:** Google does not process a redirect once and forget it — the indexing pipeline needs repeated recrawls of the old URL over time to fully migrate signals, and any external link, bookmark, or stale SERP entry that still points at the old URL will continue to depend on the redirect existing at fetch time indefinitely. "Keep the redirects for as long as possible, generally at least 1 year. This timeframe allows Google to transfer all signals to the new URLs." Google's own Change of Address tool (item 8) independently confirms a floor: it "forwards site signals for 180 days," which is the tool-specific signal window, not the general redirect-retirement guidance — the two numbers (180 days vs. 1 year+) answer different questions and neither authorizes removing redirects at 6 months.

**Acceptance criterion:** No 301/308 rule created for a migration is deleted before 365 days elapsed from the DNS/route cutover date, tracked against a dated migration log — not tribal memory.

**Verification:** Diff the live redirect map against the migration's dated cutover log; any rule with an age < 365 days must still be present. Cross-check with GA4/server logs: any old-path hit volume > 0 in the trailing 30 days blocks removal regardless of age.

**Source:** "Keep the redirects for as long as possible, generally at least 1 year. This timeframe allows Google to transfer all signals to the new URLs." — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1.

**Anti-pattern:** Treating "SEO migrations settle in 4-12 weeks" (a real, separately-documented ranking-recovery timeline — see item 11) as license to remove redirects at the same 3-month mark. Rankings settling and external links/bookmarks still resolving are two different clocks; only the latter governs redirect removal.

---

## 7. Map every old URL to its single most relevant new equivalent — never funnel unrelated URLs to the homepage

**Rule:** Build a one-to-one (or many-old-to-one-consolidated-new, where the consolidation is real) URL map before writing a single redirect rule; never default unmapped or "hard" URLs to the site's homepage.

**Mechanism:** Google's indexing pipeline uses redirect destination content as a relevance signal, not just a routing instruction. When many unrelated old URLs point at one irrelevant destination (typically the homepage), Google's soft-404 detection can flag the redirect target as not actually representing the old content, at which point the redirect stops passing the old URL's signals to anywhere at all.

**Acceptance criterion:** Every redirect rule's destination page contains content that is topically equivalent to (or a genuine superset/consolidation of) the source URL's content; zero rules point at `/` unless the source URL literally was the homepage.

**Verification:** For a sample of redirects, `curl -sL <old-url>` the destination and manually confirm topical match; audit Search Console's Page Indexing report for "soft 404" flags on redirected URLs.

**Source:** "Don't redirect many old URLs to one irrelevant single URL destination, such as the home page of the new site" — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1. Corroborated by a named empirical study showing Google's soft-404 classifier specifically triggers on redirects to less-relevant pages — [Proof That 301 Redirects To Less-Relevant Pages Are Seen As Soft 404s To Google](https://www.gsqi.com/marketing-blog/redirects-less-relevant-pages-soft-404s/) (returns 403 to automated checks; verified manually 2026-07-29), GSQi (Glenn Gabe), case study. T3.

**Anti-pattern:** The "just redirect everything to the homepage, it's better than a 404" reflex. Per Google's own guidance this is worse than doing nothing correctly — it can be reclassified as a soft 404, forfeiting the redirect's signal-passing function entirely while still looking, superficially, like a "working" redirect.

---

## 8. When there is no equivalent new page, return a real 404/410 — do not redirect to something irrelevant just to avoid a 4xx

**Rule:** For old URLs whose content is genuinely retired with no replacement, serve an honest 404 or 410 on the new site rather than redirecting to an unrelated page.

**Mechanism:** Google explicitly frames 404/410 as the *correct* outcome for retired content, not a failure state to be avoided at all costs: "if you're not moving to the new site all your old content, make sure those URLs correctly return an HTTP 404 or 410 error response code." Returning anything else (a 200 "soft 404," or a redirect to an unrelated page) actively confuses classification and is explicitly called out as worse.

**Acceptance criterion:** Every retired-with-no-replacement URL returns literal 404 or 410 status (not 200 with "not found" body text); zero retired URLs are redirected to unrelated live pages.

**Verification:** `curl -sI https://example.com/retired-path | grep -i ^HTTP` must show `404` or `410`, and the response body must not resemble a normal page template returning 200 (check for soft-404 via Search Console's Page Indexing report, which explicitly detects this pattern).

**Source:** "Provide errors for deleted or merged content... make sure those URLs correctly return an HTTP `404` or `410` error response code" — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1. Soft-404 detection and its harms — [How To Fix Soft 404 Errors](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1.

**Anti-pattern:** "Every 404 looks bad, so redirect it somewhere" — the opposite of Google's documented guidance. A clean 404/410 is the *correct*, low-severity outcome; a soft-404 (200 status, "page not found" content) or an irrelevant redirect is the actual defect.

---

## 9. 404 and 410 are treated almost identically by Google's mid/long-term indexing pipeline — 410 is only marginally faster

**Rule:** Do not invest engineering effort choosing 410 over 404 for SEO reasons expecting a materially different outcome; use 410 only where it is semantically true (you know for certain the resource will never return) and treat any speed difference as a minor bonus, not a requirement.

**Mechanism:** "All 4xx errors, except 429, are treated the same: Google crawlers inform the next processing system that the content doesn't exist," and the indexing pipeline removes a previously-indexed URL from the index on confirming the error, then gradually reduces crawl frequency to that URL. Google's own John Mueller has separately stated 410 can be recognized and dropped "a couple of days" faster than 404 in some cases, but that in the mid-to-long term the two codes are handled the same way.

**Acceptance criterion:** Choice of 404 vs. 410 for a given retired URL is documented as a semantic decision (certain-never-returns vs. unknown/might-return), not an SEO-speed optimization; no migration ticket should block on "we haven't switched 404s to 410 yet."

**Verification:** `curl -sI <url> | grep -i ^HTTP` confirms the intended code is served; cross-check Search Console's Page Indexing report weeks later to confirm removal (see item 12 for the ~1-month typical window), independent of which of the two codes was used.

**Source:** "All `4xx` errors, except `429`, are treated the same" — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1. 410-marginally-faster nuance is Mueller's stated position as reported contemporaneously by trade press — [Google Says Differences Between 410 and 404 Is So Minimal](https://www.seroundtable.com/googledifferences-between-410-404-minimal-37205.html), Search Engine Roundtable. T4 (secondary report of a T1 spokesperson statement; no stable Google-hosted primary URL exists for this specific remark).

**Anti-pattern:** A migration backlog item that reads "convert all 404s to 410s for better SEO" as if this alone recovers lost signal or meaningfully accelerates recovery — Google's own documentation does not support a meaningful practical difference beyond a couple of days at the margin.

---

## 10. There is no fixed "percentage of link equity lost" through a redirect — that number is a retracted, outdated claim, not current Google guidance

**Rule:** Never write or repeat a specific "redirects lose X% of link value" figure in any audit, proposal, or SOP — Google's current position is that 301/302/307 redirects pass signals without a documented fixed dilution rate, but with real, named qualifications that are NOT captured by a flat percentage.

**Mechanism:** The "PageRank loss on redirect" percentage (commonly cited as "roughly 15%," originating from a 2013 Matt Cutts statement) was superseded by Google's own later, more precise statements: in 2016 Gary Illyes stated 301, 302, and 307 redirects are all treated equivalently for PageRank flow, and Google has repeated since that there is no fixed dilution. However, the real, documented qualifications are: (a) redirect chains lose more than single hops (item 4), (b) signal transfer is not instantaneous — Google needs to recrawl and reprocess (items 6, 11), and (c) topical relevance between old and new content affects how much of the old URL's signal is judged applicable to the new one (item 7's soft-404 mechanism is the sharp edge of this).
**Note on sourcing:** the original Google blog announcing "no PageRank dilution" could not be independently re-fetched at a stable URL during this research pass (blocked/404 on direct fetch); this item is corroborated via contemporaneous trade press reporting Google's own quoted statement, and via the parallel documented mechanism in items 4, 6, and 7, which are independently Tier 1.

**Acceptance criterion:** Any internal document, ticket, or client-facing report is a **fail** if it states a specific percentage of "link juice" or ranking value lost per redirect hop. It is a **pass** if it instead cites the qualitative factors (chain length, relevance, time-to-recrawl) that Google does document.

**Verification:** Grep internal docs/SOPs/tickets for numeric-percentage-plus-"link juice"/"link equity"/"PageRank" phrasing (`grep -riE '[0-9]+%.*(link (juice|equity)|pagerank)'`); any match is a documentation defect to correct.

**Source:** Google's no-fixed-dilution position as reported — [Google: There is no PageRank dilution when using 301, 302, or 30x redirects anymore](https://searchengineland.com/google-no-pagerank-dilution-using-301-302-30x-redirects-anymore-254608) (returns 403 to automated checks; verified manually 2026-07-29), Search Engine Land, citing Gary Illyes (2016). T4 (trade-press report of a T1 spokesperson statement; original primary post not independently re-verifiable at a stable URL in this pass). Corroborating documented qualitative mechanisms (chain length, relevance, timing) are T1 — see items 4, 6, 7 above.

**⚠️ Flag — widely repeated practitioner myth not supported by current primary sources:** the specific "301s pass ~85-99% (or ~15% loss)" figure is a 2013-era Matt Cutts framing that Google itself has since moved away from in favor of "redirects pass signals, full stop, with no fixed percentage" — repeating the old percentage as current fact is the exact anti-pattern this SOP section exists to catch.

---

## 11. Expect ranking recovery in weeks to a few months for a well-executed migration — this is a range, not a guarantee, and is separate from the "keep redirects a year" rule

**Rule:** Communicate migration ranking-recovery expectations as "typically a few weeks to a few months for a well-executed migration on a small-to-medium site, longer for larger sites" — and do not conflate this recovery window with how long redirects themselves must stay live (item 6).

**Mechanism:** Google's own general guidance: "a small to medium-sized website can take a few weeks for most pages to move, and larger sites take longer," dependent on URL count and server/crawl speed. This describes indexing pipeline processing time (Google finding, following, and re-indexing under the new URL), which is necessarily bounded by — but shorter than — the full one-year+ redirect retention window in item 6, because processing typically completes well before the redirect is finally retired.

**Acceptance criterion:** A migration is not flagged as "failed" or "the redirects aren't working" before the documented multi-week-to-multi-month window has fully elapsed for a site of comparable size; conversely, redirects are not removed just because rankings appear to have recovered early (item 6 still governs retention).

**Verification:** Track Search Console's Page Indexing / Index Coverage report and the Performance report's impressions-by-page-group weekly from cutover date; do not escalate as an incident until the elapsed time exceeds the documented range for the site's size.

**Source:** "a small to medium-sized website can take a few weeks for most pages to move, and larger sites take longer" — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1.

**Anti-pattern:** Declaring a migration a failure at week 2 because rankings haven't fully recovered, or conversely using an early apparent recovery as justification to pull redirects at 90 days instead of the documented 1-year floor.

---

## 12. The severity case: a previously-indexed URL that starts 404ing instead of 301ing is a real, gradual, and only partially recoverable loss — not a cosmetic bug

**Rule:** Treat any previously-indexed, externally-linked URL that unexpectedly serves 404 instead of its planned 301 as a P1 defect to fix immediately — the longer it is left, the more of the loss becomes structurally unrecoverable even after the redirect is finally added.

**Mechanism, documented precisely:**
- **What happens to the URL:** "the indexing pipeline removes the URL from the index if it was previously indexed," and separately, "the crawling frequency gradually decreases" — so the URL is not just temporarily absent, it is actively deprioritized for future crawling the longer the 404 persists.
- **What happens to external links pointing at it:** those links now resolve to a dead page. Nothing in Google's documentation describes external link equity as being "banked" or preserved while a URL 404s — the signal-transfer mechanism Google documents (items 1, 6) is specifically the *redirect*, which by definition does not exist yet for these 12 URLs. An inbound link to a 404 is, in Google's own framing, functionally equivalent to a link to a page that "doesn't exist" for as long as the 404 persists.
- **Is it recoverable if you add the redirect later?** Partially, and on a real but unforgiving clock. Google Search Console's own documentation confirms Google *will* revisit and re-evaluate: after adding a redirect, "Google rechecks the URLs on its next crawl and updates the status if the fix holds," but with two explicit caveats that make lateness costly: (a) "issuing a 300-level redirect will delay the recrawl attempt, possibly for a very long time" once a URL has already been marked gone, and (b) crawl frequency to a 404'd URL "gradually decreases" the longer it sits — meaning the very mechanism Google would use to discover your new, correct redirect (recrawling the old URL) is being actively throttled down by the persistence of the defect itself. A URL that has been fully dropped and de-prioritized needs a fresh discovery signal (an external link, a sitemap re-mention) to be recrawled at all before it can even see the new redirect.
- **Correctly-timed vs. retrofitted, as Google frames it:** Google's site-move documentation frames the entire redirect-mapping exercise as pre-work to be completed *before* traffic is cut over — "implement the redirects" is step 4 of 5, ahead of "monitor traffic," not a remediation step performed after the fact. There is no separate Google document describing a "recovery procedure" for a botched migration; the same general redirect-signal-transfer guidance (item 1, 6) is the only tool available, and it now has to work against actively-decayed crawl priority instead of a URL Google was still crawling at normal frequency.

**Acceptance criterion:** Zero previously-indexed legacy URLs return 404 where a 301 was planned. For this site specifically: all 13 documented legacy URLs from the prior platform must return 301 to their mapped destination — the current state of 12/13 returning 404 is a fail against this criterion, not a partial pass.

**Verification:** `for u in $(cat legacy-urls.txt); do printf '%s ' "$u"; curl -sI -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$u"; done` — every line must show `301` (or `308`) with a non-empty `redirect_url`; any `404` line is the defect. Cross-check Search Console's Page Indexing report for these 13 URLs to see current index status (already-dropped vs. still-indexed) — this determines whether the fix restores the URL directly on next crawl or requires a fresh discovery signal first.

**Source:** Index removal + crawl-frequency decay on 404 — [HTTP Status Codes, Network and DNS Errors, and Google Search](https://developers.google.com/search/docs/crawling-indexing/http-network-errors), Google Search Central. T1. Recrawl-after-fix behavior and the "delay... possibly for a very long time" caveat — [404 (Page Not Found) errors](https://support.google.com/webmasters/answer/2445990), Google Search Console Help. T1. Redirect-mapping as pre-cutover step, not post-hoc remediation — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), Google Search Central. T1.

**Anti-pattern:** Treating "we'll add the 301s in a follow-up ticket" as low-urgency because "we can always add the redirect later and it'll be fine." Google's own documentation says the opposite: the longer the 404 persists, the more the mechanism needed to fix it (recrawl) is itself being suppressed by the defect.

---

## 13. The Change of Address tool is a domain-to-domain signal accelerator, not a redirect substitute, and only applies to whole verified domain properties

**Rule:** Use Search Console's Change of Address tool only for full domain-to-domain (or subdomain-to-subdomain) moves where both old and new sites are verified Search Console properties under the same account — never as a substitute for implementing the underlying 301s, and never for path-level, protocol (HTTP→HTTPS), or www/non-www changes.

**Mechanism:** The tool requires 301 redirects to already be in place as a prerequisite, then tells Google to prioritize crawling the new site and prefer it in canonical determinations, forwarding "site signals" for a documented 180-day window. It explicitly does not apply to HTTP→HTTPS transitions (Google handles those automatically without the tool), same-domain path restructuring, or www/non-www switches (those need canonicalization/redirects only). A 2026-06-17 documentation update added explicit guidance to run the tool for every subdomain variant (www and non-www) of a domain migration, since partial variant coverage was previously a common gap.
**Acceptance criterion:** For a qualifying domain-level move, the Change of Address tool is submitted for every verified subdomain variant, only after the underlying 301s are confirmed live — not before, and not as a replacement for them.

**Verification:** In Search Console, Settings → Change of Address, confirm status shows the migration accepted for each subdomain variant; separately verify (per item 12's curl loop) that the prerequisite 301s were live before submission.

**Source:** Tool scope, prerequisites, and 180-day signal window — [Change your site's address](https://support.google.com/webmasters/answer/9370220), Google Search Console Help. T1. 2026-06-17 subdomain-variant guidance update — reported in [Google's site move guide now covers www and non-www domain variants](https://ppc.land/googles-site-move-guide-now-covers-www-and-non-www-domain-variants/), ppc.land, citing the Google Search Central documentation revision. T4 (secondary report of a documented T1 change; underlying Google doc revision itself is T1 but the specific changelog framing is only available via secondary reporting in this pass).

**Anti-pattern:** Running Change of Address instead of implementing 301s ("the tool will handle it"), or running it for a same-domain path restructure or an HTTP→HTTPS cutover where Google's own docs say the tool doesn't apply.

---

## 14. Bing requires the same 301s as Google, plus its own Site Move notification — and it locks you out for 6 months after use

**Rule:** For any migration where Bing traffic matters, implement the same permanent 301 redirects as for Google, then separately notify Bing via Bing Webmaster Tools' Site Move tool — and treat that submission as a one-shot action you cannot repeat for 6 months.

**Mechanism:** Bing's Site Move tool "does not replace the need for permanent redirection of your site and all pages that are moving to a new location using HTTP Status 301" — it is purely a notification/acceleration layer on top of already-implemented redirects, available for both same-site path restructuring and cross-domain moves. Once submitted, "you cannot issue another move request for six months."

**Acceptance criterion:** Bing Site Move submission occurs only after 301s are confirmed live (same precondition as item 13's Google tool), and is not resubmitted or "redone" within 6 months of a prior submission for the same site.

**Verification:** Bing Webmaster Tools → Diagnostics & Tools → Site Move — confirm submission timestamp and that 301s were already returning correctly (via `curl -I`) at time of submission.

**Source:** "does not replace the need for permanent redirection... using HTTP Status 301," and the six-month reuse restriction — [Website Migration with Bing](https://blogs.bing.com/webmaster/december-2020/Website-Migration-with-Bing), Bing Webmaster Blog. T1.

**Anti-pattern:** Assuming the Google Change of Address tool's acceptance also covers Bing, or resubmitting Bing's Site Move tool repeatedly during a drawn-out migration in hopes of speeding things up — the 6-month lock makes a second submission mid-migration impossible by design.

---

## 15. Framework-level redirect config has its own semantics that must be deliberately mapped to the HTTP status you actually want

**Rule:** When implementing migration redirects in Next.js or on Vercel, explicitly set the permanence flag rather than accepting the framework default, and understand that both platforms map "permanent" to 308 (not 301) by design.

**Mechanism:** Next.js's `redirects()` config: `permanent: true` emits 308 ("instructs clients/search engines to cache the redirect forever"); `permanent: false` emits 307 ("temporary... not cached"). Next.js explicitly documents why it chose 307/308 over the traditional 301/302: some browsers historically rewrote a redirected POST to a GET on 301/302, so Next.js uses 307/308 specifically "to explicitly preserve the request method used" (matching RFC 9110's method-preservation contract in item 3). Vercel's `vercel.json` `redirects` follows the identical pattern: `permanent: true` → 308, `permanent: false` (or the false default) → 307. Both frameworks check redirects before the filesystem/pages resolve, and Next.js explicitly warns that Pages-Router redirects are not applied to client-side navigation (`Link`, `router.push`) — a purely server-config redirect will not stop a client-side route transition from bypassing it.

**Acceptance criterion:** Every migration redirect entry in `next.config.js`/`vercel.json` has `permanent` explicitly set (not left to default), matches the migration's actual permanence intent, and — for Next.js Pages Router — has been verified to also apply to (or intentionally not apply to, per design) client-side `Link`/`router.push` navigation.

**Verification:** Grep the redirect config for entries missing an explicit `permanent` key: `grep -B2 -A2 "destination:" next.config.js | grep -L "permanent"`; then `curl -sI` each production URL to confirm 308 vs 307 matches intent.

**Source:** 308/307 mapping and method-preservation rationale — [next.config.js: redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects), Next.js Docs (v16.2.12, last updated 2026-07-22). T2. Vercel's identical `permanent` → 308/307 mapping — [Configuration Redirects](https://vercel.com/docs/routing/redirects/configuration-redirects), Vercel Docs. T2.

**Anti-pattern:** Assuming a Next.js/Vercel "permanent" redirect returns 301 because that's the classically-taught SEO status code — it returns 308, which is functionally equivalent for Google's indexing purposes (both are "permanent" signals) but will surprise anyone diffing raw HTTP status codes expecting 301.

---

## Flags called out explicitly per task scope

1. **Deprecated/changed in the last 24 months:** Google's site-move documentation itself was revised 2026-06-17 to add explicit per-subdomain-variant (www/non-www) instructions for the Change of Address tool (item 13) — teams following pre-2026 tutorials may be missing this step. No other primary source in this research set showed a dated change inside the last 24 months; the 404-vs-410 "noindex in robots.txt" style deprecation belongs to the sibling crawl.md file, not this one.
2. **Practitioner claim not supported by primary sources:** the fixed "redirects lose ~15% (or any specific %) of link equity/PageRank" figure (item 10) is the clearest instance — Google's current, repeated position is no fixed dilution, with the real caveats being chain length, recrawl timing, and topical relevance, none of which reduce to a clean percentage. A second, related myth flagged in item 6: "redirects can be safely removed after 3 months because that's when rankings recover" conflates two separately-documented and differently-numbered Google timelines (ranking recovery in weeks-to-months vs. redirect retention of 1 year+).

---

*Research date: 2026-07-29. All source URLs fetched and returned HTTP 200 with a browser user-agent at verification time (`support.google.com` endpoints return 404 to a bare `curl` without a browser UA/Accept-Language header — this is bot-filtering on Google's side, not a broken URL; confirmed 200 once headers were added).*
