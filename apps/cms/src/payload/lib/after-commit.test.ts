import { describe, expect, it, vi } from 'vitest';

import { runAfterCommit } from './after-commit';

describe('runAfterCommit', () => {
  it('awaits the effect inline when no transaction is open', async () => {
    const effect = vi.fn().mockResolvedValue('done');

    const result = await runAfterCommit(effect, undefined);

    expect(result.deferred).toBe(false);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('defers past the commit without awaiting when a transaction is open', async () => {
    vi.useFakeTimers();
    const effect = vi.fn().mockResolvedValue('done');

    const result = await runAfterCommit(effect, 'tx-1');

    expect(result.deferred).toBe(true);
    expect(effect).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(effect).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('routes a deferred failure to onError instead of an unhandled rejection', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    await runAfterCommit(async () => {
      throw new Error('downstream down');
    }, 'tx-1', onError);

    await vi.runAllTimersAsync();
    expect(onError).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('swallows an inline failure so a hook cannot break the surrounding save', async () => {
    const onError = vi.fn();

    await expect(
      runAfterCommit(async () => {
        throw new Error('nope');
      }, undefined, onError),
    ).resolves.toEqual({ deferred: false });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
