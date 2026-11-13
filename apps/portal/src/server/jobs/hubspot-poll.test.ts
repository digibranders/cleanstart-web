// src/server/jobs/hubspot-poll.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb, testDb } from '@/db/test-helpers';
import { hubspotSyncState } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { runHubspotPoll } from './hubspot-poll';

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

describe('runHubspotPoll', () => {
  it('does nothing while HubSpot is not configured', async () => {
    await runHubspotPoll();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });

  it('polls and stores the cursor when HubSpot is configured', async () => {
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(new FakeHubspot());
    await runHubspotPoll();
    expect((await db.select().from(hubspotSyncState))[0]!.key).toBe('deals_cursor');
  });
});
