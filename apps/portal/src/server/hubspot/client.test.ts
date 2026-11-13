// client.test.ts
import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/errors';
import { createHubspot, readHubspotConfig, RealHubspot } from './client';

const mockEnv = vi.hoisted(() => ({
  HUBSPOT_PORTAL_TOKEN: undefined as string | undefined,
  HUBSPOT_PARTNER_PIPELINE_ID: undefined as string | undefined,
  HUBSPOT_USE_ASSOCIATION_LABELS: false,
}));
vi.mock('@/env', () => ({ env: mockEnv }));

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('RealHubspot', () => {
  it('searches deals by pipeline and last modified, oldest first', async () => {
    const apiRequest = vi.fn().mockResolvedValue(json({ results: [], paging: undefined }));
    const hs = new RealHubspot(apiRequest);
    await hs.searchDealsModifiedSince('pipe-1', 5000, null);
    const call = apiRequest.mock.calls[0]![0];
    expect(call.path).toBe('/crm/v3/objects/deals/search');
    expect(call.body.filterGroups[0].filters).toEqual([
      { propertyName: 'pipeline', operator: 'EQ', value: 'pipe-1' },
      { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: '5000' },
    ]);
    expect(call.body.sorts).toEqual([{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }]);
  });

  it('returns the next cursor when HubSpot pages', async () => {
    const apiRequest = vi.fn().mockResolvedValue(
      json({ results: [{ id: '9', properties: { dealstage: 's1', hs_lastmodifieddate: '2026-11-06T10:00:00Z' } }], paging: { next: { after: '100' } } }),
    );
    const page = await new RealHubspot(apiRequest).searchDealsModifiedSince('p', 0, null);
    expect(page.next).toBe('100');
    expect(page.deals[0]).toMatchObject({ id: '9', stageId: 's1', modifiedAt: Date.parse('2026-11-06T10:00:00Z') });
  });

  it('throws HubspotError with the status on a failed call', async () => {
    const apiRequest = vi.fn().mockResolvedValue(json({ message: 'bad' }, 400));
    await expect(new RealHubspot(apiRequest).createDeal({ dealname: 'x' })).rejects.toMatchObject({ name: 'HubspotError', status: 400 });
  });
});

describe('configuration', () => {
  it('throws a typed IntegrationError when the token is unset', () => {
    mockEnv.HUBSPOT_PORTAL_TOKEN = undefined;
    expect(() => createHubspot()).toThrow(IntegrationError);
    expect(() => createHubspot()).toThrow('HUBSPOT_PORTAL_TOKEN is not set');
  });

  it('reports no configuration until both the token and the pipeline id are set', () => {
    mockEnv.HUBSPOT_PORTAL_TOKEN = 'token';
    mockEnv.HUBSPOT_PARTNER_PIPELINE_ID = undefined;
    expect(readHubspotConfig()).toBeNull();
    mockEnv.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
    expect(readHubspotConfig()).toEqual({ token: 'token', pipelineId: 'pipe-1' });
  });
});