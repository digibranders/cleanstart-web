import { type Clock, systemClock } from '@/lib/clock';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildProtectionExpiryReminder } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { withSystem } from '@/server/repo/context';
import { listReminderCandidates, markReminderSent } from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';

/**
 * Daily at 05:00 UTC. For every accepted registration ending in exactly 14 or 3 days: one in-app notification per person,
 * the email where their "expiry" switch allows it, and the registration_reminders row that makes a second run a no op.
 * The notification and the row commit together; the email goes after, so a crash in between loses an email, never
 * sends a duplicate. One failing registration never stops the others.
 */
export async function sendExpiryReminders(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ candidates: number }> {
  const actor = SYSTEM_ACTORS.portal;
  const candidates = await withSystem(actor, (tx) => listReminderCandidates(tx, actor, deps.clock));
  for (const candidate of candidates) {
    try {
      const items = candidate.recipientUserIds.map(
        (userId): NewNotification => ({
          userId,
          kind: 'registration_expiring',
          title: `${candidate.customer} protection ends in ${candidate.daysBefore} days`,
          body: `${PRODUCT_LABEL[candidate.product]}, protected until ${fmtLong(candidate.protectionEnd)}`,
          link: ROUTES.partner.deal(candidate.registrationId),
        }),
      );
      await withSystem(actor, async (tx) => {
        await notifyUsers(tx, items);
        await markReminderSent(
          tx,
          actor,
          { registrationId: candidate.registrationId, daysBefore: candidate.daysBefore, protectionEnd: candidate.protectionEnd },
          deps.clock,
        );
      });
      for (const to of await resolveEmailRecipients(items)) {
        await sendEmail(
          buildProtectionExpiryReminder({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: candidate.customer,
            productLabel: PRODUCT_LABEL[candidate.product],
            daysLeft: candidate.daysBefore,
            protectionEnd: candidate.protectionEnd,
            dealUrl: absoluteUrl(ROUTES.partner.deal(candidate.registrationId)),
          }),
          deps.transport,
        );
      }
    } catch (error) {
      log.error({ err: error, registrationId: candidate.registrationId }, 'expiry reminder failed');
    }
  }
  return { candidates: candidates.length };
}

export const runExpiryReminders = async (): Promise<void> => {
  await sendExpiryReminders({ clock: systemClock });
};
