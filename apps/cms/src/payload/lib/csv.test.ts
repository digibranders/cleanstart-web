import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';

const BOM = '﻿';

describe('toCsv', () => {
  it('starts with a UTF-8 BOM so Excel reads it as UTF-8', () => {
    const out = toCsv(['name'], []);
    expect(out.charCodeAt(0)).toBe(0xfeff);
  });

  it('emits headers + a trailing CRLF on every line', () => {
    const out = toCsv(['name', 'email'], [{ name: 'Jane', email: 'jane@x.com' }]);
    expect(out).toBe(`${BOM}name,email\r\nJane,jane@x.com\r\n`);
  });

  it('quotes cells containing commas', () => {
    const out = toCsv(['note'], [{ note: 'hello, world' }]);
    expect(out).toBe(`${BOM}note\r\n"hello, world"\r\n`);
  });

  it('quotes cells containing double quotes and doubles them up', () => {
    const out = toCsv(['note'], [{ note: 'she said "hi"' }]);
    expect(out).toBe(`${BOM}note\r\n"she said ""hi"""\r\n`);
  });

  it('quotes cells containing newlines', () => {
    const out = toCsv(['note'], [{ note: 'line1\nline2' }]);
    expect(out).toBe(`${BOM}note\r\n"line1\nline2"\r\n`);
  });

  it('serialises objects as JSON', () => {
    const out = toCsv(['fields'], [{ fields: { a: 1, b: 'x' } }]);
    expect(out).toContain('"{""a"":1,""b"":""x""}"');
  });

  it('emits empty cell for null / undefined / missing keys', () => {
    const out = toCsv(['a', 'b', 'c'], [{ a: 'x' }]);
    expect(out).toBe(`${BOM}a,b,c\r\nx,,\r\n`);
  });

  it('handles zero rows (header-only)', () => {
    expect(toCsv(['a', 'b'], [])).toBe(`${BOM}a,b\r\n`);
  });

  it('coerces numbers and booleans to strings', () => {
    const out = toCsv(['n', 'b'], [{ n: 42, b: true }]);
    expect(out).toBe(`${BOM}n,b\r\n42,true\r\n`);
  });

  it('neutralises formula-injection triggers (=, +, -, @, tab, CR)', () => {
    expect(toCsv(['v'], [{ v: '=cmd|"/c calc"!A1' }])).toContain(`'=cmd|`);
    expect(toCsv(['v'], [{ v: '+1+1' }])).toContain(`'+1+1`);
    expect(toCsv(['v'], [{ v: '-x' }])).toContain(`'-x`);
    expect(toCsv(['v'], [{ v: '@SUM(A1)' }])).toContain(`'@SUM(A1)`);
    expect(toCsv(['v'], [{ v: '\t=evil' }])).toContain(`'\t=evil`);
  });

  it('does not double-prefix cells that are already safe text', () => {
    const out = toCsv(['v'], [{ v: 'hello' }]);
    expect(out).toBe(`${BOM}v\r\nhello\r\n`);
  });

  it('quotes a formula-prefixed cell when it also contains a comma', () => {
    const out = toCsv(['v'], [{ v: '=foo, bar' }]);
    // Prefix added, then quoted because of the comma.
    expect(out).toContain(`"'=foo, bar"`);
  });
});
