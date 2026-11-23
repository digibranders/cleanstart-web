import { beforeEach, describe, expect, it } from 'vitest';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getRangedReport } from './report-metrics';

const db = testDb();
beforeEach(() => resetDb(db));

const range = { preset: 'custom', from: '2026-10-01', to: '2026-10-31' } as const;

describe('getRangedReport', () => {
  it('counts only deals registered inside the range, both ends inclusive', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { name: 'Acme' });
    const add = (registeredOn: string, status: 'won' | 'lost' | 'pending', dealValue: number | null) =>
      makeRegistration(db, { partnerId: partner.id, registeredOn, status, dealValue, customerName: `c-${registeredOn}-${status}` });
    await add('2026-09-30', 'won', 999);
    await add('2026-10-01', 'won', 100);
    await add('2026-10-15', 'lost', 300);
    await add('2026-10-31', 'pending', 50);
    await add('2026-11-01', 'won', 999);
    const report = await withViewer(manager, (tx) => getRangedReport(tx, manager, range));
    expect(report.summary).toMatchObject({ deals: 3, totalValue: 450, averageValue: 150, wonValue: 100, won: 1, lost: 1, winRate: 0.5 });
    expect(report.funnel.map((s) => s.count)).toEqual([3, 2, 1, 1]);
    expect(report.leaderboard).toEqual([{ partnerId: partner.id, name: 'Acme', deals: 3, won: 1, wonValue: 100 }]);
    expect(report.products.find((p) => p.product === 'images')).toMatchObject({ deals: 3, won: 1, wonValue: 100 });
  });

  it('returns zeros and nulls for an empty range', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const report = await withViewer(manager, (tx) => getRangedReport(tx, manager, range));
    expect(report.summary).toMatchObject({ deals: 0, totalValue: 0, averageValue: null, winRate: null });
    expect(report.leaderboard).toEqual([]);
  });

  it('limits staff sales to their region and refuses partners and marketing', async () => {
    const partner = await makePartner(db, { name: 'Acme' });
    await makeRegistration(db, { partnerId: partner.id, region: 'india', registeredOn: '2026-10-05', status: 'won', dealValue: 10, customerName: 'in' });
    await makeRegistration(db, { partnerId: partner.id, region: 'middle_east', registeredOn: '2026-10-05', status: 'won', dealValue: 90, customerName: 'me' });
    const sales = await asStaff(db, 'sales', 'india');
    const report = await withViewer(sales, (tx) => getRangedReport(tx, sales, range));
    expect(report.summary).toMatchObject({ deals: 1, wonValue: 10 });
    const manager = await asStaff(db, 'partner_manager', 'all');
    expect((await withViewer(manager, (tx) => getRangedReport(tx, manager, range))).summary.wonValue).toBe(100);
    const outsider = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(outsider, (tx) => getRangedReport(tx, outsider, range))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => getRangedReport(tx, marketing, range))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
