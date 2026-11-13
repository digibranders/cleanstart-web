import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, invites, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

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
vi.mock('@/server/email/send', async () => {
  const { FakeEmailTransport } = await import('@/server/email/fake');
  const fake = new FakeEmailTransport();
  return { sendEmail: (message: EmailMessage) => fake.send(message), fake };
});
vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));

import { revokeAllSessions } from '@/server/auth/sessions';
import {
  changeStaffRegionAction,
  changeStaffRoleAction,
  inviteStaffAction,
  removeStaffAction,
  resendStaffInviteAction,
} from './staff';

const db = testDb();
let fake: FakeEmailTransport;
const future = new Date('2099-01-01T00:00:00Z');

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  vi.mocked(revokeAllSessions).mockClear();
  harness.viewer = await asStaff(db, 'partner_manager', 'india');
});

const events = async () => (await db.select().from(auditLog)).map((a) => a.event).sort();

describe('inviteStaffAction', () => {
  it('invites a teammate: staff invite row, audit and an email with a link', async () => {
    const result = await inviteStaffAction({ name: 'Kunal Shah', email: 'Kunal.Shah@cleanstart.com', role: 'sales', region: 'india' });
    expect(result).toMatchObject({ ok: true, data: { email: 'kunal.shah@cleanstart.com', kind: 'staff', role: 'sales', staffRegion: 'india' } });
    expect(JSON.stringify(result)).not.toContain('token');
    expect(await events()).toEqual(['staff.invited']);
    expect((await db.select().from(auditLog))[0]?.target).toBe('Kunal Shah, sales, India');
    const mail = fake.only('kunal.shah@cleanstart.com');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=[A-Za-z0-9_-]{43}/u);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('is only for partner managers: staff sales, marketing and partner viewers are refused', async () => {
    for (const viewer of [await asStaff(db, 'sales', 'india'), await asStaff(db, 'marketing', 'all'), await asPartner(db, { role: 'partner_admin' })]) {
      harness.viewer = viewer;
      expect(await inviteStaffAction({ name: 'X', email: 'x@cleanstart.com', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    expect(await db.select().from(invites)).toHaveLength(0);
    expect(fake.sent).toHaveLength(0);
  });

  it('reports an existing login and validates the input', async () => {
    const teammate = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', email: 'rahul@cleanstart.com' });
    expect(await inviteStaffAction({ name: 'Rahul', email: teammate.email, role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await inviteStaffAction({ name: '  ', email: 'a@cleanstart.com', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await inviteStaffAction({ name: 'A', email: 'nope', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await inviteStaffAction({ name: 'A', email: 'a@cleanstart.com', role: 'partner_admin', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('resendStaffInviteAction', () => {
  it('sends a new link and audits it', async () => {
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    expect(await resendStaffInviteAction({ inviteId: invite.id })).toMatchObject({ ok: true, data: { id: invite.id, resentCount: 1 } });
    expect(fake.only('kunal.shah@cleanstart.com').htmlContent).toMatch(/accept-invite\?token=/u);
    expect(await events()).toEqual(['staff.invite_resent']);
  });
});

describe('changeStaffRoleAction and changeStaffRegionAction', () => {
  it('changes a role and a region with audit notes', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon' });
    expect(await changeStaffRoleAction({ userId: rahul.id, role: 'marketing' })).toMatchObject({ ok: true, data: { role: 'marketing' } });
    expect(await changeStaffRegionAction({ userId: rahul.id, region: 'middle_east' })).toMatchObject({ ok: true, data: { region: 'middle_east' } });
    const notes = Object.fromEntries((await db.select().from(auditLog)).map((e) => [e.event, e.note]));
    expect(notes).toEqual({ 'staff.role_changed': 'Sales to Marketing.', 'staff.region_changed': 'India to Middle East.' });
  });

  it('refuses to change your own role', async () => {
    const me = harness.viewer as Viewer;
    expect(await changeStaffRoleAction({ userId: me.id, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot change your own access.' } });
  });

  it('is only for partner managers', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    harness.viewer = await asStaff(db, 'marketing', 'all');
    expect(await changeStaffRoleAction({ userId: rahul.id, role: 'marketing' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await changeStaffRegionAction({ userId: rahul.id, region: 'all' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('removeStaffAction', () => {
  it('removes a teammate, signs them out and audits it', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon' });
    expect(await removeStaffAction({ id: rahul.id })).toMatchObject({ ok: true });
    expect(revokeAllSessions).toHaveBeenCalledWith(rahul.id);
    expect(await events()).toEqual(['staff.removed']);
    const [row] = await db.select().from(users).where(eq(users.id, rahul.id));
    expect(row?.status).toBe('disabled');
  });

  it('withdraws an unaccepted invite without touching sessions, and refuses removing yourself', async () => {
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    expect(await removeStaffAction({ id: invite.id })).toMatchObject({ ok: true });
    expect(revokeAllSessions).not.toHaveBeenCalled();
    expect(await removeStaffAction({ id: (harness.viewer as Viewer).id })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot remove yourself.' } });
  });
});
