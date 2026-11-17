import type { Pool } from 'pg';
import type { DemoFileStore } from './demo';

/** The DDL that `pnpm demo:setup` runs as the owner role. Not part of the drizzle schema: the real portal has no such table. */
export const DEMO_FILES_DDL = `
CREATE TABLE IF NOT EXISTS demo_files (
  key text PRIMARY KEY,
  content_type text NOT NULL,
  bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON demo_files TO portal_app;
`;

/** Uploaded demo files in Postgres, so every serverless instance sees them. Reads and writes go through the system pool. */
export function createDatabaseDemoStore(pool: Pick<Pool, 'query'>): DemoFileStore {
  return {
    async get(key) {
      const { rows } = await pool.query<{ content_type: string; bytes: Buffer }>('select content_type, bytes from demo_files where key = $1', [key]);
      const row = rows[0];
      return row ? { contentType: row.content_type, bytes: new Uint8Array(row.bytes) } : null;
    },
    async put(key, file) {
      await pool.query(
        'insert into demo_files (key, content_type, bytes) values ($1, $2, $3) on conflict (key) do update set content_type = excluded.content_type, bytes = excluded.bytes',
        [key, file.contentType, Buffer.from(file.bytes)],
      );
    },
    async delete(key) {
      await pool.query('delete from demo_files where key = $1', [key]);
    },
    async titleForKey(key) {
      const { rows } = await pool.query<{ title: string }>('select title from documents where file_key = $1 limit 1', [key]);
      return rows[0]?.title ?? null;
    },
  };
}
