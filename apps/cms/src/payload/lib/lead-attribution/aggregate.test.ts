import { describe, expect, it } from 'vitest';

import { type AttributionLeadRow, NONE_KEY, aggregateLeads } from './aggregate';

const row = (over: Partial<AttributionLeadRow>): AttributionLeadRow => ({
  createdAt: '2026-07-10T09:00:00.000Z',
  ...over,
});

describe('aggregateLeads', () => {
  it('counts total leads and buckets by channel', () => {
    const report = aggregateLeads([
      row({ attribution: { channel: 'paid_search' } }),
      row({ attribution: { channel: 'paid_search' } }),
      row({ attribution: { channel: 'organic_search' } }),
      row({ attribution: null }),
    ]);
    expect(report.totalLeads).toBe(4);
    expect(report.byChannel[0]).toEqual({ key: 'paid_search', label: 'Paid Search', count: 2 });
    // The untagged bucket sorts last with a human label.
    expect(report.byChannel.at(-1)?.key).toBe(NONE_KEY);
  });

  it('groups utm source and campaign, ties broken alphabetically', () => {
    const report = aggregateLeads([
      row({ utm: { source: 'google', campaign: 'spring' } }),
      row({ utm: { source: 'bing', campaign: 'spring' } }),
      row({ utm: { source: 'google', campaign: 'summer' } }),
    ]);
    expect(report.byUtmSource).toEqual([
      { key: 'google', label: 'google', count: 2 },
      { key: 'bing', label: 'bing', count: 1 },
    ]);
    expect(report.byUtmCampaign[0]).toEqual({ key: 'spring', label: 'spring', count: 2 });
  });

  it('separates first-touch and last-touch source', () => {
    const report = aggregateLeads([
      row({
        utm: { source: 'bing' },
        attribution: { firstTouch: { source: 'google' } },
      }),
    ]);
    expect(report.firstTouchSource[0]?.key).toBe('google');
    expect(report.lastTouchSource[0]?.key).toBe('bing');
  });

  it('rolls up leads per day sorted chronologically', () => {
    const report = aggregateLeads([
      row({ createdAt: '2026-07-11T10:00:00Z' }),
      row({ createdAt: '2026-07-10T10:00:00Z' }),
      row({ createdAt: '2026-07-10T23:00:00Z' }),
    ]);
    expect(report.daily).toEqual([
      { date: '2026-07-10', count: 2 },
      { date: '2026-07-11', count: 1 },
    ]);
  });

  it('reads the form name from a populated relationship', () => {
    const report = aggregateLeads([
      row({ form: { name: 'Book a Demo' } }),
      row({ form: 42 }),
    ]);
    expect(report.byForm[0]).toEqual({ key: 'Book a Demo', label: 'Book a Demo', count: 1 });
    expect(report.byForm.some((b) => b.key === NONE_KEY)).toBe(true);
  });
});
