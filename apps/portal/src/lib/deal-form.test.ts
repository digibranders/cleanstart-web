import { describe, expect, it } from 'vitest';
import {
  blankForm,
  type DealFormState,
  draftKey,
  findCountry,
  hasContent,
  newContact,
  parseAmount,
  parseDraft,
  serializeDraft,
  toRegisterInput,
  validateDealForm,
} from './deal-form';

const today = '2026-11-23';

const valid = (over: Partial<DealFormState> = {}): DealFormState => ({
  ...blankForm('india', 'm1'),
  customer: 'Vardhan Capital',
  picked: ['images'],
  contacts: [newContact({ name: 'Rohan Mehta', email: 'rohan@vardhancapital.in' })],
  consent: true,
  ...over,
});

describe('validateDealForm', () => {
  it('accepts a minimal form', () => {
    expect(validateDealForm(valid(), today)).toEqual({});
  });

  it('asks for the basics under the right field', () => {
    const errors = validateDealForm(blankForm('india', ''), today);
    expect(Object.keys(errors).sort()).toEqual(['consent', 'contacts', 'customer', 'products']);
  });

  it('needs one contact with an email or phone, and names every contact that has details', () => {
    expect(validateDealForm(valid({ contacts: [newContact({ name: 'Only Name' })] }), today).contacts).toBeDefined();
    const errors = validateDealForm(
      valid({ contacts: [newContact({ email: 'a@b.co' }), newContact({ name: 'Two', email: 'bad' }), newContact()] }),
      today,
    );
    expect(errors['contacts.0.name']).toBe('Enter the contact name.');
    expect(errors['contacts.1.email']).toBe('Enter a valid email.');
    expect(errors['contacts.2.name']).toBeUndefined();
  });

  it('accepts a phone alone and rejects a short one', () => {
    expect(validateDealForm(valid({ contacts: [newContact({ name: 'Asha', phone: '+91 98204 31786' })] }), today)).toEqual({});
    expect(validateDealForm(valid({ contacts: [newContact({ name: 'Asha', phone: '12' })] }), today)['contacts.0.phone']).toBeDefined();
  });

  it('checks website, country, value, seats and dates', () => {
    const errors = validateDealForm(
      valid({ site: 'not a site', country: 'Atlantis', dealValue: '12x', seats: '1.5', close: '2026-11-01', decisionDate: '2027-02-30' }),
      today,
    );
    expect(Object.keys(errors).sort()).toEqual(['customerCountry', 'dealValue', 'decisionDate', 'expectedClose', 'seats', 'website']);
  });

  it('needs the consent box', () => {
    expect(validateDealForm(valid({ consent: false }), today).consent).toBeDefined();
  });
});

describe('toRegisterInput', () => {
  it('drops blank contact rows, turns blanks to null and stores the country code', () => {
    const input = toRegisterInput(
      valid({
        contacts: [newContact({ name: 'Rohan', email: 'r@v.in', role: ' CISO ' }), newContact()],
        country: 'india',
        dealValue: '1,25,000.50',
        seats: '40',
        salesStage: 'Proposal sent',
      }),
    );
    expect(input).toMatchObject({
      contacts: [{ name: 'Rohan', role: 'CISO', email: 'r@v.in', phone: null }],
      customerCountry: 'IN',
      dealValue: 125000.5,
      seats: 40,
      salesStage: 'Proposal sent',
      customerIndustry: null,
    });
  });
});

describe('helpers', () => {
  it('finds a country by name or code', () => {
    expect(findCountry('India')?.code).toBe('IN');
    expect(findCountry('ae')?.code).toBe('AE');
    expect(findCountry('Nowhere')).toBeNull();
  });

  it('parses amounts strictly', () => {
    expect(parseAmount('1,000')).toBe(1000);
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
  });
});

describe('drafts', () => {
  it('is keyed by user', () => {
    expect(draftKey('u1')).not.toBe(draftKey('u2'));
  });

  it('round trips without the consent box and with fresh contact keys', () => {
    const form = valid({ useCase: 'Hardened base images' });
    const draft = parseDraft(serializeDraft(form, new Date('2026-11-23T10:00:00Z')));
    expect(draft?.savedAt).toBe('2026-11-23T10:00:00.000Z');
    expect(draft?.form).toMatchObject({ customer: 'Vardhan Capital', useCase: 'Hardened base images', consent: false });
    expect(draft?.form.contacts[0]).toMatchObject({ name: 'Rohan Mehta', email: 'rohan@vardhancapital.in' });
  });

  it('reads missing, corrupt and foreign values as no draft', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('{oops')).toBeNull();
    expect(parseDraft('{"v":2}')).toBeNull();
    expect(parseDraft('{"v":1,"savedAt":"x","form":{"customer":1}}')).toBeNull();
  });

  it('tells a touched form from a blank one regardless of contact keys', () => {
    const blank = blankForm('india', 'm1');
    expect(hasContent({ ...blank, contacts: [newContact()] }, blank)).toBe(false);
    expect(hasContent({ ...blank, customer: 'x' }, blank)).toBe(true);
  });
});
