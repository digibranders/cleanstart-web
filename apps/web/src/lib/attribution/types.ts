/**
 * Client-side marketing-attribution model. Mirrors the CMS boundary contract
 * in `apps/cms/src/payload/lib/lead-handlers/payload-schema.ts`:
 *  - `utm` is the **last-touch** campaign (current URL at submit).
 *  - `attribution.firstTouch` is the campaign that originally sourced the
 *    visitor, persisted across visits (consent-gated).
 *  - `channel` is intentionally NOT sent — the CMS derives it server-side.
 */

export type AttributionDevice = "desktop" | "mobile" | "tablet";

export interface AttributionUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface AttributionClickIds {
  gclid?: string;
  fbclid?: string;
  liFatId?: string;
}

/** A single campaign touch — UTMs plus the landing context, timestamped. */
export interface AttributionTouch extends AttributionUtm {
  landingPage?: string;
  referrer?: string;
  /** ISO-8601 timestamp of when this touch was captured. */
  at: string;
}

/** Persisted attribution store (one JSON cookie). */
export interface AttributionState {
  first: AttributionTouch;
  last: AttributionTouch;
  clickIds: AttributionClickIds;
}

/** Signals read from the current page load, held in memory (never gated). */
export interface AttributionSnapshot {
  touch: AttributionTouch;
  clickIds: AttributionClickIds;
  device: AttributionDevice;
}

/** The fragment merged into a lead-submit POST body. */
export interface AttributionSubmission {
  utm?: AttributionUtm;
  attribution?: {
    device?: AttributionDevice;
    gclid?: string;
    fbclid?: string;
    liFatId?: string;
    firstTouch?: AttributionTouch;
  };
}
