import { afterEach, describe, expect, it, vi } from 'vitest';

import { NextRequest } from 'next/server';

import { collectionFromApiPath, isAnonymousPublicRead, proxy } from './proxy';

const req = (over: Partial<Parameters<typeof isAnonymousPublicRead>[0]> = {}) => ({
  method: 'GET',
  pathname: '/api/blogs',
  hasAuthCookie: false,
  hasAuthHeader: false,
  ...over,
});

afterEach(() => vi.unstubAllEnvs());

describe('collectionFromApiPath', () => {
  it('reads the collection segment, including on nested paths', () => {
    expect(collectionFromApiPath('/api/blogs')).toBe('blogs');
    expect(collectionFromApiPath('/api/blogs/123/versions')).toBe('blogs');
  });

  it('returns null for anything that is not an /api path', () => {
    expect(collectionFromApiPath('/admin/collections/blogs')).toBeNull();
    expect(collectionFromApiPath('/api/')).toBeNull();
    expect(collectionFromApiPath('/api')).toBeNull();
  });
});

describe('isAnonymousPublicRead', () => {
  it('allows an anonymous GET of a public collection', () => {
    expect(isAnonymousPublicRead(req())).toBe(true);
  });

  it.each(['authors', 'guides', 'knowledgeBase', 'legalDocuments', 'case-studies'])(
    'allows %s',
    (c) => expect(isAnonymousPublicRead(req({ pathname: `/api/${c}` }))).toBe(true),
  );

  it.each([
    // Personal data. Caching any of these at a shared edge would be a leak.
    'leads',
    'career-applications',
    'partner-applications',
    'consentLog',
    'resumes',
    'users',
    // Not content reads.
    'preview',
    'revalidate',
  ])('refuses %s', (c) =>
    expect(isAnonymousPublicRead(req({ pathname: `/api/${c}` }))).toBe(false),
  );

  it('refuses anything but GET, since writes must reach the origin', () => {
    for (const method of ['POST', 'PATCH', 'DELETE', 'HEAD']) {
      expect(isAnonymousPublicRead(req({ method }))).toBe(false);
    }
  });

  it('refuses a request carrying the Payload session cookie', () => {
    // The signed-in editor sees drafts and access-controlled fields. Marking
    // that response cacheable is how a shared cache leaks it to the public.
    expect(isAnonymousPublicRead(req({ hasAuthCookie: true }))).toBe(false);
  });

  it('refuses a request carrying an Authorization header (API-key clients)', () => {
    expect(isAnonymousPublicRead(req({ hasAuthHeader: true }))).toBe(false);
  });

  it('refuses admin routes outright', () => {
    expect(isAnonymousPublicRead(req({ pathname: '/admin/collections/blogs' }))).toBe(false);
  });
});

describe('proxy response headers', () => {
  const get = (url: string, headers: Record<string, string> = {}) =>
    proxy(new NextRequest(new Request(url, { method: 'GET', headers })));

  it('is completely inert when CMS_EDGE_CACHE_SMAXAGE is unset', () => {
    // The load-bearing safety property. Until the Cloudflare bypass rule for
    // authenticated editors exists, this module must change no response.
    vi.stubEnv('CMS_EDGE_CACHE_SMAXAGE', '');
    const res = get('https://cms.cleanstart.com/api/blogs');

    expect(res.headers.get('cache-control')).toBeNull();
    expect(res.headers.get('vary')).toBeNull();
  });

  it.each(['0', '-5', 'yes', '3.5'])('stays inert for a non-positive value %s', (v) => {
    vi.stubEnv('CMS_EDGE_CACHE_SMAXAGE', v);

    expect(get('https://cms.cleanstart.com/api/blogs').headers.get('cache-control')).toBeNull();
  });

  it('marks an anonymous public read cacheable once enabled', () => {
    vi.stubEnv('CMS_EDGE_CACHE_SMAXAGE', '300');
    const res = get('https://cms.cleanstart.com/api/blogs?limit=10');

    expect(res.headers.get('cache-control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=1200',
    );
    expect(res.headers.get('vary')).toBe('Cookie, Authorization');
  });

  it('leaves a signed-in editor request uncacheable even when enabled', () => {
    vi.stubEnv('CMS_EDGE_CACHE_SMAXAGE', '300');
    const res = get('https://cms.cleanstart.com/api/blogs', { cookie: 'payload-token=abc123' });

    expect(res.headers.get('cache-control')).toBeNull();
  });

  it('leaves a personal-data collection uncacheable even when enabled', () => {
    vi.stubEnv('CMS_EDGE_CACHE_SMAXAGE', '300');

    expect(get('https://cms.cleanstart.com/api/leads').headers.get('cache-control')).toBeNull();
  });
});
