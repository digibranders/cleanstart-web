import type { Endpoint, PayloadRequest } from 'payload';

import { submitLeadBodySchema } from '../lib/lead-handlers/payload-schema';
import { submitLead } from '../lib/lead-handlers/registry';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const clientIp = (req: PayloadRequest): string => {
  const headers = req.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first) return first.trim();
  }
  return headers.get('x-real-ip') ?? 'unknown';
};

/**
 * POST /api/leads/submit
 *
 * Public-facing form submission endpoint. Validates body, applies rate
 * limit, runs the LeadHandler chain (db primary + secondaries fan-out),
 * returns a thin OK envelope. Never exposes lead IDs or raw answers
 * back to the caller.
 *
 * Turnstile verification (E3) and R2 fallback queue (E4) wrap this
 * handler in subsequent commits.
 */
export const submitLeadEndpoint: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const ip = clientIp(req);
    const limit = checkAndRecord(`leads:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
        },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = submitLeadBodySchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: 'invalid_body',
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      return json(
        {
          ok: false,
          error: 'turnstile_failed',
          reason: turnstile.reason,
        },
        { status: 403 },
      );
    }

    const numericFormId =
      typeof data.formId === 'number' ? data.formId : Number.parseInt(data.formId, 10);
    if (!Number.isInteger(numericFormId) || numericFormId <= 0) {
      return json({ ok: false, error: 'invalid_form_id' }, { status: 400 });
    }

    try {
      const result = await submitLead(req.payload, {
        formId: numericFormId,
        formSchemaVersion: data.formSchemaVersion,
        fields: data.fields,
        source: data.source,
        utm: data.utm,
        ip,
        userAgent,
        consent: data.consent,
      });

      if (!result.ok) {
        return json(
          { ok: false, error: 'capture_failed', reason: result.primary },
          { status: 502 },
        );
      }

      return json({
        ok: true,
        duplicate: result.duplicateOfLeadId != null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      req.payload.logger.error({ err: message }, 'Lead submission failed');
      return json({ ok: false, error: 'internal_error' }, { status: 500 });
    }
  },
};
