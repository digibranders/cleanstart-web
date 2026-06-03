# Careers Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let candidates apply to CMS-native job postings from `/job/[slug]`; store the application in the CMS DB, the resume privately on R2, and notify HR by email (Brevo) with the resume attached — entirely separate from the leads/HubSpot pipeline.

**Architecture:** Two new collections (`resumes` private upload + `career-applications` append-only), a multipart `POST /api/career-applications/apply` collection endpoint mirroring `submit-lead.ts` security, a reusable Brevo transactional-email client, a per-job web apply form, plus a retention cron and DSAR coverage.

**Tech Stack:** Payload 3.81 · Next.js 16 · `@payloadcms/storage-s3` (R2) · Brevo `/v3/smtp/email` · Zod · Vitest · Playwright.

**Branch:** `development` (CMS + web both active). **Reference spec:** `docs/superpowers/specs/2026-06-03-careers-application-design.md`.

**Conventions reminder:** TS strict, no `any`, explicit return types on exports, Zod at boundaries, distinguish `undefined`/`null`. After any CMS collection change run `pnpm --filter @cleanstart/cms generate:types` and commit. Never hand-edit `payload-types.ts` or `importMap.js` (regenerate). Pre-completion checks per task: `pnpm --filter @cleanstart/cms lint` · `typecheck` · `build` (and `test` when tests touched). Stage specific paths, never `git add -A`.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/cms/src/payload/lib/upload-limits.ts` (modify) | add DOC/DOCX MIME + 10 MB resume limit |
| `apps/cms/src/payload/collections/Resumes.ts` (create) | private resume upload collection |
| `apps/cms/src/payload/collections/CareerApplications.ts` (create) | application record + endpoint mount |
| `apps/cms/src/payload/lib/email/brevo.ts` (create) | reusable Brevo transactional send |
| `apps/cms/src/payload/lib/careers/hr-email.ts` (create) | HR-notification subject + HTML builder |
| `apps/cms/src/payload/lib/careers/application-schema.ts` (create) | Zod schema for the apply payload |
| `apps/cms/src/payload/endpoints/careers-apply.ts` (create) | multipart intake, validation, orchestration |
| `apps/cms/src/payload/lib/retention/purge-career-applications.ts` (create) | retention logic (pure, testable) |
| `apps/cms/src/payload/jobs/purge-career-applications.ts` (create) | cron task wrapper |
| `apps/cms/src/payload/endpoints/careers-dsar.ts` (create) | DSAR find/delete for applications + resumes |
| `apps/cms/src/payload.config.ts` (modify) | register collections, jobs, R2 `resumes` prefix |
| `apps/web/src/lib/careers/submitApplication.ts` (create) | multipart transport helper |
| `apps/web/src/components/sections/careers/JobApplyForm.tsx` (create) | apply UI |
| `apps/web/src/app/job/[slug]/page.tsx` (modify) | mount the apply form for cms/open jobs |
| docs (modify/create) | `.env.example`, `CLAUDE.md`, `GDPR-COMPLIANCE.md`, `WEB-PAGES.md`, `docs/careers-applications.md` |

---

## Task 1: Resume upload limits (DOC/DOCX + 10 MB)

**Files:**
- Modify: `apps/cms/src/payload/lib/upload-limits.ts`
- Test: `apps/cms/src/payload/lib/upload-limits.test.ts` (create or extend)

- [ ] **Step 1: Write the failing test**

Create `apps/cms/src/payload/lib/upload-limits.test.ts` (extend if present):

```ts
import { describe, expect, it } from 'vitest';

import { ALLOWED_MIME_TYPES, RESUME_MIME_TYPES, checkUploadSize, limitForMime } from './upload-limits';

const MB = 1024 * 1024;
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('resume upload limits', () => {
  it('accepts pdf/doc/docx as resume mime types', () => {
    expect(RESUME_MIME_TYPES).toContain('application/pdf');
    expect(RESUME_MIME_TYPES).toContain('application/msword');
    expect(RESUME_MIME_TYPES).toContain(DOCX);
  });

  it('docx is in the global allow-list', () => {
    expect(ALLOWED_MIME_TYPES).toContain(DOCX);
  });

  it('caps doc/docx at 10 MB', () => {
    expect(limitForMime(DOCX)).toBe(10 * MB);
    expect(checkUploadSize(DOCX, 9 * MB)).toEqual({ ok: true });
    expect(checkUploadSize(DOCX, 11 * MB).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test upload-limits`
Expected: FAIL — `RESUME_MIME_TYPES` undefined / DOCX not in allow-list.

- [ ] **Step 3: Implement**

Edit `apps/cms/src/payload/lib/upload-limits.ts`:

Add after the existing MIME constants:

```ts
const DOC_MIME = 'application/msword';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const RESUME_LIMIT = 10 * MB;

export const RESUME_MIME_TYPES = [PDF_MIME, DOC_MIME, DOCX_MIME] as const;
```

In `limitForMime`, add before the `return FALLBACK_LIMIT`:

```ts
  if (mimeType === DOC_MIME || mimeType === DOCX_MIME) return RESUME_LIMIT;
```

In `ALLOWED_MIME_TYPES`, add the two new entries after `'application/pdf'`:

```ts
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test upload-limits`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/upload-limits.ts apps/cms/src/payload/lib/upload-limits.test.ts
git commit -m "feat(cms): allow DOC/DOCX resume uploads with a 10 MB limit"
```

---

## Task 2: `resumes` private upload collection

**Files:**
- Create: `apps/cms/src/payload/collections/Resumes.ts`
- Modify: `apps/cms/src/payload.config.ts` (import + register collection + R2 prefix)

- [ ] **Step 1: Create the collection**

`apps/cms/src/payload/collections/Resumes.ts`:

```ts
import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { ALLOWED_MIME_TYPES, RESUME_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';

/**
 * Private resume store for career applications. Unlike `media`, this collection
 * is NOT registered with `disablePayloadAccessControl`, so files are served
 * through Payload's access-controlled `/api/resumes/file/:filename` route and
 * never exposed on a public R2 URL. Rows are created by the careers-apply
 * endpoint via overrideAccess; only admins/editors can read or download.
 */
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  labels: { singular: 'Resume', plural: 'Resumes' },
  admin: {
    group: 'Recruiting',
    useAsTitle: 'filename',
    description: 'Applicant resumes (private). Access-controlled — never public.',
    hidden: false,
  },
  access: {
    read: isAdminOrEditor,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  upload: {
    mimeTypes: [...RESUME_MIME_TYPES],
    disableLocalStorage: false,
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file;
        if (file) {
          const sized = checkUploadSize(file.mimetype, file.size);
          if (!sized.ok) {
            throw new Error(sized.reason);
          }
          if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
            throw new Error('Unsupported file type for resume.');
          }
        }
        return data;
      },
    ],
  },
  fields: [],
  timestamps: true,
};
```

- [ ] **Step 2: Register the collection + R2 prefix**

In `apps/cms/src/payload.config.ts`:

Add the import next to the other collection imports:

```ts
import { Resumes } from './payload/collections/Resumes';
```

Add `Resumes` to the `collections` array (place it next to `Media`).

In the `s3Storage` `collections` map (currently only `media`), add a private `resumes` entry — **no** `disablePayloadAccessControl`, its own prefix:

```ts
        resumes: {
          prefix:
            process.env.R2_RESUME_PREFIX ??
            (process.env.NODE_ENV === 'production' ? 'web/resumes' : 'dev/resumes'),
        },
```

- [ ] **Step 3: Regenerate types + importmap**

Run:
```bash
pnpm --filter @cleanstart/cms generate:importmap
pnpm --filter @cleanstart/cms generate:types
```
Expected: `payload-types.ts` now has a `Resume`/`resumes` interface; importMap unchanged or minimal.

- [ ] **Step 4: Typecheck + build**

Run: `pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/Resumes.ts apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): add private resumes upload collection (R2, access-controlled)"
```

---

## Task 3: `career-applications` collection

**Files:**
- Create: `apps/cms/src/payload/collections/CareerApplications.ts`
- Modify: `apps/cms/src/payload.config.ts` (import + register)

Note: the endpoint (`careersApplyEndpoint`, `careersApplyOptionsEndpoint`) is created in Task 6; this task wires an empty `endpoints: []` placeholder and Task 6 fills it in. To keep tasks independently committable, mount the endpoints in Task 6.

- [ ] **Step 1: Create the collection**

`apps/cms/src/payload/collections/CareerApplications.ts`:

```ts
import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

/**
 * Career applications — append-only. Created exclusively by the careers-apply
 * endpoint (overrideAccess); the public never POSTs here directly. Entirely
 * separate from the leads/HubSpot pipeline: no crmHandlers, no HubSpot sync.
 * PII (applicant fields, ip, userAgent) is purged by the retention cron, which
 * also deletes the linked resume file.
 */
export const CareerApplications: CollectionConfig = {
  slug: 'career-applications',
  labels: { singular: 'Application', plural: 'Applications' },
  admin: {
    group: 'Recruiting',
    useAsTitle: 'email',
    defaultColumns: ['job', 'firstName', 'lastName', 'email', 'emailDelivery', 'createdAt'],
    description: 'Job applications (append-only). Resumes are stored privately and emailed to HR.',
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'job', type: 'relationship', relationTo: 'jobs', required: true },
    {
      name: 'jobTitleSnapshot',
      type: 'text',
      required: true,
      admin: { readOnly: true, description: 'Job title at apply time — survives later job edits/deletes.' },
    },
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'coverLetter', type: 'textarea' },
    {
      name: 'linkedinUrl',
      type: 'text',
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    { name: 'resume', type: 'relationship', relationTo: 'resumes', required: true },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      type: 'group',
      name: 'emailDelivery',
      label: 'HR email delivery',
      admin: { readOnly: true },
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Sent', value: 'synced' },
            { label: 'Failed', value: 'failed' },
            { label: 'Skipped (not configured)', value: 'skipped' },
          ],
        },
        { name: 'messageId', type: 'text' },
        { name: 'error', type: 'text' },
      ],
    },
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

- [ ] **Step 2: Register the collection**

In `apps/cms/src/payload.config.ts`: add `import { CareerApplications } from './payload/collections/CareerApplications';` and add `CareerApplications` to the `collections` array (next to `Resumes`).

- [ ] **Step 3: Regenerate types + verify**

Run:
```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build
```
Expected: `payload-types.ts` has `CareerApplication`; build PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/collections/CareerApplications.ts apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): add append-only career-applications collection"
```

---

## Task 4: Brevo transactional email client

**Files:**
- Create: `apps/cms/src/payload/lib/email/brevo.ts`
- Test: `apps/cms/src/payload/lib/email/brevo.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/email/brevo.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendBrevoEmail } from './brevo';

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('sendBrevoEmail', () => {
  it('skips when BREVO_API_KEY is unset', async () => {
    delete process.env.BREVO_API_KEY;
    const result = await sendBrevoEmail({
      to: [{ email: 'hr@cleanstart.com' }],
      subject: 'x',
      htmlContent: '<p>x</p>',
    });
    expect(result).toEqual({ status: 'skipped', reason: 'env-not-configured' });
  });

  it('posts to the Brevo endpoint and returns the messageId on 2xx', async () => {
    process.env.BREVO_API_KEY = 'key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@cleanstart.com';
    process.env.BREVO_SENDER_NAME = 'CleanStart';
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ messageId: 'mid-1' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendBrevoEmail({
      to: [{ email: 'hr@cleanstart.com' }],
      replyTo: { email: 'a@b.com' },
      subject: 'New application',
      htmlContent: '<p>hi</p>',
      attachments: [{ name: 'cv.pdf', content: 'BASE64' }],
    });

    expect(result).toEqual({ status: 'synced', messageId: 'mid-1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.sender).toEqual({ email: 'no-reply@cleanstart.com', name: 'CleanStart' });
    expect(body.attachment).toEqual([{ name: 'cv.pdf', content: 'BASE64' }]);
    expect((init as RequestInit).headers).toMatchObject({ 'api-key': 'key' });
  });

  it('returns failed with redacted error on non-2xx', async () => {
    process.env.BREVO_API_KEY = 'key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@cleanstart.com';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 400 })));
    const result = await sendBrevoEmail({ to: [{ email: 'hr@cleanstart.com' }], subject: 's', htmlContent: '<p>x</p>' });
    expect(result.status).toBe('failed');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test brevo`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/email/brevo.ts`:

```ts
import { redactWebhookErrorBody } from '../webhooks/redact-error-body';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10_000;

export type BrevoRecipient = { email: string; name?: string };
export type BrevoAttachment = { name: string; content: string };

export type SendBrevoEmailInput = {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  replyTo?: BrevoRecipient;
  attachments?: BrevoAttachment[];
};

export type BrevoSendResult =
  | { status: 'synced'; messageId?: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

/**
 * Sends one transactional email via Brevo's `/v3/smtp/email` API. Reusable
 * across careers (HR notify, with resume attachment) and — later — the partner
 * form. Returns a discriminated result instead of throwing so callers can
 * record delivery status without try/catch around a non-fatal send. No-ops
 * gracefully when BREVO_API_KEY is unset (local dev).
 */
export const sendBrevoEmail = async (input: SendBrevoEmailInput): Promise<BrevoSendResult> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    return { status: 'skipped', reason: 'env-not-configured' };
  }
  const senderName = process.env.BREVO_SENDER_NAME;

  const body = {
    sender: { email: senderEmail, ...(senderName ? { name: senderName } : {}) },
    to: input.to,
    subject: input.subject,
    htmlContent: input.htmlContent,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.attachments && input.attachments.length > 0 ? { attachment: input.attachments } : {}),
  };

  let response: Response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'failed', error: /timeout|abort/i.test(message) ? 'timeout' : `network: ${message}` };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { status: 'failed', error: `Brevo ${response.status}: ${redactWebhookErrorBody(text)}` };
  }

  const data = (await response.json().catch(() => null)) as { messageId?: string } | null;
  return { status: 'synced', ...(data?.messageId ? { messageId: data.messageId } : {}) };
};
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test brevo`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/email/brevo.ts apps/cms/src/payload/lib/email/brevo.test.ts
git commit -m "feat(cms): add reusable Brevo transactional email client"
```

---

## Task 5: HR notification email builder

**Files:**
- Create: `apps/cms/src/payload/lib/careers/hr-email.ts`
- Test: `apps/cms/src/payload/lib/careers/hr-email.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/careers/hr-email.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildHrApplicationEmail } from './hr-email';

describe('buildHrApplicationEmail', () => {
  const base = {
    jobTitle: 'Senior Engineer',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1 555 0100',
    coverLetter: 'I build engines.',
    linkedinUrl: 'https://linkedin.com/in/ada',
  };

  it('puts the job title in the subject', () => {
    const { subject } = buildHrApplicationEmail(base);
    expect(subject).toContain('Senior Engineer');
  });

  it('includes applicant details and escapes HTML in user input', () => {
    const { htmlContent } = buildHrApplicationEmail({ ...base, firstName: '<script>' });
    expect(htmlContent).toContain('ada@example.com');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).not.toContain('<script>');
  });

  it('omits optional rows when absent', () => {
    const { htmlContent } = buildHrApplicationEmail({ ...base, phone: undefined, linkedinUrl: undefined, coverLetter: undefined });
    expect(htmlContent).not.toContain('LinkedIn');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test hr-email`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/careers/hr-email.ts`:

```ts
export type HrApplicationEmailInput = {
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  coverLetter?: string | undefined;
  linkedinUrl?: string | undefined;
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

/**
 * Builds the HR-notification subject + HTML for a new application. Self-contained
 * (no Brevo dashboard template). All applicant-supplied values are HTML-escaped.
 */
export const buildHrApplicationEmail = (
  input: HrApplicationEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const subject = `New application — ${input.jobTitle} — ${fullName}`;
  const htmlContent = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
<h2 style="margin:0 0 12px;">New job application</h2>
<p style="margin:0 0 16px;">A candidate applied for <strong>${escapeHtml(input.jobTitle)}</strong>. Resume attached.</p>
<table style="border-collapse:collapse;">
${row('Name', fullName)}
${row('Email', input.email)}
${row('Phone', input.phone)}
${row('LinkedIn', input.linkedinUrl)}
</table>
${input.coverLetter && input.coverLetter.trim().length > 0 ? `<h3 style="margin:20px 0 6px;">Cover letter</h3><p style="white-space:pre-wrap;margin:0;">${escapeHtml(input.coverLetter)}</p>` : ''}
</body></html>`;
  return { subject, htmlContent };
};
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test hr-email`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/careers/hr-email.ts apps/cms/src/payload/lib/careers/hr-email.test.ts
git commit -m "feat(cms): add HR application notification email builder"
```

---

## Task 6: Careers apply endpoint (multipart) + mount

**Files:**
- Create: `apps/cms/src/payload/lib/careers/application-schema.ts`
- Create: `apps/cms/src/payload/endpoints/careers-apply.ts`
- Modify: `apps/cms/src/payload/collections/CareerApplications.ts` (mount endpoints)
- Test: `apps/cms/src/payload/lib/careers/application-schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

`apps/cms/src/payload/lib/careers/application-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { applicationFieldsSchema } from './application-schema';

const valid = {
  jobSlug: 'senior-engineer',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+1 555 0100',
  coverLetter: 'hi',
  linkedinUrl: 'https://linkedin.com/in/ada',
};

describe('applicationFieldsSchema', () => {
  it('accepts a valid payload', () => {
    expect(applicationFieldsSchema.safeParse(valid).success).toBe(true);
  });
  it('requires jobSlug, names, and email', () => {
    expect(applicationFieldsSchema.safeParse({ ...valid, jobSlug: '' }).success).toBe(false);
    expect(applicationFieldsSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(applicationFieldsSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
  });
  it('allows optional fields to be omitted', () => {
    expect(
      applicationFieldsSchema.safeParse({ jobSlug: 'x', firstName: 'A', lastName: 'B', email: 'a@b.com' }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test application-schema`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the schema**

`apps/cms/src/payload/lib/careers/application-schema.ts`:

```ts
import { z } from 'zod';

const SLUG = /^[a-z0-9-]+$/;

export const applicationFieldsSchema = z.object({
  jobSlug: z.string().min(1).max(200).regex(SLUG),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  coverLetter: z.string().max(5000).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  source: z.string().max(2048).optional(),
  consent: z
    .object({
      snapshot: z.string().max(2000),
      givenAt: z.string().max(40),
      categories: z.array(z.string().max(40)).max(10).optional(),
    })
    .optional(),
  turnstileToken: z.string().max(2048).optional(),
  website: z.string().max(2048).optional(),
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;
```

- [ ] **Step 4: Run schema tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test application-schema`
Expected: PASS.

- [ ] **Step 5: Implement the endpoint**

`apps/cms/src/payload/endpoints/careers-apply.ts`:

```ts
import type { Endpoint } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { applicationFieldsSchema } from '../lib/careers/application-schema';
import { buildHrApplicationEmail } from '../lib/careers/hr-email';
import { sendBrevoEmail } from '../lib/email/brevo';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';
import { checkUploadSize } from '../lib/upload-limits';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

// Resume (10 MB) + small text fields; rejected with 413 before rate-limit.
export const CAREERS_MAX_BYTES = 12 * 1024 * 1024;
const RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

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

export const careersApplyOptionsEndpoint: Endpoint = {
  path: '/apply',
  method: 'options',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return json({ ok: false, error: 'origin_forbidden' }, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

type JobLookup = {
  id: number;
  title?: string | null;
  slug?: string | null;
  _status?: string | null;
  hiringStatus?: string | null;
  source?: string | null;
};

export const careersApplyEndpoint: Endpoint = {
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
      if (contentLength > CAREERS_MAX_BYTES) {
        return json({ ok: false, error: 'payload_too_large', limit: CAREERS_MAX_BYTES }, { status: 413, headers: cors });
      }
    }

    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`careers:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000) },
        { status: 429, headers: cors },
      );
    }

    let form: FormData;
    try {
      form = await (req as unknown as { formData: () => Promise<FormData> }).formData();
    } catch {
      return json({ ok: false, error: 'invalid_multipart' }, { status: 400, headers: cors });
    }

    const rawFields: Record<string, unknown> = {};
    for (const key of ['jobSlug', 'firstName', 'lastName', 'email', 'phone', 'coverLetter', 'linkedinUrl', 'source', 'turnstileToken', 'website']) {
      const v = form.get(key);
      if (typeof v === 'string') rawFields[key] = v;
    }
    const consentRaw = form.get('consent');
    if (typeof consentRaw === 'string' && consentRaw.length > 0) {
      try {
        rawFields.consent = JSON.parse(consentRaw);
      } catch {
        return json({ ok: false, error: 'invalid_consent' }, { status: 400, headers: cors });
      }
    }

    const parsed = applicationFieldsSchema.safeParse(rawFields);
    if (!parsed.success) {
      return json(
        { ok: false, error: 'invalid_body', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        { status: 400, headers: cors },
      );
    }
    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Honeypot — return 200 OK so bots don't learn they tripped the trap.
    if (typeof data.website === 'string' && data.website.trim().length > 0) {
      req.payload.logger.info({ ip }, 'Career application flagged — honeypot tripped');
      return json({ ok: true }, { headers: cors });
    }

    // Resume file: required, mime + size checked.
    const file = form.get('resume');
    if (!(file instanceof File) || file.size === 0) {
      return json({ ok: false, error: 'resume_required' }, { status: 400, headers: cors });
    }
    if (!RESUME_MIMES.has(file.type)) {
      return json({ ok: false, error: 'resume_type_unsupported' }, { status: 400, headers: cors });
    }
    const sized = checkUploadSize(file.type, file.size);
    if (!sized.ok) {
      return json({ ok: false, error: 'resume_too_large', reason: sized.reason }, { status: 400, headers: cors });
    }

    // Turnstile (no exemption for careers).
    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      return json({ ok: false, error: 'turnstile_failed', reason: turnstile.reason }, { status: 403, headers: cors });
    }

    // Resolve the job: must be a published, open, CMS-native posting.
    const invalidJob = json({ ok: false, error: 'invalid_job' }, { status: 400, headers: cors });
    let job: JobLookup | null = null;
    try {
      const res = await req.payload.find({
        collection: 'jobs',
        where: { slug: { equals: data.jobSlug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const doc = res.docs[0] as JobLookup | undefined;
      job = doc ?? null;
    } catch {
      return invalidJob;
    }
    if (!job || job._status !== 'published' || job.hiringStatus !== 'open' || job.source !== 'cms') {
      return invalidJob;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Store the resume (private upload collection).
    let resumeId: number;
    try {
      const created = await req.payload.create({
        collection: 'resumes',
        data: {},
        file: { data: buffer, mimetype: file.type, name: file.name || 'resume', size: file.size },
        overrideAccess: true,
      });
      resumeId = created.id as number;
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Resume upload failed — application not stored',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    // 2. Inject live policyVersion into the consent snapshot.
    let policyVersion: string | undefined;
    if (data.consent != null) {
      try {
        const legal = (await req.payload.findGlobal({ slug: 'legal', depth: 0, overrideAccess: true })) as { policyVersion?: string | null } | null;
        policyVersion = legal?.policyVersion ?? undefined;
      } catch (err) {
        req.payload.logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Could not read Legal global for policyVersion');
      }
    }

    // 3. Send HR email (non-fatal) BEFORE the application create so the result
    //    is written in the initial append-only row.
    const { subject, htmlContent } = buildHrApplicationEmail({
      jobTitle: job.title ?? data.jobSlug,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      coverLetter: data.coverLetter,
      linkedinUrl: data.linkedinUrl,
    });
    const hrEmail = process.env.CAREERS_HR_EMAIL;
    const delivery = hrEmail
      ? await sendBrevoEmail({
          to: [{ email: hrEmail }],
          replyTo: { email: data.email, name: `${data.firstName} ${data.lastName}`.trim() },
          subject,
          htmlContent,
          attachments: [{ name: file.name || 'resume', content: buffer.toString('base64') }],
        })
      : ({ status: 'skipped', reason: 'no-hr-recipient' } as const);

    // 4. Create the append-only application row with delivery embedded.
    try {
      await req.payload.create({
        collection: 'career-applications',
        data: {
          job: job.id,
          jobTitleSnapshot: job.title ?? data.jobSlug,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
          coverLetter: data.coverLetter ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          resume: resumeId,
          source: data.source ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          consentGivenAt: data.consent?.givenAt ?? null,
          consentSnapshot: data.consent?.snapshot ?? null,
          privacyPolicyVersion: policyVersion ?? null,
          emailDelivery: {
            status: delivery.status,
            messageId: 'messageId' in delivery ? delivery.messageId ?? null : null,
            error: delivery.status === 'failed' ? delivery.error : null,
          },
          turnstilePassed: true,
        },
        overrideAccess: true,
      });
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err), resumeId },
        'Career application create failed after resume upload',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
```

- [ ] **Step 6: Mount the endpoints on the collection**

Edit `apps/cms/src/payload/collections/CareerApplications.ts`:

Add import at the top:

```ts
import { careersApplyEndpoint, careersApplyOptionsEndpoint } from '../endpoints/careers-apply';
```

Add to the collection config (after `access`):

```ts
  endpoints: [careersApplyEndpoint, careersApplyOptionsEndpoint],
```

- [ ] **Step 7: Lint, typecheck, build**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build`
Expected: PASS. (Endpoint resolves to `POST /api/career-applications/apply`.)

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/payload/lib/careers/application-schema.ts apps/cms/src/payload/lib/careers/application-schema.test.ts apps/cms/src/payload/endpoints/careers-apply.ts apps/cms/src/payload/collections/CareerApplications.ts
git commit -m "feat(cms): careers apply endpoint (multipart, resume->R2, Brevo HR notify)"
```

---

## Task 7: Web — per-job apply form

**Files:**
- Create: `apps/web/src/lib/careers/submitApplication.ts`
- Create: `apps/web/src/components/sections/careers/JobApplyForm.tsx`
- Modify: `apps/web/src/app/job/[slug]/page.tsx`

Reference existing patterns: `apps/web/src/lib/leads/submitLead.ts` (transport + env), `apps/web/src/components/sections/partners/BecomePartnerCta.tsx` (form + Turnstile + consent UI). Follow the apps/web typography/responsive rules in the repo `CLAUDE.md` (role tokens via `var(--fs-*)`, `<Section>/<Container>`, 16 px inputs).

- [ ] **Step 1: Implement the transport helper**

`apps/web/src/lib/careers/submitApplication.ts`:

```ts
export type ApplicationConsent = {
  snapshot: string;
  givenAt: string;
  categories?: string[];
};

export type SubmitApplicationInput = {
  jobSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  linkedinUrl?: string;
  resume: File;
  source?: string;
  consent?: ApplicationConsent;
  turnstileToken?: string;
  website?: string; // honeypot
};

export type SubmitApplicationResult = { ok: true } | { ok: false; error: string };

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? '';

/**
 * Posts a job application as multipart/form-data to the CMS careers endpoint.
 * The resume file is sent as a real file part; everything else as string parts
 * (consent is JSON-encoded). Never sends PII to any third party from the
 * browser — only to the CMS.
 */
export const submitApplication = async (
  input: SubmitApplicationInput,
): Promise<SubmitApplicationResult> => {
  const fd = new FormData();
  fd.set('jobSlug', input.jobSlug);
  fd.set('firstName', input.firstName);
  fd.set('lastName', input.lastName);
  fd.set('email', input.email);
  if (input.phone) fd.set('phone', input.phone);
  if (input.coverLetter) fd.set('coverLetter', input.coverLetter);
  if (input.linkedinUrl) fd.set('linkedinUrl', input.linkedinUrl);
  if (input.source) fd.set('source', input.source);
  if (input.turnstileToken) fd.set('turnstileToken', input.turnstileToken);
  if (input.website) fd.set('website', input.website);
  if (input.consent) fd.set('consent', JSON.stringify(input.consent));
  fd.set('resume', input.resume);

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/career-applications/apply`, { method: 'POST', body: fd });
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

- [ ] **Step 2: Implement the form component**

`apps/web/src/components/sections/careers/JobApplyForm.tsx` — a client component with: first/last name, email, phone, resume `<input type="file" accept=".pdf,.doc,.docx">` (client-side 10 MB guard), cover letter textarea, LinkedIn URL, consent checkbox + privacy link, Turnstile widget, hidden honeypot `website`, submit button with busy/success/error states. Mirror `BecomePartnerCta.tsx` for the Turnstile + consent wiring. Use `var(--fs-*)` tokens; inputs `var(--fs-input)`; wrap in `<Section padding="md"><Container>`. On submit, build `consent` (`snapshot` = the rendered consent text, `givenAt` = `new Date().toISOString()`, `categories: ['recruitment']`), call `submitApplication`, then show inline thank-you on `ok` or a retry message otherwise.

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';

import { Section, Container } from '@/components/layout';
import { submitApplication } from '@/lib/careers/submitApplication';

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const CONSENT_TEXT =
  'I consent to CleanStart storing and processing my application data and resume for recruitment purposes.';

type JobApplyFormProps = { jobSlug: string; jobTitle: string };

export const JobApplyForm = ({ jobSlug, jobTitle }: JobApplyFormProps): React.ReactElement => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      if (!consented) {
        setError('Please confirm consent to continue.');
        return;
      }
      const fd = new FormData(e.currentTarget);
      const resume = fd.get('resume');
      if (!(resume instanceof File) || resume.size === 0) {
        setError('Please attach your resume (PDF, DOC, or DOCX).');
        return;
      }
      if (resume.size > MAX_RESUME_BYTES) {
        setError('Resume must be 10 MB or smaller.');
        return;
      }
      setBusy(true);
      const result = await submitApplication({
        jobSlug,
        firstName: String(fd.get('firstName') ?? ''),
        lastName: String(fd.get('lastName') ?? ''),
        email: String(fd.get('email') ?? ''),
        phone: String(fd.get('phone') ?? '') || undefined,
        coverLetter: String(fd.get('coverLetter') ?? '') || undefined,
        linkedinUrl: String(fd.get('linkedinUrl') ?? '') || undefined,
        resume,
        source: typeof window !== 'undefined' ? window.location.href : undefined,
        consent: { snapshot: CONSENT_TEXT, givenAt: new Date().toISOString(), categories: ['recruitment'] },
        turnstileToken,
        website: String(fd.get('website') ?? '') || undefined,
      });
      setBusy(false);
      if (result.ok) {
        setDone(true);
        formRef.current?.reset();
      } else {
        setError('Something went wrong. Please try again.');
      }
    },
    [consented, jobSlug, turnstileToken],
  );

  if (done) {
    return (
      <Section padding="md">
        <Container variant="prose">
          <p style={{ fontSize: 'var(--fs-lead)' }}>
            Thanks for applying to {jobTitle}. Our team will be in touch.
          </p>
        </Container>
      </Section>
    );
  }

  return (
    <Section padding="md">
      <Container variant="prose">
        <h2 style={{ fontSize: 'var(--fs-h2)' }}>Apply for this role</h2>
        <form ref={formRef} onSubmit={onSubmit} noValidate>
          {/* honeypot */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
          <input name="firstName" placeholder="First name" required style={{ fontSize: 'var(--fs-input)' }} />
          <input name="lastName" placeholder="Last name" required style={{ fontSize: 'var(--fs-input)' }} />
          <input name="email" type="email" placeholder="Email" required style={{ fontSize: 'var(--fs-input)' }} />
          <input name="phone" placeholder="Phone" style={{ fontSize: 'var(--fs-input)' }} />
          <input name="linkedinUrl" placeholder="LinkedIn URL" style={{ fontSize: 'var(--fs-input)' }} />
          <input name="resume" type="file" accept=".pdf,.doc,.docx" required />
          <textarea name="coverLetter" placeholder="Cover letter (optional)" style={{ fontSize: 'var(--fs-input)' }} />
          <label style={{ fontSize: 'var(--fs-body-sm)' }}>
            <input type="checkbox" checked={consented} onChange={(ev) => setConsented(ev.target.checked)} /> {CONSENT_TEXT}{' '}
            <a href="/privacy-policy">Privacy Policy</a>
          </label>
          {/* Turnstile widget wires setTurnstileToken — mirror BecomePartnerCta.tsx */}
          {error ? <p role="alert" style={{ color: 'var(--color-danger, #dc2626)' }}>{error}</p> : null}
          <button type="submit" disabled={busy} style={{ fontSize: 'var(--fs-button)' }}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </Container>
    </Section>
  );
};

export default JobApplyForm;
```

Note: copy the exact Turnstile widget integration (script load + `setTurnstileToken` on callback) from `BecomePartnerCta.tsx` so behavior matches the other forms. Style the inputs to match the existing form components rather than bare elements — follow the classes/wrappers already used there.

- [ ] **Step 3: Mount on the job detail page**

In `apps/web/src/app/job/[slug]/page.tsx`, render `<JobApplyForm jobSlug={job.slug} jobTitle={job.title} />` only when the job is CMS-native and open (`job.source === 'cms' && job.hiringStatus === 'open'`). ATS jobs keep the existing external-link behavior. Import the component at the top.

- [ ] **Step 4: Lint, typecheck, build (web)**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/careers/submitApplication.ts apps/web/src/components/sections/careers/JobApplyForm.tsx apps/web/src/app/job/[slug]/page.tsx
git commit -m "feat(web): per-job apply form posting to the careers endpoint"
```

---

## Task 8: Retention cron — purge old applications + resumes

**Files:**
- Create: `apps/cms/src/payload/lib/retention/purge-career-applications.ts`
- Create: `apps/cms/src/payload/jobs/purge-career-applications.ts`
- Modify: `apps/cms/src/payload.config.ts` (register task in the jobs/tasks array + autoRun cron)
- Test: `apps/cms/src/payload/lib/retention/purge-career-applications.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/retention/purge-career-applications.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { purgeCareerApplications } from './purge-career-applications';

const makePayload = (docs: Array<{ id: number; resume: number | null }>) => {
  const deleted: Array<{ collection: string; id: number }> = [];
  const updated: Array<{ collection: string; id: number }> = [];
  return {
    deleted,
    updated,
    find: vi.fn(async () => ({ docs })),
    delete: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
      deleted.push({ collection, id });
      return { id };
    }),
    update: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
      updated.push({ collection, id });
      return { id };
    }),
  };
};

describe('purgeCareerApplications', () => {
  it('deletes the resume file and redacts the application for each expired row', async () => {
    const payload = makePayload([{ id: 1, resume: 11 }, { id: 2, resume: null }]);
    const result = await purgeCareerApplications(payload as never, { retentionDays: 365, now: new Date('2027-01-01T00:00:00Z') });
    expect(result.redacted).toBe(2);
    expect(payload.deleted).toContainEqual({ collection: 'resumes', id: 11 });
    expect(payload.updated).toHaveLength(2);
  });

  it('is a no-op when nothing is expired', async () => {
    const payload = makePayload([]);
    const result = await purgeCareerApplications(payload as never, { retentionDays: 365, now: new Date('2027-01-01T00:00:00Z') });
    expect(result.redacted).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test purge-career-applications`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the retention logic**

`apps/cms/src/payload/lib/retention/purge-career-applications.ts`:

```ts
import type { BasePayload } from 'payload';

export type PurgeCareerApplicationsOptions = {
  retentionDays: number;
  now?: Date;
};

export type PurgeCareerApplicationsResult = { redacted: number };

type ExpiredRow = { id: number; resume: number | { id?: number } | null };

/**
 * Hard-deletes the resume file and redacts applicant PII on every
 * career-application older than `retentionDays`. Idempotent: redacted rows
 * (piiRedactedAt set) are excluded by the query, so re-runs skip them.
 */
export const purgeCareerApplications = async (
  payload: BasePayload,
  options: PurgeCareerApplicationsOptions,
): Promise<PurgeCareerApplicationsResult> => {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - options.retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const res = await payload.find({
    collection: 'career-applications',
    where: { and: [{ createdAt: { less_than: cutoff } }, { piiRedactedAt: { exists: false } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as ExpiredRow[];

  let redacted = 0;
  for (const doc of docs) {
    const resumeId = typeof doc.resume === 'object' && doc.resume !== null ? doc.resume.id : doc.resume;
    if (typeof resumeId === 'number') {
      try {
        await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true });
      } catch (err) {
        payload.logger.warn({ err: err instanceof Error ? err.message : String(err), resumeId }, 'Resume delete failed during purge');
      }
    }
    await payload.update({
      collection: 'career-applications',
      id: doc.id,
      data: {
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        coverLetter: null,
        linkedinUrl: null,
        ip: null,
        userAgent: null,
        piiRedactedAt: now.toISOString(),
      },
      overrideAccess: true,
    });
    redacted += 1;
  }

  return { redacted };
};
```

Note: `email` is `required` on the collection but updates of `null` via `overrideAccess` for redaction are acceptable here because the row already exists; if Payload rejects null on a required field at update, change the collection field to `required: true` only at create by using a `beforeValidate` allowance — verify during implementation and, if needed, drop `required` from `email` (keep it enforced at the endpoint instead). Confirm with the test + a real purge run.

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test purge-career-applications`
Expected: PASS.

- [ ] **Step 5: Implement the cron task**

`apps/cms/src/payload/jobs/purge-career-applications.ts`:

```ts
import type { TaskConfig } from 'payload';

import { purgeCareerApplications } from '../lib/retention/purge-career-applications';

const RETENTION_DAYS = Number.parseInt(process.env.CAREERS_RETENTION_DAYS ?? '365', 10);

/**
 * Daily career-application retention purge — hard-deletes resume files and
 * redacts applicant PII on rows older than CAREERS_RETENTION_DAYS (default 365).
 * Runs 03:45 UTC; gated by PAYLOAD_AUTO_RUN via payload.config autoRun.
 */
export const purgeCareerApplicationsTask: TaskConfig<'purgeCareerApplications'> = {
  slug: 'purgeCareerApplications',
  retries: 0,
  schedule: [{ cron: '45 3 * * *', queue: 'careerApplicationsPurge' }],
  handler: async ({ req }) => {
    const result = await purgeCareerApplications(req.payload, {
      retentionDays: Number.isFinite(RETENTION_DAYS) ? RETENTION_DAYS : 365,
    });
    return { output: result };
  },
};
```

- [ ] **Step 6: Register the task + autoRun**

In `apps/cms/src/payload.config.ts`: import `purgeCareerApplicationsTask` and add it to the `jobs.tasks` array. Add a matching `autoRun` cron entry alongside the existing purge crons (queue `careerApplicationsPurge`, cron `45 3 * * *`), following the exact shape of the existing `searchLogPurge` autoRun entry.

- [ ] **Step 7: Lint, typecheck, build, test**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test purge-career-applications && pnpm --filter @cleanstart/cms build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/payload/lib/retention/purge-career-applications.ts apps/cms/src/payload/lib/retention/purge-career-applications.test.ts apps/cms/src/payload/jobs/purge-career-applications.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): daily retention purge for career applications + resumes"
```

---

## Task 9: DSAR coverage for career applications

**Files:**
- Create: `apps/cms/src/payload/lib/careers/dsar.ts`
- Test: `apps/cms/src/payload/lib/careers/dsar.test.ts`
- Modify: existing DSAR endpoint to also purge careers (see Step 5)

- [ ] **Step 1: Write the failing test**

`apps/cms/src/payload/lib/careers/dsar.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { deleteCareerApplicationsByEmail } from './dsar';

describe('deleteCareerApplicationsByEmail', () => {
  it('deletes resumes then applications for the email, returns the count', async () => {
    const deleted: Array<{ collection: string; id: number }> = [];
    const payload = {
      find: vi.fn(async () => ({ docs: [{ id: 1, resume: 11 }, { id: 2, resume: 22 }] })),
      delete: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        deleted.push({ collection, id });
        return { id };
      }),
      logger: { warn: vi.fn() },
    };
    const result = await deleteCareerApplicationsByEmail(payload as never, 'ada@example.com');
    expect(result.deleted).toBe(2);
    expect(deleted).toContainEqual({ collection: 'resumes', id: 11 });
    expect(deleted).toContainEqual({ collection: 'career-applications', id: 1 });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @cleanstart/cms test careers/dsar`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`apps/cms/src/payload/lib/careers/dsar.ts`:

```ts
import type { BasePayload } from 'payload';

export type DeleteCareerApplicationsResult = { deleted: number };

type Row = { id: number; resume: number | { id?: number } | null };

/**
 * GDPR Art. 17 erasure for career applications: deletes every application
 * matching the email and hard-deletes each linked resume file. Resume delete
 * failures are logged but never block the application delete.
 */
export const deleteCareerApplicationsByEmail = async (
  payload: BasePayload,
  email: string,
): Promise<DeleteCareerApplicationsResult> => {
  const res = await payload.find({
    collection: 'career-applications',
    where: { email: { equals: email } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const docs = res.docs as unknown as Row[];

  let deleted = 0;
  for (const doc of docs) {
    const resumeId = typeof doc.resume === 'object' && doc.resume !== null ? doc.resume.id : doc.resume;
    if (typeof resumeId === 'number') {
      try {
        await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true });
      } catch (err) {
        payload.logger.warn({ err: err instanceof Error ? err.message : String(err), resumeId }, 'Resume delete failed during DSAR erasure');
      }
    }
    await payload.delete({ collection: 'career-applications', id: doc.id, overrideAccess: true });
    deleted += 1;
  }

  return { deleted };
};
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `pnpm --filter @cleanstart/cms test careers/dsar`
Expected: PASS.

- [ ] **Step 5: Wire into the existing DSAR delete endpoint**

Read `apps/cms/src/payload/endpoints/leads-dsar.ts`. In its delete-by-email handler, after the leads deletion + audit write, call `deleteCareerApplicationsByEmail(req.payload, email)` and include its count in the response (e.g. `{ ok: true, deleted, careerApplicationsDeleted }`). Import the function. This makes one DSAR request erase both leads and career data for the subject. Keep the audit-log write covering the careers deletion too (write a `dsar_erasure` row with `targetCollection: 'career-applications'` when the count is > 0), mirroring the existing audit pattern in that file.

- [ ] **Step 6: Lint, typecheck, build**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/lib/careers/dsar.ts apps/cms/src/payload/lib/careers/dsar.test.ts apps/cms/src/payload/endpoints/leads-dsar.ts
git commit -m "feat(cms): DSAR erasure cascade to career applications + resumes"
```

---

## Task 10: Migration, env, and docs

**Files:**
- Create: migration (generated) under `apps/cms/src/migrations/`
- Modify: `apps/cms/src/migrations/index.ts` (only if the generator doesn't append it)
- Modify: `apps/cms/.env.example`, `CLAUDE.md`, `docs/GDPR-COMPLIANCE.md`, `docs/WEB-PAGES.md`
- Create: `docs/careers-applications.md`

- [ ] **Step 1: Generate the DB migration**

The two new collections + retention need a Postgres migration. Generate it:

```bash
cd apps/cms
pnpm exec payload migrate:create add_careers_collections
```

Verify the generated file creates `resumes`, `career_applications`, and the `email_delivery` enum/columns. **Confirm it is referenced in `apps/cms/src/migrations/index.ts`** (the orphaned-migration incident: files in the migrations dir that aren't in `index.ts` get globbed by `migrate` and break prod — every migration file must be listed in `index.ts` and no stray files left behind).

- [ ] **Step 2: Add env vars to `.env.example`**

Append to `apps/cms/.env.example` (annotated, no real values — never commit secrets):

```bash
# Brevo (careers + partner email). HR notifications for job applications go
# out via Brevo's transactional API. Unset BREVO_API_KEY in local dev to skip
# sending (applications still save).
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=CleanStart
# Recipient for new-application notifications (resume attached).
CAREERS_HR_EMAIL=
# Career-application + resume retention window in days (default 365).
CAREERS_RETENTION_DAYS=365
# Private R2 prefix for resumes (defaults to web/resumes | dev/resumes).
R2_RESUME_PREFIX=
```

- [ ] **Step 3: Update `CLAUDE.md`**

In the **Live integrations** table, add a Brevo row (purpose: careers/partner transactional email — HR application notifications with resume attachment; key env vars `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CAREERS_HR_EMAIL`).
In the **Background jobs** table, add the row: `Career-applications purge (resume delete + PII redaction, 365-day) | daily 03:45 | purge-career-applications.ts`.

- [ ] **Step 4: Update `docs/GDPR-COMPLIANCE.md`**

- Sub-processor register: add **Brevo** back (purpose: careers/partner transactional email — receives applicant name/email + resume as an attachment; region EU/US; SCCs). Note it is distinct from HubSpot (which still owns lead-pipeline email and never receives careers data).
- Personal-data inventory: add a **career applications** row (name, email, phone, cover letter, resume file; stored in `career-applications` + private `resumes` R2; 365-day retention then resume hard-deleted + PII nulled).
- Retention schedule: add the `purge-career-applications.ts` row.
- Data-subject rights / erasure: note DSAR delete-by-email now also erases career applications + their resumes.

- [ ] **Step 5: Update `docs/WEB-PAGES.md`**

Update the careers/job page row(s) to note the apply form is live on CMS-native open jobs.

- [ ] **Step 6: Write the runbook**

Create `docs/careers-applications.md` documenting: architecture (web form → `/api/career-applications/apply` → resume to private R2 → application row → Brevo HR email), the env vars, the HR-only/no-applicant-email decision, the private-storage rationale, retention + DSAR behavior, and a local end-to-end test recipe (set `BREVO_API_KEY`/`CAREERS_HR_EMAIL` to test the relay; leave unset to skip).

- [ ] **Step 7: Full baseline checks**

Run:
```bash
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test && pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/cms/src/migrations apps/cms/.env.example CLAUDE.md docs/GDPR-COMPLIANCE.md docs/WEB-PAGES.md docs/careers-applications.md
git commit -m "feat: careers migration, env, and docs (Brevo back, retention, DSAR)"
```

---

## Task 11: End-to-end Playwright test

**Files:**
- Create: `apps/cms/tests/e2e/careers-apply.spec.ts`

- [ ] **Step 1: Write the spec**

Tagged `@phase-j-careers`. Seed a published, open, CMS-native job (via the Payload local API in a fixture/before-hook, like other e2e specs). Submit a multipart POST to `/api/career-applications/apply` with a small PDF buffer + valid fields + Turnstile test token (use the always-pass test key path as the lead specs do). Assert: 200 OK envelope; a `resumes` row + a `career-applications` row were created; `emailDelivery.status` is `skipped` (no Brevo key in CI) or `synced`. Assert a submission to a paused/ATS job returns `invalid_job`.

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cleanstart/cms test:e2e --grep @phase-j-careers` (match the repo's actual e2e script name).
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/cms/tests/e2e/careers-apply.spec.ts
git commit -m "test(cms): e2e for the careers apply endpoint"
```

---

## Self-review notes (gaps to watch during execution)

1. **`email` required vs redaction null** — Task 8 Step 3 flags that nulling a `required` field on update may be rejected by Payload; resolve by relaxing `required` on `email`/`firstName`/`lastName` at the collection level (enforce at the endpoint via Zod instead) if the purge test/real run fails. Decide during Task 8.
2. **Turnstile widget** — Task 7's form must copy the exact Turnstile integration from `BecomePartnerCta.tsx`; the snippet shows the wiring point (`setTurnstileToken`) but not the script-load boilerplate. Reuse, don't reinvent.
3. **`req.formData()` availability** — Payload endpoints expose the web `Request`; `formData()` should exist. If the runtime wraps it differently, fall back to reading `req` as the underlying request. Verify in Task 6 Step 7 build/run.
4. **autoRun shape** — Task 8 Step 6 must match the existing autoRun entries exactly; read `payload.config.ts` around the current cron registrations before editing.
5. **Migration in index.ts** — Task 10 Step 1: never leave a migration file unreferenced in `index.ts` (documented prod-outage cause).
