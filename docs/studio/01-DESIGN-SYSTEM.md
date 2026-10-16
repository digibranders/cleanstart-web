# Studio design system

Status: draft for sign-off (decisions D-1 to D-3 in `00-MASTER-PLAN.md` change parts of this file).

Design read: an internal content admin for CleanStart editors and marketers, in a restrained Linear and Apple language. Calm neutrals, one accent, dense but never cramped, motion only where it explains a change.

Dials (from the taste skill, used to settle arguments in review): variance 2 (systematic, predictable), motion 3 (subtle), density 5 (daily-use app).

Everything here is implemented as CSS custom properties in `apps/cms/src/studio/styles/tokens.css` and exposed to Tailwind through `@theme` in `studio.css`. Components use tokens only. A raw hex value or pixel size inside a component fails review.

## 1. Principles

1. **Content first.** Chrome is quiet: hairline borders, no heavy cards, no gradients. The document being edited is the brightest thing on screen.
2. **One way to do each thing.** One button family, one input height, one menu, one dialog, one toast. If two screens solve the same problem differently, one of them is wrong.
3. **Keyboard first.** Every action has a keyboard path. Frequent actions have shortcuts. Focus is always visible.
4. **State is never ambiguous.** Saved or not, draft or published, locked or free, loading or empty: each has one clear visual.
5. **Nothing moves without a reason.** Motion confirms an action or shows where something came from. It never decorates.
6. **Say it plainly.** Sentence case, short labels, no internal jargon in the UI (no "dead letter", "ISR", "AEO" in editor-facing copy).

## 2. Color

Two themes, chosen per D-3. Both are designed and reviewed. Values below were checked on 2026-10-16 against WCAG 2.2: text tokens reach at least 4.5:1 and `--border-control` and `--focus-ring` at least 3:1 on every surface they sit on. The token contrast test (Phase 0, Task 0.4) re-checks them on every change.

### 2.1 Neutrals

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg-canvas` | `#0e0f11` | `#ffffff` | Page background, editor canvas |
| `--bg-surface` | `#141518` | `#fafafa` | Sidebar, right rail, table header |
| `--bg-raised` | `#1a1b1f` | `#ffffff` | Inputs, cards that need lift |
| `--bg-overlay` | `#1e1f24` | `#ffffff` | Menus, popovers, dialogs, toasts |
| `--bg-hover` | `rgb(255 255 255 / 0.04)` | `rgb(15 16 20 / 0.04)` | Row and item hover |
| `--bg-active` | `rgb(255 255 255 / 0.07)` | `rgb(15 16 20 / 0.07)` | Pressed, selected nav item |
| `--border-subtle` | `rgb(255 255 255 / 0.06)` | `rgb(15 16 20 / 0.06)` | Dividers inside a surface |
| `--border` | `rgb(255 255 255 / 0.10)` | `rgb(15 16 20 / 0.10)` | Inputs, cards, table rules |
| `--border-strong` | `rgb(255 255 255 / 0.16)` | `rgb(15 16 20 / 0.16)` | Hovered cards, focused containers |
| `--border-control` | `#6b6d75` | `#8a8c94` | Outline of inputs, selects, checkboxes, radios, switches (WCAG 1.4.11 needs 3:1 against the surrounding surface) |
| `--text-primary` | `#ececee` | `#17181c` | Body text, values |
| `--text-secondary` | `#a0a1a8` | `#5d5e66` | Labels, metadata |
| `--text-tertiary` | `#8b8c95` | `#6b6c75` | Placeholders, hints, timestamps |
| `--text-disabled` | `#4d4e55` | `#b4b5bb` | Disabled values |

One gray family only (cool). No warm grays anywhere.

### 2.2 Accent (brand cyan)

The brand cyan is `#06c7f2` (brand guideline; `apps/cms/src/app/(payload)/styles/_tokens.scss`). Cyan is reserved for: the primary action, focus, selection, links and "active" state. It is never used for decoration.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--accent` | `#06c7f2` | `#06c7f2` | Primary button fill, selected checkbox, active tab underline |
| `--accent-hover` | `#4dd5f7` | `#04a3c8` | Primary button hover |
| `--on-accent` | `#04212a` | `#04212a` | Text and icons on `--accent` |
| `--accent-text` | `#4dd5f7` | `#03758f` | Links and accent text on canvas |
| `--accent-soft` | `rgb(6 199 242 / 0.12)` | `rgb(6 199 242 / 0.10)` | Selected row, active nav item tint |
| `--focus-ring` | `#4dd5f7` | `#03819f` | 2px focus outline, 2px offset |

White text on cyan fails contrast in both themes, so primary buttons always use `--on-accent`. Cyan text on light backgrounds must use `--accent-text`, never `--accent`.

### 2.3 Status

| Token | Dark | Light | Soft background |
|---|---|---|---|
| `--success` | `#3ecf8e` | `#15803d` | 12% of the dark value |
| `--warning` | `#f5a524` | `#b45309` | 12% |
| `--danger` | `#f2555a` | `#dc2626` | 12% |
| `--info` | uses `--accent-text` | uses `--accent-text` | `--accent-soft` |

Document status mapping (used everywhere a status shows):

| Status | Badge | Dot |
|---|---|---|
| Published | neutral text, `--success` dot | yes |
| Draft | neutral text, `--text-tertiary` dot | yes |
| Changed since publish | neutral text, `--warning` dot, label "Published, changes" | yes |
| Scheduled | neutral text, `--accent` dot, label "Scheduled · Oct 18, 9:00 AM" | yes |

Status is shown by a 6px dot plus a word, never by color alone.

## 3. Typography

Typeface per D-1: Inter Variable for UI, JetBrains Mono for code, ids, slugs and keyboard keys. Both self-hosted as woff2 in `apps/cms/public/fonts/` (the CSP allows same-origin fonts only). Inter loads with `font-feature-settings: "cv11", "ss01", "tnum" 0`; tables and numeric cells turn on `tnum`.

| Token | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `--type-display` | 24 / 32 | 600 | -0.02em | Dashboard and report page titles |
| `--type-title` | 18 / 26 | 600 | -0.015em | Page titles in list headers, dialog titles |
| `--type-heading` | 14 / 20 | 600 | -0.005em | Card titles, rail section titles |
| `--type-body` | 13 / 20 | 400 | 0 | Default UI text, inputs, table cells |
| `--type-body-strong` | 13 / 20 | 500 | 0 | Nav items, buttons, field labels |
| `--type-small` | 12 / 16 | 400 | 0 | Help text, metadata, timestamps |
| `--type-micro` | 11 / 14 | 500 | 0.01em | Badges, counters, table header |
| `--type-mono` | 12 / 18 | 400 | 0 | Slugs, ids, code, JSON |

Editor canvas (rich text and the document title field) uses a reading scale:

| Token | Size / line height | Weight |
|---|---|---|
| `--type-doc-title` | 28 / 36 | 600 |
| `--type-doc-body` | 16 / 26 | 400 |
| `--type-doc-h2` | 22 / 30 | 600 |
| `--type-doc-h3` | 18 / 26 | 600 |
| `--type-doc-h4` | 16 / 24 | 600 |

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
| `--radius-xs` | 4px | Checkboxes, badges, `kbd`, tags |
| `--radius-sm` | 6px | Buttons, inputs, selects, nav items, menu items |
| `--radius-md` | 8px | Cards, menus, popovers, tooltips, table container |
| `--radius-lg` | 12px | Dialogs, drawers, command palette |
| `--radius-full` | 9999px | Avatars, status dots, switch track |

The rule: the radius grows with the size of the container. Nothing else.

### 4.4 Elevation

Flat by default. Borders separate surfaces. Shadows only on things that float above the page.

| Token | Dark | Light |
|---|---|---|
| `--shadow-popover` | `0 0 0 1px var(--border), 0 8px 24px rgb(0 0 0 / 0.40)` | `0 0 0 1px var(--border), 0 8px 24px rgb(15 16 20 / 0.10), 0 1px 2px rgb(15 16 20 / 0.06)` |
| `--shadow-dialog` | `0 0 0 1px var(--border), 0 24px 64px rgb(0 0 0 / 0.55)` | `0 0 0 1px var(--border), 0 24px 64px rgb(15 16 20 / 0.16)` |
| `--backdrop` | `rgb(0 0 0 / 0.55)` + `blur(8px)` | `rgb(15 16 20 / 0.30)` + `blur(8px)` |

### 4.5 Z-index

`--z-sticky` 10 · `--z-sidebar` 20 · `--z-header` 30 · `--z-popover` 40 · `--z-dialog` 50 · `--z-toast` 60 · `--z-palette` 70. Nothing else may set `z-index`.

### 4.6 App frame

```
┌──────────────┬───────────────────────────────────────────────────────┐
│ Sidebar 240  │ Page header 48 (breadcrumb · title · actions)         │
│ (56 when     ├───────────────────────────────────────────────────────┤
│  collapsed)  │ Page body                                             │
│              │                                                       │
└──────────────┴───────────────────────────────────────────────────────┘
```

Document view:

```
┌──────────┬───────────────────────────────────────────┬──────────────┐
│ Sidebar  │ Document header 52 (sticky)               │              │
│          ├───────────────────────────────────────────┤ Right rail   │
│          │      Content column, max 720, centred      │ 320 default  │
│          │      Title (doc-title), then fields        │ 280 to 440,  │
│          │                                           │ collapsible  │
└──────────┴───────────────────────────────────────────┴──────────────┘
```

With the preview pane open, the content column and preview split the space between sidebar and rail 50/50, and the rail collapses to an icon strip.

Breakpoints: full layout from 1280px. From 1024 to 1279px the sidebar starts collapsed and the rail becomes a drawer. Below 1024px Studio shows a "Studio needs a wider window" notice with a link to the published site.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 100ms | Hover, press, checkbox, switch |
| `--duration-base` | 150ms | Menus, popovers, tooltips, tab underline |
| `--duration-slow` | 200ms | Dialogs, drawers, palette, rail collapse |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Enter |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit (exits use `--duration-fast`) |

Allowed motion only:

- Popover and menu: fade plus 4px translate from the anchor side.
- Dialog: fade plus scale from 0.98.
- Drawer and rail: slide on the x axis.
- Toast: slide up and fade, exit by fade.
- Press: `scale(0.98)` on buttons.
- Skeleton: one slow opacity pulse (1.6s), no shimmer.

`prefers-reduced-motion: reduce` turns every transition into an instant change. Animate `transform` and `opacity` only.

## 6. Iconography

- Per D-2: `@phosphor-icons/react`, Regular weight. 16px in UI, 14px inside `--control-sm` buttons and table cells, 20px for empty states.
- Icons inherit `currentColor`. One weight everywhere.
- No hand-drawn SVG icons. No Unicode glyphs as icons (×, ✓, →). The brand mark and wordmark (`Logo.tsx`, `Icon.tsx`) are the only custom SVGs.
- An icon-only button always has an `aria-label` and a tooltip with the label and shortcut.

## 7. Components

Every component below lives in `apps/cms/src/studio/ui/` (or restyles a `packages/ui` primitive through `primitives.css`). Every component is shown in every state in the lab (`/studio/lab`) before any screen uses it. "States" lists what the lab must show.

### 7.1 Actions

| Component | Variants | Sizes | States | Notes |
|---|---|---|---|---|
| `Button` | `primary` (accent fill), `secondary` (raised, border), `ghost` (no border), `danger` (danger text, danger fill on confirm dialogs only) | sm 24, md 28, lg 32 | default, hover, active, focus-visible, disabled, loading (spinner replaces leading icon, width locked) | Label is a verb, 1 to 3 words. Leading icon optional. One `primary` per view. |
| `IconButton` | `ghost`, `secondary` | sm, md | as Button, plus `pressed` for toggles | Required `label` prop, used for `aria-label` and tooltip. |
| `SplitButton` | primary main action + chevron menu | md, lg | as Button; menu open | Publish control and Preview control use it. |
| `ButtonGroup` | segmented (for view toggles) | md | selected, focus | Arrow keys move selection. |
| `Link` | inline, standalone | inherit | default, hover (underline), visited is not styled | External links show a 12px arrow-up-right icon. |
| `Kbd` | single key, combo | micro | none | Mono font, `--bg-raised`, `--radius-xs`. Mac shows ⌘ ⇧ ⌥, others Ctrl Shift Alt. |

### 7.2 Inputs

All inputs: height `--control-lg` (32), `--bg-raised`, 1px `--border-control`, `--radius-sm`, 13px text, 10px horizontal padding. Hover: `--text-tertiary` border. Focus: border `--focus-ring` plus 2px outline at 2px offset. Error: border `--danger`, message below. Read-only: no border, `--bg-surface`, text `--text-secondary`, a lock icon with the reason in a tooltip. Disabled: 50% opacity, `cursor: not-allowed`.

| Component | Notes |
|---|---|
| `Field` | Wrapper: label (13/500), optional "Optional" hint, description (12px, `--text-secondary`), control, error (12px, `--danger`, with a 14px warning icon). Label above control always. `aria-describedby` wires description and error. |
| `TextInput` | Character counter when `maxLength` is set (shows at 80% of the limit). Prefix and suffix slots. |
| `Textarea` | Auto-grows from 3 rows to 12, then scrolls. Counter as TextInput. |
| `NumberInput` | Steppers on hover only. `hasMany` renders as a tag input. |
| `Select` | Single and multi. Searchable when there are more than 8 options. Opens a `Combobox` popover. Never a native `<select>`. |
| `Checkbox` | 16px box, `--radius-xs`. Label clickable. Indeterminate state for table header. |
| `Switch` | For instant settings only (theme, toggles that save immediately). Form booleans use Checkbox. |
| `RadioGroup` | Vertical list, or segmented when there are 2 to 4 short options. |
| `DateTimePicker` | Restyles `packages/ui` DateTimePicker. Phase 0 fixes its keyboard model (`role="grid"`, arrow keys, Home/End, PageUp/PageDown). Shows the timezone. |
| `TagInput` | For `hasMany` text and number, keywords. Enter or comma adds, Backspace removes the last tag. |
| `SearchInput` | Leading magnifier icon, clear button, `/` focuses the page's search. |
| `CodeEditor` | CodeMirror 6 themed from tokens. Mono 12px. Line numbers. Used for `code` and `json` fields. |
| `Combobox` | Restyles `packages/ui` Combobox. Used by Select, relationship fields and filters. |

### 7.3 Containers and structure

| Component | Notes |
|---|---|
| `PageHeader` | 48px. Breadcrumb (`--text-secondary`, chevron separators), title (`--type-title`), optional count badge inline with the title (neutral), actions right-aligned. |
| `Card` | `--bg-raised`, 1px `--border`, `--radius-md`, 16px padding. Header row: title (`--type-heading`), optional action. Used in the right rail and dashboards only. Forms do not use cards. |
| `Section` | Form section: title (`--type-heading`), optional description, 32px above. No border, no background. |
| `Collapsible` | Disclosure with a chevron that rotates 90°. Remembers open state per user in `users.preferences`. |
| `Tabs` | Underline tabs, 28px. Arrow keys move, Enter or Space selects. Active: text primary plus 2px accent underline. |
| `Divider` | 1px `--border-subtle`. |
| `Rail` | Right rail container: resizable (280 to 440, keyboard resizable with ← and →), collapsible to a 40px icon strip, width saved per user. |
| `SplitPane` | Edit plus preview split, draggable divider, double-click resets to 50/50. |

### 7.4 Overlays

All overlays restyle the `packages/ui` primitives (native `<dialog>` and anchored popovers), so focus trap, Esc and top-layer stacking come from the platform.

| Component | Notes |
|---|---|
| `Dialog` | Sizes sm 400, md 560, lg 720, xl 960. Header (title + optional description + close), body (24px padding), footer (right-aligned buttons, primary last). |
| `ConfirmDialog` | Title states the action ("Delete 3 blogs?"). Body states the consequence. Danger tone focuses Cancel first. |
| `Drawer` | Right side. sm 400, md 560, lg 720. Used for quick create, export, filters on narrow screens, media detail from a picker. |
| `Popover` | `--bg-overlay`, `--shadow-popover`, `--radius-md`, 8px padding. |
| `Menu` | Restyles `DropdownMenu` and `ContextMenu`. Items 28px, icon 16px, shortcut right-aligned in `Kbd`. Danger items in `--danger` text. Groups with 11px labels. Every context menu also opens from a visible "more" button, so nothing is right-click only. |
| `Tooltip` | 12px text, `--bg-overlay`, delay 400ms, instant when moving between tooltipped items. Shows shortcut in `Kbd` when there is one. Never holds essential information. |
| `Toast` | One system (`packages/ui` Toast, the `cs:toast` event). Bottom-right stack, max 3. Tones info, success, warning, error. 4s default, errors stay until dismissed. Optional single action ("Undo", "View"). |
| `CommandPalette` | 640px wide, `--radius-lg`, input 44px, results grouped (Recent, Go to, Create, Documents, Actions). `aria-activedescendant` pattern. |

### 7.5 Feedback and status

| Component | Notes |
|---|---|
| `Badge` | 20px tall, `--type-micro`, `--radius-xs`. Tones neutral, accent, success, warning, danger. Optional 6px dot. Only two sizes exist: sm 20px and md 24px. |
| `StatusBadge` | Maps document status (§2.3) to a Badge with a dot. |
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
| `DataTable` | Server-driven. Sticky header (`--bg-surface`, `--type-micro`, 32px). Rows 40px (comfortable) or 32px (compact, per user). Hover `--bg-hover`, selected `--accent-soft`. Title column takes the free width. Dates right-aligned with tabular figures. Status column fixed 140px. Row click opens the document; Cmd/Ctrl-click opens a new tab. Checkbox column appears on hover or when any row is selected. |
| `Cell` renderers | Text, Date (relative within 7 days, absolute after, full timestamp in tooltip), Boolean (Badge "Yes" or "No"), Relationship (titles, "+2" overflow with tooltip), Media (32px thumbnail plus filename), Bytes, Status, Select (label not value), Json (mono, truncated), plus the custom cells in `03` §B. |
| `Pagination` | "1 to 25 of 312", previous and next, page size menu (10, 25, 50, 100). |
| `FilterBar` | Filter pills ("Status is Draft", "Author is Ana"). "+ Filter" opens a field picker then a value picker. Pills are removable. Filters live in the URL. |
| `KeyValue` | Two-column metadata list for read-only panels (lead details, audit rows). |
| Charts | `TrendChart`, `Sparkline`, `BarList`, `Histogram`, `Scatter`: ported from the current analytics components, restyled with tokens. No chart library from a CDN (CSP). |

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
- [ ] Every state shown: default, hover, focus, active, disabled, loading, empty, error.
- [ ] Both themes checked at 1440×900 with screenshots attached.
- [ ] Keyboard path works, focus visible, focus returns to the trigger after closing an overlay.
- [ ] One primary action per view.
- [ ] Copy follows §8. No em-dashes or en-dashes.
- [ ] No layout shift when data loads (skeleton matches final layout).
- [ ] Motion follows §5 and is off under reduced motion.
- [ ] axe reports zero violations.
