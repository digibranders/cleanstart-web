import { describe, expect, it } from 'vitest';
import { poolSizes } from './pool-size';

describe('poolSizes', () => {
  it('keeps the current sizes when nothing is set', () => {
    expect(poolSizes({})).toEqual({ request: 6, system: 8 });
    expect(poolSizes({ PORTAL_DEMO_MODE: '0' })).toEqual({ request: 6, system: 8 });
  });

  it('uses a small pool in demo mode', () => {
    expect(poolSizes({ PORTAL_DEMO_MODE: '1' })).toEqual({ request: 3, system: 3 });
  });

  it('lets PORTAL_DB_POOL_MAX size both pools, in demo mode or not', () => {
    expect(poolSizes({ PORTAL_DB_POOL_MAX: '2' })).toEqual({ request: 2, system: 2 });
    expect(poolSizes({ PORTAL_DEMO_MODE: '1', PORTAL_DB_POOL_MAX: '5' })).toEqual({ request: 5, system: 5 });
  });

  it.each(['0', '-1', '1.5', 'abc', '51', ' '])('rejects %j', (value) => {
    expect(() => poolSizes({ PORTAL_DB_POOL_MAX: value })).toThrow(/PORTAL_DB_POOL_MAX/);
  });
});
