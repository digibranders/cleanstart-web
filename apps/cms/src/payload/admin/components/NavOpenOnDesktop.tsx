'use client';

import { useNav } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

const DESKTOP_BREAKPOINT_PX = 1024;

/**
 * Counter Payload's default nav-collapse behaviour at typical laptop
 * sizes.
 *
 * Payload's NavProvider keys off `WindowInfo` breakpoints declared as:
 *   l = (max-width: 1440px)
 *   m = (max-width: 1024px)
 *   s = (max-width: 768px)
 *
 * The provider's useEffect closes the nav whenever ANY of those is
 * true. On a 13" / 14" laptop (≤ 1440 px) `largeBreak` is true on
 * hydration, so the sidebar lands closed even though the viewport is
 * a regular desktop. Our editor flow assumes the nav is open down to
 * a comfortable 1024 px floor (where the doc-edit two-column layout
 * still has breathing room), so we re-open it ourselves whenever the
 * viewport is at least that wide.
 *
 * Below 1024 px we let Payload's drawer/overlay behaviour stand —
 * tablet / phone editors get the slide-in nav.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { setNavOpen } = useNav();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const sync = (): void => {
      if (mq.matches) setNavOpen(true);
    };
    // Initial pass. Payload's own breakpoint effect runs on hydration
    // and sets `navOpen=false`; our microtask runs after, flipping it
    // back open before the next render commits.
    sync();
    const onChange = (): void => sync();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setNavOpen]);

  return null;
};

export default NavOpenOnDesktop;
