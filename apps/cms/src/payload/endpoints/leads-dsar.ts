import type { Endpoint, Payload } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import { deleteCareerApplicationsByEmail } from '../lib/careers/dsar';
import { deletePartnerApplicationsByEmail } from '../lib/partners/dsar';
import { clientIpFromHeaders } from '../lib/client-ip';
import { checkAndRecord } from '../lib/rate-limit';
import { extractEmail } from '../lib/lead-handlers/extract-fields';
import { hubspotGdprDeleteByEmail } from '../lib/lead-handlers/hubspot';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const DSAR_RATE_LIMITS = { perMinute: 5, perDay: 50 };

const deleteBodySchema = z.object({
  email: z.string().email(),
});

type LeadRow = {
  id: number;
  createdAt: string;
  form: number | { id: number };
  fields: Record<string, unknown>;
};

const resolveFormId = (form: number | { id: number }): number =>
  typeof form === 'object' ? form.id : form;

const matchesEmail = (lead: LeadRow, targetEmail: string): boolean => {
  const found = extractEmail(null, lead.fields);
  if (found === null) return false;
  return found.toLowerCase() === targetEmail.toLowerCase();
};

const LEAD_PAGE_SIZE = 500;

/**
 * Collect every lead matching `targetEmail` across the full table.
 *
 * The email lives inside the per-form `fields` JSON (the field name
 * varies per form, so `extractEmail` walks the values) and is not
 * queryable on the json column — so we page through all rows and filter
 * in memory. Pagination is exhausted up front; callers must not delete
 * mid-iteration or a later page's offset would skip rows.
 */
const collectMatchingLeads = async (
  payload: Payload,
  targetEmail: string,
): Promise<LeadRow[]> => {
  const matches: LeadRow[] = [];
  let page = 1;
  for (;;) {
    const result = await payload.find({
      collection: 'leads',
      limit: LEAD_PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    });
    for (const lead of result.docs as unknown as LeadRow[]) {
      if (matchesEmail(lead, targetEmail)) matches.push(lead);
    }
    if (!result.hasNextPage) break;
    page += 1;
  }
  return matches;
};

/**
 * GET /api/leads/dsar/find?email=...
 *
 * Returns all lead IDs where the visitor's email (extracted from the
 * `fields` JSON) matches the query. Admin only. GDPR Art. 15 support.
 */
export const dsarFindEndpoint: Endpoint = {
  path: '/leads/dsar/find',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const ip = clientIpFromHeaders(req.headers);
    const limited = checkAndRecord(`dsar-find:${ip}`, DSAR_RATE_LIMITS);
    if (!limited.ok)
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000),
        },
        { status: 429 },
      );

    const url = new URL(req.url ?? '', 'http://localhost');
    const emailParam = url.searchParams.get('email')?.trim() ?? '';
    if (!emailParam || !emailParam.includes('@')) {
      return json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }

    const targetEmail = emailParam.toLowerCase();

    const matches = (await collectMatchingLeads(req.payload, targetEmail)).map((lead) => ({
      id: lead.id,
      createdAt: lead.createdAt,
      formId: resolveFormId(lead.form),
    }));

    // Audit trail.
    await req.payload.create({
      collection: 'audit-log',
      data: {
        timestamp: new Date().toISOString(),
        action: 'dsar_export',
        targetCollection: 'leads',
        targetId: targetEmail,
        actorUserId: (req.user as { id: number } | null)?.id ?? null,
        requestIp: ip,
        metadata: { email: targetEmail, matchCount: matches.length },
      },
      overrideAccess: true,
    });

    return json({ ok: true, matches, count: matches.length });
  },
};

/**
 * POST /api/leads/dsar/delete
 *
 * Hard-deletes all leads where the visitor email matches. Writes a
 * dsar_erasure audit log row per deletion. GDPR Art. 17 support.
 */
export const dsarDeleteEndpoint: Endpoint = {
  path: '/leads/dsar/delete',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const ip = clientIpFromHeaders(req.headers);
    const limited = checkAndRecord(`dsar-delete:${ip}`, DSAR_RATE_LIMITS);
    if (!limited.ok)
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000),
        },
        { status: 429 },
      );

    let raw: unknown;
    try {
      raw = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = deleteBodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }

    const targetEmail = parsed.data.email.toLowerCase();
    const actorId = (req.user as { id: number } | null)?.id ?? null;

    const matching = await collectMatchingLeads(req.payload, targetEmail);

    // Cascade to HubSpot first — irreversible (permanently blocklists
    // the email in the CRM). Fail-soft: if HubSpot can't be reached,
    // log + still complete the local deletion. An admin can re-run the
    // DSAR delete once HubSpot is back up to ensure the CRM is purged.
    let hubspotDeleted = false;
    try {
      hubspotDeleted = await hubspotGdprDeleteByEmail(req.payload, targetEmail);
    } catch (err) {
      req.payload.logger?.warn?.(
        { error: err instanceof Error ? err.message : String(err), email: targetEmail },
        'DSAR: HubSpot gdpr-delete failed — continuing with local deletion',
      );
    }

    let deleted = 0;
    for (const lead of matching) {
      await req.payload.delete({
        collection: 'leads',
        id: lead.id,
        overrideAccess: true,
      });

      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'dsar_erasure',
          targetCollection: 'leads',
          targetId: String(lead.id),
          actorUserId: actorId,
          requestIp: ip,
          metadata: { email: targetEmail, leadId: lead.id },
        },
        overrideAccess: true,
      });

      deleted += 1;
    }

    const { deleted: careerApplicationsDeleted } = await deleteCareerApplicationsByEmail(
      req.payload,
      targetEmail,
    );

    if (careerApplicationsDeleted > 0) {
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'dsar_erasure',
          targetCollection: 'career-applications',
          targetId: targetEmail,
          actorUserId: actorId,
          requestIp: ip,
          metadata: { email: targetEmail, deleted: careerApplicationsDeleted },
        },
        overrideAccess: true,
      });
    }

    const { deleted: partnerApplicationsDeleted } = await deletePartnerApplicationsByEmail(
      req.payload,
      targetEmail,
    );

    if (partnerApplicationsDeleted > 0) {
      await req.payload.create({
        collection: 'audit-log',
        data: {
          timestamp: new Date().toISOString(),
          action: 'dsar_erasure',
          targetCollection: 'partner-applications',
          targetId: targetEmail,
          actorUserId: actorId,
          requestIp: ip,
          metadata: { email: targetEmail, deleted: partnerApplicationsDeleted },
        },
        overrideAccess: true,
      });
    }

    return json({
      ok: true,
      deleted,
      hubspotDeleted,
      careerApplicationsDeleted,
      partnerApplicationsDeleted,
    });
  },
};
