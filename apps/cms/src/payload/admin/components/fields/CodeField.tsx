'use client';

import { useField } from '@payloadcms/ui';
import type { CodeFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * CodeMirror 6 is ~50 KB gz of editor plus four language grammars, and
 * `wireCustomFields` stamps this component onto every `code` field in
 * the config — of which there is exactly one, on `signatureTemplates`.
 * Statically imported it rode in the admin's shared chunk graph, so
 * every editor paid for it on every page to serve one set-and-forget
 * infrastructure collection.
 *
 * Loading it on mount instead keeps it out of the initial bundle. The
 * module promise is cached at module scope so a second code field (or a
 * remount) reuses the already-resolved chunk rather than re-importing.
 */
type CodeMirrorModules = {
  state: typeof import('@codemirror/state');
  view: typeof import('@codemirror/view');
  commands: typeof import('@codemirror/commands');
  css: typeof import('@codemirror/lang-css');
  html: typeof import('@codemirror/lang-html');
  javascript: typeof import('@codemirror/lang-javascript');
  json: typeof import('@codemirror/lang-json');
};

let modulesPromise: Promise<CodeMirrorModules> | null = null;

const loadCodeMirror = async (): Promise<CodeMirrorModules> => {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/commands'),
      import('@codemirror/lang-css'),
      import('@codemirror/lang-html'),
      import('@codemirror/lang-javascript'),
      import('@codemirror/lang-json'),
    ]).then(([state, view, commands, css, html, javascript, json]) => ({
      state,
      view,
      commands,
      css,
      html,
      javascript,
      json,
    }));
  }
  return modulesPromise;
};

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const langExtension = (
  m: CodeMirrorModules,
  lang: string | undefined,
): import('@codemirror/state').Extension => {
  switch (lang) {
    case 'js':
    case 'javascript':
    case 'ts':
    case 'typescript':
      return m.javascript.javascript({ typescript: lang === 'ts' || lang === 'typescript' });
    case 'json':
      return m.json.json();
    case 'html':
      return m.html.html();
    case 'css':
    case 'scss':
      return m.css.css();
    default:
      return [];
  }
};

/**
 * Custom Code field. CodeMirror 6 — syntax highlighting + undo history +
 * line numbers + active-line + standard keymap, loaded on demand.
 *
 * Storage shape unchanged: still `string`. The CodeMirror instance is
 * mounted imperatively and synced through Payload's `useField`. Saves
 * fire on any keystroke (debounced through Payload's autosave).
 *
 * Until the editor chunk resolves — and permanently if it fails to, so a
 * chunk-load error can't lock an editor out of the field — the value is
 * edited through a plain textarea on the same `useField` binding.
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
  const viewRef = useRef<import('@codemirror/view').EditorView | null>(null);
  const valueRef = useRef<string>(value ?? '');
  const [enhanced, setEnhanced] = useState(false);

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
    let cancelled = false;

    void loadCodeMirror()
      .then((m) => {
        if (cancelled) return;
        setEnhanced(true);
        // The host div only exists once `enhanced` flips, so build the
        // editor after React has painted it.
        queueMicrotask(() => {
          if (cancelled || !hostRef.current || viewRef.current) return;

          const { EditorState } = m.state;
          const { EditorView, keymap, lineNumbers, highlightActiveLine } = m.view;
          const { defaultKeymap, history, historyKeymap } = m.commands;

          const updateExt = EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const next = update.state.doc.toString();
            if (next !== valueRef.current) {
              valueRef.current = next;
              setValue(next);
            }
          });

          const exts: import('@codemirror/state').Extension[] = [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            EditorView.theme({
              '&': { fontSize: '13px' },
              '.cm-content': { fontFamily: 'var(--font-mono)' },
            }),
            langExtension(m, language),
            updateExt,
          ];
          if (readOnly) exts.push(EditorView.editable.of(false));

          const state = EditorState.create({
            doc: valueRef.current,
            extensions: exts,
          });
          viewRef.current = new EditorView({ state, parent: hostRef.current });
        });
      })
      .catch(() => {
        // Chunk failed to load — the textarea fallback stays in place.
      });

    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // Mount once per language/readOnly combination — `value` syncing
    // is handled by the dedicated effect above to avoid recreating
    // CodeMirror on every keystroke.
  }, [language, readOnly]);

  return (
    <div className={`field-type code cs-code-field${showError ? ' cs-code-field--error' : ''}`}>
      {/* CodeMirror hosts its editor in a div (not a labelable element).
          Using aria-labelledby on the host div and a matching id on the
          label keeps AT association without an invalid htmlFor target. */}
      <span id={inputId} className="field-label">
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      {enhanced ? (
        <div aria-labelledby={inputId} ref={hostRef} className="cs-code-field__editor" />
      ) : (
        <textarea
          aria-labelledby={inputId}
          className="cs-code-field__editor cs-code-field__fallback"
          value={value ?? ''}
          readOnly={readOnly}
          spellCheck={false}
          rows={12}
          onChange={(e) => {
            valueRef.current = e.target.value;
            setValue(e.target.value);
          }}
        />
      )}
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
