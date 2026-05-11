'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

type Props = {
  readonly open: boolean;
  readonly url: string;
  readonly alt: string;
  readonly caption: string | null;
  readonly onClose: () => void;
};

/**
 * Lightweight image-preview modal opened by clicking the filename
 * label on an inline image card. Replaces Payload's stock
 * `DocumentDrawerToggler` flow which would otherwise pop the full
 * Media admin form — overkill when the editor just wants a closer
 * look at the asset.
 *
 * Reuses the existing `.cs-media-field__preview-*` styles (already
 * shipping for the hero `MediaField` Preview button) so the chrome is
 * pixel-identical across surfaces.
 */
export const InlineImagePreviewDialog = (props: Props): ReactElement => {
  const { open, url, alt, caption, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal?.();
    } else if (dlg.open) {
      dlg.close?.();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="cs-media-field__preview-dialog"
      aria-label="Image preview"
      onClose={onClose}
      onClick={(e) => {
        // Backdrop click closes.
        if (e.target === dialogRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="cs-media-field__preview">
        <button
          type="button"
          className="cs-media-field__preview-close"
          onClick={onClose}
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
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} />
        {caption && <div className="cs-media-field__preview-caption">{caption}</div>}
      </div>
    </dialog>
  );
};
