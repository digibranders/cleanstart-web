import { describe, expect, it } from 'vitest';
import { parseDashboardFilters, periodStart } from './dashboard-dto';

const ID = '8f14e45f-ceea-467a-9575-6a9a3b6f1c11';

describe('parseDashboardFilters', () => {
  it('defaults to 90 days and no filters', () => {
    expect(parseDashboardFilters(new URLSearchParams(), { staff: true })).toEqual({ period: '90d' });
  });

  it('reads every valid value', () => {
    const params = new URLSearchParams({ period: '12m', region: 'middle_east', product: 'libraries', partnerId: ID });
    expect(parseDashboardFilters(params, { staff: true })).toEqual({ period: '12m', region: 'middle_east', product: 'libraries', partnerId: ID });
  });

  it('falls back on bad values instead of failing', () => {
    const params = { period: '5y', region: 'mars', product: 'x', partnerId: 'not-a-uuid' };
    expect(parseDashboardFilters(params, { staff: true })).toEqual({ period: '90d' });
  });

  it('ignores partnerId for a partner viewer', () => {
    expect(parseDashboardFilters({ partnerId: ID, period: 'ytd' }, { staff: false })).toEqual({ period: 'ytd' });
  });

  it('takes the first of a repeated parameter', () => {
    expect(parseDashboardFilters({ period: ['30d', '12m'] }, { staff: false })).toEqual({ period: '30d' });
  });
});

describe('periodStart', () => {
  it('counts today as the last day of a 30 or 90 day period', () => {
    expect(periodStart('30d', '2026-11-23')).toBe('2026-10-25');
    expect(periodStart('90d', '2026-11-23')).toBe('2026-08-26');
  });

  it('starts 12 months back at the first of the month, and the year at 1 January', () => {
    expect(periodStart('12m', '2026-11-23')).toBe('2025-11-01');
    expect(periodStart('ytd', '2026-11-23')).toBe('2026-01-01');
  });
});
