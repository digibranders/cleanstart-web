import { eq } from 'drizzle-orm';
import { partners } from '@/db/schema';
import type { PartnerRegion } from '@/lib/domain';
import { isPlausibleDomain, normaliseDomain } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface PartnerIdentity {
  name: string;
  domain: string;
  region: PartnerRegion;
}

export interface IdentityChange {
  partnerId: string;
  before: PartnerIdentity;
  after: PartnerIdentity;
}

const domainTaken = (): ConflictError => new ConflictError('domain_is_partner', 'Another partner already uses this domain.');

/**
 * Partner manager. Renames the company, changes its sign-in domain or its region; omitted fields stay as they are.
 * The caller audits each field that differs between `before` and `after`. Changing the region does not move any
 * registration, and nothing here touches HubSpot. Throws ValidationError for an empty name or an implausible domain
 * and ConflictError('domain_is_partner') when another company already owns the domain.
 */
export async function updatePartnerIdentity(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; name?: string | undefined; domain?: string | undefined; region?: PartnerRegion | undefined },
): Promise<IdentityChange> {
  assertStaff(viewer);
  const name = input.name?.trim();
  const domain = input.domain === undefined ? undefined : normaliseDomain(input.domain);
  const issues = [
    ...(name === '' ? [{ path: 'name', message: 'Enter the company name.' }] : []),
    ...(domain !== undefined && !isPlausibleDomain(domain) ? [{ path: 'domain', message: 'Enter a domain such as example.com.' }] : []),
  ];
  if (issues.length > 0) throw new ValidationError(issues);

  const [current] = await tx.select().from(partners).where(eq(partners.id, input.id)).limit(1).for('update');
  if (!current) throw new NotFoundError('partner');
  const before: PartnerIdentity = { name: current.name, domain: current.domain, region: current.region };
  const after: PartnerIdentity = { name: name ?? before.name, domain: domain ?? before.domain, region: input.region ?? before.region };

  if (after.domain !== before.domain) {
    const [taken] = await tx.select({ id: partners.id }).from(partners).where(eq(partners.domain, after.domain)).limit(1);
    if (taken) throw domainTaken();
  }
  if (after.name !== before.name || after.domain !== before.domain || after.region !== before.region) {
    await tx.update(partners).set(after).where(eq(partners.id, current.id));
  }
  return { partnerId: current.id, before, after };
}

const fns = { updatePartnerIdentity };

export const isolation = defineIsolation<keyof typeof fns>({
  updatePartnerIdentity: {
    scope: 'staff-only',
    probe: (tx, viewer, ctx) => updatePartnerIdentity(tx, viewer, { id: ctx.b.partnerId, name: 'Probe rename' }),
    expect: 'forbidden',
  },
});
