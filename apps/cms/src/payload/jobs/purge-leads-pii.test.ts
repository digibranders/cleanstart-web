import { describe, expect, it, vi } from 'vitest';

import * as lib from '../lib/retention/purge-leads-pii';
import { purgeLeadsPiiTask } from './purge-leads-pii';

const handler = purgeLeadsPiiTask.handler as (args: unknown) => Promise<unknown>;

describe('purgeLeadsPiiTask', () => {
  it('is scheduled daily on the leadsPiiPurge queue', () => {
    expect(purgeLeadsPiiTask.slug).toBe('purgeLeadsPii');
    expect(purgeLeadsPiiTask.retries).toBe(0);
    expect(purgeLeadsPiiTask.schedule?.[0]).toEqual(
      expect.objectContaining({ cron: '15 3 * * *', queue: 'leadsPiiPurge' }),
    );
  });

  it('delegates to purgeLeadsPii() and wraps the result in `output`', async () => {
    const spy = vi
      .spyOn(lib, 'purgeLeadsPii')
      .mockResolvedValueOnce({ scanned: 7, redacted: 3 } as never);
    const fakePayload = { id: 'payload' };
    const result = await handler({
      req: { payload: fakePayload },
    } as never);
    expect(spy).toHaveBeenCalledWith(fakePayload);
    expect(result).toEqual({ output: { scanned: 7, redacted: 3 } });
    spy.mockRestore();
  });

  it('propagates errors from the underlying lib (no swallow)', async () => {
    const spy = vi
      .spyOn(lib, 'purgeLeadsPii')
      .mockRejectedValueOnce(new Error('db down'));
    await expect(
      handler({ req: { payload: {} } } as never),
    ).rejects.toThrow('db down');
    spy.mockRestore();
  });
});
