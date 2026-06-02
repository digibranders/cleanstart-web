import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { cleanstartLexicalEditor } from './payload/lib/lexical/editor-config';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AboutGalleries } from './payload/collections/AboutGalleries';
import { AuditLog } from './payload/collections/audit-log';
import { WebhookDeadLetter } from './payload/collections/WebhookDeadLetter';
import { Authors } from './payload/collections/Authors';
import { Blogs } from './payload/collections/Blogs';
import { BrokenLinks } from './payload/collections/BrokenLinks';
import { Categories } from './payload/collections/Categories';
import { Events } from './payload/collections/Events';
import { Forms } from './payload/collections/Forms';
import { Guides } from './payload/collections/Guides';
import { AnalyticsCache } from './payload/collections/AnalyticsCache';
import { Integrations } from './payload/collections/Integrations';
import { JobLocations } from './payload/collections/JobLocations';
import { Jobs } from './payload/collections/Jobs';
import { KnowledgeBase } from './payload/collections/KnowledgeBase';
import { KnowledgeCategories } from './payload/collections/KnowledgeCategories';
import { Leads } from './payload/collections/Leads';
import { Media } from './payload/collections/Media';
import { News } from './payload/collections/News';
import { NewsCategories } from './payload/collections/NewsCategories';
import { Pages } from './payload/collections/Pages';
import { PodcastEpisodes } from './payload/collections/PodcastEpisodes';
import { PreviewAudit } from './payload/collections/PreviewAudit';
import { Redirects } from './payload/collections/Redirects';
import { Resources } from './payload/collections/Resources';
import { SearchLog } from './payload/collections/SearchLog';
import { Users } from './payload/collections/Users';
import { Webinars } from './payload/collections/Webinars';
import { canonicalCheckEndpoint } from './payload/endpoints/canonical-check';
import { mediaRenameEndpoint } from './payload/endpoints/media-rename';
import { userReassignContentEndpoint } from './payload/endpoints/user-offboard';
import {
  previewRedirectEndpoint,
  previewRevokeEndpoint,
  previewTokenMintEndpoint,
  previewVerifyEndpoint,
} from './payload/endpoints/preview';
import { publishChecklistEndpoint } from './payload/endpoints/publish-checklist';
import { dsarFindEndpoint, dsarDeleteEndpoint } from './payload/endpoints/leads-dsar';
import { retryLeadSyncEndpoint } from './payload/endpoints/retry-lead-sync';
import {
  dashboardsGlobalEndpoint,
  dashboardsGscInspectEndpoint,
  dashboardsGscPerDocEndpoint,
} from './payload/endpoints/dashboards';
import { calcomInboundEndpoint } from './payload/endpoints/integrations-inbound';
import { jsonLdEndpoint, jsonLdPreviewEndpoint } from './payload/endpoints/jsonld';
import { mediaIngestUrlEndpoint } from './payload/endpoints/media-ingest-url';
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
import { purgePreviewAuditTask } from './payload/jobs/purge-preview-audit';
import { purgeSearchLogTask } from './payload/jobs/purge-search-log';
import { reindexMeiliTask } from './payload/jobs/reindex-meili';
import { retryWebhookTask } from './payload/jobs/retry-webhook';
import { analyticsCachePruneTask } from './payload/jobs/analytics-cache-prune';
import { dashboardRefreshDailyTask } from './payload/jobs/dashboard-refresh-daily';
import { dashboardRefreshFrequentTask } from './payload/jobs/dashboard-refresh-frequent';
import { registerLeadHandlers } from './payload/lib/lead-handlers';
import { wirePreviewControls } from './payload/lib/wire-preview';
import { wireAnalyticsTab } from './payload/lib/wire-analytics-tab';
import { wireCustomFields } from './payload/lib/wire-custom-fields';
import { wireCustomListView } from './payload/lib/wire-custom-list-view';
import { wirePublishGate } from './payload/lib/wire-publish-gate';
import { Announcements } from './payload/globals/announcements';
import { FooterNav } from './payload/globals/footerNav';
import { Legal } from './payload/globals/legal';
import { MainNav } from './payload/globals/mainNav';
import { PodcastPage } from './payload/globals/podcastPage';
import { CompanySpotlight } from './payload/globals/companySpotlight';
import { ResourcesSpotlight } from './payload/globals/resourcesSpotlight';
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

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

/**
 * CORS / CSRF allow-list for the admin REST surface. Defaults to the
 * configured serverURL only; PAYLOAD_CORS_ORIGINS lets ops widen it
 * (e.g. add a staging admin origin) without a code change.
 *
 * Public form-submit / search-analytics endpoints have their own
 * narrower CORS gating inside the handlers, so they aren't affected
 * by this list.
 */
const DEFAULT_ADMIN_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
  'https://staging.cleanstart.com',
];

const adminAllowedOrigins = (): string[] => {
  const raw = process.env.PAYLOAD_CORS_ORIGINS;
  if (raw && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return Array.from(new Set([serverURL, ...DEFAULT_ADMIN_ALLOWED_ORIGINS]));
};

// Top-level folder prefix for all R2 uploads.
// Derived from NODE_ENV so the correct folder is used automatically:
//   next dev   → NODE_ENV=development → 'dev'
//   next start → NODE_ENV=production  → 'web'
// R2_UPLOAD_PREFIX overrides this for staging or special environments.
const r2UploadPrefix: string =
  process.env.R2_UPLOAD_PREFIX ??
  (process.env.NODE_ENV === 'production' ? 'web' : 'dev');

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
            prefix: r2UploadPrefix,
            // Serve files directly from the R2 CDN — bypass Payload's
            // /api/media/file proxy so URLs resolve to the public base.
            disablePayloadAccessControl: true,
            generateFileURL: ({ filename, prefix }) => {
              const publicBase = process.env.R2_PUBLIC_BASE ?? '';
              const effectivePrefix = prefix || r2UploadPrefix;
              return `${publicBase}/${effectivePrefix}/${encodeURIComponent(filename)}`;
            },
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

// Field component paths for the seven field types no collection uses yet.
// They are registered into the import map so they resolve if/when those field
// types appear, without a regenerate. Already baked into the committed
// importMap.js — see GENERATING_IMPORT_MAP below.
const FORWARD_COMPAT_FIELD_PATHS = [
  '@/payload/admin/components/fields/PointField.tsx#PointField',
  '@/payload/admin/components/fields/RadioField.tsx#RadioField',
  '@/payload/admin/components/fields/CollapsibleField.tsx#CollapsibleField',
  '@/payload/admin/components/fields/TabsField.tsx#TabsField',
  '@/payload/admin/components/fields/RowField.tsx#RowField',
  '@/payload/admin/components/fields/JoinField.tsx#JoinField',
  '@/payload/admin/components/fields/CodeField.tsx#CodeField',
] as const;

// `importMap.generators` run ONLY during `payload generate:importmap`. Payload
// does NOT strip generators from the client config (getClientConfig keeps
// `admin.importMap`), so a generator left in the runtime config serializes a
// function into the client `RootProvider` and throws "Functions cannot be
// passed directly to Client Components" on every /admin render. Gate the
// generator to the generate:importmap invocation; the runtime config then
// carries no function and the committed importMap.js already has these paths.
const GENERATING_IMPORT_MAP = process.argv.some(
  (arg) => arg === 'generate:importmap' || arg.endsWith(':importmap'),
);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      generators: GENERATING_IMPORT_MAP
        ? [
            ({ addToImportMap }) => {
              for (const p of FORWARD_COMPAT_FIELD_PATHS) {
                addToImportMap(p);
              }
            },
          ]
        : [],
    },
    components: {
      actions: [
        './payload/admin/components/SkipLink.tsx#SkipLink',
        './payload/admin/components/SaveShortcut.tsx#SaveShortcut',
        // Global cross-collection helper — after every failed save /
        // publish attempt it scrolls the first invalid field into view
        // and pulses it. Lives in `actions` rather than per-collection
        // `beforeDocumentControls` so it applies to taxonomy collections
        // (authors, categories, …) outside the publish-gate set too.
        './payload/admin/components/ScrollToInvalidField.tsx#ScrollToInvalidField',
        './payload/admin/components/CommandPalette.tsx#CommandPalette',
        './payload/admin/components/FieldDescriptionTooltip.tsx#FieldDescriptionTooltip',
        // SavedStateIndicator — floating "Saved X ago" chip in the
        // bottom-right corner. Re-enabled: it is a trust signal on par
        // with Webflow/Notion/Linear. Renders position:fixed so it
        // interferes with nothing else in the doc-controls strip.
        './payload/admin/components/SavedStateIndicator.tsx#SavedStateIndicator',
        './payload/admin/components/NavBadges.tsx#NavBadges',
        './payload/admin/components/NavGroupPersistence.tsx#NavGroupPersistence',
        './payload/admin/components/EditorFullscreenToggle.tsx#EditorFullscreenToggle',
        './payload/admin/components/ShortcutHelpDialog.tsx#ShortcutHelpDialog',
        // ListCellEnhancer removed — list-cell formatting now uses
        // React-rendered Cell components (DateCell / BooleanChipCell /
        // BytesCell) wired in wire-custom-fields.ts. The old approach
        // rewrote cell DOM via a global MutationObserver and crashed
        // React's reconciler on sort (removeChild NotFoundError).
        './payload/admin/components/ToastBus.tsx#ToastBus',
        // Note: SchedulePublishDialog is NOT mounted here as a global action.
        // The Cmd/Ctrl-Shift-S shortcut is wired inside CmsPublishButton so
        // only one dialog instance ever mounts, eliminating the duplicate-
        // dialog race when the shortcut fires while the controlled instance
        // is already open.
      ],
      afterNavLinks: [
        './payload/admin/components/UserMenu.tsx#UserMenu',
        // Mounted here (inside the nav) rather than in `actions` so the
        // sidebar auto-collapse policy runs on every admin page — the
        // custom document-edit chrome (CmsEditView) doesn't render the
        // `actions` slot, so an actions-mounted policy never ran on
        // editor views.
        './payload/admin/components/NavOpenOnDesktop.tsx#NavOpenOnDesktop',
        // Resizable + collapsible SEO/meta rail on document edit views.
        // Mounted in the nav (like NavOpenOnDesktop) so it renders on every
        // admin page; it's a DOM enhancer that self-activates only when an
        // edit-view sidebar (`.document-fields--has-sidebar`) is present.
        './payload/admin/components/DocSidebarResizer.tsx#DocSidebarResizer',
      ],
      beforeNavLinks: ['./payload/admin/components/SidebarHeader.tsx#SidebarHeader'],
      // Wave 5 — branded hero injected above the stock LoginForm. Full
      // login-route replacement waits for the 2FA backend (Phase I).
      beforeLogin: ['./payload/admin/components/auth/CmsLoginHero.tsx#CmsLoginHero'],
      afterLogin: ['./payload/admin/components/auth/CmsLoginFooter.tsx#CmsLoginFooter'],
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
    PreviewAudit,
    WebhookDeadLetter,
    Integrations,
    AnalyticsCache,
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
    PodcastEpisodes,
    Jobs,
    AboutGalleries,
    Pages,
  ]
    .map(wirePublishGate)
    .map(wirePreviewControls)
    .map(wireCustomListView)
    .map(wireAnalyticsTab)
    .map(wireCustomFields),
  globals: [SiteSettings, SeoDefaults, MainNav, FooterNav, Legal, Announcements, PodcastPage, ResourcesSpotlight, CompanySpotlight]
    .map(wireCustomFields),
  endpoints: [
    jsonLdEndpoint,
    jsonLdPreviewEndpoint,
    sitemapEndpoint,
    newsSitemapEndpoint,
    imageSitemapEndpoint,
    robotsEndpoint,
    mediaIngestUrlEndpoint,
    mediaRenameEndpoint,
    redirectsImportEndpoint,
    canonicalCheckEndpoint,
    searchAnalyticsEndpoint,
    userReassignContentEndpoint,
    publishChecklistEndpoint,
    dsarFindEndpoint,
    dsarDeleteEndpoint,
    retryLeadSyncEndpoint,
    previewTokenMintEndpoint,
    previewVerifyEndpoint,
    previewRevokeEndpoint,
    previewRedirectEndpoint,
    dashboardsGlobalEndpoint,
    dashboardsGscPerDocEndpoint,
    dashboardsGscInspectEndpoint,
    calcomInboundEndpoint,
  ],
  jobs: {
    tasks: [
      drainLeadQueueTask,
      purgeSearchLogTask,
      purgeLeadsPiiTask,
      purgePreviewAuditTask,
      checkBrokenLinksTask,
      retryWebhookTask,
      reindexMeiliTask,
      dashboardRefreshFrequentTask,
      dashboardRefreshDailyTask,
      analyticsCachePruneTask,
    ],
    autoRun: [
      {
        cron: '*/5 * * * *', // every 5 minutes
        queue: 'leadQueueDrain',
      },
      {
        cron: '*/5 * * * *', // every 5 minutes — retry failed webhook deliveries
        queue: 'webhookRetry',
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
        cron: '30 3 * * *', // daily at 03:30 UTC — previewAudit 90-day retention
        queue: 'previewAuditPurge',
      },
      {
        cron: '30 4 * * *', // daily at 04:30 UTC — broken-link scan
        queue: 'brokenLinksScan',
      },
      {
        cron: '0 5 * * *', // daily at 05:00 UTC — Meilisearch drift check + self-healing
        queue: 'meiliReindex',
      },
      {
        cron: '*/15 * * * *', // every 15 minutes — GA4 + CF WA dashboard cache refresh
        queue: 'dashboardRefreshFrequent',
      },
      {
        cron: '0 6 * * *', // daily at 06:00 UTC — GSC + Clarity dashboard cache refresh
        queue: 'dashboardRefreshDaily',
      },
      {
        cron: '0 7 * * *', // daily at 07:00 UTC — analyticsCache 90-day prune
        queue: 'analyticsCachePrune',
      },
      {
        cron: '* * * * *', // every minute — Payload built-in schedulePublish jobs land in the `default` queue; wait_until gates actual execution
        queue: 'default',
      },
    ],
    // Positive opt-in: cron tasks register only when PAYLOAD_AUTO_RUN
    // is exactly 'true'. Vitest worker subprocesses (and CI runners
    // that fork the process) inherit the parent env but rarely have
    // this set, so the lead-queue drain / PII purge / broken-link scan
    // can't spuriously fire during tests.
    shouldAutoRun: () => process.env.PAYLOAD_AUTO_RUN === 'true',
  },
  plugins: storagePlugins,
  onInit: () => {
    registerLeadHandlers();
  },
  editor: cleanstartLexicalEditor(),
  secret: requireEnv('PAYLOAD_SECRET'),
  serverURL,
  cors: adminAllowedOrigins(),
  csrf: adminAllowedOrigins(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URI'),
    },
    // Migrations are authoritative in staging / prod / CI. Local dev
    // keeps `push: true` so editors can iterate on collection shape
    // without minting a migration on every save — the change is then
    // captured via `pnpm migrate:create <name>` when it settles. See
    // src/payload/migrations/README.md.
    //
    // Escape hatch: `PAYLOAD_DB_PUSH=force` enables push even in
    // production. Reserve for one-time schema-drift recovery when
    // migrations have fallen behind source. Set once, deploy, verify
    // schema, then unset and redeploy. Leaving it on in prod silently
    // overrides migrations every boot.
    push:
      process.env.PAYLOAD_DB_PUSH === 'force' ||
      (process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DB_PUSH !== 'false'),
  }),
  sharp,
  graphQL: {
    disable: true,
  },
});
