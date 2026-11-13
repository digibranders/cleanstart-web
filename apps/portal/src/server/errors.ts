export type ErrorCode =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'integration'
  | 'dependency_pending'
  | 'internal';

export interface FieldIssue {
  /** Dot path into the input, e.g. "contacts.0.email". Empty string for a form level issue. */
  path: string;
  message: string;
}

export interface PortalErrorOptions {
  /** Internal message for logs; defaults to safeMessage. Never shown to a user. */
  message?: string;
  cause?: unknown;
}

/**
 * Base class. safeMessage is the only text that may reach a user or a client component.
 * httpStatus is used by route handlers; server actions map the code to ActionResult.
 */
export class PortalError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly safeMessage: string;

  constructor(code: ErrorCode, httpStatus: number, safeMessage: string, options: PortalErrorOptions = {}) {
    super(options.message ?? safeMessage, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'PortalError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.safeMessage = safeMessage;
  }
}

export class ValidationError extends PortalError {
  readonly issues: FieldIssue[];

  constructor(issues: FieldIssue[], safeMessage = 'Check the highlighted fields.') {
    super('validation', 400, safeMessage);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/** Authentication is missing or the session is gone. Pages redirect to /sign-in; actions return code "unauthenticated". */
export class UnauthenticatedError extends PortalError {
  constructor(message = 'Sign in to continue.') {
    super('unauthenticated', 401, message);
    this.name = 'UnauthenticatedError';
  }
}

/** The viewer is known but may not do this. Never used to hide existence: use NotFoundError for that. */
export class ForbiddenError extends PortalError {
  constructor(internalMessage?: string) {
    super('forbidden', 403, 'You do not have access to this.', internalMessage ? { message: internalMessage } : {});
    this.name = 'ForbiddenError';
  }
}

/**
 * The record does not exist or is not visible to the viewer. Both cases look identical on purpose (a non-audience
 * partner gets 404, not 403, so ids cannot be probed).
 */
export class NotFoundError extends PortalError {
  readonly resource: string;

  constructor(resource: string, internalMessage?: string) {
    super('not_found', 404, 'We could not find that.', { message: internalMessage ?? `${resource} not found` });
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/** The request is valid but conflicts with current state. reason is a stable machine code the UI may switch on. */
export class ConflictError extends PortalError {
  readonly reason: string;

  constructor(reason: string, safeMessage: string) {
    super('conflict', 409, safeMessage, { message: `${reason}: ${safeMessage}` });
    this.name = 'ConflictError';
    this.reason = reason;
  }
}

export class RateLimitError extends PortalError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('rate_limited', 429, 'Too many attempts. Try again in a moment.', {
      message: `rate limited, retry after ${retryAfterSeconds}s`,
    });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type IntegrationService = 'hubspot' | 'brevo' | 'r2' | 'cms' | 'turnstile';

/**
 * An external service failed or answered with something we cannot use. The HubSpot client keeps its own
 * HubspotError (HubSpot plan 4.2) and the outbox treats any thrown error as retryable, so IntegrationError is for
 * Brevo, R2, the CMS intake and Turnstile.
 */
export class IntegrationError extends PortalError {
  readonly service: IntegrationService;
  readonly upstreamStatus: number | null;

  constructor(service: IntegrationService, message: string, options: { status?: number; cause?: unknown } = {}) {
    super('integration', 502, 'A connected service is not responding. Try again in a moment.', {
      message: `${service}: ${message}`,
      ...(options.cause === undefined ? {} : { cause: options.cause }),
    });
    this.name = 'IntegrationError';
    this.service = service;
    this.upstreamStatus = options.status ?? null;
  }
}

/**
 * Thrown by an outbox handler when a record it needs has not been synced yet. The outbox reschedules the row
 * in one minute without counting an attempt. The HubSpot plan imports this from './types'; that file re-exports
 * this class (section M, inconsistency 1), so `instanceof` works on either import.
 */
export class DependencyPending extends PortalError {
  constructor(message: string) {
    super('dependency_pending', 503, 'Waiting for a related record to finish syncing.', { message });
    this.name = 'DependencyPending';
  }
}

export const isPortalError = (value: unknown): value is PortalError => value instanceof PortalError;

/** Maps any error to a user safe ErrorCode and message. Unknown errors become "internal" with a generic message. */
export const describeError = (error: unknown): { code: ErrorCode; message: string; issues?: FieldIssue[]; retryAfterSeconds?: number } => {
  if (error instanceof ValidationError) return { code: error.code, message: error.safeMessage, issues: error.issues };
  if (error instanceof RateLimitError) return { code: error.code, message: error.safeMessage, retryAfterSeconds: error.retryAfterSeconds };
  if (error instanceof PortalError) return { code: error.code, message: error.safeMessage };
  return { code: 'internal', message: 'Something went wrong on our side. Try again.' };
};
