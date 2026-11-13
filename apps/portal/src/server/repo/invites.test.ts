import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import { asPartner, asStaff, makeApplication, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken, INVITE_TTL_DAYS } from '@/server/auth/tokens';
import { publicActor } from '@/server/auth/types';
import { withSystem, withViewer } from './context';
import { type AcceptInviteInput, acceptInvite, createInvite, listOpenInvites, previewInvite, resendInvite, revokeInvite } from './invites';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Invitee');
const future = new Date('2026-11-19T10:00:00Z');

const preview = (token: string) => withSystem(actor, (tx) => previewInvite(tx, actor, token, clock));
const accept = (token: string, overrides: Partial<AcceptInviteInput> = {}) =>
  withSystem(actor, (tx) =>
    acceptInvite(tx, actor, { token, name: 'Yasmin Haddad', passwordHash: 'scrypt$test$hash', acceptAgreement: true, agreementVersion: 'draft-0', ...overrides }, clock),
  );
const tamper = (token: string): string => `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;

beforeEach(async () => {
  await resetDb(db);
});

const firstAdmin = async (email = 'yasmin.haddad@qamarsolutions.ae') => {
  const partner = await makePartner(db, { name: 'Qamar Solutions', domain: 'qamarsolutions.ae', status: 'onboarding' });
  const made = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email, expiresAt: future });
  return { partner, ...made };
};

describe('previewInvite', () => {
  it('describes a valid invite for a new partner admin, including the agreement need and a suggested name', async () => {
    const { partner, token } = await firstAdmin();
    await makeApplication(db, { partnerId: partner.id, status: 'approved', applicantName: 'Yasmin Haddad', email: 'yasmin.haddad@qamarsolutions.ae', source: 'portal' });
    expect(await preview(token)).toEqual({
      state: 'ok',
      email: 'yasmin.haddad@qamarsolutions.ae',
      kind: 'partner',
      role: 'partner_admin',
      partnerName: 'Qamar Solutions',
      name: 'Yasmin Haddad',
      needsAgreement: true,
    });
  });

  it('does not ask a second admin of an active partner to accept the agreement again', async () => {
    const partner = await makePartner(db, { status: 'active' });
    await db.update(partners).set({ agreementVersion: '1.2', agreementAcceptedAt: new Date('2026-03-12T00:00:00Z') }).where(eq(partners.id, partner.id));
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'second@example.com', expiresAt: future });
    expect(await preview(token)).toMatchObject({ state: 'ok', needsAgreement: false, agreementVersion: '1.2' });
  });

  it('gives each failure its own state: unknown (tampered), expired, used and revoked', async () => {
    const partner = await makePartner(db, {});
    const make = (extra: { expiresAt?: Date; acceptedAt?: Date; revokedAt?: Date }) =>
      makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random().toString(36).slice(2)}@example.com`, expiresAt: future, ...extra });
    const ok = await make({});
    expect(await preview(tamper(ok.token))).toEqual({ state: 'unknown' });
    expect(await preview('')).toEqual({ state: 'unknown' });
    expect(await preview('x'.repeat(500))).toEqual({ state: 'unknown' });
    expect(await preview((await make({ expiresAt: new Date('2026-11-01T00:00:00Z') })).token)).toEqual({ state: 'expired' });
    expect(await preview((await make({ acceptedAt: new Date('2026-11-05T00:00:00Z') })).token)).toEqual({ state: 'used' });
    expect(await preview((await make({ revokedAt: new Date('2026-11-05T00:00:00Z') })).token)).toEqual({ state: 'revoked' });
  });
});

describe('acceptInvite', () => {
  it('creates the active user, the credential account and stamps the agreement for a first admin', async () => {
    const { partner, invite, token } = await firstAdmin();
    const result = await accept(token);
    expect(result).toMatchObject({ email: 'yasmin.haddad@qamarsolutions.ae', kind: 'partner', role: 'partner_admin', partnerId: partner.id, partnerName: 'Qamar Solutions', agreementAccepted: true });
    const [user] = await db.select().from(users).where(eq(users.id, result.userId));
    expect(user).toMatchObject({ name: 'Yasmin Haddad', status: 'active', emailVerified: true, kind: 'partner', partnerId: partner.id, role: 'partner_admin' });
    expect(user?.passwordChangedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, result.userId));
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ providerId: 'credential', accountId: result.userId, password: 'scrypt$test$hash' });
    const [stamped] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(stamped).toMatchObject({ agreementVersion: 'draft-0' });
    expect(stamped?.agreementAcceptedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const [used] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(used?.acceptedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    expect(used?.userId).toBe(result.userId);
  });

  it('is single use: the second attempt fails as used, also when two arrive at once', async () => {
    const { token } = await firstAdmin();
    await accept(token);
    await expect(accept(token)).rejects.toMatchObject({ reason: 'invite_used' });
  });

  it('lets exactly one of two simultaneous accepts win', async () => {
    const { token } = await firstAdmin();
    const results = await Promise.allSettled([accept(token), accept(token)]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    const lost = results.find((r) => r.status === 'rejected');
    expect(lost && lost.status === 'rejected' && (lost.reason as { reason?: string }).reason).toBe('invite_used');
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it('fails with a distinct reason for tampered, expired and withdrawn tokens and consumes nothing', async () => {
    const partner = await makePartner(db, {});
    const make = (extra: { expiresAt?: Date; acceptedAt?: Date; revokedAt?: Date }) =>
      makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random().toString(36).slice(2)}@example.com`, expiresAt: future, ...extra });
    const good = await make({});
    await expect(accept(tamper(good.token))).rejects.toMatchObject({ reason: 'invite_unknown' });
    await expect(accept((await make({ expiresAt: new Date('2026-11-01T00:00:00Z') })).token)).rejects.toMatchObject({ reason: 'invite_expired' });
    await expect(accept((await make({ revokedAt: new Date('2026-11-05T00:00:00Z') })).token)).rejects.toMatchObject({ reason: 'invite_revoked' });
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('refuses a first admin who does not accept the agreement, without consuming the invite', async () => {
    const { invite, token } = await firstAdmin();
    await expect(accept(token, { acceptAgreement: false })).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'acceptAgreement' }] });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.acceptedAt).toBeNull();
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('refuses an empty name', async () => {
    const { token } = await firstAdmin();
    await expect(accept(token, { name: '   ' })).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'name' }] });
  });

  it('refuses an email that already has an active login and leaves the invite open', async () => {
    const { partner, invite, token } = await firstAdmin();
    await makeUser(db, { partnerId: partner.id, email: 'yasmin.haddad@qamarsolutions.ae', status: 'active' });
    await expect(accept(token)).rejects.toMatchObject({ reason: 'already_has_login' });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.acceptedAt).toBeNull();
  });

  it('gives a removed person their account back with the new password and no two-step secret', async () => {
    const partner = await makePartner(db, { status: 'active' });
    const gone = await makeUser(db, { partnerId: partner.id, email: 'back@example.com', status: 'disabled', role: 'sales', password: 'OldPassw0rd!' });
    await db.insert(authTwoFactors).values({ secret: 's', backupCodes: 'b', userId: gone.id });
    await db.update(users).set({ removedAt: new Date('2026-10-01T00:00:00Z'), twoFactorEnabled: true }).where(eq(users.id, gone.id));
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'back@example.com', expiresAt: future });
    const result = await accept(token, { name: 'Back Again' });
    expect(result.userId).toBe(gone.id);
    const [user] = await db.select().from(users).where(eq(users.id, gone.id));
    expect(user).toMatchObject({ status: 'active', removedAt: null, role: 'technical', name: 'Back Again', twoFactorEnabled: false });
    const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, gone.id));
    expect(accounts.map((a) => a.password)).toEqual(['scrypt$test$hash']);
    expect(await db.select().from(authTwoFactors).where(eq(authTwoFactors.userId, gone.id))).toHaveLength(0);
  });

  it('creates the staff scope for a staff invite and no agreement is stamped', async () => {
    const { token } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'middle_east', email: 'sara@cleanstart.com', expiresAt: future });
    const result = await accept(token, { name: 'Sara Al Mansoori' });
    expect(result).toMatchObject({ kind: 'staff', role: 'sales', partnerId: null, partnerName: null, agreementAccepted: false });
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, result.userId));
    expect(scope?.region).toBe('middle_east');
  });
});

describe('createInvite', () => {
  it('lets a partner admin invite into their own company and returns the token once', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const created = await withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: ' Meera.Pillai@Kestrel.example ', role: 'sales' }, clock));
    expect(created.invite).toMatchObject({ email: 'meera.pillai@kestrel.example', role: 'sales', kind: 'partner', partnerId: partner.id, state: 'ok' });
    const [row] = await db.select().from(invites).where(eq(invites.id, created.invite.id));
    expect(row?.tokenHash).toBe(hashToken(created.token));
    expect(row?.invitedBy).toBe(admin.id);
    expect(row?.expiresAt.getTime()).toBe(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000);
  });

  it('refuses another company for a partner viewer, a bad email, and a person who already has a login', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: other.id, email: 'a@b.example', role: 'sales' }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: 'nope', role: 'sales' }, clock))).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'email' }] });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: admin.email, role: 'sales' }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
  });

  it('lets a partner manager invite anywhere and create staff invites; partner viewers cannot', async () => {
    const partner = await makePartner(db, {});
    const manager = await asStaff(db, 'partner_manager', 'india');
    const forPartner = await withViewer(manager, (tx) => createInvite(tx, manager, { kind: 'partner', partnerId: partner.id, email: 'x@p.example', role: 'technical' }, clock));
    expect(forPartner.invite.partnerId).toBe(partner.id);
    const staff = await withViewer(manager, (tx) => createInvite(tx, manager, { kind: 'staff', email: 'kunal@cleanstart.com', role: 'sales', region: 'india' }, clock));
    expect(staff.invite).toMatchObject({ kind: 'staff', partnerId: null, staffRegion: 'india', role: 'sales' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'staff', email: 'y@cleanstart.com', role: 'sales', region: 'india' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('resendInvite and revokeInvite', () => {
  it('resending replaces the token, extends the expiry and counts it; the old link stops working', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'v@p.example', expiresAt: new Date('2026-11-13T00:00:00Z') });
    const resent = await withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: invite.id }, clock));
    expect(resent.invite).toMatchObject({ id: invite.id, resentCount: 1, state: 'ok' });
    expect(resent.invite.expiresAt).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    expect(resent.token).not.toBe(token);
    expect(await preview(token)).toEqual({ state: 'unknown' });
    expect(await preview(resent.token)).toMatchObject({ state: 'ok' });
  });

  it('refuses to resend or revoke an accepted or withdrawn invite, or one at another company', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const used = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'u@p.example', expiresAt: future, acceptedAt: new Date('2026-11-05T00:00:00Z') });
    const revoked = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'r@p.example', expiresAt: future, revokedAt: new Date('2026-11-05T00:00:00Z') });
    const foreign = await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'f@o.example', expiresAt: future });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: used.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_used' });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: revoked.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_revoked' });
    await expect(withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: used.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_used' });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: foreign.invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: foreign.invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    const [untouched] = await db.select().from(invites).where(eq(invites.id, foreign.invite.id));
    expect(untouched?.revokedAt).toBeNull();
  });

  it('revoking withdraws the invite so its link reports as withdrawn', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'w@p.example', expiresAt: future });
    const dto = await withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: invite.id }, clock));
    expect(dto.state).toBe('revoked');
    expect(await preview(token)).toEqual({ state: 'revoked' });
  });

  it('only a partner manager touches staff invites', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    expect((await withViewer(manager, (tx) => resendInvite(tx, manager, { inviteId: invite.id }, clock))).invite.resentCount).toBe(1);
  });
});

describe('listOpenInvites', () => {
  it('lists the open invites of the viewer company, newest first, including expired ones', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const first = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'a@p.example', expiresAt: future, createdAt: new Date('2026-11-01T00:00:00Z') });
    const second = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'b@p.example', expiresAt: new Date('2026-11-02T00:00:00Z'), createdAt: new Date('2026-11-02T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'c@p.example', expiresAt: future, acceptedAt: new Date('2026-11-03T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'd@o.example', expiresAt: future });
    const list = await withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'partner' }, clock));
    expect(list.map((i) => [i.id, i.state])).toEqual([[second.invite.id, 'expired'], [first.invite.id, 'ok']]);
    await expect(withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'partner', partnerId: other.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'staff' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('lists staff invites for a partner manager', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    const list = await withViewer(manager, (tx) => listOpenInvites(tx, manager, { kind: 'staff' }, clock));
    expect(list.map((i) => i.id)).toEqual([invite.id]);
  });
});
