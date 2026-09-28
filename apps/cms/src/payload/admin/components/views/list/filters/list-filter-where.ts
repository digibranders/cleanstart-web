import type { Where } from 'payload';

import type { ListFilterFieldConfig } from './list-filter-config';

type WhereValue = Where | null | undefined;

/** Selected option values per filter field name, e.g. `{ categories: ['1', '2'] }`. */
export type ListFilterSelections = Record<string, ReadonlyArray<string>>;

const conditionFieldName = (condition: Where): string | undefined => {
  const keys = Object.keys(condition);
  return keys.length === 1 ? keys[0] : undefined;
};

/** Flattens a Payload `where` value into its top-level `and[]` conditions (or its own keys, each as a one-key condition, when it isn't already an `and`). */
const toConditions = (where: WhereValue): Where[] => {
  if (!where || typeof where !== 'object') return [];
  if (Array.isArray(where.and)) return where.and;
  return Object.entries(where).map(([key, value]) => ({ [key]: value }) as Where);
};

/**
 * Reads this filter bar's current selections back out of the list view's
 * `where` clause — used to hydrate checkbox state on mount, and to stay in
 * sync when something else (Clear filters, Saved views) rewrites `where`.
 */
export const selectionsFromWhere = (
  where: WhereValue,
  fields: ReadonlyArray<ListFilterFieldConfig>,
): ListFilterSelections => {
  const conditions = toConditions(where);
  const selections: Record<string, ReadonlyArray<string>> = {};
  for (const field of fields) {
    const condition = conditions.find((c) => conditionFieldName(c) === field.name);
    const inValue = condition
      ? ((condition as Record<string, { in?: unknown[] }>)[field.name]?.in)
      : undefined;
    selections[field.name] = Array.isArray(inValue) ? inValue.map(String) : [];
  }
  return selections;
};

/**
 * Rebuilds the list view's `where` clause: keeps every existing condition
 * this filter bar doesn't own, and replaces its own fields' conditions with
 * the current selections. A field with no selections is simply omitted
 * (equivalent to "any").
 */
export const whereWithSelections = (
  currentWhere: WhereValue,
  fields: ReadonlyArray<ListFilterFieldConfig>,
  selections: ListFilterSelections,
): Where => {
  const managedNames = new Set(fields.map((f) => f.name));
  const kept = toConditions(currentWhere).filter((c) => {
    const name = conditionFieldName(c);
    return name === undefined || !managedNames.has(name);
  });
  const added: Where[] = [];
  for (const field of fields) {
    const values = selections[field.name] ?? [];
    if (values.length > 0) added.push({ [field.name]: { in: [...values] } } as Where);
  }
  const combined = [...kept, ...added];
  if (combined.length === 0) return {};
  if (combined.length === 1) return combined[0] as Where;
  return { and: combined };
};
