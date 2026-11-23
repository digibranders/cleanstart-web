import { and, eq } from 'drizzle-orm';
import { registrationEvents, registrations } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { RegistrationDetailDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError } from '@/server/errors';
import type { Tx } from './context';
import { getRegistration, lockRegistration } from './registrations';

export const STAGE_WITHDRAWN = 'Withdrawn by partner';

/** A pending registration closes as "lost" (the terminal status that frees the open-registration unique index) with a withdrawn stage. */
export async function withdrawRegistration(tx: Tx, viewer: Viewer, id: string, clock: Clock): Promise<RegistrationDetailDto> {
  const current = await lockRegistration(tx, viewer, id);
  if (current.status !== 'pending') {
    throw new ConflictError('not_pending', 'Only a registration that is still pending can be withdrawn.');
  }
  await tx
    .update(registrations)
    .set({ status: 'lost', stage: STAGE_WITHDRAWN, closedOn: clock.today() })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: clock.now(),
    text: 'Withdrawn by the partner',
    byLabel: viewer.name,
    source: 'portal',
  });
  return getRegistration(tx, viewer, current.id);
}
