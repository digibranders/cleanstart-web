import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { Webinars } from './Webinars';

/**
 * Behavioural lock on the `registrationMode` discriminator. The schema
 * surface snapshot already pins the enum values (`internal` / `external`);
 * this pins the conditional-required *validation* that drifted once before
 * (the `inHouse` → `internal` rename, see CLAUDE.md schema decisions).
 */

type ValidateFn = (
  value: unknown,
  ctx: { siblingData?: Record<string, unknown> },
) => true | string;

type ConditionFn = (data: unknown, sibling: Record<string, unknown>) => boolean;

const namedField = (name: string): Field => {
  const field = Webinars.fields.find(
    (f): f is Field & { name: string } => 'name' in f && f.name === name,
  );
  if (!field) throw new Error(`Webinars field ${name} not found`);
  return field;
};

const validateOf = (name: string): ValidateFn =>
  (namedField(name) as unknown as { validate: ValidateFn }).validate;

const conditionOf = (name: string): ConditionFn =>
  (namedField(name) as unknown as { admin: { condition: ConditionFn } }).admin.condition;

describe('Webinars registrationMode discriminator', () => {
  it('keeps the canonical enum values (internal | external)', () => {
    const mode = namedField('registrationMode') as unknown as {
      options: { value: string }[];
      defaultValue: string;
    };
    expect(mode.options.map((o) => o.value).sort()).toEqual(['external', 'internal']);
    expect(mode.defaultValue).toBe('external');
  });

  describe('registrationUrl (required iff external)', () => {
    const validate = validateOf('registrationUrl');

    it('requires a non-empty url in external mode', () => {
      expect(validate('', { siblingData: { registrationMode: 'external' } })).toMatch(/required/i);
      expect(validate('   ', { siblingData: { registrationMode: 'external' } })).toMatch(/required/i);
      expect(validate('https://x', { siblingData: { registrationMode: 'external' } })).toBe(true);
    });

    it('does not require a url in internal mode', () => {
      expect(validate(undefined, { siblingData: { registrationMode: 'internal' } })).toBe(true);
    });

    it('is exempt for on-demand webinars regardless of mode', () => {
      expect(
        validate('', { siblingData: { registrationMode: 'external', webinarType: 'on-demand' } }),
      ).toBe(true);
    });
  });

  describe('registrationForm (required iff internal)', () => {
    const validate = validateOf('registrationForm');

    it('requires a form in internal mode', () => {
      expect(validate(null, { siblingData: { registrationMode: 'internal' } })).toMatch(/required/i);
      expect(validate(7, { siblingData: { registrationMode: 'internal' } })).toBe(true);
    });

    it('does not require a form in external mode', () => {
      expect(validate(null, { siblingData: { registrationMode: 'external' } })).toBe(true);
    });

    it('is exempt for on-demand webinars', () => {
      expect(
        validate(null, { siblingData: { registrationMode: 'internal', webinarType: 'on-demand' } }),
      ).toBe(true);
    });
  });

  describe('admin show/hide conditions track the discriminator', () => {
    it('shows registrationUrl only in external mode', () => {
      const cond = conditionOf('registrationUrl');
      expect(cond(undefined, { registrationMode: 'external' })).toBe(true);
      expect(cond(undefined, { registrationMode: 'internal' })).toBe(false);
    });

    it('shows registrationForm only in internal mode', () => {
      const cond = conditionOf('registrationForm');
      expect(cond(undefined, { registrationMode: 'internal' })).toBe(true);
      expect(cond(undefined, { registrationMode: 'external' })).toBe(false);
    });
  });
});
