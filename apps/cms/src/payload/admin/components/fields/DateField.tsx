'use client';

import { DateTimePicker } from '@cleanstart/ui';
import { useField } from '@payloadcms/ui';
import type { DateFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useId } from 'react';

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
export const DateField = (props: DateFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

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
