const BARE_ID = /^[A-Za-z0-9_-]{10,64}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

/** Accepts a bare playlist id or a youtube.com URL carrying `?list=`. Anything else is null. */
export const parsePlaylistId = (raw: string): string | null => {
  const value = raw.trim();
  if (BARE_ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  const list = url.searchParams.get('list');
  return list !== null && BARE_ID.test(list) ? list : null;
};
