/**
 * Server-only entry point. Pulls in the full free-mail corpus, which must
 * never be imported from a client component.
 */

import { COMMON_FREE_EMAIL_DOMAINS } from './common-free-email-domains';
import { UPSTREAM_FREE_EMAIL_DOMAINS } from './free-email-domains';

export * from './index';

/**
 * The authoritative set the lead-intake API gates on.
 *
 * The union matters in both directions. The upstream corpus has real gaps
 * (no tutanota.com, mailbox.org, sfr.fr, globo.com, walla.co.il and ~40 more),
 * and the curated list covers only what a visitor plausibly types. Unioning
 * them also guarantees the server can never accept an address the browser
 * already rejected, which would strand the visitor on a form that says one
 * thing and an API that says another.
 */
export const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  ...UPSTREAM_FREE_EMAIL_DOMAINS,
  ...COMMON_FREE_EMAIL_DOMAINS,
]);
