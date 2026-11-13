import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './pg-errors';

describe('isUniqueViolation', () => {
  it('reads a driver error thrown as is', () => {
    expect(isUniqueViolation({ code: '23505', constraint: 'registrations_open_unique' }, 'registrations_open_unique')).toBe(true);
  });
  it('reads the cause of a Drizzle wrapped error', () => {
    expect(isUniqueViolation({ message: 'Failed query', cause: { code: '23505', constraint: 'registrations_open_unique' } })).toBe(true);
  });
  it('does not match another constraint, another code or a non error', () => {
    expect(isUniqueViolation({ code: '23505', constraint: 'other' }, 'registrations_open_unique')).toBe(false);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation('boom')).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
