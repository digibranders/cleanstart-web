# SEO / AEO / GEO Documentation & SOP — Design

**Date:** 2026-07-29
**Status:** Approved (design). Implementation plan pending.
**Branch:** `development`
**Scope:** Documentation only — no application code changes in this workstream.

---

## 1. Problem

CleanStart has accumulated a large amount of genuine SEO engineering — `apps/web/src/lib/seo/` (10 modules, all test-covered), `packages/schema/` (a JSON-LD builder/compose/validate engine), dynamic `sitemap.ts` and `robots.txt`, `/api/og` image generation, a hand-authored `public/llms.txt`, IndexNow-on-publish, a CrUX refresh cron, and content-insights snapshots. It also has three prior SEO documents, all written pre-launch and now partly stale.

Three problems follow:

1. **None of it is portable.** Every new website build re-derives the same decisions from scratch, inconsistently.
2. **None of it is verified.** No document states which implementations are correct per primary sources, which are merely conventional, and which are actively wrong. At least one known contradiction exists: the CMS-side schema engine is believed dead in production because `apps/web` composes its own JSON-LD.
3. **Prior docs mix rule and status.** `SEO-AUDIT-REPORT.md` interleaves durable rules with launch-week task state, so it decays as a reference the moment the tasks are done.

## 2. Goals

- A **reusable SOP** covering the technical and non-content-dependent SEO/AEO/GEO surface for every website built by this team.
- A **verified CleanStart conformance report** — a per-rule verdict with evidence, plus a ranked, effort-estimated gap backlog.
- Every rule traceable to a **primary source**, with **objectively testable acceptance criteria** and a **runnable verification command**.
- Explicit separation between *rule* (durable) and *status* (perishable), so the SOP does not decay the way the prior docs did.

## 3. Non-goals

| Excluded | Reason |
| --- | --- |
| Application code changes | Decided: document-only pass. Gaps become a backlog; implementation is a separate approved session. |
| Per-page copy (actual titles, descriptions, body content) | Content is per-website. Formulas and templates are in scope; words are not. |
| Keyword research, topical maps, editorial calendar, author programs | Beyond the agreed content boundary. |
| Shareable HTML client artifact | Declined. |
| Packaging the SOP as a Claude Code skill | Declined for this pass. Natural follow-up once the SOP stabilises. |
| Link building / off-page / digital PR | Not a build-time engineering concern; different discipline and cadence. |

## 4. Recorded decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | Deliver **both** the portable SOP and a CleanStart conformance report | The SOP is the durable asset; CleanStart is the reference implementation that proves each rule is real rather than aspirational. |
| D2 | **Two-layer** rules: platform-neutral statement + Next.js/CleanStart reference implementation | Portable to WordPress/Webflow/Astro clients while staying copy-pasteable for the Next.js builds that dominate current work. |
| D3 | Verify against **codebase + live site + primary docs + field data + tool-scoring conventions** | "Correct implementation" is only meaningful relative to a source of truth. Code alone cannot detect code-says-X-but-production-does-Y. |
| D4 | **Document only**, produce a ranked fix backlog | Keeps a large research task from tangling with a large, unreviewable diff. |
| D5 | Content boundary = **rules, formulas, templates — not copy** | The repeatable machinery is what generalises across sites. |
| D6 | Include **conditional modules** for domains CleanStart does not exercise | Avoids a gap on the first e-commerce or multi-region client, provided they are honestly labelled as documentation-verified rather than battle-tested. |
| D7 | **Modular markdown** in `docs/seo/` + a **one-page operator checklist** | Diffable, greppable, independently updatable as Google and AI-search behaviour changes. |
| D8 | **Heavy multi-agent** research pipeline with adversarial verification | The stated risk to avoid is assuming blindly; independent refutation is the cheapest defence against a confident wrong claim. |

## 5. Architecture

### 5.1 Spine — hybrid, joined by stable rule IDs

Domain modules are the **reference layer**. The operator checklist and the conformance report are **derived layers** that reference rules by ID and never restate them.

```
docs/seo/01..11, C1..C5     canonical home of every rule   (reference)
        │
        ├──► docs/seo/90-operator-checklist.md   rule IDs + pass criteria, ordered by lifecycle stage
        └──► docs/seo/91-cleanstart-conformance.md   rule IDs + verdict + evidence + backlog rank
```

Rejected alternatives:

- **Domain-only** — a good reference, but nobody ships a website by reading a taxonomy.
- **Lifecycle-only** — a good execution guide, but the same rule gets restated across four stages and the copies silently diverge. This is precisely how the existing `SEO-AUDIT-REPORT.md` decayed.

The hybrid keeps one rule in one place. Updating a rule keeps both derived artifacts correct automatically.

### 5.2 Rule ID scheme

`<DOMAIN>-<NN>` — domain prefix fixed per module, number assigned sequentially and **never reused**. Deprecated rules are retained with status `Superseded by <ID>` rather than deleted, so external references and past audits remain resolvable.

| Prefix | Module | Prefix | Module |
| --- | --- | --- | --- |
| `CRAWL` | 01 Crawl & index control | `RENDER` | 07 Rendering & delivery |
| `ARCH` | 02 Site & URL architecture | `MIG` | 08 Migrations |
| `META` | 03 On-page & metadata | `MEAS` | 09 Measurement |
| `SCHEMA` | 04 Structured data | `GOV` | 10 Governance & CI |
| `GEO` | 05 AEO / GEO | `SEM` | 11 Semantics & accessibility overlap |
| `PERF` | 06 Performance & CWV | `INTL` `ECOM` `LOCAL` `PROG` `NEWS` | C1–C5 conditional |

### 5.3 The rule schema

Every rule carries these ten fields. A rule missing any of the four marked **required-hard** does not ship.

| Field | Required | Notes |
| --- | --- | --- |
| ID + title | hard | Stable, never reused |
| Severity | hard | P0–P3, per §5.4 |
| Applicability | yes | `Always` or `Conditional: <trigger>` |
| Rule statement | hard | Platform-neutral, imperative, one sentence |
| Why it matters | yes | Mechanism — how the search or AI system actually consumes the signal. Not folklore. |
| Acceptance criteria | hard | Objectively testable. Any two engineers must reach the same verdict. |
| Verification method | hard | A runnable command, query, or explicit tool procedure |
| Reference implementation | yes | `file:line` in this repo, or `None — no reference implementation` |
| Primary source | hard | Tier 1 or Tier 2 per §5.5, with URL |
| Tool-flagging convention | yes | How Ahrefs / Semrush / Screaming Frog / Sitebulb / Lighthouse label and weight it |
| Anti-patterns | yes | Known wrong implementations, especially ones that look correct |
| CleanStart conformance | yes | Verdict + evidence (recorded in module 91, referenced here) |

**Precedence rule:** where CleanStart's implementation contradicts the primary source, the source defines the rule and CleanStart is recorded as `Fail` or `Partial`. The codebase does not get to define correctness.

### 5.4 Severity model

| Level | Definition | Response |
| --- | --- | --- |
| **P0** | Causes deindexing, traffic loss, or serves the wrong content to crawlers | Blocks launch; fix immediately |
| **P1** | Material organic or AI-visibility impact, no immediate loss | Fix within launch week |
| **P2** | Meaningful improvement, non-urgent | Scheduled backlog |
| **P3** | Hygiene, marginal or speculative gain | Opportunistic |

Severity is assigned from **mechanism and blast radius**, then cross-checked against how the named tools weight the same issue. Where this SOP disagrees with tool defaults, the disagreement is stated explicitly with reasoning — a client-side SEO running Ahrefs must be able to see why our severity differs.

### 5.5 Evidence standard

| Tier | What qualifies | Citable as |
| --- | --- | --- |
| **1** | Official specification or vendor documentation — Google Search Central, Schema.org, IETF RFCs, W3C/WHATWG, Bing Webmaster docs, IndexNow spec, OpenAI / Anthropic / Perplexity / Google-Extended crawler documentation, llmstxt.org, web.dev & Chrome team | Authority |
| **2** | First-party platform engineering docs — Next.js, Vercel, Payload | Authority for implementation detail |
| **3** | Large-scale empirical study with published methodology, named and dated | Supporting evidence only |
| **4** | Agency blogs, conference talks, practitioner consensus | `Industry convention` label only — never as authority |

A rule requires at least one Tier 1 or Tier 2 source. A rule resting only on Tier 3/4 is retained only if genuinely useful and is explicitly labelled **`Convention — not vendor-confirmed`**.

**Verdict vocabulary** (conformance report): `Pass` · `Partial` · `Fail` · `N/A` · `Unverified — <reason>`. Fabricating a verdict where verification failed is prohibited; `Unverified` with a stated reason is the correct output.

## 6. Module set

### Core — always apply

| # | Module | Covers |
| --- | --- | --- |
| 00 | Index & conventions | How to use, rule-ID scheme, severity model, evidence tiers, glossary |
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

### Conditional — invoked per client

`C1` international & hreflang · `C2` e-commerce, product schema & merchant feeds · `C3` local, multi-location & NAP · `C4` programmatic and faceted navigation at scale · `C5` news & publisher

Each conditional module carries a banner: **"Not exercised by CleanStart — verified against primary documentation only."**

### Derived

| # | Artifact |
| --- | --- |
| 90 | Operator checklist — pre-build / pre-launch / launch-day / week-1 / monthly / quarterly. Rule IDs and pass criteria only. |
| 91 | CleanStart conformance report — verdict + evidence per rule ID, plus ranked, effort-estimated gap backlog |

## 7. Research pipeline

Five phases with a review gate between each. No rule is authored before its evidence exists.

| Phase | Work | Output |
| --- | --- | --- |
| **1 — Inventory** | Parallel codebase auditors per domain; live-site crawl of every page template capturing rendered HTML, headers, redirect chains, sitemap, JSON-LD; field-data fetch (CrUX, GA4, GSC if granted) | Raw evidence base |
| **2 — Primary-source research** | Parallel researchers per domain against Tier 1/2 documentation; separate track on how the named tools label and weight each issue | Cited rule candidates |
| **3 — Adversarial verification** | Every candidate rule and every CleanStart verdict goes to independent verifiers **prompted to refute**. Claims that fail refutation are dropped or downgraded to `Convention`. | Verified rule base |
| **4 — Authoring** | Modules written from the verified rule base; checklist and conformance report derived | Draft docs |
| **5 — Completeness critic** | Adversarial pass for what is missing: unverified claims, unread sources, templates never crawled, rules lacking acceptance criteria or verification commands | Gap list → loop to 1–3 as needed |

Domain passes use the purpose-built agent types available in this environment (`seo-technical`, `seo-geo`, `seo-schema`, `seo-performance`, `seo-content`, `seo-sxo`, `seo-sitemap`) in preference to generic agents.

## 8. Deliverables

```
docs/seo/
├── 00-index.md
├── 01-crawl-and-index-control.md
├── 02-site-and-url-architecture.md
├── 03-onpage-and-metadata.md
├── 04-structured-data.md
├── 05-aeo-geo.md
├── 06-performance-core-web-vitals.md
├── 07-rendering-and-delivery.md
├── 08-migrations.md
├── 09-measurement.md
├── 10-governance-and-ci.md
├── 11-semantics-accessibility-overlap.md
├── conditional/
│   ├── C1-international-hreflang.md
│   ├── C2-ecommerce.md
│   ├── C3-local.md
│   ├── C4-programmatic-faceted.md
│   └── C5-news-publisher.md
├── 90-operator-checklist.md
└── 91-cleanstart-conformance.md
```

Prior documents (`docs/web/SEO-AUDIT-REPORT.md`, `SEO-IMPLEMENTATION-PLAN.md`, `CleanStart-SEO-AEO-AI-Readiness-Audit.html`) are **not deleted**. Module 00 records their status — superseded, historical, or still-live task state — and module 91 absorbs any of their findings that survive re-verification.

## 9. Acceptance criteria

The work is complete when:

1. Every core module exists with no `TBD`, `TODO`, or placeholder rule.
2. Every rule carries all four required-hard fields; a mechanical check confirms this.
3. Every rule cites a Tier 1 or Tier 2 source, or is explicitly labelled `Convention — not vendor-confirmed`.
4. Every verification method is a command or procedure that was actually executed at least once during the audit.
5. Module 91 records a verdict for every rule, with `Unverified — <reason>` used wherever verification genuinely failed, and no fabricated results.
6. The gap backlog is ranked by severity and carries an effort estimate per item.
7. The operator checklist references only rule IDs — it restates no rule text.
8. Every claim about CleanStart cites `file:line` or a captured live-site response.

## 10. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Confident but wrong rules — the stated primary concern | Phase 3 adversarial refutation; Tier 1/2 source requirement; `Convention` labelling for the rest |
| Docs decay as Google/AI search changes | Rule/status separation; one canonical home per rule; module 00 records a review cadence |
| Scope sprawl into content strategy | Non-goals table in §3 is binding; content boundary fixed at formulas and templates |
| GSC access not granted, blocking field verification | Attempt and report honestly. Affected rules get `Unverified — GSC access pending` rather than invented data. |
| No live Ahrefs/Semrush API in this environment (OAuth unavailable in a non-interactive session) | Tool-scoring conventions researched from published vendor documentation and labelled as documentation-derived, not API-observed |
| Conditional modules presented as battle-tested when they are not | Mandatory banner on every conditional module |
| Multi-agent token cost | Phase gates with human review; no phase begins before the prior phase's output is reviewed |

## 11. Known constraints at design time

- **GSC** — access grants recorded as pending; GA4 property `508401576` and `CRUX_API_KEY` are configured in `apps/cms/.env`.
- **Ahrefs / Semrush MCP** — require OAuth; unavailable in this non-interactive session.
- **Preliminary unverified signal** — 11 of 43 `page.tsx` files export neither `metadata` nor `generateMetadata`, with no parent layout supplying it (`events`, `blogs`, `careers`, `news`, `podcast`, `webinars`, `knowledge-hub`, `guide`, `case-studies`, `resource-center`, `legal`). To be confirmed against live rendered HTML in Phase 1 before being stated as a finding.
- **Known contradiction to settle** — the CMS-side three-layer schema engine is believed inert in production because `apps/web` composes its own JSON-LD. Module 04 must resolve this definitively.
