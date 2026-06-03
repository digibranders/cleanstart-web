import { describe, expect, it } from 'vitest';

import { applicationFieldsSchema } from './application-schema';

const valid = {
  jobSlug: 'senior-engineer',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+1 555 0100',
  coverLetter: 'hi',
  linkedinUrl: 'https://linkedin.com/in/ada',
};

describe('applicationFieldsSchema', () => {
  it('accepts a valid payload', () => {
    expect(applicationFieldsSchema.safeParse(valid).success).toBe(true);
  });
  it('requires jobSlug, names, and email', () => {
    expect(applicationFieldsSchema.safeParse({ ...valid, jobSlug: '' }).success).toBe(false);
    expect(applicationFieldsSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(applicationFieldsSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
  });
  it('allows optional fields to be omitted', () => {
    expect(
      applicationFieldsSchema.safeParse({ jobSlug: 'x', firstName: 'A', lastName: 'B', email: 'a@b.com' }).success,
    ).toBe(true);
  });
});
