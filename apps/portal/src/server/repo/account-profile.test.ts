import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, users } from '@/db/schema';
import { asPartner, asStaff, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { withViewer } from './context';
import { getProfile, recordPasswordChanged, setNotificationPrefs, updateProfile } from './account';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('getProfile', () => {
  it('returns the signed-in person with default notification switches', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile).toMatchObject({
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      kind: 'partner',
      role: 'partner_admin',
      partnerName: viewer.partnerName,
      twoFactorEnabled: false,
      passwordChangedAt: null,
      notifications: { decision: true, stage: true, expiry: true, docs: true, team: true },
    });
  });

  it('reads staff profiles with no company', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'india');
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile).toMatchObject({ kind: 'staff', role: 'partner_manager', partnerName: null });
  });

  it('shows stored switches over the defaults and never another person\'s', async () => {
    const mine = await asPartner(db, { role: 'sales' });
    const theirs = await asPartner(db, { partnerId: mine.partnerId, role: 'sales' });
    await withViewer(theirs, (tx) => setNotificationPrefs(tx, theirs, { decision: false, stage: false, expiry: false, docs: true, team: false }));
    const profile = await withViewer(mine, (tx) => getProfile(tx, mine));
    expect(profile.notifications).toEqual({ decision: true, stage: true, expiry: true, docs: true, team: true });
  });
});

describe('updateProfile', () => {
  it('saves a trimmed name, title and phone and clears blanks to null', async () => {
    const viewer = await asPartner(db, {});
    const saved = await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: '  Aditi Rao ', title: ' Head of Alliances ', phone: null }));
    expect(saved).toMatchObject({ name: 'Aditi Rao', title: 'Head of Alliances', phone: null });
    const cleared = await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: 'Aditi Rao', title: '   ', phone: '+91 98450 22617' }));
    expect(cleared).toMatchObject({ title: null, phone: '+91 98450 22617' });
  });

  it('needs a name and changes only the viewer\'s own row', async () => {
    const viewer = await asPartner(db, {});
    const colleague = await makeUser(db, { partnerId: viewer.partnerId, role: 'sales', name: 'Karan Malhotra' });
    await expect(withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: '  ', title: null, phone: null }))).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'name' }] });
    await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: 'New Name', title: null, phone: null }));
    const [other] = await db.select().from(users).where(eq(users.id, colleague.id));
    expect(other?.name).toBe('Karan Malhotra');
  });
});

describe('setNotificationPrefs', () => {
  it('stores one row per category and overwrites on the next call', async () => {
    const viewer = await asPartner(db, {});
    const first = await withViewer(viewer, (tx) => setNotificationPrefs(tx, viewer, { decision: false, stage: true, expiry: true, docs: true, team: false }));
    expect(first).toEqual({ decision: false, stage: true, expiry: true, docs: true, team: false });
    await withViewer(viewer, (tx) => setNotificationPrefs(tx, viewer, { decision: true, stage: true, expiry: true, docs: true, team: false }));
    const rows = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id));
    expect(rows).toHaveLength(5);
    expect(Object.fromEntries(rows.map((r) => [r.category, r.email]))).toEqual({ decision: true, stage: true, expiry: true, docs: true, team: false });
  });
});

describe('recordPasswordChanged', () => {
  it('stamps password_changed_at for the viewer', async () => {
    const viewer = await asPartner(db, {});
    await withViewer(viewer, (tx) => recordPasswordChanged(tx, viewer, clock));
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile.passwordChangedAt).toBe('2026-11-12T10:00:00.000Z');
  });
});
