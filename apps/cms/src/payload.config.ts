import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AboutGalleries } from './payload/collections/AboutGalleries';
import { Authors } from './payload/collections/Authors';
import { Blogs } from './payload/collections/Blogs';
import { Categories } from './payload/collections/Categories';
import { Events } from './payload/collections/Events';
import { Forms } from './payload/collections/Forms';
import { Guides } from './payload/collections/Guides';
import { JobLocations } from './payload/collections/JobLocations';
import { Jobs } from './payload/collections/Jobs';
import { Leads } from './payload/collections/Leads';
import { Media } from './payload/collections/Media';
import { News } from './payload/collections/News';
import { NewsCategories } from './payload/collections/NewsCategories';
import { Pages } from './payload/collections/Pages';
import { Redirects } from './payload/collections/Redirects';
import { Resources } from './payload/collections/Resources';
import { Users } from './payload/collections/Users';
import { Webinars } from './payload/collections/Webinars';
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
    JobLocations,
    Forms,
    Leads,
    Blogs,
    News,
    Guides,
    Resources,
    Events,
    Webinars,
    Jobs,
    AboutGalleries,
    Pages,
    Redirects,
  ],
  globals: [SiteSettings, SeoDefaults, MainNav, FooterNav, Legal, Announcements],
  onInit: () => {
    registerLeadHandlers();
  },
  editor: lexicalEditor(),
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
