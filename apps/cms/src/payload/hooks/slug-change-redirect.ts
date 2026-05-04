import type { CollectionAfterChangeHook } from 'payload';

import { collectionUrlFromSlug } from '../lib/route-prefixes';

type SlugDoc = {
  slug?: string | null;
  _status?: 'draft' | 'published' | string | null;
};

/**
 * Returns the URL we'd redirect FROM, for a slug change on a published doc.
 * Returns null when no redirect should be created.
 */
const computeRedirectSource = (
  collection: string,
  oldDoc: SlugDoc | undefined,
  nextDoc: SlugDoc,
): { from: string; to: string } | null => {
  const oldSlug = oldDoc?.slug;
  const newSlug = nextDoc.slug;
  if (!oldSlug || !newSlug || oldSlug === newSlug) return null;

  const wasPublished = oldDoc?._status === 'published';
  const isPublished = nextDoc._status === 'published';
  if (!wasPublished && !isPublished) return null;

  const from = collectionUrlFromSlug(collection, oldSlug);
  const to = collectionUrlFromSlug(collection, newSlug);
  if (!from || !to) return null;
  return { from, to };
};

/**
 * After-change hook for any publishable, slug-routed collection. Auto-creates
 * a redirects row when a document's slug changes and the document is/was
 * published. Idempotent: if a row already exists for `from`, the hook updates
 * it to point at the latest `to` so chains never form.
 */
export const slugChangeRedirectHook =
  (collection: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    const change = computeRedirectSource(collection, previousDoc, doc as SlugDoc);
    if (!change) return doc;

    const { payload } = req;
    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: change.from } },
      limit: 1,
      req,
    });

    if (existing.docs.length > 0) {
      const existingDoc = existing.docs[0];
      if (existingDoc?.id != null) {
        await payload.update({
          collection: 'redirects',
          id: existingDoc.id,
          data: { to: change.to, status: '301', source: 'slug-change' },
          req,
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
      });
    }

    return doc;
  };

