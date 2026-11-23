import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { authVerifications } from '@/db/schema';
import { systemClock } from '@/lib/clock';

/** Whether a password reset token is still usable: Better Auth keeps it as `reset-password:<token>` until it is used or expires. */
export async function isResetTokenLive(token: string): Promise<boolean> {
  if (!token) return false;
  const [row] = await db
    .select({ id: authVerifications.id })
    .from(authVerifications)
    .where(and(eq(authVerifications.identifier, `reset-password:${token}`), gt(authVerifications.expiresAt, systemClock.now())))
    .limit(1);
  return row !== undefined;
}
