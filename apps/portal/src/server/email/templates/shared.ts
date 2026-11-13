import type { EmailAddress } from '../transport';

/** Collapses every run of whitespace, so visitor text cannot add a line break to a subject. */
export const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const asList = (to: EmailAddress | EmailAddress[]): EmailAddress[] => (Array.isArray(to) ? to : [to]);

export const hello = (name: string | null): string => (name && oneLine(name) !== '' ? `Hello ${oneLine(name)},` : 'Hello,');

/** "Not given" for an empty optional field, so a facts row never shows a blank. */
export const orNotGiven = (value: string | null): string => (value && value.trim() !== '' ? value : 'Not given');

export const truncate = (text: string, max: number): string => {
  const flat = oneLine(text);
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}...`;
};

export const FOOTNOTES = {
  applicant: 'You received this email because you applied to the CleanStart partner program.',
  invitee: 'You received this email because someone invited you to the CleanStart Partner Portal.',
  partnerUser: 'You received this email because of activity on the CleanStart Partner Portal.',
  partnerAdmin: 'You received this email because you are a partner admin on the CleanStart Partner Portal.',
  staff: 'You received this email because you handle partner requests at CleanStart.',
  account: 'You received this email because it concerns your CleanStart Partner Portal login.',
} as const;
