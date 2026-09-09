import { describe, expect, it } from 'vitest';
import { dealRegistrationSchema } from './schema';

const valid = {
  partnerName: 'Acme Partners',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', phone: '+14155552671' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com', phone: '+442071838750' },
  dealDetails: 'Wants hardened images for K8s.',
  source: 'https://www.cleanstart.com/deal-registration',
  consent: { snapshot: 'I agree…', givenAt: '2026-06-23T00:00:00.000Z', categories: ['storage'] },
  turnstileToken: 'tok',
  hp: '',
};

describe('dealRegistrationSchema', () => {
  it('accepts a complete valid payload', () => {
    expect(dealRegistrationSchema.safeParse(valid).success).toBe(true);
  });
  it('requires partnerName, partner rep first/last/email, prospect first/last/email', () => {
    const bad = { ...valid, partnerName: '' };
    expect(dealRegistrationSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects an invalid prospect email', () => {
    const bad = { ...valid, prospect: { ...valid.prospect, email: 'nope' } };
    expect(dealRegistrationSchema.safeParse(bad).success).toBe(false);
  });
  it('treats phone, dealDetails, source, consent, turnstileToken, hp as optional', () => {
    const minimal = {
      partnerName: 'Acme',
      partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
      prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
    };
    expect(dealRegistrationSchema.safeParse(minimal).success).toBe(true);
  });
});

describe('dealRegistrationSchema — company email and E.164 phone', () => {
  it('rejects a free-mail address on either person', () => {
    const badRep = { ...valid, partnerRep: { ...valid.partnerRep, email: 'jane@gmail.com' } };
    expect(dealRegistrationSchema.safeParse(badRep).success).toBe(false);
    const badProspect = { ...valid, prospect: { ...valid.prospect, email: 'sam@yahoo.com' } };
    expect(dealRegistrationSchema.safeParse(badProspect).success).toBe(false);
  });

  it('rejects a phone that is not E.164', () => {
    const bad = { ...valid, prospect: { ...valid.prospect, phone: '555' } };
    expect(dealRegistrationSchema.safeParse(bad).success).toBe(false);
  });
});
