import type { CollectionAfterChangeHook } from 'payload';

import { runAfterCommit } from '../lib/after-commit';
import { submitIndexNow } from '../lib/indexnow/submit';
import { docCanonicalUrl } from '../lib/jsonld/url';
import { isIndexingAllowed } from '../lib/seo-env';
import { readSiteBaseUrl } from '../lib/site-base-url';

/**
 * afterChange hook factory — pings IndexNow with the doc's canonical
 * URL on the first publish transition. The ping itself is scheduled past
 * the write transaction (see `runAfterCommit`) so it never sits inside
 * the editor's Publish request. Sibling to
 * `webhooksPublishAfterChangeHook` (same gate, different downstream).
 *
 * Only active when `INDEXNOW_KEY` is set in env. Without the key, the
 * hook short-circuits — keeps dev / staging quiet. Same fail-soft
 * contract: failures log but never throw.
 */
export const indexNowPublishAfterChangeHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    try {
      const previous = (previousDoc as { _status?: string } | undefined)?._status;
      const current = (doc as { _status?: string })._status;
      if (current !== 'published' || previous === 'published') return doc;

      // Never ping search engines off the production site (staging/preview),
      // even if an INDEXNOW_KEY is present.
      if (!isIndexingAllowed()) return doc;

      const key = process.env.INDEXNOW_KEY;
      if (!key) return doc;

      const baseUrl = await readSiteBaseUrl(req.payload);
      const url = docCanonicalUrl(
        baseUrl,
        collection,
        doc as { slug?: string | null; path?: string | null },
      );
      if (!url) return doc;

      // Pinging a search engine is not something the editor should wait
      // on — run it past the commit so Publish returns at DB speed.
      await runAfterCommit(
        async () => {
          const result = await submitIndexNow({ key, baseUrl, urls: [url] });
          if (result.kind === 'failed') {
            req.payload.logger?.warn?.(
              { collection, url, reason: result.reason },
              'indexnow.submit failed',
            );
          }
        },
        req.transactionID,
        // Deferred work no longer reaches the catch below, so it reports
        // through the same log line it always did.
        (err) => {
          req.payload.logger?.warn?.(
            {
              collection,
              error: err instanceof Error ? err.message : String(err),
            },
            'indexnow.afterChange threw',
          );
        },
      );
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          error: err instanceof Error ? err.message : String(err),
        },
        'indexnow.afterChange threw',
      );
    }
    return doc;
  };
