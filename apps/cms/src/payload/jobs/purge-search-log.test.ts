import { describe, expect, it, vi } from 'vitest';

import * as lib from '../lib/retention/purge-search-log';
import { purgeSearchLogTask } from './purge-search-log';

const handler = purgeSearchLogTask.handler as (args: unknown) => Promise<unknown>;

describe('purgeSearchLogTask', () => {
  it('is configured with daily 03:00 UTC schedule', () => {
    expect(purgeSearchLogTask.slug).toBe('purgeSearchLog');
    expect(purgeSearchLogTask.retries).toBe(0);
    expect(purgeSearchLogTask.schedule?.[0]).toEqual(
      expect.objectContaining({ cron: '0 3 * * *', queue: 'searchLogPurge' }),
    );
  });

  it('delegates to purgeSearchLog and wraps result in `output`', async () => {
    const spy = vi
      .spyOn(lib, 'purgeSearchLog')
      .mockResolvedValueOnce({ deleted: 12 } as never);
    const fakePayload = {};
    const result = await handler({
      req: { payload: fakePayload },
    } as never);
    expect(spy).toHaveBeenCalledWith(fakePayload);
    expect(result).toEqual({ output: { deleted: 12 } });
    spy.mockRestore();
  });
});
