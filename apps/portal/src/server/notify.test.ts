import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications } from '@/db/schema';
import { asPartner, asStaff, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem, withViewer } from '@/server/repo/context';
import { NOTIFICATION_PREF_DEFAULTS, notifyUsers, resolveEmailRecipients, type NewNotification } from './notify';

describe('notifications', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('inserts in-app rows for another user without needing to read them back', async () => {
    const staff = await asStaff(testDb());
    const partner = await asPartner(testDb());
    await withViewer(partner, (tx) =>
      notifyUsers(tx, [{ userId: staff.id, kind: 'registration_submitted', title: 'New registration', link: '/admin/approvals' }]),
    );
    const rows = await withSystem(SYSTEM_ACTORS.portal, (tx) => tx.select().from(notifications));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: staff.id, kind: 'registration_submitted', title: 'New registration', body: null, link: '/admin/approvals', readAt: null });
  });

  it('does nothing for an empty list', async () => {
    await withSystem(SYSTEM_ACTORS.portal, (tx) => notifyUsers(tx, []));
    expect(await resolveEmailRecipients([])).toEqual([]);
  });

  it('applies the defaults, the stored switches, the disabled flag and the always-email staff kinds', async () => {
    const db = testDb();
    const on = await makeUser(db, {});
    const off = await makeUser(db, {});
    const gone = await makeUser(db, { status: 'disabled' });
    const staff = await makeUser(db, { kind: 'staff' });
    await db.insert(notificationPrefs).values({ userId: off.id, category: 'decision', email: false });
    const item = (userId: string, kind: NewNotification['kind']): NewNotification => ({ userId, kind, title: 't' });
    const recipients = await resolveEmailRecipients([
      item(on.id, 'registration_accepted'),
      item(off.id, 'registration_accepted'),
      item(gone.id, 'registration_accepted'),
      item(on.id, 'document_new'),
      item(staff.id, 'registration_submitted'),
    ]);
    expect(recipients.map((r) => `${r.userId}:${r.kind}`).sort()).toEqual([`${on.id}:registration_accepted`, `${staff.id}:registration_submitted`].sort());
    expect(NOTIFICATION_PREF_DEFAULTS.docs).toBe(false);
  });
});
