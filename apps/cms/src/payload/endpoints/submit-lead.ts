import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { parkSubmission } from '../lib/lead-fallback-queue';
import { submitLeadBodySchema } from '../lib/lead-handlers/payload-schema';
import { submitLead } from '../lib/lead-handlers/registry';
import type { LeadSubmission } from '../lib/lead-handlers/types';
import { type FormFieldDef, validateFields } from '../lib/lead-handlers/validate-fields';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { signDownloadToken } from '../lib/resources/download-token';
import { buildUnlockCookieHeader } from '../lib/resources/unlock-cookie';
import { verifyTurnstileToken } from '../lib/turnstile';
import { dispatchEvent } from '../lib/webhooks/dispatch';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

/** Maximum body size accepted on /api/leads/submit. Anything above this
 * is rejected with 413 BEFORE the body is buffered or rate-limit consumed,
 * so a header-only abuse can't penalise the IP or exhaust memory. */
export const LEAD_SUBMIT_MAX_BYTES = 64 * 1024;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
  'https://staging.cleanstart.com',
];

const allowedOrigins = (): string[] => {
  const raw = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;
  if (!raw || raw.trim().length === 0) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const isAllowedOrigin = (origin: string | null): origin is string =>
  origin != null && allowedOrigins().includes(origin);

/**
 * Form slugs exempt from Turnstile verification. Low-value, high-friction
 * signups (e.g. the email-only newsletter CTA) don't render a Turnstile
 * widget; they stay protected by the rate limit, the honeypot, and the CORS
 * allow-list. The exemption is keyed on the *resolved* form slug, so it can't
 * be used to bypass Turnstile for any other form. Override via
 * LEAD_SUBMIT_TURNSTILE_EXEMPT_SLUGS (CSV).
 */
const turnstileExemptSlugs = (): Set<string> => {
  const raw = process.env.LEAD_SUBMIT_TURNSTILE_EXEMPT_SLUGS;
  if (!raw || raw.trim().length === 0) return new Set(['newsletter', 'resource-capture']);
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
};

const corsHeaders = (origin: string): Record<string, string> => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  // Required because the lead-submit response can carry a Set-Cookie
  // (cs_gate_unlock) that the browser must store cross-origin; credentialed
  // CORS demands this header alongside an explicit origin.
  'access-control-allow-credentials': 'true',
  vary: 'Origin',
});

/**
 * OPTIONS /api/leads/submit — CORS preflight.
 *
 * Echoes the Origin only when it matches the allow-list; never wildcards.
 * Cross-origin browsers that aren't on cleanstart.com get a 403 here so
 * the actual POST never fires from a disallowed page.
 */
export const submitLeadOptionsEndpoint: Endpoint = {
  path: '/submit',
  method: 'options',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

/**
 * POST /api/leads/submit
 *
 * Public-facing form submission endpoint. Validates body, applies rate
 * limit, runs the LeadHandler chain (db primary + secondaries fan-out),
 * returns a thin OK envelope. Never exposes lead IDs or raw answers
 * back to the caller.
 *
 * Order of operations is deliberate: origin → body-size → rate-limit →
 * body parse. The 413 path runs before rate-limit so an attacker can't
 * exhaust the per-IP quota by spamming oversized headers.
 */
export const submitLeadEndpoint: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    // Same-origin (admin UI, server-to-server) requests don't send an Origin
    // header — those proceed. Browser cross-origin requests must match the
    // allow-list.
    if (origin != null && !isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    }
    const responseCors = isAllowedOrigin(origin) ? corsHeaders(origin) : {};

    const contentLengthRaw = req.headers.get('content-length');
    if (contentLengthRaw != null) {
      const contentLength = Number.parseInt(contentLengthRaw, 10);
      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return json(
          { ok: false, error: 'invalid_content_length' },
          { status: 400, headers: responseCors },
        );
      }
      if (contentLength > LEAD_SUBMIT_MAX_BYTES) {
        return json(
          { ok: false, error: 'payload_too_large', limit: LEAD_SUBMIT_MAX_BYTES },
          { status: 413, headers: responseCors },
        );
      }
    }

    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`leads:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
        },
        { status: 429, headers: responseCors },
      );
    }

    let body: unknown;
    try {
      // If Content-Length was absent, defend against chunked / unknown-length
      // bodies by buffering through arrayBuffer() and bouncing on overflow.
      if (contentLengthRaw == null && typeof req.arrayBuffer === 'function') {
        const buffer = await req.arrayBuffer();
        if (buffer.byteLength > LEAD_SUBMIT_MAX_BYTES) {
          return json(
            { ok: false, error: 'payload_too_large', limit: LEAD_SUBMIT_MAX_BYTES },
            { status: 413, headers: responseCors },
          );
        }
        const text = new TextDecoder().decode(buffer);
        body = text.length === 0 ? null : JSON.parse(text);
      } else {
        body = req.json ? await req.json() : null;
      }
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400, headers: responseCors });
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
        { status: 400, headers: responseCors },
      );
    }

    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Collapse "invalid id/slug shape" and "form does not exist" into one
    // generic 400 so an attacker can't enumerate valid forms by diffing
    // 400 vs 404 response shapes.
    const invalidFormResponse = json(
      { ok: false, error: 'invalid_form' },
      { status: 400, headers: responseCors },
    );

    type FormLookup = {
      id?: number | string;
      _status?: string | null;
      fields?: FormFieldDef[] | null;
      slug?: string | null;
      schemaVersion?: number | null;
    };

    // Resolve the target form by numeric `formId` (FormRenderer-driven forms,
    // which know the live id) or by stable `formSlug` (the statically-built
    // marketing forms — the DB id differs across environments). Returns null
    // for any miss; the caller maps that to invalidFormResponse.
    const resolveForm = async (): Promise<{
      id: number;
      schemaVersion: number;
      status: string | null | undefined;
      fields: FormFieldDef[];
      slug: string | null | undefined;
    } | null> => {
      try {
        if (data.formId != null) {
          const numericId =
            typeof data.formId === 'number' ? data.formId : Number.parseInt(data.formId, 10);
          if (!Number.isInteger(numericId) || numericId <= 0) return null;
          const doc = (await req.payload.findByID({
            collection: 'forms',
            id: numericId,
            depth: 0,
            overrideAccess: true,
          })) as FormLookup | null;
          if (!doc) return null;
          return {
            id: numericId,
            schemaVersion: doc.schemaVersion ?? 1,
            status: doc._status,
            fields: doc.fields ?? [],
            slug: doc.slug,
          };
        }
        if (data.formSlug != null) {
          const res = await req.payload.find({
            collection: 'forms',
            where: { slug: { equals: data.formSlug } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });
          const doc = res.docs[0] as FormLookup | undefined;
          if (!doc || doc.id == null) return null;
          const numericId =
            typeof doc.id === 'number' ? doc.id : Number.parseInt(String(doc.id), 10);
          if (!Number.isInteger(numericId) || numericId <= 0) return null;
          return {
            id: numericId,
            schemaVersion: doc.schemaVersion ?? 1,
            status: doc._status,
            fields: doc.fields ?? [],
            slug: doc.slug,
          };
        }
        return null;
      } catch {
        return null;
      }
    };

    const resolvedForm = await resolveForm();

    // Honeypot — return 200 OK so bots don't learn they tripped the trap.
    // Store the submission with the honeypot value set for admin visibility
    // and GDPR audit completeness. CRM secondaries are intentionally skipped.
    if (typeof data.website === 'string' && data.website.trim().length > 0) {
      req.payload.logger.info(
        { ip, userAgent: userAgent ?? null },
        'Lead submission flagged — honeypot tripped',
      );
      if (resolvedForm && resolvedForm.status === 'published') {
        try {
          await req.payload.create({
            collection: 'leads',
            data: {
              form: resolvedForm.id,
              formSchemaVersion: 0,
              fields: typeof data.fields === 'object' && data.fields !== null ? data.fields : {},
              source: data.source ?? null,
              ip: ip ?? null,
              userAgent: userAgent ?? null,
              honeypot: data.website,
              turnstilePassed: false,
            },
            overrideAccess: true,
          });
        } catch (err) {
          req.payload.logger.warn(
            { err: err instanceof Error ? err.message : String(err) },
            'Failed to persist honeypot lead',
          );
        }
      }
      return json({ ok: true }, { headers: responseCors });
    }

    const turnstileExempt =
      resolvedForm?.slug != null && turnstileExemptSlugs().has(resolvedForm.slug);
    if (!turnstileExempt) {
      const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
      if (!turnstile.ok) {
        return json(
          {
            ok: false,
            error: 'turnstile_failed',
            reason: turnstile.reason,
          },
          { status: 403, headers: responseCors },
        );
      }
    }

    // Draft forms must not accept public submissions — an editor working on a
    // new form shouldn't capture leads against it until they publish. Forms
    // always carries `versions: { drafts: true }`, so a missing `_status`
    // indicates a misconfiguration rather than a publishable row; reject those
    // too. A null resolution (bad id/slug or unknown form) maps here as well.
    if (!resolvedForm || resolvedForm.status !== 'published') {
      return invalidFormResponse;
    }
    const numericFormId = resolvedForm.id;

    // Server-side re-application of forms.fields[].validation rules.
    // The public form enforces these client-side; this stops a tampered
    // DOM or hand-crafted POST from shipping junk into the leads table.
    const fieldDefs = resolvedForm.fields;
    if (fieldDefs.length > 0) {
      const validation = validateFields(fieldDefs, data.fields);
      if (!validation.ok) {
        return json(
          { ok: false, error: 'invalid_fields', issues: validation.issues },
          { status: 400, headers: responseCors },
        );
      }
    }

    // Server-side injection of the current Legal policyVersion into the
    // consent snapshot. The web form never sends this — injecting it here
    // prevents spoofing and guarantees every lead records the live version
    // at submit time for GDPR audit defensibility.
    let consentWithPolicy = data.consent;
    if (data.consent != null) {
      try {
        const legalGlobal = (await req.payload.findGlobal({
          slug: 'legal',
          depth: 0,
          overrideAccess: true,
        })) as { policyVersion?: string | null } | null;
        const policyVersion = legalGlobal?.policyVersion ?? undefined;
        if (policyVersion != null) {
          consentWithPolicy = { ...data.consent, policyVersion };
        }
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Could not fetch Legal global for policyVersion — consent stored without it',
        );
      }
    }

    const submission: LeadSubmission = {
      formId: numericFormId,
      formSchemaVersion: data.formSchemaVersion ?? resolvedForm.schemaVersion,
      fields: data.fields,
      source: data.source,
      utm: data.utm,
      ip,
      userAgent,
      consent: consentWithPolicy,
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
          return json({ ok: true, queued: true }, { status: 202, headers: responseCors });
        }
        return json(
          { ok: false, error: 'capture_failed', reason: parked.error },
          { status: 502, headers: responseCors },
        );
      }

      // Fire `lead.submitted` to subscribed webhook destinations.
      // Payload is metadata-only: formId, dedupe flag, source — never
      // the field values (those may carry PII). Failure is logged
      // but never blocks the 200 response to the form submitter.
      try {
        await dispatchEvent(
          {
            event: 'lead.submitted',
            data: {
              formId: numericFormId,
              ...(resolvedForm.slug ? { formSlug: resolvedForm.slug } : {}),
              duplicate: result.duplicateOfLeadId != null,
              ...(submission.source ? { source: submission.source } : {}),
            },
          },
          { logger: req.payload.logger, payload: req.payload },
        );
      } catch (webhookErr) {
        req.payload.logger.warn(
          { error: webhookErr instanceof Error ? webhookErr.message : String(webhookErr) },
          'lead.submitted webhook dispatch threw',
        );
      }

      // Gated-resource flow: if the submission was made in the context of
      // a Resources row whose gateForm matches this form, mint a short-
      // lived signed download token and append it (plus an unlock cookie)
      // to the response. Non-gated submissions fall through unchanged.
      const responseHeaders: Record<string, string> = { ...responseCors };
      let downloadPayload: { url: string; expiresAt: number } | undefined;
      const resourceIdRaw = data.context?.resourceId;
      if (resourceIdRaw != null) {
        try {
          const resourceDoc = (await req.payload.findByID({
            collection: 'resources',
            id: resourceIdRaw as string | number,
            depth: 0,
            overrideAccess: true,
          })) as {
            id: string | number;
            slug?: string | null;
            gated?: boolean | null;
            gateForm?: number | string | { id?: number | string } | null;
          } | null;

          if (resourceDoc && resourceDoc.gated === true && resourceDoc.slug) {
            const gateFormId =
              typeof resourceDoc.gateForm === 'object' && resourceDoc.gateForm !== null
                ? resourceDoc.gateForm.id
                : resourceDoc.gateForm;
            const gateFormNumeric =
              typeof gateFormId === 'number'
                ? gateFormId
                : Number.parseInt(String(gateFormId ?? ''), 10);
            if (Number.isInteger(gateFormNumeric) && gateFormNumeric === numericFormId) {
              const secret = process.env.PAYLOAD_SECRET;
              if (secret) {
                const { token, expiresAt } = signDownloadToken({
                  resourceId: resourceDoc.id,
                  secret,
                });
                downloadPayload = {
                  url: `/api/resources/${resourceDoc.slug}/download?token=${token}`,
                  expiresAt,
                };
                responseHeaders['set-cookie'] = buildUnlockCookieHeader({
                  resourceId: resourceDoc.id,
                  cookieHeader: req.headers.get('cookie'),
                  secret,
                  secure: process.env.NODE_ENV === 'production',
                });
              }
            }
          }
        } catch (err) {
          req.payload.logger.warn(
            { err: err instanceof Error ? err.message : String(err), resourceIdRaw },
            'Gated resource lookup failed — lead saved, no token issued',
          );
        }
      }

      return json(
        {
          ok: true,
          duplicate: result.duplicateOfLeadId != null,
          ...(downloadPayload ? { download: downloadPayload } : {}),
        },
        { headers: responseHeaders },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      const parked = await parkSubmission(submission, `endpoint-threw: ${message}`);
      if (parked.ok) {
        req.payload.logger.warn(
          { err: message, key: parked.key, sink: parked.sink },
          'Lead parked in fallback queue — endpoint threw',
        );
        return json({ ok: true, queued: true }, { status: 202, headers: responseCors });
      }
      req.payload.logger.error({ err: message }, 'Lead submission failed and parking failed');
      return json(
        { ok: false, error: 'internal_error' },
        { status: 500, headers: responseCors },
      );
    }
  },
};
