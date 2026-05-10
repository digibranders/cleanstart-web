/**
 * Identify which keys inside a lead's `fields` JSON hold PII and need to
 * be nulled at retention time. Two sources of truth:
 *
 *   1. The form definition — any field of type `email` is treated as PII.
 *      The Forms schema does not have a dedicated `phone` type today, so
 *      phone-bearing fields show up as `text`.
 *   2. A name-based heuristic — covers phone-bearing text fields and any
 *      field whose machine name implies email. Runs even when the form
 *      definition is stale or unavailable (e.g. the form was deleted but
 *      old lead rows still reference it).
 */

const PHONE_NAME = /^(phone|tel|mobile|cell|whatsapp|fax)/i;
const EMAIL_NAME = /(^|_|-)e?mail(_|-|$)/i;

export interface FormFieldDefForRedaction {
  readonly name?: string | null;
  readonly type?: string | null;
}

export const piiKeysForForm = (
  fields: readonly FormFieldDefForRedaction[] | null | undefined,
): Set<string> => {
  const out = new Set<string>();
  if (!fields) return out;
  for (const field of fields) {
    if (typeof field.name !== 'string' || field.name.length === 0) continue;
    if (field.type === 'email') {
      out.add(field.name);
      continue;
    }
    if (PHONE_NAME.test(field.name) || EMAIL_NAME.test(field.name)) {
      out.add(field.name);
    }
  }
  return out;
};

/**
 * Returns a copy of `fields` with every PII key nulled. Returns `null`
 * when the input is itself null/undefined. Mutating the original would
 * surprise the caller, so we always clone — the cost is small (lead
 * field maps top out at a handful of keys).
 *
 * Also runs the name-based heuristic across keys NOT present in the
 * form definition — covers historical rows whose form has since been
 * edited or deleted.
 */
export const redactPiiFromFields = (
  fields: Record<string, unknown> | null | undefined,
  piiKeys: ReadonlySet<string>,
): { redacted: Record<string, unknown> | null; changed: boolean } => {
  if (fields == null) return { redacted: null, changed: false };
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const isPii =
      piiKeys.has(key) || PHONE_NAME.test(key) || EMAIL_NAME.test(key);
    if (isPii && value != null) {
      out[key] = null;
      changed = true;
    } else {
      out[key] = value;
    }
  }
  return { redacted: out, changed };
};
