/**
 * Turns one Payload field value into a flat export cell, keyed off the
 * field's declared `type`. Shared by both the CSV and XLSX export
 * branches so there is one place that decides "what does a relationship
 * / richText / array field look like in a spreadsheet".
 *
 * Reuses the same formula-injection guard `lib/csv.ts` applies (a cell
 * starting with =, +, -, @ gets a leading single-quote) so the XLSX path
 * gets the same protection the existing CSV exports already have.
 */

import { lexicalToPlainText } from '../lexical/to-plain-text';

/** Never offered in the field picker, never honored server-side, even if
 * requested directly — defence in depth against visitor-PII leakage
 * through this generic path. See design doc "Decisions locked". */
export const EXPORT_FIELD_DENYLIST: readonly string[] = ['ip', 'userAgent'];

export const isExportableFieldName = (name: string): boolean =>
  !EXPORT_FIELD_DENYLIST.includes(name);

const FORMULA_TRIGGER = /^[\s ]*[=+\-@\t\r]/;

const neutraliseFormula = (raw: string): string =>
  FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;

const isRichTextValue = (value: unknown): value is { root: unknown } =>
  typeof value === 'object' && value !== null && 'root' in value;

const capitalizeFieldLabel = (key: string): string =>
  key.length === 0 ? key : `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

/**
 * `inferFieldType` can't distinguish a populated relationship/upload doc
 * from a plain sub-object row of a Payload `type: 'array'` field (e.g. a
 * `faqs` row — `{ id, question, answer }`) — both are "array of objects"
 * at the value-shape level, so both land in the relationship branch. A
 * plain row has none of the relationship-identifying fields below, so
 * summarize its own string/richText fields instead of falling back to the
 * (meaningless, to the reader) row id.
 */
const plainRowSummary = (doc: Record<string, unknown>): string => {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(doc)) {
    if (key === 'id') continue;
    if (typeof value === 'string') {
      if (value.length > 0) parts.push(`${capitalizeFieldLabel(key)}: ${value}`);
      continue;
    }
    if (isRichTextValue(value)) {
      const text = lexicalToPlainText(value);
      if (text.length > 0) parts.push(`${capitalizeFieldLabel(key)}: ${text}`);
    }
  }
  return parts.join(' ');
};

const relatedDocLabel = (doc: Record<string, unknown>): string => {
  if (typeof doc.title === 'string') return doc.title;
  if (typeof doc.name === 'string') return doc.name;
  if (typeof doc.slug === 'string') return doc.slug;
  // Upload/media docs (`heroImage`, `seo.ogImage`, `resources.asset`, …)
  // have no title/name/slug. Prefer the absolute R2 `url`
  // (`${R2_PUBLIC_BASE}/${prefix}/${filename}`, the same field the JSON-LD
  // engine reads — see lib/jsonld/shared.ts) so the export cell is a
  // usable image/asset link, falling back to the bare `filename`, then the
  // id. Without this a populated media relationship fell through to the
  // raw numeric id, so the cell read `367` instead of the image URL.
  if (typeof doc.url === 'string') return doc.url;
  if (typeof doc.filename === 'string') return doc.filename;
  const summary = plainRowSummary(doc);
  if (summary.length > 0) return summary;
  return doc.id != null ? String(doc.id) : '';
};

export const serializeFieldValue = (fieldType: string, value: unknown): string => {
  if (value == null) return '';

  if (fieldType === 'richText') return neutraliseFormula(lexicalToPlainText(value));

  if (fieldType === 'relationship' || fieldType === 'upload') {
    if (Array.isArray(value)) {
      return neutraliseFormula(
        value
          .map((v) =>
            typeof v === 'object' && v !== null ? relatedDocLabel(v as Record<string, unknown>) : String(v),
          )
          .join('; '),
      );
    }
    if (typeof value === 'object') return neutraliseFormula(relatedDocLabel(value as Record<string, unknown>));
    return neutraliseFormula(String(value));
  }

  if (fieldType === 'array' || fieldType === 'group' || fieldType === 'blocks') {
    try {
      return neutraliseFormula(JSON.stringify(value));
    } catch {
      return neutraliseFormula(String(value));
    }
  }

  return neutraliseFormula(String(value));
};
