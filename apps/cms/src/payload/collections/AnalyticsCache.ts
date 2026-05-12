import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access';

/**
 * Aggregate analytics payloads cached for the L1 dashboard cards and
 * L2 per-document Analytics tab (Phase J2).
 *
 * One row per `(env, provider, scope, key, capturedAt)`. The dashboard
 * always reads the most recent row for a key and renders it; if the
 * row is older than the provider's cache TTL the UI shows a `· stale ·`
 * badge while the background cron refreshes.
 *
 * Why a collection (rather than a raw Postgres table):
 *  - Payload-managed migrations + types — no extra Drizzle wiring.
 *  - Pruning via the analyticsCachePrune cron uses `payload.delete`
 *    with a `where` filter, same shape as the other retention jobs.
 *  - `overrideAccess: true` reads from the cron + dashboard endpoint
 *    bypass admin auth without leaking a public route.
 *
 * Pruning: a daily cron deletes rows older than 90 days. Per-provider
 * staleness thresholds live in the integration handler, not on the row.
 */
export const AnalyticsCache: CollectionConfig = {
  slug: 'analyticsCache',
  labels: { singular: 'Analytics cache entry', plural: 'Analytics cache' },
  admin: {
    group: 'System',
    useAsTitle: 'key',
    defaultColumns: ['provider', 'scope', 'key', 'capturedAt'],
    description:
      'Cached aggregate analytics payloads (GA4, GSC, Clarity, Cloudflare). Server-managed — do not edit by hand.',
    hidden: false,
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'env',
      type: 'select',
      required: true,
      defaultValue: 'production',
      options: [
        { label: 'production', value: 'production' },
        { label: 'staging', value: 'staging' },
        { label: 'development', value: 'development' },
      ],
      admin: {
        description: 'Scopes cache keys per environment so staging never reads prod payloads.',
      },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'GA4 Data API', value: 'ga4DataApi' },
        { label: 'GSC Search Analytics', value: 'gscSearchAnalyticsApi' },
        { label: 'GSC URL Inspection', value: 'gscUrlInspectionApi' },
        { label: 'MS Clarity', value: 'msClarity' },
        { label: 'Cloudflare Web Analytics', value: 'cloudflareWebAnalytics' },
      ],
    },
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'global',
      options: [
        { label: 'Global (L1 dashboard card)', value: 'global' },
        { label: 'Per-document (L2 tab)', value: 'document' },
      ],
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      admin: {
        description:
          'Identifier within the scope. For global = "default"; for per-document = the canonical URL or "<collection>:<id>".',
      },
    },
    {
      name: 'capturedAt',
      type: 'date',
      required: true,
      admin: {
        date: { displayFormat: 'PPpp' },
        description: 'When the underlying API call was made. Drives staleness.',
      },
    },
    {
      name: 'payload',
      type: 'json',
      required: true,
      admin: {
        description: 'Provider-shape aggregate response. Schema documented per handler in lib/integrations/kinds/.',
      },
    },
  ],
  indexes: [
    {
      fields: ['env', 'provider', 'scope', 'key'],
    },
  ],
};
