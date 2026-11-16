import { PortalError } from '@/server/errors';
import { isSafeEmailUrl } from '../layout';
import type { EmailAddress } from '../transport';

/** Collapses every run of whitespace and every C0 or C1 control character (NUL, ESC, DEL and the rest) to one space, so visitor text cannot add a line break or a control byte to a subject. */
export const oneLine = (text: string): string => text.replace(/[\s\p{Cc}]+/gu, ' ').trim();

/** The longest subject line sendEmail passes on. */
export const MAX_SUBJECT_LENGTH = 200;

/**
 * The link in an email that exists to deliver that link (invite, password reset). An unsafe URL would otherwise make the
 * layout drop the button and still report the email as sent, so the builder throws. `template` is logged; the URL, which carries a token, is not.
 */
export function requireSafeLink(template: string, url: string): string {
  if (!isSafeEmailUrl(url)) {
    throw new PortalError('internal', 500, 'Something went wrong on our side. Try again.', { message: `${template}: the link is not an http or https URL` });
  }
  return url;
}

export const asList = (to: EmailAddress | EmailAddress[]): EmailAddress[] => (Array.isArray(to) ? to : [to]);

export const hello = (name: string | null): string => (name && oneLine(name) !== '' ? `Hello ${oneLine(name)},` : 'Hello,');

/** "Not given" for an empty optional field, so a facts row never shows a blank. */
export const orNotGiven = (value: string | null): string => (value && value.trim() !== '' ? value : 'Not given');

export const truncate = (text: string, max: number): string => {
  const flat = oneLine(text);
  return flat.length <= max ? flat : `${flat.slice(0, max - 3).trimEnd()}...`;
};

export const FOOTNOTES = {
  applicant: 'You received this email because you applied to the CleanStart partner program.',
  invitee: 'You received this email because someone invited you to the CleanStart Partner Portal.',
  partnerUser: 'You received this email because of activity on the CleanStart Partner Portal.',
  partnerAdmin: 'You received this email because you are a partner admin on the CleanStart Partner Portal.',
  staff: 'You received this email because you handle partner requests at CleanStart.',
  account: 'You received this email because it concerns your CleanStart Partner Portal login.',
} as const;
