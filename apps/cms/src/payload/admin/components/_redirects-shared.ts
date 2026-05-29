'use client';

import { useField } from '@payloadcms/ui';
import { useMemo } from 'react';

import { DEFAULT_SITE_URL } from './_site-url';

/**
 * Shared URL derivation helpers for the SEO sidebar's redirect-aware
 * fields (Inbound / Outbound / URL change history). Three components
 * need the same `publicUrl` + `sitePath` shape — extract per the
 * CLAUDE.md "three similar lines beats a premature abstraction" rule.
 */

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

export interface DocUrlShape {
  /** Full https URL — used for `to`/`from` matching against rows that
   *  store an absolute URL. */
  publicUrl: string;
  /** Site-relative path — preferred shape for new redirect rows so a
   *  domain change doesn't invalidate them. */
  sitePath: string;
}

/**
 * Compose the current document's public URL + site-relative path
 * from its slug field and an optional collection prefix. Returns
 * empty strings until the slug is set, signalling "not addressable
 * yet" to the consuming component.
 */
export const useDocPublicUrl = (args: {
  pathPrefix?: string;
  sourceField?: string;
}): DocUrlShape => {
  const { pathPrefix = '', sourceField = 'slug' } = args;
  const { value: sourceValue } = useField<string>({ path: sourceField });

  return useMemo(() => {
    if (!sourceValue) return { publicUrl: '', sitePath: '' };
    const root = DEFAULT_SITE_URL.replace(/\/+$/, '');
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    const tail = `/${trimSlash(sourceValue)}`;
    return {
      publicUrl: `${root}${prefix}${tail}`,
      sitePath: `${prefix}${tail}`,
    };
  }, [sourceValue, pathPrefix]);
};

/**
 * Threshold above which a redirect is considered "hot" / high-traffic.
 * Surfaces a 🔥 marker in the sidebar UI and a warning banner in the
 * Inbound Redirects card so editors don't casually break SEO juice.
 *
 * 1000 hits is high enough to filter out low-volume noise, low enough
 * that any meaningful traffic source crosses it within a quarter.
 */
export const HOT_REDIRECT_THRESHOLD = 1000;

/**
 * Status code metadata shared across all three redirect cards.
 * The hint text is shown live below the picker so editors learn what
 * each code does without leaving the page.
 */
export const STATUS_OPTIONS = [
  {
    value: '301',
    label: '301 · Permanent',
    hint: 'Best for renamed/moved pages — search engines transfer SEO juice.',
  },
  {
    value: '308',
    label: '308 · Permanent (preserves method)',
    hint: 'Modern 301 — preserves POST/PUT request bodies.',
  },
  {
    value: '302',
    label: '302 · Temporary',
    hint: 'Short-lived. Mostly superseded by 307.',
  },
  {
    value: '307',
    label: '307 · Temporary (preserves method)',
    hint:
      'A/B tests, maintenance, geo-redirects. Preserves request method/body.',
  },
  {
    value: '410',
    label: '410 · Gone',
    hint:
      'Permanently removed. No target needed — tells crawlers to delist.',
  },
] as const satisfies readonly {
  value: '301' | '302' | '307' | '308' | '410';
  label: string;
  hint: string;
}[];

export type RedirectStatus = (typeof STATUS_OPTIONS)[number]['value'];

export type RedirectSource =
  | 'manual'
  | 'slug-change'
  | 'archive-with-redirect'
  | 'migration-seed';

export interface RedirectRow {
  id: string | number;
  from: string;
  to: string | null;
  status: RedirectStatus;
  source: RedirectSource;
  hitCount?: number | null;
  lastHitAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export const SOURCE_LABEL: Record<RedirectSource, string> = {
  manual: 'manual',
  'slug-change': 'auto · slug change',
  'archive-with-redirect': 'archived',
  'migration-seed': 'migration',
};

export const formatHitCount = (n: number | null | undefined): string => {
  if (n == null || n === 0) return '0 hits';
  if (n === 1) return '1 hit';
  if (n < 1000) return `${n} hits`;
  return `${(n / 1000).toFixed(1)}k hits`;
};

export const formatRelativeDate = (
  iso: string | null | undefined,
): string => {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const diffMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return 'today';
  const days = Math.floor(diffMs / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

/** Pull a useful single-line error message from Payload's API error shape. */
export const formatApiError = async (res: Response): Promise<string> => {
  try {
    const body = (await res.json()) as {
      errors?: { message?: string }[];
      message?: string;
    };
    if (Array.isArray(body.errors) && body.errors[0]?.message) {
      return body.errors[0].message;
    }
    if (body.message) return body.message;
  } catch {
    // ignore — fall through
  }
  return `HTTP ${res.status}`;
};
