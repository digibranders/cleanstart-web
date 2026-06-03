/**
 * Map a Webflow item's lifecycle flags to the Payload `_status`.
 * Webflow drafts (and archived items) become CMS drafts; everything else
 * is published. Mirrors the source site's published/unpublished state
 * instead of force-publishing every imported row.
 */
export const webflowStatus = (row: Record<string, unknown>): 'draft' | 'published' => {
  const meta = row._meta as { isDraft?: boolean; isArchived?: boolean } | undefined;
  return meta?.isDraft === true || meta?.isArchived === true ? 'draft' : 'published';
};

/**
 * Jobs have a `hiringStatus` (open/closed) distinct from `_status`. On the
 * source site, filled/closed roles were kept unpublished (draft), so a
 * Webflow draft job maps to `hiringStatus: 'closed'`, a live one to `'open'`.
 */
export const webflowHiringStatus = (row: Record<string, unknown>): 'open' | 'closed' =>
  webflowStatus(row) === 'draft' ? 'closed' : 'open';
