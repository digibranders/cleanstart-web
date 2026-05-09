'use client';

import { useField } from '@payloadcms/ui';
import type { UploadFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { MediaBrowseDialog, type MediaBrowseDoc } from '../MediaBrowseDialog';

type StoredValue = string | number | null | undefined;

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const pickThumb = (doc: MediaBrowseDoc): string | null => {
  const fromSizes = doc.sizes?.thumb?.url ?? doc.sizes?.card?.url ?? null;
  return fromSizes ?? doc.url ?? null;
};

/**
 * Custom upload field. Reuses the existing MediaBrowseDialog
 * (thumbnail-grid picker that already replaced the stock upload drawer
 * for the OG image picker). Single-relation only at v1; hasMany falls
 * back to the stock upload drawer until we extend MediaBrowseDialog with
 * multi-select.
 */
export const UploadField = (props: UploadFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<StoredValue>({ path });

  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState<MediaBrowseDoc | null>(null);

  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const relationTo = typeof field.relationTo === 'string' ? field.relationTo : 'media';
  const readOnly = field.admin?.readOnly === true;

  useEffect(() => {
    if (value == null) {
      setResolved(null);
      return;
    }
    const id = String(value);
    let cancelled = false;
    fetch(`/api/${relationTo}/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: MediaBrowseDoc | null) => {
        if (!cancelled) setResolved(doc ?? null);
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, relationTo]);

  const thumb = resolved ? pickThumb(resolved) : null;

  return (
    <div
      className={`field-type upload cs-upload-field${
        showError ? ' cs-upload-field--error' : ''
      }`}
    >
      <span className="field-label">
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <div className="cs-upload-field__row">
        {thumb ? (
          <img className="cs-upload-field__preview" src={thumb} alt={resolved?.alt ?? ''} />
        ) : (
          <span className="cs-upload-field__preview cs-upload-field__preview--empty">
            No image
          </span>
        )}
        <div className="cs-upload-field__meta">
          {resolved ? (
            <>
              <span className="cs-upload-field__filename">{resolved.filename ?? '(unnamed)'}</span>
              <span className="cs-upload-field__type">{resolved.mimeType ?? ''}</span>
            </>
          ) : (
            <span className="cs-upload-field__filename cs-upload-field__filename--empty">
              No file selected
            </span>
          )}
        </div>
        {!readOnly ? (
          <div className="cs-upload-field__actions">
            <button
              type="button"
              className="cs-btn cs-btn--subtle"
              onClick={() => setOpen(true)}
            >
              {value ? 'Change' : 'Choose'}
            </button>
            {value ? (
              <button
                type="button"
                className="cs-btn cs-btn--subtle"
                onClick={() => setValue(null)}
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
      <MediaBrowseDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(doc) => {
          setValue(doc.id);
          setOpen(false);
        }}
      />
    </div>
  );
};

export default UploadField;
