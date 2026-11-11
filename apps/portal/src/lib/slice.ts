import { useSyncExternalStore } from "react";

const STORAGE_PREFIX = "cs-portal:v1:";
const resetters: Array<() => void> = [];

export interface Slice<T> {
  /** React hook: current value, re-renders on change. */
  use: () => T;
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  reset: () => void;
}

/**
 * A tiny persisted store for one collection of mock data.
 * The seed must be JSON-serialisable (no Date, Map, functions). State is kept in
 * localStorage so a walkthrough survives a reload; `resetAllSlices()` restores the seeds.
 */
export function createSlice<T>(key: string, seed: T): Slice<T> {
  let state: T = seed;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = (): void => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) state = JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`portal slice "${key}" could not be restored`, error);
    }
  };

  const emit = (): void => {
    for (const listener of listeners) listener();
  };

  const persist = (): void => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch (error) {
      console.warn(`portal slice "${key}" could not be saved`, error);
    }
  };

  const get = (): T => {
    load();
    return state;
  };

  const set = (next: T | ((prev: T) => T)): void => {
    load();
    state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
    persist();
    emit();
  };

  const reset = (): void => {
    state = seed;
    loaded = true;
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`portal slice "${key}" could not be cleared`, error);
    }
    emit();
  };

  resetters.push(reset);

  return {
    use: () =>
      useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        get,
        () => seed,
      ),
    get,
    set,
    reset,
  };
}

export function resetAllSlices(): void {
  for (const reset of resetters) reset();
}
