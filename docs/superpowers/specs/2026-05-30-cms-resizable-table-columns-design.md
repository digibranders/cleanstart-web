# CMS list-table column system + resizable columns

**Date:** 2026-05-30
**Scope:** `apps/cms` admin list views (all 28 collections, shared `CmsListView`)
**Status:** Shipped

## Revision (post-build) — layout model changed to auto + scroll

The fixed-layout default-width model below shipped first, then was revised after
QA to meet a follow-up requirement: **every header for every drawer field must
be fully visible, and the table must scroll horizontally when columns don't
fit.** Fixed layout truncates headers it can't fit; with ~70 addable fields,
hardcoded widths can't keep every header readable. Final model:

- **`table-layout: auto`, `width: 100%`** — each column sizes to fit its header
  AND content, so no header truncates regardless of which fields are shown.
  Long-text columns are capped with `max-width` (primary 460px, secondary
  300px) and ellipsised so they don't blow the table width; metadata columns
  are content-sized. The per-type fixed `width` rules were removed.
- **Horizontal scroll** is owned by Payload's inner `.table` div (already
  `overflow-x: auto`); the card (`.cs-list__table`) stays `overflow: clip`
  (rounded corners + clips the handle overlay's edge grip — no phantom card
  scrollbar).
- **ColumnResizer** forces an exact width via `width`+`min`+`max` on `th` AND
  `td` (auto layout needs all three). The handle overlay is pinned to the card
  but positioned in the scroller's content coordinates and translated by
  `-scrollLeft` (synced on the scroller's `scroll` event) so grips track the
  inner-div scroll with zero lag (verified: 0px misalignment at scrollLeft 620).
- **ListCellEnhancer** now skips empty (not-yet-populated) date cells instead of
  marking them processed — fixes a hydration race where a column toggled on
  mid-session could freeze on the verbose date.

The sections below describe the original design; the bullets above supersede the
width/scroll specifics.

## Problem

The shared admin list table (`CmsListView` delegating to Payload's RSC `Table`
slot, styled in `_tables.scss` under `table-layout: fixed`) has column-width
bugs visible across every collection:

1. **Greedy date columns.** The width CSS allow-lists only `updatedAt` /
   `createdAt` / `publicationDate`. Every other date field (`publishedAt`,
   `startsAt`, `lastReviewedAt`, `lastHitAt`, `nextRetryAt`, `resolvedAt`,
   `expiresAt`, `revokedAt`, `capturedAt`, `lastChecked`, `timestamp`) has no
   width rule, so under fixed layout it becomes a *second greedy column*
   splitting leftover space equally with Title (measured: both 252px at 1200px
   viewport). The date also renders Payload's verbose default
   (`April 30th 2024, 5:30 AM`), wasting the width.
2. **Status pill clips.** `_status` at 108px truncates the `PUBLISHED` pill.
3. **Relationship cells clip** (`categories` at 120px).
4. **No user control.** Editors cannot adjust any column to fit their data —
   the headline requirement.

## Decisions (locked)

- **Persistence:** Payload preferences (server, per-user), matching the channel
  column visibility already uses.
- **Cell content:** wire the existing compact `DateCell` / `RelationshipCell`
  globally so dates read `30 Apr 2024` / `3d ago`.
- **Reset:** double-click a handle = autofit that column; a "Reset column
  widths" menu item restores all defaults.
- **Sequencing:** ship width/status defaults first, then layer resizing.

## Approach

**Enhancement layer over Payload's table** (chosen over a full custom-table
rewrite or pure-CSS `resize`). `CmsListView` keeps delegating to Payload's
`Table` slot. A client `ColumnResizer` injects a `<colgroup>` into the rendered
`<table>` and owns every column width through `<col>` elements — authoritative
under `table-layout: fixed`, and decoupled from header text. Drag handles are
absolutely-positioned grips on each `th`'s right edge.

### Step 1 — width defaults + status fix + global cell wiring

> **Implementation note (diverged from initial design):** the repo already
> has a `ListCellEnhancer` (client DOM enhancer) that compacts dates for three
> field names. Stamping a component `DateCell` collided destructively with it
> (the enhancer's `textContent` rewrite nukes the rendered `<time>`). So dates
> are handled by **extending `ListCellEnhancer`** to all date fields, and only
> **`relationship`** is stamped via `wireCustomFields`. Persistence likewise
> uses the existing `users.preferences` json field (PATCH `/api/users/{id}`,
> mirroring `saved-views.ts`), not a separate `payload-preferences` key.

- **`wire-custom-fields.ts`:** add a `CELL_OVERRIDES` map
  (`relationship → RelationshipCell`); stamp the list `Cell` only when the
  field has no explicit `Cell` (Blogs/News/Guides keep theirs), passing
  `collectionSlug` for single relationships. Yields a stable
  `.cs-relationship-cell` class on every relationship column.
- **`ListCellEnhancer.tsx`:** broaden the date selector from three hardcoded
  fields to the `…At` / `…Date` convention plus `lastChecked` / `timestamp`.
  `formatDate` no-ops non-dates, so the broad selector is self-correcting.
- **`_tables.scss`:** replace the field-name allow-list with a type-based width
  system keyed off stable signals so exactly one column (Title/primary) is
  greedy:
  - date: `th[id$="At"]`, `th[id$="Date"]` + explicit non-conventional ids
    (`heading-timestamp`, `heading-lastChecked`) → ~120px, right-aligned.
  - relationship: `.cell` carrying `.cs-relationship-cell` + the known
    relationship headings → ~150px.
  - `_status` pill → widen to fit `PUBLISHED` without clip.
  - non-pill `status` / short enums → ~110px; numbers tabular.

### Step 2 — `ColumnResizer` client component

- Mounts inside `.cs-list__table`; props: `collectionSlug`, ordered accessors
  (from `columnState`). Injects `<colgroup>`, applies widths, renders one
  handle per resizable column (skips `_select`).
- **Drag:** pointer events set the target `<col>` width live; min 64px.
- **Double-click:** autofit — measure widest cell in the column, snap to it.
- **Persistence:** per-editor in `users.preferences.columnWidths[slug]`
  (`column-widths.ts`, mirroring `saved-views.ts`): read from
  `useAuth().user.preferences` (seeded once auth resolves), written debounced
  (400ms) via PATCH `/api/users/{id}`. Widths are sanitised on read (finite,
  in-range) so a corrupt blob can't wedge layout.
- **Reset:** "Reset column widths" item in the existing actions menu deletes
  the preference and clears injected widths → CSS defaults return.
- **A11y:** handles are `role="separator"`, focusable, `aria-orientation`
  vertical; ←/→ nudge width ±16px.

## Robustness requirements ("never break")

- Resizer must no-op safely if the `<table>` / `<thead>` is absent (empty
  state, loading) and re-attach when it appears (MutationObserver on the
  table container, disconnected on unmount).
- Column count/order can change (visibility toggles, SPA nav). The resizer
  keys widths by **accessor**, rebuilds `<colgroup>` to match the live header
  cells, and ignores stale preference keys.
- Preference I/O is fire-and-forget with try/catch; a failed read/write never
  blocks render. Widths are validated (`Number.isFinite`, clamped to
  `[MIN, viewport]`) before use.
- All listeners use `AbortController` / cleanup; no leaked `pointermove`.
- No dependency on `@payloadcms/ui` render exports — data-layer hooks only.

## Files

| File | Change |
|---|---|
| `payload/lib/wire-custom-fields.ts` | add `CELL_OVERRIDES` (relationship), stamp `Cell` when empty |
| `payload/admin/components/ListCellEnhancer.tsx` | broaden date selector to all date fields |
| `payload/admin/components/views/list/ColumnResizer.tsx` | **new** — resize engine (handles + width injection) |
| `payload/admin/lib/column-widths.ts` | **new** — per-editor width persistence helpers |
| `payload/admin/components/views/list/CmsListView.tsx` | mount resizer + reset menu item |
| `payload/collections/Users.ts` | document `columnWidths` in `preferences` shape |
| `app/(payload)/styles/_tables.scss` | type-based default width system + status fix |
| `app/(payload)/styles/_list-controls.scss` | `.cs-list__table` positioning + resize-handle styles |

## Verification

- Chrome MCP review across representative collections (blogs, news, events,
  redirects, media, users, leads): no clipped status pill, exactly one greedy
  column, compact dates, no horizontal overflow at 1200–1440px.
- Drag / double-click / reset / reload (persistence) manually exercised.
- `lint ✓ · typecheck ✓ · build ✓` for `@cleanstart/cms`.
