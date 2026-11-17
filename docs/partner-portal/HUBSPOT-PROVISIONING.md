# HubSpot provisioning

`apps/portal/scripts/provision-hubspot.ts` creates the partner portal properties, the "Partner deals" pipeline and the deal to company labels. It is idempotent: an object that already exists is skipped.

```bash
HUBSPOT_PORTAL_TOKEN=... pnpm --filter @cleanstart/portal exec tsx scripts/provision-hubspot.ts            # dry run
HUBSPOT_PORTAL_TOKEN=... pnpm --filter @cleanstart/portal exec tsx scripts/provision-hubspot.ts --apply    # write
```

Flags:

- `--apply`: write to HubSpot. Without it the script only prints what it would create.

There is no flag for unique-value properties: `portal_registration_id` and `partner_portal_id` are always created as unique-value properties (HUBSPOT-CAPABILITIES.md row d: allowed, reported by the product owner on 2026-11-16). Every create also searches by `portal_registration_id` first, so a retried create cannot duplicate a deal.

The script also creates the deal to company labels "Partner" and "Customer". Keep `HUBSPOT_USE_ASSOCIATION_LABELS=false` (the build default): row a of the capability check passed in the HubSpot UI but has not been tried through a private app token, and turning the flag on is a later decision, once provisioning has run against this portal.

## partner_name must already exist

`dealProperties` (`src/server/hubspot/mappers.ts`) writes the deal property `partner_name`, but this script does not create it. It is expected to exist in the HubSpot account already, created by the older CMS deal-property setup. A deal create that names a missing property is rejected by HubSpot, so confirm `partner_name` exists on deals before `registration.create` runs. The dry run prints this warning every time.

## Production provisioning runbook

Executed only in master Task 5.7, after explicit approval. W2-f links to this file from `docs/operations/PARTNER-PORTAL.md`.

1. Create the production private app with the scopes in the HubSpot plan, section 3. Add the token as the GitHub secret `PORTAL_HUBSPOT_TOKEN` (the name `deploy-portal.yml` reads); the deploy workflow renders it as `HUBSPOT_PORTAL_TOKEN` into `/opt/cleanstart/portal.env` on the droplet (chmod 600). Never put it in `/opt/cleanstart/.env`, which is the CMS's file. The two HubSpot variables `HUBSPOT_PORTAL_TOKEN` and `HUBSPOT_PARTNER_PIPELINE_ID` are required in production and optional everywhere else: the app refuses to start in production without them. `HUBSPOT_WEBHOOK_SECRET` is optional everywhere.
2. Run `provision-hubspot.ts` in dry run and read it. Get the go-ahead. Run with `--apply`. Record the pipeline id in `HUBSPOT_PARTNER_PIPELINE_ID`.
3. Import the roughly 20 current partners with `import-partners.ts <partners.json>` (dry run first, then `--apply`; it refuses a database that is not local unless `--allow-remote` is passed, which is only for the approved production import). Domains are normalised (scheme, path, `www.` and case are stripped) and a repeated domain counts as skipped. The file is `[{ "name": "...", "domain": "...", "category": "channel", "region": "india" }]`. It creates each partner as `onboarding`, writes a `partner.created` audit entry and enqueues `partner.upsert`. Confirm each company appears in HubSpot with `cleanstart_partner = true`. Inviting the partners' admins is the Add partner flow, not this script.
4. Approve one test registration for a partner contact, watch it appear in the Partner deals pipeline, move its stage in HubSpot, and confirm the partner sees the change within 5 minutes. Then delete that deal.
5. Check the health card shows 0 failed and a recent poll time before inviting partners.

## Webhook subscription: not needed, do not subscribe

Decided by the product owner on 2026-11-16: the portal polls HubSpot every 5 minutes and does not subscribe to webhooks (HUBSPOT-CAPABILITIES.md row b). The receiver route `/api/hubspot/webhook` stays built and deployed, and stays unsubscribed. Do not add a webhook subscription to the private app, do not add the Cloudflare skip rule for the path, and do not rely on `HUBSPOT_WEBHOOK_SECRET` signing anything.

`HUBSPOT_WEBHOOK_SECRET` is not required in production (`src/env.ts`) and `deploy-portal.yml` renders it only when the GitHub secret `PORTAL_HUBSPOT_WEBHOOK_SECRET` is set. While it is unset, `/api/hubspot/webhook` answers 404 with an empty body and does nothing else. If webhooks are ever wanted, the old steps are in the git history of this file (commit before 2026-11-16), and which secret signs a private app's webhooks and the header names are still UNVERIFIED.

## Smoke script (development account only)

`scripts/hubspot-smoke.ts` runs the real client end to end: it creates a test partner company and a deal with `portal_registration_id = smoke-<timestamp>`, associates them, moves the deal to Discovery, runs `pollDeals` against the local database and archives what it created. It refuses to run unless `HUBSPOT_PORTAL_ID` equals `HUBSPOT_DEV_PORTAL_ID` and `DATABASE_URL` is a local database. It needs a person; it is never run unattended.

```bash
cd apps/portal && pnpm exec tsx --env-file=.env scripts/hubspot-smoke.ts
```
