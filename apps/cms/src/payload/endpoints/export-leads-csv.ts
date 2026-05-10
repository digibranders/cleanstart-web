import type { Endpoint, Where } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { toCsv } from '../lib/csv';
import { extractRequestMeta } from '../lib/request-meta';

type LeadRow = {
  id: number;
  form?: { id?: number; name?: string | null } | number | null;
  formSchemaVersion?: number | null;
  fields?: Record<string, unknown> | null;
  source?: string | null;
  utm?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  consentGivenAt?: string | null;
  privacyPolicyVersion?: string | null;
  enriched?: Record<string, unknown> | null;
  syncedTo?: { handler?: string | null; status?: string | null }[] | null;
  duplicateOf?: number | null;
  createdAt: string;
};

/** Page size + hard cap for the CSV export pagination loop. The product
 * of these is the truncation point; anything beyond should use a
 * scheduled job, not a synchronous endpoint. Exported so the admin
 * truncation banner can render the same number the response advertises. */
export const CSV_EXPORT_PAGE_SIZE = 200;
export const CSV_EXPORT_HARD_CAP_PAGES = 100;
export const CSV_EXPORT_HARD_CAP_ROWS = CSV_EXPORT_PAGE_SIZE * CSV_EXPORT_HARD_CAP_PAGES;

const HEADERS = [
  'id',
  'createdAt',
  'formId',
  'formName',
  'source',
  'utm_campaign',
  'utm_source',
  'utm_medium',
  'companyFromDomain',
  'fields',
  'consentGivenAt',
  'privacyPolicyVersion',
  'syncedTo',
  'duplicateOf',
] as const;

const flatten = (row: LeadRow): Record<string, unknown> => {
  const utm = row.utm ?? {};
  const enriched = row.enriched ?? {};
  const cfd = (enriched['company-from-domain'] ?? null) as
    | { company?: string; domain?: string }
    | null;
  const formIdValue =
    typeof row.form === 'number'
      ? row.form
      : typeof row.form === 'object' && row.form
        ? (row.form.id ?? null)
        : null;
  const formName =
    typeof row.form === 'object' && row.form ? (row.form.name ?? null) : null;
  return {
    id: row.id,
    createdAt: row.createdAt,
    formId: formIdValue,
    formName,
    source: row.source ?? '',
    utm_campaign: (utm as Record<string, unknown>).campaign ?? '',
    utm_source: (utm as Record<string, unknown>).source ?? '',
    utm_medium: (utm as Record<string, unknown>).medium ?? '',
    companyFromDomain: cfd?.company ?? '',
    fields: row.fields ?? {},
    consentGivenAt: row.consentGivenAt ?? '',
    privacyPolicyVersion: row.privacyPolicyVersion ?? '',
    syncedTo: (row.syncedTo ?? [])
      .map((s) => `${s.handler ?? '?'}:${s.status ?? '?'}`)
      .join('; '),
    duplicateOf: row.duplicateOf ?? '',
  };
};

const buildWhere = (params: URLSearchParams): Where => {
  const conditions: Where[] = [];
  const formId = params.get('formId');
  if (formId) {
    const numeric = Number.parseInt(formId, 10);
    if (Number.isInteger(numeric) && numeric > 0) {
      conditions.push({ form: { equals: numeric } });
    }
  }
  const since = params.get('since');
  if (since) conditions.push({ createdAt: { greater_than_equal: since } });
  const until = params.get('until');
  if (until) {
    // Treat ?until=2026-04-15 as "include the full day". When the caller
    // already passes a time-aware ISO string we pass it through. The
    // detection: a 10-char YYYY-MM-DD adds 24h on the inclusive side and
    // becomes a strict less-than the next day at 00:00 UTC.
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(until);
    if (isDateOnly) {
      const next = new Date(`${until}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000;
      conditions.push({ createdAt: { less_than: new Date(next).toISOString() } });
    } else {
      conditions.push({ createdAt: { less_than_equal: until } });
    }
  }
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0] as Where;
  return { and: conditions };
};

const todayStamp = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
};

/**
 * GET /api/leads/export-csv
 *
 * Admin / editor only — paginates through every lead matching the
 * optional `formId`, `since`, `until` query params and streams a flat
 * CSV. Each row carries the deduped key columns (id / createdAt /
 * form / utm / source / company-from-domain / consent metadata) plus
 * the full visitor-answer JSON in the `fields` column.
 *
 * The PII fields ip + userAgent are intentionally NOT included in the
 * export — they're auto-purged after retentionDays (Phase G) and don't
 * belong in marketing CSVs anyway.
 */
export const exportLeadsCsvEndpoint: Endpoint = {
  path: '/export-csv',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    const url = new URL(req.url ?? '', 'http://internal');
    const where = buildWhere(url.searchParams);

    let page = 1;
    let truncated = false;
    const flat: Record<string, unknown>[] = [];
    while (true) {
      const result = await req.payload.find({
        collection: 'leads',
        where,
        limit: CSV_EXPORT_PAGE_SIZE,
        page,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      });
      for (const row of result.docs) flat.push(flatten(row as LeadRow));
      if (!result.hasNextPage) break;
      page += 1;
      if (page > CSV_EXPORT_HARD_CAP_PAGES) {
        // 20k row cap — bigger exports should use a scheduled job. The
        // X-Leads-Truncated headers signal the admin banner so the editor
        // doesn't ship an incomplete CSV thinking it's complete.
        truncated = true;
        break;
      }
    }

    // GDPR Art. 15 audit trail — every PII export must be tied to a
    // specific admin/editor + the filter that selected the rows. Audit
    // failures are isolated so a misbehaving audit-log collection
    // can't block a legitimate export.
    try {
      const meta = extractRequestMeta(req.headers);
      const rawActorId = req.user
        ? ((req.user as { id?: string | number }).id ?? null)
        : null;
      const actorId =
        typeof rawActorId === 'number'
          ? rawActorId
          : typeof rawActorId === 'string'
            ? Number.parseInt(rawActorId, 10)
            : null;
      const actorUserId =
        typeof actorId === 'number' && Number.isFinite(actorId) ? actorId : null;
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'lead_exported',
          targetCollection: 'leads',
          targetId: 'bulk',
          actorUserId,
          requestIp: meta.ip,
          userAgent: meta.userAgent ?? null,
          acceptLanguage: meta.acceptLanguage ?? null,
          proxyChainLength: meta.proxyChainLength,
          metadata: {
            rowCount: flat.length,
            truncated,
            filter: Object.fromEntries(url.searchParams.entries()),
          },
        },
        overrideAccess: true,
      });
    } catch (error) {
      req.payload.logger?.error?.(
        { err: error instanceof Error ? error.message : String(error) },
        'Failed to write audit-log row for leads CSV export',
      );
    }

    const csv = toCsv(HEADERS, flat);
    const headers: Record<string, string> = {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="leads-${todayStamp()}.csv"`,
      'cache-control': 'no-store',
      // The `since` / `until` query params are interpreted as UTC. The
      // header lets the admin UI render a banner when the editor's
      // browser is in a different timezone, so they don't double-count
      // edge-of-day rows.
      'x-leads-date-tz': 'UTC',
    };
    if (truncated) {
      headers['x-leads-truncated'] = 'true';
      headers['x-leads-truncated-at'] = String(CSV_EXPORT_HARD_CAP_ROWS);
    }
    return new Response(csv, { status: 200, headers });
  },
};
