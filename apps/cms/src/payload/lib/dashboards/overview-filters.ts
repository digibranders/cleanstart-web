import type { OverviewFilters, OverviewWindow } from './overview-types';

export const WINDOW_DAYS: Record<OverviewWindow, number> = { '7d': 7, '28d': 28, '90d': 90 };

/** Collection slug → GA4 pagePath prefix. Keep in sync with apps/web routes. */
export const COLLECTION_PATH_PREFIX: Record<string, string> = {
  blogs: '/blogs',
  guides: '/guide',
  news: '/news',
  knowledgeBase: '/knowledge-hub',
  events: '/events',
  webinars: '/webinars',
  resources: '/resource-center',
  caseStudies: '/case-studies',
};

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const buildOverviewCacheKey = (provider: 'ga4' | 'gsc', f: OverviewFilters): string =>
  `overview:${provider}:${f.window}:${f.country ? slug(f.country) : 'all'}:${f.collection ?? 'all'}`;

interface Ga4StringFilter {
  filter: { fieldName: string; stringFilter: { matchType: 'EXACT' | 'BEGINS_WITH'; value: string } };
}
export interface Ga4FilterExpression {
  andGroup?: { expressions: Ga4StringFilter[] };
}

export const buildGa4DimensionFilter = (
  country: string | null,
  pathPrefix: string | null,
): Ga4FilterExpression | undefined => {
  const expressions: Ga4StringFilter[] = [];
  if (country) {
    expressions.push({
      filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: country } },
    });
  }
  if (pathPrefix) {
    expressions.push({
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: pathPrefix } },
    });
  }
  return expressions.length ? { andGroup: { expressions } } : undefined;
};
