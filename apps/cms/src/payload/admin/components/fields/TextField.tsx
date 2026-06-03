'use client';

import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
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
 * Custom text field with character-count guidance when `field.maxLength`
 * is set. Chrome matches the rest of CleanStart admin chrome.
 */
export const TextField = (props: TextFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const maxLength = field.maxLength;
  const placeholder =
    typeof field.admin?.placeholder === 'string' ? field.admin.placeholder : undefined;
  const readOnly = field.admin?.readOnly === true;
  const isDisabled = disabled || readOnly;

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  };

  const len = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`field-type text cs-text-field${showError ? ' cs-text-field--error' : ''}`}>
      <label className="field-label cs-text-field__label" htmlFor={inputId}>
        <span>
          {labelText}
          {field.required ? (
            <span className="required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </span>
        {maxLength ? (
          <span
            className={`cs-text-field__count${len > maxLength ? ' is-over' : ''}`}
            aria-live="polite"
          >
            {len} / {maxLength}
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        name={path}
        type="text"
        className="cs-text-field__input"
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={field.required}
        maxLength={maxLength}
        autoComplete={field.admin?.autoComplete}
        readOnly={readOnly}
        disabled={isDisabled && !readOnly}
        aria-readonly={readOnly || undefined}
        aria-disabled={isDisabled || undefined}
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

export default TextField;
