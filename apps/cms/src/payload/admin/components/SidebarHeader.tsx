'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';

import { Logo } from '../Logo';

/**
 * Sidebar header — anchors the nav with the actual CleanStart logo and an
 * always-visible "Dashboard" link. Wired via `admin.components.beforeNavLinks`
 * so it renders below Payload's default top header (which already shows the
 * Icon graphic) and above the first nav group.
 *
 * Both the wordmark and the dashboard row route to `/admin`. The dashboard
 * row carries the same `--active` chrome as collection links when the user
 * is on the dashboard view.
 */
export const SidebarHeader = (): ReactElement => {
  const pathname = usePathname() ?? '';
  const isDashboard = pathname === '/admin' || pathname === '/admin/';

  return (
    <div className="cs-sidebar-header" data-cs-sidebar-header>
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
