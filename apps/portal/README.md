# CleanStart partner portal

`partners.cleanstart.com`: partners register deals and read documents, CleanStart staff approve deals and manage partners, and approved deals sync to HubSpot. One Next.js 16 app, its own Postgres database, a private R2 bucket for documents, Brevo for email.

Runbook: `docs/operations/PARTNER-PORTAL.md`. Build contracts: `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md`.

## Run it locally

```bash
bash apps/portal/scripts/db-create.sh cleanstart_portal        # roles and database, once
cp apps/portal/.env.example apps/portal/.env                    # then fill in AUTH_SECRET (openssl rand -base64 32)
pnpm --filter @cleanstart/portal db:migrate
pnpm --filter @cleanstart/portal db:seed                        # the mock's data, every login uses the development password in src/db/fixtures.ts
pnpm --filter @cleanstart/portal exec next dev --port 3004
```

## Checks

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test            # includes the tenant isolation matrix
pnpm --filter @cleanstart/portal build
pnpm --filter @cleanstart/portal e2e             # needs bash apps/portal/scripts/db-create.sh cleanstart_portal_e2e and e2e:install once
```

## Review gate

With `PORTAL_REVIEW_PASSWORD` set, every page asks for that shared password (HTTP Basic, username ignored). It stays on until launch. Leave it unset for local development.

## Where things live

- `src/components/screens/`: one file per screen. `src/components/shell/`: sidebar, top bar, Ctrl K search, notifications.
- `src/server/repo/`: every database read and write, scoped to the viewer. `src/server/actions/`: server actions. `src/server/hubspot/`: the HubSpot outbox and sync. `src/server/jobs/`: scheduled jobs.
- `src/db/`: schema, row level security (`rls.sql`), test helpers, development fixtures.
- `e2e/`: the Playwright `@portal` and `@a11y` suites.
