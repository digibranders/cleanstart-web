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
forms, deal-registrations, career-applications, legalDocuments
```

Explicitly excluded: `users`, `media`, `integrations`, taxonomy lookup
collections (`industries`, `regions`, `departments`, `resourceTypes`,
`pressTypes`, `webinarTypes`, `categories`, `newsCategories`,
`knowledgeCategories`, `jobLocations`), ops/logging collections
(`audit-log`, `searchLog`, `consentLog`, `analyticsCache`,
`webhooks_dead_letter`, `previewAudit`, `redirects`, `brokenLinks`,
`pageRegistry`, `resumes`), and **`leads` / `partner-applications`** —
both already have a working, GDPR-audited export (`export-leads-csv.ts`,
`export-partners-csv.ts` at `/export-csv`) with hand-tailored column
flattening (UTM/consent/audit joins). Reworking those onto the new generic
serializer is out of scope for this change (see "Out of scope"); their
existing export UI stays as-is.

A global field denylist (`EXPORT_FIELD_DENYLIST = ['ip', 'userAgent']`)
applies across every collection the new exporter serves — those fields are
never offered in the field picker and are rejected server-side even if
requested directly, so no collection can leak visitor PII through this path
even if such a field is added to its schema later.

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

**As shipped, two refinements beyond this sketch:** (1) `EXPORTABLE_COLLECTION_SLUGS`
lives in the separate `exportable-collections.ts` module described in the
Admin UI section below, and `wire-export-button.ts` imports/re-exports it;
(2) the `dateField` inference has one override — `news` has no `publishedAt`
field (it uses `publicationDate`, see `apps/cms/src/payload/fields/published-at.ts:25-27`),
so a small `DATE_FIELD_OVERRIDES` map is checked before the
`publishedAt`-or-`createdAt` fallback.

### 2. Admin UI

`CmsListView.tsx` already owns a kebab ("...") `DropdownMenu` with a
"Columns…" item that opens a `Drawer` (`ColumnPicker.tsx` inside it) — this
is the established pattern for list-view side-panel UI, not a modal
`Dialog`. The export feature reuses it exactly:

- In `CmsListView.tsx`'s `menuItems` list, add an `"Export…"` item —
  conditionally, only when `isExportableCollection(collectionSlug)` is true.
  **Correction from an earlier draft of this doc:** the item is *not* gated
  on `collectionConfig?.custom?.export?.enabled` read via `useConfig()` —
  Payload strips `custom` (and `endpoints`) from the client-serialized
  collection config entirely (`serverOnlyCollectionProperties` in
  `payload/dist/collections/config/client.js`), so that field is never
  reachable client-side. Instead, `EXPORTABLE_COLLECTION_SLUGS` (the same
  17-slug allow-list `wireExportButton` uses server-side) lives in its own
  zero-dependency module, `apps/cms/src/payload/lib/export/exportable-collections.ts`,
  which exports `isExportableCollection(slug)` and is imported by both the
  server-side `wire-export-button.ts` and the client-side `CmsListView.tsx`
  — a shared source of truth safe to cross the client/server boundary,
  since it's just a static string array with no Payload-server imports.
  `wire-export-button.ts` still stamps `collection.custom.export = { enabled, dateField }`
  server-side (useful there — the export endpoint itself can read it), but
  that value is not what gates the client-side menu item. Selecting the
  item sets a new `exportDrawerOpen` state to `true`.
- A second `Drawer` (sibling to the existing column-picker `Drawer`) renders
  `apps/cms/src/payload/admin/components/views/list/ExportDrawer.tsx` when
  `exportDrawerOpen` is true. Contents:
  - Date range: two `DateTimePicker` fields (from/to), optional (empty =
    unbounded).
  - Field picker: checklist built from the collection's field list
    (`useConfig()` — sanitized client config already includes field
    name/label/type, no per-collection hardcoding). Relationship, richText,
    upload, array/group/block fields are included with a serialization note
    (see below); fields the user has no read access to are already absent
    from the sanitized client config, so the picker never offers a field
    the export endpoint would 403 on. **Auto-preselected: whichever fields
    are currently shown as table columns** (`useTableColumns` — the same
    hook `ColumnPicker.tsx` already uses), recomputed every time the drawer
    is opened (not just once), so it reflects whatever the editor has
    toggled via the existing "Columns…" picker. Editors can still check/
    uncheck freely before exporting; if no displayed column maps onto an
    exportable field name, it falls back to the first 5 exportable fields
    so the picker never opens empty.
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
- Gates on `hasAnyRole(req.user, ['admin', 'editor'])` → 403 otherwise, then
  runs `payload.find({ collection: slug, where, sort, depth: 1, ...pagination, overrideAccess: true })`
  — matching the exact access pattern `export-leads-csv.ts` /
  `export-partners-csv.ts` already use (explicit role gate +
  `overrideAccess: true`), not Payload's per-field access control. This is
  the established convention for exports in this codebase; the field
  denylist above is the safeguard against PII leakage rather than
  per-field access control.
- Paginates with its own `EXPORT_PAGE_SIZE = 200` / `EXPORT_HARD_CAP_PAGES = 100`
  constants (same values `export-leads-csv.ts` uses, defined fresh here since
  that file isn't being touched); if the hard cap is hit, the response still
  downloads successfully with a **truncation notice row** appended, matching
  the existing truncation-banner convention — never a silent partial export.
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

Left untouched. They already work, are GDPR-audited, and their column
flattening is too bespoke (nested UTM/consent joins) to fold into a generic
field serializer without risk. Not in `EXPORTABLE_COLLECTION_SLUGS`, so the
new Export button doesn't appear on those two list pages — their existing
export UI (`PartnersExportButton.tsx`, the leads export banner) is
unaffected.

## Decisions locked

- No audit-log row is written by the new generic exporter. The existing
  audit trail exists specifically because `leads`/`partner-applications`
  export raw visitor PII; those stay on their own audited endpoint (out of
  scope, see above). The 17 collections the generic exporter serves are
  either public content (blogs, news, guides...) or already have their own
  access-controlled admin views — adding an audit write here would be
  scope creep without a corresponding compliance requirement.
- `EXPORT_FIELD_DENYLIST` lives in `serialize-field.ts` and is checked both
  when building the field picker's option list (client, via `useConfig`)
  and server-side when validating the `fields` query param (defense in
  depth — a denylisted field requested directly is dropped silently, not
  a 400, so a stale client doesn't break).

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
