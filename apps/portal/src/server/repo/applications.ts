import { and, asc, desc, eq, gt, ilike, inArray, isNotNull, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { applicationNotes, applications, applicationTokens, invites, partners, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { APPLICATION_LINK_TTL_DAYS, INVITE_REMINDER_AFTER_DAYS } from '@/lib/apply';
import type { ApplicationStatusDto } from '@/lib/application-status';
import {
  type ApplicationSource,
  type ApplicationStatus,
  type ApplicationTokenKind,
  isOpenApplication,
  OPEN_APPLICATION_STATUSES,
  type PartnerCategory,
  type PartnerRegion,
} from '@/lib/domain';
import type { ApplicationDto, ApplicationNoteDto, CreatedInviteDto, PartnerListRow } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { generateInviteToken, hashToken } from '@/server/auth/tokens';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite, rotateInviteToken } from '@/server/invite-core';
import { notifyUsers } from '@/server/notify';
import { assertActiveManager, insertOnboardingPartner, type PartnerRow, pickManagerId } from '@/server/partner-routing';
import { partnerListRows } from '@/server/partner-rows';
import { likePattern } from '@/server/people';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { systemClock } from '@/lib/clock';
import { assertRegionAssignable } from './regions';

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
  /** The richer answers of the portal form. Website entries leave them out. */
  vendors?: string[];
  products?: string[];
  companySize?: string | null;
  yearsInBusiness?: string | null;
  verticals?: string[];
  country?: string | null;
  referralSource?: string | null;
  consentAt?: Date | null;
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
  vendors: row.vendors ?? [],
  products: row.products ?? [],
  companySize: row.companySize,
  yearsInBusiness: row.yearsInBusiness,
  verticals: row.verticals ?? [],
  country: row.country,
  referralSource: row.referralSource,
  consentAt: row.consentAt ? row.consentAt.toISOString() : null,
});

/** Stores the hash of a fresh private link for an application and returns the clear token, which exists only here. */
const issueApplicantToken = async (tx: Tx, applicationId: string, kind: ApplicationTokenKind, clock: Clock): Promise<string> => {
  const { token, tokenHash } = generateInviteToken();
  await tx.insert(applicationTokens).values({
    applicationId,
    kind,
    tokenHash,
    expiresAt: new Date(clock.now().getTime() + APPLICATION_LINK_TTL_DAYS * 86_400_000),
  });
  return token;
};

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
): Promise<{ application: ApplicationDto; merged: boolean; statusToken: string }> {
  if (input.region) await assertRegionAssignable(tx, input.region);
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
    vendors: input.vendors ?? null,
    products: input.products ?? null,
    companySize: input.companySize ?? null,
    yearsInBusiness: input.yearsInBusiness ?? null,
    verticals: input.verticals ?? null,
    country: input.country ?? null,
    referralSource: input.referralSource ?? null,
    consentAt: input.consentAt ?? null,
  };

  const merge = async (): Promise<ApplicationDto | null> => {
    const [open] = await tx
      .select()
      .from(applications)
      .where(and(eq(applications.source, 'portal'), inArray(applications.status, OPEN_APPLICATION_STATUSES), sql`lower(${applications.email}) = ${input.email}`))
      .limit(1)
      .for('update');
    if (!open) return null;
    // The queue sorts by createdAt, so a refreshed application surfaces again, as the mock does.
    const [updated] = await tx.update(applications).set({ ...fields, status: 'new', createdAt: clock.now() }).where(eq(applications.id, open.id)).returning();
    return updated ? toDto(updated) : null;
  };

  // The partial unique index (one open portal application per email) can lose a race; the second pass then merges.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const merged = await merge();
    if (merged) return { application: merged, merged: true, statusToken: await issueApplicantToken(tx, merged.id, 'status', clock) };
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
    if (created) return { application: toDto(created), merged: false, statusToken: await issueApplicantToken(tx, created.id, 'status', clock) };
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
 * partner a reopened application kept. Throws ConflictError('application_not_open') unless status is 'new' or 'info_requested' and
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
  if (!isOpenApplication(row.status)) throw notOpen();

  await assertRegionAssignable(tx, input.region, row.region);
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
  if (!isOpenApplication(row.status)) throw notOpen();
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
  if (isOpenApplication(row.status)) throw new ConflictError('application_not_open', 'This application is already open.');
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

const MAX_TOKEN_LENGTH = 200;
const noteDto = (row: typeof applicationNotes.$inferSelect, authorName: string | null): ApplicationNoteDto => ({
  id: row.id,
  kind: row.kind,
  note: row.note,
  authorName,
  createdAt: row.createdAt.toISOString(),
});

/** Staff. Oldest first: internal notes, the question sent to the applicant and their reply, as one thread. */
export async function listApplicationNotes(tx: Tx, viewer: Viewer, input: { id: string }): Promise<ApplicationNoteDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select({ note: applicationNotes, authorName: users.name })
    .from(applicationNotes)
    .leftJoin(users, eq(users.id, applicationNotes.authorId))
    .where(eq(applicationNotes.applicationId, input.id))
    .orderBy(asc(applicationNotes.createdAt));
  return rows.map((row) => noteDto(row.note, row.authorName));
}

/** Staff. An internal note; the applicant never sees it. Throws NotFoundError. */
export async function addApplicationNote(tx: Tx, viewer: Viewer, input: { id: string; note: string }): Promise<ApplicationNoteDto> {
  assertStaff(viewer);
  const note = input.note.trim();
  if (!note) throw new ValidationError([{ path: 'note', message: 'Write the note first.' }]);
  const [application] = await tx.select({ id: applications.id }).from(applications).where(eq(applications.id, input.id)).limit(1);
  if (!application) throw new NotFoundError('application');
  const [row] = await tx.insert(applicationNotes).values({ applicationId: input.id, authorId: viewer.id, kind: 'internal', note }).returning();
  if (!row) throw new Error('note insert returned no row');
  return noteDto(row, viewer.name);
}

/**
 * Staff. Stores the question, sets the status to info_requested and issues a single-use reply link (earlier unused reply
 * links stop working). The clear token is returned once, for the email. Throws ConflictError('application_not_open').
 */
export async function requestApplicationInfo(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; message: string },
  clock: Clock,
): Promise<{ application: ApplicationDto; replyToken: string }> {
  assertStaff(viewer);
  const message = input.message.trim();
  if (!message) throw new ValidationError([{ path: 'message', message: 'Write what you need to know.' }]);
  const row = await loadForUpdate(tx, input.id);
  if (!isOpenApplication(row.status)) throw notOpen();
  await tx
    .update(applicationTokens)
    .set({ usedAt: clock.now() })
    .where(and(eq(applicationTokens.applicationId, row.id), eq(applicationTokens.kind, 'reply'), isNull(applicationTokens.usedAt)));
  await tx.insert(applicationNotes).values({ applicationId: row.id, authorId: viewer.id, kind: 'info_request', note: message });
  const replyToken = await issueApplicantToken(tx, row.id, 'reply', clock);
  const [updated] = await tx.update(applications).set({ status: 'info_requested' }).where(eq(applications.id, row.id)).returning();
  if (!updated) throw new Error('request info wrote no row');
  return { application: toDto(updated), replyToken };
}

/**
 * Public. The status page. Anything but a live status link gives 'unknown' or 'expired', never a hint about whose
 * application it was. A decision does not end the link, so Decision, Invite sent and Account active stay reachable.
 */
export async function getApplicationStatus(tx: Tx, _actor: SystemActor, token: string, clock: Clock): Promise<ApplicationStatusDto> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return { state: 'unknown' };
  const [link] = await tx
    .select()
    .from(applicationTokens)
    .where(and(eq(applicationTokens.tokenHash, hashToken(token)), eq(applicationTokens.kind, 'status')))
    .limit(1);
  if (!link) return { state: 'unknown' };
  if (link.expiresAt.getTime() <= clock.now().getTime()) return { state: 'expired' };
  const [application] = await tx.select().from(applications).where(eq(applications.id, link.applicationId)).limit(1);
  if (!application) return { state: 'unknown' };
  let accountActive = false;
  if (application.status === 'approved' && application.partnerId) {
    const [accepted] = await tx
      .select({ id: invites.id })
      .from(invites)
      .where(and(eq(invites.partnerId, application.partnerId), eq(invites.email, application.email), isNotNull(invites.acceptedAt)))
      .limit(1);
    accountActive = accepted !== undefined;
  }
  return {
    state: 'ok',
    reference: application.reference,
    company: application.company,
    submittedOn: application.createdAt.toISOString().slice(0, 10),
    status: application.status,
    declineReason: application.status === 'declined' ? application.declineReason : null,
    accountActive,
  };
}

type ReplyLink = { application: ApplicationRow; tokenId: string };

const findReplyLink = async (tx: Tx, token: string, clock: Clock, lock: boolean): Promise<ReplyLink | null> => {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  const query = tx
    .select()
    .from(applicationTokens)
    .where(
      and(
        eq(applicationTokens.tokenHash, hashToken(token)),
        eq(applicationTokens.kind, 'reply'),
        isNull(applicationTokens.usedAt),
        gt(applicationTokens.expiresAt, clock.now()),
      ),
    )
    .limit(1);
  const [link] = await (lock ? query.for('update') : query);
  if (!link) return null;
  const [application] = await tx.select().from(applications).where(eq(applications.id, link.applicationId)).limit(1);
  return application && application.status === 'info_requested' ? { application, tokenId: link.id } : null;
};

/** Public. What the reply page shows: the company and the question. Null for a link that is wrong, used, expired or no longer needed. */
export async function previewApplicantReply(
  tx: Tx,
  _actor: SystemActor,
  token: string,
  clock: Clock,
): Promise<{ company: string; question: string } | null> {
  const link = await findReplyLink(tx, token, clock, false);
  if (!link) return null;
  const [question] = await tx
    .select({ note: applicationNotes.note })
    .from(applicationNotes)
    .where(and(eq(applicationNotes.applicationId, link.application.id), eq(applicationNotes.kind, 'info_request')))
    .orderBy(desc(applicationNotes.createdAt))
    .limit(1);
  return { company: link.application.company, question: question?.note ?? '' };
}

/**
 * Public. Stores the applicant's answer, uses up the link and puts the application back in the queue (status new).
 * Throws ConflictError('reply_invalid') for any link that cannot be used, so the caller gives one answer.
 */
export async function submitApplicantReply(
  tx: Tx,
  _actor: SystemActor,
  input: { token: string; message: string },
  clock: Clock,
): Promise<ApplicationDto> {
  const message = input.message.trim();
  if (!message) throw new ValidationError([{ path: 'message', message: 'Write your answer first.' }]);
  const link = await findReplyLink(tx, input.token, clock, true);
  if (!link) throw new ConflictError('reply_invalid', 'This link is no longer valid. Reply to the email from the partner team instead.');
  await tx.update(applicationTokens).set({ usedAt: clock.now() }).where(eq(applicationTokens.id, link.tokenId));
  await tx.insert(applicationNotes).values({ applicationId: link.application.id, authorId: null, kind: 'applicant_reply', note: message });
  const [updated] = await tx.update(applications).set({ status: 'new' }).where(eq(applications.id, link.application.id)).returning();
  if (!updated) throw new Error('reply wrote no row');
  return toDto(updated);
}

/** Public (job). Approved applications older than INVITE_REMINDER_AFTER_DAYS that never got the reminder and still have an open invite. */
export async function listInviteReminderCandidates(tx: Tx, _actor: SystemActor, clock: Clock): Promise<string[]> {
  const cutoff = new Date(clock.now().getTime() - INVITE_REMINDER_AFTER_DAYS * 86_400_000);
  const rows = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.status, 'approved'),
        isNotNull(applications.partnerId),
        isNull(applications.inviteReminderSentAt),
        lte(applications.decidedAt, cutoff),
        sql`exists (select 1 from invites i where i.partner_id = ${applications.partnerId} and lower(i.email) = ${applications.email} and i.accepted_at is null and i.revoked_at is null)`,
      ),
    )
    .orderBy(asc(applications.decidedAt));
  return rows.map((row) => row.id);
}

export interface InviteReminderPayload {
  applicantName: string;
  email: string;
  company: string;
  /** A fresh link: the first one exists only as a hash, so the reminder rotates the token and extends the expiry. */
  token: string;
  expiresAt: string;
}

/**
 * Public (job). Writes the sent marker first and only the run that wrote it returns a payload, so overlapping runs
 * cannot send twice. Null when it was already claimed, the invite was used or withdrawn in the meantime, or nothing is open.
 */
export async function claimInviteReminder(tx: Tx, _actor: SystemActor, id: string, clock: Clock): Promise<InviteReminderPayload | null> {
  const [claimed] = await tx
    .update(applications)
    .set({ inviteReminderSentAt: clock.now() })
    .where(and(eq(applications.id, id), eq(applications.status, 'approved'), isNull(applications.inviteReminderSentAt)))
    .returning();
  if (!claimed?.partnerId) return null;
  const [open] = await tx
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.partnerId, claimed.partnerId),
        sql`lower(${invites.email}) = ${claimed.email}`,
        isNull(invites.acceptedAt),
        isNull(invites.revokedAt),
      ),
    )
    .orderBy(desc(invites.createdAt))
    .limit(1);
  if (!open) return null;
  const rotated = await rotateInviteToken(tx, open.id, clock);
  if (!rotated) return null;
  return { applicantName: claimed.applicantName, email: claimed.email, company: claimed.company, token: rotated.token, expiresAt: rotated.invite.expiresAt };
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
  | 'listApplicationNotes'
  | 'addApplicationNote'
  | 'requestApplicationInfo'
  | 'getApplicationStatus'
  | 'previewApplicantReply'
  | 'submitApplicantReply'
  | 'listInviteReminderCandidates'
  | 'claimInviteReminder'
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
  listApplicationNotes: { scope: 'staff-only', probe: (tx, viewer, ctx) => listApplicationNotes(tx, viewer, { id: ctx.applicationId }), expect: 'forbidden' },
  addApplicationNote: { scope: 'staff-only', probe: (tx, viewer, ctx) => addApplicationNote(tx, viewer, { id: ctx.applicationId, note: 'x' }), expect: 'forbidden' },
  requestApplicationInfo: {
    scope: 'staff-only',
    probe: (tx, viewer, ctx) => requestApplicationInfo(tx, viewer, { id: ctx.applicationId, message: 'x' }, systemClock),
    expect: 'forbidden',
  },
  getApplicationStatus: { scope: 'public', reason: 'Public status page. Takes a SystemActor and a private link token; covered by applications.test.ts.' },
  previewApplicantReply: { scope: 'public', reason: 'Public reply page. Takes a SystemActor and a private link token; covered by applications.test.ts.' },
  submitApplicantReply: { scope: 'public', reason: 'Public reply flow. Takes a SystemActor and a private link token; covered by applications.test.ts.' },
  listInviteReminderCandidates: { scope: 'public', reason: 'Reminder job, system actor only; covered by applications.test.ts.' },
  claimInviteReminder: { scope: 'public', reason: 'Reminder job, system actor only; covered by applications.test.ts.' },
});
