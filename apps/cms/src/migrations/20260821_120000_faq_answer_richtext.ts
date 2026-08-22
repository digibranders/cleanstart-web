import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres';

const TABLES = [
  'blogs_faqs',
  'guides_faqs',
  'knowledge_base_faqs',
  '_blogs_v_version_faqs',
  '_guides_v_version_faqs',
  '_knowledge_base_v_version_faqs',
] as const;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    // `to_jsonb(answer)` wraps the existing plain string as a bare JSON
    // string value (not a real Lexical `{root:{...}}` doc) — safe,
    // lossless, and exactly what apps/cms/scripts/backfill-faq-answer-lexical.ts
    // expects to find and convert immediately after this migration runs.
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE jsonb
      USING to_jsonb("answer");
    `));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    // Reverse cast: a jsonb *string* value round-trips cleanly back to
    // varchar via `#>> '{}'`. A real Lexical doc (post-backfill) would
    // NOT round-trip meaningfully — this down() is only safe to run
    // before apps/cms/scripts/backfill-faq-answer-lexical.ts has been
    // executed against the target database.
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE character varying
      USING ("answer" #>> '{}');
    `));
  }
}
