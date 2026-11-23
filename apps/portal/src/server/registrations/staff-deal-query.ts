import { and, asc, desc, eq, exists, ilike, inArray, ne, or, type SQL, sql } from 'drizzle-orm';
import { alias, QueryBuilder } from 'drizzle-orm/pg-core';
import { partners, registrations, users } from '@/db/schema';
import { addDays } from '@/lib/dates';
import { isOverSla } from '@/lib/deal-rules';
import type { StaffDealFilters, StaffDealSortKey } from '@/lib/staff-deals-dto';

const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/** The newest "waiting since" date already past the review target; a waiting deal on or before it is overdue. */
export function overdueCutoff(today: string): string {
  let day = addDays(today, -1);
  while (!isOverSla(day, today)) day = addDays(day, -1);
  return day;
}

const rival = alias(registrations, 'rival');

/** Another partner holds or waits on the same customer and product (the rule behind the Checks column). */
const hasConflict = (): SQL =>
  exists(
    new QueryBuilder()
      .select({ one: sql`1` })
      .from(rival)
      .where(
        and(
          sql`lower(${rival.customerName}) = lower(${registrations.customerName})`,
          eq(rival.product, registrations.product),
          ne(rival.partnerId, registrations.partnerId),
          inArray(rival.status, ['pending', 'accepted']),
        ),
      ),
  );

/** Filter conditions over registrations joined to partners. `withStatus: false` is for the facet counts. */
export function staffDealConditions(filters: StaffDealFilters, today: string, opts: { withStatus: boolean }): Array<SQL | undefined> {
  const q = filters.q?.trim();
  const like = q ? `%${escapeLike(q)}%` : null;
  return [
    opts.withStatus && filters.status.length > 0 ? inArray(registrations.status, filters.status) : undefined,
    filters.partnerId ? eq(registrations.partnerId, filters.partnerId) : undefined,
    filters.managerId ? eq(registrations.managerId, filters.managerId) : undefined,
    filters.product ? eq(registrations.product, filters.product) : undefined,
    filters.region ? eq(registrations.region, filters.region) : undefined,
    filters.overdue
      ? and(eq(registrations.status, 'pending'), sql`coalesce(${registrations.resubmittedOn}, ${registrations.registeredOn}) <= ${overdueCutoff(today)}`)
      : undefined,
    filters.conflict ? hasConflict() : undefined,
    like ? or(ilike(registrations.customerName, like), ilike(partners.name, like)) : undefined,
  ];
}

const SORT_COLUMN = {
  customer: registrations.customerName,
  partner: partners.name,
  product: registrations.product,
  region: registrations.region,
  manager: users.name,
  status: registrations.status,
  registered: registrations.createdAt,
  protection: registrations.protectionEnd,
} as const satisfies Record<StaffDealSortKey, unknown>;

/** Missing values (no manager, no protection end yet) sort last; the id keeps pages stable. */
export function staffDealOrder(sort: StaffDealSortKey, dir: 'asc' | 'desc'): SQL[] {
  const column = SORT_COLUMN[sort];
  const primary = sort === 'manager' || sort === 'protection' ? sql`${column} ${sql.raw(dir)} nulls last` : dir === 'asc' ? asc(column) : desc(column);
  return [primary, desc(registrations.id)];
}
