import { describe, expect, it } from 'vitest';

import { resolveJobLocation } from './job-locations';

describe('resolveJobLocation', () => {
  it('resolves curated cities to structured shape with timezone', () => {
    expect(resolveJobLocation('Bengaluru')).toMatchObject({
      name: 'Bengaluru',
      isoCountry: 'IN',
      timezone: 'Asia/Kolkata',
      type: 'city',
    });
    expect(resolveJobLocation('bangalore')).toMatchObject({ name: 'Bengaluru' });
  });
  it('resolves curated countries', () => {
    expect(resolveJobLocation('United States')).toMatchObject({
      name: 'United States',
      isoCountry: 'US',
      type: 'country',
    });
    expect(resolveJobLocation('UK')).toMatchObject({ isoCountry: 'GB' });
  });
  it('treats Remote as a region with UTC tz', () => {
    expect(resolveJobLocation('Remote')).toMatchObject({
      name: 'Remote',
      type: 'region',
      timezone: 'UTC',
    });
  });
  it('returns null for unknown names', () => {
    expect(resolveJobLocation('Atlantis')).toBeNull();
    expect(resolveJobLocation('')).toBeNull();
    expect(resolveJobLocation(null)).toBeNull();
  });
  it('is case- and whitespace-insensitive', () => {
    expect(resolveJobLocation('  BENGALURU, india  ')).toMatchObject({
      isoCountry: 'IN',
    });
  });
});
