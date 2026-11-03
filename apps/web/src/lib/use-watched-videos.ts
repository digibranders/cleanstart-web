"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "cs:watched-videos";
const CHANGE_EVENT = "cs:watched-videos-change";
const MAX_REMEMBERED = 200;

// useSyncExternalStore compares snapshots by identity, so keep one frozen
// array per distinct stored value instead of parsing a fresh one every read.
const EMPTY: readonly string[] = Object.freeze([]);
let cachedRaw: string | null = null;
let cachedIds: readonly string[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function snapshot(): readonly string[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedIds = Array.isArray(parsed)
      ? Object.freeze(parsed.filter((v): v is string => typeof v === "string"))
      : EMPTY;
  } catch {
    cachedIds = EMPTY;
  }
  return cachedIds;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Videos this browser has started, remembered in localStorage. It is a
 * convenience, never state that matters: private windows and blocked storage
 * simply leave every video unmarked.
 */
export function useWatchedVideos(): {
  readonly watched: ReadonlySet<string>;
  readonly markWatched: (id: string) => void;
} {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  const markWatched = useCallback((id: string): void => {
    const current = snapshot();
    if (current.includes(id)) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([id, ...current].slice(0, MAX_REMEMBERED)),
      );
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Storage unavailable: nothing to remember, nothing to report.
    }
  }, []);

  return { watched: new Set(ids), markWatched };
}
