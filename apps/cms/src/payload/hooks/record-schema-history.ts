import type { CollectionBeforeChangeHook, FieldHook } from 'payload';

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

/**
 * Field-level beforeChange for a `schemaHistory` field that sits as a SIBLING
 * of an `additionalSchema` field (e.g. inside the shared `seo` group on every
 * content collection). Diffs the previous override (`previousSiblingDoc`) vs
 * the incoming one (`siblingData`) per @type and returns the appended history.
 *
 * Centralised on the field, so adding the field to the `seo` group enables
 * version history on every collection at once — no per-collection wiring.
 * Always rebuilds from `previousSiblingDoc.schemaHistory` so a tampered
 * incoming value can't poison the log.
 */
export const schemaHistoryFieldHook: FieldHook = ({ siblingData, previousSiblingDoc, req }) => {
  const prevSibling = previousSiblingDoc as
    | { additionalSchema?: unknown; schemaHistory?: unknown }
    | undefined;
  const prev = prevSibling?.additionalSchema ?? null;
  const next = (siblingData as { additionalSchema?: unknown } | undefined)?.additionalSchema ?? null;
  const by = (req?.user as { email?: string | null } | null | undefined)?.email ?? null;
  const entries = diffSchemaTypes(prev, next, new Date().toISOString(), by);

  const existing: SchemaHistoryEntry[] = Array.isArray(prevSibling?.schemaHistory)
    ? (prevSibling.schemaHistory as SchemaHistoryEntry[])
    : [];

  return entries.length > 0 ? appendHistory(existing, entries) : existing;
};
