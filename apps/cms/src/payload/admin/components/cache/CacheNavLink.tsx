'use client';

import { useAuth } from '@payloadcms/ui';
import type { ReactElement } from 'react';

const isAdmin = (user: unknown): boolean =>
  Array.isArray((user as { roles?: unknown })?.roles) &&
  (user as { roles: string[] }).roles.includes('admin');

/** Sidebar link to /admin/cache — rendered only for admins. */
export const CacheNavLink = (): ReactElement | null => {
  const { user } = useAuth();
  if (!isAdmin(user)) return null;
  return (
    <a className="cs-nav-link" href="/admin/cache">
      Cache
    </a>
  );
};

export default CacheNavLink;
