import * as Sentry from '@sentry/nextjs';
import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { createHubspotDeal } from '../lib/deal-registrations/hubspot-deal';
import { buildDealRegistrationNotificationEmail } from '../lib/deal-registrations/notification-email';
import { dealRegistrationSchema } from '../lib/deal-registrations/schema';
import { sendBrevoEmail } from '../lib/email/brevo';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export const DEAL_REG_SUBMIT_MAX_BYTES = 64 * 1024;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
];
const allowedOrigins = (): string[] => {
  const raw = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;
  if (!raw || raw.trim().length === 0) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
};
const isAllowedOrigin = (origin: string | null): origin is string =>
  origin != null && allowedOrigins().includes(origin);
const corsHeaders = (origin: string): Record<string, string> => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  // The web client fetches with credentials:'include'; a cross-origin
  // (www → cms) response is rejected by the browser without this.
  'access-control-allow-credentials': 'true',
  vary: 'Origin',
});

const pipelineCfg = (): { pipeline: string; stage: string } => ({
  pipeline: process.env.HUBSPOT_DEAL_PIPELINE ?? 'default',
  stage: process.env.HUBSPOT_DEAL_STAGE ?? 'appointmentscheduled',
});

/** Internal recipients (CSV) for the deal-registration notification email. */
const notifyEmails = (): string[] => {
  const raw = process.env.DEAL_REG_NOTIFY_EMAILS;
  if (!raw || raw.trim().length === 0) return [];
  return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
};

export const dealRegistrationApplyOptionsEndpoint: Endpoint = {
  path: '/apply',
  method: 'options',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

export const dealRegistrationApplyEndpoint: Endpoint = {
  path: '/apply',
  method: 'post',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (origin != null && !isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    }
    const cors = isAllowedOrigin(origin) ? corsHeaders(origin) : {};

    const contentLengthRaw = req.headers.get('content-length');
    if (contentLengthRaw != null) {
      const contentLength = Number.parseInt(contentLengthRaw, 10);
      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return json({ ok: false, error: 'invalid_content_length' }, { status: 400, headers: cors });
      }
      if (contentLength > DEAL_REG_SUBMIT_MAX_BYTES) {
        return json({ ok: false, error: 'payload_too_large', limit: DEAL_REG_SUBMIT_MAX_BYTES }, { status: 413, headers: cors });
      }
    }

    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`deal-reg:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000) },
        { status: 429, headers: cors },
      );
    }

    let body: unknown;
    try {
      if (contentLengthRaw == null && typeof req.arrayBuffer === 'function') {
        const buf = await req.arrayBuffer();
        if (buf.byteLength > DEAL_REG_SUBMIT_MAX_BYTES) {
          return json({ ok: false, error: 'payload_too_large', limit: DEAL_REG_SUBMIT_MAX_BYTES }, { status: 413, headers: cors });
        }
        const text = new TextDecoder().decode(buf);
        body = text.length === 0 ? null : JSON.parse(text);
      } else {
        body = req.json ? await req.json() : null;
      }
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400, headers: cors });
    }

    const parsed = dealRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { ok: false, error: 'invalid_body', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        { status: 400, headers: cors },
      );
    }
    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Honeypot — silent 200, persist flagged row without contacting HubSpot.
    if (typeof data.hp === 'string' && data.hp.trim().length > 0) {
      req.payload.logger.info({ ip }, 'Deal registration flagged — honeypot tripped');
      try {
        await req.payload.create({
          collection: 'deal-registrations',
          data: {
            partnerName: data.partnerName,
            partnerRepFirstName: data.partnerRep.firstName,
            partnerRepLastName: data.partnerRep.lastName,
            partnerRepEmail: data.partnerRep.email,
            partnerRepPhone: data.partnerRep.phone ?? null,
            prospectFirstName: data.prospect.firstName,
            prospectLastName: data.prospect.lastName,
            prospectEmail: data.prospect.email,
            prospectPhone: data.prospect.phone ?? null,
            dealDetails: data.dealDetails ?? null,
            source: data.source ?? null,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            honeypot: data.hp,
            turnstilePassed: false,
            hubspotSync: { status: 'skipped', attempts: 0 },
          },
          overrideAccess: true,
        });
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Failed to persist honeypot deal-registration row',
        );
      }
      return json({ ok: true }, { headers: cors });
    }

    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      return json({ ok: false, error: 'turnstile_failed', reason: turnstile.reason }, { status: 403, headers: cors });
    }

    // Inject live policyVersion into the consent snapshot.
    let policyVersion: string | undefined;
    if (data.consent != null) {
      try {
        const legal = (await req.payload.findGlobal({ slug: 'legal', depth: 0, overrideAccess: true })) as
          | { policyVersion?: string | null }
          | null;
        policyVersion = legal?.policyVersion ?? undefined;
      } catch (err) {
        Sentry.captureException(err, { tags: { form: 'deal-registration', stage: 'policy-version-fetch' }, level: 'warning' });
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Could not read Legal global for policyVersion',
        );
      }
    }

    const sync = await createHubspotDeal(req.payload, data, pipelineCfg());

    try {
      await req.payload.create({
        collection: 'deal-registrations',
        data: {
          partnerName: data.partnerName,
          partnerRepFirstName: data.partnerRep.firstName,
          partnerRepLastName: data.partnerRep.lastName,
          partnerRepEmail: data.partnerRep.email,
          partnerRepPhone: data.partnerRep.phone ?? null,
          prospectFirstName: data.prospect.firstName,
          prospectLastName: data.prospect.lastName,
          prospectEmail: data.prospect.email,
          prospectPhone: data.prospect.phone ?? null,
          dealDetails: data.dealDetails ?? null,
          source: data.source ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          consentGivenAt: data.consent?.givenAt ?? null,
          consentSnapshot: data.consent?.snapshot ?? null,
          privacyPolicyVersion: policyVersion ?? null,
          consentCategories: (data.consent?.categories ?? []).map((category) => ({ category })),
          hubspotSync: {
            status: sync.status,
            dealId: sync.status === 'synced' ? sync.dealId : null,
            error: sync.status === 'failed' ? sync.error : null,
            attempts: 1,
            lastAttemptAt: new Date().toISOString(),
          },
          turnstilePassed: true,
        },
        overrideAccess: true,
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { form: 'deal-registration', stage: 'db-create' } });
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Deal registration create failed',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    // Best-effort internal notification to the team (both marketing + Anil get
    // the identical HTML email). Never blocks or fails the 200 — the durable
    // deal-registrations row is already persisted above.
    const recipients = notifyEmails();
    if (recipients.length > 0) {
      try {
        const { subject, htmlContent } = buildDealRegistrationNotificationEmail({
          partnerName: data.partnerName,
          partnerRep: data.partnerRep,
          prospect: data.prospect,
          dealDetails: data.dealDetails,
          dealId: sync.status === 'synced' ? sync.dealId : undefined,
          portalId: process.env.HUBSPOT_PORTAL_ID,
        });
        const result = await sendBrevoEmail({
          to: recipients.map((email) => ({ email })),
          // Send from the marketing identity, not the global "CleanStart Careers"
          // sender name shared with the careers form.
          senderName: process.env.DEAL_REG_SENDER_NAME?.trim() || 'CleanStart',
          replyTo: { email: data.partnerRep.email, name: `${data.partnerRep.firstName} ${data.partnerRep.lastName}`.trim() },
          subject,
          htmlContent,
        });
        if (result.status === 'failed') {
          req.payload.logger.warn(
            { error: result.error },
            'Deal registration notification email failed',
          );
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { form: 'deal-registration', stage: 'notify-email' },
          level: 'warning',
        });
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Deal registration notification email threw',
        );
      }
    }

    return json({ ok: true }, { headers: cors });
  },
};
