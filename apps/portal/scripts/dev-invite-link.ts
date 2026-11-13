import { and, desc, eq, isNull } from 'drizzle-orm';
import { invites } from '../src/db/schema';
import { systemClock } from '../src/lib/clock';
import { SYSTEM_ACTORS } from '../src/server/auth/types';
import { rotateInviteToken } from '../src/server/invite-core';
import { withSystem } from '../src/server/repo/context';
import { inviteUrl } from '../src/server/urls';

if (process.env.NODE_ENV === 'production') throw new Error('dev-invite-link is for local development only');
const databaseHost = new URL(process.env.DATABASE_URL ?? 'postgres://invalid').hostname;
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(databaseHost)) {
  throw new Error(`dev-invite-link refuses a database that is not on this machine (${databaseHost})`);
}
const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error('Usage: tsx --env-file=.env scripts/dev-invite-link.ts <email>');

const url = await withSystem(SYSTEM_ACTORS.portal, async (tx) => {
  const [open] = await tx
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.email, email), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(desc(invites.createdAt))
    .limit(1);
  if (!open) return null;
  const rotated = await rotateInviteToken(tx, open.id, systemClock);
  return rotated ? inviteUrl(rotated.token) : null;
});

console.log(url ?? `No open invite for ${email}. Approve an application or add a partner first.`);
process.exit(0);
