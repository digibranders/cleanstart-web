import { describe, expect, it } from 'vitest';

import { bucketPositions, buildScatter, computeDelta, shapeRealtime } from './advanced-metrics';

describe('computeDelta', () => {
  it('computes pct change vs prior', () => {
    expect(computeDelta(110, 100)).toEqual({ value: 110, deltaPct: 0.1 });
  });
  it('returns null pct when prior is 0', () => {
    expect(computeDelta(50, 0)).toEqual({ value: 50, deltaPct: null });
  });
});

describe('bucketPositions', () => {
  it('buckets query positions into 1-3 / 4-10 / 11-20 / 21+', () => {
    const out = bucketPositions([
      { position: 2 },
      { position: 3 },
      { position: 7 },
      { position: 15 },
      { position: 40 },
    ]);
    expect(out).toEqual([
      { label: '1–3', count: 2 },
      { label: '4–10', count: 1 },
      { label: '11–20', count: 1 },
      { label: '21+', count: 1 },
    ]);
  });
});

describe('buildScatter', () => {
  it('maps and caps rows by impressions', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      position: i + 1,
      ctr: 0.1,
      impressions: (i + 1) * 10,
    }));
    const out = buildScatter(rows, 3);
    expect(out).toHaveLength(3);
    expect(out[0]?.impressions).toBe(50);
  });
});

describe('shapeRealtime', () => {
  it('maps total active users + per-page rows', () => {
    const out = shapeRealtime(
      { rows: [{ metricValues: [{ value: '42' }] }] },
      {
        rows: [
          { dimensionValues: [{ value: '/blogs/sbom-101' }], metricValues: [{ value: '12' }] },
          { dimensionValues: [{ value: '/guide/x' }], metricValues: [{ value: '8' }] },
        ],
      },
    );
    expect(out.activeUsers).toBe(42);
    expect(out.byPage).toEqual([
      { path: '/blogs/sbom-101', users: 12 },
      { path: '/guide/x', users: 8 },
    ]);
  });
});
