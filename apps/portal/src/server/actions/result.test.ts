import { describe, expect, it } from 'vitest';
import { fail, issuesToErrors, ok } from './result';

describe('ActionResult helpers', () => {
  it('wraps data and errors', () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 });
    expect(fail({ code: 'conflict', message: 'No.' })).toEqual({ ok: false, error: { code: 'conflict', message: 'No.' } });
  });

  it('maps issues to a field to message record', () => {
    expect(
      issuesToErrors({ code: 'validation', message: 'x', issues: [{ path: 'email', message: 'Bad' }, { path: 'phone', message: 'Short' }] }),
    ).toEqual({ email: 'Bad', phone: 'Short' });
    expect(issuesToErrors({ code: 'internal', message: 'x' })).toEqual({});
  });
});
