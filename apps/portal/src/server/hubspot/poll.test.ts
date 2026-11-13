// poll.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeSyncedDeal, resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { announceRegistrationChange } from '@/server/registrations/announce';
import { FakeHubspot } from './fake';
import { enqueue } from './outbox';
import { pollDeals, reconcileDeals } from './poll';

vi.mock('@/server/registrations/announce', () => ({ announceRegistrationChange: vi.fn(async () => undefined) }));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  vi.mocked(announceRegistrationChange).mockClear();
});
const PIPE = 'pipe-1';
const clock = fixedClock('2026-11-06T10:00:00Z');

const seed = async (hs: FakeHubspot, n = 1) => {
  const partner = await makePartner(db, {});
  const regs = [];
  for (let i = 0; i < n; i++) regs.push(await makeSyncedDeal(db, hs, { partnerId: partner.id, customerName: `Customer ${i}` }));
  return regs;
};

describe('pollDeals', () => {
  it('applies a stage move, writes a timeline event and stores the cursor', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(1);
    const reg = (await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!;
    expect(reg).toMatchObject({ stage: 'Technical evaluation', status: 'accepted' });
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id));
    expect(events.map((e) => [e.text, e.source])).toContainEqual(['Stage moved to Technical evaluation', 'crm']);
    expect((await db.select().from(hubspotSyncState))[0]!.key).toBe('deals_cursor');
  });

  it('writes the audit entry through recordAudit, as the HubSpot sync actor', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    const reg = (await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!;
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: 'registration.stage_changed', kind: 'deal_decisions', who: 'sync', source: 'crm',
      actorLabel: 'HubSpot sync', partnerId: reg.partnerId, subjectType: 'registration',
      note: 'Stage moved to Discovery',
    });
  });

  it('writes the protection end event name when only the end date changed', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-03-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id));
    expect(entries.map((e) => e.event)).toEqual(['registration.protection_end_changed']);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-03-01');
  });

  it('is idempotent: polling twice records one event and one audit entry', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id))).toHaveLength(1);
    expect(await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id))).toHaveLength(1);
  });

  it('walks every page when HubSpot returns more than one', async () => {
    const hs = new FakeHubspot();
    const regs = await seed(hs, 5);
    for (const r of regs) await hs.updateDeal(r.dealId, { dealstage: hs.stageIds.Discovery });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(5);
  });

  it('skips a deal the portal does not know and keeps going', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.createDeal({ dealstage: hs.stageIds.Accepted, portal_registration_id: 'ghost' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Closed won'], closedate: '2026-12-01' });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out).toMatchObject({ applied: 1, unknown: 1 });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({ status: 'won', closedOn: '2026-12-01' });
  });

  it('keeps a granted extension while its update_end write is queued, and still applies the stage', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await enqueue(db, { op: 'registration.update_end', subjectId: r!.id, version: '2027-03-04' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({
      stage: 'Technical evaluation', protectionEnd: '2027-03-04',
    });
  });

  it('keeps the same extension when the queued write has failed (HubSpot still holds the old date)', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await enqueue(db, { op: 'registration.update_end', subjectId: r!.id, version: '2027-03-04' });
    await db.update(hubspotOutbox).set({ status: 'failed' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-03-04');
  });

  it('never moves a granted extension backwards, even when the write is done and HubSpot reads stale', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery, protection_end_date: '2027-02-02' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({
      stage: 'Discovery', protectionEnd: '2027-03-04',
    });
  });

  it('still takes a later end date typed in HubSpot for a registration that has an extension', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-05-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-05-01');
  });

  it('announces a stage move once, and an end date change in the app only', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenCalledTimes(1);
    expect(announceRegistrationChange).toHaveBeenCalledWith({ db }, { registrationId: r!.id, kind: 'stage_changed', stage: 'Technical evaluation' });
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-03-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenLastCalledWith({ db }, { registrationId: r!.id, kind: 'protection_end_changed', protectionEnd: '2027-03-01' });
  });

  it('does not announce the echo of the portal own expiry, but does announce an expiry made in HubSpot', async () => {
    const hs = new FakeHubspot();
    const [mine, theirs] = await seed(hs, 2);
    await db.update(registrations).set({ status: 'expired', stage: 'Registration expired' }).where(eq(registrations.id, mine!.id));
    await hs.updateDeal(mine!.dealId, { dealstage: hs.stageIds['Registration expired'] });
    await hs.updateDeal(theirs!.dealId, { dealstage: hs.stageIds['Registration expired'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenCalledTimes(1);
    expect(announceRegistrationChange).toHaveBeenCalledWith({ db }, { registrationId: theirs!.id, kind: 'expired' });
  });

  it('a failing announcement is logged and does not fail the poll', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    vi.mocked(announceRegistrationChange).mockRejectedValueOnce(new Error('smtp down'));
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.stage).toBe('Discovery');
  });

  it('records the poll time even when nothing changed, so the health card can show it', async () => {
    const hs = new FakeHubspot();
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(await db.select().from(hubspotSyncState)).toHaveLength(1);
  });

  it('does not advance the cursor when HubSpot errors', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    hs.failNext = new Error('429');
    await expect(pollDeals({ db, hs, pipelineId: PIPE, clock })).rejects.toThrow('429');
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });
});

describe('reconcileDeals', () => {
  it('flags a deal that no longer exists in HubSpot and leaves the status alone', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    hs.deals.delete(r!.dealId);
    const out = await reconcileDeals({ db, hs });
    expect(out.missing).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({ hubspotMissing: true, status: 'accepted' });
  });
});
