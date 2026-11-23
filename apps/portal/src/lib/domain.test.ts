import { describe, expect, it } from 'vitest';
import {
  DOC_PRODUCT_LABEL, DOC_PRODUCTS, DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES, isOneOf, NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_OF,
  NOTIFICATION_KINDS, PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_STATUSES, PARTNER_STATUS_LABEL, REGISTRATION_STATUS_LABEL,
  REGISTRATION_STATUSES,
} from './domain';

describe('domain enums', () => {
  it('has a display label for every enum value', () => {
    expect(Object.keys(PARTNER_CATEGORY_LABEL).sort()).toEqual([...PARTNER_CATEGORIES].sort());
    expect(Object.keys(PARTNER_STATUS_LABEL).sort()).toEqual([...PARTNER_STATUSES].sort());
    expect(Object.keys(REGISTRATION_STATUS_LABEL).sort()).toEqual([...REGISTRATION_STATUSES].sort());
    expect(Object.keys(DOCUMENT_TYPE_LABEL).sort()).toEqual([...DOCUMENT_TYPES].sort());
    expect(Object.keys(DOC_PRODUCT_LABEL).sort()).toEqual([...DOC_PRODUCTS].sort());
  });

  it('maps every notification kind to a known switch or to staff-always', () => {
    expect(Object.keys(NOTIFICATION_CATEGORY_OF).sort()).toEqual([...NOTIFICATION_KINDS].sort());
    for (const category of Object.values(NOTIFICATION_CATEGORY_OF)) {
      expect(category === null || NOTIFICATION_CATEGORIES.includes(category)).toBe(true);
    }
  });

  it('has exactly two partner categories and no system integrator', () => {
    expect([...PARTNER_CATEGORIES]).toEqual(['distributor', 'channel']);
    expect(isOneOf(PARTNER_CATEGORIES, 'integrator')).toBe(false);
    expect(isOneOf(PARTNER_CATEGORIES, 'system_integrator')).toBe(false);
  });

  it('narrows with isOneOf', () => {
    expect(isOneOf(PARTNER_CATEGORIES, 'channel')).toBe(true);
    expect(isOneOf(PARTNER_CATEGORIES, 'Channel partner')).toBe(false);
    expect(isOneOf(PARTNER_CATEGORIES, 42)).toBe(false);
  });
});
