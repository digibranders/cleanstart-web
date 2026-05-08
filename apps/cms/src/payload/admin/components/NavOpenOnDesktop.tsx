'use client';

import { useNav } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

const DESKTOP_BREAKPOINT_PX = 1024;
const MANUAL_TOGGLE_GRACE_MS = 1500;

/**
 * Match the document edit / create routes:
 *   /admin/collections/<slug>/<id>
 *   /admin/collections/<slug>/create
 *   /admin/globals/<slug>
 *
 * Editors on these paths benefit from extra horizontal space — the
 * doc-edit two-column layout (form + sidebar) is tight on a 13" / 14"
 * laptop. We auto-collapse the rail there. List views (`/admin/
 * collections/<slug>` with no trailing id) keep the rail open so the
 * editor can scan adjacent collections.
 */
const isDocumentEditRoute = (pathname: string): boolean =>
  /^\/admin\/collections\/[^/]+\/[^/]+/.test(pathname) ||
  /^\/admin\/globals\/[^/]+/.test(pathname);

/**
 * Counter Payload's default nav-collapse behaviour at typical laptop
 * sizes — and auto-close the rail on document edit views to free up
 * working space for the form.
 *
 * Payload's NavProvider keys off `WindowInfo` breakpoints declared as:
 *   l = (max-width: 1440px)
 *   m = (max-width: 1024px)
 *   s = (max-width: 768px)
 *
 * The provider's useEffect closes the nav whenever ANY of those is
 * true. On a 13"–14" laptop (≤ 1440 px) `largeBreak` is true on
 * hydration, so the sidebar lands collapsed even on a regular desktop.
 *
 * Two behaviours co-exist here:
 *   1. **List / dashboard / global-listing views** at ≥ 1024 px:
 *      keep the nav open. We force `setNavOpen(true)` on mount and
 *      whenever Payload (or any other internal effect) closes it.
 *   2. **Document edit / create views** at any width: keep the nav
 *      closed. Editors can still expand it with the toggler — manual
 *      toggles are respected for a 1.5 s grace window before the
 *      auto-state re-asserts.
 *
 * Below 1024 px the drawer/overlay behaviour is left alone — tablet
 * and phone editors get the slide-in nav as Payload intends.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { navOpen, setNavOpen } = useNav();
  const pathname = usePathname() ?? '';
  const lastManualToggleAt = useRef<number>(0);

  // Track manual toggler clicks so we don't immediately fight an
  // editor who just opened or closed the nav by hand.
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

  // Per-route enforcement, deferred to the next task so it lands
  // AFTER Payload's parent-context effect (child effects fire before
  // parent effects in React, so a synchronous setNavOpen here gets
  // clobbered by Payload's setNavOpen in the same commit).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isDesktop = (): boolean =>
      window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`).matches;
    const apply = (): void => {
      if (isDocumentEditRoute(pathname)) {
        // Auto-close on edit view at any width. Editors can re-open
        // via the toggler — the manual-toggle grace window keeps that
        // intent intact for 1.5 s before this re-asserts.
        window.setTimeout(() => {
          if (
            isDocumentEditRoute(pathname) &&
            Date.now() - lastManualToggleAt.current >= MANUAL_TOGGLE_GRACE_MS
          ) {
            setNavOpen(false);
          }
        }, 0);
        return;
      }
      if (!isDesktop()) return;
      window.setTimeout(() => {
        if (!isDocumentEditRoute(pathname) && isDesktop()) {
          setNavOpen(true);
        }
      }, 0);
    };
    apply();
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pathname, setNavOpen]);

  // Reactive watcher — re-assert the auto-state if Payload (or anyone
  // else) flips `navOpen` against our policy mid-session and the
  // editor hasn't just clicked the toggler.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sinceManual = Date.now() - lastManualToggleAt.current;
    if (sinceManual < MANUAL_TOGGLE_GRACE_MS) return;
    const isDesktop = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`,
    ).matches;
    if (isDocumentEditRoute(pathname)) {
      if (navOpen) setNavOpen(false);
      return;
    }
    if (isDesktop && !navOpen) setNavOpen(true);
  }, [navOpen, pathname, setNavOpen]);

  return null;
};

export default NavOpenOnDesktop;
