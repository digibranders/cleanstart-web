'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

type MediaSize = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
};

type MediaDoc = {
  id?: string | number;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  alt?: string | null;
  sizes?: Record<string, MediaSize | undefined> | null;
};

const splitFilename = (filename: string): { stem: string; ext: string } => {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0 || dot === trimmed.length - 1) return { stem: trimmed, ext: '' };
  return { stem: trimmed.slice(0, dot), ext: trimmed.slice(dot) };
};

const formatBytes = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const pickThumbUrl = (doc: MediaDoc | null): string | null => {
  if (!doc) return null;
  return doc.sizes?.thumb?.url ?? doc.sizes?.card?.url ?? doc.url ?? null;
};

const toAbsoluteUrl = (url: string): string => {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
};

/**
 * Standalone Media collection edit-page chrome — mirrors the
 * `MediaField` card UI (thumbnail · filename rename · meta · URL row
 * with copy + open · inline alt edit) so the two surfaces feel like
 * the same component.
 *
 * Mounted as the first UI field in `Media.ts`. The companion CSS in
 * `_media.scss` hides Payload's stock `.file-field` chrome on the
 * Media edit page so this component owns the file header surface.
 */
export const MediaSelfChrome = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  // Reactively pull current `alt` from the form so the chrome's
  // "Alt:" readout stays in sync with whatever's typed in the Alt
  // textarea below the card.
  const { value: liveAlt } = useField<string>({ path: 'alt' });

  const [doc, setDoc] = useState<MediaDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const [editingFilename, setEditingFilename] = useState(false);
  const [filenameDraft, setFilenameDraft] = useState('');
  const [filenameSaving, setFilenameSaving] = useState(false);
  const filenameInputRef = useRef<HTMLInputElement | null>(null);
  const filenameInputId = useId();

  // Fetch the current media doc on mount + after every successful PATCH.
  const refetch = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      const res = await fetch(`/api/media/${id}?depth=0`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = (await res.json()) as MediaDoc;
      setDoc(json);
    } catch {
      // network error is silent — the chrome will retry on next render.
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (editingFilename) {
      filenameInputRef.current?.focus();
      filenameInputRef.current?.select();
    }
  }, [editingFilename]);

  // Don't render until we have the doc data — avoids a flash of an
  // empty card.
  const thumbUrl = pickThumbUrl(doc);
  const ext = useMemo(() => splitFilename(doc?.filename ?? '').ext, [doc?.filename]);
  const stem = useMemo(() => splitFilename(doc?.filename ?? '').stem, [doc?.filename]);
  const absoluteUrl = doc?.url ? toAbsoluteUrl(doc.url) : '';
  const sizeText = formatBytes(doc?.filesize);
  const dimensionText = doc?.width && doc?.height ? `${doc.width} × ${doc.height}` : '';
  const meta = [dimensionText, sizeText, doc?.mimeType].filter(Boolean).join(' · ');

  const onCopyUrl = useCallback(async () => {
    if (!absoluteUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1400);
    } catch {
      // best-effort; ignore.
    }
  }, [absoluteUrl]);

  const onStartRename = useCallback(() => {
    setFilenameDraft(stem);
    setEditingFilename(true);
  }, [stem]);

  const onCancelRename = useCallback(() => {
    setEditingFilename(false);
    setFilenameDraft('');
  }, []);

  const onSaveRename = useCallback(async () => {
    if (!id || !doc?.filename) return;
    const cleaned = filenameDraft.trim().replace(/[\\/]/g, '-');
    if (cleaned.length === 0) {
      setEditingFilename(false);
      return;
    }
    const next = `${cleaned}${ext}`;
    if (next === doc.filename) {
      setEditingFilename(false);
      return;
    }
    setFilenameSaving(true);
    try {
      const res = await fetch(`/api/media/${id}?depth=0`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { doc?: MediaDoc };
      if (json?.doc) setDoc(json.doc);
      else void refetch();
      setEditingFilename(false);
      setError(null);
    } catch {
      setError('Could not rename file. The original filename is still in use.');
    } finally {
      setFilenameSaving(false);
    }
  }, [doc?.filename, ext, filenameDraft, id, refetch]);

  const onFilenameKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void onSaveRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelRename();
      }
    },
    [onCancelRename, onSaveRename],
  );

  // "Edit Image" delegates to Payload's native image editor button.
  // We hide Payload's stock `.file-field` chrome via CSS, but the
  // hidden button is still in the DOM — clicking it opens Payload's
  // built-in image editor dialog (rotate / crop / focal point).
  const onEditImage = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      '.collection-edit--media .field-type.file-field .file-field__edit',
    );
    if (btn) btn.click();
  }, []);

  // "Replace" — file picker that PATCHes the existing media doc with
  // the new file. Reuses one hidden `<input type="file">` mounted on
  // first click so consecutive replaces don't leak DOM.
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacing, setReplacing] = useState(false);
  const onReplace = useCallback(() => {
    if (!id) return;
    let input = replaceInputRef.current;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.style.display = 'none';
      input.addEventListener('change', () => {
        const file = input?.files?.[0];
        if (!file) return;
        setReplacing(true);
        const fd = new FormData();
        fd.append('file', file);
        fetch(`/api/media/${encodeURIComponent(String(id))}`, {
          method: 'PATCH',
          credentials: 'include',
          body: fd,
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            try {
              window.dispatchEvent(
                new CustomEvent('cs-cms:toast', {
                  detail: { message: 'File replaced.', type: 'success' },
                }),
              );
            } catch {
              // ignore
            }
            // Hard reload so thumbnail / size / dimensions all refresh.
            window.location.reload();
          })
          .catch(() => {
            setError('Replace failed — file may be too large or wrong type.');
            try {
              window.dispatchEvent(
                new CustomEvent('cs-cms:toast', {
                  detail: {
                    message: 'File replacement failed — the file may be too large or the wrong type.',
                    type: 'error',
                  },
                }),
              );
            } catch {
              // ignore
            }
          })
          .finally(() => {
            setReplacing(false);
            if (input) input.value = '';
          });
      });
      document.body.appendChild(input);
      replaceInputRef.current = input;
    }
    input.click();
  }, [id]);

  // Show the Edit Image button only for raster images (the editor
  // doesn't apply to SVG / PDF / etc.).
  const isRaster = useMemo(() => {
    const m = doc?.mimeType ?? '';
    return /^image\/(jpeg|jpg|png|webp|avif|gif)$/.test(m);
  }, [doc?.mimeType]);

  if (!doc?.id || !doc.filename) {
    return null;
  }

  return (
    <div className="cs-media-self">
      <div className="cs-media-self__card">
        <button
          type="button"
          className="cs-media-self__thumb"
          aria-label="Open file in new tab"
          onClick={() => {
            if (absoluteUrl) window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl} alt={doc.alt ?? ''} loading="lazy" />
          ) : (
            <span className="cs-media-self__thumb-fallback">{doc.mimeType ?? '—'}</span>
          )}
        </button>

        <div className="cs-media-self__body">
          <div className="cs-media-self__filename-row">
            {editingFilename ? (
              <>
                <input
                  ref={filenameInputRef}
                  id={filenameInputId}
                  type="text"
                  value={filenameDraft}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFilenameDraft(e.target.value)}
                  onKeyDown={onFilenameKey}
                  className="cs-media-self__filename-input"
                  spellCheck={false}
                  autoComplete="off"
                  disabled={filenameSaving}
                  aria-label="Filename (without extension)"
                />
                <span className="cs-media-self__filename-ext" aria-hidden="true">
                  {ext}
                </span>
                <button
                  type="button"
                  className="cs-media-self__filename-save"
                  onClick={() => void onSaveRename()}
                  disabled={filenameSaving}
                >
                  {filenameSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="cs-media-self__filename-cancel"
                  onClick={onCancelRename}
                  disabled={filenameSaving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onStartRename}
                  className="cs-media-self__filename"
                  title="Click to rename"
                >
                  {doc.filename}
                </button>
                <button
                  type="button"
                  onClick={onStartRename}
                  className="cs-media-self__rename-icon"
                  aria-label="Rename file"
                  title="Click to rename"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.5 2.5a1.414 1.414 0 0 1 2 2L6 12 3 13l1-3 7.5-7.5Z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
          {meta && <p className="cs-media-self__meta">{meta}</p>}
          <div className="cs-media-self__url-row">
            <input
              type="text"
              value={absoluteUrl}
              readOnly
              className="cs-media-self__url-input"
              spellCheck={false}
              aria-label="File URL"
            />
            <button
              type="button"
              onClick={() => void onCopyUrl()}
              className={
                copyState === 'copied'
                  ? 'cs-media-self__url-action cs-media-self__url-action--copied'
                  : 'cs-media-self__url-action'
              }
              title={copyState === 'copied' ? 'Copied!' : 'Copy URL'}
              aria-label="Copy URL"
            >
              {copyState === 'copied' ? '✓' : '⧉'}
            </button>
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cs-media-self__url-action"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              ↗
            </a>
            <button
              type="button"
              onClick={onReplace}
              disabled={replacing}
              className="cs-media-self__url-action cs-media-self__url-action--text"
              title="Replace this file with a new upload"
              aria-label="Replace file"
            >
              {replacing ? '…' : 'Replace'}
            </button>
            {isRaster && (
              <button
                type="button"
                onClick={onEditImage}
                className="cs-media-self__url-action cs-media-self__url-action--text"
                title="Edit image (rotate, crop, focal point)"
                aria-label="Edit image"
              >
                Edit
              </button>
            )}
          </div>
          {liveAlt && (
            <p className="cs-media-self__alt">
              <span className="cs-media-self__alt-label">Alt:</span>{' '}
              <span className="cs-media-self__alt-value">{liveAlt}</span>
            </p>
          )}
          {error && <p className="cs-media-self__error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default MediaSelfChrome;
