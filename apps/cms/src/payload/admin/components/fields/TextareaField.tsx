'use client';

import { useField } from '@payloadcms/ui';
import type { TextareaFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Auto-grow textarea. Starts at `admin.rows` (default 1) and expands
 * on input up to `admin.maxRows` (default 12) before scrolling. Char
 * count surfaces when `maxLength` is set.
 */
export const TextareaField = (props: TextareaFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const maxLength = field.maxLength;
  const minRows = typeof field.admin?.rows === 'number' ? field.admin.rows : 1;
  const maxRowsAdmin = (field.admin as { maxRows?: number } | undefined)?.maxRows;
  const maxRows = typeof maxRowsAdmin === 'number' ? maxRowsAdmin : 12;
  const readOnly = field.admin?.readOnly === true;
  const isDisabled = disabled || readOnly;

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const lineHeightRef = useRef<number | null>(null);

  const resize = useCallback((): void => {
    const el = taRef.current;
    if (!el) return;
    if (lineHeightRef.current === null) {
      const cs = window.getComputedStyle(el);
      const lh = Number.parseFloat(cs.lineHeight);
      lineHeightRef.current = Number.isFinite(lh) ? lh : 20;
    }
    const lh = lineHeightRef.current;
    el.style.height = 'auto';
    const minH = lh * minRows;
    const maxH = lh * maxRows;
    const next = Math.min(Math.max(el.scrollHeight, minH), maxH);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [minRows, maxRows]);

  useLayoutEffect(() => {
    // value participates so the textarea grows as the user types
    void value;
    resize();
  }, [value, resize]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

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
        name={path}
        ref={taRef}
        className="cs-textarea-field__input"
        value={value ?? ''}
        onChange={onChange}
        required={field.required}
        rows={minRows}
        maxLength={maxLength}
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

export default TextareaField;
