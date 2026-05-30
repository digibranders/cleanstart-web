# Home hero animation — design spec

- **Date:** 2026-05-28
- **Status:** Draft, pending stakeholder review
- **Owner:** `apps/web` (`development` branch)
- **Replaces:** the current `HeroOrb` (hidden via `visibility: hidden` in [Hero.tsx:40](apps/web/src/components/sections/home/Hero.tsx))
- **Scope:** the home page hero only. No other pages, no nav, no Footer.

This spec documents every decision made during the 2026-05-28 brainstorm so the build phase can run from a single artifact. The implementation plan (next document) breaks this into delivery tasks.

---

## 1 · Summary

A new home-page hero centred on the company's own "Factory" metaphor: vulnerable upstream artifacts enter a 4-chamber pipeline, are transformed in place, and exit signed and verified. The animation runs continuously with two artifacts in flight at all times, so the pipeline reads as "always working." H1 and CTA stack at the top centre of the hero; the pipeline takes the lower ~55%. Aesthetic is a brand-tinted cyberpunk hybrid — neon outlines on the existing brand palette, CRT grid floor, sharp corners and corner ticks, glitch-flicker on chamber labels. Inside each chamber, 3 small lavender "agents" act as a recurring background cast while cyan data visualization (dep graph in CH2, build lattice in CH3, hash + ticker tape in CH4) carries the focus.

**Locked decisions** *(from the brainstorm — see `.superpowers/brainstorm/18268-1779950287/` for the visual rounds)*:

| Decision | Value |
|---|---|
| Concept | **A** — Hermetic Chamber Pipeline (4 chambers, horizontal) |
| Composition | **L3-modified** — H1 + CTA stacked top centre; animated pipeline takes lower ~55% |
| Loop length | **10 s**, linear timing |
| Cube cadence | **2 cubes in flight**, 5 s offset — pipeline never empty |
| Aesthetic | **Brand-tinted cyberpunk hybrid** — navy/purple base, brand cyan + lavender neon, CRT grid, sharp corners, glitch-flicker |
| Chamber-interior detail | **D4 Hybrid** — agents (lavender, peripheral, secondary) **+** data viz (cyan, central, primary) |
| Build technology | React Three Fiber (R3F) — heavy 3D allowed, no "vibecoded" particle confetti |

---

## 2 · Goals & non-goals

### Goals

1. Communicate **what CleanStart does** in the first viewport — vulnerable input is transformed into hardened, signed output via a 4-stage pipeline.
2. Use the company's own factory vocabulary visibly: `INTAKE`, `AI LOGIC ENGINE`, `CLEANCOMPILE`, `ATTEST · HANDOFF`.
3. Make the hero feel like *engineering infrastructure on screen*, not a marketing render — closer to Nvidia GTC / Apple chip-cutaway than Spline starter template.
4. Be performant enough that LCP doesn't degrade and mobile users get a sensible fallback.
5. Be accessible — reduced-motion + screen-reader semantics built in, not retrofitted.

### Non-goals

- Restyling the page below the fold. The pipeline ends at the hero — `TrustedByMarquee` and `CleanStartFactory` sections continue as-is.
- Changing navigation, header, or footer.
- Building a configurable / themable hero. This is one bespoke scene, not a CMS-driven block.
- Hand-modelling unique geometry per chamber — chambers share one base mesh with material/light variations.
- Rendering live data (no real CVE feed, no live SBOM API). All data shown is plausible static content.

---

## 3 · Visual design

### 3.1 Composition

Hero occupies the viewport from below the global nav down to the start of `TrustedByMarquee`. At desktop 1440px (the dev-target width per [CLAUDE.md](CLAUDE.md)):

```
┌────────────────────────────────────────────────────────────────┐
│  global nav (existing, unchanged)                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│         Secure by Design. Built from Source.                   │
│         Verified Container Images                              │ ← H1 (existing copy)
│                                                                │
│              [  Browse Images →  ]                             │ ← CTA (existing)
│                                                                │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────┐              │
│  │   01   │  │   02   │  │    03    │  │   04   │              │ ← 4 chambers, neon outlined
│  │ INTAKE │  │ AI_LOG │  │ CLEAN... │  │ ATTEST │              │
│  │  ◇━━━━━│━━│        │━━│          │━━│        │              │ ← artifact cube in transit
│  └────────┘  └────────┘  └──────────┘  └────────┘              │
│  · · · · CRT grid floor · · · · · · · · · · · · · · · · ·     │
└────────────────────────────────────────────────────────────────┘
                                            ↓ TrustedByMarquee
```

- **Top ~25–30%:** H1 + CTA, centered. Uses `var(--fs-display)` for the H1 per [TYPOGRAPHY-SYSTEM.md](apps/web/docs/TYPOGRAPHY-SYSTEM.md) — **do not re-clamp**.
- **Lower ~55%:** the pipeline. Chambers sit on an implied floor (CRT grid). The conduit line that connects them runs through the chamber midline.
- **Bottom margin:** ~64 px before `TrustedByMarquee`.

### 3.2 Aesthetic system

#### Palette (extends existing brand tokens; introduces no new top-level brand colors)

| Token | Hex | Use |
|---|---|---|
| `--hero-bg-from` | `#060512` | Hero gradient top |
| `--hero-bg-mid` | `#0d0a1f` | Hero gradient mid (existing navy zone) |
| `--hero-bg-deep` | `#15103a` | Hero gradient deep (purple transition) |
| `--hero-bg-low` | `#1d1854` | Hero gradient bottom (existing brand purple) |
| `--neon-primary` | `#2cc1eb` | Brand cyan — chamber outlines, primary data viz, glow color |
| `--neon-secondary` | `#dab6f3` | Lavender — agents, scan blade, stamp, secondary accents |
| `--cve-warn` | `#ff4d6d` | CVE decal colour (only on dirty cubes + un-remediated nodes) |
| `--cube-dirty-from` | `#2a1a4d` | Dirty artifact body gradient start |
| `--cube-dirty-to` | `#0d0a1f` | Dirty artifact body gradient end |
| `--cube-clean-from` | `#dab6f3` | Clean artifact gradient start |
| `--cube-clean-to` | `#2cc1eb` | Clean artifact gradient end |

All seven brand-aligned tokens; nothing introduces a new top-level brand colour. Re-uses existing `--neon-primary` from `globals.css` if already present; otherwise added under `:root` in the hero's scoped stylesheet.

#### Typography

- H1 / CTA use existing role tokens from [TYPOGRAPHY-SYSTEM.md](apps/web/docs/TYPOGRAPHY-SYSTEM.md): H1 → `var(--fs-display)`, CTA → `var(--fs-button-lg)`. **No inline `clamp(...)` per CLAUDE.md.**
- In-scene text (chamber labels like `[ 01 · INTAKE ]`, hash glyphs like `7f3a2c`, node labels like `openssl`) renders inside the R3F canvas using a single embedded variable monospace font subset. Targets `~6–10 px` rasterised size. Letter-spacing `0.12em–0.2em`.

#### Materials & lighting

- **Chamber walls:** brushed-metal `MeshPhysicalMaterial` with low metalness (`0.2`), high roughness (`0.85`), tinted with a very low-alpha base (`#0d0a1f` at 60 % opacity). Edges are a thin extruded `LineSegments` with `--neon-primary` and `MeshBasicMaterial` (unlit) for crisp glow.
- **Corner ticks:** four short L-shaped neon lines at each chamber corner. Same cyan glow material. Reinforces the cyberpunk language.
- **Conduit rail:** a single dashed line at the chamber midline running the full pipeline length. `LineDashedMaterial`, brand-cyan, dash pattern `[4, 8]`, low opacity.
- **Floor grid:** a flat `PlaneGeometry` at floor level with a procedural grid shader (60 px cells, cyan at `α 0.18`). Fades to transparent toward the horizon via `MeshBasicMaterial` w/ a custom shader.
- **Ambient:** single low-intensity ambient light (`#dab6f3` at `0.15`) for fill.
- **Per-chamber key:** each chamber has its own dim `PointLight` (`--neon-primary`, `intensity: 0.4`) that *pulses up* to `0.9` while its cube is inside (timed via the loop). This is what makes a chamber "light up."
- **Bloom:** selective bloom (post-processing pass) applied only to elements layered as `BloomLayer = 1` — chamber edges, corner ticks, cube glow ring, scan blade, signature seal. Body geometry is not bloomed. Keeps bloom from washing the scene out.

#### Glitch-flicker

Chamber labels (`[ 01 · INTAKE ]` etc.) have a subtle CRT-flicker on the text alpha — 7-second loop, drops to `0.3` for one frame, `0.6` for one frame, otherwise `1.0`. Cheap CSS-style animation; not synced to the cube loop.

### 3.3 The four chambers

Each chamber shares the same physical anatomy:

```
        [ NN · LABEL ]                  ← floating label, glitch-flicker
       ┌──────────────┐
       │              │                 ← brushed-metal walls (low metalness)
       │              │                 ← neon-outlined edges
       │  •  (cube) • │                 ← interior reserved for cube + agents + data viz
       │              │
       └──────────────┘
        └─ corner ticks ─┘              ← short L-lines at each corner
```

Dimensions in scene units (1 unit ≈ 1 m for scale intuition):

| Chamber | Width | Height | Depth |
|---|---|---|---|
| 01 · Intake | 2.2 | 2.0 | 1.6 |
| 02 · AI Logic Engine | 2.2 | 2.0 | 1.6 |
| 03 · CleanCompile | 2.4 | 2.0 | 1.6 |
| 04 · Attest · Handoff | 2.2 | 2.0 | 1.6 |

Chamber 03 is widened slightly because the wireframe-rebuild moment needs more centre breathing room.

### 3.4 The artifact cube

A chamfered cube (faceted, beveled edges). Two material states:

- **Dirty (intake → mid-CH2):** dark `LinearGradient` `--cube-dirty-from` → `--cube-dirty-to`. Surface decal: 3 small `--cve-warn` circles + a tiny `CVE-2024-31` glyph orbiting on its face. Rotates slowly (1 rev / 10s).
- **Clean (post-CH3 → exit):** glassy `MeshPhysicalMaterial` with `transmission: 0.5`, slight iridescence (`iridescence: 0.3`), `--cube-clean-from` → `--cube-clean-to` gradient on the underlying albedo. Adds a subtle drop-shadow glow in `--neon-primary`. Same rotation.

Cube switches state during the CleanCompile dwell — see § 4.

### 3.5 The agents (D4 Hybrid)

Three small lavender characters present in *every* chamber simultaneously. They are the recurring cast.

- **Geometry:** simple rounded-box (`0.22 × 0.22 × 0.16` units) with a small antenna (`Cylinder` + capping `Sphere`).
- **Material:** unlit `--neon-secondary` with `transparent`, `opacity: 0.75`. Stroke / edge geometry adds a sharper outline (`opacity: 0.95`).
- **Position:** three fixed corner positions per chamber (top-left, top-right, bottom-centre). They never move *between* chambers — every chamber has its own three.
- **Behaviour per loop:** small drift (`±0.12` units) with `easeInOutSine` over the chamber's dwell window. When a cube is in their chamber, agents emit a single brief scan-flash line toward a data-viz node or toward the cube itself (depending on stage). Off-dwell, they idle.

**Why lavender + low opacity:** establishes the colour hierarchy — agents are secondary, data is primary. The eye should land on the cyan dep graph (the *what*), not on the lavender agents (the *who*). This is the key reason D4 reads cleanly rather than feeling cluttered.

### 3.6 Data viz layer (per chamber)

| Chamber | What appears (cyan, primary, foreground) | Trigger window in the 10s loop |
|---|---|---|
| 01 · Intake | A small floating "manifest card" materialises near the cube — 3 lines of `package@version` text, one tagged red. Fades on cube exit. | 0.5 s → 1.8 s |
| 02 · AI Logic Engine | 4-node dependency graph around the cube. Edges draw in. Two red nodes (`openssl`, `curl`) pulse, then flip to cyan. Nodes have monospace labels. | 2.3 s → 3.9 s |
| 03 · CleanCompile | Cube dematerialises into a wireframe build-lattice. Lattice grows layer-by-layer from bottom (3 layers, staggered 200 ms). Cube re-materialises clean. | 4.4 s → 5.9 s |
| 04 · Attest · Handoff | A signature seal stamps onto the cube's face. An SBOM "ticker tape" prints down from a small printer mounted on the chamber ceiling — 7 rows of micro-text, each row a hash fragment. | 6.5 s → 8.0 s |

All data-viz elements use `--neon-primary` for primary content and `--neon-secondary` for accents. CVE-warn red only ever appears as *the problem* (not as the cyberpunk-pink accent it was in the rejected pure-cyberpunk pass).

---

## 4 · Animation system

### 4.1 The 10-second loop (single cube)

| Time | Stage | Cube state | Chamber light | Agent activity | Data viz |
|---|---|---|---|---|---|
| 0.0 s | enters at `x = -1.0` | dirty, slow rotate | — | idle | — |
| 0.8 s | enters CH1 | dirty | CH1 pulses up | CH1 agents drift, scan-flash | manifest card fades in |
| 2.2 s | exits CH1 → CH2 | dirty | CH1 down | — | manifest card fades out |
| 2.3 s | enters CH2 | dirty | CH2 pulses up | CH2 agents scan-flash to dep-graph nodes | dep graph draws in |
| 3.0 s | mid-CH2 | dirty | CH2 up | agents pulse | dep-graph nodes start flipping red → cyan |
| 3.9 s | exits CH2 → CH3 | dirty | CH2 down | — | dep graph fades |
| 4.0 s | enters CH3 | dirty | CH3 pulses up | CH3 agents synchronise to build phases | — |
| 4.4 s | begins CleanCompile | dematerialising | CH3 cyan-wash on | agents pulse with build layers | wireframe lattice starts |
| 5.4 s | mid CleanCompile | wireframe | CH3 peak | — | lattice fully scaffolded |
| 5.9 s | rematerialised | clean (glass) | CH3 wash off | — | — |
| 6.2 s | exits CH3 → CH4 | clean | CH3 down | — | — |
| 6.5 s | enters CH4 | clean | CH4 pulses up | CH4 agents operate stamp & printer | — |
| 7.0 s | inside CH4 | clean | CH4 up | — | stamp descends and seals cube; SBOM tape begins printing |
| 8.0 s | exits CH4 | clean + sealed | CH4 down | — | SBOM tape fades |
| 9.5 s | exits scene at `x = +1.0` | — | — | — | — |
| 10.0 s | loop restart | new dirty cube spawns at `x = -1.0` | — | — | — |

All easing is `linear` for the cube travel (constant velocity = "factory rhythm"); chamber lights and data viz use `easeInOutQuad` over their windows. Camera is **completely static** for v1 — no dolly, no parallax. Adds simplicity, keeps focus on the pipeline.

### 4.2 Two-cube cadence

A second cube runs the same loop offset by **5.0 s** (configured via `animation-delay`, or in R3F via `useFrame` with a phase parameter). At any given moment, two cubes are in flight at different stages — for example, while cube A is being attested in CH4, cube B is just entering CH1. Pipeline always reads as "loaded."

Edge case: cube spawn / despawn happens off-screen (at `x = ±1.0` units, outside the visible 1440 px frame).

### 4.3 Reduced motion

When `(prefers-reduced-motion: reduce)` matches:

- **Cubes:** spawn statically — one cube parked in CH2 (the "thinking" chamber), one cube parked in CH4 (the "shipped" chamber). No travel motion.
- **Chamber lights:** static at their pulsed-up state for CH2 and CH4.
- **Agents:** static at their corner positions (no drift).
- **Data viz:** static at their "settled" state — dep graph fully drawn, nodes all cyan; SBOM tape printed at full length.
- **Glitch-flicker:** disabled.

This yields a still composition that still tells the story — viewer sees one un-remediated artifact mid-analysis and one shipped artifact mid-attestation.

### 4.4 LCP & loading strategy

The hero is the LCP element. The 3D scene must not block paint.

1. **Static poster image** (`/images/hero/hero-poster.jpg`, JPEG, ~80 KB) loads with `priority` and is positioned absolutely behind the 3D scene. Renders the "settled" reduced-motion state — viewer sees the full pipeline immediately.
2. **R3F scene mounts** after hydration, fades in over 400 ms via opacity transition, then takes over the visual layer. Poster fades out simultaneously.
3. **Asset preloading:** glTF chamber mesh (`/models/hero-chamber.glb`, ~80 KB compressed) preloaded via `<link rel="preload" as="fetch">` in the route's `<head>`. Other assets (cube, agents) are inline-defined geometry — no fetch.

Target metrics:

- **LCP:** ≤ 2.0 s (poster sets it).
- **Time-to-3D-scene:** ≤ 800 ms after hydration.
- **Frame rate:** 60 fps on M-series macbooks; ≥ 30 fps on a 3-year-old mid-tier Android (Pixel 6a class).
- **Total scene weight (compressed, after gzip):** ≤ 220 KB additive vs. current hidden-orb hero.

---

## 5 · Responsive behaviour

### Desktop (≥ 1280 px)

The full hero as specced above. Pipeline spans `1280 px` interior width, chambers visible in full, agents at corners visible.

### Mid (768 px ≤ width < 1280 px)

- Pipeline scales down to ~`960 px` interior width; chambers proportionally smaller.
- Agents shrink and lose their antenna geometry (just the box).
- Floor grid cell size halves (`30 px`) so grid density stays consistent.

### Mobile (< 768 px)

- Pipeline reorients to a **vertical stack** of 4 chambers, top-to-bottom. Cubes travel vertically (top → bottom).
- **Agents drop** — too much density at this size. Data viz stays.
- Camera FOV narrows so each chamber fills the visible band.
- H1 + CTA stay above the pipeline.
- Loop slows to 14 s (each chamber dwell extends to ~3 s) since vertical scrolling means the user may engage longer per chamber.

### Mobile fallback if WebGL unavailable

Fall back to the static poster image with chamber labels overlaid. No animation. Hero remains legible.

---

## 6 · Component architecture

Lives under `apps/web/src/components/sections/home/`. New files only — `Hero.tsx` is updated to mount the new component.

```
apps/web/src/components/sections/home/
├── Hero.tsx                          (updated — mounts FactoryHero)
├── HeroOrb.tsx                       (removed — replaced)
└── factory-hero/
    ├── FactoryHero.tsx               (entry, handles SSR, poster, R3F mount)
    ├── FactoryHero.poster.tsx        (the LCP poster + fade-in coordinator)
    ├── FactoryScene.tsx              (R3F <Canvas> + scene composition)
    ├── components/
    │   ├── Chamber.tsx               (one chamber, parameterised by stage)
    │   ├── Cube.tsx                  (artifact cube, dirty + clean material variants)
    │   ├── Agent.tsx                 (single agent, lavender)
    │   ├── ConduitRail.tsx           (dashed line connecting chambers)
    │   ├── FloorGrid.tsx             (CRT grid plane)
    │   └── data-viz/
    │       ├── ManifestCard.tsx      (CH1)
    │       ├── DepGraph.tsx          (CH2)
    │       ├── BuildLattice.tsx      (CH3)
    │       └── SbomTicker.tsx        (CH4)
    ├── hooks/
    │   ├── useLoopPhase.ts           (returns 0..1 phase at 10s linear loop)
    │   ├── useReducedMotion.ts       (matches prefers-reduced-motion)
    │   └── useViewportMode.ts        (desktop / mid / mobile)
    ├── lib/
    │   ├── timeline.ts               (the per-cube state machine — single source for §4.1)
    │   ├── geometry.ts               (cube + agent shared geometry builders)
    │   └── materials.ts              (shared materials, BloomLayer setup)
    └── assets/
        ├── hero-chamber.glb          (single shared chamber mesh)
        └── hero-poster.jpg           (LCP poster)
```

**Boundary rules:**

- `FactoryHero.tsx` is the only component imported by `Hero.tsx`. Everything else is internal.
- All scene components are presentational — they read phase from `useLoopPhase` and props, never own state.
- `timeline.ts` is the only file that knows the 10-second beat map. It exports a typed `CubePhase` type and a `getCubePhase(time, offset)` function. Changing the beat map = changing this file only.
- No imports from `@payloadcms/ui`, `@cleanstart/cms`, or `packages/types`. The hero is hardcoded content.

**Tech dependencies to add:**

- `three` (peer of R3F)
- `@react-three/fiber`
- `@react-three/drei` (for `Float`, `Text`, `useGLTF`, `Bloom`)
- `@react-three/postprocessing` (for selective bloom + a thin scanline pass)

Total dep weight after tree-shaking: ~120 KB gzipped. This is the load that the bundle budget in § 4.4 must absorb.

---

## 7 · Accessibility

- The hero is `role="img"` with `aria-label="CleanStart Factory pipeline: vulnerable container images enter on the left, pass through four hardening stages — Intake, AI Logic Engine, CleanCompile, Attest and Handoff — and exit verified on the right."`
- All in-scene text (chamber labels, node labels) is decorative — actual SR content is the `aria-label`.
- The H1 is a real `<h1>`, not painted into the canvas.
- The CTA is a real `<a>`, not a clickable canvas region.
- Reduced motion is respected per § 4.3.
- The fallback poster (when WebGL fails) carries the same `aria-label`.
- Keyboard focus order: nav → H1 (skipped, non-focusable) → CTA → first link in `TrustedByMarquee`.

---

## 8 · Acceptance criteria

1. The hero replaces the current `HeroOrb` with no regression to H1 / CTA copy, position, or interaction.
2. At desktop 1440 px, all four chambers render with neon outlines, glitch-flicker labels, two cubes in flight at the specified beats, and the data viz appears in each chamber on cue.
3. LCP ≤ 2.0 s on a Lighthouse desktop run from a cold cache.
4. Reduced-motion users see the static "settled" composition with no motion.
5. Mobile (375 px wide) shows the vertical stack with agents dropped and data viz intact.
6. WebGL-disabled browsers see the static poster.
7. `pnpm --filter @cleanstart/web lint` and `typecheck` pass.
8. `pnpm --filter @cleanstart/web build` passes.
9. Bundle delta for the home route ≤ 220 KB gzipped vs. baseline.
10. No imports added from `@payloadcms/ui` or other CMS-side packages.

---

## 9 · Open questions

1. **Should the four chamber labels be plain text, or use any of the existing design-system text components?** The current spec embeds them inside the canvas. If we want them outside the canvas (so SR can read them, or for editor i18n later), the chamber widths in § 3.3 need a small label gutter recalculation.
2. **Asset pipeline for `hero-chamber.glb`:** modelled in Blender by design team, or generated procedurally in code? Procedural keeps source in repo but limits silhouette tweakability. *Default decision: procedural for v1, glTF only if procedural silhouette doesn't match design intent in review.*
3. **Should we ship the agents as a reusable brand asset** beyond the hero (illustrations on product pages, in docs)? Spec assumes hero-only for v1. Reusing them would require a separate spec.
4. **Telemetry:** do we want a beacon for "user spent > 5 s on the hero" as a brand-engagement signal? Out of scope for this spec; can be added without changing the visual.

---

## 10 · References

- Brainstorm session: `.superpowers/brainstorm/18268-1779950287/` (visual rounds with all locked decisions)
- Existing hero being replaced: [Hero.tsx](apps/web/src/components/sections/home/Hero.tsx), [HeroOrb.tsx](apps/web/src/components/sections/home/HeroOrb.tsx)
- Typography contract: [apps/web/docs/TYPOGRAPHY-SYSTEM.md](apps/web/docs/TYPOGRAPHY-SYSTEM.md)
- Responsive contract: [apps/web/docs/RESPONSIVE-SYSTEM-AUDIT.md](apps/web/docs/RESPONSIVE-SYSTEM-AUDIT.md)
- Repo conventions: [CLAUDE.md](CLAUDE.md)
- Aesthetic anchors: Nvidia GTC chip-tour cinematics · Apple M-chip cutaway keynote moments · Foundry / Nuke industrial UI · Tron / NieR Automata (sharp-corner neon language)
