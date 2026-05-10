'use client';

import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json as jsonLang } from '@codemirror/lang-json';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { useField } from '@payloadcms/ui';
import type { CodeFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const langExtension = (lang: string | undefined): Extension => {
  switch (lang) {
    case 'js':
    case 'javascript':
    case 'ts':
    case 'typescript':
      return javascript({ typescript: lang === 'ts' || lang === 'typescript' });
    case 'json':
      return jsonLang();
    case 'html':
      return html();
    case 'css':
    case 'scss':
      return css();
    default:
      return [];
  }
};

/**
 * Custom Code field. CodeMirror 6 — ~50 KB gz, syntax highlighting +
 * undo history + line numbers + active-line + standard keymap.
 *
 * Storage shape unchanged: still `string`. The CodeMirror instance is
 * mounted imperatively and synced through Payload's `useField`. Saves
 * fire on any keystroke (debounced through Payload's autosave).
 */
export const CodeField = (props: CodeFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<string | null | undefined>({
    path,
  });

  const inputId = useId();
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const language =
    typeof (field.admin as { language?: unknown } | undefined)?.language === 'string'
      ? ((field.admin as { language?: string }).language as string)
      : undefined;
  const readOnly = field.admin?.readOnly === true;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef<string>(value ?? '');

  useEffect(() => {
    valueRef.current = value ?? '';
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current !== (value ?? '')) {
      v.dispatch({
        changes: { from: 0, to: current.length, insert: value ?? '' },
      });
    }
  }, [value]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editor mounts once per language/readOnly; value/setValue are wired via refs to avoid recreating CodeMirror on every keystroke
  useEffect(() => {
    if (!hostRef.current) return undefined;
    const updateExt = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      const next = update.state.doc.toString();
      if (next !== valueRef.current) {
        valueRef.current = next;
        setValue(next);
      }
    });

    const exts: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.theme({
        '&': { fontSize: '13px' },
        '.cm-content': { fontFamily: 'var(--font-mono)' },
      }),
      langExtension(language),
      updateExt,
    ];
    if (readOnly) exts.push(EditorView.editable.of(false));

    const state = EditorState.create({
      doc: value ?? '',
      extensions: exts,
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount once per language/readOnly combination — `value` syncing
    // is handled by the dedicated effect above to avoid recreating
    // CodeMirror on every keystroke.
  }, [language, readOnly]);

  return (
    <div className={`field-type code cs-code-field${showError ? ' cs-code-field--error' : ''}`}>
      <label className="field-label" htmlFor={inputId}>
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div id={inputId} ref={hostRef} className="cs-code-field__editor" />
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default CodeField;
