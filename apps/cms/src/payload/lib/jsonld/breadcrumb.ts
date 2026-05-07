import type { JsonLdContext } from './context';
import type { JsonLdBlob } from './types';
import { absoluteUrl } from './url';

export interface BreadcrumbCrumb {
  readonly name: string;
  /** Path or absolute URL. Path is preferred — gets resolved against baseUrl. */
  readonly path: string;
}

const toAbsolute = (ctx: JsonLdContext, pathOrUrl: string): string => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return absoluteUrl(ctx.site.baseUrl, pathOrUrl);
};

/**
 * Build a BreadcrumbList blob. The first crumb is conventionally
 * "Home" pointing at the site root — callers that want a shorter
 * trail should pass only the crumbs they need; we don't auto-prepend.
 */
export const buildBreadcrumbBlob = (
  ctx: JsonLdContext,
  crumbs: readonly BreadcrumbCrumb[],
): JsonLdBlob | null => {
  if (crumbs.length === 0) return null;

  const itemListElement = crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: toAbsolute(ctx, crumb.path),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};
