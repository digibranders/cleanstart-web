import { describe, expect, it } from 'vitest';

import { isCountryCode, isE164, normalizeE164 } from './phone';

describe('isE164', () => {
  it.each(['+14155552671', '+919876543210', '+442071838750', '+6892345678'])(
    'accepts %s',
    (value) => expect(isE164(value)).toBe(true),
  );

  it.each([
    '14155552671', // no plus
    '+0155552671', // country code cannot start with zero
    '+1415555', // too short
    '+1415555267123456', // 16 digits, over the E.164 cap of 15
    '+1 415 555 2671', // spaces are stripped upstream, not accepted here
    '',
  ])('rejects %j', (value) => expect(isE164(value)).toBe(false));

  it('rejects non-strings', () => {
    expect(isE164(null)).toBe(false);
    expect(isE164(undefined)).toBe(false);
  });
});

describe('normalizeE164', () => {
  it.each([
    ['+1 (415) 555-2671', '+14155552671'],
    ['  +91 98765 43210  ', '+919876543210'],
    ['0044 20 7183 8750', '+442071838750'],
    ['14155552671', '+14155552671'],
  ])('normalises %j to %s', (input, expected) => {
    expect(normalizeE164(input)).toBe(expected);
  });

  it.each(['', '   ', 'not a number', '+1', '12345'])('returns null for %j', (input) => {
    expect(normalizeE164(input)).toBeNull();
  });
});

describe('isCountryCode', () => {
  it('accepts uppercase alpha-2 only', () => {
    expect(isCountryCode('US')).toBe(true);
    expect(isCountryCode('IN')).toBe(true);
    expect(isCountryCode('us')).toBe(false);
    expect(isCountryCode('USA')).toBe(false);
    expect(isCountryCode('')).toBe(false);
  });
});
