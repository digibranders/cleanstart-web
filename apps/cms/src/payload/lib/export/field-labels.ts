/**
 * Human-readable header labels for the generic collection export. The export
 * endpoint receives field *names* (`partnerName`, `prospectEmail`, …) and,
 * before this, wrote them verbatim as CSV/XLSX column headers — so an editor
 * opening the file saw variable-looking names. These helpers turn a field
 * name into its display label: an explicit `label` from the collection config
 * when present, otherwise a humanised version of the name.
 */

import type { Field } from 'payload';

/** Synthetic export column with no backing field config. */
const SYNTHETIC_LABELS: Readonly<Record<string, string>> = {
  __schemaTypes: 'Schema Types',
};

/**
 * `partnerRepFirstName` → `Partner Rep First Name`,
 * `consent-given-at` → `Consent Given At`, `__schemaTypes` → `Schema Types`.
 */
export const humanizeFieldName = (name: string): string =>
  name
    .replace(/^__/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const stringLabel = (label: unknown): string | undefined => {
  if (typeof label === 'string') return label;
  if (label && typeof label === 'object' && 'en' in (label as Record<string, unknown>)) {
    const en = (label as Record<string, unknown>).en;
    if (typeof en === 'string') return en;
  }
  return undefined;
};

/**
 * Walk a collection's field tree (recursing into groups/rows/tabs) and index
 * every named field's explicit string label by field name. Unlabeled fields
 * are omitted so the caller can fall back to humanising the name.
 */
export const collectFieldLabels = (
  fields: readonly Field[] | undefined,
  map: Map<string, string> = new Map(),
): Map<string, string> => {
  for (const field of fields ?? []) {
    if ('name' in field && typeof field.name === 'string') {
      const label = stringLabel((field as { label?: unknown }).label);
      if (label && !map.has(field.name)) map.set(field.name, label);
    }
    const nested = (field as { fields?: readonly Field[] }).fields;
    if (Array.isArray(nested)) collectFieldLabels(nested, map);
    const tabs = (field as { tabs?: { fields?: readonly Field[] }[] }).tabs;
    if (Array.isArray(tabs)) {
      for (const tab of tabs) collectFieldLabels(tab.fields, map);
    }
  }
  return map;
};

/** Resolve one export field name to its header label. */
export const exportHeaderLabel = (name: string, labelMap: Map<string, string>): string =>
  SYNTHETIC_LABELS[name] ?? labelMap.get(name) ?? humanizeFieldName(name);
