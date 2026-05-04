import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Authors } from './payload/collections/Authors';
import { Categories } from './payload/collections/Categories';
import { JobLocations } from './payload/collections/JobLocations';
import { Media } from './payload/collections/Media';
import { NewsCategories } from './payload/collections/NewsCategories';
import { Users } from './payload/collections/Users';

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
    meta: {
      titleSuffix: '— CleanStart CMS',
    },
  },
  collections: [Users, Media, Authors, Categories, NewsCategories, JobLocations],
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
