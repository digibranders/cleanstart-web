import { describe, expect, it } from 'vitest';

import { companyFromEmailDomain } from './enrichment';

describe('companyFromEmailDomain', () => {
  it('extracts company from a corporate single-label TLD', () => {
    expect(companyFromEmailDomain('jane@cleanstart.com')).toEqual({
      domain: 'cleanstart.com',
      company: 'Cleanstart',
    });
  });

  it('extracts company from a corporate two-part TLD (.co.uk, .com.au, etc.)', () => {
    expect(companyFromEmailDomain('person@bigco.co.uk')).toEqual({
      domain: 'bigco.co.uk',
      company: 'Bigco',
    });
    expect(companyFromEmailDomain('a@payload.com.au')).toEqual({
      domain: 'payload.com.au',
      company: 'Payload',
    });
  });

  it('handles a deeper subdomain by taking the registrable label', () => {
    expect(companyFromEmailDomain('a@mail.support.acme.io')).toEqual({
      domain: 'mail.support.acme.io',
      company: 'Acme',
    });
  });

  it('title-cases hyphenated and underscored labels', () => {
    expect(companyFromEmailDomain('a@team-shield.io')?.company).toBe('Team Shield');
    expect(companyFromEmailDomain('a@some_brand.com')?.company).toBe('Some Brand');
  });

  it('returns null for free-mail providers (gmail / yahoo / outlook / etc.)', () => {
    for (const e of [
      'a@gmail.com',
      'a@googlemail.com',
      'a@yahoo.com',
      'a@yahoo.co.uk',
      'a@hotmail.com',
      'a@outlook.com',
      'a@aol.com',
      'a@icloud.com',
      'a@protonmail.com',
      'a@proton.me',
    ]) {
      expect(companyFromEmailDomain(e)).toBeNull();
    }
  });

  it('returns null for known disposable / temp-mail domains', () => {
    for (const e of ['a@mailinator.com', 'a@10minutemail.com', 'a@guerrillamail.com']) {
      expect(companyFromEmailDomain(e)).toBeNull();
    }
  });

  it('returns null for malformed / empty / non-string input', () => {
    expect(companyFromEmailDomain(null)).toBeNull();
    expect(companyFromEmailDomain(undefined)).toBeNull();
    expect(companyFromEmailDomain('')).toBeNull();
    expect(companyFromEmailDomain('not-an-email')).toBeNull();
    expect(companyFromEmailDomain('@nodomain.com')).toEqual({
      domain: 'nodomain.com',
      company: 'Nodomain',
    });
    expect(companyFromEmailDomain('person@')).toBeNull();
    expect(companyFromEmailDomain('plainstring')).toBeNull();
  });

  it('lowercases the domain before classification', () => {
    expect(companyFromEmailDomain('Jane@CleanStart.COM')).toEqual({
      domain: 'cleanstart.com',
      company: 'Cleanstart',
    });
  });

  it('does not infer a company from a domain with no second label (.localhost, etc.)', () => {
    expect(companyFromEmailDomain('a@localhost')).toBeNull();
  });
});
