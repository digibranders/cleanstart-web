import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, notificationPrefs, users } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-portal-client-ip': harness.ip }),
  cookies: async () => ({
    set: (name: string, value: string) => void harness.cookieJar.set(name, value),
    get: (name: string) => (harness.cookieJar.has(name) ? { value: harness.cookieJar.get(name) } : undefined),
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', async () => {
  const { UnauthenticatedError } = await import('@/server/errors');
  return {
    requireActionViewer: async () => {
      if (!harness.viewer) throw new UnauthenticatedError();
      return harness.viewer;
    },
  };
});
vi.mock('@/server/auth/sessions', () => ({
  revokeSession: vi.fn(async () => undefined),
  revokeAllSessions: vi.fn(async () => undefined),
  listSessions: vi.fn(async () => []),
}));

import { revokeSession } from '@/server/auth/sessions';
import { revokeSessionAction, setNotificationPrefsAction, updateProfileAction } from './account';

const db = testDb();
const SESSION_ID = '4f0c2c1e-8a5e-4a52-9f8e-6f3b6a0c7d11';

beforeEach(async () => {
  await resetDb(db);
  harness.viewer = null;
  vi.mocked(revokeSession).mockClear();
});

describe('updateProfileAction', () => {
  it('saves the profile for any role, partner or staff', async () => {
    for (const viewer of [await asPartner(db, { role: 'technical' }), await asStaff(db, 'marketing', 'all')]) {
      harness.viewer = viewer;
      const result = await updateProfileAction({ name: ' New Name ', title: 'Head', phone: '' });
      expect(result).toMatchObject({ ok: true, data: { name: 'New Name', title: 'Head', phone: null } });
      const [row] = await db.select().from(users).where(eq(users.id, viewer.id));
      expect(row?.name).toBe('New Name');
    }
  });

  it('needs a name and a signed-in person', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await updateProfileAction({ name: '  ', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'name' }] } });
    harness.viewer = null;
    expect(await updateProfileAction({ name: 'x', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
  });
});

describe('setNotificationPrefsAction', () => {
  it('stores the five switches', async () => {
    const viewer = await asPartner(db, {});
    harness.viewer = viewer;
    const next = { decision: false, stage: true, expiry: false, docs: true, team: true };
    expect(await setNotificationPrefsAction(next)).toEqual({ ok: true, data: next });
    expect(await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id))).toHaveLength(5);
  });

  it('rejects a missing switch', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await setNotificationPrefsAction({ decision: true })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('revokeSessionAction', () => {
  it('signs out one of the viewer\'s own sessions and audits it', async () => {
    const viewer = await asPartner(db, {});
    harness.viewer = viewer;
    expect(await revokeSessionAction({ sessionId: SESSION_ID })).toEqual({ ok: true, data: { sessionId: SESSION_ID } });
    expect(revokeSession).toHaveBeenCalledWith(viewer.id, SESSION_ID);
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['account.session_revoked']);
  });

  it('rejects a malformed session id before touching anything', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await revokeSessionAction({ sessionId: 'nope' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
