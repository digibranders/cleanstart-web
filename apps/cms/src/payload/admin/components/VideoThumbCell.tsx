'use client';

import type { ReactElement } from 'react';

type Row = { externalId?: string | null; source?: { thumbnailUrl?: string | null } | null };

export const VideoThumbCell = ({ rowData }: { rowData?: Row }): ReactElement => {
  const src =
    rowData?.source?.thumbnailUrl ||
    (rowData?.externalId ? `https://i.ytimg.com/vi/${rowData.externalId}/mqdefault.jpg` : null);
  return src ? (
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
};

export default VideoThumbCell;
