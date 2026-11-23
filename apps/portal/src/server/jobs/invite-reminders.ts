import { type Clock, systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { recordAudit } from '@/server/audit/record';
import { sendEmail } from '@/server/email/send';
import { buildApplicationInviteReminder } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';
import { claimInviteReminder, listInviteReminderCandidates } from '@/server/repo/applications';
import { inviteUrl } from '@/server/urls';

/**
 * Daily at 05:30 UTC. For every approved application whose invite is still unused 5 days after the decision: one email
 * to the applicant with a fresh link (the first token exists only as a hash). The sent marker is written first and only the
 * run that wrote it sends, so overlapping runs cannot send twice; a crash between the marker and the send loses an email,
 * never duplicates one. One failing application never stops the others. Staff get no reminder.
 */
export async function sendInviteReminders(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ sent: number }> {
  const actor = SYSTEM_ACTORS.portal;
  const ids = await withSystem(actor, (tx) => listInviteReminderCandidates(tx, actor, deps.clock));
  let sent = 0;
  for (const id of ids) {
    try {
      const payload = await withSystem(actor, async (tx) => {
        const claimed = await claimInviteReminder(tx, actor, id, deps.clock);
        if (claimed) {
          await recordAudit(tx, actor, {
            event: 'application.invite_reminder_sent',
            target: claimed.company,
            subject: { type: 'application', id },
            source: 'system',
          });
        }
        return claimed;
      });
      if (!payload) continue;
      await sendEmail(
        buildApplicationInviteReminder({
          to: { email: payload.email, name: payload.applicantName },
          applicantName: payload.applicantName,
          company: payload.company,
          inviteUrl: inviteUrl(payload.token),
          expiresOn: payload.expiresAt.slice(0, 10),
        }),
        deps.transport,
      );
      sent += 1;
    } catch (error) {
      log.error({ err: error, applicationId: id }, 'invite reminder failed');
    }
  }
  return { sent };
}

export const runInviteReminders = async (): Promise<void> => {
  await sendInviteReminders({ clock: systemClock });
};
