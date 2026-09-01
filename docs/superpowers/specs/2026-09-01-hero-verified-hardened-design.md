# Home hero H1: "Verified" correction over struck-through "Hardened"

## Summary

Extend the homepage hero H1 (`apps/web/src/components/sections/home/HeroHeading.tsx`) from its current two-part text into a three-line, one-shot animated sequence that stakes out a competitive position: the industry sells "hardened," CleanStart sells "verified."

## Final copy and layout

Three left-aligned lines, matching the H1's existing left alignment and typography tokens:

```
Verified
Hardened. Secure.
Built for the AI Era.
```

- Line 1, "Verified": the brand cyan→purple gradient treatment (currently used on "Verified. Secure."), on its own line, directly above line 2. No overlap with any other text.
- Line 2, "Hardened. Secure.": both words type on together as one unit (same as today's "Verified. Secure." type-on) — "Secure." is not pre-rendered/static, it reveals with the same clip-path animation as "Hardened." Only after both have typed on does "Hardened." get a red strikethrough drawn across it and render in a muted gray. "Secure." carries the SAME brand gradient as "Verified" (line 1) — the two affirmative claims read as one visual pair, while struck-through "Hardened" stands apart as the rejected term.
- Line 3, "Built for the AI Era.": unchanged from today — plain white, focus-settle entrance.

This is a straight three-line heading (real DOM lines via `display: block` spans), not an absolutely-positioned overlay stamp — confirmed against a reference screenshot during design review.

## Animation sequence ("reject, then correct")

One-shot on page load, matching the existing hero's play-once philosophy (no looping):

1. **0.15s–1.05s** — "Hardened. Secure." types on together as one unit via the existing stepped clip-path reveal (reuse `cs-hh-reveal`/caret exactly as today, just re-targeted from "Verified. Secure." to "Hardened. Secure."). "Secure." types on already carrying the brand gradient; "Hardened." types on in the same gradient too at this stage — it only switches to muted gray once struck (step 2), so the reveal itself still reads as one unified gradient phrase.
2. **1.05s–1.4s** — Red strikethrough draws left-to-right across "Hardened." only (`scaleX` on a `::after` bar), immediately after typing finishes; "Hardened." simultaneously desaturates from the gradient to muted gray as the strike lands — reads as a decisive cut, not a paused beat.
3. **1.4s–1.95s** — "Verified" (line 1) rises into view: blur→sharp focus snap + fade + slight upward settle, using the same brand gradient as "Secure." Continuous gradient shine starts at 1.95s and loops across both "Verified" and "Secure." together (reuse `cs-hh-shine`), same as today's shine.
4. **~1.7s–2.3s** — "Built for the AI Era." (line 3) focus-settles in, overlapping the tail of step 3, same easing/style as today's `cs-hh-focus`.

Total settle lands ~2.3s, close to the current hero's documented ~2.2s finish — the H1 was already the longest-running hero element (other hero elements — lead paragraph, CTAs, side panel — finish by ~1.15s per `HeroProductSlide.tsx`), so the budget is not being blown out further.

## Accessibility

- The struck-through "Hardened" is a visual/rhetorical device, not part of the coherent accessible name. The H1 gets `aria-label="Verified. Secure. Built for the AI Era."` and the visual markup (all three lines) is wrapped in a single `aria-hidden="true"` container, so screen readers hear the clean original phrase, not "Verified Hardened Secure Built for the AI Era."
- `prefers-reduced-motion: reduce` shows the final static state immediately: "Verified" visible, "Hardened." shown with a static (non-animated) strikethrough, "Secure." and "Built for the AI Era." both visible, no caret, no shine — extending the existing reduced-motion block in `globals.css`.
- Full text stays present in server-rendered HTML (no client JS): the H1 remains the LCP element, per the existing file's documented constraint.

## Implementation notes

- Server component stays a server component (no `"use client"`) — animation is pure CSS, same as today.
- New/renamed CSS classes live alongside the existing `.cs-hh-*` rules in `globals.css` (~line 1471+): keep the existing `.cs-hh-type`/`.cs-hh-reveal`/`.cs-hh-snap`/`.cs-hh-shine`/caret rules but retarget their content to "Hardened. Secure.", add a new strike-through rule/keyframe, and a new "Verified" rise-in rule/keyframe reusing the same blur→sharp philosophy as `.cs-hh-phrase`'s `cs-hh-focus`.
- Typography: same `--fs-display-home` / `--fs-display-ls` tokens, `line-height: 1.05` — no new tokens introduced, per `apps/web/docs/TYPOGRAPHY-SYSTEM.md` conventions.
- No JS/client-side animation library — everything is CSS keyframes, consistent with the file's existing "zero client JS for this effect" constraint.

## Out of scope

- No changes to `HeroAwardSlide.tsx` (a second, currently-unused carousel slide with its own plain heading) — only `HeroHeading.tsx`, used by the active product slide, is touched.
- No changes to hero timing/delays for sibling elements (lead paragraph, CTAs, side panel).
