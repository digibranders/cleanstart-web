import type { User } from '../../payload-types';

/**
 * Single source of truth for "what role does this request user have?"
 * Replaces the ad-hoc `(user as { roles?: string[] } | null | undefined)`
 * cast that was duplicated across access functions, the Users collection
 * panel-access guard, and the CSV export endpoint.
 *
 * Returns the empty array for unauthenticated requests so callers can
 * write `roles.includes('admin')` without null guards.
 */
export type Role = User['roles'][number];

const isUserShape = (value: unknown): value is { roles?: User['roles'] | null } =>
  typeof value === 'object' && value !== null;

export const userRoles = (user: unknown): Role[] => {
  if (!isUserShape(user)) return [];
  const roles = user.roles;
  return Array.isArray(roles) ? (roles as Role[]) : [];
};

export const hasRole = (user: unknown, role: Role): boolean => userRoles(user).includes(role);

export const hasAnyRole = (user: unknown, roles: readonly Role[]): boolean => {
  const ours = userRoles(user);
  return roles.some((r) => ours.includes(r));
};
