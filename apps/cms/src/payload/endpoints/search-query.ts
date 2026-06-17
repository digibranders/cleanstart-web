import type { Endpoint } from 'payload';
import { z } from 'zod';

import {
  type SearchClient,
  createSearchClient,
  searchClientConfigFromEnv,
} from '../lib/search/client';
import { INDEX_UID, SEARCH_INDEXED_COLLECTIONS } from '../lib/search/index-schema';

const QUERY_MAX_LEN = 100;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

/**
 * Fields each hit carries back to the caller. Deliberately excludes the
 * heavy `body` attribute (indexed for relevance, up to 50 KB) — the public
 * search UI only needs enough to render a result row and a link.
 */
export const SEARCH_RESULT_FIELDS = [
  'id',
  'collection',
  'title',
  'description',
  'slug',
  'url',
  'categories',
] as const;

const searchParamsSchema = z.object({
  q: z.string().trim().min(1).max(QUERY_MAX_LEN),
  collection: z.enum(SEARCH_INDEXED_COLLECTIONS as unknown as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).catch(DEFAULT_LIMIT),
});

export type ParsedSearchParams = z.infer<typeof searchParamsSchema>;

export const parseSearchParams = (
  searchParams: URLSearchParams,
):
  | { ok: true; data: ParsedSearchParams }
  | { ok: false; error: string } => {
  const parsed = searchParamsSchema.safeParse({
    q: searchParams.get('q') ?? '',
    ...(searchParams.get('collection')
      ? { collection: searchParams.get('collection') }
      : {}),
    ...(searchParams.get('limit') ? { limit: searchParams.get('limit') } : {}),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.path[0] === 'q' ? 'query_required' : 'invalid_params' };
  }
  return { ok: true, data: parsed.data };
};

/**
 * Meilisearch filter expression. Always restricts to published content;
 * an optional collection narrows to one content type. The collection
 * value is validated against the indexed-collection allow-list above, so
 * it can never be attacker-controlled free text.
 */
export const buildContentFilter = (collection?: string): string => {
  const clauses = ['isPublished = true'];
  if (collection) clauses.push(`collection = '${collection}'`);
  return clauses.join(' AND ');
};

export interface SearchResultHit {
  id: string;
  collection: string;
  title: string;
  description: string;
  slug?: string;
  url?: string;
  categories: string[];
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

/** Reduce a raw Meilisearch hit to the trimmed wire shape. */
export const mapSearchHit = (raw: unknown): SearchResultHit | null => {
  if (raw == null || typeof raw !== 'object') return null;
  const hit = raw as Record<string, unknown>;
  const id = asString(hit.id);
  const collection = asString(hit.collection);
  const title = asString(hit.title);
  if (!id || !collection || !title) return null;
  const slug = asString(hit.slug);
  const url = asString(hit.url);
  return {
    id,
    collection,
    title,
    description: typeof hit.description === 'string' ? hit.description : '',
    ...(slug ? { slug } : {}),
    ...(url ? { url } : {}),
    categories: Array.isArray(hit.categories)
      ? hit.categories.filter((c): c is string => typeof c === 'string')
      : [],
  };
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

let cachedClient: SearchClient | null = null;
const getClient = (): SearchClient => {
  if (cachedClient == null) {
    cachedClient = createSearchClient(searchClientConfigFromEnv());
  }
  return cachedClient;
};

/** Test-only override. Pass `null` to reset back to the env-derived client. */
export const __setSearchClientForTests = (client: SearchClient | null): void => {
  cachedClient = client;
};

/**
 * GET /api/search?q=<query>&collection=<slug>&limit=<n>
 *
 * Public, read-only full-text search over the cross-collection `content`
 * index. Returns only published documents. The marketing site's command
 * palette calls this through its own same-origin route handler, so the
 * caller here is the web server, not the browser — per-IP rate limiting
 * would throttle every visitor as one IP, so it is intentionally omitted;
 * the query length and result-limit caps bound the cost instead.
 *
 * When Meilisearch is unconfigured (no `MEILISEARCH_URL`), the client is a
 * no-op that returns `null`, and this endpoint degrades to empty results
 * rather than erroring — search stays available-but-empty rather than 500.
 */
export const searchQueryEndpoint: Endpoint = {
  path: '/search',
  method: 'get',
  handler: async (req) => {
    const url = new URL(req.url ?? '', 'http://internal');
    const parsed = parseSearchParams(url.searchParams);
    if (!parsed.ok) {
      return json({ ok: false, error: parsed.error, hits: [] }, 400);
    }

    const { q, collection, limit } = parsed.data;
    const result = await getClient().search(INDEX_UID, q, {
      limit,
      filter: buildContentFilter(collection),
      attributesToRetrieve: SEARCH_RESULT_FIELDS,
    });

    if (result == null) {
      return json({ ok: true, hits: [], estimatedTotalHits: 0 });
    }

    const hits = result.hits
      .map(mapSearchHit)
      .filter((h): h is SearchResultHit => h !== null);

    return json({ ok: true, hits, estimatedTotalHits: result.estimatedTotalHits });
  },
};
