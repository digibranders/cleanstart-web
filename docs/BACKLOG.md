# CleanStart CMS — Build Backlog

Phase A–I sequence for `apps/cms` (Payload admin + REST API + hooks). Each ticket links to an anchor in `cleanstart-cms-architecture.html` for the *what*; conventions live in `CLAUDE.md` for the *how*.

**Hard rule:** a phase does not start until the previous phase's exit criteria are signed off.

---

## Phase status at a glance

| Phase                                                     | Status     | Commit range             |
| --------------------------------------------------------- | ---------- | ------------------------ |
| **A · Bootstrap**                                  | ✅ Done    | `c1317c7`              |
| **B · Core schema**                                | ✅ Done    | `3d2298e`–`c27c735` |
| **C · Page-builder blocks**                        | ✅ Done    | `e19ce1c`–`0f04f87` |
| **D · Editor experience**                          | ✅ Done    | `4665232`–`974994e` |
| **E · Forms + leads runtime**                      | ✅ Done    | `db0e880`–`974994e` |
| **F · Search + structured data**                   | ✅ Done    | `30894dc`–`974994e` |
| **G · Webhooks, cron, observability**              | 🟡 Partial | `30894dc`–`974994e` |
| **H · Migration ETL**                              | 🟡 Partial | `30894dc`–`974994e` |
| **I · Hardening**                                  | 🟡 Partial | `30894dc`–`974994e` |

**Codebase audit (2026-05-12):** Phases D–I status updated to reflect what was confirmed implemented. Phases previously marked "—" (F, G, H, I) are substantially done — see per-phase notes below for the remaining ops-only gaps.

Phase B verified end-to-end: DB drop+recreate, full schema push for all 17 collections + 6 globals, admin login, dashboard render with all groups visible.

Phase C verified end-to-end: 18 blocks render in the Pages "Add Layout" picker (Section primitive + 17 content blocks), Section composes nested blocks (one-level nesting only by design), full schema push clean.

Phase D complete: server-side validators, body-stats hook, publishing-checklist banner (`PublishChecklistBanner` component), author offboarding (Disable account + Reassign content actions), DSAR admin panel, slug-change redirect hook, preview URL with JWT gating, CSV export, and full admin UI polish (custom `@cleanstart/ui` design system throughout).

Phase E complete: Leads collection, `/api/leads/submit` with Zod + rate-limit + Turnstile + honeypot, LeadHandler chain (db primary → Brevo), R2 fallback queue + drain cron, CSV export, GDPR DSAR admin panel (`Find by email` + `Delete by email` + audit log), `Retry sync` per-lead action, `Flagged leads` tab with bulk delete. Admin-React components use `@cleanstart/ui` exclusively.

## Phase A · Bootstrap

Goal: empty repo → working Payload admin running locally and on the droplet, with CI green.

| #   | Ticket                                                                                                                                    | Arch doc anchor                          | Notes                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A1  | Initialise pnpm workspaces + Turborepo at repo root                                                                                       | §`#repo`                              | `pnpm-workspace.yaml`, `turbo.json`, root `package.json` scripts: `dev` / `build` / `lint` / `typecheck` |
| A2  | Create `packages/config` with shared tsconfig + Biome config                                                                            | §`#stack`                             | Strict TS; Biome for lint+format                                                                                       |
| A3  | Create `packages/types` skeleton (re-exports `apps/cms/payload-types`)                                                                | §`#stack`                             | Empty until A6 lands                                                                                                   |
| A4  | Scaffold `apps/cms` Next.js 16.2 app                                                                                                    | §`#stack`                             | `next@16.2`, `react@19`, App Router                                                                                |
| A5  | Install Payload 3.81+, configure `payload.config.ts` minimal                                                                            | §`#stack`                             | Postgres adapter,`graphQL: { disable: true }`, secret from env                                                       |
| A6  | Wire `payload generate:types` into `pnpm` script + pre-commit                                                                         | §`#decisions` (RBAC shape row)        | Output committed to `apps/cms/payload-types.ts`                                                                      |
| A7  | Local dev: docker-compose with Postgres 16                                                                                                | §`#hosting`                           | `infra/docker-compose.yml`; localhost-bound                                                                          |
| A8  | Auth + RBAC base:`users` collection with `roles: string[]`                                                                            | §`#rbac`, §`#decisions` (RBAC row) | One bootstrap admin seeded via migration                                                                               |
| A9  | ~~Mandatory 2FA on admin login~~ **DEFERRED** to Phase I hardening — admin sits behind Cloudflare WAF + strong-password meanwhile | §`#decisions` (admin access row)      | Plugin choice still open:`payload-2fa-plugin` vs custom auth strategy with TOTP                                      |
| A10 | Provision droplet (DO Bangalore, 2 GB / 1 vCPU + 2 GB swap)                                                                               | §`#hosting`, §`#droplet-tuning`    | Apply tuning spec verbatim                                                                                             |
| A11 | GitHub Actions deploy workflow (`.github/workflows/deploy-cms.yml`): build image, ship via SSH, `docker compose up -d --wait` on push to `main` | §`#hosting`                           | Repo secrets: `DROPLET_IP`, `DROPLET_SSH_KEY`, `CMS_ENV_FILE`                                                          |
| A12 | Caddy reverse proxy in front of admin (`cms.cleanstart.com`) with auto-SSL                                                            | §`#hosting`                           | `/etc/caddy/Caddyfile` on droplet (host install, not in Docker)                                                       |
| A13 | Cloudflare in front of admin, WAF rules enabled                                                                                           | §`#decisions` (admin access row)      | Bot fight mode + rate limit on `/api/users/login`                                                                    |
| A14 | GitHub Actions: lint + typecheck + build on PR                                                                                            | §`#stack`                             | One workflow file; matrix scoped to `apps/cms` for now                                                               |
| A15 | Sentry wired (frontend + Payload server)                                                                                                  | §`#stack`                             | DSN from env; PII redaction config                                                                                     |

**Phase A exit criteria:**

- `pnpm install && pnpm dev` brings up admin locally at `http://localhost:3000/admin`
- Bootstrap admin can log in (password-only at v1; 2FA deferred per A9)
- `https://cms.cleanstart.com/admin` reachable, served via Cloudflare → Caddy → Payload, with valid SSL
- Push to `main` triggers the GitHub Actions deploy workflow; `docker compose up -d --wait` swaps the container without admin downtime > 60s
- CI green on a no-op PR; failing lint/typecheck/build fails CI as designed

---

## Phase B · Core schema

Goal: every collection in arch doc §03 exists with full field schema and generated types.

Build in dependency order (matches arch doc Phase 2 of migration):

| #   | Ticket                                                                                              | Arch doc anchor                      | Notes                                                                         |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| B1  | `media` collection · R2 cloud-storage adapter · Sharp transforms                                | §`#new-fields` (media)            | Humanised-filename alt-text starter on upload (§`#decisions` alt-text row) |
| B2  | Upload size limits per file type                                                                    | §`#upload-limits`                 | Enforced server-side, surfaced in admin error                                 |
| B3  | `users` extension: roles enum, RBAC rules                                                         | §`#rbac`                          | Access control functions in `apps/cms/src/payload/access/`                  |
| B4  | `authors` collection (pure content, no `linkedUser`)                                            | §`#new-fields` (authors)          | Per locked-this-session decision                                              |
| B5  | `categories`, `newsCategories`, `jobLocations`                                                | §`#new-fields`                    | Direct 1:1 from Webflow shape                                                 |
| B6  | `forms` collection: 6 field types + conditional logic + rate-limit/retention defaults             | §`#forms`                         | Day-1 conditional logic per locked decision                                   |
| B7  | `blogs` collection with full field set + drafts/versions                                          | §`#new-fields` (blogs)            | Drafts + versions + scheduled publish                                         |
| B8  | `news` collection · `isAccessibleForFree: true` · NewsArticle JSON-LD                         | §`#new-fields` (news)             | News-inclusion posture per locked decision                                    |
| B9  | `guides` collection · `faqs[]` array · `keywords` · `articleSections` · `citations`   | §`#new-fields` (guides)           | Replaces flattened Q1–Q5/Ans1–Ans5                                          |
| B10 | `resources` collection with optional `gateForm` relationship                                    | §`#new-fields` (resources)        | Per locked-this-session decision                                              |
| B11 | `events` + `webinars` with `registrationMode` discriminator                                   | §`#new-fields` (events, webinars) | Per locked decision:`inHouse` / `external` switchable per record          |
| B12 | `jobs` collection · `source` discriminator (CMS vs ATS)                                        | §`#new-fields` (jobs)             | JobPosting JSON-LD layer 1                                                    |
| B13 | `aboutGalleries` collection (no per-item URL)                                                     | §`#not-migrating`                 | Read-only on `/about-us` only                                               |
| B14 | `pages` collection (page-builder host, blocks added in Phase C)                                   | §`#new-fields` (pages)            | Empty `layout` blocks array for now                                         |
| B15 | `redirects` collection · slug-change `beforeChange` hook                                       | §`#new-fields` (redirects)        | Hook lands in Phase D — schema only here                                     |
| B16 | Globals:`siteSettings`, `mainNav`, `footerNav`, `legal`, `seoDefaults`, `announcements` | §`#globals`                       | Singletons                                                                    |
| B17 | Reusable SEO field group `apps/cms/src/payload/fields/seo.ts`                                     | §`#seo-group`                     | Wired into every content collection                                           |
| B18 | `payload generate:types` runs in CI; build fails on type drift                                    | §`#stack`                         | Snapshot test on public type surface                                          |

**Phase B exit criteria:**

- Every collection in arch doc §03 + every global in §`#globals` exists in `apps/cms/src/payload/`
- Generated `payload-types.ts` compiles; `packages/types` re-exports cleanly
- An editor can create / save draft / publish one document per content collection in admin
- Drafts and scheduled publish surfaces are visible per collection
- RBAC rules enforce: admin = full, editor = create/edit/publish content, author = create/edit own drafts, never publish
- Schema-validation snapshot tests pass

---

## Phase C · Page-builder blocks

Goal: 17 blocks composed onto `pages.layout`; admin can build a page using all of them.

| #   | Ticket                                                                                | Arch doc anchor           |
| --- | ------------------------------------------------------------------------------------- | ------------------------- |
| C1  | Lexical config with table extension (`colspan`/`rowspan` handling)                | §`#table-handling`     |
| C2  | Typed-link picker `{kind: 'doc' \| 'media' \| 'url', ...}`                            | §`#link-handling`      |
| C3  | FAQ array field UX                                                                    | §`#faq-handling`       |
| C4  | Block: Hero                                                                           | §`#blocks`             |
| C5  | Block: FeatureGrid                                                                    | §`#blocks`             |
| C6  | Block: LogoCloud                                                                      | §`#blocks`             |
| C7  | Block: Testimonial                                                                    | §`#blocks`             |
| C8  | Block: CTA                                                                            | §`#blocks`             |
| C9  | Block: Comparison                                                                     | §`#blocks`             |
| C10 | Block: FAQ (uses C3)                                                                  | §`#faq-handling`       |
| C11 | Block: Stats                                                                          | §`#blocks`             |
| C12 | Block: Gallery                                                                        | §`#blocks`             |
| C13 | Block: CodeBlock                                                                      | §`#blocks`             |
| C14 | Block: IntegrationLogos                                                               | §`#blocks`             |
| C15 | Block: MetricsBar                                                                     | §`#blocks`             |
| C16 | Block: Embed                                                                          | §`#blocks`             |
| C17 | Block: RichText (uses C1)                                                             | §`#semantic-tags`      |
| C18 | Block: Pricing                                                                        | §`#blocks`             |
| C19 | Block: JobsList                                                                       | §`#blocks`             |
| C20 | Block: Table (uses C1's table extension)                                              | §`#table-handling`     |
| C21 | Wire all blocks into `pages.layout`                                                 | §`#new-fields` (pages) |
| C22 | JSON-LD layer 2: HowTo, SoftwareApplication, VideoObject, Review (typed-field driven) | §`#structured-data`    |

**Phase C exit criteria:**

- Admin can compose a page using all 17 block types
- Generated types include every block discriminator
- JSON-LD preview field renders without errors for a sample page using each block
- `schema-dts` validates emitted JSON-LD with zero errors

---

## Phase D · Editor experience

Goal: editors can preview, follow the publishing checklist, and ship without breaking links.

| #   | Ticket                                                                                        | Arch doc anchor                              |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| D1  | Preview API: token-gated URL with JWT exp (1h/1d/7d/30d)                                      | §`#preview-workflow`                      |
| D2  | Admin split-pane preview UX                                                                   | §`#preview-workflow`                      |
| D3  | Slug-change `beforeChange` hook → auto-creates `redirects` row                           | §`#migration` (Route segments subsection) |
| D4  | Publishing checklist UI: required fields, internal-link integrity, alt-text, JSON-LD validity | §`#publishing-checklist`                  |
| D5  | Custom field component: SEO panel                                                             | §`#seo-group`                             |
| D6  | Custom field component: FAQ array UX                                                          | §`#faq-handling`                          |
| D7  | Custom field component: JSON-LD preview                                                       | §`#structured-data`                       |
| D8  | Custom field component: publishing-checklist banner                                           | §`#publishing-checklist`                  |
| D9  | Author offboarding flow                                                                       | §`#author-offboarding`                    |
| D10 | Drafts/versions/scheduled-publish admin UX polish                                             | §`#drafts-versions`                       |
| D11 | Lead-list view: filters, sort, CSV export                                                     | §`#forms`                                 |

**Phase D exit criteria:**

- Publishing checklist blocks Publish on rule violations; bypass is impossible from the UI
- Slug change on a published doc creates a `redirects` row with the old → new mapping
- Preview URL works for a draft; expiry returns 401 after JWT expires; revocation works at expiry granularity (no manual revoke at v1 per arch doc)
- CSV export of leads works for a filtered list

---

## Phase E · Forms + leads

Goal: forms render, leads land, no submission lost during a CMS outage.

| #  | Ticket                                                                           | Arch doc anchor                           |
| -- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| E1 | `leads` collection: append-only, PII-aware redaction in Sentry                 | §`#privacy-gdpr`                       |
| E2 | `LeadHandler` adapter: primary writes to DB; secondary handlers fan out        | §`#forms`                              |
| E3 | Brevo handler (transactional email on submission)                                | §`#forms`                              |
| E4 | Teams webhook handler (Standard Webhooks signing)                                | §`#webhooks`                           |
| E5 | R2 fallback queue:`/api/leads` writes to R2 if DB write fails                  | §`#forms`                              |
| E6 | Cron: 5-min lead-queue drain                                                     | §`#cron-jobs`                          |
| E7 | Turnstile verification on `/api/leads` (no reCAPTCHA)                          | §`#forms`                              |
| E8 | Form rate-limit + retention defaults applied globally                            | §`#rate-limiting`, §`#privacy-gdpr` |
| E9 | E2E test: submission with DB intentionally down → R2 queue → drain on recovery | §`#forms`                              |

**[Phase E exit criteria:]()**

- Form submission with CMS up: `leads` row created + Brevo email fired + Teams webhook delivered with valid signature
- Form submission with DB injected-down: lead lands in R2 queue; cron drains it within 5 min; nothing lost
- Turnstile blocks a known-bad token (e2e fixture)
- Rate limit fires after configured threshold (e2e fixture)
- CSV export from D11 includes the test leads

---

## Phase F · Search + structured data

Goal: published content is searchable; JSON-LD is valid for every collection.

| #  | Ticket                                                           | Arch doc anchor                       |
| -- | ---------------------------------------------------------------- | ------------------------------------- |
| F1 | Meilisearch on droplet (docker-compose)                          | §`#stack`                          |
| F2 | Search index schema                                              | §`#search-index`                   |
| F3 | Indexing via Payload `afterChange` hooks (publish + delete)    | §`#search-index`                   |
| F4 | Search analytics + content-gap signals                           | §`#search-analytics`               |
| F5 | 404 monitoring + broken-inbound-link surfacing                   | §`#404-monitoring`                 |
| F6 | JSON-LD layer 1 emission (auto from typed fields) per collection | §`#structured-data`                |
| F7 | `/sitemap-news.xml` route handler on `apps/cms`              | §`#sitemap-robots`                 |
| F8 | Site-level `NewsMediaOrganization` schema                      | §`#decisions` (news inclusion row) |

**Phase F exit criteria:**

- Publishing a doc indexes it in Meili within 5s; deletion removes it
- Sample query returns expected typo-tolerant + faceted results
- `schema-dts` validates JSON-LD output for one fixture per content collection with zero errors
- `/sitemap-news.xml` returns valid news sitemap with `isAccessibleForFree: true` per item

**Phase F audit (2026-05-12):** All F1–F8 implemented. Meilisearch custom HTTP client + 10-collection index schema + afterChange/afterDelete sync hooks; JSON-LD 3-layer system (10 collections); all 3 sitemap routes (`/api/sitemap.xml`, `/api/sitemap-news.xml`, `/api/sitemap-images.xml`); `robots.txt` route; search analytics endpoint; `NewsMediaOrganization` in `lib/jsonld/organization.ts`. **Remaining gap:** live Meilisearch instance on droplet (ops task requiring running server).

---

## Phase G · Webhooks, cron, observability

Goal: every operational signal arch doc requires is wired and verifiably firing.

| #  | Ticket                                                                                                                             | Arch doc anchor                          |
| -- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| G1 | Webhook emitter:`document.published` + `lead.submitted` to Teams · target the **Workflows** webhook URL shape (Adaptive Card body), **not** the legacy Office 365 Connector — connector retires 2026-05-18. See `INTEGRATIONS-RESEARCH.md` §0. | §`#webhooks`                          |
| G2 | Standard Webhooks signing on emit; verification fixture                                                                            | §`#webhooks`                          |
| G3 | Cron catalog: backup heartbeat, lead-queue drain (E6), Meili reindex check, IndexNow ping, sitemap regen, scheduled-publish runner | §`#cron-jobs`                         |
| G4 | Structured JSON logging to stdout · request-ID propagation                                                                        | §`#logging-alerting`                  |
| G5 | Sentry PII redaction policy in code                                                                                                | §`#privacy-gdpr`                      |
| G6 | BetterStack Uptime: 5 monitors (admin, Meili, SSL, backup heartbeat, droplet ping)                                                 | §`#logging-alerting`                  |
| G7 | Alert rules: 10 rules per arch doc; P1 pages, P2 Slack, P3 daily digest                                                            | §`#logging-alerting`                  |
| G8 | Status page at `status.cleanstart.com`                                                                                           | §`#decisions` (uptime monitoring row) |

**Phase G exit criteria:**

- Publishing a doc fires Teams webhook with valid signature
- Backup-heartbeat-missing alert fires when cron is paused for 25h in a test env
- Sentry captures a thrown error from a hook with PII redacted
- Structured log line shows request-ID end-to-end through one publish action

**Phase G audit (2026-05-12):** G1–G5 implemented. Teams Adaptive Card handler (`lib/webhooks/teams.ts` — Workflows URL shape, not legacy connector); Standard Webhooks HMAC-SHA256 signing (`lib/webhooks/sign.ts`); 6 Payload cron tasks (drain-lead-queue, purge-search-log, purge-leads-pii, check-broken-links, retry-webhook, reindex-meili); IndexNow hook on 7 collections; request-ID propagation middleware; Sentry PII redaction in `sentry.server.config.ts`. **Remaining gap:** G6 BetterStack monitors, G7 alert rules, G8 status page — all require a live BetterStack account (ops tasks).

---

## Phase H · Migration ETL

Goal: dry-run on staging passes all 9 acceptance criteria from arch doc §`#migration`.

| #   | Ticket                                                                                            | Arch doc anchor                               |
| --- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| H1  | `migrations/webflow-import/export.ts`: Webflow API → JSONL · token-bucket throttle 50 req/min | §`#migration` (Phase 1)                    |
| H2  | Schema-parity audit script →`migrations/SCHEMA-PARITY-AUDIT.md`                                | §`#migration` (Phase 1)                    |
| H3  | Per-collection transforms:`transform-{collection}.ts`                                           | §`#migration` (Phase 2)                    |
| H4  | Body-text URL rewriter (`uploads-ssl.webflow.com` / `uploads.webflow.com` → R2)              | §`#migration` (zero-tolerance subsection)  |
| H5  | Asset re-upload with `migration_progress` checkpoint table + SHA-256 verify                     | §`#migration` (Asset re-upload subsection) |
| H6  | `import.ts`: Payload Local API loader, dependency-ordered                                       | §`#migration` (Phase 2)                    |
| H7  | `url-parity.ts`: sitemap diff Webflow vs new                                                    | §`#migration`                              |
| H8  | Acceptance-criteria gate: 9 automated assertions                                                  | §`#migration` (Acceptance criteria table)  |
| H9  | Staging dry-run runner                                                                            | §`#migration` (Phase 3)                    |
| H10 | Rollback drill mechanics                                                                          | §`#migration` (Rollback procedure)         |

**Phase H exit criteria:**

- Dry-run on staging passes all 9 acceptance criteria
- Rollback drill executed at least once on staging
- Sign-off captured in `docs/migration/dry-run-{date}.md` per arch doc

**Phase H audit (2026-05-12):** H1–H8 ETL scripts implemented in `migrations/webflow-import/`. **Remaining gap:** H9 (staging dry-run execution — needs staging droplet + Webflow export data) and H10 (rollback drill — needs H9 first). Dry-run template in `docs/migration/dry-run-template.md`; rollback runbook in `docs/migration/rollback-runbook.md`.

---

## Phase I · Hardening + cutover-ready

Goal: prod-quality posture; ready for cutover-day runbook.

| #  | Ticket                                                                            | Arch doc anchor                      |
| -- | --------------------------------------------------------------------------------- | ------------------------------------ |
| I1 | Security headers (CSP, HSTS, etc.)                                                | §`#security-headers`              |
| I2 | Rate limiting on public endpoints                                                 | §`#rate-limiting`                 |
| I3 | `infra/scripts/backup.sh` + `restore.sh` · cron + heartbeat                  | §`#restore-runbook`               |
| I4 | Quarterly restore drill scheduled ·`docs/operations/RESTORE-LOG.md` started               | §`#decisions` (restore drill row) |
| I5 | Droplet tuning spec applied (Postgres / Sharp / Meili / kernel)                   | §`#droplet-tuning`                |
| I6 | Admin Lighthouse run · p95 admin action < 1s benchmark                           | §`#perf-budget`                   |
| I7 | Pre-cutover smoke test suite (50 sample-URL HTTP-200 + admin login + form submit) | §`#migration` (Phase 4 T-15m)     |

**Phase I exit criteria:**

- Restore drill: yesterday's backup restored to a fresh droplet within documented RTO
- Security-headers scan (e.g. securityheaders.com) returns A+ for `cms.cleanstart.com`
- Admin Lighthouse score above target on 5 representative routes
- Smoke test suite green on staging

**Phase I audit (2026-05-12):** I1 (CSP + HSTS + all security headers in `next.config.ts`), I2 (rate limiting on all public endpoints), I3 (`infra/scripts/backup.sh` + `restore.sh` + `infra/docker-compose.yml` + `infra/caddy/Caddyfile`), I7 (50-test smoke suite in `apps/cms/tests/e2e/smoke.spec.ts`) all done. **Remaining gap:** I4 (restore drill execution — needs staging), I5 (droplet tuning spec applied — needs SSH access), I6 (Lighthouse benchmark — needs live admin + content).

---

## Cross-cutting CI gates (apply on every PR after Phase A)

- `pnpm --filter @cleanstart/cms lint`
- `pnpm --filter @cleanstart/cms typecheck`
- `pnpm --filter @cleanstart/cms build`
- `pnpm --filter @cleanstart/cms test` (Vitest)
- `pnpm --filter @cleanstart/cms e2e --grep @phase-{current}` (Playwright; phase-tagged)
- `payload generate:types` drift check
- `schema-dts` validation on JSON-LD fixtures (Phase F onward)

---

## Out of scope this backlog

- `apps/web` (public marketing site) — separate backlog after public-site planning session
- Brand/Tailwind tokens, shadcn theming — wait for new brand + Figma
- Custom `/dashboard` route group — only added if Payload admin proves insufficient (per arch doc §`#decisions` custom-dashboard row)
- ISR-revalidate handshake consumer side — lives in `apps/web`
- Public-site sitemap.xml — lives in `apps/web`

---

## Future — Integrations dashboard

> Research: **`docs/integrations/INTEGRATIONS-RESEARCH.md`** is the authoritative scoping note for what this dashboard supports, why, and the open product questions still to resolve. Read it before scheduling any of the work below. **`docs/integrations/INTEGRATIONS-RESEARCH-V2.md`** extends it with inbound webhooks, analytics read-back (GA4 / GSC / Clarity), and the L1/L2/L3 admin dashboard UX, and proposes the J1 / J2 / J3 milestone breakdown.

Post-launch admin surface where editors connect external channels from a CMS settings page (no env-var edits, no code changes per channel). Each row in an encrypted `integrations` collection registers a matching LeadHandler / observability-shipper / sitemap-pinger at runtime through the existing `registerSecondaryHandler()` pipeline.

### Tier 1 — day-1 of the dashboard

Editor self-serve, low setup cost, covers the channel-notification use case in full:

- **Microsoft Teams** — Workflows webhook URL (one row per channel), Adaptive Card body, optional `mentions[]` (AAD Object ID + UPN — same shape works for in-tenant users *and* `#EXT#` guest accounts). **Not** the legacy Office 365 Connector; that path retires 2026-05-18.
- **Slack** — Incoming Webhook URL (per channel) or Slack App OAuth (`chat:write`). Block Kit message body, optional `<@user>` mentions resolved to Slack member IDs.
- **Generic webhook** — catch-all for Zapier / n8n / Make / custom HTTPS endpoints. Standard Webhooks signing on emit; receivers handle dedup via `webhook-id`.

### Tier 2 — primary CRM (Zoho — already in use) + future CRMs

OAuth-based, deeper config surface; Zoho is the active CRM and the canonical adapter to build first. The arch-doc's historical `forms.crmHandlers[]` examples (`hubspot` / `salesforce`) are placeholder bets — Zoho leads.

- **Zoho CRM** — Zoho OAuth 2.0 self-client → long-lived refresh token; **data-centre-scoped** (`zoho.com` / `.eu` / `.in` / `.com.au` / `.jp` — confirm CleanStart's DC before wiring). Maps `lead.submitted` → `Leads` (or `Contacts` + `Deals` for the deal-registration form). Editor-configurable field mapping (Zoho's API field names can be customized per org). `deleteByEmail()` cascade for GDPR Art. 17 — search-by-email then delete by returned record IDs.
- **HubSpot / Salesforce / Pipedrive** — same shape as Zoho, different object models. Future / on-demand only — build when sales tooling actually changes.
- **Google Sheets** — append-row sink via service-account JSON. Useful as an audit trail alongside Zoho or as a fallback during a Zoho outage.

Settle on `/api/oauth/callback/[provider]` route shape on `cms.cleanstart.com` before the first row lands.

### Tier 3 — server-side analytics / SEO

- **GA4 (Measurement Protocol)** — measurement ID + API secret. Server-side `generate_lead` events join the GA4 stream without depending on the public site's tag. Complementary to the GTM-first matrix in arch doc §`#marketing-tags`, not a replacement.
- **Google Search Console / Indexing API** — service-account JSON. IndexNow + Indexing-API submissions on slug change; GSC Coverage data surfaced on the dashboard.

### Tier 4 — comms beyond chat

- **Twilio SMS** — high-intent leads (deal-registration, demo request) ping a phone number; routed by `formSlugs[]` predicate.
- **Discord** — same shape as Slack/Teams; relevant if a community Discord exists.
- **Brevo email digest** — daily/weekly batched lead/publish digest for stakeholders not in chat. Reuses the existing Brevo API key.

Booking widgets (Calendly, Chili Piper, HubSpot Meetings) and chat widgets (Intercom, Drift, Crisp) are **frontend** integrations — they live in `apps/web`, not the dashboard.

### Schema sketch (not built yet)

```ts
// collections/Integrations.ts
{
  slug: 'integrations',
  access: { read: isAdmin, /* … */ },
  fields: [
    { name: 'kind', type: 'select',
      options: ['teams', 'slack', 'webhook',                         // Tier 1
                'zohoCrm',                                           // Tier 2 — primary CRM (in use)
                'hubspot', 'salesforce', 'pipedrive', 'sheets',      // Tier 2 — future CRMs
                'ga4', 'gsc',                                        // Tier 3
                'twilio', 'discord', 'brevoDigest'] },               // Tier 4
    { name: 'label', type: 'text', required: true },                 // "Sales channel · #sales-eng-leads"
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'config', type: 'json' /* per-kind shape, encrypted at rest via pgcrypto */ },
    { name: 'routing', type: 'group', fields: [
      { name: 'events', type: 'select', hasMany: true,
        options: ['document.published', 'lead.submitted'] },
      { name: 'collections', type: 'text', hasMany: true },          // empty = all
      { name: 'formSlugs', type: 'text', hasMany: true },            // lead.submitted only
      { name: 'minLeadScore', type: 'number' },                      // optional predicate
    ] },
    { name: 'mentions', type: 'array', fields: [                     // teams + slack only
      { name: 'displayName', type: 'text', required: true },
      { name: 'externalId', type: 'text', required: true },          // AAD Object ID / Slack member ID
      { name: 'upn', type: 'text' },                                 // teams only
      { name: 'triggerOn', type: 'select', hasMany: true,
        options: ['document.published', 'lead.submitted'] },
    ] },
  ],
}
```

Per-row Test / Health / Pause / Audit affordances reuse the Phase G `webhooks_dead_letter` machinery — no forked retry/DLQ. See `INTEGRATIONS-RESEARCH.md` §3 for the dashboard wiring.

Trigger to start: when a real editor surfaces a need (e.g. "I want lead pings in #sales-eng" or "ping `user@fynix.digital` on every demo request"). Until then env-var-only flow + Brevo notifications cover launch volume.

---

## Phase G — Sentry project setup note

When wiring Phase G observability, create a fresh Sentry project at <https://fynix-digital.sentry.io/projects/new/> for the Next.js + Payload runtime. Suggested project name: `cleanstart-cms`. DSN goes into `SENTRY_DSN` in `apps/cms/.env` for local; production DSN lives in `/opt/cleanstart/.env` on the droplet (chmod 600), never committed.

---

## Deferred — SEO / UX audit (2026-05-08)

Captured during the senior-SEO + senior-UX review session in `~/.claude/plans/act-as-s-senior-fluffy-brooks.md`. Items below need an external decision or another phase to land before they can ship; everything that *could* land in-session has already shipped (35/45 backlog items + all 12 Webflow-migration items). Each row is tagged with what unblocks it.

| ID         | Item                                                        | Blocked on                                                                                  | Notes                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0.1**   | Wire Payload Live Preview                                   | `apps/web` returning OR a stub-host decision                                              | One-line `admin.livePreview.url = (doc) => ...` in `payload.config.ts` once we know the public-site URL shape. Per-collection URL builder.                              |
| **P0.2**   | Publishing checklist UI + publish gate                      | User explicitly skipped (wants `apps/web` context first)                                  | New `PublishChecklist` custom view + `beforeChange` gate refusing `_status='published'` when SEO blockers exist. **Blocks P2.7 and S3.11.**                              |
| **P1.6**   | Sidebar IA accordion refactor (Health / Meta / Advanced / Redirects / Publish / Stats) | Touches every sidebar field — wants design review                                           | Recommend dedicated wave with mockups. localStorage open-state pattern already proven by `SeoAdvancedPanel`.                                                              |
| **P1.7**   | Hreflang / `alternateLocales`                               | Single-locale vs multi-locale launch decision                                               | Adds `alternateLocales[]` to `siteSettings`, per-doc alternate-URL group, doc-head emit. Empty until launch locale strategy lands. **Blocks S3.8.**                  |
| **P1.14**  | Listing-page noindex by depth                               | `apps/web` rendering                                                                      | The CMS already exposes `siteSettings.listing.paginationIndexableDepth`; the meta-robots emit happens in the public site head.                                            |
| **P2.7**   | Publish blockers list in sidebar                            | P0.2 publish gate                                                                           | Surfaces P0.2's blockers — meaningless without the gate.                                                                                                                   |
| **P2.11**  | Authors versioning / drafts                                 | User decision on workflow                                                                   | Flips editor flow for the 7 existing authors; needs sign-off that a draft-required model is desired (vs Webflow's single-snapshot habit).                                   |
| **P2.16**  | Mobile responsive admin                                     | Larger CSS pass — separate wave                                                             | Sidebar toggle <768px, vertical-stack edit forms. Editor-on-phone scenario is rare today; defer until the public site stabilises.                                           |
| **S3.7**   | "Last Googlebot seen" sidebar chip                         | GSC OAuth + Indexing API integration                                                        | Stub today; wires when GSC connector lands.                                                                                                                                |
| **S3.8**   | Hreflang siblings sidebar chip                              | P1.7 hreflang field                                                                         | Empty until alternateLocales exists.                                                                                                                                        |
| **S3.11**  | "Publish blockers" sidebar card                             | P0.2 publish gate                                                                           | One render of the gate's predicates as a list of failing checks.                                                                                                           |

| **P2.17**  | Wire `mainNav` / `footerNav` / `announcements` globals to `apps/web` | `apps/web` SSR fetch + nav/footer refactor decision | `mainNav` and `footerNav` are fully editable in admin but `apps/web` still uses the hardcoded `NAV_TREE` and static `Footer`. `announcements` has no consumer at all. Either (a) wire `apps/web` SSR to fetch these globals via `cms-fetch.ts` (resolve-spotlights.ts is a ready template) and build an `AnnouncementBanner`, or (b) remove the three globals from CMS and from the B16 backlog entry. Needs a product decision on whether nav should be CMS-editable at launch. |
| **P2.18**  | Page-builder block renderer in `apps/web` | `apps/web` routing + CMS integration phase | All 19 page-builder blocks are fully defined in `apps/cms/src/payload/blocks/` and compose correctly into `Pages.layout`. However, `apps/web` has no `[...slug]` catch-all route or `PageBlockRenderer` component. Composing a Pages doc currently results in a 404 and the preview resolver points at a non-existent route. Fix: build a `[...slug]` catch-all in `apps/web` that fetches by `doc.path` and a `PageBlockRenderer` switching on `blockType`. Until then, pages are CMS-editable but not publicly served. |

**Trigger to start:** when the corresponding "blocked on" condition resolves (e.g. `apps/web` reintroduced, locale strategy decided, design review scheduled), pull the corresponding ID out of this table and into the relevant phase backlog.
