import { and, eq, sql } from 'drizzle-orm';
import { applications, partners, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { ApplicationSource, PartnerCategory, PartnerRegion } from '@/lib/domain';
import type { ApplicationDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import type { SystemActor } from '@/server/auth/types';
import { ConflictError, ValidationError } from '@/server/errors';
import { notifyUsers } from '@/server/notify';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

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

export const isolation = defineIsolation<
  'createPortalApplication' | 'findPartnerByDomain' | 'listManagerRecipients' | 'insertWebsiteApplication'
>({
  createPortalApplication: { scope: 'public', reason: 'Public apply flow. Takes a SystemActor; covered by applications.test.ts and actions/apply.test.ts.' },
  findPartnerByDomain: { scope: 'public', reason: 'Public apply flow and website intake. Returns only id and name; covered by applications.test.ts.' },
  listManagerRecipients: { scope: 'public', reason: 'Public flows notify the active partner managers. Takes a SystemActor; covered by applications.test.ts.' },
  insertWebsiteApplication: { scope: 'public', reason: 'Website intake job, system actor only; covered by applications.test.ts and website-applications.test.ts.' },
});
