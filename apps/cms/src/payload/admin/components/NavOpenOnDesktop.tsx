'use client';

import { useNav } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

const DESKTOP_BREAKPOINT_PX = 1024;
const MANUAL_TOGGLE_GRACE_MS = 1500;

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
 * true. On a 13"–14" laptop (≤ 1440 px) `largeBreak` is true on
 * hydration, so the sidebar lands collapsed even though the viewport
 * is plainly desktop. Our editor flow assumes the rail stays open
 * down to a comfortable 1024 px floor (where the doc-edit two-column
 * layout still has breathing room), so we re-open it ourselves
 * whenever the viewport is at least that wide.
 *
 * Two enforcement points:
 *  1. On mount + resize across the 1024 px threshold, deferred via
 *     setTimeout(0) so we run AFTER Payload's parent-context effect
 *     (child effects fire before parent effects in React, which means
 *     a synchronous setNavOpen(true) here gets clobbered by Payload's
 *     setNavOpen(false) immediately after).
 *  2. A reactive watcher on `navOpen` — if the state flips to false
 *     while we're on desktop and the user has NOT just clicked the
 *     toggler, re-open. The toggler-click grace window
 *     (MANUAL_TOGGLE_GRACE_MS) lets editors collapse the nav by hand
 *     without our component immediately fighting them.
 *
 * Below 1024 px the drawer/overlay behaviour is left alone — tablet
 * and phone editors get the slide-in nav as Payload intends.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { navOpen, setNavOpen } = useNav();
  const lastManualToggleAt = useRef<number>(0);

  // Track manual toggler clicks so we don't immediately fight an
  // editor who just collapsed the nav on purpose.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.template-default__nav-toggler-wrapper')) {
        lastManualToggleAt.current = Date.now();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Initial pass + resize across the threshold. Deferred so Payload's
  // own breakpoint effect has run first.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const sync = (): void => {
      if (!mq.matches) return;
      window.setTimeout(() => {
        if (mq.matches) setNavOpen(true);
      }, 0);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [setNavOpen]);

  // Reactive watcher: if `navOpen` goes false on desktop and the
  // editor didn't just click the toggler, re-open. Guards against any
  // path-change / route-effect inside Payload that would otherwise
  // close the rail mid-session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (navOpen) return;
    const sinceManual = Date.now() - lastManualToggleAt.current;
    if (sinceManual < MANUAL_TOGGLE_GRACE_MS) return;
    const isDesktop = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`,
    ).matches;
    if (isDesktop) setNavOpen(true);
  }, [navOpen, setNavOpen]);

  return null;
};

export default NavOpenOnDesktop;
