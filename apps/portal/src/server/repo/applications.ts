import { and, desc, eq, ilike, isNotNull, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { applications, invites, partners, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { ApplicationSource, ApplicationStatus, PartnerCategory, PartnerRegion } from '@/lib/domain';
import type { ApplicationDto, CreatedInviteDto, PartnerListRow } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite } from '@/server/invite-core';
import { notifyUsers } from '@/server/notify';
import { assertActiveManager, insertOnboardingPartner, type PartnerRow, pickManagerId } from '@/server/partner-routing';
import { partnerListRows } from '@/server/partner-rows';
import { likePattern } from '@/server/people';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { systemClock } from '@/lib/clock';

export interface NewApplicationRecord {
  company: string;
  domain: string;
  applicantName: string;
  email: string;
  role: string | null;
  phone: string | null;
  category: PartnerCategory | null;
  region: PartnerRegion | null;
  reason: string | null;
  source: ApplicationSource;
  sourceRef: string | null;
  personalEmail: boolean;
  existingDomain: boolean;
  /** Website entries carry the CMS createdAt so the queue shows the real submission time; portal entries omit it. */
  submittedAt?: Date;
}

/** An active partner manager, for in-app notifications and alert emails. */
export interface ManagerRecipient {
  userId: string;
  email: string;
  name: string;
}

type ApplicationRow = typeof applications.$inferSelect;

const toDto = (row: ApplicationRow): ApplicationDto => ({
  id: row.id,
  reference: row.reference,
  company: row.company,
  domain: row.domain,
  applicantName: row.applicantName,
  email: row.email,
  role: row.role,
  phone: row.phone,
  category: row.category,
  region: row.region,
  reason: row.reason,
  submittedAt: row.createdAt.toISOString(),
  status: row.status,
  source: row.source,
  personalEmail: row.personalEmail,
  existingDomain: row.existingDomain,
  declineReason: row.declineReason,
  decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  partnerId: row.partnerId,
});

/** APP-YYMM-NNNN. The yymm part is the month of submission (`at`). */
const nextReference = async (tx: Tx, at: Date): Promise<string> => {
  const yymm = `${String(at.getUTCFullYear()).slice(2)}${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
  const result = await tx.execute(sql`select nextval('application_reference_seq') as n`);
  const row: unknown = result.rows[0];
  const raw = typeof row === 'object' && row !== null && 'n' in row ? (row as { n: unknown }).n : undefined;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error('application_reference_seq returned no number');
  return `APP-${yymm}-${String(n).padStart(4, '0')}`;
};

const managersOf = async (tx: Tx): Promise<ManagerRecipient[]> =>
  tx
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(users.createdAt);

/**
 * Public (M1.3). Merges into the applicant's open portal application for the same email instead of adding a second.
 * `input.email` must already be lower case (the action normalises it).
 */
export async function createPortalApplication(
  tx: Tx,
  _actor: SystemActor,
  input: NewApplicationRecord,
  clock: Clock,
): Promise<{ application: ApplicationDto; merged: boolean }> {
  const fields = {
    company: input.company,
    domain: input.domain,
    applicantName: input.applicantName,
    role: input.role,
    phone: input.phone,
    category: input.category,
    region: input.region,
    reason: input.reason,
    personalEmail: input.personalEmail,
    existingDomain: input.existingDomain,
  };

  const merge = async (): Promise<ApplicationDto | null> => {
    const [open] = await tx
      .select()
      .from(applications)
      .where(and(eq(applications.source, 'portal'), eq(applications.status, 'new'), sql`lower(${applications.email}) = ${input.email}`))
      .limit(1)
      .for('update');
    if (!open) return null;
    // The queue sorts by createdAt, so a refreshed application surfaces again, as the mock does.
    const [updated] = await tx.update(applications).set({ ...fields, createdAt: clock.now() }).where(eq(applications.id, open.id)).returning();
    return updated ? toDto(updated) : null;
  };

  // The partial unique index (one open portal application per email) can lose a race; the second pass then merges.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const merged = await merge();
    if (merged) return { application: merged, merged: true };
    const [created] = await tx
      .insert(applications)
      .values({
        reference: await nextReference(tx, clock.now()),
        ...fields,
        email: input.email,
        source: 'portal',
        sourceRef: null,
        createdAt: clock.now(),
      })
      .onConflictDoNothing()
      .returning();
    if (created) return { application: toDto(created), merged: false };
  }
  throw new ConflictError('already_applied', 'You already have an application in review.');
}

/** Public (M1.3, M1.3b). The partner whose domain matches, or null. Never returns anything but id and name. */
export async function findPartnerByDomain(
  tx: Tx,
  _actor: SystemActor,
  domain: string,
): Promise<{ id: string; name: string } | null> {
  const [row] = await tx
    .select({ id: partners.id, name: partners.name })
    .from(partners)
    .where(eq(partners.domain, domain.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** Public. Active partner managers; used by the apply action and the website intake for notifications and alerts. */
export async function listManagerRecipients(tx: Tx, _actor: SystemActor): Promise<ManagerRecipient[]> {
  return managersOf(tx);
}

/**
 * Public (M1.3b). Idempotent on (source, source_ref): returns false when the row already existed. Writes the audit entry
 * and the in-app notification to the partner managers itself because the job that calls it has no action layer.
 * The CMS sends its own emails for website entries, so none are sent here.
 */
export async function insertWebsiteApplication(
  tx: Tx,
  actor: SystemActor,
  input: NewApplicationRecord,
  clock: Clock,
): Promise<{ inserted: boolean }> {
  if (input.sourceRef === null) {
    throw new ValidationError([{ path: 'sourceRef', message: 'A website application needs the CMS id.' }]);
  }
  const [known] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.source, 'website'), eq(applications.sourceRef, input.sourceRef)))
    .limit(1);
  if (known) return { inserted: false };

  const submittedAt = input.submittedAt ?? clock.now();
  const [created] = await tx
    .insert(applications)
    .values({
      reference: await nextReference(tx, submittedAt),
      company: input.company,
      domain: input.domain,
      applicantName: input.applicantName,
      email: input.email,
      role: input.role,
      phone: input.phone,
      category: input.category,
      region: input.region,
      reason: input.reason,
      source: 'website',
      sourceRef: input.sourceRef,
      personalEmail: input.personalEmail,
      existingDomain: input.existingDomain,
      createdAt: submittedAt,
    })
    .onConflictDoNothing({ target: [applications.source, applications.sourceRef] })
    .returning({ id: applications.id });
  if (!created) return { inserted: false };

  await recordAudit(tx, actor, {
    event: 'application.submitted',
    target: input.company,
    note: 'Website form',
    subject: { type: 'application', id: created.id },
  });
  const managers = await managersOf(tx);
  await notifyUsers(
    tx,
    managers.map((manager) => ({
      userId: manager.userId,
      kind: 'application_new' as const,
      title: `New application from ${input.company}`,
      body: `Website form, ${input.applicantName}`,
      link: `${ROUTES.admin.partners}?tab=applications`,
    })),
  );
  return { inserted: true };
}

export interface ApproveApplicationInput {
  id: string;
  category: PartnerCategory;
  region: PartnerRegion;
  /** Defaults to the active partner manager whose staff scope covers `region`, then the first active partner manager. */
  managerId?: string | null;
}

export interface ApproveApplicationResult {
  application: ApplicationDto;
  partner: PartnerListRow;
  /** The invite to the applicant as partner admin. Email it, then discard the token. */
  invite: CreatedInviteDto;
}

const loadForUpdate = async (tx: Tx, id: string): Promise<ApplicationRow> => {
  const [row] = await tx.select().from(applications).where(eq(applications.id, id)).limit(1).for('update');
  if (!row) throw new NotFoundError('application');
  return row;
};

const notOpen = (): ConflictError => new ConflictError('application_not_open', 'This application has already been decided.');

/** Staff (M1.4). Newest first. `q` matches company, domain, applicant and email. */
export async function listApplications(
  tx: Tx,
  viewer: Viewer,
  input: { status?: ApplicationStatus; q?: string },
): Promise<ApplicationDto[]> {
  assertStaff(viewer);
  const conditions: SQL[] = [];
  if (input.status) conditions.push(eq(applications.status, input.status));
  if (input.q?.trim()) {
    const like = likePattern(input.q);
    const match = or(
      ilike(applications.company, like),
      ilike(applications.domain, like),
      ilike(applications.applicantName, like),
      ilike(applications.email, like),
    );
    if (match) conditions.push(match);
  }
  const rows = await tx
    .select()
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.createdAt));
  return rows.map(toDto);
}

/** Staff (M1.4). Throws NotFoundError. */
export async function getApplication(tx: Tx, viewer: Viewer, id: string): Promise<ApplicationDto> {
  assertStaff(viewer);
  const [row] = await tx.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!row) throw new NotFoundError('application');
  return toDto(row);
}

/** Staff (M1.4). Number of applications with status 'new', for the Partners tab badge. */
export async function countNewApplications(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(applications)
    .where(eq(applications.status, 'new'));
  return row?.n ?? 0;
}

/**
 * Staff (M1.4). Creates the partner (status 'onboarding', manager routed) and the partner_admin invite, or reuses the
 * partner a reopened application kept. Throws ConflictError('application_not_open') unless status is 'new' and
 * ConflictError('domain_is_partner') when another partner already owns the domain. The action enqueues partner.upsert.
 */
export async function approveApplication(
  tx: Tx,
  viewer: Viewer,
  input: ApproveApplicationInput,
  clock: Clock,
): Promise<ApproveApplicationResult> {
  assertStaff(viewer);
  const row = await loadForUpdate(tx, input.id);
  if (row.status !== 'new') throw notOpen();

  let managerId = input.managerId ?? null;
  if (managerId) await assertActiveManager(tx, managerId);
  else managerId = await pickManagerId(tx, input.region);

  let partner: PartnerRow;
  if (row.partnerId) {
    // A reopened application kept its partner (inactive); approving again brings it back.
    const [reused] = await tx
      .update(partners)
      .set({ status: 'onboarding', statusBeforeSuspend: null, category: input.category, region: input.region, managerId })
      .where(eq(partners.id, row.partnerId))
      .returning();
    if (!reused) throw new NotFoundError('partner');
    partner = reused;
  } else {
    partner = await insertOnboardingPartner(tx, {
      name: row.company,
      domain: row.domain,
      category: input.category,
      region: input.region,
      managerId,
    });
  }

  const invite = await issueInvite(
    tx,
    { kind: 'partner', partnerId: partner.id, email: row.email, role: 'partner_admin', staffRegion: null, invitedBy: viewer.id },
    clock,
  );
  const [decided] = await tx
    .update(applications)
    .set({
      status: 'approved',
      decidedBy: viewer.id,
      decidedAt: clock.now(),
      declineReason: null,
      partnerId: partner.id,
      category: input.category,
      region: input.region,
    })
    .where(eq(applications.id, row.id))
    .returning();
  const [listRow] = await partnerListRows(tx, { ids: [partner.id] });
  if (!decided || !listRow) throw new Error('approval wrote no row');
  return { application: toDto(decided), partner: listRow, invite };
}

/** Staff (M1.4). Needs a reason. Throws ConflictError('application_not_open'). */
export async function declineApplication(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<ApplicationDto> {
  assertStaff(viewer);
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Add a reason the applicant will see.' }]);
  const row = await loadForUpdate(tx, input.id);
  if (row.status !== 'new') throw notOpen();
  const [declined] = await tx
    .update(applications)
    .set({ status: 'declined', decidedBy: viewer.id, decidedAt: clock.now(), declineReason: reason })
    .where(eq(applications.id, row.id))
    .returning();
  if (!declined) throw new Error('decline wrote no row');
  return toDto(declined);
}

/**
 * Staff (M1.4). Undo. Revokes the open invite and marks the created partner 'inactive' (never deletes it), only while
 * the partner is still 'onboarding' with no agreement, no accepted invite and no non-disabled user; otherwise ConflictError('partner_not_reopenable').
 * The application returns to 'new' and keeps `partnerId` so a second approval reuses the partner.
 */
export async function reopenApplication(
  tx: Tx,
  viewer: Viewer,
  input: { id: string },
  clock: Clock,
): Promise<ApplicationDto> {
  assertStaff(viewer);
  const row = await loadForUpdate(tx, input.id);
  if (row.status === 'new') throw new ConflictError('application_not_open', 'This application is already open.');
  if (row.status === 'approved' && row.partnerId) {
    const [partner] = await tx.select().from(partners).where(eq(partners.id, row.partnerId)).limit(1).for('update');
    if (!partner || partner.status !== 'onboarding' || partner.agreementAcceptedAt !== null) {
      throw new ConflictError('partner_not_reopenable', 'The partner has already signed in, so the approval cannot be undone.');
    }
    const [login] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.partnerId, partner.id), ne(users.status, 'disabled')))
      .limit(1);
    const [accepted] = await tx
      .select({ id: invites.id })
      .from(invites)
      .where(and(eq(invites.partnerId, partner.id), isNotNull(invites.acceptedAt)))
      .limit(1);
    if (login || accepted) {
      throw new ConflictError('partner_not_reopenable', 'The partner already has people signed in, so the approval cannot be undone.');
    }
    await tx
      .update(invites)
      .set({ revokedAt: clock.now() })
      .where(and(eq(invites.partnerId, partner.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
    await tx.update(partners).set({ status: 'inactive', statusBeforeSuspend: null }).where(eq(partners.id, partner.id));
  }
  const [reopened] = await tx
    .update(applications)
    .set({ status: 'new', decidedBy: null, decidedAt: null, declineReason: null })
    .where(eq(applications.id, row.id))
    .returning();
  if (!reopened) throw new Error('reopen wrote no row');
  return toDto(reopened);
}

export const isolation = defineIsolation<
  | 'createPortalApplication'
  | 'findPartnerByDomain'
  | 'listManagerRecipients'
  | 'insertWebsiteApplication'
  | 'listApplications'
  | 'getApplication'
  | 'countNewApplications'
  | 'approveApplication'
  | 'declineApplication'
  | 'reopenApplication'
>({
  createPortalApplication: { scope: 'public', reason: 'Public apply flow. Takes a SystemActor; covered by applications.test.ts and actions/apply.test.ts.' },
  findPartnerByDomain: { scope: 'public', reason: 'Public apply flow and website intake. Returns only id and name; covered by applications.test.ts.' },
  listManagerRecipients: { scope: 'public', reason: 'Public flows notify the active partner managers. Takes a SystemActor; covered by applications.test.ts.' },
  insertWebsiteApplication: { scope: 'public', reason: 'Website intake job, system actor only; covered by applications.test.ts and website-applications.test.ts.' },
  listApplications: { scope: 'staff-only', probe: (tx, viewer) => listApplications(tx, viewer, {}), expect: 'forbidden' },
  getApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => getApplication(tx, viewer, ctx.applicationId), expect: 'forbidden' },
  countNewApplications: { scope: 'staff-only', probe: (tx, viewer) => countNewApplications(tx, viewer), expect: 'forbidden' },
  approveApplication: {
    scope: 'staff-only',
    probe: (tx, viewer, ctx) => approveApplication(tx, viewer, { id: ctx.applicationId, category: 'channel', region: 'india' }, systemClock),
    expect: 'forbidden',
  },
  declineApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => declineApplication(tx, viewer, { id: ctx.applicationId, reason: 'x' }, systemClock), expect: 'forbidden' },
  reopenApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => reopenApplication(tx, viewer, { id: ctx.applicationId }, systemClock), expect: 'forbidden' },
});
