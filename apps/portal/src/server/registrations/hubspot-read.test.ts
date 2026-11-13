import { describe, expect, it } from 'vitest';
import { withTimeout } from './hubspot-read';

describe('withTimeout', () => {
  it('returns the value when the promise is quick', async () => {
    expect(await withTimeout(Promise.resolve(7), 50)).toBe(7);
  });
  it('returns null when the promise is slower than the limit, so a request never waits on HubSpot', async () => {
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 200));
    expect(await withTimeout(slow, 10)).toBeNull();
  });
  it('passes a rejection through', async () => {
    await expect(withTimeout(Promise.reject(new Error('429')), 50)).rejects.toThrow('429');
  });
});
