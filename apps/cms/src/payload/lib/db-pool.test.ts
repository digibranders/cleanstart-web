import { describe, expect, it } from 'vitest';

import { DEFAULT_DB_POOL_MAX, resolveDbPoolMax } from './db-pool';

describe('resolveDbPoolMax', () => {
  // Production Postgres allows 20 connections. A pool ceiling at or above that
  // makes burst traffic fail with "too many clients already" instead of queueing.
  it('defaults below the production max_connections of 20', () => {
    expect(DEFAULT_DB_POOL_MAX).toBeLessThan(20);
    expect(resolveDbPoolMax(undefined)).toBe(DEFAULT_DB_POOL_MAX);
  });

  it('treats an empty value as unset', () => {
    expect(resolveDbPoolMax('')).toBe(DEFAULT_DB_POOL_MAX);
    expect(resolveDbPoolMax('  ')).toBe(DEFAULT_DB_POOL_MAX);
  });

  it('honours a valid override', () => {
    expect(resolveDbPoolMax('12')).toBe(12);
    expect(resolveDbPoolMax(' 8 ')).toBe(8);
  });

  it.each(['abc', '0', '-3', '7.5', '10x'])('rejects %s instead of passing NaN to pg', (raw) => {
    expect(() => resolveDbPoolMax(raw)).toThrow(/DB_POOL_MAX/);
  });
});
