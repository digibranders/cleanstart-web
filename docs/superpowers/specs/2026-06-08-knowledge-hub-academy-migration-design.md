# Knowledge Hub ← CleanStart Academy migration — design

**Date:** 2026-06-08
**Status:** Draft for review
**Owner:** development branch (touches `apps/cms` + `apps/web`)

## Goal

Migrate all **245** knowledge-base articles from the CleanStart Academy
(`academy.cleanstart.com/tracks/knowledge_base`) into the CleanStart CMS
(`knowledgeBase` + `knowledgeCategories` collections), and switch the public
`/knowledge-hub` page on `apps/web` from its current static data file to render
from the CMS. The existing 8 hand-built Knowledge Hub articles are preserved and
pinned at the top of the sidebar.

## Background / current state

- **Source — Academy:** Next.js app, ~245 articles, behind login (operator is
  logged in via the `mac-studio` Chrome browser). URL pattern:
  `/tracks/knowledge_base/articles/{NN-section}/{subcategory}/{slug}`.
  Article body is cleanly contained in `div.doc-content` (rich HTML: headings,
  paragraphs, lists, **tables**, **code blocks**; no images observed in the
  sample). Title is the page `<h1>`. No sitemap/API — the article tree is
  enumerated by expanding the left-nav `<button>` toggles.
  - 8 sections with per-subcategory counts visible in the nav (used as a
    completeness check): Understand 57 (Fundamentals 23 / Learning Paths 5 /
    Security Fundamentals 29), Explore 34, Learn 14, Build 17, Deploy 20,
    Operate 37, Secure 47, Reference 19 → **245 total**.
- **Target — CMS:** `apps/cms/src/payload/collections/KnowledgeBase.ts` and
  `KnowledgeCategories.ts` already exist (Lexical `body`, required single
  `category` relationship, hierarchical self-referencing `parent` on categories,
  SEO group, slug + slug-change-redirect, drafts/versions, Meilisearch/IndexNow/
  Teams afterChange hooks). Both collections are currently **empty and unused by
  the website**.
- **Target — Web:** `/knowledge-hub` and `/knowledge-hub/[slug]` are **100%
  static today**. `page.tsx` reads `getArticle()` from
  `components/sections/knowledge-hub/articles.ts` →
  `kh-articles.data.ts` (8 articles, custom `Block[]` shape). It never fetches
  Payload. Sidebar groups are a hardcoded `SIDEBAR_GROUPS` array (4 groups:
  Emerging Standards, Security features, Compliance and Certification, DevOps
  Kyverno).
- **Web Lexical renderer:** `apps/web/src/lib/renderLexical.tsx` (used by the
  blog) already renders `table`/`tablerow`/`tablecell`, `code`, `codeBlock`,
  `heading`, `list`, `quote`, `link`, `inlineCta`, `upload`. The blog detail
  page is the reference pattern for a CMS-backed, Lexical-rendered article with a
  table-of-contents sidebar (`BlogDetailContent.tsx`).
- **HTML→Lexical:** `apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts`
  (`htmlToLexical(html)`) handles p/h1–h4/ul/ol/blockquote/hr/inline formatting,
  but **does not handle `<table>`** (falls through to a flattened paragraph) and
  renders `<pre>` as a styled quote rather than a real code block.

## Decisions (confirmed with operator)

1. **Destination:** Seed the CMS collections AND wire the web page to render from
   the CMS. CMS becomes the system of record.
2. **Taxonomy:** Mirror the Academy hierarchy — 8 top-level categories, each with
   its subcategories as child categories (`parent`). Articles attach to their
   leaf subcategory. The existing 8 articles keep their current 4 groups, pinned
   **at the top** of the sidebar.
3. **Fidelity:** High — extend the HTML→Lexical converter to emit proper Payload
   **table** nodes and real **code-block** nodes, matching the shapes
   `renderLexical.tsx` already consumes.
4. **Publish state:** Published immediately.
5. **Existing 8 articles:** Keep (not removed). Migrated into the CMS so they
   survive the static→CMS switch, and ordered first.

## Architecture — phased

The migration is one cohesive feature delivered in five ordered phases. Each
phase has a verifiable output; later phases depend on earlier ones.

### Phase 0 — Category ordering field (CMS schema)

`knowledgeCategories` has no explicit ordering field, but the sidebar must show
the 4 legacy groups first, then the 8 Academy sections in `01..08` order, and
subcategories in source order. Add an additive optional `displayOrder` (number,
sidebar) field to `KnowledgeCategories.ts`.

- Regenerate `payload-types.ts` via `pnpm --filter @cleanstart/cms generate:types`.
- Create the Payload migration (`migrate:create`) and commit it.
- Web sidebar sorts categories by `displayOrder` (ascending), then `name`.

### Phase 1 — Extraction (Academy → on-disk JSON)

A browser-driven extraction (via the logged-in `mac-studio` Chrome) that is
**resumable** and writes raw content to disk so seeding never re-scrapes.

- **Enumerate:** expand all 8 section + all subcategory toggle buttons in the
  nav, harvest every `a[href*="/articles/"]`. Validate the harvested count per
  subcategory against the count shown in each nav button. Abort/flag if a
  subcategory is short. Expected total: 245.
- **Per article:** navigate, read `<h1>` (title), the meta line for category
  label, and `div.doc-content` `innerHTML` (body). Capture the URL-derived
  `section`, `subcategory`, `slug`. Flag any article that: requires
  payment/login-gate (empty `doc-content`), contains `<img>`, or is unusually
  short (< 200 chars).
- **Output:** `apps/cms/scripts/data/academy-kb/<section>/<slug>.json` (or a
  single `academy-kb.json` manifest) with
  `{ slug, section, sectionLabel, subcategory, subcategoryLabel, title,
  abstract, bodyHtml, flags[] }`. Committed so the seed is reproducible and
  reviewable in git.
- **Slug collisions:** Academy slugs are unique within a subcategory but the
  CMS `knowledgeBase` slug must be globally unique. Detect cross-section
  collisions; on collision, prefix with the section (`<section>-<slug>`) and
  log it. (The 8 legacy slugs are checked against this set too.)

### Phase 2 — Converter enhancement (high fidelity)

Extend `html-to-lexical.ts` to emit:

- **Tables:** `table` → `{ type:'table', children:[ {type:'tablerow',
  children:[ {type:'tablecell', headerState, children:[...] } ] } ] }` in the
  shape Payload's Lexical table feature and `renderLexical.tsx` expect.
- **Code blocks:** `<pre>` (and `<pre><code>`) → a real code node/`codeBlock`
  block matching `renderLexical.tsx`'s `case "code"` / `blockType: "codeBlock"`
  handling, preserving language hint where present.

Co-locate Vitest unit tests (`html-to-lexical.test.ts`) covering table + code
conversion. Keep existing behavior unchanged for all other tags (guard against
regressions to the Webflow import path that also uses this helper).

### Phase 3 — CMS seeding

A seed script `apps/cms/scripts/seed-knowledge-base.ts` following the
`seed-legal.ts` pattern (`--dry-run`, `--force`, skip-safe by slug,
`overrideAccess`, summary log):

- **Categories:** upsert 8 section categories + their subcategory child
  categories (with `parent` + `displayOrder`), plus the 4 legacy groups as
  top-level categories with the lowest `displayOrder` (pinned first).
- **Legacy 8 articles:** convert the existing `kh-articles.data.ts` `Block[]`
  to Lexical and seed them into their 4 legacy categories so they survive the
  web switch. (VEX uses a custom React body today — migrate its source HTML/blocks
  to Lexical as part of this.)
- **Academy 245:** for each manifest entry, `htmlToLexical(bodyHtml)` → create/
  update a `knowledgeBase` doc (`title`, `slug`, `abstract`, `category` = leaf
  subcategory id, `body`, `_status:'published'`). Idempotent: existing slug
  skipped unless `--force`.
- **Hook-storm caveat:** publishing 245 docs fires Meilisearch sync, IndexNow,
  and Teams webhooks per doc (per the production-rollout pattern in CLAUDE.md).
  Run in a quiet window; document the blast radius; consider seeding against
  local first, then prod as a one-shot rollout task added to CLAUDE.md.

### Phase 4 — Web wiring (static → CMS)

Switch `/knowledge-hub` and `/knowledge-hub/[slug]` to fetch from the CMS:

- Add `apps/web/src/lib/knowledge-hub.ts` fetch helpers using the existing
  `cms-fetch.ts` (published filter, depth for category/parent, ISR).
- `[slug]/page.tsx`: `generateStaticParams` from CMS slugs; render body with
  `RenderLexical` inside `.article-body` (blog detail pattern), build the
  table-of-contents from the article's `tableOfContents`.
- Sidebar: build `SIDEBAR_GROUPS` dynamically from categories ordered by
  `displayOrder` (legacy 4 first, then sections 01..08 with nested
  subcategories). Retire the hardcoded array + `kh-articles.data.ts` once parity
  is confirmed.
- Landing `/knowledge-hub/page.tsx`: render the section cards from CMS category
  data (counts, blurbs) instead of static content.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| Extractor (browser script/run-book) | Academy DOM → on-disk JSON manifest | logged-in Chrome |
| `html-to-lexical` table/code extension | HTML → Lexical node shapes | renderLexical shapes, Payload Lexical schema |
| `seed-knowledge-base.ts` | manifest + legacy 8 → CMS docs/categories | converter, Payload |
| `knowledgeCategories.displayOrder` | sidebar ordering | migration |
| web `knowledge-hub` lib + pages | CMS → rendered page | CMS data, renderLexical |

## Error handling & safety

- Extraction is resumable and writes to disk; seeding reads disk only (no live
  scrape during seed). Manifest committed to git for review.
- Per-subcategory count validation guards against silent truncation.
- Seed is idempotent/skip-safe (slug-keyed); `--dry-run` previews; `--force`
  only on intentional refresh.
- Never `git add -A`; stage specific paths. Regenerate `payload-types.ts` (never
  hand-edit). Create the migration via Payload's runner.
- Flag (don't guess) gated/empty/image-bearing/short articles for manual review.

## Testing

- Vitest: `html-to-lexical.test.ts` for table + code conversion (and
  regression coverage for existing tags).
- Seed dry-run on local DB; spot-check ~5 articles across sections in the CMS
  admin (tables render, code renders, category correct).
- Web: build + lint + typecheck for `apps/web`; visual spot-check of 1 legacy +
  3 Academy articles at 1440×900; sidebar order (legacy first).

## Open risks / to validate during implementation

1. **Gated content:** confirm all 245 render their `doc-content` while logged in;
   any locked articles are flagged, not silently empty.
2. **Table shape exactness:** the converter output must match both Payload's
   stored Lexical table schema and `renderLexical.tsx` — validate by round-trip
   (seed → admin renders → web renders).
3. **VEX custom body:** the one legacy article using a bespoke React component
   needs its content re-sourced as Lexical.
4. **Abstract/SEO:** Academy articles have no explicit abstract; derive from the
   first paragraph or leave blank (SEO description falls back).
5. **Prod rollout:** seeding 245 published docs is a hook-heavy one-shot — add it
   to the CLAUDE.md production-rollout checklist.

## Out of scope (v1)

- Image asset migration (none observed; flagged if present).
- Academy interactive features (Quiz/Explain/Simplify), progress tracking.
- Redirects from old Academy URLs (different domain; not indexed under
  `/knowledge-hub`).
