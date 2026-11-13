import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/server/errors';
import { authErrorCode, throwFieldError } from './auth-errors';

const apiError = (code: string): Error => Object.assign(new Error(code), { statusCode: 400, body: { code, message: code } });

describe('authErrorCode', () => {
  it('reads body.code of a Better Auth error and nothing else', () => {
    expect(authErrorCode(apiError('INVALID_PASSWORD'))).toBe('INVALID_PASSWORD');
    expect(authErrorCode(new Error('plain'))).toBeNull();
    expect(authErrorCode(null)).toBeNull();
    expect(authErrorCode({ body: { code: 7 } })).toBeNull();
  });
});

describe('throwFieldError', () => {
  const catches = (error: unknown): ValidationError => {
    try {
      throwFieldError(error, 'currentPassword');
    } catch (thrown) {
      if (thrown instanceof ValidationError) return thrown;
    }
    throw new Error('expected a ValidationError');
  };

  it('maps a wrong password to the password field the caller names', () => {
    expect(catches(apiError('INVALID_PASSWORD')).issues).toEqual([{ path: 'currentPassword', message: 'That password is not right.' }]);
  });

  it('maps the portal password rule, a wrong code and a lockout', () => {
    expect(catches(apiError('PASSWORD_RULES_NOT_MET')).issues).toEqual([{ path: 'password', message: 'Meet all four password rules.' }]);
    expect(catches(apiError('INVALID_CODE')).issues).toEqual([{ path: 'code', message: 'That code is not right. Check the 6 digits and try again.' }]);
    expect(catches(apiError('ACCOUNT_TEMPORARILY_LOCKED')).issues[0]?.path).toBe('code');
  });

  it('maps already-on and not-on to a form level message', () => {
    expect(catches(apiError('TOTP_ALREADY_ENABLED')).issues).toEqual([{ path: '', message: 'Two-step sign-in is already on.' }]);
    expect(catches(apiError('TWO_FACTOR_NOT_ENABLED')).issues).toEqual([{ path: '', message: 'Two-step sign-in is not on.' }]);
  });

  it('rethrows anything it does not know', () => {
    const unknown = apiError('SOMETHING_ELSE');
    expect(() => throwFieldError(unknown, 'password')).toThrow(unknown);
  });
});
