import { describe, expect, it } from 'vitest';
import { assertTestDatabaseUrl } from './test-env';

describe('assertTestDatabaseUrl', () => {
  it('returns the name of a *_test database', () => {
    expect(assertTestDatabaseUrl('PORTAL_TEST_OWNER_URL', 'postgresql://u:p@localhost:5432/cleanstart_portal_test')).toBe('cleanstart_portal_test');
  });

  it('throws for any other database name, so the setup never drops clones of a real database', () => {
    expect(() => assertTestDatabaseUrl('PORTAL_TEST_OWNER_URL', 'postgresql://u:p@localhost:5432/cleanstart_portal')).toThrow(/must end in _test/);
    expect(() => assertTestDatabaseUrl('PORTAL_TEST_DATABASE_URL', 'postgresql://u:p@localhost:5432/')).toThrow(/PORTAL_TEST_DATABASE_URL/);
  });
});
