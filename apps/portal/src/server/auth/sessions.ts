import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { authSessions } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { SessionDto } from '@/lib/dto';
import { NotFoundError } from '@/server/errors';
import { getAuth } from './auth';

/** The token of the session behind `requestHeaders`, to mark the current device in the list. */
export async function currentSessionToken(requestHeaders: Headers): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.session.token ?? null;
}

/** The user's unexpired sessions, newest first. `current` marks the session whose token is `currentToken`. */
export async function listSessions(
  userId: string,
  currentToken: string | null,
  clock: Clock = systemClock,
): Promise<SessionDto[]> {
  const rows = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.userId, userId), gt(authSessions.expiresAt, clock.now())))
    .orderBy(desc(authSessions.createdAt));
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    current: currentToken !== null && row.token === currentToken,
  }));
}

/** Signs one session out. The user id is part of the match, so nobody revokes another person's session. */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const removed = await db
    .delete(authSessions)
    .where(and(eq(authSessions.id, sessionId), eq(authSessions.userId, userId)))
    .returning({ id: authSessions.id });
  if (removed.length === 0) throw new NotFoundError('session');
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.delete(authSessions).where(eq(authSessions.userId, userId));
}
