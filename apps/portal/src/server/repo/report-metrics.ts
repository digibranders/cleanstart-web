import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { partners, registrations } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { buildRangedReport, type RangedReportDto, type ReportRange } from '@/lib/report-metrics';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { aggregateRegistrationScope } from '@/server/registrations/scope';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

/**
 * Value, win rate, funnel, leaderboard and product figures for the deals registered inside `range`. Partner managers
 * and staff sales only; the rows read are the ones `aggregateRegistrationScope` allows (the regions the viewer covers).
 */
export async function getRangedReport(tx: Tx, viewer: Viewer, range: ReportRange): Promise<RangedReportDto> {
  assertStaff(viewer);
  if (viewer.role !== 'partner_manager' && viewer.role !== 'sales') {
    throw new ForbiddenError('reports are for partner managers and staff sales');
  }
  const rows = await tx
    .select({
      partnerId: registrations.partnerId,
      partnerName: partners.name,
      product: registrations.product,
      status: registrations.status,
      value: registrations.dealValue,
      currency: registrations.currency,
      registeredOn: registrations.registeredOn,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(aggregateRegistrationScope(viewer), gte(registrations.registeredOn, range.from), lte(registrations.registeredOn, range.to)))
    .orderBy(asc(registrations.registeredOn), asc(registrations.id));
  return buildRangedReport(rows, range);
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getRangedReport'>({
  getRangedReport: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) =>
      getRangedReport(tx, viewer, { preset: '90d', from: '2026-08-09', to: probeClock.today() }),
  },
});
