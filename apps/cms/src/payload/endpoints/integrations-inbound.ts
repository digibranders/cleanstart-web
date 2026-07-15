import { createHmac, timingSafeEqual } from 'node:crypto';

import type { BasePayload, Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { resolveCalcomCredentials } from '../lib/integrations/credentials';
import { submitLead } from '../lib/lead-handlers';
import type { LeadSubmission } from '../lib/lead-handlers/types';
import { checkAndRecord } from '../lib/rate-limit';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const RATE_LIMITS = { perMinute: 60, perDay: 5000 };

interface CalcomRowLite {
  id: string | number;
  calcomConfig?: { fallbackFormId?: number | null } | null;
}

const findCalcomRow = async (payload: BasePayload): Promise<CalcomRowLite | null> => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { equals: 'calComInbound' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    return (result.docs[0] as unknown as CalcomRowLite | undefined) ?? null;
  } catch {
    return null;
  }
};

// ─── Cal.com ──────────────────────────────────────────────────────

interface CalcomPayload {
  triggerEvent?: string;
  payload?: {
    type?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ name?: string; email?: string }>;
    organizer?: { email?: string; name?: string };
  };
}

const verifyCalcomSignature = (
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean => {
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const provided = Buffer.from(signatureHeader.trim());
  if (provided.length !== expectedBuf.length) return false;
  return timingSafeEqual(provided, expectedBuf);
};

export const calcomInboundEndpoint: Endpoint = {
  path: '/integrations/calcom',
  method: 'post',
  handler: async (req) => {
    const ip = clientIpFromHeaders(req.headers);
    const limited = checkAndRecord(`calcom-inbound:${ip}`, RATE_LIMITS);
    if (!limited.ok)
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000),
        },
        { status: 429 },
      );

    const rawBody = req.text ? await req.text() : '';
    if (!rawBody) return json({ ok: false, error: 'empty_body' }, { status: 400 });

    const row = await findCalcomRow(req.payload);
    if (!row) {
      return json({ ok: false, error: 'no_active_calcom_row' }, { status: 503 });
    }
    const creds = resolveCalcomCredentials({ calcomConfig: row.calcomConfig ?? null });
    if (!creds) {
      return json(
        { ok: false, error: 'calcom_signing_secret_not_set_in_env' },
        { status: 503 },
      );
    }

    const signature =
      typeof req.headers?.get === 'function'
        ? req.headers.get('x-cal-signature-256')
        : null;
    if (!verifyCalcomSignature(rawBody, signature, creds.signingSecret)) {
      return json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    }

    let body: CalcomPayload;
    try {
      body = JSON.parse(rawBody) as CalcomPayload;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    if (body.triggerEvent !== 'BOOKING_CREATED') {
      return json({ ok: true, ignored: body.triggerEvent ?? 'unknown' });
    }

    const attendee = body.payload?.attendees?.[0];
    const email = attendee?.email ?? body.payload?.organizer?.email;
    if (!email) return json({ ok: false, error: 'no_email' }, { status: 400 });

    if (!creds.fallbackFormId) {
      return json(
        { ok: false, error: 'no_fallback_form_configured' },
        { status: 503 },
      );
    }

    // Fetch the current schemaVersion from the fallback form so the lead
    // records the schema version that was active at submission time.
    let formSchemaVersion = 1;
    try {
      const form = (await req.payload.findByID({
        collection: 'forms',
        id: creds.fallbackFormId,
        depth: 0,
        overrideAccess: true,
      })) as { schemaVersion?: number | null } | null;
      if (typeof form?.schemaVersion === 'number') {
        formSchemaVersion = form.schemaVersion;
      }
    } catch {
      // Fall back to 1 if the form cannot be fetched
    }

    const submission: LeadSubmission = {
      formId: creds.fallbackFormId,
      formSchemaVersion,
      fields: {
        email,
        name: attendee?.name ?? body.payload?.organizer?.name ?? '',
        bookingTitle: body.payload?.title ?? '',
        bookingStart: body.payload?.startTime ?? '',
      },
      source: 'calcom',
      utm: undefined,
      attribution: undefined,
      ip,
      userAgent: undefined,
      consent: undefined,
    };

    try {
      const result = await submitLead(req.payload, submission, { formFieldDefs: [] });
      return json({ ok: result.ok, leadId: result.leadId });
    } catch (err) {
      req.payload.logger?.warn?.(
        { error: err instanceof Error ? err.message : String(err) },
        'cal.com inbound: submitLead threw',
      );
      return json({ ok: false, error: 'submit_failed' }, { status: 500 });
    }
  },
};
