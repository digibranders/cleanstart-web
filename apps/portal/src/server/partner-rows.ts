import { and, asc, eq, ilike, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { logoUrlOf } from '@/lib/company-profile';
import { applications, invites, partners, registrations, users } from '@/db/schema';
import type { PartnerCategory, PartnerRegion, PartnerStatus, StaffRegion } from '@/lib/domain';
import type { PartnerListRow } from '@/lib/dto';
import { nameFromEmail } from '@/lib/people';
import { iso, likePattern } from '@/server/people';
import type { Tx } from '@/server/repo/context';

export interface PartnerRowFilter {
  ids?: readonly string[];
  q?: string;
  status?: PartnerStatus;
  category?: PartnerCategory;
  region?: PartnerRegion;
  /** Staff sales see only partners in their region. 'all' or undefined means no limit. */
  scopeRegion?: StaffRegion;
}

const group = <T>(items: readonly T[], key: (item: T) => string | null): Map<string, T[]> => {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === null) continue;
    out.set(k, [...(out.get(k) ?? []), item]);
  }
  return out;
};

/**
 * The rows behind the Partners table and the detail card: one query per concern, merged here, so the counts match what
 * a person sees on the Team and Deals screens. Staff only data (applications) is read, so call it from staff paths.
 */
export async function partnerListRows(tx: Tx, filter: PartnerRowFilter): Promise<PartnerListRow[]> {
  const conditions: SQL[] = [];
  if (filter.ids) {
    if (filter.ids.length === 0) return [];
    conditions.push(inArray(partners.id, [...filter.ids]));
  }
  if (filter.q?.trim()) {
    const like = likePattern(filter.q);
    const match = or(ilike(partners.name, like), ilike(partners.domain, like));
    if (match) conditions.push(match);
  }
  if (filter.status) conditions.push(eq(partners.status, filter.status));
  if (filter.category) conditions.push(eq(partners.category, filter.category));
  if (filter.region) conditions.push(eq(partners.region, filter.region));
  if (filter.scopeRegion && filter.scopeRegion !== 'all') conditions.push(eq(partners.region, filter.scopeRegion));

  const rows = await tx
    .select()
    .from(partners)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(partners.name));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const people = await tx
    .select({
      partnerId: users.partnerId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(inArray(users.partnerId, ids), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const openInvites = await tx
    .select({ partnerId: invites.partnerId, email: invites.email, role: invites.role })
    .from(invites)
    .where(and(inArray(invites.partnerId, ids), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const approved = await tx
    .select({ partnerId: applications.partnerId, applicantName: applications.applicantName, email: applications.email })
    .from(applications)
    .where(and(inArray(applications.partnerId, ids), eq(applications.status, 'approved')));
  const counts = await tx
    .select({
      partnerId: registrations.partnerId,
      pending: sql<number>`count(*) filter (where ${registrations.status} = 'pending')::int`,
      protectedCount: sql<number>`count(*) filter (where ${registrations.status} = 'accepted')::int`,
      won: sql<number>`count(*) filter (where ${registrations.status} = 'won' and coalesce(${registrations.closedOn}, ${registrations.registeredOn}) >= date_trunc('year', now())::date)::int`,
    })
    .from(registrations)
    .where(inArray(registrations.partnerId, ids))
    .groupBy(registrations.partnerId);
  const managerIds = [...new Set(rows.map((r) => r.managerId).filter((id): id is string => id !== null))];
  const managers =
    managerIds.length === 0 ? [] : await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, managerIds));

  const peopleBy = group(people, (p) => p.partnerId);
  const invitesBy = group(openInvites, (i) => i.partnerId);
  const approvedBy = group(approved, (a) => a.partnerId);
  const countsBy = new Map(counts.map((c) => [c.partnerId, c]));
  const managerName = new Map(managers.map((m) => [m.id, m.name]));

  return rows.map((p): PartnerListRow => {
    const here = peopleBy.get(p.id) ?? [];
    const inviteOnly = (invitesBy.get(p.id) ?? []).filter((i) => !here.some((u) => u.email === i.email));
    const active = here.filter((u) => u.status === 'active');
    const lastLogin = active.reduce<Date | null>((best, u) => (u.lastLoginAt && (!best || u.lastLoginAt > best) ? u.lastLoginAt : best), null);
    const adminUser = here.find((u) => u.role === 'partner_admin' && u.status === 'active') ?? here.find((u) => u.role === 'partner_admin');
    const adminInvite = inviteOnly.find((i) => i.role === 'partner_admin');
    const adminApplication = adminInvite
      ? (approvedBy.get(p.id) ?? []).find((a) => a.email === adminInvite.email)
      : undefined;
    const figures = countsBy.get(p.id);
    return {
      id: p.id,
      logoUrl: logoUrlOf(p.id, p.logoKey),
      name: p.name,
      domain: p.domain,
      category: p.category,
      region: p.region,
      status: p.status,
      statusBeforeSuspend: p.statusBeforeSuspend,
      users: here.length + inviteOnly.length,
      pending: figures?.pending ?? 0,
      protectedCount: figures?.protectedCount ?? 0,
      won: figures?.won ?? 0,
      lastActiveAt: iso(lastLogin),
      since: p.createdAt.toISOString().slice(0, 10),
      agreementVersion: p.agreementVersion,
      agreementAcceptedAt: iso(p.agreementAcceptedAt),
      adminName: adminUser?.name ?? adminApplication?.applicantName ?? (adminInvite ? nameFromEmail(adminInvite.email) : null),
      managerId: p.managerId,
      managerName: p.managerId ? (managerName.get(p.managerId) ?? null) : null,
      hubspotCompanyId: p.hubspotCompanyId,
    };
  });
}
