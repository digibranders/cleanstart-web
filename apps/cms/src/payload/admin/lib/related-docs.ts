'use client';

/**
 * Batched, deduped resolver for "the docs this relationship points at".
 *
 * Both the list-view `RelationshipCell` and the edit-view
 * `RelationshipField` need the same thing: turn a handful of ids into
 * display titles. Both used to do it with one `GET /api/{collection}/{id}`
 * per id, which is an N+1 measured in HTTP round-trips:
 *
 *   Blogs list, 25 rows × (1 author + 2 categories) → ~75 authenticated
 *   REST calls fired from the browser after hydration, each re-running
 *   access control and hitting Postgres on a pool that also has to serve
 *   the page the editor is waiting on.
 *
 * Worse, `/api/blogs/{id}` returns the whole document — including the
 * Lexical `body` — to render a one-line title.
 *
 * This module fixes both halves:
 *
 *   - ids queued within the same tick are coalesced into one
 *     `?where[id][in]=…` request per collection (75 calls → 3);
 *   - `select` trims the response to the fields the caller actually
 *     renders, so article bodies stay on the server;
 *   - resolved docs and in-flight requests are cached module-wide, so a
 *     list page where 25 rows share one author fetches it once rather
 *     than stampeding 25 parallel requests past a cache that nothing has
 *     populated yet.
 */

/** Ids per `where[id][in]` request. Keeps the query string well under
 *  any proxy's URL limit while still collapsing a full list page into
 *  one round-trip per collection. */
const CHUNK_SIZE = 100;

export interface RelatedDocsOptions {
  /** Relationship depth for the fetched docs. Default 0 (ids only). */
  readonly depth?: 0 | 1;
  /**
   * Field names to return. Unknown names are ignored by Payload's select
   * sanitizer, so a caller can pass the union of every collection's title
   * fields without knowing which collection it is about to hit.
   * Omit to fetch whole documents (rarely what you want).
   */
  readonly select?: readonly string[];
}

export type RelatedDoc = Record<string, unknown>;

/** Cache buckets are keyed by request shape so a depth-0 title-only read
 *  can't serve a caller that needs depth-1 thumbs. */
const bucketKey = (opts: RelatedDocsOptions): string =>
  `${opts.depth ?? 0}|${(opts.select ?? []).join(',')}`;

/** `bucket:collection:id` → resolved doc, or null for "not readable". */
const cache = new Map<string, RelatedDoc | null>();
/** Same key space, holding the in-flight request so concurrent callers
 *  for the same id await one fetch instead of racing. */
const inFlight = new Map<string, Promise<RelatedDoc | null>>();

interface QueuedId {
  readonly key: string;
  readonly id: string;
  resolve: (doc: RelatedDoc | null) => void;
}

/** Pending ids awaiting the next flush, grouped by `bucket|collection`. */
const queues = new Map<string, { collection: string; opts: RelatedDocsOptions; items: QueuedId[] }>();
let flushScheduled = false;

const buildUrl = (
  collection: string,
  ids: readonly string[],
  opts: RelatedDocsOptions,
): string => {
  const url = new URL(`/api/${collection}`, window.location.origin);
  ids.forEach((id, idx) => {
    url.searchParams.set(`where[id][in][${idx}]`, id);
  });
  // Payload's default limit is 10 — without this a 25-row page silently
  // resolves only the first ten ids and renders raw ids for the rest.
  url.searchParams.set('limit', String(ids.length));
  url.searchParams.set('depth', String(opts.depth ?? 0));
  url.searchParams.set('pagination', 'false');
  for (const field of opts.select ?? []) {
    url.searchParams.set(`select[${field}]`, 'true');
  }
  return url.toString();
};

const fetchOneById = async (
  collection: string,
  id: string,
  opts: RelatedDocsOptions,
): Promise<RelatedDoc | null> => {
  try {
    const url = new URL(`/api/${collection}/${id}`, window.location.origin);
    url.searchParams.set('depth', String(opts.depth ?? 0));
    for (const field of opts.select ?? []) {
      url.searchParams.set(`select[${field}]`, 'true');
    }
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as RelatedDoc;
  } catch {
    return null;
  }
};

/**
 * Resolve one chunk. A whole-batch failure (a malformed id 400s the
 * query for every id beside it) degrades to per-id fetches rather than
 * blanking every cell in the column.
 */
const fetchChunk = async (
  collection: string,
  ids: readonly string[],
  opts: RelatedDocsOptions,
): Promise<Map<string, RelatedDoc>> => {
  const out = new Map<string, RelatedDoc>();
  try {
    const res = await fetch(buildUrl(collection, ids, opts), { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { docs?: RelatedDoc[] };
    for (const doc of json.docs ?? []) {
      const id = doc?.id;
      if (id != null) out.set(String(id), doc);
    }
    return out;
  } catch {
    const settled = await Promise.all(
      ids.map(async (id) => [id, await fetchOneById(collection, id, opts)] as const),
    );
    for (const [id, doc] of settled) {
      if (doc) out.set(id, doc);
    }
    return out;
  }
};

const flush = (): void => {
  flushScheduled = false;
  const pending = Array.from(queues.values());
  queues.clear();

  for (const { collection, opts, items } of pending) {
    // De-dupe within the batch: the same id queued from three cells is
    // one entry on the wire and three resolved promises.
    const byId = new Map<string, QueuedId[]>();
    for (const item of items) {
      const existing = byId.get(item.id);
      if (existing) existing.push(item);
      else byId.set(item.id, [item]);
    }
    const ids = Array.from(byId.keys());

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      void fetchChunk(collection, chunk, opts).then((docs) => {
        for (const id of chunk) {
          const doc = docs.get(id) ?? null;
          for (const waiter of byId.get(id) ?? []) {
            cache.set(waiter.key, doc);
            inFlight.delete(waiter.key);
            waiter.resolve(doc);
          }
        }
      });
    }
  }
};

const enqueue = (
  collection: string,
  id: string,
  key: string,
  opts: RelatedDocsOptions,
): Promise<RelatedDoc | null> => {
  const queueKey = `${bucketKey(opts)}|${collection}`;
  let queue = queues.get(queueKey);
  if (!queue) {
    queue = { collection, opts, items: [] };
    queues.set(queueKey, queue);
  }
  const promise = new Promise<RelatedDoc | null>((resolve) => {
    queue.items.push({ key, id, resolve });
  });
  if (!flushScheduled) {
    flushScheduled = true;
    // A microtask is enough to collect every cell/field that mounts in
    // the same commit, and keeps the request off the critical path of
    // React's render.
    queueMicrotask(flush);
  }
  return promise;
};

/**
 * Resolve `ids` in `collection`. Returns a map keyed by stringified id;
 * an id the current user cannot read (or that no longer exists) is
 * absent from the map, which callers render as the raw id.
 */
export const fetchRelatedDocs = async (
  collection: string,
  ids: readonly string[],
  opts: RelatedDocsOptions = {},
): Promise<Map<string, RelatedDoc>> => {
  const bucket = bucketKey(opts);
  const results = await Promise.all(
    ids.map(async (id) => {
      const key = `${bucket}:${collection}:${id}`;
      if (cache.has(key)) return [id, cache.get(key) ?? null] as const;
      const pending = inFlight.get(key);
      if (pending) return [id, await pending] as const;
      const promise = enqueue(collection, id, key, opts);
      inFlight.set(key, promise);
      return [id, await promise] as const;
    }),
  );

  const out = new Map<string, RelatedDoc>();
  for (const [id, doc] of results) {
    if (doc) out.set(id, doc);
  }
  return out;
};

/** Test-only — drop every cached doc and pending request. */
export const __resetRelatedDocsCacheForTests = (): void => {
  cache.clear();
  inFlight.clear();
  queues.clear();
  flushScheduled = false;
};
