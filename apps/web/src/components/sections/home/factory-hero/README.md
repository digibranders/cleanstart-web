# FactoryHero

3D pipeline hero animation for the home page. See
`docs/superpowers/specs/2026-05-28-home-hero-animation-design.md` for the design spec.

## Module boundaries

- `FactoryHero.tsx` — only file imported by `Hero.tsx`. Everything below is internal.
- `FactoryHero.poster.tsx` — LCP poster + fade coordinator.
- `FactoryScene.tsx` — R3F `<Canvas>` and scene composition.
- `components/` — atomic 3D primitives (Chamber, Cube, Agent, ConduitRail, FloorGrid).
- `components/data-viz/` — per-chamber visualization components.
- `hooks/` — React hooks (useLoopPhase, useReducedMotion, useViewportMode).
- `lib/` — pure logic (timeline.ts, logoPool.ts, geometry.ts, materials.ts).
- `assets/` — local binaries (poster JPG).

External assets reused (do not duplicate):
- `apps/web/public/images/hero-tech-logos/*.svg` — 10 curated logos for cube faces.

## Rules
- No imports from `@payloadcms/ui` or any CMS-side package.
- Presentational components read phase from `useLoopPhase`; they never own state.
- `timeline.ts` is the only file that knows the 10s beat map.
