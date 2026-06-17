# Home hero heading animation — "Focus Settle + Living Accent"

**Date:** 2026-06-17
**Scope:** `apps/web` home hero `<h1>` only ("Verified. Secure. Built for the AI Era.")
**Status:** design approved (combo D, heading-only), pending spec review

## Goal

Replace the home hero H1's plain fade-up entrance with a richer, on-brand motion
combination that reads as premium rather than gimmicky, **without regressing LCP**
(the H1 is the LCP element) and **without a new dependency**.

Combo **D** = two layered effects:

1. **Focus Settle (entrance, one-shot):** the three phrases — "Verified.",
   "Secure.", "Built for the AI Era." — rise + un-blur + fade in, staggered
   left→right (the "True Focus" feel).
2. **Living Accent (persistent, gentle):** the phrase "AI Era" carries a static
   brand cyan→purple gradient with a soft white shimmer that sweeps through it
   periodically (~every 5 s) — the "Shiny Text" feel, scoped to two words.
3. A single soft white **glint** sweeps the whole heading once, right after the
   phrases settle (the "settle shimmer").

## LCP / SSR safety (the hard constraint)

The H1 is the LCP element. The codebase already moved the hero entrance to **pure
CSS** (`cs-hero-reveal`) specifically because a JS-gated (Framer) version rendered
`opacity:0` in SSR and stranded LCP behind hydration. This feature follows the
same rules:

- **Pure CSS only** — no JS, no `motion`, no new dependency. The new component is
  a server component (no `"use client"`), so zero client JS ships for it.
- The full heading text renders in the **server HTML**, in document order, inside
  a real `<h1>`. No character insertion, no text held back.
- `opacity:0` / `blur` only ever live in a keyframe `from` with `animation-…
  both` (never in a base rule) — mirroring `cs-hero-reveal`, so the natural
  rendered state is the final, visible state.
- `prefers-reduced-motion: reduce` sets `animation: none` on every piece and
  hides the one-shot glint overlay; the heading then renders fully visible and
  static, with the accent gradient kept (a static gradient is not motion).

## Architecture

One new presentational server component:

`apps/web/src/components/sections/home/HeroHeading.tsx`

- Renders the `<h1 class="cs-hero-h1 …">` carrying the existing role-token styling
  (`font-size: var(--fs-display-home)`, `letter-spacing: var(--fs-display-ls)`,
  `line-height: 1.05`, `font-display`, `font-semibold`, `text-white`) — unchanged
  from today, so no typography drift.
- Structure (whitespace via `{" "}` so phrases stay separate inline-blocks):
  `<span class="cs-hh-phrase">Verified.</span> <span class="cs-hh-phrase">Secure.</span> <span class="cs-hh-phrase">Built for the <span class="cs-hh-accent">AI&nbsp;Era</span>.</span>`
- "AI Era" uses a non-breaking space so it never wraps mid-accent.

`apps/web/src/components/sections/home/Hero.tsx`

- Replace the current `<HeroReveal y={50} duration={1.0}><h1>…</h1></HeroReveal>`
  with `<HeroHeading />`. The lead paragraph and CTA keep their existing
  `HeroReveal` entrances (scope = heading only).

## CSS (added to `globals.css`, beside `cs-hero-reveal`)

- `.cs-hh-phrase` — `display: inline-block`; `animation: cs-hh-focus 0.8s
  cubic-bezier(0.16,1,0.3,1) both`. Per-phrase `animation-delay` via `:nth-child`
  (≈0.05s / 0.22s / 0.39s).
- `@keyframes cs-hh-focus` — `from { opacity:0; filter:blur(12px);
  transform:translateY(0.18em); } to { opacity:1; filter:blur(0);
  transform:none; }`.
- `.cs-hh-accent` — `-webkit-background-clip:text; background-clip:text;
  color:transparent;` over a `linear-gradient` carrying a white highlight band
  (deep purple `#471ec0` → cyan `#22e0ff` → white → `#9a51ff`), `background-size`
  ~250%, `animation: cs-hh-shine 5.5s ease-in-out infinite` that holds then sweeps
  the highlight through once per cycle. Base gradient stays visible between shines.
- `.cs-hero-h1` — `position: relative;` plus a `::after` glint overlay
  (`pointer-events:none`, diagonal translucent-white gradient, `mix-blend-mode:
  screen`, `animation: cs-hh-sweep 1.1s ease-out 0.95s 1 both`) that sweeps once
  after the phrases settle, then stays out of the way.
- A `@media (prefers-reduced-motion: reduce)` block disables `cs-hh-focus`,
  `cs-hh-shine`, and the `::after` glint, and keeps the accent gradient static.

`will-change` is set only on the actively-animating bits (`opacity, transform,
filter` on phrases) and dropped after; the accent shimmer animates
`background-position` on a two-word region (cheap). No perpetual full-page work.

## Testing & verification

- **Gates:** `pnpm --filter @cleanstart/web lint`, `typecheck`, `build`
  (compile phase; CMS-prerender ETIMEDOUT is the known environmental failure).
- **No unit test** — this is pure CSS + static JSX with no logic to assert; a
  snapshot of marble-in-motion CSS would be brittle and low-value.
- **Preview (1440×900):** confirm (1) the H1 text is present in the initial DOM
  (LCP-safe), (2) the three phrases carry `cs-hh-phrase` and the accent carries
  the gradient (`color: transparent` + background-clip), (3) a screenshot shows
  "AI Era" rendered in the cyan→purple gradient. The entrance/shimmer timing
  itself can't be auto-driven in the hidden preview (rAF/animation throttling),
  same limitation noted for ClickSpark — verify structure + the static gradient
  paint, which is what proves the wiring.

## Files touched

- `apps/web/src/components/sections/home/HeroHeading.tsx` (new)
- `apps/web/src/components/sections/home/Hero.tsx` (swap H1 for `<HeroHeading />`)
- `apps/web/src/app/globals.css` (new keyframes + classes + reduced-motion guard)
