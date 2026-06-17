# Unified "Keywords" Card (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Consolidate the SEO-sidebar keyword controls into one "Keywords" card — primary topic (`seo.keywordTarget`) with a revived density writing-aid, plus supporting topics (`seo.keywords`) as chips with Meilisearch-sourced autosuggest. Lower the cap to 10. No schema change.

**Architecture:** New `KeywordsField.tsx` folds in the dormant `KeywordTargetField` (density) and supersedes `SeoKeywordsField` (chips); both old files are deleted. A new admin endpoint `GET /api/topic-suggestions` serves distinct topics from the Meilisearch `keywords` facet (graceful-degrade to empty). Spec: `docs/superpowers/specs/2026-06-11-unified-keywords-card-design.md`.

**Tech Stack:** Payload 3.81 · Next 16 · React 19 · Vitest · Meilisearch · Zod · TypeScript strict.

---

## Task 1: Lower MAX_KEYWORDS 20 → 10

**Files:**
- Modify: `apps/cms/src/payload/lib/seo/keywords.ts`
- Modify: `apps/cms/src/payload/lib/seo/keywords.test.ts`

- [ ] **Step 1: Update the test** — in `keywords.test.ts`, the test `'caps the total number of keywords'` already references `MAX_KEYWORDS` symbolically, so it stays valid. Add an explicit-value assertion so the cap can't silently drift. After the existing `MAX_KEYWORDS` import-based tests, add:

```ts
  it('caps at 10 keywords (the recommended hard ceiling)', () => {
    expect(MAX_KEYWORDS).toBe(10);
  });
```

- [ ] **Step 2: Run it, expect FAIL** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/keywords.test.ts -t "caps at 10"` → FAIL (`MAX_KEYWORDS` is 20).

- [ ] **Step 3: Change the constant** — in `keywords.ts`:

```ts
/** Max keywords stored per document. Beyond this is stuffing, not signal. */
export const MAX_KEYWORDS = 10;
```

- [ ] **Step 4: Run the suite, expect PASS** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/keywords.test.ts` → all green (the "caps the total number" test uses `MAX_KEYWORDS + 10` symbolically, still valid).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/seo/keywords.ts apps/cms/src/payload/lib/seo/keywords.test.ts
git commit -m "feat(cms): lower keyword hard cap to 10"
```

---

## Task 2: `facetToSuggestions` pure transform (TDD)

**Files:**
- Create: `apps/cms/src/payload/lib/seo/topic-suggestions.ts`
- Test: `apps/cms/src/payload/lib/seo/topic-suggestions.test.ts`

- [ ] **Step 1: Write the failing test** — create `topic-suggestions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { facetToSuggestions } from './topic-suggestions';

describe('facetToSuggestions', () => {
  const dist = { SBOM: 12, FIPS: 8, 'FIPS 140-3': 3, SCA: 5 };

  it('returns [] for undefined distribution', () => {
    expect(facetToSuggestions(undefined, '', 10)).toEqual([]);
  });

  it('sorts by count desc, then value asc, and caps at limit', () => {
    expect(facetToSuggestions(dist, '', 2)).toEqual([
      { value: 'SBOM', count: 12 },
      { value: 'FIPS', count: 8 },
    ]);
  });

  it('filters case-insensitively by substring', () => {
    expect(facetToSuggestions(dist, 'fips', 10)).toEqual([
      { value: 'FIPS', count: 8 },
      { value: 'FIPS 140-3', count: 3 },
    ]);
  });

  it('empty prefix returns everything (sorted)', () => {
    expect(facetToSuggestions(dist, '   ', 10).map((s) => s.value)).toEqual([
      'SBOM',
      'FIPS',
      'SCA',
      'FIPS 140-3',
    ]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/topic-suggestions.test.ts` → `Cannot find module`.

- [ ] **Step 3: Implement** — create `topic-suggestions.ts`:

```ts
/**
 * Transform a Meilisearch facet distribution (`{ term: count }`) for the
 * `keywords` attribute into ranked autosuggest options for the SEO
 * "Keywords" card. Substring match (case-insensitive) on the typed
 * prefix; ranked by popularity (count) then alphabetically.
 */
export interface TopicSuggestion {
  readonly value: string;
  readonly count: number;
}

export const facetToSuggestions = (
  distribution: Record<string, number> | undefined,
  prefix: string,
  limit: number,
): TopicSuggestion[] => {
  if (!distribution) return [];
  const needle = prefix.trim().toLocaleLowerCase();
  return Object.entries(distribution)
    .filter(([term]) => needle.length === 0 || term.toLocaleLowerCase().includes(needle))
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, Math.max(0, limit));
};
```

- [ ] **Step 4: Run, expect PASS** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/topic-suggestions.test.ts` → green.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/seo/topic-suggestions.ts apps/cms/src/payload/lib/seo/topic-suggestions.test.ts
git commit -m "feat(cms): facetToSuggestions transform for topic autosuggest"
```

---

## Task 3: Extend the search client with `facets` / `facetDistribution`

**Files:**
- Modify: `apps/cms/src/payload/lib/search/client.ts`
- Modify: `apps/cms/src/payload/lib/search/client.test.ts`

- [ ] **Step 1: Add a failing test** — in `client.test.ts`, mirror the existing `search` test harness (read the file's top for how it builds a client with a mock `fetch`). Add:

```ts
  it('forwards facets and returns facetDistribution', async () => {
    let sentBody: Record<string, unknown> = {};
    const fetchMock = (async (_url: string, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body ?? '{}'));
      return new Response(
        JSON.stringify({
          hits: [],
          estimatedTotalHits: 0,
          processingTimeMs: 1,
          facetDistribution: { keywords: { SBOM: 4 } },
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const client = createSearchClient({ url: 'http://meili.test', apiKey: 'k', fetch: fetchMock });
    const res = await client.search('content', '', { limit: 0, facets: ['keywords'] });
    expect(sentBody.facets).toEqual(['keywords']);
    expect(res?.facetDistribution?.keywords).toEqual({ SBOM: 4 });
  });
```

- [ ] **Step 2: Run, expect FAIL** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/search/client.test.ts -t "facetDistribution"` → FAIL (`facets` not forwarded / type error).

- [ ] **Step 3: Extend the interface and impl** — in `client.ts`:

In the `SearchClient` interface, update the `search` opts and return type:

```ts
  search: (
    indexUid: string,
    query: string,
    opts?: {
      limit?: number;
      filter?: string;
      sort?: readonly string[];
      facets?: readonly string[];
      attributesToRetrieve?: readonly string[];
    },
  ) => Promise<{
    hits: unknown[];
    estimatedTotalHits: number;
    processingTimeMs: number;
    facetDistribution?: Record<string, Record<string, number>>;
  } | null>;
```

In the implementation's `search` body, forward `facets` (add alongside the existing `filter`/`sort` spreads):

```ts
        body: JSON.stringify({
          q: query,
          limit: opts?.limit ?? 20,
          ...(opts?.filter ? { filter: opts.filter } : {}),
          ...(opts?.sort ? { sort: opts.sort } : {}),
          ...(opts?.facets ? { facets: opts.facets } : {}),
          ...(opts?.attributesToRetrieve
            ? { attributesToRetrieve: opts.attributesToRetrieve }
            : {}),
        }),
```

The no-op (disabled) client's `search: async () => null` is unchanged and still type-compatible.

- [ ] **Step 4: Run, expect PASS** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/search/` → all green.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm --filter @cleanstart/cms exec tsc --noEmit
git add apps/cms/src/payload/lib/search/client.ts apps/cms/src/payload/lib/search/client.test.ts
git commit -m "feat(cms): search client supports facets + facetDistribution"
```

---

## Task 4: `topic-suggestions` admin endpoint

**Files:**
- Create: `apps/cms/src/payload/endpoints/topic-suggestions.ts`
- Test: `apps/cms/src/payload/endpoints/topic-suggestions.test.ts`
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Write the failing test** — create `topic-suggestions.test.ts` (mirror `canonical-check.test.ts` structure — read it for how it builds a fake `req` and asserts on the `Response`):

```ts
import { describe, expect, it } from 'vitest';

import { topicSuggestionsEndpoint } from './topic-suggestions';

const call = async (
  url: string,
  user: { role?: string } | null,
): Promise<{ status: number; body: { suggestions?: unknown; error?: string } }> => {
  const res = await (topicSuggestionsEndpoint.handler as (req: unknown) => Promise<Response>)({
    url,
    user,
    headers: new Headers(),
  });
  return { status: res.status, body: await res.json() };
};

describe('topicSuggestionsEndpoint', () => {
  it('403s for non-editors', async () => {
    const { status } = await call('http://x/api/topic-suggestions?q=s', null);
    expect(status).toBe(403);
  });

  it('returns empty suggestions (200) when Meilisearch is not configured', async () => {
    // No MEILISEARCH_URL in the test env → disabled client → [].
    const { status, body } = await call('http://x/api/topic-suggestions?q=sbom', { role: 'editor' });
    expect(status).toBe(200);
    expect(body.suggestions).toEqual([]);
  });
});
```

> If the repo's test env defines `MEILISEARCH_URL`, the second test would hit a real client — guard it: set `delete process.env.MEILISEARCH_URL` in a `beforeEach`/`afterEach` within this file, or assert the shape (`Array.isArray(body.suggestions)`) instead of exact `[]`. Match whatever `canonical-check.test.ts` does for env isolation.

- [ ] **Step 2: Run, expect FAIL** — `Cannot find module './topic-suggestions'`.

- [ ] **Step 3: Implement the endpoint** — create `topic-suggestions.ts` (model on `canonical-check.ts`):

```ts
import type { Endpoint } from 'payload';
import { z } from 'zod';

import { createSearchClient, searchClientConfigFromEnv } from '../lib/search/client';
import { INDEX_UID } from '../lib/search/index-schema';
import { facetToSuggestions } from '../lib/seo/topic-suggestions';

const SUGGESTION_LIMIT = 15;

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const hasEditorRole = (user: { role?: string | null } | null | undefined): boolean =>
  user?.role === 'admin' || user?.role === 'editor';

const querySchema = z.object({ q: z.string().max(80).optional() });

/**
 * GET /api/topic-suggestions?q=<prefix>
 *
 * Editor-only autosuggest for the SEO "Keywords" card. Sources distinct
 * topics from the Meilisearch `keywords` facet distribution, ranked by
 * popularity. Degrades to an empty list (never 5xx) when search is not
 * configured or unreachable — the card stays usable without hints.
 */
export const topicSuggestionsEndpoint: Endpoint = {
  path: '/topic-suggestions',
  method: 'get',
  handler: async (req) => {
    if (!hasEditorRole(req.user as { role?: string } | null)) {
      return json({ suggestions: [], error: 'forbidden' }, { status: 403 });
    }
    const parsed = new URL(req.url ?? '', 'http://internal');
    const validation = querySchema.safeParse({ q: parsed.searchParams.get('q') ?? undefined });
    if (!validation.success) {
      return json({ suggestions: [] }, { status: 400 });
    }
    const prefix = validation.data.q ?? '';

    const client = createSearchClient(searchClientConfigFromEnv());
    if (!client.enabled) {
      return json({ suggestions: [] }, { status: 200 });
    }
    const result = await client.search(INDEX_UID, '', { limit: 0, facets: ['keywords'] });
    const distribution = result?.facetDistribution?.keywords;
    return json({ suggestions: facetToSuggestions(distribution, prefix, SUGGESTION_LIMIT) }, {
      status: 200,
    });
  },
};
```

- [ ] **Step 4: Register it** — in `apps/cms/src/payload.config.ts`, add the import next to the other endpoint imports:

```ts
import { topicSuggestionsEndpoint } from './payload/endpoints/topic-suggestions';
```

and add `topicSuggestionsEndpoint` to the `endpoints: [ ... ]` array (find the array where `canonicalCheckEndpoint` is listed and add it there).

- [ ] **Step 5: Run, expect PASS** — `pnpm --filter @cleanstart/cms exec vitest run src/payload/endpoints/topic-suggestions.test.ts` → green.

- [ ] **Step 6: Typecheck, lint, commit**

```bash
pnpm --filter @cleanstart/cms exec tsc --noEmit
pnpm --filter @cleanstart/cms lint
git add apps/cms/src/payload/endpoints/topic-suggestions.ts apps/cms/src/payload/endpoints/topic-suggestions.test.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): topic-suggestions admin endpoint (Meili facet, graceful degrade)"
```

---

## Task 5: Unified `KeywordsField.tsx`, mount swap, delete old components

**Files:**
- Create: `apps/cms/src/payload/admin/components/KeywordsField.tsx`
- Modify: `apps/cms/src/payload/fields/seo.ts` (swap the `seoKeywords` mount)
- Delete: `apps/cms/src/payload/admin/components/SeoKeywordsField.tsx`
- Delete: `apps/cms/src/payload/admin/components/KeywordTargetField.tsx`
- Regenerate: `apps/cms/src/app/(payload)/admin/importMap.js`

- [ ] **Step 1: Create the unified component** — create `KeywordsField.tsx`:

```tsx
'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { collectPlainText, extractFromLexical } from '../../lib/lexical-extract';
import {
  type DensityBand,
  type HeadingExtract,
  scoreKeywordDensity,
} from '../../lib/seo/keyword-density';
import { MAX_KEYWORDS, normalizeKeywords } from '../../lib/seo/keywords';
import type { TopicSuggestion } from '../../lib/seo/topic-suggestions';

type KeywordsFieldProps = {
  titleSource?: string;
  descriptionSource?: string;
};

const RECOMMENDED_MAX = 5;

const BAND_TONE: Record<DensityBand, string> = {
  absent: '#a4a7af',
  light: '#f0c45a',
  good: '#7ddc9c',
  overused: '#f08f8f',
};
const BAND_LABEL: Record<DensityBand, string> = {
  absent: 'Not in body',
  light: 'Light',
  good: 'Good',
  overused: 'Overused',
};

const sectionLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--theme-text-soft, #a4a7af)',
  marginBottom: 4,
};
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--theme-text-disabled, #6b6e77)',
  margin: '0 0 6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
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
const readoutChipStyle: React.CSSProperties = { ...chipStyle, padding: '3px 8px' };
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
const suggestBoxStyle: React.CSSProperties = {
  marginTop: 4,
  border: '1px solid var(--theme-elevation-150, #2a2c33)',
  borderRadius: 4,
  background: 'var(--theme-elevation-50, #1c1d21)',
  overflow: 'hidden',
};
const suggestItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  background: 'transparent',
  border: 'none',
  color: 'var(--theme-text, #e8e9eb)',
  cursor: 'pointer',
  textAlign: 'left',
};

/**
 * Unified SEO "Keywords" card. Two sections:
 *  - Primary topic — `seo.keywordTarget` + a live coverage readout
 *    (body density, presence in title/desc/H2-H3/lead). Writing aid.
 *  - Supporting topics — `seo.keywords` chip list (string[] json) with
 *    autosuggest sourced from the Meilisearch `keywords` facet.
 * Supersedes the former KeywordTargetField + SeoKeywordsField.
 */
export const KeywordsField = (props: KeywordsFieldProps): ReactElement => {
  const { titleSource = 'title', descriptionSource = 'abstract' } = props;
  const primaryId = useId();
  const supportingId = useId();

  // Primary topic + density
  const { value: keyword, setValue: setKeyword } = useField<string>({ path: 'seo.keywordTarget' });
  const { value: body } = useField<unknown>({ path: 'body' });
  const { value: docTitle } = useField<string>({ path: titleSource });
  const { value: seoTitle } = useField<string>({ path: 'seo.title' });
  const { value: seoDesc } = useField<string>({ path: 'seo.description' });
  const { value: sourceDesc } = useField<string>({ path: descriptionSource });

  const density = useMemo(() => {
    if (!keyword || keyword.trim().length === 0) return null;
    const summary = extractFromLexical(body);
    const headings: HeadingExtract[] = summary.headings.map((h) => ({
      level: h.level as HeadingExtract['level'],
      text: h.text,
    }));
    return scoreKeywordDensity({
      keyword,
      bodyText: collectPlainText(body),
      title: seoTitle?.trim() || docTitle?.trim() || null,
      description: seoDesc?.trim() || sourceDesc?.trim() || null,
      headings,
    });
  }, [keyword, body, seoTitle, docTitle, seoDesc, sourceDesc]);

  // Supporting topics
  const { value: topicsValue, setValue: setTopics } = useField<string[] | null>({
    path: 'seo.keywords',
  });
  const topics = useMemo(() => (Array.isArray(topicsValue) ? topicsValue : []), [topicsValue]);
  const [pending, setPending] = useState('');

  const commitTopics = useCallback(
    (next: string[]) => {
      const cleaned = normalizeKeywords(next);
      setTopics(cleaned.length > 0 ? cleaned : null);
    },
    [setTopics],
  );
  const addText = useCallback(
    (text: string) => {
      const parts = text.split(',');
      if (parts.every((p) => p.trim().length === 0)) return;
      commitTopics([...topics, ...parts]);
      setPending('');
    },
    [topics, commitTopics],
  );
  const removeTopic = useCallback(
    (kw: string) => commitTopics(topics.filter((k) => k !== kw)),
    [topics, commitTopics],
  );

  const atCap = topics.length >= MAX_KEYWORDS;
  const overRecommended = topics.length > RECOMMENDED_MAX;

  // Autosuggest (debounced; degrades silently)
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/topic-suggestions?q=${encodeURIComponent(pending.trim())}`,
          { credentials: 'include' },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { suggestions?: TopicSuggestion[] };
        const selected = new Set(topics.map((t) => t.toLocaleLowerCase()));
        setSuggestions(
          (data.suggestions ?? []).filter((s) => !selected.has(s.value.toLocaleLowerCase())),
        );
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [pending, topics, focused]);

  return (
    <div className="field-type keywords-field" style={{ marginBottom: 'var(--cs-space-3, 12px)' }}>
      {/* Primary topic */}
      <label htmlFor={primaryId} style={sectionLabelStyle}>
        Primary topic
      </label>
      <input
        id={primaryId}
        type="text"
        value={keyword ?? ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setKeyword(e.target.value === '' ? null : e.target.value)
        }
        placeholder="e.g. SBOM signing"
        style={{ ...inputStyle, marginBottom: 6 }}
      />
      {density ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <span style={{ ...readoutChipStyle, color: BAND_TONE[density.band] }}>
            Body · {density.bodyDensity}% ({BAND_LABEL[density.band]})
          </span>
          <span style={{ ...readoutChipStyle, color: density.titleOccurrences > 0 ? '#7ddc9c' : '#f0c45a' }}>
            Title · {density.titleOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.descriptionOccurrences > 0 ? '#7ddc9c' : '#f0c45a' }}>
            Desc · {density.descriptionOccurrences > 0 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.inH2OrH3 ? '#7ddc9c' : '#f0c45a' }}>
            H2/H3 · {density.inH2OrH3 ? '✓' : '✗'}
          </span>
          <span style={{ ...readoutChipStyle, color: density.inFirst100Words ? '#7ddc9c' : '#f0c45a' }}>
            Lead · {density.inFirst100Words ? '✓' : '✗'}
          </span>
        </div>
      ) : (
        <p style={hintStyle}>Set a primary topic to see coverage (writing aid — not a ranking lever).</p>
      )}

      {/* Supporting topics */}
      <label htmlFor={supportingId} style={sectionLabelStyle}>
        Supporting topics{' '}
        <span style={{ color: overRecommended ? '#f0c45a' : 'var(--theme-text-disabled, #6b6e77)' }}>
          · {topics.length}/{MAX_KEYWORDS} ({overRecommended ? 'aim for 3–5' : '3–5 recommended'})
        </span>
      </label>

      {topics.length > 0 && (
        <ul
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', margin: '0 0 6px', padding: 0 }}
        >
          {topics.map((kw) => (
            <li key={kw} style={chipStyle}>
              <span>{kw}</span>
              <button type="button" onClick={() => removeTopic(kw)} aria-label={`Remove ${kw}`} style={removeBtnStyle}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={supportingId}
          type="text"
          value={pending}
          disabled={atCap}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPending(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addText(pending);
            }
          }}
          placeholder={atCap ? `Max ${MAX_KEYWORDS} topics` : 'type or pick a topic…'}
          style={inputStyle}
        />
        <button type="button" onClick={() => addText(pending)} disabled={atCap || pending.trim() === ''} style={addBtnStyle}>
          Add
        </button>
      </div>

      {focused && !atCap && suggestions.length > 0 && (
        <div style={suggestBoxStyle}>
          {suggestions.map((s) => (
            <button
              key={s.value}
              type="button"
              // onMouseDown (not onClick) so it fires before the input's blur.
              onMouseDown={(e) => {
                e.preventDefault();
                addText(s.value);
              }}
              style={suggestItemStyle}
            >
              <span>{s.value}</span>
              <span style={{ color: 'var(--theme-text-disabled, #6b6e77)' }}>{s.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Swap the mount** — in `apps/cms/src/payload/fields/seo.ts`, find the `seoSidebarFields()` entry with `name: 'seoKeywords'` (mounts `SeoKeywordsField.tsx`) and replace it with:

```ts
    {
      // Unified Keywords card — primary topic (keywordTarget) + density
      // writing-aid, plus supporting topics (seo.keywords) chips with
      // autosuggest. Sits in the "what indexes / entities" cluster.
      name: 'keywords',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/KeywordsField.tsx#KeywordsField',
            clientProps: { titleSource, descriptionSource },
          },
        },
      },
    },
```

(`titleSource` and `descriptionSource` are already destructured at the top of `seoSidebarFields`.)

- [ ] **Step 3: Delete the superseded components**

```bash
git rm apps/cms/src/payload/admin/components/SeoKeywordsField.tsx apps/cms/src/payload/admin/components/KeywordTargetField.tsx
```

- [ ] **Step 4: Regenerate the importMap — USE THE NPM SCRIPT, NOT `exec payload`**

```bash
pnpm --filter @cleanstart/cms generate:importmap
```

> CRITICAL: do NOT run `pnpm --filter @cleanstart/cms exec payload generate:importmap` — under `exec`, the config's `GENERATING_IMPORT_MAP` argv check evaluates false and silently strips the 7 forward-compat field paths. After the npm-script regen, `git diff` the importMap and confirm the ONLY changes are: removed `SeoKeywordsField` import+entry, removed `KeywordTargetField` import+entry (if it was registered), added `KeywordsField` import+entry. No `PointField`/`RadioField`/`CodeField`/etc. lines should disappear. If they do, `git checkout HEAD -- "apps/cms/src/app/(payload)/admin/importMap.js"` and rerun the npm script.

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm --filter @cleanstart/cms exec tsc --noEmit
pnpm --filter @cleanstart/cms lint
```

Both PASS. (The `KeywordTargetField`/`SeoKeywordsField` deletions must leave no dangling imports — grep `grep -rn "KeywordTargetField\|SeoKeywordsField" apps/cms/src` returns nothing but the importMap which you just regenerated, and the historical comment in `seo.ts` line ~401/415 referencing `keywordTarget`/`KeywordTargetField` — update those two comments to point at `KeywordsField` so they don't dangle.)

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/admin/components/KeywordsField.tsx apps/cms/src/payload/fields/seo.ts "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): unified Keywords sidebar card (primary topic + density + topics + autosuggest)"
```

---

## Task 6: Verification gate

- [ ] **Step 1: Full checks**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/seo/ src/payload/lib/search/ src/payload/endpoints/topic-suggestions.test.ts
pnpm --filter @cleanstart/cms build
```

All green.

- [ ] **Step 2: Drift checks** — both produce no diff:

```bash
pnpm --filter @cleanstart/cms generate:types && git status --porcelain apps/cms/src/payload-types.ts
pnpm --filter @cleanstart/cms generate:importmap && git status --porcelain "apps/cms/src/app/(payload)/admin/importMap.js"
```

- [ ] **Step 3: No dangling references**

```bash
grep -rn "KeywordTargetField\|SeoKeywordsField" apps/cms/src --include="*.ts" --include="*.tsx"
```

Expect: no matches (importMap is .js and already regenerated). If a comment in `seo.ts` still references the old names, fix it and amend.

---

## Self-Review

- **Spec coverage:** unified card (Task 5), reuse keywordTarget+density (Task 5), supporting topics chips (Task 5), autosuggest (Tasks 2–5), cap→10 (Task 1), no schema change (verified — only UI/endpoint/lib), graceful degrade (Task 4). ✓
- **Type consistency:** `TopicSuggestion` shape identical across `topic-suggestions.ts`, the endpoint, and the component. `facets`/`facetDistribution` names match across client interface, impl, endpoint. `MAX_KEYWORDS` consumed symbolically everywhere.
- **Deletions safe:** `keyword-density.ts` (kept) is the only shared dep of the deleted `KeywordTargetField`; `KeywordsField` imports it. No other consumer of the deleted files (verified in Task 6 grep).
