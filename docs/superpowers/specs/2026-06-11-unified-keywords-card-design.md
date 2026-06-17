# Unified "Keywords" Card — Phase 1 Design Spec

**Date:** 2026-06-11
**Status:** Approved (design), ready for implementation plan
**Context:** Follows the `seo.keywords` feature (shipped). Phase 1 of the keywords-capability improvement decided in the senior SEO/UX review. Phase 2 (controlled-vocabulary `terms` collection, glossary hub pages, DefinedTerm/sameAs, auto-linking) is a separate spec — out of scope here.

## Goal

Consolidate the keyword controls in the CMS editor SEO sidebar into one coherent **"Keywords"** card: a **primary topic** (with a writing-aid coverage readout) plus **supporting topics** (chips with autosuggest). Reduce vocabulary fragmentation and editor confusion, and stop the field being a low-signal afterthought — without a schema change.

## Decisions locked (from brainstorming)

1. **Primary topic = reuse the existing `seo.keywordTarget` field** (a dormant single-string field, defined but never mounted). It becomes "Primary topic" with the **revived density readout** (`scoreKeywordDensity`) as an honest writing aid (not a ranking lever).
2. **Supporting topics = the existing `seo.keywords` field** (string[] json). Rendered as chips.
3. **Autosuggest is in Phase 1** — typeahead on the supporting-topics input, sourced from already-used topics across the content index (Meilisearch facet distribution), to converge vocabulary.
4. **No schema change, no migration.** Both `seo.keywordTarget` and `seo.keywords` already exist.

## Architecture

### Component: `KeywordsField.tsx` (new, replaces the `seoKeywords` mount)

One sidebar card titled **"Keywords"** with two sections:

- **Primary topic** — text input bound to `seo.keywordTarget` + the coverage readout (folded in from the dormant `KeywordTargetField.tsx`): body density % with band, and presence chips for Title / Description / H2-H3 / first-100-words, computed via the existing `scoreKeywordDensity` (`lib/seo/keyword-density.ts`) + `extractFromLexical`/`collectPlainText` (`lib/lexical-extract.ts`). Labeled "writing aid."
- **Supporting topics** — chip list bound to `seo.keywords` (folded in from `SeoKeywordsField.tsx`): add via Enter / comma / paste-split, remove by value, dedupe via `normalizeKeywords`. Plus an **autosuggest dropdown** (see endpoint). Guidance: "3–5 recommended." Soft amber cue when count > 5; hard cap **10** (lowered from 20).

The component reads/writes via `useField` (hook only — repo's `@payloadcms/ui` data-layer rule). It receives the same `clientProps` the current `seoKeywords` entry needs for the density sources (`titleSource`, `descriptionSource`).

**Files folded in & removed:** `KeywordTargetField.tsx` (dead, logic moves here) and `SeoKeywordsField.tsx` (superseded) are deleted; `lib/seo/keyword-density.ts` stays (consumed by the new card).

### Endpoint: `GET /api/topic-suggestions?q=<prefix>`

- New `topicSuggestionsEndpoint` (`payload/endpoints/topic-suggestions.ts`), registered in `payload.config.ts` endpoints array. Path `/topic-suggestions` (1 segment — clears the 3-segment-404 gotcha). Method `get`. Auth: admin or editor (`req.user.role` check, mirroring `canonical-check.ts`). Zod-validated `q` (optional string, ≤ 80 chars).
- Sources distinct topics from **Meilisearch facet distribution**: calls the search client with `facets: ['keywords']`, reads `facetDistribution.keywords` (`{ term: count }`), filters by case-insensitive prefix on `q`, sorts by count desc then alpha, returns top 15 as `{ suggestions: [{ value, count }] }`.
- **Graceful degrade:** when Meili is not configured or the call fails, returns `{ suggestions: [] }` (HTTP 200). The card still works without hints.

### Search client extension

`lib/search/client.ts` `search()` gains an optional `facets?: readonly string[]` opt and its return type gains `facetDistribution?: Record<string, Record<string, number>>`. Meilisearch returns `facetDistribution` when `facets` is passed. Backward-compatible (optional field).

### Pure transform (TDD seam)

`facetToSuggestions(distribution: Record<string, number> | undefined, prefix: string, limit: number): { value: string; count: number }[]` in `lib/seo/topic-suggestions.ts` — prefix filter (case-insensitive), sort by count desc then value asc, slice to `limit`. Unit-tested in isolation; the endpoint is a thin wrapper around it.

### Cap change

`MAX_KEYWORDS` 20 → **10** in `lib/seo/keywords.ts`. All three read-paths (field hook, dispatch, search) already consume the constant, so they stay consistent. 10 (not 5) avoids truncating legacy guides that carried up to 10 keywords; the 3–5 guidance + amber cue live in the UI. Update the cap test.

## Data flow

```
Editor types primary topic → seo.keywordTarget (string) → density readout (client-side, scoreKeywordDensity)
Editor adds supporting topic → normalizeKeywords → seo.keywords (string[] json)
Editor focuses topic input → GET /api/topic-suggestions?q=… → Meili facet → dropdown
(unchanged) seo.keywords → JSON-LD keywords+mentions, Meilisearch searchable+filterable facet
```

## Error handling

- Endpoint: Zod-reject bad `q` (400); forbid non-editors (403); Meili failure → empty suggestions (200, never 5xx for a hint).
- Component: autosuggest fetch failures are swallowed (no dropdown); the field remains fully usable offline. Cap/dedupe enforced client + on-save.

## Testing

- `topic-suggestions.ts` `facetToSuggestions` — unit tests (prefix filter, sort by count then alpha, limit, empty/undefined input). TDD.
- `keywords.test.ts` — update `MAX_KEYWORDS` assertion to 10.
- `topic-suggestions` endpoint — handler smoke test (forbidden without editor; empty suggestions when Meili off; shape with a stubbed client), mirroring `canonical-check.test.ts`.
- `client.ts` — extend an existing search test (or add one) asserting `facets` is forwarded and `facetDistribution` returned.
- `KeywordsField.tsx` — no unit test (UI); must compile + lint. Visual check post-build.

## Out of scope (Phase 2)

`terms`/`topics` controlled-vocabulary collection, `/glossary` or `/topics/<slug>` hub pages, DefinedTerm/sameAs entity emission, auto internal-linking, cannibalization detection. The free-text topics captured now become Phase 2's seed corpus.
