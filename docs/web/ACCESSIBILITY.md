# ACCESSIBILITY.md — apps/web

WCAG 2.2 AA conformance is the minimum bar. Some surfaces (forms, search,
navigation) target **AAA** where reasonable. This file is the shipped
checklist + the engineering rules that produce it by default.

> Source of truth (token contrasts): [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) §3.
> Source of truth (CMS-side alt-text policy):
> [arch doc `#new-fields`](../cleanstart-cms-architecture.html#new-fields) (Media collection).

---

## 1 · Conformance target

- **Baseline:** WCAG 2.2 AA (all Success Criteria).
- **Forms:** AAA where the constraint doesn't conflict with brand (e.g.
  enhanced error identification, pronunciation guidance for unusual product
  names).
- **Tooling gate:** `@axe-core/playwright` per route, fail on any *serious*
  or *critical* violation. No tolerance for `incomplete` results to ship —
  resolve in code or document the false positive.

---

## 2 · Hard rules (CI-gated)

1. **`html lang="en-US"`** on `<html>`. Document-level. Required by 3.1.1.
2. **Title-document on every route.** Next `metadata.title` is mandatory;
   build fails on missing.
3. **Heading hierarchy** never skips levels. ESLint `jsx-a11y/heading-has-content`
   + custom rule `no-h-skip`.
4. **`alt` on every `<Image>` / `<img>`.** Decorative images must use
   `alt=""` *with the prop present*. Build fails on missing prop.
   The CMS Media collection already enforces alt-text on upload.
5. **Form `<label>` for every `<input>`/`<select>`/`<textarea>`.** Either
   wrapping or `htmlFor`. ESLint enforced.
6. **Buttons vs. links**: `<button>` for actions (submit, toggle), `<a>`
   for navigation. Never `<div onClick>`.
7. **Focus visible**: every interactive element shows a `:focus-visible`
   ring. The ring uses `--shadow-focus` (cobalt). `outline: 2px solid
   transparent` for forced-colors mode (renders as a system color).
8. **Tab order** matches reading order. Never `tabindex>0`. Use DOM order
   to drive tab order; reorder visually with CSS only.
9. **No keyboard traps.** Every modal closes on Esc; every Drawer focus-
   traps but releases on close; carousels/marquees do not steal focus.
10. **Reduced motion**: `prefers-reduced-motion: reduce` honored
    site-wide via the global utility (DESIGN-SYSTEM §6).

---

## 3 · Per-component checklist

### Header / Nav

- `<nav aria-label="Main">` on the primary nav, `<nav aria-label="Footer">`
  on the footer.
- Skip-link `<a href="#main-content">` first focusable element on the
  page, visually hidden until focused.
- Mega-nav: `<button aria-expanded aria-controls>` for each top-level item;
  panel `role="region"` with descriptive `aria-label`.
- Mobile drawer: focus-trap on open; focus returns to trigger on close.
- Active-route indicator must not be color-only — also bold weight or
  underline.

### Footer

- `<nav aria-label="Footer">` wrap.
- Social icons: `<a aria-label="LinkedIn"><LinkedinIcon aria-hidden /></a>`.

### Hero

- Headline is the only `h1`.
- CTAs: descriptive labels ("Get a demo" not "Click here").
- Background images / decorative blobs: `aria-hidden="true"` and never
  the LCP element.

### Cards (FeatureGrid, Stats, etc.)

- If the whole card is clickable: render as `<a>` with the heading as link
  text; supporting copy after.
- Avoid "card-link" patterns where text isn't part of the link target —
  hurts screen-reader users.

### Forms

- Programmatic label per field (`<label htmlFor>` or wrap).
- `aria-describedby` wires hint and error to the field; both visible to
  sighted users too.
- Required marker: ` *` AND `aria-required="true"`. Never red-only.
- Validation errors:
  - inline + `role="alert"` for the *summary* announcement
  - per-field `aria-invalid="true"` + `aria-describedby`
  - error text references the field name explicitly ("Work email is
    required" not "This field is required")
- Submit: pending state via `useFormStatus()` + spinner with
  `aria-live="polite"` ("Submitting…").
- Honeypot field: `<input aria-hidden="true" tabIndex={-1}
  autocomplete="off">` and visually hidden.

### Modals / Dialogs

- Use Radix `Dialog`. Focus-trap on open; first interactive element
  receives focus; closes on Esc + scrim click.
- `aria-labelledby` on the dialog points at the heading; `aria-describedby`
  optional for the body.
- Title must be present even if visually hidden.

### Tooltips

- Use Radix `Tooltip`. Default delay 200ms. Tooltip content **must not be
  the only place** information is available — duplicate critical info in
  visible text or `aria-label`.

### Tables

- `<caption>` summarises the table; can be visually hidden but always
  present.
- `<th scope="col\|row">` correct.
- Sortable headers: `<button>` inside `<th>`, `aria-sort="ascending\|descending\|none"`.

### FAQ

- `<details>` / `<summary>` native; no JS needed. Free a11y.
- If a custom accordion ships later: `<button aria-expanded
  aria-controls>` + region.

### Embeds

- `<iframe title="…">` always; descriptive (not "video player").
- Lazy-load with poster image; the poster has its own `alt` describing
  the video subject.

### Search

- `<form role="search">` (Radix InstantSearch handles).
- Live region announces result count: `role="status" aria-live="polite"`.
- Each result link's accessible name = full title (not "Read more").

---

## 4 · Color & contrast

Every shipped pair passes AA at the intended size — DESIGN-SYSTEM §3
documents the table. Engineering rules:

- **Audit the tokens, not the components.** The `audit:contrast` script
  walks semantic pairs and fails on AA breach.
- **Never use color as the only signal.** Required, error, success,
  warning, all interactive states pair with an icon, label, or weight
  change.
- **Brand cyan + white text fails AA.** Cyan buttons take **black** text.
  This is captured in the Button primitive variants.
- **Forced-colors mode** (Windows high-contrast): primitives explicitly
  set `forced-color-adjust: auto` for body controls and `none` for brand
  surfaces (so the brand cyan doesn't get repainted). Confirmed visually
  per primitive in W-B.

---

## 5 · Keyboard navigation

- **Tab order**: DOM order; verified per page in W1, W3, W4 (the
  interaction-heavy waves).
- **Arrow keys**: opt-in patterns where Radix handles (Tabs, Menu,
  Tooltip, Dialog children). Never reinvent.
- **Esc**: closes Dialogs, Drawers, NavMega panels.
- **Enter / Space**: activates buttons (the default — don't override).
- **Skip link**: first focusable element; styles when focused.
- **Carousels**: keyboard-navigable (Tab into, Left/Right arrow, pause on
  Space). Auto-advance suppressed when any descendant is focused.

---

## 6 · Screen reader testing

Manual passes per wave on:
- **VoiceOver** (macOS) + Safari
- **NVDA** + Firefox or Chrome (Windows)
- **TalkBack** + Chrome (Android, mobile-360 viewport)

Document issues in tickets; fix before wave acceptance. The first
significant pass is in W1 on Home + 404; subsequent passes scope to the
new pages in that wave.

### Patterns to verify per wave

- Page title announces correctly on route change (Next default behavior;
  verify in dev once).
- Form errors announce within 1s of submit.
- Modal title announces on open; focus lands inside.
- Search results count announces as numbers refresh.
- Carousel slide change announces ("Slide 2 of 5: …").

---

## 7 · Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

Plus per-component opt-outs:
- Stats count-up disabled (numbers render at final value immediately).
- Logo marquee paused (static row).
- Carousel auto-advance disabled (manual nav still available).
- Page transitions use `prefers-reduced-motion` to skip.

---

## 8 · Reduced transparency

`prefers-reduced-transparency: reduce` (newer media query, Safari +
Chrome) — `<GlassSurface>` falls back to a solid `bg-surface-soft` with
the same border. The primitive handles this; component code doesn't
think about it.

---

## 9 · Forced-colors mode

Windows high-contrast users get system colors. We:
- Don't set `background-color: transparent` on interactive elements
  (those become invisible — set `background-color: ButtonFace`).
- Use `outline` on focus, not just `box-shadow` (box-shadow is
  ignored under forced colors).
- Test once per wave by enabling Windows Settings → Accessibility →
  Contrast themes → "Aquatic".

---

## 10 · Touch & input (WCAG 2.2 specifics)

WCAG 2.2 added two SC that catch most modern marketing-site failures:

- **2.5.8 Target Size (Minimum) AA = 24×24 CSS px** for all pointer
  targets. We exceed it: touch targets go to **44×44** (`min-h-11 min-w-11`
  on Button) which also meets WCAG 2.1 AAA (44×44). Inline link targets
  inside body prose are exempt provided they meet 24×24 — Tailwind's
  default text size + `leading-relaxed` clears this.
- **2.4.11 Focus Not Obscured (Minimum) AA** — when the user tabs to an
  element, no part of it can be hidden by a sticky header/footer/cookie
  banner. We solve this with `scroll-margin-top: 80px` on every
  focusable element (set on `:focus-visible` via a global utility) so
  scroll-into-view clears the sticky header. Cookie banner closes itself
  before the next tab event.
- **Spacing between targets ≥ 8px** to prevent fat-finger errors. Cards
  in grids use `gap-6` (24 px) by default.
- **No hover-only affordances.** Every hover-reveal also responds to
  focus + tap.
- **Drag-and-drop** (if introduced): always have a non-drag alternative
  (WCAG 2.5.7).
- **Hover-card patterns**: convert to tap-to-open on touch.

### Skip link selector (the exact one)

```css
.skip-link {
  position: absolute;
  inset-block-start: -40px;
  inset-inline-start: 0;
  padding: 0.5rem 1rem;
  background: var(--color-bg);
  border: 2px solid var(--color-text-primary);
  z-index: 100;
}
.skip-link:focus-visible {
  inset-block-start: 0;
}
```

Reveal is on `:focus-visible` only — never `:focus` (would also fire on
mouse click) and never `:hover`. Document this so content / chrome
changes don't accidentally hide it via `display:none`.

### State without color

Every state pairs **color + icon + text** for AA conformance:

```html
<!-- Error state — none of these alone is sufficient -->
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
  class="border-danger"
/>
<p id="email-error" role="alert">
  <AlertCircleIcon aria-hidden="true" />
  Work email is required.
</p>
```

If a future PR removes the icon "for layout reasons", a11y CI fails.

---

## 11 · Forms — extra rigor (AAA where reasonable)

- **Autocomplete attributes** (`autocomplete="email"`, `"name"`,
  `"organization"`, `"tel"`) on every relevant field — improves UX *and*
  satisfies WCAG 1.3.5.
- **Input purpose** (3.3.7): wired via the autocomplete + correct
  `inputmode`/`type` (`email`, `tel`, `url`).
- **Help & confirmation**: error prevention for any form that triggers a
  legal commitment (none in W1; revisit if added).
- **Pronunciation** (3.1.6): provide pronunciation cues for unusual product
  names where context is critical. CleanSight, CleanStart, SBOM are
  generally read correctly; document in copy if a screen reader struggles.

---

## 12 · Page-level structure (semantic landmarks)

Every page has these landmarks once each:

```
<header>            site header
<nav aria-label="Main">
<main id="main-content">
<footer>            site footer
<nav aria-label="Footer">
```

Optional per-page:
- `<aside>` for ToC sidebars on long-form posts
- `<section aria-labelledby>` for major content blocks (FAQ, Pricing)

---

## 13 · Internationalization-ready

Even though we ship `en-US` only at launch:
- Never hardcode RTL/LTR-specific CSS; use logical properties
  (`padding-inline-start`, not `padding-left`).
- Keep date / time / number formatting in `Intl.*` (no `toLocaleDateString`
  with hard-coded locale).
- All strings in CMS or `lib/copy.ts`, never inline; eases later i18n.

---

## 14 · CI gate

```yaml
# .github/workflows/a11y.yml — runs on every PR
- name: a11y audit
  run: pnpm --filter @cleanstart/web test:a11y    # @axe-core/playwright
  # Fails on any serious/critical violation.
- name: contrast audit
  run: pnpm audit:contrast
```

The matrix tests `@w1-home`, `@w2-solutions`, etc., per-tag — only changed
waves run on every PR; full sweep nightly.

---

## 15 · Manual audits (cadence)

| Surface | Cadence | Tools |
|---|---|---|
| Home | Per-PR + before each launch | Lighthouse, axe, NVDA, VoiceOver |
| Forms | Per-form-change PR | NVDA + manual screen-reader pass |
| Modals / mega-nav | When any change to chrome | Keyboard + VoiceOver + Tab + Esc |
| Long-form prose (blog/news) | Sample 3 posts per wave | Reader-mode test, ToC nav test |
| Embeds | Per-allow-list change | Each embed type once |

---

## 16 · Open accessibility decisions

- **Skip-link visual style**: hidden until focused, then top-left button.
  Designer to confirm exact treatment in W-B.
- **Focus-ring color** on brand-cyan surfaces — cobalt may clash. Confirm
  with designer; fallback to a 3px outer + 1px inner pattern if needed.
- **Live-chat bot** (Intercom): vendor a11y is mixed. Document
  workarounds where keyboard / screen reader users have to alternative
  contact path (`/contact-us`) clearly available without chat.
