> **ARCHIVED 2026-05-21.** This document is superseded by [`../RESPONSIVE-SYSTEM-AUDIT.md`](../RESPONSIVE-SYSTEM-AUDIT.md). Kept for historical reference only.

# CleanStart Web — Typography

Canonical reference for fonts, type scale, and per-role usage on `apps/web`. This doc is the source of truth; if Figma and this doc disagree on a token name, this doc wins.

> **For role → token mapping on component work** (which token a given card title / lead body / section padding uses), the canonical source is the **v3 Consistency Layer** section in [design-tokens.md](./design-tokens.md). The tables there supersede the role rows in this file for any component touched after 2026-05-20. This file remains canonical for the font *families*, the underlying *scale*, and the long-form CMS-prose typography research.

---

## Families

| Family    | Role             | Variable           | Weights loaded |
|-----------|------------------|--------------------|----------------|
| Manrope   | Display / headings | `--font-manrope` exposed as `--font-display` | 500, 600, 700, 800 |
| Sora      | Body / UI         | `--font-sora` exposed as `--font-sans`        | 400, 500, 600, 700 |

Both are Google Fonts, loaded once via `next/font/google` in [src/app/layout.tsx](../src/app/layout.tsx). Manrope's tight, geometric letterforms read well at display sizes (≥1.5rem). Sora's higher x-height and rounded humanist forms keep body and UI text legible at 1rem and below.

Tailwind utilities:

- `font-display` → Manrope (headings, section titles, card titles)
- `font-sans` → Sora (everything else; inherited by default)

---

## Type scale

Defined in [src/app/globals.css](../src/app/globals.css) `@theme` block. All values are `rem` or `clamp(rem, vw, rem)` — never `px`.

| Token              | rem        | ≈px        | Use                                          |
|--------------------|------------|------------|----------------------------------------------|
| `--text-2xs`       | 0.6875rem  | 11px       | Legal, micro-labels                          |
| `--text-xs`        | 0.75rem    | 12px       | Eyebrow labels, badges, tags                 |
| `--text-sm`        | 0.875rem   | 14px       | Captions, table cells, small meta            |
| `--text-base`      | 1rem       | 16px       | Default body, nav links, buttons             |
| `--text-lg`        | 1.125rem   | 18px       | Lead paragraph, card body, footer body       |
| `--text-xl`        | 1.25rem    | 20px       | Card titles (small), large body              |
| `--text-2xl`       | 1.5rem     | 24px       | Card titles (default), H4                    |
| `--text-3xl`       | 1.875rem   | 30px       | H3, large card titles                        |
| `--text-4xl`       | 2.25rem    | 36px       | H2 (mobile floor), small section title       |
| `--text-display-sm`| `clamp(1.75rem, 4.6vw, 3.4375rem)` | 28→55px | CTA / mid-page display |
| `--text-display-md`| `clamp(2rem, 5.2vw, 3.875rem)`     | 32→62px | Standard section title (Figma "Display 62") |
| `--text-display-lg`| `clamp(2.25rem, 6.5vw, 4.5rem)`    | 36→72px | Hero H1                            |
| `--text-card-title-xl` | `clamp(1.5rem, 2vw, 2.0625rem)`  | 24→33px | Feature-card title (hero rank) — `FactoryCard`, `AboutPowering FeatureCard` |
| `--text-card-title-lg` | `clamp(1.375rem, 1.8vw, 2rem)`   | 22→32px | Standard card title — Security headers, HowCleanStartHelp, AsrApproach, AsrFitsBuilt, AboutWhoWeAre pillars |
| `--text-card-title-md` | `clamp(1.125rem, 1.4vw, 1.5rem)` | 18→24px | Compact card title — Blog/News/Resource/Event/Webinar/PodcastEpisode |
| `--text-card-title-sm` | `clamp(1rem, 1.1vw, 1.3125rem)`  | 16→21px | Pill / tab label |
| `--text-body-xl`   | `clamp(1.0625rem, 1.4vw, 1.5rem)`  | 17→24px | Lead body (section intro paragraph below H2) |
| `--text-body-lg`   | `clamp(1rem, 1.2vw, 1.375rem)`     | 16→22px | Standard card body, bullet items |
| `--text-body-md`   | `clamp(0.9375rem, 1vw, 1.125rem)`  | 15→18px | Secondary text, compact card body, marquee strap |
| `--text-body-sm`   | `clamp(0.875rem, 0.9vw, 1rem)`     | 14→16px | Meta, table cells, share-rail labels |
| `--text-body-xs`   | `clamp(0.75rem, 0.85vw, 0.875rem)` | 12→14px | Eyebrow, breadcrumb, caption |

---

## Role → token map

Apply these consistently across every page.

| Role                              | Font     | Weight | Size              | Line-height | Tracking   |
|-----------------------------------|----------|--------|-------------------|-------------|------------|
| Hero H1                           | Manrope  | 700    | `text-display-lg` | 1.05        | -0.04em    |
| Section title (H2)                | Manrope  | 700    | `text-display-md` | 1.05        | -0.04em    |
| Sub-section title / mid CTA       | Manrope  | 700    | `text-display-sm` | 1.1         | -0.03em    |
| H3 (in-page subhead)              | Manrope  | 600    | `text-3xl`        | 1.2         | -0.02em    |
| H4 / large card title             | Manrope  | 600    | `text-2xl`        | 1.25        | -0.02em    |
| Card title (default)              | Manrope  | 600    | `text-xl`         | 1.3         | -0.01em    |
| Card title (compact)              | Manrope  | 600    | `text-lg`         | 1.35        | normal     |
| Eyebrow label                     | Sora     | 600    | `text-sm` uppercase | 1.2       | 0.08em     |
| Lead paragraph                    | Sora     | 400    | `text-lg`         | 1.55        | normal     |
| Body                              | Sora     | 400    | `text-base`       | 1.6         | normal     |
| Small body / card description     | Sora     | 400    | `text-sm`         | 1.55        | normal     |
| Caption / meta                    | Sora     | 400    | `text-xs`         | 1.4         | normal     |
| Nav link                          | Sora     | 500    | `text-base`       | 1           | normal     |
| Button (default)                  | Sora     | 600    | `text-base`       | 1           | normal     |
| Button (small / pill)             | Sora     | 600    | `text-sm`         | 1           | normal     |
| Footer body                       | Sora     | 400    | `text-sm`         | 1.6         | normal     |
| Footer column heading             | Manrope  | 600    | `text-base`       | 1.3         | normal     |
| Footer legal / fine print         | Sora     | 400    | `text-2xs`        | 1.4         | normal     |

---

## Component cheatsheet (copy-paste classNames)

```tsx
// Hero H1
<h1 className="font-display text-display-lg font-bold leading-[1.05] tracking-[-0.04em] text-white">

// Section title (H2)
<h2 className="font-display text-display-md font-bold leading-[1.05] tracking-[-0.04em] text-cs-text-dark">

// Mid-page CTA title
<h2 className="font-display text-display-sm font-bold leading-[1.1] tracking-[-0.03em]">

// Card title
<h3 className="font-display text-xl font-semibold leading-[1.3] tracking-[-0.01em]">

// Lead paragraph
<p className="font-sans text-lg leading-[1.55]">

// Body paragraph
<p className="font-sans text-base leading-[1.6]">

// Small body / card description
<p className="font-sans text-sm leading-[1.55]">

// Caption / meta
<span className="font-sans text-xs">

// Eyebrow label
<span className="font-sans text-sm font-semibold uppercase tracking-[0.08em]">

// Nav link
<a className="font-sans text-base font-medium">

// Primary button
<button className="font-sans text-base font-semibold">

// Footer column heading
<h4 className="font-display text-base font-semibold">

// Footer legal
<span className="font-sans text-2xs">
```

---

## Rules

1. **No `px` font sizes.** Use `rem`, `clamp(rem, vw, rem)`, or a Tailwind `text-*` utility that resolves to one.
2. **Headings use `font-display` (Manrope).** Everything else inherits `font-sans` (Sora) — do not set `font-sans` on body text unless you're overriding a parent.
3. **Negative letter-spacing** (`-0.04em`, `-0.02em`) only on display sizes ≥ 1.5rem. Body copy with negative tracking reduces legibility.
4. **Body line-height ≥ 1.55** to satisfy WCAG 1.4.12 Text Spacing.
5. **No arbitrary `text-[Xpx]`.** Prefer a token (`text-base`, `text-display-md`). Only fall back to `text-[Xrem]` for genuinely off-scale needs.
6. **Display sizes are fluid (`clamp`).** Static `text-*` sizes (up to `text-4xl`) are for body / card / sub-section context.

---

## Font weight system (locked — 2026-05-21 critic-review revision)

The codebase follows a strict role-based weight scale. Empirical survey of 21 hero H1s, 15 section H2s, 6 compact card titles, and the 4 standard card titles produced this canonical mapping. Rationale: Manrope SemiBold (600) at large display reads cleaner than Bold (700) — matches the modern 2024–2026 tech-brand convention (Linear, Vercel, Stripe, GitHub). Section H2 stays at Bold (700) to provide hierarchy contrast against the lighter hero. Compact card titles stay at Medium (500) because cards are scanning surfaces (short lines, small type) — heavier weights feel cramped.

| Weight | Role | Used by |
|---:|---|---|
| **400** | Body, captions, eyebrows, footer body | every `<p>` / lead body / card body / meta |
| **500** | Buttons, nav links, card meta rows, pills, **compact card titles** | `cs-btn-*`, `<nav>` links, card meta, **BlogCard / NewsroomCard / EventCard / ResourceCard / PodcastEpisodeCard / WebinarCard / AuthorPosts card titles** |
| **600** | **Hero H1**, sub-headings, footer column heads, in-page H3, eyebrows-with-emphasis | **every hero H1 site-wide** (Manrope SemiBold; 21/21 already correct), `<h3>` in body content, footer column heads |
| **700** | **Section H2**, mid-CTA, in-page heading-class elements, standard card titles (FactoryCard / AboutPowering FeatureCard / ComparisonCard), badges | every section title, mid-CTA title, feature-card title outside heroes |

**Strict rule: no `font-extrabold` (800), `font-black` (900), or `fontWeight: 800`+ anywhere on marketing pages.** The single historic offender (`VulnRethinking` VS badge) was normalised to 700 on 2026-05-20.

**Rules:**

- **No `fontWeight: 800`** anywhere in the marketing site (CMS-prose excepted — `.article-body` may go to 800 only if a future authored markdown explicitly requests `<strong>` inside an `<h1>` and the renderer chooses to honor it).
- **Card-level titles** are 500 (`BlogCard`, `FactoryCard`) or 600 (`WebinarCard`, `NewsroomCard`) — intentionally lighter than section heads so the visual hierarchy stays legible.
- **Buttons are 500** even on display-class CTAs; only label colour + size separate primary from secondary, not weight.
- **Inline-strong inside body** uses 600, never 700, to keep the in-paragraph emphasis distinct from a heading entering the reading flow.

**CMS-prose weights** (locked in `globals.css` `.article-body`; do not override per-page):

| Element | Weight |
|---|---:|
| paragraph, `ul`/`ol` | 400 |
| `<h1>` (article title, in DetailHero) | 700 |
| `<h2>` | 700 |
| `<h3>` | 600 |
| `<h4>` / `<h5>` / `<h6>` | 600 |
| `<blockquote>` | 400 (italic) |
| `<code>` / `<pre>` | inherits (monospace) |

---

## Adding a new size

1. Add the token to the `@theme` block in [src/app/globals.css](../src/app/globals.css):
   ```css
   --text-foo: 1.625rem; /* 26px */
   ```
2. Tailwind v4 auto-generates the `text-foo` utility. Use it directly:
   ```tsx
   <p className="text-foo">…</p>
   ```
3. If the new size has a clear role (e.g. "card title XL"), add a row to the **Role → token map** above and the cheatsheet so the next contributor finds it.

---

## Accessibility checklist

- Browser zoom to 200% on every page — text scales without layout breaking. (This is the payoff for using `rem`.)
- Body line-height ≥ 1.55 everywhere — meets WCAG 1.4.12.
- Minimum legible size is `text-2xs` (11px) and reserved for legal/fine-print. Default body is `text-base` (16px).
