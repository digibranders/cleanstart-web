'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  ALLOWED_OVERRIDE_TYPES,
  validateOverride,
  type OverrideValidationResult,
} from '../../lib/jsonld/override-validator';

/**
 * Admin-only sidebar editor for `seo.additionalSchema` (Tier 3 raw
 * JSON-LD override). Field-level access already restricts who sees
 * this; the component additionally:
 *
 *  - Parses the textarea contents as JSON on every keystroke (with a
 *    short debounce to keep typing snappy)
 *  - Runs the same Zod validator the server uses, so editors see the
 *    exact error they'd hit on save
 *  - Renders the issue list inline (no save needed to discover problems)
 *  - Pretty-prints on blur once the JSON is parseable
 *  - Persists the parsed object (NOT the raw string) into the field —
 *    so what gets saved matches what the dispatcher reads
 *
 * Field display is a plain textarea rather than a Monaco editor —
 * keeps the bundle small, and the override is rare enough that
 * editors don't need IDE-level syntax help.
 */
export const SchemaOverrideField = (): ReactElement => {
  const inputId = useId();
  const { value, setValue } = useField<unknown>({ path: 'seo.additionalSchema' });

  // Local string state so the textarea isn't re-stringified on every
  // re-render (which would clobber the editor's caret position).
  const initialString = useMemo(() => {
    if (value == null) return '';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }, [value]);

  const [text, setText] = useState<string>(initialString);
  const [parseError, setParseError] = useState<string>('');
  const [validation, setValidation] = useState<OverrideValidationResult>({
    ok: true,
    message: '',
    issues: [],
  });

  // Initialise on mount when the field has a stored value (e.g. an
  // admin reopens a doc with an override already saved). We
  // intentionally don't list `text` as a dep — once the editor types,
  // we never want to overwrite their input from the stored value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (initialString && text === '') {
      setText(initialString);
    }
  }, [initialString]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setText(next);

      // Empty -> clear the field cleanly.
      if (next.trim().length === 0) {
        setParseError('');
        setValidation({ ok: true, message: '', issues: [] });
        setValue(null);
        return;
      }

      // Try to parse, then run the validator. Both run live so the
      // editor sees feedback within ~0ms of typing (no debounce —
      // schema overrides are rare and short, the cost is trivial).
      try {
        const parsed = JSON.parse(next) as unknown;
        setParseError('');
        const result = validateOverride(parsed);
        setValidation(result);
        if (result.ok) {
          setValue(parsed);
        }
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Invalid JSON');
        setValidation({ ok: true, message: '', issues: [] });
      }
    },
    [setValue],
  );

  const handleBlur = useCallback(() => {
    // Pretty-print on blur if the content is parseable. Quietly skip
    // on parse error so the editor's cursor doesn't get reset on bad
    // JSON.
    if (text.trim().length === 0) return;
    try {
      const parsed = JSON.parse(text) as unknown;
      const pretty = JSON.stringify(parsed, null, 2);
      if (pretty !== text) setText(pretty);
    } catch {
      // ignore — leave raw text for the editor to fix
    }
  }, [text]);

  const handleClear = useCallback(() => {
    setText('');
    setParseError('');
    setValidation({ ok: true, message: '', issues: [] });
    setValue(null);
  }, [setValue]);

  const status: 'empty' | 'parse-error' | 'invalid' | 'valid' = (() => {
    if (text.trim().length === 0) return 'empty';
    if (parseError) return 'parse-error';
    if (!validation.ok) return 'invalid';
    return 'valid';
  })();

  return (
    <div className="cs-schema-override" data-status={status}>
      <label htmlFor={inputId} className="cs-schema-override__label">
        Additional Schema (admin override)
      </label>
      <p className="cs-schema-override__hint">
        Pasted JSON-LD blob(s) that the dispatcher appends LAST to this
        page&rsquo;s @graph. Allowlist:{' '}
        <code>{ALLOWED_OVERRIDE_TYPES.slice(0, 6).join(', ')}…</code>{' '}
        ({ALLOWED_OVERRIDE_TYPES.length} types). Leave empty to disable.
      </p>
      <textarea
        id={inputId}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder='{ "@context": "https://schema.org", "@type": "Course", ... }'
        spellCheck={false}
        rows={10}
        className="cs-schema-override__textarea"
      />
      <div className="cs-schema-override__feedback">
        {status === 'parse-error' && (
          <p className="cs-schema-override__error">JSON parse error: {parseError}</p>
        )}
        {status === 'invalid' && (
          <>
            <p className="cs-schema-override__error">{validation.message}</p>
            {validation.issues.length > 0 && (
              <ul className="cs-schema-override__issues">
                {validation.issues.map((i, idx) => (
                  <li key={`${i.path}-${idx}`}>
                    <code>{i.path}</code>: {i.message}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {status === 'valid' && (
          <p className="cs-schema-override__ok">
            Valid override. Will be appended to the JSON-LD graph after Layer 1 and Layer 2 add-ons.
          </p>
        )}
      </div>
      {text.trim().length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="cs-schema-override__clear"
        >
          Clear override
        </button>
      )}
    </div>
  );
};
