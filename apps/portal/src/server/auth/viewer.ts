import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/db/client';
import { partners, staffScopes, users } from '@/db/schema';
import { isOneOf, PARTNER_ROLES, STAFF_ROLES, type UserKind } from '@/lib/domain';
import { PATH_HEADER, safeNext } from '@/lib/next-path';
import { ROUTES } from '@/lib/routes';
import { UnauthenticatedError } from '@/server/errors';
import { log } from '@/server/log';
import { getAuth } from './auth';
import { type Action, can, type PolicySubject } from './policies';
import type { Viewer } from './types';

/**
 * Builds the viewer for a user id from the database, never from the session payload, so a role change, a removal
 * or a suspension takes effect on the next request. Null for a user who is not active, a suspended partner and
 * any row that breaks the users table invariants.
 */
export async function loadViewer(userId: string): Promise<Viewer | null> {
  const [row] = await db
    .select({
      user: users,
      partnerName: partners.name,
      partnerStatus: partners.status,
      staffRegion: staffScopes.region,
    })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.user.status !== 'active') return null;

  const { user } = row;
  const base = { id: user.id, email: user.email, name: user.name };
  if (user.kind === 'partner') {
    if (!user.partnerId || row.partnerName === null || !isOneOf(PARTNER_ROLES, user.role)) {
      log.error({ userId }, 'partner user row breaks the users table invariants');
      return null;
    }
    if (row.partnerStatus === 'suspended') return null;
    return { ...base, kind: 'partner', role: user.role, partnerId: user.partnerId, partnerName: row.partnerName };
  }
  if (!isOneOf(STAFF_ROLES, user.role) || row.staffRegion === null) {
    log.error({ userId }, 'staff user row has no valid role or staff_scopes row');
    return null;
  }
  return { ...base, kind: 'staff', role: user.role, partnerId: null, partnerName: null, region: row.staffRegion };
}

/** The viewer for the session cookie in `requestHeaders`, or null. Testable without a Next request scope. */
export async function viewerFromHeaders(requestHeaders: Headers): Promise<Viewer | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session ? loadViewer(session.user.id) : null;
}

/** The signed-in viewer for this request, or null. Cached per request, so layouts and pages share one lookup. */
export const getViewer = cache(async (): Promise<Viewer | null> => viewerFromHeaders(await headers()));

/** Where a viewer lands after sign in and when bounced. Every home is a page that viewer's role may open. */
export function homeFor(viewer: Viewer): string {
  if (viewer.kind === 'partner') return viewer.role === 'technical' ? ROUTES.partner.documents : ROUTES.partner.overview;
  return viewer.role === 'marketing' ? ROUTES.admin.documents : ROUTES.admin.approvals;
}

async function signInUrl(): Promise<string> {
  const next = safeNext((await headers()).get(PATH_HEADER));
  return next ? `${ROUTES.signIn}?next=${encodeURIComponent(next)}` : ROUTES.signIn;
}

/** Pages. No session: redirect to /sign-in?next=<path>. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(await signInUrl());
  return viewer;
}

/** Pages and layouts. The wrong kind of viewer goes to its own home, so a partner on /admin lands on /partner/overview. */
export async function requireKind(kind: UserKind): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.kind !== kind) redirect(homeFor(viewer));
  return viewer;
}

/** Pages. requireViewer plus can(); a viewer who may not is redirected to their home. */
export async function requireCan(action: Action, subject?: PolicySubject): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!can(viewer, action, subject)) redirect(`${homeFor(viewer)}?denied=1`);
  return viewer;
}

/** Server actions. Throws UnauthenticatedError instead of redirecting. */
export async function requireActionViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthenticatedError();
  return viewer;
}
