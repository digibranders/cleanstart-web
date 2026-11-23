import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentVersions, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ConflictError, ForbiddenError, NotFoundError } from '@/server/errors';
import { documentKey } from '@/server/files/rules';
import { withViewer } from './context';
import { listDocumentVersions, restoreDocumentVersion } from './document-versions';
import { replaceDocumentFile } from './documents';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const stored = async (): Promise<boolean> => true;

beforeEach(async () => {
  await resetDb(db);
});

const fileFor = (documentId: string, version: number, name: string) => ({
  key: documentKey({ documentId, version, originalName: name }),
  size: 500,
  mime: 'application/pdf',
  originalName: name,
});

/** A document replaced twice: version 3 is current, 1 and 2 are kept. */
const replacedTwice = async () => {
  const staff = await asStaff(db, 'marketing');
  const doc = await makeDocument(db, { originalName: 'v1.pdf', fileKey: 'test/v1.pdf' });
  await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 2, 'v2.pdf'), changeNote: 'Fixed pricing' }, clock));
  await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 3, 'v3.pdf'), changeNote: 'New logo' }, clock));
  return { staff, doc };
};

describe('listDocumentVersions', () => {
  it('shows the current file first and the kept ones newest first, each with its own change note', async () => {
    const { staff, doc } = await replacedTwice();
    const list = await withViewer(staff, (tx) => listDocumentVersions(tx, staff, { id: doc.id }, clock));
    expect(list.map((v) => [v.version, v.current, v.originalName, v.changeNote])).toEqual([
      [3, true, 'v3.pdf', 'New logo'],
      [2, false, 'v2.pdf', 'Fixed pricing'],
      [1, false, 'v1.pdf', null],
    ]);
    expect(list[1]?.keptUntil).toBe('2026-12-06T14:02:00.000Z');
  });

  it('drops a version once its 30 days are over', async () => {
    const { staff, doc } = await replacedTwice();
    const afterWindow = fixedClock('2026-12-07T00:00:00Z');
    const list = await withViewer(staff, (tx) => listDocumentVersions(tx, staff, { id: doc.id }, afterWindow));
    expect(list.map((v) => v.version)).toEqual([3]);
  });

  it('is for staff who may edit, and unknown or deleted documents are not found', async () => {
    const { doc } = await replacedTwice();
    const sales = await asStaff(db, 'sales');
    const partner = await viewerFor(db, await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'partner_admin' }));
    await expect(withViewer(sales, (tx) => listDocumentVersions(tx, sales, { id: doc.id }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(partner, (tx) => listDocumentVersions(tx, partner, { id: doc.id }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing');
    await expect(withViewer(marketing, (tx) => listDocumentVersions(tx, marketing, { id: 'nope' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('restoreDocumentVersion', () => {
  it('makes the old file current as a new version number and keeps the file it replaced', async () => {
    const { staff, doc } = await replacedTwice();
    const out = await withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 1, isStored: stored }, clock));
    expect(out).toMatchObject({ restoredVersion: 1, newVersion: 4 });
    expect(out.document).toMatchObject({ version: 4, originalName: 'v1.pdf' });
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row).toMatchObject({ fileKey: 'test/v1.pdf', changeNote: 'Restored from version 1' });
    const kept = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(kept.map((v) => [v.version, v.originalName, v.changeNote]).sort()).toEqual([
      [2, 'v2.pdf', 'Fixed pricing'],
      [3, 'v3.pdf', 'New logo'],
    ]);
    // the file it replaced can be restored too
    const back = await withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 3, isStored: stored }, clock));
    expect(back.document).toMatchObject({ version: 5, originalName: 'v3.pdf' });
  });

  it('refuses a version past its keep window, and a version that was never kept, and changes nothing', async () => {
    const { staff, doc } = await replacedTwice();
    const afterWindow = fixedClock('2026-12-07T00:00:00Z');
    await expect(withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 1, isStored: stored }, afterWindow))).rejects.toBeInstanceOf(ConflictError);
    await expect(withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 3, isStored: stored }, clock))).rejects.toBeInstanceOf(ConflictError);
    await expect(withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 9, isStored: stored }, clock))).rejects.toBeInstanceOf(ConflictError);
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.version).toBe(3);
  });

  it('refuses when the old object is no longer in storage and rolls back', async () => {
    const { staff, doc } = await replacedTwice();
    await expect(
      withViewer(staff, (tx) => restoreDocumentVersion(tx, staff, { id: doc.id, version: 2, isStored: async () => false }, clock)),
    ).rejects.toBeInstanceOf(ConflictError);
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.version).toBe(3);
    expect(await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id))).toHaveLength(2);
  });

  it('needs document.replace', async () => {
    const { doc } = await replacedTwice();
    const sales = await asStaff(db, 'sales');
    await expect(withViewer(sales, (tx) => restoreDocumentVersion(tx, sales, { id: doc.id, version: 1, isStored: stored }, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
