/**
 * Free at-launch enrichment — derive a company name from the work-email
 * domain. No external API call, no per-lookup cost. Clearbit / ZoomInfo
 * / Apollo are deferred until sales pipeline ROI clears their cost.
 *
 * Heuristic: take the email's domain, strip the public suffix (.com /
 * .co.uk / etc.), uppercase the first letter of the remaining label.
 * "jane@cleanstart.com" → { domain: 'cleanstart.com', company: 'Cleanstart' }
 * "ops@gov.uk"           → null (free-mail / generic — skip)
 *
 * Public-suffix matching is the eternal long tail; for v1 we ship a
 * curated free-mail block-list. When a real edge case shows up we
 * either extend the list or pull in the publicsuffix-list package.
 */

const FREEMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.com.br',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'mail.com',
  'gmx.com',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'qq.com',
  '163.com',
  '126.com',
  'fastmail.com',
  'tutanota.com',
  'tutanota.de',
  'duck.com',
  'mailinator.com',
  'sharklasers.com',
  'guerrillamail.com',
  '10minutemail.com',
  'trashmail.com',
  'temp-mail.org',
]);

const KNOWN_TWO_PART_TLDS: ReadonlySet<string> = new Set([
  'co.uk',
  'co.in',
  'co.jp',
  'co.kr',
  'co.nz',
  'co.za',
  'com.au',
  'com.br',
  'com.mx',
  'com.sg',
  'com.tr',
  'com.cn',
  'com.tw',
  'com.hk',
  'org.uk',
  'org.au',
  'org.br',
  'gov.uk',
  'gov.in',
  'ac.uk',
  'ac.in',
  'ac.jp',
  'edu.au',
  'edu.in',
  'net.au',
  'net.uk',
]);

export type EmailDomainEnrichment = {
  domain: string;
  company: string;
};

const titleCase = (label: string): string =>
  label
    .split(/[-_]/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');

/**
 * @returns enrichment when the domain looks like a corporate domain;
 *          null when the email is free-mail, malformed, or a generic
 *          domain we shouldn't infer a company from.
 */
export const companyFromEmailDomain = (
  email: string | null | undefined,
): EmailDomainEnrichment | null => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at < 0 || at === trimmed.length - 1) return null;

  const domain = trimmed.slice(at + 1);
  if (domain.length === 0 || !domain.includes('.')) return null;

  if (FREEMAIL_DOMAINS.has(domain)) return null;

  // Strip trailing two-part TLD when applicable, otherwise strip the last label.
  const labels = domain.split('.');
  let baseLabel: string;
  if (labels.length >= 3) {
    const lastTwo = labels.slice(-2).join('.');
    if (KNOWN_TWO_PART_TLDS.has(lastTwo)) {
      baseLabel = labels[labels.length - 3] ?? '';
    } else {
      baseLabel = labels[labels.length - 2] ?? '';
    }
  } else {
    baseLabel = labels[0] ?? '';
  }

  if (baseLabel.length === 0) return null;

  return {
    domain,
    company: titleCase(baseLabel),
  };
};
