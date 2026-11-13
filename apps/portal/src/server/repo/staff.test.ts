import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites, staffScopes, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { withViewer } from './context';
import { changeStaffRegion, changeStaffRole, listManagerOptions, listStaff, removeStaff } from './staff';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const future = new Date('2099-01-01T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('listStaff', () => {
  it('lists people with their region, the partners a manager manages, and invited teammates', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    await makePartner(db, { name: 'Saffron Secure', managerId: farhan.id });
    await makePartner(db, { name: 'Kestrel Systems', managerId: farhan.id });
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    await makeUser(db, { kind: 'staff', role: 'sales', status: 'disabled', region: 'india' });
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    const list = await withViewer(farhan, (tx) => listStaff(tx, farhan));
    expect(list.map((p) => [p.name, p.role, p.region, p.status, p.isYou])).toEqual([
      [farhan.name, 'partner_manager', 'india', 'active', true],
      ['Rahul Menon', 'sales', 'india', 'active', false],
      ['Kunal Shah', 'sales', 'india', 'invited', false],
    ]);
    expect(list[0]?.partners).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(list[1]).toMatchObject({ id: rahul.id, partners: [], inviteId: null });
    expect(list[2]).toMatchObject({ id: invite.id, inviteId: invite.id, lastActiveAt: null });
  });

  it('is for staff only', async () => {
    const viewer = await asPartner(db, {});
    await expect(withViewer(viewer, (tx) => listStaff(tx, viewer))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('listManagerOptions', () => {
  it('offers the active partner managers with their team, to partners and staff alike', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const gulf = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', status: 'disabled' });
    const partner = await asPartner(db, { role: 'sales' });
    const options = await withViewer(partner, (tx) => listManagerOptions(tx, partner));
    expect(options).toEqual([
      { id: india.id, name: 'Farhan Qureshi', region: 'india', team: 'CleanStart India' },
      { id: gulf.id, name: 'Omar Nasser', region: 'middle_east', team: 'CleanStart Middle East' },
    ]);
  });
});

describe('changeStaffRole', () => {
  it('changes a teammate\'s role and returns them', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const changed = await withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: rahul.id, role: 'marketing' }));
    expect(changed).toMatchObject({ id: rahul.id, role: 'marketing' });
  });

  it('cannot change your own role, and a partner cannot call it', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: manager.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const lone = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const partner = await asPartner(db, {});
    await expect(withViewer(partner, (tx) => changeStaffRole(tx, partner, { userId: lone.id, role: 'sales' }))).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('refuses to demote the last active partner manager', async () => {
    const sole = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const actor = await asStaff(db, 'sales', 'india');
    await expect(withViewer(actor, (tx) => changeStaffRole(tx, actor, { userId: sole.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'last_partner_manager' });
  });

  it('does not find a person who is only invited', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    await expect(withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: invite.id, role: 'marketing' }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('changeStaffRegion', () => {
  it('changes the scope row', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const changed = await withViewer(manager, (tx) => changeStaffRegion(tx, manager, { userId: rahul.id, region: 'middle_east' }));
    expect(changed.region).toBe('middle_east');
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, rahul.id));
    expect(scope?.region).toBe('middle_east');
  });
});

describe('removeStaff', () => {
  it('disables a teammate and stamps removed_at', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    const removed = await withViewer(manager, (tx) => removeStaff(tx, manager, { userId: rahul.id }, clock));
    expect(removed).toEqual({ userId: rahul.id, name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    const [row] = await db.select().from(users).where(eq(users.id, rahul.id));
    expect(row?.status).toBe('disabled');
    expect(row?.removedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
  });

  it('withdraws the invite when the person has not accepted yet', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    const removed = await withViewer(manager, (tx) => removeStaff(tx, manager, { userId: invite.id }, clock));
    expect(removed).toEqual({ userId: invite.id, name: 'Kunal Shah', email: 'kunal.shah@cleanstart.com' });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.revokedAt).not.toBeNull();
  });

  it('refuses removing yourself, the last partner manager, and an unknown id', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(manager, (tx) => removeStaff(tx, manager, { userId: manager.id }, clock))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const helper = await asStaff(db, 'sales', 'india');
    await expect(withViewer(helper, (tx) => removeStaff(tx, helper, { userId: manager.id }, clock))).rejects.toMatchObject({ reason: 'last_partner_manager' });
    await expect(withViewer(helper, (tx) => removeStaff(tx, helper, { userId: '00000000-0000-0000-0000-000000000001' }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });
});
