'use client';

import { useAuth } from '@payloadcms/ui';
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
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
};

type AuthUser = {
  email?: string | null;
  name?: string | null;
};

/**
 * Replaces Payload's default avatar with a custom button-and-popover.
 * Click the avatar to open a dropdown that shows the editor's name +
 * email, an "Account" link to the standard /admin/account view, and a
 * "Sign out" action that calls Payload's `useAuth().logOut()`.
 *
 * Wired via `admin.avatar = { Component: '...UserMenu' }` so it slots
 * into the same place Payload renders its default gravatar/avatar.
 * The popover is anchored to the trigger via `position: absolute` and
 * closes on outside-click + Escape.
 */
export const UserMenu = (): ReactElement => {
  const { user, logOut } = useAuth<AuthUser>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  // Outside click + Esc closes the popover.
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
      // logOut sometimes throws on already-expired sessions; route
      // to the login screen either way.
    }
    router.push('/admin/login');
    router.refresh();
  }, [logOut, router]);

  const displayName =
    (user?.name && user.name.trim().length > 0 ? user.name : null) ??
    (user?.email ?? 'Account');
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
      </button>

      {open && (
        <div
          className="cs-user-menu__popover"
          role="menu"
          aria-label="Account menu"
        >
          <div className="cs-user-menu__identity">
            <span className="cs-user-menu__name">{displayName}</span>
            {user?.email && user.name ? (
              <span className="cs-user-menu__email">{user.email}</span>
            ) : null}
          </div>

          <div className="cs-user-menu__divider" aria-hidden="true" />

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
