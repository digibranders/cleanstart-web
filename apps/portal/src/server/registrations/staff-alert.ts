import { env } from '@/env';
import { type DealRegion, PRODUCT_LABEL, type Product } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildDealSubmittedStaffAlert } from '@/server/email/templates';
import type { EmailAddress } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, resolveEmailRecipients } from '@/server/notify';
import { absoluteUrl } from '@/server/urls';
import { regionName } from '@/lib/regions';

/** The deal manager's address from their notification, or PARTNERS_NOTIFY_EMAIL when the deal has no manager. May be empty. */
export async function staffRecipients(items: readonly NewNotification[]): Promise<EmailAddress[]> {
  const recipients = await resolveEmailRecipients(items);
  const to: EmailAddress[] = recipients.map((r) => ({ email: r.email, name: r.name }));
  if (to.length === 0 && env.PARTNERS_NOTIFY_EMAIL) to.push({ email: env.PARTNERS_NOTIFY_EMAIL });
  return to;
}

export interface SubmissionAlert {
  partnerName: string;
  customer: string;
  products: Product[];
  region: DealRegion;
  registeredByName: string;
  resubmitted: boolean;
  /** The in-app notifications written for the deal's manager; their users get the email. */
  items: readonly NewNotification[];
}

/** After commit. Emails the deal's manager, or PARTNERS_NOTIFY_EMAIL when the deal has no manager. */
export async function sendSubmissionAlert(alert: SubmissionAlert): Promise<void> {
  const to = await staffRecipients(alert.items);
  if (to.length === 0) {
    log.warn({ customer: alert.customer }, 'no staff recipient for a registration alert');
    return;
  }
  await sendEmail(
    buildDealSubmittedStaffAlert({
      to,
      partnerName: alert.partnerName,
      customer: alert.customer,
      productLabel: alert.products.map((p) => PRODUCT_LABEL[p]).join(', '),
      regionLabel: regionName(alert.region),
      registeredByName: alert.registeredByName,
      resubmitted: alert.resubmitted,
      approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
    }),
  );
}
