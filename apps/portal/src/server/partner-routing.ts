import { and, asc, eq, sql } from 'drizzle-orm';
import { partners, staffScopes, users } from '@/db/schema';
import type { PartnerCategory, PartnerRegion } from '@/lib/domain';
import { ConflictError, ValidationError } from '@/server/errors';
import type { Tx } from '@/server/repo/context';

export type PartnerRow = typeof partners.$inferSelect;

/**
 * The active partner manager a new partner is routed to: the one whose staff scope is `region`, then one whose scope
 * is 'all', then the oldest active partner manager. Null when there is none.
 */
export async function pickManagerId(tx: Tx, region: PartnerRegion): Promise<string | null> {
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(
      sql`case when ${staffScopes.region} = ${region} then 0 when ${staffScopes.region} = 'all' then 1 else 2 end`,
      asc(users.createdAt),
    )
    .limit(1);
  return row?.id ?? null;
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
