'use client';

import { useField } from '@payloadcms/ui';
import type { NumberFieldClientProps } from 'payload';
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
 * Custom number field — a plain number input (no +/- stepper buttons; the
 * native browser spin arrows are hidden in CSS, and ↑/↓ keys still step).
 *
 * Supports both scalar and `hasMany` number arrays. In hasMany mode an
 * input + Remove button renders per value; a separate Add row appends
 * new values.
 */
export const NumberField = (props: NumberFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<
    number | number[] | null | undefined
  >({
    path,
  });

  const inputId = useId();
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const min = typeof field.min === 'number' ? field.min : undefined;
  const max = typeof field.max === 'number' ? field.max : undefined;
  const configuredStep = (field.admin as { step?: unknown } | undefined)?.step;
  const step = typeof configuredStep === 'number' && Number.isFinite(configuredStep) && configuredStep > 0
    ? configuredStep
    : 1;
  const hasMany = field.hasMany === true;
  const readOnly = field.admin?.readOnly === true;
  const isDisabled = disabled || readOnly;

  // --- scalar helpers ---
  const scalarValue = !hasMany && typeof value === 'number' ? value : null;

  const onScalarInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    if (raw === '') { setValue(null); return; }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) setValue(parsed);
  };

  // --- hasMany helpers ---
  const manyValues: number[] = hasMany && Array.isArray(value)
    ? (value as unknown[]).filter((v): v is number => typeof v === 'number')
    : [];

  const removeAt = (idx: number): void => {
    setValue(manyValues.filter((_, i) => i !== idx));
  };

  const addValue = (raw: string): void => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    setValue([...manyValues, parsed]);
    if (addInputRef.current) addInputRef.current.value = '';
  };

  const onAddKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue((e.currentTarget as HTMLInputElement).value);
    }
  };

  if (hasMany) {
    return (
      <div className={`field-type number cs-number-field cs-number-field--many${showError ? ' cs-number-field--error' : ''}`}>
        <span className="field-label">
          {labelText}
          {field.required ? (
            <span className="required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </span>
        <ul className="cs-number-field__many-list">
          {manyValues.map((v, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: order is meaningful, no stable id
            <li key={i} className="cs-number-field__many-item">
              <span className="cs-number-field__many-val">{v}</span>
              {!isDisabled ? (
                <button
                  type="button"
                  className="cs-number-field__many-remove"
                  aria-label={`Remove value ${v}`}
                  onClick={() => removeAt(i)}
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {!isDisabled ? (
          <div className="cs-number-field__add-row">
            <input
              ref={addInputRef}
              type="number"
              className="cs-number-field__input"
              placeholder="Add value…"
              min={min}
              max={max}
              step={step}
              onKeyDown={onAddKeyDown}
              onBlur={(e) => {
                const v = e.currentTarget.value.trim();
                if (v) addValue(v);
              }}
              aria-label={`Add a value for ${labelText}`}
            />
          </div>
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
      <input
        id={inputId}
        type="number"
        className="cs-number-field__input"
        value={scalarValue == null ? '' : scalarValue}
        onChange={onScalarInput}
        min={min}
        max={max}
        step={step}
        required={field.required}
        readOnly={readOnly}
        disabled={disabled && !readOnly}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
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

export default NumberField;
