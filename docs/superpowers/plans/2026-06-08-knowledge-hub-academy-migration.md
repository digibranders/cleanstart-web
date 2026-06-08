# Knowledge Hub ← Academy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. NOTE: Phase 1 (extraction) is browser-bound and must run in the main session that holds the logged-in `mac-studio` Chrome connection — it cannot be delegated to a context-less subagent.

**Goal:** Migrate all 245 CleanStart Academy knowledge-base articles into the CMS (`knowledgeBase` + `knowledgeCategories`), de-numbered and high-fidelity (tables + code), then switch the public `/knowledge-hub` page from its static data file to render from the CMS, keeping the existing 8 articles pinned at the top.

**Architecture:** Browser extraction (same-origin `fetch()` from the logged-in Academy page) → committed JSON manifest → extended `html-to-lexical` converter (tables + code) → idempotent Payload seed script (categories + articles) → web rewire to CMS via `RenderLexical`. Spec: `docs/superpowers/specs/2026-06-08-knowledge-hub-academy-migration-design.md`.

**Tech Stack:** Payload 3, Next.js 16, React 19, parse5 (`html-to-lexical`), Vitest, pnpm workspaces, Chrome MCP (extraction).

**Branch:** `development` (touches both `apps/cms` and `apps/web` — allowed).

---

## File Structure

| File | Responsibility | Phase |
|---|---|---|
| `apps/cms/src/payload/collections/KnowledgeCategories.ts` (modify) | add `displayOrder` field | 0 |
| `apps/cms/src/migrations/*_add_kb_category_display_order.ts` (create) | migration for the field | 0 |
| `apps/cms/scripts/data/academy-kb.json` (create) | extracted manifest (245 articles) | 1 |
| `apps/cms/scripts/extract-academy-kb.run.md` (create) | extraction run-book (JS snippets) | 1 |
| `apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts` (modify) | emit table + code nodes | 2 |
| `apps/cms/src/payload/lib/webflow-import/html-to-lexical.test.ts` (modify/create) | table + code unit tests | 2 |
| `apps/cms/scripts/data/kb-taxonomy.ts` (create) | section/subcategory label + order map + legacy 4 groups | 3 |
| `apps/cms/scripts/data/kb-legacy-articles.ts` (create) | the 8 legacy articles as HTML | 3 |
| `apps/cms/scripts/seed-knowledge-base.ts` (create) | seed categories + articles | 3 |
| `apps/web/src/lib/knowledge-hub.ts` (create) | CMS fetch helpers + sidebar builder | 4 |
| `apps/web/src/app/knowledge-hub/page.tsx` (modify) | landing from CMS | 4 |
| `apps/web/src/app/knowledge-hub/[slug]/page.tsx` (modify) | detail from CMS + RenderLexical | 4 |
| `apps/web/src/components/sections/knowledge-hub/*` (modify) | sidebar + body from CMS | 4 |

---

## Phase 0 — Category `displayOrder` field

### Task 0.1: Add `displayOrder` to KnowledgeCategories

**Files:**
- Modify: `apps/cms/src/payload/collections/KnowledgeCategories.ts`

- [ ] **Step 1: Add the field** — inside `buildTaxonomyFields` consumer or directly in the collection `fields` array, add (after `parent`):

```ts
{
  name: 'displayOrder',
  type: 'number',
  defaultValue: 100,
  admin: {
    position: 'sidebar',
    description: 'Lower = higher in the Knowledge Hub sidebar. Legacy groups use 0–9; Academy sections 10+.',
  },
}
```

(If categories are built via `buildTaxonomyFields()`, add the field in `KnowledgeCategories.ts` by spreading the result and appending this field, so the shared taxonomy builder is not changed for other collections.)

- [ ] **Step 2: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `payload-types.ts` gains `displayOrder?: number | null` on the `KnowledgeCategory` interface.

- [ ] **Step 3: Create migration**

Run: `pnpm --filter @cleanstart/cms exec payload migrate:create add_kb_category_display_order`
Expected: new files under `apps/cms/src/migrations/`. If local DB is push-mode and `migrate:create` can't introspect, restart the CMS dev server so push applies the column (see memory: local-cms-field-add-needs-dev-restart), then hand-author the migration to add the `display_order` integer column.

- [ ] **Step 4: Verify + commit**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS

```bash
git add apps/cms/src/payload/collections/KnowledgeCategories.ts apps/cms/src/payload-types.ts apps/cms/src/migrations/
git commit -m "feat(cms): add displayOrder to knowledgeCategories for KB sidebar ordering"
```

---

## Phase 1 — Extraction (Academy → manifest)

> Runs in the main session with the logged-in Chrome (tab on `academy.cleanstart.com`). Output is committed JSON; seeding never re-scrapes.

### Task 1.1: Enumerate all 245 article URLs

- [ ] **Step 1: Expand the full nav tree and harvest URLs.** In the Academy tab, click every section toggle and every subcategory toggle, then collect links. Run (page context):

```js
// Click all collapsed toggles (sections + subcategories), repeat until stable.
const clickAll = () => {
  const btns = [...document.querySelectorAll('button')].filter(b => /[▸▾]/.test(b.textContent) || /^\d\d/.test(b.textContent.trim()));
  let clicked = 0;
  btns.forEach(b => { if (b.getAttribute('data-exp') !== '1') { b.click(); b.setAttribute('data-exp','1'); clicked++; } });
  return clicked;
};
```

Run `clickAll()` repeatedly (3–4 passes) until it returns 0, then harvest:

```js
const links = [...new Set([...document.querySelectorAll('a[href*="/articles/"]')].map(a => a.getAttribute('href')))];
JSON.stringify({ count: links.length, links });
```

- [ ] **Step 2: Validate count.** Expected `count === 245`. Group by section (`/articles/(\d\d-[a-z]+)/`) and assert per-section totals match: understand 57, explore 34, learn 14, build 17, deploy 20, operate 37, secure 47, reference 19. If any section is short, expand its subcategories individually and re-harvest. **Do not proceed until all 245 are captured.** Save the URL list to a JS variable / scratch.

### Task 1.2: Fetch + parse all 245 articles

- [ ] **Step 1: Batch-fetch article HTML same-origin and parse.** Run in page context, in batches of ~25 to avoid timeouts (slice the `links` array). For each URL:

```js
async function extract(urls) {
  const out = [];
  for (const href of urls) {
    try {
      const html = await fetch(href, { credentials: 'include' }).then(r => r.text());
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const dc = doc.querySelector('.doc-content');
      const h1 = doc.querySelector('h1');
      const m = href.match(/\/articles\/(\d\d)-([a-z]+)\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
      const flags = [];
      if (!dc || dc.innerHTML.length < 200) flags.push('empty_or_gated');
      if (dc && dc.querySelector('img')) flags.push('has_image');
      out.push({
        href,
        sectionNum: m?.[1] ?? null,
        section: m?.[2] ?? null,
        subcategory: m?.[3] ?? null,
        slug: m?.[4] ?? null,
        title: h1 ? h1.textContent.trim() : null,
        bodyHtml: dc ? dc.innerHTML : '',
        tableCount: dc ? dc.querySelectorAll('table').length : 0,
        preCount: dc ? dc.querySelectorAll('pre').length : 0,
        flags,
      });
    } catch (e) { out.push({ href, error: String(e) }); }
  }
  return JSON.stringify(out);
}
```

Return each batch's JSON; the main agent appends to the manifest array.

- [ ] **Step 2: Assemble + review flags.** Combine batches into one array of 245. Surface to the operator: any entry with `error`, `empty_or_gated`, or `has_image` flags. Confirm handling (re-fetch gated; note image-bearing articles).

- [ ] **Step 3: Write manifest to disk.** The main agent writes the assembled array to `apps/cms/scripts/data/academy-kb.json` (pretty-printed). Each entry: `{ href, sectionNum, section, subcategory, slug, title, bodyHtml, tableCount, preCount, flags }`.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/data/academy-kb.json
git commit -m "chore(cms): extracted Academy knowledge-base manifest (245 articles)"
```

---

## Phase 2 — Converter: tables + code blocks

### Task 2.1: Table conversion (TDD)

**Files:**
- Modify: `apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts`
- Test: `apps/cms/src/payload/lib/webflow-import/html-to-lexical.test.ts`

- [ ] **Step 1: Write the failing test.** Add to the test file:

```ts
it('converts a table into lexical table/tablerow/tablecell nodes', () => {
  const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
  const root = htmlToLexical(html).root;
  const table = root.children.find((c: any) => c.type === 'table');
  expect(table).toBeDefined();
  const rows = (table as any).children;
  expect(rows).toHaveLength(2);
  expect(rows[0].children).toHaveLength(2);
  expect(rows[0].children[0].type).toBe('tablecell');
  expect(rows[0].children[0].headerState).toBe(1); // header cell
  // cell text is wrapped in a paragraph child
  const firstCellText = rows[1].children[0].children[0].children[0].text;
  expect(firstCellText).toBe('1');
});
```

- [ ] **Step 2: Run to confirm fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/webflow-import/html-to-lexical.test.ts -t "table"`
Expected: FAIL (no `table` node emitted).

- [ ] **Step 3: Implement.** In `html-to-lexical.ts`, add `case 'table'` to the block-element switch (the one with `p`/`h1`/etc.) BEFORE the `default`. Emit nodes matching the shape `apps/web/src/lib/renderLexical.tsx` consumes (`table` → `tablerow` → `tablecell` with `headerState` and paragraph children). Map `<th>` → `headerState: 1`, `<td>` → `headerState: 0`. Iterate `<tr>` across `thead`+`tbody`. Each cell's inline content goes through the existing `collectInline` wrapped in a `paragraph`. Add helper builders `tableNode/tableRowNode/tableCellNode` next to the existing `paragraph`/`list` builders.

- [ ] **Step 4: Run to confirm pass**

Run: same vitest command. Expected: PASS.

### Task 2.2: Code-block conversion (TDD)

- [ ] **Step 1: Write the failing test:**

```ts
it('converts <pre><code> into a code node preserving text and newlines', () => {
  const html = '<pre><code>const x = 1;\nconst y = 2;</code></pre>';
  const root = htmlToLexical(html).root;
  const code = root.children.find((c: any) => c.type === 'code');
  expect(code).toBeDefined();
  const text = (code as any).children.map((n: any) => n.text ?? (n.type === 'linebreak' ? '\n' : '')).join('');
  expect(text).toBe('const x = 1;\nconst y = 2;');
});
```

- [ ] **Step 2: Run to confirm fail.** Expected: FAIL (currently `<pre>` → quote).

- [ ] **Step 3: Implement.** Change `case 'pre'` to emit a Lexical `code` node (`type:'code'`, `children` of text nodes split on `\n` with `linebreak` nodes between), matching `renderLexical.tsx` `case "code"`. Preserve raw text (do NOT collapse whitespace for code). If `<pre>` wraps `<code class="language-xxx">`, capture the language into the code node's `language` field if the renderer uses it; otherwise omit.

- [ ] **Step 4: Run to confirm pass.** Expected: PASS.

### Task 2.3: Regression + commit

- [ ] **Step 1: Full converter test run**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/webflow-import/html-to-lexical.test.ts`
Expected: PASS (all existing + 2 new tests).

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts apps/cms/src/payload/lib/webflow-import/html-to-lexical.test.ts
git commit -m "feat(cms): html-to-lexical emits table + code-block nodes"
```

---

## Phase 3 — Seeding

### Task 3.1: Taxonomy map

**Files:**
- Create: `apps/cms/scripts/data/kb-taxonomy.ts`

- [ ] **Step 1: Define the taxonomy.** Export a typed structure: the 8 sections (key = `section` token e.g. `understand`, de-numbered `name`, `displayOrder` 10/20/…/80) and their subcategories (label + slug + order), plus the 4 legacy top-level groups (`Emerging Standards`, `Security features`, `Compliance and Certification`, `DevOps Kyverno`) with `displayOrder` 0–3. Subcategory labels are humanized from the URL token (e.g. `ai-runtime` → "AI Runtime") — include an explicit override map for acronyms (AI, CLI, CI/CD, API, SLSA, FIPS, QA, SBOM, SCA) so casing is right and **no numbers** leak in. Provide `humanizeLabel(token)` helper used by the seed.

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @cleanstart/cms typecheck`
```bash
git add apps/cms/scripts/data/kb-taxonomy.ts
git commit -m "feat(cms): KB taxonomy map (de-numbered sections + subcategories + legacy groups)"
```

### Task 3.2: Legacy 8 articles as HTML

**Files:**
- Create: `apps/cms/scripts/data/kb-legacy-articles.ts`

- [ ] **Step 1: Port the 8 articles.** From `apps/web/src/components/sections/knowledge-hub/kh-articles.data.ts` and `VexDocumentsBody.tsx`, express each of the 8 as `{ slug, title, lead, group, html }` where `html` is the article body (convert the `Block[]` to HTML strings: heading→`<h2>`, p→`<p>`, ul→`<ul><li>`, ol→`<ol><li>`, code→`<pre><code>`). For VEX, transcribe the JSX body to equivalent HTML. `group` is one of the 4 legacy group slugs. These run through the same `htmlToLexical` at seed time.

- [ ] **Step 2: Commit**

```bash
git add apps/cms/scripts/data/kb-legacy-articles.ts
git commit -m "feat(cms): legacy 8 KB articles as HTML for CMS seed"
```

### Task 3.3: Seed script

**Files:**
- Create: `apps/cms/scripts/seed-knowledge-base.ts`

- [ ] **Step 1: Write the seed (follow `seed-legal.ts`).** Behavior:
  1. Parse `--dry-run` / `--force`.
  2. `getPayload({ config })`.
  3. **Upsert categories**: legacy 4 groups (top-level, displayOrder 0–3), then 8 sections (top-level, displayOrder 10+), then subcategories (child of section via `parent`, displayOrder from taxonomy). Upsert by slug; capture id map `slug → id`.
  4. **Seed legacy 8**: for each, `htmlToLexical(html)` → upsert `knowledgeBase` (`category` = legacy group id, `_status:'published'`). Skip-if-exists unless `--force`.
  5. **Seed 245**: read `academy-kb.json`; for each, resolve leaf subcategory id (`section`+`subcategory`), de-collide slug if it already exists from a different section (prefix `section-`), `htmlToLexical(bodyHtml)`, derive `abstract` from first paragraph text (≤160 chars) if present, upsert `knowledgeBase` (`title`, `slug`, `abstract`, `category`, `body`, `_status:'published'`). Skip-if-exists unless `--force`.
  6. Log summary: categories created/updated, articles created/updated/skipped, collisions, flagged.

- [ ] **Step 2: Dry-run on local**

Run: `cd apps/cms && pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts --dry-run`
Expected: plan prints ~ (4+8 sections + N subcats) categories and 253 articles (245 + 8) with 0 errors; collisions listed.

- [ ] **Step 3: Real run on local**

Run: `cd apps/cms && pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts`
Expected: categories + 253 articles created.

- [ ] **Step 4: Spot-check in admin.** Open the CMS admin → Knowledge Base. Verify: a table-bearing article renders a table; a code-heavy article renders code blocks; category tree shows de-numbered sections with subcategories; legacy 8 present. Fix converter/seed if any are wrong, re-run with `--force`.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/seed-knowledge-base.ts
git commit -m "feat(cms): seed-knowledge-base script (categories + legacy 8 + Academy 245)"
```

---

## Phase 4 — Web wiring (static → CMS)

### Task 4.1: CMS fetch + sidebar builder

**Files:**
- Create: `apps/web/src/lib/knowledge-hub.ts`

- [ ] **Step 1: Implement fetch helpers** using the existing `cms-fetch.ts`:
  - `getKnowledgeCategories()` → published categories, depth 1 (parent), sorted by `displayOrder` then `name`.
  - `getKnowledgeArticles()` → published articles, depth 1 (category), fields needed for sidebar + listing.
  - `getKnowledgeArticle(slug)` → single published article, depth 2 (category→parent), incl. `body`, `tableOfContents`.
  - `buildSidebarGroups(categories, articles)` → grouped/ordered structure mirroring the current `SIDEBAR_GROUPS` type (legacy groups first by displayOrder, then sections with nested subcategories). Keep the existing `SidebarGroup`/`SidebarItem` types so downstream components are unchanged.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: PASS.

### Task 4.2: Detail page from CMS

**Files:**
- Modify: `apps/web/src/app/knowledge-hub/[slug]/page.tsx`
- Modify: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx`

- [ ] **Step 1: Rewire `[slug]/page.tsx`.** `generateStaticParams` from `getKnowledgeArticles()` slugs. `generateMetadata` + page from `getKnowledgeArticle(slug)` (404 if absent). Pass the CMS article to `KnowledgeHubArticle`.

- [ ] **Step 2: Render body with `RenderLexical`.** In `KnowledgeHubArticle.tsx`, replace the `Block[]`/`customBody` rendering with `<div className="article-body"><RenderLexical root={article.body} /></div>` (the blog detail pattern in `BlogDetailContent.tsx`). Remove the `VexDocumentsBody` special-case (VEX now comes from CMS).

- [ ] **Step 3: Verify in Claude Preview (desktop 1440×900).** Start web dev, load `/knowledge-hub/<an academy slug>` and `/knowledge-hub/vex-documents`. Confirm body, tables, code render; no console errors.

### Task 4.3: Sidebar + landing from CMS

**Files:**
- Modify: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubSidebar.tsx`
- Modify: `apps/web/src/app/knowledge-hub/page.tsx`
- Modify: `apps/web/src/components/sections/knowledge-hub/articles.ts` (retire static data)

- [ ] **Step 1: Sidebar from CMS.** Feed `KnowledgeHubSidebar` from `buildSidebarGroups(...)`. Legacy 4 groups render first, then the 8 sections with nested subcategories. No numeric prefixes shown.

- [ ] **Step 2: Landing from CMS.** `/knowledge-hub/page.tsx` renders the section cards from categories (name, subcategory blurb, article count). Counts computed from articles per section.

- [ ] **Step 3: Retire static data.** Remove `kh-articles.data.ts` import and the static `Article`/`ARTICLES` lookup once parity confirmed; keep shared `SidebarGroup` types. Delete `kh-articles.data.ts`, `VexDocumentsBody.tsx`, `ArticleBody.tsx` if now unused.

- [ ] **Step 4: Full web checks**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: PASS.

- [ ] **Step 5: Visual verify (1440×900).** Landing shows de-numbered sections; sidebar order correct (legacy first); 1 legacy + 3 academy articles render cleanly.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/knowledge-hub.ts apps/web/src/app/knowledge-hub apps/web/src/components/sections/knowledge-hub
git commit -m "feat(web): Knowledge Hub renders from CMS (RenderLexical + dynamic sidebar)"
```

---

## Phase 5 — Production rollout note

### Task 5.1: Document the one-shot

- [ ] **Step 1:** Add an item to the CLAUDE.md production-rollout checklist: run `seed-knowledge-base.ts` against prod CMS after the `displayOrder` migration deploys; note the hook blast radius (Meilisearch/IndexNow/Teams per published doc × 253) and "run in a quiet window". Commit.

---

## Self-review notes

- **Spec coverage:** Phase 0=ordering field; Phase 1=extraction+flags+collisions; Phase 2=table/code fidelity; Phase 3=categories(de-numbered)+legacy 8 at top+245 published; Phase 4=web rewire+RenderLexical+sidebar; Phase 5=prod rollout note. All spec sections mapped.
- **De-numbering** enforced in Task 3.1 (`humanizeLabel`, no numeric prefixes) and Task 4.3 (sidebar shows no numbers).
- **Idempotency**: seed skip-by-slug unless `--force`, matching `seed-legal.ts`.
- **Type consistency**: `buildSidebarGroups` returns the existing `SidebarGroup`/`SidebarItem` types; converter emits node shapes consumed by `renderLexical.tsx` (`table`/`tablerow`/`tablecell`, `code`).
