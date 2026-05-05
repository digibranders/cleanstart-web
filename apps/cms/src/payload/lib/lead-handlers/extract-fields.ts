import type { FormFieldDef } from './validate-fields';

/**
 * Single source of truth for "what's the visitor's email / name?" used
 * across handlers (db-primary for duplicate detection, brevo for the
 * notification template, company-from-domain for enrichment input).
 *
 * Strategy:
 *   1. Walk the form definition. The first `type: 'email'` field with a
 *      string value wins for email; the first `type: 'text'` field
 *      whose name matches /name/i wins for name.
 *   2. If no `type: 'email'` field is configured (rare, but possible
 *      for a form designed by a careless editor), fall back to the
 *      first @-containing string in the visitor answers.
 *
 * Email is always lowercased for consistent comparison downstream.
 */

const NAME_KEY_RE = /name/i;
const EMAIL_RE = /@/;

const fieldEntries = (
  defs: FormFieldDef[] | null | undefined,
  values: Record<string, unknown>,
  type: 'email' | 'text',
): { name: string; value: string }[] => {
  if (!Array.isArray(defs)) return [];
  const out: { name: string; value: string }[] = [];
  for (const def of defs) {
    if (!def?.name || def.type !== type) continue;
    const raw = values[def.name];
    if (typeof raw !== 'string') continue;
    out.push({ name: def.name, value: raw });
  }
  return out;
};

export const extractEmail = (
  defs: FormFieldDef[] | null | undefined,
  values: Record<string, unknown>,
): string | null => {
  const typed = fieldEntries(defs, values, 'email');
  if (typed.length > 0 && typed[0]) {
    const first = typed[0].value.trim();
    if (first.length > 0) return first.toLowerCase();
  }
  for (const value of Object.values(values)) {
    if (typeof value === 'string' && EMAIL_RE.test(value)) {
      return value.trim().toLowerCase();
    }
  }
  return null;
};

export const extractName = (
  defs: FormFieldDef[] | null | undefined,
  values: Record<string, unknown>,
): string | null => {
  const typed = fieldEntries(defs, values, 'text');
  for (const entry of typed) {
    if (NAME_KEY_RE.test(entry.name) && entry.value.trim().length > 0) {
      return entry.value.trim();
    }
  }
  for (const [key, value] of Object.entries(values)) {
    if (NAME_KEY_RE.test(key) && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};
