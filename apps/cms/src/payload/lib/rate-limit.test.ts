import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_RATE_LIMITS,
  RateLimitMisconfigured,
  __rateLimitStoreSize,
  __resetRateLimitStore,
  checkAndRecord,
  validateRateLimitBootConfig,
} from './rate-limit';

const now = Date.now();
const MINUTE = 60 * 1000;

afterEach(() => {
  __resetRateLimitStore();
});

describe('checkAndRecord', () => {
  it('allows submissions within the per-minute window', () => {
    for (let i = 0; i < DEFAULT_RATE_LIMITS.perMinute; i++) {
      const result = checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + i * 100);
      expect(result.ok).toBe(true);
    }
  });

  it('blocks the (perMinute + 1)th submission inside one minute', () => {
    for (let i = 0; i < DEFAULT_RATE_LIMITS.perMinute; i++) {
      checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + i * 100);
    }
    const result = checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('per-minute');
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('allows submissions after the per-minute window passes', () => {
    for (let i = 0; i < DEFAULT_RATE_LIMITS.perMinute; i++) {
      checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + i * 100);
    }
    const result = checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + 2 * MINUTE);
    expect(result.ok).toBe(true);
  });

  it('blocks at the per-day cap even when minute window is fresh', () => {
    const config = { perMinute: 1000, perDay: 3 };
    checkAndRecord('1.1.1.1', config, now);
    checkAndRecord('1.1.1.1', config, now + 5 * MINUTE);
    checkAndRecord('1.1.1.1', config, now + 10 * MINUTE);
    const result = checkAndRecord('1.1.1.1', config, now + 60 * MINUTE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('per-day');
  });

  it('isolates buckets per key', () => {
    for (let i = 0; i < DEFAULT_RATE_LIMITS.perMinute; i++) {
      checkAndRecord('1.1.1.1', DEFAULT_RATE_LIMITS, now + i * 100);
    }
    const otherKey = checkAndRecord('2.2.2.2', DEFAULT_RATE_LIMITS, now + 1000);
    expect(otherKey.ok).toBe(true);
  });

  it('returns remaining counts on success', () => {
    const result = checkAndRecord('3.3.3.3', { perMinute: 10, perDay: 100 }, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.remaining.perMinute).toBe(9);
      expect(result.remaining.perDay).toBe(99);
    }
  });

  describe('validateRateLimitBootConfig', () => {
    it('allows memory backend with single worker (concurrency unset)', () => {
      expect(() =>
        validateRateLimitBootConfig({ backend: undefined, concurrency: undefined }),
      ).not.toThrow();
    });

    it('allows memory backend with WEB_CONCURRENCY=1', () => {
      expect(() =>
        validateRateLimitBootConfig({ backend: 'memory', concurrency: '1' }),
      ).not.toThrow();
    });

    it('throws when memory backend pairs with multi-worker concurrency', () => {
      expect(() =>
        validateRateLimitBootConfig({ backend: undefined, concurrency: '4' }),
      ).toThrow(RateLimitMisconfigured);
      expect(() =>
        validateRateLimitBootConfig({ backend: 'memory', concurrency: '4' }),
      ).toThrow(RateLimitMisconfigured);
    });

    it('throws for redis/postgres backends (not yet implemented)', () => {
      // redis/postgres are unimplemented — accepting them silently would let
      // operators bypass the multi-worker guard while the store stays in-memory.
      expect(() =>
        validateRateLimitBootConfig({ backend: 'redis', concurrency: '4' }),
      ).toThrow(RateLimitMisconfigured);
      expect(() =>
        validateRateLimitBootConfig({ backend: 'postgres', concurrency: '8' }),
      ).toThrow(RateLimitMisconfigured);
    });

    it('throws on non-numeric WEB_CONCURRENCY', () => {
      expect(() =>
        validateRateLimitBootConfig({ backend: 'memory', concurrency: 'auto' }),
      ).toThrow(RateLimitMisconfigured);
    });
  });

  it('janitor sweep evicts buckets that aged out of the day window', () => {
    const config = { perMinute: 1000, perDay: 1000 };
    // Record one hit for 300 distinct keys to seed the Map.
    for (let i = 0; i < 300; i += 1) {
      checkAndRecord(`ip-${i}`, config, now);
    }
    expect(__rateLimitStoreSize()).toBe(300);

    // Walk forward past the day window. The janitor sweeps every 256 calls,
    // so the 257th call after the time skip triggers a global cleanup.
    const farFuture = now + 25 * 60 * 60 * 1000;
    for (let i = 0; i < 257; i += 1) {
      checkAndRecord(`fresh-${i}`, config, farFuture);
    }
    // The 300 stale keys should be gone; only the fresh 257 remain.
    expect(__rateLimitStoreSize()).toBeLessThan(300);
  });
});
