export type EmbedMode = 'iframe' | 'script';

export type EmbedProvider =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'calendly'
  | 'tidycal'
  | 'typeform'
  | 'tally'
  | 'figma'
  | 'wistia'
  | 'mux'
  | 'descript'
  | 'arcade'
  | 'spotify'
  | 'soundcloud'
  | 'google-maps'
  | 'generic';

export type EmbedAspectRatio = '16-9' | '4-3' | '1-1' | '9-16' | 'auto';

type ProviderConfig = {
  readonly id: EmbedProvider;
  readonly label: string;
  readonly pattern: RegExp;
  readonly toEmbedUrl: (url: string) => string | null;
  readonly defaultAspectRatio: EmbedAspectRatio;
  readonly extraSandbox?: readonly string[];
};

const BASELINE_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation';

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] ?? null;
    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = u.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1] ?? null;
    // youtube.com/embed/VIDEO_ID — already embed
    const embedMatch = u.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1] ?? null;
    // youtube.com/watch?v=VIDEO_ID
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    // player.vimeo.com/video/ID — already embed
    const playerMatch = u.pathname.match(/^\/video\/(\d+)/);
    if (playerMatch) return playerMatch[1] ?? null;
    // vimeo.com/ID or vimeo.com/channels/.../ID
    const idMatch = u.pathname.match(/\/(\d+)(?:[/?#]|$)/);
    return idMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractLoomId(url: string): string | null {
  try {
    const u = new URL(url);
    const shareMatch = u.pathname.match(/^\/(?:share|embed)\/([^/?]+)/);
    return shareMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractWistiaHash(url: string): string | null {
  try {
    const u = new URL(url);
    // fast.wistia.com/embed/iframe/HASH — already embed
    const iframeMatch = u.pathname.match(/\/embed\/iframe\/([^/?]+)/);
    if (iframeMatch) return iframeMatch[1] ?? null;
    // wistia.com/medias/HASH
    const mediaMatch = u.pathname.match(/\/medias\/([^/?]+)/);
    return mediaMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractMuxPlaybackId(url: string): string | null {
  try {
    const u = new URL(url);
    // player.mux.com/PLAYBACK_ID — already embed form
    if (u.hostname === 'player.mux.com') {
      return u.pathname.slice(1).split('/')[0] ?? null;
    }
    // stream.mux.com/PLAYBACK_ID.m3u8 — share/CDN form
    if (u.hostname === 'stream.mux.com') {
      return u.pathname.slice(1).replace(/\.m3u8$/, '').split('/')[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function extractSpotifyPath(url: string): string | null {
  try {
    const u = new URL(url);
    // open.spotify.com/track/ID, /album/ID, /playlist/ID, /episode/ID, /show/ID
    // open.spotify.com/embed/track/ID — already embed
    const embedMatch = u.pathname.match(/^\/embed(\/.*)/);
    if (embedMatch) return embedMatch[1] ?? null;
    const shareMatch = u.pathname.match(/^\/(track|album|playlist|episode|show)(\/.*)/);
    if (shareMatch) return `/${shareMatch[1]}${shareMatch[2]}`;
    return null;
  } catch {
    return null;
  }
}

function extractSoundCloudUrl(url: string): string | null {
  try {
    // SoundCloud embed requires their oEmbed proxy; we build the API URL
    // which returns an iframe src. Since we can't make HTTP calls at insert
    // time in the editor, we pass the share URL directly through the
    // SoundCloud embed widget URL format instead.
    // https://w.soundcloud.com/player/?url=<encoded>
    const u = new URL(url);
    if (u.hostname.includes('soundcloud.com') && !u.hostname.startsWith('w.')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300b4d8&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`;
    }
    // Already a widget URL
    return url;
  } catch {
    return null;
  }
}

function extractGoogleMapsEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Already an embed URL: google.com/maps/embed
    if (u.pathname.startsWith('/maps/embed')) return url;
    // Share URL: google.com/maps/place/... or maps.google.com or maps.app.goo.gl
    // For share URLs we can't reliably transform to embed without the Maps API
    // key, so we pass through and let the browser handle it.  Most Google Maps
    // share links render fine in a sandboxed iframe.
    return url;
  } catch {
    return null;
  }
}

function extractDescriptId(url: string): string | null {
  try {
    const u = new URL(url);
    // share.descript.com/view/ID
    const match = u.pathname.match(/^\/view\/([^/?]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractArcadeId(url: string): string | null {
  try {
    const u = new URL(url);
    // app.arcade.software/m/ID or demo.arcade.software/m/ID
    const match = u.pathname.match(/^\/m\/([^/?]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractTallyFormId(url: string): string | null {
  try {
    const u = new URL(url);
    // tally.so/r/FORM_ID  — share URL
    // tally.so/embed/FORM_ID — already embed
    const embedMatch = u.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1] ?? null;
    const shareMatch = u.pathname.match(/^\/r\/([^/?]+)/);
    return shareMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

const PROVIDER_CONFIGS: ReadonlyArray<ProviderConfig> = [
  {
    id: 'youtube',
    label: 'YouTube',
    pattern:
      /^https?:\/\/(www\.)?(youtube\.com\/(watch|embed|shorts)|youtu\.be)\//i,
    toEmbedUrl: (url) => {
      const id = extractYouTubeId(url);
      if (!id) return null;
      return `https://www.youtube.com/embed/${id}?rel=0`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'vimeo',
    label: 'Vimeo',
    pattern: /^https?:\/\/(www\.|player\.)?vimeo\.com\//i,
    toEmbedUrl: (url) => {
      const id = extractVimeoId(url);
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'loom',
    label: 'Loom',
    pattern: /^https?:\/\/(www\.)?loom\.com\/(share|embed)\//i,
    toEmbedUrl: (url) => {
      const id = extractLoomId(url);
      if (!id) return null;
      return `https://www.loom.com/embed/${id}`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'calendly',
    label: 'Calendly',
    pattern: /^https?:\/\/(www\.)?calendly\.com\//i,
    toEmbedUrl: (url) => url,
    defaultAspectRatio: '1-1',
    extraSandbox: ['allow-top-navigation-by-user-activation'],
  },
  {
    id: 'typeform',
    label: 'Typeform',
    pattern: /^https?:\/\/([a-z0-9-]+\.)?typeform\.com\//i,
    toEmbedUrl: (url) => url,
    defaultAspectRatio: '1-1',
  },
  {
    id: 'figma',
    label: 'Figma',
    pattern: /^https?:\/\/(www\.)?figma\.com\/(file|proto|design)\//i,
    toEmbedUrl: (url) =>
      `https://www.figma.com/embed?embed_host=cleanstart&url=${encodeURIComponent(url)}`,
    defaultAspectRatio: '4-3',
  },
  {
    id: 'wistia',
    label: 'Wistia',
    pattern: /^https?:\/\/([a-z0-9-]+\.)?wistia\.(com|net)\//i,
    toEmbedUrl: (url) => {
      const hash = extractWistiaHash(url);
      if (!hash) return null;
      return `https://fast.wistia.com/embed/iframe/${hash}`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'mux',
    label: 'Mux',
    pattern: /^https?:\/\/(stream|player)\.mux\.com\//i,
    toEmbedUrl: (url) => {
      const id = extractMuxPlaybackId(url);
      if (!id) return null;
      return `https://player.mux.com/${id}`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'tidycal',
    label: 'TidyCal',
    pattern: /^https?:\/\/(www\.)?tidycal\.com\//i,
    toEmbedUrl: (url) => url,
    defaultAspectRatio: '1-1',
    extraSandbox: ['allow-top-navigation-by-user-activation'],
  },
  {
    id: 'tally',
    label: 'Tally',
    pattern: /^https?:\/\/(www\.)?tally\.so\//i,
    toEmbedUrl: (url) => {
      const id = extractTallyFormId(url);
      if (!id) return null;
      return `https://tally.so/embed/${id}?alignLeft=1&hideTitle=0&transparentBackground=0`;
    },
    defaultAspectRatio: 'auto',
  },
  {
    id: 'descript',
    label: 'Descript',
    pattern: /^https?:\/\/share\.descript\.com\//i,
    toEmbedUrl: (url) => {
      const id = extractDescriptId(url);
      if (!id) return null;
      return `https://share.descript.com/embed/${id}`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'arcade',
    label: 'Arcade',
    pattern: /^https?:\/\/(app|demo)\.arcade\.software\/m\//i,
    toEmbedUrl: (url) => {
      const id = extractArcadeId(url);
      if (!id) return null;
      return `https://demo.arcade.software/m/${id}?embed&embed_mobile=tab&embed_desktop=inline`;
    },
    defaultAspectRatio: '16-9',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    pattern: /^https?:\/\/open\.spotify\.com\//i,
    toEmbedUrl: (url) => {
      const path = extractSpotifyPath(url);
      if (!path) return null;
      return `https://open.spotify.com/embed${path}`;
    },
    defaultAspectRatio: 'auto',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    pattern: /^https?:\/\/(www\.|w\.)?soundcloud\.com\//i,
    toEmbedUrl: (url) => extractSoundCloudUrl(url),
    defaultAspectRatio: 'auto',
  },
  {
    id: 'google-maps',
    label: 'Google Maps',
    pattern: /^https?:\/\/(www\.)?google\.(com|[a-z]{2,3})\/(maps|maps\/embed)|^https?:\/\/maps\.(google|app\.goo)\.gl\//i,
    toEmbedUrl: (url) => extractGoogleMapsEmbedUrl(url),
    defaultAspectRatio: '4-3',
  },
];

export function detectProvider(url: string): EmbedProvider {
  for (const config of PROVIDER_CONFIGS) {
    if (config.pattern.test(url)) return config.id;
  }
  return 'generic';
}

export function embedUrlForProvider(
  url: string,
  provider: EmbedProvider,
): string | null {
  if (provider === 'generic') return url || null;
  const config = PROVIDER_CONFIGS.find((c) => c.id === provider);
  if (!config) return url || null;
  return config.toEmbedUrl(url);
}

export function defaultAspectRatioForProvider(
  provider: EmbedProvider,
): EmbedAspectRatio {
  const config = PROVIDER_CONFIGS.find((c) => c.id === provider);
  return config?.defaultAspectRatio ?? 'auto';
}

export function providerLabel(provider: EmbedProvider): string {
  const config = PROVIDER_CONFIGS.find((c) => c.id === provider);
  return config?.label ?? 'Embed';
}

export function sandboxForProvider(provider: EmbedProvider): string {
  const config = PROVIDER_CONFIGS.find((c) => c.id === provider);
  const extras = config?.extraSandbox ?? [];
  return extras.length > 0
    ? `${BASELINE_SANDBOX} ${extras.join(' ')}`
    : BASELINE_SANDBOX;
}
