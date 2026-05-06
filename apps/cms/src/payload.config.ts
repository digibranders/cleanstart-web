import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { RichPasteFeature } from './payload/lib/lexical/rich-paste-feature';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AboutGalleries } from './payload/collections/AboutGalleries';
import { AuditLog } from './payload/collections/audit-log';
import { Authors } from './payload/collections/Authors';
import { Blogs } from './payload/collections/Blogs';
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
import { Users } from './payload/collections/Users';
import { Webinars } from './payload/collections/Webinars';
import { drainLeadQueueTask } from './payload/jobs/drain-lead-queue';
import { registerLeadHandlers } from './payload/lib/lead-handlers';
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
      graphics: {
        Logo: './payload/admin/Logo.tsx#Logo',
        Icon: './payload/admin/Icon.tsx#Icon',
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
    Users,
    Media,
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
    Redirects,
    AuditLog,
  ],
  globals: [SiteSettings, SeoDefaults, MainNav, FooterNav, Legal, Announcements],
  jobs: {
    tasks: [drainLeadQueueTask],
    autoRun: [
      {
        cron: '*/5 * * * *', // every 5 minutes
        queue: 'leadQueueDrain',
      },
    ],
    shouldAutoRun: () => process.env.NODE_ENV !== 'test',
  },
  plugins: storagePlugins,
  onInit: () => {
    registerLeadHandlers();
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, RichPasteFeature()],
  }),
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
