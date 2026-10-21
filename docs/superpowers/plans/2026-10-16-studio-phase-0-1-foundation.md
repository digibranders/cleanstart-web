# Studio Phase 0 and 1: Design System and Foundation Implementation Plan

> **For agentic workers (any tool):** start with `docs/studio/HANDOFF.md`. Work task by task. In Claude Code, the superpowers:subagent-driven-development or superpowers:executing-plans skills fit this plan; other tools follow the loop in `HANDOFF.md`. Steps use checkbox (`- [ ]`) syntax for tracking. Every task also passes the gates in `docs/studio/05-REVIEW-PROTOCOL.md` before its commit step.

**Goal:** Ship the Studio design system and lab (Phase 0) and a working Studio foundation where redirects and job locations are fully editable (Phase 1), inside `apps/cms`, without touching Payload's admin.

**Architecture:** A new route group `apps/cms/src/app/(studio)` with its own root layout serves `/studio`. Implementation lives in `apps/cms/src/studio/`. Server components and server actions call Payload's Local API through one wrapper that always runs as the signed-in user. Forms are client-side (react-hook-form) and driven by a serializable schema built from the live Payload config. Auth uses Payload's REST endpoints. Read `docs/studio/00-MASTER-PLAN.md` (ADR-1 to ADR-11) before starting.

**Tech Stack:** Next.js 16.2 (App Router, server actions), Payload 3.84 Local API, React 19, Tailwind CSS 4.3, `@cleanstart/ui` primitives, react-hook-form 7, Zod 3, `@phosphor-icons/react` 2 (Light weight), Geist and Geist Mono (`geist` through `next/font`), Vitest 2, Playwright 1.59.

**Prerequisites:** decisions D-1 to D-9 in `docs/studio/00-MASTER-PLAN.md` were signed off on 2026-10-16 and D-10 (direction B) on 2026-10-19. D-6 (author drafting) is implemented in Task 1.19. Before any task, read `docs/studio/HANDOFF.md`, `06-IMPLEMENTER-GUIDE.md` and `10-ENGINEERING-STANDARDS.md`.

---

## Conventions for every task

- Work in the worktree `.claude/worktrees/studio-build` on branch `feat/studio-build` (setup in `docs/studio/HANDOFF.md`), merged into `development` at each phase sign-off. Stage files by path. Never `git add -A`. Commit message format: `feat(studio): T<id> <summary>`.
- Append `started` and `done` lines to `docs/studio/PROGRESS.md` for every task (rules at the top of that file).
- Run commands from the repo root unless a step says otherwise.
- Tests: Vitest, co-located `*.test.ts(x)`, node environment, components tested with `renderToStaticMarkup` (the existing convention, see `apps/cms/src/payload/admin/components/BlogCtaAutoPick.test.tsx`). Interaction is tested in Playwright under `apps/cms/tests/e2e/studio/`, tagged `@studio`.
- Before each commit, run Gate A from `docs/studio/05-REVIEW-PROTOCOL.md` and attach Gate B and Gate C results to the task.
- No em-dashes or en-dashes in any string, comment or doc.

## File map

Created in this plan (all under `apps/cms/` unless noted):

```
postcss.config.mjs                              Tailwind v4 PostCSS plugin
public/studio/hero-grid.svg                     Sign-in brand panel grid (copied from apps/web)
src/app/(studio)/layout.tsx                     Studio root layout (html, theme bootstrap, styles)
src/app/(studio)/studio/lab/page.tsx            Component lab (S-50)
src/app/(studio)/studio/login/page.tsx          S-01
src/app/(studio)/studio/forgot-password/page.tsx  S-02
src/app/(studio)/studio/reset-password/[token]/page.tsx  S-03
src/app/(studio)/studio/forbidden/page.tsx      S-51 (outside the signed-in group)
src/app/(studio)/studio/(app)/layout.tsx        Signed-in shell
src/app/(studio)/studio/(app)/page.tsx          Home placeholder (dashboard is Phase 6)
src/app/(studio)/studio/(app)/not-found.tsx, error.tsx  S-51
src/app/(studio)/studio/(app)/account/page.tsx  S-04
src/app/(studio)/studio/(app)/collections/[collection]/page.tsx        S-10
src/app/(studio)/studio/(app)/collections/[collection]/new/page.tsx    S-11
src/app/(studio)/studio/(app)/collections/[collection]/[id]/page.tsx   S-12
src/studio/styles/{studio.css,tokens.css,primitives.css,tokens.test.ts}
src/studio/lib/{cn.ts,next-path.ts,next-path.test.ts,format-date.ts,format-date.test.ts}
src/studio/theme/{ThemeProvider.tsx,IconDefaults.tsx,theme-script.ts,theme-script.test.ts}
src/studio/ui/*.tsx (+ ui.test.tsx, index.ts, Rail.tsx)  Design system components, PageHeader included
src/studio/lab/{LabFrame.tsx,demos.tsx,LabPage.tsx,compositions/*}  Lab and the two compositions
src/studio/server/{session.ts,payload.ts,errors.ts,errors.test.ts,permissions.ts,permissions.test.ts,nav.ts,nav.test.ts,readiness.ts}
src/studio/server/schema/{types.ts,build-schema.ts,build-schema.test.ts}
src/studio/server/loaders/{list.ts,list.test.ts,related-titles.ts,document.ts,shell.ts}
src/studio/server/actions/{document.ts,preferences.ts,account.ts,slug.ts}
src/studio/form/engine/{types.ts,paths.ts,validation.ts,engine.test.ts,StudioFormContext.tsx,useStudioField.ts,Conditional.tsx}
src/studio/form/fields/{GenericField.tsx,basic.tsx,basic.test.tsx,PendingField.tsx}
src/studio/form/{registry-manifest.ts,registry.tsx,registry.test.ts,RenderFields.tsx}
src/studio/list/{ListView.tsx,DataTable.tsx,ListToolbar.tsx,Pagination.tsx,Cell.tsx}
src/studio/document/{EditView.tsx,DocumentHeader.tsx,PublishControl.tsx,SaveStatus.tsx,ValidationSummary.tsx,TitleField.tsx,useUnsavedGuard.ts,build-patch.ts,build-patch.test.ts,slug-status.tsx}
src/studio/shell/{AppShell.tsx,Sidebar.tsx,UserMenu.tsx,SkipLink.tsx,BrandMark.tsx}
src/studio/features/publishing/{SlugField.tsx,slug-state.ts,slug-state.test.ts}
src/studio/features/account/AccountForm.tsx
src/studio/features/auth/{AuthCard.tsx,BrandPanel.tsx,LoginForm.tsx,ForgotForm.tsx,ResetForm.tsx,auth-errors.ts,auth-errors.test.ts}
src/studio/test/server-only-stub.ts
src/payload/admin-logic/{field-helpers.ts,conditions.ts,validators.ts,validator-registry.ts,registry.test.ts}
src/payload/fields/created-by.ts
src/payload/access/author-drafts.test.ts
src/migrations/20261016_120000_add_created_by.ts
scripts/check-studio-boundaries.ts
scripts/check-studio-coverage.ts
scripts/studio-inventory.ts
scripts/seed-studio-e2e-users.ts
scripts/richtext-census.ts
tests/e2e/studio/*.spec.ts, helpers.ts
packages/ui/src/primitives/{date-grid-keys.ts,date-grid-keys.test.ts}  (repo root, not apps/cms)
```

Not created in Phases 0 and 1 (later phases add them): a column menu component, per-type cell files, document shortcut hooks, a shortcut sheet, nav group components. The list's column picker lives in `ListToolbar.tsx` and every cell in `Cell.tsx`.

Modified: `apps/cms/package.json` (dependencies, scripts), `apps/cms/vitest.config.ts` (aliases), `apps/cms/.env.example` (`STUDIO_E2E_PASSWORD`), `apps/cms/src/payload/lib/wire-custom-fields.ts` (export override maps), every collection, global, field and block file that has an inline `admin.condition` or a pure `validate` (Task 1.6, including `fields/slug.ts` and the helper moves in `Forms.ts`, `Integrations.ts` and `Media.ts`), `apps/cms/src/payload/access/index.ts`, `Blogs.ts`, `News.ts`, `Guides.ts`, `KnowledgeBase.ts`, `Resources.ts` and `Media.ts` (Task 1.19), `apps/cms/src/migrations/index.ts`, `apps/cms/src/payload-types.ts` (regenerated), `apps/cms/src/app/(payload)/styles/_ui-primitives.scss` (date grid rows, Task 0.8), `packages/ui/src/primitives/DateTimePicker.tsx` (keyboard grid, Task 0.8), `packages/ui/src/primitives/Tooltip.tsx` (keeps the child's ref, Task 0.6), `packages/ui/src/primitives/Toast.tsx` (close glyph, Task 0.8), `docs/studio/00-MASTER-PLAN.md` (Task 0.1), `.github/workflows/ci.yml` (CI steps, Task 1.18).

---

# Phase 0: decisions, design system and lab

### Task 0.1: Record the signed-off decisions

**Files:**
- Modify: `docs/studio/00-MASTER-PLAN.md` (the "Decisions" section)

- [x] **Step 1: Add the outcome of each decision**

Done on 2026-10-16: the master plan's "Decisions (signed off 2026-10-16)" section records every outcome. All match the recommendations except D-6 (author own-draft editing, plus author media uploads), which adds Task 1.19 to this plan. No other task changes.

- [ ] **Step 2: Commit**

```bash
git add docs/studio/00-MASTER-PLAN.md
git commit -m "docs(studio): T0.1 record signed-off decisions"
```

### Task 0.2: Tailwind, fonts and the Studio root layout

**Files:**
- Modify: `apps/cms/package.json`
- Create: `apps/cms/postcss.config.mjs`
- Create: `apps/cms/src/app/(studio)/layout.tsx`
- Create: `apps/cms/src/studio/styles/studio.css` (minimal, completed in Task 0.3)
- Create: `apps/cms/src/app/(studio)/studio/lab/page.tsx` (placeholder, completed in Task 0.7)

- [ ] **Step 1: Record a baseline of the Payload admin CSS**

The PostCSS plugin must not change Payload's admin styles. Capture the built admin CSS before adding it.

```bash
pnpm --filter @cleanstart/cms build
find apps/cms/.next/static -name '*.css' -exec shasum {} \; | sort > /tmp/studio-css-before.txt
wc -l /tmp/studio-css-before.txt
```

Expected: a non-zero line count.

- [ ] **Step 2: Add dependencies**

```bash
pnpm --filter @cleanstart/cms add -D tailwindcss@4.3.0 @tailwindcss/postcss@4.3.0
pnpm --filter @cleanstart/cms add geist@^1 @phosphor-icons/react@^2
```

Expected: `apps/cms/package.json` lists the four packages; `pnpm-lock.yaml` updated.

- [ ] **Step 3: Create the PostCSS config**

`apps/cms/postcss.config.mjs`:

```js
// Tailwind v4 only transforms stylesheets that use its directives. The only
// such file is src/studio/styles/studio.css, imported by the Studio root layout.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 4: Create the minimal Studio stylesheet**

`apps/cms/src/studio/styles/studio.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Create the Studio root layout**

`apps/cms/src/app/(studio)/layout.tsx`:

```tsx
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

import '@/studio/styles/studio.css';

export const metadata: Metadata = {
  title: { default: 'CleanStart Studio', template: '%s · CleanStart Studio' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// next/font serves the Geist files from /_next/static/media (same origin, so the CSP allows them)
// and exposes them as --font-geist-sans and --font-geist-mono, which tokens.css reads.
export default function StudioRootLayout({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create a placeholder lab page behind a flag**

`apps/cms/src/app/(studio)/studio/lab/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

export default function LabPage(): ReactElement {
  if (process.env.STUDIO_LAB !== 'true') notFound();
  return <main className="p-8">Studio lab</main>;
}
```

- [ ] **Step 7: Verify the Studio route renders and Payload admin CSS is unchanged**

```bash
pnpm --filter @cleanstart/cms build
find apps/cms/.next/static -name '*.css' -exec shasum {} \; | sort > /tmp/studio-css-after.txt
diff <(grep -v studio /tmp/studio-css-before.txt | awk '{print $1}') <(grep -v studio /tmp/studio-css-after.txt | awk '{print $1}') | grep '^<' | wc -l
```

Expected: `0` lines starting with `<` once Studio-only chunks are excluded. If any Payload chunk hash changed, open both versions, find the difference, and scope the plugin (for example by moving the import to a CSS file with `@source none` or restricting via `@tailwindcss/postcss` `base`) until the count is 0.

Then check the routes against the dev server. `STUDIO_LAB` is read by the server, so it must be set when the server starts, not on the `curl` line. If the running dev server was started without it, start a fresh one with `STUDIO_LAB=true pnpm --filter @cleanstart/cms dev` (on a free port per the dev server policy), then run:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/studio/lab
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/admin/login
```

Expected: `200` for the lab when the dev server was started with `STUDIO_LAB=true`, `404` otherwise; `200` for `/admin/login`.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/package.json pnpm-lock.yaml apps/cms/postcss.config.mjs apps/cms/src/app/\(studio\)/layout.tsx apps/cms/src/app/\(studio\)/studio/lab/page.tsx apps/cms/src/studio/styles/studio.css
git commit -m "feat(studio): T0.2 Tailwind, fonts and Studio root layout"
```

### Task 0.3: Tokens, Tailwind theme and the theme bootstrap

**Files:**
- Create: `apps/cms/src/studio/styles/tokens.css`
- Modify: `apps/cms/src/studio/styles/studio.css`
- Create: `apps/cms/src/studio/theme/theme-script.ts`
- Create: `apps/cms/src/studio/theme/theme-script.test.ts`
- Create: `apps/cms/src/studio/theme/ThemeProvider.tsx`
- Create: `apps/cms/src/studio/theme/IconDefaults.tsx`
- Modify: `apps/cms/src/app/(studio)/layout.tsx`

- [ ] **Step 1: Write the failing test for theme resolution**

`apps/cms/src/studio/theme/theme-script.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { THEME_STORAGE_KEY, parsePreference, resolveTheme } from './theme-script';

describe('parsePreference', () => {
  it('accepts the three stored values', () => {
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference('system')).toBe('system');
  });

  it('falls back to system for anything else', () => {
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference('blue')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('follows the system when the preference is system', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
  });

  it('uses an explicit preference over the system', () => {
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });
});

it('uses a namespaced storage key', () => {
  expect(THEME_STORAGE_KEY).toBe('studio-theme');
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/theme/theme-script.test.ts`
Expected: FAIL, cannot find module `./theme-script`.

- [ ] **Step 3: Implement the theme helpers and the inline bootstrap**

`apps/cms/src/studio/theme/theme-script.ts`:

```ts
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'studio-theme';

export const parsePreference = (value: string | null): ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system' ? value : 'system';

export const resolveTheme = (preference: ThemePreference, systemPrefersLight: boolean): ResolvedTheme => {
  if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
  return preference;
};

// Runs in <head> before first paint so the page never flashes the wrong theme.
// It mirrors parsePreference and resolveTheme; the test above covers the logic.
export const THEME_BOOTSTRAP = `(function(){try{var v=localStorage.getItem('${THEME_STORAGE_KEY}');var p=v==='light'||v==='dark'?v:'system';var l=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.dataset.theme=p==='system'?(l?'light':'dark'):p;}catch(e){}})();`;
```

- [ ] **Step 4: Run the test and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/theme/theme-script.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Create the tokens file**

`apps/cms/src/studio/styles/tokens.css` (values from `docs/studio/01-DESIGN-SYSTEM.md`; Tailwind reads them through `studio.css`):

```css
/* Studio design tokens. Source of truth: docs/studio/01-DESIGN-SYSTEM.md.
   Theme-independent values first, then one block per theme. Radius and type
   sizes live in the Tailwind @theme in studio.css. Shadows are named
   --elevation-* here and exposed to Tailwind as shadow-raised, shadow-sheet,
   shadow-popover and shadow-dialog.
   Theme blocks also match any [data-theme] container so the lab can show
   both themes side by side. */

:root {
  --font-ui: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-code: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;

  --control-sm: 24px;
  --control-md: 28px;
  --control-lg: 32px;
  --space-label: 6px;

  --sidebar-width: 232px;
  --sidebar-collapsed-width: 56px;
  --sheet-inset: 8px;
  --rail-width: 320px;
  --rail-min-width: 280px;
  --rail-max-width: 440px;
  --content-max-width: 680px;
  --document-header-height: 54px;

  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 200ms;
  --ease-out: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  --z-sticky: 10;
  --z-sidebar: 20;
  --z-header: 30;
  --z-popover: 40;
  --z-dialog: 50;
  --z-toast: 60;
  --z-palette: 70;

  /* Sign-in brand panel only: the website's dark band, the same in both themes. */
  --brand-band: linear-gradient(180deg, #151021 0%, #131e8f 62.5%, #471ec0 100%);
  --brand-glow-violet: rgb(106 61 240 / 0.45);
  --brand-glow-blue: rgb(7 110 255 / 0.35);
  --brand-glow-pink: rgb(223 155 255 / 0.25);
  --brand-ink: #131e8f;
  --brand-accent: #df9bff;
  --brand-chip: rgb(255 255 255 / 0.08);
  --brand-chip-text: rgb(255 255 255 / 0.78);
}

:root[data-theme='dark'],
[data-theme='dark'] {
  color-scheme: dark;
  --bg-canvas: #0b0b0c;
  --bg-surface: #141415;
  --bg-raised: #19191b;
  --bg-overlay: #1f1f22;
  --bg-hover: rgb(255 255 255 / 0.04);
  --bg-active: rgb(255 255 255 / 0.07);
  --border-subtle: rgb(255 255 255 / 0.06);
  --border: rgb(255 255 255 / 0.1);
  --border-strong: rgb(255 255 255 / 0.16);
  --border-control: #6b6d75;
  --text-primary: #f2f2f3;
  --text-secondary: #a5a5ab;
  --text-tertiary: #929299;
  --text-disabled: #4d4e55;
  --primary: #f2f2f3;
  --primary-hover: #ffffff;
  --on-primary: #121214;
  --accent: #8ea0ff;
  --accent-hover: #a5b3ff;
  --on-accent: #0b0b0c;
  --accent-text: #8ea0ff;
  --accent-soft: rgb(142 160 255 / 0.12);
  --focus-ring: #8ea0ff;
  --success: #3ecf8e;
  --success-soft: rgb(62 207 142 / 0.12);
  --warning: #f5a524;
  --warning-soft: rgb(245 165 36 / 0.12);
  --danger: #f2555a;
  --danger-soft: rgb(242 85 90 / 0.12);
  --elevation-raised: 0 0 0 1px var(--border-subtle), 0 1px 2px rgb(0 0 0 / 0.3);
  --elevation-sheet: 0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.04), 0 24px 56px -20px rgb(0 0 0 / 0.7);
  --elevation-popover: 0 0 0 1px rgb(255 255 255 / 0.09), inset 0 1px 0 rgb(255 255 255 / 0.06), 0 24px 64px -12px rgb(0 0 0 / 0.75);
  --elevation-dialog: 0 0 0 1px rgb(255 255 255 / 0.09), 0 32px 80px -16px rgb(0 0 0 / 0.8);
  --backdrop: rgb(9 9 11 / 0.6);
  --glass: rgb(30 30 35 / 0.72);
}

:root[data-theme='light'],
[data-theme='light'] {
  color-scheme: light;
  --bg-canvas: #efefed;
  --bg-surface: #ffffff;
  --bg-raised: #f8f8f7;
  --bg-overlay: #ffffff;
  --bg-hover: rgb(18 18 20 / 0.04);
  --bg-active: rgb(18 18 20 / 0.07);
  --border-subtle: rgb(18 18 20 / 0.06);
  --border: rgb(18 18 20 / 0.1);
  --border-strong: rgb(18 18 20 / 0.16);
  --border-control: #82848c;
  --text-primary: #121214;
  --text-secondary: #4d4d53;
  --text-tertiary: #68686e;
  --text-disabled: #b4b5bb;
  --primary: #121214;
  --primary-hover: #2a2a2e;
  --on-primary: #ffffff;
  --accent: #3451e6;
  --accent-hover: #2a44cf;
  --on-accent: #ffffff;
  --accent-text: #3451e6;
  --accent-soft: rgb(52 81 230 / 0.07);
  --focus-ring: #3451e6;
  --success: #12733a;
  --success-soft: rgb(18 115 58 / 0.09);
  --warning: #9a4a06;
  --warning-soft: rgb(154 74 6 / 0.09);
  --danger: #c01c1c;
  --danger-soft: rgb(192 28 28 / 0.08);
  --elevation-raised: 0 0 0 1px var(--border-subtle), 0 1px 3px rgb(18 18 20 / 0.06);
  --elevation-sheet: 0 0 0 1px rgb(18 18 20 / 0.06), 0 1px 2px rgb(18 18 20 / 0.04), 0 16px 40px -18px rgb(18 18 20 / 0.18);
  --elevation-popover: 0 0 0 1px rgb(18 18 20 / 0.08), 0 2px 6px rgb(18 18 20 / 0.06), 0 18px 48px -12px rgb(18 18 20 / 0.22);
  --elevation-dialog: 0 0 0 1px rgb(18 18 20 / 0.08), 0 32px 80px -20px rgb(18 18 20 / 0.3);
  --backdrop: rgb(239 239 237 / 0.55);
  --glass: rgb(255 255 255 / 0.72);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
}
```

- [ ] **Step 6: Map the tokens into Tailwind and remove Tailwind's default palette**

Replace `apps/cms/src/studio/styles/studio.css` with:

```css
@import "tailwindcss";
@import "./tokens.css";

/* Remove Tailwind's defaults so only Studio tokens produce utilities.
   bg-blue-500, text-sm and shadow-lg no longer exist here. rounded-xl
   still works because the Studio radius scale below redefines it. */
@theme {
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;

  /* Plain white and black, used only on the sign-in brand panel (Task 1.11). */
  --color-white: #ffffff;
  --color-black: #000000;

  --radius-xs: 5px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  --text-display: 28px;
  --text-display--line-height: 34px;
  --text-display--font-weight: 600;
  --text-display--letter-spacing: -0.03em;
  --text-title: 18px;
  --text-title--line-height: 26px;
  --text-title--font-weight: 600;
  --text-title--letter-spacing: -0.02em;
  --text-heading: 14px;
  --text-heading--line-height: 20px;
  --text-heading--font-weight: 600;
  --text-heading--letter-spacing: -0.01em;
  --text-body: 13px;
  --text-body--line-height: 20px;
  --text-body--font-weight: 400;
  --text-body-strong: 13px;
  --text-body-strong--line-height: 20px;
  --text-body-strong--font-weight: 500;
  --text-small: 12px;
  --text-small--line-height: 16px;
  --text-small--font-weight: 400;
  --text-micro: 11px;
  --text-micro--line-height: 14px;
  --text-micro--font-weight: 500;
  --text-mono: 12px;
  --text-mono--line-height: 18px;
  --text-mono--letter-spacing: -0.01em;
  --text-doc-title: 40px;
  --text-doc-title--line-height: 46px;
  --text-doc-title--font-weight: 600;
  --text-doc-title--letter-spacing: -0.035em;
  --text-doc-lead: 17px;
  --text-doc-lead--line-height: 27px;
  --text-doc-body: 16px;
  --text-doc-body--line-height: 27px;
  --text-doc-body--letter-spacing: -0.003em;
  --text-doc-h2: 22px;
  --text-doc-h2--line-height: 30px;
  --text-doc-h2--font-weight: 600;
  --text-doc-h2--letter-spacing: -0.02em;
  --text-doc-h3: 18px;
  --text-doc-h3--line-height: 26px;
  --text-doc-h3--font-weight: 600;
  --text-doc-h3--letter-spacing: -0.015em;
  --text-doc-h4: 16px;
  --text-doc-h4--line-height: 24px;
  --text-doc-h4--font-weight: 600;
  --text-doc-h4--letter-spacing: -0.01em;
  --text-brand: 76px;
  --text-brand--line-height: 92px;
  --text-brand--font-weight: 600;
  --text-brand--letter-spacing: -0.045em;
}

@theme inline {
  --font-ui: var(--font-ui);
  --font-code: var(--font-code);

  --color-canvas: var(--bg-canvas);
  --color-surface: var(--bg-surface);
  --color-raised: var(--bg-raised);
  --color-overlay: var(--bg-overlay);
  --color-hover: var(--bg-hover);
  --color-active: var(--bg-active);
  --color-line-subtle: var(--border-subtle);
  --color-line: var(--border);
  --color-line-strong: var(--border-strong);
  --color-line-control: var(--border-control);
  --color-fg: var(--text-primary);
  --color-fg-muted: var(--text-secondary);
  --color-fg-subtle: var(--text-tertiary);
  --color-fg-disabled: var(--text-disabled);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-on-primary: var(--on-primary);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-on-accent: var(--on-accent);
  --color-accent-fg: var(--accent-text);
  --color-accent-soft: var(--accent-soft);
  --color-focus: var(--focus-ring);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-backdrop: var(--backdrop);
  --color-glass: var(--glass);

  --shadow-raised: var(--elevation-raised);
  --shadow-sheet: var(--elevation-sheet);
  --shadow-popover: var(--elevation-popover);
  --shadow-dialog: var(--elevation-dialog);
}

@layer base {
  html {
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--bg-canvas);
    color: var(--text-primary);
  }

  body {
    font-size: 13px;
    line-height: 20px;
  }

  :focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  code,
  kbd,
  samp,
  pre {
    font-family: var(--font-code);
  }

  .tabular {
    font-variant-numeric: tabular-nums;
  }
}

@import "./primitives.css";
```

There is no `@font-face` here: `geist/font/sans` and `geist/font/mono` are `next/font/local` wrappers, so Next emits the faces and serves the files from `/_next/static/media` (same origin, allowed by `font-src 'self'`). The root layout puts their `variable` classes on `<html>`, which defines `--font-geist-sans` and `--font-geist-mono`.

- [ ] **Step 7: Create the theme provider**

`apps/cms/src/studio/theme/ThemeProvider.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
  parsePreference,
  resolveTheme,
} from './theme-script';

type ThemeContextValue = {
  readonly preference: ThemePreference;
  readonly resolved: ResolvedTheme;
  readonly setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readStored = (): ThemePreference => {
  try {
    return parsePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
};

export function ThemeProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemLight, setSystemLight] = useState(false);
  // The bootstrap script already set data-theme; writing before the stored choice is read would flash.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferenceState(readStored());
    const query = window.matchMedia('(prefers-color-scheme: light)');
    setSystemLight(query.matches);
    setReady(true);
    const onChange = (event: MediaQueryListEvent): void => setSystemLight(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved = resolveTheme(preference, systemLight);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = resolved;
  }, [ready, resolved]);

  const setPreference = useCallback((next: ThemePreference): void => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice lasts for this page only.
    }
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};
```

`apps/cms/src/studio/theme/IconDefaults.tsx` (D-2: Light weight everywhere, set once):

```tsx
'use client';

import { IconContext } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';

const DEFAULTS: IconProps = { weight: 'light', size: 16 };

export function IconDefaults({ children }: { readonly children: ReactNode }): ReactElement {
  return <IconContext.Provider value={DEFAULTS}>{children}</IconContext.Provider>;
}
```

Icons imported from `@phosphor-icons/react` read this context. Icons imported from `@phosphor-icons/react/dist/ssr` (server components) cannot read context, so every SSR icon in Studio passes `weight="light"` itself.

- [ ] **Step 8: Wire the bootstrap and provider into the root layout**

Replace `apps/cms/src/app/(studio)/layout.tsx` with:

```tsx
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

import { IconDefaults } from '@/studio/theme/IconDefaults';
import { ThemeProvider } from '@/studio/theme/ThemeProvider';
import { THEME_BOOTSTRAP } from '@/studio/theme/theme-script';

import '@/studio/styles/studio.css';

export const metadata: Metadata = {
  title: { default: 'CleanStart Studio', template: '%s · CleanStart Studio' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function StudioRootLayout({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap with no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="bg-canvas text-fg">
        <ThemeProvider>
          <IconDefaults>{children}</IconDefaults>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Verify**

Run the test again (Step 4). Build (`pnpm --filter @cleanstart/cms build`). With `STUDIO_LAB=true`, open `/studio/lab` in the browser pane at 1440×900, toggle the OS theme (or set `localStorage['studio-theme']`), reload, and confirm the window background switches between `#0b0b0c` and `#efefed` with no flash, and that text renders in Geist (DevTools, Computed, rendered font).

- [ ] **Step 10: Commit**

```bash
git add apps/cms/src/studio/styles apps/cms/src/studio/theme apps/cms/src/app/\(studio\)/layout.tsx
git commit -m "feat(studio): T0.3 tokens, Tailwind theme and theme bootstrap"
```

### Task 0.4: Token contrast test

**Files:**
- Create: `apps/cms/src/studio/styles/tokens.test.ts`

- [ ] **Step 1: Write the test**

`apps/cms/src/studio/styles/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf8');

const themeBlock = (theme: 'dark' | 'light'): Record<string, string> => {
  // Each theme block is `:root[data-theme='x'],\n[data-theme='x'] { ... }` so the lab can
  // nest a theme inside a container; the regex anchors on the last selector.
  const match = css.match(new RegExp(`\\n\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`));
  if (!match?.[1]) throw new Error(`No ${theme} block in tokens.css`);
  const entries = [...match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(
    (m): [string, string] => [m[1] ?? '', (m[2] ?? '').trim()],
  );
  return Object.fromEntries(entries);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};

const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const SURFACES = ['bg-canvas', 'bg-surface', 'bg-raised', 'bg-overlay'] as const;
const TEXT_AA = ['text-primary', 'text-secondary', 'text-tertiary', 'accent-text', 'success', 'warning', 'danger'] as const;
const NON_TEXT_3 = ['border-control', 'focus-ring'] as const;
const FILLS = [
  ['on-primary', 'primary'],
  ['on-accent', 'accent'],
] as const;

describe.each(['dark', 'light'] as const)('%s theme contrast', (theme) => {
  const t = themeBlock(theme);
  const get = (name: string): string => {
    const value = t[name];
    if (!value) throw new Error(`Missing --${name} in the ${theme} block`);
    return value;
  };

  for (const surface of SURFACES) {
    for (const text of TEXT_AA) {
      it(`${text} on ${surface} is at least 4.5:1`, () => {
        expect(contrast(get(text), get(surface))).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const token of NON_TEXT_3) {
      it(`${token} on ${surface} is at least 3:1`, () => {
        expect(contrast(get(token), get(surface))).toBeGreaterThanOrEqual(3);
      });
    }
  }

  for (const [text, fill] of FILLS) {
    it(`${text} on ${fill} is at least 4.5:1`, () => {
      expect(contrast(get(text), get(fill))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/styles/tokens.test.ts`
Expected: PASS (76 tests). The values were pre-checked on 2026-10-19; the smallest margins are `--border-control` on dark `--bg-overlay` at 3.19:1, `--border-control` on the light window at 3.24:1 and `--text-tertiary` on the light window at 4.81:1. Any later token change that fails this test is fixed in `tokens.css` and `01-DESIGN-SYSTEM.md` together.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/studio/styles/tokens.test.ts
git commit -m "test(studio): T0.4 token contrast checks"
```

### Task 0.5: Restyle the shared primitives for Studio

`@cleanstart/ui` primitives emit `cs-*` class names and expect the host app to style them (`docs/studio/research/design-inputs.md` §1). Studio styles them from its own tokens. Payload's admin keeps its own styles in `_ui-primitives.scss`; the two never load together because they live in different root layouts.

**Files:**
- Create: `apps/cms/src/studio/styles/primitives.css`

- [ ] **Step 1: Write the stylesheet**

`apps/cms/src/studio/styles/primitives.css`:

```css
/* Studio styles for the @cleanstart/ui primitives. Class names come from
   packages/ui/src/primitives/*. Tokens only; see docs/studio/01-DESIGN-SYSTEM.md. */

@layer components {
  /* Buttons used inside primitives (ConfirmDialog, QuickCreateDialog). */
  .cs-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: var(--control-lg);
    padding: 0 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-size: 13px;
    line-height: 20px;
    font-weight: 500;
    white-space: nowrap;
    transition: background-color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
  }
  .cs-btn:hover { border-color: var(--border-strong); }
  .cs-btn:active { transform: scale(0.98); }
  .cs-btn:disabled { opacity: 0.5; pointer-events: none; }
  .cs-btn--primary { background: var(--primary); border-color: transparent; color: var(--on-primary); }
  .cs-btn--primary:hover { background: var(--primary-hover); }
  .cs-btn--subtle { background: transparent; border-color: transparent; color: var(--text-secondary); }
  .cs-btn--subtle:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cs-btn--danger { background: var(--danger); border-color: transparent; color: var(--bg-surface); }
  .cs-btn--danger:hover { filter: brightness(1.08); }

  /* Dialog and Drawer: native <dialog>, top layer. */
  .cs-dialog,
  .cs-drawer {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    max-width: none;
    max-height: none;
  }
  .cs-dialog::backdrop,
  .cs-drawer::backdrop {
    background: var(--backdrop);
    backdrop-filter: blur(8px);
  }
  .cs-dialog { margin: auto; }
  .cs-dialog__panel {
    display: flex;
    flex-direction: column;
    width: min(560px, calc(100vw - 32px));
    max-height: min(85vh, 880px);
    background: var(--bg-overlay);
    border-radius: var(--radius-lg);
    box-shadow: var(--elevation-dialog);
    overflow: hidden;
  }
  .cs-dialog--sm { width: min(400px, calc(100vw - 32px)); }
  .cs-dialog--md { width: min(560px, calc(100vw - 32px)); }
  .cs-dialog--lg { width: min(720px, calc(100vw - 32px)); }
  .cs-dialog--xl { width: min(960px, calc(100vw - 32px)); }
  .cs-dialog--full { width: calc(100vw - 32px); height: calc(100vh - 32px); max-height: none; }
  .cs-dialog[open] .cs-dialog__panel { animation: studio-dialog-in var(--duration-slow) var(--ease-out); }

  .cs-dialog__header,
  .cs-drawer__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px 12px;
  }
  .cs-dialog__heading,
  .cs-drawer__heading { min-width: 0; }
  .cs-dialog__title,
  .cs-drawer__title { font-size: 18px; line-height: 26px; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
  .cs-dialog__description,
  .cs-drawer__subtitle,
  .cs-confirm__description { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 20px; }
  .cs-dialog__close,
  .cs-drawer__close {
    display: inline-grid;
    place-items: center;
    width: var(--control-md);
    height: var(--control-md);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }
  .cs-dialog__close:hover,
  .cs-drawer__close:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cs-dialog__body,
  .cs-drawer__body { padding: 4px 24px 24px; overflow: auto; }
  .cs-dialog__footer,
  .cs-drawer__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 24px;
    border-top: 1px solid var(--border-subtle);
  }
  .cs-drawer__header-actions { display: flex; gap: 8px; }

  /* Drawer.tsx puts the side and size classes on the panel, not the dialog. */
  .cs-drawer { margin: 0 0 0 auto; height: 100vh; }
  .cs-drawer:has(.cs-drawer--left) { margin: 0 auto 0 0; }
  .cs-drawer__panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-overlay);
    box-shadow: var(--elevation-dialog);
  }
  .cs-drawer__panel.cs-drawer--sm { width: min(400px, 100vw); }
  .cs-drawer__panel.cs-drawer--md { width: min(560px, 100vw); }
  .cs-drawer__panel.cs-drawer--lg { width: min(720px, 100vw); }
  .cs-drawer__panel.cs-drawer--xl { width: min(960px, 100vw); }
  .cs-drawer[open] .cs-drawer__panel { animation: studio-drawer-in var(--duration-slow) var(--ease-out); }

  /* Popover, menu, tooltip */
  .cs-popover,
  .cs-menu {
    z-index: var(--z-popover);
    background: var(--bg-overlay);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-popover);
    color: var(--text-primary);
    animation: studio-pop-in var(--duration-base) var(--ease-out);
  }
  .cs-popover { padding: 8px; }
  .cs-menu { min-width: 200px; padding: 4px; }
  /* ContextMenu opens at the pointer; a narrower floor keeps it compact. */
  .cs-menu--context { min-width: 180px; }
  .cs-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--control-md);
    padding: 0 8px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    text-align: left;
    color: var(--text-primary);
  }
  .cs-menu__item:hover,
  .cs-menu__item:focus-visible { background: var(--bg-hover); outline: none; }
  .cs-menu__item.is-disabled { color: var(--text-disabled); pointer-events: none; }
  .cs-menu__item--danger { color: var(--danger); }
  .cs-menu__icon { display: inline-flex; width: 16px; color: var(--text-secondary); }
  .cs-menu__label-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cs-menu__shortcut { font-family: var(--font-code); font-size: 11px; color: var(--text-tertiary); }
  .cs-menu__label { padding: 8px 8px 4px; font-size: 11px; font-weight: 500; color: var(--text-tertiary); }
  .cs-menu__separator { margin: 4px 0; border: 0; border-top: 1px solid var(--border-subtle); }

  .cs-tooltip {
    z-index: var(--z-popover);
    max-width: 280px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--bg-overlay);
    box-shadow: var(--elevation-popover);
    color: var(--text-primary);
    font-size: 12px;
    line-height: 16px;
    pointer-events: none;
  }

  /* Combobox */
  .cs-combobox { display: flex; flex-direction: column; gap: 4px; }
  .cs-combobox__field { position: relative; display: flex; align-items: center; }
  .cs-combobox__input {
    width: 100%;
    height: var(--control-lg);
    padding: 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-control);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-size: 13px;
  }
  .cs-combobox__input::placeholder { color: var(--text-tertiary); }
  .cs-combobox__input:focus { border-color: var(--focus-ring); outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .cs-combobox__loading { position: absolute; right: 8px; }
  .cs-combobox__list { max-height: 320px; overflow: auto; padding: 4px 0; }
  .cs-combobox__empty { padding: 12px 8px; color: var(--text-tertiary); font-size: 13px; }
  .cs-combobox__option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: var(--control-md);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    text-align: left;
    font-size: 13px;
  }
  .cs-combobox__option.is-active { background: var(--bg-hover); }
  .cs-combobox__option.is-selected { color: var(--accent-text); }
  .cs-combobox__option.is-disabled { color: var(--text-disabled); }
  .cs-combobox__thumb { width: 24px; height: 24px; border-radius: var(--radius-xs); object-fit: cover; }
  .cs-combobox__option-text { display: flex; flex-direction: column; min-width: 0; }
  .cs-combobox__option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cs-combobox__option-description { color: var(--text-tertiary); font-size: 12px; line-height: 16px; }

  /* Date and time picker */
  .cs-datetime { position: relative; display: flex; align-items: center; }
  .cs-datetime__trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--control-lg);
    padding: 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-control);
    background: var(--bg-raised);
    font-size: 13px;
    text-align: left;
  }
  .cs-datetime__trigger:hover { border-color: var(--text-tertiary); }
  .cs-datetime__value { font-variant-numeric: tabular-nums; }
  .cs-datetime__placeholder { color: var(--text-tertiary); }
  .cs-datetime__clear {
    position: absolute;
    right: 6px;
    display: inline-grid;
    place-items: center;
    width: var(--control-sm);
    height: var(--control-sm);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
  }
  .cs-datetime__clear:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cs-datetime--has-clear .cs-datetime__trigger { padding-right: 32px; }
  /* The panel renders inside a positioned .cs-popover, which supplies the
     surface, shadow and entry animation. */
  .cs-datetime__panel { width: 280px; padding: 4px; }
  .cs-datetime__panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .cs-datetime__month-year { font-size: 13px; font-weight: 600; }
  .cs-datetime__nav {
    display: inline-grid;
    place-items: center;
    width: var(--control-md);
    height: var(--control-md);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }
  .cs-datetime__nav:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cs-datetime__weekdays,
  .cs-datetime__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cs-datetime__weekdays { margin-bottom: 4px; color: var(--text-tertiary); font-size: 11px; text-align: center; }
  .cs-datetime__day {
    height: 32px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .cs-datetime__day:hover { background: var(--bg-hover); }
  .cs-datetime__day.is-out { color: var(--text-tertiary); }
  .cs-datetime__day.is-today { box-shadow: inset 0 0 0 1px var(--border-strong); }
  .cs-datetime__day.is-selected { background: var(--accent); color: var(--on-accent); }
  .cs-datetime__day.is-blocked { color: var(--text-disabled); pointer-events: none; }
  .cs-datetime__panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-subtle);
  }
  .cs-datetime__time { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .cs-datetime__tz { color: var(--text-tertiary); font-size: 12px; }

  /* Spinner */
  .cs-spinner { display: inline-flex; color: currentColor; }
  .cs-spinner__ring {
    display: block;
    border-radius: var(--radius-full);
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: studio-spin 700ms linear infinite;
  }
  .cs-spinner--sm .cs-spinner__ring { width: 14px; height: 14px; }
  .cs-spinner--md .cs-spinner__ring { width: 20px; height: 20px; }
  .cs-spinner--lg .cs-spinner__ring { width: 28px; height: 28px; }
  .cs-spinner__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Toasts */
  .cs-toast-region {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: var(--z-toast);
    width: 360px;
  }
  .cs-toast-region__list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .cs-toast {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--bg-overlay);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-popover);
    animation: studio-toast-in var(--duration-slow) var(--ease-out);
  }
  .cs-toast::before {
    content: "";
    flex: none;
    width: 3px;
    align-self: stretch;
    border-radius: var(--radius-full);
    background: var(--accent);
  }
  .cs-toast--success::before { background: var(--success); }
  .cs-toast--warning::before { background: var(--warning); }
  .cs-toast--error::before { background: var(--danger); }
  .cs-toast__body { flex: 1; min-width: 0; }
  .cs-toast__title { font-size: 13px; font-weight: 600; }
  .cs-toast__message { font-size: 13px; color: var(--text-secondary); }
  .cs-toast__action { color: var(--accent-text); font-size: 13px; font-weight: 500; }
  .cs-toast__close { color: var(--text-tertiary); }
  .cs-toast__close:hover { color: var(--text-primary); }

  /* Quick create dialog form */
  .cs-quick-create__form { display: flex; flex-direction: column; gap: 20px; }
  .cs-quick-create__field { display: flex; flex-direction: column; gap: var(--space-label); }
  .cs-quick-create__label { font-size: 13px; font-weight: 500; }
  .cs-quick-create__required { color: var(--danger); margin-left: 2px; }
  .cs-quick-create__input,
  .cs-quick-create__select,
  .cs-quick-create__textarea {
    width: 100%;
    min-height: var(--control-lg);
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-control);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-size: 13px;
  }
  .cs-quick-create__hint { color: var(--text-secondary); font-size: 12px; }
  .cs-quick-create__error { color: var(--danger); font-size: 12px; }
  .cs-quick-create__chip {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 6px;
    border-radius: var(--radius-xs);
    font-size: 11px;
    font-weight: 500;
  }
  .cs-quick-create__chip[data-tone='ok'] { background: var(--success-soft); color: var(--success); }
  .cs-quick-create__chip[data-tone='error'] { background: var(--danger-soft); color: var(--danger); }
  .cs-quick-create__group { border-top: 1px solid var(--border-subtle); padding-top: 12px; }
  .cs-quick-create__group-summary { font-size: 13px; font-weight: 500; cursor: pointer; }
  .cs-quick-create__group-body { display: flex; flex-direction: column; gap: 20px; padding-top: 12px; }
}

@keyframes studio-dialog-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes studio-drawer-in { from { transform: translateX(16px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes studio-pop-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes studio-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes studio-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .cs-dialog[open] .cs-dialog__panel,
  .cs-drawer[open] .cs-drawer__panel,
  .cs-popover,
  .cs-menu,
  .cs-toast { animation: none; }
  .cs-spinner__ring { animation-duration: 2s; }
}
```

- [ ] **Step 2: Check every emitted class is styled**

```bash
grep -rhoE "cs-[a-z0-9_-]+(__[a-z0-9-]+)?(--[a-z0-9-]+)?" packages/ui/src/primitives | sort -u > /tmp/emitted.txt
grep -oE "\.cs-[a-z0-9_-]+(__[a-z0-9-]+)?(--[a-z0-9-]+)?" apps/cms/src/studio/styles/primitives.css | sed 's/^\.//' | sort -u > /tmp/styled.txt
comm -23 /tmp/emitted.txt /tmp/styled.txt
```

Expected output: exactly four lines, the dynamic stems `cs-dialog--`, `cs-drawer--`, `cs-spinner--` and `cs-toast--` (their concrete variants are styled). `cs-datetime--has-clear` (DateTimePicker.tsx) and `cs-menu--context` (ContextMenu.tsx) are concrete classes and must not appear; the stylesheet above styles both. Any other name means a missing rule: add it.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/studio/styles/primitives.css
git commit -m "feat(studio): T0.5 Studio styles for shared primitives"
```

### Task 0.6: The Studio UI kit

Presentational components only; nothing here fetches data. Each component follows `docs/studio/01-DESIGN-SYSTEM.md` §7.

**Files:**
- Create: `apps/cms/src/studio/lib/cn.ts`
- Create: `apps/cms/src/studio/ui/Button.tsx`, `IconButton.tsx`, `Kbd.tsx`, `Badge.tsx`, `StatusBadge.tsx`, `Banner.tsx`, `Field.tsx`, `TextInput.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `Switch.tsx`, `RadioGroup.tsx`, `Select.tsx`, `Card.tsx`, `Section.tsx`, `Tabs.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `Avatar.tsx`, `PageHeader.tsx`, `index.ts`
- Modify: `packages/ui/src/primitives/Tooltip.tsx` (keep the child's ref)
- Test: `apps/cms/src/studio/ui/ui.test.tsx`

- [ ] **Step 1: Write the failing tests**

`apps/cms/src/studio/ui/ui.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Avatar, Badge, Banner, Button, Checkbox, EmptyState, Field, IconButton, Kbd, StatusBadge, TextInput } from './index';

const html = (node: Parameters<typeof renderToStaticMarkup>[0]): string => renderToStaticMarkup(node);

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    expect(html(<Button>Save draft</Button>)).toContain('type="button"');
  });

  it('marks itself busy and disabled while loading', () => {
    const out = html(<Button loading>Publish</Button>);
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('disabled=""');
  });

  it('uses the ink fill only for the primary variant', () => {
    expect(html(<Button variant="primary">Publish</Button>)).toContain('bg-primary');
    expect(html(<Button>Cancel</Button>)).not.toContain('bg-primary');
  });
});

describe('IconButton', () => {
  it('requires a label and exposes it to assistive tech', () => {
    expect(html(<IconButton label="More actions" icon={<span />} />)).toContain('aria-label="More actions"');
  });
});

describe('Kbd', () => {
  it('renders each key in its own kbd element', () => {
    expect(html(<Kbd keys={['⌘', 'K']} />).match(/<kbd/g)?.length).toBe(3);
  });
});

describe('Badge and StatusBadge', () => {
  it('renders the tone as a data attribute', () => {
    expect(html(<Badge tone="success">Yes</Badge>)).toContain('data-tone="success"');
  });

  it('pairs every status with a word, not only a colour', () => {
    expect(html(<StatusBadge status="published" />)).toContain('Published');
    expect(html(<StatusBadge status="changed" />)).toContain('Unpublished changes');
    expect(html(<StatusBadge status="draft" />)).toContain('Draft');
  });
});

describe('Banner', () => {
  it('uses role=alert for danger and role=status otherwise', () => {
    expect(html(<Banner tone="danger">Save failed.</Banner>)).toContain('role="alert"');
    expect(html(<Banner tone="info">Locked.</Banner>)).toContain('role="status"');
  });
});

describe('Field', () => {
  it('wires the label, description and error to the control', () => {
    const out = html(
      <Field id="title" label="Title" description="Shown in search results." error="Title is required.">
        <TextInput id="title" />
      </Field>,
    );
    expect(out).toContain('for="title"');
    expect(out).toContain('id="title-description"');
    expect(out).toContain('id="title-error"');
    expect(out).toContain('Title is required.');
  });

  it('marks optional fields in words', () => {
    expect(html(<Field id="caption" label="Caption" optional><TextInput id="caption" /></Field>)).toContain('Optional');
  });
});

describe('TextInput', () => {
  it('sets aria-invalid and aria-describedby when invalid', () => {
    const out = html(<TextInput id="slug" invalid describedBy="slug-error" />);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('aria-describedby="slug-error"');
  });
});

describe('Checkbox', () => {
  it('renders a real checkbox input with its label', () => {
    const out = html(<Checkbox id="featured" label="Featured" />);
    expect(out).toContain('type="checkbox"');
    expect(out).toContain('Featured');
  });
});

describe('EmptyState', () => {
  it('shows a title, a sentence and one action', () => {
    const out = html(<EmptyState title="No blogs yet" description="Blogs you create appear here." action={<Button>New blog</Button>} />);
    expect(out).toContain('No blogs yet');
    expect(out).toContain('New blog');
  });
});

describe('Avatar', () => {
  it('shows initials and hides itself from screen readers when a name is shown next to it', () => {
    const out = html(<Avatar name="Ana Ramos" decorative />);
    expect(out).toContain('AR');
    expect(out).toContain('aria-hidden="true"');
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/ui/ui.test.tsx`
Expected: FAIL, cannot resolve `./index`.

- [ ] **Step 3: Implement `cn`**

`apps/cms/src/studio/lib/cn.ts`:

```ts
export const cn = (...parts: ReadonlyArray<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');
```

- [ ] **Step 4: Implement the components**

`apps/cms/src/studio/ui/Button.tsx`:

```tsx
import { Spinner } from '@cleanstart/ui';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly loading?: boolean;
  readonly children: ReactNode;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-fg border border-line shadow-raised hover:bg-raised',
  ghost: 'text-fg-muted hover:bg-hover hover:text-fg',
  danger: 'bg-raised text-danger border border-line hover:bg-danger-soft',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-6 gap-1 px-2 text-small',
  md: 'h-7 gap-1.5 px-2.5 text-body-strong',
  lg: 'h-8 gap-2 px-3 text-body-strong',
  // Sign-in screens only (design system §7.1).
  xl: 'h-10 gap-2 px-4 text-body-strong',
};

export const buttonClass = (variant: ButtonVariant, size: ButtonSize, extra?: string): string =>
  cn(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm',
    'transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-(--ease-out)',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    VARIANT[variant],
    SIZE[size],
    extra,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" label="Working" /> : icon}
      {children}
    </button>
  );
});
```

`apps/cms/src/studio/ui/IconButton.tsx`:

```tsx
import { Tooltip } from '@cleanstart/ui';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  readonly label: string;
  readonly icon: ReactNode;
  readonly size?: 'sm' | 'md';
  readonly variant?: 'ghost' | 'secondary';
  readonly pressed?: boolean;
  readonly shortcut?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = 'md', variant = 'ghost', pressed, shortcut, className, type = 'button', ...rest },
  ref,
) {
  return (
    <Tooltip content={shortcut ? `${label}  ${shortcut}` : label}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          'inline-grid shrink-0 place-items-center rounded-sm text-fg-muted transition-colors duration-(--duration-fast)',
          'hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-50',
          'aria-pressed:bg-active aria-pressed:text-fg',
          size === 'sm' ? 'size-6' : 'size-7',
          variant === 'secondary' && 'border border-line bg-raised',
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    </Tooltip>
  );
});
```

`apps/cms/src/studio/ui/Kbd.tsx`:

```tsx
import type { ReactElement } from 'react';

export function Kbd({ keys }: { readonly keys: readonly string[] }): ReactElement {
  return (
    <kbd className="inline-flex items-center gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-grid h-5 min-w-5 place-items-center rounded-xs bg-raised px-1 font-code text-micro text-fg-muted shadow-[inset_0_-1px_0_var(--border)]"
        >
          {key}
        </kbd>
      ))}
    </kbd>
  );
}
```

`apps/cms/src/studio/ui/Badge.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONE: Record<BadgeTone, string> = {
  neutral: 'border border-line-subtle bg-raised text-fg-muted',
  accent: 'bg-accent-soft text-accent-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function Badge({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  children,
}: {
  readonly tone?: BadgeTone;
  readonly size?: 'sm' | 'md';
  readonly dot?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-micro',
        size === 'sm' ? 'h-5' : 'h-6',
        TONE[tone],
      )}
    >
      {dot ? <span aria-hidden="true" className={cn('size-1.5 rounded-full', DOT[tone])} /> : null}
      {children}
    </span>
  );
}
```

`apps/cms/src/studio/ui/StatusBadge.tsx`:

```tsx
import { CheckCircle, CircleDashed, CircleHalf, Clock } from '@phosphor-icons/react/dist/ssr';
import type { ReactElement } from 'react';

export type DocumentStatus = 'draft' | 'published' | 'changed' | 'scheduled';

const LABEL: Record<DocumentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  changed: 'Unpublished changes',
  scheduled: 'Scheduled',
};

// Design system §2.4: a glyph plus a word, never colour alone. Published is the one fill-weight icon.
const GLYPH: Record<DocumentStatus, ReactElement> = {
  draft: <CircleDashed size={14} weight="light" aria-hidden="true" className="shrink-0 text-fg-subtle" />,
  changed: <CircleHalf size={14} weight="light" aria-hidden="true" className="shrink-0 text-warning" />,
  published: <CheckCircle size={14} weight="fill" aria-hidden="true" className="shrink-0 text-success" />,
  scheduled: <Clock size={14} weight="light" aria-hidden="true" className="shrink-0 text-accent-fg" />,
};

export function StatusBadge({
  status,
  detail,
}: {
  readonly status: DocumentStatus;
  readonly detail?: string | undefined;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 text-small text-fg-muted">
      {GLYPH[status]}
      {detail ? `${LABEL[status]} · ${detail}` : LABEL[status]}
    </span>
  );
}
```

`apps/cms/src/studio/ui/Banner.tsx`:

```tsx
import { CheckCircle, Info, Warning, WarningOctagon } from '@phosphor-icons/react/dist/ssr';
import type { ReactElement, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

const STYLE: Record<BannerTone, string> = {
  info: 'bg-accent-soft text-fg [&_svg]:text-accent-fg',
  success: 'bg-success-soft text-fg [&_svg]:text-success',
  warning: 'bg-warning-soft text-fg [&_svg]:text-warning',
  danger: 'bg-danger-soft text-fg [&_svg]:text-danger',
};

const ICON: Record<BannerTone, ReactElement> = {
  info: <Info size={16} weight="light" aria-hidden="true" />,
  success: <CheckCircle size={16} weight="light" aria-hidden="true" />,
  warning: <Warning size={16} weight="light" aria-hidden="true" />,
  danger: <WarningOctagon size={16} weight="light" aria-hidden="true" />,
};

export function Banner({
  tone,
  children,
  action,
}: {
  readonly tone: BannerTone;
  readonly children: ReactNode;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-body', STYLE[tone])}
    >
      {ICON[tone]}
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
```

`apps/cms/src/studio/ui/Field.tsx`:

```tsx
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import type { ReactElement, ReactNode } from 'react';

export function Field({
  id,
  label,
  description,
  error,
  optional = false,
  hideLabel = false,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly error?: string | undefined;
  readonly optional?: boolean;
  readonly hideLabel?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  // The label id lets controls that are not labelable (a radio group) use aria-labelledby.
  return (
    <div className="flex flex-col gap-(--space-label)">
      <label id={`${id}-label`} htmlFor={id} className={hideLabel ? 'sr-only' : 'flex items-baseline gap-2 text-body-strong text-fg'}>
        {label}
        {optional ? <span className="text-small text-fg-subtle">Optional</span> : null}
      </label>
      {description ? (
        <p id={`${id}-description`} className="text-small text-fg-muted">
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-small text-danger">
          <WarningCircle size={14} weight="light" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const describedBy = (
  id: string,
  opts: { readonly description?: string | undefined; readonly error?: string | undefined },
): string | undefined =>
  [opts.description ? `${id}-description` : null, opts.error ? `${id}-error` : null].filter(Boolean).join(' ') ||
  undefined;
```

`apps/cms/src/studio/ui/TextInput.tsx`:

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

export const controlClass = (invalid: boolean, extra?: string): string =>
  cn(
    'w-full rounded-sm border bg-raised text-body text-fg placeholder:text-fg-subtle',
    'transition-colors duration-(--duration-fast) hover:border-fg-subtle',
    'focus-visible:border-focus disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:border-transparent read-only:bg-surface read-only:text-fg-muted',
    invalid ? 'border-danger' : 'border-line-control',
    extra,
  );

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  readonly invalid?: boolean;
  readonly describedBy?: string | undefined;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid = false, describedBy, prefix, suffix, className, type = 'text', ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={controlClass(invalid, cn('h-8 px-2.5', prefix ? 'pl-8' : undefined, suffix ? 'pr-8' : undefined, className))}
      {...rest}
    />
  );
  if (!prefix && !suffix) return input;
  return (
    <div className="relative flex items-center">
      {prefix ? <span className="pointer-events-none absolute left-2.5 text-fg-subtle">{prefix}</span> : null}
      {input}
      {suffix ? <span className="absolute right-2 text-fg-subtle">{suffix}</span> : null}
    </div>
  );
});
```

`apps/cms/src/studio/ui/Textarea.tsx`:

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { controlClass } from './TextInput';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  readonly invalid?: boolean;
  readonly describedBy?: string | undefined;
};

// Grows with its content from 3 rows to 12 using field-sizing; browsers without
// it fall back to a fixed 3-row box with scrolling.
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, describedBy, className, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={controlClass(invalid, `min-h-20 max-h-72 px-2.5 py-1.5 [field-sizing:content] ${className ?? ''}`)}
      {...rest}
    />
  );
});
```

`apps/cms/src/studio/ui/Checkbox.tsx`:

```tsx
import { Check } from '@phosphor-icons/react/dist/ssr';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  readonly label: string;
  readonly description?: string | undefined;
  readonly invalid?: boolean;
  /** Keeps the label for assistive tech but hides it, for row-selection boxes in tables. */
  readonly hideLabel?: boolean;
};

// The check is a Phosphor icon over the native input, so it follows --on-primary in both themes
// (a data-URI image cannot read a CSS variable).
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, invalid = false, hideLabel = false, ...rest },
  ref,
) {
  return (
    <div className="flex items-start gap-2">
      <span className="relative mt-0.5 flex size-4 shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={invalid || undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          className="peer size-4 cursor-pointer appearance-none rounded-xs border border-line-control bg-raised checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        <Check
          size={12}
          weight="bold"
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 hidden text-on-primary peer-checked:block"
        />
      </span>
      <div className="flex flex-col">
        <label htmlFor={id} className={hideLabel ? 'sr-only' : 'cursor-pointer text-body text-fg'}>
          {label}
        </label>
        {description ? (
          <p id={`${id}-description`} className="text-small text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
});
```

`apps/cms/src/studio/ui/Switch.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import { cn } from '../lib/cn';

export function Switch({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-8 shrink-0 rounded-full border transition-colors duration-(--duration-fast)',
          checked ? 'border-primary bg-primary' : 'border-line-control bg-raised',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 size-3.5 rounded-full transition-transform duration-(--duration-fast)',
            checked ? 'translate-x-3.5 bg-on-primary' : 'translate-x-0.5 bg-fg-muted',
          )}
        />
      </button>
      <label htmlFor={id} className="text-body text-fg">
        {label}
      </label>
    </div>
  );
}
```

`apps/cms/src/studio/ui/RadioGroup.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

export type RadioOption = { readonly value: string; readonly label: string };

// Segmented control for 2 to 4 short options. The inputs are native radios
// (visually hidden), so arrow keys move focus and select, as the WAI-ARIA
// radio group pattern requires, without custom key handling.
export function RadioGroup({
  id,
  name,
  label,
  labelledBy,
  options,
  value,
  onChange,
  disabled = false,
}: {
  readonly id?: string | undefined;
  readonly name: string;
  readonly label: string;
  /** Id of a visible label element. When set it replaces the aria-label. */
  readonly labelledBy?: string | undefined;
  readonly options: readonly RadioOption[];
  readonly value: string | null;
  readonly onChange: (next: string) => void;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className="inline-flex h-7 rounded-sm border border-line-control bg-raised p-0.5"
    >
      {options.map((option) => {
        const optionId = `${name}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className="inline-flex cursor-pointer items-center rounded-xs px-2.5 text-body-strong text-fg-muted transition-colors duration-(--duration-fast) hover:text-fg has-checked:bg-active has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-focus has-disabled:cursor-not-allowed has-disabled:opacity-50"
          >
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
```

`apps/cms/src/studio/ui/Select.tsx`:

```tsx
'use client';

import { Combobox, Popover, type ComboboxOption } from '@cleanstart/ui';
import { CaretDown, X } from '@phosphor-icons/react';
import { useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { cn } from '../lib/cn';
import { controlClass } from './TextInput';

export type SelectOption = { readonly value: string; readonly label: string; readonly description?: string | undefined };

type Common = {
  readonly id: string;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string | undefined;
  readonly invalid?: boolean;
  readonly describedBy?: string | undefined;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
};

type SingleProps = Common & { readonly multiple?: false; readonly value: string | null; readonly onChange: (next: string | null) => void };
type MultiProps = Common & { readonly multiple: true; readonly value: readonly string[]; readonly onChange: (next: string[]) => void };

const SEARCH_THRESHOLD = 8;

export function Select(props: SingleProps | MultiProps): ReactElement {
  const { id, options, placeholder = 'Select…', invalid = false, describedBy, disabled = false, clearable = true } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = props.multiple ? props.value : props.value ? [props.value] : [];
  const label = selected
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(', ');

  const visible: ComboboxOption[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !q || o.label.toLowerCase().includes(q))
      .map((o) => ({ value: o.value, label: o.label, ...(o.description ? { description: o.description } : {}) }));
  }, [options, query]);

  const pick = (value: string): void => {
    if (props.multiple) {
      props.onChange(props.value.includes(value) ? props.value.filter((v) => v !== value) : [...props.value, value]);
      return;
    }
    props.onChange(value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={controlClass(invalid, 'flex h-8 items-center justify-between gap-2 px-2.5 text-left')}
      >
        <span className={cn('truncate', !label && 'text-fg-subtle')}>{label || placeholder}</span>
        <CaretDown size={14} aria-hidden="true" className="shrink-0 text-fg-subtle" />
      </button>
      {clearable && selected.length > 0 && !disabled ? (
        <button
          type="button"
          aria-label="Clear selection"
          onClick={() => (props.multiple ? props.onChange([]) : props.onChange(null))}
          className="absolute top-1.5 right-7 inline-grid size-5 place-items-center rounded-xs text-fg-subtle hover:bg-hover hover:text-fg"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
      {/* Popover's role defaults to 'dialog'; passing role="dialog" would trip Biome's useSemanticElements. */}
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} matchAnchorWidth ariaLabel="Choose an option">
        <Combobox
          options={visible}
          value={props.multiple ? null : props.value}
          onChange={(value) => pick(String(value))}
          query={query}
          onQueryChange={setQuery}
          placeholder={options.length > SEARCH_THRESHOLD ? 'Search…' : 'Type to filter'}
          autoFocus
          emptyLabel="No matches"
          ariaLabel="Options"
        />
      </Popover>
    </div>
  );
}
```

`apps/cms/src/studio/ui/Card.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

export function Card({
  title,
  action,
  children,
}: {
  readonly title?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="rounded-md border border-line bg-raised p-4">
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? <h3 className="text-heading text-fg">{title}</h3> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
```

`apps/cms/src/studio/ui/Section.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

export function Section({
  title,
  description,
  children,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="flex flex-col gap-5 pt-8 first:pt-0">
      {title ? (
        <header className="flex flex-col gap-1">
          <h2 className="text-heading text-fg">{title}</h2>
          {description ? <p className="text-small text-fg-muted">{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
```

`apps/cms/src/studio/ui/Tabs.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';

import { cn } from '../lib/cn';

export type TabItem = { readonly id: string; readonly label: string; readonly hasError?: boolean };

export function Tabs({
  label,
  items,
  active,
  onChange,
  idPrefix,
  hasPanels = false,
}: {
  readonly label: string;
  readonly items: readonly TabItem[];
  readonly active: string;
  readonly onChange: (id: string) => void;
  readonly idPrefix: string;
  /** Set when the caller renders `${idPrefix}-panel-${id}` tab panels; only then do tabs point at them. */
  readonly hasPanels?: boolean;
}): ReactElement {
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  // Roving tabindex: the newly selected tab must also take focus.
  const select = (target: TabItem | undefined): void => {
    if (!target) return;
    onChange(target.id);
    buttons.current.get(target.id)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = items.findIndex((t) => t.id === active);
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(event.key === 'Home' ? items[0] : items[items.length - 1]);
      return;
    }
    if (step === 0) return;
    event.preventDefault();
    select(items[(index + step + items.length) % items.length]);
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="inline-flex gap-0.5 rounded-md bg-active p-0.5">
      {items.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) buttons.current.set(tab.id, node);
              else buttons.current.delete(tab.id);
            }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={hasPanels ? `${idPrefix}-panel-${tab.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex h-6 items-center gap-1.5 rounded-sm px-3 text-body-strong transition-[background-color,color] duration-(--duration-base) ease-(--ease-out)',
              selected ? 'bg-surface text-fg shadow-raised' : 'text-fg-muted hover:text-fg',
            )}
          >
            {tab.label}
            {tab.hasError ? <span aria-label="Has errors" className="size-1.5 rounded-full bg-danger" /> : null}
          </button>
        );
      })}
    </div>
  );
}
```

`apps/cms/src/studio/ui/Skeleton.tsx`:

```tsx
import type { ReactElement } from 'react';

import { cn } from '../lib/cn';

export function Skeleton({ className }: { readonly className: string }): ReactElement {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-sm bg-active [animation-duration:1.6s]', className)} />;
}
```

`apps/cms/src/studio/ui/EmptyState.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon ? <div className="text-fg-subtle">{icon}</div> : null}
      <h3 className="text-heading text-fg">{title}</h3>
      <p className="max-w-sm text-body text-fg-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
```

`apps/cms/src/studio/ui/Avatar.tsx`:

```tsx
import type { ReactElement } from 'react';

import { cn } from '../lib/cn';

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export function Avatar({
  name,
  size = 'md',
  decorative = false,
}: {
  readonly name: string;
  readonly size?: 'sm' | 'md';
  readonly decorative?: boolean;
}): ReactElement {
  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      role={decorative ? undefined : 'img'}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-active font-medium text-fg-muted',
        size === 'sm' ? 'size-5 text-micro' : 'size-6 text-micro',
      )}
    >
      {initials(name)}
    </span>
  );
}
```

`apps/cms/src/studio/ui/PageHeader.tsx`:

```tsx
import { CaretRight } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

export type Crumb = { readonly label: string; readonly href?: string };

export function PageHeader({
  title,
  crumbs = [],
  count,
  actions,
}: {
  readonly title: string;
  readonly crumbs?: readonly Crumb[];
  readonly count?: number;
  readonly actions?: ReactNode;
}): ReactElement {
  return (
    <header className="flex items-end justify-between gap-4 px-7 pb-3 pt-6">
      <div className="min-w-0">
        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-small text-fg-subtle">
            {crumbs.map((crumb) => (
              <span key={crumb.label} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  crumb.label
                )}
                <CaretRight size={10} weight="light" aria-hidden="true" />
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="flex min-w-0 items-baseline gap-2.5 text-display text-fg">
          <span className="truncate">{title}</span>
          {typeof count === 'number' ? (
            <span className="tabular text-body-strong text-fg-subtle">{count.toLocaleString('en-US')}</span>
          ) : null}
        </h1>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

`apps/cms/src/studio/ui/index.ts`:

```ts
export { Avatar } from './Avatar';
export { Badge, type BadgeTone } from './Badge';
export { Banner, type BannerTone } from './Banner';
export { Button, buttonClass, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { Card } from './Card';
export { Checkbox } from './Checkbox';
export { EmptyState } from './EmptyState';
export { Field, describedBy } from './Field';
export { IconButton } from './IconButton';
export { Kbd } from './Kbd';
export { PageHeader, type Crumb } from './PageHeader';
export { RadioGroup, type RadioOption } from './RadioGroup';
export { Section } from './Section';
export { Select, type SelectOption } from './Select';
export { Skeleton } from './Skeleton';
export { StatusBadge, type DocumentStatus } from './StatusBadge';
export { Switch } from './Switch';
export { Tabs, type TabItem } from './Tabs';
export { Textarea } from './Textarea';
export { TextInput, controlClass } from './TextInput';
```

Notes for the implementer:

- `@phosphor-icons/react/dist/ssr` is the server-safe entry; client components import from `@phosphor-icons/react`. Check both paths exist in the installed version before using them (`ls node_modules/@phosphor-icons/react/dist`). Client icons get the Light weight from `IconDefaults`; every SSR icon passes `weight="light"` (or `"fill"` for the Published glyph) itself, because SSR icons cannot read context.
- Confirm the `Popover` props used in `Select.tsx` (`matchAnchorWidth`, `ariaLabel`; `role` is left at its `'dialog'` default) against `packages/ui/src/primitives/Popover.tsx`; they are listed in `docs/studio/research/design-inputs.md` §1.
- The only arbitrary values allowed are the ones above (`scale-[0.98]`, `[field-sizing:content]`, `[animation-duration:1.6s]`, the `Kbd` inset line). Task 1.5 adds a check that rejects new arbitrary colours and font sizes.

- [ ] **Step 5: Make the shared Tooltip keep its child's ref**

`packages/ui/src/primitives/Tooltip.tsx:53-56` clones its child with a new `ref` callback and drops the child's own ref, so a ref forwarded through `IconButton` would never be set. Merge them. In React 19 an element's ref is in `props.ref`.

Replace the `ref` entry inside `cloneElement(...)` with:

```tsx
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      const own = triggerProps.ref as Ref<HTMLElement> | undefined;
      if (typeof own === 'function') own(node);
      else if (own && typeof own === 'object') (own as MutableRefObject<HTMLElement | null>).current = node;
    },
```

and add `MutableRefObject` and `Ref` to the type imports from `react`. Payload's admin uses the same Tooltip; nothing there passes a ref through it today, so its behaviour does not change. The lab's Columns-style popover anchored on an `IconButton` (Task 1.15) is the check that this works.

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/ui/ui.test.tsx`
Expected: PASS (14 tests).

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/ui exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/studio/lib/cn.ts apps/cms/src/studio/ui packages/ui/src/primitives/Tooltip.tsx
git commit -m "feat(studio): T0.6 Studio UI kit"
```

### Task 0.7: The component lab

**Files:**
- Create: `apps/cms/src/studio/lab/LabFrame.tsx`
- Create: `apps/cms/src/studio/lab/demos.tsx`
- Create: `apps/cms/src/studio/lab/LabPage.tsx`
- Modify: `apps/cms/src/app/(studio)/studio/lab/page.tsx`

- [ ] **Step 1: Create the frame that shows a demo in both themes**

`apps/cms/src/studio/lab/LabFrame.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

// Each demo renders once per theme, so ids and radio names take a per-frame
// prefix; otherwise labels, aria references and radio groups would collide.
export function LabFrame({
  id,
  title,
  keyboard,
  stacked = false,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly keyboard?: string | undefined;
  readonly stacked?: boolean | undefined;
  readonly children: (prefix: string) => ReactNode;
}): ReactElement {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-title text-fg">{title}</h2>
        {keyboard ? <p className="text-small text-fg-muted">Keyboard: {keyboard}</p> : null}
      </header>
      <div className={stacked ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
        {(['dark', 'light'] as const).map((theme) => (
          <div key={theme} data-theme={theme} className="rounded-md border border-line bg-canvas p-6 text-fg">
            <p className="mb-4 text-micro text-fg-subtle">{theme === 'dark' ? 'Dark' : 'Light'}</p>
            {children(`${id}-${theme}`)}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the demos**

`apps/cms/src/studio/lab/demos.tsx`:

```tsx
'use client';

import { ConfirmDialog, DateTimePicker, Dialog, DialogBody, DialogFooter, DialogHeader, Drawer, DrawerBody, DrawerHeader, DropdownMenu, useToast } from '@cleanstart/ui';
import { DotsThree, Plus, Trash } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';

import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  IconButton,
  Kbd,
  PageHeader,
  RadioGroup,
  Section,
  Select,
  Skeleton,
  StatusBadge,
  Switch,
  Tabs,
  TextInput,
  Textarea,
  describedBy,
} from '../ui';

export function ButtonsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant === 'danger' ? 'Delete' : 'Publish'}
            </Button>
          ))}
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Saving
          </Button>
          <Button variant={variant} icon={<Plus size={14} aria-hidden="true" />}>
            New blog
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <IconButton label="More actions" icon={<DotsThree size={16} aria-hidden="true" />} />
        <IconButton label="Delete" variant="secondary" icon={<Trash size={16} aria-hidden="true" />} />
        <IconButton label="Toggle rail" pressed icon={<DotsThree size={16} aria-hidden="true" />} shortcut="⌘." />
        <Kbd keys={['⌘', 'K']} />
        <Kbd keys={['⌘', '⇧', 'S']} />
      </div>
    </div>
  );
}

type DemoProps = { readonly prefix: string };

export function InputsDemo({ prefix }: DemoProps): ReactElement {
  const [single, setSingle] = useState<string | null>('draft');
  const [multi, setMulti] = useState<string[]>(['security']);
  const [radio, setRadio] = useState<string | null>('internal');
  const [on, setOn] = useState(true);
  const [date, setDate] = useState<string | null>('2026-10-16T09:30:00.000Z');
  return (
    <div className="flex max-w-md flex-col gap-5">
      <Field id={`${prefix}-title`} label="Title" description="Shown in search results and the page heading.">
        <TextInput id={`${prefix}-title`} defaultValue="Zero CVE container images" describedBy={describedBy(`${prefix}-title`, { description: 'x' })} />
      </Field>
      <Field id={`${prefix}-slug`} label="Slug" error="Slug is already used by ‘Zero CVE images’. Choose a different slug.">
        <TextInput id={`${prefix}-slug`} defaultValue="zero-cve-images" invalid describedBy={`${prefix}-slug-error`} className="font-code" />
      </Field>
      <Field id={`${prefix}-ro`} label="Word count">
        <TextInput id={`${prefix}-ro`} defaultValue="1,240" readOnly />
      </Field>
      <Field id={`${prefix}-disabled`} label="Disabled field" optional>
        <TextInput id={`${prefix}-disabled`} placeholder="Not editable" disabled />
      </Field>
      <Field id={`${prefix}-abstract`} label="Abstract" optional>
        <Textarea id={`${prefix}-abstract`} placeholder="One or two sentences that sum up the post." />
      </Field>
      <Field id={`${prefix}-status`} label="Status">
        <Select
          id={`${prefix}-status`}
          value={single}
          onChange={setSingle}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ]}
        />
      </Field>
      <Field id={`${prefix}-categories`} label="Categories">
        <Select
          id={`${prefix}-categories`}
          multiple
          value={multi}
          onChange={setMulti}
          options={[
            { value: 'security', label: 'Security' },
            { value: 'compliance', label: 'Compliance' },
            { value: 'devops', label: 'DevOps' },
          ]}
        />
      </Field>
      <Checkbox id={`${prefix}-featured`} label="Featured" description="Pin this post at the top of the blog listing." defaultChecked />
      <Switch id={`${prefix}-switch`} label="Compact rows" checked={on} onChange={setOn} />
      <RadioGroup
        name={`${prefix}-mode`}
        label="Registration mode"
        value={radio}
        onChange={setRadio}
        options={[
          { value: 'internal', label: 'Internal' },
          { value: 'external', label: 'External' },
        ]}
      />
      <Field id={`${prefix}-date`} label="Display date">
        <DateTimePicker id={`${prefix}-date`} mode="datetime" value={date} onChange={setDate} timezone="Asia/Kolkata" />
      </Field>
    </div>
  );
}

export function FeedbackDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(['neutral', 'accent', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Badge key={tone} tone={tone} dot>
            {tone === 'neutral' ? 'Neutral' : tone[0]?.toUpperCase() + tone.slice(1)}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <StatusBadge status="draft" />
        <StatusBadge status="published" />
        <StatusBadge status="changed" />
        <StatusBadge status="scheduled" detail="Oct 18, 9:00 AM" />
      </div>
      <Banner tone="info" action={<Button size="sm">Take over</Button>}>
        Ana Ramos is editing this blog. You can view it; editing is off.
      </Banner>
      <Banner tone="warning">1 issue blocks publishing: Slug is empty.</Banner>
      <Banner tone="danger">Save failed. Check your connection and try again.</Banner>
      <Banner tone="success">Published. The live page updates within a minute.</Banner>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
      <EmptyState title="No blogs yet" description="Blogs you create appear here." action={<Button variant="primary">New blog</Button>} />
      <div className="flex items-center gap-2">
        <Avatar name="Ana Ramos" />
        <Avatar name="Rohit Menon" size="sm" />
      </div>
    </div>
  );
}

export function StructureDemo({ prefix }: DemoProps): ReactElement {
  const [tab, setTab] = useState('content');
  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-md border border-line">
        <PageHeader
          title="Blogs"
          count={312}
          crumbs={[{ label: 'Content', href: '#' }]}
          actions={<Button variant="primary" icon={<Plus size={14} aria-hidden="true" />}>New blog</Button>}
        />
      </div>
      <Tabs
        label="Document sections"
        idPrefix={prefix}
        active={tab}
        onChange={setTab}
        items={[
          { id: 'content', label: 'Content' },
          { id: 'related', label: 'Related' },
          { id: 'seo', label: 'SEO', hasError: true },
        ]}
      />
      <Section title="Related content" description="Shown under the post.">
        <Card title="Search appearance" action={<Button size="sm" variant="ghost">Edit</Button>}>
          <p className="text-body text-fg-muted">Zero CVE container images · cleanstart.com</p>
        </Card>
      </Section>
    </div>
  );
}

export function OverlaysDemo({ prefix }: DemoProps): ReactElement {
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuAnchor = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setDialog(true)}>Dialog</Button>
      <Button onClick={() => setConfirm(true)}>Confirm</Button>
      <Button onClick={() => setDrawer(true)}>Drawer</Button>
      <Button ref={menuAnchor} onClick={() => setMenu(true)}>
        Menu
      </Button>
      <Button onClick={() => toast.push({ tone: 'success', message: 'Draft saved.' })}>Toast</Button>
      <Dialog open={dialog} onClose={() => setDialog(false)} labelledBy={`${prefix}-dialog-title`} size="md">
        <DialogHeader id={`${prefix}-dialog-title`} title="Share a preview link" onClose={() => setDialog(false)} />
        <DialogBody>
          <p className="text-body text-fg-muted">Anyone with the link can see this draft until it expires.</p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="primary">Create link</Button>
        </DialogFooter>
      </Dialog>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
        title="Delete 3 blogs?"
        description="They are removed from the site and cannot be restored."
        confirmLabel="Delete"
        tone="danger"
      />
      <Drawer open={drawer} onClose={() => setDrawer(false)} labelledBy={`${prefix}-drawer-title`} size="md">
        <DrawerHeader id={`${prefix}-drawer-title`} title="Export blogs" onClose={() => setDrawer(false)} />
        <DrawerBody>
          <p className="text-body text-fg-muted">Choose columns and a date range.</p>
        </DrawerBody>
      </Drawer>
      <DropdownMenu
        open={menu}
        onClose={() => setMenu(false)}
        anchorRef={menuAnchor}
        ariaLabel="Document actions"
        items={[
          { kind: 'item', id: 'versions', label: 'Versions', onSelect: () => undefined },
          { kind: 'item', id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', onSelect: () => undefined },
          { kind: 'separator', id: 'sep' },
          { kind: 'item', id: 'delete', label: 'Delete', tone: 'danger', onSelect: () => undefined },
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the lab page**

`apps/cms/src/studio/lab/LabPage.tsx`:

```tsx
'use client';

import { ToastProvider } from '@cleanstart/ui';
import type { ReactElement } from 'react';

import { LabFrame } from './LabFrame';
import { ButtonsDemo, FeedbackDemo, InputsDemo, OverlaysDemo, StructureDemo } from './demos';

type LabSection = {
  readonly id: string;
  readonly title: string;
  readonly keyboard?: string;
  readonly stacked?: boolean;
  readonly render: (props: { readonly prefix: string }) => ReactElement;
};

const SECTIONS: readonly LabSection[] = [
  { id: 'actions', title: 'Actions', keyboard: 'Tab to focus, Enter or Space to press', render: ButtonsDemo },
  { id: 'inputs', title: 'Inputs', keyboard: 'Arrow keys move inside radio groups and the date grid', render: InputsDemo },
  { id: 'feedback', title: 'Feedback and status', render: FeedbackDemo },
  { id: 'structure', title: 'Structure', keyboard: 'Arrow keys, Home and End move between tabs', render: StructureDemo },
  { id: 'overlays', title: 'Overlays', keyboard: 'Esc closes; focus returns to the trigger', render: OverlaysDemo },
];

export function LabPage(): ReactElement {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <nav aria-label="Lab sections" className="sticky top-0 h-dvh w-56 shrink-0 border-r border-line-subtle bg-surface p-4">
          <p className="mb-3 text-heading text-fg">Studio lab</p>
          <ul className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-sm px-2 py-1 text-body text-fg-muted hover:bg-hover hover:text-fg">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex flex-1 flex-col gap-12 p-8">
          {SECTIONS.map(({ id, title, keyboard, stacked, render: Demo }) => (
            <LabFrame key={id} id={id} title={title} keyboard={keyboard} stacked={stacked}>
              {(prefix) => <Demo prefix={prefix} />}
            </LabFrame>
          ))}
        </main>
      </div>
    </ToastProvider>
  );
}
```

- [ ] **Step 4: Render it from the route**

Replace `apps/cms/src/app/(studio)/studio/lab/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import { LabPage } from '@/studio/lab/LabPage';

// Phase 0 gate. Task 1.10 replaces this with an admin-only check.
export default function Lab(): ReactElement {
  if (process.env.STUDIO_LAB !== 'true') notFound();
  return <LabPage />;
}
```

- [ ] **Step 5: Verify in the browser pane**

Start or reuse the dev server with `STUDIO_LAB=true`. Open `/studio/lab` at 1440×900. For every section confirm: both themes render, focus rings show on Tab, the date picker opens, dialogs trap focus and close on Esc returning focus to their button, the toast appears bottom-right. Run axe from the browser console (`await import('https://...')` is blocked by CSP, so use the Playwright check in Task 1.17 instead) and record any issue as a fix in this task.

Lab notes: every demo renders once per theme, and each copy gets its own id prefix (`actions-dark`, `actions-light` and so on), so ids never repeat on the page. `DropdownMenu` portals to `document.body`, outside the frame's `data-theme`, so in the light frame its menu shows the page theme. The toast region sits under `ToastProvider`, outside both frames, so toasts also use the page theme. That is accepted for the lab; the real shell has one theme per page.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/studio/lab apps/cms/src/app/\(studio\)/studio/lab/page.tsx
git commit -m "feat(studio): T0.7 component lab"
```

### Task 0.8: Keyboard grid for the date picker

Fixes the accessibility gap in `docs/studio/research/design-inputs.md` §3 ("42 tabbable cells, no arrow keys, uses `aria-pressed`"). The change is in the shared package, so Payload's admin gets it too.

**Files:**
- Create: `packages/ui/src/primitives/date-grid-keys.ts`
- Test: `packages/ui/src/primitives/date-grid-keys.test.ts`
- Modify: `packages/ui/src/primitives/DateTimePicker.tsx`
- Modify: `packages/ui/src/primitives/Toast.tsx:116` (glyph to SVG)

- [ ] **Step 1: Write the failing test**

`packages/ui/src/primitives/date-grid-keys.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { isGridKey, nextFocusDate } from './date-grid-keys';

const d = (iso: string): Date => {
  const [y, m, day] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, day);
};
const iso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('nextFocusDate', () => {
  it('moves one day with left and right, across months', () => {
    expect(iso(nextFocusDate(d('2026-01-31'), 'ArrowRight', false))).toBe('2026-02-01');
    expect(iso(nextFocusDate(d('2026-03-01'), 'ArrowLeft', false))).toBe('2026-02-28');
  });

  it('moves one week with up and down', () => {
    expect(iso(nextFocusDate(d('2026-10-16'), 'ArrowUp', false))).toBe('2026-10-09');
    expect(iso(nextFocusDate(d('2026-10-16'), 'ArrowDown', false))).toBe('2026-10-23');
  });

  it('moves to the start and end of the week with Home and End', () => {
    // 2026-10-16 is a Friday; weeks start on Sunday in the grid.
    expect(iso(nextFocusDate(d('2026-10-16'), 'Home', false))).toBe('2026-10-11');
    expect(iso(nextFocusDate(d('2026-10-16'), 'End', false))).toBe('2026-10-17');
  });

  it('moves one month with Page keys, clamping to the last day', () => {
    expect(iso(nextFocusDate(d('2026-01-31'), 'PageDown', false))).toBe('2026-02-28');
    expect(iso(nextFocusDate(d('2026-03-31'), 'PageUp', false))).toBe('2026-02-28');
  });

  it('moves one year with Shift and a Page key', () => {
    expect(iso(nextFocusDate(d('2028-02-29'), 'PageUp', true))).toBe('2027-02-28');
    expect(iso(nextFocusDate(d('2026-10-16'), 'PageDown', true))).toBe('2027-10-16');
  });
});

describe('isGridKey', () => {
  it('accepts navigation keys only', () => {
    expect(isGridKey('ArrowLeft')).toBe(true);
    expect(isGridKey('PageDown')).toBe(true);
    expect(isGridKey('Enter')).toBe(false);
    expect(isGridKey('a')).toBe(false);
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `pnpm --filter @cleanstart/ui exec vitest run src/primitives/date-grid-keys.test.ts`
Expected: FAIL, cannot find module `./date-grid-keys`.

- [ ] **Step 3: Implement the key logic**

`packages/ui/src/primitives/date-grid-keys.ts`:

```ts
const GRID_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'] as const;

export type GridKey = (typeof GRID_KEYS)[number];

export const isGridKey = (key: string): key is GridKey => (GRID_KEYS as readonly string[]).includes(key);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// Keeps the day of month where possible and clamps to the last day otherwise,
// so Jan 31 + 1 month is Feb 28, not Mar 3.
const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
};

export const nextFocusDate = (current: Date, key: GridKey, shift: boolean): Date => {
  switch (key) {
    case 'ArrowLeft':
      return addDays(current, -1);
    case 'ArrowRight':
      return addDays(current, 1);
    case 'ArrowUp':
      return addDays(current, -7);
    case 'ArrowDown':
      return addDays(current, 7);
    case 'Home':
      return addDays(current, -current.getDay());
    case 'End':
      return addDays(current, 6 - current.getDay());
    case 'PageUp':
      return addMonths(current, shift ? -12 : -1);
    case 'PageDown':
      return addMonths(current, shift ? 12 : 1);
  }
};
```

- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/ui exec vitest run src/primitives/date-grid-keys.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Use it in the picker**

In `packages/ui/src/primitives/DateTimePicker.tsx`:

1. Add imports: `useEffect` from React and `{ isGridKey, nextFocusDate }` from `./date-grid-keys`.
2. Add state and refs after `const [anchorMonth, setAnchorMonth] = ...`:

```tsx
  const [focused, setFocused] = useState<Date>(() => valueDate ?? new Date());
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  // Focus moves into the grid only when the panel opens or a grid key is pressed,
  // never when the value changes (typing a time must keep focus in the time input).
  const moveFocusToDay = useRef(false);
  const valueRef = useRef(valueDate);
  valueRef.current = valueDate;
  const monthLabelId = `${triggerId}-month`;

  useEffect(() => {
    if (!open) return;
    const start = valueRef.current ?? new Date();
    moveFocusToDay.current = true;
    setFocused(start);
    setAnchorMonth(startOfMonth(start));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (focused.getMonth() !== anchorMonth.getMonth() || focused.getFullYear() !== anchorMonth.getFullYear()) {
      setAnchorMonth(startOfMonth(focused));
      return;
    }
    if (moveFocusToDay.current) {
      moveFocusToDay.current = false;
      dayRefs.current.get(isoOf(focused))?.focus();
    }
  }, [open, focused, anchorMonth]);

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!isGridKey(event.key)) return;
    event.preventDefault();
    const key = event.key;
    const shift = event.shiftKey;
    moveFocusToDay.current = true;
    setFocused((current) => nextFocusDate(current, key, shift));
  };
```

3. Make the month buttons move the focused date, so the grid and its single tab stop stay in sync: replace the two `onClick` handlers on `.cs-datetime__nav` with `onClick={() => setFocused((current) => nextFocusDate(current, 'PageUp', false))}` (previous) and `onClick={() => setFocused((current) => nextFocusDate(current, 'PageDown', false))}` (next). Focus stays on the button the user clicked.

and add at module level:

```tsx
const isoOf = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fullDateLabel = (d: Date): string =>
  d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const chunk = <T,>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
```

Add `KeyboardEvent` to the type import from React.

4. Give the month label an id: `<span id={monthLabelId} className="cs-datetime__month-year">`.
5. Replace the whole `<div className="cs-datetime__grid">…</div>` block with:

```tsx
          {/* biome-ignore lint/a11y/useSemanticElements: ARIA grid pattern for a date picker; a table cannot hold the roving-focus day buttons */}
          <div role="grid" aria-labelledby={monthLabelId} className="cs-datetime__grid" onKeyDown={onGridKeyDown}>
            {chunk(grid, 7).map((week) => (
              // biome-ignore lint/a11y/useSemanticElements lint/a11y/useFocusableInteractive: ARIA grid row for a date picker; focus lives on the day buttons
              <div role="row" key={isoOf(week[0] as Date)} className="contents">
                {week.map((d) => {
                  const inMonth = d.getMonth() === anchorMonth.getMonth();
                  const blocked = Boolean((min && d < min) || (max && d > max));
                  const selected = sameDay(d, valueDate);
                  const today = sameDay(d, new Date());
                  const key = isoOf(d);
                  return (
                    // biome-ignore lint/a11y/useSemanticElements lint/a11y/useFocusableInteractive: ARIA gridcell for a date picker; its day button takes focus
                    <div role="gridcell" key={key} aria-selected={selected} className="contents">
                      <button
                        ref={(el) => {
                          if (el) dayRefs.current.set(key, el);
                          else dayRefs.current.delete(key);
                        }}
                        type="button"
                        tabIndex={sameDay(d, focused) ? 0 : -1}
                        aria-label={fullDateLabel(d)}
                        aria-disabled={blocked || undefined}
                        aria-current={today ? 'date' : undefined}
                        className={[
                          'cs-datetime__day',
                          inMonth ? '' : 'is-out',
                          selected ? 'is-selected' : '',
                          today ? 'is-today' : '',
                          blocked ? 'is-blocked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          if (blocked) return;
                          setFocused(d);
                          onPickDay(d);
                        }}
                      >
                        {d.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
```

The three `biome-ignore` comments keep the ARIA grid pattern past Biome's `useSemanticElements` and `useFocusableInteractive` rules. The grid's comment is a `{/* */}` JSX comment because it sits among JSX children; the row and cell comments are `//` line comments because they sit inside `.map()` callbacks, where a JSX comment is not valid.

Native buttons already turn Enter and Space into a click, so the day buttons need no key handler. The class `contents` is used as a plain class name; add `.cs-datetime__grid > [role='row'], .cs-datetime__grid [role='gridcell'] { display: contents; }` to both `apps/cms/src/studio/styles/primitives.css` and `apps/cms/src/app/(payload)/styles/_ui-primitives.scss` so the 7-column grid layout is unchanged in both admins.

6. Replace the glyphs with the same inline SVG style `Dialog.tsx:111-118` already uses:
   - Clear button (`×`): `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>`
   - Previous month (`‹`): same wrapper, `d="M10 3L5 8l5 5"`, `strokeLinejoin="round"`.
   - Next month (`›`): same wrapper, `d="M6 3l5 5-5 5"`, `strokeLinejoin="round"`.
   - In `Toast.tsx:116` replace `×` with the clear-button SVG.

- [ ] **Step 6: Verify**

Run: `pnpm --filter @cleanstart/ui test && pnpm --filter @cleanstart/ui exec tsc --noEmit`
Expected: PASS and exit 0.

In the lab (`/studio/lab#inputs`): open the date picker, press Tab once and confirm focus lands on the selected day (one tab stop for the whole grid); arrows, Home, End, PageUp, PageDown and Shift+PageUp move focus and switch months; Enter selects; Esc closes and focus returns to the trigger. Repeat once in Payload's admin on a blog's Display date field to confirm nothing regressed there.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/primitives/date-grid-keys.ts packages/ui/src/primitives/date-grid-keys.test.ts packages/ui/src/primitives/DateTimePicker.tsx packages/ui/src/primitives/Toast.tsx apps/cms/src/studio/styles/primitives.css "apps/cms/src/app/(payload)/styles/_ui-primitives.scss"
git commit -m "fix(ui): T0.8 keyboard grid for the date picker"
```

### Task 0.9: Production rich-text census (read only, needs approval)

Gives Phase 3 the full list of node types and shapes in production (`docs/studio/04-EDITOR-SPEC.md` §7). It reads; it never writes. Running it on the droplet is an outward action: ask the product owner before Step 3.

**Files:**
- Create: `apps/cms/scripts/richtext-census.ts`
- Create (output): `docs/studio/research/richtext-census.md`

- [ ] **Step 1: Write the script**

`apps/cms/scripts/richtext-census.ts`:

```ts
/**
 * Read-only census of every rich-text value in the CMS. Counts node types,
 * versions, key sets and the Payload-specific fields Studio's editor must
 * reproduce. Prints Markdown to stdout. Writes nothing.
 *
 * Local:  pnpm exec tsx --env-file=.env scripts/richtext-census.ts > /tmp/census.md
 * Prod:   see docs/superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md Task 0.9
 */
import { getPayload } from 'payload';

type Node = { type?: unknown; version?: unknown; children?: unknown; [key: string]: unknown };

type Tally = Map<string, number>;
const bump = (tally: Tally, key: string): void => {
  tally.set(key, (tally.get(key) ?? 0) + 1);
};

const types: Tally = new Map();
const versions: Tally = new Map();
const keySets: Tally = new Map();
const linkTypes: Tally = new Map();
const headerStates: Tally = new Map();
const blockTypes: Tally = new Map();
const embedModes: Tally = new Map();
const withId: Tally = new Map();
const formatBits: Tally = new Map();
const where: Tally = new Map();

const isRichText = (value: unknown): value is { root: Node } =>
  typeof value === 'object' &&
  value !== null &&
  'root' in value &&
  typeof (value as { root: unknown }).root === 'object' &&
  (value as { root: Node }).root?.type === 'root';

const walkNode = (node: Node): void => {
  const type = typeof node.type === 'string' ? node.type : '(missing type)';
  bump(types, type);
  bump(versions, `${type} v${String(node.version)}`);
  bump(keySets, `${type}: ${Object.keys(node).sort().join(', ')}`);
  if ('id' in node) bump(withId, type);
  const fields = node.fields as Record<string, unknown> | undefined;
  if ((type === 'link' || type === 'autolink') && fields) bump(linkTypes, `${type}: ${String(fields.linkType)}`);
  if (type === 'tablecell') bump(headerStates, String(node.headerState));
  if (type === 'block' && fields) bump(blockTypes, String(fields.blockType));
  if (type === 'embed') bump(embedModes, `${String(node.mode)} / rawHtml ${node.rawHtml ? 'set' : 'empty'}`);
  if (type === 'text' && typeof node.format === 'number') bump(formatBits, String(node.format));
  if (Array.isArray(node.children)) for (const child of node.children) walkNode(child as Node);
};

const walkValue = (value: unknown, label: string): void => {
  if (isRichText(value)) {
    bump(where, label);
    walkNode(value.root);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkValue(item, label);
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) walkValue(child, `${label}.${key}`);
  }
};

const table = (title: string, tally: Tally): string => {
  const rows = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  return [`## ${title}`, '', '| Value | Count |', '|---|---|', ...rows.map(([k, v]) => `| \`${k}\` | ${v} |`), ''].join('\n');
};

const main = async (): Promise<void> => {
  const configPath = process.env.PAYLOAD_CONFIG_PATH ?? '../src/payload.config.ts';
  const { default: config } = (await import(configPath)) as { default: Parameters<typeof getPayload>[0]['config'] };
  const payload = await getPayload({ config });
  let documents = 0;
  for (const collection of payload.config.collections) {
    if (collection.slug.startsWith('payload-')) continue;
    const draftEnabled = Boolean(collection.versions && typeof collection.versions === 'object' && collection.versions.drafts);
    let page = 1;
    for (;;) {
      // overrideAccess: this script reads every document as a system task and writes nothing.
      const result = await payload.find({
        collection: collection.slug as never,
        depth: 0,
        limit: 100,
        page,
        draft: draftEnabled,
        overrideAccess: true,
      });
      for (const doc of result.docs) walkValue(doc, collection.slug);
      documents += result.docs.length;
      if (!result.hasNextPage) break;
      page += 1;
    }
  }
  const out = [
    '# Rich-text census',
    '',
    `Generated ${new Date().toISOString()} from ${documents} documents. Counts only; no content.`,
    '',
    table('Fields holding rich text', where),
    table('Node types', types),
    table('Node versions', versions),
    table('Key sets per node type', keySets),
    table('Link types', linkTypes),
    table('Table cell header states', headerStates),
    table('Blocks inside rich text', blockTypes),
    table('Embed modes', embedModes),
    table('Nodes carrying an id', withId),
    table('Text format bitmasks', formatBits),
  ].join('\n');
  process.stdout.write(out);
  process.exit(0);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Run it locally first**

Run (from `apps/cms`): `pnpm exec tsx --env-file=.env scripts/richtext-census.ts > /tmp/census-local.md && head -40 /tmp/census-local.md`
Expected: Markdown with non-empty "Node types" and "Fields holding rich text" tables. Review the output for any content (there must be none; only types, keys and counts).

- [ ] **Step 3: Ask for approval, then run against production**

Ask the product owner: "Run the read-only rich-text census in the production CMS container? It reads every document at depth 0, prints counts only, writes nothing." Proceed only on a clear yes. Then, following `docs/operations/PRODUCTION-ROLLOUT.md` conventions and the droplet access notes:

```bash
scp apps/cms/scripts/richtext-census.ts cleanstart-cms:/tmp/richtext-census.ts
ssh cleanstart-cms 'docker cp /tmp/richtext-census.ts cleanstart-cms-1:/tmp/richtext-census.ts && docker exec -e PAYLOAD_CONFIG_PATH=/app/apps/cms/src/payload.config.ts cleanstart-cms-1 /app/node_modules/.bin/tsx /tmp/richtext-census.ts' > docs/studio/research/richtext-census.md
ssh cleanstart-cms 'docker exec cleanstart-cms-1 rm /tmp/richtext-census.ts && rm /tmp/richtext-census.ts'
```

If the config path inside the image differs, find it first with `ssh cleanstart-cms 'docker exec cleanstart-cms-1 ls /app/apps/cms/src'` and adjust `PAYLOAD_CONFIG_PATH`. Expected: `docs/studio/research/richtext-census.md` starts with `# Rich-text census`.

- [ ] **Step 4: Compare with the editor spec**

Open `docs/studio/04-EDITOR-SPEC.md` §3. For every node type in the census that is not in the table, add a row (read-only round-trip node, per the "Unknown types" rule). Note the result at the end of the census file.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/richtext-census.ts docs/studio/research/richtext-census.md docs/studio/04-EDITOR-SPEC.md
git commit -m "docs(studio): T0.9 production rich-text census"
```

### Task 0.10: List and edit compositions, and the Phase 0 sign-off

Static compositions, built only from the UI kit and fixture data, that you approve before Phase 1 builds the real screens. They live in the lab.

**Files:**
- Create: `apps/cms/src/studio/lab/compositions/fixtures.ts`
- Create: `apps/cms/src/studio/lab/compositions/ListComposition.tsx`
- Create: `apps/cms/src/studio/lab/compositions/EditComposition.tsx`
- Modify: `apps/cms/src/studio/lab/LabPage.tsx` (add two sections)

- [ ] **Step 1: Fixtures**

`apps/cms/src/studio/lab/compositions/fixtures.ts`:

```ts
import type { DocumentStatus } from '../../ui';

export type FixtureRow = {
  readonly id: number;
  readonly title: string;
  readonly authors: readonly string[];
  readonly category: string;
  readonly status: DocumentStatus;
  readonly published: string | null;
  readonly updated: string;
};

// Sample data for layout review only. Titles follow the real blog's topics.
export const LIST_ROWS: readonly FixtureRow[] = [
  { id: 412, title: 'Zero CVE container images: how we keep the count at zero', authors: ['Ana Ramos'], category: 'Security', status: 'published', published: 'Oct 12, 2026', updated: '2h ago' },
  { id: 409, title: 'BusyBox in production images: the risk most teams miss', authors: ['Rohit Menon', 'Ana Ramos'], category: 'Security', status: 'changed', published: 'Sep 30, 2026', updated: 'Yesterday' },
  { id: 405, title: 'FedRAMP-ready base images, explained', authors: ['Meera Iyer'], category: 'Compliance', status: 'scheduled', published: null, updated: 'Oct 14, 2026' },
  { id: 401, title: 'Distroless vs minimal: picking a base image in 2026', authors: ['Rohit Menon'], category: 'DevOps', status: 'draft', published: null, updated: 'Oct 9, 2026' },
  { id: 398, title: 'What an SBOM tells you, and what it does not', authors: ['Ana Ramos'], category: 'Security', status: 'published', published: 'Sep 18, 2026', updated: 'Sep 18, 2026' },
];
```

- [ ] **Step 2: List composition (S-10)**

`apps/cms/src/studio/lab/compositions/ListComposition.tsx`:

```tsx
import { DotsThree, MagnifyingGlass, Plus, SlidersHorizontal, X } from '@phosphor-icons/react/dist/ssr';
import type { ReactElement } from 'react';

import { Badge, Button, Checkbox, IconButton, Kbd, PageHeader, StatusBadge } from '../../ui';
import { LIST_ROWS } from './fixtures';

// A server component: icons come from the SSR entry and pass weight="light" themselves.
// The Phase 1 Table layout inside the sheet. The grouped List layout is Phase 5 (02-SCREENS S-10).
export function ListComposition(): ReactElement {
  return (
    <div className="rounded-lg bg-canvas p-(--sheet-inset)">
      <div className="overflow-hidden rounded-lg bg-surface shadow-sheet">
        <PageHeader
          title="Blogs"
          count={312}
          crumbs={[{ label: 'Content' }]}
          actions={
            <>
              <Button icon={<SlidersHorizontal size={14} weight="light" aria-hidden="true" />}>Display</Button>
              <IconButton label="More actions" icon={<DotsThree size={16} weight="light" aria-hidden="true" />} />
              <Button variant="primary" icon={<Plus size={14} weight="light" aria-hidden="true" />}>
                New blog
              </Button>
            </>
          }
        />
        <div className="flex items-center gap-2 px-7 pb-3">
          <Badge tone="accent" size="md">
            Author is Ana Ramos
            <X size={12} weight="light" aria-hidden="true" />
          </Badge>
          <Badge size="md">
            <Plus size={12} weight="light" aria-hidden="true" />
            Filter
          </Badge>
          <div className="flex-1" />
          <span className="flex h-8 w-56 items-center gap-2 rounded-sm bg-raised px-2.5 text-body text-fg-subtle shadow-raised">
            <MagnifyingGlass size={14} weight="light" aria-hidden="true" />
            <span className="flex-1">Search blogs</span>
            <Kbd keys={['/']} />
          </span>
        </div>
        <div className="px-3 pb-3">
          <table className="w-full table-fixed border-collapse text-body">
            <thead>
              <tr className="h-8 text-left text-micro text-fg-muted">
                <th className="w-10 rounded-l-md bg-raised px-3" aria-label="Select" />
                <th className="bg-raised px-3">Title</th>
                <th className="w-44 bg-raised px-3">Authors</th>
                <th className="w-32 bg-raised px-3">Category</th>
                <th className="w-48 bg-raised px-3">Status</th>
                <th className="w-32 bg-raised px-3 text-right">Published</th>
                <th className="w-28 rounded-r-md bg-raised px-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {LIST_ROWS.map((row) => (
                <tr key={row.id} className="group h-11 hover:bg-hover">
                  <td className="rounded-l-sm px-3">
                    <span className="opacity-0 group-hover:opacity-100">
                      <Checkbox id={`comp-row-${row.id}`} label={`Select ${row.title}`} hideLabel />
                    </span>
                  </td>
                  <td className="truncate px-3 text-body-strong text-fg">{row.title}</td>
                  <td className="truncate px-3 text-fg-muted">
                    {row.authors[0]}
                    {row.authors.length > 1 ? ` +${row.authors.length - 1}` : ''}
                  </td>
                  <td className="px-3">
                    <Badge>{row.category}</Badge>
                  </td>
                  <td className="px-3">
                    <StatusBadge status={row.status} detail={row.status === 'scheduled' ? 'Oct 18, 9:00 AM' : undefined} />
                  </td>
                  <td className="tabular px-3 text-right text-fg-subtle">{row.published ?? ''}</td>
                  <td className="tabular rounded-r-sm px-3 text-right text-fg-subtle">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between px-7 py-3 text-small text-fg-subtle">
          <span className="tabular">1 to 25 of 312</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled>
              Previous
            </Button>
            <Button size="sm" variant="ghost">
              Next
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Edit composition (S-12)**

`apps/cms/src/studio/lab/compositions/EditComposition.tsx`:

```tsx
'use client';

import { CalendarBlank, CaretDown, CaretRight, DotsThree, Eye, LinkSimple, Plus, SidebarSimple, Tag } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ReactElement } from 'react';

import { Badge, Banner, Button, Checkbox, Field, IconButton, Section, Tabs, TextInput, Textarea, buttonClass } from '../../ui';

// Writing-first edit view inside the sheet: title, lead, property chips, then fields; a tabbed
// inspector on the right. Property chips and the SEO and Checklist tabs arrive in Phase 4.
export function EditComposition(): ReactElement {
  const [tab, setTab] = useState('details');
  return (
    <div className="rounded-lg bg-canvas p-(--sheet-inset)">
      <div className="flex flex-col overflow-hidden rounded-lg bg-surface shadow-sheet">
        <header className="flex h-(--document-header-height) items-center justify-between gap-4 pl-6 pr-3">
          <div className="flex min-w-0 items-center gap-2 text-body-strong">
            <span className="text-fg-subtle">Blogs</span>
            <CaretRight size={12} aria-hidden="true" className="text-fg-subtle" />
            <span className="truncate text-fg">Zero CVE container images</span>
            <span className="ml-1 flex items-center gap-1.5 text-small font-normal text-fg-subtle">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-warning" />
              Unsaved changes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" icon={<Eye size={14} aria-hidden="true" />}>
              Preview
            </Button>
            <IconButton label="More actions" icon={<DotsThree aria-hidden="true" />} />
            <IconButton label="Toggle inspector" icon={<SidebarSimple aria-hidden="true" />} shortcut="⌘." />
            <div className="flex">
              <Button variant="primary" className="rounded-r-none">
                Publish changes
              </Button>
              <button
                type="button"
                aria-label="More publish options"
                className={buttonClass('primary', 'md', 'rounded-l-none border-l border-on-primary/20 px-1.5')}
              >
                <CaretDown size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
        <div className="flex">
          <div className="min-w-0 flex-1 px-6 pb-16 pt-2">
            <div className="mx-auto flex max-w-(--content-max-width) flex-col gap-5">
              <Banner tone="warning">1 issue blocks publishing: Slug is empty.</Banner>
              <label htmlFor="comp-title" className="sr-only">
                Title
              </label>
              <input
                id="comp-title"
                defaultValue="Zero CVE container images: how we keep the count at zero"
                className="mt-4 w-full bg-transparent text-doc-title text-fg outline-none placeholder:text-fg-subtle"
              />
              <p className="-mt-2 text-doc-lead text-fg-muted">
                CleanStart rebuilds every image from source each day, so known vulnerabilities never reach your registry.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge size="md">Ana Ramos</Badge>
                <Badge size="md">
                  <Tag size={12} aria-hidden="true" />
                  Security
                </Badge>
                <Badge size="md">
                  <CalendarBlank size={12} aria-hidden="true" />
                  Oct 16, 2026
                </Badge>
                <Badge size="md">
                  <LinkSimple size={12} aria-hidden="true" />
                  /blog/zero-cve-container-images
                </Badge>
                <Badge size="md">
                  <Plus size={12} aria-hidden="true" />
                  Property
                </Badge>
              </div>
              <Field id="comp-abstract" label="Abstract" description="One or two sentences. Used as the meta description when none is set.">
                <Textarea id="comp-abstract" defaultValue="CleanStart rebuilds every image from source each day, so known vulnerabilities never reach your registry." />
              </Field>
              <Section title="Body">
                <div className="min-h-48 rounded-md bg-raised p-4 text-doc-body text-fg-muted">The editor arrives in Phase 3.</div>
              </Section>
            </div>
          </div>
          <aside aria-label="Document settings" className="flex w-(--rail-width) shrink-0 flex-col gap-5 border-l border-line-subtle bg-surface px-4 pb-4">
            <div className="pt-1">
              <Tabs
                label="Inspector"
                idPrefix="comp-inspector"
                items={[
                  { id: 'details', label: 'Details' },
                  { id: 'seo', label: 'SEO' },
                  { id: 'checklist', label: 'Checklist' },
                ]}
                active={tab}
                onChange={setTab}
              />
            </div>
            <Section title="Publishing">
              <Field id="comp-date" label="Display date">
                <TextInput id="comp-date" defaultValue="Oct 16, 2026" />
              </Field>
              <Checkbox id="comp-featured" label="Featured" />
            </Section>
            <Section title="URL">
              <Field id="comp-slug" label="Slug" error="Slug is required to publish.">
                <TextInput id="comp-slug" invalid describedBy="comp-slug-error" className="font-code" />
              </Field>
            </Section>
          </aside>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add both to the lab**

In `apps/cms/src/studio/lab/LabPage.tsx`, import both compositions and append to `SECTIONS` (compositions are wide, so `stacked` shows the two themes one above the other):

```tsx
  { id: 'list', title: 'Composition: collection list (S-10)', stacked: true, render: ListComposition },
  { id: 'edit', title: 'Composition: edit document (S-12)', stacked: true, render: EditComposition },
```

- [ ] **Step 5: Phase 0 review and sign-off**

1. Run Gate A for all of Phase 0 (`docs/studio/05-REVIEW-PROTOCOL.md`).
2. Take screenshots of every lab section at 1440×900 in light and dark, plus the two compositions.
3. Gate C review by someone who did not build it, against `01-DESIGN-SYSTEM.md` §10.
4. Product owner reviews the two compositions against the approved direction B mockups and signs off below.

```
Phase 0 sign-off
Lab reviewed (both themes): <name>, <date>
Compositions approved: <name>, <date>
Changes requested and done: <list or "none">
```

5. Tag: `git tag studio-p0 && git push origin studio-p0` (only after the sign-off above is filled in).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/studio/lab docs/superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md
git commit -m "feat(studio): T0.10 list and edit compositions, Phase 0 sign-off"
```

---

# Phase 1: foundation

Exit criteria (from the master plan): authors can draft their own content in both admins (Task 1.19), and `jobLocations` and `redirects` are fully editable in Studio, their e2e specs pass, and the boundary and coverage checks are green in CI. Every other collection opens in Studio for builders (behind `STUDIO_SHOW_UNREADY`), with fields whose renderer belongs to a later phase shown as a placeholder that links to the same document in Payload's admin; their values are never touched by a Studio save, because Studio only sends the fields it rendered as editable (Task 1.16).

### Task 1.1: Test plumbing for server-only modules

Vitest does not read `tsconfig.json` paths, so the aliases Studio code relies on (`@/`, `@payload-config`, `server-only`) are declared here once.

**Files:**
- Modify: `apps/cms/package.json`
- Modify: `apps/cms/vitest.config.ts`
- Create: `apps/cms/src/studio/test/server-only-stub.ts`

- [ ] **Step 1: Add the package**

Run: `pnpm --filter @cleanstart/cms add server-only`
Expected: `server-only` in `apps/cms/package.json` dependencies.

- [ ] **Step 2: Stub it for Vitest**

`server-only` throws when imported outside a React Server Components build, which includes Vitest. Tests import server modules directly, so alias it to an empty module.

`apps/cms/src/studio/test/server-only-stub.ts`:

```ts
// Vitest stand-in for the `server-only` marker package, which throws outside
// a React Server Components build. See apps/cms/vitest.config.ts.
export {};
```

In `apps/cms/vitest.config.ts`, add at the top `import { fileURLToPath } from 'node:url';` and add a `resolve` key next to `esbuild`:

```ts
  resolve: {
    alias: [
      { find: 'server-only', replacement: fileURLToPath(new URL('./src/studio/test/server-only-stub.ts', import.meta.url)) },
      { find: '@payload-config', replacement: fileURLToPath(new URL('./src/payload.config.ts', import.meta.url)) },
      // A regex, so '@cleanstart/*' and '@payloadcms/*' are left alone.
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
```

Rules that follow from this:

- Studio code (`src/studio/**`, `src/app/(studio)/**`) may import `@/...` in files that tests load.
- Code under `src/payload/**` keeps relative imports (`'../admin-logic/conditions'`), as it does today. Payload's own build and the `tsx` scripts do not read these aliases.
- A test that imports `@payload-config`, directly or through a module it loads, runs the real Payload config, which needs `PAYLOAD_SECRET` and `DATABASE_URI` in the environment. CI sets both in `.github/workflows/ci.yml`. Locally, export them (or run from `apps/cms` with your `.env` loaded) before running such a test.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cleanstart/cms test`
Expected: the full existing suite still passes.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/package.json pnpm-lock.yaml apps/cms/vitest.config.ts apps/cms/src/studio/test/server-only-stub.ts
git commit -m "chore(studio): T1.1 server-only marker and Vitest stub"
```

### Task 1.2: Session

**Files:**
- Create: `apps/cms/src/studio/lib/next-path.ts`
- Test: `apps/cms/src/studio/lib/next-path.test.ts`
- Create: `apps/cms/src/studio/server/session.ts`

- [ ] **Step 1: Write the failing test**

The redirect targets are the part with logic. They live in a pure module, so the test never loads `session.ts` (which imports `next/headers` and the Payload config).

`apps/cms/src/studio/lib/next-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { loginRedirectFor, safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('keeps Studio paths', () => {
    expect(safeNextPath('/studio/collections/blogs?q=cve')).toBe('/studio/collections/blogs?q=cve');
  });

  it('rejects anything that could leave the site or Studio', () => {
    expect(safeNextPath('https://evil.example/studio')).toBe('/studio');
    expect(safeNextPath('//evil.example')).toBe('/studio');
    expect(safeNextPath('/admin')).toBe('/studio');
    expect(safeNextPath('/studio/../admin')).toBe('/studio');
    expect(safeNextPath(null)).toBe('/studio');
  });
});

describe('loginRedirectFor', () => {
  it('encodes the path to return to', () => {
    expect(loginRedirectFor('/studio/collections/blogs/12')).toBe('/studio/login?next=%2Fstudio%2Fcollections%2Fblogs%2F12');
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/lib/next-path.test.ts`
Expected: FAIL, cannot find module `./next-path`.

- [ ] **Step 3: Implement**

`apps/cms/src/studio/lib/next-path.ts`:

```ts
export const safeNextPath = (value: string | null | undefined): string => {
  if (!value || !value.startsWith('/studio') || value.startsWith('//')) return '/studio';
  const url = new URL(value, 'https://studio.invalid');
  if (url.origin !== 'https://studio.invalid' || !url.pathname.startsWith('/studio')) return '/studio';
  return `${url.pathname}${url.search}`;
};

export const loginRedirectFor = (path: string): string => `/studio/login?next=${encodeURIComponent(safeNextPath(path))}`;
```

`apps/cms/src/studio/server/session.ts`:

```ts
import 'server-only';

import config from '@payload-config';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { type Payload, type SanitizedPermissions, getPayload } from 'payload';
import { cache } from 'react';

import type { User } from '@/payload-types';
import { loginRedirectFor } from '@/studio/lib/next-path';

export type StudioSession = {
  readonly payload: Payload;
  readonly user: User;
  readonly permissions: SanitizedPermissions;
};

export const getStudioPayload = cache(async (): Promise<Payload> => getPayload({ config }));

// Reads the payload-token cookie through Payload's own auth strategies, so
// sessions, API keys and the disabled-account check behave exactly as in /api.
export const getSession = cache(async (): Promise<StudioSession | null> => {
  const payload = await getStudioPayload();
  const { user, permissions } = await payload.auth({ headers: new Headers(await headers()) });
  if (!user || user.collection !== 'users') return null;
  return { payload, user, permissions };
});

// Every Studio page calls this with its own path. Layouts are not an auth
// boundary in the App Router, so the check lives in each page.
export const requireSession = async (path: string): Promise<StudioSession> => {
  const session = await getSession();
  if (!session) redirect(loginRedirectFor(path));
  if (!session.permissions.canAccessAdmin) redirect('/studio/forbidden?reason=role');
  return session;
};
```

`safeNextPath` uses `URL` to collapse `..` segments, which is why `/studio/../admin` resolves to `/admin` and is rejected.

- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/lib/next-path.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: exit 0. If `user.collection` is not on the auth result type in this Payload version, narrow with `'collection' in user && user.collection === 'users'`.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/studio/lib/next-path.ts apps/cms/src/studio/lib/next-path.test.ts apps/cms/src/studio/server/session.ts
git commit -m "feat(studio): T1.2 session and safe redirects"
```

### Task 1.3: The Local API wrapper and error mapping

ADR-2 in one module. Everything in Studio that reads or writes data goes through `studioApi`.

**Files:**
- Create: `apps/cms/src/studio/server/errors.ts`
- Test: `apps/cms/src/studio/server/errors.test.ts`
- Create: `apps/cms/src/studio/server/payload.ts`

- [ ] **Step 1: Write the failing test for error mapping**

`apps/cms/src/studio/server/errors.test.ts`:

```ts
import { Forbidden, Locked, NotFound, ValidationError } from 'payload';
import { describe, expect, it } from 'vitest';

import { toActionError } from './errors';

describe('toActionError', () => {
  it('turns a Payload validation error into field issues', () => {
    const error = new ValidationError({
      collection: 'blogs',
      errors: [
        { path: 'slug', message: 'This field is required.' },
        { path: 'seo.title', message: 'Too long.' },
      ],
    });
    expect(toActionError(error)).toEqual({
      kind: 'validation',
      message: 'Fix the highlighted fields and try again.',
      issues: [
        { path: 'slug', message: 'This field is required.' },
        { path: 'seo.title', message: 'Too long.' },
      ],
    });
  });

  it('maps forbidden, not found and locked', () => {
    expect(toActionError(new Forbidden()).kind).toBe('forbidden');
    expect(toActionError(new NotFound()).kind).toBe('not-found');
    expect(toActionError(new Locked('Locked by someone else')).kind).toBe('locked');
  });

  it('hides unexpected error details from the user', () => {
    const mapped = toActionError(new Error('connection reset by peer'));
    expect(mapped.kind).toBe('unknown');
    expect(mapped.message).toBe('Something went wrong. Try again.');
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/errors.test.ts`
Expected: FAIL, cannot find module `./errors`.

- [ ] **Step 3: Implement the mapping**

`apps/cms/src/studio/server/errors.ts`:

```ts
import { APIError, Forbidden, Locked, NotFound, ValidationError } from 'payload';

export type FieldIssue = { readonly path: string; readonly message: string };

export type ActionErrorKind = 'validation' | 'forbidden' | 'not-found' | 'locked' | 'conflict' | 'unknown';

export type ActionError = {
  readonly kind: ActionErrorKind;
  readonly message: string;
  readonly issues: readonly FieldIssue[];
};

export type ActionResult<T> = { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: ActionError };

const MESSAGES: Record<ActionErrorKind, string> = {
  validation: 'Fix the highlighted fields and try again.',
  forbidden: 'You do not have permission to do that.',
  'not-found': 'This document no longer exists.',
  locked: 'Someone else is editing this document.',
  conflict: 'This document changed since you opened it.',
  unknown: 'Something went wrong. Try again.',
};

// Payload's errors are the typed errors here (the AppError family named in
// CLAUDE.md does not exist in the codebase). Unknown errors are reported to
// Sentry by the caller and never shown verbatim.
export const toActionError = (error: unknown): ActionError => {
  if (error instanceof ValidationError) {
    const issues = error.data.errors.map((e) => ({ path: e.path, message: e.message }));
    return { kind: 'validation', message: MESSAGES.validation, issues };
  }
  if (error instanceof Forbidden) return { kind: 'forbidden', message: MESSAGES.forbidden, issues: [] };
  if (error instanceof NotFound) return { kind: 'not-found', message: MESSAGES['not-found'], issues: [] };
  if (error instanceof Locked) return { kind: 'locked', message: MESSAGES.locked, issues: [] };
  if (error instanceof APIError && error.isPublic) return { kind: 'unknown', message: error.message, issues: [] };
  return { kind: 'unknown', message: MESSAGES.unknown, issues: [] };
};
```

- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/errors.test.ts`
Expected: PASS (3 tests). If `APIError#isPublic` is not a public property in this Payload version, drop that branch and keep the generic message.

- [ ] **Step 5: Implement the wrapper**

`apps/cms/src/studio/server/payload.ts`:

```ts
import 'server-only';

import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { type CollectionSlug, type Payload, type PayloadRequest, createLocalReq } from 'payload';

import { type ActionResult, toActionError } from './errors';
import type { StudioSession } from './session';

// The only module in src/studio allowed to call the Local API. Every call runs
// as the signed-in user with overrideAccess and overrideLock off, so Payload's
// access control, field access, hooks and document locks all apply (ADR-2).
// scripts/check-studio-boundaries.ts enforces that nothing else calls getPayload.

type Strip<T> = Omit<T, 'overrideAccess' | 'overrideLock' | 'req' | 'user' | 'showHiddenFields' | 'disableTransaction'>;

type FindArgs = Strip<Parameters<Payload['find']>[0]>;
type FindByIDArgs = Strip<Parameters<Payload['findByID']>[0]>;
type CountArgs = Strip<Parameters<Payload['count']>[0]>;
type CreateArgs = Strip<Parameters<Payload['create']>[0]>;
type UpdateByIDArgs = Strip<Extract<Parameters<Payload['update']>[0], { id: unknown }>>;
// Extract<..., { id: unknown }> on Payload's delete options resolves to never, so this one is spelled out.
// depth has no `| undefined`: Payload's ByIDOptions declares `depth?: number`, which exactOptionalPropertyTypes enforces.
type DeleteByIDArgs = { readonly collection: CollectionSlug; readonly id: number | string; readonly depth?: number };
type DuplicateArgs = Strip<Parameters<Payload['duplicate']>[0]>;
type FindVersionsArgs = Strip<Parameters<Payload['findVersions']>[0]>;
type RestoreVersionArgs = Strip<Parameters<Payload['restoreVersion']>[0]>;
type FindGlobalArgs = Strip<Parameters<Payload['findGlobal']>[0]>;
type UpdateGlobalArgs = Strip<Parameters<Payload['updateGlobal']>[0]>;

export type StudioApi = ReturnType<typeof buildApi>;

const buildApi = (payload: Payload, req: PayloadRequest) => {
  const as = { req, user: req.user, overrideAccess: false } as const;
  const asLocked = { ...as, overrideLock: false } as const;
  return {
    payload,
    req,
    find: (args: FindArgs) => payload.find({ ...args, ...as } as Parameters<Payload['find']>[0]),
    findByID: (args: FindByIDArgs) => payload.findByID({ ...args, ...as } as Parameters<Payload['findByID']>[0]),
    count: (args: CountArgs) => payload.count({ ...args, ...as } as Parameters<Payload['count']>[0]),
    create: (args: CreateArgs) => payload.create({ ...args, ...as } as Parameters<Payload['create']>[0]),
    update: (args: UpdateByIDArgs) => payload.update({ ...args, ...asLocked } as Parameters<Payload['update']>[0]),
    delete: (args: DeleteByIDArgs) => payload.delete({ ...args, ...asLocked }),
    duplicate: (args: DuplicateArgs) => payload.duplicate({ ...args, ...as } as Parameters<Payload['duplicate']>[0]),
    findVersions: (args: FindVersionsArgs) =>
      payload.findVersions({ ...args, ...as } as Parameters<Payload['findVersions']>[0]),
    restoreVersion: (args: RestoreVersionArgs) =>
      payload.restoreVersion({ ...args, ...as } as Parameters<Payload['restoreVersion']>[0]),
    findGlobal: (args: FindGlobalArgs) => payload.findGlobal({ ...args, ...as } as Parameters<Payload['findGlobal']>[0]),
    updateGlobal: (args: UpdateGlobalArgs) =>
      payload.updateGlobal({ ...args, ...asLocked } as Parameters<Payload['updateGlobal']>[0]),
  };
};

export const studioApi = async (session: StudioSession): Promise<StudioApi> => {
  const req = await createLocalReq({ user: session.user, req: { headers: new Headers(await headers()) } }, session.payload);
  return buildApi(session.payload, req);
};

// Wraps a server action body: maps Payload errors to ActionResult and reports
// unexpected ones to Sentry.
export const runAction = async <T>(work: () => Promise<T>): Promise<ActionResult<T>> => {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    const mapped = toActionError(error);
    if (mapped.kind === 'unknown') Sentry.captureException(error);
    return { ok: false, error: mapped };
  }
};
```

The `as Parameters<...>` casts re-attach the generic slug type that `Strip` loses; the spread values are exactly the stripped keys, so the cast cannot hide a wrong key.

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: exit 0.

```bash
git add apps/cms/src/studio/server/errors.ts apps/cms/src/studio/server/errors.test.ts apps/cms/src/studio/server/payload.ts
git commit -m "feat(studio): T1.3 Local API wrapper and error mapping"
```

### Task 1.4: Permissions

**Files:**
- Create: `apps/cms/src/studio/server/permissions.ts`
- Test: `apps/cms/src/studio/server/permissions.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/studio/server/permissions.test.ts`:

```ts
import type { SanitizedPermissions } from 'payload';
import { describe, expect, it } from 'vitest';

import { collectionCan, fieldCan, globalCan } from './permissions';

// The sanitized shape (payload/dist/utilities/sanitizePermissions.js): a field
// whose grants are all true becomes `true`, a denied grant is deleted, and a
// field with nothing granted is removed. A `fields` map that is all true
// collapses to `true` itself.
const permissions = {
  canAccessAdmin: true,
  collections: {
    blogs: {
      create: true,
      read: true,
      update: true,
      fields: {
        title: true,
        seo: { create: true, read: true, update: true, fields: { title: true, additionalSchema: { create: true, read: true } } },
      },
    },
    redirects: {
      create: true,
      read: true,
      update: true,
      delete: true,
      fields: {
        from: true,
        to: true,
        status: true,
        notes: true,
        source: { create: true, read: true },
        hitCount: { create: true, read: true },
        lastHitAt: { create: true, read: true },
      },
    },
    jobLocations: { create: true, read: true, update: true, delete: true, fields: true },
    leads: { read: true, fields: true },
    news: { read: true, create: true, update: { permission: true, where: { createdBy: { equals: 7 } } }, fields: true },
  },
  globals: { siteSettings: { read: true, fields: true } },
} as unknown as SanitizedPermissions;

describe('collectionCan', () => {
  it('reads the boolean grants Payload computed for the user', () => {
    expect(collectionCan(permissions, 'blogs', 'update')).toBe(true);
    expect(collectionCan(permissions, 'blogs', 'delete')).toBe(false);
    expect(collectionCan(permissions, 'leads', 'create')).toBe(false);
    expect(collectionCan(permissions, 'missing', 'read')).toBe(false);
  });

  it('counts a where-scoped grant as granted (D-6 authors)', () => {
    expect(collectionCan(permissions, 'news', 'update')).toBe(true);
    expect(collectionCan(permissions, 'news', 'delete')).toBe(false);
  });

  // A coarse, collection-level hint only. Whether this user may publish a given
  // document is decided per document with data { _status: 'published' } (09 §2.2).
  it('treats publish as update at collection level (getDocumentPermissions.js:30-37)', () => {
    expect(collectionCan(permissions, 'blogs', 'publish')).toBe(true);
    expect(collectionCan(permissions, 'leads', 'publish')).toBe(false);
  });
});

describe('fieldCan', () => {
  it('follows nested field permissions', () => {
    expect(fieldCan(permissions.collections?.blogs?.fields, ['title'], 'update')).toBe(true);
    expect(fieldCan(permissions.collections?.blogs?.fields, ['seo', 'additionalSchema'], 'update')).toBe(false);
    expect(fieldCan(permissions.collections?.blogs?.fields, ['seo', 'additionalSchema'], 'read')).toBe(true);
  });

  it('allows a field sanitized to true and denies one Payload omitted', () => {
    expect(fieldCan(permissions.collections?.blogs?.fields, ['seo', 'title'], 'update')).toBe(true);
    expect(fieldCan(permissions.collections?.jobLocations?.fields, ['name'], 'update')).toBe(true);
    expect(fieldCan(permissions.collections?.blogs?.fields, ['abstract'], 'read')).toBe(false);
    expect(fieldCan(permissions.collections?.blogs?.fields, ['abstract'], 'update')).toBe(false);
  });

  it('keeps the Redirects system fields read-only while from stays editable', () => {
    const fields = permissions.collections?.redirects?.fields;
    expect(fieldCan(fields, ['from'], 'update')).toBe(true);
    for (const name of ['source', 'hitCount', 'lastHitAt']) {
      expect(fieldCan(fields, [name], 'read')).toBe(true);
      expect(fieldCan(fields, [name], 'update')).toBe(false);
    }
  });
});

describe('globalCan', () => {
  it('reads global grants', () => {
    expect(globalCan(permissions, 'siteSettings', 'read')).toBe(true);
    expect(globalCan(permissions, 'siteSettings', 'update')).toBe(false);
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/permissions.test.ts`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

`apps/cms/src/studio/server/permissions.ts`:

```ts
import type { SanitizedPermissions } from 'payload';

export type CollectionOperation = 'read' | 'create' | 'update' | 'delete' | 'publish';
export type GlobalOperation = 'read' | 'update';

type Grants = { readonly [op: string]: unknown };

// An unconditional grant is sanitized to `true`; a grant scoped by a `where`
// (for example D-6 authors updating only their own drafts) stays
// `{ permission: true, where }`. Both mean the user may do it for some
// documents; the document's own check (`docAccessOperation`) decides per row.
const granted = (grants: Grants | undefined, op: string): boolean => {
  const grant: unknown = grants?.[op];
  return grant === true || (typeof grant === 'object' && grant !== null && (grant as { permission?: unknown }).permission === true);
};

export const collectionCan = (
  permissions: SanitizedPermissions,
  slug: string,
  op: CollectionOperation,
): boolean => {
  const grants = permissions.collections?.[slug] as Grants | undefined;
  return granted(grants, op === 'publish' ? 'update' : op);
};

export const globalCan = (permissions: SanitizedPermissions, slug: string, op: GlobalOperation): boolean =>
  granted(permissions.globals?.[slug] as Grants | undefined, op);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const opGranted = (grant: unknown): boolean => grant === true || (isRecord(grant) && grant.permission === true);

// Walks Payload's sanitized field permissions (SanitizedFieldsPermissions in
// payload/dist/auth/types.d.ts). `true` at any level means everything below is
// allowed. A field missing from an object level had every grant denied, so it
// is denied. A present node lists only the grants that are true.
export const fieldCan = (fields: unknown, path: readonly string[], op: 'read' | 'update' | 'create'): boolean => {
  let level = fields;
  for (const [index, segment] of path.entries()) {
    if (level === undefined || level === true) return true;
    if (!isRecord(level)) return false;
    const node = level[segment];
    if (node === true) return true;
    if (!isRecord(node)) return false;
    if (index === path.length - 1) return opGranted(node[op]);
    if (node.read !== true) return false;
    level = node.fields;
  }
  return true;
};
```

- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/permissions.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Confirm the sanitized shape against a real user**

The rules in `fieldCan` follow `payload/dist/utilities/sanitizePermissions.js`: a field whose grants are all true becomes `true`, a false grant is deleted, an emptied field is removed (so an omitted field is denied), and a `fields` map that is all true becomes `true`. Confirm it once against real data before relying on it:

```bash
cd apps/cms && pnpm exec tsx --env-file=.env -e "
import config from './src/payload.config';
import { getPayload, createLocalReq, getAccessResults } from 'payload';
const p = await getPayload({ config });
const { docs } = await p.find({ collection: 'users', where: { roles: { in: ['editor'] } }, limit: 1, overrideAccess: true });
const req = await createLocalReq({ user: { ...docs[0], collection: 'users' } as never }, p);
const perms = await getAccessResults({ req });
console.log(JSON.stringify({ blogs: perms.collections?.blogs, users: perms.collections?.users?.fields }, null, 1).slice(0, 2000));
process.exit(0);
"
```

Expected: `blogs` has `create`, `read`, `update`, `delete` true and `fields.seo.fields.additionalSchema` is an object without `update` (editor cannot write it, `fields/seo.ts:375-390`); fields the editor fully controls print as `true`; `users.fields.roles` is an object without `update`. If the shape differs, update `granted` and `fieldCan` and their tests to match before moving on.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/studio/server/permissions.ts apps/cms/src/studio/server/permissions.test.ts
git commit -m "feat(studio): T1.4 permission helpers"
```

### Task 1.5: Boundary check

**Files:**
- Create: `apps/cms/scripts/check-studio-boundaries.ts`
- Modify: `apps/cms/package.json` (script `verify:studio-boundaries`)

- [ ] **Step 1: Write the check**

`apps/cms/scripts/check-studio-boundaries.ts`:

```ts
#!/usr/bin/env node
/**
 * Studio boundary rules (docs/studio/00-MASTER-PLAN.md ADR-2, ADR-10):
 *  1. Only src/studio/server/payload.ts and session.ts may import getPayload.
 *  2. Nothing under src/studio may pass overrideAccess: true.
 *  3. Nothing under src/studio may import @payloadcms/ui, @payloadcms/next,
 *     or src/payload/admin/** except the shared modules listed below.
 *  4. Studio components may not use arbitrary colour or font-size utilities
 *     (bg-[#…], text-[13px] and friends); tokens only.
 *
 * Run: pnpm --filter @cleanstart/cms verify:studio-boundaries
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const STUDIO = path.join(ROOT, 'src', 'studio');

const GET_PAYLOAD_ALLOWED = new Set(['src/studio/server/payload.ts', 'src/studio/server/session.ts']);

// SHARE and KEEP modules from docs/studio/03-FIELD-AND-COMPONENT-MAP.md §B.
const ADMIN_IMPORTS_ALLOWED = [
  '@/payload/admin/Icon',
  '@/payload/admin/Logo',
  '@/payload/admin/lib/quick-create-config',
  '@/payload/admin/components/_site-url',
  '@/payload/admin/components/display-published-at-state',
  '@/payload/admin/components/internal-routes',
  '@/payload/admin/components/InlineImage/context-hint',
  '@/payload/admin/components/InlineImage/folder',
  '@/payload/admin/components/Embed/embed-providers',
  '@/payload/admin/components/fields/relationship-value',
  '@/payload/admin/components/views/list/export-date-preset',
  '@/payload/admin/components/views/list/export-default-columns',
  '@/payload/admin/components/views/list/filters/list-filter-config',
  '@/payload/admin/components/views/list/filters/list-filter-where',
];

const RULES: ReadonlyArray<{ id: string; test: (rel: string, src: string) => string | null }> = [
  {
    id: 'get-payload',
    test: (rel, src) =>
      /\bgetPayload\s*\(/.test(src) && !GET_PAYLOAD_ALLOWED.has(rel) ? 'calls getPayload outside the data layer' : null,
  },
  {
    id: 'override-access',
    test: (_rel, src) => (/overrideAccess\s*:\s*true/.test(src) ? 'passes overrideAccess: true' : null),
  },
  {
    id: 'payload-ui',
    test: (_rel, src) => (/from\s+['"]@payloadcms\/(ui|next)/.test(src) ? 'imports @payloadcms/ui or @payloadcms/next' : null),
  },
  {
    id: 'admin-import',
    test: (_rel, src) => {
      const hits = [...src.matchAll(/from\s+['"](@\/payload\/admin\/[^'"]+)['"]/g)].map((m) => m[1] ?? '');
      const bad = hits.filter((spec) => !ADMIN_IMPORTS_ALLOWED.some((ok) => spec === ok || spec.startsWith(`${ok}.`)));
      return bad.length > 0 ? `imports Payload admin modules: ${bad.join(', ')}` : null;
    },
  },
  {
    id: 'arbitrary-style',
    test: (rel, src) => {
      if (!rel.endsWith('.tsx')) return null;
      const hit = src.match(/\b(?:bg|text|border|outline|ring|fill|stroke|shadow)-\[(?:#|rgb|hsl|\d+px)/);
      return hit ? `uses an arbitrary style value (${hit[0]}…); use a token` : null;
    },
  },
];

const walk = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    }),
  );
  return nested.flat();
};

const main = async (): Promise<void> => {
  const files = await walk(STUDIO);
  const failures: string[] = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const src = await fs.readFile(file, 'utf8');
    for (const rule of RULES) {
      const problem = rule.test(rel, src);
      if (problem) failures.push(`${rel}: [${rule.id}] ${problem}`);
    }
  }
  if (failures.length > 0) {
    console.error(`Studio boundary check failed (${failures.length}):\n${failures.map((f) => `  ${f}`).join('\n')}`);
    process.exit(1);
  }
  console.info(`Studio boundary check passed (${files.length} files).`);
};

await main();
```

- [ ] **Step 2: Register the script**

In `apps/cms/package.json` `scripts`, add:

```json
"verify:studio-boundaries": "node --experimental-strip-types --no-warnings scripts/check-studio-boundaries.ts",
```

- [ ] **Step 3: Prove it catches a violation, then passes**

```bash
printf "export const bad = { overrideAccess: true };\n" > apps/cms/src/studio/server/__probe.ts
pnpm --filter @cleanstart/cms verify:studio-boundaries; echo "exit=$?"
rm apps/cms/src/studio/server/__probe.ts
pnpm --filter @cleanstart/cms verify:studio-boundaries; echo "exit=$?"
```

Expected: first run prints `src/studio/server/__probe.ts: [override-access] passes overrideAccess: true` and `exit=1`; second run prints `Studio boundary check passed` and `exit=0`.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/check-studio-boundaries.ts apps/cms/package.json
git commit -m "feat(studio): T1.5 Studio boundary check"
```

### Task 1.6: Move conditions and validators into one shared module (ADR-6)

Studio's form runs in the browser, so it needs the same `admin.condition` and `validate` functions Payload runs. Today they are scattered: 87 condition sites (78 inline arrows, 8 `kindIs(...)` factory calls, 1 pass-through) and 62 validator sites (28 inline functions, 33 references to 6 named helpers, 1 pass-through). This task gives every one of them a registry key in `apps/cms/src/payload/admin-logic/`, with no change in behaviour. Collection configs import from there, so there is still one source of truth. Appendix A and Appendix B at the end of this plan list every site with its key.

How Studio finds a function's key:

- **Conditions** are looked up by function identity (`CONDITION_KEYS`). `buildStudioSchema` throws for any condition it cannot find, so Task 1.7's "every collection builds" test proves completeness.
- **Validators** cannot be found by identity alone, because Payload wraps every field without a custom `validate` in its own default validator (`payload/dist/fields/config/sanitize.js:153-166`). So the registry holds the custom ones, and a source test proves every `validate:` in the schema points at a registered function.

**Files:**
- Create: `apps/cms/src/payload/admin-logic/field-helpers.ts` (browser-safe constants the conditions use)
- Create: `apps/cms/src/payload/admin-logic/conditions.ts`
- Create: `apps/cms/src/payload/admin-logic/validators.ts` (pure, browser-safe)
- Create: `apps/cms/src/payload/admin-logic/validator-registry.ts` (pure and server entries; never imported from client code)
- Create: `apps/cms/src/payload/admin-logic/registry.test.ts`
- Modify: `apps/cms/src/payload/fields/slug.ts` (named slug validators)
- Modify: `apps/cms/scripts/check-studio-boundaries.ts` (client import rule for the registry)
- Modify: every file in Appendix A and Appendix B

- [ ] **Step 1: Regenerate the site lists**

```bash
cd apps/cms
grep -rn "condition:" src/payload/collections src/payload/globals src/payload/fields src/payload/blocks src/payload/lib | grep -v '\.test\.' > /tmp/conditions.txt
grep -rn "validate:" src/payload/collections src/payload/globals src/payload/fields src/payload/blocks src/payload/lib | grep -v '\.test\.' > /tmp/validators.txt
wc -l /tmp/conditions.txt /tmp/validators.txt
```

Expected: 87 and 62. If either differs from the appendices, the schema changed since 2026-10-16: add or remove rows in the appendix before continuing.

- [ ] **Step 2: Write the failing tests**

`apps/cms/src/payload/admin-logic/registry.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { CONDITION_KEYS, conditions } from './conditions';
import { pureValidators } from './validators';
import { VALIDATOR_REGISTRY, validatorKeyOf } from './validator-registry';

const PAYLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['collections', 'globals', 'fields', 'blocks', 'lib'];

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return name.endsWith('.ts') && !name.endsWith('.test.ts') ? [full] : [];
  });

const validateLines = SCAN.flatMap((d) => sourceFiles(path.join(PAYLOAD_DIR, d))).flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((line, i) => ({ line: line.trim(), at: `${path.relative(PAYLOAD_DIR, file)}:${i + 1}` }))
    .filter(({ line }) => /\bvalidate:/.test(line) && !line.includes('opts.validate')),
);

describe('conditions', () => {
  it('maps every registered function back to its key', () => {
    for (const [key, fn] of Object.entries(conditions)) expect(CONDITION_KEYS.get(fn)).toBe(key);
  });
});

describe('validators', () => {
  it('leaves no inline validate function in the schema source', () => {
    const inline = validateLines.filter(({ line }) => /validate:\s*(\(|async\b|function\b)/.test(line)).map((l) => l.at);
    expect(inline).toEqual([]);
  });

  it('points every validate at a registered function', () => {
    const names = validateLines.map(({ line, at }) => ({ at, name: line.match(/validate:\s*(?:validators\.)?([A-Za-z_$][\w$]*)/)?.[1] }));
    const registered = new Set(Object.values(VALIDATOR_REGISTRY).map((entry) => entry.fn.name));
    const missing = names.filter(({ name }) => !name || !registered.has(name)).map(({ at, name }) => `${at} (${name})`);
    expect(missing).toEqual([]);
  });

  it('finds a key for every registered function', () => {
    for (const [key, entry] of Object.entries(VALIDATOR_REGISTRY)) expect(validatorKeyOf(entry.fn)).toBe(key);
  });

  it('keeps the browser module free of server entries', () => {
    for (const key of Object.keys(pureValidators)) expect(VALIDATOR_REGISTRY[key as keyof typeof VALIDATOR_REGISTRY]?.kind).toBe('pure');
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/admin-logic/registry.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Move the helpers the conditions depend on**

Some conditions call constants and predicates that live in their collection file: `VISIBLE_LABEL_TYPES`, `PLACEHOLDER_TYPES` and `VALIDATION_TYPES` (`collections/Forms.ts:10-12`, Appendix A rows 10, 12 and 15), `DISPATCHING_KINDS` and `isDispatching` (`collections/Integrations.ts:68-72` and `85-88`, rows 26 to 28) and `isImage` (`collections/Media.ts:37`, rows 37 to 39). Move them first, so the conditions can move without reaching back into a collection file (which would pull server code into the browser bundle).

`apps/cms/src/payload/admin-logic/field-helpers.ts`:

```ts
// Constants and predicates that field conditions share with their collections.
// Moved from collections/Forms.ts, Integrations.ts and Media.ts (ADR-6).
// Browser-safe: no server imports.

export const VISIBLE_LABEL_TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'consent'];
export const PLACEHOLDER_TYPES = ['text', 'email', 'textarea'];
export const VALIDATION_TYPES = ['text', 'email', 'textarea'];

// Which integration kinds subscribe to outbound events (and therefore need routing).
export const DISPATCHING_KINDS: ReadonlySet<string> = new Set(['teamsWorkflow', 'genericWebhook', 'hubspotCrm']);

export const isDispatching = (sibling: unknown): boolean => {
  const kind = (sibling as { kind?: string } | null)?.kind;
  return typeof kind === 'string' && DISPATCHING_KINDS.has(kind);
};

// Takes unknown because conditions type siblingData as Record<string, unknown>.
// Same result as the old Boolean(mimeType?.startsWith('image/')) for every input it got.
export const isImage = (mimeType: unknown): boolean => typeof mimeType === 'string' && mimeType.startsWith('image/');
```

Then, in each collection, delete the local definitions and import them back (relative imports, as everywhere in `src/payload`):

- `collections/Forms.ts`: delete lines 10 to 12 and add `import { PLACEHOLDER_TYPES, VALIDATION_TYPES, VISIBLE_LABEL_TYPES } from '../admin-logic/field-helpers';`.
- `collections/Integrations.ts`: delete `DISPATCHING_KINDS` (lines 68 to 72) and `isDispatching` (lines 85 to 88) and add `import { DISPATCHING_KINDS, isDispatching } from '../admin-logic/field-helpers';`. The `export { ACTIVE_KIND_OPTIONS, RESERVED_KIND_OPTIONS, DISPATCHING_KINDS };` line at the end of the file keeps working as a re-export. Nothing else imports `DISPATCHING_KINDS` (`grep -rn DISPATCHING_KINDS apps/cms/src`), so its type widening from `Set<IntegrationKind>` to `ReadonlySet<string>` breaks no caller.
- `collections/Media.ts`: delete lines 37 and 38 and add `import { isImage } from '../admin-logic/field-helpers';`. Its other callers (the `alt` validator and the `beforeChange` hook) pass a string or nothing, which `isImage` still handles.

Run: `pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test`
Expected: exit 0 and the existing suite unchanged. This step changes no behaviour.

- [ ] **Step 4: Create the registry modules**

`apps/cms/src/payload/admin-logic/conditions.ts` (browser-safe; one entry per row of Appendix A; the entries below are the first rows, the rest follow the same pattern with the code from the appendix's "Current code" column moved byte for byte):

```ts
// Field visibility rules shared by the Payload config and Studio's form engine
// (docs/studio/00-MASTER-PLAN.md ADR-6). Browser-safe: no server imports.
// Signature matches Payload's admin.condition: (data, siblingData, ctx).

import { PLACEHOLDER_TYPES, isDispatching, isImage } from './field-helpers';

type Data = Record<string, unknown> | undefined;
type Ctx = { readonly user?: unknown; readonly operation?: 'create' | 'update'; readonly path?: readonly (string | number)[] };
export type Condition = (data: Data, siblingData: Data, ctx: Ctx) => boolean;

// Integrations: one keyed entry per kind instead of the kindIs() factory, whose
// fresh closure per call cannot be looked up by identity.
const kindIs =
  (...targets: readonly string[]): Condition =>
  (_data, sibling) => {
    const kind = (sibling as { kind?: unknown } | undefined)?.kind;
    return typeof kind === 'string' && targets.includes(kind);
  };

export const conditions = {
  'caseStudies.quoteAuthor': (_data, sibling) => Boolean(sibling?.quote),
  'caseStudies.quoteRole': (_data, sibling) => Boolean(sibling?.quote),
  'events.registrationUrl': (_data, sibling) => sibling?.registrationMode === 'external',
  'events.registrationForm': (_data, sibling) => sibling?.registrationMode === 'internal',
  'events.attendeesCap': (_data, sibling) => sibling?.registrationMode === 'internal',
  // siblingData is Record<string, unknown> here, so the type is narrowed before
  // includes(). Same result as the old `PLACEHOLDER_TYPES.includes(sibling?.type ?? '')`.
  'forms.placeholder': (_data, sibling) => typeof sibling?.type === 'string' && PLACEHOLDER_TYPES.includes(sibling.type),
  'integrations.kind.teamsWorkflow': kindIs('teamsWorkflow'),
  'integrations.kind.genericWebhook': kindIs('genericWebhook'),
  'integrations.kind.hubspotCrm': kindIs('hubspotCrm'),
  'integrations.kind.ga4DataApi': kindIs('ga4DataApi'),
  'integrations.kind.gscSearchAnalyticsApi+gscUrlInspectionApi': kindIs('gscSearchAnalyticsApi', 'gscUrlInspectionApi'),
  'integrations.kind.msClarity': kindIs('msClarity'),
  'integrations.kind.cloudflareWebAnalytics': kindIs('cloudflareWebAnalytics'),
  'integrations.kind.calComInbound': kindIs('calComInbound'),
  'integrations.routing': (_, sibling) => isDispatching(sibling),
  'media.decorative': (_data, siblingData) => isImage(siblingData?.mimeType),
  'seo.ogImageAlt': (_data, sibling) => Boolean(sibling?.ogImage),
  'seo.ogTitle': (_data, sibling) => sibling?.useAdvancedOg === true,
} satisfies Record<string, Condition>;

export type ConditionKey = keyof typeof conditions;

export const CONDITION_KEYS: ReadonlyMap<Condition, ConditionKey> = new Map(
  (Object.entries(conditions) as Array<[ConditionKey, Condition]>).map(([key, fn]) => [fn, key]),
);
```

Rows 10 and 15 (`forms.label`, `forms.validation`) take the same `typeof sibling?.type === 'string' && LIST.includes(sibling.type)` narrowing as `forms.placeholder` above, with `VISIBLE_LABEL_TYPES` and `VALIDATION_TYPES`; add those names to the `./field-helpers` import when you add the rows. Every other row moves byte for byte.

Before replacing `kindIs` in `collections/Integrations.ts`, read its full body (`Integrations.ts:90-100`) and make the shared version above behave identically (it must handle the array form, which the variadic form covers). Delete the local `kindIs` once all eight call sites use the registry.

`apps/cms/src/payload/admin-logic/validators.ts` (browser-safe, `pure` entries only):

```ts
// Field validators that depend only on (value, { data, siblingData }).
// Shared by the Payload config and Studio's client validation (ADR-6).
// Browser-safe: no server imports.

import { validateOptionalUrl } from '../lib/url-shape';

export const pureValidators = {
  validateOptionalUrl: { kind: 'pure', fn: validateOptionalUrl },
  // One entry per pure row of Appendix B: named helpers keep their own name as
  // the key; extracted inline functions use the appendix key.
} as const;
```

Confirm `../lib/url-shape` imports nothing server-side (`grep -n "^import" apps/cms/src/payload/lib/url-shape.ts`); the planning check on 2026-10-16 found only exports. Apply the same check to every helper added here.

`apps/cms/src/payload/admin-logic/validator-registry.ts`:

```ts
// Every registered validator, pure and server. Server entries need req, payload
// or the database; only Payload runs them, and Studio shows their result from
// the save response. Not marked server-only, because the tsx scripts
// (check-studio-coverage.ts, studio-inventory.ts) import it and plain tsx has no
// react-server condition. scripts/check-studio-boundaries.ts rejects any
// 'use client' file that imports it.

import type { Validate } from 'payload';

import { slugIsUnique, slugIsUniqueComposite } from '../fields/slug';
import { pureValidators } from './validators';

const serverValidators = {
  // fields/slug.ts (collision lookup); Pages uses the composite form (collections/Pages.ts:58).
  'slug.unique': { kind: 'server', fn: slugIsUnique },
  'slug.uniqueComposite': { kind: 'server', fn: slugIsUniqueComposite },
  // One entry per server row of Appendix B.
} as const;

export const VALIDATOR_REGISTRY = { ...pureValidators, ...serverValidators } as const satisfies Record<
  string,
  { readonly kind: 'pure' | 'server'; readonly fn: Validate }
>;

export type ValidatorKey = keyof typeof VALIDATOR_REGISTRY;

const BY_FN = new Map<Validate, ValidatorKey>(
  (Object.entries(VALIDATOR_REGISTRY) as Array<[ValidatorKey, { fn: Validate }]>).map(([key, entry]) => [entry.fn, key]),
);

export const validatorKeyOf = (fn: unknown): ValidatorKey | null =>
  typeof fn === 'function' ? (BY_FN.get(fn as Validate) ?? null) : null;
```

`slugIsUnique` and `slugIsUniqueComposite` replace the inline validator at `fields/slug.ts:98`. That inline function closes over the factory's `composite` option, so it becomes two named functions, one per value of `composite`. In `apps/cms/src/payload/fields/slug.ts`, add above `slugField`:

```ts
const slugCollision = async (
  value: string | string[] | null | undefined,
  options: SlugValidateOptions,
  composite: boolean,
): Promise<true | string> => {
  const lengthResult = validateSlugLength(value);
  if (lengthResult !== true) return lengthResult;

  if (typeof value !== 'string' || value.trim().length === 0) return true;

  const payload = options.req?.payload;
  const collectionSlug = options.collectionSlug;
  if (!payload || !collectionSlug) return true;

  const parent = composite ? (options.siblingData?.parent ?? options.data?.parent ?? null) : null;

  const where = buildCollisionWhere({
    value,
    id: options.id,
    parent,
    composite,
  });

  const result = await payload.find({
    collection: collectionSlug as CollectionSlug,
    where,
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  if (result.docs.length > 0) {
    return SLUG_COLLISION_MESSAGE;
  }
  return true;
};

// Slug unique within its collection.
export const slugIsUnique = (
  value: string | string[] | null | undefined,
  options: SlugValidateOptions,
): Promise<true | string> => slugCollision(value, options, false);

// Slug unique among siblings with the same `parent` (Pages).
export const slugIsUniqueComposite = (
  value: string | string[] | null | undefined,
  options: SlugValidateOptions,
): Promise<true | string> => slugCollision(value, options, true);
```

The body is the old inline function unchanged, with `composite` passed in instead of closed over. Then replace the whole `validate: async (...) => { ... },` property inside `slugField` with this one line:

```ts
  ...(composite ? { validate: slugIsUniqueComposite } : { validate: slugIsUnique }),
```

The registry test matches the first name after `validate:` on that line (`slugIsUniqueComposite`), and both names are registered, so it passes.

Then add the client rule to `apps/cms/scripts/check-studio-boundaries.ts` (Task 1.5): append this entry to `RULES`:

```ts
  {
    id: 'client-registry',
    test: (_rel, src) =>
      /^\s*['"]use client['"]/.test(src) && /from\s+['"][^'"]*admin-logic\/validator-registry['"]/.test(src)
        ? 'imports the validator registry (server validators) from a client component'
        : null,
  },
```

Client code imports `../admin-logic/validators` (pure entries) or `import type` from the registry, never the registry's values.

- [ ] **Step 5: Move each site, one file at a time**

For each file in the appendices, in this order: `fields/*` (shared helpers, used by many collections), `blocks/*`, `globals/*`, `collections/*`, `lib/*`.

1. **Inline condition:** cut the arrow into `conditions.ts` under its appendix key, byte for byte. At the site write `condition: conditions['<key>'],` and add the relative import, for example `import { conditions } from '../admin-logic/conditions';` in a collection file.
2. **`kindIs(...)`:** replace with `conditions['integrations.kind.<kind>']`.
3. **Inline validator:** move the function body into a named, exported function in the same file (for example `export const embedUrlIsValid: TextFieldValidation = (value) => { … }`), register it in `validators.ts` (pure) or `validator-registry.ts` (server) under the appendix key, and point the site at the named function. The function name must equal the name used at the site, because the source test matches by name.
4. **Named helper** (`validateOptionalUrl`, `validatePath`, `validatePartialOverride`, `validateYoutubeUrl`, `validateScheduledDatePresent`, `validateEndsAfterStarts`): leave the site alone; register the helper once in the right module.
5. Run `pnpm --filter @cleanstart/cms exec vitest run src/payload/admin-logic` after each file; the failing list shrinks.

Worked example, `apps/cms/src/payload/fields/seo.ts:79`:

```ts
// before
      condition: (_data, siblingData) => Boolean(siblingData?.ogImage),
// after
      condition: conditions['seo.ogImageAlt'],
```

- [ ] **Step 6: Prove nothing changed**

```bash
pnpm --filter @cleanstart/cms exec vitest run src/payload/admin-logic/registry.test.ts
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms generate:types && git diff --stat apps/cms/src/payload-types.ts
```

Expected: registry tests PASS (5), the whole existing suite unchanged, typecheck exit 0, and no diff in `payload-types.ts`.

Then open three documents in Payload's admin (an event, a blog with an OG image, a Teams integration) and confirm conditional fields show and hide exactly as before, and that saving a blog with a duplicate slug still shows the slug error.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/admin-logic apps/cms/src/payload/collections apps/cms/src/payload/globals apps/cms/src/payload/fields apps/cms/src/payload/blocks apps/cms/src/payload/lib apps/cms/scripts/check-studio-boundaries.ts
git commit -m "refactor(cms): T1.6 move field conditions and validators into admin-logic"
```

### Task 1.7: The Studio schema

`buildStudioSchema` turns the sanitized Payload config into a serializable tree that the client form engine renders.

**Files:**
- Create: `apps/cms/src/studio/server/schema/types.ts`
- Create: `apps/cms/src/studio/server/schema/build-schema.ts`
- Test: `apps/cms/src/studio/server/schema/build-schema.test.ts`

- [ ] **Step 1: Define the types**

`apps/cms/src/studio/server/schema/types.ts`:

```ts
import type { ConditionKey } from '@/payload/admin-logic/conditions';
import type { ValidatorKey } from '@/payload/admin-logic/validator-registry';

export type StudioOption = { readonly value: string; readonly label: string };

type FieldBase = {
  /** Data key, or null for presentational containers (row, collapsible, unnamed tab). */
  readonly name: string | null;
  readonly label: string | null;
  readonly description: string | null;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly hidden: boolean;
  readonly position: 'main' | 'sidebar';
  readonly width: string | null;
  readonly condition: ConditionKey | null;
  readonly validator: { readonly key: ValidatorKey; readonly kind: 'pure' | 'server' } | null;
  /** admin.components.Field path, resolved through src/studio/form/registry-manifest.ts. */
  readonly component: string | null;
  readonly cell: string | null;
  readonly rowLabel: string | null;
  /** Static defaultValue from the config; null when absent or computed by a function (Payload applies those on create). */
  readonly defaultValue: unknown;
};

export type StudioField =
  | (FieldBase & { readonly type: 'text'; readonly hasMany: boolean; readonly minLength: number | null; readonly maxLength: number | null })
  | (FieldBase & { readonly type: 'textarea'; readonly minLength: number | null; readonly maxLength: number | null })
  | (FieldBase & { readonly type: 'email' })
  | (FieldBase & { readonly type: 'number'; readonly hasMany: boolean; readonly min: number | null; readonly max: number | null })
  | (FieldBase & { readonly type: 'checkbox' })
  | (FieldBase & { readonly type: 'select'; readonly hasMany: boolean; readonly options: readonly StudioOption[] })
  | (FieldBase & { readonly type: 'radio'; readonly options: readonly StudioOption[] })
  | (FieldBase & { readonly type: 'date'; readonly appearance: 'dayOnly' | 'dayAndTime' | 'timeOnly' | 'monthOnly' })
  | (FieldBase & { readonly type: 'json' })
  | (FieldBase & { readonly type: 'code'; readonly language: string | null })
  | (FieldBase & { readonly type: 'point' })
  | (FieldBase & { readonly type: 'richText'; readonly editor: 'default' | 'faqAnswer' })
  | (FieldBase & { readonly type: 'relationship'; readonly hasMany: boolean; readonly relationTo: readonly string[]; readonly hasFilterOptions: boolean })
  | (FieldBase & { readonly type: 'upload'; readonly hasMany: boolean; readonly relationTo: readonly string[] })
  | (FieldBase & { readonly type: 'join'; readonly collection: string; readonly on: string })
  | (FieldBase & { readonly type: 'ui' })
  | (FieldBase & { readonly type: 'group'; readonly fields: readonly StudioField[] })
  | (FieldBase & { readonly type: 'collapsible'; readonly initCollapsed: boolean; readonly fields: readonly StudioField[] })
  | (FieldBase & { readonly type: 'row'; readonly fields: readonly StudioField[] })
  | (FieldBase & { readonly type: 'tabs'; readonly tabs: readonly StudioTab[] })
  | (FieldBase & { readonly type: 'array'; readonly minRows: number | null; readonly maxRows: number | null; readonly initCollapsed: boolean; readonly fields: readonly StudioField[] })
  | (FieldBase & { readonly type: 'blocks'; readonly minRows: number | null; readonly maxRows: number | null; readonly blocks: readonly StudioBlock[] });

export type StudioTab = { readonly name: string | null; readonly label: string; readonly description: string | null; readonly fields: readonly StudioField[] };

export type StudioBlock = { readonly slug: string; readonly label: string; readonly description: string | null; readonly fields: readonly StudioField[] };

export type StudioFieldType = StudioField['type'];

export type StudioEntitySchema = {
  readonly kind: 'collection' | 'global';
  readonly slug: string;
  readonly label: { readonly singular: string; readonly plural: string };
  readonly useAsTitle: string | null;
  readonly defaultColumns: readonly string[];
  readonly searchFields: readonly string[];
  readonly drafts: boolean;
  readonly schedulePublish: boolean;
  readonly upload: boolean;
  readonly auth: boolean;
  readonly timestamps: boolean;
  readonly defaultSort: string | null;
  readonly pagination: { readonly defaultLimit: number; readonly limits: readonly number[] };
  readonly fields: readonly StudioField[];
};
```

- [ ] **Step 2: Write the failing tests**

These run against the real config, so they also catch schema drift.

`apps/cms/src/studio/server/schema/build-schema.test.ts`:

```ts
import config from '@payload-config';
import type { SanitizedConfig } from 'payload';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildCollectionSchema, buildGlobalSchema, findField } from './build-schema';

let sanitized: SanitizedConfig;

beforeAll(async () => {
  // buildConfig() already returns the sanitized config; no database is needed.
  sanitized = await config;
}, 60_000);

describe('buildCollectionSchema(blogs)', () => {
  it('describes the collection', () => {
    const schema = buildCollectionSchema(sanitized, 'blogs');
    expect(schema.useAsTitle).toBe('title');
    expect(schema.drafts).toBe(true);
    expect(schema.schedulePublish).toBe(true);
    expect(schema.defaultColumns).toEqual(['title', 'authors', 'categories', '_status', 'publishedAt', 'updatedAt']);
  });

  it('keeps field order, positions and custom components', () => {
    const schema = buildCollectionSchema(sanitized, 'blogs');
    expect(schema.fields.slice(0, 4).map((f) => f.name)).toEqual(['title', 'slug', 'abstract', 'heroImage']);
    const slug = findField(schema.fields, ['slug']);
    expect(slug?.position).toBe('sidebar');
    expect(slug?.component).toContain('SlugField');
  });

  it('resolves conditions to registry keys', () => {
    const schema = buildCollectionSchema(sanitized, 'blogs');
    expect(findField(schema.fields, ['seo', 'ogImageAlt'])?.condition).toBe('seo.ogImageAlt');
  });

  it('marks the rich text editors', () => {
    const schema = buildCollectionSchema(sanitized, 'blogs');
    const body = findField(schema.fields, ['body']);
    const answer = findField(schema.fields, ['faqs', 'answer']);
    expect(body?.type === 'richText' && body.editor).toBe('default');
    expect(answer?.type === 'richText' && answer.editor).toBe('faqAnswer');
  });
});

describe('every collection and global', () => {
  it('builds without throwing and is JSON-serializable', () => {
    for (const collection of sanitized.collections) {
      const schema = buildCollectionSchema(sanitized, collection.slug);
      expect(JSON.parse(JSON.stringify(schema))).toEqual(schema);
    }
    for (const global of sanitized.globals) {
      const schema = buildGlobalSchema(sanitized, global.slug);
      expect(JSON.parse(JSON.stringify(schema))).toEqual(schema);
    }
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/schema/build-schema.test.ts`
Expected: FAIL, cannot find module `./build-schema`.

- [ ] **Step 3: Implement**

`apps/cms/src/studio/server/schema/build-schema.ts`:

```ts
import type { Field, SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig, Tab } from 'payload';
import { hasDraftsEnabled, hasScheduledPublishEnabled } from 'payload/shared';

import { CONDITION_KEYS, type Condition } from '@/payload/admin-logic/conditions';
import { VALIDATOR_REGISTRY, validatorKeyOf } from '@/payload/admin-logic/validator-registry';

import type { StudioBlock, StudioEntitySchema, StudioField, StudioOption, StudioTab } from './types';

export class SchemaBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaBuildError';
  }
}

const labelText = (label: unknown, fallback: string | null): string | null => {
  if (typeof label === 'string') return label;
  if (label && typeof label === 'object' && 'en' in label && typeof (label as { en: unknown }).en === 'string') {
    return (label as { en: string }).en;
  }
  return fallback;
};

const humanize = (name: string): string =>
  name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

const componentPath = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'path' in value && typeof (value as { path: unknown }).path === 'string') {
    const { path, exportName } = value as { path: string; exportName?: string };
    return exportName ? `${path}#${exportName}` : path;
  }
  return null;
};

const options = (raw: unknown): StudioOption[] =>
  Array.isArray(raw)
    ? raw.map((o: unknown) =>
        typeof o === 'string'
          ? { value: o, label: humanize(o) }
          : { value: String((o as { value: unknown }).value), label: labelText((o as { label: unknown }).label, String((o as { value: unknown }).value)) ?? '' },
      )
    : [];

const relationList = (raw: unknown): string[] => (Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? [raw] : []);

const editorKind = (field: Field, owner: string): 'default' | 'faqAnswer' => {
  // faqs[].answer uses faqAnswerLexicalEditor (fields/faqs.ts:41-44); every other
  // rich text field uses the config default (payload.config.ts:610).
  const isFaqAnswer = 'name' in field && field.name === 'answer' && owner.endsWith('.faqs');
  return isFaqAnswer ? 'faqAnswer' : 'default';
};

const conditionKey = (fn: unknown, where: string): StudioField['condition'] => {
  if (typeof fn !== 'function') return null;
  const key = CONDITION_KEYS.get(fn as Condition);
  if (!key) throw new SchemaBuildError(`Unregistered admin.condition at ${where}. Move it into admin-logic/conditions.ts.`);
  return key;
};

const validatorRef = (fn: unknown): StudioField['validator'] => {
  const key = validatorKeyOf(fn);
  // Not in the registry: Payload's default validator for the type (sanitize.js
  // wraps every field), which Studio mirrors from the field's own properties.
  return key ? { key, kind: VALIDATOR_REGISTRY[key].kind } : null;
};

const buildFields = (fields: readonly Field[], owner: string): StudioField[] =>
  fields.flatMap((field): StudioField[] => {
    const name = 'name' in field && typeof field.name === 'string' ? field.name : null;
    const where = `${owner}.${name ?? field.type}`;
    const admin = (field.admin ?? {}) as Record<string, unknown>;
    const components = (admin.components ?? {}) as Record<string, unknown>;
    if (name === 'id' && field.type !== 'ui') return [];
    const base = {
      name,
      label: labelText('label' in field ? field.label : undefined, name ? humanize(name) : null),
      description: typeof admin.description === 'string' ? admin.description : null,
      required: 'required' in field && field.required === true,
      readOnly: admin.readOnly === true,
      hidden: admin.hidden === true || ('hidden' in field && field.hidden === true),
      position: admin.position === 'sidebar' ? ('sidebar' as const) : ('main' as const),
      width: typeof admin.width === 'string' ? admin.width : null,
      condition: conditionKey(admin.condition, where),
      validator: validatorRef('validate' in field ? field.validate : undefined),
      component: componentPath(components.Field),
      cell: componentPath(components.Cell),
      rowLabel: componentPath(components.RowLabel),
      defaultValue: 'defaultValue' in field && typeof field.defaultValue !== 'function' ? (field.defaultValue ?? null) : null,
    };
    const f = field as Field & Record<string, unknown>;
    const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
    switch (field.type) {
      case 'text':
        return [{ ...base, type: 'text', hasMany: f.hasMany === true, minLength: num(f.minLength), maxLength: num(f.maxLength) }];
      case 'textarea':
        return [{ ...base, type: 'textarea', minLength: num(f.minLength), maxLength: num(f.maxLength) }];
      case 'email':
        return [{ ...base, type: 'email' }];
      case 'number':
        return [{ ...base, type: 'number', hasMany: f.hasMany === true, min: num(f.min), max: num(f.max) }];
      case 'checkbox':
        return [{ ...base, type: 'checkbox' }];
      case 'select':
        return [{ ...base, type: 'select', hasMany: f.hasMany === true, options: options(f.options) }];
      case 'radio':
        return [{ ...base, type: 'radio', options: options(f.options) }];
      case 'date': {
        const appearance = ((admin.date as { pickerAppearance?: string } | undefined)?.pickerAppearance ?? 'dayOnly') as
          | 'dayOnly'
          | 'dayAndTime'
          | 'timeOnly'
          | 'monthOnly';
        return [{ ...base, type: 'date', appearance }];
      }
      case 'json':
        return [{ ...base, type: 'json' }];
      case 'code':
        return [{ ...base, type: 'code', language: typeof admin.language === 'string' ? admin.language : null }];
      case 'point':
        return [{ ...base, type: 'point' }];
      case 'richText':
        return [{ ...base, type: 'richText', editor: editorKind(field, owner) }];
      case 'relationship':
        return [{ ...base, type: 'relationship', hasMany: f.hasMany === true, relationTo: relationList(f.relationTo), hasFilterOptions: typeof f.filterOptions !== 'undefined' }];
      case 'upload':
        return [{ ...base, type: 'upload', hasMany: f.hasMany === true, relationTo: relationList(f.relationTo) }];
      case 'join':
        return [{ ...base, type: 'join', collection: String(f.collection), on: String(f.on) }];
      case 'ui':
        return [{ ...base, type: 'ui' }];
      case 'group':
        return [{ ...base, type: 'group', fields: buildFields(field.fields, name ? `${owner}.${name}` : owner) }];
      case 'collapsible':
        return [{ ...base, type: 'collapsible', initCollapsed: admin.initCollapsed === true, fields: buildFields(field.fields, owner) }];
      case 'row':
        return [{ ...base, type: 'row', fields: buildFields(field.fields, owner) }];
      case 'tabs':
        return [{ ...base, type: 'tabs', tabs: field.tabs.map((tab) => buildTab(tab, owner)) }];
      case 'array':
        return [{ ...base, type: 'array', minRows: num(f.minRows), maxRows: num(f.maxRows), initCollapsed: admin.initCollapsed === true, fields: buildFields(field.fields, `${owner}.${name}`) }];
      case 'blocks':
        return [{ ...base, type: 'blocks', minRows: num(f.minRows), maxRows: num(f.maxRows), blocks: blockList(field, owner) }];
      default:
        throw new SchemaBuildError(`Unsupported field type "${(field as { type: string }).type}" at ${where}.`);
    }
  });

const buildTab = (tab: Tab, owner: string): StudioTab => {
  const name = 'name' in tab && typeof tab.name === 'string' ? tab.name : null;
  return {
    name,
    label: labelText(tab.label, name ? humanize(name) : 'Tab') ?? 'Tab',
    description: typeof tab.description === 'string' ? tab.description : null,
    fields: buildFields(tab.fields, name ? `${owner}.${name}` : owner),
  };
};

const blockList = (field: Field & { type: 'blocks' }, owner: string): StudioBlock[] =>
  (field.blocks ?? []).map((block) => ({
    slug: block.slug,
    label: labelText(block.labels?.singular, humanize(block.slug)) ?? block.slug,
    description: typeof block.admin?.custom?.description === 'string' ? block.admin.custom.description : null,
    fields: buildFields(block.fields, `${owner}.${block.slug}`),
  }));

const paginationOf = (admin: SanitizedCollectionConfig['admin']): StudioEntitySchema['pagination'] => ({
  defaultLimit: admin.pagination?.defaultLimit ?? 10,
  limits: admin.pagination?.limits ?? [10, 25, 50, 100],
});

const collectionConfig = (config: SanitizedConfig, slug: string): SanitizedCollectionConfig => {
  const found = config.collections.find((c) => c.slug === slug);
  if (!found) throw new SchemaBuildError(`Unknown collection "${slug}".`);
  return found;
};

export const buildCollectionSchema = (config: SanitizedConfig, slug: string): StudioEntitySchema => {
  const c = collectionConfig(config, slug);
  return {
    kind: 'collection',
    slug,
    label: { singular: labelText(c.labels.singular, humanize(slug)) ?? slug, plural: labelText(c.labels.plural, humanize(slug)) ?? slug },
    useAsTitle: typeof c.admin.useAsTitle === 'string' ? c.admin.useAsTitle : null,
    defaultColumns: c.admin.defaultColumns ?? [],
    searchFields: c.admin.listSearchableFields ?? [],
    drafts: hasDraftsEnabled(c),
    schedulePublish: hasScheduledPublishEnabled(c),
    upload: Boolean(c.upload),
    auth: Boolean(c.auth),
    timestamps: c.timestamps !== false,
    defaultSort: typeof c.defaultSort === 'string' ? c.defaultSort : null,
    pagination: paginationOf(c.admin),
    fields: buildFields(c.fields, slug),
  };
};

export const buildGlobalSchema = (config: SanitizedConfig, slug: string): StudioEntitySchema => {
  const g: SanitizedGlobalConfig | undefined = config.globals.find((x) => x.slug === slug);
  if (!g) throw new SchemaBuildError(`Unknown global "${slug}".`);
  const label = labelText(g.label, humanize(slug)) ?? slug;
  return {
    kind: 'global',
    slug,
    label: { singular: label, plural: label },
    useAsTitle: null,
    defaultColumns: [],
    searchFields: [],
    drafts: hasDraftsEnabled(g),
    schedulePublish: hasScheduledPublishEnabled(g),
    upload: false,
    auth: false,
    timestamps: true,
    defaultSort: null,
    pagination: { defaultLimit: 1, limits: [1] },
    fields: buildFields(g.fields, slug),
  };
};

// Finds a field by data path, looking through presentational containers.
export const findField = (fields: readonly StudioField[], path: readonly string[]): StudioField | null => {
  const [head, ...rest] = path;
  for (const field of fields) {
    if (field.name === head) {
      if (rest.length === 0) return field;
      if (field.type === 'group' || field.type === 'array') return findField(field.fields, rest);
      return null;
    }
    if (field.name === null) {
      const inner =
        field.type === 'row' || field.type === 'collapsible'
          ? findField(field.fields, path)
          : field.type === 'tabs'
            ? findField(field.tabs.flatMap((t) => (t.name === null ? t.fields : [])), path)
            : null;
      if (inner) return inner;
    }
    if (field.type === 'tabs') {
      const named = field.tabs.find((t) => t.name === head);
      if (named) return rest.length === 0 ? null : findField(named.fields, rest);
    }
  }
  return null;
};
```

- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/schema/build-schema.test.ts`
Expected: PASS (5 tests). They read the sanitized config only and never connect to a database, but loading `@payload-config` still calls `requireEnv('PAYLOAD_SECRET')` and `requireEnv('DATABASE_URI')` (`src/payload.config.ts:611,621`). CI's `cms` job sets both (`.github/workflows/ci.yml`), so the tests run there as written. Locally, export both variables in the shell first (any non-empty values work, because no connection is made).

If the "builds without throwing" test fails with `Unregistered admin.condition`, Task 1.6 missed a site: move it and re-run. If it fails with `Unsupported field type`, add the type to `types.ts` and the switch, with a generic renderer in Task 1.13.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/studio/server/schema
git commit -m "feat(studio): T1.7 Studio schema builder"
```

### Task 1.8: Component registry and the coverage check

**Files:**
- Modify: `apps/cms/src/payload/lib/wire-custom-fields.ts` (export the three override maps)
- Create: `apps/cms/src/studio/form/registry-manifest.ts`
- Create: `apps/cms/src/studio/form/registry.tsx`
- Test: `apps/cms/src/studio/form/registry.test.ts`
- Create: `apps/cms/scripts/check-studio-coverage.ts`
- Modify: `apps/cms/package.json` (script `verify:studio-coverage`)

- [ ] **Step 1: Export the generic adapter maps**

In `apps/cms/src/payload/lib/wire-custom-fields.ts`, change `const FIELD_OVERRIDES`, `const CELL_OVERRIDES` and `const CELL_OVERRIDES_BY_NAME` to `export const`. No other change.

- [ ] **Step 2: Write the failing test**

`apps/cms/src/studio/form/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { FIELD_OVERRIDES } from '@/payload/lib/wire-custom-fields';

import { FIELD_COMPONENTS, resolveField } from './registry';
import { FIELD_MANIFEST, GENERIC_CELL_PATHS, manifestEntry, resolveCell } from './registry-manifest';

describe('registry', () => {
  it('treats every generic adapter path, and no component, as the generic renderer', () => {
    for (const path of Object.values(FIELD_OVERRIDES)) expect(manifestEntry(path ?? null)).toEqual({ kind: 'generic' });
    expect(resolveField(null)).toEqual({ kind: 'generic' });
  });

  it('knows SlugField', () => {
    expect(resolveField('@/payload/admin/components/SlugField.tsx#SlugField').kind).not.toBe('unknown');
  });

  it('reports unknown paths instead of guessing', () => {
    expect(resolveField('@/payload/admin/components/DoesNotExist.tsx#X')).toEqual({ kind: 'unknown' });
  });

  it('has a component for every custom manifest entry, and no extras', () => {
    const custom = Object.entries(FIELD_MANIFEST).filter(([, e]) => e.kind === 'custom').map(([k]) => k).sort();
    expect(Object.keys(FIELD_COMPONENTS).sort()).toEqual(custom);
  });

  it('maps every stamped cell to a Studio cell', () => {
    for (const path of GENERIC_CELL_PATHS) expect(resolveCell(path).kind).not.toBe('unknown');
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/form/registry.test.ts`
Expected: FAIL, cannot find module `./registry`.

- [ ] **Step 3: Implement the registry as a manifest plus a component map**

Two files, so the coverage script (plain Node) can read what Studio knows about without importing React components or server actions:

- `registry-manifest.ts`: data only. Every component path the config mounts, with its kind (`generic`, `custom`, `pending`) and phase.
- `registry.tsx`: client-side. Maps each `custom` path to its Studio component.

Keys are the exact component paths found in the config (collect them with `grep -rhoE "@/payload/admin/components/[A-Za-z/._-]+#[A-Za-z]+" apps/cms/src/payload` plus the `'./payload/admin/...'` form used in `payload.config.ts`). Every key from `docs/studio/03-FIELD-AND-COMPONENT-MAP.md` §B with fate PORT or NEW gets an entry.

`apps/cms/src/studio/form/registry-manifest.ts`:

```ts
import { CELL_OVERRIDES, CELL_OVERRIDES_BY_NAME, FIELD_OVERRIDES } from '@/payload/lib/wire-custom-fields';

export type ManifestEntry =
  | { readonly kind: 'generic' }
  | { readonly kind: 'custom'; readonly label: string }
  | { readonly kind: 'pending'; readonly phase: number; readonly label: string }
  | { readonly kind: 'unknown' };

export type CellId = 'date' | 'boolean' | 'relationship' | 'media' | 'bytes' | 'leadContact' | 'leadSync' | 'sourcePage';
export type CellEntry = { readonly kind: 'cell'; readonly id: CellId } | { readonly kind: 'generic' } | { readonly kind: 'unknown' };

export const normalizePath = (path: string): string => path.replace(/^\.\/payload\//, '@/payload/');

const GENERIC_FIELD_PATHS = new Set(
  Object.values(FIELD_OVERRIDES)
    .filter((p): p is string => typeof p === 'string')
    .map(normalizePath),
);

const pending = (phase: number, label: string): ManifestEntry => ({ kind: 'pending', phase, label });
// Exported because no entry uses it until Task 1.14 (SlugField); an unused
// local would fail noUnusedLocals and Biome's noUnusedVariables.
export const custom = (label: string): ManifestEntry => ({ kind: 'custom', label });

// Change `pending` to `custom` (and add the component to registry.tsx) in the
// task that builds each Studio component.
export const FIELD_MANIFEST: Readonly<Record<string, ManifestEntry>> = {
  '@/payload/admin/components/SlugField.tsx#SlugField': pending(1, 'Slug'),
  '@/payload/admin/components/HiddenField.tsx#HiddenField': { kind: 'generic' },
  '@/payload/admin/components/fields/DateField.tsx#DateField': { kind: 'generic' },
  '@/payload/admin/components/fields/CodeField.tsx#CodeField': { kind: 'generic' },
  '@/payload/admin/components/fields/JoinField.tsx#JoinField': { kind: 'generic' },
  '@/payload/admin/components/fields/CollapsibleField.tsx#CollapsibleField': { kind: 'generic' },
  '@/payload/admin/components/MediaField/MediaField.tsx#MediaField': pending(2, 'Media'),
  '@/payload/admin/components/AuthorCredibilityField.tsx#AuthorCredibilityField': pending(2, 'Author credibility'),
  '@/payload/admin/components/LegacyBioViewer.tsx#LegacyBioViewer': pending(2, 'Legacy bio'),
  '@/payload/admin/components/GateFormLabel.tsx#GateFormLabel': pending(2, 'Gate form label'),
  '@/payload/admin/components/MediaSelfChrome.tsx#MediaSelfChrome': pending(2, 'Media details'),
  '@/payload/admin/components/MediaSizeWarningField.tsx#MediaSizeWarningField': pending(2, 'Size warning'),
  '@/payload/admin/components/SchemaManager/GlobalSchemaView.tsx#GlobalSchemaView': pending(2, 'Global schema'),
  '@/payload/admin/components/SchemaManager/SchemaOverrideField.tsx#SchemaOverrideField': pending(2, 'Schema override'),
  '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste': pending(4, 'Paste FAQs'),
  '@/payload/admin/components/BlogCtaAutoPick.tsx#BlogCtaAutoPick': pending(4, 'CTA auto-pick'),
  '@/payload/admin/components/JourneyMirrorWarning.tsx#JourneyMirrorWarning': pending(4, 'Journey check'),
  '@/payload/admin/components/DisplayPublishedAtField.tsx#DisplayPublishedAtField': pending(4, 'Display date'),
  '@/payload/admin/components/PermalinkField.tsx#PermalinkField': pending(4, 'Permalink'),
  '@/payload/admin/components/SeoHealthScoreField.tsx#SeoHealthScoreField': pending(4, 'SEO health'),
  '@/payload/admin/components/SeoTitleField.tsx#SeoTitleField': pending(4, 'SEO title'),
  '@/payload/admin/components/SeoDescriptionField.tsx#SeoDescriptionField': pending(4, 'Meta description'),
  '@/payload/admin/components/SeoIndexableField.tsx#SeoIndexableField': pending(4, 'Indexing'),
  '@/payload/admin/components/SerpPreviewField.tsx#SerpPreviewField': pending(4, 'Search preview'),
  '@/payload/admin/components/SchemaPreviewField.tsx#SchemaPreviewField': pending(4, 'Structured data'),
  '@/payload/admin/components/KeywordsField.tsx#KeywordsField': pending(4, 'Keywords'),
  '@/payload/admin/components/CanonicalField.tsx#CanonicalField': pending(4, 'Canonical URL'),
  '@/payload/admin/components/SocialCardField.tsx#SocialCardField': pending(4, 'Social card'),
  '@/payload/admin/components/OutboundRedirectField.tsx#OutboundRedirectField': pending(4, 'Redirect'),
  '@/payload/admin/components/HeadTagsCard.tsx#HeadTagsCard': pending(4, 'Head tags'),
  '@/payload/admin/components/UrlChangeHistoryField.tsx#UrlChangeHistoryField': pending(4, 'URL history'),
  '@/payload/admin/components/SeoAdvancedPanel.tsx#SeoAdvancedPanel': pending(4, 'Advanced SEO'),
  '@/payload/admin/components/SignatureTemplatePreview.tsx#SignatureTemplatePreview': pending(5, 'Template preview'),
  '@/payload/admin/components/RedirectStalenessField.tsx#RedirectStalenessField': pending(5, 'Staleness'),
  '@/payload/admin/components/BrokenLinkUrlField.tsx#BrokenLinkUrlField': pending(5, 'Link'),
  '@/payload/admin/components/SourcePageLinkField.tsx#SourcePageLinkField': pending(5, 'Source page'),
  '@/payload/admin/components/BrokenLinkStatusField.tsx#BrokenLinkStatusField': pending(5, 'Status'),
  '@/payload/admin/components/SchemaManager/SchemaSidebarInfo.tsx#SchemaSidebarInfo': pending(5, 'Override status'),
  '@/payload/admin/components/SchemaManager/CurrentSchemaView.tsx#CurrentSchemaView': pending(5, 'Live schema'),
  '@/payload/admin/components/SchemaManager/SchemaBlockBuilder.tsx#SchemaBlockBuilder': pending(5, 'Schema builder'),
  '@/payload/admin/components/SchemaManager/SchemaAllowBlock.tsx#SchemaAllowBlock': pending(5, 'Allowed types'),
  '@/payload/admin/components/SchemaManager/SchemaHistory.tsx#SchemaHistory': pending(5, 'Override history'),
  '@/payload/admin/components/integrations/EventsMultiSelect.tsx#EventsMultiSelect': pending(5, 'Events'),
  '@/payload/admin/components/integrations/CollectionsMultiSelect.tsx#CollectionsMultiSelect': pending(5, 'Collections'),
  '@/payload/admin/components/integrations/FormSlugsMultiSelect.tsx#FormSlugsMultiSelect': pending(5, 'Forms'),
  '@/payload/admin/components/integrations/ConfigNote.tsx#ClarityConfigNote': pending(5, 'Note'),
  '@/payload/admin/components/integrations/HealthBadge.tsx#HealthBadge': pending(5, 'Health'),
  '@/payload/admin/components/integrations/TestButton.tsx#TestButton': pending(5, 'Send test event'),
  '@/payload/admin/components/integrations/AuditTrail.tsx#AuditTrail': pending(5, 'Recent failures'),
  // Row labels render inside array rows (Phase 2).
  '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel': pending(2, 'FAQ row label'),
  '@/payload/admin/components/TocRowLabel.tsx#TocRowLabel': pending(2, 'TOC row label'),
  '@/payload/admin/components/MentionRowLabel.tsx#MentionRowLabel': pending(5, 'Mention row label'),
};

export const CELL_MANIFEST: Readonly<Record<string, CellEntry>> = {
  '@/payload/admin/components/DateCell.tsx#DateCell': { kind: 'cell', id: 'date' },
  '@/payload/admin/components/BooleanChipCell.tsx#BooleanChipCell': { kind: 'cell', id: 'boolean' },
  '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell': { kind: 'cell', id: 'relationship' },
  '@/payload/admin/components/MediaField/MediaCell.tsx#MediaCell': { kind: 'cell', id: 'media' },
  '@/payload/admin/components/BytesCell.tsx#BytesCell': { kind: 'cell', id: 'bytes' },
  '@/payload/admin/components/LeadContactCell.tsx#LeadContactCell': { kind: 'cell', id: 'leadContact' },
  '@/payload/admin/components/LeadSyncCell.tsx#LeadSyncCell': { kind: 'cell', id: 'leadSync' },
  '@/payload/admin/components/SourcePageCell.tsx#SourcePageCell': { kind: 'cell', id: 'sourcePage' },
};

export const manifestEntry = (path: string | null): ManifestEntry => {
  if (path === null) return { kind: 'generic' };
  const key = normalizePath(path);
  if (GENERIC_FIELD_PATHS.has(key)) return { kind: 'generic' };
  return FIELD_MANIFEST[key] ?? { kind: 'unknown' };
};

export const resolveCell = (path: string | null): CellEntry => {
  if (path === null) return { kind: 'generic' };
  return CELL_MANIFEST[normalizePath(path)] ?? { kind: 'unknown' };
};

// Referenced so a rename in wire-custom-fields fails typecheck here.
export const GENERIC_CELL_PATHS: readonly string[] = [...Object.values(CELL_OVERRIDES), ...Object.values(CELL_OVERRIDES_BY_NAME)].filter(
  (p): p is string => typeof p === 'string',
);
```

`registry.tsx` needs the field props type, which Task 1.12 extends. Create it now:

`apps/cms/src/studio/form/engine/types.ts`:

```ts
import type { StudioField } from '@/studio/server/schema/types';

export type StudioFieldProps = {
  readonly field: StudioField;
  /** Absolute data path in the form, e.g. "seo.title" or "faqs.2.question". */
  readonly path: string;
};
```

`apps/cms/src/studio/form/registry.tsx`:

```tsx
'use client';

import type { ComponentType } from 'react';

import type { StudioFieldProps } from './engine/types';
import { type ManifestEntry, manifestEntry, normalizePath } from './registry-manifest';

export type FieldEntry =
  | { readonly kind: 'generic' }
  | { readonly kind: 'custom'; readonly component: ComponentType<StudioFieldProps> }
  | { readonly kind: 'pending'; readonly phase: number; readonly label: string }
  | { readonly kind: 'unknown' };

// One entry per manifest path whose kind is 'custom'. registry.test.ts checks
// the two lists match exactly.
export const FIELD_COMPONENTS: Readonly<Record<string, ComponentType<StudioFieldProps>>> = {};

export const resolveField = (path: string | null): FieldEntry => {
  const entry: ManifestEntry = manifestEntry(path);
  if (entry.kind !== 'custom') return entry;
  const component = path === null ? undefined : FIELD_COMPONENTS[normalizePath(path)];
  return component ? { kind: 'custom', component } : { kind: 'unknown' };
};
```


- [ ] **Step 4: Run and see it pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/form/registry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: The coverage check against the live config**

`apps/cms/scripts/check-studio-coverage.ts`:

```ts
#!/usr/bin/env node
/**
 * Every field, cell and row-label component the Payload config mounts must be
 * known to Studio's registry (docs/studio/00-MASTER-PLAN.md ADR-8). Unknown
 * paths fail the build. Pending entries are listed with their phase.
 *
 * Run: pnpm --filter @cleanstart/cms verify:studio-coverage
 * Reads the sanitized config only; no database connection.
 */
import config from '../src/payload.config';

import { manifestEntry as resolveField, resolveCell } from '../src/studio/form/registry-manifest';
import { buildCollectionSchema, buildGlobalSchema } from '../src/studio/server/schema/build-schema';
import type { StudioField } from '../src/studio/server/schema/types';

const walk = (fields: readonly StudioField[], visit: (f: StudioField) => void): void => {
  for (const field of fields) {
    visit(field);
    if ('fields' in field) walk(field.fields, visit);
    if (field.type === 'tabs') for (const tab of field.tabs) walk(tab.fields, visit);
    if (field.type === 'blocks') for (const block of field.blocks) walk(block.fields, visit);
  }
};

const main = async (): Promise<void> => {
  const sanitized = await config;
  const unknown = new Map<string, Set<string>>();
  const pending = new Map<string, string>();
  const note = (path: string, where: string): void => {
    const set = unknown.get(path) ?? new Set<string>();
    set.add(where);
    unknown.set(path, set);
  };
  const schemas = [
    ...sanitized.collections.map((c) => buildCollectionSchema(sanitized, c.slug)),
    ...sanitized.globals.map((g) => buildGlobalSchema(sanitized, g.slug)),
  ];
  for (const schema of schemas) {
    walk(schema.fields, (field) => {
      for (const path of [field.component, field.rowLabel]) {
        if (!path) continue;
        const entry = resolveField(path);
        if (entry.kind === 'unknown') note(path, `${schema.slug}.${field.name ?? field.type}`);
        if (entry.kind === 'pending') pending.set(path, `phase ${entry.phase}`);
      }
      if (field.cell && resolveCell(field.cell).kind === 'unknown') note(field.cell, `${schema.slug}.${field.name ?? field.type} (cell)`);
    });
  }
  console.info(`Pending Studio components: ${pending.size}`);
  for (const [path, phase] of [...pending.entries()].sort()) console.info(`  ${phase}  ${path}`);
  if (unknown.size > 0) {
    console.error(`\nUnknown components (${unknown.size}). Add them to src/studio/form/registry-manifest.ts:`);
    for (const [path, where] of unknown) console.error(`  ${path}\n    used at ${[...where].slice(0, 5).join(', ')}`);
    process.exit(1);
  }
  console.info('Studio coverage check passed.');
  process.exit(0);
};

await main();
```

In `apps/cms/package.json` `scripts`, add (it needs tsx because it loads the config with path aliases):

```json
"verify:studio-coverage": "tsx --env-file-if-exists=.env scripts/check-studio-coverage.ts",
```

Run: `pnpm --filter @cleanstart/cms verify:studio-coverage`
Expected: a list of pending components grouped by phase and `Studio coverage check passed.` If it fails with unknown paths, add each one to the registry with its fate from `03` §B (and to `03` §B if it is missing there, which means the catalog missed it).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/lib/wire-custom-fields.ts apps/cms/src/studio/form/registry-manifest.ts apps/cms/src/studio/form/registry.tsx apps/cms/src/studio/form/registry.test.ts apps/cms/src/studio/form/engine/types.ts apps/cms/scripts/check-studio-coverage.ts apps/cms/package.json
git commit -m "feat(studio): T1.8 component registry and coverage check"
```

### Task 1.9: Inventory script

Regenerates `docs/studio/research/schema-inventory.txt` and `collections-summary.txt`, so `03-FIELD-AND-COMPONENT-MAP.md` can be re-checked whenever the schema changes.

**Files:**
- Create: `apps/cms/scripts/studio-inventory.ts`

- [ ] **Step 1: Write the script**

`apps/cms/scripts/studio-inventory.ts`:

```ts
#!/usr/bin/env node
/**
 * Writes docs/studio/research/schema-inventory.txt and collections-summary.txt
 * from the live Payload config, via the Studio schema builder.
 * Run: pnpm --filter @cleanstart/cms exec tsx --env-file-if-exists=.env scripts/studio-inventory.ts
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import config from '../src/payload.config';
import { buildCollectionSchema, buildGlobalSchema } from '../src/studio/server/schema/build-schema';
import type { StudioEntitySchema, StudioField } from '../src/studio/server/schema/types';

const OUT = path.resolve(import.meta.dirname, '../../../docs/studio/research');

const describeField = (f: StudioField): string =>
  [
    f.type,
    'hasMany' in f && f.hasMany ? 'many' : null,
    'relationTo' in f ? `->${f.relationTo.join('|')}` : null,
    f.required ? 'req' : null,
    f.hidden ? 'hidden' : null,
    f.readOnly ? 'ro' : null,
    f.position === 'sidebar' ? '@sidebar' : null,
    f.condition ? `cond:${f.condition}` : null,
    f.validator ? `validate:${f.validator.key}(${f.validator.kind})` : null,
    f.component ? `C:${f.component.replace('@/payload/admin/components/', '')}` : null,
    'options' in f ? `[${f.options.map((o) => o.value).join(',')}]` : null,
    f.type === 'blocks' ? `blocks:${f.blocks.map((b) => b.slug).join(',')}` : null,
    f.type === 'richText' ? `editor:${f.editor}` : null,
  ]
    .filter(Boolean)
    .join(' ');

const lines = (fields: readonly StudioField[], depth: number): string[] =>
  fields.flatMap((f) => {
    const own = `${'  '.repeat(depth)}${f.name ?? `<${f.type}>`}  ${describeField(f)}`;
    const kids =
      'fields' in f
        ? lines(f.fields, depth + 1)
        : f.type === 'tabs'
          ? f.tabs.flatMap((t) => [`${'  '.repeat(depth + 1)}[tab ${t.label}]`, ...lines(t.fields, depth + 2)])
          : f.type === 'blocks'
            ? f.blocks.flatMap((b) => [`${'  '.repeat(depth + 1)}[block ${b.slug}]`, ...lines(b.fields, depth + 2)])
            : [];
    return [own, ...kids];
  });

const summaryRow = (s: StudioEntitySchema): string =>
  [s.kind === 'collection' ? 'C' : 'G', s.slug, s.useAsTitle ?? '', s.drafts ? 'drafts' : '', s.schedulePublish ? 'sched' : '', s.upload ? 'upload' : '', s.auth ? 'auth' : ''].join(' | ');

const main = async (): Promise<void> => {
  const sanitized = await config;
  const schemas = [
    ...sanitized.collections.map((c) => buildCollectionSchema(sanitized, c.slug)),
    ...sanitized.globals.map((g) => buildGlobalSchema(sanitized, g.slug)),
  ];
  const inventory = schemas.flatMap((s) => [`## ${s.kind.toUpperCase()} ${s.slug}`, ...lines(s.fields, 0), '']).join('\n');
  writeFileSync(path.join(OUT, 'schema-inventory.txt'), `Generated ${new Date().toISOString()} by apps/cms/scripts/studio-inventory.ts\n\n${inventory}`);
  writeFileSync(path.join(OUT, 'collections-summary.txt'), ['k | slug | title | drafts | sched | upload | auth', ...schemas.map(summaryRow)].join('\n'));
  console.info(`Wrote ${schemas.length} schemas to ${OUT}`);
  process.exit(0);
};

await main();
```

- [ ] **Step 2: Run it and review the diff**

Run: `pnpm --filter @cleanstart/cms exec tsx --env-file-if-exists=.env scripts/studio-inventory.ts && git diff --stat docs/studio/research`
Expected: both files rewritten. The format changes from the one-off 2026-10-16 dump (conditions and validators now show their registry keys). Re-run the two coverage checks from the planning session (every collection and global has a §C row; every admin file has a §B row) and fix `03` if anything is missing.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/scripts/studio-inventory.ts docs/studio/research/schema-inventory.txt docs/studio/research/collections-summary.txt
git commit -m "chore(studio): T1.9 schema inventory script"
```

### Task 1.10: App shell, navigation and the status screens

**Files:**
- Create: `apps/cms/src/studio/server/readiness.ts`
- Create: `apps/cms/src/studio/server/nav.ts`
- Test: `apps/cms/src/studio/server/nav.test.ts`
- Create: `apps/cms/src/studio/server/loaders/shell.ts`
- Create: `apps/cms/src/studio/server/actions/preferences.ts`
- Create: `apps/cms/src/studio/shell/AppShell.tsx`, `Sidebar.tsx`, `UserMenu.tsx`, `SkipLink.tsx`, `BrandMark.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/layout.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/page.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/not-found.tsx`, `error.tsx`
- Create: `apps/cms/src/app/(studio)/studio/forbidden/page.tsx`
- Modify: `apps/cms/src/app/(studio)/studio/lab/page.tsx` (admin gate)

- [ ] **Step 1: Readiness list**

ADR-11: nothing links to a collection in Studio until its row in `03` §C is ticked. Builders see every collection with `STUDIO_SHOW_UNREADY=true`. Globals are not linked at all in Phase 1: their screen (S-15, `/studio/globals/[global]`) arrives in Phase 2 for `seoDefaults` and Phase 5 for the rest, so the sidebar leaves them out until then (Step 3).

`apps/cms/src/studio/server/readiness.ts`:

```ts
import 'server-only';

// Collections and globals whose row in docs/studio/03-FIELD-AND-COMPONENT-MAP.md §C
// is ticked. Add a slug here in the same commit that ticks its row.
export const READY = new Set<string>([]);

export const showUnready = (): boolean => process.env.STUDIO_SHOW_UNREADY === 'true';

export const isVisibleInStudio = (slug: string): boolean => READY.has(slug) || showUnready();
```

- [ ] **Step 2: Write the failing nav test**

`apps/cms/src/studio/server/nav.test.ts`:

```ts
import type { SanitizedPermissions } from 'payload';
import { describe, expect, it } from 'vitest';

import { type NavLayout, buildNav } from './nav';

const LAYOUT: NavLayout = [
  { id: 'content', label: 'Content', items: [{ kind: 'collection', slug: 'blogs' }, { kind: 'collection', slug: 'jobs' }] },
  { id: 'settings', label: 'Settings', items: [{ kind: 'global', slug: 'siteSettings' }, { kind: 'collection', slug: 'users' }] },
];

const LABELS = { blogs: 'Blogs', jobs: 'Jobs', siteSettings: 'Site settings', users: 'Users' };

const perms = (collections: string[], globals: string[] = []): SanitizedPermissions =>
  ({
    canAccessAdmin: true,
    collections: Object.fromEntries(collections.map((s) => [s, { read: true, fields: {} }])),
    globals: Object.fromEntries(globals.map((s) => [s, { read: true, fields: {} }])),
  }) as unknown as SanitizedPermissions;

describe('buildNav', () => {
  it('shows only what the user can read, in layout order, and drops empty groups', () => {
    const nav = buildNav({ layout: LAYOUT, permissions: perms(['jobs']), scopedSlugs: null, labels: LABELS, isVisible: () => true, draftCounts: {} });
    expect(nav).toEqual([{ id: 'content', label: 'Content', items: [{ kind: 'collection', slug: 'jobs', label: 'Jobs', href: '/studio/collections/jobs', draftCount: 0 }] }]);
  });

  it('limits departmental users to their domain and hides globals (wire-scoped-nav.ts:59-148)', () => {
    const nav = buildNav({
      layout: LAYOUT,
      permissions: perms(['blogs', 'jobs', 'users'], ['siteSettings']),
      scopedSlugs: ['jobs'],
      labels: LABELS,
      isVisible: () => true,
      draftCounts: { jobs: 3 },
    });
    expect(nav.flatMap((g) => g.items.map((i) => i.slug))).toEqual(['jobs']);
    expect(nav[0]?.items[0]?.draftCount).toBe(3);
  });

  it('hides collections that are not ready in Studio', () => {
    const nav = buildNav({ layout: LAYOUT, permissions: perms(['blogs', 'jobs']), scopedSlugs: null, labels: LABELS, isVisible: (s) => s === 'jobs', draftCounts: {} });
    expect(nav.flatMap((g) => g.items.map((i) => i.slug))).toEqual(['jobs']);
  });

  it('leaves globals out until their screen exists (S-15)', () => {
    const nav = buildNav({ layout: LAYOUT, permissions: perms(['users'], ['siteSettings']), scopedSlugs: null, labels: LABELS, isVisible: () => true, draftCounts: {} });
    expect(nav.flatMap((g) => g.items.map((i) => i.slug))).toEqual(['users']);
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/nav.test.ts`
Expected: FAIL, cannot find module `./nav`.

- [ ] **Step 3: Implement the nav builder**

`apps/cms/src/studio/server/nav.ts` (layout from `docs/studio/02-SCREENS.md` S-00, decision D-9; if D-9 kept today's groups, use those instead):

```ts
import type { SanitizedPermissions } from 'payload';

import { collectionCan } from './permissions';

export type NavLayoutItem = { readonly kind: 'collection' | 'global'; readonly slug: string };
export type NavLayout = ReadonlyArray<{ readonly id: string; readonly label: string; readonly items: readonly NavLayoutItem[] }>;

export type NavItem = NavLayoutItem & { readonly label: string; readonly href: string; readonly draftCount: number };
export type NavGroup = { readonly id: string; readonly label: string; readonly items: readonly NavItem[] };

const c = (slug: string): NavLayoutItem => ({ kind: 'collection', slug });
const g = (slug: string): NavLayoutItem => ({ kind: 'global', slug });

// Report routes (analytics, content insights, lead attribution, cache) join
// these groups in Phase 6 when their screens exist.
export const NAV_LAYOUT: NavLayout = [
  {
    id: 'content',
    label: 'Content',
    items: ['blogs', 'news', 'guides', 'case-studies', 'knowledgeBase', 'resources', 'events', 'webinars', 'podcastEpisodes', 'jobs', 'pages', 'legalDocuments', 'authors', 'aboutGalleries'].map(c),
  },
  { id: 'media', label: 'Media', items: ['media', 'emailAssets'].map(c) },
  {
    id: 'taxonomies',
    label: 'Taxonomies',
    items: ['categories', 'newsCategories', 'knowledgeCategories', 'industries', 'resourceTypes', 'departments', 'regions', 'pressTypes', 'webinarTypes', 'jobLocations'].map(c),
  },
  { id: 'marketing', label: 'Marketing', items: ['leads', 'forms', 'partner-applications', 'deal-registrations'].map(c) },
  { id: 'recruiting', label: 'Recruiting', items: ['career-applications', 'resumes'].map(c) },
  { id: 'seo', label: 'SEO', items: [c('redirects'), c('pageRegistry'), c('brokenLinks'), g('seoDefaults')] },
  { id: 'brand', label: 'Brand', items: ['emailSignatures', 'signatureTemplates'].map(c) },
  { id: 'settings', label: 'Settings', items: [g('siteSettings'), g('impactStats'), g('spotlights'), g('legal'), c('users'), c('integrations')] },
  { id: 'system', label: 'System', items: ['audit-log', 'consentLog', 'searchLog', 'previewAudit', 'analyticsCache', 'webhooks_dead_letter'].map(c) },
];

export const buildNav = (input: {
  readonly layout: NavLayout;
  readonly permissions: SanitizedPermissions;
  readonly scopedSlugs: readonly string[] | null;
  readonly labels: Readonly<Record<string, string>>;
  readonly isVisible: (slug: string) => boolean;
  readonly draftCounts: Readonly<Record<string, number>>;
}): NavGroup[] =>
  input.layout
    .map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items
        // Globals stay in the layout but get no link until S-15 adds
        // /studio/globals/<slug> (08-PHASE-2-7-TASKS.md T5.9). Phase 1 has no
        // route for them, so a link would 404. S-15 adds them back here with
        // globalCan(permissions, slug, 'read') and no departmental scope.
        .filter((item) => item.kind === 'collection')
        .filter((item) => input.isVisible(item.slug))
        .filter(
          (item) =>
            collectionCan(input.permissions, item.slug, 'read') &&
            (input.scopedSlugs === null || input.scopedSlugs.includes(item.slug)),
        )
        .map((item) => ({
          ...item,
          label: input.labels[item.slug] ?? item.slug,
          href: `/studio/collections/${item.slug}`,
          draftCount: input.draftCounts[item.slug] ?? 0,
        })),
    }))
    .filter((group) => group.items.length > 0);
```

Run the test again. Expected: PASS (4 tests).

- [ ] **Step 4: Shell loader and preferences action**

`apps/cms/src/studio/server/loaders/shell.ts`:

```ts
import 'server-only';

import { hasDraftsEnabled } from 'payload/shared';

import { scopedCollectionSlugsForUser } from '@/payload/lib/wire-scoped-nav';

import { NAV_LAYOUT, type NavGroup, buildNav } from '../nav';
import { studioApi } from '../payload';
import { collectionCan } from '../permissions';
import { isVisibleInStudio } from '../readiness';
import type { StudioSession } from '../session';

export type ShellUser = { readonly id: number; readonly name: string; readonly email: string; readonly roles: readonly string[] };

// `| undefined` because readPreferences sets a key to undefined when the stored value is malformed.
export type StudioPreferences = {
  readonly navGroupsClosed?: readonly string[] | undefined;
  readonly sidebarCollapsed?: boolean | undefined;
};

export type ShellData = {
  readonly user: ShellUser;
  readonly nav: readonly NavGroup[];
  readonly preferences: StudioPreferences;
};

const readPreferences = (raw: unknown): StudioPreferences => {
  const studio = (raw as { studio?: unknown } | null)?.studio;
  if (!studio || typeof studio !== 'object') return {};
  const s = studio as Record<string, unknown>;
  return {
    navGroupsClosed: Array.isArray(s.navGroupsClosed) ? s.navGroupsClosed.filter((x): x is string => typeof x === 'string') : undefined,
    sidebarCollapsed: typeof s.sidebarCollapsed === 'boolean' ? s.sidebarCollapsed : undefined,
  };
};

export const getShellData = async (session: StudioSession): Promise<ShellData> => {
  const { payload, permissions, user } = session;
  const api = await studioApi(session);
  const labels: Record<string, string> = {};
  for (const col of payload.config.collections) labels[col.slug] = typeof col.labels.plural === 'string' ? col.labels.plural : col.slug;
  for (const glob of payload.config.globals) labels[glob.slug] = typeof glob.label === 'string' ? glob.label : glob.slug;

  const draftSlugs = payload.config.collections
    .filter((col) => hasDraftsEnabled(col) && collectionCan(permissions, col.slug, 'read') && isVisibleInStudio(col.slug))
    .map((col) => col.slug);
  const counts = await Promise.all(
    draftSlugs.map(async (slug) => {
      const { totalDocs } = await api.count({ collection: slug as never, where: { _status: { equals: 'draft' } } });
      return [slug, totalDocs] as const;
    }),
  );

  return {
    user: { id: user.id, name: user.name, email: user.email, roles: user.roles ?? [] },
    nav: buildNav({
      layout: NAV_LAYOUT,
      permissions,
      scopedSlugs: scopedCollectionSlugsForUser(user),
      labels,
      isVisible: isVisibleInStudio,
      draftCounts: Object.fromEntries(counts),
    }),
    preferences: readPreferences(user.preferences),
  };
};
```

`apps/cms/src/studio/server/actions/preferences.ts`:

```ts
'use server';

import { z } from 'zod';

import type { User } from '@/payload-types';

import type { ActionResult } from '../errors';
import { runAction, studioApi } from '../payload';
import { getSession } from '../session';

const PreferencesPatch = z
  .object({
    navGroupsClosed: z.array(z.string().max(64)).max(32).optional(),
    sidebarCollapsed: z.boolean().optional(),
  })
  .strict();

// Studio keeps its own namespace inside users.preferences so it never
// overwrites the saved views and column widths Payload's admin stores there.
export async function updateStudioPreferences(input: unknown): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { kind: 'forbidden', message: 'Sign in again to save preferences.', issues: [] } };
  const patch = PreferencesPatch.parse(input);
  return runAction(async () => {
    const api = await studioApi(session);
    // Read the stored row, not the session's copy, so two tabs never overwrite each other's keys (09 §13).
    const stored = await api.findByID({ collection: 'users', id: session.user.id, depth: 0 });
    // studioApi's findByID returns the untyped document shape, so name the collection type here.
    const current = ((stored as User).preferences ?? {}) as Record<string, unknown>;
    const studio = { ...((current.studio as Record<string, unknown> | undefined) ?? {}), ...patch };
    await api.update({ collection: 'users', id: session.user.id, data: { preferences: { ...current, studio } } });
    return null;
  });
}
```

- [ ] **Step 5: Shell components**

`apps/cms/src/studio/shell/BrandMark.tsx`:

```tsx
import type { ReactElement } from 'react';

import { Icon } from '@/payload/admin/Icon';

export function BrandMark({ collapsed }: { readonly collapsed: boolean }): ReactElement {
  return (
    <span className="flex items-center gap-2">
      <Icon />
      {collapsed ? null : <span className="text-heading text-fg">CleanStart Studio</span>}
    </span>
  );
}
```

Check the export name of `apps/cms/src/payload/admin/Icon.tsx` (`grep -n "export" apps/cms/src/payload/admin/Icon.tsx`) and adjust the import if it is a default export.

`apps/cms/src/studio/shell/SkipLink.tsx`:

```tsx
import type { ReactElement } from 'react';

export function SkipLink(): ReactElement {
  return (
    <a
      href="#studio-main"
      className="sr-only rounded-sm bg-overlay px-3 py-2 text-body-strong text-fg shadow-popover focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-palette)"
    >
      Skip to content
    </a>
  );
}
```

`apps/cms/src/studio/shell/UserMenu.tsx`:

```tsx
'use client';

import { DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';

import type { ShellUser } from '@/studio/server/loaders/shell';
import { useTheme } from '@/studio/theme/ThemeProvider';
import { Avatar } from '@/studio/ui';

export function UserMenu({ user, collapsed }: { readonly user: ShellUser; readonly collapsed: boolean }): ReactElement {
  const router = useRouter();
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { preference, setPreference } = useTheme();

  const signOut = async (): Promise<void> => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    router.replace('/studio/login');
    router.refresh();
  };

  const themeItem = (value: 'system' | 'light' | 'dark', label: string): DropdownMenuItem => ({
    kind: 'item',
    id: `theme-${value}`,
    label: preference === value ? `${label} (current)` : label,
    onSelect: () => setPreference(value),
  });

  const items: DropdownMenuItem[] = [
    { kind: 'item', id: 'account', label: 'Account', onSelect: () => router.push('/studio/account') },
    { kind: 'separator', id: 's1' },
    { kind: 'label', id: 'theme', label: 'Theme' },
    themeItem('system', 'Match system'),
    themeItem('light', 'Light'),
    themeItem('dark', 'Dark'),
    { kind: 'separator', id: 's2' },
    { kind: 'item', id: 'site', label: 'Open published site', onSelect: () => window.open('https://www.cleanstart.com', '_blank', 'noopener') },
    { kind: 'item', id: 'signout', label: 'Sign out', onSelect: () => void signOut() },
  ];

  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-hover"
      >
        <Avatar name={user.name} decorative />
        {collapsed ? (
          <span className="sr-only">{user.name}</span>
        ) : (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-strong text-fg">{user.name}</span>
            <span className="truncate text-small text-fg-muted">{user.roles.join(', ')}</span>
          </span>
        )}
      </button>
      <DropdownMenu open={open} onClose={() => setOpen(false)} anchorRef={anchor} items={items} placement="top-start" ariaLabel="Account menu" />
    </>
  );
}
```

`apps/cms/src/studio/shell/Sidebar.tsx`:

```tsx
'use client';

import { CaretRight, House, MagnifyingGlass, SidebarSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ReactElement } from 'react';

import { cn } from '@/studio/lib/cn';
import type { ShellData } from '@/studio/server/loaders/shell';
import { updateStudioPreferences } from '@/studio/server/actions/preferences';
import { IconButton, Kbd } from '@/studio/ui';

import { BrandMark } from './BrandMark';
import { UserMenu } from './UserMenu';

export function Sidebar({
  shell,
  collapsed,
  onToggle,
}: {
  readonly shell: ShellData;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  const pathname = usePathname();
  const [closed, setClosed] = useState<readonly string[]>(shell.preferences.navGroupsClosed ?? []);
  const [, startTransition] = useTransition();

  const toggleGroup = (id: string): void => {
    const next = closed.includes(id) ? closed.filter((g) => g !== id) : [...closed, id];
    setClosed(next);
    startTransition(() => void updateStudioPreferences({ navGroupsClosed: next }));
  };

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Studio"
      className={cn(
        'sticky top-0 z-(--z-sidebar) flex h-dvh shrink-0 flex-col transition-[width] duration-(--duration-slow) ease-(--ease-out)',
        collapsed ? 'w-(--sidebar-collapsed-width)' : 'w-(--sidebar-width)',
      )}
    >
      <div className="flex h-12 items-center justify-between gap-2 px-3">
        <Link href="/studio" aria-label="Studio home">
          <BrandMark collapsed={collapsed} />
        </Link>
        <IconButton label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} shortcut="⌘\" icon={<SidebarSimple size={16} aria-hidden="true" />} onClick={onToggle} />
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent('studio:palette:open'))}
          className="flex h-8 w-full items-center gap-2 rounded-md bg-surface px-2.5 text-body text-fg-subtle shadow-raised hover:text-fg-muted"
        >
          <MagnifyingGlass size={14} aria-hidden="true" />
          {collapsed ? <span className="sr-only">Search</span> : <span className="flex-1 text-left">Search</span>}
          {collapsed ? null : <Kbd keys={['⌘', 'K']} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <Link
          href="/studio"
          aria-current={pathname === '/studio' ? 'page' : undefined}
          className="flex h-7.5 items-center gap-2.5 rounded-sm px-2 text-body-strong text-fg-muted hover:bg-hover hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg aria-[current=page]:shadow-raised"
        >
          <House size={15} aria-hidden="true" />
          {collapsed ? <span className="sr-only">Home</span> : 'Home'}
        </Link>

        {shell.nav.map((group) => {
          const open = !closed.includes(group.id);
          const listId = `nav-group-${group.id}`;
          return (
            <div key={group.id} className="mt-4">
              {collapsed ? null : (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => toggleGroup(group.id)}
                  className="flex h-6 w-full items-center gap-1 px-2 text-micro text-fg-subtle hover:text-fg-muted"
                >
                  <CaretRight size={10} aria-hidden="true" className={cn('transition-transform duration-(--duration-base)', open && 'rotate-90')} />
                  {group.label}
                </button>
              )}
              <ul id={listId} hidden={!open && !collapsed} className="flex flex-col">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className="flex h-7.5 items-center justify-between gap-2 rounded-sm px-2 text-body-strong text-fg-muted hover:bg-hover hover:text-fg aria-[current=page]:bg-surface aria-[current=page]:text-fg aria-[current=page]:shadow-raised"
                    >
                      <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                      {!collapsed && item.draftCount > 0 ? (
                        <span className="tabular text-micro text-fg-subtle" aria-label={`${item.draftCount} drafts`}>
                          {item.draftCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="border-t border-line-subtle p-2">
        <UserMenu user={shell.user} collapsed={collapsed} />
      </div>
    </nav>
  );
}
```

`apps/cms/src/studio/shell/AppShell.tsx`:

```tsx
'use client';

import { ToastProvider } from '@cleanstart/ui';
import { useCallback, useEffect, useState, useTransition } from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { ShellData } from '@/studio/server/loaders/shell';
import { updateStudioPreferences } from '@/studio/server/actions/preferences';

import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';

export function AppShell({ shell, children }: { readonly shell: ShellData; readonly children: ReactNode }): ReactElement {
  const [collapsed, setCollapsed] = useState(shell.preferences.sidebarCollapsed ?? false);
  const [, startTransition] = useTransition();

  // The server action runs outside the state updater: React may call an
  // updater twice (reactStrictMode in dev), which would save twice.
  const toggle = useCallback((): void => {
    const next = !collapsed;
    setCollapsed(next);
    startTransition(() => void updateStudioPreferences({ sidebarCollapsed: next }));
  }, [collapsed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return (
    <ToastProvider>
      <SkipLink />
      <div className="flex h-dvh bg-canvas text-fg">
        <Sidebar shell={shell} collapsed={collapsed} onToggle={toggle} />
        <div className="min-w-0 flex-1 py-(--sheet-inset) pr-(--sheet-inset)">
          {/* The sheet: the only scroll container, so sticky headers stick to its top edge. */}
          <main id="studio-main" tabIndex={-1} className="relative h-full overflow-y-auto rounded-lg bg-surface shadow-sheet outline-none">
            {children}
          </main>
        </div>
      </div>
      <div className="fixed inset-0 z-(--z-palette) hidden items-center justify-center bg-canvas p-8 text-center max-[1023px]:flex">
        <p className="max-w-sm text-body text-fg-muted">
          Studio needs a wider window. <a className="text-accent-fg underline" href="https://www.cleanstart.com">Open the published site</a>.
        </p>
      </div>
    </ToastProvider>
  );
}
```

- [ ] **Step 6: Routes**

`apps/cms/src/app/(studio)/studio/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';

import { getShellData } from '@/studio/server/loaders/shell';
import { getSession } from '@/studio/server/session';
import { AppShell } from '@/studio/shell/AppShell';

export default async function SignedInLayout({ children }: { readonly children: ReactNode }): Promise<ReactElement> {
  const session = await getSession();
  if (!session) redirect('/studio/login');
  if (!session.permissions.canAccessAdmin) redirect('/studio/forbidden?reason=role');
  const shell = await getShellData(session);
  return <AppShell shell={shell}>{children}</AppShell>;
}
```

`apps/cms/src/app/(studio)/studio/(app)/page.tsx` (the dashboard arrives in Phase 6):

```tsx
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { requireSession } from '@/studio/server/session';
import { PageHeader } from '@/studio/ui';

export const metadata: Metadata = { title: 'Home' };

export default async function Home(): Promise<ReactElement> {
  const { user } = await requireSession('/studio');
  return (
    <>
      <PageHeader title="Home" />
      <div className="px-6 py-8">
        <p className="text-body text-fg-muted">Welcome back, {user.name.split(' ')[0]}. Choose a collection from the sidebar.</p>
      </div>
    </>
  );
}
```

`apps/cms/src/app/(studio)/studio/(app)/not-found.tsx`:

```tsx
import Link from 'next/link';
import type { ReactElement } from 'react';

import { EmptyState, buttonClass } from '@/studio/ui';

export default function NotFound(): ReactElement {
  return (
    <EmptyState
      title="This page does not exist"
      description="The link may be old, or the document was deleted."
      action={<Link href="/studio" className={buttonClass('secondary', 'md')}>Go to Home</Link>}
    />
  );
}
```

`apps/cms/src/app/(studio)/studio/(app)/error.tsx`:

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import type { ReactElement } from 'react';

import { Button, EmptyState } from '@/studio/ui';

export default function StudioError({ error, reset }: { readonly error: Error & { digest?: string }; readonly reset: () => void }): ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <EmptyState
      title="Something went wrong"
      description={error.digest ? `Reference ${error.digest}. Try again, and share the reference if it keeps happening.` : 'Try again.'}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
```

`apps/cms/src/app/(studio)/studio/forbidden/page.tsx` (outside the signed-in group so it cannot redirect to itself):

```tsx
import Link from 'next/link';
import type { ReactElement } from 'react';

import { EmptyState, buttonClass } from '@/studio/ui';

export default async function Forbidden({ searchParams }: { readonly searchParams: Promise<{ reason?: string }> }): Promise<ReactElement> {
  const { reason } = await searchParams;
  const description =
    reason === 'role' ? 'Your role cannot use Studio. Ask an admin if you need access.' : 'You do not have access to this page.';
  return (
    <main className="grid min-h-dvh place-items-center">
      <EmptyState title="No access" description={description} action={<Link href="/studio/login" className={buttonClass('secondary', 'md')}>Sign in as someone else</Link>} />
    </main>
  );
}
```

Replace the lab gate in `apps/cms/src/app/(studio)/studio/lab/page.tsx` with an admin check:

```tsx
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import { hasRole } from '@/payload/access/typed-user';
import { LabPage } from '@/studio/lab/LabPage';
import { requireSession } from '@/studio/server/session';

export default async function Lab(): Promise<ReactElement> {
  const { user } = await requireSession('/studio/lab');
  if (!hasRole(user, 'admin')) notFound();
  return <LabPage />;
}
```

- [ ] **Step 7: Verify**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms verify:studio-boundaries`
Expected: PASS, exit 0, boundary check passed.

Sign in through `/admin` (Studio's login arrives in Task 1.11; the cookie is shared), then open `/studio` with `STUDIO_SHOW_UNREADY=true`: the sidebar shows the groups your role can read, collapse persists across reloads, ⌘\ toggles the sidebar, the skip link is the first tab stop.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/studio/server/readiness.ts apps/cms/src/studio/server/nav.ts apps/cms/src/studio/server/nav.test.ts apps/cms/src/studio/server/loaders/shell.ts apps/cms/src/studio/server/actions/preferences.ts apps/cms/src/studio/shell "apps/cms/src/app/(studio)/studio"
git commit -m "feat(studio): T1.10 app shell and navigation"
```

### Task 1.11: Sign in, forgot password, reset password (S-01 to S-03)

**Files:**
- Create: `apps/cms/src/studio/features/auth/AuthCard.tsx`, `BrandPanel.tsx`
- Create: `apps/cms/public/studio/hero-grid.svg` (copied from `apps/web/public/images/cleanstart-images/hero-vector-grid.svg`)
- Create: `apps/cms/src/studio/features/auth/LoginForm.tsx`, `ForgotForm.tsx`, `ResetForm.tsx`
- Create: `apps/cms/src/studio/features/auth/auth-errors.ts`
- Test: `apps/cms/src/studio/features/auth/auth-errors.test.ts`
- Create: `apps/cms/src/app/(studio)/studio/login/page.tsx`, `forgot-password/page.tsx`, `reset-password/[token]/page.tsx`
- Modify: `apps/cms/src/studio/styles/primitives.css` (brand panel motion)

The reset email does not point at S-03 yet. Payload's forgot-password email links to `/admin/reset/:token` until Task 7.4 (`docs/studio/08-PHASE-2-7-TASKS.md` T7.4) sets `auth.forgotPassword.generateEmailHTML` on the users collection. Until then S-03 is built and e2e-tested by visiting `/studio/reset-password/<token>` directly, with a token taken from the test database or from the link in the email; do not change the users collection's email in this task.

- [ ] **Step 1: Write the failing test for error messages**

`apps/cms/src/studio/features/auth/auth-errors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { loginErrorMessage } from './auth-errors';

describe('loginErrorMessage', () => {
  it('explains a lockout', () => {
    expect(loginErrorMessage(423, { errors: [{ message: 'This user is locked due to having too many failed login attempts.' }] })).toBe(
      'Too many attempts. Try again in 10 minutes.',
    );
  });

  it('passes through the disabled-account message from beforeLogin', () => {
    expect(loginErrorMessage(401, { errors: [{ message: 'This account has been disabled. Contact an administrator.' }] })).toBe(
      'This account has been disabled. Contact an administrator.',
    );
  });

  it('never says which of email or password was wrong', () => {
    expect(loginErrorMessage(401, { errors: [{ message: 'The email or password provided is incorrect.' }] })).toBe(
      'Email or password is incorrect.',
    );
  });

  it('falls back for unexpected responses', () => {
    expect(loginErrorMessage(500, null)).toBe('Sign in failed. Try again.');
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/features/auth/auth-errors.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement**

`apps/cms/src/studio/features/auth/auth-errors.ts`:

```ts
type PayloadErrorBody = { readonly errors?: ReadonlyArray<{ readonly message?: string }> } | null;

// Lockout after 5 attempts for 10 minutes: collections/Users.ts:28-29.
export const loginErrorMessage = (status: number, body: PayloadErrorBody): string => {
  const raw = body?.errors?.[0]?.message ?? '';
  if (status === 423 || /locked/i.test(raw)) return 'Too many attempts. Try again in 10 minutes.';
  if (/disabled/i.test(raw)) return raw;
  if (status === 401 || status === 400) return 'Email or password is incorrect.';
  return 'Sign in failed. Try again.';
};
```

Run the test again. Expected: PASS (4 tests).

- [ ] **Step 3: The split layout**

Copy the website's faded grid so the CMS serves it from its own origin:

```bash
mkdir -p apps/cms/public/studio
cp apps/web/public/images/cleanstart-images/hero-vector-grid.svg apps/cms/public/studio/hero-grid.svg
file --mime-type -b apps/cms/public/studio/hero-grid.svg
```

Expected: `image/svg+xml`.

`apps/cms/src/studio/features/auth/BrandPanel.tsx` (design system §7.7; decorative, so it is hidden from assistive tech and shows fixed copy, never real content):

```tsx
import type { ReactElement } from 'react';

import { Icon } from '@/payload/admin/Icon';

// The content types Studio publishes, in roll order. The roll and the chip highlights are timed for
// exactly six entries in primitives.css; change both together.
const KINDS = ['blog post', 'guide', 'case study', 'webinar', 'press release', 'podcast episode'] as const;
const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function BrandPanel(): ReactElement {
  return (
    <div aria-hidden="true" className="relative isolate hidden flex-col overflow-hidden rounded-lg bg-(image:--brand-band) px-11 pb-11 pt-10 text-white min-[1100px]:flex">
      <span className="studio-brand-glow absolute -left-36 -top-30 -z-10 h-105 w-130 rounded-full bg-(--brand-glow-violet) blur-3xl" />
      <span className="studio-brand-glow absolute -right-50 top-65 -z-10 h-115 w-140 rounded-full bg-(--brand-glow-blue) blur-3xl" />
      <span className="studio-brand-glow absolute -bottom-42 left-35 -z-10 h-75 w-105 rounded-full bg-(--brand-glow-pink) blur-3xl" />
      <img src="/studio/hero-grid.svg" alt="" width={730} height={708} className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-40" />
      <div className="flex items-center gap-2.5 text-heading text-white">
        <Icon />
        CleanStart
      </div>
      <p className="mt-auto text-brand">
        <span className="block text-white/60">Write the next</span>
        <span className="studio-brand-slot block h-23 overflow-hidden">
          <span className="studio-brand-words block">
            {[...KINDS, KINDS[0]].map((kind, i) => (
              <span key={i === KINDS.length ? 'loop' : kind} className="block h-23 whitespace-nowrap">
                {kind}
                <span className="text-(--brand-accent)">.</span>
              </span>
            ))}
          </span>
        </span>
      </p>
      <p className="mt-5 max-w-108 text-doc-lead text-white/70">Studio is where every page on cleanstart.com is written, reviewed and published.</p>
      <div className="studio-brand-chips mt-auto flex flex-wrap gap-2 pt-8">
        {KINDS.map((kind) => (
          <span key={kind} className="inline-flex h-7.5 items-center rounded-full px-3.5 text-body-strong ring-1 ring-white/12">
            {capitalise(kind)}
          </span>
        ))}
      </div>
    </div>
  );
}
```

Add the roll, the chip highlights and the glow drift to `apps/cms/src/studio/styles/primitives.css` inside `@layer components`. This is the only looping motion in Studio and does not use the duration tokens, so it carries its own reduced-motion gate; under reduced motion the panel holds on "blog post" with its chip lit:

```css
  /* Sign-in brand panel (design system §7.7): six words, 2.4s each, one 14.4s loop.
     The word list ends with a copy of the first word, so the jump from the last frame to 0 is invisible. */
  .studio-brand-slot {
    -webkit-mask-image: linear-gradient(180deg, transparent 0, var(--color-black) 18%, var(--color-black) 82%, transparent 100%);
    mask-image: linear-gradient(180deg, transparent 0, var(--color-black) 18%, var(--color-black) 82%, transparent 100%);
  }
  .studio-brand-chips > span { background: var(--brand-chip); color: var(--brand-chip-text); }
  .studio-brand-chips > span:first-child { background: var(--color-white); color: var(--brand-ink); }
  @media (prefers-reduced-motion: no-preference) {
    .studio-brand-words { animation: studio-roll 14.4s linear infinite; }
    @keyframes studio-roll { 0% { transform: translateY(0); } 12.5% { transform: translateY(0px); animation-timing-function: var(--ease-out); } 16.667% { transform: translateY(-92px); } 29.167% { transform: translateY(-92px); animation-timing-function: var(--ease-out); } 33.333% { transform: translateY(-184px); } 45.833% { transform: translateY(-184px); animation-timing-function: var(--ease-out); } 50% { transform: translateY(-276px); } 62.5% { transform: translateY(-276px); animation-timing-function: var(--ease-out); } 66.667% { transform: translateY(-368px); } 79.167% { transform: translateY(-368px); animation-timing-function: var(--ease-out); } 83.333% { transform: translateY(-460px); } 95.833% { transform: translateY(-460px); animation-timing-function: var(--ease-out); } 100% { transform: translateY(-552px); } }
    .studio-brand-chips > span:nth-child(1) { animation: studio-chip-1 14.4s linear infinite; }
    @keyframes studio-chip-1 { 0%, 13.5% { background: var(--color-white); color: var(--brand-ink); } 15.5%, 95.833% { background: var(--brand-chip); color: var(--brand-chip-text); } 100% { background: var(--color-white); color: var(--brand-ink); } }
    .studio-brand-chips > span:nth-child(2) { animation: studio-chip-2 14.4s linear infinite; }
    @keyframes studio-chip-2 { 0%, 15.667% { background: var(--brand-chip); color: var(--brand-chip-text); } 17.667%, 30.167% { background: var(--color-white); color: var(--brand-ink); } 32.167%, 100% { background: var(--brand-chip); color: var(--brand-chip-text); } }
    .studio-brand-chips > span:nth-child(3) { animation: studio-chip-3 14.4s linear infinite; }
    @keyframes studio-chip-3 { 0%, 32.333% { background: var(--brand-chip); color: var(--brand-chip-text); } 34.333%, 46.833% { background: var(--color-white); color: var(--brand-ink); } 48.833%, 100% { background: var(--brand-chip); color: var(--brand-chip-text); } }
    .studio-brand-chips > span:nth-child(4) { animation: studio-chip-4 14.4s linear infinite; }
    @keyframes studio-chip-4 { 0%, 49% { background: var(--brand-chip); color: var(--brand-chip-text); } 51%, 63.5% { background: var(--color-white); color: var(--brand-ink); } 65.5%, 100% { background: var(--brand-chip); color: var(--brand-chip-text); } }
    .studio-brand-chips > span:nth-child(5) { animation: studio-chip-5 14.4s linear infinite; }
    @keyframes studio-chip-5 { 0%, 65.667% { background: var(--brand-chip); color: var(--brand-chip-text); } 67.667%, 80.167% { background: var(--color-white); color: var(--brand-ink); } 82.167%, 100% { background: var(--brand-chip); color: var(--brand-chip-text); } }
    .studio-brand-chips > span:nth-child(6) { animation: studio-chip-6 14.4s linear infinite; }
    @keyframes studio-chip-6 { 0%, 82.333% { background: var(--brand-chip); color: var(--brand-chip-text); } 84.333%, 96.833% { background: var(--color-white); color: var(--brand-ink); } 98.833%, 100% { background: var(--brand-chip); color: var(--brand-chip-text); } }
    .studio-brand-glow { animation: studio-glow 14s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate; }
    .studio-brand-glow:nth-child(2) { animation-duration: 17s; animation-delay: -6s; }
    .studio-brand-glow:nth-child(3) { animation-duration: 12s; animation-delay: -3s; }
    @keyframes studio-glow { to { transform: translate(36px, -24px) scale(1.12); } }
  }
```

The headline uses `text-brand` (76/92), whose line height must stay equal to `h-23` (92px) and to the 92px steps in `studio-roll`. The panel colours come from the `--brand-*` tokens in `tokens.css` and from `--color-white` and `--color-black` in the `@theme` block of `studio.css` (Task 0.3). Check that `Icon` from `@/payload/admin/Icon` renders the mark in `currentColor` on this dark panel; if its second path is hard-coded dark, pass a `className` that sets `color: white` or render the two paths here from that file.

`apps/cms/src/studio/features/auth/AuthCard.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

import { Icon } from '@/payload/admin/Icon';

import { BrandPanel } from './BrandPanel';

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}): ReactElement {
  return (
    <div className="grid min-h-dvh grid-cols-1 gap-(--sheet-inset) bg-surface p-(--sheet-inset) min-[1100px]:grid-cols-[minmax(0,1fr)_776px]">
      <main className="flex min-w-0 flex-col px-10 py-7">
        <div className="flex items-center gap-2.5 text-body-strong text-fg">
          <Icon />
          CleanStart <span className="text-fg-subtle">Studio</span>
        </div>
        <div className="grid flex-1 place-items-center py-10">
          <section className="flex w-full max-w-90 flex-col gap-5">
            <div>
              <h1 className="text-display text-fg">{title}</h1>
              {description ? <p className="mt-1.5 text-body text-fg-muted">{description}</p> : null}
            </div>
            {children}
          </section>
        </div>
        {footer ? <p className="text-small text-fg-subtle">{footer}</p> : null}
      </main>
      <BrandPanel />
    </div>
  );
}
```

- [ ] **Step 4: Login form**

`apps/cms/src/studio/features/auth/LoginForm.tsx`:

```tsx
'use client';

import { Eye, EyeSlash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Banner, Button, Field, TextInput } from '@/studio/ui';

import { loginErrorMessage } from './auth-errors';

export function LoginForm({ next }: { readonly next: string }): ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const res = await fetch('/api/users/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(loginErrorMessage(res.status, (await res.json().catch(() => null)) as never));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Field id="email" label="Email">
        <TextInput id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field id="password" label="Password">
        <TextInput
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          suffix={
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="text-fg-subtle hover:text-fg">
              {showPassword ? <EyeSlash size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
            </button>
          }
        />
      </Field>
      <div className="flex justify-end">
        <Link href="/studio/forgot-password" className="text-small text-accent-fg hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" variant="primary" size="xl" loading={busy} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Forgot and reset forms**

`apps/cms/src/studio/features/auth/ForgotForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Banner, Button, Field, TextInput } from '@/studio/ui';

export function ForgotForm(): ReactElement {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    const email = new FormData(event.currentTarget).get('email');
    // Same message whatever happens, so the form never reveals which emails have accounts.
    await fetch('/api/users/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);
    setBusy(false);
    setSent(true);
  };

  if (sent) return <Banner tone="success">If that email has an account, a reset link is on its way.</Banner>;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="email" label="Email">
        <TextInput id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Button type="submit" variant="primary" size="xl" loading={busy} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
```

`apps/cms/src/studio/features/auth/ResetForm.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Banner, Button, Field, TextInput } from '@/studio/ui';

const MIN_LENGTH = 12;

export function ResetForm({ token }: { readonly token: string }): ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const longEnough = password.length >= MIN_LENGTH;
  const matches = password.length > 0 && password === confirm;

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!longEnough || !matches) return;
    setBusy(true);
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      router.replace('/studio');
      router.refresh();
      return;
    }
    setBusy(false);
    setError('This link has expired or was already used.');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <Banner tone="danger" action={<Link href="/studio/forgot-password" className="text-small text-accent-fg underline">Request a new link</Link>}>
          {error}
        </Banner>
      ) : null}
      <Field id="password" label="New password">
        <TextInput id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
      </Field>
      <Field id="confirm" label="Confirm password">
        <TextInput id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <ul className="flex flex-col gap-1 text-small" aria-live="polite">
        <li className={longEnough ? 'text-success' : 'text-fg-muted'}>At least {MIN_LENGTH} characters</li>
        <li className={matches ? 'text-success' : 'text-fg-muted'}>Both passwords match</li>
      </ul>
      <Button type="submit" variant="primary" size="xl" loading={busy} disabled={!longEnough || !matches} className="w-full">
        Set password
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Routes**

`apps/cms/src/app/(studio)/studio/login/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';

import { AuthCard } from '@/studio/features/auth/AuthCard';
import { LoginForm } from '@/studio/features/auth/LoginForm';
import { safeNextPath } from '@/studio/lib/next-path';
import { getSession } from '@/studio/server/session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function Login({ searchParams }: { readonly searchParams: Promise<{ next?: string }> }): Promise<ReactElement> {
  const { next } = await searchParams;
  const target = safeNextPath(next);
  const session = await getSession();
  if (session?.permissions.canAccessAdmin) redirect(target);
  return (
    <AuthCard title="Welcome back" description="Sign in with your CleanStart work account." footer="Need access? Ask an admin.">
      <LoginForm next={target} />
    </AuthCard>
  );
}
```

`apps/cms/src/app/(studio)/studio/forgot-password/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { AuthCard } from '@/studio/features/auth/AuthCard';
import { ForgotForm } from '@/studio/features/auth/ForgotForm';

export const metadata: Metadata = { title: 'Reset your password' };

export default function Forgot(): ReactElement {
  return (
    <AuthCard title="Reset your password" footer={<Link href="/studio/login" className="text-accent-fg hover:underline">Back to sign in</Link>}>
      <ForgotForm />
    </AuthCard>
  );
}
```

`apps/cms/src/app/(studio)/studio/reset-password/[token]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { AuthCard } from '@/studio/features/auth/AuthCard';
import { ResetForm } from '@/studio/features/auth/ResetForm';

export const metadata: Metadata = { title: 'Set a new password' };

export default async function Reset({ params }: { readonly params: Promise<{ token: string }> }): Promise<ReactElement> {
  const { token } = await params;
  return (
    <AuthCard title="Set a new password">
      <ResetForm token={token} />
    </AuthCard>
  );
}
```

Check: spacing utilities such as `max-w-90`, `max-w-108`, `h-23` and `h-115` are multiples of Tailwind's 4px spacing scale (v4 accepts any integer); confirm they compile. Then open `/studio/login` at 1440×900 in both themes and at 1024 wide (panel hidden), and compare against the approved direction B sign-in mockup.

- [ ] **Step 7: Verify**

Run the unit test again and typecheck. In the browser pane at 1440×900: sign out, open `/studio/collections/redirects`, confirm the redirect to `/studio/login?next=...`, sign in, land back on redirects. Wrong password five times shows the lockout message (use a local test user from Task 1.17, never a real account). Forgot password shows the neutral message.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/studio/features/auth apps/cms/src/studio/styles/primitives.css apps/cms/public/studio/hero-grid.svg "apps/cms/src/app/(studio)/studio/login" "apps/cms/src/app/(studio)/studio/forgot-password" "apps/cms/src/app/(studio)/studio/reset-password"
git commit -m "feat(studio): T1.11 sign in, forgot and reset password"
```

### Task 1.12: Form engine core

Client-side form state with react-hook-form (ADR-7). The server stays the gate: Payload validates every save and its errors land on the matching fields.

Rules the engine follows, each with the source of the rule:

- **Draft saves skip client validation.** Payload does not validate drafts unless `versions.drafts.validate` is on, and no collection turns it on (`payload/shared` `hasDraftValidationEnabled`). Publish and plain saves validate.
- **Fields hidden by a condition are not validated.** Payload skips them too. Conditional fields unmount, and react-hook-form skips unmounted fields with `shouldUnregister: false` while keeping their values.
- **Hidden fields keep their values.** They are never rendered, and their stored values are kept in `defaultValues`.
- **Only changed top-level fields are sent.** Payload merges a partial update at the top level, so a field Studio does not render yet is never touched by a Studio save (Task 1.16 `buildPatch`).

**Files:**
- Modify: `apps/cms/package.json` (add react-hook-form)
- Modify: `apps/cms/src/studio/form/engine/types.ts`
- Create: `apps/cms/src/studio/form/engine/paths.ts`
- Create: `apps/cms/src/studio/form/engine/validation.ts`
- Test: `apps/cms/src/studio/form/engine/engine.test.ts`
- Create: `apps/cms/src/studio/form/engine/StudioFormContext.tsx`
- Create: `apps/cms/src/studio/form/engine/useStudioField.ts`
- Create: `apps/cms/src/studio/form/engine/Conditional.tsx`
- Create: `apps/cms/src/studio/form/RenderFields.tsx`
- Create: `apps/cms/src/studio/form/fields/PendingField.tsx`

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter @cleanstart/cms add react-hook-form@^7`
Expected: added to `apps/cms/package.json`.

- [ ] **Step 2: Write the failing tests for paths and validation**

`apps/cms/src/studio/form/engine/engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { StudioField } from '@/studio/server/schema/types';

import { getAt, joinPath, parentPath, permissionPath } from './paths';
import { validateValue } from './validation';

const base = {
  label: 'Field',
  description: null,
  readOnly: false,
  hidden: false,
  position: 'main',
  width: null,
  condition: null,
  validator: null,
  component: null,
  cell: null,
  rowLabel: null,
  defaultValue: null,
} as const;

const text = (over: Partial<Extract<StudioField, { type: 'text' }>> = {}): StudioField => ({
  ...base,
  name: 'title',
  type: 'text',
  required: false,
  hasMany: false,
  minLength: null,
  maxLength: null,
  ...over,
});

describe('paths', () => {
  it('joins, splits and reads nested values', () => {
    expect(joinPath('', 'seo')).toBe('seo');
    expect(joinPath('seo', 'title')).toBe('seo.title');
    expect(joinPath('seo', null)).toBe('seo');
    expect(parentPath('faqs.2.question')).toBe('faqs.2');
    expect(parentPath('title')).toBe('');
    expect(getAt({ faqs: [{ question: 'a' }, { question: 'b' }] }, 'faqs.1.question')).toBe('b');
    expect(getAt({ a: null }, 'a.b')).toBeUndefined();
  });

  it('drops array indexes for permission lookups', () => {
    expect(permissionPath('faqs.2.question')).toEqual(['faqs', 'question']);
  });
});

describe('validateValue', () => {
  const ctx = { data: {}, siblingData: {} };

  it('requires a value when the field is required', async () => {
    expect(await validateValue(text({ required: true }), '', ctx)).toBe('This field is required.');
    expect(await validateValue(text({ required: true }), 'x', ctx)).toBe(true);
  });

  it('checks length limits', async () => {
    expect(await validateValue(text({ maxLength: 3 }), 'abcd', ctx)).toBe('Use 3 characters or fewer.');
    expect(await validateValue(text({ minLength: 2 }), 'a', ctx)).toBe('Use at least 2 characters.');
  });

  it('checks number bounds', async () => {
    const num: StudioField = { ...base, name: 'n', type: 'number', required: false, hasMany: false, min: 1, max: 5 };
    expect(await validateValue(num, 0, ctx)).toBe('Enter 1 or more.');
    expect(await validateValue(num, 6, ctx)).toBe('Enter 5 or less.');
    expect(await validateValue(num, 3, ctx)).toBe(true);
  });

  it('checks email shape', async () => {
    const email: StudioField = { ...base, name: 'e', type: 'email', required: false };
    expect(await validateValue(email, 'not-an-email', ctx)).toBe('Enter a valid email address.');
    expect(await validateValue(email, 'ana@cleanstart.com', ctx)).toBe(true);
  });

  it('checks JSON typed as text', async () => {
    const json: StudioField = { ...base, name: 'j', type: 'json', required: false };
    expect(await validateValue(json, '{"a":', ctx)).toBe('Enter valid JSON.');
    expect(await validateValue(json, '{"a":1}', ctx)).toBe(true);
    expect(await validateValue(json, { a: 1 }, ctx)).toBe(true);
  });

  it('treats a required checkbox as satisfied by false, like Payload', async () => {
    const box: StudioField = { ...base, name: 'b', type: 'checkbox', required: true };
    expect(await validateValue(box, false, ctx)).toBe(true);
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/form/engine/engine.test.ts`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement paths and validation**

`apps/cms/src/studio/form/engine/paths.ts`:

```ts
export const joinPath = (base: string, name: string | null): string => {
  if (name === null) return base;
  return base ? `${base}.${name}` : name;
};

export const parentPath = (path: string): string => path.split('.').slice(0, -1).join('.');

export const permissionPath = (path: string): string[] => path.split('.').filter((segment) => !/^\d+$/.test(segment));

export const getAt = (value: unknown, path: string): unknown => {
  if (!path) return value;
  let current: unknown = value;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

export const fieldDomId = (path: string): string => `field-${path.replace(/\./g, '-')}`;
```

`apps/cms/src/studio/form/engine/validation.ts`:

```ts
import type { Validate } from 'payload';

import { pureValidators } from '@/payload/admin-logic/validators';
import type { StudioField } from '@/studio/server/schema/types';

type Ctx = { readonly data: Record<string, unknown>; readonly siblingData: Record<string, unknown> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

// Mirrors the checks Payload's default validators make for each type, so the
// common mistakes show before a round trip. Payload still validates on save.
export const validateValue = async (field: StudioField, value: unknown, ctx: Ctx): Promise<string | true> => {
  if (field.type === 'checkbox') return true;
  if (field.required && isEmpty(value)) return 'This field is required.';
  if (isEmpty(value)) return true;

  switch (field.type) {
    case 'text':
    case 'textarea': {
      if (typeof value !== 'string') break;
      if (field.maxLength !== null && value.length > field.maxLength) return `Use ${field.maxLength} characters or fewer.`;
      if (field.minLength !== null && value.length < field.minLength) return `Use at least ${field.minLength} characters.`;
      break;
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return 'Enter a number.';
      if (field.min !== null && n < field.min) return `Enter ${field.min} or more.`;
      if (field.max !== null && n > field.max) return `Enter ${field.max} or less.`;
      break;
    }
    case 'email':
      if (typeof value !== 'string' || !EMAIL.test(value)) return 'Enter a valid email address.';
      break;
    case 'json':
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          return 'Enter valid JSON.';
        }
      }
      break;
    default:
      break;
  }

  if (field.validator?.kind === 'pure') {
    const entry = pureValidators[field.validator.key as keyof typeof pureValidators];
    if (entry) {
      // Pure validators read only the value and data, never req (see admin-logic/validators.ts).
      // Cast to the general Validate signature: each entry's own options type differs.
      const result = await (entry.fn as Validate)(value, { ...ctx, operation: 'update' } as never);
      if (result !== true) return typeof result === 'string' ? result : 'This value is not valid.';
    }
  }
  return true;
};
```

Run the test again. Expected: PASS (8 tests).

- [ ] **Step 4: Context, field hook, conditions and the renderer**

Extend `apps/cms/src/studio/form/engine/types.ts`:

```ts
import type { StudioEntitySchema, StudioField } from '@/studio/server/schema/types';

export type StudioFieldProps = {
  readonly field: StudioField;
  /** Absolute data path in the form, e.g. "seo.title" or "faqs.2.question". */
  readonly path: string;
};

export type StudioFormContextValue = {
  readonly schema: StudioEntitySchema;
  /** Field-level permissions from getAccessResults for this collection or global. */
  readonly fieldPermissions: Record<string, unknown> | undefined;
  /** The whole document is read-only (no update permission, or locked by someone else). */
  readonly readOnly: boolean;
  readonly operation: 'create' | 'update';
  readonly user: { readonly id: number; readonly roles: readonly string[] };
  /** Same document in Payload's admin, for fields Studio does not render yet. */
  readonly classicHref: string | null;
};
```

`apps/cms/src/studio/form/engine/StudioFormContext.tsx`:

```tsx
'use client';

import { createContext, useContext } from 'react';

import type { StudioFormContextValue } from './types';

export const StudioFormContext = createContext<StudioFormContextValue | null>(null);

export const useStudioForm = (): StudioFormContextValue => {
  const value = useContext(StudioFormContext);
  if (!value) throw new Error('useStudioForm must be used inside StudioFormContext');
  return value;
};
```

`apps/cms/src/studio/form/engine/useStudioField.ts`:

```ts
'use client';

import { useController, useFormContext } from 'react-hook-form';

import { fieldCan } from '@/studio/server/permissions';
import type { StudioField } from '@/studio/server/schema/types';

import { fieldDomId, getAt, parentPath, permissionPath } from './paths';
import { useStudioForm } from './StudioFormContext';
import { validateValue } from './validation';

export type StudioFieldBinding = {
  readonly id: string;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  readonly onBlur: () => void;
  readonly ref: (el: HTMLElement | null) => void;
  readonly error: string | undefined;
  readonly readOnly: boolean;
  readonly describedBy: string | undefined;
};

export const useStudioField = (field: StudioField, path: string): StudioFieldBinding => {
  const ctx = useStudioForm();
  const { control, getValues } = useFormContext();
  const op = ctx.operation === 'create' ? 'create' : 'update';
  const readOnly = ctx.readOnly || field.readOnly || !fieldCan(ctx.fieldPermissions, permissionPath(path), op);
  const { field: rhf, fieldState } = useController({
    control,
    name: path,
    rules: {
      validate: (value: unknown) => {
        const data = getValues() as Record<string, unknown>;
        const sibling = (getAt(data, parentPath(path)) ?? {}) as Record<string, unknown>;
        return validateValue(field, value, { data, siblingData: sibling });
      },
    },
  });
  const id = fieldDomId(path);
  const error = fieldState.error?.message;
  const describedBy = [field.description ? `${id}-description` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return { id, value: rhf.value, onChange: rhf.onChange, onBlur: rhf.onBlur, ref: rhf.ref, error, readOnly, describedBy };
};
```

`apps/cms/src/studio/form/engine/Conditional.tsx`:

```tsx
'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import type { ReactElement, ReactNode } from 'react';

import { type ConditionKey, conditions } from '@/payload/admin-logic/conditions';

import { getAt, parentPath } from './paths';
import { useStudioForm } from './StudioFormContext';

// Only fields with an admin.condition render this, so only they re-render on
// every change.
export function Conditional({
  condition,
  path,
  children,
}: {
  readonly condition: ConditionKey;
  readonly path: string;
  readonly children: ReactNode;
}): ReactElement | null {
  const { control } = useFormContext();
  const ctx = useStudioForm();
  const data = useWatch({ control }) as Record<string, unknown>;
  const sibling = (getAt(data, parentPath(path)) ?? {}) as Record<string, unknown>;
  const visible = conditions[condition](data, sibling, { user: ctx.user, operation: ctx.operation });
  return visible ? <>{children}</> : null;
}
```

`apps/cms/src/studio/form/fields/PendingField.tsx`:

```tsx
import type { ReactElement } from 'react';

import { useStudioForm } from '../engine/StudioFormContext';

export function PendingField({ label, phase }: { readonly label: string; readonly phase: number }): ReactElement {
  const { classicHref } = useStudioForm();
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-line px-3 py-2 text-small text-fg-muted">
      <span>
        <span className="text-body-strong text-fg">{label}</span> is not editable in Studio yet (phase {phase}).
      </span>
      {classicHref ? (
        <a href={classicHref} className="shrink-0 text-accent-fg hover:underline">
          Edit in classic admin
        </a>
      ) : null}
    </div>
  );
}
```

`apps/cms/src/studio/form/RenderFields.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import type { StudioField } from '@/studio/server/schema/types';

import { Conditional } from './engine/Conditional';
import { joinPath } from './engine/paths';
import { GenericField } from './fields/GenericField';
import { PendingField } from './fields/PendingField';
import { resolveField } from './registry';

// A stable React key without array indexes. Names are unique at one level of the
// schema; an unnamed container (row, collapsible, tabs) borrows the first name
// found inside it, which is unique for the same reason.
const firstName = (field: StudioField): string | null => {
  if (field.name !== null) return field.name;
  if (field.type === 'tabs') {
    for (const tab of field.tabs) {
      const found = tab.name ?? tab.fields.map(firstName).find((n) => n !== null) ?? null;
      if (found) return found;
    }
    return null;
  }
  if ('fields' in field) return field.fields.map(firstName).find((n) => n !== null) ?? null;
  return null;
};

const fieldKey = (field: StudioField): string => field.name ?? `${field.type}:${firstName(field) ?? field.label ?? 'empty'}`;

function FieldSlot({ field, path }: { readonly field: StudioField; readonly path: string }): ReactElement | null {
  const entry = resolveField(field.component);
  const label = field.label ?? field.name ?? field.type;
  const node =
    entry.kind === 'custom' ? (
      <entry.component field={field} path={path} />
    ) : entry.kind === 'pending' ? (
      <PendingField label={entry.label} phase={entry.phase} />
    ) : entry.kind === 'unknown' ? (
      // verify:studio-coverage fails the build before this can ship; kept as a safe fallback.
      <PendingField label={label} phase={0} />
    ) : (
      <GenericField field={field} path={path} />
    );
  if (node === null) return null;
  return field.condition ? (
    <Conditional condition={field.condition} path={path}>
      {node}
    </Conditional>
  ) : (
    node
  );
}

export function RenderFields({
  fields,
  basePath,
  position,
}: {
  readonly fields: readonly StudioField[];
  readonly basePath: string;
  readonly position?: 'main' | 'sidebar';
}): ReactElement {
  return (
    <>
      {fields
        .filter((field) => !field.hidden && (position === undefined || field.position === position))
        .map((field) => (
          <FieldSlot key={fieldKey(field)} field={field} path={joinPath(basePath, field.name)} />
        ))}
    </>
  );
}
```

`GenericField` is created in Task 1.13; the typecheck in Step 5 runs after that task's Step 1.

- [ ] **Step 5: Commit (after Task 1.13 Step 1 exists)**

```bash
git add apps/cms/package.json pnpm-lock.yaml apps/cms/src/studio/form/engine apps/cms/src/studio/form/RenderFields.tsx apps/cms/src/studio/form/fields/PendingField.tsx
git commit -m "feat(studio): T1.12 form engine core"
```

### Task 1.13: Phase 1 field renderers

Text, textarea, number, email, checkbox, select, radio, date, JSON and the `ui` host. Every other type renders `PendingField` with its phase from `03` §A until that phase builds it.

**Files:**
- Create: `apps/cms/src/studio/form/fields/GenericField.tsx`
- Create: `apps/cms/src/studio/form/fields/basic.tsx` (the Phase 1 renderers)
- Test: `apps/cms/src/studio/form/fields/basic.test.tsx`

- [ ] **Step 1: Write the renderers**

`apps/cms/src/studio/form/fields/basic.tsx`:

```tsx
'use client';

import { DateTimePicker } from '@cleanstart/ui';
import type { ReactElement } from 'react';

import type { StudioField } from '@/studio/server/schema/types';
import { Checkbox, Field, RadioGroup, Select, TextInput, Textarea } from '@/studio/ui';

import { useStudioField } from '../engine/useStudioField';

type Of<T extends StudioField['type']> = Extract<StudioField, { type: T }>;

const optionalFlag = (field: StudioField): boolean => !field.required;

export function TextFieldRenderer({ field, path }: { readonly field: Of<'text'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <TextInput
        id={b.id}
        ref={b.ref}
        value={typeof b.value === 'string' ? b.value : ''}
        onChange={(e) => b.onChange(e.target.value)}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        maxLength={field.maxLength ?? undefined}
        invalid={Boolean(b.error)}
        describedBy={b.describedBy}
      />
    </Field>
  );
}

export function TextareaFieldRenderer({ field, path }: { readonly field: Of<'textarea'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <Textarea
        id={b.id}
        ref={b.ref}
        value={typeof b.value === 'string' ? b.value : ''}
        onChange={(e) => b.onChange(e.target.value)}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        maxLength={field.maxLength ?? undefined}
        invalid={Boolean(b.error)}
        describedBy={b.describedBy}
      />
    </Field>
  );
}

export function NumberFieldRenderer({ field, path }: { readonly field: Of<'number'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <TextInput
        id={b.id}
        ref={b.ref}
        type="number"
        inputMode="decimal"
        className="tabular w-40"
        value={typeof b.value === 'number' ? String(b.value) : ''}
        onChange={(e) => b.onChange(e.target.value === '' ? null : Number(e.target.value))}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        min={field.min ?? undefined}
        max={field.max ?? undefined}
        invalid={Boolean(b.error)}
        describedBy={b.describedBy}
      />
    </Field>
  );
}

export function EmailFieldRenderer({ field, path }: { readonly field: Of<'email'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <TextInput
        id={b.id}
        ref={b.ref}
        type="email"
        value={typeof b.value === 'string' ? b.value : ''}
        onChange={(e) => b.onChange(e.target.value)}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        invalid={Boolean(b.error)}
        describedBy={b.describedBy}
      />
    </Field>
  );
}

export function CheckboxFieldRenderer({ field, path }: { readonly field: Of<'checkbox'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Checkbox
      id={b.id}
      ref={b.ref}
      label={field.label ?? ''}
      description={field.description ?? undefined}
      checked={b.value === true}
      onChange={(e) => b.onChange(e.target.checked)}
      onBlur={b.onBlur}
      disabled={b.readOnly}
    />
  );
}

export function SelectFieldRenderer({ field, path }: { readonly field: Of<'select'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  const common = { id: b.id, options: field.options, invalid: Boolean(b.error), describedBy: b.describedBy, disabled: b.readOnly, clearable: !field.required };
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      {field.hasMany ? (
        <Select {...common} multiple value={Array.isArray(b.value) ? (b.value as string[]) : []} onChange={(next) => b.onChange(next)} />
      ) : (
        <Select {...common} value={typeof b.value === 'string' ? b.value : null} onChange={(next) => b.onChange(next)} />
      )}
    </Field>
  );
}

export function RadioFieldRenderer({ field, path }: { readonly field: Of<'radio'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      {/* A radio group is not labelable, so it names itself from Field's label element (id `${b.id}-label`). */}
      <RadioGroup
        id={b.id}
        name={b.id}
        label={field.label ?? ''}
        labelledBy={`${b.id}-label`}
        options={field.options}
        value={typeof b.value === 'string' ? b.value : null}
        onChange={(next) => b.onChange(next)}
        disabled={b.readOnly}
      />
    </Field>
  );
}

export function DateFieldRenderer({ field, path }: { readonly field: Of<'date'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <DateTimePicker
        id={b.id}
        mode={field.appearance === 'dayAndTime' ? 'datetime' : 'date'}
        value={typeof b.value === 'string' ? b.value : null}
        onChange={(next) => {
          b.onChange(next);
          b.onBlur();
        }}
        disabled={b.readOnly}
        required={field.required}
        // Without it the trigger's aria-label falls back to the placeholder and replaces the Field label.
        ariaLabel={field.label ?? 'Date'}
        timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
    </Field>
  );
}

export function JsonFieldRenderer({ field, path }: { readonly field: Of<'json'>; readonly path: string }): ReactElement {
  const b = useStudioField(field, path);
  // The form holds the raw text while editing; buildPatch (Task 1.16) parses it on save.
  const text = typeof b.value === 'string' ? b.value : b.value === undefined || b.value === null ? '' : JSON.stringify(b.value, null, 2);
  return (
    <Field id={b.id} label={field.label ?? ''} description={field.description ?? undefined} error={b.error} optional={optionalFlag(field)}>
      <Textarea
        id={b.id}
        ref={b.ref}
        className="font-code text-mono"
        spellCheck={false}
        value={text}
        onChange={(e) => b.onChange(e.target.value)}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        invalid={Boolean(b.error)}
        describedBy={b.describedBy}
      />
    </Field>
  );
}
```

`apps/cms/src/studio/form/fields/GenericField.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import type { StudioField } from '@/studio/server/schema/types';

import {
  CheckboxFieldRenderer,
  DateFieldRenderer,
  EmailFieldRenderer,
  JsonFieldRenderer,
  NumberFieldRenderer,
  RadioFieldRenderer,
  SelectFieldRenderer,
  TextFieldRenderer,
  TextareaFieldRenderer,
} from './basic';
import { PendingField } from './PendingField';

// Phase in which each remaining type gets its renderer (docs/studio/03 §A).
const LATER: Partial<Record<StudioField['type'], number>> = {
  group: 2,
  collapsible: 2,
  row: 2,
  tabs: 2,
  array: 2,
  blocks: 2,
  relationship: 2,
  upload: 2,
  join: 2,
  code: 2,
  point: 2,
  richText: 3,
};

export function GenericField({ field, path }: { readonly field: StudioField; readonly path: string }): ReactElement | null {
  switch (field.type) {
    case 'text':
      return field.hasMany ? <PendingField label={field.label ?? path} phase={2} /> : <TextFieldRenderer field={field} path={path} />;
    case 'textarea':
      return <TextareaFieldRenderer field={field} path={path} />;
    case 'number':
      return field.hasMany ? <PendingField label={field.label ?? path} phase={2} /> : <NumberFieldRenderer field={field} path={path} />;
    case 'email':
      return <EmailFieldRenderer field={field} path={path} />;
    case 'checkbox':
      return <CheckboxFieldRenderer field={field} path={path} />;
    case 'select':
      return <SelectFieldRenderer field={field} path={path} />;
    case 'radio':
      return <RadioFieldRenderer field={field} path={path} />;
    case 'date':
      return field.appearance === 'dayOnly' || field.appearance === 'dayAndTime' ? (
        <DateFieldRenderer field={field} path={path} />
      ) : (
        <PendingField label={field.label ?? path} phase={2} />
      );
    case 'json':
      return <JsonFieldRenderer field={field} path={path} />;
    case 'ui':
      // A ui field with no component (or a generic one) has nothing to render.
      return null;
    default:
      return <PendingField label={field.label ?? path} phase={LATER[field.type] ?? 2} />;
  }
}
```

- [ ] **Step 2: Write the rendering test**

`apps/cms/src/studio/form/fields/basic.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';

import type { StudioEntitySchema, StudioField } from '@/studio/server/schema/types';

import { StudioFormContext } from '../engine/StudioFormContext';
import { RenderFields } from '../RenderFields';

const base = { description: null, readOnly: false, hidden: false, position: 'main', width: null, condition: null, validator: null, component: null, cell: null, rowLabel: null, defaultValue: null } as const;

const fields: StudioField[] = [
  { ...base, name: 'from', label: 'From', type: 'text', required: true, hasMany: false, minLength: null, maxLength: null },
  { ...base, name: 'status', label: 'Status', type: 'select', required: true, hasMany: false, options: [{ value: '301', label: '301 permanent' }, { value: '410', label: '410 gone' }] },
  { ...base, name: 'notes', label: 'Notes', type: 'textarea', required: false, minLength: null, maxLength: null },
  { ...base, name: 'hitCount', label: 'Hits', type: 'number', required: false, hasMany: false, min: null, max: null, readOnly: true },
  { ...base, name: 'secret', label: 'Secret', type: 'text', required: false, hasMany: false, minLength: null, maxLength: null, hidden: true },
  { ...base, name: 'body', label: 'Body', type: 'richText', required: false, editor: 'default' },
];

const schema = { kind: 'collection', slug: 'redirects', fields } as unknown as StudioEntitySchema;

function Harness(): ReactElement {
  const methods = useForm({ defaultValues: { from: '/old', status: '301', notes: '', hitCount: 4, secret: 'kept' } });
  return (
    <StudioFormContext.Provider value={{ schema, fieldPermissions: undefined, readOnly: false, operation: 'update', user: { id: 1, roles: ['admin'] }, classicHref: '/admin/collections/redirects/1' }}>
      <FormProvider {...methods}>
        <RenderFields fields={fields} basePath="" />
      </FormProvider>
    </StudioFormContext.Provider>
  );
}

describe('RenderFields', () => {
  const html = renderToStaticMarkup(<Harness />);

  it('renders labelled controls with their values', () => {
    expect(html).toContain('for="field-from"');
    expect(html).toContain('value="/old"');
    expect(html).toContain('301 permanent');
  });

  it('marks optional fields and renders read-only fields as read-only', () => {
    expect(html).toContain('Optional');
    expect(html).toMatch(/id="field-hitCount"[^>]*readOnly|readOnly[^>]*id="field-hitCount"/i);
  });

  it('never renders hidden fields', () => {
    expect(html).not.toContain('field-secret');
  });

  it('shows later-phase types as pending with a link to the classic admin', () => {
    expect(html).toContain('not editable in Studio yet (phase 3)');
    expect(html).toContain('/admin/collections/redirects/1');
  });
});
```

- [ ] **Step 3: Run tests, typecheck, boundaries**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/form && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms verify:studio-boundaries`
Expected: PASS (engine 8, registry 5, renderers 4), exit 0, boundary check passed. Then make the Task 1.12 commit followed by:

```bash
git add apps/cms/src/studio/form/fields
git commit -m "feat(studio): T1.13 Phase 1 field renderers"
```

### Task 1.14: Slug field

Port of `SlugField.tsx` (319 lines) and the slug part of `SlugRequirementGuard`. Behaviour to keep (`docs/studio/research/admin-components.md`, `workflows-and-roles.md` §3.3): mirrors the source field until edited by hand; normalised with `@cleanstart/ui` `slugify`; live collision check; maximum 120 characters with a hint at 80; publish is disabled while the slug is empty, being checked, colliding or invalid.

**Files:**
- Create: `apps/cms/src/studio/server/actions/slug.ts`
- Create: `apps/cms/src/studio/features/publishing/slug-state.ts`
- Test: `apps/cms/src/studio/features/publishing/slug-state.test.ts`
- Create: `apps/cms/src/studio/features/publishing/SlugField.tsx`
- Modify: `apps/cms/src/studio/form/registry-manifest.ts` and `registry.tsx` (register SlugField)
- Modify: `apps/cms/src/studio/form/registry.test.ts` (tighten the SlugField assertion to `'custom'`)

- [ ] **Step 1: Write the failing test for slug state**

`apps/cms/src/studio/features/publishing/slug-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { SLUG_HINT_LENGTH, SLUG_MAX_LENGTH, slugProblem } from './slug-state';

describe('slugProblem', () => {
  it('requires a slug', () => {
    expect(slugProblem('')).toBe('Add a slug before publishing.');
  });

  it('rejects spaces and characters slugify would change', () => {
    expect(slugProblem('zero cve')).toBe('Use lowercase letters, numbers and hyphens only.');
    expect(slugProblem('Zero-CVE')).toBe('Use lowercase letters, numbers and hyphens only.');
  });

  it('enforces the length limit', () => {
    expect(slugProblem('a'.repeat(SLUG_MAX_LENGTH + 1))).toBe(`Use ${SLUG_MAX_LENGTH} characters or fewer.`);
  });

  it('accepts a clean slug', () => {
    expect(slugProblem('zero-cve-container-images')).toBeNull();
  });

  it('hints at 80 characters', () => {
    expect(SLUG_HINT_LENGTH).toBe(80);
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/features/publishing/slug-state.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement the pure state**

`apps/cms/src/studio/features/publishing/slug-state.ts`:

```ts
import { slugify } from '@cleanstart/ui';

// fields/slug.ts:21-34
export const SLUG_MAX_LENGTH = 120;
export const SLUG_HINT_LENGTH = 80;

export type SlugStatus = 'empty' | 'checking' | 'available' | 'taken' | 'invalid';

export const slugProblem = (slug: string): string | null => {
  if (slug.length === 0) return 'Add a slug before publishing.';
  if (slug.length > SLUG_MAX_LENGTH) return `Use ${SLUG_MAX_LENGTH} characters or fewer.`;
  if (slugify(slug) !== slug) return 'Use lowercase letters, numbers and hyphens only.';
  return null;
};
```

Run the test. Expected: PASS (5 tests). If `slugify` keeps capitals or other characters differently from the server's `beforeValidate` slugify (`fields/slug.ts:136-148`), use the same function the server uses instead (import from `@/payload/lib/slugify` if that is what the field hook calls) and adjust the test.

- [ ] **Step 3: Collision check action**

`apps/cms/src/studio/server/actions/slug.ts`:

```ts
'use server';

import type { CollectionSlug } from 'payload';
import { z } from 'zod';

import { studioApi } from '../payload';
import { collectionCan } from '../permissions';
import { getSession } from '../session';

const Input = z.object({
  collection: z.string().min(1).max(64),
  slug: z.string().min(1).max(200),
  id: z.union([z.string(), z.number()]).nullable(),
});

export type SlugCheck = { readonly available: boolean; readonly takenBy: string | null };

// Mirrors the server's collision rule (fields/slug.ts:98-135). Pages are unique
// per (slug, parent), so they skip this check until Phase 4 adds the parent.
export async function checkSlug(input: unknown): Promise<SlugCheck> {
  const { collection, slug, id } = Input.parse(input);
  const session = await getSession();
  if (!session || !collectionCan(session.permissions, collection, 'read') || collection === 'pages') {
    return { available: true, takenBy: null };
  }
  const api = await studioApi(session);
  const where = id === null ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { id: { not_equals: id } }] };
  const { docs } = await api.find({ collection: collection as never, where, limit: 1, depth: 0, draft: true });
  const hit = docs[0] as Record<string, unknown> | undefined;
  if (!hit) return { available: true, takenBy: null };
  const config = session.payload.collections[collection as CollectionSlug]?.config;
  const titleKey = typeof config?.admin?.useAsTitle === 'string' ? config.admin.useAsTitle : 'id';
  return { available: false, takenBy: String(hit[titleKey] ?? hit.id) };
}
```

- [ ] **Step 4: The field**

`apps/cms/src/studio/features/publishing/SlugField.tsx`:

```tsx
'use client';

import { slugify } from '@cleanstart/ui';
import { ArrowClockwise } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ReactElement } from 'react';

import type { StudioFieldProps } from '@/studio/form/engine/types';
import { useStudioForm } from '@/studio/form/engine/StudioFormContext';
import { useStudioField } from '@/studio/form/engine/useStudioField';
import { checkSlug } from '@/studio/server/actions/slug';
import { Field, IconButton, TextInput } from '@/studio/ui';

import { SLUG_HINT_LENGTH, SLUG_MAX_LENGTH, type SlugStatus, slugProblem } from './slug-state';

export function SlugField({ field, path }: StudioFieldProps): ReactElement {
  const b = useStudioField(field, path);
  const { schema, operation } = useStudioForm();
  const { control, getValues } = useFormContext();
  const source = schema.useAsTitle ?? 'title';
  const sourceValue = useWatch({ control, name: source }) as unknown;
  const [touched, setTouched] = useState(operation === 'update' && typeof b.value === 'string' && b.value.length > 0);
  const [status, setStatus] = useState<SlugStatus>('empty');
  const [takenBy, setTakenBy] = useState<string | null>(null);
  const request = useRef(0);
  const slug = typeof b.value === 'string' ? b.value : '';

  useEffect(() => {
    if (touched || typeof sourceValue !== 'string') return;
    const next = slugify(sourceValue).slice(0, SLUG_MAX_LENGTH);
    if (next !== slug) b.onChange(next);
  }, [sourceValue, touched, slug, b]);

  useEffect(() => {
    const problem = slugProblem(slug);
    if (problem) {
      setStatus(slug.length === 0 ? 'empty' : 'invalid');
      return;
    }
    setStatus('checking');
    const ticket = ++request.current;
    const timer = window.setTimeout(async () => {
      const result = await checkSlug({ collection: schema.slug, slug, id: (getValues('id') as string | number | undefined) ?? null });
      if (ticket !== request.current) return;
      setStatus(result.available ? 'available' : 'taken');
      setTakenBy(result.takenBy);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [slug, schema.slug, getValues]);

  const message =
    status === 'taken'
      ? `Slug is already used by ‘${takenBy ?? 'another document'}’. Choose a different slug.`
      : status === 'invalid'
        ? (slugProblem(slug) ?? undefined)
        : b.error;

  return (
    <Field id={b.id} label={field.label ?? 'Slug'} description={field.description ?? undefined} error={message}>
      <TextInput
        id={b.id}
        ref={b.ref}
        className="font-code"
        value={slug}
        maxLength={SLUG_MAX_LENGTH}
        readOnly={b.readOnly}
        invalid={Boolean(message)}
        describedBy={b.describedBy}
        data-slug-status={status}
        onChange={(e) => {
          setTouched(true);
          b.onChange(e.target.value);
        }}
        onBlur={() => {
          b.onChange(slugify(slug));
          b.onBlur();
        }}
        suffix={
          b.readOnly ? undefined : (
            <IconButton
              size="sm"
              label="Generate from title"
              icon={<ArrowClockwise size={12} aria-hidden="true" />}
              onClick={() => {
                setTouched(false);
                const title = getValues(source);
                if (typeof title === 'string') b.onChange(slugify(title).slice(0, SLUG_MAX_LENGTH));
              }}
            />
          )
        }
      />
      <p className="text-small text-fg-subtle" aria-live="polite">
        {status === 'checking' ? 'Checking…' : status === 'available' ? 'Available' : null}
        {slug.length > SLUG_HINT_LENGTH ? ` · Long slugs are harder to share (${slug.length} of ${SLUG_MAX_LENGTH})` : null}
      </p>
    </Field>
  );
}
```

`data-slug-status` is read by `PublishControl` (Task 1.16) to disable publish with a reason; the form engine's validation keeps blocking empty slugs on publish through the field's `required`.

Register it: in `registry-manifest.ts` change the SlugField entry to `custom('Slug')`; in `registry.tsx` import `SlugField` and add `'@/payload/admin/components/SlugField.tsx#SlugField': SlugField` to `FIELD_COMPONENTS`. Tighten `registry.test.ts` "knows SlugField" to `.toBe('custom')`.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms verify:studio-coverage`
Expected: all PASS; the coverage report no longer lists SlugField as pending.

```bash
git add apps/cms/src/studio/server/actions/slug.ts apps/cms/src/studio/features/publishing apps/cms/src/studio/form/registry-manifest.ts apps/cms/src/studio/form/registry.tsx apps/cms/src/studio/form/registry.test.ts
git commit -m "feat(studio): T1.14 slug field"
```

### Task 1.15: Collection list (S-10, base)

Phase 1 scope: server-rendered table, search, sort, pagination, page size, column visibility, the standard cells, "New" button, empty and no-results states. Filters, saved views, bulk actions, column resizing, export and J/K row navigation are Phase 5.

**Files:**
- Create: `apps/cms/src/studio/lib/format-date.ts`
- Test: `apps/cms/src/studio/lib/format-date.test.ts`
- Create: `apps/cms/src/studio/server/loaders/list.ts`
- Test: `apps/cms/src/studio/server/loaders/list.test.ts`
- Create: `apps/cms/src/studio/server/loaders/related-titles.ts`
- Modify: `apps/cms/src/studio/server/actions/preferences.ts` (columns)
- Modify: `apps/cms/src/studio/server/loaders/shell.ts` (export `readPreferences`, add `columns`)
- Create: `apps/cms/src/studio/list/Cell.tsx`, `DataTable.tsx`, `ListToolbar.tsx`, `Pagination.tsx`, `ListView.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/page.tsx`

- [ ] **Step 1: Write the failing date-format test**

`apps/cms/src/studio/lib/format-date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { formatListDate } from './format-date';

const NOW = new Date('2026-10-16T12:00:00Z');

describe('formatListDate', () => {
  it('is relative within 7 days', () => {
    expect(formatListDate('2026-10-16T11:58:00Z', NOW, 'UTC')).toBe('2 min ago');
    expect(formatListDate('2026-10-16T09:00:00Z', NOW, 'UTC')).toBe('3 hr ago');
    expect(formatListDate('2026-10-15T12:00:00Z', NOW, 'UTC')).toBe('Yesterday');
    expect(formatListDate('2026-10-12T12:00:00Z', NOW, 'UTC')).toBe('4 days ago');
  });

  it('is absolute after 7 days, in the given timezone', () => {
    expect(formatListDate('2026-09-01T23:30:00Z', NOW, 'Asia/Kolkata')).toBe('Sep 2, 2026');
  });

  it('handles empty and invalid values', () => {
    expect(formatListDate(null, NOW, 'UTC')).toBe('');
    expect(formatListDate('not a date', NOW, 'UTC')).toBe('');
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/lib/format-date.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement it**

`apps/cms/src/studio/lib/format-date.ts`:

```ts
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatListDate = (iso: string | null | undefined, now: Date, timeZone: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < 7 * DAY) {
    if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))} min ago`;
    if (diff < DAY) return `${Math.round(diff / HOUR)} hr ago`;
    const days = Math.round(diff / DAY);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });
};

export const formatFullTimestamp = (iso: string, timeZone: string): string =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone });
```

Run the test. Expected: PASS (3 tests).

- [ ] **Step 3: Write the failing list-query test**

`apps/cms/src/studio/server/loaders/list.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { StudioEntitySchema, StudioField } from '../schema/types';
import { availableColumns, buildSearchWhere, parseListQuery, resolveColumns } from './list';

const base = { description: null, readOnly: false, hidden: false, position: 'main', width: null, condition: null, validator: null, component: null, cell: null, rowLabel: null, defaultValue: null, required: false } as const;

const fields: StudioField[] = [
  { ...base, name: 'from', label: 'From', type: 'text', hasMany: false, minLength: null, maxLength: null },
  { ...base, name: 'status', label: 'Status', type: 'select', hasMany: false, options: [{ value: '301', label: '301' }] },
  { ...base, name: 'notes', label: 'Notes', type: 'textarea', minLength: null, maxLength: null },
  { ...base, name: 'staleness', label: 'Staleness', type: 'ui' },
  { ...base, name: 'seo', label: 'SEO', type: 'group', fields: [] },
];

const schema = {
  kind: 'collection',
  slug: 'redirects',
  label: { singular: 'Redirect', plural: 'Redirects' },
  useAsTitle: 'from',
  defaultColumns: ['from', 'status', 'updatedAt'],
  searchFields: [],
  drafts: false,
  schedulePublish: false,
  upload: false,
  auth: false,
  timestamps: true,
  defaultSort: null,
  pagination: { defaultLimit: 10, limits: [10, 25, 50, 100] },
  fields,
} satisfies StudioEntitySchema;

describe('parseListQuery', () => {
  it('reads page, limit, sort and search from the URL', () => {
    expect(parseListQuery({ page: '2', limit: '25', sort: '-from', q: 'old' }, schema)).toEqual({ page: 2, limit: 25, sort: '-from', q: 'old' });
  });

  it('falls back to safe defaults for bad input', () => {
    expect(parseListQuery({ page: '-3', limit: '9999', sort: 'password', q: '' }, schema)).toEqual({ page: 1, limit: 10, sort: null, q: '' });
  });
});

describe('columns', () => {
  it('uses saved columns, then defaultColumns, and drops unknown keys', () => {
    expect(resolveColumns(schema, ['notes', 'ghost']).map((c) => c.key)).toEqual(['from', 'notes']);
    expect(resolveColumns(schema, undefined).map((c) => c.key)).toEqual(['from', 'status', 'updatedAt']);
  });

  it('always keeps the title column first', () => {
    expect(resolveColumns(schema, ['status']).map((c) => c.key)).toEqual(['from', 'status']);
  });

  it('offers only top-level data fields and system columns', () => {
    expect(availableColumns(schema).map((c) => c.key)).toEqual(['from', 'status', 'notes', 'id', 'createdAt', 'updatedAt']);
  });
});

describe('buildSearchWhere', () => {
  it('searches the title field when no search fields are configured', () => {
    expect(buildSearchWhere(schema, 'old')).toEqual({ or: [{ from: { like: 'old' } }] });
    expect(buildSearchWhere(schema, '')).toBeUndefined();
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/server/loaders/list.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement the list loader**

`apps/cms/src/studio/server/loaders/list.ts`:

```ts
import type { Where } from 'payload';
import { z } from 'zod';

import type { StudioEntitySchema, StudioField } from '../schema/types';

export type ListQuery = { readonly page: number; readonly limit: number; readonly sort: string | null; readonly q: string };

export type ListColumn = {
  readonly key: string;
  readonly label: string;
  readonly field: StudioField | null;
  readonly align: 'left' | 'right';
  readonly sortable: boolean;
};

const SYSTEM: ReadonlyArray<{ key: string; label: string; align: 'left' | 'right' }> = [
  { key: 'id', label: 'ID', align: 'right' },
  { key: 'createdAt', label: 'Created', align: 'right' },
  { key: 'updatedAt', label: 'Updated', align: 'right' },
];

const LISTABLE = new Set<StudioField['type']>(['text', 'textarea', 'email', 'number', 'checkbox', 'select', 'radio', 'date', 'relationship', 'upload', 'json']);

export const availableColumns = (schema: StudioEntitySchema): ListColumn[] => {
  const fieldColumns = schema.fields
    .filter((f) => f.name !== null && !f.hidden && LISTABLE.has(f.type))
    .map((f) => ({
      key: f.name as string,
      label: f.label ?? (f.name as string),
      field: f,
      align: f.type === 'number' || f.type === 'date' ? ('right' as const) : ('left' as const),
      sortable: !('hasMany' in f && f.hasMany) && f.type !== 'json',
    }));
  const status = schema.drafts ? [{ key: '_status', label: 'Status', field: null, align: 'left' as const, sortable: true }] : [];
  const system = SYSTEM.filter((s) => s.key !== 'createdAt' || schema.timestamps).map((s) => ({ ...s, field: null, sortable: true }));
  return [...fieldColumns, ...status, ...system];
};

export const resolveColumns = (schema: StudioEntitySchema, saved: readonly string[] | undefined): ListColumn[] => {
  const all = availableColumns(schema);
  const byKey = new Map(all.map((c) => [c.key, c]));
  const title = schema.useAsTitle && byKey.has(schema.useAsTitle) ? schema.useAsTitle : null;
  const wanted = saved && saved.length > 0 ? saved : schema.defaultColumns.length > 0 ? schema.defaultColumns : [title ?? 'id', 'updatedAt'];
  const keys = [...(title ? [title] : []), ...wanted.filter((k) => k !== title)];
  return keys.flatMap((k) => byKey.get(k) ?? []);
};

export const parseListQuery = (raw: Record<string, string | string[] | undefined>, schema: StudioEntitySchema): ListQuery => {
  const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);
  const sortable = new Set(availableColumns(schema).filter((c) => c.sortable).map((c) => c.key));
  const page = z.coerce.number().int().min(1).catch(1).parse(one(raw.page) ?? 1);
  const limitRaw = z.coerce.number().int().catch(schema.pagination.defaultLimit).parse(one(raw.limit) ?? schema.pagination.defaultLimit);
  const limit = schema.pagination.limits.includes(limitRaw) ? limitRaw : schema.pagination.defaultLimit;
  const sortRaw = one(raw.sort) ?? '';
  const sort = sortable.has(sortRaw.replace(/^-/, '')) ? sortRaw : null;
  const q = (one(raw.q) ?? '').slice(0, 200);
  return { page, limit, sort, q };
};

export const buildSearchWhere = (schema: StudioEntitySchema, q: string): Where | undefined => {
  const term = q.trim();
  if (!term) return undefined;
  const fields = schema.searchFields.length > 0 ? schema.searchFields : schema.useAsTitle && schema.useAsTitle !== 'id' ? [schema.useAsTitle] : [];
  if (fields.length === 0) return /^\d+$/.test(term) ? { id: { equals: Number(term) } } : undefined;
  return { or: fields.map((f) => ({ [f]: { like: term } })) };
};
```

Run the test. Expected: PASS (6 tests).

- [ ] **Step 5: Related titles (one query per related collection)**

`apps/cms/src/studio/server/loaders/related-titles.ts`:

```ts
import 'server-only';

import type { CollectionSlug } from 'payload';

import type { StudioApi } from '../payload';
import type { ListColumn } from './list';

export type RelatedTitles = Readonly<Record<string, Readonly<Record<string, string>>>>;

type Ref = { readonly relationTo: string; readonly id: string };

const refsFrom = (value: unknown, relationTo: readonly string[]): Ref[] => {
  const one = (v: unknown): Ref[] => {
    if (v === null || v === undefined) return [];
    if (typeof v === 'object' && 'relationTo' in v && 'value' in v) {
      const poly = v as { relationTo: string; value: unknown };
      return [{ relationTo: poly.relationTo, id: String(typeof poly.value === 'object' && poly.value !== null ? (poly.value as { id: unknown }).id : poly.value) }];
    }
    if (typeof v === 'object' && 'id' in v) return [{ relationTo: relationTo[0] ?? '', id: String((v as { id: unknown }).id) }];
    return [{ relationTo: relationTo[0] ?? '', id: String(v) }];
  };
  return Array.isArray(value) ? value.flatMap(one) : one(value);
};

// Port of admin/lib/related-docs.ts: batched, de-duplicated, run as the user,
// so a title the user cannot read is simply missing (the cell shows the id).
export const resolveRelatedTitles = async (
  api: StudioApi,
  rows: readonly Record<string, unknown>[],
  columns: readonly ListColumn[],
): Promise<RelatedTitles> => {
  const wanted = new Map<string, Set<string>>();
  for (const column of columns) {
    const field = column.field;
    if (!field || (field.type !== 'relationship' && field.type !== 'upload')) continue;
    for (const row of rows) {
      for (const ref of refsFrom(row[column.key], field.relationTo)) {
        if (!ref.relationTo) continue;
        const set = wanted.get(ref.relationTo) ?? new Set<string>();
        set.add(ref.id);
        wanted.set(ref.relationTo, set);
      }
    }
  }
  const entries = await Promise.all(
    [...wanted.entries()].map(async ([slug, ids]) => {
      const config = api.payload.collections[slug as CollectionSlug]?.config;
      const titleKey = typeof config?.admin?.useAsTitle === 'string' ? config.admin.useAsTitle : 'id';
      const { docs } = await api.find({
        collection: slug as never,
        where: { id: { in: [...ids] } },
        limit: ids.size,
        depth: 0,
        pagination: false,
        select: { [titleKey]: true } as never,
      });
      const map: Record<string, string> = {};
      // studioApi's find is not typed per slug here, so read the docs as plain records.
      for (const doc of docs as unknown as Record<string, unknown>[]) map[String(doc.id)] = String(doc[titleKey] ?? doc.id);
      return [slug, map] as const;
    }),
  );
  return Object.fromEntries(entries);
};
```

- [ ] **Step 6: Store column choices in preferences**

In `apps/cms/src/studio/server/actions/preferences.ts`, extend the schema and merge per collection:

```ts
const PreferencesPatch = z
  .object({
    navGroupsClosed: z.array(z.string().max(64)).max(32).optional(),
    sidebarCollapsed: z.boolean().optional(),
    columns: z.record(z.string().max(64), z.array(z.string().max(64)).max(40)).optional(),
    railWidth: z.number().int().min(280).max(440).optional(),
    railCollapsed: z.boolean().optional(),
  })
  .strict();
```

and in the action body:

```ts
    const previous = (current.studio as Record<string, unknown> | undefined) ?? {};
    const columns = patch.columns ? { ...((previous.columns as Record<string, unknown> | undefined) ?? {}), ...patch.columns } : previous.columns;
    const studio = { ...previous, ...patch, ...(columns ? { columns } : {}) };
```

In `apps/cms/src/studio/server/loaders/shell.ts`, `export` `readPreferences` and extend `StudioPreferences` and the reader:

```ts
export type StudioPreferences = {
  readonly navGroupsClosed?: readonly string[] | undefined;
  readonly sidebarCollapsed?: boolean | undefined;
  readonly columns?: Readonly<Record<string, readonly string[]>> | undefined;
  readonly railWidth?: number | undefined;
  readonly railCollapsed?: boolean | undefined;
};
```

```ts
    columns:
      s.columns && typeof s.columns === 'object'
        ? Object.fromEntries(
            Object.entries(s.columns as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []]),
          )
        : undefined,
    railWidth: typeof s.railWidth === 'number' ? s.railWidth : undefined,
    railCollapsed: typeof s.railCollapsed === 'boolean' ? s.railCollapsed : undefined,
```

- [ ] **Step 7: Cells, table, toolbar, pagination, view**

`apps/cms/src/studio/list/Cell.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import { formatFullTimestamp, formatListDate } from '@/studio/lib/format-date';
import { resolveCell } from '@/studio/form/registry-manifest';
import type { RelatedTitles } from '@/studio/server/loaders/related-titles';
import type { ListColumn } from '@/studio/server/loaders/list';
import { Badge, StatusBadge } from '@/studio/ui';

const tz = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

function DateValue({ iso }: { readonly iso: string }): ReactElement {
  // Formatted in the browser's timezone; the server render may differ by a few
  // minutes or a timezone, which React tolerates on this one text node.
  return (
    <time dateTime={iso} title={formatFullTimestamp(iso, tz())} suppressHydrationWarning className="tabular">
      {formatListDate(iso, new Date(), tz())}
    </time>
  );
}

const titleOf = (titles: RelatedTitles, relationTo: string, value: unknown): string => {
  const id = typeof value === 'object' && value !== null && 'id' in value ? String((value as { id: unknown }).id) : String(value);
  return titles[relationTo]?.[id] ?? `#${id}`;
};

export function Cell({ column, row, titles }: { readonly column: ListColumn; readonly row: Record<string, unknown>; readonly titles: RelatedTitles }): ReactElement | null {
  const value = row[column.key];
  if (column.key === '_status') {
    return <StatusBadge status={value === 'published' ? 'published' : 'draft'} />;
  }
  if (column.key === 'createdAt' || column.key === 'updatedAt') return typeof value === 'string' ? <DateValue iso={value} /> : null;
  if (column.key === 'id') return <span className="tabular text-fg-muted">{String(value)}</span>;
  const field = column.field;
  if (!field) return null;
  const custom = resolveCell(field.cell);
  if (field.type === 'date' || (custom.kind === 'cell' && custom.id === 'date')) return typeof value === 'string' ? <DateValue iso={value} /> : null;
  if (field.type === 'checkbox' || (custom.kind === 'cell' && custom.id === 'boolean')) {
    return value === true ? <Badge tone="success">Yes</Badge> : <Badge>No</Badge>;
  }
  if (field.type === 'select' || field.type === 'radio') {
    const values = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
    const label = values.map((v) => field.options.find((o) => o.value === v)?.label ?? String(v)).join(', ');
    return <span className="truncate">{label}</span>;
  }
  if (field.type === 'relationship' || field.type === 'upload') {
    const list = (Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]) as unknown[];
    if (list.length === 0) return null;
    const names = list.map((v) => {
      if (typeof v === 'object' && v !== null && 'relationTo' in v) {
        const poly = v as { relationTo: string; value: unknown };
        return titleOf(titles, poly.relationTo, poly.value);
      }
      return titleOf(titles, field.relationTo[0] ?? '', v);
    });
    return (
      <span className="truncate" title={names.join(', ')}>
        {names[0]}
        {names.length > 1 ? <span className="text-fg-subtle"> +{names.length - 1}</span> : null}
      </span>
    );
  }
  if (field.type === 'number') return value === null || value === undefined ? null : <span className="tabular">{Number(value).toLocaleString('en-US')}</span>;
  if (field.type === 'json') return value === null || value === undefined ? null : <code className="truncate text-mono text-fg-muted">{JSON.stringify(value)}</code>;
  return <span className="truncate">{value === null || value === undefined ? '' : String(value)}</span>;
}
```

`Cell` is a client component only because `DateValue` formats in the browser timezone. The custom cells that need data (lead contact, lead sync, source page, media, bytes) render as plain text until their phase (`03` §B).

`apps/cms/src/studio/list/DataTable.tsx`:

```tsx
import { ArrowDown, ArrowUp } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { cn } from '@/studio/lib/cn';
import type { ListColumn, ListQuery } from '@/studio/server/loaders/list';
import type { RelatedTitles } from '@/studio/server/loaders/related-titles';

import { Cell } from './Cell';

const sortHref = (base: string, query: ListQuery, key: string): string => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.limit) params.set('limit', String(query.limit));
  params.set('sort', query.sort === key ? `-${key}` : key);
  return `${base}?${params.toString()}`;
};

export function DataTable({
  basePath,
  columns,
  rows,
  titles,
  query,
}: {
  readonly basePath: string;
  readonly columns: readonly ListColumn[];
  readonly rows: readonly Record<string, unknown>[];
  readonly titles: RelatedTitles;
  readonly query: ListQuery;
}): ReactElement {
  return (
    <table className="w-full table-fixed border-collapse text-body">
      <thead className="sticky top-0 z-(--z-sticky) bg-raised">
        <tr className="h-8 text-left text-micro text-fg-muted">
          {columns.map((column, index) => {
            const active = query.sort?.replace(/^-/, '') === column.key;
            const descending = query.sort?.startsWith('-') ?? false;
            return (
              <th
                key={column.key}
                scope="col"
                aria-sort={active ? (descending ? 'descending' : 'ascending') : undefined}
                className={cn('px-3 font-medium', index === 0 ? 'w-auto pl-6' : 'w-40', column.align === 'right' && 'text-right')}
              >
                {column.sortable ? (
                  <Link href={sortHref(basePath, query, column.key)} className={cn('inline-flex items-center gap-1 hover:text-fg', column.align === 'right' && 'flex-row-reverse')}>
                    {column.label}
                    {active ? (descending ? <ArrowDown size={10} weight="light" aria-hidden="true" /> : <ArrowUp size={10} weight="light" aria-hidden="true" />) : null}
                  </Link>
                ) : (
                  column.label
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row.id)} className="h-10 border-t border-line-subtle hover:bg-hover">
            {columns.map((column, index) => (
              <td key={column.key} className={cn('truncate px-3', index === 0 ? 'pl-6 text-fg' : 'text-fg-muted', column.align === 'right' && 'text-right')}>
                {index === 0 ? (
                  <Link href={`${basePath}/${String(row.id)}`} className="block truncate hover:underline focus-visible:underline">
                    <Cell column={column} row={row} titles={titles} />
                  </Link>
                ) : (
                  <Cell column={column} row={row} titles={titles} />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`apps/cms/src/studio/list/Pagination.tsx`:

```tsx
import Link from 'next/link';
import type { ReactElement } from 'react';

import type { ListQuery } from '@/studio/server/loaders/list';
import { buttonClass } from '@/studio/ui';

const href = (base: string, query: ListQuery, page: number): string => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);
  params.set('limit', String(query.limit));
  params.set('page', String(page));
  return `${base}?${params.toString()}`;
};

export function Pagination({ basePath, query, totalDocs, totalPages }: { readonly basePath: string; readonly query: ListQuery; readonly totalDocs: number; readonly totalPages: number }): ReactElement {
  const from = totalDocs === 0 ? 0 : (query.page - 1) * query.limit + 1;
  const to = Math.min(query.page * query.limit, totalDocs);
  return (
    <footer className="flex items-center justify-between border-t border-line-subtle px-6 py-2 text-small text-fg-muted">
      <span className="tabular">
        {from.toLocaleString('en-US')} to {to.toLocaleString('en-US')} of {totalDocs.toLocaleString('en-US')}
      </span>
      <nav aria-label="Pagination" className="flex gap-1">
        {query.page > 1 ? (
          <Link href={href(basePath, query, query.page - 1)} className={buttonClass('ghost', 'sm')}>
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className={buttonClass('ghost', 'sm', 'opacity-50')}>Previous</span>
        )}
        {query.page < totalPages ? (
          <Link href={href(basePath, query, query.page + 1)} className={buttonClass('ghost', 'sm')}>
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={buttonClass('ghost', 'sm', 'opacity-50')}>Next</span>
        )}
      </nav>
    </footer>
  );
}
```

`apps/cms/src/studio/list/ListToolbar.tsx`:

```tsx
'use client';

import { Popover } from '@cleanstart/ui';
import { Columns, MagnifyingGlass } from '@phosphor-icons/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { ReactElement } from 'react';

import { updateStudioPreferences } from '@/studio/server/actions/preferences';
import type { ListColumn } from '@/studio/server/loaders/list';
import { Checkbox, IconButton, Kbd, TextInput } from '@/studio/ui';

export function ListToolbar({
  slug,
  pluralLabel,
  allColumns,
  activeKeys,
  titleKey,
}: {
  readonly slug: string;
  readonly pluralLabel: string;
  readonly allColumns: readonly ListColumn[];
  readonly activeKeys: readonly string[];
  readonly titleKey: string | null;
}): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const columnsRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (q === (params.get('q') ?? '')) return;
      const next = new URLSearchParams(params);
      if (q) next.set('q', q);
      else next.delete('q');
      next.delete('page');
      router.replace(`${pathname}?${next.toString()}`);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q, params, pathname, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, [contenteditable="true"]');
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleColumn = (key: string): void => {
    const next = activeKeys.includes(key) ? activeKeys.filter((k) => k !== key) : [...activeKeys, key];
    startTransition(async () => {
      await updateStudioPreferences({ columns: { [slug]: next } });
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 border-b border-line-subtle px-6 py-2">
      <div className="w-72">
        <TextInput
          ref={searchRef}
          aria-label={`Search ${pluralLabel.toLowerCase()}`}
          placeholder={`Search ${pluralLabel.toLowerCase()}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          prefix={<MagnifyingGlass size={14} aria-hidden="true" />}
          suffix={q ? undefined : <Kbd keys={['/']} />}
        />
      </div>
      <div className="flex-1" />
      <IconButton ref={columnsRef} label="Columns" icon={<Columns size={16} aria-hidden="true" />} onClick={() => setOpen((v) => !v)} />
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={columnsRef} placement="bottom-end" ariaLabel="Choose columns">
        <div className="flex w-56 flex-col gap-2 p-1">
          {allColumns.map((column) => (
            <Checkbox
              key={column.key}
              id={`col-${column.key}`}
              label={column.label}
              checked={activeKeys.includes(column.key)}
              disabled={column.key === titleKey}
              onChange={() => toggleColumn(column.key)}
            />
          ))}
        </div>
      </Popover>
    </div>
  );
}
```

`apps/cms/src/studio/list/ListView.tsx`:

```tsx
import { Plus } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import type { ReactElement } from 'react';

import type { ListColumn, ListQuery } from '@/studio/server/loaders/list';
import type { RelatedTitles } from '@/studio/server/loaders/related-titles';
import type { StudioEntitySchema } from '@/studio/server/schema/types';
import { EmptyState, PageHeader, buttonClass } from '@/studio/ui';

import { DataTable } from './DataTable';
import { ListToolbar } from './ListToolbar';
import { Pagination } from './Pagination';

export function ListView({
  schema,
  columns,
  allColumns,
  rows,
  titles,
  query,
  totalDocs,
  totalPages,
  canCreate,
}: {
  readonly schema: StudioEntitySchema;
  readonly columns: readonly ListColumn[];
  readonly allColumns: readonly ListColumn[];
  readonly rows: readonly Record<string, unknown>[];
  readonly titles: RelatedTitles;
  readonly query: ListQuery;
  readonly totalDocs: number;
  readonly totalPages: number;
  readonly canCreate: boolean;
}): ReactElement {
  const basePath = `/studio/collections/${schema.slug}`;
  const newButton = canCreate ? (
    <Link href={`${basePath}/new`} className={buttonClass('primary', 'md')}>
      <Plus size={14} weight="light" aria-hidden="true" />
      New {schema.label.singular.toLowerCase()}
    </Link>
  ) : null;
  return (
    <>
      <PageHeader title={schema.label.plural} count={totalDocs} actions={newButton} />
      <ListToolbar slug={schema.slug} pluralLabel={schema.label.plural} allColumns={allColumns} activeKeys={columns.map((c) => c.key)} titleKey={schema.useAsTitle} />
      {rows.length === 0 ? (
        query.q ? (
          <EmptyState title="No results" description={`Nothing matches “${query.q}”.`} action={<Link href={basePath} className={buttonClass('secondary', 'md')}>Clear search</Link>} />
        ) : (
          <EmptyState title={`No ${schema.label.plural.toLowerCase()} yet`} description={`${schema.label.plural} you create appear here.`} action={newButton ?? undefined} />
        )
      ) : (
        <>
          <DataTable basePath={basePath} columns={columns} rows={rows} titles={titles} query={query} />
          <Pagination basePath={basePath} query={query} totalDocs={totalDocs} totalPages={totalPages} />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 8: The route**

`apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';

import { ListView } from '@/studio/list/ListView';
import { availableColumns, buildSearchWhere, parseListQuery, resolveColumns } from '@/studio/server/loaders/list';
import { resolveRelatedTitles } from '@/studio/server/loaders/related-titles';
import { readPreferences } from '@/studio/server/loaders/shell';
import { studioApi } from '@/studio/server/payload';
import { collectionCan } from '@/studio/server/permissions';
import { isVisibleInStudio } from '@/studio/server/readiness';
import { buildCollectionSchema } from '@/studio/server/schema/build-schema';
import { requireSession } from '@/studio/server/session';

type Props = {
  readonly params: Promise<{ collection: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  return { title: collection };
}

export default async function CollectionList({ params, searchParams }: Props): Promise<ReactElement> {
  const { collection } = await params;
  const session = await requireSession(`/studio/collections/${collection}`);
  const known = session.payload.config.collections.some((c) => c.slug === collection && !c.slug.startsWith('payload-'));
  if (!known || !isVisibleInStudio(collection)) notFound();
  if (!collectionCan(session.permissions, collection, 'read')) redirect('/studio/forbidden');

  const schema = buildCollectionSchema(session.payload.config, collection);
  const query = parseListQuery(await searchParams, schema);
  const preferences = readPreferences(session.user.preferences);
  const columns = resolveColumns(schema, preferences.columns?.[collection]);
  const api = await studioApi(session);
  const where = buildSearchWhere(schema, query.q);
  const result = await api.find({
    collection: collection as never,
    // exactOptionalPropertyTypes: leave the key out rather than pass undefined.
    ...(where ? { where } : {}),
    page: query.page,
    limit: query.limit,
    sort: query.sort ?? schema.defaultSort ?? '-updatedAt',
    depth: 0,
    draft: schema.drafts,
  });
  const rows = result.docs as unknown as Record<string, unknown>[];
  const titles = await resolveRelatedTitles(api, rows, columns);

  return (
    <ListView
      schema={schema}
      columns={columns}
      allColumns={availableColumns(schema)}
      rows={rows}
      titles={titles}
      query={query}
      totalDocs={result.totalDocs}
      totalPages={result.totalPages}
      canCreate={collectionCan(session.permissions, collection, 'create')}
    />
  );
}
```

`generateMetadata` uses the slug only to avoid a second config walk; replace it with the plural label once `buildCollectionSchema` is wrapped in React `cache` (do that in this task if profiling shows the schema build above 5ms).

- [ ] **Step 9: Verify**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms verify:studio-boundaries`
Expected: PASS, exit 0.

In the browser pane at 1440×900 with `STUDIO_SHOW_UNREADY=true`: `/studio/collections/redirects` lists rows; sort by From toggles ascending and descending; search filters after typing (URL shows `?q=`); `/` focuses search; the Columns menu adds Notes and it survives reload; pagination shows "1 to 10 of N". Repeat in light theme. Screenshot both.

- [ ] **Step 10: Commit**

```bash
git add apps/cms/src/studio/lib/format-date.ts apps/cms/src/studio/lib/format-date.test.ts apps/cms/src/studio/server/loaders apps/cms/src/studio/server/actions/preferences.ts apps/cms/src/studio/list "apps/cms/src/app/(studio)/studio/(app)/collections"
git commit -m "feat(studio): T1.15 collection list"
```

### Task 1.16: Edit and create document (S-11, S-12 base)

Phase 1 scope: document header with status and save state, Save draft, Publish, Save (no-drafts collections), Delete, Copy ID, validation summary, server error mapping, the right rail (resizable, collapsible), keyboard save, unsaved-changes guard, create flow. Schedule, unpublish, preview, versions, locking, duplicate, discard and purge are Phase 4.

**Files:**
- Create: `apps/cms/src/studio/document/build-patch.ts`
- Test: `apps/cms/src/studio/document/build-patch.test.ts`
- Create: `apps/cms/src/studio/server/loaders/document.ts`
- Create: `apps/cms/src/studio/server/actions/document.ts`
- Create: `apps/cms/src/studio/document/slug-status.tsx`
- Modify: `apps/cms/src/studio/features/publishing/SlugField.tsx` (report status through context)
- Create: `apps/cms/src/studio/ui/Rail.tsx`
- Create: `apps/cms/src/studio/document/EditView.tsx`, `DocumentHeader.tsx`, `PublishControl.tsx`, `SaveStatus.tsx`, `ValidationSummary.tsx`, `TitleField.tsx`, `useUnsavedGuard.ts`
- Create: `apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/[id]/page.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/new/page.tsx`

- [ ] **Step 1: Write the failing tests for patch building**

`apps/cms/src/studio/document/build-patch.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { StudioField } from '@/studio/server/schema/types';

import { buildPatch, flattenErrors, initialValuesFor, labelForPath } from './build-patch';

const base = { description: null, readOnly: false, hidden: false, position: 'main', width: null, condition: null, validator: null, component: null, cell: null, rowLabel: null, required: false } as const;

const fields: StudioField[] = [
  { ...base, name: 'from', label: 'From', type: 'text', hasMany: false, minLength: null, maxLength: null, defaultValue: null },
  { ...base, name: 'status', label: 'Status', type: 'select', hasMany: false, options: [], defaultValue: '301' },
  { ...base, name: 'meta', label: 'Meta', type: 'json', defaultValue: null },
  {
    ...base,
    name: null,
    label: null,
    type: 'row',
    defaultValue: null,
    fields: [{ ...base, name: 'notes', label: 'Notes', type: 'textarea', minLength: null, maxLength: null, defaultValue: null }],
  },
  {
    ...base,
    name: 'seo',
    label: 'SEO',
    type: 'group',
    defaultValue: null,
    fields: [
      { ...base, name: 'title', label: 'SEO title', type: 'text', hasMany: false, minLength: null, maxLength: null, defaultValue: null },
      { ...base, name: 'indexable', label: 'Indexable', type: 'select', hasMany: false, options: [], defaultValue: 'index' },
    ],
  },
  { ...base, name: 'body', label: 'Body', type: 'richText', editor: 'default', defaultValue: null },
];

const values = {
  from: '/old',
  status: '301',
  meta: '{"a":1}',
  notes: 'n',
  seo: { title: 'New title', indexable: 'index' },
  body: { root: { type: 'root', children: [] } },
};

describe('buildPatch', () => {
  it('sends only top-level fields with a change, whole', () => {
    const dirty = { seo: { title: true } };
    expect(buildPatch(fields, values, dirty, false)).toEqual({ seo: { title: 'New title', indexable: 'index' } });
  });

  it('looks through presentational containers', () => {
    expect(buildPatch(fields, values, { notes: true }, false)).toEqual({ notes: 'n' });
  });

  it('parses JSON typed as text', () => {
    expect(buildPatch(fields, values, { meta: true }, false)).toEqual({ meta: { a: 1 } });
  });

  it('never sends a field the user did not touch, including ones Studio cannot render yet', () => {
    expect(buildPatch(fields, values, { from: true }, false)).toEqual({ from: '/old' });
  });

  it('sends every defined value on create', () => {
    expect(Object.keys(buildPatch(fields, values, {}, true)).sort()).toEqual(['body', 'from', 'meta', 'notes', 'seo', 'status']);
  });
});

describe('initialValuesFor', () => {
  it('collects static defaults, including inside groups and rows', () => {
    expect(initialValuesFor(fields)).toEqual({ status: '301', seo: { indexable: 'index' } });
  });
});

describe('errors', () => {
  it('flattens nested form errors into paths', () => {
    const errors = { from: { message: 'This field is required.' }, seo: { title: { message: 'Too long.' } } };
    expect(flattenErrors(errors)).toEqual([
      { path: 'from', message: 'This field is required.' },
      { path: 'seo.title', message: 'Too long.' },
    ]);
  });

  it('finds the label for a path', () => {
    expect(labelForPath(fields, 'seo.title')).toBe('SEO title');
    expect(labelForPath(fields, 'notes')).toBe('Notes');
    expect(labelForPath(fields, 'unknown.path')).toBe('unknown.path');
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio/document/build-patch.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement**

`apps/cms/src/studio/document/build-patch.ts`:

```ts
import type { StudioField } from '@/studio/server/schema/types';

type Values = Record<string, unknown>;

// Named data fields at one level, looking through row, collapsible and unnamed tabs.
export const dataFields = (fields: readonly StudioField[]): StudioField[] =>
  fields.flatMap((field) => {
    if (field.name !== null) return [field];
    if (field.type === 'row' || field.type === 'collapsible') return dataFields(field.fields);
    if (field.type === 'tabs') return field.tabs.flatMap((tab) => (tab.name === null ? dataFields(tab.fields) : []));
    return [];
  });

const namedTabs = (fields: readonly StudioField[]): StudioField[] =>
  fields.flatMap((field) =>
    field.type === 'tabs'
      ? field.tabs.filter((t) => t.name !== null).map((t) => ({ ...field, type: 'group' as const, name: t.name, label: t.label, fields: t.fields }))
      : field.type === 'row' || field.type === 'collapsible'
        ? namedTabs(field.fields)
        : [],
  );

const levelFields = (fields: readonly StudioField[]): StudioField[] => [...dataFields(fields), ...namedTabs(fields)];

const serializeObject = (fields: readonly StudioField[], obj: Values): Values => {
  const out: Values = { ...obj };
  for (const field of levelFields(fields)) {
    if (field.name !== null && field.name in out) out[field.name] = serializeValue(field, out[field.name]);
  }
  return out;
};

export const serializeValue = (field: StudioField, value: unknown): unknown => {
  switch (field.type) {
    case 'json':
      if (typeof value !== 'string') return value;
      return value.trim() === '' ? null : (JSON.parse(value) as unknown);
    case 'group':
      return value && typeof value === 'object' && !Array.isArray(value) ? serializeObject(field.fields, value as Values) : value;
    case 'array':
      return Array.isArray(value) ? value.map((row) => (row && typeof row === 'object' ? serializeObject(field.fields, row as Values) : row)) : value;
    case 'blocks':
      return Array.isArray(value)
        ? value.map((row) => {
            const block = field.blocks.find((b) => b.slug === (row as { blockType?: unknown })?.blockType);
            return block && row && typeof row === 'object' ? serializeObject(block.fields, row as Values) : row;
          })
        : value;
    default:
      return value;
  }
};

const anyDirty = (node: unknown): boolean => {
  if (node === true) return true;
  if (Array.isArray(node)) return node.some(anyDirty);
  if (node && typeof node === 'object') return Object.values(node).some(anyDirty);
  return false;
};

// Payload merges partial updates at the top level, so sending only the
// top-level keys that changed (each one whole) never touches anything else.
export const buildPatch = (fields: readonly StudioField[], values: Values, dirty: Record<string, unknown>, isCreate: boolean): Values => {
  const out: Values = {};
  for (const field of levelFields(fields)) {
    const key = field.name;
    if (key === null) continue;
    const include = isCreate ? values[key] !== undefined : anyDirty(dirty[key]);
    if (include) out[key] = serializeValue(field, values[key]);
  }
  return out;
};

export const initialValuesFor = (fields: readonly StudioField[]): Values => {
  const out: Values = {};
  for (const field of levelFields(fields)) {
    if (field.name === null) continue;
    if (field.type === 'group') {
      const nested = initialValuesFor(field.fields);
      if (Object.keys(nested).length > 0) out[field.name] = nested;
    } else if (field.defaultValue !== null && field.defaultValue !== undefined) {
      out[field.name] = field.defaultValue;
    }
  }
  return out;
};

export type Issue = { readonly path: string; readonly message: string };

export const flattenErrors = (errors: unknown, prefix = ''): Issue[] => {
  if (!errors || typeof errors !== 'object') return [];
  const node = errors as Record<string, unknown>;
  if (typeof node.message === 'string') return [{ path: prefix, message: node.message }];
  return Object.entries(node).flatMap(([key, child]) => (key === 'ref' || key === 'type' ? [] : flattenErrors(child, prefix ? `${prefix}.${key}` : key)));
};

export const labelForPath = (fields: readonly StudioField[], path: string): string => {
  let level = levelFields(fields);
  let label: string | null = null;
  for (const segment of path.split('.')) {
    if (/^\d+$/.test(segment)) continue;
    const field = level.find((f) => f.name === segment);
    if (!field) return path;
    label = field.label ?? segment;
    level = 'fields' in field ? levelFields(field.fields) : [];
  }
  return label ?? path;
};
```

Run the test. Expected: PASS (8 tests).

- [ ] **Step 3: Loader and status**

`apps/cms/src/studio/server/loaders/document.ts`:

```ts
import 'server-only';

import { type CollectionSlug, NotFound, docAccessOperation } from 'payload';

import type { DocumentStatus } from '@/studio/ui';

import { type StudioApi, studioApi } from '../payload';
import { buildCollectionSchema } from '../schema/build-schema';
import type { StudioEntitySchema } from '../schema/types';
import type { StudioSession } from '../session';

export type DocumentPermissions = { readonly read: boolean; readonly update: boolean; readonly delete: boolean; readonly create: boolean };

export type LoadedDocument = {
  readonly schema: StudioEntitySchema;
  readonly values: Record<string, unknown>;
  readonly status: DocumentStatus | null;
  readonly permissions: DocumentPermissions;
  readonly fieldPermissions: Record<string, unknown> | undefined;
};

// Draft-enabled documents: the main row holds the live version and the latest
// edit may be a newer draft (Payload versions model). "changed" = live and a
// newer draft exists.
export const documentStatus = async (
  api: StudioApi,
  schema: StudioEntitySchema,
  id: string | number,
  latestStatus: unknown,
): Promise<DocumentStatus | null> => {
  if (!schema.drafts) return null;
  const live = (await api.findByID({ collection: schema.slug as never, id, draft: false, depth: 0, select: { _status: true } as never })) as unknown as {
    _status?: unknown;
  };
  if (live._status !== 'published') return 'draft';
  return latestStatus === 'draft' ? 'changed' : 'published';
};

export const loadDocument = async (session: StudioSession, slug: string, id: string): Promise<LoadedDocument | null> => {
  const api = await studioApi(session);
  const schema = buildCollectionSchema(session.payload.config, slug);
  let doc: Record<string, unknown>;
  try {
    doc = (await api.findByID({ collection: slug as never, id, draft: schema.drafts, depth: 0 })) as unknown as Record<string, unknown>;
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
  const access = await docAccessOperation({ collection: session.payload.collections[slug as CollectionSlug], id, req: api.req });
  return {
    schema,
    values: doc,
    status: await documentStatus(api, schema, id, doc._status),
    permissions: { read: access.read === true, update: access.update === true, delete: access.delete === true, create: access.create === true },
    fieldPermissions: access.fields as Record<string, unknown> | undefined,
  };
};
```

- [ ] **Step 4: Server actions**

`apps/cms/src/studio/server/actions/document.ts`:

```ts
'use server';

import { z } from 'zod';

import type { DocumentStatus } from '@/studio/ui';

import type { ActionResult } from '../errors';
import { documentStatus } from '../loaders/document';
import { runAction, studioApi } from '../payload';
import { isVisibleInStudio } from '../readiness';
import { buildCollectionSchema } from '../schema/build-schema';
import { getSession } from '../session';

const Id = z.union([z.string().min(1).max(64), z.number().int().positive()]);

const SaveInput = z.object({
  collection: z.string().min(1).max(64),
  id: Id.nullable(),
  intent: z.enum(['draft', 'publish', 'save']),
  data: z.record(z.string(), z.unknown()),
});

export type SaveResult = { readonly id: string | number; readonly values: Record<string, unknown>; readonly status: DocumentStatus | null };

const denied = (message: string): ActionResult<never> => ({ ok: false, error: { kind: 'forbidden', message, issues: [] } });

const knownCollection = (slugs: readonly string[], slug: string): boolean => slugs.includes(slug) && !slug.startsWith('payload-') && isVisibleInStudio(slug);

export async function saveDocument(input: unknown): Promise<ActionResult<SaveResult>> {
  const parsed = SaveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: { kind: 'validation', message: 'The request was not valid.', issues: [] } };
  const session = await getSession();
  if (!session) return denied('Your session ended. Sign in again to save.');
  const { collection, id, intent, data } = parsed.data;
  if (!knownCollection(session.payload.config.collections.map((c) => c.slug), collection)) return denied('This collection is not available in Studio.');

  return runAction(async () => {
    const api = await studioApi(session);
    const schema = buildCollectionSchema(session.payload.config, collection);
    // Drafts: "Save draft" writes a draft version (draft: true, Payload skips
    // required checks); "Publish" writes the live version. Matches
    // CmsPublishButton.tsx:105-124 and Payload's own Save Draft.
    const draft = schema.drafts && intent === 'draft';
    const body = schema.drafts ? { ...data, _status: intent === 'publish' ? 'published' : 'draft' } : data;
    const doc = (
      id === null
        ? await api.create({ collection: collection as never, data: body as never, draft, depth: 0 })
        : await api.update({ collection: collection as never, id, data: body as never, draft, depth: 0 })
    ) as unknown as Record<string, unknown> & { id: string | number };
    return { id: doc.id, values: doc, status: await documentStatus(api, schema, doc.id, doc._status) };
  });
}

const DeleteInput = z.object({ collection: z.string().min(1).max(64), id: Id });

export async function deleteDocument(input: unknown): Promise<ActionResult<null>> {
  const parsed = DeleteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: { kind: 'validation', message: 'The request was not valid.', issues: [] } };
  const session = await getSession();
  if (!session) return denied('Your session ended. Sign in again.');
  const { collection, id } = parsed.data;
  if (!knownCollection(session.payload.config.collections.map((c) => c.slug), collection)) return denied('This collection is not available in Studio.');
  return runAction(async () => {
    const api = await studioApi(session);
    await api.delete({ collection: collection as never, id });
    return null;
  });
}
```

- [ ] **Step 5: Slug status context, and SlugField reporting through it**

`apps/cms/src/studio/document/slug-status.tsx`:

```tsx
'use client';

import { createContext, useContext } from 'react';

import type { SlugStatus } from '@/studio/features/publishing/slug-state';

type SlugStatusContextValue = { readonly status: SlugStatus | null; readonly report: (status: SlugStatus) => void };

export const SlugStatusContext = createContext<SlugStatusContextValue>({ status: null, report: () => undefined });

export const useSlugStatus = (): SlugStatusContextValue => useContext(SlugStatusContext);
```

In `apps/cms/src/studio/features/publishing/SlugField.tsx`: import `useSlugStatus` and add, after the `status` state:

```tsx
  const { report } = useSlugStatus();
  useEffect(() => {
    report(status);
  }, [status, report]);
```

and delete the `data-slug-status={status}` prop.

- [ ] **Step 6: Rail**

`apps/cms/src/studio/ui/Rail.tsx`:

```tsx
'use client';

import { useRef, useState, useTransition } from 'react';
import type { KeyboardEvent, PointerEvent, ReactElement, ReactNode } from 'react';

import { updateStudioPreferences } from '@/studio/server/actions/preferences';

const MIN = 280;
const MAX = 440;
const STEP = 16;

export function Rail({
  initialWidth,
  collapsed,
  label,
  children,
}: {
  readonly initialWidth: number;
  readonly collapsed: boolean;
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement | null {
  const [width, setWidth] = useState(Math.min(MAX, Math.max(MIN, initialWidth)));
  const [, startTransition] = useTransition();
  const start = useRef<{ x: number; width: number } | null>(null);

  const persist = (next: number): void => startTransition(() => void updateStudioPreferences({ railWidth: next }));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    start.current = { x: event.clientX, width };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!start.current) return;
    setWidth(Math.min(MAX, Math.max(MIN, start.current.width + (start.current.x - event.clientX))));
  };
  const onPointerUp = (): void => {
    if (!start.current) return;
    start.current = null;
    persist(width);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = event.shiftKey ? STEP * 4 : STEP;
    const delta = event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = Math.min(MAX, Math.max(MIN, width + delta));
    setWidth(next);
    persist(next);
  };

  if (collapsed) return null;
  return (
    <aside aria-label={label} style={{ width }} className="relative flex shrink-0 flex-col gap-3 overflow-y-auto border-l border-line-subtle bg-surface p-4">
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        className="absolute top-0 left-0 h-full w-1 -translate-x-1/2 cursor-col-resize hover:bg-line-strong focus-visible:bg-focus"
      />
      {children}
    </aside>
  );
}
```

The `style={{ width }}` is a runtime value, not a token; it is the one inline style the design system allows (live pixel widths from user input).

- [ ] **Step 7: Header pieces**

`apps/cms/src/studio/document/SaveStatus.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

export type SaveState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'saved'; readonly at: number }
  | { readonly kind: 'error' };

// Strings from docs/studio/09-BEHAVIOUR-CONTRACT.md §11.2.
export const savedText = (at: number, now: number): string => {
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return 'Saved just now';
  if (minutes < 60) return `Saved ${minutes} min ago`;
  return `Saved at ${new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

export function SaveStatus({
  state,
  dirty,
  onRetry,
}: {
  readonly state: SaveState;
  readonly dirty: boolean;
  readonly onRetry: () => void;
}): ReactElement | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (state.kind === 'error') {
    // <output> is the repo's live-region element (admin/components/SavedStateIndicator.tsx:174).
    return (
      <output aria-live="polite" className="text-small text-danger">
        Save failed.{' '}
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          Retry
        </button>
      </output>
    );
  }
  const text = state.kind === 'saving' ? 'Saving…' : dirty ? 'Unsaved changes' : state.kind === 'saved' ? savedText(state.at, now) : null;
  if (!text) return null;
  return (
    <output aria-live="polite" className={`text-small ${dirty && state.kind !== 'saving' ? 'text-warning' : 'text-fg-subtle'}`}>
      {text}
    </output>
  );
}
```

`apps/cms/src/studio/document/ValidationSummary.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import { fieldDomId } from '@/studio/form/engine/paths';
import { Banner } from '@/studio/ui';

import type { Issue } from './build-patch';

export function ValidationSummary({ issues, labelOf }: { readonly issues: readonly Issue[]; readonly labelOf: (path: string) => string }): ReactElement | null {
  if (issues.length === 0) return null;
  const focus = (path: string): void => {
    const el = document.getElementById(fieldDomId(path));
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.focus({ preventScroll: true });
  };
  return (
    <Banner tone="danger">
      <p>{issues.length === 1 ? '1 field needs attention:' : `${issues.length} fields need attention:`}</p>
      <ul className="mt-1 flex flex-wrap gap-x-3">
        {issues.map((issue) => (
          <li key={issue.path}>
            <button type="button" onClick={() => focus(issue.path)} className="underline underline-offset-2">
              {labelOf(issue.path)}
            </button>
          </li>
        ))}
      </ul>
    </Banner>
  );
}
```

`apps/cms/src/studio/document/PublishControl.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import type { SlugStatus } from '@/studio/features/publishing/slug-state';
import { Button } from '@/studio/ui';

const SLUG_BLOCKS: Partial<Record<SlugStatus, string>> = {
  empty: 'Add a slug before publishing.',
  checking: 'Checking the slug…',
  taken: 'The slug is already used by another document.',
  invalid: 'Fix the slug before publishing.',
};

export function PublishControl({
  drafts,
  canSave,
  isCreate,
  dirty,
  isPublished,
  saving,
  slugStatus,
  onSave,
}: {
  readonly drafts: boolean;
  readonly canSave: boolean;
  readonly isCreate: boolean;
  readonly dirty: boolean;
  readonly isPublished: boolean;
  readonly saving: 'draft' | 'publish' | 'save' | null;
  readonly slugStatus: SlugStatus | null;
  readonly onSave: (intent: 'draft' | 'publish' | 'save') => void;
}): ReactElement | null {
  if (!canSave) return null;
  const slugBlock = slugStatus ? SLUG_BLOCKS[slugStatus] : undefined;
  if (!drafts) {
    return (
      <Button variant="primary" loading={saving === 'save'} disabled={(!dirty && !isCreate) || Boolean(slugBlock)} title={slugBlock} onClick={() => onSave('save')}>
        {isCreate ? 'Create' : 'Save'}
      </Button>
    );
  }
  const canPublish = (dirty || isCreate || !isPublished) && !slugBlock;
  return (
    <>
      <Button loading={saving === 'draft'} disabled={!dirty && !isCreate} onClick={() => onSave('draft')}>
        Save draft
      </Button>
      <Button variant="primary" loading={saving === 'publish'} disabled={!canPublish} title={slugBlock} onClick={() => onSave('publish')}>
        Publish
      </Button>
    </>
  );
}
```

The Publish split (Schedule, Unpublish) replaces the plain Publish button in Phase 4. The reason a button is disabled is in its `title` for now; Phase 4 moves it into a visible hint next to the button (the audit flagged title-only reasons).

`apps/cms/src/studio/document/TitleField.tsx`:

```tsx
'use client';

import type { ReactElement } from 'react';

import { useStudioField } from '@/studio/form/engine/useStudioField';
import type { StudioField } from '@/studio/server/schema/types';

export function TitleField({ field, placeholder }: { readonly field: StudioField; readonly placeholder: string }): ReactElement {
  const b = useStudioField(field, field.name ?? 'title');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={b.id} className="sr-only">
        {field.label ?? 'Title'}
      </label>
      <input
        id={b.id}
        ref={b.ref}
        value={typeof b.value === 'string' ? b.value : ''}
        onChange={(e) => b.onChange(e.target.value)}
        onBlur={b.onBlur}
        readOnly={b.readOnly}
        placeholder={placeholder}
        aria-invalid={b.error ? true : undefined}
        aria-describedby={b.describedBy}
        className="w-full bg-transparent text-doc-title text-fg outline-none placeholder:text-fg-subtle"
      />
      {b.error ? (
        <p id={`${b.id}-error`} className="text-small text-danger">
          {b.error}
        </p>
      ) : null}
    </div>
  );
}
```

`apps/cms/src/studio/document/useUnsavedGuard.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';

// Browser close or reload: the native prompt. In-app links: intercepted in the
// capture phase and confirmed with a dialog (the App Router has no route-change event).
export const useUnsavedGuard = (dirty: boolean): { readonly pendingHref: string | null; readonly clear: () => void } => {
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(`${url.pathname}${url.search}`);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  return { pendingHref, clear: () => setPendingHref(null) };
};
```

`apps/cms/src/studio/document/DocumentHeader.tsx`:

```tsx
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

import { type DocumentStatus, StatusBadge } from '@/studio/ui';

export function DocumentHeader({
  collectionHref,
  collectionLabel,
  title,
  status,
  saveStatus,
  actions,
}: {
  readonly collectionHref: string;
  readonly collectionLabel: string;
  readonly title: string;
  readonly status: DocumentStatus | null;
  readonly saveStatus: ReactNode;
  readonly actions: ReactNode;
}): ReactElement {
  return (
    <header className="sticky top-0 z-(--z-header) flex h-(--document-header-height) items-center justify-between gap-4 bg-surface pl-6 pr-3">
      <div className="flex min-w-0 items-center gap-3">
        <nav aria-label="Breadcrumb" className="shrink-0">
          <Link href={collectionHref} className="text-body text-fg-muted hover:text-fg">
            {collectionLabel}
          </Link>
        </nav>
        <span className="truncate text-body-strong text-fg">{title}</span>
        {status ? <StatusBadge status={status} /> : null}
        {saveStatus}
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </header>
  );
}
```

- [ ] **Step 8: The edit view**

`apps/cms/src/studio/document/EditView.tsx`:

```tsx
'use client';

import { ConfirmDialog, DropdownMenu, useToast } from '@cleanstart/ui';
import { DotsThree, SidebarSimple } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { ReactElement } from 'react';

import type { SlugStatus } from '@/studio/features/publishing/slug-state';
import { StudioFormContext } from '@/studio/form/engine/StudioFormContext';
import type { StudioFormContextValue } from '@/studio/form/engine/types';
import { RenderFields } from '@/studio/form/RenderFields';
import { deleteDocument, saveDocument } from '@/studio/server/actions/document';
import { updateStudioPreferences } from '@/studio/server/actions/preferences';
import type { StudioEntitySchema } from '@/studio/server/schema/types';
import { type DocumentStatus, IconButton, Section } from '@/studio/ui';
import { Rail } from '@/studio/ui/Rail';

import { type Issue, buildPatch, flattenErrors, labelForPath } from './build-patch';
import { DocumentHeader } from './DocumentHeader';
import { PublishControl } from './PublishControl';
import { type SaveState, SaveStatus } from './SaveStatus';
import { SlugStatusContext } from './slug-status';
import { TitleField } from './TitleField';
import { useUnsavedGuard } from './useUnsavedGuard';
import { ValidationSummary } from './ValidationSummary';

export type EditViewProps = {
  readonly schema: StudioEntitySchema;
  readonly docId: string | number | null;
  readonly initialValues: Record<string, unknown>;
  readonly status: DocumentStatus | null;
  readonly permissions: { readonly update: boolean; readonly delete: boolean; readonly create: boolean };
  readonly fieldPermissions: Record<string, unknown> | undefined;
  readonly user: { readonly id: number; readonly roles: readonly string[] };
  readonly railWidth: number;
  readonly railCollapsed: boolean;
};

export function EditView(props: EditViewProps): ReactElement {
  const { schema, docId } = props;
  const router = useRouter();
  const toast = useToast();
  const isCreate = docId === null;
  const canSave = isCreate ? props.permissions.create : props.permissions.update;
  const methods = useForm({ defaultValues: props.initialValues, mode: 'onSubmit', reValidateMode: 'onChange', shouldUnregister: false });
  const [status, setStatus] = useState(props.status);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [saving, setSaving] = useState<'draft' | 'publish' | 'save' | null>(null);
  const [issues, setIssues] = useState<readonly Issue[]>([]);
  const [slugStatus, setSlugStatus] = useState<SlugStatus | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(props.railCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();
  const menuAnchor = useRef<HTMLButtonElement>(null);
  const lastIntent = useRef<'draft' | 'publish' | 'save'>(schema.drafts ? 'draft' : 'save');
  const dirty = methods.formState.isDirty;
  const guard = useUnsavedGuard(dirty && saving === null);

  const titleField = schema.useAsTitle ? schema.fields.find((f) => f.name === schema.useAsTitle && f.type === 'text') ?? null : null;
  const liveTitle = useWatch({ control: methods.control, name: schema.useAsTitle ?? 'id' }) as unknown;
  const title = typeof liveTitle === 'string' && liveTitle.trim() ? liveTitle : isCreate ? `New ${schema.label.singular.toLowerCase()}` : `#${String(docId)}`;
  const listHref = `/studio/collections/${schema.slug}`;
  const labelOf = useCallback((path: string) => labelForPath(schema.fields, path), [schema.fields]);

  const formContext = useMemo<StudioFormContextValue>(
    () => ({
      schema,
      fieldPermissions: props.fieldPermissions,
      readOnly: !canSave,
      operation: isCreate ? 'create' : 'update',
      user: props.user,
      classicHref: isCreate ? `/admin/collections/${schema.slug}/create` : `/admin/collections/${schema.slug}/${String(docId)}`,
    }),
    [schema, props.fieldPermissions, canSave, isCreate, props.user, docId],
  );
  const slugContext = useMemo(() => ({ status: slugStatus, report: setSlugStatus }), [slugStatus]);

  // The preference save runs outside the state updater: React may call an
  // updater twice (reactStrictMode in dev), which would save twice.
  const toggleRail = useCallback((): void => {
    const next = !railCollapsed;
    setRailCollapsed(next);
    startTransition(() => void updateStudioPreferences({ railCollapsed: next }));
  }, [railCollapsed]);

  const save = useCallback(
    async (intent: 'draft' | 'publish' | 'save'): Promise<void> => {
      if (!canSave || saving) return;
      lastIntent.current = intent;
      setIssues([]);
      if (intent !== 'draft') {
        const valid = await methods.trigger();
        if (!valid) {
          setIssues(flattenErrors(methods.formState.errors));
          return;
        }
      }
      setSaving(intent);
      setSaveState({ kind: 'saving' });
      const patch = buildPatch(schema.fields, methods.getValues(), methods.formState.dirtyFields as Record<string, unknown>, isCreate);
      const result = await saveDocument({ collection: schema.slug, id: docId, intent, data: patch });
      setSaving(null);
      if (!result.ok) {
        for (const issue of result.error.issues) methods.setError(issue.path, { type: 'server', message: issue.message });
        setIssues(result.error.issues);
        setSaveState({ kind: 'error' });
        toast.push({ tone: 'error', message: result.error.message, duration: 0 });
        return;
      }
      methods.reset(result.data.values);
      setStatus(result.data.status);
      setSaveState({ kind: 'saved', at: Date.now() });
      toast.push({ tone: 'success', message: intent === 'publish' ? 'Published.' : intent === 'draft' ? 'Draft saved.' : 'Saved.' });
      if (isCreate) router.replace(`${listHref}/${String(result.data.id)}`);
    },
    [canSave, saving, methods, schema, docId, isCreate, toast, router, listHref],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save(schema.drafts ? 'draft' : 'save');
      } else if (mod && event.key === 'Enter' && schema.drafts) {
        event.preventDefault();
        void save('publish');
      } else if (mod && event.key === '.') {
        event.preventDefault();
        toggleRail();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, schema.drafts, toggleRail]);

  const remove = async (): Promise<void> => {
    if (docId === null) return;
    const result = await deleteDocument({ collection: schema.slug, id: docId });
    setConfirmDelete(false);
    if (!result.ok) {
      toast.push({ tone: 'error', message: result.error.message, duration: 0 });
      return;
    }
    methods.reset(methods.getValues());
    toast.push({ tone: 'success', message: `${schema.label.singular} deleted.` });
    router.replace(listHref);
  };

  const hasSidebar = schema.fields.some((f) => f.position === 'sidebar' && !f.hidden);
  const mainFields = schema.fields.filter((f) => f !== titleField);

  return (
    <StudioFormContext.Provider value={formContext}>
      <SlugStatusContext.Provider value={slugContext}>
        <FormProvider {...methods}>
          <DocumentHeader
            collectionHref={listHref}
            collectionLabel={schema.label.plural}
            title={title}
            status={status}
            saveStatus={<SaveStatus state={saveState} dirty={dirty} onRetry={() => void save(lastIntent.current)} />}
            actions={
              <>
                <PublishControl
                  drafts={schema.drafts}
                  canSave={canSave}
                  isCreate={isCreate}
                  dirty={dirty}
                  isPublished={status === 'published'}
                  saving={saving}
                  slugStatus={slugStatus}
                  onSave={(intent) => void save(intent)}
                />
                {hasSidebar ? (
                  <IconButton
                    label={railCollapsed ? 'Show panel' : 'Hide panel'}
                    shortcut="⌘."
                    pressed={!railCollapsed}
                    icon={<SidebarSimple size={16} aria-hidden="true" />}
                    onClick={toggleRail}
                  />
                ) : null}
                {isCreate ? null : (
                  <IconButton ref={menuAnchor} label="More actions" icon={<DotsThree size={16} aria-hidden="true" />} onClick={() => setMenuOpen((v) => !v)} />
                )}
              </>
            }
          />
          <div className="flex min-h-[calc(100dvh-var(--document-header-height)-2*var(--sheet-inset))]">
            <div className="min-w-0 flex-1 px-6 py-8">
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(schema.drafts ? 'draft' : 'save');
                }}
                className="mx-auto flex max-w-(--content-max-width) flex-col gap-5"
              >
                <ValidationSummary issues={issues} labelOf={labelOf} />
                {titleField ? <TitleField field={titleField} placeholder={`${schema.label.singular} title`} /> : null}
                <RenderFields fields={mainFields} basePath="" position="main" />
              </form>
            </div>
            {hasSidebar ? (
              <Rail initialWidth={props.railWidth} collapsed={railCollapsed} label="Document settings">
                <Section title="Details">
                  <RenderFields fields={schema.fields} basePath="" position="sidebar" />
                </Section>
              </Rail>
            ) : null}
          </div>

          <DropdownMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={menuAnchor}
            placement="bottom-end"
            ariaLabel="Document actions"
            items={[
              { kind: 'item', id: 'copy-id', label: 'Copy ID', onSelect: () => void navigator.clipboard.writeText(String(docId)) },
              ...(props.permissions.delete
                ? [{ kind: 'separator' as const, id: 's1' }, { kind: 'item' as const, id: 'delete', label: 'Delete', tone: 'danger' as const, onSelect: () => setConfirmDelete(true) }]
                : []),
            ]}
          />
          <ConfirmDialog
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={remove}
            title={`Delete this ${schema.label.singular.toLowerCase()}?`}
            description="It is removed from Studio and the site. This cannot be undone."
            confirmLabel="Delete"
            tone="danger"
          />
          <ConfirmDialog
            open={guard.pendingHref !== null}
            onClose={guard.clear}
            onConfirm={() => {
              const href = guard.pendingHref;
              methods.reset(methods.getValues());
              guard.clear();
              if (href) router.push(href);
            }}
            title="Discard unsaved changes?"
            description="Your changes to this document are not saved."
            confirmLabel="Discard"
            cancelLabel="Keep editing"
            tone="danger"
          />
        </FormProvider>
      </SlugStatusContext.Provider>
    </StudioFormContext.Provider>
  );
}
```

`min-h-[calc(100dvh-var(--document-header-height)-2*var(--sheet-inset))]` is a layout calc (the sheet sits 8px inside the window top and bottom), not a colour or font size, so the boundary check allows it.

- [ ] **Step 9: Routes**

`apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/[id]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';

import { EditView } from '@/studio/document/EditView';
import { loadDocument } from '@/studio/server/loaders/document';
import { readPreferences } from '@/studio/server/loaders/shell';
import { isVisibleInStudio } from '@/studio/server/readiness';
import { requireSession } from '@/studio/server/session';

export default async function EditDocument({ params }: { readonly params: Promise<{ collection: string; id: string }> }): Promise<ReactElement> {
  const { collection, id } = await params;
  const session = await requireSession(`/studio/collections/${collection}/${id}`);
  const known = session.payload.config.collections.some((c) => c.slug === collection && !c.slug.startsWith('payload-'));
  if (!known || !isVisibleInStudio(collection)) notFound();
  const loaded = await loadDocument(session, collection, id);
  if (!loaded) notFound();
  if (!loaded.permissions.read) redirect('/studio/forbidden');
  const prefs = readPreferences(session.user.preferences);
  return (
    <EditView
      schema={loaded.schema}
      docId={id}
      initialValues={loaded.values}
      status={loaded.status}
      permissions={loaded.permissions}
      fieldPermissions={loaded.fieldPermissions}
      user={{ id: session.user.id, roles: session.user.roles }}
      railWidth={prefs.railWidth ?? 320}
      railCollapsed={prefs.railCollapsed ?? false}
    />
  );
}
```

`apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/new/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';

import { initialValuesFor } from '@/studio/document/build-patch';
import { EditView } from '@/studio/document/EditView';
import { readPreferences } from '@/studio/server/loaders/shell';
import { collectionCan } from '@/studio/server/permissions';
import { isVisibleInStudio } from '@/studio/server/readiness';
import { buildCollectionSchema } from '@/studio/server/schema/build-schema';
import { requireSession } from '@/studio/server/session';

export default async function CreateDocument({ params }: { readonly params: Promise<{ collection: string }> }): Promise<ReactElement> {
  const { collection } = await params;
  const session = await requireSession(`/studio/collections/${collection}/new`);
  const known = session.payload.config.collections.some((c) => c.slug === collection && !c.slug.startsWith('payload-'));
  if (!known || !isVisibleInStudio(collection)) notFound();
  if (!collectionCan(session.permissions, collection, 'create')) redirect('/studio/forbidden');
  const schema = buildCollectionSchema(session.payload.config, collection);
  const prefs = readPreferences(session.user.preferences);
  return (
    <EditView
      schema={schema}
      docId={null}
      initialValues={initialValuesFor(schema.fields)}
      status={schema.drafts ? 'draft' : null}
      permissions={{ update: false, delete: false, create: true }}
      fieldPermissions={session.permissions.collections?.[collection]?.fields as Record<string, unknown> | undefined}
      user={{ id: session.user.id, roles: session.user.roles }}
      railWidth={prefs.railWidth ?? 320}
      railCollapsed={prefs.railCollapsed ?? false}
    />
  );
}
```

- [ ] **Step 10: Verify**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/studio && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms verify:studio-boundaries && pnpm --filter @cleanstart/cms verify:studio-coverage`
Expected: all PASS.

In the browser pane at 1440×900, with a local admin user and `STUDIO_SHOW_UNREADY=true`:

1. `/studio/collections/redirects/new`: status defaults to 301; leave From empty and press Save: the summary lists From, clicking it focuses the field. Fill From and To, Save: URL changes to the new id, toast "Saved.".
2. Change status to 410: the To field disappears (condition). Save succeeds without To.
3. Edit From, click "Redirects" in the breadcrumb: the discard dialog appears; Keep editing keeps the change.
4. ⌘S saves; ⌘. hides and shows the rail; drag and ←/→ resize it and the width survives reload.
5. Delete from the More menu: confirm, land on the list, the row is gone.
6. `/studio/collections/jobLocations/new`: type a name, the slug fills in; type an existing slug: "already used by". Save.
7. Open the same redirect in `/admin` and confirm every field matches what Studio saved.

Screenshots of steps 1, 2 and 6 in light and dark go in the Gate C notes.

- [ ] **Step 11: Commit**

```bash
git add apps/cms/src/studio/document apps/cms/src/studio/server/loaders/document.ts apps/cms/src/studio/server/actions/document.ts apps/cms/src/studio/features/publishing/SlugField.tsx apps/cms/src/studio/ui/Rail.tsx "apps/cms/src/app/(studio)/studio/(app)/collections"
git commit -m "feat(studio): T1.16 edit and create document"
```

### Task 1.17: Account (S-04)

**Files:**
- Create: `apps/cms/src/studio/server/actions/account.ts`
- Create: `apps/cms/src/studio/features/account/AccountForm.tsx`
- Create: `apps/cms/src/app/(studio)/studio/(app)/account/page.tsx`

- [ ] **Step 1: The action**

`apps/cms/src/studio/server/actions/account.ts`:

```ts
'use server';

import { z } from 'zod';

import type { ActionResult } from '../errors';
import { runAction, studioApi } from '../payload';
import { getSession } from '../session';

const Input = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(256).optional(),
});

// Same rules as apps/cms/src/payload/admin/components/auth/CmsAccountForm.tsx:51-80. Field access still applies: users
// cannot change their own roles or enabled flag (Users.ts:82-99).
export async function updateAccount(input: unknown): Promise<ActionResult<{ name: string; email: string }>> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        kind: 'validation',
        message: 'Fix the highlighted fields and try again.',
        issues: parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })),
      },
    };
  }
  const session = await getSession();
  if (!session) return { ok: false, error: { kind: 'forbidden', message: 'Sign in again to update your account.', issues: [] } };
  return runAction(async () => {
    const api = await studioApi(session);
    const { password, ...rest } = parsed.data;
    const doc = (await api.update({ collection: 'users', id: session.user.id, data: { ...rest, ...(password ? { password } : {}) } })) as { name: string; email: string };
    return { name: doc.name, email: doc.email };
  });
}
```

- [ ] **Step 2: The form**

`apps/cms/src/studio/features/account/AccountForm.tsx`:

```tsx
'use client';

import { useToast } from '@cleanstart/ui';
import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { updateAccount } from '@/studio/server/actions/account';
import { useTheme } from '@/studio/theme/ThemeProvider';
import { Button, Field, RadioGroup, Section, TextInput } from '@/studio/ui';

export function AccountForm({ name, email }: { readonly name: string; readonly email: string }): ReactElement {
  const toast = useToast();
  const { preference, setPreference } = useTheme();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    // React clears event.currentTarget once the handler yields, so keep the form before any await.
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    if (password && password !== confirm) {
      setErrors({ confirm: 'Passwords do not match.' });
      return;
    }
    setBusy(true);
    const result = await updateAccount({ name: form.get('name'), email: form.get('email'), password: password || undefined });
    setBusy(false);
    if (!result.ok) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [i.path, i.message])));
      toast.push({ tone: 'error', message: result.error.message });
      return;
    }
    setErrors({});
    formEl.reset();
    toast.push({ tone: 'success', message: 'Account updated.' });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-140 flex-col">
      <Section title="Profile">
        <Field id="name" label="Name" error={errors.name}>
          <TextInput id="name" name="name" defaultValue={name} autoComplete="name" invalid={Boolean(errors.name)} describedBy={errors.name ? 'name-error' : undefined} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <TextInput id="email" name="email" type="email" defaultValue={email} autoComplete="email" invalid={Boolean(errors.email)} describedBy={errors.email ? 'email-error' : undefined} />
        </Field>
      </Section>
      <Section title="Password" description="Leave blank to keep your current password.">
        <Field id="password" label="New password" error={errors.password} optional>
          <TextInput id="password" name="password" type="password" autoComplete="new-password" invalid={Boolean(errors.password)} />
        </Field>
        <Field id="confirm" label="Confirm new password" error={errors.confirm} optional>
          <TextInput id="confirm" name="confirm" type="password" autoComplete="new-password" invalid={Boolean(errors.confirm)} />
        </Field>
      </Section>
      <Section title="Appearance">
        <RadioGroup
          name="theme"
          label="Theme"
          value={preference}
          onChange={(next) => setPreference(next as 'system' | 'light' | 'dark')}
          options={[
            { value: 'system', label: 'Match system' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Section>
      <Section title="Two-factor authentication">
        <p className="text-body text-fg-muted">Not available yet.</p>
      </Section>
      <div className="pt-8">
        <Button type="submit" variant="primary" loading={busy}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: The route**

`apps/cms/src/app/(studio)/studio/(app)/account/page.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import { AccountForm } from '@/studio/features/account/AccountForm';
import { requireSession } from '@/studio/server/session';
import { PageHeader } from '@/studio/ui';

export const metadata: Metadata = { title: 'Account' };

export default async function Account(): Promise<ReactElement> {
  const { user } = await requireSession('/studio/account');
  return (
    <>
      <PageHeader title="Account" />
      <div className="px-6 py-8">
        <AccountForm name={user.name} email={user.email} />
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify and commit**

Run typecheck and lint. In the browser pane: change your name, save, reload, the sidebar shows the new name; mismatched passwords show the inline error; theme radio switches the theme.

```bash
git add apps/cms/src/studio/server/actions/account.ts apps/cms/src/studio/features/account "apps/cms/src/app/(studio)/studio/(app)/account"
git commit -m "feat(studio): T1.17 account screen"
```

### Task 1.18: End-to-end tests, readiness and CI

**Files:**
- Create: `apps/cms/scripts/seed-studio-e2e-users.ts`
- Modify: `apps/cms/.env.example` (document `STUDIO_E2E_PASSWORD`)
- Create: `apps/cms/tests/e2e/studio/helpers.ts`
- Create: `apps/cms/tests/e2e/studio/studio-auth.spec.ts`, `studio-shell.spec.ts`, `studio-redirects.spec.ts`, `studio-job-locations.spec.ts`, `studio-a11y.spec.ts`
- Modify: `apps/cms/src/studio/server/readiness.ts` (add `redirects`, `jobLocations`)
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Seed one local user per role**

`apps/cms/scripts/seed-studio-e2e-users.ts`:

```ts
/**
 * Creates or updates one Studio e2e user per role on a LOCAL or CI database.
 * Refuses to run against anything else. Password comes from STUDIO_E2E_PASSWORD.
 *
 * Run: pnpm --filter @cleanstart/cms exec tsx --env-file-if-exists=.env scripts/seed-studio-e2e-users.ts
 */
import { ROLES } from '@cleanstart/types';
import { getPayload } from 'payload';

import config from '../src/payload.config';

const main = async (): Promise<void> => {
  const uri = process.env.DATABASE_URI ?? '';
  const password = process.env.STUDIO_E2E_PASSWORD ?? '';
  if (process.env.NODE_ENV === 'production' || !/@(localhost|127\.0\.0\.1)[:/]/.test(uri)) {
    throw new Error('seed-studio-e2e-users only runs against a local or CI database.');
  }
  if (password.length < 12) throw new Error('Set STUDIO_E2E_PASSWORD (12+ characters) first.');
  const payload = await getPayload({ config });
  for (const role of ROLES) {
    const email = `studio-${role}@example.test`;
    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true });
    const data = { name: `Studio ${role[0]?.toUpperCase()}${role.slice(1)}`, email, password, roles: [role], enabled: true };
    if (existing.docs[0]) await payload.update({ collection: 'users', id: existing.docs[0].id, data, overrideAccess: true });
    else await payload.create({ collection: 'users', data, overrideAccess: true });
    console.info(`ready: ${email}`);
  }
  process.exit(0);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
```

Add to `apps/cms/.env.example`:

```
# Studio e2e users (local and CI only). scripts/seed-studio-e2e-users.ts creates
# studio-<role>@example.test with this password. Never set this in production.
STUDIO_E2E_PASSWORD=
```

Run locally with a generated password stored only in your `.env` (for example `openssl rand -base64 18`). Expected: seven `ready:` lines.

- [ ] **Step 2: Mark the Phase 1 collections ready**

In `apps/cms/src/studio/server/readiness.ts`: `export const READY = new Set<string>(['redirects', 'jobLocations']);`

- [ ] **Step 3: Helpers**

`apps/cms/tests/e2e/studio/helpers.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { type Page, expect } from '@playwright/test';

export type Role = 'admin' | 'editor' | 'author' | 'seo' | 'hr' | 'events' | 'legal';

export const signIn = async (page: Page, role: Role): Promise<void> => {
  const password = process.env.STUDIO_E2E_PASSWORD;
  if (!password) throw new Error('STUDIO_E2E_PASSWORD is not set');
  const res = await page.request.post('/api/users/login', { data: { email: `studio-${role}@example.test`, password } });
  expect(res.ok()).toBe(true);
};

export const setTheme = async (page: Page, theme: 'light' | 'dark'): Promise<void> => {
  await page.addInitScript((t) => window.localStorage.setItem('studio-theme', t), theme);
};

export const expectNoAxeViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
};
```

- [ ] **Step 4: Specs**

`apps/cms/tests/e2e/studio/studio-auth.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('@studio auth', () => {
  test('redirects to sign in and back to the page asked for', async ({ page }) => {
    await page.goto('/studio/collections/redirects');
    await expect(page).toHaveURL(/\/studio\/login\?next=%2Fstudio%2Fcollections%2Fredirects/);
    await page.getByLabel('Email').fill('studio-editor@example.test');
    await page.getByLabel('Password', { exact: true }).fill(process.env.STUDIO_E2E_PASSWORD ?? '');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/studio\/collections\/redirects$/);
  });

  test('does not reveal whether the email or the password was wrong', async ({ page }) => {
    await page.goto('/studio/login');
    await page.getByLabel('Email').fill('studio-editor@example.test');
    await page.getByLabel('Password', { exact: true }).fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Scoped to the form: Next's route announcer is also a role="alert" element.
    await expect(page.locator('form').getByRole('alert')).toHaveText('Email or password is incorrect.');
  });

  test('forgot password always shows the same message', async ({ page }) => {
    await page.goto('/studio/forgot-password');
    await page.getByLabel('Email').fill('nobody@example.test');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('status')).toHaveText('If that email has an account, a reset link is on its way.');
  });

  test('the seo role cannot use Studio', async ({ page }) => {
    await page.goto('/studio/login');
    await page.getByLabel('Email').fill('studio-seo@example.test');
    await page.getByLabel('Password', { exact: true }).fill(process.env.STUDIO_E2E_PASSWORD ?? '');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Your role cannot use Studio.')).toBeVisible();
  });
});
```

`apps/cms/tests/e2e/studio/studio-shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

import { type Role, signIn } from './helpers';

// Visible items among the ready collections (redirects, jobLocations), per role.
// hr is scoped to its domain (wire-scoped-nav.ts:16-25), which includes jobLocations only.
// Labels are the collections' plural labels: JobLocations.ts:10 and Redirects.ts:31.
const EXPECTED: Record<Exclude<Role, 'seo'>, readonly string[]> = {
  admin: ['Job locations', 'Redirects'],
  editor: ['Job locations', 'Redirects'],
  author: ['Job locations', 'Redirects'],
  hr: ['Job locations'],
  events: [],
  legal: [],
};

for (const [role, items] of Object.entries(EXPECTED) as Array<[Exclude<Role, 'seo'>, readonly string[]]>) {
  test(`@studio navigation for ${role}`, async ({ page }) => {
    await signIn(page, role);
    await page.goto('/studio');
    const nav = page.getByRole('navigation', { name: 'Studio' });
    for (const label of ['Job locations', 'Redirects']) {
      const link = nav.getByRole('link', { name: label, exact: true });
      if (items.includes(label)) await expect(link).toBeVisible();
      else await expect(link).toHaveCount(0);
    }
  });
}

test('@studio skip link is the first tab stop', async ({ page }) => {
  await signIn(page, 'editor');
  await page.goto('/studio');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
```

The labels above match the plural labels in `apps/cms/src/payload/collections/JobLocations.ts:10` (`Job locations`) and `Redirects.ts:31` (`Redirects`) as of 2026-10-21; if either changes, change the spec with it.

`apps/cms/tests/e2e/studio/studio-redirects.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

test.describe('@studio redirects', () => {
  test('create, conditional field, edit and delete, matching what Payload stores', async ({ page }) => {
    await signIn(page, 'editor');
    const from = `/studio-e2e-${Date.now()}`;

    await page.goto('/studio/collections/redirects/new');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('fields need attention').or(page.getByText('field needs attention'))).toBeVisible();

    await page.getByLabel('From').fill(from);
    await page.getByLabel('To').fill('/blog');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/studio\/collections\/redirects\/\d+$/);
    const id = page.url().split('/').pop();

    const stored = await (await page.request.get(`/api/redirects/${id}`)).json();
    expect(stored.from).toBe(from);
    expect(stored.to).toBe('/blog');

    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: /410/ }).click();
    await expect(page.getByLabel('To')).toHaveCount(0);
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    // The exact SaveStatus string (09-BEHAVIOUR-CONTRACT.md §11.2); the toast says "Saved." and must not match.
    await expect(page.getByText('Saved just now', { exact: true })).toBeVisible();
    expect((await (await page.request.get(`/api/redirects/${id}`)).json()).status).toBe('410');

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/studio\/collections\/redirects$/);
    expect((await page.request.get(`/api/redirects/${id}`)).status()).toBe(404);
  });

  test('a role without write access sees the form read-only', async ({ page }) => {
    await signIn(page, 'author');
    await page.goto('/studio/collections/redirects');
    await expect(page.getByRole('link', { name: /New redirect/i })).toHaveCount(0);
  });
});
```

Read the exact option label for 410 and the field labels from `Redirects.ts:45-150` before running; adjust the locators to match. This spec is the Phase 1 acceptance test for S-37 (redirects, base): create, edit, the 410 condition, delete and role gating. The staleness pill, locked slug-change rows and bulk import are S-37's Phase 5 part.

`apps/cms/tests/e2e/studio/studio-job-locations.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

test.describe('@studio job locations', () => {
  test('slug follows the name, reports collisions, and saves', async ({ page }) => {
    await signIn(page, 'hr');
    const name = `Studio E2E ${Date.now()}`;
    await page.goto('/studio/collections/jobLocations/new');
    await page.getByRole('textbox', { name: /name/i }).first().fill(name);
    const slug = page.getByLabel('Slug');
    await expect(slug).toHaveValue(name.toLowerCase().replace(/\s+/g, '-'));
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/studio\/collections\/jobLocations\/\d+$/);

    await page.goto('/studio/collections/jobLocations/new');
    await page.getByRole('textbox', { name: /name/i }).first().fill(name);
    await expect(page.getByText(/already used by/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
  });
});
```

`apps/cms/tests/e2e/studio/studio-a11y.spec.ts`:

```ts
import { test } from '@playwright/test';

import { expectNoAxeViolations, setTheme, signIn } from './helpers';

for (const theme of ['dark', 'light'] as const) {
  test.describe(`@studio accessibility (${theme})`, () => {
    test('sign in', async ({ page }) => {
      await setTheme(page, theme);
      await page.goto('/studio/login');
      await expectNoAxeViolations(page);
    });

    test('list and edit', async ({ page }) => {
      await setTheme(page, theme);
      await signIn(page, 'admin');
      await page.goto('/studio/collections/redirects');
      await expectNoAxeViolations(page);
      await page.goto('/studio/collections/redirects/new');
      await expectNoAxeViolations(page);
    });

    test('account', async ({ page }) => {
      await setTheme(page, theme);
      await signIn(page, 'editor');
      await page.goto('/studio/account');
      await expectNoAxeViolations(page);
    });
  });
}
```

- [ ] **Step 5: Run the suite locally**

Seed (Step 1), reuse or start the dev server per the dev server policy, then:

Run: `STUDIO_E2E_PASSWORD=... pnpm --filter @cleanstart/cms test:e2e --grep @studio`
Expected: all specs pass. Fix the product, not the test, for any failure that reflects real behaviour; fix locators only where a label differs from the config.

- [ ] **Step 6: CI**

In `.github/workflows/ci.yml`:

1. In the `cms` job, after the `verify:payload-ui` step, add:

```yaml
      - name: Studio boundaries
        run: pnpm --filter @cleanstart/cms verify:studio-boundaries
      - name: Studio coverage
        run: pnpm --filter @cleanstart/cms verify:studio-coverage
```

2. Add a `studio-e2e` job modelled on the existing e2e job that runs `--grep @phase-d-preview` (same Postgres service, env, build, migrate and Playwright install steps), with these differences:

```yaml
    env:
      STUDIO_E2E_PASSWORD: ci-only-studio-e2e-password
    steps:
      # ...checkout, pnpm, install, build, migrate, playwright install, as in the preview job...
      - name: Seed Studio e2e users
        run: pnpm --filter @cleanstart/cms exec tsx scripts/seed-studio-e2e-users.ts
      - name: Studio e2e
        run: pnpm --filter @cleanstart/cms test:e2e --grep @studio
```

The CI password is a throwaway value for the disposable CI database only, matching how the workflow already sets `PAYLOAD_SECRET: ci-only-not-a-real-secret`.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/scripts/seed-studio-e2e-users.ts apps/cms/.env.example apps/cms/tests/e2e/studio apps/cms/src/studio/server/readiness.ts .github/workflows/ci.yml
git commit -m "test(studio): T1.18 end-to-end suite, readiness and CI"
```

Push and confirm both new CI steps and the `studio-e2e` job pass on GitHub before Task 1.20.

### Task 1.19: Author drafting (decision D-6)

Authors create and edit their own drafts in blogs, news, guides, knowledgeBase and resources, delete their own documents that are not live, and upload media. They cannot publish, schedule, unpublish or touch anyone else's document. This changes Payload's access rules, so it applies in Payload's admin too from the moment it ships. Rules are in `docs/studio/00-MASTER-PLAN.md` ("D-6 in detail").

How publish is blocked: Payload decides publish permission by calling the update access function with `data._status === 'published'` (`@payloadcms/next/dist/views/Document/getDocumentPermissions.js:30-37`). The author rules return `false` for that case, so Payload's admin hides Publish for authors and the API rejects it.

**Files:**
- Create: `apps/cms/src/payload/fields/created-by.ts`
- Modify: `apps/cms/src/payload/access/index.ts`
- Test: `apps/cms/src/payload/access/author-drafts.test.ts`
- Modify: `apps/cms/src/payload/collections/Blogs.ts`, `News.ts`, `Guides.ts`, `KnowledgeBase.ts`, `Resources.ts` (access and field)
- Modify: `apps/cms/src/payload/collections/Media.ts:75-82` (author create)
- Create: `apps/cms/src/migrations/20261016_120000_add_created_by.ts`
- Modify: `apps/cms/src/migrations/index.ts`
- Modify: `apps/cms/src/payload-types.ts` (regenerated, never by hand)
- Modify: `apps/cms/src/studio/server/loaders/document.ts`, `apps/cms/src/studio/document/EditView.tsx`, `apps/cms/src/studio/document/PublishControl.tsx`, `apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/new/page.tsx` (separate publish permission)
- Test: `apps/cms/tests/e2e/studio/author-drafts.spec.ts`

- [ ] **Step 1: Write the failing access tests**

`apps/cms/src/payload/access/author-drafts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { canCreateContent, canDeleteContent, canUpdateContent, isAdminEditorEventsOrAuthor } from './index';

type Args = Parameters<typeof canUpdateContent>[0];
const call = <T>(fn: (args: Args) => T, roles: string[] | null, data?: Record<string, unknown>): T =>
  fn({ req: { user: roles ? { id: 7, roles } : null }, data } as unknown as Args);

describe('canCreateContent', () => {
  it('lets admins and editors create anything', () => {
    expect(call(canCreateContent, ['editor'], { _status: 'published' })).toBe(true);
    expect(call(canCreateContent, ['admin'], { _status: 'published' })).toBe(true);
  });

  it('lets authors create drafts but not published documents', () => {
    expect(call(canCreateContent, ['author'], { _status: 'draft' })).toBe(true);
    expect(call(canCreateContent, ['author'], { _status: 'published' })).toBe(false);
  });

  it('denies everyone else', () => {
    expect(call(canCreateContent, ['hr'], { _status: 'draft' })).toBe(false);
    expect(call(canCreateContent, null, { _status: 'draft' })).toBe(false);
  });
});

describe('canUpdateContent', () => {
  it('lets admins and editors update anything', () => {
    expect(call(canUpdateContent, ['editor'], { _status: 'published' })).toBe(true);
  });

  it('limits authors to documents they created', () => {
    expect(call(canUpdateContent, ['author'], { _status: 'draft' })).toEqual({ createdBy: { equals: 7 } });
  });

  it('never lets an author publish, which is how Payload checks publish permission', () => {
    expect(call(canUpdateContent, ['author'], { _status: 'published' })).toBe(false);
  });

  it('denies roles without writing rights', () => {
    expect(call(canUpdateContent, ['seo'], { _status: 'draft' })).toBe(false);
  });
});

describe('canDeleteContent', () => {
  it('lets admins and editors delete anything', () => {
    expect(call(canDeleteContent, ['admin'])).toBe(true);
  });

  it('lets authors delete only their own documents that are not live', () => {
    expect(call(canDeleteContent, ['author'])).toEqual({
      and: [{ createdBy: { equals: 7 } }, { _status: { equals: 'draft' } }],
    });
  });

  it('denies everyone else', () => {
    expect(call(canDeleteContent, ['events'])).toBe(false);
  });
});

describe('isAdminEditorEventsOrAuthor (media uploads)', () => {
  it('keeps events and adds authors', () => {
    expect(call(isAdminEditorEventsOrAuthor, ['author'])).toBe(true);
    expect(call(isAdminEditorEventsOrAuthor, ['events'])).toBe(true);
    expect(call(isAdminEditorEventsOrAuthor, ['legal'])).toBe(false);
  });
});
```

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/access/author-drafts.test.ts`
Expected: FAIL, the four functions are not exported.

- [ ] **Step 2: Add the access rules**

Append to `apps/cms/src/payload/access/index.ts`:

```ts
/**
 * Content collections where authors draft their own work (decision D-6,
 * docs/studio/00-MASTER-PLAN.md): blogs, news, guides, knowledgeBase,
 * resources. Admins and editors keep full access. Authors may create drafts,
 * update documents they created (`createdBy`), and delete their own documents
 * that are not live. They can never publish: Payload asks the update rule with
 * `data._status === 'published'` to decide publish permission, and these
 * rules answer false for authors in that case.
 */
const isAdminOrEditorUser = (user: unknown): boolean => hasAnyRole(user, ['admin', 'editor']);

export const canCreateContent: Access = ({ req: { user }, data }) => {
  if (isAdminOrEditorUser(user)) return true;
  if (!hasRole(user, 'author')) return false;
  return (data as { _status?: unknown } | undefined)?._status !== 'published';
};

export const canUpdateContent: Access = ({ req: { user }, data }) => {
  if (isAdminOrEditorUser(user)) return true;
  if (!hasRole(user, 'author')) return false;
  if ((data as { _status?: unknown } | undefined)?._status === 'published') return false;
  const id = userId(user);
  if (id == null) return false;
  return { createdBy: { equals: id } };
};

export const canDeleteContent: Access = ({ req: { user } }) => {
  if (isAdminOrEditorUser(user)) return true;
  if (!hasRole(user, 'author')) return false;
  const id = userId(user);
  if (id == null) return false;
  return { and: [{ createdBy: { equals: id } }, { _status: { equals: 'draft' } }] };
};

/** Media uploads: admins, editors, events (unchanged) and authors (D-6). Update and delete rules are unchanged. */
export const isAdminEditorEventsOrAuthor: Access = ({ req: { user } }) => hasAnyRole(user, ['admin', 'editor', 'events', 'author']);
```

Run the test. Expected: PASS (11 tests).

- [ ] **Step 3: The createdBy field**

`apps/cms/src/payload/fields/created-by.ts`:

```ts
import type { Field } from 'payload';

/**
 * The user who created the document. Set from the request user on create and
 * never editable afterwards; it is what the author access rules
 * (access/index.ts canUpdateContent, canDeleteContent) compare against.
 * Documents created by scripts or imports have no request user and stay null,
 * so only admins and editors can edit them.
 */
export const createdByField: Field = {
  name: 'createdBy',
  label: 'Created by',
  type: 'relationship',
  relationTo: 'users',
  access: {
    update: () => false,
  },
  admin: {
    readOnly: true,
    position: 'sidebar',
    description: 'Set automatically to the person who created this.',
  },
  hooks: {
    beforeChange: [({ operation, req, value }) => (operation === 'create' ? (req.user?.id ?? value ?? null) : value)],
    beforeDuplicate: [({ req }) => req.user?.id ?? null],
  },
};
```

- [ ] **Step 4: Wire the five collections and Media**

In each of `Blogs.ts`, `News.ts`, `Guides.ts`, `KnowledgeBase.ts`, `Resources.ts`:

1. Import `canCreateContent, canDeleteContent, canUpdateContent` from `../access` and `createdByField` from `../fields/created-by`.
2. Replace the access block's `create`, `update` and `delete` with `canCreateContent`, `canUpdateContent` and `canDeleteContent` (keep `read` as it is).
3. Add `createdByField` to `fields`, directly after the field that holds `displayPublishedAt` (or after `slug` in collections without it), so it sits in the sidebar's publishing area.

In `Media.ts` (access block at lines 75 to 82), change `create: isAdminEditorOrEvents` to `create: isAdminEditorEventsOrAuthor` (import it from `../access`), leave `update` and `delete` exactly as they are (events keeps its folder-scoped update), and replace the comment's first two lines ("Authors no longer upload directly…") with:

```ts
    // Authors upload images for their own drafts (decision D-6, 2026-10-16).
    // `events` may add files, and edit those filed under its own folders;
    // nobody but admins and editors can remove anything from the library.
```

The endpoint `POST /api/media-ingest-url` has no role gate of its own: it calls Media's create access (`req.payload.collections.media.config.access.create({ req })`, `media-ingest-url.ts:80`). So this one change also lets authors use it, and it needs no edit.

- [ ] **Step 5: Migration**

Per CLAUDE.md rule 6, read (do not keep) what Payload would generate for these columns, then hand-write a guarded migration.

```bash
cd apps/cms && pnpm migrate:create add_created_by_probe
```

Copy only the statements for `created_by_id` / `version_created_by_id` on the five tables and their `_v` tables (column, foreign key, index names), then delete the generated `.ts` and `.json` files. Use those exact names below if they differ from the ones written here.

`apps/cms/src/migrations/20261016_120000_add_created_by.ts`:

```ts
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `createdBy` (relationship to users) to the five content collections
 * where authors draft their own work (decision D-6, docs/studio/00-MASTER-PLAN.md),
 * mirrored on each `_v` versions table. Existing rows stay null, so only admins
 * and editors can edit documents that predate this column.
 *
 * Hand-written for the reason in `20260921_100000_add_case_study_detail_fields.ts`.
 * Idempotent: local databases run `push: true` and may already have the columns.
 */

const TABLES = ['blogs', 'news', 'guides', 'knowledge_base', 'resources'] as const

const statementsFor = (table: (typeof TABLES)[number]) => [
  sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "created_by_id" integer;`),
  sql.raw(`ALTER TABLE "_${table}_v" ADD COLUMN IF NOT EXISTS "version_created_by_id" integer;`),
  sql.raw(
    `DO $$ BEGIN ALTER TABLE "${table}" ADD CONSTRAINT "${table}_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  ),
  sql.raw(
    `DO $$ BEGIN ALTER TABLE "_${table}_v" ADD CONSTRAINT "_${table}_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  ),
  sql.raw(`CREATE INDEX IF NOT EXISTS "${table}_created_by_idx" ON "${table}" USING btree ("created_by_id");`),
  sql.raw(`CREATE INDEX IF NOT EXISTS "_${table}_v_version_version_created_by_idx" ON "_${table}_v" USING btree ("version_created_by_id");`),
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of TABLES.flatMap(statementsFor)) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "created_by_id";`))
    await db.execute(sql.raw(`ALTER TABLE "_${table}_v" DROP COLUMN IF EXISTS "version_created_by_id";`))
  }
}
```

Register it in `apps/cms/src/migrations/index.ts` after the last entry, in the same shape as `20261005_090000_add_blog_cta_picks` (import line plus `{ up, down, name }` object).

- [ ] **Step 6: Regenerate types and run the suite**

```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms verify:types
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms migrate
```

Expected: `payload-types.ts` gains `createdBy?: (number | null) | User` on the five interfaces; all checks pass; `migrate` applies `20261016_120000_add_created_by` on a fresh local database and is a no-op on a push-mode one. Stash other sessions' uncommitted schema work first if any (see the project note on `generate:types` absorbing sibling changes).

- [ ] **Step 7: Separate publish permission in Studio**

Studio must show Save draft but not Publish to an author on their own draft, exactly as Payload's admin will.

In `apps/cms/src/studio/server/loaders/document.ts`, add `publish` to `DocumentPermissions` and compute it with the same check Payload uses:

```ts
export type DocumentPermissions = {
  readonly read: boolean;
  readonly update: boolean;
  readonly delete: boolean;
  readonly create: boolean;
  readonly publish: boolean;
};
```

```ts
  const collectionConfig = session.payload.collections[slug as CollectionSlug];
  const access = await docAccessOperation({ collection: collectionConfig, id, req: api.req });
  const publishAccess = schema.drafts
    ? await docAccessOperation({ collection: collectionConfig, id, data: { ...doc, _status: 'published' }, req: api.req })
    : access;
```

and return `publish: publishAccess.update === true` in `permissions`.

In `apps/cms/src/studio/document/EditView.tsx`: add `readonly publish: boolean` to `permissions` in `EditViewProps`, and pass a new `canPublish={props.permissions.publish}` prop to `PublishControl`. In `PublishControl.tsx`, add `readonly canPublish: boolean` and render the Publish button only when `canPublish` is true (Save draft stays). Also block `save('publish')` in `EditView` when `!props.permissions.publish`, so ⌘↵ does nothing for authors: add `if (intent === 'publish' && !props.permissions.publish) return;` at the top of `save` and add `props.permissions.publish` to its dependency list (Biome's `useExhaustiveDependencies` fails otherwise). Rename the local `canPublish` inside `PublishControl` (the button's enabled state) to `publishable`, so it does not clash with the new prop.

In the create route (`new/page.tsx`), compute it the same way without an id:

```tsx
import { type CollectionSlug, docAccessOperation } from 'payload';
import { studioApi } from '@/studio/server/payload';
```

```tsx
  const api = await studioApi(session);
  const publishCheck = schema.drafts
    ? await docAccessOperation({ collection: session.payload.collections[collection as CollectionSlug], data: { _status: 'published' }, req: api.req })
    : null;
```

and pass `permissions={{ update: false, delete: false, create: true, publish: publishCheck ? publishCheck.create === true : true }}`.

Then re-run `pnpm --filter @cleanstart/cms exec vitest run src/studio && pnpm --filter @cleanstart/cms typecheck`.

- [ ] **Step 8: End-to-end proof through Payload's REST API**

These collections reach Studio's screens in Phase 4, so the rules are proven at the API level now (the same rules both admins use).

`apps/cms/tests/e2e/studio/author-drafts.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

test.describe('@studio author drafting (D-6)', () => {
  test('an author drafts, cannot publish, cannot touch others, and can delete their own draft', async ({ page, browser }) => {
    await signIn(page, 'author');
    const slug = `author-e2e-${Date.now()}`;

    const created = await page.request.post('/api/blogs?draft=true', { data: { title: 'Author draft', slug, _status: 'draft' } });
    expect(created.status()).toBe(201);
    const id = (await created.json()).doc.id as number;

    const edited = await page.request.patch(`/api/blogs/${id}?draft=true`, { data: { title: 'Author draft, edited', _status: 'draft' } });
    expect(edited.ok()).toBe(true);

    const published = await page.request.patch(`/api/blogs/${id}`, { data: { _status: 'published' } });
    expect(published.status()).toBe(403);

    const editorContext = await browser.newContext();
    const editor = await editorContext.newPage();
    await signIn(editor, 'editor');
    const theirs = await editor.request.post('/api/blogs?draft=true', { data: { title: 'Editor draft', slug: `${slug}-editor`, _status: 'draft' } });
    const theirId = (await theirs.json()).doc.id as number;
    expect((await page.request.patch(`/api/blogs/${theirId}?draft=true`, { data: { title: 'Hijack', _status: 'draft' } })).status()).toBe(403);
    expect((await page.request.delete(`/api/blogs/${theirId}`)).status()).toBe(403);

    expect((await page.request.delete(`/api/blogs/${id}`)).ok()).toBe(true);
    await editor.request.delete(`/api/blogs/${theirId}`);
    await editorContext.close();
  });

  test('an author can upload media but not delete it', async ({ page }) => {
    await signIn(page, 'author');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const res = await page.request.post('/api/media', {
      multipart: { file: { name: `author-e2e-${Date.now()}.png`, mimeType: 'image/png', buffer: png }, _payload: JSON.stringify({ alt: 'Test pixel' }) },
    });
    expect(res.status()).toBe(201);
    const mediaId = (await res.json()).doc.id as number;
    expect((await page.request.delete(`/api/media/${mediaId}`)).status()).toBe(403);
  });
});
```

If blog creation fails on another required field, add it with a minimal value; if Payload answers 404 rather than 403 for a document the author's `where` rule excludes, assert that status and note it here (Payload returns Forbidden when a where-policy hides the document in update and delete by id). Clean up the uploaded test pixel with an editor session at the end of the second test if the local media folder is shared.

Run: `STUDIO_E2E_PASSWORD=... pnpm --filter @cleanstart/cms test:e2e --grep "author drafting"`
Expected: 2 passed.

- [ ] **Step 9: Check Payload's admin by hand**

Sign in to `/admin` as `studio-author@example.test`: Blogs shows "Create new"; a new draft saves; the Publish button is absent; another person's blog opens read-only; an image uploads from the editor. As an editor, the same blog shows "Created by: Studio Author" in the sidebar and publishes normally.

- [ ] **Step 10: Commit**

```bash
git add apps/cms/src/payload/access/index.ts apps/cms/src/payload/access/author-drafts.test.ts apps/cms/src/payload/fields/created-by.ts apps/cms/src/payload/collections/Blogs.ts apps/cms/src/payload/collections/News.ts apps/cms/src/payload/collections/Guides.ts apps/cms/src/payload/collections/KnowledgeBase.ts apps/cms/src/payload/collections/Resources.ts apps/cms/src/payload/collections/Media.ts apps/cms/src/migrations/20261016_120000_add_created_by.ts apps/cms/src/migrations/index.ts apps/cms/src/payload-types.ts apps/cms/src/studio/server/loaders/document.ts apps/cms/src/studio/document/EditView.tsx apps/cms/src/studio/document/PublishControl.tsx "apps/cms/src/app/(studio)/studio/(app)/collections/[collection]/new/page.tsx" apps/cms/tests/e2e/studio/author-drafts.spec.ts
git commit -m "feat(cms): T1.19 authors draft their own content (D-6)"
```

Before this reaches production: brief editors that authors can now create drafts and upload images, and that publishing stays with them.

### Task 1.20: Phase 1 review and sign-off

- [ ] **Step 1: Full Gate A run**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms verify:studio-boundaries
pnpm --filter @cleanstart/cms verify:studio-coverage
pnpm --filter @cleanstart/cms verify:types
pnpm --filter @cleanstart/cms verify:payload-ui
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/ui test
```

Expected: every command exits 0. Run the build in a clean worktree if the shared checkout has other sessions' uncommitted work.

- [ ] **Step 2: Gate B on the whole phase**

Run `/codex` review and `/code-review high` on the range from `studio-p0` to `HEAD`. Resolve every finding or answer it in writing below.

- [ ] **Step 3: Gate C on every Phase 1 screen**

Screenshots at 1440×900 (light and dark) and 1280×800 of: sign in, forgot password, reset password, Home, redirects list (with rows, empty search result), redirect create with the validation summary, redirect edit with the rail, job location create with a slug collision, account. Keyboard walkthrough of the same flows. Review against `docs/studio/01-DESIGN-SYSTEM.md` §10.

- [ ] **Step 4: Tick the parity rows**

In `docs/studio/03-FIELD-AND-COMPONENT-MAP.md` §C tick `jobLocations` (test `studio-job-locations.spec.ts`). Leave `redirects` unticked: its row also covers the Phase 5 staleness pill and import drawer.

- [ ] **Step 5: Product sign-off**

Demo every Phase 1 exit criterion from `docs/studio/00-MASTER-PLAN.md`, in both themes, then record:

```
Phase 1 sign-off
Gate A: <date, all green, CI run link>
Gate B: Codex <n findings, resolved> · code-review <n findings, resolved>
Gate C: reviewer <name>, <date>
Product owner: <name>, <date>
Deferred to Phase 2: <list or "none">
```

- [ ] **Step 6: Tag and write the Phase 2 plan**

```bash
git tag studio-p1 && git push origin studio-p1
```

Then write `docs/superpowers/plans/<date>-studio-phase-2-form-engine-and-media.md` with the writing-plans skill, against the code as it now exists. Its first task is the media library composition for design approval (`00-MASTER-PLAN.md` Phase 0 note).

---

## Appendix A: every condition site (generated 2026-10-16)

Generated from `apps/cms/src/payload/**` by scanning for `condition:`. Key = owner file stem plus the nearest field `name`; `kindIs(...)` sites get one key per kind. The pass-through line in `fields/media-upload.ts` stays as it is (its callers are listed as their own sites). Regenerate this list in Task 1.6 Step 1 and work from the fresh one if counts differ.

| # | Site | Registry key | Current code (first line) |
|---|---|---|---|
| 1 | `collections/CaseStudies.ts:195` | `caseStudies.quoteAuthor` | `condition: (_data, sibling) => Boolean(sibling?.quote),` |
| 2 | `collections/CaseStudies.ts:203` | `caseStudies.quoteRole` | `condition: (_data, sibling) => Boolean(sibling?.quote),` |
| 3 | `collections/Events.ts:144` | `events.registrationUrl` | `condition: (_data, sibling) => sibling?.registrationMode === 'external',` |
| 4 | `collections/Events.ts:163` | `events.registrationForm` | `condition: (_data, sibling) => sibling?.registrationMode === 'internal',` |
| 5 | `collections/Events.ts:181` | `events.attendeesCap` | `condition: (_data, sibling) => sibling?.registrationMode === 'internal',` |
| 6 | `collections/Events.ts:211` | `events.label` | `condition: (_data, sibling) => sibling?.enabled === true,` |
| 7 | `collections/Events.ts:229` | `events.url` | `condition: (_data, sibling) => sibling?.enabled === true,` |
| 8 | `collections/Events.ts:269` | `events.cancelledAt` | `condition: (_data, sibling) => sibling?.eventStatus === 'cancelled',` |
| 9 | `collections/Events.ts:280` | `events.previousStartDate` | `condition: (_data, sibling) => sibling?.eventStatus === 'postponed',` |
| 10 | `collections/Forms.ts:77` | `forms.label` | `condition: (_data, sibling) =>` |
| 11 | `collections/Forms.ts:97` | `forms.requireBusinessEmail` | `condition: (_data, sibling) => sibling?.type === 'email',` |
| 12 | `collections/Forms.ts:104` | `forms.placeholder` | `condition: (_data, sibling) => PLACEHOLDER_TYPES.includes(sibling?.type ?? ''),` |
| 13 | `collections/Forms.ts:114` | `forms.options` | `condition: (_data, sibling) => sibling?.type === 'select',` |
| 14 | `collections/Forms.ts:127` | `forms.consentText` | `condition: (_data, sibling) => sibling?.type === 'consent',` |
| 15 | `collections/Forms.ts:135` | `forms.validation` | `condition: (_data, sibling) => VALIDATION_TYPES.includes(sibling?.type ?? ''),` |
| 16 | `collections/Forms.ts:220` | `forms.body` | `condition: (_data, sibling) => sibling?.kind === 'message',` |
| 17 | `collections/Forms.ts:227` | `forms.url` | `condition: (_data, sibling) => sibling?.kind === 'redirect',` |
| 18 | `collections/Integrations.ts:191` | `integrations.kind.teamsWorkflow` | `condition: kindIs('teamsWorkflow'),` |
| 19 | `collections/Integrations.ts:274` | `integrations.kind.genericWebhook` | `condition: kindIs('genericWebhook'),` |
| 20 | `collections/Integrations.ts:312` | `integrations.kind.hubspotCrm` | `condition: kindIs('hubspotCrm'),` |
| 21 | `collections/Integrations.ts:397` | `integrations.kind.ga4DataApi` | `condition: kindIs('ga4DataApi'),` |
| 22 | `collections/Integrations.ts:419` | `integrations.kind.gscSearchAnalyticsApi+gscUrlInspectionApi` | `condition: kindIs(['gscSearchAnalyticsApi', 'gscUrlInspectionApi']),` |
| 23 | `collections/Integrations.ts:442` | `integrations.kind.msClarity` | `condition: kindIs('msClarity'),` |
| 24 | `collections/Integrations.ts:466` | `integrations.kind.cloudflareWebAnalytics` | `condition: kindIs('cloudflareWebAnalytics'),` |
| 25 | `collections/Integrations.ts:488` | `integrations.kind.calComInbound` | `condition: kindIs('calComInbound'),` |
| 26 | `collections/Integrations.ts:566` | `integrations.routing` | `condition: (_, sibling) => isDispatching(sibling),` |
| 27 | `collections/Integrations.ts:684` | `integrations.testAction` | `condition: (_, sibling) => isDispatching(sibling),` |
| 28 | `collections/Integrations.ts:697` | `integrations.auditTrail` | `condition: (_, sibling) => isDispatching(sibling),` |
| 29 | `collections/Jobs.ts:85` | `jobs.atsUrl` | `condition: (_data, sibling) => sibling?.source === 'ats',` |
| 30 | `collections/Jobs.ts:212` | `jobs.abstract` | `condition: (_data, sibling) => sibling?.source === 'cms',` |
| 31 | `collections/Jobs.ts:219` | `jobs.body` | `condition: (_data, sibling) => sibling?.source === 'cms',` |
| 32 | `collections/Jobs.ts:227` | `jobs.descriptionPdf` | `condition: (_data, sibling) => (sibling as { source?: string } \| undefined)?.source === 'cms',` |
| 33 | `collections/Jobs.ts:234` | `jobs.applyUrl` | `condition: (_data, sibling) => sibling?.source === 'cms',` |
| 34 | `collections/Jobs.ts:259` | `jobs.applicationDeadline` | `condition: (_data, sibling) => sibling?.hiringStatus === 'open',` |
| 35 | `collections/Jobs.ts:269` | `jobs.expiresAt` | `condition: (_data, sibling) => sibling?.hiringStatus === 'open',` |
| 36 | `collections/Jobs.ts:279` | `jobs.closedAt` | `condition: (_data, sibling) => sibling?.hiringStatus === 'closed',` |
| 37 | `collections/Media.ts:143` | `media.decorative` | `condition: (_data, siblingData) => isImage(siblingData?.mimeType),` |
| 38 | `collections/Media.ts:152` | `media.alt` | `condition: (_data, siblingData) =>` |
| 39 | `collections/Media.ts:189` | `media.focalPoint` | `condition: (_data, siblingData) => isImage(siblingData?.mimeType),` |
| 40 | `collections/PageRegistry.ts:154` | `pageRegistry.backingCollection` | `condition: (_data, siblingData) =>` |
| 41 | `collections/Redirects.ts:85` | `redirects.to` | `condition: (_data, sibling) => sibling?.status !== '410',` |
| 42 | `collections/Resources.ts:117` | `resources.gateForm` | `condition: (_data, sibling) => sibling?.gated === true,` |
| 43 | `collections/Resources.ts:150` | `resources.accessLevel` | `condition: (_data, sibling) => sibling?.gated === true,` |
| 44 | `collections/Resources.ts:188` | `resources.downloadCount` | `condition: (_data, sibling) => sibling?.gated === true,` |
| 45 | `collections/Webinars.ts:141` | `webinars.startsAt` | `condition: (_data, sibling) => sibling?.webinarType !== 'on-demand',` |
| 46 | `collections/Webinars.ts:152` | `webinars.endsAt` | `condition: (_data, sibling) => sibling?.webinarType !== 'on-demand',` |
| 47 | `collections/Webinars.ts:178` | `webinars.registrationUrl` | `condition: (_data, sibling) => sibling?.registrationMode === 'external',` |
| 48 | `collections/Webinars.ts:198` | `webinars.registrationForm` | `condition: (_data, sibling) => sibling?.registrationMode === 'internal',` |
| 49 | `collections/Webinars.ts:217` | `webinars.attendeesCap` | `condition: (_data, sibling) => sibling?.registrationMode === 'internal',` |
| 50 | `collections/Webinars.ts:254` | `webinars.cancelledAt` | `condition: (_data, sibling) => sibling?.eventStatus === 'cancelled',` |
| 51 | `collections/Webinars.ts:265` | `webinars.previousStartDate` | `condition: (_data, sibling) => sibling?.eventStatus === 'postponed',` |
| 52 | `globals/_navItem.ts:36` | `_navItem.target` | `condition: (_data, sibling) =>` |
| 53 | `globals/_navItem.ts:62` | `_navItem.href` | `condition: (_data, sibling) =>` |
| 54 | `globals/_navItem.ts:90` | `_navItem.targetBlank` | `condition: (_data, sibling) =>` |
| 55 | `globals/_navItem.ts:104` | `_navItem.variant` | `condition: (_data, sibling) => sibling?.kind === 'cta',` |
| 56 | `globals/_navItem.ts:112` | `_navItem.trackingId` | `condition: (_data, sibling) => sibling?.kind === 'cta',` |
| 57 | `globals/seoDefaults.ts:335` | `seoDefaults.foundingDate` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 58 | `globals/seoDefaults.ts:343` | `seoDefaults.slogan` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 59 | `globals/seoDefaults.ts:354` | `seoDefaults.masthead` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 60 | `globals/seoDefaults.ts:364` | `seoDefaults.ethicsPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 61 | `globals/seoDefaults.ts:374` | `seoDefaults.correctionsPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 62 | `globals/seoDefaults.ts:388` | `seoDefaults.factCheckingPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 63 | `globals/seoDefaults.ts:398` | `seoDefaults.actionableFeedbackPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 64 | `globals/seoDefaults.ts:408` | `seoDefaults.unnamedSourcesPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 65 | `globals/seoDefaults.ts:418` | `seoDefaults.diversityPolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 66 | `globals/seoDefaults.ts:428` | `seoDefaults.ownershipFundingInfo` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 67 | `globals/seoDefaults.ts:440` | `seoDefaults.coveragePolicy` | `condition: (_data, siblingData) => siblingData?.enabled === true,` |
| 68 | `fields/link.ts:70` | `link.target` | `condition: (_data, sibling) => sibling?.kind === 'doc',` |
| 69 | `fields/link.ts:86` | `link.mediaTarget` | `condition: (_data, sibling) =>` |
| 70 | `fields/link.ts:94` | `link.url` | `condition: (_data, sibling) => sibling?.kind === 'url',` |
| 71 | `fields/link.ts:117` | `link.newTab` | `condition: (_data, sibling) => sibling?.kind === 'url',` |
| 72 | `fields/media-upload.ts:99` | `(pass-through, keep)` | `...(opts.condition ? { condition: opts.condition } : {}),` |
| 73 | `fields/schema-addons.ts:233` | `schema-addons.ratingCount` | `condition: (_data, sibling) =>` |
| 74 | `fields/schema-addons.ts:264` | `schema-addons.crumbs` | `condition: (_data, sibling) =>` |
| 75 | `fields/seo.ts:79` | `seo.ogImageAlt` | `condition: (_data, siblingData) => Boolean(siblingData?.ogImage),` |
| 76 | `fields/seo.ts:100` | `seo.ogTitle` | `condition: (_data, siblingData) => siblingData?.useAdvancedOg === true,` |
| 77 | `fields/seo.ts:108` | `seo.ogDescription` | `condition: (_data, siblingData) => siblingData?.useAdvancedOg === true,` |
| 78 | `fields/seo.ts:142` | `seo.twitterCard` | `condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,` |
| 79 | `fields/seo.ts:150` | `seo.twitterTitle` | `condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,` |
| 80 | `fields/seo.ts:158` | `seo.twitterDescription` | `condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,` |
| 81 | `fields/seo.ts:166` | `seo.twitterImage` | `condition: (_data, siblingData) =>` |
| 82 | `blocks/FormBlock.ts:28` | `formBlock.postSubmit` | `admin: { condition: (_data, sibling) => sibling?.overridePostSubmit === true },` |
| 83 | `blocks/FormBlock.ts:42` | `formBlock.body` | `admin: { condition: (_data, sibling) => sibling?.kind === 'message' },` |
| 84 | `blocks/FormBlock.ts:47` | `formBlock.url` | `admin: { condition: (_data, sibling) => sibling?.kind === 'redirect' },` |
| 85 | `blocks/Hero.ts:45` | `hero.media` | `condition: (_data, sibling) => {` |
| 86 | `blocks/Pricing.ts:123` | `pricing.highlightLabel` | `condition: (_data, sibling) => sibling?.highlight === true,` |
| 87 | `blocks/Table.ts:90` | `table.value` | `condition: (_data, sibling) =>` |

## Appendix B: every validator site (generated 2026-10-16)

Named helpers are registered once, by function. Inline functions are extracted into a named function registered under the key shown. The implementer sets each kind by reading the body: anything that uses `req`, `payload` or a database query is `server`; everything else is `pure`.

| # | Site | Registry key | Current code (first line) |
|---|---|---|---|
| 1 | `collections/AboutGalleries.ts:67` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 2 | `collections/Authors.ts:94` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 3 | `collections/Authors.ts:100` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 4 | `collections/Authors.ts:106` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 5 | `collections/Authors.ts:112` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 6 | `collections/Blogs.ts:186` | `blogs.ctaImage` | `validate: (value: string \| null \| undefined): true \| string => {` |
| 7 | `collections/CareerApplications.ts:69` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 8 | `collections/EmailSignatures.ts:117` | `emailSignatures.phoneE164` | `validate: (value: string \| string[] \| null \| undefined): true \| string => {` |
| 9 | `collections/Events.ts:99` | `events.endsAt` | `validate: (` |
| 10 | `collections/Events.ts:146` | `events.registrationUrl` | `validate: (` |
| 11 | `collections/Events.ts:165` | `events.registrationForm` | `validate: (` |
| 12 | `collections/Events.ts:213` | `events.label` | `validate: (` |
| 13 | `collections/Events.ts:231` | `events.url` | `validate: (` |
| 14 | `collections/Forms.ts:230` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 15 | `collections/JobLocations.ts:43` | `jobLocations.isoCountry` | `validate: (value: string \| string[] \| null \| undefined): true \| string => {` |
| 16 | `collections/Jobs.ts:88` | `jobs.atsUrl` | `validate: (` |
| 17 | `collections/Jobs.ts:181` | `jobs.max` | `validate: (` |
| 18 | `collections/Jobs.ts:237` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 19 | `collections/Media.ts:155` | `media.alt` | `validate: (` |
| 20 | `collections/News.ts:167` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 21 | `collections/PageRegistry.ts:111` | `validatePath (named helper)` | `validate: validatePath,` |
| 22 | `collections/PageRegistry.ts:249` | `validatePartialOverride (named helper)` | `validate: validatePartialOverride as JSONFieldValidation,` |
| 23 | `collections/Pages.ts:66` | `pages.parent` | `validate: async (` |
| 24 | `collections/PartnerApplications.ts:66` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 25 | `collections/PodcastEpisodes.ts:154` | `validateYoutubeUrl (named helper)` | `validate: validateYoutubeUrl,` |
| 26 | `collections/Redirects.ts:60` | `validatePath (named helper)` | `validate: validatePath,` |
| 27 | `collections/Redirects.ts:91` | `redirects.to` | `validate: (` |
| 28 | `collections/Resources.ts:129` | `resources.gateForm` | `validate: (` |
| 29 | `collections/SignatureTemplates.ts:91` | `signatureTemplates.html` | `validate: (value: string \| null \| undefined): true \| string => {` |
| 30 | `collections/Webinars.ts:145` | `validateScheduledDatePresent (named helper)` | `validate: validateScheduledDatePresent,` |
| 31 | `collections/Webinars.ts:154` | `validateEndsAfterStarts (named helper)` | `validate: validateEndsAfterStarts,` |
| 32 | `collections/Webinars.ts:180` | `webinars.registrationUrl` | `validate: (` |
| 33 | `collections/Webinars.ts:200` | `webinars.registrationForm` | `validate: (` |
| 34 | `collections/Webinars.ts:282` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 35 | `collections/Webinars.ts:291` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 36 | `globals/_navItem.ts:39` | `_navItem.target` | `validate: (` |
| 37 | `globals/_navItem.ts:65` | `_navItem.href` | `validate: (` |
| 38 | `globals/seoDefaults.ts:94` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 39 | `globals/seoDefaults.ts:134` | `seoDefaults.url` | `validate: (value: string \| string[] \| null \| undefined): true \| string =>` |
| 40 | `globals/seoDefaults.ts:153` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 41 | `globals/seoDefaults.ts:234` | `validatePartialOverride (named helper)` | `validate: validatePartialOverride as JSONFieldValidation,` |
| 42 | `globals/seoDefaults.ts:350` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 43 | `globals/seoDefaults.ts:361` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 44 | `globals/seoDefaults.ts:371` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 45 | `globals/seoDefaults.ts:385` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 46 | `globals/seoDefaults.ts:395` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 47 | `globals/seoDefaults.ts:405` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 48 | `globals/seoDefaults.ts:415` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 49 | `globals/seoDefaults.ts:425` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 50 | `globals/seoDefaults.ts:437` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 51 | `globals/siteSettings.ts:24` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 52 | `globals/spotlights.ts:19` | `validateOptionalUrl (named helper)` | `validate: validateOptionalUrl,` |
| 53 | `fields/link.ts:72` | `link.target` | `validate: (` |
| 54 | `fields/link.ts:96` | `link.url` | `validate: (` |
| 55 | `fields/media-upload.ts:86` | `(pass-through, keep)` | `...(opts.validate ? { validate: opts.validate } : {}),` |
| 56 | `fields/seo.ts:341` | `seo.canonicalOverride` | `validate: (` |
| 57 | `fields/seo.ts:400` | `seo.additionalSchema` | `validate: ((value: unknown, ctx: unknown): true \| string => {` |
| 58 | `fields/slug.ts:98` | `slug.unique`, `slug.uniqueComposite` | `validate: async (` |
| 59 | `blocks/Embed.ts:28` | `embed.url` | `validate: (` |
| 60 | `blocks/Pricing.ts:29` | `pricing.tiers` | `validate: (` |
| 61 | `blocks/Table.ts:79` | `table.value` | `validate: (` |
| 62 | `lib/url-shape.ts:86` | `validateOptionalUrl (named helper)` | `*     validate: validateOptionalUrl,` |
