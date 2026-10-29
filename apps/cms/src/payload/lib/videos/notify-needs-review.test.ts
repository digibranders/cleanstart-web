import type { BasePayload } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { notifyNeedsReview, needsReviewListUrl } from './notify-needs-review';

const fakePayload = (): BasePayload => ({ logger: { warn: vi.fn() } }) as unknown as BasePayload;
const SERVER = 'https://cms.cleanstart.com/';

describe('needsReviewListUrl', () => {
  it('points at the videos list filtered to Needs review, without a double slash', () => {
    expect(needsReviewListUrl(SERVER)).toBe(
      'https://cms.cleanstart.com/admin/collections/videos?where[syncState][equals]=needs-review',
    );
  });

  it('is null without a base URL', () => {
    expect(needsReviewListUrl(undefined)).toBeNull();
    expect(needsReviewListUrl('')).toBeNull();
  });
});

describe('notifyNeedsReview', () => {
  it('sends nothing when no video was created', async () => {
    const dispatch = vi.fn();
    await notifyNeedsReview({ payload: fakePayload(), count: 0, titles: [], skip: false, serverUrl: SERVER, dispatch });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('sends nothing in a bulk script context', async () => {
    const dispatch = vi.fn();
    await notifyNeedsReview({ payload: fakePayload(), count: 4, titles: ['A'], skip: true, serverUrl: SERVER, dispatch });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('sends one event with count, at most five titles and the admin URL', async () => {
    const dispatch = vi.fn().mockResolvedValue([]);
    const titles = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    await notifyNeedsReview({ payload: fakePayload(), count: 7, titles, skip: false, serverUrl: SERVER, dispatch });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toEqual({
      event: 'video.needs-review',
      data: {
        count: 7,
        titles: ['A', 'B', 'C', 'D', 'E'],
        adminUrl: 'https://cms.cleanstart.com/admin/collections/videos?where[syncState][equals]=needs-review',
      },
    });
  });

  it('omits adminUrl when the CMS base URL is not configured', async () => {
    const dispatch = vi.fn().mockResolvedValue([]);
    await notifyNeedsReview({ payload: fakePayload(), count: 1, titles: ['A'], skip: false, serverUrl: undefined, dispatch });
    expect(dispatch.mock.calls[0]?.[0]).toEqual({ event: 'video.needs-review', data: { count: 1, titles: ['A'] } });
  });

  it('never throws when dispatch does, and logs a warning', async () => {
    const payload = fakePayload();
    const dispatch = vi.fn().mockRejectedValue(new Error('teams down'));
    await expect(
      notifyNeedsReview({ payload, count: 1, titles: ['A'], skip: false, serverUrl: SERVER, dispatch }),
    ).resolves.toBeUndefined();
    expect(payload.logger.warn).toHaveBeenCalledWith({ error: 'teams down' }, expect.any(String));
  });
});
