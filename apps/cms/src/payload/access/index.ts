import type { Access, FieldAccess } from 'payload';

import { hasAnyRole, hasRole, userId } from './typed-user';

export { hasAnyRole, hasRole, userId, userRoles } from './typed-user';
export type { Role } from './typed-user';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin');

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin');

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor']);

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (hasRole(user, 'admin')) return true;
  const id = userId(user);
  if (id == null) return false;
  return { id: { equals: id } };
};
