import * as Sentry from '@sentry/nextjs';
import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { type BrevoSendResult, sendBrevoEmail } from '../lib/email/brevo';
import { buildPartnerAdminEmail, buildPartnerApplicantEmail } from '../lib/partners/partner-emails';
import { partnerSubmissionSchema } from '../lib/partners/partner-schema';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export const PARTNER_SUBMIT_MAX_BYTES = 64 * 1024;

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
  vary: 'Origin',
});

const numericTemplateId = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const partnerApplyOptionsEndpoint: Endpoint = {
  path: '/apply',
  method: 'options',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

export const partnerApplyEndpoint: Endpoint = {
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
      if (contentLength > PARTNER_SUBMIT_MAX_BYTES) {
        return json({ ok: false, error: 'payload_too_large', limit: PARTNER_SUBMIT_MAX_BYTES }, { status: 413, headers: cors });
      }
    }

    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`partners:${ip}`, DEFAULT_RATE_LIMITS);
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
        if (buf.byteLength > PARTNER_SUBMIT_MAX_BYTES) {
          return json({ ok: false, error: 'payload_too_large', limit: PARTNER_SUBMIT_MAX_BYTES }, { status: 413, headers: cors });
        }
        const text = new TextDecoder().decode(buf);
        body = text.length === 0 ? null : JSON.parse(text);
      } else {
        body = req.json ? await req.json() : null;
      }
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400, headers: cors });
    }

    const parsed = partnerSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { ok: false, error: 'invalid_body', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        { status: 400, headers: cors },
      );
    }
    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Honeypot — silent 200, persist flagged row without sending email.
    if (typeof data.hp === 'string' && data.hp.trim().length > 0) {
      req.payload.logger.info({ ip }, 'Partner submission flagged — honeypot tripped');
      try {
        await req.payload.create({
          collection: 'partner-applications',
          data: {
            firstName: data.firstName, lastName: data.lastName, email: data.email,
            company: data.company, phone: data.phone ?? null, website: data.website ?? null,
            partnerReason: data.partnerReason ?? null, source: data.source ?? null,
            ip: ip ?? null, userAgent: userAgent ?? null, honeypot: data.hp, turnstilePassed: false,
          },
          overrideAccess: true,
        });
      } catch (err) {
        req.payload.logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Failed to persist honeypot partner row');
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
        const legal = (await req.payload.findGlobal({ slug: 'legal', depth: 0, overrideAccess: true })) as { policyVersion?: string | null } | null;
        policyVersion = legal?.policyVersion ?? undefined;
      } catch (err) {
        Sentry.captureException(err, { tags: { form: 'partner', stage: 'policy-version-fetch' }, level: 'warning' });
        req.payload.logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Could not read Legal global for policyVersion');
      }
    }

    const emailInput = {
      firstName: data.firstName, lastName: data.lastName, email: data.email,
      phone: data.phone, company: data.company, website: data.website, partnerReason: data.partnerReason,
    };
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const submittedAt = new Date().toISOString();
    const params = {
      firstName: data.firstName, lastName: data.lastName, fullName,
      email: data.email, phone: data.phone ?? '', company: data.company,
      website: data.website ?? '', partnerReason: data.partnerReason ?? '', submittedAt,
    };
    const adminTemplate = numericTemplateId(process.env.PARTNER_ADMIN_TEMPLATE_ID);
    const userTemplate = numericTemplateId(process.env.PARTNER_USER_TEMPLATE_ID);
    const adminEmail = process.env.PARTNERS_NOTIFY_EMAIL;

    // Partner emails are sent from the partner sender identity (falls back to
    // the global BREVO_SENDER_* env when PARTNERS_SENDER_* is unset).
    const partnerSender: { senderEmail?: string; senderName?: string } = {
      ...(process.env.PARTNERS_SENDER_EMAIL ? { senderEmail: process.env.PARTNERS_SENDER_EMAIL } : {}),
      ...(process.env.PARTNERS_SENDER_NAME ? { senderName: process.env.PARTNERS_SENDER_NAME } : {}),
    };

    // Admin notification (non-fatal).
    let adminDelivery: BrevoSendResult;
    if (!adminEmail) {
      adminDelivery = { status: 'skipped', reason: 'no-admin-recipient' };
    } else if (adminTemplate != null) {
      adminDelivery = await sendBrevoEmail({
        ...partnerSender,
        to: [{ email: adminEmail }], replyTo: { email: data.email, name: fullName },
        templateId: adminTemplate, params,
      });
    } else {
      const { subject, htmlContent } = buildPartnerAdminEmail(emailInput);
      adminDelivery = await sendBrevoEmail({ ...partnerSender, to: [{ email: adminEmail }], replyTo: { email: data.email, name: fullName }, subject, htmlContent });
    }

    // Applicant confirmation (non-fatal). replyTo = the partnerships inbox when set.
    let applicantDelivery: BrevoSendResult;
    const applicantReplyTo = adminEmail ? { email: adminEmail } : undefined;
    if (userTemplate != null) {
      applicantDelivery = await sendBrevoEmail({
        ...partnerSender,
        to: [{ email: data.email, name: fullName }],
        ...(applicantReplyTo ? { replyTo: applicantReplyTo } : {}),
        templateId: userTemplate, params,
      });
    } else {
      const { subject, htmlContent } = buildPartnerApplicantEmail(emailInput);
      applicantDelivery = await sendBrevoEmail({
        ...partnerSender,
        to: [{ email: data.email, name: fullName }],
        ...(applicantReplyTo ? { replyTo: applicantReplyTo } : {}),
        subject, htmlContent,
      });
    }

    const deliveryToFields = (d: BrevoSendResult) => ({
      status: d.status,
      messageId: 'messageId' in d ? (d.messageId ?? null) : null,
      error: d.status === 'failed' ? d.error : null,
    });

    try {
      await req.payload.create({
        collection: 'partner-applications',
        data: {
          firstName: data.firstName, lastName: data.lastName, email: data.email,
          phone: data.phone ?? null, company: data.company, website: data.website ?? null,
          partnerReason: data.partnerReason ?? null, source: data.source ?? null,
          ip: ip ?? null, userAgent: userAgent ?? null,
          consentGivenAt: data.consent?.givenAt ?? null,
          consentSnapshot: data.consent?.snapshot ?? null,
          privacyPolicyVersion: policyVersion ?? null,
          consentCategories: (data.consent?.categories ?? []).map((category) => ({ category })),
          emailDeliveryApplicant: deliveryToFields(applicantDelivery),
          emailDeliveryAdmin: deliveryToFields(adminDelivery),
          turnstilePassed: true,
        },
        overrideAccess: true,
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { form: 'partner', stage: 'db-create' } });
      req.payload.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Partner application create failed');
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
