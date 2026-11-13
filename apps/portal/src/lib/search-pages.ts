import type { IconName } from '@/components/icon-paths';
import { type NavItem, type PortalKind, ROUTES } from '@/lib/routes';

/** Shorter queries return nothing: one letter matches half the database and costs a query. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_Q_MAX = 80;

export interface PageHit {
  label: string;
  href: string;
  icon: IconName;
}

/** Partners reach their account from the profile menu, not the sidebar, so it is added to the Pages group. */
const ACCOUNT_PAGE: PageHit = { label: 'Your account', href: ROUTES.partner.account, icon: 'team' };

/**
 * The "Pages" group of the palette. Static: it is the viewer's own sidebar plus the account page, so it can never
 * list a screen the viewer cannot open. With no query it shows every page; with one it filters by label.
 */
export function buildPageHits(nav: readonly NavItem[], kind: PortalKind, q: string, limit = 8): PageHit[] {
  const pages: PageHit[] = nav.map((item) => ({ label: item.label, href: item.href, icon: item.icon }));
  if (kind === 'partner') pages.push(ACCOUNT_PAGE);
  const needle = q.trim().toLowerCase();
  return pages.filter((page) => !needle || page.label.toLowerCase().includes(needle)).slice(0, limit);
}
