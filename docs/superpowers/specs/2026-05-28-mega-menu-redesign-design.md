# Mega Menu Redesign — Design Spec

**Date:** 2026-05-28
**Owner:** admin@digibranders.com
**Branch:** `development`
**Scope:** `apps/web` only (marketing site). `apps/cms` untouched.
**Status:** Draft, awaiting user review before writing-plans.

---

## 1. Problem

The current marketing-site navbar (`apps/web/src/components/nav/MegaMenu.tsx`) is functional but underdeveloped. An audit of the live code surfaced eleven issues — most material:

1. No icons or visual hierarchy on any leaf — every link reads as plain text.
2. The same "Ready to Get Started? Book a Demo" CTA card is rendered on every panel, regardless of context.
3. No active-route state on the trigger — visiting `/cleansight` does not visually mark the Products tab.
4. The `built: true` default-false flag in `nav-config.ts` is fragile: forgetting it silently downgrades a real route to a dead `<span>`.
5. Unbuilt `<span>` items have `cursor: pointer` but no `aria-disabled` or `role` — confusing for screen readers and keyboard users.
6. Panel widths are hand-coded (`COL_W=280`, `CTA_W=240`), producing jarring width jumps between triggers (Solutions ≈ 520 px, Resources ≈ 800 px).
7. Description density is inconsistent — Products + Solutions render two-line cards; Resources + Company render single-line.
8. The Audience panel uses heavy mega-menu chrome around two thin links.
9. No hover-intent delay / safe-triangle — diagonal cursor moves between trigger and panel can dismiss the menu prematurely.
10. The header is transparent above the fold; opening a mega menu while at the top of a hero produces no visual separation.
11. Resources is a static link list. It does not surface any of the CMS-driven content (latest blogs, next event) — wasted real estate for a content-marketing-led site.

The goal of this redesign is to fix all eleven and lift the navbar from "functional" to "best-in-class peer" — visually competitive with Stripe, Wiz, and Chainguard while keeping the IA stable.

---

## 2. Goals and non-goals

### Goals
- A panel anatomy that's **consistent across all five mega triggers**: header strip · icon-led rows · featured tile · contextual CTA bar.
- A **live, real, deep-linked featured tile** for Products driven by the existing `images.cleanstart.com` API.
- **Editorial Resources panel** that pulls the latest 3 blogs and next upcoming event from Payload at build time with ISR.
- Mobile parity — the same icon system and contextual CTAs apply to the mobile sheet.
- Five **independently shippable phases** so we can stop after any phase and still have a better menu.
- Full accessibility: keyboard-navigable, ARIA-correct, `prefers-reduced-motion` respected.
- No regression in Lighthouse perf at /, /cleanstart-images, /blogs.

### Non-goals (deferred)
- **No IA restructure.** The six top-level triggers stay: Products · Solutions · Audience · Resources · Company · Partners. Renaming or merging is out of scope and needs marketing/CEO sign-off in a separate brainstorm.
- **No CMS schema changes.** Resources panel reads existing Payload collections (`blogs`, `events`) through the existing API clients. No new fields, no new collections.
- **No new design system primitives** in `packages/ui` for this work. Everything lives in `apps/web/src/components/nav/`.
- **No per-image landing pages** are built by this work — `images.cleanstart.com` already hosts them at `/images/<name>/details`. We deep-link to those.
- **No search bar in the navbar.** Add later if it earns its place; not part of this scope.

---

## 3. Decisions locked

| # | Decision | Value |
|---|----------|-------|
| D1 | Aesthetic direction | **Hybrid** — Chainguard/Linear restraint + Stripe/Wiz featured tile + Wiz/Datadog POV bar |
| D2 | Code-snippet rotation pattern | **Random-on-open** from the latest-N set |
| D3 | "Try it now" URL pattern | `https://images.cleanstart.com/images/<name>/details` |
| D4 | Latest-images pool size | `LATEST_IMAGES_POOL_SIZE = 8` (latest 8 by `publishedAt` / `updatedAt` fallback) |
| D5 | IA changes | None |
| D6 | Underlying primitive | Keep `@base-ui/react/navigation-menu` |
| D7 | Default value of `NavLeaf.built` | Flipped to `true` — explicit `built: false` to mark unbuilt |
| D8 | Resources panel data source | Existing Payload clients (`fetchLatestBlogs`, `getUpcomingEvents`); fall back to static content on empty/error |
| D9 | Phasing | 5 phases, each independently shippable to `development` |
| D10 | Branch | All work on `development`. Sync cycle (`development → main → farheen`) per repo CLAUDE.md after each phase. |

---

## 4. Aesthetic direction (hybrid)

Three influences, blended:

- **Chainguard / Linear** — restraint. Icon-led rows, not heavy gradient tiles. Monochrome glyphs at rest, gradient only on hover or active. Typography-forward.
- **Stripe / Wiz** — the featured tile. Soft gradient background, big headline, optional code snippet teaser, single radial-glow blob in a corner. The tile is the panel's "earned attention" zone.
- **Wiz / Datadog** — POV. The contextual CTA bar at the bottom carries a confident headline ("Stop patching. Replace the base." / "Not sure where to start?"), not a generic phrase.

Visual identity stays inside CleanStart's existing palette — deep purple `#471FC3`, cyan `#2cc1eb`, midnight `#151021`. Per-panel **glow accent color** varies so each panel feels distinct without breaking the system:

| Panel | Glow accent | Hex |
|-------|-------------|-----|
| Products | Cyan | `#2cc1eb` |
| Solutions | Green | `#6cffc2` |
| Audience | Purple | `#471FC3` |
| Resources | Cyan | `#2cc1eb` |
| Company | Magenta | `#ff8ab8` |

---

## 5. Information architecture (unchanged)

Top-level order, left → right:

1. **Products** — mega
2. **Solutions** — mega
3. **Audience** — mega (promoted from compact)
4. **Resources** — mega (editorial)
5. **Company** — mega (promoted from compact)
6. **Partners** — flat

`nav-config.ts` stays the single source of truth for both desktop and mobile.

---

## 6. Component architecture

### File layout (new + changed)

```
apps/web/src/components/nav/
├── Header.tsx                      (moved from sections/, becomes RSC; fetches images server-side)
├── DesktopNav.tsx                  (existing, refactored to pass per-panel props)
├── MobileNav.tsx                   (existing, gets icon system + contextual CTAs)
├── NavLink.tsx                     (existing, gets active-route awareness)
├── useScrolled.tsx                 (existing)
├── icons/                          (new) — single SVG sprite + map
│   ├── NavIcon.tsx                 (renders a glyph by id)
│   └── glyphs.ts                   (id → JSX path map)
├── panels/                         (new) — one file per panel
│   ├── PanelShell.tsx              (header strip, body grid, contextual CTA — shared chrome)
│   ├── PanelProducts.tsx           (client; takes `images` prop; rotates featured tile)
│   ├── PanelSolutions.tsx          (static)
│   ├── PanelAudience.tsx           (dual persona cards)
│   ├── PanelResources.tsx          (server; fetches blogs + events; falls back to static)
│   └── PanelCompany.tsx            (static + careers tile)
├── pieces/                         (new) — small shared building blocks
│   ├── PanelHeader.tsx             (eyebrow + tagline + right-aligned exit link)
│   ├── PanelRow.tsx                (44px icon + label + desc + arrow)
│   ├── FeaturedTile.tsx            (gradient bg, radial glow, slot pattern)
│   ├── ContextualCTA.tsx           (bottom bar)
│   └── PersonaCard.tsx             (Audience)
└── data/                           (new) — server-side fetchers used by panels
    ├── latest-images.ts            (sort + slice the existing community-images API)
    └── resources-feed.ts           (server-fetches latest blogs + next event)
```

### Why these boundaries

- **`panels/`** — one file per trigger. Each is responsible for *its content shape* only. Reuses `pieces/` for chrome.
- **`pieces/`** — pure presentational primitives. No data, no router awareness. Used in 2+ panels by definition.
- **`data/`** — server-side fetchers. Wrapped in `react.cache()` and tagged for Next Data Cache. No client imports.
- **`icons/`** — exactly one SVG sprite. New glyph = one entry in `glyphs.ts`, nothing else.

### Existing file fates

| File | Action |
|------|--------|
| `MegaMenu.tsx` | **Delete.** Replaced by `PanelShell.tsx` + per-panel files. |
| `DesktopNav.tsx` | Refactor — render the correct `Panel*` based on `item.label`. |
| `MobileNav.tsx` | Update — render `NavIcon` next to each label, render `ContextualCTA` per accordion section. |
| `nav-config.ts` | Update — see §7.3 for the schema delta. |
| `Header.tsx` | Move from `components/sections/` to `components/nav/`. Convert to RSC so it can fetch images. Pass them as props to the client `DesktopNav`. |
| `components/ui/navigation-menu.tsx` | Unchanged. |

---

## 7. Panel specifications

### 7.1 Common chrome (`PanelShell`)

Every panel renders inside `PanelShell`, which provides:

```
┌──────────────────────────────────────────────────┐
│  PanelHeader: eyebrow · tagline · exit link →    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Body slot (per-panel children)                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  ContextualCTA (optional)                         │
└──────────────────────────────────────────────────┘
```

**Locked dimensions:**

| Property | Value |
|----------|-------|
| Border radius | 20 px (matches existing `cs-mega-surface`) |
| Padding | 20 px all sides |
| Background | `radial-gradient(120% 70% at 0% 0%, <glow>, transparent 55%), linear-gradient(180deg, #1a1330, #120c25)` |
| Border | 1 px solid `rgba(255,255,255,0.08)` |
| Shadow | `0 24px 60px -20px rgba(0,0,0,0.6)` plus inset hairline |
| Header divider | 1 px bottom border on `PanelHeader`, `rgba(255,255,255,0.06)` |
| Open animation | Opacity 0→1 + scale 0.96→1 over 180 ms, `cubic-bezier(0.22, 1, 0.36, 1)` |

**Per-panel widths** (CSS width, not max-width):

| Panel | Width |
|-------|-------|
| Products | 760 px |
| Solutions | 760 px |
| Audience | 640 px |
| Resources | 880 px |
| Company | 760 px |

### 7.2 PanelRow (icon-led list item)

Used by Products, Solutions, Company.

| Property | Value |
|----------|-------|
| Grid | `44px 1fr auto`, 12 px gap |
| Padding | 12 px |
| Row height | ~68 px |
| Icon tile rest | 44 × 44 / 12 px radius / `rgba(255,255,255,0.04)` bg / 1 px hairline border |
| Icon tile hover | Gradient `linear-gradient(135deg, rgba(71,31,195,0.55), rgba(44,193,235,0.55))` + ambient cyan shadow |
| Icon glyph | 20 × 20 SVG, 1.6 px stroke, white at rest |
| Label | 14 px / 600 weight / line-height 1.2 |
| Description | 12 px / 400 / line-height 1.4 / `rgba(255,255,255,0.55)` |
| Trailing arrow | `→` at 16 px, `rgba(255,255,255,0.25)` rest, `#2cc1eb` hover, slides 2 px right on hover |
| Active-route | Same visual as hover (arrow does not slide) |
| Hover background | `rgba(255,255,255,0.05)` + 1 px `rgba(44,193,235,0.18)` border |

### 7.3 `nav-config.ts` schema delta

`NavLeaf` adds two fields and flips `built` default. `NavGroup` adds optional taglines per panel:

```ts
export type NavLeaf = {
  label: string;
  href: string;
  description?: string;
  /** Default true. Set false to mark unbuilt — renders as aria-disabled span. */
  built?: boolean;
  /** Glyph id from icons/glyphs.ts. Required for mega + compact items. */
  icon?: string;
};

export type NavMegaItem = {
  kind: "mega";
  label: string;
  tagline: string;           // NEW — required
  glow: "cyan" | "green" | "purple" | "magenta";  // NEW — required
  groups: NavGroup[];
  width?: number;
  /** Override exit-link href shown in PanelHeader's right corner. */
  exitHref?: string;
  exitLabel?: string;
};
```

Migration: `built: true` is added to all currently-built items in the same PR that flips the default. After the flip, the explicit `: true` is stripped — leaving only `built: false` on actually-unbuilt items.

### 7.4 PanelProducts (the live-data one)

**Data source:** existing `fetchCommunityImages()` in `lib/api/community-images.ts`. No new endpoints.

**Server flow** (`apps/web/src/components/nav/data/latest-images.ts`):

```ts
import { fetchCommunityImages, type CommunityImage } from '@/lib/api/community-images';

export const LATEST_IMAGES_POOL_SIZE = 8;

/** Returns the latest N valid images, sorted by publishedAt desc with updatedAt fallback. */
export async function fetchLatestImages(): Promise<CommunityImage[]> {
  const all = await fetchCommunityImages();
  if (all.length === 0) return [];
  return [...all]
    .sort((a, b) => {
      const ad = a.publishedAt ?? a.updatedAt ?? '';
      const bd = b.publishedAt ?? b.updatedAt ?? '';
      return bd.localeCompare(ad);
    })
    .slice(0, LATEST_IMAGES_POOL_SIZE);
}
```

**Routing constant** (`apps/web/src/components/nav/data/latest-images.ts`):

```ts
export const IMAGES_SUBDOMAIN_BASE = 'https://images.cleanstart.com/images';
export const imageDetailsHref = (name: string): string =>
  `${IMAGES_SUBDOMAIN_BASE}/${encodeURIComponent(name)}/details`;
```

Flip this single constant if production URL shape changes.

**Client flow** (`PanelProducts.tsx`):

```ts
'use client';
// Props: images: CommunityImage[] (already filtered + sliced server-side)
// On mount and on every open event from base-ui, pick a random index.
// Render code snippet: `$ docker pull cleanstart/<name>:<tag>` where tag = 'latest' for v1.
// CTA copy: `Try <name> →`
// CTA href: imageDetailsHref(name)
// Fallback if images.length === 0: static "Stop patching. Replace the base." tile pointing to /cleanstart-images.
```

**Why the pool exists:** the API returns the full catalog (could be 100+). We sort + slice to "latest 8" once per render so the client randomization stays bounded and the rotation feels curated, not noisy.

**Cache reuse:** `fetchCommunityImages()` is already wrapped in `react.cache()` + tagged Next Data Cache (10 min revalidate, tag `community-images`). The community page already invokes it. The header's call deduplicates within a render and shares the 10-min cache globally — zero new origin requests in steady state.

### 7.5 PanelSolutions

Static. Four `PanelRow`s:

| Icon | Label | Description |
|------|-------|-------------|
| `shield` | FIPS Compliance | FIPS 140-3 validated cryptography across your stack. |
| `gears` | Enhance SCA | Cut SCA noise with cleaner base images and signed SBOMs. |
| `refresh` | Vulnerability Remediation | Patch upstream once, ship hardened downstream everywhere. |
| `minimize` | Attack Surface Reduction | Distroless-style minimal images shrink your blast radius. |

Featured tile content: pill "FIPS 140-3" (green) · headline "FIPS, drop-in." · sub "Validated cryptography, no code change. Replace base images, inherit compliance." · code snippet `cleanstart/python-fips` · CTA "See FIPS stack →" → `/fips`.

Bottom CTA bar: "Need help mapping your compliance scope? Our solution engineers will walk it with you." / "Talk to SE" → `/book-a-demo?intent=se`.

### 7.6 PanelAudience

Replaces the compact menu. Two `PersonaCard`s in a 1fr/1fr grid.

| Card | Glow | Icon | Label | Description | Href |
|------|------|------|-------|-------------|------|
| Left | cyan→purple | tools | For Developers | Hardened base images, signed SBOMs, and zero workflow friction. | `/for-developers` |
| Right | green→cyan | hash | For CISO | Provable supply-chain integrity, audit-ready, and FIPS where you need it. | `/for-ciso` |

No featured tile, no bottom CTA bar.

### 7.7 PanelResources (editorial)

Widest panel at 880 px. 3-column grid `1.5fr 1fr 1fr`.

**Left column — Latest from the blog (3 entries):**
- Data source: existing `getBlogs({ limit: 3, sort: '-publishedAt' })` or equivalent in `lib/api/`.
- Each row: 64 × 48 cover thumb · category pill · title (2 lines max, ellipsis) · "X min read · Yd ago".
- Fallback: static 3-row list of headline articles defined in code.

**Center column — Don't miss (next event):**
- Data source: existing `getUpcomingEvents({ limit: 1 })` from `CommunitySections` pattern.
- Card: type pill (`Webinar` / `In-person`) · title · date+time · location/duration · 2-line description · "Save your seat →" CTA.
- Fallback: static "Subscribe to be notified" tile.

**Right column — Browse (static link list):**
- Knowledge Hub · Resource Center · Newsroom · Podcast · In-Person Events · Webinars.
- Each row 36 px tall, tiny leading icon at 60 % opacity.

**Bottom CTA bar:** "Subscribe to the CleanStart Bulletin — one email per month, new images, talks, advisories." / "Subscribe" → `/subscribe` (or whatever the existing newsletter endpoint is).

### 7.8 PanelCompany

Static. Five `PanelRow`s (About Us, Teams, Community, Careers, Contact Us).

Featured tile: "We're hiring" pill (magenta) · headline "Build the base layer with us." · sub · team-avatar stack (4 overlapping circles) · "42 open roles" caption · CTA "See careers →" → `/careers`.

Avatar count is hand-coded in v1. A follow-up can wire it to a Payload count on the `careers` collection — out of scope here.

No bottom CTA bar (the featured tile covers the role).

### 7.9 Partners

Flat link — unchanged. Just inherits the `cs-nav-link` active-route polish from D7.

---

## 8. Bug fixes (audit items, mapped)

| # | Audit issue | Fix location |
|---|-------------|--------------|
| 1 | No icons | `icons/NavIcon.tsx` + `glyphs.ts` + `PanelRow` |
| 2 | Generic repeated CTA | `ContextualCTA` rendered with per-panel copy in each `Panel*` |
| 3 | No active-route state | New `useIsActiveSection(hrefs[]): boolean` hook in `nav/useIsActiveSection.ts`, consumed by `DesktopNav` triggers; sets `data-active` |
| 4 | `built: true` default-false | `nav-config.ts` schema flip + migration in same PR |
| 5 | Unbuilt span has cursor:pointer, no aria | `PanelRow` renders unbuilt as `<span role="link" aria-disabled="true" tabIndex={-1}>` with `cursor: default` |
| 6 | Hardcoded widths jump panel-to-panel | Per-panel explicit `width` in spec table §7.1 |
| 7 | Description density inconsistency | All `PanelRow`s render description (every leaf in `nav-config.ts` gains a 12-px desc; spec deltas above) |
| 8 | Audience compact = wasted chrome | Replaced by 2-card `PanelAudience` |
| 9 | No hover intent | base-ui `delay` props on `NavigationMenu.Root`: `delay={120}`, `closeDelay={200}` |
| 10 | Header transparent above the fold | `Header.tsx`: add backdrop-blur even when not scrolled; scrolled state strengthens it |
| 11 | Resources is static | `PanelResources` pulls live CMS data |

---

## 9. Accessibility

- All `Panel*` components render inside `NavigationMenuContent`, inheriting base-ui's keyboard + ARIA semantics.
- `PanelRow` for unbuilt items: `<span role="link" aria-disabled="true" tabIndex={-1}>`, no cursor change.
- `FeaturedTile` is one large `<a>` — single tab stop.
- `ContextualCTA` button has `aria-label` derived from its headline.
- `PanelHeader` exit link has `aria-label="Browse all <panel>"`.
- Focus-visible ring uses the existing `#33BAEC` from `navigationMenuTriggerStyle`.
- Esc closes the open panel (base-ui default — verify in QA).
- Down-arrow from trigger drops focus into the first `PanelRow` (base-ui default — verify in QA).
- The whole featured tile is the link — no nested interactive elements.

---

## 10. Motion and reduced-motion

| Behavior | Default | `prefers-reduced-motion: reduce` |
|----------|---------|----------------------------------|
| Panel open (fade + scale) | 180 ms | Instant (no scale, no fade) |
| Row hover (border + lift) | 150 ms color/transform | Color only, no transform |
| Arrow translate on row hover | 200 ms `transform: translateX(2px)` | No translate |
| Featured-tile glow pulse | None in v1 | n/a |
| Panel cross-fade between triggers | Phase 5 only | Phase 5 fallback = instant |
| Code-snippet typewriter (Phase 5) | 600 ms typing | Static — no animation, no re-render churn |

All motion uses `transform` + `opacity` only — no layout-triggering properties. GPU-only.

---

## 11. Responsive behavior

- **`lg+` (≥ 1024 px):** Desktop mega panels render as specified.
- **`<lg` (< 1024 px):** `DesktopNav` is hidden, `MobileNav` (sheet + accordion) takes over.
- **Mobile sheet:** Each accordion gains the icon system (24 × 24 next to label) and a contextual CTA pinned at the bottom of each open section, mirroring the desktop bottom bar but full-width.
- **Audience on mobile:** Renders as two stacked persona cards inside its accordion, same gradient treatment.
- **Resources on mobile:** Stacks the 3 columns into a single column — latest blogs first, next event second, browse links third. Bottom CTA bar pinned.
- **Featured tile on mobile (Products):** Static fallback. No code-snippet rotation on mobile — too tight visually and `<details>` motion is jarring on touch.
- **Mobile dead-link span:** Hidden entirely (`display: none` for items where `built === false`). Touch targets shouldn't be ghosts.
- **Mobile drawer swipe-down hint:** Subtle 4 px tall handle bar at the top of the sheet (Phase 4).

---

## 12. Phasing

Each phase is independently mergeable. After each: lint ✓ · typecheck ✓ · build ✓ · push to `development` · then sync to `main` and `farheen` per repo CLAUDE.md.

### Phase 1 — Foundation + bug fixes (2–3 days)
- Flip `NavLeaf.built` default to `true` in `nav-config.ts`; migrate all entries.
- Add `useIsActiveSection` hook; wire active state on `DesktopNav` triggers.
- Add `delay={120} closeDelay={200}` to `NavigationMenu.Root` (hover intent).
- Promote `Header` from `sections/` to `nav/`; add backdrop-blur even when not scrolled; convert to RSC.
- Replace `<span>` unbuilt items with `aria-disabled` markup.
- Hide unbuilt items entirely on mobile.
- No new component, no new visual surface.

### Phase 2 — Icon system + panel rewrite (3–4 days)
- Build `icons/NavIcon.tsx` + `glyphs.ts` sprite with the 14 needed glyphs.
- Build `pieces/` (PanelHeader, PanelRow, FeaturedTile, ContextualCTA, PersonaCard).
- Build `panels/PanelShell.tsx`, `PanelProducts.tsx` (static fallback only, no API yet), `PanelSolutions.tsx`, `PanelAudience.tsx`, `PanelCompany.tsx`.
- Delete the old `MegaMenu.tsx`. Wire `DesktopNav` to the new shells.
- Mobile: copy the icon system into MobileNav (no editorial yet).

### Phase 3 — Live data: Products images + Resources editorial (4–5 days)
- Build `data/latest-images.ts` (sort + slice).
- Convert `Header.tsx` to fetch images server-side; pass to `DesktopNav` → `PanelProducts`.
- Wire the random-on-open rotation + deep link on `PanelProducts`.
- Build `data/resources-feed.ts` (blogs + next event).
- Build `panels/PanelResources.tsx` with fallbacks.
- Verify the existing `community-images` cache tag invalidates the menu (manual test: publish image → call `revalidateTag` → menu picks up).

### Phase 4 — Mobile parity (2 days)
- Mirror icon system + contextual CTAs into MobileNav (full pass).
- Editorial Resources stacked layout on mobile.
- Swipe-down handle on the sheet top.
- Audit touch targets on a real device (≥ 44 px).

### Phase 5 — Motion + delight (1–2 days)
- Cross-fade between triggers (single-popup pattern via base-ui's existing content slot — verify it doesn't already do this).
- Animated gradient sweep on the featured tile (~6 s GPU loop, fades on hover-out).
- Code-snippet typewriter cycle on `PanelProducts` (replaces random-on-open; pool stays the same).
- Micro-icon hover scale (200 ms, 1 → 1.05).
- `prefers-reduced-motion` audit — every animation has a clean fallback.

---

## 13. Acceptance criteria (per phase)

Per repo CLAUDE.md mandatory pre-completion checks (`apps/web` scope):

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

All three pass before any phase merges.

In addition, per phase:

- **Phase 1:** No visible change (intentional). All routes still resolve. Active-route state demonstrably appears on `/cleansight`, `/fips`, `/blogs`. Mobile no longer shows dead-link items.
- **Phase 2:** Visual diff PR with Claude Preview screenshots at 1440 × 900 for each of the 5 panels in rest and hover states. Keyboard-only walk-through video / GIF showing Tab/Shift-Tab/Esc/Down working.
- **Phase 3:** Manual test: hit `/api/revalidate?tag=community-images` (or equivalent); verify the menu rotation picks up new images on next open. With API offline (block in network panel), the static fallback renders, no console errors. Resources panel shows three real blog posts.
- **Phase 4:** Tested on a real device at 375 px and 768 px. All touch targets ≥ 44 px. Sheet swipe-down closes.
- **Phase 5:** With `prefers-reduced-motion: reduce` toggled in DevTools, every animation falls back cleanly.

Lighthouse perf at /, /cleanstart-images, /blogs must not regress more than 2 points vs baseline measured on the commit before Phase 1 lands.

---

## 14. Open questions / deferred

| Item | Decision deferred to |
|------|----------------------|
| Should the Audience panel ever fold into Solutions? | A separate IA brainstorm with marketing/CEO |
| Should Pricing / Docs join the top nav? | Product-roadmap-level decision, not nav-redesign decision |
| Should the featured Products tile show image OS/distro badges? | Possible Phase 3.5 enhancement once API exposes the field |
| Should we add a global navbar search? | Separate spec — defer at least one full release after this redesign ships |
| Should the careers "42 open roles" count be live from Payload? | Possible follow-up after careers collection schema firms up |
| Mobile featured-tile rotation (code snippet on touch)? | Defer — static fallback is good enough; revisit if user testing flags it |

---

## 15. File-by-file change inventory

| Path | Action | Phase |
|------|--------|-------|
| `apps/web/src/lib/nav-config.ts` | Schema delta + flip `built` default + add icons/taglines/glow | 1 |
| `apps/web/src/components/nav/Header.tsx` | Move from `sections/`; convert to RSC; add always-on backdrop-blur | 1 |
| `apps/web/src/components/sections/Header.tsx` | Delete (file moves) | 1 |
| `apps/web/src/components/nav/useIsActiveSection.ts` | New | 1 |
| `apps/web/src/components/nav/DesktopNav.tsx` | Refactor to render `Panel*` by label | 2 |
| `apps/web/src/components/nav/MegaMenu.tsx` | Delete | 2 |
| `apps/web/src/components/nav/icons/NavIcon.tsx` | New | 2 |
| `apps/web/src/components/nav/icons/glyphs.ts` | New | 2 |
| `apps/web/src/components/nav/pieces/PanelHeader.tsx` | New | 2 |
| `apps/web/src/components/nav/pieces/PanelRow.tsx` | New | 2 |
| `apps/web/src/components/nav/pieces/FeaturedTile.tsx` | New | 2 |
| `apps/web/src/components/nav/pieces/ContextualCTA.tsx` | New | 2 |
| `apps/web/src/components/nav/pieces/PersonaCard.tsx` | New | 2 |
| `apps/web/src/components/nav/panels/PanelShell.tsx` | New | 2 |
| `apps/web/src/components/nav/panels/PanelProducts.tsx` | New (static fallback only in P2; live data in P3) | 2/3 |
| `apps/web/src/components/nav/panels/PanelSolutions.tsx` | New | 2 |
| `apps/web/src/components/nav/panels/PanelAudience.tsx` | New | 2 |
| `apps/web/src/components/nav/panels/PanelResources.tsx` | New (static fallback in P2; live in P3) | 2/3 |
| `apps/web/src/components/nav/panels/PanelCompany.tsx` | New | 2 |
| `apps/web/src/components/nav/data/latest-images.ts` | New | 3 |
| `apps/web/src/components/nav/data/resources-feed.ts` | New | 3 |
| `apps/web/src/components/nav/MobileNav.tsx` | Add NavIcon + ContextualCTA + hide unbuilt | 2/4 |
| `apps/web/src/components/nav/NavLink.tsx` | Active-route polish | 1 |

---

## 16. Out of scope / will not touch

- Anything in `apps/cms/`.
- Anything in `packages/ui/` (no new shared primitives for this work).
- The Payload CMS schema (`apps/cms/payload-types.ts`).
- `cleanstart-logo.svg` and any logo treatment.
- `globals.css` and the typography system (`apps/web/docs/TYPOGRAPHY-SYSTEM.md`) — the redesign consumes existing tokens; it does not add new ones.
- The `cs-btn-glass` button — featured tile and contextual CTA buttons reuse existing button styles where they fit; no new variants.

---

## 17. Definition of done (for the whole spec)

- All 5 phases shipped to `main`, then synced to `farheen` (web-only branch).
- Visual regression diff at 1440 × 900 for each panel attached to each phase's PR.
- Lighthouse perf check on three pages — no regression beyond noise.
- Manual a11y walkthrough recorded once at the end (after Phase 5).
- A dogfood pass — open every panel, open the mobile sheet, tab through, on three devices (desktop 1440, tablet 768, phone 375).
- This spec marked **Closed** with the final commit SHA pinned at the top.
