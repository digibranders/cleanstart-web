'use client';

import { useField } from '@payloadcms/ui';
import type { NumberFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useId } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom number field with stepper buttons.
 */
export const NumberField = (props: NumberFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<number | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const min = typeof field.min === 'number' ? field.min : undefined;
  const max = typeof field.max === 'number' ? field.max : undefined;
  const step = 1;
  const readOnly = field.admin?.readOnly === true;

  const onInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    if (raw === '') {
      setValue(null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) setValue(parsed);
  };

  const bump = (delta: number): void => {
    const current = typeof value === 'number' ? value : 0;
    let next = current + delta;
    if (typeof min === 'number' && next < min) next = min;
    if (typeof max === 'number' && next > max) next = max;
    setValue(next);
  };

  return (
    <div className={`field-type number cs-number-field${showError ? ' cs-number-field--error' : ''}`}>
      <label className="field-label" htmlFor={inputId}>
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div className="cs-number-field__row">
        <button
          type="button"
          className="cs-number-field__step"
          onClick={() => bump(-step)}
          aria-label="Decrement"
          disabled={readOnly}
        >
          −
        </button>
        <input
          id={inputId}
          type="number"
          className="cs-number-field__input"
          value={value == null ? '' : value}
          onChange={onInput}
          min={min}
          max={max}
          step={step}
          required={field.required}
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
        />
        <button
          type="button"
          className="cs-number-field__step"
          onClick={() => bump(step)}
          aria-label="Increment"
          disabled={readOnly}
        >
          +
        </button>
      </div>
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default NumberField;
