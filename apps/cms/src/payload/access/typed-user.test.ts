import { describe, expect, it } from 'vitest';

import { hasAnyRole, hasRole, userId, userRoles } from './typed-user';

describe('userRoles', () => {
  it('returns the roles array for a well-formed user', () => {
    expect(userRoles({ roles: ['admin', 'editor'] })).toEqual(['admin', 'editor']);
  });

  it('returns an empty array for an unauthenticated request (null/undefined)', () => {
    expect(userRoles(null)).toEqual([]);
    expect(userRoles(undefined)).toEqual([]);
  });

  it('returns an empty array when roles is missing or non-array', () => {
    expect(userRoles({})).toEqual([]);
    expect(userRoles({ roles: null })).toEqual([]);
    expect(userRoles({ roles: 'admin' as never })).toEqual([]);
  });

  it('returns an empty array for non-object users', () => {
    expect(userRoles('admin')).toEqual([]);
    expect(userRoles(42)).toEqual([]);
  });
});

describe('hasRole', () => {
  it('is true only when the role is present', () => {
    expect(hasRole({ roles: ['editor'] }, 'editor')).toBe(true);
    expect(hasRole({ roles: ['editor'] }, 'admin')).toBe(false);
  });

  it('is false for unauthenticated requests', () => {
    expect(hasRole(null, 'admin')).toBe(false);
    expect(hasRole(undefined, 'admin')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('is true when the user holds at least one of the requested roles', () => {
    expect(hasAnyRole({ roles: ['author'] }, ['admin', 'editor', 'author'])).toBe(true);
  });

  it('is false when the user holds none of the requested roles', () => {
    expect(hasAnyRole({ roles: ['author'] }, ['admin', 'editor'])).toBe(false);
  });

  it('is false for an empty requested-roles list', () => {
    expect(hasAnyRole({ roles: ['admin'] }, [])).toBe(false);
  });

  it('is false for unauthenticated requests', () => {
    expect(hasAnyRole(null, ['admin', 'editor'])).toBe(false);
  });
});

describe('userId', () => {
  it('returns a finite numeric id unchanged', () => {
    expect(userId({ id: 7 })).toBe(7);
    expect(userId({ id: 0 })).toBe(0);
  });

  it('parses a numeric-string id', () => {
    expect(userId({ id: '42' })).toBe(42);
  });

  it('returns null for unauthenticated requests', () => {
    expect(userId(null)).toBeNull();
    expect(userId(undefined)).toBeNull();
  });

  it('returns null when the id is missing or non-coercible', () => {
    expect(userId({})).toBeNull();
    expect(userId({ id: {} })).toBeNull();
    expect(userId({ id: 'abc' })).toBeNull();
  });

  it('returns null for non-finite numeric ids', () => {
    expect(userId({ id: Number.NaN })).toBeNull();
    expect(userId({ id: Number.POSITIVE_INFINITY })).toBeNull();
  });
});
