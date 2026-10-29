'use client';

import type { ReactElement } from 'react';

import { type VideoStateRow, videoLength } from '../../lib/videos/video-state';

export const VideoLengthCell = ({ rowData }: { rowData?: VideoStateRow }): ReactElement => {
  const length = rowData ? videoLength(rowData) : null;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{length ?? '—'}</span>;
};

export default VideoLengthCell;
