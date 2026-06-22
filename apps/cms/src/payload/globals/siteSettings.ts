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
    {
      name: 'organizationTimezone',
      type: 'text',
      defaultValue: 'Asia/Kolkata',
      admin: { description: 'IANA timezone identifier (e.g. Asia/Kolkata, America/New_York). Default for events / webinars.' },
      validate: (value: string | string[] | null | undefined): true | string => {
        if (value == null || (typeof value === 'string' && value.trim().length === 0)) {
          return true;
        }
        if (typeof value !== 'string') return 'Timezone must be a string.';
        const trimmed = value.trim();
        // Reject strings containing spaces or obvious non-IANA characters.
        if (/\s/.test(trimmed) || !/^[A-Za-z][A-Za-z0-9/_+-]*$/.test(trimmed)) {
          return 'Expected a valid IANA timezone identifier (e.g. Asia/Kolkata, America/New_York).';
        }
        return true;
      },
    },
    // Pruned 2026-06-22: the `listing`, `toc`, `leads`, and `analytics`
    // sub-groups were never read by code (web hardcodes pagination/TOC; GA4/GTM
    // fire from NEXT_PUBLIC_* env vars; lead retention is a job constant).
    // Removed to declutter. Only siteName/baseUrl/defaultLocale/timezone remain
    // (consumed by robots.ts, sitemap.ts, jsonld.ts).
  ],
};
