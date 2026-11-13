import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  DependencyPending,
  describeError,
  ForbiddenError,
  IntegrationError,
  isPortalError,
  NotFoundError,
  PortalError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from './errors';

describe('error hierarchy', () => {
  it('carries a code, an http status and a safe message on every class', () => {
    const cases: Array<[PortalError, string, number]> = [
      [new ValidationError([{ path: 'email', message: 'Bad' }]), 'validation', 400],
      [new UnauthenticatedError(), 'unauthenticated', 401],
      [new ForbiddenError('partner.sales may not audit.read'), 'forbidden', 403],
      [new NotFoundError('registration'), 'not_found', 404],
      [new ConflictError('already_decided', 'Already decided.'), 'conflict', 409],
      [new RateLimitError(30), 'rate_limited', 429],
      [new IntegrationError('brevo', 'timeout', { status: 504 }), 'integration', 502],
      [new DependencyPending('company not synced'), 'dependency_pending', 503],
    ];
    for (const [error, code, status] of cases) {
      expect(error.code).toBe(code);
      expect(error.httpStatus).toBe(status);
      expect(error).toBeInstanceOf(PortalError);
      expect(isPortalError(error)).toBe(true);
    }
  });

  it('never puts the internal message into the safe message', () => {
    const forbidden = new ForbiddenError('partner.sales may not audit.read');
    expect(forbidden.message).toBe('partner.sales may not audit.read');
    expect(forbidden.safeMessage).toBe('You do not have access to this.');
    const integration = new IntegrationError('r2', 'bucket cleanstart-partner-docs denied');
    expect(integration.safeMessage).not.toContain('r2');
    expect(integration.upstreamStatus).toBeNull();
  });

  it('describes a validation error with its issues and a rate limit with its retry time', () => {
    const validation = describeError(new ValidationError([{ path: 'contacts.0.email', message: 'Enter an email.' }]));
    expect(validation).toEqual({ code: 'validation', message: 'Check the highlighted fields.', issues: [{ path: 'contacts.0.email', message: 'Enter an email.' }] });
    expect(describeError(new RateLimitError(12))).toMatchObject({ code: 'rate_limited', retryAfterSeconds: 12 });
  });

  it('turns an unknown error into a generic internal message', () => {
    expect(describeError(new Error('connection string postgres://secret'))).toEqual({
      code: 'internal',
      message: 'Something went wrong on our side. Try again.',
    });
    expect(isPortalError(new Error('x'))).toBe(false);
  });

  it('keeps the conflict reason and the not found resource', () => {
    expect(new ConflictError('last_admin', 'x').reason).toBe('last_admin');
    expect(new NotFoundError('document').resource).toBe('document');
  });
});
