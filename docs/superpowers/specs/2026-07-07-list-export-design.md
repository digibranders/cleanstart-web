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
  - Date range: a preset picker (`All time` (default) / `Today` /
    `Last 7 days` / `Last 30 days` / `This month` / `Last month` /
    `Custom range`) above the two `DateTimePicker` fields (from/to).
    **Rendered as a trigger button + `@cleanstart/ui`'s `DropdownMenu`**
    (the same anchored, portal-rendered, dark-themed popup that already
    powers the kebab menu and `SavedViews.tsx`'s "Views" trigger) —
    **not a native `<select>`.** A native select's trigger box can be
    styled with `cs-native-select`, but its *popup list* is rendered by
    the OS/browser and cannot be restyled via CSS, so it visibly breaks
    the CMS's dark theme; `DropdownMenu` avoids that entirely since it's
    a real DOM popup. Picking a non-custom preset computes local-calendar
    `YYYY-MM-DD` strings (matching `DateTimePicker`'s own `mode="date"`
    storage format, per `packages/ui/src/primitives/DateTimePicker.tsx`'s
    `formatStorage`) and fills both pickers; manually editing either
    picker afterward flips the preset back to `Custom range` (so the two
    controls never silently disagree). `All time` clears both to `null`
    (unbounded, today's default/only behavior before this addendum).
  - Field picker: checklist built from the collection's field list
    (`useConfig()` — sanitized client config already includes field
    name/label/type, no per-collection hardcoding). Relationship, richText,
    upload, array/group/block fields are included with a serialization note
    (see below); fields the user has no read access to are already absent
    from the sanitized client config, so the picker never offers a field
    the export endpoint would 403 on. **Auto-preselected: the union of (a)
    whichever fields are currently shown as table columns** (`useTableColumns`
    — the same hook `ColumnPicker.tsx` already uses) **and (b) a small,
    generic "always useful" field-name allow-list** — `title`, `name`,
    `slug`, `status`, `_status`, `createdAt`, `updatedAt`, `publishedAt`,
    `publicationDate`, `effectiveDate` — checked against that collection's
    *actual* field names (not hardcoded per collection; e.g. this is how
    `news`'s `publicationDate` gets preselected even though it's rarely a
    visible table column). Recomputed every time the drawer is opened (not
    just once), so it reflects whatever the editor has toggled via the
    existing "Columns…" picker. Editors can still check/uncheck freely
    before exporting; if the union is still empty, it falls back to the
    first 5 exportable fields so the picker never opens empty.
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
  from `from` when present, and — **addendum, fixing a real off-by-one**
  — for `to`: a date-only string (`YYYY-MM-DD`, exactly what the new date
  presets produce) is treated as *inclusive through the end of that day*,
  matching `export-leads-csv.ts`'s existing `until` handling (add 24h and
  use `less_than` the next day's midnight UTC) rather than
  `less_than_equal` on the bare date, which Postgres would otherwise
  interpret as midnight-that-day — silently excluding the rest of the
  day's rows (e.g. a "Today" export would exclude everything published
  after 00:00 today). A full ISO-datetime `to` (not just `YYYY-MM-DD`)
  still uses `less_than_equal` directly, unchanged.
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

## Addendum: SEO field fix, Schema Types column, curated Blogs defaults

Prompted by a user-provided screenshot of desired default columns plus a
reference SEO-crawl-tool CSV. Two real gaps found during investigation,
both fixed here.

### 1. Several picker checkboxes silently exported blank

`seoTitle`, `seoDescription`, `seoIndexable`, `canonicalUrl`, and
`socialCard` (all defined in `apps/cms/src/payload/fields/seo.ts` via
`seoSidebarFields`) are Payload `type: 'ui'` fields — pure admin-sidebar
display widgets with no stored data of their own. The *actual* SEO data
lives in a separate hidden `type: 'group'` field named `seo`
(`seoFieldHidden`, `apps/cms/src/payload/fields/seo.ts:537`), with
sub-fields `seo.title`, `seo.description`, `seo.indexable`,
`seo.ogImage`, `seo.ogImageAlt`, `seo.canonicalOverride`, etc. Any `ui`
field selected in the export picker returns `undefined` (Payload never
populates `ui` fields into `doc`), so these five checkboxes always
produced empty cells.

**Fix, two parts:**

- **Field-picker filtering** (`ExportDrawer.tsx`): exclude every
  `type === 'ui'` field from `exportableFields` *except* a small
  redirect allow-list (`seoTitle`, `seoDescription`, `seoIndexable`,
  `canonicalUrl`, `socialCard` — see below). Everything else `ui`-typed
  (`serpPreview`, `schemaPreview`, `seoHealthScore`, `seoAdvanced`) is
  dropped from the picker entirely — each is a composite renderer with no
  single clean data source, so there's nothing meaningful to export.
- **Virtual field-path redirection** (new
  `apps/cms/src/payload/lib/export/virtual-fields.ts`,
  `VIRTUAL_FIELD_SOURCE_PATH: Record<string,string>`): the five
  allow-listed names keep their existing visible label/column-header, but
  the endpoint reads their value from the real nested path instead of the
  (nonexistent) flat name:
  - `seoTitle` → `seo.title`
  - `seoDescription` → `seo.description`
  - `seoIndexable` → `seo.indexable`
  - `canonicalUrl` → `seo.canonicalOverride`
  - `socialCard` → `seo.ogImage` (a media relationship — serializes via
    the existing relationship branch of `serialize-field.ts`)
  `build-export-endpoint.ts` resolves each requested field name through
  this map (dot-path lookup, falling through unchanged for every
  ordinary top-level field name) before calling `serializeFieldValue`.

### 2. New synthetic "Schema Types" column

Not a real Payload field — a computed value showing the distinct
schema.org `@type`s a document would produce, e.g. `"Article, HowTo"`.

Reuses the CMS's own existing, tested JSON-LD builder rather than
re-deriving type logic: `buildJsonLdBlobs(ctx, collectionSlug, doc)`
(`apps/cms/src/payload/lib/jsonld/dispatch.ts:661`) already returns the
ordered Layer-1 (base type) + Layer-2 (`schemaAddons[]` block) blob list
for a document, each blob carrying a real `@type`. New
`apps/cms/src/payload/lib/export/schema-types.ts`:

- `isSchemaEmittableCollection(slug)` — true only for the 10 collections
  `buildJsonLdBlobs` actually supports (mirrors
  `apps/cms/src/payload/endpoints/jsonld.ts`'s `SUPPORTED_COLLECTIONS`):
  `blogs, news, guides, knowledgeBase, authors, events, webinars, jobs,
  pages, resources`. For the other 7 exportable collections (no schema
  type at all — `case-studies`, `podcastEpisodes` have no detail route
  yet; `aboutGalleries`, `forms`, `deal-registrations`,
  `career-applications`, `legalDocuments` aren't schema-emitting), the
  column is simply blank — not hidden, for a consistent picker across all
  17 collections.
- `buildExportJsonLdContext(payload)` — fetches the two globals
  (`siteSettings`, `seoDefaults`) `buildJsonLdContext` needs, mirroring
  exactly how `jsonld.ts`'s existing endpoint constructs it. Called once
  per export request (not per row) only when `__schemaTypes` is among the
  requested fields.
- `computeSchemaTypesLabel(ctx, slug, doc)` — calls `buildJsonLdBlobs`,
  maps the blob list to `@type`, dedupes, joins with `", "`. Wrapped in
  try/catch → `''` on any error (a malformed/partially-populated doc must
  never fail the whole export, just leave that one cell blank).

`build-export-endpoint.ts` requests `depth: 2` (not the usual `depth: 1`)
only when `__schemaTypes` is requested — `buildJsonLdBlobs`'s read-helpers
(hero image, authors, categories) expect populated relationship objects,
matching the depth the existing single-doc `jsonld.ts` endpoint already
uses. The field is offered in `ExportDrawer.tsx`'s picker as a synthetic
entry `{ name: '__schemaTypes', label: 'Schema Types' }`, unconditionally
appended (not per-collection-conditional client-side, consistent with the
picker's existing "derive from config, don't special-case per collection"
approach — server-side blank-for-unsupported-collections handles the
rest).

### 3. Curated default columns (Blogs)

Per an explicit user decision, default column preselection moves from a
purely generic heuristic to **curated per-collection lists where defined,
falling back to the existing generic heuristic (displayed columns ∪
always-useful names ∪ first-5) for any collection without a curated
list.** New `apps/cms/src/payload/admin/components/views/list/export-default-columns.ts`
(client-safe, no server imports — same constraint as
`export-date-preset.ts`):

```ts
export const CURATED_DEFAULT_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  blogs: [
    'title', 'slug', 'abstract', 'heroImage', 'authors', 'reviewedBy',
    'categories', '__schemaTypes', 'publishedAt', 'seoTitle',
    'seoDescription', 'seoIndexable', 'canonicalUrl', 'socialCard',
    'wordCount', 'updatedAt', 'createdAt', '_status',
  ],
}
```

Only Blogs is curated for now — the other 16 collections keep the
generic heuristic. Adding a curated list for another collection later is
a one-entry addition to this map, not a new mechanism. `ExportDrawer.tsx`'s
open-transition `useEffect` checks `CURATED_DEFAULT_COLUMNS[collectionSlug]`
first (intersected with that collection's actual `exportableFields` names,
so a stale/renamed entry never selects a checkbox that doesn't exist),
then falls through to the existing displayed-columns/always-useful/first-5
logic only when no curated list exists for that slug.
