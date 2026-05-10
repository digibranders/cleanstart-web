import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { cleanstartLexicalEditor } from './payload/lib/lexical/editor-config';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AboutGalleries } from './payload/collections/AboutGalleries';
import { AuditLog } from './payload/collections/audit-log';
import { Authors } from './payload/collections/Authors';
import { Blogs } from './payload/collections/Blogs';
import { BrokenLinks } from './payload/collections/BrokenLinks';
import { Categories } from './payload/collections/Categories';
import { Events } from './payload/collections/Events';
import { Forms } from './payload/collections/Forms';
import { Guides } from './payload/collections/Guides';
import { JobLocations } from './payload/collections/JobLocations';
import { Jobs } from './payload/collections/Jobs';
import { KnowledgeBase } from './payload/collections/KnowledgeBase';
import { KnowledgeCategories } from './payload/collections/KnowledgeCategories';
import { Leads } from './payload/collections/Leads';
import { Media } from './payload/collections/Media';
import { News } from './payload/collections/News';
import { NewsCategories } from './payload/collections/NewsCategories';
import { Pages } from './payload/collections/Pages';
import { Redirects } from './payload/collections/Redirects';
import { Resources } from './payload/collections/Resources';
import { SearchLog } from './payload/collections/SearchLog';
import { Users } from './payload/collections/Users';
import { Webinars } from './payload/collections/Webinars';
import { canonicalCheckEndpoint } from './payload/endpoints/canonical-check';
import { jsonLdEndpoint } from './payload/endpoints/jsonld';
import { redirectsImportEndpoint } from './payload/endpoints/redirects-import';
import { robotsEndpoint } from './payload/endpoints/robots';
import { searchAnalyticsEndpoint } from './payload/endpoints/search-analytics';
import {
  imageSitemapEndpoint,
  newsSitemapEndpoint,
  sitemapEndpoint,
} from './payload/endpoints/sitemap';
import { checkBrokenLinksTask } from './payload/jobs/check-broken-links';
import { drainLeadQueueTask } from './payload/jobs/drain-lead-queue';
import { purgeLeadsPiiTask } from './payload/jobs/purge-leads-pii';
import { purgeSearchLogTask } from './payload/jobs/purge-search-log';
import { registerLeadHandlers } from './payload/lib/lead-handlers';
import { wireCustomEditView } from './payload/lib/wire-custom-edit-view';
import { wireCustomFields } from './payload/lib/wire-custom-fields';
import { wireCustomListView } from './payload/lib/wire-custom-list-view';
import { Announcements } from './payload/globals/announcements';
import { FooterNav } from './payload/globals/footerNav';
import { Legal } from './payload/globals/legal';
import { MainNav } from './payload/globals/mainNav';
import { SeoDefaults } from './payload/globals/seoDefaults';
import { SiteSettings } from './payload/globals/siteSettings';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const r2EnvComplete = (): boolean =>
  Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );

// Storage plugin: enabled only when all four R2 env vars are set so dev
// iteration without R2 still works (Media falls back to the local
// staticDir on the collection). In production, the absence of any of
// these is a misconfiguration we'd rather fail loudly on, so we only
// guard the plugin construction — buildConfig itself still runs.
const storagePlugins = r2EnvComplete()
  ? [
      s3Storage({
        collections: {
          media: {
            prefix: 'media',
          },
        },
        bucket: requireEnv('R2_BUCKET'),
        config: {
          endpoint: requireEnv('R2_ENDPOINT'),
          credentials: {
            accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
            secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
          },
          region: 'auto',
          forcePathStyle: true,
        },
      }),
    ]
  : [];

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: [
        './payload/admin/components/SkipLink.tsx#SkipLink',
        './payload/admin/components/SaveShortcut.tsx#SaveShortcut',
        './payload/admin/components/CommandPalette.tsx#CommandPalette',
        './payload/admin/components/FieldDescriptionTooltip.tsx#FieldDescriptionTooltip',
        // SavedStateIndicator removed — the floating "Saved X ago"
        // pill in the bottom-right was redundant with Payload's own
        // toast system and added visual noise on every edit view.
        // The error-toast surface is preserved via `dispatchSaveError`,
        // which routes through the standard ToastBus.
        './payload/admin/components/NavBadges.tsx#NavBadges',
        './payload/admin/components/NavGroupPersistence.tsx#NavGroupPersistence',
        './payload/admin/components/NavOpenOnDesktop.tsx#NavOpenOnDesktop',
        './payload/admin/components/EditorFullscreenToggle.tsx#EditorFullscreenToggle',
        './payload/admin/components/ShortcutHelpDialog.tsx#ShortcutHelpDialog',
        './payload/admin/components/ListCellEnhancer.tsx#ListCellEnhancer',
        './payload/admin/components/ToastBus.tsx#ToastBus',
      ],
      afterNavLinks: [
        './payload/admin/components/UserMenu.tsx#UserMenu',
      ],
      beforeNavLinks: ['./payload/admin/components/SidebarHeader.tsx#SidebarHeader'],
      // Wave 5 — branded hero injected above the stock LoginForm. Full
      // login-route replacement waits for the 2FA backend (Phase I).
      beforeLogin: ['./payload/admin/components/auth/CmsLoginHero.tsx#CmsLoginHero'],
      graphics: {
        Logo: './payload/admin/Logo.tsx#Logo',
        Icon: './payload/admin/Icon.tsx#Icon',
      },
      views: {
        dashboard: {
          Component:
            './payload/admin/components/Dashboard/Dashboard.tsx#Dashboard',
        },
        // Wave 5 — replaces the stock /admin/account screen with our
        // own profile + password + reserved-2FA layout.
        account: {
          Component:
            './payload/admin/components/auth/CmsAccountView.tsx#CmsAccountView',
        },
      },
    },
    meta: {
      title: 'CleanStart CMS',
      titleSuffix: ' — CleanStart CMS',
      description:
        'CleanStart CMS — content, leads, and publishing for cleanstart.com.',
      icons: [
        {
          type: 'image/svg+xml',
          rel: 'icon',
          url: '/icon.svg',
        },
      ],
    },
  },
  collections: [
    // Order tracks the editorial mental model surfaced in the sidebar:
    //   System → People → Taxonomies → Marketing → Content
    // Group strings on each collection drive the sidebar grouping; this
    // array order drives the order *within* each group.
    Users,
    Media,
    Redirects,
    BrokenLinks,
    AuditLog,
    SearchLog,
    Authors,
    Categories,
    NewsCategories,
    KnowledgeCategories,
    JobLocations,
    Forms,
    Leads,
    Blogs,
    News,
    Guides,
    Resources,
    KnowledgeBase,
    Events,
    Webinars,
    Jobs,
    AboutGalleries,
    Pages,
  ]
    .map(wireCustomListView)
    .map(wireCustomEditView)
    .map(wireCustomFields),
  globals: [SiteSettings, SeoDefaults, MainNav, FooterNav, Legal, Announcements]
    .map(wireCustomEditView)
    .map(wireCustomFields),
  endpoints: [
    jsonLdEndpoint,
    sitemapEndpoint,
    newsSitemapEndpoint,
    imageSitemapEndpoint,
    robotsEndpoint,
    redirectsImportEndpoint,
    canonicalCheckEndpoint,
    searchAnalyticsEndpoint,
  ],
  jobs: {
    tasks: [drainLeadQueueTask, purgeSearchLogTask, purgeLeadsPiiTask, checkBrokenLinksTask],
    autoRun: [
      {
        cron: '*/5 * * * *', // every 5 minutes
        queue: 'leadQueueDrain',
      },
      {
        cron: '0 3 * * *', // daily at 03:00 UTC — searchLog 90-day retention
        queue: 'searchLogPurge',
      },
      {
        cron: '15 3 * * *', // daily at 03:15 UTC — leads PII 365-day redaction
        queue: 'leadsPiiPurge',
      },
      {
        cron: '30 4 * * *', // daily at 04:30 UTC — broken-link scan
        queue: 'brokenLinksScan',
      },
    ],
    shouldAutoRun: () => process.env.NODE_ENV !== 'test',
  },
  plugins: storagePlugins,
  onInit: () => {
    registerLeadHandlers();
  },
  editor: cleanstartLexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URI'),
    },
  }),
  sharp,
  graphQL: {
    disable: true,
  },
});
