/**
 * Curated default column selections for `ExportDrawer`'s field picker,
 * keyed by collection slug. Where a collection has no entry here, the
 * drawer falls back to the generic heuristic (displayed table columns ∪
 * "always useful" field names ∪ first-5) — see `ExportDrawer.tsx`'s
 * open-transition `useEffect`. Client-safe: no server-side Payload
 * imports, mirrors the `export-date-preset.ts` sibling.
 *
 * `_status` is the real field name Payload's versions/drafts system adds
 * to a collection's field list (`payload/dist/versions/baseFields.js`,
 * `baseVersionFields`) — confirmed present for `blogs`, which has
 * `versions: { drafts: {...} }` enabled.
 */
export const CURATED_DEFAULT_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  blogs: [
    'title',
    'slug',
    'abstract',
    'heroImage',
    'authors',
    'reviewedBy',
    'categories',
    '__schemaTypes',
    'publishedAt',
    'seoTitle',
    'seoDescription',
    'seoIndexable',
    'canonicalUrl',
    'socialCard',
    'wordCount',
    'updatedAt',
    'createdAt',
    '_status',
  ],
  'deal-registrations': [
    'partnerName',
    'partnerRepFirstName',
    'partnerRepLastName',
    'partnerRepEmail',
    'partnerRepPhone',
    'prospectFirstName',
    'prospectLastName',
    'prospectEmail',
    'prospectPhone',
    'dealDetails',
    'source',
    'hubspotSync',
    'updatedAt',
    'createdAt',
  ],
};

/**
 * Resolves the curated default columns for a collection, intersected
 * with the field names actually present in its exportable-field list —
 * so a stale/renamed curated entry never tries to preselect a checkbox
 * that doesn't exist. Returns `null` when the collection has no curated
 * list, letting the caller fall through to the generic heuristic.
 */
export const resolveCuratedDefaultColumns = (
  collectionSlug: string,
  exportableFieldNames: ReadonlySet<string>,
): string[] | null => {
  const curated = CURATED_DEFAULT_COLUMNS[collectionSlug];
  if (!curated) return null;
  const intersected = curated.filter((name) => exportableFieldNames.has(name));
  return intersected.length > 0 ? intersected : null;
};
