import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { RateLimitError } from '@/server/errors';
import { rateLimit, resetRateLimits } from './rate-limit';

const rule = { limit: 3, windowSeconds: 60 };

describe('rateLimit', () => {
  beforeEach(resetRateLimits);

  it('allows `limit` calls in a window and then throws with the seconds left', () => {
    const at = fixedClock('2026-11-06T14:00:00Z');
    for (let i = 0; i < 3; i += 1) rateLimit('apply:ip:1.1.1.1', rule, at);
    try {
      rateLimit('apply:ip:1.1.1.1', rule, fixedClock('2026-11-06T14:00:20Z'));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfterSeconds).toBe(40);
    }
  });

  it('starts a new window once the old one has passed', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('k', rule, fixedClock('2026-11-06T14:00:00Z'));
    expect(() => rateLimit('k', rule, fixedClock('2026-11-06T14:01:00Z'))).not.toThrow();
  });

  it('counts each key on its own', () => {
    const at = fixedClock('2026-11-06T14:00:00Z');
    for (let i = 0; i < 3; i += 1) rateLimit('a', rule, at);
    expect(() => rateLimit('b', rule, at)).not.toThrow();
  });
});
