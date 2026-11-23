import { describe, expect, it } from 'vitest';
import {
  approvalTimeBuckets,
  type DealFact,
  dealKpis,
  dealSeries,
  expiringSoon,
  managerWorkload,
  median,
  monthlyRegistrations,
  partnerTotals,
  pipelineBy,
  protectedCount,
  rejectionReasons,
  statusCounts,
  topDeals,
  weeklySubmittedVsDecided,
  winRate,
} from './dashboard-stats';

let n = 0;
const deal = (over: Partial<DealFact> = {}): DealFact => {
  n += 1;
  return {
    id: `d${String(n).padStart(3, '0')}`,
    partnerId: 'p1',
    partnerName: 'Alpha',
    customer: `Customer ${n}`,
    product: 'images',
    region: 'india',
    country: 'IN',
    industry: 'Banking',
    stage: 'Evaluation',
    status: 'pending',
    value: 1000,
    currency: 'USD',
    registeredOn: '2026-11-02',
    resubmittedOn: null,
    decidedOn: null,
    rejectionReason: null,
    protectionEnd: null,
    registeredBy: null,
    managerId: null,
    ...over,
  };
};

// 2026-11-02 is a Monday.
describe('statusCounts', () => {
  it('counts every status, zero included', () => {
    const counts = statusCounts([deal(), deal({ status: 'won' }), deal({ status: 'won' })]);
    expect(counts).toEqual({ pending: 1, accepted: 0, rejected: 0, expired: 0, won: 2, lost: 0 });
  });
});

describe('pipelineBy', () => {
  it('sums open deals only, in USD, sorted by value, with a bucket for a missing key', () => {
    const rows = pipelineBy(
      [
        deal({ product: 'images', value: 100 }),
        deal({ product: 'libraries', value: 500, status: 'accepted' }),
        deal({ product: 'libraries', value: 50 }),
        deal({ product: 'cleansight', value: 9999, status: 'rejected' }),
        deal({ product: 'cleansight', value: 70, currency: 'EUR', country: null }),
      ],
      (d) => d.product,
    );
    expect(rows).toEqual([
      { key: 'libraries', count: 2, value: 550 },
      { key: 'images', count: 1, value: 100 },
      { key: 'cleansight', count: 1, value: 0 },
    ]);
    expect(pipelineBy([deal({ country: null })], (d) => d.country)).toEqual([{ key: 'Not given', count: 1, value: 1000 }]);
  });
});

describe('monthlyRegistrations', () => {
  it('returns 12 zero filled months ending this month, oldest first', () => {
    const points = monthlyRegistrations(
      [deal({ registeredOn: '2026-11-20' }), deal({ registeredOn: '2026-01-05', value: 5 }), deal({ registeredOn: '2025-10-31' })],
      '2026-11-23',
    );
    expect(points).toHaveLength(12);
    expect(points[0]?.month).toBe('2025-12');
    expect(points[11]).toEqual({ month: '2026-11', count: 1, value: 1000 });
    expect(points.find((p) => p.month === '2026-01')).toEqual({ month: '2026-01', count: 1, value: 5 });
    expect(points.find((p) => p.month === '2026-06')).toEqual({ month: '2026-06', count: 0, value: 0 });
    expect(points.reduce((s, p) => s + p.count, 0)).toBe(2);
  });

  it('crosses a year boundary', () => {
    const points = monthlyRegistrations([], '2026-02-10');
    expect(points[0]?.month).toBe('2025-03');
    expect(points[11]?.month).toBe('2026-02');
  });
});

describe('weeklySubmittedVsDecided', () => {
  it('buckets by Monday start week and zero fills', () => {
    const weeks = weeklySubmittedVsDecided(
      [deal({ registeredOn: '2026-11-04', decidedOn: '2026-11-10' }), deal({ registeredOn: '2026-11-08' })],
      '2026-10-20',
      '2026-11-12',
    );
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09']);
    expect(weeks.map((w) => [w.submitted, w.decided])).toEqual([[0, 0], [0, 0], [2, 0], [0, 1]]);
  });

  it('never returns more than 53 weeks', () => {
    expect(weeklySubmittedVsDecided([], '2020-01-01', '2026-11-23')).toHaveLength(53);
  });
});

describe('decision metrics', () => {
  const decided = [
    deal({ status: 'accepted', registeredOn: '2026-11-02', decidedOn: '2026-11-02' }), // 0
    deal({ status: 'accepted', registeredOn: '2026-11-02', decidedOn: '2026-11-04' }), // 2
    deal({ status: 'rejected', registeredOn: '2026-11-02', decidedOn: '2026-11-10' }), // 6
    deal({ status: 'accepted', registeredOn: '2026-10-01', resubmittedOn: '2026-11-02', decidedOn: '2026-11-03' }), // 1, counted from the resubmission
  ];

  it('computes average, median and the share within 2 business days', () => {
    const kpis = dealKpis(decided);
    expect(kpis.avgDecisionDays).toBe(2.3);
    expect(kpis.medianDecisionDays).toBe(1.5);
    expect(kpis.decidedWithinTarget).toBe(0.75);
  });

  it('returns null, not zero, with nothing decided', () => {
    const kpis = dealKpis([deal()]);
    expect([kpis.avgDecisionDays, kpis.medianDecisionDays, kpis.decidedWithinTarget, kpis.winRate]).toEqual([null, null, null, null]);
  });

  it('puts the distribution into five fixed buckets', () => {
    expect(approvalTimeBuckets([0, 0, 1, 2, 4, 6, 20])).toEqual([
      { label: 'Same day', count: 2 },
      { label: '1 day', count: 1 },
      { label: '2 days', count: 1 },
      { label: '3 to 5 days', count: 1 },
      { label: '6 days or more', count: 2 },
    ]);
    expect(approvalTimeBuckets([]).every((b) => b.count === 0)).toBe(true);
  });

  it('takes the median of an even and an odd list', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('winRate', () => {
  it('is won over won plus lost', () => {
    expect(winRate([deal({ status: 'won' }), deal({ status: 'won' }), deal({ status: 'lost' }), deal({ status: 'accepted' })])).toBeCloseTo(2 / 3);
  });
});

describe('rejectionReasons', () => {
  it('groups case-insensitively and ignores blanks and other statuses', () => {
    const rows = rejectionReasons([
      deal({ status: 'rejected', rejectionReason: 'Already registered' }),
      deal({ status: 'rejected', rejectionReason: ' already registered ' }),
      deal({ status: 'rejected', rejectionReason: 'Out of territory' }),
      deal({ status: 'rejected', rejectionReason: '  ' }),
      deal({ status: 'lost', rejectionReason: 'Should not count' }),
    ]);
    expect(rows).toEqual([
      { reason: 'Already registered', count: 2 },
      { reason: 'Out of territory', count: 1 },
    ]);
  });
});

describe('topDeals', () => {
  it('lists live deals by value and skips rejected, lost, expired and valueless ones', () => {
    const rows = topDeals(
      [
        deal({ id: 'a', value: 10 }),
        deal({ id: 'b', value: 90, status: 'won' }),
        deal({ id: 'c', value: 500, status: 'rejected' }),
        deal({ id: 'd', value: null }),
        deal({ id: 'e', value: 50, currency: 'INR' }),
      ],
      2,
    );
    expect(rows.map((r) => [r.id, r.value])).toEqual([['b', 90], ['a', 10]]);
  });
});

describe('expiring and protected', () => {
  const today = '2026-11-23';
  const deals = [
    deal({ id: 'x1', status: 'accepted', protectionEnd: '2026-11-23' }),
    deal({ id: 'x2', status: 'accepted', protectionEnd: '2026-12-07' }),
    deal({ id: 'x3', status: 'accepted', protectionEnd: '2026-12-08' }),
    deal({ id: 'x4', status: 'accepted', protectionEnd: '2026-11-22' }),
    deal({ id: 'x5', status: 'pending', protectionEnd: '2026-11-30' }),
  ];
  it('keeps the 14 day window inclusive at both ends, soonest first', () => {
    expect(expiringSoon(deals, today).map((r) => [r.id, r.daysLeft])).toEqual([['x1', 0], ['x2', 14]]);
  });
  it('counts accepted deals not yet ended', () => {
    expect(protectedCount(deals, today)).toBe(3);
  });
});

describe('dealSeries', () => {
  it('assembles every series with the 12 month trend taken from all deals', () => {
    const old = deal({ registeredOn: '2026-03-03' });
    const recent = deal({ registeredOn: '2026-11-10' });
    const series = dealSeries([recent], [old, recent], { from: '2026-10-01', to: '2026-11-23' });
    expect(series.monthly.reduce((s, p) => s + p.count, 0)).toBe(2);
    expect(series.byProduct).toHaveLength(1);
    expect(series.approvalTime).toHaveLength(5);
  });
});

describe('partnerTotals', () => {
  it('totals open pipeline and wins per partner', () => {
    const totals = partnerTotals([
      deal({ partnerId: 'a', value: 100 }),
      deal({ partnerId: 'a', value: 40, status: 'won' }),
      deal({ partnerId: 'a', value: 900, status: 'rejected' }),
      deal({ partnerId: 'b', value: 7, status: 'accepted' }),
    ]);
    expect(totals.get('a')).toEqual({ deals: 3, pipelineValue: 100, wonCount: 1, wonValue: 40 });
    expect(totals.get('b')).toEqual({ deals: 1, pipelineValue: 7, wonCount: 0, wonValue: 0 });
  });
});

describe('managerWorkload', () => {
  it('counts waiting, overdue and decided per manager, with unassigned as null', () => {
    const today = '2026-11-23'; // a Monday
    const rows = managerWorkload(
      [
        deal({ managerId: 'm1', registeredOn: '2026-11-23' }),
        deal({ managerId: 'm1', registeredOn: '2026-11-17' }),
        deal({ managerId: null, registeredOn: '2026-11-20' }),
        deal({ managerId: 'm2', status: 'accepted' }),
      ],
      [deal({ managerId: 'm2', status: 'accepted', decidedOn: '2026-11-04' })],
      today,
    );
    expect(rows).toEqual([
      { managerId: 'm1', waiting: 2, overdue: 1, decided: 0 },
      { managerId: null, waiting: 1, overdue: 0, decided: 0 },
      { managerId: 'm2', waiting: 0, overdue: 0, decided: 1 },
    ]);
  });
});
