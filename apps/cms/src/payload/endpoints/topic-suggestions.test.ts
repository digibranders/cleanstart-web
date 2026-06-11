import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// Force the disabled-client path so no real Meilisearch / network call fires.
// `.env` / `.env.local` define MEILISEARCH_URL; blanking both makes
// `createSearchClient` resolve to a no-op (`enabled: false`) deterministically.
// vi.stubEnv handles the Node coercion quirk and unstubAllEnvs restores the
// originals afterwards, keeping the suite hermetic.
beforeEach(() => {
  vi.stubEnv('MEILISEARCH_URL', '');
  vi.stubEnv('MEILISEARCH_API_KEY', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('topicSuggestionsEndpoint', () => {
  it('403s for non-editors', async () => {
    const { status } = await call('http://x/api/topic-suggestions?q=s', null);
    expect(status).toBe(403);
  });

  it('returns empty suggestions (200) when Meilisearch is not configured', async () => {
    const { status, body } = await call('http://x/api/topic-suggestions?q=sbom', { role: 'editor' });
    expect(status).toBe(200);
    expect(body.suggestions).toEqual([]);
  });
});
