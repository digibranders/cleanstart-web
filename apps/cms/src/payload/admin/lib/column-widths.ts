'use client';

/**
 * Per-editor list-table column widths for the custom list view.
 * Persisted under `users.preferences.columnWidths[<collectionSlug>]` as a
 * map of column accessor → pixel width.
 *
 * Mirrors `saved-views.ts` deliberately: same `users.preferences` json
 * field, same PATCH `/api/users/{id}` shallow-merge strategy, read from
 * the auth provider's `me` payload (no extra fetch). Keeping the two in
 * lockstep means a single, well-understood persistence path for all
 * per-editor list state.
 */

export type ColumnWidths = { readonly [accessor: string]: number };

export type AllColumnWidths = {
  readonly [collectionSlug: string]: ColumnWidths;
};

const PATCH_ENDPOINT = '/api/users';

/** Hard floor / ceiling for a persisted width — a corrupt or hostile
 * preferences blob must never be able to wedge the table layout. */
const MIN_PERSISTED = 48;
const MAX_PERSISTED = 2000;

/**
 * Read + sanitise the column widths for one collection from the
 * server-issued `me` payload (`useAuth().user.preferences`). Only finite,
 * in-range numbers survive — anything else is dropped so a bad blob can't
 * poison the rendered widths.
 */
export const getColumnWidths = (
  preferences: unknown,
  collectionSlug: string,
): ColumnWidths => {
  if (!preferences || typeof preferences !== 'object') return {};
  const root = (preferences as { columnWidths?: unknown }).columnWidths;
  if (!root || typeof root !== 'object') return {};
  const slot = (root as Record<string, unknown>)[collectionSlug];
  if (!slot || typeof slot !== 'object') return {};
  const clean: Record<string, number> = {};
  for (const [accessor, value] of Object.entries(slot as Record<string, unknown>)) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= MIN_PERSISTED &&
      value <= MAX_PERSISTED
    ) {
      clean[accessor] = Math.round(value);
    }
  }
  return clean;
};

/**
 * PATCH the current user's preferences, replacing only the
 * `columnWidths[collectionSlug]` slot. Every other preference key
 * (savedViews, other collections' widths) is preserved by spreading the
 * caller's current `preferences` object.
 *
 * Fire-and-forget at the call site: a failed write must never block the
 * (already-applied) on-screen resize, so this resolves on network error
 * rather than rejecting.
 */
export const persistColumnWidths = async (
  userId: number | string,
  currentPreferences: unknown,
  collectionSlug: string,
  next: ColumnWidths,
): Promise<void> => {
  const base =
    currentPreferences && typeof currentPreferences === 'object'
      ? (currentPreferences as Record<string, unknown>)
      : {};
  const current = (base as { columnWidths?: AllColumnWidths }).columnWidths;
  const merged: AllColumnWidths = {
    ...(current ?? {}),
    [collectionSlug]: next,
  };
  try {
    await fetch(`${PATCH_ENDPOINT}/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preferences: { ...base, columnWidths: merged } }),
    });
  } catch {
    // Network/permission failure — the in-memory + on-screen width is
    // already applied; persistence is best-effort.
  }
};
