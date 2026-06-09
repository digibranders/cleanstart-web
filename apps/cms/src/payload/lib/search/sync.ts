import {
  INDEX_UID,
  buildSearchDocument,
  buildSearchDocumentId,
  isIndexable,
  isSearchIndexedCollection,
} from './index-schema';
import {
  type SearchClient,
  createSearchClient,
  searchClientConfigFromEnv,
} from './client';
import { resolveSiteUrl } from '../site-url';

/**
 * Loose Payload subset we depend on. Keeps the sync layer easy to
 * mock in tests and decouples it from the full Payload type surface.
 *
 * Logger uses Pino's (meta, message) call shape — same convention
 * the lead endpoints already follow.
 */
interface SyncPayload {
  logger?: { warn?: (meta: Record<string, unknown>, msg: string) => void };
  // Narrowed to the one global we read so a real Payload instance
  // (whose findGlobal is overloaded over the GlobalSlug union)
  // assigns into this contract cleanly. Tests mock with vi.fn and
  // cast through `as unknown as`.
  findGlobal: (args: { slug: 'siteSettings' }) => Promise<unknown>;
}

/**
 * Module-level cached client. Built once per process from env;
 * stays as a no-op until MEILISEARCH_URL + MEILISEARCH_API_KEY are
 * both set. Tests can override via `__setSearchClientForTests`.
 */
let searchClient: SearchClient | null = null;

const getClient = (): SearchClient => {
  if (searchClient == null) {
    searchClient = createSearchClient(searchClientConfigFromEnv());
  }
  return searchClient;
};

/** Test-only override. Pass `null` to reset back to the env-derived client. */
export const __setSearchClientForTests = (client: SearchClient | null): void => {
  searchClient = client;
};

let cachedBaseUrl: string | null = null;

const readBaseUrl = async (payload: SyncPayload): Promise<string> => {
  if (cachedBaseUrl != null) return cachedBaseUrl;
  try {
    const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
      baseUrl?: string;
    };
    const url = resolveSiteUrl(settings.baseUrl);
    cachedBaseUrl = url;
    return url;
  } catch {
    return resolveSiteUrl();
  }
};

/** Test-only — clear the cached baseUrl between cases. */
export const __clearSyncCachesForTests = (): void => {
  cachedBaseUrl = null;
  searchClient = null;
};

/**
 * Push (or refresh) a document in the search index. Idempotent —
 * Meilisearch upsert semantics handle re-runs safely.
 *
 * No-op when the collection isn't search-indexed, the doc isn't
 * indexable (draft / noindex), or Meilisearch isn't configured.
 * Failures are logged but never thrown — search availability is
 * not allowed to gate a save.
 */
export const syncDocument = async (
  payload: SyncPayload,
  collection: string,
  doc: Record<string, unknown>,
): Promise<{ skipped: boolean; reason?: string }> => {
  if (!isSearchIndexedCollection(collection)) {
    return { skipped: true, reason: 'collection-not-indexed' };
  }
  const client = getClient();
  if (!client.enabled) return { skipped: true, reason: 'client-not-configured' };
  if (!isIndexable(doc)) {
    // Draft / noindex docs get explicitly removed so transitions
    // (publish → unpublish) aren't visible in search.
    return await dropDocument(payload, collection, doc.id as number | string | undefined);
  }

  const baseUrl = await readBaseUrl(payload);
  const searchDoc = buildSearchDocument(baseUrl, collection, doc);
  if (!searchDoc) return { skipped: true, reason: 'no-buildable-doc' };

  const result = await client.upsertDocuments(INDEX_UID, [searchDoc]);
  if ('skipped' in result && result.skipped === true) return { skipped: true };
  if (!result.ok) {
    payload.logger?.warn?.(
      {
        collection,
        id: searchDoc.id,
        status: result.status,
        error: result.error,
      },
      'search.upsert failed',
    );
    return { skipped: false, reason: 'upsert-failed' };
  }
  return { skipped: false };
};

/**
 * Remove a doc from the search index. Idempotent — Meilisearch
 * returns 202 even when the document doesn't exist.
 */
export const dropDocument = async (
  payload: SyncPayload,
  collection: string,
  id: number | string | undefined,
): Promise<{ skipped: boolean; reason?: string }> => {
  if (!isSearchIndexedCollection(collection)) {
    return { skipped: true, reason: 'collection-not-indexed' };
  }
  if (id == null) return { skipped: true, reason: 'no-id' };
  const client = getClient();
  if (!client.enabled) return { skipped: true, reason: 'client-not-configured' };

  const result = await client.deleteDocument(INDEX_UID, buildSearchDocumentId(collection, id));
  if ('skipped' in result && result.skipped === true) return { skipped: true };
  if (!result.ok) {
    payload.logger?.warn?.(
      {
        collection,
        id,
        status: result.status,
        error: result.error,
      },
      'search.delete failed',
    );
    return { skipped: false, reason: 'delete-failed' };
  }
  return { skipped: false };
};
