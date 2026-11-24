// Messages: the rules and shapes shared by the server, the polling routes and the chat screens. No data access here.

export const CHAT_KINDS = ['direct', 'group'] as const;
export type ChatKind = (typeof CHAT_KINDS)[number];

export const CHAT_MESSAGE_KINDS = ['text', 'system'] as const;
export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[number];

export const CHAT_MEMBER_ROLES = ['owner', 'member'] as const;
export type ChatMemberRole = (typeof CHAT_MEMBER_ROLES)[number];

export const CHAT_REF_KINDS = ['deal', 'doc'] as const;
export type ChatRefKind = (typeof CHAT_REF_KINDS)[number];

export const CHAT_MAX_BODY = 4000;
export const CHAT_MAX_TITLE = 80;
export const CHAT_MAX_MEMBERS = 50;
export const CHAT_MAX_FILES = 10;
export const CHAT_FILE_MAX_BYTES = 25 * 1024 * 1024;
/** What one partner company may keep in chat files in total. Staff only chats are not capped. */
export const CHAT_PARTNER_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;
export const CHAT_EDIT_WINDOW_MINUTES = 15;
export const CHAT_PAGE_SIZE = 40;
/** A typing line older than this is gone; a presence line older than this means offline. */
export const CHAT_TYPING_SECONDS = 6;
export const CHAT_ONLINE_SECONDS = 60;
export const CHAT_DIGEST_AFTER_MINUTES = 15;

export const CHAT_POLL_THREAD_MS = 3000;
export const CHAT_POLL_THREAD_HIDDEN_MS = 20000;
export const CHAT_POLL_INBOX_MS = 20000;

/** Reactions are a fixed set (no emoji picker dependency). The key is stored, the glyph is shown. */
export const CHAT_REACTIONS = [
  { key: 'thumbs_up', glyph: '\u{1F44D}', label: 'Thumbs up' },
  { key: 'check', glyph: '✅', label: 'Done' },
  { key: 'heart', glyph: '❤️', label: 'Heart' },
  { key: 'party', glyph: '\u{1F389}', label: 'Celebrate' },
  { key: 'laugh', glyph: '\u{1F602}', label: 'Laugh' },
  { key: 'thanks', glyph: '\u{1F64F}', label: 'Thanks' },
] as const;
export const CHAT_REACTION_KEYS = CHAT_REACTIONS.map((reaction) => reaction.key) as [string, ...string[]];
export const reactionGlyph = (key: string): string => CHAT_REACTIONS.find((reaction) => reaction.key === key)?.glyph ?? key;

/**
 * Allow list for chat attachments. The server decides the content type from the extension; the browser's File.type is never trusted.
 * No SVG, HTML, scripts or executables: those can run in a viewer's browser or machine.
 */
export const CHAT_FILE_TYPES: ReadonlyArray<{ ext: string; mime: string; label: string; image?: true }> = [
  { ext: 'png', mime: 'image/png', label: 'PNG', image: true },
  { ext: 'jpg', mime: 'image/jpeg', label: 'JPG', image: true },
  { ext: 'jpeg', mime: 'image/jpeg', label: 'JPG', image: true },
  { ext: 'gif', mime: 'image/gif', label: 'GIF', image: true },
  { ext: 'webp', mime: 'image/webp', label: 'WEBP', image: true },
  { ext: 'pdf', mime: 'application/pdf', label: 'PDF' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX' },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PPTX' },
  { ext: 'csv', mime: 'text/csv', label: 'CSV' },
  { ext: 'txt', mime: 'text/plain', label: 'TXT' },
  { ext: 'md', mime: 'text/markdown', label: 'MD' },
  { ext: 'json', mime: 'application/json', label: 'JSON' },
  { ext: 'zip', mime: 'application/zip', label: 'ZIP' },
  { ext: 'mp4', mime: 'video/mp4', label: 'MP4' },
  { ext: 'mov', mime: 'video/quicktime', label: 'MOV' },
  { ext: 'mp3', mime: 'audio/mpeg', label: 'MP3' },
  { ext: 'm4a', mime: 'audio/mp4', label: 'M4A' },
  { ext: 'wav', mime: 'audio/wav', label: 'WAV' },
];

/** Value for the `accept` attribute of the attach button. */
export const CHAT_ACCEPT = CHAT_FILE_TYPES.map((type) => `.${type.ext}`).join(',');

const baseName = (name: string): string => name.split(/[\\/]/).pop() ?? '';

export function chatExtension(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

export function chatMimeFor(name: string): string | null {
  const ext = chatExtension(name);
  return CHAT_FILE_TYPES.find((type) => type.ext === ext)?.mime ?? null;
}

export const isChatImage = (mime: string): boolean => CHAT_FILE_TYPES.some((type) => type.mime === mime && type.image === true);
export const isChatPdf = (mime: string): boolean => mime === 'application/pdf';

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : (Math.round(megabytes * 10) / 10).toFixed(1)} MB`;
}

export interface ChatFileCheck {
  ok: boolean;
  /** A sentence for the person, shown under the composer. */
  message: string | null;
}

/** The same rules the server applies at ticket time, so the browser can refuse early. */
export function checkChatFile(file: { name: string; size: number }, alreadyAttached: number): ChatFileCheck {
  if (alreadyAttached >= CHAT_MAX_FILES) return { ok: false, message: `Attach up to ${CHAT_MAX_FILES} files per message.` };
  if (file.size <= 0) return { ok: false, message: `${file.name} is empty.` };
  if (file.size > CHAT_FILE_MAX_BYTES) return { ok: false, message: `${file.name} is ${formatBytes(file.size)}. Files can be up to ${formatBytes(CHAT_FILE_MAX_BYTES)}.` };
  if (chatMimeFor(file.name) === null) return { ok: false, message: `${file.name} is not a supported type. Images, PDF, Office files, CSV, text, ZIP, MP4, MOV and audio are allowed.` };
  return { ok: true, message: null };
}

export interface SlashCommand {
  name: string;
  /** What to type after the name, shown in the menu. Empty when the command takes nothing. */
  args: string;
  summary: string;
}

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  { name: 'deal', args: 'customer', summary: 'Share a deal as a card' },
  { name: 'doc', args: 'title', summary: 'Share a library document as a card' },
  { name: 'pin', args: '', summary: 'Pin the message you are replying to' },
  { name: 'mute', args: '1h, 8h, week or off', summary: 'Silence this chat for a while' },
  { name: 'unmute', args: '', summary: 'Hear from this chat again' },
  { name: 'search', args: 'words', summary: 'Search all your chats' },
  { name: 'shrug', args: 'message', summary: 'Add a shrug to your message' },
  { name: 'help', args: '', summary: 'List the slash commands' },
];

export interface ParsedSlash {
  name: string;
  args: string;
}

/** "/deal vardhan" is { name: 'deal', args: 'vardhan' }. Anything that is not a known command is plain text, so a pasted path is never eaten. */
export function parseSlash(text: string): ParsedSlash | null {
  const match = /^\/([a-z]+)(?:\s+([\s\S]*))?$/.exec(text.trim());
  if (!match) return null;
  const name = match[1] ?? '';
  if (!SLASH_COMMANDS.some((command) => command.name === name)) return null;
  return { name, args: (match[2] ?? '').trim() };
}

/** The commands whose name starts with what is typed after the slash, for the menu above the composer. */
export function matchSlash(typed: string): readonly SlashCommand[] {
  const m = /^\/([a-z]*)$/.exec(typed);
  if (!m) return [];
  const prefix = m[1] ?? '';
  return SLASH_COMMANDS.filter((command) => command.name.startsWith(prefix));
}

export const MUTE_CHOICES = ['1h', '8h', 'week', 'forever', 'off'] as const;
export type MuteChoice = (typeof MUTE_CHOICES)[number];

/** When a mute ends, or null for "off". 'forever' is far enough away to never matter. */
export function muteUntil(choice: MuteChoice, now: Date): Date | null {
  const hours = { '1h': 1, '8h': 8, week: 24 * 7, forever: 24 * 365 * 50 } as const;
  if (choice === 'off') return null;
  return new Date(now.getTime() + hours[choice] * 3_600_000);
}

export type TickState = 'sending' | 'sent' | 'delivered' | 'seen';

export interface Cursor {
  lastReadSeq: number;
  lastDeliveredSeq: number;
}

/** One tick when stored, two grey when every other member's device has it, two accent when every other member has read it. */
export function tickState(seq: number, others: readonly Cursor[]): TickState {
  if (others.length === 0) return 'sent';
  if (others.every((other) => other.lastReadSeq >= seq)) return 'seen';
  if (others.every((other) => Math.max(other.lastDeliveredSeq, other.lastReadSeq) >= seq)) return 'delivered';
  return 'sent';
}

export const canEditUntil = (createdAtIso: string): Date => new Date(new Date(createdAtIso).getTime() + CHAT_EDIT_WINDOW_MINUTES * 60_000);

/** Single line for the chat list and for emails. */
export function previewOf(input: { body: string; attachments: number; senderFirstName: string | null; refKind?: ChatRefKind | null }): string {
  const text = input.body.replace(/\s+/g, ' ').trim();
  const core =
    text !== ''
      ? text
      : input.refKind === 'deal'
        ? 'Shared a deal'
        : input.refKind === 'doc'
          ? 'Shared a document'
          : input.attachments > 0
            ? input.attachments === 1
              ? 'Sent a file'
              : `Sent ${input.attachments} files`
            : '';
  const clipped = core.length > 120 ? `${core.slice(0, 117)}...` : core;
  return input.senderFirstName ? `${input.senderFirstName}: ${clipped}` : clipped;
}

export interface Segment {
  kind: 'text' | 'link' | 'code' | 'mention';
  text: string;
  href?: string;
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/g;

/** Splits a message body into text, links, inline code and @mentions for rendering without innerHTML. */
export function segmentBody(body: string, mentionNames: readonly string[]): Segment[] {
  const out: Segment[] = [];
  const names = [...mentionNames].filter((n) => n !== '').sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const mentionPart = escaped.length > 0 ? `|@(?:${escaped.join('|')})(?![\\p{L}\\p{N}])` : '';
  const re = new RegExp(`(\`[^\`\\n]+\`)|(https?:\\/\\/[^\\s<>"')\\]]+[^\\s<>"')\\].,;:!?])${mentionPart ? `|(${mentionPart.slice(1)})` : ''}`, 'gu');
  let cursor = 0;
  for (const match of body.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > cursor) out.push({ kind: 'text', text: body.slice(cursor, index) });
    if (match[1]) out.push({ kind: 'code', text: match[1].slice(1, -1) });
    else if (match[2]) out.push({ kind: 'link', text: match[2], href: match[2] });
    else if (match[3]) out.push({ kind: 'mention', text: match[3] });
    cursor = index + match[0].length;
  }
  if (cursor < body.length) out.push({ kind: 'text', text: body.slice(cursor) });
  return out;
}

export { URL_RE as CHAT_URL_RE };

export interface ChatRefDto {
  kind: ChatRefKind;
  id: string;
  /** Null when the reader may not open it: the card then says so instead of leaking a name. */
  title: string | null;
  sub: string | null;
  href: string | null;
}

export interface ChatAttachmentDto {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** `/api/chat/files/<id>`; the route checks membership every time. */
  url: string;
  deleted: boolean;
}

export interface ChatReactionDto {
  key: string;
  count: number;
  mine: boolean;
  names: string[];
}

export interface ChatMessageDto {
  id: string;
  seq: number;
  rev: number;
  kind: ChatMessageKind;
  senderId: string | null;
  senderName: string;
  senderOrg: string;
  body: string;
  replyTo: { id: string; senderName: string; excerpt: string } | null;
  mentions: string[];
  refs: ChatRefDto[];
  attachments: ChatAttachmentDto[];
  reactions: ChatReactionDto[];
  pinned: boolean;
  editedAt: string | null;
  deleted: boolean;
  createdAt: string;
}

export interface ChatMemberDto {
  userId: string;
  name: string;
  org: string;
  role: ChatMemberRole;
  isStaff: boolean;
  online: boolean;
  lastReadSeq: number;
  lastDeliveredSeq: number;
  left: boolean;
}

export interface ChatConversationDto {
  id: string;
  kind: ChatKind;
  /** For a direct chat: the other person's name. */
  title: string;
  subtitle: string | null;
  partnerId: string | null;
  members: ChatMemberDto[];
  unread: number;
  muted: boolean;
  mutedUntil: string | null;
  lastPreview: string | null;
  lastMessageAt: string | null;
  lastMsgSeq: number;
  rev: number;
  /** Whether the viewer may rename or change the members of this group. */
  canManage: boolean;
}

export interface ChatPollDto {
  rev: number;
  lastMsgSeq: number;
  messages: ChatMessageDto[];
  members: Array<Pick<ChatMemberDto, 'userId' | 'online' | 'lastReadSeq' | 'lastDeliveredSeq' | 'left'>>;
  typing: Array<{ userId: string; name: string }>;
  pinnedIds: string[];
}

export interface ChatInboxDto {
  conversations: ChatConversationDto[];
  unreadTotal: number;
}

export interface ChatPersonDto {
  id: string;
  name: string;
  org: string;
  role: string;
  isStaff: boolean;
}
