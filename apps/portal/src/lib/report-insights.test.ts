import { describe, expect, it } from 'vitest';
import { byManager, byRegion, engagementShare, type InsightFact, NO_REASON, percentile, rejectionReasons, timeToDecision } from './report-insights';

let n = 0;
const fact = (over: Partial<InsightFact> = {}): InsightFact => ({
  partnerId: `p${n++}`,
  partnerName: 'Acme',
  partnerRegion: 'india',
  managerId: null,
  managerName: null,
  product: 'images',
  status: 'pending',
  value: null,
  currency: 'USD',
  registeredOn: '2026-10-05',
  resubmittedOn: null,
  decidedOn: null,
  rejectionReason: null,
  ...over,
});

describe('percentile', () => {
  it('is null for no values and the value itself for one', () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([7], 50)).toBe(7);
    expect(percentile([7], 90)).toBe(7);
  });
  it('interpolates and ignores input order', () => {
    expect(percentile([4, 1, 3, 2], 50)).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBeCloseTo(9.1);
    expect(percentile([1, 2], 0)).toBe(1);
    expect(percentile([1, 2], 100)).toBe(2);
  });
});

describe('timeToDecision', () => {
  it('is empty and null for no deals', () => {
    expect(timeToDecision([])).toEqual({ decided: 0, waiting: 0, median: null, p90: null, byMonth: [] });
  });
  it('counts pending deals as waiting and groups by month registered', () => {
    const t = timeToDecision([
      fact({ registeredOn: '2026-09-28', decidedOn: '2026-09-30', status: 'accepted' }),
      fact({ registeredOn: '2026-10-01', decidedOn: '2026-10-05', status: 'rejected' }),
      fact({ registeredOn: '2026-10-10', decidedOn: '2026-10-12', status: 'accepted' }),
      fact({ registeredOn: '2026-10-20' }),
    ]);
    expect(t).toMatchObject({ decided: 3, waiting: 1, median: 2 });
    expect(t.byMonth).toEqual([
      { month: '2026-09', decided: 1, median: 2, p90: 2 },
      { month: '2026-10', decided: 2, median: 3, p90: 3.8 },
    ]);
  });
  it('runs from the resubmission when a rejected deal was put back for review', () => {
    const t = timeToDecision([fact({ registeredOn: '2026-09-01', resubmittedOn: '2026-10-10', decidedOn: '2026-10-13', status: 'accepted' })]);
    expect(t.median).toBe(3);
    expect(t.byMonth.map((m) => m.month)).toEqual(['2026-10']);
  });
  it('never reports a negative number of days', () => {
    expect(timeToDecision([fact({ registeredOn: '2026-10-05', decidedOn: '2026-10-04' })]).median).toBe(0);
  });
});

describe('rejectionReasons', () => {
  it('is empty when nothing was rejected', () => {
    expect(rejectionReasons([fact({ status: 'accepted' })])).toEqual([]);
  });
  it('groups ignoring case and spacing, with shares of all rejections, biggest first', () => {
    const rows = rejectionReasons([
      fact({ status: 'rejected', rejectionReason: 'Already registered' }),
      fact({ status: 'rejected', rejectionReason: ' already  registered ' }),
      fact({ status: 'rejected', rejectionReason: 'Already registered' }),
      fact({ status: 'rejected', rejectionReason: 'Out of territory' }),
      fact({ status: 'rejected', rejectionReason: null }),
      fact({ status: 'won', rejectionReason: 'ignored' }),
    ]);
    expect(rows).toEqual([
      { reason: 'Already registered', count: 3, share: 0.6 },
      { reason: NO_REASON, count: 1, share: 0.2 },
      { reason: 'Out of territory', count: 1, share: 0.2 },
    ]);
  });
});

describe('rollups', () => {
  const facts = [
    fact({ partnerRegion: 'india', managerId: 'm1', managerName: 'Omar', status: 'won', value: 100 }),
    fact({ partnerRegion: 'india', managerId: 'm1', managerName: 'Omar', status: 'lost' }),
    fact({ partnerRegion: 'emea', managerId: null, status: 'won', value: 300 }),
    fact({ partnerRegion: 'emea', managerId: null, status: 'pending' }),
  ];
  it('groups by region with names, won value and win rate', () => {
    expect(byRegion(facts, (k) => k.toUpperCase())).toEqual([
      { key: 'emea', label: 'EMEA', detail: '', deals: 2, won: 1, wonValue: 300, winRate: 1 },
      { key: 'india', label: 'INDIA', detail: '', deals: 2, won: 1, wonValue: 100, winRate: 0.5 },
    ]);
  });
  it('shows seeded groups with no deals, zero filled and last', () => {
    const rows = byRegion(facts, (k) => k, [{ key: 'us', label: 'US' }, { key: 'india', label: 'India' }]);
    expect(rows.map((r) => [r.key, r.deals])).toEqual([['emea', 2], ['india', 2], ['us', 0]]);
    expect(rows.find((r) => r.key === 'us')).toMatchObject({ won: 0, wonValue: 0, winRate: null });
    expect(byManager([], [{ key: 'm9', label: 'Aditi', detail: 'India' }])).toEqual([{ key: 'm9', label: 'Aditi', detail: 'India', deals: 0, won: 0, wonValue: 0, winRate: null }]);
  });
  it('groups by manager and keeps unmanaged partners together', () => {
    expect(byManager(facts).map((r) => [r.label, r.deals])).toEqual([['No manager', 2], ['Omar', 2]]);
    expect(byManager([])).toEqual([]);
  });
});

describe('engagementShare', () => {
  it('is null with no partners', () => {
    expect(engagementShare(0, 0)).toBeNull();
    expect(engagementShare(1, 4)).toBe(0.25);
  });
});
