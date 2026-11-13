# HubSpot provisioning

`apps/portal/scripts/provision-hubspot.ts` creates the partner portal properties, the "Partner deals" pipeline and the deal to company labels. It is idempotent: an object that already exists is skipped.

```bash
HUBSPOT_PORTAL_TOKEN=... pnpm --filter @cleanstart/portal exec tsx scripts/provision-hubspot.ts            # dry run
HUBSPOT_PORTAL_TOKEN=... pnpm --filter @cleanstart/portal exec tsx scripts/provision-hubspot.ts --apply    # write
```

Flags:

- `--apply`: write to HubSpot. Without it the script only prints what it would create.
- `--no-unique`: create `portal_registration_id` and `partner_portal_id` as plain text properties. Use it when the account refuses unique-value properties (HUBSPOT-CAPABILITIES.md row d). Every create still searches by `portal_registration_id` first, so a retried create cannot duplicate a deal.

## partner_name must already exist

`dealProperties` (`src/server/hubspot/mappers.ts`) writes the deal property `partner_name`, but this script does not create it. It is expected to exist in the HubSpot account already, created by the older CMS deal-property setup. A deal create that names a missing property is rejected by HubSpot, so confirm `partner_name` exists on deals before `registration.create` runs. The dry run prints this warning every time.

## Production provisioning runbook

Executed only in master Task 5.7, after explicit approval. W2-f links to this file from `docs/operations/PARTNER-PORTAL.md`.

1. Create the production private app with the scopes in the HubSpot plan, section 3. Add the token and the webhook client secret as GitHub secrets (`HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_WEBHOOK_SECRET`); the deploy workflow renders them into `/opt/cleanstart/portal.env` on the droplet (chmod 600). Never put them in `/opt/cleanstart/.env`, which is the CMS's file. All three HubSpot variables (`HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_PARTNER_PIPELINE_ID`, `HUBSPOT_WEBHOOK_SECRET`) are required in production and optional everywhere else: the app refuses to start in production without them.
2. Run `provision-hubspot.ts` in dry run and read it. Get the go-ahead. Run with `--apply`. Record the pipeline id in `HUBSPOT_PARTNER_PIPELINE_ID`.
3. Import the roughly 20 current partners with `import-partners.ts <partners.json>` (dry run first, then `--apply`; it refuses a database that is not local unless `--allow-remote` is passed, which is only for the approved production import). Domains are normalised (scheme, path, `www.` and case are stripped) and a repeated domain counts as skipped. The file is `[{ "name": "...", "domain": "...", "category": "channel", "region": "india" }]`. It creates each partner as `onboarding`, writes a `partner.created` audit entry and enqueues `partner.upsert`. Confirm each company appears in HubSpot with `cleanstart_partner = true`. Inviting the partners' admins is the Add partner flow, not this script.
4. Approve one test registration for a partner contact, watch it appear in the Partner deals pipeline, move its stage in HubSpot, and confirm the partner sees the change within 5 minutes. Then delete that deal.
5. Check the health card shows 0 failed and a recent poll time before inviting partners.

## Webhook subscription (optional, makes stage changes arrive in seconds)

The 5 minute poll is the safety net, so the portal works without the webhook. Set it up after step 2 of the runbook:

1. In the private app's Webhooks settings set the target URL to `https://partners.cleanstart.com/api/hubspot/webhook` and subscribe to `deal.propertyChange` for `dealstage` and for `protection_end_date`. Copy the app's client secret into the GitHub secret `HUBSPOT_WEBHOOK_SECRET`. The route answers 503 while that variable is unset, 401 for a bad signature and 413 for a body above 1 MB. Which secret signs a private app's webhooks, and the header names, are UNVERIFIED (HUBSPOT-CAPABILITIES.md): check them against HubSpot's current docs before relying on it.
2. While developing, expose the local server with a Cloudflare Tunnel (`cloudflared`), not ngrok, whose interstitial page breaks requests.
3. In production, add a Cloudflare WAF skip rule scoped to the path `/api/hubspot/webhook` so HubSpot's requests are not challenged. The signature check is the real gate.
4. `/api/hubspot/webhook` must be exempt from the review password gate (`PORTAL_REVIEW_PASSWORD` in `proxy.ts`, which exists only while the mock is hosted and goes away in M5.4), the same way `/api/health` is, otherwise HubSpot gets a 401 from the gate. That exemption is made in `proxy.ts` by the orchestrator, not by track H.
5. The deploy workflow that renders `/opt/cleanstart/portal.env` on the droplet (including `HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_PARTNER_PIPELINE_ID` and `HUBSPOT_WEBHOOK_SECRET`) is `.github/workflows/deploy-portal.yml`.

## Smoke script (development account only)

`scripts/hubspot-smoke.ts` runs the real client end to end: it creates a test partner company and a deal with `portal_registration_id = smoke-<timestamp>`, associates them, moves the deal to Discovery, runs `pollDeals` against the local database and archives what it created. It refuses to run unless `HUBSPOT_PORTAL_ID` equals `HUBSPOT_DEV_PORTAL_ID` and `DATABASE_URL` is a local database. It needs a person; it is never run unattended.

```bash
cd apps/portal && pnpm exec tsx --env-file=.env scripts/hubspot-smoke.ts
```
