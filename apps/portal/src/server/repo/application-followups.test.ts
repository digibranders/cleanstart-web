import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { applicationNotes, applications, applicationTokens, invites, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken } from '@/server/auth/tokens';
import { publicActor } from '@/server/auth/types';
import {
  addApplicationNote,
  approveApplication,
  claimInviteReminder,
  createPortalApplication,
  declineApplication,
  getApplicationStatus,
  listApplicationNotes,
  listInviteReminderCandidates,
  type NewApplicationRecord,
  previewApplicantReply,
  requestApplicationInfo,
  submitApplicantReply,
} from './applications';
import { withSystem, withViewer } from './context';
import { findInviteAgainRecipients } from './invites';

const db = testDb();
const actor = publicActor('Neha Joshi');
const day0 = fixedClock('2026-11-12T10:00:00Z');
const at = (iso: string) => fixedClock(iso);

const record = (overrides: Partial<NewApplicationRecord> = {}): NewApplicationRecord => ({
  company: 'Tidewater Infosec',
  domain: 'tidewaterinfosec.in',
  applicantName: 'Neha Joshi',
  email: 'neha.joshi@tidewaterinfosec.in',
  role: 'CTO',
  phone: null,
  category: 'channel',
  region: 'india',
  reason: 'We resell security tooling.',
  source: 'portal',
  sourceRef: null,
  personalEmail: false,
  existingDomain: false,
  vendors: ['CrowdStrike', 'Other: Acme EDR'],
  products: ['images', 'cleansight'],
  companySize: '11 to 50',
  yearsInBusiness: '4 to 10 years',
  verticals: ['Telecom'],
  country: 'IN',
  referralSource: 'Search engine',
  consentAt: new Date('2026-11-12T10:00:00Z'),
  ...overrides,
});

const create = (input: NewApplicationRecord = record()) => withSystem(actor, (tx) => createPortalApplication(tx, actor, input, day0));
const status = (token: string, clock = day0) => withSystem(actor, (tx) => getApplicationStatus(tx, actor, token, clock));

beforeEach(() => resetDb(db));

describe('the new application answers', () => {
  it('are stored and returned, and stay empty for entries that do not carry them', async () => {
    const { application } = await create();
    expect(application).toMatchObject({
      vendors: ['CrowdStrike', 'Other: Acme EDR'],
      products: ['images', 'cleansight'],
      companySize: '11 to 50',
      yearsInBusiness: '4 to 10 years',
      verticals: ['Telecom'],
      country: 'IN',
      referralSource: 'Search engine',
      consentAt: '2026-11-12T10:00:00.000Z',
    });
    const bare = await create(record({ email: 'b@bare.example', vendors: [], products: [], verticals: [], consentAt: null }));
    expect(bare.application).toMatchObject({ vendors: [], products: [], verticals: [], consentAt: null });
  });
});

describe('the applicant status link', () => {
  it('stores only a hash and shows the application, not the applicant', async () => {
    const { application, statusToken } = await create();
    const [stored] = await db.select().from(applicationTokens);
    expect(stored).toMatchObject({ applicationId: application.id, kind: 'status', tokenHash: hashToken(statusToken) });
    expect(JSON.stringify(stored)).not.toContain(statusToken);
    const shown = await status(statusToken);
    expect(shown).toEqual({ state: 'ok', reference: application.reference, company: 'Tidewater Infosec', submittedOn: '2026-11-12', status: 'new', declineReason: null, accountActive: false });
    expect(JSON.stringify(shown)).not.toContain('neha.joshi');
  });

  it('answers unknown for a wrong or oversize token and expired after 30 days', async () => {
    const { statusToken } = await create();
    expect(await status('nope')).toEqual({ state: 'unknown' });
    expect(await status('x'.repeat(500))).toEqual({ state: 'unknown' });
    expect(await status(statusToken, at('2026-12-11T10:00:00Z'))).toMatchObject({ state: 'ok' });
    expect(await status(statusToken, at('2026-12-12T10:00:00Z'))).toEqual({ state: 'expired' });
  });

  it('keeps working after the decision, so the later steps can show', async () => {
    const { application, statusToken } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    await withViewer(staff, (tx) => declineApplication(tx, staff, { id: application.id, reason: 'We have a partner in your region.' }, day0));
    expect(await status(statusToken)).toMatchObject({ state: 'ok', status: 'declined', declineReason: 'We have a partner in your region.' });
  });

  it('shows the account as active once the invite is accepted', async () => {
    const { application, statusToken } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    const approved = await withViewer(staff, (tx) => approveApplication(tx, staff, { id: application.id, category: 'channel', region: 'india' }, day0));
    expect(await status(statusToken)).toMatchObject({ status: 'approved', accountActive: false });
    await db.update(invites).set({ acceptedAt: day0.now() }).where(eq(invites.partnerId, approved.partner.id));
    expect(await status(statusToken)).toMatchObject({ status: 'approved', accountActive: true });
  });

  it('gives a merged resubmission a second working link to the same application', async () => {
    const first = await create();
    const second = await create(record({ reason: 'Updated.' }));
    expect(second.application.id).toBe(first.application.id);
    expect(second.statusToken).not.toBe(first.statusToken);
    expect(await status(first.statusToken)).toMatchObject({ state: 'ok' });
    expect(await status(second.statusToken)).toMatchObject({ state: 'ok' });
  });
});

describe('internal notes', () => {
  it('are added and listed oldest first with the author, for staff only', async () => {
    const { application } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    await withViewer(staff, (tx) => addApplicationNote(tx, staff, { id: application.id, note: '  Called, sounds good.  ' }));
    await withViewer(staff, (tx) => addApplicationNote(tx, staff, { id: application.id, note: 'Check the domain.' }));
    const notes = await withViewer(staff, (tx) => listApplicationNotes(tx, staff, { id: application.id }));
    expect(notes.map((n) => [n.kind, n.note, n.authorName])).toEqual([
      ['internal', 'Called, sounds good.', staff.name],
      ['internal', 'Check the domain.', staff.name],
    ]);
  });

  it('refuse an empty note and an unknown application', async () => {
    const { application } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(staff, (tx) => addApplicationNote(tx, staff, { id: application.id, note: '   ' }))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(staff, (tx) => addApplicationNote(tx, staff, { id: '00000000-0000-0000-0000-000000000000', note: 'x' }))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('are invisible and unwritable for a partner viewer, at the repo and in the database', async () => {
    const { application } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    await withViewer(staff, (tx) => addApplicationNote(tx, staff, { id: application.id, note: 'Internal.' }));
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => listApplicationNotes(tx, partner, { id: application.id }))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(withViewer(partner, (tx) => addApplicationNote(tx, partner, { id: application.id, note: 'x' }))).rejects.toMatchObject({ code: 'forbidden' });
    expect(await withViewer(partner, (tx) => tx.select().from(applicationNotes))).toHaveLength(0);
    await expect(
      withViewer(partner, (tx) => tx.insert(applicationNotes).values({ applicationId: application.id, note: 'sneaky' })),
    ).rejects.toThrow();
    expect(await withViewer(partner, (tx) => tx.select().from(applicationTokens))).toHaveLength(0);
  });
});

describe('request more information and the reply', () => {
  const ask = async (id: string, message = 'Which regions do you cover?') => {
    const staff = await asStaff(db, 'partner_manager', 'india');
    return withViewer(staff, (tx) => requestApplicationInfo(tx, staff, { id, message }, day0));
  };
  const reply = (token: string, message = 'India and the Gulf.', clock = day0) =>
    withSystem(actor, (tx) => submitApplicantReply(tx, actor, { token, message }, clock));

  it('sets info_requested, stores the question and returns a reply token once', async () => {
    const { application } = await create();
    const asked = await ask(application.id);
    expect(asked.application.status).toBe('info_requested');
    const [token] = await db.select().from(applicationTokens).where(eq(applicationTokens.kind, 'reply'));
    expect(token?.tokenHash).toBe(hashToken(asked.replyToken));
    const preview = await withSystem(actor, (tx) => previewApplicantReply(tx, actor, asked.replyToken, day0));
    expect(preview).toEqual({ company: 'Tidewater Infosec', question: 'Which regions do you cover?' });
  });

  it('puts the application back to new on reply, stores the answer and uses the link up', async () => {
    const { application } = await create();
    const { replyToken } = await ask(application.id);
    const back = await reply(replyToken);
    expect(back.status).toBe('new');
    const rows = await db.select().from(applicationNotes).orderBy(applicationNotes.createdAt);
    expect(rows.map((r) => [r.kind, r.authorId === null])).toEqual([['info_request', false], ['applicant_reply', true]]);
    await expect(reply(replyToken)).rejects.toMatchObject({ reason: 'reply_invalid' });
    expect(await withSystem(actor, (tx) => previewApplicantReply(tx, actor, replyToken, day0))).toBeNull();
  });

  it('refuses a wrong, expired or superseded link with the same error', async () => {
    const { application } = await create();
    const first = await ask(application.id, 'First question');
    const second = await ask(application.id, 'Second question');
    await expect(reply(first.replyToken)).rejects.toMatchObject({ reason: 'reply_invalid' });
    await expect(reply('nope')).rejects.toMatchObject({ reason: 'reply_invalid' });
    await expect(reply(second.replyToken, 'late', at('2026-12-13T10:00:00Z'))).rejects.toMatchObject({ reason: 'reply_invalid' });
    await expect(reply(second.replyToken, '   ')).rejects.toMatchObject({ code: 'validation' });
    expect((await reply(second.replyToken)).status).toBe('new');
  });

  it('can still be decided while waiting, and a decided application cannot be asked', async () => {
    const { application } = await create();
    await ask(application.id);
    const staff = await asStaff(db, 'partner_manager', 'india');
    const approved = await withViewer(staff, (tx) => approveApplication(tx, staff, { id: application.id, category: 'channel', region: 'india' }, day0));
    expect(approved.application.status).toBe('approved');
    await expect(ask(application.id)).rejects.toMatchObject({ reason: 'application_not_open' });
  });

  it('merges a resubmission into an application that is waiting for the applicant', async () => {
    const { application } = await create();
    await ask(application.id);
    const again = await create(record({ reason: 'Answered by resubmitting.' }));
    expect(again.merged).toBe(true);
    expect(again.application.status).toBe('new');
    expect(await db.select().from(applications)).toHaveLength(1);
  });
});

describe('the unused invite reminder', () => {
  const approvedWithInvite = async (decidedAt: string) => {
    const { application } = await create();
    const staff = await asStaff(db, 'partner_manager', 'india');
    const done = await withViewer(staff, (tx) => approveApplication(tx, staff, { id: application.id, category: 'channel', region: 'india' }, fixedClock(decidedAt)));
    return { application, partnerId: done.partner.id, firstToken: done.invite.token };
  };
  const candidates = (clock: ReturnType<typeof fixedClock>) => withSystem(actor, (tx) => listInviteReminderCandidates(tx, actor, clock));
  const claim = (id: string, clock: ReturnType<typeof fixedClock>) => withSystem(actor, (tx) => claimInviteReminder(tx, actor, id, clock));

  it('lists an approved application only from day 5 and while the invite is open', async () => {
    const { application } = await approvedWithInvite('2026-11-12T10:00:00Z');
    expect(await candidates(at('2026-11-17T09:59:00Z'))).toEqual([]);
    expect(await candidates(at('2026-11-17T10:00:00Z'))).toEqual([application.id]);
  });

  it('skips accepted and withdrawn invites', async () => {
    const { application, partnerId } = await approvedWithInvite('2026-11-12T10:00:00Z');
    await db.update(invites).set({ acceptedAt: new Date('2026-11-13T10:00:00Z') }).where(eq(invites.partnerId, partnerId));
    expect(await candidates(at('2026-11-20T10:00:00Z'))).toEqual([]);
    await db.update(invites).set({ acceptedAt: null, revokedAt: new Date('2026-11-13T10:00:00Z') }).where(eq(invites.partnerId, partnerId));
    expect(await candidates(at('2026-11-20T10:00:00Z'))).toEqual([]);
    expect(await claim(application.id, at('2026-11-20T10:00:00Z'))).toBeNull();
  });

  it('claims once with a fresh token that replaces the old one', async () => {
    const { application, firstToken } = await approvedWithInvite('2026-11-12T10:00:00Z');
    const now = at('2026-11-18T10:00:00Z');
    const payload = await claim(application.id, now);
    expect(payload).toMatchObject({ email: 'neha.joshi@tidewaterinfosec.in', company: 'Tidewater Infosec' });
    expect(payload?.token).not.toBe(firstToken);
    expect(payload?.expiresAt).toBe('2026-11-25T10:00:00.000Z');
    expect(await claim(application.id, now)).toBeNull();
    expect(await candidates(now)).toEqual([]);
    const [invite] = await db.select().from(invites).where(eq(invites.tokenHash, hashToken(payload?.token ?? '')));
    expect(invite).toBeDefined();
  });
});

describe('findInviteAgainRecipients', () => {
  const find = (token: string, clock = at('2026-11-20T10:00:00Z')) => withSystem(actor, (tx) => findInviteAgainRecipients(tx, actor, token, clock));

  it('names the inviter for an expired invite and nothing for a live or unknown one', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example' });
    const dead = await makeInvite(db, { partnerId: partner.id, invitedBy: admin.id, expiresAt: new Date('2026-11-10T00:00:00Z'), email: 'late@kestrel.example' });
    const found = await find(dead.token);
    expect(found).toMatchObject({ inviteEmail: 'late@kestrel.example', partnerName: 'Kestrel Systems' });
    expect(found?.recipients.map((r) => r.userId)).toEqual([admin.id]);
    const live = await makeInvite(db, { partnerId: partner.id, invitedBy: admin.id });
    expect(await find(live.token)).toBeNull();
    expect(await find('nope')).toBeNull();
  });

  it('falls back to the partner admins when the inviter is gone, then to the partner managers', async () => {
    const partner = await makePartner(db, {});
    const gone = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const dead = await makeInvite(db, { partnerId: partner.id, invitedBy: gone.id, revokedAt: new Date('2026-11-11T00:00:00Z') });
    expect((await find(dead.token))?.recipients.map((r) => r.userId)).toEqual([admin.id]);
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, admin.id));
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    expect((await find(dead.token))?.recipients.map((r) => r.userId)).toEqual([manager.id]);
  });
});
