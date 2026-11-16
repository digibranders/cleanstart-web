# Partner portal accessibility pass (M5.2)

Date: 2026-11-13. Branch `feat/portal-build`, from `1d104a3f`. Run by the Wave 2 session, step W2-d.

## Lint rules

`apps/portal/biome.json` now turns on `noSvgWithoutTitle`, `useKeyWithClickEvents` and `useFocusableInteractive`. Only `useSemanticElements` stays off.

Counts come from a temporary biome config with all four rules on and `noArrayIndexKey` and `noNonNullAssertion` off, run on `1d104a3f` (before) and on the working tree (now, suppressions honoured).

| Rule | Before | Now | Decision |
|---|---|---|---|
| `noSvgWithoutTitle` | 0 | 0 | on |
| `useKeyWithClickEvents` | 6 | 0 reported, 1 suppression in `src/components/ui/scrim.tsx` | on |
| `useFocusableInteractive` | 4 | 0 reported, 4 suppressions (below) | on |
| `useSemanticElements` | 34 | not enforced (34 sites if switched on) | off: `role="group"`, `role="listbox"`, `role="status"` and `role="dialog"` on divs are valid ARIA, and native `<fieldset>`, `<select>` and `<dialog>` would change the reviewed layout and behaviour. Axe and the keyboard tests cover what this rule cannot see. |

The six `useKeyWithClickEvents` sites were all the dimmed click-away layer behind an overlay. They now use one shared `Scrim` component (drawers, dialogs, the dropdown, the notifications popover, the profile menu and the mobile menu layer). The search palette keeps its own scrim, which is a real `<button>` with `tabIndex={-1}` and a name, so it needed no suppression.

Suppressions for `useFocusableInteractive`, each with its reason in the comment:

| File | Element | Reason |
|---|---|---|
| `src/components/ui/dropdown.tsx` | `role="listbox"` menu | the options are buttons and focusable; the list itself is not a tab stop |
| `src/components/screens/RegisterDeal.tsx` | `role="listbox"` customer suggestions | same |
| `src/components/screens/SignIn.tsx` | `role="separator"` "or with your work email" | a static divider, not a focusable separator widget |
| `src/components/screens/PartnerWelcome.tsx` | `role="progressbar"` | a read-only progress display, not an interactive widget |

Two older suppressions for `noAutofocus` in `SignIn.tsx` (the one-field code and reset steps) are unchanged.

## Axe

Axe runs on 24 pages as the role that uses each (WCAG 2.0 and 2.1, levels A and AA; serious and critical fail the test), at 1440 px (`desktop`) and 393 px (`mobile`). Correction from the E2E review (round 2): the first run measured the `mobile` project at Playwright's Pixel 7 width of 412 px, not 393; it is now an explicit 393 px viewport. The same review found that the scans did not check which page they scanned, and that the technical user's `/partner/overview` scan had been scanning `/partner/documents` after a redirect (a technical user may not open the overview). That entry is gone, hence 24 pages instead of 25, and every scan now fails if the browser ended on another route or drew no main landmark. A separate `@a11y access` test per role-limited user checks which routes open and which redirect.

| Project | Pages | Failing before | Failing now |
|---|---|---|---|
| desktop 1440 | 24 | 1 (`/apply`) | 0 |
| mobile 393 | 24 | 3 (`/apply`, `/admin/approvals`, `/partner/deals` as the sales user) | 0 |

Fixes:

| File | Rule | Change |
|---|---|---|
| `src/components/screens/Apply.tsx` | `link-in-text-block` | the Privacy policy link is underlined, so it no longer relies on colour alone. Colour and layout are unchanged. |
| `src/components/ui/scroll-region.tsx` and the 12 table wrappers in the screens and `components/partners` | `scrollable-region-focusable` | each `overflow-x: auto` table wrapper is now a `ScrollRegion`. It looks the same. When the table is wider than the screen and holds nothing focusable (an empty "My queue", a list whose rows carry no link), it gets `tabIndex=0`, `role="region"` and an `aria-label`, so the arrow keys still scroll it. With links or buttons inside it adds no tab stop. |
| `src/styles/portal.css` | focus visibility | a 2 px outline for a focused scroll region, same purple as the other focus rings. |

The `RegisterDeal.tsx` `aria-controls` fix and the top bar search button name from the plan were already in the converted tree. No contrast token was changed, and no brand colour was touched.

Moderate and minor advisories: the suite attaches them to the report when axe finds any. The full run attached none.

## Scans wait for motion to finish (round 2 flake)

The palette scan (`Ctrl K opens the palette ...`) failed about 1 run in 5 on a loaded machine (7 of 30 with six busy processes running) with `color-contrast (serious)` on text behind the palette, such as `.h1-sub` and `.kpi-l`. Cause: the scan ran while the page was still animating. `.content > *` fades in from opacity 0 over 0.22 s (`cs-page-in`), the scrim and dialog fade in over 0.16 s and 0.18 s, and the loading skeleton shimmers. Axe reads the colour as painted at that instant, so text at partial opacity fails. The settled page passes with the scrim and dialog open (30 of 30), so the dimmed page behind the scrim does not fail contrast, and the scrim colour was not changed. No app change was needed.

Fix: every scan first waits until no finite animation is running and no `.skel` skeleton is showing (`animationsSettled` in `e2e/support/ui.ts`). The check itself is unchanged: it still scans the whole page with the overlay open, and the blocking rules are the same. The drawer scan did not fail in 30 runs, but had the same exposure and is covered by the same wait. Result with the wait, same load: palette 30 of 30, drawer 30 of 30.

## Keyboard

Three tests on desktop, all green:

| Test | Result |
|---|---|
| Ctrl K opens the palette with focus in the field, Tab stays inside, Escape returns focus | pass |
| every Tab stop on the deals page shows a focus indicator | pass |
| a drawer traps focus, closes on Escape and returns focus to what opened it | pass (was failing) |

Drawer and dialog behaviour (`src/components/ui/overlay.tsx`, helper `src/lib/focus-trap.ts` with unit tests):

- focus moves in on open, to the first field or the primary button;
- Tab and Shift+Tab wrap inside the dialog and pull focus back in if it ever lands outside;
- Escape closes, and focus returns to the control that opened it, or to the main content when that control has left the page (an approved row);
- everything outside the dialog is made `inert` while it is open (no keyboard, pointer or screen reader access), except the click-away layers, the toast and the Next.js route announcer (matched on the element itself, not on what it contains). The walk stops at `body`. The attribute is removed on close;
- with a dialog open from inside a drawer, only the top one answers Escape and Tab, and keys typed in the search palette opened over a drawer are left to the palette;
- the effect no longer re-runs when the parent re-renders with a new `onClose`, which would have pulled focus back to the first field on every parent re-render.

A skip link ("Skip to main content") is the first Tab stop on every signed-in page, and `<main>` has `id="main"`.

## Not covered

Screen reader testing (VoiceOver, NVDA), zoom to 400 percent, forced colors and reduced motion were not run. A person should do a 30 minute pass with a screen reader before the pilot. Contrast was checked by axe only on the states the suite reaches (default, no hover or disabled states).
