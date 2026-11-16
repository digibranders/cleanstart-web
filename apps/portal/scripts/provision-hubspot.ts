import { Client } from '@hubspot/api-client';
import {
  COMPANY_PROPERTIES,
  DEAL_PROPERTIES,
  EXTERNAL_DEAL_PROPERTIES,
  GROUP,
  PIPELINE_SPEC,
  type PropertySpec,
} from '../src/server/hubspot/schema-spec';

const apply = process.argv.includes('--apply');
const token = process.env.HUBSPOT_PORTAL_TOKEN;
if (!token) throw new Error('HUBSPOT_PORTAL_TOKEN is required');
const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });

const call = async (method: 'GET' | 'POST', path: string, body?: unknown): ReturnType<Client['apiRequest']> =>
  client.apiRequest({ method, path, ...(body ? { body } : {}) });

const ensure = async (label: string, path: string, body: unknown): Promise<void> => {
  if (!apply) return void console.info(`[dry-run] would create ${label}`);
  const res = await call('POST', path, body);
  if (res.status === 409) return void console.info(`exists, skipped: ${label}`);
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} ${await res.text()}`);
  console.info(`created: ${label}`);
};

const ensureProperties = async (object: 'companies' | 'deals', props: PropertySpec[]): Promise<void> => {
  await ensure(`${object} group ${GROUP.name}`, `/crm/v3/properties/${object}/groups`, { ...GROUP, displayOrder: -1 });
  for (const p of props) {
    await ensure(`${object}.${p.name}`, `/crm/v3/properties/${object}`, {
      ...p,
      groupName: GROUP.name,
      ...(p.options ? { options: p.options.map((o, i) => ({ ...o, displayOrder: i })) } : {}),
    });
  }
};

const main = async (): Promise<void> => {
  console.info(apply ? 'APPLY mode' : 'DRY RUN (pass --apply to write)');
  if (!apply) {
    console.warn(
      `WARNING: deal properties ${EXTERNAL_DEAL_PROPERTIES.join(', ')} are written by dealProperties but not created by this script. ` +
        'They must already exist in the HubSpot account (see HUBSPOT-PROVISIONING.md) before registration.create works.',
    );
  }
  await ensureProperties('companies', COMPANY_PROPERTIES);
  await ensureProperties('deals', DEAL_PROPERTIES);

  const existing = (await (await call('GET', '/crm/v3/pipelines/deals')).json()) as {
    results: Array<{ id: string; label: string }>;
  };
  const found = existing.results.find((p) => p.label === PIPELINE_SPEC.label);
  if (found) console.info(`pipeline exists: set HUBSPOT_PARTNER_PIPELINE_ID=${found.id}`);
  else if (apply) {
    const res = await call('POST', '/crm/v3/pipelines/deals', PIPELINE_SPEC);
    if (!res.ok) throw new Error(`pipeline: HTTP ${res.status} ${await res.text()}`);
    const created = (await res.json()) as { id: string };
    console.info(`created pipeline: set HUBSPOT_PARTNER_PIPELINE_ID=${created.id}`);
  } else console.info(`[dry-run] would create pipeline ${PIPELINE_SPEC.label}`);

  // Association labels (partner and customer on the deal to company link) need a plan that
  // supports custom labels; HUBSPOT-CAPABILITIES.md records the answer (row a: allowed in the HubSpot UI, not yet tried through a private app token). Without labels the code falls
  // back to the default association plus the partner_company_id deal property.
  for (const name of ['Partner', 'Customer']) {
    await ensure(`deal to company label ${name}`, '/crm/v4/associations/deals/companies/labels', {
      label: name,
      name: name.toLowerCase(),
    });
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
