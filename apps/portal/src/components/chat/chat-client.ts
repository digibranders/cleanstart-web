import { createChatUploadAction, discardChatUploadAction } from "@/server/actions/chat";
import { checkChatFile } from "@/lib/chat";

/** GET a chat route. A non-2xx answer becomes an Error carrying the route's own safe sentence. */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...(signal ? { signal } : {}) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload ? String((payload as { error: unknown }).error) : "Something went wrong.";
    throw new Error(message);
  }
  return payload as T;
}

export interface UploadHandle {
  attachmentId: string;
  /** Aborts an upload in flight. */
  cancel: () => void;
}

/** PUTs the file straight to R2 with XMLHttpRequest, because fetch cannot report upload progress. */
function putToStorage(url: string, headers: Record<string, string>, file: File, onProgress: (fraction: number) => void, register: (xhr: XMLHttpRequest) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload was refused. Try again.")));
    xhr.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("cancelled"));
    xhr.send(file);
  });
}

/** Ticket from the server, then the direct upload. Resolves with the attachment id a send can claim. */
export async function uploadChatFile(
  conversationId: string,
  file: File,
  onProgress: (fraction: number) => void,
  register: (cancel: () => void) => void,
): Promise<string> {
  const verdict = checkChatFile(file, 0);
  if (!verdict.ok) throw new Error(verdict.message ?? "That file cannot be attached.");
  const ticket = await createChatUploadAction({ conversationId, name: file.name, size: file.size });
  if (!ticket.ok) throw new Error(ticket.error.message);
  try {
    await putToStorage(ticket.data.put.url, ticket.data.put.headers, file, onProgress, (xhr) => register(() => xhr.abort()));
  } catch (error) {
    await discardChatUploadAction({ attachmentId: ticket.data.attachmentId }).catch(() => undefined);
    throw error;
  }
  return ticket.data.attachmentId;
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** 14:05, in the viewer's own time zone. Only call after mount: the server has no idea what zone that is. */
export const clockLabel = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today", "Yesterday", then "12 Nov" (with the year when it is not this one). */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (sameDay(d, yesterday)) return "Yesterday";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`}`;
}

export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** The chat list's right hand label: the time today, otherwise the day. */
export const listLabel = (iso: string, now: Date = new Date()): string => (sameDay(new Date(iso), now) ? clockLabel(iso) : dayLabel(iso, now));
