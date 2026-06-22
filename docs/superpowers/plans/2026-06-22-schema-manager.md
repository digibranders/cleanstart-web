# Schema Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Scope note (per writing-plans):** this is a *master plan of record* spanning five subsystems. **Phase 0 is specified to bite-sized TDD granularity** and is ready to execute. **Phases 1–4 are specified at task level** (files, deliverables, acceptance criteria, interface shapes); each MUST be expanded into its own dated executable plan at kickoff, because its step-level detail depends on the interfaces Phase 0 finalizes. Do not execute Phases 1–4 from this document alone.

**Goal:** Make every page's Schema.org structured data viewable and editable from a single CMS dashboard — including the 19 hardcoded static pages — without ever adding a runtime CMS dependency to live pages.

**Architecture:** Collapse the two parallel, drifting schema systems (web-side hand-rolled builders vs. the CMS-side dispatcher/add-ons/override engine that is currently dead in production) into one shared composer in `packages/schema`. The web app composes the full JSON-LD `@graph` at build/ISR time from that package, baking it into cached HTML. A new `pageRegistry` collection (keyed by URL path) gives static pages a home and powers the "list every page" view. A custom admin view (Schema Manager) lists all pages, shows the resolved `@graph` block-wise, and lets the SEO team paste/upload raw schema through the existing Zod validator. Schema edits propagate to live pages via the existing on-demand revalidation contract.

**Tech Stack:** Next.js 16 (App Router, ISR), Payload 3, React 19, TypeScript strict, Zod, Vitest, Turborepo/pnpm workspaces.

---

## Locked decisions (CTO-approved 2026-06-22)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Composition lives in `packages/schema`; web composes at build/ISR.** The CMS `/api/jsonld` endpoint becomes a *preview/validation* surface only — never a production render dependency. | Preserves the runtime-CMS-independence guarantee (see Invariants). Kills duplicate logic. |
| D2 | **New `pageRegistry` collection keyed by URL `path`.** One row per *route* (static page, listing page, or collection "template" that deep-links into documents). | Only way to make hardcoded static pages schema-editable + list "every page". |
| D3 | **New `seo` role** may paste/upload raw custom schema sitewide; stays audit-logged. | Lets the SEO team self-serve without full admin; raw JSON-LD stays privileged. |

## Invariants (acceptance criteria that apply to EVERY phase)

- **INV-1 (runtime independence):** A page that has rendered at least once MUST continue to serve correct HTML + JSON-LD with the CMS server fully down. No phase may introduce a per-request CMS fetch on a public page render. Verified by the resilience test in Task 0.7.
- **INV-2 (update propagation):** When schema data changes in the CMS (a `pageRegistry` row, `seo.additionalSchema`, or `seo.schemaAddons`), the affected live path(s) MUST be revalidated via the existing `/api/revalidate` contract so the change appears without a redeploy.
- **INV-3 (lossless migration):** Phase 0 MUST NOT change the JSON-LD bytes emitted for any existing page type, except where a Phase 4 consistency fix is explicitly intended. Verified by snapshot tests.
- **INV-4 (typed boundaries):** All composer I/O, registry rows, and override payloads are Zod-validated at the boundary. No `any`. Explicit return types on exported functions.
- **INV-5 (override semantics):** An override is a **persistent, per-`@type` layer**, never a frozen HTML snapshot. It MUST survive republish/rebuild unchanged, and MUST only replace the node(s) whose top-level `@type` it provides — all other nodes (including globally-managed entities) stay live and auto-update. See "Override semantics" below.

---

## Override semantics & global propagation (authoritative)

This is the contract the whole feature hangs on. `composeGraph` runs on **every** build / ISR / republish and rebuilds the page `@graph` from three layers each time:

```
Layer 1  auto      ← derived from CURRENT doc fields + CURRENT globals      (always live)
Layer 2  add-ons   ← editor blocks stored on the doc / registry row         (persistent data)
Layer 3  override  ← pasted/uploaded JSON-LD, merged by @type (mergeByType)  (persistent data)
```

**Rules:**
1. **Persistence:** the override is stored DATA (`seo.additionalSchema` / `seo.schemaAddons` / `pageRegistry` row), re-read and re-applied on every compose. Republishing/rebuilding NEVER wipes it. It changes only when an editor changes it. **Rebuild ≠ reset.**
2. **Per-`@type` merge, not whole-graph replace:** `mergeByType(auto, overrideNodes)` replaces an auto node only when an override node shares its top-level `@type`; otherwise the override node is appended. Every non-overridden node stays from the auto/global layer.
3. **Global propagation:** because shared entities (`Organization`, `WebSite`) come from the global layer and are referenced elsewhere by `@id`, a later change to global Org settings **DOES** flow into a page that has a page-level override — the override lives on a *different* node (e.g. `Article`). The only way a page stops receiving global Org changes is if an editor explicitly overrides the `Organization` node itself (discouraged; warned by the validator).
4. **Shared entities live in Global Settings only**, emitted once and referenced by `@id`. Phase 4 fixes `JobPosting` to reference Org by `@id` (inlining is exactly what accidentally freezes a shared entity).
5. **Validator warning (Phase 3):** a paste/upload containing `Organization` / `WebSite` triggers *"you're overriding a globally-managed entity — this page will stop receiving future global changes."* The "diff vs auto" panel makes the change visible.
6. **Revalidation scope (extends INV-2):** a **page-level** override save revalidates *that path*; a **global settings** change revalidates **all pages** (the Org node is baked into every page's HTML) via a site-wide tag.

**Worked example.** `/cleansight` auto-emits `Organization` (global, by `@id`), `SoftwareApplication`, `BreadcrumbList`. Editor overrides only `SoftwareApplication`. Later the company name changes in global Org settings:

| Node | After override | After later global Org change |
|---|---|---|
| `SoftwareApplication` | overridden version | unchanged (still overridden) |
| `Organization` | live from global | **auto-updates** to new global value |
| `BreadcrumbList` | live (auto) | live |

---

## Review & verification protocol (applies to every task)

Each task is **not done** until all of the following pass. This is the definition of done.

**Per-task (the TDD loop):**
1. Write the failing test first; run it; confirm it fails for the expected reason.
2. Implement the minimal code; run the test; confirm it passes.
3. Run the touched package's scoped checks before committing:
   - `pnpm --filter <pkg> lint && pnpm --filter <pkg> typecheck && pnpm --filter <pkg> test`
4. Commit with a conventional-commit message (no `git add -A`; stage explicit paths; never `--no-verify`).

**Per-phase gate (before moving to the next phase):**
1. Full scoped build of every touched app: `pnpm --filter <pkg> build`.
2. `pnpm --filter @cleanstart/cms generate:types` → zero drift (commit if it regenerates).
3. All snapshot tests green (INV-3) — diffs only where a Phase-4 change is *intended*.
4. **Code review** via `superpowers:requesting-code-review` (or the `/code-review` skill) on the phase diff; address findings before the gate closes.
5. Re-confirm the invariants touched by the phase (INV-1 resilience test, INV-2 revalidation, INV-5 override semantics).

**Pre-merge to `development`:**
- Phase 0 only: manual INV-1 proof — `pnpm --filter @cleanstart/web build && start`, stop the CMS, `curl` a built page → HTTP 200 with `application/ld+json` present in the HTML. Record the curl output in the PR description.

## File structure (all phases)

### New shared package — `packages/schema`
```
packages/schema/
├── package.json                      @cleanstart/schema (private workspace pkg)
├── tsconfig.json                     extends packages/config
├── src/
│   ├── index.ts                      public exports
│   ├── types.ts                      SchemaGraph, GraphNode, AutoInput, OverrideInput, AddonBlock
│   ├── builders/                     ← moved verbatim from apps/web/src/lib/seo/jsonld.tsx
│   │   ├── organization.ts           organizationSchema, webSiteSchema
│   │   ├── article.ts                blogPostingSchema, articleSchema, newsArticleSchema
│   │   ├── event.ts                  eventSchema, webinarListSchema
│   │   ├── job.ts                    jobPostingSchema
│   │   ├── product.ts                softwareApplicationSchema
│   │   ├── lists.ts                  itemListSchema, caseStudyListSchema
│   │   ├── person.ts                 profilePageSchema
│   │   ├── breadcrumb.ts             breadcrumbSchema
│   │   └── misc.ts                   faqPageSchema, videoObjectSchema, podcastSeriesSchema
│   ├── compose/
│   │   ├── compose-graph.ts          composeGraph({ auto, addons, override }) → SchemaGraph
│   │   └── merge.ts                  merge-by-@type / append semantics, @id de-duplication
│   ├── validate/
│   │   ├── override-validator.ts     ← moved from apps/cms/src/payload/lib/jsonld/override-validator.ts
│   │   ├── allowlist.ts              ALLOWED_OVERRIDE_TYPES (single source)
│   │   └── rich-result-rules.ts      NEW: required-field checks per Google rich-result type
│   └── __tests__/                    Vitest co-located specs
```

### `apps/web` (renderer)
```
apps/web/src/lib/seo/jsonld.tsx       → becomes a thin re-export shim of @cleanstart/schema (back-compat for 40 import sites)
apps/web/src/lib/seo/compose-page.ts  NEW: per-page glue: fetch overrides (already in the doc/registry) → composeGraph → one <script>
apps/web/src/components/JsonLdGraph.tsx NEW: renders ONE <script type="application/ld+json"> from a SchemaGraph
apps/web/src/lib/page-registry.ts     NEW: fetch a pageRegistry row by path (build/ISR cached, same as cms-fetch)
```

### `apps/cms` (editor + preview + governance)
```
apps/cms/src/payload/collections/PageRegistry.ts          NEW collection (D2)
apps/cms/src/payload/lib/jsonld/                           dispatcher re-points at @cleanstart/schema
apps/cms/src/payload/fields/seo.ts                         additionalSchema access widened to seo role (D3)
apps/cms/src/payload/access/roles.ts                       NEW 'seo' role + isSeoOrAdmin helper
apps/cms/src/payload/admin/components/schema-manager/
│   ├── SchemaManagerNavLink.tsx                           sidebar entry (afterNavLinks)
│   ├── SchemaManagerListView.tsx                          custom view: all pages
│   └── SchemaManagerDetailView.tsx                        per-page @graph (block-wise) + paste/upload + validate
apps/cms/src/payload/hooks/revalidate-schema.ts           NEW afterChange → /api/revalidate (INV-2)
apps/cms/src/payload.config.ts                             register collection, view, nav link, hook
apps/cms/scripts/seed-page-registry.ts                     NEW seed all 42 routes from WEB-PAGES.md + nav-config
```

---

## Phase 0 — Unify the two systems (PREREQUISITE)

> Goal: one composer in `packages/schema`, consumed by web, emitting one `@graph` per page that is byte-equivalent to today (INV-3). Wire web to read the editor override fields it already receives in the doc, so the existing CMS controls become live. **Nothing else in this plan is real until Phase 0 lands.**

Branch: `development` (touches `apps/cms`, `apps/web`, `packages/`).

### Task 0.1: Scaffold `packages/schema`

**Files:**
- Create: `packages/schema/package.json`
- Create: `packages/schema/tsconfig.json`
- Create: `packages/schema/src/index.ts`
- Create: `packages/schema/src/types.ts`

- [ ] **Step 1: Write `package.json`** mirroring `@cleanstart/ui` conventions

```json
{
  "name": "@cleanstart/schema",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": { "vitest": "catalog:" }
}
```

- [ ] **Step 2: Write `tsconfig.json`** extending the shared base

```json
{ "extends": "@cleanstart/config/tsconfig.base.json", "include": ["src"] }
```

- [ ] **Step 3: Define core types in `src/types.ts`**

```ts
export type GraphNode = Record<string, unknown> & { "@type": string | string[]; "@id"?: string };
export interface SchemaGraph { "@context": "https://schema.org"; "@graph": GraphNode[]; }
export interface AddonBlock { blockType: string; [k: string]: unknown; }
export interface ComposeInput {
  auto: GraphNode[];
  addonNodes?: GraphNode[]; // already built by the caller's builders (CMS dispatchAddons / web adapter)
  override?: unknown; // raw paste; validated before use, dropped fail-safe if invalid
}
```

- [ ] **Step 4: `src/index.ts` re-exports** (empty stubs for now)

```ts
export * from "./types";
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter @cleanstart/schema typecheck`
Expected: PASS (no errors).

- [ ] **Step 6: Commit**

```bash
git add packages/schema
git commit -m "feat(schema): scaffold @cleanstart/schema package"
```

### Task 0.2: Move web builders into the package (no logic change)

**Files:**
- Create: `packages/schema/src/builders/*.ts` (split from the source below)
- Modify: `apps/web/src/lib/seo/jsonld.tsx` (becomes a re-export shim)
- Reference (read): `apps/web/src/lib/seo/jsonld.tsx` (current 675-line source of truth)

- [ ] **Step 1: Snapshot the current public surface** — list every export of `apps/web/src/lib/seo/jsonld.tsx` so the shim re-exports all 17 builders + `JsonLd` + the input types. Record the list in the commit body.

- [ ] **Step 2: Move builders verbatim** into `packages/schema/src/builders/` grouped per the File Structure map. Keep function bodies identical; only change the `absoluteUrl`/`SITE_URL` import to a small injected config (see Step 3) so the package has no `apps/web` dependency.

- [ ] **Step 3: Add `configureSchema({ siteUrl, siteName })`** in `src/compose/config.ts` so builders read the base URL from package config instead of `process.env.NEXT_PUBLIC_SITE_URL`. Web calls `configureSchema` once at startup.

- [ ] **Step 4: Turn `apps/web/src/lib/seo/jsonld.tsx` into a shim**

```tsx
// Back-compat shim: 40 page files import from here. Real code lives in @cleanstart/schema.
export * from "@cleanstart/schema";
export { JsonLd } from "@cleanstart/schema"; // unchanged React component, moved with builders
```

- [ ] **Step 5: Run web typecheck + the existing jsonld tests**

Run: `pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/schema test`
Expected: PASS. All 40 import sites still resolve via the shim.

- [ ] **Step 6: Commit**

```bash
git add packages/schema apps/web/src/lib/seo/jsonld.tsx
git commit -m "refactor(schema): move web JSON-LD builders into @cleanstart/schema (no behavior change)"
```

### Task 0.3: Move the override validator into the package (single source)

**Files:**
- Create: `packages/schema/src/validate/override-validator.ts`, `allowlist.ts`
- Modify: `apps/cms/src/payload/lib/jsonld/override-validator.ts` → re-export shim
- Test: `packages/schema/src/__tests__/override-validator.test.ts`

- [ ] **Step 1: Move `override-validator.ts` + `ALLOWED_OVERRIDE_TYPES`** verbatim into the package. Keep the 16 KB cap and per-collection gating.
- [ ] **Step 2: Port the existing CMS validator tests** into the package test file.
- [ ] **Step 3: Make the CMS file a shim** re-exporting from `@cleanstart/schema/validate`.
- [ ] **Step 4: Run** `pnpm --filter @cleanstart/schema test && pnpm --filter @cleanstart/cms typecheck` → PASS.
- [ ] **Step 5: Commit** `refactor(schema): single-source the JSON-LD override validator`.

### Task 0.4: `composeGraph` — one connected `@graph`

**Files:**
- Create: `packages/schema/src/compose/compose-graph.ts`, `merge.ts`
- Test: `packages/schema/src/__tests__/compose-graph.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { composeGraph } from "../compose/compose-graph";

describe("composeGraph", () => {
  it("returns a single @graph merging auto nodes", () => {
    const out = composeGraph({ auto: [{ "@type": "Organization", "@id": "x/#org" }, { "@type": "WebSite" }] });
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@graph"]).toHaveLength(2);
  });

  it("appends pre-built add-on nodes after auto nodes", () => {
    const out = composeGraph({ auto: [{ "@type": "Article" }], addonNodes: [{ "@type": "FAQPage", mainEntity: [] }] });
    expect(out["@graph"].some((n) => n["@type"] === "FAQPage")).toBe(true);
  });

  it("applies a valid override last, replacing the same @type", () => {
    const out = composeGraph({
      auto: [{ "@type": "Article", headline: "auto" }],
      override: { "@type": "Article", headline: "override" },
    });
    const article = out["@graph"].find((n) => n["@type"] === "Article");
    expect(article?.headline).toBe("override");
  });

  it("ignores an invalid override and keeps auto (fail-safe)", () => {
    const out = composeGraph({ auto: [{ "@type": "Article" }], override: { "@type": "NotAllowedType" } });
    expect(out["@graph"]).toHaveLength(1);
    expect(out["@graph"][0]["@type"]).toBe("Article");
  });

  // INV-5: per-@type merge — global propagation
  it("propagates a changed global node into an overridden page (override is on a different @type)", () => {
    const override = { "@type": "Article", headline: "override" };
    const before = composeGraph({ auto: [{ "@type": "Organization", name: "Old" }, { "@type": "Article", headline: "auto" }], override });
    const after = composeGraph({ auto: [{ "@type": "Organization", name: "New" }, { "@type": "Article", headline: "auto" }], override });
    expect((after["@graph"].find((n) => n["@type"] === "Organization") as { name: string }).name).toBe("New");
    expect((after["@graph"].find((n) => n["@type"] === "Article") as { headline: string }).headline).toBe("override");
    expect(before).not.toEqual(after); // org changed, override stayed
  });

  // INV-5: persistence — same stored override re-composes identically (rebuild != reset)
  it("is deterministic: same inputs always produce the same @graph", () => {
    const input = { auto: [{ "@type": "Article", headline: "x" }], override: { "@type": "Article", headline: "y" } };
    expect(composeGraph(input)).toEqual(composeGraph(input));
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter @cleanstart/schema test compose-graph` → FAIL (composeGraph not defined).

- [ ] **Step 3: Implement `compose-graph.ts`**

```ts
import type { ComposeInput, SchemaGraph, GraphNode } from "../types";
import { addonToNode } from "./addon-to-node";
import { validateOverride } from "../validate/override-validator";
import { mergeByType } from "./merge";

export function composeGraph(input: ComposeInput): SchemaGraph {
  const nodes: GraphNode[] = [...input.auto];
  for (const block of input.addons ?? []) {
    const node = addonToNode(block);
    if (node) nodes.push(node);
  }
  let graph = nodes;
  if (input.override != null) {
    const result = validateOverride(input.override);
    if (result.ok) graph = mergeByType(nodes, result.nodes);
    // invalid override is dropped — fail-safe to auto (INV-1 spirit; never ship broken schema)
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
```

- [ ] **Step 4: Implement `merge.ts`** (`mergeByType`: override node with a matching top-level `@type` replaces the auto node; otherwise appended; de-dupe by `@id`). Implement `addon-to-node.ts` by reusing the six add-on→blob mappings already in `apps/cms/src/payload/lib/jsonld/addons/` (move them into the package).

- [ ] **Step 5: Run** → PASS (all 4 cases).

- [ ] **Step 6: Commit** `feat(schema): add composeGraph single-@graph composer`.

### Task 0.5: Web emits ONE `@graph` per page via `compose-page.ts`

**Files:**
- Create: `apps/web/src/lib/seo/compose-page.ts`
- Create: `apps/web/src/components/JsonLdGraph.tsx`
- Modify: one representative page first — `apps/web/src/app/blogs/[slug]/page.tsx`

- [ ] **Step 1: Write `JsonLdGraph.tsx`** — renders exactly one `<script type="application/ld+json">` from a `SchemaGraph`, reusing the existing `</script>`-escaping from the old `JsonLd`.

- [ ] **Step 2: Write `compose-page.ts`** — `buildPageGraph({ autoNodes, doc })` reads `doc.seo.schemaAddons` + `doc.seo.additionalSchema` (already present on the depth=2 doc the page fetches) and calls `composeGraph`. **No new fetch** (INV-1).

- [ ] **Step 3: Convert the blog detail page** to build `autoNodes` from the existing builders, then render a single `<JsonLdGraph>` instead of multiple `<JsonLd>` blocks.

- [ ] **Step 4: Snapshot test (INV-3)** — `apps/web/src/lib/seo/__tests__/compose-page.test.ts`: feed a fixture blog doc, assert the composed `@graph` contains the same nodes (BlogPosting, BreadcrumbList, FAQ-if-present) the old path produced. Run → PASS.

- [ ] **Step 5: Roll out to the remaining 39 pages** one commit per page-type cluster (detail routes, listing routes, static routes), each guarded by a snapshot. Keep the shim so any un-migrated page still works mid-rollout.

- [ ] **Step 6: Commit** per cluster, e.g. `refactor(web): emit single JSON-LD @graph on blog detail`.

### Task 0.6: Provision web read access to override fields

**Files:**
- Modify: `apps/cms/src/payload/fields/seo.ts` (the `additionalSchema` field-level read access)
- Reference: prod checklist item 13 (`preview-bot` API-key user) in `CLAUDE.md`

- [ ] **Step 1:** Widen `additionalSchema` field-level *read* so the authenticated build/ISR fetch (using `CMS_API_KEY`) receives it, while anonymous reads still do not (keeps it out of public API). `schemaAddons` is already non-admin-read; confirm it serializes at depth=2.
- [ ] **Step 2:** Add a regression test asserting an authenticated REST read returns `seo.additionalSchema` and an anonymous read does not.
- [ ] **Step 3:** Run `pnpm --filter @cleanstart/cms test` → PASS.
- [ ] **Step 4: Commit** `feat(cms): expose seo.additionalSchema to authenticated build reads`.

### Task 0.7: Prove runtime independence (INV-1)

**Files:**
- Test: `apps/web/src/lib/__tests__/cms-down-resilience.test.ts`

- [ ] **Step 1: Write the test** — mock `fetchCMS` to reject (connection refused). Assert that `buildPageGraph` for an already-fetched doc still returns a complete `@graph` (composition is pure, post-fetch). Document in the test header the manual verification: build the site, `next start`, stop the CMS, curl a built page → 200 with JSON-LD present.
- [ ] **Step 2: Run** → PASS.
- [ ] **Step 3: Commit** `test(web): assert JSON-LD composition survives CMS outage`.

### Task 0.8: Phase 0 gate

- [ ] Run the full pre-completion suite for both touched packages:
  `pnpm --filter @cleanstart/schema test && pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build && pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build`
- [ ] Confirm `payload generate:types` shows no drift (commit if it does).
- [ ] All snapshot tests green (INV-3). **Phase 0 done = editor add-ons/override now affect live pages.**

---

## Phase 1 — Page Registry (unlock static pages) — *expand to own plan at kickoff*

**Deliverables**
- `PageRegistry` collection: fields `path` (text, unique, validated), `title` (text), `kind` (select: `static`|`cms-listing`|`cms-template`), `backingCollection` (text, conditional on `cms-template`), `schemaAddons` (the existing add-on blocks field, reused), `additionalSchema` (raw override, `seo`-role gated), and a read-only computed `autoPreview` (the auto `@graph` for that route).
- `seed-page-registry.ts`: enumerate all 42 routes from `docs/web/WEB-PAGES.md` + `apps/web/src/lib/nav-config.ts`; idempotent/skip-safe.
- `apps/web/src/lib/page-registry.ts`: `getRegistryRow(path)` — build/ISR cached via `fetchCMS` (same revalidate semantics; INV-1 preserved).
- Static `page.tsx` components feed `getRegistryRow(path)` overrides into `buildPageGraph`.

**Acceptance**
- Every static page's JSON-LD can be overridden from its registry row, baked at build/ISR (INV-1).
- Seed produces exactly one row per route incl. all 19 static pages; re-run skips existing.
- `payload generate:types` committed.

## Phase 2 — Schema Manager admin UI — *expand to own plan at kickoff*

**Deliverables** (reuse proven `admin.components.views.dashboard` + `afterNavLinks` pattern)
- `SchemaManagerNavLink.tsx` mounted in `afterNavLinks`; `views.schemaManager` registered in `payload.config.ts`.
- **List view:** all `pageRegistry` rows → columns: title, path, kind, types-emitted, "has override" flag, health badge. CMS-template rows link into their collection.
- **Detail view:** resolved `@graph` rendered **block-wise** grouped by `@type` with provenance labels (Auto / Add-on / Override); raw-schema paste textarea; `.txt`/`.json` file upload that parses into the same field; "Diff vs auto" panel.

**Acceptance**
- A static page and a CMS-backed page can both have their full schema viewed and a custom block edited from the dashboard.
- Upload of a `.txt`/`.json` populates the override field identically to paste.

## Phase 3 — Validator & governance — *expand to own plan at kickoff*

**Deliverables**
- `rich-result-rules.ts`: required/recommended-field checks per Google rich-result type (e.g. `JobPosting` → `title`,`datePosted`,`hiringOrganization`), surfaced live in the detail view (syntax → allowlist → required-field → 16 KB cap).
- `roles.ts`: `seo` role + `isSeoOrAdmin`; `additionalSchema` update access widened from `isAdmin` to `isSeoOrAdmin`; audit-log retained.
- `revalidate-schema.ts`: `afterChange` on `pageRegistry` + on the SEO group → POST `/api/revalidate` with the affected `paths` (INV-2), reusing `lib/web-revalidate.ts` + `WEB_REVALIDATE_SECRET`.

**Acceptance**
- Pasting invalid/ineligible schema shows actionable errors before save; valid schema saves, audit-logs, and revalidates the live path.
- An `seo`-role user (not admin) can edit schema; an `editor` cannot touch raw override.
- INV-2 verified end-to-end: edit → save → live path reflects change without redeploy.

## Phase 4 — Consistency fixes — *expand to own plan at kickoff*

**Deliverables** (each behind a snapshot diff; these are the *intended* exceptions to INV-3)
- `/events` listing → `ItemList`-of-`Event` (parity with `/webinars`).
- `jobPostingSchema` Organization → `@id` reference to the global Organization node.
- Product pages' `applicationCategory` / `operatingSystem` made overridable via registry row.
- Centralize the duplicated event-status enum maps into one in `packages/schema`.

**Acceptance:** snapshot updates reviewed and intentional; rich-result tests pass for each changed type.

---

## Self-review

- **Spec coverage:** dashboard + nav item (Phase 2), list of all pages incl. static (Phases 1–2), per-page block-wise schema view (Phase 2), paste custom schema (Phases 0/2/3), upload `.txt` (Phase 2), validator (Phase 3), edit entire/by-type/by-block (composeGraph merge semantics, Phase 0 + Phase 2 UI). ✓
- **Runtime-independence doubt (user's explicit concern):** encoded as INV-1 with a dedicated test (Task 0.7) and as the reason D1 was chosen over a runtime `/api/jsonld` fetch. ✓
- **Update propagation:** INV-2 + Phase 3 revalidate hook. ✓
- **Type consistency:** `composeGraph`, `SchemaGraph`, `buildPageGraph`, `getRegistryRow`, `isSeoOrAdmin` used consistently across phases. ✓
- **Branch policy:** all `development` (touches CMS + packages), never `farheen`. ✓
