import { createHmac, timingSafeEqual } from 'node:crypto';

import type { BasePayload, Endpoint } from 'payload';
import { z } from 'zod';

import { clientIpFromHeaders } from '../lib/client-ip';
import {
  resolveBrevoCredentials,
  resolveCalcomCredentials,
} from '../lib/integrations/credentials';
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

const findBrevoRow = async (payload: BasePayload): Promise<{ id: string | number } | null> => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { equals: 'brevoBounceCallback' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    return (result.docs[0] as unknown as { id: string | number } | undefined) ?? null;
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

    const submission: LeadSubmission = {
      formId: creds.fallbackFormId,
      formSchemaVersion: 1,
      fields: {
        email,
        name: attendee?.name ?? body.payload?.organizer?.name ?? '',
        bookingTitle: body.payload?.title ?? '',
        bookingStart: body.payload?.startTime ?? '',
      },
      source: 'calcom',
      utm: undefined,
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

// ─── Brevo bounce callbacks ─────────────────────────────────────

interface BrevoEvent {
  event?: string | undefined;
  email?: string | undefined;
  ts?: number | undefined;
  reason?: string | undefined;
}

type EmailHealth = 'hard_bounce' | 'complaint' | 'unsubscribed' | 'good';

const mapBrevoEvent = (event: string | undefined): EmailHealth | null => {
  switch (event) {
    case 'hard_bounce':
      return 'hard_bounce';
    case 'spam':
      return 'complaint';
    case 'unsubscribed':
      return 'unsubscribed';
    default:
      return null;
  }
};

const verifyBearer = (header: string | null, expected: string): boolean => {
  if (!header) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const token = match[1];
  if (!token) return false;
  const provided = Buffer.from(token.trim());
  const exp = Buffer.from(expected);
  if (provided.length !== exp.length) return false;
  return timingSafeEqual(provided, exp);
};

const bodySchema = z
  .object({
    event: z.string().optional(),
    email: z.string().email().optional(),
    ts: z.number().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

interface LeadWithEmailHealth {
  id: number;
  fields?: Record<string, unknown>;
}

export const brevoBounceInboundEndpoint: Endpoint = {
  path: '/integrations/brevo',
  method: 'post',
  handler: async (req) => {
    const ip = clientIpFromHeaders(req.headers);
    const limited = checkAndRecord(`brevo-inbound:${ip}`, RATE_LIMITS);
    if (!limited.ok)
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000),
        },
        { status: 429 },
      );

    const row = await findBrevoRow(req.payload);
    if (!row) {
      return json({ ok: false, error: 'no_active_brevo_row' }, { status: 503 });
    }
    const creds = resolveBrevoCredentials();
    if (!creds) {
      return json(
        { ok: false, error: 'brevo_inbound_token_not_set_in_env' },
        { status: 503 },
      );
    }

    const auth = typeof req.headers?.get === 'function' ? req.headers.get('authorization') : null;
    if (!verifyBearer(auth, creds.bearerToken)) {
      return json({ ok: false, error: 'invalid_token' }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }
    const evt: BrevoEvent = parsed.data;

    const health = mapBrevoEvent(evt.event);
    if (!health || !evt.email) {
      return json({ ok: true, ignored: evt.event ?? 'unknown' });
    }

    const email = evt.email.toLowerCase();
    const matches = await req.payload.find({
      collection: 'leads',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    });
    let updated = 0;
    for (const lead of matches.docs as unknown as LeadWithEmailHealth[]) {
      const fieldEmail = lead.fields?.email;
      if (typeof fieldEmail !== 'string' || fieldEmail.toLowerCase() !== email) continue;
      try {
        await req.payload.update({
          collection: 'leads',
          id: lead.id,
          data: { emailHealth: health, emailHealthAt: new Date().toISOString() },
          overrideAccess: true,
        });
        updated += 1;
      } catch {
        // continue
      }
    }
    return json({ ok: true, event: evt.event, updated });
  },
};
