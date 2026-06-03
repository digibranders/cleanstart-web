import { describe, expect, it } from 'vitest';

import { partnerSubmissionSchema } from './partner-schema';

const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@acme.com',
  phone: '+1 555 0100',
  company: 'Acme',
  website: 'https://acme.com',
  partnerReason: 'We want to integrate.',
};

describe('partnerSubmissionSchema', () => {
  it('accepts a valid payload', () => {
    expect(partnerSubmissionSchema.safeParse(valid).success).toBe(true);
  });
  it('requires firstName, lastName, email, company', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(partnerSubmissionSchema.safeParse({ ...valid, firstName: '' }).success).toBe(false);
    expect(partnerSubmissionSchema.safeParse({ ...valid, company: '' }).success).toBe(false);
  });
  it('allows optional fields to be omitted', () => {
    expect(
      partnerSubmissionSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'a@b.com', company: 'C' }).success,
    ).toBe(true);
  });
});
