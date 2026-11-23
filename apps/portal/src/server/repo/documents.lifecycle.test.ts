import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documentVersions, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { documentKey } from '@/server/files/rules';
import { withViewer } from './context';
import {
  createDocument,
  getDocument,
  listDocumentRecipients,
  listDocuments,
  listNewDocuments,
  type NewDocumentInput,
  replaceDocumentFile,
  updateDocument,
} from './documents';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const partnerFixture = async () => {
  const partner = await makePartner(db, { category: 'channel' });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, user, viewer: await viewerFor(db, user) };
};

const fileFor = (documentId = crypto.randomUUID(), version = 1) => ({
  key: documentKey({ documentId, version, originalName: 'a.pdf' }),
  size: 1000,
  mime: 'application/pdf',
  originalName: 'a.pdf',
});

const newInput = (overrides: Partial<NewDocumentInput> = {}): NewDocumentInput => ({
  title: 'Pricing guide',
  type: 'datasheet',
  product: 'libraries',
  summary: null,
  durationMinutes: null,
  audience: { kind: 'all' },
  file: fileFor(),
  ...overrides,
});

describe('draft and expiry', () => {
  it('hides drafts and expired documents from partners everywhere, and shows them to staff with their state', async () => {
    const channel = await partnerFixture();
    const staff = await asStaff(db, 'marketing');
    await makeDocument(db, { title: 'Live' });
    await makeDocument(db, { title: 'Future expiry', expiresAt: new Date('2099-01-01T00:00:00Z') });
    const draft = await makeDocument(db, { title: 'Draft', status: 'draft' });
    const expired = await makeDocument(db, { title: 'Expired', expiresAt: new Date('2020-01-01T00:00:00Z') });
    const seen = (await withViewer(channel.viewer, (tx) => listDocuments(tx, channel.viewer, {}))).map((d) => d.title);
    expect(seen.sort()).toEqual(['Future expiry', 'Live']);
    const throughRls = (await withViewer(channel.viewer, (tx) => tx.select({ id: documents.id }).from(documents))).map((d) => d.id);
    expect(throughRls).not.toContain(draft.id);
    expect(throughRls).not.toContain(expired.id);
    const asStaffRows = await withViewer(staff, (tx) => listDocuments(tx, staff, {}));
    expect(asStaffRows.find((d) => d.title === 'Draft')).toMatchObject({ status: 'draft', expired: false });
    expect(asStaffRows.find((d) => d.title === 'Expired')).toMatchObject({ status: 'published', expired: true, expiresAt: '2020-01-01T00:00:00.000Z' });
    expect(asStaffRows.find((d) => d.title === 'Live')).toMatchObject({ expired: false, expiresAt: null });
  });

  it('answers not found to a partner who asks for a draft or an expired document by id, and not to staff', async () => {
    const channel = await partnerFixture();
    const draft = await makeDocument(db, { status: 'draft' });
    const expired = await makeDocument(db, { expiresAt: new Date('2020-01-01T00:00:00Z') });
    for (const doc of [draft, expired]) {
      await expect(withViewer(channel.viewer, (tx) => getDocument(tx, channel.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    }
    const staff = await asStaff(db, 'marketing');
    expect((await withViewer(staff, (tx) => getDocument(tx, staff, draft.id))).status).toBe('draft');
  });

  it('keeps drafts and expired documents out of the new documents card and the announcement recipients', async () => {
    const channel = await partnerFixture();
    const staff = await asStaff(db, 'marketing');
    const updatedAt = new Date('2026-11-05T00:00:00Z');
    await makeDocument(db, { title: 'Live', updatedAt });
    const draft = await makeDocument(db, { title: 'Draft', status: 'draft', updatedAt });
    const expired = await makeDocument(db, { title: 'Expired', expiresAt: new Date('2020-01-01T00:00:00Z'), updatedAt });
    const fresh = await withViewer(channel.viewer, (tx) => listNewDocuments(tx, channel.viewer, { limit: 10 }, clock));
    expect(fresh.map((d) => d.title)).toEqual(['Live']);
    for (const doc of [draft, expired]) {
      expect(await withViewer(staff, (tx) => listDocumentRecipients(tx, staff, { id: doc.id }))).toEqual([]);
    }
  });

  it('creates a draft with an expiry, and updateDocument publishes it and re-dates it', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await withViewer(staff, (tx) => createDocument(tx, staff, newInput({ status: 'draft', expiresAt: new Date('2027-03-01T00:00:00Z') }), clock));
    expect(doc).toMatchObject({ status: 'draft', expiresAt: '2027-03-01T00:00:00.000Z' });
    const published = await withViewer(staff, (tx) => updateDocument(tx, staff, { id: doc.id, status: 'published' }, clock));
    expect(published.changed).toEqual(['status']);
    expect(published.document.status).toBe('published');
    const cleared = await withViewer(staff, (tx) => updateDocument(tx, staff, { id: doc.id, expiresAt: null }, clock));
    expect(cleared.changed).toEqual(['expiry']);
    expect(cleared.document.expiresAt).toBeNull();
    const same = await withViewer(staff, (tx) => updateDocument(tx, staff, { id: doc.id, status: 'published', expiresAt: null }, clock));
    expect(same.changed).toEqual([]);
  });
});

describe('change notes and last opened', () => {
  it('stores the note on the new file and copies the previous note onto the kept version', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 2), changeNote: '  Fixed the price  ' }, clock));
    await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 3), changeNote: null }, clock));
    const kept = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(kept.map((v) => [v.version, v.changeNote]).sort()).toEqual([
      [1, null],
      [2, 'Fixed the price'],
    ]);
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.changeNote).toBeNull();
  });

  it('reports the latest open to staff and nothing to partners', async () => {
    const channel = await partnerFixture();
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    await db.insert(documentOpens).values([
      { documentId: doc.id, userId: channel.user.id, partnerId: channel.partner.id, openedAt: new Date('2026-11-01T10:00:00Z') },
      { documentId: doc.id, userId: channel.user.id, partnerId: channel.partner.id, openedAt: new Date('2026-11-04T10:00:00Z') },
    ]);
    expect((await withViewer(staff, (tx) => getDocument(tx, staff, doc.id))).lastOpenedAt).toBe('2026-11-04T10:00:00.000Z');
    expect((await withViewer(channel.viewer, (tx) => getDocument(tx, channel.viewer, doc.id))).lastOpenedAt).toBeNull();
  });
});
