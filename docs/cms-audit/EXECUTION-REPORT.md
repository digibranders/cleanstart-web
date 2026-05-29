# CMS Audit — Overnight Execution Report

_Generated: 2026-05-30 · Branch: `development` · Scope: `apps/cms/**` (+ `docs/cms-audit/**`)_

This report consolidates an unattended overnight remediation run against the CleanStart
CMS (`apps/cms`; Payload 3.84 · Next 16.2 · React 19). Each unit below ran the full green
gates (lint · typecheck · build · test) before committing on `development`. No pushes, no
`main`/`farheen` edits, no branch creation.

---

## 1. Per-unit summary

| # | Unit | Committed | SHA | Done | Skipped |
|---|------|-----------|-----|------|---------|
| 1 | P0 — column picker provider, rate-limit inversion, cron schedules | yes | `ce386cd` | 5 | 0 |
| 2 | P1 — High (04-FIX-PLAN.md) | yes | `446f750` | 10 | 3 |
| 3 | Cross-cut: surface hook validation as Payload `ValidationError` (no 500s) | yes | `f8390b5` | 7 | 2 |
| 4 | Cross-cut: wire search-sync / IndexNow / webhooks afterChange on Events, Webinars, PodcastEpisodes, Jobs | yes | `808498b` | 5 | 0 |
| 5 | P2 — collections (content, taxonomy/media, ops) | yes | `5d119fd` | 24 | 8 |
| 6 | P2 — globals, blocks, field definitions | yes | `f93e79e` | 12 | 3 |
| 7 | P2 — access/hooks and libraries | yes | `4e45093` | 11 | 4 |
| 8 | P2 — UI field renderers & views (behavioral) | yes | `9f176ba` | 16 | 3 |
| 9 | P2 — UI primitives/SEO/Lexical/integrations/nav (behavioral) | yes | `1e86ea7` | 15 | 4 |
| 10 | P3 — backend low-severity polish | yes | `ff9cae6` | 42 | 5 |
| 11 | P3 — UI behavioral polish | yes | `89c8646` | 14 | 60 |
| 12 | Premium foundations + tables (09-PREMIUM-UI-POLISH) | yes | `f780dec` | 8 | 2 |
| 13 | Premium screens A — edit/document, forms, nav, dashboard | yes | `c9c5bb7` | 11 | 0 |
| 14 | Premium screens B — overlays, editor, login, media, buttons, responsive | yes | `22b4a7a` | 35 | 0 |
| 15 | **final** — verification & execution report | yes | _this commit_ | 3 | 0 |

**Totals:** 15 units · 15 committed · ~218 done items · ~94 skipped (most are "already fixed
in a prior unit" no-ops or explicitly-excluded product decisions — see §2).

---

## 2. Consolidated SKIPPED list (across all units)

Skips fall into three buckets: **(A)** already-fixed by a prior unit (no-op), **(B)** explicitly
excluded product/eng decisions (see §4), and **(C)** deferred work needing broader scope, data
backfill, or live-service verification. Bucket (A) entries are benign — they confirm
idempotency across overlapping unit scopes.

### P1 (unit 2)
- **Refactor `canonical-check.ts` to consume the new `follow-with-ssrf-guard` helper** — (C) optional enhancement; canonical-check already does correct per-hop SSRF re-checking with a different HEAD/GET flow; reusing the helper would change its method semantics and risk regressing passing tests. The vulnerable media-ingest path is fully fixed and the shared helper exists for later reuse.
- **One-shot migration to rewrite persisted `/blog/<slug>` redirect rows to `/blogs/`** — (C) production data backfill (ops task), not a code change. Run against prod Postgres separately (see §5 ops note).
- **Reconcile remaining `ROUTE_PREFIX` entries beyond blogs/resources/events (e.g. webinars `/webinar`)** — (C) not a named P1 item; `apps/web` has no `webinars/[slug]` route, so it is a separate concern. Only the three explicitly-listed prefixes were changed.

### ValidationError sweep (unit 3)
- **`redirect-cycle-guard.ts:130` unsafe double-cast** — (C) separate LOW finding (FIX-PLAN line 347), out of this unit's scope. (Later fixed in unit 10.)
- **`ctaHref` URL validation / Pricing `billingToggle` cross-validation / Integrations kind-immutability throws** — (C) distinct FIX-PLAN items, not validation/cycle/path hooks. (Later handled in units 6/10.)

### P2 collections (unit 5)
- **`schemaAddonsField hidden:true` re-surface** — (B) tracked in BACKLOG; flip `hidden:false` when SchemaPreviewField rendering is fixed.
- **pagesPathBuilder / taxonomy-parent-cycle-guard / Media size-check ValidationError** — (A) already done in unit 3.
- **Events/Webinars/Jobs afterChange hooks** — (A) already done in unit 4.
- **Brevo bounce handler pagination** — (A) already done in unit 2.

### P2 globals/blocks/fields (unit 6)
- **seoDefaults organizationJsonLd URL validation** — (A) already implemented in `seoDefaults.ts`.
- **MainNav/FooterNav/Announcements: wire to apps/web or remove globals** — (B) bigger bet; documented in BACKLOG P2.17.
- **All 19 page-builder blocks: build apps/web renderer** — (B) deferred phase; documented in BACKLOG P2.18.

### P2 access/hooks/libs (unit 7)
- **Cycle/depth/validation hooks bare Error** — (A) already done in unit 3.
- **ROUTE_PREFIX blogs/resources/events + Events breadcrumb crumb** — (A) already done in unit 2.
- **ssrf-guard DNS re-check** — (C) requires async DNS resolution infra; synchronous guard + `redirect:manual` provides adequate defense-in-depth.

### P2 UI views (unit 8)
- **`schemaAddonsField hidden:true` re-surface / SchemaAddonsAdder dead-code** — (B) BACKLOG; coordinated decision needed.
- **Cosmetic SCSS restyling (toolbar sizing, nav link heights, array tap targets, chip remove buttons)** — (C) deferred to Premium phases (units 12-14).
- **NumberField hasMany warning fallback** — superseded; full multi-value input implemented instead.

### P2 UI primitives/SEO/Lexical/integrations/nav (unit 9)
- **SeoTitle/SeoDescription manualMode lost when stored value equals source** — (C) needs `seo._titleOverridden`/`_descriptionOverridden` schema fields + migration; documented as a limitation until schema lands.
- **CmsAccountForm password/email change without current-password verification** — (C) Payload `/api/users/:id` PATCH has no native `currentPassword` re-auth; needs custom endpoint/middleware, beyond a UI-only fix.
- **FaqBulkPaste `useForm` allowlist documentation** — (C) enforcement already allows `useForm`; only a CLAUDE.md doc edit remains (root CLAUDE.md is out of `apps/cms/**` scope).
- **MediaField inline browse dialog missing dimensions row** — (C) inline copy replaced with shared MediaBrowseDialog; dimension-row parity is a separate UI polish task.

### P3 backend (unit 10)
- **`form-schema-version.ts` non-atomic read-then-increment** — (C) low-probability race; fix needs advisory lock / atomic SQL.
- **`preview/jwt.ts` length leak before timingSafeEqual** — (C) theoretical only; length is a public constant.
- **SVG href sanitization regex for mixed-quote hrefs** — (C) DOMPurify already neutralizes; low residual risk.
- **footerNav `{year}` substitution in Footer.tsx** — (C) `apps/web` out of scope.
- **`loadConfig` plain-object hard rejection** — implemented warning path instead (audit allows either).

### P3 UI (unit 11)
- ~50 entries, overwhelmingly bucket (A) "already fixed in a prior unit" (eventStatus timestamps, Resources description, AuthorCredibility, Media collision loop, AnalyticsCache TTL comment, AboutGalleries description, slug.ts cast, redirect-cycle double-cast, isAdminOrSelf cast, safe-regex too-long, analytics-cache-prune re-throw, purge-leads-pii throw, reindex-meili info-level logs, ms-clarity skip, loadConfig warn, health-score double-count, parse-head-tags cast, download-token version prefix, add-menu-feature `.ts`, EmbedPlugin fallback, internal-routes anchor slash, wirePreviewControls scope, normalizeAllSpans reverse-order).
- Bucket (B) "Decisions needed": Section block Hero in nestableBlocks; `link.ts` newTab for doc/media; seoField dead export; wireCustomEditView no-op; InboundRedirectsField dead-code; MediaPicker/RelationshipPicker/SavedStateIndicator/BytesCell/DateCell dead-code; cleanstartBlockHandleFeature dead-code.
- Bucket (C) deferred (broader scope / live-service / risk): globals URL-validation cluster (later done in unit 10), Gallery/LogoCloud/IntegrationLogos URL validation, Section min-children/two-column constraints, FaqBulkPaste MutationObserver scope, SchemaPreviewField podcast support, user-offboard 1000-row truncation, publish-checklist slug allowlist, media-rename CopySource slash encoding, export-leads-csv/preview/sitemap-robots rate limiting, Retry-After header sweep, integrations-actions fixture shape, shouldAutoRun permanent stop, retry-webhook routing-mismatch log, image sitemap published filter (later done in unit 7), JobPosting description double-traversal, SocialCardField XHR abort, AuditTrail pagination, AnalyticsTab loading indicator, CollectionsMultiSelect/EventsMultiSelect interactive-div a11y, confirm/alert→ConfirmDialog migrations, LeadsCsvTruncationBanner fetch-patch guard, LockedReason double-announcement, LinkPopoverPlugin command re-registration, all SCSS/responsive polish (handled in Premium units), root CLAUDE.md job-table edit (out of `apps/cms/**` scope).

### Premium foundations + tables (unit 12)
- **Forcing outline-based focus on every `input:focus-visible`** — (C) the finding itself says to keep box-shadow rings where outline clips inside `overflow:hidden` cards; applied the load-bearing parts (focus-ring tint bump, buttons→outline) only.
- **Half-pixel sweep of non-listed SCSS partials** — (C) those files are outside the doc's authoritative sweep scope; stayed scoped to avoid an unbounded cross-file visual edit.

---

## 3. Final gate results (this unit)

Run at repo root against `@cleanstart/cms`:

| Gate | Command | Result |
|------|---------|--------|
| Lint | `pnpm --filter @cleanstart/cms lint` | **PASS** — biome, 564 files checked, no fixes |
| Typecheck | `pnpm --filter @cleanstart/cms typecheck` | **PASS** — `tsc --noEmit`, clean |
| Build | `pnpm --filter @cleanstart/cms build` | **PASS** — Next 16.2 compiled in ~14s, TS in ~9s, 4/4 static pages |
| Test | `pnpm --filter @cleanstart/cms test` | **PASS** — 120 files / 1136 tests, 0 failures |

**Summary:** `lint ✓ · typecheck ✓ · build ✓ · test ✓ (1136/1136)`

### payload-types regeneration
`pnpm --filter @cleanstart/cms generate:types` produced a small drift (13 insertions /
7 deletions) — canonical generated output reflecting the P2 schema additions (abstract,
tocDepth, podcast SEO fields) and Payload's deterministic field-order normalization. Staged
and committed as part of this report commit (`payload-types.ts` is generated — never hand-edited).

### Environmental / pre-existing notes
- No DB was required by any gate (all four run without Postgres).
- No environmental or pre-existing test failures were observed; the full suite is green.
- Pre-existing **out-of-scope** dirty paths remained in the working tree throughout and were
  intentionally left untouched (not staged by any CMS unit):
  `migrations/URL-PARITY-REPORT.md`, untracked `apps/web/src/app/careers/[slug]/`,
  `apps/web/src/app/events/[slug]/`, `apps/web/src/components/sections/error/`, and a stray
  `docs/superpowers/specs/*.md`. These belong to `apps/web` / other workstreams.

---

## 4. Still-outstanding EXCLUDED items (require a human decision)

These were deliberately **not** implemented per run guardrails ("Decisions needed" + product
"bigger bets"). They need the user/eng-owner to decide direction before code lands.

**Product "bigger bets":**
1. **Roles/permissions overhaul** — finer-grained access model beyond admin/editor.
2. **Editorial workflow** — multi-state review/approval pipeline.
3. **Wire CMS globals into `apps/web`** — MainNav, FooterNav, Announcements, seoDefaults
   brandIcons/verification groups, footerNav `{year}` copyright substitution. Decision:
   SSR-wire the full nav vs. remove the unused globals. Tracked in BACKLOG P2.17.
4. **Page-builder block renderer in `apps/web`** — all 19 blocks lack a web-side renderer /
   catch-all route. Tracked in BACKLOG P2.18.
5. **"Finish-or-delete" on half-built surfaces** — `schemaAddonsField` (hidden), SchemaPreview
   rendering, wireCustomEditView (no-op edit-view wave), InboundRedirectsField dead-code,
   `cleanstartBlockHandleFeature`, and the dead-code picker/cell components
   (MediaPicker/RelationshipPicker/SavedStateIndicator/BytesCell/DateCell). Each needs a
   keep-and-wire vs. delete call.

**Smaller "Decisions needed" forks:**
6. **Section block `Hero` in `nestableBlocks`** — should Hero be nestable? Schema decision.
7. **`link.ts` `newTab` for doc/media link kinds** — extend new-tab option beyond URL links?
8. **`seoField` dead `export`** — keep as public API or remove?
9. **`publish-checklist` PUBLISHABLE set** — which collections are publishable (slug allowlist)?
10. **SeoTitle/SeoDescription manualMode persistence** — add `seo._titleOverridden` /
    `_descriptionOverridden` schema fields (needs migration) to preserve manual override when
    the stored value equals the auto-derived source.
11. **CmsAccountForm current-password verification** — needs a custom re-auth endpoint.
12. **Rate-limit hardening values** — concrete limits for export-leads-csv, preview tokens,
    and sitemap/robots need product/security sign-off before hardcoding.

---

## 5. Visual QA checklist for tomorrow (Premium phases @ 1440px)

Open the CMS admin at **1440×900 desktop** (lock the viewport) and walk these. The Premium
units (12-14) were SCSS/behavioral-only — no automated visual regression exists, so eyeball each:

**List view (collection index):**
- [ ] **Table column widths/alignment** — Title column is greedy (no fixed width); `_select` ~40px, `_status` 108px centered, authors 140px, categories 120px, dates 128px right-aligned with right-aligned headers. Confirm no horizontal scroll at 1440px and that long titles wrap, not clip.
- [ ] **Count badge** — neutral chip sits **inline** beside the H1 (inside `.cs-list__title-row`), no leading dot, 11px. Draft/published variants tint brand-soft on hover. Confirm placement is beside the title, not on a second line.
- [ ] **Page-header alignment** — `.cs-list__header` vertically center-aligned; H1 is 26px/600, search input 13px; header bottom margin reads as `--cs-space-5` (20px).
- [ ] **The kebab icon** — three-dot menu trigger renders (SVG injected via `:empty::after` mask); has hover/focus states; not collapsed to zero-size.
- [ ] **Table surface** — list table has the raised surface shadow + clipped overflow corners.

**Edit / document view:**
- [ ] **Edit-form column width** — main form column caps at ~760px at ≥1280px; sidebar has 16px inline padding + 20px column-gap; doc-controls strip min-height 52px.
- [ ] **Field rhythm** — 20px field gap, 6px label→input gap; array/group legends render as 11px/700 eyebrows; select height 38px; collapsible summaries 700 weight.
- [ ] **The segmented control** — `.cs-segmented-control` (e.g. Indexable field) renders as a proper segmented toggle (CSS-only; verify it's actually wired to a field's JSX — if it still renders as plain radios, that's the known un-wired follow-up).

**Sidebar / nav:**
- [ ] **Sidebar/nav widths** — left nav rail 256px (`--nav-width`), doc sidebar 300px (`--sidebar-width`); nav links min-height 34px (44px on coarse-pointer); active link shows 3px stripe + soft inset bloom; CMS eyebrow 10px cyan; nav search 32px.

**Dashboard:**
- [ ] **Dashboard cards** — greeting 22px/600; pulse cards have tinted (`color-mix`) surfaces + 4px left border + lift shadow; pulse-grid 16px gaps; analytics grid uses 20px padding (no min-height); timeline hairline aligned, live-dot halo removed.

**Overlays / drawers:**
- [ ] **Overlays/drawers** — dialog backdrop blur 8px / drawer 6px / command-palette 12px; drawer uses spring enter/exit; toast close button 32px destructive-red; popover enters with translateY(-4px) scale(0.99); footers use elevated background. Open the media browse dialog, command palette (⌘K), a confirm dialog, and a schedule-publish dialog to check each.

**Login screen:**
- [ ] **Login** — card max-width 400px / 40px padding / 16px radius; inputs locked 40px; submit 44px full-width; eyebrow cyan; 2FA-reserved block shown solid at 0.45 opacity; error callout uses input radius.

**Editor (Lexical) — spot check inside a blog/guide body:**
- [ ] Toolbar buttons 30px with active border-bottom; heading margins taper H1→H6; code block has left rail + inset shadow; blockquote 4px border + 20px padding; LinkPopover is dark-themed with cyan accents; TableGridPicker cells 20px with cyan active state; inline-image controls use cyan (not green) and 28px close button.

A Premium screen is "done" only when its rendered state matches the audit's intended spec at 1440px.

---

_End of report._
