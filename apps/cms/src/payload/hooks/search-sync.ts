import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

import { runAfterCommit } from '../lib/after-commit';
import { dropDocument, syncDocument } from '../lib/search/sync';

/**
 * afterChange hook — pushes the saved doc into the search index
 * (or removes it if it transitions to draft / noindex). Always
 * returns the doc unchanged; search failures are logged but never
 * thrown so they cannot block a publish.
 */
export const searchSyncAfterChangeHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    try {
      // Indexing runs past the commit: a save must not wait on
      // Meilisearch, and a doc pushed from inside the transaction would
      // be indexed from a database state no other connection can see.
      // The nightly drift check re-syncs anything this misses.
      await runAfterCommit(
        () => syncDocument(req.payload, collection, doc as Record<string, unknown>),
        req.transactionID,
        // Deferred work no longer reaches the catch below, so it reports
        // through the same log line it always did.
        (err) => {
          req.payload.logger?.warn?.(
            {
              collection,
              error: err instanceof Error ? err.message : String(err),
            },
            'search.afterChange threw',
          );
        },
      );
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          error: err instanceof Error ? err.message : String(err),
        },
        'search.afterChange threw',
      );
    }
    return doc;
  };

/**
 * afterDelete hook — pulls the doc out of the search index when
 * an editor deletes it from Payload. Same fail-soft contract as
 * afterChange.
 */
export const searchSyncAfterDeleteHook =
  (collection: string): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    try {
      await runAfterCommit(
        () => dropDocument(req.payload, collection, id as number | string),
        req.transactionID,
        (err) => {
          req.payload.logger?.warn?.(
            {
              collection,
              id,
              error: err instanceof Error ? err.message : String(err),
            },
            'search.afterDelete threw',
          );
        },
      );
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          id,
          error: err instanceof Error ? err.message : String(err),
        },
        'search.afterDelete threw',
      );
    }
  };
