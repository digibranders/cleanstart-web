'use client';

import type { Where } from 'payload';

/**
 * Per-editor saved-views state for the custom list view (Wave 3).
 * Persisted under `users.preferences.savedViews[<collectionSlug>]`.
 *
 * The shape is intentionally loose — additive over time. New keys land
 * with optional defaults so old payloads keep loading.
 */

export type SavedView = {
  readonly id: string;
  readonly name: string;
  readonly columns?: ReadonlyArray<string>;
  readonly where?: Where;
  readonly sort?: string;
  readonly limit?: number;
};

export type SavedViewsState = {
  readonly active?: string;
  readonly views?: ReadonlyArray<SavedView>;
};

export type AllSavedViews = {
  readonly [collectionSlug: string]: SavedViewsState;
};

const PATCH_ENDPOINT = '/api/users';

/**
 * Read saved views for one collection from the server-issued `me` payload.
 * Callers pass the `useAuth().user.preferences` object — we don't fetch
 * here because the auth provider already has it.
 */
export const getSavedViews = (
  preferences: unknown,
  collectionSlug: string,
): SavedViewsState => {
  if (!preferences || typeof preferences !== 'object') return {};
  const root = (preferences as { savedViews?: AllSavedViews }).savedViews;
  if (!root || typeof root !== 'object') return {};
  return root[collectionSlug] ?? {};
};

/**
 * PATCH the current user's preferences. Merges shallow at the
 * `savedViews[collectionSlug]` slot so unrelated collections are
 * preserved.
 */
export const persistSavedViews = async (
  userId: number | string,
  currentPreferences: unknown,
  collectionSlug: string,
  next: SavedViewsState,
): Promise<void> => {
  const current = (
    currentPreferences && typeof currentPreferences === 'object'
      ? (currentPreferences as { savedViews?: AllSavedViews })
      : {}
  ).savedViews;
  const merged: AllSavedViews = { ...(current ?? {}), [collectionSlug]: next };
  const body = {
    preferences: {
      ...((currentPreferences && typeof currentPreferences === 'object'
        ? currentPreferences
        : {}) as Record<string, unknown>),
      savedViews: merged,
    },
  };
  await fetch(`${PATCH_ENDPOINT}/${userId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
};

const randomId = (): string => `v-${Math.random().toString(36).slice(2, 10)}`;

export const newSavedView = (input: Omit<SavedView, 'id'>): SavedView => ({
  id: randomId(),
  ...input,
});
