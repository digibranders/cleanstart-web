'use client';

import { useField } from '@payloadcms/ui';
import type { RadioFieldClientProps } from 'payload';
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
 * Custom radio-group field. Single-select horizontal/vertical pill bar.
 */
export const RadioField = (props: RadioFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const groupId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const readOnly = field.admin?.readOnly === true;

  const options = (field.options ?? []).map((o) => {
    if (typeof o === 'string') return { value: o, label: o };
    return { value: String(o.value), label: labelOf((o as { label?: unknown }).label) || String(o.value) };
  });

  return (
    <div
      className={`field-type radio cs-radio-field${
        showError ? ' cs-radio-field--error' : ''
      }`}
    >
      <span className="field-label">
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <div className="cs-radio-field__group" role="radiogroup" aria-label={labelText}>
        {options.map((opt) => {
          const inputId = `${groupId}-${opt.value}`;
          const isChecked = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={`cs-radio-field__pill${isChecked ? ' is-checked' : ''}`}
            >
              <input
                id={inputId}
                type="radio"
                name={groupId}
                value={opt.value}
                checked={isChecked}
                onChange={() => setValue(opt.value)}
                className="cs-radio-field__native"
                disabled={readOnly}
              />
              <span className="cs-radio-field__dot" aria-hidden="true" />
              <span>{opt.label}</span>
            </label>
          );
        })}
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

export default RadioField;
