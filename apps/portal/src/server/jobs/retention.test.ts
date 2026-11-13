import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applications,
  auditLog,
  documents,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrationReminders,
  registrations,
} from '@/db/schema';
import { makeApplication, makeDocument, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { purgeExpiredRecords, RETENTION_DAYS } from './retention';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

beforeEach(() => resetDb(db));

const withChildren = async (registrationId: string, partnerId: string): Promise<void> => {
  await db.insert(registrationContacts).values({ registrationId, partnerId, name: 'Nadia Karim', email: 'nadia@gulfway.example.com' });
  await db.insert(registrationMessages).values({ registrationId, partnerId, authorName: 'Omar', authorOrg: 'CleanStart', side: 'staff', body: 'Already registered.' });
  await db.insert(registrationEvents).values({ registrationId, partnerId, text: 'Rejected', byLabel: 'Omar', source: 'portal' });
  await db.insert(registrationReminders).values({ registrationId, daysBefore: 14, protectionEnd: '2026-12-01' });
};

const decidedLongAgo = async (id: string, days: number): Promise<void> => {
  await db.update(registrations).set({ decidedAt: daysAgo(days) }).where(eq(registrations.id, id));
};

describe('purgeExpiredRecords', () => {
  it('removes declined applications older than a year and keeps everything else', async () => {
    const oldDeclined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS + 1) });
    const recentDeclined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS - 1) });
    const oldApproved = await makeApplication(db, { status: 'approved', decidedAt: daysAgo(900) });
    const oldNew = await makeApplication(db, { status: 'new', createdAt: daysAgo(900), updatedAt: daysAgo(900) });

    const result = await purgeExpiredRecords({ clock });

    expect(result.applications).toBe(1);
    const left = (await db.select({ id: applications.id }).from(applications)).map((a) => a.id).sort();
    expect(left).toEqual([recentDeclined.id, oldApproved.id, oldNew.id].sort());
    expect(left).not.toContain(oldDeclined.id);
  });

  it('falls back to updated_at when a declined application has no decided_at', async () => {
    // A trigger stamps updated_at on every UPDATE, so the old value has to be inserted.
    await makeApplication(db, { status: 'declined', updatedAt: daysAgo(RETENTION_DAYS + 1) });
    const recent = await makeApplication(db, { status: 'declined' });

    expect((await purgeExpiredRecords({ clock })).applications).toBe(1);
    expect((await db.select({ id: applications.id }).from(applications)).map((a) => a.id)).toEqual([recent.id]);
  });

  it('removes a rejected registration older than a year with its contacts, messages, timeline and reminders', async () => {
    const partner = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await decidedLongAgo(old.id, RETENTION_DAYS + 5);
    await withChildren(old.id, partner.id);

    const result = await purgeExpiredRecords({ clock });

    expect(result.registrations).toBe(1);
    expect(await db.select().from(registrations)).toHaveLength(0);
    expect(await db.select().from(registrationContacts)).toHaveLength(0);
    expect(await db.select().from(registrationMessages)).toHaveLength(0);
    expect(await db.select().from(registrationEvents)).toHaveLength(0);
    expect(await db.select().from(registrationReminders)).toHaveLength(0);
  });

  it('keeps recent rejections and every other status, however old, with their children', async () => {
    const partner = await makePartner(db, {});
    const recent = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await decidedLongAgo(recent.id, RETENTION_DAYS - 1);
    await withChildren(recent.id, partner.id);
    for (const status of ['accepted', 'won', 'lost', 'expired', 'pending'] as const) {
      const r = await makeRegistration(db, { partnerId: partner.id, status });
      await decidedLongAgo(r.id, 900);
    }

    expect(await purgeExpiredRecords({ clock })).toEqual({ applications: 0, registrations: 0 });
    expect(await db.select().from(registrations)).toHaveLength(6);
    expect(await db.select().from(registrationContacts)).toHaveLength(1);
  });

  it('works in batches and is a no-op the second time', async () => {
    const partner = await makePartner(db, {});
    for (let i = 0; i < 5; i += 1) {
      const r = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: `Old customer ${i}` });
      await decidedLongAgo(r.id, RETENTION_DAYS + 10);
      await withChildren(r.id, partner.id);
    }
    const keep = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: 'Fresh rejection' });
    await decidedLongAgo(keep.id, 10);

    expect((await purgeExpiredRecords({ clock, batchSize: 2 })).registrations).toBe(5);
    expect((await db.select({ id: registrations.id }).from(registrations)).map((r) => r.id)).toEqual([keep.id]);
    expect(await purgeExpiredRecords({ clock, batchSize: 2 })).toEqual({ applications: 0, registrations: 0 });
  });

  it('never touches documents or the audit log', async () => {
    await makeDocument(db, { title: 'Old but live', deletedAt: null });
    await db.insert(auditLog).values({ at: daysAgo(900), actorLabel: 'Omar', who: 'staff', kind: 'partners', event: 'application.declined', text: 'Declined an application: Acme' });
    await purgeExpiredRecords({ clock });
    expect(await db.select().from(documents)).toHaveLength(1);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });
});
