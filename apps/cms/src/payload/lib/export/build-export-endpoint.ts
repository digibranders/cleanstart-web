import type { CollectionSlug, Endpoint, Where } from 'payload';
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
  if (
    value &&
    typeof value === 'object' &&
    ('id' in value || 'title' in value || 'name' in value || 'slug' in value)
  ) {
    return 'relationship';
  }
  if (value && typeof value === 'object') return 'group';
  return 'text';
};

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
export const buildExportEndpoint = (slug: string, opts: { dateField: string }): Endpoint => ({
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) return jsonError(403, 'forbidden');

    const url = new URL(req.url ?? '', 'http://internal');
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'invalid query');
    const { fields, format, from, to, where: whereParam, sort } = parsed.data;

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

    const dateWhere: Where | null =
      dateConditions.length === 0
        ? null
        : dateConditions.length === 1
          ? (dateConditions[0] as Where)
          : { and: dateConditions };

    const where: Where = dateWhere === null ? clientWhere : { and: [clientWhere, dateWhere] };

    let page = 1;
    let truncated = false;
    const rows: Record<string, unknown>[] = [];
    while (true) {
      const result = await req.payload.find({
        // `slug` is a runtime-validated collection slug supplied by the
        // per-collection wiring in `wire-export-button.ts` (Task 5), not
        // arbitrary input — the cast narrows to Payload's generated
        // `CollectionSlug` union without weakening any runtime check.
        collection: slug as CollectionSlug,
        where,
        sort: sort ?? '-createdAt',
        limit: EXPORT_PAGE_SIZE,
        page,
        depth: 1,
        overrideAccess: true,
      });
      const docs = result.docs as unknown as Record<string, unknown>[];
      for (const doc of docs) {
        const flat: Record<string, unknown> = {};
        for (const field of requestedFields) {
          const raw = doc[field];
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

    const firstField = requestedFields[0];
    if (truncated && firstField) {
      rows.push({ [firstField]: `— truncated at ${EXPORT_HARD_CAP_ROWS} rows —` });
    }

    const filename = `${slug}-${todayStamp()}.${format}`;
    if (format === 'xlsx') {
      const buffer = await toXlsx(requestedFields, rows);
      return new Response(new Uint8Array(buffer), {
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
