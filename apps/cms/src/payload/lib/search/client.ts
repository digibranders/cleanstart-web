/**
 * Minimal Meilisearch HTTP client.
 *
 * Wraps the four endpoints we use — index documents, delete a
 * document, update index settings, run a search — directly via
 * fetch. Avoids pulling the full Meilisearch SDK as a dep when our
 * surface is this narrow.
 *
 * When `MEILISEARCH_URL` is unset, every operation resolves to a
 * `{ skipped: true }` no-op. That lets indexing hooks fire safely
 * in dev / offline / pre-prod boots without any feature flag at the
 * call site.
 */

export type SearchOpResult =
  | { ok: true; skipped: false; status: number }
  | { ok: true; skipped: true; reason: 'not-configured' }
  | { ok: false; skipped: false; status: number; error: string };

export interface SearchClientConfig {
  /** Base URL of the Meilisearch instance (no trailing slash). */
  url?: string | null;
  /** Admin API key (used for indexing + settings). */
  apiKey?: string | null;
  /** Optional `fetch` injection — tests pass a mock. */
  fetch?: typeof fetch;
  /** Optional logger — defaults to a noop. */
  logger?: { warn?: (msg: string, meta?: unknown) => void };
}

export interface SearchDocument {
  /** Unique-per-index ID. We compose it as `<collection>:<docId>`. */
  readonly id: string;
  readonly [key: string]: unknown;
}

export interface IndexSettings {
  searchableAttributes?: readonly string[];
  filterableAttributes?: readonly string[];
  sortableAttributes?: readonly string[];
  rankingRules?: readonly string[];
  stopWords?: readonly string[];
  synonyms?: Record<string, readonly string[]>;
  typoTolerance?: {
    enabled?: boolean;
    minWordSizeForTypos?: { oneTypo?: number; twoTypos?: number };
  };
  /** Primary key for the index. Set once at index creation. */
  primaryKey?: string;
}

export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
}

export interface SearchClient {
  readonly enabled: boolean;
  upsertDocuments: (
    indexUid: string,
    docs: readonly SearchDocument[],
  ) => Promise<SearchOpResult>;
  deleteDocument: (indexUid: string, id: string) => Promise<SearchOpResult>;
  updateSettings: (indexUid: string, settings: IndexSettings) => Promise<SearchOpResult>;
  getStats: (indexUid: string) => Promise<IndexStats | null>;
  search: (
    indexUid: string,
    query: string,
    opts?: { limit?: number; filter?: string; sort?: readonly string[] },
  ) => Promise<{ hits: unknown[]; estimatedTotalHits: number; processingTimeMs: number } | null>;
}

const trimTrailingSlash = (s: string): string => (s.endsWith('/') ? s.slice(0, -1) : s);

/**
 * Build a SearchClient. Returns a no-op client when url/apiKey are
 * missing — indexing hooks always invoke through the same shape.
 */
export const createSearchClient = (config: SearchClientConfig): SearchClient => {
  const url = config.url?.trim() ? trimTrailingSlash(config.url.trim()) : null;
  const apiKey = config.apiKey?.trim() || null;
  const enabled = url != null && apiKey != null;
  const f = config.fetch ?? globalThis.fetch;
  const warn = config.logger?.warn ?? (() => undefined);

  if (!enabled) {
    return {
      enabled: false,
      upsertDocuments: async () => ({ ok: true, skipped: true, reason: 'not-configured' }),
      deleteDocument: async () => ({ ok: true, skipped: true, reason: 'not-configured' }),
      updateSettings: async () => ({ ok: true, skipped: true, reason: 'not-configured' }),
      getStats: async () => null,
      search: async () => null,
    };
  }

  const baseUrl: string = url;
  const key: string = apiKey;
  const headers = (): Record<string, string> => ({
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  });

  const request = async (
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<SearchOpResult> => {
    try {
      const res = await f(`${baseUrl}${path}`, {
        method,
        headers: headers(),
        ...(body == null ? {} : { body: JSON.stringify(body) }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        warn('meilisearch request failed', { method, path, status: res.status, body: text });
        return { ok: false, skipped: false, status: res.status, error: text };
      }
      return { ok: true, skipped: false, status: res.status };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      warn('meilisearch request threw', { method, path, error });
      return { ok: false, skipped: false, status: 0, error };
    }
  };

  return {
    enabled: true,
    upsertDocuments: (indexUid, docs) =>
      request('POST', `/indexes/${encodeURIComponent(indexUid)}/documents`, docs),
    deleteDocument: (indexUid, id) =>
      request(
        'DELETE',
        `/indexes/${encodeURIComponent(indexUid)}/documents/${encodeURIComponent(id)}`,
      ),
    updateSettings: (indexUid, settings) =>
      request('PATCH', `/indexes/${encodeURIComponent(indexUid)}/settings`, settings),
    getStats: async (indexUid): Promise<IndexStats | null> => {
      try {
        const res = await f(`${baseUrl}/indexes/${encodeURIComponent(indexUid)}/stats`, {
          method: 'GET',
          headers: headers(),
        });
        if (!res.ok) return null;
        return (await res.json().catch(() => null)) as IndexStats | null;
      } catch {
        return null;
      }
    },
    search: async (indexUid, query, opts) => {
      const res = await f(`${baseUrl}/indexes/${encodeURIComponent(indexUid)}/search`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          q: query,
          limit: opts?.limit ?? 20,
          ...(opts?.filter ? { filter: opts.filter } : {}),
          ...(opts?.sort ? { sort: opts.sort } : {}),
        }),
      }).catch(() => null);
      if (!res || !res.ok) return null;
      return (await res.json().catch(() => null)) as Awaited<
        ReturnType<SearchClient['search']>
      >;
    },
  };
};

/**
 * Build the singleton config from `process.env`. Centralised so
 * test code can override and runtime code stays declarative.
 */
export const searchClientConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): SearchClientConfig => ({
  url: env.MEILISEARCH_URL ?? null,
  apiKey: env.MEILISEARCH_API_KEY ?? null,
});
