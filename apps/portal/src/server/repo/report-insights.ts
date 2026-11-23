import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { documentOpens, documents, partners, registrations, regions, users } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { addDays } from '@/lib/dates';
import { ALL_REGIONS } from '@/lib/domain';
import {
  byManager,
  byRegion,
  engagementShare,
  type InsightFact,
  type ReportInsightsDto,
  type RollupGroup,
  rejectionReasons,
  timeToDecision,
} from '@/lib/report-insights';
import type { ReportRange } from '@/lib/report-metrics';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { aggregateRegistrationScope } from '@/server/registrations/scope';
import { loadScopes, scopeCondition } from '@/server/staff-scope';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

const TOP_DOCUMENTS = 5;

/**
 * Time to decision, rejection reasons, document engagement and region and manager rollups for the deals registered (and
 * the documents opened) inside `range`. Partner managers and staff sales only. Deals follow `aggregateRegistrationScope`
 * (the same rows as the rest of Reports); document opens and the partner count follow the partners in the regions the
 * viewer covers.
 */
export async function getReportInsights(tx: Tx, viewer: Viewer, range: ReportRange): Promise<ReportInsightsDto> {
  assertStaff(viewer);
  if (viewer.role !== 'partner_manager' && viewer.role !== 'sales') {
    throw new ForbiddenError('reports are for partner managers and staff sales');
  }
  const regionRows = await tx.select({ key: regions.key, name: regions.name, active: regions.active }).from(regions).orderBy(asc(regions.sortOrder), asc(regions.name));
  const regionName = (key: string): string => regionRows.find((r) => r.key === key)?.name ?? key;
  const covered = (key: string): boolean => viewer.regions === ALL_REGIONS || viewer.regions.includes(key);

  const rows = await tx
    .select({
      partnerId: registrations.partnerId,
      partnerName: partners.name,
      partnerRegion: partners.region,
      managerId: partners.managerId,
      managerName: users.name,
      product: registrations.product,
      status: registrations.status,
      value: registrations.dealValue,
      currency: registrations.currency,
      registeredOn: registrations.registeredOn,
      resubmittedOn: registrations.resubmittedOn,
      decidedAt: registrations.decidedAt,
      rejectionReason: registrations.rejectionReason,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .leftJoin(users, eq(users.id, partners.managerId))
    .where(and(aggregateRegistrationScope(viewer), gte(registrations.registeredOn, range.from), lte(registrations.registeredOn, range.to)))
    .orderBy(asc(registrations.registeredOn), asc(registrations.id));
  const facts: InsightFact[] = rows.map(({ decidedAt, ...row }) => ({ ...row, decidedOn: decidedAt ? decidedAt.toISOString().slice(0, 10) : null }));

  // Every active region the viewer covers shows, with zeros when it has no deals. Managers: every active partner manager whose regions overlap the viewer's.
  const regionSeeds: RollupGroup[] = regionRows.filter((r) => r.active && covered(r.key)).map((r) => ({ key: r.key, label: r.name }));
  const managerRows = await tx
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(asc(users.name));
  const scopes = await loadScopes(tx, managerRows.map((m) => m.id));
  const managerSeeds: RollupGroup[] = managerRows.flatMap((m) => {
    const scope = scopes.get(m.id) ?? ALL_REGIONS;
    if (scope !== ALL_REGIONS && !scope.some(covered)) return [];
    return [{ key: m.id, label: m.name, detail: scope === ALL_REGIONS ? 'All regions' : scope.map(regionName).join(', ') }];
  });

  const inScope = scopeCondition(viewer.regions, partners.region);
  const opened = and(
    gte(documentOpens.openedAt, new Date(`${range.from}T00:00:00Z`)),
    sql`${documentOpens.openedAt} < ${new Date(`${addDays(range.to, 1)}T00:00:00Z`)}`,
  );
  const live = and(inScope, inArray(partners.status, ['onboarding', 'active']));
  const [partnerTotal] = await tx.select({ n: sql<number>`count(*)::int` }).from(partners).where(live);
  const [openers] = await tx
    .select({ n: sql<number>`count(distinct ${documentOpens.partnerId})::int` })
    .from(documentOpens)
    .innerJoin(partners, eq(partners.id, documentOpens.partnerId))
    .where(and(opened, live));
  const top = await tx
    .select({
      documentId: documents.id,
      title: documents.title,
      opens: sql<number>`count(*)::int`,
      partners: sql<number>`count(distinct ${documentOpens.partnerId})::int`,
    })
    .from(documentOpens)
    .innerJoin(documents, eq(documents.id, documentOpens.documentId))
    .innerJoin(partners, eq(partners.id, documentOpens.partnerId))
    .where(and(opened, isNull(documents.deletedAt), inScope))
    .groupBy(documents.id, documents.title)
    .orderBy(desc(sql`count(*)`), asc(documents.title))
    .limit(TOP_DOCUMENTS);

  const partnerCount = partnerTotal?.n ?? 0;
  const openedAny = openers?.n ?? 0;
  return {
    range,
    decision: timeToDecision(facts),
    reasons: rejectionReasons(facts),
    engagement: { partners: partnerCount, openedAny, share: engagementShare(openedAny, partnerCount), top },
    regions: byRegion(facts, regionName, regionSeeds),
    managers: byManager(facts, managerSeeds),
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getReportInsights'>({
  getReportInsights: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => getReportInsights(tx, viewer, { preset: '90d', from: '2026-08-09', to: probeClock.today() }),
  },
});
