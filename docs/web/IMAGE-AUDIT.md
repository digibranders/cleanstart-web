# 
    Image Audit —`apps/web`

> **Status: AUDIT ONLY — nothing has been deleted, converted, or renamed.** This report is the
> reviewable worklist. Execution happens in gated phases *after* you approve it. Machine-readable
> manifest with every per-asset decision: [`apps/web/image-audit.json`](../../apps/web/image-audit.json).
>
> Regenerate: `node apps/web/scripts/audit-images.mjs` then `node apps/web/scripts/build-image-audit-report.mjs`.
> Spec: [`docs/superpowers/specs/2026-06-06-image-audit-cleanup-design.md`](../superpowers/specs/2026-06-06-image-audit-cleanup-design.md). Generated for the `development` branch.

## Executive summary

**Current state — `apps/web/public`:**

| Format          |          Files |               Size |
| --------------- | -------------: | -----------------: |
| PNG             |            448 |           212.3 MB |
| SVG             |            561 |             6.3 MB |
| JPG             |             14 |             2.6 MB |
| JPEG            |              9 |             1.7 MB |
| WEBP            |             30 |             1.6 MB |
| **Total** | **1062** | **224.5 MB** |

**Findings & recommended actions:**

| Action                                                   |     Files | Notes                                  |
| -------------------------------------------------------- | --------: | -------------------------------------- |
| 🗑**Delete** (orphans + junk + empty)              |       468 | reclaims**138.2 MB** (exact)     |
| 🔄**Convert → WebP** (near-lossless, no resize)   |       195 | icons/logos/photos at render size      |
| 📐**Resize + convert → WebP**                     |        54 | oversized photos/gradients (huge wins) |
| ✏️**Rename** (generic/Figma-junk → descriptive) |        13 | references rewritten                   |
| 🏷**Fix extension** (`.png` that is really SVG)  |         0 | rename to `.svg`                     |
| ♿**Add/fix alt text**                             |         6 | informative images with empty alt      |
| 🧬**Consolidate cross-page duplicates**            | 22 groups | +**15.1 MB** if deduped          |
| ✅**Keep as-is**                                   |       269 | incl. 244 used SVGs                    |
| 🚫**Excluded** (hero-tech-logos)                   |        75 | untouched per rule                     |

**Projected weight:**

- **Delete (exact):** −138.2 MB → from 224.5 MB down to 86.2 MB.
- **Convert + resize (estimated):** the 249 convert/resize candidates are **82.7 MB** today; estimated **~33.5 MB** after (saving ~49.1 MB).
- **Combined estimated end state: ~37.1 MB** (from 224.5 MB) — a **~83% reduction**.
- Plus up to **15.1 MB** more if cross-page exact duplicates are consolidated to shared assets.

> **Savings caveat:** *Delete* is measured exactly. *Convert/resize* figures are **conservative** estimates — real `sharp` WebP conversions came in well under them: `hero-cube` 3047 KB → **44 KB** (1%), `fits-icon-2` (3200px, near-lossless) 2128 KB → **184 KB** (9%), `ciso/hero-photo` 2392 KB → **49 KB** (2%), `Ball1` icon 13 KB → **5 KB** (38%). Real end-state is likely **smaller** than ~37 MB. Exact per-asset sizes are finalised in Phase 2.

> **WebP tooling:** `sharp` 0.34.5 (libvips 8.17.3) installed globally & verified ✓ — Phase 2 can proceed. **Transparency rule upheld (verified):** sharp keeps real transparency (alpha min < 255 → preserved on hero-cube/fits-icon/platforms-3d) and only strips redundant *fully-opaque* alpha channels (Figma artifacts, e.g. ciso/hero-photo alpha min=255 → dropped with no visible change). No image with actual transparent pixels loses it.

## Per-page summary

| Folder                           | Files | Keep | Delete | Convert | Resize | Rename | Alt | MB now | MB est |
| -------------------------------- | ----: | ---: | -----: | ------: | -----: | -----: | --: | -----: | -----: |
| images/attack-surface-reduction  |   117 |   13 |     84 |      19 |      1 |      2 |   0 |   34.7 |    6.1 |
| images/cleansight                |    73 |   17 |     42 |       7 |      7 |      0 |   0 |   30.5 |    1.6 |
| images/cleanstart-images         |   105 |   35 |     56 |       7 |      7 |      0 |   5 |   18.3 |    0.9 |
| images/for-developers            |    67 |   19 |     31 |       8 |      9 |      0 |   0 |   17.3 |    0.9 |
| images/ciso                      |    59 |   21 |     26 |      11 |      1 |      0 |   0 |   16.3 |    3.2 |
| images/teams                     |    28 |    6 |      7 |      14 |      1 |      0 |   0 |   15.4 |      2 |
| images/sbom                      |    55 |   20 |     29 |       4 |      2 |      0 |   0 |     15 |      2 |
| images/about                     |    66 |   23 |     32 |      10 |      1 |      3 |   0 |    9.2 |      3 |
| images/sca                       |    42 |   12 |     17 |       9 |      4 |      0 |   0 |    8.2 |    1.5 |
| images/hero                      |    12 |    0 |     12 |       0 |      0 |      0 |   0 |      8 |      0 |
| images/community                 |    33 |    3 |     19 |       9 |      2 |      0 |   0 |    7.8 |    1.1 |
| images/fips                      |    29 |    5 |     10 |      12 |      2 |      0 |   0 |    6.4 |    3.1 |
| images/cleanstart-platform       |    40 |   12 |     26 |       1 |      1 |      0 |   0 |      5 |    0.2 |
| images/resource-center           |    20 |   10 |      2 |       0 |      8 |      0 |   0 |      5 |    1.9 |
| images                           |    22 |    3 |     13 |       6 |      0 |      0 |   0 |    4.9 |    0.7 |
| images/vulnerability-remediation |    19 |    0 |      2 |      15 |      2 |      0 |   0 |    3.4 |    1.5 |
| (public root)                    |     6 |    0 |      6 |       0 |      0 |      0 |   0 |    2.8 |      0 |
| images/blogs                     |    18 |    8 |      4 |       4 |      2 |      0 |   0 |    2.4 |    0.4 |
| images/newsroom                  |     2 |    1 |      0 |       1 |      0 |      0 |   0 |    1.9 |    1.2 |
| images/book-a-demo               |     6 |    0 |      4 |       0 |      2 |      0 |   0 |    1.9 |    0.5 |
| images/podcast                   |     4 |    0 |      1 |       3 |      0 |      3 |   0 |    1.8 |    0.1 |
| error                            |    12 |   12 |      0 |       0 |      0 |      0 |   0 |    1.2 |    1.2 |
| images/trusted                   |    13 |    2 |      0 |      11 |      0 |      0 |   0 |      1 |    0.6 |
| images/error                     |     1 |    0 |      0 |       0 |      1 |      0 |   0 |    0.8 |    0.4 |
| images/awards                    |     4 |    0 |      0 |       4 |      0 |      0 |   0 |    0.7 |    0.4 |
| images/contact                   |    10 |    1 |      4 |       5 |      0 |      0 |   0 |    0.6 |    0.3 |
| images/hero-tech-logos           |    75 |   75 |      0 |       0 |      0 |      0 |   0 |    0.6 |    0.6 |
| images/guides                    |     7 |    4 |      0 |       2 |      1 |      0 |   0 |    0.5 |    0.2 |
| images/partners                  |    44 |    5 |     24 |      15 |      0 |      4 |   0 |    0.5 |    0.2 |
| images/home                      |     5 |    1 |      0 |       4 |      0 |      1 |   0 |    0.5 |    0.3 |
| images/blog-detail               |    12 |    2 |      9 |       1 |      0 |      0 |   0 |    0.5 |    0.1 |
| images/testimonials              |     5 |    0 |      0 |       5 |      0 |      0 |   0 |    0.4 |    0.3 |
| images/cleanstart-factory        |    17 |    8 |      5 |       4 |      0 |      0 |   0 |    0.3 |    0.1 |
| images/case-studies              |     3 |    2 |      0 |       1 |      0 |      0 |   1 |    0.3 |    0.2 |
| images/security                  |     9 |    8 |      0 |       1 |      0 |      0 |   0 |    0.1 |    0.1 |
| images/news-detail               |     9 |    6 |      1 |       2 |      0 |      0 |   0 |    0.1 |    0.1 |
| images/faq                       |     3 |    3 |      0 |       0 |      0 |      0 |   0 |      0 |      0 |
| images/footer                    |     5 |    3 |      2 |       0 |      0 |      0 |   0 |      0 |      0 |

## 🗑 Delete — orphans, junk & empty files

Junk to remove outright:

- `光斑 flare.svg`, `光斑 flare-1.svg` — stray untracked Figma exports at the **repo root** (792 KB each).
- `.playwright-mcp/` — ~28 MB of Playwright console logs; add to `.gitignore`.
- `images/attack-surface-reduction/figma-.jpg` — **0-byte empty file**.

**468 unreferenced image files → 138.2 MB.** Includes **69 basename-collision false-positives** the audit reclassified from "used" to orphan (a copy lives in another folder; nothing references *this* path).

<details><summary><b>images/cleansight</b> — 42 files, 25.1 MB</summary>

- `comp-gradient-right-new.png` — 9117 KB _(was dynamic-unsure — No ref; '-new' junk; byte-identical dupe of comp-gradient-ri)_
- `comp-gradient-right.png` — 9117 KB _(was dynamic-unsure — No ref found. Dupe pair with comp-gradient-right-new.png. 9.)_
- `blindspot-radar.png` — 1915 KB _(was dynamic-unsure — No ref; RadarScanner uses scanner-bg.png. Byte-identical dup)_
- `radar-visualization.png` — 1915 KB _(was dynamic-unsure — No ref; RadarScanner uses scanner-bg.png. Byte-identical dup)_
- `comp-bg-texture.png` — 977 KB _(was dynamic-unsure — No ref found anywhere. Unused 977KB texture.)_
- `hero-macbook.png` — 572 KB _(was dynamic-unsure — No ref found; hero uses hero-dashboard-v2.png. Unused 572KB )_
- `Visibility context new.png` — 490 KB _(was dynamic-unsure — No ref found; byte-identical dupe of used scanner-bg.png (md)_
- `award-4.png` — 482 KB _(was dynamic-unsure — Footer uses /images/awards/award-4.png, not this cleansight )_
- `security-shield-hero.png` — 461 KB _(was dynamic-unsure — No ref found; Security section uses security-shield-complete)_
- `cta-screenshot.png` — 320 KB _(was dynamic-unsure — No ref found (CleanSightCTA uses cta-union.svg, not this). U)_
- `award-1.png` — 182 KB _(was dynamic-unsure — Footer references /images/awards/award-1.png, NOT this clean)_
- `unified-icon-default.svg` — 29 KB _(was dynamic-unsure — No ref; Unified cards use Ball1-4.png as iconSrc, not these )_
- `unified-icon-sbom.svg` — 28 KB _(was dynamic-unsure — No ref; Unified cards use Ball*.png as iconSrc. Unused 28KB )_
- `award-2.png` — 19 KB _(was dynamic-unsure — Footer uses /images/awards/award-2.png, not this cleansight )_
- `award-3.png` — 15 KB _(was dynamic-unsure — Footer uses /images/awards/award-3.png, not this cleansight )_
- `hero-wave-mesh.png` — 12 KB _(was dynamic-unsure — Mislabeled SVG (.png ext, actualFormat svg). No cleansight r)_
- `hero-wave-mesh.svg` — 12 KB _(was dynamic-unsure — No cleansight ref (VulnHero uses its own /images/vulnerabili)_
- `hero-grid.svg` — 11 KB _(was dynamic-unsure — Other heroes use their own folder copies (/images/newsroom\|)_
- `fv.png` — 8 KB _(was dynamic-unsure — No ref found; cryptic 2-letter name; 73px icon. Orphan.)_
- `uic.png` — 8 KB _(was dynamic-unsure — No ref found; cryptic name; 82px icon. Orphan.)_
- `sc.png` — 7 KB _(was dynamic-unsure — No ref found; cryptic 2-letter name; 83px icon. Orphan.)_
- `comp-gradient-left-new.png` — 4 KB _(was dynamic-unsure — No ref; '-new' junk suffix; byte-identical dupe of comp-grad)_
- `comp-gradient-left.png` — 4 KB _(was dynamic-unsure — No ref found. Dupe pair with comp-gradient-left-new.png. Orp)_
- `workflow-line.png` — 2 KB _(was dynamic-unsure — Mislabeled SVG (.png ext, actualFormat svg). No ref; Securit)_
- `workflow-line.svg` — 2 KB _(was dynamic-unsure — No ref; Security uses security-workflow-line.svg (byte-ident)_
- `comp-ellipse-small-left.svg` — 1 KB _(was dynamic-unsure — No ref found. Unused decorative ellipse SVG. Orphan.)_
- `comp-ellipse-large-left.svg` — 1 KB _(was dynamic-unsure — No ref found. Unused decorative ellipse SVG. Orphan.)_
- `comp-ellipse-small-right.svg` — 1 KB _(was dynamic-unsure — No ref found. Unused decorative ellipse SVG. Orphan.)_
- `comp-ellipse-large-right.svg` — 1 KB _(was dynamic-unsure — No ref found. Unused decorative ellipse SVG. Orphan.)_
- `security-shield-logo.svg` — 1 KB _(was dynamic-unsure — No ref; shield uses baked-in security-shield-complete.png. U)_
- `security-shield-arc-left.svg` — 1 KB _(was dynamic-unsure — No ref; shield uses baked-in security-shield-complete.png. U)_
- `security-shield-arc-right.svg` — 1 KB _(was dynamic-unsure — No ref; shield uses baked-in PNG. Unused arc SVG. Orphan.)_
- `security-vline-short.svg` — 1 KB _(was dynamic-unsure — No ref; workflow uses CSS dashed drop-lines, not these SVGs.)_
- `security-vline-tall.svg` — 1 KB _(was dynamic-unsure — No ref; workflow uses CSS dashed drop-lines. Unused. Orphan.)_
- `security-shield-vline.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused vertical-line SVG. Orphan.)_
- `comp-vector-right.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused decorative vector SVG. Orphan.)_
- `security-card-left.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused decorative card SVG. Orphan.)_
- `security-card-right.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused decorative card SVG. Orphan.)_
- `security-node-5.svg` — 0 KB _(was dynamic-unsure — WORKFLOW chart has only 4 steps (nodes 1-4). node-5 never fe)_
- `blindspot-ellipse-glow.svg` — 0 KB _(was dynamic-unsure — No ref found anywhere. Unused decorative SVG glow. Orphan.)_
- `comp-frame-icon.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused 24px icon SVG. Orphan.)_
- `security-wf-frame.svg` — 0 KB _(was dynamic-unsure — No ref found. Unused 41px workflow frame SVG. Orphan.)_

</details>
<details><summary><b>images/attack-surface-reduction</b> — 81 files, 23.7 MB</summary>

- `approach-bloat.png` — 2128 KB
- `approach-icon-2.png` — 2128 KB
- `bloated-container.png` — 1706 KB
- `approach-icon-4.png` — 1572 KB
- `approach-secure.png` — 1572 KB
- `approach-icon-1.png` — 1520 KB
- `approach-minimal.png` — 1520 KB
- `approach-deterministic.png` — 1433 KB
- `approach-icon-3.png` — 1433 KB
- `section-business.png` — 1237 KB
- `hero-card-bloated.png` — 772 KB
- `section-public-images.png` — 700 KB
- `hero-master.png` — 662 KB
- `cta-card-full-ref.png` — 599 KB
- `hero-card-clean.png` — 580 KB
- `figma-full-reference.png` — 472 KB
- `bloated-crate.png` — 405 KB
- `figma-section2.png` — 383 KB
- `cta-bird-new.png` — 364 KB
- `figma-hero.png` — 322 KB
- `section-business-mobile.png` — 269 KB
- `s4-person-mobile.png` — 258 KB
- `hero-bloated-card.png` — 238 KB
- `section-fits.png` — 188 KB
- `section-production.png` — 184 KB
- `section-cta.png` — 182 KB
- `figma-section4-delivers.jpg` — 168 KB
- `section-approach.png` — 167 KB
- `hero-flare-yellow.png` — 161 KB
- `figma-section6-modern.jpg` — 113 KB
- `section-fits-mobile.png` — 87 KB
- `figma-section5-fits.jpg` — 57 KB
- `figma-section3-approach.jpg` — 57 KB
- `section-cta-mobile.png` — 57 KB
- `section-public-images-mobile.png` — 57 KB
- `section-approach-mobile.png` — 47 KB
- `figma-section7-cta.jpg` — 45 KB
- `cta-bird.png` — 43 KB
- `section-production-mobile.png` — 40 KB
- `icon-ring.png` — 26 KB
- `icon-gear.png` — 23 KB
- `hero-mobile-cards.png` — 21 KB
- `hero-grid.svg` — 20 KB _(was used-weak — used-weak basename-only: all 5 refs point to /images/case-st)_
- `image 583137.png` — 19 KB
- `icon-toggle.png` — 19 KB
- `icon-monitor.png` — 16 KB
- `bloated-hex.svg` — 15 KB
- `union-pattern.svg` — 12 KB
- `approach-union-tr.svg` — 12 KB
- `hero-desktop-hex-bloated.svg` — 12 KB
- `cta-grid.svg` — 11 KB
- `hero-desktop-hex-clean.svg` — 11 KB
- `cta-union.svg` — 11 KB _(was used-weak — used-weak basename-only: all 8 refs point to /images/cleansi)_
- `approach-union-bl.svg` — 11 KB
- `hero-card-hex-clean.png` — 11 KB
- `hero-card-hex-bloated.png` — 4 KB
- `public-images-line-tr.svg` — 3 KB
- `public-images-line-tl.svg` — 3 KB
- `hero-card-cube-icon.png` — 3 KB
- `public-images-line-bl.svg` — 3 KB
- `public-images-line-br.svg` — 3 KB
- `bloated-card-inner.svg` — 3 KB
- `fits-card-grid.svg` — 3 KB
- `hero-bloat-icon.svg` — 2 KB
- `hero-clean-icon.svg` — 2 KB
- `hero-bloat-bottom.svg` — 2 KB
- `hero-clean-bottom.svg` — 2 KB
- `bloated-card-icon.svg` — 2 KB
- `public-images-shield-icon.svg` — 2 KB
- `hero-desktop-cube.svg` — 1 KB
- `cta-arrow.svg` — 1 KB
- `hero-bloat-glow.svg` — 1 KB
- `hero-clean-glow.svg` — 1 KB
- `approach-glow.svg` — 1 KB
- `hero-card-clean-icon.png` — 1 KB
- `delivers-divider.svg` — 1 KB
- `bloated-card-bg.svg` — 1 KB
- `business-delivers-separator.svg` — 1 KB
- `hero-desktop-logo.svg` — 0 KB
- `approach-card-bg.svg` — 0 KB
- `figma-.jpg` — 0 KB _(empty)_

</details>
<details><summary><b>images/cleanstart-images</b> — 51 files, 12.7 MB</summary>

- `section-uvp.png` — 2642 KB
- `uvp-bars.png` — 1907 KB
- `hero-diagram.png` — 1816 KB
- `section-browse.png` — 1115 KB
- `cta-cube.png` — 883 KB _(was used-weak — used-weak FALSE POSITIVE: all 12 refs point to other dirs (b)_
- `section-environment.png` — 878 KB
- `terminal.png` — 866 KB
- `perf-attack-surface.png` — 663 KB
- `perf-smaller-images.png` — 474 KB
- `perf-memory.png` — 423 KB
- `perf-pull-times.png` — 420 KB
- `browse-dashboard.png` — 290 KB
- `env-logos-row2.png` — 131 KB
- `env-logos-row1.png` — 128 KB
- `measure-reference.png` — 104 KB
- `workflows-feat-1.svg` — 29 KB
- `trust-ball-cube.png` — 29 KB
- `trust-ball-cube.svg` — 29 KB
- `trust-ball-refresh.png` — 28 KB
- `trust-ball-refresh.svg` — 28 KB
- `workflows-feat-3.svg` — 20 KB
- `uvp-blob-top-right.svg` — 12 KB
- `uvp-blob-bottom-left.svg` — 11 KB
- `stacks-ubuntu.svg` — 9 KB
- `stacks-ubuntu-color.svg` — 9 KB
- `stacks-couchdb.svg` — 9 KB
- `stacks-couchdb-color.svg` — 9 KB
- `stacks-postgresql-color.png` — 9 KB
- `stacks-php.svg` — 8 KB
- `stacks-php-color.svg` — 8 KB
- `stacks-redis.svg` — 8 KB
- `feature-ball.png` — 7 KB
- `stacks-postgresql.svg` — 5 KB
- `stacks-couchdb-color.png` — 5 KB
- `stacks-ubuntu-color.png` — 5 KB
- `stacks-redis-color.png` — 4 KB
- `workflows-feat-2.svg` — 4 KB
- `workflows-magic-wand.svg` — 2 KB
- `workflows-apps.png` — 2 KB
- `stacks-php-color.png` — 2 KB
- `cta-arrow.svg` — 1 KB
- `stacks-redis-color.svg` — 1 KB
- `uvp-card-glow.svg` — 1 KB
- `uvp-divider-vertical.svg` — 1 KB
- `workflows-vector-left.svg` — 0 KB
- `workflows-vector-right.svg` — 0 KB
- `workflows-mobile-curve-right.svg` — 0 KB
- `workflows-mobile-curve-left.svg` — 0 KB
- `workflows-line-left.svg` — 0 KB
- `workflows-line-right.svg` — 0 KB
- `workflows-feat-divider.svg` — 0 KB

</details>
<details><summary><b>images/teams</b> — 7 files, 11.1 MB</summary>

- `hustle-squad-1.png` — 11276 KB
- `ellipse-mask.svg` — 32 KB
- `linkedin-btn.svg` — 3 KB
- `linkedin-icon.svg` — 3 KB
- `quote-icon.svg` — 1 KB
- `line-accent-a.svg` — 1 KB
- `line-accent-b.svg` — 1 KB

</details>
<details><summary><b>images/sbom</b> — 29 files, 10.3 MB</summary>

- `ball-pattern.png` — 1513 KB
- `mobile-risk-2.png` — 1016 KB
- `mobile-risk-icon-2.png` — 1016 KB
- `sbom-screenshot.png` — 967 KB
- `adv-logo.png` — 809 KB
- `cleanstart-3d-logo.png` — 809 KB
- `mobile-risk-3.png` — 782 KB
- `mobile-risk-icon-3.png` — 782 KB
- `mobile-risk-4.png` — 763 KB
- `mobile-risk-icon-4.png` — 763 KB
- `mobile-risk-1.png` — 474 KB
- `mobile-risk-icon-1.png` — 474 KB
- `cta-bird.png` — 364 KB
- `icon-cubes.svg` — 29 KB
- `adv-union.svg` — 11 KB
- `adv-blob.svg` — 11 KB
- `adv-ellipse-2.svg` — 1 KB
- `adv-ellipse-4.svg` — 1 KB
- `adv-check.svg` — 1 KB
- `check-icon.svg` — 1 KB
- `adv-ellipse-1.svg` — 1 KB
- `adv-ellipse-3.svg` — 1 KB
- `mobile-risk-icon-glow.svg` — 1 KB
- `mobile-risk-glow-v2.svg` — 1 KB
- `risk-icon-glow.svg` — 1 KB
- `mobile-risk-card-bg-v2.svg` — 0 KB
- `mobile-risk-card-bg.svg` — 0 KB
- `circle-connector.svg` — 0 KB
- `self-update-lines.svg` — 0 KB

</details>
<details><summary><b>images/ciso</b> — 26 files, 10.3 MB</summary>

- `comp-gradient-right.png` — 9117 KB
- `cta-cube.png` — 883 KB _(was used-weak — used-weak false positive: all 12 refs point to /images/blog-)_
- `rrsv.png` — 382 KB
- `enterprise-ball-cloud.svg` — 29 KB
- `enterprise-ball-users.svg` — 29 KB
- `enterprise-icon-security.svg` — 29 KB
- `enterprise-ball-compliance.svg` — 28 KB
- `risks-union-tr.svg` — 12 KB
- `risks-union-bl.svg` — 11 KB
- `comp-gradient-left.png` — 4 KB
- `comp-card-mask.svg` — 3 KB
- `comp-flare.svg` — 1 KB
- `comp-badge-arrow4.svg` — 1 KB
- `outcomes-glow-bar3.svg` — 1 KB
- `comp-ellipse.svg` — 1 KB
- `risks-ellipse.svg` — 1 KB
- `comp-hex-vector.svg` — 0 KB
- `comp-vector.svg` — 0 KB
- `solution-card-mask.svg` — 0 KB
- `comp-frame.svg` — 0 KB
- `comp-badge-arrow3.svg` — 0 KB
- `solution-ellipse-c.svg` — 0 KB
- `solution-card-shine.svg` — 0 KB
- `solution-ellipse-d.svg` — 0 KB
- `comp-badge-arrow2.svg` — 0 KB
- `comp-badge-arrow1.svg` — 0 KB

</details>
<details><summary><b>images/for-developers/secure</b> — 8 files, 9.9 MB</summary>

- `card-gradient-right.png` — 9117 KB
- `card-texture.png` — 977 KB
- `card-gradient-left.png` — 4 KB
- `arrow-4.svg` — 1 KB
- `card-hex.svg` — 0 KB
- `arrow-3.svg` — 0 KB
- `arrow-2.svg` — 0 KB
- `arrow-1.svg` — 0 KB

</details>
<details><summary><b>images/hero</b> — 12 files, 8 MB</summary>

- `orb-figma.png` — 1502 KB
- `orb-sphere.png` — 1463 KB
- `orb-scene.png` — 1394 KB
- `orb-full-scene.png` — 1351 KB
- `orb-cube.svg` — 917 KB
- `orb-chromatic-ring.png` — 460 KB
- `beam-right-1.png` — 272 KB
- `beam-left-2.png` — 267 KB
- `beam-left-1.png` — 255 KB
- `beam-right-2.png` — 186 KB
- `orb-cube.png` — 105 KB
- `cs-logo.png` — 1 KB

</details>
<details><summary><b>images/sca</b> — 17 files, 4.9 MB</summary>

- `transform-ball-new.svg` — 2051 KB
- `sca-full-hires.png` — 1584 KB
- `transform-cube.png` — 809 KB
- `sca-full-page.png` — 388 KB
- `hero-3d-illustration1.png` — 115 KB
- `center-ball-logo.svg` — 28 KB
- `workflows-vector.svg` — 12 KB
- `transform-ball.png` — 8 KB
- `cta-cube.svg` — 1 KB
- `transform-ball.svg` — 1 KB
- `workflows-panel-glow.svg` — 1 KB
- `workflows-ellipse.svg` — 1 KB
- `security-emblem.svg` — 1 KB
- `ball-icon.svg` — 1 KB
- `security-card-left.svg` — 0 KB
- `security-card-right.svg` — 0 KB
- `built-for-dev-image.svg` — 0 KB

</details>
<details><summary><b>images/community</b> — 19 files, 4.3 MB</summary>

- `ball-pattern.png` — 1513 KB
- `avatar-kevin.png` — 994 KB
- `testimonial-avatar-1.png` — 994 KB
- `cta-3d-element.png` — 883 KB
- `testimonial-vector.svg` — 11 KB
- `testimonial-union.svg` — 4 KB
- `testimonial-quote-lg.svg` — 2 KB
- `testimonial-quote-sm.svg` — 2 KB
- `ball-hardlight.svg` — 1 KB
- `testimonial-btn-prev.svg` — 1 KB
- `testimonial-btn-next.svg` — 1 KB
- `ball-light-fill.svg` — 1 KB
- `ball-light-mask.svg` — 1 KB
- `logo-5.png` — 1 KB
- `logo-uhg.png` — 1 KB
- `card-shadow-bottom.svg` — 1 KB
- `card-shadow-top.svg` — 1 KB
- `testimonial-card-bg.svg` — 0 KB
- `logo-6.png` — 0 KB

</details>
<details><summary><b>images</b> — 13 files, 3.7 MB</summary>

- `factory-card-3.png` — 683 KB
- `factory-card-4.png` — 683 KB
- `factory-card-5.png` — 683 KB
- `factory-card-1.png` — 683 KB
- `factory-card-2.png` — 683 KB
- `kubr-bird.png` — 274 KB
- `cta-kubr.png` — 49 KB
- `gear-orb.png` — 24 KB
- `logo-cleanstart.png` — 5 KB
- `engine-arrow.svg` — 3 KB
- `cs-logo-nav.png` — 2 KB
- `logo-cleanstart-icon.png` — 1 KB
- `help-cards-bg.svg` — 0 KB

</details>
<details><summary><b>images/about</b> — 32 files, 3.6 MB</summary>

- `founders-photo.png` — 1541 KB
- `award-badge-4.png` — 482 KB
- `founders2.png` — 466 KB
- `founders.png` — 448 KB
- `powering-flare-mask2.png` — 341 KB
- `award-badge-1.png` — 182 KB
- `feature-card-icon.svg` — 29 KB
- `powering-ball-icon.svg` — 29 KB
- `powering-div-131.png` — 21 KB
- `award-badge-2.png` — 19 KB
- `Ball1.png` — 15 KB _(was used-weak — used-weak false positive: ref is /images/cleansight/Ball1.pn)_
- `Ball2.png` — 15 KB _(was used-weak — used-weak false positive: refs are cleansight/Ball2.png & pa)_
- `Ball3.png` — 15 KB _(was used-weak — used-weak false positive: refs are cleansight/Ball3.png & pa)_
- `award-badge-3.png` — 15 KB
- `powering-div-51.png` — 8 KB
- `icon-social-discord.svg` — 4 KB
- `icon-social-github.svg` — 2 KB
- `icon-social-linkedin.svg` — 2 KB
- `icon-social-x.svg` — 2 KB
- `logo-postgresql.svg` — 1 KB
- `icon-social-youtube-bg.svg` — 1 KB
- `vision-bg-blob-1.svg` — 1 KB
- `vision-bg-blob-2.svg` — 1 KB
- `powering-div-bottom.svg` — 1 KB
- `ellipse-glow.svg` — 1 KB _(was used-weak — used-weak false positive: all 9 refs use other folders' *-el)_
- `powering-flare-mask.svg` — 1 KB
- `powering-div-line.svg` — 1 KB
- `award-badge-frame.svg` — 0 KB
- `cta-3d-cube.svg` — 0 KB
- `feature-card-bg.svg` — 0 KB
- `powering-card-shadow.svg` — 0 KB
- `story-mask.svg` — 0 KB

</details>
<details><summary><b>(public root)</b> — 6 files, 2.8 MB</summary>

- `404.png` — 2887 KB
- `next.svg` — 1 KB
- `globe.svg` — 1 KB
- `file.svg` — 0 KB
- `window.svg` — 0 KB
- `vercel.svg` — 0 KB

</details>
<details><summary><b>images/cleanstart-platform</b> — 26 files, 1.8 MB</summary>

- `arch-bg-texture.png` — 831 KB
- `arch-cube.png` — 687 KB
- `cta-screenshot.png` — 320 KB
- `hero-bg-vector.svg` — 12 KB
- `trust-corner-union.svg` — 4 KB
- `trust-flow-line-2.svg` — 3 KB
- `trust-flow-line-3.svg` — 3 KB
- `trust-flow-line-1.svg` — 3 KB
- `arrow-right.svg` — 1 KB
- `rail-474.svg` — 1 KB
- `rail-473.svg` — 1 KB
- `rail-478.svg` — 1 KB
- `rail-476.svg` — 1 KB
- `arch-circles.svg` — 1 KB
- `cta-glow-1.svg` — 1 KB _(was used-weak — used-weak basename false-positive: all 4 refs point to /imag)_
- `outputs-corner-glow.svg` — 1 KB
- `trust-corner-glow.svg` — 1 KB
- `cta-glow-2.svg` — 1 KB _(was used-weak — used-weak basename false-positive: all 4 refs point to /imag)_
- `trust-arrow-down.svg` — 1 KB
- `trust-arrow-left.svg` — 1 KB
- `trust-arrow-right.svg` — 1 KB
- `trust-arrow-up.svg` — 1 KB
- `arch-rail-l.svg` — 0 KB
- `rail-477.svg` — 0 KB
- `arch-rail-r.svg` — 0 KB
- `rail-475.svg` — 0 KB

</details>
<details><summary><b>images/podcast</b> — 1 files, 1.6 MB</summary>

- `cta-card-icon-54efec.png` — 1591 KB

</details>
<details><summary><b>images/for-developers/workflows</b> — 9 files, 1.5 MB</summary>

- `ball-pattern.png` — 1513 KB
- `icon-cicd-card.svg` — 29 KB
- `icon-other-card.svg` — 29 KB
- `ball-hard-light.svg` — 1 KB
- `ball-light-img.svg` — 1 KB
- `ball-light-mask.svg` — 1 KB
- `center-card-mask.svg` — 0 KB
- `arrow-curved.svg` — 0 KB
- `center-card-mask-img.svg` — 0 KB

</details>
<details><summary><b>images/blogs</b> — 4 files, 0.9 MB</summary>

- `cta-orb.png` — 883 KB
- `card-category-badge-bg.png` — 3 KB
- `icon-clock.svg` — 1 KB
- `hero-meta-separator.svg` — 0 KB

</details>
<details><summary><b>images/vulnerability-remediation</b> — 2 files, 0.7 MB</summary>

- `cta-decoration.png` — 479 KB
- `figma-s5-reference.png` — 247 KB

</details>
<details><summary><b>images/fips</b> — 10 files, 0.4 MB</summary>

- `why-2.png` — 176 KB
- `cube-impact.png` — 144 KB
- `Settingv.svg` — 35 KB
- `why-icon-validated-crypto.svg` — 28 KB
- `why-icon-secure-boot.svg` — 18 KB
- `why-icon-compliance-docs.svg` — 18 KB
- `Settingv.png` — 15 KB
- `why-icon-centralized-mgmt.svg` — 9 KB
- `why-icon-compliance-monitoring.svg` — 8 KB
- `Ball.svg` — 6 KB

</details>
<details><summary><b>images/blog-detail/cta</b> — 2 files, 0.3 MB</summary>

- `cta-screenshot.png` — 320 KB
- `cta-arrow.svg` — 1 KB

</details>
<details><summary><b>images/book-a-demo</b> — 4 files, 0.2 MB</summary>

- `trusted-marquee.png` — 75 KB
- `trusted-marquee.svg` — 57 KB
- `hero-grid.png` — 30 KB
- `hero-grid.svg` — 14 KB _(was used-weak — used-weak basename-only. Verified all 5 refs point to OTHER )_

</details>
<details><summary><b>images/partners</b> — 23 files, 0.2 MB</summary>

- `ngit.webp` — 53 KB _(was used-weak — used-weak false positive: only /partners/global/ngit.webp re)_
- `surakshate.webp` — 27 KB _(was used-weak — used-weak false positive: only /partners/global/surakshate.w)_
- `logo-ecaps.svg` — 25 KB
- `sec-forte.webp` — 7 KB _(was used-weak — used-weak false positive: only /partners/global/sec-forte.we)_
- `hitachi.png` — 5 KB _(was used-weak — used-weak false positive: PartnersNetwork uses /partners/glo)_
- `fortifire.png` — 4 KB
- `cyber.png` — 3 KB
- `logo-cybernx.png` — 3 KB
- `fortifire-icon.png` — 3 KB _(was used-weak — used-weak false positive: only /partners/global/fortifire-ic)_
- `citius.png` — 3 KB _(was used-weak — used-weak false positive: PartnersNetwork refs /partners/glo)_
- `logo-citius-cloud.png` — 3 KB
- `logo-seesec.png` — 3 KB
- `seesec.png` — 3 KB _(was used-weak — used-weak false positive: only /partners/global/seesec.png r)_
- `logo-r-tech.png` — 2 KB
- `rtech.png` — 2 KB _(was used-weak — used-weak false positive: only /partners/global/rtech.png re)_
- `hitachi 1.png` — 2 KB
- `ecaps.png` — 2 KB _(was used-weak — used-weak false positive: only /partners/global/ecaps.png is)_
- `logo-ecaps.png` — 2 KB
- `logo-hitachi-systems.png` — 1 KB
- `imperium.png` — 1 KB _(was used-weak — used-weak false positive: only /partners/global/imperium.png)_
- `logo-imperium.png` — 1 KB
- `logo-esec-forte.png` — 1 KB
- `esec.webp` — 0 KB

</details>
<details><summary><b>images/cleanstart-factory</b> — 5 files, 0.1 MB</summary>

- `factory-flare-changecolor.webp` — 115 KB _(was dynamic-unsure — dynamic-unsure resolved ORPHAN: zero refs in src (folder's o)_
- `factory-icons.webp` — 7 KB _(was dynamic-unsure — dynamic-unsure resolved ORPHAN: zero refs; per-card icons us)_
- `factory-card-mask.svg` — 3 KB _(was dynamic-unsure — dynamic-unsure resolved ORPHAN: zero refs; card masking now )_
- `factory-accent.svg` — 1 KB _(was dynamic-unsure — dynamic-unsure resolved ORPHAN: zero refs in src. 781B unuse)_
- `factory-flare-mask.svg` — 1 KB _(was dynamic-unsure — dynamic-unsure resolved ORPHAN: zero refs; flare clipping no)_

</details>
<details><summary><b>images/blog-detail</b> — 7 files, 0.1 MB</summary>

- `share-icon-whatsapp.png` — 48 KB
- `share-icon-twitter.png` — 14 KB
- `share-icon-instagram.png` — 5 KB
- `related-card-category-bg.png` — 3 KB
- `share-icon-linkedin.png` — 1 KB
- `share-icon-facebook.svg` — 1 KB
- `icon-read-more-arrow.svg` — 0 KB

</details>
<details><summary><b>images/attack-surface-reduction/Final</b> — 3 files, 0 MB</summary>

- `hero-glow.png` — 41 KB
- `Group 2085665239.png` — 3 KB
- `card-inner-grid.png` — 3 KB

</details>
<details><summary><b>images/cleanstart-images/environment</b> — 5 files, 0 MB</summary>

- `image 583142.png` — 14 KB
- `image 583139.png` — 12 KB
- `image 583143.png` — 8 KB
- `image 583140.png` — 7 KB
- `image 583141.png` — 6 KB

</details>
<details><summary><b>images/resource-center</b> — 2 files, 0 MB</summary>

- `footer-grid.svg` — 36 KB
- `card-badge-bg.png` — 2 KB

</details>
<details><summary><b>images/for-developers</b> — 14 files, 0 MB</summary>

- `logo-postgresql.svg` — 5 KB
- `logo-nginx.png` — 3 KB
- `logo-redis.png` — 3 KB
- `logo-nodejs.png` — 2 KB
- `logo-java.svg` — 2 KB
- `logo-nodejs.svg` — 2 KB
- `logo-python.svg` — 1 KB
- `logo-mongodb.png` — 1 KB
- `logo-python.png` — 1 KB
- `logo-postgresql.png` — 1 KB
- `logo-redis.svg` — 1 KB
- `logo-mongodb.svg` — 1 KB
- `logo-nginx.svg` — 0 KB
- `logo-java.png` — 0 KB

</details>
<details><summary><b>images/footer</b> — 2 files, 0 MB</summary>

- `instrumentation.webp` — 5 KB
- `fortress.webp` — 4 KB

</details>
<details><summary><b>images/news-detail</b> — 1 files, 0 MB</summary>

- `icon-calendar-hero.svg` — 5 KB

</details>
<details><summary><b>images/contact/form</b> — 3 files, 0 MB</summary>

- `recaptcha-icon.png` — 3 KB
- `arrow-right.svg` — 1 KB
- `submit-glow.svg` — 1 KB

</details>
<details><summary><b>images/partners/global</b> — 1 files, 0 MB</summary>

- `fortifire.png` — 4 KB

</details>
<details><summary><b>images/contact</b> — 1 files, 0 MB</summary>

- `hero-grid.svg` — 0 KB _(was used-weak — used-weak FALSE POSITIVE: all 5 refs point at sibling hero-g)_

</details>

## 📐 Convert & resize candidates

All conversions preserve alpha (WebP, never JPEG). Icons/logos convert near-lossless with **no downscaling**; only oversized photos/gradients are resized. `est` = estimated post size.

| Path                                                            | Class      | Fmt  | KB now | WxH        | alpha | Action         | Target | Resize                                      | est KB | Why                                                                                  |
| --------------------------------------------------------------- | ---------- | ---- | -----: | ---------- | :---: | -------------- | ------ | ------------------------------------------- | -----: | ------------------------------------------------------------------------------------ |
| images/cleanstart-platform/hero-cube.png                        | gradient   | png  |   3047 | 4096×3065 |  ✓  | resize+convert | webp   | cap longest edge ~852px                     |     79 | 3MB 4096x3065 hasAlpha but rendered width=426 height=443 sizes=426px in Platform     |
| images/community/hero-photo.png                                 | photo      | png  |   2634 | 3025×1414 |      | resize+convert | webp   | cap longest edge ~1920px                    |    637 | Full-bleed hero bg photo, decorative alt='' img, w-full object-cover. 2.6MB@3025     |
| images/fips/hub-wheel.png                                       | gradient   | png  |   2627 | 1773×1793 |  ✓  | convert        | webp   |                                             |   1576 | 2627KB 1773x1793, next/image sizes max 932px → ~1864px@2x ≈ native, right-sized;   |
| images/ciso/hero-photo.png                                      | photo      | png  |   2392 | 2000×1143 |  ✓  | resize+convert | webp   | cap longest edge ~1600px                    |    919 | 2.4MB 2000x1143 alpha hero person photo, decorative (alt=''/aria-hidden), render     |
| images/attack-surface-reduction/fits-icon-2.png                 | icon       | png  |   2128 | 3200×3200 |  ✓  | convert        | webp   | cap longest edge ~320px                     |   1277 | AsrFitsBuilt img aria-hidden (Pipeline Compatible); 3200x3200 2128KB rendered <=     |
| images/newsroom/hero-earth.png                                  | photo      | png  |   1953 | 1254×1254 |      | convert        | webp   |                                             |   1172 | Decorative earth, alt='' aria-hidden, rendered in 1600px box object-contain (ble     |
| images/attack-surface-reduction/public-images-container.png     | photo      | png  |   1706 | 1383×1137 |      | resize+convert | webp   | cap longest edge ~900px                     |    433 | ASRBloated container illustration img alt=''; 1383x1137 1706KB no-alpha rendered     |
| images/sbom/infinity-circuit.png                                | photo      | png  |   1677 | 1273×939  |      | resize+convert | webp   | cap longest edge ~1024px                    |    651 | 1273x939 1677KB rendered at 512px (sizes 512px) object-cover; oversized. Byte-id     |
| images/sca/workflows-hero.png                                   | photo      | png  |   1677 | 1273×939  |      | resize+convert | webp   | cap longest edge ~1424px (2x of 712 render) |   1006 | 1677KB 1273x939 no-alpha, sizes max 712px (SCABuiltForDev L130-134). DUPE of sbo     |
| images/attack-surface-reduction/fits-icon-3.png                 | icon       | png  |   1572 | 3200×3200 |  ✓  | convert        | webp   | cap longest edge ~320px                     |    943 | AsrFitsBuilt img aria-hidden (Deploy Anywhere); 3200x3200 1572KB rendered <=160p     |
| images/attack-surface-reduction/fits-icon-1.png                 | icon       | png  |   1520 | 3200×3200 |  ✓  | convert        | webp   | cap longest edge ~320px                     |    912 | AsrFitsBuilt img aria-hidden (Drop-in Images); 3200x3200 1520KB rendered clamp(1     |
| images/resource-center/cover-poster/datasheet-report.png        | gradient   | png  |   1212 | 1734×907  |      | resize+convert | webp   | cap longest edge ~1100px                    |    293 | Datasheet/report booklet template, 1212KB 1734x907 no-alpha; rendered <=839px (d     |
| images/fips/regulated-photo.png                                 | photo      | png  |   1082 | 1922×669  |  ✓  | resize+convert | webp   | cap longest edge ~1600px                    |    450 | 1082KB 1922x669 full-bleed bg, objectFit cover, blur(1.5px) decorative; downscal     |
| images/cleanstart-images/uvp-icon-attack-surface.png            | icon       | png  |   1016 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px (2x rendered)       |     50 | WhyMattersGrid img alt='3D shield icon...' rendered <=170px desktop slot; 1254x1     |
| images/cleanstart-images/hero-3d-container.png                  | photo      | png  |   1010 | 1313×1198 |  ✓  | resize+convert | webp   | cap longest edge ~1050px (2x rendered)      |    388 | next/image sizes='(max-width:1024px) 80vw, 523px' rendered max 523px; 1313x1198      |
| images/teams/sanket-modi.png                                    | photo      | png  |    994 | 1024×1135 |      | resize+convert | webp   | cap longest edge ~128px                     |      8 | 994KB 1024x1135 PNG rendered as 47px circular testimonial avatar (size-[47px], s     |
| images/attack-surface-reduction/business-photo.jpg              | photo      | jpg  |    981 | 1128×832  |      | convert        | webp   |                                             |    589 | AsrBusinessDelivers full-bleed bg img aria-hidden alt=''; 1128x832 981KB JPG no      |
| images/sbom/platforms-3d.png                                    | gradient   | png  |    967 | 4044×2172 |  ✓  | resize+convert | webp   | cap longest edge ~1744px                    |    108 | 4044x2172 967KB hasAlpha rendered width=872 (sizes 872px) object-contain; ~4.6x      |
| images/cleansight/vs-badge.png                                  | decorative | png  |    954 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~500px                     |     91 | Comparison 'VS' badge, next/image alt='' width=252 sizes='200px'; native 1254px      |
| images/ciso/comp-vs-badge.png                                   | logo       | png  |    954 | 1254×1254 |  ✓  | convert        | webp   |                                             |    572 | 954KB 1254x1254 alpha 'VS' badge rendered <=160px (Image w252 sizes 200px); badg     |
| images/blogs/hero-orb-top.png                                   | gradient   | png  |    883 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~550px                     |    102 | Heaviest asset: 883KB 1254x1254 alpha orb, shared across 6 detail-hero variants,     |
| images/book-a-demo/hero-cube-left.png                           | decorative | png  |    883 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~840px                     |    238 | Decorative gem, alt='' aria-hidden, shared deal-registration+DemoHero. 883KB 125     |
| images/book-a-demo/hero-cube-right.png                          | decorative | png  |    883 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~840px                     |    238 | Mirror of hero-cube-left, alt='' shared deal-registration+DemoHero. 883KB 1254px     |
| images/cleansight/blindspot-corner-hex.png                      | decorative | png  |    883 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~830px                     |    232 | Decorative corner hex, next/image alt='' sizes='591px' width=415; native 1254px      |
| images/resource-center/hero-cube.png                            | decorative | png  |    883 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~600px                     |    121 | Decorative hero cube, alt='' aria-hidden opacity 0.4, color-dodge blend. 883KB 1     |
| images/error/page-not-found-illustration.png                    | photo      | png  |    870 | 1120×928  |  ✓  | resize+convert | webp   | cap longest edge ~1040px                    |    450 | 404 illustration, alt='' (decorative beside heading text). 870KB 1120x928 alpha,     |
| images/cleanstart-images/uvp-icon-pull-times.png                | icon       | png  |    826 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px (2x rendered)       |     41 | WhyMattersGrid img alt='3D box icon...' rendered <=170px slot; 1254x1254 826KB 3     |
| images/about/vision-target.png                                  | photo      | png  |    824 | 4096×2731 |  ✓  | resize+convert | webp   | cap longest edge ~1600px                    |     75 | Illustration, hasAlpha->webp. 4096x2731 src, width=418 sizes='(min-width:1024px)     |
| images/about/icon-secure-foundation.png                         | icon       | png  |    823 | 1254×1254 |  ✓  | convert        | webp   |                                             |    494 | Pillar icon (alt='Trust by Design'), data-array. 1254px src rendered 100px (size     |
| images/fips/cube-impact-transparent.png                         | gradient   | png  |    809 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~760px                     |    178 | 809KB 1254x1254, rendered clamp(200px,25.63vw,369px) max ~369px → ~738px@2x; alp    |
| images/for-developers/workflows/cube-image.png                  | gradient   | png  |    809 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~320px                     |     32 | CleanStart cube render, next/image desktop w77 h84 / mobile w48 h52. Src 1254px/     |
| images/sca/center-card-cube.png                                 | decorative | png  |    809 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~200px                     |     12 | 809KB 1254x1254 alpha decorative cube, rendered width=91 height=99 (SCATransform     |
| images/about/hero-3d-figma.png                                  | decorative | png  |    775 | 1254×1254 |  ✓  | convert        | webp   |                                             |    465 | Decorative hero 3D layer, hasAlpha->webp. 1254x1254 rendered ~131% of a hero box     |
| images/about/hero-3d-object.png                                 | decorative | png  |    775 | 1254×1254 |  ✓  | convert        | webp   |                                             |    465 | Decorative hero 3D object, hasAlpha->webp. width=743 height=811 render, 1254px s     |
| images/cleanstart-images/workflows-center-cube.png              | decorative | png  |    774 | 876×1024  |  ✓  | resize+convert | webp   | cap longest edge ~180px (2x rendered)       |     14 | img aria-hidden alt='' width=77 height=90 rendered ~77x90px; 876x1024 774KB 3D c     |
| images/about/founders-photo2.png                                | photo      | png  |    767 | 1289×643  |      | convert        | webp   |                                             |    460 | Desktop landscape founders photo, no alpha, object-cover full-bleed. 1289x643 ne     |
| images/resource-center/cover-poster/ebook-cover.png             | gradient   | png  |    726 | 1060×552  |  ✓  | resize+convert | webp   | cap longest edge ~1100px                    |    436 | Ebook booklet template (resourceCoverPoster ebook case); decorative bg with titl     |
| images/for-developers/why/icon-vulnerabilities.png              | gradient   | png  |    726 | 1536×1024 |  ✓  | resize+convert | webp   | cap longest edge ~360px                     |     24 | Mobile illustration in 108x87 frame (w115 h71). Src 1536x1024/726KB rendered ~11     |
| images/for-developers/why/icon-remediation.png                  | gradient   | png  |    697 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px                     |     34 | Mobile illustration in 108x87 frame (w93 h93). Src 1254px/697KB rendered ~93px;      |
| images/about/icon-continuous-compliance.png                     | icon       | png  |    671 | 1254×1254 |  ✓  | convert        | webp   |                                             |    403 | Pillar icon (alt='Verifiable by Default'), data-array. 1254px src rendered 100px     |
| images/cleansight/problem-audit-complexity.png                  | photo      | png  |    663 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~760px                     |    146 | WhyMattersGrid card`<img>` alt='Audit complexity illustration'; 1254px native ren  |
| images/for-developers/why/card-development.png                  | gradient   | png  |    663 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~640px                     |    104 | Desktop illustration, img in clamp(160,15.4vw,222) box. Src 1254px/663KB rendere     |
| images/sbom/risk-icon-compliance.png                            | icon       | png  |    663 | 1254×1254 |  ✓  | convert        | webp   |                                             |    398 | 3D icon 1254x1254 663KB hasAlpha; img in WhyMattersGrid card alt='Compliance Exp     |
| images/attack-surface-reduction/approach-icon-bloat.png         | icon       | png  |    656 | 1254×1254 |  ✓  | convert        | webp   | cap longest edge ~340px                     |    394 | ASRApproach WhyMattersGrid img alt 'Bloat removed icon'; 1254x1254 rendered clam     |
| images/attack-surface-reduction/approach-icon-deterministic.png | icon       | png  |    652 | 1254×1254 |  ✓  | convert        | webp   | cap longest edge ~340px                     |    391 | ASRApproach img alt 'Deterministic builds icon'; 1254x1254 rendered <=170px box;     |
| images/ciso/risks-icon-attack.png                               | icon       | png  |    643 | 1254×1254 |  ✓  | convert        | webp   |                                             |    386 | 643KB 1254x1254 alpha icon via WhyMattersGrid, alt='Expanding attack surface ico     |
| images/cleansight/security-crystal.png                          | decorative | png  |    639 | 1644×1150 |  ✓  | resize+convert | webp   | cap longest edge ~1300px                    |    240 | Decorative crystal`<img>` aria-hidden opacity .4, rendered max ~630px (min(630px,  |
| images/vulnerability-remediation/s5-bg-decoration.png           | gradient   | png  |    639 | 1644×1150 |  ✓  | resize+convert | webp   | cap longest edge ~1488px                    |    314 | Decorative bg glow, alt='' aria-hidden, opacity 0.4, lg-only, used twice. next/i     |
| images/cleanstart-images/uvp-icon-smaller-images.png            | icon       | png  |    627 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px (2x rendered)       |     31 | WhyMattersGrid img alt='3D icon representing image size reduction' rendered <=17     |
| images/advantage-bg.jpg                                         | photo      | jpg  |    623 | 1920×817  |      | convert        | webp   |                                             |    374 | Full-bleed desktop bg (fill, sizes=100vw, alt='', blurred behind overlay). 623KB     |
| images/ciso/risks-icon-backlogs.png                             | icon       | png  |    614 | 1254×1254 |  ✓  | convert        | webp   |                                             |    368 | 614KB 1254x1254 alpha icon via WhyMattersGrid, alt='Remediation backlogs icon';      |
| images/ciso/risks-icon-inherited.png                            | icon       | png  |    609 | 1316×1195 |  ✓  | convert        | webp   |                                             |    365 | 609KB 1316x1195 alpha icon via WhyMattersGrid, alt='Inherited vulnerabilities ic     |
| images/attack-surface-reduction/approach-icon-secure.png        | icon       | png  |    608 | 1254×1254 |  ✓  | convert        | webp   | cap longest edge ~340px                     |    365 | ASRApproach img alt 'Secure defaults icon'; 1254x1254 rendered <=170px box; 608K     |
| images/cleanstart-images/uvp-icon-memory.png                    | icon       | png  |    601 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px (2x rendered)       |     30 | WhyMattersGrid img alt='3D cloud icon...' rendered <=170px slot; 1254x1254 601KB     |
| images/for-developers/why/icon-development.png                  | gradient   | png  |    590 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~360px                     |     29 | Mobile illustration in 108x87 frame (w74 h83). Src 1254px/590KB rendered ~83px;      |
| images/teams/cta-cube.png                                       | decorative | png  |    582 | 812×886   |  ✓  | convert        | webp   |                                             |    349 | Decorative 3D cube img alt='' opacity .75, height:130% of CTA card (renders larg     |
| images/resource-center/cover-poster/architecture-insights.png   | gradient   | png  |    577 | 1060×564  |  ✓  | resize+convert | webp   | cap longest edge ~1100px                    |    346 | Branded booklet template; resource title overlaid as live`<span>`, so img is deco  |
| images/about/icon-full-visibility.png                           | icon       | png  |    569 | 1254×1254 |  ✓  | convert        | webp   |                                             |    342 | Pillar icon (alt='Security Without Friction'), data-array. 1254px src rendered 1     |
| images/resource-center/cover-poster/datasheet-cover.png         | gradient   | png  |    519 | 1060×564  |  ✓  | resize+convert | webp   | cap longest edge ~1100px                    |    311 | Whitepaper booklet template; home rail renders via next/image fill sizes='(max-w     |
| images/for-developers/why/icon-bloated.png                      | gradient   | png  |    499 | 1024×1024 |  ✓  | resize+convert | webp   | cap longest edge ~360px                     |     37 | Mobile 3D illustration in 108x87 frame (w84 h84). Src 1024px/499KB rendered ~84p     |
| images/cleansight/scanner-bg.png                                | decorative | png  |    490 | 580×565   |  ✓  | convert        | webp   |                                             |    294 | RadarScanner aria-hidden next/image fill, sizes 280-580px; native 580px ~ render     |
| images/awards/award-4.png                                       | logo       | png  |    482 | 1024×1023 |  ✓  | convert        | webp   |                                             |    289 | Footer AICPA SOC 2 cert badge, alt={name}. 482KB 1024x1023 alpha rendered small      |
| images/cleansight/problem-shadow-containers.png                 | photo      | png  |    474 | 1324×1189 |  ✓  | resize+convert | webp   | cap longest edge ~760px                     |     94 | WhyMattersGrid card`<img>` alt='Shadow container illustration'; 1324px native ove  |
| images/for-developers/why/card-bloated.png                      | gradient   | png  |    474 | 1324×1189 |  ✓  | resize+convert | webp   | cap longest edge ~640px                     |     66 | Desktop 3D illustration, img in clamp(160px,15.4vw,222px) box (w86.53% crop). Sr     |
| images/sbom/risk-icon-incomplete.png                            | icon       | png  |    474 | 1324×1189 |  ✓  | convert        | webp   |                                             |    284 | 3D icon 1324x1189 474KB hasAlpha; img in WhyMattersGrid card alt='Incomplete Vis     |
| images/sca/security-shield.png                                  | decorative | png  |    461 | 1448×1086 |  ✓  | resize+convert | webp   | cap longest edge ~1100px                    |    160 | 461KB 1448x1086 alpha emblem in clamp(180,34.8%,444) box scaled to 196% w (SCASe     |
| images/attack-surface-reduction/bloated-container2.png          | photo      | png  |    429 | 675×603   |  ✓  | convert        | webp   |                                             |    258 | ASRBloated decorative img aria-hidden alt=''; 675x603 alpha rendered 560px deskt     |
| images/cleansight/problem-fragmented-views.png                  | photo      | png  |    423 | 1323×1189 |  ✓  | resize+convert | webp   | cap longest edge ~760px                     |     84 | WhyMattersGrid card`<img>` alt='Fragmented views illustration'; 1323px native ove  |
| images/for-developers/why/card-vulnerabilities.png              | gradient   | png  |    423 | 1323×1189 |  ✓  | resize+convert | webp   | cap longest edge ~640px                     |     59 | Desktop illustration, img in clamp(160,15.4vw,222) box. Src 1323px/423KB rendere     |
| images/sbom/risk-icon-traceability.png                          | icon       | png  |    423 | 1323×1189 |  ✓  | convert        | webp   |                                             |    254 | 3D icon 1323x1189 423KB hasAlpha; img in WhyMattersGrid card alt='Broken Traceab     |
| images/blogs/hero-glow-left.png                                 | gradient   | png  |    422 | 1070×1070 |  ✓  | resize+convert | webp   | cap longest edge ~700px                     |    108 | Heavy decorative glow on BlogsHero, hard-light blend opacity .3. 422KB 1070x1070     |
| images/community/section-hardlight.png                          | gradient   | png  |    422 | 1070×1070 |  ✓  | resize+convert | webp   | cap longest edge ~700px                     |    108 | Decorative hard-light glow, alt='' aria-hidden, opacity-30, rendered 332x313 (tw     |
| images/guides/hero-glow-left.png                                | gradient   | png  |    422 | 1070×1070 |  ✓  | resize+convert | webp   | cap longest edge ~664px                     |     97 | Decorative glow, opacity 0.3 hard-light. 422KB 1070px rendered in 332x313 box ob     |
| images/resource-center/hero-glow-left.png                       | decorative | png  |    422 | 1070×1070 |  ✓  | resize+convert | webp   | cap longest edge ~500px                     |     55 | Decorative glow blob, alt='' aria-hidden opacity 0.3 hard-light. 422KB 1070x1070     |
| images/trusted/13-petco.png                                     | logo       | png  |    421 | 992×380   |  ✓  | convert        | webp   |                                             |    253 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/cleansight/problem-unknown-image.png                     | photo      | png  |    420 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~760px                     |     93 | WhyMattersGrid card`<img>` alt='Unknown image contents illustration'; 1254px nati  |
| images/for-developers/why/card-remediation.png                  | gradient   | png  |    420 | 1254×1254 |  ✓  | resize+convert | webp   | cap longest edge ~640px                     |     66 | Desktop illustration, img in clamp(160,15.4vw,222) box. Src 1254px/420KB rendere     |
| images/ciso/risks-icon-bloated.png                              | icon       | png  |    420 | 1254×1254 |  ✓  | convert        | webp   |                                             |    252 | 420KB 1254x1254 alpha icon via WhyMattersGrid, alt='Bloated public images icon';     |
| images/sbom/risk-icon-stale.png                                 | icon       | png  |    420 | 1254×1254 |  ✓  | convert        | webp   |                                             |    252 | 3D icon 1254x1254 420KB hasAlpha; img in WhyMattersGrid card alt='Stale Data ico     |
| images/about/founders-new.png                                   | photo      | png  |    370 | 360×612   |  ✓  | convert        | webp   |                                             |    222 | Mobile portrait photo, hasAlpha so webp not jpeg. 360x612 ~ rendered size (objec     |
| images/teams/vijendra-katiyar.png                               | photo      | png  |    343 | 590×712   |  ✓  | convert        | webp   |                                             |    206 | CRO headshot, next/image fill sizes 404px, src 590x712 hasAlpha. Convert to webp     |
| images/vulnerability-remediation/hero-wave-mesh.png             | gradient   | png  |    335 | 1230×739  |  ✓  | convert        | webp   |                                             |    201 | Decorative mesh wave, alt='' aria-hidden, lg-only, screen blend. Rendered ~calc(     |
| images/cleanstart-images/workflows-docker.png                   | icon       | png  |    332 | 3840×3840 |  ✓  | resize+convert | webp   | cap longest edge ~64px (3x rendered ~21px)  |      2 | Tool-stack Docker icon rendered ~21px but source is 3840x3840 332KB; massively o     |
| images/trusted/12-kopnus.png                                    | logo       | png  |    331 | 1240×227  |  ✓  | convert        | webp   |                                             |    199 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/resource-center/cta-cube.png                             | decorative | png  |    320 | 690×698   |  ✓  | resize+convert | webp   | cap longest edge ~600px                     |    142 | Decorative floating cube in CTA card (alt='' aria-hidden, opacity 0.6-0.75). 320     |
| images/resource-center/lead-cube.png                            | decorative | png  |    320 | 690×698   |  ✓  | resize+convert | webp   | cap longest edge ~600px                     |    142 | Decorative rotated cube in detail lead-capture card, alt='' opacity 0.9. 320KB 6     |
| images/teams/squad/2.jpeg                                       | photo      | jpeg |    303 | 2000×1506 |      | convert        | webp   |                                             |    182 | Squad carousel slide 2/9, next/image fill sizes up to 840px. 2000x1506. Convert      |
| images/fips/regulated-photo-mobile.png                          | photo      | png  |    302 | 360×695   |  ✓  | convert        | webp   |                                             |    181 | 302KB 360x695 mobile bg, objectFit cover full-bleed md:hidden, already mobile-si     |
| images/teams/biswajit-de.png                                    | photo      | png  |    295 | 590×712   |  ✓  | convert        | webp   |                                             |    177 | Exec headshot, next/image fill sizes 404px, src 590x712 hasAlpha. Convert to web     |
| images/home/advantage-bg-mobile.png                             | gradient   | png  |    293 | 360×793   |  ✓  | convert        | webp   |                                             |    176 | Mobile-only full-bleed bg, fill sizes=100vw, blurred decorative. 293KB 360x793 a     |
| images/vulnerability-remediation/hero-shield.png                | decorative | png  |    281 | 439×545   |  ✓  | convert        | webp   |                                             |    169 | Decorative hero shield, alt='' aria-hidden. Rendered desktop max-width 439px (=      |
| images/contact/hero-cube.png                                    | decorative | png  |    275 | 600×600   |  ✓  | convert        | webp   |                                             |    165 | Decorative cube in ContactHero, rendered twice (`<img>` alt='' aria-hidden, 294x29 |
| images/contact/form/header-bg.png                               | decorative | png  |    270 | 800×192   |  ✓  | convert        | webp   |                                             |    162 | Decorative CSS background on ContactForm header strip (800x192). Heavy 270KB w/      |
| images/teams/anandamoy-roychowdhary.png                         | photo      | png  |    266 | 590×712   |  ✓  | convert        | webp   |                                             |    159 | Advisor headshot, next/image fill sizes 404px, src 590x712 hasAlpha. Convert to      |
| images/attack-surface-reduction/business-photo-mobile.png       | photo      | png  |    258 | 360×611   |  ✓  | convert        | webp   |                                             |    155 | ASRDelivers mobile bg next/image fill cover sizes=100vw alt=''; 360x611 PNG-with     |
| images/teams/squad/6.jpeg                                       | photo      | jpeg |    247 | 1600×1200 |      | convert        | webp   |                                             |    148 | Squad carousel slide 6/9, next/image fill sizes up to 840px. 1600x1200. Convert      |
| images/sca/hero-3d-illustration.png                             | decorative | png  |    239 | 510×528   |  ✓  | convert        | webp   |                                             |    144 | 239KB 510x528 alpha hero art, rendered ~492x516 (SCAHero L38-39). At rendered si     |
| images/attack-surface-reduction/hero-cards.png                  | ui-chrome  | png  |    234 | 484×493   |  ✓  | convert        | webp   |                                             |    141 | ASRHero next/image priority w=484 h=493 sizes=430px, informative alt 'BLOATED im     |
| images/vulnerability-remediation/s2-left-shield.png             | photo      | png  |    216 | 504×378   |  ✓  | convert        | webp   |                                             |    129 | Informative shield illustration, alt='3D security shield illustration'. next/ima     |
| images/case-studies/hero-illustration.png                       | photo      | png  |    215 | 575×347   |  ✓  | convert        | webp   |                                             |    129 | Hero 3D illustration, next/image sizes max 560px, alt='' but it's informative he     |
| images/cleansight/hero-dashboard-v2.png                         | photo      | png  |    203 | 1018×581  |  ✓  | convert        | webp   |                                             |    122 | Hero dashboard, next/image with descriptive alt. Native 1018x581 ~= render width     |
| images/vulnerability-remediation/cta-cube.png                   | decorative | png  |    203 | 518×307   |  ✓  | resize+convert | webp   | cap longest edge ~520px                     |    122 | Decorative cube, alt='' aria-hidden; shared by cleansight CTA + VulnCTA. Rendere     |
| images/teams/squad/1.jpeg                                       | photo      | jpeg |    199 | 1200×1600 |      | convert        | webp   |                                             |    119 | Squad carousel slide 1/9 (Array.from{length:9} -> /squad/1..9.jpeg) next/image f     |
| images/attack-surface-reduction/s4-person.jpg                   | photo      | jpg  |    194 | 960×356   |      | convert        | webp   |                                             |    117 | ASRDelivers desktop bg next/image fill cover sizes=100vw alt=''; 960x356 194KB J     |
| images/teams/squad/5.jpeg                                       | photo      | jpeg |    192 | 1200×1600 |      | convert        | webp   |                                             |    115 | Squad carousel slide 5/9, next/image fill sizes up to 840px. 1200x1600. Convert      |
| images/cleansight/security-shield-complete.png                  | logo       | png  |    189 | 444×470   |  ✓  | convert        | webp   |                                             |    113 | Centered shield with baked-in logo,`<img>` alt='CleanSight security shield', rend  |
| images/teams/squad/8.jpeg                                       | photo      | jpeg |    187 | 1200×1600 |      | convert        | webp   |                                             |    112 | Squad carousel slide 8/9, next/image fill sizes up to 840px. 1200x1600. Convert      |
| images/awards/award-1.png                                       | logo       | png  |    182 | 486×616   |  ✓  | convert        | webp   |                                             |    109 | Footer award badge alt='Cyber Security Excellence Awards Winner'. 182KB 486x616      |
| images/teams/squad/4.jpeg                                       | photo      | jpeg |    179 | 1280×960  |      | convert        | webp   |                                             |    107 | Squad carousel slide 4/9, next/image fill sizes up to 840px. 1280x960. Convert w     |
| images/teams/nilesh-jain.png                                    | photo      | png  |    178 | 500×602   |  ✓  | convert        | webp   |                                             |    107 | CEO headshot, next/image fill sizes 404px, src 500x602 hasAlpha. Convert to webp     |
| images/teams/squad/3.jpeg                                       | photo      | jpeg |    177 | 1280×960  |      | convert        | webp   |                                             |    106 | Squad carousel slide 3/9, next/image fill sizes up to 840px. 1280x960. Convert w     |
| images/fips/shield-only.png                                     | logo       | png  |    177 | 400×435   |  ✓  | convert        | webp   |                                             |    106 | 177KB 400x435 shield badge, width 31.35%(~400px) desktop + 200px mobile, near-na     |
| images/community/logo-purestorage.png                           | logo       | png  |    175 | 2000×702  |  ✓  | convert        | webp   |                                             |    105 | Customer logo; alt='Aurascape' (LOGOS array). 175KB@2000x702, rule 3 no downscal     |
| images/fips/why-1.png                                           | icon       | png  |    173 | 404×404   |  ✓  | convert        | webp   |                                             |    104 | 173KB 404x404 card icon, next/image sizes 84/116px, ~2x at 116px; icon→no downsc    |
| images/vulnerability-remediation/s5-cube.png                    | decorative | png  |    171 | 406×443   |  ✓  | convert        | webp   |                                             |    103 | Decorative cube in aria-hidden wrapper; mobile alt='' + desktop alt='CleanStart      |
| images/fips/why-4.png                                           | icon       | png  |    170 | 404×404   |  ✓  | convert        | webp   |                                             |    102 | 170KB 404x404 card icon, next/image sizes 84/116px; icon→no downscale, near-loss    |
| images/teams/squad/9.jpeg                                       | photo      | jpeg |    170 | 1071×1428 |      | convert        | webp   |                                             |    102 | Squad carousel slide 9/9, next/image fill sizes up to 840px. 1071x1428. Convert      |
| images/resource-1.png                                           | photo      | png  |    170 | 404×231   |  ✓  | convert        | webp   |                                             |    102 | CMS-fallback article thumb (PLACEHOLDER_ARTICLES_BY_TAB + resources-insights.ts)     |
| images/fips/why-5.png                                           | icon       | png  |    166 | 404×404   |  ✓  | convert        | webp   |                                             |    100 | 166KB 404x404 card icon, next/image sizes 84/116px; icon→no downscale, near-loss    |
| images/fips/why-3.png                                           | icon       | png  |    163 | 404×404   |  ✓  | convert        | webp   |                                             |     98 | 163KB 404x404 card icon, next/image sizes 84/116px; icon→no downscale, near-loss    |
| images/resource-3.png                                           | photo      | png  |    154 | 404×231   |  ✓  | convert        | webp   |                                             |     92 | CMS-fallback article thumb (also reused in newsroom tab). next/image fill alt=''     |
| images/testimonial-photo.png                                    | photo      | png  |    153 | 264×329   |  ✓  | convert        | webp   |                                             |     92 | Fallback headshot when testimonial.photoSrc absent (`<img>`, alt=name+role when ac |
| images/vulnerability-remediation/blog-1-sbom.png                | photo      | png  |    153 | 404×231   |  ✓  | convert        | webp   |                                             |     92 | Blog/resource thumbnail; next/image w=404 h=231 object-cover, sizes max 404px. A     |
| images/ciso/outcomes-flare-mask2.png                            | decorative | png  |    151 | 1304×580  |  ✓  | convert        | webp   |                                             |     91 | 151KB 1304x580 alpha CSS mask-image layer in CisoOutcomes flare; alpha mask -> w     |
| images/testimonials/mayank-solanki.jpg                          | photo      | jpg  |    151 | 800×800   |      | convert        | webp   |                                             |     91 | TeamsInsiders portrait via HomeTestimonialsInsiders alt={name} (good). 151KB 800     |
| images/vulnerability-remediation/blog-3-container.png           | photo      | png  |    140 | 404×231   |  ✓  | convert        | webp   |                                             |     84 | Blog/resource thumbnail; next/image w=404 h=231, sizes max 404px. Alpha PNG -> W     |
| images/fips/flare-bottom.png                                    | decorative | png  |    139 | 1280×359  |  ✓  | convert        | webp   |                                             |     84 | 139KB glow flare, mixBlendMode:screen, aria-hidden, width min(88%,80rem) hidden      |
| images/community/logo-loteria.png                               | logo       | png  |    138 | 1024×259  |  ✓  | convert        | webp   |                                             |     83 | Customer logo; alt='Livlong Insurance' (LOGOS[0]). 138KB@1024x259, rendered max-     |
| images/vulnerability-remediation/s3-beam-connector.png          | decorative | png  |    134 | 534×578   |  ✓  | convert        | webp   |                                             |     81 | Decorative glow beam, alt='' aria-hidden, screen/plus-lighter blend. Rendered cl     |
| images/trusted/11-godrej-capital.png                            | logo       | png  |    123 | 1024×259  |  ✓  | convert        | webp   |                                             |     74 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/sca/cta-cube.png                                         | decorative | png  |    116 | 422×390   |  ✓  | resize+convert | webp   | cap longest edge ~440px                     |     70 | 116KB 422x390 alpha decorative cube, rendered 220x220 (SCACTA L51-52). Convert k     |
| images/testimonials/mathan-babu-k.jpg                           | photo      | jpg  |    102 | 900×988   |      | convert        | webp   |                                             |     61 | Testimonial portrait, dynamic alt name+role (good). 102KB 900x988 no-alpha; conv     |
| images/cleanstart-images/cta-cube-textured.png                  | decorative | png  |     99 | 256×259   |  ✓  | convert        | webp   |                                             |     60 | next/image alt='' decorative, sizes='224px' rendered 224px; 256x259 source ~99KB     |
| images/community/cta-cube-textured.png                          | decorative | png  |     99 | 256×259   |  ✓  | convert        | webp   |                                             |     60 | Decorative 3D cube in CTA, aria-hidden alt='' img, rendered 220x220 (hidden lg:b     |
| images/ciso/cta-cube-noise.png                                  | decorative | png  |     99 | 256×259   |  ✓  | convert        | webp   |                                             |     60 | 99KB 256x259 alpha cube noise, decorative img rendered ~190px in CisoCTA + SbomC     |
| images/for-developers/secure/badge-seal.png                     | logo       | png  |     97 | 1024×1024 |  ✓  | convert        | webp   |                                             |     58 | Badge/seal sprite cropped+zoomed to 313% (img w313.68% h307.32%); alpha. WebP, N     |
| images/community/card-img-apko.png                              | logo       | png  |     96 | 352×388   |  ✓  | convert        | webp   |                                             |     57 | Product-mark thumbnail in IMAGE_FALLBACK; next/image 28x28 sizes=28px, alt={item     |
| images/cleanstart-images/workflows-jenkins.png                  | icon       | png  |     91 | 860×686   |  ✓  | convert        | webp   |                                             |     54 | Tool-stack icon for 'Jenkins' rendered ~27px; 860x686 91KB, alpha->webp. Informa     |
| images/attack-surface-reduction/pipeline.png                    | icon       | png  |     90 | 786×375   |  ✓  | convert        | webp   |                                             |     54 | ASRFits data-array next/image w=201 h=96 alt 'CI/CD pipeline icon'; 786x375 alph     |
| images/for-developers/eliminate-risk/icon-shield.png            | icon       | png  |     87 | 256×256   |      | convert        | webp   |                                             |     52 | Only used in DeveloperEliminateRisk L36; slice VulnSecurityClean ref is FALSE (t     |
| images/for-developers/eliminate-risk/icon-cube.png              | icon       | png  |     85 | 256×256   |      | convert        | webp   |                                             |     51 | Only used in DeveloperEliminateRisk L42; slice VulnSecurityClean ref is FALSE (t     |
| images/podcast/explore.png                                      | icon       | png  |     84 | 320×320   |  ✓  | rename+convert | webp   |                                             |     50 | PodcastCTACards icon[0], alt='' next/image w200 rendered ~140px. 84KB 320x320 al     |
| images/resource-2.png                                           | photo      | png  |     78 | 404×231   |  ✓  | convert        | webp   |                                             |     47 | CMS-fallback article thumb. next/image fill alt='' (title adjacent). 78KB @404x2     |
| images/vulnerability-remediation/hero-wave-mobile.png           | gradient   | png  |     78 | 360×317   |  ✓  | convert        | webp   |                                             |     47 | Decorative mobile wave, alt='' aria-hidden, screen blend, width 100%. 360px nati     |
| images/teams/squad/7.jpeg                                       | photo      | jpeg |     76 | 800×600   |      | convert        | webp   |                                             |     45 | Squad carousel slide 7/9, next/image fill sizes up to 840px. 800x600 (smallest).     |
| images/blog-detail/cta/cta-cube.png                             | decorative | png  |     75 | 259×261   |  ✓  | convert        | webp   |                                             |     45 | Decorative 3D cube in BlogDetailCTA, alpha. 75KB 259x261; convert to webp, keep      |
| images/cleanstart-platform/cta-cube-textured.png                | decorative | png  |     75 | 259×261   |  ✓  | convert        | webp   |                                             |     45 | 75KB hasAlpha decorative cube in PlatformCTA, rendered 220x220 (intrinsic 259x26     |
| images/for-developers/workflows/logo-registry.png               | logo       | png  |     75 | 1024×1024 |  ✓  | convert        | webp   |                                             |     45 | Registry brand logo, img w60 (mobile 52). Src 1024px/75KB, alpha; WebP near-loss     |
| images/partners/sys.png                                         | decorative | png  |     73 | 278×294   |  ✓  | convert        | webp   |                                             |     44 | PartnersTypes 'Value Sellers' illustration (name/title mismatch noted in correct     |
| images/podcast/update.png                                       | icon       | png  |     69 | 300×300   |  ✓  | rename+convert | webp   |                                             |     42 | PodcastCTACards icon[2], alt='' next/image w200. 69KB 300x300 alpha. 'update.png     |
| images/trusted/09-livlong.png                                   | logo       | png  |     69 | 2604×914  |  ✓  | convert        | webp   |                                             |     41 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/ciso/solution-flare-overlay.png                          | decorative | png  |     68 | 578×534   |  ✓  | convert        | webp   |                                             |     41 | 68KB 578x534 alpha CSS mask-image layer in CisoSolution flare; alpha mask -> web     |
| images/testimonials/moinul-khan.jpg                             | photo      | jpg  |     68 | 900×988   |      | convert        | webp   |                                             |     41 | Testimonial portrait, dynamic alt name+role (good). 68KB 900x988; convert to web     |
| images/vulnerability-remediation/s3-icon-refresh.png            | icon       | png  |     67 | 218×218   |  ✓  | convert        | webp   |                                             |     40 | Feature icon from FEATURES data array, alt='' (title in adjacent h3). 218x218 na     |
| images/vulnerability-remediation/s3-icon-shield.png             | icon       | png  |     67 | 218×218   |  ✓  | convert        | webp   |                                             |     40 | Feature icon from FEATURES data array, alt='' (title in adjacent h3). 218x218 na     |
| images/vulnerability-remediation/blog-2-hidden-risk.png         | photo      | png  |     67 | 404×231   |  ✓  | convert        | webp   |                                             |     40 | Blog/resource thumbnail; next/image w=404 h=231, sizes max 404px. Alpha PNG -> W     |
| images/vulnerability-remediation/s3-icon-cube.png               | icon       | png  |     65 | 218×218   |  ✓  | convert        | webp   |                                             |     39 | Feature icon from FEATURES data array, alt='' (title in adjacent h3). 218x218 na     |
| images/vulnerability-remediation/s3-icon-checklist.png          | icon       | png  |     64 | 218×218   |  ✓  | convert        | webp   |                                             |     39 | Feature icon from FEATURES data array, alt='' (title in adjacent h3). 218x218 na     |
| images/security/vs-badge.png                                    | decorative | png  |     64 | 252×252   |  ✓  | convert        | webp   |                                             |     38 | Decorative 'VS' badge shared home+vuln-remediation (next/image alt='', 252x252 r     |
| images/home/help-icon3.png                                      | icon       | png  |     64 | 270×251   |  ✓  | convert        | webp   |                                             |     38 | AudienceTabs card icon, alt='' next/image w161. 64KB 270x251 alpha; convert near     |
| images/home/help-icon2.png                                      | icon       | png  |     64 | 270×251   |  ✓  | convert        | webp   |                                             |     38 | AudienceTabs card icon (shared ciso/dev tabs), alt='' next/image w161. 64KB 270x     |
| images/factory-orb.png                                          | decorative | png  |     63 | 440×328   |  ✓  | convert        | webp   |                                             |     38 | Decorative orb in FactoryCard (alt='', rendered 97x72, sizes=97px). 63KB @440x32     |
| images/cleanstart-images/workflows-kubernetes.png               | icon       | png  |     61 | 723×702   |  ✓  | convert        | webp   |                                             |     36 | Tool-stack icon for 'Kubernetes' rendered ~22px; 723x702 61KB, alpha->webp. Info     |
| images/for-developers/workflows/logo-code.png                   | logo       | png  |     60 | 728×712   |  ✓  | convert        | webp   |                                             |     36 | Pipeline brand glyph, img w60 (mobile 52). Src 728px/60KB, alpha; WebP near-loss     |
| images/podcast/new.png                                          | icon       | png  |     60 | 300×300   |  ✓  | rename+convert | webp   |                                             |     36 | PodcastCTACards icon[1], alt='' next/image w200. 60KB 300x300 alpha. 'new.png' m     |
| images/fips/cta-cube.png                                        | decorative | png  |     60 | 222×168   |  ✓  | convert        | webp   |                                             |     36 | Decorative cube, aria-hidden alt='', rendered width:19.98% (~255px desktop), hid     |
| images/testimonials/pooja-lachhwani.jpg                         | photo      | jpg  |     58 | 600×600   |      | convert        | webp   |                                             |     35 | TeamsInsiders portrait via HomeTestimonialsInsiders alt={name} (good). 58KB 600x     |
| images/home/help-icon1.png                                      | icon       | png  |     58 | 270×251   |  ✓  | convert        | webp   |                                             |     35 | AudienceTabs card icon, alt='' aria-hidden, next/image w161. 58KB 270x251 alpha;     |
| images/trusted/04-5paisa.png                                    | logo       | png  |     56 | 792×191   |  ✓  | convert        | webp   |                                             |     34 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/testimonials/shanker-ramrakhiani.jpg                     | photo      | jpg  |     56 | 900×988   |      | convert        | webp   |                                             |     34 | Testimonial portrait, dynamic alt name+role (good). 56KB 900x988; convert to web     |
| images/fips/shield-glow.png                                     | decorative | png  |     55 | 730×671   |  ✓  | convert        | webp   |                                             |     33 | 55KB 730x671 glow, mixBlendMode:screen opacity.85, aria-hidden, width 57.21% hid     |
| images/fips/flare-top-right.png                                 | decorative | png  |     55 | 328×328   |  ✓  | convert        | webp   |                                             |     33 | 55KB glow flare, screen blend, aria-hidden, width clamp(11.25rem,22%,20.5rem) hi     |
| images/cleanstart-factory/factory-images.png                    | icon       | png  |     53 | 192×200   |  ✓  | convert        | webp   |                                             |     32 | Clean Images orb icon, CARDS[].icon -> next/image alt='' aria-hidden, 53KB 192x2     |
| images/fips/flare-left.png                                      | decorative | png  |     52 | 269×328   |  ✓  | convert        | webp   |                                             |     31 | 52KB glow flare, screen blend, aria-hidden, width clamp(10rem,18.5%,16.8rem) hid     |
| images/blogs/cta-cube-left.png                                  | decorative | png  |     51 | 223×221   |  ✓  | convert        | webp   |                                             |     30 | Decorative 3D cube on CareerDetailHero/UpcomingEventHero CTA. 52KB alpha PNG ren     |
| images/blogs/cta-cube-right2.png                                | decorative | png  |     51 | 223×221   |  ✓  | convert        | webp   |                                             |     30 | Decorative cube in BlogsCTA/EventsCTA/WebinarsCTA slot. 51KB alpha PNG rendered      |
| images/guides/cta-cube-right2.png                               | decorative | png  |     51 | 223×221   |  ✓  | convert        | webp   |                                             |     30 | Mirror of cta-cube-left2 in GuidesCTA. 51KB 223x221, alpha; convert to webp, no      |
| images/blogs/cta-cube-left2.png                                 | decorative | png  |     50 | 218×220   |  ✓  | convert        | webp   |                                             |     30 | Decorative cube in BlogsCTA/EventsCTA/WebinarsCTA newsletter slot. 50KB alpha PN     |
| images/guides/cta-cube-left2.png                                | decorative | png  |     50 | 218×220   |  ✓  | convert        | webp   |                                             |     30 | Decorative 3D cube in GuidesCTA, alpha+blend. 50KB 218x220 rendered ~that size;      |
| images/cleanstart-factory/factory-packages.png                  | icon       | png  |     50 | 203×200   |  ✓  | convert        | webp   |                                             |     30 | Clean Packages orb icon, CARDS[].icon next/image alt='' aria-hidden, 50KB 203x20     |
| images/blogs/cta-cube-right.png                                 | decorative | png  |     50 | 218×220   |  ✓  | convert        | webp   |                                             |     30 | Decorative cube on CareerDetailHero/UpcomingEventHero. 50KB alpha PNG rendered ~     |
| images/about/n1.png                                             | icon       | png  |     50 | 196×196   |  ✓  | rename+convert | webp   |                                             |     30 | Generic name n1; decorative sphere glyph in AboutPowering 'Accelerates Developme     |
| images/about/n2.png                                             | icon       | png  |     49 | 196×196   |  ✓  | rename+convert | webp   |                                             |     30 | Generic name n2; decorative sphere glyph for 'End-to-End Transparency' card, alt     |
| images/news-detail/cta-cube.png                                 | decorative | png  |     49 | 195×196   |  ✓  | convert        | webp   |                                             |     29 | Decorative cube in NewsDetailCTA, rendered twice (`<img>` alt='' aria-hidden, 80-1 |
| images/about/n3.png                                             | icon       | png  |     48 | 196×196   |  ✓  | rename+convert | webp   |                                             |     29 | Generic name n3; decorative sphere glyph for 'Secure by Design' card, alt='' ari     |
| images/cleanstart-factory/factory-libraries.png                 | icon       | png  |     44 | 191×192   |  ✓  | convert        | webp   |                                             |     27 | Clean Libraries orb icon, CARDS[].icon next/image alt='' aria-hidden, 44KB 191x1     |
| images/ciso/solution-track-overlay.png                          | decorative | png  |     42 | 738×96    |  ✓  | convert        | webp   |                                             |     25 | 42KB 738x96 alpha CSS mask-image layer in CisoSolution track; alpha mask -> webp     |
| images/for-developers/eliminate-risk/icon-clock.png             | icon       | png  |     41 | 256×256   |  ✓  | convert        | webp   |                                             |     25 | 3D metric icon, next/image w108 h108 (src 256), alpha+blend lighten; WebP near-l     |
| images/cleanstart-images/workflows-cloud.png                    | icon       | png  |     34 | 512×512   |  ✓  | convert        | webp   |                                             |     21 | Tool-stack icon for 'Cloud Providers' label, rendered ~21px; 512x512 34KB, alpha     |
| images/attack-surface-reduction/Point.png                       | icon       | png  |     33 | 148×150   |  ✓  | rename+convert | webp   |                                             |     20 | ASRFits data-array via next/image w=96 h=96 (alt 'Deploy icon'); generic name 'P     |
| images/vulnerability-remediation/s3-flare-right.png             | decorative | png  |     32 | 255×255   |  ✓  | convert        | webp   |                                             |     19 | Decorative flare, alt='' aria-hidden, lg-only, 255x255 fixed = native. 32KB alph     |
| images/for-developers/workflows/logo-git.png                    | logo       | png  |     29 | 512×512   |  ✓  | convert        | webp   |                                             |     18 | Git brand logo, img w56 (mobile 48). Src 512px/29KB, alpha; WebP near-lossless,      |
| images/for-developers/eliminate-risk/icon-chart.png             | icon       | png  |     29 | 256×256   |  ✓  | convert        | webp   |                                             |     17 | 3D metric icon, next/image w108 h108 (src 256), alpha+mixBlendMode lighten; near     |
| images/cleanstart-factory/factory-models.png                    | icon       | png  |     27 | 133×141   |  ✓  | convert        | webp   |                                             |     16 | Clean AI Models orb icon, CARDS[].icon next/image alt='' aria-hidden, 27KB 133x1     |
| images/vulnerability-remediation/s3-flare-left.png              | decorative | png  |     27 | 227×227   |  ✓  | convert        | webp   |                                             |     16 | Decorative flare, alt='' aria-hidden, lg-only, 227x227 fixed = native. 27KB alph     |
| images/partners/technology.png                                  | decorative | png  |     26 | 195×174   |  ✓  | convert        | webp   |                                             |     16 | PartnersTypes 'Technology Partners' illustration; aria-hidden alt='', 195x174 at     |
| images/trusted/03-iifl-finance.png                              | logo       | png  |     24 | 1132×215  |  ✓  | convert        | webp   |                                             |     14 | Used twice: BrandMarquee (alt='', 120px) + Testimonials logoSrc. Brand logo: con     |
| images/partners/value.png                                       | decorative | png  |     23 | 158×160   |  ✓  | convert        | webp   |                                             |     14 | PartnersTypes 'System Integrators and MSPs' illustration (name/title mismatch no     |
| images/partners/Ball2.png                                       | icon       | png  |     23 | 126×126   |  ✓  | rename+convert | webp   |                                             |     14 | Decorative orb, PartnersWhy card 2; aria-hidden, fill sizes=88px. Generic name.      |
| images/ciso/outcomes-glow-bar1.png                              | decorative | png  |     23 | 70×1024   |  ✓  | convert        | webp   |                                             |     14 | 23KB 70x1024 alpha glow bar, decorative img in GlowBar (xl-only); alpha -> webp.     |
| images/partners/Ball.png                                        | icon       | png  |     23 | 126×126   |  ✓  | rename+convert | webp   |                                             |     14 | Decorative gradient orb in PartnersWhy benefit card; aria-hidden, fill at 88px.      |
| images/partners/Ball3.png                                       | icon       | png  |     23 | 126×126   |  ✓  | rename+convert | webp   |                                             |     14 | Decorative orb, PartnersWhy card 3; aria-hidden, fill sizes=88px. Generic name.      |
| images/partners/Ball4.png                                       | icon       | png  |     23 | 126×126   |  ✓  | rename+convert | webp   |                                             |     14 | Decorative orb, PartnersWhy card 4; aria-hidden, fill sizes=88px. Generic name.      |
| images/attack-surface-reduction/image 583136.png                | icon       | png  |     20 | 132×140   |  ✓  | rename+convert | webp   |                                             |     12 | ASRFits data-array next/image w=96 h=96 alt 'Monitor icon'; Figma-junk name 'ima     |
| images/attack-surface-reduction/cta-union.png                   | decorative | png  |     19 | 756×756   |  ✓  | convert        | webp   |                                             |     12 | ASRCTA mobile hex pattern img aria-hidden alt=''; 756x756 alpha rendered 378x378     |
| images/news-detail/cta-union.png                                | decorative | png  |     19 | 756×756   |  ✓  | convert        | webp   |                                             |     12 | Decorative union shape in NewsDetailCTA (`<img>` alt='' aria-hidden, 378x378, opac |
| images/awards/award-2.png                                       | logo       | png  |     19 | 268×267   |  ✓  | convert        | webp   |                                             |     12 | Footer Docker Verified Publisher badge, alt={name}. 19KB 268x267 alpha; convert      |
| images/attack-surface-reduction/approach-icon-minimal.png       | icon       | png  |     19 | 154×126   |  ✓  | convert        | webp   |                                             |     11 | ASRApproach img alt 'Minimal foundations icon'; 154x126 alpha, already near rend     |
| images/community/card-img-rust.png                              | logo       | png  |     18 | 222×236   |  ✓  | convert        | webp   |                                             |     11 | Rust product-mark thumbnail; next/image 28x28 sizes=28px, alt=name. hasAlpha->we     |
| images/cleanstart-images/workflows-mobile-rod.png               | decorative | png  |     18 | 131×142   |  ✓  | convert        | webp   |                                             |     11 | Decorative connector rod, aria-hidden alt='' 4 uses, rendered 131px; 131x142 18K     |
| images/cleanstart-images/workflows-github.png                   | icon       | png  |     17 | 512×512   |  ✓  | convert        | webp   |                                             |     10 | Tool-stack icon for 'GitHub Actions' rendered ~21px; 512x512 17KB, alpha->webp.      |
| images/community/logo-hitachi.png                               | logo       | png  |     16 | 713×285   |  ✓  | convert        | webp   |                                             |     10 | Customer logo; alt='Hitachi' in LOGOS array. next/image sizes=160px. hasAlpha->w     |
| images/contact/flags/flag-sg.png                                | photo      | png  |     16 | 577×385   |  ✓  | convert        | webp   | cap longest edge ~160px                     |     10 | Singapore flag (next/image alt='Singapore flag', rendered 77x51 sizes=77px). 16K     |
| images/awards/award-3.png                                       | logo       | png  |     15 | 200×200   |  ✓  | convert        | webp   |                                             |      9 | Footer ISO/IEC 27001 cert badge, alt={name}. 15KB 200x200 alpha; convert near-lo     |
| images/cleansight/Ball2.png                                     | icon       | png  |     14 | 92×92     |  ✓  | convert        | webp   |                                             |      8 | Unified card sphere icon,`<img>` 96x96 aria-hidden; alpha. Convert, no downscale   |
| images/sca/problem-ball-bloated.png                             | icon       | png  |     13 | 102×102   |  ✓  | convert        | webp   |                                             |      8 | 13KB 102x102 alpha card icon, CARDS img rendered 96x96 (SCAProblems L148-152). C     |
| images/cleansight/Ball1.png                                     | icon       | png  |     13 | 92×92     |  ✓  | convert        | webp   |                                             |      8 | Unified card sphere icon, rendered`<img>` 96x96 aria-hidden; alpha. Convert near-  |
| images/cleansight/Ball4.png                                     | icon       | png  |     13 | 92×92     |  ✓  | convert        | webp   |                                             |      8 | Unified card sphere icon,`<img>` 96x96 aria-hidden; alpha. Convert, no downscale   |
| images/sca/problem-ball-delayed.png                             | icon       | png  |     13 | 102×102   |  ✓  | convert        | webp   |                                             |      8 | 13KB 102x102 alpha card icon, CARDS img rendered 96x96 (SCAProblems L148-152). C     |
| images/sca/problem-ball-fatigue.png                             | icon       | png  |     13 | 102×102   |  ✓  | convert        | webp   |                                             |      8 | 13KB 102x102 alpha card icon, CARDS img rendered 96x96 (SCAProblems L148-152). C     |
| images/sca/problem-ball-alert.png                               | icon       | png  |     13 | 102×102   |  ✓  | convert        | webp   |                                             |      8 | 13KB 102x102 alpha card icon, CARDS img rendered 96x96 (SCAProblems L148-152). C     |
| images/cleansight/Ball3.png                                     | icon       | png  |     13 | 92×92     |  ✓  | convert        | webp   |                                             |      8 | Unified card sphere icon,`<img>` 96x96 aria-hidden; alpha. Convert, no downscale   |
| images/contact/flags/flag-us.png                                | photo      | png  |     11 | 180×104   |  ✓  | convert        | webp   |                                             |      7 | United States flag (next/image alt='United States flag', 77x51, sizes=77px). 11K     |
| images/partners/global/cybernx.png                              | logo       | png  |     11 | 204×42    |  ✓  | convert        | webp   |                                             |      7 | PartnersNetwork data-array, alt='CyberNx logo', 160px. Brand logo: convert near-     |
| images/trusted/05-kpmg.png                                      | logo       | png  |     11 | 713×285   |  ✓  | convert        | webp   |                                             |      7 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/partners/global/citius.png                               | logo       | png  |     11 | 154×60    |  ✓  | convert        | webp   |                                             |      7 | PartnersNetwork PARTNERS data-array, alt='Citius Cloud logo', 160px wide. Brand      |
| images/attack-surface-reduction/prod-icon-k8s.png               | icon       | png  |     11 | 94×94     |  ✓  | convert        | webp   |                                             |      6 | AsrProductionEnv data-array icon; 94x94 alpha, 11KB at native render size; near-     |
| images/sca/outcome-ball-signal.png                              | icon       | png  |     10 | 86×86     |  ✓  | convert        | webp   |                                             |      6 | 10KB 86x86 alpha chip icon, OUTCOME_CHIPS img (SCATransform L1254). Convert near     |
| images/sca/outcome-ball-target.png                              | icon       | png  |     10 | 86×86     |  ✓  | convert        | webp   |                                             |      6 | 10KB 86x86 alpha chip icon, OUTCOME_CHIPS img (SCATransform L1254). Convert near     |
| images/attack-surface-reduction/prod-icon-security.png          | icon       | png  |     10 | 94×94     |  ✓  | convert        | webp   |                                             |      6 | AsrProductionEnv data-array icon; 94x94 alpha, 10KB at native render size; near-     |
| images/sca/outcome-ball-cleaner.png                             | icon       | png  |     10 | 86×86     |  ✓  | convert        | webp   |                                             |      6 | 10KB 86x86 alpha chip icon, OUTCOME_CHIPS img rendered size-12/72 (SCATransform      |
| images/sca/outcome-ball-shield.png                              | icon       | png  |      9 | 86×86     |  ✓  | convert        | webp   |                                             |      6 | 9KB 86x86 alpha chip icon, OUTCOME_CHIPS img (SCATransform L1254). Convert near-     |
| images/attack-surface-reduction/prod-icon-docs.png              | icon       | png  |      9 | 94×94     |  ✓  | convert        | webp   |                                             |      6 | AsrProductionEnv data-array icon; 94x94 alpha, 9KB at native render size; near-l     |
| images/partners/global/seesec.png                               | logo       | png  |      9 | 84×80     |  ✓  | convert        | webp   |                                             |      5 | PartnersNetwork data-array, alt='SEESEC logo', 160px. Brand logo: convert near-l     |
| images/trusted/06-hitachi.png                                   | logo       | png  |      8 | 1732×302  |  ✓  | convert        | webp   |                                             |      5 | dynamic-unsure resolved used: BrandMarquee renders all /trusted files, alt='', 1     |
| images/contact/flags/flag-in.png                                | photo      | png  |      7 | 184×104   |  ✓  | convert        | webp   |                                             |      4 | India flag in ContactOffices (next/image alt='India flag', 77x51, sizes=77px). 7     |
| images/ciso/outcomes-glow-bar2.png                              | decorative | png  |      7 | 28×1024   |  ✓  | convert        | webp   |                                             |      4 | 7KB 28x1024 alpha glow bar, decorative img in GlowBar (xl-only); alpha -> webp.      |
| images/cleanstart-images/cta-cube-green.png                     | decorative | png  |      5 | 85×80     |  ✓  | convert        | webp   |                                             |      3 | Decorative mobile cube, aria-hidden img rendered 160px; alpha->webp. 85x80 sourc     |
| images/trusted/02-hpe.png                                       | logo       | png  |      5 | 1074×308  |  ✓  | convert        | webp   |                                             |      3 | dynamic-unsure resolved: BrandMarquee fs.readdirSync renders all /trusted files,     |
| images/partners/global/rtech.png                                | logo       | png  |      5 | 142×52    |  ✓  | convert        | webp   |                                             |      3 | PartnersNetwork data-array, alt='R-Tech logo', 160px. Brand logo: convert near-l     |
| images/community/logo-encora.png                                | logo       | png  |      5 | 211×34    |  ✓  | convert        | webp   |                                             |      3 | Customer logo in TrustedBy marquee; alt='Encora' (LOGOS array, slice altRaw stal     |
| images/trusted/08-aurascape.png                                 | logo       | png  |      5 | 231×48    |  ✓  | convert        | webp   |                                             |      3 | Used twice: BrandMarquee (alt='', 120px) + Testimonials logoSrc. Brand logo: con     |
| images/community/card-img-vault.png                             | logo       | png  |      4 | 250×250   |  ✓  | convert        | webp   |                                             |      3 | Vault product-mark thumbnail; next/image 28x28 sizes=28px, alt=name. 4KB already     |
| images/partners/global/ecaps.png                                | logo       | png  |      4 | 226×40    |  ✓  | convert        | webp   |                                             |      2 | PartnersNetwork data-array, alt='eCaps logo', 160px. Brand logo: convert near-lo     |
| images/partners/global/fortifire-icon.png                       | logo       | png  |      3 | 60×60     |  ✓  | convert        | webp   |                                             |      2 | PartnersNetwork data-array, alt='Fortifire logo', wordmark variant 36px. Brand l     |
| images/partners/global/hitachi.png                              | logo       | png  |      3 | 254×56    |  ✓  | convert        | webp   |                                             |      2 | PartnersNetwork data-array, alt='Hitachi Systems logo', 160px. Brand logo: conve     |
| images/partners/global/imperium.png                             | logo       | png  |      1 | 35×35     |  ✓  | convert        | webp   |                                             |      1 | PartnersNetwork data-array, alt='Imperium logo', 160px (35x35 source). Brand log     |
| images/community/logo-vi.png                                    | logo       | png  |      1 | 50×45     |  ✓  | convert        | webp   |                                             |      1 | Customer logo; alt='Vi' (LOGOS array). 1KB@50x45 already tiny. hasAlpha->webp, n     |
| images/trusted/10-vi.png                                        | logo       | png  |      1 | 50×45     |  ✓  | convert        | webp   |                                             |      1 | Used twice: BrandMarquee (alt='', 120px) + Testimonials logoSrc. Brand logo: con     |

## 🧬 Cross-page duplicate consolidation

22 sets of **byte-identical** files are each still used on ≥2 pages. Keeping one canonical copy (e.g. under `images/shared/`) and repointing references reclaims **~15.1 MB** beyond orphan deletion. (Exact md5 dupes; orphan-only dupe sets are already counted under Delete.)

| KB each | Used copies                                                                                                                                                                                                                | Extra KB if deduped |
| ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------: |
|     883 | `images/blogs/hero-orb-top.png<br>``images/book-a-demo/hero-cube-left.png<br>``images/book-a-demo/hero-cube-right.png<br>``images/cleansight/blindspot-corner-hex.png<br>``images/resource-center/hero-cube.png` |                3532 |
|    1677 | `images/sbom/infinity-circuit.png<br>``images/sca/workflows-hero.png`                                                                                                                                                  |                1677 |
|     809 | `images/fips/cube-impact-transparent.png<br>``images/for-developers/workflows/cube-image.png<br>``images/sca/center-card-cube.png`                                                                                   |                1618 |
|     663 | `images/cleansight/problem-audit-complexity.png<br>``images/for-developers/why/card-development.png<br>``images/sbom/risk-icon-compliance.png`                                                                       |                1326 |
|     422 | `images/blogs/hero-glow-left.png<br>``images/community/section-hardlight.png<br>``images/guides/hero-glow-left.png<br>``images/resource-center/hero-glow-left.png`                                                 |                1265 |
|     420 | `images/ciso/risks-icon-bloated.png<br>``images/cleansight/problem-unknown-image.png<br>``images/for-developers/why/card-remediation.png<br>``images/sbom/risk-icon-stale.png`                                     |                1259 |
|     954 | `images/ciso/comp-vs-badge.png<br>``images/cleansight/vs-badge.png`                                                                                                                                                    |                 954 |
|     474 | `images/cleansight/problem-shadow-containers.png<br>``images/for-developers/why/card-bloated.png<br>``images/sbom/risk-icon-incomplete.png`                                                                          |                 947 |
|     423 | `images/cleansight/problem-fragmented-views.png<br>``images/for-developers/why/card-vulnerabilities.png<br>``images/sbom/risk-icon-traceability.png`                                                                 |                 847 |
|     775 | `images/about/hero-3d-figma.png<br>``images/about/hero-3d-object.png`                                                                                                                                                  |                 775 |
|     639 | `images/cleansight/security-crystal.png<br>``images/vulnerability-remediation/s5-bg-decoration.png`                                                                                                                    |                 639 |
|     320 | `images/resource-center/cta-cube.png<br>``images/resource-center/lead-cube.png`                                                                                                                                        |                 320 |
|      51 | `images/blogs/cta-cube-left.png<br>``images/blogs/cta-cube-right2.png<br>``images/guides/cta-cube-right2.png`                                                                                                        |                 102 |
|      99 | `images/cleanstart-images/cta-cube-textured.png<br>``images/community/cta-cube-textured.png`                                                                                                                           |                  99 |
|      50 | `images/blogs/cta-cube-left2.png<br>``images/guides/cta-cube-left2.png`                                                                                                                                                |                  50 |
|      23 | `images/blogs/latest-blogs-gridlines.svg<br>``images/guides/list-gridlines.svg`                                                                                                                                        |                  23 |
|      19 | `images/attack-surface-reduction/cta-union.png<br>``images/news-detail/cta-union.png`                                                                                                                                  |                  19 |
|       1 | `images/blogs/icon-calendar-grey.svg<br>``images/guides/icon-calendar-grey.svg`                                                                                                                                        |                   1 |
|       1 | `images/blogs/icon-clock-grey.svg<br>``images/guides/icon-clock-grey.svg`                                                                                                                                              |                   1 |
|       1 | `images/cleansight/unified-ellipse-glow.svg<br>``images/cleanstart-images/browse-ellipse-glow.svg`                                                                                                                     |                   1 |
|       0 | `images/blog-detail/icon-see-all-arrow.svg<br>``images/guide-detail/icon-see-all-arrow.svg`                                                                                                                            |                   0 |
|       0 | `images/blogs/icon-arrow-read-more.svg<br>``images/guides/icon-arrow-read-more.svg`                                                                                                                                    |                   0 |

## ✏️ Rename map (generic / Figma-junk → descriptive)

References are rewritten in the same change. Includes SVGs (rename allowed; never converted).

| Current                                              | → Proposed                        | Action         | Note                                                                   |
| ---------------------------------------------------- | ---------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `images/about/n1.png`                              | `powering-icon-accelerate.png`   | rename+convert | Generic name n1; decorative sphere glyph in AboutPowering 'Accelerates |
| `images/about/n2.png`                              | `powering-icon-transparency.png` | rename+convert | Generic name n2; decorative sphere glyph for 'End-to-End Transparency' |
| `images/about/n3.png`                              | `powering-icon-secure.png`       | rename+convert | Generic name n3; decorative sphere glyph for 'Secure by Design' card,  |
| `images/attack-surface-reduction/image 583136.png` | `dropin-images-icon.png`         | rename+convert | ASRFits data-array next/image w=96 h=96 alt 'Monitor icon'; Figma-junk |
| `images/attack-surface-reduction/Point.png`        | `deploy-icon.png`                | rename+convert | ASRFits data-array via next/image w=96 h=96 (alt 'Deploy icon'); gener |
| `images/home/mask-group.svg`                       | `hero-top-grid-glow.svg`         | rename         | Decorative hero-top grid+glow mask in page.tsx; vector keep. 'mask-gro |
| `images/partners/Ball.png`                         | `benefit-orb-1.png`              | rename+convert | Decorative gradient orb in PartnersWhy benefit card; aria-hidden, fill |
| `images/partners/Ball2.png`                        | `benefit-orb-2.png`              | rename+convert | Decorative orb, PartnersWhy card 2; aria-hidden, fill sizes=88px. Gene |
| `images/partners/Ball3.png`                        | `benefit-orb-3.png`              | rename+convert | Decorative orb, PartnersWhy card 3; aria-hidden, fill sizes=88px. Gene |
| `images/partners/Ball4.png`                        | `benefit-orb-4.png`              | rename+convert | Decorative orb, PartnersWhy card 4; aria-hidden, fill sizes=88px. Gene |
| `images/podcast/explore.png`                       | `cta-card-icon-explore.png`      | rename+convert | PodcastCTACards icon[0], alt='' next/image w200 rendered ~140px. 84KB  |
| `images/podcast/new.png`                           | `cta-card-icon-news.png`         | rename+convert | PodcastCTACards icon[1], alt='' next/image w200. 60KB 300x300 alpha. ' |
| `images/podcast/update.png`                        | `cta-card-icon-updates.png`      | rename+convert | PodcastCTACards icon[2], alt='' next/image w200. 69KB 300x300 alpha. ' |

## ♿ Alt-text fixes

| Path                                                  | Render     | Current alt | Suggested alt                              |
| ----------------------------------------------------- | ---------- | ----------- | ------------------------------------------ |
| `images/case-studies/hero-illustration.png`         | next/image | _(empty)_ | CleanStart case study results illustration |
| `images/cleanstart-images/workflows-cloud.png`      | img        | _(none)_  | Cloud Providers                            |
| `images/cleanstart-images/workflows-docker.png`     | img        | _(none)_  | Docker                                     |
| `images/cleanstart-images/workflows-github.png`     | img        | _(none)_  | GitHub Actions                             |
| `images/cleanstart-images/workflows-jenkins.png`    | img        | _(none)_  | Jenkins                                    |
| `images/cleanstart-images/workflows-kubernetes.png` | img        | _(none)_  | Kubernetes                                 |

## 🚫 Excluded & kept-as-is

- **`images/hero-tech-logos/` (75 SVG tech logos)** — untouched entirely (your rule).
- **244 used SVGs** kept verbatim (never rasterized); renamed only if generic.
- **CMS admin logo** (embedded JSX) and **`docs/` images** — out of scope.

## 🔎 Auditor corrections & notable findings

- **cleansight:** Slice classified cleansight/award-1..4.png, hero-grid.svg, hero-wave-mesh.png/.svg as dynamic-unsure; resolved to ORPHAN. Their basename matches are in OTHER folders (/images/awards/, /images/newsroom\|case-studies\|for-developers/, /images/vulnerability-remediation/) — these cleansight copies are unreferenced duplicates.
- **cleansight:** radar-visualization.png and blindspot-radar.png are byte-identical (md5 a760fd...), both ORPHAN — RadarScanner uses scanner-bg.png instead.
- **cleansight:** Visibility context new.png is byte-identical to the USED scanner-bg.png (md5 763861...); the 'Visibility context new.png' copy is an unused dupe -> ORPHAN.
- **cleansight:** comp-gradient-left.png==comp-gradient-left-new.png and comp-gradient-right.png==comp-gradient-right-new.png (byte-identical pairs); all four ORPHAN (the 9.1MB right pair is the heaviest waste in this group).
- **cleansight:** workflow-line.svg is byte-identical to the USED security-workflow-line.svg; workflow-line.svg (and its mislabeled .png twin) are ORPHAN dupes.
- **cleansight:** security-node-5.svg is ORPHAN: the workflow chart renders only 4 steps (nodeSrc security-node-1..4.svg); node-5 is never referenced.
- **cleansight:** Only ONE dynamic-path pattern exists in the group: CleanSightSecurity.tsx line 619 src=`/images/cleansight/${nodeSrc}` with hardcoded nodeSrc values security-node-1..4.svg. All other dynamic-unsure entries were resolved by literal-string search.
- **for-developers:** `images/for-developers/eliminate-risk/icon-cube.png` — Slice lists a ref in vulnerability-remediation/VulnSecurityClean.tsx:10 — that line references /images/vulnerability-remediation/s3-icon-cube.png, NOT this asset. Basename matcher false positive. Real ref is only DeveloperEliminateRisk.tsx:42.
- **for-developers:** `images/for-developers/eliminate-risk/icon-shield.png` — Slice lists a ref in vulnerability-remediation/VulnSecurityClean.tsx:5 — that line references /images/vulnerability-remediation/s3-icon-shield.png, NOT this asset. Basename matcher false positive. Real ref is only DeveloperEliminateRisk.tsx:36.
- **attack-surface-reduction:** `images/attack-surface-reduction/cta-union.svg` — used-weak→orphan: All 8 refs are basename collisions resolving to other folders (/images/cleansight, /images/blog-detail/cta, /images/sbom). This ASR-folder SVG is unreferenced.
- **attack-surface-reduction:** `images/attack-surface-reduction/hero-grid.svg` — used-weak→orphan: All 5 refs are basename collisions resolving to other folders (/images/case-studies, /images/for-developers, /images/newsroom, /error). This ASR-folder SVG is unreferenced.
- **ciso:** `images/ciso/cta-cube.png` — used-weak→orphan: basename collision: all 12 listed refs use /images/blog-detail/cta/cta-cube.png; grep for 'ciso/cta-cube' returns zero hits. The ciso copy (883KB) is unreferenced.
- **partners+trusted:** `images/partners/sys.png` — sys.png powers the 'Value Sellers' card and value.png powers the 'System Integrators and MSPs' card in PartnersTypes.tsx — filenames are swapped relative to card titles. Kept names (descriptive enough, decorative aria-hidden art) but flagging the confusing mapping.
- **partners+trusted:** `images/partners/global/fortifire-icon.png` — Byte-identical (3440b) to the orphaned flat copy images/partners/fortifire-icon.png. ngit.webp / sec-forte.webp / surakshate.webp also have byte-identical orphaned flat copies — all 10 flat /images/partners/`<logo>` files duplicate their /global/ counterparts and are unreferenced.
- **misc-1:** `images/contact/hero-grid.svg` — used-weak→orphan: Basename-only collision. The 5 refs in the slice (StateView, CaseStudiesHero, DeveloperHero, NewsroomHero x... actually sbom too) all load a hero-grid.svg from a DIFFERENT folder (/error/, /images/case-studies/, /images/for-developers/, /images/newsroom/, /images/newsroom/). No code references /images/contact/hero-grid.svg. Verified via grep -rn 'contact/hero-grid' src/ = 0 matches.
- **misc-2:** `images/book-a-demo/hero-grid.svg` — Slice marked status=used-weak (basename-only). Verified ORPHAN: none of the 5 refs target this path; they point to /error/hero-grid.svg, /images/case-studies/hero-grid.svg, /images/for-developers/hero-grid.svg, and /images/newsroom/hero-grid.svg (x2). Recommend delete.
- **misc-2:** `images/faq/bg-grid-faq-left.svg \| bg-grid-faq-right.svg \| bg-grid-faq-bottom-left.svg` — All three are byte-identical (11751 bytes). They could collapse to a single SVG re-used with CSS rotate/flip transforms, removing 2 redundant files. Kept all as 'keep' to stay audit-only; dedupe is a follow-up.
- **misc-2:** `images/guide-detail/icon-see-all-arrow.svg vs images/blog-detail/icon-see-all-arrow.svg` — Byte-identical (391B) across two folders. Candidate to consolidate into one shared icon path; both currently used so neither is an orphan.
- **cleanstart-images:** `images/cleanstart-images/cta-cube.png` — used-weak→orphan: Basename-only match: all 12 refs resolve to OTHER directories (blog-detail/cta, cleansight->vulnerability-remediation, fips, news-detail, resource-center, sca, teams, vuln). No file-path ref to /images/cleanstart-images/cta-cube.png exists; this 883KB copy is unreferenced -> delete.

## Methodology

1. **Factual layer** — `scripts/audit-images.mjs` walks `public/`, measures size/format/dimensions/alpha (`sips` + SVG `viewBox` parse), cross-references usage against `src/` (exact path, import, and runtime-built `${…}` prefix detection), and content-sniffs mislabeled/empty files. Unit-tested matching logic in `scripts/audit-lib.test.mjs`.
2. **Judgment layer** — 18 read-only sub-agents (one per page group) resolved `used-weak`/`dynamic-unsure`, classified each asset (icon/logo/photo/gradient/decorative), graded alt text, proposed descriptive names, and recommended actions against the conversion-safety rules.
3. **Dedup** — md5 across all assets surfaced byte-identical duplicates.
4. **Merge + report** — `scripts/build-image-audit-report.mjs` (this file).
