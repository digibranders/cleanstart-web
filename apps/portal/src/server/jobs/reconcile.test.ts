// src/server/jobs/reconcile.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeSyncedDeal, resetDb, testDb } from '@/db/test-helpers';
import { registrations } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { runReconcile } from './reconcile';

const mocks = vi.hoisted(() => ({
  config: null as { token: string; pipelineId: string } | null,
  createHubspot: vi.fn(),
}));
vi.mock('@/server/hubspot/client', () => ({
  readHubspotConfig: () => mocks.config,
  createHubspot: mocks.createHubspot,
}));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mocks.config = null;
  mocks.createHubspot.mockReset();
});

describe('runReconcile', () => {
  it('does nothing while HubSpot is not configured', async () => {
    await runReconcile();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
  });

  it('flags a deal that is gone from HubSpot when configured', async () => {
    const hs = new FakeHubspot();
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(hs);
    const partner = await makePartner(db, {});
    const deal = await makeSyncedDeal(db, hs, { partnerId: partner.id, customerName: 'Gone Co' });
    hs.deals.delete(deal.dealId);
    await runReconcile();
    expect((await db.select().from(registrations).where(eq(registrations.id, deal.id)))[0]!.hubspotMissing).toBe(true);
  });
});
