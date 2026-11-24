"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChatInfoDrawer, NewChatDialog, SearchDialog } from "@/components/chat/Dialogs";
import { Composer, type ComposerHandle } from "@/components/chat/Composer";
import { dayKey, dayLabel, listLabel } from "@/components/chat/chat-client";
import { MessageView, type MessageActions } from "@/components/chat/MessageView";
import { useInbox, useThread } from "@/components/chat/use-chat";
import "@/components/chat/chat.css";
import { Icon } from "@/components/icon";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { type ChatConversationDto, type ChatInboxDto, type ChatMessageDto, tickState } from "@/lib/chat";
import { initialsOf } from "@/lib/initials";
import { deleteMessageAction, setPinnedAction, toggleReactionAction } from "@/server/actions/chat";

interface MessagesProps {
  initialInbox: ChatInboxDto;
  viewerId: string;
  staff: boolean;
  canCreateGroup: boolean;
  initialId: string | null;
  basePath: string;
}

const NEAR_BOTTOM_PX = 120;
const GAP_MS = 5 * 60_000;

function ChatAvatar({ conversation }: { conversation: ChatConversationDto }): React.JSX.Element {
  const other = conversation.members.find((m) => !m.left && conversation.kind === "direct" && m.name === conversation.title);
  return conversation.kind === "group" ? (
    <span className="cx-av cx-av-group" aria-hidden="true">
      <Icon name="team" />
    </span>
  ) : (
    <span className="cx-av" data-staff={other?.isStaff ? "1" : undefined} aria-hidden="true">
      {initialsOf(conversation.title)}
      {other?.online ? <i className="cx-on" /> : null}
    </span>
  );
}

/** Messages: every chat the person is in on the left, the open chat on the right. Shared by the partner portal and the admin portal. */
export function Messages({ initialInbox, viewerId, staff, canCreateGroup, initialId, basePath }: MessagesProps): React.JSX.Element {
  const toast = useToast();
  const { inbox, refresh, offline } = useInbox(initialInbox);
  const [activeId, setActiveId] = useState<string | null>(initialId && initialInbox.conversations.some((c) => c.id === initialId) ? initialId : null);
  const [filter, setFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSeed, setSearchSeed] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessageDto | null>(null);
  const [editing, setEditing] = useState<ChatMessageDto | null>(null);
  const [removing, setRemoving] = useState<ChatMessageDto | null>(null);
  const [dragging, setDragging] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [unseenBelow, setUnseenBelow] = useState(0);
  const [mounted, setMounted] = useState(false);

  const active = inbox.conversations.find((c) => c.id === activeId) ?? null;
  const me = active?.members.find((m) => m.userId === viewerId);
  const thread = useThread(active ? active.id : null, me?.lastReadSeq ?? 0);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);
  const stick = useRef(true);
  const prevHeight = useRef<number | null>(null);
  const lastSeq = useRef(0);
  const dragDepth = useRef(0);

  useEffect(() => setMounted(true), []);

  const open = useCallback(
    (id: string | null): void => {
      setActiveId(id);
      setReplyTo(null);
      setEditing(null);
      setInfoOpen(false);
      stick.current = true;
      setUnseenBelow(0);
      const url = id ? `${basePath}?c=${id}` : basePath;
      window.history.replaceState(null, "", url);
    },
    [basePath],
  );

  // A chat opened from a notice or a new group may not be in the list yet.
  useEffect(() => {
    if (activeId && !inbox.conversations.some((c) => c.id === activeId)) void refresh();
  }, [activeId, inbox.conversations, refresh]);

  const atBottom = (): boolean => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const toBottom = useCallback((smooth = false): void => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    stick.current = true;
    setUnseenBelow(0);
  }, []);

  // Keep the view where the person is: pinned to the newest message, or steady when older pages arrive above.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prevHeight.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
      return;
    }
    const newest = thread.messages[thread.messages.length - 1]?.seq ?? 0;
    const arrived = newest > lastSeq.current;
    lastSeq.current = newest;
    if (stick.current) el.scrollTop = el.scrollHeight;
    else if (arrived) {
      const fresh = thread.messages.filter((m) => m.seq > (lastSeq.current - 1) && m.senderId !== viewerId).length;
      setUnseenBelow((n) => n + Math.max(fresh, 1));
    }
  }, [thread.messages, viewerId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new chat starts at its newest message
  useLayoutEffect(() => {
    lastSeq.current = 0;
    stick.current = true;
  }, [activeId]);

  // Seen: the newest message is on screen in a visible tab.
  const markSeen = thread.markSeen;
  useEffect(() => {
    if (thread.loading || thread.messages.length === 0 || document.visibilityState !== "visible" || !stick.current) return;
    const timer = setTimeout(() => {
      markSeen();
      setTimeout(() => void refresh(), 700);
    }, 400);
    return () => clearTimeout(timer);
  }, [thread.loading, thread.messages, markSeen, refresh]);

  const onScroll = (): void => {
    const el = scroller.current;
    if (!el) return;
    stick.current = atBottom();
    if (stick.current) setUnseenBelow(0);
    if (el.scrollTop < 80 && thread.hasMore && !thread.loadingOlder) {
      prevHeight.current = el.scrollHeight;
      void thread.loadOlder();
    }
  };

  const actions: MessageActions = useMemo(
    () => ({
      react: (message, emoji) => {
        void toggleReactionAction({ messageId: message.id, emoji }).then((result) => (result.ok ? thread.pollNow() : toast(result.error.message)));
      },
      reply: (message) => {
        setEditing(null);
        setReplyTo(message);
        composer.current?.focus();
      },
      pin: (message) => {
        void setPinnedAction({ messageId: message.id, pinned: !message.pinned }).then((result) => (result.ok ? thread.pollNow() : toast(result.error.message)));
      },
      edit: (message) => {
        setReplyTo(null);
        setEditing(message);
      },
      remove: (message) => setRemoving(message),
      jumpTo: (id) => {
        const el = document.getElementById(`m-${id}`);
        if (!el) {
          toast("That message is further back. Scroll up to load earlier messages.");
          return;
        }
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setHighlight(id);
        setTimeout(() => setHighlight(null), 1600);
      },
    }),
    [thread, toast],
  );

  const rows = useMemo(() => {
    const out: Array<{ key: string; kind: "day" | "unread" | "message"; label?: string; message?: ChatMessageDto; head?: boolean }> = [];
    let previous: ChatMessageDto | null = null;
    let unreadShown = false;
    for (const message of thread.messages) {
      if (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)) out.push({ key: `d-${message.id}`, kind: "day", label: dayLabel(message.createdAt) });
      if (!unreadShown && message.seq > thread.openedReadSeq && message.senderId !== viewerId && message.kind === "text") {
        unreadShown = true;
        out.push({ key: `u-${message.id}`, kind: "unread" });
      }
      const head =
        !previous ||
        previous.kind === "system" ||
        message.kind === "system" ||
        previous.senderId !== message.senderId ||
        new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > GAP_MS ||
        dayKey(previous.createdAt) !== dayKey(message.createdAt);
      out.push({ key: message.id, kind: "message", message, head });
      previous = message;
    }
    return out;
  }, [thread.messages, thread.openedReadSeq, viewerId]);

  const others = thread.members.filter((m) => m.userId !== viewerId && !m.left);
  const nameOf = (id: string): string => active?.members.find((m) => m.userId === id)?.name ?? "Someone";
  const tickFor = (message: ChatMessageDto): { state: ReturnType<typeof tickState>; title: string } => {
    const state = tickState(message.seq, others);
    if (state === "seen") return { state, title: active?.kind === "group" ? "Seen by everyone" : "Seen" };
    const readers = others.filter((o) => o.lastReadSeq >= message.seq);
    if (active?.kind === "group" && readers.length > 0) return { state, title: `Seen by ${readers.map((r) => nameOf(r.userId)).join(", ")}` };
    return { state, title: state === "delivered" ? "Delivered" : "Sent" };
  };

  const pinned = thread.messages.filter((m) => m.pinned && !m.deleted);
  const typingNames = thread.typing.map((t) => t.name.split(" ")[0]);
  const visibleChats = inbox.conversations.filter((c) => (unreadOnly ? c.unread > 0 : true) && c.title.toLowerCase().includes(filter.trim().toLowerCase()));
  const otherPerson = active?.kind === "direct" ? thread.members.find((m) => m.userId !== viewerId) : undefined;

  const onDrag = (event: React.DragEvent, enter: boolean): void => {
    if (!active || !Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    dragDepth.current += enter ? 1 : -1;
    setDragging(dragDepth.current > 0);
  };

  return (
    <div className="cx" data-pane={active ? "thread" : "list"}>
      <aside className="cx-list" aria-label="Chats">
        <div className="cx-list-h">
          <h1 className="h1">Messages</h1>
          <div className="cx-list-act">
            <button type="button" className="ibtn" aria-label="Search messages" data-hint="Search messages" onClick={() => { setSearchSeed(""); setSearchOpen(true); }}>
              <Icon name="search" />
            </button>
            <button type="button" className="btn btn-p" onClick={() => setNewOpen(true)}>
              <Icon name="userplus" />
              New chat
            </button>
          </div>
        </div>
        <div className="cx-list-f">
          <label className="sr" htmlFor="cx-filter">
            Filter chats
          </label>
          <input id="cx-filter" className="finput" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter chats" autoComplete="off" />
          <button type="button" className={`btn ${unreadOnly ? "btn-p" : "btn-s"}`} aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>
            Unread{inbox.unreadTotal > 0 ? ` ${inbox.unreadTotal}` : ""}
          </button>
        </div>
        {offline ? (
          <p className="cx-offline" role="status">
            Reconnecting...
          </p>
        ) : null}
        <ul className="cx-chats">
          {visibleChats.map((chat) => (
            <li key={chat.id}>
              <button type="button" className="cx-chat" aria-current={chat.id === activeId ? "true" : undefined} onClick={() => open(chat.id)}>
                <ChatAvatar conversation={chat} />
                <span className="cx-chat-t">
                  <span className="cx-chat-r">
                    <b>{chat.title}</b>
                    {chat.lastMessageAt ? (
                      <time dateTime={chat.lastMessageAt} suppressHydrationWarning>
                        {mounted ? listLabel(chat.lastMessageAt) : ""}
                      </time>
                    ) : null}
                  </span>
                  <span className="cx-chat-r">
                    <span className="cx-prev">{chat.lastPreview ?? "No messages yet"}</span>
                    {chat.unread > 0 ? (
                      <span className={`cx-badge${chat.muted ? " cx-badge-muted" : ""}`} aria-label={`${chat.unread} unread`}>
                        {chat.unread > 99 ? "99+" : chat.unread}
                      </span>
                    ) : chat.muted ? (
                      <span className="cx-muted">Muted</span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {inbox.conversations.length === 0 ? (
            <li className="cx-empty">
              <b>No chats yet</b>
              <span>{staff ? "Start a chat with a partner or a colleague." : "Message your CleanStart partner manager or a colleague."}</span>
              <button type="button" className="btn btn-p" onClick={() => setNewOpen(true)}>
                New chat
              </button>
            </li>
          ) : visibleChats.length === 0 ? (
            <li className="cx-empty">{unreadOnly ? "Nothing unread." : "No chat matches."}</li>
          ) : null}
        </ul>
      </aside>

      <section
        className="cx-thread"
        aria-label={active ? `Chat with ${active.title}` : "Chat"}
        onDragEnter={(event) => onDrag(event, true)}
        onDragLeave={(event) => onDrag(event, false)}
        onDragOver={(event) => {
          if (active && Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!active) return;
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          composer.current?.addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        {active ? (
          <>
            <header className="cx-thread-h">
              <button type="button" className="ibtn cx-back" aria-label="Back to chats" onClick={() => open(null)}>
                <Icon name="caret" className="cx-flip" />
              </button>
              <ChatAvatar conversation={active} />
              <div className="cx-thread-t">
                <b>{active.title}</b>
                <small>{typingNames.length > 0 ? `${typingNames.join(", ")} typing...` : active.kind === "direct" ? `${otherPerson?.online ? "Online, " : ""}${active.subtitle ?? ""}` : active.subtitle}</small>
              </div>
              <button type="button" className="ibtn" aria-label="Search in all chats" data-hint="Search messages" onClick={() => { setSearchSeed(""); setSearchOpen(true); }}>
                <Icon name="search" />
              </button>
              <button type="button" className="ibtn" aria-label="Chat details" data-hint="Details and people" onClick={() => setInfoOpen(true)}>
                <Icon name="info" />
              </button>
            </header>
            {pinned.length > 0 ? (
              <button type="button" className="cx-pinbar" onClick={() => actions.jumpTo(pinned[pinned.length - 1]?.id ?? "")}>
                <b>{pinned.length === 1 ? "Pinned" : `${pinned.length} pinned`}</b>
                <span>{pinned[pinned.length - 1]?.body.slice(0, 120) || "A file"}</span>
              </button>
            ) : null}
            {thread.error ? (
              <p className="cx-offline" role="status">
                {thread.error} Retrying...
              </p>
            ) : null}
            <div className="cx-scroll" ref={scroller} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions" aria-label="Messages">
              {thread.loadingOlder ? <p className="cx-older">Loading earlier messages...</p> : null}
              {thread.loading ? (
                <div className="cx-skel" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={i % 2 ? "cx-skel-r" : ""} />
                  ))}
                </div>
              ) : null}
              {!thread.loading && thread.messages.length === 0 ? <p className="cx-first">This is the start of your chat with {active.title}. Say hello.</p> : null}
              {rows.map((row) => {
                if (row.kind === "day") return <div key={row.key} className="cx-day"><span>{row.label}</span></div>;
                if (row.kind === "unread") return <div key={row.key} className="cx-newline"><span>New messages</span></div>;
                const message = row.message as ChatMessageDto;
                const tick = tickFor(message);
                return (
                  <MessageView
                    key={row.key}
                    message={message}
                    mine={message.senderId === viewerId}
                    head={row.head ?? true}
                    showName={active.kind === "group"}
                    tick={tick.state}
                    tickTitle={tick.title}
                    actions={actions}
                    highlighted={highlight === message.id}
                  />
                );
              })}
            </div>
            {unseenBelow > 0 ? (
              <button type="button" className="cx-jump" onClick={() => toBottom(true)}>
                {unseenBelow} new {unseenBelow === 1 ? "message" : "messages"}
              </button>
            ) : null}
            <Composer
              ref={composer}
              conversationId={active.id}
              myId={viewerId}
              members={active.members}
              replyTo={replyTo}
              editing={editing}
              onClearReply={() => setReplyTo(null)}
              onClearEdit={() => setEditing(null)}
              onSent={(message) => {
                thread.merge([message]);
                stick.current = true;
                requestAnimationFrame(() => toBottom(true));
                void refresh();
              }}
              onChanged={() => {
                void thread.pollNow();
                void refresh();
              }}
              onSearch={(query) => {
                setSearchSeed(query);
                setSearchOpen(true);
              }}
            />
            {dragging ? (
              <div className="cx-drop" aria-hidden="true">
                <b>Drop files to attach</b>
                <span>Up to 10 files, 25 MB each</span>
              </div>
            ) : null}
            <ChatInfoDrawer
              open={infoOpen}
              onClose={() => setInfoOpen(false)}
              conversation={active}
              myId={viewerId}
              staff={staff}
              onChanged={() => void refresh()}
              onLeft={() => {
                open(null);
                void refresh();
              }}
            />
          </>
        ) : (
          <div className="cx-none">
            <Icon name="send" />
            <b>Select a chat</b>
            <span>Pick a conversation from the list, or start a new one.</span>
          </div>
        )}
      </section>

      <NewChatDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        staff={staff}
        canCreateGroup={canCreateGroup}
        onOpened={(id) => {
          open(id);
          void refresh();
        }}
      />
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        initialQuery={searchSeed}
        onPick={(id) => {
          open(id);
          void refresh();
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this message?"
        body="It disappears for everyone in the chat and any files on it are removed. This cannot be undone."
        confirmLabel="Delete message"
        danger
        onConfirm={() => {
          const target = removing;
          if (!target) return;
          void deleteMessageAction({ messageId: target.id }).then((result) => (result.ok ? thread.pollNow() : toast(result.error.message)));
        }}
      />
    </div>
  );
}
