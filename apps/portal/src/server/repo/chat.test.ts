import { beforeAll, describe, expect, it } from 'vitest';
import { asStaff, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { CHAT_EDIT_WINDOW_MINUTES, tickState } from '@/lib/chat';
import { fixedClock } from '@/lib/clock';
import type { PartnerViewer, StaffViewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withSystem, withViewer } from './context';
import {
  addMembers,
  claimDigest,
  countUnread,
  createAttachment,
  createGroup,
  deleteMessage,
  editMessage,
  getAttachment,
  listInbox,
  leaveGroup,
  listPeople,
  completeLeave,
  loadMessages,
  markRead,
  openDirect,
  partnerChatBytes,
  pollConversation,
  removeMember,
  searchMessages,
  sendMessage,
  setMuted,
  setPinned,
  setTyping,
  toggleReaction,
} from './chat';
import { SYSTEM_ACTORS } from '@/server/auth/types';

const t0 = fixedClock('2026-11-24T10:00:00Z');
const at = (minutes: number) => fixedClock(new Date(Date.parse('2026-11-24T10:00:00Z') + minutes * 60_000).toISOString());

describe('chat repo', () => {
  let alice: PartnerViewer; // partner admin, Alpha
  let colleague: PartnerViewer; // sales, Alpha
  let outsider: PartnerViewer; // Beta
  let manager: StaffViewer;
  let sales: StaffViewer;

  beforeAll(async () => {
    await resetDb();
    const db = testDb();
    const alpha = await makePartner(db, { name: 'Alpha' });
    const beta = await makePartner(db, { name: 'Beta' });
    const [a, c, o] = [
      await makeUser(db, { partnerId: alpha.id, name: 'Alice Rao' }),
      await makeUser(db, { partnerId: alpha.id, role: 'sales', name: 'Chetan Nair' }),
      await makeUser(db, { partnerId: beta.id, name: 'Olga Beta' }),
    ];
    alice = (await viewerFor(db, a)) as PartnerViewer;
    colleague = (await viewerFor(db, c)) as PartnerViewer;
    outsider = (await viewerFor(db, o)) as PartnerViewer;
    manager = await asStaff(db, 'partner_manager', 'all');
    sales = await asStaff(db, 'sales', ['india']);
  });

  const run = <T>(viewer: PartnerViewer | StaffViewer, fn: Parameters<typeof withViewer<T>>[1]): Promise<T> => withViewer(viewer, fn);

  it('opens one direct chat per pair, from either side', async () => {
    const first = await run(alice, (tx) => openDirect(tx, alice, { userId: colleague.id }, t0));
    const again = await run(colleague, (tx) => openDirect(tx, colleague, { userId: alice.id }, t0));
    expect(first.created).toBe(true);
    expect(again).toEqual({ id: first.id, created: false });
  });

  it('keeps partners apart: no chat with another company, and no hidden staff', async () => {
    await expect(run(alice, (tx) => openDirect(tx, alice, { userId: outsider.id }, t0))).rejects.toBeInstanceOf(NotFoundError);
    await expect(run(alice, (tx) => openDirect(tx, alice, { userId: sales.id }, t0))).rejects.toBeInstanceOf(NotFoundError);
    const people = await run(alice, (tx) => listPeople(tx, alice, { query: '' }));
    const names = people.map((p) => p.name);
    expect(names).toContain('Chetan Nair');
    expect(names).toContain(manager.name);
    expect(names).not.toContain(outsider.name);
    expect(names).not.toContain(sales.name);
  });

  it('limits a regional sales user to partners in their regions', async () => {
    const found = await run(sales, (tx) => listPeople(tx, sales, { query: 'Alice' }));
    expect(found.every((p) => p.org !== '')).toBe(true);
  });

  it('sends, counts unread, marks read and shows the ticks moving', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Alpha rollout', userIds: [colleague.id, manager.id] }, t0));
    const sent = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'Kickoff on Monday?' }, at(1)));
    expect(sent.message.seq).toBeGreaterThan(1);
    expect(sent.conversationTitle).toBe('Alpha rollout');

    expect(await run(colleague, (tx) => countUnread(tx, colleague, at(2)))).toBeGreaterThan(0);
    const inbox = await run(colleague, (tx) => listInbox(tx, colleague, at(2)));
    const row = inbox.conversations.find((c) => c.id === group.id);
    expect(row?.unread).toBe(sent.message.seq);
    expect(row?.lastPreview).toBe('Alice: Kickoff on Monday?');

    // The inbox poll marked it delivered, not read: two grey ticks.
    const afterDelivery = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 0 }, at(2)));
    const others = afterDelivery.members.filter((m) => m.userId !== alice.id);
    expect(tickState(sent.message.seq, others.filter((m) => m.userId === colleague.id))).toBe('delivered');

    await run(colleague, (tx) => markRead(tx, colleague, { conversationId: group.id, seq: sent.message.seq }));
    await run(manager, (tx) => markRead(tx, manager, { conversationId: group.id, seq: sent.message.seq }));
    const afterRead = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 0 }, at(3)));
    expect(tickState(sent.message.seq, afterRead.members.filter((m) => m.userId !== alice.id))).toBe('seen');
    expect(await run(colleague, (tx) => countUnread(tx, colleague, at(3)))).toBe(0);
  });

  it('never moves a read position backwards', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Cursor', userIds: [colleague.id] }, t0));
    const one = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'one' }, at(1)));
    await run(colleague, (tx) => markRead(tx, colleague, { conversationId: group.id, seq: one.message.seq }));
    await run(colleague, (tx) => markRead(tx, colleague, { conversationId: group.id, seq: 0 }));
    const poll = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 0 }, at(2)));
    expect(poll.members.find((m) => m.userId === colleague.id)?.lastReadSeq).toBe(one.message.seq);
  });

  it('returns only what changed since the last rev, including edits, reactions, pins and deletes', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Changes', userIds: [colleague.id] }, t0));
    const first = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'draft' }, at(1)));
    const base = await run(colleague, (tx) => pollConversation(tx, colleague, { conversationId: group.id, sinceRev: 0 }, at(1)));
    expect(base.messages.map((m) => m.id)).toContain(first.message.id);

    expect(await run(colleague, (tx) => pollConversation(tx, colleague, { conversationId: group.id, sinceRev: base.rev }, at(1)))).toMatchObject({ messages: [] });

    await run(colleague, (tx) => toggleReaction(tx, colleague, { messageId: first.message.id, emoji: 'check' }, at(2)));
    const afterReaction = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: base.rev }, at(2)));
    expect(afterReaction.messages).toHaveLength(1);
    expect(afterReaction.messages[0]?.reactions).toEqual([{ key: 'check', count: 1, mine: false, names: [colleague.name] }]);

    await run(alice, (tx) => editMessage(tx, alice, { messageId: first.message.id, body: 'final' }, at(3)));
    await run(alice, (tx) => setPinned(tx, alice, { messageId: first.message.id, pinned: true }, at(3)));
    const afterEdit = await run(colleague, (tx) => pollConversation(tx, colleague, { conversationId: group.id, sinceRev: afterReaction.rev }, at(3)));
    expect(afterEdit.messages[0]).toMatchObject({ body: 'final', pinned: true });
    expect(afterEdit.messages[0]?.editedAt).not.toBeNull();

    await run(colleague, (tx) => toggleReaction(tx, colleague, { messageId: first.message.id, emoji: 'check' }, at(4)));
    const toggledOff = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: afterEdit.rev }, at(4)));
    expect(toggledOff.messages[0]?.reactions).toEqual([]);

    await run(alice, (tx) => deleteMessage(tx, alice, { messageId: first.message.id }, at(5)));
    const deleted = await run(colleague, (tx) => pollConversation(tx, colleague, { conversationId: group.id, sinceRev: toggledOff.rev }, at(5)));
    expect(deleted.messages[0]).toMatchObject({ deleted: true, body: '', pinned: false });
  });

  it('lets only the sender edit or delete, and only inside the edit window', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Rules', userIds: [colleague.id] }, t0));
    const sent = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'hello' }, t0));
    await expect(run(colleague, (tx) => editMessage(tx, colleague, { messageId: sent.message.id, body: 'hijack' }, t0))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(run(colleague, (tx) => deleteMessage(tx, colleague, { messageId: sent.message.id }, t0))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(run(alice, (tx) => editMessage(tx, alice, { messageId: sent.message.id, body: 'late' }, at(CHAT_EDIT_WINDOW_MINUTES + 1)))).rejects.toBeInstanceOf(ConflictError);
    await run(alice, (tx) => editMessage(tx, alice, { messageId: sent.message.id, body: 'on time' }, at(CHAT_EDIT_WINDOW_MINUTES - 1)));
  });

  it('validates the message: blank, too long, reply target, mentions outside the chat', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Validation', userIds: [colleague.id] }, t0));
    await expect(run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: '   ' }, t0))).rejects.toBeInstanceOf(ValidationError);
    await expect(run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'x'.repeat(4001) }, t0))).rejects.toBeInstanceOf(ValidationError);
    const first = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'ask', mentionIds: [outsider.id, colleague.id] }, t0));
    expect(first.mentioned).toEqual([colleague.id]);
    const reply = await run(colleague, (tx) => sendMessage(tx, colleague, { conversationId: group.id, body: 'answer', replyToId: first.message.id }, at(1)));
    expect(reply.message.replyTo).toMatchObject({ id: first.message.id, senderName: alice.name, excerpt: 'ask' });
    await expect(run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'bad', replyToId: '00000000-0000-4000-8000-000000000000' }, t0))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('shows who is typing for a few seconds only', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Typing', userIds: [colleague.id] }, t0));
    await run(colleague, (tx) => setTyping(tx, colleague, { conversationId: group.id }, t0));
    const live = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 99 }, fixedClock('2026-11-24T10:00:03Z')));
    expect(live.typing).toEqual([{ userId: colleague.id, name: colleague.name }]);
    const stale = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 99 }, fixedClock('2026-11-24T10:00:30Z')));
    expect(stale.typing).toEqual([]);
  });

  it('lets a partner manager add a partner user, and makes leaving final', async () => {
    const group = await run(manager, (tx) => createGroup(tx, manager, { title: 'Alpha support', userIds: [alice.id] }, t0));
    await run(manager, (tx) => addMembers(tx, manager, { conversationId: group.id, userIds: [colleague.id] }, at(1)));
    await expect(run(manager, (tx) => addMembers(tx, manager, { conversationId: group.id, userIds: [outsider.id] }, at(1)))).rejects.toThrow();
    await expect(run(colleague, (tx) => removeMember(tx, colleague, { conversationId: group.id, userId: alice.id }, at(2)))).rejects.toBeInstanceOf(ForbiddenError);
    await run(colleague, (tx) => leaveGroup(tx, colleague, { conversationId: group.id }, at(2)));
    await withSystem(SYSTEM_ACTORS.portal, (tx) => completeLeave(tx, { conversationId: group.id, userId: colleague.id, at: at(2).now() }));
    await expect(run(colleague, (tx) => loadMessages(tx, colleague, { conversationId: group.id }))).rejects.toBeInstanceOf(NotFoundError);
    const poll = await run(alice, (tx) => pollConversation(tx, alice, { conversationId: group.id, sinceRev: 0 }, at(3)));
    expect(poll.messages.some((m) => m.kind === 'system' && m.body.includes('left'))).toBe(true);
  });

  it('mutes a chat out of the unread badge', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Quiet', userIds: [colleague.id] }, t0));
    await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'ping' }, t0));
    const before = await run(colleague, (tx) => countUnread(tx, colleague, t0));
    await run(colleague, (tx) => setMuted(tx, colleague, { conversationId: group.id, until: new Date('2026-11-24T18:00:00Z') }));
    expect(await run(colleague, (tx) => countUnread(tx, colleague, t0))).toBeLessThan(before);
    expect(await run(colleague, (tx) => countUnread(tx, colleague, fixedClock('2026-11-25T00:00:00Z')))).toBe(before);
  });

  it('searches only the viewer own chats and never a deleted message', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Findable', userIds: [colleague.id] }, t0));
    const one = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'zebra crossing plan' }, t0));
    expect((await run(colleague, (tx) => searchMessages(tx, colleague, { query: 'zebra' }))).map((h) => h.messageId)).toEqual([one.message.id]);
    expect(await run(outsider, (tx) => searchMessages(tx, outsider, { query: 'zebra' }))).toEqual([]);
    await run(alice, (tx) => deleteMessage(tx, alice, { messageId: one.message.id }, at(1)));
    expect(await run(colleague, (tx) => searchMessages(tx, colleague, { query: 'zebra' }))).toEqual([]);
  });

  it('keeps files unattached until sent, hides them from outsiders, and counts the company total', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Files', userIds: [colleague.id] }, t0));
    const file = await run(alice, (tx) => createAttachment(tx, alice, { conversationId: group.id, key: `chat/${group.id}/a-report.pdf`, name: 'report.pdf', mime: 'application/pdf', size: 1000 }));
    await expect(run(colleague, (tx) => getAttachment(tx, colleague, { id: file.id }))).rejects.toBeInstanceOf(NotFoundError);
    const sent = await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: '', attachmentIds: [file.id] }, t0));
    expect(sent.message.attachments).toEqual([{ id: file.id, name: 'report.pdf', mime: 'application/pdf', size: 1000, url: `/api/chat/files/${file.id}`, deleted: false }]);
    expect(sent.message.attachments).toHaveLength(1);
    await expect(run(outsider, (tx) => getAttachment(tx, outsider, { id: file.id }))).rejects.toBeInstanceOf(NotFoundError);
    expect((await run(colleague, (tx) => getAttachment(tx, colleague, { id: file.id }))).name).toBe('report.pdf');
    const total = await withSystem(SYSTEM_ACTORS.portal, (tx) => partnerChatBytes(tx, alice.partnerId));
    expect(total).toBeGreaterThanOrEqual(1000);
    // A file already claimed cannot ride on a second message.
    await expect(run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'again', attachmentIds: [file.id] }, t0))).rejects.toBeInstanceOf(ValidationError);
    const removed = await run(alice, (tx) => deleteMessage(tx, alice, { messageId: sent.message.id }, at(1)));
    expect(removed.fileKeys).toEqual([`chat/${group.id}/a-report.pdf`]);
    await expect(run(colleague, (tx) => getAttachment(tx, colleague, { id: file.id }))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('claims a digest once per burst of unread messages', async () => {
    const group = await run(alice, (tx) => createGroup(tx, alice, { title: 'Digest', userIds: [colleague.id] }, t0));
    await run(alice, (tx) => sendMessage(tx, alice, { conversationId: group.id, body: 'are you there?' }, t0));
    const claim = (minutes: number) => withSystem(SYSTEM_ACTORS.portal, (tx) => claimDigest(tx, { olderThan: at(minutes - 15).now(), now: at(minutes).now() }));
    expect(await claim(5)).toEqual([]);
    const first = (await claim(20)).filter((d) => d.conversationId === group.id);
    expect(first).toEqual([{ userId: colleague.id, conversationId: group.id, title: 'Digest', unread: 1, lastPreview: 'Alice: are you there?' }]);
    expect((await claim(40)).filter((d) => d.conversationId === group.id)).toEqual([]);
  });
});
