import { describe, expect, it } from 'vitest';

import { deriveChannel } from './attribution';

describe('deriveChannel', () => {
  it('classifies a Google Ads click as paid search', () => {
    expect(deriveChannel({ gclid: 'abc123' })).toBe('paid_search');
  });

  it('classifies a Meta / LinkedIn click as paid social', () => {
    expect(deriveChannel({ fbclid: 'xyz' })).toBe('paid_social');
    expect(deriveChannel({ liFatId: 'li_1' })).toBe('paid_social');
  });

  it('prefers click IDs over UTM medium', () => {
    expect(deriveChannel({ gclid: 'g', utm: { medium: 'email' } })).toBe('paid_search');
  });

  it('maps cpc / ppc mediums to paid search', () => {
    expect(deriveChannel({ utm: { medium: 'cpc' } })).toBe('paid_search');
    expect(deriveChannel({ utm: { medium: 'PPC' } })).toBe('paid_search');
  });

  it('maps email and social mediums', () => {
    expect(deriveChannel({ utm: { medium: 'newsletter' } })).toBe('email');
    expect(deriveChannel({ utm: { medium: 'social' } })).toBe('social');
    expect(deriveChannel({ utm: { medium: 'organic' } })).toBe('organic_search');
  });

  it('falls back to a tagged source as referral when medium is unclassified', () => {
    expect(deriveChannel({ utm: { source: 'partner-site' } })).toBe('referral');
  });

  it('recognises a search-engine source as organic', () => {
    expect(deriveChannel({ utm: { source: 'google' } })).toBe('organic_search');
  });

  it('classifies by referrer host when no UTMs are present', () => {
    expect(deriveChannel({ referrer: 'https://www.google.com/search?q=x' })).toBe('organic_search');
    expect(deriveChannel({ referrer: 'https://www.linkedin.com/feed' })).toBe('social');
    expect(deriveChannel({ referrer: 'https://mail.google.com/' })).toBe('email');
    expect(deriveChannel({ referrer: 'https://news.ycombinator.com/' })).toBe('referral');
  });

  it('returns direct with no signals', () => {
    expect(deriveChannel({})).toBe('direct');
    expect(deriveChannel({ utm: {}, referrer: '' })).toBe('direct');
  });

  it('ignores a malformed referrer URL', () => {
    expect(deriveChannel({ referrer: 'not a url' })).toBe('direct');
  });
});
