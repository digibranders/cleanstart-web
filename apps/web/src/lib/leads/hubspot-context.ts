/**
 * HubSpot context sent with a form submission, so HubSpot can tie the contact it
 * creates to the visitor its tracking code already recorded.
 *
 * The `hubspotutk` cookie only exists after the HubSpot tag has run, and that
 * tag is gated on the Targeting consent category in GTM. A visitor who declined
 * has no cookie, so nothing is sent: this file never reads consent state itself.
 */

const HUTK_PATTERN = /^[a-f0-9]{32}$/i;
const PAGE_NAME_MAX = 256;

export interface HubspotSubmitContext {
  hutk?: string;
  pageName?: string;
}

/** The `hubspotutk` value from a `document.cookie` string, or undefined. */
export function parseHubspotUtk(cookie: string): string | undefined {
  for (const part of cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq).trim() !== "hubspotutk") continue;
    const value = part.slice(eq + 1).trim();
    return HUTK_PATTERN.test(value) ? value : undefined;
  }
  return undefined;
}

/** Browser-only. Returns an empty object during SSR. */
export function readHubspotContext(): HubspotSubmitContext {
  if (typeof document === "undefined") return {};
  const hutk = parseHubspotUtk(document.cookie);
  const pageName = document.title.trim().slice(0, PAGE_NAME_MAX);
  return {
    ...(hutk ? { hutk } : {}),
    ...(pageName ? { pageName } : {}),
  };
}
