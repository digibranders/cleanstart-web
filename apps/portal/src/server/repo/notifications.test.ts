import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notifications } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { listNotifications, markAllRead, markRead } from './notifications';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const add = (userId: string, title: string, createdAt: string, readAt: string | null = null) =>
  db.insert(notifications).values({
    userId, kind: 'registration_message', title, link: '/partner/deals', createdAt: new Date(createdAt), readAt: readAt ? new Date(readAt) : null,
  });

describe('listNotifications', () => {
  it('returns the viewer\'s own, newest first, with the unread count of all of them', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'oldest', '2026-11-01T10:00:00Z', '2026-11-02T10:00:00Z');
    await add(me.id, 'middle', '2026-11-02T10:00:00Z');
    await add(me.id, 'newest', '2026-11-03T10:00:00Z');
    await add(colleague.id, 'not mine', '2026-11-04T10:00:00Z');
    const out = await withViewer(me, (tx) => listNotifications(tx, me, { limit: 2 }));
    expect(out.items.map((i) => i.title)).toEqual(['newest', 'middle']);
    expect(out.unread).toBe(2);
    expect(out.items[0]).toMatchObject({ kind: 'registration_message', link: '/partner/deals', readAt: null, body: null });
  });
});

describe('markAllRead and markRead', () => {
  it('marks only the viewer\'s notifications and keeps an earlier read time', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'a', '2026-11-02T10:00:00Z');
    await add(me.id, 'b', '2026-11-03T10:00:00Z', '2026-11-03T11:00:00Z');
    await add(colleague.id, 'c', '2026-11-04T10:00:00Z');
    await withViewer(me, (tx) => markAllRead(tx, me, clock));
    const mine = await db.select().from(notifications);
    const read = Object.fromEntries(mine.map((n) => [n.title, n.readAt?.toISOString() ?? null]));
    expect(read).toEqual({ a: '2026-11-06T14:02:00.000Z', b: '2026-11-03T11:00:00.000Z', c: null });
    expect((await withViewer(me, (tx) => listNotifications(tx, me, {}))).unread).toBe(0);
  });

  it('marks one as read and answers not found for somebody else\'s or an unknown id', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'mine', '2026-11-02T10:00:00Z');
    await add(colleague.id, 'theirs', '2026-11-02T10:00:00Z');
    const [own] = await db.select().from(notifications).where(eq(notifications.userId, me.id));
    const [theirs] = await db.select().from(notifications).where(eq(notifications.userId, colleague.id));
    await withViewer(me, (tx) => markRead(tx, me, { id: own!.id }, clock));
    await withViewer(me, (tx) => markRead(tx, me, { id: own!.id }, clock));
    await expect(withViewer(me, (tx) => markRead(tx, me, { id: theirs!.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(me, (tx) => markRead(tx, me, { id: 'nope' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});
