import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { registrationReminders, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  decideExtension,
  listExtensionRequests,
  listReminderCandidates,
  markReminderSent,
  requestExtension,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const actor = SYSTEM_ACTORS.portal;
beforeEach(() => resetDb(db));

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted',
    protectionEnd: '2027-01-12', registeredBy: sales.id, managerId: farhan.id, region: 'india',
  });
  return { farhan, partner, sales, admin, reg };
};

describe('requestExtension', () => {
  it('marks the registration requested, stores the reason, writes the timeline event and names the manager to notify', async () => {
    const { farhan, partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await withViewer(viewer, (tx) => requestExtension(tx, viewer, { id: reg.id, reason: '  Procurement is slow  ' }, clock));
    expect(result.managerUserId).toBe(farhan.id);
    expect(result.partnerName).toBe('Kestrel Systems');
    expect(result.registration).toMatchObject({
      extensionStatus: 'requested', extensionReason: 'Procurement is slow', extensionRequestedAt: '2026-11-06T14:02:00.000Z',
      extensionGrantedAt: null, extensionDays: null, protectionEnd: '2027-01-12',
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Extension requested: Procurement is slow', byLabel: viewer.name, source: 'portal' });
  });

  it('needs a reason, an accepted registration, and only one request at a time or after a grant', async () => {
    const { partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const ask = (reason: string, id = reg.id) => withViewer(viewer, (tx) => requestExtension(tx, viewer, { id, reason }, clock));
    await expect(ask('   ')).rejects.toBeInstanceOf(ValidationError);
    const pending = await makeRegistration(db, { partnerId: partner.id, customerName: 'Still waiting', status: 'pending' });
    await expect(ask('why', pending.id)).rejects.toMatchObject({ reason: 'not_accepted' });
    await ask('first');
    await expect(ask('again')).rejects.toMatchObject({ reason: 'extension_already_used' });
    await db.update(registrations).set({ extensionStatus: 'granted' }).where(eq(registrations.id, reg.id));
    await expect(ask('and again')).rejects.toMatchObject({ reason: 'extension_already_used' });
  });

  it('allows a new request after a decline', async () => {
    const { partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await db.update(registrations).set({ extensionStatus: 'declined' }).where(eq(registrations.id, reg.id));
    const result = await withViewer(viewer, (tx) => requestExtension(tx, viewer, { id: reg.id, reason: 'New facts' }, clock));
    expect(result.registration.extensionStatus).toBe('requested');
  });

  it('is not found for a colleague\'s deal seen by sales and for another company', async () => {
    const { partner, reg } = await setup();
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await expect(withViewer(other, (tx) => requestExtension(tx, other, { id: reg.id, reason: 'x' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    const outsider = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(outsider, (tx) => requestExtension(tx, outsider, { id: reg.id, reason: 'x' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('decideExtension', () => {
  const requested = async () => {
    const ctx = await setup();
    await db.update(registrations).set({ extensionStatus: 'requested', extensionRequestedAt: new Date('2026-11-05T10:00:00Z'), extensionReason: 'Procurement is slow' }).where(eq(registrations.id, ctx.reg.id));
    return ctx;
  };

  it('grants 30 more days, returns the new end as the outbox version and the recipients', async () => {
    const { farhan, sales, reg } = await requested();
    const result = await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: ' Happy to help ' }, clock));
    expect(result).toMatchObject({ granted: true, newProtectionEnd: '2027-02-11', partnerName: 'Kestrel Systems', recipientUserIds: [sales.id] });
    expect(result.registration).toMatchObject({
      protectionEnd: '2027-02-11', extensionStatus: 'granted', extensionDays: 30, extensionGrantedAt: '2026-11-06T14:02:00.000Z',
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Extension granted, protected until 11 Feb 2027: Happy to help', byLabel: farhan.name });
  });

  it('declines without moving the end date', async () => {
    const { farhan, reg } = await requested();
    const result = await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'decline', note: null }, clock));
    expect(result).toMatchObject({ granted: false, newProtectionEnd: null });
    expect(result.registration).toMatchObject({ extensionStatus: 'declined', protectionEnd: '2027-01-12', extensionDays: null });
    expect(result.registration.history[0]?.text).toBe('Extension declined');
  });

  it('only decides a requested extension, once', async () => {
    const { farhan, reg } = await setup();
    await expect(withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toMatchObject({ reason: 'extension_not_requested' });
    await db.update(registrations).set({ extensionStatus: 'requested' }).where(eq(registrations.id, reg.id));
    await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock));
    await expect(withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toMatchObject({ reason: 'extension_not_requested' });
  });

  it('is staff only and limited to the staff sales region', async () => {
    const { partner, reg } = await requested();
    const partnerViewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(partnerViewer, (tx) => decideExtension(tx, partnerViewer, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const gulf = await asStaff(db, 'sales', 'middle_east');
    await expect(withViewer(gulf, (tx) => decideExtension(tx, gulf, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('reminder candidates', () => {
  const accepted = (partnerId: string, name: string, protectionEnd: string, registeredBy?: string) =>
    makeRegistration(db, { partnerId, customerName: name, status: 'accepted', protectionEnd, ...(registeredBy ? { registeredBy } : {}) });

  it('finds accepted registrations ending in exactly 14 or 3 days, with the registrant and the admins once each', async () => {
    const partner = await makePartner(db, {});
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const at14 = await accepted(partner.id, 'Fourteen', '2026-11-20', sales.id);
    const at3 = await accepted(partner.id, 'Three', '2026-11-09', admin.id);
    await accepted(partner.id, 'Thirteen', '2026-11-19');
    await accepted(partner.id, 'Fifteen', '2026-11-21');
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Pending', status: 'pending', protectionEnd: '2026-11-20' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Won', status: 'won', protectionEnd: '2026-11-09' });
    const found = await db.transaction((tx) => listReminderCandidates(tx, actor, clock));
    const byName = Object.fromEntries(found.map((c) => [c.customer, c]));
    expect(Object.keys(byName).sort()).toEqual(['Fourteen', 'Three']);
    expect(byName.Fourteen).toMatchObject({ registrationId: at14.id, daysBefore: 14, protectionEnd: '2026-11-20', partnerId: partner.id, product: 'images' });
    expect([...byName.Fourteen!.recipientUserIds].sort()).toEqual([admin.id, sales.id].sort());
    expect(byName.Three).toMatchObject({ registrationId: at3.id, daysBefore: 3 });
    expect(byName.Three!.recipientUserIds).toEqual([admin.id]);
  });

  it('stops offering a reminder once it is marked sent, which is idempotent, and offers the new date after an extension', async () => {
    const partner = await makePartner(db, {});
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await accepted(partner.id, 'Fourteen', '2026-11-20');
    expect(await db.transaction((tx) => listReminderCandidates(tx, actor, clock))).toHaveLength(1);
    const mark = () => db.transaction((tx) => markReminderSent(tx, actor, { registrationId: reg.id, daysBefore: 14, protectionEnd: '2026-11-20' }, clock));
    await mark();
    await mark();
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
    expect(await db.transaction((tx) => listReminderCandidates(tx, actor, clock))).toHaveLength(0);
    await db.update(registrations).set({ protectionEnd: '2026-12-20' }).where(eq(registrations.id, reg.id));
    const later = await db.transaction((tx) => listReminderCandidates(tx, actor, fixedClock('2026-12-06T05:00:00Z')));
    expect(later.map((c) => [c.daysBefore, c.protectionEnd])).toEqual([[14, '2026-12-20']]);
  });
});

describe('listExtensionRequests', () => {
  it('lists only requested extensions, oldest request first, for the staff scope', async () => {
    const { farhan, partner, reg } = await setup();
    const other = await makeRegistration(db, { partnerId: partner.id, customerName: 'Gulf Co', status: 'accepted', region: 'middle_east' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'No request', status: 'accepted' });
    await db.update(registrations).set({ extensionStatus: 'requested', extensionRequestedAt: new Date('2026-11-05T10:00:00Z'), extensionReason: 'later' }).where(eq(registrations.id, reg.id));
    await db.update(registrations).set({ extensionStatus: 'requested', extensionRequestedAt: new Date('2026-11-04T10:00:00Z'), extensionReason: 'earlier' }).where(eq(registrations.id, other.id));
    const all = await withViewer(farhan, (tx) => listExtensionRequests(tx, farhan));
    expect(all.map((r) => r.extensionReason)).toEqual(['earlier', 'later']);
    const staffIndia = await asStaff(db, 'sales', 'india');
    const seen = await withViewer(staffIndia, (tx) => listExtensionRequests(tx, staffIndia));
    expect(seen.map((r) => r.id)).toEqual([reg.id]);
  });

  it('is staff only', async () => {
    const { partner } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => listExtensionRequests(tx, viewer))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
