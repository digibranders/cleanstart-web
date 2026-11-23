import { and, eq } from 'drizzle-orm';
import { registrationEvents, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import type { DealRegion } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ValidationError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { getRegistration, lockRegistration } from './registrations';
import { listManagerOptions } from './staff';
import { type RegionDto, regionName } from '@/lib/regions';
import { assertRegionAssignable, listRegions } from './regions';

export interface RoutingSnapshot {
  managerId: string | null;
  managerName: string | null;
  region: DealRegion;
}

export interface ReassignResult {
  registration: RegistrationDetailDto;
  before: RoutingSnapshot;
  after: RoutingSnapshot;
  /** False when the manager and the region already were the requested ones; the caller then skips the audit entry and the notification. */
  changed: boolean;
}

const snapshot = (reg: Pick<RegistrationDetailDto, 'managerId' | 'managerName' | 'region'>): RoutingSnapshot => ({
  managerId: reg.managerId,
  managerName: reg.managerName,
  region: reg.region,
});

/** "Gaurav Jadhav, India": how the audit entry and the history line read one side of the change. */
export const routingLabel = (routing: RoutingSnapshot, regions: readonly RegionDto[]): string =>
  `${routing.managerName ?? 'No manager'}, ${regionName(routing.region, regions)}`;

/**
 * Staff. Changes the partner manager and the region of a pending registration. The manager must be one of
 * listManagerOptions(). Throws ConflictError('not_pending') once the registration is decided. The action checks the
 * policy, audits and notifies.
 */
export async function reassignRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; managerId: string; region: DealRegion },
  clock: Clock,
): Promise<ReassignResult> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'pending') {
    throw new ConflictError('not_pending', 'Only a registration that is still waiting can be reassigned.');
  }
  const manager = (await listManagerOptions(tx, viewer)).find((m) => m.id === input.managerId);
  if (!manager) throw new ValidationError([{ path: 'managerId', message: 'Pick one of the listed partner managers.' }]);

  await assertRegionAssignable(tx, input.region, current.region);
  const before = snapshot(current);
  const after: RoutingSnapshot = { managerId: manager.id, managerName: manager.name, region: input.region };
  if (before.managerId === after.managerId && before.region === after.region) {
    return { registration: current, before, after, changed: false };
  }

  const regionList = await listRegions(tx);
  await tx
    .update(registrations)
    .set({ managerId: manager.id, region: input.region })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: clock.now(),
    text: `Reassigned from ${routingLabel(before, regionList)} to ${routingLabel(after, regionList)}`,
    byLabel: viewer.name,
    source: 'portal',
  });
  return { registration: await getRegistration(tx, viewer, current.id), before, after, changed: true };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'reassignRegistration' | 'routingLabel'>({
  reassignRegistration: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => reassignRegistration(tx, viewer, { id: ctx.b.registrationId, managerId: ctx.staffUserId, region: 'india' }, probeClock),
  },
  routingLabel: { scope: 'exempt', reason: 'Pure string formatter, no data access.' },
});
