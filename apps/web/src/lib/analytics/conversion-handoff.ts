import type { ThankYouType } from "@/lib/thank-you/types";

/**
 * One-shot handoff telling the thank-you page that it was reached by a real
 * submission, so the conversion event fires once and only once.
 *
 * Deliberately a module-scoped variable rather than sessionStorage, a signed
 * token or a cookie. The semantics fall out for free:
 *
 *  - survives `router.push`, because the JS module registry persists across a
 *    soft navigation
 *  - dies on refresh, a new tab or a pasted URL, because those get fresh module
 *    scope
 *  - consumed on read, so back and forward cannot re-fire it
 *  - touches no storage API, so visitors who block cookies are unaffected and
 *    there is nothing to wrap in try/catch
 *
 * Note what this does NOT gate: the page itself. A direct hit renders the full
 * page and simply fires nothing. Gating the page would optimise the wrong
 * error, dropping a real customer onto "you cannot view this" seconds after
 * they handed over their phone number, to prevent a stranger seeing some CTAs.
 */
let pending: ThankYouType | null = null;

/** Called by the form immediately before navigating. */
export const armConversion = (type: ThankYouType): void => {
  pending = type;
};

/**
 * @returns true exactly once per arm, and only for the matching type.
 */
export const claimConversion = (type: ThankYouType): boolean => {
  if (pending !== type) return false;
  pending = null;
  return true;
};

/** Test seam. Never call from application code. */
export const __resetConversionHandoff = (): void => {
  pending = null;
};
