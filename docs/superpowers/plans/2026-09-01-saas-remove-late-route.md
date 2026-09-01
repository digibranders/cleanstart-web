# SaaS Late Route Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the upper late-review route from the SaaS diagram while preserving the verified-components pipeline for the next concept iteration.

**Architecture:** Delete the obsolete decorative route from both responsive render trees and remove its unused styling. Keep the verified route’s component structure and CSS intact, changing only the outer desktop surface height and the accessible sequence list.

**Tech Stack:** Next.js 16, React 19 server components, TypeScript strict mode, CSS Modules, Vitest.

---

### Task 1: Lock the single-route contract

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.test.tsx`

- [ ] Add a test that rejects `data-late-review-path`, `data-security-review="closed"`, and the late-review accessible label while preserving the verified source, ordered stages, open scanner, and approved release exit.
- [ ] Run `pnpm --filter @cleanstart/web test -- src/components/sections/saas/SaasShiftLeft.test.tsx` and confirm the new assertion fails because the late route still renders.

### Task 2: Remove the late route

**Files:**
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.tsx`
- Modify: `apps/web/src/components/sections/saas/SaasVerifiedCore.module.css`
- Modify: `apps/web/src/components/sections/saas/SaasShiftLeft.tsx`

- [ ] Delete the desktop and mobile late-route render helpers and closed-scanner code paths.
- [ ] Remove the obsolete late-route CSS and return animation from normal and reduced-motion states.
- [ ] Collapse the desktop surface minimum height around the unchanged verified route.
- [ ] Remove the obsolete screen-reader-only late-review sequence.
- [ ] Rerun the focused test and confirm it passes.

### Task 3: Verify and review

**Files:**
- Inspect: `/industries/saas-container-security`

- [ ] Visually inspect the section at 1440 × 900 and a representative mobile viewport.
- [ ] Run `pnpm --filter @cleanstart/web lint`, `pnpm --filter @cleanstart/web typecheck`, `pnpm --filter @cleanstart/web test`, and `pnpm --filter @cleanstart/web build`.
- [ ] Review the scoped diff, request code review, address actionable findings, and commit only the SaaS diagram files and these two documents.
