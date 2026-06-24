import { COLLECTION_PATH_PREFIX } from '../dashboards/overview-filters';

export const normalizePath = (input: string): string => {
  let p = input.trim();
  p = p.replace(/^https?:\/\/[^/]+/i, '');
  p = p.replace(/[?#].*$/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
};

export const docPath = (collection: string, slug: string): string | null => {
  const prefix = COLLECTION_PATH_PREFIX[collection];
  return prefix ? `${prefix}/${slug}` : null;
};

export const pathToDocKey = (input: string): { collection: string; slug: string } | null => {
  const path = normalizePath(input);
  let best: { collection: string; prefix: string } | null = null;
  for (const [collection, prefix] of Object.entries(COLLECTION_PATH_PREFIX)) {
    if ((path === prefix || path.startsWith(`${prefix}/`)) && (!best || prefix.length > best.prefix.length)) {
      best = { collection, prefix };
    }
  }
  if (!best) return null;
  const slug = path.slice(best.prefix.length + 1);
  if (!slug || slug.includes('/')) return null;
  return { collection: best.collection, slug };
};
