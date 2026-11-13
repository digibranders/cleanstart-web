import { describe, expect, it } from 'vitest';
import {
  acceptedOnFor, EXPIRY_REMINDER_DAYS, extendedEnd, isOverSla, PROTECTION_DAYS, protectionEndFor, waitingBusinessDays,
} from './deal-rules';

describe('deal rules', () => {
  it('protects for 90 days counting the acceptance day', () => {
    expect(PROTECTION_DAYS).toBe(90);
    expect(protectionEndFor('2026-11-05')).toBe('2027-02-02');
    expect(acceptedOnFor('2027-02-02')).toBe('2026-11-05');
  });

  it('extends by 30 days', () => {
    expect(extendedEnd('2027-02-02')).toBe('2027-03-04');
  });

  it('flags a registration as over the review target after 2 business days', () => {
    expect(waitingBusinessDays('2026-11-04', '2026-11-06')).toBe(2);
    expect(isOverSla('2026-11-04', '2026-11-06')).toBe(false);
    expect(isOverSla('2026-11-03', '2026-11-06')).toBe(true);
  });

  it('sends reminders 14 and 3 days before the end', () => {
    expect([...EXPIRY_REMINDER_DAYS]).toEqual([14, 3]);
  });
});
