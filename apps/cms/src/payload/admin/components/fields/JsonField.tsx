'use client';

import { useField } from '@payloadcms/ui';
import type { JSONFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useId, useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const stringify = (val: unknown): string => {
  if (val == null) return '';
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return '';
  }
};

/**
 * Plain JSON field — monospace textarea with parse-on-blur. Local
 * `text` state lets editors type partial JSON without losing focus on
 * every keystroke; on blur we try to parse and either commit a parsed
 * value or surface a syntax error.
 *
 * A CodeMirror upgrade lands in Wave 2 part 2 (per plan). This text-
 * area form is good enough for small config blobs (siteSettings,
 * schema overrides) where editors rarely paste >100 lines.
 */
export const JsonField = (props: JSONFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const readOnly = field.admin?.readOnly === true;

  const [text, setText] = useState<string>(() => stringify(value));
  const [parseError, setParseError] = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const onBlur = (): void => {
    if (text.trim() === '') {
      setValue(null);
      setParseError(null);
      return;
    }
    try {
      setValue(JSON.parse(text) as unknown);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div
      className={`field-type json cs-json-field${showError || parseError ? ' cs-json-field--error' : ''}`}
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
      <textarea
        id={inputId}
        className="cs-textarea cs-textarea--mono"
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        rows={10}
        spellCheck={false}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
      />
      {description ? <p className="field-description">{description}</p> : null}
      {parseError ? (
        <output className="field-error" aria-live="polite">
          {parseError}
        </output>
      ) : null}
      {!parseError && showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default JsonField;
