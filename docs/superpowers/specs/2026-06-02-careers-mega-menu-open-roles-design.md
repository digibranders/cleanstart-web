# Careers in the Company mega menu — open-roles reveal

**Date:** 2026-06-02 · **Area:** `apps/web` · **Status:** approved design

## Goal

Surface live open roles in the desktop **Company** mega menu using progressive
disclosure: quiet by default, full roster on intent.

- **Default (menu open):** the existing right-hand spotlight stays (community /
  careers CTA). The **"Careers"** row shows a live **"N open"** count badge.
- **On hover OR keyboard-focus of the "Careers" row:** the right card swaps to a
  **fixed-height, scrollable list of all open roles**. Each role links to its
  detail page `/careers/[slug]`. A sticky footer **"View all N roles →"** links
  to `/careers`.
- **Zero open roles:** no badge, no reveal; default spotlight unchanged.

Non-goals: listing closed/paused roles in nav; changing the `/careers` page;
mobile hover (mobile gets badge + link only).

## Why this shape

- Keeps nav clean and the community brand moment intact by default.
- Reveals the complete roster on intent → no curation/"why these 3?" problem.
- Reuses the already-built `careers` spotlight + open-roles-count plumbing.

## Existing infrastructure (reuse, don't duplicate)

- `apps/web/src/components/nav/Header.tsx` — **server** component; fetches nav
  data via `Promise.all` (incl. `companySpotlight` from `resolveCompanySpotlight`,
  which already calls `fetchOpenRolesCount`) and passes props into `DesktopNav`.
- `apps/web/src/components/nav/DesktopNav.tsx` — **client**; renders `PanelCompany`
  with `{ item, spotlight }`.
- `apps/web/src/components/nav/panels/PanelCompany.tsx` — 2-col grid: `PanelRow`
  list (left) + `SpotlightRenderer` (right).
- `apps/web/src/lib/jobs.ts` — `getJobs({ status: 'open' })` returns open `Job[]`
  (title, slug, locations, department). `/careers/[slug]` detail route exists.
- `SpotlightCard` already has `{ kind: 'careers'; openRoles: number }`.

## Architecture

Data flows server → client through existing props; the hover swap is a small
isolated client interaction.

1. **Data layer** — add `fetchOpenRoles()` in
   `apps/web/src/components/nav/data/` (or extend the careers data module):
   returns a compact `OpenRole[]` = `{ title; slug; location: string | null }`,
   wrapped in React `cache()` + the standard `fetchCMS` ISR revalidate, **fail-soft**
   (returns `[]` on error). Reuses `getJobs({ status: 'open' })`; resolves the
   first/primary location label. Header adds it to its `Promise.all` and passes
   `openRoles` into `DesktopNav` → `PanelCompany`.
2. **PanelCompany interaction** — extract the reveal into a small **client**
   component `CareersRevealColumn` (PanelCompany may stay server and render it).
   It owns the hover/focus state:
   - Renders the left rows; the `Careers` row gets the count **badge** and the
     hover/focus handlers (`onPointerEnter`/`onFocus` → active; `onPointerLeave`/
     `onBlur` with a short revert delay → inactive). Hover-intent: a small bridge
     so cursor travel item→card doesn't drop the active state.
   - Right slot: `active ? <OpenRolesCard roles={openRoles} /> : <SpotlightRenderer spotlight={spotlight} hero />`.
3. **OpenRolesCard** (`pieces/OpenRolesCard.tsx`) — fixed height (~matches the
   spotlight `min-h`), `overflow-y-auto` list; each row is a `Link` to
   `/careers/[slug]` showing title + location; sticky bottom footer link
   "View all N roles →" → `/careers`. Keyboard: rows are real links (focusable,
   scroll-into-view on focus).
4. **Mobile** — `MobileNav` Company section: show the count next to "Careers"
   and link to `/careers`; **no** hover card.

## States

| State | Badge | Right card |
|---|---|---|
| ≥1 open, default | "N open" | existing spotlight (community/careers) |
| ≥1 open, Careers hovered/focused | "N open" | OpenRolesCard (scrollable) |
| 0 open | none | existing spotlight (community), no reveal |
| CMS error | none (count 0) | community spotlight (fail-soft) |

## Accessibility

- Focusing "Careers" (Tab) reveals the same card as hover (focus + hover both set
  active). Roles are native links → keyboard-navigable and scrollable.
- Card is not a focus trap; revert delay prevents flicker but doesn't fight focus.
- Respect existing nav escape/close behavior.

## Performance / resilience

- `fetchOpenRoles` cached (React `cache` per request) + ISR via `fetchCMS`
  revalidate (align with existing nav fetches, ~10 min). Nav never blocks on it.
- Fail-soft everywhere: a CMS hiccup → `openRoles=[]` → no badge, community card.

## Testing

- Unit: `fetchOpenRoles` maps `Job[]` → `OpenRole[]` (location resolution, empty
  on error). Badge count = roles length.
- Component: `CareersRevealColumn` shows spotlight by default; shows OpenRolesCard
  on hover and on focus; hides badge when `roles=[]`.
- `OpenRolesCard`: renders N rows with correct `/careers/[slug]` hrefs + "View all".
- Lint · typecheck · `apps/web` build.

## Files

- New: `data/open-roles.ts`, `pieces/OpenRolesCard.tsx`, `panels/CareersRevealColumn.tsx` (client).
- Edit: `Header.tsx` (fetch + prop), `DesktopNav.tsx` (prop passthrough),
  `PanelCompany.tsx` (use reveal column), `MobileNav.tsx` (badge + link).
