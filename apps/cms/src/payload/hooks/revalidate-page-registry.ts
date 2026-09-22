import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

import { revalidateWebAfterCommit } from '../lib/web-revalidate';

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
 * The apps/web data-cache tag for one route's registry read. Must match
 * `pageRegistryTag` in apps/web/src/lib/page-registry.ts exactly.
 *
 * The path alone is not enough: `revalidatePath` purges the rendered route,
 * but the re-render is served the registry fetch from the data cache, which
 * runs on a 24h window. Without this tag a new row or a changed override can
 * take a day to appear on the page, which is the thing this hook exists to
 * prevent.
 */
export const pageRegistryCacheTag = (path: string): string => `page-registry:${path}`;

/**
 * afterChange — when a static/listing page's schema override changes, purge
 * that page's apps/web ISR cache AND the registry read behind it, so the new
 * (or removed) override goes live without waiting out either window (INV-2).
 * Fail-soft: revalidateWeb never throws and no-ops when WEB_REVALIDATE_* env
 * vars are unset.
 */
export const revalidatePageRegistryHook: CollectionAfterChangeHook = async ({ doc, req }) => {
  const url = pageRegistryRevalidatePath(doc as RegistryDocShape);
  if (url) {
    await revalidateWebAfterCommit(
      req.payload,
      { paths: [url], tags: [pageRegistryCacheTag(url)] },
      req.transactionID,
    );
  }
  return doc;
};

/** afterDelete — removing a row drops its override; refresh the page. */
export const revalidatePageRegistryDeleteHook: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const url = pageRegistryRevalidatePath(doc as RegistryDocShape);
  if (url) {
    await revalidateWebAfterCommit(
      req.payload,
      { paths: [url], tags: [pageRegistryCacheTag(url)] },
      req.transactionID,
    );
  }
  return doc;
};
