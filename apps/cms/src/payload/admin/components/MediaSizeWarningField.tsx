'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

const FILESIZE_WARN_BYTES = 2 * 1024 * 1024; // 2 MB
const PIXEL_WARN_DIM = 4000;

interface SizeWarning {
  readonly kind: 'filesize' | 'pixels' | 'both';
  readonly message: string;
}

const buildWarning = (
  filesize: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
): SizeWarning | null => {
  const oversize =
    typeof filesize === 'number' && filesize > FILESIZE_WARN_BYTES;
  const overpixel =
    (typeof width === 'number' && width > PIXEL_WARN_DIM) ||
    (typeof height === 'number' && height > PIXEL_WARN_DIM);

  if (!oversize && !overpixel) return null;

  const parts: string[] = [];
  if (oversize) {
    const mb = (filesize ?? 0) / (1024 * 1024);
    parts.push(`${mb.toFixed(1)} MB on disk — Core Web Vitals will suffer`);
  }
  if (overpixel) {
    parts.push(
      `${width ?? '?'}×${height ?? '?'} pixels — bigger than the 2400px hero render-out`,
    );
  }

  const kind: SizeWarning['kind'] =
    oversize && overpixel ? 'both' : oversize ? 'filesize' : 'pixels';
  return { kind, message: parts.join(' · ') };
};

/**
 * Mounted on the Media doc edit view. Surfaces a soft warning chip
 * when the upload is heavy enough to hurt LCP scores or larger than
 * any rendering surface will use:
 *
 *   - filesize > 2 MB → file-size warning
 *   - width OR height > 4000 px → pixel-dim warning
 *
 * Doesn't block the save — Payload's existing `checkUploadSize` hard-
 * limits at the upload-limits ceilings (8 MB images / 32 MB PDFs).
 * This sits between "fine" and "rejected": editors-should-know-but-
 * may-have-good-reason.
 */
export const MediaSizeWarningField = (): ReactElement | null => {
  const { value: mimeType } = useField<string>({ path: 'mimeType' });
  const { value: filesize } = useField<number>({ path: 'filesize' });
  const { value: width } = useField<number>({ path: 'width' });
  const { value: height } = useField<number>({ path: 'height' });

  const warning = useMemo(
    () => buildWarning(filesize, width, height),
    [filesize, width, height],
  );

  // Non-image rows don't see the pixel check, but a 50 MB PDF still
  // wants the size warning. We render whenever there's anything to say.
  if (!warning) return null;
  void mimeType; // referenced so a future per-mime tweak has the value handy

  return (
    <output
      aria-live="polite"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '8px 10px',
        marginBottom: 'var(--cs-space-3, 12px)',
        background: '#3a2f0f',
        border: '1px solid #c79a2e',
        borderRadius: 6,
        color: '#f0c45a',
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <span aria-hidden style={{ fontWeight: 700 }}>!</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Heavy asset</span>
        <span style={{ display: 'block' }}>{warning.message}</span>
      </span>
    </output>
  );
};
