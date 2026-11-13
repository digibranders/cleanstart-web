import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, PARTNER_NAV, ROUTES } from '@/lib/routes';
import { buildPageHits } from './search-pages';

describe('buildPageHits', () => {
  it('lists the whole sidebar for an empty query, and the account page for partners only', () => {
    const partner = buildPageHits(PARTNER_NAV, 'partner', '');
    expect(partner.map((p) => p.label)).toEqual([...PARTNER_NAV.map((n) => n.label), 'Your account']);
    expect(partner.at(-1)?.href).toBe(ROUTES.partner.account);
    expect(buildPageHits(ADMIN_NAV, 'admin', '').map((p) => p.label)).toEqual(ADMIN_NAV.map((n) => n.label));
  });

  it('filters by label without caring about case', () => {
    expect(buildPageHits(ADMIN_NAV, 'admin', 'AUD').map((p) => p.label)).toEqual(['Audit log']);
    expect(buildPageHits(PARTNER_NAV, 'partner', 'zzz')).toEqual([]);
  });

  it('only offers pages from the nav it was given', () => {
    const technical = PARTNER_NAV.filter((n) => n.href === ROUTES.partner.documents);
    expect(buildPageHits(technical, 'partner', 'deals')).toEqual([]);
  });

  it('caps the group', () => {
    expect(buildPageHits(PARTNER_NAV, 'partner', '', 2)).toHaveLength(2);
  });
});
