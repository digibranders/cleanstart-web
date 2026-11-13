import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessRequests, registrations } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeDocument, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getPartnerOverview } from './overview';

const db = testDb();
const clock = fixedClock('2026-11-06T14:20:00Z');
beforeEach(() => resetDb(db));

const seedKestrel = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
  const reg = (over: Parameters<typeof makeRegistration>[1]) => makeRegistration(db, { partnerId: partner.id, ...over });
  await reg({ customerName: 'Vardhan Capital', product: 'libraries', status: 'pending', registeredOn: '2026-11-04', registeredBy: adminUser.id });
  const gulfway = await reg({ customerName: 'Gulfway Freight', product: 'images', status: 'pending', registeredOn: '2026-11-02', registeredBy: salesUser.id });
  await reg({ customerName: 'Tejas Health Network', product: 'cleansight', status: 'accepted', protectionEnd: '2026-11-15', registeredBy: adminUser.id });
  await reg({ customerName: 'Al Noor Logistics', product: 'libraries', status: 'accepted', protectionEnd: '2026-12-21', registeredBy: salesUser.id });
  await reg({ customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', protectionEnd: '2027-01-12', registeredBy: adminUser.id });
  await reg({ customerName: 'Indus Paytech', product: 'images', status: 'won', closedOn: '2026-09-19', registeredBy: adminUser.id });
  await reg({ customerName: 'Kaveri Biotech', product: 'images', status: 'won', closedOn: '2026-08-11', registeredBy: salesUser.id });
  await reg({ customerName: 'Won Last Year', product: 'images', status: 'won', closedOn: '2025-12-31' });
  const recentlyRejected = await reg({ customerName: 'Saffron Retail Group', product: 'images', status: 'rejected', registeredBy: salesUser.id });
  await db.update(registrations).set({ decidedAt: new Date('2026-11-04T10:00:00Z') }).where(eq(registrations.id, recentlyRejected.id));
  const oldRejected = await reg({ customerName: 'Old Rejection', product: 'images', status: 'rejected' });
  await db.update(registrations).set({ decidedAt: new Date('2026-09-10T10:00:00Z') }).where(eq(registrations.id, oldRejected.id));
  return { partner, adminUser, salesUser, gulfway };
};

describe('getPartnerOverview', () => {
  it('computes the four figures and the lists for a partner admin', async () => {
    const { adminUser } = await seedKestrel();
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.ownDealsOnly).toBe(false);
    expect(o.waiting).toEqual({ count: 2, oldestDays: 4 });
    expect(o.protectedNow).toEqual({ count: 3, byProduct: [{ product: 'cleansight', count: 2 }, { product: 'libraries', count: 1 }] });
    expect(o.expiring14).toEqual({ count: 1, customers: ['Tejas Health Network'] });
    expect(o.wonThisYear).toEqual({ count: 2, customers: ['Indus Paytech', 'Kaveri Biotech'] });
    expect(o.recent).toHaveLength(7);
    expect(o.recent.every((r) => ['pending', 'accepted', 'won'].includes(r.status))).toBe(true);
    const days = o.recent.map((r) => r.registeredOn);
    expect(days).toEqual([...days].sort().reverse());
  });

  it('lists what needs attention in the mock\'s order, with the mock\'s wording', async () => {
    const { partner, adminUser } = await seedKestrel();
    await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit.desai@kestrel.example', name: 'Rohit Desai', requestedRole: 'sales', createdAt: new Date('2026-11-06T09:00:00Z') });
    await makeInvite(db, { partnerId: partner.id, kind: 'partner', role: 'sales', email: 'vikram.sethi@kestrel.example', createdAt: new Date('2026-11-05T09:00:00Z'), expiresAt: new Date('2026-11-12T09:00:00Z') });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.attention.map((a) => [a.kind, a.title, a.meta])).toEqual([
      ['access_request', 'Rohit Desai asked for a login', 'Sales, asked today'],
      ['expiring', 'Tejas Health Network expires in 9 days', 'CleanSight, protected until 15 Nov'],
      ['late', 'Gulfway Freight waiting 4 days', 'CleanStart Images, sent 2 Nov'],
      ['declined', 'Saffron Retail Group was not accepted', 'CleanStart Images, see the reason and resubmit'],
      ['invite_pending', 'vikram.sethi@kestrel.example has not accepted invite', 'Sales, invited 5 Nov'],
    ]);
    expect(o.attention.map((a) => a.href)).toEqual([
      '/partner/team', expect.stringMatching(/^\/partner\/deals\/[0-9a-f-]{36}$/), '/partner/deals', '/partner/deals', '/partner/team',
    ]);
    expect(new Set(o.attention.map((a) => a.key)).size).toBe(5);
  });

  it('shows a salesperson only their own deals, with no team items', async () => {
    const { partner, salesUser } = await seedKestrel();
    await makeAccessRequest(db, { partnerId: partner.id, email: 'x@kestrel.example', name: 'X', requestedRole: 'sales' });
    const sales = await viewerFor(db, salesUser);
    const o = await withViewer(sales, (tx) => getPartnerOverview(tx, sales, clock));
    expect(o.ownDealsOnly).toBe(true);
    expect(o.waiting.count).toBe(1);
    expect(o.protectedNow.count).toBe(1);
    expect(o.wonThisYear.customers).toEqual(['Kaveri Biotech']);
    expect(o.attention.map((a) => a.kind)).toEqual(['late', 'declined']);
    expect(o.recent.every((r) => r.registeredById === sales.id)).toBe(true);
    expect(await db.select().from(accessRequests)).toHaveLength(1);
  });

  it('never includes another company\'s deals and is not for the technical role or staff', async () => {
    const { adminUser } = await seedKestrel();
    await makeRegistration(db, { customerName: 'Other Company Customer', status: 'accepted', protectionEnd: '2026-11-10' });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.expiring14.customers).toEqual(['Tejas Health Network']);
    expect(o.recent.some((r) => r.customer === 'Other Company Customer')).toBe(false);
    const technical = await asPartner(db, { role: 'technical' });
    await expect(withViewer(technical, (tx) => getPartnerOverview(tx, technical, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const staff = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(staff, (tx) => getPartnerOverview(tx, staff, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns the recently added documents the audience allows', async () => {
    const { adminUser } = await seedKestrel();
    await makeDocument(db, { title: 'CleanSight product walkthrough', type: 'video', durationMinutes: 14, updatedAt: new Date('2026-11-04T10:00:00Z'), fileKey: 'seed/walkthrough.mp4' });
    await makeDocument(db, { title: 'Old datasheet', updatedAt: new Date('2026-06-01T10:00:00Z'), fileKey: 'seed/old.pdf' });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.newDocuments.map((d) => d.title)).toEqual(['CleanSight product walkthrough']);
  });
});
