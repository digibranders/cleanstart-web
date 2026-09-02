# Hero "Verified over struck-through Hardened" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage hero H1 into a three-line, one-shot animated sequence — "Verified" / "Hardened. Secure." (Hardened struck through) / "Built for the AI Era." — per the approved design at `docs/superpowers/specs/2026-09-01-hero-verified-hardened-design.md`.

**Architecture:** Single server component (`HeroHeading.tsx`) restructured from two text spans into three block-level lines wrapped in one `aria-hidden` container (with a clean `aria-label` on the `<h1>` for the accessible name), driven entirely by CSS keyframes in `globals.css` — no client JS, no new dependencies, no new typography tokens.

**Tech Stack:** Next.js 16 server component, plain CSS keyframes (Tailwind v4 project, but this block is hand-written CSS like its predecessor).

---

## File Structure

- Modify: `apps/web/src/components/sections/home/HeroHeading.tsx` — JSX structure + accessibility attributes.
- Modify: `apps/web/src/app/globals.css:1471-1623` — replace the `.cs-hh-*` rule block with the new three-line sequence (keeps the same rule-block location and naming prefix).
- No test files: this is a presentational, CSS-only animation with no business logic to unit test. Verification is lint/typecheck/build (per `CLAUDE.md`'s mandatory pre-completion checks) plus a manual visual check in the browser preview (per `CLAUDE.md`'s "test the golden path in a browser" rule for UI changes) — there is nothing here TDD applies to.

---

### Task 1: Restructure `HeroHeading.tsx` into three accessible lines

**Files:**
- Modify: `apps/web/src/components/sections/home/HeroHeading.tsx` (full file, currently 33 lines)

- [ ] **Step 1: Replace the component**

Replace the entire file contents with:

```tsx
// Home hero H1 with a layered, on-brand motion sequence:
//   1. "Hardened. Secure." (brand cyan→purple gradient) reveals via a
//      stepped clip "type-on" + blinking caret, then snaps from soft blur
//      into sharp focus.
//   2. "Hardened." gets struck through and desaturates to muted gray —
//      the industry's claim, rejected.
//   3. "Verified" rises into focus on its own line above, in the same
//      gradient as "Secure." — the correction, and the brand's actual
//      claim. A continuous gradient shine starts once it lands.
//   4. "Built for the AI Era." (white) focus-settles in last.
//
// Server component (no "use client") — the effect is pure CSS, so zero client JS
// ships for it and the FULL heading text is present in the server HTML (the
// type-on is a clip reveal, not character insertion). That is load-bearing: the
// H1 is the LCP element and screen readers must read the whole phrase. The
// struck-through "Hardened" is a visual/rhetorical device, not part of the
// coherent accessible name, so the visual markup is aria-hidden and the <h1>
// carries an explicit aria-label with the clean phrase instead. All motion
// lives in keyframes (never in base rules) so prefers-reduced-motion falls
// back to the final, static, fully-visible heading. Timing/keyframes: the
// cs-hh-* rules in globals.css. Typography stays on the role tokens
// (--fs-display-home / --fs-display-ls) exactly as before.
export function HeroHeading() {
  return (
    <h1
      className="cs-hero-h1 font-display font-semibold text-white"
      style={{
        fontSize: "var(--fs-display-home)",
        letterSpacing: "var(--fs-display-ls)",
        lineHeight: 1.05,
      }}
      aria-label="Verified. Secure. Built for the AI Era."
    >
      <span aria-hidden="true">
        <span className="cs-hh-verified">Verified</span>
        {/* Caret lives on the wrapper so the inner clip-path doesn't crop it. */}
        <span className="cs-hh-typewrap">
          <span className="cs-hh-line2">
            <span className="cs-hh-hardened">
              <span className="cs-hh-hardened-grad">Hardened.</span>
              <span className="cs-hh-hardened-gray">Hardened.</span>
            </span>{" "}
            <span className="cs-hh-secure">Secure.</span>
          </span>
        </span>
        <span className="cs-hh-phrase">Built for the AI&nbsp;Era.</span>
      </span>
    </h1>
  );
}
```

- [ ] **Step 2: Sanity-check the JSX compiles**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: no new errors from this file (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/home/HeroHeading.tsx
git commit -m "feat(web): restructure hero H1 into Verified/Hardened three-line markup"
```

---

### Task 2: Replace the `.cs-hh-*` CSS with the three-line sequence

**Files:**
- Modify: `apps/web/src/app/globals.css:1471-1623`

- [ ] **Step 1: Replace the CSS block**

Find the block starting at the comment `/* Home hero H1 — "type-on → true-focus" then "focus-settle + living accent"` (globals.css:1471) and ending at the closing `}` of the second `@media (prefers-reduced-motion: reduce)` block that contains `.cs-hh-type,\n  .cs-hh-phrase { animation: none; }` (globals.css:1623) — this is the exact current block:

```css
/* Home hero H1 — "type-on → true-focus" then "focus-settle + living accent"
   (see HeroHeading.tsx). Pure CSS so the LCP H1 text paints from the server
   HTML; clip/opacity/blur live only in keyframes (never base rules), so
   reduced-motion (animation: none) falls back to the final, fully-visible
   heading. Timeline: 0.15s type-on starts → ~1.05s typed → focus snap →
   1.25s line 2 focus-settles → ~2.2s accent shimmer + settle glint. */
.cs-hero-h1 {
  position: relative;
}

/* 1 · "Verified. Secure." — stepped clip reveal (type-on) held soft, then a
   smooth blur→sharp focus snap once the line is fully revealed. */
.cs-hh-typewrap {
  display: inline-block;
  position: relative;
  white-space: nowrap;
}

.cs-hh-type {
  display: inline-block;
  /* Brand cyan→purple gradient (shared H2 stops, .cs-text-gradient-impact),
     mirrored periodic so the continuous drift loops seamlessly. */
  background-image: linear-gradient(100deg,
      #2cc1eb 0%,
      #9a51ff 50%,
      #2cc1eb 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation:
    cs-hh-reveal 0.9s steps(17) 0.15s both,
    cs-hh-snap 0.5s ease-out 1.05s both,
    cs-hh-shine 6s linear 1.6s infinite;
  /* No will-change: the clip/blur entrance is one-shot, and the looping
     background-position shine is a paint (not a compositable) property, so a
     layer hint buys nothing while holding memory on the LCP heading. */
}

@keyframes cs-hh-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes cs-hh-snap {
  from {
    filter: blur(5px);
  }

  to {
    filter: blur(0);
  }
}

/* Blinking caret that travels with the reveal edge, then fades as focus runs.
   Lives on the wrapper so the inner element's clip-path doesn't crop it. */
.cs-hh-typewrap::after {
  content: "";
  position: absolute;
  top: 0.12em;
  left: 0;
  width: 0.06em;
  height: 0.82em;
  background: currentColor;
  animation:
    cs-hh-caret-move 0.9s steps(17) 0.15s both,
    cs-hh-blink 0.7s step-end 0.15s infinite,
    cs-hh-caret-hide 0.25s linear 1.05s forwards;
}

@keyframes cs-hh-caret-move {
  from {
    left: 0;
  }

  to {
    left: 100%;
  }
}

@keyframes cs-hh-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@keyframes cs-hh-caret-hide {
  to {
    opacity: 0;
  }
}

/* 2 · "Built for the AI Era." — focus-settle entrance after the type-on line. */
.cs-hh-phrase {
  display: inline-block;
  animation: cs-hh-focus 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.25s both;
  /* One-shot focus-settle — no persistent compositor-layer hint. */
}

@keyframes cs-hh-focus {
  from {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(0.18em);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

/* Continuous seamless drift for the colored "Verified. Secure." line: scroll
   the periodic gradient by exactly one tile width so it loops with no snap. */
@keyframes cs-hh-shine {
  from {
    background-position: 0 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {

  .cs-hh-type,
  .cs-hh-phrase {
    animation: none;
  }

  /* Hold a static cyan→purple gradient on line 1 when motion is off. */
  .cs-hh-type {
    background-position: 0 0;
  }

  .cs-hh-typewrap::after {
    display: none;
  }
}
```

Replace it with:

```css
/* Home hero H1 — "reject, then correct": the industry's "Hardened. Secure."
   types on and gets struck through, then "Verified" rises above it as the
   brand's actual claim (see HeroHeading.tsx). Pure CSS so the LCP H1 text
   paints from the server HTML; clip/opacity/blur live only in keyframes
   (never base rules where avoidable), so reduced-motion (animation: none)
   falls back to the final, fully-corrected, fully-visible heading. Timeline:
   0.15s type-on starts → ~1.05s "Hardened. Secure." typed → 1.1s strike +
   desaturate lands on "Hardened" → 1.4s "Verified" rises → ~1.95s shine
   starts, line 3 focus-settles → ~2.5s fully settled. */
.cs-hero-h1 {
  position: relative;
}

/* Shared brand cyan→purple gradient text treatment (shared H2 stops,
   .cs-text-gradient-impact), mirrored periodic so the continuous drift
   loops seamlessly. Used by "Verified", "Secure.", and "Hardened." while
   it's still typing (before the strike desaturates it). */
.cs-hh-verified,
.cs-hh-secure,
.cs-hh-hardened-grad {
  background-image: linear-gradient(100deg,
      #2cc1eb 0%,
      #9a51ff 50%,
      #2cc1eb 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

/* 1 · "Verified" — the correction line. Rises into focus after the
   "Hardened" strike lands, then joins "Secure." in the continuous shine. */
.cs-hh-verified {
  display: block;
  animation:
    cs-hh-verified-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) 1.4s both,
    cs-hh-shine 6s linear 1.95s infinite;
}

@keyframes cs-hh-verified-rise {
  from {
    opacity: 0;
    filter: blur(10px);
    transform: translateY(0.15em);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

/* 2 · "Hardened. Secure." — stepped clip reveal (type-on) for the whole
   line, held soft, then a smooth blur→sharp focus snap once fully
   revealed. */
.cs-hh-typewrap {
  display: block;
  position: relative;
  white-space: nowrap;
}

.cs-hh-line2 {
  display: inline-block;
  animation:
    cs-hh-reveal 0.9s steps(17) 0.15s both,
    cs-hh-snap 0.5s ease-out 1.05s both;
  /* No will-change: the clip/blur entrance is one-shot, so a layer hint
     buys nothing while holding memory on the LCP heading. */
}

@keyframes cs-hh-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes cs-hh-snap {
  from {
    filter: blur(5px);
  }

  to {
    filter: blur(0);
  }
}

/* "Hardened." types on in the gradient (so the type-on still reads as one
   phrase), then — once the strike lands — crossfades to a muted gray twin
   stacked in the same position. */
.cs-hh-hardened {
  position: relative;
  display: inline-block;
}

.cs-hh-hardened::after {
  content: "";
  position: absolute;
  left: -2%;
  right: -2%;
  top: 50%;
  height: 3px;
  background: #ff5468;
  border-radius: 2px;
  transform-origin: left center;
  animation: cs-hh-strike 0.4s ease-out 1.1s both;
}

@keyframes cs-hh-strike {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

.cs-hh-hardened-grad {
  animation: cs-hh-fade-out 0.2s ease-out 1.1s both;
}

.cs-hh-hardened-gray {
  position: absolute;
  inset: 0;
  color: #8892a4;
  opacity: 0;
  animation: cs-hh-fade-in 0.2s ease-out 1.1s both;
}

@keyframes cs-hh-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes cs-hh-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.cs-hh-secure {
  animation: cs-hh-shine 6s linear 1.95s infinite;
}

/* Blinking caret that travels with the reveal edge, then fades as focus runs.
   Lives on the wrapper so the inner element's clip-path doesn't crop it. */
.cs-hh-typewrap::after {
  content: "";
  position: absolute;
  top: 0.12em;
  left: 0;
  width: 0.06em;
  height: 0.82em;
  background: currentColor;
  animation:
    cs-hh-caret-move 0.9s steps(17) 0.15s both,
    cs-hh-blink 0.7s step-end 0.15s infinite,
    cs-hh-caret-hide 0.25s linear 1.05s forwards;
}

@keyframes cs-hh-caret-move {
  from {
    left: 0;
  }

  to {
    left: 100%;
  }
}

@keyframes cs-hh-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@keyframes cs-hh-caret-hide {
  to {
    opacity: 0;
  }
}

/* 3 · "Built for the AI Era." — focus-settle entrance after the correction
   has landed. */
.cs-hh-phrase {
  display: block;
  animation: cs-hh-focus 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.7s both;
  /* One-shot focus-settle — no persistent compositor-layer hint. */
}

@keyframes cs-hh-focus {
  from {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(0.18em);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

/* Continuous seamless drift for the gradient "Verified"/"Secure." text:
   scroll the periodic gradient by exactly one tile width so it loops with
   no snap. */
@keyframes cs-hh-shine {
  from {
    background-position: 0 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {

  .cs-hh-verified,
  .cs-hh-line2,
  .cs-hh-hardened::after,
  .cs-hh-hardened-grad,
  .cs-hh-hardened-gray,
  .cs-hh-secure,
  .cs-hh-phrase {
    animation: none;
  }

  /* Hold the final, fully-corrected state when motion is off: "Verified"
     and "Secure." visible in a static gradient, "Hardened." shown as its
     already-struck-through gray twin. */
  .cs-hh-verified,
  .cs-hh-secure {
    background-position: 0 0;
  }

  .cs-hh-hardened-grad {
    opacity: 0;
  }

  .cs-hh-hardened-gray {
    opacity: 1;
  }

  .cs-hh-hardened::after {
    transform: scaleX(1);
  }

  .cs-hh-typewrap::after {
    display: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): animate hero H1 Hardened-strikethrough to Verified correction"
```

---

### Task 3: Verify

**Files:** none (verification only)

- [ ] **Step 1: Run the mandatory pre-completion checks (apps/web touched)**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: all three exit 0. Fix and re-run if anything fails (per `CLAUDE.md` — never skip, never report success on a red check).

- [ ] **Step 2: Visual check in the browser preview**

Start (or reuse, per `CLAUDE.md`'s Dev Server Policy) the `apps/web` dev server, open the homepage, and confirm on first load:
- Three left-aligned lines render in order: "Verified" (gradient) / "Hardened. Secure." (Hardened struck through, then gray; Secure. matches Verified's gradient) / "Built for the AI Era." (white).
- The sequence plays once (no loop/blink) and settles by ~2.5s; the gradient continues a slow shine drift on "Verified"/"Secure." afterward.
- No layout shift or overlap between the three lines.

In the browser devtools, emulate `prefers-reduced-motion: reduce` and reload — confirm all three lines are immediately visible in their final state (Hardened already struck through and gray, Verified and Secure already in gradient, no caret, no shine), with no flash of the pre-strike gradient "Hardened."

- [ ] **Step 3: Confirm the accessible name**

In devtools, inspect the `<h1>` and confirm its computed accessible name is exactly "Verified. Secure. Built for the AI Era." (from the `aria-label`), not a concatenation that includes "Hardened."

---

## Self-Review Notes

- **Spec coverage:** layout (3 lines, left-aligned) → Task 1. Shared type-on for "Hardened. Secure." → Task 2 `.cs-hh-line2`. Strike + desaturate on "Hardened." only → Task 2 `.cs-hh-hardened*`. Shared gradient for "Verified"/"Secure." → Task 2 shared rule + shine. "Built for the AI Era." unchanged styling, later delay → Task 2 `.cs-hh-phrase`. Accessibility (`aria-label` + `aria-hidden`) → Task 1. Reduced-motion fallback → Task 2 media query. Out-of-scope items (HeroAwardSlide, sibling timing) → untouched, no task references them.
- **Character count check:** "Hardened. Secure." and "Verified. Secure." are both 17 characters, so `steps(17)` on the type-on/caret carries over unchanged from the original — no retiming needed there.
- **Color values:** `#ff5468` (strike) and `#8892a4` (muted gray) are the exact values already visually approved in the browser-companion mockups during design review, not new arbitrary picks. The existing `.cs-hh-*` rules already hardcode the brand gradient hex values directly (not through `--muted`/`--destructive` tokens, which belong to the separate shadcn light/dark theme system) — these two new values follow that same established local pattern rather than introducing token usage inconsistent with the surrounding code.
