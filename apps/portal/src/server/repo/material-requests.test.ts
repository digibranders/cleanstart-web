import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { materialRequests } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  countOpenMaterialRequests,
  createMaterialRequest,
  listMaterialRequests,
  listOwnMaterialRequests,
  listRequestAssignees,
  updateMaterialRequest,
} from './material-requests';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const later = fixedClock('2026-11-08T09:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const partnerFixture = async (name: string) => {
  const partner = await makePartner(db, { name });
  const user = await makeUser(db, { partnerId: partner.id, role: 'sales', name: `${name} user` });
  return { partner, user, viewer: await viewerFor(db, user) };
};

const file = (viewer: Awaited<ReturnType<typeof partnerFixture>>['viewer'], subject = 'Rust one pager') =>
  withViewer(viewer, (tx) => createMaterialRequest(tx, viewer, { subject, details: 'Need it for a bank', product: 'images' }, clock));

describe('createMaterialRequest and listOwnMaterialRequests', () => {
  it('stores the request for the viewer\'s own company as open and lists only that company\'s requests', async () => {
    const a = await partnerFixture('Alpha');
    const b = await partnerFixture('Beta');
    const made = await file(a.viewer);
    await file(b.viewer, 'Beta request');
    expect(made).toMatchObject({ status: 'open', subject: 'Rust one pager', partnerName: 'Alpha', requestedByName: 'Alpha user', documentId: null, closedAt: null });
    const own = await withViewer(a.viewer, (tx) => listOwnMaterialRequests(tx, a.viewer));
    expect(own.map((r) => r.subject)).toEqual(['Rust one pager']);
  });

  it('is refused for staff', async () => {
    const staff = await asStaff(db, 'marketing');
    await expect(withViewer(staff, (tx) => createMaterialRequest(tx, staff, { subject: 'x', details: 'x', product: 'all' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('keeps a partner from changing a request, even its own, through row level security', async () => {
    const a = await partnerFixture('Alpha');
    const made = await file(a.viewer);
    const touched = await withViewer(a.viewer, (tx) =>
      tx.update(materialRequests).set({ status: 'done' }).where(eq(materialRequests.id, made.id)).returning({ id: materialRequests.id }),
    );
    expect(touched).toEqual([]);
    const [row] = await db.select().from(materialRequests);
    expect(row?.status).toBe('open');
  });
});

describe('who may work the inbox', () => {
  it('allows partner managers and marketing, refuses staff sales and partners', async () => {
    const a = await partnerFixture('Alpha');
    await file(a.viewer);
    for (const role of ['partner_manager', 'marketing'] as const) {
      const staff = await asStaff(db, role);
      expect(await withViewer(staff, (tx) => listMaterialRequests(tx, staff, {}))).toHaveLength(1);
      expect(await withViewer(staff, (tx) => countOpenMaterialRequests(tx, staff))).toBe(1);
    }
    const sales = await asStaff(db, 'sales');
    await expect(withViewer(sales, (tx) => listMaterialRequests(tx, sales, {}))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(sales, (tx) => updateMaterialRequest(tx, sales, { id: crypto.randomUUID(), status: 'done' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(a.viewer, (tx) => listMaterialRequests(tx, a.viewer, {}))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(a.viewer, (tx) => listRequestAssignees(tx, a.viewer))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('filters by status and partner, with open and in progress first', async () => {
    const a = await partnerFixture('Alpha');
    const b = await partnerFixture('Beta');
    const staff = await asStaff(db, 'marketing');
    const first = await file(a.viewer, 'First');
    await file(b.viewer, 'Second');
    await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: first.id, status: 'done' }, later));
    const all = await withViewer(staff, (tx) => listMaterialRequests(tx, staff, {}));
    expect(all.map((r) => r.subject)).toEqual(['Second', 'First']);
    expect((await withViewer(staff, (tx) => listMaterialRequests(tx, staff, { status: 'done' }))).map((r) => r.subject)).toEqual(['First']);
    expect((await withViewer(staff, (tx) => listMaterialRequests(tx, staff, { partnerId: b.partner.id }))).map((r) => r.subject)).toEqual(['Second']);
    expect(await withViewer(staff, (tx) => countOpenMaterialRequests(tx, staff))).toBe(1);
  });

  it('offers only active marketing and partner managers as assignees', async () => {
    const manager = await asStaff(db, 'partner_manager');
    await asStaff(db, 'marketing');
    await asStaff(db, 'sales');
    await makeUser(db, { kind: 'staff', role: 'marketing', status: 'disabled' });
    expect(await withViewer(manager, (tx) => listRequestAssignees(tx, manager))).toHaveLength(2);
  });
});

describe('updateMaterialRequest status flow', () => {
  it('stamps closed_at on done, clears it on reopen, and reports who to tell', async () => {
    const a = await partnerFixture('Alpha');
    const staff = await asStaff(db, 'marketing');
    const made = await file(a.viewer);
    const progress = await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'in_progress', assignedTo: staff.id }, clock));
    expect(progress).toMatchObject({ before: 'open', requestedBy: a.user.id });
    expect(progress.request).toMatchObject({ status: 'in_progress', closedAt: null, assignedToId: staff.id });
    const done = await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'done', responseNote: ' Attached ' }, later));
    expect(done.before).toBe('in_progress');
    expect(done.request).toMatchObject({ status: 'done', responseNote: 'Attached', closedAt: '2026-11-08T09:00:00.000Z' });
    const reopened = await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'open' }, later));
    expect(reopened.request).toMatchObject({ status: 'open', closedAt: null, responseNote: 'Attached' });
  });

  it('keeps the first closed_at when only the note changes on a closed request', async () => {
    const a = await partnerFixture('Alpha');
    const staff = await asStaff(db, 'marketing');
    const made = await file(a.viewer);
    await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'done' }, clock));
    const again = await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, responseNote: 'Link added' }, later));
    expect(again.request.closedAt).toBe('2026-11-06T14:02:00.000Z');
  });

  it('needs a note to decline', async () => {
    const a = await partnerFixture('Alpha');
    const staff = await asStaff(db, 'marketing');
    const made = await file(a.viewer);
    await expect(withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'declined' }, clock))).rejects.toBeInstanceOf(ValidationError);
    const declined = await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, status: 'declined', responseNote: 'Not planned' }, clock));
    expect(declined.request.status).toBe('declined');
  });

  it('links an existing document and shows it to the partner only when its audience allows', async () => {
    const a = await partnerFixture('Alpha');
    const other = await makePartner(db, {});
    const staff = await asStaff(db, 'marketing');
    const open = await makeDocument(db, { title: 'Rust one pager' });
    const hidden = await makeDocument(db, { title: 'Someone else only', partnerIds: [other.id] });
    const made = await file(a.viewer);
    await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, documentId: open.id }, clock));
    expect((await withViewer(a.viewer, (tx) => listOwnMaterialRequests(tx, a.viewer)))[0]).toMatchObject({ documentId: open.id, documentTitle: 'Rust one pager' });
    await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, documentId: hidden.id }, clock));
    expect((await withViewer(a.viewer, (tx) => listOwnMaterialRequests(tx, a.viewer)))[0]).toMatchObject({ documentId: null, documentTitle: null });
    expect((await withViewer(staff, (tx) => listMaterialRequests(tx, staff, {})))[0]).toMatchObject({ documentId: hidden.id });
    await withViewer(staff, (tx) => updateMaterialRequest(tx, staff, { id: made.id, documentId: null }, clock));
    expect((await withViewer(staff, (tx) => listMaterialRequests(tx, staff, {})))[0]?.documentId).toBeNull();
  });

  it('refuses an unknown document, a deleted document, a non-staff assignee and an unknown request', async () => {
    const a = await partnerFixture('Alpha');
    const staff = await asStaff(db, 'marketing');
    const sales = await asStaff(db, 'sales');
    const gone = await makeDocument(db, { deletedAt: new Date('2026-11-01T00:00:00Z') });
    const made = await file(a.viewer);
    const patch = (input: Parameters<typeof updateMaterialRequest>[2]) => withViewer(staff, (tx) => updateMaterialRequest(tx, staff, input, clock));
    await expect(patch({ id: made.id, documentId: crypto.randomUUID() })).rejects.toBeInstanceOf(ValidationError);
    await expect(patch({ id: made.id, documentId: gone.id })).rejects.toBeInstanceOf(ValidationError);
    await expect(patch({ id: made.id, assignedTo: a.user.id })).rejects.toBeInstanceOf(ValidationError);
    await expect(patch({ id: made.id, assignedTo: sales.id })).rejects.toBeInstanceOf(ValidationError);
    await expect(patch({ id: crypto.randomUUID(), status: 'done' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(patch({ id: 'nope', status: 'done' })).rejects.toBeInstanceOf(NotFoundError);
  });
});
