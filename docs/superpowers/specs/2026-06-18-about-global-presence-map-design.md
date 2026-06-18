# Design Spec: AboutGlobalPresence — Interactive World Map Section

**Date:** 2026-06-18  
**Replaces:** `AboutPowering` section in `apps/web/src/app/about-us/page.tsx`  
**Branch:** `development`

---

## 1. Overview

Replace the "Powering Trusted Software Delivery for Global Leaders" 3-card section on the About page with a full-width interactive world map section showing CleanStart's 4 office locations. The section keeps the existing dark navy/purple gradient background for visual continuity.

---

## 2. Office Data

| Location | Country | Coordinates (lat, lon) | Color |
|---|---|---|---|
| North America (HQ) | United States | 38.9°N, -75.5°W | Amber `#f59e0b` |
| Singapore | Singapore | 1.35°N, 103.82°E | Cyan `#2cc1eb` |
| India — Bengaluru | India | 12.97°N, 77.59°E | Cyan `#2cc1eb` |
| India — Ahmedabad | India | 23.02°N, 72.57°E | Cyan `#2cc1eb` |

Landmark images (downloaded from Unsplash free tier — no attribution required for web use, stored locally):
- `public/images/about/global/landmark-delaware.jpg` — Cape Henlopen / Lewes lighthouse, Delaware  
  Search: `https://unsplash.com/s/photos/lewes-delaware` or `cape-henlopen`
- `public/images/about/global/landmark-singapore.jpg` — Marina Bay Sands skyline  
  Search: `https://unsplash.com/s/photos/marina-bay-sands`
- `public/images/about/global/landmark-bengaluru.jpg` — Vidhana Soudha, Bengaluru  
  Search: `https://unsplash.com/s/photos/vidhana-soudha-bengaluru`
- `public/images/about/global/landmark-ahmedabad.jpg` — Sabarmati riverfront, Ahmedabad  
  Search: `https://unsplash.com/s/photos/sabarmati-ahmedabad`

Images are fetched via `WebFetch` / `curl` during implementation and saved locally. `next/image` serves them with no external CDN dependency.

---

## 3. Visual Design

### 3.1 Section background
Identical gradient to the current `AboutPowering` section:
```css
background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%);
```
Keep existing decorative elements: ellipse blobs (`powering-ellipse-blob.svg`), vector backgrounds (`powering-bg-vector.svg`), and the 6 white guide lines.

### 3.2 Section heading
- Eyebrow chip: `"Global Presence"` — `var(--fs-eyebrow)`, cyan `#2cc1eb`
- H2: `"Where We Operate"` — `var(--fs-h2)`, white, weight 600, letter-spacing `-0.04em`
- Subtitle: `"From the Americas to Southeast Asia, CleanStart's team is building trusted software foundations globally."` — `var(--fs-lead)`, white 60% opacity

### 3.3 World map
- Inline SVG, `viewBox="0 0 1000 460"`, `width: 100%`
- Simplified equirectangular world map outline (major countries/continents as SVG `<path>` elements)
- Country fill: `rgba(44,193,235,0.09)`, stroke: `rgba(44,193,235,0.22)`, stroke-width `0.8`
- Map stored as a separate component `WorldMapPaths.tsx` to keep the main component readable

### 3.4 Markers
Each marker is an SVG `<g>` with three layers:
1. **Glow blob** — large radial gradient circle (r=22 for cyan, r=24 for HQ amber), no stroke
2. **Pulse ring** — medium circle (r=9–12) with CSS `@keyframes pulse` animation, infinite, each marker staggered by 0.5s delay
3. **Core dot** — small solid circle (r=4–5.5) with `filter: drop-shadow`

HQ marker (Delaware) additionally renders a small `"HQ"` badge rectangle above the core dot.

City name labels rendered as SVG `<text>` — hidden below `md` breakpoint via a CSS class.

### 3.5 Connection arcs
Three dashed `<path>` arcs drawn between offices:
1. Delaware HQ → Ahmedabad
2. Ahmedabad → Bengaluru  
3. Bengaluru → Singapore

Each arc animates on mount using `stroke-dashoffset` (draws left-to-right), staggered by 0.3s intervals. Stroke: `rgba(44,193,235,0.25)`, `stroke-dasharray: "6 4"`.

### 3.6 Hover tooltip
Triggered on `onMouseEnter` / `onFocus` (tap-to-toggle on mobile). Positioned as an absolutely-positioned `<div>` overlaid on the map container.

Tooltip anatomy (top to bottom):
- Landmark photo — `next/image`, `width: 220px`, `height: 130px`, `objectFit: "cover"`, `border-radius` top corners only
- Country eyebrow — `var(--fs-eyebrow)`, cyan
- City name — `var(--fs-h4)`, `color: #111`, weight 700
- Full address — `var(--fs-caption)`, `color: #64748b`

Tooltip card: `background: #fff`, `border-radius: 16px`, `box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(44,193,235,0.25)`, `width: 220px`.

Animation: `opacity 0→1 + translateY(8px→0)`, 150ms ease, on show.

Position logic: default positions per marker (precomputed, stored in `OFFICES` data array as `tooltipAnchor: { top?, bottom?, left?, right? }`). Singapore tooltip appears top-right, HQ appears bottom-left of its marker, India offices appear top-right. Tooltip never overflows the section's `overflow: hidden` container.

### 3.7 Legend ribbon
Below the map: a `flex-wrap` row of 4 clickable pills.

Each pill:
- Colored dot (8px, cyan or amber)
- City/country label text
- HQ badge (amber pill, small caps) on the North America entry

States:
- Default: `border: 1.5px solid rgba(255,255,255,0.12)`, `background: rgba(255,255,255,0.06)`, text `rgba(255,255,255,0.75)`
- Hover: `border-color: rgba(44,193,235,0.5)`, `background: rgba(44,193,235,0.1)`, text white
- Active: `border-color: #2cc1eb`, `background: rgba(44,193,235,0.15)`, `box-shadow: 0 0 0 3px rgba(44,193,235,0.12)`. HQ active uses amber equivalents.

---

## 4. Interaction Model

### State
```ts
type LocationId = 'hq' | 'singapore' | 'bengaluru' | 'ahmedabad';
// activeLocation: LocationId | null
// hoveredLocation: LocationId | null
// visibleTooltip = hoveredLocation ?? activeLocation
```

### Click / tap
- Clicking a marker or legend pill sets `activeLocation`
- All other markers dim to 40% opacity (SVG `opacity` attribute via conditional class)
- Corresponding legend pill enters active state
- Tooltip stays open until another location is selected or user clicks away

### Hover (desktop only)
- `hoveredLocation` overrides `activeLocation` for tooltip display
- On mouse leave, tooltip reverts to `activeLocation` (or hides if none)

### No selection (initial state)
- All markers at full opacity and pulsing
- No tooltip shown
- No legend pill active
- Connection arcs still animate in on mount

### Mobile tap-elsewhere
- Tapping outside any marker or legend pill clears both `hoveredLocation` and `activeLocation` (tooltip hides, all markers return to full opacity). Implemented via a `touchstart` listener on the section's wrapping `<div>` that fires only when the event target is not a marker or pill.

---

## 5. Animations

| Animation | Trigger | Duration | Details |
|---|---|---|---|
| Arc draw-in | On mount | 2s each, staggered 0.3s | `stroke-dashoffset` 300→0, ease |
| Marker scale-in | On mount | 0.4s each, staggered 0.15s | `scale(0→1)`, spring easing |
| Pulse ring | Infinite | 2.4s per cycle | `scale(1→2.4) + opacity(0.7→0)`, staggered 0.5s per marker |
| Tooltip fade | On hover/select | 150ms | `opacity + translateY(8px→0)` |
| Marker dim | On select | 200ms | `opacity` transition |
| Legend active | On select | 150ms | `border-color + background` CSS transition |

All animations via CSS only (no JS animation libraries). Mount animations use a `useEffect` that adds an `.animated` class to the SVG container after the component mounts.

---

## 6. File Structure

```
apps/web/src/components/sections/about/
├── AboutGlobalPresence.tsx      # main section component (NEW)
└── WorldMapPaths.tsx            # SVG <g> with all country <path> elements (NEW)

apps/web/public/images/about/global/
├── landmark-delaware.jpg        # downloaded from Unsplash
├── landmark-singapore.jpg
├── landmark-bengaluru.jpg
└── landmark-ahmedabad.jpg
```

Modified files:
- `apps/web/src/app/about-us/page.tsx` — swap `AboutPowering` import/usage for `AboutGlobalPresence`

Deleted (after replacement confirmed working):
- `AboutPowering.tsx` is kept but no longer imported — can be deleted in same PR

---

## 7. Data Shape

```ts
interface OfficeLocation {
  id: 'hq' | 'singapore' | 'bengaluru' | 'ahmedabad';
  name: string;           // "North America (HQ)"
  country: string;        // "United States"
  address: string;
  landmark: string;       // image path
  landmarkAlt: string;    // image alt text
  color: 'cyan' | 'amber';
  // SVG viewBox coordinates (1000×460 equirectangular)
  x: number;
  y: number;
  // Tooltip position relative to map container
  tooltipAnchor: {
    top?: string; bottom?: string;
    left?: string; right?: string;
  };
  labelOffset: { x: number; y: number }; // SVG text offset from marker center
}
```

---

## 8. Technical Constraints

- **No external map libraries.** Pure SVG + React + CSS.
- **SSR-safe.** No `window`/`document` in render path. `useEffect` only for mount animation class toggle.
- **`next/image` for landmark photos.** Explicit `width={220}` `height={130}` props.
- **Typography tokens.** Use `var(--fs-*)` tokens, never inline px/clamp for headings.
- **Responsive.** Map SVG scales via `width: 100%`. City labels hidden `< md`. Tooltip on mobile = tap to show, tap elsewhere to close. Legend pills wrap to `grid-cols-2` on mobile.
- **Accessibility.** Each marker `<g>` gets `role="button"` `tabIndex={0}` `aria-label`. Tooltip has `role="tooltip"`. Legend pills are `<button>` elements.

---

## 9. Pre-completion checks

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Visual verification at 1440×900 in Claude Preview — section must match the mockup at that viewport.
