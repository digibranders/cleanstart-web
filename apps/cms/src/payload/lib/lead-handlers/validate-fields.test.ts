import { describe, expect, it } from 'vitest';

import { type FormFieldDef, validateFields } from './validate-fields';

const text = (overrides: Partial<FormFieldDef> = {}): FormFieldDef => ({
  name: 'name',
  type: 'text',
  label: 'Name',
  required: true,
  ...overrides,
});

const email = (overrides: Partial<FormFieldDef> = {}): FormFieldDef => ({
  name: 'email',
  type: 'email',
  label: 'Email',
  required: true,
  ...overrides,
});

const consent = (overrides: Partial<FormFieldDef> = {}): FormFieldDef => ({
  name: 'consent',
  type: 'consent',
  label: 'I agree',
  required: true,
  ...overrides,
});

describe('validateFields', () => {
  it('passes when every required field is present and well-formed', () => {
    const defs = [text(), email()];
    const result = validateFields(defs, { name: 'Jane', email: 'jane@example.com' });
    expect(result.ok).toBe(true);
  });

  it('rejects missing required text', () => {
    const defs = [text()];
    const result = validateFields(defs, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]?.fieldName).toBe('name');
    }
  });

  it('rejects empty / whitespace-only required text', () => {
    const result = validateFields([text()], { name: '   ' });
    expect(result.ok).toBe(false);
  });

  it('does not require optional fields when blank', () => {
    const defs = [text({ required: false })];
    expect(validateFields(defs, {}).ok).toBe(true);
    expect(validateFields(defs, { name: '' }).ok).toBe(true);
  });

  it('enforces minLength', () => {
    const defs = [text({ validation: { minLength: 5 } })];
    const result = validateFields(defs, { name: 'Jo' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/at least 5/);
  });

  it('enforces maxLength', () => {
    const defs = [text({ validation: { maxLength: 3 } })];
    const result = validateFields(defs, { name: 'Janet' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/3 characters or fewer/);
  });

  it('enforces regex pattern', () => {
    const defs = [text({ validation: { pattern: '^[A-Z]+$' } })];
    expect(validateFields(defs, { name: 'lowercase' }).ok).toBe(false);
    expect(validateFields(defs, { name: 'UPPER' }).ok).toBe(true);
  });

  it('treats invalid stored regex as no rule (does not block visitor)', () => {
    const defs = [text({ validation: { pattern: '[invalid(' } })];
    const result = validateFields(defs, { name: 'anything' });
    expect(result.ok).toBe(true);
  });

  it('rejects malformed email', () => {
    const result = validateFields([email()], { email: 'not-an-email' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/valid email/);
  });

  it('accepts well-formed email', () => {
    expect(validateFields([email()], { email: 'a@b.io' }).ok).toBe(true);
  });

  it('requires consent checkbox to be true', () => {
    const result = validateFields([consent()], { consent: false });
    expect(result.ok).toBe(false);
  });

  it('passes when consent is true', () => {
    expect(validateFields([consent()], { consent: true }).ok).toBe(true);
  });

  it('select rejects values outside the configured options', () => {
    const defs: FormFieldDef[] = [
      {
        name: 'plan',
        type: 'select',
        label: 'Plan',
        required: true,
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    ];
    expect(validateFields(defs, { plan: 'free' }).ok).toBe(true);
    expect(validateFields(defs, { plan: 'enterprise' }).ok).toBe(false);
  });

  it('checkbox rejects non-boolean', () => {
    const defs: FormFieldDef[] = [
      { name: 'sub', type: 'checkbox', label: 'Subscribe', required: false },
    ];
    expect(validateFields(defs, { sub: true }).ok).toBe(true);
    expect(validateFields(defs, { sub: false }).ok).toBe(true);
    expect(validateFields(defs, { sub: 'yes' }).ok).toBe(false);
  });

  it('collects multiple issues at once (does not short-circuit)', () => {
    const defs = [text(), email()];
    const result = validateFields(defs, { name: '', email: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toHaveLength(2);
  });
});
