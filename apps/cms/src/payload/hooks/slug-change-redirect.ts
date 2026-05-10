import type { CollectionAfterChangeHook } from 'payload';

import { collectionUrlFromDoc } from '../lib/route-prefixes';

type SlugDoc = {
  slug?: string | null;
  path?: string | null;
  _status?: 'draft' | 'published' | string | null;
};

const computeRedirectSource = (
  collection: string,
  oldDoc: SlugDoc | undefined,
  nextDoc: SlugDoc,
): { from: string; to: string } | null => {
  // For Pages, the URL change is captured by the `path` field (which folds
  // in slug + parent chain). For everything else it's `prefix + slug`.
  const oldUrl = oldDoc ? collectionUrlFromDoc(collection, oldDoc) : null;
  const newUrl = collectionUrlFromDoc(collection, nextDoc);
  if (!oldUrl || !newUrl || oldUrl === newUrl) return null;

  const wasPublished = oldDoc?._status === 'published';
  const isPublished = nextDoc._status === 'published';
  if (!wasPublished && !isPublished) return null;

  return { from: oldUrl, to: newUrl };
};

/**
 * After-change hook for any publishable, slug-routed collection.
 *
 * - Auto-creates a `redirects` row when a published doc's URL changes.
 * - Idempotent: if a row already exists for the new `from`, the hook
 *   updates its `to` instead of creating a duplicate.
 * - Chain collapse: if other rows already point at the OLD URL as their
 *   `to`, rewrite them to the NEW URL so we never form a redirect chain
 *   (e.g. /a → /b → /c becomes /a → /c, /b → /c).
 * - Self-cycle guard: refuses to write a row where `from === to`.
 *
 * Ordering note: the primary `/old → /new` upsert runs FIRST, the
 * inbound chain-collapse runs SECOND. If chain-collapse fails partway
 * through, the primary redirect still serves /old → /new (the
 * intermediate chains stay one hop deeper than ideal but keep
 * resolving). The reverse ordering — chain-collapse first — would
 * leave /old as 404 if the primary upsert then failed, breaking
 * indexed URLs the moment an editor renamed a slug.
 */
export const slugChangeRedirectHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const change = computeRedirectSource(collection, previousDoc as SlugDoc, doc as SlugDoc);
    if (!change) return doc;
    if (change.from === change.to) return doc;

    const { payload } = req;

    // Step 1: upsert the primary /old → /new row. This is the load-bearing
    // write — losing it means /old returns 404 to the public site.
    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: change.from } },
      limit: 1,
      req,
      overrideAccess: true,
    });

    if (existing.docs.length > 0) {
      const existingDoc = existing.docs[0] as { id?: string | number };
      if (existingDoc?.id != null) {
        await payload.update({
          collection: 'redirects',
          id: existingDoc.id,
          data: { to: change.to, status: '301', source: 'slug-change' },
          req,
          overrideAccess: true,
        });
      }
    } else {
      await payload.create({
        collection: 'redirects',
        data: {
          from: change.from,
          to: change.to,
          status: '301',
          source: 'slug-change',
          notes: `Auto-created when ${collection} slug changed.`,
        },
        req,
        overrideAccess: true,
      });
    }

    // Step 2: chain-collapse. Rewrite existing rows whose `to` was the
    // old URL so they jump straight to the new URL. Wrapped in try/catch
    // so a transient failure here can't undo the primary redirect — the
    // worst case is an extra hop that the next slug-change pass cleans
    // up. We re-throw is suppressed because the parent doc save has
    // already committed by the time afterChange runs.
    try {
      const inboundChains = await payload.find({
        collection: 'redirects',
        where: { to: { equals: change.from } },
        limit: 100,
        req,
        overrideAccess: true,
      });
      for (const existingRow of inboundChains.docs) {
        const row = existingRow as { id?: string | number; from?: string };
        if (row.id == null) continue;
        if (row.from === change.to) {
          // Reverse-direction would create a self-cycle; delete the stale row.
          await payload.delete({
            collection: 'redirects',
            id: row.id,
            req,
            overrideAccess: true,
          });
          continue;
        }
        await payload.update({
          collection: 'redirects',
          id: row.id,
          data: { to: change.to },
          req,
          overrideAccess: true,
        });
      }
    } catch (error) {
      payload.logger?.warn?.(
        {
          err: error instanceof Error ? error.message : String(error),
          collection,
          from: change.from,
          to: change.to,
        },
        'slug-change-redirect: chain-collapse partial failure (primary redirect still in place)',
      );
    }

    return doc;
  };
