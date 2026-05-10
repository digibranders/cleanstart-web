import { describe, expect, it } from 'vitest';

import { composeHreflangCluster } from './hreflang';

describe('composeHreflangCluster', () => {
  it('returns [] for null / undefined / empty rows AND no fallbacks', () => {
    expect(composeHreflangCluster({ rows: null })).toEqual([]);
    expect(composeHreflangCluster({ rows: undefined })).toEqual([]);
    expect(composeHreflangCluster({ rows: [] })).toEqual([]);
  });

  it('passes through pasted rows in original order', () => {
    expect(
      composeHreflangCluster({
        rows: [
          { hreflang: 'en-US', href: 'https://x/us' },
          { hreflang: 'ar-AE', href: 'https://x/ae/ar' },
        ],
      }),
    ).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'ar-AE', href: 'https://x/ae/ar' },
    ]);
  });

  it('auto-injects self-ref when missing', () => {
    const out = composeHreflangCluster({
      rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
      selfHref: 'https://x/de',
      selfHreflang: 'de-DE',
    });
    expect(out).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'de-DE', href: 'https://x/de' },
    ]);
  });

  it('does NOT inject self-ref when one is already present', () => {
    const out = composeHreflangCluster({
      rows: [
        { hreflang: 'en-US', href: 'https://x/us' },
        { hreflang: 'de-DE', href: 'https://x/de' },
      ],
      selfHref: 'https://x/de',
      selfHreflang: 'de-DE',
    });
    expect(out).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'de-DE', href: 'https://x/de' },
    ]);
  });

  it('skips self-ref injection when selfHref or selfHreflang is missing', () => {
    expect(
      composeHreflangCluster({
        rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
        selfHref: 'https://x/de',
        // selfHreflang missing
      }),
    ).toEqual([{ hreflang: 'en-US', href: 'https://x/us' }]);

    expect(
      composeHreflangCluster({
        rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
        selfHreflang: 'de-DE',
        // selfHref missing
      }),
    ).toEqual([{ hreflang: 'en-US', href: 'https://x/us' }]);
  });

  it('auto-injects x-default fallback when missing', () => {
    expect(
      composeHreflangCluster({
        rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
        autoXDefaultFallback: 'https://x/',
      }),
    ).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'x-default', href: 'https://x/' },
    ]);
  });

  it('does NOT inject x-default when one is already present', () => {
    expect(
      composeHreflangCluster({
        rows: [
          { hreflang: 'en-US', href: 'https://x/us' },
          { hreflang: 'x-default', href: 'https://x/de' },
        ],
        autoXDefaultFallback: 'https://x/',
      }),
    ).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'x-default', href: 'https://x/de' },
    ]);
  });

  it('combines self-ref and x-default injection in a single call', () => {
    expect(
      composeHreflangCluster({
        rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
        selfHref: 'https://x/ae/ar',
        selfHreflang: 'ar-AE',
        autoXDefaultFallback: 'https://x/',
      }),
    ).toEqual([
      { hreflang: 'en-US', href: 'https://x/us' },
      { hreflang: 'ar-AE', href: 'https://x/ae/ar' },
      { hreflang: 'x-default', href: 'https://x/' },
    ]);
  });

  it('dedupes identical hreflang+href pairs (case-insensitive on hreflang)', () => {
    expect(
      composeHreflangCluster({
        rows: [
          { hreflang: 'en-US', href: 'https://x/us' },
          { hreflang: 'EN-US', href: 'https://x/us' },
          { hreflang: 'EN-US', href: 'https://x/us/' }, // trailing slash dedup
        ],
      }),
    ).toEqual([{ hreflang: 'en-US', href: 'https://x/us' }]);
  });

  it('trims whitespace on hreflang and href', () => {
    expect(
      composeHreflangCluster({
        rows: [{ hreflang: '  en-US  ', href: '  https://x/us  ' }],
      }),
    ).toEqual([{ hreflang: 'en-US', href: 'https://x/us' }]);
  });
});
