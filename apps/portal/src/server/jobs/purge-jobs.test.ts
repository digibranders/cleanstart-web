import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { applications, documentVersions, documents, registrations } from '@/db/schema';
import { makeApplication, makeDocument, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage } from '@/server/files/fake';
import { purgeDocumentFiles } from './document-purge';
import { purgeExpiredRecords, RETENTION_DAYS } from './retention';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

beforeEach(() => resetDb(db));

describe('the two purge jobs together', () => {
  it('delete only what has expired, each in its own area, and are idempotent', async () => {
    const partner = await makePartner(db, {});

    const live = await makeDocument(db, { title: 'Live datasheet' });
    const replaced = await makeDocument(db, { title: 'Replaced datasheet' });
    await db.insert(documentVersions).values({
      documentId: replaced.id,
      version: 1,
      fileKey: 'documents/old/v1/old.pdf',
      fileSize: 10,
      mime: 'application/pdf',
      originalName: 'old.pdf',
      replacedAt: daysAgo(40),
      purgeAfter: daysAgo(10),
    });
    const deleted = await makeDocument(db, { title: 'Deleted datasheet', deletedAt: daysAgo(40) });

    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await db.update(registrations).set({ decidedAt: daysAgo(RETENTION_DAYS + 1) }).where(eq(registrations.id, rejected.id));
    const declined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS + 1) });

    const storage = new FakeFileStorage(clock);
    const files = await purgeDocumentFiles({ storage, clock });
    const records = await purgeExpiredRecords({ clock });

    expect(files.failed).toEqual([]);
    expect([...storage.deleted].sort()).toEqual(['documents/old/v1/old.pdf', deleted.fileKey].sort());
    expect(storage.deleted).not.toContain(live.fileKey);
    expect(records).toEqual({ applications: 1, registrations: 1 });
    expect(await db.select().from(registrations).where(eq(registrations.id, rejected.id))).toHaveLength(0);
    expect(await db.select().from(applications).where(eq(applications.id, declined.id))).toHaveLength(0);
    expect((await db.select().from(documents).where(eq(documents.id, live.id)))[0]?.fileKey).toBe(live.fileKey);

    storage.deleted.length = 0;
    expect((await purgeDocumentFiles({ storage, clock })).purged).toBe(0);
    expect(await purgeExpiredRecords({ clock })).toEqual({ applications: 0, registrations: 0 });
    expect(storage.deleted).toEqual([]);
  });
});
