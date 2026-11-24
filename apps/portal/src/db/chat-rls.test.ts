import { beforeAll, describe, expect, it } from 'vitest';
import { makePartner, makeUser, resetDb, testDb, testPool } from '@/db/test-helpers';

interface Identity {
  kind: 'partner' | 'staff' | 'system';
  partnerId?: string;
  userId?: string;
}

type Q = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

/** One transaction on the app role with the identity set exactly as withViewer sets it; always rolled back. */
const as = async <T>(identity: Identity, fn: (q: Q) => Promise<T>): Promise<T> => {
  const client = await testPool().connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.kind', $1, true), set_config('app.partner_id', $2, true), set_config('app.user_id', $3, true)", [
      identity.kind,
      identity.partnerId ?? '',
      identity.userId ?? '',
    ]);
    return await fn(async (text, params) => (await client.query(text, params)).rows);
  } finally {
    await client.query('rollback');
    client.release();
  }
};

const rejects = async (promise: Promise<unknown>, pattern: RegExp): Promise<void> => {
  const error = await promise.then(() => null, (thrown: unknown) => thrown);
  expect(error, 'expected the database to refuse').not.toBeNull();
  expect((error as Error).message).toMatch(pattern);
};

describe('chat row level security', () => {
  let a = { partnerId: '', userId: '', colleagueId: '', conversationId: '', messageId: '' };
  let b = { partnerId: '', userId: '', conversationId: '', messageId: '' };
  let manager = '';
  let salesStaff = '';
  let otherStaff = '';

  const makeConversation = async (q: Q, input: { partnerId: string | null; creator: string; members: string[]; title?: string }): Promise<string> => {
    const rows = await q(
      "insert into chat_conversations (kind, partner_id, title, created_by, member_ids) values ('group', $1, $2, $3, $4) returning id",
      [input.partnerId, input.title ?? 'Rollout', input.creator, input.members],
    );
    return String(rows[0]?.id);
  };

  beforeAll(async () => {
    await resetDb();
    const db = testDb();
    const [pa, pb] = [await makePartner(db, { name: 'Alpha' }), await makePartner(db, { name: 'Beta' })];
    const ua = await makeUser(db, { partnerId: pa.id });
    const colleague = await makeUser(db, { partnerId: pa.id, role: 'sales' });
    const ub = await makeUser(db, { partnerId: pb.id });
    manager = (await makeUser(db, { kind: 'staff', role: 'partner_manager' })).id;
    salesStaff = (await makeUser(db, { kind: 'staff', role: 'sales' })).id;
    otherStaff = (await makeUser(db, { kind: 'staff', role: 'marketing' })).id;

    const client = await testPool().connect();
    try {
      await client.query("select set_config('app.kind', 'system', false)");
      const insertChat = async (partnerId: string, creator: string, members: string[]): Promise<{ conversationId: string; messageId: string }> => {
        const conv = await client.query<{ id: string }>(
          "insert into chat_conversations (kind, partner_id, title, created_by, member_ids) values ('group', $1, 'Rollout', $2, $3) returning id",
          [partnerId, creator, members],
        );
        const conversationId = conv.rows[0]?.id ?? '';
        const msg = await client.query<{ id: string }>(
          "insert into chat_messages (conversation_id, seq, rev, sender_id, sender_name, sender_org, body) values ($1, 1, 1, $2, 'Sender', 'Org', 'hello') returning id",
          [conversationId, creator],
        );
        return { conversationId, messageId: msg.rows[0]?.id ?? '' };
      };
      const first = await insertChat(pa.id, ua.id, [ua.id, colleague.id, manager]);
      const second = await insertChat(pb.id, ub.id, [ub.id, manager]);
      await client.query('insert into chat_presence (user_id) values ($1), ($2)', [colleague.id, ub.id]);
      a = { partnerId: pa.id, userId: ua.id, colleagueId: colleague.id, ...first };
      b = { partnerId: pb.id, userId: ub.id, ...second };
    } finally {
      client.release();
    }
  });

  const partnerA = (): Identity => ({ kind: 'partner', partnerId: a.partnerId, userId: a.userId });

  it('shows a member the chat and its messages, and nobody else', async () => {
    expect((await as(partnerA(), (q) => q('select id from chat_conversations'))).map((r) => r.id)).toEqual([a.conversationId]);
    expect((await as(partnerA(), (q) => q('select id from chat_messages'))).map((r) => r.id)).toEqual([a.messageId]);
    const stranger = { kind: 'partner' as const, partnerId: b.partnerId, userId: b.userId };
    expect((await as(stranger, (q) => q('select id from chat_conversations'))).map((r) => r.id)).toEqual([b.conversationId]);
    expect(await as(stranger, (q) => q('select id from chat_messages where conversation_id = $1', [a.conversationId]))).toEqual([]);
  });

  it('gives a staff user who is not in the chat nothing, however senior', async () => {
    for (const userId of [salesStaff, otherStaff]) {
      expect(await as({ kind: 'staff', userId }, (q) => q('select id from chat_conversations'))).toEqual([]);
      expect(await as({ kind: 'staff', userId }, (q) => q('select id from chat_messages'))).toEqual([]);
    }
    const inChat = await as({ kind: 'staff', userId: manager }, (q) => q('select id from chat_conversations order by created_at'));
    expect(inChat).toHaveLength(2);
  });

  it('lets the system job read every chat', async () => {
    expect(await as({ kind: 'system' }, (q) => q('select id from chat_conversations'))).toHaveLength(2);
  });

  it('refuses a chat in another partner company', async () => {
    await rejects(
      as(partnerA(), (q) => makeConversation(q, { partnerId: b.partnerId, creator: a.userId, members: [a.userId] })),
      /row-level security|one partner company/,
    );
  });

  it('refuses adding a person from another company, however it is done', async () => {
    await rejects(
      as(partnerA(), (q) => q('update chat_conversations set member_ids = member_ids || $2::uuid where id = $1', [a.conversationId, b.userId])),
      /every new member|one partner company/,
    );
    await rejects(
      as({ kind: 'staff', userId: manager }, (q) => q('update chat_conversations set member_ids = member_ids || $2::uuid where id = $1', [a.conversationId, b.userId])),
      /one partner company/,
    );
  });

  it('refuses a staff group that mixes two partners', async () => {
    await rejects(
      as({ kind: 'staff', userId: manager }, (q) => makeConversation(q, { partnerId: a.partnerId, creator: manager, members: [manager, a.userId, b.userId] })),
      /one partner company/,
    );
    await rejects(
      as({ kind: 'staff', userId: manager }, (q) => makeConversation(q, { partnerId: null, creator: manager, members: [manager, a.userId] })),
      /one partner company/,
    );
  });

  it('refuses a partner adding a staff user it cannot see', async () => {
    await rejects(
      as(partnerA(), (q) => q('update chat_conversations set member_ids = member_ids || $2::uuid where id = $1', [a.conversationId, salesStaff])),
      /every new member/,
    );
  });

  it('lets a partner add a colleague or an active partner manager, and staff add a partner user', async () => {
    const extra = await as(partnerA(), async (q) => {
      await q('update chat_conversations set member_ids = member_ids || $2::uuid where id = $1', [a.conversationId, manager]);
      return q('select member_ids from chat_conversations where id = $1', [a.conversationId]);
    });
    expect(extra).toHaveLength(1);
    const staffAdds = await as({ kind: 'staff', userId: manager }, async (q) => {
      await q('update chat_conversations set member_ids = member_ids || $2::uuid where id = $1', [b.conversationId, salesStaff]);
      return q('select member_ids from chat_conversations where id = $1', [b.conversationId]);
    });
    expect(staffAdds).toHaveLength(1);
  });

  it('keeps the company, kind and creator of a chat fixed', async () => {
    await rejects(
      as({ kind: 'staff', userId: manager }, (q) => q('update chat_conversations set partner_id = $2 where id = $1', [a.conversationId, b.partnerId])),
      /keeps its company/,
    );
  });

  it('lets only the sender change what a message says', async () => {
    await rejects(
      as({ kind: 'partner', partnerId: a.partnerId, userId: a.colleagueId }, (q) => q("update chat_messages set body = 'edited' where id = $1", [a.messageId])),
      /only the sender/,
    );
    const bumped = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.colleagueId }, async (q) => {
      await q('update chat_messages set rev = rev + 1 where id = $1', [a.messageId]);
      return q('select rev from chat_messages where id = $1', [a.messageId]);
    });
    expect(Number(bumped[0]?.rev)).toBe(2);
    const edited = await as(partnerA(), async (q) => {
      await q("update chat_messages set body = 'edited' where id = $1", [a.messageId]);
      return q('select body from chat_messages where id = $1', [a.messageId]);
    });
    expect(edited[0]?.body).toBe('edited');
  });

  it('refuses a message sent as somebody else or into a chat you are not in', async () => {
    await rejects(
      as(partnerA(), (q) =>
        q("insert into chat_messages (conversation_id, seq, rev, sender_id, sender_name, sender_org, body) values ($1, 2, 2, $2, 'x', 'x', 'spoof')", [a.conversationId, a.colleagueId]),
      ),
      /row-level security/,
    );
    await rejects(
      as(partnerA(), (q) =>
        q("insert into chat_messages (conversation_id, seq, rev, sender_id, sender_name, sender_org, body) values ($1, 2, 2, $2, 'x', 'x', 'intrude')", [b.conversationId, a.userId]),
      ),
      /row-level security/,
    );
  });

  it('keeps read positions to their owner', async () => {
    const insertMember = async (q: Q): Promise<void> => {
      await q("insert into chat_members (conversation_id, user_id, display_name, org, is_staff) values ($1, $2, 'A', 'Alpha', false), ($1, $3, 'C', 'Alpha', false)", [a.conversationId, a.userId, a.colleagueId]);
    };
    await rejects(
      as(partnerA(), async (q) => {
        await insertMember(q);
        await q('update chat_members set last_read_seq = 9 where conversation_id = $1 and user_id = $2', [a.conversationId, a.colleagueId]);
      }),
      /own read position/,
    );
    const own = await as(partnerA(), async (q) => {
      await insertMember(q);
      await q('update chat_members set last_read_seq = 9 where conversation_id = $1 and user_id = $2', [a.conversationId, a.userId]);
      return q('select last_read_seq from chat_members where user_id = $1', [a.userId]);
    });
    expect(Number(own[0]?.last_read_seq)).toBe(9);
  });

  it('refuses membership rows for people who are not in the chat', async () => {
    await rejects(
      as(partnerA(), (q) => q("insert into chat_members (conversation_id, user_id, display_name, org, is_staff) values ($1, $2, 'S', 'CleanStart', true)", [a.conversationId, salesStaff])),
      /row-level security/,
    );
  });

  it('shows presence only for people you share a chat with', async () => {
    const rows = await as(partnerA(), (q) => q('select user_id from chat_presence'));
    expect(rows.map((r) => r.user_id)).toEqual([a.colleagueId]);
  });
});
