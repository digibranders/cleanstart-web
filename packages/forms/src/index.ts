/**
 * Client-safe entry point. Everything exported here is small enough to ship to
 * the browser. The full free-mail corpus lives behind `@cleanstart/forms/server`.
 */

export {
  BUSINESS_EMAIL_MESSAGES,
  validateBusinessEmail,
  type BusinessEmailFailure,
  type BusinessEmailOptions,
  type BusinessEmailResult,
} from './business-email';
export { COMMON_FREE_EMAIL_DOMAINS } from './common-free-email-domains';
export { isCountryCode, isE164, normalizeE164 } from './phone';
