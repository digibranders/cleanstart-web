# Partner Applications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture "Become a Partner" submissions into a dedicated CMS collection (off HubSpot), email both the applicant and an internal admin via Brevo, give editors a list + readonly detail view + CSV export button, and support DSAR erasure by email.

**Architecture:** A `partner-applications` append-only collection + a JSON `POST /api/partner-applications/apply` endpoint mirroring `submit-lead.ts` security; two Brevo emails via the existing dual-mode `sendBrevoEmail`; a CSV export endpoint + admin button mirroring `export-leads-csv.ts`; DSAR erasure wired into the existing endpoint. No file upload, no retention cron.

**Tech Stack:** Payload 3.81 · Next.js 16 · Brevo `/v3/smtp/email` · Zod · Vitest · Playwright.

**Branch:** `development`. **Reference spec:** `docs/superpowers/specs/2026-06-03-partner-applications-design.md`. **Pattern source:** the careers system (`CareerApplications.ts`, `careers-apply.ts`, `lib/email/brevo.ts`, `lib/careers/hr-email.ts`, `export-leads-csv.ts`).

**Conventions:** TS strict, no `any`, explicit return types on exports, Zod at boundaries, distinguish `undefined`/`null`. After any collection change run `pnpm --filter @cleanstart/cms generate:types` and commit. Never hand-edit `payload-types.ts`/`importMap.js` (regenerate). Per-task checks: `pnpm --filter @cleanstart/cms lint` · `typecheck` · `test` (when tests touched) · `build`. Stage specific paths, never `git add -A`.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/cms/src/payload/collections/PartnerApplications.ts` (create) | record + endpoint/export mount |
| `apps/cms/src/payload/lib/partners/partner-schema.ts` (create) | Zod for the apply payload |
| `apps/cms/src/payload/lib/partners/partner-emails.ts` (create) | applicant + admin HTML builders |
| `apps/cms/src/payload/lib/partners/dsar.ts` (create) | erasure by email |
| `apps/cms/src/payload/endpoints/partner-apply.ts` (create) | JSON intake, validation, two-email orchestration |
| `apps/cms/src/payload/endpoints/export-partners-csv.ts` (create) | CSV export + audit |
| `apps/cms/src/payload/admin/components/PartnersExportButton.tsx` (create) | list-view export trigger |
| `apps/cms/src/payload.config.ts` (modify) | register collection |
| `apps/cms/src/payload/endpoints/leads-dsar.ts` (modify) | cascade erasure to partners |
| `apps/cms/scripts/seed-website-forms.ts` (modify) | remove `become-a-partner` HubSpot row |
| `apps/web/src/lib/partners/submitPartner.ts` (create) | JSON transport helper |
| `apps/web/src/components/sections/partners/BecomePartnerCta.tsx` (modify) | swap submit target off HubSpot |
| `docs/email-templates/brevo-partner-user-confirmation.html` (create) | applicant Brevo template |
| `docs/email-templates/brevo-partner-admin-notification.html` (create) | admin Brevo template |
| docs (modify/create) | `.env.example`, `CLAUDE.md`, `GDPR-COMPLIANCE.md`, `WEB-PAGES.md`, `docs/features/partner-applications.md` |

---

## Task 1: `partner-applications` collection

**Files:**
- Create: `apps/cms/src/payload/collections/PartnerApplications.ts`
- Modify: `apps/cms/src/payload.config.ts`

Note: endpoints (`partnerApplyEndpoint`, `partnerApplyOptionsEndpoint`, `exportPartnersCsvEndpoint`) are created in Tasks 4 & 5; mount them then. This task ships the collection with `endpoints: []`.

- [ ] **Step 1: Create the collection**

`apps/cms/src/payload/collections/PartnerApplications.ts`:

```ts
import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

const DELIVERY_STATUSES: { label: string; value: string }[] = [
  { label: 'Sent', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (not configured)', value: 'skipped' },
];

const deliveryGroup = (name: string, label: string) =>
  ({
    type: 'group' as const,
    name,
    label,
    admin: { readOnly: true },
    fields: [
      { name: 'status', type: 'select' as const, options: DELIVERY_STATUSES },
      { name: 'messageId', type: 'text' as const },
      { name: 'error', type: 'text' as const },
    ],
  });

/**
 * Partner ("Become a Partner") submissions — append-only. Created exclusively
 * by the partner-apply endpoint (overrideAccess); the public never POSTs here
 * directly. Entirely separate from the leads/HubSpot pipeline. Two Brevo emails
 * (applicant confirmation + admin notification) are sent at submit time; their
 * results are recorded on `emailDelivery`. PII is erased on DSAR request only —
 * there is no time-based purge cron.
 */
export const PartnerApplications: CollectionConfig = {
  slug: 'partner-applications',
  labels: { singular: 'Partner Inquiry', plural: 'Partner Inquiries' },
  admin: {
    group: 'Marketing',
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'company', 'emailDelivery', 'createdAt'],
    description: 'Partner inquiries (append-only). Submitted via the Become-a-Partner form; emailed to the team via Brevo.',
    components: {
      beforeListTable: ['@/payload/admin/components/PartnersExportButton.tsx#PartnersExportButton'],
    },
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'company', type: 'text', required: true },
    {
      name: 'website',
      type: 'text',
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    { name: 'partnerReason', type: 'textarea' },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'consentCategories',
      type: 'array',
      admin: { readOnly: true },
      fields: [{ name: 'category', type: 'text' }],
    },
    deliveryGroup('emailDeliveryApplicant', 'Applicant email'),
    deliveryGroup('emailDeliveryAdmin', 'Admin email'),
    { name: 'honeypot', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'turnstilePassed',
      type: 'checkbox',
      defaultValue: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'piiRedactedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
};
```

Note: two flat delivery groups (`emailDeliveryApplicant` / `emailDeliveryAdmin`) rather than a nested `emailDelivery.applicant` — flat groups keep the generated SQL columns simple and the list column (`emailDelivery` won't exist; use `emailDeliveryApplicant` in defaultColumns instead). **Update `defaultColumns`** to `['firstName', 'lastName', 'email', 'company', 'emailDeliveryApplicant', 'createdAt']`.

- [ ] **Step 2: Fix the defaultColumns reference**

In the file above, set:
```ts
    defaultColumns: ['firstName', 'lastName', 'email', 'company', 'emailDeliveryApplicant', 'createdAt'],
```

- [ ] **Step 3: Register the collection**

In `apps/cms/src/payload.config.ts`: add `import { PartnerApplications } from './payload/collections/PartnerApplications';` and add `PartnerApplications` to the `collections` array (next to `Leads`).

- [ ] **Step 4: Regenerate types + importmap, then verify**

Run:
```bash
pnpm --filter @cleanstart/cms generate:importmap
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms typecheck
```
Expected: `payload-types.ts` gains a `PartnerApplication` interface; importMap includes `PartnersExportButton`; typecheck passes (the button + endpoints are created later — the importMap string reference is fine before the component exists, but typecheck only covers `.ts`; if `next build` is run before Task 6 it will fail on the missing component, so defer `build` to Task 6).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/PartnerApplications.ts apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): add append-only partner-applications collection"
```

---

## Task 2: Partner submission Zod schema

**Files:**
- Create: `apps/cms/src/payload/lib/partners/partner-schema.ts`
- Test: `apps/cms/src/payload/lib/partners/partner-schema.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/partners/partner-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { partnerSubmissionSchema } from './partner-schema';

const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@acme.com',
  phone: '+1 555 0100',
  company: 'Acme',
  website: 'https://acme.com',
  partnerReason: 'We want to integrate.',
};

describe('partnerSubmissionSchema', () => {
  it('accepts a valid payload', () => {
    expect(partnerSubmissionSchema.safeParse(valid).success).toBe(true);
  });
  it('requires firstName, lastName, email, company', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(partnerSubmissionSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
    expect(partnerSubmissionSchema.safeParse({ ...valid, company: '' }).success).toBe(false);
  });
  it('allows optional fields to be omitted', () => {
    expect(
      partnerSubmissionSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'a@b.com', company: 'C' }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test partner-schema`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/partners/partner-schema.ts`:

```ts
import { z } from 'zod';

export const partnerSubmissionSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  company: z.string().min(1).max(200),
  website: z.string().max(500).optional(),
  partnerReason: z.string().max(5000).optional(),
  source: z.string().max(2048).optional(),
  consent: z
    .object({
      snapshot: z.string().max(2000),
      givenAt: z.string().max(40),
      categories: z.array(z.string().max(40)).max(10).optional(),
    })
    .optional(),
  turnstileToken: z.string().max(2048).optional(),
  hp: z.string().max(2048).optional(), // honeypot (named `hp` to avoid colliding with the real `website` field)
});

export type PartnerSubmission = z.infer<typeof partnerSubmissionSchema>;
```

Note: `website` is `.optional()` not `.url()` — the endpoint stores it and the collection's `validateOptionalUrl` hook normalises it; a hard URL requirement here would reject `acme.com` without a scheme.

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test partner-schema`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/partners/partner-schema.ts apps/cms/src/payload/lib/partners/partner-schema.test.ts
git commit -m "feat(cms): partner submission Zod schema"
```

---

## Task 3: Partner email builders (applicant + admin)

**Files:**
- Create: `apps/cms/src/payload/lib/partners/partner-emails.ts`
- Test: `apps/cms/src/payload/lib/partners/partner-emails.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/partners/partner-emails.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildPartnerAdminEmail, buildPartnerApplicantEmail } from './partner-emails';

const base = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@acme.com',
  phone: '+1 555 0100',
  company: 'Acme',
  website: 'https://acme.com',
  partnerReason: 'We want to integrate.',
};

describe('partner email builders', () => {
  it('admin email lists the email + escapes HTML in user input', () => {
    const { htmlContent } = buildPartnerAdminEmail({ ...base, company: '<script>' });
    expect(htmlContent).toContain('ada@acme.com');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).not.toContain('<script>');
  });

  it('admin subject names the company', () => {
    expect(buildPartnerAdminEmail(base).subject).toContain('Acme');
  });

  it('applicant email greets by first name and omits absent optional rows', () => {
    const { subject, htmlContent } = buildPartnerApplicantEmail({ ...base, phone: undefined, partnerReason: undefined });
    expect(subject.length).toBeGreaterThan(0);
    expect(htmlContent).toContain('Ada');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test partner-emails`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/partners/partner-emails.ts`:

```ts
export type PartnerEmailInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  company: string;
  website?: string | undefined;
  partnerReason?: string | undefined;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const row = (label: string, value: string | undefined): string =>
  value && value.trim().length > 0
    ? `<tr><td style="padding:4px 12px 4px 0;color:#555;font-weight:600;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`
    : '';

/** Internal admin notification — all submitted details. */
export const buildPartnerAdminEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const subject = `New partner inquiry — ${input.company} — ${fullName}`;
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
<h2 style="margin:0 0 12px;">New partner inquiry</h2>
<p style="margin:0 0 16px;"><strong>${escapeHtml(fullName)}</strong> from <strong>${escapeHtml(input.company)}</strong> wants to partner with CleanStart.</p>
<table style="border-collapse:collapse;">
${row('Name', fullName)}
${row('Email', input.email)}
${row('Phone', input.phone)}
${row('Company', input.company)}
${row('Website', input.website)}
</table>
${input.partnerReason && input.partnerReason.trim().length > 0 ? `<h3 style="margin:20px 0 6px;">Why partner</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.partnerReason)}</p>` : ''}
</body></html>`;
  return { subject, htmlContent };
};

/** Applicant confirmation — friendly acknowledgement. */
export const buildPartnerApplicantEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => {
  const subject = 'Thanks for your interest in partnering with CleanStart';
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;">
<h2 style="margin:0 0 12px;">Thanks, ${escapeHtml(input.firstName)}!</h2>
<p style="margin:0 0 12px;">We've received your partnership inquiry for <strong>${escapeHtml(input.company)}</strong>. Our partnerships team will review it and get back to you shortly.</p>
<p style="margin:0;color:#555;">— The CleanStart team</p>
</body></html>`;
  return { subject, htmlContent };
};
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test partner-emails`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/partners/partner-emails.ts apps/cms/src/payload/lib/partners/partner-emails.test.ts
git commit -m "feat(cms): partner applicant + admin email builders"
```

---

## Task 4: Partner apply endpoint (JSON, two emails) + mount

**Files:**
- Create: `apps/cms/src/payload/endpoints/partner-apply.ts`
- Modify: `apps/cms/src/payload/collections/PartnerApplications.ts` (mount endpoints)

- [ ] **Step 1: Implement the endpoint**

`apps/cms/src/payload/endpoints/partner-apply.ts`:

```ts
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
  'https://staging.cleanstart.com',
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

    // Admin notification (non-fatal).
    let adminDelivery: BrevoSendResult;
    if (!adminEmail) {
      adminDelivery = { status: 'skipped', reason: 'no-admin-recipient' };
    } else if (adminTemplate != null) {
      adminDelivery = await sendBrevoEmail({
        to: [{ email: adminEmail }], replyTo: { email: data.email, name: fullName },
        templateId: adminTemplate, params,
      });
    } else {
      const { subject, htmlContent } = buildPartnerAdminEmail(emailInput);
      adminDelivery = await sendBrevoEmail({ to: [{ email: adminEmail }], replyTo: { email: data.email, name: fullName }, subject, htmlContent });
    }

    // Applicant confirmation (non-fatal). replyTo = the partnerships inbox when set.
    let applicantDelivery: BrevoSendResult;
    const applicantReplyTo = adminEmail ? { email: adminEmail } : undefined;
    if (userTemplate != null) {
      applicantDelivery = await sendBrevoEmail({
        to: [{ email: data.email, name: fullName }],
        ...(applicantReplyTo ? { replyTo: applicantReplyTo } : {}),
        templateId: userTemplate, params,
      });
    } else {
      const { subject, htmlContent } = buildPartnerApplicantEmail(emailInput);
      applicantDelivery = await sendBrevoEmail({
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
      req.payload.logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Partner application create failed');
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
```

- [ ] **Step 2: Mount the endpoints on the collection**

Edit `apps/cms/src/payload/collections/PartnerApplications.ts`:
- Add import: `import { partnerApplyEndpoint, partnerApplyOptionsEndpoint } from '../endpoints/partner-apply';`
- Add to the config (after `access`): `endpoints: [partnerApplyEndpoint, partnerApplyOptionsEndpoint],`

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: PASS. (Resolves to `POST /api/partner-applications/apply`.)

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/endpoints/partner-apply.ts apps/cms/src/payload/collections/PartnerApplications.ts
git commit -m "feat(cms): partner apply endpoint (JSON, applicant + admin Brevo emails)"
```

---

## Task 5: CSV export endpoint + mount

**Files:**
- Create: `apps/cms/src/payload/endpoints/export-partners-csv.ts`
- Modify: `apps/cms/src/payload/collections/PartnerApplications.ts` (add to endpoints)

- [ ] **Step 1: Implement the export endpoint**

`apps/cms/src/payload/endpoints/export-partners-csv.ts`:

```ts
import type { Endpoint } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { toCsv } from '../lib/csv';
import { extractRequestMeta } from '../lib/request-meta';

export const PARTNER_CSV_PAGE_SIZE = 200;
export const PARTNER_CSV_HARD_CAP_PAGES = 100;
export const PARTNER_CSV_HARD_CAP_ROWS = PARTNER_CSV_PAGE_SIZE * PARTNER_CSV_HARD_CAP_PAGES;

const HEADERS = [
  'id', 'createdAt', 'firstName', 'lastName', 'email', 'phone', 'company', 'website',
  'partnerReason', 'consentGivenAt', 'privacyPolicyVersion', 'consentCategories',
  'emailDeliveryApplicant', 'emailDeliveryAdmin',
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
  consentCategories: (row.consentCategories ?? []).map((c) => c.category ?? '').filter(Boolean).join('; '),
  emailDeliveryApplicant: row.emailDeliveryApplicant?.status ?? '',
  emailDeliveryAdmin: row.emailDeliveryAdmin?.status ?? '',
});

const todayStamp = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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
        typeof rawActorId === 'number' ? rawActorId
          : typeof rawActorId === 'string' ? Number.parseInt(rawActorId, 10) : null;
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
```

Note: the `audit-log` `action` field is a select — confirm `partner_exported` is an allowed value; if the collection enumerates actions, add `partner_exported` (and `dsar_erasure` already exists) to `collections/audit-log.ts` options in this task. Check `apps/cms/src/payload/collections/audit-log.ts` for an `action` options list and extend it if present (regenerate types after).

- [ ] **Step 2: Add `partner_exported` to the audit-log action options (if enumerated)**

Read `apps/cms/src/payload/collections/audit-log.ts`. If the `action` field is a `select` with an `options` array, add `{ label: 'Partner exported', value: 'partner_exported' }`. If it's a free-text field, no change needed. Regenerate types if changed.

- [ ] **Step 3: Mount on the collection**

Edit `PartnerApplications.ts` endpoints array → `[partnerApplyEndpoint, partnerApplyOptionsEndpoint, exportPartnersCsvEndpoint]` and import `exportPartnersCsvEndpoint`.

- [ ] **Step 4: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/endpoints/export-partners-csv.ts apps/cms/src/payload/collections/PartnerApplications.ts apps/cms/src/payload/collections/audit-log.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): partner CSV export endpoint + audit"
```

---

## Task 6: Partners export button (admin)

**Files:**
- Create: `apps/cms/src/payload/admin/components/PartnersExportButton.tsx`

Reference the existing client component pattern in `apps/cms/src/payload/admin/components/FlaggedLeadsTab.tsx` (`'use client'`, `useConfig` for `serverURL`, `cs-btn` classes).

- [ ] **Step 1: Implement the component**

`apps/cms/src/payload/admin/components/PartnersExportButton.tsx`:

```tsx
'use client';

import { useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

/**
 * "Export CSV" button above the partner-applications list. Fetches the export
 * endpoint with credentials, turns the response into a Blob, and triggers a
 * browser download. Mounted via beforeListTable.
 */
export const PartnersExportButton = (): ReactElement => {
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);
  const serverURL = config?.serverURL ?? '';

  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`${serverURL}/api/partner-applications/export-csv`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Export failed. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partners-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (res.headers.get('x-partners-truncated') === 'true') {
        alert(`Export truncated at ${res.headers.get('x-partners-truncated-at')} rows.`);
      }
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [serverURL]);

  return (
    <div className="cs-partners-export">
      <button type="button" className="cs-btn cs-btn--subtle" onClick={() => void handleExport()} disabled={busy}>
        {busy ? 'Exporting…' : 'Export CSV'}
      </button>
    </div>
  );
};

export default PartnersExportButton;
```

- [ ] **Step 2: Regenerate importmap + full build**

Run:
```bash
pnpm --filter @cleanstart/cms generate:importmap
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build
```
Expected: build PASS (the importMap reference from Task 1 now resolves to a real component).

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/admin/components/PartnersExportButton.tsx "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): Export CSV button on the partner-applications list"
```

---

## Task 7: DSAR erasure for partners

**Files:**
- Create: `apps/cms/src/payload/lib/partners/dsar.ts`
- Test: `apps/cms/src/payload/lib/partners/dsar.test.ts`
- Modify: `apps/cms/src/payload/endpoints/leads-dsar.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/partners/dsar.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { deletePartnerApplicationsByEmail } from './dsar';

describe('deletePartnerApplicationsByEmail', () => {
  it('deletes all partner rows for the email and returns the count', async () => {
    const deleted: number[] = [];
    const payload = {
      find: vi.fn(async () => ({ docs: [{ id: 1 }, { id: 2 }] })),
      delete: vi.fn(async ({ id }: { id: number }) => {
        deleted.push(id);
        return { id };
      }),
      logger: { warn: vi.fn() },
    };
    const result = await deletePartnerApplicationsByEmail(payload as never, 'ada@acme.com');
    expect(result.deleted).toBe(2);
    expect(deleted).toEqual([1, 2]);
  });

  it('returns 0 when there are no matches', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [] })), delete: vi.fn(), logger: { warn: vi.fn() } };
    const result = await deletePartnerApplicationsByEmail(payload as never, 'none@acme.com');
    expect(result.deleted).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test partners/dsar`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/partners/dsar.ts`:

```ts
import type { BasePayload } from 'payload';

export type DeletePartnerApplicationsResult = { deleted: number };

/**
 * GDPR Art. 17 erasure for partner inquiries: hard-deletes every partner
 * application matching the email. No linked files to remove.
 */
export const deletePartnerApplicationsByEmail = async (
  payload: BasePayload,
  email: string,
): Promise<DeletePartnerApplicationsResult> => {
  const res = await payload.find({
    collection: 'partner-applications',
    where: { email: { equals: email } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as { id: number }[];
  let deleted = 0;
  for (const doc of docs) {
    await payload.delete({ collection: 'partner-applications', id: doc.id, overrideAccess: true });
    deleted += 1;
  }
  return { deleted };
};
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test partners/dsar`
Expected: PASS.

- [ ] **Step 5: Wire into the DSAR delete endpoint**

Read `apps/cms/src/payload/endpoints/leads-dsar.ts`. In the delete-by-email handler, after the existing leads + careers erasure, import and call `deletePartnerApplicationsByEmail(req.payload, email)`. Include the count in the response (e.g. `partnerApplicationsDeleted`). When the count > 0, write a `dsar_erasure` audit-log row with `targetCollection: 'partner-applications'`, matching the existing audit pattern in that file.

- [ ] **Step 6: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/lib/partners/dsar.ts apps/cms/src/payload/lib/partners/dsar.test.ts apps/cms/src/payload/endpoints/leads-dsar.ts
git commit -m "feat(cms): DSAR erasure cascade to partner applications"
```

---

## Task 8: Web — rewire the partner form off HubSpot

**Files:**
- Create: `apps/web/src/lib/partners/submitPartner.ts`
- Modify: `apps/web/src/components/sections/partners/BecomePartnerCta.tsx`

Reference: `apps/web/src/lib/leads/submitLead.ts` (transport shape) and the current `BecomePartnerCta.tsx` (fields, consent, Turnstile, modal, honeypot).

- [ ] **Step 1: Implement the transport helper**

`apps/web/src/lib/partners/submitPartner.ts`:

```ts
export type PartnerConsent = {
  snapshot: string;
  givenAt: string;
  categories?: string[];
};

export type SubmitPartnerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  website?: string;
  partnerReason?: string;
  source?: string;
  consent?: PartnerConsent;
  turnstileToken?: string;
  hp?: string; // honeypot
};

export type SubmitPartnerResult = { ok: true } | { ok: false; error: string };

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? '';

/**
 * Posts a partner inquiry as JSON to the CMS partner endpoint. Never sends PII
 * to any third party from the browser — only to the CMS.
 */
export const submitPartner = async (input: SubmitPartnerInput): Promise<SubmitPartnerResult> => {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/partner-applications/apply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: 'network' };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `http_${res.status}` };
  }
  return { ok: true };
};
```

- [ ] **Step 2: Rewire the form's submit handler**

In `apps/web/src/components/sections/partners/BecomePartnerCta.tsx`:
- Replace the `submitLead` import with `import { submitPartner } from '@/lib/partners/submitPartner';`.
- Remove the HubSpot `NAME_MAP` mapping. Build the payload with the clean field names the endpoint expects: `firstName, lastName, email, phone, company, website, partnerReason`.
- Map the existing form state: the "Business Email" field → `email`, "Company Name" → `company`, the "Why are you interested…" textarea → `partnerReason`, the "Website" input → `website`.
- **Rename the honeypot** field so it no longer collides with the real `website` field — send it as `hp` (the endpoint reads `hp`). Keep the hidden honeypot input but bind its value to the `hp` payload key.
- Keep the consent object (`{ snapshot, givenAt, categories }`), `turnstileToken`, and `source` (`window.location.href`).
- Call `submitPartner(payload)`; keep the existing success/error UI states.

- [ ] **Step 3: Lint + typecheck + build (web)**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/partners/submitPartner.ts apps/web/src/components/sections/partners/BecomePartnerCta.tsx
git commit -m "feat(web): route the partner form to the dedicated CMS endpoint (off HubSpot)"
```

---

## Task 9: Brevo HTML templates (deliverables)

**Files:**
- Create: `docs/email-templates/brevo-partner-user-confirmation.html`
- Create: `docs/email-templates/brevo-partner-admin-notification.html`

Base both on `docs/email-templates/brevo-careers-hr-notification.html` — reuse its logo header (`https://cdn.cleanstart.com/emails/social-icons/cleanstart-logo.png`) and the social-icon + address footer (`Cleanstart Inc. · 16192 Coastal Highway, Lewes, Delware 19958, US`). **Comments must be tag-free** — never write literal `{{ }}` or `{% %}` inside an HTML comment (Brevo parses comments and aborts on a bare tag).

- [ ] **Step 1: Admin notification template**

`docs/email-templates/brevo-partner-admin-notification.html`: header logo + "New partner inquiry" + a Position-style callout for the **company**, an Applicant table (`{{ params.fullName }}`, `{{ params.email }}`, `{% if params.phone %}…{% endif %}`, `{% if params.website %}…{% endif %}`, `{% if params.submittedAt %}…{% endif %}`), a `{% if params.partnerReason %}` "Why partner" block, a "Reply to {{ params.firstName }}" mailto button, then the shared footer. Suggested subject (set in Brevo): `New partner inquiry: {{ params.company }} — {{ params.fullName }}`.

- [ ] **Step 2: Applicant confirmation template**

`docs/email-templates/brevo-partner-user-confirmation.html`: header logo + "Thanks, {{ params.firstName }}!" + a short paragraph acknowledging the inquiry for `{{ params.company }}` and that the team will follow up, then the shared footer. Suggested subject: `Thanks for your interest in partnering with CleanStart`.

- [ ] **Step 3: Validate (tag-free comments, balanced conditionals)**

Run, for each file:
```bash
f=docs/email-templates/brevo-partner-admin-notification.html
sed -n '1,25p' "$f" | grep -cE '\{\{|\{%'   # expect 0 (no tags in the top comment)
grep -oE '\{%[^%]*%\}' "$f" | sort | uniq -c  # every {% if %} has a condition; endifs balance
```
Expected: 0 tags in the comment; balanced `{% if params.X %}` / `{% endif %}`.

- [ ] **Step 4: Commit**

```bash
git add docs/email-templates/brevo-partner-user-confirmation.html docs/email-templates/brevo-partner-admin-notification.html
git commit -m "docs(email): Brevo partner applicant + admin notification templates"
```

---

## Task 10: Unwire HubSpot seed, migration, env, docs

**Files:**
- Modify: `apps/cms/scripts/seed-website-forms.ts`
- Create: migration under `apps/cms/src/migrations/`
- Modify: `apps/cms/.env.example`, `CLAUDE.md`, `docs/operations/GDPR-COMPLIANCE.md`, `docs/web/WEB-PAGES.md`
- Create: `docs/features/partner-applications.md`

- [ ] **Step 1: Remove the partner row from the form seed**

In `apps/cms/scripts/seed-website-forms.ts`, delete the `become-a-partner` object from the `FORMS` array (the web form no longer routes through `forms`/HubSpot). Leave the other four forms unchanged.

- [ ] **Step 2: Generate the migration (avoid prefix churn)**

The new collection needs a `partner_applications` table. Generate with the committed R2 resume prefix to avoid the storage-plugin prefix non-determinism leaking in:

```bash
cd apps/cms
R2_RESUME_PREFIX=dev/resumes pnpm exec payload migrate:create add_partner_applications
```
Then:
- Confirm the migration's UP creates `partner_applications` (+ `email_delivery_*` enums) and contains **no** `resumes.prefix` ALTER. If a stray prefix ALTER appears, regenerate with the env above.
- Fix the generated file's unused-param quirk: change `import { MigrateUpArgs, MigrateDownArgs, sql }` → `import { type MigrateUpArgs, type MigrateDownArgs, sql }` and the function signatures to `({ db }: MigrateUpArgs)` / `({ db }: MigrateDownArgs)`.
- Verify the new migration is referenced in `apps/cms/src/migrations/index.ts` (no orphans).

- [ ] **Step 3: Add env vars to `.env.example`**

Append to `apps/cms/.env.example` (annotated, no secrets):
```bash
# Partner form (Brevo). Two transactional templates: one for the applicant
# confirmation, one for the internal team notification. Unset template IDs →
# code-built HTML fallback. Sends are skipped without BREVO_API_KEY.
PARTNER_USER_TEMPLATE_ID=
PARTNER_ADMIN_TEMPLATE_ID=
# Recipient for the internal new-partner-inquiry notification.
PARTNERS_NOTIFY_EMAIL=
```

- [ ] **Step 4: Update `CLAUDE.md`**

In the **Live integrations** Brevo row, extend the purpose to include partner-form email (applicant confirmation + team notification). No new cron row (DSAR-only, no purge).

- [ ] **Step 5: Update `docs/operations/GDPR-COMPLIANCE.md`**

- Personal-data inventory: add a **partner inquiries** row (name, email, phone, company, website, message; stored in `partner-applications`; retained until DSAR erasure).
- Sub-processor register / Brevo note: Brevo also sends partner applicant + admin emails.
- Erasure (Art. 17): DSAR delete-by-email now also erases partner applications.

- [ ] **Step 6: Update `docs/web/WEB-PAGES.md`** — note the partners form now posts to the dedicated CMS endpoint.

- [ ] **Step 7: Write the runbook**

Create `docs/features/partner-applications.md`: architecture (web form → `/api/partner-applications/apply` → two Brevo emails → append-only row), env vars, the two-template setup, the CSV export + audit, DSAR erasure, and a local end-to-end test recipe (set `BREVO_API_KEY` + `PARTNERS_NOTIFY_EMAIL` to exercise the relay; leave unset to skip).

- [ ] **Step 8: Full baseline checks + commit**

Run:
```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test && pnpm --filter @cleanstart/cms build
```
Expected: all PASS.

```bash
git add apps/cms/scripts/seed-website-forms.ts apps/cms/src/migrations apps/cms/src/payload-types.ts apps/cms/.env.example CLAUDE.md docs/operations/GDPR-COMPLIANCE.md docs/web/WEB-PAGES.md docs/features/partner-applications.md
git commit -m "feat: partner migration, env, docs; unwire partner form from HubSpot seed"
```

---

## Task 11: E2E test

**Files:**
- Create: `apps/cms/tests/e2e/partner-apply.spec.ts`

Tagged `@phase-j-partners`. Reference `apps/cms/tests/e2e/careers-apply.spec.ts` for the structure (webServer reuse, local API seeding, cleanup).

- [ ] **Step 1: Write the spec**

Submit a valid partner payload (JSON) to `POST /api/partner-applications/apply` with a Turnstile test token. Assert: `200 { ok: true }`; a `partner-applications` row created (query via local API) with `emailDeliveryApplicant.status` and `emailDeliveryAdmin.status` both ∈ `['skipped','synced']`; the submitted fields stored correctly. Then submit a payload with `hp` set (honeypot) and assert `200` but **no** new row created. Then GET `/api/partner-applications/export-csv` as an authenticated admin and assert `200` + `content-type: text/csv`. Clean up created rows in `afterAll`.

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cleanstart/cms test:e2e --grep @phase-j-partners`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/tests/e2e/partner-apply.spec.ts
git commit -m "test(cms): e2e for the partner apply endpoint + export"
```

---

## Self-review notes (watch during execution)

1. **`emailDelivery` shape** — the spec described nested `emailDelivery.{applicant,admin}`; this plan uses two flat groups `emailDeliveryApplicant` / `emailDeliveryAdmin` (simpler SQL + list column). Keep this consistent across the collection, endpoint, export, and e2e.
2. **Honeypot name collision** — the real `website` field and the honeypot must not share a name. Plan uses `hp` for the honeypot end-to-end (schema, endpoint, web helper, form). Verify the form's hidden field binds to `hp`.
3. **audit-log `action` enum** — `partner_exported` (Task 5) and the partner `dsar_erasure` (Task 7) must be allowed values if `action` is enumerated; extend `collections/audit-log.ts` and regenerate types.
4. **Migration prefix churn + unused-param quirk** — Task 10 Step 2 (documented careers lessons): generate with `R2_RESUME_PREFIX=dev/resumes`, strip any `resumes.prefix` ALTER, fix `{ db }` + `import type`, ensure it's in `index.ts`.
5. **`validateOptionalUrl` import** — confirm the export path/signature in `apps/cms/src/payload/lib/url-shape.ts` matches usage in `Jobs.ts` before relying on it in the collection.
6. **Build ordering** — Task 1 adds an importMap reference to `PartnersExportButton` before it exists; run `next build` only from Task 6 onward (typecheck is fine earlier).
