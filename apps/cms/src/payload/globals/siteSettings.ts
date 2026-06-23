import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site settings',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'CleanStart', required: true },
    {
      name: 'baseUrl',
      type: 'text',
      defaultValue: 'https://cleanstart.com',
      required: true,
      admin: { description: 'Used to build absolute URLs for SEO and emails. Must be a valid https:// URL with no trailing slash.' },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'defaultLocale',
      type: 'text',
      defaultValue: 'en-US',
      required: true,
    },
    // Pruned 2026-06-22: `listing`/`toc`/`leads`/`analytics` sub-groups and
    // `organizationTimezone` were never read by code (web hardcodes
    // pagination/TOC; GA4/GTM fire from NEXT_PUBLIC_* env vars; lead retention
    // is a job constant; the event/webinar "timezone fallback" was never wired).
    // Only siteName/baseUrl/defaultLocale remain — consumed server-side by
    // robots.ts, sitemap.ts, and jsonld.ts.
  ],
};
