import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractRequestMeta } from './request-meta';

const makeHeaders = (entries: Record<string, string | undefined>) => ({
  get: (name: string) => entries[name.toLowerCase()] ?? null,
});

const ORIGINAL_HOPS = process.env.TRUSTED_PROXY_HOPS;

beforeEach(() => {
  Reflect.deleteProperty(process.env, 'TRUSTED_PROXY_HOPS');
});

afterEach(() => {
  if (ORIGINAL_HOPS == null) {
    Reflect.deleteProperty(process.env, 'TRUSTED_PROXY_HOPS');
  } else {
    process.env.TRUSTED_PROXY_HOPS = ORIGINAL_HOPS;
  }
});

describe('extractRequestMeta', () => {
  it('returns undefined for missing user-agent / accept-language and 0 chain length when XFF absent', () => {
    const meta = extractRequestMeta(makeHeaders({}));
    expect(meta.userAgent).toBeUndefined();
    expect(meta.acceptLanguage).toBeUndefined();
    expect(meta.proxyChainLength).toBe(0);
    expect(meta.ip).toBe('unknown');
  });

  it('parses proxy chain length from XFF', () => {
    const meta = extractRequestMeta(
      makeHeaders({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }),
    );
    expect(meta.proxyChainLength).toBe(3);
  });

  it('counts a single XFF entry as length 1', () => {
    const meta = extractRequestMeta(makeHeaders({ 'x-forwarded-for': '1.1.1.1' }));
    expect(meta.proxyChainLength).toBe(1);
  });

  it('uses cf-connecting-ip when present', () => {
    const meta = extractRequestMeta(
      makeHeaders({
        'cf-connecting-ip': '9.9.9.9',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      }),
    );
    expect(meta.ip).toBe('9.9.9.9');
    expect(meta.proxyChainLength).toBe(2);
  });

  it('respects TRUSTED_PROXY_HOPS for XFF-derived IP', () => {
    process.env.TRUSTED_PROXY_HOPS = '1';
    const meta = extractRequestMeta(
      makeHeaders({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }),
    );
    expect(meta.ip).toBe('1.1.1.1');
  });

  it('truncates user-agent and accept-language at 512 chars', () => {
    const giant = 'a'.repeat(1024);
    const meta = extractRequestMeta(
      makeHeaders({ 'user-agent': giant, 'accept-language': giant }),
    );
    expect(meta.userAgent?.length).toBe(512);
    expect(meta.acceptLanguage?.length).toBe(512);
  });

  it('returns undefined for whitespace-only headers', () => {
    const meta = extractRequestMeta(
      makeHeaders({ 'user-agent': '   ', 'accept-language': '' }),
    );
    expect(meta.userAgent).toBeUndefined();
    expect(meta.acceptLanguage).toBeUndefined();
  });
});
