import { describe, expect, it } from 'vitest';
import { NETWORK_FAILURE_STATUS, settleAuth } from './auth-call';

describe('settleAuth', () => {
  it('passes a resolved result through untouched', async () => {
    const ok = { data: { user: 1 }, error: null };
    await expect(settleAuth(async () => ok)).resolves.toBe(ok);
  });

  it('passes a returned error through untouched', async () => {
    const failed = { data: null, error: { status: 429, statusText: 'Too Many Requests', message: 'slow down' } };
    await expect(settleAuth(async () => failed)).resolves.toBe(failed);
  });

  it('turns a thrown network failure into an error with the network status', async () => {
    const result = await settleAuth(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(result.data).toBeNull();
    expect(result.error?.status).toBe(NETWORK_FAILURE_STATUS);
  });
});
