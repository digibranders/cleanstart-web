# Guides Listing Page — Design

**Date:** 2026-06-04
**Scope:** `apps/web` only. No CMS changes.
**Figma:** CleanStart-V4, node `1248-8204`.
**Branch:** `development`.

## Summary

Build a public **Guides listing page** at `/guides` on the marketing site, modeled on the existing Blogs listing but with a **compact 4-column card** so a single pagination page shows a **4×4 grid (16 guides)**.

The CMS side already exists in full:
- `guides` collection (`apps/cms/src/payload/collections/Guides.ts`) — drafts, versions, `title`, `slug`, `abstract`, `heroImage`, `authors`, `publishedAt`, `readingMinutes`, SEO group, etc.
- Guide detail page `/guide/[slug]` (`apps/web/src/app/guide/[slug]/page.tsx`) and fetch helpers in `apps/web/src/lib/guides.ts`.

**The only missing piece is the listing page.** This is therefore a pure `apps/web` task — no new collection, no migration, no `payload generate:types`.

## Decisions (locked)

| Question | Decision |
|---|---|
| Category filter pills (Figma shows them, collection has no category) | **Drop them.** Search-only. Zero CMS changes. |
| Hero H1 text | **"Guide"** (singular) — match Figma. |
| Card content | Image · meta (date · read time) · 2-line title · **3-line abstract** · "Read more →". |
| Cards per page | **16** (`limit: 16`) → 4×4 grid at desktop. |
| CTA card | **Own `GuidesCTA.tsx`** — copy may match Blogs, but no shared component. |
| Component sharing with blogs | **None.** Every guide-specific component, constant (hero gradient, decorative bg values), and helper (date/media) is its own file under `sections/guides/` or `lib/guides.ts`. Nothing imports from `@/lib/blog` or `sections/blogs/`. App-wide generic primitives (`ui/Pagination`, `EmptyState`, `Reveal`, `FadeUp`, `_shared/SearchBar`) are not blog components and are still used. |

## Routing

- **Listing (new):** `apps/web/src/app/guides/page.tsx` → `/guides` (plural, mirrors `/blogs`, matches the `Guides` nav label).
- **Detail (exists):** `/guide/[slug]` (singular, `ROUTE_PREFIX.guides = "/guide"`).
- **Card link target:** `` `/guide/${slug}` `` — singular. This asymmetry is intentional; do not "fix" it to `/guides/${slug}`.

## Data layer — `apps/web/src/lib/guides.ts`

Add the list fetch **plus guide-local presentation helpers** next to the existing `getGuideBySlug` / `getGuideBySlugDraft`, so guide components never import from `@/lib/blog`:

```ts
// Own date formatter — do not import formatBlogDate.
export function formatGuideDate(value?: string | null): string { /* same Intl format */ }

// Own media URL resolver — do not import mediaUrl from @/lib/blog.
export function guideMediaUrl(url?: string | null): string | undefined { /* prefix NEXT_PUBLIC_CMS_URL */ }
```

`effectivePublishedAt` from `@/lib/published-date` is a generic app-wide helper (not blog-specific) and may be used as-is. The `Guide` type already exists and carries every field the card needs (`title`, `slug`, `abstract`, `heroImage`, `publishedAt`, `readingMinutes`).

```ts
type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
};

export async function getGuides({
  page = 1,
  limit = 16,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PayloadListResponse<Guide>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  if (search) params.set("where[title][contains]", search);
  return fetchCMS<PayloadListResponse<Guide>>(`/api/guides?${params.toString()}`);
}
```

- No category filter (collection has none).
- `PayloadListResponse` is currently a private alias in `guides.ts`; extend/export it as needed (it already exists there for the detail loader).
- Page-level fetch wraps the call in `.catch(() => ({ docs: [], totalPages: 1, page: 1, totalDocs: 0 }))` exactly like `blogs/page.tsx`.

## Page — `apps/web/src/app/guides/page.tsx`

Server component, structurally identical to `blogs/page.tsx`:

- `searchParams`: `{ page?, q? }` (no `category`).
- `generateMetadata`: `buildPageMetadata({ title: "Guides", description: <subheading>, path: "/guides", eyebrow: "Guide", noindex: page >= 6 })`.
- Body: `JsonLd` breadcrumb (`Home → Guides`) → `<Header />` → `<main style={{ background: "#f6f6f6" }}>` → `<GuidesHero searchQuery={…} />` → `<FadeUp><GuidesList … /></FadeUp>` → `<Footer cta={<GuidesCTA />} />`.
- Single fetch: `getGuides({ page, ...(search ? { search } : {}) })`. No `Promise.all` over featured/categories (neither applies).

## Components — `apps/web/src/components/sections/guides/`

### `GuidesHero.tsx`
- Own `HERO_GRADIENT` constant defined in this file (value may equal blogs', but not imported).
- H1 **"Guide"** (`--fs-h1`, `--text-hero-utility-ls`, `--text-hero-lh`) — listing-tier hero token, same as `BlogsHero`.
- Subheading "A Curated Collection of Writings, Research, and Solutions" (`--fs-lead`).
- `<SearchBar initialQuery={searchQuery} placeholder="Search guides of your interest..." ariaLabel="Search guides" />` wrapped in `<Suspense>`.
- **No** featured-post tile, **no** category pills, **no** left hero glow unless Figma shows it. Simpler than `BlogsHero`.

### `GuideCard.tsx`
Compact variant of `BlogCard` (no category badge — collection has none):
- Outer `<article>` ~`max-w-[320px]` (vs blog 404px; ~0.75× the 1920 artboard), `borderRadius: "32px"` (verify against Figma; copy exact radius), white bg, same soft shadow stack as `BlogCard`.
- Image block: `aspect-ratio` per Figma, inner radius ~`20px`, `next/image` with `fill` + `sizes` matching the 4-up grid (`(min-width:1280px) 320px, (min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw`).
- Body: meta row (`date` via `formatGuideDate(effectivePublishedAt(guide))` + `readingMinutes` "X min read", calendar/clock icons), title `<h3>` 2-line clamp (`--fs-h3` / card-title token), **abstract `<p>` 3-line clamp** (`WebkitLineClamp: 3`).
- "Read more →" `<Link href={`/guide/${guide.slug}`}>`.
- Uses guide-local `formatGuideDate` / `guideMediaUrl` (from `lib/guides.ts`) and generic `effectivePublishedAt`. No imports from `@/lib/blog`.
- Icon/arrow assets: copy the needed SVGs into `public/images/guides/` (calendar, clock, read-more arrow) rather than referencing `/images/blogs/`.
- Exact paddings / font sizes / radius pulled from Figma via `get_design_context` on a card node during implementation.

### `GuidesList.tsx`
- `<section>` with its own decorative background (radial blobs, gridlines, blur ellipses — values defined locally, gridlines SVG copied to `public/images/guides/`) + `background: #f6f6f6`, `paddingBottom: var(--spacing-section-cta)`.
- Container `max-w-[var(--container-default)] px-6 sm:px-10`.
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, gap ~`24px` (confirm vs Figma), `justifyItems: center`, wrapped in `RevealStagger`/`RevealItem`.
- **No "Latest" H2** above the grid (Figma shows the grid directly under the hero).
- Pagination: desktop generic `<Pagination currentPage totalPages buildHref>` (`buildHref` keeps `q`); mobile compact chevron pagination implemented locally in this file (own `CompactMobilePagination` — not imported from blogs).
- Empty states: generic `<EmptyState variant="no-results">` (with "Clear search" link to `/guides`) when `searchQuery` set, else `<EmptyState variant="empty" title="No guides yet" …>`.

### `GuidesCTA.tsx`
Own component (client) for the "Stay Ahead of Container Security Threats" newsletter card, rendered via `<Footer cta={<GuidesCTA />} />`. Uses the generic `useNewsletterSignup` hook (app-wide lead infra, not blog-specific). Copy/markup may mirror `BlogsCTA` but it is a separate file; CTA cube/decorative images copied to `public/images/guides/`.

## Cross-page edits (the two allowed shared touches)

1. **`apps/web/src/lib/nav-config.ts`** — add `{ label: "Guides", href: "/guides", icon: <existing-icon-name> }` to Resources › Insights group (after Blogs). Icon name verified against the existing nav icon set during implementation (`book` is taken by Blogs; pick an unused one, e.g. `book-open` is taken by Knowledge Hub — choose another existing glyph).
2. **`docs/web/WEB-PAGES.md`** — add/flip the Guides Listing row: `/guides`, type **CMS Listing**, status ✅.

## Out of scope

- No CMS schema/collection/migration/type changes.
- No category taxonomy for guides.
- No featured-guide logic (collection has no `featured` flag).
- No changes to the `/guide/[slug]` detail page.

## Verification

- `pnpm --filter @cleanstart/web lint`
- `pnpm --filter @cleanstart/web typecheck`
- `pnpm --filter @cleanstart/web build`
- Claude Preview locked to **1440×900**: `/guides` renders a 4×4 grid (with ≥16 published guides), search filters by title, pagination navigates, cards link to `/guide/[slug]`, CTA overlaps footer, mobile compact pagination + responsive grid collapse verified. Screenshot matches Figma `1248-8204` at 1440px.
