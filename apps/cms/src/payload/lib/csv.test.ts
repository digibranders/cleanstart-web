import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';

describe('toCsv', () => {
  it('emits headers + a trailing CRLF on every line', () => {
    const out = toCsv(['name', 'email'], [{ name: 'Jane', email: 'jane@x.com' }]);
    expect(out).toBe('name,email\r\nJane,jane@x.com\r\n');
  });

  it('quotes cells containing commas', () => {
    const out = toCsv(['note'], [{ note: 'hello, world' }]);
    expect(out).toBe('note\r\n"hello, world"\r\n');
  });

  it('quotes cells containing double quotes and doubles them up', () => {
    const out = toCsv(['note'], [{ note: 'she said "hi"' }]);
    expect(out).toBe('note\r\n"she said ""hi"""\r\n');
  });

  it('quotes cells containing newlines', () => {
    const out = toCsv(['note'], [{ note: 'line1\nline2' }]);
    expect(out).toBe('note\r\n"line1\nline2"\r\n');
  });

  it('serialises objects as JSON', () => {
    const out = toCsv(['fields'], [{ fields: { a: 1, b: 'x' } }]);
    expect(out).toContain('"{""a"":1,""b"":""x""}"');
  });

  it('emits empty cell for null / undefined / missing keys', () => {
    const out = toCsv(['a', 'b', 'c'], [{ a: 'x' }]);
    expect(out).toBe('a,b,c\r\nx,,\r\n');
  });

  it('handles zero rows (header-only)', () => {
    expect(toCsv(['a', 'b'], [])).toBe('a,b\r\n');
  });

  it('coerces numbers and booleans to strings', () => {
    const out = toCsv(['n', 'b'], [{ n: 42, b: true }]);
    expect(out).toBe('n,b\r\n42,true\r\n');
  });
});
