import { and, asc, eq } from 'drizzle-orm';
import { partners, registrations, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { REVIEW_SLA_BUSINESS_DAYS, isOverSla, waitingBusinessDays } from '@/lib/deal-rules';
import { type DealRegion, PRODUCT_LABEL, type Product, type StaffRole, type StaffScope } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildPendingDigest, type DigestRegistrationRow } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';
import { absoluteUrl } from '@/server/urls';
import { isAllRegions, type RegionDto, regionName, scopeCovers } from '@/lib/regions';
import { listRegions } from '@/server/repo/regions';
import { loadScopes } from '@/server/staff-scope';

export interface DigestReviewer {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  regions: StaffScope;
}

export interface WaitingRegistration {
  customer: string;
  partnerName: string;
  product: Product;
  region: DealRegion;
  managerId: string | null;
  /** resubmitted_on, else registered_on. */
  since: string;
}

export interface ReviewerDigest {
  reviewer: DigestReviewer;
  registrations: DigestRegistrationRow[];
}

/** Past this many business days a registration is overdue, not just late. */
export const OVERDUE_BUSINESS_DAYS = REVIEW_SLA_BUSINESS_DAYS * 2;

/**
 * The approvals queue "mine" scope: a partner manager with regions sees those regions, one covering all sees the deals
 * routed to them (and the ones with no manager, which no one else would see); staff sales see their regions, or all.
 */
const inScope = (reviewer: DigestReviewer, row: WaitingRegistration): boolean => {
  if (reviewer.role === 'partner_manager') {
    return isAllRegions(reviewer.regions) ? row.managerId === reviewer.id || row.managerId === null : scopeCovers(reviewer.regions, row.region);
  }
  return scopeCovers(reviewer.regions, row.region);
};

/**
 * Pure. One digest per reviewer who has something waiting; marketing and anyone who cannot read the queue get none.
 * Registrations: overdue first, then longest waiting first.
 */
export function buildDigests(
  reviewers: readonly DigestReviewer[],
  waitingRegistrations: readonly WaitingRegistration[],
  today: string,
  regionList: readonly RegionDto[],
): ReviewerDigest[] {
  const digests: ReviewerDigest[] = [];
  for (const reviewer of reviewers) {
    if (reviewer.role === 'marketing') continue;
    const regs = waitingRegistrations
      .filter((row) => inScope(reviewer, row))
      .map((row): DigestRegistrationRow => {
        const days = waitingBusinessDays(row.since, today);
        return {
          customer: row.customer,
          partnerName: row.partnerName,
          productLabel: PRODUCT_LABEL[row.product],
          regionLabel: regionName(row.region, regionList),
          waitingBusinessDays: days,
          pastTarget: isOverSla(row.since, today),
          overdue: days > OVERDUE_BUSINESS_DAYS,
        };
      })
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.waitingBusinessDays - a.waitingBusinessDays);
    if (regs.length > 0) digests.push({ reviewer, registrations: regs });
  }
  return digests;
}

/**
 * Daily at 04:30 UTC, 10:00 IST. One email per active reviewer who has registrations waiting, nothing when nothing waits. Read only, so a second run on the same day simply sends the digest again;
 * the job lock keeps runs from overlapping. One failing email never stops the others.
 */
export async function sendPendingDigests(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ sent: number }> {
  const actor = SYSTEM_ACTORS.portal;
  const today = deps.clock.today();
  const { reviewers, regs, regionList } = await withSystem(actor, async (tx) => {
    const staff = await tx
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(and(eq(users.kind, 'staff'), eq(users.status, 'active')))
      .orderBy(asc(users.createdAt));
    const pending = await tx
      .select({
        customer: registrations.customerName,
        partnerName: partners.name,
        product: registrations.product,
        region: registrations.region,
        managerId: registrations.managerId,
        registeredOn: registrations.registeredOn,
        resubmittedOn: registrations.resubmittedOn,
      })
      .from(registrations)
      .innerJoin(partners, eq(partners.id, registrations.partnerId))
      .where(eq(registrations.status, 'pending'));
    const scopes = await loadScopes(tx, staff.map((s) => s.id));
    return {
      regionList: await listRegions(tx),
      reviewers: staff.map((s): DigestReviewer => ({ id: s.id, name: s.name, email: s.email, role: s.role as StaffRole, regions: scopes.get(s.id) ?? 'all' })),
      regs: pending.map((r): WaitingRegistration => ({ ...r, since: r.resubmittedOn ?? r.registeredOn })),
    };
  });

  const digests = buildDigests(reviewers, regs, today, regionList);
  let sent = 0;
  for (const digest of digests) {
    try {
      const result = await sendEmail(
        buildPendingDigest({
          to: { email: digest.reviewer.email, name: digest.reviewer.name },
          recipientName: digest.reviewer.name,
          registrations: digest.registrations,
          targetBusinessDays: REVIEW_SLA_BUSINESS_DAYS,
          approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
        }),
        deps.transport,
      );
      if (result.status !== 'failed') sent += 1;
    } catch (error) {
      log.error({ err: error, reviewerId: digest.reviewer.id }, 'pending digest failed');
    }
  }
  log.info({ reviewers: reviewers.length, sent }, 'pending digest');
  return { sent };
}

export const runPendingDigest = async (): Promise<void> => {
  await sendPendingDigests({ clock: systemClock });
};
