import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites, staffRegions, staffScopes, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { withViewer } from './context';
import { changeStaffRegions, changeStaffRole, listManagerOptions, listStaff, removeStaff } from './staff';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const future = new Date('2099-01-01T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('listStaff', () => {
  it('lists people with their region, the partners a manager manages, and invited teammates', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    await makePartner(db, { name: 'Saffron Secure', managerId: gaurav.id });
    await makePartner(db, { name: 'Kestrel Systems', managerId: gaurav.id });
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    await makeUser(db, { kind: 'staff', role: 'sales', status: 'disabled', region: 'india' });
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    const list = await withViewer(gaurav, (tx) => listStaff(tx, gaurav));
    expect(list.map((p) => [p.name, p.role, p.regions, p.status, p.isYou])).toEqual([
      [gaurav.name, 'partner_manager', ['india'], 'active', true],
      ['Rahul Menon', 'sales', ['india'], 'active', false],
      ['Kunal Shah', 'sales', ['india'], 'invited', false],
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
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav' });
    const gulf = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', status: 'disabled' });
    const partner = await asPartner(db, { role: 'sales' });
    const options = await withViewer(partner, (tx) => listManagerOptions(tx, partner));
    expect(options).toEqual([
      { id: india.id, name: 'Gaurav Jadhav', regions: ['india'], team: 'CleanStart India' },
      { id: gulf.id, name: 'Omar Nasser', regions: ['middle_east'], team: 'CleanStart Middle East' },
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

  it('still lists the partners a demoted manager manages, so the screen can warn that they need a new manager', async () => {
    const stays = await asStaff(db, 'partner_manager', 'india');
    const demoted = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    await makePartner(db, { name: 'Dunes Networks', managerId: demoted.id });
    await makePartner(db, { name: 'Harbourline', managerId: demoted.id });
    const changed = await withViewer(stays, (tx) => changeStaffRole(tx, stays, { userId: demoted.id, role: 'sales' }));
    expect(changed).toMatchObject({ role: 'sales', partners: ['Dunes Networks', 'Harbourline'] });
  });

  it('does not find a person who is only invited', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    await expect(withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: invite.id, role: 'marketing' }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('changeStaffRegions', () => {
  it('changes the scope row and the region rows', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const changed = await withViewer(manager, (tx) => changeStaffRegions(tx, manager, { userId: rahul.id, regions: ['middle_east'] }));
    expect(changed.regions).toEqual(['middle_east']);
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, rahul.id));
    expect(scope?.region).toBe('middle_east');
    expect((await db.select().from(staffRegions).where(eq(staffRegions.userId, rahul.id))).map((r) => r.regionKey)).toEqual(['middle_east']);
  });

  it('covers several regions in list order, then every region with no rows left', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    const two = await withViewer(manager, (tx) => changeStaffRegions(tx, manager, { userId: omar.id, regions: ['eu', 'middle_east'] }));
    expect(two.regions).toEqual(['middle_east', 'eu']);
    expect((await viewerFor(db, omar)).regions).toEqual(['middle_east', 'eu']);
    const all = await withViewer(manager, (tx) => changeStaffRegions(tx, manager, { userId: omar.id, regions: 'all' }));
    expect(all.regions).toBe('all');
    expect(await db.select().from(staffRegions).where(eq(staffRegions.userId, omar.id))).toEqual([]);
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, omar.id));
    expect(scope?.region).toBe('all');
  });

  it('refuses a region that does not exist and an empty list', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(withViewer(manager, (tx) => changeStaffRegions(tx, manager, { userId: rahul.id, regions: ['atlantis'] }))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(manager, (tx) => changeStaffRegions(tx, manager, { userId: rahul.id, regions: [] }))).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('removeStaff', () => {
  it('withdraws the open invite of a teammate who was only invited, so the invite link and the row both go', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const pending = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', status: 'invited', email: 'kunal.shah@cleanstart.com' });
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: pending.email, expiresAt: future });
    await withViewer(manager, (tx) => removeStaff(tx, manager, { userId: pending.id }, clock));
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.revokedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const list = await withViewer(manager, (tx) => listStaff(tx, manager));
    expect(list.map((p) => p.email)).toEqual([manager.email]);
  });

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
