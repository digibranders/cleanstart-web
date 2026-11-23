import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notifications } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { listNotifications, listNotificationsPage, markAllRead, markRead } from './notifications';

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

describe('listNotificationsPage', () => {
  it('pages 25 at a time, newest first, and narrows to unread', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    for (let i = 1; i <= 30; i += 1) {
      await add(me.id, `n${String(i).padStart(2, '0')}`, `2026-10-${String(i).padStart(2, '0')}T10:00:00Z`, i <= 20 ? '2026-11-01T10:00:00Z' : null);
    }
    await add(colleague.id, 'not mine', '2026-11-04T10:00:00Z');
    const first = await withViewer(me, (tx) => listNotificationsPage(tx, me, { page: 1, unreadOnly: false }));
    expect(first).toMatchObject({ total: 30, unread: 10, page: 1, pageSize: 25 });
    expect(first.items).toHaveLength(25);
    expect(first.items[0]?.title).toBe('n30');
    const second = await withViewer(me, (tx) => listNotificationsPage(tx, me, { page: 2, unreadOnly: false }));
    expect(second.items.map((i) => i.title)).toEqual(['n05', 'n04', 'n03', 'n02', 'n01']);
    const unread = await withViewer(me, (tx) => listNotificationsPage(tx, me, { page: 1, unreadOnly: true }));
    expect(unread.total).toBe(10);
    expect(unread.items.every((i) => i.readAt === null)).toBe(true);
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
