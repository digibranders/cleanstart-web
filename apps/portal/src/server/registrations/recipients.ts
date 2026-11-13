import { and, eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import type { Tx } from '@/server/repo/context';

export interface RegistrationParty {
  partnerId: string;
  registeredById: string | null;
}

async function activeAdmins(tx: Tx, partnerId: string): Promise<string[]> {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.partnerId, partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active')));
  return rows.map((r) => r.id);
}

async function activeRegistrant(tx: Tx, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1);
  return row?.id ?? null;
}

/** Who hears about a decision or a stage change: the person who registered it, or the partner admins when they are gone. */
export async function decisionRecipients(tx: Tx, reg: RegistrationParty): Promise<string[]> {
  const registrant = await activeRegistrant(tx, reg.registeredById);
  return registrant ? [registrant] : activeAdmins(tx, reg.partnerId);
}

/** Who hears about a message from CleanStart: the registrant and the partner admins, once each. */
export async function threadRecipients(tx: Tx, reg: RegistrationParty): Promise<string[]> {
  const registrant = await activeRegistrant(tx, reg.registeredById);
  const admins = await activeAdmins(tx, reg.partnerId);
  return [...new Set([...(registrant ? [registrant] : []), ...admins])];
}
