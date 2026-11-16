import type { ErrorEvent } from '@sentry/nextjs';
import { SENSITIVE_KEY } from './redaction';

/** Personal data names Sentry reports must not carry. Compared lower case with `-` and `_` removed, so `user-agent` and `userAgent` are the same name. */
const PERSONAL_KEYS = new Set(['email', 'name', 'phone', 'tokenhash', 'ip', 'useragent', 'turnstiletoken', 'xforwardedfor', 'xportalclientip']);
const MAX_DEPTH = 8;
const REDACTED = '[redacted]';

const isRedactedKey = (key: string): boolean => SENSITIVE_KEY.test(key) || PERSONAL_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''));

/**
 * Copies `value` with the values of sensitive and personal keys replaced, at any depth. A cycle becomes "[circular]"
 * and anything deeper than MAX_DEPTH "[truncated]", so a hostile or self-referencing object cannot overflow the stack.
 */
export const redactForSentry = <T>(value: T): T => walk(value, 0, new WeakSet()) as T;

const walk = (value: unknown, depth: number, ancestors: WeakSet<object>): unknown => {
  if (!value || typeof value !== 'object') return value;
  if (ancestors.has(value)) return '[circular]';
  if (depth >= MAX_DEPTH) return '[truncated]';
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => walk(item, depth + 1, ancestors));
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = isRedactedKey(key) ? REDACTED : walk(item, depth + 1, ancestors);
    }
    return out;
  } finally {
    ancestors.delete(value);
  }
};

const withoutQuery = (url: string): string => url.replace(/[?#].*$/, '');

/** Sentry's beforeSend: scrubs the request body, headers, cookies, query string and URL query (invite and reset links carry a token there) and `extra`. */
export const scrubEvent = (event: ErrorEvent): ErrorEvent => {
  const { request } = event;
  if (request) {
    if (request.data) request.data = redactForSentry(request.data);
    if (request.headers) request.headers = redactForSentry(request.headers);
    if (request.cookies) request.cookies = { cookies: REDACTED };
    if (request.query_string) request.query_string = REDACTED;
    if (request.url) request.url = withoutQuery(request.url);
  }
  if (event.extra) event.extra = redactForSentry(event.extra);
  return event;
};

/** beforeSend that never throws: an event that cannot be scrubbed is sent without its request, extra and breadcrumbs. */
export const safeScrubEvent = (event: ErrorEvent): ErrorEvent => {
  try {
    return scrubEvent(event);
  } catch {
    const kept = Object.fromEntries(Object.entries(event).filter(([key]) => key !== 'request' && key !== 'breadcrumbs'));
    return { ...(kept as ErrorEvent), extra: { redacted: 'event data could not be scrubbed' } };
  }
};

/** beforeBreadcrumb data that never throws into the code that added the breadcrumb. */
export const safeBreadcrumbData = (data: Record<string, unknown>): Record<string, unknown> => {
  try {
    return redactForSentry(data);
  } catch {
    return { redacted: 'unreadable breadcrumb data' };
  }
};
