import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, registrations } from '@/db/schema';
import { asPartner, asStaff, makeDocument, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getReportInsights } from './report-insights';

const db = testDb();
beforeEach(() => resetDb(db));

const range = { preset: 'custom', from: '2026-10-01', to: '2026-10-31' } as const;

async function decide(id: string, decidedAt: string): Promise<void> {
  await db.update(registrations).set({ decidedAt: new Date(decidedAt) }).where(eq(registrations.id, id));
}

describe('getReportInsights', () => {
  it('measures days to first decision and groups rejection reasons, inside the range only', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { name: 'Acme' });
    const a = await makeRegistration(db, { partnerId: partner.id, registeredOn: '2026-10-02', status: 'accepted', customerName: 'a' });
    const b = await makeRegistration(db, { partnerId: partner.id, registeredOn: '2026-10-10', status: 'rejected', customerName: 'b' });
    await makeRegistration(db, { partnerId: partner.id, registeredOn: '2026-10-12', status: 'pending', customerName: 'c' });
    const out = await makeRegistration(db, { partnerId: partner.id, registeredOn: '2026-09-30', status: 'rejected', customerName: 'out' });
    await decide(a.id, '2026-10-04T10:00:00Z');
    await decide(b.id, '2026-10-16T10:00:00Z');
    await decide(out.id, '2026-10-01T10:00:00Z');
    const r = await withViewer(manager, (tx) => getReportInsights(tx, manager, range));
    expect(r.decision).toMatchObject({ decided: 2, waiting: 1, median: 4, p90: 5.6 });
    expect(r.decision.byMonth).toEqual([{ month: '2026-10', decided: 2, median: 4, p90: 5.6 }]);
    expect(r.reasons).toEqual([{ reason: 'Test rejection', count: 1, share: 1 }]);
  });

  it('limits a regional partner manager to the partners in their regions, and rolls up by region and manager', async () => {
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', name: 'Omar Nasser' });
    const india = await makePartner(db, { name: 'In Co', region: 'india', managerId: omar.id });
    const me = await makePartner(db, { name: 'Me Co', region: 'middle_east' });
    await makeRegistration(db, { partnerId: india.id, registeredOn: '2026-10-05', status: 'won', dealValue: 100, customerName: 'x' });
    await makeRegistration(db, { partnerId: india.id, registeredOn: '2026-10-06', status: 'lost', customerName: 'y' });
    await makeRegistration(db, { partnerId: me.id, registeredOn: '2026-10-05', status: 'won', dealValue: 900, customerName: 'z' });
    const all = await asStaff(db, 'partner_manager', 'all');
    const full = await withViewer(all, (tx) => getReportInsights(tx, all, range));
    const withDeals = <T extends { deals: number }>(rows: T[]): T[] => rows.filter((x) => x.deals > 0);
    expect(withDeals(full.regions).map((x) => [x.key, x.deals, x.wonValue])).toEqual([['middle_east', 1, 900], ['india', 2, 100]]);
    expect(withDeals(full.managers).map((x) => [x.label, x.deals, x.winRate])).toEqual([['No manager', 1, 1], ['Omar Nasser', 2, 0.5]]);
    // Every active region shows, with zeros when nothing was registered there.
    expect(full.regions.length).toBeGreaterThan(withDeals(full.regions).length);
    expect(full.regions.find((x) => x.key === 'us')).toMatchObject({ deals: 0, wonValue: 0, winRate: null });
    const regional = await asStaff(db, 'partner_manager', 'india');
    const limited = await withViewer(regional, (tx) => getReportInsights(tx, regional, range));
    expect(limited.regions.map((x) => x.key)).toEqual(['india']);
    expect(withDeals(limited.managers).map((x) => x.label)).toEqual(['Omar Nasser']);
    expect(limited.managers.find((x) => x.label === 'Omar Nasser')?.detail).toBe('All regions');
  });

  it('limits staff sales to the deals in their regions', async () => {
    const india = await makePartner(db, { name: 'In Co', region: 'india' });
    await makeRegistration(db, { partnerId: india.id, region: 'india', registeredOn: '2026-10-05', status: 'won', dealValue: 10, customerName: 'in' });
    await makeRegistration(db, { partnerId: india.id, region: 'us', registeredOn: '2026-10-05', status: 'won', dealValue: 90, customerName: 'us' });
    const sales = await asStaff(db, 'sales', 'india');
    const r = await withViewer(sales, (tx) => getReportInsights(tx, sales, range));
    expect(r.regions.map((x) => [x.key, x.deals])).toEqual([['india', 1]]);
  });

  it('counts document opens inside the range, for the partners in scope', async () => {
    const india = await makePartner(db, { name: 'In Co', region: 'india' });
    const idle = await makePartner(db, { name: 'Idle Co', region: 'india' });
    const me = await makePartner(db, { name: 'Me Co', region: 'middle_east' });
    await makePartner(db, { name: 'Gone Co', region: 'india', status: 'inactive' });
    const user = await makeUser(db, { partnerId: india.id });
    const meUser = await makeUser(db, { partnerId: me.id });
    const guide = await makeDocument(db, { title: 'Guide' });
    const sheet = await makeDocument(db, { title: 'Sheet' });
    const open = (documentId: string, userId: string, partnerId: string, at: string) =>
      db.insert(documentOpens).values({ documentId, userId, partnerId, openedAt: new Date(at) });
    await open(guide.id, user.id, india.id, '2026-10-31T23:30:00Z');
    await open(guide.id, user.id, india.id, '2026-10-15T09:00:00Z');
    await open(sheet.id, user.id, india.id, '2026-10-16T09:00:00Z');
    await open(guide.id, user.id, india.id, '2026-11-01T00:00:00Z');
    await open(sheet.id, meUser.id, me.id, '2026-10-16T09:00:00Z');
    const regional = await asStaff(db, 'partner_manager', 'india');
    const r = await withViewer(regional, (tx) => getReportInsights(tx, regional, range));
    expect(r.engagement).toMatchObject({ partners: 2, openedAny: 1, share: 0.5 });
    expect(r.engagement.top.map((d) => [d.title, d.opens, d.partners])).toEqual([['Guide', 2, 1], ['Sheet', 1, 1]]);
    expect(idle.id).toBeDefined();
    const all = await asStaff(db, 'partner_manager', 'all');
    const full = await withViewer(all, (tx) => getReportInsights(tx, all, range));
    expect(full.engagement).toMatchObject({ partners: 3, openedAny: 2 });
    expect(full.engagement.top.map((d) => [d.title, d.opens, d.partners])).toEqual([['Guide', 2, 1], ['Sheet', 2, 2]]);
  });

  it('is empty and null for a range with nothing, and refuses partners and marketing', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const r = await withViewer(manager, (tx) => getReportInsights(tx, manager, range));
    expect(r.decision).toEqual({ decided: 0, waiting: 0, median: null, p90: null, byMonth: [] });
    expect(r.regions.every((x) => x.deals === 0 && x.winRate === null)).toBe(true);
    expect(r.managers.every((x) => x.deals === 0)).toBe(true);
    expect(r).toMatchObject({ reasons: [], engagement: { partners: 0, openedAny: 0, share: null, top: [] } });
    const partner = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(partner, (tx) => getReportInsights(tx, partner, range))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => getReportInsights(tx, marketing, range))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
