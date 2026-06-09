/**
 * Whether this deployment may be indexed by search engines (robots `Allow`) and
 * may ping IndexNow.
 *
 * Indexing is allowed **only on the production site** (www.cleanstart.com).
 * Staging/preview deploys run with `NODE_ENV=production` too, so production is an
 * *explicit* signal: `PAYLOAD_PUBLIC_ENV=production`. The
 * `PAYLOAD_PUBLIC_ROBOTS_DISALLOW=1` kill-switch forces no-index even then.
 * Everything else (staging, preview, dev) is no-index and never pings IndexNow.
 */
export const isIndexingAllowed = (): boolean => {
  if (process.env.PAYLOAD_PUBLIC_ROBOTS_DISALLOW === '1') return false;
  return process.env.PAYLOAD_PUBLIC_ENV === 'production';
};
