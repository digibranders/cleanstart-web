import { and, eq, isNull, ne } from 'drizzle-orm';
import { invites, partnerChecklist, partners, registrations, staffScopes, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { CHECKLIST_STEPS, type ChecklistStep } from '@/lib/domain';
import type { ChecklistDto, CompanyDto, IsoTimestamp } from '@/lib/dto';
import { staffTeamLabel } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { iso } from '@/server/people';
import { resolvePartnerScope } from '@/server/partner-scope';
import type { Tx } from './context';
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

export const isolation = defineIsolation<
  'getCompany' | 'getChecklist' | 'tickChecklistStep' | 'listPartnerAdminRecipients' | 'updateCompanyProfile'
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
});
