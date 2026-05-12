import { describe, expect, it } from 'vitest';

import { normaliseText } from './normalise-text';

describe('normaliseText', () => {
  it('returns undefined for non-string input', () => {
    expect(normaliseText(undefined)).toBeUndefined();
    expect(normaliseText(null)).toBeUndefined();
    expect(normaliseText(42)).toBeUndefined();
  });

  it('trims leading whitespace', () => {
    expect(normaliseText('  hello')).toBe('hello');
    expect(normaliseText('\t\nhello')).toBe('hello');
  });

  it('trims trailing whitespace', () => {
    expect(normaliseText('hello  ')).toBe('hello');
    expect(normaliseText('hello\t\n')).toBe('hello');
  });

  it('collapses internal consecutive spaces', () => {
    expect(normaliseText('hello  world')).toBe('hello world');
    expect(normaliseText('a   b   c')).toBe('a b c');
  });

  it('collapses mixed internal whitespace', () => {
    expect(normaliseText('hello\t\tworld')).toBe('hello world');
    expect(normaliseText('hello\n world')).toBe('hello world');
  });

  it('preserves single spaces around em dashes', () => {
    expect(normaliseText('CleanStart — Cybersecurity')).toBe('CleanStart — Cybersecurity');
  });

  it('returns undefined for whitespace-only strings', () => {
    expect(normaliseText('   ')).toBeUndefined();
    expect(normaliseText('\t\n')).toBeUndefined();
  });

  it('leaves clean strings unchanged', () => {
    expect(normaliseText('How to Pass a CMMC Audit in 30 Days')).toBe(
      'How to Pass a CMMC Audit in 30 Days',
    );
  });
});
