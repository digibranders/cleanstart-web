# SaaS 3D Process Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace outlined SaaS diagram containers with a cohesive three-dimensional process deck without changing the verified pipeline’s meaning.

**Architecture:** Preserve the typed React stage model and responsive render trees. Remove obsolete chrome markup, then implement the 3D system entirely in the co-located CSS module using filled surfaces, pseudo-element faces, occlusion, and offset shadows.

**Tech Stack:** Next.js 16, React 19 server components, TypeScript strict mode, CSS Modules, Vitest, Playwright visual inspection.

---

### Task 1: Lock the 3D material contract

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] Add a test that verifies the source, stage, route, mobile surface, and desktop surface rules do not use perimeter borders.
- [ ] Assert that source and stage modules expose filled top/underside pseudo-elements and use offset soft shadows.
- [ ] Assert that the scanner frame uses no border strokes and exposes a filled arch pseudo-element.
- [ ] Run `pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx` and confirm RED against the current outlined implementation.

### Task 2: Build the process deck

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.tsx`
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`

- [ ] Remove `SurfaceChrome` and its corner/measurement markup.
- [ ] Replace the outer desktop and mobile panel borders with deep filled bases and directional shadows.
- [ ] Replace the verified route outline with a raised top deck and recessed bottom face.
- [ ] Replace source and stage chamfer shells with borderless material faces, illuminated top edges, lower faces, and soft offset elevation.
- [ ] Remove the icon-port and release-badge borders while preserving rail masking and contrast.
- [ ] Rebuild the scanner frame as a solid U-shaped arch with filled pseudo-element geometry.
- [ ] Run the focused SaaS test and confirm GREEN.

### Task 3: Visual refinement and verification

**Files:**
- Inspect: `/industries/saas-container-security`

- [ ] Capture desktop at 1440 × 900 and mobile at 390 × 844 in one bounded inspection pass.
- [ ] Fix any hierarchy, clipping, overflow, or depth defects in one scoped correction batch and perform at most one confirmation pass.
- [ ] Run the Impeccable detector once on the changed UI targets and evaluate findings in context.
- [ ] Run `pnpm --filter @cleanstart/web lint`, `pnpm --filter @cleanstart/web typecheck`, `pnpm --filter @cleanstart/web test`, and `pnpm --filter @cleanstart/web build`.
- [ ] Request focused code review, address actionable findings, and commit only the SaaS diagram files and these documents.
