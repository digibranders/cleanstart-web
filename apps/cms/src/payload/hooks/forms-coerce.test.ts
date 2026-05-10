import { describe, expect, it } from 'vitest';

import { formsCoerceHook } from './forms-coerce';

const run = (data: Record<string, unknown>) =>
  formsCoerceHook({
    data,
    operation: 'update',
  } as unknown as Parameters<typeof formsCoerceHook>[0]);

describe('formsCoerceHook', () => {
  it('returns data unchanged when fields is missing', async () => {
    const out = await run({ name: 'no fields' });
    expect(out).toEqual({ name: 'no fields' });
  });

  it('forces consent fields to required=true even if editor set false', async () => {
    const out = (await run({
      fields: [
        { name: 'agree', type: 'consent', required: false },
        { name: 'name', type: 'text', required: false },
      ],
    })) as { fields: { name: string; required: boolean }[] };
    expect(out.fields[0]?.required).toBe(true);
    expect(out.fields[1]?.required).toBe(false);
  });

  it('passes safe regex patterns through', async () => {
    const out = await run({
      fields: [{ name: 'phone', type: 'text', validation: { pattern: '^\\d{3}-\\d{4}$' } }],
    });
    expect(out).toBeDefined();
  });

  it('throws on catastrophically backtracking patterns', () => {
    expect(() =>
      run({ fields: [{ name: 'q', type: 'text', validation: { pattern: '(a+)+' } }] }),
    ).toThrow(/pattern/);
  });

  it('throws on invalid regex syntax', () => {
    expect(() =>
      run({ fields: [{ name: 'q', type: 'text', validation: { pattern: '[' } }] }),
    ).toThrow(/pattern/);
  });

  it('uses the field name in the error message when present', () => {
    expect(() =>
      run({ fields: [{ name: 'phone', type: 'text', validation: { pattern: '(a+)+' } }] }),
    ).toThrow(/phone/);
  });
});
