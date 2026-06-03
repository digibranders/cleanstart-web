# Partner Applications — Runbook

**Scope:** `apps/cms` partner ("Become a Partner") inquiry pipeline. **Date:** 2026-06-03.
**Companion docs:** `docs/GDPR-COMPLIANCE.md` (sub-processor register, retention, DSAR), `docs/careers-applications.md` (sibling careers pipeline), `CLAUDE.md` (Live integrations table).

This documents how a partner inquiry flows from the marketing site into the CMS, the two Brevo emails it sends, the privacy posture, and how to test it end-to-end locally.

The partner form is **off the HubSpot/`forms` pipeline entirely** — it does not relay to HubSpot and has no `forms` row. (The `become-a-partner` row was removed from `scripts/seed-website-forms.ts`.)

---

## 1. Architecture

```
apps/web Become-a-Partner form
   │  application/json POST (fields + consent + Turnstile token)
   ▼
POST /api/partner-applications/apply       (apps/cms — collection endpoint on `partner-applications`)
   │
   ├─ origin allow-list (LEAD_SUBMIT_ALLOWED_ORIGINS, defaults to the cleanstart.com origins)
   ├─ size guard (Content-Length or buffered arrayBuffer; PARTNER_SUBMIT_MAX_BYTES = 64 KiB)
   ├─ per-IP rate limit (lib/rate-limit, keyed `partners:<ip>`)
   ├─ Zod validation (lib/partners/partner-schema)
   ├─ honeypot (`hp` field → silent 200; flagged row persisted, no email)
   ├─ Cloudflare Turnstile verify
   ├─ inject live `policyVersion` from the `legal` global into the consent snapshot
   ├─ 1. admin notification email via Brevo (non-fatal)
   ├─ 2. applicant confirmation email via Brevo (non-fatal)
   └─ 3. append-only `partner-applications` row, with both emailDelivery* statuses embedded
   ▼
{ ok: true }
```

Endpoint: `apps/cms/src/payload/endpoints/partner-apply.ts` (registered as a `partner-applications` collection endpoint — config-level 3-segment custom endpoints 404, so it lives on the collection). The email bodies are built in `lib/partners/partner-emails.ts`; the Brevo transport is `lib/email/brevo.ts`.

Both Brevo sends happen **before** the `partner-applications.create`, so both delivery results are written into the initial append-only row (no second update). If the row create fails, the endpoint returns `502 capture_failed`.

The collection is **append-only**: `create` is restricted to admin (the endpoint uses `overrideAccess`), `update` is always denied, `delete` is admin-only. The public never POSTs to the collection directly.

---

## 2. Environment variables

| Var | Required when | Purpose |
|---|---|---|
| `BREVO_API_KEY` | to send either email | Brevo transactional API key (shared with the careers pipeline). Unset → both sends are no-ops (`status: skipped`); the inquiry still saves. |
| `BREVO_SENDER_EMAIL` | with `BREVO_API_KEY` | From-address on both emails. |
| `BREVO_SENDER_NAME` | optional (default `CleanStart`) | From-name. |
| `PARTNERS_NOTIFY_EMAIL` | to send the admin email | Recipient of the internal new-partner-inquiry notification, and the `replyTo` on the applicant confirmation. Unset → the admin email is `status: skipped` (reason `no-admin-recipient`); the applicant email still sends. |
| `PARTNER_ADMIN_TEMPLATE_ID` | optional | Brevo template ID for the admin notification. Set → template mode; unset → code-built HTML fallback. |
| `PARTNER_USER_TEMPLATE_ID` | optional | Brevo template ID for the applicant confirmation. Set → template mode; unset → code-built HTML fallback. |

---

## 3. Design decisions

### Two emails — applicant + admin
Unlike careers (HR-only), the partner pipeline sends **two** emails per inquiry: an applicant confirmation and an internal team notification. Both are non-fatal — a Brevo failure or a missing recipient never blocks the inquiry from persisting.

### Dual-mode templates (template-when-set, else code HTML)
Each email independently picks its mode from its template-ID env var:

- `PARTNER_ADMIN_TEMPLATE_ID` / `PARTNER_USER_TEMPLATE_ID` **set** (positive integer) → Brevo transactional template, passed the params object (`firstName`, `lastName`, `fullName`, `email`, `phone`, `company`, `website`, `partnerReason`, `submittedAt`).
- **unset** → the code-built HTML in `lib/partners/partner-emails.ts` (`buildPartnerAdminEmail` / `buildPartnerApplicantEmail`).

This lets the marketing team move to designed Brevo templates without a code change, while the code fallback keeps the pipeline functional out of the box.

### Brevo, not HubSpot
Partner data never enters the lead pipeline. HubSpot owns lead-pipeline email and never receives partner data; Brevo is the careers/partner transactional-email sub-processor and never receives lead-pipeline data. This separation is the GDPR boundary documented in `docs/GDPR-COMPLIANCE.md` §6.

### Delivery status is part of the immutable row
`emailDeliveryApplicant.status` and `emailDeliveryAdmin.status` (`synced` / `failed` / `skipped`) are written into the append-only `partner-applications` row, so the operator can see whether each email went out without consulting Brevo.

---

## 4. CSV export

`GET /api/partner-applications/export-csv` (`endpoints/export-partners-csv.ts`) — admin/editor only. Paginates all partner inquiries into a flat CSV (200/page, hard cap 20,000 rows; truncation surfaced via `x-partners-truncated` headers). The export **excludes `ip`/`userAgent`** (PII) and writes a `partner_exported` audit-log row.

The admin list view exposes a one-click **export button** (`admin/components/PartnersExportButton.tsx`, wired via `beforeListTable`).

---

## 5. Retention & DSAR

### Retention
There is **no time-based purge cron** for partner inquiries — rows are kept until a DSAR erasure request. (`piiRedactedAt` exists on the schema for symmetry with leads/careers but is not driven by a cron.)

### DSAR erasure
`POST /api/leads/dsar/delete` (delete-by-email) **also** erases partner inquiries: `lib/partners/dsar.ts` → `deletePartnerApplicationsByEmail()` hard-deletes every matching `partner-applications` row. There are no linked files to remove. The erasure writes an audit-log row. See `docs/GDPR-COMPLIANCE.md` §2 (Art. 17) and §4.

---

## 6. Local end-to-end test recipe

Prereqs: local Postgres at `localhost:5432` (db `cleanstart`), `apps/cms/.env` with `DATABASE_URI` + `PAYLOAD_SECRET`.

1. **Turnstile** — set Cloudflare's always-pass test keys so the challenge passes on localhost:
   ```bash
   TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```
   (Or leave `TURNSTILE_SECRET_KEY` unset to skip verification entirely in dev.)

2. **To exercise the Brevo relay**, set:
   ```bash
   BREVO_API_KEY=<your-brevo-key>
   BREVO_SENDER_EMAIL=<verified-sender@example.com>
   PARTNERS_NOTIFY_EMAIL=<your-inbox@example.com>
   ```
   A successful submit yields `emailDeliveryApplicant.status: synced` and `emailDeliveryAdmin.status: synced` on the new row, plus an email in both the applicant address and the notify inbox.

   **To skip the relay** (verify persistence only), leave `BREVO_API_KEY` unset. The inquiry still persists; both statuses are `skipped`. Leaving only `PARTNERS_NOTIFY_EMAIL` unset skips just the admin email.

3. **Submit** a JSON request:
   ```bash
   curl -i -X POST http://localhost:3000/api/partner-applications/apply \
     -H "Origin: https://cleanstart.com" \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Ada",
       "lastName": "Lovelace",
       "email": "ada@example.com",
       "phone": "+15555550123",
       "company": "Analytical Engines Ltd",
       "website": "https://example.com",
       "partnerReason": "We want to integrate.",
       "turnstileToken": "XXXX.DUMMY.TOKEN.XXXX"
     }'
   ```
   Expected: `200 { "ok": true }`. Verify in `/admin`: a new `partner-applications` row with both `emailDelivery*` statuses of `synced` or `skipped`.

4. **Negative checks:**
   - A non-empty `hp` (honeypot) field → silent `200 { ok: true }` with a flagged row (`turnstilePassed: false`) persisted and no email sent.
   - A disallowed `Origin` header → `403 origin_forbidden`.
   - An oversized body (> 64 KiB) → `413 payload_too_large`.
   - Missing `firstName` / `lastName` / `email` / `company` → `400 invalid_body`.
