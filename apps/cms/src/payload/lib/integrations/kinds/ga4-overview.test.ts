import { describe, expect, it } from 'vitest';

import { shapeGa4Overview } from './ga4-overview';

const fakeBatch = {
  reports: [
    { rows: [{ metricValues: [{ value: '4322' }, { value: '3140' }, { value: '0.48' }, { value: '0' }] }] },
    {
      rows: [
        { dimensionValues: [{ value: '20260601' }], metricValues: [{ value: '150' }] },
        { dimensionValues: [{ value: '20260602' }], metricValues: [{ value: '170' }] },
      ],
    },
    {
      rows: [
        { dimensionValues: [{ value: '/blogs/sbom-101' }], metricValues: [{ value: '540' }, { value: '900' }] },
      ],
    },
    {
      rows: [{ dimensionValues: [{ value: 'United States' }], metricValues: [{ value: '1600' }] }],
    },
    // [4] prior-period totals (sessions 4000 → +8.05%)
    { rows: [{ metricValues: [{ value: '4000' }, { value: '3000' }, { value: '0.5' }, { value: '0' }] }] },
    // [5] channels
    { rows: [{ dimensionValues: [{ value: 'Organic Search' }], metricValues: [{ value: '2600' }] }] },
    // [6] devices
    { rows: [{ dimensionValues: [{ value: 'desktop' }], metricValues: [{ value: '2400' }] }] },
    // [7] sources
    { rows: [{ dimensionValues: [{ value: 'google' }], metricValues: [{ value: '2500' }] }] },
    // [8] pagePath × date for sparklines
    {
      rows: [
        { dimensionValues: [{ value: '/blogs/sbom-101' }, { value: '20260602' }], metricValues: [{ value: '300' }] },
        { dimensionValues: [{ value: '/blogs/sbom-101' }, { value: '20260601' }], metricValues: [{ value: '240' }] },
      ],
    },
  ],
};

describe('shapeGa4Overview', () => {
  it('maps the full report batch into the payload', () => {
    const out = shapeGa4Overview('28d', fakeBatch);
    expect(out.window).toBe('28d');
    expect(out.totals).toEqual({ sessions: 4322, totalUsers: 3140, engagementRate: 0.48, conversions: 0 });
    expect(out.daily).toEqual([
      { date: '20260601', sessions: 150 },
      { date: '20260602', sessions: 170 },
    ]);
    expect(out.topPages[0]).toMatchObject({ path: '/blogs/sbom-101', sessions: 540, views: 900 });
    expect(out.topCountries[0]).toEqual({ country: 'United States', sessions: 1600 });
  });

  it('computes deltas, splits, and per-page sparkline series', () => {
    const out = shapeGa4Overview('28d', fakeBatch);
    expect(out.deltas?.sessions.value).toBe(4322);
    expect(out.deltas?.sessions.deltaPct).toBeCloseTo(0.0805, 3);
    expect(out.channels?.[0]).toEqual({ label: 'Organic Search', sessions: 2600 });
    expect(out.devices?.[0]).toEqual({ label: 'desktop', sessions: 2400 });
    expect(out.sources?.[0]).toEqual({ label: 'google', sessions: 2500 });
    // sparkline series sorted ascending by date
    expect(out.topPages[0]?.daily).toEqual([
      { date: '20260601', sessions: 240 },
      { date: '20260602', sessions: 300 },
    ]);
  });

  it('defaults missing values to 0 / empty', () => {
    const out = shapeGa4Overview('7d', { reports: [{}, {}, {}, {}] });
    expect(out.totals.sessions).toBe(0);
    expect(out.daily).toEqual([]);
    expect(out.topPages).toEqual([]);
    expect(out.deltas?.sessions.deltaPct).toBeNull();
    expect(out.channels).toEqual([]);
  });
});
