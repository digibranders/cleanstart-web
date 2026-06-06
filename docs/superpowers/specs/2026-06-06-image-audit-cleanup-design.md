# Image Audit & Cleanup — Design Spec

**Date:** 2026-06-06
**Branch:** `development` (touches `apps/web` + repo-root junk; allowed scope)
**Status:** Awaiting user review before implementation

---

## 1. Problem

`apps/web/public/images` holds ~1,000 images totalling **226 MB**, of which **215 MB is PNG** (447 files). A rough basename scan suggests **~535 files (~140 MB) are unreferenced**. Filenames are frequently generic or Figma-derived (`logo-5.png`, `image-2.svg`, hash suffixes, `-new`/`-1` duplicate variants). Two stray Figma exports (`光斑 flare*.svg`, 792 KB each) sit untracked at the repo root, and `.playwright-mcp/` (~28 MB of console logs) is not gitignored.

Goals, in priority order:
1. **Delete** dead assets and junk (largest, safest win).
2. **Convert + resize** heavy raster assets to modern formats to cut transfer/repo weight.
3. **Rename** generic assets descriptively and fix every reference.
4. **Audit quality** of each *used* image: `next/image` vs `<img>`, alt-text presence/quality, stored-vs-rendered dimensions.

This round produces a **reviewable audit only**. No deletion, conversion, or rename happens until the user approves the report.

## 2. Scope

**In scope (deep audit + action recommendations):**
- `apps/web/public/` — all raster assets (PNG/JPG/JPEG/WebP/GIF/AVIF) and their usages in `apps/web/src`.
- Repo-root junk: `光斑 flare.svg`, `光斑 flare-1.svg` (delete); `.playwright-mcp/` (add to `.gitignore`).

**Listed but NOT actioned (keep / out of scope):**
- `apps/web/public/images/hero-tech-logos/` — 75 SVG tech logos. **Fully excluded**: no audit-for-action, no touch.
- **All SVGs repo-wide** — never converted (vector is already optimal), but *may be renamed* when generically named (references updated), **except** inside `hero-tech-logos/`. SVG orphans are *listed* in a separate bucket, deleted only on explicit per-bucket approval.
- CMS admin logo (embedded JSX) and `docs/` images — listed as "out of scope / keep".

## 3. Conversion safety rules (hard constraints)

These govern Phase 2 and are encoded into the audit's per-image recommendation:

1. **SVG → never converted** (vector is already optimal); **may be renamed** if the filename is generic (except `hero-tech-logos/`, which stays untouched).
2. **`hero-tech-logos/` → never touched.**
3. **Card icons & brand-logo PNGs → conservative conversion only:** alpha-preserving WebP, high quality/near-lossless, **no downscaling**. Must remain crisp. Classified by usage (rendered small, icon/logo semantics) and flagged `icon-or-logo` so the resize pass skips them.
4. **Transparency preserved.** Per-file alpha detection; any image with an alpha channel converts to a format that keeps alpha (WebP/AVIF with alpha) — **never** flattened to JPEG. Post-conversion assertion: output retains alpha.
5. **Aggressive resize/convert** (downscale to ~rendered size, lossy WebP/AVIF) applies **only** to heavy photographic and decorative-gradient PNGs — the multi-MB, full-bleed assets — never to icons/logos/UI chrome.
6. Every converted asset is **visually verified in the desktop preview (1440×900)** against the original before the old file is removed.

## 4. Methodology — script + judgment hybrid

A pure-manual pass over 1,000 images is unreliable; a pure script can't judge alt-text quality or propose good names. So:

### 4a. Factual layer — `apps/web/scripts/audit-images.ts` (reusable)
For every raster asset under `apps/web/public`, emit:
- relative path, format, byte size, pixel dimensions (raster via `sips`/`sharp`; flag SVGs separately).
- **alpha channel present?** (drives the transparency rule).
- **usage map:** referenced or not, and where. Detection layers:
  - literal path references (`/images/...`, `images/...`) in `src/**`.
  - `import`/`require` of the asset.
  - **dynamic-name flagging:** references built from template strings (`` `card-${i}.png` ``, `${slug}.png`) mark every matching file `dynamic-unsure` rather than `orphan`, so nothing dynamic is wrongly deleted.
- **render method** at each usage: `next/image` `<Image>`, plain `<img>`, CSS `background-image`, or `<source>`.
- **raw `alt` text** at each usage site (empty string vs missing vs present).

Output: `apps/web/image-audit.json` (machine-readable manifest) — re-runnable to verify a clean repo after execution.

### 4b. Judgment layer (me + parallel read-only agents for tricky usage tracing)
- Confirm each `orphan` candidate (resolve `dynamic-unsure`, check non-`src` references, e.g. `next.config`, metadata, OG tags).
- Grade alt text: missing / empty-but-decorative-ok / generic ("image", "icon") / good.
- Classify `icon-or-logo` vs `photo-or-gradient` (decides resize eligibility per §3).
- Propose a **descriptive filename** per asset — raster **and** SVG (excludes `hero-tech-logos/`).
- Recommend target format + dimensions.

### 4c. Deliverable — `docs/web/IMAGE-AUDIT.md`
Human-readable, grouped by page/folder, with:
- **Summary:** totals, projected savings (delete / convert), counts per recommended action.
- **Per-image table:** `current path → proposed name · used? · format · KB · WxH · alpha · render method · alt status · recommended action`.
- Action ∈ `keep · delete · convert→webp · resize+convert · rename · rename+convert`.
- Separate buckets: confirmed orphans, `dynamic-unsure` (needs human eyes), SVG orphans (hold), excluded (`hero-tech-logos`, SVG, out-of-scope).

The `image-audit.json` manifest is the exact worklist for execution — nothing is done by eyeballing.

## 5. Phased execution (only after report approval)

| Phase | Work | Verification gate |
|---|---|---|
| 1 | Delete root flares; gitignore `.playwright-mcp/`; delete confirmed orphans (manifest-driven). | `git status` review · `lint · typecheck · build` |
| 2 | Convert + resize per §3 rules; assert alpha & crispness; remove originals only after preview match. | visual diff in preview · `build` |
| 3 | Rename + rewrite all references; add/fix alt text; normalize `<img>`→`next/image` where appropriate. | `lint · typecheck · build` · re-run `audit-images.ts` → 0 orphans/0 generic names |

Each phase is a separate reviewable step. Orphan deletion list is shown for sign-off before Phase 1 runs.

## 6. Risks & mitigations

- **False-positive orphan deletion** → `dynamic-unsure` bucket never auto-deleted; orphan list shown before any `rm`; deletions are git-tracked and revertible.
- **Quality loss on icons/logos** → §3 rules 3–4; no downscaling on icon/logo class; per-asset preview verification.
- **Broken references after rename** → references rewritten from the manifest, then `tsc`/`build` + re-run audit script to assert zero dangling paths.
- **Transparency loss** → per-file alpha detection + post-conversion alpha assertion.
- **Scope creep onto CMS/SVG/logos** → explicit exclusion list in §2; enforced by the script's ignore globs.

## 7. Out of scope (this effort)

- CMS (`apps/cms`) image assets beyond listing them.
- SVG optimization (SVGO / minification) — deferred; SVG *content* is kept verbatim (no conversion). SVGs may still be **renamed**.
- A CI gate to prevent future orphan/oversize regressions — note as a follow-up, not built now.
