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
