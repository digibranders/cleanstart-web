'use client';

import { useNav } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

// CSS-viewport breakpoints (matchMedia, not innerWidth — innerWidth
// includes the scrollbar width, which drifts the boundary by ~15px on
// classic-scrollbar systems). WIDE = the rail is always open; RAIL = a
// docked rail (open on browse views, collapsed on editor views); below
// RAIL Payload's overlay drawer owns the nav and we don't interfere.
const WIDE_QUERY = '(min-width: 1280px)';
const RAIL_QUERY = '(min-width: 1025px)';

// Payload's NavProvider closes the rail on mount and again ~100ms later when
// it flips `shouldAnimate` through hydration. We re-assert policy across this
// window; after it elapses, navOpen changes are genuine user intent and the
// mirror effect takes over so the collapse toggle works.
const SETTLE_MS = 320;

/**
 * Editor pages are the document-edit surfaces — a collection doc
 * (`/collections/:slug/:id|create|…`) or a global edit
 * (`/globals/:slug`). Collection *list* views (`/collections/:slug`) and
 * the dashboard (`/admin`) are browse surfaces, not editors. Matched
 * without anchoring to the admin route prefix so a customised
 * `routes.admin` still resolves correctly.
 */
const isEditorPath = (path: string): boolean =>
  /\/collections\/[^/]+\/[^/]+/.test(path) || /\/globals\/[^/]+/.test(path);

/**
 * Drive the CSS layer (_sidebar-header.scss) that docks the nav grid open.
 * The visual open/collapse is owned by CSS — keyed on this attribute +
 * viewport — because Payload force-collapses the grid on every viewport
 * ≤1440 after hydration, so a JS-only re-open flashes. `null` removes the
 * attribute so the force-open CSS goes quiet and Payload's own classes own
 * the rail (used below the docked-rail threshold, where the nav is a drawer).
 */
const setDocked = (docked: boolean | null): void => {
  const root = document.documentElement;
  if (docked === null) {
    delete root.dataset.csNavDocked;
  } else {
    root.dataset.csNavDocked = docked ? 'true' : 'false';
  }
};

/**
 * Sidebar auto-collapse policy + manual-toggle bridge.
 *
 * Payload's NavProvider closes the rail whenever its `largeBreak`
 * (`max-width: 1440px`) / `midBreak` / `smallBreak` is true — on mount
 * and on every breakpoint cross. That collapses the rail on a 13"–14"
 * laptop (≤ 1440px) on *every* route, which is the behaviour we override.
 *
 * Policy (per product spec):
 *   - ≥ 1280px        → rail open on every page. Never auto-collapse.
 *   - 1025–1279px     → open on browse views (dashboard, lists); collapsed
 *                       only on editor (document-edit) views, where the
 *                       form wants the horizontal room.
 *   - ≤ 1024px        → Payload's overlay drawer owns the nav; untouched.
 *
 * Two effects cooperate:
 *   1. Policy effect (keyed on pathname) asserts the docked state on mount,
 *      on route change, and across the hydration settling window — winning
 *      the race with Payload's competing breakpoint effect with no flash.
 *   2. Mirror effect (keyed on navOpen) takes over once the settling window
 *      elapses: a manual collapse/expand from Payload's NavToggler flips
 *      `navOpen`, which we mirror into the docked attribute so the CSS layer
 *      releases its `!important` hold and the rail actually collapses.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { navOpen, setNavOpen } = useNav();
  const pathname = usePathname();
  // False until the hydration settling window for the current route elapses.
  // Gates the mirror effect so Payload's mount/hydration navOpen churn isn't
  // mistaken for user intent.
  const settledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    settledRef.current = false;
    const editor = isEditorPath(pathname ?? '');

    const wide = window.matchMedia(WIDE_QUERY);
    const rail = window.matchMedia(RAIL_QUERY);

    const apply = (): void => {
      // Below the docked-rail threshold the nav is a modal drawer — forcing
      // it open would pop the overlay, so drop the attribute and defer to
      // Payload entirely.
      if (!rail.matches) {
        setDocked(null);
        return;
      }
      const open = wide.matches ? true : !editor;
      setDocked(open);
      setNavOpen(open);
    };

    // Re-assert across the settling window so a single re-open doesn't lose
    // the race with Payload's hydration breakpoint effect. After the window,
    // `settledRef` flips true and the mirror effect owns navOpen so the
    // editor's own collapse toggle takes effect — no permanent watcher
    // fighting manual intent.
    const raf = window.requestAnimationFrame(apply);
    const settleTimers = [60, 160, SETTLE_MS].map((ms) => window.setTimeout(apply, ms));
    const settleDone = window.setTimeout(() => {
      settledRef.current = true;
    }, SETTLE_MS);

    wide.addEventListener('change', apply);
    rail.addEventListener('change', apply);
    return () => {
      window.cancelAnimationFrame(raf);
      for (const id of settleTimers) window.clearTimeout(id);
      window.clearTimeout(settleDone);
      wide.removeEventListener('change', apply);
      rail.removeEventListener('change', apply);
    };
  }, [pathname, setNavOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // During the settling window, navOpen changes are Payload's own
    // breakpoint noise — owned by the policy effect. Below the docked-rail
    // threshold the drawer owns the nav, so we never dock it.
    if (!settledRef.current) return;
    if (!window.matchMedia(RAIL_QUERY).matches) return;
    setDocked(navOpen);
  }, [navOpen]);

  return null;
};

export default NavOpenOnDesktop;
