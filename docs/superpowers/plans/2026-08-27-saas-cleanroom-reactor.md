# SaaS Cleanroom Reactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SaaS section's two-lane release-gate diagram with the approved single Cleanroom Reactor while preserving the supplied wording exactly.

**Architecture:** Keep `SaasShiftLeft.tsx` responsible for the section shell, canonical typography, exact copy, and one accessible sequence. Move all visual geometry into `SaasCleanroomReactor.tsx` and all animation/presentation rules into a colocated CSS module so the section remains understandable and maintainable. Desktop and mobile use distinct visual compositions but the same semantic stage data.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, SVG, CSS Modules, Tailwind CSS v4 layout utilities, Vitest server-rendered component tests.

**Repository constraint:** Execute on `development`; do not create a worktree or feature branch because this repository explicitly forbids both for routine web development.

---

### Task 1: Lock the approved visual contract with failing tests

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] **Step 1: Replace the release-gate assertions with Cleanroom Reactor requirements**

Test the rendered markup for the exact supplied copy and the new visual contract:

```tsx
const headingMarkup = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
const paragraphMarkup = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';

expect(toText(headingMarkup)).toBe('Move Beyond Shift Left');
expect(toText(paragraphMarkup)).toBe(
  'Modern applications require security to be built into the software components developers use, not added after applications are created.',
);
expect(html).toContain('data-cleanroom-reactor="desktop"');
expect(html).toContain('data-cleanroom-reactor="mobile"');
expect(html).toContain('data-reactor-source="verified-components"');
expect(html).toContain('data-security-review="perimeter"');
expect(html).toContain('data-late-artifact="rejected"');
expect(html).not.toContain('data-release-gate=');
expect(html).not.toContain('data-release-path=');
```

Assert the four internal plates in order and exactly one accessible sequence:

```tsx
expect(html).toMatch(
  /data-reactor-layer="code"[\s\S]*data-reactor-layer="build"[\s\S]*data-reactor-layer="test"[\s\S]*data-reactor-layer="deploy"/,
);
expect(
  html.match(
    /aria-label="Verified Components, Code, Build, Test, Deploy, Security Review"/g,
  ),
).toHaveLength(1);
```

Assert responsive, accessibility, motion, and SVG rules:

```tsx
expect(html).toMatch(/data-cleanroom-reactor="desktop"[^>]*aria-hidden="true"/);
expect(html).toMatch(/data-cleanroom-reactor="mobile"[^>]*aria-hidden="true"/);
expect(html).toContain('@media (prefers-reduced-motion: reduce)');
expect(html).toContain('animation: none !important');
expect(html).not.toContain('preserveAspectRatio="none"');
expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: failures for missing `data-cleanroom-reactor`, source, perimeter, layer, and rejected-artifact markup, proving the old release-gate implementation does not satisfy the approved design.

### Task 2: Build the Cleanroom Reactor visual component

**Files:**
- Create: `apps/web/src/components/sections/saas/SaasCleanroomReactor.tsx`
- Create: `apps/web/src/components/sections/saas/SaasCleanroomReactor.module.css`
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.tsx`
- Test: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] **Step 1: Define the shared stage model and component boundary**

Use an immutable stage model and a single exported visual entry point:

```tsx
const REACTOR_LAYERS = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
] as const;

export function SaasCleanroomReactor(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <DesktopReactor />
      <MobileReactor />
    </div>
  );
}
```

- [ ] **Step 2: Implement the desktop chamber as one engineered object**

The desktop SVG must contain:

```tsx
<svg
  data-cleanroom-reactor="desktop"
  aria-hidden="true"
  viewBox="0 0 1240 620"
  preserveAspectRatio="xMidYMid meet"
  className={styles.desktopReactor}
>
  <VerifiedSource />
  <IntakeConduit />
  <ReactorChamber layers={REACTOR_LAYERS} />
  <SecurityPerimeter />
  <RejectedLateArtifact />
</svg>
```

The chamber places Code, Build, Test, and Deploy on four perspective plates inside one chamfered transparent enclosure. `SecurityPerimeter` wraps that enclosure and carries `data-security-review="perimeter"`. The verified capsule uses `data-reactor-source="verified-components"`. The coral artifact remains outside and uses `data-late-artifact="rejected"` with visible fracture and outward-arrow geometry.

- [ ] **Step 3: Implement the dedicated mobile chamber**

The mobile SVG must use its own vertical viewBox and the same shared layer model:

```tsx
<svg
  data-cleanroom-reactor="mobile"
  aria-hidden="true"
  viewBox="0 0 360 700"
  preserveAspectRatio="xMidYMid meet"
  className={styles.mobileReactor}
>
  <MobileVerifiedSource />
  <MobileSecurityFrame>
    {REACTOR_LAYERS.map((layer) => (
      <MobileLayer key={layer.id} layer={layer} />
    ))}
  </MobileSecurityFrame>
  <MobileRejectedArtifact />
</svg>
```

Verified Components sits above the intake; all four plates remain inside one Security Review frame; the rejected artifact remains outside the frame.

- [ ] **Step 4: Replace the old section composition**

Reduce `SaasShiftLeft.tsx` to the section shell and exact content:

```tsx
<Section padding="lg" data-section="SaasShiftLeft" className="relative overflow-hidden">
  <CleanroomAtmosphere />
  <Container className="relative">
    <div className="mx-auto flex max-w-[900px] flex-col items-center gap-5 text-center">
      <Reveal header>
        <h2
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 'var(--fs-h2-weight)',
            letterSpacing: 'var(--fs-h2-ls)',
            lineHeight: 'var(--fs-h2-lh)',
          }}
        >
          Move Beyond <span style={{ color: '#75FFD0' }}>Shift Left</span>
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p
          className="max-w-[760px]"
          style={{
            margin: 0,
            color: 'rgba(225,231,255,0.78)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-lead)',
            fontWeight: 400,
            lineHeight: 1.55,
          }}
        >
          Modern applications require security to be built into the software components developers
          use, not added after applications are created.
        </p>
      </Reveal>
    </div>
    <p
      className="sr-only"
      aria-label="Verified Components, Code, Build, Test, Deploy, Security Review"
    >
      Verified Components, Code, Build, Test, Deploy, Security Review
    </p>
    <SaasCleanroomReactor />
  </Container>
</Section>
```

Remove all release-gate constants, parallel rail geometry, gate components, and release-path data attributes.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: all Cleanroom Reactor component tests pass.

### Task 3: Add orchestrated motion and the complete static fallback

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasCleanroomReactor.module.css`
- Test: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] **Step 1: Add one coordinated animation cycle**

Define CSS-module classes for these behaviours:

```css
.sourcePulse { animation: sourcePulse 10.8s ease-in-out infinite; }
.energyColumn { animation: energyRise 10.8s ease-in-out infinite; }
.layerCode { animation: layerCode 10.8s ease-out infinite; }
.layerBuild { animation: layerBuild 10.8s ease-out infinite; }
.layerTest { animation: layerTest 10.8s ease-out infinite; }
.layerDeploy { animation: layerDeploy 10.8s ease-out infinite; }
.scanBeam { animation: scanBeam 10.8s cubic-bezier(.7, 0, .3, 1) infinite; }
.lateArtifact { animation: lateImpact 10.8s cubic-bezier(.7, 0, .3, 1) infinite; }
.fractureShard { animation: fractureReject 10.8s ease-out infinite; }
```

Sequence timing: source and intake 0–20%, internal layers 20–55%, security scan 55–72%, late impact and rejection 74–92%, stable reset 92–100%.

- [ ] **Step 2: Add reduced-motion styles scoped to the component**

```css
@media (prefers-reduced-motion: reduce) {
  .sourcePulse,
  .energyColumn,
  .layerPlate,
  .scanBeam,
  .lateArtifact,
  .fractureShard {
    animation: none !important;
  }

  .sourcePulse,
  .layerPlate,
  .securityPerimeter {
    opacity: 1 !important;
    transform: none !important;
  }

  .scanBeam { opacity: 0 !important; }
  .lateArtifact { opacity: .72 !important; transform: none !important; }
}
```

- [ ] **Step 3: Run the focused tests**

Run the focused Vitest command and confirm all tests pass without warnings.

### Task 4: Visual QA and refinement

**Files:**
- Modify if visual inspection identifies a defect: `apps/web/src/components/sections/saas/SaasShiftLeft.tsx`
- Modify if visual inspection identifies a defect: `apps/web/src/components/sections/saas/SaasCleanroomReactor.tsx`
- Modify if visual inspection identifies a defect: `apps/web/src/components/sections/saas/SaasCleanroomReactor.module.css`

- [ ] **Step 1: Start the web app and lock the required desktop viewport**

Run `pnpm --filter @cleanstart/web dev`, open `/saas`, and set the browser to 1440×900.

- [ ] **Step 2: Inspect the settled reactor state**

Pause the component animations near the stable protected phase. Confirm the chamber is one dominant object, the four stages are readable inside it, the Security Review perimeter visibly encloses the system, and the coral artifact is clearly outside.

- [ ] **Step 3: Inspect mobile geometry**

At 390×844 confirm the dedicated mobile SVG has no overflow, no clipped labels, a visible enclosing security frame, and the rejected artifact remains outside the frame. Restore 1440×900 for the final capture.

- [ ] **Step 4: Capture the final 1440×900 preview**

Save the screenshot outside the repository in the Codex visualizations directory and inspect it at original resolution.

### Task 5: Final verification and review

**Files:**
- Review all modified SaaS section files and the implementation plan.

- [ ] **Step 1: Run focused and full tests**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/sections/saas/SaasShiftLeft.test.tsx
pnpm --filter @cleanstart/web test
```

- [ ] **Step 2: Run both lint gates and TypeScript**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web exec eslint \
  src/components/sections/saas/SaasShiftLeft.tsx \
  src/components/sections/saas/SaasCleanroomReactor.tsx \
  src/components/sections/saas/SaasShiftLeft.test.tsx
pnpm --filter @cleanstart/web typecheck
```

- [ ] **Step 3: Run the production build**

```bash
NEXT_PUBLIC_CMS_URL=https://cms.cleanstart.com pnpm --filter @cleanstart/web build
```

Expected: successful compilation, type validation, and all static pages generated.

- [ ] **Step 4: Run diff checks and request code review**

```bash
git diff --check
git status --short
```

Request a final review focused on the approved concept, responsive SVG rules, exact copy, accessibility, motion fallback, and page scoping. Resolve all Critical and Important findings before completion.
