import { and, asc, count, desc, eq, gte, inArray, max, ne, sql, type SQL } from 'drizzle-orm';
import { applications, documentOpens, documents, invites, partners, registrations, users } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import {
  type DashboardFilters,
  type DocumentUseRow,
  type DormantPartnerRow,
  type FunnelDto,
  type ManagerWorkloadRow,
  type PartnerDashboardDto,
  type PartnerHealthDto,
  type PartnerPerformanceRow,
  periodStart,
  type StaffDashboardDto,
  type TeamMemberCount,
} from '@/lib/dashboard-dto';
import { daysBetween } from '@/lib/dates';
import { waitingBusinessDays } from '@/lib/deal-rules';
import type { StaffRegion } from '@/lib/domain';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import {
  type DealFact,
  dealKpis,
  dealSeries,
  expiringSoon,
  managerWorkload,
  partnerTotals,
  protectedCount,
} from '@/server/registrations/dashboard-stats';
import { registrationScope } from '@/server/registrations/scope';
import { assertStaff, type Tx } from './context';
import { listDocuments } from './documents';
import { defineIsolation } from './isolation.registry';
import { integrationHealth } from './integration-health';
import { getPartnerOverview } from './overview';

const LIST_SIZE = 5;
const DORMANT_DAYS = 30;
const DORMANT_LIST_SIZE = 10;

const dayStart = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

/** Every registration in `scope` that matches the region, product and (staff) partner filters, whatever its date. */
async function loadFacts(tx: Tx, scope: SQL | undefined, filters: DashboardFilters, partnerId: string | undefined): Promise<DealFact[]> {
  const rows = await tx
    .select({
      id: registrations.id,
      partnerId: registrations.partnerId,
      partnerName: partners.name,
      customer: registrations.customerName,
      product: registrations.product,
      region: registrations.region,
      country: registrations.customerCountry,
      industry: registrations.customerIndustry,
      stage: registrations.stage,
      status: registrations.status,
      value: registrations.dealValue,
      currency: registrations.currency,
      registeredOn: registrations.registeredOn,
      resubmittedOn: registrations.resubmittedOn,
      decidedAt: registrations.decidedAt,
      rejectionReason: registrations.rejectionReason,
      protectionEnd: registrations.protectionEnd,
      registeredBy: registrations.registeredBy,
      managerId: registrations.managerId,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(
      and(
        scope,
        filters.region ? eq(registrations.region, filters.region) : undefined,
        filters.product ? eq(registrations.product, filters.product) : undefined,
        partnerId ? eq(registrations.partnerId, partnerId) : undefined,
      ),
    )
    .orderBy(asc(registrations.registeredOn), asc(registrations.id));
  return rows.map(({ decidedAt, ...row }) => ({ ...row, decidedOn: decidedAt ? decidedAt.toISOString().slice(0, 10) : null }));
}

const range = (filters: DashboardFilters, today: string): { from: string; to: string } => ({ from: periodStart(filters.period, today), to: today });

/**
 * Partner admin and partner sales: the viewer's company only (partnerId in the filters is ignored); sales see only the deals
 * they registered. The partner admin also gets a count per team member. RLS is the cross company backstop.
 */
export async function partnerDashboard(tx: Tx, viewer: Viewer, filters: DashboardFilters, clock: Clock): Promise<PartnerDashboardDto> {
  if (viewer.kind !== 'partner' || viewer.role === 'technical') throw new ForbiddenError('the dashboard is for partner admin and sales');
  const today = clock.today();
  const window = range(filters, today);
  const all = await loadFacts(tx, registrationScope(viewer), filters, viewer.partnerId);
  const inRange = all.filter((d) => d.registeredOn >= window.from);
  const waiting = all.filter((d) => d.status === 'pending');

  let team: TeamMemberCount[] = [];
  if (viewer.role === 'partner_admin') {
    const members = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.partnerId, viewer.partnerId), eq(users.kind, 'partner'), ne(users.status, 'disabled'), inArray(users.role, ['partner_admin', 'sales'])))
      .orderBy(asc(users.name), asc(users.id));
    team = members.map((m) => {
      const own = inRange.filter((d) => d.registeredBy === m.id);
      const totals = partnerTotals(own).get(viewer.partnerId);
      return { userId: m.id, name: m.name, deals: own.length, won: totals?.wonCount ?? 0, pipelineValue: totals?.pipelineValue ?? 0 };
    });
  }

  const opened = (await listDocuments(tx, viewer, {}))
    .filter((d) => (d.ownOpens ?? 0) > 0)
    .sort((a, b) => (b.ownOpens ?? 0) - (a.ownOpens ?? 0) || a.title.localeCompare(b.title))
    .slice(0, LIST_SIZE)
    .map((d): DocumentUseRow => ({ id: d.id, title: d.title, opens: d.ownOpens ?? 0, partners: 1 }));
  const overview = await getPartnerOverview(tx, viewer, clock);

  return {
    filters,
    range: window,
    ownDealsOnly: viewer.role === 'sales',
    waiting: { count: waiting.length, oldestDays: Math.max(0, ...waiting.map((d) => waitingBusinessDays(d.resubmittedOn ?? d.registeredOn, today))) },
    protectedNow: protectedCount(all, today),
    expiring14: expiringSoon(all, today),
    kpis: dealKpis(inRange),
    series: dealSeries(inRange, all, window),
    team,
    mostOpenedDocuments: opened,
    newDocuments: overview.newDocuments,
    attention: overview.attention,
  };
}

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const later = (a: Date | null, b: Date | null): Date | null => (a && b ? (a > b ? a : b) : (a ?? b));

/** Staff sales see only the partners of their own region; partner managers see all (the rule listPartners uses). */
const partnerRegionScope = (viewer: Viewer): StaffRegion | undefined => (viewer.kind === 'staff' && viewer.role === 'sales' ? viewer.region : undefined);

async function documentUse(tx: Tx, from: string): Promise<DocumentUseRow[]> {
  const opens = count(documentOpens.id);
  const rows = await tx
    .select({ id: documents.id, title: documents.title, opens, partners: sql<number>`count(distinct ${documentOpens.partnerId})::int` })
    .from(documents)
    .leftJoin(documentOpens, and(eq(documentOpens.documentId, documents.id), gte(documentOpens.openedAt, dayStart(from))))
    .where(sql`${documents.deletedAt} is null`)
    .groupBy(documents.id, documents.title)
    .orderBy(desc(opens), asc(documents.title), asc(documents.id));
  return rows;
}

async function funnel(tx: Tx, filters: DashboardFilters, from: string): Promise<FunnelDto> {
  const apps = await tx
    .select({ status: applications.status, partnerId: applications.partnerId })
    .from(applications)
    .where(
      and(
        gte(applications.createdAt, dayStart(from)),
        filters.region ? eq(applications.region, filters.region) : undefined,
      ),
    );
  const approved = apps.filter((a) => a.status === 'approved');
  const partnerIds = [...new Set(approved.flatMap((a) => (a.partnerId ? [a.partnerId] : [])))];
  if (partnerIds.length === 0) return { applied: apps.length, approved: approved.length, invited: 0, active: 0 };
  const sent = new Set(
    (await tx.select({ partnerId: invites.partnerId }).from(invites).where(and(eq(invites.kind, 'partner'), inArray(invites.partnerId, partnerIds)))).flatMap((r) => (r.partnerId ? [r.partnerId] : [])),
  );
  const active = new Set((await tx.select({ id: partners.id }).from(partners).where(and(inArray(partners.id, partnerIds), eq(partners.status, 'active')))).map((r) => r.id));
  return {
    applied: apps.length,
    approved: approved.length,
    invited: approved.filter((a) => a.partnerId && sent.has(a.partnerId)).length,
    active: approved.filter((a) => a.partnerId && active.has(a.partnerId)).length,
  };
}

/**
 * Staff (partner manager; staff sales for their region). Deals use the same scope as the approvals queue and the Deals table
 * (registrationScope: managers all, sales their region); partners follow listPartners (sales: partners in their region).
 * Marketing has no deal access, so it is refused here as it is there.
 */
export async function staffDashboard(tx: Tx, viewer: Viewer, filters: DashboardFilters, clock: Clock): Promise<StaffDashboardDto> {
  assertStaff(viewer);
  const scope = registrationScope(viewer);
  const today = clock.today();
  const window = range(filters, today);
  const all = await loadFacts(tx, scope, filters, filters.partnerId);
  const inRange = all.filter((d) => d.registeredOn >= window.from);
  const pending = all.filter((d) => d.status === 'pending');
  const kpis = dealKpis(inRange);

  const regionLimit = partnerRegionScope(viewer);
  const partnerRows = await tx
    .select({ id: partners.id, name: partners.name, status: partners.status })
    .from(partners)
    .where(
      and(
        filters.partnerId ? eq(partners.id, filters.partnerId) : undefined,
        regionLimit && regionLimit !== 'all' ? eq(partners.region, regionLimit) : undefined,
      ),
    )
    .orderBy(asc(partners.name), asc(partners.id));
  const partnerIds = partnerRows.map((p) => p.id);
  const logins = partnerIds.length
    ? await tx
        .select({ partnerId: users.partnerId, at: max(users.lastLoginAt) })
        .from(users)
        .where(and(eq(users.kind, 'partner'), inArray(users.partnerId, partnerIds)))
        .groupBy(users.partnerId)
    : [];
  const loginAt = new Map(logins.map((l) => [l.partnerId, l.at]));
  const lastDeal = new Map<string, string>();
  for (const d of all) if (d.registeredOn > (lastDeal.get(d.partnerId) ?? '')) lastDeal.set(d.partnerId, d.registeredOn);
  const lastActive = (id: string): Date | null => later(loginAt.get(id) ?? null, lastDeal.has(id) ? dayStart(lastDeal.get(id) ?? today) : null);

  const totals = partnerTotals(inRange);
  const performance: PartnerPerformanceRow[] = partnerRows.map((p) => ({
    partnerId: p.id,
    name: p.name,
    deals: totals.get(p.id)?.deals ?? 0,
    pipelineValue: totals.get(p.id)?.pipelineValue ?? 0,
    wonCount: totals.get(p.id)?.wonCount ?? 0,
    wonValue: totals.get(p.id)?.wonValue ?? 0,
    lastActiveAt: iso(lastActive(p.id)),
  }));
  const rank = (key: 'pipelineValue' | 'wonValue') =>
    performance
      .filter((p) => p[key] > 0)
      .sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name))
      .slice(0, LIST_SIZE);

  const health: PartnerHealthDto = { active: 0, onboarding: 0, inactive: 0 };
  for (const p of partnerRows) health[p.status === 'active' ? 'active' : p.status === 'onboarding' ? 'onboarding' : 'inactive'] += 1;

  const dormant: DormantPartnerRow[] = partnerRows
    .filter((p) => p.status === 'active')
    .map((p) => {
      const at = lastActive(p.id);
      return { partnerId: p.id, name: p.name, lastActiveAt: iso(at), daysQuiet: at ? daysBetween(at.toISOString().slice(0, 10), today) : null };
    })
    .filter((p) => p.daysQuiet === null || p.daysQuiet >= DORMANT_DAYS)
    .sort((a, b) => (b.daysQuiet ?? Number.POSITIVE_INFINITY) - (a.daysQuiet ?? Number.POSITIVE_INFINITY) || a.name.localeCompare(b.name))
    .slice(0, DORMANT_LIST_SIZE);

  const counts = managerWorkload(all, inRange, today);
  const managerIds = counts.flatMap((c) => (c.managerId ? [c.managerId] : []));
  const names = new Map(
    managerIds.length ? (await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, managerIds))).map((u) => [u.id, u.name]) : [],
  );
  const workload: ManagerWorkloadRow[] = counts.map((c) => ({ ...c, name: c.managerId ? (names.get(c.managerId) ?? 'Former staff member') : 'Unassigned' }));

  const [openApplications] = await tx.select({ n: count() }).from(applications).where(eq(applications.status, 'new'));
  const docs = await documentUse(tx, window.from);
  const integrations = await integrationHealth(tx);

  return {
    filters,
    range: window,
    waiting: { count: pending.length, overdue: workload.reduce((n, w) => n + w.overdue, 0) },
    kpis,
    series: dealSeries(inRange, all, window),
    activePartners: health.active,
    openApplications: openApplications?.n ?? 0,
    funnel: await funnel(tx, filters, window.from),
    partnerHealth: health,
    topByPipeline: rank('pipelineValue'),
    topByWon: rank('wonValue'),
    dormantPartners: dormant,
    managerWorkload: workload,
    expiring14: expiringSoon(all, today),
    mostOpenedDocuments: docs.filter((d) => d.opens > 0).slice(0, LIST_SIZE),
    leastOpenedDocuments: [...docs].sort((a, b) => a.opens - b.opens || a.title.localeCompare(b.title)).slice(0, LIST_SIZE),
    integrations: { pending: integrations.pending, failed: integrations.failed, lastPollAt: iso(integrations.lastPollAt) },
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'partnerDashboard' | 'staffDashboard'>({
  partnerDashboard: {
    scope: 'tenant',
    expect: 'empty',
    /** Asks for partner B by id; the answer must hold nothing of any other company. */
    probe: async (tx, viewer, ctx) => {
      const dashboard = await partnerDashboard(tx, viewer, { period: '12m', partnerId: ctx.b.partnerId }, probeClock);
      return [...dashboard.series.topDeals, ...dashboard.expiring14].filter((d) => d.partnerId !== viewer.partnerId);
    },
  },
  staffDashboard: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => staffDashboard(tx, viewer, { period: '90d' }, probeClock) },
});
