import type { ConsentCategories } from "./types";

/**
 * The dataLayer event GTM triggers consent-gated tags on.
 *
 * Consent Mode signals alone cannot gate Custom HTML tags reliably, for two
 * reasons. The banner decision is applied after hydration, long after the
 * container has evaluated its "All Pages" trigger, and GTM never re-fires a tag
 * that failed its consent check, so an opted-in visitor would stay untracked.
 * And `analytics_storage` is granted by default outside the EEA/UK/CH so GA4
 * stays un-gated, which makes it useless for gating a session recorder on the
 * Performance category. So ConsentProvider pushes this event on every resolved
 * decision (returning visitor on load, or a fresh banner choice), and tags fire
 * on it with a trigger condition on the matching category flag.
 *
 * The flag keys persist in the GTM data model on purpose: they always hold the
 * current decision.
 */
export const CONSENT_UPDATE_EVENT = "cs_consent_update";

export interface ConsentUpdateEvent {
  event: typeof CONSENT_UPDATE_EVENT;
  cs_consent_performance: boolean;
  cs_consent_functional: boolean;
  cs_consent_targeting: boolean;
}

export function consentUpdateEvent(c: ConsentCategories): ConsentUpdateEvent {
  return {
    event: CONSENT_UPDATE_EVENT,
    cs_consent_performance: c.performance,
    cs_consent_functional: c.functional,
    cs_consent_targeting: c.targeting,
  };
}
