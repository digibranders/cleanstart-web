import type { ErrorEvent } from '@sentry/nextjs';
import { SENSITIVE_KEY } from './redaction';

/** Personal data names Sentry reports must not carry. Compared lower case with `-` and `_` removed, so `user-agent` and `userAgent` are the same name. */
const PERSONAL_KEYS = new Set(['email', 'name', 'phone', 'tokenhash', 'ip', 'useragent', 'turnstiletoken']);
const REDACTED = '[redacted]';

const isRedactedKey = (key: string): boolean => SENSITIVE_KEY.test(key) || PERSONAL_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''));

/** Copies `value` with the values of sensitive and personal keys replaced, at any depth. */
export const redactForSentry = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactForSentry) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isRedactedKey(key) ? REDACTED : redactForSentry(item);
  }
  return out as T;
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
