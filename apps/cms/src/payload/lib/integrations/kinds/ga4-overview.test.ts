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
  ],
};

describe('shapeGa4Overview', () => {
  it('maps the 4-report batch into the payload', () => {
    const out = shapeGa4Overview('28d', fakeBatch);
    expect(out.window).toBe('28d');
    expect(out.totals).toEqual({ sessions: 4322, totalUsers: 3140, engagementRate: 0.48, conversions: 0 });
    expect(out.daily).toEqual([
      { date: '20260601', sessions: 150 },
      { date: '20260602', sessions: 170 },
    ]);
    expect(out.topPages[0]).toEqual({ path: '/blogs/sbom-101', sessions: 540, views: 900 });
    expect(out.topCountries[0]).toEqual({ country: 'United States', sessions: 1600 });
  });

  it('defaults missing values to 0 / empty', () => {
    const out = shapeGa4Overview('7d', { reports: [{}, {}, {}, {}] });
    expect(out.totals.sessions).toBe(0);
    expect(out.daily).toEqual([]);
    expect(out.topPages).toEqual([]);
  });
});
