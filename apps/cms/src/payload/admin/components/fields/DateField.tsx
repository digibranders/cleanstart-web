'use client';

import { DateTimePicker } from '@cleanstart/ui';
import { useField, useFormFields } from '@payloadcms/ui';
import type { DateFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useId } from 'react';

/**
 * Optional clientProps for cross-field range constraints. `minFromField` /
 * `maxFromField` name a sibling date field whose live value bounds this picker
 * (e.g. an event's End field passes `minFromField: 'startsAt'`, so the calendar
 * greys out dates before the start). Read from form state so the bound tracks
 * edits to the sibling.
 */
type RangeProps = {
  readonly minFromField?: string;
  readonly maxFromField?: string;
};

// Bounds are snapped to the LOCAL day so the calendar (whose cells are local
// midnights) treats the bound's own day as selectable — e.g. an event's End can
// land on the same calendar day as the Start. Intra-day time ordering is left
// to the field's server `validate`. Passing the raw stored value would block
// the shared day whenever a timezone offset pushes its UTC instant past local
// midnight.
const startOfLocalDayIso = (v: unknown): string | undefined => {
  if (typeof v !== 'string' || v.length === 0) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
};

const endOfLocalDayIso = (v: unknown): string | undefined => {
  if (typeof v !== 'string' || v.length === 0) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
};

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom date / datetime field. Composes the calendar + time popover
 * from `@cleanstart/ui`. Replaces stock react-datepicker so storage
 * (always ISO) is decoupled from display (locale + optional timezone).
 *
 * - `pickerAppearance: 'dayOnly'` → date mode, no time controls
 * - anything else → datetime mode with time row
 */
export const DateField = (props: DateFieldClientProps & RangeProps): ReactElement => {
  const { field, path, minFromField, maxFromField } = props;
  const { value, setValue, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  // Live values of the bounding sibling fields (if configured).
  const minSibling = useFormFields(([fields]) =>
    minFromField ? fields?.[minFromField]?.value : undefined,
  );
  const maxSibling = useFormFields(([fields]) =>
    maxFromField ? fields?.[maxFromField]?.value : undefined,
  );
  const minDate = startOfLocalDayIso(minSibling);
  const maxDate = endOfLocalDayIso(maxSibling);

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const dateOpts = (field.admin as { date?: { pickerAppearance?: string; timezone?: string } } | undefined)
    ?.date;
  const appearance = dateOpts?.pickerAppearance;
  const mode: 'date' | 'datetime' = appearance === 'dayOnly' ? 'date' : 'datetime';
  const tz = dateOpts?.timezone;
  const readOnly = field.admin?.readOnly === true;

  return (
    <div className={`field-type date cs-date-field${showError ? ' cs-date-field--error' : ''}`}>
      <label className="field-label" htmlFor={inputId}>
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <DateTimePicker
        id={inputId}
        value={value ?? null}
        onChange={(next) => setValue(next ?? null)}
        mode={mode}
        {...(tz !== undefined ? { timezone: tz } : {})}
        {...(minDate !== undefined ? { minDate } : {})}
        {...(maxDate !== undefined ? { maxDate } : {})}
        disabled={readOnly}
        {...(field.required !== undefined ? { required: field.required } : {})}
        ariaLabel={labelText}
      />
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default DateField;
