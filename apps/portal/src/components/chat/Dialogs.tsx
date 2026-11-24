"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { ConfirmDialog, Dialog, Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { CHAT_MAX_TITLE, type ChatConversationDto, type ChatPersonDto, MUTE_CHOICES, type MuteChoice } from "@/lib/chat";
import { initialsOf } from "@/lib/initials";
import {
  addMembersAction,
  createGroupAction,
  leaveGroupAction,
  listPeopleAction,
  openDirectChatAction,
  removeMemberAction,
  renameGroupAction,
  searchMessagesAction,
  setMutedAction,
} from "@/server/actions/chat";
import type { ChatSearchHit } from "@/server/repo/chat";
import { dayLabel } from "./chat-client";

/** A search box over the people this person may chat with. Staff must type two letters; partners see their short list straight away. */
function PeoplePicker({
  staff,
  selected,
  exclude,
  onPick,
}: {
  staff: boolean;
  selected: readonly string[];
  exclude: readonly string[];
  onPick: (person: ChatPersonDto) => void;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<ChatPersonDto[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const timer = setTimeout(async () => {
      const result = await listPeopleAction({ query }).catch(() => null);
      if (cancelled) return;
      if (result?.ok) {
        setPeople(result.data);
        setState("idle");
      } else setState("error");
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const visible = people.filter((p) => !exclude.includes(p.id));
  return (
    <div className="cx-pick">
      <label className="sr" htmlFor="cx-people-q">
        Find a person
      </label>
      <div className="search cx-pick-q">
        <Icon name="search" />
        <input id="cx-people-q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={staff ? "Type a name or email" : "Search your colleagues and CleanStart"} autoComplete="off" />
      </div>
      <ul className="cx-people" aria-live="polite">
        {visible.map((person) => (
          <li key={person.id}>
            <button type="button" className="cx-person" aria-pressed={selected.includes(person.id)} onClick={() => onPick(person)}>
              <span className="cx-av" data-staff={person.isStaff ? "1" : undefined} aria-hidden="true">
                {initialsOf(person.name)}
              </span>
              <span className="cx-person-t">
                <b>{person.name}</b>
                <small>{person.org}</small>
              </span>
              {selected.includes(person.id) ? <Icon name="check" /> : null}
            </button>
          </li>
        ))}
        {state === "error" ? <li className="cx-empty">Could not load people. Try again.</li> : null}
        {state !== "error" && visible.length === 0 && state === "idle" ? (
          <li className="cx-empty">{staff && query.trim().length < 2 ? "Type at least two letters to search." : "Nobody matches."}</li>
        ) : null}
      </ul>
    </div>
  );
}

export function NewChatDialog({
  open,
  onClose,
  staff,
  canCreateGroup,
  onOpened,
}: {
  open: boolean;
  onClose: () => void;
  staff: boolean;
  canCreateGroup: boolean;
  onOpened: (conversationId: string) => void;
}): React.JSX.Element | null {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [title, setTitle] = useState("");
  const [chosen, setChosen] = useState<ChatPersonDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("direct");
      setTitle("");
      setChosen([]);
      setError(null);
    }
  }, [open]);

  const startDirect = async (person: ChatPersonDto): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await openDirectChatAction({ userId: person.id }).catch(() => null);
    setBusy(false);
    if (!result?.ok) {
      setError(result ? result.error.message : "Could not reach the server. Try again.");
      return;
    }
    onClose();
    onOpened(result.data.id);
  };

  const createGroup = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await createGroupAction({ title, userIds: chosen.map((p) => p.id) }).catch(() => null);
    setBusy(false);
    if (!result?.ok) {
      setError(result ? (result.error.issues?.[0]?.message ?? result.error.message) : "Could not reach the server. Try again.");
      return;
    }
    onClose();
    onOpened(result.data.id);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New chat"
      subtitle={mode === "direct" ? "Pick a person to message." : "Name the group and pick its people."}
      className="cx-dialog"
      footer={
        mode === "group" ? (
          <>
            <button type="button" className="btn btn-s" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-p" disabled={busy || title.trim() === "" || chosen.length === 0} onClick={() => void createGroup()}>
              Create group
            </button>
          </>
        ) : undefined
      }
    >
      {canCreateGroup ? (
        <div className="seg cx-seg" role="tablist" aria-label="Chat type">
          {(["direct", "group"] as const).map((value) => (
            <button key={value} type="button" role="tab" aria-selected={mode === value} className={`seg-b${mode === value ? " seg-on" : ""}`} onClick={() => setMode(value)}>
              {value === "direct" ? "Direct message" : "Group"}
            </button>
          ))}
        </div>
      ) : null}
      {mode === "group" ? (
        <div className="cx-field">
          <label htmlFor="cx-group-title">Group name</label>
          <input id="cx-group-title" className="finput" value={title} maxLength={CHAT_MAX_TITLE} onChange={(event) => setTitle(event.target.value)} placeholder="Q1 rollout" />
          {chosen.length > 0 ? (
            <ul className="cx-tray">
              {chosen.map((person) => (
                <li key={person.id} className="cx-chip">
                  <b>{person.name}</b>
                  <button type="button" aria-label={`Remove ${person.name}`} onClick={() => setChosen((current) => current.filter((p) => p.id !== person.id))}>
                    <Icon name="x" small />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <PeoplePicker
        staff={staff}
        selected={chosen.map((p) => p.id)}
        exclude={[]}
        onPick={(person) => {
          if (mode === "direct") void startDirect(person);
          else setChosen((current) => (current.some((p) => p.id === person.id) ? current.filter((p) => p.id !== person.id) : [...current, person]));
        }}
      />
      {error ? (
        <p className="cx-err" role="alert">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}

const MUTE_LABEL: Record<MuteChoice, string> = { "1h": "1 hour", "8h": "8 hours", week: "1 week", forever: "Always", off: "Unmute" };

export function ChatInfoDrawer({
  open,
  onClose,
  conversation,
  myId,
  staff,
  onChanged,
  onLeft,
}: {
  open: boolean;
  onClose: () => void;
  conversation: ChatConversationDto;
  myId: string;
  staff: boolean;
  onChanged: () => void;
  onLeft: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [title, setTitle] = useState(conversation.title);
  const [adding, setAdding] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const group = conversation.kind === "group";
  const current = conversation.members.filter((m) => !m.left);

  useEffect(() => {
    setTitle(conversation.title);
    setError(null);
    setAdding(false);
  }, [conversation.title]);

  const run = async (work: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>, done?: string): Promise<boolean> => {
    setError(null);
    const result = await work().catch(() => null);
    if (!result?.ok) {
      setError(result ? result.error.message : "Could not reach the server. Try again.");
      return false;
    }
    if (done) toast(done);
    onChanged();
    return true;
  };

  return (
    <Drawer open={open} onClose={onClose} title={conversation.title} subtitle={group ? `${current.length} people` : (conversation.subtitle ?? "Direct message")} className="cx-drawer">
      <section className="cx-sec">
        <h3>Notifications</h3>
        <p className="cx-note">{conversation.muted ? "This chat is muted. It will not count toward your unread badge." : "You are notified of new messages."}</p>
        <div className="cx-mutes">
          {MUTE_CHOICES.filter((choice) => (choice === "off" ? conversation.muted : true)).map((choice) => (
            <button key={choice} type="button" className="btn btn-s" onClick={() => void run(() => setMutedAction({ conversationId: conversation.id, choice }), choice === "off" ? "Chat unmuted" : "Chat muted")}>
              {choice === "off" ? "Unmute" : `Mute ${MUTE_LABEL[choice].toLowerCase()}`}
            </button>
          ))}
        </div>
      </section>

      {group && conversation.canManage ? (
        <section className="cx-sec">
          <h3>Group name</h3>
          <form
            className="cx-inline"
            onSubmit={(event) => {
              event.preventDefault();
              if (title.trim() !== "" && title.trim() !== conversation.title) void run(() => renameGroupAction({ conversationId: conversation.id, title }), "Group renamed");
            }}
          >
            <label className="sr" htmlFor="cx-rename">
              Group name
            </label>
            <input id="cx-rename" className="finput" value={title} maxLength={CHAT_MAX_TITLE} onChange={(event) => setTitle(event.target.value)} />
            <button type="submit" className="btn btn-s" disabled={title.trim() === "" || title.trim() === conversation.title}>
              Rename
            </button>
          </form>
        </section>
      ) : null}

      <section className="cx-sec">
        <h3>People</h3>
        <ul className="cx-people">
          {current.map((member) => (
            <li key={member.userId} className="cx-person cx-person-static">
              <span className="cx-av" data-staff={member.isStaff ? "1" : undefined} aria-hidden="true">
                {initialsOf(member.name)}
                {member.online ? <i className="cx-on" title="Online" /> : null}
              </span>
              <span className="cx-person-t">
                <b>
                  {member.name}
                  {member.userId === myId ? " (you)" : ""}
                </b>
                <small>
                  {member.org}
                  {member.role === "owner" && group ? ", owner" : ""}
                </small>
              </span>
              {group && conversation.canManage && member.userId !== myId ? (
                <button type="button" className="btn btn-g" onClick={() => void run(() => removeMemberAction({ conversationId: conversation.id, userId: member.userId }), `${member.name} removed`)}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {group && conversation.canManage ? (
          adding ? (
            <PeoplePicker
              staff={staff}
              selected={[]}
              exclude={current.map((m) => m.userId)}
              onPick={(person) => void run(() => addMembersAction({ conversationId: conversation.id, userIds: [person.id] }), `${person.name} added`).then((ok) => ok && setAdding(false))}
            />
          ) : (
            <button type="button" className="btn btn-s" onClick={() => setAdding(true)}>
              <Icon name="userplus" />
              Add people
            </button>
          )
        ) : null}
      </section>

      {group ? (
        <section className="cx-sec">
          <button type="button" className="btn btn-d" onClick={() => setConfirmLeave(true)}>
            Leave group
          </button>
        </section>
      ) : null}
      {error ? (
        <p className="cx-err" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this group?"
        body="You will no longer see the group or its history. Someone has to add you back to rejoin."
        confirmLabel="Leave group"
        danger
        onConfirm={() =>
          void run(() => leaveGroupAction({ conversationId: conversation.id })).then((ok) => {
            if (ok) {
              onClose();
              onLeft();
            }
          })
        }
      />
    </Drawer>
  );
}

export function SearchDialog({
  open,
  onClose,
  initialQuery,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  initialQuery: string;
  onPick: (conversationId: string) => void;
}): React.JSX.Element | null {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<ChatSearchHit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (open) setQuery(initialQuery);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setHits([]);
      setState("idle");
      return;
    }
    let cancelled = false;
    setState("loading");
    const timer = setTimeout(async () => {
      const result = await searchMessagesAction({ query }).catch(() => null);
      if (cancelled) return;
      if (result?.ok) {
        setHits(result.data);
        setState("idle");
      } else setState("error");
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Dialog open={open} onClose={onClose} title="Search messages" className="cx-dialog">
      <div className="search cx-pick-q">
        <Icon name="search" />
        <input aria-label="Search messages" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Words from a message" autoComplete="off" />
      </div>
      <ul className="cx-people" aria-live="polite">
        {hits.map((hit) => (
          <li key={hit.messageId}>
            <button
              type="button"
              className="cx-person"
              onClick={() => {
                onClose();
                onPick(hit.conversationId);
              }}
            >
              <span className="cx-person-t">
                <b>{hit.conversationTitle}</b>
                <small>
                  {hit.senderName}, {dayLabel(hit.createdAt)}
                </small>
                <span className="cx-snip">{hit.snippet}</span>
              </span>
            </button>
          </li>
        ))}
        {state === "error" ? <li className="cx-empty">Search failed. Try again.</li> : null}
        {state === "idle" && query.trim().length >= 2 && hits.length === 0 ? <li className="cx-empty">No messages match.</li> : null}
        {query.trim().length < 2 ? <li className="cx-empty">Type at least two letters.</li> : null}
      </ul>
    </Dialog>
  );
}
