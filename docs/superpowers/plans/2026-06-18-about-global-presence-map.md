# AboutGlobalPresence Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `AboutPowering` 3-card section on the About page with an interactive SVG world map showing CleanStart's 4 office locations.

**Architecture:** Pure inline SVG world map (equirectangular, viewBox 1000×460) with React state for hover/click, CSS keyframes for pulse/arc animations, and `next/image` for local landmark photos. No external map libraries.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · CSS keyframes in globals.css

---

### Task 1: Download landmark images

**Files:**
- Create: `apps/web/public/images/about/global/landmark-singapore.jpg`
- Create: `apps/web/public/images/about/global/landmark-bengaluru.jpg`
- Create: `apps/web/public/images/about/global/landmark-ahmedabad.jpg`
- Create: `apps/web/public/images/about/global/landmark-delaware.jpg`

- [ ] Create directory and download four Unsplash landmark photos via curl

---

### Task 2: Add CSS keyframes to globals.css

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] Add `@keyframes cs-map-pulse`, `@keyframes cs-map-arc-draw`, `@keyframes cs-map-marker-in` after existing keyframes block

---

### Task 3: Create WorldMapPaths component

**Files:**
- Create: `apps/web/src/components/sections/about/WorldMapPaths.tsx`

- [ ] Export a React component returning a `<g>` element containing simplified equirectangular continent paths

---

### Task 4: Create AboutGlobalPresence component

**Files:**
- Create: `apps/web/src/components/sections/about/AboutGlobalPresence.tsx`

- [ ] Full interactive section: heading, SVG map with markers/arcs, tooltip, legend pills

---

### Task 5: Wire into About page

**Files:**
- Modify: `apps/web/src/app/about-us/page.tsx`

- [ ] Replace `AboutPowering` import and usage with `AboutGlobalPresence`

---

### Task 6: Checks + commit

- [ ] `pnpm --filter @cleanstart/web lint`
- [ ] `pnpm --filter @cleanstart/web typecheck`
- [ ] `pnpm --filter @cleanstart/web build`
- [ ] Commit
