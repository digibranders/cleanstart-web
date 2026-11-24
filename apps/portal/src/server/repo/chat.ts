import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, ilike, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import {
  chatAttachments,
  chatConversations,
  chatMembers,
  chatMessages,
  chatPins,
  chatPresence,
  chatReactions,
  chatTyping,
  documents,
  partners,
  registrations,
  users,
} from '@/db/schema';
import {
  CHAT_EDIT_WINDOW_MINUTES,
  CHAT_FILE_MAX_BYTES,
  CHAT_MAX_BODY,
  CHAT_MAX_FILES,
  CHAT_MAX_MEMBERS,
  CHAT_MAX_TITLE,
  CHAT_ONLINE_SECONDS,
  CHAT_PAGE_SIZE,
  CHAT_TYPING_SECONDS,
  type ChatAttachmentDto,
  type ChatConversationDto,
  type ChatInboxDto,
  type ChatKind,
  type ChatMemberDto,
  type ChatMessageDto,
  type ChatPersonDto,
  type ChatPollDto,
  type ChatReactionDto,
  type ChatRefDto,
  type ChatRefKind,
  CHAT_REACTION_KEYS,
  previewOf,
} from '@/lib/chat';
import { type Clock, fixedClock, systemClock } from '@/lib/clock';
import { isAllRegions, scopeCovers } from '@/lib/regions';
import { ROUTES } from '@/lib/routes';
import { staffDealHref } from '@/lib/staff-deals-dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import type { Queryable, Tx } from './context';
import { defineIsolation } from './isolation.registry';

type ConversationRow = typeof chatConversations.$inferSelect;
type MessageRow = typeof chatMessages.$inferSelect;
type MemberRow = typeof chatMembers.$inferSelect;

const ORG_STAFF = 'CleanStart';

const orgOf = (viewer: Viewer): string => (viewer.kind === 'partner' ? viewer.partnerName : ORG_STAFF);
const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;
const iso = (date: Date | null): string | null => (date ? date.toISOString() : null);
const issue = (path: string, message: string): ValidationError => new ValidationError([{ path, message }]);

/** The conversation, or NotFoundError: row level security hides every chat the viewer is not in. */
async function loadConversation(tx: Tx, id: string): Promise<ConversationRow> {
  assertUuid(id, 'chat');
  const [row] = await tx.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  if (!row) throw new NotFoundError('chat');
  return row;
}

async function loadMyMembership(tx: Tx, viewer: Viewer, conversationId: string): Promise<MemberRow> {
  const [row] = await tx
    .select()
    .from(chatMembers)
    .where(and(eq(chatMembers.conversationId, conversationId), eq(chatMembers.userId, viewer.id), isNull(chatMembers.leftAt)))
    .limit(1);
  if (!row) throw new NotFoundError('chat');
  return row;
}

/** Takes the next message number and revision from the conversation row. The row lock serialises senders, so a poll for "rev > n" never skips a late commit. */
async function bump(tx: Tx, conversationId: string, opts: { message: boolean; at: Date; preview?: string | null }): Promise<{ seq: number; rev: number }> {
  const [row] = await tx
    .update(chatConversations)
    .set({
      rev: sql`${chatConversations.rev} + 1`,
      ...(opts.message ? { lastMsgSeq: sql`${chatConversations.lastMsgSeq} + 1`, lastMessageAt: opts.at } : {}),
      ...(opts.preview !== undefined ? { lastPreview: opts.preview } : {}),
    })
    .where(eq(chatConversations.id, conversationId))
    .returning({ seq: chatConversations.lastMsgSeq, rev: chatConversations.rev });
  if (!row) throw new NotFoundError('chat');
  return row;
}

/* ---------------------------------------------------------------- people */

interface PersonRow {
  id: string;
  name: string;
  kind: 'partner' | 'staff';
  role: string;
  partnerId: string | null;
  partnerName: string | null;
  partnerRegion: string | null;
}

const toPerson = (row: PersonRow): ChatPersonDto => ({
  id: row.id,
  name: row.name,
  org: row.kind === 'staff' ? ORG_STAFF : (row.partnerName ?? ''),
  role: row.role,
  isStaff: row.kind === 'staff',
});

async function loadPeopleRows(tx: Tx, where: ReturnType<typeof and>): Promise<PersonRow[]> {
  return tx
    .select({
      id: users.id,
      name: users.name,
      kind: users.kind,
      role: users.role,
      partnerId: users.partnerId,
      partnerName: partners.name,
      partnerRegion: partners.region,
    })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .where(where);
}

/** A staff viewer with a limited scope may only chat with partners in their regions. */
const staffMayReach = (viewer: Viewer, person: PersonRow): boolean =>
  viewer.kind !== 'staff' || person.kind === 'staff' || isAllRegions(viewer.regions) || (person.partnerRegion !== null && scopeCovers(viewer.regions, person.partnerRegion));

/**
 * The people this viewer may start a chat with. Row level security already limits a partner to colleagues, their manager and the active
 * partner managers; a staff viewer must type at least two letters (nobody wants the whole directory) and sees partners in scope.
 */
export async function listPeople(tx: Tx, viewer: Viewer, input: { query: string }): Promise<ChatPersonDto[]> {
  const q = input.query.trim();
  if (viewer.kind === 'staff' && q.length < 2) return [];
  const match = q === '' ? undefined : or(ilike(users.name, `%${q.replace(/[%_\\]/g, '\\$&')}%`), ilike(users.email, `%${q.replace(/[%_\\]/g, '\\$&')}%`));
  const rows = await loadPeopleRows(tx, and(eq(users.status, 'active'), ne(users.id, viewer.id), match));
  return rows
    .filter((row) => staffMayReach(viewer, row))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 30)
    .map(toPerson);
}

/* ---------------------------------------------------------------- creating chats */

async function insertMembers(tx: Tx, conversationId: string, people: PersonRow[], ownerId: string): Promise<void> {
  await tx.insert(chatMembers).values(
    people.map((person) => ({
      conversationId,
      userId: person.id,
      displayName: person.name,
      org: person.kind === 'staff' ? ORG_STAFF : (person.partnerName ?? ''),
      isStaff: person.kind === 'staff',
      role: person.id === ownerId ? ('owner' as const) : ('member' as const),
    })),
  );
}

async function selfAsPerson(tx: Tx, viewer: Viewer): Promise<PersonRow> {
  const [row] = (await loadPeopleRows(tx, eq(users.id, viewer.id))).slice(0, 1);
  if (!row) throw new NotFoundError('person');
  return row;
}

/** The partner a set of people belongs to: their one shared company, null when all are staff, or a ValidationError when companies are mixed. */
function sharedPartner(people: readonly PersonRow[]): string | null {
  const ids = new Set(people.filter((p) => p.kind === 'partner').map((p) => p.partnerId));
  if (ids.size > 1) throw issue('userIds', 'A chat can hold people from one partner company only.');
  return [...ids][0] ?? null;
}

/** Opens (or returns) the one direct chat between the viewer and another person. */
export async function openDirect(tx: Tx, viewer: Viewer, input: { userId: string }, clock: Clock): Promise<{ id: string; created: boolean }> {
  assertUuid(input.userId, 'person');
  if (input.userId === viewer.id) throw issue('userId', 'Pick someone else.');
  const [target] = await loadPeopleRows(tx, and(eq(users.id, input.userId), eq(users.status, 'active')));
  if (!target || !staffMayReach(viewer, target)) throw new NotFoundError('person');
  const key = [viewer.id, target.id].sort().join(':');
  const [existing] = await tx.select({ id: chatConversations.id }).from(chatConversations).where(eq(chatConversations.directKey, key)).limit(1);
  if (existing) return { id: existing.id, created: false };
  const me = await selfAsPerson(tx, viewer);
  const id = randomUUID();
  await tx.insert(chatConversations).values({
    id,
    kind: 'direct',
    partnerId: sharedPartner([me, target]),
    createdBy: viewer.id,
    memberIds: [viewer.id, target.id],
    directKey: key,
    createdAt: clock.now(),
  });
  await insertMembers(tx, id, [me, target], viewer.id);
  return { id, created: true };
}

/** A named group. A partner viewer's group is inside their company; a staff viewer's holds one partner's people and staff, or only staff. */
export async function createGroup(tx: Tx, viewer: Viewer, input: { title: string; userIds: string[] }, clock: Clock): Promise<{ id: string }> {
  const title = input.title.trim();
  if (title === '') throw issue('title', 'Name the group.');
  if (title.length > CHAT_MAX_TITLE) throw issue('title', `Keep the name under ${CHAT_MAX_TITLE} characters.`);
  const ids = [...new Set(input.userIds.filter((id) => id !== viewer.id))];
  for (const id of ids) assertUuid(id, 'person');
  if (ids.length === 0) throw issue('userIds', 'Add at least one person.');
  if (ids.length + 1 > CHAT_MAX_MEMBERS) throw issue('userIds', `A group holds up to ${CHAT_MAX_MEMBERS} people.`);
  const others = (await loadPeopleRows(tx, and(inArray(users.id, ids), eq(users.status, 'active')))).filter((p) => staffMayReach(viewer, p));
  if (others.length !== ids.length) throw new NotFoundError('person');
  const me = await selfAsPerson(tx, viewer);
  const everyone = [me, ...others];
  const id = randomUUID();
  const now = clock.now();
  await tx.insert(chatConversations).values({
    id,
    kind: 'group',
    partnerId: sharedPartner(everyone),
    title,
    createdBy: viewer.id,
    memberIds: everyone.map((p) => p.id),
    createdAt: now,
  });
  await insertMembers(tx, id, everyone, viewer.id);
  await postSystem(tx, viewer, id, `${me.name} created the group`, now);
  return { id };
}

/** A line in the thread such as "Priya added Arun". It counts as a message (so it can be unread) but never needs a body check. */
async function postSystem(tx: Tx, viewer: Viewer, conversationId: string, text: string, at: Date): Promise<void> {
  const { seq, rev } = await bump(tx, conversationId, { message: true, at, preview: text });
  await tx.insert(chatMessages).values({
    conversationId,
    seq,
    rev,
    kind: 'system',
    senderId: viewer.id,
    senderName: viewer.name,
    senderOrg: orgOf(viewer),
    body: text,
    createdAt: at,
  });
  await tx
    .update(chatMembers)
    .set({ lastReadSeq: sql`greatest(${chatMembers.lastReadSeq}, ${seq})`, lastDeliveredSeq: sql`greatest(${chatMembers.lastDeliveredSeq}, ${seq})` })
    .where(and(eq(chatMembers.conversationId, conversationId), eq(chatMembers.userId, viewer.id)));
}

async function assertCanManage(tx: Tx, viewer: Viewer, conversation: ConversationRow): Promise<void> {
  if (conversation.kind !== 'group') throw new ConflictError('direct_chat', 'A direct chat has no members to manage.');
  const mine = await loadMyMembership(tx, viewer, conversation.id);
  const isManager = viewer.kind === 'staff' && viewer.role === 'partner_manager';
  if (mine.role !== 'owner' && !isManager) throw new ForbiddenError('only the owner or a partner manager can manage this group');
}

export async function addMembers(tx: Tx, viewer: Viewer, input: { conversationId: string; userIds: string[] }, clock: Clock): Promise<void> {
  const conversation = await loadConversation(tx, input.conversationId);
  await assertCanManage(tx, viewer, conversation);
  const ids = [...new Set(input.userIds)].filter((id) => !conversation.memberIds.includes(id));
  for (const id of ids) assertUuid(id, 'person');
  if (ids.length === 0) return;
  if (conversation.memberIds.length + ids.length > CHAT_MAX_MEMBERS) throw issue('userIds', `A group holds up to ${CHAT_MAX_MEMBERS} people.`);
  const added = (await loadPeopleRows(tx, and(inArray(users.id, ids), eq(users.status, 'active')))).filter((p) => staffMayReach(viewer, p));
  if (added.length !== ids.length) throw new NotFoundError('person');
  await tx
    .update(chatConversations)
    .set({ memberIds: [...conversation.memberIds, ...added.map((p) => p.id)] })
    .where(eq(chatConversations.id, conversation.id));
  for (const person of added) {
    await tx
      .insert(chatMembers)
      .values({
        conversationId: conversation.id,
        userId: person.id,
        displayName: person.name,
        org: person.kind === 'staff' ? ORG_STAFF : (person.partnerName ?? ''),
        isStaff: person.kind === 'staff',
        lastReadSeq: conversation.lastMsgSeq,
        lastDeliveredSeq: conversation.lastMsgSeq,
      })
      .onConflictDoUpdate({ target: [chatMembers.conversationId, chatMembers.userId], set: { leftAt: null, displayName: person.name } });
  }
  await postSystem(tx, viewer, conversation.id, `${viewer.name} added ${added.map((p) => p.name).join(', ')}`, clock.now());
}

/** The owner or a partner manager removes someone else. Leaving is leaveGroup then completeLeave. */
export async function removeMember(tx: Tx, viewer: Viewer, input: { conversationId: string; userId: string }, clock: Clock): Promise<void> {
  if (input.userId === viewer.id) throw issue('userId', 'Use Leave group to leave.');
  const conversation = await loadConversation(tx, input.conversationId);
  await assertCanManage(tx, viewer, conversation);
  const target = await activeMember(tx, conversation.id, input.userId);
  await postSystem(tx, viewer, conversation.id, `${viewer.name} removed ${target.displayName}`, clock.now());
  await tx.update(chatMembers).set({ leftAt: clock.now(), role: 'member' }).where(and(eq(chatMembers.conversationId, conversation.id), eq(chatMembers.userId, input.userId)));
  await tx.update(chatConversations).set({ memberIds: conversation.memberIds.filter((id) => id !== input.userId) }).where(eq(chatConversations.id, conversation.id));
  if (target.role === 'owner') await promoteOwner(tx, conversation.id, conversation.memberIds.filter((id) => id !== input.userId));
}

async function activeMember(tx: Tx, conversationId: string, userId: string): Promise<MemberRow> {
  const [row] = await tx
    .select()
    .from(chatMembers)
    .where(and(eq(chatMembers.conversationId, conversationId), eq(chatMembers.userId, userId), isNull(chatMembers.leftAt)))
    .limit(1);
  if (!row) throw new NotFoundError('member');
  return row;
}

async function promoteOwner(tx: Tx, conversationId: string, remaining: readonly string[]): Promise<void> {
  const next = remaining[0];
  if (next) await tx.update(chatMembers).set({ role: 'owner' }).where(and(eq(chatMembers.conversationId, conversationId), eq(chatMembers.userId, next)));
}

/**
 * Step one of leaving a group, as the viewer: checks, the "left" line, and handing the group to someone else if the leaver owned it.
 * Row level security refuses an update that takes the updater out of the chat, so the last step is completeLeave in system scope.
 */
export async function leaveGroup(tx: Tx, viewer: Viewer, input: { conversationId: string }, clock: Clock): Promise<void> {
  const conversation = await loadConversation(tx, input.conversationId);
  if (conversation.kind !== 'group') throw new ConflictError('direct_chat', 'A direct chat cannot be left.');
  const me = await activeMember(tx, conversation.id, viewer.id);
  const remaining = conversation.memberIds.filter((id) => id !== viewer.id);
  if (remaining.length === 0) throw new ConflictError('last_member', 'You are the last person in this group.');
  await postSystem(tx, viewer, conversation.id, `${viewer.name} left`, clock.now());
  if (me.role === 'owner') await promoteOwner(tx, conversation.id, remaining);
}

/** Step two of leaving, system scope: the person is out and sees nothing of the chat any more. */
export async function completeLeave(q: Queryable, input: { conversationId: string; userId: string; at: Date }): Promise<void> {
  await q.update(chatMembers).set({ leftAt: input.at, role: 'member' }).where(and(eq(chatMembers.conversationId, input.conversationId), eq(chatMembers.userId, input.userId)));
  await q
    .update(chatConversations)
    .set({ memberIds: sql`array_remove(${chatConversations.memberIds}, ${input.userId}::uuid)` })
    .where(eq(chatConversations.id, input.conversationId));
}

export async function renameGroup(tx: Tx, viewer: Viewer, input: { conversationId: string; title: string }, clock: Clock): Promise<void> {
  const title = input.title.trim();
  if (title === '') throw issue('title', 'Name the group.');
  if (title.length > CHAT_MAX_TITLE) throw issue('title', `Keep the name under ${CHAT_MAX_TITLE} characters.`);
  const conversation = await loadConversation(tx, input.conversationId);
  await assertCanManage(tx, viewer, conversation);
  await tx.update(chatConversations).set({ title }).where(eq(chatConversations.id, conversation.id));
  await postSystem(tx, viewer, conversation.id, `${viewer.name} renamed the group to ${title}`, clock.now());
}

/* ---------------------------------------------------------------- reading */

const onlineCutoff = (clock: Clock): number => clock.now().getTime() - CHAT_ONLINE_SECONDS * 1000;

async function loadMembers(tx: Tx, conversationIds: readonly string[], clock: Clock): Promise<Map<string, ChatMemberDto[]>> {
  const out = new Map<string, ChatMemberDto[]>();
  if (conversationIds.length === 0) return out;
  const rows = await tx.select().from(chatMembers).where(inArray(chatMembers.conversationId, [...conversationIds]));
  const seen = await tx.select().from(chatPresence).where(inArray(chatPresence.userId, [...new Set(rows.map((r) => r.userId))]));
  const lastSeen = new Map(seen.map((p) => [p.userId, p.seenAt.getTime()]));
  const cutoff = onlineCutoff(clock);
  for (const row of rows) {
    const dto: ChatMemberDto = {
      userId: row.userId,
      name: row.displayName,
      org: row.org,
      role: row.role,
      isStaff: row.isStaff,
      online: row.leftAt === null && (lastSeen.get(row.userId) ?? 0) >= cutoff,
      lastReadSeq: row.lastReadSeq,
      lastDeliveredSeq: row.lastDeliveredSeq,
      left: row.leftAt !== null,
    };
    out.set(row.conversationId, [...(out.get(row.conversationId) ?? []), dto]);
  }
  return out;
}

function toConversationDto(viewer: Viewer, row: ConversationRow, members: ChatMemberDto[]): ChatConversationDto {
  const mine = members.find((m) => m.userId === viewer.id);
  const other = members.find((m) => m.userId !== viewer.id && !m.left);
  const active = members.filter((m) => !m.left);
  const myRow = mine;
  const isManager = viewer.kind === 'staff' && viewer.role === 'partner_manager';
  return {
    id: row.id,
    kind: row.kind as ChatKind,
    title: row.kind === 'direct' ? (other?.name ?? 'Chat') : (row.title ?? 'Group'),
    subtitle: row.kind === 'direct' ? (other?.org ?? null) : `${active.length} ${active.length === 1 ? 'person' : 'people'}`,
    partnerId: row.partnerId,
    members,
    unread: Math.max(0, row.lastMsgSeq - (myRow?.lastReadSeq ?? 0)),
    muted: false,
    mutedUntil: null,
    lastPreview: row.lastPreview,
    lastMessageAt: iso(row.lastMessageAt),
    lastMsgSeq: row.lastMsgSeq,
    rev: row.rev,
    canManage: row.kind === 'group' && (myRow?.role === 'owner' || isManager),
  };
}

async function withMuted(tx: Tx, viewer: Viewer, dtos: ChatConversationDto[], clock: Clock): Promise<ChatConversationDto[]> {
  if (dtos.length === 0) return dtos;
  const rows = await tx
    .select({ conversationId: chatMembers.conversationId, mutedUntil: chatMembers.mutedUntil })
    .from(chatMembers)
    .where(and(eq(chatMembers.userId, viewer.id), inArray(chatMembers.conversationId, dtos.map((d) => d.id))));
  const until = new Map(rows.map((r) => [r.conversationId, r.mutedUntil]));
  const now = clock.now().getTime();
  return dtos.map((dto) => {
    const mutedUntil = until.get(dto.id) ?? null;
    return { ...dto, muted: mutedUntil !== null && mutedUntil.getTime() > now, mutedUntil: iso(mutedUntil) };
  });
}

/** Every chat the viewer is in, latest first, with unread counts. Also marks them delivered and shows the viewer as online. */
export async function listInbox(tx: Tx, viewer: Viewer, clock: Clock): Promise<ChatInboxDto> {
  const now = clock.now();
  await tx.insert(chatPresence).values({ userId: viewer.id, seenAt: now }).onConflictDoUpdate({ target: chatPresence.userId, set: { seenAt: now } });
  await tx
    .update(chatMembers)
    .set({ lastDeliveredSeq: sql`(select c.last_msg_seq from chat_conversations c where c.id = ${chatMembers.conversationId})` })
    .where(
      and(
        eq(chatMembers.userId, viewer.id),
        isNull(chatMembers.leftAt),
        sql`${chatMembers.lastDeliveredSeq} < (select c.last_msg_seq from chat_conversations c where c.id = ${chatMembers.conversationId})`,
      ),
    );
  const rows = await tx
    .select()
    .from(chatConversations)
    .orderBy(sql`${chatConversations.lastMessageAt} desc nulls last`, desc(chatConversations.createdAt))
    .limit(200);
  const members = await loadMembers(tx, rows.map((r) => r.id), clock);
  const conversations = await withMuted(tx, viewer, rows.map((row) => toConversationDto(viewer, row, members.get(row.id) ?? [])), clock);
  return { conversations, unreadTotal: conversations.reduce((sum, c) => sum + (c.muted ? 0 : c.unread), 0) };
}

/** How many unread messages the viewer has outside muted chats: the sidebar badge. */
export async function countUnread(tx: Tx, viewer: Viewer, clock: Clock): Promise<number> {
  const [row] = await tx
    .select({
      n: sql<number>`coalesce(sum(greatest(0, ${chatConversations.lastMsgSeq} - ${chatMembers.lastReadSeq})), 0)::int`,
    })
    .from(chatMembers)
    .innerJoin(chatConversations, eq(chatConversations.id, chatMembers.conversationId))
    .where(
      and(
        eq(chatMembers.userId, viewer.id),
        isNull(chatMembers.leftAt),
        or(isNull(chatMembers.mutedUntil), sql`${chatMembers.mutedUntil} <= ${clock.now()}`),
      ),
    );
  return row?.n ?? 0;
}

export async function getConversation(tx: Tx, viewer: Viewer, input: { conversationId: string }, clock: Clock): Promise<ChatConversationDto> {
  const row = await loadConversation(tx, input.conversationId);
  const members = await loadMembers(tx, [row.id], clock);
  const [dto] = await withMuted(tx, viewer, [toConversationDto(viewer, row, members.get(row.id) ?? [])], clock);
  if (!dto) throw new NotFoundError('chat');
  return dto;
}

const excerpt = (body: string): string => {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > 90 ? `${flat.slice(0, 87)}...` : flat;
};

const DOC_TYPE_LABEL: Record<string, string> = { deck: 'Deck', datasheet: 'Datasheet', video: 'Video', playbook: 'Playbook' };

async function resolveRefs(tx: Tx, viewer: Viewer, refs: ReadonlyArray<{ kind: ChatRefKind; id: string }>): Promise<Map<string, ChatRefDto>> {
  const out = new Map<string, ChatRefDto>();
  const dealIds = [...new Set(refs.filter((r) => r.kind === 'deal').map((r) => r.id))];
  const docIds = [...new Set(refs.filter((r) => r.kind === 'doc').map((r) => r.id))];
  if (dealIds.length > 0) {
    const rows = await tx
      .select({ id: registrations.id, customer: registrations.customerName, reference: registrations.reference, status: registrations.status })
      .from(registrations)
      .where(and(inArray(registrations.id, dealIds), registrationScope(viewer)));
    for (const row of rows) {
      out.set(`deal:${row.id}`, {
        kind: 'deal',
        id: row.id,
        title: row.customer,
        sub: `${row.reference}, ${row.status}`,
        href: viewer.kind === 'partner' ? ROUTES.partner.deal(row.id) : staffDealHref(row.id),
      });
    }
  }
  if (docIds.length > 0) {
    const rows = await tx
      .select({ id: documents.id, title: documents.title, type: documents.type })
      .from(documents)
      .where(and(inArray(documents.id, docIds), eq(documents.status, 'published'), isNull(documents.deletedAt)));
    for (const row of rows) {
      out.set(`doc:${row.id}`, {
        kind: 'doc',
        id: row.id,
        title: row.title,
        sub: DOC_TYPE_LABEL[row.type] ?? row.type,
        href: viewer.kind === 'partner' ? ROUTES.partner.documents : ROUTES.admin.documents,
      });
    }
  }
  for (const ref of refs) {
    if (!out.has(`${ref.kind}:${ref.id}`)) out.set(`${ref.kind}:${ref.id}`, { kind: ref.kind, id: ref.id, title: null, sub: null, href: null });
  }
  return out;
}

/** Messages with their reactions, files, pins, reply quotes and shared cards, all read under the viewer's own access. */
async function hydrate(tx: Tx, viewer: Viewer, conversationId: string, rows: MessageRow[]): Promise<ChatMessageDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [files, reactions, pins, replies, members] = await Promise.all([
    tx.select().from(chatAttachments).where(inArray(chatAttachments.messageId, ids)).orderBy(asc(chatAttachments.createdAt)),
    tx.select().from(chatReactions).where(inArray(chatReactions.messageId, ids)).orderBy(asc(chatReactions.createdAt)),
    tx.select({ messageId: chatPins.messageId }).from(chatPins).where(eq(chatPins.conversationId, conversationId)),
    (() => {
      const replyIds = [...new Set(rows.map((r) => r.replyToId).filter((id): id is string => id !== null))];
      return replyIds.length === 0
        ? Promise.resolve([] as Array<{ id: string; senderName: string; body: string; deletedAt: Date | null }>)
        : tx.select({ id: chatMessages.id, senderName: chatMessages.senderName, body: chatMessages.body, deletedAt: chatMessages.deletedAt }).from(chatMessages).where(inArray(chatMessages.id, replyIds));
    })(),
    tx.select({ userId: chatMembers.userId, name: chatMembers.displayName }).from(chatMembers).where(eq(chatMembers.conversationId, conversationId)),
  ]);
  const refMap = await resolveRefs(tx, viewer, rows.flatMap((r) => r.refs));
  const pinned = new Set(pins.map((p) => p.messageId));
  const nameOf = new Map(members.map((m) => [m.userId, m.name]));
  const replyOf = new Map(replies.map((r) => [r.id, r]));
  return rows.map((row) => {
    const deleted = row.deletedAt !== null;
    const mine = reactions.filter((r) => r.messageId === row.id);
    const grouped: ChatReactionDto[] = CHAT_REACTION_KEYS.flatMap((key) => {
      const these = mine.filter((r) => r.emoji === key);
      return these.length === 0 ? [] : [{ key, count: these.length, mine: these.some((r) => r.userId === viewer.id), names: these.map((r) => r.userName) }];
    });
    const reply = row.replyToId ? replyOf.get(row.replyToId) : undefined;
    const attachments: ChatAttachmentDto[] = deleted
      ? []
      : files
          .filter((f) => f.messageId === row.id)
          .map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size, url: `/api/chat/files/${f.id}`, deleted: f.deletedAt !== null }));
    return {
      id: row.id,
      seq: row.seq,
      rev: row.rev,
      kind: row.kind,
      senderId: row.senderId,
      senderName: row.senderName,
      senderOrg: row.senderOrg,
      body: deleted ? '' : row.body,
      replyTo: reply ? { id: reply.id, senderName: reply.senderName, excerpt: reply.deletedAt ? 'Message deleted' : excerpt(reply.body) } : null,
      mentions: deleted ? [] : row.mentions.map((id) => nameOf.get(id) ?? '').filter((n) => n !== ''),
      refs: deleted ? [] : row.refs.map((r) => refMap.get(`${r.kind}:${r.id}`) ?? { kind: r.kind, id: r.id, title: null, sub: null, href: null }),
      attachments,
      reactions: deleted ? [] : grouped,
      pinned: !deleted && pinned.has(row.id),
      editedAt: iso(row.editedAt),
      deleted,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

/** The newest page of a chat, or the page before `beforeSeq`. Oldest first, ready to render. */
export async function loadMessages(
  tx: Tx,
  viewer: Viewer,
  input: { conversationId: string; beforeSeq?: number },
): Promise<{ messages: ChatMessageDto[]; hasMore: boolean }> {
  const conversation = await loadConversation(tx, input.conversationId);
  const rows = await tx
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.conversationId, conversation.id), input.beforeSeq === undefined ? undefined : lt(chatMessages.seq, input.beforeSeq)))
    .orderBy(desc(chatMessages.seq))
    .limit(CHAT_PAGE_SIZE + 1);
  const page = rows.slice(0, CHAT_PAGE_SIZE).reverse();
  return { messages: await hydrate(tx, viewer, conversation.id, page), hasMore: rows.length > CHAT_PAGE_SIZE };
}

/** What changed since the viewer's last poll: messages with a newer rev, read and delivery positions, who is typing. Marks the chat delivered. */
export async function pollConversation(tx: Tx, viewer: Viewer, input: { conversationId: string; sinceRev: number }, clock: Clock): Promise<ChatPollDto> {
  const conversation = await loadConversation(tx, input.conversationId);
  const now = clock.now();
  await tx.insert(chatPresence).values({ userId: viewer.id, seenAt: now }).onConflictDoUpdate({ target: chatPresence.userId, set: { seenAt: now } });
  await tx
    .update(chatMembers)
    .set({ lastDeliveredSeq: conversation.lastMsgSeq })
    .where(and(eq(chatMembers.conversationId, conversation.id), eq(chatMembers.userId, viewer.id), lt(chatMembers.lastDeliveredSeq, conversation.lastMsgSeq)));
  const rows =
    conversation.rev > input.sinceRev
      ? await tx.select().from(chatMessages).where(and(eq(chatMessages.conversationId, conversation.id), gt(chatMessages.rev, input.sinceRev))).orderBy(asc(chatMessages.seq)).limit(200)
      : [];
  const members = (await loadMembers(tx, [conversation.id], clock)).get(conversation.id) ?? [];
  const typingRows = await tx
    .select({ userId: chatTyping.userId })
    .from(chatTyping)
    .where(and(eq(chatTyping.conversationId, conversation.id), ne(chatTyping.userId, viewer.id), gt(chatTyping.at, new Date(now.getTime() - CHAT_TYPING_SECONDS * 1000))));
  const pins = await tx.select({ messageId: chatPins.messageId }).from(chatPins).where(eq(chatPins.conversationId, conversation.id));
  const nameOf = new Map(members.map((m) => [m.userId, m.name]));
  return {
    rev: conversation.rev,
    lastMsgSeq: conversation.lastMsgSeq,
    messages: await hydrate(tx, viewer, conversation.id, rows),
    members: members.map(({ userId, online, lastReadSeq, lastDeliveredSeq, left }) => ({ userId, online, lastReadSeq, lastDeliveredSeq, left })),
    typing: typingRows.map((t) => ({ userId: t.userId, name: nameOf.get(t.userId) ?? 'Someone' })),
    pinnedIds: pins.map((p) => p.messageId),
  };
}

/** Who is typing in a chat right now (not the viewer). One indexed read, so a thread can ask every second or so. */
export async function listTyping(tx: Tx, viewer: Viewer, input: { conversationId: string }, clock: Clock): Promise<Array<{ userId: string; name: string }>> {
  const conversation = await loadConversation(tx, input.conversationId);
  const rows = await tx
    .select({ userId: chatTyping.userId, name: chatMembers.displayName })
    .from(chatTyping)
    .innerJoin(chatMembers, and(eq(chatMembers.conversationId, chatTyping.conversationId), eq(chatMembers.userId, chatTyping.userId)))
    .where(and(eq(chatTyping.conversationId, conversation.id), ne(chatTyping.userId, viewer.id), gt(chatTyping.at, new Date(clock.now().getTime() - CHAT_TYPING_SECONDS * 1000))));
  return rows;
}

/** Pinned messages of a chat, newest pin first. */
export async function listPinned(tx: Tx, viewer: Viewer, input: { conversationId: string }): Promise<ChatMessageDto[]> {
  const conversation = await loadConversation(tx, input.conversationId);
  const pins = await tx.select().from(chatPins).where(eq(chatPins.conversationId, conversation.id)).orderBy(desc(chatPins.createdAt));
  if (pins.length === 0) return [];
  const rows = await tx.select().from(chatMessages).where(inArray(chatMessages.id, pins.map((p) => p.messageId)));
  const order = new Map(pins.map((p, index) => [p.messageId, index]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return hydrate(tx, viewer, conversation.id, rows);
}

export interface ChatSearchHit {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  seq: number;
  senderName: string;
  snippet: string;
  createdAt: string;
}

/** Message search across the viewer's chats (or one). Trigram indexed; a deleted message never matches. */
export async function searchMessages(tx: Tx, viewer: Viewer, input: { query: string; conversationId?: string | undefined }): Promise<ChatSearchHit[]> {
  const q = input.query.trim();
  if (q.length < 2) return [];
  if (input.conversationId !== undefined) assertUuid(input.conversationId, 'chat');
  const rows = await tx
    .select({
      conversationId: chatMessages.conversationId,
      messageId: chatMessages.id,
      seq: chatMessages.seq,
      senderName: chatMessages.senderName,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(
      and(
        isNull(chatMessages.deletedAt),
        eq(chatMessages.kind, 'text'),
        ilike(chatMessages.body, `%${q.replace(/[%_\\]/g, '\\$&')}%`),
        input.conversationId === undefined ? undefined : eq(chatMessages.conversationId, input.conversationId),
      ),
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(30);
  if (rows.length === 0) return [];
  const convs = await tx.select().from(chatConversations).where(inArray(chatConversations.id, [...new Set(rows.map((r) => r.conversationId))]));
  const members = await loadMembers(tx, convs.map((c) => c.id), systemClock);
  const titles = new Map(convs.map((c) => [c.id, toConversationDto(viewer, c, members.get(c.id) ?? []).title]));
  return rows.map((row) => ({
    conversationId: row.conversationId,
    conversationTitle: titles.get(row.conversationId) ?? 'Chat',
    messageId: row.messageId,
    seq: row.seq,
    senderName: row.senderName,
    snippet: excerpt(row.body),
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Deals and library documents the viewer may share, for the /deal and /doc commands. */
export async function searchShareables(tx: Tx, viewer: Viewer, input: { kind: ChatRefKind; query: string }): Promise<ChatRefDto[]> {
  const q = input.query.trim().replace(/[%_\\]/g, '\\$&');
  if (input.kind === 'deal') {
    const rows = await tx
      .select({ id: registrations.id, customer: registrations.customerName, reference: registrations.reference, status: registrations.status })
      .from(registrations)
      .where(and(registrationScope(viewer), q === '' ? undefined : or(ilike(registrations.customerName, `%${q}%`), ilike(registrations.reference, `%${q}%`))))
      .orderBy(desc(registrations.createdAt))
      .limit(8);
    return rows.map((row) => ({
      kind: 'deal' as const,
      id: row.id,
      title: row.customer,
      sub: `${row.reference}, ${row.status}`,
      href: viewer.kind === 'partner' ? ROUTES.partner.deal(row.id) : staffDealHref(row.id),
    }));
  }
  const rows = await tx
    .select({ id: documents.id, title: documents.title, type: documents.type })
    .from(documents)
    .where(and(eq(documents.status, 'published'), isNull(documents.deletedAt), q === '' ? undefined : ilike(documents.title, `%${q}%`)))
    .orderBy(asc(documents.title))
    .limit(8);
  return rows.map((row) => ({
    kind: 'doc' as const,
    id: row.id,
    title: row.title,
    sub: DOC_TYPE_LABEL[row.type] ?? row.type,
    href: viewer.kind === 'partner' ? ROUTES.partner.documents : ROUTES.admin.documents,
  }));
}

/* ---------------------------------------------------------------- writing */

export interface SendInput {
  conversationId: string;
  body: string;
  replyToId?: string | null | undefined;
  mentionIds?: string[] | undefined;
  refs?: Array<{ kind: ChatRefKind; id: string }> | undefined;
  /** Ids from createAttachment that the action has already checked against storage. */
  attachmentIds?: string[] | undefined;
}

export interface SendResult {
  message: ChatMessageDto;
  conversationTitle: string;
  /** Mentioned people who are still in the chat (never the sender). */
  mentioned: string[];
}

export async function sendMessage(tx: Tx, viewer: Viewer, input: SendInput, clock: Clock): Promise<SendResult> {
  const conversation = await loadConversation(tx, input.conversationId);
  const me = await loadMyMembership(tx, viewer, conversation.id);
  const body = input.body.trim();
  const refs = input.refs ?? [];
  const attachmentIds = [...new Set(input.attachmentIds ?? [])];
  if (body === '' && refs.length === 0 && attachmentIds.length === 0) throw issue('body', 'Write a message first.');
  if (body.length > CHAT_MAX_BODY) throw issue('body', `Keep it under ${CHAT_MAX_BODY} characters.`);
  if (attachmentIds.length > CHAT_MAX_FILES) throw issue('attachments', `Attach up to ${CHAT_MAX_FILES} files per message.`);
  const mentioned = [...new Set(input.mentionIds ?? [])].filter((id) => id !== viewer.id && conversation.memberIds.includes(id));
  if (refs.length > 0) {
    const resolved = await resolveRefs(tx, viewer, refs);
    if ([...resolved.values()].some((r) => r.title === null)) throw issue('refs', 'You cannot share something you cannot open.');
  }
  let replyToId: string | null = null;
  if (input.replyToId) {
    assertUuid(input.replyToId, 'message');
    const [target] = await tx
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(and(eq(chatMessages.id, input.replyToId), eq(chatMessages.conversationId, conversation.id)))
      .limit(1);
    if (!target) throw new NotFoundError('message');
    replyToId = target.id;
  }
  const pending =
    attachmentIds.length === 0
      ? []
      : await tx
          .select()
          .from(chatAttachments)
          .where(
            and(
              inArray(chatAttachments.id, attachmentIds),
              eq(chatAttachments.conversationId, conversation.id),
              eq(chatAttachments.uploaderId, viewer.id),
              isNull(chatAttachments.messageId),
              isNull(chatAttachments.deletedAt),
            ),
          );
  if (pending.length !== attachmentIds.length) throw issue('attachments', 'One of the files is no longer available. Attach it again.');

  const now = clock.now();
  const preview = previewOf({ body, attachments: pending.length, senderFirstName: firstName(viewer.name), refKind: refs[0]?.kind ?? null });
  const { seq, rev } = await bump(tx, conversation.id, { message: true, at: now, preview });
  const id = randomUUID();
  await tx.insert(chatMessages).values({
    id,
    conversationId: conversation.id,
    seq,
    rev,
    kind: 'text',
    senderId: viewer.id,
    senderName: viewer.name,
    senderOrg: orgOf(viewer),
    body,
    replyToId,
    mentions: mentioned,
    refs,
    createdAt: now,
  });
  if (pending.length > 0) await tx.update(chatAttachments).set({ messageId: id }).where(inArray(chatAttachments.id, pending.map((p) => p.id)));
  await tx
    .update(chatMembers)
    .set({ lastReadSeq: seq, lastDeliveredSeq: seq })
    .where(and(eq(chatMembers.conversationId, conversation.id), eq(chatMembers.userId, me.userId)));
  await tx.delete(chatTyping).where(and(eq(chatTyping.conversationId, conversation.id), eq(chatTyping.userId, viewer.id)));
  const [row] = await tx.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
  if (!row) throw new NotFoundError('message');
  const [message] = await hydrate(tx, viewer, conversation.id, [row]);
  if (!message) throw new NotFoundError('message');
  const members = await tx.select({ userId: chatMembers.userId, name: chatMembers.displayName }).from(chatMembers).where(eq(chatMembers.conversationId, conversation.id));
  const titleFor = conversation.kind === 'direct' ? (members.find((m) => m.userId !== viewer.id)?.name ?? 'Chat') : (conversation.title ?? 'Group');
  return { message, conversationTitle: titleFor, mentioned };
}

async function loadOwnMessage(tx: Tx, viewer: Viewer, messageId: string): Promise<MessageRow> {
  assertUuid(messageId, 'message');
  const [row] = await tx.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!row) throw new NotFoundError('message');
  if (row.senderId !== viewer.id || row.kind !== 'text') throw new ForbiddenError('only the sender can change a message');
  if (row.deletedAt) throw new ConflictError('message_deleted', 'That message was deleted.');
  return row;
}

async function touchMessage(tx: Tx, conversationId: string, messageId: string, at: Date, set: Partial<typeof chatMessages.$inferInsert> = {}): Promise<void> {
  const { rev } = await bump(tx, conversationId, { message: false, at });
  await tx.update(chatMessages).set({ ...set, rev }).where(eq(chatMessages.id, messageId));
}

export async function editMessage(tx: Tx, viewer: Viewer, input: { messageId: string; body: string }, clock: Clock): Promise<void> {
  const row = await loadOwnMessage(tx, viewer, input.messageId);
  const body = input.body.trim();
  if (body === '') throw issue('body', 'A message cannot be empty. Delete it instead.');
  if (body.length > CHAT_MAX_BODY) throw issue('body', `Keep it under ${CHAT_MAX_BODY} characters.`);
  if (clock.now().getTime() - row.createdAt.getTime() > CHAT_EDIT_WINDOW_MINUTES * 60_000) {
    throw new ConflictError('edit_window_closed', `Messages can be edited for ${CHAT_EDIT_WINDOW_MINUTES} minutes.`);
  }
  await loadConversation(tx, row.conversationId);
  await touchMessage(tx, row.conversationId, row.id, clock.now(), { body, editedAt: clock.now() });
  const [conversation] = await tx.select().from(chatConversations).where(eq(chatConversations.id, row.conversationId)).limit(1);
  if (conversation && conversation.lastMsgSeq === row.seq) {
    await tx.update(chatConversations).set({ lastPreview: previewOf({ body, attachments: 0, senderFirstName: firstName(viewer.name) }) }).where(eq(chatConversations.id, row.conversationId));
  }
}

/** Blanks the message and withdraws its files. Returns the storage keys to delete once the transaction commits. */
export async function deleteMessage(tx: Tx, viewer: Viewer, input: { messageId: string }, clock: Clock): Promise<{ fileKeys: string[] }> {
  const row = await loadOwnMessage(tx, viewer, input.messageId);
  const files = await tx
    .select({ id: chatAttachments.id, key: chatAttachments.key })
    .from(chatAttachments)
    .where(and(eq(chatAttachments.messageId, row.id), isNull(chatAttachments.deletedAt)));
  if (files.length > 0) await tx.update(chatAttachments).set({ deletedAt: clock.now() }).where(inArray(chatAttachments.id, files.map((f) => f.id)));
  await tx.delete(chatPins).where(eq(chatPins.messageId, row.id));
  await touchMessage(tx, row.conversationId, row.id, clock.now(), { body: '', refs: [], mentions: [], deletedAt: clock.now() });
  const [conversation] = await tx.select().from(chatConversations).where(eq(chatConversations.id, row.conversationId)).limit(1);
  if (conversation && conversation.lastMsgSeq === row.seq) {
    await tx.update(chatConversations).set({ lastPreview: `${firstName(viewer.name)}: message deleted` }).where(eq(chatConversations.id, row.conversationId));
  }
  return { fileKeys: files.map((f) => f.key) };
}

/** Adds the viewer's reaction, or removes it when they already used that one. Returns whether it is now on. */
export async function toggleReaction(tx: Tx, viewer: Viewer, input: { messageId: string; emoji: string }, clock: Clock): Promise<{ on: boolean }> {
  assertUuid(input.messageId, 'message');
  if (!CHAT_REACTION_KEYS.includes(input.emoji)) throw issue('emoji', 'Pick one of the reactions.');
  const [message] = await tx.select().from(chatMessages).where(eq(chatMessages.id, input.messageId)).limit(1);
  if (!message || message.deletedAt || message.kind !== 'text') throw new NotFoundError('message');
  await loadMyMembership(tx, viewer, message.conversationId);
  const [existing] = await tx
    .select({ emoji: chatReactions.emoji })
    .from(chatReactions)
    .where(and(eq(chatReactions.messageId, message.id), eq(chatReactions.userId, viewer.id), eq(chatReactions.emoji, input.emoji)))
    .limit(1);
  if (existing) {
    await tx.delete(chatReactions).where(and(eq(chatReactions.messageId, message.id), eq(chatReactions.userId, viewer.id), eq(chatReactions.emoji, input.emoji)));
  } else {
    await tx.insert(chatReactions).values({ conversationId: message.conversationId, messageId: message.id, userId: viewer.id, emoji: input.emoji, userName: viewer.name });
  }
  await touchMessage(tx, message.conversationId, message.id, clock.now());
  return { on: !existing };
}

export async function setPinned(tx: Tx, viewer: Viewer, input: { messageId: string; pinned: boolean }, clock: Clock): Promise<void> {
  assertUuid(input.messageId, 'message');
  const [message] = await tx.select().from(chatMessages).where(eq(chatMessages.id, input.messageId)).limit(1);
  if (!message || message.deletedAt || message.kind !== 'text') throw new NotFoundError('message');
  await loadMyMembership(tx, viewer, message.conversationId);
  if (input.pinned) {
    await tx.insert(chatPins).values({ conversationId: message.conversationId, messageId: message.id, pinnedBy: viewer.id }).onConflictDoNothing();
  } else {
    await tx.delete(chatPins).where(eq(chatPins.messageId, message.id));
  }
  await touchMessage(tx, message.conversationId, message.id, clock.now());
}

/** Moves the viewer's read position forward (never back), which is what turns the sender's ticks to "seen". */
export async function markRead(tx: Tx, viewer: Viewer, input: { conversationId: string; seq: number }): Promise<void> {
  const conversation = await loadConversation(tx, input.conversationId);
  const seq = Math.min(Math.max(Math.floor(input.seq), 0), conversation.lastMsgSeq);
  await tx
    .update(chatMembers)
    .set({ lastReadSeq: sql`greatest(${chatMembers.lastReadSeq}, ${seq})`, lastDeliveredSeq: sql`greatest(${chatMembers.lastDeliveredSeq}, ${seq})` })
    .where(and(eq(chatMembers.conversationId, conversation.id), eq(chatMembers.userId, viewer.id)));
}

export async function setMuted(tx: Tx, viewer: Viewer, input: { conversationId: string; until: Date | null }): Promise<void> {
  const conversation = await loadConversation(tx, input.conversationId);
  await tx.update(chatMembers).set({ mutedUntil: input.until }).where(and(eq(chatMembers.conversationId, conversation.id), eq(chatMembers.userId, viewer.id)));
}

export async function setTyping(tx: Tx, viewer: Viewer, input: { conversationId: string }, clock: Clock): Promise<void> {
  const conversation = await loadConversation(tx, input.conversationId);
  await loadMyMembership(tx, viewer, conversation.id);
  await tx
    .insert(chatTyping)
    .values({ conversationId: conversation.id, userId: viewer.id, at: clock.now() })
    .onConflictDoUpdate({ target: [chatTyping.conversationId, chatTyping.userId], set: { at: clock.now() } });
}

/* ---------------------------------------------------------------- files */

export interface AttachmentTicketInput {
  conversationId: string;
  key: string;
  name: string;
  mime: string;
  size: number;
}

/** Records a file the viewer is about to upload. It stays unattached (and invisible in any message) until a send claims it. */
export async function createAttachment(tx: Tx, viewer: Viewer, input: AttachmentTicketInput): Promise<{ id: string }> {
  const conversation = await loadConversation(tx, input.conversationId);
  await loadMyMembership(tx, viewer, conversation.id);
  if (input.size <= 0 || input.size > CHAT_FILE_MAX_BYTES) throw issue('file', 'That file is too large.');
  const id = randomUUID();
  await tx.insert(chatAttachments).values({
    id,
    conversationId: conversation.id,
    partnerId: conversation.partnerId,
    uploaderId: viewer.id,
    key: input.key,
    name: input.name,
    mime: input.mime,
    size: input.size,
  });
  return { id };
}

export interface AttachmentFile {
  id: string;
  key: string;
  name: string;
  mime: string;
  size: number;
  conversationId: string;
}

/** One file of a chat the viewer is in; NotFoundError for anyone else, for a withdrawn file and for one never attached to a message. */
export async function getAttachment(tx: Tx, viewer: Viewer, input: { id: string }): Promise<AttachmentFile> {
  assertUuid(input.id, 'file');
  const [row] = await tx
    .select()
    .from(chatAttachments)
    .where(and(eq(chatAttachments.id, input.id), isNull(chatAttachments.deletedAt)))
    .limit(1);
  if (!row || (row.messageId === null && row.uploaderId !== viewer.id)) throw new NotFoundError('file');
  await loadMyMembership(tx, viewer, row.conversationId);
  return { id: row.id, key: row.key, name: row.name, mime: row.mime, size: row.size, conversationId: row.conversationId };
}

/** The viewer's own unsent uploads among `ids`, so the action can check each against storage before a message carries it. */
export async function listPendingAttachments(tx: Tx, viewer: Viewer, input: { conversationId: string; ids: string[] }): Promise<AttachmentFile[]> {
  if (input.ids.length === 0) return [];
  for (const id of input.ids) assertUuid(id, 'file');
  const conversation = await loadConversation(tx, input.conversationId);
  const rows = await tx
    .select()
    .from(chatAttachments)
    .where(
      and(
        inArray(chatAttachments.id, input.ids),
        eq(chatAttachments.conversationId, conversation.id),
        eq(chatAttachments.uploaderId, viewer.id),
        isNull(chatAttachments.messageId),
        isNull(chatAttachments.deletedAt),
      ),
    );
  return rows.map((row) => ({ id: row.id, key: row.key, name: row.name, mime: row.mime, size: row.size, conversationId: row.conversationId }));
}

/** Withdraws an unsent upload (the person removed it, or the storage check failed). Returns its key so the object can be deleted. */
export async function discardAttachment(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<{ key: string } | null> {
  assertUuid(input.id, 'file');
  const [row] = await tx
    .select()
    .from(chatAttachments)
    .where(and(eq(chatAttachments.id, input.id), eq(chatAttachments.uploaderId, viewer.id), isNull(chatAttachments.messageId), isNull(chatAttachments.deletedAt)))
    .limit(1);
  if (!row) return null;
  await tx.update(chatAttachments).set({ deletedAt: clock.now() }).where(eq(chatAttachments.id, row.id));
  return { key: row.key };
}

/** What a partner company keeps in chat files. Reads every chat of the company, so it runs in system scope (a member sees only their own chats). */
export async function partnerChatBytes(q: Queryable, partnerId: string): Promise<number> {
  const [row] = await q
    .select({ total: sql<number>`coalesce(sum(${chatAttachments.size}), 0)::float8` })
    .from(chatAttachments)
    .where(and(eq(chatAttachments.partnerId, partnerId), isNull(chatAttachments.deletedAt)));
  return row?.total ?? 0;
}

/* ---------------------------------------------------------------- email digest */

export interface DigestItem {
  userId: string;
  conversationId: string;
  title: string;
  unread: number;
  lastPreview: string | null;
}

/**
 * People with unread messages older than `olderThan` in chats they have not muted and not yet been emailed about, system scope.
 * `digest_seq` moves forward as soon as a chat is included, so one burst of unread messages is one email, not one per run.
 */
export async function claimDigest(q: Queryable, input: { olderThan: Date; now: Date }): Promise<DigestItem[]> {
  const rows = await q.execute<{
    user_id: string;
    conversation_id: string;
    title: string | null;
    kind: string;
    other_name: string | null;
    unread: number;
    last_preview: string | null;
  }>(sql`
    with due as (
      select m.user_id, m.conversation_id, c.title, c.kind, c.last_preview, c.last_msg_seq,
             (select count(*)::int from chat_messages x
                where x.conversation_id = c.id and x.seq > greatest(m.last_read_seq, m.digest_seq)
                  and x.deleted_at is null and x.kind = 'text' and x.sender_id is distinct from m.user_id and x.created_at < ${input.olderThan}) as unread
        from chat_members m
        join chat_conversations c on c.id = m.conversation_id
       where m.left_at is null and (m.muted_until is null or m.muted_until <= ${input.now})
         and c.last_msg_seq > greatest(m.last_read_seq, m.digest_seq)
    ), marked as (
      update chat_members m set digest_seq = d.last_msg_seq
        from due d where d.user_id = m.user_id and d.conversation_id = m.conversation_id and d.unread > 0
      returning m.user_id, m.conversation_id
    )
    select d.user_id, d.conversation_id, d.title, d.kind, d.unread, d.last_preview,
           (select o.display_name from chat_members o where o.conversation_id = d.conversation_id and o.user_id <> d.user_id limit 1) as other_name
      from due d join marked k on k.user_id = d.user_id and k.conversation_id = d.conversation_id
  `);
  return rows.rows.map((r) => ({
    userId: r.user_id,
    conversationId: r.conversation_id,
    title: r.kind === 'direct' ? (r.other_name ?? 'Chat') : (r.title ?? 'Group'),
    unread: r.unread,
    lastPreview: r.last_preview,
  }));
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');
const NIL = '00000000-0000-0000-0000-000000000000';

export const isolation = defineIsolation<
  | 'listPeople' | 'openDirect' | 'createGroup' | 'addMembers' | 'removeMember' | 'leaveGroup' | 'completeLeave' | 'renameGroup' | 'listInbox' | 'countUnread'
  | 'getConversation' | 'loadMessages' | 'pollConversation' | 'listPinned' | 'listTyping' | 'searchMessages' | 'searchShareables' | 'sendMessage'
  | 'editMessage' | 'deleteMessage' | 'toggleReaction' | 'setPinned' | 'markRead' | 'setMuted' | 'setTyping' | 'createAttachment'
  | 'getAttachment' | 'listPendingAttachments' | 'discardAttachment' | 'partnerChatBytes' | 'claimDigest'
>({
  listPeople: {
    scope: 'rls-only',
    probe: (tx, ctx) => listPeople(tx, ctx.a.viewer, { query: 'user' }),
    check: (result) => assert.ok((result as ChatPersonDto[]).every((p) => p.isStaff || p.org !== '')),
  },
  openDirect: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => openDirect(tx, viewer, { userId: ctx.b.userId }, probeClock) },
  createGroup: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => createGroup(tx, viewer, { title: 'Probe', userIds: [ctx.b.userId] }, probeClock) },
  addMembers: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => addMembers(tx, viewer, { conversationId: ctx.b.conversationId, userIds: [ctx.a.userId] }, probeClock) },
  removeMember: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => removeMember(tx, viewer, { conversationId: ctx.b.conversationId, userId: ctx.b.userId }, probeClock) },
  leaveGroup: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => leaveGroup(tx, viewer, { conversationId: ctx.b.conversationId }, probeClock) },
  completeLeave: { scope: 'public', reason: 'System scope only: the last step of leaveGroup, which row level security would refuse to the leaver. Covered by chat.test.ts.' },
  renameGroup: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => renameGroup(tx, viewer, { conversationId: ctx.b.conversationId, title: 'Probe' }, probeClock) },
  listInbox: {
    scope: 'rls-only',
    probe: (tx, ctx) => listInbox(tx, ctx.a.viewer, probeClock),
    check: (result) => assert.ok((result as ChatInboxDto).conversations.every((c) => c.partnerId === null || c.partnerId !== NIL)),
  },
  countUnread: { scope: 'rls-only', probe: (tx, ctx) => countUnread(tx, ctx.a.viewer, probeClock), check: (result) => assert.equal(typeof result, 'number') },
  getConversation: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getConversation(tx, viewer, { conversationId: ctx.b.conversationId }, probeClock) },
  loadMessages: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => loadMessages(tx, viewer, { conversationId: ctx.b.conversationId }) },
  pollConversation: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => pollConversation(tx, viewer, { conversationId: ctx.b.conversationId, sinceRev: 0 }, probeClock) },
  listTyping: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => listTyping(tx, viewer, { conversationId: ctx.b.conversationId }, probeClock) },
  listPinned: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => listPinned(tx, viewer, { conversationId: ctx.b.conversationId }) },
  searchMessages: { scope: 'tenant', expect: 'empty', probe: (tx, viewer, ctx) => searchMessages(tx, viewer, { query: 'isolation probe', conversationId: ctx.b.conversationId }) },
  searchShareables: { scope: 'tenant', expect: 'empty', probe: (tx, viewer, ctx) => searchShareables(tx, viewer, { kind: 'deal', query: ctx.b.partnerId }) },
  sendMessage: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => sendMessage(tx, viewer, { conversationId: ctx.b.conversationId, body: 'isolation probe' }, probeClock),
  },
  editMessage: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => editMessage(tx, viewer, { messageId: ctx.b.chatMessageId, body: 'isolation probe' }, probeClock) },
  deleteMessage: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => deleteMessage(tx, viewer, { messageId: ctx.b.chatMessageId }, probeClock) },
  toggleReaction: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => toggleReaction(tx, viewer, { messageId: ctx.b.chatMessageId, emoji: 'check' }, probeClock) },
  setPinned: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => setPinned(tx, viewer, { messageId: ctx.b.chatMessageId, pinned: true }, probeClock) },
  markRead: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => markRead(tx, viewer, { conversationId: ctx.b.conversationId, seq: 1 }) },
  setMuted: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => setMuted(tx, viewer, { conversationId: ctx.b.conversationId, until: null }) },
  setTyping: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => setTyping(tx, viewer, { conversationId: ctx.b.conversationId }, probeClock) },
  createAttachment: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => createAttachment(tx, viewer, { conversationId: ctx.b.conversationId, key: 'chat/probe', name: 'probe.pdf', mime: 'application/pdf', size: 10 }),
  },
  getAttachment: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getAttachment(tx, viewer, { id: ctx.b.chatAttachmentId }) },
  listPendingAttachments: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => listPendingAttachments(tx, viewer, { conversationId: ctx.b.conversationId, ids: [ctx.b.chatAttachmentId] }) },
  discardAttachment: { scope: 'tenant', expect: 'empty', probe: (tx, viewer, ctx) => discardAttachment(tx, viewer, { id: ctx.b.chatAttachmentId }, probeClock) },
  partnerChatBytes: { scope: 'public', reason: 'System scope only: the upload ticket action sums a whole company, which a member cannot see. Covered by chat.test.ts.' },
  claimDigest: { scope: 'public', reason: 'System scope only: the digest job. Covered by chat-digest.test.ts.' },
});

