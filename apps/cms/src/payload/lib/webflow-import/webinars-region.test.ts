import { describe, expect, it } from 'vitest';

import { resolveWebinarRegion } from './webinars-region';

describe('resolveWebinarRegion', () => {
  it('prefers a valid Region List value over Region free-text', () => {
    expect(
      resolveWebinarRegion({ regionList: 'EMEA', region: 'Asia' }),
    ).toBe('EMEA');
  });
  it('falls back to free-text Region when Region List is blank', () => {
    expect(resolveWebinarRegion({ region: 'India' })).toBe('APAC');
    expect(resolveWebinarRegion({ region: 'Europe' })).toBe('EMEA');
    expect(resolveWebinarRegion({ region: 'Worldwide' })).toBe('Global');
    expect(resolveWebinarRegion({ region: 'USA' })).toBe('Americas');
  });
  it('handles whitespace + casing in free-text fallback', () => {
    expect(resolveWebinarRegion({ region: '  apac  ' })).toBe('APAC');
  });
  it('returns null when neither maps', () => {
    expect(resolveWebinarRegion({})).toBeNull();
    expect(resolveWebinarRegion({ region: 'Antarctica' })).toBeNull();
    expect(resolveWebinarRegion({ regionList: 'galactic' })).toBeNull();
  });
});
