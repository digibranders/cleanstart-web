# AEO / GEO — Evidence-Graded SOP Source Research

Research date: 2026-07-29. Scope: AI crawler behavior, `llms.txt`, Content Signals, Google AI Overviews/AI Mode, Bing Copilot, passage-level citability, entity/brand consistency, and AI-citation measurement — for the CleanStart website-build SOP.

## Source discipline used throughout this document

- **Tier 1** — AI vendor's own documentation (OpenAI, Anthropic, Perplexity, Google, Microsoft/Bing), llmstxt.org, contentsignals.org, IETF drafts.
- **Tier 2** — First-party platform docs (Search Console Help, Bing Webmaster Tools help, developer platforms) that are vendor-authored but sit one layer from the core policy page.
- **Tier 3** — Named, dated empirical study with a published methodology (academic paper, peer-reviewed venue, or a vendor report that discloses its method and sample).
- **Tier 4** — Practitioner consensus, agency blogs, aggregator "glossary" pages, vendor marketing with no disclosed methodology.

Every requirement below states its tier explicitly. Where a claim is repeated everywhere in the SEO blog ecosystem but traces to no Tier 1/2 source, it is labeled **`Convention — not vendor-confirmed`** rather than dropped.

---

## 1. AI crawlers — documented behavior, per vendor

### 1.1 The single most consequential distinction: training crawlers vs. retrieval/citation crawlers vs. user-triggered fetchers

Every major vendor that operates more than one bot now **splits training-data collection from real-time retrieval into separate, independently-blockable user-agents**. Blocking the wrong one silences you in AI answers while doing nothing to stop training, or vice versa. The three functional categories observed across vendors:

1. **Training crawlers** (bulk, scheduled, feeds model pre-training/fine-tuning) — e.g. `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `Meta-ExternalAgent`, `Bytespider`, `CCBot`.
2. **Retrieval/indexing crawlers** (bulk, scheduled, builds the index the assistant's search/citation feature draws from) — e.g. `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`.
3. **User-triggered fetchers** (fires only when a live user asks a question requiring that specific page) — e.g. `ChatGPT-User`, `Perplexity-User`, `Claude-User`, `Meta-ExternalFetcher`.

**The one place vendors materially disagree:** whether category-3 (user-triggered) fetchers honor robots.txt at all.
- OpenAI's own documentation for `ChatGPT-User` states plainly: *"Because these actions are initiated by a user, robots.txt rules may not apply."* (Tier 1, developers.openai.com/api/docs/bots)
- Perplexity's docs say the same of `Perplexity-User`: *"Since a user requested the fetch, this fetcher generally ignores robots.txt rules."* (Tier 1, docs.perplexity.ai/docs/resources/perplexity-crawlers)
- Anthropic is the outlier: its support article states all three of its bots, including `Claude-User`, *"respect 'do not crawl' signals by honoring industry standard directives in robots.txt."* (Tier 1, support.claude.com/en/articles/8896518)

This means a `Disallow: /` blanket rule blocks OpenAI's and Perplexity's user-triggered fetchers only as a matter of vendor courtesy (not guaranteed), but reliably blocks Anthropic's — the compliance guarantee is not uniform across vendors and must not be assumed.

---

### 1.2 OpenAI

**Source:** developers.openai.com/api/docs/bots — **Tier 1**.

| Bot | Purpose (vendor's own words) | Robots.txt | Consequence of blocking |
|---|---|---|---|
| `GPTBot` | "used to crawl content that may be used in training our generative AI foundation models" | Honored | Excluded from training data |
| `OAI-SearchBot` | "used to surface websites in search results in ChatGPT's search features" | Honored — "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links" | Excluded from ChatGPT search/citation answers |
| `ChatGPT-User` | fires "when users ask ChatGPT or a CustomGPT a question" and it "may visit a web page" | **Not guaranteed** — "robots.txt rules may not apply" | Limited practical effect; user-driven fetch, not bulk crawl |

- **Rule:** Distinguish `GPTBot` (training) from `OAI-SearchBot` (citation eligibility) in robots.txt; never write a single `User-agent: GPT*` wildcard rule that conflates the two.
- **Mechanism:** Each is a distinct token OpenAI's crawler infrastructure checks independently against robots.txt before the corresponding pipeline (training ingestion vs. search index) consumes the page.
- **Acceptance criterion:** `robots.txt` contains separate `User-agent: GPTBot` and `User-agent: OAI-SearchBot` blocks (or the token is absent entirely, defaulting to allow) — never a merged rule.
- **Verification:** `curl -A "GPTBot" -I https://www.cleanstart.com/robots.txt` and re-check with `-A "OAI-SearchBot"`; confirm the parsed directive differs if the site intends different policy for training vs. citation.
- **Anti-pattern:** Blocking `GPTBot` to opt out of training, then being surprised the site never appears in ChatGPT search citations — that is `OAI-SearchBot`'s job, and it is unaffected by a `GPTBot` disallow.

### 1.3 Anthropic

**Source:** support.claude.com/en/articles/8896518 — **Tier 1**.

| Bot | Purpose | Robots.txt | Consequence of blocking |
|---|---|---|---|
| `ClaudeBot` | "collecting web content that could potentially contribute to their training" | Honored | "signals that the site's future materials should be excluded from our AI model training datasets" |
| `Claude-User` | fires when "individuals ask questions to Claude" | Honored (Anthropic's stated exception to the industry pattern — see §1.1) | "may reduce your site's visibility" in user-query responses |
| `Claude-SearchBot` | "analyzes online content specifically to enhance the relevance and accuracy of search responses" | Honored | "prevents our system from indexing your content for search optimization" |

- **Rule:** Do not assume Anthropic behaves like OpenAI/Perplexity on user-triggered fetches — Anthropic's own docs claim full robots.txt compliance even for `Claude-User`.
- **Verification:** `curl -A "ClaudeBot"` / `-A "Claude-User"` / `-A "Claude-SearchBot"` against robots.txt; each must resolve independently.
- **Anti-pattern:** Treating "block all Claude bots" as one line — a fourth token, `claude-code`, exists for the Claude Code CLI and is unrelated to web content policy; do not conflate it with the three content bots above.

### 1.4 Perplexity

**Source:** docs.perplexity.ai/docs/resources/perplexity-crawlers — **Tier 1**.

| Bot | Purpose | Robots.txt | Consequence of blocking |
|---|---|---|---|
| `PerplexityBot` | "designed to surface and link websites in search results on Perplexity. It is not used to crawl content for AI foundation models." | Honored | "Sites won't appear in Perplexity search results" |
| `Perplexity-User` | fires when "users ask Perplexity a question" | Not honored ("generally ignores robots.txt rules") | Practically unblockable via robots.txt alone |

- Perplexity's own documentation is explicit that `PerplexityBot` is *not* a training crawler — it states this directly, which is a rare vendor statement disambiguating retrieval from training in a single sentence.
- **Verification:** IP allowlisting is documented at perplexity.com/perplexitybot.json and perplexity.com/perplexity-user.json (Tier 1) — use these, not user-agent string matching alone, for server-level enforcement, since UA strings can be spoofed.
- **Anti-pattern:** Relying on robots.txt alone to stop `Perplexity-User` traffic; per Perplexity's own docs this fetcher generally does not respect it, so network-level blocking is the only mechanism with a testable effect.

### 1.5 Google — Google-Extended

**Source:** developers.google.com/search/docs/crawling-indexing/google-common-crawlers — **Tier 1**.

- **Mechanism (important and widely misreported):** `Google-Extended` is **not a separate crawler with its own HTTP user-agent** — vendor docs state: *"Google-Extended doesn't have a separate HTTP request user agent string. Crawling is done with existing Google user agent strings; the robots.txt user-agent token is used in a control capacity."* It is a permission token layered on top of ordinary Googlebot fetches, governing only downstream use of already-crawled content.
- **Purpose:** governs whether crawled content "may be used for training future generations of Gemini models," Gemini Apps grounding, and "Grounding with Google Search on Vertex AI."
- **Search impact:** documentation is explicit — *"Google-Extended does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search."*
- **Rule:** Add a `User-agent: Google-Extended / Disallow: /` block only to opt out of Gemini training/grounding use; this has zero effect on Search inclusion or ranking, and zero effect on standard Googlebot crawling — it does not stop Googlebot from fetching the page at all.
- **Acceptance criterion:** the token appears as its own `User-agent` stanza in robots.txt, separate from `Googlebot`.
- **Verification:** because there is no distinct UA string to curl against, verification is a static read of `robots.txt` for the `Google-Extended` token — there is no live-crawl test possible.
- **Anti-pattern:** Believing that disallowing `Google-Extended` removes a site from AI Overviews. It does not — AI Overviews draws from the standard Search index (see §3), which `Google-Extended` does not gate.

### 1.6 Apple — Applebot / Applebot-Extended

**Source:** support.apple.com/en-us/119829 — **Tier 1**.

- **Mechanism:** like `Google-Extended`, `Applebot-Extended` "does not crawl webpages itself — it is only used to determine how to use the data crawled by the Applebot user agent." It is a use-governing flag, not a fetcher.
- **Purpose:** governs use of Applebot-crawled data "to help train Apple foundation models powering generative AI features across Apple products, including Apple Intelligence, Services, and Developer Tools."
- **Search/Siri/Spotlight impact:** disallowing `Applebot-Extended` does **not** remove a page from Siri, Spotlight, or Safari surfaces — those remain governed by the base `Applebot` allow/disallow and `nosnippet`.
- **Rule:** To opt out of Apple foundation-model training while keeping Siri/Spotlight/Safari visibility, disallow `Applebot-Extended` specifically; do not touch the base `Applebot` rule.
- **Verification:** static robots.txt read for the `Applebot-Extended` token (same limitation as Google-Extended — no independent UA to curl against for this specific flag; base `Applebot` does have its own crawling UA and can be curled).
- **Anti-pattern:** Disallowing `Applebot` entirely believing it only affects AI training — this also removes the site from Siri/Spotlight/Safari search surfaces, which is a different and larger cost than the AI-training opt-out alone.

### 1.7 ByteDance — Bytespider

**Source:** no Tier 1 ByteDance documentation was found — every source describing Bytespider's purpose and robots.txt behavior is Tier 4 (bot-detection vendor glossaries: DataDome, botsights, crawlercheck, etc.). This is itself a notable finding: **ByteDance publishes no public crawler-behavior documentation comparable to OpenAI/Anthropic/Perplexity/Google/Apple.**
- **Widely reported (Tier 4, unconfirmed by ByteDance itself):** Bytespider is used to feed TikTok/Douyin/Toutiao content systems; it is widely reported to disregard robots.txt directives and to crawl at high request rates.
- **Rule:** `Convention — not vendor-confirmed`: treat any robots.txt rule for `Bytespider` as advisory only; if blocking is required, use server/WAF-level blocking (Cloudflare, NGINX, `.htaccess`), since there is no vendor commitment that robots.txt is honored.
- **Verification:** monitor server access logs for the UA substring `Bytespider`; a robots.txt disallow test (checking whether requests stop) is the only empirical way to assess compliance, since no vendor policy exists to check against.

### 1.8 Common Crawl — CCBot

**Source:** commoncrawl.org/ccbot, commoncrawl.org/faq — **Tier 1** (Common Crawl is a nonprofit that publishes its own crawler documentation, unlike ByteDance).
- **Mechanism:** "CCBot is an automated crawler, checking first the robots.txt, and if crawling is allowed, fetches pages." JavaScript is not executed; cookies are not used.
- **Relevance to AI:** CCBot itself is not an AI vendor's crawler — it builds the general-purpose Common Crawl archive, which is a widely-used *training data source* for third-party LLMs (including early GPT models, per public model cards). Blocking CCBot indirectly reduces a site's presence in datasets many labs build on, but does not correspond 1:1 to any single vendor's opt-out.
- **Verification:** `curl -A "CCBot"` against robots.txt; IP ranges published as JSON at index.commoncrawl.org/ccbot.json.
- **Anti-pattern:** Assuming blocking CCBot is equivalent to opting out of "all AI training" — it only removes the site from the Common Crawl corpus specifically, not from any vendor's proprietary crawl (GPTBot, ClaudeBot, etc., which are separate).

### 1.9 Meta

**Source:** developers.facebook.com/docs/sharing/webmasters/web-crawlers/ (returns 403 to automated checks; verified manually 2026-07-29) — **Tier 1**.

| Bot | Purpose | Robots.txt |
|---|---|---|
| `Meta-ExternalAgent` | "crawls the web for use cases such as training foundation AI models or improving products by indexing content directly" | Honored |
| `Meta-ExternalFetcher` | "fetches individual links at a user's request" to support "agentic AI capabilities" | "may bypass robots.txt rules" (user-triggered, same pattern as OpenAI/Perplexity) |

- Meta's documentation does **not** describe a separate retrieval/citation-indexing bot analogous to `OAI-SearchBot`/`Claude-SearchBot`/`PerplexityBot` — Meta AI's citation/search behavior is not documented at the same granularity as the other three labs as of this research date.
- **Anti-pattern:** Searching for a "Meta-SearchBot" equivalent and blocking the wrong token — it does not exist in Meta's current documentation; do not invent a rule for a UA string Meta has not published.

### 1.10 CCBot-adjacent gap: no Tier 1/2 source found for a documented "GEO ranking factor" from any vendor

No vendor (OpenAI, Anthropic, Google, Perplexity, Microsoft) documents a scoring or ranking algorithm specific to "GEO" as a discipline distinct from ordinary crawlability + content quality. Every specific numeric claim ("41% more citations," "identified 7 tactics") traces to independent academic/vendor studies (Tier 3, §8), not to vendor product documentation. This must not be presented in the SOP as vendor-confirmed algorithmic behavior.

---

## 2. `llms.txt` — specification and adoption (the highest-scrutiny item in this research)

**Source:** llmstxt.org — **Tier 1** (this is the spec's own canonical site, authored by Jeremy Howard, published 2024-09-03).

- **Rule (spec, not adoption):** An `/llms.txt` file, if published, must be Markdown with a mandatory H1 (site/project name) as its only required section, an optional blockquote summary, and zero-or-more further sections; an optional `/llms-full.txt` may hold the full site content as one Markdown document.
- **Mechanism:** the spec's stated rationale is that LLM context windows are too small for full sites and that HTML-to-text conversion at inference time is lossy, so a pre-curated, concise Markdown digest is offered as an alternative retrieval surface.

### Documented adoption status: **the honest answer is none of the major AI answer-engine vendors document consuming it.**

- llmstxt.org itself lists **tooling adopters** (VitePress, Docusaurus, Mintlify, a Drupal plugin, FastHTML, nbdev) — i.e., frameworks that will *generate* an `/llms.txt` file for you. It does **not** state that OpenAI, Anthropic, Google, Perplexity, or Microsoft *consume/fetch/parse* `/llms.txt` at inference or crawl time.
- Independent research corroborates this gap: **no confirmed adoption by Google, OpenAI, Anthropic, or Perplexity as of mid-2026** (Tier 4 secondary summary, but consistent with the absence of any Tier 1 statement from those four vendors — none of OpenAI's, Anthropic's, Perplexity's, or Google's own crawler/AI-features documentation fetched in this research mentions `llms.txt` at all).
- No W3C or IETF ratification exists for `llms.txt` specifically (distinct from the IETF `aipref` work in §6, which is a different, vocabulary-for-robots.txt effort with no relationship to the llms.txt Markdown-digest format).

**Verdict for the SOP: `llms.txt` must be labeled `Convention — not vendor-confirmed`.** Publishing one is low-cost and harmless (it is just a static file), and it may aid any tooling that specifically parses it, but the SOP must not claim it affects GPTBot/ClaudeBot/Gemini/Perplexity crawling, ranking, or citation behavior, because no vendor documentation says it does.

- **Acceptance criterion (if the team chooses to publish one anyway, as a no-cost hedge):** file exists at `/llms.txt`, valid Markdown, H1 matches site name, no claim in the SOP that it changes citation behavior.
- **Verification:** `curl -I https://www.cleanstart.com/llms.txt` returns 200; that is the entire verifiable surface — there is no vendor-side effect to test.

---

## 3. Content Signals (contentsignals.org)

**Source:** blog.cloudflare.com/content-signals-policy/ and contentsignals.org — **Tier 1** (Cloudflare is the originating company; contentsignals.org is the hub it stood up; announced 2025-09-24).

- **Mechanism:** a `Content-Signal:` line added inside a robots.txt `User-agent` block, expressing three post-access-use preferences beyond the binary crawl/don't-crawl decision:
  - `search` — "building a search index and providing search results ... does not include providing AI-generated search summaries"
  - `ai-input` — "inputting content into one or more AI models (e.g., retrieval augmented generation, grounding, or other real-time taking of content for generative AI search answers)"
  - `ai-train` — "training or fine-tuning AI models"
- Example: `User-agent: * / Content-Signal: search=yes, ai-train=no / Allow: /`
- **Legal vs. technical status — this is the critical distinction:** Cloudflare's own post states *"content signals express preferences; they are not technical countermeasures against scraping."* They are framed as *"express reservations of rights under Article 4 of the European Union Directive 2019/790"* (the EU's TDM opt-out mechanism) — i.e., this is a **legal signal**, not an access-control mechanism. A crawler that ignores it faces no technical block; it faces a potentially strengthened legal claim in EU jurisdictions with TDM opt-out law.
- **Who honors it:** Cloudflare's own material **does not name any AI vendor (OpenAI, Anthropic, Google, Perplexity) that has committed to reading or respecting the `Content-Signal` line.** Adoption is stated only in terms of Cloudflare's own customer base (reported at 3.8M+ domains using Cloudflare's managed robots.txt feature), not in terms of crawler-side compliance.
- Independently, Google has been reported (Tier 4, SEJ/SERoundtable-class coverage) stating the directive has no technical effect on its own crawlers — consistent with Cloudflare's own "not a technical countermeasure" framing.

**Verdict for SOP: `Convention — not vendor-confirmed` on the enforcement side.** The mechanism (robots.txt line) is real and Tier 1-documented; the claim that it changes any AI vendor's actual behavior is unconfirmed by any AI vendor. Its practical value at this date is primarily legal-positioning under EU law, not a technical opt-out guarantee.

- **Acceptance criterion:** if adopted, `Content-Signal:` line present and syntactically valid per contentsignals.org's generator output.
- **Verification:** static robots.txt read; no live behavioral test exists because no vendor has published a consumption commitment to test against.

---

## 4. IETF `aipref` working group (the actual standards-track effort — distinct from llms.txt and Content Signals)

**Source:** datatracker.ietf.org (`draft-ietf-aipref-vocab`, `draft-ietf-aipref-attach`) — **Tier 1** (adopted IETF working-group documents, not individual submissions).

- `draft-ietf-aipref-vocab` defines a vocabulary of usage categories (currently: AI model **training**, and **search** — with "search" requiring direct links and non-substantive excerpts) for expressing content-use preferences. Status: active Internet-Draft, version 06, targeting Proposed Standard, milestone August 2026 — but the document itself carries the standard IETF caveat that its contents "DO NOT REFLECT CONSENSUS of the Working Group either in whole or part," i.e., it is unfinished and non-normative today.
- `draft-ietf-aipref-attach` defines how those preferences attach to content via HTTP (an update path touching RFC 9309, the Robots Exclusion Protocol RFC). Status: **expired** as of 2025-10-28 (latest version 04), also targeting Proposed Standard, same August 2026 milestone for IESG submission.
- **Rule for the SOP:** cite the existence of this WG as evidence that AI-preference signaling is moving toward IETF standardization, but do not present either draft as a ratified standard — both are explicitly non-final, and one is currently expired.
- Separately, several **individual** (non-working-group, far less authoritative) drafts exist — `draft-car-ai-txt-wellknown` (proposes `/ai.txt` and `/ai.json`), `draft-canel-robots-ai-control`, `draft-jimenez-tbd-robotstxt-update` — these are personal submissions with no working-group adoption and should not be cited as anything more than proposals under discussion.

---

## 5. Google AI Overviews / AI Mode

**Source:** developers.google.com/search/docs/appearance/ai-features — **Tier 1**.

- **Rule:** Meet standard Google Search indexing/snippet eligibility; there is no separate AI Overviews eligibility gate.
- **Mechanism (vendor's exact words):** *"To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet, fulfilling the Search technical requirements. There are no additional technical requirements."* And explicitly: *"You don't need to create new machine readable files, AI text files, or markup to appear in these features. There's also no special schema.org structured data that you need to add."*
- **On query fan-out (AI Mode specific mechanism Google documents):** AI Mode issues multiple related searches ("query fan-out") behind a single user query, which can surface "a wider and more diverse set of helpful links" than a single classic SERP — this is the one documented mechanism difference from ordinary Search, but it is a retrieval-breadth mechanism, not a new ranking signal to target.
- **Acceptance criterion:** page is indexed, snippet-eligible, and passes standard Search Essentials — no distinct GEO checklist beyond this per Google's own docs.
- **Verification:** Search Console's **Generative AI performance report** (support.google.com/webmasters/answer/16984139 — Tier 2) shows impressions (not clicks/CTR/queries yet) broken out for AI Overviews/AI Mode/AI features in Discover, at page/country/device/date granularity, currently in staged rollout to a subset of properties.
- **Anti-pattern:** Building bespoke "AI Overview schema" or a parallel markup layer distinct from normal Search structured data — Google's own documentation explicitly disclaims any such requirement.

---

## 6. Bing Copilot

**Source:** bing.com/webmasters/help/webmaster-guidelines-30fba23a — **Tier 1 by URL**, but the page renders via client-side JS and could not be captured as raw text by this research's fetch tooling; content below is corroborated through the Search Engine Journal report on the guideline rewrite (Tier 4, but directly quoting/paraphrasing the primary page) — flagged accordingly.

- **Documented (via secondary report of primary text):** Bing's rewritten Webmaster Guidelines explicitly extend scope to "grounding results and citations" as an additional eligibility outcome alongside classic search ranking, and state Bing "respects all content owner preferences expressed through robots.txt and other supported control mechanisms."
- **Meta directive effects reported:** `NOARCHIVE` "prevents content from being used in Copilot responses and grounding results"; `NOCACHE` "limits Copilot to using only the URL, title, and snippet."
- **Machine-generated content policy shift (old → new wording per the guideline rewrite):** previously *"Machine-generated content is considered malicious ... will result in penalties"* → now *"Large-scale content generated without oversight, quality control, or editorial review often lacks usefulness, accuracy, and originality, and may be excluded from indexing."* This is a materially softer stance on AI-assisted content specifically, conditioned on editorial oversight rather than a blanket ban.
- **Measurement:** Bing Webmaster Tools ships an **AI Performance** report (blogs.bing.com/webmaster, Feb 2026 announcement — Tier 1) showing citation appearance across Copilot and Bing AI summaries; a June 2026 follow-up added intent/topic-level citation-share breakdowns and comparison views.
- **Rule for SOP:** because this primary page did not render in fetch, treat every quoted line above as **needing a manual re-verification pass** (load the URL in a real browser, confirm current wording) before being asserted as exact vendor text in the published SOP — the URL and existence of the guideline are Tier 1-confirmed, but this research could not independently verify the exact current wording server-side.
- **Verification:** `curl -A "bingbot"` against robots.txt to confirm Bingbot is unblocked (a prerequisite the guideline itself states: "If Bingbot cannot crawl, Copilot has no path to cite your pages"); manually inspect Bing Webmaster Tools' AI Performance report once verified/onboarded.

---

## 7. Passage-level citability

No Tier 1 or Tier 2 source from any vendor (OpenAI, Anthropic, Google, Perplexity, Microsoft) documents the specific algorithm or heuristic used to select and quote a passage for citation. Google's AI-features page is explicit that no special markup or passage-targeting mechanism exists on its side. This entire topic currently lives at Tier 3 (named empirical studies) at best:

- **Toronto comparative audit** (Chen, Wang, Chen, Koudas — University of Toronto; EDBT/ICDT 2026 workshop, Jan 2026; 1,516 queries across Google, GPT-4o, Claude, Perplexity, Gemini; bootstrap resampling, 10,000 iterations) — peer-reviewed workshop venue.
- **Stanford SourceCheckup** (Wu et al., Stanford; *Nature Communications*, 2025-04-16; 800 medical questions, 58,000 statement-source pairs, 7 LLMs, validated against 3 US-licensed medical experts) — top-tier peer-reviewed journal, the strongest-methodology source found in this research.
- **Salesforce Answer Engine Evaluation** (Venkit, Laban, Zhou, Mao, Wu — Salesforce AI Research; ACM FAccT 2025; 21-participant user study + open-source AEE benchmark, 8 metrics) — peer-reviewed conference.
- **Yang news-source citation audit** (Binghamton University; arXiv, July 2025; 24,000+ conversations, 366,087 citations, real AI Search Arena data) — preprint, not peer-reviewed.
- **UMD/Microsoft newspaper AI-content audit** (Russell, Karpinska, Akinode, Thai, Emi, Spero, Iyyer; arXiv Oct 2025/v4 Apr 2026; 186,000 articles, 1,500 outlets, Pangram AI-detection at ~0.001% false-positive rate) — preprint, not peer-reviewed.
- **Princeton/Georgia Tech "GEO: Generative Engine Optimization"** (Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande; arXiv 2311.09735, published as preprint Nov 2023, later ACM SIGKDD 2024 / KDD proceedings — peer-reviewed): built a "GEO-bench" simulating a two-stage pipeline (Google top-5 retrieval → GPT-3.5-turbo synthesis with citations), tested 9 optimization tactics across ~10,000 queries/9 datasets/7 domains. **This is the origin of the term "Generative Engine Optimization."** Its headline finding — adding statistics/citations lifts a "Position-Adjusted Word Count" visibility metric by up to ~40% — is real, peer-reviewed, and methodologically disclosed, but it is a **simulated pipeline against GPT-3.5-turbo circa 2023**, not a live measurement of any current production AI Overviews/ChatGPT/Perplexity/Copilot system. Every "X% more citations" claim descending from this paper in 2025–2026 marketing content should be traced back to this specific, dated, simulated experiment rather than treated as an evergreen fact about current systems.
- **Industry longitudinal tracking** (Digital Authority Partners, Profound; Nov 2025–Feb 2026 vendor reports; 1,127 URLs / 3.25B citations across 7 models; six-week three-wave tracking) — vendor-published with disclosed method but partially proprietary datasets — Tier 3 at best, treat findings (e.g., citation-retention-by-engine percentages, median time-to-first-citation ~6.8 days) as industry-reported, not vendor-confirmed or independently reproducible.

**Rule for the SOP:** Any passage-citability guidance ("front-load the answer in the first 100 words," "use a direct-answer sentence early," "statistics increase citation odds") must be sourced to one of the above named studies with its date and sample size stated, and must be labeled per its actual tier (mostly Tier 3, some preprint-only) — never presented as vendor-documented behavior, because no vendor documents this.

---

## 8. Entity and brand consistency (`sameAs`, Organization markup, knowledge-graph signals)

- **What is Tier 1-documented:** Google's Search Central developer documentation defines the `Organization` schema.org type and the `sameAs` property as a general structured-data mechanism (schema.org itself is the normative vocabulary source; Google's structured-data docs describe how Google *may* use eligible structured data for search features). Google documents specific rich-result types (e.g., `Organization` for knowledge panels) with defined required/recommended properties.
- **What is NOT Tier 1-documented:** the specific claim that `sameAs` "feeds AI Overview / ChatGPT / Perplexity entity resolution" is not stated by any AI vendor's own documentation surfaced in this research. It is a reasonable inference (LLM-based answer engines plausibly benefit from the same disambiguation signal Google's Knowledge Graph uses) but **no vendor states this directly** for AI-answer contexts specifically, only for classic Knowledge Panel/rich-result contexts.
- **Rule (Tier 1-grounded, scoped to what's actually documented):** Implement `Organization` JSON-LD with `name`, `logo`/`image`, `url`, and `sameAs` pointing to authoritative external profiles (official social accounts, Wikidata/Wikipedia if applicable) per Google's structured-data guidelines, for the documented purpose of Knowledge Panel eligibility and rich-result disambiguation.
- **Acceptance criterion:** valid `Organization` JSON-LD passes Google's Rich Results Test / Schema Markup Validator with no errors; `sameAs` URLs resolve (200) and are owned/controlled by CleanStart.
- **Verification:** Google Search Console → Enhancements report for any applicable rich-result type; manual Rich Results Test run against the live URL.
- **Anti-pattern to flag:** `Convention — not vendor-confirmed` — claiming `sameAs` improves ChatGPT/Claude/Perplexity/Gemini citation odds specifically. That extension of the practice beyond classic Google rich results is practitioner consensus (Tier 4), not vendor-documented.

---

## 9. Measuring AI citation

Documented, first-party measurement surfaces that actually exist today:

1. **Google Search Console — Generative AI performance report** (support.google.com/webmasters/answer/16984139, Tier 2/1): impressions only (no clicks/CTR/query data at this research date) for AI Overviews, AI Mode, and AI features in Discover; page/country/device/date breakdowns; staged rollout, not universally available; "newest data can be preliminary."
   - **Verification:** in GSC, filter the Performance report's new "Search appearance" / generative-AI view once the property has rollout access; export by page.
2. **Bing Webmaster Tools — AI Performance report** (blogs.bing.com/webmaster, Tier 1, Feb 2026 GA + June 2026 expansion): citation appearance across Copilot/Bing AI summaries, with intent/topic-level citation-share and comparison views added in the June 2026 update.
   - **Verification:** onboard the property in Bing Webmaster Tools; check the AI Performance tab for citation counts by page/topic.
3. **No equivalent first-party console exists from OpenAI, Anthropic, or Perplexity** as of this research date — there is no vendor-provided dashboard showing "how often ChatGPT/Claude/Perplexity cited your domain." Any tool claiming to measure this (third-party GEO/AI-visibility trackers) is inferring citation frequency by **running sampled prompts against the assistants and logging which domains appear** — a Tier 4 methodology (proprietary prompt sets, no disclosed sampling frame) unless the specific tool publishes its query set and sampling method, in which case it should be individually assessed and cited as Tier 3.
- **Rule for SOP:** measurement claims about "AI visibility share" from third-party SaaS tools must be treated as Tier 4 unless the tool discloses its exact prompt corpus and sampling methodology; GSC and Bing Webmaster Tools are the only two Tier 1/2 first-party measurement surfaces, and both are impressions-only, page-level, with no query-level detail yet.

---

## 10. Summary table — what to flag explicitly in the SOP

| Practice | Tier of best available support | SOP label |
|---|---|---|
| Splitting training vs. retrieval crawler rules in robots.txt (GPTBot vs OAI-SearchBot, ClaudeBot vs Claude-SearchBot, etc.) | 1 | Vendor-confirmed rule |
| `ChatGPT-User`/`Perplexity-User` may ignore robots.txt; `Claude-User` claims full compliance | 1 | Vendor-confirmed, vendor-divergent — do not generalize across vendors |
| `Google-Extended`/`Applebot-Extended` are use-governing flags on existing crawls, not separate fetchers | 1 | Vendor-confirmed |
| `Google-Extended` has zero effect on Search ranking/inclusion | 1 | Vendor-confirmed |
| Bytespider ignores robots.txt / needs WAF-level blocking | 4 (no ByteDance Tier 1 doc exists at all) | Convention — not vendor-confirmed |
| Publishing `/llms.txt` improves AI citation/crawling | none (spec exists at Tier 1; consumption by any answer engine is unconfirmed) | **Convention — not vendor-confirmed** |
| Content Signals `Content-Signal:` line is technically enforced by AI vendors | none (Cloudflare's own docs say it is a legal signal, "not a technical countermeasure") | **Convention — not vendor-confirmed** on enforcement; Tier 1 on mechanism/existence |
| IETF `aipref` vocabulary is a ratified standard | none — both WG drafts are non-final; `-attach` is currently expired | Do not present as ratified |
| AI Overviews/AI Mode eligibility requires special markup or a distinct SEO checklist | contradicted by Tier 1 (Google explicitly says no) | **Anti-pattern — actively wrong per vendor docs** |
| Front-loading direct answers / adding statistics increases AI-citation odds | 3 (Princeton/Georgia Tech GEO-bench, simulated GPT-3.5 pipeline, 2023) | Tier 3, dated, simulated — not a live-system guarantee |
| `sameAs`/Organization schema improves ChatGPT/Perplexity/Gemini citation specifically (vs. classic Google rich results) | none for the AI-answer-specific claim | Convention — not vendor-confirmed |
| GSC Generative AI performance report / Bing AI Performance report as measurement | 1/2 | Vendor-confirmed, but impressions-only, staged rollout, no query-level data |
| Third-party "AI visibility tracker" citation-share percentages | 3 at best, usually 4 | Disclose methodology or downgrade to Tier 4 |

---

## Primary source list (for citation verification)

- https://developers.openai.com/api/docs/bots — Tier 1
- https://support.claude.com/en/articles/8896518 — Tier 1
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers — Tier 1
- https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers — Tier 1
- https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers — Tier 1
- https://support.apple.com/en-us/119829 — Tier 1
- https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/ (returns 403 to automated checks; verified manually 2026-07-29) — Tier 1
- https://commoncrawl.org/ccbot — Tier 1
- https://commoncrawl.org/faq — Tier 1
- https://llmstxt.org/ — Tier 1
- https://contentsignals.org/ — Tier 1
- https://blog.cloudflare.com/content-signals-policy/ — Tier 1
- https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/ — Tier 1
- https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/ — Tier 1
- https://developers.google.com/search/docs/appearance/ai-features — Tier 1
- https://support.google.com/webmasters/answer/16984139?hl=en — Tier 2
- https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a — Tier 1 (URL confirmed; exact current wording needs manual re-verification, see §6)
- https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview — Tier 1
- https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare — Tier 1
- https://arxiv.org/abs/2311.09735 (GEO: Generative Engine Optimization) — Tier 3
- https://www.nature.com/articles/s41467-025-58551-6 (Wu, Wu, Wei, Zhang, Casasola, Nguyen, Riantawan, Shi, Ho, Zou — "An automated framework for assessing how well LLMs cite relevant medical references," Stanford SourceCheckup, *Nature Communications* 16, 3615, 2025-04-16; DOI 10.1038/s41467-025-58551-6) — Tier 3, verified 200 (2026-07-29; original placeholder `nature.com/articles/` was a truncated index URL, not a citable article)
- EDBT/ICDT 2026 workshop proceedings (Toronto comparative audit, Chen/Wang/Chen/Koudas) — Tier 3
- ACM FAccT 2025 (Salesforce Answer Engine Evaluation, Venkit et al.) — Tier 3
