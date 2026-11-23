import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, registrations, users } from '@/db/schema';
import {
  asPartner,
  asStaff,
  makeApplication,
  makeDocument,
  makeInvite,
  makePartner,
  makeRegistration,
  makeUser,
  resetDb,
  testDb,
  viewerFor,
} from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { partnerDashboard, staffDashboard } from './dashboard';

const db = testDb();
const clock = fixedClock('2026-11-23T10:00:00Z'); // a Monday
const filters = { period: '90d' } as const;
beforeEach(() => resetDb(db));

const decide = (id: string, at: string) => db.update(registrations).set({ decidedAt: new Date(at) }).where(eq(registrations.id, id));

async function seed() {
  const alpha = await makePartner(db, { name: 'Alpha', region: 'india', status: 'active' });
  const beta = await makePartner(db, { name: 'Beta', region: 'middle_east', status: 'active' });
  const alphaAdmin = await makeUser(db, { partnerId: alpha.id, role: 'partner_admin', name: 'Alpha Admin' });
  const alphaSales = await makeUser(db, { partnerId: alpha.id, role: 'sales', name: 'Alpha Sales' });
  const betaAdmin = await makeUser(db, { partnerId: beta.id, role: 'partner_admin', name: 'Beta Admin' });
  const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', name: 'Mira Manager', region: 'all' });

  const own = await makeRegistration(db, { partnerId: alpha.id, customerName: 'Own Waiting', registeredOn: '2026-11-16', dealValue: 100, registeredBy: alphaAdmin.id, managerId: manager.id, region: 'india' });
  const sales = await makeRegistration(db, { partnerId: alpha.id, customerName: 'Sales Deal', registeredOn: '2026-11-20', dealValue: 300, registeredBy: alphaSales.id, managerId: manager.id, region: 'india' });
  const won = await makeRegistration(db, { partnerId: alpha.id, customerName: 'Won Deal', status: 'won', registeredOn: '2026-10-05', closedOn: '2026-11-10', dealValue: 900, registeredBy: alphaAdmin.id, managerId: manager.id, region: 'india' });
  await decide(won.id, '2026-10-07T09:00:00Z');
  const rejected = await makeRegistration(db, { partnerId: alpha.id, customerName: 'Rejected', status: 'rejected', registeredOn: '2026-10-12', dealValue: 50, registeredBy: alphaAdmin.id, managerId: manager.id, region: 'india' });
  await decide(rejected.id, '2026-10-20T09:00:00Z');
  await makeRegistration(db, { partnerId: beta.id, customerName: 'Beta Secret', registeredOn: '2026-11-18', dealValue: 777_000, registeredBy: betaAdmin.id, region: 'middle_east', status: 'accepted', protectionEnd: '2026-12-01' });
  return { alpha, beta, alphaAdmin, alphaSales, betaAdmin, manager, own, sales, won };
}

describe('partnerDashboard', () => {
  it('shows a partner admin the whole company and nothing of another company', async () => {
    const { alphaAdmin, beta } = await seed();
    const viewer = await viewerFor(db, alphaAdmin);
    // asking for the other company by id changes nothing: the viewer's company is the only scope
    const d = await withViewer(viewer, (tx) => partnerDashboard(tx, viewer, { period: '90d', partnerId: beta.id }, clock));
    expect(d.ownDealsOnly).toBe(false);
    expect(d.kpis.statusCounts).toMatchObject({ pending: 2, won: 1, rejected: 1, accepted: 0 });
    expect(d.kpis.pipeline).toEqual({ count: 2, value: 400 });
    expect(d.kpis.won).toEqual({ count: 1, value: 900 });
    expect(d.kpis.winRate).toBe(1);
    expect(d.waiting.count).toBe(2);
    expect(d.series.topDeals.map((t) => t.customer)).toEqual(['Won Deal', 'Sales Deal', 'Own Waiting']);
    expect(d.expiring14).toEqual([]);
    expect(JSON.stringify(d)).not.toContain('Beta');
    expect(d.team.map((m) => [m.name, m.deals])).toEqual([['Alpha Admin', 3], ['Alpha Sales', 1]]);
    expect(d.series.monthly).toHaveLength(12);
  });

  it('shows partner sales only the deals they registered, and no team table', async () => {
    const { alphaSales } = await seed();
    const viewer = await viewerFor(db, alphaSales);
    const d = await withViewer(viewer, (tx) => partnerDashboard(tx, viewer, filters, clock));
    expect(d.ownDealsOnly).toBe(true);
    expect(d.kpis.statusCounts.pending).toBe(1);
    expect(d.kpis.statusCounts.won).toBe(0);
    expect(d.series.topDeals.map((t) => t.customer)).toEqual(['Sales Deal']);
    expect(d.team).toEqual([]);
  });

  it('applies the period: 30 days leaves out the October deals but keeps the 12 month trend', async () => {
    const { alphaAdmin } = await seed();
    const viewer = await viewerFor(db, alphaAdmin);
    const d = await withViewer(viewer, (tx) => partnerDashboard(tx, viewer, { period: '30d' }, clock));
    expect(d.kpis.statusCounts).toMatchObject({ pending: 2, won: 0, rejected: 0 });
    expect(d.series.monthly.reduce((n, m) => n + m.count, 0)).toBe(4);
  });

  it('counts this company\'s document opens', async () => {
    const { alpha, alphaAdmin } = await seed();
    const doc = await makeDocument(db, { title: 'Battlecard' });
    await db.insert(documentOpens).values([
      { documentId: doc.id, userId: alphaAdmin.id, partnerId: alpha.id },
      { documentId: doc.id, userId: alphaAdmin.id, partnerId: alpha.id },
    ]);
    const viewer = await viewerFor(db, alphaAdmin);
    const d = await withViewer(viewer, (tx) => partnerDashboard(tx, viewer, filters, clock));
    expect(d.mostOpenedDocuments).toEqual([{ id: doc.id, title: 'Battlecard', opens: 2, partners: 1 }]);
  });

  it('refuses technical users and staff', async () => {
    const { alpha } = await seed();
    const technical = await asPartner(db, { partnerId: alpha.id, role: 'technical' });
    await expect(withViewer(technical, (tx) => partnerDashboard(tx, technical, filters, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const staff = await asStaff(db);
    await expect(withViewer(staff, (tx) => partnerDashboard(tx, staff, filters, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('staffDashboard', () => {
  it('gives a partner manager every region, with waiting, overdue and workload', async () => {
    const { manager } = await seed();
    const viewer = await viewerFor(db, manager);
    const d = await withViewer(viewer, (tx) => staffDashboard(tx, viewer, filters, clock));
    expect(d.waiting).toEqual({ count: 2, overdue: 1 }); // Own Waiting (16 Nov) is past 2 business days, Sales Deal (20 Nov) is not
    expect(d.kpis.statusCounts.accepted).toBe(1);
    expect(d.protectedNow).toBe(1);
    expect(d.series.byRegion.map((r) => r.key).sort()).toEqual(['india', 'middle_east']);
    expect(d.expiring14.map((e) => e.customer)).toEqual(['Beta Secret']);
    expect(d.managerWorkload).toEqual([{ managerId: expect.any(String), name: 'Mira Manager', waiting: 2, overdue: 1, decided: 2 }]);
    expect(d.partnerHealth).toEqual({ active: 2, onboarding: 0, inactive: 0 });
    expect(d.topByPipeline[0]?.name).toBe('Beta');
    expect(d.topByWon.map((p) => p.name)).toEqual(['Alpha']);
    expect(d.integrations).toEqual({ pending: 0, failed: 0, lastPollAt: null, lastError: null });
  });

  it('limits staff sales to deals of their region and partners of their region', async () => {
    await seed();
    const india = await asStaff(db, 'sales', 'india');
    const d = await withViewer(india, (tx) => staffDashboard(tx, india, filters, clock));
    expect(d.series.topDeals.every((t) => t.region === 'india')).toBe(true);
    expect(d.kpis.statusCounts.accepted).toBe(0);
    expect(d.expiring14).toEqual([]);
    expect(d.partnerHealth.active).toBe(1);
    expect(JSON.stringify(d)).not.toContain('Beta');
  });

  it('filters by partner, region and product', async () => {
    const { alpha, manager } = await seed();
    const viewer = await viewerFor(db, manager);
    const byPartner = await withViewer(viewer, (tx) => staffDashboard(tx, viewer, { period: '12m', partnerId: alpha.id }, clock));
    expect(byPartner.kpis.statusCounts).toMatchObject({ pending: 2, accepted: 0 });
    expect(byPartner.partnerHealth.active).toBe(1);
    const byRegion = await withViewer(viewer, (tx) => staffDashboard(tx, viewer, { period: '12m', region: 'middle_east' }, clock));
    expect(byRegion.kpis.statusCounts.accepted).toBe(1);
    expect(byRegion.kpis.statusCounts.pending).toBe(0);
    const byProduct = await withViewer(viewer, (tx) => staffDashboard(tx, viewer, { period: '12m', product: 'cleansight' }, clock));
    expect(byProduct.kpis.statusCounts).toMatchObject({ pending: 0, accepted: 0 });
  });

  it('lists active partners with no activity for 30 days', async () => {
    const quiet = await makePartner(db, { name: 'Quiet Co', status: 'active' });
    await makeUser(db, { partnerId: quiet.id, role: 'partner_admin' });
    const busy = await makePartner(db, { name: 'Busy Co', status: 'active' });
    const busyAdmin = await makeUser(db, { partnerId: busy.id, role: 'partner_admin' });
    await db.update(users).set({ lastLoginAt: new Date('2026-11-20T08:00:00Z') }).where(eq(users.id, busyAdmin.id));
    const staff = await asStaff(db);
    const d = await withViewer(staff, (tx) => staffDashboard(tx, staff, filters, clock));
    expect(d.dormantPartners.map((p) => [p.name, p.daysQuiet])).toEqual([['Quiet Co', null]]);
  });

  it('builds the application funnel and the open application count', async () => {
    const partner = await makePartner(db, { name: 'Approved Co', status: 'active' });
    await makeInvite(db, { partnerId: partner.id, role: 'partner_admin' });
    await makeUser(db, { partnerId: partner.id });
    await makeApplication(db, { status: 'approved', partnerId: partner.id, createdAt: new Date('2026-10-20T08:00:00Z') });
    await makeApplication(db, { status: 'approved', partnerId: (await makePartner(db, { status: 'onboarding' })).id, createdAt: new Date('2026-10-21T08:00:00Z') });
    await makeApplication(db, { status: 'new', createdAt: new Date('2026-11-01T08:00:00Z') });
    await makeApplication(db, { status: 'declined', createdAt: new Date('2026-11-02T08:00:00Z') });
    const staff = await asStaff(db);
    const d = await withViewer(staff, (tx) => staffDashboard(tx, staff, filters, clock));
    expect(d.funnel).toEqual({ applied: 4, approved: 2, invited: 1, active: 1 });
    expect(d.openApplications).toBe(1);
  });

  it('limits staff sales to the applications of their region', async () => {
    await makeApplication(db, { status: 'new', region: 'india', createdAt: new Date('2026-11-01T08:00:00Z') });
    await makeApplication(db, { status: 'new', region: 'middle_east', createdAt: new Date('2026-11-02T08:00:00Z') });
    const india = await asStaff(db, 'sales', 'india');
    const d = await withViewer(india, (tx) => staffDashboard(tx, india, filters, clock));
    expect(d.openApplications).toBe(1);
    expect(d.funnel.applied).toBe(1);
    const manager = await asStaff(db);
    const all = await withViewer(manager, (tx) => staffDashboard(tx, manager, filters, clock));
    expect(all.openApplications).toBe(2);
  });

  it('ranks documents by opens in the period, zero opens included', async () => {
    const partner = await makePartner(db, { name: 'Reader' });
    const reader = await makeUser(db, { partnerId: partner.id });
    const popular = await makeDocument(db, { title: 'Popular' });
    await makeDocument(db, { title: 'Ignored' });
    await db.insert(documentOpens).values([
      { documentId: popular.id, userId: reader.id, partnerId: partner.id, openedAt: new Date('2026-11-10T08:00:00Z') },
      { documentId: popular.id, userId: reader.id, partnerId: partner.id, openedAt: new Date('2025-01-10T08:00:00Z') },
    ]);
    const staff = await asStaff(db);
    const d = await withViewer(staff, (tx) => staffDashboard(tx, staff, filters, clock));
    expect(d.mostOpenedDocuments).toEqual([{ id: popular.id, title: 'Popular', opens: 1, partners: 1 }]);
    expect(d.leastOpenedDocuments.map((x) => x.title)).toEqual(['Ignored', 'Popular']);
  });

  it('refuses partners and marketing', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => staffDashboard(tx, partner, filters, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing');
    await expect(withViewer(marketing, (tx) => staffDashboard(tx, marketing, filters, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
