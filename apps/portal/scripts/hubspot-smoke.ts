import { Client } from '@hubspot/api-client';
import { db } from '../src/db/client';
import { systemClock } from '../src/lib/clock';
import { createHubspot, readHubspotConfig } from '../src/server/hubspot/client';
import { dealProperties } from '../src/server/hubspot/mappers';
import { pollDeals } from '../src/server/hubspot/poll';

/**
 * Manual end to end check of the real HubSpot client against the DEVELOPMENT portal. Never run unattended and never
 * against production: it refuses unless HUBSPOT_PORTAL_ID equals HUBSPOT_DEV_PORTAL_ID. It creates a test partner
 * company and a test deal, moves the deal to Discovery, runs one poll against the local database, then archives what it created.
 */
const main = async (): Promise<void> => {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const devPortalId = process.env.HUBSPOT_DEV_PORTAL_ID;
  if (!portalId || !devPortalId || portalId !== devPortalId) {
    throw new Error('Refusing to run: HUBSPOT_PORTAL_ID must be set and equal HUBSPOT_DEV_PORTAL_ID (the development portal).');
  }
  const config = readHubspotConfig();
  if (!config) throw new Error('HUBSPOT_PORTAL_TOKEN and HUBSPOT_PARTNER_PIPELINE_ID are required');

  const hs = createHubspot();
  const raw = new Client({ accessToken: config.token });
  const stamp = Date.now();
  const created: Array<{ path: string; id: string }> = [];

  try {
    const stageIds = await hs.getStageIds(config.pipelineId);
    const company = await hs.createOrUpdateCompany({
      existingId: null,
      name: `Smoke partner ${stamp}`,
      domain: null,
      properties: { cleanstart_partner: 'true', partner_portal_id: `smoke-partner-${stamp}` },
    });
    created.push({ path: '/crm/v3/objects/companies', id: company.id });
    console.info(`company ${company.id}`);

    const deal = await hs.createDeal(
      dealProperties(
        { id: `smoke-${stamp}`, customerName: `Smoke customer ${stamp}`, product: 'Clean Libraries', region: 'India', protectionEnd: '2099-01-01' },
        { name: `Smoke partner ${stamp}`, hubspotCompanyId: company.id },
        stageIds,
        config.pipelineId,
      ),
    );
    created.push({ path: '/crm/v3/objects/deals', id: deal.id });
    console.info(`deal ${deal.id}`);

    await hs.associateDealWithCompany(deal.id, company.id, 'partner');
    await hs.updateDeal(deal.id, { dealstage: stageIds.Discovery });
    console.info('deal moved to Discovery');

    // The smoke deal has no portal registration, so a healthy poll reports it as unknown.
    console.info('poll result', await pollDeals({ db, hs, pipelineId: config.pipelineId, clock: systemClock }));
  } finally {
    for (const { path, id } of created.reverse()) {
      const res = await raw.apiRequest({ method: 'DELETE', path: `${path}/${id}` });
      console.info(`archive ${path}/${id}: HTTP ${res.status}`);
    }
    await db.$client.end();
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
