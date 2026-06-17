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
    return json(
      { suggestions: facetToSuggestions(distribution, prefix, SUGGESTION_LIMIT) },
      { status: 200 },
    );
  },
};
