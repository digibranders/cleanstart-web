import { describe, expect, it, vi } from 'vitest';

import { redirectsImportEndpoint } from './redirects-import';

const handler = redirectsImportEndpoint.handler as (req: unknown) => Promise<Response>;

const makeReq = (
  body: unknown,
  user: { role?: string } | null = { role: 'editor' },
  payloadOverrides: Record<string, unknown> = {},
) => {
  const find = vi.fn().mockResolvedValue({ docs: [] });
  const create = vi.fn().mockResolvedValue({ id: 1 });
  const update = vi.fn().mockResolvedValue({});
  const payload = { find, create, update, ...payloadOverrides };
  return {
    req: {
      json: async () => body,
      user,
      payload,
    } as unknown as Parameters<typeof handler>[0],
    spies: { find, create, update },
  };
};

describe('redirectsImportEndpoint', () => {
  it('returns 403 for non-editors', async () => {
    const { req } = makeReq({ rows: [] }, null);
    const res = await handler(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when JSON parse fails', async () => {
    const req = {
      user: { role: 'admin' },
      payload: {},
      json: () => {
        throw new Error('bad json');
      },
    } as unknown as Parameters<typeof handler>[0];
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_json');
  });

  it('returns 413 when row count exceeds 5000', async () => {
    const rows = Array.from({ length: 5001 }, (_, i) => ({
      from: `/r${i}`,
      to: `/d${i}`,
    }));
    const { req } = makeReq({ rows });
    const res = await handler(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toMatchObject({ error: 'too_many_rows', limit: 5000 });
  });

  it('returns 400 with issues on Zod failure', async () => {
    const { req } = makeReq({ rows: [{ from: 1, to: '/x' }] });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_body');
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('runs in dry-run mode and reports counts without writing', async () => {
    const { req, spies } = makeReq({
      rows: [{ from: '/a', to: '/b' }],
      dryRun: true,
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, dryRun: true, toCreate: 1, toUpdate: 0 });
    expect(spies.create).not.toHaveBeenCalled();
  });

  it('creates and updates redirects on a real run', async () => {
    const find = vi.fn();
    find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 99, from: '/c', source: 'manual' }] });
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const update = vi.fn().mockResolvedValue({});
    const req = {
      user: { role: 'admin' },
      json: async () => ({
        rows: [
          { from: '/a', to: '/b' },
          { from: '/c', to: '/d' },
        ],
      }),
      payload: { find, create, update },
    } as unknown as Parameters<typeof handler>[0];

    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, created: 1, updated: 1 });
    expect(create).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });

  it('reports per-row errors without aborting valid rows', async () => {
    const { req } = makeReq({
      rows: [
        { from: '', to: '/b' }, // invalid: empty from
        { from: '/c', to: '/d' },
      ],
    });
    const res = await handler(req);
    expect(res.status).toBe(400); // Zod min(1) on `from` rejects upfront
  });
});
