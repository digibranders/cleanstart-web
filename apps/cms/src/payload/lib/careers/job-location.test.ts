import { describe, expect, it } from 'vitest';

import { formatJobLocation } from './job-location';

describe('formatJobLocation', () => {
  it('prefixes Remote and joins named locations', () => {
    expect(formatJobLocation({ remote: true, locationNames: ['San Jose'] })).toBe('Remote · San Jose');
    expect(formatJobLocation({ remote: true, locationNames: ['Austin', 'Berlin'] })).toBe(
      'Remote · Austin, Berlin',
    );
  });

  it('returns just Remote when remote with no named locations', () => {
    expect(formatJobLocation({ remote: true, locationNames: [] })).toBe('Remote');
  });

  it('joins named locations when not remote', () => {
    expect(formatJobLocation({ remote: false, locationNames: ['Austin', 'Berlin'] })).toBe('Austin, Berlin');
  });

  it('returns undefined when neither remote nor named locations', () => {
    expect(formatJobLocation({ remote: false, locationNames: [] })).toBeUndefined();
    expect(formatJobLocation({ remote: null, locationNames: ['  ', ''] })).toBeUndefined();
  });
});
