import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documentVersions, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import type { PartnerCategory } from '@/lib/domain';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { canPartnerOpen, documentKey } from '@/server/files/rules';
import { withSystem, withViewer } from './context';
import {
  createDocument,
  deleteDocument,
  getDocument,
  listAudiencePartners,
  listDocumentRecipients,
  listDocuments,
  listMaterialRequestRecipients,
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

const partnerFixture = async (category: PartnerCategory = 'channel') => {
  const partner = await makePartner(db, { category });
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

describe('listDocuments', () => {
  it('shows a partner only the live documents its audience allows, newest first', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { title: 'Open, old', updatedAt: new Date('2026-10-01T00:00:00Z') });
    await makeDocument(db, { title: 'Open, new', updatedAt: new Date('2026-11-01T00:00:00Z') });
    await makeDocument(db, { title: 'Distributors only', audienceKind: 'categories', audienceCategories: ['distributor'] });
    await makeDocument(db, { title: 'Named for me', audienceKind: 'named', partnerIds: [channel.partner.id], updatedAt: new Date('2026-10-15T00:00:00Z') });
    await makeDocument(db, { title: 'Named for someone else', audienceKind: 'named', partnerIds: [(await makePartner(db, {})).id] });
    await makeDocument(db, { title: 'Deleted', deletedAt: new Date('2026-11-01T00:00:00Z') });
    const rows = await withViewer(channel.viewer, (tx) => listDocuments(tx, channel.viewer, {}));
    expect(rows.map((d) => d.title)).toEqual(['Open, new', 'Named for me', 'Open, old']);
  });

  it('shows staff every live document and applies the title, type and product filters', async () => {
    const staff = await asStaff(db, 'marketing');
    await makeDocument(db, { title: 'Alpha sheet', type: 'datasheet', product: 'images' });
    await makeDocument(db, { title: '100% battlecard', type: 'battlecard', product: 'cleansight' });
    await makeDocument(db, { title: 'Gone', deletedAt: new Date('2026-11-01T00:00:00Z') });
    const all = await withViewer(staff, (tx) => listDocuments(tx, staff, {}));
    expect(all).toHaveLength(2);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { q: '100%' }))).map((d) => d.title)).toEqual(['100% battlecard']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { q: 'alph' }))).map((d) => d.title)).toEqual(['Alpha sheet']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { type: 'battlecard' }))).map((d) => d.title)).toEqual(['100% battlecard']);
    expect((await withViewer(staff, (tx) => listDocuments(tx, staff, { product: 'images' }))).map((d) => d.title)).toEqual(['Alpha sheet']);
  });

  it('returns file details but never the file key, and hides the audience from partners', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { originalName: 'x.pdf', mime: 'application/pdf', fileSize: 2048, audienceKind: 'categories', audienceCategories: ['channel'] });
    const [row] = await withViewer(channel.viewer, (tx) => listDocuments(tx, channel.viewer, {}));
    expect(row).toMatchObject({ originalName: 'x.pdf', mime: 'application/pdf', fileSize: 2048, version: 1 });
    expect(JSON.stringify(row)).not.toContain('fileKey');
    expect(row?.audience).toEqual({ kind: 'categories', categories: [], partners: [] });
  });
});

describe('the three audience implementations agree', () => {
  const CASES: Array<{ name: string; kind: 'all' | 'categories' | 'named'; categories: PartnerCategory[]; listed: boolean; category: PartnerCategory }> = [
    { name: 'all, channel', kind: 'all', categories: [], listed: false, category: 'channel' },
    { name: 'categories include me', kind: 'categories', categories: ['distributor', 'channel'], listed: false, category: 'channel' },
    { name: 'categories exclude me', kind: 'categories', categories: ['distributor'], listed: false, category: 'channel' },
    { name: 'categories, integrator', kind: 'categories', categories: ['integrator'], listed: false, category: 'integrator' },
    { name: 'named, listed', kind: 'named', categories: [], listed: true, category: 'channel' },
    { name: 'named, not listed', kind: 'named', categories: [], listed: false, category: 'channel' },
  ];

  it.each(CASES)('$name', async ({ kind, categories, listed, category }) => {
    const me = await partnerFixture(category);
    const other = await makePartner(db, {});
    const doc = await makeDocument(db, {
      audienceKind: kind,
      audienceCategories: categories,
      ...(kind === 'named' ? { partnerIds: [listed ? me.partner.id : other.id] } : {}),
    });
    const expected = canPartnerOpen(
      { kind, categories, partnerIds: kind === 'named' ? [listed ? me.partner.id : other.id] : [] },
      { id: me.partner.id, category },
    );
    const throughRepo = (await withViewer(me.viewer, (tx) => listDocuments(tx, me.viewer, {}))).some((d) => d.id === doc.id);
    const throughRlsOnly = (await withViewer(me.viewer, (tx) => tx.select({ id: documents.id }).from(documents))).some((d) => d.id === doc.id);
    expect(throughRepo).toBe(expected);
    expect(throughRlsOnly).toBe(expected);
  });
});

describe('open counts', () => {
  it('gives staff total opens and distinct partners, and partners only their own company opens', async () => {
    const a = await partnerFixture('channel');
    const b = await partnerFixture('channel');
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, {});
    await db.insert(documentOpens).values([
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id },
      { documentId: doc.id, userId: a.user.id, partnerId: a.partner.id },
      { documentId: doc.id, userId: b.user.id, partnerId: b.partner.id },
    ]);
    const asStaffRow = await withViewer(staff, (tx) => getDocument(tx, staff, doc.id));
    expect(asStaffRow).toMatchObject({ opens: 3, partnerCount: 2, ownOpens: null });
    const asPartnerRow = await withViewer(a.viewer, (tx) => getDocument(tx, a.viewer, doc.id));
    expect(asPartnerRow).toMatchObject({ opens: null, partnerCount: null, ownOpens: 2 });
    const untouched = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => getDocument(tx, staff, untouched.id))).toMatchObject({ opens: 0, partnerCount: 0 });
  });
});

describe('createDocument', () => {
  it('creates a document open to everyone with the id taken from the key', async () => {
    const staff = await asStaff(db, 'marketing');
    const documentId = crypto.randomUUID();
    const created = await withViewer(staff, (tx) => createDocument(tx, staff, newInput({ file: fileFor(documentId) }), clock));
    expect(created).toMatchObject({ id: documentId, title: 'Pricing guide', version: 1, opens: 0, uploadedByName: staff.name });
    expect(created.audience).toEqual({ kind: 'all', categories: [], partners: [] });
    expect(created.updatedAt).toBe('2026-11-06T14:02:00.000Z');
  });

  it('stores categories in a fixed order and named partners as audience rows', async () => {
    const staff = await asStaff(db, 'marketing');
    const p1 = await makePartner(db, { name: 'Zeta Systems' });
    const p2 = await makePartner(db, { name: 'Alpha Networks' });
    const byCategory = await withViewer(staff, (tx) =>
      createDocument(tx, staff, newInput({ audience: { kind: 'categories', categories: ['channel', 'distributor'] } }), clock),
    );
    expect(byCategory.audience.categories).toEqual(['distributor', 'channel']);
    const named = await withViewer(staff, (tx) =>
      createDocument(tx, staff, newInput({ audience: { kind: 'named', partnerIds: [p1.id, p2.id, p1.id] } }), clock),
    );
    expect(named.audience.partners.map((p) => p.name)).toEqual(['Alpha Networks', 'Zeta Systems']);
  });

  it('rejects an empty audience, an unknown partner, a malformed key, a version above 1, and a reused key', async () => {
    const staff = await asStaff(db, 'marketing');
    const run = (input: NewDocumentInput) => withViewer(staff, (tx) => createDocument(tx, staff, input, clock));
    await expect(run(newInput({ audience: { kind: 'categories', categories: [] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ audience: { kind: 'named', partnerIds: [] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ audience: { kind: 'named', partnerIds: ['00000000-0000-4000-8000-000000000000'] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ file: { ...fileFor(), key: 'seed/x.pdf' } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(newInput({ file: fileFor(crypto.randomUUID(), 2) }))).rejects.toBeInstanceOf(ValidationError);
    const input = newInput();
    await run(input);
    await expect(run(input)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.select().from(documents)).toHaveLength(1);
  });

  it('is staff only', async () => {
    const { viewer } = await partnerFixture();
    await expect(withViewer(viewer, (tx) => createDocument(tx, viewer, newInput(), clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('replaceDocumentFile', () => {
  it('makes version n+1, moves the old file to document_versions for 30 days and keeps the open history', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { originalName: 'old.pdf', mime: 'application/pdf', fileSize: 10 });
    const partner = await partnerFixture();
    await db.insert(documentOpens).values({ documentId: doc.id, userId: partner.user.id, partnerId: partner.partner.id });
    const file = { ...fileFor(doc.id, 2), size: 2000, originalName: 'new.pdf' };
    const result = await withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file }, clock));
    expect(result.previousVersion).toBe(1);
    expect(result.document).toMatchObject({ id: doc.id, version: 2, originalName: 'new.pdf', fileSize: 2000, opens: 1 });
    const [version] = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(version).toMatchObject({ version: 1, fileKey: doc.fileKey, originalName: 'old.pdf', replacedBy: staff.id });
    expect(version?.purgeAfter.toISOString()).toBe('2026-12-06T14:02:00.000Z');
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.fileKey).toBe(file.key);
  });

  it('rejects a key for the wrong document, the wrong version, or one already used', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, {});
    const run = (file: ReturnType<typeof fileFor>) => withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file }, clock));
    await expect(run(fileFor(crypto.randomUUID(), 2))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(fileFor(doc.id, 1))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(fileFor(doc.id, 3))).rejects.toBeInstanceOf(ValidationError);
    const good = fileFor(doc.id, 2);
    await run(good);
    await expect(run(good)).rejects.toBeInstanceOf(ValidationError);
  });

  it('answers NotFoundError for a deleted or unknown document', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    await expect(withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: doc.id, file: fileFor(doc.id, 2) }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staff, (tx) => replaceDocumentFile(tx, staff, { id: 'nope', file: fileFor() }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('updateDocument', () => {
  it('reports what changed and writes the new audience', async () => {
    const staff = await asStaff(db, 'marketing');
    const p = await makePartner(db, {});
    const doc = await makeDocument(db, { title: 'Old title' });
    const result = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, title: ' New title ', audience: { kind: 'named', partnerIds: [p.id] } }, clock),
    );
    expect(result.changed).toEqual(['details', 'audience']);
    expect(result.audienceBefore).toBe('All partners');
    expect(result.audienceAfter).toBe('1 partner');
    expect(result.document).toMatchObject({ title: 'New title' });
    expect(result.document.audience.partners).toEqual([{ id: p.id, name: p.name }]);
  });

  it('changes nothing and says so when the values are the same', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { title: 'Same' });
    const result = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, title: 'Same', audience: { kind: 'all' } }, clock),
    );
    expect(result.changed).toEqual([]);
  });

  it('replaces the named list instead of adding to it, and clears it when the audience becomes categories', async () => {
    const staff = await asStaff(db, 'marketing');
    const p1 = await makePartner(db, {});
    const p2 = await makePartner(db, {});
    const doc = await makeDocument(db, { audienceKind: 'named', partnerIds: [p1.id] });
    const swapped = await withViewer(staff, (tx) => updateDocument(tx, staff, { id: doc.id, audience: { kind: 'named', partnerIds: [p2.id] } }, clock));
    expect(swapped.document.audience.partners.map((p) => p.id)).toEqual([p2.id]);
    const toCategories = await withViewer(staff, (tx) =>
      updateDocument(tx, staff, { id: doc.id, audience: { kind: 'categories', categories: ['integrator'] } }, clock),
    );
    expect(toCategories.document.audience).toEqual({ kind: 'categories', categories: ['integrator'], partners: [] });
  });
});

describe('deleteDocument', () => {
  it('soft deletes: partners lose access at once and staff stop seeing it too', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const channel = await partnerFixture();
    const doc = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => deleteDocument(tx, staff, { id: doc.id }, clock))).toEqual({ title: doc.title });
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.deletedAt?.toISOString()).toBe('2026-11-06T14:02:00.000Z');
    await expect(withViewer(channel.viewer, (tx) => getDocument(tx, channel.viewer, doc.id))).rejects.toBeInstanceOf(NotFoundError);
    expect(await withViewer(staff, (tx) => listDocuments(tx, staff, {}))).toHaveLength(0);
    await expect(withViewer(staff, (tx) => deleteDocument(tx, staff, { id: doc.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('listNewDocuments', () => {
  it('returns visible documents updated in the last 30 days, newest first, up to the limit', async () => {
    const channel = await partnerFixture('channel');
    await makeDocument(db, { title: 'Fresh', updatedAt: new Date('2026-11-05T00:00:00Z') });
    await makeDocument(db, { title: 'Fresher', updatedAt: new Date('2026-11-06T00:00:00Z') });
    await makeDocument(db, { title: 'Old', updatedAt: new Date('2026-09-01T00:00:00Z') });
    await makeDocument(db, { title: 'Hidden', updatedAt: new Date('2026-11-05T00:00:00Z'), audienceKind: 'categories', audienceCategories: ['distributor'] });
    const rows = await withViewer(channel.viewer, (tx) => listNewDocuments(tx, channel.viewer, { limit: 5 }, clock));
    expect(rows.map((d) => d.title)).toEqual(['Fresher', 'Fresh']);
    const one = await withViewer(channel.viewer, (tx) => listNewDocuments(tx, channel.viewer, { limit: 1 }, clock));
    expect(one).toHaveLength(1);
  });
});

describe('listDocumentRecipients', () => {
  it('returns active users of live partners inside the audience, nobody else', async () => {
    const staff = await asStaff(db, 'marketing');
    const channel = await makePartner(db, { category: 'channel' });
    const distributor = await makePartner(db, { category: 'distributor' });
    const suspended = await makePartner(db, { category: 'channel', status: 'suspended' });
    const active = await makeUser(db, { partnerId: channel.id });
    await makeUser(db, { partnerId: channel.id, status: 'disabled' });
    await makeUser(db, { partnerId: channel.id, status: 'invited' });
    await makeUser(db, { partnerId: distributor.id });
    await makeUser(db, { partnerId: suspended.id });
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['channel'] });
    expect(await withViewer(staff, (tx) => listDocumentRecipients(tx, staff, { id: doc.id }))).toEqual([active.id]);
    const everyone = await makeDocument(db, {});
    expect(await withViewer(staff, (tx) => listDocumentRecipients(tx, staff, { id: everyone.id }))).toHaveLength(2);
  });
});

describe('listAudiencePartners and listMaterialRequestRecipients', () => {
  it('lists partners by name for staff only', async () => {
    const staff = await asStaff(db, 'marketing');
    const { viewer } = await partnerFixture();
    await makePartner(db, { name: 'Zeta' });
    await makePartner(db, { name: 'Alpha' });
    const names = (await withViewer(staff, (tx) => listAudiencePartners(tx, staff))).map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Alpha', 'Zeta']));
    expect(names).toEqual([...names].sort());
    await expect(withViewer(viewer, (tx) => listAudiencePartners(tx, viewer))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns the partner's manager and active marketing staff once each", async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'pm@cleanstart.test', name: 'Farhan' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'mk@cleanstart.test', name: 'Ishita' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'old@cleanstart.test', status: 'disabled' });
    await makeUser(db, { kind: 'staff', role: 'sales', email: 'sales@cleanstart.test' });
    const partner = await makePartner(db, { managerId: manager.id });
    const out = await withSystem(SYSTEM_ACTORS.portal, (tx) => listMaterialRequestRecipients(tx, SYSTEM_ACTORS.portal, { partnerId: partner.id }));
    expect(out.recipients.map((r) => r.email).sort()).toEqual(['mk@cleanstart.test', 'pm@cleanstart.test']);
  });
});
