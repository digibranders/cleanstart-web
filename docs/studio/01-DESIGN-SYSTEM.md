# Studio design system

Status: direction B, approved 2026-10-19 (decisions D-1, D-2 and D-10 in `00-MASTER-PLAN.md`). The approved mockups are the review artifact "Studio mockups, direction B"; where a mockup and this file disagree, this file wins.

Design read: an internal content admin for CleanStart editors and marketers, in a restrained Linear and Vercel language. Warm neutrals, ink for actions, one ultramarine accent for focus and selection, dense but never cramped, motion only where it explains a change.

Research behind direction B (2026-10-19): Linear's 2024 redesign and 2026 refresh (dimmed sidebar so content leads, fewer and softer separators, elevation separates surfaces, warmer and less saturated greys, compact rounded tabs) and Vercel's Geist system (Geist and Geist Mono, ink on near-white, weights 400/500/600, negative tracking on large type, full pills only on marketing CTAs while product buttons keep small radii).

Dials (from the taste skill, used to settle arguments in review): variance 2 (systematic, predictable), motion 3 (subtle), density 5 (daily-use app).

Everything here is implemented as CSS custom properties in `apps/cms/src/studio/styles/tokens.css` and exposed to Tailwind through `@theme` in `studio.css`. Components use tokens only. A raw hex value or pixel size inside a component fails review.

## 1. Principles

1. **Content first.** The sidebar sits on a tinted window and recedes. All work happens on one floating sheet inset 8px from the window. Inside the sheet, chrome is quiet: few separators, no heavy cards, no gradients. The document being edited is the brightest thing on screen.
2. **One way to do each thing.** One button family, one input height, one menu, one dialog, one toast. If two screens solve the same problem differently, one of them is wrong.
3. **Keyboard first.** Every action has a keyboard path. Frequent actions have shortcuts. Focus is always visible.
4. **State is never ambiguous.** Saved or not, draft or published, locked or free, loading or empty: each has one clear visual.
5. **Nothing moves without a reason.** Motion confirms an action or shows where something came from. It never decorates.
6. **Say it plainly.** Sentence case, short labels, no internal jargon in the UI (no "dead letter", "ISR", "AEO" in editor-facing copy).

## 2. Color

Two themes, chosen per D-3. Both are designed and reviewed. Values below were checked on 2026-10-19 against WCAG 2.2: text tokens reach at least 4.5:1 and `--border-control` and `--focus-ring` at least 3:1 on every surface they sit on, and each fill reaches 4.5:1 with its `--on-*` text. The token contrast test (Phase 0, Task 0.4) re-checks them on every change. Brand cyan is no longer a UI colour (D-10); it survives only inside the brand mark artwork on the website.

### 2.1 Neutrals (warm grey, one family)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg-canvas` | `#0b0b0c` | `#efefed` | The window: behind the sidebar and around the sheet |
| `--bg-surface` | `#141415` | `#ffffff` | The sheet: page body, page and document headers, inspector, sign-in form side |
| `--bg-raised` | `#19191b` | `#f8f8f7` | Inputs, table header, group rows, code blocks, hovered rows |
| `--bg-overlay` | `#1f1f22` | `#ffffff` | Menus, popovers, dialogs, toasts, palette core |
| `--bg-hover` | `rgb(255 255 255 / 0.04)` | `rgb(18 18 20 / 0.04)` | Row and item hover |
| `--bg-active` | `rgb(255 255 255 / 0.07)` | `rgb(18 18 20 / 0.07)` | Pressed, segmented-control track, count chips |
| `--border-subtle` | `rgb(255 255 255 / 0.06)` | `rgb(18 18 20 / 0.06)` | The few dividers left inside the sheet |
| `--border` | `rgb(255 255 255 / 0.10)` | `rgb(18 18 20 / 0.10)` | Secondary buttons, cards, table container |
| `--border-strong` | `rgb(255 255 255 / 0.16)` | `rgb(18 18 20 / 0.16)` | Hovered cards, focused containers |
| `--border-control` | `#6b6d75` | `#82848c` | Outline of inputs, selects, checkboxes, radios, switches (WCAG 1.4.11 needs 3:1 against the surrounding surface) |
| `--text-primary` | `#f2f2f3` | `#121214` | Body text, values |
| `--text-secondary` | `#a5a5ab` | `#4d4d53` | Labels, metadata, inactive nav items |
| `--text-tertiary` | `#929299` | `#68686e` | Placeholders, hints, timestamps, counts |
| `--text-disabled` | `#4d4e55` | `#b4b5bb` | Disabled values |

### 2.2 Ink (primary actions)

The primary action is ink, not a colour. One primary per view.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--primary` | `#f2f2f3` | `#121214` | Primary button fill, checked checkbox, switch on, selection checkbox in lists |
| `--primary-hover` | `#ffffff` | `#2a2a2e` | Primary button hover |
| `--on-primary` | `#121214` | `#ffffff` | Text and icons on `--primary` |

### 2.3 Accent (ultramarine)

Ultramarine sits in the same indigo family as the website's dark band (`#131E8F`, `#471EC0`), so Studio and the site feel related without copying the site. It is reserved for focus, selection, links, the active filter and the "scheduled" state. It is never a button fill and never decoration.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--accent` | `#8ea0ff` | `#3451e6` | Selected date in the picker, progress bar, accent badge dot |
| `--accent-hover` | `#a5b3ff` | `#2a44cf` | Hover on accent fills |
| `--on-accent` | `#0b0b0c` | `#ffffff` | Text on `--accent` |
| `--accent-text` | `#8ea0ff` | `#3451e6` | Links, active filter text, scheduled icon |
| `--accent-soft` | `rgb(142 160 255 / 0.12)` | `rgb(52 81 230 / 0.07)` | Selected rows, active filter chip, focused input halo |
| `--focus-ring` | `#8ea0ff` | `#3451e6` | 2px focus outline, 2px offset |

### 2.4 Status

| Token | Dark | Light | Soft background |
|---|---|---|---|
| `--success` | `#3ecf8e` | `#12733a` | 12% dark, 9% light |
| `--warning` | `#f5a524` | `#9a4a06` | 12% dark, 9% light |
| `--danger` | `#f2555a` | `#c01c1c` | 12% dark, 8% light |
| `--info` | uses `--accent-text` | uses `--accent-text` | `--accent-soft` |

Document status mapping (used everywhere a status shows). Status is a 14px Phosphor glyph plus a word, never colour alone:

| Status | Glyph | Colour | Label |
|---|---|---|---|
| Draft | `CircleDashed` | `--text-tertiary` | "Draft" |
| Published, changes | `CircleHalf` | `--warning` | "Published, changes" |
| Published | `CheckCircle` (fill weight) | `--success` | "Published" |
| Scheduled | `Clock` | `--accent-text` | "Scheduled", with the date when there is room |

### 2.5 Brand band (sign-in only)

The sign-in brand panel (§7.7) reuses the website's canonical dark band so the first screen is recognisably CleanStart. These values are fixed in both themes and are never used inside the app.

| Token | Value |
|---|---|
| `--brand-band` | `linear-gradient(180deg, #151021 0%, #131e8f 62.5%, #471ec0 100%)` |
| `--brand-glow-violet` | `rgb(106 61 240 / 0.45)` |
| `--brand-glow-blue` | `rgb(7 110 255 / 0.35)` |
| `--brand-glow-pink` | `rgb(223 155 255 / 0.25)` |
| `--brand-ink` | `#131e8f` (text on the lit chip) |
| `--brand-accent` | `#df9bff` (the full stop after the rolling word) |
| `--brand-chip` | `rgb(255 255 255 / 0.08)` |
| `--brand-chip-text` | `rgb(255 255 255 / 0.78)` |

## 3. Typography

Typeface per D-1: Geist for UI, Geist Mono for code, ids, slugs and keyboard keys. Both come from the `geist` package through `next/font`, which serves the woff2 files from `/_next/static/media` (same origin, so the CSP's `font-src 'self'` allows them). Hierarchy comes from size and negative tracking, weight stays at 400, 500 or 600. Tables and numeric cells turn on `tnum`.

| Token | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `--type-display` | 28 / 34 | 600 | -0.03em | Page titles in `PageHeader` (list, dashboard, report) |
| `--type-title` | 18 / 26 | 600 | -0.02em | Dialog titles, sign-in heading on small panels |
| `--type-heading` | 14 / 20 | 600 | -0.01em | Section titles, inspector section titles |
| `--type-body` | 13 / 20 | 400 | 0 | Default UI text, inputs, table cells |
| `--type-body-strong` | 13 / 20 | 500 | 0 | Nav items, buttons, field labels, row titles |
| `--type-small` | 12 / 16 | 400 | 0 | Help text, metadata, timestamps |
| `--type-micro` | 11 / 14 | 500 | 0 | Badges, counters, table header |
| `--type-mono` | 12 / 18 | 400 | -0.01em | Slugs, ids, code, JSON |

Editor canvas (rich text and the document title field) uses a reading scale:

| Token | Size / line height | Weight | Tracking |
|---|---|---|---|
| `--type-doc-title` | 40 / 46 | 600 | -0.035em |
| `--type-doc-lead` | 17 / 27 | 400 | 0 |
| `--type-doc-body` | 16 / 27 | 400 | -0.003em |
| `--type-doc-h2` | 22 / 30 | 600 | -0.02em |
| `--type-doc-h3` | 18 / 26 | 600 | -0.015em |
| `--type-doc-h4` | 16 / 24 | 600 | -0.01em |

Rules:

- Root font size stays 16px. All tokens are in px through custom properties, so nothing lands on a half pixel.
- No text below 11px. No all-caps except `--type-micro` table headers, which use sentence case anyway.
- Weights in use: 400, 500, 600. Nothing else.
- Numbers in tables, counters and dates use tabular figures.

## 4. Spacing, sizing and layout

### 4.1 Spacing scale (4px grid)

`--space-0` 0 · `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48 · `--space-16` 64.

Rhythm inside forms: label to input 6px (`--space-1` + 2px is the single allowed exception, token `--space-label`), field to field 20px, section to section 32px.

### 4.2 Control heights

| Token | Height | Use |
|---|---|---|
| `--control-sm` | 24px | Inline actions in tables, badges with actions, toolbar buttons |
| `--control-md` | 28px | Default buttons, segmented controls, nav items, menu items |
| `--control-lg` | 32px | Inputs, selects, dialog footer buttons, search fields |

Hit targets for icon-only buttons are at least 28×28 even when the icon is 16px.

### 4.3 Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 5px | Checkboxes, `kbd`, inline code |
| `--radius-sm` | 8px | Buttons, inputs, selects, nav items, menu items, list rows |
| `--radius-md` | 10px | Cards, menus, popover core, segmented track, table container, toasts |
| `--radius-lg` | 14px | The sheet, dialogs, drawers, popover shells, the sign-in brand panel |
| `--radius-xl` | 20px | Command palette shell |
| `--radius-full` | 9999px | Avatars, chips and filter pills, switch track, the floating selection bar |

The rule: the radius grows with the size of the container, and a shell is always 4 to 6px rounder than the core it holds. Product buttons are never full pills (that shape is for marketing CTAs on the website).

### 4.4 Elevation

Surfaces are separated by elevation, not lines. The window is lowest, the sheet floats on it, overlays float on the sheet.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--shadow-raised` | `0 0 0 1px var(--border-subtle), 0 1px 2px rgb(0 0 0 / 0.3)` | `0 0 0 1px var(--border-subtle), 0 1px 3px rgb(18 18 20 / 0.06)` | Current nav item, selected segment, secondary button, search button |
| `--shadow-sheet` | `0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.04), 0 24px 56px -20px rgb(0 0 0 / 0.7)` | `0 0 0 1px rgb(18 18 20 / 0.06), 0 1px 2px rgb(18 18 20 / 0.04), 0 16px 40px -18px rgb(18 18 20 / 0.18)` | The sheet |
| `--shadow-popover` | `0 0 0 1px rgb(255 255 255 / 0.09), inset 0 1px 0 rgb(255 255 255 / 0.06), 0 24px 64px -12px rgb(0 0 0 / 0.75)` | `0 0 0 1px rgb(18 18 20 / 0.08), 0 2px 6px rgb(18 18 20 / 0.06), 0 18px 48px -12px rgb(18 18 20 / 0.22)` | Menus, popovers, toasts, floating selection bar |
| `--shadow-dialog` | `0 0 0 1px rgb(255 255 255 / 0.09), 0 32px 80px -16px rgb(0 0 0 / 0.8)` | `0 0 0 1px rgb(18 18 20 / 0.08), 0 32px 80px -20px rgb(18 18 20 / 0.3)` | Dialogs, drawers, palette |
| `--backdrop` | `rgb(9 9 11 / 0.6)` + `blur(6px)` | `rgb(239 239 237 / 0.55)` + `blur(6px)` | Behind dialogs and the palette |
| `--glass` | `rgb(30 30 35 / 0.72)` + `blur(20px) saturate(160%)` | `rgb(255 255 255 / 0.72)` + same | Popover and palette shells, floating selection bar |

Blur is used only on fixed or floating layers, never on scrolling content.

### 4.5 Z-index

`--z-sticky` 10 · `--z-sidebar` 20 · `--z-header` 30 · `--z-popover` 40 · `--z-dialog` 50 · `--z-toast` 60 · `--z-palette` 70. Nothing else may set `z-index`.

### 4.6 App frame

```
window (--bg-canvas)
┌──────────────┬─────────────────────────────────────────────────────────┐
│ Sidebar 232  │ ╭ sheet (--bg-surface, --radius-lg, --shadow-sheet) ──╮ │
│ on the       │ │ PageHeader: crumb, title 28px, count, actions       │ │
│ window, no   │ │ Toolbar: view tabs, filter chips, search             │ │
│ border       │ │ Body (the only scroll container)                     │ │
│ (56 when     │ ╰─────────────────────────────────────────────────────╯ │
│  collapsed)  │                 8px inset on top, right and bottom      │
└──────────────┴─────────────────────────────────────────────────────────┘
```

Document view (inside the sheet):

```
┌ Document header 54 (no divider) ──────────────────────────┬──────────────┐
│ Blogs › Title…   Unsaved changes        [Preview] [⋯] [▣] [Publish ▾]   │
├───────────────────────────────────────────────────────────┤ Inspector    │
│      Writing column, max 680, centred                     │ 320 default  │
│      Cover, title (doc-title), lead, property chips,      │ 280 to 440,  │
│      then fields and body                                 │ collapsible, │
│                                                           │ tabbed       │
└───────────────────────────────────────────────────────────┴──────────────┘
```

With the preview pane open, the writing column and preview split the space 50/50, and the inspector collapses to an icon strip.

Breakpoints: full layout from 1280px. From 1024 to 1279px the sidebar starts collapsed and the inspector becomes a drawer. Below 1024px Studio shows a "Studio needs a wider window" notice with a link to the published site.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 100ms | Hover, press, checkbox, switch |
| `--duration-base` | 150ms | Menus, popovers, tooltips, tab underline |
| `--duration-slow` | 200ms | Dialogs, drawers, palette, rail collapse |
| `--ease-out` | `cubic-bezier(0.32, 0.72, 0, 1)` | Enter, hover and press |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit (exits use `--duration-fast`) |

Allowed motion only:

- Popover and menu: fade plus 4px translate from the anchor side.
- Dialog: fade plus scale from 0.98.
- Drawer and rail: slide on the x axis.
- Toast: slide up and fade, exit by fade.
- Sheet: one 10px rise and fade when a page first mounts (560ms). Never on client-side navigation inside the sheet.
- Sign-in brand panel: the headline word rolls up one line every 2.4s (a 14.4s loop of six words) and the matching chip lights in sync; the glows drift slowly. The only looping motion in Studio. Under reduced motion it holds on the first word.
- Press: `scale(0.98)` on buttons.
- Skeleton: one slow opacity pulse (1.6s), no shimmer.

`prefers-reduced-motion: reduce` turns every transition into an instant change. Animate `transform` and `opacity` only.

## 6. Iconography

- Per D-2: `@phosphor-icons/react`, Light weight. Client components get it from `IconContext` at the Studio root and never pass `weight`. Server components import from `@phosphor-icons/react/dist/ssr`, which cannot read context, so they pass `weight="light"` themselves. The only other weights are `fill` for the Published status glyph and `bold` for the checkbox tick. 16px in UI, 14px inside `--control-sm` buttons, table cells and nav items, 20px for empty states.
- Icons inherit `currentColor`. One weight everywhere, apart from the two exceptions above.
- No hand-drawn SVG icons. No Unicode glyphs as icons (×, ✓, →). The brand mark and wordmark (`Logo.tsx`, `Icon.tsx`) are the only custom SVGs.
- An icon-only button always has an `aria-label` and a tooltip with the label and shortcut.

## 7. Components

Every component below lives in `apps/cms/src/studio/ui/` (or restyles a `packages/ui` primitive through `primitives.css`). Every component is shown in every state in the lab (`/studio/lab`) before any screen uses it. "States" lists what the lab must show.

### 7.1 Actions

| Component | Variants | Sizes | States | Notes |
|---|---|---|---|---|
| `Button` | `primary` (ink fill, `--primary`), `secondary` (sheet fill, `--border`, `--shadow-raised`), `ghost` (no border), `danger` (danger text, danger fill on confirm dialogs only) | sm 24, md 28, lg 32 | default, hover, active, focus-visible, disabled, loading (spinner replaces leading icon, width locked) | `--radius-sm`, never a pill. Label is a verb, 1 to 3 words. Leading icon optional. One `primary` per view. |
| `IconButton` | `ghost`, `secondary` | sm, md | as Button, plus `pressed` for toggles | Required `label` prop, used for `aria-label` and tooltip. |
| `SplitButton` | primary main action + chevron menu | md, lg | as Button; menu open | Publish control and Preview control use it. |
| `ButtonGroup` | segmented (for view toggles) | md | selected, focus | Arrow keys move selection. |
| `Link` | inline, standalone | inherit | default, hover (underline), visited is not styled | External links show a 12px arrow-up-right icon. |
| `Kbd` | single key, combo | micro | none | Mono font, `--bg-raised`, `--radius-xs`. Mac shows ⌘ ⇧ ⌥, others Ctrl Shift Alt. |

### 7.2 Inputs

All inputs: height `--control-lg` (32), `--bg-raised`, 1px `--border-control`, `--radius-sm`, 13px text, 10px horizontal padding. Hover: background turns `--bg-surface`. Focus: background `--bg-surface`, border `--focus-ring` and a 4px `--accent-soft` halo (the halo replaces the outline offset inside inputs). Error: border `--danger`, message below. Read-only: no border, `--bg-surface`, text `--text-secondary`, a lock icon with the reason in a tooltip. Disabled: 50% opacity, `cursor: not-allowed`.

| Component | Notes |
|---|---|
| `Field` | Wrapper: label (13/500), optional "Optional" hint, description (12px, `--text-secondary`), control, error (12px, `--danger`, with a 14px warning icon). Label above control always. `aria-describedby` wires description and error. |
| `TextInput` | Character counter when `maxLength` is set (shows at 80% of the limit). Prefix and suffix slots. |
| `Textarea` | Auto-grows from 3 rows to 12, then scrolls. Counter as TextInput. |
| `NumberInput` | Steppers on hover only. `hasMany` renders as a tag input. |
| `Select` | Single and multi. Searchable when there are more than 8 options. Opens a `Combobox` popover. Never a native `<select>`. |
| `Checkbox` | 16px box, `--radius-xs`. Checked: `--primary` fill with a Phosphor `Check` (bold weight, 12px) in `--on-primary`. Label clickable. Indeterminate state for table header. In list rows the box appears on hover or once any row is selected. |
| `Switch` | 32×20 track, `--radius-full`. On: `--primary` track, `--on-primary` knob. For instant settings only (theme, toggles that save immediately). Form booleans use Checkbox. |
| `RadioGroup` | Vertical list, or segmented when there are 2 to 4 short options. Checked radio: 5px `--primary` inset ring. |
| `DateTimePicker` | Restyles `packages/ui` DateTimePicker. Phase 0 fixes its keyboard model (`role="grid"`, arrow keys, Home/End, PageUp/PageDown). Shows the timezone. |
| `TagInput` | For `hasMany` text and number, keywords. Enter or comma adds, Backspace removes the last tag. |
| `SearchInput` | Leading magnifier icon, clear button, `/` focuses the page's search. |
| `CodeEditor` | CodeMirror 6 themed from tokens. Mono 12px. Line numbers. Used for `code` and `json` fields. |
| `Combobox` | Restyles `packages/ui` Combobox. Used by Select, relationship fields and filters. |

### 7.3 Containers and structure

| Component | Notes |
|---|---|
| `PageHeader` | Not sticky; it scrolls with the sheet. 24px top padding, 28px sides. Crumb line above the title (`--type-small`, `--text-tertiary`), title (`--type-display`), count after the title (`--type-body-strong`, `--text-tertiary`, tabular), actions bottom-aligned on the right. |
| `Card` | `--bg-surface`, 1px `--border`, `--radius-md`, 16px padding. Header row: title (`--type-heading`), optional action. Dashboards only. Forms and the inspector do not use cards; the inspector uses `Section`. |
| `Section` | Form section: title (`--type-heading`), optional description, 32px above. No border, no background. |
| `Collapsible` | Disclosure with a chevron that rotates 90°. Remembers open state per user in `users.preferences`. |
| `Tabs` | Segmented: `--bg-active` track with 2px padding and `--radius-md`; each tab 24px, `--radius-sm`; the selected tab is `--bg-surface` with `--shadow-raised` and `--text-primary`. Arrow keys move, Enter or Space selects. Used for the inspector (Details, SEO, Checklist) and form tabs. |
| `Divider` | 1px `--border-subtle`. |
| `Rail` | The inspector: `--bg-surface` with a single `--border-subtle` line on its left, segmented `Tabs` at the top, sections below without cards. Resizable (280 to 440, keyboard resizable with ← and →), collapsible to a 40px icon strip, width saved per user. |
| `SplitPane` | Edit plus preview split, draggable divider, double-click resets to 50/50. |

### 7.4 Overlays

All overlays restyle the `packages/ui` primitives (native `<dialog>` and anchored popovers), so focus trap, Esc and top-layer stacking come from the platform.

| Component | Notes |
|---|---|
| `Dialog` | Sizes sm 400, md 560, lg 720, xl 960. Header (title + optional description + close), body (24px padding), footer (right-aligned buttons, primary last). |
| `ConfirmDialog` | Title states the action ("Delete 3 blogs?"). Body states the consequence. Danger tone focuses Cancel first. |
| `Drawer` | Right side. sm 400, md 560, lg 720. Used for quick create, export, filters on narrow screens, media detail from a picker. |
| `Popover` | `--bg-overlay`, `--shadow-popover`, `--radius-md`, 8px padding. Decision popovers (publish, schedule) use the shell form: a 6px `--glass` shell at `--radius-lg` holding an `--bg-overlay` core at `--radius-md`. |
| `Menu` | Restyles `DropdownMenu` and `ContextMenu`. Items 28px, icon 16px, shortcut right-aligned in `Kbd`. Danger items in `--danger` text. Groups with 11px labels. Every context menu also opens from a visible "more" button, so nothing is right-click only. |
| `Tooltip` | 12px text, `--bg-overlay`, delay 400ms, instant when moving between tooltipped items. Shows shortcut in `Kbd` when there is one. Never holds essential information. |
| `Toast` | One system (`packages/ui` Toast, the `cs:toast` event). Bottom-right stack, max 3. Tones info, success, warning, error. 4s default, errors stay until dismissed. Optional single action ("Undo", "View"). |
| `CommandPalette` | 640px wide, 112px from the top. Shell form: 6px `--glass` shell at `--radius-xl` holding the core at `--radius-lg`. `--backdrop` behind. Input 56px at 16px text, results grouped (Recent, Go to, Create, Documents, Actions) with status glyphs on documents, footer with key hints. `aria-activedescendant` pattern. |

### 7.5 Feedback and status

| Component | Notes |
|---|---|
| `Badge` | Chip: 20px or 24px tall, `--type-micro`, `--radius-full`, 8px side padding. Tones neutral (`--bg-raised` with a hairline), accent, success, warning, danger (soft fills). Optional 6px dot. |
| `StatusBadge` | Maps document status (§2.4) to its glyph and word. No chip background. |
| `Banner` | Inline, full width of its container. Tones info, warning, danger, success. Icon, one sentence, optional action. Used for locks, publish blockers, immutable collections. |
| `Spinner` | Restyles `packages/ui` Spinner. 14px inside buttons, 20px in panels. Only for actions under way, never for loading a page. |
| `Skeleton` | Shapes that match the final layout (table rows, field rows, cards). Used for every route-level loading state. |
| `EmptyState` | 20px icon, title (`--type-heading`), one sentence, one action. Different copy for "nothing yet" and "no results for this filter". |
| `ProgressBar` | Uploads only. 4px, accent fill, no track pattern. |
| `SaveStatus` | In the document header: "Unsaved changes" (warning dot), "Saving…", "Saved 2 min ago", "Save failed, retry". |
| `Avatar` | 20 or 24px, initials on a neutral tint derived from the user id. |

### 7.6 Data display

| Component | Notes |
|---|---|
| `DataTable` | The Table layout of a list. Server-driven. Sticky header inside the sheet's scroll area (`--bg-raised`, `--type-micro`, 32px). Rows 44px (comfortable) or 32px (compact, per user), `--radius-sm` on hover. Hover `--bg-hover`, selected `--accent-soft`. No row dividers. Title column takes the free width. Dates right-aligned with tabular figures. Status column fixed 140px. Row click opens the document; Cmd/Ctrl-click opens a new tab. Checkbox column appears on hover or when any row is selected. |
| `Cell` renderers | Text, Date (relative within 7 days, absolute after, full timestamp in tooltip), Boolean (Badge "Yes" or "No"), Relationship (titles, "+2" overflow with tooltip), Media (32px thumbnail plus filename), Bytes, Status, Select (label not value), Json (mono, truncated), plus the custom cells in `03` §B. |
| `Pagination` | "1 to 25 of 312", previous and next, page size menu (10, 25, 50, 100). |
| `FilterBar` | View tabs first (All, Drafts, Scheduled, Published, with counts), then filter chips ("Author is Ana Ramos"); the active filter chip uses `--accent-soft` and `--accent-text`. "+ Filter" opens a field picker then a value picker. Chips are removable. Filters live in the URL. |
| `GroupedList` | The List layout of a list (Phase 5): rows grouped by status in the order Scheduled, Published with changes, Drafts, Published. Group row 34px on `--bg-raised`, `--radius-md`, with glyph, label and count. Row 44px: checkbox on hover, status glyph, title (`--type-body-strong`), chips, author avatars, relative date, more button on hover. Selecting rows shows the floating selection bar (`--glass`, `--radius-full`, `--shadow-popover`) centred 22px above the sheet bottom. |
| `KeyValue` | Two-column metadata list for read-only panels (lead details, audit rows). |
| Charts | `TrendChart`, `Sparkline`, `BarList`, `Histogram`, `Scatter`: ported from the current analytics components, restyled with tokens. No chart library from a CDN (CSP). |

### 7.7 Sign-in brand panel

The sign-in, forgot-password and reset-password screens use one split layout (S-01 to S-03). The panel's job is to say what Studio is for, in one glance:

- Left: the form side on `--bg-surface`. Brand row top-left (mark plus "CleanStart Studio"), the form centred in a 360px column, a footer line bottom-left. No card around the form. Heading "Welcome back" (`--type-display`) with "Sign in with your CleanStart work account." below.
- Right: a 776px brand panel at `--radius-lg`, inset 8px, filled with `--brand-band`, with three blurred glows (`--brand-glow-*`) and the website's faded hero grid (`apps/web/public/images/cleanstart-images/hero-vector-grid.svg`, copied into `apps/cms/public/studio/`) behind the content.
- Panel content, top to bottom: the white brand mark and "CleanStart"; then a kinetic headline in `--type-brand` (76/92, 600, -0.045em): "Write the next" in white at 60%, and below it a one-line slot that rolls through the content types Studio publishes ("blog post", "guide", "case study", "webinar", "press release", "podcast episode"), each followed by a full stop in `--brand-accent`; then one sentence, "Studio is where every page on cleanstart.com is written, reviewed and published."; then, pinned to the bottom, a row of six chips naming the same types, with the chip of the word on screen lit (white with `--brand-ink` text).
- Motion: each word holds for 1.8s, then rolls up one line in 0.6s on `--ease-out`; the slot fades its top and bottom edges with a mask so words slide in and out of view. The chips change in step. Glows drift slowly. On mount, the panel copy and the form stagger in (fade and 14px rise), and an invalid field shakes once to mark the error.
- The panel is `aria-hidden` and carries fixed copy; it never shows real content to a signed-out visitor. Below 1100px wide it is hidden and the form side fills the window.

## 8. Content and copy rules

- Sentence case everywhere, including buttons and page titles.
- Buttons are verbs: "Publish", "Save draft", "Schedule", "Add block", "Upload". Never "Submit" or "OK".
- One label per intent across Studio: "Delete" (not Remove, Trash), "Duplicate" (not Copy), "Preview" (not View draft).
- Errors say what happened and what to do: "Slug is already used by ‘Zero CVE images’. Choose a different slug."
- Empty states say what goes here and offer the one action that fills it.
- Dates: "Oct 16, 2026" and "Oct 16, 2026, 2:30 PM" in the user's timezone; relative ("3 min ago") only within 7 days.
- No em-dashes or en-dashes in any UI string. Ranges use "to".
- Field descriptions are rewritten in plain words where today they use jargon (ISO 8601, AEO/GEO, dead-letters, phase names). The rewrite list is part of Phase 4 and Phase 5 tasks.
- Studio shows the labels and descriptions defined in the Payload schema. On 2026-10-16 at least 18 descriptions and 6 labels there contain an em-dash or en-dash. The copy rewrite fixes them in the schema source (Payload's admin shows the same strings), and a unit test that walks every Studio schema and fails on any dash keeps them out afterwards.

## 9. Accessibility

- WCAG 2.2 AA. Text contrast at least 4.5:1, large text and UI boundaries at least 3:1, checked by the token contrast test.
- Visible focus on everything focusable: 2px `--focus-ring` outline, 2px offset. Never `outline: none` without a replacement.
- Every interactive component has a keyboard model, documented in its lab page.
- Landmarks: `nav` (sidebar), `main`, `aside` (rail). A skip link to `main` is the first focusable element.
- Live regions: toasts (`role="status"`, errors `role="alert"`), save status.
- axe runs in the Studio e2e suite on every screen in both themes. Zero violations is the bar.

## 10. Review checklist for any UI change

The UI/UX reviewer ticks every line (copied into `05-REVIEW-PROTOCOL.md` Gate C):

- [ ] Uses tokens only. No raw hex, px font size, radius or shadow in the component.
- [ ] Matches the lab component, or the lab was updated in the same change.
- [ ] Ink is the only button fill; ultramarine appears only for focus, selection, links, the active filter and scheduled state.
- [ ] Every state shown: default, hover, focus, active, disabled, loading, empty, error.
- [ ] Both themes checked at 1440×900 with screenshots attached.
- [ ] Keyboard path works, focus visible, focus returns to the trigger after closing an overlay.
- [ ] One primary action per view.
- [ ] Copy follows §8. No em-dashes or en-dashes.
- [ ] No layout shift when data loads (skeleton matches final layout).
- [ ] Motion follows §5 and is off under reduced motion.
- [ ] axe reports zero violations.
