import * as Sentry from '@sentry/nextjs';
import { redactForSentry, scrubEvent } from './src/server/sentry-scrub';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) breadcrumb.data = redactForSentry(breadcrumb.data);
      return breadcrumb;
    },
  });
}
