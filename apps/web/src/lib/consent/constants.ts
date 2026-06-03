/** Bump to force a global re-prompt (e.g. when categories change).
 *  v2: expanded from {essential, analytics} to the 4-category OneTrust model
 *  (strictlyNecessary / performance / functional / targeting). */
export const CONSENT_VERSION = 2;

export const CONSENT_COOKIE = "cs_consent";
/** 12 months, in seconds — also the re-prompt window. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
export const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE * 1000;
