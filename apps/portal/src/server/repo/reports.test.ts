import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners, users } from '@/db/schema';
import { seedMockData } from '@/db/fixtures';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getAdminReports } from './reports';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

describe('getAdminReports on the seed', () => {
  it('shows the computed figures, not the mock\'s hard coded ones', async () => {
    await seedMockData(db, { clock });
    const manager = await asStaff(db, 'partner_manager', 'all');
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.totalPartners).toBe(21);
    expect(report.totalRegistered).toBe(15);
    expect(report.partners).toHaveLength(21);
    const kestrel = report.partners.find((p) => p.name === 'Kestrel Systems');
    expect(kestrel).toMatchObject({ category: 'channel', region: 'india', registered: 10, waiting: 2, accepted: 7, rejected: 1, won: 2, protectedNow: 3 });
    expect(report.products.reduce((n, p) => n + p.registered, 0)).toBe(15);
    expect(report.products.map((p) => p.product)).toEqual(['images', 'libraries', 'cleansight']);
    expect(report.followUps.map((f) => f.name)).toEqual(expect.arrayContaining(['Qamar Solutions', 'Meghdoot Systems', 'Ironleaf Consulting']));
    expect(report.followUps.find((f) => f.name === 'Ironleaf Consulting')).toMatchObject({ status: 'inactive' });
  });
});

describe('getAdminReports', () => {
  it('counts every status the way the report defines it', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { name: 'Acme', category: 'channel', region: 'middle_east' });
    const add = (status: NonNullable<Parameters<typeof makeRegistration>[1]['status']>, n: number, product: 'images' | 'libraries' | 'cleansight' = 'images') =>
      Promise.all(Array.from({ length: n }, (_, i) => makeRegistration(db, { partnerId: partner.id, customerName: `${status}-${product}-${i}`, product, status })));
    await add('pending', 1);
    await add('accepted', 2, 'libraries');
    await add('won', 1, 'cleansight');
    await add('lost', 1);
    await add('expired', 1);
    await add('rejected', 2);
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.partners.find((p) => p.partnerId === partner.id)).toEqual({
      partnerId: partner.id, name: 'Acme', category: 'channel', region: 'middle_east',
      registered: 8, waiting: 1, accepted: 5, rejected: 2, won: 1, protectedNow: 2,
    });
    expect(report.products).toEqual([
      { product: 'images', registered: 5, accepted: 2, won: 0 },
      { product: 'libraries', registered: 2, accepted: 2, won: 0 },
      { product: 'cleansight', registered: 1, accepted: 1, won: 1 },
    ]);
    expect(report.totalRegistered).toBe(8);
  });

  it('counts protected deals ending in the next 14 days', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-20' });
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-21' });
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-06' });
    await makeRegistration(db, { status: 'pending', protectionEnd: '2026-11-10' });
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.expiringIn14Days).toBe(2);
  });

  it('builds the follow up reasons from real dates', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const invited = await makePartner(db, { name: 'Qamar Solutions', status: 'onboarding' });
    await makeInvite(db, { partnerId: invited.id, kind: 'partner', role: 'partner_admin', email: 'yasmin@qamar.example', createdAt: new Date('2026-10-27T09:00:00Z') });
    const agreed = await makePartner(db, { name: 'Meghdoot Systems', status: 'onboarding' });
    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-10-30T09:00:00Z') }).where(eq(partners.id, agreed.id));
    const idle = await makePartner(db, { name: 'Ironleaf Consulting', status: 'inactive' });
    const person = await makeUser(db, { partnerId: idle.id, role: 'partner_admin' });
    await db.update(users).set({ lastLoginAt: new Date('2026-08-02T09:00:00Z') }).where(eq(users.id, person.id));
    const silent = await makePartner(db, { name: 'Silent Co', status: 'inactive' });
    await makePartner(db, { name: 'Active Co', status: 'active' });
    await makePartner(db, { name: 'Suspended Co', status: 'suspended' });
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.followUps).toEqual([
      { partnerId: agreed.id, name: 'Meghdoot Systems', why: 'Agreement accepted 30 Oct, no deal registered yet', status: 'onboarding' },
      { partnerId: invited.id, name: 'Qamar Solutions', why: 'Invited 27 Oct, has not accepted the agreement', status: 'onboarding' },
      { partnerId: idle.id, name: 'Ironleaf Consulting', why: 'No sign-in since 2 Aug', status: 'inactive' },
      { partnerId: silent.id, name: 'Silent Co', why: 'No sign-in yet', status: 'inactive' },
    ]);
  });

  it('limits staff sales to their region and refuses partners and marketing', async () => {
    const india = await makePartner(db, { name: 'India Co', region: 'india' });
    const gulf = await makePartner(db, { name: 'Gulf Co', region: 'middle_east' });
    await makeRegistration(db, { partnerId: india.id, region: 'india' });
    await makeRegistration(db, { partnerId: india.id, region: 'middle_east' });
    await makeRegistration(db, { partnerId: gulf.id, region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'india');
    const report = await withViewer(sales, (tx) => getAdminReports(tx, sales, clock));
    expect(report.partners.map((p) => [p.name, p.registered])).toEqual([['India Co', 1]]);
    expect(report.totalPartners).toBe(1);
    expect(report.totalRegistered).toBe(1);
    const partner = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(partner, (tx) => getAdminReports(tx, partner, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => getAdminReports(tx, marketing, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
