'use client';

import { useField } from '@payloadcms/ui';
import type { TextareaFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useId } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/** Auto-grow textarea with optional char count when `maxLength` is set. */
export const TextareaField = (props: TextareaFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const maxLength = field.maxLength;
  const rows = typeof field.admin?.rows === 'number' ? field.admin.rows : 4;
  const readOnly = field.admin?.readOnly === true;

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setValue(e.target.value);
  };

  const len = typeof value === 'string' ? value.length : 0;

  return (
    <div
      className={`field-type textarea cs-textarea-field${
        showError ? ' cs-textarea-field--error' : ''
      }`}
    >
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
      <textarea
        id={inputId}
        className="cs-textarea-field__input"
        value={value ?? ''}
        onChange={onChange}
        required={field.required}
        rows={rows}
        maxLength={maxLength}
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

export default TextareaField;
