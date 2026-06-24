import { describe, expect, it } from 'vitest';

import { mapCruxRecord, mapMetric } from './crux';

describe('mapMetric', () => {
  it('rates at the good/needs-improvement/poor boundaries', () => {
    expect(mapMetric(2500, 2500, 4000)).toEqual({ p75: 2500, rating: 'good' });
    expect(mapMetric(2501, 2500, 4000)?.rating).toBe('needs-improvement');
    expect(mapMetric(4000, 2500, 4000)?.rating).toBe('needs-improvement');
    expect(mapMetric(4001, 2500, 4000)?.rating).toBe('poor');
  });
  it('returns null when p75 is missing', () => {
    expect(mapMetric(undefined, 2500, 4000)).toBeNull();
  });
});

describe('mapCruxRecord', () => {
  it('maps the three CWV metrics with standard thresholds', () => {
    const rec = mapCruxRecord('origin', 'PHONE', {
      largest_contentful_paint: { percentiles: { p75: 3200 } },
      interaction_to_next_paint: { percentiles: { p75: 150 } },
      cumulative_layout_shift: { percentiles: { p75: '0.3' } },
    });
    expect(rec.scope).toBe('origin');
    expect(rec.formFactor).toBe('PHONE');
    expect(rec.lcp).toEqual({ p75: 3200, rating: 'needs-improvement' });
    expect(rec.inp).toEqual({ p75: 150, rating: 'good' });
    expect(rec.cls).toEqual({ p75: 0.3, rating: 'poor' });
  });
});
