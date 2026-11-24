"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAT_POLL_INBOX_MS,
  CHAT_POLL_THREAD_HIDDEN_MS,
  CHAT_POLL_THREAD_MS,
  type ChatInboxDto,
  type ChatMemberDto,
  type ChatMessageDto,
  type ChatPollDto,
} from "@/lib/chat";
import { markReadAction } from "@/server/actions/chat";
import { getJson } from "./chat-client";

/** Whether the tab is in front. Polling slows right down when it is not, and catches up the moment it returns. */
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = (): void => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/** The chat list, refreshed every 20 seconds while the tab is in front. `refresh` is for after the person does something. */
export function useInbox(initial: ChatInboxDto): { inbox: ChatInboxDto; refresh: () => Promise<void>; offline: boolean } {
  const [inbox, setInbox] = useState(initial);
  const [offline, setOffline] = useState(false);
  const visible = useTabVisible();
  const busy = useRef(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    try {
      setInbox(await getJson<ChatInboxDto>("/api/chat/inbox"));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    void refresh();
    const timer = setInterval(() => void refresh(), CHAT_POLL_INBOX_MS);
    return () => clearInterval(timer);
  }, [visible, refresh]);

  return { inbox, refresh, offline };
}

export interface ThreadState {
  messages: ChatMessageDto[];
  members: Array<Pick<ChatMemberDto, "userId" | "online" | "lastReadSeq" | "lastDeliveredSeq" | "left">>;
  typing: Array<{ userId: string; name: string }>;
  pinnedIds: string[];
  hasMore: boolean;
  loading: boolean;
  loadingOlder: boolean;
  error: string | null;
  /** The viewer's own read position when the chat was opened, for the "New messages" line. */
  openedReadSeq: number;
  lastMsgSeq: number;
  loadOlder: () => Promise<void>;
  /** Adds or replaces messages the viewer just created or changed, ahead of the next poll. */
  merge: (incoming: ChatMessageDto[]) => void;
  pollNow: () => Promise<void>;
  /** Tells the server the viewer has seen everything up to the newest message. */
  markSeen: () => void;
}

const BEFORE_FIRST_POLL = 999_999_999_999;

function mergeMessages(current: ChatMessageDto[], incoming: ChatMessageDto[]): ChatMessageDto[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) {
    const existing = byId.get(message.id);
    if (!existing || message.rev >= existing.rev) byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.seq - b.seq);
}

/** One open chat: the newest page, then a poll for changes every 3 seconds (20 when the tab is hidden). */
export function useThread(conversationId: string | null, myReadSeq: number): ThreadState {
  const visible = useTabVisible();
  const [state, setState] = useState<Omit<ThreadState, "loadOlder" | "merge" | "pollNow" | "markSeen">>({
    messages: [],
    members: [],
    typing: [],
    pinnedIds: [],
    hasMore: false,
    loading: true,
    loadingOlder: false,
    error: null,
    openedReadSeq: myReadSeq,
    lastMsgSeq: 0,
  });
  const rev = useRef(0);
  const readSent = useRef(0);
  const busy = useRef(false);
  const idRef = useRef(conversationId);
  const messagesRef = useRef<ChatMessageDto[]>([]);
  messagesRef.current = state.messages;

  const apply = useCallback((poll: ChatPollDto): void => {
    rev.current = Math.max(rev.current, poll.rev);
    setState((s) => ({
      ...s,
      messages: mergeMessages(s.messages, poll.messages),
      members: poll.members,
      typing: poll.typing,
      pinnedIds: poll.pinnedIds,
      lastMsgSeq: poll.lastMsgSeq,
      error: null,
    }));
  }, []);

  const pollNow = useCallback(async (): Promise<void> => {
    const id = idRef.current;
    if (!id || busy.current) return;
    busy.current = true;
    try {
      const poll = await getJson<ChatPollDto>(`/api/chat/poll?c=${id}&since=${rev.current}`);
      if (idRef.current === id) apply(poll);
    } catch (error) {
      if (idRef.current === id) setState((s) => ({ ...s, error: error instanceof Error ? error.message : "Could not refresh this chat." }));
    } finally {
      busy.current = false;
    }
  }, [apply]);

  // Open a chat: reset, load the newest page and the current rev, then let the poll loop take over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new conversation id is the only trigger; myReadSeq is read once per open
  useEffect(() => {
    idRef.current = conversationId;
    rev.current = 0;
    readSent.current = myReadSeq;
    setState({ messages: [], members: [], typing: [], pinnedIds: [], hasMore: false, loading: conversationId !== null, loadingOlder: false, error: null, openedReadSeq: myReadSeq, lastMsgSeq: 0 });
    if (!conversationId) return;
    let cancelled = false;
    void (async () => {
      try {
        const [page, poll] = await Promise.all([
          getJson<{ messages: ChatMessageDto[]; hasMore: boolean }>(`/api/chat/messages?c=${conversationId}`),
          getJson<ChatPollDto>(`/api/chat/poll?c=${conversationId}&since=${BEFORE_FIRST_POLL}`),
        ]);
        if (cancelled) return;
        rev.current = poll.rev;
        setState((s) => ({ ...s, messages: page.messages, hasMore: page.hasMore, members: poll.members, typing: poll.typing, pinnedIds: poll.pinnedIds, lastMsgSeq: poll.lastMsgSeq, loading: false, error: null }));
      } catch (error) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error.message : "Could not open this chat." }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || state.loading) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = (): void => {
      timer = setTimeout(async () => {
        await pollNow();
        tick();
      }, visible ? CHAT_POLL_THREAD_MS : CHAT_POLL_THREAD_HIDDEN_MS);
    };
    if (visible) void pollNow();
    tick();
    return () => clearTimeout(timer);
  }, [conversationId, state.loading, visible, pollNow]);

  const loadOlder = useCallback(async (): Promise<void> => {
    const id = idRef.current;
    const first = messagesRef.current[0];
    if (!id || !first) return;
    setState((s) => ({ ...s, loadingOlder: true }));
    try {
      const page = await getJson<{ messages: ChatMessageDto[]; hasMore: boolean }>(`/api/chat/messages?c=${id}&before=${first.seq}`);
      if (idRef.current === id) setState((s) => ({ ...s, messages: mergeMessages(s.messages, page.messages), hasMore: page.hasMore, loadingOlder: false }));
    } catch (error) {
      if (idRef.current === id) setState((s) => ({ ...s, loadingOlder: false, error: error instanceof Error ? error.message : "Could not load earlier messages." }));
    }
  }, []);

  const merge = useCallback((incoming: ChatMessageDto[]): void => {
    setState((s) => ({ ...s, messages: mergeMessages(s.messages, incoming), lastMsgSeq: Math.max(s.lastMsgSeq, ...incoming.map((m) => m.seq)) }));
  }, []);

  const markSeen = useCallback((): void => {
    const id = idRef.current;
    const newest = messagesRef.current[messagesRef.current.length - 1]?.seq ?? 0;
    if (!id || newest <= readSent.current) return;
    readSent.current = newest;
    void markReadAction({ conversationId: id, seq: newest });
  }, []);

  return { ...state, loadOlder, merge, pollNow, markSeen };
}
