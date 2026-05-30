'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { MediaBrowseDialog, type MediaBrowseDoc } from '../MediaBrowseDialog';
import {
  uploadMediaFile,
  uploadMediaFromUrl,
  type UploadedMediaDoc,
} from './upload-media-file';

type Tab = 'device' | 'browse' | 'url';

type Props = {
  readonly open: boolean;
  readonly folder: string;
  /**
   * `x-media-context-hint` header forwarded to upload + ingest helpers.
   * The Media beforeValidate uses this to derive a meaningful R2 key
   * when the clipboard's alt + filename are noise. See
   * `InlineImage/context-hint.ts` for how the plugin builds it.
   */
  readonly contextHint?: string;
  /**
   * `insert` — the picked/uploaded media is inserted as a new inline
   * image at the editor's current selection.
   * `swap`  — the picked/uploaded media replaces the `value` of an
   * existing upload node (its per-placement fields stay intact).
   * Only affects the title and primary CTA copy; the actual
   * insert-vs-replace decision is made by the plugin via the
   * `onInsert` callback.
   */
  readonly mode?: 'insert' | 'swap';
  readonly onClose: () => void;
  readonly onInsert: (doc: UploadedMediaDoc) => void;
};

/**
 * Three-tab insert dialog mounted by `InlineImagePlugin`.
 *
 *   - **Device**: hidden file input → direct upload via `uploadMediaFile`.
 *   - **Browse**: re-uses the shared `MediaBrowseDialog`'s thumbnail
 *     grid (rendered inline here, not nested) so editors get the
 *     same pixel-for-pixel picker as the hero image card.
 *   - **URL**: text input → `uploadMediaFromUrl`. The browser CORS
 *     boundary may reject the fetch; the helper returns a clear
 *     error string in that case.
 *
 * Implemented as a separate native `<dialog>` because the existing
 * `MediaBrowseDialog` only renders the browse grid — we need an
 * outer shell with tab switching above it.
 */
export const InlineImageInsertDialog = (props: Props): ReactElement => {
  const { open, folder, contextHint, mode = 'insert', onClose, onInsert } = props;
  const titleText = mode === 'swap' ? 'Replace image' : 'Insert image';
  const [tab, setTab] = useState<Tab>('device');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  // Reset transient state every time the dialog is reopened so a
  // previous error doesn't bleed into a fresh attempt.
  useEffect(() => {
    if (open) {
      setError(null);
      setUrlValue('');
      setTab('device');
    }
  }, [open]);

  useEffect(() => {
    if (open && tab === 'url') urlInputRef.current?.focus();
  }, [open, tab]);

  const handleDevicePick = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      const result = await uploadMediaFile(file, { folder, ...(contextHint ? { contextHint } : {}) });
      setBusy(false);
      if (result.ok) {
        onInsert(result.doc);
      } else {
        setError(result.error);
      }
    },
    [folder, contextHint, onInsert],
  );

  const handleUrlSubmit = useCallback(async () => {
    const url = urlValue.trim();
    if (!url) return;
    setBusy(true);
    setError(null);
    const result = await uploadMediaFromUrl(url, {
      folder,
      ...(contextHint ? { contextHint } : {}),
    });
    setBusy(false);
    if (result.ok) onInsert(result.doc);
    else setError(result.error);
  }, [folder, contextHint, onInsert, urlValue]);

  return (
    <>
      <dialog
        ref={dialogRef}
        className="cs-inline-image-dialog"
        aria-labelledby={titleId}
        onClose={onClose}
        onClick={(e) => {
          // Backdrop click closes (event target === dialog itself).
          if (e.target === dialogRef.current) onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="cs-inline-image-dialog__panel">
          <header className="cs-inline-image-dialog__head">
            <h2 id={titleId} className="cs-inline-image-dialog__title">
              {titleText}
            </h2>
            <button
              type="button"
              className="cs-inline-image-dialog__close"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </header>

          <div
            role="tablist"
            aria-label="Source"
            className="cs-inline-image-dialog__tabs"
          >
            {(['device', 'browse', 'url'] as const).map((id) => (
              <button
                key={id}
                id={`${titleId}-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={id !== 'browse' ? `${titleId}-panel-${id}` : undefined}
                tabIndex={tab === id ? 0 : -1}
                className={`cs-inline-image-dialog__tab${tab === id ? ' is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {id === 'device' ? 'Upload' : id === 'browse' ? 'Browse media' : 'From URL'}
              </button>
            ))}
          </div>

          <div className="cs-inline-image-dialog__body">
            {tab === 'device' && (
              <div
                id={`${titleId}-panel-device`}
                role="tabpanel"
                aria-labelledby={`${titleId}-tab-device`}
                className="cs-inline-image-dialog__device"
              >
                <p className="cs-inline-image-dialog__hint">
                  JPEG, PNG, WebP, AVIF, GIF, SVG up to 25 MB. Image will land in <code>{folder}</code>.
                </p>
                <button
                  type="button"
                  className="cs-inline-image-dialog__primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  {busy ? 'Uploading…' : 'Choose file'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void handleDevicePick(file);
                  }}
                />
              </div>
            )}

            {tab === 'url' && (
              <div
                id={`${titleId}-panel-url`}
                role="tabpanel"
                aria-labelledby={`${titleId}-tab-url`}
                className="cs-inline-image-dialog__url"
              >
                <label className="cs-inline-image-dialog__label" htmlFor={`${titleId}-url`}>
                  Image URL
                </label>
                <input
                  id={`${titleId}-url`}
                  ref={urlInputRef}
                  type="url"
                  className="cs-inline-image-dialog__input"
                  placeholder="https://example.com/photo.jpg"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleUrlSubmit();
                    }
                  }}
                  disabled={busy}
                />
                <p className="cs-inline-image-dialog__hint">
                  The image is fetched in your browser and re-uploaded to Media. Sites that block
                  cross-origin requests cannot be ingested this way — download and upload manually.
                </p>
                <button
                  type="button"
                  className="cs-inline-image-dialog__primary"
                  onClick={() => void handleUrlSubmit()}
                  disabled={busy || urlValue.trim().length === 0}
                >
                  {busy ? 'Fetching…' : 'Fetch & insert'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="cs-inline-image-dialog__error" role="alert">
              {error}
            </div>
          )}
        </div>
      </dialog>

      {/* Browse tab delegates to the shared dialog so the picker UX
          stays identical to the hero `MediaField`'s Browse button. */}
      <MediaBrowseDialog
        open={open && tab === 'browse'}
        ariaLabel="Browse media for inline insertion"
        onClose={() => {
          // Closing the picker drops back to the device tab; the
          // outer dialog stays open so the editor can retry without
          // reopening from the slash menu.
          setTab('device');
        }}
        onSelect={(doc: MediaBrowseDoc) => {
          onInsert({
            id: doc.id,
            filename: doc.filename,
            mimeType: doc.mimeType,
            url: doc.url,
            alt: doc.alt,
          });
        }}
      />
    </>
  );
};
