import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentAudience, documentVersions, documents } from '@/db/schema';
import { makeDocument, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage } from '@/server/files/fake';
import { purgeDocumentFiles } from './document-purge';

const db = testDb();
const clock = fixedClock('2026-12-20T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const version = (documentId: string, n: number, key: string, purgeAfter: string) => ({
  documentId,
  version: n,
  fileKey: key,
  fileSize: 1,
  mime: 'application/pdf',
  originalName: `${key}.pdf`,
  purgeAfter: new Date(purgeAfter),
});

describe('purgeDocumentFiles', () => {
  it('deletes expired old versions and tombstones documents deleted more than 30 days ago, keeping everything else', async () => {
    const live = await makeDocument(db, {});
    await db.insert(documentVersions).values([
      version(live.id, 1, 'documents/v1-due', '2026-12-19T00:00:00Z'),
      version(live.id, 2, 'documents/v2-not-yet', '2026-12-25T00:00:00Z'),
    ]);
    const partner = await makePartner(db, {});
    const oldDeleted = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z'), audienceKind: 'named', partnerIds: [partner.id] });
    await db.insert(documentVersions).values(version(oldDeleted.id, 1, 'documents/old-doc-v1', '2027-01-30T00:00:00Z'));
    const recentDeleted = await makeDocument(db, { deletedAt: new Date('2026-12-10T00:00:00Z') });

    const storage = new FakeFileStorage(clock);
    const result = await purgeDocumentFiles({ storage, clock });

    expect(storage.deleted.sort()).toEqual(['documents/old-doc-v1', 'documents/v1-due', oldDeleted.fileKey].sort());
    expect(result).toEqual({ purged: 3, failed: [] });
    const versions = await db.select().from(documentVersions);
    expect(versions.map((v) => v.fileKey)).toEqual(['documents/v2-not-yet']);
    const [tomb] = await db.select().from(documents).where(eq(documents.id, oldDeleted.id));
    expect(tomb).toMatchObject({ fileKey: `purged/${oldDeleted.id}`, fileSize: 0, title: oldDeleted.title });
    expect(await db.select().from(documentAudience).where(eq(documentAudience.documentId, oldDeleted.id))).toHaveLength(0);
    const [recent] = await db.select().from(documents).where(eq(documents.id, recentDeleted.id));
    expect(recent?.fileKey).toBe(recentDeleted.fileKey);
    const [kept] = await db.select().from(documents).where(eq(documents.id, live.id));
    expect(kept?.fileKey).toBe(live.fileKey);
  });

  it('is idempotent: a second run deletes nothing', async () => {
    await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    const storage = new FakeFileStorage(clock);
    expect((await purgeDocumentFiles({ storage, clock })).purged).toBe(1);
    storage.deleted.length = 0;
    expect(await purgeDocumentFiles({ storage, clock })).toEqual({ purged: 0, failed: [] });
    expect(storage.deleted).toEqual([]);
  });

  it('keeps going when one R2 delete fails and reports the key', async () => {
    const a = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    const b = await makeDocument(db, { deletedAt: new Date('2026-11-02T00:00:00Z') });
    const storage = new FakeFileStorage(clock);
    const realDelete = storage.delete.bind(storage);
    storage.delete = async (key: string) => {
      if (key === a.fileKey) throw new Error('r2 down');
      await realDelete(key);
    };
    const result = await purgeDocumentFiles({ storage, clock });
    expect(result.failed).toEqual([a.fileKey]);
    expect(storage.deleted).toEqual([b.fileKey]);
  });
});
