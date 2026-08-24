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
              -- Normalize CRLF and bare-CR (legacy Mac / Windows / Webflow
              -- exports) to LF before splitting, so no stray \\r ends up
              -- baked into a text node, and a CRLF-only blank line still
              -- correctly counts as blank.
              FROM unnest(string_to_array(regexp_replace(answer, E'\\r\\n?', E'\\n', 'g'), E'\\n')) WITH ORDINALITY AS t(line, line_ord)
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

  -- Recursively concatenates every 'text' node under an arbitrary Lexical
  -- node, regardless of nesting depth — a link's text lives one level
  -- deeper (children[0].text), and a list's text lives inside its
  -- listitem children, not on the list/listitem node itself. A
  -- non-recursive extractor (reading only direct children's 'text' key)
  -- silently drops both entirely, since string_agg ignores the resulting
  -- NULLs with no error.
  CREATE OR REPLACE FUNCTION _migration_faq_lexical_extract_text(node jsonb)
  RETURNS text AS $$
  DECLARE
    child jsonb;
    result text := '';
  BEGIN
    IF node ->> 'type' = 'text' THEN
      RETURN COALESCE(node ->> 'text', '');
    END IF;
    IF node ? 'children' THEN
      FOR child IN SELECT value FROM jsonb_array_elements(node -> 'children')
      LOOP
        result := result || _migration_faq_lexical_extract_text(child);
      END LOOP;
    END IF;
    RETURN result;
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  -- One output line per top-level paragraph, and one line per list item
  -- (list items are the direct children of a 'list' node) — the same
  -- granularity _migration_faq_answer_to_lexical's up() produces lines
  -- at, so a round-trip through up() then down() is stable for plain
  -- multi-paragraph/list content (formatting itself is necessarily lost,
  -- same as before — this only fixes TEXT vanishing, not marks).
  CREATE OR REPLACE FUNCTION _migration_faq_answer_to_text(answer jsonb)
  RETURNS varchar AS $$
  DECLARE
    block jsonb;
    item jsonb;
    lines text[] := ARRAY[]::text[];
  BEGIN
    IF answer IS NULL THEN
      RETURN NULL;
    END IF;
    FOR block IN SELECT value FROM jsonb_array_elements(answer -> 'root' -> 'children')
    LOOP
      IF block ->> 'type' = 'list' THEN
        FOR item IN SELECT value FROM jsonb_array_elements(block -> 'children')
        LOOP
          lines := array_append(lines, _migration_faq_lexical_extract_text(item));
        END LOOP;
      ELSE
        lines := array_append(lines, _migration_faq_lexical_extract_text(block));
      END IF;
    END LOOP;
    RETURN array_to_string(lines, E'\\n');
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;
`;

const DROP_HELPERS = `
  DROP FUNCTION IF EXISTS _migration_faq_answer_to_lexical(varchar);
  DROP FUNCTION IF EXISTS _migration_faq_answer_to_text(jsonb);
  DROP FUNCTION IF EXISTS _migration_faq_lexical_extract_text(jsonb);
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
