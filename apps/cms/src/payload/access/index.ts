import type { Access, FieldAccess } from 'payload';

import { hasAnyRole, hasRole, userId } from './typed-user';

export { hasAnyRole, hasRole, userId, userRoles } from './typed-user';
export type { Role } from './typed-user';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin');

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin');

/**
 * Field-level read for any authenticated principal — including the role-less
 * `preview-bot` API-key user the web build/ISR uses. Lets the authenticated
 * server-side fetch receive `seo.additionalSchema` (so editor schema overrides
 * compose into the live page) while anonymous public reads never see it.
 */
export const isAuthenticatedFieldLevel: FieldAccess = ({ req: { user } }) => Boolean(user);

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor']);

/**
 * Public read access for draft-enabled content collections.
 *
 * Authenticated requests (admin/editor/author sessions AND the read-only
 * `preview-bot` API-key user the web app sends for draft preview) see every
 * version, including drafts. Anonymous requests are constrained to published
 * docs via a `Where` filter — so an unauthenticated `?draft=true` /
 * `?where[_status][equals]=draft` query can never surface unpublished content.
 *
 * Returning `true` (rather than a role check) for any logged-in user preserves
 * the prior authenticated behaviour exactly; the only change is that anonymous
 * reads are now scoped to published. Write access stays governed separately by
 * `isAdminOrEditor`, so a role-less preview-bot can read drafts but not mutate.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true;
  return { _status: { equals: 'published' } };
};

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (hasRole(user, 'admin')) return true;
  const id = userId(user);
  if (id == null) return false;
  return { id: { equals: id } };
};
