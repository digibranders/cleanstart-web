import { and, count, eq, sql } from 'drizzle-orm';
import { partners, registrations } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { isOverSla } from '@/lib/deal-rules';
import { REGISTRATION_STATUSES } from '@/lib/domain';
import type { StaffDealCounts, StaffDealFilters, StaffDealsPageDto } from '@/lib/staff-deals-dto';
import type { Viewer } from '@/server/auth/types';
import { computeChecks, selectRows, toListItem } from '@/server/registrations/mappers';
import { registrationScope } from '@/server/registrations/scope';
import { staffDealConditions, staffDealOrder } from '@/server/registrations/staff-deal-query';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

/**
 * Staff. Every registration in the viewer's scope (partner manager: all; staff sales: their region), filtered, sorted and
 * paged in SQL. Counts per status ignore the status filter so the facet bar shows what each tab would hold.
 */
export async function listStaffDeals(tx: Tx, viewer: Viewer, filters: StaffDealFilters, clock: Clock): Promise<StaffDealsPageDto> {
  assertStaff(viewer);
  const scope = registrationScope(viewer);
  const today = clock.today();
  const where = and(scope, ...staffDealConditions(filters, today, { withStatus: true }));

  const [totalRow] = await tx
    .select({ n: count() })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(where);
  const total = totalRow?.n ?? 0;
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.pageSize)));

  const facetRows = await tx
    .select({ status: registrations.status, n: sql<number>`count(*)::int` })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(scope, ...staffDealConditions(filters, today, { withStatus: false })))
    .groupBy(registrations.status);
  const counts = Object.fromEntries([...REGISTRATION_STATUSES.map((s) => [s, 0]), ['all', 0]]) as StaffDealCounts;
  for (const row of facetRows) {
    counts[row.status] = row.n;
    counts.all += row.n;
  }

  const rows = await selectRows(tx)
    .where(where)
    .orderBy(...staffDealOrder(filters.sort, filters.dir))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);
  const checks = await computeChecks(tx, rows);

  return {
    rows: rows.map((row) => ({
      ...toListItem(row),
      overdue: row.status === 'pending' && isOverSla(row.resubmittedOn ?? row.registeredOn, today),
      conflict: checks[row.id]?.kind === 'conflict',
    })),
    total,
    counts,
    page,
    pageSize: filters.pageSize,
  };
}

const probeFilters: StaffDealFilters = { status: [], overdue: false, conflict: false, sort: 'registered', dir: 'desc', page: 1, pageSize: 25 };

export const isolation = defineIsolation<'listStaffDeals'>({
  listStaffDeals: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listStaffDeals(tx, viewer, probeFilters, systemClock) },
});
