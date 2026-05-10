import { describe, expect, it } from 'vitest';

import { composeVerificationMetas } from './verifications';

describe('composeVerificationMetas', () => {
  it('returns [] for null / undefined / empty input', () => {
    expect(composeVerificationMetas(null)).toEqual([]);
    expect(composeVerificationMetas(undefined)).toEqual([]);
    expect(composeVerificationMetas({})).toEqual([]);
  });

  it('emits one meta per provided token', () => {
    expect(
      composeVerificationMetas({
        google: 'GOOG-TOKEN',
        bing: 'BING-TOKEN',
        pinterest: 'PIN-TOKEN',
        yandex: 'YANDEX-TOKEN',
        facebookDomain: 'FB-TOKEN',
      }),
    ).toEqual([
      { tag: 'meta', attrs: { name: 'google-site-verification', content: 'GOOG-TOKEN' } },
      { tag: 'meta', attrs: { name: 'msvalidate.01', content: 'BING-TOKEN' } },
      { tag: 'meta', attrs: { name: 'p:domain_verify', content: 'PIN-TOKEN' } },
      { tag: 'meta', attrs: { name: 'yandex-verification', content: 'YANDEX-TOKEN' } },
      { tag: 'meta', attrs: { name: 'facebook-domain-verification', content: 'FB-TOKEN' } },
    ]);
  });

  it('skips empty / whitespace-only tokens', () => {
    expect(
      composeVerificationMetas({
        google: '',
        bing: '   ',
        pinterest: 'KEEP-ME',
      }),
    ).toEqual([
      { tag: 'meta', attrs: { name: 'p:domain_verify', content: 'KEEP-ME' } },
    ]);
  });

  it('trims whitespace around tokens', () => {
    expect(
      composeVerificationMetas({ google: '  TOKEN  ' }),
    ).toEqual([{ tag: 'meta', attrs: { name: 'google-site-verification', content: 'TOKEN' } }]);
  });

  it('skips non-string values defensively', () => {
    // `exactOptionalPropertyTypes` rejects `bing: undefined` literally;
    // model the API/DB shape (where missing tokens come back as
    // undefined) by casting through unknown — the lib must survive it.
    const partial = {
      google: null,
      bing: undefined,
      pinterest: 'OK',
    } as unknown as Parameters<typeof composeVerificationMetas>[0];
    expect(composeVerificationMetas(partial)).toEqual([
      { tag: 'meta', attrs: { name: 'p:domain_verify', content: 'OK' } },
    ]);
  });
});
