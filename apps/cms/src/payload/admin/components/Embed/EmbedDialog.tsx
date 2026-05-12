'use client';

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@cleanstart/ui';
import { useCallback, useEffect, useId, useReducer, useRef } from 'react';

import type { EmbedAspectRatio, EmbedMode, EmbedProvider } from './embed-providers';
import {
  defaultAspectRatioForProvider,
  detectProvider,
  embedUrlForProvider,
  providerLabel,
} from './embed-providers';

export type EmbedDialogData = {
  readonly mode: EmbedMode;
  readonly url: string;
  readonly embedUrl: string;
  readonly provider: EmbedProvider;
  readonly rawHtml: string;
  readonly title: string;
  readonly aspectRatio: EmbedAspectRatio;
  readonly caption: string;
};

type Props = {
  readonly open: boolean;
  readonly initialData: EmbedDialogData | null;
  readonly onClose: () => void;
  readonly onConfirm: (data: EmbedDialogData) => void;
};

type Tab = 'iframe' | 'script';

type FormState = {
  tab: Tab;
  // iframe fields
  url: string;
  detectedProvider: EmbedProvider | null;
  urlError: string;
  aspectRatio: EmbedAspectRatio;
  iframeTitle: string;
  caption: string;
  // script fields
  rawHtml: string;
  scriptTitle: string;
  rawHtmlError: string;
  scriptTitleError: string;
};

type Action =
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_URL'; url: string }
  | { type: 'DETECT_PROVIDER' }
  | { type: 'SET_URL_ERROR'; error: string }
  | { type: 'SET_ASPECT_RATIO'; ratio: EmbedAspectRatio }
  | { type: 'SET_IFRAME_TITLE'; title: string }
  | { type: 'SET_CAPTION'; caption: string }
  | { type: 'SET_RAW_HTML'; rawHtml: string }
  | { type: 'SET_SCRIPT_TITLE'; title: string }
  | { type: 'SET_RAW_HTML_ERROR'; error: string }
  | { type: 'SET_SCRIPT_TITLE_ERROR'; error: string }
  | { type: 'RESET'; data: EmbedDialogData | null };

const ASPECT_RATIO_OPTIONS: ReadonlyArray<{ value: EmbedAspectRatio; label: string }> = [
  { value: '16-9', label: '16:9 (widescreen)' },
  { value: '4-3', label: '4:3 (standard)' },
  { value: '1-1', label: '1:1 (square)' },
  { value: '9-16', label: '9:16 (portrait)' },
  { value: 'auto', label: 'Auto (no fixed ratio)' },
];

function buildInitialState(data: EmbedDialogData | null): FormState {
  if (!data) {
    return {
      tab: 'iframe',
      url: '',
      detectedProvider: null,
      urlError: '',
      aspectRatio: '16-9',
      iframeTitle: '',
      caption: '',
      rawHtml: '',
      scriptTitle: '',
      rawHtmlError: '',
      scriptTitleError: '',
    };
  }
  return {
    tab: data.mode === 'script' ? 'script' : 'iframe',
    url: data.url,
    detectedProvider: data.mode === 'iframe' ? data.provider : null,
    urlError: '',
    aspectRatio: data.aspectRatio,
    iframeTitle: data.title,
    caption: data.caption,
    rawHtml: data.rawHtml,
    scriptTitle: data.mode === 'script' ? data.title : '',
    rawHtmlError: '',
    scriptTitleError: '',
  };
}

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, tab: action.tab, urlError: '', rawHtmlError: '', scriptTitleError: '' };
    case 'SET_URL':
      return { ...state, url: action.url, urlError: '', detectedProvider: null };
    case 'DETECT_PROVIDER': {
      if (!state.url.trim()) return { ...state, detectedProvider: null };
      const provider = detectProvider(state.url.trim());
      const ratio = defaultAspectRatioForProvider(provider);
      return { ...state, detectedProvider: provider, aspectRatio: ratio };
    }
    case 'SET_URL_ERROR':
      return { ...state, urlError: action.error };
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatio: action.ratio };
    case 'SET_IFRAME_TITLE':
      return { ...state, iframeTitle: action.title };
    case 'SET_CAPTION':
      return { ...state, caption: action.caption };
    case 'SET_RAW_HTML':
      return { ...state, rawHtml: action.rawHtml, rawHtmlError: '' };
    case 'SET_SCRIPT_TITLE':
      return { ...state, scriptTitle: action.title, scriptTitleError: '' };
    case 'SET_RAW_HTML_ERROR':
      return { ...state, rawHtmlError: action.error };
    case 'SET_SCRIPT_TITLE_ERROR':
      return { ...state, scriptTitleError: action.error };
    case 'RESET':
      return buildInitialState(action.data);
    default:
      return state;
  }
}

const TITLE_ID = 'cs-embed-dialog-title';

export function EmbedDialog({ open, initialData, onClose, onConfirm }: Props): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, null, () => buildInitialState(initialData));
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  // Sync form state when dialog opens with (potentially new) initialData
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      dispatch({ type: 'RESET', data: initialData });
      // Auto-focus URL input after mount
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
    prevOpenRef.current = open;
  }, [open, initialData]);

  const handleUrlBlur = useCallback((): void => {
    dispatch({ type: 'DETECT_PROVIDER' });
  }, []);

  const validateAndSubmit = useCallback((): void => {
    if (state.tab === 'iframe') {
      const url = state.url.trim();
      if (!url) {
        dispatch({ type: 'SET_URL_ERROR', error: 'URL is required.' });
        urlInputRef.current?.focus();
        return;
      }
      if (!/^https?:\/\//i.test(url)) {
        dispatch({ type: 'SET_URL_ERROR', error: 'URL must start with https://' });
        urlInputRef.current?.focus();
        return;
      }
      const provider = detectProvider(url);
      const embedUrl = embedUrlForProvider(url, provider);
      if (!embedUrl) {
        dispatch({
          type: 'SET_URL_ERROR',
          error: 'Could not extract embed URL. Paste the embed URL directly.',
        });
        return;
      }
      onConfirm({
        mode: 'iframe',
        url,
        embedUrl,
        provider,
        rawHtml: '',
        title: state.iframeTitle.trim(),
        aspectRatio: state.aspectRatio,
        caption: state.caption.trim(),
      });
    } else {
      let hasError = false;
      if (!state.rawHtml.trim()) {
        dispatch({ type: 'SET_RAW_HTML_ERROR', error: 'Embed code is required.' });
        hasError = true;
      }
      if (!state.scriptTitle.trim()) {
        dispatch({ type: 'SET_SCRIPT_TITLE_ERROR', error: 'Title is required for script embeds.' });
        hasError = true;
      }
      if (hasError) return;
      onConfirm({
        mode: 'script',
        url: '',
        embedUrl: '',
        provider: 'generic',
        rawHtml: state.rawHtml.trim(),
        title: state.scriptTitle.trim(),
        aspectRatio: state.aspectRatio,
        caption: state.caption.trim(),
      });
    }
  }, [state, onConfirm]);

  const isEditing = initialData !== null;

  return (
    <Dialog
      ariaLabel="Insert embed"
      className="cs-embed-dialog"
      labelledBy={`${titleId}-${TITLE_ID}`}
      onClose={onClose}
      open={open}
      size="md"
    >
      <DialogHeader
        id={`${titleId}-${TITLE_ID}`}
        onClose={onClose}
        title={isEditing ? 'Edit embed' : 'Insert embed'}
      />

      <DialogBody>
        {/* Tab bar */}
        <div className="cs-embed-dialog__tabs" role="tablist">
          <button
            aria-selected={state.tab === 'iframe'}
            className={`cs-embed-dialog__tab${state.tab === 'iframe' ? ' is-active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'iframe' })}
            role="tab"
            type="button"
          >
            URL / iframe
          </button>
          <button
            aria-selected={state.tab === 'script'}
            className={`cs-embed-dialog__tab${state.tab === 'script' ? ' is-active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', tab: 'script' })}
            role="tab"
            type="button"
          >
            Script / HTML
          </button>
        </div>

        {/* Tab: URL / iframe */}
        {state.tab === 'iframe' && (
          <div className="cs-embed-dialog__panel">
            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-url">
                URL
              </label>
              <div className="cs-embed-dialog__url-row">
                <input
                  autoComplete="off"
                  className={`cs-embed-dialog__input${state.urlError ? ' has-error' : ''}`}
                  id="cs-embed-url"
                  onBlur={handleUrlBlur}
                  onChange={(e) => dispatch({ type: 'SET_URL', url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  ref={urlInputRef}
                  type="url"
                  value={state.url}
                />
                {state.detectedProvider && !state.urlError && (
                  <span
                    className={`cs-embed-dialog__provider-badge cs-embed-dialog__provider-badge--${state.detectedProvider}`}
                  >
                    {state.detectedProvider === 'generic'
                      ? 'Custom iframe ✓'
                      : <>
                          {providerLabel(state.detectedProvider)}
                          {' '}&bull;{' '}
                          {state.aspectRatio.replace('-', ':')}
                        </>
                    }
                  </span>
                )}
              </div>
              {state.urlError && (
                <p className="cs-embed-dialog__error" role="alert">
                  {state.urlError}
                </p>
              )}
              <p className="cs-embed-dialog__hint">
                YouTube, Vimeo, Mux, Loom, Calendly, TidyCal, Typeform, Tally, Figma, Wistia,
                Descript, Arcade, Spotify, SoundCloud, Google Maps — or{' '}
                <strong>any URL</strong> that can be loaded in an iframe.
              </p>
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-iframe-title">
                Title{' '}
                <span className="cs-embed-dialog__label-note">(recommended for accessibility)</span>
              </label>
              <input
                className="cs-embed-dialog__input"
                id="cs-embed-iframe-title"
                onChange={(e) => dispatch({ type: 'SET_IFRAME_TITLE', title: e.target.value })}
                placeholder="e.g. Product demo video"
                type="text"
                value={state.iframeTitle}
              />
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-aspect">
                Aspect ratio
              </label>
              <select
                className="cs-embed-dialog__select"
                id="cs-embed-aspect"
                onChange={(e) =>
                  dispatch({ type: 'SET_ASPECT_RATIO', ratio: e.target.value as EmbedAspectRatio })
                }
                value={state.aspectRatio}
              >
                {ASPECT_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-caption">
                Caption{' '}
                <span className="cs-embed-dialog__label-note">(optional)</span>
              </label>
              <input
                className="cs-embed-dialog__input"
                id="cs-embed-caption"
                onChange={(e) => dispatch({ type: 'SET_CAPTION', caption: e.target.value })}
                placeholder="e.g. Figure 1 — Architecture overview"
                type="text"
                value={state.caption}
              />
            </div>
          </div>
        )}

        {/* Tab: Script / HTML */}
        {state.tab === 'script' && (
          <div className="cs-embed-dialog__panel">
            <div className="cs-embed-dialog__notice" role="note">
              <svg
                aria-hidden="true"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 16 16"
                width="14"
              >
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5M8 11v.5" />
              </svg>
              <span>
                Paste <strong>any</strong> embed snippet — Tidio, HubSpot, Intercom, Hotjar,
                Mux player, custom widgets, or anything with a{' '}
                <code>&lt;script&gt;</code> tag. Scripts execute on the live site only;
                a placeholder is shown here.
              </span>
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-raw-html">
                Embed code
              </label>
              <textarea
                className={`cs-embed-dialog__textarea${state.rawHtmlError ? ' has-error' : ''}`}
                id="cs-embed-raw-html"
                onChange={(e) => dispatch({ type: 'SET_RAW_HTML', rawHtml: e.target.value })}
                placeholder={'<div id="widget"></div>\n<script src="https://..."></script>'}
                rows={6}
                spellCheck={false}
                value={state.rawHtml}
              />
              {state.rawHtmlError && (
                <p className="cs-embed-dialog__error" role="alert">
                  {state.rawHtmlError}
                </p>
              )}
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-script-title">
                Title <span className="cs-embed-dialog__label-note">(shown as placeholder label)</span>
              </label>
              <input
                className={`cs-embed-dialog__input${state.scriptTitleError ? ' has-error' : ''}`}
                id="cs-embed-script-title"
                onChange={(e) => dispatch({ type: 'SET_SCRIPT_TITLE', title: e.target.value })}
                placeholder="e.g. Tally contact form"
                type="text"
                value={state.scriptTitle}
              />
              {state.scriptTitleError && (
                <p className="cs-embed-dialog__error" role="alert">
                  {state.scriptTitleError}
                </p>
              )}
            </div>

            <div className="cs-embed-dialog__field">
              <label className="cs-embed-dialog__label" htmlFor="cs-embed-script-caption">
                Caption{' '}
                <span className="cs-embed-dialog__label-note">(optional)</span>
              </label>
              <input
                className="cs-embed-dialog__input"
                id="cs-embed-script-caption"
                onChange={(e) => dispatch({ type: 'SET_CAPTION', caption: e.target.value })}
                placeholder="e.g. Fill out the form above"
                type="text"
                value={state.caption}
              />
            </div>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        <button
          className="cs-embed-dialog__cancel"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="cs-embed-dialog__confirm"
          onClick={validateAndSubmit}
          type="button"
        >
          {isEditing ? 'Update embed' : 'Insert embed'}
        </button>
      </DialogFooter>
    </Dialog>
  );
}
