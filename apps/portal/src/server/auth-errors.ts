import { ValidationError } from '@/server/errors';

/** Better Auth's APIError carries `body.code`. Null for anything else. */
export const authErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('body' in error)) return null;
  const body = (error as { body?: unknown }).body;
  if (typeof body !== 'object' || body === null || !('code' in body)) return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

/**
 * Turns the Better Auth failures a signed-in person can cause into field errors the forms already show.
 * `passwordPath` is the field a wrong password belongs to. Anything else is rethrown (it is an outage or a bug).
 */
export function throwFieldError(error: unknown, passwordPath: string): never {
  switch (authErrorCode(error)) {
    case 'INVALID_PASSWORD':
      throw new ValidationError([{ path: passwordPath, message: 'That password is not right.' }]);
    case 'PASSWORD_RULES_NOT_MET':
      throw new ValidationError([{ path: 'password', message: 'Meet all four password rules.' }]);
    case 'INVALID_CODE':
      throw new ValidationError([{ path: 'code', message: 'That code is not right. Check the 6 digits and try again.' }]);
    case 'ACCOUNT_TEMPORARILY_LOCKED':
    case 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE':
      throw new ValidationError([{ path: 'code', message: 'Too many wrong codes. Wait a few minutes and try again.' }]);
    case 'TOTP_ALREADY_ENABLED':
      throw new ValidationError([{ path: '', message: 'Two-step sign-in is already on.' }]);
    case 'TWO_FACTOR_NOT_ENABLED':
      throw new ValidationError([{ path: '', message: 'Two-step sign-in is not on.' }]);
    default:
      throw error;
  }
}
