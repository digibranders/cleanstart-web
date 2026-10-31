'use client';

import { useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useId, useRef } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom text field with character-count guidance when `field.maxLength`
 * is set. Chrome matches the rest of CleanStart admin chrome. With
 * `hasMany` it edits a list: each value is a removable chip, and new values
 * are added with Enter, a comma or leaving the input.
 */
export const TextField = (props: TextFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<string | string[] | null | undefined>({
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

  const hasMany = field.hasMany === true;
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const manyValues: string[] =
    hasMany && Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  };

  const removeAt = (idx: number): void => {
    setValue(manyValues.filter((_, i) => i !== idx));
  };

  const addValue = (raw: string): void => {
    const next = raw.trim();
    if (next && !manyValues.includes(next)) setValue([...manyValues, next]);
    if (addInputRef.current) addInputRef.current.value = '';
  };

  const onAddKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(e.currentTarget.value);
    }
  };

  const len = typeof value === 'string' ? value.length : 0;

  if (hasMany) {
    return (
      <div className={`field-type text cs-text-field cs-text-field--many${showError ? ' cs-text-field--error' : ''}`}>
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
        {manyValues.length > 0 ? (
          <ul className="cs-text-field__chips">
            {manyValues.map((v, i) => (
              <li key={v} className="cs-text-field__chip">
                <span>{v}</span>
                {!isDisabled ? (
                  <button
                    type="button"
                    className="cs-text-field__chip-remove"
                    aria-label={`Remove ${v}`}
                    onClick={() => removeAt(i)}
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {!isDisabled ? (
          <input
            id={inputId}
            ref={addInputRef}
            name={path}
            type="text"
            className="cs-text-field__input"
            placeholder={placeholder ?? 'Type a value and press Enter to add it'}
            onKeyDown={onAddKeyDown}
            onBlur={(e) => addValue(e.currentTarget.value)}
            autoComplete="off"
          />
        ) : null}
        {description ? <p className="field-description">{description}</p> : null}
        {showError && errorMessage ? (
          <output className="field-error" aria-live="polite">
            {errorMessage}
          </output>
        ) : null}
      </div>
    );
  }

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
        value={typeof value === 'string' ? value : ''}
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
