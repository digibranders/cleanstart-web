import { describe, expect, it } from 'vitest';
import { FakeHubspot } from '@/server/hubspot/fake';
import { crmSuggestions } from './customer-lookup';

describe('crmSuggestions', () => {
  it('returns name and website only', async () => {
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Holdings', domain: 'vardhancapital.in', properties: { secret: 'x' } });
    expect(await crmSuggestions(hs, 'vardhan')).toEqual([{ name: 'Vardhan Capital Holdings', website: 'vardhancapital.in' }]);
  });
  it('returns nothing for a short query, when HubSpot is not configured and when it fails', async () => {
    const hs = new FakeHubspot();
    expect(await crmSuggestions(hs, 'va')).toEqual([]);
    expect(await crmSuggestions(null, 'vardhan')).toEqual([]);
    const broken = new FakeHubspot();
    broken.searchCompanies = () => Promise.reject(new Error('503'));
    expect(await crmSuggestions(broken, 'vardhan')).toEqual([]);
  });
});
