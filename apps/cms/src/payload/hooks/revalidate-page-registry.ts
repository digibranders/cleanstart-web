import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

import { revalidateWeb } from '../lib/web-revalidate';

export interface RegistryDocShape {
  path?: string | null;
  kind?: string | null;
}

/**
 * The real apps/web URL a pageRegistry row maps to, or null when there is
 * none to revalidate. `cms-template` rows carry a `[slug]` placeholder path
 * (e.g. /blogs/[slug]) — not a real URL — and detail pages compose schema from
 * their own document, so those rows never need a web revalidation.
 */
export const pageRegistryRevalidatePath = (doc: RegistryDocShape): string | null => {
  if (!doc.path || doc.path.length === 0) return null;
  if (doc.kind === 'cms-template') return null;
  return doc.path;
};

/**
 * afterChange — when a static/listing page's schema override changes, purge
 * that page's apps/web ISR cache so the new (or removed) override goes live
 * without waiting out the revalidate window (INV-2). Fail-soft: revalidateWeb
 * never throws and no-ops when WEB_REVALIDATE_* env vars are unset.
 */
export const revalidatePageRegistryHook: CollectionAfterChangeHook = async ({ doc, req }) => {
  const url = pageRegistryRevalidatePath(doc as RegistryDocShape);
  if (url) await revalidateWeb(req.payload, { paths: [url] });
  return doc;
};

/** afterDelete — removing a row drops its override; refresh the page. */
export const revalidatePageRegistryDeleteHook: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const url = pageRegistryRevalidatePath(doc as RegistryDocShape);
  if (url) await revalidateWeb(req.payload, { paths: [url] });
  return doc;
};
