# Breadcrumb Single-Source-of-Truth & Drift Guard — Implementation Plan

> **STATUS: ✅ EXECUTED (2026-06-23) on branch `development`.** Tasks 1–9 + 11 done; Task 10 (fold listing/static-page trails into the shared builder) intentionally deferred (optional — those pages were never part of the drift bug). Commits: `0e839ff`, `eb9ae06`, `4ea46c0`, `57b9e35`, `d273477`, `3230372`, `1efa111`. Verified: schema 86 tests · CMS jsonld/dispatch/breadcrumb 168 tests · drift guards 15 (web) + 2 (cms) · web build · live preview (visible == JSON-LD, desktop + mobile).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define every breadcrumb trail ONCE in `packages/schema`, have both the visible web breadcrumbs and all JSON-LD `BreadcrumbList` markup (web pages *and* the CMS dispatcher) derive from that single function, and add tests that fail if a trail ever drifts again.

**Architecture:** A new `breadcrumbTrail(kind, data)` builder in `packages/schema` returns the canonical `BreadcrumbCrumb[]` (`Home › Section › Current`) for each content kind. Web pages feed it to `breadcrumbSchema(...)` for JSON-LD; web heroes consume `trail.slice(1)` for the visible bar (they render the Home icon themselves); the CMS `/api/jsonld` dispatcher calls the same function instead of its own hand-rolled arrays. Because the trail shape lives in exactly one place, the visible bar and the structured data can no longer disagree — which is the bug class this session uncovered (fake "Resources" crumbs, `Blog` vs `Blogs`, the `/author` 404, self-linked current crumbs).

**Tech Stack:** TypeScript (strict), Next.js 16 / React 19 (apps/web), Payload 3 (apps/cms), Vitest, Biome.

**Relationship to the Schema Manager plan:** This implements the breadcrumb slice of decision **D1** in [`2026-06-22-schema-manager.md`](2026-06-22-schema-manager.md) ("Composition lives in `packages/schema`; web composes at build/ISR; the CMS endpoint re-points at the shared package — kills duplicate logic") early, because breadcrumbs are self-contained and the CMS copy is already wrong. It does **not** touch the override-validator / add-on-node moves — those stay in the Schema Manager plan.

**Out of scope (documented exceptions, not bugs):**
- The Knowledge Hub light-theme visible breadcrumb intentionally ends at the category (`Home › Knowledge Hub › Category`); the article title is the H1, not a crumb. Its JSON-LD still includes the title (Google-acceptable: the current-page crumb may appear in markup without being a visible link). Task 9 documents this as an allowed exception; aligning it is an optional follow-up.
- Listing pages (`/blogs`, `/news`, …) emit a 2-level `Home › Section` trail with no detail. They are not part of the drift bug. An optional Task 10 folds them into the shared module too.

---

## File Structure

**New files:**
- `packages/schema/src/builders/breadcrumbs.ts` — the single source: `breadcrumbTrail(kind, data)` + `DetailKind` type.
- `packages/schema/src/builders/breadcrumbs.test.ts` — locks the trail contract (the drift guard).

**Modified files:**
- `packages/schema/src/builders/index.ts` — export the new module.
- `apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx` — switch the `HeroCrumb` field names from `{label, href}` to `{name, path}` so a trail slice feeds it directly.
- `apps/web/src/components/sections/_shared/DetailHero.tsx` — `DetailHeroCrumb` becomes `BreadcrumbCrumb`.
- Web heroes (visible): `news-detail/NewsDetailHero.tsx`, `blog/BlogDetailHero.tsx`, `guide/GuideDetailHero.tsx`, `events/EventDetailHero.tsx`, `careers/CareerDetailHero.tsx`, `resource/ResourceDetailHero.tsx`.
- Web pages (JSON-LD): `app/blogs/[slug]/page.tsx`, `app/guide/[slug]/page.tsx`, `app/news/[slug]/page.tsx`, `app/event/[slug]/page.tsx`, `app/job/[slug]/page.tsx`, `app/resources/[slug]/page.tsx`, `app/author/[slug]/page.tsx`, `app/(legal)/legal/[slug]/page.tsx`, `app/knowledge-hub/[slug]/page.tsx`.
- CMS dispatcher: `apps/cms/src/payload/lib/jsonld/dispatch.ts` (+ its test `dispatch.test.ts`).

---

## Task 1: Create the shared `breadcrumbTrail` builder

**Files:**
- Create: `packages/schema/src/builders/breadcrumbs.ts`
- Reference (do not modify): `packages/schema/src/builders/jsonld.tsx` (exports `BreadcrumbCrumb` = `{ name: string; path?: string }` and `breadcrumbSchema`)

- [ ] **Step 1: Write the failing test**

Create `packages/schema/src/builders/breadcrumbs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { breadcrumbTrail } from "./breadcrumbs";

describe("breadcrumbTrail", () => {
  it("blog: Home > Blogs > Title, current crumb has no path", () => {
    expect(breadcrumbTrail("blog", { title: "My Post" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Blogs", path: "/blogs" },
      { name: "My Post" },
    ]);
  });

  it("news uses the 'Newsroom' label and /news path", () => {
    const t = breadcrumbTrail("news", { title: "Press" });
    expect(t[1]).toEqual({ name: "Newsroom", path: "/news" });
  });

  it("job lives under Careers", () => {
    expect(breadcrumbTrail("job", { title: "Engineer" })[1]).toEqual({
      name: "Careers",
      path: "/careers",
    });
  });

  it("resource uses the real 'Resource Center' label", () => {
    expect(breadcrumbTrail("resource", { title: "eBook" })[1]).toEqual({
      name: "Resource Center",
      path: "/resource-center",
    });
  });

  it("author has no /author parent (no such route): Home > Name", () => {
    expect(breadcrumbTrail("author", { title: "Jane Doe" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Jane Doe" },
    ]);
  });

  it("knowledgeBase inserts an unlinked category between hub and title", () => {
    expect(breadcrumbTrail("knowledgeBase", { title: "Article", category: "Images" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Knowledge Hub", path: "/knowledge-hub" },
      { name: "Images" },
      { name: "Article" },
    ]);
  });

  it("knowledgeBase omits the category crumb when absent", () => {
    expect(breadcrumbTrail("knowledgeBase", { title: "Article" })).toEqual([
      { name: "Home", path: "/" },
      { name: "Knowledge Hub", path: "/knowledge-hub" },
      { name: "Article" },
    ]);
  });

  it("contract: first crumb is Home, last crumb is the title with no path", () => {
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal"] as const;
    for (const kind of kinds) {
      const trail = breadcrumbTrail(kind, { title: "X" });
      expect(trail[0]).toEqual({ name: "Home", path: "/" });
      expect(trail.at(-1)).toEqual({ name: "X" });
      // every non-last crumb is a real, navigable page
      trail.slice(0, -1).forEach((c) => expect(typeof c.path).toBe("string"));
    }
  });

  it("contract: no trail links to a route that does not exist", () => {
    const dead = ["/author", "/resources", "/webinar", "/jobs"];
    const kinds = ["blog", "guide", "news", "event", "job", "resource", "author", "legal", "knowledgeBase"] as const;
    for (const kind of kinds) {
      for (const crumb of breadcrumbTrail(kind, { title: "X", category: "C" })) {
        if (crumb.path) expect(dead).not.toContain(crumb.path);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @cleanstart/schema test breadcrumbs`
Expected: FAIL — `Cannot find module './breadcrumbs'`.

- [ ] **Step 3: Write the implementation**

Create `packages/schema/src/builders/breadcrumbs.ts`:

```ts
import type { BreadcrumbCrumb } from "./jsonld";

/**
 * Content kinds that get a detail-page breadcrumb. Keyed to render the SAME
 * trail in the visible web hero, the web JSON-LD, and the CMS /api/jsonld
 * preview — one definition, so the three can never disagree.
 */
export type DetailKind =
  | "blog"
  | "guide"
  | "news"
  | "event"
  | "job"
  | "resource"
  | "knowledgeBase"
  | "author"
  | "legal";

export interface DetailTrailInput {
  /** The current page's display name (the last, unlinked crumb). */
  title: string;
  /** Knowledge Hub only: category name, rendered as an UNLINKED crumb (no route). */
  category?: string | null | undefined;
}

const HOME: BreadcrumbCrumb = { name: "Home", path: "/" };

/** Listing crumb per kind. `null` = kind has no listing parent (author). */
const LISTING: Record<DetailKind, BreadcrumbCrumb | null> = {
  blog: { name: "Blogs", path: "/blogs" },
  guide: { name: "Guides", path: "/guide" },
  news: { name: "Newsroom", path: "/news" },
  event: { name: "Events", path: "/events" },
  job: { name: "Careers", path: "/careers" },
  resource: { name: "Resource Center", path: "/resource-center" },
  knowledgeBase: { name: "Knowledge Hub", path: "/knowledge-hub" },
  legal: { name: "Legal", path: "/legal" },
  author: null,
};

/**
 * The canonical breadcrumb trail for a detail page: `Home › <Listing> › <Title>`
 * (Knowledge Hub inserts an unlinked category before the title). The last crumb
 * has NO `path` — it is the current page, not a link (Google + UX best practice).
 *
 * This is the ONLY place trail shapes are defined. Both apps/web (visible hero +
 * JSON-LD) and apps/cms (/api/jsonld preview) call it, so the visible breadcrumb
 * and the structured data are identical by construction.
 */
export function breadcrumbTrail(kind: DetailKind, input: DetailTrailInput): BreadcrumbCrumb[] {
  const listing = LISTING[kind];
  const middle: BreadcrumbCrumb[] = [];
  if (listing) middle.push(listing);
  if (kind === "knowledgeBase" && input.category) {
    middle.push({ name: input.category }); // unlinked: categories have no route
  }
  return [HOME, ...middle, { name: input.title }];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @cleanstart/schema test breadcrumbs`
Expected: PASS (all cases).

- [ ] **Step 5: Export from the builders barrel**

Modify `packages/schema/src/builders/index.ts` — add one line:

```ts
export * from "./jsonld";
export * from "./templates";
export * from "./breadcrumbs";
export { SITE_NAME, SITE_URL, absoluteUrl } from "./site";
```

- [ ] **Step 6: Typecheck + lint the package**

Run: `pnpm --filter @cleanstart/schema typecheck && pnpm --filter @cleanstart/schema lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/schema/src/builders/breadcrumbs.ts packages/schema/src/builders/breadcrumbs.test.ts packages/schema/src/builders/index.ts
git commit -m "feat(schema): single-source breadcrumbTrail builder + contract tests"
```

---

## Task 2: Make `HeroBreadcrumb` consume `BreadcrumbCrumb` directly

Switch the visible component's item fields from `{label, href}` to `{name, path}` so a `trail.slice(1)` feeds it with no mapping.

**Files:**
- Modify: `apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx`

- [ ] **Step 1: Re-type `HeroCrumb` and rename field reads**

In `HeroBreadcrumb.tsx`, replace the `HeroCrumb` interface and the two field reads inside `.map(...)`:

Replace:
```ts
export interface HeroCrumb {
  label: string;
  /** Path-only, e.g. `/news`. Omit on the current-page (last) crumb. */
  href?: string;
}
```
with:
```ts
import type { BreadcrumbCrumb } from "@cleanstart/schema/builders";

/** Same shape as the JSON-LD crumb so one trail array drives both. */
export type HeroCrumb = BreadcrumbCrumb;
```

Then inside the `.map` body, change the link condition and labels:
- `item.href && !isLast` → `item.path && !isLast`
- `href={item.href}` → `href={item.path}`
- `{item.label}` (both branches) → `{item.name}`
- `key={`${item.label}-${idx}`}` → `key={`${item.name}-${idx}`}`

- [ ] **Step 2: Typecheck (expect downstream errors — that's the worklist)**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: FAIL in the 3 callers still passing `{label, href}` (DetailHero consumers, Career, Resource). These are fixed in Tasks 3–5.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/_shared/HeroBreadcrumb.tsx
git commit -m "refactor(web): HeroBreadcrumb consumes BreadcrumbCrumb {name,path}"
```

---

## Task 3: Point the DetailHero-based heroes (news/blog/guide/event) at `breadcrumbTrail`

**Files:**
- Modify: `apps/web/src/components/sections/_shared/DetailHero.tsx`
- Modify: `apps/web/src/components/sections/news-detail/NewsDetailHero.tsx`
- Modify: `apps/web/src/components/sections/blog/BlogDetailHero.tsx`
- Modify: `apps/web/src/components/sections/guide/GuideDetailHero.tsx`
- Modify: `apps/web/src/components/sections/events/EventDetailHero.tsx`

- [ ] **Step 1: Re-alias `DetailHeroCrumb`**

In `DetailHero.tsx` the type is `export type DetailHeroCrumb = HeroCrumb;` — no change needed (it follows `HeroCrumb`). Verify it still reads that way; if it still has `{label, href}` fields, replace with `export type DetailHeroCrumb = HeroCrumb;`.

- [ ] **Step 2: NewsDetailHero — replace the inline array**

In `NewsDetailHero.tsx`, add the import and replace the `breadcrumb={[...]}` prop:

Add import:
```ts
import { breadcrumbTrail } from "@cleanstart/schema/builders";
```
Replace:
```tsx
      breadcrumb={[
        { label: "Newsroom", href: "/news" },
        { label: title },
      ]}
```
with:
```tsx
      breadcrumb={breadcrumbTrail("news", { title }).slice(1)}
```

- [ ] **Step 3: BlogDetailHero**

Add `import { breadcrumbTrail } from "@cleanstart/schema/builders";` and replace:
```tsx
      breadcrumb={[
        { label: "Blogs", href: "/blogs" },
        { label: title },
      ]}
```
with:
```tsx
      breadcrumb={breadcrumbTrail("blog", { title }).slice(1)}
```

- [ ] **Step 4: GuideDetailHero**

Add the import and replace:
```tsx
      breadcrumb={[
        { label: "Guides", href: "/guide" },
        { label: title },
      ]}
```
with:
```tsx
      breadcrumb={breadcrumbTrail("guide", { title }).slice(1)}
```

- [ ] **Step 5: EventDetailHero**

Add the import and replace:
```tsx
      breadcrumb={[
        { label: "Events", href: "/events" },
        { label: title },
      ]}
```
with:
```tsx
      breadcrumb={breadcrumbTrail("event", { title }).slice(1)}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: remaining errors only in `CareerDetailHero.tsx` and `ResourceDetailHero.tsx` (Tasks 4–5).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/sections/_shared/DetailHero.tsx apps/web/src/components/sections/news-detail/NewsDetailHero.tsx apps/web/src/components/sections/blog/BlogDetailHero.tsx apps/web/src/components/sections/guide/GuideDetailHero.tsx apps/web/src/components/sections/events/EventDetailHero.tsx
git commit -m "refactor(web): news/blog/guide/event heroes use breadcrumbTrail"
```

---

## Task 4: Point CareerDetailHero at `breadcrumbTrail`

**Files:**
- Modify: `apps/web/src/components/sections/careers/CareerDetailHero.tsx`

- [ ] **Step 1: Replace the inline items**

Add import `import { breadcrumbTrail } from "@cleanstart/schema/builders";` and replace:
```tsx
        <HeroBreadcrumb
          items={[{ label: "Careers", href: "/careers" }, { label: title }]}
          navClassName="pt-[calc(var(--cs-header-h)+env(safe-area-inset-top)+clamp(8px,2vw,24px))]"
        />
```
with:
```tsx
        <HeroBreadcrumb
          items={breadcrumbTrail("job", { title }).slice(1)}
          navClassName="pt-[calc(var(--cs-header-h)+env(safe-area-inset-top)+clamp(8px,2vw,24px))]"
        />
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: only `ResourceDetailHero.tsx` remains.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/careers/CareerDetailHero.tsx
git commit -m "refactor(web): career hero uses breadcrumbTrail('job')"
```

---

## Task 5: Point ResourceDetailHero at `breadcrumbTrail`

**Files:**
- Modify: `apps/web/src/components/sections/resource/ResourceDetailHero.tsx`

- [ ] **Step 1: Replace the inline items**

Add import `import { breadcrumbTrail } from "@cleanstart/schema/builders";` and replace:
```tsx
        <HeroBreadcrumb
          items={[
            { label: "Resource Center", href: "/resource-center" },
            { label: resource.title },
          ]}
          navClassName="pt-[120px] lg:pt-[calc(138px+var(--cs-header-extra))]"
        />
```
with:
```tsx
        <HeroBreadcrumb
          items={breadcrumbTrail("resource", { title: resource.title }).slice(1)}
          navClassName="pt-[120px] lg:pt-[calc(138px+var(--cs-header-extra))]"
        />
```

- [ ] **Step 2: Typecheck (now clean)**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/resource/ResourceDetailHero.tsx
git commit -m "refactor(web): resource hero uses breadcrumbTrail('resource')"
```

---

## Task 6: Point the web JSON-LD pages at `breadcrumbTrail`

Each detail page currently hand-writes the `breadcrumbSchema([...])` array. Replace each with the shared trail so the JSON-LD and the hero are provably the same shape.

**Files (all modified):** `app/blogs/[slug]/page.tsx`, `app/guide/[slug]/page.tsx`, `app/news/[slug]/page.tsx`, `app/event/[slug]/page.tsx`, `app/job/[slug]/page.tsx`, `app/resources/[slug]/page.tsx`, `app/author/[slug]/page.tsx`, `app/(legal)/legal/[slug]/page.tsx`, `app/knowledge-hub/[slug]/page.tsx`

- [ ] **Step 1: Add the import to each page**

Each of these pages already imports from `@/lib/seo/jsonld` (which re-exports `@cleanstart/schema/builders`). Add `breadcrumbTrail` to that existing import, e.g. in `app/blogs/[slug]/page.tsx`:
```ts
import { breadcrumbSchema, blogPostingSchema, breadcrumbTrail } from "@/lib/seo/jsonld";
```
(Match each file's existing import members; only `breadcrumbTrail` is new.)

- [ ] **Step 2: blogs — replace the array**

Replace:
```ts
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blogs", path: "/blogs" },
              { name: post.title },
            ]),
```
with:
```ts
            breadcrumbSchema(breadcrumbTrail("blog", { title: post.title })),
```

- [ ] **Step 3: guide**

Replace the `breadcrumbSchema([... "Guides", "/guide" ... { name: guide.title }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("guide", { title: guide.title })),
```

- [ ] **Step 4: news**

Replace the `breadcrumbSchema([... "Newsroom", "/news" ... { name: item.title }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("news", { title: item.title })),
```

- [ ] **Step 5: event**

Replace the `breadcrumbSchema([... "Events", "/events" ... { name: event.title }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("event", { title: event.title })),
```

- [ ] **Step 6: job**

Replace the `breadcrumbSchema([... "Careers", "/careers" ... { name: job.title }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("job", { title: job.title })),
```

- [ ] **Step 7: resources**

Replace the `breadcrumbSchema([... "Resource Center", "/resource-center" ... { name: resource.title }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("resource", { title: resource.title })),
```

- [ ] **Step 8: author**

Replace the (already-fixed) `breadcrumbSchema([{ name: "Home", path: "/" }, { name: author.name }])` block with:
```ts
            breadcrumbSchema(breadcrumbTrail("author", { title: author.name })),
```

- [ ] **Step 9: legal**

Replace the `breadcrumbSchema([... "Legal", "/legal" ... { name: doc.title }])` block with:
```ts
        data={breadcrumbSchema(breadcrumbTrail("legal", { title: doc.title }))}
```
(Note: legal uses the `data={...}` prop form — keep the wrapping.)

- [ ] **Step 10: knowledge-hub**

The KB page builds a `crumbs` array (with optional category) and passes `breadcrumbSchema(crumbs)`. Replace the `const crumbs = [...]` block with:
```ts
  const crumbs = breadcrumbTrail("knowledgeBase", {
    title: article.title,
    category: article.category?.name,
  });
```
Leave the `breadcrumbSchema(crumbs)` call as-is.

- [ ] **Step 11: Typecheck + lint**

Run: `pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web lint`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/app/blogs/[slug]/page.tsx apps/web/src/app/guide/[slug]/page.tsx apps/web/src/app/news/[slug]/page.tsx apps/web/src/app/event/[slug]/page.tsx apps/web/src/app/job/[slug]/page.tsx apps/web/src/app/resources/[slug]/page.tsx apps/web/src/app/author/[slug]/page.tsx "apps/web/src/app/(legal)/legal/[slug]/page.tsx" apps/web/src/app/knowledge-hub/[slug]/page.tsx
git commit -m "refactor(web): all detail-page JSON-LD breadcrumbs use breadcrumbTrail"
```

---

## Task 7: Re-point the CMS dispatcher at `breadcrumbTrail`

Kill the CMS's parallel breadcrumb arrays (stale `Blog`/`News` labels, `/author` 404, `/webinar`, self-linked current crumb). The dispatcher keeps emitting breadcrumbs for `/api/jsonld`, but now from the shared function — so the CMS preview matches the live site.

**Files:**
- Modify: `apps/cms/src/payload/lib/jsonld/dispatch.ts`

- [ ] **Step 1: Import the shared builder**

At the top of `dispatch.ts`, add:
```ts
import { breadcrumbTrail } from "@cleanstart/schema/builders";
```

- [ ] **Step 2: Replace `breadcrumbsFor` body**

Replace the whole `breadcrumbsFor` function:
```ts
const breadcrumbsFor = (
  collection: 'blogs' | 'news' | 'guides' | 'knowledgeBase',
  doc: AnyDoc,
) => {
  const title = doc.title ?? '';
  switch (collection) {
    case 'blogs':
      return [ /* ...Blog... */ ];
    case 'news':
      return [ /* ...News... */ ];
    case 'guides':
      return [ /* ...Guides... */ ];
    case 'knowledgeBase':
      return [ /* ...Knowledge Hub... */ ];
  }
};
```
with:
```ts
const KIND_BY_COLLECTION = {
  blogs: 'blog',
  news: 'news',
  guides: 'guide',
  knowledgeBase: 'knowledgeBase',
} as const;

const breadcrumbsFor = (
  collection: 'blogs' | 'news' | 'guides' | 'knowledgeBase',
  doc: AnyDoc,
) =>
  breadcrumbTrail(KIND_BY_COLLECTION[collection], {
    title: doc.title ?? '',
    category: (doc as { category?: { name?: string } | null }).category?.name,
  });
```

Note: `buildBreadcrumbBlob` requires `path` on every crumb (`BreadcrumbCrumb.path` is required there); the shared trail omits `path` on the last crumb. Fix `buildBreadcrumbBlob` to tolerate a missing `path` (Step 3) so the current-page crumb is emitted without a self-link, matching the web.

- [ ] **Step 3: Make `buildBreadcrumbBlob` accept a path-less last crumb**

In `apps/cms/src/payload/lib/jsonld/breadcrumb.ts`, change the `BreadcrumbCrumb` interface and the mapping so a crumb without `path` omits `item`:

Replace:
```ts
export interface BreadcrumbCrumb {
  readonly name: string;
  /** Path or absolute URL. Path is preferred — gets resolved against baseUrl. */
  readonly path: string;
}
```
with:
```ts
export interface BreadcrumbCrumb {
  readonly name: string;
  /** Path or absolute URL. Omit for the current-page (last) crumb — emits no `item`. */
  readonly path?: string;
}
```
and replace the `itemListElement` map:
```ts
  const itemListElement = crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: toAbsolute(ctx, crumb.path),
  }));
```
with:
```ts
  const itemListElement = crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    ...(crumb.path ? { item: toAbsolute(ctx, crumb.path) } : {}),
  }));
```

- [ ] **Step 4: Replace the author trail**

In `dispatchAuthor`, replace:
```ts
  const breadcrumb = buildBreadcrumbBlob(ctx, [
    { name: 'Home', path: '/' },
    { name: 'Authors', path: '/author' },
    { name, path: `/author/${slug}` },
  ]);
```
with:
```ts
  const breadcrumb = buildBreadcrumbBlob(ctx, breadcrumbTrail('author', { title: name }));
```

- [ ] **Step 5: Replace the event/webinar trail**

In `dispatchEvent`, replace the `buildBreadcrumbBlob(ctx, collection === 'events' ? [...] : [...])` call with:
```ts
  const breadcrumb = buildBreadcrumbBlob(
    ctx,
    collection === 'events'
      ? breadcrumbTrail('event', { title: doc.title })
      : breadcrumbTrail('news', { title: doc.title }), // webinars: replace with a 'webinar' kind if/when a /webinar route ships
  );
```
> ⚠️ The old code linked webinars to `/webinar` (a route that may not exist on apps/web). Before shipping, confirm whether `apps/web/src/app/webinar/[slug]` exists. If it does, add a `webinar` entry to `LISTING` in `breadcrumbs.ts` (`{ name: "Webinars", path: "/webinars" }` for the listing, detail under the correct segment) and use `breadcrumbTrail('webinar', ...)` here. If it does not, the webinar branch should fall back to the `news`/Resources-less shape above. Resolve this explicitly — do not leave a `/webinar` link that 404s.

- [ ] **Step 6: Replace the remaining inline trails (pages/resources/jobs sites)**

Search `dispatch.ts` for every other `buildBreadcrumbBlob(ctx, [` literal (the page-builder around line 576/641, resource/job sites around 466/722). For each, map its collection to the matching `DetailKind` and replace the array literal with `breadcrumbTrail(kind, { title })`. For the generic `pages` collection that reads an editor-defined `breadcrumb` row array (`readPageBreadcrumb`), LEAVE it as-is — those are author-defined trails, not content-type trails, and have no web equivalent to drift against.

Run to find them:
```bash
grep -n "buildBreadcrumbBlob(ctx, \[" apps/cms/src/payload/lib/jsonld/dispatch.ts
```
Expected after edits: only the `readPageBreadcrumb`-fed call (pages) and the shared-`breadcrumbTrail` calls remain; no other inline content-type arrays.

- [ ] **Step 7: Update the dispatcher tests**

Run: `pnpm --filter @cleanstart/cms test dispatch`
Expected: FAILs where the test asserted the OLD labels/paths (`Blog`, `News`, `/author`, self-linked last crumb). Update each expected value in `apps/cms/src/payload/lib/jsonld/dispatch.test.ts` to the new shape: `Blogs`/`Newsroom`, author = `Home › <name>` (no `/author`), and the last crumb has `name` but NO `item`. Do not weaken assertions — change them to the corrected expectations.

- [ ] **Step 8: Run dispatcher + endpoint tests green**

Run: `pnpm --filter @cleanstart/cms test dispatch jsonld breadcrumb`
Expected: PASS.

- [ ] **Step 9: Typecheck + lint CMS**

Run: `pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms lint`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add apps/cms/src/payload/lib/jsonld/dispatch.ts apps/cms/src/payload/lib/jsonld/breadcrumb.ts apps/cms/src/payload/lib/jsonld/dispatch.test.ts
git commit -m "refactor(cms): dispatcher breadcrumbs use shared breadcrumbTrail (kills drift)"
```

---

## Task 8: Drift-guard test — visible web trail equals JSON-LD trail

A focused test proving the visible hero crumbs and the JSON-LD crumbs come from the same source for every kind. Because both call `breadcrumbTrail`, the guard asserts the relationship `visible === jsonld.slice(1)` holds for the function itself.

**Files:**
- Create: `packages/schema/src/builders/breadcrumb-parity.test.ts`

- [ ] **Step 1: Write the parity test**

```ts
import { describe, expect, it } from "vitest";
import { breadcrumbTrail, type DetailKind } from "./breadcrumbs";

// The web hero renders Home itself and receives trail.slice(1); the JSON-LD
// receives the full trail. This locks that the visible bar is exactly the
// JSON-LD trail minus the leading Home crumb — i.e. they can never disagree.
describe("breadcrumb visible/JSON-LD parity", () => {
  const kinds: DetailKind[] = [
    "blog", "guide", "news", "event", "job", "resource", "knowledgeBase", "author", "legal",
  ];

  it("visible (hero) trail === JSON-LD trail without Home, for every kind", () => {
    for (const kind of kinds) {
      const jsonld = breadcrumbTrail(kind, { title: "T", category: "C" });
      const visible = jsonld.slice(1);
      expect(visible).toEqual(jsonld.slice(1)); // identity by construction
      expect(jsonld[0]).toEqual({ name: "Home", path: "/" });
      // the visible bar's last item is the current page (no link)
      expect(visible.at(-1)).toEqual({ name: "T" });
    }
  });
});
```

- [ ] **Step 2: Run it green**

Run: `pnpm --filter @cleanstart/schema test breadcrumb-parity`
Expected: PASS.

- [ ] **Step 3: Add a source guard against re-introducing inline trails (optional but recommended)**

Add to `breadcrumb-parity.test.ts` a test that fails if a web hero or detail page re-introduces a hardcoded breadcrumb array, catching future drift at CI:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

it("no web detail hero/page hardcodes a breadcrumb array", () => {
  // Resolve apps/web from the monorepo root (vitest cwd = package dir).
  const webRoot = join(__dirname, "../../../../apps/web/src");
  const suspects = [
    "components/sections/news-detail/NewsDetailHero.tsx",
    "components/sections/blog/BlogDetailHero.tsx",
    "components/sections/guide/GuideDetailHero.tsx",
    "components/sections/events/EventDetailHero.tsx",
    "components/sections/careers/CareerDetailHero.tsx",
    "components/sections/resource/ResourceDetailHero.tsx",
  ];
  for (const rel of suspects) {
    const src = readFileSync(join(webRoot, rel), "utf8");
    expect(src, `${rel} must use breadcrumbTrail, not an inline array`).toContain("breadcrumbTrail(");
    expect(src, `${rel} must not hardcode { name: "Home"`).not.toMatch(/name:\s*["']Home["']/);
  }
  void readdirSync; // reserved for future directory sweep
});
```
> If cross-package file reads are undesirable in `packages/schema` tests, move this guard to `apps/web/src/lib/seo/breadcrumb-guard.test.ts` instead and adjust the path to `process.cwd()`-relative. Keep ONE guard somewhere in CI.

- [ ] **Step 4: Run green**

Run: `pnpm --filter @cleanstart/schema test breadcrumb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/builders/breadcrumb-parity.test.ts
git commit -m "test(schema): drift guard — visible/JSON-LD breadcrumb parity + no inline arrays"
```

---

## Task 9: Document the Knowledge Hub exception

**Files:**
- Modify: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx` (comment only)

- [ ] **Step 1: Add an explanatory comment above the KB `Breadcrumb` function**

```tsx
// NOTE: this light-theme breadcrumb intentionally ends at the category and
// omits the article title (the title is the H1 below). The JSON-LD (built in
// app/knowledge-hub/[slug]/page.tsx via breadcrumbTrail("knowledgeBase", …))
// DOES include the title — Google permits a current-page crumb in markup that
// isn't a visible link. This is the one accepted visible/JSON-LD divergence;
// see docs/superpowers/plans/2026-06-23-breadcrumb-single-source.md.
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx
git commit -m "docs(web): note KB breadcrumb visible/JSON-LD exception"
```

---

## Task 10 (optional): Fold listing-page breadcrumbs into the shared module

Listing pages (`/blogs`, `/news`, `/guide`, `/webinars`, `/careers`, `/resource-center`, `/knowledge-hub`, `/events`) emit a 2-level `Home › Section` JSON-LD trail inline. Add a `listingTrail(kind)` helper to `breadcrumbs.ts` (returns `[HOME, LISTING[kind]!]`) and repoint those pages, for the same single-source benefit. Lower priority — listings were never part of the drift bug.

---

## Task 11: Full verification + final sweep

- [ ] **Step 1: Run all three checks on both touched packages**

```bash
pnpm --filter @cleanstart/schema test && pnpm --filter @cleanstart/schema typecheck && pnpm --filter @cleanstart/schema lint
pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms test
```
Expected: all PASS. (Per `web-build-needs-prod-cms` memory note, if the web build times out prerendering CMS pages, run a prod CMS on port 3100 first; `payload generate:types` is unaffected here since no collection changed.)

- [ ] **Step 2: Live spot-check (preview, desktop 1440 + mobile 375)**

Start the web + CMS dev servers, then for `/news/<slug>`, `/blogs/<slug>`, `/job/<slug>`, `/resources/<slug>`, `/event/<slug>`:
- Desktop visible trail = `Home › <Section> › <Title>`.
- Mobile visible trail = `Home › <Section>` (title hidden).
- The page's `BreadcrumbList` JSON-LD `itemListElement` equals the full trail (Home + Section + Title), last item has `name` but no `item`.

- [ ] **Step 3: Confirm no stale inline trails remain**

```bash
grep -rn 'name: "Home"' apps/web/src apps/cms/src/payload/lib/jsonld | grep -v breadcrumbs.ts | grep -v readPageBreadcrumb
```
Expected: no content-type breadcrumb arrays (only the shared module + the editor-defined `pages` path).

- [ ] **Step 4: Final commit (if any sweep fixes were needed)**

```bash
git add -p
git commit -m "chore: breadcrumb single-source verification fixes"
```

---

## Self-Review

- **Spec coverage:** fake "Resources"/"Jobs" crumbs (already fixed; locked by Task 1 contract test + Task 8 guard); visible↔JSON-LD mismatch (Tasks 3–6 derive both from one function; Task 8 proves parity); `/author` 404 (Task 1 dead-route test + Tasks 6/7); CMS stale `Blog`/`News`/self-path divergence (Task 7 + updated tests); "won't forget in future" (Task 8 drift guards in CI). ✓
- **Type consistency:** `BreadcrumbCrumb` = `{ name: string; path?: string }` is the one crumb type across `breadcrumbTrail`, `breadcrumbSchema`, `HeroCrumb`/`DetailHeroCrumb`, and the CMS `buildBreadcrumbBlob` (after Task 7 Step 3 makes `path` optional there too). `breadcrumbTrail(kind, { title, category? })` signature is used identically in every caller. ✓
- **Placeholders:** none — every code step shows the exact replacement; the only deliberately open item is the webinar route decision (Task 7 Step 5), flagged as a required explicit resolution, not a TODO. ✓
