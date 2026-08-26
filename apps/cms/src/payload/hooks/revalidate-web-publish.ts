import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload';

import {
  SITEMAP_PATH,
  affectsSitemap,
  collectionUrlFromDoc,
  listingPathForCollection,
} from '../lib/route-prefixes';
import { revalidateWeb } from '../lib/web-revalidate';

type StatusDoc = { _status?: string; slug?: string | null; path?: string | null };

/**
 * afterChange hook factory — purges the apps/web ISR cache for the doc's
 * detail page + its listing whenever a *published* page is affected, so an
 * editor's publish/edit/unpublish goes live in seconds instead of waiting out
 * the 60 s ISR window.
 *
 * Fires when the doc is currently published OR was previously published, which
 * covers three cases that all change a rendered URL:
 *   - publish      (draft → published): the new page must appear.
 *   - edit-live     (published → published): the page content changed.
 *   - unpublish     (published → draft): the page must 404 / redirect.
 * A draft → draft edit touches no live URL and is skipped.
 *
 * Collections listed in the web sitemap also purge `/sitemap.xml`. That route
 * is prerendered, so without an explicit purge a newly published doc stays out
 * of the sitemap until the next deploy.
 *
 * On a slug change the previous URL is revalidated too (it becomes a redirect /
 * 404). Fail-soft: `revalidateWeb` never throws and no-ops when the
 * WEB_REVALIDATE_* env vars are unset, so this is inert in dev / staging.
 */
export const revalidateWebPublishAfterChangeHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    try {
      const current = (doc as StatusDoc)._status;
      const previous = (previousDoc as StatusDoc | undefined)?._status;
      if (current !== 'published' && previous !== 'published') return doc;

      const paths = new Set<string>();

      const listing = listingPathForCollection(collection);
      if (listing) paths.add(listing);

      const currentUrl = collectionUrlFromDoc(collection, doc as StatusDoc);
      if (currentUrl) paths.add(currentUrl);

      // The sitemap route is prerendered and would otherwise only pick this
      // doc up on the next deploy.
      if (affectsSitemap(collection)) paths.add(SITEMAP_PATH);

      // Slug change → the old URL also needs revalidating (now a redirect/404).
      const previousUrl = previousDoc
        ? collectionUrlFromDoc(collection, previousDoc as StatusDoc)
        : null;
      if (previousUrl) paths.add(previousUrl);

      if (paths.size === 0) return doc;

      await revalidateWeb(req.payload, { paths: Array.from(paths) });
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          error: err instanceof Error ? err.message : String(err),
        },
        'revalidate-web.afterChange threw',
      );
    }
    return doc;
  };

/**
 * afterDelete sibling — purges the deleted doc's detail page + its listing.
 * Same fail-soft contract as the afterChange hook above.
 */
export const revalidateWebAfterDeleteHook =
  (collection: string): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    try {
      const paths = new Set<string>();

      const listing = listingPathForCollection(collection);
      if (listing) paths.add(listing);

      const url = collectionUrlFromDoc(collection, doc as StatusDoc);
      if (url) paths.add(url);

      if (affectsSitemap(collection)) paths.add(SITEMAP_PATH);

      if (paths.size === 0) return doc;

      await revalidateWeb(req.payload, { paths: Array.from(paths) });
    } catch (err) {
      req.payload.logger?.warn?.(
        {
          collection,
          error: err instanceof Error ? err.message : String(err),
        },
        'revalidate-web.afterDelete threw',
      );
    }
    return doc;
  };
