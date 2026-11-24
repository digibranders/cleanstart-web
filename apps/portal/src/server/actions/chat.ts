'use server';

import { z } from 'zod';
import { CHAT_MAX_BODY, CHAT_MAX_FILES, CHAT_PARTNER_STORAGE_BYTES, CHAT_REF_KINDS, CHAT_REACTION_KEYS, formatBytes, MUTE_CHOICES, muteUntil } from '@/lib/chat';
import type { ChatMessageDto, ChatPersonDto, ChatRefDto } from '@/lib/chat';
import { systemClock } from '@/lib/clock';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { SYSTEM_ACTORS, type Viewer } from '@/server/auth/types';
import { ConflictError, ValidationError } from '@/server/errors';
import { assertChatFileAllowed, chatFileKey, verifyChatUpload } from '@/server/files/chat-files';
import { getFileStorage } from '@/server/files/instance';
import { notifyUsers } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { withSystem, withViewer } from '@/server/repo/context';
import {
  addMembers,
  createAttachment,
  createGroup,
  deleteMessage,
  discardAttachment,
  editMessage,
  leaveGroup,
  completeLeave,
  listPeople,
  listPendingAttachments,
  markRead,
  openDirect,
  partnerChatBytes,
  removeMember,
  renameGroup,
  searchMessages,
  searchShareables,
  sendMessage,
  setMuted,
  setPinned,
  setTyping,
  toggleReaction,
  type ChatSearchHit,
} from '@/server/repo/chat';
import { log } from '@/server/log';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const id = z.string().uuid();
const body = z.string().max(CHAT_MAX_BODY + 200);
const ref = z.object({ kind: z.enum(CHAT_REF_KINDS), id });

const SENDS_PER_MINUTE = 40;
const TICKETS_PER_MINUTE = 40;

const openDirectSchema = z.object({ userId: id });
export async function openDirectChatAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runViewerAction({ name: 'chat.open_direct', schema: openDirectSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    const { id: chatId } = await withViewer(ctx.viewer, (tx) => openDirect(tx, ctx.viewer, input, ctx.clock));
    return { id: chatId };
  });
}

const createGroupSchema = z.object({ title: z.string().max(200), userIds: z.array(id).max(60) });
export async function createGroupAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runViewerAction({ name: 'chat.create_group', schema: createGroupSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.create_group');
    return withViewer(ctx.viewer, async (tx) => {
      const created = await createGroup(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'chat.group_created',
        target: input.title.trim(),
        partnerId: ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : null,
        note: `${input.userIds.length + 1} people`,
      });
      return created;
    });
  });
}

const membersSchema = z.object({ conversationId: id, userIds: z.array(id).min(1).max(60) });
export async function addMembersAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.add_members', schema: membersSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, async (tx) => {
      await addMembers(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, { event: 'chat.members_changed', target: input.conversationId, note: `Added ${input.userIds.length}` });
    });
    return null;
  });
}

const removeSchema = z.object({ conversationId: id, userId: id });
export async function removeMemberAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.remove_member', schema: removeSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, async (tx) => {
      await removeMember(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, { event: 'chat.members_changed', target: input.conversationId, note: 'Removed one person' });
    });
    return null;
  });
}

const conversationSchema = z.object({ conversationId: id });
export async function leaveGroupAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.leave', schema: conversationSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, (tx) => leaveGroup(tx, ctx.viewer, input, ctx.clock));
    await withSystem(SYSTEM_ACTORS.portal, (tx) => completeLeave(tx, { conversationId: input.conversationId, userId: ctx.viewer.id, at: ctx.clock.now() }));
    return null;
  });
}

const renameSchema = z.object({ conversationId: id, title: z.string().max(200) });
export async function renameGroupAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.rename', schema: renameSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, (tx) => renameGroup(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}

const sendSchema = z.object({
  conversationId: id,
  body,
  replyToId: id.nullish(),
  mentionIds: z.array(id).max(30).optional(),
  refs: z.array(ref).max(3).optional(),
  attachmentIds: z.array(id).max(CHAT_MAX_FILES).optional(),
});

export async function sendMessageAction(raw: unknown): Promise<ActionResult<ChatMessageDto>> {
  return runViewerAction({ name: 'chat.send', schema: sendSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:send:${ctx.viewer.id}`, { limit: SENDS_PER_MINUTE, windowSeconds: 60 });
    const attachmentIds = input.attachmentIds ?? [];
    if (attachmentIds.length > 0) await checkPendingFiles(ctx.viewer, input.conversationId, attachmentIds);
    return withViewer(ctx.viewer, async (tx) => {
      const sent = await sendMessage(tx, ctx.viewer, input, ctx.clock);
      if (sent.mentioned.length > 0) {
        await notifyUsers(
          tx,
          sent.mentioned.map((userId) => ({
            userId,
            kind: 'chat_mention' as const,
            title: `${ctx.viewer.name} mentioned you in ${sent.conversationTitle}`,
            body: sent.message.body.slice(0, 160),
            link: `${ctx.viewer.kind === 'partner' ? ROUTES.partner.messages : ROUTES.admin.messages}?c=${input.conversationId}`,
          })),
        );
      }
      return sent.message;
    });
  });
}

/** Every unsent file is in storage, as big as signed, and what its extension says. One that is not is withdrawn and the send is refused. */
async function checkPendingFiles(viewer: Viewer, conversationId: string, ids: string[]): Promise<void> {
  const files = await withViewer(viewer, (tx) => listPendingAttachments(tx, viewer, { conversationId, ids }));
  if (files.length !== ids.length) throw new ValidationError([{ path: 'attachments', message: 'One of the files is no longer available. Attach it again.' }]);
  const storage = getFileStorage();
  for (const file of files) {
    try {
      await verifyChatUpload(storage, { key: file.key, size: file.size, mime: file.mime, name: file.name });
    } catch (error) {
      await withViewer(viewer, (tx) => discardAttachment(tx, viewer, { id: file.id }, systemClock));
      await storage.delete(file.key).catch((cause: unknown) => log.warn({ err: cause, key: file.key }, 'could not delete a rejected chat upload'));
      throw error;
    }
  }
}

const editSchema = z.object({ messageId: id, body });
export async function editMessageAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.edit', schema: editSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, (tx) => editMessage(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}

const messageSchema = z.object({ messageId: id });
export async function deleteMessageAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.delete', schema: messageSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    const { fileKeys } = await withViewer(ctx.viewer, (tx) => deleteMessage(tx, ctx.viewer, input, ctx.clock));
    ctx.afterCommit(async () => {
      const storage = getFileStorage();
      await Promise.all(fileKeys.map((key) => storage.delete(key)));
    });
    return null;
  });
}

const reactionSchema = z.object({ messageId: id, emoji: z.enum(CHAT_REACTION_KEYS) });
export async function toggleReactionAction(raw: unknown): Promise<ActionResult<{ on: boolean }>> {
  return runViewerAction({ name: 'chat.react', schema: reactionSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    return withViewer(ctx.viewer, (tx) => toggleReaction(tx, ctx.viewer, input, ctx.clock));
  });
}

const pinSchema = z.object({ messageId: id, pinned: z.boolean() });
export async function setPinnedAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.pin', schema: pinSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, (tx) => setPinned(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}

const readSchema = z.object({ conversationId: id, seq: z.number().int().min(0) });
export async function markReadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.read', schema: readSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    await withViewer(ctx.viewer, (tx) => markRead(tx, ctx.viewer, input));
    return null;
  });
}

const muteSchema = z.object({ conversationId: id, choice: z.enum(MUTE_CHOICES) });
export async function setMutedAction(raw: unknown): Promise<ActionResult<{ mutedUntil: string | null }>> {
  return runViewerAction({ name: 'chat.mute', schema: muteSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    const until = muteUntil(input.choice, ctx.clock.now());
    await withViewer(ctx.viewer, (tx) => setMuted(tx, ctx.viewer, { conversationId: input.conversationId, until }));
    return { mutedUntil: until ? until.toISOString() : null };
  });
}

export async function setTypingAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.typing', schema: conversationSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:typing:${ctx.viewer.id}`, { limit: 60, windowSeconds: 60 });
    await withViewer(ctx.viewer, (tx) => setTyping(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}

const peopleSchema = z.object({ query: z.string().max(80) });
export async function listPeopleAction(raw: unknown): Promise<ActionResult<ChatPersonDto[]>> {
  return runViewerAction({ name: 'chat.people', schema: peopleSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:people:${ctx.viewer.id}`, { limit: 90, windowSeconds: 60 });
    return withViewer(ctx.viewer, (tx) => listPeople(tx, ctx.viewer, input));
  });
}

const searchSchema = z.object({ query: z.string().max(80), conversationId: id.optional() });
export async function searchMessagesAction(raw: unknown): Promise<ActionResult<ChatSearchHit[]>> {
  return runViewerAction({ name: 'chat.search', schema: searchSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:search:${ctx.viewer.id}`, { limit: 60, windowSeconds: 60 });
    return withViewer(ctx.viewer, (tx) => searchMessages(tx, ctx.viewer, input));
  });
}

const shareSchema = z.object({ kind: z.enum(CHAT_REF_KINDS), query: z.string().max(80) });
export async function searchShareablesAction(raw: unknown): Promise<ActionResult<ChatRefDto[]>> {
  return runViewerAction({ name: 'chat.shareables', schema: shareSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:share:${ctx.viewer.id}`, { limit: 90, windowSeconds: 60 });
    // A role that may not open deals simply finds none; the documents list is open to everyone who can chat.
    try {
      return await withViewer(ctx.viewer, (tx) => searchShareables(tx, ctx.viewer, input));
    } catch (error) {
      if (input.kind === 'deal') return [];
      throw error;
    }
  });
}

const ticketSchema = z.object({ conversationId: id, name: z.string().min(1).max(300), size: z.number().int().positive() });
export interface ChatUploadTicket {
  attachmentId: string;
  put: { url: string; headers: Record<string, string> };
}

/** Step one of attaching a file: validates the name, size and company allowance, records an unsent file and signs a direct upload to R2. */
export async function createChatUploadAction(raw: unknown): Promise<ActionResult<ChatUploadTicket>> {
  return runViewerAction({ name: 'chat.upload_ticket', schema: ticketSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    rateLimit(`chat:ticket:${ctx.viewer.id}`, { limit: TICKETS_PER_MINUTE, windowSeconds: 60 });
    const mime = assertChatFileAllowed({ name: input.name, size: input.size });
    const key = chatFileKey({ conversationId: input.conversationId, name: input.name });
    const created = await withViewer(ctx.viewer, async (tx) => {
      const partnerId = ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : null;
      if (partnerId) {
        const used = await withSystem(SYSTEM_ACTORS.portal, (system) => partnerChatBytes(system, partnerId));
        if (used + input.size > CHAT_PARTNER_STORAGE_BYTES) {
          throw new ConflictError('storage_full', `Your company has used its ${formatBytes(CHAT_PARTNER_STORAGE_BYTES)} of chat files. Delete some messages with files to make room.`);
        }
      }
      return createAttachment(tx, ctx.viewer, { conversationId: input.conversationId, key, name: input.name, mime, size: input.size });
    });
    const put = await getFileStorage().presignPut({ key, contentType: mime, contentLength: input.size });
    return { attachmentId: created.id, put: { url: put.url, headers: put.headers } };
  });
}

const discardSchema = z.object({ attachmentId: id });
/** The person removed an unsent file from the composer. */
export async function discardChatUploadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'chat.upload_discard', schema: discardSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'chat.use');
    const dropped = await withViewer(ctx.viewer, (tx) => discardAttachment(tx, ctx.viewer, { id: input.attachmentId }, ctx.clock));
    if (dropped) {
      ctx.afterCommit(async () => {
        await getFileStorage().delete(dropped.key);
      });
    }
    return null;
  });
}

