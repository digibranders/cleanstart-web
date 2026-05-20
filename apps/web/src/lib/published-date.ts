/**
 * Resolve the "publish date" the public site shows for a CMS doc.
 *
 * Precedence mirrors the JSON-LD dispatcher in apps/cms — News still
 * wins via `publicationDate`; everywhere else, an editor-set
 * `displayPublishedAt` overrides the system-stamped `publishedAt`.
 *
 *   publicationDate > displayPublishedAt > publishedAt > undefined
 *
 * `updatedAt` deliberately is NOT in the chain — the "publish date"
 * is the original-publication moment; "last updated" is a separate
 * concept rendered next to it in the byline (see `BlogDetailHero`).
 */
export type PublishDateDoc = {
  publicationDate?: string | null;
  displayPublishedAt?: string | null;
  publishedAt?: string | null;
};

export function effectivePublishedAt(
  doc: PublishDateDoc | null | undefined,
): string | undefined {
  if (!doc) return undefined;
  if (typeof doc.publicationDate === 'string' && doc.publicationDate.length > 0) {
    return doc.publicationDate;
  }
  if (
    typeof doc.displayPublishedAt === 'string' &&
    doc.displayPublishedAt.length > 0
  ) {
    return doc.displayPublishedAt;
  }
  if (typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0) {
    return doc.publishedAt;
  }
  return undefined;
}
