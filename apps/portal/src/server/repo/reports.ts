import { and, asc, eq, gte, inArray, lte, max, min, sql } from 'drizzle-orm';
import { invites, partners, registrations, users } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { addDays, fmtShort } from '@/lib/dates';
import { EXPIRING_SOON_DAYS } from '@/lib/deal-rules';
import { PRODUCTS } from '@/lib/domain';
import type { AdminReportsDto, FollowUpDto, PartnerReportRow, ProductReportRow } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { aggregateRegistrationScope } from '@/server/registrations/scope';
import { scopeCondition } from '@/server/staff-scope';
import { defineIsolation } from './isolation.registry';

const toDate = (value: Date | string | null): Date | null => (value === null ? null : new Date(value));
const dateOf = (value: Date): string => value.toISOString().slice(0, 10);

/**
 * Partner manager and staff sales, each limited to the regions they cover ('all' sees everything). Aggregates only; `accepted` counts status accepted, won, lost
 * and expired. Filtering by region, category and sort, and the CSV, are client side (src/lib/report-view.ts).
 * The partners listed are those whose region the viewer covers. Staff sales count the deals registered in their regions; a partner manager counts every deal of the partners listed.
 */
export async function getAdminReports(tx: Tx, viewer: Viewer, clock: Clock): Promise<AdminReportsDto> {
  assertStaff(viewer);
  if (viewer.role !== 'partner_manager' && viewer.role !== 'sales') {
    throw new ForbiddenError('reports are for partner managers and staff sales');
  }
  const today = clock.today();

  const partnerRows = await tx
    .select({
      id: partners.id,
      name: partners.name,
      category: partners.category,
      region: partners.region,
      status: partners.status,
      agreementAcceptedAt: partners.agreementAcceptedAt,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .where(scopeCondition(viewer.regions, partners.region))
    .orderBy(asc(partners.name), asc(partners.id));

  const regionFilter = aggregateRegistrationScope(viewer);
  const perPartner = await tx
    .select({
      partnerId: registrations.partnerId,
      registered: sql<number>`count(*)::int`,
      waiting: sql<number>`(count(*) filter (where ${registrations.status} = 'pending'))::int`,
      accepted: sql<number>`(count(*) filter (where ${registrations.status} in ('accepted', 'won', 'lost', 'expired')))::int`,
      rejected: sql<number>`(count(*) filter (where ${registrations.status} = 'rejected'))::int`,
      won: sql<number>`(count(*) filter (where ${registrations.status} = 'won'))::int`,
      protectedNow: sql<number>`(count(*) filter (where ${registrations.status} = 'accepted'))::int`,
    })
    .from(registrations)
    .where(regionFilter)
    .groupBy(registrations.partnerId);
  const counts = new Map(perPartner.map((c) => [c.partnerId, c]));

  const partnerReport: PartnerReportRow[] = partnerRows.map((p) => {
    const c = counts.get(p.id);
    return {
      partnerId: p.id,
      name: p.name,
      category: p.category,
      region: p.region,
      registered: c?.registered ?? 0,
      waiting: c?.waiting ?? 0,
      accepted: c?.accepted ?? 0,
      rejected: c?.rejected ?? 0,
      won: c?.won ?? 0,
      protectedNow: c?.protectedNow ?? 0,
    };
  });

  const perProduct = await tx
    .select({
      product: registrations.product,
      registered: sql<number>`count(*)::int`,
      accepted: sql<number>`(count(*) filter (where ${registrations.status} in ('accepted', 'won', 'lost', 'expired')))::int`,
      won: sql<number>`(count(*) filter (where ${registrations.status} = 'won'))::int`,
    })
    .from(registrations)
    .where(regionFilter)
    .groupBy(registrations.product);
  const products: ProductReportRow[] = PRODUCTS.map((product) => {
    const c = perProduct.find((p) => p.product === product);
    return { product, registered: c?.registered ?? 0, accepted: c?.accepted ?? 0, won: c?.won ?? 0 };
  });

  const [expiring] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      and(
        regionFilter,
        eq(registrations.status, 'accepted'),
        gte(registrations.protectionEnd, today),
        lte(registrations.protectionEnd, addDays(today, EXPIRING_SOON_DAYS)),
      ),
    );

  const onboarding = partnerRows.filter((p) => p.status === 'onboarding');
  const inactive = partnerRows.filter((p) => p.status === 'inactive');
  const firstInvites =
    onboarding.length === 0
      ? []
      : await tx
          .select({ partnerId: invites.partnerId, first: min(invites.createdAt) })
          .from(invites)
          .where(inArray(invites.partnerId, onboarding.map((p) => p.id)))
          .groupBy(invites.partnerId);
  const lastLogins =
    inactive.length === 0
      ? []
      : await tx
          .select({ partnerId: users.partnerId, last: max(users.lastLoginAt) })
          .from(users)
          .where(inArray(users.partnerId, inactive.map((p) => p.id)))
          .groupBy(users.partnerId);

  const followUps: FollowUpDto[] = [];
  for (const p of onboarding) {
    if (p.agreementAcceptedAt) {
      followUps.push({ partnerId: p.id, name: p.name, why: `Agreement accepted ${fmtShort(dateOf(p.agreementAcceptedAt))}, no deal registered yet`, status: 'onboarding' });
      continue;
    }
    const invited = toDate(firstInvites.find((i) => i.partnerId === p.id)?.first ?? null) ?? p.createdAt;
    followUps.push({ partnerId: p.id, name: p.name, why: `Invited ${fmtShort(dateOf(invited))}, has not accepted the agreement`, status: 'onboarding' });
  }
  for (const p of inactive) {
    const last = toDate(lastLogins.find((l) => l.partnerId === p.id)?.last ?? null);
    followUps.push({ partnerId: p.id, name: p.name, why: last ? `No sign-in since ${fmtShort(dateOf(last))}` : 'No sign-in yet', status: 'inactive' });
  }

  return {
    totalPartners: partnerReport.length,
    totalRegistered: partnerReport.reduce((n, p) => n + p.registered, 0),
    partners: partnerReport,
    products,
    followUps,
    expiringIn14Days: expiring?.n ?? 0,
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getAdminReports'>({
  getAdminReports: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => getAdminReports(tx, viewer, probeClock) },
});
