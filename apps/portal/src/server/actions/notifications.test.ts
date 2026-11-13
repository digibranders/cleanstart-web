import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));

import { notifications } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { markAllNotificationsReadAction, markNotificationReadAction } from './notifications';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  session.viewer = null;
});

describe('notification actions', () => {
  it('marks all of the viewer\'s notifications read and leaves a colleague\'s alone', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await db.insert(notifications).values([
      { userId: me.id, kind: 'registration_message', title: 'a' },
      { userId: colleague.id, kind: 'registration_message', title: 'b' },
    ]);
    session.viewer = me;
    expect(await markAllNotificationsReadAction({})).toEqual({ ok: true, data: null });
    const rows = await db.select().from(notifications);
    expect(Object.fromEntries(rows.map((r) => [r.title, r.readAt !== null]))).toEqual({ a: true, b: false });
  });

  it('marks one read, and answers not found for somebody else\'s notification', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    const [mine] = await db.insert(notifications).values({ userId: me.id, kind: 'registration_message', title: 'a' }).returning();
    const [theirs] = await db.insert(notifications).values({ userId: colleague.id, kind: 'registration_message', title: 'b' }).returning();
    session.viewer = me;
    expect(await markNotificationReadAction({ id: mine!.id })).toEqual({ ok: true, data: null });
    expect((await db.select().from(notifications).where(eq(notifications.id, mine!.id)))[0]?.readAt).not.toBeNull();
    expect(await markNotificationReadAction({ id: theirs!.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await markNotificationReadAction({ id: 'nope' })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
