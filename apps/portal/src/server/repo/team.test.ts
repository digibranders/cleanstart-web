import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessRequests, invites, registrations, users } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken } from '@/server/auth/tokens';
import { publicActor } from '@/server/auth/types';
import { type Tx, withSystem, withViewer } from './context';
import { changeMemberRole, createAccessRequest, decideAccessRequest, getTeam, removeMember } from './team';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Rohit Desai');
const future = new Date('2099-01-01T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  return { partner, admin };
};
const as = <T>(viewer: Parameters<typeof withViewer>[0], fn: (tx: Tx) => Promise<T>) => withViewer(viewer, fn);

describe('getTeam', () => {
  it('lists people, invited colleagues, deal counts and open requests for the viewer', async () => {
    const { partner, admin } = await company();
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    await makeRegistration(db, { partnerId: partner.id, registeredBy: sales.id });
    await makeRegistration(db, { partnerId: partner.id, registeredBy: sales.id });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai', note: 'I lead the Mumbai sales team.' });
    await makeAccessRequest(db, { partnerId: partner.id, email: 'old@kestrelsystems.in', name: 'Old', status: 'declined' });
    const team = await as(admin, (tx) => getTeam(tx, admin, {}));
    expect(team).toMatchObject({ partnerId: partner.id, partnerName: 'Kestrel Systems' });
    expect(team.members.map((m) => [m.name, m.status, m.isYou, m.deals])).toEqual([
      [admin.name, 'active', true, 0],
      ['Karan Malhotra', 'active', false, 2],
      ['Vikram Sethi', 'invited', false, 0],
    ]);
    expect(team.members[2]?.inviteId).toBe(team.members[2]?.id);
    expect(team.requests).toEqual([
      expect.objectContaining({ name: 'Rohit Desai', email: 'rohit@kestrelsystems.in', note: 'I lead the Mumbai sales team.', role: 'sales', status: 'open' }),
    ]);
  });

  it('refuses another partner id for a partner viewer and needs one for staff', async () => {
    const { admin } = await company();
    const other = await makePartner(db, {});
    await expect(as(admin, (tx) => getTeam(tx, admin, { partnerId: other.id }))).rejects.toMatchObject({ code: 'not_found' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(as(manager, (tx) => getTeam(tx, manager, {}))).rejects.toMatchObject({ code: 'validation' });
    expect((await as(manager, (tx) => getTeam(tx, manager, { partnerId: other.id }))).partnerId).toBe(other.id);
  });
});

describe('changeMemberRole', () => {
  it('changes a role and returns the member', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const changed = await as(admin, (tx) => changeMemberRole(tx, admin, { userId: member.id, role: 'technical' }));
    expect(changed).toMatchObject({ id: member.id, role: 'technical' });
  });

  it('never demotes the last partner admin, but can once another admin exists', async () => {
    const { partner, admin } = await company();
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: admin.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'last_admin' });
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: admin.id, role: 'sales' }))).resolves.toMatchObject({ role: 'sales' });
  });

  it('cannot reach a person at another company', async () => {
    const { admin } = await company();
    const otherPartner = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: otherPartner.id, role: 'sales' });
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: stranger.id, role: 'technical' }))).rejects.toMatchObject({ code: 'not_found' });
    const [row] = await db.select().from(users).where(eq(users.id, stranger.id));
    expect(row?.role).toBe('sales');
  });
});

describe('removeMember', () => {
  it('disables the person, stamps removed_at and leaves their deals with the company', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan', email: 'karan@k.example' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: member.id });
    const removed = await as(admin, (tx) => removeMember(tx, admin, { userId: member.id }, clock));
    expect(removed).toEqual({ userId: member.id, name: 'Karan', email: 'karan@k.example', role: 'sales', partnerId: partner.id });
    const [row] = await db.select().from(users).where(eq(users.id, member.id));
    expect(row?.status).toBe('disabled');
    expect(row?.removedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const [kept] = await db.select().from(registrations).where(eq(registrations.id, deal.id));
    expect(kept?.partnerId).toBe(partner.id);
    expect(kept?.registeredBy).toBe(member.id);
  });

  it('refuses removing yourself and a person at another company', async () => {
    const { admin } = await company();
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: admin.id }, clock))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const other = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: other.id, role: 'sales' });
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: stranger.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('removes an admin while another remains, and refuses to remove the last admin even for a partner manager', async () => {
    const { partner, admin } = await company();
    const second = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: second.id }, clock))).resolves.toMatchObject({ userId: second.id });
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(as(manager, (tx) => removeMember(tx, manager, { userId: admin.id }, clock))).rejects.toMatchObject({ reason: 'last_admin' });
  });
});

describe('createAccessRequest', () => {
  const ask = (email: string, name = 'Rohit Desai', note: string | null = 'Hello') =>
    withSystem(actor, (tx) => createAccessRequest(tx, actor, { email, name, note }, clock));

  it('matches the email domain to a partner, creates one open request and returns the active admins', async () => {
    const { partner, admin } = await company();
    const result = await ask('Rohit.Desai@KestrelSystems.in');
    expect(result).toMatchObject({ matched: true, partnerId: partner.id, partnerName: 'Kestrel Systems', adminRecipients: [{ userId: admin.id, email: admin.email, name: admin.name }] });
    const rows = await db.select().from(accessRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: 'rohit.desai@kestrelsystems.in', status: 'open', requestedRole: 'sales', note: 'Hello' });
  });

  it('asking twice keeps one open request and does not notify the admins again', async () => {
    await company();
    await ask('rohit@kestrelsystems.in', 'Rohit', 'first');
    const again = await ask('rohit@kestrelsystems.in', 'Rohit D', 'second');
    expect(again).toMatchObject({ matched: true, adminRecipients: [] });
    const rows = await db.select().from(accessRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Rohit D', note: 'second' });
  });

  it('creates nothing for an unknown domain, a suspended partner or an email that already has a login', async () => {
    const { partner } = await company();
    await makePartner(db, { domain: 'suspended.example', status: 'suspended' });
    expect(await ask('someone@unknown.example')).toEqual({ matched: false, partnerId: null, partnerName: null, requestId: null, adminRecipients: [] });
    expect((await ask('someone@suspended.example')).matched).toBe(false);
    await makeUser(db, { partnerId: partner.id, email: 'has.login@kestrelsystems.in' });
    expect((await ask('has.login@kestrelsystems.in')).matched).toBe(false);
    expect(await db.select().from(accessRequests)).toHaveLength(0);
  });
});

describe('decideAccessRequest', () => {
  it('approving creates an invite for the chosen role and returns the token once', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'technical' }, clock));
    expect(result.request).toMatchObject({ id: request.id, status: 'approved', role: 'sales' });
    expect(result.invite?.invite).toMatchObject({ email: 'rohit@kestrelsystems.in', role: 'technical', kind: 'partner', partnerId: partner.id });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite?.invite.id ?? ''));
    expect(row?.tokenHash).toBe(hashToken(result.invite?.token ?? ''));
    const [saved] = await db.select().from(accessRequests).where(eq(accessRequests.id, request.id));
    expect(saved).toMatchObject({ status: 'approved', decidedBy: admin.id });
  });

  it('declining only closes the request', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock));
    expect(result).toMatchObject({ request: { status: 'declined' }, invite: null });
    expect(await db.select().from(invites)).toHaveLength(0);
  });

  it('is single use, never grants partner admin, and cannot touch another company', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'partner_admin' as unknown as 'sales' }, clock))).rejects.toMatchObject({ code: 'validation' });
    await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock));
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock))).rejects.toMatchObject({ reason: 'already_decided' });
    const other = await makePartner(db, {});
    const foreign = await makeAccessRequest(db, { partnerId: other.id, email: 'x@other.example', name: 'X' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: foreign.id, decision: 'decline' }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('refuses to approve when the person has meanwhile got a login', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    await makeUser(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'sales' }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
  });
});
