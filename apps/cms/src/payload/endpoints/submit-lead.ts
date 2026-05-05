import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { parkSubmission } from '../lib/lead-fallback-queue';
import { submitLeadBodySchema } from '../lib/lead-handlers/payload-schema';
import { submitLead } from '../lib/lead-handlers/registry';
import type { LeadSubmission } from '../lib/lead-handlers/types';
import { type FormFieldDef, validateFields } from '../lib/lead-handlers/validate-fields';
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
    const ip = clientIpFromHeaders(req.headers);
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

    // Honeypot — silently swallow with 200 OK so bots don't learn they
    // tripped the trap. Logged for spam analytics.
    if (typeof data.website === 'string' && data.website.trim().length > 0) {
      req.payload.logger.info(
        { ip, userAgent: userAgent ?? null },
        'Lead submission swallowed — honeypot tripped',
      );
      return json({ ok: true });
    }

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
    // Collapse "invalid id shape" and "form does not exist" into one
    // generic 400 so an attacker can't enumerate valid form IDs by
    // diffing 400 vs 404 response shapes.
    const invalidFormResponse = json({ ok: false, error: 'invalid_form' }, { status: 400 });
    if (!Number.isInteger(numericFormId) || numericFormId <= 0) {
      return invalidFormResponse;
    }

    // Server-side re-application of forms.fields[].validation rules.
    // The public form enforces these client-side; this stops a tampered
    // DOM or hand-crafted POST from shipping junk into the leads table.
    let formDoc: { _status?: string | null; fields?: FormFieldDef[] | null } | null;
    try {
      formDoc = (await req.payload.findByID({
        collection: 'forms',
        id: numericFormId,
        depth: 0,
        overrideAccess: true,
      })) as { _status?: string | null; fields?: FormFieldDef[] | null } | null;
    } catch {
      return invalidFormResponse;
    }
    if (!formDoc) return invalidFormResponse;
    // Draft forms must not accept public submissions — an editor working
    // on a new form shouldn't capture leads against it until they publish.
    if (formDoc._status != null && formDoc._status !== 'published') {
      return invalidFormResponse;
    }

    const fieldDefs = formDoc?.fields ?? [];
    if (fieldDefs.length > 0) {
      const validation = validateFields(fieldDefs, data.fields);
      if (!validation.ok) {
        return json(
          { ok: false, error: 'invalid_fields', issues: validation.issues },
          { status: 400 },
        );
      }
    }

    const submission: LeadSubmission = {
      formId: numericFormId,
      formSchemaVersion: data.formSchemaVersion,
      fields: data.fields,
      source: data.source,
      utm: data.utm,
      ip,
      userAgent,
      consent: data.consent,
    };

    try {
      const result = await submitLead(req.payload, submission, { formFieldDefs: fieldDefs });

      if (!result.ok) {
        // Primary handler failed — park for the drain cron, return 202.
        const parked = await parkSubmission(
          submission,
          result.primary.status === 'failed' ? result.primary.error : 'capture_failed',
        );
        if (parked.ok) {
          req.payload.logger.warn(
            { key: parked.key, sink: parked.sink },
            'Lead parked in fallback queue — primary handler failed',
          );
          return json({ ok: true, queued: true }, { status: 202 });
        }
        return json(
          { ok: false, error: 'capture_failed', reason: parked.error },
          { status: 502 },
        );
      }

      return json({
        ok: true,
        duplicate: result.duplicateOfLeadId != null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      const parked = await parkSubmission(submission, `endpoint-threw: ${message}`);
      if (parked.ok) {
        req.payload.logger.warn(
          { err: message, key: parked.key, sink: parked.sink },
          'Lead parked in fallback queue — endpoint threw',
        );
        return json({ ok: true, queued: true }, { status: 202 });
      }
      req.payload.logger.error({ err: message }, 'Lead submission failed and parking failed');
      return json({ ok: false, error: 'internal_error' }, { status: 500 });
    }
  },
};
