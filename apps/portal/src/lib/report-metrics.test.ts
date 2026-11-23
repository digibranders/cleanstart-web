import { describe, expect, it } from 'vitest';
import {
  buildRangedReport,
  conversion,
  funnel,
  inRange,
  leaderboard,
  parseReportRange,
  productBreakdown,
  quarterStart,
  type ReportFact,
  summarize,
  winRate,
} from './report-metrics';

const fact = (over: Partial<ReportFact> = {}): ReportFact => ({
  partnerId: 'p1',
  partnerName: 'Acme',
  product: 'images',
  status: 'pending',
  value: null,
  currency: 'USD',
  registeredOn: '2026-11-01',
  ...over,
});

describe('winRate and conversion', () => {
  it('is null when nothing has closed or there is no whole', () => {
    expect(winRate(0, 0)).toBeNull();
    expect(conversion(0, 0)).toBeNull();
    expect(conversion(3, 0)).toBeNull();
  });
  it('is won over won plus lost', () => {
    expect(winRate(3, 1)).toBe(0.75);
    expect(winRate(0, 2)).toBe(0);
    expect(conversion(1, 4)).toBe(0.25);
  });
});

describe('summarize', () => {
  it('is all zero and null on an empty range', () => {
    expect(summarize([])).toEqual({ deals: 0, totalValue: 0, averageValue: null, wonValue: 0, won: 0, lost: 0, winRate: null, unvalued: 0 });
  });
  it('sums USD only and averages over valued deals', () => {
    const s = summarize([
      fact({ value: 100, status: 'won' }),
      fact({ value: 300, status: 'lost' }),
      fact({ value: 5000, currency: 'INR' }),
      fact({ value: null }),
    ]);
    expect(s).toMatchObject({ deals: 4, totalValue: 400, averageValue: 200, wonValue: 100, won: 1, lost: 1, winRate: 0.5, unvalued: 2 });
  });
});

describe('funnel', () => {
  it('is zero with null conversions on an empty range', () => {
    expect(funnel([]).map((s) => [s.count, s.conversion])).toEqual([[0, null], [0, null], [0, null], [0, null]]);
  });
  it('counts approved as accepted, won, lost and expired, and measures won and lost against approved', () => {
    const steps = funnel([
      fact({ status: 'pending' }),
      fact({ status: 'rejected' }),
      fact({ status: 'accepted' }),
      fact({ status: 'expired' }),
      fact({ status: 'won' }),
      fact({ status: 'lost' }),
    ]);
    expect(steps.map((s) => s.count)).toEqual([6, 4, 1, 1]);
    expect(steps[1]?.conversion).toBeCloseTo(4 / 6);
    expect(steps[2]?.conversion).toBe(0.25);
    expect(steps[3]?.conversion).toBe(0.25);
  });
  it('has no won conversion when nothing was approved', () => {
    expect(funnel([fact({ status: 'rejected' })])[2]?.conversion).toBeNull();
  });
});

describe('leaderboard', () => {
  it('ranks by won value, ties by won count then name, and keeps partners with no win', () => {
    const rows = leaderboard([
      fact({ partnerId: 'a', partnerName: 'Beta', status: 'won', value: 100 }),
      fact({ partnerId: 'b', partnerName: 'Alpha', status: 'won', value: 100 }),
      fact({ partnerId: 'c', partnerName: 'Gamma', status: 'won', value: 900 }),
      fact({ partnerId: 'd', partnerName: 'Delta', status: 'pending', value: 5000 }),
    ]);
    expect(rows.map((r) => r.name)).toEqual(['Gamma', 'Alpha', 'Beta', 'Delta']);
    expect(rows[3]).toMatchObject({ deals: 1, won: 0, wonValue: 0 });
  });
});

describe('productBreakdown', () => {
  it('lists every product, zero filled', () => {
    const rows = productBreakdown([fact({ product: 'libraries', status: 'won', value: 50 })]);
    expect(rows.map((r) => r.product)).toEqual(['images', 'libraries', 'cleansight']);
    expect(rows[1]).toEqual({ product: 'libraries', deals: 1, approved: 1, won: 1, totalValue: 50, wonValue: 50 });
    expect(rows[0]?.deals).toBe(0);
  });
});

describe('ranges', () => {
  const today = '2026-11-23';
  it('resolves presets to inclusive days', () => {
    expect(parseReportRange({}, today)).toEqual({ preset: '90d', from: '2026-08-26', to: today });
    expect(parseReportRange({ range: '30d' }, today).from).toBe('2026-10-25');
    expect(parseReportRange({ range: '365d' }, today).from).toBe('2025-11-24');
    expect(parseReportRange({ range: 'quarter' }, today).from).toBe('2026-10-01');
    expect(quarterStart('2026-03-31')).toBe('2026-01-01');
  });
  it('takes a custom range and falls back on bad input', () => {
    expect(parseReportRange({ range: 'custom', from: '2026-01-01', to: '2026-02-01' }, today)).toEqual({ preset: 'custom', from: '2026-01-01', to: '2026-02-01' });
    expect(parseReportRange({ from: '2026-01-01', to: '2026-02-01' }, today).preset).toBe('custom');
    expect(parseReportRange({ range: 'custom', from: '2026-03-01', to: '2026-02-01' }, today).preset).toBe('90d');
    expect(parseReportRange({ range: 'custom', from: '2026-02-30', to: '2026-03-01' }, today).preset).toBe('90d');
    expect(parseReportRange({ range: 'bogus' }, today).preset).toBe('90d');
  });
  it('filters facts by registered date, both ends inclusive, and builds an empty report from none', () => {
    const facts = [fact({ registeredOn: '2026-01-01' }), fact({ registeredOn: '2026-02-01' }), fact({ registeredOn: '2026-02-02' })];
    expect(inRange(facts, { from: '2026-01-01', to: '2026-02-01' })).toHaveLength(2);
    const empty = buildRangedReport([], { preset: '30d', from: '2026-01-01', to: '2026-01-30' });
    expect(empty.summary.winRate).toBeNull();
    expect(empty.leaderboard).toEqual([]);
  });
});
