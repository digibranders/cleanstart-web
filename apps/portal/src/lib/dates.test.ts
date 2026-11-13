import { describe, expect, it } from 'vitest';
import { addDays, businessDaysBetween, daysBetween, daysLeft, fmtLong, fmtShort, fmtTimestamp, plural } from './dates';

describe('dates', () => {
  it('counts and adds calendar days across a month and a year end', () => {
    expect(daysBetween('2026-11-06', '2026-12-06')).toBe(30);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-11-05', 89)).toBe('2027-02-02');
  });

  it('formats short and long dates and plurals', () => {
    expect(fmtShort('2026-11-04')).toBe('4 Nov');
    expect(fmtLong('2026-11-04')).toBe('4 Nov 2026');
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(3, 'day')).toBe('3 days');
  });

  it('gives days left, negative once the date has passed', () => {
    expect(daysLeft('2026-11-15', '2026-11-06')).toBe(9);
    expect(daysLeft('2026-11-01', '2026-11-06')).toBe(-5);
  });

  it('counts weekdays in the half open range (from, to]', () => {
    expect(businessDaysBetween('2026-11-06', '2026-11-06')).toBe(0);
    expect(businessDaysBetween('2026-11-06', '2026-11-09')).toBe(1);
    expect(businessDaysBetween('2026-11-04', '2026-11-10')).toBe(4);
  });

  it('labels timestamps against the given today', () => {
    expect(fmtTimestamp('2026-11-06T14:02:00.000Z', '2026-11-06')).toBe('Today, 14:02');
    expect(fmtTimestamp('2026-11-05T16:40:00.000Z', '2026-11-06')).toBe('Yesterday, 16:40');
    expect(fmtTimestamp('2026-10-29T10:12:00.000Z', '2026-11-06')).toBe('29 Oct, 10:12');
  });
});
