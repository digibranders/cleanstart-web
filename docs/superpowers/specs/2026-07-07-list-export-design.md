# List-page export (CSV / XLSX) — design

Date: 2026-07-07
Status: approved
Scope: `apps/cms`

## Problem

Editors have no way to pull CMS content out into a spreadsheet. There's ad hoc
prior art (`export-leads-csv.ts`, `export-partners-csv.ts`) but every other
list page has nothing.

## Goal

An "Export" action on every content-collection list page that lets an editor:

- pick a date range (applied to a per-collection date field),
- pick which fields/columns to include,
- pick CSV or a real `.xlsx` workbook,
- export rows that also respect whatever search/filter is currently applied
  on that list view,

without editing 20 collection files by hand.

## Scope — which collections get it

Content collections only, added via an explicit allow-list (not "every
collection", not implicit):

```
blogs, news, guides, case-studies, knowledgeBase, resources, events,
webinars, podcastEpisodes, jobs, pages, aboutGalleries, authors,
leads, forms, partner-applications, deal-registrations,
career-applications, legalDocuments
```

Explicitly excluded: `users`, `media`, `integrations`, taxonomy lookup
collections (`industries`, `regions`, `departments`, `resourceTypes`,
`pressTypes`, `webinarTypes`, `categories`, `newsCategories`,
`knowledgeCategories`, `jobLocations`), and ops/logging collections
(`audit-log`, `searchLog`, `consentLog`, `analyticsCache`,
`webhooks_dead_letter`, `previewAudit`, `redirects`, `brokenLinks`,
`pageRegistry`, `resumes`).

The allow-list lives as a single exported constant
(`EXPORTABLE_COLLECTION_SLUGS`) in the new `wireExportButton.ts` so adding a
future collection to export is a one-line change.

## Architecture

Reuses the existing `wire*(collection) => collection` config-injection
pattern already used for `wireCustomListView`, `wirePublishGate`, etc.
(`apps/cms/src/payload.config.ts`, the `.map()` chain around line 417-421).

### 1. Config wiring — `apps/cms/src/payload/lib/wire-export-button.ts`

```ts
export const EXPORTABLE_COLLECTION_SLUGS = [/* list above */] as const

export function wireExportButton(collection: CollectionConfig): CollectionConfig {
  if (!EXPORTABLE_COLLECTION_SLUGS.includes(collection.slug)) return collection
  const dateField = collection.fields.some(f => 'name' in f && f.name === 'publishedAt')
    ? 'publishedAt'
    : 'createdAt'
  return {
    ...collection,
    custom: { ...collection.custom, export: { enabled: true, dateField } },
    endpoints: [...(collection.endpoints ?? []), buildExportEndpoint(collection.slug, { dateField })],
  }
}
```

Added to the `.map()` chain after `wireCustomListView`.

### 2. Admin UI

- `apps/cms/src/payload/admin/components/views/list/ExportButton.tsx` — reads
  `collection.custom.export` via `useConfig()` (data-layer only). Renders
  nothing if `enabled` is falsy. Placed inside `ListHeader.tsx` next to the
  existing "Views"/"..." controls.
- `apps/cms/src/payload/admin/components/views/list/ExportModal.tsx` — built
  on `@cleanstart/ui`'s `Dialog`. Contents:
  - Date range: two `DateTimePicker` fields (from/to), optional (empty =
    unbounded).
  - Field picker: checklist built from the collection's field list
    (`useConfig()` — sanitized client config already includes field
    name/label/type, no per-collection hardcoding). Relationship, richText,
    upload, array/group/block fields are included with a serialization note
    (see below); fields the user has no read access to are already absent
    from the sanitized client config, so the picker never offers a field
    the export endpoint would 403 on.
  - Format: CSV / XLSX radio, default CSV.
  - On submit: reads current list state from `useListQuery()` (`where`,
    `search`, `sort`) and does a `window.location.assign` to
    `/api/{slug}/export?format=&from=&to=&fields=&where=&search=&sort=`
    (a GET, so the browser just downloads the file — no fetch/blob
    plumbing needed).

### 3. Backend — shared export endpoint factory

`apps/cms/src/payload/lib/export/build-export-endpoint.ts`:

```ts
export function buildExportEndpoint(slug: string, opts: { dateField: string }): Endpoint
```

- Registered as a **collection-level** endpoint at `/export` (single path
  segment — per the documented rule that 3+-segment config-level endpoints
  404 under this Payload REST router; collection endpoints don't have that
  problem, matching `integrations-actions.ts`).
- Query params validated with Zod at the boundary:
  `format: 'csv' | 'xlsx'`, `from?: ISO date`, `to?: ISO date`,
  `fields: comma-separated field paths (required, min 1)`,
  `where?: JSON (same shape the list view already sends)`,
  `search?: string`, `sort?: string`.
- Builds the effective `where`: `{ and: [clientWhere, dateRangeCondition] }`
  where `dateRangeCondition` uses `opts.dateField` with `greater_than_equal`
  / `less_than_equal` from `from`/`to` when present.
- Runs `payload.find({ collection: slug, where, sort, depth: 1, ...pagination, overrideAccess: false, user: req.user })`
  — **not** `overrideAccess: true` — so the collection's own read access
  control is enforced exactly as it is for the list view itself. No new
  privilege is created by this feature.
- Paginates with the same `CSV_EXPORT_PAGE_SIZE` / `CSV_EXPORT_HARD_CAP_PAGES`
  constants `export-leads-csv.ts` already defines (moved to a shared
  location); if the hard cap is hit, the response still downloads
  successfully with a **truncation notice row** appended, matching current
  behavior — never a silent partial export.
- Serializes each requested field via
  `apps/cms/src/payload/lib/export/serialize-field.ts`
  (new): relationships → related doc's `title`/`name`/slug field (whichever
  exists) instead of a raw ID; lexical richText → plain-text extract (reuses
  whatever plain-text-from-lexical helper already backs `bodyStatsHook`'s
  word count, rather than writing a second one); dates → ISO string;
  arrays/groups/blocks → `JSON.stringify`; everything else → `String(value)`.
  Every string cell goes through the same formula-injection guard
  `lib/csv.ts` already applies (leading `=`, `+`, `-`, `@`).
- CSV branch calls the existing `toCsv` (`lib/csv.ts`) unchanged.
- XLSX branch calls new `apps/cms/src/payload/lib/xlsx.ts`
  (`toXlsx(rows, columns): Buffer`, built on the new `exceljs` dependency —
  the only new package this feature adds), with the same formula-injection
  guard applied to string cells before they're written.

### 4. Existing Leads / Partner-Applications export endpoints

`export-leads-csv.ts` and `export-partners-csv.ts` are refactored to call
the same `buildExportEndpoint`/`serialize-field` machinery instead of their
own bespoke pagination + CSV loop, so there is one export code path in the
codebase, not two. Any Leads-specific behavior (e.g. PII handling) is
preserved by passing collection-specific options into the shared factory,
not by keeping a separate implementation.

## Error handling

- Missing/invalid `fields` param → 400 with a Zod-derived message.
- `from` after `to` → 400.
- No read access to the collection → 403 (via Payload's own access control,
  not a hand-rolled check).
- Hard row cap reached → 200 with truncation notice row, not an error.

## Testing

- Vitest, co-located:
  - `serialize-field.test.ts` — one case per field-type branch.
  - `xlsx.test.ts` — write then read back via `exceljs`, assert cell values
    and formula-injection guard.
  - `build-export-endpoint.test.ts` — date-range merge into `where`,
    access-control enforcement (mocked unauthenticated/low-role user gets
    403), row cap truncation behavior.
- Playwright e2e, tagged `@phase-j-export`, in
  `apps/cms/tests/e2e/`: open the modal on one representative collection
  (`blogs`), pick a date range + 2 fields, export CSV, then XLSX; assert the
  download fires with the right filename and content-type for each.

## Out of scope

- Background/async export jobs — not needed at current data volumes (all
  collections are tens-to-low-hundreds of rows per the codebase survey).
- Export scheduling / recurring exports.
- Import (the reverse direction).
