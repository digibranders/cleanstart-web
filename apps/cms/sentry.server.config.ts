import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// PII redaction: visitor answers, IP, and User-Agent must never leave
// the droplet. Phase G G5 will tighten this further; the minimum viable
// guard is to strip known-PII keys from breadcrumbs and request bodies.
const REDACT_KEYS = new Set([
  'fields',
  'ip',
  'userAgent',
  'email',
  'password',
  'turnstileToken',
  'consent',
]);

const redact = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEYS.has(k) ? '[redacted]' : redact(v);
  }
  return out as T;
};

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend: (event) => {
      if (event.request?.data) {
        event.request.data = redact(event.request.data);
      }
      if (event.extra) {
        event.extra = redact(event.extra);
      }
      return event;
    },
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) {
        breadcrumb.data = redact(breadcrumb.data);
      }
      return breadcrumb;
    },
  });
}
