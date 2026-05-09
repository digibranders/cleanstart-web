'use client';

import { useField } from '@payloadcms/ui';
import type { DateFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useId } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const toIsoLocal = (val: string | Date | null | undefined): string => {
  if (val == null || val === '') return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

/**
 * Custom date(time) field. Uses native <input type="datetime-local"> or
 * <input type="date"> based on the field's pickerAppearance — both are
 * keyboard-accessible without dragging in a third-party calendar.
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
  const dateOpts = (field.admin as { date?: { pickerAppearance?: string } } | undefined)?.date;
  const appearance = dateOpts?.pickerAppearance;
  const inputType: 'date' | 'datetime-local' = appearance === 'dayOnly' ? 'date' : 'datetime-local';
  const readOnly = field.admin?.readOnly === true;

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    if (raw === '') {
      setValue(null);
      return;
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) setValue(d.toISOString());
  };

  const inputValue =
    inputType === 'date'
      ? typeof value === 'string'
        ? value.slice(0, 10)
        : ''
      : toIsoLocal(value);

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
      <input
        id={inputId}
        type={inputType}
        className="cs-date-field__input"
        value={inputValue}
        onChange={handleChange}
        required={field.required}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
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
