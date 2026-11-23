import mockDeals from '@/db/mock-data/mock-deals.json';
import mockPartners from '@/db/mock-data/mock-partners.json';
import { FakeHubspot } from './fake';
import { STAGE_LABELS, type StageLabel } from './types';

/** The pipeline id the demo reports as configured (readHubspotConfig in demo mode). */
export const DEMO_PIPELINE_ID = 'demo-pipeline';

/** A deal a second partner holds on a customer that has a registration waiting, so the staff queue shows a conflict hint. */
const EXTRA_OPEN_DEAL = { id: '49001', customer: 'Meridian Insurance', domain: 'meridianinsure.in', partner: 'Vyom Digital', stage: 'Discovery' } as const;

const isStage = (stage: string): stage is StageLabel => (STAGE_LABELS as readonly string[]).includes(stage);
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * A FakeHubspot holding the mock's partners as HubSpot companies (under the ids the seed stores as hubspotCompanyId),
 * their customers, and the mock's accepted and won deals as deals in the demo pipeline. Deterministic: no clock, no random.
 */
export function buildDemoHubspot(): FakeHubspot {
  const hs = new FakeHubspot();
  const partnerByName = new Map<string, { id: string; name: string }>();
  for (const partner of mockPartners) {
    hs.companies.set(partner.hs, { id: partner.hs, name: partner.name, domain: partner.domain, properties: {} });
    partnerByName.set(partner.name, { id: partner.hs, name: partner.name });
  }

  const customerIds = new Map<string, string>();
  const customer = (name: string, domain: string | null): string => {
    const existing = customerIds.get(name);
    if (existing) return existing;
    const id = `c-${slug(name)}`;
    hs.companies.set(id, { id, name, domain, properties: {} });
    customerIds.set(name, id);
    return id;
  };

  let modifiedAt = 1_700_000_000_000;
  const addDeal = (input: { id: string; customer: string; domain: string | null; partner: string; stage: StageLabel }): void => {
    const partner = partnerByName.get(input.partner);
    if (!partner) throw new Error(`demo HubSpot: unknown partner "${input.partner}"`);
    const customerId = customer(input.customer, input.domain);
    modifiedAt += 1_000;
    hs.deals.set(input.id, {
      id: input.id,
      stageId: hs.stageIds[input.stage],
      modifiedAt,
      properties: {
        dealname: `${input.customer} (${partner.name})`,
        pipeline: DEMO_PIPELINE_ID,
        dealstage: hs.stageIds[input.stage],
        partner_company_id: partner.id,
        partner_name: partner.name,
      },
    });
    hs.associations.push({ from: input.id, to: partner.id, kind: 'deal-company:partner' }, { from: input.id, to: customerId, kind: 'deal-company:customer' });
  };

  for (const deal of mockDeals) {
    // Rejected, lost and expired registrations have no HubSpot deal in the mock; the lost one is the only closed stage left out here.
    if (!('crmRef' in deal) || !deal.crmRef || !isStage(deal.stage)) continue;
    addDeal({ id: deal.crmRef.replace(/^HS-/, ''), customer: deal.customer, domain: 'website' in deal && deal.website ? deal.website : null, partner: deal.partner, stage: deal.stage });
  }
  customer(EXTRA_OPEN_DEAL.customer, EXTRA_OPEN_DEAL.domain);
  addDeal({ ...EXTRA_OPEN_DEAL, domain: EXTRA_OPEN_DEAL.domain });
  return hs;
}

const globalForDemo = globalThis as unknown as { portalDemoHubspot?: FakeHubspot };

/** The one demo HubSpot of this process. In memory: a new serverless instance starts from the same seed. */
export const demoHubspot = (): FakeHubspot => {
  globalForDemo.portalDemoHubspot ??= buildDemoHubspot();
  return globalForDemo.portalDemoHubspot;
};
