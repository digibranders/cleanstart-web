import { describe, expect, it } from 'vitest';
import { FakeHubspot } from '@/server/hubspot/fake';
import { hubspotConflictHints } from './conflict-hints';

const input = (over: Partial<{ registrationId: string; customerName: string; customerDomain: string | null; partnerHubspotCompanyId: string | null }> = {}) => ({
  registrationId: 'r1', customerName: 'Gulfway Freight', customerDomain: 'gulfwayfreight.ae', partnerHubspotCompanyId: '1', ...over,
});

const seed = async (hs: FakeHubspot) => {
  const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Gulfway Freight', domain: 'gulfwayfreight.ae', properties: {} });
  const mine = await hs.createDeal({ pipeline: 'pipe-1', dealstage: hs.stageIds.Accepted, partner_company_id: '1', partner_name: 'Kestrel Systems' });
  const theirs = await hs.createDeal({ pipeline: 'pipe-1', dealstage: hs.stageIds.Discovery, partner_company_id: '2', partner_name: 'Arbor Cyber' });
  await hs.associateDealWithCompany(mine.id, customer.id, 'customer');
  await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
  return { customer, mine, theirs };
};

describe('hubspotConflictHints', () => {
  it('names another partner that holds an open deal for the customer', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    expect(await hubspotConflictHints(hs, 'pipe-1', [input()])).toEqual({ r1: { registrationId: 'r1', holder: 'Arbor Cyber', openDeals: 1 } });
  });

  it('gives no hint when only the partner\'s own deal exists, when the customer is unknown, or when HubSpot is off', async () => {
    const hs = new FakeHubspot();
    const { theirs } = await seed(hs);
    hs.deals.delete(theirs.id);
    expect(await hubspotConflictHints(hs, 'pipe-1', [input()])).toEqual({});
    expect(await hubspotConflictHints(hs, 'pipe-1', [input({ customerName: 'Nobody Ltd', customerDomain: null })])).toEqual({});
    expect(await hubspotConflictHints(null, 'pipe-1', [input()])).toEqual({});
    expect(await hubspotConflictHints(hs, null, [input()])).toEqual({});
  });

  it('keeps the hints it already found when HubSpot fails part way, and never throws', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    const original = hs.findCompany.bind(hs);
    let calls = 0;
    hs.findCompany = async (args) => {
      calls += 1;
      if (calls === 2) throw new Error('429');
      return original(args);
    };
    const hints = await hubspotConflictHints(hs, 'pipe-1', [input(), input({ registrationId: 'r2' })]);
    expect(Object.keys(hints)).toEqual(['r1']);
  });
});
