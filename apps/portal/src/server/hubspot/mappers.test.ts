// mappers.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from './fake';
import { decideInbound, dealProperties, isoDate, nextDelayMs, STAGE_TO_STATUS } from './mappers';

const stageIds = new FakeHubspot().stageIds;

describe('dealProperties', () => {
  it('builds the deal body from a registration', () => {
    const props = dealProperties(
      { id: 'r1', customerName: 'Vardhan Capital', product: 'Clean Libraries', region: 'India', protectionEnd: '2027-02-02' },
      { name: 'Kestrel Systems', hubspotCompanyId: '55' },
      stageIds,
      'pipe-1',
    );
    expect(props).toEqual({
      dealname: 'Vardhan Capital | Clean Libraries | Kestrel Systems',
      pipeline: 'pipe-1',
      dealstage: stageIds.Accepted,
      portal_registration_id: 'r1',
      protection_end_date: '2027-02-02',
      partner_product: 'clean_libraries',
      partner_region: 'india',
      partner_name: 'Kestrel Systems',
      partner_company_id: '55',
    });
  });
});

describe('isoDate', () => {
  it('reads a date or an epoch at midnight UTC', () => {
    expect(isoDate('2027-02-02')).toBe('2027-02-02');
    expect(isoDate(String(Date.UTC(2027, 1, 2)))).toBe('2027-02-02');
    expect(isoDate(null)).toBeNull();
    expect(isoDate('')).toBeNull();
  });
});

describe('decideInbound', () => {
  const reg = { status: 'accepted' as const, hubspotStageId: stageIds.Accepted, protectionEnd: '2027-02-02' };
  const idToLabel = Object.fromEntries(Object.entries(stageIds).map(([l, id]) => [id, l]));

  it('returns null when nothing changed', () => {
    const deal = { id: '1', stageId: stageIds.Accepted, modifiedAt: 1, properties: { protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toBeNull();
  });

  it('maps a stage move to a timeline event and keeps the status accepted', () => {
    const deal = { id: '1', stageId: stageIds['Technical evaluation'], modifiedAt: 1, properties: { protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({
      status: 'accepted', stage: 'Technical evaluation', closedOn: null, changed: 'stage',
      eventText: 'Stage moved to Technical evaluation',
    });
  });

  it('closes the registration on Closed won and stamps the close date from HubSpot', () => {
    const deal = { id: '1', stageId: stageIds['Closed won'], modifiedAt: 1, properties: { closedate: '2026-12-01', protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({ status: 'won', closedOn: '2026-12-01' });
  });

  it('ignores a stage that is not one of ours', () => {
    const deal = { id: '1', stageId: 'unknown', modifiedAt: 1, properties: {} };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toBeNull();
  });

  it('picks up a protection end changed in HubSpot', () => {
    const deal = { id: '1', stageId: stageIds.Accepted, modifiedAt: 1, properties: { protection_end_date: '2027-03-01' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({ protectionEnd: '2027-03-01', changed: 'protection_end', eventText: 'Protection end changed to 1 Mar 2027' });
  });
});

describe('nextDelayMs', () => {
  it('backs off 1 minute, 5 minutes, 30 minutes, 2 hours, 12 hours and then stops', () => {
    expect([1, 2, 3, 4, 5].map(nextDelayMs)).toEqual([60_000, 300_000, 1_800_000, 7_200_000, 43_200_000]);
    expect(nextDelayMs(6)).toBeNull();
  });
});

describe('STAGE_TO_STATUS', () => {
  it('covers every stage label', () => {
    expect(Object.keys(STAGE_TO_STATUS)).toHaveLength(7);
  });
});
