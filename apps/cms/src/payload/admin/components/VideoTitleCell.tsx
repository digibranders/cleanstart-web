'use client';

import type { ReactElement } from 'react';

type Row = { id?: string | number };

/**
 * Title cell for the Videos list. The linked column is the thumbnail, whose
 * custom cell Payload does not wrap in a link, so the title carries one too and
 * a click anywhere on the row's text opens the video.
 */
export const VideoTitleCell = ({ cellData, rowData }: { cellData?: string | null; rowData?: Row }): ReactElement => {
  const title = cellData?.trim() || 'Untitled video';
  if (rowData?.id == null) return <span>{title}</span>;
  return <a href={`/admin/collections/videos/${encodeURIComponent(String(rowData.id))}`}>{title}</a>;
};

export default VideoTitleCell;
