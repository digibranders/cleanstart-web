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

Axe runs on 25 pages as the role that uses each (WCAG 2.0 and 2.1, levels A and AA; serious and critical fail the test), at 1440 px (`desktop`) and 393 px (`mobile`).

| Project | Pages | Failing before | Failing now |
|---|---|---|---|
| desktop 1440 | 25 | 1 (`/apply`) | 0 |
| mobile 393 | 25 | 3 (`/apply`, `/admin/approvals`, `/partner/deals` as the sales user) | 0 |

Fixes:

| File | Rule | Change |
|---|---|---|
| `src/components/screens/Apply.tsx` | `link-in-text-block` | the Privacy policy link is underlined, so it no longer relies on colour alone. Colour and layout are unchanged. |
| `src/components/ui/scroll-region.tsx` and the 12 table wrappers in the screens and `components/partners` | `scrollable-region-focusable` | each `overflow-x: auto` table wrapper is now a `ScrollRegion`. It looks the same. When the table is wider than the screen and holds nothing focusable (an empty "My queue", a list whose rows carry no link), it gets `tabIndex=0`, `role="region"` and an `aria-label`, so the arrow keys still scroll it. With links or buttons inside it adds no tab stop. |
| `src/styles/portal.css` | focus visibility | a 2 px outline for a focused scroll region, same purple as the other focus rings. |

The `RegisterDeal.tsx` `aria-controls` fix and the top bar search button name from the plan were already in the converted tree. No contrast token was changed, and no brand colour was touched.

Moderate and minor advisories: the suite attaches them to the report when axe finds any. The full run attached none.

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
- Escape closes, and focus returns to the control that opened it;
- everything outside the dialog is made `inert` while it is open (no keyboard, pointer or screen reader access), except the click-away layer and the toast. The attribute is removed on close;
- with a dialog open from inside a drawer, only the top one answers Escape and Tab;
- the effect no longer re-runs when the parent re-renders with a new `onClose`, which would have pulled focus back to the first field on every parent re-render.

A skip link ("Skip to main content") is the first Tab stop on every signed-in page, and `<main>` has `id="main"`.

## Not covered

Screen reader testing (VoiceOver, NVDA), zoom to 400 percent, forced colors and reduced motion were not run. A person should do a 30 minute pass with a screen reader before the pilot. Contrast was checked by axe only on the states the suite reaches (default, no hover or disabled states).
