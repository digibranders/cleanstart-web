// Pure and free of Node imports: used by the admin preview and by the field's server-side hook.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The 11-character YouTube video id from a bare id or from a watch, short, embed, shorts or live link.
 * Returns null for anything else, so a typo is reported to the editor instead of saved.
 */
export const youtubeIdFrom = (input: string | null | undefined): string | null => {
  const text = (input ?? '').trim();
  if (VIDEO_ID.test(text)) return text;
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') candidate = url.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [first, second] = url.pathname.split('/').filter(Boolean);
    if (first === 'watch') candidate = url.searchParams.get('v');
    else if (first === 'embed' || first === 'shorts' || first === 'live' || first === 'v') candidate = second ?? null;
  }
  return candidate !== null && VIDEO_ID.test(candidate) ? candidate : null;
};
