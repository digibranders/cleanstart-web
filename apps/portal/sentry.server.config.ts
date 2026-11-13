import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// Names whose values must never leave the server inside an error report.
const REDACT_KEYS = new Set(['email', 'name', 'phone', 'password', 'token', 'tokenHash', 'authorization', 'cookie', 'ip', 'userAgent', 'turnstileToken']);

const redact = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACT_KEYS.has(key) ? '[redacted]' : redact(item);
  }
  return out as T;
};

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend: (event) => {
      if (event.request?.data) event.request.data = redact(event.request.data);
      if (event.extra) event.extra = redact(event.extra);
      return event;
    },
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) breadcrumb.data = redact(breadcrumb.data);
      return breadcrumb;
    },
  });
}
