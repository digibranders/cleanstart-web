import { defineConfig } from 'drizzle-kit';
import { poolConnection } from './src/db/connection';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: (({ connectionString, ssl }) => ({ url: connectionString ?? '', ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}) }))(poolConnection(process.env.DATABASE_OWNER_URL ?? '')),
  strict: true,
  verbose: true,
});
