"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/ui/toast";
import {
  CHAT_ACCEPT,
  CHAT_FILE_MAX_BYTES,
  CHAT_MAX_BODY,
  CHAT_MAX_FILES,
  CHAT_TYPING_SEND_MS,
  type ChatMemberDto,
  type ChatMessageDto,
  type ChatRefDto,
  checkChatFile,
  formatBytes,
  matchSlash,
  MUTE_CHOICES,
  type MuteChoice,
  parseSlash,
  SLASH_COMMANDS,
} from "@/lib/chat";
import {
  discardChatUploadAction,
  editMessageAction,
  searchShareablesAction,
  sendMessageAction,
  setMutedAction,
  setPinnedAction,
  setTypingAction,
} from "@/server/actions/chat";
import { uploadChatFile } from "./chat-client";

export interface ComposerHandle {
  addFiles: (files: readonly File[]) => void;
  focus: () => void;
}

interface Tray {
  key: string;
  name: string;
  size: number;
  status: "uploading" | "ready" | "error";
  progress: number;
  attachmentId: string | null;
  error: string | null;
  cancel: (() => void) | null;
}

interface ComposerProps {
  conversationId: string;
  myId: string;
  members: readonly ChatMemberDto[];
  replyTo: ChatMessageDto | null;
  editing: ChatMessageDto | null;
  onClearReply: () => void;
  onClearEdit: () => void;
  onSent: (message: ChatMessageDto) => void;
  onChanged: () => void;
  onSearch: (query: string) => void;
}

const pastedName = (file: File, index: number): string => (file.name && file.name !== "image.png" ? file.name : `pasted-${Date.now()}-${index + 1}.${(file.type.split("/")[1] ?? "png").replace("jpeg", "jpg")}`);

const mentionAt = (text: string, caret: number): { start: number; query: string } | null => {
  const before = text.slice(0, caret);
  const match = /(?:^|\s)@([\p{L}\p{N}._-]*)$/u.exec(before);
  return match ? { start: caret - (match[1]?.length ?? 0) - 1, query: (match[1] ?? "").toLowerCase() } : null;
};

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { conversationId, myId, members, replyTo, editing, onClearReply, onClearEdit, onSent, onChanged, onSearch },
  handle,
): React.JSX.Element {
  const toast = useToast();
  const [text, setText] = useState("");
  const [tray, setTray] = useState<Tray[]>([]);
  const [refs, setRefs] = useState<ChatRefDto[]>([]);
  const [mentions, setMentions] = useState<Map<string, string>>(new Map());
  const [caret, setCaret] = useState(0);
  const [pick, setPick] = useState(0);
  const [found, setFound] = useState<ChatRefDto[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const typingSent = useRef(0);
  const conversationRef = useRef(conversationId);
  const trayRef = useRef(tray);
  trayRef.current = tray;

  const resize = useCallback((): void => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  // A different chat starts with a clean composer; unsent files of the old one are withdrawn.
  useEffect(() => {
    conversationRef.current = conversationId;
    for (const item of trayRef.current) {
      item.cancel?.();
      if (item.attachmentId) void discardChatUploadAction({ attachmentId: item.attachmentId });
    }
    setText("");
    setTray([]);
    setRefs([]);
    setMentions(new Map());
    setNotice(null);
    setHelpOpen(false);
  }, [conversationId]);

  // Editing loads the message into the box.
  useEffect(() => {
    if (editing) {
      setText(editing.body);
      requestAnimationFrame(() => {
        area.current?.focus();
        resize();
      });
    }
  }, [editing, resize]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the box grows with its text
  useEffect(resize, [text]);

  const addFiles = useCallback(
    (files: readonly File[]): void => {
      setNotice(null);
      const room = CHAT_MAX_FILES - trayRef.current.length;
      let accepted = 0;
      for (const file of files) {
        const verdict = checkChatFile(file, trayRef.current.length + accepted);
        if (!verdict.ok || accepted >= room) {
          setNotice(verdict.message ?? `Attach up to ${CHAT_MAX_FILES} files per message.`);
          if (!verdict.ok) continue;
          break;
        }
        accepted += 1;
        const key = crypto.randomUUID();
        const update = (patch: Partial<Tray>): void => setTray((current) => current.map((t) => (t.key === key ? { ...t, ...patch } : t)));
        setTray((current) => [...current, { key, name: file.name, size: file.size, status: "uploading", progress: 0, attachmentId: null, error: null, cancel: null }]);
        const forChat = conversationRef.current;
        uploadChatFile(
          forChat,
          file,
          (progress) => update({ progress }),
          (cancel) => update({ cancel }),
        ).then(
          (attachmentId) => {
            if (conversationRef.current !== forChat) {
              void discardChatUploadAction({ attachmentId });
              return;
            }
            update({ status: "ready", progress: 1, attachmentId, cancel: null });
          },
          (error: unknown) => {
            const message = error instanceof Error ? error.message : "The upload failed.";
            if (message !== "cancelled") update({ status: "error", error: message, cancel: null });
          },
        );
      }
    },
    [],
  );

  useImperativeHandle(handle, () => ({ addFiles, focus: () => area.current?.focus() }), [addFiles]);

  const removeFromTray = (item: Tray): void => {
    item.cancel?.();
    if (item.attachmentId) void discardChatUploadAction({ attachmentId: item.attachmentId });
    setTray((current) => current.filter((t) => t.key !== item.key));
  };

  // Slash menu, mention menu and the /deal and /doc picker are all driven from the text and the caret.
  const slashMatches = matchSlash(text);
  const share = /^\/(deal|doc)(?:\s+([^\n]*))?$/.exec(text);
  const mention = mentionAt(text, caret);
  const mentionMatches = mention
    ? members.filter((m) => !m.left && m.userId !== myId && m.name.toLowerCase().includes(mention.query)).slice(0, 6)
    : [];
  const shareKind = share?.[1] === "doc" ? "doc" : "deal";
  const shareQuery = share?.[2] ?? "";
  const menuLength = share ? found.length : slashMatches.length > 0 ? slashMatches.length : mentionMatches.length;

  useEffect(() => {
    if (!share) {
      setFound([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchShareablesAction({ kind: shareKind, query: shareQuery }).catch(() => null);
      if (!cancelled) setFound(result?.ok ? result.data : []);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [share, shareKind, shareQuery]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new menu starts at its first row
  useEffect(() => setPick(0), [slashMatches.length, mentionMatches.length, found.length, share === null]);

  const noteTyping = (): void => {
    const now = Date.now();
    if (now - typingSent.current < CHAT_TYPING_SEND_MS) return;
    typingSent.current = now;
    void setTypingAction({ conversationId });
  };

  const choose = (index: number): void => {
    if (share) {
      const ref = found[index];
      if (!ref) return;
      setRefs((current) => (current.some((r) => r.id === ref.id) ? current : [...current, ref]));
      setText("");
      area.current?.focus();
      return;
    }
    if (slashMatches.length > 0) {
      const command = slashMatches[index];
      if (command) setText(`/${command.name} `);
      return;
    }
    const person = mentionMatches[index];
    if (person && mention) {
      const after = text.slice(caret);
      const next = `${text.slice(0, mention.start)}@${person.name} ${after}`;
      setText(next);
      setMentions((current) => new Map(current).set(person.userId, person.name));
      requestAnimationFrame(() => {
        const position = mention.start + person.name.length + 2;
        area.current?.setSelectionRange(position, position);
        setCaret(position);
      });
    }
  };

  const runCommand = async (name: string, args: string): Promise<boolean> => {
    switch (name) {
      case "help":
        setHelpOpen(true);
        setText("");
        return true;
      case "mute":
      case "unmute": {
        const choice: MuteChoice = name === "unmute" ? "off" : ((MUTE_CHOICES as readonly string[]).includes(args) ? (args as MuteChoice) : "8h");
        const result = await setMutedAction({ conversationId, choice });
        toast(result.ok ? (choice === "off" ? "Chat unmuted" : "Chat muted") : result.error.message);
        setText("");
        onChanged();
        return true;
      }
      case "pin": {
        if (!replyTo) {
          setNotice("Reply to a message first, then type /pin.");
          return true;
        }
        const result = await setPinnedAction({ messageId: replyTo.id, pinned: true });
        toast(result.ok ? "Message pinned" : result.error.message);
        setText("");
        onClearReply();
        onChanged();
        return true;
      }
      case "search":
        onSearch(args);
        setText("");
        return true;
      default:
        return false;
    }
  };

  const submit = async (): Promise<void> => {
    if (sending) return;
    setNotice(null);
    const slash = parseSlash(text);
    if (slash && !editing && (await runCommand(slash.name, slash.args))) return;
    let body = text.trim();
    if (slash?.name === "shrug") body = `${slash.args} ¯\\_(ツ)_/¯`.trim();
    const ready = tray.filter((t) => t.status === "ready" && t.attachmentId);
    if (tray.some((t) => t.status === "uploading")) {
      setNotice("Wait for the files to finish uploading.");
      return;
    }
    if (editing) {
      setSending(true);
      const result = await editMessageAction({ messageId: editing.id, body });
      setSending(false);
      if (!result.ok) {
        setNotice(result.error.message);
        return;
      }
      setText("");
      onClearEdit();
      onChanged();
      return;
    }
    if (body === "" && ready.length === 0 && refs.length === 0) return;
    if (body.length > CHAT_MAX_BODY) {
      setNotice(`Keep it under ${CHAT_MAX_BODY} characters.`);
      return;
    }
    setSending(true);
    const result = await sendMessageAction({
      conversationId,
      body,
      replyToId: replyTo?.id ?? null,
      mentionIds: [...mentions].filter(([, name]) => body.includes(`@${name}`)).map(([id]) => id),
      refs: refs.map((r) => ({ kind: r.kind, id: r.id })),
      attachmentIds: ready.map((t) => t.attachmentId ?? ""),
    });
    setSending(false);
    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }
    onSent(result.data);
    setText("");
    setTray([]);
    setRefs([]);
    setMentions(new Map());
    onClearReply();
    area.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.nativeEvent.isComposing) return;
    if (menuLength > 0 && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setPick((index) => (index + (event.key === "ArrowDown" ? 1 : menuLength - 1)) % menuLength);
      return;
    }
    if (menuLength > 0 && (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey && (share || mentionMatches.length > 0 || (slashMatches.length > 0 && !parseSlash(text))))) ) {
      event.preventDefault();
      choose(pick);
      return;
    }
    if (event.key === "Escape") {
      if (editing) {
        setText("");
        onClearEdit();
      } else if (replyTo) onClearReply();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>): void => {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    addFiles(files.map((file, index) => (file.name === pastedName(file, index) ? file : new File([file], pastedName(file, index), { type: file.type }))));
  };

  const hasContent = text.trim() !== "" || refs.length > 0 || tray.some((t) => t.status === "ready");
  const uploading = tray.some((t) => t.status === "uploading");

  return (
    <div className="cx-composer">
      {helpOpen ? (
        <div className="cx-help" role="dialog" aria-label="Slash commands">
          <div className="cx-help-h">
            <b>Slash commands</b>
            <button type="button" className="cx-tool" onClick={() => setHelpOpen(false)}>
              Close
            </button>
          </div>
          <ul>
            {SLASH_COMMANDS.map((command) => (
              <li key={command.name}>
                <code>
                  /{command.name}
                  {command.args ? ` ${command.args}` : ""}
                </code>
                <span>{command.summary}</span>
              </li>
            ))}
          </ul>
          <p>Paste or drop files to attach them. Up to {CHAT_MAX_FILES} files of {formatBytes(CHAT_FILE_MAX_BYTES)} each.</p>
        </div>
      ) : null}

      {menuLength > 0 ? (
        <div className="cx-menu" role="listbox" tabIndex={-1} aria-label={share ? "Matches" : slashMatches.length > 0 ? "Commands" : "People"}>
          {share
            ? found.map((ref, index) => (
                <button key={ref.id} type="button" role="option" aria-selected={index === pick} className="cx-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(index)}>
                  <b>{ref.title}</b>
                  <small>{ref.sub}</small>
                </button>
              ))
            : slashMatches.length > 0
              ? slashMatches.map((command, index) => (
                  <button key={command.name} type="button" role="option" aria-selected={index === pick} className="cx-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(index)}>
                    <b>/{command.name}</b>
                    <small>{command.summary}</small>
                  </button>
                ))
              : mentionMatches.map((person, index) => (
                  <button key={person.userId} type="button" role="option" aria-selected={index === pick} className="cx-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(index)}>
                    <b>{person.name}</b>
                    <small>{person.org}</small>
                  </button>
                ))}
        </div>
      ) : share && shareQuery !== "" ? (
        <div className="cx-menu cx-menu-empty">No {shareKind === "doc" ? "documents" : "deals"} match "{shareQuery}".</div>
      ) : null}

      {replyTo ? (
        <div className="cx-bar">
          <span>
            Replying to <b>{replyTo.senderName}</b>: {replyTo.body.slice(0, 80) || "a file"}
          </span>
          <button type="button" className="cx-tool" onClick={onClearReply}>
            Cancel
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="cx-bar">
          <span>Editing your message. Esc to cancel.</span>
          <button type="button" className="cx-tool" onClick={() => { setText(""); onClearEdit(); }}>
            Cancel
          </button>
        </div>
      ) : null}

      {refs.length > 0 || tray.length > 0 ? (
        <ul className="cx-tray">
          {refs.map((ref) => (
            <li key={ref.id} className="cx-chip">
              <span className="cx-ref-k">{ref.kind === "deal" ? "Deal" : "Document"}</span>
              <b>{ref.title}</b>
              <button type="button" aria-label={`Remove ${ref.title}`} onClick={() => setRefs((current) => current.filter((r) => r.id !== ref.id))}>
                <Icon name="x" small />
              </button>
            </li>
          ))}
          {tray.map((item) => (
            <li key={item.key} className={`cx-chip${item.status === "error" ? " cx-chip-err" : ""}`}>
              <b>{item.name}</b>
              <small>{item.status === "error" ? item.error : item.status === "uploading" ? `${Math.round(item.progress * 100)}%` : formatBytes(item.size)}</small>
              {item.status === "uploading" ? <i className="cx-prog" style={{ width: `${Math.round(item.progress * 100)}%` }} /> : null}
              <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeFromTray(item)}>
                <Icon name="x" small />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="cx-box">
        <input ref={picker} type="file" multiple accept={CHAT_ACCEPT} hidden onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        <button type="button" className="ibtn" aria-label="Attach files" data-hint="Attach files (or paste, or drop)" onClick={() => picker.current?.click()} disabled={Boolean(editing)}>
          <Icon name="clip" />
        </button>
        <label className="sr" htmlFor="cx-input">
          Message
        </label>
        <textarea
          id="cx-input"
          ref={area}
          rows={1}
          value={text}
          placeholder="Write a message"
          onChange={(event) => {
            setText(event.target.value);
            setCaret(event.target.selectionStart);
            if (event.target.value.trim() !== "" && !event.target.value.startsWith("/")) noteTyping();
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <button type="button" className="btn btn-p" onClick={() => void submit()} disabled={!hasContent || sending || uploading} aria-label={editing ? "Save edit" : "Send message"}>
          <Icon name="send" />
          {editing ? "Save" : "Send"}
        </button>
      </div>
      <div className="cx-foot" aria-live="polite">
        {notice ? <span className="cx-err">{notice}</span> : <span className="cx-hint">Enter to send, Shift+Enter for a new line. Type / for commands, @ to mention.</span>}
        {text.length > CHAT_MAX_BODY - 500 ? <span className={text.length > CHAT_MAX_BODY ? "cx-err" : ""}>{text.length}/{CHAT_MAX_BODY}</span> : null}
      </div>
    </div>
  );
});
