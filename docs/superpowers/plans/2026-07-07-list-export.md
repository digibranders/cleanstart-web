# List-page Export (CSV / XLSX) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Export…" action to the CMS list-page kebab menu for 17 content collections, letting an editor pick a date range, a set of fields, and CSV or XLSX, and download a file that respects the list's current search/filter state.

**Architecture:** A shared, reusable Payload `Endpoint` factory (`buildExportEndpoint`) registered per-collection via a new `wireExportButton` config-injection transform (mirrors the existing `wireCustomListView` pattern). A shared field serializer (`serialize-field.ts`) turns any Payload field value into a flat cell for both a CSV writer (existing `toCsv`) and a new XLSX writer (`toXlsx`, via `exceljs`). The admin UI reuses the list view's existing kebab-menu + `Drawer` pattern (same shape as the existing "Columns…" picker) — no new modal system.

**Tech Stack:** Payload 3.81 (Next.js 16 admin), `@payloadcms/ui` data-layer hooks (`useConfig`, `useListQuery`), `@cleanstart/ui` (`Drawer`, `DateTimePicker`), `exceljs` (new dependency), Zod (query-param validation), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-07-list-export-design.md`

---

## Task 1: Add the `exceljs` dependency

**Files:**
- Modify: `apps/cms/package.json`

- [ ] **Step 1: Add the dependency**

Run:
```bash
pnpm --filter @cleanstart/cms add exceljs
```

Expected: `apps/cms/package.json` gains `"exceljs": "^4.x.x"` under `dependencies`, and the root `pnpm-lock.yaml` updates.

- [ ] **Step 2: Verify it installed cleanly**

Run: `pnpm --filter @cleanstart/cms exec node -e "require('exceljs'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/package.json pnpm-lock.yaml
git commit -m "chore(cms): add exceljs for XLSX export"
```

---

## Task 2: `serialize-field.ts` — shared field-value serializer

**Files:**
- Create: `apps/cms/src/payload/lib/export/serialize-field.ts`
- Test: `apps/cms/src/payload/lib/export/serialize-field.test.ts`

This module turns one Payload document's field value into a flat string
cell, given the field's declared `type`. It's shared by both the CSV and
XLSX branches of the export endpoint.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/cms/src/payload/lib/export/serialize-field.test.ts
import { describe, expect, it } from 'vitest';

import { EXPORT_FIELD_DENYLIST, isExportableFieldName, serializeFieldValue } from './serialize-field';

describe('serializeFieldValue', () => {
  it('passes through primitives as strings', () => {
    expect(serializeFieldValue('text', 'hello')).toBe('hello');
    expect(serializeFieldValue('number', 42)).toBe('42');
    expect(serializeFieldValue('checkbox', true)).toBe('true');
  });

  it('renders null/undefined as an empty string', () => {
    expect(serializeFieldValue('text', null)).toBe('');
    expect(serializeFieldValue('text', undefined)).toBe('');
  });

  it('renders date fields as the raw ISO string', () => {
    expect(serializeFieldValue('date', '2026-07-01T00:00:00.000Z')).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  it('renders a populated relationship as its title/name/slug', () => {
    expect(
      serializeFieldValue('relationship', { id: 5, title: 'Container Security 101' }),
    ).toBe('Container Security 101');
    expect(serializeFieldValue('relationship', { id: 5, name: 'Dhanush VM' })).toBe(
      'Dhanush VM',
    );
    expect(serializeFieldValue('relationship', { id: 5, slug: 'cyber-security' })).toBe(
      'cyber-security',
    );
  });

  it('renders an unpopulated relationship (a bare id) as the id', () => {
    expect(serializeFieldValue('relationship', 5)).toBe('5');
  });

  it('renders an array of populated relationships joined by "; "', () => {
    expect(
      serializeFieldValue('relationship', [
        { id: 1, title: 'Cyber Security' },
        { id: 2, title: 'Data Protection' },
      ]),
    ).toBe('Cyber Security; Data Protection');
  });

  it('extracts plain text from a Lexical richText value', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' }],
          },
        ],
      },
    };
    expect(serializeFieldValue('richText', lexical)).toBe('Hello world');
  });

  it('JSON-stringifies plain arrays, groups, and blocks', () => {
    expect(serializeFieldValue('array', [{ a: 1 }])).toBe('[{"a":1}]');
    expect(serializeFieldValue('group', { a: 1 })).toBe('{"a":1}');
  });

  it('neutralises a leading-= formula-injection payload', () => {
    expect(serializeFieldValue('text', '=cmd|"/c calc"!A1')).toBe(
      '\'=cmd|"/c calc"!A1',
    );
  });
});

describe('isExportableFieldName', () => {
  it('rejects the denylisted field names', () => {
    for (const name of EXPORT_FIELD_DENYLIST) {
      expect(isExportableFieldName(name)).toBe(false);
    }
  });

  it('accepts anything else', () => {
    expect(isExportableFieldName('title')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/export/serialize-field.test.ts`
Expected: FAIL — `Cannot find module './serialize-field'`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/cms/src/payload/lib/export/serialize-field.ts
/**
 * Turns one Payload field value into a flat export cell, keyed off the
 * field's declared `type`. Shared by both the CSV and XLSX export
 * branches so there is one place that decides "what does a relationship
 * / richText / array field look like in a spreadsheet".
 *
 * Reuses the same formula-injection guard `lib/csv.ts` applies (a cell
 * starting with =, +, -, @ gets a leading single-quote) so the XLSX path
 * gets the same protection the existing CSV exports already have.
 */

/** Never offered in the field picker, never honored server-side, even if
 * requested directly — defence in depth against visitor-PII leakage
 * through this generic path. See design doc "Decisions locked". */
export const EXPORT_FIELD_DENYLIST: readonly string[] = ['ip', 'userAgent'];

export const isExportableFieldName = (name: string): boolean =>
  !EXPORT_FIELD_DENYLIST.includes(name);

const FORMULA_TRIGGER = /^[\s ]*[=+\-@\t\r]/;

const neutraliseFormula = (raw: string): string =>
  FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;

type RelatedDocShape = {
  id?: string | number;
  title?: unknown;
  name?: unknown;
  slug?: unknown;
};

const relatedDocLabel = (doc: RelatedDocShape): string => {
  if (typeof doc.title === 'string') return doc.title;
  if (typeof doc.name === 'string') return doc.name;
  if (typeof doc.slug === 'string') return doc.slug;
  return doc.id != null ? String(doc.id) : '';
};

const lexicalNodeToText = (node: unknown): string => {
  if (node == null || typeof node !== 'object') return '';
  const n = node as { type?: string; text?: string; children?: unknown[] };
  if (n.type === 'text' && typeof n.text === 'string') return n.text;
  if (Array.isArray(n.children)) return n.children.map(lexicalNodeToText).join('');
  return '';
};

const lexicalToPlainText = (value: unknown): string => {
  const root = (value as { root?: { children?: unknown[] } } | null)?.root;
  if (!root || !Array.isArray(root.children)) return '';
  return root.children
    .map(lexicalNodeToText)
    .filter((s) => s.length > 0)
    .join(' ')
    .trim();
};

export const serializeFieldValue = (fieldType: string, value: unknown): string => {
  if (value == null) return '';

  if (fieldType === 'richText') return neutraliseFormula(lexicalToPlainText(value));

  if (fieldType === 'relationship' || fieldType === 'upload') {
    if (Array.isArray(value)) {
      return neutraliseFormula(
        value
          .map((v) => (typeof v === 'object' && v !== null ? relatedDocLabel(v as RelatedDocShape) : String(v)))
          .join('; '),
      );
    }
    if (typeof value === 'object') return neutraliseFormula(relatedDocLabel(value as RelatedDocShape));
    return neutraliseFormula(String(value));
  }

  if (fieldType === 'array' || fieldType === 'group' || fieldType === 'blocks') {
    try {
      return neutraliseFormula(JSON.stringify(value));
    } catch {
      return neutraliseFormula(String(value));
    }
  }

  return neutraliseFormula(String(value));
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/export/serialize-field.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/export/serialize-field.ts apps/cms/src/payload/lib/export/serialize-field.test.ts
git commit -m "feat(cms): add shared field-value serializer for exports"
```

---

## Task 3: `xlsx.ts` — XLSX workbook writer

**Files:**
- Create: `apps/cms/src/payload/lib/xlsx.ts`
- Test: `apps/cms/src/payload/lib/xlsx.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/xlsx.test.ts
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { toXlsx } from './xlsx';

describe('toXlsx', () => {
  it('writes a header row plus one row per record, readable back via exceljs', async () => {
    const buffer = await toXlsx(['id', 'title'], [
      { id: 1, title: 'First' },
      { id: 2, title: 'Second' },
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];

    expect(sheet.getRow(1).getCell(1).value).toBe('id');
    expect(sheet.getRow(1).getCell(2).value).toBe('title');
    expect(sheet.getRow(2).getCell(1).value).toBe(1);
    expect(sheet.getRow(2).getCell(2).value).toBe('First');
    expect(sheet.getRow(3).getCell(2).value).toBe('Second');
  });

  it('writes a missing key as an empty cell', async () => {
    const buffer = await toXlsx(['id', 'title'], [{ id: 1 }]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.getRow(2).getCell(2).value).toBeNull();
  });

  it('writes a formula-injection payload as a literal string, not a formula', async () => {
    const buffer = await toXlsx(['note'], [{ note: '=cmd|"/c calc"!A1' }]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const cell = workbook.worksheets[0].getRow(2).getCell(1);
    expect(cell.type).not.toBe(ExcelJS.ValueType.Formula);
    expect(String(cell.value)).toContain('=cmd');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/xlsx.test.ts`
Expected: FAIL — `Cannot find module './xlsx'`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/cms/src/payload/lib/xlsx.ts
/**
 * Minimal XLSX workbook writer built on `exceljs`. Mirrors `toCsv`'s
 * signature (headers + row objects in, serialized bytes out) so the
 * export endpoint can call either with the same call shape.
 *
 * Every non-numeric, non-boolean cell is forced to exceljs's explicit
 * string type so a value like `=SUM(A1:A9)` lands in the sheet as
 * literal text, never a live formula (same intent as `lib/csv.ts`'s
 * formula-injection guard, enforced here at the cell-type level instead
 * of a leading single-quote since XLSX has a real string cell type).
 */
import ExcelJS from 'exceljs';

export const toXlsx = async (
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');

  sheet.addRow([...headers]);

  for (const row of rows) {
    const cells = headers.map((h) => {
      const value = row[h];
      if (value == null) return null;
      if (typeof value === 'number' || typeof value === 'boolean') return value;
      return { richText: [{ text: String(value) }] };
    });
    sheet.addRow(cells);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/xlsx.test.ts`
Expected: PASS, all 3 cases green. (If the formula-injection test fails because exceljs still infers a formula from a `richText` cell starting with `=`, switch the cell write to explicit `{ type: 'string', value: ... }` via `cell.value = String(value); cell.numFmt = '@';` instead — keep the test as the source of truth for which approach is correct.)

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/xlsx.ts apps/cms/src/payload/lib/xlsx.test.ts
git commit -m "feat(cms): add XLSX workbook writer for exports"
```

---

## Task 4: `build-export-endpoint.ts` — shared export endpoint factory

**Files:**
- Create: `apps/cms/src/payload/lib/export/build-export-endpoint.ts`
- Test: `apps/cms/src/payload/lib/export/build-export-endpoint.test.ts`
- Reference: `apps/cms/src/payload/endpoints/export-leads-csv.ts` (pagination/role-gate pattern), `apps/cms/src/payload/access/typed-user.ts` (`hasAnyRole`), `apps/cms/src/payload/lib/csv.ts` (`toCsv`)

- [ ] **Step 1: Write the failing tests**

```ts
// apps/cms/src/payload/lib/export/build-export-endpoint.test.ts
import { describe, expect, it, vi } from 'vitest';

import { buildExportEndpoint } from './build-export-endpoint';

const makeReq = (overrides: Partial<{
  url: string;
  user: { id: number; roles?: string[] } | null;
  docs: Record<string, unknown>[];
}>) => {
  const docs = overrides.docs ?? [];
  return {
    url: overrides.url ?? 'http://internal/api/blogs/export?fields=title,slug',
    user: overrides.user === undefined ? { id: 1, roles: ['admin'] } : overrides.user,
    payload: {
      find: vi.fn().mockResolvedValue({ docs, hasNextPage: false }),
      logger: { error: vi.fn() },
    },
  } as unknown as Parameters<ReturnType<typeof buildExportEndpoint>['handler']>[0];
};

describe('buildExportEndpoint', () => {
  it('registers at the single-segment /export path', () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    expect(endpoint.path).toBe('/export');
    expect(endpoint.method).toBe('get');
  });

  it('returns 403 when the requester has no admin/editor role', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(makeReq({ user: { id: 2, roles: ['viewer'] } }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when fields is missing', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(
      makeReq({ url: 'http://internal/api/blogs/export' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when from is after to', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(
      makeReq({
        url: 'http://internal/api/blogs/export?fields=title&from=2026-07-05&to=2026-07-01',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('drops a denylisted field even when explicitly requested', async () => {
    const endpoint = buildExportEndpoint('leads', { dateField: 'createdAt' });
    const req = makeReq({
      url: 'http://internal/api/leads/export?fields=title,ip,userAgent',
      docs: [{ id: 1, title: 'x' }],
    });
    const res = await endpoint.handler(req);
    const text = await res.text();
    expect(text).toContain('title');
    expect(text).not.toContain('ip');
    expect(text).not.toContain('userAgent');
  });

  it('merges the date range into the where clause passed to payload.find', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&from=2026-07-01&to=2026-07-05',
    });
    await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findCall.where).toEqual({
      and: [
        {},
        {
          and: [
            { publishedAt: { greater_than_equal: '2026-07-01' } },
            { publishedAt: { less_than_equal: '2026-07-05' } },
          ],
        },
      ],
    });
  });

  it('serializes rows as CSV by default', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title',
      docs: [{ id: 1, title: 'Hello' }],
    });
    const res = await endpoint.handler(req);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('title');
    expect(text).toContain('Hello');
  });

  it('serializes rows as XLSX when format=xlsx', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&format=xlsx',
      docs: [{ id: 1, title: 'Hello' }],
    });
    const res = await endpoint.handler(req);
    expect(res.headers.get('content-type')).toContain('spreadsheetml');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/export/build-export-endpoint.test.ts`
Expected: FAIL — `Cannot find module './build-export-endpoint'`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/cms/src/payload/lib/export/build-export-endpoint.ts
import type { Endpoint, Where } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../../access/typed-user';
import { toCsv } from '../csv';
import { toXlsx } from '../xlsx';
import { isExportableFieldName, serializeFieldValue } from './serialize-field';

export const EXPORT_PAGE_SIZE = 200;
export const EXPORT_HARD_CAP_PAGES = 100;
export const EXPORT_HARD_CAP_ROWS = EXPORT_PAGE_SIZE * EXPORT_HARD_CAP_PAGES;

const QuerySchema = z
  .object({
    fields: z.string().min(1, 'fields is required'),
    format: z.enum(['csv', 'xlsx']).default('csv'),
    from: z.string().optional(),
    to: z.string().optional(),
    where: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  })
  .refine((q) => !(q.from && q.to) || q.from <= q.to, {
    message: 'from must not be after to',
    path: ['from'],
  });

const todayStamp = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
};

const jsonError = (status: number, error: string): Response =>
  new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/**
 * Builds a collection-level `GET /export` endpoint. Registered per
 * collection (never config-level — 3+-segment config endpoints 404 under
 * this Payload REST router, see `integrations-actions.ts`).
 *
 * Access: matches the existing convention in `export-leads-csv.ts` /
 * `export-partners-csv.ts` — an explicit admin/editor role gate plus
 * `overrideAccess: true`, not Payload's per-field access control. The
 * export field denylist (`serialize-field.ts`) is the safeguard against
 * leaking PII-shaped fields, not field-level access.
 */
export const buildExportEndpoint = (
  slug: string,
  opts: { dateField: string },
): Endpoint => ({
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) return jsonError(403, 'forbidden');

    const url = new URL(req.url ?? '', 'http://internal');
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'invalid query');
    const { fields, format, from, to, where: whereParam, search, sort } = parsed.data;

    const requestedFields = fields
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && isExportableFieldName(f));
    if (requestedFields.length === 0) return jsonError(400, 'no exportable fields requested');

    let clientWhere: Where = {};
    if (whereParam) {
      try {
        clientWhere = JSON.parse(whereParam) as Where;
      } catch {
        return jsonError(400, 'where must be valid JSON');
      }
    }

    const dateConditions: Where[] = [];
    if (from) dateConditions.push({ [opts.dateField]: { greater_than_equal: from } } as Where);
    if (to) dateConditions.push({ [opts.dateField]: { less_than_equal: to } } as Where);

    const where: Where =
      dateConditions.length === 0
        ? clientWhere
        : { and: [clientWhere, dateConditions.length === 1 ? dateConditions[0] : { and: dateConditions }] };

    let page = 1;
    let truncated = false;
    const rows: Record<string, unknown>[] = [];
    while (true) {
      const result = await req.payload.find({
        collection: slug,
        where,
        search,
        sort: sort ?? '-createdAt',
        limit: EXPORT_PAGE_SIZE,
        page,
        depth: 1,
        overrideAccess: true,
      });
      for (const doc of result.docs) {
        const flat: Record<string, unknown> = {};
        for (const field of requestedFields) {
          const raw = (doc as Record<string, unknown>)[field];
          flat[field] = serializeFieldValue(inferFieldType(raw), raw);
        }
        rows.push(flat);
      }
      if (!result.hasNextPage) break;
      page += 1;
      if (page > EXPORT_HARD_CAP_PAGES) {
        truncated = true;
        break;
      }
    }

    if (truncated) rows.push({ [requestedFields[0]]: `— truncated at ${EXPORT_HARD_CAP_ROWS} rows —` });

    const filename = `${slug}-${todayStamp()}.${format}`;
    if (format === 'xlsx') {
      const buffer = await toXlsx(requestedFields, rows);
      return new Response(buffer, {
        status: 200,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': `attachment; filename="${filename}"`,
          'cache-control': 'no-store',
        },
      });
    }

    const csv = toCsv(requestedFields, rows);
    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store',
      },
    });
  },
});

/**
 * Best-effort field-type inference from the raw value shape, used only to
 * pick the right `serializeFieldValue` branch. This is intentionally
 * value-shape-based rather than schema-based: the generic endpoint serves
 * 17 heterogeneous collections and re-deriving each one's exact field
 * config here would duplicate Payload's own collection config. A
 * relationship/upload value is always an object-with-id or an array of
 * those; richText is always a Lexical `{ root: ... }` shape; everything
 * else falls through to the plain-string branch.
 */
const inferFieldType = (value: unknown): string => {
  if (value && typeof value === 'object' && 'root' in (value as Record<string, unknown>)) {
    return 'richText';
  }
  if (Array.isArray(value)) {
    return value.every((v) => typeof v === 'object' && v !== null) ? 'relationship' : 'array';
  }
  if (value && typeof value === 'object' && ('id' in value || 'title' in value || 'name' in value || 'slug' in value)) {
    return 'relationship';
  }
  if (value && typeof value === 'object') return 'group';
  return 'text';
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/export/build-export-endpoint.test.ts`
Expected: PASS, all 8 cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/export/build-export-endpoint.ts apps/cms/src/payload/lib/export/build-export-endpoint.test.ts
git commit -m "feat(cms): add shared export endpoint factory"
```

---

## Task 5: `wireExportButton` — wire the endpoint + admin flag onto 17 collections

**Files:**
- Create: `apps/cms/src/payload/lib/wire-export-button.ts`
- Test: `apps/cms/src/payload/lib/wire-export-button.test.ts`
- Modify: `apps/cms/src/payload.config.ts:105-110` (import), `apps/cms/src/payload.config.ts:417-423` (`.map()` chain)

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/wire-export-button.test.ts
import type { CollectionConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { EXPORTABLE_COLLECTION_SLUGS, wireExportButton } from './wire-export-button';

const baseCollection = (slug: string, fields: CollectionConfig['fields'] = []): CollectionConfig => ({
  slug,
  fields,
});

describe('wireExportButton', () => {
  it('leaves a non-exportable collection untouched', () => {
    const input = baseCollection('media');
    const output = wireExportButton(input);
    expect(output).toBe(input);
  });

  it('marks an exportable collection as export-enabled with a /export endpoint', () => {
    const input = baseCollection('blogs', [{ name: 'publishedAt', type: 'date' }]);
    const output = wireExportButton(input);
    expect(output.custom?.export).toEqual({ enabled: true, dateField: 'publishedAt' });
    expect(output.endpoints?.some((e) => 'path' in e && e.path === '/export')).toBe(true);
  });

  it('falls back to createdAt when a collection has no publishedAt field', () => {
    const input = baseCollection('forms', [{ name: 'title', type: 'text' }]);
    const output = wireExportButton(input);
    expect(output.custom?.export?.dateField).toBe('createdAt');
  });

  it('excludes leads and partner-applications (own bespoke export)', () => {
    expect(EXPORTABLE_COLLECTION_SLUGS).not.toContain('leads');
    expect(EXPORTABLE_COLLECTION_SLUGS).not.toContain('partner-applications');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/wire-export-button.test.ts`
Expected: FAIL — `Cannot find module './wire-export-button'`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/cms/src/payload/lib/wire-export-button.ts
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

  return {
    ...collection,
    custom: { ...collection.custom, export: { enabled: true, dateField } },
    endpoints: [...(collection.endpoints ?? []), buildExportEndpoint(collection.slug, { dateField })],
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/wire-export-button.test.ts`
Expected: PASS, all 4 cases green.

- [ ] **Step 5: Wire it into `payload.config.ts`**

In `apps/cms/src/payload.config.ts`, add the import near the other `wire*`
imports (around line 108-110):

```ts
import { wireExportButton } from './payload/lib/wire-export-button';
```

Then add `.map(wireExportButton)` to the main collections chain (around
line 417-423), after `wireCustomListView` (so `custom.export` is present
before `CmsListView` renders) and before `wireCustomFields`:

```ts
  ]
    .map(wirePublishGate)
    .map(wirePreviewControls)
    .map(wireCustomListView)
    .map(wireExportButton)
    // Per-document Analytics tab hidden — re-enable by uncommenting this and its import.
    // .map(wireAnalyticsTab)
    .map(wireCustomFields),
```

- [ ] **Step 6: Regenerate types and verify the CMS boots**

Run:
```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms typecheck
```
Expected: both succeed with no errors. If `generate:types` fails because a
sibling collection has uncommitted WIP, stash it first (see the
`generate-types-absorbs-sibling-wip` note in this repo's memory) — there
should be none at this point since this plan is the only change in
flight.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/lib/wire-export-button.ts apps/cms/src/payload/lib/wire-export-button.test.ts apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): wire the shared export endpoint onto 17 content collections"
```

---

## Task 6: `ExportDrawer.tsx` — admin UI

**Files:**
- Create: `apps/cms/src/payload/admin/components/views/list/ExportDrawer.tsx`
- Modify: `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx`
- Reference: `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx` (field-list-from-config pattern), `packages/ui/src/primitives/DateTimePicker.tsx` (props)

- [ ] **Step 1: Write `ExportDrawer.tsx`**

```tsx
// apps/cms/src/payload/admin/components/views/list/ExportDrawer.tsx
'use client';

import { DateTimePicker } from '@cleanstart/ui';
import { useConfig, useListQuery } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { EXPORT_FIELD_DENYLIST } from '../../../../lib/export/serialize-field';

type ExportableField = { name: string; label: string };

type Props = {
  readonly collectionSlug: string;
};

const fieldLabel = (f: { label?: unknown; name?: string }): string => {
  if (typeof f.label === 'string') return f.label;
  if (f.label && typeof f.label === 'object' && 'en' in f.label) {
    return String((f.label as Record<string, unknown>).en ?? f.name ?? '');
  }
  return f.name ?? '';
};

/**
 * The "Export…" kebab-menu drawer. Mirrors `ColumnPicker.tsx`'s shape
 * (a Drawer body, no dialog system of its own). Field list is derived
 * from the collection's client config (`useConfig`) rather than
 * hardcoded per collection — every content collection this drawer
 * serves gets the same picker for free.
 */
export const ExportDrawer = (props: Props): ReactElement => {
  const { collectionSlug } = props;
  const { config } = useConfig();
  const { query } = useListQuery();

  const collection = useMemo(
    () => config.collections.find((c) => c.slug === collectionSlug),
    [config, collectionSlug],
  );

  const exportableFields: ExportableField[] = useMemo(() => {
    const fields = collection?.fields ?? [];
    return fields
      .filter((f): f is typeof f & { name: string } => 'name' in f && typeof f.name === 'string')
      .filter((f) => !EXPORT_FIELD_DENYLIST.includes(f.name))
      .map((f) => ({ name: f.name, label: fieldLabel(f) }));
  }, [collection]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    () => new Set(exportableFields.slice(0, 5).map((f) => f.name)),
  );
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const toggleField = (name: string): void => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const onExport = (): void => {
    const params = new URLSearchParams();
    params.set('fields', Array.from(selectedFields).join(','));
    params.set('format', format);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (query.search) params.set('search', String(query.search));
    if (query.where && Object.keys(query.where as Record<string, unknown>).length > 0) {
      params.set('where', JSON.stringify(query.where));
    }
    window.location.assign(
      `${config.routes.api}/${collectionSlug}/export?${params.toString()}`,
    );
  };

  return (
    <div className="cs-export-drawer">
      <fieldset className="cs-export-drawer__section">
        <legend>Date range</legend>
        <DateTimePicker value={from} onChange={setFrom} mode="date" ariaLabel="From date" />
        <DateTimePicker value={to} onChange={setTo} mode="date" ariaLabel="To date" />
      </fieldset>

      <fieldset className="cs-export-drawer__section">
        <legend>Columns</legend>
        <ul className="cs-export-drawer__field-list">
          {exportableFields.map((f) => (
            <li key={f.name}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedFields.has(f.name)}
                  onChange={() => toggleField(f.name)}
                />
                <span>{f.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="cs-export-drawer__section">
        <legend>Format</legend>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'csv'}
            onChange={() => setFormat('csv')}
          />
          CSV
        </label>
        <label>
          <input
            type="radio"
            name="export-format"
            checked={format === 'xlsx'}
            onChange={() => setFormat('xlsx')}
          />
          Excel (.xlsx)
        </label>
      </fieldset>

      <button
        type="button"
        className="cs-btn cs-btn--primary"
        disabled={selectedFields.size === 0}
        onClick={onExport}
      >
        Export {selectedFields.size} column{selectedFields.size === 1 ? '' : 's'}
      </button>
    </div>
  );
};

export default ExportDrawer;
```

- [ ] **Step 2: Wire it into `CmsListView.tsx`**

Add the import near the other list-view component imports (top of file):

```ts
import { ExportDrawer } from './ExportDrawer';
```

Add state next to `columnPickerOpen` (around line 84):

```ts
const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
```

In the `menuItems` `useMemo` (around lines 88-107), add a conditional item
after `'reset-column-widths'`:

```ts
const exportEnabled = Boolean(
  (collectionConfig?.custom as { export?: { enabled?: boolean } } | undefined)?.export
    ?.enabled,
);
```
(place this line just above the `menuItems` `useMemo`, since it reads
`collectionConfig` which is already computed above it), then inside the
`items` array literal, after the `reset-column-widths` item and before the
`listMenuItems` block:

```ts
      ...(exportEnabled
        ? [
            { kind: 'separator' as const, id: 'sep-export' },
            {
              kind: 'item' as const,
              id: 'export',
              label: 'Export…',
              onSelect: () => setExportDrawerOpen(true),
            },
          ]
        : []),
```

and add `exportEnabled` to the `useMemo`'s dependency array (`[listMenuItems, exportEnabled]`).

Finally, add a second `Drawer` sibling to the existing column-picker one
(after its closing `</Drawer>`, around line 360):

```tsx
          <Drawer
            open={exportDrawerOpen}
            onClose={() => setExportDrawerOpen(false)}
            ariaLabel="Export"
            side="right"
            size="sm"
          >
            <DrawerHeader
              title="Export"
              subtitle={`Download ${collectionLabel.toLowerCase()} as CSV or Excel.`}
              onClose={() => setExportDrawerOpen(false)}
            />
            <DrawerBody>
              <ExportDrawer collectionSlug={collectionSlug} />
            </DrawerBody>
          </Drawer>
```

- [ ] **Step 3: Typecheck and lint**

Run:
```bash
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms verify:payload-ui
```
Expected: all three pass. `verify:payload-ui` matters here — `ExportDrawer.tsx` only imports `useConfig`/`useListQuery` from `@payloadcms/ui` (both already allow-listed), plus `DateTimePicker` from `@cleanstart/ui`, so it should pass without needing an allow-list change.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/admin/components/views/list/ExportDrawer.tsx apps/cms/src/payload/admin/components/views/list/CmsListView.tsx
git commit -m "feat(cms): add Export drawer to the list-view kebab menu"
```

---

## Task 7: Manual verification in the running admin

**Files:** none (verification only)

- [ ] **Step 1: Start the CMS dev server and open the Blogs list**

Run: `pnpm --filter @cleanstart/cms dev` (or confirm it's already running), then open `http://localhost:3000/admin/collections/blogs`.

- [ ] **Step 2: Open the kebab menu and confirm "Export…" appears**

Click the "..." button next to "Create". Expected: menu shows "Columns…",
"Reset column widths", a separator, then "Export…".

- [ ] **Step 3: Export a CSV**

Click "Export…", leave the date range empty, check 2-3 columns (e.g.
`title`, `slug`, `status`), leave format on CSV, click "Export N columns".
Expected: a `blogs-YYYY-MM-DD.csv` file downloads; opening it shows a
header row and one row per blog with the selected columns.

- [ ] **Step 4: Export an XLSX with a date range**

Reopen the drawer, set a "From" date that excludes some blogs, switch
format to "Excel (.xlsx)", export. Expected: a `.xlsx` file downloads and
opens in Excel/Numbers/LibreOffice with the same columns, only rows
published on/after the "From" date.

- [ ] **Step 5: Confirm a filtered list is respected**

Use the list's search box to filter to one term, reopen Export, export
CSV. Expected: the exported CSV only contains rows matching the search
term.

- [ ] **Step 6: Confirm a non-exportable collection has no Export item**

Open `http://localhost:3000/admin/collections/media` (or `/users`), open
its kebab menu. Expected: no "Export…" item present.

- [ ] **Step 7: Confirm Leads/Partner-Applications are unaffected**

Open `/admin/collections/leads` and `/admin/collections/partner-applications`.
Expected: their existing export UI/button still works exactly as before
(no "Export…" kebab item was added there — they're outside
`EXPORTABLE_COLLECTION_SLUGS`).

---

## Task 8: Full package verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full CMS check suite**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test
```
Expected: all four succeed. If `build` fails on bundle budget
(`verify:bundle-budget`), check whether `exceljs` pushed a route over its
budget — if so, confirm the export endpoint code (which imports `exceljs`)
isn't bundled into a client chunk (it's server-only, in an `Endpoint`
handler, so it shouldn't be) before treating it as a real regression.

- [ ] **Step 2: Report results**

Summarize in the PR/commit message: `lint ✓ · typecheck ✓ · build ✓ · test ✓`.
