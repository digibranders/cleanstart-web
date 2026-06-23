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
  turnstilePassed: true,
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
  it('retries failed rows, updates them to synced, and leaves attempts unchanged on success', async () => {
    const payload = makePayload();
    const result = await retryDealSync(payload as never, { pipeline: 'default', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(1);
    expect(result.synced).toBe(1);
    const upd = payload.update.mock.calls[0]?.[0];
    expect(upd.collection).toBe('deal-registrations');
    expect(upd.id).toBe(7);
    expect(upd.data.hubspotSync.status).toBe('synced');
    expect(upd.data.hubspotSync.attempts).toBe(1);
  });

  it('increments attempts when the result is failed', async () => {
    createHubspotDeal.mockResolvedValue({ status: 'failed', error: 'boom' });
    const payload = makePayload();
    const result = await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    expect(result.failed).toBe(1);
    const upd = payload.update.mock.calls[0]?.[0];
    expect(upd.data.hubspotSync.status).toBe('failed');
    expect(upd.data.hubspotSync.error).toBe('boom');
    expect(upd.data.hubspotSync.attempts).toBe(2);
  });

  it('does not increment attempts when the result is skipped (unprovisioned)', async () => {
    createHubspotDeal.mockResolvedValue({ status: 'skipped', reason: 'no-active-hubspot-integration' });
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [{ ...row, hubspotSync: { status: 'skipped', attempts: 3 } }] });
    const result = await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(1);
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
    const upd = payload.update.mock.calls[0]?.[0];
    expect(upd.data.hubspotSync.status).toBe('skipped');
    expect(upd.data.hubspotSync.attempts).toBe(3);
  });

  it('skips rows that already hit maxAttempts', async () => {
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [{ ...row, hubspotSync: { status: 'failed', attempts: 5 } }] });
    const result = await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(0);
    expect(createHubspotDeal).not.toHaveBeenCalled();
  });

  it('queries only legit (turnstile-passed) rows with failed or skipped sync', async () => {
    const payload = makePayload();
    await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    const where = payload.find.mock.calls[0]?.[0]?.where;
    expect(where.and).toEqual([
      { turnstilePassed: { equals: true } },
      { 'hubspotSync.status': { in: ['failed', 'skipped'] } },
    ]);
  });
});
