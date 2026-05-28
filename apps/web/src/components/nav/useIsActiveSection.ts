'use client';

import { usePathname } from 'next/navigation';

/**
 * Returns true when the current pathname matches any of the supplied hrefs
 * exactly, or is a sub-route of one of them.
 *
 * Used by DesktopNav triggers to render the active-state styling when the
 * user is on a page that belongs to that section (e.g. Products trigger
 * stays active on /cleansight, /cleanstart-images, /software-bill-materials).
 *
 * The root href "/" is ignored on purpose — it would match everything.
 */
export function useIsActiveSection(hrefs: readonly string[]): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  return hrefs.some((href) => {
    if (href === '/' || href === '') return false;
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  });
}
