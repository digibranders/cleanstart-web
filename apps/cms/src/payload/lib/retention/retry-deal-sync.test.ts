import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createHubspotDeal = vi.fn();
vi.mock('../deal-registrations/hubspot-deal', () => ({
  createHubspotDeal: (...a: unknown[]) => createHubspotDeal(...a),
}));

import { retryDealSync } from './retry-deal-sync';

const row = {
  id: 7,
  partnerName: 'Acme',
  partnerRepFirstName: 'Jane', partnerRepLastName: 'Doe', partnerRepEmail: 'jane@acme.com',
  prospectFirstName: 'Sam', prospectLastName: 'Lee', prospectEmail: 'sam@prospect.com',
  dealDetails: 'K8s',
  hubspotSync: { status: 'failed', attempts: 1 },
};

const makePayload = () => ({
  find: vi.fn().mockResolvedValue({ docs: [row] }),
  update: vi.fn().mockResolvedValue({}),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
});

beforeEach(() => { createHubspotDeal.mockResolvedValue({ status: 'synced', dealId: '901' }); });
afterEach(() => { vi.clearAllMocks(); });

describe('retryDealSync', () => {
  it('retries failed rows and updates them to synced', async () => {
    const payload = makePayload();
    const result = await retryDealSync(payload as never, { pipeline: 'default', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(1);
    expect(result.synced).toBe(1);
    const upd = payload.update.mock.calls[0]?.[0];
    expect(upd.collection).toBe('deal-registrations');
    expect(upd.id).toBe(7);
    expect(upd.data.hubspotSync.status).toBe('synced');
    expect(upd.data.hubspotSync.attempts).toBe(2);
  });

  it('skips rows that already hit maxAttempts', async () => {
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [{ ...row, hubspotSync: { status: 'failed', attempts: 5 } }] });
    const result = await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(0);
    expect(createHubspotDeal).not.toHaveBeenCalled();
  });
});
