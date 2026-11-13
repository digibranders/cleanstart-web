import { randomUUID } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { registrationMessages, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import type { Product } from '@/lib/domain';
import type { RegistrationMessageDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import { toMessageDto } from '@/server/registrations/mappers';
import { threadRecipients } from '@/server/registrations/recipients';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { getRegistration } from './registrations';

const MAX_BODY = 4000;

/** The thread of one registration, oldest first. Same visibility as getRegistration. */
export async function listMessages(tx: Tx, viewer: Viewer, input: { registrationId: string }): Promise<RegistrationMessageDto[]> {
  assertUuid(input.registrationId, 'registration');
  const [visible] = await tx
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.id, input.registrationId), registrationScope(viewer)))
    .limit(1);
  if (!visible) throw new NotFoundError('registration');
  const rows = await tx
    .select()
    .from(registrationMessages)
    .where(eq(registrationMessages.registrationId, input.registrationId))
    .orderBy(asc(registrationMessages.createdAt), asc(registrationMessages.id));
  return rows.map(toMessageDto);
}

/**
 * Posts as the viewer: side 'partner' for partner users, 'staff' for staff; author_name and author_org copied now.
 * Returns the recipients (staff: the registrant plus partner admins; partner: the deal's manager) and the
 * registration header the notification and email need. No .returning() on the cross-user notification rows.
 */
export async function postMessage(
  tx: Tx,
  viewer: Viewer,
  input: { registrationId: string; body: string },
  clock: Clock,
): Promise<{
  message: RegistrationMessageDto;
  registration: { id: string; customer: string; product: Product; partnerId: string; partnerName: string; managerId: string | null };
  recipientUserIds: string[];
}> {
  const body = input.body.trim();
  if (!body) throw new ValidationError([{ path: 'body', message: 'Write a message first.' }]);
  if (body.length > MAX_BODY) throw new ValidationError([{ path: 'body', message: `Keep it under ${MAX_BODY} characters.` }]);
  const reg = await getRegistration(tx, viewer, input.registrationId);

  const id = randomUUID();
  const createdAt = clock.now();
  const side = viewer.kind === 'partner' ? 'partner' : 'staff';
  const authorOrg = viewer.kind === 'partner' ? viewer.partnerName : 'CleanStart';
  await tx.insert(registrationMessages).values({
    id,
    registrationId: reg.id,
    authorId: viewer.id,
    authorName: viewer.name,
    authorOrg,
    side,
    body,
    createdAt,
  });

  const audience =
    viewer.kind === 'staff'
      ? await threadRecipients(tx, { partnerId: reg.partnerId, registeredById: reg.registeredById })
      : reg.managerId
        ? [reg.managerId]
        : [];
  return {
    message: { id, authorId: viewer.id, authorName: viewer.name, authorOrg, side, body, createdAt: createdAt.toISOString(), auto: false },
    registration: {
      id: reg.id,
      customer: reg.customer,
      product: reg.product,
      partnerId: reg.partnerId,
      partnerName: reg.partnerName,
      managerId: reg.managerId,
    },
    recipientUserIds: audience.filter((userId) => userId !== viewer.id),
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'listMessages' | 'postMessage'>({
  listMessages: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => listMessages(tx, viewer, { registrationId: ctx.b.registrationId }) },
  postMessage: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => postMessage(tx, viewer, { registrationId: ctx.b.registrationId, body: 'isolation probe' }, probeClock),
  },
});
