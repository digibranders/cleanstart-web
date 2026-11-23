import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notifications, users } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { NotFoundError } from '@/server/errors';
import { getShell } from './account';
import { withViewer } from './context';

beforeEach(async () => {
  await resetDb(testDb());
});

const shellOf = async (userId: string) => {
  const db = testDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('test helper: user not found');
  const viewer = await viewerFor(db, user);
  return withViewer(viewer, (tx) => getShell(tx, viewer));
};

describe('getShell, partner viewer', () => {
  it('names the company, the role and the manager for the Message drawer', async () => {
    const db = testDb();
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { name: 'Qamar Solutions', region: 'middle_east', category: 'channel', managerId: manager.id });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Yasmin Haddad' });

    expect(await shellOf(admin.id)).toEqual({
      viewerId: admin.id,
      viewerName: 'Yasmin Haddad',
      viewerEmail: admin.email,
      kind: 'partner',
      roleLabel: 'Partner admin',
      orgName: 'Qamar Solutions',
      orgSub: 'Channel partner, Middle East',
      partnerRegion: 'middle_east',
      manager: { id: manager.id, name: 'Omar Nasser', email: manager.email, team: 'CleanStart Middle East' },
      waitingApprovals: 0,
      unreadNotifications: 0,
    });
  });

  it('has no manager when none is set, when the manager is disabled, and calls an all region manager plain CleanStart', async () => {
    const db = testDb();
    const noManager = await makePartner(db, {});
    const adminA = await makeUser(db, { partnerId: noManager.id });
    expect((await shellOf(adminA.id)).manager).toBeNull();

    const disabled = await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'disabled' });
    const partnerB = await makePartner(db, { managerId: disabled.id });
    const adminB = await makeUser(db, { partnerId: partnerB.id });
    expect((await shellOf(adminB.id)).manager).toBeNull();

    const wide = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    const partnerC = await makePartner(db, { managerId: wide.id });
    const adminC = await makeUser(db, { partnerId: partnerC.id });
    expect((await shellOf(adminC.id)).manager?.team).toBe('CleanStart');
  });

  it('counts only the unread notifications of the viewer', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    const [me, other] = [await makeUser(db, { partnerId: partner.id }), await makeUser(db, { partnerId: partner.id })];
    const row = (userId: string, readAt: Date | null) => ({ userId, kind: 'document_new' as const, title: 'New document', readAt });
    await db.insert(notifications).values([row(me.id, null), row(me.id, null), row(me.id, new Date()), row(other.id, null)]);
    expect((await shellOf(me.id)).unreadNotifications).toBe(2);
  });

  it('shows no waiting approvals to a partner', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    await makeRegistration(db, { partnerId: partner.id, status: 'pending' });
    const admin = await makeUser(db, { partnerId: partner.id });
    expect((await shellOf(admin.id)).waitingApprovals).toBe(0);
  });

  it('refuses a forged company, which is what the isolation entry probes', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: partner.id });
    const viewer = await viewerFor(db, admin);
    if (viewer.kind !== 'partner') throw new Error('expected a partner viewer');
    await expect(
      withViewer(viewer, (tx) => getShell(tx, { ...viewer, partnerId: '00000000-0000-0000-0000-000000000000' })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('getShell, staff viewer', () => {
  const seedQueue = async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'middle_east', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'accepted' });
  };

  it('counts the pending registrations in the staff scope for the nav badge', async () => {
    await seedQueue();
    const db = testDb();
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav' });
    const all = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'middle_east' });
    expect((await shellOf(india.id)).waitingApprovals).toBe(2);
    expect((await shellOf(all.id)).waitingApprovals).toBe(3);
    expect((await shellOf(sales.id)).waitingApprovals).toBe(1);
  });

  it('labels the role with the region and names CleanStart as the organisation', async () => {
    const db = testDb();
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav' });
    const all = await makeUser(db, { kind: 'staff', role: 'marketing', region: 'all' });
    expect(await shellOf(india.id)).toMatchObject({
      roleLabel: 'Partner manager, India',
      orgName: 'CleanStart',
      orgSub: 'Partnerships',
      manager: null,
      kind: 'staff',
    });
    expect((await shellOf(all.id)).roleLabel).toBe('Marketing');
  });

  it('shows marketing no approvals count', async () => {
    await seedQueue();
    const marketing = await makeUser(testDb(), { kind: 'staff', role: 'marketing', region: 'all' });
    expect((await shellOf(marketing.id)).waitingApprovals).toBe(0);
  });
});
