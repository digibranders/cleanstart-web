import { describe, expect, it, vi } from 'vitest';

import * as scanner from '../lib/broken-links/scan';
import { checkBrokenLinksTask } from './check-broken-links';

const handler = checkBrokenLinksTask.handler as (args: unknown) => Promise<unknown>;

type Row = {
  id: number;
  url: string;
  sourceDocId: string;
};

const makeReq = (existing: Row[]) => {
  const find = vi.fn().mockResolvedValue({ docs: existing });
  const create = vi.fn().mockResolvedValue({});
  const update = vi.fn().mockResolvedValue({});
  const del = vi.fn().mockResolvedValue({});
  return {
    req: { payload: { find, create, update, delete: del } },
    spies: { find, create, update, delete: del },
  };
};

describe('checkBrokenLinksTask', () => {
  it('is scheduled daily at 04:30 UTC', () => {
    expect(checkBrokenLinksTask.slug).toBe('checkBrokenLinks');
    expect(checkBrokenLinksTask.schedule?.[0]).toEqual(
      expect.objectContaining({ cron: '30 4 * * *', queue: 'brokenLinksScan' }),
    );
  });

  it('creates a brokenLinks row for a newly broken URL', async () => {
    vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValueOnce([
      {
        url: 'https://example.com/dead',
        status: 'broken',
        httpStatus: 404,
        sourceCollection: 'blogs',
        sourceDocId: '1',
        sourceDocSlug: 'first-post',
      },
    ] as never);
    const { req, spies } = makeReq([]);
    const out = await handler({ req } as never);
    expect(spies.create).toHaveBeenCalledOnce();
    expect(spies.update).not.toHaveBeenCalled();
    expect(out).toEqual({ output: { scanned: 1, actionableRows: 1, cleared: 0 } });
  });

  it('updates an existing row on re-scan', async () => {
    vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValueOnce([
      {
        url: 'https://example.com/dead',
        status: 'broken',
        httpStatus: 500,
        sourceCollection: 'blogs',
        sourceDocId: '1',
        sourceDocSlug: 'first-post',
      },
    ] as never);
    const { req, spies } = makeReq([
      { id: 99, url: 'https://example.com/dead', sourceDocId: '1' },
    ]);
    await handler({ req } as never);
    expect(spies.create).not.toHaveBeenCalled();
    expect(spies.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, data: expect.objectContaining({ httpStatus: 500 }) }),
    );
  });

  it('deletes rows that no longer appear in any doc (editor fixed the link)', async () => {
    vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValueOnce([] as never);
    const { req, spies } = makeReq([
      { id: 99, url: 'https://example.com/old', sourceDocId: '1' },
    ]);
    const out = await handler({ req } as never);
    expect(spies.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, collection: 'brokenLinks' }),
    );
    expect(out).toEqual({ output: { scanned: 0, actionableRows: 0, cleared: 1 } });
  });

  it('does not persist `ok` rows (table stays the actionable subset)', async () => {
    vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValueOnce([
      {
        url: 'https://example.com/healthy',
        status: 'ok',
        httpStatus: 200,
        sourceCollection: 'blogs',
        sourceDocId: '1',
        sourceDocSlug: 'p',
      },
    ] as never);
    const { req, spies } = makeReq([]);
    await handler({ req } as never);
    expect(spies.create).not.toHaveBeenCalled();
  });

  it('persists anchorText, sourceDocTitle, finalUrl and location on create', async () => {
    vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValueOnce([
      {
        url: 'https://example.com/x',
        status: 'broken',
        httpStatus: 404,
        finalUrl: 'https://example.com/gone',
        sourceCollection: 'blogs',
        sourceDocId: '7',
        sourceDocSlug: 'x',
        sourceDocTitle: 'Post X',
        anchorText: 'see this',
        location: 'Body',
      },
    ] as never);
    const { req, spies } = makeReq([]);
    await handler({ req } as never);
    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          anchorText: 'see this',
          sourceDocTitle: 'Post X',
          finalUrl: 'https://example.com/gone',
          location: 'Body',
        }),
      }),
    );
  });
});
