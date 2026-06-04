# Case Studies — Design Spec

**Date:** 2026-06-03
**Branch:** `development` (touches both `apps/cms` and `apps/web`)
**Figma:** https://www.figma.com/design/doWR9Xbwgkz6dqR9n4m3BB/CleanStart-V4?node-id=1198-1231
**Status:** Approved design — ready for implementation plan.

---

## 1. Summary

A new CMS-backed **Case Studies** listing page at `/case-studies`. Editors create case
studies in a new Payload `case-studies` collection; each carries a cover image, an
industry tag, a company name + optional logo, a summary, and a downloadable PDF stored in
R2. The web page renders a responsive card grid with standard pagination, followed by the
home page's **Built for Teams** testimonial section reused verbatim (no CMS connection),
then the standard footer.

There is **no detail page** — each card's only action is downloading the PDF directly from
its public R2 URL.

## 2. Goals / Non-goals

**Goals**
- New `case-studies` Payload collection (PDF uploaded to R2).
- New `/case-studies` listing page matching the Figma at 1440px.
- Direct, public PDF download per card with a `PDF · X MB` file label.
- Standard pagination identical to the blogs listing.
- Reuse `<BuiltForTeams />` exactly as the home page renders it.

**Non-goals (explicitly out of scope at v1)**
- No `/case-study/[slug]` detail route.
- No gating / lead-capture forms on downloads.
- No rich-text body content.
- No download-count analytics endpoint (deferred — see §6).
- No industry filter UI (data layer accepts the param for future use — see §5).
- No GraphQL (repo-wide rule: GraphQL stays disabled).

## 3. CMS collection — `apps/cms/src/payload/collections/CaseStudies.ts`

Modelled on `Resources.ts`, trimmed for a download-only, listing-only collection.

`slug: 'case-studies'` → REST path `/api/case-studies`.

Admin: `useAsTitle: 'title'`, `group: 'Content'`,
`defaultColumns: ['title', 'company', 'industry', '_status', 'updatedAt']`,
`docStatusBarEditConfig({ showStats: false, showPublishedAt: true })`.

Access: `read: () => true`, `create/update/delete: isAdminOrEditor`.

| Field | Type | Notes |
|---|---|---|
| `title` | `contentTitleField` | Card heading. |
| `slug` | `slugField({ source: 'title' })` | Stable id. **No `slugChangeRedirectHook`** — there is no detail route to redirect. |
| `industry` | `select` | Fixed options: `healthcare`, `telecom`, `finance`, `technology`, `manufacturing`, `other`. Rendered as the card's tag pill. |
| `company` | `text` | Company name, e.g. "Aurascape". |
| `companyLogo` | `mediaUploadField` (optional) | Small wordmark/icon beside the company name; card falls back to a generic icon when absent. `folderHint: 'web/case-study'`. |
| `coverImage` | `mediaUploadField` | Card thumbnail. `folderHint: 'web/case-study'`, `accept: image mime types`. |
| `summary` | `textarea` | Card description copy. |
| `asset` | `mediaUploadField` | The downloadable PDF. `folderHint: 'web/case-study'`, `accept: ['application/pdf']`. File size + mime read from this media doc. |
| `permalink` | `ui` (sidebar) | Optional — only if a route prefix is registered; otherwise omit (no detail route). Decide during implementation; default to **omit**. |
| `schemaAddonsField` | group | Consistent with other collections. |
| `publishedAtField`, `displayPublishedAtField` | standard | Drive the published filter + sort. |
| SEO sidebar group | `seoSidebarFields` / `seoFieldsForSidebar('case-studies')` | Consistent metadata surface. |

**Hooks**
- `beforeChange`: `firstPublishHook()`, `displayPublishedAtBackfillHook`.
  (No `normalizeLexicalHook` — no rich-text fields.)
- `afterChange`: `schemaOverrideAuditHook('case-studies')`,
  `displayPublishedAtAuditHook('case-studies')`,
  `searchSyncAfterChangeHook('case-studies')`,
  `webhooksPublishAfterChangeHook('case-studies')`,
  `indexNowPublishAfterChangeHook('case-studies')`.
- `afterDelete`: `searchSyncAfterDeleteHook('case-studies')`.
- **No** `slugChangeRedirectHook`.

> Implementation note: `searchSync` / `indexNow` may key off a registry of known
> collection slugs. If adding `case-studies` requires a registry/allow-list entry, add it;
> if the hook would index a non-existent web URL (there's no detail page), **drop the
> `searchSync` + `indexNow` hooks for this collection** rather than register a dead route.
> Resolve this in the plan by reading the hook implementations first.

`versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 }`, `timestamps: true`.

**Registration & generated artifacts**
- Add to the `collections` array in `apps/cms/src/payload/payload.config.ts`.
- Run `pnpm --filter @cleanstart/cms generate:types` and commit `payload-types.ts`.
- Run `pnpm --filter @cleanstart/cms` migration create for the new table and commit it.
  A new collection shipped **without** its migration 500s `/admin` in production — this is
  a known, load-bearing step.

## 4. Download approach — direct R2 link (approved)

The card's Download control is an anchor pointing at the populated `asset.url` (public R2 /
`cdn.cleanstart.com`), `target="_blank" rel="noopener noreferrer"`, with the `download`
attribute set (harmless cross-origin). No CMS endpoint is involved.

The `PDF · 2.4 MB` label is derived from the populated media doc: `asset.mimeType`
(→ "PDF") and `asset.filesize` in bytes (→ MB, one decimal). A `formatFileMeta(asset)`
helper in the web data layer produces the string; renders nothing if `asset` is missing.

## 5. Web data layer — `apps/web/src/lib/case-studies.ts`

Mirrors `apps/web/src/lib/resources.ts`.

```ts
export type CaseStudyIndustry =
  | "healthcare" | "telecom" | "finance"
  | "technology" | "manufacturing" | "other";

export type CaseStudyMedia = {
  id: string; url: string; alt?: string;
  width?: number; height?: number;
  filesize?: number; mimeType?: string; filename?: string;
};

export type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  industry?: CaseStudyIndustry | null;
  company?: string | null;
  companyLogo?: CaseStudyMedia | null;
  coverImage?: CaseStudyMedia | null;
  summary?: string | null;
  asset?: CaseStudyMedia | null;
  publishedAt?: string | null;
  displayPublishedAt?: string | null;
};
```

`getCaseStudies({ page = 1, limit = 9, industry? })` →
`fetchCMS<PayloadListResponse<CaseStudy>>('/api/case-studies?...')` with
`where[_status][equals]=published`, `where[publishedAt][exists]=true`, `depth=2`
(populates `asset`, `coverImage`, `companyLogo`), `sort=-publishedAt`. The optional
`industry` param maps to `where[industry][equals]` for future filtering; unused by the v1
page.

Helpers (client-safe): `formatFileMeta(asset)` → `"PDF · 2.4 MB"`; `industryLabel(value)`
→ human label for the tag pill; `mediaUrl(url)` reused/duplicated from the resources lib.

## 6. Web page & components — `apps/web/src/app/case-studies/`

Server component, following `apps/web/src/app/blogs/page.tsx`:

```
src/app/case-studies/page.tsx
src/components/sections/case-studies/
  CaseStudiesHero.tsx
  CaseStudiesGrid.tsx
  CaseStudyCard.tsx
public/images/case-studies/   (Figma-extracted hero illustration + assets)
```

- **`CaseStudiesHero`** — eyebrow + "Case Studies" H1 using `--text-hero-utility` (listing
  page role token), subtitle "Real challenges. Our Solutions measurable impact for our
  customers.", and the 3D "Case Study" illustration extracted from Figma into
  `public/images/case-studies/`. Decorative grid/glow per the background-decoration rules.
  Built with `<Section><Container>`.
- **`CaseStudiesGrid`** — responsive 3-col grid (`<Section padding><Container>`) of
  `CaseStudyCard`. Empty state when `docs.length === 0`. Renders `<Pagination>` below.
- **`CaseStudyCard`** — cover image (`next/image`, explicit `sizes`), industry tag pill
  overlapping the image bottom-left, company row (optional logo via `next/image` + name),
  title (`--fs-h3`/card-title token), summary, footer row: `PDF · X MB` (muted) + Download
  link with arrow icon. `container-type: inline-size` on the card root; interiors sized
  with `cqi`-based clamps per the card-grid rule. White card on the `#f6f6f6` page bg.
- **`<Pagination currentPage={page} totalPages={data.totalPages} buildHref={(p) => `/case-studies?page=${p}`} />`**
  — the existing shared component, identical usage to blogs.
- **`<BuiltForTeams />`** — imported from `@/components/sections/home/BuiltForTeams` with
  **no props**, so it renders `HOME_TESTIMONIALS` exactly as the home page does. No CMS.
- **`<Footer />`** — standard, no `cta` prop. The BuiltForTeams gradient meets the footer
  directly, matching the design and the home composition.

`generateMetadata` via `buildPageMetadata({ title: "Case Studies", path: "/case-studies",
eyebrow: "Resources", noindex: page >= 6 })`; breadcrumb `JsonLd` (Home → Case Studies).
The page reads `searchParams.page`, clamps to ≥ 1, fetches with `.catch()` returning an
empty list on failure (same resilience pattern as blogs).

Page background `#f6f6f6` (matches blogs/resource-center), `<main>` wraps hero + grid;
`<Footer />` is a sibling after `<main>`. Below-the-fold sections wrapped in `<FadeUp>`;
the hero is not.

## 7. Cross-cutting changes (allowed on `development`)

- `apps/web/src/lib/nav-config.ts` — add **Case Studies** entry under the Resources group,
  `href: "/case-studies"`.
- `docs/web/WEB-PAGES.md` — add the Case Studies row (CMS Listing, ✅ once verified).

## 8. Verification

**CMS** (`pnpm --filter @cleanstart/cms`): `lint`, `typecheck`, `build`; `generate:types`
committed; migration created and committed; admin loads the new collection; create one
published case study with a PDF and confirm `asset.url` resolves to R2.

**Web** (`pnpm --filter @cleanstart/web`): `lint`, `typecheck`, `build`. Claude Preview
locked to **1440×900**: screenshot hero + grid against the Figma reference; confirm the
industry pill, company logo, and `PDF · X MB` render from real CMS data; confirm the
Download link opens the PDF; confirm `<BuiltForTeams />` renders identically to the home
page; confirm the footer meets the gradient cleanly.

## 9. Risks / open implementation questions

- **searchSync/indexNow registry**: must confirm whether a new collection slug needs
  registration, and whether indexing a detail-less collection is meaningful. Resolve by
  reading the hook implementations during the plan (§3 note). Default lean: drop both hooks
  for this collection if they assume a detail URL.
- **`permalink` UI field**: only meaningful with a route prefix; default to omitting it
  since there's no detail route.
- **File-size accuracy**: `asset.filesize` must be populated at `depth >= 1`; the data
  layer uses `depth=2`.
