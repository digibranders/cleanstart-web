# Design inputs (research, 2026-10-16)

> Superseded for visual values by `01-DESIGN-SYSTEM.md` (direction B, 2026-10-19). This file records the old admin's fonts, colours and tokens as evidence only. Do not take values from it.

## 10 most important design facts
1. `@cleanstart/ui` has no UI library at all, no Radix or Base UI (`packages/ui/package.json`). Dialog and Drawer are built on the native `<dialog>` element. The other primitives are headless and output BEM `cs-*` class names. All their styling is host SCSS in `apps/cms/src/app/(payload)/styles/_ui-primitives.scss` (2,577 lines).
2. The token values live in `_tokens.scss` and `_themes.scss`. Brand cyan is `#06c7f2`. Spacing is a whole-pixel 4px grid. Radii are 4/6/8/12/16. Motion is 120/160/200/240/280ms.
3. Dark mode is the primary theme. Light mode is a 19-line safety net, and the shadows are tuned for dark.
4. Fonts are Sora for body, Manrope for headings and JetBrains Mono, self-hosted with `@font-face`.
5. Payload's admin root font is about 13px. Any value in rem comes out as half-pixels.
6. The existing SCSS fights Payload's DOM: 222 `!important` rules, MutationObservers, a dash where the menu icon should be, and two button families of different heights.
7. Tailwind isn't installed in `apps/cms`. Icons are hand-written inline SVGs; `apps/web` uses `lucide-react`.
8. The CSP allows `'unsafe-inline'` for scripts and styles. Fonts may only load from the same origin.
9. Accessibility scores 6/10. The calendar grid, command palette, media grid and context menu can't be used properly from the keyboard. There are also two separate toast systems.
10. Shortcuts: ⌘K, ⌘S, ⌘⇧S, ?, Esc. The help dialog says ⌘/ toggles focus mode, but ⌘/ actually reopens the help dialog.

---

# CleanStart Studio: Design Inputs (from the repo)

Repo root: `/Users/a12345/Desktop/AI/cleanstart/cleanstart-website`

## 1. packages/ui

**Underlying libraries:** none. `packages/ui/package.json` lists only `react` and `react-dom` 19 as peer dependencies. Dev dependencies are Ladle (component stories), Vitest and TypeScript. There is no Radix, Base UI, Floating UI or cmdk.
- Dialog and Drawer use the native `<dialog>` element with `showModal()`, which gives top-layer rendering, a focus trap and Esc for free (`Dialog.tsx:26`, `Drawer.tsx:22`).
- Positioning is a custom hook, `useAnchoredPosition`, which re-measures on every animation frame.
- Only DropdownMenu uses `createPortal` (to `document.body`).
- Package exports: `.` → `src/index.ts`, `./primitives/*`, `./hooks/*`.

**Styling:** no Tailwind and no CSS modules. Components emit BEM class names that the host CSS must define: `cs-dialog`, `cs-drawer`, `cs-menu`, `cs-combobox`, `cs-datetime`, `cs-toast`, `cs-tooltip`, `cs-spinner`, `cs-btn cs-btn--primary|--subtle|--danger`, `cs-confirm`, `cs-quick-create`. They are defined in `apps/cms/src/app/(payload)/styles/_ui-primitives.scss`. Inline `style` is used only for anchored positions.

### tokens.ts, verbatim (`packages/ui/src/tokens.ts`)
```ts
export const tokens = {
  cyan50:'--cs-cyan-50', cyan100:'--cs-cyan-100', cyan200:'--cs-cyan-200', cyan300:'--cs-cyan-300', cyan400:'--cs-cyan-400',
  cyan500:'--cs-cyan-500', cyan600:'--cs-cyan-600', cyan700:'--cs-cyan-700', cyan800:'--cs-cyan-800', cyan900:'--cs-cyan-900',
  blue500:'--cs-blue-500', blue600:'--cs-blue-600', blue700:'--cs-blue-700',
  purple500:'--cs-purple-500', purple700:'--cs-purple-700', ink950:'--cs-ink-950',
  textLink:'--cs-text-link', textLinkHover:'--cs-text-link-hover',
  fontBody:'--font-body', fontDisplay:'--font-display', fontMono:'--font-mono',
  space1:'--cs-space-1', space2:'--cs-space-2', space3:'--cs-space-3', space4:'--cs-space-4',
  space6:'--cs-space-6', space8:'--cs-space-8', space12:'--cs-space-12', space16:'--cs-space-16',
  radiusChip:'--cs-radius-chip', radiusInput:'--cs-radius-input', radiusCard:'--cs-radius-card', radiusModal:'--cs-radius-modal',
  motionMicro:'--cs-motion-micro', motionMacro:'--cs-motion-macro', motionModal:'--cs-motion-modal',
  tintBrandSoft:'--cs-tint-brand-soft', tintBrandMedium:'--cs-tint-brand-medium', tintFocusRing:'--cs-tint-focus-ring', tintFocusGlow:'--cs-tint-focus-glow',
  shadowInputRest:'--cs-shadow-input-rest', shadowInputFocus:'--cs-shadow-input-focus', shadowPress:'--cs-shadow-press',
  shadowPressSoft:'--cs-shadow-press-soft', shadowLiftSm:'--cs-shadow-lift-sm', shadowLiftMd:'--cs-shadow-lift-md',
  navWidth:'--nav-width',
} as const;
export type TokenName = (typeof tokens)[keyof typeof tokens];
export const themeAttr = 'data-theme';
```
Note: `tokens.ts` does not include several names that exist in SCSS: `--cs-space-5`, `--cs-space-10`, `--cs-motion-hover`, `--cs-motion-drawer`, `--cs-shadow-surface-raised`, `--sidebar-width`, `--cs-on-cyan`, `--cs-radius-login`, and every semantic `--cs-surface-*`, `--cs-text-*` and `--cs-status-*` token.

### Primitive props (all `readonly`)
- **Combobox&lt;TValue&gt;** `options: ComboboxOption[] {value,label,description?,thumb?,disabled?}`, `value?`, `onChange(value, option)`, `query`, `onQueryChange`, `placeholder?`, `loading?`, `emptyLabel?`, `autoFocus?`, `renderOption?`, `ariaLabel?`, `className?`. Follows the ARIA combobox pattern with `aria-activedescendant`.
- **ConfirmDialog** `open`, `onClose`, `onConfirm(): void|Promise`, `title`, `description?: ReactNode`, `confirmLabel?`, `cancelLabel?`, `tone?: 'neutral'|'danger'` (default neutral), `busy?`. Always sets `dismissOnBackdrop={false}`.
- **ContextMenu** `items: DropdownMenuItem[]`, `anchor: HTMLElement|null` (listens for the `contextmenu` event), `ariaLabel?`, `disabled?`. Position is fixed.
- **DateTimePicker** `value: string|null` (UTC ISO), `onChange`, `mode?: 'date'|'datetime'` (default date), `timezone?` (display only), `placeholder?`, `disabled?`, `required?`, `id?`, `ariaLabel?`, `minDate?`, `maxDate?`.
- **Dialog** `open`, `onClose`, `children`, `labelledBy?`, `ariaLabel?`, `size?: 'sm'|'md'|'lg'|'xl'|'full'` (default md), `dismissOnBackdrop?` (default true), `className?`. Parts: `DialogHeader {title,id?,onClose?,description?}`, `DialogBody`, `DialogFooter`.
- **Drawer** same base as Dialog, plus `side?: 'right'|'left'` (default right) and `size?: 'sm'|'md'|'lg'|'xl'`. Parts: `DrawerHeader {title,id?,onClose?,subtitle?,actions?}`, `DrawerBody`, `DrawerFooter`.
- **DropdownMenu** `open`, `onClose`, `anchorRef`, `items`, `placement?`, `ariaLabel?`. Offset 6, portaled.
  - `DropdownMenuItem` = `{kind:'item',id,label,icon?,shortcut?,disabled?,tone?:'neutral'|'danger',onSelect}` | `{kind:'separator',id}` | `{kind:'label',id,label}`.
- **Popover** `open`, `onClose`, `anchorRef`, `children`, `placement?` (default bottom-start), `offset?` (default 6), `ariaLabel?`, `labelledBy?`, `restoreFocus?` (default true), `className?`, `role?: 'dialog'|'menu'|'listbox'`, `matchAnchorWidth?`.
- **QuickCreateDialog** `open`, `onClose`, `title`, `fields: QuickCreateField[]`, `onSubmit(values, intent:'draft'|'publish') => Promise<{id}>`, `onCreated?`, `supportsDrafts`, `onCheckSlug?(slug) => Promise<{available}>`.
  - Field types: `text`, `textarea`, `slug` (`source` names the field it mirrors), `select`, and `group` (a `<details>` with `defaultOpen`, one level only).
- **Spinner** `size?: 'sm'|'md'|'lg'` (default md), `label?` (default 'Loading'). Renders an `<output aria-live>`.
- **Toast** `ToastProvider`, `useToast()`, `dispatchToast(input)`.
  - `useToast()` returns `{push, dismiss, clear}`.
  - `dispatchToast` fires a `cs:toast` event on `document`.
  - `ToastInput {id?, title?, message, tone?: 'info'|'success'|'warning'|'error', duration?` (default 4000, 0 = sticky)`, action?: {label,onClick}}`.
- **Tooltip** `content`, `children: ReactElement`, `placement?` (default top-start), `delay?` (default 250ms), `disabled?`. Offset 8.

### Hooks
- **useAnchoredPosition** `{anchorRef, floatingRef, open, placement?, offset?, viewportPadding?}` returns `{top,left}|null`. Placement is one of `bottom-start|bottom-end|top-start|top-end|right-start|left-start`. Position is clamped to the viewport and recomputed in a continuous `requestAnimationFrame` loop.
- **useDismiss** `{open, onDismiss, ignore?: RefObject[], closeOnEscape?, closeOnPointerDownOutside?}`.
- **useDragSort** `{onReorder(from,to)}` returns `{draggingIndex, hoverIndex, itemHandlers(i)}`. Uses native HTML5 drag and drop.
- **Other exports:** `slugify` (`lib/slugify.ts`).

## 2. apps/cms admin styling (`apps/cms/src/app/(payload)/`)
`custom.scss` loads 45 partials, about 21k lines of SCSS. The header comment says it is modelled on the Webflow Designer's CMS chrome.

### _tokens.scss (`:root`)
- **Cyan ramp:** 50 `#e6faff` · 100 `#c2f1ff` · 200 `#8be4fb` · 300 `#4dd5f7` · 400 `#06c7f2` · 500 `#06c7f2` · 600 `#04a3c8` · 700 `#03819f` · 800 `#035e74` · 900 `#013f4f`.
- **Other brand colours:** blue 500 `#056bf1`, 600 `#0457c4`, 700 `#033f8c`. Purple 500 `#5d04d8`, 700 `#270e59`. Ink 950 `#0e1125`.
- **Links:** `--cs-text-link` `#0b6ec7`, hover `#084e8e`.
- **On-cyan text:** `--cs-on-cyan` `#04212a`.
- **Fonts:** `--font-body` = Sora, then a system stack. `--font-display` = Manrope, then Sora. `--font-mono` = JetBrains Mono.
- **Spacing (px, not rem):** 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64. Also `--cs-space-field-gap` 20px and `--cs-space-label-input` 6px.
- **Radius:** chip 4, input 6, card 8, modal 12, login 16.
- **Motion:**

  | Token | Value |
  |---|---|
  | micro | 120ms ease-out |
  | hover | 160ms ease |
  | macro | 200ms cubic-bezier(.4,0,.2,1) |
  | modal | 240ms cubic-bezier(.16,1,.3,1) |
  | drawer | 280ms cubic-bezier(.16,1,.3,1) |

- **Tints:** brand-soft `rgba(6,199,242,.08)`, brand-medium `.14`, focus-ring `.40`, focus-glow `.12`.
- **Shadows:**
  - `input-rest`: `inset 0 1px 0 rgba(255,255,255,.06)`
  - `input-focus`: `inset 0 1px 2px rgba(0,0,0,.04), 0 4px 12px focus-glow`
  - `press`: `inset 0 1px 2px rgba(0,0,0,.12)`
  - `press-soft`: `.06`
  - `lift-sm`: `inset 0 1px 0 rgba(255,255,255,.04), 0 2px 8px rgba(0,0,0,.16)`
  - `lift-md`: `inset … .05, 0 4px 16px rgba(0,0,0,.24)`
  - `surface-raised`: `inset 0 1px 0 rgba(255,255,255,.05), 0 0 0 1px var(--theme-elevation-150)`
- **Layout:** `--nav-width` 256px, `--sidebar-width` 300px.

### _themes.scss: light vs dark
Payload sets `[data-theme='light'|'dark']` on `<html>`. Each theme remaps the elevation ramp (0-1000), `--theme-bg`, `--theme-input-bg` and `--theme-text*`.

| Token | Light | Dark |
|---|---|---|
| bg | `#f7f8fa` | `#1c1d21` |
| input-bg | `#fff` | `#14151a` |
| elev-0 | `#fff` | `#14151a` |
| elev-50 | `#f7f8fa` | `#1c1d21` |
| elev-100 | `#eef0f3` | `#23242a` |
| elev-150 | `#e5e7eb` | `#2a2c33` |
| elev-200 | `#d8dbe0` | `#34363d` |
| elev-250 | `#c8ccd2` | `#3e4048` |
| elev-300 | `#b3b7bd` | `#4a4d55` |
| elev-400 | `#8b8f96` | `#6b6e77` |
| elev-500 | `#6b6e76` | `#888c95` |
| elev-600 | `#4a4d54` | `#a4a7af` |
| elev-700 | `#34363c` | `#b8bcc4` |
| elev-800 | `#232428` | `#dcdee2` |
| elev-900 | `#131418` | `#f5f6f7` |
| elev-1000 | `#0a0b0e` | `#fff` |
| text | `#131418` | `#e6e8ec` |
| text-soft | `#4a4d54` | `#9ea2ab` |
| text-disabled | `#8b8f96` | `#6b6e77` |
| success | `#00a76f` | `#00c46a` |
| warning | `#d97706` | `#fbbf24` |
| error | `#dc2626` | `#ff5c5c` |
| link | `#0b6ec7` | `#4ec0e8` |

`--color-base-*` maps to the cyan ramp, inverted in dark mode.

### _semantics.scss
- **Surfaces:** `--cs-surface-canvas|raised|overlay|sunken`.
- **Borders:** `--cs-border-subtle` (elev-150), `strong` (elev-250), `accent` (cyan-500).
- **Text:** `--cs-text-primary|secondary|muted|accent|on-accent (#04212a)|input|heading|readonly|placeholder`.
- **Status:** `--cs-status-success|warning|error|info`, plus `-bg` variants at 12-14% alpha.
- **Focus:** `--cs-focus-ring: 0 0 0 3px focus-ring tint`, `--cs-focus-outline: 2px solid cyan-500`.

### _typography.scss
- Body: Sora at 14px, line-height 1.55, letter-spacing -0.005em, with `font-feature-settings 'cv11','ss01'` and antialiasing.
- h1-h6: Manrope, weight 700, letter-spacing -0.015em.
- Tabular numbers (`tnum`) on IDs, dates, pagination and `time`. Monospace on code, kbd and slug cells.

### _fonts.scss
Self-hosted variable woff2 files declared with `@font-face`: `/fonts/manrope.woff2` (weights 200-800), `sora.woff2` (100-800) and `jetbrains-mono.woff2` (100-800), all with `font-display: swap`.
- Reason given: the CSP blocks Google Fonts, and `next/font` breaks the layout's server action under Turbopack.
- Two other places are stale: the `_tokens.scss` comment and the 00 executive summary both say "next/font".

### _light-mode.scss (19 lines)
Contains only: pill text colour, table row hover `elev-100`, and tooltip/popup shadow `0 8px 24px -8px rgba(0,0,0,.12)`.

### _density.scss
- **Heights:** inputs 38px, textarea minimum 84px, number inputs max-width 120px, select 38px, row labels 36px, nav links 34px.
- **Doc controls:** all 36px; the menu button is a 36px square.
- **Buttons:** small 30px/12px, large 44px/14px, icon-only 30px.
- **Other:** tabs 40px, pills 24px (medium 26px), card padding 16px, collapsible padding 12px.
- **Hidden:** Payload's clipboard copy/paste menus.
- **Workaround:** the menu-button SVG is injected through `:empty::after` with a CSS mask.
- **Readonly slug fields:** monospace 13px, muted.

### Cascade pressure
222 `!important` declarations across the partials. No `@layer` is used, while Payload's own CSS sits in `@layer payload-default` (see the `_chrome.scss:72` comment).

## 3. Audit findings (deduplicated; sources in `docs/cms-audit/`)

**Scores** (00): visual system 8, editorial 6.6, accessibility 6, premium polish 4 (lists) and 5.7 (other screens). In the audit's words, the custom admin re-implements Payload's render layer but hasn't reached the Linear/Vercel/Stripe bar.

### Why it looks "off": fighting Payload's DOM
- Payload's root font is about 13px, so rem-based values become 9.75, 13.5, 10.5 and 0.63px. The result is blurry text and jittery row heights. (09, 10)
- 40+ `!important` rules (222 counted now). A Payload upgrade can silently break the theme; a cleanstart `@layer` is recommended. (07)
- The menu button renders as a bare "-" in the doc controls and list toolbar, patched with a CSS mask. (09, 10, 00)
- FaqBulkPaste uses a MutationObserver plus setTimeout retries (120 to 1400ms) to beat Payload's focus handling, and injects a portal into Payload's array header UL. (05)
- More fragile DOM hooks:
  - SaveShortcut clicks `#action-save`.
  - The fallback selector `.doc-controls__publish` doesn't exist.
  - EditorFullscreenToggle and StockToolbarSuppressor run body-wide MutationObservers.
  - NavBadges injects badges into the DOM.
  - The SavedStateIndicator polls every 500ms.

  (02, 05)
- Imports of render components from `@payloadcms/ui` (Gutter, PageControls, PopupList, DocumentFields) break the house rule that this package is data-layer only (CLAUDE.md:75). (02)
- Dead or duplicated surfaces: CmsEditView, EditChrome, PublishMenu, CmsVersionsView, MediaPicker, SavedStateIndicator (its 91 lines are hidden with `!important`), and `schemaAddons` (hidden). (02, 07, 08, EXECUTION-REPORT)
- The ~3,350-line layer of 18 custom field components: the cosmetic reskins carry an upgrade cost on every Payload release. (08)

### Layout and visual problems
- The form column was uncapped, so inputs were about 848px wide; the recommended cap is 760px. The sidebar was about 188px and should be 300px. The nav rail was 240px and should be 256px. (10)
- Tables:
  - The Title column was starved while Status took 200px.
  - Columns should be: dates right-aligned with tabular numbers, Status centred, Title absorbing the free width.
  - Header: sticky, 12px/500 mixed case.
  - Rows: 48px tall, with hover using the brand-soft tint. (09)
- Count badges ("57 PUBLISHED") used status green and sat below the H1. They should be a neutral chip inline with the title. (09)
- Chip sizes were scattered (four heights); the recommendation is two tiers, SM 20px/11px and MD 24px/12px, with 5px dots and 999px radius. (09)
- Two button families: `.btn` is 36px/600 and `.cs-btn` is about 30px/500, so footers mix them. Five different button font sizes. (10)
- Heading sizes: the list H1 is 22px with line-height 1.64, which is too loose. The doc-header title size is disputed (24px in 09, 17px/600 in 10). The doc-controls strip is 60px and should be 52px. (09, 10)
- Field rhythm: label margin 4px, should be 6px. Field gap 9.75px, should be 20px. Legends should be 11px/700 eyebrows. Date trigger is 36px against 38px inputs. (10)
- Elevation was flat; it now uses layered inner highlights plus outer shadow. Focus ring was 22% cyan; it is now a 2px solid outline. (09)
- Overlays:
  - Backdrop blur was 2-4px; the target is 8px for dialogs, 6px for drawers and 12px for the palette.
  - The drawer needs a spring animation.
  - Toasts have no exit animation.
  - Popover entry should be translateY(-4px) scale(.99). (10)
- White "islands" in dark mode: LinkPopover, TableGridPicker and the inline-image dialog had hardcoded light colours, and a sky-blue active tab instead of brand cyan. (10, 00)
- Light theme: shadows are dark-tuned rgba (`.45`), giving heavy halos; a backdrop/shadow token per theme is recommended. (07)
- Cyan `#06c7f2` as text on elevation-150 has about 3.8:1 contrast, which fails AA. Use cyan-600 for small text. (07)
- Hardcoded hex values and inline styles: Notice, BodyAuditField, PublishChecklistBanner, MediaSizeWarningField, and SchemaOverrideModal (250 lines of inline styles). (07, 05, 10)
- Unicode glyphs used as icons (× ✓ ⧉ ↗ →, "…" as a loading indicator); use SVG and Spinner instead. (07, 10)
- Undefined variables: `--cs-red-500` and `--theme-error-500` in the embed dialog. (07)
- Dashboard:
  - Pulse cards are flat with only cyan/amber variants (add success and error).
  - Quick-action titles are heavier than the cards.
  - "fresh" status text reads like debug output.
  - The "Drafts pending" link is misleading. (07, 10, 08)
- Login: the card needs max-width 400px, 40px padding and 16px radius; 40px inputs and a 44px submit button. (10)

### Editor complaints and workflow
- About 20 sidebar cards before Publish; the target is 12 or fewer. Move URL history, hreflang and redirects into a tab; group featured, pinned and TOC depth. (05, 08)
- Guides have 5 post-body arrays, which overwhelms writers. (05)
- Block picker: a flat label and slug list with no descriptions, categories or previews, and no insert-at-position. Blocks are always expanded, giving a wall of fields; collapsed summaries are needed. (05, 08)
- The Table block requires nested row and cell editing. (05)
- Two publish/schedule surfaces exist at the same time (CmsPublishButton and PublishMenu). (05, 02)
- The publish checklist goes stale after save. Schema preview only works after publishing. (07, 05)
- Media browse: filename search only, capped at 24 results, no type/folder filters, and no visible selected state. Media cell thumbnails are 24px. (05, 10)
- Developer jargon in help text (ISO 8601, AEO/GEO, dead-letters, "Phase E", Webflow notes). (07, 08)
- Native `alert()`/`confirm()` calls in DSAR, DisableUser and FaqBulkPaste. (07)
- Two toast systems: ToastBus (`cs-cms:toast` on `window`, 2.5s, max 3) and ToastProvider (`cs:toast` on `document`, 4s). Unify on one. (07, 08)
- The command palette does a full page reload (`window.location.href`) and fans out 10 REST searches. (07, 02)
- Navigation grouping: the System group mixes editorial tools with infrastructure tables; Podcast is missing from the palette. The dashboard isn't scoped by role. (08)

### Accessibility
- DateTimePicker: 42 tabbable cells, no arrow keys, uses `aria-pressed`; it should be a grid.
- CommandPalette: no `aria-label`, listbox role or `aria-activedescendant`.
- ContextMenu: right-click only.
- Media and TableGridPicker grids: no keyboard support.
- Popover: no initial focus.
- ConfirmDialog (danger): should focus Cancel first.
- Radio pill: no focus ring. Skip link: `outline: none`.
- QuickCreate: the reason a button is disabled is only in `title`.
- Spinner: uses `<output>`.

(07, 08)

### Already strong (keep)
- Three-tier tokens (primitives, then themes, then semantics).
- Cyan reserved for action, focus and the active state.
- `prefers-reduced-motion` and `prefers-contrast` support in `_a11y.scss`.
- Native `<dialog>` primitives.
- The command palette (recents, fuzzy search, grouped results).
- Contextual empty states.
- The Save Draft button promoted to primary.
- The SEO sidebar.

(07, 08)

**Status:** EXECUTION-REPORT (2026-05-30) says premium units 12-14 applied the 09/10 values. There is no visual regression testing, and a 1440px manual QA checklist is still open. The segmented control may not be connected to any field.

## 4. Brand
**apps/web `globals.css` `@theme`:**
- Fonts: `--font-sans` is Sora (`--font-sora`). `--font-display` is Manrope. Mono is JetBrains Mono. Loaded with `next/font/google` in `apps/web/src/app/layout.tsx`: Manrope 500/600/700, Sora 400-700, Mono 400-700.
- Colours:

  | Token | Value |
  |---|---|
  | `--color-cs-navy-0` | `#151021` |
  | `navy-1` | `#10123e` |
  | `blue-1` | `#131e8f` |
  | `purple-1` / `-2` / `-3` | `#471ec0` / `#471fc3` / `#551ec3` |
  | `cyan` | `#2cc1eb` |
  | `cyan-2` | `#33baec` |
  | `lavender` | `#dab6f3` |
  | `neon-cyan` | `#22e0ff` |
  | `text-dark` | `#111111` |
  | `--cs-blob-color` | `#640DFB` |

- Radii: card 24, card-lg 40, pill 8.
- Type sizes: fluid `clamp()` scales (hero 40-72px, letter-spacing -0.04em).
- Buttons: heights 48/44/36/32/28; 44px is the CTA minimum.
- Section-level shadcn-style tokens (`--primary` etc.) also exist.

**Cyan mismatch:** the web cyan is `#2cc1eb`, but the CMS uses `#06c7f2` (from the brand guideline PDF). The `Logo.tsx` mark uses `#2CC1EB`, while `Icon.tsx` and `app/icon.svg` use `#06c7f2`.

**Logo files:**
- `apps/cms/src/payload/admin/Logo.tsx`: the 155×32 wordmark rendered at 220×46. The glyphs use `currentColor` so they invert by theme; inline style centres it.
- `Icon.tsx`: the 28×32 hex mark rendered at 22×24; the outer shape is `currentColor`, the inner chevron is cyan.
- `apps/cms/public/cleanstart-logo.svg`: white wordmark with a `#2CC1EB` mark.
- `apps/cms/src/app/icon.svg`: `#0e1125`, switching to white with `prefers-color-scheme: dark`.
- `public/error/*.webp`: 400, 403, 404, 429, 500, 503, empty-search, empty-state, no-internet, offline, success illustrations.
- `public/fonts`: the three woff2 files.

**`docs/cms-analytics-dashboard-mockup.html`:**
- Direction: a dark, purple-tinted analytics console, Linear/Vercel style.
- Colours: background `#0d0a16` / `#0a0712`; cards `#171128` / `#1c1533`; hairline borders `rgba(255,255,255,.08/.14)`; text `#f4f2fb` / `#a8a2c0` / `#6f6a85`.
- Accents: cyan `#2dd4ff`, purple `#8b7ff0`, teal, green `#3ddc97`, amber `#f5b94d`, red `#ff6b6b`, pink.
- Layout and type:
  - Side nav 208px (Dashboard, Analytics, Content: Blogs/Guides/Knowledge Hub, System: Integrations); the active item is a purple tint.
  - Main column max 1100px.
  - System font stack at 14px.
  - KPI cards: radius 11px, values 23px/600.
  - Panels: radius 13px.
  - Segmented pills; tinted status pills (20px radius); 18px stroke icons at 1.7 width; Chart.js 4 loaded from a CDN.
- Sections: overview, audience, top content, content intelligence, SEO opportunities, diagnostics (Core Web Vitals, funnel), AI digest, DataForSEO competitive.
- It doesn't use the brand fonts or cyan `#06c7f2`, and loading Chart.js from a CDN would break the admin CSP.

## 5. Icons
- **apps/cms:** no icon library (no lucide or phosphor). About 45 `.tsx` files contain hand-written inline SVGs, mostly on a 16×16 viewBox with stroke widths from 1.25 to 2 (1.4 to 1.6 most common).
  - Shared folder: `apps/cms/src/payload/admin/components/icons/Chevron.tsx` (`M4 6l4 4 4-4`, stroke 1.6, default 12px).
  - Locally defined icons: Eye, External, Link, Pane, Calendar, Unpublish, Copy, Check, Clipboard, Pencil, Trash, Embed, CodeBracket, Panel, TableGridPicker, LinkPopover.
  - SCSS also injects mask-SVG icons (menu button, empty states).
- **apps/web:** `lucide-react ^1.14.0`, imported in 12 places (Tricorder sections, search UI, mobile navs, CISO, CleanSight).

## 6. Tailwind, Next config, CSP
- **Tailwind in apps/cms:** not installed, and there is no postcss or tailwind config. SCSS is compiled by Next/Payload; `sass` isn't a direct dependency. `apps/web` has `tailwindcss ^4` and `@tailwindcss/postcss`.
- **CMS stack:** Next ^16.2.5, Payload and `@payloadcms/ui` ^3.81 (the audit says 3.84 is running), React 19, Lexical 0.41, CodeMirror 6.
- **`apps/cms/next.config.ts`:**
  - Wrapped with `withPayload(..., {devBundleServerPackages:true})` and `withSentryConfig`.
  - `reactStrictMode`; `serverExternalPackages` for the Google libraries.
  - `turbopack.root` set to the monorepo root.
  - `images.remotePatterns`: `cdn.cleanstart.com` and the R2 host.
  - Headers: `X-Robots-Tag: noindex` on `/admin` and `/api`.
- **CSP (`next.config.ts`, applied to all routes):**
  ```
  default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' [R2];
  media-src 'self' blob:; worker-src 'none'; object-src 'none';
  frame-src 'self' [embed providers + web preview origins]; frame-ancestors 'self'; base-uri 'self'; form-action 'self'
  ```
  - Inline styles and scripts are allowed (a comment says nonces are planned).
  - Fonts and stylesheets must come from the same origin, so no Google Fonts or CDN CSS.
  - `worker-src 'none'` blocks web workers.
  - `connect-src` blocks third-party APIs from the browser.
  - Also set: HSTS, `X-Frame-Options: SAMEORIGIN`, nosniff, a Referrer-Policy, and a Permissions-Policy that disables camera, microphone and geolocation.

## 7. Keyboard shortcuts
`ShortcutHelpDialog.tsx` lists:
- **Global:** ⌘/Ctrl+K command palette · ⌘/Ctrl+S save/publish · `?` show help (ignored while typing in an input) · Esc closes a dialog or exits focus mode.
- **Editor:** ⌘/Ctrl+/ "toggle focus mode" · Tab "indent / move row up" · Shift+Tab "outdent / move row down" (these descriptions look wrong).

**Bug:** ⌘/ actually toggles the help dialog itself (`ShortcutHelpDialog.tsx:58`), and nothing else binds it; 02 confirms this. EditorFullscreenToggle only handles Esc to exit.

Implemented but missing from the sheet:
- **⌘/Ctrl+Shift+S:** opens the schedule-publish dialog (`CmsPublishButton.tsx:206`).
- **⌘/Ctrl+Z (outside inputs):** restores the last removed array row (`fields/ArrayField.tsx:105`).
- **Command palette:** ↑/↓ to move, Enter to open, Esc to close. Groups: Recent (localStorage `cs-cmdk:recent`, up to 8), Navigate (dashboard, about 25 collections and globals, lead attribution), Create (11 "New X" items), and Documents (live search across 10 collections, 2+ characters, 220ms debounce).
- **SaveShortcut:** clicks `#action-save`. If there is nothing to save it shows a "No changes to save." toast; otherwise it emits `cs-cms:saving`.
- **DocSidebarResizer:** ←/→ resize, with Shift for bigger steps.
- **MediaBrowseDialog:** arrow keys plus Home/End move through the grid.
- **UserMenu:** Esc closes it.

---
Not checked: `02-AUDIT-ui.md` beyond its finding titles, the body text of each finding in `10-PREMIUM-UI-POLISH-allscreens.md` (I used its section headings plus a few full entries), and docs 01, 03, 04 and 06. I also didn't confirm that the doc 10 target values match the current SCSS file by file, apart from `_tokens.scss` and `_density.scss`. Risk: the audit docs describe old values (rem spacing, 22% focus ring) that have since been fixed, so take current token values from SCSS, not from the docs.