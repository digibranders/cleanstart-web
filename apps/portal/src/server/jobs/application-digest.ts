import { and, asc, eq } from 'drizzle-orm';
import { applications, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { REVIEW_SLA_BUSINESS_DAYS, isOverSla, waitingBusinessDays } from '@/lib/deal-rules';
import { PARTNER_CATEGORY_LABEL, type PartnerCategory } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { type ApplicationDigestRow, buildApplicationDigest } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';
import { absoluteUrl } from '@/server/urls';

export interface OpenApplication {
  company: string;
  applicantName: string;
  category: PartnerCategory | null;
  /** The calendar day it arrived. */
  since: string;
}

/** Pure. Applications past the review target (more than 2 business days), longest waiting first. Decided ones never reach here. */
export function staleApplications(open: readonly OpenApplication[], today: string): ApplicationDigestRow[] {
  return open
    .filter((a) => isOverSla(a.since, today))
    .map((a): ApplicationDigestRow => ({
      company: a.company,
      applicantName: a.applicantName,
      categoryLabel: a.category ? PARTNER_CATEGORY_LABEL[a.category] : null,
      waitingBusinessDays: waitingBusinessDays(a.since, today),
    }))
    .sort((a, b) => b.waitingBusinessDays - a.waitingBusinessDays || a.company.localeCompare(b.company));
}

/** The still undecided applications ('new') and the active partner managers, who are the only staff who can decide them. */
export async function loadApplicationDigestInput(): Promise<{ managers: { name: string; email: string }[]; open: OpenApplication[] }> {
  return withSystem(SYSTEM_ACTORS.portal, async (tx) => {
    const managers = await tx
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.kind, 'staff'), eq(users.status, 'active'), eq(users.role, 'partner_manager')))
      .orderBy(asc(users.createdAt));
    const rows = await tx
      .select({ company: applications.company, applicantName: applications.applicantName, category: applications.category, createdAt: applications.createdAt })
      .from(applications)
      .where(eq(applications.status, 'new'));
    return {
      managers,
      open: rows.map((r): OpenApplication => ({ company: r.company, applicantName: r.applicantName, category: r.category, since: r.createdAt.toISOString().slice(0, 10) })),
    };
  });
}

/**
 * Daily at 04:35 UTC, 10:05 IST. One email per active partner manager when an application has waited past the review target,
 * nothing otherwise. Read only: a second run the same day sends it again; the job lock stops overlapping runs. One failing
 * email never stops the others. There is no per person switch yet, so every partner manager receives it.
 */
export async function sendApplicationDigests(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ sent: number }> {
  const { managers, open } = await loadApplicationDigestInput();
  const stale = staleApplications(open, deps.clock.today());
  let sent = 0;
  if (stale.length > 0) {
    for (const manager of managers) {
      try {
        const result = await sendEmail(
          buildApplicationDigest({
            to: { email: manager.email, name: manager.name },
            recipientName: manager.name,
            applications: stale,
            targetBusinessDays: REVIEW_SLA_BUSINESS_DAYS,
            applicationsUrl: absoluteUrl(`${ROUTES.admin.partners}?astatus=new`),
          }),
          deps.transport,
        );
        if (result.status !== 'failed') sent += 1;
      } catch (error) {
        log.error({ err: error, manager: manager.email }, 'application digest failed');
      }
    }
  }
  log.info({ stale: stale.length, sent }, 'application digest');
  return { sent };
}

export const runApplicationDigest = async (): Promise<void> => {
  await sendApplicationDigests({ clock: systemClock });
};
