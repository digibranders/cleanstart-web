# CleanStart `apps/web` Typography System v2

> **Status:** Canonical source of truth · 2026-05-27
> **Supersedes:** `apps/web/docs/_archive/typography.md`, `apps/web/docs/_archive/design-tokens.md`, the typography portions of `apps/web/docs/RESPONSIVE-SYSTEM-AUDIT.md`.
> **Owner:** Senior Front-End engineer (CleanStart team).

---

## 1. Foundation

| Decision | Choice | Why |
|---|---|---|
| Unit for text | **`rem`** (1rem = 16 px at default zoom) | Respects user a11y font-size; WCAG 2.2 SC 1.4.4 compliance |
| Root font-size | `:root { font-size: 100% }` — never override | Don't break `1rem = 16px` invariant |
| Type scale ratio | **1.25× (Major Third)** | Stripe / Linear / Material 3 consensus for B2B/SaaS |
| Fluid anchors | Mobile 360 px → Desktop 1440 px | Matches the project's stated primary viewport |
| Clamp form | `clamp(MINrem, BASErem + Xvw, MAXrem)` (Utopia-style) | rem base survives browser zoom; raw `vw` slope does not |
| Font families | `--font-display: Manrope` · `--font-sans: Sora` · `--font-mono: JetBrains Mono` | Loaded via `next/font` in `app/layout.tsx`. Figtree is forbidden. |
| Weights allowed | **400, 500, 600, 700** only | No 300, no 800. Three-weight rule keeps the page calm. |
| Line-height | Unitless (`1.05`, `1.4`, `1.6`) | Inherits correctly |
| Letter-spacing | `em` only (e.g. `-0.04em`) | Self-scales; never `px` |

---

## 2. Two namespaces

CleanStart uses **two non-overlapping token families**:

1. **`--fs-*`** — marketing chrome (hero, sections, buttons, inputs, nav, footer, cards).
2. **`--prose-*`** — typography *inside `.article-body`* (article paragraph, list, blockquote, table, figure caption, pull-quote, callout).

Nothing else. No third family.

### Naming convention

Every visual role pairs the size token with companions:
- `--fs-X` — `font-size`
- `--fs-X-lh` — `line-height`
- `--fs-X-ls` — `letter-spacing`
- `--fs-X-weight` — `font-weight`

Consume them as a coordinated set in TSX:

```tsx
<h1 style={{
  fontSize: "var(--fs-display)",
  lineHeight: "var(--fs-display-lh)",
  letterSpacing: "var(--fs-display-ls)",
  fontWeight: "var(--fs-display-weight)",
  fontFamily: "var(--font-display), sans-serif",
}}>
```

---

## 3. `--fs-*` token reference (marketing chrome)

All tokens live in `apps/web/src/app/globals.css` inside the `@theme { ... }` block.

| Token | Formula | Mobile (360) | Desktop (1440) | Use |
|---|---|---|---|---|
| `--fs-display` | `clamp(2.25rem, 1.5rem + 2.78vw, 4rem)` | 36 px | 64 px | Hero H1 on every marketing/product page |
| `--fs-h1` | `clamp(2rem, 1.5rem + 2.22vw, 3.5rem)` | 32 px | 56 px | Listing-hero / detail-hero / legal page H1 |
| `--fs-h2` | `clamp(1.75rem, 1.375rem + 1.78vw, 3rem)` | 28 px | 48 px | Section H2 |
| `--fs-h3` | `clamp(1.375rem, 1.25rem + 0.56vw, 1.75rem)` | 22 px | 28 px | Subsection / card title |
| `--fs-h4` | `1.25rem` mobile, `1.375rem` ≥ lg | 20 px | 22 px | Card sub-title, modal heading |
| `--fs-h5` | `1.125rem` | 18 px | 18 px | Small panel header |
| `--fs-h6` | `1rem` | 16 px | 16 px | Inline emphasis label |
| `--fs-lead` | `clamp(1.125rem, 1rem + 0.4vw, 1.25rem)` | 18 px | 20 px | Hero sub-heading, intro paragraph |
| `--fs-body` | `clamp(1rem, 0.95rem + 0.15vw, 1.0625rem)` | 16 px | 17 px | All non-prose paragraph copy |
| `--fs-body-sm` | `0.875rem` | 14 px | 14 px | Footnote, secondary copy, tooltip |
| `--fs-caption` | `0.8125rem` | 13 px | 13 px | Tag, date stamp, status text |
| `--fs-eyebrow` | `clamp(0.8125rem, 0.78rem + 0.08vw, 0.875rem)` | 13 px | 14 px | Eyebrow chip (UPPERCASE) |
| `--fs-button` | `1rem` | 16 px | 16 px | Default CTA |
| `--fs-button-lg` | `clamp(1rem, 0.96rem + 0.12vw, 1.125rem)` | 16 px | 18 px | Hero CTA |
| `--fs-button-sm` | `0.875rem` | 14 px | 14 px | Inline / tag-style button |
| `--fs-input` | `1rem` | 16 px | 16 px | `<input>`, `<textarea>`, `<select>` — iOS zoom floor |
| `--fs-input-label` | `0.875rem` | 14 px | 14 px | Form label |
| `--fs-input-help` | `0.8125rem` | 13 px | 13 px | Field hint / error message |
| `--fs-nav` | `0.9375rem` | 15 px | 15 px | Top-nav link |
| `--fs-footer` | `0.875rem` | 14 px | 14 px | Footer link |
| `--fs-badge` | `0.75rem` | 12 px | 12 px | Status badge / pill (UPPERCASE) |
| `--fs-code` | `0.875rem` | 14 px | 14 px | Inline `<code>` outside `.article-body` |
| `--fs-code-block` | `clamp(0.8125rem, 0.79rem + 0.08vw, 0.875rem)` | 13 px | 14 px | `<pre><code>` outside `.article-body` |
| `--fs-table-th` | `0.8125rem` mobile, `0.875rem` ≥ lg | 13 px | 14 px | Comparison-table header |
| `--fs-table-td` | `0.875rem` mobile, `0.9375rem` ≥ lg | 14 px | 15 px | Comparison-table cell |

### Companion tokens (full list)

```css
/* Line-heights */
--fs-display-lh: 1.05;  --fs-h1-lh: 1.1;   --fs-h2-lh: 1.15;
--fs-h3-lh: 1.2;        --fs-h4-lh: 1.25;  --fs-h5-lh: 1.3;   --fs-h6-lh: 1.3;
--fs-lead-lh: 1.5;      --fs-body-lh: 1.6; --fs-body-sm-lh: 1.5;
--fs-caption-lh: 1.4;   --fs-eyebrow-lh: 1.2;
--fs-button-lh: 1.2;    --fs-input-lh: 1.5;

/* Letter-spacing */
--fs-display-ls: -0.04em;  --fs-h1-ls: -0.03em;  --fs-h2-ls: -0.03em;
--fs-h3-ls: -0.02em;       --fs-h4-ls: -0.02em;  --fs-h5-ls: -0.01em;  --fs-h6-ls: 0;
--fs-lead-ls: -0.01em;     --fs-body-ls: 0;
--fs-eyebrow-ls: 0.08em;   --fs-badge-ls: 0.04em;
--fs-button-ls: -0.01em;

/* Weights */
--fs-display-weight: 600;  --fs-h1-weight: 600;  --fs-h2-weight: 600;
--fs-h3-weight: 600;       --fs-h4-weight: 600;  --fs-h5-weight: 600;  --fs-h6-weight: 700;
--fs-lead-weight: 400;     --fs-body-weight: 400;
--fs-eyebrow-weight: 600;  --fs-badge-weight: 600;
--fs-button-weight: 500;   --fs-nav-weight: 500;
```

---

## 4. `--prose-*` token reference (article body)

These tokens drive `.article-body` and its descendants (the prose container used on every CMS detail/legal page).

### Existing (kept as-is from prior system)

| Token | Value | Use |
|---|---|---|
| `--prose-h1` | `clamp(2.25rem, 4vw, 3.5rem)` | 36 → 56 px |
| `--prose-h2` | `clamp(1.625rem, 2.5vw, 2.25rem)` | 26 → 36 px |
| `--prose-h3` | `clamp(1.25rem, 1.6vw, 1.5rem)` | 20 → 24 px |
| `--prose-h4` | `clamp(1.125rem, 1.3vw, 1.25rem)` | 18 → 20 px |
| `--prose-body` | `clamp(1.0625rem, 1.2vw, 1.125rem)` | 17 → 18 px |
| `--prose-blockquote` | `clamp(1.1875rem, 1.4vw, 1.25rem)` | 19 → 20 px |
| `--prose-code` | `0.9rem` | 14.4 px |
| `--prose-figcaption` | `0.9375rem` | 15 px |
| `--prose-h1-lh` | `1.1` | |
| `--prose-h2-lh` | `1.2` | |
| `--prose-h3-lh` | `1.3` | |
| `--prose-body-lh` | `1.6` | |
| `--prose-column-max` | `720px` | Reading column max-width |

### New (added in v2)

| Token | Value | Use |
|---|---|---|
| `--prose-pull-quote` | `clamp(1.375rem, 1rem + 1vw, 1.75rem)` | 22 → 28 px — pull-quote / lift-out |
| `--prose-pull-quote-attribution` | `0.9375rem` | 15 px — "— Author Name" |
| `--prose-image-caption` | `0.875rem` | 14 px — `<figcaption>` |
| `--prose-callout-title` | `1.0625rem` | 17 px |
| `--prose-callout-body` | `1rem` | 16 px |
| `--prose-author-bio` | `1rem` | 16 px — Author bio paragraph |
| `--prose-byline` | `0.875rem` | 14 px |
| `--prose-byline-meta` | `0.8125rem` | 13 px — Reading time, date |
| `--prose-related-title` | `1.125rem` | 18 px — related-article card title |
| `--prose-related-meta` | `0.8125rem` | 13 px — related-article meta |

---

## 5. Per-element usage guide

### Marketing/product pages (`/cleansight`, `/fips`, `/teams`, `/about-us`, …)

| Element | Token to consume |
|---|---|
| Hero H1 | `--fs-display` |
| Hero sub-heading / intro | `--fs-lead` |
| Hero CTA button | `--fs-button-lg` |
| Eyebrow chip ("Start Clean. Stay Secure.") | `--fs-eyebrow` (UPPERCASE) |
| Section H2 ("Why CleanStart") | `--fs-h2` |
| Section intro paragraph | `--fs-lead` |
| Card title (FactoryCard, FAQ question) | `--fs-h3` |
| Card sub-title | `--fs-h4` |
| Card body | `--fs-body` |
| Inline CTA button (non-hero) | `--fs-button` |
| Form input | `--fs-input` |
| Form input label | `--fs-input-label` |
| Form helper / error | `--fs-input-help` |
| Footer link | `--fs-footer` |
| Top-nav link | `--fs-nav` |
| Status badge | `--fs-badge` |

### CMS listing pages (`/blogs`, `/news`, `/events`, …)

| Element | Token to consume |
|---|---|
| Listing-hero H1 | `--fs-h1` (32 → 48 px) |
| Listing-hero subtitle | `--fs-lead` |
| Article card title | `--fs-h4` or `--prose-related-title` (18 px) |
| Article card meta | `--prose-related-meta` |
| Filter / pagination button | `--fs-button-sm` |

### CMS detail pages (`/blog/[slug]`, `/news/[slug]`, …)

| Element | Token to consume |
|---|---|
| Detail-hero H1 | `--fs-h1` (32 → 48 px) — same as listing |
| Detail-hero byline | `--prose-byline` |
| Detail-hero meta (reading time, date) | `--prose-byline-meta` |
| Article body paragraph (Lexical → `.article-paragraph`) | `--prose-body` (automatic via `.article-body` rules) |
| Article H2/H3/H4 (Lexical → `.article-h2`/`h3`/`h4`) | `--prose-h2` / `--prose-h3` / `--prose-h4` (automatic) |
| Blockquote | `--prose-blockquote` (automatic) |
| Inline `<code>` | `--prose-code` (automatic via inline rule) |
| Figure caption | `--prose-image-caption` (automatic via `figcaption` rule) |
| Pull-quote (`.article-pull-quote`) | `--prose-pull-quote` (automatic) |
| Callout box (`.article-callout`) | `--prose-callout-title` + `--prose-callout-body` (automatic) |
| Author bio (`.article-author-bio`) | `--prose-author-bio` |

### Legal pages (`/privacy-policy`, `/legal/*`)

| Element | Token to consume |
|---|---|
| Page H1 | `--fs-h1` |
| Body (uses `.article-body`) | `--prose-body` (automatic) |

---

## 6. Migration rules (what NOT to do)

These are hard rules. The Phase 4 biome enforcement will block PRs that violate them.

| ❌ Forbidden | ✅ Use instead |
|---|---|
| `style={{ fontSize: "16px" }}` | `style={{ fontSize: "var(--fs-body)" }}` |
| `style={{ fontSize: "1rem" }}` | `style={{ fontSize: "var(--fs-body)" }}` |
| `style={{ fontSize: "clamp(40px, 4.45vw, 64px)" }}` | `style={{ fontSize: "var(--fs-display)" }}` |
| `className="text-[16px]"` | `style={{ fontSize: "var(--fs-body)" }}` |
| `className="text-[clamp(...)]"` | `style={{ fontSize: "var(--fs-h2)" }}` |
| `className="text-2xl"` (Tailwind preset for hero) | `style={{ fontSize: "var(--fs-display)" }}` |
| `fontWeight: 800` | `fontWeight: 700` (max allowed) |
| `lineHeight: "120%"` | `lineHeight: 1.2` (unitless) |
| `letterSpacing: "-0.64px"` | `letterSpacing: "-0.04em"` |
| Raw `vw` slope: `fontSize: "5vw"` | rem-anchored clamp via a token |
| `fontFamily: "Figtree, ..."` | `fontFamily: "var(--font-display), sans-serif"` |

---

## 7. Visual hierarchy ratios (v4)

The desktop scale is intentionally tight:

| Step | Ratio | Use |
|---|---|---|
| Hero H1 (`--fs-display`) | **64 px** | Marketing/product page hero |
| Non-hero H1 (`--fs-h1`) | **56 px** (1.14× below) | Listing-hero / detail-hero / legal page H1 |
| Section H2 (`--fs-h2`) | **48 px** (1.17× below) | Section H2 inside any page |
| Subsection H3 (`--fs-h3`) | **28 px** (1.71× below) | Card title, FAQ question, stat label |

**v4 design note:** The earlier v3 scale (H1 = 48 px, H2 = 40 px desktop) tested too small in visual review — section H2s on CMS-aliased pages felt under-weighted against their body content. v4 bumped both desktop targets by +8 px each. The Hero / non-hero gap is now 1.14× (was 1.33× in v3) — tighter than typical industry benchmarks (Stripe 1.45×, Linear 1.6×) but matched to CleanStart's CMS-dense listing/detail pages where the H1 anchors substantial article copy beneath it.

The H2 → H3 jump (48 → 28 px = 1.71×) is wider than ideal. It's accepted because:
- H3 (card titles) was explicitly held at 22 → 28 px during v4 review.
- Card grids visually break up the gap with their own internal structure (icons, padding, layout).
- Forcing H3 to a tighter ratio would push it past 32 px and start to compete with H2 on dense card grids.

If the gap proves uncomfortable in practice, raise it as a v5 candidate.

---

## 8. Browser support

- `clamp()` — supported in all browsers since 2020 (Safari 13.1, Chrome 79, Firefox 75). No fallback needed.
- `rem` — universal.
- `vw` inside `clamp()` — universal.
- `oklch()` colors (used elsewhere) — Safari 15.4+ / Chrome 111+. Out of scope here.

Target baseline: last two major versions of Chrome, Safari, Firefox, Edge.

---

## 9. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-27 | 1.25× Major Third scale | Industry consensus (Material 3, Stripe, Linear, Refactoring UI) |
| 2026-05-27 | Two-namespace split (`--fs-*` + `--prose-*`) | Marketing chrome and article prose have different optimisation targets (brand impact vs reading flow). Three-way split was considered and rejected as overspecified. |
| 2026-05-27 | Detail-hero H1: v4 = 32 → **56** px (`--fs-h1`) | v3 set this at 32 → 48 (Option A, 1.33× from hero). Visual review showed desktop 48 px under-weighted against CMS-dense article copy. v4 bumped to 56 (1.14× gap from hero). Tighter than industry but matches dense-content character of listing/detail pages. |
| 2026-05-27 | Section H2: v4 = 28 → **48** px (`--fs-h2`) | v3 set this at 28 → 40. Visual review showed desktop 40 px too small relative to flanking body copy (lead = 20 px). v4 bumped to 48. |
| 2026-05-27 | Marketing hero locked to 36 → 64 (`--fs-display`) | This session standardised all 16 marketing/product pages to this exact range. |
| 2026-05-27 | Utopia-style `clamp(MINrem, BASErem + Xvw, MAXrem)` | rem base anchors zoom; the previous `clamp(40px, 4.45vw, 64px)` form fails WCAG SC 1.4.4 at 200% zoom in edge cases. |
| 2026-05-27 | Body/buttons/inputs/captions are FIXED (no clamp) | Interactive controls should be predictable size. Clamped buttons feel like "different controls" at different widths. |
| 2026-05-27 | Eyebrow gets a token (`--fs-eyebrow`) | Was inconsistent (10/13/14 px across pages). UPPERCASE + 0.08em tracking. |
| 2026-05-27 | iOS input zoom floor: `--fs-input: 1rem` | Safari mobile auto-zooms when input font-size < 16 px. Non-negotiable. |
| 2026-05-27 | 3-weight rule (400/500/600/700) | No 300 (looks fragile on dark backgrounds at small sizes), no 800 (off-brand for security/B2B tone). |
| 2026-05-27 | Figtree banned | Never loaded in production. References were Figma copy-paste residue. Removed in this session. |

---

## 10. Maintenance

When adding a new visual role:

1. Check if it fits an existing token (90% of the time it does — the token table is intentionally exhaustive).
2. If genuinely new, add the token here AND in `globals.css` AND update `TYPOGRAPHY-AUDIT.md`.
3. Pair the new size token with `-lh`, `-ls`, `-weight` companions.
4. Use Utopia-style clamp if fluid.
5. PR review: a senior FE + the UI/UX engineer co-sign.

When deprecating a token:

1. Mark it `@deprecated` in a CSS comment.
2. Wait one release for call-sites to migrate.
3. Delete.

---

**Document version:** 2.0 · 2026-05-27
