import { and, eq } from 'drizzle-orm';
import { authTwoFactors, partners, users } from '@/db/schema';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface TwoStepReset {
  userId: string;
  name: string;
  email: string;
  partnerId: string;
  partnerName: string;
}

/**
 * Partner manager. Turns two-step sign-in off for a PARTNER user who lost their device and their backup codes. Only the
 * flag changes here: auth_two_factor is system-only under RLS, so the action removes the authenticator and the backup
 * codes through clearTwoStepSecrets, and the person's sessions, after commit. Staff users are never reset here.
 * Throws NotFoundError for anyone who is not a live partner user, ConflictError('no_two_step') when it is already off.
 */
export async function resetPartnerUserTwoStep(tx: Tx, viewer: Viewer, input: { userId: string }): Promise<TwoStepReset> {
  assertStaff(viewer);
  const [row] = await tx
    .select({ user: users, partnerName: partners.name })
    .from(users)
    .innerJoin(partners, eq(partners.id, users.partnerId))
    .where(and(eq(users.id, input.userId), eq(users.kind, 'partner'), eq(users.status, 'active')))
    .limit(1)
    .for('update', { of: users });
  if (!row?.user.partnerId) throw new NotFoundError('user');
  if (!row.user.twoFactorEnabled) throw new ConflictError('no_two_step', 'Two-step sign-in is not turned on for this person.');
  await tx.update(users).set({ twoFactorEnabled: false }).where(eq(users.id, row.user.id));
  return { userId: row.user.id, name: row.user.name, email: row.user.email, partnerId: row.user.partnerId, partnerName: row.partnerName };
}

/** Deletes the person's authenticator secret and backup codes, as Better Auth's own disable does. Runs on the system pool. */
export async function clearTwoStepSecrets(tx: Tx, _actor: SystemActor, userId: string): Promise<void> {
  await tx.delete(authTwoFactors).where(eq(authTwoFactors.userId, userId));
}

const fns = { resetPartnerUserTwoStep, clearTwoStepSecrets };

export const isolation = defineIsolation<keyof typeof fns>({
  resetPartnerUserTwoStep: {
    scope: 'staff-only',
    probe: (tx, viewer, ctx) => resetPartnerUserTwoStep(tx, viewer, { userId: ctx.b.userId }),
    expect: 'forbidden',
  },
  clearTwoStepSecrets: { scope: 'public', reason: 'Runs on the system pool after the staff action commits. Takes a SystemActor; covered by staff-user-security.test.ts.' },
});
