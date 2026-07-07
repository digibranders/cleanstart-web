import type { CollectionConfig } from 'payload';

import { buildExportEndpoint } from './export/build-export-endpoint';

/**
 * Content collections that get the generic "Export…" kebab-menu action.
 * `leads` and `partner-applications` are deliberately excluded — they
 * already have their own GDPR-audited export at `/export-csv`
 * (`export-leads-csv.ts` / `export-partners-csv.ts`) with hand-tailored
 * column flattening; folding them into this generic path is out of scope
 * (see docs/superpowers/specs/2026-07-07-list-export-design.md).
 */
export const EXPORTABLE_COLLECTION_SLUGS = [
  'blogs',
  'news',
  'guides',
  'case-studies',
  'knowledgeBase',
  'resources',
  'events',
  'webinars',
  'podcastEpisodes',
  'jobs',
  'pages',
  'aboutGalleries',
  'authors',
  'forms',
  'deal-registrations',
  'career-applications',
  'legalDocuments',
] as const;

const hasField = (fields: CollectionConfig['fields'], name: string): boolean =>
  fields.some((f) => 'name' in f && f.name === name);

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

  const dateField = hasField(collection.fields, 'publishedAt') ? 'publishedAt' : 'createdAt';
  const existingEndpoints = collection.endpoints === false ? [] : (collection.endpoints ?? []);

  return {
    ...collection,
    custom: { ...collection.custom, export: { enabled: true, dateField } },
    endpoints: [...existingEndpoints, buildExportEndpoint(collection.slug, { dateField })],
  };
};
