import { describe, expect, it } from 'vitest';

import { attributionColumns, attributionSchema, buildAttribution, utmSchema } from './attribution-schema';

describe('utm/attribution schemas', () => {
  it('accepts a full payload', () => {
    expect(utmSchema.safeParse({ source: 'google', medium: 'cpc' }).success).toBe(true);
    expect(
      attributionSchema.safeParse({
        device: 'mobile',
        gclid: 'abc',
        firstTouch: { source: 'linkedin', at: '2026-09-09T00:00:00.000Z' },
      }).success,
    ).toBe(true);
  });

  it('accepts absence', () => {
    expect(utmSchema.safeParse(undefined).success).toBe(true);
    expect(attributionSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects a channel supplied by the client', () => {
    const parsed = attributionSchema.safeParse({ channel: 'paid_search' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && (parsed.data as Record<string, unknown>).channel).toBeUndefined();
  });

  it('rejects an unknown device', () => {
    expect(attributionSchema.safeParse({ device: 'fridge' }).success).toBe(false);
  });
});

describe('buildAttribution', () => {
  it('returns undefined when there is no signal at all', () => {
    expect(buildAttribution({})).toBeUndefined();
  });

  it('derives a channel from UTMs even with no attribution block', () => {
    const out = buildAttribution({ utm: { source: 'google', medium: 'cpc' } });
    expect(out?.channel).toBe('paid_search');
  });

  it('derives from a click id when UTMs are absent', () => {
    expect(buildAttribution({ attribution: { gclid: 'x' } })?.channel).toBe('paid_search');
  });

  it('always overwrites a client-supplied channel with the derived one', () => {
    const out = buildAttribution({
      utm: { source: 'newsletter', medium: 'email' },
      attribution: { channel: 'paid_search' } as never,
    });
    expect(out?.channel).toBe('email');
  });
});

describe('attributionColumns', () => {
  it('fills every key with null when nothing was captured', () => {
    const cols = attributionColumns({});
    expect(cols.utm).toEqual({
      campaign: null,
      source: null,
      medium: null,
      term: null,
      content: null,
    });
    expect(cols.attribution.channel).toBeNull();
    expect(cols.attribution.firstTouch.landingPage).toBeNull();
  });

  it('carries values through', () => {
    const cols = attributionColumns({
      utm: { source: 'google' },
      attribution: { channel: 'paid_search', firstTouch: { referrer: 'https://x.test/' } },
    });
    expect(cols.utm.source).toBe('google');
    expect(cols.attribution.channel).toBe('paid_search');
    expect(cols.attribution.firstTouch.referrer).toBe('https://x.test/');
  });
});
