/**
 * Per-@type version history for pageRegistry schema overrides.
 *
 * On each save we diff the previous override against the new (already filtered)
 * override, per Schema.org @type, and append one entry per changed type:
 * added / changed / removed, with a timestamp, the editor, and the block JSON
 * at that point. Stored newest-first in the row's `schemaHistory` array (capped)
 * so every block type carries its own timeline — shown in the editor's History
 * panel. Not rendered on the site.
 */

export type SchemaHistoryAction = 'added' | 'changed' | 'removed';

export interface SchemaHistoryEntry {
  /** ISO timestamp of the save. */
  at: string;
  /** Editor email, or null (e.g. seed / system). */
  by: string | null;
  /** The Schema.org @type this entry concerns. */
  type: string;
  action: SchemaHistoryAction;
  /** The block JSON after the change (null for 'removed'). */
  json: string | null;
}

export const HISTORY_CAP = 50;

const typeJsonMap = (override: unknown): Record<string, string> => {
  const blobs = Array.isArray(override) ? override : override != null ? [override] : [];
  const map: Record<string, string> = {};
  for (const b of blobs) {
    if (b != null && typeof b === 'object') {
      const raw = (b as { '@type'?: unknown })['@type'];
      const type =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw) && typeof raw[0] === 'string'
            ? raw[0]
            : null;
      if (type != null) map[type] = JSON.stringify(b);
    }
  }
  return map;
};

/** Per-@type diff of two override values → history entries (one per changed type). */
export const diffSchemaTypes = (
  prev: unknown,
  next: unknown,
  at: string,
  by: string | null,
): SchemaHistoryEntry[] => {
  const p = typeJsonMap(prev);
  const n = typeJsonMap(next);
  const types = new Set([...Object.keys(p), ...Object.keys(n)]);
  const out: SchemaHistoryEntry[] = [];
  for (const type of types) {
    if (n[type] != null && p[type] == null) {
      out.push({ at, by, type, action: 'added', json: n[type] });
    } else if (n[type] == null && p[type] != null) {
      out.push({ at, by, type, action: 'removed', json: null });
    } else if (n[type] !== p[type]) {
      out.push({ at, by, type, action: 'changed', json: n[type] ?? null });
    }
  }
  return out;
};

/** Prepend new entries (newest-first) and cap the list. */
export const appendHistory = (
  existing: readonly SchemaHistoryEntry[],
  entries: readonly SchemaHistoryEntry[],
  cap: number = HISTORY_CAP,
): SchemaHistoryEntry[] => [...entries, ...existing].slice(0, cap);

/** Group a flat history list by @type, preserving newest-first order. */
export const groupHistoryByType = (
  history: readonly SchemaHistoryEntry[],
): { type: string; entries: SchemaHistoryEntry[] }[] => {
  const order: string[] = [];
  const byType = new Map<string, SchemaHistoryEntry[]>();
  for (const e of history) {
    if (!byType.has(e.type)) {
      byType.set(e.type, []);
      order.push(e.type);
    }
    byType.get(e.type)?.push(e);
  }
  return order.map((type) => ({ type, entries: byType.get(type) ?? [] }));
};
