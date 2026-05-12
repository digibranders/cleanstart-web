import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import { clientIpFromHeaders } from '../lib/client-ip';
import { checkAndRecord } from '../lib/rate-limit';
import { extractEmail } from '../lib/lead-handlers/extract-fields';

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
    if (limited) return json({ ok: false, error: 'rate_limited' }, { status: 429 });

    const url = new URL(req.url ?? '', 'http://localhost');
    const emailParam = url.searchParams.get('email')?.trim() ?? '';
    if (!emailParam || !emailParam.includes('@')) {
      return json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }

    const targetEmail = emailParam.toLowerCase();

    const result = await req.payload.find({
      collection: 'leads',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    });

    const matches = (result.docs as unknown as LeadRow[])
      .filter((lead) => matchesEmail(lead, targetEmail))
      .map((lead) => ({
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
    if (limited) return json({ ok: false, error: 'rate_limited' }, { status: 429 });

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

    const result = await req.payload.find({
      collection: 'leads',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    });

    const matching = (result.docs as unknown as LeadRow[]).filter((lead) =>
      matchesEmail(lead, targetEmail),
    );

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

    return json({ ok: true, deleted });
  },
};
