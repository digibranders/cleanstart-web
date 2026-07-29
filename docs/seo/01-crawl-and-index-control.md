# Crawl & Index Control

**Module:** 01 — Crawl & index control
**Prefix:** `CRAWL`
**Review cadence:** Semi-annual (`00-index.md` §9)
**Scope:** robots.txt, meta robots, `X-Robots-Tag`, parameter handling, preview/staging isolation, soft 404s, crawl budget.
**Evidence base:** `docs/seo/evidence/sources/crawl.md` (23 researched rules, all Tier 1 except CRAWL-03's Vercel citation); `docs/seo/evidence/verification-log.md` (both corrections required for this domain are applied below — #1 in CRAWL-07, #2 in CRAWL-11); `docs/seo/evidence/codebase-inventory.md` ("Crawl & Index Control" section); `docs/seo/evidence/live-capture.json` plus direct live re-verification against `https://www.cleanstart.com` on 2026-07-29 (`curl` against `/robots.txt`, `/sitemap.xml`, `/email-signatures`, `/email-signatures/[slug]`, and an unknown `/blogs/[slug]`).

Every `CleanStart` verdict below is grounded in a cited `file:line` reference, a live `curl` result, or both, recorded in that rule's `Evidence` field. Where the codebase and a live observation disagreed, both facts are stated and the verdict is `Partial`.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### CRAWL-01 — A page-level `noindex` is invisible if the URL is blocked from crawling

- **Severity:** P0
- **Applies:** Always
- **Rule:** Never combine a robots.txt `Disallow` with a page-level `noindex` (meta tag or `X-Robots-Tag`) on the same URL as the sole removal strategy. Google must be able to crawl a page to read its `noindex` directive, so a `Disallow` on that same URL prevents the very signal meant to remove it from ever being seen.
- **Why:** `noindex` is discovered only by fetching and reading the response. If robots.txt blocks the fetch, Google never sees the header or meta tag and can instead index the URL from external signals alone — a bare URL with no snippet, the opposite of the intended outcome.
- **Acceptance:**
  - For any URL intended to be fully suppressed from search, it is either crawlable-with-`noindex` or robots.txt-disallowed — never both as the sole controls
  - No path present in a `Disallow` rule also carries a page-level `noindex` as its only removal mechanism
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep 'Disallow: /email-signatures'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:46`, `apps/web/src/app/email-signatures/page.tsx:17-18,26`, `apps/web/src/app/email-signatures/[slug]/route.ts:54,59`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag — "If a page is disallowed from crawling through the robots.txt file, then any information about indexing or serving rules will not be found and will therefore be ignored." Verified verbatim against the live page (`verification-log.md`, "Claims that survived a genuine refutation attempt").
- **Tools:** No tool in `docs/seo/evidence/tool-scoring.md` flags this exact *combination* as a single issue — "Noindex page" and "Blocked by robots.txt" are separate rows in every surveyed tool's issue list, so a client can see two clean-looking individual findings while still sitting on this compound failure. This SOP rates the combination P0 on mechanism precisely because no vendor tool catches it as one issue.
- **Anti-patterns:** Believing `Disallow` + `noindex` together is "belt and suspenders" full removal — it is backwards; the `Disallow` is what breaks the `noindex`, not what reinforces it.
- **Evidence:** `robots.ts:46` disallows the path prefix `/email-signatures`, which by RFC 9309 prefix matching also covers every `/email-signatures/[slug]` page. `email-signatures/page.tsx:17-18` documents "three layers" of protection for this internal staff directory (page `noindex,nofollow` meta + this `Disallow` + an `X-Robots-Tag` on the slug route). Live-verified 2026-07-29: the listing page (`/email-signatures`) serves `meta name="robots" content="noindex, nofollow"` but no noindex `X-Robots-Tag` (only `max-image-preview:large, max-snippet:-1`); the slug route (`/email-signatures/biswajit-de`) does serve `x-robots-tag: noindex, nofollow, noarchive` per `route.ts:59`. Per this rule, the `Disallow` on `/email-signatures` makes both of those noindex signals moot if Google ever discovers either URL through an external link — the only control actually keeping this directory (direct-dial numbers for the whole company) out of Google today is the `Disallow` itself, which per CRAWL-04 does not itself guarantee exclusion from search results.
- **CleanStart:** Fail

---

### CRAWL-02 — A sustained robots.txt server error is read as "the entire site is disallowed"

- **Severity:** P0
- **Applies:** Always
- **Rule:** Never let `/robots.txt` return a 5xx status, even transiently. A missing file (404) is safe and treated as "crawl anything," but a server error is read by Google as "the entire site is disallowed."
- **Why:** RFC 9309 mandates complete disallow when robots.txt is unreachable due to a server/network error. Google's implementation specifically stops crawling for 12 hours, then serves the last-known-good copy for up to 30 days while retrying — a transient 500 during a deploy is a sitewide crawl-blocking event, not a cosmetic bug.
- **Acceptance:**
  - Uptime monitoring alerts on any non-2xx, non-404 response from `/robots.txt`
  - No deploy path can serve a 5xx from the `/robots.txt` route while the rest of the site is otherwise healthy
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/robots.txt`
- **Reference:** `apps/web/src/app/robots.txt/route.ts:6-13`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.3.1.3–2.3.1.4; corroborated by https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt (12-hour halt, 30-day cached-copy window)
- **Tools:** Not documented as a distinct check by any of the five tools in `tool-scoring.md` — none publish a specific "robots.txt returned 5xx" issue class. This SOP rates it P0 on RFC-mandated blast radius (sitewide disallow) even though no named tool would flag a single transient 500 as top-severity.
- **Anti-patterns:** Treating a 500 on `/robots.txt` during a deploy as harmless "because the file didn't really change" — per spec, Google may assume the entire site is now disallowed regardless of the file's prior content.
- **Evidence:** Live-fetched 2026-07-29, `/robots.txt` returned `200` with the expected body — but this rule's acceptance criterion is "uptime monitoring alerts on any non-2xx, non-404 response from `/robots.txt`," and that monitor does not exist. `docs/web/WEB-PRODUCTION.md:535-544` documents exactly two BetterStack HTTP monitors for production — `/api/health` (liveness) and `/` (homepage-render, checks for `Application Error` absence and the org JSON-LD) — and states neither checks `/robots.txt`. This is a documented absence, not an open question: the monitoring gap is confirmed by the project's own operations doc, not merely unobserved in this pass. A future regression on this specific route (a bad deploy, an upstream `headers()`/edge failure) would not trigger any monitor listed in the current production monitoring setup, and today's healthy `200` does not change that the required control is missing.
- **CleanStart:** Fail

---

### CRAWL-03 — Non-production environments need an access barrier, not just robots.txt/noindex

- **Severity:** P0
- **Applies:** Any site with a non-production, staging, preview, or draft-mode environment
- **Rule:** Protect non-production environments with an access barrier the crawler cannot pass (auth challenge, token gate, or IP allowlist) as the primary control. Layer `X-Robots-Tag: noindex` as defense-in-depth only — never rely on robots.txt `Disallow` as the sole protection.
- **Why:** Per CRAWL-01 and CRAWL-04, a `Disallow` does not prevent indexing of an externally-discovered URL and can itself blind Google to a `noindex` on the same path. The only control that removes a page from crawler reach regardless of inbound links is a barrier Google cannot authenticate through.
- **Acceptance:**
  - Every non-production or draft-only route either requires a valid access token/session before rendering real content, or returns 401/403 to unauthenticated requests
  - `X-Robots-Tag: noindex` (or equivalent meta) is layered on top of, not instead of, that access barrier
  - Any exact-match or suffix-match noindex host list used as a backstop is kept current — an empty list is a silent no-op, not a removed control
- **Verify:** `curl -sI https://www.cleanstart.com/preview/blogs/none | grep -i x-robots-tag`
- **Reference:** `apps/web/src/lib/seo/indexing.ts:31,34,36-43,51-56`, `apps/web/src/app/preview/[collection]/[slug]/page.tsx:39,56-72,139`, `apps/web/src/proxy.ts:80-85,233-237`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro — "password-protect the files on your server, use the noindex meta tag or response header, or remove the page entirely"; [Tier 2] https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines — confirms Vercel's automatic preview-domain `noindex` does not apply to a custom domain pointed at a non-production branch
- **Tools:** Sitebulb's "Noindex in HTML and HTTP header" (Medium) is the closest analogue; no tool surveyed in `tool-scoring.md` publishes a distinct "staging/preview exposure" check. This SOP rates the underlying scenario P0 on blast radius (indexation of pre-launch or internal content), independent of any single page's tool-reported severity.
- **Anti-patterns:** Assuming Vercel's automatic preview-domain `noindex` covers a *custom* domain pointed at a non-production branch — Vercel's own documentation states this exact configuration is the one case the automatic header is not applied.
- **Evidence:** `/preview/[collection]/[slug]` requires a signed token verified server-side against `/api/preview/verify` (`page.tsx:39`); invalid, expired, or revoked tokens render an error message, not real content (`:56-72`), and a missing token renders `<ErrorPage message="Missing preview token." />` (`:139`). Every request under `/preview/` also gets `X-Robots-Tag: noindex, nofollow, noarchive` regardless of token validity (`proxy.ts:83-85,233-237`) — layered defense-in-depth on top of the token gate, satisfying this rule's intent even though the gate is token-based rather than a literal HTTP 401/403. Separately, `NOINDEX_HOSTS` (`indexing.ts:31`) is currently `[]` — a live no-op, not a removed control — and there is no `staging.cleanstart.com` today (deleted 2026-07-29) for it to matter against. The documented highest-risk gap (a custom domain pointed at a non-production branch) is not currently present, but nothing in code would catch it if reintroduced without also updating this array.
- **CleanStart:** Partial

---

## P1 — material organic or AI-visibility impact, no immediate loss

### CRAWL-04 — robots.txt governs crawling, not indexing

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never rely on robots.txt `Disallow` to keep a URL out of search results — use it only to manage crawler access and load. Removal from the index requires an actual `noindex` signal or genuine access control.
- **Why:** robots.txt is read before a URL is requested and governs fetch permission only; it has no effect on whether an already-discovered URL is indexed. If Google learns of the URL from an external link, it can index it — bare, with no snippet — purely from off-page signals, without ever fetching the page.
- **Acceptance:**
  - No URL's search-exclusion strategy consists of a `Disallow` line alone
  - Every `Disallow`'d path either has no inbound links worth discovering, or is paired with a real removal mechanism reachable through a route the `Disallow` doesn't itself block (see CRAWL-01)
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -c '^Disallow'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:41-52`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro — "Don't use a robots.txt file as a means to hide your web pages from Google Search results"
- **Tools:** Screaming Frog's "Internal Blocked by Robots.txt" (Warning, High) and Semrush's "Pages that were blocked from crawling" (Notice) both report the block itself, not whether the blocked page is still indexed from off-page signals — no tool in `tool-scoring.md` closes that gap, so a clean crawl report does not prove a `Disallow`'d URL is actually absent from the index.
- **Anti-patterns:** Adding `Disallow: /staging/` and considering the environment "hidden" — it is not; see CRAWL-03.
- **Evidence:** Every current `Disallow` entry (`/preview/`, `/api/preview/`, `/email-signatures`, `/*_rsc=`) is paired with an additional mechanism in principle — token-gating, a page-level `noindex`, or (for `_rsc=` requests) the fact that these are internal React Server Component data fetches with no independent page identity. But this rule's own acceptance criterion requires that pairing be "reachable through a route the `Disallow` doesn't itself block" (see CRAWL-01) — and for `/email-signatures` it isn't: the listing page's `noindex,nofollow` meta and the slug route's `x-robots-tag: noindex, nofollow, noarchive` both sit on paths the same `Disallow: /email-signatures` prefix covers, per CRAWL-01's finding. So the only control actually operating on that directory today is the `Disallow` itself — precisely the configuration this rule's acceptance criterion is written to catch. Scoping the defect to CRAWL-01 alone does not exempt CRAWL-04 from its own, distinct acceptance test; the other three `Disallow` entries (`/preview/`, `/api/preview/`, `/*_rsc=`) remain correctly paired via a reachable mechanism.
- **CleanStart:** Partial

---

### CRAWL-05 — robots.txt must be served at `/robots.txt`, UTF-8, `text/plain`

- **Severity:** P1
- **Applies:** Always
- **Rule:** Serve robots.txt as a UTF-8 `text/plain` file at the exact top-level path `/robots.txt` of every scheme+host+port origin that needs a policy — a subdirectory copy or a different origin's file has no effect.
- **Why:** Crawlers check exactly one well-known location per origin; a file anywhere else, or served with the wrong media type, is invisible to the parser regardless of its content.
- **Acceptance:**
  - `/robots.txt` returns `200` with the intended body on every production origin
  - Response `Content-Type` is `text/plain` (RFC 9309 §2.3 requires the media type; declaring `charset=utf-8` explicitly is good practice though not itself mandated by the RFC)
- **Verify:** `curl -sI https://www.cleanstart.com/robots.txt | grep -i content-type`
- **Reference:** `apps/web/src/app/robots.txt/route.ts:6-13`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.3
- **Tools:** Lighthouse's `robots-txt` audit (SEO, equal-weighted) validates syntax reachability, not the exact media-type string — a Lighthouse pass does not confirm this rule's charset nuance.
- **Anti-patterns:** Serving robots.txt from a CDN edge rule or a static-export path that silently diverges from the app's own route handler on a redeploy.
- **Evidence:** Confirmed live 2026-07-29: `https://www.cleanstart.com/robots.txt` returns `200`, body matches `buildRobotsTxt()` exactly, `Content-Type: text/plain` (`route.ts:11`). The header omits an explicit `; charset=utf-8` parameter; the served bytes are UTF-8 (the source is a plain JS template literal, no non-ASCII content today), so this is not a live defect, but the header does not itself declare the charset the RFC's spirit recommends.
- **CleanStart:** Partial

---

### CRAWL-06 — Meta robots and `X-Robots-Tag` are equivalent; the most restrictive rule wins on conflict

- **Severity:** P1
- **Applies:** Always
- **Rule:** Treat `<meta name="robots">` and the `X-Robots-Tag` HTTP header as functionally equivalent — any directive valid in one is valid in the other, `X-Robots-Tag` is the only way to control non-HTML resources, and when directives conflict (within one mechanism, between the two, or across duplicate headers) the most restrictive directive wins.
- **Why:** Both feed the same indexing-rule set into Google's pipeline once the resource is fetched. `X-Robots-Tag` operates at the HTTP-response level so it reaches file types with no `<head>` to hold a meta tag, and Google's parser reduces every discovered directive to the sum of its most-restrictive effects.
- **Acceptance:**
  - A page with conflicting directives (e.g., `max-snippet:50` in one location, `nosnippet` in the other) resolves to full suppression, not the less restrictive value
  - Every non-HTML resource needing a robots directive uses `X-Robots-Tag`, since it has no `<head>` to carry a meta tag
- **Verify:** `curl -sI https://www.cleanstart.com/email-signatures/biswajit-de | grep -i x-robots-tag`
- **Reference:** `apps/web/src/proxy.ts:233-237`, `apps/web/src/lib/seo/canonical.ts:100-105,161-177`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag — "if a page has both max-snippet:50 and nosnippet rules, the nosnippet rule will apply"
- **Tools:** Sitebulb's "Noindex in HTML and HTTP header" (Medium) is the only tool surveyed that names both mechanisms in a single hint; Ahrefs, Semrush, and Screaming Frog each report the meta tag and the header as separate issue rows, which can make one underlying defect look like two independent findings in those tools' reports.
- **Anti-patterns:** Setting `noindex` via `X-Robots-Tag` on a URL that is also `Disallow`'d — see CRAWL-01, the single most common misconfiguration in this domain.
- **Evidence:** `canonical.ts:161-177` builds one `robots` object per page with no path that emits contradictory directives, and `proxy.ts:233-237` never asserts an `index`/`follow` token that conflicts with a page's own `noindex` meta — the header only ever adds snippet-size directives or the single `noindex, nofollow, noarchive` string, never a competing `index` claim. The asymmetry noted under CRAWL-01 (some noindex'd pages carry the signal only in the meta tag, with no header-level backup) is a defense-in-depth gap, not a conflicting-directive defect this rule's acceptance criterion targets. One family of pages does not fit the "one `robots` object per page" framing cleanly, though it is not a conflict: the soft-404 fallback described in CRAWL-11 emits **two** `<meta name="robots">` tags, confirmed live on `/blogs/this-slug-definitely-does-not-exist-xyz123` — `content="noindex, follow"` from `buildPageMetadata()`'s hard-coded not-found branch, plus a second, bare `content="noindex"` injected by Next.js's own not-found rendering boundary. Both resolve to `noindex`, so this rule's actual conflict test (most-restrictive-wins on a genuine contradiction) is not violated, but it means this rule's premise of exactly one `robots` object per page is incomplete for that path family, worth noting even though it doesn't change the verdict.
- **CleanStart:** Pass

---

### CRAWL-07 — robots.txt `noindex:` is unsupported, dead syntax on Google (retired 2019-09-01)

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never write `noindex:`, `nofollow:`, or `crawl-delay:` as a Google-facing robots.txt directive. Google retired support for these unpublished/unsupported rules on 2019-09-01, and `noindex:` in robots.txt was never part of the standard and has never worked on Google.
- **Why:** Google explicitly announced it was "retiring all code that handles unsupported and unpublished rules (such as noindex)" as part of open-sourcing its robots.txt parser. A `noindex:` line is dead weight, not a working control, and gives false confidence that a URL is protected.
- **Acceptance:** Any robots.txt containing a `noindex:` line is a lint failure — the directive must instead be a `<meta name="robots">` tag or an `X-Robots-Tag` header.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -i '^noindex'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61`
- **Source:** [Tier 1] https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt — corrected per `verification-log.md` correction #1: the original research file mis-tiered this claim as Tier 4 via an inaccessible Search Engine Land secondary citation and stated the primary Google post was "no longer independently retrievable." That post is in fact live at this URL and contains the quoted phrase verbatim: "retiring all code that handles unsupported and unpublished rules (such as noindex)... September 1, 2019."
- **Tools:** None of the five tools in `tool-scoring.md` publish a distinct "`noindex:` in robots.txt" check — they simply don't recognize the directive, so a scan shows no signal either way. This rule exists because the failure is invisible to tooling, not because a tool flags it.
- **Anti-patterns:** Copy-pasting `noindex:` into robots.txt from a pre-2019 tutorial and believing it works — many teams still do this; it never worked and was never documented or supported by Google in the first place.
- **Evidence:** `robots.ts:22-61` contains no `noindex:`, `nofollow:`, or `crawl-delay:` directive of any kind — the file uses only `User-Agent`, `Content-Signal`, `Allow`, `Disallow`, `Host`, and `Sitemap`, all real, supported fields.
- **CleanStart:** Pass

---

### CRAWL-08 — `max-snippet`/`nosnippet`/`max-image-preview` now also gate AI Overviews and AI Mode content reuse (2025 change)

- **Severity:** P1
- **Applies:** Always
- **Rule:** Treat `max-snippet`, `nosnippet`, and `max-image-preview` as governing not just classic organic snippets but also whether, and how much of, a page's content Google may reuse as direct input to AI Overviews and AI Mode.
- **Why:** Google updated its robots meta tag documentation in March 2025 to state these directives apply to "all forms of search results (web search, Google Images, Discover, Assistant, AI Overviews, AI Mode)" — decade-old snippet-control directives now also gate generative-answer reuse, with no separate opt-out mechanism.
- **Acceptance:** A page's snippet-control directives (or their absence) are understood to govern AI Overview/AI Mode content-reuse eligibility, not only blue-link snippets; any internal checklist stating "these only affect classic snippets" is stale.
- **Verify:** `curl -sI https://www.cleanstart.com/ | grep -i x-robots-tag`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:170-177`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag (current version, states the AI Overviews/AI Mode scope directly); change reported contemporaneously by Search Engine Journal, March 2025
- **Tools:** Not documented by any of the five tools in `tool-scoring.md` — none currently distinguish "snippet control" from "AI-reuse control" in their issue taxonomy; this is a 2025 documentation change most vendor help-articles have not yet reflected.
- **Anti-patterns:** Treating a pre-2025 SOP or vendor description of `max-snippet`/`nosnippet` as "search snippet only" — it is now incomplete.
- **Evidence:** Every indexable page emits `max-image-preview:large, max-snippet:-1` (unlimited reuse permitted), confirmed live on the home page and via `canonical.ts:170-177` — a deliberate, documented choice (not an accidental omission); pages that are `noindex`'d don't reach this branch at all (`canonical.ts:161-166`).
- **CleanStart:** Pass

---

### CRAWL-09 — `rel=canonical` is a hint, not a directive

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never document `rel=canonical` (or XML sitemap inclusion) as a guaranteed instruction — it is a signal among several, and Google explicitly reserves the right to select a different canonical URL.
- **Why:** Google's canonicalization process clusters near-duplicate URLs and selects the one it judges most complete/useful, weighing 301/308 redirects and `rel=canonical` as strong signals and sitemap inclusion as a weak one — none of these forces the outcome.
- **Acceptance:** A documented QA check compares the declared canonical against Search Console's "Google-selected canonical" for a sample of pages; a mismatch is treated as expected behavior to monitor, not a bug to fight with more aggressive tagging.
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -o '<link rel="canonical"[^>]*>'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:94-131`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/canonicalization — "indicating a canonical preference is a hint, not a rule"
- **Tools:** Not applicable as a single issue class — this is a framing/expectation rule, not a defect any tool scores.
- **Anti-patterns:** Escalating a Search Console "Duplicate, Google chose different canonical than user" report as an error to fix via more tagging — per Google's own framing this is expected algorithmic behavior.
- **Evidence:** `canonical.ts` emits exactly one `link[rel=canonical]` per page and makes no framework-level attempt to force Google's selection; no internal documentation reviewed in this pass claims canonical is a binding directive.
- **CleanStart:** Pass

---

### CRAWL-10 — Canonical anti-patterns Google explicitly calls out

- **Severity:** P1
- **Applies:** Always
- **Rule:** Never (a) use robots.txt for canonicalization, (b) use the URL Removals tool for canonicalization, (c) declare conflicting canonical URLs via different mechanisms for the same page, (d) point `rel=canonical` at a URL fragment, or (e) use `noindex` as a substitute for canonicalization.
- **Why:** Each either produces undefined behavior (the removals tool hides all versions of a URL, not just the "duplicate") or gives Google contradictory signals that force a fallback to independent judgment, defeating the point of declaring a preference at all.
- **Acceptance:** For any URL, exactly one canonicalization declaration exists (HTML `<link rel=canonical>` XOR an HTTP `Link` header with the same target — never both with different targets), and it is never a fragment or a robots.txt-blocked path.
- **Verify:** `curl -sI https://www.cleanstart.com/ | grep -i '^link:' | grep -c 'rel="canonical"'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:94-131`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — "Don't use the robots.txt file for canonicalization purposes... Don't specify different URLs as canonical for the same page using different canonicalization techniques... Don't specify a URL fragment as canonical."
- **Tools:** Screaming Frog's "Canonical Tags → Canonicalised" (Warning, High) is the closest match for the cross-mechanism-conflict case; Sitebulb's "Canonical points to a different internal URL" (Insight) frames the same underlying fact at its lowest severity tier among the tools surveyed.
- **Anti-patterns:** Declaring a canonical via both the HTML tag and an HTTP `Link` header pointing at different URLs — Google is left to guess which one is real.
- **Evidence:** The site's only canonical mechanism is the HTML `<link rel=canonical>` from `canonical.ts:125,131`. The `Link` HTTP header observed live carries only `rel="api-catalog"`/`rel="sitemap"`/`rel="service-desc"` entries, never a competing `rel="canonical"`. No canonical target observed in this pass is a fragment or a `Disallow`'d path.
- **CleanStart:** Pass

---

### CRAWL-11 — Soft 404s must return a real 404/410 status code, not a 200

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every "not found"/"no results" state must return an actual HTTP `404` (or `410` if permanently gone) — never a `200` with error-like or empty body content.
- **Why:** Google's indexing pipeline evaluates rendered content, not just the status code; a `200`-status page whose content reads as "not found" is classified as a soft 404, which wastes crawl budget and can suppress genuine pages in the process.
- **Acceptance:** For every URL pattern representing "resource does not exist," the HTTP status code returned is `404` or `410`, independent of content inspection.
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" https://www.cleanstart.com/blogs/this-slug-definitely-does-not-exist-xyz123`
- **Reference:** `apps/web/src/app/blogs/[slug]/page.tsx:65`, `guide/[slug]/page.tsx:64`, `knowledge-hub/[slug]/page.tsx:35`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/http-network-errors — corrected per `verification-log.md` correction #2: replaces a sentence the original research file presented as a direct quote with Google's actual verbatim wording — "If the content suggests an error for Google Search, an empty page or an error message, Search Console will show a soft 404 error."
- **Tools:** Not documented as a standalone issue class by name in `tool-scoring.md`; Sitebulb's closest hint is sitemap-scoped ("Not Found (4XX) URL in XML Sitemaps" — Critical), which doesn't cover a soft 404 that never appears in the sitemap at all.
- **Anti-patterns:** A "friendly" `200`-status empty-state page for an unknown slug — it looks fine to a human visitor and is a textbook soft 404 to Google regardless.
- **Evidence:** Confirmed live 2026-07-29: `curl -s -o /dev/null -w "%{http_code}\n" .../blogs/this-slug-definitely-does-not-exist-xyz123` returns `200`, not `404`. The rendered page carries `<meta name="robots" content="noindex, follow"/>` from the hard-coded not-found fallback (`blogs/[slug]/page.tsx:65`), which keeps this specific soft-404 page itself out of the index, but does not fix the wrong status code or the crawl-budget cost of Google repeatedly re-checking a URL that will never resolve to real content. This is a previously-diagnosed defect: Next.js `dynamicParams=true` ISR caches the `notFound()` result as a `200`, and a `notFound()` call inside `generateMetadata` was tried and confirmed not to fix it (regressed a different metric instead). Only `blogs/[slug]`, `guide/[slug]`, and `knowledge-hub/[slug]` were directly re-verified for their not-found noindex fallback in this pass — the same App Router mechanism plausibly affects `resources/[slug]`, `news/[slug]`, `job/[slug]`, `event/[slug]`, and `author/[slug]` too, but each was not individually re-confirmed here.
- **CleanStart:** Fail

---

### CRAWL-12 — Redirect status code shapes signal strength: 301/308 strong, 302/307 weak

- **Severity:** P1
- **Applies:** Always
- **Rule:** Use `301`/`308` (permanent) for any redirect meant to permanently consolidate a URL, and reserve `302`/`307` (temporary) only for genuinely temporary redirects — never a temporary status "because it's the default" for a permanent move.
- **Why:** Google treats a `301`/`308` target as a strong signal to process/canonicalize in place of the source; a `302`/`307` target is only a weak signal, meaning the source URL can persist as canonical in Google's index despite the redirect — the opposite of the intended consolidation for a permanent move.
- **Acceptance:** Every redirect implementing a permanent URL change returns `301` or `308`; a `302` or `307` used for a permanent change is a defect.
- **Verify:** `curl -sI https://www.cleanstart.com/blog | grep -iE '^HTTP|^location'`
- **Reference:** `apps/web/next.config.ts:62-99`, `apps/web/src/proxy.ts:97-114,126-132,150-158`, `apps/cms/src/payload/collections/Redirects.ts:63-75`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/http-network-errors — "301 (Moved Permanently)... Google systems use the redirect as a strong signal... 302 (Found)... a weak signal."
- **Tools:** Not applicable at the single-page level for most tools; Screaming Frog and Ahrefs both flag redirect chains/loops (`tool-scoring.md` Disagreements §4) but neither publishes a distinct "302 used for a permanent move" check — this rule requires policy review, not a tool scan.
- **Anti-patterns:** Leaving a permanent migration on a framework's temporary-redirect default instead of explicitly setting a permanent status.
- **Evidence:** Every framework-level redirect (`next.config.ts` route renames, `proxy.ts` apex/trailing-slash/lowercase/legacy-param/section-index redirects) is hardcoded `308` (the method-preserving equivalent of `301`); the CMS-managed `redirects` table defaults new rows to `301` and exposes `302`/`307`/`308`/`410` only as deliberate editor choices (`Redirects.ts:63-75`). Nothing in the codebase forces a permanent move through a temporary-status code.
- **CleanStart:** Pass

---

## P2 — meaningful improvement, non-urgent

### CRAWL-13 — robots.txt rule matching: most specific path wins, ties resolve to `Allow`

- **Severity:** P2
- **Applies:** Always
- **Rule:** When multiple robots.txt rules could match a URL, the rule with the longest (most specific) path prefix applies; if length ties between an `Allow` and a `Disallow`, the `Allow` wins.
- **Why:** Google's parser computes match length in octets per rule and selects the longest match, not the order rules appear in the file — assuming order-based precedence produces the wrong effective rule whenever a more specific `Allow` is meant to carve an exception out of a broader `Disallow`.
- **Acceptance:** For a given URL and robots.txt, both a manual octet-length trace and Search Console's robots.txt report select the identical rule as authoritative.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -E '^(Allow|Disallow)'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:38-52`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.2.2; corroborated by https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- **Tools:** Not documented as a distinct check — no tool in `tool-scoring.md` verifies rule-precedence resolution; this is a hand-authored-file correctness property, not something an external crawl audit observes.
- **Anti-patterns:** Assuming rule order in the file determines precedence — it doesn't; specificity does.
- **Evidence:** The current rule set has no overlapping `Allow`/`Disallow` pair requiring specificity resolution — `Allow: /` plus four disjoint, non-overlapping `Disallow` prefixes — so there is no ambiguous case for Google's matcher to resolve either way.
- **CleanStart:** Pass

---

### CRAWL-14 — robots.txt parsing limit is 500 KiB

- **Severity:** P2
- **Applies:** Always
- **Rule:** Keep robots.txt under 500 KiB — content beyond that limit is not guaranteed to be parsed and can be silently truncated mid-rule.
- **Why:** Both RFC 9309 and Google's implementation cap the parsed file size; a rule truncated mid-line can silently change its meaning rather than simply being dropped in full.
- **Acceptance:** The served file's byte count is under 512000.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | wc -c`
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.5; corroborated by https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- **Tools:** Not documented as a distinct issue by any of the five tools surveyed — file-size truncation of robots.txt itself is outside what a page-level or site crawl audit observes.
- **Anti-patterns:** Auto-generating a robots.txt with a per-URL `Disallow` line for a large dynamic set (e.g., one line per faceted-nav combination) without a size ceiling check.
- **Evidence:** The generated file is a fixed, hand-authored ~15-line template (`buildRobotsTxt`, `robots.ts:22-61`) with no per-URL or per-collection expansion; confirmed live at well under 1 KiB, several orders of magnitude below the limit.
- **CleanStart:** Pass

---

### CRAWL-15 — Faceted/parameter URL explosion should be blocked at the robots.txt level, not by canonical alone

- **Severity:** P2
- **Applies:** Sites with combinatorial filter/facet or query-parameter-driven listing URLs
- **Rule:** For sites with combinatorial filter/facet URLs, use robots.txt `Disallow` patterns on the parameter itself as the primary crawl control — `rel=canonical` alone only reduces indexing of duplicates over time, it does not stop Googlebot from crawling every combination first.
- **Why:** `rel=canonical` is a post-crawl consolidation signal (CRAWL-09); it does not prevent Googlebot from fetching every facet combination before consolidating them, and over-crawling low-value combinations directly reduces crawl time available for genuinely new, useful URLs.
- **Acceptance:** Server logs show no crawler requests to disallowed facet-parameter patterns within 30 days of the `Disallow` rule taking effect (subject to the 24-hour robots.txt cache window, CRAWL-18).
- **Verify:** `grep "Googlebot" access.log | grep -c "category="`
- **Reference:** `apps/web/src/lib/seo/robots.ts:38-52`, `apps/web/src/lib/seo/canonical.ts:195-207`
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation — "if crawling is spent on useless URLs, the crawlers have less time to spend on new, useful URLs"
- **Tools:** Not documented as a distinct issue by the five tools surveyed under this exact name; Ahrefs'/Semrush's duplicate-content and canonical checks would surface the downstream symptom (many near-duplicate URLs) without diagnosing that a `Disallow` pattern, not more canonical tagging, is the documented primary fix.
- **Anti-patterns:** Adding more aggressive `rel=canonical` rules to fight a facet-URL explosion instead of blocking the parameter at the crawl level.
- **Evidence:** Listing pages (`blogs`, `guide`, `resource-center`, etc.) render identical page-1 HTML for every query-string filter/pagination variant and self-canonicalize to the clean `basePath` (`canonical.ts:195-207`) — the documented secondary control. robots.txt has no parameter-pattern `Disallow` rule for these listing query strings — the documented primary control — is absent. Given the site's confirmed scale (519 `<loc>` entries in `sitemap.xml`, fetched live 2026-07-29 — roughly 19× under the ~10,000-URL threshold at which CRAWL-21 says this class of guidance starts to matter), practical exposure today is low, but the primary recommended mechanism is genuinely absent rather than deliberately judged unnecessary anywhere in the code or its comments.
- **CleanStart:** Partial

---

## P3 — hygiene, marginal or speculative gain

### CRAWL-16 — Duplicate user-agent groups are merged, not overridden

- **Severity:** P3
- **Applies:** Always
- **Rule:** Pick the single robots.txt group whose `user-agent` name most specifically matches the crawler; if several groups name the same agent, merge all their rules into one group rather than using only the first or last.
- **Why:** Field names and values in robots.txt are case-insensitive, and a crawler that finds two blocks for the same UA combines both rule sets — assuming only one block "wins" produces an incomplete effective rule set.
- **Acceptance:** Given a robots.txt with two blocks for the same UA, the effective rule set is verified to be the union of both, not just one.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -c '^User-Agent'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:36-56`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.2.1 — "If there is more than one group matching the user-agent, the matching groups' rules MUST be combined into one group and parsed."
- **Tools:** Not documented as a distinct check by any tool surveyed in `tool-scoring.md`.
- **Anti-patterns:** Splitting rules for the same crawler across multiple `User-Agent` blocks and assuming only the first (or last) is honored.
- **Evidence:** Exactly two `User-Agent` groups exist (`*` and `Bytespider`), each named once — there is no duplicate-UA case for the merge rule to apply to.
- **CleanStart:** Pass

---

### CRAWL-17 — Wildcard syntax in robots.txt is limited to `*` and `$`

- **Severity:** P3
- **Applies:** Always
- **Rule:** In `Allow`/`Disallow` paths, use only `*` (zero-or-more of any character) and `$` (end-of-URL anchor) — no other regex syntax is supported, and a trailing `*` is redundant.
- **Why:** Google's parser recognizes exactly these two special characters; anything else is treated as a literal character, and a trailing wildcard like `/fish*` behaves identically to `/fish`.
- **Acceptance:** A path using only `*`/`$` produces the intended match set against a representative URL sample; no trailing-`*` redundancy is present.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -E '(Allow|Disallow): .*[*$]'`
- **Reference:** `apps/web/src/lib/seo/robots.ts:52`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt — "`*` designates 0 or more instances of any valid character... trailing wildcards like `/*` are equivalent to `/` and are ignored"
- **Tools:** Lighthouse's `robots-txt` audit validates general syntax reachability but does not specifically flag redundant trailing wildcards.
- **Anti-patterns:** Writing a trailing `/*` expecting it to be meaningfully different from the bare prefix — Google ignores the redundant wildcard.
- **Evidence:** The one wildcard in use, `Disallow: /*_rsc=` (`robots.ts:52`), is a valid mid-path `*` with no trailing redundancy and no unsupported syntax.
- **CleanStart:** Pass

---

### CRAWL-18 — robots.txt changes propagate on a caching delay, not instantly

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not expect a robots.txt edit to take effect immediately — budget up to 24 hours for propagation under normal conditions, and expect the last-known-good file to be reused far longer during an outage.
- **Why:** Crawlers should not use a cached copy for more than 24 hours normally, but if the file becomes unreachable, Google may keep serving the cached version well past that window rather than falling back immediately.
- **Acceptance:** A robots.txt change is not treated as "verified live" until either 24 hours have elapsed or Search Console's robots.txt report confirms Google's own cached copy reflects it.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt`
- **Reference:** `apps/web/src/app/robots.txt/route.ts:6-13`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc9309.html §2.4; corroborated by https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt — "Google generally caches the contents of a robots.txt file for up to 24 hours, but may cache it longer"
- **Tools:** Not applicable — this is a verification-methodology rule, not a defect any tool scan surfaces.
- **Anti-patterns:** Trusting a fresh `curl` of the live file as proof Google has already picked up a same-day change.
- **Evidence:** No code mechanism controls or needs to control robots.txt caching latency on Google's side; this rule governs how a future robots.txt change should be *verified*, not something the current implementation does or could fail at.
- **CleanStart:** N/A

---

### CRAWL-19 — `Crawl-delay` is ignored by Google, honored by Bing

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not rely on a robots.txt `Crawl-delay` directive to throttle Googlebot — it has no effect on Google. It does work for Bingbot.
- **Why:** Google's crawl rate is governed by "crawl capacity limit" and "crawl demand" (CRAWL-21), adjustable only in aggregate, never via a per-file directive; Bing's crawler explicitly implements `Crawl-delay` as a relative throttle.
- **Acceptance:** A `Crawl-delay` line is treated as Bing-only configuration; its absence or presence has no bearing on Google's crawl rate.
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -ic crawl-delay`
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61`
- **Source:** [Tier 1] https://blogs.bing.com/webmaster/August-2009/Crawl-delay-and-the-Bing-crawler,-MSNBot; Google's non-support corroborated by https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt (supported-field list omits `crawl-delay`)
- **Tools:** Not documented as a distinct check by any tool surveyed in `tool-scoring.md`.
- **Anti-patterns:** Adding `Crawl-delay` expecting it to slow Googlebot down — it is a no-op for Google.
- **Evidence:** `robots.ts:22-61` contains no `Crawl-delay` directive; the file correctly avoids implying a control that wouldn't work against Google's own crawler anyway.
- **CleanStart:** Pass

---

### CRAWL-20 — `X-Robots-Tag` is a de facto convention, not a formal standard

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not cite `X-Robots-Tag` as an IETF/W3C standard in any documentation — describe it as a search-engine convention, since no formal specification governs it.
- **Why:** No RFC or W3C recommendation defines this header; its semantics exist only because Google (and other engines) chose to document and honor it.
- **Acceptance:** Internal documentation referencing `X-Robots-Tag` does not claim IETF/W3C standardization.
- **Verify:** `grep -rni "x-robots-tag" docs/ --exclude-dir=seo | grep -i "standard\|IETF\|W3C\|RFC"` (excludes `docs/seo/` itself, since this rule's own text names the disallowed terms while documenting the prohibition — a self-match there is not a violation)
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Robots-Tag — "not part of any current specification"
- **Tools:** Not applicable — no tool scores documentation wording.
- **Anti-patterns:** Describing `X-Robots-Tag` as an "official HTTP header" or citing a nonexistent RFC number for it.
- **Evidence:** No documentation reviewed in this repo (`docs/web/WEB-PRODUCTION.md`, `docs/seo/00-index.md`) claims `X-Robots-Tag` is a formal IETF/W3C standard.
- **CleanStart:** Pass

---

### CRAWL-21 — Crawl-budget engineering doesn't apply below roughly 10,000 URLs

- **Severity:** P3
- **Applies:** Sites approaching roughly 10,000+ URLs, or with 10,000+ URLs that change daily; not applicable below that scale
- **Rule:** Do not build crawl-budget-management tooling (dynamic robots.txt throttling, crawl-priority sitemaps) for a site with a stable page count under a few thousand URLs — Google explicitly states this guidance doesn't apply at that scale.
- **Why:** Crawl budget is the product of "crawl capacity limit" (server health/latency) and "crawl demand" (popularity, staleness, perceived inventory). Google's own documentation says a site without a large, rapidly-changing page count, or one whose new pages are crawled the same day they're published, doesn't need this guidance at all.
- **Acceptance:** A site under ~10,000 URLs with no rapid daily churn does not need dedicated crawl-budget engineering; a site above ~1M unique URLs, or 10,000+ with daily churn, is squarely in scope.
- **Verify:** `curl -s https://www.cleanstart.com/sitemap.xml | grep -c '<loc>'`
- **Reference:** `apps/web/src/app/sitemap.ts:117-159`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget — "if your site doesn't have a large number of pages that change rapidly, or if your pages seem to be crawled the same day that they are published, you don't need to read this guide"
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores "crawl budget" as an issue; Ahrefs/Semrush report crawl stats as a separate metric, not a budget-applicability verdict.
- **Anti-patterns:** Building dynamic-throttling or crawl-priority infrastructure preemptively for a site that will never approach the scale where Google's own guidance says it matters.
- **Evidence:** Confirmed live 2026-07-29: `sitemap.xml` lists 519 `<loc>` entries, roughly 19× (about 1.3 orders of magnitude) under the ~10,000-URL threshold at which Google's own documentation says this guidance begins to apply. No crawl-budget-specific engineering is warranted or present.
- **CleanStart:** N/A

---

### CRAWL-22 — The Search Console URL Parameters tool no longer exists (removed 2022-04-26)

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not instruct editors or engineers to "set it in the URL Parameters tool" — Search Console's URL Parameters tool was fully removed on 2022-04-26 and has no replacement UI.
- **Why:** Google found only ~1% of configured parameter rules were actually useful to its crawler and stated automatic parameter-detection had made the manual tool redundant. Current guidance for parameter-driven duplication is to avoid session IDs in URLs and use robots.txt `Disallow` for genuinely low-value dynamic paths if automatic handling proves insufficient.
- **Acceptance:** No internal documentation, runbook, or vendor-tool integration instructs use of "Search Console → Crawl → URL Parameters."
- **Verify:** `grep -rni "url parameters tool" docs/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/blog/2022/03/url-parameters-tool-deprecated; current guidance at https://developers.google.com/search/docs/crawling-indexing/url-structure
- **Tools:** Not applicable — no tool scores documentation currency.
- **Anti-patterns:** Referencing a Search Console feature that has not existed since April 2022.
- **Evidence:** No documentation in this repo references the URL Parameters tool.
- **CleanStart:** Pass

---

### CRAWL-23 — Google generally ignores URL fragments for crawling and indexing

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not rely on `#fragment`-based routing for content that needs to be indexed distinctly; conversely, fragment-based state is a valid way to keep filter/facet variations invisible to crawlers entirely.
- **Why:** The fragment is a client-side-only construct never sent to the server in a normal HTTP request, so Google's crawling and indexing pipeline generally does not treat different fragments of the same base URL as distinct crawlable resources.
- **Acceptance:** Two URLs differing only in `#fragment` are treated as the same URL by Google — a single index entry at the fragment-less base.
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" "https://www.cleanstart.com/#nonexistent-fragment"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/crawling/docs/faceted-navigation — "Google Search generally doesn't support URL fragments in crawling and indexing"
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores fragment-based routing as a distinct issue class.
- **Anti-patterns:** Building a client-side-only router that serves meaningfully different content per `#fragment` and expecting each variant to be independently indexed.
- **Evidence:** No page in `apps/web/src/app` uses `#fragment` routing for distinct indexable content; every route is a real, server-resolvable path.
- **CleanStart:** Pass
