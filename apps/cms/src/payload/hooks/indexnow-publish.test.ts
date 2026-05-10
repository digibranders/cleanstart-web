import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as submitModule from '../lib/indexnow/submit';
import { indexNowPublishAfterChangeHook } from './indexnow-publish';

const submitSpy = vi.spyOn(submitModule, 'submitIndexNow');

const makeReq = (baseUrl = 'https://cleanstart.com') => ({
  payload: {
    findGlobal: vi.fn().mockResolvedValue({ baseUrl }),
    logger: { warn: vi.fn() },
  },
});

beforeEach(() => {
  Reflect.deleteProperty(process.env, 'INDEXNOW_KEY');
  submitSpy.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('indexNowPublishAfterChangeHook', () => {
  it('skips on republish (published → published)', async () => {
    process.env.INDEXNOW_KEY = 'k';
    const hook = indexNowPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, slug: 'x', _status: 'published' },
      previousDoc: { _status: 'published' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('skips when INDEXNOW_KEY env is missing', async () => {
    const hook = indexNowPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, slug: 'x', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('submits on first publish when key is configured', async () => {
    process.env.INDEXNOW_KEY = 'k';
    submitSpy.mockResolvedValueOnce({ kind: 'submitted' } as never);
    const hook = indexNowPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, slug: 'launch', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req: makeReq(),
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'k',
        baseUrl: 'https://cleanstart.com',
        urls: ['https://cleanstart.com/blogs/launch'],
      }),
    );
  });

  it('logs and swallows when submitIndexNow returns failed', async () => {
    process.env.INDEXNOW_KEY = 'k';
    submitSpy.mockResolvedValueOnce({ kind: 'failed', reason: '503' } as never);
    const hook = indexNowPublishAfterChangeHook('blogs');
    const req = makeReq();
    await hook({
      doc: { id: 1, slug: 'x', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req,
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(req.payload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blogs', reason: '503' }),
      'indexnow.submit failed',
    );
  });

  it('swallows thrown errors — never breaks the surrounding save', async () => {
    process.env.INDEXNOW_KEY = 'k';
    submitSpy.mockRejectedValueOnce(new Error('network'));
    const hook = indexNowPublishAfterChangeHook('blogs');
    const req = makeReq();
    const ret = await hook({
      doc: { id: 1, slug: 'x', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req,
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(ret).toEqual({ id: 1, slug: 'x', _status: 'published' });
    expect(req.payload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'network' }),
      'indexnow.afterChange threw',
    );
  });

  it('strips trailing slashes from baseUrl', async () => {
    process.env.INDEXNOW_KEY = 'k';
    submitSpy.mockResolvedValueOnce({ kind: 'submitted' } as never);
    const hook = indexNowPublishAfterChangeHook('blogs');
    await hook({
      doc: { id: 1, slug: 'a', _status: 'published' },
      previousDoc: { _status: 'draft' },
      req: makeReq('https://cleanstart.com//'),
    } as unknown as Parameters<ReturnType<typeof indexNowPublishAfterChangeHook>>[0]);
    expect(submitSpy.mock.calls[0]?.[0].baseUrl).toBe('https://cleanstart.com');
  });
});
