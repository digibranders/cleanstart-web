# Playwright E2E

Per CLAUDE.md "Test conventions". Each spec tagged with `@phase-*` so CI
can run a phase's gate suite via `--grep`:

```bash
pnpm --filter @cleanstart/cms test:e2e --grep @phase-d-preview
pnpm --filter @cleanstart/cms test:e2e --grep @phase-e-leads
pnpm --filter @cleanstart/cms test:e2e --grep @phase-f-publishing
```

The Playwright `webServer` block spawns `pnpm dev` if `CMS_BASE_URL` is
not set. Local runs need a Postgres on `localhost:5432` and an
`apps/cms/.env`. CI uses the workflow's Postgres service.

These specs are intentionally minimal scaffolds — they verify routing
and boundary behaviour without seeded fixtures. Replace with full
flows as auth + seed fixtures land in subsequent tickets.
