# SEO Keywords (topic entities) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared `seo.keywords` field across all CMS content collections, surfaced as a chip editor in the SEO sidebar, output as schema.org `keywords` + `mentions` entity signals and indexed in Meilisearch — never as a dead `<meta name="keywords">` tag.

**Architecture:** Follows the codebase's established "hidden data field in the `seo` group + sidebar UI component edits it via `useField`" pattern (exactly how `alternates`/`customTags` + `HeadTagsCard` work). Storage is a single `json` column per collection (one cheap migration, no relational tables, no enum-name overflow), holding a normalized `string[]`. JSON-LD and search readers prefer `seo.keywords` and fall back to the legacy guides-only `keywords[]` array for back-compat; a one-shot backfill consolidates existing guides into the new field.

**Tech Stack:** Payload 3.81 · Next.js 16 · React 19 · Postgres (jsonb) · Vitest · Meilisearch · TypeScript strict.

**Senior-SEO rationale (locked decisions):**
- **No `<meta name="keywords">` tag.** Dead for ranking since 2009; Bing treats stuffing as a spam signal. Keywords are captured as *entity / structured-data* signals only.
- **Output targets (user-selected):** JSON-LD entities (`keywords` Text property + `mentions[]` `Thing`), internal Meilisearch search (searchable + filterable), and related/taxonomy UI (enabled by the filterable attribute + the field being present in the REST API; web-side consumption is a separate `apps/web` follow-up, out of scope here).
- **Scope:** Shared across all 11 content collections that already spread `seoFieldsForSidebar`/`seoSidebarFields`. Guides' legacy `keywords[]` is migrated in and hidden, not dropped (a destructive column drop is deferred to a later cleanup migration).

**Out of scope (explicit):** any `apps/web` rendering/related-content UI; dropping the legacy `guides.keywords` column; keyword emission on Event JSON-LD (schema.org `Event` has no `keywords` property). WebPage (pages/resources) keyword emission is an optional final task.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `apps/cms/src/payload/lib/seo/keywords.ts` | Pure normalize + merge helpers (trim, dedupe, cap) | Create |
| `apps/cms/src/payload/lib/seo/keywords.test.ts` | Unit tests for the helpers | Create |
| `apps/cms/src/payload/fields/seo.ts` | Add `seo.keywords` json field + mount sidebar card | Modify |
| `apps/cms/src/payload/admin/components/SeoKeywordsField.tsx` | Sidebar chip editor for `seo.keywords` | Create |
| `apps/cms/src/payload/lib/jsonld/dispatch.ts` | Read `seo.keywords` (+ legacy) for all article-like collections | Modify |
| `apps/cms/src/payload/lib/jsonld/article.ts` | Emit `keywords` Text property alongside `mentions[]` | Modify |
| `apps/cms/src/payload/lib/jsonld/article.test.ts` | Assert `keywords` property emission | Modify |
| `apps/cms/src/payload/lib/jsonld/dispatch.test.ts` | Assert keywords now read from `seo.keywords` for blogs | Modify |
| `apps/cms/src/payload/lib/search/index-schema.ts` | Index keywords (searchable + filterable) | Modify |
| `apps/cms/src/payload/lib/search/index-schema.test.ts` | Assert search doc carries keywords | Modify |
| `apps/cms/src/payload/collections/Guides.ts` | Hide legacy in-form `keywords[]` array | Modify |
| `apps/cms/scripts/backfill-seo-keywords-from-guides.ts` | One-shot consolidation of legacy guide keywords | Create |
| `apps/cms/src/payload/migrations/<generated>.ts` | `seo_keywords` jsonb column on each collection + version table | Generate |
| `apps/cms/payload-types.ts` | Regenerated types | Generate |
| `CLAUDE.md` | Prod rollout checklist item 14 (backfill + reindex) | Modify |

---

## Task 1: Keywords normalize + merge helpers (pure lib, TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/seo/keywords.ts`
- Test: `apps/cms/src/payload/lib/seo/keywords.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/cms/src/payload/lib/seo/keywords.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import {
  MAX_KEYWORD_LEN,
  MAX_KEYWORDS,
  mergeKeywordSources,
  normalizeKeywords,
} from './keywords';

describe('normalizeKeywords', () => {
  it('returns an empty array for non-array / nullish input', () => {
    expect(normalizeKeywords(null)).toEqual([]);
    expect(normalizeKeywords(undefined)).toEqual([]);
    expect(normalizeKeywords('sbom signing')).toEqual([]);
    expect(normalizeKeywords({})).toEqual([]);
  });

  it('trims, drops empties, and ignores non-string entries', () => {
    expect(normalizeKeywords(['  sbom  ', '', '   ', 42, null, 'fips'])).toEqual([
      'sbom',
      'fips',
    ]);
  });

  it('dedupes case-insensitively, keeping first-seen casing', () => {
    expect(normalizeKeywords(['SBOM', 'sbom', 'Sbom', 'FIPS'])).toEqual(['SBOM', 'FIPS']);
  });

  it('caps each keyword length', () => {
    const long = 'x'.repeat(MAX_KEYWORD_LEN + 20);
    expect(normalizeKeywords([long])[0]).toHaveLength(MAX_KEYWORD_LEN);
  });

  it('caps the total number of keywords', () => {
    const many = Array.from({ length: MAX_KEYWORDS + 10 }, (_, i) => `kw-${i}`);
    expect(normalizeKeywords(many)).toHaveLength(MAX_KEYWORDS);
  });
});

describe('mergeKeywordSources', () => {
  it('prefers primary order, then appends unique legacy entries', () => {
    expect(mergeKeywordSources(['sbom', 'fips'], ['FIPS', 'sca'])).toEqual([
      'sbom',
      'fips',
      'sca',
    ]);
  });

  it('falls back to legacy when primary is empty / not an array', () => {
    expect(mergeKeywordSources(null, ['sbom'])).toEqual(['sbom']);
    expect(mergeKeywordSources(undefined, ['sbom', 'sbom'])).toEqual(['sbom']);
  });

  it('returns an empty array when both sources are empty', () => {
    expect(mergeKeywordSources(null, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/keywords.test.ts`
Expected: FAIL — `Cannot find module './keywords'`.

- [ ] **Step 3: Write the implementation**

Create `apps/cms/src/payload/lib/seo/keywords.ts`:

```ts
/**
 * Topic-keyword normalization shared by the SEO sidebar editor, the
 * JSON-LD dispatcher, and the Meilisearch document builder.
 *
 * Keywords are an entity / structured-data signal (schema.org
 * `keywords` + `mentions[]`) and a search facet — NOT a
 * `<meta name="keywords">` tag (dead for ranking since 2009).
 */

/** Max keywords stored per document. Beyond this is stuffing, not signal. */
export const MAX_KEYWORDS = 20;
/** Max characters per keyword. A "keyword" longer than this is a sentence. */
export const MAX_KEYWORD_LEN = 60;

/**
 * Normalize an arbitrary stored value into a clean `string[]`:
 * trims, drops empties / non-strings, dedupes case-insensitively
 * (first-seen casing wins), caps each entry length and the total count.
 * Always returns a fresh array — never null — so callers decide how to
 * persist "empty".
 */
export const normalizeKeywords = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim().slice(0, MAX_KEYWORD_LEN);
    if (trimmed.length === 0) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
};

/**
 * Merge the canonical `seo.keywords` source with a legacy fallback
 * (guides' original `keywords[]` array, already flattened to strings).
 * Primary order is preserved; unique legacy entries are appended.
 */
export const mergeKeywordSources = (
  primary: unknown,
  legacy: readonly string[],
): string[] => normalizeKeywords([...normalizeKeywords(primary), ...legacy]);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/keywords.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/seo/keywords.ts apps/cms/src/payload/lib/seo/keywords.test.ts
git commit -m "feat(cms): add keyword normalize/merge helpers for SEO keywords"
```

---

## Task 2: Add `seo.keywords` json field to the shared SEO group

**Files:**
- Modify: `apps/cms/src/payload/fields/seo.ts`

- [ ] **Step 1: Add the import**

At the top of `apps/cms/src/payload/fields/seo.ts`, add this import next to the existing `normaliseText` import (line 9):

```ts
import { normaliseText } from '../lib/normalise-text';
import { normalizeKeywords } from '../lib/seo/keywords';
import { mediaUploadField } from './media-upload';
```

- [ ] **Step 2: Define the field**

In `apps/cms/src/payload/fields/seo.ts`, immediately AFTER the `keywordTargetField` definition (it ends at line ~411 with `};`), add:

```ts
// Topic keywords — a normalized list of entity terms for this page.
// Distinct from `keywordTarget` (the single focus keyword that drives
// the density readout): this is the *entity set* surfaced as schema.org
// `keywords` + `mentions[]` (AEO/GEO signal) and indexed as a search
// facet. Stored as a `json` blob (a `string[]`) — same storage choice
// as `alternates` / `customTags`, because the parent `seo` group is
// `admin.hidden` and Payload's `array` row-registry needs an in-form
// render surface. The `SeoKeywordsField` sidebar card reads/writes the
// blob via `useField` + `setValue`. Normalized on every save so the
// stored shape is always a clean, de-duped, capped array (or null).
const keywordsField: Field = {
  name: 'keywords',
  type: 'json',
  admin: { hidden: true },
  hooks: {
    beforeChange: [
      ({ value }) => {
        const cleaned = normalizeKeywords(value);
        return cleaned.length > 0 ? cleaned : null;
      },
    ],
  },
};
```

- [ ] **Step 3: Register the field in the group**

In the `seoField.fields` array (lines ~448-465), add `keywordsField` right after `keywordTargetField`:

```ts
    customTagsField,
    keywordTargetField,
    keywordsField,
    speakablePathField,
    additionalSchemaField,
  ],
};
```

- [ ] **Step 4: Typecheck the field file**

Run: `pnpm --filter @cleanstart/cms exec tsc --noEmit`
Expected: PASS (no new errors). The sidebar component referenced in Task 4 doesn't exist yet but is loaded by string path, so this still typechecks.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/fields/seo.ts
git commit -m "feat(cms): add seo.keywords json field to shared SEO group"
```

---

## Task 3: Generate the migration and regenerate types

**Files:**
- Generate: `apps/cms/src/payload/migrations/<timestamp>_add_seo_keywords.ts`
- Generate: `apps/cms/payload-types.ts`

> **Context (local dev is push-mode):** the local Postgres applies schema via Payload push, not the migration runner — `payload migrate` hangs locally. To make the new `seo_keywords` jsonb column exist in your local DB, **restart the CMS dev server** so push applies it. The generated migration file is for CI/prod. See memory `local-cms-field-add-needs-dev-restart`.

- [ ] **Step 1: Restart the dev server so push adds the column locally**

Stop the running `pnpm --filter @cleanstart/cms dev` process and start it again. On boot, Payload push adds `seo_keywords` (jsonb) to every content collection table and its `_v_version_*` counterpart.

Verify (psql or pgAdmin against the `cleanstart` DB):

Run: `psql "$DATABASE_URI" -c "SELECT column_name FROM information_schema.columns WHERE table_name='blogs' AND column_name='seo_keywords';"`
Expected: one row, `seo_keywords`.

- [ ] **Step 2: Generate the migration for CI/prod**

Run: `pnpm --filter @cleanstart/cms exec payload migrate:create add_seo_keywords`
Expected: a new file under `apps/cms/src/payload/migrations/` adding the `seo_keywords` column to each content collection + version table.

- [ ] **Step 3: Normalize the generated migration signature for biome**

Open the generated migration. If its `up`/`down` signatures destructure `{ db, payload, req }`, trim them to the args actually used (typically `{ db }`) so biome's no-unused-vars rule passes — matching the repo convention (memory `local-cms-field-add-needs-dev-restart`). Example:

```ts
export async function up({ db }: MigrateUpArgs): Promise<void> {
```

- [ ] **Step 4: Regenerate types and commit them**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `apps/cms/payload-types.ts` now types `seo.keywords` on each collection's `seo` group (likely `unknown | null` for a json field). Commit the regenerated file (CI fails on drift — memory `payload-types-prefix-order-drift`).

- [ ] **Step 5: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/migrations/ apps/cms/payload-types.ts
git commit -m "feat(cms): migration + types for seo.keywords column"
```

---

## Task 4: Sidebar chip editor `SeoKeywordsField`

**Files:**
- Create: `apps/cms/src/payload/admin/components/SeoKeywordsField.tsx`
- Modify: `apps/cms/src/payload/fields/seo.ts` (mount the UI field)

- [ ] **Step 1: Create the component**

Create `apps/cms/src/payload/admin/components/SeoKeywordsField.tsx`:

```tsx
'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import { MAX_KEYWORDS, normalizeKeywords } from '../../lib/seo/keywords';

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  fontSize: 13,
  background: 'var(--theme-elevation-50, #1c1d21)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  borderRadius: 4,
  color: 'var(--theme-text, #e8e9eb)',
  fontFamily: 'inherit',
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 6px 3px 8px',
  fontSize: 11,
  borderRadius: 999,
  background: 'var(--theme-elevation-100, #25262b)',
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  color: 'var(--theme-text, #e8e9eb)',
};

const removeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--theme-text-soft, #a4a7af)',
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: 1,
  padding: 0,
};

const addBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  background: 'var(--theme-elevation-100, #25262b)',
  color: 'var(--theme-text, #e8e9eb)',
  cursor: 'pointer',
};

/**
 * Sidebar editor for `seo.keywords` (a `string[]` json blob). Renders a
 * chip list with add (Enter or comma, paste-friendly) + remove. All
 * mutations route through `normalizeKeywords`, so the stored shape is
 * always clean / de-duped / capped. This is the entity-keyword set
 * (schema.org `keywords` + `mentions[]`), separate from the single
 * "target keyword" density tool.
 */
export const SeoKeywordsField = (): ReactElement => {
  const inputId = useId();
  const { value, setValue } = useField<string[] | null>({ path: 'seo.keywords' });
  const keywords = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [pending, setPending] = useState('');

  const commit = useCallback(
    (next: string[]) => {
      const cleaned = normalizeKeywords(next);
      setValue(cleaned.length > 0 ? cleaned : null);
    },
    [setValue],
  );

  const addPending = useCallback(() => {
    // Split on commas so a pasted "a, b, c" expands into three chips.
    const parts = pending.split(',');
    if (parts.every((p) => p.trim().length === 0)) return;
    commit([...keywords, ...parts]);
    setPending('');
  }, [pending, keywords, commit]);

  const removeAt = useCallback(
    (idx: number) => commit(keywords.filter((_, i) => i !== idx)),
    [keywords, commit],
  );

  const atCap = keywords.length >= MAX_KEYWORDS;

  return (
    <div className="field-type seo-keywords-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 4,
        }}
      >
        Topic keywords
      </label>
      <p style={{ fontSize: 11, color: 'var(--theme-text-disabled, #6b6e77)', margin: '0 0 6px' }}>
        Entity terms this page is about. Feed schema.org markup + on-site search — not a meta-keywords tag.
      </p>

      {keywords.length > 0 && (
        <ul
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            listStyle: 'none',
            margin: '0 0 6px',
            padding: 0,
          }}
        >
          {keywords.map((kw, idx) => (
            <li key={`${kw}-${idx}`} style={chipStyle}>
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${kw}`}
                style={removeBtnStyle}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={inputId}
          type="text"
          value={pending}
          disabled={atCap}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPending(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addPending();
            }
          }}
          placeholder={atCap ? `Max ${MAX_KEYWORDS} keywords` : 'e.g. SBOM, FIPS 140-3'}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addPending}
          disabled={atCap || pending.trim() === ''}
          style={addBtnStyle}
        >
          Add
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Mount the card in the sidebar field list**

In `apps/cms/src/payload/fields/seo.ts`, inside `seoSidebarFields()`, add a new UI field directly AFTER the `schemaPreview` entry (it ends near line 626) and before the `canonicalUrl` entry:

```ts
    {
      name: 'schemaPreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SchemaPreviewField.tsx#SchemaPreviewField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      // Topic keywords — entity terms surfaced in JSON-LD (`keywords` +
      // `mentions[]`) and indexed as a search facet. Sits in the
      // "what indexes / entities" cluster next to the Schema preview.
      name: 'seoKeywords',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoKeywordsField.tsx#SeoKeywordsField',
          },
        },
      },
    },
    {
      // Canonical-URL card — surfaces the self-canonical that JSON-LD
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @cleanstart/cms exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Visually verify in the admin (manual)**

With the dev server running, open any blog in `/admin/collections/blogs/<id>`. In the right sidebar, between the Schema preview and Canonical cards, confirm the **Topic keywords** card appears. Type `SBOM`, press Enter → a chip appears. Type `sbom, fips` + Add → only `fips` is added (dedupe). Save the doc, reload → chips persist.

- [ ] **Step 5: Lint + commit**

```bash
pnpm --filter @cleanstart/cms lint
git add apps/cms/src/payload/admin/components/SeoKeywordsField.tsx apps/cms/src/payload/fields/seo.ts
git commit -m "feat(cms): SeoKeywordsField sidebar chip editor for seo.keywords"
```

---

## Task 5: JSON-LD wiring — read `seo.keywords` for all article-like collections, emit `keywords` property

**Files:**
- Modify: `apps/cms/src/payload/lib/jsonld/dispatch.ts`
- Modify: `apps/cms/src/payload/lib/jsonld/article.ts`
- Test: `apps/cms/src/payload/lib/jsonld/article.test.ts`, `apps/cms/src/payload/lib/jsonld/dispatch.test.ts`

- [ ] **Step 1: Write the failing article test**

In `apps/cms/src/payload/lib/jsonld/article.test.ts`, add a test asserting the `keywords` Text property is emitted alongside `mentions[]`. Append within the existing top-level `describe` block:

```ts
  it('emits a keywords Text property and mentions[] from source.keywords', () => {
    const blob = buildArticleBlob(ctx, {
      variant: 'Article',
      url: 'https://cleanstart.com/blogs/sbom-signing',
      title: 'SBOM signing',
      keywords: ['SBOM', 'FIPS'],
    }) as Record<string, unknown>;

    expect(blob.keywords).toEqual(['SBOM', 'FIPS']);
    expect(blob.mentions).toEqual([
      { '@type': 'Thing', name: 'SBOM' },
      { '@type': 'Thing', name: 'FIPS' },
    ]);
  });
```

> If `ctx` is named differently or built per-test in `article.test.ts`, mirror the construction used by the neighbouring tests in that file (read the top of the file first).

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/jsonld/article.test.ts -t "keywords Text property"`
Expected: FAIL — `blob.keywords` is `undefined` (only `mentions` is currently set).

- [ ] **Step 3: Emit the `keywords` property in `article.ts`**

In `apps/cms/src/payload/lib/jsonld/article.ts`, replace the existing keywords block (lines 157-159):

```ts
  if (source.keywords && source.keywords.length > 0) {
    blob.mentions = source.keywords.map((name) => ({ '@type': 'Thing', name }));
  }
```

with:

```ts
  if (source.keywords && source.keywords.length > 0) {
    // `keywords` (Text[]) is the standard schema.org property; `mentions`
    // (Thing[]) gives each term entity status for Knowledge-Graph / AI
    // answer-engine understanding. Emitting both is the strongest signal.
    blob.keywords = [...source.keywords];
    blob.mentions = source.keywords.map((name) => ({ '@type': 'Thing', name }));
  }
```

- [ ] **Step 4: Run the article test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/jsonld/article.test.ts`
Expected: PASS (new test + all existing).

- [ ] **Step 5: Broaden `readKeywords` in `dispatch.ts`**

In `apps/cms/src/payload/lib/jsonld/dispatch.ts`, add the import (next to the other lib imports near the top):

```ts
import { mergeKeywordSources } from '../seo/keywords';
```

Replace the existing `readKeywords` (lines 138-145):

```ts
const readKeywords = (doc: AnyDoc): string[] | null => {
  const list = (doc as { keywords?: { keyword?: string | null }[] | null }).keywords;
  if (!list) return null;
  const out = list
    .map((k) => k.keyword ?? '')
    .filter((s): s is string => s.length > 0);
  return out.length > 0 ? out : null;
};
```

with:

```ts
const readKeywords = (doc: AnyDoc): string[] | null => {
  // Canonical source is `seo.keywords` (string[] json). Legacy guides
  // carry a top-level `keywords[]` array of `{ keyword }` until the
  // backfill consolidates them — read both, prefer seo.keywords.
  const seoKeywords = (doc as { seo?: { keywords?: unknown } }).seo?.keywords;
  const legacyRaw = (doc as { keywords?: { keyword?: string | null }[] | null }).keywords;
  const legacy = Array.isArray(legacyRaw)
    ? legacyRaw
        .map((k) => k?.keyword ?? '')
        .filter((s): s is string => s.length > 0)
    : [];
  const merged = mergeKeywordSources(seoKeywords, legacy);
  return merged.length > 0 ? merged : null;
};
```

- [ ] **Step 6: Apply keywords to all article-like collections**

In `dispatchArticleLike` (in `dispatch.ts`), change the gated line (line 262):

```ts
    keywords: collection === 'guides' ? readKeywords(doc) : null,
```

to:

```ts
    keywords: readKeywords(doc),
```

> Leave `citations` gated to guides on the next line — that field genuinely only exists on guides.

- [ ] **Step 7: Add the dispatch test**

In `apps/cms/src/payload/lib/jsonld/dispatch.test.ts`, add a test asserting a blog now emits keywords from `seo.keywords`. Match the existing test harness in that file (read its top to reuse the `ctx`/builder helpers), then add:

```ts
  it('emits Article keywords from seo.keywords for blogs (not just guides)', () => {
    const blobs = buildJsonLdBlobs(ctx, 'blogs', {
      id: 1,
      slug: 'sbom-signing',
      title: 'SBOM signing',
      seo: { keywords: ['SBOM', 'FIPS'] },
    });
    const article = blobs.find((b) => b['@type'] === 'Article') as Record<string, unknown>;
    expect(article?.keywords).toEqual(['SBOM', 'FIPS']);
  });
```

- [ ] **Step 8: Run the jsonld suite**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/jsonld/`
Expected: PASS (new tests + all existing dispatch/article tests).

- [ ] **Step 9: Lint + commit**

```bash
pnpm --filter @cleanstart/cms lint
git add apps/cms/src/payload/lib/jsonld/article.ts apps/cms/src/payload/lib/jsonld/article.test.ts apps/cms/src/payload/lib/jsonld/dispatch.ts apps/cms/src/payload/lib/jsonld/dispatch.test.ts
git commit -m "feat(cms): emit seo.keywords as JSON-LD keywords + mentions for all article types"
```

---

## Task 6: Search wiring — index keywords (searchable + filterable)

**Files:**
- Modify: `apps/cms/src/payload/lib/search/index-schema.ts`
- Test: `apps/cms/src/payload/lib/search/index-schema.test.ts`

- [ ] **Step 1: Write the failing search test**

In `apps/cms/src/payload/lib/search/index-schema.test.ts`, add (reusing the file's existing `buildSearchDocument` import + `baseUrl` constant — read the top of the file first):

```ts
  it('indexes seo.keywords (preferring it over legacy keywords[])', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 7,
      slug: 'sbom-signing',
      title: 'SBOM signing',
      seo: { indexable: 'index', keywords: ['SBOM', 'FIPS'] },
    });
    expect(doc?.keywords).toEqual(['SBOM', 'FIPS']);
  });

  it('falls back to legacy guides keywords[] when seo.keywords is empty', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'guides', {
      id: 8,
      slug: 'nist-mapping',
      title: 'NIST mapping',
      keywords: [{ keyword: 'NIST' }, { keyword: 'k8s' }],
    } as never);
    expect(doc?.keywords).toEqual(['NIST', 'k8s']);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/search/index-schema.test.ts -t "indexes seo.keywords"`
Expected: FAIL — `doc.keywords` is `undefined`.

- [ ] **Step 3: Add the import + settings**

In `apps/cms/src/payload/lib/search/index-schema.ts`, add the import at the top (next to the existing relative imports):

```ts
import { mergeKeywordSources } from '../seo/keywords';
```

Update `INDEX_SETTINGS` (lines 123-124) to make keywords searchable + filterable:

```ts
  searchableAttributes: ['title', 'description', 'body', 'authors', 'categories', 'keywords'],
  filterableAttributes: ['collection', 'categories', 'keywords', 'isPublished'],
```

- [ ] **Step 4: Extend `IndexableDoc` and read keywords**

In `index-schema.ts`, extend the `IndexableDoc` interface (the `seo` line, ~171) and add the legacy field:

```ts
  category?: CategoryLite | number | null;
  keywords?: readonly { keyword?: string | null }[] | null;
  seo?: { indexable?: string | null; keywords?: unknown } | null;
}
```

Add a collector helper just below `collectCategoryNames` (after line 224):

```ts
const collectKeywords = (doc: IndexableDoc): string[] => {
  const legacy = Array.isArray(doc.keywords)
    ? doc.keywords
        .map((k) => k?.keyword ?? '')
        .filter((s): s is string => s.length > 0)
    : [];
  return mergeKeywordSources(doc.seo?.keywords, legacy);
};
```

In `buildSearchDocument`, after the `categories` line (`if (categories.length > 0) out.categories = categories;`, line ~269) add:

```ts
  if (authors.length > 0) out.authors = authors;
  if (categories.length > 0) out.categories = categories;

  const keywords = collectKeywords(doc);
  if (keywords.length > 0) out.keywords = keywords;

  return out as SearchDocument;
```

> No `SearchDocument` type change needed — it has an index signature (`readonly [key: string]: unknown`).

- [ ] **Step 5: Run the search suite**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/search/`
Expected: PASS (new tests + existing index-schema/sync/client tests).

> The Meilisearch settings change (searchable/filterable) takes effect after the settings are re-pushed and the index is reindexed — covered by the prod checklist item in Task 7. Tests assert the document shape only, which is what `buildSearchDocument` controls.

- [ ] **Step 6: Lint + commit**

```bash
pnpm --filter @cleanstart/cms lint
git add apps/cms/src/payload/lib/search/index-schema.ts apps/cms/src/payload/lib/search/index-schema.test.ts
git commit -m "feat(cms): index seo.keywords as a searchable + filterable Meilisearch facet"
```

---

## Task 7: Consolidate the legacy guides `keywords[]` (backfill + hide) and document the rollout

**Files:**
- Create: `apps/cms/scripts/backfill-seo-keywords-from-guides.ts`
- Modify: `apps/cms/src/payload/collections/Guides.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Write the backfill script**

Create `apps/cms/scripts/backfill-seo-keywords-from-guides.ts`. Follow the established prod-script pattern (boots Payload, `--dry-run` default-off, idempotent, `payload.update` per row):

```ts
/**
 * One-shot: copy each guide's legacy `keywords[]` (array of { keyword })
 * into the consolidated `seo.keywords` (string[] json), then leave the
 * legacy field in place (hidden) for a later cleanup migration.
 *
 * Idempotent: a guide whose `seo.keywords` already equals the legacy set
 * is skipped. Re-runnable. `--dry-run` previews without writing.
 *
 * Run (inside the cms container): pnpm exec tsx --env-file=.env \
 *   scripts/backfill-seo-keywords-from-guides.ts [--dry-run]
 *
 * Note: payload.update re-fires the guides afterChange hooks. Teams /
 * IndexNow are publish-transition-gated (a re-save of a published guide
 * does NOT fire them); the live effects are a Meilisearch re-sync
 * (desired — keywords become searchable) + a version row per guide.
 * Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config';
import { normalizeKeywords } from '../src/payload/lib/seo/keywords';

const DRY_RUN = process.argv.includes('--dry-run');

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const run = async (): Promise<void> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'guides',
    limit: 1000,
    depth: 0,
    pagination: false,
    draft: true,
  });

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const legacyRaw = (doc as { keywords?: { keyword?: string | null }[] | null }).keywords;
    const legacy = Array.isArray(legacyRaw)
      ? legacyRaw.map((k) => k?.keyword ?? '').filter((s) => s.length > 0)
      : [];
    if (legacy.length === 0) {
      skipped += 1;
      continue;
    }
    const existing = (doc as { seo?: { keywords?: unknown } }).seo?.keywords;
    const merged = normalizeKeywords([...normalizeKeywords(existing), ...legacy]);
    const current = normalizeKeywords(existing);
    if (sameSet(current, merged)) {
      skipped += 1;
      continue;
    }
    payload.logger.info(`guide ${doc.slug}: ${current.length} → ${merged.length} keywords`);
    if (!DRY_RUN) {
      await payload.update({
        collection: 'guides',
        id: doc.id,
        data: { seo: { keywords: merged } } as never,
        depth: 0,
      });
    }
    updated += 1;
  }

  payload.logger.info(
    `${DRY_RUN ? '[dry-run] ' : ''}guides keyword backfill: ${updated} updated, ${skipped} skipped`,
  );
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run the backfill locally**

Run: `pnpm --filter @cleanstart/cms exec tsx scripts/backfill-seo-keywords-from-guides.ts --dry-run`
Expected: a per-guide log of `N → M keywords` and a summary line. No writes.

- [ ] **Step 3: Real run locally, then re-run to confirm idempotency**

Run: `pnpm --filter @cleanstart/cms exec tsx scripts/backfill-seo-keywords-from-guides.ts`
Then run it again.
Expected: second run reports `0 updated` (all skipped) — idempotent.

- [ ] **Step 4: Hide the legacy in-form `keywords` array on Guides**

In `apps/cms/src/payload/collections/Guides.ts`, update the `keywords` array field (lines 212-221) so the editor no longer sees a second editing surface — keep the column + data for back-compat reads:

```ts
    {
      name: 'keywords',
      type: 'array',
      labels: { singular: 'Keyword', plural: 'Keywords' },
      admin: {
        // Superseded by the shared `seo.keywords` sidebar card. Kept as a
        // hidden data field for back-compat reads (dispatch/search merge
        // it as a fallback) until a later migration drops the column.
        hidden: true,
        description:
          'Legacy — edit topic keywords in the SEO sidebar (Topic keywords). Retained for back-compat.',
      },
      fields: [{ name: 'keyword', type: 'text', required: true }],
    },
```

- [ ] **Step 5: Add the prod rollout checklist entry to CLAUDE.md**

In `CLAUDE.md`, under "Production rollout checklist", add a new item after item 13:

```markdown
14. **SEO keywords consolidation + reindex.** The new shared `seo.keywords` field (string[] json on every content collection's `seo` group) replaces the guides-only `keywords[]`. The `20260611_*_add_seo_keywords` migration adds the column (runs via CI on deploy to `main`); run the backfill **after** it applies.
    - **Backfill (guides only):** from inside the `cms` container, `pnpm exec tsx --env-file=.env scripts/backfill-seo-keywords-from-guides.ts --dry-run` then `… ` (no flag). Idempotent / re-runnable; copies each guide's legacy `keywords[]` into `seo.keywords`. Same afterChange caveat as tasks 1–13 (Teams/IndexNow are publish-transition-gated and won't fire on re-save of a published guide; Meilisearch re-syncs + a version row per guide). Run in a quiet window.
    - **Reindex (settings + facet):** the index gains `keywords` as a searchable + filterable attribute. After deploy, push settings + reindex with `pnpm exec tsx scripts/reindex-search.ts` (same script as checklist item 12). Verify `…/indexes/content/settings/filterable-attributes` includes `keywords`.
    - After the run, spot-check: a guide's `seo.keywords` chips match its old keyword list; `?q=<a-keyword>` in ⌘K search surfaces docs that only have the term in keywords; a guide page's JSON-LD shows both `keywords` and `mentions[]`.
```

- [ ] **Step 6: Lint + commit**

```bash
pnpm --filter @cleanstart/cms lint
git add apps/cms/scripts/backfill-seo-keywords-from-guides.ts apps/cms/src/payload/collections/Guides.ts CLAUDE.md
git commit -m "feat(cms): backfill + hide legacy guides keywords; document keywords rollout"
```

---

## Task 8 (OPTIONAL): WebPage keywords for pages + resources

> Only do this if you want `keywords` on `/pages` and `/resources` JSON-LD too. Article-like collections (the primary value) are already covered by Task 5. Skip if descoping.

**Files:**
- Modify: `apps/cms/src/payload/lib/jsonld/web-page.ts`
- Modify: `apps/cms/src/payload/lib/jsonld/dispatch.ts`
- Test: `apps/cms/src/payload/lib/jsonld/web-page.test.ts` (create if absent)

- [ ] **Step 1: Read `web-page.ts`**

Run: `sed -n '1,80p' apps/cms/src/payload/lib/jsonld/web-page.ts`
Identify the `WebPageSource` interface and `buildWebPageBlob`.

- [ ] **Step 2: Add `keywords` to the WebPage source + emission**

Add `readonly keywords?: readonly string[] | null;` to `WebPageSource`, and in `buildWebPageBlob`, after the description/image block, add:

```ts
  if (source.keywords && source.keywords.length > 0) {
    blob.keywords = [...source.keywords];
  }
```

- [ ] **Step 3: Pass keywords from the dispatchers**

In `dispatch.ts`, `dispatchPage` and `dispatchResource` both call `buildWebPageBlob({...})`. Add `keywords: readKeywords(doc),` to each call's source object.

- [ ] **Step 4: Test, lint, commit**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/jsonld/ && pnpm --filter @cleanstart/cms lint`
Expected: PASS.

```bash
git add apps/cms/src/payload/lib/jsonld/web-page.ts apps/cms/src/payload/lib/jsonld/dispatch.ts apps/cms/src/payload/lib/jsonld/web-page.test.ts
git commit -m "feat(cms): emit keywords on WebPage JSON-LD for pages + resources"
```

---

## Task 9: Full verification gate

- [ ] **Step 1: Run the mandated CMS checks**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/ src/payload/lib/jsonld/ src/payload/lib/search/
pnpm --filter @cleanstart/cms build
```

Expected: `lint ✓ · typecheck ✓ · tests ✓ · build ✓`. Fix any failure before reporting done.

- [ ] **Step 2: Confirm types committed**

Run: `git status --porcelain apps/cms/payload-types.ts`
Expected: empty (the regenerated types from Task 3 are already committed; CI's `generate:types` drift check will pass).

---

## Self-Review notes

- **Spec coverage:** JSON-LD entities → Tasks 5 (+8). Internal search → Task 6. Related/taxonomy UI → enabled by Task 6's `filterableAttributes: [..., 'keywords']` + the field in the REST API (web consumption is out of scope, stated up front). Shared-across-all-collections → Task 2 (field in shared group, auto-applies to all 11). Legacy guides consolidation → Task 7. No meta-keywords tag anywhere — confirmed.
- **Type consistency:** `normalizeKeywords`/`mergeKeywordSources` signatures are identical across Tasks 1/2/4/5/6/7. `seo.keywords` path string is identical in the field, the component, dispatch, and search. The JSON-LD property name `keywords` matches in `article.ts`, `web-page.ts`, and both tests.
- **Storage choice:** `json` (not `array`) is deliberate and matches `alternates`/`customTags` — avoids the hidden-group array-row-registry problem and keeps the migration to one jsonb column per table.
