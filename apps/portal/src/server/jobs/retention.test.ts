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
import { ConflictError } from '@/server/errors';
import { purgeBatch, purgeExpiredRecords, RETENTION_DAYS } from './retention';

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

  it('keeps a row exactly RETENTION_DAYS old and removes one a millisecond older', async () => {
    const partner = await makePartner(db, {});
    const edge = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    const past = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    const cutoff = daysAgo(RETENTION_DAYS);
    await db.update(registrations).set({ decidedAt: cutoff }).where(eq(registrations.id, edge.id));
    await db.update(registrations).set({ decidedAt: new Date(cutoff.getTime() - 1) }).where(eq(registrations.id, past.id));
    const keptApp = await makeApplication(db, { status: 'declined', decidedAt: cutoff });
    await makeApplication(db, { status: 'declined', decidedAt: new Date(cutoff.getTime() - 1) });

    expect(await purgeExpiredRecords({ clock })).toEqual({ applications: 1, registrations: 1 });
    expect((await db.select({ id: registrations.id }).from(registrations)).map((r) => r.id)).toEqual([edge.id]);
    expect((await db.select({ id: applications.id }).from(applications)).map((a) => a.id)).toEqual([keptApp.id]);
  });

  it('does not delete a registration that a partner resubmitted while the job was selecting it', async () => {
    const partner = await makePartner(db, {});
    const flipped = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await decidedLongAgo(flipped.id, RETENTION_DAYS + 5);
    await withChildren(flipped.id, partner.id);

    let commitResubmit: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      commitResubmit = resolve;
    });
    let flipStarted: () => void = () => {};
    const started = new Promise<void>((resolve) => {
      flipStarted = resolve;
    });
    // The resubmit transaction holds the row lock, uncommitted, while the job runs.
    const resubmit = db.transaction(async (tx) => {
      await tx.update(registrations).set({ status: 'pending', decidedAt: null }).where(eq(registrations.id, flipped.id));
      flipStarted();
      await gate;
    });
    await started;
    const job = purgeExpiredRecords({ clock });
    await new Promise((resolve) => setTimeout(resolve, 300));
    commitResubmit();
    await resubmit;

    expect(await job).toEqual({ applications: 0, registrations: 0 });
    const [row] = await db.select().from(registrations).where(eq(registrations.id, flipped.id));
    expect(row?.status).toBe('pending');
    expect(await db.select().from(registrationContacts)).toHaveLength(1);
  });
});

describe('purgeBatch', () => {
  it('removes children for the locked ids and returns the number of parents deleted', async () => {
    const steps: string[] = [];
    const removed = await purgeBatch({
      lock: async () => ['a', 'b'],
      removeChildren: async (ids) => void steps.push(`children:${ids.join(',')}`),
      removeParents: async (ids) => {
        steps.push(`parents:${ids.join(',')}`);
        return ids;
      },
    });
    expect(removed).toBe(2);
    expect(steps).toEqual(['children:a,b', 'parents:a,b']);
  });

  it('removes nothing and reports 0 when no row is due', async () => {
    const removed = await purgeBatch({
      lock: async () => [],
      removeChildren: async () => {
        throw new Error('must not run');
      },
      removeParents: async () => {
        throw new Error('must not run');
      },
    });
    expect(removed).toBe(0);
  });

  it('throws when fewer parents were deleted than were locked, so the transaction rolls back', async () => {
    await expect(
      purgeBatch({ lock: async () => ['a', 'b'], removeChildren: async () => {}, removeParents: async () => ['a'] }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
