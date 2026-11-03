'use client';

import type { ReactElement } from 'react';

type Row = { id?: string | number; externalId?: string | null; source?: { thumbnailUrl?: string | null } | null };

export const VideoThumbCell = ({ rowData }: { rowData?: Row }): ReactElement => {
  const src =
    rowData?.source?.thumbnailUrl ||
    (rowData?.externalId ? `https://i.ytimg.com/vi/${rowData.externalId}/mqdefault.jpg` : null);
  const frame = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={64}
      height={36}
      loading="lazy"
      style={{ display: 'block', width: 64, height: 36, objectFit: 'cover', borderRadius: 4, background: 'var(--theme-elevation-100)' }}
    />
  ) : (
    <span style={{ display: 'block', width: 64, height: 36, borderRadius: 4, background: 'var(--theme-elevation-100)' }} />
  );
  // A custom cell in the first column replaces Payload's own row link, so the thumbnail links itself.
  return rowData?.id == null ? (
    frame
  ) : (
    <a href={`/admin/collections/videos/${encodeURIComponent(String(rowData.id))}`} aria-label="Open video">
      {frame}
    </a>
  );
};

export default VideoThumbCell;
