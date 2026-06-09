'use client';

import { useAuth, useTheme } from '@payloadcms/ui';
import type { Theme } from '@payloadcms/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';

const initialsFor = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const slice = parts[0]?.slice(0, 2) ?? '';
    return slice.length > 0 ? slice.toUpperCase() : '?';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  const initials = (first + last).toUpperCase();
  return initials.length > 0 ? initials : '?';
};

type AuthUser = {
  email?: string | null;
  name?: string | null;
};

// Payload's `setTheme` accepts 'auto' at runtime (it clears the theme
// cookie so the admin follows the OS `prefers-color-scheme`), but its
// published type narrows the argument to 'light' | 'dark'. Widen it
// here so the Auto segment type-checks without an `any`.
type ThemePreference = Theme | 'auto';

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: ReactElement;
}> = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'auto',
    label: 'Auto',
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 2.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Sidebar UserMenu — replaces both Payload's default top-right avatar
 * AND the bottom-left logout link. Mounted via
 * `admin.components.afterNavLinks` so it sits at the bottom of the
 * nav column. The whole row is a button: avatar + name + chevron.
 *
 * Click toggles a popover that opens UPWARD (since the trigger is at
 * the bottom of the sidebar) with: Account → Sign out. Closes on
 * outside-click, Escape, or item activation.
 *
 * Consolidating the user controls in one place lets us hide the empty
 * `.app-header__user-controls` slot at the top of every view, which
 * was the source of the ~50px empty band above the page content.
 */
export const UserMenu = (): ReactElement => {
  const { user, logOut } = useAuth<AuthUser>();
  const { theme, autoMode, setTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const setThemePreference = setTheme as (theme: ThemePreference) => void;
  const activePreference: ThemePreference = autoMode ? 'auto' : theme;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent): void => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const onLogout = useCallback(async (): Promise<void> => {
    setOpen(false);
    try {
      await logOut();
    } catch {
      // logOut sometimes throws on already-expired sessions — route
      // to the login screen either way.
    }
    router.push('/admin/login');
    router.refresh();
  }, [logOut, router]);

  const displayName =
    (user?.name && user.name.trim().length > 0 ? user.name : null) ??
    (user?.email ?? 'Account');
  const subline =
    user?.name && user.email && user.email !== user.name ? user.email : '';
  const initials = initialsFor(user?.name ?? user?.email ?? '');

  return (
    <div className="cs-user-menu" ref={wrapperRef}>
      <button
        type="button"
        className={
          open
            ? 'cs-user-menu__trigger cs-user-menu__trigger--open'
            : 'cs-user-menu__trigger'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cs-user-menu__avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="cs-user-menu__identity">
          <span className="cs-user-menu__name" title={displayName}>
            {displayName}
          </span>
          {subline && (
            <span className="cs-user-menu__email" title={subline}>
              {subline}
            </span>
          )}
        </span>
        <svg
          className="cs-user-menu__chevron"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="cs-user-menu__popover"
          role="menu"
          aria-label="Account menu"
        >
          <Link
            href="/admin/account"
            className="cs-user-menu__item"
            role="menuitem"
            onClick={close}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M2.5 14c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span>Account</span>
          </Link>

          <div className="cs-user-menu__divider" aria-hidden="true" />

          <fieldset className="cs-user-menu__theme">
            <legend className="cs-user-menu__theme-label">Theme</legend>
            <div className="cs-user-menu__segmented">
              {THEME_OPTIONS.map((option) => {
                const isActive = activePreference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      isActive
                        ? 'cs-user-menu__seg cs-user-menu__seg--active'
                        : 'cs-user-menu__seg'
                    }
                    aria-pressed={isActive}
                    onClick={() => setThemePreference(option.value)}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="cs-user-menu__divider" aria-hidden="true" />

          <button
            type="button"
            className="cs-user-menu__item cs-user-menu__item--destructive"
            role="menuitem"
            onClick={() => void onLogout()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M9 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 5l3 3-3 3M14 8H7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
