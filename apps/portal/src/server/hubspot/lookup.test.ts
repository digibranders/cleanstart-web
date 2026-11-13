// lookup.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHubspot, readHubspotConfig } from './client';
import { FakeHubspot } from './fake';
import { conflictingDeals, hubspotForRequest, lookupCustomer } from './lookup';

vi.mock('./client', () => ({ readHubspotConfig: vi.fn(), createHubspot: vi.fn() }));

beforeEach(() => {
  vi.mocked(readHubspotConfig).mockReset();
  vi.mocked(createHubspot).mockReset();
});

describe('hubspotForRequest', () => {
  it('is null while HubSpot is not configured, and builds no client', () => {
    vi.mocked(readHubspotConfig).mockReturnValue(null);
    expect(hubspotForRequest()).toBeNull();
    expect(createHubspot).not.toHaveBeenCalled();
  });

  it('returns the client and the pipeline id when HubSpot is configured', () => {
    const hs = new FakeHubspot();
    vi.mocked(readHubspotConfig).mockReturnValue({ token: 'token', pipelineId: 'pipe-1' });
    vi.mocked(createHubspot).mockReturnValue(hs);
    expect(hubspotForRequest()).toEqual({ hs, pipelineId: 'pipe-1' });
  });
});

describe('lookupCustomer', () => {
  it('returns name and domain only', async () => {
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: 'vardhancapital.in', properties: { secret: 'x' } });
    expect(await lookupCustomer(hs, 'vardhan')).toEqual([{ name: 'Vardhan Capital', domain: 'vardhancapital.in' }]);
  });

  it('returns nothing for a query shorter than 3 characters', async () => {
    expect(await lookupCustomer(new FakeHubspot(), 'va')).toEqual([]);
  });
});

describe('conflictingDeals', () => {
  it('returns open deals on the customer that belong to another partner', async () => {
    const hs = new FakeHubspot();
    const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Gulfway Freight', domain: 'gulfwayfreight.ae', properties: {} });
    const mine = await hs.createDeal({ dealstage: hs.stageIds.Accepted, partner_company_id: '1' });
    const theirs = await hs.createDeal({ dealstage: hs.stageIds.Discovery, partner_company_id: '2' });
    await hs.associateDealWithCompany(mine.id, customer.id, 'customer');
    await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
    const found = await conflictingDeals(hs, { customerCompanyId: customer.id, partnerCompanyId: '1', pipelineId: 'p' });
    expect(found.map((d) => d.id)).toEqual([theirs.id]);
  });
});
