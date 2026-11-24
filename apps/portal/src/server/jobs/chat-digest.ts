import { inArray } from 'drizzle-orm';
import { users } from '@/db/schema';
import { CHAT_DIGEST_AFTER_MINUTES } from '@/lib/chat';
import { type Clock, systemClock } from '@/lib/clock';
import { ROUTES } from '@/lib/routes';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildChatDigest, type ChatDigestChat } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, resolveEmailRecipients } from '@/server/notify';
import { claimDigest } from '@/server/repo/chat';
import { withSystem } from '@/server/repo/context';
import { absoluteUrl } from '@/server/urls';

/**
 * Every 5 minutes. Messages that have been unread for 15 minutes in a chat the person has not muted become one email per person,
 * unless they switched "Unread messages" off under Account. The claim moves each chat's digest position forward inside one
 * statement, so a message is mentioned in at most one email, however often this runs and whether or not the send succeeds.
 */
export async function sendChatDigests(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ sent: number }> {
  const now = deps.clock.now();
  const claimed = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
    claimDigest(tx, { olderThan: new Date(now.getTime() - CHAT_DIGEST_AFTER_MINUTES * 60_000), now }),
  );
  if (claimed.length === 0) return { sent: 0 };

  const byUser = new Map<string, ChatDigestChat[]>();
  for (const item of claimed) byUser.set(item.userId, [...(byUser.get(item.userId) ?? []), { title: item.title, unread: item.unread, lastPreview: item.lastPreview }]);

  const probes: NewNotification[] = [...byUser.keys()].map((userId) => ({ userId, kind: 'chat_mention', title: 'Unread messages' }));
  const wanted = await resolveEmailRecipients(probes);
  const people = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
    tx.select({ id: users.id, status: users.status, kind: users.kind }).from(users).where(inArray(users.id, wanted.map((w) => w.userId))),
  );
  const active = new Map(people.filter((p) => p.status === 'active').map((p) => [p.id, p.kind]));

  let sent = 0;
  for (const recipient of wanted) {
    const kind = active.get(recipient.userId);
    if (!kind) continue;
    const chats = byUser.get(recipient.userId) ?? [];
    try {
      const result = await sendEmail(
        buildChatDigest({ to: { email: recipient.email, name: recipient.name }, recipientName: recipient.name, chats, messagesUrl: absoluteUrl(kind === 'staff' ? ROUTES.admin.messages : ROUTES.partner.messages) }),
        deps.transport,
      );
      if (result.status !== 'failed') sent += 1;
    } catch (error) {
      log.error({ err: error, userId: recipient.userId }, 'chat digest failed');
    }
  }
  log.info({ people: byUser.size, sent }, 'chat digest');
  return { sent };
}

export const runChatDigest = async (): Promise<void> => {
  await sendChatDigests({ clock: systemClock });
};
