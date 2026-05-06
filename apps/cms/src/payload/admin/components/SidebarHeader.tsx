'use client';

import { NavToggler } from '@payloadcms/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import { Logo } from '../Logo';

// Detect Mac so we render the right shortcut glyph in the search hint.
const useIsMac = (): boolean => {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const platform =
      ((navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ?? navigator.platform ?? '').toLowerCase();
    setIsMac(platform.includes('mac'));
  }, []);
  return isMac;
};

/**
 * Sidebar header — anchors the nav as one integrated block:
 *
 *   ┌──────────────────────────────────────┐
 *   │ [<]   CleanStart   [CMS]             │  ← brand row + toggler
 *   │  ▸ Dashboard                         │  ← dashboard nav row
 *   └──────────────────────────────────────┘
 *
 * The collapse toggler is the same `NavToggler` Payload exports for its
 * Default template — embedding it here drives the same NavContext, so
 * the collapsed/expanded sidebar state still works for keyboard users
 * and the mobile breakpoint. Payload's outer toggler-wrapper is hidden
 * via CSS (`_sidebar-header.scss`) so we render only one.
 */
export const SidebarHeader = (): ReactElement => {
  const pathname = usePathname() ?? '';
  const isDashboard = pathname === '/admin' || pathname === '/admin/';
  const isMac = useIsMac();

  // Open the Cmd+K palette on click. CommandPalette listens for the
  // `cs-cmdk:open` event on the document so we don't need a shared
  // store or an explicit handle to its setOpen.
  const onSearchClick = useCallback(() => {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent('cs-cmdk:open'));
  }, []);

  return (
    <div className="cs-sidebar-header" data-cs-sidebar-header>
      <div className="cs-sidebar-header__brand-row">
        <NavToggler className="cs-sidebar-header__toggle">
          <span className="cs-sidebar-header__toggle-glyph" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="cs-sr-only">Toggle sidebar</span>
        </NavToggler>

        <Link
          href="/admin"
          className="cs-sidebar-header__brand"
          aria-label="CleanStart CMS — go to dashboard"
        >
          <span className="cs-sidebar-header__logo">
            <Logo />
          </span>
          <span className="cs-sidebar-header__eyebrow" aria-hidden="true">
            CMS
          </span>
        </Link>
      </div>

      <button
        type="button"
        className="cs-sidebar-search"
        onClick={onSearchClick}
        aria-label="Open command palette"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M11 11l3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="cs-sidebar-search__label">Search…</span>
        <span className="cs-sidebar-search__kbd" aria-hidden="true">
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <Link
        href="/admin"
        className={
          isDashboard
            ? 'cs-sidebar-dashboard cs-sidebar-dashboard--active'
            : 'cs-sidebar-dashboard'
        }
        aria-current={isDashboard ? 'page' : undefined}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 8.5L8 3l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 15v-4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span>Dashboard</span>
      </Link>
    </div>
  );
};

export default SidebarHeader;
