import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { authSessions } from '@/db/schema';
import { makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { listSessions, revokeAllSessions, revokeSession } from './sessions';

const NOW = fixedClock('2026-11-12T10:00:00Z');
const at = (iso: string): Date => new Date(iso);

const addSession = async (userId: string, token: string, createdAt: string, expiresAt: string) => {
  const [row] = await testDb()
    .insert(authSessions)
    .values({ userId, token, createdAt: at(createdAt), expiresAt: at(expiresAt), userAgent: `agent ${token}`, ipAddress: '203.0.113.7' })
    .returning();
  if (!row) throw new Error('test helper: session insert returned no row');
  return row;
};

beforeEach(async () => {
  await resetDb(testDb());
});

describe('listSessions', () => {
  it('lists unexpired sessions newest first and marks the current one', async () => {
    const user = await makeUser(testDb(), {});
    const older = await addSession(user.id, 'tok-old', '2026-11-01T09:00:00Z', '2026-12-01T09:00:00Z');
    const newer = await addSession(user.id, 'tok-new', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(user.id, 'tok-dead', '2026-10-01T09:00:00Z', '2026-11-01T09:00:00Z');

    const list = await listSessions(user.id, 'tok-new', NOW);
    expect(list.map((s) => s.id)).toEqual([newer.id, older.id]);
    expect(list.map((s) => s.current)).toEqual([true, false]);
    expect(list[0]).toEqual({
      id: newer.id,
      createdAt: '2026-11-10T09:00:00.000Z',
      userAgent: 'agent tok-new',
      ipAddress: '203.0.113.7',
      current: true,
    });
  });

  it('marks nothing current without a token and never lists another user', async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    await addSession(mine.id, 'tok-mine', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(theirs.id, 'tok-theirs', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    const list = await listSessions(mine.id, null, NOW);
    expect(list).toHaveLength(1);
    expect(list[0]?.current).toBe(false);
  });
});

describe('revokeSession', () => {
  it('removes the session', async () => {
    const user = await makeUser(testDb(), {});
    const session = await addSession(user.id, 'tok-a', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await revokeSession(user.id, session.id);
    expect(await testDb().select().from(authSessions)).toHaveLength(0);
  });

  it("refuses another user's session and an unknown id, and changes nothing", async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    const session = await addSession(theirs.id, 'tok-theirs', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await expect(revokeSession(mine.id, session.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(revokeSession(mine.id, '00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(NotFoundError);
    expect(await testDb().select().from(authSessions).where(eq(authSessions.userId, theirs.id))).toHaveLength(1);
  });
});

describe('revokeAllSessions', () => {
  it("signs a user out everywhere and leaves other users' sessions alone", async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    await addSession(mine.id, 'tok-1', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(mine.id, 'tok-2', '2026-11-11T09:00:00Z', '2026-12-11T09:00:00Z');
    await addSession(theirs.id, 'tok-3', '2026-11-11T09:00:00Z', '2026-12-11T09:00:00Z');
    await revokeAllSessions(mine.id);
    expect(await listSessions(mine.id, null, NOW)).toHaveLength(0);
    expect(await listSessions(theirs.id, null, NOW)).toHaveLength(1);
  });
});
