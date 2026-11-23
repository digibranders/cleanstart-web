import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { ForbiddenError, NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { getDocumentEngagement } from './document-engagement';

const db = testDb();

beforeEach(async () => {
  await resetDb(db);
});

const opener = async (name: string, category: 'channel' | 'distributor' = 'channel', status: 'active' | 'suspended' = 'active') => {
  const partner = await makePartner(db, { name, category, status });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, user };
};

describe('getDocumentEngagement', () => {
  it('lists who opened it with counts and last opened, newest first, and who has not', async () => {
    const staff = await asStaff(db, 'marketing');
    const a = await opener('Alpha');
    const b = await opener('Beta');
    await opener('Gamma');
    const doc = await makeDocument(db, {});
    await db.insert(documentOpens).values([
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id, openedAt: new Date('2026-11-01T10:00:00Z') },
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id, openedAt: new Date('2026-11-03T10:00:00Z') },
      { documentId: doc.id, userId: b.user.id, partnerId: b.partner.id, openedAt: new Date('2026-11-05T10:00:00Z') },
    ]);
    const out = await withViewer(staff, (tx) => getDocumentEngagement(tx, staff, { id: doc.id }));
    expect(out.openedBy).toEqual([
      { partnerId: b.partner.id, partnerName: 'Beta', opens: 1, lastOpenedAt: '2026-11-05T10:00:00.000Z' },
      { partnerId: a.partner.id, partnerName: 'Alpha', opens: 2, lastOpenedAt: '2026-11-03T10:00:00.000Z' },
    ]);
    expect(out.notOpened.map((p) => p.partnerName)).toEqual(['Gamma']);
  });

  it('only counts as "not opened" the partners the audience reaches, and not suspended ones', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const channel = await opener('Channel one', 'channel');
    await opener('Distributor one', 'distributor');
    await opener('Suspended channel', 'channel', 'suspended');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['channel'] });
    const named = await makeDocument(db, { partnerIds: [channel.partner.id] });
    expect((await withViewer(staff, (tx) => getDocumentEngagement(tx, staff, { id: doc.id }))).notOpened.map((p) => p.partnerName)).toEqual(['Channel one']);
    expect((await withViewer(staff, (tx) => getDocumentEngagement(tx, staff, { id: named.id }))).notOpened.map((p) => p.partnerName)).toEqual(['Channel one']);
  });

  it('keeps showing a partner that opened it after it left the audience, and never lists it as not opened', async () => {
    const staff = await asStaff(db, 'marketing');
    const gone = await opener('Left audience', 'distributor');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['channel'] });
    await db.insert(documentOpens).values({ documentId: doc.id, userId: gone.user.id, partnerId: gone.partner.id });
    const out = await withViewer(staff, (tx) => getDocumentEngagement(tx, staff, { id: doc.id }));
    expect(out.openedBy.map((p) => p.partnerName)).toEqual(['Left audience']);
    expect(out.notOpened).toEqual([]);
  });

  it('is staff only, needs document.read_stats and ignores deleted or unknown documents', async () => {
    const sales = await asStaff(db, 'sales');
    const marketing = await asStaff(db, 'marketing');
    const partner = await opener('Alpha');
    const partnerViewer = await viewerFor(db, partner.user);
    const doc = await makeDocument(db, {});
    const deleted = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    await expect(withViewer(sales, (tx) => getDocumentEngagement(tx, sales, { id: doc.id }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(partnerViewer, (tx) => getDocumentEngagement(tx, partnerViewer, { id: doc.id }))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(marketing, (tx) => getDocumentEngagement(tx, marketing, { id: deleted.id }))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(marketing, (tx) => getDocumentEngagement(tx, marketing, { id: 'nope' }))).rejects.toBeInstanceOf(NotFoundError);
  });
});
