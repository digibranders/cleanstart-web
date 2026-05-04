import type { Access, FieldAccess } from 'payload';

import type { Role } from '@cleanstart/types';

type RoledUser = { roles?: Role[] | null } | null | undefined;

const hasRole = (user: RoledUser, role: Role): boolean =>
  Boolean(user?.roles?.includes(role));

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => hasRole(user as RoledUser, 'admin');

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user as RoledUser, 'admin');

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  const u = user as RoledUser;
  return hasRole(u, 'admin') || hasRole(u, 'editor');
};

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  const u = user as RoledUser;
  if (!u) return false;
  if (hasRole(u, 'admin')) return true;
  return { id: { equals: (user as { id: string | number }).id } };
};
