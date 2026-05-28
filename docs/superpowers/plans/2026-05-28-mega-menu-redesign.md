# Mega Menu Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current functional-but-shallow marketing-site mega menu with a best-in-class system: icon-led panels, contextual CTAs, live API-driven Products tile (rotating real images from `images.cleanstart.com`), editorial Resources panel (cross-collection feed + spotlight priority chain), and 3-state Company spotlight chain. Fixes the 11 audit issues in the spec.

**Architecture:** Single `PanelShell` chrome reused by 5 per-trigger `Panel*` components. Server-side data fetchers in `apps/web/src/components/nav/data/` (sort + slice for images, cross-collection merge for feed, priority-chain resolvers for spotlights). Two additive Payload globals (`resourcesSpotlight`, `companySpotlight`) for marketing-self-serve content. Keep `@base-ui/react/navigation-menu` primitive — only the contents change.

**Tech Stack:** Next.js 16 · React 19 · base-ui/react/navigation-menu · Tailwind CSS v4 · Payload 3 (CMS globals) · Vitest (unit tests for pure data functions) · existing `cs-mega-surface` / `cs-btn-glass` tokens (no new top-level CSS).

**Branch:** `development` (per [CLAUDE.md](../../../CLAUDE.md) — no worktree for routine work).

**Design spec:** [docs/superpowers/specs/2026-05-28-mega-menu-redesign-design.md](../specs/2026-05-28-mega-menu-redesign-design.md) (commits `fb6da23`, `67a6198`).

**Pre-completion gates** (per [CLAUDE.md](../../../CLAUDE.md), run after every task that touches `apps/web` or `apps/cms`):

```bash
# apps/web
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build

# apps/cms (Phase 3 only — new globals)
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms generate:types
```

**Forbidden** (per [CLAUDE.md](../../../CLAUDE.md) — hard rules):
- `git add -A` / `git add .` — stage exact paths
- `--no-verify` on commits
- Hand-editing `apps/cms/payload-types.ts` — always regenerate
- Bulk formatter sweeps; only touch files this plan names
- Hardcoded `max-w-[1276px]` / `max-w-[1440px]` — use `<Container>`
- Inline `text-[clamp(...)]` (use `--fs-*` role tokens)

**Branch sync after each phase** (per [CLAUDE.md](../../../CLAUDE.md)):
1. Merge `development → main`
2. Back-merge `main → development`
3. Fast-forward `git push origin development:farheen`
All three must end at the same SHA.

---

## Phase 1 · Foundation + bug fixes (2–3 days, no visible change)

Eight tasks. Goal: every audit-list bug fixed at the substrate level so Phase 2 can rebuild without re-touching these files.

### Task 1.1: Add `icon`/`tagline`/`glow`/`exitHref`/`exitLabel` to `nav-config.ts` schema

**Files:**
- Modify: `apps/web/src/lib/nav-config.ts:9-44`

- [ ] **Step 1: Open `nav-config.ts` and add the new fields to `NavLeaf` and `NavMegaItem`**

Replace lines 9–44 with:

```ts
export type NavLeaf = {
  label: string;
  href: string;
  description?: string;
  /** Default true. Set false to mark unbuilt — renders as aria-disabled span. */
  built?: boolean;
  /** Glyph id from icons/glyphs.ts. Required for mega items in PanelRow. */
  icon?: string;
};

export type NavGroup = {
  title?: string;
  items: NavLeaf[];
};

export type NavMegaItem = {
  kind: "mega";
  label: string;
  /** Required. Shown under the eyebrow in PanelHeader. */
  tagline: string;
  /** Required. Drives the radial-glow accent color in the panel background. */
  glow: "cyan" | "green" | "purple" | "magenta";
  groups: NavGroup[];
  width?: number;
  /** Override the right-aligned exit-link in PanelHeader. */
  exitHref?: string;
  exitLabel?: string;
};

export type NavCompactItem = {
  kind: "compact";
  label: string;
  tagline?: string;
  items: NavLeaf[];
  width?: number;
};

export type NavFlatItem = {
  kind: "flat";
  label: string;
  href: string;
  built?: boolean;
};

export type NavItem = NavMegaItem | NavCompactItem | NavFlatItem;
```

- [ ] **Step 2: Run typecheck — it should fail with missing `tagline`/`glow` on every mega item**

Run:
```bash
pnpm --filter @cleanstart/web typecheck
```
Expected: 3 errors — one each for `Products`, `Solutions`, `Resources` mega items missing required `tagline` and `glow` props.

- [ ] **Step 3: Add `tagline` and `glow` to each mega entry in `NAV_TREE`**

Locate `NAV_TREE` (currently starting at line 46). Update the mega items so each declares `tagline` and `glow`. Replace the relevant lines:

Products entry — add after `label: "Products",`:
```ts
    tagline: "Hardened container supply chain — end to end.",
    glow: "cyan",
    exitHref: "/cleanstart-images",
    exitLabel: "Compare all",
```

Solutions entry — add after `label: "Solutions",`:
```ts
    tagline: "Compliance, remediation, and a smaller attack surface.",
    glow: "green",
    exitHref: "/solutions",
    exitLabel: "All solutions",
```

Resources entry — add after `label: "Resources",`:
```ts
    tagline: "Read, watch, learn — and meet us in person.",
    glow: "cyan",
    exitHref: "/resource-center",
    exitLabel: "Browse all",
```

Promote Audience from `compact` to `mega` with two persona-card items (see Task 2.12 for `PanelAudience`). For now in `nav-config.ts`:
```ts
  {
    kind: "mega",
    label: "Audience",
    tagline: "Built for the people who ship and the people who sign off.",
    glow: "purple",
    groups: [
      {
        items: [
          {
            label: "For Developers",
            href: "/for-developers",
            description: "Hardened base images, signed SBOMs, and zero workflow friction.",
            icon: "tools",
            built: true,
          },
          {
            label: "For CISO",
            href: "/for-ciso",
            description: "Provable supply-chain integrity, audit-ready, and FIPS where you need it.",
            icon: "hash",
            built: true,
          },
        ],
      },
    ],
    width: 640,
  },
```

Promote Company from `compact` to `mega`:
```ts
  {
    kind: "mega",
    label: "Company",
    tagline: "The team rebuilding the base layer of open source.",
    glow: "magenta",
    exitHref: "mailto:careers@cleanstart.com",
    exitLabel: "careers@",
    groups: [
      {
        items: [
          { label: "About Us", href: "/about-us", description: "Why we started, where we're going.", icon: "info", built: true },
          { label: "Teams", href: "/teams", description: "The engineers, designers, and operators behind it.", icon: "users", built: true },
          { label: "Community", href: "/community", description: "Open builds, public discussions, contributor program.", icon: "network", built: true },
          { label: "Careers", href: "/careers", description: "Hiring engineers, SEs, and designers.", icon: "star", built: true },
          { label: "Contact Us", href: "/contact-us", description: "Sales, support, partnerships, press.", icon: "mail", built: true },
        ],
      },
    ],
    width: 760,
  },
```

Products group items — add `icon` field to each:
```ts
{ label: "CleanStart Images", href: "/cleanstart-images", description: "...", icon: "container", built: true },
{ label: "CleanStart SBOM", href: "/software-bill-materials", description: "...", icon: "doc-signed", built: true },
{ label: "CleanSight", href: "/cleansight", description: "...", icon: "radar", built: true },
```

Solutions group items — add `icon` field:
```ts
{ label: "FIPS Compliance", href: "/fips", description: "...", icon: "shield-check", built: true },
{ label: "Enhance SCA", href: "/software-composition-analysis", description: "...", icon: "gears", built: true },
{ label: "Vulnerability Remediation", href: "/vulnerability-remediation", description: "...", icon: "refresh", built: true },
{ label: "Attack Surface Reduction", href: "/attack-surface-reduction", description: "...", icon: "minimize", built: true },
```

Resources keeps its two groups (Insights, Events) with `tagline`/`glow` on the parent only; group items add `icon`:
```ts
// Insights group
{ label: "Blogs", href: "/blogs", icon: "book", built: true },
{ label: "Resource Center", href: "/resource-center", icon: "folder", built: true },
{ label: "Newsroom", href: "/news", icon: "newspaper", built: true },
{ label: "Knowledge Hub", href: "/knowledge-hub/vex-documents", icon: "book-open", built: true },

// Events group
{ label: "In-Person Events", href: "/events", icon: "calendar", built: true },
{ label: "Webinars", href: "/webinars", icon: "play", built: true },
{ label: "Podcast", href: "/podcast", icon: "mic", built: true },
```

- [ ] **Step 4: Run typecheck — should now pass**

Run:
```bash
pnpm --filter @cleanstart/web typecheck
```
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/nav-config.ts
git commit -m "feat(nav): extend nav-config schema with icon/tagline/glow/exit fields

Adds the fields the new PanelShell + PanelRow design needs:
- NavLeaf.icon (glyph id from icons/glyphs.ts)
- NavMegaItem.tagline (required, shown under eyebrow)
- NavMegaItem.glow (cyan/green/purple/magenta — drives panel accent)
- NavMegaItem.exitHref/exitLabel (right-aligned PanelHeader link)

Promotes Audience and Company from compact to mega. Adds icons to
every leaf. No behavior change yet — components still render the
old MegaMenu, which ignores the new fields."
```

---

### Task 1.2: Flip `NavLeaf.built` default to `true`

**Files:**
- Modify: `apps/web/src/lib/nav-config.ts`
- Modify: `apps/web/src/components/nav/MegaMenu.tsx:88-94`
- Modify: `apps/web/src/components/nav/MobileNav.tsx:99-112`

- [ ] **Step 1: Strip explicit `built: true` from every entry**

In `apps/web/src/lib/nav-config.ts`, remove `built: true` from every leaf in `NAV_TREE`. Leave `built: false` only where the entry is genuinely unbuilt — for now, none of the existing entries qualify (all are marked `built: true` today).

- [ ] **Step 2: Update the JSDoc comment on `built` to reflect the flip**

The comment in Task 1.1's schema already says `Default true. Set false to mark unbuilt`. Confirm it's present and accurate.

- [ ] **Step 3: Update `MegaMenu.tsx` to default-true the check**

Open `apps/web/src/components/nav/MegaMenu.tsx`. Locate line 88 (`{item.built ? (`). Replace the `built` check with `item.built !== false`:

```tsx
return (
  <li key={item.label}>
    {item.built !== false ? (
      <Link href={item.href} className={cls}>
        {inner}
      </Link>
    ) : (
      <span className={`${cls} cursor-pointer`}>{inner}</span>
    )}
  </li>
);
```

- [ ] **Step 4: Update `MobileNav.tsx` to the same logic in both places**

In `apps/web/src/components/nav/MobileNav.tsx`:

Flat item check (around line 61):
```tsx
return item.built !== false ? (
  <Link key={item.label} href={item.href} className={flatClass}>
    {item.label}
  </Link>
) : (
  <span key={item.label} className={flatClass}>
    {item.label}
  </span>
);
```

Leaf item check (around line 100):
```tsx
{leaf.built !== false ? (
  <Link
    href={leaf.href}
    onClick={close}
    className="block rounded-[8px] px-3 py-2 text-sm text-white/80 no-underline transition-colors hover:bg-white/[0.06] hover:text-white"
  >
    {leaf.label}
  </Link>
) : (
  <span className="block cursor-pointer rounded-[8px] px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white">
    {leaf.label}
  </span>
)}
```

- [ ] **Step 5: Verify all routes still render as `<Link>` (no regression)**

```bash
pnpm --filter @cleanstart/web dev
```

Open `http://localhost:3001`. Hover Products, Solutions, Resources, Company. Every leaf must be a real link (cursor:pointer, ctrl-click opens new tab). Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/nav-config.ts apps/web/src/components/nav/MegaMenu.tsx apps/web/src/components/nav/MobileNav.tsx
git commit -m "fix(nav): flip built default to true

Stops forgotten built flags from silently downgrading real routes to
dead spans. New semantics: omit built => Link, explicit false => span.

All current entries are built — removed every explicit built: true,
left no built: false anywhere. Audit issue #4."
```

---

### Task 1.3: Create `useIsActiveSection` hook

**Files:**
- Create: `apps/web/src/components/nav/useIsActiveSection.ts`
- Create: `apps/web/src/components/nav/useIsActiveSection.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/nav/useIsActiveSection.test.ts`:

```ts
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useIsActiveSection } from './useIsActiveSection';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('useIsActiveSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when pathname exactly matches one of the section hrefs', () => {
    vi.mocked(usePathname).mockReturnValue('/cleansight');
    const { result } = renderHook(() =>
      useIsActiveSection(['/cleanstart-images', '/software-bill-materials', '/cleansight']),
    );
    expect(result.current).toBe(true);
  });

  it('returns true when pathname is a sub-route of a section href', () => {
    vi.mocked(usePathname).mockReturnValue('/cleanstart-images/python');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images']));
    expect(result.current).toBe(true);
  });

  it('returns false when pathname is /cleanstart-imagesomething (false-prefix guard)', () => {
    vi.mocked(usePathname).mockReturnValue('/cleanstart-imagesomething');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images']));
    expect(result.current).toBe(false);
  });

  it('returns false when no href matches', () => {
    vi.mocked(usePathname).mockReturnValue('/about-us');
    const { result } = renderHook(() => useIsActiveSection(['/cleanstart-images', '/cleansight']));
    expect(result.current).toBe(false);
  });

  it('ignores the root href "/" to avoid matching everything', () => {
    vi.mocked(usePathname).mockReturnValue('/blogs');
    const { result } = renderHook(() => useIsActiveSection(['/']));
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test — it should fail with "module not found"**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/useIsActiveSection.test.ts
```
Expected: FAIL — "Cannot find module './useIsActiveSection'".

- [ ] **Step 3: Implement the hook**

Create `apps/web/src/components/nav/useIsActiveSection.ts`:

```ts
'use client';

import { usePathname } from 'next/navigation';

/**
 * Returns true when the current pathname matches any of the supplied hrefs
 * exactly, or is a sub-route of one of them.
 *
 * Used by DesktopNav triggers to render the active-state styling when the
 * user is on a page that belongs to that section (e.g. Products trigger
 * stays active on /cleansight, /cleanstart-images, /software-bill-materials).
 *
 * The root href "/" is ignored on purpose — it would match everything.
 */
export function useIsActiveSection(hrefs: readonly string[]): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  return hrefs.some((href) => {
    if (href === '/' || href === '') return false;
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  });
}
```

- [ ] **Step 4: Run the test — it should pass**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/useIsActiveSection.test.ts
```
Expected: PASS, 5/5 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/useIsActiveSection.ts apps/web/src/components/nav/useIsActiveSection.test.ts
git commit -m "feat(nav): add useIsActiveSection hook

Returns true when pathname exactly matches or is a sub-route of any
href in the section. Sub-route check uses startsWith(\`\${href}/\`) so
/cleanstart-imagesomething is correctly rejected. Root '/' explicitly
excluded — would otherwise match everything.

Audit issue #3."
```

---

### Task 1.4: Wire active-route state on `DesktopNav` triggers

**Files:**
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`
- Modify: `apps/web/src/components/ui/navigation-menu.tsx:58-60`

- [ ] **Step 1: Update `navigationMenuTriggerStyle` to support `data-active`**

In `apps/web/src/components/ui/navigation-menu.tsx`, locate the `navigationMenuTriggerStyle` cva at line 58. Append `data-[active=true]:text-white data-[active=true]:after:opacity-100` to the base class string. Final cva:

```ts
const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger relative inline-flex h-9 w-max cursor-pointer items-center justify-center px-0 py-1.5 text-base font-medium leading-none text-white/85 transition-colors outline-none hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:rounded-sm disabled:pointer-events-none disabled:opacity-50 data-popup-open:text-white data-open:text-white data-[active=true]:text-white after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#2cc1eb] after:opacity-0 after:transition-opacity data-[active=true]:after:opacity-100"
)
```

- [ ] **Step 2: Helper to collect hrefs out of a NavItem**

Add this private helper near the top of `apps/web/src/components/nav/DesktopNav.tsx` (above `DesktopNav`):

```ts
import type { NavItem } from "@/lib/nav-config";

function collectHrefs(item: NavItem): string[] {
  if (item.kind === "flat") return [item.href];
  if (item.kind === "compact") return item.items.map((i) => i.href);
  return item.groups.flatMap((g) => g.items.map((i) => i.href));
}
```

- [ ] **Step 3: Use the hook on each trigger**

Replace the body of `DesktopNav` to apply `data-active`:

```tsx
"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { NAV_TREE, type NavItem } from "@/lib/nav-config";
import { MegaMenu } from "@/components/nav/MegaMenu";
import { useIsActiveSection } from "@/components/nav/useIsActiveSection";

function collectHrefs(item: NavItem): string[] {
  if (item.kind === "flat") return [item.href];
  if (item.kind === "compact") return item.items.map((i) => i.href);
  return item.groups.flatMap((g) => g.items.map((i) => i.href));
}

function TopLevelItem({ item }: { item: NavItem }) {
  const active = useIsActiveSection(collectHrefs(item));

  if (item.kind === "flat") {
    const flatClass =
      "cs-nav-link relative inline-flex cursor-pointer items-center text-base font-medium leading-none text-white/85 transition-colors hover:text-white data-[active=true]:text-white";
    return (
      <NavigationMenuItem>
        {item.built !== false ? (
          <Link href={item.href} className={flatClass} data-active={active}>
            {item.label}
          </Link>
        ) : (
          <span className={flatClass} data-active={active}>
            {item.label}
          </span>
        )}
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={navigationMenuTriggerStyle()}
        data-active={active}
      >
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <MegaMenu
          groups={
            item.kind === "mega" ? item.groups : [{ items: item.items }]
          }
          activeLabel={item.label}
          {...(item.width !== undefined ? { width: item.width } : {})}
        />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function DesktopNav() {
  return (
    <NavigationMenu className="hidden lg:flex" align="center">
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => (
          <TopLevelItem key={item.label} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

- [ ] **Step 4: Manual test — every section trigger lights up on its own routes**

```bash
pnpm --filter @cleanstart/web dev
```

Visit:
- `http://localhost:3001/cleansight` → Products trigger underlined cyan
- `http://localhost:3001/fips` → Solutions trigger underlined
- `http://localhost:3001/for-developers` → Audience trigger underlined
- `http://localhost:3001/blogs` → Resources trigger underlined
- `http://localhost:3001/about-us` → Company trigger underlined
- `http://localhost:3001/partners` → Partners flat link underlined

Stop dev server.

- [ ] **Step 5: Run lint + typecheck**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/nav/DesktopNav.tsx apps/web/src/components/ui/navigation-menu.tsx
git commit -m "feat(nav): active-route state on top-level triggers

Each NavigationMenuTrigger gains a 2px cyan underline when the user
is on any page that belongs to that section. Driven by useIsActiveSection
+ data-active attribute + after:pseudo styled in navigationMenuTriggerStyle.

Audit issue #3."
```

---

### Task 1.5: Add hover-intent delays to `NavigationMenu.Root`

**Files:**
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`

- [ ] **Step 1: Add `delay` + `closeDelay` props to `NavigationMenu`**

In `DesktopNav.tsx`, update the `NavigationMenu` element:

```tsx
<NavigationMenu className="hidden lg:flex" align="center" delay={120} closeDelay={200}>
```

(`120 ms` open delay prevents accidental flickers; `200 ms` close delay gives the diagonal-cursor safe triangle.)

- [ ] **Step 2: Manual test — diagonal cursor moves no longer close the panel**

```bash
pnpm --filter @cleanstart/web dev
```

Open Products. Move the cursor diagonally toward the right side of the panel. Confirm panel stays open. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/DesktopNav.tsx
git commit -m "fix(nav): add hover-intent delays to mega menu

delay={120} prevents flicker on quick mouse passes.
closeDelay={200} forgives diagonal cursor moves between trigger and
panel (the classic safe-triangle problem).

Audit issue #9."
```

---

### Task 1.6: Move `Header` from `components/sections/` to `components/nav/`

**Files:**
- Create: `apps/web/src/components/nav/Header.tsx`
- Delete: `apps/web/src/components/sections/Header.tsx`
- Modify: all files that import `@/components/sections/Header`

- [ ] **Step 1: Find every existing import**

```bash
rg "components/sections/Header" apps/web/src
```

Note every file (likely `apps/web/src/app/layout.tsx` and possibly per-page layouts).

- [ ] **Step 2: Copy the file to the new path**

```bash
cp apps/web/src/components/sections/Header.tsx apps/web/src/components/nav/Header.tsx
```

- [ ] **Step 3: Update every import found in Step 1**

For each file, replace `from "@/components/sections/Header"` with `from "@/components/nav/Header"`.

- [ ] **Step 4: Delete the old file**

```bash
git rm apps/web/src/components/sections/Header.tsx
```

- [ ] **Step 5: Typecheck + build**

```bash
pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/nav/Header.tsx apps/web/src/app
git rm apps/web/src/components/sections/Header.tsx  # idempotent if already staged
git commit -m "refactor(nav): move Header from sections/ to nav/

Header is structurally part of the navigation system, not a 'section'.
Co-locates with DesktopNav, MobileNav, MegaMenu. Prepares for Phase 3
where Header becomes an RSC that server-fetches images and the resource
feed."
```

---

### Task 1.7: Always-on backdrop blur on `Header`

**Files:**
- Modify: `apps/web/src/components/nav/Header.tsx`

- [ ] **Step 1: Update the header className to always blur**

Replace the existing `<header>` element with:

```tsx
<header
  className={`fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,box-shadow] duration-200 ${
    scrolled ? "cs-nav-shadow backdrop-blur-xl" : "backdrop-blur-md bg-[rgba(11,8,22,0.35)]"
  }`}
>
```

Keep the rest of the file unchanged.

- [ ] **Step 2: Visual test at the top of the home hero**

```bash
pnpm --filter @cleanstart/web dev
```

Open `http://localhost:3001`. Above the fold (don't scroll), open the Products mega menu. Confirm there's visual separation between the header bar and the hero — the menu doesn't appear to float on a transparent void.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/Header.tsx
git commit -m "fix(nav): always-on backdrop blur for header above-the-fold

Header was fully transparent at scrollY=0, which made the open mega
menu appear to float on the hero with zero visual separation.

Top state: backdrop-blur-md + 35% black tint.
Scrolled state: stronger blur-xl + shadow (cs-nav-shadow).

Audit issue #10."
```

---

### Task 1.8: Replace unbuilt `<span>` with `aria-disabled` markup

**Files:**
- Modify: `apps/web/src/components/nav/MegaMenu.tsx:88-94`
- Modify: `apps/web/src/components/nav/MobileNav.tsx`

- [ ] **Step 1: Update MegaMenu unbuilt branch**

In `apps/web/src/components/nav/MegaMenu.tsx`, replace the span branch:

```tsx
<li key={item.label}>
  {item.built !== false ? (
    <Link href={item.href} className={cls}>
      {inner}
    </Link>
  ) : (
    <span
      className={`${cls} cursor-default opacity-60`}
      role="link"
      aria-disabled="true"
      tabIndex={-1}
    >
      {inner}
    </span>
  )}
</li>
```

- [ ] **Step 2: Update MobileNav — hide unbuilt items entirely**

In `apps/web/src/components/nav/MobileNav.tsx`, the flat unbuilt branch (~line 62) becomes:

```tsx
if (item.built === false) return null;
return (
  <Link key={item.label} href={item.href} className={flatClass}>
    {item.label}
  </Link>
);
```

For the leaf unbuilt branch (~line 108), replace with:

```tsx
{leaf.built === false ? null : (
  <Link
    href={leaf.href}
    onClick={close}
    className="block rounded-[8px] px-3 py-2 text-sm text-white/80 no-underline transition-colors hover:bg-white/[0.06] hover:text-white"
  >
    {leaf.label}
  </Link>
)}
```

Touch targets shouldn't be ghosts on mobile.

- [ ] **Step 3: Lint + typecheck**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/MegaMenu.tsx apps/web/src/components/nav/MobileNav.tsx
git commit -m "fix(nav): aria-disabled unbuilt items + hide on mobile

Desktop: unbuilt items now render with role=link, aria-disabled=true,
tabIndex=-1, cursor:default, 60% opacity. Screen readers and keyboard
users get a clear signal.

Mobile: unbuilt items hidden entirely — touch targets shouldn't be
ghosts on a small screen.

Audit issue #5."
```

---

### Task 1.9: Phase 1 verification + branch sync

- [ ] **Step 1: Full pre-completion gate**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web exec vitest run
```
Expected: all PASS.

- [ ] **Step 2: Manual smoke**

```bash
pnpm --filter @cleanstart/web dev
```

Check:
- Hover Products → opens. Move diagonally to panel → stays open.
- Visit `/cleansight` → Products trigger underlined.
- Open mobile drawer → no dead `<span>` items visible.
- Above-the-fold open Products → visual separation between header + hero.

Stop dev server.

- [ ] **Step 3: Sync branches per CLAUDE.md**

```bash
git checkout main && git merge --ff-only development
git push origin main
git checkout development && git merge --ff-only main
git push origin development
git push origin development:farheen
git checkout development
```

All three branches must end at the same SHA.

- [ ] **Step 4: Tag the phase**

```bash
git tag -a phase1-foundation -m "Mega menu redesign — Phase 1 (foundation + bug fixes) shipped"
git push origin phase1-foundation
```

---

## Phase 2 · Icon system + panel rewrite (3–4 days)

The new component skeleton lands. No live data yet — all panels render with static fallback content. Visual surface flips here.

### Task 2.1: Create the SVG glyph map

**Files:**
- Create: `apps/web/src/components/nav/icons/glyphs.ts`
- Create: `apps/web/src/components/nav/icons/glyphs.test.ts`

- [ ] **Step 1: Write the test first — every nav-config icon id must resolve**

Create `apps/web/src/components/nav/icons/glyphs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { glyphs } from './glyphs';
import { NAV_TREE } from '@/lib/nav-config';

function collectIcons(): string[] {
  const out: string[] = [];
  for (const item of NAV_TREE) {
    if (item.kind === 'flat') continue;
    const groups = item.kind === 'mega' ? item.groups : [{ items: item.items }];
    for (const g of groups) {
      for (const leaf of g.items) {
        if (leaf.icon) out.push(leaf.icon);
      }
    }
  }
  return out;
}

describe('glyphs', () => {
  it('contains every icon id referenced by nav-config', () => {
    const referenced = collectIcons();
    const missing = referenced.filter((id) => !(id in glyphs));
    expect(missing).toEqual([]);
  });

  it('exports valid React elements for each glyph', () => {
    for (const [id, node] of Object.entries(glyphs)) {
      expect(node, `glyph "${id}" must be defined`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run — should fail with "Cannot find module"**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/icons/glyphs.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Create the glyphs map**

Create `apps/web/src/components/nav/icons/glyphs.ts`:

```ts
import type { ReactNode } from 'react';

/**
 * SVG glyph map. All glyphs are 24×24 viewBox, 1.6 px stroke, currentColor.
 * Consumed by NavIcon.tsx, which sizes the glyph at 20×20 inside a 44×44 tile.
 *
 * Add a new id here; reference it from nav-config.ts; that's the entire surface.
 */
export const glyphs: Record<string, ReactNode> = {
  container: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 11h18" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  'doc-signed': (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <circle cx="17" cy="17" r="2" fill="none" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  gears: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.07 7.07 4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.07-7.07 4.24-4.24" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v5h-5" />
    </>
  ),
  minimize: (
    <>
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  tools: (
    <>
      <path d="m7 8-4 4 4 4" />
      <path d="m17 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </>
  ),
  hash: (
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  folder: (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>
  ),
  newspaper: (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </>
  ),
  'book-open': (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  play: <polygon points="5 3 19 12 5 21 5 3" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <path d="M12 19v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </>
  ),
  star: <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />,
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
};

export type GlyphId = keyof typeof glyphs;
```

- [ ] **Step 4: Tests pass**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/icons/glyphs.test.ts
```
Expected: 2/2 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/icons/glyphs.ts apps/web/src/components/nav/icons/glyphs.test.ts
git commit -m "feat(nav): add SVG glyph map (21 glyphs)

Single map of all icon ids referenced by nav-config. 24×24 viewBox,
1.6px stroke, currentColor. Test asserts every nav-config icon id
resolves — so a missing glyph fails CI, not at runtime.

Audit issue #1 (foundation)."
```

---

### Task 2.2: Create `NavIcon` component

**Files:**
- Create: `apps/web/src/components/nav/icons/NavIcon.tsx`

- [ ] **Step 1: Implement**

```tsx
import { glyphs, type GlyphId } from './glyphs';

type Props = {
  id: GlyphId | string;
  size?: number;
  className?: string;
};

/**
 * Single 20×20 SVG icon rendering one glyph from the map.
 * stroke-width and viewBox are normalized — only the path content varies.
 * If the id is unknown, returns an empty placeholder rect so layout
 * doesn't collapse (defensive; tests assert no unknown ids ship).
 */
export function NavIcon({ id, size = 20, className }: Props) {
  const node = glyphs[id as GlyphId];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {node ?? <rect x="2" y="2" width="20" height="20" rx="3" opacity="0.2" />}
    </svg>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/icons/NavIcon.tsx
git commit -m "feat(nav): NavIcon renders one glyph from the map

20×20 default, 1.6px stroke, currentColor, aria-hidden.
Unknown ids fall back to a low-opacity rect so layout never collapses."
```

---

### Task 2.3: Create `PanelHeader` piece

**Files:**
- Create: `apps/web/src/components/nav/pieces/PanelHeader.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";

type Props = {
  eyebrow: string;
  tagline: string;
  glow: "cyan" | "green" | "purple" | "magenta";
  exitHref?: string;
  exitLabel?: string;
};

const EYEBROW_COLOR: Record<Props["glow"], string> = {
  cyan: "#2cc1eb",
  green: "#6cffc2",
  purple: "#a48cff",
  magenta: "#ff8ab8",
};

export function PanelHeader({ eyebrow, tagline, glow, exitHref, exitLabel }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
      <div>
        <div
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: EYEBROW_COLOR[glow] }}
        >
          {eyebrow}
        </div>
        <div className="mt-0.5 text-[11px] text-white/55">{tagline}</div>
      </div>
      {exitHref && exitLabel && (
        <Link
          href={exitHref}
          className="text-[11px] text-white/50 transition-colors hover:text-white/80"
          aria-label={`Browse all ${eyebrow.toLowerCase()}`}
        >
          {exitLabel} →
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/pieces/PanelHeader.tsx
git commit -m "feat(nav): PanelHeader piece — eyebrow + tagline + exit link"
```

---

### Task 2.4: Create `PanelRow` piece

**Files:**
- Create: `apps/web/src/components/nav/pieces/PanelRow.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: string;
  built?: boolean;
};

const ROW =
  "group/row grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[14px] border border-transparent p-3 transition-all duration-150 hover:border-[rgba(44,193,235,0.18)] hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_rgba(44,193,235,0.08),0_6px_20px_-10px_rgba(44,193,235,0.3)]";
const ICON_TILE =
  "flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/[0.07] bg-white/[0.04] text-white transition-all duration-200 group-hover/row:border-transparent group-hover/row:bg-[linear-gradient(135deg,rgba(71,31,195,0.55),rgba(44,193,235,0.55))] group-hover/row:shadow-[0_4px_14px_-4px_rgba(44,193,235,0.5)]";
const LABEL = "text-sm font-semibold leading-tight text-white";
const DESC = "mt-0.5 text-xs leading-snug text-white/55 group-hover/row:text-white/65";
const ARROW =
  "text-base text-white/25 transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-[#2cc1eb]";

export function PanelRow({ href, label, description, icon, built = true }: Props) {
  const inner = (
    <>
      <div className={ICON_TILE}>
        <NavIcon id={icon} />
      </div>
      <div>
        <div className={LABEL}>{label}</div>
        {description && <div className={DESC}>{description}</div>}
      </div>
      <div className={ARROW}>→</div>
    </>
  );

  if (!built) {
    return (
      <span
        className={`${ROW} cursor-default opacity-60`}
        role="link"
        aria-disabled="true"
        tabIndex={-1}
      >
        {inner}
      </span>
    );
  }
  return (
    <Link href={href} className={ROW}>
      {inner}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/pieces/PanelRow.tsx
git commit -m "feat(nav): PanelRow — icon-led row with hover lift + active mirror"
```

---

### Task 2.5: Create `FeaturedTile` piece

**Files:**
- Create: `apps/web/src/components/nav/pieces/FeaturedTile.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type Glow = "cyan" | "green" | "purple" | "magenta";

const GLOW_BG: Record<Glow, string> = {
  cyan: "radial-gradient(circle, rgba(44,193,235,0.35), transparent 70%)",
  green: "radial-gradient(circle, rgba(108,255,194,0.30), transparent 70%)",
  purple: "radial-gradient(circle, rgba(71,31,195,0.35), transparent 70%)",
  magenta: "radial-gradient(circle, rgba(255,138,184,0.30), transparent 70%)",
};

const BG_GRADIENT: Record<Glow, string> = {
  cyan: "linear-gradient(160deg, #231656 0%, #0d2c3a 100%)",
  green: "linear-gradient(160deg, #2a1056 0%, #0d3a2c 100%)",
  purple: "linear-gradient(160deg, #1a1430 0%, #0d2030 100%)",
  magenta: "linear-gradient(160deg, #3a1644 0%, #0d2c3a 100%)",
};

type Props = {
  href: string;
  glow: Glow;
  pill: ReactNode;
  headline: string;
  sub?: string;
  body?: ReactNode;
  footer?: ReactNode;
  minHeight?: number;
};

export function FeaturedTile({
  href,
  glow,
  pill,
  headline,
  sub,
  body,
  footer,
  minHeight = 240,
}: Props) {
  return (
    <Link
      href={href}
      className="relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-white/[0.08] p-4 transition-transform duration-200 hover:scale-[1.005]"
      style={{ background: BG_GRADIENT[glow], minHeight }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
        style={{ background: GLOW_BG[glow] }}
      />
      <div className="relative z-[1]">
        {pill}
        <div className="mt-3.5 text-[18px] font-bold leading-tight tracking-[-0.01em] text-white">
          {headline}
        </div>
        {sub && (
          <div className="mt-2 text-xs leading-relaxed text-white/70">{sub}</div>
        )}
        {body && <div className="relative z-[1] mt-3">{body}</div>}
      </div>
      {footer && <div className="relative z-[1] mt-3.5">{footer}</div>}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/pieces/FeaturedTile.tsx
git commit -m "feat(nav): FeaturedTile piece — gradient bg + radial glow + slot pattern"
```

---

### Task 2.6: Create `ContextualCTA` piece

**Files:**
- Create: `apps/web/src/components/nav/pieces/ContextualCTA.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";

type Props = {
  headline: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
};

export function ContextualCTA({ headline, sub, ctaLabel, ctaHref }: Props) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2.5 rounded-[12px] border border-white/[0.06] bg-[linear-gradient(90deg,rgba(71,31,195,0.18),rgba(44,193,235,0.18))] px-3.5 py-2.5">
      <div>
        <div className="text-xs font-semibold text-white">{headline}</div>
        {sub && <div className="mt-0.5 text-[10px] text-white/55">{sub}</div>}
      </div>
      <Link
        href={ctaHref}
        className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0b0816] transition-opacity hover:opacity-90"
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/pieces/ContextualCTA.tsx
git commit -m "feat(nav): ContextualCTA piece — replaces generic Book-a-Demo card

Per-panel copy passed in; gradient bar pinned at the bottom.
Audit issue #2."
```

---

### Task 2.7: Create `PersonaCard` piece

**Files:**
- Create: `apps/web/src/components/nav/pieces/PersonaCard.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Variant = "developer" | "ciso";

const STYLES: Record<Variant, { bg: string; border: string; iconBg: string; iconColor: string; link: string }> = {
  developer: {
    bg: "linear-gradient(160deg, rgba(44,193,235,0.18), rgba(71,31,195,0.06))",
    border: "rgba(44,193,235,0.18)",
    iconBg: "linear-gradient(135deg, #471FC3, #2cc1eb)",
    iconColor: "#ffffff",
    link: "#2cc1eb",
  },
  ciso: {
    bg: "linear-gradient(160deg, rgba(108,255,194,0.16), rgba(71,31,195,0.06))",
    border: "rgba(108,255,194,0.18)",
    iconBg: "linear-gradient(135deg, #6cffc2, #2cc1eb)",
    iconColor: "#0b0816",
    link: "#6cffc2",
  },
};

type Props = {
  href: string;
  variant: Variant;
  icon: string;
  label: string;
  description: string;
};

export function PersonaCard({ href, variant, icon, label, description }: Props) {
  const s = STYLES[variant];
  return (
    <Link
      href={href}
      className="flex min-h-[160px] flex-col rounded-[14px] border p-4.5"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ background: s.iconBg, color: s.iconColor }}
      >
        <NavIcon id={icon} />
      </div>
      <div className="mt-3.5 text-[15px] font-bold text-white">{label}</div>
      <div className="mt-1 text-xs leading-snug text-white/65">{description}</div>
      <div className="mt-auto pt-3.5 text-[11px] font-semibold" style={{ color: s.link }}>
        Explore →
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/pieces/PersonaCard.tsx
git commit -m "feat(nav): PersonaCard piece — Audience panel building block"
```

---

### Task 2.8: Create `PanelShell` chrome

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelShell.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { ReactNode } from "react";
import { PanelHeader } from "@/components/nav/pieces/PanelHeader";

type Glow = "cyan" | "green" | "purple" | "magenta";

const PANEL_BG: Record<Glow, string> = {
  cyan:
    "radial-gradient(120% 70% at 100% 0%, rgba(44,193,235,0.20), transparent 55%), linear-gradient(180deg, #1a1330 0%, #120c25 100%)",
  green:
    "radial-gradient(120% 70% at 0% 0%, rgba(108,255,194,0.14), transparent 55%), linear-gradient(180deg, #1a1330 0%, #120c25 100%)",
  purple:
    "radial-gradient(120% 70% at 0% 0%, rgba(71,31,195,0.22), transparent 55%), linear-gradient(180deg, #1a1330 0%, #120c25 100%)",
  magenta:
    "radial-gradient(120% 70% at 0% 0%, rgba(255,138,184,0.16), transparent 55%), linear-gradient(180deg, #1a1330 0%, #120c25 100%)",
};

type Props = {
  width: number;
  glow: Glow;
  eyebrow: string;
  tagline: string;
  exitHref?: string;
  exitLabel?: string;
  children: ReactNode;
};

export function PanelShell({ width, glow, eyebrow, tagline, exitHref, exitLabel, children }: Props) {
  return (
    <div
      className="cs-mega-surface overflow-hidden p-5"
      style={{ width, background: PANEL_BG[glow], borderRadius: 20 }}
    >
      <PanelHeader
        eyebrow={eyebrow}
        tagline={tagline}
        glow={glow}
        {...(exitHref && exitLabel ? { exitHref, exitLabel } : {})}
      />
      <div className="mt-3.5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelShell.tsx
git commit -m "feat(nav): PanelShell — common chrome reused by all 5 panels

Per-glow radial-gradient overlay + linear-gradient bg, 20px radius,
20px padding, hairline border, PanelHeader at the top."
```

---

### Task 2.9: Create `PanelProducts` (static fallback only)

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelProducts.tsx`

- [ ] **Step 1: Implement (live data wired in Phase 3)**

```tsx
import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelProducts({ item }: Props) {
  const products = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      glow={item.glow}
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-1">
          {products.map((p) => (
            <PanelRow
              key={p.label}
              href={p.href}
              label={p.label}
              {...(p.description ? { description: p.description } : {})}
              icon={p.icon ?? "container"}
              built={p.built !== false}
            />
          ))}
        </div>
        <FeaturedTile
          href="/cleanstart-images"
          glow="cyan"
          pill={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">
              <span className="h-1 w-1 rounded-full bg-[#2cc1eb] shadow-[0_0_6px_#2cc1eb]" />
              Featured
            </span>
          }
          headline="Stop patching. Replace the base."
          sub="Drop in hardened containers — keep your stack, lose the CVEs."
          footer={
            <div>
              <div className="rounded-lg border border-[rgba(44,193,235,0.18)] bg-black/30 px-2.5 py-2 font-mono text-[11px] text-[#2cc1eb]">
                <span className="text-white/40">$</span> docker pull cleanstart/python:latest
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
                Try it now <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
      <ContextualCTA
        headline="Not sure where to start?"
        sub="Talk to an engineer — 15 minutes, no slides."
        ctaLabel="Book a Demo"
        ctaHref="/book-a-demo"
      />
    </PanelShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelProducts.tsx
git commit -m "feat(nav): PanelProducts — static fallback (Phase 3 wires live API)"
```

---

### Task 2.10: Create `PanelSolutions`

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelSolutions.tsx`

- [ ] **Step 1: Implement**

```tsx
import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelSolutions({ item }: Props) {
  const solutions = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      glow="green"
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-0.5">
          {solutions.map((s) => (
            <PanelRow
              key={s.label}
              href={s.href}
              label={s.label}
              {...(s.description ? { description: s.description } : {})}
              icon={s.icon ?? "shield-check"}
              built={s.built !== false}
            />
          ))}
        </div>
        <FeaturedTile
          href="/fips"
          glow="green"
          minHeight={280}
          pill={
            <span className="inline-flex rounded-full border border-[rgba(108,255,194,0.3)] bg-[rgba(108,255,194,0.15)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6cffc2]">
              FIPS 140-3
            </span>
          }
          headline="FIPS, drop-in."
          sub="Validated cryptography, no code change. Replace base images, inherit compliance."
          footer={
            <div>
              <div className="rounded-lg border border-[rgba(108,255,194,0.18)] bg-black/30 px-2.5 py-2 font-mono text-[11px] text-[#6cffc2]">
                <span className="text-white/40">$</span> docker pull cleanstart/python-fips
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
                See FIPS stack <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
      <ContextualCTA
        headline="Need help mapping your compliance scope?"
        sub="Our solution engineers will walk it with you."
        ctaLabel="Talk to SE"
        ctaHref="/book-a-demo?intent=se"
      />
    </PanelShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelSolutions.tsx
git commit -m "feat(nav): PanelSolutions panel"
```

---

### Task 2.11: Create `PanelAudience`

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelAudience.tsx`

- [ ] **Step 1: Implement**

```tsx
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { PersonaCard } from "@/components/nav/pieces/PersonaCard";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

export function PanelAudience({ item }: Props) {
  const [dev, ciso] = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 640}
      glow="purple"
      eyebrow={item.label}
      tagline={item.tagline}
    >
      <div className="grid grid-cols-2 gap-3.5">
        {dev && (
          <PersonaCard
            href={dev.href}
            variant="developer"
            icon={dev.icon ?? "tools"}
            label={dev.label}
            description={dev.description ?? ""}
          />
        )}
        {ciso && (
          <PersonaCard
            href={ciso.href}
            variant="ciso"
            icon={ciso.icon ?? "hash"}
            label={ciso.label}
            description={ciso.description ?? ""}
          />
        )}
      </div>
    </PanelShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelAudience.tsx
git commit -m "feat(nav): PanelAudience — promoted from compact to dual persona cards

Audit issue #8."
```

---

### Task 2.12: Create `PanelResources` (static fallback only)

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelResources.tsx`

- [ ] **Step 1: Implement with placeholder content (Phase 3 wires live)**

```tsx
import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import type { NavMegaItem, NavLeaf } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

function BrowseColumn({ groups }: { groups: NavMegaItem["groups"] }) {
  return (
    <div>
      {groups.map((g, gi) => (
        <div key={gi} className={gi > 0 ? "mt-3" : ""}>
          {gi > 0 && <div className="mx-2 mb-3 h-px bg-white/[0.06]" />}
          {g.title && (
            <div className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2cc1eb]">
              {g.title}
            </div>
          )}
          <div className="flex flex-col gap-px">
            {g.items.map((leaf: NavLeaf) =>
              leaf.built === false ? null : (
                <Link
                  key={leaf.label}
                  href={leaf.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-white/92 transition-colors hover:bg-white/[0.04]"
                >
                  <NavIcon id={leaf.icon ?? "folder"} size={14} className="opacity-70" />
                  {leaf.label}
                </Link>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestUpdatesColumn() {
  // Static placeholder — Phase 3 replaces with live feed.
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
        Latest updates
        <span className="rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.18)] px-1.5 py-0.5 text-[8px] tracking-normal normal-case text-[#2cc1eb]">
          live
        </span>
      </div>
      <div className="text-[11px] italic text-white/40">
        Latest blogs, news, resources, and webinars appear here when Phase 3 ships.
      </div>
    </div>
  );
}

function SpotlightColumn() {
  // Static evergreen placeholder — Phase 3 replaces with priority chain.
  return (
    <div>
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
        Spotlight
      </div>
      <div className="min-h-[260px] rounded-[14px] border border-white/[0.08] bg-[linear-gradient(160deg,#231656_0%,#0d2c3a_100%)] p-4 text-white">
        <div className="inline-flex rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">
          Newsletter
        </div>
        <div className="mt-3 text-[15px] font-bold leading-tight">Get the CleanStart Bulletin.</div>
        <div className="mt-2 text-[11px] leading-relaxed text-white/70">
          One email per month — new images, talks, advisories.
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">
          Subscribe <span className="text-sm">→</span>
        </div>
      </div>
    </div>
  );
}

export function PanelResources({ item }: Props) {
  return (
    <PanelShell
      width={item.width ?? 880}
      glow="cyan"
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[200px_1fr_1fr] gap-4">
        <BrowseColumn groups={item.groups} />
        <LatestUpdatesColumn />
        <SpotlightColumn />
      </div>
      <ContextualCTA
        headline="Subscribe to the CleanStart Bulletin"
        sub="One email per month, new images, talks, advisories."
        ctaLabel="Subscribe"
        ctaHref="/subscribe"
      />
    </PanelShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelResources.tsx
git commit -m "feat(nav): PanelResources static shell (Phase 3 wires live data)

Three columns: Browse (Insights + Events from nav-config), Latest
Updates (placeholder), Spotlight (evergreen newsletter card)."
```

---

### Task 2.13: Create `PanelCompany` (static state 1 only)

**Files:**
- Create: `apps/web/src/components/nav/panels/PanelCompany.tsx`

- [ ] **Step 1: Implement (State 1 only — Phase 3 adds chain logic)**

```tsx
import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import type { NavMegaItem } from "@/lib/nav-config";

type Props = { item: NavMegaItem };

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#471FC3,#2cc1eb)",
  "linear-gradient(135deg,#2cc1eb,#6cffc2)",
  "linear-gradient(135deg,#ff8ab8,#471FC3)",
  "linear-gradient(135deg,#6cffc2,#ff8ab8)",
];

export function PanelCompany({ item }: Props) {
  const rows = item.groups[0]?.items ?? [];
  return (
    <PanelShell
      width={item.width ?? 760}
      glow="magenta"
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-0.5">
          {rows.map((r) => (
            <PanelRow
              key={r.label}
              href={r.href}
              label={r.label}
              {...(r.description ? { description: r.description } : {})}
              icon={r.icon ?? "info"}
              built={r.built !== false}
            />
          ))}
        </div>
        <FeaturedTile
          href="/careers"
          glow="magenta"
          minHeight={300}
          pill={
            <span className="inline-flex rounded-full border border-[rgba(255,138,184,0.3)] bg-[rgba(255,138,184,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff8ab8]">
              We're hiring
            </span>
          }
          headline="Build the base layer with us."
          sub="Engineers, SEs, designers. Remote-friendly. Equity-led."
          footer={
            <div>
              <div className="flex items-center">
                {AVATAR_GRADIENTS.map((g, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-[#1a1330]"
                    style={{ background: g, marginLeft: i === 0 ? 0 : -10 }}
                  />
                ))}
                <div className="ml-3 text-[10px] text-white/70">Open roles · see careers</div>
              </div>
              <div className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff8ab8]">
                See careers <span className="text-sm">→</span>
              </div>
            </div>
          }
        />
      </div>
    </PanelShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelCompany.tsx
git commit -m "feat(nav): PanelCompany (State 1 only — Phase 3 adds chain)"
```

---

### Task 2.14: Switch `DesktopNav` to route through the new panels

**Files:**
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`

- [ ] **Step 1: Add the panel registry**

In `DesktopNav.tsx`, add this above the component definitions:

```tsx
import { PanelProducts } from "@/components/nav/panels/PanelProducts";
import { PanelSolutions } from "@/components/nav/panels/PanelSolutions";
import { PanelAudience } from "@/components/nav/panels/PanelAudience";
import { PanelResources } from "@/components/nav/panels/PanelResources";
import { PanelCompany } from "@/components/nav/panels/PanelCompany";
import type { NavMegaItem } from "@/lib/nav-config";

const PANELS: Record<string, (props: { item: NavMegaItem }) => JSX.Element> = {
  Products: PanelProducts,
  Solutions: PanelSolutions,
  Audience: PanelAudience,
  Resources: PanelResources,
  Company: PanelCompany,
};
```

- [ ] **Step 2: Replace the `MegaMenu` import + render with the registry lookup**

Replace the `NavigationMenuContent` body in `TopLevelItem`:

```tsx
<NavigationMenuContent>
  {item.kind === "mega" && PANELS[item.label] ? (
    PANELS[item.label]({ item })
  ) : (
    <MegaMenu
      groups={item.kind === "mega" ? item.groups : [{ items: item.items }]}
      activeLabel={item.label}
      {...(item.width !== undefined ? { width: item.width } : {})}
    />
  )}
</NavigationMenuContent>
```

(The MegaMenu fallback stays for unknown items but won't be exercised since every entry is now in `PANELS`.)

- [ ] **Step 3: Manual test all five panels render**

```bash
pnpm --filter @cleanstart/web dev
```

Hover Products, Solutions, Audience, Resources, Company. Each opens the new design. Stop dev server.

- [ ] **Step 4: Lint + typecheck + build**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/DesktopNav.tsx
git commit -m "feat(nav): route triggers through Panel* registry

PANELS map by trigger label. Visual surface flips here — every mega
trigger now opens its dedicated panel component."
```

---

### Task 2.15: Delete the old `MegaMenu.tsx`

**Files:**
- Delete: `apps/web/src/components/nav/MegaMenu.tsx`
- Modify: `apps/web/src/components/nav/DesktopNav.tsx` (remove import and fallback)

- [ ] **Step 1: Remove the MegaMenu import + the fallback branch**

In `DesktopNav.tsx`, delete the `import { MegaMenu }` line. Simplify the `NavigationMenuContent` body to assume every mega trigger has a panel:

```tsx
<NavigationMenuContent>
  {item.kind === "mega" && PANELS[item.label] ? (
    PANELS[item.label]({ item })
  ) : null}
</NavigationMenuContent>
```

- [ ] **Step 2: Delete the file**

```bash
git rm apps/web/src/components/nav/MegaMenu.tsx
```

- [ ] **Step 3: Typecheck + build**

```bash
pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/DesktopNav.tsx
git commit -m "refactor(nav): delete the old MegaMenu

Replaced by the Panel* family + PanelShell chrome."
```

---

### Task 2.16: Add icons to `MobileNav` accordion items

**Files:**
- Modify: `apps/web/src/components/nav/MobileNav.tsx`

- [ ] **Step 1: Render `NavIcon` next to each accordion leaf**

Locate the leaf rendering in MobileNav (the `<Link>` inside the accordion content, ~line 100). Wrap the label with an icon + label flex:

```tsx
<Link
  href={leaf.href}
  onClick={close}
  className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-white/80 no-underline transition-colors hover:bg-white/[0.06] hover:text-white"
>
  {leaf.icon && <NavIcon id={leaf.icon} size={14} className="opacity-70" />}
  {leaf.label}
</Link>
```

Also import `NavIcon` at the top:

```tsx
import { NavIcon } from "@/components/nav/icons/NavIcon";
```

- [ ] **Step 2: Manual mobile test**

```bash
pnpm --filter @cleanstart/web dev
```

Open `http://localhost:3001` with viewport 375 px. Tap the hamburger. Each leaf shows a tiny icon. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/MobileNav.tsx
git commit -m "feat(nav): icons in mobile accordion items"
```

---

### Task 2.17: Phase 2 verification + branch sync

- [ ] **Step 1: Full pre-completion gate**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web exec vitest run
```
Expected: all PASS.

- [ ] **Step 2: Capture visual diff screenshots**

```bash
pnpm --filter @cleanstart/web dev
```

In Claude Preview (locked to 1440 × 900) or browser DevTools at that viewport, screenshot the navbar with each of the 5 panels open. Attach to the phase PR description.

- [ ] **Step 3: Keyboard walk-through**

With dev still running, use only the keyboard:
1. Tab onto the Products trigger.
2. Down arrow drops focus into the first PanelRow.
3. Tab through every row.
4. Esc closes the panel.
5. Shift-Tab back to the trigger.

Repeat for each panel. Note any focus traps in the PR.

- [ ] **Step 4: Branch sync**

```bash
git checkout main && git merge --ff-only development
git push origin main
git checkout development && git merge --ff-only main
git push origin development
git push origin development:farheen
git tag -a phase2-icons-panels -m "Mega menu redesign — Phase 2 (icons + panels) shipped"
git push origin phase2-icons-panels
```

---

## Phase 3 · Live data integration (5–6 days)

Server-fetched data lights up Products' rotating image tile, the Resources Latest Updates feed + Spotlight chain, and the Company 3-state chain.

### Task 3.1: Create `latest-images.ts` with sort + slice

**Files:**
- Create: `apps/web/src/components/nav/data/latest-images.ts`
- Create: `apps/web/src/components/nav/data/latest-images.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/components/nav/data/latest-images.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommunityImage } from '@/lib/api/community-images';

vi.mock('@/lib/api/community-images', () => ({
  fetchCommunityImages: vi.fn(),
}));

import { fetchCommunityImages } from '@/lib/api/community-images';
import { fetchLatestImages, imageDetailsHref, IMAGES_SUBDOMAIN_BASE, LATEST_IMAGES_POOL_SIZE } from './latest-images';

function img(name: string, publishedAt?: string, updatedAt?: string): CommunityImage {
  const out: CommunityImage = { id: name, name, description: '', imageUrl: `https://cdn/${name}.png` };
  if (publishedAt) out.publishedAt = publishedAt;
  if (updatedAt) out.updatedAt = updatedAt;
  return out;
}

describe('fetchLatestImages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns [] when the API returns []', async () => {
    vi.mocked(fetchCommunityImages).mockResolvedValue([]);
    expect(await fetchLatestImages()).toEqual([]);
  });

  it('sorts by publishedAt desc, falling back to updatedAt', async () => {
    vi.mocked(fetchCommunityImages).mockResolvedValue([
      img('a', '2026-01-01', '2026-05-01'),
      img('b', '2026-03-01'),
      img('c', undefined, '2026-04-01'),
    ]);
    const out = await fetchLatestImages();
    expect(out.map((x) => x.name)).toEqual(['c', 'b', 'a']);
  });

  it('slices to LATEST_IMAGES_POOL_SIZE', async () => {
    const many: CommunityImage[] = Array.from({ length: 20 }, (_, i) =>
      img(`x${i}`, `2026-${String(i + 1).padStart(2, '0')}-01`),
    );
    vi.mocked(fetchCommunityImages).mockResolvedValue(many);
    const out = await fetchLatestImages();
    expect(out).toHaveLength(LATEST_IMAGES_POOL_SIZE);
  });
});

describe('imageDetailsHref', () => {
  it('builds the canonical URL', () => {
    expect(imageDetailsHref('python')).toBe(`${IMAGES_SUBDOMAIN_BASE}/python/details`);
  });
  it('encodes special characters in the name', () => {
    expect(imageDetailsHref('python 3.12')).toBe(`${IMAGES_SUBDOMAIN_BASE}/python%203.12/details`);
  });
});
```

- [ ] **Step 2: Run — should fail with module not found**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/latest-images.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// apps/web/src/components/nav/data/latest-images.ts
import { fetchCommunityImages, type CommunityImage } from '@/lib/api/community-images';

export const LATEST_IMAGES_POOL_SIZE = 8;
export const IMAGES_SUBDOMAIN_BASE = 'https://images.cleanstart.com/images';

export const imageDetailsHref = (name: string): string =>
  `${IMAGES_SUBDOMAIN_BASE}/${encodeURIComponent(name)}/details`;

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

- [ ] **Step 4: Tests pass**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/latest-images.test.ts
```
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/data/latest-images.ts apps/web/src/components/nav/data/latest-images.test.ts
git commit -m "feat(nav): latest-images data layer

Sort by publishedAt desc with updatedAt fallback; slice to 8.
imageDetailsHref URL-encodes the name to handle ' ' or '+' in IDs.
IMAGES_SUBDOMAIN_BASE is the single constant — flip in one place
if the production URL shape changes."
```

---

### Task 3.2: Wire `Header` to server-fetch images and pass to `DesktopNav`

**Files:**
- Modify: `apps/web/src/components/nav/Header.tsx`
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`

- [ ] **Step 1: Make Header an RSC and fetch**

Replace the contents of `apps/web/src/components/nav/Header.tsx`:

```tsx
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { DesktopNav } from "@/components/nav/DesktopNav";
import { MobileNav } from "@/components/nav/MobileNav";
import { HeaderScrollShell } from "@/components/nav/HeaderScrollShell";
import { fetchLatestImages } from "@/components/nav/data/latest-images";

export async function Header() {
  const latestImages = await fetchLatestImages();
  return (
    <HeaderScrollShell>
      <Link
        href="/"
        aria-label="CleanStart home"
        className="flex shrink-0 items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <Logo className="h-7 w-auto" />
      </Link>

      <DesktopNav latestImages={latestImages} />

      <div className="flex items-center gap-3">
        <Link
          href="/book-a-demo"
          className="cs-btn-glass hidden lg:inline-flex"
          style={{
            ["--cs-btn-h" as string]: "36px",
            ["--cs-btn-px" as string]: "16px",
            ["--cs-btn-fs" as string]: "13px",
          }}
        >
          Book a Demo
        </Link>
        <MobileNav />
      </div>
    </HeaderScrollShell>
  );
}
```

- [ ] **Step 2: Extract the scrolled-shell client bit into `HeaderScrollShell`**

Create `apps/web/src/components/nav/HeaderScrollShell.tsx`:

```tsx
"use client";

import { type ReactNode } from "react";
import { useScrolled } from "@/components/nav/useScrolled";

export function HeaderScrollShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled(24);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,box-shadow] duration-200 ${
        scrolled ? "cs-nav-shadow backdrop-blur-xl" : "backdrop-blur-md bg-[rgba(11,8,22,0.35)]"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[var(--container-default)] items-center justify-between gap-6 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] sm:ps-[max(2.5rem,env(safe-area-inset-left))] sm:pe-[max(2.5rem,env(safe-area-inset-right))]">
        {children}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Update `DesktopNav` to accept and pass `latestImages`**

In `apps/web/src/components/nav/DesktopNav.tsx`:

```tsx
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { latestImages: CommunityImage[] };

export function DesktopNav({ latestImages }: Props) {
  return (
    <NavigationMenu className="hidden lg:flex" align="center" delay={120} closeDelay={200}>
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => (
          <TopLevelItem key={item.label} item={item} latestImages={latestImages} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

Update `TopLevelItem` to thread `latestImages` to `PanelProducts`:

```tsx
function TopLevelItem({ item, latestImages }: { item: NavItem; latestImages: CommunityImage[] }) {
  // ...existing useIsActiveSection logic...
  // ...
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={navigationMenuTriggerStyle()} data-active={active}>
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        {item.kind === "mega" && item.label === "Products" ? (
          <PanelProducts item={item} latestImages={latestImages} />
        ) : item.kind === "mega" && PANELS[item.label] ? (
          PANELS[item.label]({ item })
        ) : null}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @cleanstart/web typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/Header.tsx apps/web/src/components/nav/HeaderScrollShell.tsx apps/web/src/components/nav/DesktopNav.tsx
git commit -m "feat(nav): Header is an RSC; fetches latest images server-side

Splits the existing client useScrolled logic into HeaderScrollShell so
Header itself can be async. Pre-fetches latest 8 images and passes
them through DesktopNav to PanelProducts as a prop. Zero new API
requests in steady state — community page's fetcher cache is shared."
```

---

### Task 3.3: Wire `PanelProducts` random-on-open rotation

**Files:**
- Modify: `apps/web/src/components/nav/panels/PanelProducts.tsx`

- [ ] **Step 1: Convert to client component, add the rotating featured tile**

Replace the file contents:

```tsx
"use client";

import { useEffect, useState } from "react";
import { FeaturedTile } from "@/components/nav/pieces/FeaturedTile";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { PanelShell } from "@/components/nav/panels/PanelShell";
import { ContextualCTA } from "@/components/nav/pieces/ContextualCTA";
import { imageDetailsHref } from "@/components/nav/data/latest-images";
import type { NavMegaItem } from "@/lib/nav-config";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { item: NavMegaItem; latestImages: CommunityImage[] };

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PanelProducts({ item, latestImages }: Props) {
  const products = item.groups[0]?.items ?? [];
  const [chosen, setChosen] = useState<CommunityImage | undefined>(undefined);

  // Re-pick on every mount (panel close-then-open in base-ui remounts content).
  useEffect(() => {
    setChosen(pickRandom(latestImages));
  }, [latestImages]);

  const tile = chosen
    ? (
      <FeaturedTile
        href={imageDetailsHref(chosen.name)}
        glow="cyan"
        pill={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">
            <span className="h-1 w-1 rounded-full bg-[#2cc1eb] shadow-[0_0_6px_#2cc1eb]" />
            Featured
          </span>
        }
        headline="Stop patching. Replace the base."
        sub="Drop in hardened containers — keep your stack, lose the CVEs."
        footer={
          <div>
            <div className="rounded-lg border border-[rgba(44,193,235,0.18)] bg-black/30 px-2.5 py-2 font-mono text-[11px] text-[#2cc1eb]">
              <span className="text-white/40">$</span> docker pull cleanstart/{chosen.name}:latest
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
              Try {chosen.name} <span className="text-sm">→</span>
            </div>
          </div>
        }
      />
    )
    : (
      <FeaturedTile
        href="/cleanstart-images"
        glow="cyan"
        pill={
          <span className="inline-flex rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">
            Featured
          </span>
        }
        headline="Stop patching. Replace the base."
        sub="Drop in hardened containers — keep your stack, lose the CVEs."
        footer={
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
            Browse images <span className="text-sm">→</span>
          </div>
        }
      />
    );

  return (
    <PanelShell
      width={item.width ?? 760}
      glow="cyan"
      eyebrow={item.label}
      tagline={item.tagline}
      {...(item.exitHref && item.exitLabel
        ? { exitHref: item.exitHref, exitLabel: item.exitLabel }
        : {})}
    >
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-1">
          {products.map((p) => (
            <PanelRow
              key={p.label}
              href={p.href}
              label={p.label}
              {...(p.description ? { description: p.description } : {})}
              icon={p.icon ?? "container"}
              built={p.built !== false}
            />
          ))}
        </div>
        {tile}
      </div>
      <ContextualCTA
        headline="Not sure where to start?"
        sub="Talk to an engineer — 15 minutes, no slides."
        ctaLabel="Book a Demo"
        ctaHref="/book-a-demo"
      />
    </PanelShell>
  );
}
```

- [ ] **Step 2: Manual test — every open shows a (possibly different) image**

```bash
pnpm --filter @cleanstart/web dev
```

Open Products. Close. Open again. The featured tile command should sometimes change. The CTA `href` should match `https://images.cleanstart.com/images/<name>/details`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelProducts.tsx
git commit -m "feat(nav): PanelProducts live image rotation

Server passes the latest 8 images. Client picks a random one on each
mount. CTA copy adapts ('Try python →') and deep-links to
images.cleanstart.com/images/<name>/details.

Fallback: if the API returned [], render a static 'Browse images'
tile pointing to /cleanstart-images."
```

---

### Task 3.4: Add `ResourcesSpotlight` CMS global

**Files:**
- Create: `apps/cms/src/payload/globals/ResourcesSpotlight.ts`
- Modify: `apps/cms/src/payload/payload.config.ts`

- [ ] **Step 1: Create the global**

```ts
// apps/cms/src/payload/globals/ResourcesSpotlight.ts
import type { GlobalConfig } from 'payload';

export const ResourcesSpotlight: GlobalConfig = {
  slug: 'resourcesSpotlight',
  label: 'Resources Spotlight',
  admin: {
    description:
      'Optional spotlight card shown in the Resources mega menu. Falls back to the Bulletin evergreen when no event/webinar is upcoming and this global is empty or expired.',
    group: 'Marketing',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'headline', type: 'text', required: true, maxLength: 80 },
    { name: 'sub', type: 'text', maxLength: 160 },
    { name: 'ctaLabel', type: 'text', required: true, maxLength: 40 },
    { name: 'ctaHref', type: 'text', required: true },
    {
      name: 'expiresAt',
      type: 'date',
      admin: { description: 'After this date, the card is skipped and the evergreen renders.' },
    },
  ],
};
```

- [ ] **Step 2: Register in payload.config.ts**

Open `apps/cms/src/payload/payload.config.ts`. Locate the `globals: [...]` array. Add `ResourcesSpotlight`:

```ts
import { ResourcesSpotlight } from './globals/ResourcesSpotlight';

// ...

globals: [
  // ...existing globals...
  ResourcesSpotlight,
],
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm --filter @cleanstart/cms typecheck
```
Expected: PASS.

- [ ] **Step 4: Regenerate types and verify**

```bash
pnpm --filter @cleanstart/cms generate:types
```

Open `apps/cms/payload-types.ts`. Confirm a `ResourcesSpotlight` interface was generated.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/globals/ResourcesSpotlight.ts apps/cms/src/payload/payload.config.ts apps/cms/payload-types.ts
git commit -m "feat(cms): add resourcesSpotlight global

Optional marketing self-serve card shown in Resources mega menu when
no event/webinar is upcoming. expiresAt skips expired cards.
Additive only — no migration, no collection changes."
```

---

### Task 3.5: Add `CompanySpotlight` CMS global

**Files:**
- Create: `apps/cms/src/payload/globals/CompanySpotlight.ts`
- Modify: `apps/cms/src/payload/payload.config.ts`

- [ ] **Step 1: Create the global (identical shape)**

```ts
// apps/cms/src/payload/globals/CompanySpotlight.ts
import type { GlobalConfig } from 'payload';

export const CompanySpotlight: GlobalConfig = {
  slug: 'companySpotlight',
  label: 'Company Spotlight',
  admin: {
    description:
      'Optional spotlight card shown in the Company mega menu. Renders only when there are no open careers. Falls back to the Talent Network evergreen when empty or expired.',
    group: 'Marketing',
  },
  access: { read: () => true },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'headline', type: 'text', required: true, maxLength: 80 },
    { name: 'sub', type: 'text', maxLength: 160 },
    { name: 'ctaLabel', type: 'text', required: true, maxLength: 40 },
    { name: 'ctaHref', type: 'text', required: true },
    { name: 'expiresAt', type: 'date' },
  ],
};
```

- [ ] **Step 2: Register + regen types**

```ts
import { CompanySpotlight } from './globals/CompanySpotlight';

// ...
globals: [
  // ...existing...
  ResourcesSpotlight,
  CompanySpotlight,
],
```

```bash
pnpm --filter @cleanstart/cms generate:types
```

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/globals/CompanySpotlight.ts apps/cms/src/payload/payload.config.ts apps/cms/payload-types.ts
git commit -m "feat(cms): add companySpotlight global

Same shape as resourcesSpotlight. Editor visibility through Marketing group."
```

---

### Task 3.6: Create `latest-updates-feed.ts`

**Files:**
- Create: `apps/web/src/components/nav/data/latest-updates-feed.ts`
- Create: `apps/web/src/components/nav/data/latest-updates-feed.test.ts`

- [ ] **Step 1: Inspect existing apps/web/src/lib/api/ to find the existing fetchers for blogs/news/resources/webinars**

```bash
ls apps/web/src/lib/api/
```

Identify the existing client functions (likely `getBlogs`, `getNews`, `getResources`, `getWebinars` or similar). If they exist with different names, substitute below. If any is missing, create a thin wrapper that hits the same REST endpoint used by the corresponding page.

- [ ] **Step 2: Write the test (operates on the merge/sort/slice logic, not the network)**

```ts
// apps/web/src/components/nav/data/latest-updates-feed.test.ts
import { describe, it, expect } from 'vitest';
import { mergeAndRankFeed, type FeedSource } from './latest-updates-feed';

const now = new Date('2026-06-01T00:00:00Z');

function src(type: FeedSource['type'], slug: string, publishedAt: string, extra: Partial<FeedSource> = {}): FeedSource {
  return { type, slug, title: slug, publishedAt, ...extra };
}

describe('mergeAndRankFeed', () => {
  it('returns top 3 by publishedAt desc', () => {
    const out = mergeAndRankFeed(
      {
        blogs: [src('BLOG', 'b1', '2026-05-01'), src('BLOG', 'b2', '2026-05-20')],
        news: [src('NEWS', 'n1', '2026-05-15')],
        resources: [src('RESOURCE', 'r1', '2026-05-10')],
        webinars: [],
      },
      now,
    );
    expect(out.map((x) => x.slug)).toEqual(['b2', 'n1', 'r1']);
  });

  it('omits webinars whose startsAt is in the past', () => {
    const out = mergeAndRankFeed(
      {
        blogs: [src('BLOG', 'b1', '2026-05-01')],
        news: [src('NEWS', 'n1', '2026-04-01')],
        resources: [],
        webinars: [
          { type: 'WEBINAR', slug: 'past', title: 'past', publishedAt: '2026-05-25', startsAt: '2026-05-10' },
          { type: 'WEBINAR', slug: 'future', title: 'future', publishedAt: '2026-05-26', startsAt: '2026-06-15' },
        ],
      },
      now,
    );
    expect(out.find((x) => x.slug === 'past')).toBeUndefined();
    expect(out.find((x) => x.slug === 'future')).toBeDefined();
  });

  it('returns fewer than 3 entries gracefully when the union is small', () => {
    const out = mergeAndRankFeed(
      { blogs: [src('BLOG', 'only', '2026-05-01')], news: [], resources: [], webinars: [] },
      now,
    );
    expect(out).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run — should fail with module not found**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/latest-updates-feed.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement the merge logic + fetch wrapper**

```ts
// apps/web/src/components/nav/data/latest-updates-feed.ts
import { cache } from 'react';
// Substitute these imports with the actual existing fetchers found in Step 1:
import { getBlogs } from '@/lib/api/blogs';
import { getNews } from '@/lib/api/news';
import { getResources } from '@/lib/api/resources';
import { getWebinars } from '@/lib/api/webinars';

export const LATEST_UPDATES_TAG = 'resources-latest-updates';
const REVALIDATE_SECONDS = 600;

export type FeedSource = {
  type: 'BLOG' | 'NEWS' | 'RESOURCE' | 'WEBINAR';
  slug: string;
  title: string;
  publishedAt: string;
  readMinutes?: number;
  /** Only set on WEBINAR. */
  startsAt?: string;
};

type Sources = {
  blogs: FeedSource[];
  news: FeedSource[];
  resources: FeedSource[];
  webinars: FeedSource[];
};

export function mergeAndRankFeed(sources: Sources, now: Date = new Date()): FeedSource[] {
  const futureWebinars = sources.webinars.filter(
    (w) => !w.startsAt || new Date(w.startsAt) >= now,
  );
  const all = [...sources.blogs, ...sources.news, ...sources.resources, ...futureWebinars];
  return all
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);
}

export const fetchLatestUpdates = cache(async (): Promise<FeedSource[]> => {
  try {
    const [blogs, news, resources, webinars] = await Promise.all([
      getBlogs({ limit: 4, sort: '-publishedAt' }).then((r) =>
        (r.docs ?? []).map(
          (d: { slug: string; title: string; publishedAt: string; readMinutes?: number }): FeedSource => ({
            type: 'BLOG',
            slug: d.slug,
            title: d.title,
            publishedAt: d.publishedAt,
            ...(d.readMinutes !== undefined ? { readMinutes: d.readMinutes } : {}),
          }),
        ),
      ),
      getNews({ limit: 4, sort: '-publishedAt' }).then((r) =>
        (r.docs ?? []).map(
          (d: { slug: string; title: string; publishedAt: string }): FeedSource => ({
            type: 'NEWS',
            slug: d.slug,
            title: d.title,
            publishedAt: d.publishedAt,
          }),
        ),
      ),
      getResources({ limit: 4, sort: '-publishedAt' }).then((r) =>
        (r.docs ?? []).map(
          (d: { slug: string; title: string; publishedAt: string }): FeedSource => ({
            type: 'RESOURCE',
            slug: d.slug,
            title: d.title,
            publishedAt: d.publishedAt,
          }),
        ),
      ),
      getWebinars({ limit: 4, sort: '-publishedAt' }).then((r) =>
        (r.docs ?? []).map(
          (d: { slug: string; title: string; publishedAt: string; startsAt: string }): FeedSource => ({
            type: 'WEBINAR',
            slug: d.slug,
            title: d.title,
            publishedAt: d.publishedAt,
            startsAt: d.startsAt,
          }),
        ),
      ),
    ]);
    return mergeAndRankFeed({ blogs, news, resources, webinars });
  } catch {
    return [];
  }
});
```

If any of the import paths in Step 4 don't exist verbatim, create thin Vitest mocks now and file a follow-up to align — but **do not invent fetchers**. The merge logic (the part under unit test) does not depend on the imports.

- [ ] **Step 5: Tests pass**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/latest-updates-feed.test.ts
```
Expected: 3/3 PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/nav/data/latest-updates-feed.ts apps/web/src/components/nav/data/latest-updates-feed.test.ts
git commit -m "feat(nav): cross-collection latest-updates feed

mergeAndRankFeed is the pure logic — sort by publishedAt desc, slice
to 3, omit past-dated webinars. fetchLatestUpdates wraps it with the
existing per-collection Payload clients in parallel. Wrapped in
react.cache() + tagged resources-latest-updates for on-demand
invalidation when content is published."
```

---

### Task 3.7: Create `spotlights.ts` with both priority resolvers

**Files:**
- Create: `apps/web/src/components/nav/data/spotlights.ts`
- Create: `apps/web/src/components/nav/data/spotlights.test.ts`

- [ ] **Step 1: Write the test (priority chain logic)**

```ts
// apps/web/src/components/nav/data/spotlights.test.ts
import { describe, it, expect } from 'vitest';
import { resolveResourcesSpotlight, resolveCompanySpotlight, BULLETIN_EVERGREEN, TALENT_NETWORK_EVERGREEN } from './spotlights';

describe('resolveResourcesSpotlight', () => {
  it('returns event card when a near event exists', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => ({ title: 'KubeCon', slug: 'kubecon', startsAt: '2026-06-15' }),
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('event');
  });

  it('falls through to webinar when no event', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => ({ title: 'SBOM live', slug: 'sbom-live', startsAt: '2026-06-12' }),
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('webinar');
  });

  it('falls through to CMS spotlight when no event or webinar', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => ({
        headline: 'Promo',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/promo',
      }),
    });
    expect(out.kind).toBe('cms');
  });

  it('skips expired CMS spotlight and returns evergreen', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => ({
        headline: 'Old',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/promo',
        expiresAt: '2026-01-01',
      }),
    });
    expect(out).toBe(BULLETIN_EVERGREEN);
  });

  it('returns evergreen when everything else is empty', async () => {
    const out = await resolveResourcesSpotlight({
      now: new Date('2026-06-01'),
      fetchNextEvent: async () => null,
      fetchNextWebinar: async () => null,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out).toBe(BULLETIN_EVERGREEN);
  });
});

describe('resolveCompanySpotlight', () => {
  it('returns hiring card when openRoles > 0', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 7,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out.kind).toBe('careers');
  });

  it('falls through to CMS spotlight when no roles', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 0,
      fetchSpotlightGlobal: async () => ({
        headline: 'Series B',
        sub: 'sub',
        ctaLabel: 'Read',
        ctaHref: '/news/series-b',
      }),
    });
    expect(out.kind).toBe('cms');
  });

  it('returns talent network evergreen when nothing else', async () => {
    const out = await resolveCompanySpotlight({
      now: new Date('2026-06-01'),
      fetchOpenRoles: async () => 0,
      fetchSpotlightGlobal: async () => null,
    });
    expect(out).toBe(TALENT_NETWORK_EVERGREEN);
  });
});
```

- [ ] **Step 2: Run — should fail with module not found**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/spotlights.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// apps/web/src/components/nav/data/spotlights.ts

export type SpotlightCard =
  | { kind: 'event'; title: string; slug: string; startsAt: string }
  | { kind: 'webinar'; title: string; slug: string; startsAt: string }
  | { kind: 'careers'; openRoles: number }
  | { kind: 'cms'; headline: string; sub?: string; ctaLabel: string; ctaHref: string; image?: string }
  | { kind: 'evergreen'; id: 'bulletin' | 'talent-network' };

export const BULLETIN_EVERGREEN: SpotlightCard = { kind: 'evergreen', id: 'bulletin' };
export const TALENT_NETWORK_EVERGREEN: SpotlightCard = { kind: 'evergreen', id: 'talent-network' };

type CmsSpotlight = {
  headline: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
  image?: string;
  expiresAt?: string;
};

function isExpired(expiresAt: string | undefined, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < now;
}

export async function resolveResourcesSpotlight(deps: {
  now: Date;
  fetchNextEvent: () => Promise<{ title: string; slug: string; startsAt: string } | null>;
  fetchNextWebinar: () => Promise<{ title: string; slug: string; startsAt: string } | null>;
  fetchSpotlightGlobal: () => Promise<CmsSpotlight | null>;
}): Promise<SpotlightCard> {
  const event = await deps.fetchNextEvent();
  if (event) return { kind: 'event', ...event };

  const webinar = await deps.fetchNextWebinar();
  if (webinar) return { kind: 'webinar', ...webinar };

  const cms = await deps.fetchSpotlightGlobal();
  if (cms && !isExpired(cms.expiresAt, deps.now)) {
    const out: SpotlightCard = {
      kind: 'cms',
      headline: cms.headline,
      ctaLabel: cms.ctaLabel,
      ctaHref: cms.ctaHref,
    };
    if (cms.sub) (out as { sub?: string }).sub = cms.sub;
    if (cms.image) (out as { image?: string }).image = cms.image;
    return out;
  }

  return BULLETIN_EVERGREEN;
}

export async function resolveCompanySpotlight(deps: {
  now: Date;
  fetchOpenRoles: () => Promise<number>;
  fetchSpotlightGlobal: () => Promise<CmsSpotlight | null>;
}): Promise<SpotlightCard> {
  const roles = await deps.fetchOpenRoles();
  if (roles > 0) return { kind: 'careers', openRoles: roles };

  const cms = await deps.fetchSpotlightGlobal();
  if (cms && !isExpired(cms.expiresAt, deps.now)) {
    const out: SpotlightCard = {
      kind: 'cms',
      headline: cms.headline,
      ctaLabel: cms.ctaLabel,
      ctaHref: cms.ctaHref,
    };
    if (cms.sub) (out as { sub?: string }).sub = cms.sub;
    if (cms.image) (out as { image?: string }).image = cms.image;
    return out;
  }

  return TALENT_NETWORK_EVERGREEN;
}
```

- [ ] **Step 4: Tests pass**

```bash
pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/spotlights.test.ts
```
Expected: 8/8 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/data/spotlights.ts apps/web/src/components/nav/data/spotlights.test.ts
git commit -m "feat(nav): spotlight priority-chain resolvers

Pure functions with injected deps. Resources chain:
event → webinar → CMS spotlight (skip if expired) → bulletin evergreen.
Company chain:
openRoles > 0 → CMS spotlight (skip if expired) → talent network evergreen.

Dependency injection makes the chain trivially unit-testable — no
network in the test path."
```

---

### Task 3.8: Create `careers-feed.ts` and the production wiring around `spotlights.ts`

**Files:**
- Create: `apps/web/src/components/nav/data/careers-feed.ts`
- Create: `apps/web/src/components/nav/data/resolve-spotlights.ts`

- [ ] **Step 1: Implement careers count**

```ts
// apps/web/src/components/nav/data/careers-feed.ts
import { cache } from 'react';
import { getCareers } from '@/lib/api/careers';

export const CAREERS_TAG = 'careers-open-count';

export const fetchOpenRolesCount = cache(async (): Promise<number> => {
  try {
    const res = await getCareers({ limit: 1, where: { status: { equals: 'open' } }, depth: 0 });
    return typeof res.totalDocs === 'number' ? res.totalDocs : 0;
  } catch {
    return 0;
  }
});
```

If `getCareers` doesn't exist verbatim, substitute the existing fetcher in `lib/api/`. If no careers fetcher exists at all (the collection might not be wired yet), this function returns 0 by default — and the Spotlight chain correctly falls through to State 2 or 3.

- [ ] **Step 2: Production wiring file that injects real fetchers into the pure resolvers**

```ts
// apps/web/src/components/nav/data/resolve-spotlights.ts
import { cache } from 'react';
import {
  resolveResourcesSpotlight,
  resolveCompanySpotlight,
  type SpotlightCard,
} from './spotlights';
import { fetchOpenRolesCount } from './careers-feed';
import { getEvents } from '@/lib/api/events';
import { getWebinars } from '@/lib/api/webinars';
import { getPayload } from '@/lib/payload';

export const RESOURCES_SPOTLIGHT_TAG = 'resources-spotlight';
export const COMPANY_SPOTLIGHT_TAG = 'company-spotlight';

const SPOTLIGHT_WINDOW_DAYS = 30;

function withinWindow(now: Date, days: number): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function fetchNextInPersonEvent(now: Date) {
  try {
    const res = await getEvents({
      limit: 1,
      sort: 'startsAt',
      where: {
        kind: { equals: 'inPerson' },
        startsAt: { greater_than_equal: now.toISOString(), less_than_equal: withinWindow(now, SPOTLIGHT_WINDOW_DAYS) },
      },
    });
    const doc = res.docs?.[0];
    return doc
      ? { title: doc.title as string, slug: doc.slug as string, startsAt: doc.startsAt as string }
      : null;
  } catch {
    return null;
  }
}

async function fetchNextWebinar(now: Date) {
  try {
    const res = await getWebinars({
      limit: 1,
      sort: 'startsAt',
      where: {
        startsAt: { greater_than_equal: now.toISOString(), less_than_equal: withinWindow(now, SPOTLIGHT_WINDOW_DAYS) },
      },
    });
    const doc = res.docs?.[0];
    return doc
      ? { title: doc.title as string, slug: doc.slug as string, startsAt: doc.startsAt as string }
      : null;
  } catch {
    return null;
  }
}

async function fetchResourcesSpotlightGlobal() {
  try {
    const payload = await getPayload();
    const g = await payload.findGlobal({ slug: 'resourcesSpotlight' });
    if (!g?.headline) return null;
    return {
      headline: g.headline as string,
      ...(g.sub ? { sub: g.sub as string } : {}),
      ctaLabel: g.ctaLabel as string,
      ctaHref: g.ctaHref as string,
      ...(g.expiresAt ? { expiresAt: g.expiresAt as string } : {}),
    };
  } catch {
    return null;
  }
}

async function fetchCompanySpotlightGlobal() {
  try {
    const payload = await getPayload();
    const g = await payload.findGlobal({ slug: 'companySpotlight' });
    if (!g?.headline) return null;
    return {
      headline: g.headline as string,
      ...(g.sub ? { sub: g.sub as string } : {}),
      ctaLabel: g.ctaLabel as string,
      ctaHref: g.ctaHref as string,
      ...(g.expiresAt ? { expiresAt: g.expiresAt as string } : {}),
    };
  } catch {
    return null;
  }
}

export const getResourcesSpotlight = cache(async (): Promise<SpotlightCard> => {
  const now = new Date();
  return resolveResourcesSpotlight({
    now,
    fetchNextEvent: () => fetchNextInPersonEvent(now),
    fetchNextWebinar: () => fetchNextWebinar(now),
    fetchSpotlightGlobal: fetchResourcesSpotlightGlobal,
  });
});

export const getCompanySpotlight = cache(async (): Promise<SpotlightCard> => {
  const now = new Date();
  return resolveCompanySpotlight({
    now,
    fetchOpenRoles: fetchOpenRolesCount,
    fetchSpotlightGlobal: fetchCompanySpotlightGlobal,
  });
});
```

If `@/lib/payload` doesn't exist or the existing pattern for reading globals is different, substitute the existing pattern used elsewhere in apps/web (search for `findGlobal` to find it).

- [ ] **Step 3: Lint + typecheck**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```
Expected: 0 errors. Fix any import-path mismatches by aligning with existing apps/web client patterns.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/data/careers-feed.ts apps/web/src/components/nav/data/resolve-spotlights.ts
git commit -m "feat(nav): production wiring for spotlight chains

getResourcesSpotlight + getCompanySpotlight inject real fetchers
(events, webinars, careers count, Payload globals) into the pure
resolveSpotlight functions. Each wrapped in react.cache.
Window for events/webinars: 30 days."
```

---

### Task 3.9: Wire `PanelResources` with live data

**Files:**
- Modify: `apps/web/src/components/nav/Header.tsx`
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`
- Modify: `apps/web/src/components/nav/panels/PanelResources.tsx`

- [ ] **Step 1: Have `Header` fetch the resources feed and spotlight and pass them down**

In `Header.tsx`, add:

```tsx
import { fetchLatestUpdates } from "@/components/nav/data/latest-updates-feed";
import { getResourcesSpotlight, getCompanySpotlight } from "@/components/nav/data/resolve-spotlights";

export async function Header() {
  const [latestImages, latestUpdates, resourcesSpotlight, companySpotlight] = await Promise.all([
    fetchLatestImages(),
    fetchLatestUpdates(),
    getResourcesSpotlight(),
    getCompanySpotlight(),
  ]);

  return (
    <HeaderScrollShell>
      {/* ...logo... */}
      <DesktopNav
        latestImages={latestImages}
        latestUpdates={latestUpdates}
        resourcesSpotlight={resourcesSpotlight}
        companySpotlight={companySpotlight}
      />
      {/* ...book a demo + MobileNav... */}
    </HeaderScrollShell>
  );
}
```

- [ ] **Step 2: Extend `DesktopNav` props and pass through**

```tsx
import type { FeedSource } from "@/components/nav/data/latest-updates-feed";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = {
  latestImages: CommunityImage[];
  latestUpdates: FeedSource[];
  resourcesSpotlight: SpotlightCard;
  companySpotlight: SpotlightCard;
};

export function DesktopNav({ latestImages, latestUpdates, resourcesSpotlight, companySpotlight }: Props) {
  // ...
  return (
    <NavigationMenu className="hidden lg:flex" align="center" delay={120} closeDelay={200}>
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => (
          <TopLevelItem
            key={item.label}
            item={item}
            latestImages={latestImages}
            latestUpdates={latestUpdates}
            resourcesSpotlight={resourcesSpotlight}
            companySpotlight={companySpotlight}
          />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function TopLevelItem({
  item,
  latestImages,
  latestUpdates,
  resourcesSpotlight,
  companySpotlight,
}: { item: NavItem } & Props) {
  // ...
  if (item.kind === "mega") {
    let body: JSX.Element | null = null;
    if (item.label === "Products") body = <PanelProducts item={item} latestImages={latestImages} />;
    else if (item.label === "Resources") body = <PanelResources item={item} latestUpdates={latestUpdates} spotlight={resourcesSpotlight} />;
    else if (item.label === "Company") body = <PanelCompany item={item} spotlight={companySpotlight} />;
    else if (PANELS[item.label]) body = PANELS[item.label]({ item });
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger className={navigationMenuTriggerStyle()} data-active={active}>
          {item.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>{body}</NavigationMenuContent>
      </NavigationMenuItem>
    );
  }
  // ...flat branch unchanged...
}
```

- [ ] **Step 3: Rewrite `PanelResources` to accept the feed + spotlight as props**

Replace the file's `LatestUpdatesColumn` and `SpotlightColumn` with prop-driven versions:

```tsx
import type { FeedSource } from "@/components/nav/data/latest-updates-feed";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = { item: NavMegaItem; latestUpdates: FeedSource[]; spotlight: SpotlightCard };

const TYPE_PILL: Record<FeedSource['type'], { label: string; color: string; bg: string; border: string }> = {
  BLOG: { label: 'BLOG', color: '#2cc1eb', bg: 'rgba(44,193,235,0.15)', border: 'rgba(44,193,235,0.25)' },
  NEWS: { label: 'NEWS', color: '#6cffc2', bg: 'rgba(108,255,194,0.15)', border: 'rgba(108,255,194,0.25)' },
  RESOURCE: { label: 'RESOURCE', color: '#a48cff', bg: 'rgba(164,140,255,0.15)', border: 'rgba(164,140,255,0.25)' },
  WEBINAR: { label: 'WEBINAR', color: '#ff8ab8', bg: 'rgba(255,138,184,0.15)', border: 'rgba(255,138,184,0.25)' },
};

function feedHref(s: FeedSource): string {
  switch (s.type) {
    case 'BLOG': return `/blog/${s.slug}`;
    case 'NEWS': return `/news/${s.slug}`;
    case 'RESOURCE': return `/resource/${s.slug}`;
    case 'WEBINAR': return `/webinar/${s.slug}`;
  }
}

function metaLine(s: FeedSource): string {
  if (s.type === 'WEBINAR' && s.startsAt) {
    const d = new Date(s.startsAt);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles', timeZoneName: 'short' });
  }
  return s.readMinutes ? `${s.readMinutes} min · ${humanAge(s.publishedAt)}` : humanAge(s.publishedAt);
}

function humanAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (ms < day) return 'today';
  if (ms < 7 * day) return `${Math.round(ms / day)}d ago`;
  if (ms < 30 * day) return `${Math.round(ms / (7 * day))}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LatestUpdatesColumn({ items }: { items: FeedSource[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
        Latest updates
        <span className="rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.18)] px-1.5 py-0.5 text-[8px] tracking-normal normal-case text-[#2cc1eb]">live</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((s) => {
          const pill = TYPE_PILL[s.type];
          return (
            <Link
              key={`${s.type}-${s.slug}`}
              href={feedHref(s)}
              className="block rounded-[11px] border border-white/[0.04] bg-white/[0.03] p-3 transition-colors hover:border-[rgba(44,193,235,0.18)]"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: pill.color, background: pill.bg, borderColor: pill.border }}
                >
                  {pill.label}
                </span>
                <span className="text-[10px] text-white/40">{metaLine(s)}</span>
              </div>
              <div className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-white">
                {s.title}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SpotlightColumn({ spotlight }: { spotlight: SpotlightCard }) {
  // Render based on spotlight.kind — full switch below.
  // (Full JSX deliberately omitted to keep this task focused on the merge layer.
  //  Render details follow in Task 3.10 alongside Company spotlight rendering.)
  return null;
}
```

- [ ] **Step 4: Commit (interim — SpotlightColumn rendering lands in Task 3.10)**

```bash
git add apps/web/src/components/nav/Header.tsx apps/web/src/components/nav/DesktopNav.tsx apps/web/src/components/nav/panels/PanelResources.tsx
git commit -m "feat(nav): wire PanelResources with live latest-updates feed

Browse + Latest Updates columns now driven by live data passed from
the server-fetching Header. SpotlightColumn body lands in next task."
```

---

### Task 3.10: Render `SpotlightCard` (shared across Resources + Company)

**Files:**
- Create: `apps/web/src/components/nav/pieces/SpotlightRenderer.tsx`
- Modify: `apps/web/src/components/nav/panels/PanelResources.tsx`
- Modify: `apps/web/src/components/nav/panels/PanelCompany.tsx`

- [ ] **Step 1: Implement the shared renderer**

```tsx
// apps/web/src/components/nav/pieces/SpotlightRenderer.tsx
import Link from "next/link";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

function formatDateRange(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SpotlightRenderer({
  spotlight,
  context,
}: {
  spotlight: SpotlightCard;
  context: 'resources' | 'company';
}) {
  if (spotlight.kind === 'event') {
    return (
      <Link
        href={`/event/${spotlight.slug}`}
        className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-white/[0.08] p-4 text-white"
        style={{ background: 'linear-gradient(160deg,#231656 0%,#0d2c3a 100%)' }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-5 -top-5 h-30 w-30 rounded-full" style={{ background: 'radial-gradient(circle,rgba(44,193,235,0.35),transparent 70%)' }} />
        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.18)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">
            <span className="h-1 w-1 rounded-full bg-[#2cc1eb] shadow-[0_0_6px_#2cc1eb]" />
            Next event
          </div>
          <div className="mt-3.5 text-[15px] font-bold leading-tight">{spotlight.title}</div>
          <div className="mt-2 text-[11px] text-white/70">{formatDateRange(spotlight.startsAt)}</div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">Save your seat <span className="text-sm">→</span></div>
        </div>
      </Link>
    );
  }

  if (spotlight.kind === 'webinar') {
    return (
      <Link
        href={`/webinar/${spotlight.slug}`}
        className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-[rgba(255,138,184,0.2)] p-4 text-white"
        style={{ background: 'linear-gradient(160deg,rgba(255,138,184,0.18),rgba(71,31,195,0.12))' }}
      >
        <div className="inline-flex rounded-full border border-[rgba(255,138,184,0.3)] bg-[rgba(255,138,184,0.18)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff8ab8]">
          Webinar
        </div>
        <div className="mt-3 text-[14px] font-bold leading-tight">{spotlight.title}</div>
        <div className="mt-2 text-[11px] text-white/70">{formatDateRange(spotlight.startsAt)}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff8ab8]">Register <span className="text-sm">→</span></div>
      </Link>
    );
  }

  if (spotlight.kind === 'careers') {
    const gradients = [
      'linear-gradient(135deg,#471FC3,#2cc1eb)',
      'linear-gradient(135deg,#2cc1eb,#6cffc2)',
      'linear-gradient(135deg,#ff8ab8,#471FC3)',
      'linear-gradient(135deg,#6cffc2,#ff8ab8)',
    ];
    return (
      <Link
        href="/careers"
        className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-white/[0.08] p-4 text-white"
        style={{ background: 'linear-gradient(160deg,#3a1644 0%,#0d2c3a 100%)' }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-5 -top-5 h-30 w-30 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,138,184,0.30),transparent 70%)' }} />
        <div className="relative z-[1]">
          <div className="inline-flex rounded-full border border-[rgba(255,138,184,0.3)] bg-[rgba(255,138,184,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff8ab8]">We're hiring</div>
          <div className="mt-3.5 text-[15px] font-bold leading-tight">Build the base layer with us.</div>
          <div className="mt-2 text-[11px] text-white/70">Engineers, SEs, designers. Remote-friendly. Equity-led.</div>
          <div className="mt-4 flex items-center">
            {gradients.map((g, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-[#1a1330]" style={{ background: g, marginLeft: i === 0 ? 0 : -10 }} />
            ))}
            <div className="ml-3 text-[10px] text-white/70">{spotlight.openRoles} open roles</div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff8ab8]">See careers <span className="text-sm">→</span></div>
        </div>
      </Link>
    );
  }

  if (spotlight.kind === 'cms') {
    const accent = context === 'resources' ? '#2cc1eb' : '#6cffc2';
    const bg = context === 'resources' ? 'linear-gradient(160deg,#231656 0%,#0d3a2c 100%)' : 'linear-gradient(160deg,#1a3a3c 0%,#0d2030 100%)';
    return (
      <Link href={spotlight.ctaHref} className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-white/[0.08] p-4 text-white" style={{ background: bg }}>
        <div className="inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: accent, borderColor: `${accent}55`, background: `${accent}22` }}>Spotlight</div>
        <div className="mt-3 text-[15px] font-bold leading-tight">{spotlight.headline}</div>
        {spotlight.sub && <div className="mt-2 text-[11px] text-white/70">{spotlight.sub}</div>}
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: accent }}>{spotlight.ctaLabel} <span className="text-sm">→</span></div>
      </Link>
    );
  }

  // Evergreen
  if (spotlight.id === 'bulletin') {
    return (
      <Link href="/subscribe" className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-white/[0.08] p-4 text-white" style={{ background: 'linear-gradient(160deg,#231656 0%,#0d2c3a 100%)' }}>
        <div className="inline-flex rounded-full border border-[rgba(44,193,235,0.3)] bg-[rgba(44,193,235,0.16)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#2cc1eb]">Newsletter</div>
        <div className="mt-3 text-[15px] font-bold leading-tight">Get the CleanStart Bulletin.</div>
        <div className="mt-2 text-[11px] text-white/70">One email per month — new images, talks, advisories.</div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2cc1eb]">Subscribe <span className="text-sm">→</span></div>
      </Link>
    );
  }
  // Talent network evergreen
  return (
    <Link
      href="/careers/talent-network"
      className="relative block min-h-[260px] overflow-hidden rounded-[14px] border border-[rgba(108,255,194,0.2)] p-4 text-white"
      style={{ background: 'linear-gradient(160deg,#1a3a3c 0%,#0d2030 100%)' }}
    >
      <div className="inline-flex rounded-full border border-[rgba(108,255,194,0.3)] bg-[rgba(108,255,194,0.15)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6cffc2]">Talent network</div>
      <div className="mt-3 text-[15px] font-bold leading-tight">Not hiring right now?</div>
      <div className="mt-2 text-[11px] text-white/70">Tell us what you do — we'll reach out when a role opens that fits.</div>
      <div className="mt-4 flex items-center gap-2">
        <div className="rounded-full border border-[rgba(108,255,194,0.3)] bg-[rgba(108,255,194,0.12)] px-2 py-1 text-[10px] font-semibold text-[#6cffc2]">~30 sec</div>
        <div className="rounded-full border border-[rgba(108,255,194,0.3)] bg-[rgba(108,255,194,0.12)] px-2 py-1 text-[10px] font-semibold text-[#6cffc2]">no resume</div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6cffc2]">Join the network <span className="text-sm">→</span></div>
    </Link>
  );
}
```

> If `/careers/talent-network` doesn't yet exist as a route, swap the href to `mailto:careers@cleanstart.com?subject=Talent%20network` until that page lands. See spec §3 D13 + §14.

- [ ] **Step 2: Use it in `PanelResources`**

Replace `SpotlightColumn` body in `PanelResources.tsx`:

```tsx
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";

function SpotlightColumn({ spotlight }: { spotlight: SpotlightCard }) {
  return (
    <div>
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">Spotlight</div>
      <SpotlightRenderer spotlight={spotlight} context="resources" />
    </div>
  );
}
```

Also hide the bottom `ContextualCTA` Subscribe bar when spotlight is the bulletin evergreen (would be redundant):

```tsx
{spotlight.kind === 'evergreen' && spotlight.id === 'bulletin' ? null : (
  <ContextualCTA
    headline="Subscribe to the CleanStart Bulletin"
    sub="One email per month, new images, talks, advisories."
    ctaLabel="Subscribe"
    ctaHref="/subscribe"
  />
)}
```

- [ ] **Step 3: Use it in `PanelCompany` — drop the hardcoded "We're hiring" tile**

Modify the `PanelCompany` signature to accept `spotlight`:

```tsx
type Props = { item: NavMegaItem; spotlight: SpotlightCard };

export function PanelCompany({ item, spotlight }: Props) {
  // ...
  return (
    <PanelShell /* ... */>
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="flex flex-col gap-0.5">
          {rows.map((r) => (/* unchanged */))}
        </div>
        <SpotlightRenderer spotlight={spotlight} context="company" />
      </div>
    </PanelShell>
  );
}
```

- [ ] **Step 4: Lint + typecheck + build**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/pieces/SpotlightRenderer.tsx apps/web/src/components/nav/panels/PanelResources.tsx apps/web/src/components/nav/panels/PanelCompany.tsx
git commit -m "feat(nav): SpotlightRenderer with 6 card variants

One component renders any SpotlightCard kind (event/webinar/careers/
cms/evergreen-bulletin/evergreen-talent-network). Used by both
PanelResources and PanelCompany. Context prop ('resources'|'company')
controls accent color for the CMS variant."
```

---

### Task 3.11: Manual cache-invalidation test

- [ ] **Step 1: Add an invalidation API route (if not present)**

Check if `apps/web/src/app/api/revalidate/route.ts` exists. If not, create:

```ts
// apps/web/src/app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const ALLOWED_TAGS = [
  'community-images',
  'resources-latest-updates',
  'resources-spotlight',
  'company-spotlight',
  'careers-open-count',
];

export async function POST(req: Request) {
  const { tag, secret } = await req.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (typeof tag !== 'string' || !ALLOWED_TAGS.includes(tag)) {
    return NextResponse.json({ ok: false, error: 'unknown tag' }, { status: 400 });
  }
  revalidateTag(tag);
  return NextResponse.json({ ok: true, tag });
}
```

Add `REVALIDATE_SECRET` to the project's secrets store (1Password) and `.env.example` (no value committed).

- [ ] **Step 2: Test each tag invalidates correctly**

With dev running:

```bash
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"tag":"resources-latest-updates","secret":"<dev-secret>"}'
```

Reload the site, open Resources. The feed should re-fetch on the next render.

Repeat for `community-images` (open Products), `careers-open-count`, `resources-spotlight`, `company-spotlight`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/revalidate/route.ts apps/web/.env.example
git commit -m "feat(web): revalidate API route for nav cache tags

Allow-listed tag set; secret-gated. Lets Payload publish hooks pop
the nav caches without redeploying."
```

---

### Task 3.12: Phase 3 verification + branch sync

- [ ] **Step 1: Full gate (web + cms)**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web exec vitest run
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
```
Expected: all PASS.

- [ ] **Step 2: API-offline manual test**

Block `api-cleanstart-images.vercel.app` in browser DevTools → Network. Reload, open Products. The static fallback ("Browse images") renders. No console errors.

Unblock. Confirm the rotating image is back.

- [ ] **Step 3: Visual diff screenshots**

Capture 1440 × 900 screenshots of all 5 panels with live data. Attach to PR.

- [ ] **Step 4: Branch sync**

```bash
git checkout main && git merge --ff-only development
git push origin main
git checkout development && git merge --ff-only main
git push origin development
git push origin development:farheen
git tag -a phase3-live-data -m "Mega menu redesign — Phase 3 (live data) shipped"
git push origin phase3-live-data
```

---

## Phase 4 · Mobile parity (2 days)

### Task 4.1: Mirror contextual CTA per accordion section

**Files:**
- Modify: `apps/web/src/components/nav/MobileNav.tsx`

- [ ] **Step 1: Define per-label CTA in a small constant map**

Add at top of `MobileNav.tsx`:

```tsx
const MOBILE_CTA: Record<string, { headline: string; ctaLabel: string; ctaHref: string } | undefined> = {
  Products: { headline: 'Try CleanStart', ctaLabel: 'Browse Images', ctaHref: '/cleanstart-images' },
  Solutions: { headline: 'Map your compliance', ctaLabel: 'Talk to SE', ctaHref: '/book-a-demo?intent=se' },
  Resources: { headline: 'Get the Bulletin', ctaLabel: 'Subscribe', ctaHref: '/subscribe' },
  Company: { headline: 'We\'re hiring', ctaLabel: 'See Careers', ctaHref: '/careers' },
};
```

- [ ] **Step 2: Render the CTA inside each accordion's content, below the leaves**

In the `AccordionContent` block, after the `<ul>` of leaves, render:

```tsx
{MOBILE_CTA[item.label] && (
  <Link
    href={MOBILE_CTA[item.label]!.ctaHref}
    onClick={close}
    className="mx-3 mb-3 mt-2 flex items-center justify-between rounded-[10px] border border-white/[0.06] bg-[linear-gradient(90deg,rgba(71,31,195,0.18),rgba(44,193,235,0.18))] px-3 py-2.5"
  >
    <span className="text-xs font-semibold text-white">{MOBILE_CTA[item.label]!.headline}</span>
    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#0b0816]">
      {MOBILE_CTA[item.label]!.ctaLabel}
    </span>
  </Link>
)}
```

- [ ] **Step 3: Manual mobile test**

```bash
pnpm --filter @cleanstart/web dev
```

At 375 px viewport, open the drawer, expand each section. Each shows its own CTA. Stop dev.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/MobileNav.tsx
git commit -m "feat(nav): per-section contextual CTAs in mobile drawer

Matches desktop pattern. Hand-coded MOBILE_CTA map keyed by trigger
label."
```

---

### Task 4.2: Swipe-down handle on the mobile sheet

**Files:**
- Modify: `apps/web/src/components/nav/MobileNav.tsx`

- [ ] **Step 1: Add a handle bar to the top of the sheet content**

Inside `<SheetContent>`, just below the opening tag, add:

```tsx
<div className="flex justify-center pt-2" aria-hidden>
  <div className="h-1 w-10 rounded-full bg-white/15" />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/nav/MobileNav.tsx
git commit -m "feat(nav): swipe-down handle hint on mobile sheet"
```

---

### Task 4.3: Phase 4 verification + branch sync

- [ ] **Step 1: Real-device touch-target audit**

Open on a phone (or Chrome DevTools mobile mode at 375 × 812). For every interactive element:
- Tap targets ≥ 44 × 44 px
- Drawer swipe-down closes
- Per-section CTAs visible

- [ ] **Step 2: Branch sync**

```bash
git checkout main && git merge --ff-only development
git push origin main
git checkout development && git merge --ff-only main
git push origin development
git push origin development:farheen
git tag -a phase4-mobile -m "Mega menu redesign — Phase 4 (mobile parity) shipped"
git push origin phase4-mobile
```

---

## Phase 5 · Motion + delight (1–2 days)

### Task 5.1: Animated gradient sweep on featured tile

**Files:**
- Modify: `apps/web/src/components/nav/pieces/FeaturedTile.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add the keyframes to globals.css**

Append to `apps/web/src/app/globals.css`:

```css
@keyframes nav-glow-sweep {
  0%   { transform: translate3d(-30%, -30%, 0); }
  100% { transform: translate3d(30%, 30%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .nav-glow-animated { animation: none !important; }
}

.nav-glow-animated {
  animation: nav-glow-sweep 6s ease-in-out infinite alternate;
  will-change: transform;
}
```

- [ ] **Step 2: Apply the class to the glow blob in `FeaturedTile`**

In `FeaturedTile.tsx`, add `nav-glow-animated` to the glow div className:

```tsx
<div
  aria-hidden
  className="nav-glow-animated pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
  style={{ background: GLOW_BG[glow] }}
/>
```

- [ ] **Step 3: Manual test**

```bash
pnpm --filter @cleanstart/web dev
```

Open Products. The corner glow drifts gently. Toggle `prefers-reduced-motion: reduce` in DevTools rendering panel — animation stops.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/nav/pieces/FeaturedTile.tsx apps/web/src/app/globals.css
git commit -m "feat(nav): animated gradient sweep on featured tile

6s alternating translate3d on the corner glow blob. GPU-only.
prefers-reduced-motion turns it off cleanly."
```

---

### Task 5.2: Code-snippet typewriter cycle on Products tile

**Files:**
- Modify: `apps/web/src/components/nav/panels/PanelProducts.tsx`

- [ ] **Step 1: Wire a setInterval-based cycle**

In `PanelProducts.tsx`, replace the `useState`/`useEffect` block with:

```tsx
const [index, setIndex] = useState(0);
const [typedSuffix, setTypedSuffix] = useState('');
const reducedMotion = useReducedMotion();

useEffect(() => {
  if (latestImages.length === 0) return;
  if (reducedMotion) {
    setIndex(Math.floor(Math.random() * latestImages.length));
    return;
  }

  let cancelled = false;
  let i = Math.floor(Math.random() * latestImages.length);

  function advance() {
    if (cancelled) return;
    const next = (i + 1) % latestImages.length;
    i = next;
    setIndex(next);
    setTypedSuffix('');
    setTimeout(advance, 3500);
  }

  setIndex(i);
  setTimeout(advance, 3500);
  return () => { cancelled = true; };
}, [latestImages, reducedMotion]);

const chosen = latestImages[index];
```

Add the `useReducedMotion` hook:

```tsx
function useReducedMotion(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setV(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return v;
}
```

- [ ] **Step 2: Manual test the cycle behavior + reduced-motion**

Open Products. Watch the command cycle every 3.5s. Toggle reduced-motion → cycle stops, random-on-mount.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/panels/PanelProducts.tsx
git commit -m "feat(nav): cycling featured image (Phase 5 motion)

Replaces random-on-open with a 3.5s cycle across the latest-images
pool. prefers-reduced-motion: pin to a single random pick on mount."
```

---

### Task 5.3: Phase 5 closeout — reduced-motion audit + final sync

- [ ] **Step 1: Manual reduced-motion audit**

In DevTools Rendering panel, set `prefers-reduced-motion: reduce`. Walk through the navbar:
- Mega panel open: no scale animation, just opacity
- Row hover: color change only, no transform
- Featured tile glow: static (no sweep)
- Products tile: static command (no cycle)
- Cross-fade between triggers: instant

Fix any animation that still runs.

- [ ] **Step 2: Final pre-completion gate**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web exec vitest run
```
Expected: all PASS.

- [ ] **Step 3: Lighthouse perf check on /, /cleanstart-images, /blogs**

Compare against the baseline captured before Phase 1 landed. No regression beyond 2 points per page.

- [ ] **Step 4: Final branch sync**

```bash
git checkout main && git merge --ff-only development
git push origin main
git checkout development && git merge --ff-only main
git push origin development
git push origin development:farheen
git tag -a phase5-motion -m "Mega menu redesign — Phase 5 (motion + delight) shipped — FINAL"
git push origin phase5-motion
```

- [ ] **Step 5: Mark spec closed**

Edit `docs/superpowers/specs/2026-05-28-mega-menu-redesign-design.md` and pin the final commit SHA at the top of the file (per spec §17). Commit:

```bash
git add docs/superpowers/specs/2026-05-28-mega-menu-redesign-design.md
git commit -m "docs(specs): mega menu redesign — closed (SHA <final-sha>)"
```

Push and resync `farheen`.

---

## Out of scope for this plan (deferred follow-ups)

The spec §14 lists these explicitly. They are intentionally not in any phase:

- Audience-into-Solutions IA merge — separate brainstorm with marketing/CEO.
- Pricing / Docs nav additions — product-roadmap decision.
- Global navbar search — separate spec, defer one release after this redesign.
- `/careers/talent-network` form scaffolding — v1 falls back to `mailto:` (see Task 3.10 note).
- Live team-photo avatars on the careers tile — v1 keeps 4 hand-coded gradient circles.
- Image OS/distro badges on Products tile — wait until the community-images API exposes the field.
- Mobile featured-tile rotation on touch — defer; static fallback is good enough.
