import type { Access, FieldAccess } from 'payload';

import { hasAnyRole, hasRole, userId } from './typed-user';

export { hasAnyRole, hasRole, userId, userRoles } from './typed-user';
export type { Role } from './typed-user';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin');

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin');

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor']);

/**
 * Schema/SEO write access: admin or the dedicated `seo` operator. Used for the
 * raw `seo.additionalSchema` override and the pageRegistry, so the SEO team can
 * self-serve structured data without full admin. Editors are intentionally NOT
 * granted raw-override write on content docs (privileged paste).
 */
export const isAdminOrSeo: Access = ({ req: { user } }) => hasAnyRole(user, ['admin', 'seo']);

export const isAdminOrSeoFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'seo']);

/** pageRegistry writers: content editors plus admin/seo. */
export const isAdminEditorOrSeo: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor', 'seo']);

/**
 * HR-domain write access: admin/editor plus the departmental `hr` role. Wired
 * into the jobs/careers collections so HR can self-serve job postings and
 * applicant records without touching general site content, and into
 * `emailSignatures` — the signature roster is the staff roster, so the same
 * onboarding/offboarding that HR already owns is the only thing that changes
 * it. `signatureTemplates` and `emailAssets` deliberately stay admin-only:
 * those are shared raw markup and binary assets, not per-person data.
 *
 * Editors retain access (they manage all content); `hr` is additive on this
 * domain only — every other collection stays on `isAdminOrEditor`, which
 * excludes `hr`.
 */
export const isAdminEditorOrHr: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor', 'hr']);

/**
 * Events-domain write access: admin/editor plus the departmental `events` role.
 * Wired into the events/webinars/podcasts collections. Same shape as
 * `isAdminEditorOrHr` — scoped, additive, and isolated to this domain.
 */
export const isAdminEditorOrEvents: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor', 'events']);

/**
 * Legal-domain write access: admin/editor plus the departmental `legal` role.
 * Wired into `legalDocuments` only — legal owns the policy documents outright
 * and nothing else. Same shape as `isAdminEditorOrEvents`: scoped, additive,
 * and isolated to this domain.
 */
export const isAdminEditorOrLegal: Access = ({ req: { user } }) =>
  hasAnyRole(user, ['admin', 'editor', 'legal']);

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
