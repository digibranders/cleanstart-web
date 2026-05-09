import { describe, expect, it } from 'vitest';

import { composeCustomTags } from './custom-tags';

describe('composeCustomTags', () => {
  it('returns [] for null / undefined / empty', () => {
    expect(composeCustomTags(null)).toEqual([]);
    expect(composeCustomTags(undefined)).toEqual([]);
    expect(composeCustomTags([])).toEqual([]);
  });

  it('emits meta name', () => {
    expect(
      composeCustomTags([{ kind: 'meta-name', key: 'news_keywords', content: 'cyber, soc' }]),
    ).toEqual([{ tag: 'meta', attrs: { name: 'news_keywords', content: 'cyber, soc' } }]);
  });

  it('emits meta property', () => {
    expect(
      composeCustomTags([{ kind: 'meta-property', key: 'og:video', content: 'https://x/y.mp4' }]),
    ).toEqual([{ tag: 'meta', attrs: { property: 'og:video', content: 'https://x/y.mp4' } }]);
  });

  it('preserves order across multiple rows', () => {
    expect(
      composeCustomTags([
        { kind: 'meta-name', key: 'a', content: '1' },
        { kind: 'meta-property', key: 'b', content: '2' },
        { kind: 'meta-name', key: 'c', content: '3' },
      ]),
    ).toEqual([
      { tag: 'meta', attrs: { name: 'a', content: '1' } },
      { tag: 'meta', attrs: { property: 'b', content: '2' } },
      { tag: 'meta', attrs: { name: 'c', content: '3' } },
    ]);
  });

  it('drops rows with empty key', () => {
    expect(
      composeCustomTags([
        { kind: 'meta-name', key: '', content: 'x' },
        { kind: 'meta-name', key: '   ', content: 'y' },
      ]),
    ).toEqual([]);
  });

  it('drops rows with empty content', () => {
    expect(
      composeCustomTags([
        { kind: 'meta-name', key: 'k', content: '' },
        { kind: 'meta-property', key: 'k', content: '   ' },
      ]),
    ).toEqual([]);
  });

  it('trims whitespace around key and content', () => {
    expect(
      composeCustomTags([{ kind: 'meta-name', key: '  k  ', content: '  v  ' }]),
    ).toEqual([{ tag: 'meta', attrs: { name: 'k', content: 'v' } }]);
  });

  it('drops rows with unknown kind', () => {
    // Using `unknown[]` cast because tsconfig has
    // `exactOptionalPropertyTypes: true`, which rejects the literal
    // `{ kind: undefined }` even though that's exactly what API /
    // ingest payloads can produce. The compose function is the system
    // boundary that must survive that shape.
    const rows = [
      { kind: 'meta-charset', key: 'k', content: 'v' },
      { kind: null, key: 'k', content: 'v' },
      { key: 'k', content: 'v' },
    ] as unknown as Parameters<typeof composeCustomTags>[0];
    expect(composeCustomTags(rows)).toEqual([]);
  });
});
