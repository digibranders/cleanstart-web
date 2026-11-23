import { describe, expect, it } from 'vitest';
import { conflictingDeals, lookupCustomer } from './lookup';
import { DEMO_PIPELINE_ID, buildDemoHubspot, demoHubspot } from './demo';

describe('buildDemoHubspot', () => {
  it('has a company for every seeded partner, under the HubSpot id the seed gives it', async () => {
    const hs = buildDemoHubspot();
    expect(hs.companies.get('91822044')).toMatchObject({ name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    expect(await hs.findCompany({ domain: 'saffronsecure.com', name: 'x' })).toMatchObject({ id: '91820117' });
  });

  it('has the accepted and won deals of the mock as deals in the demo pipeline, held by their partner', async () => {
    const hs = buildDemoHubspot();
    const deal = hs.deals.get('47866');
    expect(deal?.properties).toMatchObject({ pipeline: DEMO_PIPELINE_ID, partner_company_id: '91822044', partner_name: 'Kestrel Systems' });
    expect(deal?.stageId).toBe(hs.stageIds['Technical evaluation']);
    expect(await hs.readDeals(['47866', '48201', '48213'])).toHaveLength(3);
  });

  it('finds customers by name for the registration form', async () => {
    expect(await lookupCustomer(buildDemoHubspot(), 'tejas')).toEqual(expect.arrayContaining([{ name: 'Tejas Health Network', domain: 'tejashealth.in' }]));
  });

  it('gives the staff queue one conflict to show: another partner holds an open deal on Meridian Insurance', async () => {
    const hs = buildDemoHubspot();
    const customer = await hs.findCompany({ domain: 'meridianinsure.in', name: 'Meridian Insurance' });
    expect(customer).not.toBeNull();
    const open = await conflictingDeals(hs, { customerCompanyId: customer?.id ?? '', partnerCompanyId: '91820117', pipelineId: DEMO_PIPELINE_ID });
    expect(open.map((d) => d.properties.partner_name)).toEqual(['Vyom Digital']);
  });

  it('does not count a closed deal or the partner own deal as a conflict', async () => {
    const hs = buildDemoHubspot();
    const customer = await hs.findCompany({ domain: 'vardhancapital.in', name: 'Vardhan Capital' });
    expect(await conflictingDeals(hs, { customerCompanyId: customer?.id ?? '', partnerCompanyId: '91822044', pipelineId: DEMO_PIPELINE_ID })).toEqual([]);
  });

  it('is the same data every time, and one shared instance per process', () => {
    expect([...buildDemoHubspot().deals.keys()]).toEqual([...buildDemoHubspot().deals.keys()]);
    expect(demoHubspot()).toBe(demoHubspot());
  });
});
