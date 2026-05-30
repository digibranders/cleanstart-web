'use client';

import { useNav } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

// CSS-viewport breakpoints (matchMedia, not innerWidth — innerWidth
// includes the scrollbar width, which drifts the boundary by ~15px on
// classic-scrollbar systems). WIDE = the rail is always open; RAIL = a
// docked rail (open on browse views, collapsed on editor views); below
// RAIL Payload's overlay drawer owns the nav and we don't interfere.
const WIDE_QUERY = '(min-width: 1280px)';
const RAIL_QUERY = '(min-width: 1025px)';

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
 * Sidebar auto-collapse policy.
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
 * We re-assert on mount, on route change (so editor↔browse transitions
 * apply the policy), and when a breakpoint is crossed (matchMedia change).
 * `setNavOpen` is deferred to the next animation frame so it lands after
 * Payload's competing breakpoint effect in the same commit.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { setNavOpen } = useNav();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const editor = isEditorPath(pathname ?? '');

    // Drive the CSS layer (_sidebar-header.scss) that holds the nav grid
    // open. The visual open/collapse is owned by CSS — keyed on this
    // attribute + viewport — because Payload force-collapses the grid on
    // every viewport ≤1440 after hydration, so a JS-only re-open flashes.
    document.documentElement.dataset.csNavRoute = editor ? 'editor' : 'browse';

    const wide = window.matchMedia(WIDE_QUERY);
    const rail = window.matchMedia(RAIL_QUERY);

    const apply = (): void => {
      // Below the docked-rail threshold the nav is a modal drawer —
      // forcing it open would pop the overlay, so defer to Payload.
      if (!rail.matches) return;
      setNavOpen(wide.matches ? true : !editor);
    };

    // Payload's NavProvider closes the rail on mount and again ~100ms
    // later when it flips `shouldAnimate` (its breakpoint effect re-runs
    // through hydration). A single re-assert loses that race, so we
    // re-assert across a short settling window. The timers stop after
    // ~320ms, so the editor's own hamburger toggle still works once
    // things settle — no permanent watcher fighting manual intent.
    const raf = window.requestAnimationFrame(apply);
    const settleTimers = [60, 160, 320].map((ms) => window.setTimeout(apply, ms));

    wide.addEventListener('change', apply);
    rail.addEventListener('change', apply);
    return () => {
      window.cancelAnimationFrame(raf);
      for (const id of settleTimers) window.clearTimeout(id);
      wide.removeEventListener('change', apply);
      rail.removeEventListener('change', apply);
    };
  }, [pathname, setNavOpen]);

  return null;
};

export default NavOpenOnDesktop;
