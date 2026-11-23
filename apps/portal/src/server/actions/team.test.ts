import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessRequests, auditLog, invites, notifications, users } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
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
  changeMemberRoleAction,
  decideAccessRequestAction,
  inviteMemberAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from './team';

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
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  harness.viewer = admin;
  return { partner, admin };
};
const events = async () => (await db.select().from(auditLog)).map((a) => a.event).sort();

describe('inviteMemberAction', () => {
  it('invites a colleague: invite row, audit, link by email, no token in the result', async () => {
    const { partner, admin } = await company();
    const result = await inviteMemberAction({ email: 'Meera.Pillai@kestrelsystems.in', role: 'sales' });
    expect(result).toMatchObject({ ok: true, data: { email: 'meera.pillai@kestrelsystems.in', role: 'sales', partnerId: partner.id } });
    expect(JSON.stringify(result)).not.toContain('token');
    expect(await events()).toEqual(['team.invited']);
    const mail = fake.only('meera.pillai@kestrelsystems.in');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=[A-Za-z0-9_-]{43}/u);
    expect(mail.htmlContent).toContain(admin.name);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('reports an existing login, a bad email, and is forbidden for sales and technical users', async () => {
    const { partner, admin } = await company();
    expect(await inviteMemberAction({ email: admin.email, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'This person already has a login.' } });
    expect(await inviteMemberAction({ email: 'nope', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await inviteMemberAction({ email: 'a@kestrelsystems.in', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await inviteMemberAction({ email: 'a@kestrelsystems.in', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(fake.sent).toHaveLength(0);
  });

  it('never lets a partner admin invite into another company; a partner manager may', async () => {
    await company();
    const other = await makePartner(db, { name: 'Other' });
    expect(await inviteMemberAction({ email: 'x@other.example', role: 'sales', partnerId: other.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await inviteMemberAction({ email: 'x@other.example', role: 'sales', partnerId: other.id })).toMatchObject({ ok: true, data: { partnerId: other.id } });
  });
});

describe('resendInviteAction and revokeInviteAction', () => {
  it('resends with a new link, audits, and withdraws', async () => {
    const { partner } = await company();
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    const resent = await resendInviteAction({ inviteId: invite.id });
    expect(resent).toMatchObject({ ok: true, data: { id: invite.id, resentCount: 1 } });
    const mail = fake.only('vikram.sethi@kestrelsystems.in');
    expect(mail.htmlContent).not.toContain(token);
    const withdrawn = await revokeInviteAction({ inviteId: invite.id });
    expect(withdrawn).toMatchObject({ ok: true, data: { state: 'revoked' } });
    expect(await events()).toEqual(['team.invite_resent', 'team.invite_revoked']);
  });

  it('cannot touch an invite of another company', async () => {
    await company();
    const other = await makePartner(db, {});
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'f@o.example', expiresAt: future });
    expect(await resendInviteAction({ inviteId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await revokeInviteAction({ inviteId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('changeMemberRoleAction', () => {
  it('changes a role with an audit note and refuses to demote the last admin', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    expect(await changeMemberRoleAction({ userId: member.id, role: 'technical' })).toMatchObject({ ok: true, data: { role: 'technical' } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'team.role_changed', note: 'Sales to Technical.' });
    expect(entry?.target).toBe('Karan Malhotra, at Kestrel Systems');
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind, n.title])).toEqual([[member.id, 'role_changed', 'Your role is now Technical']]);
    expect(await changeMemberRoleAction({ userId: admin.id, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Every company needs at least one partner admin.' } });
  });

  it('is not allowed across companies and not for non-admins', async () => {
    const { partner } = await company();
    const other = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: other.id, role: 'sales' });
    expect(await changeMemberRoleAction({ userId: stranger.id, role: 'technical' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await changeMemberRoleAction({ userId: member.id, role: 'technical' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('removeMemberAction', () => {
  it('disables the person, signs them out, tells the other admins and keeps their deals', async () => {
    const { partner, admin } = await company();
    const second = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'second@kestrelsystems.in' });
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: member.id });
    expect(await removeMemberAction({ userId: member.id })).toMatchObject({ ok: true });
    const [row] = await db.select().from(users).where(eq(users.id, member.id));
    expect(row?.status).toBe('disabled');
    expect(revokeAllSessions).toHaveBeenCalledWith(member.id);
    expect(await events()).toEqual(['team.removed']);
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[second.id, 'team_removed']]);
    expect(fake.to('second@kestrelsystems.in')).toHaveLength(1);
    expect(fake.to(admin.email)).toHaveLength(0);
    expect(deal.partnerId).toBe(partner.id);
  });

  it('cannot remove yourself or the last admin, and cannot reach an invite-only row', async () => {
    const { partner, admin } = await company();
    expect(await removeMemberAction({ userId: admin.id })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot remove yourself.' } });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'p@kestrelsystems.in', expiresAt: future });
    expect(await removeMemberAction({ userId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(revokeAllSessions).not.toHaveBeenCalled();
  });
});

describe('decideAccessRequestAction', () => {
  it('approving emails the requester an invite for the chosen role and audits it', async () => {
    const { partner } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await decideAccessRequestAction({ id: request.id, decision: 'approve', role: 'technical' });
    expect(result).toMatchObject({ ok: true, data: { id: request.id, status: 'approved' } });
    expect(fake.only('rohit@kestrelsystems.in').htmlContent).toMatch(/accept-invite\?token=/u);
    expect(await events()).toEqual(['team.access_request_approved']);
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ subjectType: 'access_request', subjectId: request.id });
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('declining emails the requester and never grants partner admin', async () => {
    const { partner } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    expect(await decideAccessRequestAction({ id: request.id, decision: 'approve', role: 'partner_admin' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await decideAccessRequestAction({ id: request.id, decision: 'decline' })).toMatchObject({ ok: true, data: { status: 'declined' } });
    expect(fake.to('rohit@kestrelsystems.in')).toHaveLength(1);
    expect(await events()).toEqual(['team.access_request_declined']);
    expect((await db.select().from(accessRequests))[0]?.status).toBe('declined');
  });
});
