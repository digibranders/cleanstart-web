import { describe, expect, it } from 'vitest';

import { checkPattern, compileSafe } from './safe-regex';

describe('safe-regex / checkPattern', () => {
  it('accepts simple safe patterns', () => {
    const result = checkPattern('^[a-z0-9]+$');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.regex.test('hello')).toBe(true);
      expect(result.regex.test('Hello!')).toBe(false);
    }
  });

  it('accepts an email-shaped pattern', () => {
    const result = checkPattern('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');
    expect(result.ok).toBe(true);
  });

  it('rejects nested-quantifier ReDoS patterns', () => {
    expect(checkPattern('^(a+)+$')).toEqual({
      ok: false,
      reason: 'catastrophic-backtracking',
    });
    expect(checkPattern('(a*)*')).toMatchObject({ ok: false });
    expect(checkPattern('(.+)+x')).toMatchObject({ ok: false });
  });

  it('rejects invalid syntax', () => {
    expect(checkPattern('[unclosed')).toEqual({
      ok: false,
      reason: 'invalid-syntax',
    });
  });

  it('rejects null / undefined / non-string', () => {
    expect(checkPattern(null)).toMatchObject({ ok: false });
    expect(checkPattern(undefined)).toMatchObject({ ok: false });
    expect(checkPattern('')).toMatchObject({ ok: false });
  });

  it('rejects pathologically long patterns even when otherwise safe', () => {
    const huge = `${'a'.repeat(257)}`;
    expect(checkPattern(huge)).toMatchObject({
      ok: false,
      reason: 'catastrophic-backtracking',
    });
  });
});

describe('compileSafe', () => {
  it('returns a usable RegExp for safe input', () => {
    const re = compileSafe('^foo$');
    expect(re).not.toBeNull();
    expect(re?.test('foo')).toBe(true);
  });

  it('returns null for unsafe / invalid input', () => {
    expect(compileSafe('^(a+)+$')).toBeNull();
    expect(compileSafe('[unclosed')).toBeNull();
    expect(compileSafe(null)).toBeNull();
  });
});
