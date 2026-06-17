# ClickSpark — site-wide adaptive click-spark effect

**Date:** 2026-06-17
**Scope:** `apps/web` only
**Status:** design approved, pending spec review

## Goal

A subtle "spark" burst that radiates from the cursor on every click, site-wide,
**always visible on any background**. It must add effectively **zero**
runtime/bundle load when idle and pull in **no new dependency**.

## Why blend mode, not background detection

A full-site color audit (360 distinct colors, 1,688 uses) shows backgrounds span
the entire luminance range *simultaneously* — `#ffffff`/`#f6f6f6` (L≈1) and
`#111111`/`#151021`/`#10123e` (L≈0.006) are all heavily used. A single opaque
spark color therefore **cannot** maximize contrast everywhere (the color that
contrasts with white is near-invisible on near-black, and vice versa), and an
earlier adaptive approach (sample the DOM background per click, pick a light or
dark spark) added per-click `elementFromPoint` + `getComputedStyle` cost and a
`data-spark` tagging burden for gradient sections.

Instead, the canvas composites with **`mix-blend-mode: difference`** and paints a
white source. The GPU renders each spark pixel as the photo-negative of whatever
is behind it — black on white, white on near-black, a contrasting tone over the
brand color sections — so visibility is mathematically guaranteed on all 360
colors with **no background sampling at all**. This is both cheaper and simpler
than detection.

## Non-goals

- No background sampling of any kind (no `elementFromPoint`, no `getComputedStyle`).
- No effect on real interaction: the overlay never intercepts clicks, typing,
  scrolling, or text selection.
- No fixed brand hue for the spark — under `difference` the rendered color is the
  inverse of the backdrop by design.

## Component

`apps/web/src/components/ui/ClickSpark.tsx` — a single `"use client"` component,
mounted once in `apps/web/src/app/layout.tsx` inside `<body>` as a **sibling**
overlay (not a wrapper around `children`, so it cannot alter layout or the
stacking of real content).

### Props (with brand defaults)

| Prop | Default | Notes |
|---|---|---|
| `sparkSize` | `8` | spark line length (px) |
| `sparkRadius` | `15` | distance sparks travel from origin (px) |
| `sparkCount` | `6` | sparks per click |
| `duration` | `300` | ms per burst |
| `easing` | `"ease-out"` | `linear \| ease-in \| ease-out \| ease-in-out` |
| `extraScale` | `1` | radius multiplier |
| `sparkColor` | `#ffffff` | source paint color; inverts to max contrast under `difference` |

## Rendering & load profile

- One `<canvas>`, `position: fixed; inset: 0`, `pointer-events: none`,
  `aria-hidden`, high `z-index` (above content; never interactive), and
  `mix-blend-mode: difference` (Tailwind `mix-blend-difference`). Mounted via a
  portal-free fixed element — it paints over everything but blocks nothing.
- Canvas backing store sized to **`innerWidth × innerHeight × devicePixelRatio`**
  — viewport-bounded, NOT document scroll height. This is the key divergence from
  the stock react-bits wrapper (which sizes to the full child box → a
  document-tall buffer). Context scaled by DPR so sparks stay crisp on retina.
- Re-size on `window resize` via a single `rAF`-coalesced handler.
- One `pointerdown` listener on `window` (`passive: true`) — fires for mouse,
  touch, and pen. Each click pushes `{ x, y, startTime }` into a ref array. No
  background sampling happens on click — the blend mode handles contrast.
- **Lazy animation loop:** `requestAnimationFrame` runs only while ≥1 spark is
  alive; when the array drains, the loop cancels itself. An idle page does zero
  per-frame work and holds zero rAF handles.
- Pure canvas 2D — no Framer Motion / `motion`, no new npm package. Net cost ≈ 2KB
  gzipped of our own code.

## Contrast (no per-click work)

Contrast is delivered entirely by `mix-blend-mode: difference` on the canvas. The
draw loop sets `strokeStyle = sparkColor` (white) once per frame; the browser
composites each painted pixel against the live backdrop. Nothing reads the DOM,
nothing samples a background, and there is no per-section tagging.

The only pure, unit-testable logic left is the easing function:
- `ease(easing, t): number` — `linear | ease-in | ease-out | ease-in-out`.

## Accessibility

- `prefers-reduced-motion: reduce` is read live (`matchMedia(...).matches`) inside
  the `pointerdown` handler, so it always reflects the current OS setting without
  a separate listener: when reduced, the handler returns early and no rAF starts.
- Canvas is `aria-hidden` and decorative; it adds nothing to the a11y tree.

## SSR / cleanup

- All `window` / `document` / `canvas` access lives inside `useEffect`
  (client-only); the component renders just the `<canvas>` element on the server.
- `useEffect` cleanup removes the `pointerdown` and `resize` listeners and cancels
  any pending rAF.

## Testing & verification

- **Unit (Vitest, co-located `ClickSpark.test.ts`):** `ease` — endpoints pinned
  (0→0, 1→1), linearity of `linear`, ease-in/out shape, ease-in-out symmetry,
  monotonicity across the range.
- **Gates:** `pnpm --filter @cleanstart/web lint`, `typecheck`, `build`.
- **Preview (1440×900):** because the preview page renders hidden, rAF is paused
  and the live click loop can't be auto-driven. Verify instead by (1) asserting
  the canvas mounts viewport-bounded with `mix-blend-mode: difference`, and
  (2) painting a spark frame synchronously and screenshotting — the burst must
  read dark over light backgrounds and light over dark, confirming the blend.

## Files touched

- `apps/web/src/components/ui/ClickSpark.tsx` (new)
- `apps/web/src/components/ui/ClickSpark.test.ts` (new)
- `apps/web/src/app/layout.tsx` (mount once in `<body>`)
