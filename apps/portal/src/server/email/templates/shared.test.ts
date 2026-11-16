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
});
