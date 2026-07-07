/**
 * Content collections that get the generic "Export…" kebab-menu action.
 * `leads` and `partner-applications` are deliberately excluded — they
 * already have their own GDPR-audited export at `/export-csv`
 * (`export-leads-csv.ts` / `export-partners-csv.ts`) with hand-tailored
 * column flattening; folding them into this generic path is out of scope
 * (see docs/superpowers/specs/2026-07-07-list-export-design.md).
 *
 * Deliberately isolated in its own module with zero imports: Payload
 * strips `collection.custom` and `collection.endpoints` from the client
 * config (`serverOnlyCollectionProperties` in
 * `payload/dist/collections/config/client.js`), so the admin-side list
 * chrome (`CmsListView.tsx` / `ExportDrawer.tsx`) cannot read
 * `custom.export.enabled` off `useConfig()` at runtime — it never
 * reaches the browser. Both the server-side `wireExportButton` and the
 * client-side list view import this same static slug list instead, so
 * "does this collection get an Export… action" has one source of truth
 * without either side needing a server-only Payload import.
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

export const isExportableCollection = (slug: string): boolean =>
  (EXPORTABLE_COLLECTION_SLUGS as readonly string[]).includes(slug);
