import { and, eq, type SQL } from 'drizzle-orm';
import { registrations } from '@/db/schema';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError, NotFoundError } from '@/server/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A malformed id is "not found", never a database error that would tell a prober something. */
export function assertUuid(value: string, resource: string): void {
  if (!UUID.test(value)) throw new NotFoundError(resource);
}

/**
 * The registrations a viewer may read, as a SQL condition (undefined means every row). Partner admin: the company.
 * Partner sales: only deals they registered. Staff sales: their region. Partner manager: all. Everyone else: none.
 * RLS is the cross company backstop; this is the role layer on top of it.
 */
export function registrationScope(viewer: Viewer): SQL | undefined {
  if (viewer.kind === 'partner') {
    if (viewer.role === 'partner_admin') return eq(registrations.partnerId, viewer.partnerId);
    if (viewer.role === 'sales') return and(eq(registrations.partnerId, viewer.partnerId), eq(registrations.registeredBy, viewer.id));
    throw new ForbiddenError(`${viewer.role} has no deal access`);
  }
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(registrations.region, viewer.region);
  throw new ForbiddenError('marketing has no deal access');
}
