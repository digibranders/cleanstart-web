import { describe, expect, it } from 'vitest';
import { normalizeDomain, sameCustomer } from './customer';

describe('sameCustomer', () => {
  it('ignores case and surrounding spaces', () => {
    expect(sameCustomer('Vardhan Capital', '  vardhan capital ')).toBe(true);
    expect(sameCustomer('Vardhan Capital', 'Vardhan Capital Ltd')).toBe(false);
  });
});

describe('normalizeDomain', () => {
  it('reduces a pasted address to a bare lower case domain', () => {
    expect(normalizeDomain('https://www.VardhanCapital.in/about?x=1')).toBe('vardhancapital.in');
    expect(normalizeDomain('vardhancapital.in')).toBe('vardhancapital.in');
    expect(normalizeDomain('  www.tejashealth.in:8080  ')).toBe('tejashealth.in');
  });

  it('returns null for empty input and for text that is not a domain', () => {
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain('   ')).toBeNull();
    expect(normalizeDomain('Vardhan')).toBeNull();
    expect(normalizeDomain('rohan@vardhancapital.in')).toBeNull();
  });
});
