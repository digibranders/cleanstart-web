# GDPR & Privacy Compliance — CleanStart Website

**Status:** Audit snapshot · **Date:** 2026-06-03 · **Scope:** `apps/cms`, `apps/web`, integrations/infra
**Companion:** [`docs/integrations/forms-hubspot-overview.html`](../integrations/forms-hubspot-overview.html) §9 is the at-a-glance version; this file is the detailed reference.

> This is an engineering compliance audit (what the codebase does today), **not legal advice**. Where the architecture doc (`docs/architecture/cleanstart-cms-architecture.html` §`#privacy-gdpr`) describes *intent*, this document records what is *actually implemented*, verified against the code on 2026-06-02.

---

## 1. Executive summary

| Layer                     | Verdict     | One-line                                                                                                    |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| **Backend (CMS)**   | 🟢 Strong   | Consent proof, retention crons, full DSAR tooling, erasure + audit, PII redaction, encryption — all built. |
| **Frontend (web)**  | 🟠 Gaps     | No cookie-consent / CMP at all; 3 of 6 forms collect PII without a consent checkbox.                        |
| **Governance docs** | 🔴 Missing  | RoPA, LIA, TIA, retention policy, breach runbook, signed DPAs — referenced everywhere, none exist in repo. |
| **Admin security**  | 🟠 Deferred | Admin is password-only at v1; 2FA (TOTP) deferred to a hardening phase (backlog A9).                        |

**The shape of the work:** the hard engineering (consent capture, retention, erasure, redaction, security of processing) is done. The remaining work is mostly **web-frontend wiring** (cookie consent, form consent parity) and **legal/governance paperwork** (RoPA/LIA/TIA/DPAs).

> **2026-06-03 update:** the marketing-site forms are now wired live and submit lead PII to **HubSpot** (Forms Submissions API) on every submission — see `docs/integrations/forms-hubspot-verification.md`. The legacy Brevo **lead-email** handler (the old secondary email handler and its `leads.emailHealth` field) has been removed; **HubSpot is the sole CRM and lead-pipeline email sub-processor** and never receives careers data.
>
> **2026-06-03 — careers:** **Brevo is re-introduced for a different, narrowly-scoped purpose:** careers/partner transactional email. The careers apply endpoint (`POST /api/career-applications/apply`) relays a new-application notification — including the applicant's name/email and the resume as an attachment — to HR via Brevo. This is unrelated to the retired lead-email path; Brevo never touches lead-pipeline data, and HubSpot never touches careers data. See `docs/features/careers-applications.md` for the runbook.

---

## 2. Backend (CMS) — implemented ✅

All paths under `apps/cms/src/payload/` unless noted.

| GDPR dimension                                              | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consent capture & proof (Art. 7)**                  | ✅         | `collections/Leads.ts` — fields `consentGivenAt`, `consentSnapshot`, `privacyPolicyVersion`, `consentCategories` (all read-only). The policy version is fetched from the `legal` global and **injected server-side** in `endpoints/submit-lead.ts` so the client cannot spoof it. Captured into the lead by `lib/lead-handlers/db-primary.ts`. The `forms` collection supports a `consent` field type whose `consentText` is snapshotted onto each lead.                                                                                                                                                                                                  |
| **Retention & data minimization (Art. 5(1)(c), (e))** | ✅         | Cron jobs (gated by `PAYLOAD_AUTO_RUN=true`): `jobs/purge-leads-pii.ts` (daily 03:15 UTC, 365-day window — nulls `ip`, `userAgent`, and PII keys inside the `fields` JSON, stamps `piiRedactedAt`), `jobs/purge-search-log.ts` (daily 03:00, 90-day), `jobs/purge-preview-audit.ts` (daily 03:30, 90-day). Retention window is configurable via `globals/siteSettings.ts` → `leads.retentionDays`. PII detection logic in `lib/retention/redact-fields.ts` (form-field `type:'email'` + name heuristics for phone/email).                                                                                                                                    |
| **Right of access (Art. 15)**                         | ✅         | `endpoints/leads-dsar.ts` → `GET /api/leads/dsar/find?email=` (admin-only, rate-limited). Admin UI: `admin/components/DsarActionsPanel.tsx`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Right to data portability (Art. 20)**               | 🟠 Partial | `endpoints/export-leads-csv.ts` exports leads as CSV (includes `consentGivenAt`, `privacyPolicyVersion`; hard cap ~20,000 rows). **Gap:** no per-subject JSON export endpoint — CSV is export-all, not per-data-subject.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Right to rectification (Art. 16)**                  | 🟠 Partial | The arch doc describes an "update by email" admin action;**not confirmed in code** (only find / delete / export endpoints found). Treat as unverified / to-build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Right to erasure (Art. 17)**                        | ✅         | `POST /api/leads/dsar/delete` hard-deletes matching leads; cascades to HubSpot via `lib/lead-handlers/hubspot.ts` → `hubspotGdprDeleteByEmail()` (`POST /crm/v3/objects/contacts/gdpr-delete`, fail-soft). Delete-by-email **also erases matching career applications and their resumes** (the `career-applications` row + the private `resumes` R2 object) **and matching partner applications** (the `partner-applications` rows). Every deletion writes an immutable row via the `writeLeadDeletionAudit` hook → `collections/audit-log.ts` (`dsar_erasure` / `lead_deleted`). HubSpot (leads) is the only downstream CRM that receives lead PII; careers and partner data live only in Postgres (+ private R2 for resumes), so the cascade is complete. |
| **PII in telemetry / logs**                           | ✅         | `sentry.server.config.ts` — `sendDefaultPii:false` + `beforeSend`/`beforeBreadcrumb` redaction (keys: `fields`, `ip`, `userAgent`, `email`, `password`, `turnstileToken`, `consent`). `sentry.client.config.ts` — session replay disabled. `lib/webhooks/redact-error-body.ts` scrubs secrets from webhook error logs. The `lead.submitted` webhook payload is **metadata-only** (formId, formSlug, duplicate flag, source) — never field values (`endpoints/submit-lead.ts`).                                                                                                                                                                  |
| **Security of processing (Art. 32)**                  | ✅         | AES-256-GCM encryption of integration secrets via `lib/integrations/secrets.ts` (HKDF-SHA256 key from `PAYLOAD_SECRET`, wire format `v1:<base64(iv‖tag‖ct)>`). Cloudflare Turnstile (`lib/turnstile.ts`). Per-IP rate limiting (`lib/rate-limit.ts`, 5/min · 50/day; single-process — multi-worker needs a shared store). Standard-Webhooks HMAC-SHA256 signing (`lib/webhooks/sign.ts`).                                                                                                                                                                                                                                                                              |

### Backend gaps / deferred

- **`consentCategories` empty** — field exists but stays unpopulated until a CMP feeds it. *(blocked on web CMP)*
- **No `ConsentLog` collection** — `WEB-PRODUCTION.md` specs `/api/consent` → `ConsentLog`; neither exists yet. *(P0, ships with the CMP)*
- **Rate limiter is in-memory / single-process** — would need Redis/Postgres backing on a multi-worker deploy. *(scaling note)*

---

## 3. Frontend (web) — the real gaps ⚠️

All paths under `apps/web/src/`.

| Item                                     | Status           | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cookie consent / CMP**           | 🔴 Missing       | No banner, no CMP library in `package.json`, no `/api/consent`, no `cs_consent` cookie, no Consent Mode. `docs/web/WEB-PRODUCTION.md` fully specifies it (geo-gated to EEA/UK/CH/CA, Consent Mode v2 with all 4 signals default-denied, one-click "Reject all" parity) — **none of it is built.**                                                                                                                                                                                             |
| **Analytics without consent gate** | 🟠 Grey area     | `app/layout.tsx` renders `@vercel/analytics`, `@vercel/speed-insights`, and a Sentry web-vitals reporter (`components/observability/WebVitals.tsx`) unconditionally. Defensible **today** because they are cookieless / no session replay (the project's documented stance), but a CMP **must** gate them — and certainly any GA4 / HubSpot tracking script — before those ship. CSP already allow-lists GA4 domains (`lib/security/csp.ts`) though no GA4 script is active yet. |
| **Form consent UX**                | 🟠 Uneven        | Has consent:**Book a Demo** (`consent_marketing` + required `consent_storage` + privacy link), **Resource Lead Capture** (1 generic consent + privacy link). **No consent at all:** `contact/ContactForm.tsx`, `sections/forms/DealRegistrationForm.tsx`, `sections/partners/BecomePartnerCta.tsx` — these collect PII (names, emails, phones) with no checkbox or privacy-policy link.                                                                                     |
| **Privacy Policy**                 | ✅               | `app/privacy-policy/page.tsx` — real, dated content.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Cookie Policy / Terms pages**    | 🔴 Missing       | No `/cookies`, `/cookie-policy`, or `/terms` route.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **DNT / GPC**                      | 🔴 Missing       | No `navigator.doNotTrack` or Global Privacy Control handling.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Client → third-party PII**      | ✅ Safe          | Forms POST only to the CMS (`/api/leads/submit` via `components/forms/FormRenderer.tsx`); no PII sent to HubSpot/external from the browser.                                                                                                                                                                                                                                                                                                                                                          |
| **CSP / security headers**         | ✅ (report-only) | `lib/security/csp.ts` + `proxy.ts` — nonce-based, `strict-dynamic`, HSTS in prod. Default mode is **Report-Only**; enforce with `CSP_ENFORCE=1`.                                                                                                                                                                                                                                                                                                                                          |

---

## 4. Data-subject rights coverage

| Right                  | Article | Status              | Mechanism                                                                                     |
| ---------------------- | ------- | ------------------- | --------------------------------------------------------------------------------------------- |
| Be informed            | 13–14  | ✅                  | Privacy Policy page (web)                                                                     |
| Consent (lawful basis) | 7       | ✅ backend / 🟠 web | Lead consent snapshot + policy version; web form consent uneven                               |
| Access                 | 15      | ✅                  | `/api/leads/dsar/find` + CSV export + admin panel                                           |
| Rectification          | 16      | 🟠                  | "update by email" not confirmed in code                                                       |
| Erasure                | 17      | ✅                  | `/api/leads/dsar/delete` + HubSpot cascade + career-applications/resume + partner-applications erasure + audit log |
| Portability            | 20      | 🟠                  | CSV export-all only; no per-subject JSON                                                      |
| Object / restrict      | 18, 21  | 🟠                  | manual via admin DSAR; no self-service                                                        |
| Security of processing | 32      | ✅ (2FA gap)        | encryption, Turnstile, rate-limit, HMAC, redaction; admin 2FA deferred                        |
| Breach notification    | 33–34  | 🔴                  | no breach runbook exists                                                                      |

There is **no self-service data-subject portal** — all requests are fielded by an admin through the DSAR panel.

---

## 5. Retention schedule (implemented)

| Data                                    | Window                                                 | Action                                                          | Job                              |
| --------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------- |
| Lead form-field answers                 | configurable (default 365d)                            | retained, then PII keys nulled                                  | `purge-leads-pii.ts`           |
| Lead `ip` / `userAgent`             | 365d                                                   | nulled;`piiRedactedAt` stamped                                | `purge-leads-pii.ts`           |
| Career applications (PII) + resume file | configurable (default 365d,`CAREERS_RETENTION_DAYS`) | resume hard-deleted from private R2, <br />applicant PII nulled | `purge-career-applications.ts` |
| Consent snapshot + policy version       | lifetime of lead                                       | retained (legal evidence)                                       | —                               |
| Search logs                             | 90d                                                    | row deleted                                                     | `purge-search-log.ts`          |
| Preview-audit tokens                    | 90d                                                    | row deleted                                                     | `purge-preview-audit.ts`       |
| Deletion / DSAR audit log               | append-only (no purge)                                 | retained                                                        | `audit-log.ts`                 |

All purge jobs are idempotent and gated by `PAYLOAD_AUTO_RUN=true`.

---

## 6. Sub-processor register & data residency

Every third party that processes personal/lead data. EU→US transfers rely on each vendor's SCCs / EU-US Data Privacy Framework.

| Processor                                             | Personal data                                                                                                 | Region                          | Transfer basis / notes                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HubSpot** (CRM + lead-pipeline email)         | contact/lead fields (name, email, phone, company, message) —**received live on every form submission** | 🇺🇸 US (`app-na2` = NA2)     | SCCs/DPF —**DPA to sign before go-live**; region fixed at portal creation. Sole CRM + lead-pipeline email sub-processor; never receives careers data. |
| **Brevo** (careers/partner transactional email) | applicant name + email, and the resume file as an email attachment — sent to HR on each job application; also the partner applicant's name + email + company, sent as the partner applicant-confirmation + internal team-notification emails on each partner inquiry | 🇪🇺 EU / 🇺🇸 US               | SCCs —**DPA to sign before go-live**. Scoped to careers/partner notifications only; never receives lead-pipeline data.                                |
| **Cloudflare R2**                               | lead fallback queue + media                                                                                   | 🇺🇸 US                         | SCCs · encrypted at rest                                                                                                                                    |
| **Cloudflare Turnstile**                        | IP (bot check)                                                                                                | 🇺🇸 US                         | Cloudflare DPA                                                                                                                                               |
| **Sentry**                                      | error telemetry (PII-scrubbed)                                                                                | 🇺🇸 US                         | SCCs ·`sendDefaultPii:false`                                                                                                                              |
| **Vercel**                                      | hosting + cookieless analytics                                                                                | 🇺🇸 US                         | SCCs                                                                                                                                                         |
| **Meilisearch**                                 | search index/logs                                                                                             | 🇮🇳 self-hosted (DO Bangalore) | no third-party processor                                                                                                                                     |
| **DigitalOcean**                                | CMS DB / infra                                                                                                | 🇮🇳 India                      | DPA                                                                                                                                                          |
| **Microsoft Teams**                             | lead notify (metadata only)                                                                                   | tenant region                   | outbound webhook only                                                                                                                                        |
| **IndexNow**                                    | URLs only —**no PII**                                                                                  | Bing 🇺🇸 / Yandex 🇷🇺         | n/a                                                                                                                                                          |
| **GA4 / Search Console** *(planned)*          | analytics                                                                                                     | 🇺🇸 US                         | DPA + consent required before activation                                                                                                                     |

> ⚠️ The architecture doc references signed DPAs at `docs/dpa/*.pdf` and a `docs/DPA.md` index — **that folder/file does not exist in the repo**, so signed-DPA status is unconfirmed here (may live in an external secrets/legal store).

---

## 7. Personal data inventory

| Data category                                                        | Collected where                                         | Stored where                                                                           | Retention                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Name, email, phone, company                                          | marketing forms →`/api/leads/submit`                 | `leads.fields` (Postgres)                                                            | 365d then PII nulled                                                                        |
| Job-applicant name, email, phone, cover letter,**resume file** | careers apply form →`/api/career-applications/apply` | `career-applications` (Postgres) + resume in **private** `resumes` R2 prefix | 365d (`CAREERS_RETENTION_DAYS`) then resume **hard-deleted** + applicant PII nulled |
| Partner-inquiry name, email, phone, company, website, message        | partner form →`/api/partner-applications/apply`      | `partner-applications` (Postgres)                                                    | kept until DSAR erasure (no auto-purge)                                                     |
| IP, user-agent                                                       | captured at submit (spam analysis)                      | `leads.ip` / `leads.userAgent`                                                     | 365d then nulled                                                                            |
| Consent record                                                       | at submit                                               | `leads.consentSnapshot` + `consentGivenAt` + `privacyPolicyVersion`              | lifetime of lead                                                                            |
| CRM mirror + follow-up/notification email                            | secondary handler (Forms Submissions API, live)         | HubSpot (US)                                                                           | per HubSpot config                                                                          |
| Error telemetry                                                      | runtime                                                 | Sentry (US, PII-scrubbed)                                                              | per Sentry config                                                                           |
| Analytics (anonymous)                                                | page views                                              | Vercel (US, cookieless)                                                                | per Vercel                                                                                  |

---

## 8. Governance documents — **referenced but none exist** 🔴

The architecture doc cites these by name as required deliverables. Verified absent from the repo on 2026-06-02:

| Document                             | Purpose                                    | GDPR basis                 |
| ------------------------------------ | ------------------------------------------ | -------------------------- |
| `docs/RoPA.md`                     | Records of Processing Activities           | Art. 30                    |
| `docs/LIA.md`                      | Legitimate Interest Assessment (B2B forms) | Art. 6(1)(f)               |
| `docs/TIA.md`                      | Transfer Impact Assessment                 | Schrems II (post-transfer) |
| `docs/RETENTION-POLICY.md`         | Retention-by-category policy               | Art. 5(1)(e)               |
| `docs/BREACH-RUNBOOK.md`           | 72-hour breach response                    | Arts. 33–34               |
| `docs/DPA.md` + `docs/dpa/*.pdf` | Signed processor DPAs index                | Art. 28                    |

These are audit-defensibility requirements — they should exist before production launch.

---

## 9. Consent / lawful-basis model

Per the architecture doc's stated design:

- **Art. 6(1)(f) — Legitimate interest:** B2B prospect data via marketing forms (industry-standard for B2B lead gen). Requires a documented **LIA** (missing).
- **Art. 6(1)(a) — Consent:** newsletter signups and any cookie-setting trackers (requires the CMP).
- The two-checkbox split on Book a Demo — `consent_marketing` (optional, drives marketing-email eligibility) vs `consent_storage` (required, storage/processing) — is the intended pattern and should be propagated to the forms that lack it.
- This consent split also drives the **HubSpot "marketing contact" decision** (relevant to the 2,000-contact cap): only promote to a marketing contact when `consent_marketing` is true.

---

## 10. Prioritised remediation roadmap

### P0 — pre-launch / legal-risk

1. **Build the cookie-consent CMP** before any cookie-setting tracker ships. Geo-gated banner (EEA/UK/CH/CA), Consent Mode v2 (4 signals default-denied), `cs_consent` cookie, `/api/consent` → new `ConsentLog` collection, one-click "Reject all" parity. *(apps/web + apps/cms)*
2. **Add consent + privacy link to the 3 bare forms** — Contact, Deal Registration, Become-a-Partner — mirroring Book a Demo's marketing + storage consent. *(apps/web)*
3. **Create RoPA + LIA; sign & file processor DPAs** (HubSpot, Cloudflare, Sentry, Vercel, DigitalOcean) under `docs/dpa/`. *(docs/legal)*

### P1 — compliance hardening

4. **Cookie Policy + Terms pages** (`/cookies`, `/terms`). *(apps/web)*
5. **HubSpot non-marketing default** — set API-created contacts non-marketing unless `consent_marketing`; protects the 2,000-contact cap. *(HubSpot settings)*
6. **Write the TIA**; confirm HubSpot region (NA2 = US) transfer posture. *(docs/legal)*

### P2 — best practice

8. **Admin 2FA (TOTP)** — land the deferred hardening (backlog A9).
9. **DNT / GPC** handling in the analytics/consent layer.
10. **Per-subject JSON export (Art. 20)** + **"update by email" (Art. 16)** endpoints.
11. **Populate `consentCategories`** once the CMP is live.

---

## 11. Verification notes

- Verified by reading the codebase + direct file checks on 2026-06-02 (not just the architecture doc).
- Where this audit and the architecture doc disagree, **the code wins** — e.g. the arch doc says erasure cascades to "every CRM handler" but only HubSpot is wired; it describes a cookie-consent system that isn't built; it cites governance docs that don't exist.
- Status keys: ✅ implemented · 🟠 partial/uneven · 🔴 missing.
- Not legal advice — pair with counsel before relying on this for a compliance attestation.
