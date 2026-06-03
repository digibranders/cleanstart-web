import type { Endpoint } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { toCsv } from '../lib/csv';
import { extractRequestMeta } from '../lib/request-meta';

export const PARTNER_CSV_PAGE_SIZE = 200;
export const PARTNER_CSV_HARD_CAP_PAGES = 100;
export const PARTNER_CSV_HARD_CAP_ROWS = PARTNER_CSV_PAGE_SIZE * PARTNER_CSV_HARD_CAP_PAGES;

const HEADERS = [
  'id',
  'createdAt',
  'firstName',
  'lastName',
  'email',
  'phone',
  'company',
  'website',
  'partnerReason',
  'consentGivenAt',
  'privacyPolicyVersion',
  'consentCategories',
  'emailDeliveryApplicant',
  'emailDeliveryAdmin',
] as const;

type PartnerRow = {
  id: number;
  createdAt: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  partnerReason?: string | null;
  consentGivenAt?: string | null;
  privacyPolicyVersion?: string | null;
  consentCategories?: { category?: string | null }[] | null;
  emailDeliveryApplicant?: { status?: string | null } | null;
  emailDeliveryAdmin?: { status?: string | null } | null;
};

const flatten = (row: PartnerRow): Record<string, unknown> => ({
  id: row.id,
  createdAt: row.createdAt,
  firstName: row.firstName ?? '',
  lastName: row.lastName ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  company: row.company ?? '',
  website: row.website ?? '',
  partnerReason: row.partnerReason ?? '',
  consentGivenAt: row.consentGivenAt ?? '',
  privacyPolicyVersion: row.privacyPolicyVersion ?? '',
  consentCategories: (row.consentCategories ?? [])
    .map((c) => c.category ?? '')
    .filter(Boolean)
    .join('; '),
  emailDeliveryApplicant: row.emailDeliveryApplicant?.status ?? '',
  emailDeliveryAdmin: row.emailDeliveryAdmin?.status ?? '',
});

const todayStamp = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
};

/**
 * GET /api/partner-applications/export-csv — admin/editor only. Paginates all
 * partner inquiries into a flat CSV. Excludes ip/userAgent (PII). Writes a
 * partner_exported audit-log row.
 */
export const exportPartnersCsvEndpoint: Endpoint = {
  path: '/export-csv',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    let page = 1;
    let truncated = false;
    const flat: Record<string, unknown>[] = [];
    while (true) {
      const result = await req.payload.find({
        collection: 'partner-applications',
        limit: PARTNER_CSV_PAGE_SIZE,
        page,
        sort: '-createdAt',
        depth: 0,
        overrideAccess: true,
      });
      for (const row of result.docs) flat.push(flatten(row as PartnerRow));
      if (!result.hasNextPage) break;
      page += 1;
      if (page > PARTNER_CSV_HARD_CAP_PAGES) {
        truncated = true;
        break;
      }
    }

    try {
      const meta = extractRequestMeta(req.headers);
      const rawActorId = req.user ? ((req.user as { id?: string | number }).id ?? null) : null;
      const actorId =
        typeof rawActorId === 'number'
          ? rawActorId
          : typeof rawActorId === 'string'
            ? Number.parseInt(rawActorId, 10)
            : null;
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'partner_exported',
          targetCollection: 'partner-applications',
          targetId: 'bulk',
          actorUserId: typeof actorId === 'number' && Number.isFinite(actorId) ? actorId : null,
          requestIp: meta.ip,
          userAgent: meta.userAgent ?? null,
          acceptLanguage: meta.acceptLanguage ?? null,
          proxyChainLength: meta.proxyChainLength,
          metadata: { rowCount: flat.length, truncated },
        },
        overrideAccess: true,
      });
    } catch (error) {
      req.payload.logger?.error?.(
        { err: error instanceof Error ? error.message : String(error) },
        'Failed to write audit-log row for partner CSV export',
      );
    }

    const csv = toCsv(HEADERS, flat);
    const headers: Record<string, string> = {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="partners-${todayStamp()}.csv"`,
      'cache-control': 'no-store',
    };
    if (truncated) {
      headers['x-partners-truncated'] = 'true';
      headers['x-partners-truncated-at'] = String(PARTNER_CSV_HARD_CAP_ROWS);
    }
    return new Response(csv, { status: 200, headers });
  },
};
