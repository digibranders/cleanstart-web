import { describe, expect, it } from 'vitest';

import { resolveWebinarRegion } from './webinars-region';

describe('resolveWebinarRegion', () => {
  it('prefers a valid Region List value over Region free-text', () => {
    expect(
      resolveWebinarRegion({ regionList: 'emea', region: 'Asia' }),
    ).toBe('emea');
  });
  it('maps legacy PascalCase Region List values to the new enum', () => {
    expect(resolveWebinarRegion({ regionList: 'Americas' })).toBe('north-america');
    expect(resolveWebinarRegion({ regionList: 'APAC' })).toBe('asia-mea');
    expect(resolveWebinarRegion({ regionList: 'EMEA' })).toBe('emea');
    expect(resolveWebinarRegion({ regionList: 'Global' })).toBe('global');
  });
  it('falls back to free-text Region when Region List is blank', () => {
    expect(resolveWebinarRegion({ region: 'India' })).toBe('asia-mea');
    expect(resolveWebinarRegion({ region: 'Europe' })).toBe('emea');
    expect(resolveWebinarRegion({ region: 'Worldwide' })).toBe('global');
    expect(resolveWebinarRegion({ region: 'USA' })).toBe('north-america');
  });
  it('handles whitespace + casing in free-text fallback', () => {
    expect(resolveWebinarRegion({ region: '  apac  ' })).toBe('asia-mea');
  });
  it('returns null when neither maps', () => {
    expect(resolveWebinarRegion({})).toBeNull();
    expect(resolveWebinarRegion({ region: 'Antarctica' })).toBeNull();
    expect(resolveWebinarRegion({ regionList: 'galactic' })).toBeNull();
  });
});
