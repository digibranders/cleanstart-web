import type { CollectionConfig, GlobalConfig } from 'payload';

import { userRoles } from '../access/typed-user';
import type { Role } from '../access/typed-user';

/**
 * Departmental roles get a *restricted* admin nav: a user whose only roles are
 * departmental sees exactly the collections in their domain and nothing else.
 * Any user who also holds a general role (admin/editor/author/seo) keeps the
 * full nav. Every non-departmental role behaves exactly as before.
 *
 * This is a nav-visibility concern only — the security boundary is the per-
 * collection `access` block, which already denies writes on out-of-domain
 * collections to these roles (they stay on `isAdminOrEditor`).
 */
export const CAREERS_COLLECTION_SLUGS = [
  'jobs',
  'career-applications',
  'resumes',
  'departments',
  'jobLocations',
] as const;

export const EVENTS_COLLECTION_SLUGS = [
  'events',
  'webinars',
  'webinarTypes',
  'podcastEpisodes',
] as const;

/** Departmental role → the collection slugs that role is scoped to see. */
const SCOPED_ROLE_COLLECTIONS = {
  hr: CAREERS_COLLECTION_SLUGS,
  events: EVENTS_COLLECTION_SLUGS,
} as const satisfies Record<string, readonly string[]>;

type ScopedRole = keyof typeof SCOPED_ROLE_COLLECTIONS;

const SCOPED_ROLES = Object.keys(SCOPED_ROLE_COLLECTIONS) as ScopedRole[];

const isScopedRole = (role: Role): role is ScopedRole =>
  (SCOPED_ROLES as readonly string[]).includes(role);

/**
 * A "scoped-only" user holds at least one departmental role and no general
 * (admin/editor/author/seo) role. These are the users whose nav is restricted.
 * Everyone else — role-less/unauthenticated requests and anyone with a general
 * role — keeps the full nav and is left untouched.
 *
 * Exported for the global wrapper: globals never belong to a departmental
 * domain, so a scoped-only user should not see any of them.
 */
export const isScopedOnlyUser = (user: unknown): boolean => {
  const roles = userRoles(user);
  if (roles.length === 0) return false;

  const scopedRoles = roles.filter(isScopedRole);
  const hasGeneralRole = roles.length > scopedRoles.length;
  return !hasGeneralRole && scopedRoles.length > 0;
};

/**
 * The union of collection slugs a scoped-only user may see, or `null` when the
 * user is not scoped-only (full nav / full dashboard). Consumed by the custom
 * Dashboard to restrict which collections it queries, counts, and links to, so
 * a departmental user never sees cross-domain content or dead create links.
 */
export const scopedCollectionSlugsForUser = (user: unknown): readonly string[] | null => {
  if (!isScopedOnlyUser(user)) return null;

  const scopedRoles = userRoles(user).filter(isScopedRole);
  const slugs = new Set<string>();
  for (const role of scopedRoles) {
    for (const slug of SCOPED_ROLE_COLLECTIONS[role]) slugs.add(slug);
  }
  return [...slugs];
};

/**
 * Decides whether `slug` should be hidden from the admin nav for `user`.
 * Exported for unit testing; `wireScopedNav` is the config-facing wrapper.
 *
 * Returns `false` (visible) for:
 *   - unauthenticated / role-less requests (leave the default behaviour),
 *   - any user holding at least one general (non-departmental) role.
 * For a departmental-only user, the collection is visible iff it belongs to
 * one of that user's scoped domains.
 */
export const isHiddenForScopedNav = (slug: string, user: unknown): boolean => {
  if (!isScopedOnlyUser(user)) return false;

  const scopedRoles = userRoles(user).filter(isScopedRole);
  const visible = scopedRoles.some((role) =>
    (SCOPED_ROLE_COLLECTIONS[role] as readonly string[]).includes(slug),
  );
  return !visible;
};

type HiddenOption = NonNullable<NonNullable<CollectionConfig['admin']>['hidden']>;
type HiddenFn = Extract<HiddenOption, (args: never) => boolean>;

/**
 * Composes a role-aware `admin.hidden` onto a collection, preserving any
 * existing `hidden` (a statically-hidden collection stays hidden for everyone).
 * Mirrors the shape of `wireExportButton` / `wireCustomListView`.
 */
export const wireScopedNav = (collection: CollectionConfig): CollectionConfig => {
  const existingHidden = collection.admin?.hidden;

  const hidden: HiddenFn = (args) => {
    if (existingHidden === true) return true;
    if (typeof existingHidden === 'function' && existingHidden(args)) return true;
    return isHiddenForScopedNav(collection.slug, (args as { user?: unknown }).user);
  };

  return {
    ...collection,
    admin: { ...collection.admin, hidden },
  };
};

type GlobalHiddenOption = NonNullable<NonNullable<GlobalConfig['admin']>['hidden']>;
type GlobalHiddenFn = Extract<GlobalHiddenOption, (args: never) => boolean>;

/**
 * Globals are never part of a departmental domain, so a scoped-only user must
 * not see any of them — in the nav or on the Dashboard, both of which honour
 * `admin.hidden`. Any existing `hidden` is preserved.
 */
export const wireScopedNavGlobal = (global: GlobalConfig): GlobalConfig => {
  const existingHidden = global.admin?.hidden;

  const hidden: GlobalHiddenFn = (args) => {
    if (existingHidden === true) return true;
    if (typeof existingHidden === 'function' && existingHidden(args)) return true;
    return isScopedOnlyUser((args as { user?: unknown }).user);
  };

  return {
    ...global,
    admin: { ...global.admin, hidden },
  };
};
