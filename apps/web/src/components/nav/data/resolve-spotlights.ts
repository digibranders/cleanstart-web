import { cache } from 'react';
import {
  resolveResourcesSpotlight,
  resolveCompanySpotlight,
  type SpotlightCard,
} from './spotlights';
import { fetchCMS } from '@/lib/cms-fetch';

export const RESOURCES_SPOTLIGHT_TAG = 'resources-spotlight';
export const COMPANY_SPOTLIGHT_TAG = 'company-spotlight';

const SPOTLIGHT_WINDOW_DAYS = 30;

function windowCutoff(now: Date, days: number): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

type MinimalEventDoc = {
  title: string;
  slug: string;
  startsAt?: string | null;
};

type PayloadListResponse<T> = {
  docs: T[];
};

async function fetchNextInPersonEvent(
  now: Date,
): Promise<{ title: string; slug: string; startsAt: string } | null> {
  try {
    const params = new URLSearchParams({
      'where[_status][equals]': 'published',
      'where[publishedAt][exists]': 'true',
      'where[startsAt][greater_than]': now.toISOString(),
      'where[startsAt][less_than]': windowCutoff(now, SPOTLIGHT_WINDOW_DAYS),
      'where[eventStatus][not_equals]': 'cancelled',
      depth: '0',
      limit: '1',
      sort: 'startsAt',
    });
    const res = await fetchCMS<PayloadListResponse<MinimalEventDoc>>(
      `/api/events?${params.toString()}`,
    );
    const doc = res.docs?.[0];
    if (!doc?.startsAt) return null;
    return { title: doc.title, slug: doc.slug, startsAt: doc.startsAt };
  } catch {
    return null;
  }
}

// `getWebinars` sorts by `-startsAt` and has no future-only filter, so this
// calls the API directly with `startsAt > now` and ascending sort to get the
// next upcoming webinar within the spotlight window.
type MinimalWebinarDoc = {
  title: string;
  slug: string;
  startsAt?: string | null;
};

async function fetchNextWebinarSpotlight(
  now: Date,
): Promise<{ title: string; slug: string; startsAt: string } | null> {
  try {
    const params = new URLSearchParams({
      'where[_status][equals]': 'published',
      'where[publishedAt][exists]': 'true',
      'where[startsAt][greater_than]': now.toISOString(),
      'where[startsAt][less_than]': windowCutoff(now, SPOTLIGHT_WINDOW_DAYS),
      'where[eventStatus][not_equals]': 'cancelled',
      depth: '0',
      limit: '1',
      sort: 'startsAt',
    });
    const res = await fetchCMS<PayloadListResponse<MinimalWebinarDoc>>(
      `/api/webinars?${params.toString()}`,
    );
    const doc = res.docs?.[0];
    const startsAt = doc?.startsAt ?? null;
    if (!doc || !startsAt) return null;
    return { title: doc.title, slug: doc.slug, startsAt };
  } catch {
    return null;
  }
}

type CmsGlobalRaw = {
  headline?: string | null;
  sub?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  expiresAt?: string | null;
};

type CmsSpotlightResolved = {
  headline: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
  expiresAt?: string;
};

function resolveGlobal(g: CmsGlobalRaw | null): CmsSpotlightResolved | null {
  if (!g?.headline || !g.ctaLabel || !g.ctaHref) return null;
  const out: CmsSpotlightResolved = {
    headline: g.headline,
    ctaLabel: g.ctaLabel,
    ctaHref: g.ctaHref,
  };
  if (g.sub) out.sub = g.sub;
  if (g.expiresAt) out.expiresAt = g.expiresAt;
  return out;
}

async function fetchResourcesSpotlightGlobal(): Promise<CmsSpotlightResolved | null> {
  try {
    const g = await fetchCMS<CmsGlobalRaw>('/api/globals/resourcesSpotlight');
    return resolveGlobal(g);
  } catch {
    return null;
  }
}

async function fetchCompanySpotlightGlobal(): Promise<CmsSpotlightResolved | null> {
  try {
    const g = await fetchCMS<CmsGlobalRaw>('/api/globals/companySpotlight');
    return resolveGlobal(g);
  } catch {
    return null;
  }
}

export const getResourcesSpotlight = cache(async (): Promise<SpotlightCard> => {
  const now = new Date();
  return resolveResourcesSpotlight({
    now,
    fetchNextEvent: () => fetchNextInPersonEvent(now),
    fetchNextWebinar: () => fetchNextWebinarSpotlight(now),
    fetchSpotlightGlobal: fetchResourcesSpotlightGlobal,
  });
});

export const getCompanySpotlight = cache(async (): Promise<SpotlightCard> => {
  const now = new Date();
  return resolveCompanySpotlight({
    now,
    fetchSpotlightGlobal: fetchCompanySpotlightGlobal,
  });
});
