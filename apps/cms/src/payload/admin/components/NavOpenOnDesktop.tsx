'use client';

import { useNav } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

const DESKTOP_BREAKPOINT_PX = 1024;
const STORAGE_KEY = 'cs-nav-collapsed';

/**
 * Keep Payload's nav rail persistent on desktop, with the editor's
 * collapse preference stored in localStorage.
 *
 * Why this component exists at all:
 *   Payload's NavProvider keys off `WindowInfo` breakpoints declared as
 *   `l = (max-width: 1440px)`, `m = 1024px`, `s = 768px`. Its useEffect
 *   closes the nav whenever any of those is true — so on a 13"-14"
 *   laptop (≤ 1440 px) `largeBreak` is true on hydration and the rail
 *   lands collapsed even on a regular desktop. We fight back exactly
 *   once on first mount per session.
 *
 * What it does NOT do (deliberate, see git history pre-Phase-4):
 *   - No per-route auto-collapse on document-edit views. Surprising
 *     state changes on navigation are an anti-pattern; Notion / Linear
 *     / GitHub / Sanity / Strapi all keep their navs persistent at
 *     desktop widths. The body-editor Fullscreen toggle already exists
 *     for the genuine "I need every pixel" case, user-controlled and
 *     explicit.
 *   - No setTimeout-based race with Payload's effects. We set the nav
 *     state once on mount, then write through the editor's own
 *     hamburger toggles to localStorage. No effect-ordering hacks.
 *   - No reactive `navOpen` watcher that re-asserts policy. One source
 *     of truth: the editor.
 *
 * Below 1024 px Payload's drawer/overlay behaviour is preserved as-is.
 *
 * Mounted globally via `admin.components.actions`. Renders nothing.
 */
export const NavOpenOnDesktop = (): ReactElement | null => {
  const { setNavOpen } = useNav();
  const initialised = useRef(false);

  // 1) On first mount, decide the rail's starting state from the
  //    editor's saved preference (or default to "open at desktop").
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    if (typeof window === 'undefined') return;

    const isDesktop = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`,
    ).matches;
    if (!isDesktop) return; // Below 1024 — Payload's drawer wins.

    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / blocked storage — fall through to default.
    }

    // saved === 'true' means "editor manually collapsed it"; honour
    // that. Anything else (null, 'false') means "default open".
    if (saved !== 'true') {
      setNavOpen(true);
    }
  }, [setNavOpen]);

  // 2) Persist the editor's manual toggle clicks. Capture-phase listener
  //    so we record the user's intent regardless of which descendant
  //    inside the toggler wrapper actually receives the click.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.template-default__nav-toggler-wrapper')) return;

      // Defer reading the new state to the next tick — Payload's own
      // click handler flips `navOpen` synchronously, but the DOM
      // attribute we read from (`aria-expanded`) updates after the
      // commit. Reading it on the next microtask gives us the truth.
      window.queueMicrotask(() => {
        // Payload sets `nav--collapsed` on `<aside class="nav">` when
        // collapsed. Mirror that to localStorage so the next page load
        // — or the next browser session — restores the editor's pick.
        const aside = document.querySelector('aside.nav');
        const collapsed = aside?.classList.contains('nav--collapsed') ?? false;
        try {
          window.localStorage.setItem(STORAGE_KEY, String(collapsed));
        } catch {
          // Storage blocked — preference becomes session-only.
        }
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
};

export default NavOpenOnDesktop;
