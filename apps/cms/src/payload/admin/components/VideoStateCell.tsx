'use client';

import type { ReactElement } from 'react';

import { type VideoStateRow, type VideoStateTone, videoState } from '../../lib/videos/video-state';

const TONES: Record<VideoStateTone, { background: string; color: string }> = {
  live: { background: 'var(--theme-success-100)', color: 'var(--theme-success-800)' },
  review: { background: 'var(--theme-warning-100)', color: 'var(--theme-warning-800)' },
  draft: { background: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-800)' },
  problem: { background: 'var(--theme-error-100)', color: 'var(--theme-error-800)' },
};

export const VideoStateCell = ({ rowData }: { rowData?: VideoStateRow }): ReactElement | null => {
  if (!rowData) return null;
  const { label, tone } = videoState(rowData);
  return (
    <span
      style={{
        ...TONES[tone],
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export default VideoStateCell;
