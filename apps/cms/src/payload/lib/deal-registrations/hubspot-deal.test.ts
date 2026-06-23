import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn();
vi.mock('@hubspot/api-client', () => ({
  Client: vi.fn().mockImplementation(() => ({ apiRequest })),
}));

const resolveHubspotCredentials = vi.fn();
vi.mock('../integrations/credentials', () => ({
  resolveHubspotCredentials: (...a: unknown[]) => resolveHubspotCredentials(...a),
}));

import { createHubspotDeal } from './hubspot-deal';
import type { DealRegistrationSubmission } from './schema';

const sub: DealRegistrationSubmission = {
  partnerName: 'Acme',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s',
};

const okJson = (body: unknown) => ({ json: async () => body });

const makePayload = (rowFound = true) =>
  ({
    find: vi.fn().mockResolvedValue({
      docs: rowFound ? [{ id: 1, kind: 'hubspotCrm', enabled: true, source: 'db', hubspotConfig: {} }] : [],
    }),
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  }) as never;

beforeEach(() => {
  resolveHubspotCredentials.mockReturnValue({ accessToken: 'tok', writeMode: 'contactOnly', fieldMapping: {}, defaultProperties: {} });
  apiRequest
    .mockResolvedValueOnce(okJson({ results: [{ id: '201', properties: { email: 'sam@prospect.com' } }, { id: '202', properties: { email: 'jane@acme.com' } }] }))
    .mockResolvedValueOnce(okJson({ id: '900' }))
    .mockResolvedValue(okJson({}));
});
afterEach(() => { vi.clearAllMocks(); });

describe('createHubspotDeal', () => {
  it('upserts contacts, creates a deal, associates, returns synced + dealId', async () => {
    const res = await createHubspotDeal(makePayload(), sub, { pipeline: 'default', stage: 's' });
    expect(res).toEqual({ status: 'synced', dealId: '900' });
    const first = apiRequest.mock.calls[0]?.[0];
    expect(first.method).toBe('POST');
    expect(first.path).toBe('/crm/v3/objects/contacts/batch/upsert');
    expect(first.body.inputs).toHaveLength(2);
    expect(first.body.inputs[0].idProperty).toBe('email');
    expect(apiRequest.mock.calls.some((c) => c[0].path === '/crm/v3/objects/deals')).toBe(true);
  });

  it('skips when no active hubspotCrm integration row', async () => {
    const res = await createHubspotDeal(makePayload(false), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('skipped');
  });

  it('skips when credentials cannot be resolved (no token)', async () => {
    resolveHubspotCredentials.mockReturnValue(null);
    const res = await createHubspotDeal(makePayload(true), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('skipped');
  });

  it('returns failed with a message when the deal create throws', async () => {
    apiRequest.mockReset();
    apiRequest
      .mockResolvedValueOnce(okJson({ results: [{ id: '201' }, { id: '202' }] }))
      .mockRejectedValueOnce(new Error('boom'));
    const res = await createHubspotDeal(makePayload(), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('failed');
    if (res.status === 'failed') expect(res.error).toContain('boom');
  });
});
