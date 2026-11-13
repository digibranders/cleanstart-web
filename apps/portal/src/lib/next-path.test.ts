import { describe, expect, it } from 'vitest';
import { safeNext } from './next-path';

describe('safeNext', () => {
  it.each([
    ['/partner/deals', '/partner/deals'],
    ['/partner/deals?status=pending', '/partner/deals?status=pending'],
    ['/admin/approvals#queue', '/admin/approvals'],
    [' /partner/overview', '/partner/overview'],
  ])('keeps %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    '//evil.example.com',
    '/\\evil.example.com',
    'https://evil.example.com/partner',
    'javascript:alert(1)',
    'partner/deals',
    '/sign-in',
    '/sign-in?next=%2Fpartner',
    '/api/auth/sign-out',
    '/..//evil.example.com',
    '/.//evil.example.com',
    '/a/..//evil.example.com',
    '/%2e%2e//evil.example.com',
    '/./\\evil.example.com',
    '/a/../\\evil.example.com',
    '/..\\/evil.example.com',
    '/Sign-In',
    '/SIGN-IN?next=%2Fpartner',
    '/sign-in/',
    '/sign-in/.',
    '/a/../sign-in',
    '/sign-in/extra',
    '/Sign-In/extra',
    `/${'a'.repeat(600)}`,
  ])('refuses %j', (input) => {
    expect(safeNext(input)).toBeNull();
  });
});
