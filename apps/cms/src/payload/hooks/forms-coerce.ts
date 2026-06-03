import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

import { MAX_PATTERN_LENGTH, checkPattern } from '../lib/safe-regex';

type FormFieldShape = {
  name?: string | null;
  type?: string | null;
  required?: boolean | null;
  validation?: {
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
  } | null;
};

/**
 * Forms beforeChange hook covering two save-time invariants the schema
 * itself can't express in Payload's field config:
 *
 *   1. Consent fields are auto-required. The admin description on
 *      `forms.fields[].required` claims this; without this hook an
 *      editor could save `type: 'consent'` with `required: false`,
 *      which the public submit endpoint would then accept as
 *      not-required.
 *
 *   2. Validation patterns are checked for catastrophic backtracking.
 *      Editor-supplied patterns run on every public submission; an
 *      unsafe pattern (e.g. `(a+)+`) would freeze the event loop on
 *      the validate-fields hot path. Reject at save so the bad
 *      pattern never reaches a public visitor.
 */
export const formsCoerceHook: CollectionBeforeChangeHook = ({ data }) => {
  if (!data || !Array.isArray((data as { fields?: unknown }).fields)) return data;
  const fields = (data as { fields: FormFieldShape[] }).fields;
  const next = fields.map((field, index) => {
    const out: FormFieldShape = { ...field };
    // (1) consent ⇒ required.
    if (out.type === 'consent') {
      out.required = true;
    }
    // (2) reject unsafe / invalid patterns on save.
    const pattern = out.validation?.pattern;
    if (typeof pattern === 'string' && pattern.length > 0) {
      const check = checkPattern(pattern);
      if (!check.ok) {
        const label = out.name ?? 'a field';
        const reason =
          check.reason === 'catastrophic-backtracking'
            ? 'pattern looks unsafe (catastrophic backtracking risk)'
            : check.reason === 'too-long'
              ? `pattern exceeds the maximum allowed length of ${MAX_PATTERN_LENGTH} characters`
              : 'pattern is invalid regex syntax';
        throw new ValidationError({
          errors: [
            {
              message: `Cannot save form: ${label} validation pattern rejected — ${reason}.`,
              path: `fields.${index}.validation.pattern`,
            },
          ],
        });
      }
    }
    return out;
  });
  return { ...data, fields: next };
};
