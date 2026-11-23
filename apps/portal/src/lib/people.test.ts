import { describe, expect, it } from 'vitest';
import {
  codeFromLabel,
  describeUserAgent,
  emailDomain,
  formatAgreement,
  initialsOf,
  invitedLabel,
  isFreeEmail,
  isPlausibleDomain,
  isValidEmail,
  landingPathFor,
  lastSeenLabel,
  nameFromEmail,
  normaliseDomain,
  rowKey,
  staffTeamLabel,
} from './people';

describe('email and domain helpers', () => {
  it('validates the shape of an email without rejecting free mail', () => {
    expect(isValidEmail('neha@tidewaterinfosec.in')).toBe(true);
    expect(isValidEmail(' neha@gmail.com ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('returns the lower case domain of a valid email and an empty string otherwise', () => {
    expect(emailDomain('Neha@TidewaterInfosec.IN')).toBe('tidewaterinfosec.in');
    expect(emailDomain('nope')).toBe('');
  });

  it('detects free mail with the curated client list', () => {
    expect(isFreeEmail('a@gmail.com')).toBe(true);
    expect(isFreeEmail('a@kestrelsystems.in')).toBe(false);
    expect(isFreeEmail('broken')).toBe(false);
  });

  it('normalises a website to a bare domain', () => {
    expect(normaliseDomain('https://www.Example.com/path?x=1')).toBe('example.com');
    expect(normaliseDomain('example.com:8080')).toBe('example.com');
    expect(normaliseDomain('  ')).toBe('');
  });

  it('accepts real domains and rejects junk', () => {
    expect(isPlausibleDomain('kestrelsystems.in')).toBe(true);
    expect(isPlausibleDomain('localhost')).toBe(false);
    expect(isPlausibleDomain('a b.com')).toBe(false);
  });
});

describe('display helpers', () => {
  it('builds initials, names and row keys', () => {
    expect(initialsOf('Aditi Rao')).toBe('AR');
    expect(initialsOf('  madonna ')).toBe('M');
    expect(nameFromEmail('meera.pillai@kestrelsystems.in')).toBe('Meera Pillai');
    expect(rowKey('meera.pillai@kestrelsystems.in')).toBe('meerapillai');
  });

  it('maps a display label back to its code', () => {
    const labels = { sales: 'Sales', technical: 'Technical' } as const;
    expect(codeFromLabel(labels, 'Technical')).toBe('technical');
    expect(codeFromLabel(labels, 'Nope')).toBeUndefined();
  });

  it('describes a user agent', () => {
    expect(describeUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36')).toBe('Chrome on macOS');
    expect(describeUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1')).toBe('Safari on iOS');
    expect(describeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/125.0 Chrome/125.0 Safari/537.36')).toBe('Edge on Windows');
    expect(describeUserAgent(null)).toBe('Unknown device');
  });

  it('labels last activity relative to the server date', () => {
    expect(lastSeenLabel(null, '2026-11-12')).toBe('Never');
    expect(lastSeenLabel('2026-11-12T08:00:00.000Z', '2026-11-12')).toBe('Today');
    expect(lastSeenLabel('2026-11-11T23:00:00.000Z', '2026-11-12')).toBe('Yesterday');
    expect(lastSeenLabel('2026-11-02T08:00:00.000Z', '2026-11-12')).toBe('2 Nov');
    expect(invitedLabel('2026-11-05T09:00:00.000Z')).toBe('Invited 5 Nov');
    expect(invitedLabel(null)).toBe('Invite pending');
  });

  it('formats the agreement line', () => {
    expect(formatAgreement('1.2', '2026-03-12T14:06:00.000Z')).toBe('v1.2, accepted 12 Mar 2026');
    expect(formatAgreement('draft-0', '2026-03-12T14:06:00.000Z')).toBe('draft-0, accepted 12 Mar 2026');
    expect(formatAgreement(null, null)).toBe('Not accepted yet');
  });

  it('picks the page a person lands on after accepting an invite', () => {
    expect(landingPathFor('partner', 'partner_admin')).toBe('/partner/welcome');
    expect(landingPathFor('partner', 'sales')).toBe('/partner/overview');
    expect(landingPathFor('partner', 'technical')).toBe('/partner/documents');
    expect(landingPathFor('staff', 'partner_manager')).toBe('/admin/overview');
    expect(landingPathFor('staff', 'marketing')).toBe('/admin/overview');
  });
});

describe('staffTeamLabel', () => {
  it('names the CleanStart team for a region', () => {
    expect(staffTeamLabel(['india'])).toBe('CleanStart India');
    expect(staffTeamLabel(['middle_east'])).toBe('CleanStart Middle East');
    expect(staffTeamLabel(['middle_east', 'eu'])).toBe('CleanStart Middle East and EU');
    expect(staffTeamLabel('all')).toBe('CleanStart');
  });
});
