/**
 * Map a Webflow item's lifecycle flags to the Payload `_status`.
 *
 * Webflow's API reports `isDraft: true` for the *staged* copy of an item, so a
 * live page that merely has "changes in draft" comes through the export with
 * `isDraft: true` AND a non-null `lastPublished`. Keying only on `isDraft`
 * (the original bug) silently demoted those live pages to CMS drafts on import,
 * 404-ing them on the new site. A non-null `lastPublished` means a published
 * version exists on the source, so only a never-published draft (`isDraft` with
 * no `lastPublished`) — or an archived item — maps to a CMS draft.
 */
interface WebflowMeta {
  isDraft?: boolean;
  isArchived?: boolean;
  lastPublished?: string | null;
}

const webflowMeta = (row: Record<string, unknown>): WebflowMeta | undefined =>
  row._meta as WebflowMeta | undefined;

export const webflowStatus = (row: Record<string, unknown>): 'draft' | 'published' => {
  const meta = webflowMeta(row);
  if (meta?.isArchived === true) return 'draft';
  if (meta?.isDraft === true && !meta.lastPublished) return 'draft';
  return 'published';
};

/**
 * Jobs have a `hiringStatus` (open/closed) distinct from `_status`. On the
 * source site, filled/closed roles were kept unpublished (draft), so the draft
 * flag is the open/closed signal regardless of publish history — this keys on
 * the raw `isDraft`/`isArchived` flags and intentionally diverges from
 * `webflowStatus` (a once-published-but-now-draft role stays closed).
 */
export const webflowHiringStatus = (row: Record<string, unknown>): 'open' | 'closed' => {
  const meta = webflowMeta(row);
  return meta?.isDraft === true || meta?.isArchived === true ? 'closed' : 'open';
};
