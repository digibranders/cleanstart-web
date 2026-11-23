import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { emailChangeRequests, invites, registrations, users } from '@/db/schema';
import { asPartner, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { type Tx, withSystem, withViewer } from './context';
import { confirmEmailChange, moveDeals, previewEmailChange, reactivateMember, requestEmailChange, updateMemberDetails } from './member-edit';
import { listRegistrations } from './registrations';
import { removeMember } from './team';

const db = testDb();
const clock = fixedClock('2026-11-23T10:00:00Z');
const actor = publicActor('Someone confirming an email');

beforeEach(async () => {
  await resetDb(db);
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  return { partner, admin };
};
const as = <T>(viewer: Parameters<typeof withViewer>[0], fn: (tx: Tx) => Promise<T>) => withViewer(viewer, fn);
const row = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];

describe('updateMemberDetails', () => {
  it('changes name, title and phone and reports before and after', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan M' });
    const result = await as(admin, (tx) => updateMemberDetails(tx, admin, { userId: member.id, name: 'Karan Malhotra', title: 'Sales lead', phone: '+91 98200 11111' }));
    expect(result).toMatchObject({ changed: true, before: { name: 'Karan M', title: null, phone: null }, after: { name: 'Karan Malhotra', title: 'Sales lead', phone: '+91 98200 11111' } });
    expect(await row(member.id)).toMatchObject({ name: 'Karan Malhotra', title: 'Sales lead' });
    const again = await as(admin, (tx) => updateMemberDetails(tx, admin, { userId: member.id, name: 'Karan Malhotra', title: 'Sales lead', phone: '+91 98200 11111' }));
    expect(again.changed).toBe(false);
  });

  it('refuses an empty name', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    await expect(as(admin, (tx) => updateMemberDetails(tx, admin, { userId: member.id, name: '  ', title: null, phone: null }))).rejects.toMatchObject({ code: 'validation' });
  });

  it('cannot reach a person at another company', async () => {
    const { admin } = await company();
    const stranger = await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'sales', name: 'Stranger' });
    await expect(as(admin, (tx) => updateMemberDetails(tx, admin, { userId: stranger.id, name: 'Hacked', title: null, phone: null }))).rejects.toMatchObject({ code: 'not_found' });
    expect((await row(stranger.id))?.name).toBe('Stranger');
  });
});

describe('email change', () => {
  const request = async (email = 'karan.new@kestrelsystems.in') => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrelsystems.in' });
    const requested = await as(admin, (tx) => requestEmailChange(tx, admin, { userId: member.id, email }, clock));
    return { partner, admin, member, requested };
  };
  const confirm = (token: string, at = clock) => withSystem(actor, (tx) => confirmEmailChange(tx, actor, token, at));

  it('changes the email only after the link is used, and the link works once', async () => {
    const { member, requested } = await request();
    expect((await row(member.id))?.email).toBe('karan@kestrelsystems.in');
    expect(await withSystem(actor, (tx) => previewEmailChange(tx, actor, requested.token, clock))).toMatchObject({ state: 'ok', newEmail: 'karan.new@kestrelsystems.in' });
    const done = await confirm(requested.token);
    expect(done).toMatchObject({ oldEmail: 'karan@kestrelsystems.in', newEmail: 'karan.new@kestrelsystems.in' });
    expect((await row(member.id))?.email).toBe('karan.new@kestrelsystems.in');
    await expect(confirm(requested.token)).rejects.toMatchObject({ reason: 'email_change_used' });
    expect(await withSystem(actor, (tx) => previewEmailChange(tx, actor, requested.token, clock))).toEqual({ state: 'used' });
  });

  it('expires after 24 hours', async () => {
    const { requested } = await request();
    const late = fixedClock('2026-11-24T10:00:01Z');
    await expect(confirm(requested.token, late)).rejects.toMatchObject({ reason: 'email_change_expired' });
    expect(await withSystem(actor, (tx) => previewEmailChange(tx, actor, requested.token, late))).toEqual({ state: 'expired' });
  });

  it('knows nothing about a made up token', async () => {
    await request();
    await expect(confirm('nope')).rejects.toMatchObject({ reason: 'email_change_unknown' });
    expect(await withSystem(actor, (tx) => previewEmailChange(tx, actor, 'nope', clock))).toEqual({ state: 'unknown' });
  });

  it('refuses an address that is already used, when asked and when confirmed', async () => {
    const { partner, admin, member, requested } = await request();
    await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'taken@kestrelsystems.in' });
    await expect(as(admin, (tx) => requestEmailChange(tx, admin, { userId: member.id, email: 'Taken@kestrelsystems.in' }, clock))).rejects.toMatchObject({ reason: 'email_taken' });
    // Someone claims the address between the request and the click.
    await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan.new@kestrelsystems.in' });
    await expect(confirm(requested.token)).rejects.toMatchObject({ reason: 'email_taken' });
    expect((await row(member.id))?.email).toBe('karan@kestrelsystems.in');
  });

  it('refuses a malformed or unchanged address', async () => {
    const { admin, member } = await request();
    await expect(as(admin, (tx) => requestEmailChange(tx, admin, { userId: member.id, email: 'not an email' }, clock))).rejects.toMatchObject({ code: 'validation' });
    await expect(as(admin, (tx) => requestEmailChange(tx, admin, { userId: member.id, email: 'KARAN@kestrelsystems.in' }, clock))).rejects.toMatchObject({ code: 'validation' });
  });

  it('a newer request cancels the older link', async () => {
    const { admin, member, requested } = await request();
    const second = await as(admin, (tx) => requestEmailChange(tx, admin, { userId: member.id, email: 'k2@kestrelsystems.in' }, clock));
    await expect(confirm(requested.token)).rejects.toMatchObject({ reason: 'email_change_expired' });
    await confirm(second.token);
    expect((await row(member.id))?.email).toBe('k2@kestrelsystems.in');
  });

  it('is limited to the admin of the same company', async () => {
    const { admin } = await company();
    const stranger = await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'sales' });
    await expect(as(admin, (tx) => requestEmailChange(tx, admin, { userId: stranger.id, email: 'x@kestrelsystems.in' }, clock))).rejects.toMatchObject({ code: 'not_found' });
    expect(await db.select().from(emailChangeRequests)).toHaveLength(0);
  });
});

describe('reactivateMember', () => {
  it('brings a removed person back as an invited person with a fresh invite', async () => {
    const { partner, admin } = await company();
    const gone = await makeUser(db, { partnerId: partner.id, role: 'technical', name: 'Vikram Sethi', status: 'disabled' });
    const result = await as(admin, (tx) => reactivateMember(tx, admin, { userId: gone.id }, clock));
    expect(result.created.invite).toMatchObject({ email: gone.email, role: 'technical' });
    expect(await row(gone.id)).toMatchObject({ status: 'invited', removedAt: null });
    const [invite] = await db.select().from(invites).where(eq(invites.email, gone.email));
    expect(invite?.name).toBe('Vikram Sethi');
  });

  it('only works on a removed person of the same company', async () => {
    const { partner, admin } = await company();
    const live = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    await expect(as(admin, (tx) => reactivateMember(tx, admin, { userId: live.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    const other = await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'sales', status: 'disabled' });
    await expect(as(admin, (tx) => reactivateMember(tx, admin, { userId: other.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    expect((await row(other.id))?.status).toBe('disabled');
  });
});

describe('moveDeals', () => {
  it('moves registered_by, not the status, and a sales user sees the deal under the new owner', async () => {
    const { partner, admin } = await company();
    const leaving = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const heir = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: leaving.id });
    const heirViewer = await viewerFor(db, heir);
    expect(await as(heirViewer, (tx) => listRegistrations(tx, heirViewer, {}))).toHaveLength(0);

    await as(admin, async (tx) => {
      await removeMember(tx, admin, { userId: leaving.id }, clock);
      const moved = await moveDeals(tx, admin, { fromUserId: leaving.id, toUserId: heir.id });
      expect(moved.moved).toBe(1);
    });
    const [after] = await db.select().from(registrations).where(eq(registrations.id, deal.id));
    expect(after).toMatchObject({ registeredBy: heir.id, status: deal.status });
    expect(await as(heirViewer, (tx) => listRegistrations(tx, heirViewer, {}))).toHaveLength(1);
  });

  it('refuses a technical user, a removed user, the same person and another company', async () => {
    const { partner, admin } = await company();
    const from = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const technical = await makeUser(db, { partnerId: partner.id, role: 'technical' });
    const removed = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    const foreign = await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'sales' });
    for (const to of [technical.id, removed.id, foreign.id]) {
      await expect(as(admin, (tx) => moveDeals(tx, admin, { fromUserId: from.id, toUserId: to }))).rejects.toMatchObject({ code: 'validation' });
    }
    await expect(as(admin, (tx) => moveDeals(tx, admin, { fromUserId: from.id, toUserId: from.id }))).rejects.toMatchObject({ code: 'validation' });
    await expect(as(admin, (tx) => moveDeals(tx, admin, { fromUserId: foreign.id, toUserId: from.id }))).rejects.toMatchObject({ code: 'not_found' });
  });
});
