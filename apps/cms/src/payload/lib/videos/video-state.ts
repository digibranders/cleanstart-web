export type VideoStateTone = 'live' | 'review' | 'draft' | 'problem';

export interface VideoStateRow {
  _status?: string | null;
  syncState?: string | null;
  source?: {
    privacyStatus?: string | null;
    embeddable?: boolean | null;
    durationSeconds?: number | null;
  } | null;
  durationLabel?: string | null;
}

export interface VideoState {
  label: string;
  tone: VideoStateTone;
}

/**
 * What an editor needs to know about a video at a glance. A problem outranks everything else,
 * because a live video that went private on YouTube shows a broken player on the site.
 */
export const videoState = (row: VideoStateRow): VideoState => {
  if (row.syncState === 'missing') return { label: 'Missing on YouTube', tone: 'problem' };
  if (row.source?.privacyStatus === 'private') return { label: 'Private on YouTube', tone: 'problem' };
  if (row.source?.embeddable === false) return { label: "Can't be embedded", tone: 'problem' };
  if (row._status === 'published') return { label: 'Live', tone: 'live' };
  if (row.syncState === 'needs-review') return { label: 'Needs review', tone: 'review' };
  return { label: 'Draft', tone: 'draft' };
};

/** 101 becomes "1:41", 3730 becomes "1:02:10". */
export const formatSeconds = (total: number): string => {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

/** The length YouTube reported, or the one an editor typed when YouTube had none. */
export const videoLength = (row: VideoStateRow): string | null => {
  const seconds = row.source?.durationSeconds;
  if (typeof seconds === 'number' && seconds > 0) return formatSeconds(seconds);
  return row.durationLabel?.trim() || null;
};
