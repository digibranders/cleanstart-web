'use client';

import { useField } from '@payloadcms/ui';
import type { EmailFieldClientProps } from 'payload';
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
 * Custom email field. Native `type="email"` + `autocomplete="email"` so
 * iOS / password-managers can autofill. Validation is server-side via
 * Payload's `email` field type — the input only adds basic format
 * hinting; the actual reject path lives in the field's hooks.
 */
export const EmailField = (props: EmailFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const placeholder =
    typeof field.admin?.placeholder === 'string' ? field.admin.placeholder : 'name@example.com';
  const readOnly = field.admin?.readOnly === true;
  const isDisabled = disabled || readOnly;

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  };

  return (
    <div
      className={`field-type email cs-text-field${showError ? ' cs-text-field--error' : ''}`}
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
      </label>
      <input
        id={inputId}
        type="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        className="cs-text-field__input"
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={field.required}
        autoComplete={field.admin?.autoComplete ?? 'email'}
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

export default EmailField;
