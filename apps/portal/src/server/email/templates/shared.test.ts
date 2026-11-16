import { describe, expect, it } from 'vitest';
import { oneLine, truncate } from './shared';

describe('oneLine', () => {
  it('collapses whitespace and line breaks', () => {
    expect(oneLine('  a \r\n b\t\tc  ')).toBe('a b c');
  });

  it('removes every C0 and C1 control character, not only CR and LF', () => {
    const controls = ['\u0000', '\u0007', '\u001b', '\u007f', '\u0085', '\u009f'];
    for (const control of controls) {
      expect(oneLine(`Hello${control}World`), JSON.stringify(control)).toBe('Hello World');
    }
  });

  it('removes Unicode format characters such as bidi overrides and the zero width space', () => {
    expect(oneLine('pay\u202Eoof\u200Bx\u2066y')).toBe('payoofxy');
  });

  it('keeps ordinary text, accents and emoji', () => {
    expect(oneLine('Zoë and 日本 \u{1F600}')).toBe('Zoë and 日本 \u{1F600}');
  });
});

describe('truncate', () => {
  it('cuts at the limit with an ellipsis and never exceeds it', () => {
    const out = truncate('word '.repeat(100), 200);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('...')).toBe(true);
  });

  it('never cuts an emoji in half: no lone surrogate at the cut', () => {
    // 196 letters then an emoji (2 UTF-16 units): the 197 character cut for max 200 would end on the high surrogate.
    const out = truncate(`${'a'.repeat(196)}\u{1F600}${'b'.repeat(20)}`, 200);
    // encodeURIComponent throws URIError on a lone surrogate.
    expect(() => encodeURIComponent(out)).not.toThrow();
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('...')).toBe(true);
  });
});
