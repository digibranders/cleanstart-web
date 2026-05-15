'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

export type InlineImageFields = {
  alt: string;
  caption: string;
  alignment: 'left' | 'center' | 'right' | 'full';
  size: 'small' | 'medium' | 'large' | 'full';
  decorative: boolean;
};

export const DEFAULT_INLINE_IMAGE_FIELDS: InlineImageFields = {
  alt: '',
  caption: '',
  alignment: 'center',
  size: 'large',
  decorative: false,
};

const ALIGNMENTS: ReadonlyArray<{ value: InlineImageFields['alignment']; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'full', label: 'Full' },
];

const SIZES: ReadonlyArray<{ value: InlineImageFields['size']; label: string }> = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'full', label: 'Full' },
];

type MediaDoc = {
  id: string;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  folder?: string | null;
  focalPoint?: { x?: number | null; y?: number | null } | null;
  sizes?: Record<string, { url?: string | null } | undefined> | null;
};

type Props = {
  readonly open: boolean;
  readonly mediaId: string;
  readonly initial: InlineImageFields;
  readonly onClose: () => void;
  readonly onSave: (next: InlineImageFields) => void;
  readonly onReplace: () => void;
  readonly onRemove: () => void;
};

const formatBytes = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const splitFilename = (filename: string): { stem: string; ext: string } => {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0 || dot === trimmed.length - 1) return { stem: trimmed, ext: '' };
  return { stem: trimmed.slice(0, dot), ext: trimmed.slice(dot) };
};

const pickPreviewUrl = (doc: MediaDoc | null): string | null => {
  if (!doc) return null;
  return (
    doc.sizes?.card?.url ?? doc.sizes?.hero?.url ?? doc.sizes?.thumb?.url ?? doc.url ?? null
  );
};

/**
 * Per-placement edit dialog for an inline image — replaces Payload's
 * stock `FieldsDrawer` AND surfaces every Media-doc control the admin
 * Media editor exposes (filename rename, focal point picker, default
 * alt, credit, folder) so the editor never needs to leave the post to
 * adjust the asset.
 *
 * Two-column layout:
 *   • Left  — preview with a click-to-set focal-point overlay, file
 *             meta (dimensions / filesize / mime), filename rename.
 *   • Right — Placement section (alt-this-placement, caption,
 *             alignment, size, decorative) above a Media-library
 *             section (default alt, credit, folder readout).
 *
 * Media-doc fields are persisted via PATCH `/api/media/:id` (same
 * boundary the hero `MediaField` uses). Placement fields are pushed
 * back to the lexical node via the `onSave` callback. Both writes
 * happen on a single click of "Save changes".
 */
export const InlineImageEditDialog = (props: Props): ReactElement => {
  const { open, mediaId, initial, onClose, onSave, onReplace, onRemove } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const filenameInputRef = useRef<HTMLInputElement | null>(null);
  const focalAreaRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  // Per-placement state (writes to lexical node on save).
  const [alt, setAlt] = useState(initial.alt);
  const [caption, setCaption] = useState(initial.caption);
  const [alignment, setAlignment] = useState<InlineImageFields['alignment']>(initial.alignment);
  const [size, setSize] = useState<InlineImageFields['size']>(initial.size);
  const [decorative, setDecorative] = useState(initial.decorative);

  // Media-doc state (writes to /api/media/:id on save).
  const [doc, setDoc] = useState<MediaDoc | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [editingFilename, setEditingFilename] = useState(false);
  const [filenameDraft, setFilenameDraft] = useState('');
  const [defaultAlt, setDefaultAlt] = useState('');
  const [credit, setCredit] = useState('');
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed per-placement state on each open.
  useEffect(() => {
    if (open) {
      setAlt(initial.alt);
      setCaption(initial.caption);
      setAlignment(initial.alignment);
      setSize(initial.size);
      setDecorative(initial.decorative);
      setError(null);
    }
  }, [open, initial.alt, initial.caption, initial.alignment, initial.size, initial.decorative]);

  // Fetch the linked Media doc every time the dialog opens against a
  // new id so the form reflects current truth (filename, focal, etc.)
  // even if the doc was edited from elsewhere since the last edit.
  useEffect(() => {
    if (!open || !mediaId) return undefined;
    let cancelled = false;
    setDocLoading(true);
    fetch(`/api/media/${mediaId}?depth=0`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: MediaDoc) => {
        if (cancelled || !d?.id) return;
        setDoc(d);
        setDefaultAlt(d.alt ?? '');
        setCredit(d.credit ?? '');
        setFocalX(typeof d.focalPoint?.x === 'number' ? d.focalPoint.x : 50);
        setFocalY(typeof d.focalPoint?.y === 'number' ? d.focalPoint.y : 50);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load media metadata.');
      })
      .finally(() => {
        if (!cancelled) setDocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mediaId]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  useEffect(() => {
    if (editingFilename) {
      filenameInputRef.current?.focus();
      filenameInputRef.current?.select();
    }
  }, [editingFilename]);

  const previewUrl = useMemo(() => pickPreviewUrl(doc), [doc]);
  const filenameParts = useMemo(() => splitFilename(doc?.filename ?? ''), [doc?.filename]);
  const dimensions =
    doc?.width && doc?.height ? `${doc.width} × ${doc.height}` : '';
  const filesize = formatBytes(doc?.filesize ?? null);
  const fileMeta = [dimensions, filesize, doc?.mimeType ?? ''].filter(Boolean).join(' · ');

  const onFocalClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = focalAreaRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setFocalX(Math.round(x));
    setFocalY(Math.round(y));
  }, []);

  const onSaveFilename = useCallback(async () => {
    if (!doc?.id) return;
    const { ext } = filenameParts;
    const stem = filenameDraft.trim().replace(/[\\/]/g, '-');
    if (stem.length === 0) {
      setEditingFilename(false);
      return;
    }
    const next = `${stem}${ext}`;
    if (next === doc.filename) {
      setEditingFilename(false);
      return;
    }
    try {
      const res = await fetch(`/api/media/${doc.id}?depth=0`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { doc?: MediaDoc };
      if (json?.doc) setDoc(json.doc);
      setEditingFilename(false);
      setError(null);
    } catch {
      setError('Could not rename file.');
    }
  }, [doc, filenameDraft, filenameParts]);

  const handleSaveAll = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      // 1) Update Media doc (default alt, credit, focal point).
      //    Filename + folder are intentionally not bulk-saved here —
      //    filename has its own inline rename flow (avoids accidental
      //    storage moves), folder is read-only in this UI.
      if (doc?.id) {
        const mediaPatch: Record<string, unknown> = {
          alt: defaultAlt,
          credit: credit || null,
          focalPoint: { x: focalX, y: focalY },
        };
        const res = await fetch(`/api/media/${doc.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mediaPatch),
        });
        if (!res.ok) {
          const body = await res.text();
          let message = `Could not save media (${res.status}).`;
          try {
            const parsed = JSON.parse(body) as { errors?: { message?: string }[] };
            if (parsed?.errors?.[0]?.message) message = parsed.errors[0].message ?? message;
          } catch {
            /* keep default */
          }
          throw new Error(message);
        }
      }

      // 2) Write per-placement fields back to the lexical node.
      onSave({
        alt: alt.trim(),
        caption: caption.trim(),
        alignment,
        size,
        decorative,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }, [
    doc?.id,
    defaultAlt,
    credit,
    focalX,
    focalY,
    onSave,
    alt,
    caption,
    alignment,
    size,
    decorative,
  ]);

  return (
    <dialog
      ref={dialogRef}
      className="cs-inline-image-dialog cs-inline-image-dialog--wide"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="cs-inline-image-dialog__panel cs-inline-image-edit2">
        <header className="cs-inline-image-dialog__head">
          <h2 id={titleId} className="cs-inline-image-dialog__title">
            Edit image
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

        <div className="cs-inline-image-edit2__body">
          {/* LEFT — preview, focal point, file meta, filename */}
          <div className="cs-inline-image-edit2__left">
            <button
              type="button"
              ref={focalAreaRef}
              className="cs-inline-image-edit2__preview"
              onClick={onFocalClick}
              aria-label="Set focal point by clicking the image"
              title="Click to set focal point"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={alt || defaultAlt || ''} draggable={false} />
              ) : (
                <span className="cs-inline-image-edit2__preview-skeleton" aria-hidden="true">
                  {docLoading ? 'Loading…' : 'No preview'}
                </span>
              )}
              {previewUrl && (
                <span
                  className="cs-inline-image-edit2__focal-dot"
                  style={{ left: `${focalX}%`, top: `${focalY}%` }}
                  aria-hidden="true"
                />
              )}
            </button>

            <div className="cs-inline-image-edit2__focal-row">
              <label className="cs-inline-image-edit2__focal-input">
                <span>X</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={focalX}
                  onChange={(e) => setFocalX(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
                <span aria-hidden="true">%</span>
              </label>
              <label className="cs-inline-image-edit2__focal-input">
                <span>Y</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={focalY}
                  onChange={(e) => setFocalY(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                />
                <span aria-hidden="true">%</span>
              </label>
              <button
                type="button"
                className="cs-inline-image-edit2__chip"
                onClick={() => {
                  setFocalX(50);
                  setFocalY(50);
                }}
                title="Reset to center"
              >
                Reset
              </button>
            </div>

            <div className="cs-inline-image-edit2__meta">{fileMeta || (docLoading ? '—' : '')}</div>

            <div className="cs-inline-image-edit2__filename">
              {editingFilename ? (
                <>
                  <input
                    ref={filenameInputRef}
                    type="text"
                    className="cs-inline-image-dialog__input"
                    value={filenameDraft}
                    onChange={(e) => setFilenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void onSaveFilename();
                      }
                      if (e.key === 'Escape') { setEditingFilename(false); setError(null); }
                    }}
                    spellCheck={false}
                    aria-label="Filename (extension locked)"
                  />
                  <span className="cs-inline-image-edit2__ext" title="Extension is locked">
                    {filenameParts.ext}
                  </span>
                  <button
                    type="button"
                    className="cs-inline-image-edit2__chip cs-inline-image-edit2__chip--primary"
                    onClick={() => void onSaveFilename()}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span className="cs-inline-image-edit2__filename-text" title={doc?.filename ?? ''}>
                    {doc?.filename || (docLoading ? 'Loading…' : 'Untitled')}
                  </span>
                  <button
                    type="button"
                    className="cs-inline-image-edit2__chip"
                    disabled={!doc}
                    onClick={() => {
                      setError(null);
                      setFilenameDraft(filenameParts.stem);
                      setEditingFilename(true);
                    }}
                  >
                    Rename
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — placement fields + media-library fields */}
          <div className="cs-inline-image-edit2__right">
            <section className="cs-inline-image-edit2__section">
              <h3 className="cs-inline-image-edit2__section-title">Placement</h3>

              <label className="cs-inline-image-dialog__label" htmlFor={`${titleId}-alt`}>
                Alt (this placement)
              </label>
              <input
                id={`${titleId}-alt`}
                type="text"
                className="cs-inline-image-dialog__input"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder={defaultAlt || 'Describe the image for this context'}
                disabled={decorative}
              />

              <label className="cs-inline-image-dialog__label" htmlFor={`${titleId}-caption`}>
                Caption
              </label>
              <input
                id={`${titleId}-caption`}
                type="text"
                className="cs-inline-image-dialog__input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption shown below the image"
              />

              <div className="cs-inline-image-edit2__row">
                <fieldset className="cs-inline-image-edit__fieldset">
                  <legend className="cs-inline-image-dialog__label">Alignment</legend>
                  <div className="cs-inline-image-edit__toggle-group">
                    {ALIGNMENTS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={alignment === opt.value}
                        className={`cs-inline-image-edit__toggle${alignment === opt.value ? ' is-active' : ''}`}
                        onClick={() => setAlignment(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="cs-inline-image-edit__fieldset">
                  <legend className="cs-inline-image-dialog__label">Size</legend>
                  <div className="cs-inline-image-edit__toggle-group">
                    {SIZES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={size === opt.value}
                        className={`cs-inline-image-edit__toggle${size === opt.value ? ' is-active' : ''}`}
                        onClick={() => setSize(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <label className="cs-inline-image-edit__checkbox">
                <input
                  type="checkbox"
                  checked={decorative}
                  onChange={(e) => setDecorative(e.target.checked)}
                />
                <span>Decorative (suppress alt requirement)</span>
              </label>
            </section>

            <section className="cs-inline-image-edit2__section">
              <h3 className="cs-inline-image-edit2__section-title">Media library</h3>

              <label className="cs-inline-image-dialog__label" htmlFor={`${titleId}-default-alt`}>
                Default alt
              </label>
              <input
                id={`${titleId}-default-alt`}
                type="text"
                className="cs-inline-image-dialog__input"
                value={defaultAlt}
                onChange={(e) => setDefaultAlt(e.target.value)}
                placeholder="Stored on the media doc; used wherever no per-placement alt is set"
              />

              <label className="cs-inline-image-dialog__label" htmlFor={`${titleId}-credit`}>
                Credit
              </label>
              <input
                id={`${titleId}-credit`}
                type="text"
                className="cs-inline-image-dialog__input"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="Photographer / source attribution"
              />

              {doc?.folder && (
                <div className="cs-inline-image-edit2__folder">
                  <span className="cs-inline-image-dialog__label">Folder</span>
                  <code className="cs-inline-image-edit2__code">{doc.folder}</code>
                </div>
              )}
            </section>
          </div>
        </div>

        {error && (
          <div className="cs-inline-image-dialog__error" role="alert">
            {error}
          </div>
        )}

        <footer className="cs-inline-image-edit__footer">
          <div className="cs-inline-image-edit__footer-secondary">
            <button
              type="button"
              className="cs-inline-image-edit__btn cs-inline-image-edit__btn--secondary"
              onClick={onReplace}
            >
              Replace image
            </button>
            <button
              type="button"
              className="cs-inline-image-edit__btn cs-inline-image-edit__btn--destructive"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
          <button
            type="button"
            className="cs-inline-image-dialog__primary"
            disabled={saving}
            onClick={() => void handleSaveAll()}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </dialog>
  );
};

