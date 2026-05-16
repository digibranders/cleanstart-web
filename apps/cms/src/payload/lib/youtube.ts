const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/,
];

export const extractYoutubeId = (raw: string | null | undefined): string | null => {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value.length === 0) return null;
  if (YT_ID_RE.test(value)) return value;
  for (const re of PATTERNS) {
    const match = re.exec(value);
    if (match?.[1]) return match[1];
  }
  return null;
};

export const validateYoutubeUrl = (
  value: string | string[] | null | undefined,
): true | string => {
  if (value == null) return true;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'YouTube URL is required.';
  }
  if (extractYoutubeId(value) === null) {
    return 'Must be a YouTube URL (youtube.com/watch?v=…, youtu.be/…, or youtube.com/embed/…).';
  }
  return true;
};
