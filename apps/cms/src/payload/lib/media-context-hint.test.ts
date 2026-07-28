import { describe, expect, it } from 'vitest';

import { decodeMediaContextHint, encodeMediaContextHint } from './media-context-hint';

// Header values must be ISO-8859-1. Anything above U+00FF makes
// setRequestHeader/fetch throw, which is the bug this module exists to
// prevent, so assert the encoded output can never contain one.
const isLatin1 = (value: string): boolean =>
  [...value].every((char) => (char.codePointAt(0) ?? 0) <= 0xff);

describe('encodeMediaContextHint', () => {
  it('percent-encodes a curly apostrophe so the header stays ASCII', () => {
    const title = 'AI Just Broke Software Security’s Biggest Assumption';
    const encoded = encodeMediaContextHint(title);
    expect(isLatin1(encoded)).toBe(true);
    expect(encoded).not.toContain('’');
    expect(decodeMediaContextHint(encoded)).toBe(title);
  });

  it.each([
    ['em dash', 'Supply Chain Security — A Primer'],
    ['ellipsis', 'And then… everything broke'],
    ['accented letters', 'Café Culture and Résumé Screening'],
    ['emoji', 'Shipping \u{1f680} faster'],
    ['smart quotes', '“Zero Trust” Explained'],
    ['CJK', 'ソフトウェアの安全'],
  ])('round-trips %s through a Latin-1-safe header value', (_label, title) => {
    const encoded = encodeMediaContextHint(title);
    expect(isLatin1(encoded)).toBe(true);
    expect(decodeMediaContextHint(encoded)).toBe(title);
  });

  it('encodes CR/LF so a title can never inject a header', () => {
    const encoded = encodeMediaContextHint('Title\r\nX-Injected: yes');
    expect(encoded).not.toMatch(/[\r\n]/);
    expect(decodeMediaContextHint(encoded)).toBe('Title\r\nX-Injected: yes');
  });

  it('trims and treats blank input as absent', () => {
    expect(encodeMediaContextHint('  spaced  ')).toBe('spaced');
    expect(encodeMediaContextHint('   ')).toBe('');
    expect(encodeMediaContextHint('')).toBe('');
    expect(encodeMediaContextHint(null)).toBe('');
    expect(encodeMediaContextHint(undefined)).toBe('');
  });

  it('leaves an already-ASCII slug hint byte-identical', () => {
    // The inline-image surfaces pass a slugified hint. Encoding must be a
    // no-op there so R2 keys produced before this change stay stable.
    const slugHint = 'getting-started-with-sbom-inline';
    expect(encodeMediaContextHint(slugHint)).toBe(slugHint);
    expect(decodeMediaContextHint(slugHint)).toBe(slugHint);
  });
});

describe('decodeMediaContextHint', () => {
  it('falls back to the raw value for a stale unencoded header', () => {
    // A cached admin bundle from before the encode landed sends the raw
    // title; a bare `%` in it makes decodeURIComponent throw.
    expect(decodeMediaContextHint('50% faster builds')).toBe('50% faster builds');
    expect(decodeMediaContextHint('100%')).toBe('100%');
  });

  it('handles a missing header', () => {
    expect(decodeMediaContextHint('')).toBe('');
    expect(decodeMediaContextHint(null)).toBe('');
    expect(decodeMediaContextHint(undefined)).toBe('');
  });

  it('trims the decoded value', () => {
    expect(decodeMediaContextHint('%20padded%20')).toBe('padded');
  });
});
