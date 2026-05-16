'use client';

/**
 * Shared status of the currently-edited document's slug field.
 *
 * `SlugField` is the sole writer (it owns the debounced collision lookup
 * and live-normalisation); `SlugRequirementGuard` is the reader (it
 * toggles the disabled state of the document Save Draft + Publish
 * buttons). A module-level pub-sub avoids React Context plumbing inside
 * Payload's view shell — both components mount independently in the
 * admin view tree, so they cannot share state through props.
 */

export type SlugStatusKind =
  | 'idle'
  | 'empty'
  | 'checking'
  | 'available'
  | 'collision'
  | 'invalid';

export type SlugStatus = {
  readonly kind: SlugStatusKind;
  readonly detail?: string;
};

type Listener = (status: SlugStatus) => void;

const IDLE: SlugStatus = { kind: 'idle' };

let current: SlugStatus = IDLE;
const listeners = new Set<Listener>();

export const getSlugStatus = (): SlugStatus => current;

export const setSlugStatus = (next: SlugStatus): void => {
  if (next.kind === current.kind && next.detail === current.detail) return;
  current = next;
  for (const fn of listeners) fn(current);
};

export const subscribeSlugStatus = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/**
 * Reset to idle on route change. Listener attached lazily so server
 * bundles don't reach for `window`. Called by `SlugField` on mount —
 * once per edit-view lifecycle — which is enough to clear stale state
 * left over from a previous document in the same SPA session.
 */
export const resetSlugStatus = (): void => {
  if (current.kind === 'idle') return;
  current = IDLE;
  for (const fn of listeners) fn(current);
};
