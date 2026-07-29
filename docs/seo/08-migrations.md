# Migrations & URL Change Management

**Module:** 08 — Migrations & URL change management
**Prefix:** `MIG`
**Review cadence:** Semi-annual (`00-index.md` §9)
**Scope:** Redirect mapping, 301 vs 302 vs 410, launch-day protocol, monitoring window, rollback.
**Evidence base:** `docs/seo/evidence/sources/migrations.md` (15 researched items covering redirect status-code semantics, chain/loop hygiene, retention, homepage-funnel soft-404s, and the Google/Bing site-move tooling); `docs/seo/evidence/verification-log.md` (both corrections required for this domain are applied below — #19 in MIG-01, #20 in MIG-14); `docs/seo/evidence/codebase-inventory.md` ("URL Architecture & Sitemaps" section, three-layer redirect-resolution mechanism); `docs/seo/evidence/live-capture.json` (`control:legacy-redirect:*` entries, captured 2026-07-29).

This module governs the general procedure for a URL change. The specific CleanStart conformance failure behind MIG-01 — 12 of 13 documented legacy URLs 404ing instead of redirecting — is the same underlying defect recorded as `ARCH-01` in `02-site-and-url-architecture.md`; that rule owns the architecture-level acceptance criteria and file evidence, this module owns the general migration procedure and severity reasoning. Refer to `ARCH-01` rather than re-deriving its evidence here.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### MIG-01 — A previously-indexed URL 404ing instead of 301ing is a time-decaying, only-partially-recoverable loss

- **Severity:** P0
- **Applies:** Always — any previously-indexed, externally-linked URL that should redirect
- **Rule:** Treat any previously-indexed URL that unexpectedly serves 404 instead of its planned 301/308 as a defect to fix immediately, not a follow-up ticket. The longer the URL sits in that state, the more of the loss becomes structurally harder to recover even after the redirect is finally added.
- **Why:** Google's own documentation confirms two real, compounding costs, and this SOP states them only in their defensible form. First, the indexing pipeline removes a previously-indexed URL from the index once the 404 is confirmed, and crawl frequency to that URL "gradually decreases" the longer it persists. Second, Search Console's own help documentation warns that adding a redirect after the fact "will delay the recrawl attempt, possibly for a very long time" once a URL has already been marked gone. Both of these are genuine, Tier 1-documented reasons not to let the defect sit. This SOP does **not** claim recrawling stops entirely, and does not claim a dropped URL needs a fresh external discovery signal (a new inbound link, a sitemap re-mention) before it can be recrawled at all — that stronger claim was checked against both cited sources during adversarial verification and is not supported by either: Google's own wording is "gradually decreases," not "drops to zero," and the fix is recovered through Google's normal, if throttled, recrawl of a URL it already knows about. Do not restore that stronger claim in any future revision of this rule.
- **Acceptance:**
  - Zero previously-indexed legacy URLs return 404 where a 301/308 was planned
  - Redirect mapping is completed and verified live **before** DNS/route cutover, per Google's own site-move sequencing — not as a remediation step performed after the fact
  - Any URL found violating this is escalated same-day, not queued as ordinary backlog
- **Verify:** `for u in $(cat legacy-urls.txt); do printf '%s ' "$u"; curl -sI -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$u"; done`
- **Reference:** See `ARCH-01` in `02-site-and-url-architecture.md` for the CleanStart-specific file:line evidence (`apps/web/src/proxy.ts:136-160`, `apps/cms/src/payload/collections/Redirects.ts:29-146`) and the live-capture citation.
- **Source:** [Tier 1] Index removal + crawl-frequency decay on 404 — https://developers.google.com/search/docs/crawling-indexing/http-network-errors. [Tier 1] Recrawl-after-fix delay ("possibly for a very long time") — https://support.google.com/webmasters/answer/2445990, Google Search Console Help. [Tier 1] Redirect-mapping sequenced before traffic cutover — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes. Corrected per `verification-log.md` correction #19: the original research overstated an uncited "Google rechecks the URLs on its next crawl and updates the status if the fix holds" sentence and the unsupported claim that a dropped URL "needs a fresh discovery signal... to be recrawled at all." Both are removed here; only the Tier 1-verified "delay... possibly for a very long time" and "gradually decreases" wording is retained.
- **Tools:** Ahrefs "404 page" (Error, reduces Health Score); Semrush "Pages returning 4XX status code" (Error); Screaming Frog "Internal Client Error (4XX)" (Issue, High) — all three report the 404 itself; none distinguish a genuinely-new 404 from a previously-indexed URL that used to redirect, which is the specific case this rule escalates above their default weighting.
- **Anti-patterns:** Treating "we'll add the 301s in a follow-up ticket" as low-urgency because "we can always add the redirect later and it'll be fine" — the mechanism needed to fix it (recrawl) is itself being suppressed by the defect the longer it sits.
- **CleanStart:** Fail

  `docs/seo/evidence/live-capture.json` (`control:legacy-redirect:*`, captured 2026-07-29) confirms 12 of 13 documented legacy redirects return a bare `404`: `/acceptable-use-policy`, `/leadership`, `/search`, `/survey`, both `/webinar/secure-containers-end-to-end-…` slugs, `/new-year-event-sysdig`, `/new-year-event-eventus`, and all four `/cleanstart-hitachi-*`/`/cleanstart-raksha-chennai` event pages — none have a row in the CMS `redirects` table. The 13th, `/pricing`, returns `200` because that page was later built as a real, live route (`apps/web/src/app/pricing/page.tsx`) — it is not a stale redirect target and is correctly excluded from this rule's failing count. Full file-level evidence lives in `ARCH-01`; this verdict is restated here only because MIG-01 is this module's own severity-anchoring rule.

---

### MIG-02 — A redirect loop is a total outage for every URL caught in it

- **Severity:** P0
- **Applies:** Always — any redirect map with two or more rules
- **Rule:** Never let a redirect's destination eventually point back at (or through) its own source. A loop must be caught in code review and CI before deploy, not discovered in production.
- **Why:** Neither RFC 9110 nor Google's crawler defines graceful infinite-loop behavior — a browser or crawler aborts after a bounded number of hops (Google's own bound is 10; an 11th hop, chain or loop, is simply not followed, so the URL resolves to nothing at all). Next.js's own documentation separately flags a specific config-level footgun: omitting the leading slash before a `:param` in a redirect's `source`/`destination` "run[s] the risk of causing infinite redirects," independent of how Google's crawler behaves. Every URL caught in a loop is a total outage for that URL — no browser, crawler, or human visitor ever reaches real content.
- **Acceptance:**
  - Every redirect rule added to the map is validated against the full existing rule set for cycles before deploy — zero loops present in production
  - The validation runs as an automated check (a directed-graph cycle detector over all `source → destination` pairs), not a manual read-through
- **Verify:** `curl -sIL --max-redirs 10 -o /dev/null -w '%{http_code} %{num_redirects}\n' https://www.cleanstart.com/<path>` — a non-2xx/3xx final code or `num_redirects` pegged at the max is a loop signal
- **Reference:** `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:4-5` (`MAX_HOPS = 10`, `FLATTEN_AFTER_HOPS = 3`), enforced in a `beforeChange` hook (`redirect-cycle-guard.ts`) on every write to `apps/cms/src/payload/collections/Redirects.ts`
- **Source:** [Tier 1] 10-hop ceiling — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes. [Tier 2] Next.js infinite-redirect footgun ("Remember to include the forward slash `/` before the colon `:` in path parameters... otherwise... you run the risk of causing infinite redirects") — https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects, Next.js Docs.
- **Tools:** Screaming Frog "Redirect Chains" flags chains generally but does not run true cycle detection against the full map before a change ships; Ahrefs' "Redirect loop" (Error) is post-hoc — it finds a loop already live, not one about to be introduced by a new rule.
- **Anti-patterns:** Adding a catch-all redirect rule (e.g., locale-prefix normalization) without checking it against an already-existing specific rule that redirects back into the catch-all's match pattern.
- **CleanStart:** Pass

  `redirect-cycle-guard.ts` walks the resulting chain on every write to the CMS `redirects` collection, up to `MAX_HOPS = 10`, flattening intermediate hops after `FLATTEN_AFTER_HOPS = 3`, and rejects a true cycle via `ValidationError` before the row can save. This runs at write time in the CMS, ahead of the middleware lookup in `apps/web/src/proxy.ts:136-160` that resolves redirects at request time — a cycle cannot enter the live table through the admin UI or the API.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### MIG-03 — Implement permanent URL changes as server-side 301/308, never client-side

- **Severity:** P1
- **Applies:** Always, when a server-side redirect is technically possible
- **Rule:** Implement every permanent URL change as a server-side HTTP redirect (301 or 308), never a client-side meta refresh or JavaScript redirect, whenever a server-side option is available.
- **Why:** A server-side redirect returns the 3xx status and `Location` header before any page body is sent, so a crawler's fetch is redirected before rendering is even attempted. Google's own stated hierarchy: server-side redirect is preferred; a meta refresh with `0` delay is treated as the permanent-redirect equivalent, any other delay as temporary; a JavaScript redirect is least reliable because it fires only after the page loads and executes, and fails outright if JS errors or is blocked for that fetch.
- **Acceptance:**
  - For every changed URL, `curl -I` on the old URL returns `301`/`308` with a `Location` header pointing directly at the final destination — never a `200` with an embedded meta refresh or `window.location` script
- **Verify:** `curl -sI https://www.cleanstart.com/<old-path> | head -1` → `HTTP/2 301` or `HTTP/2 308`
- **Reference:** `apps/web/next.config.ts:63-99` (`async redirects()`, four rules, all `permanent: true`); `apps/web/src/proxy.ts:97-158` (apex, trailing-slash, lowercase, legacy-param, section-index, and CMS-managed redirects, all issued as `NextResponse.redirect(...)` before any render)
- **Source:** [Tier 1] "we recommend that you use HTTP permanent redirects if possible, such as `301` and `308`" — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes. [Tier 1] Server-side vs. meta-refresh vs. JavaScript preference hierarchy — https://developers.google.com/search/docs/crawling-indexing/301-redirects.
- **Tools:** Screaming Frog and Ahrefs both flag a meta-refresh/JS-redirect pattern as a lower-confidence signal than a real HTTP redirect in their crawl reports, but neither publishes a distinct "client-side redirect used for a permanent move" issue by that name.
- **Anti-patterns:** Shipping a client-rendered "redirecting you now..." interstitial page for a permanent URL change because it was faster to build than a server rule — explicitly the least-reliable option in Google's own preference order.
- **CleanStart:** Pass

  Every redirect mechanism in the codebase — the `next.config.ts` route renames, every `proxy.ts` middleware rule, and the CMS `redirects` collection consulted through `lookupRedirect` — issues a real HTTP 3xx response from the server before any page body renders. No client-side redirect (meta refresh, `window.location`) exists anywhere in the redirect-resolution path.

---

### MIG-04 — Reserve 302/307 for genuinely temporary changes, never as a hedge

- **Severity:** P1
- **Applies:** Always
- **Rule:** Use 302 (or 307) only for a URL change you expect to revert. Do not use a temporary redirect merely to hedge because you are "not sure yet" about a permanent migration.
- **Why:** A temporary redirect signals Google to keep the *original* URL as canonical and continue showing it in results; a permanent redirect signals Google to treat the *target* as canonical. Using 302 for a permanent move delays or prevents consolidation of ranking signals onto the new URL because Google keeps indexing the old one.
- **Acceptance:**
  - Every URL change not expected to revert returns 301/308, full stop
  - A 302/307 still present on a URL more than a few weeks after a "permanent" migration is treated as a defect, not an acceptable leftover
- **Verify:** `curl -sI https://www.cleanstart.com/<path> | grep -i ^HTTP` — confirm status class matches migration intent
- **Reference:** `apps/cms/src/payload/collections/Redirects.ts:63-75` — `status` field defaults new rows to `301` and exposes `302`/`307`/`308`/`410` only as deliberate editor choices, not framework defaults
- **Source:** [Tier 1] "Use permanent redirects when you're sure that the redirect won't be reverted" — https://developers.google.com/search/docs/crawling-indexing/301-redirects.
- **Tools:** Not applicable as a single-page issue class for most tools; this requires a policy audit of the redirect map against migration intent, not a crawl-time scan.
- **Anti-patterns:** Leaving a framework's default `permanent: false` (307) in place for a page that was actually permanently renamed, because it was the default and nobody flipped the flag.
- **CleanStart:** Pass

  The CMS `redirects` collection defaults every new row to `301`; a 302/307 exists only where an editor explicitly selected it, never as an unreviewed framework default. Every framework-level redirect (`next.config.ts`, the hardcoded rules in `proxy.ts`) is hardcoded `308`.

---

### MIG-05 — Pick the redirect status code that matches the endpoint's method/body-preservation contract

- **Severity:** P1
- **Applies:** Any redirected endpoint that accepts a non-GET method (form POST, API PUT/DELETE)
- **Rule:** Choose 301/302 only when it is acceptable for a client to rewrite a POST into a GET on the redirected request; choose 307/308 when the method and request body must be preserved exactly.
- **Why:** RFC 9110 defines this precisely, per status code. 301 (Moved Permanently): "a client MAY change the request method from POST to GET" on the subsequent request. 302 (Found): the same POST→GET permissiveness, but temporary. 307 (Temporary Redirect): "the user agent MUST NOT change the request method if it was POST" — method and body are preserved. 308 (Permanent Redirect): the permanent equivalent — "the user agent MUST NOT change the request method from POST to GET."
- **Acceptance:**
  - Any redirected endpoint that accepts non-GET methods uses 307/308, never 301/302/303 — a form submission silently becoming a GET after redirect is a spec-conformance bug, not a cosmetic one
- **Verify:** `curl -X POST -i https://www.cleanstart.com/<old-form-endpoint>` — confirm the `Location` target receives the same method with the same body
- **Reference:** None — no lead-submission or deal-registration endpoint in this codebase is itself a redirect target; `apps/web/src/proxy.ts:150-158` casts every CMS-managed redirect's status straight through (`301|302|307|308`) without rewriting an editor's method-preservation choice
- **Source:** [Tier 1] RFC 9110 §15.4.2–15.4.9, "HTTP Semantics" — https://www.rfc-editor.org/rfc/rfc9110.html.
- **Tools:** Not applicable — no surveyed tool tests redirect behavior against a non-GET request; this requires a manual or scripted method-preservation check on any redirected form/API route.
- **Anti-patterns:** Reflexively using 301 for everything, including API endpoints and form actions, because it's "the SEO redirect," without checking whether the endpoint is ever hit with a non-GET method.
- **CleanStart:** N/A

  No redirect rule in the current map targets a POST-accepting endpoint — the `LeadHandler` adapter and deal-registration submission routes are never themselves the source of a redirect rule.

---

### MIG-06 — Redirect every changed URL directly to its final destination in one hop

- **Severity:** P1
- **Applies:** Always
- **Rule:** Collapse every redirect to a single hop to its final destination. Do not treat Google's 10-hop tolerance as a design budget, and do not layer a new redirect on top of an old one instead of collapsing the map.
- **Why:** "Avoid chaining redirects. While Googlebot can follow up to 10 hops in a 'chain' of multiple redirects, we advise redirecting to the final destination directly." Each additional hop adds crawl latency and risk — a broken link mid-chain silently truncates the whole chain's effect — and signal consolidation is slower and less complete across multiple hops than a single hop.
- **Acceptance:**
  - No redirect in the migration map exceeds one hop
  - `curl -sIL` on any old URL shows exactly one `Location:` header before the final `200`
- **Verify:** `curl -sIL -o /dev/null -w '%{num_redirects}\n' https://www.cleanstart.com/<old-path>` → `1`
- **Reference:** `apps/web/src/proxy.ts:97-158` — apex, trailing-slash, lowercase, legacy-param, section-index, and CMS-managed redirects are evaluated in a fixed middleware order per request, but each individual rule resolves to a single target; `redirects-cache.ts:37-97` caches the full CMS table per edge isolate rather than resolving hop-by-hop
- **Source:** [Tier 1] "Googlebot can follow up to 10 hops in a 'chain' of multiple redirects, we advise redirecting to the final destination directly" — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes.
- **Tools:** Screaming Frog "Redirect Chains" (Warning) and Ahrefs "Redirect chain" both name this issue class directly and are the primary tools for auditing it post-launch.
- **Anti-patterns:** Layering a domain-migration redirect on top of an old path-restructure redirect (`/a` → `/b` → `/c`) instead of collapsing the map to `/a` → `/c` directly, because the intermediate rule was "already there" from a prior project.
- **CleanStart:** Unverified — no systematic audit of the live redirect map for multi-hop chains has been run in this pass; the middleware's fixed rule order means a single request can only match one rule and stop, which structurally limits (but does not by itself prove zero) chaining across sequential CMS-row edits over time

---

### MIG-07 — Map every old URL to its single most relevant new equivalent; never funnel unrelated URLs to the homepage

- **Severity:** P1
- **Applies:** Always
- **Rule:** Build a one-to-one (or genuinely-consolidated many-to-one) URL map before writing a single redirect rule. Never default an unmapped or "hard" URL to the site's homepage.
- **Why:** Google's indexing pipeline uses redirect-destination content as a relevance signal, not just a routing instruction. When many unrelated old URLs point at one irrelevant destination — typically the homepage — Google's soft-404 detection can flag the redirect target as not actually representing the old content, at which point the redirect stops passing the old URL's signals to anywhere at all.
- **Acceptance:**
  - Every redirect rule's destination contains content topically equivalent to (or a genuine superset/consolidation of) the source URL's content
  - Zero rules point at `/` unless the source URL literally was the homepage
- **Verify:** `curl -sL https://www.cleanstart.com/<old-path>` — manually confirm the destination is topically equivalent to the retired content
- **Reference:** `apps/cms/src/payload/collections/Redirects.ts:77-100` (`to` field, free-text destination path — no schema-level relevance check; this is a content-review discipline, not a mechanical one)
- **Source:** [Tier 1] "Don't redirect many old URLs to one irrelevant single URL destination, such as the home page of the new site" — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes. [Tier 3] Corroborated by a named case study showing Google's soft-404 classifier triggers on redirects to less-relevant pages — Glenn Gabe, GSQi, "Proof That 301 Redirects To Less-Relevant Pages Are Seen As Soft 404s To Google."
- **Tools:** No tool surveyed in `tool-scoring.md` publishes a "redirect destination is topically irrelevant" check by name; Search Console's Page Indexing report's "soft 404" flag is the closest downstream signal, surfacing well after the redirect map has already shipped.
- **Anti-patterns:** The "just redirect everything to the homepage, it's better than a 404" reflex — per Google's own guidance this is worse than doing nothing correctly; it can be reclassified as a soft 404, forfeiting the redirect's signal-passing function entirely while still looking, superficially, like a "working" redirect.
- **CleanStart:** N/A

  The CleanStart evidence for this domain (12/13 legacy URLs, MIG-01) is a bare 404 with no redirect target at all, not a homepage-funneled redirect. This rule's specific anti-pattern is not currently present anywhere in the live redirect map, but neither is a positive, mapped redirect for those 12 URLs to verify the rule's acceptance criteria against.

---

### MIG-08 — When there is no equivalent new page, return a real 404/410 — never redirect to something irrelevant to avoid a 4xx

- **Severity:** P1
- **Applies:** Always
- **Rule:** For old URLs whose content is genuinely retired with no replacement, serve an honest 404 or 410 on the new site rather than redirecting to an unrelated page.
- **Why:** Google explicitly frames 404/410 as the *correct* outcome for retired content, not a failure state to be avoided at all costs: "if you're not moving to the new site all your old content, make sure those URLs correctly return an HTTP 404 or 410 error response code." Returning anything else — a 200 soft 404, or a redirect to an unrelated page — actively confuses classification and is explicitly called out as worse.
- **Acceptance:**
  - Every retired-with-no-replacement URL returns a literal 404 or 410 status, not a 200 with "not found" body text
  - Zero retired URLs are redirected to unrelated live pages
- **Verify:** `curl -sI https://www.cleanstart.com/<retired-path> | grep -i ^HTTP` → `404` or `410`
- **Reference:** `apps/web/src/proxy.ts:147-149` (a CMS-managed row with `status: "410"` returns `new NextResponse(null, { status: 410 })` with no body); `apps/cms/src/payload/collections/Redirects.ts:77-88` (`to` field conditionally not required when `status === '410'`)
- **Source:** [Tier 1] "Provide errors for deleted or merged content... make sure those URLs correctly return an HTTP `404` or `410` error response code" — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes. [Tier 1] Soft-404 detection and its harms — https://developers.google.com/search/docs/crawling-indexing/http-network-errors.
- **Tools:** Sitebulb's "Not Found (4XX) URL in XML Sitemaps" is the closest sitemap-scoped analogue but does not cover a retired URL that was never in a sitemap to begin with.
- **Anti-patterns:** "Every 404 looks bad, so redirect it somewhere" — the opposite of Google's documented guidance. A clean 404/410 is the *correct*, low-severity outcome; a soft 404 or an irrelevant redirect is the actual defect.
- **CleanStart:** Partial

  The CMS `redirects` collection and the `proxy.ts` middleware both fully support a genuine `410` row — the `to` field is not required when `status === '410'`, and the middleware returns a bodyless `410` for it. The mechanism is correctly built. But per MIG-01/`ARCH-01`, 12 of the 13 documented legacy URLs have no row of any kind — they fall through to the framework's default not-found handling and return a bare `404`, not a deliberately-chosen `410`. Where a legacy URL genuinely has no modern equivalent, this rule's own guidance argues for a `410` row over either a homepage redirect (MIG-07) or the current do-nothing state — `410` is a stronger "this is confirmed, permanently gone" signal than a generic `404`, and CleanStart's own redirect schema already makes it a one-field choice to add.

---

### MIG-09 — Keep every migration redirect live for at least a year, tracked against a dated cutover log

- **Severity:** P1
- **Applies:** Always, for the duration following any permanent URL change
- **Rule:** Maintain 301/308 redirects for a minimum of one year after a permanent site or URL move, longer if analytics still show inbound traffic hitting the old URLs. Do not remove a redirect early because rankings appear to have recovered — ranking recovery and redirect retention are two separately-documented, differently-numbered clocks, and only the retention clock governs removal.
- **Why:** Google does not process a redirect once and forget it — the indexing pipeline needs repeated recrawls of the old URL over time to fully migrate signals, and any external link, bookmark, or stale SERP entry that still points at the old URL depends on the redirect existing at fetch time indefinitely. "Keep the redirects for as long as possible, generally at least 1 year. This timeframe allows Google to transfer all signals to the new URLs." Google's Change of Address tool independently forwards signals for a documented 180-day window — that is the tool-specific window, not the general redirect-retention floor, and neither number authorizes removing redirects at the earlier mark.
- **Acceptance:**
  - No 301/308 rule created for a migration is deleted before 365 days elapse from the documented cutover date
  - Any rule with age < 365 days is cross-checked against traffic/server logs; old-path hit volume > 0 in the trailing 30 days blocks removal regardless of age
  - A migration is not treated as "safe to clean up" merely because the ranking-recovery window (MIG-11) has passed
- **Verify:** `node scripts/seo-sop/check-redirect-retention.mjs` *(to be authored — diffs the live CMS `redirects` table against a dated migration/cutover log and flags any row older than 365 days with zero recent hits, or any removal proposed before that floor)*
- **Reference:** `apps/cms/src/payload/collections/Redirects.ts:118-131` (`hitCount`/`lastHitAt` fields, incremented via `POST /api/redirects/record-hit` on every matched request) — the mechanism exists to answer "is this still being hit," but no dated cutover log or retention-floor check currently consumes it
- **Source:** [Tier 1] "Keep the redirects for as long as possible, generally at least 1 year. This timeframe allows Google to transfer all signals to the new URLs." — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes.
- **Tools:** Not applicable — no tool surveyed in `tool-scoring.md` tracks redirect age against a migration date; this requires a dated log this SOP's own tooling does not yet have (see `Verify`).
- **Anti-patterns:** Treating "SEO migrations settle in 4-12 weeks" (MIG-11's real, separately-documented ranking-recovery timeline) as license to remove redirects at the same 3-month mark. Rankings settling and external links/bookmarks still resolving are two different clocks; only the latter governs redirect removal. This is one of two flagged myths in this domain — see MIG-12 for the other (link-equity percentage).
- **CleanStart:** Unverified — `hitCount`/`lastHitAt` exist on every redirect row, but no dated cutover log exists to check any row's age against the 365-day floor, and the script this rule's `Verify` field names does not yet exist

---

### MIG-10 — Explicitly set the permanence flag on every Next.js/Vercel redirect; both map "permanent" to 308, not 301

- **Severity:** P1
- **Applies:** Always, for any migration redirect implemented in `next.config.ts`, `vercel.json`, or equivalent middleware
- **Rule:** When implementing a migration redirect in Next.js or on Vercel, explicitly set the `permanent` flag rather than accepting a framework default, and understand that both platforms map `permanent: true` to HTTP 308 (not the classically-taught 301) and `permanent: false` to 307 (not 302).
- **Why:** Next.js documents why it chose 307/308 over 301/302: some browsers historically rewrote a redirected POST into a GET on 301/302, so Next.js uses 307/308 specifically "to explicitly preserve the request method used" — matching RFC 9110's method-preservation contract (MIG-05). Vercel's `vercel.json` `redirects` follows the identical `permanent` → 308/307 mapping. Both platforms resolve redirects before the filesystem/pages resolve; Next.js additionally warns that Pages Router redirects do not apply to client-side navigation (`Link`, `router.push`) — a purely server-config redirect will not stop a client-side route transition from bypassing it.
- **Acceptance:**
  - Every redirect config entry has `permanent` explicitly set, matching the migration's actual permanence intent — never left to default
  - `curl -sI` on each production URL confirms 308 (permanent) vs. 307 (temporary) matches intent
- **Verify:** `grep -B2 -A2 "destination:" apps/web/next.config.ts | grep -c "permanent: true"`
- **Reference:** `apps/web/next.config.ts:64-99` (all four `redirects()` rules set `permanent: true` explicitly, no bare default relied on); `apps/web/src/proxy.ts:97,104,110,131` (every hardcoded middleware redirect passes the literal `308` to `NextResponse.redirect`, never an implicit default)
- **Source:** [Tier 2] 308/307 mapping and method-preservation rationale — https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects, Next.js Docs. [Tier 2] Vercel's identical `permanent` → 308/307 mapping — https://vercel.com/docs/routing/redirects/configuration-redirects, Vercel Docs.
- **Tools:** Not applicable — no surveyed tool distinguishes 301 vs. 308 as a scored issue; both are read as "permanent redirect" by Ahrefs/Screaming Frog/Semrush alike, so a diff against expected status codes has to be done by hand or by the `grep`/`curl` pair in `Verify`.
- **Anti-patterns:** Assuming a Next.js/Vercel "permanent" redirect returns 301 because that's the classically-taught SEO status code — it returns 308, functionally equivalent for Google's indexing purposes but a surprise to anyone diffing raw HTTP status codes against a 301 expectation.
- **CleanStart:** Pass

  Every framework-level redirect in this codebase — the four `next.config.ts` rules and every hardcoded rule in `proxy.ts` (apex, trailing-slash, lowercase, legacy-param, section-index) — is an explicit, literal `308`, never a bare `permanent: true`/`false` left to silently resolve to a status code nobody checked. The CMS-managed layer casts an editor's own `status` selection straight through (`proxy.ts:150-158`) rather than reinterpreting it.

---

## P2 — meaningful improvement, non-urgent

### MIG-11 — Communicate ranking recovery as weeks-to-months, a range, not a guarantee — and never confuse it with the redirect-retention clock

- **Severity:** P2
- **Applies:** Always, when setting stakeholder expectations after a migration
- **Rule:** Communicate migration ranking-recovery expectations as "typically a few weeks to a few months for a well-executed migration on a small-to-medium site, longer for larger sites." Do not flag a migration as "failed" before that window has fully elapsed, and do not treat an early apparent recovery as license to remove redirects ahead of the MIG-09 floor.
- **Why:** Google's own general guidance: "a small to medium-sized website can take a few weeks for most pages to move, and larger sites take longer," dependent on URL count and server/crawl speed. This describes indexing-pipeline processing time (Google finding, following, and re-indexing under the new URL) — necessarily shorter than, and a wholly separate clock from, the full one-year-plus redirect-retention window in MIG-09, because processing typically completes well before the redirect is finally retired.
- **Acceptance:**
  - A migration is not escalated as "the redirects aren't working" before the documented multi-week-to-multi-month window has elapsed for a site of comparable size
  - Redirects are not removed just because rankings appear to have recovered early — MIG-09 still governs retention independent of this window
- **Verify:** Track Search Console's Page Indexing/Index Coverage report and the Performance report's impressions-by-page-group weekly from the cutover date; do not escalate as an incident until elapsed time exceeds the documented range for the site's size
- **Reference:** None — no reference implementation; this is a reporting/escalation-discipline rule, not a code path
- **Source:** [Tier 1] "a small to medium-sized website can take a few weeks for most pages to move, and larger sites take longer" — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes.
- **Tools:** Not applicable — this governs internal reporting cadence, not a tool-scored defect.
- **Anti-patterns:** Declaring a migration a failure at week 2 because rankings haven't fully recovered, or conversely using an early apparent recovery to justify pulling redirects at 90 days instead of the documented 1-year floor (MIG-09).
- **CleanStart:** N/A

  No live migration is currently mid-recovery-window. The 12 legacy 404s (MIG-01) predate any redirect being live at all, so there is no recovery clock running to report against.

---

### MIG-12 — There is no fixed "percentage of link equity lost" through a redirect — never state one

- **Severity:** P2
- **Applies:** Always
- **Rule:** Never write or repeat a specific "redirects lose X% of link value" figure in any audit, proposal, or internal SOP. Google's current position is that 301/302/307 redirects pass signals without a documented fixed dilution rate — with real, named qualifications that a flat percentage does not capture.
- **Why:** The "PageRank loss on redirect" percentage commonly cited as "roughly 15%" (a 2013 Matt Cutts statement) was superseded by Google's own later, more precise position: in 2016 Gary Illyes stated 301, 302, and 307 redirects are all treated equivalently for PageRank flow, and Google has repeated since that there is no fixed dilution. The real, documented qualifications instead are: redirect chains lose more than single hops (MIG-06), signal transfer is not instantaneous (MIG-09, MIG-11), and topical relevance between old and new content affects how much of the old URL's signal is judged applicable to the new one (MIG-07's soft-404 mechanism is the sharp edge of this).
- **Acceptance:**
  - Any internal document, ticket, or client-facing report is a **fail** if it states a specific percentage of "link juice" or ranking value lost per redirect hop
  - It is a **pass** if it instead cites the qualitative factors (chain length, relevance, time-to-recrawl) that Google does document
- **Verify:** `grep -riE '[0-9]+%.*(link (juice|equity)|pagerank)' docs/`
- **Reference:** None — no reference implementation
- **Source:** Google's no-fixed-dilution position as reported, citing Gary Illyes (2016) — Search Engine Land (trade-press report of a Tier 1 spokesperson statement; the original primary post could not be independently re-verified at a stable URL in this research pass). Corroborating documented qualitative mechanisms (chain length, relevance, timing) are [Tier 1] — see MIG-06, MIG-07, MIG-09.
- **Tools:** Not applicable — no tool scores documentation wording; this is an internal-writing discipline check, not a live-site defect.
- **Anti-patterns:** A migration audit or proposal that states "301s pass ~85-99% (or lose ~15%) of link equity" as if this were current, Google-confirmed fact — it is a 2013-era framing Google itself has since moved away from. This is the first of two flagged myths in this domain; see MIG-09's anti-pattern for the second (fixed-month redirect removal).
- **CleanStart:** Pass

  `grep -riE '[0-9]+%.*(link (juice|equity)|pagerank)'` against `docs/` in this repository returns no match — no internal document currently repeats the retracted percentage-loss figure.

---

### MIG-13 — Use the Change of Address tool only for full domain-to-domain moves, as a signal accelerator on top of 301s already live — never as a substitute for them

- **Severity:** P2
- **Applies:** Any full domain-to-domain or subdomain-to-subdomain move where both old and new sites are verified Search Console properties under the same account
- **Rule:** Use Search Console's Change of Address tool only for a whole-domain (or whole-subdomain) move — never as a substitute for implementing the underlying 301s, and never for path-level restructuring, an HTTP→HTTPS transition, or a www/non-www switch.
- **Why:** The tool requires 301 redirects to already be in place as a prerequisite, then tells Google to prioritize crawling the new site and prefer it in canonical determinations, forwarding "site signals" for a documented 180-day window. It explicitly does not apply to HTTP→HTTPS transitions (Google handles those automatically without the tool), same-domain path restructuring, or www/non-www switches (those need canonicalization/redirects only). A 2026-06-17 documentation update added explicit guidance to run the tool for every subdomain variant (www and non-www) of a domain migration, since partial variant coverage was previously a common gap.
- **Acceptance:**
  - For a qualifying domain-level move, the Change of Address tool is submitted for every verified subdomain variant, only after the underlying 301s are confirmed live — not before, and not as a replacement for them
- **Verify:** In Search Console, Settings → Change of Address, confirm status shows the migration accepted for each subdomain variant; separately verify (per MIG-01's `curl` loop) that the prerequisite 301s were live before submission
- **Reference:** None — no reference implementation; this is a Search Console operator action, not a code path
- **Source:** [Tier 1] Tool scope, prerequisites, and 180-day signal window — https://support.google.com/webmasters/answer/9370220, Google Search Console Help. 2026-06-17 subdomain-variant guidance update, reported by ppc.land citing the Google Search Central documentation revision (the underlying Google doc revision itself is [Tier 1]; the specific changelog framing is only available via this secondary report in this research pass).
- **Tools:** Not applicable — this is a Search Console operator workflow, not a crawl-scored issue.
- **Anti-patterns:** Running Change of Address instead of implementing 301s ("the tool will handle it"), or running it for a same-domain path restructure or an HTTP→HTTPS cutover where Google's own docs say the tool doesn't apply.
- **CleanStart:** N/A

  `www.cleanstart.com` has been the production domain since the 2026-06-19 DNS cutover with no subsequent domain-to-domain move. `staging.cleanstart.com`'s 2026-07-29 DNS deletion was a retirement of a non-production QA domain, not a Search Console-tracked site move, so this tool has no applicable use case today.

---

### MIG-14 — Bing needs the same 301s as Google plus its own Site Move notification, and the notification is a one-shot action for six months

- **Severity:** P2
- **Applies:** Any migration where Bing organic traffic matters
- **Rule:** Implement the same permanent 301 redirects for Bing as for Google, then separately notify Bing via Bing Webmaster Tools' Site Move tool once the redirects are confirmed live — and treat that submission as a one-shot action that cannot be repeated for six months.
- **Why:** Bing's Site Move tool "does not replace the need for permanent redirection of your site and all pages that are moving to a new location using HTTP Status 301" — it is a notification/acceleration layer on top of already-implemented redirects, available for both same-site path restructuring and cross-domain moves. Once submitted, a second move request cannot be issued for six months, so a drawn-out migration cannot use repeated resubmission to speed things up mid-flight.
- **Acceptance:**
  - Bing Site Move submission occurs only after 301s are confirmed live (the same precondition as MIG-13's Google tool)
  - The submission is not resubmitted within six months of a prior submission for the same site
- **Verify:** Bing Webmaster Tools → Diagnostics & Tools → Site Move — confirm submission timestamp and that 301s were already returning correctly (via `curl -I`) at time of submission
- **Reference:** None — no reference implementation; this is a Bing Webmaster Tools operator action, not a code path
- **Source:** Mixed tier — official Bing blog, but guest-authored, not first-party product documentation. "does not replace the need for permanent redirection... using HTTP Status 301," and the six-month reuse restriction — https://blogs.bing.com/webmaster/december-2020/Website-Migration-with-Bing, Bing Webmaster Blog. Corrected per `verification-log.md` correction #20: neither quoted sentence could be located verbatim on this URL in two independent re-fetches during adversarial verification — the page resolves to an 8-step guest-contributor walkthrough with no exact-match text. The underlying facts (301s still required; ~6-month resubmission cooldown) are independently corroborated by web search and are very likely true, but the citation is a guest-authored post, so the tier is downgraded from an unqualified Tier 1 pending a firmer, non-guest-authored citation. The base requirement that a permanent move needs real 301s at all is independently [Tier 1] — see MIG-03.
- **Tools:** Not applicable — this is a Bing Webmaster Tools operator workflow, not a crawl-scored issue.
- **Anti-patterns:** Assuming the Google Change of Address tool's acceptance also covers Bing, or resubmitting Bing's Site Move tool repeatedly during a drawn-out migration hoping to speed things up — the six-month lock makes a second submission mid-migration impossible by design.
- **CleanStart:** N/A

  No domain-level or path-restructuring migration requiring a Bing Site Move submission is underway; the site has been at its current `www.cleanstart.com` domain since the 2026-06-19 cutover.

---

## P3 — hygiene, marginal or speculative gain

### MIG-15 — 404 and 410 are handled almost identically by Google's mid/long-term pipeline; 410 is only marginally faster

- **Severity:** P3
- **Applies:** Always, for any URL being deliberately retired with no replacement
- **Rule:** Do not invest engineering effort choosing 410 over 404 for SEO reasons expecting a materially different outcome. Use 410 only where it is semantically true — you know for certain the resource will never return — and treat any speed difference as a minor bonus, not a requirement.
- **Why:** "All 4xx errors, except 429, are treated the same: Google crawlers inform the next processing system that the content doesn't exist," and the indexing pipeline removes a previously-indexed URL from the index on confirming the error, then gradually reduces crawl frequency to it (the same mechanism MIG-01 escalates to P0 when it happens to a URL that should have redirected instead). Google's John Mueller has separately stated 410 can be recognized and dropped "a couple of days" faster than 404 in some cases, but that in the mid-to-long term the two codes are handled the same way.
- **Acceptance:**
  - The choice of 404 vs. 410 for a given retired URL is documented as a semantic decision (certain-never-returns vs. unknown/might-return), not an SEO-speed optimization
  - No migration ticket blocks on "we haven't switched 404s to 410s yet"
- **Verify:** `curl -sI <url> | grep -i ^HTTP` confirms the intended code is served; cross-check Search Console's Page Indexing report weeks later to confirm removal, independent of which of the two codes was used
- **Reference:** `apps/cms/src/payload/collections/Redirects.ts:63-75` (the `status` field's `410` option is available as a deliberate editor choice alongside 301/302/307/308, at no additional engineering cost — this rule governs when to choose it, not whether the mechanism exists)
- **Source:** [Tier 1] "All `4xx` errors, except `429`, are treated the same" — https://developers.google.com/search/docs/crawling-indexing/http-network-errors. [Tier 4] 410-marginally-faster nuance is Mueller's stated position as reported contemporaneously by trade press — Search Engine Roundtable (secondary report of a Tier 1 spokesperson statement; no stable Google-hosted primary URL exists for this specific remark).
- **Tools:** Not applicable — no tool surveyed in `tool-scoring.md` distinguishes 404 from 410 severity; both are read as the same "not found" issue class.
- **Anti-patterns:** A migration backlog item that reads "convert all 404s to 410s for better SEO" as if this alone recovers lost signal or meaningfully accelerates recovery — Google's own documentation does not support a meaningful practical difference beyond a couple of days at the margin.
- **CleanStart:** Partial

  The `redirects` collection already makes `410` a one-field editor choice with no additional engineering cost (MIG-08's evidence). Per this rule, that low cost does not create urgency to retroactively convert existing 404s — the actual gap is the 12 legacy URLs in MIG-01 that have no row of any kind, a coverage defect, not a 404-vs-410 code-choice defect.

---

## Launch-day protocol

A migration is not "done" when the redirect map is written — it is done when the cutover, the monitoring window, and (if needed) the rollback have all been executed in the right order. This checklist is the reusable artifact: rule IDs above justify each step; this section is the sequence to actually run.

#### 1. Pre-cutover (complete before DNS/route change goes live)

```markdown
- [ ] Every old URL has a mapped destination or a deliberate 410 (MIG-07, MIG-08) — zero
      "unmapped, will figure it out later" rows
- [ ] Redirect map validated for cycles as a whole graph, not rule-by-rule (MIG-02)
- [ ] Redirect map validated for chains — every entry resolves in one hop (MIG-06)
- [ ] Every rule's status code matches its permanence intent: 301/308 for permanent,
      302/307 only for genuinely temporary (MIG-04); any endpoint accepting non-GET
      methods uses 307/308 (MIG-05)
- [ ] Framework config (`next.config.ts`, `vercel.json`, or equivalent) has `permanent`
      explicitly set on every entry — never left to default (MIG-10)
- [ ] Redirects deployed and confirmed live via `curl -sI` on a sample of old URLs —
      BEFORE traffic is cut over, not after (MIG-01's sequencing requirement)
- [ ] Dated cutover log created for the MIG-09 one-year retention clock — this is the
      log that later determines when (if ever) a given redirect rule is safe to remove
- [ ] If this is a full domain-to-domain move: Change of Address submitted for every
      subdomain variant, only after the above 301s are confirmed live (MIG-13)
- [ ] If Bing traffic matters: Bing Site Move submitted, same precondition, understood
      as a one-shot action for the next six months (MIG-14)
```

#### 2. Cutover

```markdown
- [ ] DNS/route change executes
- [ ] Immediately re-run the `curl -sI` sample from pre-cutover against production —
      confirm the same 301/308 responses are now being served from the live domain/route,
      not a cached pre-cutover state
- [ ] Confirm `/robots.txt` and `/sitemap.xml` both resolve on the new
      configuration (a migration is a common trigger for an accidental sitewide
      disallow or a stale sitemap host — see CRAWL-02, CRAWL-05 in module 01)
```

#### 3. Monitoring window (first 30 days, then through the full recovery range)

```markdown
- [ ] Daily for the first week, then weekly: sample-check the old-URL redirect map
      with `curl -sI` — a regression here (redirect quietly reverting to 404) is
      exactly MIG-01's P0 failure mode and gets same-day escalation, not a
      weekly-review mention
- [ ] Weekly: Search Console Page Indexing / Index Coverage report — track how many
      old URLs have transitioned to "Page with redirect" and how many new URLs are
      indexed
- [ ] Weekly: Performance report impressions-by-page-group — do not escalate "the
      migration failed" before the documented weeks-to-months recovery window has
      elapsed for a site of this size (MIG-11)
- [ ] Ongoing: redirect `hitCount`/`lastHitAt` (or server logs) — confirms whether
      old URLs are still receiving traffic, which is the signal that later gates
      MIG-09's retention floor, not a fixed calendar date alone
- [ ] Ongoing: watch for any redirect destination flagged as "soft 404" in Search
      Console — a signal that a redirect target was not actually relevant to its
      source (MIG-07)
```

#### 4. Rollback (if the migration itself needs to be reverted, not just a single URL fixed)

```markdown
- [ ] Rolling back a migration is itself a URL change — it goes through this same
      protocol in reverse: the "new" URLs (now being retired) need their own honest
      301/308 back to the restored old URLs, not a bare 404 (MIG-01 applies
      symmetrically to a rollback)
- [ ] Do not simply delete the forward redirects and assume traffic "goes back" —
      without a reverse redirect, every URL indexed under the interim "new" scheme
      404s the moment it's deleted
- [ ] Re-validate the combined (forward + reverse) redirect set for new cycles before
      the rollback ships (MIG-02) — a rollback redirect that points back at a still-live
      forward redirect is a self-inflicted loop
- [ ] Treat the reverse migration's own monitoring window as a fresh instance of
      step 3 above — recovery timing resets, it does not "un-elapse" from the
      original migration's clock
```
