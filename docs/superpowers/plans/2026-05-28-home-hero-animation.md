# Home Hero Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hidden `HeroOrb` on the home page with a four-chamber Factory pipeline 3D hero (concept locked in [the design spec](../specs/2026-05-28-home-hero-animation-design.md)).

**Architecture:** React Three Fiber (R3F) scene mounted inside a new `FactoryHero` component under `apps/web/src/components/sections/home/factory-hero/`. Static JPEG poster is the LCP element; R3F scene fades in after hydration. Pure logic (timeline phase, logo round-robin) is testable Vitest; visual fidelity is verified via screenshots.

**Tech Stack:** Next.js 16 · React 19 · React Three Fiber · @react-three/drei · @react-three/postprocessing · Vitest · existing brand tokens (no new top-level brand colors).

**Branch:** `development` (per [CLAUDE.md](../../../CLAUDE.md) branching policy — no worktree for routine work).

**Pre-completion gates** (per [CLAUDE.md](../../../CLAUDE.md)):
- `pnpm --filter @cleanstart/web lint` ✓
- `pnpm --filter @cleanstart/web typecheck` ✓
- `pnpm --filter @cleanstart/web build` ✓
- `pnpm --filter @cleanstart/web test` ✓
- `pnpm --filter @cleanstart/web bundle:budget` ✓ (must show ≤ 220 KB delta on `/`)

**Forbidden** (per [CLAUDE.md](../../../CLAUDE.md) — hard rules):
- Touching `apps/cms/` or other CMS-side paths
- `git add -A` / `git add .` — stage exact paths
- `--no-verify` on commits
- Inline `text-[clamp(...)]` for H1 (use the existing `var(--fs-display)` token)
- Bulk formatter sweeps; only touch files this plan names
- Hardcoded `max-w-[1276px]` / `max-w-[1440px]` — use `<Container>`

---

## Phase 0 · Setup

### Task 0.1: Install Three.js + R3F dependencies

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install the four 3D deps as `dependencies`**

Run from repo root:
```bash
pnpm --filter @cleanstart/web add three@^0.171.0 @react-three/fiber@^9.0.0 @react-three/drei@^10.0.0 @react-three/postprocessing@^3.0.0
pnpm --filter @cleanstart/web add -D @types/three@^0.171.0
```

Expected: `package.json` updated, lockfile regenerated, no peer-dep warnings beyond expected React 19 notices.

- [ ] **Step 2: Verify build still passes**

Run:
```bash
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: both pass with no errors. If R3F throws React-19 peer warnings, that is acceptable for v9+.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add three.js + R3F deps for new home hero"
```

---

### Task 0.2: Create the new component folder skeleton

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/` (directory)
- Create: `apps/web/src/components/sections/home/factory-hero/README.md`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p apps/web/src/components/sections/home/factory-hero/components/data-viz
mkdir -p apps/web/src/components/sections/home/factory-hero/hooks
mkdir -p apps/web/src/components/sections/home/factory-hero/lib
mkdir -p apps/web/src/components/sections/home/factory-hero/assets
```

- [ ] **Step 2: Add a README with the architectural map**

Create `apps/web/src/components/sections/home/factory-hero/README.md`:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/README.md
git commit -m "feat(web): scaffold factory-hero folder structure"
```

---

## Phase 1 · Pure logic with tests

### Task 1.1: Timeline — `getCubePhase(time, offset)`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/lib/timeline.ts`
- Create: `apps/web/src/components/sections/home/factory-hero/lib/timeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/sections/home/factory-hero/lib/timeline.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { getCubePhase, type CubePhase } from './timeline';

describe('getCubePhase', () => {
  it('returns "spawning" before chamber 01 entry', () => {
    expect(getCubePhase(0.4, 0).stage).toBe('spawning');
  });

  it('returns "ch1" while inside chamber 01', () => {
    const p: CubePhase = getCubePhase(1.5, 0);
    expect(p.stage).toBe('ch1');
    expect(p.dwell).toBeGreaterThan(0);
    expect(p.dwell).toBeLessThanOrEqual(1);
  });

  it('returns "ch3-cleancompile" during the transformation window', () => {
    expect(getCubePhase(5.0, 0).stage).toBe('ch3-cleancompile');
  });

  it('returns "clean" material once past CleanCompile', () => {
    expect(getCubePhase(6.0, 0).material).toBe('clean');
    expect(getCubePhase(2.0, 0).material).toBe('dirty');
  });

  it('wraps the loop at exactly 10s', () => {
    expect(getCubePhase(10.0, 0)).toEqual(getCubePhase(0.0, 0));
    expect(getCubePhase(15.0, 0)).toEqual(getCubePhase(5.0, 0));
  });

  it('respects the 5s offset for the second cube', () => {
    // cube B at t=0 should be at the same phase as cube A at t=5
    expect(getCubePhase(0.0, 5.0).stage).toBe(getCubePhase(5.0, 0).stage);
  });

  it('x position is monotonically increasing across the loop', () => {
    const x0 = getCubePhase(0.5, 0).x;
    const x5 = getCubePhase(5.0, 0).x;
    const x9 = getCubePhase(9.5, 0).x;
    expect(x0).toBeLessThan(x5);
    expect(x5).toBeLessThan(x9);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run:
```bash
pnpm --filter @cleanstart/web test -- timeline
```

Expected: FAIL — `getCubePhase` not found.

- [ ] **Step 3: Implement `timeline.ts`**

Create `apps/web/src/components/sections/home/factory-hero/lib/timeline.ts`:

```typescript
/**
 * 10-second loop beat map for an artifact cube.
 * See docs/superpowers/specs/2026-05-28-home-hero-animation-design.md § 4.1.
 *
 * Single source of truth for cube motion + state. Change this file to change
 * the loop — no other file references the beat windows.
 */

export const LOOP_SECONDS = 10;

/** Travel range in scene units. Cube enters from -1.0, exits at +1.0. */
const X_START = -1.0;
const X_END = 1.0;

export type CubeStage =
  | 'spawning'        // 0.0–0.8s   approaching CH1
  | 'ch1'             // 0.8–2.2s   intake dwell
  | 'transit-12'      // 2.2–2.3s   leaving CH1, entering CH2
  | 'ch2'             // 2.3–3.9s   AI logic dwell
  | 'transit-23'      // 3.9–4.0s
  | 'ch3-enter'       // 4.0–4.4s
  | 'ch3-cleancompile' // 4.4–5.9s  the transformation window
  | 'ch3-exit'        // 5.9–6.2s
  | 'transit-34'      // 6.2–6.5s
  | 'ch4'             // 6.5–8.0s   attest dwell
  | 'exiting';        // 8.0–10.0s  glide out

export type CubeMaterial = 'dirty' | 'transforming' | 'clean';

export interface CubePhase {
  stage: CubeStage;
  /** 0..1 progress through the current stage. */
  dwell: number;
  /** Scene-units X position at this time. Linear interpolation across the loop. */
  x: number;
  material: CubeMaterial;
}

interface Window {
  stage: CubeStage;
  start: number;
  end: number;
  material: CubeMaterial;
}

const WINDOWS: Window[] = [
  { stage: 'spawning',         start: 0.0,  end: 0.8,  material: 'dirty' },
  { stage: 'ch1',              start: 0.8,  end: 2.2,  material: 'dirty' },
  { stage: 'transit-12',       start: 2.2,  end: 2.3,  material: 'dirty' },
  { stage: 'ch2',              start: 2.3,  end: 3.9,  material: 'dirty' },
  { stage: 'transit-23',       start: 3.9,  end: 4.0,  material: 'dirty' },
  { stage: 'ch3-enter',        start: 4.0,  end: 4.4,  material: 'dirty' },
  { stage: 'ch3-cleancompile', start: 4.4,  end: 5.9,  material: 'transforming' },
  { stage: 'ch3-exit',         start: 5.9,  end: 6.2,  material: 'clean' },
  { stage: 'transit-34',       start: 6.2,  end: 6.5,  material: 'clean' },
  { stage: 'ch4',              start: 6.5,  end: 8.0,  material: 'clean' },
  { stage: 'exiting',          start: 8.0,  end: 10.0, material: 'clean' },
];

/**
 * @param time absolute time in seconds (any positive value; will be modulo-wrapped to the 10s loop)
 * @param offset cube's phase offset (e.g. 5.0 for the second cube)
 */
export function getCubePhase(time: number, offset: number = 0): CubePhase {
  const t = ((time - offset) % LOOP_SECONDS + LOOP_SECONDS) % LOOP_SECONDS;
  const window = WINDOWS.find((w) => t >= w.start && t < w.end) ?? WINDOWS[WINDOWS.length - 1]!;
  const dwell = (t - window.start) / (window.end - window.start);
  const x = X_START + (X_END - X_START) * (t / LOOP_SECONDS);
  return { stage: window.stage, dwell, x, material: window.material };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run:
```bash
pnpm --filter @cleanstart/web test -- timeline
```

Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/lib/timeline.ts apps/web/src/components/sections/home/factory-hero/lib/timeline.test.ts
git commit -m "feat(web): add timeline phase logic for factory hero loop"
```

---

### Task 1.2: Logo pool — round-robin + CVE-summary lookup

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/lib/logoPool.ts`
- Create: `apps/web/src/components/sections/home/factory-hero/lib/logoPool.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/sections/home/factory-hero/lib/logoPool.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { getLogoForCube, getCveSummaryFor, LOGO_POOL } from './logoPool';

describe('logoPool', () => {
  it('exposes exactly the 10 curated logos', () => {
    expect(LOGO_POOL).toHaveLength(10);
    expect(LOGO_POOL).toContain('nginx');
    expect(LOGO_POOL).toContain('postgres');
  });

  it('round-robin is deterministic for a given seed', () => {
    expect(getLogoForCube(0)).toBe(getLogoForCube(0));
    expect(getLogoForCube(0)).not.toBe(getLogoForCube(1));
  });

  it('round-robin wraps the pool', () => {
    expect(getLogoForCube(0)).toBe(getLogoForCube(LOGO_POOL.length));
  });

  it('every logo in the pool has a CVE summary', () => {
    for (const slug of LOGO_POOL) {
      const summary = getCveSummaryFor(slug);
      expect(summary.cveCount).toBeGreaterThan(0);
      expect(summary.version).toMatch(/^v\d/);
      expect(summary.depCount).toBeGreaterThan(0);
    }
  });

  it('returns a stable fallback for unknown slugs (should never happen)', () => {
    const s = getCveSummaryFor('this-does-not-exist' as never);
    expect(s.cveCount).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm --filter @cleanstart/web test -- logoPool
```

Expected: FAIL — exports not found.

- [ ] **Step 3: Implement `logoPool.ts`**

Create `apps/web/src/components/sections/home/factory-hero/lib/logoPool.ts`:

```typescript
/**
 * Curated logo pool for the factory hero. Sourced from
 * apps/web/public/images/hero-tech-logos/. Re-use only — do not add new logos
 * for v1 (see spec § 3.4.1).
 */

export const LOGO_POOL = [
  'nginx',
  'postgres',
  'redis',
  'python',
  'node',
  'mongodb',
  'kafka',
  'mysql',
  'prometheus',
  'grafana',
] as const;

export type LogoSlug = (typeof LOGO_POOL)[number];

export interface CveSummary {
  cveCount: number;
  version: string;
  depCount: number;
}

const CVE_SUMMARIES: Record<LogoSlug, CveSummary> = {
  nginx:      { cveCount: 4,  version: 'v1.18.0',  depCount: 87  },
  postgres:   { cveCount: 3,  version: 'v14.2',    depCount: 247 },
  redis:      { cveCount: 2,  version: 'v6.0.16',  depCount: 54  },
  python:     { cveCount: 7,  version: 'v3.10.4',  depCount: 312 },
  node:       { cveCount: 9,  version: 'v18.12.0', depCount: 421 },
  mongodb:    { cveCount: 5,  version: 'v5.0.9',   depCount: 198 },
  kafka:      { cveCount: 4,  version: 'v3.2.0',   depCount: 156 },
  mysql:      { cveCount: 6,  version: 'v8.0.28',  depCount: 234 },
  prometheus: { cveCount: 2,  version: 'v2.36.0',  depCount: 91  },
  grafana:    { cveCount: 5,  version: 'v9.0.2',   depCount: 178 },
};

const FALLBACK: CveSummary = { cveCount: 3, version: 'v1.0.0', depCount: 100 };

/**
 * Returns the logo slug for cube number `n` (0-indexed) in round-robin order.
 * Deterministic — same n always returns same slug. Wraps at LOGO_POOL.length.
 */
export function getLogoForCube(n: number): LogoSlug {
  return LOGO_POOL[((n % LOGO_POOL.length) + LOGO_POOL.length) % LOGO_POOL.length]!;
}

export function getCveSummaryFor(slug: LogoSlug | string): CveSummary {
  return CVE_SUMMARIES[slug as LogoSlug] ?? FALLBACK;
}

export function getLogoAssetUrl(slug: LogoSlug): string {
  return `/images/hero-tech-logos/${slug}.svg`;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm --filter @cleanstart/web test -- logoPool
```

Expected: PASS, all 5 tests green.

- [ ] **Step 5: Verify all 10 SVG asset files exist on disk**

```bash
for slug in nginx postgres redis python node mongodb kafka mysql prometheus grafana; do
  test -f apps/web/public/images/hero-tech-logos/$slug.svg && echo "✓ $slug" || echo "✗ MISSING $slug"
done
```

Expected: 10 lines all `✓`. If any are missing, copy from the legacy hero-tech-logos pool that the hidden orb references (same path) — they should already be there per [HeroOrb.tsx:20-40](../../../apps/web/src/components/sections/home/HeroOrb.tsx).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/lib/logoPool.ts apps/web/src/components/sections/home/factory-hero/lib/logoPool.test.ts
git commit -m "feat(web): add logo pool + CVE summary table"
```

---

### Task 1.3: Geometry builders — cube + agent

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/lib/geometry.ts`
- Create: `apps/web/src/components/sections/home/factory-hero/lib/geometry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/sections/home/factory-hero/lib/geometry.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { BoxGeometry } from 'three';
import { buildCubeGeometry, buildAgentGeometry } from './geometry';

describe('geometry', () => {
  it('buildCubeGeometry returns a chamfered box with the spec dimensions', () => {
    const g = buildCubeGeometry();
    expect(g).toBeInstanceOf(BoxGeometry);
    // 0.6 unit cube per spec § 3.4
    const params = g.parameters;
    expect(params.width).toBeCloseTo(0.6, 2);
    expect(params.height).toBeCloseTo(0.6, 2);
    expect(params.depth).toBeCloseTo(0.6, 2);
  });

  it('buildAgentGeometry returns a small box at spec dimensions', () => {
    const g = buildAgentGeometry();
    expect(g.parameters.width).toBeCloseTo(0.22, 2);
    expect(g.parameters.height).toBeCloseTo(0.22, 2);
    expect(g.parameters.depth).toBeCloseTo(0.16, 2);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm --filter @cleanstart/web test -- geometry
```

Expected: FAIL — exports not found.

- [ ] **Step 3: Implement `geometry.ts`**

Create `apps/web/src/components/sections/home/factory-hero/lib/geometry.ts`:

```typescript
import { BoxGeometry } from 'three';

/**
 * The artifact cube. Spec § 3.4: chamfered cube, 0.6 units. We use a plain
 * BoxGeometry for v1; the chamfered edges come from the wireframe edge pass
 * mounted as a child <LineSegments> in Cube.tsx.
 */
export function buildCubeGeometry(): BoxGeometry {
  return new BoxGeometry(0.6, 0.6, 0.6);
}

/**
 * Agent body geometry. Spec § 3.5: small rounded-box at 0.22 × 0.22 × 0.16.
 */
export function buildAgentGeometry(): BoxGeometry {
  return new BoxGeometry(0.22, 0.22, 0.16);
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm --filter @cleanstart/web test -- geometry
```

Expected: PASS, both tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/lib/geometry.ts apps/web/src/components/sections/home/factory-hero/lib/geometry.test.ts
git commit -m "feat(web): add cube + agent geometry builders"
```

---

### Task 1.4: Materials — shared instances + BloomLayer constant

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/lib/materials.ts`

(No test — materials are thin factories; behavior is verified by visual review and by component tests that pass them in.)

- [ ] **Step 1: Implement `materials.ts`**

Create `apps/web/src/components/sections/home/factory-hero/lib/materials.ts`:

```typescript
import { Color, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';

/**
 * Bloom layer constant. Objects on this layer are processed by the selective
 * bloom pass in FactoryScene. Body geometry stays on layer 0 (default).
 */
export const BLOOM_LAYER = 1;

/** Brand palette tokens duplicated here as Three.js Colors. Mirrors spec § 3.2. */
export const COLORS = {
  neonPrimary:    new Color('#2cc1eb'),
  neonSecondary:  new Color('#dab6f3'),
  cveWarn:        new Color('#ff4d6d'),
  cubeDirtyFrom:  new Color('#2a1a4d'),
  cubeDirtyTo:    new Color('#0d0a1f'),
  cubeCleanFrom:  new Color('#dab6f3'),
  cubeCleanTo:    new Color('#2cc1eb'),
  chamberWall:    new Color('#0d0a1f'),
} as const;

export function makeChamberWallMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: COLORS.chamberWall,
    metalness: 0.2,
    roughness: 0.85,
    transparent: true,
    opacity: 0.6,
  });
}

export function makeChamberEdgeMaterial(): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: COLORS.neonPrimary });
  return m;
}

export function makeCubeDirtyMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: COLORS.cubeDirtyFrom,
    metalness: 0.4,
    roughness: 0.6,
  });
}

export function makeCubeCleanMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: COLORS.cubeCleanTo,
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.5,
    iridescence: 0.3,
    transparent: true,
  });
}

export function makeAgentMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: COLORS.neonSecondary,
    transparent: true,
    opacity: 0.75,
  });
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/lib/materials.ts
git commit -m "feat(web): add shared materials and BloomLayer constant"
```

---

## Phase 2 · Hooks with tests

### Task 2.1: `useReducedMotion` hook

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/hooks/useReducedMotion.ts`
- Create: `apps/web/src/components/sections/home/factory-hero/hooks/useReducedMotion.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('useReducedMotion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when prefers-reduced-motion: reduce matches', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when it does not match', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Verify `@testing-library/react` is present**

```bash
pnpm --filter @cleanstart/web list @testing-library/react
```

If missing, install:
```bash
pnpm --filter @cleanstart/web add -D @testing-library/react @testing-library/dom happy-dom
```

Also confirm `apps/web/vitest.config.ts` (or `vite.config.ts`) sets `environment: 'happy-dom'`. If not, add it now in a one-line edit.

- [ ] **Step 3: Run test, verify it fails**

```bash
pnpm --filter @cleanstart/web test -- useReducedMotion
```

Expected: FAIL — hook not found.

- [ ] **Step 4: Implement the hook**

Create `apps/web/src/components/sections/home/factory-hero/hooks/useReducedMotion.ts`:

```typescript
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

- [ ] **Step 5: Run test, verify it passes**

```bash
pnpm --filter @cleanstart/web test -- useReducedMotion
```

Expected: PASS, 2 tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/hooks/
git commit -m "feat(web): add useReducedMotion hook"
```

---

### Task 2.2: `useViewportMode` hook

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/hooks/useViewportMode.ts`
- Create: `apps/web/src/components/sections/home/factory-hero/hooks/useViewportMode.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewportMode } from './useViewportMode';

function setViewport(w: number): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, value: w });
  window.dispatchEvent(new Event('resize'));
}

describe('useViewportMode', () => {
  it('returns "desktop" at 1440px', () => {
    setViewport(1440);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('desktop');
  });

  it('returns "mid" at 1024px', () => {
    setViewport(1024);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('mid');
  });

  it('returns "mobile" at 375px', () => {
    setViewport(375);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('mobile');
  });

  it('updates when the viewport resizes', () => {
    setViewport(1440);
    const { result } = renderHook(() => useViewportMode());
    expect(result.current).toBe('desktop');
    act(() => setViewport(375));
    expect(result.current).toBe('mobile');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm --filter @cleanstart/web test -- useViewportMode
```

Expected: FAIL — hook not found.

- [ ] **Step 3: Implement the hook**

Create `apps/web/src/components/sections/home/factory-hero/hooks/useViewportMode.ts`:

```typescript
import { useEffect, useState } from 'react';

export type ViewportMode = 'desktop' | 'mid' | 'mobile';

function modeFor(width: number): ViewportMode {
  if (width >= 1280) return 'desktop';
  if (width >= 768) return 'mid';
  return 'mobile';
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return modeFor(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (): void => setMode(modeFor(window.innerWidth));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return mode;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm --filter @cleanstart/web test -- useViewportMode
```

Expected: PASS, 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/hooks/useViewportMode.ts apps/web/src/components/sections/home/factory-hero/hooks/useViewportMode.test.ts
git commit -m "feat(web): add useViewportMode hook"
```

---

### Task 2.3: `useLoopPhase` hook (R3F frame loop)

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/hooks/useLoopPhase.ts`

(No unit test — this hook calls `useFrame` from `@react-three/fiber` which requires a Canvas context. Verified via component tests later.)

- [ ] **Step 1: Implement**

Create `apps/web/src/components/sections/home/factory-hero/hooks/useLoopPhase.ts`:

```typescript
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { getCubePhase, LOOP_SECONDS, type CubePhase } from '../lib/timeline';

/**
 * Tracks elapsed time at 60fps inside an R3F scene and returns a ref to the
 * latest CubePhase for the given offset. Use a ref (not state) — we update
 * every frame and do not want re-renders.
 */
export function useLoopPhase(offset: number = 0): MutableRefObject<CubePhase> {
  const phaseRef = useRef<CubePhase>(getCubePhase(0, offset));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime % LOOP_SECONDS;
    phaseRef.current = getCubePhase(t, offset);
  });

  return phaseRef;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/hooks/useLoopPhase.ts
git commit -m "feat(web): add useLoopPhase hook (R3F frame-driven)"
```

---

## Phase 3 · Atomic 3D components

> **Note for the implementer:** From here through Phase 5, components are R3F primitives. Tests are minimal (renders without errors). Visual fidelity is verified by Phase 7 manual screenshots.

### Task 3.1: `Chamber.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/Chamber.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { type ReactNode } from 'react';
import { Text } from '@react-three/drei';
import {
  makeChamberEdgeMaterial,
  makeChamberWallMaterial,
  COLORS,
  BLOOM_LAYER,
} from '../lib/materials';

interface ChamberProps {
  /** Center position in scene units */
  position: [number, number, number];
  /** Width × Height × Depth in scene units */
  size: [number, number, number];
  /** e.g. "[ 01 · INTAKE ]" — rendered above the chamber */
  label: string;
  children?: ReactNode;
}

export function Chamber({ position, size, label, children }: ChamberProps): JSX.Element {
  const [w, h, d] = size;
  return (
    <group position={position}>
      {/* walls */}
      <mesh material={makeChamberWallMaterial()}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* neon edges (BloomLayer = 1 so the post pass picks them up) */}
      <lineSegments
        material={makeChamberEdgeMaterial()}
        onUpdate={(self) => self.layers.set(BLOOM_LAYER)}
      >
        <edgesGeometry args={[
          // re-using a temporary BoxGeometry for the edge extraction
          (() => {
            const { BoxGeometry } = require('three') as typeof import('three');
            return new BoxGeometry(w, h, d);
          })(),
        ]}/>
      </lineSegments>
      {/* label above the chamber */}
      <Text
        position={[0, h / 2 + 0.18, 0]}
        fontSize={0.11}
        color={COLORS.neonPrimary}
        letterSpacing={0.16}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {children}
    </group>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/components/Chamber.tsx
git commit -m "feat(web): add Chamber 3D component"
```

---

### Task 3.2: `CubeLogoPlane.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/CubeLogoPlane.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useRef } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Mesh, ShaderMaterial } from 'three';
import { type LogoSlug, getLogoAssetUrl } from '../lib/logoPool';
import type { CubeMaterial } from '../lib/timeline';
import { BLOOM_LAYER } from '../lib/materials';

interface Props {
  logo: LogoSlug;
  /** Drives the grayscale ↔ color crossfade. */
  materialState: CubeMaterial;
  /** 0..1 dwell within the current stage — used to ease the crossfade. */
  dwell: number;
}

/**
 * Billboarded logo plane mounted just in front of the cube. Always camera-facing.
 * Uses a small fragment shader to crossfade from grayscale (dirty) to color (clean).
 */
export function CubeLogoPlane({ logo, materialState, dwell }: Props): JSX.Element {
  const texture = useTexture(getLogoAssetUrl(logo));
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!materialRef.current) return;
    // Color amount: 0 = grayscale, 1 = full color.
    let color = 0;
    if (materialState === 'clean') color = 1;
    else if (materialState === 'transforming') color = Math.min(1, Math.max(0, dwell));
    materialRef.current.uniforms.uColor.value = color;
  });

  return (
    <Billboard>
      <mesh
        ref={meshRef}
        position={[0, 0, 0.32]}
        onUpdate={(m) => {
          if (materialState === 'clean') m.layers.enable(BLOOM_LAYER);
          else m.layers.disable(BLOOM_LAYER);
        }}
      >
        <planeGeometry args={[0.72, 0.72]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          uniforms={{
            uMap: { value: texture },
            uColor: { value: materialState === 'clean' ? 1 : 0 },
            uTint: { value: [0.353, 0.290, 0.471] }, // #5a4a78 normalized
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D uMap;
            uniform float uColor;
            uniform vec3 uTint;
            varying vec2 vUv;
            void main() {
              vec4 tex = texture2D(uMap, vUv);
              float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
              vec3 dirty = vec3(gray) * uTint;
              vec3 final = mix(dirty, tex.rgb, uColor);
              float alpha = tex.a * mix(0.75, 1.0, uColor);
              gl_FragColor = vec4(final, alpha);
            }
          `}
        />
      </mesh>
    </Billboard>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/CubeLogoPlane.tsx
git commit -m "feat(web): add CubeLogoPlane (billboarded logo with grayscale crossfade)"
```

---

### Task 3.3: `Cube.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/Cube.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useLoopPhase } from '../hooks/useLoopPhase';
import { type LogoSlug } from '../lib/logoPool';
import {
  makeCubeDirtyMaterial,
  makeCubeCleanMaterial,
  BLOOM_LAYER,
} from '../lib/materials';
import { CubeLogoPlane } from './CubeLogoPlane';

interface CubeProps {
  /** 0 for the first cube, 5 for the second cube (5s offset). */
  loopOffset: number;
  logo: LogoSlug;
  /** Y position of the rail (constant). */
  railY: number;
  /** X span of travel: cube interpolates from -span/2 to +span/2 across the loop. */
  xSpan: number;
}

export function Cube({ loopOffset, logo, railY, xSpan }: CubeProps): JSX.Element {
  const phaseRef = useLoopPhase(loopOffset);
  const groupRef = useRef<Mesh>(null);

  useFrame(() => {
    const p = phaseRef.current;
    if (!groupRef.current) return;
    // Map p.x (which is -1..+1) to actual scene X via xSpan.
    groupRef.current.position.x = p.x * (xSpan / 2);
    groupRef.current.position.y = railY;
    groupRef.current.rotation.y += 0.0035; // ~1 rev / 10s at 60fps
  });

  // Render BOTH materials and toggle visibility — avoids material-swap cost per frame.
  // (`transforming` state shows dirty under the wireframe rebuild; spec § 4.1)
  return (
    <group ref={groupRef}>
      <mesh material={makeCubeDirtyMaterial()}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <mesh
        material={makeCubeCleanMaterial()}
        visible={false}
        onUpdate={(m) => m.layers.enable(BLOOM_LAYER)}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <CubeLogoPlane logo={logo} materialState={phaseRef.current.material} dwell={phaseRef.current.dwell} />
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/Cube.tsx
git commit -m "feat(web): add Cube component with loop-phase driven motion"
```

---

### Task 3.4: `Agent.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/Agent.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { buildAgentGeometry } from '../lib/geometry';
import { makeAgentMaterial } from '../lib/materials';

interface AgentProps {
  /** Base corner position inside the chamber. */
  position: [number, number, number];
  /** Phase offset so the 3 agents don't all drift in lockstep. */
  driftSeed: number;
}

const DRIFT_AMOUNT = 0.12;

export function Agent({ position, driftSeed }: AgentProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime + driftSeed;
    meshRef.current.position.x = position[0] + Math.sin(t * 0.7) * DRIFT_AMOUNT;
    meshRef.current.position.y = position[1] + Math.cos(t * 0.5) * DRIFT_AMOUNT;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={buildAgentGeometry()}
      material={makeAgentMaterial()}
      position={position}
    />
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/Agent.tsx
git commit -m "feat(web): add Agent component (drifting lavender worker)"
```

---

### Task 3.5: `ConduitRail.tsx` and `FloorGrid.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/ConduitRail.tsx`
- Create: `apps/web/src/components/sections/home/factory-hero/components/FloorGrid.tsx`

- [ ] **Step 1: Implement ConduitRail**

```tsx
'use client';

import { Line } from '@react-three/drei';
import { COLORS, BLOOM_LAYER } from '../lib/materials';

interface Props {
  length: number; // scene units
  y: number;
}

export function ConduitRail({ length, y }: Props): JSX.Element {
  return (
    <Line
      points={[
        [-length / 2, y, 0],
        [length / 2, y, 0],
      ]}
      color={COLORS.neonPrimary}
      lineWidth={1.5}
      dashed
      dashScale={6}
      dashSize={0.04}
      gapSize={0.08}
      transparent
      opacity={0.6}
      onUpdate={(l) => l.layers.enable(BLOOM_LAYER)}
    />
  );
}
```

- [ ] **Step 2: Implement FloorGrid**

```tsx
'use client';

import { COLORS } from '../lib/materials';

interface Props {
  width: number;
  depth: number;
  y: number;
}

export function FloorGrid({ width, depth, y }: Props): JSX.Element {
  // grid: 60px cells per spec at 1px ≈ 0.005 units => 0.3 units per cell
  return (
    <gridHelper
      args={[
        Math.max(width, depth),
        Math.ceil(Math.max(width, depth) / 0.3),
        COLORS.neonPrimary,
        COLORS.neonPrimary,
      ]}
      position={[0, y, 0]}
    />
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/ConduitRail.tsx apps/web/src/components/sections/home/factory-hero/components/FloorGrid.tsx
git commit -m "feat(web): add ConduitRail + FloorGrid components"
```

---

## Phase 4 · Per-chamber data viz components

### Task 4.1: `ManifestCard.tsx` (CH1)

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/data-viz/ManifestCard.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { Text } from '@react-three/drei';
import { type CveSummary } from '../../lib/logoPool';
import { COLORS } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  summary: CveSummary;
  /** Opacity 0..1 — driven by the parent based on the cube's CH1 dwell window. */
  visibility: number;
}

export function ManifestCard({ position, summary, visibility }: Props): JSX.Element {
  const text = `🔴 ${summary.cveCount} CVE · ${summary.version} · ${summary.depCount} deps`;
  return (
    <group position={position} visible={visibility > 0.01}>
      <Text
        fontSize={0.08}
        color={COLORS.neonSecondary}
        anchorX="center"
        anchorY="middle"
        fillOpacity={visibility}
      >
        {text}
      </Text>
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/data-viz/ManifestCard.tsx
git commit -m "feat(web): add ManifestCard data-viz (CH1)"
```

---

### Task 4.2: `DepGraph.tsx` (CH2)

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/data-viz/DepGraph.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { Text, Line } from '@react-three/drei';
import { COLORS } from '../../lib/materials';

interface Node {
  pos: [number, number, number];
  label: string;
  /** If true, starts red and flips to cyan during the chamber's active window. */
  vulnerable: boolean;
}

const NODES: Node[] = [
  { pos: [-0.35,  0.30, 0], label: 'openssl', vulnerable: true },
  { pos: [ 0.35,  0.30, 0], label: 'libc',    vulnerable: false },
  { pos: [-0.35, -0.30, 0], label: 'zlib',    vulnerable: false },
  { pos: [ 0.35, -0.30, 0], label: 'curl',    vulnerable: true },
];

interface Props {
  position: [number, number, number];
  /** 0..1 progress through the dep-graph window: 0 = invisible, 0.4 = graph fully drawn, 0.7 = red→cyan flip. */
  progress: number;
}

export function DepGraph({ position, progress }: Props): JSX.Element {
  const graphAlpha = Math.min(1, Math.max(0, (progress - 0.05) / 0.3));
  const flipPhase = Math.min(1, Math.max(0, (progress - 0.5) / 0.3));

  return (
    <group position={position} visible={graphAlpha > 0.01}>
      {NODES.map((n) => (
        <Line
          key={`edge-${n.label}`}
          points={[[0, 0, 0], n.pos]}
          color={COLORS.neonPrimary}
          lineWidth={1}
          transparent
          opacity={0.5 * graphAlpha}
        />
      ))}
      {NODES.map((n) => {
        const color = n.vulnerable
          ? (flipPhase > 0.5 ? COLORS.neonPrimary : COLORS.cveWarn)
          : COLORS.neonPrimary;
        return (
          <group key={n.label} position={n.pos}>
            <mesh>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={graphAlpha} />
            </mesh>
            <Text
              position={[0.08, 0, 0]}
              fontSize={0.045}
              color={COLORS.neonSecondary}
              anchorX="left"
              fillOpacity={graphAlpha}
            >
              {n.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/data-viz/DepGraph.tsx
git commit -m "feat(web): add DepGraph data-viz (CH2)"
```

---

### Task 4.3: `BuildLattice.tsx` (CH3)

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/data-viz/BuildLattice.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { COLORS, BLOOM_LAYER } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  /** 0..1 — drives layer-by-layer build. 0 = hidden, 1 = full lattice. */
  progress: number;
}

const LAYERS = 3;

export function BuildLattice({ position, progress }: Props): JSX.Element {
  return (
    <group position={position} visible={progress > 0.01}>
      {Array.from({ length: LAYERS }).map((_, i) => {
        const layerStart = i / LAYERS;
        const layerEnd = (i + 1) / LAYERS;
        const layerAlpha = Math.min(1, Math.max(0, (progress - layerStart) / (layerEnd - layerStart)));
        const y = -0.25 + (i * 0.18);
        return (
          <mesh key={i} position={[0, y, 0]} onUpdate={(m) => m.layers.enable(BLOOM_LAYER)}>
            <torusGeometry args={[0.28, 0.005, 8, 32]} />
            <meshBasicMaterial color={COLORS.neonPrimary} transparent opacity={0.85 * layerAlpha} />
          </mesh>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/data-viz/BuildLattice.tsx
git commit -m "feat(web): add BuildLattice data-viz (CH3)"
```

---

### Task 4.4: `SbomTicker.tsx` (CH4)

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/components/data-viz/SbomTicker.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { Text } from '@react-three/drei';
import { COLORS } from '../../lib/materials';

const HASH_ROWS = [
  '7f3a2c d91b',
  '8e4d a2f1',
  'b7c8 4509',
  '1ad2 6f3e',
  'c5e9 8a01',
  '2b6f e74c',
  'f30a 9d51',
];

interface Props {
  position: [number, number, number];
  /** 0..1 — progress through the SBOM print window. */
  progress: number;
}

export function SbomTicker({ position, progress }: Props): JSX.Element {
  const rowsShown = Math.floor(progress * HASH_ROWS.length);
  return (
    <group position={position} visible={rowsShown > 0}>
      {HASH_ROWS.slice(0, rowsShown).map((row, i) => (
        <Text
          key={i}
          position={[0, -i * 0.06, 0]}
          fontSize={0.035}
          color={COLORS.neonPrimary}
          anchorX="left"
          font="ui-monospace"
        >
          {row}
        </Text>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/data-viz/SbomTicker.tsx
git commit -m "feat(web): add SbomTicker data-viz (CH4)"
```

---

## Phase 5 · Scene composition

### Task 5.1: `FactoryScene.tsx`

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, SelectiveBloom } from '@react-three/postprocessing';
import { Chamber } from './components/Chamber';
import { Cube } from './components/Cube';
import { Agent } from './components/Agent';
import { ConduitRail } from './components/ConduitRail';
import { FloorGrid } from './components/FloorGrid';
import { getLogoForCube } from './lib/logoPool';

const RAIL_Y = 0.0;
const X_SPAN = 6.4; // total travel width in scene units

const CHAMBER_POSITIONS: { x: number; label: string }[] = [
  { x: -2.4, label: '[ 01 · INTAKE ]' },
  { x: -0.8, label: '[ 02 · AI_LOGIC ]' },
  { x:  0.9, label: '[ 03 · CLEANCOMPILE ]' },
  { x:  2.5, label: '[ 04 · ATTEST·SHIP ]' },
];

const CHAMBER_SIZE: [number, number, number] = [1.5, 1.4, 1.0];

const AGENT_OFFSETS: [number, number, number][] = [
  [-0.55,  0.45, 0.3],
  [ 0.55,  0.45, 0.3],
  [ 0.00, -0.55, 0.3],
];

export function FactoryScene(): JSX.Element {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.0], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.15} color="#dab6f3" />
      <pointLight position={[0, 2, 2]} intensity={0.4} color="#2cc1eb" />

      <ConduitRail length={X_SPAN} y={RAIL_Y} />
      <FloorGrid width={X_SPAN + 1} depth={3} y={-0.95} />

      {CHAMBER_POSITIONS.map((c, i) => (
        <Chamber key={i} position={[c.x, RAIL_Y, 0]} size={CHAMBER_SIZE} label={c.label}>
          {AGENT_OFFSETS.map((off, j) => (
            <Agent key={j} position={off} driftSeed={i + j * 0.5} />
          ))}
        </Chamber>
      ))}

      <Cube loopOffset={0}   logo={getLogoForCube(0)} railY={RAIL_Y} xSpan={X_SPAN} />
      <Cube loopOffset={5.0} logo={getLogoForCube(1)} railY={RAIL_Y} xSpan={X_SPAN} />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.3} luminanceSmoothing={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
```

> **Note:** Per-chamber data-viz components (ManifestCard / DepGraph / BuildLattice / SbomTicker) are wired in Task 5.2 after we verify the scene compiles and renders.

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx
git commit -m "feat(web): assemble FactoryScene with chambers + cubes + agents"
```

---

### Task 5.2: Wire per-chamber data viz into the scene

**Files:**
- Modify: `apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx`
- Create: `apps/web/src/components/sections/home/factory-hero/components/ChamberContents.tsx`

- [ ] **Step 1: Add `ChamberContents.tsx`** — encapsulates the data-viz lookup per chamber index, driven by a "primary cube" phase ref.

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { CubePhase } from '../lib/timeline';
import { useLoopPhase } from '../hooks/useLoopPhase';
import { ManifestCard } from './data-viz/ManifestCard';
import { DepGraph } from './data-viz/DepGraph';
import { BuildLattice } from './data-viz/BuildLattice';
import { SbomTicker } from './data-viz/SbomTicker';
import { getCveSummaryFor, getLogoForCube } from '../lib/logoPool';

interface Props {
  /** 0..3 — which chamber this content belongs to. */
  chamberIndex: 0 | 1 | 2 | 3;
}

/**
 * Drives the data-viz inside one chamber based on whichever cube (A or B) is
 * currently passing through. Both cube phase refs are sampled per frame.
 */
export function ChamberContents({ chamberIndex }: Props): JSX.Element {
  const phaseA = useLoopPhase(0);
  const phaseB = useLoopPhase(5.0);
  const localRef = useRef({ progress: 0, summary: getCveSummaryFor(getLogoForCube(0)) });

  useFrame(() => {
    const inChamber = (p: CubePhase): number => {
      switch (chamberIndex) {
        case 0: return p.stage === 'ch1' ? p.dwell : 0;
        case 1: return p.stage === 'ch2' ? p.dwell : 0;
        case 2: return (p.stage === 'ch3-cleancompile' || p.stage === 'ch3-enter' || p.stage === 'ch3-exit') ? p.dwell : 0;
        case 3: return p.stage === 'ch4' ? p.dwell : 0;
      }
    };
    const a = inChamber(phaseA.current);
    const b = inChamber(phaseB.current);
    localRef.current.progress = Math.max(a, b);
    if (a > b) localRef.current.summary = getCveSummaryFor(getLogoForCube(0));
    else if (b > 0) localRef.current.summary = getCveSummaryFor(getLogoForCube(1));
  });

  switch (chamberIndex) {
    case 0:
      return <ManifestCard position={[0, 0.6, 0.4]} summary={localRef.current.summary} visibility={localRef.current.progress} />;
    case 1:
      return <DepGraph position={[0, 0, 0.2]} progress={localRef.current.progress} />;
    case 2:
      return <BuildLattice position={[0, 0, 0]} progress={localRef.current.progress} />;
    case 3:
      return <SbomTicker position={[0.4, 0.3, 0.3]} progress={localRef.current.progress} />;
  }
}
```

- [ ] **Step 2: Mount inside each Chamber in `FactoryScene.tsx`** — replace the inline `Agent` map with one that also includes `<ChamberContents>`:

In `FactoryScene.tsx`, replace the `CHAMBER_POSITIONS.map(...)` block with:

```tsx
{CHAMBER_POSITIONS.map((c, i) => (
  <Chamber key={i} position={[c.x, RAIL_Y, 0]} size={CHAMBER_SIZE} label={c.label}>
    {AGENT_OFFSETS.map((off, j) => (
      <Agent key={j} position={off} driftSeed={i + j * 0.5} />
    ))}
    <ChamberContents chamberIndex={i as 0 | 1 | 2 | 3} />
  </Chamber>
))}
```

And add the import at the top of the file:

```tsx
import { ChamberContents } from './components/ChamberContents';
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/components/ChamberContents.tsx apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx
git commit -m "feat(web): wire per-chamber data-viz via ChamberContents"
```

---

### Task 5.3: `FactoryHero.poster.tsx` — LCP poster

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/FactoryHero.poster.tsx`
- Create: `apps/web/src/components/sections/home/factory-hero/assets/hero-poster.jpg` (placeholder)

- [ ] **Step 1: Generate a placeholder poster for development**

For v1 development, a 1920×800 dark-purple gradient JPEG is sufficient. The design team will replace with a true rendered frame later (open question in spec § 9 — note in commit message).

```bash
# Create a placeholder using ImageMagick if available; otherwise use any 1920x800 JPG.
# This command needs ImageMagick installed. If not available, create the file by
# any other means and place it at the path below.
convert -size 1920x800 \
  gradient:'#060512-#1d1854' \
  -quality 80 \
  apps/web/src/components/sections/home/factory-hero/assets/hero-poster.jpg
```

If ImageMagick is not available, save any 1920×800 JPEG ≤ 80 KB to that path.

- [ ] **Step 2: Implement the poster component**

Create `apps/web/src/components/sections/home/factory-hero/FactoryHero.poster.tsx`:

```tsx
'use client';

import Image from 'next/image';
import poster from './assets/hero-poster.jpg';

interface Props {
  /** 0..1 — when 0 poster is fully opaque, when 1 it has faded out. */
  fadeOut: number;
}

export function FactoryHeroPoster({ fadeOut }: Props): JSX.Element {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 1 - fadeOut,
        transition: 'opacity 400ms ease-out',
        pointerEvents: 'none',
      }}
    >
      <Image
        src={poster}
        alt=""
        priority
        fill
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/FactoryHero.poster.tsx apps/web/src/components/sections/home/factory-hero/assets/hero-poster.jpg
git commit -m "feat(web): add LCP poster placeholder + FactoryHeroPoster component"
```

---

### Task 5.4: `FactoryHero.tsx` — entry component

**Files:**
- Create: `apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FactoryHeroPoster } from './FactoryHero.poster';
import { useReducedMotion } from './hooks/useReducedMotion';

const FactoryScene = dynamic(
  () => import('./FactoryScene').then((m) => m.FactoryScene),
  { ssr: false }
);

const ARIA_LABEL =
  'CleanStart Factory pipeline: vulnerable upstream container images (such as nginx, postgres, redis) enter on the left, pass through four hardening stages — Intake, AI Logic Engine, CleanCompile, Attest and Handoff — and exit signed, verified, and CVE-free on the right.';

export function FactoryHero(): JSX.Element {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tiny defer so the scene mount happens after first paint (poster already up).
    const id = window.setTimeout(() => setSceneReady(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <FactoryHeroPoster fadeOut={sceneReady && !reduced ? 1 : 0} />
      {mounted && !reduced && sceneReady && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FactoryScene />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx
git commit -m "feat(web): add FactoryHero entry with poster fade + reduced-motion guard"
```

---

## Phase 6 · Hero integration

### Task 6.1: Replace `HeroOrb` with `FactoryHero` in `Hero.tsx`

**Files:**
- Modify: `apps/web/src/components/sections/home/Hero.tsx`
- Delete: `apps/web/src/components/sections/home/HeroOrb.tsx`

- [ ] **Step 1: Read current `Hero.tsx`** to see the current import + JSX

```bash
cat apps/web/src/components/sections/home/Hero.tsx
```

- [ ] **Step 2: Edit `Hero.tsx`**

Replace the `HeroOrb` import on line 2:

```tsx
// BEFORE:
import { HeroOrb } from "@/components/sections/home/HeroOrb";

// AFTER:
import { FactoryHero } from "@/components/sections/home/factory-hero/FactoryHero";
```

Replace the hidden orb block (lines 40-42) with a sized FactoryHero mount:

```tsx
// BEFORE:
<div className="mt-12" style={{ visibility: "hidden" }} aria-hidden>
  <HeroOrb />
</div>

// AFTER:
<div className="mt-12 relative w-full" style={{ height: 'clamp(360px, 50vw, 620px)' }}>
  <FactoryHero />
</div>
```

- [ ] **Step 3: Delete the old `HeroOrb.tsx`**

```bash
rm apps/web/src/components/sections/home/HeroOrb.tsx
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS. If any other file imports `HeroOrb`, the typecheck will surface it — fix or remove that import too. (As of 2026-05-28 only `Hero.tsx` imports it.)

- [ ] **Step 5: Lint**

```bash
pnpm --filter @cleanstart/web lint
```

Expected: PASS. If `biome` complains about the deletion (orphan exports etc.), follow the lint fix prompt.

- [ ] **Step 6: Local dev sanity-check**

```bash
pnpm --filter @cleanstart/web dev
```

Open `http://localhost:3001`. Confirm:
- H1 + CTA render unchanged.
- A poster image appears immediately under the H1.
- After ~200 ms, the 3D scene fades in over the poster.
- Two cubes traverse the pipeline; chambers light up sequentially.

Kill the dev server (`Ctrl-C`) once visually confirmed.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/sections/home/Hero.tsx
git rm apps/web/src/components/sections/home/HeroOrb.tsx
git commit -m "feat(web): swap HeroOrb for FactoryHero on home page"
```

---

## Phase 7 · Responsive, reduced-motion, and a11y polish

### Task 7.1: Mobile vertical-stack rearrangement

**Files:**
- Modify: `apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx`

- [ ] **Step 1: Read viewport mode and adjust chamber layout**

In `FactoryScene.tsx`, replace the static `CHAMBER_POSITIONS` constants with a function that returns positions based on viewport, and use the `useViewportMode` hook.

At the top, add the import:

```tsx
import { useViewportMode } from './hooks/useViewportMode';
```

Replace the constants:

```tsx
const HORIZONTAL: { x: number; y: number; label: string }[] = [
  { x: -2.4, y: 0, label: '[ 01 · INTAKE ]' },
  { x: -0.8, y: 0, label: '[ 02 · AI_LOGIC ]' },
  { x:  0.9, y: 0, label: '[ 03 · CLEANCOMPILE ]' },
  { x:  2.5, y: 0, label: '[ 04 · ATTEST·SHIP ]' },
];

const VERTICAL: { x: number; y: number; label: string }[] = [
  { x: 0, y:  2.0, label: '[ 01 · INTAKE ]' },
  { x: 0, y:  0.7, label: '[ 02 · AI_LOGIC ]' },
  { x: 0, y: -0.7, label: '[ 03 · CLEANCOMPILE ]' },
  { x: 0, y: -2.0, label: '[ 04 · ATTEST·SHIP ]' },
];
```

Inside `FactoryScene`, use the hook:

```tsx
const mode = useViewportMode();
const chambers = mode === 'mobile' ? VERTICAL : HORIZONTAL;
const showAgents = mode !== 'mobile';
```

Replace the chamber map to consume `chambers` and skip agents on mobile:

```tsx
{chambers.map((c, i) => (
  <Chamber key={i} position={[c.x, c.y, 0]} size={CHAMBER_SIZE} label={c.label}>
    {showAgents && AGENT_OFFSETS.map((off, j) => (
      <Agent key={j} position={off} driftSeed={i + j * 0.5} />
    ))}
    <ChamberContents chamberIndex={i as 0 | 1 | 2 | 3} />
  </Chamber>
))}
```

- [ ] **Step 2: Update `Cube.tsx` to use vertical Y travel on mobile**

Modify `Cube.tsx` to accept an `orientation` prop:

```tsx
interface CubeProps {
  loopOffset: number;
  logo: LogoSlug;
  railY: number;
  xSpan: number;
  orientation: 'horizontal' | 'vertical';
}

// inside useFrame:
const p = phaseRef.current;
if (orientation === 'horizontal') {
  groupRef.current.position.x = p.x * (xSpan / 2);
  groupRef.current.position.y = railY;
} else {
  groupRef.current.position.x = 0;
  groupRef.current.position.y = -p.x * (xSpan / 2); // map x to -y so cube travels top→bottom
}
```

In `FactoryScene.tsx`, pass `orientation`:

```tsx
<Cube
  loopOffset={0}
  logo={getLogoForCube(0)}
  railY={0}
  xSpan={mode === 'mobile' ? 5.0 : X_SPAN}
  orientation={mode === 'mobile' ? 'vertical' : 'horizontal'}
/>
```

- [ ] **Step 3: Adjust camera for mobile**

In `FactoryScene.tsx`, replace the static camera prop with a derived value:

```tsx
const cameraPos: [number, number, number] = mode === 'mobile' ? [0, 0, 5.0] : [0, 0.4, 4.0];
const cameraFov = mode === 'mobile' ? 50 : 38;

<Canvas camera={{ position: cameraPos, fov: cameraFov }} ... >
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/FactoryScene.tsx apps/web/src/components/sections/home/factory-hero/components/Cube.tsx
git commit -m "feat(web): mobile vertical-stack layout for factory hero"
```

---

### Task 7.2: Reduced-motion fallback inside the scene

**Files:**
- Modify: `apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx`

The current `FactoryHero.tsx` already shows the poster (and no scene) when reduced motion matches. Verify this is sufficient — the poster IS the reduced-motion state per spec § 4.3. If the poster is later updated to a true rendered settled frame, the implementation here remains unchanged.

- [ ] **Step 1: Add a comment in `FactoryHero.tsx`** explaining the reduced-motion strategy for future maintainers:

After the existing `useReducedMotion()` line, add:

```tsx
// Reduced-motion strategy (spec § 4.3): show the poster only — no R3F scene,
// no cubes in motion, no flicker. The poster image is designed to depict a
// "settled" state of the pipeline so the visual story still reads as still life.
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx
git commit -m "docs(web): comment the reduced-motion strategy in FactoryHero"
```

---

### Task 7.3: WebGL-disabled fallback

**Files:**
- Modify: `apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx`

- [ ] **Step 1: Add a WebGL capability check**

In `FactoryHero.tsx`, add a helper above the component:

```tsx
function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
```

Use it inside the component:

```tsx
const [supportsWebGL, setSupportsWebGL] = useState(true);

useEffect(() => {
  setSupportsWebGL(hasWebGL());
  setMounted(true);
  const id = window.setTimeout(() => setSceneReady(true), 200);
  return () => window.clearTimeout(id);
}, []);
```

Update the render guard:

```tsx
{mounted && !reduced && sceneReady && supportsWebGL && (
  <div style={{ position: 'absolute', inset: 0 }}>
    <FactoryScene />
  </div>
)}
```

When `!supportsWebGL`, the poster stays at full opacity (`fadeOut=0`). Adjust the poster's `fadeOut` prop:

```tsx
<FactoryHeroPoster fadeOut={sceneReady && !reduced && supportsWebGL ? 1 : 0} />
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter @cleanstart/web typecheck
git add apps/web/src/components/sections/home/factory-hero/FactoryHero.tsx
git commit -m "feat(web): fall back to poster when WebGL is unavailable"
```

---

## Phase 8 · Verification & ship

### Task 8.1: Run the full pre-completion gate

- [ ] **Step 1: Lint, typecheck, build, test all green**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web test
pnpm --filter @cleanstart/web build
```

Expected: all four pass. Fix anything that fails and re-run before proceeding.

- [ ] **Step 2: Bundle budget check**

```bash
pnpm --filter @cleanstart/web bundle:budget
```

Expected: home route delta ≤ 220 KB gzipped. If exceeded, profile the build and either lazy-load `@react-three/postprocessing` or drop the selective bloom for v1.

- [ ] **Step 3: Lighthouse cold-cache LCP**

```bash
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web start &
sleep 5
npx lighthouse http://localhost:3001 --only-categories=performance --form-factor=desktop --throttling-method=devtools --quiet --output=json --output-path=./lighthouse-home.json
kill %1
node -e "const r=require('./lighthouse-home.json');console.log('LCP:',r.audits['largest-contentful-paint'].numericValue,'ms');"
```

Expected: LCP ≤ 2000 ms. If higher, ensure the poster has `priority` and that no other above-the-fold image is contesting LCP.

- [ ] **Step 4: Visual smoke test at desktop / mid / mobile**

```bash
pnpm --filter @cleanstart/web dev
```

For each viewport — open DevTools, resize to 1440 px, 1024 px, 375 px — and:
- Verify H1 + CTA layout is correct.
- Verify the poster paints first.
- Verify the 3D scene fades in within ~500 ms after first paint.
- Verify two cubes traverse the pipeline; logos rotate visibly across multiple loops.
- Verify chambers light up sequentially; data viz appears in each chamber on cue.
- Mobile: confirm vertical stack, agents dropped, slower loop.

Stop the dev server.

- [ ] **Step 5: Reduced-motion + WebGL-disabled checks**

In DevTools:
- Toggle **Rendering → Emulate CSS prefers-reduced-motion: reduce** — confirm only the static poster shows.
- Toggle **Rendering → WebGL: Disabled** — confirm only the static poster shows.

- [ ] **Step 6: Accessibility scan**

```bash
pnpm --filter @cleanstart/web test:e2e -- --grep "@axe"
```

If no axe test currently targets the home page, add one or run an ad-hoc check:

```bash
pnpm --filter @cleanstart/web dev &
sleep 5
npx @axe-core/cli http://localhost:3001
kill %1
```

Expected: 0 violations on the hero region. (Existing site-wide noise is out of scope.)

- [ ] **Step 7: Commit any final fixes from this verification pass**

If any of the above steps required a code fix, commit it now with a descriptive message — e.g.:

```bash
git add <paths>
git commit -m "fix(web): <what you fixed>"
```

---

### Task 8.2: Final summary commit + push (user-approved)

> **Do not push without explicit user approval per [CLAUDE.md](../../../CLAUDE.md).**

- [ ] **Step 1: Verify all phase commits are present**

```bash
git log --oneline development ^origin/development
```

Expected: ~15-20 commits, one per task. If you see uncommitted changes (`git status`), commit them before proceeding.

- [ ] **Step 2: Ask user before push**

Prompt the user: "All 8 phases complete. Ready to push `development` to origin and open a PR? (yes/no)"

Wait for explicit "yes."

- [ ] **Step 3: Push (after approval only)**

```bash
git push origin development
```

- [ ] **Step 4: Sync per CLAUDE.md branching policy**

Per CLAUDE.md § "Sync cycle":

```bash
# 1. Forward-merge development → main
git checkout main
git merge --ff-only development
git push origin main

# 2. Back-merge main → development (no-op since they're identical, but documented)
git checkout development
git merge --ff-only main

# 3. Fast-forward farheen
git push origin development:farheen
```

- [ ] **Step 5: Tag the spec + plan as complete in the docs index**

If `docs/BACKLOG.md` tracks frontend work, update the relevant row to reference the merged commit SHA.

---

## Self-review against the design spec

| Spec § | Requirement | Plan task |
|---|---|---|
| § 1 Locked decisions table | All 7 decisions implemented | Phase 0–6 |
| § 2 Goals & non-goals | No CMS edits; no nav/footer changes | Plan scope respects this |
| § 3.1 Composition | H1+CTA top, pipeline lower | Task 6.1 |
| § 3.2 Palette | 7 brand-aligned tokens | Task 1.4 `COLORS` |
| § 3.2 Materials & lighting | Chambers, edges, conduit, floor, lighting, bloom | Tasks 3.1, 3.5, 5.1 |
| § 3.2 Glitch-flicker | Chamber label CRT flicker | *Deferred: implement as a small additive on Task 3.1 if time permits, otherwise add post-launch — not a blocker* |
| § 3.3 Chamber dims | 1.5×1.4×1.0 | Task 5.1 `CHAMBER_SIZE` |
| § 3.4 Cube | Dirty/clean materials | Task 3.3 |
| § 3.4.1 Logo on cube face | Billboarded, grayscale→color crossfade | Tasks 3.2, 3.3 |
| § 3.5 Agents (D4 hybrid) | 3 per chamber, lavender, drift, low opacity | Tasks 3.4, 5.1 |
| § 3.6 Data viz per chamber | CH1 chip, CH2 graph, CH3 lattice, CH4 ticker | Tasks 4.1–4.4, 5.2 |
| § 4.1 10s loop beats | Timeline phases match | Task 1.1 `WINDOWS` |
| § 4.2 Two-cube cadence | 5s offset | Task 5.1 (two `<Cube>` instances) |
| § 4.3 Reduced motion | Static poster | Tasks 5.4, 7.2 |
| § 4.4 LCP poster | JPEG, priority, fade-in | Task 5.3 |
| § 5 Responsive | Desktop/mid/mobile | Tasks 7.1, 2.2 |
| § 6 Component architecture | File tree matches | All phases |
| § 7 A11y | role=img + aria-label | Task 5.4 |
| § 8 Acceptance criteria 1-11 | Covered by verification gate | Task 8.1 |
| § 9 Open questions | All 4 noted with defaults; nothing blocks build | — |

**Gap surfaced by review:** § 3.2 glitch-flicker on chamber labels is not implemented in this plan. Decision: deferred. The flicker is decorative; the hero ships without it as v1 and the post-launch follow-up adds it as a single `useFrame` opacity tween on each `<Chamber>`'s label `<Text>`. Add to a future minor-polish ticket — not a blocker for this plan.

**Type consistency:** verified — `CubePhase`, `CubeStage`, `CubeMaterial` (timeline.ts) flow into `Cube.tsx`, `ChamberContents.tsx`, `CubeLogoPlane.tsx` with identical names. `LogoSlug` flows from `logoPool.ts` to `Cube.tsx` and `CubeLogoPlane.tsx`. `ViewportMode` is defined in `useViewportMode.ts` only.

**Placeholder scan:** none. Every code step shows actual code.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-home-hero-animation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for this plan since each Phase has clear boundaries and the visual work benefits from independent agent eyes.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, with checkpoints for review at the end of each Phase.

Which approach?
