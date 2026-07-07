import { afterEach, describe, expect, it, vi } from 'vitest';

import { computePresetRange } from './export-date-preset';

describe('computePresetRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const freezeNow = (iso: string): void => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  };

  it('returns null/null for allTime', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('allTime')).toEqual({ from: null, to: null });
  });

  it('returns null/null for custom (caller owns the actual values)', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('custom')).toEqual({ from: null, to: null });
  });

  it('today: from and to are the same local calendar day', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('today')).toEqual({ from: '2026-06-15', to: '2026-06-15' });
  });

  it('last7: spans 7 days inclusive of today', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('last7')).toEqual({ from: '2026-06-09', to: '2026-06-15' });
  });

  it('last30: spans 30 days inclusive of today', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('last30')).toEqual({ from: '2026-05-17', to: '2026-06-15' });
  });

  it('thisMonth: from the 1st of the current month through today', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('thisMonth')).toEqual({ from: '2026-06-01', to: '2026-06-15' });
  });

  it('lastMonth: full previous calendar month', () => {
    freezeNow('2026-06-15T12:00:00Z');
    expect(computePresetRange('lastMonth')).toEqual({ from: '2026-05-01', to: '2026-05-31' });
  });

  it('lastMonth: rolls back across a year boundary (January -> December)', () => {
    freezeNow('2026-01-15T12:00:00Z');
    expect(computePresetRange('lastMonth')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('lastMonth: handles a leap-February previous month', () => {
    freezeNow('2028-03-01T12:00:00Z');
    expect(computePresetRange('lastMonth')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('lastMonth: handles a non-leap-February previous month', () => {
    freezeNow('2026-03-01T12:00:00Z');
    expect(computePresetRange('lastMonth')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('lastMonth: handles a 31-day previous month correctly (no rollover into month+1)', () => {
    freezeNow('2026-08-01T12:00:00Z');
    expect(computePresetRange('lastMonth')).toEqual({ from: '2026-07-01', to: '2026-07-31' });
  });
});
