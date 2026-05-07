import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dispatchModule from '../lib/webhooks/dispatch';
import { webhooksPublishAfterChangeHook } from './webhooks-publish';

const dispatchSpy = vi.spyOn(dispatchModule, 'dispatchEvent');

const makeReq = () =>
  ({
    payload: {
      logger: { warn: vi.fn() },
    },
  }) as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]['req'];

afterEach(() => {
  dispatchSpy.mockReset();
});

describe('webhooksPublishAfterChangeHook', () => {
  it('fires document.published on first publish (draft → published)', async () => {
    dispatchSpy.mockResolvedValueOnce([]);
    const hook = webhooksPublishAfterChangeHook('blogs');
    const doc = { id: 1, slug: 'x', title: 'X', _status: 'published', updatedAt: '2026-05-05' };
    await hook({
      doc,
      previousDoc: { _status: 'draft' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'document.published',
        data: expect.objectContaining({
          collection: 'blogs',
          id: 1,
          slug: 'x',
          title: 'X',
          publishedAt: '2026-05-05',
        }),
      }),
      expect.any(Object),
    );
  });

  it('fires on first publish for a doc with no previous version (new draft → published)', async () => {
    dispatchSpy.mockResolvedValueOnce([]);
    const hook = webhooksPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 2, slug: 'new', title: 'New', _status: 'published' },
      previousDoc: undefined,
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('does NOT fire on republish (published → published)', async () => {
    const hook = webhooksPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, _status: 'published' },
      previousDoc: { _status: 'published' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does NOT fire when the new state is draft (published → draft, save-as-draft)', async () => {
    const hook = webhooksPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, _status: 'draft' },
      previousDoc: { _status: 'published' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('falls back to publicationDate / updatedAt when publishedAt is unset (news shape)', async () => {
    dispatchSpy.mockResolvedValueOnce([]);
    const hook = webhooksPublishAfterChangeHook('news');
    await hook({
      doc: {
        id: 1,
        slug: 'launch',
        title: 'Launch',
        _status: 'published',
        publicationDate: '2026-05-04T09:00:00Z',
      },
      previousDoc: { _status: 'draft' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    const calledWith = dispatchSpy.mock.calls[0]?.[0] as unknown as {
      data: { publishedAt: string };
    };
    expect(calledWith.data.publishedAt).toBe('2026-05-04T09:00:00Z');
  });

  it('uses doc.name when title is absent (authors shape)', async () => {
    dispatchSpy.mockResolvedValueOnce([]);
    const hook = webhooksPublishAfterChangeHook('authors');
    await hook({
      doc: { id: 1, slug: 'jane', name: 'Jane Doe', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    const calledWith = dispatchSpy.mock.calls[0]?.[0] as unknown as { data: { title: string } };
    expect(calledWith.data.title).toBe('Jane Doe');
  });

  it('swallows errors from dispatch — never throws into the surrounding save', async () => {
    dispatchSpy.mockRejectedValueOnce(new Error('webhook outage'));
    const hook = webhooksPublishAfterChangeHook('blogs');
    const req = makeReq();
    const doc = { id: 1, slug: 'x', title: 'X', _status: 'published' };
    const ret = await hook({
      doc,
      previousDoc: { _status: 'draft' },
      req,
    } as unknown as Parameters<ReturnType<typeof webhooksPublishAfterChangeHook>>[0]);
    expect(ret).toBe(doc);
    expect(
      (req.payload as unknown as { logger: { warn: ReturnType<typeof vi.fn> } }).logger.warn,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blogs', error: 'webhook outage' }),
      'webhooks.afterChange threw',
    );
  });
});
