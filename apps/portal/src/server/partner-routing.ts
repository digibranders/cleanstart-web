import { and, asc, eq } from 'drizzle-orm';
import { partners, users } from '@/db/schema';
import type { PartnerCategory, PartnerRegion } from '@/lib/domain';
import { isAllRegions, scopeCovers } from '@/lib/regions';
import { ConflictError, ValidationError } from '@/server/errors';
import type { Tx } from '@/server/repo/context';
import { loadScopes } from '@/server/staff-scope';

export type PartnerRow = typeof partners.$inferSelect;

/**
 * The active partner manager a new partner is routed to: one who covers `region` (several regions allowed), then one who
 * covers every region, then the oldest active partner manager. The oldest wins within each group. Null when there is none.
 */
export async function pickManagerId(tx: Tx, region: PartnerRegion): Promise<string | null> {
  const managers = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(asc(users.createdAt), asc(users.id));
  const scopes = await loadScopes(tx, managers.map((m) => m.id));
  const rank = (id: string): number => {
    const scope = scopes.get(id);
    if (!scope) return 2;
    return isAllRegions(scope) ? 1 : scopeCovers(scope, region) ? 0 : 2;
  };
  // Array.prototype.sort is stable, so the creation order from the query survives inside each rank.
  return [...managers].sort((a, b) => rank(a.id) - rank(b.id))[0]?.id ?? null;
}

/** Throws ValidationError (path "managerId") unless the user is an active partner manager. */
export async function assertActiveManager(tx: Tx, managerId: string): Promise<void> {
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, managerId), eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .limit(1);
  if (!row) throw new ValidationError([{ path: 'managerId', message: 'Choose an active partner manager.' }]);
}

export interface NewOnboardingPartner {
  name: string;
  domain: string;
  category: PartnerCategory;
  region: PartnerRegion;
  managerId: string | null;
}

/** Inserts a partner in status 'onboarding'. Throws ConflictError('domain_is_partner') when the domain is taken. */
export async function insertOnboardingPartner(tx: Tx, input: NewOnboardingPartner): Promise<PartnerRow> {
  const [created] = await tx
    .insert(partners)
    .values({
      name: input.name,
      domain: input.domain,
      category: input.category,
      region: input.region,
      managerId: input.managerId,
      status: 'onboarding',
    })
    .onConflictDoNothing({ target: partners.domain })
    .returning();
  if (!created) throw new ConflictError('domain_is_partner', 'Another partner already uses this domain.');
  return created;
}
