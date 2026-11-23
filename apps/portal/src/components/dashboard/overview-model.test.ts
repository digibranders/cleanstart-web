import { describe, expect, it } from 'vitest';
import type { BreakdownRow, PartnerDashboardDto, StaffDashboardDto } from '@/lib/dashboard-dto';
import { buildDashboardTiles, buildStaffTiles, formatUsd, heatIsEmpty, heatWeeks, kpiCsvRows, kpiFilename, protectionBars, stageFunnel, tilesCsv, valueBars, workloadBars } from './overview-model';

const row = (key: string, count: number, value = 0): BreakdownRow => ({ key, count, value });

const dashboard = (over: Partial<PartnerDashboardDto['kpis']> = {}, protectedNow = 0): PartnerDashboardDto =>
  ({
    protectedNow,
    expiring14: [],
    kpis: {
      statusCounts: { pending: 0, accepted: 0, rejected: 0, expired: 0, won: 0, lost: 0 },
      pipeline: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      winRate: null,
      avgDecisionDays: null,
      medianDecisionDays: null,
      decidedWithinTarget: null,
      otherCurrencyDeals: 0,
      ...over,
    },
    series: { monthly: [{ month: '2026-10', count: 1, value: 5 }] },
  }) as unknown as PartnerDashboardDto;

describe('formatUsd', () => {
  it('shortens to K and M', () => {
    expect([formatUsd(950), formatUsd(48_200), formatUsd(1_240_000)]).toEqual(['$950', '$48.2K', '$1.2M']);
  });
});

describe('buildDashboardTiles', () => {
  it('says so when there is nothing', () => {
    const tiles = buildDashboardTiles(dashboard());
    expect(tiles.map((t) => t.value)).toEqual(['$0', '0', '0', '0', 'None yet', 'None yet']);
  });

  it('notes deals left out of the pipeline value and carries the trend', () => {
    const [pipeline] = buildDashboardTiles(dashboard({ pipeline: { count: 3, value: 90_000 }, otherCurrencyDeals: 2 }));
    expect(pipeline?.foot).toBe('3 open deals, 2 deals in other currencies not counted');
    expect(pipeline?.trend).toEqual([5]);
  });

  it('shows rates and the decision time', () => {
    const tiles = buildDashboardTiles(dashboard({ winRate: 0.375, avgDecisionDays: 2.4, won: { count: 2, value: 30_000 } }, 4));
    expect(tiles.map((t) => t.value)).toEqual(['$0', '4', '0', '2', '38%', '2.4 days']);
    expect(tiles[3]?.foot).toBe('$30K won');
  });
});

describe('chart data', () => {
  it('counts the deals that reached each stage, so the funnel only shrinks', () => {
    const rows = [row('Proposal sent', 1), row('Awaiting review', 4), row('Accepted', 6), row('Discovery', 3)];
    expect(stageFunnel(rows)).toEqual([
      { label: 'Awaiting review', value: 14 },
      { label: 'Accepted', value: 10 },
      { label: 'Discovery', value: 4 },
      { label: 'Proposal sent', value: 1 },
    ]);
  });

  it('leaves the "Not given" bucket and zero values out of the value bars', () => {
    expect(valueBars([row('India', 2, 100), row('Not given', 1, 50), row('Chile', 1, 0)]).map((b) => b.label)).toEqual(['India']);
  });

  it('builds a window of the standard length ending on the protection end', () => {
    const [bar] = protectionBars([{ id: 'a', partnerId: 'p', customer: 'Acme', partnerName: 'P', protectionEnd: '2026-12-01', daysLeft: 8 }]);
    expect(bar && (bar.end - bar.start) / 86_400_000).toBe(90);
    expect(bar?.state).toBe('expiring');
  });
});

describe('buildStaffTiles', () => {
  const staffDto = {
    waiting: { count: 3, overdue: 1 },
    kpis: { ...dashboard().kpis, decidedWithinTarget: 0.75, avgDecisionDays: 1.5, pipeline: { count: 2, value: 12_000 }, won: { count: 1, value: 4_000 } },
    series: { monthly: [{ month: '2026-10', count: 1, value: 5 }] },
    activePartners: 4,
    openApplications: 2,
    protectedNow: 5,
    partnerHealth: { active: 4, onboarding: 1, inactive: 0 },
    expiring14: [],
  } as unknown as StaffDashboardDto;

  it('builds eight tiles that open Deals or Partners', () => {
    const tiles = buildStaffTiles(staffDto, true);
    expect(tiles).toHaveLength(8);
    expect(tiles.map((t) => t.value)).toEqual(['3', '75%', '1.5 days', '4', '2', '$12K', '1', '5']);
    expect(tiles[0]?.href).toBe('/admin/approvals?status=waiting');
    expect(tiles[4]?.href).toBe('/admin/partners?astatus=new');
    expect(buildStaffTiles(staffDto, false)[4]?.href).toBe('/admin/partners');
  });

  it('exports the tiles as CSV rows', () => {
    expect(tilesCsv(buildStaffTiles(staffDto, true))[0]).toEqual(['Waiting for approval', '3', '1 past the 2 day target']);
  });

  it('puts the filters ahead of the tiles in the KPI download and names the file after the days covered', () => {
    const range = { from: '2026-09-01', to: '2026-10-15' };
    const rows = kpiCsvRows({ period: 'custom', from: range.from, to: range.to, category: 'channel', region: 'india' }, range, [{ label: 'Open pipeline', value: '$1K', foot: '1 open deal' }]);
    expect(rows).toEqual([
      ['Period', 'Custom dates', '2026-09-01 to 2026-10-15'],
      ['Region', 'India', ''],
      ['Partner category', 'Channel partner', ''],
      ['Open pipeline', '$1K', '1 open deal'],
    ]);
    expect(kpiFilename(range)).toBe('overview-kpis-2026-09-01-to-2026-10-15.csv');
  });

  it('labels heat map weeks and spots an empty map', () => {
    const points = [{ weekStart: '2026-11-16', days: [0, 1, 0, 0, 0, 0, 0] }, { weekStart: '2026-11-23', days: [0, null, null, null, null, null, null] }];
    expect(heatWeeks(points).map((w) => w.label)).toEqual(['16 Nov', '23 Nov']);
    expect(heatIsEmpty(points)).toBe(false);
    expect(heatIsEmpty([points[1] ?? { weekStart: '', days: [] }])).toBe(true);
  });

  it('ranks the workload and leaves out managers with nothing waiting', () => {
    const rows = [
      { managerId: 'a', name: 'Asha', waiting: 1, overdue: 0, decided: 4 },
      { managerId: null, name: 'Unassigned', waiting: 3, overdue: 1, decided: 0 },
      { managerId: 'b', name: 'Bo', waiting: 0, overdue: 0, decided: 2 },
    ];
    expect(workloadBars(rows).map((b) => b.label)).toEqual(['Unassigned', 'Asha']);
  });
});
