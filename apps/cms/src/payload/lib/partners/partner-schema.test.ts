import { describe, expect, it } from 'vitest';

import { partnerSubmissionSchema } from './partner-schema';

const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@acme.com',
  phone: '+14155552671',
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

describe('partnerSubmissionSchema — any email, E.164 phone', () => {
  it('accepts a free-mail address: partners often apply before company mail exists', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, email: 'ada@gmail.com' }).success).toBe(
      true,
    );
  });

  it('still rejects a malformed address', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, email: 'ada@' }).success).toBe(false);
  });

  it('rejects a phone that is not E.164', () => {
    for (const phone of ['4155552671', '+1 415 555 2671', '(415) 555-2671']) {
      expect(partnerSubmissionSchema.safeParse({ ...valid, phone }).success).toBe(false);
    }
  });

  it('allows the phone to be omitted', () => {
    const { phone: _omitted, ...withoutPhone } = valid;
    expect(partnerSubmissionSchema.safeParse(withoutPhone).success).toBe(true);
  });
});
