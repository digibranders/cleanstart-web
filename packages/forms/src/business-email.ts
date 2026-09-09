/**
 * Company-email validation, shared by the marketing forms and the lead-intake
 * API so both sides apply exactly the same rule.
 *
 * The caller supplies the domain set, which is what lets one implementation
 * serve both sides: the browser passes COMMON_FREE_EMAIL_DOMAINS for instant
 * inline feedback, the server passes the full FREE_EMAIL_DOMAINS corpus as the
 * authoritative gate.
 */

/**
 * Deliberately permissive on the local part and strict on the shape. RFC 5322
 * in full permits quoted strings and comments that no real visitor types and
 * that every downstream system (HubSpot included) would choke on anyway.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

/** Longest TLD in the IANA root zone is 24 characters; 63 is the label cap. */
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u;

export type BusinessEmailFailure = 'required' | 'syntax' | 'free-mail';

export type BusinessEmailResult =
  | { ok: true; email: string; domain: string }
  | { ok: false; reason: BusinessEmailFailure; message: string };

export const BUSINESS_EMAIL_MESSAGES: Readonly<Record<BusinessEmailFailure, string>> = {
  required: 'Email is required.',
  syntax: 'Enter a valid email address.',
  'free-mail': 'Please use your company email address.',
};

export interface BusinessEmailOptions {
  /**
   * Domains to reject. Matched against the full domain, lowercased. Pass
   * COMMON_FREE_EMAIL_DOMAINS in the browser, FREE_EMAIL_DOMAINS on the server.
   */
  freeDomains: ReadonlySet<string>;
  /**
   * Set false to check the address shape only. Used by the forms that accept a
   * personal address (newsletter, gated downloads, job applications).
   */
  requireBusiness?: boolean;
}

const fail = (reason: BusinessEmailFailure): BusinessEmailResult => ({
  ok: false,
  reason,
  message: BUSINESS_EMAIL_MESSAGES[reason],
});

/**
 * @returns the normalised address and its domain, or the first rule it breaks.
 */
export const validateBusinessEmail = (
  raw: string | null | undefined,
  options: BusinessEmailOptions,
): BusinessEmailResult => {
  // A trailing root dot is a legal FQDN, so strip it before anything else
  // parses the address: "jane@gmail.com." is the same mailbox as
  // "jane@gmail.com" and has to match the free-mail set the same way.
  const email =
    typeof raw === 'string' ? raw.trim().toLowerCase().replace(/\.$/u, '') : '';
  if (email.length === 0) return fail('required');
  // Guards the leads table and every downstream CRM field against an address
  // no mail transfer agent would accept.
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail('syntax');

  const at = email.lastIndexOf('@');
  const domain = email.slice(at + 1);
  if (!DOMAIN_RE.test(domain)) return fail('syntax');

  if (options.requireBusiness !== false && options.freeDomains.has(domain)) {
    return fail('free-mail');
  }

  return { ok: true, email: `${email.slice(0, at)}@${domain}`, domain };
};
