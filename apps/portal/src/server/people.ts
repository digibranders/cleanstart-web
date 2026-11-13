import type { EmailAddress } from '@/server/email/transport';

export interface AddressSource {
  userId: string;
  email: string;
  name: string;
}

/** `%term%` with LIKE wildcards escaped, for ilike searches. */
export const likePattern = (query: string): string => `%${query.trim().replace(/[\\%_]/gu, '\\$&')}%`;

export const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

/**
 * Staff alert recipients: every person given plus the shared PARTNERS_NOTIFY_EMAIL when it is set, without duplicates.
 * Contracts H.15: staff recipients come from the action; the env address is the fallback and an extra copy.
 */
export const alertAddresses = (people: readonly AddressSource[], notifyEmail: string | undefined): EmailAddress[] => {
  const seen = new Set<string>();
  const out: EmailAddress[] = [];
  const add = (email: string, name?: string): void => {
    const key = email.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(name ? { email: key, name } : { email: key });
  };
  for (const person of people) add(person.email, person.name);
  if (notifyEmail) add(notifyEmail);
  return out;
};
