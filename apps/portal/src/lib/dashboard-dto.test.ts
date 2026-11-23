import { describe, expect, it } from 'vitest';
import { hasActiveFilters, parseDashboardFilters, periodRange, periodStart } from './dashboard-dto';

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
    const params = { period: '5y', region: 'Mars!', product: 'x', partnerId: 'not-a-uuid' };
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

describe('custom range and category', () => {
  it('reads a custom range and a staff category', () => {
    const params = { period: 'custom', from: '2026-09-01', to: '2026-10-15', category: 'channel' };
    expect(parseDashboardFilters(params, { staff: true })).toEqual({ period: 'custom', from: '2026-09-01', to: '2026-10-15', category: 'channel' });
  });

  it('treats from and to without a period as custom, and drops the category for a partner viewer', () => {
    expect(parseDashboardFilters({ from: '2026-09-01', to: '2026-09-30', category: 'channel' }, { staff: false })).toEqual({ period: 'custom', from: '2026-09-01', to: '2026-09-30' });
  });

  it('falls back to the default on a bad, reversed or half range', () => {
    for (const params of [{ period: 'custom', from: '2026-13-01', to: '2026-10-01' }, { period: 'custom', from: '2026-10-02', to: '2026-10-01' }, { period: 'custom', from: '2026-10-01' }, { period: '30d', from: '2026-09-01', to: '2026-09-30' }]) {
      expect(parseDashboardFilters(params, { staff: true }).period).not.toBe('custom');
    }
    expect(parseDashboardFilters({ category: 'reseller' }, { staff: true })).toEqual({ period: '90d' });
  });

  it('resolves presets and cuts a custom range off at today', () => {
    expect(periodRange({ period: '30d' }, '2026-11-23')).toEqual({ from: '2026-10-25', to: '2026-11-23' });
    expect(periodRange({ period: 'custom', from: '2026-09-01', to: '2026-10-15' }, '2026-11-23')).toEqual({ from: '2026-09-01', to: '2026-10-15' });
    expect(periodRange({ period: 'custom', from: '2026-11-01', to: '2027-01-01' }, '2026-11-23')).toEqual({ from: '2026-11-01', to: '2026-11-23' });
    expect(periodRange({ period: 'custom', from: '2027-01-01', to: '2027-02-01' }, '2026-11-23')).toEqual({ from: '2026-11-23', to: '2026-11-23' });
  });

  it('knows when a filter is active', () => {
    expect(hasActiveFilters({ period: '90d' })).toBe(false);
    expect(hasActiveFilters({ period: '30d' })).toBe(true);
    expect(hasActiveFilters({ period: '90d', category: 'channel' })).toBe(true);
  });
});
