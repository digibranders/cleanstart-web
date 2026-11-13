import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { partners, registrations } from '@/db/schema';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildDealStageChanged } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { absoluteUrl } from '@/server/urls';
import { decisionRecipients } from './recipients';

export type RegistrationChange =
  | { registrationId: string; kind: 'stage_changed'; stage: string }
  | { registrationId: string; kind: 'protection_end_changed'; protectionEnd: string }
  | { registrationId: string; kind: 'expired' };

/**
 * Called by the HubSpot poll and the expiry job (H4.8) after a change commits; they run on the system db and have no
 * after-commit hook, so this opens its own transaction. The in-app notification always exists; the email follows the
 * recipient's "stage" or "expiry" switch, and a changed end date is told in the app only.
 */
export async function announceRegistrationChange(
  deps: { db: Db; transport?: EmailTransport },
  change: RegistrationChange,
): Promise<void> {
  const loaded = await deps.db.transaction(async (tx) => {
    const [reg] = await tx
      .select({
        id: registrations.id,
        customer: registrations.customerName,
        product: registrations.product,
        partnerId: registrations.partnerId,
        registeredBy: registrations.registeredBy,
        partnerName: partners.name,
      })
      .from(registrations)
      .innerJoin(partners, eq(partners.id, registrations.partnerId))
      .where(eq(registrations.id, change.registrationId))
      .limit(1);
    if (!reg) return null;
    const recipients = await decisionRecipients(tx, { partnerId: reg.partnerId, registeredById: reg.registeredBy });
    const base = { body: PRODUCT_LABEL[reg.product], link: ROUTES.partner.deal(reg.id) };
    const items = recipients.map((userId): NewNotification => {
      if (change.kind === 'stage_changed') {
        return { userId, kind: 'registration_stage', title: `${reg.customer} moved to ${change.stage}`, ...base };
      }
      if (change.kind === 'protection_end_changed') {
        return { userId, kind: 'registration_stage', title: `${reg.customer} protection now ends ${fmtLong(change.protectionEnd)}`, ...base };
      }
      return { userId, kind: 'registration_expired', title: `${reg.customer} protection ended`, ...base };
    });
    await notifyUsers(tx, items);
    return { reg, items };
  });
  if (!loaded || change.kind === 'protection_end_changed') return;

  const stage = change.kind === 'stage_changed' ? change.stage : 'Registration expired';
  for (const to of await resolveEmailRecipients(loaded.items)) {
    await sendEmail(
      buildDealStageChanged({
        to: { email: to.email, name: to.name },
        recipientName: to.name,
        customer: loaded.reg.customer,
        productLabel: PRODUCT_LABEL[loaded.reg.product],
        stage,
        dealUrl: absoluteUrl(ROUTES.partner.deal(loaded.reg.id)),
      }),
      deps.transport,
    );
  }
}
