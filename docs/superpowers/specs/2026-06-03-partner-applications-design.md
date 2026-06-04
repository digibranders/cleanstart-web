# Partner Applications — Design Spec

**Date:** 2026-06-03 · **Status:** Approved (design) · **Scope:** `apps/cms` + `apps/web` (branch: `development`)
**Sibling:** mirrors `docs/superpowers/specs/2026-06-03-careers-application-design.md` (careers) minus the résumé upload, plus a second email + CSV export.

## Goal

Capture "Become a Partner" submissions into a dedicated CMS collection (not HubSpot), email **both** the applicant (confirmation) and an internal admin (notification) via Brevo, give editors a list + readonly detail view, and provide a CSV export button. GDPR erasure by email is supported; there is no time-based auto-purge.

## Core principle

Partners run on the same dedicated track as careers — a standalone collection + endpoint + Brevo, **entirely off HubSpot**. The current partner form posts to `/api/leads/submit` (→ HubSpot); this cuts that path and points the form at a new partner endpoint.

## Decisions (locked)

- **Export format:** CSV (reuses the `export-leads-csv.ts` pattern; no new dependency).
- **Emails:** two Brevo dashboard templates (dual-mode with code-built HTML fallback, same as careers).
- **Retention/GDPR:** DSAR erasure by email, **no** auto-purge cron.
- **Admin group:** `Marketing`. **Admin recipient:** `PARTNERS_NOTIFY_EMAIL` env (not a per-row field).

---

## 1. Data model — `partner-applications` collection (apps/cms)

Append-only; admin group `Marketing`; native readonly detail view via `update: () => false`.

Submitted fields (top-level, not JSON):
- `firstName`, `lastName` — text, required
- `email` — email, required (business email)
- `phone` — text
- `company` — text, required
- `website` — text, optional, URL-validated (reuse `normalizeOptionalUrlHook` + `validateOptionalUrl`)
- `partnerReason` — textarea (the "Why are you interested in partnering with us?" field)

Audit / GDPR (read-only):
- `source` (referrer), `ip`, `userAgent`
- `consentGivenAt` (date), `consentSnapshot` (textarea), `privacyPolicyVersion` (text)
- `consentCategories` — array of `{ category: text }`
- `honeypot` (text), `turnstilePassed` (checkbox, default true)
- `piiRedactedAt` (date, `access.update: () => false`)

Delivery tracking — `emailDelivery` group, **two** sub-groups:
- `applicant` — `{ status: select(synced|failed|skipped), messageId: text, error: text }`
- `admin` — `{ status: select(synced|failed|skipped), messageId: text, error: text }`

Admin:
- `useAsTitle: 'email'`
- `defaultColumns: ['firstName', 'lastName', 'email', 'company', 'emailDelivery', 'createdAt']`
- `beforeListTable`: a `PartnersExportButton` component (§4)

Access: `read: isAdminOrEditor` · `create: isAdmin` (endpoint uses `overrideAccess`) · `update: () => false` · `delete: isAdmin`. `timestamps: true` (`createdAt` = submission timestamp).

Endpoints mounted on the collection: `partnerApplyEndpoint`, `partnerApplyOptionsEndpoint`, `partnerExportCsvEndpoint`.

---

## 2. Submit endpoint — `POST /api/partner-applications/apply`

JSON body (no file upload), mirroring `submit-lead.ts` security. Companion `OPTIONS` preflight.
- Origin allow-list (reuse `LEAD_SUBMIT_ALLOWED_ORIGINS` semantics), content-length cap **64 KB** (413 before rate-limit), per-IP rate-limit keyed `partners:${ip}`, honeypot (`website` field → silent 200, persists flagged row without sending email), Turnstile verify (no exemption), Zod validation.
- Flow:
  1. Origin → content-length → rate-limit → JSON parse.
  2. Zod-validate (`partnerSubmissionSchema`).
  3. Honeypot tripped → persist flagged row (no emails), return 200.
  4. Turnstile verify.
  5. Inject live `policyVersion` from the `legal` global into the consent snapshot.
  6. **Send applicant email** (Brevo, non-fatal) → capture `emailDelivery.applicant`.
  7. **Send admin email** (Brevo, non-fatal) → capture `emailDelivery.admin`.
  8. Create the append-only row with both delivery results embedded.
  9. Return `{ ok: true }` (never leak IDs).
- Emails are sent **before** the create so both results land in the initial append-only row (no post-create update). A failed email never blocks capture.

---

## 3. Emails — Brevo dual-mode (mirrors careers)

Reuses the existing `lib/email/brevo.ts` `sendBrevoEmail` (templateId+params OR htmlContent).

- **Applicant confirmation** → to `submission.email`. "Thanks for your interest in partnering with CleanStart — our team will be in touch." `replyTo` = `PARTNERS_NOTIFY_EMAIL` (so a reply reaches the partnerships inbox). Template `PARTNER_USER_TEMPLATE_ID`.
- **Admin notification** → to `PARTNERS_NOTIFY_EMAIL`, all submitted details. `replyTo` = applicant email. Template `PARTNER_ADMIN_TEMPLATE_ID`.
- **Dual-mode:** when a template ID is a positive integer, send `templateId` + `params`; else build code HTML. Two code builders in `lib/partners/partner-emails.ts`: `buildPartnerApplicantEmail()` and `buildPartnerAdminEmail()` (HTML-escaped, same structure as `hr-email.ts`).
- **Params (both templates):** `firstName, lastName, fullName, email, phone, company, website, partnerReason, submittedAt`.
- **HTML templates** (deliverables, paste into Brevo): `docs/email-templates/brevo-partner-user-confirmation.html` and `docs/email-templates/brevo-partner-admin-notification.html` — reuse the careers logo header + social/address footer; **tag-free comments** (Brevo parses comments — no literal `{{ }}`/`{% %}` in comments).
- Skip semantics: if `BREVO_API_KEY` unset → both skip; if `PARTNERS_NOTIFY_EMAIL` unset → admin email skips (`no-admin-recipient`), applicant still attempts.

---

## 4. CSV export

- `GET /api/partner-applications/export-csv` (collection endpoint). Admin/editor only (403 otherwise). Paginate in 200-row chunks, hard cap 20,000 rows. Reuse the `toCsv()` util.
- Columns: `id, createdAt, firstName, lastName, email, phone, company, website, partnerReason, consentGivenAt, privacyPolicyVersion, consentCategories, emailDelivery_applicant, emailDelivery_admin`. **Exclude** `ip`/`userAgent` (PII, mirrors leads export).
- Headers: `content-type: text/csv; charset=utf-8`, `content-disposition: attachment; filename="partners-YYYY-MM-DD.csv"`, `cache-control: no-store`. Writes an `audit-log` row `action: 'partner_exported'` (non-fatal), capturing actor, ip, rowCount, truncated.
- **`PartnersExportButton.tsx`** (admin `beforeListTable`, `'use client'`): a button that fetches the export endpoint with `credentials: 'include'`, turns the response into a Blob, and triggers a browser download. Disabled state while downloading; surfaces the truncation header if present.

---

## 5. Web — rewire the partner form

- New `apps/web/src/lib/partners/submitPartner.ts` — JSON POST to `${NEXT_PUBLIC_CMS_URL}/api/partner-applications/apply`. Shape: `{ firstName, lastName, email, phone, company, website, partnerReason, source, consent, turnstileToken, website: honeypot }`. (Note: the honeypot field and the real `website` field collide by name in the current form — rename the honeypot to `companyWebsiteHp` or send honeypot separately; the endpoint reads the honeypot from a distinct key.)
- `BecomePartnerCta.tsx` — keep modal, fields, `LeadConsent`, `TurnstileWidget`, success/error states; **only change the submit call** from `submitLead`/HubSpot `NAME_MAP` to `submitPartner` with clean field names. Consent categories stay `['storage', ...('marketing')]`.

---

## 6. DSAR (erasure by email, no auto-purge)

- `lib/partners/dsar.ts` → `deletePartnerApplicationsByEmail(payload, email)` — find by email, hard-delete each row, return count (mirrors `deleteCareerApplicationsByEmail`; no linked file to delete).
- Wire into the existing delete-by-email DSAR endpoint (`endpoints/leads-dsar.ts`): after leads + careers, also erase partner applications and write a `dsar_erasure` audit row when count > 0; include the count in the response.
- **No retention cron** — partner inquiries persist until erased on request.

---

## 7. Unwire HubSpot + migration + docs

- `apps/cms/scripts/seed-website-forms.ts` — remove the `become-a-partner` row (the web form no longer routes through `forms`/HubSpot). The HubSpot form (`ea66c444-…`) stays but stops receiving submissions.
- DB migration: new `partner_applications` table (+ the `email_delivery_*` enums). Generate with `R2_RESUME_PREFIX` set to the committed default to avoid prefix churn (see careers migration lesson); fix the generated migration's unused-param quirk (`{ db }` + `import type`); ensure it's referenced in `migrations/index.ts`.
- `.env.example` — `PARTNER_USER_TEMPLATE_ID`, `PARTNER_ADMIN_TEMPLATE_ID`, `PARTNERS_NOTIFY_EMAIL`.
- `CLAUDE.md` — Brevo live-integration note covers partner email; mention the collection.
- `docs/operations/GDPR-COMPLIANCE.md` — partner-applications in the personal-data inventory; Brevo as sub-processor for partner email (applicant + admin); DSAR erasure covers partners.
- `docs/web/WEB-PAGES.md` — partners page status.
- New `docs/features/partner-applications.md` runbook.

---

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `collections/PartnerApplications.ts` | record + endpoint/export mount | access, url-shape, endpoints |
| `lib/partners/partner-schema.ts` | Zod for the apply payload | zod |
| `lib/partners/partner-emails.ts` | applicant + admin HTML builders | — |
| `endpoints/partner-apply.ts` | JSON intake, validation, two-email orchestration | brevo, schema, turnstile, rate-limit |
| `endpoints/export-partners-csv.ts` | CSV export + audit | toCsv, audit-log |
| `admin/components/PartnersExportButton.tsx` | list-view export trigger | @cleanstart/ui, useConfig |
| `lib/partners/dsar.ts` | erasure by email | payload |
| web `submitPartner.ts` + `BecomePartnerCta.tsx` | transport + UI | nav/consent/turnstile |

## Out of scope (v1)

- Retention/auto-purge cron (DSAR-only by decision).
- Per-row admin-recipient override (env `PARTNERS_NOTIFY_EMAIL`).
- Excel/PDF export (CSV only).
- A public partner-status portal.

## Testing

- Unit (Vitest, co-located): `partner-schema` (valid/invalid), `partner-emails` (escaping, optional rows, subject), `dsar` (delete-by-email count), endpoint validation paths (honeypot, turnstile, zod) where unit-testable.
- E2E (Playwright, tagged `@phase-j-partners`): submit a valid partner payload against the endpoint → assert `200`, a `partner-applications` row created with both `emailDelivery` sub-statuses recorded; assert honeypot submission returns 200 without creating a row; assert the export endpoint returns CSV for an admin.
