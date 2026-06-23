import { describe, expect, it } from 'vitest';
import { dealRegistrationSchema } from './schema';

const valid = {
  partnerName: 'Acme Partners',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', phone: '+1 555 0100' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com', phone: '555' },
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
