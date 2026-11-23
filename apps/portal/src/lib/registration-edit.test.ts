import { describe, expect, it } from 'vitest';
import type { RegistrationDetailDto } from './dto';
import { changedFields, hasReachableContact } from './registration-edit';

const deal = {
  customer: 'Vardhan Capital',
  website: 'vardhancapital.in',
  customerCountry: 'IN',
  customerIndustry: null,
  useCase: null,
  competitor: null,
  seats: 50,
  dealValue: 1000,
  currency: 'USD',
  salesStage: null,
  expectedClose: '2027-01-01',
  decisionDate: null,
  notes: 'hi',
} as unknown as RegistrationDetailDto;

describe('changedFields', () => {
  it('reports nothing for an empty or identical patch', () => {
    expect(changedFields(deal, {})).toEqual([]);
    expect(changedFields(deal, { customer: 'Vardhan Capital', seats: 50, notes: 'hi', useCase: null })).toEqual([]);
  });

  it('reports before and after, and null as a clear', () => {
    const out = changedFields(deal, { customer: 'Vardhan Capital Ltd', notes: null, seats: 60, competitor: 'Acme' });
    expect(out.map((c) => [c.field, c.before, c.after])).toEqual([
      ['customer', 'Vardhan Capital', 'Vardhan Capital Ltd'],
      ['competitor', 'empty', 'Acme'],
      ['seats', '50', '60'],
      ['notes', 'hi', 'empty'],
    ]);
  });
});

describe('hasReachableContact', () => {
  it('needs an email or a phone', () => {
    expect(hasReachableContact([])).toBe(false);
    expect(hasReachableContact([{ email: null, phone: ' ' }])).toBe(false);
    expect(hasReachableContact([{ email: null, phone: null }, { email: 'a@b.co', phone: null }])).toBe(true);
    expect(hasReachableContact([{ email: null, phone: '+911234567' }])).toBe(true);
  });
});
