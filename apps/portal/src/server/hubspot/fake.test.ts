// fake.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from './fake';
import { HubspotError } from './types';

describe('FakeHubspot', () => {
  it('updateDeal on a missing deal throws HubspotError 404 like the real client', async () => {
    await expect(new FakeHubspot().updateDeal('nope', { dealname: 'x' })).rejects.toMatchObject({ name: 'HubspotError', status: 404 });
  });

  it('failNext fails the next call of every method once, then recovers', async () => {
    const calls: Array<[string, (hs: FakeHubspot) => Promise<unknown>]> = [
      ['getStageIds', (hs) => hs.getStageIds()],
      ['findCompany', (hs) => hs.findCompany({ domain: null, name: 'x' })],
      ['searchCompanies', (hs) => hs.searchCompanies('xyz')],
      ['createOrUpdateCompany', (hs) => hs.createOrUpdateCompany({ existingId: null, name: 'x', domain: null, properties: {} })],
      ['upsertContact', (hs) => hs.upsertContact({ email: 'a@b.co', firstName: 'a', lastName: 'b' })],
      ['associateContactWithCompany', (hs) => hs.associateContactWithCompany('1', '2')],
      ['findDealByRegistrationId', (hs) => hs.findDealByRegistrationId('r')],
      ['createDeal', (hs) => hs.createDeal({})],
      ['updateDeal', (hs) => hs.updateDeal('1', {})],
      ['associateDealWithCompany', (hs) => hs.associateDealWithCompany('1', '2', 'partner')],
      ['associateDealWithContact', (hs) => hs.associateDealWithContact('1', '2')],
      ['searchDealsModifiedSince', (hs) => hs.searchDealsModifiedSince('p', 0, null)],
      ['readDeals', (hs) => hs.readDeals(['1'])],
      ['listOpenDealsForCompany', (hs) => hs.listOpenDealsForCompany('1', 'p')],
    ];
    for (const [name, run] of calls) {
      const hs = new FakeHubspot();
      const boom = new HubspotError(503, '', `boom ${name}`);
      hs.failNext = boom;
      await expect(run(hs), name).rejects.toBe(boom);
      expect(hs.failNext, name).toBeNull();
    }
  });

  it('listOpenDealsForCompany keeps only open deals of the pipeline', async () => {
    const hs = new FakeHubspot();
    const open = await hs.createDeal({ dealstage: hs.stageIds.Discovery, pipeline: 'p' });
    const lost = await hs.createDeal({ dealstage: hs.stageIds['Closed lost'], pipeline: 'p' });
    for (const d of [open, lost]) await hs.associateDealWithCompany(d.id, 'c', 'customer');
    expect((await hs.listOpenDealsForCompany('c', 'p')).map((d) => d.id)).toEqual([open.id]);
    expect(await hs.listOpenDealsForCompany('c', 'other')).toEqual([]);
  });
});
