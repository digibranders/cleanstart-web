import { COMMON_FREE_EMAIL_DOMAINS, validateBusinessEmail } from '@cleanstart/forms';
import { fmtLong, fmtShort, addDays } from '@/lib/dates';
import { type RegionDto, scopeTeamLabel } from '@/lib/regions';
import type { PartnerRole, StaffRole, StaffScope, UserKind } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';

const NO_FREE_DOMAINS: ReadonlySet<string> = new Set();
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u;

/** Shape check only. Free mail is allowed here; callers add the business rule themselves. */
export const isValidEmail = (value: string): boolean =>
  validateBusinessEmail(value, { freeDomains: NO_FREE_DOMAINS, requireBusiness: false }).ok;

/** Lower case domain of a valid email, or an empty string. */
export const emailDomain = (value: string): string => {
  const result = validateBusinessEmail(value, { freeDomains: NO_FREE_DOMAINS, requireBusiness: false });
  return result.ok ? result.domain : '';
};

/** Client side free mail check (curated list). The server uses the full corpus from '@cleanstart/forms/server'. */
export const isFreeEmail = (value: string): boolean => {
  const result = validateBusinessEmail(value, { freeDomains: COMMON_FREE_EMAIL_DOMAINS });
  return !result.ok && result.reason === 'free-mail';
};

/** "https://www.Example.com/path" becomes "example.com". */
export const normaliseDomain = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//u, '')
    .replace(/^www\./u, '')
    .split(/[/?#:]/u)[0] ?? '';

export const isPlausibleDomain = (value: string): boolean => DOMAIN_RE.test(value);

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** "meera.pillai@x.in" becomes "Meera Pillai". */
export const nameFromEmail = (email: string): string =>
  (email.split('@')[0] ?? '')
    .split('.')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const rowKey = (email: string): string => (email.split('@')[0] ?? '').replace(/[^a-z0-9]/giu, '');

/** Reverse lookup of a display label map: the code whose label is `label`. */
export const codeFromLabel = <T extends string>(labels: Record<T, string>, label: string): T | undefined =>
  (Object.keys(labels) as T[]).find((code) => labels[code] === label);

export const describeUserAgent = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//u.test(userAgent)
    ? 'Edge'
    : /OPR\//u.test(userAgent)
      ? 'Opera'
      : /Firefox\//u.test(userAgent)
        ? 'Firefox'
        : /Chrome\//u.test(userAgent)
          ? 'Chrome'
          : /Safari\//u.test(userAgent)
            ? 'Safari'
            : 'Browser';
  const os = /Windows/u.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad/u.test(userAgent)
      ? 'iOS'
      : /Android/u.test(userAgent)
        ? 'Android'
        : /Mac OS X/u.test(userAgent)
          ? 'macOS'
          : /Linux/u.test(userAgent)
            ? 'Linux'
            : null;
  return os ? `${browser} on ${os}` : browser;
};

/** "Today", "Yesterday" or "2 Nov". `today` comes from the server so hydration is stable. */
export const lastSeenLabel = (iso: string | null, today: string): string => {
  if (!iso) return 'Never';
  const date = iso.slice(0, 10);
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return fmtShort(date);
};

export const invitedLabel = (iso: string | null): string => (iso ? `Invited ${fmtShort(iso.slice(0, 10))}` : 'Invite pending');

/** "v1.2, accepted 12 Mar 2026". A version that does not start with a digit (the placeholder "draft-0") is shown as is. */
export const formatAgreement = (version: string | null, acceptedAt: string | null): string => {
  if (!acceptedAt) return 'Not accepted yet';
  const label = version && /^\d/u.test(version) ? `v${version}` : (version ?? 'Agreement');
  return `${label}, accepted ${fmtLong(acceptedAt.slice(0, 10))}`;
};

/** Where a person lands right after accepting an invite and signing in. */
export const landingPathFor = (kind: UserKind, role: PartnerRole | StaffRole): string => {
  if (kind === 'partner') {
    if (role === 'partner_admin') return ROUTES.partner.welcome;
    return role === 'technical' ? ROUTES.partner.documents : ROUTES.partner.overview;
  }
  return ROUTES.admin.overview;
};

/** "CleanStart India", "CleanStart India and EU", or plain "CleanStart" for every region. */
export const staffTeamLabel = (scope: StaffScope, regions?: readonly RegionDto[]): string => scopeTeamLabel(scope, regions);
