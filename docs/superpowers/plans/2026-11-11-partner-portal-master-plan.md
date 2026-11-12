# Partner Portal: Master Implementation Plan

> **Errata (integration review, 13 November 2026).** Where this plan differs from `2026-11-12-partner-portal-00-contracts.md`, the contracts win. The task-level steps below are implemented by the area plans listed in the "Plans" table of `docs/partner-portal/BUILD-HANDOFF.md` (they hold the code, tests and commands); this file stays the overview of scope, decisions and architecture. Five behaviour decisions were changed by the contracts: (1) the second sign-in step is an authenticator app (TOTP) with backup codes, with the email one-time code kept as the fallback, not the email code as written in D3 and M0.7; (2) the upload limit is 100 MB, not the 500 MB in the mock's form copy; (3) the partner `technical` role has no deal access at all; (4) there is a single 30 day protection extension per registration; (5) a decision can be undone only by the person who made it, within 10 minutes, and only while no HubSpot deal exists. Other differences are listed in section M.2 of the contracts. Also changed: two connection pools (request 6, system 8) and `CONNECTION LIMIT` 20 instead of one pool of 10 and a limit of 15.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This master plan sets scope, architecture and task order. Phases 0, 1 and 3 to 5 get a code-level plan written when they start (use the writing-plans skill). The HubSpot integration already has its own code-level plan: `2026-11-11-partner-portal-hubspot-integration.md`.

**Goal:** Turn the clickable mock in `apps/portal` into the real partner portal at `partners.cleanstart.com`: partner logins, onboarding approval, deal registration with approval and a 90 day protection period, a document library, admin screens, and a two-way HubSpot integration for deals.

**Architecture:** One Next.js 16 app (`apps/portal`) serves partners and CleanStart staff, with role-gated areas. All data lives in the portal's own Postgres through one data-access layer that scopes every query to the viewer's partner company. HubSpot owns a deal once CleanStart approves it; the portal writes through a retrying outbox and reads changes by webhook with a polling safety net. It runs as a Docker container on the existing droplet beside the CMS, behind Caddy and Cloudflare, with its own database in the droplet's Postgres, and its background jobs run inside the app process. Private files live in a private R2 bucket behind short-lived signed URLs. Email goes through Brevo using the portal's own email module.

**Tech Stack:** Next.js 16.2.5, React 19, TypeScript strict, Postgres 16, Drizzle ORM, Zod, Better Auth (decision D3), `@hubspot/api-client`, node-cron, Cloudflare R2 (S3 API), Brevo, Vitest, Playwright, Docker Compose, Caddy, Sentry.

**Source of truth for behaviour:** the 20 boards and the live mock (`apps/portal`, commit `58747992`), the proposal doc (https://claude.ai/artifact/2Gw55HELXmuVwXCaS31D1i), and `docs/partner-portal/2026-10-31-meeting-transcript.md`. Where the mock and the proposal disagree, stop and ask.

---

## 1. Scope

**In (Phase 1 of the proposal):** applications and onboarding, partner and staff logins, team management, deal registration and approval, conversation thread per deal, protection and extension, document library, overview dashboard, admin reports, audit log, notifications, HubSpot sync for partners, contacts, companies and deals.

**Out (proposal Phase 2, left out on purpose):** NFR licences, training, shared leads, MDF, referral payouts, tiers with rules (the Company screen shows "Not assigned"), marketplace listings, multi-currency, languages other than English.

**Decisions already made (do not reopen):** HubSpot owns deals after approval; private documents never go in the CMS; the portal is a separate app with its own database; no open sign-up; password rule is 8 or more characters with a letter, a number and a special character.

## 2. Decisions (settled with the user on 12 November 2026 unless marked as my pick)

| Id | Decision | Choice | Reversible? |
|---|---|---|---|
| D1 | Evolve `apps/portal` in place rather than start a new app | Yes. Keep the screens and CSS, replace the slices with server data. Tag the mock first (`portal-mock-v1`) so the review build stays recoverable. | Yes |
| D2 | Database | The droplet's existing Postgres 16 container, with a new database `cleanstart_portal` and its own roles. Not Neon, not DigitalOcean managed. | Yes |
| D3 | Auth library (my pick, user delegated) | Better Auth with the Drizzle adapter: email and password, email one-time code as the second step, Google and Microsoft sign-in. Self-hosted, so user data stays in our database, which fits the droplet choice and rules out Clerk and WorkOS. Task 0.7 is a one day spike with Auth.js v5 as the fallback. | Costly after Phase 1 |
| D4 | Admin screens | Custom, inside the same app, gated by `kind = staff`. No second Payload instance. | Yes |
| D5 | Hosting and background jobs | Everything on the droplet. The app is a Docker image shipped by GitHub Actions like the CMS, served by Caddy. Jobs are an in-process scheduler (node-cron started from `instrumentation.ts`), each job guarded by a Postgres advisory lock. No Vercel, no HTTP cron endpoints. | Yes |
| D6 | HubSpot inbound | Webhooks and polling both. The webhook triggers an immediate poll; polling every 5 minutes stays as the safety net. If Task 0.1 shows webhooks are not available on our plan, polling alone ships. | Yes |
| D7 | HubSpot account for development | We have a paid plan. Task 0.1 checks the tier: a HubSpot sandbox if the plan includes one, otherwise a free developer test account. Nothing non-production ever points at portal 245478611 (CLAUDE.md deploy rules). | n/a |
| D8 | Email code | The portal has its own email module (`apps/portal/src/server/email/`): its own layout, Brevo sender and templates. Nothing is extracted from the CMS, so the CMS and its `emails:check` gate are untouched. Same Brevo account and the already authorised droplet IP. | Yes |
| D9 | Tenant isolation | Application scoping in one repository layer, plus Postgres row level security as a backstop, plus a cross-tenant test matrix that runs in CI. | n/a |
| D10 | Partner application intake | Both entry points. The portal has its own `/apply` page, and the website's Become a Partner form keeps working unchanged. A portal job pulls every new website submission from the CMS and lists it in the Applications queue, marked "Website form". | Yes |

## 3. Target layout

```
apps/portal/
  drizzle/                         SQL migrations (generated by drizzle-kit, reviewed by hand)
  scripts/                         provision-hubspot.ts, seed-dev.ts, import-partners.ts, hubspot-smoke.ts
  src/
    app/                           routes (exist today); pages become server components
      api/auth/[...all]/           auth handler
      api/health/route.ts          liveness for Docker and the deploy smoke probe
      api/hubspot/webhook/route.ts HubSpot webhook receiver (HubSpot plan 4.9)
      api/files/[id]/route.ts      signed download redirect
    components/                    screens and primitives (exist today)
    db/{schema.ts,client.ts,rls.sql,test-helpers.ts}
    env.ts                         Zod-validated environment
    instrumentation.ts             starts the job scheduler when PORTAL_JOBS_ENABLED=true
    server/
      auth/                        viewer.ts, policies.ts, passwords.ts
      repo/                        one file per aggregate, every function takes a Viewer
      actions/                     server actions, thin: validate, authorise, call repo
      hubspot/                     client.ts, fake.ts, mappers.ts, outbox.ts, poll.ts, expiry.ts
      email/                       layout.ts, brevo.ts, templates (portal's own, task 0.5)
      files/                       r2.ts (presign), rules.ts (audience)
      intake/                      website-applications.ts (pulls CMS form entries, task 1.3b)
      jobs/                        schedule.ts (node-cron + advisory locks), one file per job
apps/portal/Dockerfile             standalone Next.js image (task 0.6)
.github/workflows/{portal.yml,deploy-portal.yml}
```

## 4. Data model (Drizzle, v1)

Every table has `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`. Money is not stored in v1.

| Table | Key columns | Notes |
|---|---|---|
| `partners` | name, domain (unique), category (distributor, channel, integrator), region (india, middle_east, elsewhere), status (onboarding, active, inactive, suspended), status_before_suspend, manager_id, agreement_version, agreement_accepted_at, hubspot_company_id | One row per partner company |
| `users` | email (unique, lower case), name, kind (partner, staff), partner_id (null for staff), role, status (invited, active, disabled), last_login_at, hubspot_contact_id | Auth tables from Better Auth sit beside this |
| `staff_scopes` | user_id, region (india, middle_east, all) | Sales staff see only their region |
| `applications` | reference, company, domain, applicant_name, email, role, phone, region (nullable for website entries), source (portal, website), source_ref (CMS document id for website entries), personal_email boolean, existing_domain boolean, status (new, approved, declined), decided_by, decided_at, decline_reason, partner_id | `reference` is the short code shown to the applicant. Unique on (source, source_ref). |
| `invites` | email, partner_id, role, token_hash, expires_at, accepted_at, invited_by | Token stored hashed, 7 day expiry |
| `access_requests` | partner_id, email, name, status | Routed by email domain |
| `registrations` | partner_id, registered_by, customer_name, customer_domain, product (images, libraries, cleansight), region, manager_id, status (pending, accepted, rejected, expired, won, lost), stage, registered_on, resubmitted_on, decided_by, decided_at, rejection_reason, protection_end, extension_requested_at, extension_granted_at, closed_on, hubspot_deal_id, hubspot_stage_id, hubspot_synced_at, hubspot_missing | Unique on (lower(customer_name), product, partner_id) while status is pending or accepted |
| `registration_contacts` | registration_id, name, role, email, phone, hubspot_contact_id | |
| `registration_messages` | registration_id, author_id, side (partner, staff), body | The conversation thread |
| `registration_events` | registration_id, at, text, by_label, source (portal, crm, system) | Timeline on the deal page |
| `documents` | title, type, product, audience_kind (all, category, named), audience_category, file_key, file_size, mime, version, uploaded_by | |
| `document_audience` | document_id, partner_id | Used when audience_kind is named |
| `document_opens` | document_id, user_id, opened_at | Feeds "seen by" counts |
| `notifications` | user_id, kind, title, body, link, read_at | In-app list |
| `notification_prefs` | user_id, kind, email boolean | |
| `audit_log` | at, actor_id, actor_label, who (staff, partner, sync), kind (deal_decisions, partners, documents, people_access), text, subject_type, subject_id | Append only; no update or delete grant |
| `hubspot_outbox` | id, op, subject_id, payload jsonb, idempotency_key (unique), status (pending, done, failed), attempts, next_attempt_at, last_error | Task H4 |
| `hubspot_sync_state` | key (primary), value jsonb, updated_at | HubSpot poll cursor and last run. The website intake cursor lives here too, under its own key. |

Row level security: every partner-scoped table gets `partner_id` (denormalised onto child tables) and a policy `partner_id = current_setting('app.partner_id', true)::uuid OR current_setting('app.kind', true) = 'staff'`. The repository layer opens each request with `set_config('app.partner_id', ...)` and `set_config('app.kind', ...)` inside the transaction.

## 5. Roles and permission policy

One file, `src/server/auth/policies.ts`, exports pure functions `can(viewer, action, subject?)`. The matrix is the one in the proposal (Roles and permissions). Every server action calls `assertCan` before touching data; tests assert each cell of the matrix for each role. Partner roles: `partner_admin`, `sales`, `technical`. Staff roles: `partner_manager`, `sales`, `marketing`. Partner users can never reach `/admin/*`, and staff are the only ones who can see more than one partner.

## 6. Phases and tasks

Each task ends with a green `lint`, `typecheck`, `test` and `build` for `@cleanstart/portal`, then a commit on `development` (stage specific paths only).

### Phase 0: Foundations (weeks 1 and 2)

**Task 0.1: HubSpot capability check (no code).**
- Create a free HubSpot developer test account and a private app with the scopes in the HubSpot plan, section 3.
- Answer and write down in `docs/partner-portal/HUBSPOT-CAPABILITIES.md`: (a) can we create custom association labels (partner and customer on the deal to company link), (b) can a legacy private app subscribe to `deal.propertyChange` webhooks, (c) the API rate limit for the production plan, (d) whether unique-value custom properties are allowed (needed for idempotency, section 5 of the HubSpot plan), (e) whether `hs_lastmodifieddate` search works on the partner pipeline.
- Done when each answer has a screenshot or API response saved next to it. These answers decide HubSpot plan tasks 4.1 and 4.9.

**Task 0.2: Tag the mock and restructure.**
- Files: tag `portal-mock-v1` on `58747992`; create `src/server/`, `src/db/`, `scripts/`; update `README.md`.
- Steps: `git tag portal-mock-v1 58747992`, add the empty folders with a short `README` line each, update `package.json` description.
- The mock banner and walkthrough stay until Phase 5 so reviewers can still use the staging build.

**Task 0.3: Database and migrations.**
- Files: create `drizzle.config.ts`, `src/db/schema.ts` (all tables in section 4), `src/db/client.ts`, `drizzle/0000_init.sql`, `src/db/rls.sql`, `src/db/test-helpers.ts` (`testDb`, `testPool`, `resetDb`, `makePartner`, `makeUser`, `makeRegistration`, `makeSyncedDeal`, used by every repository and HubSpot test); modify `package.json` (scripts `db:generate`, `db:migrate`, `db:seed`, `test`).
- Test first: `src/db/schema.test.ts` applies the migrations to an empty database and asserts every table and the `registrations` unique index exist, that `audit_log` rejects `UPDATE` and `DELETE` for the app role, and that the app role is subject to row level security (it must not own the tables).
- Two Postgres roles, so row level security actually applies: `portal_owner` owns the schema and runs migrations; `portal_app` is what the running app connects as (no `BYPASSRLS`, not the owner, `CONNECTION LIMIT 15`, `statement_timeout` of 15 seconds). The app uses a plain `pg` pool of up to 10 connections; there is no pooler because the app is one long-lived Node process.
- Local development uses a `cleanstart_portal` database on the local Postgres (CLAUDE.md prerequisites) and never the droplet.
- Droplet (one time, needs the operator's approval, read the SQL first): `CREATE ROLE portal_owner ...; CREATE ROLE portal_app ...; CREATE DATABASE cleanstart_portal OWNER portal_owner; REVOKE ALL ON DATABASE cleanstart_portal FROM PUBLIC;`. The migration runs on container start like the CMS does. Be aware that the CMS connects as the `postgres` superuser, so this separation protects the portal from mistakes in the CMS, not from a compromise of it (see the risks table).
- Acceptance: `pnpm --filter @cleanstart/portal db:migrate` on a fresh database passes twice (idempotent).
- `scripts/seed-dev.ts` loads the mock SEED arrays (deals, partners, documents, team) into the dev database so every screen has data during the conversion.

**Task 0.4: Environment, logging, Sentry.**
- Files: `src/env.ts` (Zod schema; the app refuses to start when a required variable is missing), `src/server/log.ts`, `sentry.*.config.ts`, `.env.example`.
- Variables: `DATABASE_URL`, `DATABASE_OWNER_URL` (migrations only), `AUTH_SECRET`, `APP_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `R2_*` (private bucket), `HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_PARTNER_PIPELINE_ID`, `HUBSPOT_USE_ASSOCIATION_LABELS`, `HUBSPOT_WEBHOOK_SECRET`, `PORTAL_JOBS_ENABLED`, `TURNSTILE_*`, `SENTRY_DSN`, `CMS_API_URL` (internal, `http://cms:3000`), `CMS_INTAKE_API_KEY`.
- Secrets live in `/opt/cleanstart/portal.env` (chmod 600), rendered by the deploy workflow from GitHub secrets. The portal gets its own env file so it never sees the CMS secrets and the CMS never sees the portal's.
- Test: `src/env.test.ts` asserts a missing `DATABASE_URL` throws a message naming the variable.

**Task 0.5: Portal email module.**
- Files: create `src/server/email/{layout.ts,brevo.ts,templates/*.ts}` and their tests. Follow the CMS conventions by reading `apps/cms/src/payload/lib/email/` for reference, but import nothing from it: table-based HTML with inline styles, preheader, escaped visitor input, built in code and sent as `subject` plus `htmlContent`, never a Brevo dashboard template.
- Sender name is set in code (`CleanStart Partners`), not inherited from an env var that a deploy can overwrite (the CMS lesson in CLAUDE.md).
- Brevo restricts API calls to authorised IPs and the droplet's address is already authorised for the CMS, which is one reason to stay on the droplet.
- Tests: layout snapshot, a visitor name containing `<script>` is escaped in every template, sender name is fixed.

**Task 0.6: CI, image and droplet deploy.**
- Files: `apps/portal/Dockerfile` (multi stage, Next.js `output: 'standalone'`, non-root user, port 3004, `HEALTHCHECK` on `/api/health`; the standalone image is a few hundred MB, unlike the 4.4 GB CMS image), `apps/portal/src/app/api/health/route.ts`, `.github/workflows/portal.yml` (CI on `apps/portal/**`, `packages/forms/**`, `packages/ui/**`; Postgres 16 service; lint, typecheck, test, build), `.github/workflows/deploy-portal.yml` (copy of `deploy-cms.yml`: wait for green CI, build, `docker save`, scp, render `/opt/cleanstart/portal.env`, `docker compose --profile portal up -d --wait portal`, smoke probe on `127.0.0.1:3004/api/health`, keep the latest image plus two tags).
- Reconcile first: the repo's `infra/docker-compose.yml` is out of date. The droplet's `/opt/cleanstart/compose.yml` has a `cms` service and binds ports to `127.0.0.1`; the repo copy has neither. Bring the repo copy in line with the droplet before adding the `portal` service (`env_file: portal.env`, port `127.0.0.1:3004:3004`, `mem_limit: 512m`, `profiles: ["portal"]`, depends on `postgres` healthy).
- Droplet, one time, needs the operator's approval: copy the new compose file, add the Caddy block (`partners.cleanstart.com` reverse proxying `localhost:3004`, the same access log settings as `cms.cleanstart.com`, security headers), reload Caddy; Cloudflare DNS record and the WAF rule set that `cms.cleanstart.com` already has.
- Capacity: on 12 November the droplet is 1 vCPU and 2 GB RAM with about 1 GB in use (CMS 272 MB, Postgres 92 MB) and 27 GB of disk free. The portal fits for the pilot. Resize the droplet one size up before partners log in (CPU and RAM only; reversible), because the portal, the CMS and Postgres now share one CPU. Set Node's `--max-old-space-size=384` for the portal.
- `PORTAL_REVIEW_PASSWORD` keeps the review gate on until launch (`src/proxy.ts`).

**Task 0.7: Auth spike (one day, then decide).**
- Prove on a throwaway branch: email and password sign up with the password rule, email one-time code as the second step, Google and Microsoft sign-in against a dev OAuth app, database sessions, and a `getViewer()` helper returning `{ id, kind, role, partnerId }`.
- Decision gate: Better Auth passes all five, otherwise Auth.js v5. Record the result in the Decisions table.

### Phase 1: Identity and onboarding (weeks 3 to 5)

**Task 1.1: Sessions, guards, sign in.** Files: `src/server/auth/{viewer.ts,passwords.ts,policies.ts}`, `src/proxy.ts` (keep the review gate, add session redirect), `src/app/(public)/sign-in`, `SignIn.tsx`. Tests: password rule table (8 cases), policy matrix, guard redirects (partner on `/admin` goes to `/partner/overview`, signed out goes to sign in with a return path).

**Task 1.2: Tenant isolation layer (do before any feature table).** Files: `src/server/repo/context.ts` (`withViewer(viewer, fn)` opens a transaction and sets the two settings), `src/db/rls.sql`, `src/server/repo/isolation.test.ts`. The test creates partners A and B, then runs every repo function as A with B's ids and asserts empty or not found. New repo functions must be added to this matrix; a lint-style test fails when a repo export is missing from it.

**Task 1.3: Portal application page.** Files: `src/server/actions/apply.ts`, `src/server/email/application.ts`, `Apply.tsx`, `ApplyDone.tsx`. Rules: company email required using `validateBusinessEmail` from `@cleanstart/forms/server`; a domain that already belongs to a partner returns the "ask your partner admin" result without creating anything; Turnstile and a per-IP rate limit; applicant and staff emails. Records `source = 'portal'`. Tests: free-mail rejected, existing-domain redirect, duplicate pending application for the same domain merged, rate limit.

**Task 1.3b: Website form entries appear in the portal.** Files: `src/server/intake/website-applications.ts`, `src/server/jobs/intake.ts`, test next to each. The website's Become a Partner form keeps posting to the CMS (`partner-applications` collection and its two Brevo emails, unchanged). Every 5 minutes the portal reads new rows from the CMS REST API (`GET /api/partner-applications` sorted by `createdAt`, using a cursor, over the internal `CMS_API_URL`) with a dedicated CMS service user whose `useAPIKey` key has read access to that one collection. It never writes to the CMS, so a portal outage loses nothing and the CMS needs no code or schema change.
- Each CMS row becomes an `applications` row with `source = 'website'` and `source_ref = <CMS id>`; the unique index makes the job idempotent, so a repeat run or an overlapping cursor is harmless.
- Map `firstName` and `lastName` to the applicant name, `company`, `email`, `phone`, and the website field to `domain` (falling back to the email domain). The CMS form has no region or role, so those stay empty and the partner manager sets the region when approving.
- Rules differ from the portal page on purpose: a personal email address is imported with `personal_email = true` and a badge instead of being rejected (the visitor already submitted), and a domain that matches an existing partner is imported with `existing_domain = true` so the manager decides. Skip rows with `honeypot` set or `turnstilePassed = false`, and rows with `piiRedactedAt` set.
- The Applications screen shows a "Website form" or "Portal form" chip on each row.
- Tests: a row imports once when the job runs twice; honeypot and redacted rows are skipped; a gmail address is imported with the badge; the cursor does not advance if the CMS call fails; the job does nothing when `CMS_INTAKE_API_KEY` is unset (local development).

**Task 1.4: Application review (admin).** Files: `repo/applications.ts`, `actions/applications.ts`, `AdminPartners.tsx` (Applications tab). Approve creates the partner (status `onboarding`), the invite and an outbox op `partner.upsert`; decline needs a reason and emails the applicant. Website entries and portal entries share this queue. Audit entries for both.

**Task 1.5: Invites and first login.** Files: `repo/invites.ts`, `AcceptInvite.tsx`, `PartnerWelcome.tsx`. Token is 32 random bytes, stored as SHA-256, valid 7 days, single use. Accepting sets the password (rule enforced server side), records agreement version and time, and creates the user. Tests: expired, reused and tampered tokens each fail with a distinct message.

**Task 1.6: Team and access requests.** Files: `repo/team.ts`, `Team.tsx`. Partner admin invites, changes role, removes; the last partner admin cannot be removed or demoted; "Request access" on Sign in routes by email domain to that partner's admin and always shows the same confirmation whether or not the domain matches (no account discovery). Removed users keep their deals with the company.

**Task 1.7: Account and company screens.** Files: `Account.tsx`, `Company.tsx`, `repo/account.ts`. Profile, notification preferences, password change (rule enforced), active sessions with sign-out, company profile edit by partner admin only.

**Task 1.8: Staff admin.** Files: `AdminTeam.tsx`, `repo/staff.ts`. Staff invites, role, region scope; staff cannot be created from the partner side. Partner manager reassignment of a partner's manager with an audit entry.

### Phase 2: Deals and HubSpot (weeks 5 to 9)

**Task 2.1: Registrations repo and the register form.** Files: `repo/registrations.ts`, `actions/registrations.ts`, `RegisterDeal.tsx`, `Deals.tsx`, `DealDetail.tsx`. Zod schema for the multi-product form; one registration per product; status starts `pending`; routing sets `manager_id` and `region` from the partner. The customer lookup searches the partner's own registrations first, then HubSpot companies by name or domain (HubSpot plan task 4.7) and returns only the customer name and domain, never another partner's data.

**Task 2.2: Approvals.** Files: `AdminApprovals.tsx`, `actions/decisions.ts`. Accept sets `protection_end = decided_on + 90 days` (counting the acceptance day, as `PROTECTION_DAYS` does in the mock), enqueues `registration.create`; reject needs a reason, partner can resubmit; undo window of the mock is kept for the same session only. A 2 business day target drives the "overdue" badge. Conflict hint: another partner already holds an accepted registration for the same customer (portal data plus the HubSpot open-deal check in HubSpot plan task 4.7).

**Task 2.3: Conversation thread and notifications.** Files: `repo/messages.ts`, `repo/notifications.ts`, `src/server/email/deal.ts`. Every status change and message creates an in-app notification and, where the user's preference allows, an email through `@cleanstart/email`.

**Task 2.4: Extension and expiry.** Files: `actions/extension.ts`, `jobs/expiry.ts`. A partner requests one extension with a note; staff grants or declines; granting adds days per the confirmed rule and enqueues `registration.update_end`. The nightly job expires unclosed accepted registrations and enqueues `registration.expire`. A reminder email goes out 14 and 3 days before the end.

**Task 2.5: HubSpot integration.** Follow `2026-11-11-partner-portal-hubspot-integration.md` in full. It adds the outbox, partner and contact sync, deal create and update, inbound polling, expiry write-back, reconcile job and the admin health panel.

**Task 2.6: Overview and reports.** Files: `repo/overview.ts`, `repo/reports.ts`, `PartnerOverview.tsx`, `AdminReports.tsx`. Counts and tables come from SQL aggregates over `registrations`; the numbers on the mock boards become test fixtures.

### Phase 3: Documents (weeks 8 to 10, can overlap Phase 2)

**Task 3.1: Private storage.** Files: `src/server/files/r2.ts` (presigned PUT for upload, presigned GET with 60 second expiry), `src/app/api/files/[id]/route.ts`. Bucket `cleanstart-partner-docs`, no public access. Tests: a non-audience partner gets 404, not 403, so file ids cannot be probed.

**Task 3.2: Audience rules and library.** Files: `src/server/files/rules.ts` (move `canPartnerOpen` from the mock), `repo/documents.ts`, `Documents.tsx`, `AdminDocuments.tsx`. Upload limits: 100 MB, allow-listed types (pdf, pptx, docx, xlsx, mp4, zip). Replace creates version n+1 and keeps the old key for 30 days. Open events feed the "opened by" counts.

**Task 3.3: Public resources from the CMS.** Read published datasheets from the CMS REST API with a server-only fetch and a 10 minute revalidate; never uploaded twice.

### Phase 4: Admin and search (weeks 9 to 11)

**Task 4.1:** Partners list and detail (suspend, restore, change category and manager, the "unlisted active partners" count from the mock becomes a real count). **Task 4.2:** Audit log screen with filters and CSV export. **Task 4.3:** Global search (Ctrl K) over registrations, partners, documents and people using Postgres `pg_trgm`; results are scoped by viewer. **Task 4.4:** Notifications and help popovers read real data.

### Phase 5: Hardening, pilot, launch (weeks 11 to 14)

**Task 5.1: Security pass.** Headers and CSP, cookie flags, rate limits on sign in, one-time code and invite endpoints, session fixation and logout checks, dependency audit, the isolation test matrix run against the staging database. **Task 5.2: Accessibility pass** (keyboard, focus, contrast, the two a11y lint rules that the mock turned off must be fixed or justified). **Task 5.3: Retention jobs** (365 day purge of rejected and declined records, consent of the applicant; mirrors the CMS purge jobs). **Task 5.4: Remove mock scaffolding** (banner, walkthrough, Driver.js, `createSlice`, seed slices; keep `scripts/seed-dev.ts`). **Task 5.5: Backups.** The nightly backup (`infra/scripts/backup.sh`, cron at 02:00 UTC) dumps only the `cleanstart` database today, so the portal database is not backed up until the script also dumps `cleanstart_portal` to its own R2 key. The heartbeat must be pinged only after both dumps succeed, and CLAUDE.md requires verifying the heartbeat fires after any change to the backup script. Add a restore drill into a scratch database and an R2 lifecycle rule for the new prefix. This is the most important task before launch because the portal holds approvals and the audit log. **Task 5.6: Pilot** with three partners on production, two weeks. There is no staging environment (CLAUDE.md deploy rules), so the pilot partners are invited one wave at a time and the review password stays on for everyone else. **Task 5.7: Production provisioning** (HubSpot plan task 4.10, import of the roughly 20 current partners with `scripts/import-partners.ts`, invites sent in waves). **Task 5.8: Cutover.** The website's Become a Partner form keeps working and its entries already flow into the portal (Task 1.3b). The `/deal-registration` form redirects to the portal once every partner has a login. **Task 5.9: Runbook** in `docs/operations/PARTNER-PORTAL.md` and an incident entry template in `docs/operations/INCIDENTS.md`.

## 7. Testing strategy

- **Unit (Vitest, co-located):** policies, password rules, date maths (`PROTECTION_DAYS`), mappers, audience rules.
- **Repository tests against a real Postgres** (`cleanstart_portal_test`), each test in a transaction that rolls back. The CI Postgres service is the same one the CMS uses.
- **HubSpot:** an in-memory `FakeHubspot` implements the same interface as the real client; contract tests assert the real client builds the documented request bodies; `scripts/hubspot-smoke.ts` runs by hand against the developer account.
- **Isolation matrix:** Task 1.2, runs on every CI build.
- **E2E (Playwright, tag `@portal`):** apply, approve, invite, accept, register, accept deal, HubSpot stage change visible to the partner (with `FakeHubspot`), document download denied for a non-audience partner.

## 8. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| HubSpot plan lacks association labels or webhooks | Slower sync or a weaker deal to company link | Task 0.1 answers it in week 1; the plan has a fallback for each (HubSpot plan 4.1 and 4.9) |
| Deal rules not settled (extension count, duplicate registrations, discount) | Rework in Tasks 2.2 and 2.4 | Rules live in one `deal-rules.ts` constants file; build against the proposal defaults |
| Partner agreement text from legal arrives late | Cannot ship onboarding | Store `agreement_version`; a placeholder version string is allowed only in staging |
| Auth library gap found late | Phase 1 rewrite | Task 0.7 spike gate |
| The droplet is small (1 vCPU, 2 GB) and shared with the production CMS and Postgres | A portal spike slows the CMS | Container memory limit, Postgres role connection limit and statement timeout, resize one size up before the pilot (Task 0.6) |
| The CMS connects to Postgres as the `postgres` superuser | A CMS compromise could read the portal database | Accepted for launch. A follow up task gives the CMS its own role; it is out of scope for this plan |
| One droplet is a single point of failure for the portal and the website's CMS | Both go down together | Nightly dumps to R2 with a tested restore (Task 5.5); a droplet snapshot before each major deploy |
| Cross-tenant leak | The worst failure | Task 1.2 before features; RLS backstop; matrix in CI |

## 9. Open items that need a person

1. The decisions in section 2 are settled. D3 was left to me; say so if you want Clerk or Auth.js instead.
2. One time droplet changes (Tasks 0.3 and 0.6): the database and roles, the compose service, the Caddy block, a Cloudflare DNS record and WAF rules, and a droplet resize. These need the operator's approval and are not run from the repo. Also a CMS service user with an API key for the intake job, and the HubSpot tier check (Task 0.1).
3. Confirm the deal rules and tiers the proposal lists as open; build uses the proposal defaults until told otherwise.
4. Legal supplies the partner agreement and its version label.
5. Explicit go-ahead before anything touches production HubSpot (Task 5.7).
