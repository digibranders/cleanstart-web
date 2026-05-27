# CleanStart `apps/web` Typography Migration Audit

> **Companion to:** [`TYPOGRAPHY-SYSTEM.md`](./TYPOGRAPHY-SYSTEM.md) (the canonical spec).
> **Purpose:** Track every `fontSize:` / `text-[…]` declaration in `apps/web/src/` and its planned migration to a `--fs-*` or `--prose-*` token.
> **Status:** Phase 0 baseline · 2026-05-27.
> **How to read this:** Each migration PR (PR-1 through PR-40) checks off the rows for its page section. The doc is a living checklist — every row must be checked before its PR merges.
>
> ### v4 scale change (2026-05-27)
> Earlier v3 values for `--fs-h1` and `--fs-h2` were too small in visual review. The system was bumped:
> - `--fs-h1`: was 32 → 48 px; **now 32 → 56 px** (+8 desktop)
> - `--fs-h2`: was 28 → 40 px; **now 28 → 48 px** (+8 desktop)
> - All other tokens unchanged.
>
> Audit rows below were authored against the v3 scale. The **target token names** (e.g. `var(--fs-h2)`) are unchanged — only the resolved px values shifted upward by 8 px on desktop. Re-read mobile/desktop Δ columns in §4.1 with this offset in mind, or wait for the v4-bumped narrative below.

---

## 1. Migration scope summary

`apps/web/src/components/sections/` directory — `fontSize` + `text-[…]` declaration counts (descending):

| # | Directory | Count | Phase | PR # |
|---|---|---|---|---|
| 1 | `home/` | 60 | 1 | PR-18 (last marketing page; biggest) |
| 2 | `attack-surface-reduction/` | 60 | 1 | PR-4 |
| 3 | `sca/` | 55 | 1 | PR-5 |
| 4 | `partners/` | 41 | 1 | PR-12 |
| 5 | `ciso/` | 39 | 1 | PR-8 |
| 6 | `vulnerability-remediation/` | 38 | 1 | PR-3 |
| 7 | `sbom/` | 38 | 1 | PR-6 |
| 8 | `community/` | 38 | 1 | PR-11 |
| 9 | `for-developers/` | 37 | 1 | PR-9 |
| 10 | `fips/` | 34 | 1 | PR-7 |
| 11 | `cleanstart-images/` | 33 | 1 | PR-2 |
| 12 | `cleansight/` | 32 | 1 | **PR-1 (first)** |
| 13 | `teams/` | 29 | 1 | PR-10 |
| 14 | `careers/` | 28 | 1 | PR-14 |
| 15 | `blog/` | 22 | 2 | PR-20 |
| 16 | `forms/` | 19 | 3 | PR-37 |
| 17 | `events/` | 19 | 2 | PR-23/24 |
| 18 | `about/` | 18 | 1 | PR-13 |
| 19 | `contact/` | 16 | 1 | PR-15 |
| 20 | `podcast/` | 14 | 2 | PR-26 |
| 21 | `knowledge-hub/` | 13 | 2 | PR-31 |
| 22 | `blogs/` | 10 | 2 | PR-19 |
| 23 | `resource-center/` | 9 | 2 | PR-27 |
| 24 | `webinars/` | 7 | 2 | PR-25 |
| 25 | `newsroom/` | 7 | 2 | PR-21 |
| 26 | `resource/` | 6 | 2 | PR-28 |
| 27 | `news-detail/` | 4 | 2 | PR-22 |
| 28 | `legal/` | 4 | 2 | PR-32 |
| 29 | `author/` | 4 | 2 | PR-30 |
| 30 | `book-a-demo/` | 3 | 1 | PR-16 |
| 31 | `_shared/` | 2 | 2 | PR-20 (DetailHero) |
| 32 | `error/` | 1 | n/a | tail-end |
| | **TOTAL (sections only)** | **~648** | | |

Plus app-route files in `apps/web/src/app/` (~115 px + 20 rem + 215 clamp + 96 preset Tailwind text-* + 31 arbitrary text-[] — total ~648 across all `apps/web/src/`).

---

## 2. Per-page audit format

Every per-page section follows this table format:

| # | File | Line | Element | Current value | New token | Mobile Δ | Desktop Δ | Risk | ☑ PR-NN |
|---|---|---|---|---|---|---|---|---|---|

Columns:
- **Mobile Δ** = (new mobile px) - (current mobile px). Positive = larger.
- **Desktop Δ** = (new desktop px) - (current desktop px).
- **Risk** = `none` (identity / sub-2-px), `low` (2–4 px), `medium` (4–8 px), `high` (>8 px). Anything `medium` or above needs explicit UI/UX sign-off.
- **☑ PR-NN** = checked off in the migration PR for this page.

---

## 3. How to populate a new page section

Before opening a migration PR for any page, do this:

```bash
# Replace <page> with the section directory name (e.g. cleansight)
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
grep -rn 'fontSize\|text-\[' \
  apps/web/src/components/sections/<page>/ \
  apps/web/src/app/<page>/ \
  2>/dev/null | grep -v '//' | grep -v 'text-\[#'
```

Then for each match:
1. Read the element role (H1 / H2 / card title / body / button / etc.).
2. Look up the token in `TYPOGRAPHY-SYSTEM.md` §5 (per-element usage guide).
3. Compute the mobile + desktop delta vs the current value.
4. Add a row to the page's section below.
5. Reviewer checks off the row in the PR.

---

## 4. Page-by-page sections

### 4.1 — Phase 0 baseline (already-token-driven call-sites)

These call-sites already consume aliased tokens. They'll inherit the new clamp formulas automatically after Phase 0 merges. **No code edits needed; just visual verification.**

Spread across the codebase: 298 sites use `var(--text-display-*)`, `var(--text-card-title-*)`, `var(--text-body-*)`, `var(--text-hero-*)`, `var(--text-t-*)`, `var(--cta-card-*)`, or `var(--btn-fs-*)`.

Expected visual deltas after Phase 0 alias resolution (**v4 scale active**):
- `--text-hero-marketing` was 40 → 72 px. Becomes 36 → 64 px via `--fs-display`. **Mobile -4, Desktop -8 px.** (Marketing-flagged pages: `/`, `/about-us`, `/teams`.)
- `--text-hero-product` was 36 → 56 px. Becomes 36 → 64 px via `--fs-display`. **Desktop +8 px.** Matches this session's hero standardisation already.
- `--text-hero-utility` was 32 → 48 px. Becomes 32 → **56 px** via `--fs-h1`. **Desktop +8 px.** Detail/listing-hero H1 grows.
- `--text-display-md` was 32 → 62 px. Becomes 28 → **48 px** via `--fs-h2`. **Mobile -4, Desktop -14 px.** Smaller shrink than v3 (was -22 desktop) — still significant but acceptable per visual review.
- `--text-display-lg` was 36 → 72 px. Becomes 32 → **56 px** via `--fs-h1`. **Mobile -4, Desktop -16 px.** Smaller shrink than v3 (was -24 desktop).
- `--text-card-title-lg` was 22 → 32 px. Becomes 22 → 28 px via `--fs-h3`. **Desktop -4 px.** Low risk, kept as v3 — user-confirmed acceptable.
- `--text-body-lg/md` were both ~16-22 px. Become 16 → 17 px via `--fs-body`. **Desktop -1 to -5 px.** Low risk.
- `--btn-fs-xl/lg` were both 1.25rem (20 px). Become 16 → 18 px via `--fs-button-lg`. **Desktop -2 px.** Low risk.

**Action at Phase 0 PR:** Visual diff every route at all 8 viewports per `TYPOGRAPHY-SYSTEM.md` §11 plan checklist. Anything `medium` or above gets explicit UI/UX sign-off in the PR description.

---

### 4.2 — `/cleansight` (PR-1, the first marketing migration)

**32 declarations** across 8 files: `CleanSightHero.tsx`, `CleanSightBlindSpots.tsx`, `CleanSightStats.tsx`, `CleanSightUnified.tsx`, `CleanSightComparison.tsx`, `CleanSightProblems.tsx`, `CleanSightSecurity.tsx`, `CleanSightCTA.tsx`.

| # | File | Line | Element | Current value | New token | Mobile Δ | Desktop Δ | Risk | ☑ PR-1 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CleanSightHero.tsx | 71 | Hero H1 | `clamp(36px, 4.45vw, 64px)` | `var(--fs-display)` | 0 | 0 | none | [ ] |
| 2 | CleanSightHero.tsx | 88 | Hero sub-heading paragraph | `clamp(18px, 1.7vw, 24px)` | `var(--fs-lead)` | 0 | -4 | low | [ ] |
| 3 | CleanSightBlindSpots.tsx | 113 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 4 | CleanSightStats.tsx | 134 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 5 | CleanSightStats.tsx | 201 | Stat number | `var(--text-t-display-2)` (32→56) | `var(--fs-h2)` (alias-resolved) | -4 | -16 | medium — UX review (stat numbers are the focal point of this section) | [ ] |
| 6 | CleanSightStats.tsx | 211 | Stat label | `clamp(20px, 2vw, 28px)` | `var(--fs-h3)` | +2 | 0 | low | [ ] |
| 7 | CleanSightUnified.tsx | 139 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 8 | CleanSightUnified.tsx | 156 | Section sub-heading | `clamp(18px, 1.7vw, 24px)` | `var(--fs-lead)` | 0 | -4 | low | [ ] |
| 9 | CleanSightUnified.tsx | 259 | Card title | `clamp(22px, 2.4vw, 32px)` | `var(--fs-h3)` | 0 | -4 | low | [ ] |
| 10 | CleanSightUnified.tsx | 273 | Card body | `clamp(15px, 1.4vw, 20px)` | `var(--fs-body)` | +1 | -3 | low | [ ] |
| 11 | CleanSightComparison.tsx | 47 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 12 | CleanSightComparison.tsx | 160 | Card title | `clamp(22px, 2.4vw, 32px)` | `var(--fs-h3)` | 0 | -4 | low | [ ] |
| 13 | CleanSightComparison.tsx | 229 | Card body | `clamp(15px, 1.4vw, 20px)` | `var(--fs-body)` | +1 | -3 | low | [ ] |
| 14 | CleanSightProblems.tsx | 70 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 15 | CleanSightProblems.tsx | 87 | Section sub-heading | `clamp(18px, 1.7vw, 24px)` | `var(--fs-lead)` | 0 | -4 | low | [ ] |
| 16 | CleanSightProblems.tsx | 155 | Card title | `clamp(22px, 2.4vw, 32px)` | `var(--fs-h3)` | 0 | -4 | low | [ ] |
| 17 | CleanSightProblems.tsx | 167 | Card body | `clamp(15px, 1.4vw, 20px)` | `var(--fs-body)` | +1 | -3 | low | [ ] |
| 18 | CleanSightSecurity.tsx | 81 | Card title (responsive) | `isStack ? clamp(18,5vw,22) : clamp(22,2.2vw,32)` | `var(--fs-h3)` (drop the isStack branch — the clamp handles it) | -1 to +4 | -4 | low — re-check stacked layout | [ ] |
| 19 | CleanSightSecurity.tsx | 94 | Card body (responsive) | `isStack ? clamp(13,3.5vw,15) : clamp(14,1.2vw,18)` | `var(--fs-body)` | +1 to +3 | -1 | low | [ ] |
| 20 | CleanSightSecurity.tsx | 167 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 21 | CleanSightSecurity.tsx | 313 | Section H2 | `clamp(32px, 4vw, 56px)` | `var(--fs-h2)` | -4 | -16 | medium — UX review | [ ] |
| 22 | CleanSightSecurity.tsx | 325 | Section sub-heading | `clamp(18px, 1.7vw, 24px)` | `var(--fs-lead)` | 0 | -4 | low | [ ] |
| 23 | CleanSightSecurity.tsx | 476 | Dashboard panel header | `"18px"` (fixed) | `var(--fs-h5)` | 0 | 0 | none | [ ] |
| 24 | CleanSightSecurity.tsx | 491 | Dashboard panel body | `"14px"` (fixed) | `var(--fs-body-sm)` | 0 | 0 | none | [ ] |
| 25 | CleanSightSecurity.tsx | 627 | Dashboard cqi-based label | `clamp(12px, 1.4cqi, 18px)` | **keep inline** — container-query-based, no fs-* equivalent | n/a | n/a | none — explicit exemption (container-query interior scaling is the right tool here) | [ ] |
| 26 | CleanSightSecurity.tsx | 639 | Dashboard cqi-based meta | `clamp(10px, 1cqi, 13px)` | **keep inline** — container-query-based | n/a | n/a | none — explicit exemption | [ ] |
| 27 | CleanSightCTA.tsx | 109 | CTA card title (variant A) | `var(--cta-card-title)` | **keep** — cta-card-* family stays orthogonal to fs-* (footer-slot system) | 0 | 0 | none — out of scope for this migration | [ ] |
| 28 | CleanSightCTA.tsx | 135 | CTA card desc (variant A) | `var(--cta-card-desc)` | **keep** | 0 | 0 | none | [ ] |
| 29 | CleanSightCTA.tsx | 215 | CTA card title (variant B) | `var(--cta-card-title)` | **keep** | 0 | 0 | none | [ ] |
| 30 | CleanSightCTA.tsx | 234 | CTA card desc (variant B) | `var(--cta-card-desc)` | **keep** | 0 | 0 | none | [ ] |
| 31 | CleanSightComparison.tsx | 44 | `text-[#111111]` Tailwind color class | `text-[#111111]` | **keep** — color hex arbitrary class, not font-size | n/a | n/a | none — out of scope (audit grep matches color too) | [ ] |
| 32 | CleanSightComparison.tsx | 226 | `text-[#333333]` Tailwind color class | `text-[#333333]` | **keep** — color hex arbitrary class | n/a | n/a | none — out of scope | [ ] |

**Notes for PR-1:**
- Drop the `isStack ? ... : ...` ternary on CleanSightSecurity.tsx lines 81 and 94 — the `--fs-h3` / `--fs-body` clamps handle responsive sizing without conditional logic.
- Keep the four `--cta-card-*` references in CleanSightCTA.tsx — this token family lives in the footer-slot system and is migrated separately (or not at all — it's already token-driven).
- Keep the two container-query-based `cqi` clamps in CleanSightSecurity.tsx (lines 627, 639) — they intentionally scale based on the dashboard card width, not viewport.

---

### 4.3 — All other pages (audit to be populated just-in-time)

The remaining 33 page sections are listed below as **stubs**. The audit row for each page is populated when its migration PR opens, using the recipe in §3.

The stub format is:

```markdown
### 4.X — `/<route>` (PR-XX)

**N declarations** across M files: `FileA.tsx`, `FileB.tsx`, …

| # | File | Line | Element | Current value | New token | Mobile Δ | Desktop Δ | Risk | ☑ PR-XX |
|---|---|---|---|---|---|---|---|---|---|
| _populated when PR-XX opens_ |
```

#### Phase 1 — Marketing pages (sequential, after PR-1)

- 4.4 — `/cleanstart-images` (PR-2) — **33 declarations**, 6 files _(stub)_
- 4.5 — `/vulnerability-remediation` (PR-3) — **38 declarations**, ~7 files _(stub)_
- 4.6 — `/attack-surface-reduction` (PR-4) — **60 declarations**, ~7 files _(stub)_
- 4.7 — `/software-composition-analysis` (PR-5) — **55 declarations** _(stub)_
- 4.8 — `/software-bill-materials` (PR-6) — **38 declarations** _(stub)_
- 4.9 — `/fips` (PR-7) — **34 declarations** _(stub)_
- 4.10 — `/for-ciso` (PR-8) — **39 declarations** _(stub)_
- 4.11 — `/for-developers` (PR-9) — **37 declarations** _(stub)_
- 4.12 — `/teams` (PR-10) — **29 declarations** _(stub)_
- 4.13 — `/community` (PR-11) — **38 declarations** _(stub)_
- 4.14 — `/partners` (PR-12) — **41 declarations** _(stub)_
- 4.15 — `/about-us` (PR-13) — **18 declarations** _(stub)_
- 4.16 — `/careers` (PR-14) — **28 declarations** _(stub)_
- 4.17 — `/contact-us` (PR-15) — **16 declarations** _(stub)_
- 4.18 — `/book-a-demo` (PR-16) — **3 declarations** _(stub)_
- 4.19 — `/deal-registration` (PR-17) — _(declarations counted at PR-open time; route uses shared forms components)_
- 4.20 — `/` home (PR-18) — **60 declarations**, 11+ files _(stub; saved for last as the most complex)_

#### Phase 2 — CMS pages (sequential)

- 4.21 — `/blogs` listing (PR-19) — **10 declarations** _(stub)_
- 4.22 — `/blog/[slug]` detail (PR-20) — **22 declarations** + _shared/DetailHero (2) _(stub)_
- 4.23 — `/news` (PR-21) — **7 declarations** _(stub)_
- 4.24 — `/news/[slug]` (PR-22) — **4 declarations** _(stub)_
- 4.25 — `/events` (PR-23) — _(stub)_
- 4.26 — `/events/[slug]` (PR-24) — **19 declarations combined** _(stub)_
- 4.27 — `/webinars` (PR-25) — **7 declarations** _(stub)_
- 4.28 — `/podcast` (PR-26) — **14 declarations** _(stub)_
- 4.29 — `/resource-center` (PR-27) — **9 declarations** _(stub)_
- 4.30 — `/resource/[slug]` (PR-28) — **6 declarations** _(stub)_
- 4.31 — `/careers/[slug]` (PR-29) — _(stub)_
- 4.32 — `/author/[slug]` (PR-30) — **4 declarations** _(stub)_
- 4.33 — `/knowledge-hub/vex-documents` (PR-31) — **13 declarations** _(stub)_
- 4.34 — `/legal` + `/legal/acceptable-use-policy` (PR-32) — **4 declarations** _(stub)_
- 4.35 — `/privacy-policy` (PR-33) — _(stub; uses .article-body — verify visually only)_
- 4.36 — `/preview/[collection]/[slug]` (PR-34) — _(stub; preview banners)_

#### Phase 3 — Chrome (sequential)

- 4.37 — Header / nav (PR-35) — _files: Header.tsx, DesktopNav.tsx, MobileNav.tsx, MegaMenu.tsx, CompactDropdown.tsx_
- 4.38 — Footer (PR-36) — _files: _shared/Footer.tsx_
- 4.39 — Forms (PR-37) — **19 declarations** _files: BookDemoForm.tsx, ContactForm.tsx, DealRegistrationForm.tsx, FormCard.tsx, FormRenderer.tsx_
- 4.40 — UI primitives (PR-38) — _files: Button.tsx, Pagination.tsx, FactoryCard.tsx, ComparisonCard.tsx_
- 4.41 — Resource cards (PR-39) — _files: resource/PostCard.tsx and similar_
- 4.42 — Cleanup misc (PR-40) — _`fontFamily: "Inter"` in ASRBloated.tsx:1; preview banner sizing; etc._

---

## 5. Migration progress dashboard

| Phase | Total PRs | Opened | Merged | % complete |
|---|---|---|---|---|
| Phase 0 — Foundation | 1 | 1 (this) | 0 | 0% |
| Phase 1 — Marketing | 18 | 0 | 0 | 0% |
| Phase 2 — CMS | 16 | 0 | 0 | 0% |
| Phase 3 — Chrome | 6 | 0 | 0 | 0% |
| Phase 4 — Enforcement | 1 | 0 | 0 | 0% |
| Phase 5 — Docs finalisation | 1 | 0 | 0 | 0% |
| **TOTAL** | **43** | **1** | **0** | **2%** |

---

## 6. Final acceptance criteria (re-stated)

When Phase 4 is complete, **all of the following must be true**:

```bash
cd apps/web
# Zero inline clamp() on font-size:
grep -rn 'fontSize.*clamp' src/                    # → 0 matches

# Zero arbitrary text-[Xpx] / text-[clamp(...)]:
grep -rnE 'text-\[(\d|clamp)' src/                 # → 0 matches (color hex `text-[#abc]` is allowed)

# Legacy aliases deleted from globals.css:
grep -E '^\s+--text-hero-marketing:\s+var\(--fs-' src/app/globals.css   # → 0 matches

# Every var(--text-*) consumer migrated:
grep -rn 'var(--text-' src/                        # → 0 matches outside globals.css definitions

# Token block exists and is populated:
grep -cE '^\s+--fs-' src/app/globals.css           # → ≥ 25 (currently 67)
grep -cE '^\s+--prose-' src/app/globals.css        # → ≥ 17 (currently 29)
```

---

**Document version:** 1.0 (Phase 0 baseline) · 2026-05-27
