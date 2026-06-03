# Careers Applications — Runbook

**Scope:** `apps/cms` careers apply pipeline. **Date:** 2026-06-03.
**Companion docs:** `docs/GDPR-COMPLIANCE.md` (sub-processor register, retention, DSAR), `CLAUDE.md` (Live integrations + Background jobs tables).

This documents how a job application flows from the marketing site into the CMS, the integration with Brevo for HR notifications, the privacy posture, and how to test it end-to-end locally.

---

## 1. Architecture

```
apps/web careers form
   │  multipart/form-data POST (resume + fields + Turnstile token)
   ▼
POST /api/career-applications/apply        (apps/cms — collection endpoint on `career-applications`)
   │
   ├─ size guard (Content-Length or buffered arrayBuffer; CAREERS_MAX_BYTES = 12 MiB)
   ├─ per-IP rate limit (lib/rate-limit, keyed `careers:<ip>`)
   ├─ Zod validation (lib/careers/application-schema)
   ├─ honeypot (`website` field → silent 200)
   ├─ resume mime + size check (PDF / DOC / DOCX)
   ├─ Cloudflare Turnstile verify (no exemption for careers)
   ├─ job lookup (depth 1): must be _status=published, hiringStatus=open, source=cms  → else `invalid_job`
   │     (also derives a location string from `remote` + the job's `locations` names —
   │      e.g. "Remote", "Remote · San Jose", or "Austin, Berlin" — via lib/careers/job-location)
   │
   ├─ 1. resume → `resumes` upload collection (PRIVATE R2 prefix)
   ├─ 2. inject live `policyVersion` from the `legal` global into the consent snapshot
   ├─ 3. HR notification email via Brevo (non-fatal) — resume attached
   └─ 4. append-only `career-applications` row, with `jobTitleSnapshot`,
         `jobLocationSnapshot`, and `emailDelivery` status embedded
   ▼
{ ok: true }
```

Endpoint: `apps/cms/src/payload/endpoints/careers-apply.ts` (registered as a `career-applications` collection endpoint — config-level 3-segment custom endpoints 404, so it lives on the collection). The HR email body is built in `lib/careers/hr-email.ts`; the Brevo transport is `lib/email/brevo.ts`.

The endpoint sends the HR email **before** the `career-applications.create`, so the delivery result is written into the initial append-only row (no second update). If the resume upload or the row create fails, the endpoint returns `502 capture_failed`.

---

## 2. Environment variables

| Var | Required when | Purpose |
|---|---|---|
| `BREVO_API_KEY` | to send HR email | Brevo transactional API key. Unset → relay is a no-op (`status: skipped`, reason `env-not-configured`); the application still saves and the resume still uploads. |
| `BREVO_SENDER_EMAIL` | with `BREVO_API_KEY` | From-address on the HR notification. |
| `BREVO_SENDER_NAME` | optional (default `CleanStart`) | From-name. |
| `CAREERS_HR_EMAIL` | to send HR email | Recipient of the notification. Unset → `status: skipped`, reason `no-hr-recipient`. |
| `CAREERS_RETENTION_DAYS` | optional (default `365`) | Retention window for `purge-career-applications`. |
| `R2_RESUME_PREFIX` | optional | Private R2 key prefix for resumes (`web/resumes` prod, `dev/resumes` dev/staging when unset). Kept out of the public media prefix so resumes are never publicly addressable. |

Both `BREVO_API_KEY` and `CAREERS_HR_EMAIL` must be set for the relay to actually fire. Either one unset → the email is skipped (application is still persisted).

---

## 3. Design decisions

### HR-only — no applicant confirmation email
The pipeline sends exactly **one** email: an HR notification (with the resume attached, and `replyTo` set to the applicant so HR can reply directly). There is intentionally **no applicant-facing confirmation email** at v1 — it would require managing an applicant-addressed template, double opt-in considerations, and a deliverability surface we don't need for an internal notification. Adding it later is additive (a second `sendBrevoEmail` call).

### Brevo, not HubSpot
Careers data never enters the lead pipeline. HubSpot owns lead-pipeline email and never receives careers data; Brevo is the careers/partner transactional-email sub-processor and never receives lead-pipeline data. This separation is the GDPR boundary documented in `docs/GDPR-COMPLIANCE.md` §6.

### Private resume storage
Resumes are uploaded to the `resumes` collection under a **private** R2 prefix (`R2_RESUME_PREFIX`), distinct from the public media prefix. Resume files contain applicant PII and must never be publicly addressable — they are reachable only through authenticated admin access and are emailed to HR as an attachment at submit time.

### Delivery status is part of the immutable row
`emailDelivery.status` (`synced` / `failed` / `skipped`) is written into the append-only `career-applications` row, so the operator can see whether HR was notified without consulting Brevo.

---

## 4. Retention & DSAR

### Retention
The `purge-career-applications.ts` cron (daily **03:45 UTC**, gated by `PAYLOAD_AUTO_RUN=true`) hard-deletes the resume file from private R2 and nulls applicant PII on `career-applications` rows older than `CAREERS_RETENTION_DAYS` (default 365). Idempotent — already-purged rows are skipped. Logic lives in `lib/retention/purge-career-applications.ts`.

### DSAR erasure
`POST /api/leads/dsar/delete` (delete-by-email) now **also** erases career applications: `lib/careers/dsar.ts` → `deleteCareerApplicationsByEmail()` deletes every matching `career-applications` row and hard-deletes each linked `resumes` file. Resume-delete failures are logged but never block the application delete. See `docs/GDPR-COMPLIANCE.md` §2 (Art. 17) and §4.

---

## 5. Local end-to-end test recipe

Prereqs: local Postgres at `localhost:5432` (db `cleanstart`), `apps/cms/.env` with `DATABASE_URI` + `PAYLOAD_SECRET`, and a published / open / CMS-native job (a `jobs` row with `_status=published`, `hiringStatus=open`, `source=cms`).

1. **Turnstile** — set Cloudflare's always-pass test keys so the challenge passes on localhost:
   ```bash
   TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```
   (Or leave `TURNSTILE_SECRET_KEY` unset to skip verification entirely in dev.)

2. **To test the Brevo relay**, set both:
   ```bash
   BREVO_API_KEY=<your-brevo-key>
   BREVO_SENDER_EMAIL=<verified-sender@example.com>
   CAREERS_HR_EMAIL=<your-inbox@example.com>
   ```
   A successful submit yields `emailDelivery.status: synced` on the new row and an email (resume attached) in the HR inbox.

   **To skip the relay** (verify persistence only), leave `BREVO_API_KEY` and/or `CAREERS_HR_EMAIL` unset. The application + resume still persist; `emailDelivery.status: skipped`.

3. **Submit** a multipart request (replace `<slug>` with the open job's slug):
   ```bash
   curl -i -X POST http://localhost:3000/api/career-applications/apply \
     -H "Origin: https://cleanstart.com" \
     -F "jobSlug=<slug>" \
     -F "firstName=Ada" \
     -F "lastName=Lovelace" \
     -F "email=ada@example.com" \
     -F "phone=+15555550123" \
     -F "coverLetter=Excited to apply." \
     -F "turnstileToken=XXXX.DUMMY.TOKEN.XXXX" \
     -F "resume=@/path/to/resume.pdf;type=application/pdf"
   ```
   Expected: `200 { "ok": true }`. Verify in `/admin`: a new `resumes` row (private) and a `career-applications` row with `emailDelivery.status` of `synced` or `skipped`.

4. **Negative checks:**
   - Submit to a paused/ATS job (`hiringStatus != open`, or `source != cms`, or unpublished) → `400 invalid_job`.
   - Omit the resume → `400 resume_required`. Non-PDF/DOC mime → `400 resume_type_unsupported`. Oversized → `413 payload_too_large`.
   - A non-empty `website` (honeypot) field → silent `200 { ok: true }` with nothing persisted.

The automated coverage lives in `apps/cms/tests/e2e/careers-apply.spec.ts` (tagged `@phase-j-careers`).
