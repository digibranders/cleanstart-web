# CleanStart CMS — Comprehensive Audit: Executive Summary

_Full review of `apps/cms` (Payload 3.84 · Next.js 16.2 · React 19 · Postgres). Three independent multi-agent passes — engineering correctness, product/editorial/design, and premium UI polish — plus one fix already shipped. This is the map; each section links to the deep-dive doc._

---

## Verdict

The CMS is **architecturally strong and unusually mature** — versioned drafts, a real publishing-gate, encrypted integration config, SEO/JSON-LD tooling, an append-only leads contract, broad test coverage. It is **not** a prototype. But it is **carrying a handful of silent, high-impact runtime failures** and a **large polish/experience debt** that keep it from feeling production-grade and premium:

- **3 critical bugs** are live right now — and two of them mean whole subsystems (inbound webhooks/DSAR, and the lead-fallback + dead-letter + dashboard cron jobs) are **100% non-functional** without anyone seeing an error.
- The **editing experience and visual craft score 4–6/10** — the custom admin re-implements Payload's render layer but hasn't reached the polish bar (Linear/Vercel/Stripe) that the heavy customization implies.
- The **content model and SEO foundations score 8/10** — that part is genuinely good.

**Bottom line:** fix the 3 criticals this week (all small/trivial), then work the prioritized punch list below. The bones are good; the gaps are concentrated and fixable.

### Scorecard

| Dimension | Score | Source |
|---|---|---|
| Engineering correctness | 3 critical · 12 high · 105 med · 122 low | `01`–`04` |
| Content modeling | 8 / 10 | `06` |
| Visual design (system) | 8 / 10 | `07` |
| Editorial / authoring experience | 6.6 / 10 | `05` |
| Product / architecture (avg) | 6.8 / 10 | `06` |
| Roles, permissions & workflow | **5 / 10** ⚠ | `06` |
| Accessibility | **6 / 10** ⚠ | `07` |
| Premium polish — list tables & foundations | **4 / 10** ⚠ | `09` |
| Premium polish — all other screens | **5.7 / 10** ⚠ | `10` |

---

## Document index

| # | Doc | What's in it |
|---|---|---|
| 01 | `01-AUDIT-backend.md` | Collections, globals, blocks, fields, hooks, endpoints, jobs, libs — bugs & correctness |
| 02 | `02-AUDIT-ui.md` | Admin UI render layer — field renderers, list/edit/versions views, primitives, SEO, lexical, dashboard/nav, integrations, auth |
| 03 | `03-AUDIT-crosscut.md` | `@payloadcms/ui` import compliance & hook-API misuse, responsive/tablet/mobile, config wiring & dead code |
| 04 | `04-FIX-PLAN.md` | **Prioritized engineering fix plan (P0→P3)** with exact files, root cause, steps, verification |
| 05 | `05-REVIEW-editorial-experience.md` | How it feels to author articles/events/resources, build pages, manage taxonomy/media |
| 06 | `06-REVIEW-product-architecture.md` | Content modeling, IA/nav, completeness gaps, roles/permissions, value-vs-complexity |
| 07 | `07-REVIEW-design-ux-a11y.md` | Visual design, UX consistency, microcopy, accessibility |
| 08 | `08-RECOMMENDATIONS.md` | **Product/experience roadmap** — ranked opportunities, decisions needed, quick wins, bigger bets |
| 09 | `09-PREMIUM-UI-POLISH.md` | Premium spec: list tables, headers + count badges, pills, token/elevation foundations (exact values) |
| 10 | `10-PREMIUM-UI-POLISH-allscreens.md` | Premium spec: edit view, forms, sidebar/nav, dashboard, overlays, editor, login, media, buttons (exact values) |

---

## Already shipped during this review

✅ **Brand fonts fixed (committed `638ff39`).** The admin loaded fonts via a remote Google Fonts `@import` that the admin CSP (`style-src 'self'`; `font-src 'self'`) silently **blocked** — so the admin had been rendering in system fallback fonts the entire time. Now self-hosted via `next/font` (Manrope = display, Sora = body, JetBrains Mono = code), matching the marketing site, verified rendering live, lint/typecheck/build green.

---

## P0 — Fix immediately (3 critical, all small/trivial effort)

> Every one of these is a *silent* failure: no crash dialog, no log alarm — the feature just doesn't work. Details + exact patch steps in `04-FIX-PLAN.md` §P0.

1. **`ColumnPicker` throws — Columns drawer is dead.** `useTableColumns()` returns the empty default context because `CmsListView` never mounts `TableColumnsProvider`; `setActiveColumns` is `undefined`. _(The bug you first spotted.)_ → wrap the list content in `TableColumnsProvider`, switch to `toggleColumn`. `ColumnPicker.tsx:19`, `CmsListView.tsx`.

2. **Rate limiter is inverted — 5 endpoints permanently 429.** `checkAndRecord()` returns a truthy `RateLimitResult` object; `if (limited)` always rejects. **Cal.com webhook, Brevo bounce webhook, DSAR find/delete, and retry-lead-sync are 100% non-functional.** → `if (!limited.ok)` at all 5 sites. `integrations-inbound.ts`, `leads-dsar.ts`, `retry-lead-sync.ts`.

3. **5 cron tasks never run — missing `schedule`.** Payload only enqueues tasks with a non-empty `TaskConfig.schedule`; these have `autoRun` but no `schedule`. **The lead R2-fallback drain, webhook dead-letter retry, analytics prune, and both dashboard refreshes never fire** — directly undermining the "no lead lost during outage" guarantee. → add the `schedule` array to each TaskConfig. `jobs/drain-lead-queue.ts`, `retry-webhook.ts`, `analytics-cache-prune.ts`, `dashboard-refresh-*.ts`.

---

## P1 — High (12 findings)

Representative high-severity items (full list in `04-FIX-PLAN.md` §P1):

- **`SelectField` read-only renders blank** — saved value invisible in read-only mode.
- **DSAR find/delete scan only the first 1000 leads** — silently miss matches in large datasets (a GDPR-compliance hazard).
- **`video/mp4` and `.zip` uploads get renamed to `.bin`** — MIME→extension map gaps.
- **`AuthorCredibilityField` queries a non-existent `authors` field on `knowledgeBase`** — every author's KB output silently undercounted.
- **Events / Webinars / PodcastEpisodes / Jobs omit search-sync, IndexNow, and webhook hooks** every peer collection has — these content types are missing from site search and Teams notifications.
- **Brevo bounce handler updates only the first 1000 leads.**
- **Form-submission dedup silently disabled** (missing `overrideAccess`).

---

## Product & experience — top opportunities (`08`)

The 12 ranked opportunities, headlined:

1. **Make the `author` role real — or delete it** (roles/permissions scored 5/10; the role is half-wired).
2. **Add a lightweight editorial review/approval workflow** (draft→review→publish).
3. **Trim the article edit sidebar from ~20 items to ~12** (authoring overload).
4. **Finish or delete the half-built surfaces** (several stubbed features imply they work).
5. **Fix the broken SEO-description fallback chains** (Guides/Pages missing `abstract` silently breaks auto-sync).
6. **Rebuild the page-builder block picker** + collapse blocks by default.
7. **Make keyboard-inaccessible widgets navigable** (a11y 6/10).
8. **Resolve the dual toast systems.**
9. **Complete Webinars/Events parity + on-demand handling.**
10. **Role-scope the dashboard and quick actions.**
11. **Reorganize the sidebar grouping taxonomy** (27 collections need better grouping).
12. **Add media usage-tracking + a missing-alt dashboard.**

> Note (`01`/`06`): the CMS-driven **MainNav, FooterNav, and Announcements globals have zero consumers in `apps/web`** — the live site uses a hardcoded nav/footer. The entire CMS nav/banner infrastructure is currently dead-weight until the web app consumes it. Decision needed: wire it up, or remove it.

---

## Premium UI polish — the punch list (`09` + `10`)

Visual craft is the biggest experience gap (4/10 list views, 5–6/10 elsewhere). Highest-leverage fixes, in order:

1. **Cap form column max-width to ~760px** — kills the single most visible defect: 848px-wide inputs on every edit screen.
2. **Table column-width strategy** — Title greedy (≥320px, truncate+tooltip), Status fit-content, dates right-aligned w/ tabular numerals; fix the near-equal-columns layout.
3. **Recolor the count badge** ("57 PUBLISHED") off status-green into a neutral chip, and move it **inline** with the title (it currently sits on its own line).
4. **Kill the fractional pixels** (`9.75px`, `13.5px`, `10.5px`, `0.63px`) — root-cause the rem/scale math; move to a whole-pixel 4px grid.
5. **Widen sidebar (300px) and nav rail (256px)** — stops SEO-card and nav-badge truncation.
6. **Fix the broken kebab icon** (renders as a bare "-") in list toolbar and doc controls.
7. **Field rhythm** — label `margin-bottom: 6px`, field gap 20px, eyebrow legends.
8. **Dashboard card elevation + spacing; overlay depth + motion** (backdrop blur, drawer spring, toast exit).
9. **Re-tint the LinkPopover / TableGridPicker / inline-image dialogs** to dark-theme tokens (white-island regressions).
10. **Unify the button system + build a real segmented control** (Index/No-Index toggle).

Each item has exact before→after values in `09`/`10`.

---

## Cross-cutting themes (recurring patterns worth a single sweep)

- **Bare `throw new Error()` instead of Payload `ValidationError`** in several hooks (redirect/path/taxonomy cycle guards, Media size check, pages-path-builder) → produces HTTP 500 instead of an inline form error. One taxonomy sweep fixes the UX + the convention violation.
- **Missing afterChange hooks** (search-sync / IndexNow / webhooks) on Events, Webinars, PodcastEpisodes, Jobs — a copy-paste gap from the article collections.
- **Fractional-pixel scale** throughout the type/spacing system — one foundations fix (`09`) cascades everywhere.
- **CMS globals not consumed by the web app** — nav/footer/announcements built but unused.
- **Half-built surfaces** — TOC depth locked to H2, `schemaAddonsField` UI permanently hidden, Jobs `closedAt`/`expiresAt` automation referenced but not built, `SchemaAddonsAdder` dead code.
- **Accessibility** — keyboard-inaccessible custom widgets, focus management gaps (6/10).

---

## What's already excellent (preserve, don't regress)

- Content modeling & relationships (8/10), versioned drafts, conditional-required discriminators done right.
- AES-256-GCM integration-config encryption with HKDF key derivation.
- Append-only Leads contract correctly enforced; Users auth hardening (disable hook, role access).
- Taxonomy cycle detection, SVG sanitization, the SEO/JSON-LD tooling, broad test coverage.
- The visual design *system* / token discipline (8/10) — the foundation is good; it's the *application* that needs polish.

---

## Suggested sequencing

- **Sprint 0 (this week):** P0 ×3 (all trivial/small) → restores webhooks, DSAR, lead-fallback/dead-letter/dashboard crons, and the column picker. _Highest ROI in the whole audit._
- **Sprint 1:** P1 ×12 + the `ValidationError` taxonomy sweep + the missing-hooks sweep on Events/Webinars/Podcast/Jobs.
- **Sprint 2 (premium polish):** form max-width, table columns/alignment, count-badge recolor, fractional-px foundations, sidebar/nav widths, kebab icon — the top-10 punch list.
- **Sprint 3+ (product bets):** real roles + editorial workflow, sidebar trim/regroup, finish-or-delete half-built surfaces, decide the CMS-globals-vs-web-app question.

---

## How to use these docs

- **Engineers fixing bugs:** start at `04-FIX-PLAN.md` (P0→P3, copy-paste-ready).
- **Designers/PM on experience:** `08-RECOMMENDATIONS.md` then `09`/`10` for exact visual values.
- **Deep context on any area:** `01`/`02`/`03` (engineering) and `05`/`06`/`07` (product/design).

_Methodology: 24 engineering finder agents + per-finding adversarial verification (7 findings refuted/dropped), 13 product/design reviewers, and 13 premium-polish reviewers, across four background workflows. Findings are grounded in full-file reads and live measurements from the running admin._
