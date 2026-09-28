import { describe, expect, it, vi } from 'vitest';

import { flushPendingAfterCommitEffects, runAfterCommit } from './after-commit';

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

describe('flushPendingAfterCommitEffects', () => {
  it('resolves immediately when nothing is pending', async () => {
    await expect(flushPendingAfterCommitEffects()).resolves.toBeUndefined();
  });

  it('runs a deferred effect that would otherwise be killed by process.exit timing', async () => {
    vi.useFakeTimers();
    const effect = vi.fn().mockResolvedValue('done');

    const result = await runAfterCommit(effect, 'tx-1');
    expect(result.deferred).toBe(true);
    expect(effect).not.toHaveBeenCalled();

    const flushed = flushPendingAfterCommitEffects();
    await vi.runAllTimersAsync();
    await flushed;

    expect(effect).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('waits for multiple pending effects across different collections in parallel', async () => {
    vi.useFakeTimers();
    const blogsEffect = vi.fn().mockResolvedValue(undefined);
    const newsEffect = vi.fn().mockResolvedValue(undefined);

    await runAfterCommit(blogsEffect, 'tx-1');
    await runAfterCommit(newsEffect, 'tx-2');

    const flushed = flushPendingAfterCommitEffects();
    await vi.runAllTimersAsync();
    await flushed;

    expect(blogsEffect).toHaveBeenCalledTimes(1);
    expect(newsEffect).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not surface a flushed effect error — onError still owns it', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    await runAfterCommit(
      async () => {
        throw new Error('meili down');
      },
      'tx-1',
      onError,
    );

    const flushed = flushPendingAfterCommitEffects();
    await vi.runAllTimersAsync();
    await expect(flushed).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('is safe to call more than once', async () => {
    vi.useFakeTimers();
    const effect = vi.fn().mockResolvedValue(undefined);

    await runAfterCommit(effect, 'tx-1');
    const first = flushPendingAfterCommitEffects();
    await vi.runAllTimersAsync();
    await first;
    await expect(flushPendingAfterCommitEffects()).resolves.toBeUndefined();

    expect(effect).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
