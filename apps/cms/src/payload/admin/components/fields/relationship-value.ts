// =============================================================================
// Stored-value normalisation for the custom RelationshipField.
//
// Payload accepts several shapes for a relationship value — single id, array
// of ids, polymorphic { relationTo, value }, or array of those. Internally the
// field reduces everything to a stable list of `EntryRef`s (string ids, so
// React keys + equality checks are type-stable) and writes back in the same
// shape it received.
//
// CRITICAL — id type on write-back: Payload validates each relationship value
// against the *target collection's id type* (`isValidID`). Number-PK
// collections (Postgres `serial`, which is every collection in this CMS)
// require a numeric value; a string `"7"` fails validation with
// "invalid relationships: 7 0". Because we stringify ids internally, we must
// restore the native numeric type on write-back — see `toIdValue`.
//
// Kept framework-free (no React / 'use client') so the value logic is unit
// testable in isolation from the presentation component.
// =============================================================================

export type EntryRef = { id: string; relationTo: string };

export type StoredValue =
  | string
  | number
  | { relationTo: string; value: string | number }
  | ReadonlyArray<string | number | { relationTo: string; value: string | number }>
  | null
  | undefined;

export const normalise = (
  raw: StoredValue,
  fallbackRelationTo: string,
): ReadonlyArray<EntryRef> => {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: EntryRef[] = [];
  for (const item of list) {
    if (item == null) continue;
    if (typeof item === 'string' || typeof item === 'number') {
      out.push({ id: String(item), relationTo: fallbackRelationTo });
    } else if (typeof item === 'object' && 'relationTo' in item && 'value' in item) {
      out.push({ id: String(item.value), relationTo: item.relationTo });
    }
  }
  return out;
};

/**
 * Restore a relationship id's native runtime type for write-back.
 *
 * Ids are stringified internally for stable keys/equality, but Payload's
 * relationship validation is type-sensitive: number-PK collections reject a
 * string id, text/uuid-PK collections reject a number. A lossless round-trip
 * guard (`String(Number(id)) === id`) converts canonical non-negative integer
 * strings (`"7"` → `7`) while leaving uuids, slugs, and zero-padded or
 * fractional strings (`"007"`, `"7.0"`, `"1e3"`, `"550e8400-…"`) untouched.
 */
export const toIdValue = (id: string): string | number => {
  const n = Number(id);
  return Number.isInteger(n) && n >= 0 && String(n) === id ? n : id;
};

export const toStored = (
  entries: ReadonlyArray<EntryRef>,
  relationTo: string | string[],
  hasMany: boolean,
): StoredValue => {
  const polymorphic = Array.isArray(relationTo);
  const mapped = entries.map((e) =>
    polymorphic ? { relationTo: e.relationTo, value: toIdValue(e.id) } : toIdValue(e.id),
  );
  if (hasMany) return mapped;
  return mapped[0] ?? null;
};
