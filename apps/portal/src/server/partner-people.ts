import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { invites, users } from '@/db/schema';
import type { PartnerRole } from '@/lib/domain';
import { nameFromEmail } from '@/lib/people';
import type { Tx } from '@/server/repo/context';

/**
 * One person of a partner company as the Team screen and the partner detail see them: a user with a login, or someone
 * who only has an open invite (no users row yet). For an invite-only row `id` is the invite id and `userId` is null.
 */
export interface PersonRow {
  id: string;
  userId: string | null;
  inviteId: string | null;
  name: string;
  email: string;
  role: PartnerRole;
  status: 'active' | 'invited';
  lastLoginAt: Date | null;
  invitedAt: Date | null;
}

/** Active people first (oldest account first), then invited ones. Removed (disabled) people are left out. */
export async function loadPartnerPeople(tx: Tx, partnerId: string): Promise<PersonRow[]> {
  const members = await tx
    .select()
    .from(users)
    .where(and(eq(users.partnerId, partnerId), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.partnerId, partnerId), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));

  const rows: PersonRow[] = members.map((u) => ({
    id: u.id,
    userId: u.id,
    inviteId: open.find((i) => i.email === u.email)?.id ?? null,
    name: u.name,
    email: u.email,
    role: u.role as PartnerRole,
    status: u.status === 'active' ? 'active' : 'invited',
    lastLoginAt: u.lastLoginAt,
    invitedAt: u.invitedAt,
  }));
  for (const invite of open) {
    if (members.some((u) => u.email === invite.email)) continue;
    rows.push({
      id: invite.id,
      userId: null,
      inviteId: invite.id,
      name: nameFromEmail(invite.email),
      email: invite.email,
      role: invite.role as PartnerRole,
      status: 'invited',
      lastLoginAt: null,
      invitedAt: invite.createdAt,
    });
  }
  return [...rows.filter((r) => r.status === 'active'), ...rows.filter((r) => r.status === 'invited')];
}
