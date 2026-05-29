'use client';

import { useField } from '@payloadcms/ui';
import type { CheckboxFieldClientProps } from 'payload';
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
 * Custom checkbox field. Native input under the hood for full a11y
 * support; CleanStart styling via the `.cs-checkbox-field` chrome.
 */
export const CheckboxField = (props: CheckboxFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<boolean | null | undefined>({
    path,
  });

  const id = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const readOnly = field.admin?.readOnly === true;

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (readOnly) return;
    setValue(e.target.checked);
  };

  return (
    <div
      className={`field-type checkbox cs-checkbox-field${
        showError ? ' cs-checkbox-field--error' : ''
      }${readOnly ? ' cs-checkbox-field--readonly' : ''}`}
    >
      <label className="cs-checkbox-field__row" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="cs-checkbox-field__input"
          checked={value === true}
          onChange={handleChange}
          aria-readonly={readOnly}
          onClick={readOnly ? (e) => e.preventDefault() : undefined}
        />
        <span className="cs-checkbox-field__visual" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" role="presentation">
            <title>Checked</title>
            <path
              d="M3 8l4 4 6-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="cs-checkbox-field__label">
          {labelText}
          {field.required ? (
            <span className="required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </span>
      </label>
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default CheckboxField;
