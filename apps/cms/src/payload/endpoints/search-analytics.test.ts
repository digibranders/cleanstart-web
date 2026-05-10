import { beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetRateLimitStore } from '../lib/rate-limit';
import { SEARCH_ANALYTICS_RATE_LIMITS, searchAnalyticsEndpoint } from './search-analytics';

const handler = searchAnalyticsEndpoint.handler;
if (!handler) throw new Error('handler undefined');

const makeReq = (
  body: unknown,
  headers: Record<string, string> = {},
  payloadOverrides: Record<string, unknown> = {},
) => {
  const create = vi.fn(async () => ({ id: 1 }));
  const logger = { warn: vi.fn() };
  const req = {
    headers: {
      get: (name: string): string | null => headers[name.toLowerCase()] ?? null,
    },
    json: async () => body,
    payload: {
      create,
      logger,
      ...payloadOverrides,
    },
  };
  return { req, create, logger };
};

const callJson = async (
  body: unknown,
  headers: Record<string, string> = {},
  payloadOverrides: Record<string, unknown> = {},
) => {
  const { req, create, logger } = makeReq(body, headers, payloadOverrides);
  const res = await handler(req as unknown as Parameters<typeof handler>[0]);
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json, create, logger };
};

describe('POST /api/search/analytics', () => {
  beforeEach(() => {
    __resetRateLimitStore();
  });

  it('rejects an empty / missing query', async () => {
    const a = await callJson({ resultsCount: 0 });
    expect(a.status).toBe(400);
    expect(a.json).toMatchObject({ error: 'query_required' });

    const b = await callJson({ query: '   ', resultsCount: 0 });
    expect(b.status).toBe(400);
    expect(b.json).toMatchObject({ error: 'query_required' });
  });

  it('rejects a non-numeric / non-finite resultsCount', async () => {
    const a = await callJson({ query: 'foo' });
    expect(a.status).toBe(400);
    expect(a.json).toMatchObject({ error: 'resultsCount_required' });

    const b = await callJson({ query: 'foo', resultsCount: 'three' });
    expect(b.status).toBe(400);
    expect(b.json).toMatchObject({ error: 'resultsCount_required' });
  });

  it('rejects negative or non-integer resultsCount', async () => {
    const a = await callJson({ query: 'foo', resultsCount: -1 });
    expect(a.status).toBe(400);
    expect(a.json).toMatchObject({ error: 'resultsCount_invalid' });

    const b = await callJson({ query: 'foo', resultsCount: 1.5 });
    expect(b.status).toBe(400);
    expect(b.json).toMatchObject({ error: 'resultsCount_invalid' });
  });

  it('rejects a non-string locale', async () => {
    const result = await callJson({ query: 'foo', resultsCount: 0, locale: 42 });
    expect(result.status).toBe(400);
    expect(result.json).toMatchObject({ error: 'locale_invalid' });
  });

  it('happy path — creates a searchLog row without ip / userAgent and returns ok', async () => {
    const { status, json, create } = await callJson(
      { query: 'sbom', resultsCount: 0, locale: 'en-US' },
      { 'user-agent': 'Mozilla/5.0' },
    );
    expect(status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
    const calls = create.mock.calls as unknown as Array<[{ data: Record<string, unknown> }]>;
    const data = calls[0]?.[0]?.data;
    expect(data).toEqual({ query: 'sbom', resultsCount: 0, locale: 'en-US' });
    expect(data).not.toHaveProperty('ip');
    expect(data).not.toHaveProperty('userAgent');
  });

  it('truncates over-long query / locale', async () => {
    const { create } = await callJson({
      query: 'x'.repeat(500),
      resultsCount: 0,
      locale: 'long-locale-tag-much-too-long',
    });
    const calls = create.mock.calls as unknown as Array<
      [{ data: { query: string; locale: string } }]
    >;
    const data = calls[0]?.[0]?.data;
    expect(data?.query.length).toBe(200);
    expect(data?.locale.length).toBe(16);
  });

  it('omits locale when not present and never persists ip / userAgent', async () => {
    const { create } = await callJson({ query: 'foo', resultsCount: 5 });
    const calls = create.mock.calls as unknown as Array<[{ data: Record<string, unknown> }]>;
    const data = calls[0]?.[0]?.data;
    expect(data?.query).toBe('foo');
    expect(data?.resultsCount).toBe(5);
    expect(data?.locale).toBeUndefined();
    expect(data?.ip).toBeUndefined();
    expect(data?.userAgent).toBeUndefined();
  });

  it('returns 500 when the create throws', async () => {
    const create = vi.fn(async () => {
      throw new Error('db down');
    });
    const { status, json, logger } = await callJson(
      { query: 'foo', resultsCount: 0 },
      {},
      { create },
    );
    expect(status).toBe(500);
    expect(json).toMatchObject({ error: 'log_failed' });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'db down' }),
      'searchLog create failed',
    );
  });

  it('rate-limits a flood of requests from the same IP', async () => {
    // Drive past the per-minute cap and assert the next call returns 429.
    for (let i = 0; i < SEARCH_ANALYTICS_RATE_LIMITS.perMinute; i += 1) {
      const r = await callJson({ query: `q${i}`, resultsCount: 0 });
      expect(r.status).toBe(200);
    }
    const limited = await callJson({ query: 'one-too-many', resultsCount: 0 });
    expect(limited.status).toBe(429);
    expect(limited.json).toMatchObject({ error: 'rate_limited' });
    expect(limited.json).toHaveProperty('retryAfterSeconds');
  });
});
