import { describe, expect, it } from 'vitest';
import { companyDetailsSchema, logoUrlOf, normaliseDetails } from './company-profile';

const empty = { legalName: '', taxId: '', hqCountry: '', headcountBand: '', billingContactName: '', billingContactEmail: '', supportContactName: '', supportContactEmail: '' } as const;

describe('companyDetailsSchema', () => {
  it('accepts an all empty form: every detail is optional', () => {
    expect(companyDetailsSchema.safeParse(empty).success).toBe(true);
  });

  it('accepts a complete form and trims text', () => {
    const parsed = companyDetailsSchema.parse({
      legalName: '  Kestrel Systems Pvt Ltd ',
      taxId: '29ABCDE1234F1Z5',
      hqCountry: 'IN',
      headcountBand: '51-200',
      billingContactName: 'Meera',
      billingContactEmail: 'billing@kestrelsystems.in',
      supportContactName: 'Ravi',
      supportContactEmail: 'support@kestrelsystems.in',
    });
    expect(parsed.legalName).toBe('Kestrel Systems Pvt Ltd');
  });

  it.each(['1-10', '11-50', '51-200', '201-1000', '1000+'])('accepts the headcount band %s', (band) => {
    expect(companyDetailsSchema.safeParse({ ...empty, headcountBand: band }).success).toBe(true);
  });

  it('rejects an unknown band, a bad email, an unknown country and over long text', () => {
    expect(companyDetailsSchema.safeParse({ ...empty, headcountBand: '5000' }).success).toBe(false);
    const email = companyDetailsSchema.safeParse({ ...empty, billingContactEmail: 'not an email' });
    expect(email.success ? [] : email.error.issues.map((i) => i.path[0])).toEqual(['billingContactEmail']);
    expect(companyDetailsSchema.safeParse({ ...empty, hqCountry: 'Atlantis' }).success).toBe(false);
    expect(companyDetailsSchema.safeParse({ ...empty, legalName: 'x'.repeat(201) }).success).toBe(false);
    expect(companyDetailsSchema.safeParse({ ...empty, taxId: 'x'.repeat(61) }).success).toBe(false);
  });
});

describe('normaliseDetails', () => {
  it('stores the country as its ISO code, whichever way it was typed', () => {
    expect(normaliseDetails({ ...empty, hqCountry: 'India' }).hqCountry).toBe('IN');
    expect(normaliseDetails({ ...empty, hqCountry: 'in' }).hqCountry).toBe('IN');
    expect(normaliseDetails(empty).hqCountry).toBe('');
  });
});

describe('logoUrlOf', () => {
  it('is null without a key and a same-origin path with one', () => {
    expect(logoUrlOf('p1', null)).toBeNull();
    expect(logoUrlOf('p1', 'partner-logos/p1/abc.png')).toMatch(/^\/api\/partner-logo\/p1\?v=/);
  });
});
