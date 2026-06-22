import type { CollectionBeforeChangeHook } from 'payload';

import { appendHistory, diffSchemaTypes, type SchemaHistoryEntry } from '../lib/jsonld/schema-history';

/**
 * beforeChange (pageRegistry): record per-@type override history. Diffs the
 * previous override against the new (already field-filtered) one and prepends
 * one entry per changed @type, with timestamp + editor. Always rebuilds from
 * `originalDoc.schemaHistory` so incoming `schemaHistory` can't be tampered.
 * Runs after the additionalSchema field hook (so `data.additionalSchema` is the
 * filtered, applied value).
 */
export const recordSchemaHistoryHook: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const prev = (originalDoc as { additionalSchema?: unknown } | undefined)?.additionalSchema ?? null;
  const next = (data as { additionalSchema?: unknown }).additionalSchema ?? null;
  const by = (req.user as { email?: string | null } | null | undefined)?.email ?? null;
  const entries = diffSchemaTypes(prev, next, new Date().toISOString(), by);

  const existing: SchemaHistoryEntry[] = Array.isArray(
    (originalDoc as { schemaHistory?: unknown } | undefined)?.schemaHistory,
  )
    ? ((originalDoc as { schemaHistory: SchemaHistoryEntry[] }).schemaHistory)
    : [];

  (data as { schemaHistory?: unknown }).schemaHistory =
    entries.length > 0 ? appendHistory(existing, entries) : existing;
  return data;
};
