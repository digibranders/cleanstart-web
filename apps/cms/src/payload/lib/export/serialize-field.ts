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

type RelatedDocShape = {
  id?: string | number;
  title?: unknown;
  name?: unknown;
  slug?: unknown;
  url?: unknown;
  filename?: unknown;
};

const relatedDocLabel = (doc: RelatedDocShape): string => {
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
  return doc.id != null ? String(doc.id) : '';
};

export const serializeFieldValue = (fieldType: string, value: unknown): string => {
  if (value == null) return '';

  if (fieldType === 'richText') return neutraliseFormula(lexicalToPlainText(value));

  if (fieldType === 'relationship' || fieldType === 'upload') {
    if (Array.isArray(value)) {
      return neutraliseFormula(
        value
          .map((v) => (typeof v === 'object' && v !== null ? relatedDocLabel(v as RelatedDocShape) : String(v)))
          .join('; '),
      );
    }
    if (typeof value === 'object') return neutraliseFormula(relatedDocLabel(value as RelatedDocShape));
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
