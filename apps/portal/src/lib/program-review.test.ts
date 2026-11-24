import { describe, expect, it } from 'vitest';
import type { AdminReportsDto } from './dto';
import { buildProgramReview, type ProgramReviewInput, parseEdition, partnerLetters, programReviewQuery } from './program-review';
import { byManager, type InsightFact, rejectionReasons, timeToDecision } from './report-insights';
import { buildRangedReport, previousRange, type ReportRange } from './report-metrics';

const range: ReportRange = { preset: '90d', from: '2026-08-26', to: '2026-11-23' };
const prior = previousRange(range);

const fact = (over: Partial<InsightFact> & { registeredOn: string }): InsightFact => ({
    partnerId: 'p1',
    partnerName: 'Kestrel Systems',
    product: 'images',
    status: 'pending',
    value: 100,
    currency: 'USD',
    partnerRegion: 'india',
    managerId: 'm1',
    managerName: 'Gaurav Jadhav',
    resubmittedOn: null,
    decidedOn: null,
    rejectionReason: null,
    ...over,
  });

const insightsFor = (facts: readonly InsightFact[], r: ReportRange): ProgramReviewInput['insights'] => ({
  range: r,
  decision: timeToDecision(facts),
  reasons: rejectionReasons(facts),
  engagement: { partners: 2, openedAny: 1, share: 0.5, top: [{ documentId: 'd1', title: 'Partner sales playbook', opens: 4, partners: 1 }] },
  regions: [{ key: 'india', label: 'India', detail: '', deals: facts.length, won: 0, wonValue: 0, winRate: null }],
  managers: byManager(facts),
});

const allTime: AdminReportsDto = {
  totalPartners: 3,
  totalRegistered: 5,
  partners: [
    { partnerId: 'p1', name: 'Kestrel Systems', category: 'channel', region: 'india', registered: 4, waiting: 1, accepted: 2, rejected: 1, won: 1, protectedNow: 1 },
    { partnerId: 'p2', name: 'Saffron Secure', category: 'distributor', region: 'india', registered: 1, waiting: 0, accepted: 1, rejected: 0, won: 0, protectedNow: 0 },
    { partnerId: 'p3', name: 'Ironleaf Consulting', category: 'channel', region: 'india', registered: 0, waiting: 0, accepted: 0, rejected: 0, won: 0, protectedNow: 0 },
  ],
  products: [],
  followUps: [{ partnerId: 'p3', name: 'Ironleaf Consulting', why: 'No sign-in since 2 Aug', status: 'inactive' }],
  expiringIn14Days: 0,
};

const currentFacts: InsightFact[] = [
  fact({ registeredOn: '2026-09-01', status: 'won', value: 200_000, decidedOn: '2026-09-03', product: 'libraries' }),
  fact({ registeredOn: '2026-09-02', status: 'accepted', decidedOn: '2026-09-02', partnerId: 'p2', partnerName: 'Saffron Secure' }),
  fact({ registeredOn: '2026-09-03', status: 'rejected', decidedOn: '2026-09-05', rejectionReason: 'Duplicate of Saffron Retail Group', product: 'cleansight' }),
  fact({ registeredOn: '2026-09-04', status: 'lost', decidedOn: '2026-09-06' }),
  fact({ registeredOn: '2026-09-05', status: 'expired', decidedOn: '2026-09-06' }),
  fact({ registeredOn: '2026-09-06', status: 'pending' }),
];
const priorFacts: InsightFact[] = [fact({ registeredOn: '2026-06-01', status: 'won', value: 50_000, decidedOn: '2026-06-02' })];

const input = (over: Partial<ProgramReviewInput> = {}): ProgramReviewInput => ({
  edition: 'internal',
  current: buildRangedReport(currentFacts, range),
  previous: buildRangedReport(priorFacts, prior),
  insights: insightsFor(currentFacts, range),
  previousInsights: insightsFor(priorFacts, prior),
  allTime,
  scope: ['India'],
  preparer: { name: 'Gaurav Jadhav', role: 'partner_manager' },
  generatedAt: '2026-11-23T14:41:00.000Z',
  ...over,
});

const everyValue = (value: unknown, visit: (v: string | number) => void): void => {
  if (typeof value === 'string' || typeof value === 'number') visit(value);
  else if (Array.isArray(value)) for (const v of value) everyValue(v, visit);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) everyValue(v, visit);
};

describe('previousRange', () => {
  it('is the same length and ends the day before', () => {
    expect(previousRange(range)).toEqual({ preset: 'custom', from: '2026-05-28', to: '2026-08-25' });
  });
  it('handles a single day', () => {
    expect(previousRange({ from: '2026-03-01', to: '2026-03-01' })).toEqual({ preset: 'custom', from: '2026-02-28', to: '2026-02-28' });
  });
});

describe('partnerLetters', () => {
  it('runs A to Z then AA', () => {
    expect([0, 1, 25, 26, 27, 701, 702].map(partnerLetters)).toEqual(['A', 'B', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
  });
});

describe('parseEdition and programReviewQuery', () => {
  it('defaults to internal', () => {
    expect(parseEdition(undefined)).toBe('internal');
    expect(parseEdition('nonsense')).toBe('internal');
    expect(parseEdition(['shareable', 'internal'])).toBe('shareable');
  });
  it('leaves out the default range and edition', () => {
    expect(programReviewQuery(range, 'internal')).toBe('');
    expect(programReviewQuery(range, 'shareable', { autoprint: '1' })).toBe('?edition=shareable&autoprint=1');
    expect(programReviewQuery({ preset: 'custom', from: '2026-01-01', to: '2026-02-01' }, 'internal')).toBe('?range=custom&from=2026-01-01&to=2026-02-01');
  });
});

describe('buildProgramReview', () => {
  it('splits the deals by status so the segments add up, lost and expired included', () => {
    const dto = buildProgramReview(input());
    expect(dto.pipeline.stack.reduce((sum, s) => sum + s.count, 0)).toBe(6);
    expect(dto.pipeline.stack.map((s) => s.tone).sort()).toEqual(['accepted', 'expired', 'lost', 'pending', 'rejected', 'won']);
  });

  it('writes the headline from the figures and names who carried the won value', () => {
    const dto = buildProgramReview(input());
    expect(dto.summary.headline).toBe('Deal registrations more than doubled to 6. Won value rose to $200K, and Kestrel Systems carried most of it.');
  });

  it('compares against the prior period', () => {
    const kpis = buildProgramReview(input()).summary.kpis;
    expect(kpis[0]).toMatchObject({ label: 'Deals registered', value: '6', delta: '+500% from 1' });
    expect(kpis[2]).toMatchObject({ label: 'Won value', value: '$200K', delta: '+300% from $50K' });
  });

  it('says so when there is no prior period, with no NaN or Infinity anywhere', () => {
    const dto = buildProgramReview(input({ previous: buildRangedReport([], prior), previousInsights: insightsFor([], prior) }));
    expect(dto.summary.kpis[0]?.delta).toBe('None last period');
    everyValue(dto, (v) => {
      if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
      else expect(v).not.toMatch(/NaN|Infinity|undefined/);
    });
  });

  it('copes with a range that has no deals at all', () => {
    const empty = buildProgramReview(
      input({
        current: buildRangedReport([], range),
        previous: buildRangedReport([], prior),
        insights: insightsFor([], range),
        previousInsights: insightsFor([], prior),
      }),
    );
    expect(empty.summary.headline).toBe('No deals were registered in this period.');
    expect(empty.pipeline.stack).toEqual([]);
    expect(empty.partners.stat).toBeNull();
    expect(empty.decisions.bars.every((b) => b.current === null)).toBe(true);
    everyValue(empty, (v) => {
      if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
      else expect(v).not.toMatch(/NaN|Infinity|undefined/);
    });
  });

  it('keeps every partner name, manager, follow-up and rejection reason out of the Shareable edition', () => {
    const dto = buildProgramReview(input({ edition: 'shareable' }));
    const text = JSON.stringify(dto);
    for (const secret of ['Kestrel', 'Saffron', 'Ironleaf', 'Gaurav Jadhav is', 'Duplicate of', 'Follow up with']) {
      expect(text).not.toContain(secret);
    }
    expect(dto.partners.managers).toBeNull();
    expect(dto.decisions.followUps).toBeNull();
    expect(dto.decisions.rejected.reasons).toBeNull();
    expect(dto.summary.headline).toContain('one partner carried most of it');
  });

  it('gives the same partner the same letter in every table', () => {
    const dto = buildProgramReview(input({ edition: 'shareable' }));
    expect(dto.partners.leaderboard[0]?.name).toBe('Partner A');
    expect(dto.partners.allTime[0]?.name).toBe('Partner A');
    expect(new Set(dto.partners.allTime.map((r) => r.name)).size).toBe(3);
  });

  it('shows names, managers, follow-ups and reasons in the Internal edition', () => {
    const dto = buildProgramReview(input());
    expect(dto.partners.leaderboard[0]?.name).toBe('Kestrel Systems');
    expect(dto.partners.managers?.[0]?.name).toBe('Gaurav Jadhav');
    expect(dto.decisions.followUps?.[0]?.name).toBe('Ironleaf Consulting');
    expect(dto.decisions.rejected.reasons?.[0]?.label).toBe('Duplicate of Saffron Retail Group');
  });

  it('caps long tables and still totals every partner', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...(allTime.partners[0] as AdminReportsDto['partners'][number]), partnerId: `x${i}`, name: `Partner ${i}`, registered: 1, won: 1, accepted: 1, rejected: 0, protectedNow: 1 }));
    const dto = buildProgramReview(input({ allTime: { ...allTime, partners: many, totalPartners: 30, totalRegistered: 30 } }));
    expect(dto.partners.allTime).toHaveLength(7);
    expect(dto.partners.allTimeMore).toBe(23);
    expect(dto.partners.allTimeTotals).toMatchObject({ registered: 30, won: 30, protectedNow: 30 });
  });
});
