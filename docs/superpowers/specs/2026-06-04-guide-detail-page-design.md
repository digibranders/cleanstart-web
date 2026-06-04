# Guide Detail Page — Design

**Date:** 2026-06-04
**Scope:** `apps/cms` (schema + migration + types) **and** `apps/web` (detail page rebuild).
**Branch:** `development`.
**Parent:** follows the `/guides` listing ([2026-06-04-guides-listing-page-design.md](./2026-06-04-guides-listing-page-design.md)).

## Summary

Rebuild the guide detail page at `/guide/[slug]` to mirror the blog detail page, using **fully independent guide components** (no imports from `sections/blog/` or `@/lib/blog`). Adds: Table of Contents, editor-set **Previous/Next** guide navigation, and a **Related Guides** section — plus author bio, FAQ accordion, and newsletter CTA for full parity.

## Decisions (locked)

| Question | Decision |
|---|---|
| Section scope | **Full blog-detail parity**: Hero → TOC + body → Author bio → Prev/Next → FAQ accordion → Related Guides → newsletter CTA. |
| Prev/Next + Related fill | **Auto-fill fallback (like blogs)**: editor's manual picks win; empty slots fill from most-recent guides (prev/next = chronological neighbors). |
| Component independence | All new components live in `sections/guide/` (singular). No imports from `sections/blog/` or `@/lib/blog`. Generic shared libs (`renderLexical`, `highlightLexical`, `slugifyText`, `_shared/DetailHero`, `useNewsletterSignup`) remain shared. |

## CMS changes — `apps/cms`

### `collections/Guides.ts`
Add two editor-set relationship fields (mirror `Blogs.ts` `previousPost`/`nextPost`), placed next to `relatedGuides`:

```ts
{ name: 'previousGuide', type: 'relationship', relationTo: 'guides', hasMany: false,
  admin: { description: 'Optional. The guide to read before this one. If unset, the page auto-fills the chronological previous guide.' } },
{ name: 'nextGuide', type: 'relationship', relationTo: 'guides', hasMany: false,
  admin: { description: 'Optional. The guide to read after this one. If unset, the page auto-fills the chronological next guide.' } },
```

Enrich `relatedGuides` admin description ("Pin up to 3 guides… empty slots auto-fill with recent guides.").

### Types + migration
- `pnpm --filter @cleanstart/cms generate:types` → commit regenerated `payload-types.ts` (never hand-edit).
- `pnpm --filter @cleanstart/cms migrate:create add_guide_journey_nav` → commit `.ts` + `.json`. Additive nullable FK columns; no data backfill.
- Run `pnpm --filter @cleanstart/cms lint && typecheck && build` after.

## Web changes — `apps/web`

### `lib/guides.ts`
- Extend `GuideDetail` type: `previousGuide?`, `nextGuide?` (Guide | string | null), `relatedGuides?` (Guide[] | string[] | null), `tableOfContents?` (already present), `tocDepth?`, `authors?` (present).
- `getRelatedGuides(guideId, curated, { draft }): Promise<Guide[]>` — curated picks first (from `relatedGuides`), then site-wide fill with most-recent published guides excluding self + already-picked, capped at 3. **No category-fill stage** (guides have no category).
- `getGuideJourneyTargets(currentId, publishedAt, { draft }): Promise<{ previous, next }>` — chronological neighbors by `publishedAt` (no category preference). Parallels `getAutoJourneyTargets`.
- Reuse the existing `JourneyNavTarget`-shaped `{ slug, title }` normaliser pattern locally.

### Components — `apps/web/src/components/sections/guide/`
Independent ports of the blog-detail components (rebranded, guide data, own copy):
- `GuideDetailHero.tsx` — wraps generic `_shared/DetailHero`; meta = author photo/name/LinkedIn, reading time, published/updated date, share buttons.
- `GuideDetailContent.tsx` — client; sticky TOC (scroll-spy, 260px sidebar, 88px offset) + mobile `<details>` dropdown, built from `guide.tableOfContents` filtered by `tocDepth`; abstract callout; `.article-body` Lexical body.
- `GuideDetailAuthor.tsx` — author bio card(s).
- `GuideDetailJourneyNav.tsx` — Prev/Next cells linking `/guide/{slug}`; injects `<link rel="prev|next">`.
- `GuideDetailFAQ.tsx` — client accordion; renders only if `faqs` present.
- `GuideDetailRelatedGuides.tsx` — 2–3 related guide cards (grid + mobile carousel); gradient bg.
- `GuideDetailCTA.tsx` — newsletter CTA (own file; may reuse `GuidesCTA` markup but kept under guide-detail naming). *Note: the listing already has `GuidesCTA`; the detail page can reuse that same `GuidesCTA` since both are guide-owned. No new CTA file unless markup differs.*
- `GuideScrollReset.tsx` — scroll reset on mount (if blog uses one).

### `app/guide/[slug]/page.tsx` (rewrite)
- `generateMetadata` (keep existing article schema), `generateStaticParams` if blog has it.
- Orchestration: fetch guide (published or draft) → highlight body → resolve prev/next (manual wins, auto-fill missing side via `getGuideJourneyTargets`) → `getRelatedGuides` → JSON-LD (breadcrumb + article) → render the component tree above → `<Footer cta={<GuidesCTA />} />`.

## Out of scope
- No change to the `/guides` listing or its components.
- No category taxonomy for guides.
- No new shared/generic primitives.

## Verification
- CMS: `lint · typecheck · build` + types regenerated + migration created.
- Web: `lint · typecheck · build`.
- Preview at 1440×900: open a guide with body headings → TOC renders + scroll-spy works; set previousGuide/nextGuide in CMS → nav reflects them, else auto-fills; related guides render; FAQ accordion toggles; CTA overlaps footer. No console errors.
