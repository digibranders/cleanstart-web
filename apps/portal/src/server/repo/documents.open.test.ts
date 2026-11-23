import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import type { PartnerCategory } from '@/lib/domain';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { getDocumentForOpen, recordDocumentOpen } from './documents';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const partnerFixture = async (category: PartnerCategory) => {
  const partner = await makePartner(db, { category });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, viewer: await viewerFor(db, user) };
};

describe('getDocumentForOpen', () => {
  it('returns the file key, name and mime for a document open to everyone', async () => {
    const { viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, { originalName: 'sheet.pdf', mime: 'application/pdf' });
    const target = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, doc.id));
    expect(target).toEqual({ fileKey: doc.fileKey, originalName: 'sheet.pdf', mime: 'application/pdf' });
  });

  it('answers NotFoundError (404, never 403) outside the category audience', async () => {
    const channel = await partnerFixture('channel');
    const distributor = await partnerFixture('distributor');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
    await expect(withViewer(channel.viewer, (tx) => getDocumentForOpen(tx, channel.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(distributor.viewer, (tx) => getDocumentForOpen(tx, distributor.viewer, doc.id))).resolves.toMatchObject({ fileKey: doc.fileKey });
  });

  it('answers NotFoundError for a partner that is not on the named list', async () => {
    const listed = await partnerFixture('channel');
    const other = await partnerFixture('channel');
    const doc = await makeDocument(db, { audienceKind: 'named', partnerIds: [listed.partner.id] });
    await expect(withViewer(other.viewer, (tx) => getDocumentForOpen(tx, other.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(listed.viewer, (tx) => getDocumentForOpen(tx, listed.viewer, doc.id))).resolves.toMatchObject({ fileKey: doc.fileKey });
  });

  it('answers the same NotFoundError for an unknown id and for a malformed id', async () => {
    const { viewer } = await partnerFixture('channel');
    const unknown = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, '00000000-0000-4000-8000-000000000000')).catch((e: unknown) => e);
    const malformed = await withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, 'not-a-uuid')).catch((e: unknown) => e);
    expect(unknown).toBeInstanceOf(NotFoundError);
    expect(malformed).toBeInstanceOf(NotFoundError);
    expect((unknown as NotFoundError).safeMessage).toBe((malformed as NotFoundError).safeMessage);
  });

  it('hides a soft deleted document from partners and from staff', async () => {
    const { viewer } = await partnerFixture('channel');
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    await db.update(documents).set({ deletedAt: new Date('2026-11-01T00:00:00Z') }).where(eq(documents.id, doc.id));
    await expect(withViewer(viewer, (tx) => getDocumentForOpen(tx, viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staff, (tx) => getDocumentForOpen(tx, staff, doc.id))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('recordDocumentOpen', () => {
  it('records one open for a partner user with the user and partner ids', async () => {
    const { partner, viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, {});
    await withViewer(viewer, (tx) => recordDocumentOpen(tx, viewer, { id: doc.id }, clock));
    const rows = await db.select().from(documentOpens);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ documentId: doc.id, userId: viewer.id, partnerId: partner.id });
    expect(rows[0]?.openedAt.toISOString()).toBe('2026-11-06T14:02:00.000Z');
  });

  it('records nothing for staff', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, {});
    await withViewer(staff, (tx) => recordDocumentOpen(tx, staff, { id: doc.id }, clock));
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('refuses, and records nothing, for a document outside the partner audience', async () => {
    const { viewer } = await partnerFixture('channel');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
    await expect(withViewer(viewer, (tx) => recordDocumentOpen(tx, viewer, { id: doc.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });
});
