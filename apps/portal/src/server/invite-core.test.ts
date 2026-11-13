import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites } from '@/db/schema';
import { makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken, INVITE_TTL_DAYS } from '@/server/auth/tokens';
import { withSystem } from '@/server/repo/context';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { issueInvite, rotateInviteToken, toInviteDto } from './invite-core';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = SYSTEM_ACTORS.portal;
const issue = (input: Parameters<typeof issueInvite>[1]) => withSystem(actor, (tx) => issueInvite(tx, input, clock));

beforeEach(async () => {
  await resetDb(db);
});

describe('issueInvite', () => {
  it('stores only the SHA-256 of a 32 byte token and expires in 7 days', async () => {
    const partner = await makePartner(db, {});
    const { invite, token } = await issue({ kind: 'partner', partnerId: partner.id, email: ' New.Person@Example.com ', role: 'sales', staffRegion: null, invitedBy: null });
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.tokenHash).toBe(hashToken(token));
    expect(row?.tokenHash).not.toContain(token);
    expect(row?.email).toBe('new.person@example.com');
    expect(row?.expiresAt.toISOString()).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    expect(invite).toMatchObject({ state: 'ok', resentCount: 0, role: 'sales', kind: 'partner' });
  });

  it('revokes an earlier open invite for the same email and company', async () => {
    const partner = await makePartner(db, {});
    const first = await issue({ kind: 'partner', partnerId: partner.id, email: 'a@example.com', role: 'sales', staffRegion: null, invitedBy: null });
    const second = await issue({ kind: 'partner', partnerId: partner.id, email: 'a@example.com', role: 'technical', staffRegion: null, invitedBy: null });
    const [old] = await db.select().from(invites).where(eq(invites.id, first.invite.id));
    expect(old?.revokedAt).not.toBeNull();
    expect(second.invite.role).toBe('technical');
  });

  it('refuses an email that already has an active login but allows a removed person', async () => {
    const partner = await makePartner(db, {});
    await makeUser(db, { partnerId: partner.id, email: 'taken@example.com', status: 'active' });
    await expect(issue({ kind: 'partner', partnerId: partner.id, email: 'taken@example.com', role: 'sales', staffRegion: null, invitedBy: null })).rejects.toMatchObject({ reason: 'already_has_login' });
    await makeUser(db, { partnerId: partner.id, email: 'gone@example.com', status: 'disabled' });
    await expect(issue({ kind: 'partner', partnerId: partner.id, email: 'gone@example.com', role: 'sales', staffRegion: null, invitedBy: null })).resolves.toMatchObject({ invite: { state: 'ok' } });
  });

  it('issues a staff invite with a region and no partner', async () => {
    const { invite } = await issue({ kind: 'staff', partnerId: null, email: 'staff@cleanstart.com', role: 'sales', staffRegion: 'india', invitedBy: null });
    expect(invite).toMatchObject({ kind: 'staff', partnerId: null, staffRegion: 'india' });
  });
});

describe('rotateInviteToken', () => {
  it('replaces the token, extends the expiry and counts the resend', async () => {
    const partner = await makePartner(db, {});
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'r@example.com', expiresAt: new Date('2026-11-13T00:00:00Z') });
    const rotated = await withSystem(actor, (tx) => rotateInviteToken(tx, invite.id, clock));
    expect(rotated?.token).not.toBe(token);
    expect(rotated?.invite.resentCount).toBe(1);
    expect(rotated?.invite.expiresAt).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.tokenHash).toBe(hashToken(rotated?.token ?? ''));
    expect(row?.tokenHash).not.toBe(hashToken(token));
  });

  it('returns null for an accepted or revoked invite', async () => {
    const partner = await makePartner(db, {});
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'x@example.com', revokedAt: new Date('2026-11-01T00:00:00Z'), expiresAt: new Date('2026-11-20T00:00:00Z') });
    expect(await withSystem(actor, (tx) => rotateInviteToken(tx, invite.id, clock))).toBeNull();
  });
});

describe('toInviteDto', () => {
  it('reports expired, used and revoked states', async () => {
    const partner = await makePartner(db, {});
    const make = async (extra: { expiresAt?: Date; acceptedAt?: Date; revokedAt?: Date }) => (await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random()}@example.com`, expiresAt: new Date('2026-11-20T00:00:00Z'), ...extra })).invite;
    const now = clock.now();
    expect(toInviteDto(await make({ expiresAt: new Date('2026-11-01T00:00:00Z') }), now).state).toBe('expired');
    expect(toInviteDto(await make({ acceptedAt: new Date('2026-11-05T00:00:00Z') }), now).state).toBe('used');
    expect(toInviteDto(await make({ revokedAt: new Date('2026-11-05T00:00:00Z') }), now).state).toBe('revoked');
    expect(toInviteDto(await make({}), now).state).toBe('ok');
  });
});
