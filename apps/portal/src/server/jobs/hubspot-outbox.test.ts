// src/server/jobs/hubspot-outbox.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePartner, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox, partners } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { enqueue } from '@/server/hubspot/outbox';
import { runHubspotOutbox } from './hubspot-outbox';

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

describe('runHubspotOutbox', () => {
  it('leaves the outbox alone and builds no client while HubSpot is not configured', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await runHubspotOutbox();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
    expect((await db.select().from(hubspotOutbox))[0]).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('drains the outbox through the client when HubSpot is configured', async () => {
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(new FakeHubspot());
    const partner = await makePartner(db, {});
    await enqueue(db, { op: 'partner.upsert', subjectId: partner.id, version: '1' });
    // A new row is due from the database's now() (microseconds); the job compares it with the app clock (milliseconds,
    // taken a moment later), so a drain in the same millisecond finds it not yet due. Make it due, as it is a tick later.
    await db.update(hubspotOutbox).set({ nextAttemptAt: new Date(Date.now() - 60_000) });
    await runHubspotOutbox();
    expect((await db.select().from(hubspotOutbox))[0]!.status).toBe('done');
    expect((await db.select().from(partners))[0]!.hubspotCompanyId).toBeTruthy();
  });
});
