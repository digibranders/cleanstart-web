import type { CollectionAfterChangeHook, Payload } from 'payload';

import { submitIndexNow } from '../lib/indexnow/submit';
import { docCanonicalUrl } from '../lib/jsonld/url';
import { resolveSiteUrl } from '../lib/site-url';

const readBaseUrl = async (payload: Payload): Promise<string> => {
  const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as {
    baseUrl?: string;
  };
  return resolveSiteUrl(settings.baseUrl);
};

/**
 * afterChange hook factory — pings IndexNow with the doc's canonical
 * URL on the first publish transition. Sibling to
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

      const key = process.env.INDEXNOW_KEY;
      if (!key) return doc;

      const baseUrl = await readBaseUrl(req.payload);
      const url = docCanonicalUrl(
        baseUrl,
        collection,
        doc as { slug?: string | null; path?: string | null },
      );
      if (!url) return doc;

      const result = await submitIndexNow({ key, baseUrl, urls: [url] });
      if (result.kind === 'failed') {
        req.payload.logger?.warn?.(
          { collection, url, reason: result.reason },
          'indexnow.submit failed',
        );
      }
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
