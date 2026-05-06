'use client';

import { useEffect, useState, type ReactElement } from 'react';

type MediaSize = { url?: string | null };
type MediaDoc = {
  id: string;
  filename?: string | null;
  mimeType?: string | null;
  url?: string | null;
  alt?: string | null;
  sizes?: Record<string, MediaSize | undefined> | null;
};

type Props = {
  cellData?: string | MediaDoc | null;
};

/**
 * List-view cell for upload fields. Replaces the default ID-only cell
 * with a 24×24 thumbnail + filename. Accepts either a populated media
 * doc (when the column was queried with depth >= 1) or a raw ID string,
 * fetching the doc if needed.
 */
export const MediaCell = (props: Props): ReactElement => {
  const initial: MediaDoc | null =
    typeof props.cellData === 'object' && props.cellData
      ? (props.cellData as MediaDoc)
      : null;
  const initialId =
    typeof props.cellData === 'string'
      ? props.cellData
      : initial?.id ?? null;

  const [doc, setDoc] = useState<MediaDoc | null>(initial);

  useEffect(() => {
    if (doc || !initialId) return;
    let cancelled = false;
    fetch(`/api/media/${initialId}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: MediaDoc | null) => {
        if (!cancelled && d?.id) setDoc(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doc, initialId]);

  if (!initialId) {
    return <span className="cs-media-cell cs-media-cell--empty">—</span>;
  }

  const thumb =
    doc?.sizes?.thumb?.url ?? doc?.sizes?.card?.url ?? doc?.url ?? null;
  const name = doc?.filename ?? initialId;

  return (
    <span className="cs-media-cell">
      <span className="cs-media-cell__thumb" aria-hidden="true">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <span className="cs-media-cell__thumb-fallback" />
        )}
      </span>
      <span className="cs-media-cell__name" title={name}>
        {name}
      </span>
    </span>
  );
};

export default MediaCell;
