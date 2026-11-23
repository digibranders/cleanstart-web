import { and, asc, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import { auditLog, invites, partnerChecklist, partners, registrations, staffScopes, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { CHECKLIST_STEPS, type ChecklistStep, type PartnerCategory, type PartnerRegion, type PartnerStatus, type StaffRegion } from '@/lib/domain';
import type { ChecklistDto, CompanyDto, CreatedInviteDto, IsoTimestamp, PartnerDetailDto, PartnerListRow } from '@/lib/dto';
import { emailDomain, isPlausibleDomain, isValidEmail, nameFromEmail, normaliseDomain, staffTeamLabel } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite, rotateInviteToken } from '@/server/invite-core';
import { loadPartnerPeople } from '@/server/partner-people';
import { assertActiveManager, insertOnboardingPartner, pickManagerId } from '@/server/partner-routing';
import { partnerListRows } from '@/server/partner-rows';
import { iso } from '@/server/people';
import { resolvePartnerScope } from '@/server/partner-scope';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

type PartnerRow = typeof partners.$inferSelect;

const toCompany = async (tx: Tx, p: PartnerRow): Promise<CompanyDto> => {
  const [manager] = p.managerId
    ? await tx
        .select({ id: users.id, name: users.name, email: users.email, region: staffScopes.region })
        .from(users)
        .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
        .where(eq(users.id, p.managerId))
        .limit(1)
    : [];
  return {
    partnerId: p.id,
    name: p.name,
    domain: p.domain,
    category: p.category,
    region: p.region,
    status: p.status,
    website: p.website,
    phone: p.phone,
    address: p.address,
    about: p.about,
    tier: null,
    since: p.createdAt.toISOString().slice(0, 10),
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email, team: staffTeamLabel(manager.region) } : null,
    agreementVersion: p.agreementVersion,
    agreementAcceptedAt: iso(p.agreementAcceptedAt),
  };
};

/** Partner viewers: their own company. Staff: pass partnerId. Staff sales only see partners in their region. (M1.5, M1.7) */
export async function getCompany(tx: Tx, viewer: Viewer, input: { partnerId?: string }): Promise<CompanyDto> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [partner] = await tx.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');
  if (viewer.kind === 'staff' && viewer.role === 'sales' && viewer.region !== 'all' && partner.region !== viewer.region) {
    throw new NotFoundError('partner');
  }
  return toCompany(tx, partner);
}

const blank = (value: string | null): string | null => value?.trim() || null;

/** Partner admin on own company, partner manager on any. Returns the row after the update; its updatedAt is the outbox version. (M1.7) */
export async function updateCompanyProfile(
  tx: Tx,
  viewer: Viewer,
  input: { partnerId?: string; website: string | null; phone: string | null; address: string | null; about: string | null },
): Promise<{ company: CompanyDto; updatedAt: IsoTimestamp }> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [row] = await tx
    .update(partners)
    .set({ website: blank(input.website), phone: blank(input.phone), address: blank(input.address), about: blank(input.about) })
    .where(eq(partners.id, partnerId))
    .returning();
  if (!row) throw new NotFoundError('partner');
  return { company: await toCompany(tx, row), updatedAt: row.updatedAt.toISOString() };
}

/** The welcome checklist of the viewer's partner (M1.5). Partner viewers only. */
export async function getChecklist(tx: Tx, viewer: Viewer): Promise<ChecklistDto> {
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  const [partner] = await tx.select().from(partners).where(eq(partners.id, viewer.partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');

  const members = await tx
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.partnerId, partner.id), ne(users.status, 'disabled')));
  const open = await tx
    .select({ email: invites.email })
    .from(invites)
    .where(and(eq(invites.partnerId, partner.id), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
  const people = new Set([...members.map((m) => m.email), ...open.map((i) => i.email)]);
  const [anyDeal] = await tx.select({ id: registrations.id }).from(registrations).where(eq(registrations.partnerId, partner.id)).limit(1);
  const stored = await tx.select().from(partnerChecklist).where(eq(partnerChecklist.partnerId, partner.id));

  const derived: Record<ChecklistStep, { done: boolean; doneAt: string | null } | undefined> = {
    agreement: { done: partner.agreementAcceptedAt !== null, doneAt: iso(partner.agreementAcceptedAt) },
    company: { done: Boolean(partner.website?.trim() && partner.about?.trim()), doneAt: null },
    team: { done: people.size >= 2, doneAt: null },
    kickoff: undefined,
    playbook: undefined,
    deal: { done: anyDeal !== undefined, doneAt: null },
  };
  const steps = CHECKLIST_STEPS.map((step) => {
    const computed = derived[step];
    if (computed) return { step, ...computed };
    const row = stored.find((s) => s.step === step);
    return { step, done: row !== undefined, doneAt: row ? row.doneAt.toISOString() : null };
  });
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, percent: Math.round((doneCount / steps.length) * 100) };
}

/** Ticks 'kickoff' or 'playbook' (the only stored steps). Idempotent: the first tick time is kept. */
export async function tickChecklistStep(
  tx: Tx,
  viewer: Viewer,
  input: { step: Extract<ChecklistStep, 'kickoff' | 'playbook'> },
  clock: Clock,
): Promise<ChecklistDto> {
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  if (input.step !== 'kickoff' && input.step !== 'playbook') {
    throw new ValidationError([{ path: 'step', message: 'Only the kickoff and playbook steps can be ticked.' }]);
  }
  await tx
    .insert(partnerChecklist)
    .values({ partnerId: viewer.partnerId, step: input.step, doneAt: clock.now(), doneBy: viewer.id })
    .onConflictDoNothing();
  return getChecklist(tx, viewer);
}

/**
 * Active partner admins of a partner, for notifications and emails about team changes. Not part of the contracts'
 * H.6 list: an addition of this plan, used by the accept-invite and team actions. RLS scopes it for partner viewers.
 */
export async function listPartnerAdminRecipients(
  tx: Tx,
  input: { partnerId: string },
): Promise<Array<{ userId: string; email: string; name: string }>> {
  return tx
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.partnerId, input.partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active')))
    .orderBy(users.createdAt);
}

export interface ListPartnersInput {
  q?: string;
  status?: PartnerStatus;
  category?: PartnerCategory;
  region?: PartnerRegion;
}

export interface NewPartnerInput {
  name: string;
  website: string;
  category: PartnerCategory;
  region: PartnerRegion;
  adminName: string;
  adminEmail: string;
  sendInvite: boolean;
}

/** Staff sales only see partners in their own region; partner managers see all. */
const regionScope = (viewer: Viewer): StaffRegion | undefined =>
  viewer.kind === 'staff' && viewer.role === 'sales' ? viewer.region : undefined;

const rowFor = async (tx: Tx, id: string): Promise<PartnerListRow> => {
  const [row] = await partnerListRows(tx, { ids: [id] });
  if (!row) throw new NotFoundError('partner');
  return row;
};

const lockPartner = async (tx: Tx, id: string) => {
  const [row] = await tx.select().from(partners).where(eq(partners.id, id)).limit(1).for('update');
  if (!row) throw new NotFoundError('partner');
  return row;
};

/** Staff. Staff sales: only partners in their region. */
export async function listPartners(tx: Tx, viewer: Viewer, input: ListPartnersInput): Promise<PartnerListRow[]> {
  assertStaff(viewer);
  const scope = regionScope(viewer);
  return partnerListRows(tx, {
    ...(input.q ? { q: input.q } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.region ? { region: input.region } : {}),
    ...(scope ? { scopeRegion: scope } : {}),
  });
}

export async function getPartnerDetail(tx: Tx, viewer: Viewer, id: string): Promise<PartnerDetailDto> {
  assertStaff(viewer);
  const scope = regionScope(viewer);
  const [row] = await partnerListRows(tx, { ids: [id], ...(scope ? { scopeRegion: scope } : {}) });
  const [partner] = await tx.select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!row || !partner) throw new NotFoundError('partner');
  const people = await loadPartnerPeople(tx, partner.id);
  const dealCounts = await tx
    .select({ userId: registrations.registeredBy, n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.partnerId, partner.id))
    .groupBy(registrations.registeredBy);
  const twoStep = new Set(
    (await tx.select({ id: users.id }).from(users).where(and(eq(users.partnerId, partner.id), eq(users.twoFactorEnabled, true)))).map((u) => u.id),
  );
  const [suspension] =
    partner.status === 'suspended'
      ? await tx
          .select({ note: auditLog.note })
          .from(auditLog)
          .where(and(eq(auditLog.event, 'partner.suspended'), eq(auditLog.partnerId, partner.id)))
          .orderBy(desc(auditLog.at))
          .limit(1)
      : [];
  const deals = await tx
    .select({ id: registrations.id, customer: registrations.customerName, product: registrations.product, registeredOn: registrations.registeredOn, status: registrations.status })
    .from(registrations)
    .where(eq(registrations.partnerId, partner.id))
    .orderBy(desc(registrations.registeredOn), desc(registrations.createdAt))
    .limit(5);
  return {
    ...row,
    website: partner.website,
    phone: partner.phone,
    address: partner.address,
    about: partner.about,
    people: people.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: p.status,
      lastActiveAt: iso(p.lastLoginAt),
      invitedAt: iso(p.invitedAt),
      title: p.title,
      phone: p.phone,
      deals: p.userId ? (dealCounts.find((d) => d.userId === p.userId)?.n ?? 0) : 0,
      inviteId: p.inviteId,
      twoFactorEnabled: p.userId !== null && twoStep.has(p.userId),
    })),
    suspendReason: suspension?.note ?? null,
    openInvites: people.filter((p) => p.status === 'invited').length,
    recentDeals: deals.map((d) => ({ registrationId: d.id, customer: d.customer, product: d.product, registeredOn: d.registeredOn, status: d.status })),
  };
}

/**
 * Partner manager (M4.1, "Add partner"). Creates the partner (status 'onboarding', manager routed by region) and the
 * partner_admin invite. Throws ConflictError('domain_is_partner') and ConflictError('already_has_login'). The invite
 * row is always created so the admin's email is recorded; `invite` (with its one time token) is returned only when
 * sendInvite is true, otherwise Resend invites sends it later.
 */
export async function createPartner(
  tx: Tx,
  viewer: Viewer,
  input: NewPartnerInput,
  clock: Clock,
): Promise<{ partner: PartnerListRow; invite: CreatedInviteDto | null }> {
  assertStaff(viewer);
  const issues = [
    ...(input.name.trim() ? [] : [{ path: 'name', message: 'Enter the company name.' }]),
    ...(isValidEmail(input.adminEmail) ? [] : [{ path: 'adminEmail', message: 'Enter a valid work email.' }]),
  ];
  const site = normaliseDomain(input.website);
  const domain = isPlausibleDomain(site) ? site : emailDomain(input.adminEmail);
  if (!isPlausibleDomain(domain)) issues.push({ path: 'website', message: 'Enter the company website.' });
  if (issues.length > 0) throw new ValidationError(issues);

  const managerId = await pickManagerId(tx, input.region);
  const partner = await insertOnboardingPartner(tx, {
    name: input.name.trim(),
    domain,
    category: input.category,
    region: input.region,
    managerId,
  });
  const invite = await issueInvite(
    tx,
    { kind: 'partner', partnerId: partner.id, email: input.adminEmail, role: 'partner_admin', staffRegion: null, invitedBy: viewer.id },
    clock,
  );
  return { partner: await rowFor(tx, partner.id), invite: input.sendInvite ? invite : null };
}

export async function setPartnerManager(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; managerId: string },
  _clock: Clock,
): Promise<{ partner: PartnerListRow; previousManagerName: string | null }> {
  assertStaff(viewer);
  await assertActiveManager(tx, input.managerId);
  const current = await lockPartner(tx, input.id);
  const before = await rowFor(tx, current.id);
  if (current.managerId !== input.managerId) {
    await tx.update(partners).set({ managerId: input.managerId }).where(eq(partners.id, current.id));
  }
  return { partner: await rowFor(tx, current.id), previousManagerName: before.managerName };
}

export async function setPartnerCategory(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; category: PartnerCategory },
  _clock: Clock,
): Promise<{ partner: PartnerListRow; previousCategory: PartnerCategory }> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.category !== input.category) {
    await tx.update(partners).set({ category: input.category }).where(eq(partners.id, current.id));
  }
  return { partner: await rowFor(tx, current.id), previousCategory: current.category };
}

/**
 * Sets status 'suspended' and status_before_suspend (M4.1). Idempotent. The people lose access at once because
 * getViewer() returns null for a suspended partner; deleting their Better Auth sessions is the action's job after
 * commit (auth_session is system-only under RLS).
 */
export async function suspendPartner(tx: Tx, viewer: Viewer, input: { id: string }, _clock: Clock): Promise<PartnerListRow> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.status !== 'suspended') {
    await tx.update(partners).set({ status: 'suspended', statusBeforeSuspend: current.status }).where(eq(partners.id, current.id));
  }
  return rowFor(tx, current.id);
}

/** Puts status_before_suspend back (default 'active'). Idempotent. */
export async function restorePartner(tx: Tx, viewer: Viewer, input: { id: string }, _clock: Clock): Promise<PartnerListRow> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.status === 'suspended') {
    await tx.update(partners).set({ status: current.statusBeforeSuspend ?? 'active', statusBeforeSuspend: null }).where(eq(partners.id, current.id));
  }
  return rowFor(tx, current.id);
}

/** Partner manager. Returns the invites it re-sent (token included, once) so the action can email them. */
export async function resendPartnerInvites(
  tx: Tx,
  viewer: Viewer,
  input: { id: string },
  clock: Clock,
): Promise<{ partner: PartnerListRow; invites: Array<CreatedInviteDto & { inviteeName: string | null }> }> {
  assertStaff(viewer);
  const partner = await lockPartner(tx, input.id);
  if (partner.status === 'suspended') {
    throw new ConflictError('partner_suspended', 'This partner is suspended. Restore it before sending new invite links.');
  }
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.partnerId, partner.id), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const resent: Array<CreatedInviteDto & { inviteeName: string | null }> = [];
  for (const invite of open) {
    const rotated = await rotateInviteToken(tx, invite.id, clock);
    if (!rotated) continue;
    const [known] = await tx.select({ name: users.name }).from(users).where(eq(users.email, invite.email)).limit(1);
    resent.push({ ...rotated, inviteeName: known?.name ?? nameFromEmail(invite.email) });
  }
  return { partner: await rowFor(tx, partner.id), invites: resent };
}

export const isolation = defineIsolation<
  | 'getCompany' | 'getChecklist' | 'tickChecklistStep' | 'listPartnerAdminRecipients' | 'updateCompanyProfile'
  | 'listPartners' | 'getPartnerDetail' | 'createPartner' | 'setPartnerManager' | 'setPartnerCategory'
  | 'suspendPartner' | 'restorePartner' | 'resendPartnerInvites'
>({
  getCompany: { scope: 'tenant', probe: (tx, viewer, ctx) => getCompany(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  getChecklist: { scope: 'tenant', probe: (tx, viewer) => getChecklist(tx, viewer), expect: 'unchanged' },
  tickChecklistStep: { scope: 'tenant', probe: (tx, viewer) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, systemClock), expect: 'unchanged' },
  listPartnerAdminRecipients: { scope: 'tenant', probe: (tx, _viewer, ctx) => listPartnerAdminRecipients(tx, { partnerId: ctx.b.partnerId }), expect: 'empty' },
  updateCompanyProfile: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => updateCompanyProfile(tx, viewer, { partnerId: ctx.b.partnerId, website: 'probe.example', phone: null, address: null, about: null }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'partners', id: ctx.b.partnerId }],
  },
  listPartners: { scope: 'staff-only', probe: (tx, viewer) => listPartners(tx, viewer, {}), expect: 'forbidden' },
  getPartnerDetail: { scope: 'staff-only', probe: (tx, viewer, ctx) => getPartnerDetail(tx, viewer, ctx.b.partnerId), expect: 'forbidden' },
  createPartner: {
    scope: 'staff-only',
    probe: (tx, viewer) => createPartner(tx, viewer, { name: 'Probe', website: 'probe.example', category: 'channel', region: 'india', adminName: 'P', adminEmail: 'p@probe.example', sendInvite: false }, systemClock),
    expect: 'forbidden',
  },
  setPartnerManager: { scope: 'staff-only', probe: (tx, viewer, ctx) => setPartnerManager(tx, viewer, { id: ctx.b.partnerId, managerId: ctx.staffUserId }, systemClock), expect: 'forbidden' },
  setPartnerCategory: { scope: 'staff-only', probe: (tx, viewer, ctx) => setPartnerCategory(tx, viewer, { id: ctx.b.partnerId, category: 'distributor' }, systemClock), expect: 'forbidden' },
  suspendPartner: { scope: 'staff-only', probe: (tx, viewer, ctx) => suspendPartner(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
  restorePartner: { scope: 'staff-only', probe: (tx, viewer, ctx) => restorePartner(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
  resendPartnerInvites: { scope: 'staff-only', probe: (tx, viewer, ctx) => resendPartnerInvites(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
});
