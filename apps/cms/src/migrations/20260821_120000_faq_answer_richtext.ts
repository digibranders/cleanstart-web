import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres';

const TABLES = [
  'blogs_faqs',
  'guides_faqs',
  'knowledge_base_faqs',
  '_blogs_v_version_faqs',
  '_guides_v_version_faqs',
  '_knowledge_base_v_version_faqs',
] as const;

// `ALTER COLUMN ... USING` can't contain a bare subquery, so the
// row->Lexical / Lexical->row conversions live in real (non-temp)
// functions — `db.execute()` calls may not share one pooled connection,
// which session-scoped `pg_temp` functions would require — created
// before the ALTERs and dropped again immediately after.
const CREATE_HELPERS = `
  CREATE OR REPLACE FUNCTION _migration_faq_answer_to_lexical(answer varchar)
  RETURNS jsonb AS $$
    SELECT CASE
      WHEN answer IS NULL THEN NULL
      ELSE jsonb_build_object(
        'root', jsonb_build_object(
          'type', 'root',
          'children', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'type', 'paragraph',
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'text',
                      'text', line,
                      'format', 0,
                      'detail', 0,
                      'mode', 'normal',
                      'style', '',
                      'version', 1
                    )
                  ),
                  'direction', NULL,
                  'format', '',
                  'indent', 0,
                  'version', 1
                )
                ORDER BY line_ord
              )
              FROM unnest(string_to_array(answer, E'\\n')) WITH ORDINALITY AS t(line, line_ord)
              WHERE btrim(line) <> ''
            ),
            jsonb_build_array(
              jsonb_build_object(
                'type', 'paragraph',
                'children', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'text',
                    'text', '',
                    'format', 0,
                    'detail', 0,
                    'mode', 'normal',
                    'style', '',
                    'version', 1
                  )
                ),
                'direction', NULL,
                'format', '',
                'indent', 0,
                'version', 1
              )
            )
          ),
          'direction', NULL,
          'format', '',
          'indent', 0,
          'version', 1
        )
      )
    END;
  $$ LANGUAGE sql IMMUTABLE;

  CREATE OR REPLACE FUNCTION _migration_faq_answer_to_text(answer jsonb)
  RETURNS varchar AS $$
    SELECT CASE
      WHEN answer IS NULL THEN NULL
      ELSE (
        SELECT string_agg(para_text, E'\\n' ORDER BY para_ord)
        FROM (
          SELECT
            para_ord,
            string_agg(node ->> 'text', '' ORDER BY node_ord) AS para_text
          FROM jsonb_array_elements(answer -> 'root' -> 'children') WITH ORDINALITY AS p(para, para_ord)
          CROSS JOIN LATERAL jsonb_array_elements(p.para -> 'children') WITH ORDINALITY AS n(node, node_ord)
          GROUP BY para_ord
        ) paragraphs
      )
    END;
  $$ LANGUAGE sql IMMUTABLE;
`;

const DROP_HELPERS = `
  DROP FUNCTION IF EXISTS _migration_faq_answer_to_lexical(varchar);
  DROP FUNCTION IF EXISTS _migration_faq_answer_to_text(jsonb);
`;

/**
 * Converts `answer` from `varchar` to a real Lexical richText document —
 * one paragraph node per non-blank line, matching the paragraph
 * boundaries the old plain-text FAQ renderers used (`.split("\n")`).
 * NULL stays NULL; an empty/whitespace-only string becomes a single
 * empty paragraph (never zero `root.children`, which crashes Lexical's
 * `setEditorState` on mount).
 *
 * Doing the real conversion here — rather than a bare `to_jsonb(answer)`
 * wrap followed by a separate manually-run backfill script — means
 * every row in every listed table (live AND version-history) is
 * correctly converted atomically, in one deploy, with no intermediate
 * broken state where FAQ answers silently vanish from the site and
 * JSON-LD until a human remembers to run a follow-up script.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(CREATE_HELPERS));
  for (const table of TABLES) {
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE jsonb
      USING _migration_faq_answer_to_lexical("answer");
    `));
  }
  await db.execute(sql.raw(DROP_HELPERS));
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(CREATE_HELPERS));
  for (const table of TABLES) {
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE character varying
      USING _migration_faq_answer_to_text("answer");
    `));
  }
  await db.execute(sql.raw(DROP_HELPERS));
}
