# Open-Roles in Company Mega Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a live "N open" badge on the Company → Careers row, and reveal a fixed-height scrollable list of all open roles (each → `/careers/[slug]`) when that row is hovered or keyboard-focused.

**Architecture:** `Header` (server) fetches `openRoles` (cached, fail-soft) and passes it through `DesktopNav` (client) → `PanelCompany` → new client `CareersRevealColumn`, which owns hover/focus state and swaps `SpotlightRenderer` ↔ new `OpenRolesCard`. The existing `fetchOpenRolesCount` stub (returns 0) is replaced to derive from the real list.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind, vitest (node env, `fetchCMS` mocked).

---

## File Structure

- **New** `apps/web/src/components/nav/data/open-roles.ts` — `OpenRole` type, `fetchOpenRoles()` (cached, fail-soft), data-only. Test: `open-roles.test.ts`.
- **New** `apps/web/src/components/nav/pieces/OpenRolesCard.tsx` — presentational scrollable roles card.
- **New** `apps/web/src/components/nav/panels/CareersRevealColumn.tsx` — `"use client"`; rows + badge + hover/focus swap.
- **Modify** `apps/web/src/components/nav/data/careers-feed.ts` — `fetchOpenRolesCount` derives from `fetchOpenRoles().length`.
- **Modify** `apps/web/src/components/nav/pieces/PanelRow.tsx` — optional `badge?: string`.
- **Modify** `apps/web/src/components/nav/Header.tsx` — fetch + pass `openRoles`.
- **Modify** `apps/web/src/components/nav/DesktopNav.tsx` — thread `openRoles` prop to Company panel.
- **Modify** `apps/web/src/components/nav/panels/PanelCompany.tsx` — render `CareersRevealColumn`.
- **Modify** `apps/web/src/components/nav/MobileNav.tsx` — count + link on Careers.

Cmd to run all tests: `pnpm --filter @cleanstart/web test`

---

### Task 1: `fetchOpenRoles()` data layer (TDD)

**Files:**
- Create: `apps/web/src/components/nav/data/open-roles.ts`
- Test: `apps/web/src/components/nav/data/open-roles.test.ts`

- [ ] **Step 1: Write the failing test** (mirror `latest-images.test.ts` — mock the data source)

```ts
// open-roles.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Job } from "@/lib/jobs";

const getJobs = vi.fn();
vi.mock("@/lib/jobs", async (orig) => ({
  ...(await orig<typeof import("@/lib/jobs")>()),
  getJobs: (...a: unknown[]) => getJobs(...a),
}));

async function load() {
  vi.resetModules();
  return (await import("./open-roles")).fetchOpenRoles;
}

const job = (over: Partial<Job>): Job =>
  ({ id: 1, title: "Sales Engineer", slug: "sales-engineer", source: "cms",
     locations: [{ id: 9, name: "Singapore", slug: "singapore", type: "city", isoCountry: "SG" }],
     ...over } as Job);

afterEach(() => { getJobs.mockReset(); });

describe("fetchOpenRoles", () => {
  it("maps open jobs to {title, slug, location}", async () => {
    getJobs.mockResolvedValue({ docs: [job({})] });
    const fetchOpenRoles = await load();
    expect(await fetchOpenRoles()).toEqual([
      { title: "Sales Engineer", slug: "sales-engineer", location: "Singapore" },
    ]);
    expect(getJobs).toHaveBeenCalledWith({ status: "open", limit: 50 });
  });

  it("falls back to Remote then null for location", async () => {
    getJobs.mockResolvedValue({ docs: [
      job({ slug: "a", locations: [], remote: true }),
      job({ slug: "b", locations: [], remote: false }),
    ]});
    const fetchOpenRoles = await load();
    const out = await fetchOpenRoles();
    expect(out.map((r) => r.location)).toEqual(["Remote", null]);
  });

  it("returns [] when the source throws (fail-soft)", async () => {
    getJobs.mockRejectedValue(new Error("CMS down"));
    const fetchOpenRoles = await load();
    expect(await fetchOpenRoles()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/open-roles.test.ts`
Expected: FAIL — cannot resolve `./open-roles`.

- [ ] **Step 3: Write minimal implementation**

```ts
// open-roles.ts
import { cache } from "react";
import { getJobs, resolvedLocations } from "@/lib/jobs";

export type OpenRole = { title: string; slug: string; location: string | null };

/** Open roles for the nav. Cached per request; fail-soft (returns []). */
export const fetchOpenRoles = cache(async (): Promise<OpenRole[]> => {
  try {
    const { docs } = await getJobs({ status: "open", limit: 50 });
    return docs.map((job) => {
      const loc = resolvedLocations(job)[0]?.name ?? (job.remote ? "Remote" : null);
      return { title: job.title, slug: job.slug, location: loc };
    });
  } catch {
    return [];
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/open-roles.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/data/open-roles.ts apps/web/src/components/nav/data/open-roles.test.ts
git commit -m "feat(web): fetchOpenRoles data layer for nav"
```

---

### Task 2: Replace the `fetchOpenRolesCount` stub (TDD)

**Files:**
- Modify: `apps/web/src/components/nav/data/careers-feed.ts`
- Test: `apps/web/src/components/nav/data/careers-feed.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// careers-feed.test.ts
import { describe, expect, it, vi } from "vitest";

const fetchOpenRoles = vi.fn();
vi.mock("./open-roles", () => ({ fetchOpenRoles: (...a: unknown[]) => fetchOpenRoles(...a) }));

async function load() {
  vi.resetModules();
  return (await import("./careers-feed")).fetchOpenRolesCount;
}

describe("fetchOpenRolesCount", () => {
  it("returns the number of open roles", async () => {
    fetchOpenRoles.mockResolvedValue([{ title: "A", slug: "a", location: null },
                                       { title: "B", slug: "b", location: null }]);
    const fetchOpenRolesCount = await load();
    expect(await fetchOpenRolesCount()).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/careers-feed.test.ts`
Expected: FAIL — count is currently the stubbed `0`.

- [ ] **Step 3: Replace the stub body**

In `careers-feed.ts`, replace the `fetchOpenRolesCount` implementation with:

```ts
import { cache } from "react";
import { fetchOpenRoles } from "./open-roles";

export const fetchOpenRolesCount = cache(async (): Promise<number> => {
  return (await fetchOpenRoles()).length;
});
```
(Keep any other exports in the file unchanged. Remove the old `=> 0` body.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/nav/data/careers-feed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/data/careers-feed.ts apps/web/src/components/nav/data/careers-feed.test.ts
git commit -m "feat(web): derive open-roles count from the live list"
```

---

### Task 3: `OpenRolesCard` presentational component

**Files:**
- Create: `apps/web/src/components/nav/pieces/OpenRolesCard.tsx`

- [ ] **Step 1: Write the component** (fixed height ~280px to match the careers spotlight; scroll the middle; sticky footer)

```tsx
// OpenRolesCard.tsx
import Link from "next/link";
import { ArrowGlyph } from "@/components/nav/icons/ArrowGlyph";
import type { OpenRole } from "@/components/nav/data/open-roles";

const ACCENT = "#a78bfa";

export function OpenRolesCard({ roles }: { roles: OpenRole[] }) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
      <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
        Open roles · {roles.length}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto pr-1" role="list">
        {roles.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/careers/${r.slug}`}
              className="flex items-center justify-between gap-3 rounded-[8px] px-2 py-2 text-xs transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.06] focus-visible:outline-none"
            >
              <span className="truncate font-medium text-white/90">{r.title}</span>
              {r.location && <span className="shrink-0 text-[11px] text-white/55">{r.location}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/careers"
        className="mt-2 inline-flex items-center gap-1.5 border-t border-white/10 px-1 pt-2.5 text-[11px] font-semibold"
        style={{ color: ACCENT }}
      >
        View all {roles.length} roles <ArrowGlyph direction="right" size={12} />
      </Link>
    </div>
  );
}
```

NOTE: verify the import path/name of `ArrowGlyph` against `SpotlightRenderer.tsx` (it imports the same glyph). If the export differs, match it.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit`
Expected: PASS (no errors from this file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/pieces/OpenRolesCard.tsx
git commit -m "feat(web): OpenRolesCard scrollable roster"
```

---

### Task 4: `PanelRow` optional badge

**Files:**
- Modify: `apps/web/src/components/nav/pieces/PanelRow.tsx`

- [ ] **Step 1: Add `badge?: string` to Props and render it**

In `PanelRow.tsx`: add `badge?: string;` to `Props`, destructure `badge`, and change the grid + label block so the badge sits at the row's trailing edge:

```tsx
// Props: add
badge?: string;

// signature: add `badge` to destructure
export function PanelRow({ href, label, description, icon, built = true, badge }: Props) {

// ROW grid becomes 3 cols when a badge can appear; render badge after the label block:
const ROW =
  "group/row grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.035]";

// inner: after the <div> containing LABEL/DESC, add:
{badge && (
  <span className="justify-self-end rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-300">
    {badge}
  </span>
)}
```
(Rows without a badge still render fine — the third column is empty/`auto`.)

- [ ] **Step 2: Verify compile + existing nav tests**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit && pnpm --filter @cleanstart/web test`
Expected: PASS (no regressions).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/pieces/PanelRow.tsx
git commit -m "feat(web): PanelRow optional trailing badge"
```

---

### Task 5: `CareersRevealColumn` client interaction

**Files:**
- Create: `apps/web/src/components/nav/panels/CareersRevealColumn.tsx`

- [ ] **Step 1: Write the component**

```tsx
// CareersRevealColumn.tsx
"use client";
import { useRef, useState } from "react";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import { OpenRolesCard } from "@/components/nav/pieces/OpenRolesCard";
import type { NavLeaf } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import type { OpenRole } from "@/components/nav/data/open-roles";

type Props = { rows: NavLeaf[]; spotlight: SpotlightCard; openRoles: OpenRole[] };
const REVERT_MS = 120;

export function CareersRevealColumn({ rows, spotlight, openRoles }: Props) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRoles = openRoles.length > 0;

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    if (hasRoles) setRevealed(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRevealed(false), REVERT_MS);
  };

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
      <div className="flex flex-col gap-0.5">
        {rows.map((r) => {
          const isCareers = r.href === "/careers";
          const rowEl = (
            <PanelRow
              href={r.href}
              label={r.label}
              {...(r.description ? { description: r.description } : {})}
              icon={r.icon ?? "info"}
              built={r.built !== false}
              {...(isCareers && hasRoles ? { badge: `${openRoles.length} open` } : {})}
            />
          );
          if (!isCareers) return <div key={r.label}>{rowEl}</div>;
          return (
            <div
              key={r.label}
              onPointerEnter={show}
              onPointerLeave={hide}
              onFocus={show}
              onBlur={hide}
            >
              {rowEl}
            </div>
          );
        })}
      </div>
      {/* keep the card up while the cursor travels into it */}
      <div onPointerEnter={show} onPointerLeave={hide}>
        {revealed ? (
          <OpenRolesCard roles={openRoles} />
        ) : (
          <SpotlightRenderer spotlight={spotlight} hero />
        )}
      </div>
    </div>
  );
}
```

NOTE: confirm `NavLeaf` exposes `built?` (it does per `PanelRow` usage in `PanelCompany`). If `r.built` isn't on the type, read it as `(r as { built?: boolean }).built`.

- [ ] **Step 2: Verify compile**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/panels/CareersRevealColumn.tsx
git commit -m "feat(web): CareersRevealColumn hover/focus open-roles reveal"
```

---

### Task 6: Wire `openRoles` through Header → DesktopNav → PanelCompany

**Files:**
- Modify: `apps/web/src/components/nav/Header.tsx`
- Modify: `apps/web/src/components/nav/DesktopNav.tsx`
- Modify: `apps/web/src/components/nav/panels/PanelCompany.tsx`

- [ ] **Step 1: Header — fetch + pass**

```tsx
// add import
import { fetchOpenRoles } from "@/components/nav/data/open-roles";

// add fetchOpenRoles() to the Promise.all destructure:
const [latestImages, latestUpdates, resourcesSpotlight, companySpotlight, openRoles] =
  await Promise.all([
    fetchLatestImages(),
    fetchLatestUpdates(),
    getResourcesSpotlight(),
    getCompanySpotlight(),
    fetchOpenRoles(),
  ]);

// add prop on <DesktopNav ... openRoles={openRoles} />
```

- [ ] **Step 2: DesktopNav — thread the prop**

In `DesktopNav.tsx`: add `openRoles: OpenRole[]` to `Props` (import the type), add `openRoles` to the `DesktopNav` destructure, pass `openRoles={openRoles}` into each `<TopLevelItem .../>`, add `openRoles` to `TopLevelItem`'s props, and in the Company branch change:

```tsx
body = <PanelCompany item={item} spotlight={companySpotlight} openRoles={openRoles} />;
```

- [ ] **Step 3: PanelCompany — render the reveal column**

Replace the inner grid in `PanelCompany.tsx` with the new column (keep `PanelShell`):

```tsx
import { CareersRevealColumn } from "@/components/nav/panels/CareersRevealColumn";
import type { OpenRole } from "@/components/nav/data/open-roles";

type Props = { item: NavMegaItem; spotlight: SpotlightCard; openRoles: OpenRole[] };

// inside PanelShell, replace the <div className="grid ..."> ... </div> with:
<CareersRevealColumn rows={item.groups[0]?.items ?? []} spotlight={spotlight} openRoles={openRoles} />
```
Remove the now-unused `PanelRow`/`SpotlightRenderer` imports from `PanelCompany.tsx`.

- [ ] **Step 4: Verify compile + tests + build**

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit && pnpm --filter @cleanstart/web test && pnpm --filter @cleanstart/web lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/nav/Header.tsx apps/web/src/components/nav/DesktopNav.tsx apps/web/src/components/nav/panels/PanelCompany.tsx
git commit -m "feat(web): surface open roles in Company mega menu"
```

---

### Task 7: Mobile parity (count + link)

**Files:**
- Modify: `apps/web/src/components/nav/MobileNav.tsx`

- [ ] **Step 1: Read MobileNav's Company section** to see how items render (it builds from `NAV_TREE`). Add the open-roles count next to the "Careers" entry and ensure it links to `/careers`. If MobileNav is a client component with no server data, fetch the count via the same `/api/jobs?...&limit=0` count or accept it as a prop from `Header` (preferred — pass `openRolesCount={openRoles.length}` into `<MobileNav />`, mirroring DesktopNav). Implement whichever matches MobileNav's current data flow; keep it a small badge like `({count} open)` on the Careers row.

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @cleanstart/web build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nav/MobileNav.tsx apps/web/src/components/nav/Header.tsx
git commit -m "feat(web): mobile nav open-roles count on Careers"
```

---

### Task 8: Verify in the running app

- [ ] **Step 1: Full gate**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web exec tsc --noEmit && pnpm --filter @cleanstart/web build`
Expected: all PASS.

- [ ] **Step 2: Visual check** (web dev server is on :3001, local CMS on :3001's `NEXT_PUBLIC_CMS_URL`)

Open the Company menu: the Careers row shows "N open". Hover/focus Careers → right card becomes the scrollable roster; each role → `/careers/[slug]`; "View all" → `/careers`. With 0 open roles, no badge and the community card stays. Screenshot at 1440×900.

---

## Notes / decisions baked in

- **Local CMS caveat:** the local Docker CMS (:3000) the web dev server reads may have different job data than prod; verify counts against whatever the local CMS holds, not prod's 11.
- **No nav component-test harness exists** (vitest `environment: "node"`, only data-layer `.test.ts`). Tests here cover the data layer (Tasks 1–2); the interactive components are verified via typecheck/build + the visual check (Task 8), matching the codebase's existing test surface. Adding a happy-dom component test for `CareersRevealColumn` is a reasonable optional follow-up but introduces a new pattern.
