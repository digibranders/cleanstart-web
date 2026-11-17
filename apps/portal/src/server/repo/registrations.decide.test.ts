import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { registrationEvents, registrationMessages, registrations, users } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  acceptRegistration,
  conflictChecks,
  conflictInputs,
  countWaiting,
  getRegistration,
  listApprovalQueue,
  rejectRegistration,
  undoDecision,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const gaurav = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems', hubspotCompanyId: '55' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', registeredBy: sales.id,
    managerId: gaurav.id, region: 'india', registeredOn: '2026-11-04',
  });
  return { gaurav, partner, sales, admin, reg };
};

describe('acceptRegistration', () => {
  it('accepts a pending registration: 89 days of protection after today, automatic lines and the recipients', async () => {
    const { gaurav, sales, reg } = await setup();
    const result = await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    expect(result.registration).toMatchObject({
      status: 'accepted', stage: 'Accepted', protectionEnd: '2027-02-03', decidedByLabel: gaurav.name,
      decidedAt: '2026-11-06T14:02:00.000Z', decidedOn: '2026-11-06', rejectionReason: null,
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Accepted, protected until 3 Feb 2027', byLabel: gaurav.name, source: 'portal', auto: true });
    expect(result.registration.thread.at(-1)).toMatchObject({ body: 'Accepted. Protected until 3 Feb 2027.', side: 'staff', authorOrg: 'CleanStart', auto: true });
    expect(result.partnerName).toBe('Kestrel Systems');
    expect(result.decidedAt).toBe('2026-11-06T14:02:00.000Z');
    expect(result.recipientUserIds).toEqual([sales.id]);
  });

  it('tells the partner admins when the registrant has left', async () => {
    const { gaurav, partner, admin, sales, reg } = await setup();
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, sales.id));
    const result = await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    expect(result.recipientUserIds).toEqual([admin.id]);
    expect(partner.id).toBe(result.registration.partnerId);
  });

  it('decides once: a second accept is already_decided', async () => {
    const { gaurav, reg } = await setup();
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    const again = withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    await expect(again).rejects.toMatchObject({ reason: 'already_decided' });
    await expect(again).rejects.toBeInstanceOf(ConflictError);
  });

  it('is staff only and limited to the staff sales region', async () => {
    const { reg, partner } = await setup();
    const partnerViewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(partnerViewer, (tx) => acceptRegistration(tx, partnerViewer, { id: reg.id }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const gulf = await asStaff(db, 'sales', 'middle_east');
    await expect(withViewer(gulf, (tx) => acceptRegistration(tx, gulf, { id: reg.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    const india = await asStaff(db, 'sales', 'india');
    const done = await withViewer(india, (tx) => acceptRegistration(tx, india, { id: reg.id }, clock));
    expect(done.registration.status).toBe('accepted');
  });
});

describe('rejectRegistration', () => {
  it('needs a reason and then writes the reason into the timeline and the thread', async () => {
    const { gaurav, reg } = await setup();
    const blank = withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: '   ' }, clock));
    await expect(blank).rejects.toBeInstanceOf(ValidationError);
    await expect(blank).rejects.toMatchObject({ issues: [{ path: 'reason' }] });
    const tooLong = withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: 'x'.repeat(501) }, clock));
    await expect(tooLong).rejects.toBeInstanceOf(ValidationError);
    const result = await withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: ' Add the budget owner. ' }, clock));
    expect(result.registration).toMatchObject({ status: 'rejected', stage: 'Not accepted', rejectionReason: 'Add the budget owner.', protectionEnd: null, decidedByLabel: gaurav.name });
    expect(result.registration.history[0]).toMatchObject({ text: 'Not accepted: Add the budget owner.', auto: true });
    expect(result.registration.thread.at(-1)).toMatchObject({ body: 'Not accepted. Add the budget owner.', auto: true });
  });

  it('cannot reject what is already decided', async () => {
    const { gaurav, reg } = await setup();
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    await expect(withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: 'late' }, clock))).rejects.toMatchObject({ reason: 'already_decided' });
  });
});

describe('undoDecision', () => {
  it('puts a fresh decision back in the queue and removes only its two automatic lines', async () => {
    const { gaurav, reg } = await setup();
    await db.insert(registrationEvents).values({ registrationId: reg.id, at: new Date('2026-11-04T09:00:00Z'), text: 'Registered', byLabel: 'Karan Malhotra', source: 'portal' });
    await db.insert(registrationMessages).values({ registrationId: reg.id, authorName: 'Karan Malhotra', authorOrg: 'Kestrel Systems', side: 'partner', body: 'Any news?', createdAt: new Date('2026-11-05T09:00:00Z') });
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    const undone = await withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: reg.id }, fixedClock('2026-11-06T14:09:00Z')));
    expect(undone).toMatchObject({ status: 'pending', stage: 'Awaiting review', protectionEnd: null, decidedByLabel: null, decidedAt: null, rejectionReason: null });
    expect(undone.history.map((e) => e.text)).toEqual(['Registered']);
    expect(undone.thread.map((m) => m.body)).toEqual(['Any news?']);
  });

  it('keeps an older automatic line when a later decision is undone', async () => {
    const { gaurav, reg } = await setup();
    await withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: 'First reason' }, fixedClock('2026-11-05T10:00:00Z')));
    await db.update(registrations).set({ status: 'pending', stage: 'Awaiting review', decidedBy: null, decidedAt: null, decidedByLabel: null, rejectionReason: null }).where(eq(registrations.id, reg.id));
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    const undone = await withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: reg.id }, clock));
    expect(undone.history.map((e) => e.text)).toEqual(['Not accepted: First reason']);
  });

  it('is refused after the window, for another person, once a HubSpot deal exists and for an undecided registration', async () => {
    const { gaurav, reg } = await setup();
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    const late = withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: reg.id }, fixedClock('2026-11-06T14:13:00Z')));
    await expect(late).rejects.toMatchObject({ reason: 'undo_window_closed' });
    const colleague = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(colleague, (tx) => undoDecision(tx, colleague, { id: reg.id }, clock))).rejects.toMatchObject({ reason: 'undo_window_closed' });
    await db.update(registrations).set({ hubspotDealId: '4821' }).where(eq(registrations.id, reg.id));
    await expect(withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: reg.id }, clock))).rejects.toMatchObject({ reason: 'deal_in_crm' });
    const pending = await makeRegistration(db, { customerName: 'Other Co', managerId: gaurav.id });
    await expect(withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: pending.id }, clock))).rejects.toMatchObject({ reason: 'not_decided' });
  });

  it('allows a decision to be taken again after an undo', async () => {
    const { gaurav, reg } = await setup();
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    await withViewer(gaurav, (tx) => undoDecision(tx, gaurav, { id: reg.id }, clock));
    const second = await withViewer(gaurav, (tx) => rejectRegistration(tx, gaurav, { id: reg.id, reason: 'Duplicate' }, clock));
    expect(second.registration.history.filter((e) => e.auto)).toHaveLength(1);
  });
});

describe('listApprovalQueue', () => {
  const decide = (id: string, by: string, at: string, over: Partial<typeof registrations.$inferInsert> = {}) =>
    db.update(registrations).set({ decidedBy: by, decidedAt: new Date(at), ...over }).where(eq(registrations.id, id));

  it('lists waiting rows oldest first, keeps a fresh own decision with canUndo, and counts the rest', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    const omar = await asStaff(db, 'partner_manager', 'middle_east');
    const partner = await makePartner(db, {});
    const a = await makeRegistration(db, { partnerId: partner.id, customerName: 'A Co', registeredOn: '2026-11-02', managerId: gaurav.id });
    const b = await makeRegistration(db, { partnerId: partner.id, customerName: 'B Co', registeredOn: '2026-11-06', managerId: gaurav.id });
    const c = await makeRegistration(db, { partnerId: partner.id, customerName: 'C Co', registeredOn: '2026-11-03', status: 'accepted', managerId: gaurav.id, protectionEnd: '2026-11-15' });
    await decide(c.id, gaurav.id, '2026-11-06T14:00:00Z');
    const d = await makeRegistration(db, { partnerId: partner.id, customerName: 'D Co', registeredOn: '2026-11-01', status: 'rejected', managerId: gaurav.id });
    await decide(d.id, omar.id, '2026-11-03T10:00:00Z');
    const e = await makeRegistration(db, { partnerId: partner.id, customerName: 'E Co', registeredOn: '2026-11-05', region: 'middle_east', managerId: omar.id });

    const all = await withViewer(gaurav, (tx) => listApprovalQueue(tx, gaurav, { scope: 'all' }, clock));
    expect(all.rows.map((r) => r.registration.id)).toEqual([a.id, c.id, e.id, b.id]);
    expect(all.rows.map((r) => [r.waitingBusinessDays, r.overSla, r.canUndo])).toEqual([[4, true, false], [3, false, true], [1, false, false], [0, false, false]]);
    expect(all.counts).toEqual({ waiting: 3, overSla: 1, conflicts: 0, acceptedLast7Days: 1, rejectedLast7Days: 1, expiringIn14Days: 1 });
    expect(all.recentDecisions.map((r) => r.id)).toEqual([c.id, d.id]);

    const mine = await withViewer(gaurav, (tx) => listApprovalQueue(tx, gaurav, { scope: 'mine' }, clock));
    expect(mine.rows.map((r) => r.registration.id)).toEqual([a.id, c.id, b.id]);
  });

  it('does not offer undo to another person, after the window or once a deal exists', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    const other = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const theirs = await makeRegistration(db, { partnerId: partner.id, customerName: 'T Co', status: 'accepted', managerId: gaurav.id });
    await db.update(registrations).set({ decidedBy: other.id, decidedAt: new Date('2026-11-06T14:00:00Z') }).where(eq(registrations.id, theirs.id));
    const stale = await makeRegistration(db, { partnerId: partner.id, customerName: 'S Co', status: 'rejected', managerId: gaurav.id });
    await db.update(registrations).set({ decidedBy: gaurav.id, decidedAt: new Date('2026-11-06T13:00:00Z') }).where(eq(registrations.id, stale.id));
    const synced = await makeRegistration(db, { partnerId: partner.id, customerName: 'H Co', status: 'accepted', managerId: gaurav.id, hubspotDealId: '9' });
    await db.update(registrations).set({ decidedBy: gaurav.id, decidedAt: new Date('2026-11-06T14:00:00Z') }).where(eq(registrations.id, synced.id));
    const queue = await withViewer(gaurav, (tx) => listApprovalQueue(tx, gaurav, { scope: 'all' }, clock));
    expect(queue.rows).toEqual([]);
    expect(queue.recentDecisions).toHaveLength(3);
  });

  it('limits staff sales to their region and refuses partners and marketing', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const india = await makeRegistration(db, { partnerId: partner.id, customerName: 'I Co', region: 'india', managerId: gaurav.id });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'G Co', region: 'middle_east' });
    const salesIndia = await asStaff(db, 'sales', 'india');
    const queue = await withViewer(salesIndia, (tx) => listApprovalQueue(tx, salesIndia, { scope: 'all' }, clock));
    expect(queue.rows.map((r) => r.registration.id)).toEqual([india.id]);
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => listApprovalQueue(tx, viewer, { scope: 'all' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => listApprovalQueue(tx, marketing, { scope: 'all' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('reports conflicts in the counts', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { customerName: 'Gulfway Freight', product: 'images' });
    await makeRegistration(db, { customerName: 'Gulfway Freight', product: 'images' });
    const queue = await withViewer(gaurav, (tx) => listApprovalQueue(tx, gaurav, { scope: 'all' }, clock));
    expect(queue.counts.conflicts).toBe(2);
  });
});

describe('conflictChecks', () => {
  it('flags two partners waiting on the same customer and product, and says who was first', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'all');
    const kestrel = await makePartner(db, { name: 'Kestrel Systems' });
    const arbor = await makePartner(db, { name: 'Arbor Cyber' });
    const first = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Gulfway Freight', product: 'images', registeredOn: '2026-11-03' });
    const second = await makeRegistration(db, { partnerId: arbor.id, customerName: 'gulfway freight', product: 'images', registeredOn: '2026-11-05' });
    await db.update(registrations).set({ createdAt: new Date('2026-11-03T10:00:00Z') }).where(eq(registrations.id, first.id));
    await db.update(registrations).set({ createdAt: new Date('2026-11-05T10:00:00Z') }).where(eq(registrations.id, second.id));
    const checks = await withViewer(gaurav, (tx) => conflictChecks(tx, gaurav, { registrationIds: [first.id, second.id] }));
    expect(checks[first.id]).toEqual({ kind: 'conflict', other: { id: second.id, partnerName: 'Arbor Cyber', product: 'images', status: 'pending', registeredOn: '2026-11-05', protectionEnd: null, registeredFirst: false } });
    expect(checks[second.id]).toMatchObject({ kind: 'conflict', other: { id: first.id, partnerName: 'Kestrel Systems', registeredFirst: true } });
  });

  it('prefers an accepted rival, reports a partner\'s own other product as info and is clear otherwise', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'all');
    const kestrel = await makePartner(db, {});
    const dunes = await makePartner(db, { name: 'Dunes Networks' });
    const harbourline = await makePartner(db, { name: 'Harbourline IT' });
    const mine = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Pearl Gulf Bank', product: 'cleansight' });
    await makeRegistration(db, { partnerId: dunes.id, customerName: 'Pearl Gulf Bank', product: 'cleansight', status: 'pending' });
    await makeRegistration(db, { partnerId: harbourline.id, customerName: 'Pearl Gulf Bank', product: 'cleansight', status: 'accepted', protectionEnd: '2027-02-02' });
    const held = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Tejas Labs', product: 'libraries' });
    await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Tejas Labs', product: 'images', status: 'accepted', protectionEnd: '2027-01-12' });
    const lonely = await makeRegistration(db, { customerName: 'Solo Customer' });
    const checks = await withViewer(gaurav, (tx) => conflictChecks(tx, gaurav, { registrationIds: [mine.id, held.id, lonely.id] }));
    expect(checks[mine.id]).toMatchObject({ kind: 'conflict', other: { partnerName: 'Harbourline IT', status: 'accepted', protectionEnd: '2027-02-02' } });
    expect(checks[held.id]).toMatchObject({ kind: 'info', other: { product: 'images', protectionEnd: '2027-01-12' } });
    expect(checks[lonely.id]).toEqual({ kind: 'none' });
  });

  it('is staff only', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => conflictChecks(tx, viewer, { registrationIds: [] }))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('countWaiting and conflictInputs', () => {
  it('counts pending registrations in the staff scope, and is 0 for marketing', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { region: 'india' });
    await makeRegistration(db, { region: 'middle_east' });
    await makeRegistration(db, { region: 'india', status: 'accepted' });
    expect(await withViewer(manager, (tx) => countWaiting(tx, manager))).toBe(2);
    const india = await asStaff(db, 'sales', 'india');
    expect(await withViewer(india, (tx) => countWaiting(tx, india))).toBe(1);
    const marketing = await asStaff(db, 'marketing', 'all');
    expect(await withViewer(marketing, (tx) => countWaiting(tx, marketing))).toBe(0);
    const partner = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(partner, (tx) => countWaiting(tx, partner))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns what the HubSpot hint needs for waiting registrations only', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { hubspotCompanyId: '55' });
    const waiting = await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in' });
    const decided = await makeRegistration(db, { partnerId: partner.id, customerName: 'Other', status: 'accepted' });
    const inputs = await withViewer(manager, (tx) => conflictInputs(tx, manager, { registrationIds: [waiting.id, decided.id] }));
    expect(inputs).toEqual([{ registrationId: waiting.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in', partnerHubspotCompanyId: '55' }]);
  });
});

describe('detail after a decision', () => {
  it('shows through getRegistration for the partner who registered it', async () => {
    const { gaurav, admin, reg } = await setup();
    await withViewer(gaurav, (tx) => acceptRegistration(tx, gaurav, { id: reg.id }, clock));
    const viewer = await asPartner(db, { partnerId: admin.partnerId!, role: 'partner_admin' });
    const seen = await withViewer(viewer, (tx) => getRegistration(tx, viewer, reg.id));
    expect(seen.status).toBe('accepted');
    expect(seen.thread.at(-1)?.auto).toBe(true);
  });
});
