'use client';

import { useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';

/**
 * Custom label for the `gateForm` relationship field on the Resources
 * collection. Renders the standard "Gate Form" label and appends a red
 * required-asterisk only when the sibling `gated` checkbox is checked.
 *
 * Why this exists:
 *   Payload's UI shows the `*` next to a label only when the field's
 *   schema-level `required: true` is set. `gateForm` is
 *   *conditionally* required (required only when `gated === true`) and
 *   enforces that through a `validate` function, not the schema flag —
 *   so the asterisk would never appear, leaving editors guessing why
 *   they get a red banner on publish.
 *
 *   `required: true` at schema level cannot be used because Payload's
 *   required-check runs regardless of `admin.condition` (admin.condition
 *   is UI-only). That would block saving any non-gated resource.
 *
 *   This component is the standard Payload workaround: read sibling
 *   state via `useFormFields` and render the asterisk yourself.
 *
 * The validate function in Resources.ts is the source of truth for
 * the actual required behaviour — this component is purely a visual
 * cue.
 */
export const GateFormLabel = (): ReactElement => {
  const gated = useFormFields(
    ([fields]) => fields.gated?.value as boolean | undefined,
  );

  return (
    <label className="field-label" htmlFor="field-gateForm">
      Gate Form
      {gated === true ? (
        <span
          aria-hidden
          style={{ color: 'var(--theme-error-500, #e11d48)', marginLeft: '0.25rem' }}
          title="Required when gated"
        >
          *
        </span>
      ) : null}
    </label>
  );
};
