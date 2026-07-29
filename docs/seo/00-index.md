# SEO / AEO / GEO SOP — Index & Conventions

**Module:** 00 — Index & conventions
**Status:** Living reference. This module is the authoring contract for every other module in `docs/seo/`.
**Design spec:** `docs/superpowers/specs/2026-07-29-seo-aeo-geo-sop-design.md`

---

## 1. Purpose and audience

This directory is the reusable SEO/AEO/GEO Standard Operating Procedure for every website this team builds — CleanStart's own site and any future client build. It exists to solve three problems: the same SEO decisions were being re-derived from scratch on every build; no document previously stated which implementations were verified correct against a primary source versus merely conventional; and the prior CleanStart-specific documents mixed durable rule with perishable launch-week status, so they decayed the moment the launch tasks were done.

The audience is:

- **Engineers** implementing or auditing a website's SEO/AEO/GEO surface, who need an objectively testable rule and a runnable command, not prose advice.
- **SEO leads** who need to know what is a hard requirement (`P0`/`P1`, required-hard fields) versus a judgment call (`P2`/`P3`, `Convention`), and why a severity was assigned.

This SOP covers the **technical and non-content-dependent** surface only: crawlability, indexability, architecture, metadata mechanics, structured data, AI-search accessibility, performance, rendering, migrations, measurement, governance, and the SEO/accessibility overlap. It does not cover keyword research, topical strategy, editorial calendars, author programs, or per-page copy — those are per-website content decisions, not portable rules. See the design spec §3 for the full non-goals table.

## 2. How to use

Three entry points, depending on why you are here:

- **Starting a new website build.** Read this module (00) in full first — it defines every term and structure the other modules assume. Then work through the **pre-build** section of `90-operator-checklist.md`, which references rules by ID across all core modules in build order. Do not start authoring pages against a module you have not read; the checklist assumes the vocabulary defined here.
- **Auditing an existing site.** Run the **full** `90-operator-checklist.md` — pre-build through monthly/quarterly sections — recording a verdict (§7) per rule ID as you go. For CleanStart itself, verdicts and evidence live in `91-cleanstart-conformance.md`; for a different site, create an equivalent conformance report using 91 as the template.
- **Working a specific client.** Core modules (01–11) always apply. Decide which conditional modules (`C1`–`C5`, §8) apply based on the client's actual site shape — international/multi-locale, e-commerce, multi-location/local, large-scale programmatic/faceted, or news/publisher. A module that does not apply to the client is simply not consulted; it is not marked `N/A` in bulk, since individual rules within an applicable module can still be `N/A` (§7) if their own `Applicability` condition isn't met.

## 3. Rule-ID scheme

Every rule ID has the shape `<PREFIX>-<NN>` — a prefix fixed per module, and a two-digit number assigned sequentially within that prefix. Numbers are **never reused**: once `CRAWL-04` exists, no future rule — even a replacement for a deleted one — is ever assigned `CRAWL-04` again. A rule that is deprecated is not deleted from its module; it is retained with its fields intact and a status line reading `Superseded by <ID>`, so that anything referencing the old ID (an old audit, a past conformance report, an external note) still resolves to a real rule with an explanation of what replaced it.

Prefixes, reproduced from the design spec §5.2:

| Prefix | Module |
| --- | --- |
| `CRAWL` | 01 — Crawl & index control |
| `ARCH` | 02 — Site & URL architecture |
| `META` | 03 — On-page & metadata |
| `SCHEMA` | 04 — Structured data |
| `GEO` | 05 — AEO / GEO |
| `PERF` | 06 — Performance & Core Web Vitals |
| `RENDER` | 07 — Rendering & delivery |
| `MIG` | 08 — Migrations & URL change management |
| `MEAS` | 09 — Measurement |
| `GOV` | 10 — Governance & CI enforcement |
| `SEM` | 11 — Semantics & accessibility overlap |
| `INTL` | C1 — International & hreflang |
| `ECOM` | C2 — E-commerce, product schema & merchant feeds |
| `LOCAL` | C3 — Local, multi-location & NAP |
| `PROG` | C4 — Programmatic & faceted navigation at scale |
| `NEWS` | C5 — News & publisher |

## 4. Rule block format

Every rule in every core and conditional module (01–11, C1–C5) is authored in this exact shape. This is the authoring contract: `lint-rules.mjs` parses and enforces it mechanically, so deviation is a build-breaking error, not a style nit.

```markdown
### CRAWL-04 — Canonical URLs are absolute and self-referencing

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page emits exactly one `<link rel="canonical">` that is absolute, self-referencing, and byte-identical to the URL published in the XML sitemap.
- **Why:** Google consolidates duplicate signals onto the canonical it selects; a relative, cross-referencing, or sitemap-mismatched canonical hands that selection to heuristics instead of declaring it.
- **Acceptance:**
  - Exactly one `link[rel=canonical]` element in the rendered HTML
  - Absolute, `https://`, production host
  - Byte-identical to the sitemap entry (trailing slash, case, query params)
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -c 'rel="canonical"'` → `1`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:41`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- **Tools:** Screaming Frog `Canonicalised`; Ahrefs `Canonical points to redirect`; Sitebulb `Multiple canonical tags` (Critical)
- **Anti-patterns:** Building the canonical from request headers — breaks behind a proxy or CDN and emits the origin host.
- **CleanStart:** Pass
```

Field rules enforced by the linter: heading must match `### PREFIX-NN — Title`; hard-required keys are `Severity`, `Rule`, `Acceptance`, `Verify`, `Source`; `Severity ∈ {P0,P1,P2,P3}`; `Source` must contain `[Tier 1]`, `[Tier 2]`, or `Convention — not vendor-confirmed`; `CleanStart` must match the verdict vocabulary; IDs unique corpus-wide.

Two authoring constraints follow directly from how the linter parses fields, and both are load-bearing — get either wrong and a rule field is silently truncated or corrupted, which is exactly the failure mode this schema gate exists to prevent:

- **A field that wraps onto a second line must indent the continuation by two spaces.** The linter treats an indented line as a continuation of the field above it and folds it in; it treats an unindented line as the start of new prose and closes the field there, discarding whatever field content you intended to add. An unindented continuation is therefore a **lint error, by design** — not a silent truncation. If your `Why` or `Rule` text needs a second line, indent it two spaces, exactly as `Acceptance`'s sub-bullets are indented in the example above.
- **`Verify` must be a single-line inline code span** — one backtick-delimited command (or command → expected-output pair) on the `- **Verify:**` line itself. It must never be an indented fenced code block. An indented fence placed inside a rule field does not render as a code block in this context — the linter's field parser folds each fenced line into the field text as literal backtick characters, corrupting the field. If a check genuinely needs more than one command (a multi-step curl sequence, a script that greps several headers), write that check as a named script under `scripts/seo-sop/` and have `Verify` reference it by path, e.g. `` `node scripts/seo-sop/check-hreflang-matrix.mjs` ``.

## 5. Severity model

| Level | Definition | Response |
| --- | --- | --- |
| **P0** | Causes deindexing, traffic loss, or serves the wrong content to crawlers | Blocks launch; fix immediately |
| **P1** | Material organic or AI-visibility impact, no immediate loss | Fix within launch week |
| **P2** | Meaningful improvement, non-urgent | Scheduled backlog |
| **P3** | Hygiene, marginal or speculative gain | Opportunistic |

Severity is assigned from **mechanism and blast radius** — what the search or AI system actually does when the rule is violated, and how much of the site it affects — not from how urgent it feels. That assignment is then cross-checked against how the named tools (Ahrefs, Semrush, Screaming Frog, Sitebulb, Lighthouse) weight the same issue class, recorded per rule in the `Tools` field. Where this SOP's severity disagrees with a tool's default weighting, the disagreement is stated explicitly, with reasoning, in the rule's `Why` or `Anti-patterns` field — a client-side SEO lead running Ahrefs must be able to see *why* our severity differs from the tool's, not just that it does.

## 6. Evidence tiers

| Tier | What qualifies | Citable as |
| --- | --- | --- |
| **1** | Official specification or vendor documentation — Google Search Central, Schema.org, IETF RFCs, W3C/WHATWG, Bing Webmaster docs, IndexNow spec, OpenAI / Anthropic / Perplexity / Google-Extended crawler documentation, llmstxt.org, web.dev & Chrome team | Authority |
| **2** | First-party platform engineering docs — Next.js, Vercel, Payload | Authority for implementation detail |
| **3** | Large-scale empirical study with published methodology, named and dated | Supporting evidence only |
| **4** | Agency blogs, conference talks, practitioner consensus | `Industry convention` label only — never as authority |

Every rule requires **at least one Tier 1 or Tier 2 source**. A rule resting only on Tier 3/4 evidence is retained only if genuinely useful, and only under the explicit label `Convention — not vendor-confirmed` in its `Source` field — it is never presented as if it carried vendor authority.

## 7. Verdict vocabulary

Conformance verdicts (used in each rule's `CleanStart` field and in `91-cleanstart-conformance.md`) are one of exactly five values:

- **`Pass`** — verified conformant against the stated acceptance criteria.
- **`Partial`** — conformant in some but not all of the acceptance criteria, or conformant with a caveat.
- **`Fail`** — verified non-conformant.
- **`N/A`** — the rule's `Applies` condition is not met by this site (e.g., a hreflang rule on a single-locale site).
- **`Unverified — <reason>`** — verification was attempted but could not be completed, with the reason stated (e.g., `Unverified — GSC access pending`).

**Fabricating a verdict is prohibited.** If a check cannot actually be run — access wasn't granted, a tool wasn't available, a live page couldn't be captured — the correct output is `Unverified — <reason>`, never a guessed `Pass` or `Fail`. This is the single most important constraint in this SOP: a wrong verdict recorded as confident is worse than an honestly incomplete one.

## 8. Module map

**Core — always apply**

| # | Module | Scope |
| --- | --- | --- |
| 00 | Index & conventions | This document — how to use, rule-ID scheme, severity model, evidence tiers, glossary |
| 01 | Crawl & index control | robots.txt, meta robots, `X-Robots-Tag`, parameter handling, preview/staging isolation, soft-404s, crawl budget |
| 02 | Site & URL architecture | Taxonomy, route naming, depth, internal linking, breadcrumbs, orphan prevention, XML sitemaps & sitemap index |
| 03 | On-page & metadata | Title/description formulas per template with length limits, heading architecture, OG/Twitter cards, image & alt policy, canonical self-reference |
| 04 | Structured data | JSON-LD engine design, entity graph, `@id` strategy, per-template requirements, rich-result eligibility, validation gates |
| 05 | AEO / GEO | AI crawler access policy, `llms.txt`, Content Signals, passage-level citability, entity & brand consistency, `sameAs` / Organization graph, AI-citation measurement |
| 06 | Performance & Core Web Vitals | LCP / INP / CLS, field vs lab distinction, image and font policy, third-party script budget |
| 07 | Rendering & delivery | SSR/ISR/CSR consequences for indexing, JS-dependent content, caching & revalidation, HTTP status-code semantics, CDN behaviour |
| 08 | Migrations & URL change management | Redirect mapping, 301 vs 302 vs 410, launch-day protocol, monitoring window, rollback |
| 09 | Measurement | GSC / GA4 / CrUX wiring, event taxonomy, indexation monitoring, drift detection, alerting, reporting cadence |
| 10 | Governance & CI enforcement | SEO as code — tests, lint gates, publishing checklist, editor guardrails, drift tests, ownership/RACI |
| 11 | Semantics & accessibility overlap | Only where genuinely SEO-relevant; explicitly bounded to avoid becoming an a11y document |

**Conditional — invoked per client**

| # | Module | Scope |
| --- | --- | --- |
| C1 | International & hreflang | Locale/region targeting, `hreflang` matrix correctness, `x-default`, locale-specific sitemaps |
| C2 | E-commerce | Product/offer schema, merchant feeds, price/availability freshness, variant handling |
| C3 | Local | Google Business Profile signals, multi-location pages, NAP consistency, `LocalBusiness` schema |
| C4 | Programmatic & faceted | Faceted-navigation crawl control at scale, template quality floors, pagination |
| C5 | News & publisher | `NewsArticle`/`Article` schema, Google News eligibility, publish/update timestamp discipline |

Each conditional module carries the banner **"Not exercised by CleanStart — verified against primary documentation only."** — it is documentation-verified, not battle-tested against a live client of that type.

**Derived**

| # | Artifact | Scope |
| --- | --- | --- |
| 90 | Operator checklist | Lifecycle checklist (pre-build / pre-launch / launch-day / week-1 / monthly / quarterly) — rule IDs and pass criteria only, restates no rule text |
| 91 | CleanStart conformance report | Verdict + evidence per rule ID, plus a ranked, effort-estimated gap backlog |

## 9. Review cadence

| Modules | Cadence | Reason |
| --- | --- | --- |
| 01–04, 06–08 | Semi-annual | Stable mechanics — crawl control, architecture, metadata, structured data, performance, rendering, migrations — change with platform major versions, not month to month |
| 05 (AEO / GEO) | Quarterly | AI-search behaviour and AI-crawler policy change faster than any other domain in this SOP; a semi-annual cadence would leave this module stale for most of the year |
| 09 (Measurement) | On tooling change | Reviewed whenever the analytics tooling itself changes (GA4 property migration, GSC access change, a new field-data source), rather than on a fixed calendar interval |

Modules not listed in this table (00, 10, 11, and the conditional `C1`–`C5` set) have no fixed review cadence stated here; update them opportunistically when a rule is found to be stale or a client engagement surfaces a gap, and add a cadence row above if a fixed schedule is later warranted.

## 10. Status of prior documents

Three documents predate this SOP, all written pre-launch:

- `docs/web/SEO-AUDIT-REPORT.md`
- `docs/web/SEO-IMPLEMENTATION-PLAN.md`
- `docs/web/CleanStart-SEO-AEO-AI-Readiness-Audit.html`

All three are marked **Historical — superseded for rules; retained for launch-phase task history.** None of them is deleted. They interleaved durable rule with perishable launch-week status, which is precisely the decay pattern this SOP's rule/status separation (§5.1 of the design spec) is designed to avoid — so they are no longer the source of truth for any rule. Any finding in them that still holds up is not copied forward as-is: it is **re-verified** against the current codebase, the live site, and a primary source, and only then recorded as a rule (in the relevant module 01–11) with its own conformance verdict in `91-cleanstart-conformance.md`. A finding that does not survive re-verification is dropped, not carried forward on the strength of having been written down once before.

## 11. Glossary

- **AEO (Answer Engine Optimization)** — optimizing content so that answer-first surfaces (Google's featured snippets and AI-generated answer boxes, voice assistants) can extract and present it directly as an answer, rather than merely rank it as a link.
- **GEO (Generative Engine Optimization)** — optimizing content and site infrastructure so that generative AI systems (AI Overviews, ChatGPT web search, Perplexity, Copilot) can crawl, parse, and cite it as a source in a generated response.
- **Canonical** — the single URL a search engine is told to treat as authoritative for a piece of content, declared via `<link rel="canonical">`, an HTTP header, or a sitemap entry; consolidates duplicate-content signals onto one URL instead of splitting them across near-identical variants.
- **Crawl budget** — the number of URLs on a site a search engine's crawler is willing and able to fetch in a given period, governed by the site's perceived crawl health (response speed, error rate) and the crawler's own capacity allocation for the site.
- **E-E-A-T** — Experience, Expertise, Authoritativeness, Trustworthiness: Google's stated framework (from the Search Quality Rater Guidelines) for assessing whether content and its creator are credible for its topic and purpose.
- **Entity graph** — the network of structured-data nodes (organization, person, product, article, etc.) linked by stable identifiers, that together let a search or AI system resolve "which real-world thing is this page about" and how it relates to other things it already knows about.
- **Field vs lab data** — field data is measured from real users' actual page loads (e.g., Chrome UX Report / CrUX); lab data is measured from a synthetic, controlled test run (e.g., Lighthouse on a single machine). They can disagree, and only field data reflects what real visitors, and Google's ranking systems, actually experienced.
- **hreflang** — an HTML link attribute or sitemap annotation declaring which language and/or region a page variant targets, so a search engine serves the correct locale variant to a given searcher instead of the wrong one.
- **INP (Interaction to Next Paint)** — a Core Web Vital measuring the latency from a user's interaction (click, tap, key press) to the next frame the browser paints in response; replaced First Input Delay as Google's responsiveness metric.
- **ISR (Incremental Static Regeneration)** — a Next.js rendering strategy that serves a statically generated page and regenerates it in the background after a configured revalidation interval, combining static-page serving speed with periodically fresh content.
- **JSON-LD `@id`** — the stable identifier field on a JSON-LD structured-data node that lets other nodes (on the same page or elsewhere in the entity graph) reference it unambiguously, instead of each page re-describing the same real-world entity as an unlinked duplicate.
- **LCP (Largest Contentful Paint)** — a Core Web Vital measuring the render time of the largest image or text block visible within the viewport, used as a proxy for perceived load speed.
- **llms.txt** — a proposed plain-text convention (see llmstxt.org) placed at a site's root that gives large-language-model crawlers a curated, markdown-formatted map of the site's most important content, analogous in spirit to `robots.txt` but descriptive rather than permission-based.
- **Rich result** — an enhanced Google search listing (star ratings, FAQ accordion, product price/availability, breadcrumb trail, etc.) rendered from valid structured data on the page, in place of or alongside the plain blue-link result.
- **Soft-404** — a page that returns an HTTP `200 OK` status but whose content indicates "not found" (an empty state, a generic error message, a redirect to a landing page), which search engines detect heuristically and can still exclude from the index despite the misleading success status code.
- **SERP feature** — any non-standard element on a search engine results page beyond the classic ten blue links — featured snippet, People Also Ask, image pack, local map pack, AI Overview, knowledge panel, etc.

## 12. Tooling

Two scripts under `scripts/seo-sop/` do this SOP's mechanical work; everything else in `docs/seo/` is research and writing, not automation.

- **`node scripts/seo-sop/lint-rules.mjs docs/seo`** — the schema gate. Parses every rule block in every module under `docs/seo/` (excluding `evidence/`), and fails the run if any rule is missing a required-hard field, uses a severity outside `P0`–`P3`, cites a source without a Tier 1/2 marker or the `Convention` label, records a verdict outside the vocabulary in §7, or reuses an ID already assigned elsewhere in the corpus. A clean run prints `✓ <N> rule(s) across <M> file(s) — schema clean`; this must be run, and must be clean, before any module change is committed.
- **`node scripts/seo-sop/capture-live.mjs`** — refreshes the live-evidence record. Fetches the production URL matrix (`docs/seo/evidence/url-matrix.json`), records status codes, redirect chains, SEO-relevant headers, and extracted head signals, and writes the compact result to `docs/seo/evidence/live-capture.json`. Run this whenever a rule's `CleanStart` verdict depends on current live-site behaviour and the existing evidence file is stale relative to the change being verified.
