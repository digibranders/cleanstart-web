"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { Icon } from "@/components/icon";
import {
  type ChatAttachmentDto,
  type ChatMessageDto,
  CHAT_REACTIONS,
  canEditUntil,
  formatBytes,
  isChatImage,
  isChatPdf,
  reactionGlyph,
  segmentBody,
  type TickState,
} from "@/lib/chat";
import { initialsOf } from "@/lib/initials";
import { clockLabel } from "./chat-client";

export function Ticks({ state, title }: { state: TickState; title: string }): React.JSX.Element {
  const double = state === "delivered" || state === "seen";
  return (
    <span className={`cx-ticks cx-ticks-${state}`} role="img" aria-label={title} data-hint={title}>
      <Icon name="check" small />
      {double ? <Icon name="check" small /> : null}
    </span>
  );
}

function AttachmentView({ file }: { file: ChatAttachmentDto }): React.JSX.Element {
  if (file.deleted) return <span className="cx-file cx-file-gone">File removed</span>;
  if (isChatImage(file.mime)) {
    return (
      <a className="cx-img" href={file.url} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.url} alt={file.name} loading="lazy" decoding="async" />
      </a>
    );
  }
  const kind = isChatPdf(file.mime) ? "PDF" : (file.name.split(".").pop() ?? "file").toUpperCase().slice(0, 4);
  return (
    <a className="cx-file" href={file.url} {...(isChatPdf(file.mime) ? { target: "_blank", rel: "noreferrer" } : { download: file.name })}>
      <span className="cx-file-kind">{kind}</span>
      <span className="cx-file-t">
        <b>{file.name}</b>
        <small>{formatBytes(file.size)}</small>
      </span>
      <Icon name="dl" />
    </a>
  );
}

function Body({ body, mentions }: { body: string; mentions: readonly string[] }): React.JSX.Element {
  return (
    <p className="cx-text">
      {segmentBody(body, mentions).map((segment, index) => {
        const key = `${index}-${segment.kind}`;
        if (segment.kind === "link") {
          return (
            <a key={key} href={segment.href} target="_blank" rel="noopener noreferrer nofollow">
              {segment.text}
            </a>
          );
        }
        if (segment.kind === "code") return <code key={key}>{segment.text}</code>;
        if (segment.kind === "mention") return <mark key={key}>{segment.text}</mark>;
        return <span key={key}>{segment.text}</span>;
      })}
    </p>
  );
}

export interface MessageActions {
  react: (message: ChatMessageDto, emoji: string) => void;
  reply: (message: ChatMessageDto) => void;
  pin: (message: ChatMessageDto) => void;
  edit: (message: ChatMessageDto) => void;
  remove: (message: ChatMessageDto) => void;
  jumpTo: (messageId: string) => void;
}

interface MessageProps {
  message: ChatMessageDto;
  mine: boolean;
  /** First of a run from one sender: shows the name (in groups) and the avatar. */
  head: boolean;
  showName: boolean;
  tick: TickState;
  tickTitle: string;
  actions: MessageActions;
  highlighted: boolean;
}

function MessageViewBase({ message, mine, head, showName, tick, tickTitle, actions, highlighted }: MessageProps): React.JSX.Element {
  const [palette, setPalette] = useState(false);
  const [tools, setTools] = useState(false);
  if (message.kind === "system") {
    return (
      <div className="cx-system" id={`m-${message.id}`}>
        <span>{message.body}</span>
      </div>
    );
  }
  const editable = mine && !message.deleted && Date.now() < canEditUntil(message.createdAt).getTime();
  return (
    <div className={`cx-msg${mine ? " cx-mine" : ""}${head ? " cx-head" : ""}${highlighted ? " cx-hl" : ""}`} id={`m-${message.id}`} data-open={tools ? "1" : undefined}>
      {!mine && head ? (
        <span className="cx-av" aria-hidden="true" data-staff={message.senderOrg === "CleanStart" ? "1" : undefined}>
          {initialsOf(message.senderName)}
        </span>
      ) : (
        <span className="cx-av-gap" />
      )}
      <div className="cx-col">
        {showName && head && !mine ? (
          <span className="cx-name">
            {message.senderName} <small>{message.senderOrg}</small>
          </span>
        ) : null}
        <div className={`cx-bubble${message.deleted ? " cx-deleted" : ""}`}>
          {message.replyTo ? (
            <button type="button" className="cx-quote" onClick={() => actions.jumpTo(message.replyTo?.id ?? "")}>
              <b>{message.replyTo.senderName}</b>
              <span>{message.replyTo.excerpt}</span>
            </button>
          ) : null}
          {message.deleted ? <p className="cx-text">This message was deleted.</p> : null}
          {!message.deleted && message.body !== "" ? <Body body={message.body} mentions={message.mentions} /> : null}
          {message.refs.map((ref) =>
            ref.title === null || ref.href === null ? (
              <div key={`${ref.kind}-${ref.id}`} className="cx-ref cx-ref-off">
                <span className="cx-ref-k">{ref.kind === "deal" ? "Deal" : "Document"}</span>
                <b>Not available to you</b>
              </div>
            ) : (
              <Link key={`${ref.kind}-${ref.id}`} href={ref.href} className="cx-ref">
                <span className="cx-ref-k">{ref.kind === "deal" ? "Deal" : "Document"}</span>
                <b>{ref.title}</b>
                {ref.sub ? <small>{ref.sub}</small> : null}
              </Link>
            ),
          )}
          {message.attachments.length > 0 ? (
            <div className="cx-files">
              {message.attachments.map((file) => (
                <AttachmentView key={file.id} file={file} />
              ))}
            </div>
          ) : null}
          <span className="cx-meta">
            {message.pinned ? <span className="cx-pinned">Pinned</span> : null}
            {message.editedAt ? <span>edited</span> : null}
            <time dateTime={message.createdAt} suppressHydrationWarning>
              {clockLabel(message.createdAt)}
            </time>
            {mine && !message.deleted ? <Ticks state={tick} title={tickTitle} /> : null}
            {!message.deleted ? (
              <button type="button" className="cx-more" aria-label="Message actions" aria-expanded={tools} onClick={() => setTools((open) => !open)}>
                <Icon name="more" small />
              </button>
            ) : null}
          </span>
        </div>
        {message.reactions.length > 0 ? (
          <div className="cx-reacts">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.key}
                type="button"
                className={`cx-react${reaction.mine ? " cx-react-on" : ""}`}
                aria-pressed={reaction.mine}
                aria-label={`${reaction.count} ${reaction.key.replace("_", " ")}: ${reaction.names.join(", ")}`}
                data-hint={reaction.names.join(", ")}
                onClick={() => actions.react(message, reaction.key)}
              >
                <span aria-hidden="true">{reactionGlyph(reaction.key)}</span>
                {reaction.count}
              </button>
            ))}
          </div>
        ) : null}
        {!message.deleted ? (
          <div className="cx-tools" role="toolbar" aria-label="Message actions">
            <button type="button" className="cx-tool" aria-expanded={palette} onClick={() => setPalette((p) => !p)}>
              React
            </button>
            <button type="button" className="cx-tool" onClick={() => actions.reply(message)}>
              Reply
            </button>
            <button type="button" className="cx-tool" onClick={() => actions.pin(message)}>
              {message.pinned ? "Unpin" : "Pin"}
            </button>
            {editable ? (
              <button type="button" className="cx-tool" onClick={() => actions.edit(message)}>
                Edit
              </button>
            ) : null}
            {mine ? (
              <button type="button" className="cx-tool cx-tool-d" onClick={() => actions.remove(message)}>
                Delete
              </button>
            ) : null}
            {palette ? (
              <span className="cx-palette" role="group" aria-label="Pick a reaction">
                {CHAT_REACTIONS.map((reaction) => (
                  <button
                    key={reaction.key}
                    type="button"
                    className="cx-emoji"
                    aria-label={reaction.label}
                    onClick={() => {
                      setPalette(false);
                      actions.react(message, reaction.key);
                    }}
                  >
                    {reaction.glyph}
                  </button>
                ))}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const MessageView = memo(MessageViewBase);
