// src/server/jobs/expiry.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, registrations } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { announceRegistrationChange } from '@/server/registrations/announce';
import { expireRegistrations, runExpiry } from './expiry';

vi.mock('@/server/hubspot/client', () => ({ readHubspotConfig: () => null }));
vi.mock('@/server/registrations/announce', () => ({ announceRegistrationChange: vi.fn(async () => undefined) }));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  vi.mocked(announceRegistrationChange).mockClear();
});

describe('expireRegistrations', () => {
  it('expires accepted registrations whose protection ended and queues the HubSpot write', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    const live = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-06', customerName: 'Live Co' });
    const won = await makeRegistration(db, { partnerId: p.id, status: 'won', protectionEnd: '2026-01-01', customerName: 'Won Co' });
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, old.id)))[0]).toMatchObject({ status: 'expired', stage: 'Registration expired', closedOn: '2026-11-06' });
    expect((await db.select().from(registrations).where(eq(registrations.id, live.id)))[0]!.status).toBe('accepted');
    expect((await db.select().from(registrations).where(eq(registrations.id, won.id)))[0]!.status).toBe('won');
    expect((await db.select().from(hubspotOutbox)).map((r) => [r.op, r.idempotencyKey])).toEqual([
      ['registration.expire', `registration.expire:${old.id}:2026-11-06`],
    ]);
  });

  it('writes one audit entry per expired registration through recordAudit', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, old.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: 'registration.expired', kind: 'deal_decisions', who: 'sync', source: 'system',
      actorLabel: 'CleanStart', partnerId: p.id, subjectType: 'registration',
    });
  });

  it('announces each expiry once, after it committed, and a failing announcement does not stop the job', async () => {
    const p = await makePartner(db, {});
    const a = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05', customerName: 'A Co' });
    const b = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-04', customerName: 'B Co' });
    vi.mocked(announceRegistrationChange).mockRejectedValueOnce(new Error('smtp down'));
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(2);
    expect(vi.mocked(announceRegistrationChange).mock.calls.map(([, change]) => change)).toEqual(
      expect.arrayContaining([{ registrationId: a.id, kind: 'expired' }, { registrationId: b.id, kind: 'expired' }]),
    );
    expect(announceRegistrationChange).toHaveBeenCalledTimes(2);
  });

  it('does nothing the second time it runs on the same day', async () => {
    const p = await makePartner(db, {});
    await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    const clock = fixedClock('2026-11-06T00:10:00Z');
    await expireRegistrations({ db, clock });
    expect((await expireRegistrations({ db, clock })).expired).toBe(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('runExpiry', () => {
  it('still expires and queues the HubSpot write while HubSpot is not configured', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2020-01-01' });
    await runExpiry();
    expect((await db.select().from(registrations).where(eq(registrations.id, old.id)))[0]!.status).toBe('expired');
    expect((await db.select().from(hubspotOutbox)).map((r) => r.op)).toEqual(['registration.expire']);
  });
});
