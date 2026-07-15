import { describe, expect, it } from 'vitest';

import { submitLeadBodySchema } from './payload-schema';

describe('submitLeadBodySchema', () => {
  const minValid = {
    formId: 1,
    formSchemaVersion: 0,
    fields: { email: 'jane@example.com' },
  };

  it('accepts a minimal payload', () => {
    expect(() => submitLeadBodySchema.parse(minValid)).not.toThrow();
  });

  it('accepts string formId (legacy DB IDs)', () => {
    const out = submitLeadBodySchema.parse({ ...minValid, formId: 'form_42' });
    expect(out.formId).toBe('form_42');
  });

  it('rejects empty string formId', () => {
    expect(() => submitLeadBodySchema.parse({ ...minValid, formId: '' })).toThrow();
  });

  it('rejects negative formSchemaVersion', () => {
    expect(() => submitLeadBodySchema.parse({ ...minValid, formSchemaVersion: -1 })).toThrow();
  });

  it('rejects non-object fields', () => {
    expect(() => submitLeadBodySchema.parse({ ...minValid, fields: 'a=b' })).toThrow();
  });

  it('caps source URL length', () => {
    const big = 'a'.repeat(3000);
    expect(() => submitLeadBodySchema.parse({ ...minValid, source: big })).toThrow();
  });

  it('accepts an attribution block with first touch + click IDs', () => {
    const out = submitLeadBodySchema.parse({
      ...minValid,
      utm: { source: 'google', medium: 'cpc' },
      attribution: {
        device: 'mobile',
        gclid: 'abc123',
        firstTouch: {
          source: 'linkedin',
          landingPage: 'https://www.cleanstart.com/',
          referrer: 'https://www.linkedin.com/',
          at: '2026-07-01T00:00:00.000Z',
        },
      },
    });
    expect(out.attribution?.device).toBe('mobile');
    expect(out.attribution?.firstTouch?.source).toBe('linkedin');
  });

  it('rejects an unknown attribution.device value', () => {
    expect(() =>
      submitLeadBodySchema.parse({ ...minValid, attribution: { device: 'watch' } }),
    ).toThrow();
  });

  it('rejects a non-datetime firstTouch.at', () => {
    expect(() =>
      submitLeadBodySchema.parse({
        ...minValid,
        attribution: { firstTouch: { at: 'yesterday' } },
      }),
    ).toThrow();
  });

  it('rejects consent.snapshot longer than 4096', () => {
    expect(() =>
      submitLeadBodySchema.parse({
        ...minValid,
        consent: {
          givenAt: '2026-01-01T00:00:00.000Z',
          snapshot: 'a'.repeat(5000),
        },
      }),
    ).toThrow();
  });

  it('rejects consent.givenAt that is not an ISO datetime', () => {
    expect(() =>
      submitLeadBodySchema.parse({
        ...minValid,
        consent: { givenAt: 'yesterday', snapshot: 'ok' },
      }),
    ).toThrow();
  });

  it('rejects consent.categories longer than 20 entries', () => {
    expect(() =>
      submitLeadBodySchema.parse({
        ...minValid,
        consent: {
          givenAt: '2026-01-01T00:00:00.000Z',
          snapshot: 'ok',
          categories: Array(21).fill('cat'),
        },
      }),
    ).toThrow();
  });

  it('passes utm with all optional channels populated', () => {
    const out = submitLeadBodySchema.parse({
      ...minValid,
      utm: { campaign: 'c', source: 's', medium: 'm', term: 't', content: 'x' },
    });
    expect(out.utm?.campaign).toBe('c');
  });

  it('accepts the honeypot field but does not require it', () => {
    expect(() => submitLeadBodySchema.parse({ ...minValid, website: 'http://bot' })).not.toThrow();
  });
});
