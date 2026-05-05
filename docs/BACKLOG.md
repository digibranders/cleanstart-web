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
| **D · Editor experience (server-side validators)** | 🟡 Partial | `4665232`–`2c748b7` |
| **E · Forms + leads runtime**                      | ✅ Done    | `db0e880`–`2869d0c` |
| **F · Search + structured data**                   | —         | —                       |
| **G · Webhooks, cron, observability**              | —         | —                       |
| **H · Migration ETL**                              | —         | —                       |
| **I · Hardening**                                  | —         | —                       |

Phase B verified end-to-end: DB drop+recreate, full schema push for all 17 collections + 6 globals, admin login, dashboard render with all groups visible.

Phase C verified end-to-end: 18 blocks render in the Pages "Add Layout" picker (Section primitive + 17 content blocks), Section composes nested blocks (one-level nesting only by design), full schema push clean.

Phase D **server-side** done in this session: block-level minRows validators (FAQ items, Pricing tiers, Section children, Table headers/rows, etc.), Lexical body-stats hook (readingMinutes/wordCount/tableOfContents on Blogs/News/Guides — 220 wpm, H2-H6 with disambiguated anchors), URL-shape and target validators on the typed-link field. **Client-side admin UX** (preview split-pane, custom React field components, publishing-checklist banner, lead-list CSV export) deferred — depends on either `apps/web` for the preview iframe or on the `leads` collection runtime which lands in Phase E.

Phase E verified: Leads collection (append-only, GDPR consent snapshot + audit chain), `/api/leads/submit` custom endpoint with Zod validation + per-IP rate limit (5/min, 50/day) + Cloudflare Turnstile (env-gated) + honeypot field + server-side re-validation of `forms.fields[]` rules, LeadHandler chain (db primary → company-from-domain enrichment → Brevo template send fanned out — secondary failures never block primary), R2 fallback queue with local-fs dev backstop, drainLeadQueueTask cron at `*/5 * * * *` with max 5 retry attempts, admin-only `GET /api/leads/export-csv` endpoint with optional `formId` / `since` / `until` filters. End-to-end "no lead lost during outage" path runs locally as long as Postgres is up; R2 + Turnstile + Brevo are env-gated so unconfigured pieces skip silently. Microsoft Teams handler removed and deferred to the future Integrations dashboard.

Phase E **still pending** — admin-React work, lifted to a Phase E2 / D-polish backlog when designs and editor research arrive: (1) GDPR DSAR admin actions (`Find by email` + `Delete by email` with cascade to `syncedTo[]` handlers), (2) `Retry sync` per-lead admin action that re-fires a specific failed handler, (3) `Flagged` tab pre-filtered for honeypot trips and Turnstile failures + bulk delete, (4) page-faceted leads browse (sidebar that turns `leads.source` into a navigable URL index — arch doc §`#leads-admin-view`), (5) `integrations` collection + admin surface for Teams / GA4 / GSC / Slack / HubSpot / Salesforce per "Future — Integrations dashboard" below.

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
| A11 | Coolify install on droplet, repo connected, auto-deploy on `main` push                                                                  | §`#hosting`                           | Pinned Coolify version                                                                                                 |
| A12 | Caddy reverse proxy in front of admin (`admin.cleanstart.com`) with auto-SSL                                                            | §`#hosting`                           | `infra/caddy/Caddyfile`                                                                                              |
| A13 | Cloudflare in front of admin, WAF rules enabled                                                                                           | §`#decisions` (admin access row)      | Bot fight mode + rate limit on `/api/users/login`                                                                    |
| A14 | GitHub Actions: lint + typecheck + build on PR                                                                                            | §`#stack`                             | One workflow file; matrix scoped to `apps/cms` for now                                                               |
| A15 | Sentry wired (frontend + Payload server)                                                                                                  | §`#stack`                             | DSN from env; PII redaction config                                                                                     |

**Phase A exit criteria:**

- `pnpm install && pnpm dev` brings up admin locally at `http://localhost:3000/admin`
- Bootstrap admin can log in with 2FA enabled
- `https://admin.cleanstart.com/admin` reachable, served via Cloudflare → Caddy → Payload, with valid SSL
- Push to `main` triggers Coolify deploy and the new container takes over without admin downtime > 60s
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

---

## Phase G · Webhooks, cron, observability

Goal: every operational signal arch doc requires is wired and verifiably firing.

| #  | Ticket                                                                                                                             | Arch doc anchor                          |
| -- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| G1 | Webhook emitter:`document.published` + `lead.submitted` to Teams                                                               | §`#webhooks`                          |
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

---

## Phase I · Hardening + cutover-ready

Goal: prod-quality posture; ready for cutover-day runbook.

| #  | Ticket                                                                            | Arch doc anchor                      |
| -- | --------------------------------------------------------------------------------- | ------------------------------------ |
| I1 | Security headers (CSP, HSTS, etc.)                                                | §`#security-headers`              |
| I2 | Rate limiting on public endpoints                                                 | §`#rate-limiting`                 |
| I3 | `infra/scripts/backup.sh` + `restore.sh` · cron + heartbeat                  | §`#restore-runbook`               |
| I4 | Quarterly restore drill scheduled ·`docs/RESTORE-LOG.md` started               | §`#decisions` (restore drill row) |
| I5 | Droplet tuning spec applied (Postgres / Sharp / Meili / kernel)                   | §`#droplet-tuning`                |
| I6 | Admin Lighthouse run · p95 admin action < 1s benchmark                           | §`#perf-budget`                   |
| I7 | Pre-cutover smoke test suite (50 sample-URL HTTP-200 + admin login + form submit) | §`#migration` (Phase 4 T-15m)     |

**Phase I exit criteria:**

- Restore drill: yesterday's backup restored to a fresh droplet within documented RTO
- Security-headers scan (e.g. securityheaders.com) returns A+ for `admin.cleanstart.com`
- Admin Lighthouse score above target on 5 representative routes
- Smoke test suite green on staging

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

Post-launch admin surface where editors connect external channels from a CMS settings page (no env-var edits, no code changes per channel). Each integration is a row in an encrypted `integrations` collection that registers a matching LeadHandler / observability-shipper / sitemap-pinger at runtime.

Day-1 candidates to lift from env-only wiring → managed in admin:

- **Microsoft Teams** — webhook URL + Standard Webhooks signing secret. Replaces the prototype Teams handler removed in this session; new leads + publish events fan out to the chosen channel.
- **Google Analytics 4** — measurement ID + API secret for a server-side events pipeline so lead/publish events join the GA4 stream without depending on the public site's tag.
- **Google Search Console** — service-account JSON. Powers IndexNow + Indexing-API submissions for new content; surfaces Search Console Coverage data on the dashboard.
- **HubSpot / Salesforce** — OAuth tokens + list/owner mappings. Unlocks the CRM secondary handler stubbed in arch doc §`#forms` (multi-select on `forms.crmHandlers`).
- **Slack** — webhook URL for editorial team notifications.

Schema sketch (not built yet):

```ts
// collections/Integrations.ts
{
  slug: 'integrations',
  access: { read: isAdmin, /* … */ },
  fields: [
    { name: 'kind', type: 'select', options: ['teams', 'ga4', 'gsc', 'hubspot', 'salesforce', 'slack'] },
    { name: 'enabled', type: 'checkbox' },
    { name: 'config', type: 'json' /* per-kind shape, encrypted at rest */ },
  ],
}
```

Trigger to start: when a real editor surfaces a need (e.g. "I want lead pings in #sales-eng"). Until then env-var-only flow + Brevo notifications cover launch volume.

---

## Phase G — Sentry project setup note

When wiring Phase G observability, create a fresh Sentry project at <https://fynix-digital.sentry.io/projects/new/> for the Next.js + Payload runtime. Suggested project name: `cleanstart-cms`. DSN goes into `SENTRY_DSN` in `apps/cms/.env` for local; production DSN lives in the Coolify env-vars panel, never committed.
