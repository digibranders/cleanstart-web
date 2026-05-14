'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, DragEvent, ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { PdfThumb } from './PdfThumb';

type MediaSize = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  filename?: string | null;
};

type MediaDoc = {
  id: string;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  alt?: string | null;
  sizes?: Record<string, MediaSize | undefined> | null;
};

type ClientFieldShape = {
  name?: string;
  label?: string;
  required?: boolean;
  admin?: {
    description?: string;
    custom?: { folderHint?: string; accept?: readonly string[] };
  } | null;
};

type Props = {
  path?: string;
  field?: ClientFieldShape;
  readOnly?: boolean;
};

const DEFAULT_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
] as const;

const MB = 1024 * 1024;
const IMAGE_BYTES_LIMIT = 25 * MB;
const PDF_BYTES_LIMIT = 50 * MB;
const VIDEO_BYTES_LIMIT = 200 * MB;
const ZIP_BYTES_LIMIT = 100 * MB;

const ZIP_MIMES = new Set(['application/zip', 'application/x-zip-compressed']);

const limitForMime = (mimeType: string | undefined | null): number => {
  if (!mimeType) return IMAGE_BYTES_LIMIT;
  if (mimeType.startsWith('image/')) return IMAGE_BYTES_LIMIT;
  if (mimeType === 'application/pdf') return PDF_BYTES_LIMIT;
  if (mimeType === 'video/mp4') return VIDEO_BYTES_LIMIT;
  if (ZIP_MIMES.has(mimeType)) return ZIP_BYTES_LIMIT;
  return IMAGE_BYTES_LIMIT;
};

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/svg+xml': 'SVG',
  'image/gif': 'GIF',
  'application/pdf': 'PDF',
  'video/mp4': 'MP4',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
};

const typeLabelForMime = (mime: string | undefined | null): string => {
  if (!mime) return '—';
  return MIME_LABELS[mime] ?? mime.split('/').pop()?.toUpperCase() ?? mime;
};

const formatAcceptList = (mimes: readonly string[]): string => {
  const labels: string[] = [];
  for (const m of mimes) {
    const label = MIME_LABELS[m] ?? m;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels.join(', ');
};

const formatBytes = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const pickThumbUrl = (doc: MediaDoc | null): string | null => {
  if (!doc) return null;
  const fromSizes = doc.sizes?.thumb?.url ?? doc.sizes?.card?.url ?? null;
  return fromSizes ?? doc.url ?? null;
};

const pickPreviewUrl = (doc: MediaDoc | null): string | null => {
  if (!doc) return null;
  const fromSizes =
    doc.sizes?.card?.url ?? doc.sizes?.hero?.url ?? doc.sizes?.thumb?.url ?? null;
  return fromSizes ?? doc.url ?? null;
};

const splitFilename = (filename: string): { stem: string; ext: string } => {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  // Treat leading-dot files (.htaccess) and extension-less names as stem-only.
  if (dot <= 0 || dot === trimmed.length - 1) {
    return { stem: trimmed, ext: '' };
  }
  return { stem: trimmed.slice(0, dot), ext: trimmed.slice(dot) };
};

const validateFile = (file: File, acceptedMimes: readonly string[]): string | null => {
  if (!acceptedMimes.includes(file.type)) {
    return `Unsupported file type${file.type ? ` (${file.type})` : ''}.`;
  }
  const limit = limitForMime(file.type);
  if (file.size > limit) {
    return `File too large (${formatBytes(file.size)} > ${formatBytes(limit)}).`;
  }
  return null;
};

/**
 * Custom upload field. Replaces Payload's default upload UI with a
 * single-screen experience:
 *
 *  - Empty state: Upload-from-device + Browse-existing buttons, drag-drop
 *    affordance, helper text with mime/size limits.
 *  - Filled state: 96px thumbnail, filename + dimensions + filesize meta,
 *    URL row with Copy + Open-in-new-tab, inline alt editor, Replace and
 *    Detach controls, Preview popover at 800px.
 *  - Loading state: skeleton thumbnail + linear progress bar driven by
 *    XMLHttpRequest upload progress.
 *
 * Direct uploads POST to `/api/media` so the existing Media collection
 * hooks (SVG sanitization in beforeValidate, alt auto-fill in
 * beforeChange) still run. Folder defaults to the field's
 * `admin.custom.folderHint` so each surface lands in the correct bucket.
 */
export const MediaField = (props: Props): ReactElement => {
  const path = props.path ?? props.field?.name ?? '';
  const folderHint =
    props.field?.admin?.custom?.folderHint &&
    typeof props.field.admin.custom.folderHint === 'string'
      ? props.field.admin.custom.folderHint
      : 'web/general';
  const required = Boolean(props.field?.required);
  const description = props.field?.admin?.description ?? '';
  const acceptedMimes = useMemo<readonly string[]>(() => {
    const custom = props.field?.admin?.custom?.accept;
    return Array.isArray(custom) && custom.length > 0
      ? (custom as readonly string[])
      : DEFAULT_IMAGE_MIMES;
  }, [props.field?.admin?.custom?.accept]);
  const label =
    props.field?.label ??
    (props.field?.name
      ? props.field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
      : 'Image');
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const browseRef = useRef<HTMLDivElement | null>(null);

  const { value, setValue } = useField<string | undefined | null>({ path });

  const [doc, setDoc] = useState<MediaDoc | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState('');
  const [altSaving, setAltSaving] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseResults, setBrowseResults] = useState<MediaDoc[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const altInputRef = useRef<HTMLInputElement | null>(null);
  const filenameInputRef = useRef<HTMLInputElement | null>(null);
  const browseSearchRef = useRef<HTMLInputElement | null>(null);
  const browseDialogRef = useRef<HTMLDialogElement | null>(null);
  const previewDialogRef = useRef<HTMLDialogElement | null>(null);

  const [editingFilename, setEditingFilename] = useState(false);
  const [filenameDraft, setFilenameDraft] = useState('');
  const [filenameSaving, setFilenameSaving] = useState(false);

  // Focus management: open dialogs natively + auto-focus inputs without
  // resorting to the autoFocus prop (which biome flags for a11y).
  useEffect(() => {
    if (editingAlt) altInputRef.current?.focus();
  }, [editingAlt]);

  useEffect(() => {
    if (editingFilename) {
      filenameInputRef.current?.focus();
      filenameInputRef.current?.select();
    }
  }, [editingFilename]);

  useEffect(() => {
    const dlg = browseDialogRef.current;
    if (!dlg) return;
    if (browseOpen) {
      if (!dlg.open) dlg.showModal?.();
      browseSearchRef.current?.focus();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [browseOpen]);

  useEffect(() => {
    const dlg = previewDialogRef.current;
    if (!dlg) return;
    if (previewOpen) {
      if (!dlg.open) dlg.showModal?.();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [previewOpen]);

  // Fetch the populated media doc whenever the underlying value changes.
  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setDoc(null);
      return undefined;
    }
    setDocLoading(true);
    fetch(`/api/media/${value}?depth=0`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: MediaDoc) => {
        if (cancelled) return;
        if (d?.id) setDoc(d);
      })
      .catch(() => {
        // Stale ID or permissions failure — leave doc null; the value
        // still references something but we cannot render meta. The
        // field still saves correctly because we never overwrite value.
      })
      .finally(() => {
        if (!cancelled) setDocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Browse popover — debounced search against /api/media.
  useEffect(() => {
    if (!browseOpen) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setBrowseLoading(true);
      const url = new URL('/api/media', window.location.origin);
      url.searchParams.set('limit', '24');
      url.searchParams.set('sort', '-createdAt');
      url.searchParams.set('depth', '0');
      if (browseQuery.trim().length > 0) {
        url.searchParams.set('where[filename][like]', browseQuery.trim());
      }
      fetch(url.toString(), { credentials: 'include' })
        .then((r) => r.json())
        .then((data: { docs?: MediaDoc[] }) => {
          if (cancelled) return;
          setBrowseResults(Array.isArray(data?.docs) ? data.docs : []);
        })
        .catch(() => {
          if (!cancelled) setBrowseResults([]);
        })
        .finally(() => {
          if (!cancelled) setBrowseLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [browseOpen, browseQuery]);

  // Click-outside for the browse popover.
  useEffect(() => {
    if (!browseOpen) return undefined;
    const onClick = (e: MouseEvent): void => {
      if (!browseRef.current) return;
      if (!browseRef.current.contains(e.target as Node)) setBrowseOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [browseOpen]);

  // Esc closes overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setPreviewOpen(false);
        setBrowseOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const startUpload = useCallback(
    (file: File) => {
      const v = validateFile(file, acceptedMimes);
      if (v) {
        setError(v);
        return;
      }
      setError(null);
      setUploading(true);
      setUploadingName(file.name);
      setProgress(0);

      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('_payload', JSON.stringify({ folder: folderHint }));

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(e.loaded / Math.max(1, e.total));
      };
      xhr.onload = () => {
        setUploading(false);
        setProgress(1);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText) as
              | { doc?: MediaDoc; message?: string }
              | MediaDoc;
            const newDoc: MediaDoc | undefined =
              'doc' in (json as { doc?: MediaDoc }) && (json as { doc?: MediaDoc }).doc
                ? (json as { doc: MediaDoc }).doc
                : (json as MediaDoc);
            if (newDoc?.id) {
              setDoc(newDoc);
              setValue(newDoc.id);
            } else {
              setError('Upload succeeded but the response was malformed.');
            }
          } catch {
            setError('Upload succeeded but the response was unparseable.');
          }
        } else {
          let msg = `Upload failed (${xhr.status}).`;
          try {
            const body = JSON.parse(xhr.responseText) as { errors?: { message?: string }[]; message?: string };
            if (body?.errors?.[0]?.message) msg = body.errors[0].message ?? msg;
            else if (body?.message) msg = body.message;
          } catch {
            // ignore
          }
          setError(msg);
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setError('Network error during upload.');
      };
      xhr.open('POST', '/api/media');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.withCredentials = true;
      xhr.send(fd);
    },
    [acceptedMimes, folderHint, setValue],
  );

  const onPickFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) startUpload(file);
      // Reset so picking the same filename twice still triggers change.
      e.target.value = '';
    },
    [startUpload],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (props.readOnly || uploading) return;
      const file = e.dataTransfer?.files?.[0];
      if (file) startUpload(file);
    },
    [props.readOnly, startUpload, uploading],
  );

  // Clipboard-paste support — listens at document level when the
  // field is empty + idle. Cmd+V on a screenshot or copied image
  // anywhere on an edit-view that has an empty media field will
  // upload it directly. Skipped when the active element is a
  // text input/textarea (so plain text-paste into the title /
  // abstract still works).
  const isPasteEligible = !value && !doc && !uploading;
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (props.readOnly || !isPasteEligible) return undefined;

    const onPaste = (e: globalThis.ClipboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const named =
              file.name && file.name !== 'image.png'
                ? file
                : new File([file], `pasted-${Date.now()}.${file.type.split('/')[1] ?? 'png'}`, {
                    type: file.type,
                  });
            startUpload(named);
            return;
          }
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [isPasteEligible, props.readOnly, startUpload]);

  const onDetach = useCallback(() => {
    setValue(null);
    setDoc(null);
    setError(null);
  }, [setValue]);

  const onCopyUrl = useCallback(async () => {
    const url = doc?.url ? toAbsoluteUrl(doc.url) : '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1400);
    } catch {
      // best-effort; ignore
    }
  }, [doc?.url]);

  const onSaveFilename = useCallback(async () => {
    if (!doc?.id) return;
    const { ext } = splitFilename(doc.filename ?? '');
    // The user can only edit the stem; the original extension is locked
    // so a typo can't break the storage adapter's content-type contract
    // or invalidate downstream image-rendering pipelines.
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
    setFilenameSaving(true);
    try {
      // Payload's upload collections route a `filename` PATCH through the
      // storage adapter (S3 / R2 rename, or local-FS rename) and emit a
      // fresh `url` reflecting the new path. The Media collection's
      // beforeChange hook keeps alt/folder intact, so only filename + url
      // change.
      const res = await fetch(`/api/media/${doc.id}?depth=0`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { doc?: MediaDoc };
      if (json?.doc) setDoc(json.doc);
      else {
        // Fall back to a fresh fetch so the URL is read from storage truth.
        const refetch = await fetch(`/api/media/${doc.id}?depth=0`, {
          credentials: 'include',
        });
        if (refetch.ok) setDoc((await refetch.json()) as MediaDoc);
      }
      setEditingFilename(false);
      setError(null);
    } catch {
      setError('Could not rename file. The original filename is still in use.');
    } finally {
      setFilenameSaving(false);
    }
  }, [doc, filenameDraft]);

  const onSaveAlt = useCallback(async () => {
    if (!doc?.id) return;
    setAltSaving(true);
    try {
      const res = await fetch(`/api/media/${doc.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: altDraft }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { doc?: MediaDoc };
      if (json?.doc) setDoc(json.doc);
      else setDoc({ ...doc, alt: altDraft });
      setEditingAlt(false);
    } catch {
      setError('Could not save alt text.');
    } finally {
      setAltSaving(false);
    }
  }, [altDraft, doc]);

  const onSelectExisting = useCallback(
    (selected: MediaDoc) => {
      setBrowseOpen(false);
      setError(null);
      if (selected?.id) {
        setDoc(selected);
        setValue(selected.id);
      }
    },
    [setValue],
  );

  const helperText = useMemo(() => {
    if (description) return description;
    const maxLimit = acceptedMimes.reduce(
      (max, mime) => Math.max(max, limitForMime(mime)),
      0,
    );
    const limitMb = Math.round(maxLimit / MB);
    return `${formatAcceptList(acceptedMimes)} up to ${limitMb} MB. Drag and drop, paste a URL, or click to upload.`;
  }, [acceptedMimes, description]);

  const filename = doc?.filename ?? '';
  const dimensions =
    doc?.width && doc?.height ? `${doc.width} × ${doc.height}` : '';
  const filesize = formatBytes(doc?.filesize ?? null);
  const mime = doc?.mimeType ?? '';
  const isPdf = mime === 'application/pdf';
  const absoluteUrl = doc?.url ? toAbsoluteUrl(doc.url) : '';
  // PDFs have no `sizes` map — `pickThumbUrl` would fall back to the PDF
  // URL and render as a broken image. PDFs use the PdfThumb canvas path
  // instead, so suppress the image src for them.
  const thumbUrl = isPdf ? null : pickThumbUrl(doc);
  const pdfUrl = isPdf ? absoluteUrl : null;
  const previewUrl = pickPreviewUrl(doc);

  const isEmpty = !value && !uploading;

  return (
    <div
      className="field-type cs-media-field"
      data-cs-media-field
      data-readonly={props.readOnly ? 'true' : 'false'}
    >
      <label htmlFor={inputId} className="field-label cs-media-field__label">
        <span>{label}</span>
        {required && <span className="cs-media-field__required" aria-hidden="true">*</span>}
      </label>

      {isEmpty && (
        // The dropzone is a passive container — the inner "Upload from
        // device" button is the real keyboard / click trigger. The
        // wrapper only carries drag-drop semantics, which a button or
        // role="button" container would clash with (nested button).
        <div
          className={
            dragOver
              ? 'cs-media-field__dropzone cs-media-field__dropzone--dragover'
              : 'cs-media-field__dropzone'
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!props.readOnly) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="cs-media-field__dropzone-glyph" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              {/* Upload glyph: shaft + chevron pointing up + baseline. */}
              <path
                d="M12 16V4 M8 8l4-4 4 4 M5 20h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="cs-media-field__dropzone-actions">
            <button
              type="button"
              className="cs-media-field__btn cs-media-field__btn--primary"
              disabled={props.readOnly}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload from device
            </button>
            <button
              type="button"
              className="cs-media-field__btn cs-media-field__btn--secondary"
              disabled={props.readOnly}
              onClick={() => setBrowseOpen(true)}
            >
              Attach existing
            </button>
          </div>
          <p className="cs-media-field__help">{helperText}</p>
        </div>
      )}

      {uploading && (
        <div className="cs-media-field__card cs-media-field__card--uploading">
          <div className="cs-media-field__thumb cs-media-field__thumb--skeleton" aria-hidden="true" />
          <div className="cs-media-field__body">
            <div className="cs-media-field__filename" title={uploadingName ?? ''}>
              {uploadingName ?? 'Uploading…'}
            </div>
            <div className="cs-media-field__progress" aria-label="Upload progress">
              <div
                className="cs-media-field__progress-bar"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="cs-media-field__meta">{Math.round(progress * 100)}%</div>
          </div>
        </div>
      )}

      {!isEmpty && !uploading && (
        <div className="cs-media-field__card" data-loaded={doc ? 'true' : 'false'}>
          <button
            type="button"
            className="cs-media-field__thumb"
            onClick={() => doc && setPreviewOpen(true)}
            aria-label={doc ? `Preview ${doc.filename ?? 'image'}` : 'Loading image'}
            disabled={!doc}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl} alt={doc?.alt ?? ''} loading="lazy" />
            ) : pdfUrl ? (
              <PdfThumb url={pdfUrl} filename={doc?.filename ?? undefined} />
            ) : docLoading ? (
              <span className="cs-media-field__thumb-skeleton" aria-hidden="true" />
            ) : (
              <span className="cs-media-field__thumb-fallback" aria-hidden="true">{mime || '—'}</span>
            )}
          </button>

          <div className="cs-media-field__body">
            {editingFilename ? (
              <div className="cs-media-field__filename-row">
                <span className="cs-media-field__filename-edit">
                  <input
                    ref={filenameInputRef}
                    className="cs-media-field__filename-input"
                    type="text"
                    value={filenameDraft}
                    onChange={(e) => setFilenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void onSaveFilename();
                      }
                      if (e.key === 'Escape') {
                        setEditingFilename(false);
                        setFilenameDraft(splitFilename(doc?.filename ?? '').stem);
                        setError(null);
                      }
                    }}
                    spellCheck={false}
                    aria-label="Filename (without extension)"
                  />
                  {/* Extension is locked — preserved exactly as uploaded so
                      the storage adapter's content-type stays correct. */}
                  <span
                    className="cs-media-field__filename-ext"
                    title="Extension is locked"
                  >
                    {splitFilename(doc?.filename ?? '').ext || ''}
                  </span>
                </span>
                <button
                  type="button"
                  className="cs-media-field__btn cs-media-field__btn--small cs-media-field__btn--primary"
                  onClick={() => void onSaveFilename()}
                  disabled={filenameSaving}
                >
                  {filenameSaving ? 'Renaming…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="cs-media-field__btn cs-media-field__btn--small cs-media-field__btn--subtle"
                  onClick={() => {
                    setEditingFilename(false);
                    setFilenameDraft(splitFilename(doc?.filename ?? '').stem);
                    setError(null);
                  }}
                  disabled={filenameSaving}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="cs-media-field__filename-row">
                <button
                  type="button"
                  className="cs-media-field__filename"
                  title={filename ? `${filename} — click to rename` : 'Untitled'}
                  onClick={() => {
                    setError(null);
                    setFilenameDraft(splitFilename(doc?.filename ?? '').stem);
                    setEditingFilename(true);
                  }}
                  disabled={!doc || props.readOnly}
                >
                  {filename || (docLoading ? 'Loading…' : 'Untitled')}
                </button>
                {doc && !props.readOnly && (
                  <span className="cs-media-field__rename-hint" aria-hidden="true">
                    rename
                  </span>
                )}
              </div>
            )}
            <div className="cs-media-field__meta">
              {[dimensions, filesize, mime].filter(Boolean).join(' · ') || (docLoading ? '—' : '')}
            </div>

            {absoluteUrl && (
              <div className="cs-media-field__url-row">
                <input
                  className="cs-media-field__url"
                  type="text"
                  value={absoluteUrl}
                  readOnly
                  spellCheck={false}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Public URL"
                />
                <button
                  type="button"
                  className="cs-media-field__icon-btn"
                  onClick={onCopyUrl}
                  aria-label="Copy URL"
                  title={copyState === 'copied' ? 'Copied!' : 'Copy URL'}
                >
                  {copyState === 'copied' ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect x="5" y="5" width="9" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M3 11V3.4A1.4 1.4 0 0 1 4.4 2H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
                <a
                  className="cs-media-field__icon-btn"
                  href={absoluteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Open in new tab"
                >
                  <span className="cs-sr-only">Open in new tab</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M9 3h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 3l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M11 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            )}

            <div className="cs-media-field__alt-row">
              {editingAlt ? (
                <>
                  <input
                    ref={altInputRef}
                    className="cs-media-field__alt-input"
                    type="text"
                    value={altDraft}
                    placeholder="Describe the image for screen readers"
                    onChange={(e) => setAltDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void onSaveAlt();
                      }
                      if (e.key === 'Escape') {
                        setEditingAlt(false);
                        setAltDraft(doc?.alt ?? '');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="cs-media-field__btn cs-media-field__btn--small cs-media-field__btn--primary"
                    onClick={() => void onSaveAlt()}
                    disabled={altSaving}
                  >
                    {altSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="cs-media-field__btn cs-media-field__btn--small cs-media-field__btn--subtle"
                    onClick={() => {
                      setEditingAlt(false);
                      setAltDraft(doc?.alt ?? '');
                    }}
                    disabled={altSaving}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="cs-media-field__alt-label">Alt:</span>
                  <span className="cs-media-field__alt-value" title={doc?.alt ?? ''}>
                    {doc?.alt && doc.alt.length > 0 ? doc.alt : (
                      <em className="cs-media-field__alt-empty">No alt text</em>
                    )}
                  </span>
                  <button
                    type="button"
                    className="cs-media-field__btn cs-media-field__btn--small cs-media-field__btn--subtle"
                    onClick={() => {
                      setAltDraft(doc?.alt ?? '');
                      setEditingAlt(true);
                    }}
                    disabled={!doc || props.readOnly}
                  >
                    Edit alt
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="cs-media-field__actions">
            <button
              type="button"
              className="cs-media-field__btn cs-media-field__btn--secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={props.readOnly}
            >
              Replace
            </button>
            <button
              type="button"
              className="cs-media-field__btn cs-media-field__btn--secondary"
              onClick={() => setBrowseOpen(true)}
              disabled={props.readOnly}
            >
              Browse
            </button>
            <button
              type="button"
              className="cs-media-field__btn cs-media-field__btn--destructive"
              onClick={onDetach}
              disabled={props.readOnly}
            >
              Detach
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="cs-media-field__error" role="alert">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={acceptedMimes.join(',')}
        onChange={onPickFile}
        hidden
        disabled={props.readOnly}
      />

      <dialog
        ref={browseDialogRef}
        className="cs-media-field__browse-dialog"
        aria-label="Browse media"
        onClose={() => setBrowseOpen(false)}
      >
        <div className="cs-media-field__browse" ref={browseRef}>
          <div className="cs-media-field__browse-head">
            <input
              ref={browseSearchRef}
              type="search"
              className="cs-media-field__browse-search"
              placeholder="Search by filename…"
              value={browseQuery}
              onChange={(e) => setBrowseQuery(e.target.value)}
            />
            <button
              type="button"
              className="cs-media-field__icon-btn"
              onClick={() => setBrowseOpen(false)}
              aria-label="Close"
              title="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            className="cs-media-field__browse-grid"
            onKeyDown={(e) => {
              const grid = e.currentTarget;
              const tiles = Array.from(
                grid.querySelectorAll<HTMLButtonElement>('button.cs-media-field__browse-tile'),
              );
              if (tiles.length === 0) return;
              const cols = Math.max(
                1,
                Math.floor(grid.clientWidth / (140 + 8)),
              );
              const active = document.activeElement;
              let idx = tiles.findIndex((t) => t === active);
              if (idx === -1) idx = 0;
              let nextIdx = idx;
              if (e.key === 'ArrowRight') nextIdx = Math.min(tiles.length - 1, idx + 1);
              else if (e.key === 'ArrowLeft') nextIdx = Math.max(0, idx - 1);
              else if (e.key === 'ArrowDown') nextIdx = Math.min(tiles.length - 1, idx + cols);
              else if (e.key === 'ArrowUp') nextIdx = Math.max(0, idx - cols);
              else if (e.key === 'Home') nextIdx = 0;
              else if (e.key === 'End') nextIdx = tiles.length - 1;
              else return;
              e.preventDefault();
              tiles[nextIdx]?.focus();
            }}
          >
            {browseLoading && browseResults.length === 0 ? (
              <div className="cs-media-field__browse-empty">Loading…</div>
            ) : browseResults.length === 0 ? (
              <div className="cs-media-field__browse-empty">No matches.</div>
            ) : (
              browseResults.map((m) => {
                const tileMime = m.mimeType ?? '';
                const isImage = tileMime.startsWith('image/');
                const isPdfTile = tileMime === 'application/pdf';
                const t = isImage ? pickThumbUrl(m) : null;
                const pdfTileUrl =
                  isPdfTile && m.url ? toAbsoluteUrl(m.url) : null;
                const typeLabel = typeLabelForMime(m.mimeType);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="cs-media-field__browse-tile"
                    onClick={() => onSelectExisting(m)}
                    title={m.filename ?? m.id}
                  >
                    {t ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t} alt={m.alt ?? ''} loading="lazy" />
                    ) : pdfTileUrl ? (
                      <PdfThumb
                        url={pdfTileUrl}
                        width={140}
                        filename={m.filename ?? undefined}
                      />
                    ) : (
                      <span className="cs-media-field__browse-tile-fallback">
                        {typeLabel}
                      </span>
                    )}
                    <span className="cs-media-field__browse-tile-name">{m.filename}</span>
                    <span className="cs-media-field__browse-tile-type">{typeLabel}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </dialog>

      <dialog
        ref={previewDialogRef}
        className="cs-media-field__preview-dialog"
        aria-label="Image preview"
        onClose={() => setPreviewOpen(false)}
        onClick={(e) => {
          // Native <dialog> click on the backdrop hits the dialog itself,
          // not the inner content — close on backdrop click only.
          if (e.target === previewDialogRef.current) setPreviewOpen(false);
        }}
        onKeyDown={(e) => {
          // Escape is handled natively by <dialog>; this exists to satisfy
          // biome's useKeyWithClickEvents rule for the backdrop onClick.
          if (e.key === 'Escape') setPreviewOpen(false);
        }}
      >
        {previewUrl && (
          <div className="cs-media-field__preview">
            <button
              type="button"
              className="cs-media-field__preview-close"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
              title="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={doc?.alt ?? ''} />
            <div className="cs-media-field__preview-caption">
              {filename}
              {dimensions ? ` · ${dimensions}` : ''}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

const toAbsoluteUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.origin).toString();
};

export default MediaField;
