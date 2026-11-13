// client.test.ts
import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/errors';
import { createHubspot, readHubspotConfig, RealHubspot } from './client';
import { STAGE_LABELS } from './types';

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

const noSleep = (_ms: number): Promise<void> => Promise.resolve();

describe('RealHubspot 429 handling', () => {
  const tooMany = (retryAfter?: string): Response =>
    new Response('slow down', { status: 429, headers: retryAfter ? { 'retry-after': retryAfter } : {} });

  it('retries a 429 after the Retry-After wait and returns the later success', async () => {
    const apiRequest = vi.fn().mockResolvedValueOnce(tooMany('2')).mockResolvedValueOnce(json({ id: '7', properties: {} }));
    const sleep = vi.fn(noSleep);
    const deal = await new RealHubspot(apiRequest, { sleep }).createDeal({ dealname: 'x' });
    expect(deal.id).toBe('7');
    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('caps the wait at 10 seconds', async () => {
    const apiRequest = vi.fn().mockResolvedValueOnce(tooMany('120')).mockResolvedValueOnce(json({ id: '7', properties: {} }));
    const sleep = vi.fn(noSleep);
    await new RealHubspot(apiRequest, { sleep }).createDeal({ dealname: 'x' });
    expect(sleep).toHaveBeenCalledWith(10_000);
  });

  it('waits a default interval when Retry-After is absent or not a number', async () => {
    const apiRequest = vi.fn().mockResolvedValueOnce(tooMany()).mockResolvedValueOnce(tooMany('soon')).mockResolvedValueOnce(json({ id: '7', properties: {} }));
    const sleep = vi.fn(noSleep);
    await new RealHubspot(apiRequest, { sleep }).createDeal({ dealname: 'x' });
    expect(sleep).toHaveBeenCalledTimes(2);
    for (const [ms] of sleep.mock.calls) expect(ms).toBeGreaterThan(0);
  });

  it('gives up after three tries and throws HubspotError 429', async () => {
    const apiRequest = vi.fn().mockImplementation(async () => tooMany('1'));
    const sleep = vi.fn(noSleep);
    await expect(new RealHubspot(apiRequest, { sleep }).createDeal({ dealname: 'x' })).rejects.toMatchObject({ name: 'HubspotError', status: 429 });
    expect(apiRequest).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('does not retry other failures', async () => {
    const apiRequest = vi.fn().mockResolvedValue(json({ message: 'nope' }, 500));
    const sleep = vi.fn(noSleep);
    await expect(new RealHubspot(apiRequest, { sleep }).createDeal({ dealname: 'x' })).rejects.toMatchObject({ status: 500 });
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe('RealHubspot timeout', () => {
  it('throws a HubspotError with status 0 and body timeout when the transport hangs', async () => {
    const apiRequest = vi.fn().mockReturnValue(new Promise(() => undefined));
    const hs = new RealHubspot(apiRequest, { timeoutMs: 20 });
    await expect(hs.createDeal({ dealname: 'x' })).rejects.toMatchObject({ name: 'HubspotError', status: 0, body: 'timeout' });
  });
});

describe('RealHubspot stage ids', () => {
  const pipeline = (id: string): Response =>
    json({ stages: STAGE_LABELS.map((label, i) => ({ id: `${id}-${i}`, label })) });

  it('caches per pipeline id', async () => {
    const apiRequest = vi.fn().mockImplementation(async ({ path }: { path: string }) => pipeline(path.split('/').pop()!));
    const hs = new RealHubspot(apiRequest);
    const a = await hs.getStageIds('A');
    const b = await hs.getStageIds('B');
    expect(a.Accepted).toBe('A-0');
    expect(b.Accepted).toBe('B-0');
    await hs.getStageIds('A');
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});

describe('RealHubspot.listOpenDealsForCompany', () => {
  const stages = STAGE_LABELS.map((label, i) => ({ id: `s${i}`, label }));
  const dealRow = (id: string, stage: string, pipeline = 'p1'): { id: string; properties: Record<string, string> } =>
    ({ id, properties: { dealstage: stage, pipeline } });

  const transport = (assoc: number[], rows: Array<{ id: string; properties: Record<string, string> }>) =>
    vi.fn().mockImplementation(async ({ path, body }: { path: string; body?: { inputs: Array<{ id: string }> } }) => {
      if (path.includes('/pipelines/deals/')) return json({ stages });
      if (path.includes('/associations/deals')) return json({ results: assoc.map((toObjectId) => ({ toObjectId })) });
      const wanted = new Set(body!.inputs.map((i) => i.id));
      return json({ results: rows.filter((r) => wanted.has(r.id)) });
    });

  it('excludes deals that are closed won, closed lost or registration expired, and deals in other pipelines', async () => {
    const rows = [
      dealRow('1', 's0'), dealRow('2', 's3'), dealRow('3', 's4'), dealRow('4', 's5'), dealRow('5', 's6'), dealRow('6', 's0', 'other'),
    ];
    const hs = new RealHubspot(transport([1, 2, 3, 4, 5, 6], rows));
    const open = await hs.listOpenDealsForCompany('c1', 'p1');
    expect(open.map((d) => d.id)).toEqual(['1', '2']);
  });

  it('reads the associated deals in batches of at most 100 ids', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => i + 1);
    const apiRequest = transport(ids, ids.map((id) => dealRow(String(id), 's0')));
    const open = await new RealHubspot(apiRequest).listOpenDealsForCompany('c1', 'p1');
    expect(open).toHaveLength(250);
    const batches = apiRequest.mock.calls.map(([o]) => o).filter((o: { path: string }) => o.path.endsWith('/batch/read'));
    expect(batches.map((o: { body: { inputs: unknown[] } }) => o.body.inputs.length)).toEqual([100, 100, 50]);
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