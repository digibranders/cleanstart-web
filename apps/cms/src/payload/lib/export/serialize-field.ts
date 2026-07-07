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
};

const relatedDocLabel = (doc: RelatedDocShape): string => {
  if (typeof doc.title === 'string') return doc.title;
  if (typeof doc.name === 'string') return doc.name;
  if (typeof doc.slug === 'string') return doc.slug;
  return doc.id != null ? String(doc.id) : '';
};

const lexicalNodeToText = (node: unknown): string => {
  if (node == null || typeof node !== 'object') return '';
  const n = node as { type?: string; text?: string; children?: unknown[] };
  if (n.type === 'text' && typeof n.text === 'string') return n.text;
  if (Array.isArray(n.children)) return n.children.map(lexicalNodeToText).join('');
  return '';
};

const lexicalToPlainText = (value: unknown): string => {
  const root = (value as { root?: { children?: unknown[] } } | null)?.root;
  if (!root || !Array.isArray(root.children)) return '';
  return root.children
    .map(lexicalNodeToText)
    .filter((s) => s.length > 0)
    .join(' ')
    .trim();
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
