import type { CollectionBeforeChangeHook } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { enforceSingleHeroEpisodeHook } from './PodcastEpisodes';

/**
 * Behavioural lock on the single-hero invariant: at most one podcast episode
 * may carry `heroEpisode`. Flagging one must clear the flag on all others;
 * unflagging (or leaving it off) must touch nothing.
 */

type HookArgs = Parameters<CollectionBeforeChangeHook>[0];

const runHook = (args: {
  data: Record<string, unknown>;
  originalDoc?: { id: number | string };
  update?: ReturnType<typeof vi.fn>;
}) => {
  const update = args.update ?? vi.fn().mockResolvedValue({ docs: [] });
  const result = enforceSingleHeroEpisodeHook({
    data: args.data,
    originalDoc: args.originalDoc,
    req: { payload: { update } },
  } as unknown as HookArgs);
  return { update, result };
};

describe('enforceSingleHeroEpisodeHook', () => {
  it('clears the flag on every other episode when one is flagged (update)', async () => {
    const { update, result } = runHook({
      data: { heroEpisode: true },
      originalDoc: { id: 7 },
    });
    await result;

    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0]?.[0];
    expect(call?.collection).toBe('podcastEpisodes');
    expect(call?.data).toEqual({ heroEpisode: false });
    expect(call?.where).toEqual({
      and: [{ heroEpisode: { equals: true } }, { id: { not_equals: 7 } }],
    });
  });

  it('clears all flagged episodes on create (no originalDoc id to exclude)', async () => {
    const { update, result } = runHook({ data: { heroEpisode: true } });
    await result;

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]?.where).toEqual({
      heroEpisode: { equals: true },
    });
  });

  it('does nothing when heroEpisode is false', async () => {
    const { update } = runHook({
      data: { heroEpisode: false },
      originalDoc: { id: 7 },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('does nothing when heroEpisode is absent', async () => {
    const { update } = runHook({ data: { title: 'No hero flag here' } });
    expect(update).not.toHaveBeenCalled();
  });
});
