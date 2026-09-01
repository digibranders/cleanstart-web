# SaaS Verified Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the confusing SaaS cleanroom reactor with the approved Verified Core comparison while preserving the supplied copy and both source sequences.

**Architecture:** Keep the section shell and exact copy in `SaasShiftLeft.tsx`. Move the decorative desktop/mobile geometry into a focused `SaasVerifiedCore.tsx` component and a co-located CSS module. Express the source sequences once as accessible ordered lists; keep duplicated visual labels hidden from assistive technology.

**Tech Stack:** Next.js 16, React 19 server components, TypeScript strict mode, CSS Modules, SVG, Vitest, React server rendering.

---

## File Map

- Create `apps/web/src/components/sections/saas/SaasVerifiedCore.tsx`: verified-first and late-review desktop/mobile diagram structure.
- Create `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`: responsive geometry, color, motion, and reduced-motion state.
- Modify `apps/web/src/components/sections/saas/SaasShiftLeft.tsx`: replace the old reactor import and expose both exact source sequences.
- Modify `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`: replace reactor assertions with the approved diagram contract.
- Delete `apps/web/src/components/sections/saas/SaasCleanroomReactor.tsx` and `apps/web/src/components/sections/saas/SaasCleanroomReactor.module.css`: remove the superseded visual.

### Task 1: Lock the new diagram contract with a failing test

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] **Step 1: Preserve the exact-copy assertion and replace the reactor-specific assertions**

Add assertions for these concrete contracts:

```tsx
it('renders structurally distinct desktop and mobile Verified Core diagrams', () => {
  const html = renderSection();

  expect(html).toContain('data-verified-core="desktop"');
  expect(html).toContain('data-verified-core="mobile"');
  expect(html).not.toContain('data-cleanroom-reactor=');
  expect(html).not.toContain('data-reactor-chamber=');
});

it('carries one verified core through every delivery stage', () => {
  const html = renderSection();

  expect(html).toContain('data-verified-source="verified-components"');
  expect(html).toContain('data-trust-ribbon="continuous"');
  expect(html).toMatch(
    /data-core-stage="code"[\s\S]*data-core-stage="build"[\s\S]*data-core-stage="test"[\s\S]*data-core-stage="deploy"/,
  );
});

it('contrasts an open release with a closed late-review return', () => {
  const html = renderSection();

  expect(html).toContain('data-security-review="open"');
  expect(html).toContain('data-release-exit="approved"');
  expect(html).toContain('data-security-review="closed"');
  expect(html).toContain('data-late-review-path="return"');
});

it('exposes both exact source sequences once and hides duplicate visuals', () => {
  const html = renderSection();

  expect(html.match(/aria-label="Code, Build, Test, Deploy, Security Review"/g)).toHaveLength(1);
  expect(
    html.match(/aria-label="Verified Components, Code, Build, Test, Deploy, Security Review"/g),
  ).toHaveLength(1);
  expect(html).toMatch(/data-verified-core="desktop"[^>]*aria-hidden="true"/);
  expect(html).toMatch(/data-verified-core="mobile"[^>]*aria-hidden="true"/);
  expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
  expect(html).not.toMatch(/preserveAspectRatio=.none./);
});
```

- [ ] **Step 2: Add the reduced-motion stylesheet contract**

```tsx
it('provides a complete reduced-motion state for the Verified Core', () => {
  const stylesheetPath = new URL('./SaasVerifiedCore.module.css', import.meta.url);
  const stylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : '';

  expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
  expect(stylesheet).toMatch(/\.verifiedPulse[\s\S]*animation: none !important/);
  expect(stylesheet).toMatch(/\.returnPulse[\s\S]*animation: none !important/);
  expect(stylesheet).toMatch(/\.scannerBeam[\s\S]*animation: none !important/);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: FAIL because the old component lacks `data-verified-core`, `data-trust-ribbon`, open/closed scanner, and release/return contracts.

### Task 2: Implement the Verified Core component

**Files:**
- Create: `apps/web/src/components/sections/saas/SaasVerifiedCore.tsx`
- Create: `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`

- [ ] **Step 1: Create typed, static stage data and focused render helpers**

Use this public and internal shape:

```tsx
type DeliveryStageId = 'code' | 'build' | 'test' | 'deploy';

interface DeliveryStage {
  readonly id: DeliveryStageId;
  readonly label: 'Code' | 'Build' | 'Test' | 'Deploy';
}

const DELIVERY_STAGES: readonly DeliveryStage[] = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
];

export function SaasVerifiedCore(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <DesktopVerifiedCore />
      <MobileVerifiedCore />
    </div>
  );
}
```

Implement `DesktopVerifiedCore`, `LateReviewRoute`, `VerifiedRoute`, `StageHousing`, `SecurityScanner`, `MobileVerifiedCore`, `MobileLateRoute`, and `MobileVerifiedRoute`. Each helper returns `React.ReactElement`; no client state or runtime input is introduced.

- [ ] **Step 2: Build the desktop surface**

The desktop DOM must include:

```tsx
<div data-verified-core="desktop" aria-hidden="true" className={styles.desktopSurface}>
  <LateReviewRoute />
  <VerifiedRoute />
</div>
```

The late route uses the four stage labels, a closed `SecurityScanner`, and an SVG return curve marked `data-late-review-path="return"`. The verified route uses a source marked `data-verified-source="verified-components"`, a continuous rail marked `data-trust-ribbon="continuous"`, four ordered `data-core-stage` housings, an open scanner, and `data-release-exit="approved"`.

- [ ] **Step 3: Build the dedicated mobile composition**

Render a compact late-review card followed by a dominant vertical verified route:

```tsx
<div data-verified-core="mobile" aria-hidden="true" className={styles.mobileSurface}>
  <MobileLateRoute />
  <MobileVerifiedRoute />
</div>
```

The mobile route duplicates only decorative labels. Its structure must be independent of the desktop SVG and introduce no horizontal scrolling.

- [ ] **Step 4: Implement the CSS visual system**

Use the approved palette and responsibilities:

```css
.stage { width: 100%; max-width: 1120px; margin-inline: auto; }
.desktopSurface { display: none; }
.mobileSurface { display: grid; gap: 18px; }

@media (min-width: 1024px) {
  .desktopSurface { display: block; }
  .mobileSurface { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .verifiedPulse,
  .returnPulse,
  .scannerBeam {
    animation: none !important;
  }
}
```

Complete the surface, chamfered housings, embedded core, scanner, release, return, technical grid, and responsive mobile styles in the same module. Visible labels consume `--fs-*` and project font tokens; coral is restricted to the closed scanner/return, and cyan-to-mint is restricted to the verified core/open scanner.

### Task 3: Integrate the new component and remove the superseded reactor

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.tsx`
- Delete: `apps/web/src/components/sections/saas/SaasCleanroomReactor.tsx`
- Delete: `apps/web/src/components/sections/saas/SaasCleanroomReactor.module.css`

- [ ] **Step 1: Replace the import and render call**

```tsx
import { SaasVerifiedCore } from './SaasVerifiedCore';
```

Replace `<SaasCleanroomReactor />` with `<SaasVerifiedCore />`.

- [ ] **Step 2: Expose both exact source sequences**

```tsx
const LATE_REVIEW_DESCRIPTION = 'Code, Build, Test, Deploy, Security Review' as const;
const VERIFIED_FIRST_DESCRIPTION =
  'Verified Components, Code, Build, Test, Deploy, Security Review' as const;
```

Render one visually hidden ordered list for each sequence, using the corresponding value as its `aria-label`.

- [ ] **Step 3: Delete the two old reactor files**

Remove only the superseded SaaS-scoped component and stylesheet. Confirm there are no remaining `SaasCleanroomReactor` imports.

### Task 4: Complete the red-green-refactor cycle

**Files:**
- Test: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] **Step 1: Run the focused test and verify GREEN**

```bash
pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: all `SaasShiftLeft` tests pass.

- [ ] **Step 2: Run the complete web test suite**

```bash
pnpm --filter @cleanstart/web test
```

Expected: zero failing tests.

- [ ] **Step 3: Refactor only while the focused test remains green**

Remove duplicated geometry or unclear names discovered during review, then rerun the focused test. Do not change other sections or shared tokens.

### Task 5: Visual and responsive verification

**Files:**
- Inspect: `/industries/saas-container-security`

- [ ] **Step 1: Start the web app and capture the target section at 1440 × 900**

Run the existing app on port 3001, force reveal wrappers visible, and shift the complete document so the section sits inside the viewport. Confirm the source capsule, embedded core, stage labels, open scanner, late closed scanner, and return curve are immediately legible.

- [ ] **Step 2: Inspect a representative mobile viewport**

Confirm the dedicated mobile composition has no horizontal overflow, maintains stage order, and preserves readable labels.

- [ ] **Step 3: Apply only SaaS-scoped visual corrections**

Adjust `SaasVerifiedCore.tsx` and its CSS module if needed. Do not modify global styles, shared layout components, or unrelated pages.

### Task 6: Baseline gates and final review

**Files:**
- Review all changed SaaS files and the implementation plan/spec.

- [ ] **Step 1: Run mandatory package checks**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: all three commands exit successfully.

- [ ] **Step 2: Run the code-review checklist**

Check strict typing, exported return types, semantics, reduced motion, color-independent meaning, label contrast, no external assets, no stale reactor references, no unrelated changes, and no `preserveAspectRatio="none"`.

- [ ] **Step 3: Review the final diff**

```bash
git diff --check
git status --short
git diff -- apps/web/src/components/sections/saas docs/superpowers/plans/2026-09-01-saas-verified-core.md
```

Expected: no whitespace errors and only the approved SaaS implementation plus its plan.

### Task 7: Add distinct delivery-stage icons

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.tsx`
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`

- [ ] **Step 1: Write a failing structural test**

Assert that the rendered primary route contains a unique icon marker for every typed delivery-stage ID:

```tsx
it('gives every delivery stage its own recognizable icon', () => {
  const html = renderSection();

  for (const stage of ['code', 'build', 'test', 'deploy']) {
    expect(html).toContain(`data-stage-icon="${stage}"`);
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: FAIL because the stage housings currently render the same core node without `data-stage-icon` markers.

- [ ] **Step 3: Add a typed icon renderer**

Add a focused `StageIcon` helper that accepts `DeliveryStageId` and returns one decorative inline SVG per stage: code brackets, an isometric package, a check-in-ring, and an upward release arrow. Mark each SVG with `data-stage-icon={stage}` and keep the parent diagram `aria-hidden`.

- [ ] **Step 4: Integrate icons without breaking the verified ribbon**

Replace the generic core node inside `StageHousing` with `<StageIcon stage={stage.id} />`. Preserve `coreLine` behind the icon, and style every icon with one cyan-to-mint monoline treatment, identical dimensions, round joins, and a restrained glow.

- [ ] **Step 5: Verify GREEN and run package gates**

```bash
pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx
pnpm --filter @cleanstart/web test
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: all focused and package checks pass, with Code, Build, Test, and Deploy remaining legible at desktop and mobile sizes.

### Task 8: Layer the provenance rail behind stage icons

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`

- [ ] **Step 1: Write a failing paint-order test**

Read the CSS module and assert that `.coreLine` uses `z-index: 0`, `.coreWindow::after` uses `z-index: 1`, and `.stageIcon` uses `z-index: 2`.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx
```

Expected: FAIL because the rail currently has no explicit layer, there is no inner icon-plate mask, and the icon uses `z-index: 1`.

- [ ] **Step 3: Implement the three-layer paint order**

Set the rail to layer 0. Add a `coreWindow::after` pseudo-element inset inside the circular border with an opaque navy radial background at layer 1. Move `.stageIcon` to layer 2. The mask must cover only the circle, leaving the rail visible on either side.

- [ ] **Step 4: Verify GREEN and inspect both responsive diagrams**

Run the focused test, then inspect `/industries/saas-container-security` at 1440 × 900 and 390 × 844. Confirm the rail disappears beneath every circular plate without hiding or shrinking any icon.

- [ ] **Step 5: Run package gates**

```bash
pnpm --filter @cleanstart/web test
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```

Expected: all checks pass and the production build generates the complete site.
