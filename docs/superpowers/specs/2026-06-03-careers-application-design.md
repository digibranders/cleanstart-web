# Careers Application — Design Spec

**Date:** 2026-06-03 · **Status:** Approved (design) · **Scope:** `apps/cms` + `apps/web` (branch: `development`)

## Goal

Let a candidate apply to a CMS-native job posting from the public site. The application (name, email, phone, cover letter, LinkedIn) is stored in the CMS DB; the uploaded resume (PDF/DOC/DOCX) is stored privately on R2 with its reference in the DB; and HR is notified by email (via Brevo) with the resume attached. **No HubSpot involvement** — careers run on a track entirely separate from the `leads`/HubSpot lead pipeline.

## Core principle

Careers are **not** part of the generic `forms`/`leads`/`crmHandlers` pipeline (that pipeline is JSON-only, has no file-upload field type, and is wired to HubSpot). A dedicated collection + dedicated multipart endpoint + Brevo email keeps "HubSpot will never have a career form" a structural guarantee, not a toggle.

---

## 1. Data model (apps/cms — two new collections)

### `resumes` (upload collection, **private**)
- `upload: true`; accepted MIME: `application/pdf`, `application/msword` (.doc), `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx). Size cap **10 MB**.
- Stored on R2 under a **private** prefix (`${env}/resumes`) with **Payload access control ON** — unlike the `media` collection, which sets `disablePayloadAccessControl: true` and serves public CDN URLs. Resumes are downloaded only through the authenticated `/api/resumes/file/:filename` route.
- `access`: `read`/`create`/`update`/`delete` → admin/editor only. The submit endpoint creates rows via `overrideAccess`.
- No image-resize formats (not an image). `admin.group: 'Recruiting'`, hidden from public.

### `career-applications` (append-only)
Fields:
- `job` — relationship → `jobs`, required.
- `jobTitleSnapshot` — text, read-only. Snapshot of the job title at apply time so the record survives job edits/deletes (mirrors how `leads.formSchemaVersion` preserves meaning).
- `firstName`, `lastName`, `email`, `phone` — text/email.
- `coverLetter` — textarea, optional.
- `linkedinUrl` — text, optional, URL-validated.
- `resume` — relationship → `resumes`, required.
- `source` — text (referrer URL), sidebar.
- `ip`, `userAgent` — read-only, auto-purged by retention cron.
- `consentGivenAt`, `consentSnapshot`, `privacyPolicyVersion` — GDPR audit trail (read-only).
- `emailDelivery` — group: `status` (`synced` | `failed` | `skipped`), `messageId` (text), `error` (text). Records the Brevo HR-notify outcome.
- `honeypot`, `turnstilePassed` — spam flags.
- `piiRedactedAt` — date, stamped by the retention cron.

`access`: `read` → admin/editor · `create` → admin (endpoint uses `overrideAccess`) · `update` → `() => false` (append-only) · `delete` → admin.
`admin`: `group: 'Recruiting'`, `useAsTitle: 'email'` (or a name composite), `defaultColumns: ['job', 'firstName', 'lastName', 'email', 'emailDelivery', 'createdAt']`. Applicant name/email are top-level columns (no JSON blob, unlike leads).

---

## 2. Storage & limits

- `payload.config.ts`: add `resumes` to the `s3Storage` `collections` map **without** `disablePayloadAccessControl` (keeps Payload-proxied, access-controlled downloads). Private prefix `${env}/resumes` (e.g. `web/resumes`, `dev/resumes`). When R2 env is incomplete (local dev), falls back to the collection's local `staticDir`, same as media.
- `lib/upload-limits.ts`: add `.doc` + `.docx` MIME types and a `RESUME_LIMIT = 10 * MB`; extend `limitForMime` + `ALLOWED_MIME_TYPES` (or a dedicated resume validator) so resumes are size-checked.

---

## 3. Brevo email (revived, generalized)

- New `lib/email/brevo.ts`: `sendBrevoEmail({ to, replyTo, subject, htmlContent, attachments })` → `POST https://api.brevo.com/v3/smtp/email` with header `api-key: BREVO_API_KEY`, 10 s `AbortSignal.timeout`, typed `IntegrationError` on non-2xx/network, error bodies passed through `redactWebhookErrorBody`. Returns `{ messageId }`. Reusable so the **partner form can share it later**.
- Attachments: `[{ name, content }]` where `content` is base64 — **required** because the resume has no public URL. The endpoint base64-encodes the in-memory upload buffer (no R2 round-trip needed for the email).
- HR notification is **code-built HTML** (self-contained: applicant name, email, phone, job title, cover letter, LinkedIn) — chosen over a Brevo dashboard template for robustness and zero dashboard dependency. Applicant email set as `replyTo`. **HR-only**, no applicant confirmation email (per requirements).
- Env: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `CAREERS_HR_EMAIL`. If `BREVO_API_KEY` is unset (local dev), the send is a graceful **skip** → `emailDelivery.status = 'skipped'`, application still saved.

---

## 4. Submit endpoint

- `POST /api/career-applications/apply` — registered as a **collection** endpoint on `career-applications` (avoids the documented 3-segment config-endpoint 404), plus an OPTIONS preflight.
- Accepts **`multipart/form-data`**: text fields + `resume` file + `turnstileToken` + honeypot (`website`) + `jobSlug` + `consent`.
- Security mirrors `submit-lead.ts`: origin allow-list (reuse `LEAD_SUBMIT_ALLOWED_ORIGINS` semantics), content-length cap (~12 MB, rejected with 413 before rate-limit), per-IP rate-limit keyed `careers:${ip}`, honeypot trap (returns 200 OK; persists flagged record without sending email), Turnstile verify, Zod validation of text fields, file MIME+size validation via `checkUploadSize`.
- Flow:
  1. Origin → content-length → rate-limit → parse multipart.
  2. Zod-validate text fields; validate file MIME + size.
  3. Resolve `job` by slug: must exist, `_status: 'published'`, `hiringStatus: 'open'`, `source: 'cms'`. Generic `invalid_job` 400 on any miss (no enumeration).
  4. Honeypot tripped → persist flagged application (no resume create, no email), return 200.
  5. Turnstile verify (no exemption for careers).
  6. Create `resumes` doc from the in-memory buffer (`payload.create({ collection: 'resumes', file: { data, mimetype, name, size }, overrideAccess: true })`).
  7. Inject live `policyVersion` from the `legal` global into the consent snapshot.
  8. Send Brevo HR email with base64 attachment — **non-fatal**; capture the outcome into an `emailDelivery` value (`synced`/`failed`/`skipped` + messageId/error). The send happens *before* the application create so the result is written in the initial row — no post-create update against the append-only collection.
  9. Create `career-applications` doc (links resume + job, snapshots `jobTitleSnapshot`, embeds the captured `emailDelivery`).
  10. Return thin OK envelope `{ ok: true }` — never leaks IDs or answers.
- **Failure handling:** if the application create fails, return 502 and the applicant retries. No R2 fallback queue for v1 (accepted tradeoff — documented; multipart parking is heavy and careers volume is low). Resume-create failure → 502 before any application row is written (no orphan).

---

## 5. Web (apps/web — per-job apply form)

- On `/job/[slug]`: render an **Apply** section/modal **only** when `source: 'cms'` and `hiringStatus: 'open'`. ATS jobs keep linking out via `atsUrl`/`applyUrl`.
- New `components/sections/careers/JobApplyForm.tsx`. Fields: first name, last name, email, phone, **resume** (`accept=".pdf,.doc,.docx"`, client-side size guard 10 MB), cover letter (optional), LinkedIn (optional), consent checkbox + privacy link, Turnstile, honeypot.
- New `lib/careers/submitApplication.ts` — FormData/multipart sibling of `submitLead.ts`; posts to `${NEXT_PUBLIC_CMS_URL}/api/career-applications/apply`.
- Follows apps/web canonical rules: role typography tokens, `<Section>/<Container>`, 16 px inputs (iOS), `next/image` rules, FadeUp below the fold. Success → inline thank-you; failure → retry prompt.

---

## 6. GDPR / retention (in scope)

Resumes are sensitive PII; keep the codebase's existing posture consistent.
- **DSAR**: extend the existing delete-by-email path (`endpoints/leads-dsar.ts` or a sibling) to also find/purge matching `career-applications` **and hard-delete their `resumes` files** from R2. Write the same `dsar_erasure` audit rows.
- **Retention cron** `jobs/purge-career-applications.ts` (gated by `PAYLOAD_AUTO_RUN`, configurable window default **365 days**): hard-deletes the resume file + nulls applicant PII (or deletes the application row), stamps `piiRedactedAt`. Idempotent. Co-located test. Add to the cron table in `CLAUDE.md`.

---

## 7. Docs to update

- `apps/cms/.env.example` — `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `CAREERS_HR_EMAIL`, resume R2 prefix note.
- `CLAUDE.md` — Brevo back in the live-integrations table (careers/partner email); new cron row for `purge-career-applications`.
- `docs/GDPR-COMPLIANCE.md` — Brevo re-added as a sub-processor (careers/partner email); careers PII + private resume storage + retention added to the inventory and sub-processor register.
- `docs/WEB-PAGES.md` — job apply status.
- New `docs/careers-applications.md` — runbook (architecture, Brevo config, env, gotchas, local test).

---

## Components & boundaries (one responsibility each)

| Unit | Responsibility | Depends on |
|---|---|---|
| `collections/Resumes.ts` | private upload collection | upload-limits, access |
| `collections/CareerApplications.ts` | application record + endpoint mount | access, endpoint |
| `lib/email/brevo.ts` | transactional send (reusable) | env, AppError, redact |
| `lib/careers/build-hr-email.ts` | HR notification HTML builder | — |
| `endpoints/careers-apply.ts` | multipart intake, validation, orchestration | brevo, collections, turnstile, rate-limit |
| `jobs/purge-career-applications.ts` | retention | payload, siteSettings |
| web `JobApplyForm.tsx` + `submitApplication.ts` | UI + transport | nav/typography tokens |

## Out of scope (v1)

- Applicant confirmation email (HR-only by decision; easy additive later).
- R2 fallback queue for failed application writes.
- Per-job HR recipient override field (env `CAREERS_HR_EMAIL` for v1).
- Partner-form Brevo rewire — separate follow-up once the user shares the partner spec; `lib/email/brevo.ts` is built to be shared.
- Applicant self-service status portal.

## Testing

- Unit (Vitest, co-located): `brevo.ts` (skip-when-unconfigured, attachment shaping, error mapping), `build-hr-email.ts`, `upload-limits.ts` (resume MIME/size), endpoint validation (Zod + file checks + honeypot + job-resolution), `purge-career-applications.ts`.
- E2E (Playwright, tagged `@phase-j-careers`): submit a CMS-native job application end-to-end against a published open job; assert application row + resume doc created, `emailDelivery` recorded.
