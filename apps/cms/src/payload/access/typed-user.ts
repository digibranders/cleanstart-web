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

/**
 * Returns the numeric ID of the authenticated user, or null when the user is
 * unauthenticated or their ID cannot be resolved to a finite integer.
 */
export const userId = (user: unknown): number | null => {
  if (!isUserShape(user)) return null;
  const id = (user as { id?: unknown }).id;
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  if (typeof id === 'string') {
    const parsed = Number.parseInt(id, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
