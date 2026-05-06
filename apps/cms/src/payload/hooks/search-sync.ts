import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

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
      await syncDocument(req.payload, collection, doc as Record<string, unknown>);
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
      await dropDocument(req.payload, collection, id as number | string);
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
