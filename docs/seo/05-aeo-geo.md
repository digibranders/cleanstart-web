# AEO / GEO

**Module:** 05 — AEO / GEO
**Prefix:** `GEO`
**Review cadence:** Quarterly (`00-index.md` §9) — AI-crawler policy and answer-engine behavior move faster than any other domain in this SOP; a semi-annual cadence would leave this module stale for most of the year.
**Scope:** AI crawler access policy (training vs. retrieval vs. user-triggered fetchers, per vendor), `llms.txt`, Content Signals, the IETF `aipref` effort, Google AI Overviews/AI Mode eligibility, passage-level citability, entity/brand consistency (`sameAs`/Organization graph), CleanStart's own markdown-negotiation and agent-discovery mechanisms, and AI-citation measurement.
**Evidence base:** `docs/seo/evidence/sources/geo.md` (19 researched sections); `docs/seo/evidence/verification-log.md` (both Geo corrections applied below — #12 in GEO-03, #13 in GEO-02); `docs/seo/evidence/codebase-inventory.md` ("AEO / GEO" section); `docs/seo/evidence/live-capture.json` (`control:llms-txt` row plus the home-page and `/email-signatures` header captures); direct live re-verification against `https://www.cleanstart.com` on 2026-07-29 (`curl` against `/robots.txt`, `/llms.txt`, `/.well-known/api-catalog`, and `/about-us` with `Accept: text/markdown`).

## This is the highest-folklore domain in this SOP

More confident, unsourced advice is published about "GEO"/"AI SEO" than about any other topic this SOP covers, and the research and adversarial-verification passes behind this module specifically went looking for vendor confirmation of the practices that circulate most widely — and mostly didn't find it. Three claims recur constantly in agency content and fail every time a verifier tries to find the vendor statement behind them: that `llms.txt` is consumed by any AI vendor's crawler, that Cloudflare's `Content-Signal:` line is technically enforced by any AI vendor, and that entity/`sameAs` markup improves ChatGPT/Claude/Perplexity citation odds specifically (as opposed to classic Google rich results, which is genuinely documented). None of the three is dismissed here — each is retained, because publishing the artifact is low-cost and the underlying mechanism is real — but each is labeled `Convention — not vendor-confirmed` and none is allowed to imply a vendor commitment that does not exist. Where this module states a rule with real vendor backing, it says so and names the vendor's own words; where it states an industry convention, it says that instead and hedges its own confidence accordingly. Holding this line is the point of the module, not a caveat on it.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### GEO-01 — Never conflate a training crawler with its vendor's retrieval/citation crawler

- **Severity:** P1
- **Applies:** Any robots.txt policy decision naming a specific AI vendor's crawler by user-agent token
- **Rule:** Treat every major AI vendor's crawlers as split into up to three functionally independent categories — training (bulk, scheduled, feeds model pre-training), retrieval/citation-indexing (bulk, scheduled, builds the index an assistant's search/citation feature draws from), and user-triggered (fires only when a live user's question requires that specific page) — and never write a single merged rule (e.g. a `User-agent: GPT*` wildcard) that blocks or allows more than one category at once.
- **Why:** Every vendor operating more than one bot now publishes them as separate, independently blockable user-agent tokens specifically so training opt-out and citation-index opt-out can be decided independently. Blocking the training bot to opt out of model training does nothing to the retrieval bot's citation index, and vice versa — a team that blocks the wrong one gets the opposite of the outcome it intended and often does not notice, because both "successes" look identical from the outside (the site just doesn't show up in that vendor's AI answers, or its content shows up despite an opt-out attempt).
- **Acceptance:**
  - Any robots.txt rule targeting a named AI vendor crawler names the specific token (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, etc.), never a wildcard spanning multiple tokens from the same vendor
  - Internal documentation of the site's AI-crawler policy states, per vendor, which category each named token belongs to — training, retrieval, or user-triggered — not just "allowed" or "blocked"
  - Documentation does not assume uniform robots.txt compliance for user-triggered fetchers across vendors — see the per-vendor table below; OpenAI's and Perplexity's user-triggered fetchers may ignore robots.txt entirely, while Anthropic's `Claude-User` is the stated exception and honors it
- **Verify:** `curl -A "GPTBot" -I https://www.cleanstart.com/robots.txt; curl -A "OAI-SearchBot" -I https://www.cleanstart.com/robots.txt` — confirm the parsed directive is identical only if the site genuinely intends the same policy for both
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61` (no per-bot tokens exist in code today — see Evidence)
- **Source:** [Tier 1] https://developers.openai.com/api/docs/bots (`GPTBot`/`OAI-SearchBot`/`ChatGPT-User`); https://support.claude.com/en/articles/8896518 (`ClaudeBot`/`Claude-SearchBot`/`Claude-User`); https://docs.perplexity.ai/docs/resources/perplexity-crawlers (`PerplexityBot`/`Perplexity-User`) — all three fetched and verified verbatim in `verification-log.md`'s per-domain Geo table (§1.1–1.4, all "upheld")
- **Tools:** Not documented as a distinct issue by any tool in `tool-scoring.md` — no surveyed crawler/SEO tool flags "merged training/retrieval robots.txt rule" as its own issue class; this rule exists because the failure is invisible to tooling and only visible in AI-answer visibility (or training-corpus presence) months later.
- **Anti-patterns:** Blocking `GPTBot` to opt out of training, then being surprised the site never appears in ChatGPT search citations — that is `OAI-SearchBot`'s job and is unaffected by a `GPTBot` disallow. Writing "block all Claude bots" as one line — a fourth token, `claude-code` (the Claude Code CLI), is unrelated to web-content policy and must not be conflated with the three content bots. Assuming a `Disallow: /` blanket rule reliably blocks every vendor's user-triggered fetcher — it reliably blocks Anthropic's `Claude-User` only, per Anthropic's own compliance claim; OpenAI's and Perplexity's docs state their user-triggered fetchers may ignore robots.txt regardless.
- **Evidence:** `robots.ts:22-61` names exactly two user-agent groups — `*` (wildcard `Allow: /` plus `Content-Signal: search=yes, ai-input=yes, ai-train=yes`) and `Bytespider` (denied) — confirmed by `git grep` across `apps/web/src` and `apps/web/public` for every named token in the table below returning zero hits (`codebase-inventory.md` "Coverage" §, AEO/GEO section). This means CleanStart currently has no per-vendor rule to get wrong — every OpenAI/Anthropic/Perplexity/Google/Apple/Meta bot is covered only by the wildcard `Allow: /` group, so today's policy is uniformly permissive by construction, not by a correctly-differentiated set of per-bot rules. The risk this rule guards against is prospective: `docs/web/WEB-PRODUCTION.md:424-425` lists 15 vendor bot names as prose ("documented as comments in `robots.ts`" per its own text) with no per-bot category noted — if a future engineer reads that list and adds a merged `Disallow` rule believing all 15 names are interchangeable, this rule is what they'd violate.
- **CleanStart:** Pass

Reference table for the rule above — vendor's own words, fetched and verified verbatim per `verification-log.md` (Geo §1.1–1.9, all "upheld" except Meta, corrected per GEO-03 below):

```markdown
| Vendor    | Training bot        | Retrieval/citation bot | User-triggered fetcher | Robots.txt compliance (user-triggered)                                  |
|-----------|----------------------|-------------------------|--------------------------|---------------------------------------------------------------------------|
| OpenAI    | GPTBot               | OAI-SearchBot           | ChatGPT-User             | NOT guaranteed — "robots.txt rules may not apply" (OpenAI's own docs)     |
| Anthropic | ClaudeBot            | Claude-SearchBot        | Claude-User              | Honored — Anthropic states all three "respect... robots.txt" (the outlier)|
| Perplexity| (none named — see note) | PerplexityBot        | Perplexity-User          | NOT honored — "generally ignores robots.txt rules" (Perplexity's own docs)|
| Google    | Google-Extended (flag, not a fetcher — see GEO-04) | n/a (standard Search index feeds AI Overviews, see GEO-06) | n/a | n/a |
| Apple     | Applebot-Extended (flag, not a fetcher — see GEO-04) | n/a | n/a | n/a |
| Meta      | Meta-ExternalAgent   | Meta-WebIndexer (see GEO-03) | Meta-ExternalFetcher | "may bypass robots.txt rules" (Meta's own docs, same pattern as OpenAI/Perplexity) |
| ByteDance | Bytespider (see GEO-05) | — no Tier 1 ByteDance documentation exists for any purpose |
```

Perplexity's own documentation is explicit that `PerplexityBot` is *not* a training crawler ("It is not used to crawl content for AI foundation models") — a rare vendor statement disambiguating retrieval from training in one sentence, and the reason no separate Perplexity training-bot row exists above.

---

### GEO-02 — `max-snippet`/`nosnippet`/`max-image-preview` govern how much of a page AI Overviews and AI Mode may reuse, not just classic snippets

- **Severity:** P1
- **Applies:** Always
- **Rule:** Treat a page's `max-snippet`, `nosnippet`, and `max-image-preview` directives as governing content-reuse eligibility for Google AI Overviews and AI Mode, in addition to their original classic-snippet purpose — this is a real, dated documentation change, not a speculative extension.
- **Why:** Google updated its robots meta tag documentation (~March 2025, reaffirmed as of the page's 2026-03-24 last-updated stamp per this domain's verification pass) to state these directives apply to "all forms of search results (web search, Google Images, Discover, Assistant, AI Overviews, AI Mode)." `nosnippet` "will also prevent the content from being used as a direct input for AI Overviews and AI Mode"; `max-snippet` "will also limit how much of the content may be used as a direct input." This is one of the few genuine, vendor-documented AEO controls that exists at all — most of what circulates as "AI Overviews optimization" has no equivalent vendor backing (see GEO-06, GEO-10). Distinct from GEO-06's eligibility gate: this directive governs *how much* of an eligible page's content AI features may reuse, not *whether* the page is eligible in the first place.
- **Acceptance:**
  - A page's snippet-control directives (or their absence) are understood and documented as governing AI Overview/AI Mode content-reuse eligibility, not only blue-link snippets
  - Any internal note stating "these only affect classic snippets" is treated as stale and corrected
  - A page that should permit full AI-answer reuse does not carry an unintended `nosnippet` or restrictive `max-snippet` value
- **Verify:** `curl -sI https://www.cleanstart.com/ | grep -i x-robots-tag`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:161-177`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag (current version, states the AI Overviews/AI Mode scope directly) — corrected per `verification-log.md` correction #13: the original geo research file's "no special markup/AI text files" claim (GEO-06 below) was correct but incomplete, omitting this true, currently-live directive. Change reported contemporaneously by Search Engine Journal, March 2025. This same rule is also recorded as `CRAWL-08` in `docs/seo/01-crawl-and-index-control.md`, framed there as a crawl/index-control directive-equivalence rule; it is repeated here under its own ID because it is one of this module's few load-bearing, vendor-confirmed AEO controls and belongs in the AEO/GEO rule set on its own terms, not only as a crawl-module footnote.
- **Tools:** Not documented by any of the five tools in `tool-scoring.md` — none currently distinguish "snippet control" from "AI-reuse control" in their issue taxonomy; this is a 2025 documentation change most vendor help-articles have not yet reflected.
- **Anti-patterns:** Treating a pre-2025 description of `max-snippet`/`nosnippet` as "search snippet only" — it is now incomplete. Building a separate, bespoke "AI Overviews opt-out" mechanism when this existing directive already covers it.
- **Evidence:** Every indexable page emits `max-image-preview:large, max-snippet:-1` (unlimited reuse permitted) — confirmed live on the home page (`live-capture.json`, `home` row: `xRobotsTag: "max-image-preview:large, max-snippet:-1"`) and via `canonical.ts:170-177`, a deliberate, documented choice, not an accidental omission. Pages that are `noindex`'d don't reach this branch at all (`canonical.ts:161-166`), so the directive is correctly scoped to indexable content only.
- **CleanStart:** Pass

---

## P2 — meaningful improvement, non-urgent

### GEO-03 — Meta documents a real citation-indexing bot, `Meta-WebIndexer` — do not advise blocking or ignoring it

- **Severity:** P2
- **Applies:** Any robots.txt or internal-documentation policy decision covering Meta's crawlers
- **Rule:** Recognize `Meta-WebIndexer` as Meta's documented citation-indexing crawler, distinct from the training crawler `Meta-ExternalAgent` and the user-triggered `Meta-ExternalFetcher` — do not treat Meta as lacking a retrieval/citation-indexing bot analogous to `OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot`.
- **Why:** Meta's own developer documentation states verbatim: "The Meta-WebIndexer crawler navigates the web to improve Meta AI search result quality for users... Allowing Meta-WebIndexer in your robots.txt file helps us cite and link to your content in Meta AI's responses." No bypass-robots.txt exception is stated for it (unlike `Meta-ExternalFetcher`), implying standard compliance like the other two Meta bots.
- **Acceptance:**
  - Internal documentation naming Meta's crawlers lists three bots — `Meta-ExternalAgent` (training), `Meta-WebIndexer` (citation-indexing), `Meta-ExternalFetcher` (user-triggered) — not two
  - No robots.txt rule or internal guidance instructs blocking `Meta-WebIndexer` under the belief that doing so has no effect on Meta AI citation eligibility
- **Verify:** `curl -A "Meta-WebIndexer" -I https://www.cleanstart.com/robots.txt`
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61` (no Meta-specific token exists — covered only by the wildcard `Allow: /` group)
- **Source:** [Tier 1] https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/ (returns 403 to some automated fetch tooling but was retrieved successfully on retry by this domain's verifier — see the tool-reliability warning in `verification-log.md`'s Method Notes: "don't treat a single 403 as proof a page has no further content") — corrected per `verification-log.md` correction #12, flagged there as "the most significant finding of the review": the original geo research file stated Meta's documentation "does not describe a separate retrieval/citation-indexing bot analogous to `OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot`" and its anti-pattern line warned against inventing a rule for a nonexistent "Meta-SearchBot" token. Both statements are false against the live page; this rule corrects them.
- **Tools:** Not documented as a distinct check by any tool in `tool-scoring.md`.
- **Anti-patterns:** Searching for a "Meta-SearchBot" equivalent, failing to find that exact name, and concluding Meta has no citation-indexing crawler at all — it does, under the name `Meta-WebIndexer`, and the previous version of this module's own source research made exactly this mistake before it was caught by adversarial verification.
- **Evidence:** `robots.ts:22-61` names no Meta-specific token — `Meta-WebIndexer`, like every other named AI vendor bot, is covered only by the wildcard `Allow: /` + `Content-Signal: search=yes, ai-input=yes, ai-train=yes` group, so it is already permitted today by default, not by a correctly-informed explicit rule. `docs/web/WEB-PRODUCTION.md:424-425`'s 15-bot prose list does not include `Meta-WebIndexer` by name (it lists `Meta-ExternalAgent` only for Meta) — a second, smaller instance of the same documentation gap this rule corrects.
- **CleanStart:** Pass

---

### GEO-04 — `Google-Extended` and `Applebot-Extended` are use-governing flags on existing crawls, not separate fetchers, and have zero effect on Search/Siri/Spotlight ranking or inclusion

- **Severity:** P2
- **Applies:** Any decision to opt out of AI-model training via Google or Apple's extended tokens
- **Rule:** Understand that `Google-Extended` and `Applebot-Extended` do not crawl anything themselves — they are permission flags layered on top of ordinary `Googlebot`/`Applebot` fetches, governing only downstream training/grounding use of already-crawled content. Disallowing either flag opts out of AI-model training/grounding use only; it has no effect on standard Search inclusion, ranking, or (for Apple) Siri/Spotlight/Safari visibility, and — critically — it does not stop the base crawler from fetching the page at all.
- **Why:** Google's own documentation states plainly: "Google-Extended doesn't have a separate HTTP request user agent string. Crawling is done with existing Google user agent strings; the robots.txt user-agent token is used in a control capacity," and explicitly: "Google-Extended does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search." Apple's documentation states the same structural pattern for `Applebot-Extended`: it "does not crawl webpages itself — it is only used to determine how to use the data crawled by the Applebot user agent," and disallowing it does not remove a page from Siri, Spotlight, or Safari surfaces (those remain governed by the base `Applebot` allow/disallow and `nosnippet`).
- **Acceptance:**
  - A `Disallow: /` under `User-agent: Google-Extended` (or `Applebot-Extended`) is understood and documented as a training/grounding opt-out only, never described as removing the site from AI Overviews, Search, Siri, or Spotlight
  - If either flag is added, the base `Googlebot`/`Applebot` rule is left untouched, since disallowing the base crawler is a materially different, much larger decision (full Search/Siri/Spotlight exclusion) than disallowing the extended flag
- **Verify:** Static read of `/robots.txt` for a `Google-Extended` or `Applebot-Extended` token — there is no independent live-crawl test possible for either, since neither has its own fetcher to `curl` against
- **Reference:** `apps/web/src/lib/seo/robots.ts:22-61` (neither token is present)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers; [Tier 1] https://support.apple.com/en-us/119829
- **Tools:** Not documented as a distinct check by any of the five tools in `tool-scoring.md`.
- **Anti-patterns:** Believing that disallowing `Google-Extended` removes a site from AI Overviews — it does not; AI Overviews draws from the standard Search index (GEO-06), which `Google-Extended` does not gate. Disallowing base `Applebot` entirely while believing it only affects AI training — it also removes the site from Siri/Spotlight/Safari search surfaces, a different and larger cost than the AI-training opt-out alone.
- **Evidence:** Neither `Google-Extended` nor `Applebot-Extended` appears in `robots.ts:22-61`; CleanStart has made no AI-training opt-out decision for either vendor, consistent with the site's stated "allow all AI crawlers except Bytespider" policy (`WEB-PRODUCTION.md` §8).
- **CleanStart:** N/A

---

### GEO-05 — `Bytespider` has no vendor-documented robots.txt compliance; enforce at the firewall, not the crawl-control layer

- **Severity:** P2
- **Applies:** Any site choosing to block ByteDance's `Bytespider`
- **Rule:** Treat a robots.txt `Disallow` for `Bytespider` as symbolic, not a working control, and pair it with server- or WAF-level blocking (Cloudflare, Vercel Firewall, NGINX, `.htaccess`) as the actual enforcement mechanism.
- **Why:** No Tier 1 or Tier 2 ByteDance documentation of any kind was found describing Bytespider's purpose or robots.txt behavior — every source is Tier 4 (bot-detection vendor glossaries). This is itself notable: ByteDance publishes no public crawler-behavior documentation comparable to OpenAI, Anthropic, Perplexity, Google, or Apple. Widely reported (Tier 4, unconfirmed by ByteDance itself) is that Bytespider disregards robots.txt directives and crawls at high request rates.
- **Acceptance:**
  - A robots.txt `Disallow: /` for `Bytespider` is present as a documented-intent signal, but is not the site's only control
  - Actual enforcement happens at a layer the crawler cannot simply ignore — a firewall rule matching the `Bytespider` User-Agent string, verified to return 403/blocked
  - Server access logs are monitored for the UA substring `Bytespider` as the only empirical way to assess whether the firewall-level block is actually working, since no vendor policy exists to check compliance against
- **Verify:** `curl -A "Bytespider" -I https://www.cleanstart.com/` — expect a firewall-level 403 if the enforcement layer is active; a 200 with the symbolic robots.txt rule alone confirms the rule is present but not enforced
- **Reference:** `apps/web/src/lib/seo/robots.ts:32-34,54-55` (symbolic `Disallow: /` for `User-Agent: Bytespider`, commented as backed by a Vercel Firewall rule not present in this repository)
- **Source:** Convention — not vendor-confirmed (no Tier 1/2 ByteDance source exists for either Bytespider's behavior or robots.txt compliance)
- **Tools:** Not documented as a distinct check by any of the five tools in `tool-scoring.md`.
- **Anti-patterns:** Relying on the robots.txt `Disallow` alone and assuming Bytespider is blocked because the rule exists — per the widely-reported (if unconfirmed) behavior, it is not.
- **Evidence:** `robots.ts:32-34` documents the intended enforcement mechanism in a comment: "the disallow here is symbolic — it is backed by a Vercel Firewall rule matching on User-Agent." That Vercel Firewall rule is referenced only in `docs/web/WEB-PRODUCTION.md:112-113` ("Block requests where `User-Agent` matches `/Bytespider/i` → action: `deny` (HTTP 403)") and is not present anywhere in this repository — its live/active status cannot be confirmed from the codebase and would require Vercel project firewall dashboard/API access this pass did not have.
- **CleanStart:** Unverified — the symbolic robots.txt rule is confirmed present and correctly labeled as symbolic in code comments, but whether the documented Vercel Firewall rule is actually active in production could not be checked from this repository.

---

### GEO-06 — `llms.txt` is `Convention — not vendor-confirmed`; publish it as a low-cost hedge, never as a claimed citation lever, and keep it synced to the real route inventory

- **Severity:** P2
- **Applies:** Any decision to publish, maintain, or cite `/llms.txt`
- **Rule:** If `/llms.txt` is published, treat it strictly as a no-cost hedge with no confirmed effect on any AI vendor's crawling, ranking, or citation behavior — never claim in internal documentation, sales material, or this SOP that it changes GPTBot/ClaudeBot/Gemini/Perplexity behavior. If it exists, keep its listed links in sync with the site's actual route inventory; an `llms.txt` that has drifted from the live site is worse than no file at all, since it is the one artifact whose entire stated purpose is being an accurate, curated index.
- **Why:** This was the single highest-scrutiny claim in this domain's research and the specific target of an adversarial verification pass explicitly trying to refute it. `llmstxt.org` — the spec's own canonical site — lists only **generator tooling** (VitePress, Docusaurus, Mintlify, a Drupal plugin, FastHTML, nbdev) that produces an `/llms.txt` for a site's own docs; it does not state that OpenAI, Anthropic, Google, Perplexity, or Microsoft *consume* third-party `/llms.txt` files at crawl or inference time. No confirmed adoption by any of those four vendors exists as of this research date, and no W3C or IETF ratification exists for the format (distinct from the unrelated `aipref` effort, GEO-08). The verifier's own conclusion: "the llms.txt negative claim survives the refutation attempt intact — no correction needed," and several 2026-dated SEO/marketing blogs asserting vendor "confirmation" of consumption trace to no primary source — "exactly the kind of industry folklore this domain is full of."
- **Acceptance:**
  - `/llms.txt`, if it exists, returns `200`, is valid Markdown with an H1 matching the site name (per the spec's one mandatory element)
  - No internal document, sales deck, or this SOP claims `llms.txt` affects any AI vendor's crawling, ranking, or citation behavior
  - The file's linked URLs are checked against the live route inventory (e.g. `docs/web/WEB-PAGES.md` or the actual sitemap) on a defined cadence, and drift is treated as a real defect, not cosmetic
- **Verify:** `curl -I https://www.cleanstart.com/llms.txt` → `200`; that status check is the entire verifiable surface — there is no vendor-side effect to test
- **Reference:** `apps/web/public/llms.txt` (37 lines, Markdown site index: H1 + summary + Product Pages/Solutions by Role/Company/Resources/Legal & Trust sections)
- **Source:** [Tier 1] https://llmstxt.org/ (the spec itself, authored by Jeremy Howard, published 2024-09-03) for the format's existence and mandatory-H1 rule; consumption by any AI answer-engine vendor is labeled **Convention — not vendor-confirmed**, per `verification-log.md`'s dedicated survived-refutation entry for this exact claim
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores `llms.txt` presence, validity, or drift.
- **Anti-patterns:** Presenting `/llms.txt` in any internal or external material as evidence of "AI SEO" investment with a claimed citation benefit — no vendor documentation supports that framing. Treating the file as "set once, done" — its entire value proposition (a curated, accurate site index) is defeated by drift.
- **Evidence:** Confirmed live 2026-07-29: `https://www.cleanstart.com/llms.txt` returns `200`, `Content-Type: text/plain; charset=utf-8` (`live-capture.json`, `control:llms-txt` row). **Provenance: static, hand-authored, with no generator and no sync mechanism.** `git log --follow` on the file shows exactly one commit (`80d313f4`, "add FAQ schema support, update map visualization styles, and improve SEO metadata management") — added alongside unrelated SEO work and never touched since; no script in `apps/web/package.json` references it; the string `llms.txt` appears nowhere under `apps/web/src` — not linked from any page, layout, or sitemap, and nothing rewrites or regenerates it. No test asserts its links match the real route tree. **Confirmed drift, live-checked in this pass:** the file's "Product Pages" and top-level sections omit `/pricing`, which is a real, indexable, live route (`live-capture.json`, `static:pricing` row, `200`) — direct evidence the sync gap is not theoretical. Separately, `docs/web/WEB-PRODUCTION.md:429-430` states `llms.txt` is "**Not yet created** — add post-launch once content is stable" — false against the current repo state; the file exists, is committed, and predates that stale doc note. The same document's §8 also states "Perplexity is the only public consumer" of `llms.txt` — this contradicts this module's own Tier 1 finding above (no vendor, including Perplexity, has confirmed consumption); that claim is also stale/unsourced and should be corrected alongside the "not yet created" note.
- **CleanStart:** Partial

---

### GEO-07 — Google AI Overviews/AI Mode eligibility requires only standard Search eligibility — building bespoke markup for it is wasted effort

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not build a separate "AI Overviews checklist," bespoke schema, or a parallel markup layer distinct from normal Search structured data and snippet eligibility — Google's own documentation states there are no additional technical requirements beyond standard indexability and snippet eligibility.
- **Why:** Google's exact words: "To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet, fulfilling the Search technical requirements. There are no additional technical requirements," and explicitly: "You don't need to create new machine readable files, AI text files, or markup to appear in these features. There's also no special schema.org structured data that you need to add." The one documented mechanism difference from ordinary Search is AI Mode's "query fan-out" (issuing multiple related searches behind a single user query), which is a retrieval-breadth mechanism, not a new ranking signal to target.
- **Acceptance:**
  - A page's AI Overviews/AI Mode eligibility is treated as fully covered by CRAWL and SCHEMA modules' existing indexability/snippet/structured-data rules — no separate "AI Overviews schema" or markup layer is added
  - No engineering time is spent building an AI-Overviews-specific eligibility checklist beyond what the Search-eligibility rules already require
- **Verify:** Confirm the page is indexed, snippet-eligible (no `noindex`/`nosnippet`), and passes the standard Search Essentials rules already covered by `01-crawl-and-index-control.md` and `03-onpage-and-metadata.md` — there is no separate check to run
- **Reference:** None — no reference implementation (the rule is "do not build something," not "implement something")
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/ai-features
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores "AI Overviews eligibility" as a distinct check, consistent with there being no distinct technical gate to score.
- **Anti-patterns:** Building bespoke "AI Overview schema" or a parallel markup layer distinct from normal Search structured data — Google's own documentation explicitly disclaims any such requirement. Any vendor proposal or agency pitch for a standalone "AI Overviews optimization package" should be checked against this exact quote before being purchased.
- **Evidence:** No bespoke AI-Overviews-specific markup, file, or schema exists anywhere in `apps/web` or `apps/cms` per the AEO/GEO codebase audit — the site's structured-data surface (module 04, `packages/schema`) is a single, standard JSON-LD engine with no AI-features-specific branch.
- **CleanStart:** Pass

---

### GEO-08 — `sameAs`/Organization entity markup is vendor-confirmed for classic Knowledge Panel/rich-result disambiguation only, not specifically for AI-answer citation

- **Severity:** P2
- **Applies:** Always
- **Rule:** Implement `Organization` JSON-LD with `sameAs` pointing to authoritative external profiles for the documented purpose — Knowledge Panel eligibility and rich-result disambiguation — but never claim, in internal documentation or client-facing material, that `sameAs` specifically improves ChatGPT/Claude/Perplexity/Gemini citation odds. That extension is a reasonable inference, not a vendor-documented fact.
- **Why:** Google's Search Central documentation defines `Organization` and `sameAs` as a structured-data mechanism Google *may* use for Knowledge Panel and rich-result disambiguation — that much is Tier 1. No AI vendor's own documentation surfaced in this domain's research states that `sameAs` feeds AI-answer entity resolution specifically. It is a plausible inference (LLM-based answer engines plausibly benefit from the same disambiguation signal Google's Knowledge Graph uses) but no vendor states this directly for AI-answer contexts.
- **Acceptance:**
  - `Organization` JSON-LD is implemented per `04-structured-data.md` SCHEMA-05 (name/url/logo/`sameAs`, no property treated as mandatory beyond that set)
  - No internal or client-facing document claims `sameAs` "feeds AI Overview / ChatGPT / Perplexity entity resolution" as a vendor-confirmed fact
- **Verify:** `grep -rni "sameas" docs/ | grep -i "chatgpt\|claude\|perplexity\|gemini"` — any hit should be checked for whether it claims vendor confirmation (a defect) versus stating the Convention/inference framing correctly
- **Reference:** See `04-structured-data.md` SCHEMA-05 for the implementation (`apps/web/src/lib/seo/seo-defaults.ts` → `orgConfigFromDefaults()`, `apps/web/src/app/layout.tsx:153`) — this rule does not restate that implementation detail, only the AEO-specific claim boundary around it
- **Source:** [Tier 1] Google Search Central structured-data documentation for the classic Knowledge Panel/rich-result mechanism; the AI-answer-citation extension of the claim is labeled **Convention — not vendor-confirmed**, per `verification-log.md`'s Geo §8 entry ("upheld" as correctly hedged)
- **Tools:** Not applicable — this is a claim-scope/framing rule, not a defect any tool scores.
- **Anti-patterns:** Citing `sameAs` completeness as evidence of "GEO readiness" in a client-facing report without the Convention hedge — practitioner consensus (Tier 4) is not the same claim as vendor-documented AI-citation behavior.
- **Evidence:** No document in this repo's `docs/` tree was found claiming `sameAs` improves AI-vendor citation odds specifically as of this pass; SCHEMA-05 in `04-structured-data.md` frames the implementation correctly around the classic Knowledge Panel purpose.
- **CleanStart:** Pass

---

### GEO-09 — AI-citation measurement has exactly two first-party surfaces today, both impressions-only; treat every third-party "AI visibility" percentage as Tier 3/4 unless its methodology is disclosed

- **Severity:** P2
- **Applies:** Always
- **Rule:** Measure AI-citation visibility only through Google Search Console's Generative AI performance report and Bing Webmaster Tools' AI Performance report — the only two documented first-party surfaces that exist as of this research date. Treat any third-party "AI visibility tracker" citation-share percentage as Tier 4 unless the specific tool discloses its exact prompt corpus and sampling methodology, in which case it should be individually assessed and cited at Tier 3, never higher.
- **Why:** No equivalent first-party console exists from OpenAI, Anthropic, or Perplexity as of this research date — there is no vendor-provided dashboard showing how often ChatGPT/Claude/Perplexity cited a given domain. Any tool claiming to measure this infers citation frequency by running sampled prompts against the assistants and logging which domains appear — a Tier 4 methodology (proprietary prompt sets, undisclosed sampling frame) unless the tool publishes its query set and sampling method. GSC's Generative AI performance report is explicitly impressions-only (no clicks/CTR/query data at this research date), staged-rollout, and "newest data can be preliminary"; Bing's AI Performance report (GA February 2026, expanded June 2026) adds intent/topic-level citation-share breakdowns but is likewise a first-party, not universally available, surface.
- **Acceptance:**
  - Any reported "AI visibility share" figure states its source; a GSC/Bing first-party figure is reported as impressions, not clicks or citation counts
  - A third-party AI-visibility tool's percentage is never reported without a stated tier — Tier 3 only if that tool discloses its prompt corpus and sampling methodology, Tier 4 otherwise
- **Verify:** In GSC, check whether the property has rollout access to the "Search appearance" generative-AI view (`support.google.com/webmasters/answer/16984139`); in Bing Webmaster Tools, check the AI Performance tab for citation counts by page/topic — both require authenticated dashboard access, not a `curl`-testable endpoint
- **Reference:** None — no reference implementation in this repository (measurement/reporting infrastructure for this specific report is not yet built; see `docs/seo/evidence/field-data.md` §3 for the site's current GSC access status)
- **Source:** [Tier 1/2] https://support.google.com/webmasters/answer/16984139 (GSC Generative AI performance report); [Tier 1] https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview and the June 2026 follow-up
- **Tools:** Not applicable in the `tool-scoring.md` sense — GSC and Bing Webmaster Tools are the measurement surfaces this rule is about, not tools being scored against a defect class.
- **Anti-patterns:** Reporting a third-party "AI visibility score" to stakeholders as if it were as authoritative as a GSC/GA4 figure, with no methodology disclosure — this conflates a Tier 4 estimate with a Tier 1/2 measured figure.
- **Evidence:** `docs/seo/evidence/field-data.md` §3 confirms GSC domain-property API access is live for this site (Search Analytics + per-URL Inspection, verified 2026-07-29) via a service-account OAuth2 scope, but that capture did not check or confirm rollout access to the Generative AI performance report specifically — that report is UI-only (no public API) and in staged rollout, so its availability for this property was not directly verified in this pass. No evidence of Bing Webmaster Tools onboarding for this domain was found in the evidence set.
- **CleanStart:** Unverified — GSC domain-property access is confirmed live for standard Search Analytics, but rollout/enablement of the Generative AI performance report specifically was not checked, and no Bing Webmaster Tools access was found evidenced anywhere in this pass.

---

## P3 — hygiene, marginal or speculative gain

### GEO-10 — Content Signals (`Content-Signal:`) express a legal preference, not a technical access control — do not claim any AI vendor enforces it

- **Severity:** P3
- **Applies:** Any site publishing a `Content-Signal:` line in robots.txt
- **Rule:** Document the `Content-Signal:` directive (contentsignals.org) as a real, well-specified robots.txt extension — but never claim any AI vendor's crawler technically respects or is blocked by it. Cloudflare's own announcement states plainly that content signals "express preferences; they are not technical countermeasures against scraping," framed as reservations of rights under the EU's Digive/TDM opt-out law (Directive 2019/790 Article 4), not an access-control mechanism.
- **Why:** The mechanism (a `Content-Signal:` line inside a `User-agent` block, expressing `search`/`ai-input`/`ai-train` preferences as `yes`/`no`) is real and Tier 1-documented. But Cloudflare's own material does not name any AI vendor (OpenAI, Anthropic, Google, Perplexity) that has committed to reading or respecting the line — adoption is stated only in terms of Cloudflare's own customer base (3.8M+ domains using its managed robots.txt feature), not crawler-side compliance. Google has been independently reported (Tier 4) stating the directive has no technical effect on its own crawlers, consistent with Cloudflare's own framing.
- **Acceptance:**
  - The `Content-Signal:` line, if present, is syntactically valid per contentsignals.org's specification
  - No internal or client-facing document claims the line is technically enforced by any named AI vendor's crawler
- **Verify:** `curl -s https://www.cleanstart.com/robots.txt | grep -i content-signal`
- **Reference:** `apps/web/src/lib/seo/robots.ts:9,39` (`CONTENT_SIGNALS = "search=yes, ai-input=yes, ai-train=yes"`, a hardcoded constant with no runtime toggle)
- **Source:** [Tier 1] https://blog.cloudflare.com/content-signals-policy/ and https://contentsignals.org/ for the mechanism and existence; enforcement by any AI vendor is labeled **Convention — not vendor-confirmed**
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores `Content-Signal:` presence or enforcement, since no vendor-side effect exists to score.
- **Anti-patterns:** Presenting a `Content-Signal: ai-train=no` line as a working technical opt-out from AI training — per Cloudflare's own framing, it is a legal-positioning signal only, with no named vendor committed to honoring it.
- **Evidence:** Confirmed live 2026-07-29: `/robots.txt` emits `Content-Signal: search=yes, ai-input=yes, ai-train=yes` for `User-Agent: *`, matching the constant at `robots.ts:9` and the comment there explicitly tying the values to "the documented AI-crawler policy... allow all AI crawlers except Bytespider." The choice to set all three to `yes` is consistent with that stated policy; no code or doc claims this line is technically enforced by any vendor.
- **CleanStart:** Pass

---

### GEO-11 — The IETF `aipref` working group is an active, non-final standards effort — never cite its drafts as ratified

- **Severity:** P3
- **Applies:** Any documentation referencing `aipref`, `draft-ietf-aipref-vocab`, or `draft-ietf-aipref-attach`
- **Rule:** Cite the IETF `aipref` working group as evidence that AI-preference signaling is moving toward standardization, but never present either of its two documents as a ratified standard — both carry the standard IETF non-consensus caveat and one is currently expired.
- **Why:** `draft-ietf-aipref-vocab` (usage-category vocabulary: training, search) is an active Internet-Draft, version 06, targeting Proposed Standard with an August 2026 milestone, but its own text states its contents "DO NOT REFLECT CONSENSUS of the Working Group either in whole or part." `draft-ietf-aipref-attach` (the HTTP/RFC 9309 attachment mechanism) is **expired** as of 2025-10-28 at its latest version (04), targeting the same August 2026 milestone. Several other individual, non-working-group drafts exist (`draft-car-ai-txt-wellknown` proposing `/ai.txt`/`/ai.json`, `draft-canel-robots-ai-control`, `draft-jimenez-tbd-robotstxt-update`) with no working-group adoption and should not be cited as more than proposals under discussion.
- **Acceptance:**
  - No internal documentation states `aipref` (or any individual `/ai.txt`-style draft) is a ratified standard
  - Any reference to `aipref` names its actual status (active-but-non-consensus, or expired) rather than implying finality
- **Verify:** `grep -rni "aipref\|ai.txt\|draft-ietf" docs/ | grep -i "ratified\|standard\|RFC"` — any hit implying ratification is a defect
- **Reference:** None — no reference implementation (`apps/web/public/ai.txt` does not exist; confirmed absent, matching `docs/web/WEB-PRODUCTION.md:430`'s accurate "not yet created" note — the one `ai.txt`-adjacent claim in that document that is *not* stale, contrasted with the `llms.txt` claim in GEO-06)
- **Source:** [Tier 1] https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/; https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/ (adopted IETF working-group documents, not individual submissions)
- **Tools:** Not applicable — no tool scores standards-track currency.
- **Anti-patterns:** Describing `aipref` as "the upcoming AI robots.txt standard" without the non-consensus/expired-draft caveat — it may become that, but is not that today.
- **Evidence:** No documentation in this repo references `aipref` or any of the individual `/ai.txt`-style drafts; `apps/web/public/ai.txt` is confirmed absent from `public/` (only `.DS_Store`, `llms.txt`, an unrelated verification-token `.txt` file, and `world-110m.json` exist there).
- **CleanStart:** N/A

---

### GEO-12 — Passage-level citability guidance is Tier 3 at best — always name the specific study, its date, and its sample size, never present it as vendor-documented

- **Severity:** P3
- **Applies:** Any content-writing guidance claiming a specific technique improves AI-citation odds
- **Rule:** Any claim of the form "front-load the answer in the first N words," "use a direct-answer sentence early," or "statistics increase citation odds" must cite a specific named, dated study with its sample size and methodology, and must be labeled per its actual evidentiary tier — never presented as vendor-documented AI-system behavior, because no vendor (OpenAI, Anthropic, Google, Perplexity, Microsoft) documents the specific algorithm or heuristic used to select and quote a passage for citation.
- **Why:** This entire topic lives at Tier 3 (named empirical studies) at best. The origin of the term "Generative Engine Optimization" itself — the Princeton/Georgia Tech "GEO: Generative Engine Optimization" paper (arXiv 2311.09735, Nov 2023, later ACM SIGKDD 2024) — built a simulated two-stage pipeline (Google top-5 retrieval → GPT-3.5-turbo synthesis) and found adding statistics/citations lifts a "Position-Adjusted Word Count" visibility metric by up to ~40%. That finding is real, peer-reviewed, and methodologically disclosed, but it is a simulated pipeline against GPT-3.5-turbo circa 2023, not a live measurement of any current production AI Overviews/ChatGPT/Perplexity/Copilot system. Other named studies exist at similar or lower confidence (Stanford SourceCheckup, *Nature Communications* 2025; Salesforce Answer Engine Evaluation, ACM FAccT 2025; Toronto comparative audit, EDBT/ICDT 2026; industry longitudinal tracking from Digital Authority Partners/Profound) — each has a real, disclosed methodology and should be cited by name, not folded into an unattributed "studies show" claim.
- **Acceptance:**
  - Any passage-citability guidance in content-writing standards cites its source study by name, venue, and date
  - No such guidance is presented as "documented AI-system behavior" without the study citation and its tier label
- **Verify:** `grep -rni "front-load\|citation odds\|ai citation" docs/ | grep -v "arxiv\|nature\|acm\|sigkdd\|edbt"` — a hit with a citation claim but no traceable study name is a defect
- **Reference:** None — no reference implementation (this is a content/documentation-authoring discipline rule, not a code mechanism)
- **Source:** Convention — not vendor-confirmed (no vendor documents the passage-selection mechanism at all); the best available supporting evidence is Tier 3 named studies — https://arxiv.org/abs/2311.09735 (Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande — "GEO: Generative Engine Optimization," 2023 preprint / KDD 2024 proceedings), https://www.nature.com/articles/s41467-025-58551-6 (Stanford SourceCheckup), and the named ACM FAccT 2025 and EDBT/ICDT 2026 studies per `evidence/sources/geo.md` §7
- **Tools:** Not applicable — no tool scores content-writing citation discipline.
- **Anti-patterns:** Repeating a specific percentage ("41% more citations") descending from the 2023 Princeton/Georgia Tech simulated-pipeline study as if it were an evergreen fact about current production AI systems. Presenting any Tier 3 finding as vendor-confirmed behavior.
- **Evidence:** No content-writing guidance document in this repo's `docs/` tree makes an unattributed passage-citability claim as of this pass; this rule is preventative, not corrective, for CleanStart today.
- **CleanStart:** N/A

---

### GEO-13 — Markdown content negotiation (`Accept: text/markdown`) is a real, tested capability ahead of common practice — do not claim a citation benefit no vendor documents

- **Severity:** P3
- **Applies:** Any site implementing content negotiation for AI agents
- **Rule:** Serve a genuine, working markdown representation of HTML pages to a client that explicitly sends `Accept: text/markdown` — this is real, tested infrastructure and is ahead of common practice — but do not claim in any internal or external document that it improves AI-citation odds, ranking, or crawl frequency for any named vendor. No AI vendor's own documentation states it sends or prefers `Accept: text/markdown`, or that a markdown representation is weighted differently than HTML for retrieval or citation purposes.
- **Why:** Token-efficient, pre-converted content is a plausible efficiency win for any agent that does request it, and the mechanism mirrors Cloudflare's own "Markdown for Agents" response contract (`Content-Type: text/markdown` + a token-count header) — but "plausible efficiency win if requested" is a materially different, weaker claim than "improves citation odds," and the latter has no vendor source anywhere in this domain's research. This rule exists to keep the two claims from being conflated as the feature matures.
- **Acceptance:**
  - `Accept: text/markdown` (exact media type, `q` absent or `>0`) returns a valid markdown document with `Content-Type: text/markdown; charset=utf-8` and a token-count header; ordinary browser `Accept` headers (which end in a wildcard) never match and continue to receive HTML
  - No internal or external document claims this negotiation improves AI-citation odds, ranking, or crawl frequency for any named vendor
- **Verify:** `curl -s -H "Accept: text/markdown" -D - https://www.cleanstart.com/about-us -o /dev/null | grep -i content-type`
- **Reference:** `apps/web/src/lib/agent-markdown.ts:31-44` (`acceptsMarkdown` — exact-media-type match, `q`-value handling, `text/*`/`*/*` never match), `:75-84` (`htmlToMarkdown` — scopes to `<main>`, falls back to `<body>`), `:91-93` (`estimateMarkdownTokens`); wired in `apps/web/src/proxy.ts:164-187` (`wantsMarkdown` gate — `GET` only, excludes `/preview/` and `/api/`, checks the internal-loop-prevention header); converter route `apps/web/src/app/api/markdown/route.ts:31-89` (same-origin path validation, internal self-fetch with a 10s timeout, `Cache-Control: public, max-age=300, must-revalidate`, `Vary: Accept`)
- **Source:** Convention — not vendor-confirmed (no AI vendor documents sending or preferring `Accept: text/markdown`, or weighting a markdown representation differently for citation purposes; the mechanism itself is real, tested, working infrastructure, independent of that unconfirmed benefit claim)
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores content-negotiation infrastructure.
- **Anti-patterns:** Marketing this capability as "optimized for AI citation" — no vendor source supports that specific framing; describe it accurately as token-efficient content negotiation for any agent that requests it.
- **Evidence:** Confirmed live 2026-07-29: `curl -H "Accept: text/markdown" https://www.cleanstart.com/about-us` returns `200`, `Content-Type: text/markdown; charset=utf-8`, `x-markdown-tokens: 1175`, `Vary: Accept`, and a correctly-converted markdown body (H1 from the page `<title>`, nav/footer chrome excluded via `<main>` scoping). Test coverage: `apps/web/src/lib/agent-markdown.test.ts` (86 lines — `acceptsMarkdown`, `htmlToMarkdown`, `estimateMarkdownTokens`) and `apps/web/src/lib/seo/robots.test.ts` cover the pure functions; `proxy.ts`'s `wantsMarkdown` wiring and `api/markdown/route.ts`'s handler itself (path validation, self-fetch/timeout/error-status mapping) have no dedicated test (`codebase-inventory.md`, AEO/GEO "Tests" §). No document reviewed in this repo claims this feature improves AI-citation odds.
- **CleanStart:** Partial

---

### GEO-14 — The agent-discovery `Link` header and `.well-known/api-catalog` are RFC-compliant, but AI-vendor consumption is unconfirmed — don't overstate what they achieve

- **Severity:** P3
- **Applies:** Any site publishing machine-readable discovery hints for agents
- **Rule:** Implement agent-discovery hints (an RFC 8288 `Link` header advertising registered relations, an RFC 9727/9264 `.well-known/api-catalog` linkset body) correctly per their respective specifications, but do not claim any AI vendor's crawler or user-triggered fetcher actually reads or acts on them — no vendor documentation surfaced in this domain's research states that any AI system consumes a `Link: rel="api-catalog"` header or a `.well-known/api-catalog` linkset.
- **Why:** RFC 8288 (Link header), RFC 9727 (well-known URI registration), and RFC 9264 (linkset media type) are genuine IETF specifications — the mechanism is Tier 1-correct on its own terms. But being RFC-compliant is a claim about correctness of implementation, not a claim about any AI vendor reading it; no OpenAI, Anthropic, Perplexity, Google, or Meta documentation page fetched anywhere in this domain's research mentions consuming a site's `Link` header or `.well-known/api-catalog` file. This rule exists for the same reason GEO-06 and GEO-10 exist: to keep "we correctly implemented a real specification" from being conflated with "a named AI vendor consumes it."
- **Acceptance:**
  - The `Link` header's relations (`api-catalog`, `sitemap`, `service-desc`) resolve to real, live resources with matching declared media types
  - The static `.well-known/api-catalog` file is byte-identical to the object it is meant to mirror, enforced by a drift-guard test
  - No internal or external document claims a specific AI vendor consumes this header or file
- **Verify:** `curl -sI https://www.cleanstart.com/ | grep -i '^link:'`
- **Reference:** `apps/web/src/lib/security/agent-discovery.ts:20-88` (`API_CATALOG_PATH`, `API_CATALOG_CONTENT_TYPE`, `AGENT_DISCOVERY_LINK_HEADER`, `API_CATALOG`); appended in `apps/web/src/proxy.ts:233-241` (`response.headers.append("Link", ...)`, guarded to HTML-serving non-`/api/` paths); static mirror at `apps/web/public/.well-known/api-catalog`, Content-Type override in `apps/web/next.config.ts:45-61`
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc8288.html (Link header); RFC 9727 §3 (well-known URI); RFC 9264 (linkset media type) for the mechanism's correctness; AI-vendor consumption is labeled **Convention — not vendor-confirmed**
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores agent-discovery header presence.
- **Anti-patterns:** Presenting this infrastructure as a confirmed AI-crawler discovery mechanism in client-facing material — it is a correctly-implemented, real specification with no confirmed AI-vendor consumer, the same posture as `llms.txt` (GEO-06).
- **Evidence:** Confirmed live 2026-07-29: the home page and `/email-signatures` both emit `Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </sitemap.xml>; rel="sitemap"; type="application/xml", </api/search>; rel="service-desc"; type="application/json"` (`live-capture.json`). `.well-known/api-catalog` resolves live and its JSON body was confirmed to match the `API_CATALOG` constant it mirrors, per `agent-discovery.test.ts`'s drift guard. No document in this repo claims a named AI vendor consumes either artifact.
- **CleanStart:** Pass

---

## Related out-of-repo configuration (documented only, not verifiable from this codebase)

Two AI-crawler-adjacent controls live entirely outside this repository and are recorded here for completeness, not as separate rule IDs, since neither has a testable acceptance criterion reachable from the codebase alone:

- **Vercel Firewall rule blocking `User-Agent` matching `/Bytespider/i`** (GEO-05's enforcement layer) — documented at `docs/web/WEB-PRODUCTION.md:112-113`, referenced but not implemented in `apps/web/src/lib/seo/robots.ts:32-34`. Confirming this rule is live requires Vercel project firewall dashboard/API access this pass did not have.
- **Cloudflare "Block AI Scrapers and Crawlers" toggle**, required disabled per `docs/web/WEB-PRODUCTION.md:107-108,433` (default-on since July 2024 — would silently contradict the site's stated allow-all-AI-crawlers-except-Bytespider policy if ever left enabled). Confirming its current state requires Cloudflare dashboard access this pass did not have.
- **DNS-AID `_index._agents.cleanstart.com` HTTPS/SVCB records** (draft-mozleywilliams-dnsop-dnsaid, RFC 9460 record format) — documented as "PUBLISHED 2026-06-10" at `docs/web/WEB-PRODUCTION.md:115-126`, pointing agents at `www.cleanstart.com` where the `Link`-header discovery (GEO-14) takes over. This is an individual, non-working-group IETF draft with no ratification status — the same caveat as GEO-11 applies if it is ever cited as a standard.
