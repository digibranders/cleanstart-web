/**
 * One-shot: provision the custom HubSpot Deal properties used by the
 * deal-registration pipeline. Idempotent — re-running skips properties that
 * already exist. REQUIRES `HUBSPOT_PRIVATE_APP_TOKEN` with
 * `crm.schemas.deals.write`.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/setup-hubspot-deal-properties.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/setup-hubspot-deal-properties.ts
 *
 * SAFETY: Do NOT run this script without explicit human approval. It mutates
 * the company's live HubSpot schema by creating a property group and custom
 * Deal properties under that group. Re-running is safe — existing properties
 * are skipped — but always dry-run first to confirm the target portal.
 */
import { Client } from '@hubspot/api-client';

const GROUP_NAME = 'deal_registration';
const GROUP_LABEL = 'Deal Registration';

interface PropertyDef {
  name: string;
  label: string;
  type: string;
  fieldType: string;
}

const PROPERTIES: PropertyDef[] = [
  { name: 'partner_name', label: 'Partner Name', type: 'string', fieldType: 'text' },
  { name: 'partner_rep_name', label: 'Partner Rep Name', type: 'string', fieldType: 'text' },
  { name: 'partner_rep_email', label: 'Partner Rep Email', type: 'string', fieldType: 'text' },
  { name: 'deal_details', label: 'Deal Details', type: 'string', fieldType: 'textarea' },
];

const dryRun = process.argv.includes('--dry-run');

const main = async (): Promise<void> => {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN is required');

  const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });

  if (dryRun) {
    console.info(`[dry-run] would ensure Deal property group: ${GROUP_NAME} ("${GROUP_LABEL}")`);
  } else {
    try {
      await client.apiRequest({
        method: 'POST',
        path: '/crm/v3/properties/deals/groups',
        body: { name: GROUP_NAME, label: GROUP_LABEL, displayOrder: -1 },
      });
      console.info(`Created group ${GROUP_NAME}`);
    } catch (err) {
      console.info(
        `Group ${GROUP_NAME} likely exists (skipped): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  for (const prop of PROPERTIES) {
    if (dryRun) {
      console.info(`[dry-run] would ensure Deal property: ${prop.name} (${prop.fieldType})`);
      continue;
    }
    try {
      await client.apiRequest({
        method: 'POST',
        path: '/crm/v3/properties/deals',
        body: { ...prop, groupName: GROUP_NAME },
      });
      console.info(`Created property ${prop.name}`);
    } catch (err) {
      console.info(
        `Property ${prop.name} likely exists (skipped): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.info('Done.');
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
