import type { CollectionConfig } from 'payload';

import { buildExportEndpoint } from './export/build-export-endpoint';
import { EXPORTABLE_COLLECTION_SLUGS } from './export/exportable-collections';

export { EXPORTABLE_COLLECTION_SLUGS };

const hasField = (fields: CollectionConfig['fields'], name: string): boolean =>
  fields.some((f) => 'name' in f && f.name === name);

/**
 * Collections whose canonical "when was this published" field isn't named
 * `publishedAt`. News uses `publicationDate` — see
 * `apps/cms/src/payload/fields/published-at.ts:25-27`. Checked before the
 * generic publishedAt/createdAt inference below.
 */
const DATE_FIELD_OVERRIDES: Readonly<Record<string, string>> = {
  news: 'publicationDate',
};

/**
 * Stamps `collection.custom.export = { enabled, dateField }` (read by
 * `ExportDrawer.tsx`/`CmsListView.tsx` via `useConfig()`) and registers the
 * shared `/export` endpoint, for every collection in
 * `EXPORTABLE_COLLECTION_SLUGS`. Mirrors the shape of `wireCustomListView`.
 */
export const wireExportButton = (collection: CollectionConfig): CollectionConfig => {
  if (!(EXPORTABLE_COLLECTION_SLUGS as readonly string[]).includes(collection.slug)) {
    return collection;
  }

  const dateField =
    DATE_FIELD_OVERRIDES[collection.slug] ??
    (hasField(collection.fields, 'publishedAt') ? 'publishedAt' : 'createdAt');
  const existingEndpoints = collection.endpoints === false ? [] : (collection.endpoints ?? []);

  return {
    ...collection,
    custom: { ...collection.custom, export: { enabled: true, dateField } },
    endpoints: [...existingEndpoints, buildExportEndpoint(collection.slug, { dateField })],
  };
};
